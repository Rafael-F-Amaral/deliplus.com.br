import "./runtime.mjs"

import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const {
  createActivateStoreForCurrentOrganization,
  StoreActivationCoordinatorError,
} = await import(
  "../../lib/stores/activate-store-for-current-organization.internal.ts"
)

const storeId = "c1000000-0000-0000-0000-000000000001"

function createCoordinator({
  entitlementResults = [{ status: "activated", storeId }],
  trialResults = [],
  entitlementError,
  trialError,
} = {}) {
  const entitlementCalls = []
  const trialCalls = []
  let entitlementIndex = 0
  let trialIndex = 0
  const operation = createActivateStoreForCurrentOrganization({
    async activateWithinEntitlement(...args) {
      entitlementCalls.push(args)
      if (entitlementError) throw entitlementError
      return entitlementResults[entitlementIndex++]
    },
    async activateWithInitialTrial(...args) {
      trialCalls.push(args)
      if (trialError) throw trialError
      return trialResults[trialIndex++]
    },
  })

  return { operation, entitlementCalls, trialCalls }
}

for (const plan of ["Essential", "Duo", "Trio"]) {
  test(`paid ${plan} activates through existing entitlement without trial attempt`, async () => {
    const coordinator = createCoordinator()

    assert.deepEqual(await coordinator.operation(storeId), {
      status: "activated",
      storeId,
    })
    assert.deepEqual(coordinator.entitlementCalls, [[storeId]])
    assert.deepEqual(coordinator.trialCalls, [])
  })
}

test("a valid existing trial activates through the generic entitlement boundary", async () => {
  const coordinator = createCoordinator()
  assert.equal((await coordinator.operation(storeId)).status, "activated")
  assert.deepEqual(coordinator.trialCalls, [])
})

test("no entitlement falls back to exactly one initial-trial activation", async () => {
  const coordinator = createCoordinator({
    entitlementResults: [{ status: "not_entitled" }],
    trialResults: [
      {
        status: "activated",
        storeId,
        trialEndsAt: new Date("2026-09-25T12:00:00Z"),
      },
    ],
  })

  assert.deepEqual(await coordinator.operation(storeId), {
    status: "activated",
    storeId,
  })
  assert.deepEqual(coordinator.entitlementCalls, [[storeId]])
  assert.deepEqual(coordinator.trialCalls, [[storeId]])
})

test("used or unavailable trial becomes a subscription-required business result", async () => {
  const coordinator = createCoordinator({
    entitlementResults: [
      { status: "not_entitled" },
      { status: "not_entitled" },
    ],
    trialResults: [{ status: "trial_not_eligible" }],
  })

  assert.deepEqual(await coordinator.operation(storeId), {
    status: "subscription_required",
  })
  assert.equal(coordinator.entitlementCalls.length, 2)
  assert.equal(coordinator.trialCalls.length, 1)
})

test("a newly projected entitlement wins the post-trial-race recheck", async () => {
  const coordinator = createCoordinator({
    entitlementResults: [
      { status: "not_entitled" },
      { status: "activated", storeId },
    ],
    trialResults: [{ status: "trial_not_eligible" }],
  })

  assert.deepEqual(await coordinator.operation(storeId), {
    status: "activated",
    storeId,
  })
})

test("a concurrent same-Store activation becomes an idempotent success", async () => {
  const coordinator = createCoordinator({
    entitlementResults: [
      { status: "not_entitled" },
      { status: "already_active", storeId },
    ],
    trialResults: [{ status: "trial_not_eligible" }],
  })

  assert.deepEqual(await coordinator.operation(storeId), {
    status: "already_active",
    storeId,
  })
})

for (const [name, result] of [
  ["not ready", { status: "not_ready" }],
  ["already active", { status: "already_active", storeId }],
  ["capacity reached", { status: "capacity_reached" }],
  ["member denied", { status: "not_admin" }],
  ["cross-tenant Store", { status: "store_unavailable" }],
]) {
  test(`${name} is returned without attempting a trial`, async () => {
    const coordinator = createCoordinator({ entitlementResults: [result] })
    assert.deepEqual(await coordinator.operation(storeId), result)
    assert.deepEqual(coordinator.trialCalls, [])
  })
}

test("underlying infrastructure failures are wrapped by one safe error", async () => {
  const rawError = new Error("raw SQL and tenant detail")
  const coordinator = createCoordinator({ entitlementError: rawError })

  await assert.rejects(() => coordinator.operation(storeId), (error) => {
    assert.ok(error instanceof StoreActivationCoordinatorError)
    assert.equal(error.message, "Unable to activate Store")
    assert.equal(error.cause, rawError)
    assert.doesNotMatch(error.message, /sql|tenant|stripe|clerk/iu)
    return true
  })
})

test("the facade coordinates only the two existing transactional operations", async () => {
  const publicSource = await readFile(
    new URL(
      "../../lib/stores/activate-store-for-current-organization.ts",
      import.meta.url
    ),
    "utf8"
  )
  const internalSource = await readFile(
    new URL(
      "../../lib/stores/activate-store-for-current-organization.internal.ts",
      import.meta.url
    ),
    "utf8"
  )
  const combined = `${publicSource}\n${internalSource}`

  assert.match(publicSource, /^import "server-only"/)
  assert.match(publicSource, /activateStoreWithinEntitlement/)
  assert.match(publicSource, /activateFirstStoreWithInitialTrial/)
  assert.doesNotMatch(combined, /resolveOrganizationEntitlement/)
  assert.doesNotMatch(combined, /createServerSupabaseClient|supabase\/admin/)
  assert.doesNotMatch(combined, /billing_trial_grants|billing_subscriptions/)
  assert.doesNotMatch(combined, /maxStores|planCode/)
  assert.doesNotMatch(combined, /@\/lib\/stripe|getStripe/)
})
