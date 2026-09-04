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
    "Store entitlement concurrency tests require a local PostgreSQL connection"
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
    `delete from public.stripe_webhook_events
     where stripe_event_id like 'evt_store_entitlement_concurrency_%'`
  )
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
  const clientA = createClient("store-entitlement-concurrency-a")
  const clientB = createClient("store-entitlement-concurrency-b")
  const observer = createClient("store-entitlement-concurrency-observer")

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

async function backendPid(client) {
  const result = await client.query("select pg_catalog.pg_backend_pid() as pid")
  return result.rows[0].pid
}

async function waitForAdvisoryWait(observer, backendPidValue) {
  const deadline = Date.now() + 5_000

  while (Date.now() < deadline) {
    const result = await observer.query(
      `select wait_event_type, wait_event
       from pg_catalog.pg_stat_activity
       where pid = $1`,
      [backendPidValue]
    )
    const state = result.rows[0]

    if (state?.wait_event_type === "Lock" && state.wait_event === "advisory") {
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 20))
  }

  throw new Error("Concurrent RPC did not reach the Organization advisory lock")
}

async function resolveBeforeTimeout(promise, timeoutMillis) {
  let timeoutId

  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error("Independent Organization was blocked")),
          timeoutMillis
        )
      }),
    ])
  } finally {
    clearTimeout(timeoutId)
  }
}

async function invokeActivation(client, storeId) {
  const result = await client.query(
    `select outcome
     from public.activate_store_within_entitlement($1::uuid)`,
    [storeId]
  )

  assert.equal(result.rows.length, 1)
  return result.rows[0].outcome
}

async function invokeDeactivation(client, storeId) {
  const result = await client.query(
    `select outcome
     from public.deactivate_store($1::uuid)`,
    [storeId]
  )

  assert.equal(result.rows.length, 1)
  return result.rows[0].outcome
}

async function invokeInitialTrialActivation(client, storeId) {
  const result = await client.query(
    `select outcome
     from public.activate_first_store_with_initial_trial($1::uuid)`,
    [storeId]
  )

  assert.equal(result.rows.length, 1)
  return result.rows[0].outcome
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

    if (store.status !== "draft") {
      await client.query(
        `update public.stores
         set status = 'ready'
         where id = $1::uuid`,
        [store.id]
      )
    }

    if (store.status === "active" || store.status === "inactive") {
      await client.query(
        `update public.stores
         set status = 'active', activated_at = pg_catalog.now() - interval '1 day'
         where id = $1::uuid`,
        [store.id]
      )
    }

    if (store.status === "inactive") {
      await client.query(
        `update public.stores
         set status = 'inactive'
         where id = $1::uuid`,
        [store.id]
      )
    }
  }
}

async function insertLocalGrant(client, organizationId, planCode) {
  await client.query(
    `insert into public.billing_trial_grants (
       organization_id,
       clerk_user_id,
       grant_kind,
       plan_code,
       starts_at,
       ends_at
     )
     values (
       $1::uuid,
       $2,
       'manual_override',
       $3,
       pg_catalog.now() - interval '1 day',
       pg_catalog.now() + interval '30 days'
     )`,
    [organizationId, `concurrency_${organizationId}`, planCode]
  )
}

test(
  "concurrent activation of the last multi_2 slot permits exactly one Store",
  { timeout: 20_000 },
  async () => {
    const organizationId = "b1000000-0000-0000-0000-000000000001"
    const clerkOrganizationId = "store_entitlement_last_slot"
    const activeStoreId = "b2000000-0000-0000-0000-000000000001"
    const storeAId = "b2000000-0000-0000-0000-000000000002"
    const storeBId = "b2000000-0000-0000-0000-000000000003"
    const jwtClaims = claims(
      "store_entitlement_last_slot_user",
      clerkOrganizationId
    )

    await withLocalClients(
      [organizationId],
      async ({ clientA, clientB, observer }) => {
        await insertOrganizationAndStores(observer, {
          organizationId,
          clerkOrganizationId,
          stores: [
            {
              id: activeStoreId,
              name: "Last Slot Active",
              slug: "last-slot-active",
              status: "active",
            },
            {
              id: storeAId,
              name: "Last Slot A",
              slug: "last-slot-a",
              status: "ready",
            },
            {
              id: storeBId,
              name: "Last Slot B",
              slug: "last-slot-b",
              status: "ready",
            },
          ],
        })
        await insertLocalGrant(observer, organizationId, "multi_2")

        await beginAuthenticated(clientA, jwtClaims)
        await acquireOrganizationLock(clientA, organizationId)

        await beginAuthenticated(clientB, jwtClaims)
        const clientBPid = await backendPid(clientB)
        const resultBPromise = invokeActivation(clientB, storeBId)

        await waitForAdvisoryWait(observer, clientBPid)
        const resultA = await invokeActivation(clientA, storeAId)
        await clientA.query("commit")

        const resultB = await resultBPromise
        await clientB.query("commit")

        assert.equal(resultA, "activated")
        assert.equal(resultB, "capacity_reached")

        const finalState = await observer.query(
          `select id, status
           from public.stores
           where organization_id = $1::uuid
           order by id`,
          [organizationId]
        )

        assert.equal(
          finalState.rows.filter(({ status }) => status === "active").length,
          2
        )
        assert.deepEqual(finalState.rows, [
          { id: activeStoreId, status: "active" },
          { id: storeAId, status: "active" },
          { id: storeBId, status: "ready" },
        ])
      }
    )
  }
)

test(
  "two concurrent activations of the same Store converge idempotently",
  { timeout: 20_000 },
  async () => {
    const organizationId = "b1000000-0000-0000-0000-000000000002"
    const clerkOrganizationId = "store_entitlement_same_store"
    const storeId = "b2000000-0000-0000-0000-000000000004"
    const jwtClaims = claims(
      "store_entitlement_same_store_user",
      clerkOrganizationId
    )

    await withLocalClients(
      [organizationId],
      async ({ clientA, clientB, observer }) => {
        await insertOrganizationAndStores(observer, {
          organizationId,
          clerkOrganizationId,
          stores: [
            {
              id: storeId,
              name: "Same Store",
              slug: "same-store-entitlement",
              status: "ready",
            },
          ],
        })
        await insertLocalGrant(observer, organizationId, "essential")

        await beginAuthenticated(clientA, jwtClaims)
        await acquireOrganizationLock(clientA, organizationId)

        await beginAuthenticated(clientB, jwtClaims)
        const clientBPid = await backendPid(clientB)
        const resultBPromise = invokeActivation(clientB, storeId)

        await waitForAdvisoryWait(observer, clientBPid)
        const resultA = await invokeActivation(clientA, storeId)
        await clientA.query("commit")

        const resultB = await resultBPromise
        await clientB.query("commit")

        assert.equal(resultA, "activated")
        assert.equal(resultB, "already_active")

        const finalState = await observer.query(
          `select status, activated_at
           from public.stores
           where id = $1::uuid`,
          [storeId]
        )

        assert.equal(finalState.rows[0].status, "active")
        assert.ok(finalState.rows[0].activated_at instanceof Date)
      }
    )
  }
)

test(
  "activation serializes after deactivation and observes the freed slot",
  { timeout: 20_000 },
  async () => {
    const organizationId = "b1000000-0000-0000-0000-000000000003"
    const clerkOrganizationId = "store_entitlement_activate_deactivate"
    const activeStoreId = "b2000000-0000-0000-0000-000000000005"
    const readyStoreId = "b2000000-0000-0000-0000-000000000006"
    const jwtClaims = claims(
      "store_entitlement_activate_deactivate_user",
      clerkOrganizationId
    )

    await withLocalClients(
      [organizationId],
      async ({ clientA, clientB, observer }) => {
        await insertOrganizationAndStores(observer, {
          organizationId,
          clerkOrganizationId,
          stores: [
            {
              id: activeStoreId,
              name: "Deactivate First",
              slug: "deactivate-first",
              status: "active",
            },
            {
              id: readyStoreId,
              name: "Activate Second",
              slug: "activate-second",
              status: "ready",
            },
          ],
        })
        await insertLocalGrant(observer, organizationId, "essential")

        await beginAuthenticated(clientA, jwtClaims)
        await acquireOrganizationLock(clientA, organizationId)

        await beginAuthenticated(clientB, jwtClaims)
        const clientBPid = await backendPid(clientB)
        const activationPromise = invokeActivation(clientB, readyStoreId)

        await waitForAdvisoryWait(observer, clientBPid)
        const deactivationResult = await invokeDeactivation(
          clientA,
          activeStoreId
        )
        await clientA.query("commit")

        const activationResult = await activationPromise
        await clientB.query("commit")

        assert.equal(deactivationResult, "deactivated")
        assert.equal(activationResult, "activated")

        const finalState = await observer.query(
          `select id, status
           from public.stores
           where organization_id = $1::uuid
           order by id`,
          [organizationId]
        )

        assert.deepEqual(finalState.rows, [
          { id: activeStoreId, status: "inactive" },
          { id: readyStoreId, status: "active" },
        ])
      }
    )
  }
)

test(
  "initial-trial activation and generic activation share one Organization lock",
  { timeout: 20_000 },
  async () => {
    const organizationId = "b1000000-0000-0000-0000-000000000004"
    const clerkOrganizationId = "store_entitlement_trial_generic"
    const trialStoreId = "b2000000-0000-0000-0000-000000000007"
    const genericStoreId = "b2000000-0000-0000-0000-000000000008"
    const userId = "store_entitlement_trial_generic_user"
    const jwtClaims = claims(userId, clerkOrganizationId)

    await withLocalClients(
      [organizationId],
      async ({ clientA, clientB, observer }) => {
        await insertOrganizationAndStores(observer, {
          organizationId,
          clerkOrganizationId,
          stores: [
            {
              id: trialStoreId,
              name: "Trial Winner",
              slug: "trial-generic-winner",
              status: "ready",
            },
            {
              id: genericStoreId,
              name: "Generic Waiter",
              slug: "trial-generic-waiter",
              status: "ready",
            },
          ],
        })

        await beginAuthenticated(clientA, jwtClaims)
        await acquireOrganizationLock(clientA, organizationId)

        await beginAuthenticated(clientB, jwtClaims)
        const clientBPid = await backendPid(clientB)
        const genericPromise = invokeActivation(clientB, genericStoreId)

        await waitForAdvisoryWait(observer, clientBPid)
        const trialResult = await invokeInitialTrialActivation(
          clientA,
          trialStoreId
        )
        await clientA.query("commit")

        const genericResult = await genericPromise
        await clientB.query("commit")

        assert.equal(trialResult, "activated")
        assert.equal(genericResult, "capacity_reached")

        const finalState = await observer.query(
          `select
             (select pg_catalog.count(*)::integer
              from public.billing_trial_grants
              where organization_id = $1::uuid
                and grant_kind = 'initial') as grant_count,
             (select pg_catalog.count(*)::integer
              from public.stores
              where organization_id = $1::uuid
                and status = 'active') as active_count`,
          [organizationId]
        )

        assert.deepEqual(finalState.rows[0], {
          grant_count: 1,
          active_count: 1,
        })
      }
    )
  }
)

test(
  "activation waits for the billing projection writer and resolves the committed entitlement",
  { timeout: 20_000 },
  async () => {
    const organizationId = "b1000000-0000-0000-0000-000000000005"
    const clerkOrganizationId = "store_entitlement_billing_writer"
    const storeId = "b2000000-0000-0000-0000-000000000009"
    const jwtClaims = claims(
      "store_entitlement_billing_writer_user",
      clerkOrganizationId
    )

    await withLocalClients(
      [organizationId],
      async ({ clientA, clientB, observer }) => {
        await insertOrganizationAndStores(observer, {
          organizationId,
          clerkOrganizationId,
          stores: [
            {
              id: storeId,
              name: "Billing Writer Target",
              slug: "billing-writer-target",
              status: "ready",
            },
          ],
        })
        await observer.query(
          `insert into public.billing_customers (
             organization_id,
             stripe_customer_id,
             provisioning_status,
             creation_idempotency_key
           )
           values ($1::uuid, $2, 'ready', $3)`,
          [
            organizationId,
            "cus_store_entitlement_concurrency",
            "idem_store_entitlement_concurrency",
          ]
        )

        await clientA.query("begin")
        await acquireOrganizationLock(clientA, organizationId)
        await clientA.query("set local role service_role")

        await beginAuthenticated(clientB, jwtClaims)
        const clientBPid = await backendPid(clientB)
        const activationPromise = invokeActivation(clientB, storeId)

        await waitForAdvisoryWait(observer, clientBPid)

        const projection = await clientA.query(
          `select public.apply_stripe_subscription_projection(
             $1,
             'customer.subscription.updated',
             $2,
             false,
             pg_catalog.now(),
             $3,
             $2,
             $4,
             'essential',
             'active',
             pg_catalog.now() + interval '30 days',
             false,
             false
           ) as outcome`,
          [
            "evt_store_entitlement_concurrency_billing_writer",
            "sub_store_entitlement_concurrency",
            "cus_store_entitlement_concurrency",
            "price_store_entitlement_concurrency",
          ]
        )

        assert.equal(projection.rows[0].outcome, "applied")
        await clientA.query("commit")

        const activationResult = await activationPromise
        await clientB.query("commit")

        assert.equal(activationResult, "activated")

        const finalState = await observer.query(
          `select
             store.status,
             subscription.status as subscription_status,
             subscription.plan_code
           from public.stores as store
           join public.billing_subscriptions as subscription
             on subscription.organization_id = store.organization_id
           where store.id = $1::uuid`,
          [storeId]
        )

        assert.deepEqual(finalState.rows[0], {
          status: "active",
          subscription_status: "active",
          plan_code: "essential",
        })
      }
    )
  }
)

test(
  "different Organizations do not share the same intended advisory lock",
  { timeout: 20_000 },
  async () => {
    const organizationAId = "b1000000-0000-0000-0000-000000000006"
    const organizationBId = "b1000000-0000-0000-0000-000000000007"
    const clerkOrganizationAId = "store_entitlement_independent_a"
    const clerkOrganizationBId = "store_entitlement_independent_b"
    const storeAId = "b2000000-0000-0000-0000-00000000000a"
    const storeBId = "b2000000-0000-0000-0000-00000000000b"

    await withLocalClients(
      [organizationAId, organizationBId],
      async ({ clientA, clientB, observer }) => {
        await insertOrganizationAndStores(observer, {
          organizationId: organizationAId,
          clerkOrganizationId: clerkOrganizationAId,
          stores: [
            {
              id: storeAId,
              name: "Independent A",
              slug: "independent-entitlement-a",
              status: "ready",
            },
          ],
        })
        await insertOrganizationAndStores(observer, {
          organizationId: organizationBId,
          clerkOrganizationId: clerkOrganizationBId,
          stores: [
            {
              id: storeBId,
              name: "Independent B",
              slug: "independent-entitlement-b",
              status: "ready",
            },
          ],
        })
        await insertLocalGrant(observer, organizationAId, "essential")
        await insertLocalGrant(observer, organizationBId, "essential")

        await beginAuthenticated(
          clientA,
          claims("store_entitlement_independent_user_a", clerkOrganizationAId)
        )
        await acquireOrganizationLock(clientA, organizationAId)

        await beginAuthenticated(
          clientB,
          claims("store_entitlement_independent_user_b", clerkOrganizationBId)
        )

        const independentResult = await resolveBeforeTimeout(
          invokeActivation(clientB, storeBId),
          5_000
        )

        assert.equal(independentResult, "activated")
        await clientB.query("commit")
        await clientA.query("commit")

        const finalState = await observer.query(
          `select status
           from public.stores
           where id = $1::uuid`,
          [storeBId]
        )

        assert.equal(finalState.rows[0].status, "active")
      }
    )
  }
)
