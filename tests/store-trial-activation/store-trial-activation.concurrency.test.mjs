import assert from "node:assert/strict"
import test from "node:test"

import pg from "pg"

const { Client } = pg

const DEFAULT_LOCAL_DATABASE_URL =
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
const connectionString =
  process.env.SUPABASE_TEST_DB_URL ?? DEFAULT_LOCAL_DATABASE_URL
const parsedConnection = new URL(connectionString)
const localHosts = new Set(["127.0.0.1", "localhost", "[::1]", "::1"])

if (
  !["postgres:", "postgresql:"].includes(parsedConnection.protocol) ||
  !localHosts.has(parsedConnection.hostname)
) {
  throw new Error(
    "Store trial concurrency tests require a local PostgreSQL connection"
  )
}

function createClient(applicationName) {
  return new Client({
    connectionString,
    application_name: applicationName,
    connectionTimeoutMillis: 5_000,
  })
}

async function cleanupFixtures(client, organizationIds) {
  await client.query(
    `delete from public.billing_trial_grants
     where organization_id = any($1::uuid[])`,
    [organizationIds]
  )
  await client.query(
    `delete from public.billing_subscriptions
     where organization_id = any($1::uuid[])`,
    [organizationIds]
  )
  await client.query(
    `delete from public.billing_customers
     where organization_id = any($1::uuid[])`,
    [organizationIds]
  )
  await client.query(
    `delete from public.stores
     where organization_id = any($1::uuid[])`,
    [organizationIds]
  )
  await client.query(
    `delete from public.organizations
     where id = any($1::uuid[])`,
    [organizationIds]
  )
}

async function rollbackQuietly(client) {
  try {
    await client.query("rollback")
  } catch {
    // The connection may already be outside a transaction.
  }
}

async function withLocalClients(organizationIds, run) {
  const clientA = createClient("store-trial-concurrency-a")
  const clientB = createClient("store-trial-concurrency-b")
  const observer = createClient("store-trial-concurrency-observer")

  await Promise.all([clientA.connect(), clientB.connect(), observer.connect()])

  try {
    await cleanupFixtures(observer, organizationIds)
    await run({ clientA, clientB, observer })
  } finally {
    await Promise.all([rollbackQuietly(clientA), rollbackQuietly(clientB)])
    await cleanupFixtures(observer, organizationIds)
    await Promise.allSettled([clientA.end(), clientB.end(), observer.end()])
  }
}

function claims(userId, clerkOrganizationId) {
  return JSON.stringify({
    sub: userId,
    o: { id: clerkOrganizationId, rol: "admin" },
  })
}

async function beginAuthenticated(client, jwtClaims) {
  await client.query("begin")
  await client.query(
    "select pg_catalog.set_config('request.jwt.claims', $1, true)",
    [jwtClaims]
  )
  await client.query("set local role authenticated")
}

async function acquireOrganizationLock(client, organizationId) {
  await client.query(
    `select pg_catalog.pg_advisory_xact_lock(
       pg_catalog.hashtextextended($1::text, 0)
     )`,
    [organizationId]
  )
}

async function acquireClerkUserLock(client, clerkUserId) {
  await client.query(
    `select pg_catalog.pg_advisory_xact_lock(
       pg_catalog.hashtext('deliplus:initial-trial-user'),
       pg_catalog.hashtext($1)
     )`,
    [clerkUserId]
  )
}

async function invokeActivation(client, storeId) {
  const result = await client.query(
    `select outcome, trial_ends_at
     from public.activate_first_store_with_initial_trial($1::uuid)`,
    [storeId]
  )

  assert.equal(result.rows.length, 1)
  return result.rows[0]
}

async function waitForAdvisoryWait(observer, backendPid) {
  const deadline = Date.now() + 5_000

  while (Date.now() < deadline) {
    const result = await observer.query(
      `select wait_event_type, wait_event
       from pg_catalog.pg_stat_activity
       where pid = $1`,
      [backendPid]
    )
    const state = result.rows[0]

    if (state?.wait_event_type === "Lock" && state.wait_event === "advisory") {
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 20))
  }

  throw new Error("Concurrent RPC did not reach the expected advisory lock")
}

async function backendPid(client) {
  const result = await client.query("select pg_catalog.pg_backend_pid() as pid")
  return result.rows[0].pid
}

async function insertOrganizationAndStores(
  client,
  { organizationId, clerkOrganizationId, stores }
) {
  await client.query(
    `insert into public.organizations (id, clerk_organization_id)
     values ($1::uuid, $2)`,
    [organizationId, clerkOrganizationId]
  )

  for (const store of stores) {
    await client.query(
      `insert into public.stores (id, organization_id, name, slug)
       values ($1::uuid, $2::uuid, $3, $4)`,
      [store.id, organizationId, store.name, store.slug]
    )
  }

  await client.query(
    `update public.stores
     set status = 'ready'
     where organization_id = $1::uuid`,
    [organizationId]
  )
}

test(
  "same Store race converges to activated and already_activated",
  { timeout: 20_000 },
  async () => {
    const organizationId = "81000000-0000-0000-0000-000000000001"
    const clerkOrganizationId = "trial_concurrency_same_store"
    const storeId = "82000000-0000-0000-0000-000000000001"
    const userId = "trial_concurrency_same_store_user"

    await withLocalClients(
      [organizationId],
      async ({ clientA, clientB, observer }) => {
        await insertOrganizationAndStores(observer, {
          organizationId,
          clerkOrganizationId,
          stores: [
            {
              id: storeId,
              name: "Concurrency Same Store",
              slug: "concurrency-same-store",
            },
          ],
        })

        await beginAuthenticated(clientA, claims(userId, clerkOrganizationId))
        await acquireOrganizationLock(clientA, organizationId)

        await beginAuthenticated(clientB, claims(userId, clerkOrganizationId))
        const clientBPid = await backendPid(clientB)
        const resultBPromise = invokeActivation(clientB, storeId)

        await waitForAdvisoryWait(observer, clientBPid)
        const resultA = await invokeActivation(clientA, storeId)
        await clientA.query("commit")

        const resultB = await resultBPromise
        await clientB.query("commit")

        assert.equal(resultA.outcome, "activated")
        assert.equal(resultB.outcome, "already_activated")
        assert.equal(
          resultA.trial_ends_at.getTime(),
          resultB.trial_ends_at.getTime()
        )

        const facts = await observer.query(
          `select
             store.status,
             store.activated_at,
             trial.starts_at,
             trial.ends_at,
             pg_catalog.count(*) over ()::integer as grant_count
           from public.stores as store
           join public.billing_trial_grants as trial
             on trial.organization_id = store.organization_id
            and trial.grant_kind = 'initial'
           where store.id = $1::uuid`,
          [storeId]
        )

        assert.equal(facts.rows.length, 1)
        assert.equal(facts.rows[0].status, "active")
        assert.equal(facts.rows[0].grant_count, 1)
        assert.equal(
          facts.rows[0].activated_at.getTime(),
          facts.rows[0].starts_at.getTime()
        )
        assert.equal(
          facts.rows[0].ends_at.getTime(),
          resultA.trial_ends_at.getTime()
        )
      }
    )
  }
)

test(
  "two ready Stores in one Organization serialize to one activation",
  { timeout: 20_000 },
  async () => {
    const organizationId = "81000000-0000-0000-0000-000000000002"
    const clerkOrganizationId = "trial_concurrency_two_stores"
    const storeAId = "82000000-0000-0000-0000-000000000002"
    const storeBId = "82000000-0000-0000-0000-000000000003"
    const userId = "trial_concurrency_two_stores_user"

    await withLocalClients(
      [organizationId],
      async ({ clientA, clientB, observer }) => {
        await insertOrganizationAndStores(observer, {
          organizationId,
          clerkOrganizationId,
          stores: [
            {
              id: storeAId,
              name: "Concurrency Store A",
              slug: "concurrency-store-a",
            },
            {
              id: storeBId,
              name: "Concurrency Store B",
              slug: "concurrency-store-b",
            },
          ],
        })

        await beginAuthenticated(clientA, claims(userId, clerkOrganizationId))
        await acquireOrganizationLock(clientA, organizationId)

        await beginAuthenticated(clientB, claims(userId, clerkOrganizationId))
        const clientBPid = await backendPid(clientB)
        const resultBPromise = invokeActivation(clientB, storeBId)

        await waitForAdvisoryWait(observer, clientBPid)
        const resultA = await invokeActivation(clientA, storeAId)
        await clientA.query("commit")

        const resultB = await resultBPromise
        await clientB.query("commit")

        assert.equal(resultA.outcome, "activated")
        assert.equal(resultB.outcome, "trial_not_eligible")
        assert.equal(resultB.trial_ends_at, null)

        const stores = await observer.query(
          `select id, status, activated_at
           from public.stores
           where organization_id = $1::uuid
           order by id`,
          [organizationId]
        )
        const grants = await observer.query(
          `select pg_catalog.count(*)::integer as count
           from public.billing_trial_grants
           where organization_id = $1::uuid
             and grant_kind = 'initial'`,
          [organizationId]
        )

        assert.deepEqual(
          stores.rows.map(({ id, status, activated_at: activatedAt }) => ({
            id,
            status,
            activatedAt: activatedAt === null ? null : "set",
          })),
          [
            { id: storeAId, status: "active", activatedAt: "set" },
            { id: storeBId, status: "ready", activatedAt: null },
          ]
        )
        assert.equal(grants.rows[0].count, 1)
      }
    )
  }
)

test(
  "same Clerk User across two Organizations receives only one initial trial",
  { timeout: 20_000 },
  async () => {
    const organizationAId = "81000000-0000-0000-0000-000000000003"
    const organizationBId = "81000000-0000-0000-0000-000000000004"
    const clerkOrganizationAId = "trial_concurrency_user_org_a"
    const clerkOrganizationBId = "trial_concurrency_user_org_b"
    const storeAId = "82000000-0000-0000-0000-000000000004"
    const storeBId = "82000000-0000-0000-0000-000000000005"
    const userId = "trial_concurrency_cross_org_user"

    await withLocalClients(
      [organizationAId, organizationBId],
      async ({ clientA, clientB, observer }) => {
        await insertOrganizationAndStores(observer, {
          organizationId: organizationAId,
          clerkOrganizationId: clerkOrganizationAId,
          stores: [
            {
              id: storeAId,
              name: "Cross Organization A",
              slug: "cross-organization-a",
            },
          ],
        })
        await insertOrganizationAndStores(observer, {
          organizationId: organizationBId,
          clerkOrganizationId: clerkOrganizationBId,
          stores: [
            {
              id: storeBId,
              name: "Cross Organization B",
              slug: "cross-organization-b",
            },
          ],
        })

        await beginAuthenticated(clientA, claims(userId, clerkOrganizationAId))
        await acquireOrganizationLock(clientA, organizationAId)
        await acquireClerkUserLock(clientA, userId)

        await beginAuthenticated(clientB, claims(userId, clerkOrganizationBId))
        const clientBPid = await backendPid(clientB)
        const resultBPromise = invokeActivation(clientB, storeBId)

        await waitForAdvisoryWait(observer, clientBPid)
        const resultA = await invokeActivation(clientA, storeAId)
        await clientA.query("commit")

        const resultB = await resultBPromise
        await clientB.query("commit")

        assert.equal(resultA.outcome, "activated")
        assert.equal(resultB.outcome, "trial_not_eligible")

        const facts = await observer.query(
          `select organization_id, clerk_user_id
           from public.billing_trial_grants
           where clerk_user_id = $1
             and grant_kind = 'initial'`,
          [userId]
        )
        const stores = await observer.query(
          `select id, status, activated_at
           from public.stores
           where organization_id = any($1::uuid[])
           order by id`,
          [[organizationAId, organizationBId]]
        )

        assert.deepEqual(facts.rows, [
          { organization_id: organizationAId, clerk_user_id: userId },
        ])
        assert.deepEqual(
          stores.rows.map(({ id, status, activated_at: activatedAt }) => ({
            id,
            status,
            activatedAt: activatedAt === null ? null : "set",
          })),
          [
            { id: storeAId, status: "active", activatedAt: "set" },
            { id: storeBId, status: "ready", activatedAt: null },
          ]
        )
      }
    )
  }
)
