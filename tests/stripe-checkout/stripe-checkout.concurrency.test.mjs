import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import test from "node:test"
import pg from "pg"
import { config, fakeStripe } from "./fixtures.mjs"
import { isPlanCode } from "../../lib/billing/plans.ts"
import { createSubscriptionCheckout } from "../../lib/billing/subscription-checkout.internal.ts"

const connectionString =
  process.env.SUPABASE_TEST_DB_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
const parsed = new URL(connectionString)
if (
  !["postgres:", "postgresql:"].includes(parsed.protocol) ||
  !["127.0.0.1", "localhost", "[::1]", "::1"].includes(parsed.hostname)
)
  throw new Error("Checkout concurrency requires local PostgreSQL")

async function clients(run) {
  const connections = ["checkout-a", "checkout-b", "checkout-observer"].map(
    (application_name) =>
      new pg.Client({
        connectionString,
        application_name,
        connectionTimeoutMillis: 5000,
      })
  )
  const [a, b, observer] = connections
  const org = randomUUID(),
    other = randomUUID()
  try {
    await Promise.all(connections.map((c) => c.connect()))
    await observer.query(
      "insert into public.organizations(id,clerk_organization_id) values ($1,$2),($3,$4)",
      [org, `org_${org}`, other, `org_${other}`]
    )
    await a.query("set role service_role")
    await b.query("set role service_role")
    await run({ a, b, observer, org, other })
  } finally {
    await Promise.allSettled([a.query("rollback"), b.query("rollback")])
    for (const table of [
      "billing_checkout_attempts",
      "billing_subscriptions",
      "billing_customers",
    ]) {
      await observer.query(
        `delete from public.${table} where organization_id=any($1::uuid[])`,
        [[org, other]]
      )
    }
    await observer.query(
      "delete from public.stripe_webhook_events where stripe_event_id=$1",
      [`evt_checkout${org.replaceAll("-", "")}`]
    )
    await observer.query(
      "delete from public.organizations where id=any($1::uuid[])",
      [[org, other]]
    )
    await Promise.allSettled(connections.map((c) => c.end()))
  }
}
const lock = (client, org) =>
  client.query(
    "select pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended($1::text,0))",
    [org]
  )
async function waitBlocked(observer, pid) {
  const deadline = Date.now() + 5000
  while (Date.now() < deadline) {
    const { rows } = await observer.query(
      "select wait_event_type,wait_event from pg_catalog.pg_stat_activity where pid=$1",
      [pid]
    )
    if (
      rows[0]?.wait_event_type === "Lock" &&
      rows[0].wait_event === "advisory"
    )
      return
    await new Promise((resolve) => setTimeout(resolve, 15))
  }
  throw new Error(
    "Checkout contender did not reach the actual advisory-lock barrier"
  )
}
async function race({ a, b, observer, org }, first, second) {
  const pid = (await b.query("select pg_backend_pid() as pid")).rows[0].pid
  await a.query("begin")
  await lock(a, org)
  const pending = second().then(
    (value) => ({ value }),
    (error) => ({ error })
  )
  await waitBlocked(observer, pid)
  const winner = await first()
  await a.query("commit")
  return [winner, await pending]
}
async function claimCustomer(c, org) {
  return (
    await c.query(
      "select to_jsonb(public.claim_billing_customer($1)) as value",
      [org]
    )
  ).rows[0].value
}
async function finalize(c, claim, id) {
  return (
    await c.query(
      "select to_jsonb(public.finalize_billing_customer($1,$2,$3)) as value",
      [claim.organization_id, claim.creation_idempotency_key, id]
    )
  ).rows[0].value
}
async function claim(
  c,
  org,
  customer,
  plan = "essential",
  configuration = config(plan)
) {
  return (
    await c.query(
      "select * from public.claim_billing_checkout_attempt($1,$2,$3,$4,$5,$6,$7,$8)",
      [
        org,
        plan,
        configuration.stripePriceId,
        customer,
        configuration.successUrl,
        configuration.cancelUrl,
        configuration.paymentMethodConfigurationId,
        configuration.livemode,
      ]
    )
  ).rows[0]
}
async function reconcile(c, attempt, id, state = "open") {
  return (
    await c.query(
      "select * from public.reconcile_billing_checkout_attempt($1,$2,$3,$4,$5,$6,$7)",
      [
        attempt.organization_id,
        attempt.id,
        attempt.revision,
        attempt.state,
        attempt.stripe_checkout_session_id,
        id,
        state,
      ]
    )
  ).rows[0]
}
async function ready(c, org) {
  const value = await claimCustomer(c, org)
  return finalize(c, value, `cus_${org.replaceAll("-", "")}`)
}

test("concurrency: Customer claims converge under actual Organization lock", () =>
  clients(async (ctx) => {
    const [first, second] = await race(
      ctx,
      () => claimCustomer(ctx.a, ctx.org),
      () => claimCustomer(ctx.b, ctx.org)
    )
    assert.deepEqual(first, second.value)
    assert.equal(
      (
        await ctx.observer.query(
          "select count(*)::int n from public.billing_customers where organization_id=$1",
          [ctx.org]
        )
      ).rows[0].n,
      1
    )
  }))
test("concurrency: same Customer finalization is idempotent", () =>
  clients(async (ctx) => {
    const value = await claimCustomer(ctx.a, ctx.org)
    const [first, second] = await race(
      ctx,
      () => finalize(ctx.a, value, "cus_checkout"),
      () => finalize(ctx.b, value, "cus_checkout")
    )
    assert.deepEqual(first, second.value)
  }))
test("concurrency: conflicting Customer finalization cannot replace winner", () =>
  clients(async (ctx) => {
    const value = await claimCustomer(ctx.a, ctx.org)
    const [first, second] = await race(
      ctx,
      () => finalize(ctx.a, value, "cus_checkout"),
      () => finalize(ctx.b, value, "cus_other")
    )
    assert.equal(first.stripe_customer_id, "cus_checkout")
    assert.equal(second.error?.code, "22023")
  }))
for (const plan of ["essential", "multi_2"]) {
  test(`concurrency: same Organization competing ${plan} claims`, () =>
    clients(async (ctx) => {
      const customer = await ready(ctx.a, ctx.org)
      const [first, second] = await race(
        ctx,
        () => claim(ctx.a, ctx.org, customer.stripe_customer_id),
        () => claim(ctx.b, ctx.org, customer.stripe_customer_id, plan)
      )
      assert.equal(first.outcome, "attempt")
      assert.equal(
        second.value.outcome,
        plan === "essential" ? "attempt" : "checkout_in_progress"
      )
      assert.equal(first.attempt.id, second.value.attempt.id)
      assert.equal(
        (
          await ctx.observer.query(
            "select count(*)::int n from public.billing_checkout_attempts where organization_id=$1 and ended_at is null",
            [ctx.org]
          )
        ).rows[0].n,
        1
      )
    }))
}
test("concurrency: Session attach converges, newer completion fences stale worker", () =>
  clients(async (ctx) => {
    const customer = await ready(ctx.a, ctx.org)
    const { attempt } = await claim(ctx.a, ctx.org, customer.stripe_customer_id)
    const [first, second] = await race(
      ctx,
      () => reconcile(ctx.a, attempt, "cs_test_checkout"),
      () => reconcile(ctx.b, attempt, "cs_test_checkout")
    )
    assert.deepEqual(first, second.value)
    const complete = await reconcile(
      ctx.a,
      first.attempt,
      "cs_test_checkout",
      "completed"
    )
    const late = await reconcile(
      ctx.b,
      first.attempt,
      "cs_test_checkout",
      "recovery_required"
    )
    assert.equal(late.outcome, "stale")
    assert.equal(late.attempt.revision, complete.attempt.revision)
  }))
test("concurrency: different Organizations remain independent", () =>
  clients(async (ctx) => {
    await ctx.a.query("begin")
    await lock(ctx.a, ctx.org)
    let timer
    try {
      const result = await Promise.race([
        claimCustomer(ctx.b, ctx.other),
        new Promise((_, reject) => {
          timer = setTimeout(
            () => reject(new Error("Other Organization blocked")),
            3000
          )
        }),
      ])
      assert.equal(result.organization_id, ctx.other)
    } finally {
      clearTimeout(timer)
      await ctx.a.query("rollback")
    }
  }))
test("concurrency: completion prevents stale expiration closure and replacement", () =>
  clients(async (ctx) => {
    const customer = await ready(ctx.a, ctx.org)
    const { attempt } = await claim(ctx.a, ctx.org, customer.stripe_customer_id)
    const opened = (await reconcile(ctx.a, attempt, "cs_test_checkout")).attempt
    const [completed, closed] = await race(
      ctx,
      () => reconcile(ctx.a, opened, "cs_test_checkout", "completed"),
      async () =>
        (
          await ctx.b.query(
            "select * from public.end_billing_checkout_attempt($1,$2,$3,'open','cs_test_checkout','expired',false,true)",
            [ctx.org, opened.id, opened.revision]
          )
        ).rows[0]
    )
    assert.equal(completed.attempt.state, "completed")
    assert.equal(closed.value.outcome, "stale")
    assert.equal(
      (await claim(ctx.b, ctx.org, customer.stripe_customer_id, "multi_2"))
        .outcome,
      "checkout_in_progress"
    )
  }))
test("concurrency: webhook projection blocks Checkout using shared Organization serialization", () =>
  clients(async (ctx) => {
    const customer = await ready(ctx.a, ctx.org)
    const [projection, checkout] = await race(
      ctx,
      () =>
        ctx.a.query(
          `select public.apply_stripe_subscription_projection(
    $1,'customer.subscription.created','sub_checkout',false,now(),$2,'sub_checkout','price_essential','essential','active',now()+interval '30 days',false,false) result`,
          [
            `evt_checkout${ctx.org.replaceAll("-", "")}`,
            customer.stripe_customer_id,
          ]
        ),
      () => claim(ctx.b, ctx.org, customer.stripe_customer_id)
    )
    assert.equal(projection.rows[0].result, "applied")
    assert.equal(checkout.value.outcome, "already_subscribed")
  }))

test("concurrency: ended and replaced intent rejects a blocked late worker", () =>
  clients(async (ctx) => {
    const customer = await ready(ctx.a, ctx.org)
    const { attempt } = await claim(ctx.a, ctx.org, customer.stripe_customer_id)
    const opened = (await reconcile(ctx.a, attempt, "cs_test_old")).attempt
    const [replacement, late] = await race(
      ctx,
      async () => {
        const closed = await ctx.a.query(
          "select * from public.end_billing_checkout_attempt($1,$2,$3,'open','cs_test_old','expired',false,true)",
          [ctx.org, opened.id, opened.revision]
        )
        assert.equal(closed.rows[0].attempt.state, "ended")
        return claim(ctx.a, ctx.org, customer.stripe_customer_id, "multi_2")
      },
      () => reconcile(ctx.b, opened, "cs_test_old", "completed")
    )
    assert.equal(late.value.outcome, "stale")
    assert.notEqual(replacement.attempt.id, opened.id)
    const { rows } = await ctx.observer.query(
      "select id,state,stripe_checkout_session_id from public.billing_checkout_attempts where organization_id=$1 order by created_at",
      [ctx.org]
    )
    assert.deepEqual(rows, [
      {
        id: opened.id,
        state: "ended",
        stripe_checkout_session_id: "cs_test_old",
      },
      {
        id: replacement.attempt.id,
        state: "creating",
        stripe_checkout_session_id: null,
      },
    ])
  }))

function realRepository(client, org) {
  return {
    findOrganization: async () => org,
    readSubscription: async () =>
      (
        await client.query(
          "select stripe_subscription_id,status,collection_paused,plan_code,stripe_price_id from public.billing_subscriptions where organization_id=$1",
          [org]
        )
      ).rows[0] ?? null,
    readAttempt: async () =>
      (
        await client.query(
          "select to_jsonb(a) value from public.billing_checkout_attempts a where organization_id=$1 and ended_at is null",
          [org]
        )
      ).rows[0]?.value ?? null,
    claimCustomer: () => claimCustomer(client, org),
    finalizeCustomer: (value, id) => finalize(client, value, id),
    claimAttempt: (organization, customer, plan, configuration) =>
      claim(client, organization, customer, plan, configuration),
    reconcile: (attempt, id, state) => reconcile(client, attempt, id, state),
    endAttempt: async () => {
      throw new Error("Unexpected closure in concurrency scenario")
    },
  }
}
for (const loss of [null, "customers.create", "checkout.sessions.create"]) {
  test(`concurrency: real DB saga and Stripe fake with response loss ${loss}`, () =>
    clients(async (ctx) => {
      const stripe = fakeStripe()
      stripe.state.loss = loss
      const dependencies = (client) => ({
        getAuth: async () => ({
          userId: "user_local",
          orgId: "org_local",
          isAdmin: true,
        }),
        isPlanCode,
        getConfiguration: config,
        repository: realRepository(client, ctx.org),
        stripe: stripe.provider,
        now: Date.now,
      })
      const a = createSubscriptionCheckout(dependencies(ctx.a)),
        b = createSubscriptionCheckout(dependencies(ctx.b))
      const results = await Promise.allSettled([a("essential"), b("essential")])
      assert.ok(
        results.some(
          (r) => r.status === "fulfilled" && r.value.status === "checkout_ready"
        )
      )
      assert.equal((await a("essential")).status, "checkout_ready")
      assert.equal(stripe.state.customers.size, 1)
      assert.equal(stripe.state.sessions.size, 1)
      const { rows } = await ctx.observer.query(
        "select c.provisioning_status,a.stripe_checkout_session_id from public.billing_customers c join public.billing_checkout_attempts a using(organization_id) where organization_id=$1",
        [ctx.org]
      )
      assert.equal(rows.length, 1)
      assert.equal(rows[0].provisioning_status, "ready")
      assert.ok(rows[0].stripe_checkout_session_id)
    }))
}

test("concurrency: rolled-back Session attachment is recovered by a blocked caller", () =>
  clients(async (ctx) => {
    const stripe = fakeStripe()
    let signalAttached, releaseRollback
    const attached = new Promise((resolve) => {
      signalAttached = resolve
    })
    const release = new Promise((resolve) => {
      releaseRollback = resolve
    })
    const repository = realRepository(ctx.a, ctx.org)
    repository.reconcile = async (attempt, id, state) => {
      await ctx.a.query("begin")
      await reconcile(ctx.a, attempt, id, state)
      signalAttached()
      await release
      await ctx.a.query("rollback")
      throw new Error("Synthetic lost persistence")
    }
    const dependencies = (repo) => ({
      getAuth: async () => ({
        userId: "user_local",
        orgId: "org_local",
        isAdmin: true,
      }),
      isPlanCode,
      getConfiguration: config,
      repository: repo,
      stripe: stripe.provider,
      now: Date.now,
    })
    const a = createSubscriptionCheckout(dependencies(repository))
    const b = createSubscriptionCheckout(
      dependencies(realRepository(ctx.b, ctx.org))
    )
    const failed = assert.rejects(a("essential"), {
      name: "StripeCheckoutError",
    })
    await attached
    const pid = (await ctx.b.query("select pg_backend_pid() pid")).rows[0].pid
    const recovered = b("essential")
    try {
      await waitBlocked(ctx.observer, pid)
    } finally {
      releaseRollback()
    }
    await failed
    assert.equal((await recovered).status, "checkout_ready")
    assert.equal(stripe.state.customers.size, 1)
    assert.equal(stripe.state.sessions.size, 1)
    const { rows } = await ctx.observer.query(
      "select state,stripe_checkout_session_id from public.billing_checkout_attempts where organization_id=$1 and ended_at is null",
      [ctx.org]
    )
    assert.equal(rows.length, 1)
    assert.equal(rows[0].state, "open")
    assert.equal(
      rows[0].stripe_checkout_session_id,
      [...stripe.state.sessions.keys()][0]
    )
  }))
