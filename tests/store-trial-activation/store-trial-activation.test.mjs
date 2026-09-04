import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

import {
  createActivateFirstStoreWithInitialTrial,
  StoreTrialActivationError,
} from "../../lib/stores/activate-first-store-with-initial-trial.internal.ts"

const storeId = "61000000-0000-0000-0000-000000000001"
const authenticatedAdmin = {
  userId: "user_trial_admin",
  orgId: "org_trial",
  isAdmin: true,
}

function createOperation({
  authState = authenticatedAdmin,
  getAuth = async () => authState,
  isStoreId = (value) => value === storeId,
  rpcResult = {
    data: { outcome: "activated", trial_ends_at: "2026-09-12T12:00:00Z" },
    error: null,
  },
  activate = async () => rpcResult,
} = {}) {
  const calls = []
  const operation = createActivateFirstStoreWithInitialTrial({
    getAuth,
    isStoreId,
    async activate(...args) {
      calls.push(args)
      return activate(...args)
    },
  })

  return { operation, calls }
}

async function expectSafeError(operation, expectedCause) {
  await assert.rejects(operation, (error) => {
    assert.ok(error instanceof StoreTrialActivationError)
    assert.equal(error.name, "StoreTrialActivationError")
    assert.equal(error.message, "Unable to activate Store with initial trial")

    if (expectedCause !== undefined) {
      assert.equal(error.cause, expectedCause)
    }

    assert.doesNotMatch(
      error.message,
      /postgrest|sql|jwt|clerk|organization|stripe|user_trial/iu
    )
    return true
  })
}

test("unauthenticated requests stop before Store validation and RPC", async () => {
  let validations = 0
  const { operation, calls } = createOperation({
    authState: { ...authenticatedAdmin, userId: null },
    isStoreId() {
      validations += 1
      return true
    },
  })

  assert.deepEqual(await operation(storeId), { status: "unauthenticated" })
  assert.equal(validations, 0)
  assert.deepEqual(calls, [])
})

test("a missing active Organization stops before the RPC", async () => {
  const { operation, calls } = createOperation({
    authState: { ...authenticatedAdmin, orgId: null },
  })

  assert.deepEqual(await operation(storeId), {
    status: "no_active_organization",
  })
  assert.deepEqual(calls, [])
})

test("an Organization member is rejected before the RPC", async () => {
  const { operation, calls } = createOperation({
    authState: { ...authenticatedAdmin, isAdmin: false },
  })

  assert.deepEqual(await operation(storeId), { status: "not_admin" })
  assert.deepEqual(calls, [])
})

test("a malformed Store selector is safely unavailable before the RPC", async () => {
  const { operation, calls } = createOperation()

  assert.deepEqual(await operation("not-a-uuid"), {
    status: "store_unavailable",
  })
  assert.deepEqual(calls, [])
})

test("the public operation accepts only storeId and sends only storeId to the RPC dependency", async () => {
  const { operation, calls } = createOperation()

  assert.equal(operation.length, 1)
  await operation(storeId, "org_attacker", "user_attacker", "essential")
  assert.deepEqual(calls, [[storeId]])
})

test("all non-success RPC outcomes normalize without leaking RPC fields", async (t) => {
  for (const outcome of [
    "organization_not_provisioned",
    "not_ready",
    "trial_not_eligible",
    "store_unavailable",
  ]) {
    await t.test(outcome, async () => {
      const { operation } = createOperation({
        rpcResult: { data: { outcome, trial_ends_at: null }, error: null },
      })

      assert.deepEqual(await operation(storeId), { status: outcome })
    })
  }
})

test("activated normalizes the database timestamp to Date", async () => {
  const { operation } = createOperation()

  assert.deepEqual(await operation(storeId), {
    status: "activated",
    storeId,
    trialEndsAt: new Date("2026-09-12T12:00:00Z"),
  })
})

test("already_activated preserves the same successful result shape", async () => {
  const { operation } = createOperation({
    rpcResult: {
      data: {
        outcome: "already_activated",
        trial_ends_at: "2026-09-12T12:00:00Z",
      },
      error: null,
    },
  })

  assert.deepEqual(await operation(storeId), {
    status: "already_activated",
    storeId,
    trialEndsAt: new Date("2026-09-12T12:00:00Z"),
  })
})

test("successful outcomes require a valid database timestamp", async (t) => {
  for (const trialEndsAt of [null, 123, "not-a-date"]) {
    await t.test(String(trialEndsAt), async () => {
      const { operation } = createOperation({
        rpcResult: {
          data: { outcome: "activated", trial_ends_at: trialEndsAt },
          error: null,
        },
      })

      await expectSafeError(() => operation(storeId))
    })
  }
})

test("non-success outcomes reject an unexpected trial timestamp", async () => {
  const { operation } = createOperation({
    rpcResult: {
      data: {
        outcome: "trial_not_eligible",
        trial_ends_at: "2026-09-12T12:00:00Z",
      },
      error: null,
    },
  })

  await expectSafeError(() => operation(storeId))
})

test("unknown, partial, extra, null, and collection RPC shapes fail closed", async (t) => {
  for (const data of [
    null,
    [],
    { outcome: "activated" },
    { outcome: "unknown", trial_ends_at: null },
    {
      outcome: "activated",
      trial_ends_at: "2026-09-12T12:00:00Z",
      organization_id: "secret",
    },
  ]) {
    await t.test(JSON.stringify(data), async () => {
      const { operation } = createOperation({
        rpcResult: { data, error: null },
      })

      await expectSafeError(() => operation(storeId))
    })
  }
})

test("Clerk auth failures use the safe infrastructure boundary", async () => {
  const rawError = new Error("raw Clerk JWT detail user_trial")
  const { operation } = createOperation({
    getAuth: async () => {
      throw rawError
    },
  })

  await expectSafeError(() => operation(storeId), rawError)
})

test("returned Supabase errors use the safe infrastructure boundary", async () => {
  const rawError = new Error("raw PostgREST SQL and Organization UUID")
  const { operation } = createOperation({
    rpcResult: { data: null, error: rawError },
  })

  await expectSafeError(() => operation(storeId), rawError)
})

test("thrown Supabase failures use the safe infrastructure boundary", async () => {
  const rawError = new Error("transport secret")
  const { operation } = createOperation({
    activate: async () => {
      throw rawError
    },
  })

  await expectSafeError(() => operation(storeId), rawError)
})

test("the public module uses only Clerk auth and the normal Clerk-JWT Supabase RPC path", async () => {
  const publicSource = await readFile(
    new URL(
      "../../lib/stores/activate-first-store-with-initial-trial.ts",
      import.meta.url
    ),
    "utf8"
  )
  const internalSource = await readFile(
    new URL(
      "../../lib/stores/activate-first-store-with-initial-trial.internal.ts",
      import.meta.url
    ),
    "utf8"
  )
  const combined = `${publicSource}\n${internalSource}`

  assert.match(publicSource, /^import "server-only"/)
  assert.match(internalSource, /^import "server-only"/)
  assert.match(publicSource, /await auth\(\)/)
  assert.match(publicSource, /has\(\{ role: "org:admin" \}\)/)
  assert.match(publicSource, /createServerSupabaseClient\(\)/)
  assert.match(
    publicSource,
    /\.rpc\("activate_first_store_with_initial_trial", \{\s*p_store_id: storeId/mu
  )
  assert.match(publicSource, /\.maybeSingle\(\)/)

  assert.doesNotMatch(combined, /supabase\/admin/)
  assert.doesNotMatch(combined, /createAdminSupabaseClient/)
  assert.doesNotMatch(combined, /SUPABASE_SECRET_KEY/)
  assert.doesNotMatch(
    combined,
    /@\/lib\/stripe|getStripe|subscriptions\.retrieve/
  )
  assert.doesNotMatch(combined, /["']use server["']/)
  assert.doesNotMatch(combined, /\.from\s*\(/)
  assert.doesNotMatch(combined, /\.(?:insert|upsert|update|delete)\s*\(/)
  assert.doesNotMatch(combined, /billing_trial_grants|billing_subscriptions/)
})

test("the feature does not modify Store setup or introduce generic paid activation", async () => {
  const publicSource = await readFile(
    new URL(
      "../../lib/stores/activate-first-store-with-initial-trial.ts",
      import.meta.url
    ),
    "utf8"
  )
  const internalSource = await readFile(
    new URL(
      "../../lib/stores/activate-first-store-with-initial-trial.internal.ts",
      import.meta.url
    ),
    "utf8"
  )
  const combined = `${publicSource}\n${internalSource}`

  assert.doesNotMatch(combined, /activateStoreWithinEntitlement/)
  assert.doesNotMatch(
    combined,
    /createDraftStore|updateStoreSetup|markStoreReady/
  )
  assert.doesNotMatch(combined, /status:\s*["']active["']/)
  assert.doesNotMatch(
    combined,
    /\b(?:name|slug|maxStores|planCode|grantKind)\s*:/
  )
})
