import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

import pg from "pg"

import {
  createActivateStoreWithinEntitlement,
  StoreEntitlementActivationError,
} from "../../lib/stores/activate-store-within-entitlement.internal.ts"
import {
  createDeactivateStore,
  StoreDeactivationError,
} from "../../lib/stores/deactivate-store.internal.ts"
import { getPlanDefinition, PLAN_CODES } from "../../lib/billing/plans.ts"

const { Client } = pg
const storeId = "91000000-0000-0000-0000-000000000001"
const authenticatedAdmin = {
  userId: "user_store_entitlement_admin",
  orgId: "org_store_entitlement",
  isAdmin: true,
}

function createActivation({
  authState = authenticatedAdmin,
  getAuth = async () => authState,
  isStoreId = (value) => value === storeId,
  rpcResult = { data: { outcome: "activated" }, error: null },
  activate = async () => rpcResult,
} = {}) {
  const calls = []
  const operation = createActivateStoreWithinEntitlement({
    getAuth,
    isStoreId,
    async activate(...args) {
      calls.push(args)
      return activate(...args)
    },
  })

  return { operation, calls }
}

function createDeactivation({
  authState = authenticatedAdmin,
  getAuth = async () => authState,
  isStoreId = (value) => value === storeId,
  rpcResult = { data: { outcome: "deactivated" }, error: null },
  deactivate = async () => rpcResult,
} = {}) {
  const calls = []
  const operation = createDeactivateStore({
    getAuth,
    isStoreId,
    async deactivate(...args) {
      calls.push(args)
      return deactivate(...args)
    },
  })

  return { operation, calls }
}

async function expectActivationError(operation, expectedCause) {
  await assert.rejects(operation, (error) => {
    assert.ok(error instanceof StoreEntitlementActivationError)
    assert.equal(error.name, "StoreEntitlementActivationError")
    assert.equal(error.message, "Unable to activate Store within entitlement")

    if (expectedCause !== undefined) {
      assert.equal(error.cause, expectedCause)
    }

    assert.doesNotMatch(
      error.message,
      /postgrest|sql|jwt|clerk|organization|stripe|secret/iu
    )
    return true
  })
}

async function expectDeactivationError(operation, expectedCause) {
  await assert.rejects(operation, (error) => {
    assert.ok(error instanceof StoreDeactivationError)
    assert.equal(error.name, "StoreDeactivationError")
    assert.equal(error.message, "Unable to deactivate Store")

    if (expectedCause !== undefined) {
      assert.equal(error.cause, expectedCause)
    }

    assert.doesNotMatch(
      error.message,
      /postgrest|sql|jwt|clerk|organization|stripe|secret/iu
    )
    return true
  })
}

test("activation preconditions stop before Store validation and RPC", async (t) => {
  for (const [name, authState, expected] of [
    [
      "unauthenticated",
      { ...authenticatedAdmin, userId: null },
      { status: "unauthenticated" },
    ],
    [
      "no active Organization",
      { ...authenticatedAdmin, orgId: null },
      { status: "no_active_organization" },
    ],
    [
      "Organization member",
      { ...authenticatedAdmin, isAdmin: false },
      { status: "not_admin" },
    ],
  ]) {
    await t.test(name, async () => {
      let validations = 0
      const { operation, calls } = createActivation({
        authState,
        isStoreId() {
          validations += 1
          return true
        },
      })

      assert.deepEqual(await operation(storeId), expected)
      assert.equal(validations, 0)
      assert.deepEqual(calls, [])
    })
  }
})

test("deactivation preconditions stop before Store validation and RPC", async (t) => {
  for (const [name, authState, expected] of [
    [
      "unauthenticated",
      { ...authenticatedAdmin, userId: null },
      { status: "unauthenticated" },
    ],
    [
      "no active Organization",
      { ...authenticatedAdmin, orgId: undefined },
      { status: "no_active_organization" },
    ],
    [
      "Organization member",
      { ...authenticatedAdmin, isAdmin: false },
      { status: "not_admin" },
    ],
  ]) {
    await t.test(name, async () => {
      let validations = 0
      const { operation, calls } = createDeactivation({
        authState,
        isStoreId() {
          validations += 1
          return true
        },
      })

      assert.deepEqual(await operation(storeId), expected)
      assert.equal(validations, 0)
      assert.deepEqual(calls, [])
    })
  }
})

test("malformed Store IDs are unavailable without database access", async () => {
  const activation = createActivation()
  const deactivation = createDeactivation()

  assert.deepEqual(await activation.operation("not-a-uuid"), {
    status: "store_unavailable",
  })
  assert.deepEqual(await deactivation.operation("not-a-uuid"), {
    status: "store_unavailable",
  })
  assert.deepEqual(activation.calls, [])
  assert.deepEqual(deactivation.calls, [])
})

test("each operation accepts and forwards only the validated Store ID", async () => {
  const activation = createActivation()
  const deactivation = createDeactivation()

  assert.equal(activation.operation.length, 1)
  assert.equal(deactivation.operation.length, 1)

  await activation.operation(storeId, "org_attacker", "multi_3", 99)
  await deactivation.operation(storeId, "org_attacker", "admin")

  assert.deepEqual(activation.calls, [[storeId]])
  assert.deepEqual(deactivation.calls, [[storeId]])
})

test("activation normalizes every approved domain and precondition outcome", async (t) => {
  for (const outcome of [
    "organization_not_provisioned",
    "not_ready",
    "not_entitled",
    "capacity_reached",
    "store_unavailable",
  ]) {
    await t.test(outcome, async () => {
      const { operation } = createActivation({
        rpcResult: { data: { outcome }, error: null },
      })

      assert.deepEqual(await operation(storeId), { status: outcome })
    })
  }

  for (const outcome of ["activated", "already_active"]) {
    await t.test(outcome, async () => {
      const { operation } = createActivation({
        rpcResult: { data: { outcome }, error: null },
      })

      assert.deepEqual(await operation(storeId), { status: outcome, storeId })
    })
  }
})

test("deactivation normalizes every approved domain and precondition outcome", async (t) => {
  for (const outcome of [
    "organization_not_provisioned",
    "not_active",
    "store_unavailable",
  ]) {
    await t.test(outcome, async () => {
      const { operation } = createDeactivation({
        rpcResult: { data: { outcome }, error: null },
      })

      assert.deepEqual(await operation(storeId), { status: outcome })
    })
  }

  for (const outcome of ["deactivated", "already_inactive"]) {
    await t.test(outcome, async () => {
      const { operation } = createDeactivation({
        rpcResult: { data: { outcome }, error: null },
      })

      assert.deepEqual(await operation(storeId), { status: outcome, storeId })
    })
  }
})

test("malformed, partial, extra, collection, and unknown activation results fail closed", async (t) => {
  for (const data of [
    null,
    [],
    [{ outcome: "activated" }],
    {},
    { outcome: "unknown" },
    { outcome: "activated", organization_id: "secret" },
  ]) {
    await t.test(JSON.stringify(data), async () => {
      const { operation } = createActivation({
        rpcResult: { data, error: null },
      })
      await expectActivationError(() => operation(storeId))
    })
  }
})

test("malformed, partial, extra, collection, and unknown deactivation results fail closed", async (t) => {
  for (const data of [
    null,
    [],
    [{ outcome: "deactivated" }],
    {},
    { outcome: "unknown" },
    { outcome: "deactivated", organization_id: "secret" },
  ]) {
    await t.test(JSON.stringify(data), async () => {
      const { operation } = createDeactivation({
        rpcResult: { data, error: null },
      })
      await expectDeactivationError(() => operation(storeId))
    })
  }
})

test("activation wraps Clerk, transport, and returned Supabase failures", async (t) => {
  const rawError = new Error("raw PostgREST SQL and JWT detail")

  await t.test("Clerk", async () => {
    const { operation } = createActivation({
      getAuth: async () => {
        throw rawError
      },
    })
    await expectActivationError(() => operation(storeId), rawError)
  })

  await t.test("returned Supabase error", async () => {
    const { operation } = createActivation({
      rpcResult: { data: null, error: rawError },
    })
    await expectActivationError(() => operation(storeId), rawError)
  })

  await t.test("thrown transport error", async () => {
    const { operation } = createActivation({
      activate: async () => {
        throw rawError
      },
    })
    await expectActivationError(() => operation(storeId), rawError)
  })
})

test("deactivation wraps Clerk, transport, and returned Supabase failures", async (t) => {
  const rawError = new Error("raw PostgREST SQL and JWT detail")

  await t.test("Clerk", async () => {
    const { operation } = createDeactivation({
      getAuth: async () => {
        throw rawError
      },
    })
    await expectDeactivationError(() => operation(storeId), rawError)
  })

  await t.test("returned Supabase error", async () => {
    const { operation } = createDeactivation({
      rpcResult: { data: null, error: rawError },
    })
    await expectDeactivationError(() => operation(storeId), rawError)
  })

  await t.test("thrown transport error", async () => {
    const { operation } = createDeactivation({
      deactivate: async () => {
        throw rawError
      },
    })
    await expectDeactivationError(() => operation(storeId), rawError)
  })
})

test("public modules preserve the server-only Clerk-JWT RPC boundary", async () => {
  const activationPublic = await readFile(
    new URL(
      "../../lib/stores/activate-store-within-entitlement.ts",
      import.meta.url
    ),
    "utf8"
  )
  const activationInternal = await readFile(
    new URL(
      "../../lib/stores/activate-store-within-entitlement.internal.ts",
      import.meta.url
    ),
    "utf8"
  )
  const deactivationPublic = await readFile(
    new URL("../../lib/stores/deactivate-store.ts", import.meta.url),
    "utf8"
  )
  const deactivationInternal = await readFile(
    new URL("../../lib/stores/deactivate-store.internal.ts", import.meta.url),
    "utf8"
  )
  const combined = [
    activationPublic,
    activationInternal,
    deactivationPublic,
    deactivationInternal,
  ].join("\n")

  for (const source of [
    activationPublic,
    activationInternal,
    deactivationPublic,
    deactivationInternal,
  ]) {
    assert.match(source, /^import "server-only"/)
  }

  for (const source of [activationPublic, deactivationPublic]) {
    assert.match(source, /await auth\(\)/)
    assert.match(source, /has\(\{ role: "org:admin" \}\)/)
    assert.match(source, /createServerSupabaseClient\(\)/)
    assert.match(source, /\.maybeSingle\(\)/)
  }

  assert.match(
    activationPublic,
    /\.rpc\("activate_store_within_entitlement", \{\s*p_store_id: storeId/mu
  )
  assert.match(
    deactivationPublic,
    /\.rpc\("deactivate_store", \{\s*p_store_id: storeId/mu
  )

  assert.doesNotMatch(combined, /supabase\/admin|createAdminSupabaseClient/)
  assert.doesNotMatch(combined, /SUPABASE_SECRET_KEY/)
  assert.doesNotMatch(combined, /@\/lib\/stripe|getStripe|stripe\./)
  assert.doesNotMatch(combined, /["']use server["']/)
  assert.doesNotMatch(combined, /\.from\s*\(/)
  assert.doesNotMatch(combined, /\.(?:insert|upsert|update|delete)\s*\(/)
  assert.doesNotMatch(combined, /billing_trial_grants|billing_subscriptions/)
  assert.doesNotMatch(combined, /maxStores|planCode|organizationId|clerkUserId/)
})

test("the real TypeScript and local SQL capacity registries have exact parity", async () => {
  const connectionString =
    process.env.SUPABASE_TEST_DB_URL ??
    "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
  const parsedConnection = new URL(connectionString)
  const localHosts = new Set(["127.0.0.1", "localhost", "[::1]", "::1"])

  if (
    !["postgres:", "postgresql:"].includes(parsedConnection.protocol) ||
    !localHosts.has(parsedConnection.hostname)
  ) {
    throw new Error("Plan parity tests require a local PostgreSQL connection")
  }

  const client = new Client({
    connectionString,
    application_name: "store-entitlement-plan-parity",
    connectionTimeoutMillis: 5_000,
  })

  await client.connect()

  try {
    for (const planCode of PLAN_CODES) {
      const result = await client.query(
        "select private.plan_max_stores($1::text) as max_stores",
        [planCode]
      )

      assert.equal(result.rows.length, 1)
      assert.equal(
        result.rows[0].max_stores,
        getPlanDefinition(planCode).maxStores
      )
    }

    assert.throws(() => getPlanDefinition("unknown_plan"), {
      name: "UnsupportedPlanCodeError",
    })

    await assert.rejects(
      client.query("select private.plan_max_stores($1::text) as max_stores", [
        "unknown_plan",
      ]),
      (error) => error?.code === "22023"
    )
  } finally {
    await client.end()
  }
})
