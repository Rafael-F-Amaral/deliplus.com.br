import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import test from "node:test"
import pg from "pg"

const connectionString =
  process.env.SUPABASE_TEST_DB_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
const parsed = new URL(connectionString)
if (!["127.0.0.1", "localhost", "[::1]", "::1"].includes(parsed.hostname))
  throw new Error(
    "Subscription-management concurrency requires local PostgreSQL"
  )

test("two tabs converge on one durable Organization attempt", async () => {
  const clients = ["change-a", "change-b", "change-cleanup"].map(
    (application_name) => new pg.Client({ connectionString, application_name })
  )
  const [a, b, cleanup] = clients
  const org = randomUUID()
  try {
    await Promise.all(clients.map((client) => client.connect()))
    await cleanup.query(
      "insert into public.organizations(id,clerk_organization_id) values($1,$2)",
      [org, `org_${org}`]
    )
    await cleanup.query(
      "insert into public.billing_customers(organization_id,stripe_customer_id,provisioning_status,creation_idempotency_key,created_at,updated_at) values($1,'cus_concurrency','ready',$2,now(),now())",
      [org, `deli-plus:customer:v1:${randomUUID()}`]
    )
    await cleanup.query(
      "insert into public.billing_subscriptions(organization_id,stripe_subscription_id,stripe_price_id,plan_code,status,current_period_end,last_synced_at) values($1,'sub_concurrency','price_trio','multi_3','active','2026-10-12T00:00:00Z',now())",
      [org]
    )
    await Promise.all([
      a.query("set role service_role"),
      b.query("set role service_role"),
    ])
    const claim = (client, target, price) =>
      client.query(
        "select * from public.claim_billing_subscription_change($1,'schedule_downgrade','multi_3',$2,'price_trio',$3,'sub_concurrency',null,'2026-10-12T00:00:00Z',false)",
        [org, target, price]
      )
    const [first, second] = await Promise.all([
      claim(a, "essential", "price_essential"),
      claim(b, "essential", "price_essential"),
    ])
    assert.equal(first.rows[0].outcome, "attempt")
    assert.equal(second.rows[0].outcome, "attempt")
    assert.equal(first.rows[0].attempt.id, second.rows[0].attempt.id)
    const conflict = await claim(b, "multi_2", "price_duo")
    assert.equal(conflict.rows[0].outcome, "plan_change_in_progress")
    const count = await cleanup.query(
      "select count(*)::int count from public.billing_subscription_change_attempts where organization_id=$1 and ended_at is null",
      [org]
    )
    assert.equal(count.rows[0].count, 1)
  } finally {
    await Promise.allSettled([a.query("rollback"), b.query("rollback")])
    await cleanup
      .query(
        "delete from public.billing_subscription_change_attempts where organization_id=$1",
        [org]
      )
      .catch(() => undefined)
    await cleanup
      .query(
        "delete from public.billing_subscriptions where organization_id=$1",
        [org]
      )
      .catch(() => undefined)
    await cleanup
      .query("delete from public.billing_customers where organization_id=$1", [
        org,
      ])
      .catch(() => undefined)
    await cleanup
      .query("delete from public.organizations where id=$1", [org])
      .catch(() => undefined)
    await Promise.allSettled(clients.map((client) => client.end()))
  }
})
