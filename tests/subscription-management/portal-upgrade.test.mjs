import "./runtime.mjs"
import assert from "node:assert/strict"
import test from "node:test"

const { createSubscriptionUpgradePortal } =
  await import("../../lib/billing/subscription-upgrade-portal.internal.ts")

const plans = ["essential", "multi_2", "multi_3"]
const prices = {
  essential: "price_essential",
  multi_2: "price_duo",
  multi_3: "price_trio",
}

function fixture({ current = "essential", subscription = true } = {}) {
  const calls = []
  const local = subscription
    ? {
        organizationId: "10000000-0000-4000-8000-000000000001",
        stripeCustomerId: "cus_customer",
        stripeSubscriptionId: "sub_subscription",
        stripePriceId: prices[current],
        planCode: current,
        status: "active",
        currentPeriodEnd: "2026-10-12T00:00:00.000Z",
        cancelAtPeriodEnd: false,
        collectionPaused: false,
        stripeSubscriptionScheduleId: null,
        pendingStripePriceId: null,
        pendingPlanCode: null,
        pendingEffectiveAt: null,
      }
    : null
  const deps = {
    getAuth: async () => ({
      userId: "user",
      orgId: "org_clerk",
      isAdmin: true,
    }),
    isPlanCode: (value) => plans.includes(value),
    getConfiguration: (plan) => ({
      stripePriceId: prices[plan],
      portalAllowedUpgradePriceIds: [prices.multi_2, prices.multi_3],
      portalConfigurationId: "bpc_deliplus",
      returnUrl: `http://localhost:3000/dashboard/billing?portalReturn=1&targetPlan=${plan}`,
      currency: "brl",
      recurringInterval: "month",
      recurringIntervalCount: 1,
      livemode: false,
      stripeApiVersion: "2026-07-29.dahlia",
    }),
    repository: {
      findOrganization: async (clerkOrganizationId) => {
        calls.push(["organization", clerkOrganizationId])
        return local?.organizationId ?? null
      },
      readSubscription: async (organizationId) => {
        calls.push(["subscription", organizationId])
        return local
      },
    },
    stripe: {
      createUpgradePortalSession: async (canonical, configuration) => {
        calls.push(["portal", canonical, configuration])
        return "https://billing.stripe.com/p/session/test"
      },
    },
  }
  return { deps, local, calls, run: createSubscriptionUpgradePortal(deps) }
}

for (const [current, target] of [
  ["essential", "multi_2"],
  ["essential", "multi_3"],
  ["multi_2", "multi_3"],
]) {
  test(`Portal upgrade allows ${current} -> ${target} without local mutation`, async () => {
    const f = fixture({ current })
    assert.deepEqual(await f.run(target), {
      status: "portal_ready",
      portalUrl: "https://billing.stripe.com/p/session/test",
    })
    assert.equal(f.local.planCode, current)
    const portalCall = f.calls.find(([name]) => name === "portal")
    assert.equal(portalCall[1].stripeCustomerId, "cus_customer")
    assert.equal(portalCall[1].stripeSubscriptionId, "sub_subscription")
    assert.equal(portalCall[2].stripePriceId, prices[target])
  })
}

for (const [target, status] of [
  ["multi_3", "same_plan"],
  ["multi_2", "upgrade_only"],
  ["essential", "upgrade_only"],
]) {
  test(`Portal upgrade rejects Trio -> ${target} as ${status}`, async () => {
    const f = fixture({ current: "multi_3" })
    assert.deepEqual(await f.run(target), { status })
    assert.equal(
      f.calls.some(([name]) => name === "portal"),
      false
    )
  })
}

for (const [patch, status] of [
  [{ userId: null }, "unauthenticated"],
  [{ orgId: null }, "no_active_organization"],
  [{ isAdmin: false }, "not_admin"],
]) {
  test(`Portal upgrade authorization stops at ${status}`, async () => {
    const f = fixture()
    f.deps.getAuth = async () => ({
      userId: "user",
      orgId: "org_clerk",
      isAdmin: true,
      ...patch,
    })
    const run = createSubscriptionUpgradePortal(f.deps)
    assert.deepEqual(await run("multi_2"), { status })
    assert.deepEqual(f.calls, [])
  })
}

test("trial or absent paid subscription cannot enter Portal management", async () => {
  const f = fixture({ subscription: false })
  f.deps.repository.findOrganization = async () =>
    "10000000-0000-4000-8000-000000000001"
  assert.deepEqual(await createSubscriptionUpgradePortal(f.deps)("multi_2"), {
    status: "no_paid_subscription",
  })
})

test("projected Schedule blocks Portal upgrade", async () => {
  const f = fixture()
  f.local.stripeSubscriptionScheduleId = "sub_sched_change"
  f.local.pendingStripePriceId = "price_essential"
  f.local.pendingPlanCode = "essential"
  f.local.pendingEffectiveAt = f.local.currentPeriodEnd
  assert.deepEqual(await f.run("multi_3"), {
    status: "scheduled_change_exists",
  })
  assert.equal(
    f.calls.some(([name]) => name === "portal"),
    false
  )
})

test("tenant lookup, not browser identifiers, selects the subscription", async () => {
  const f = fixture()
  await f.run("multi_2")
  assert.deepEqual(f.calls[0], ["organization", "org_clerk"])
  assert.deepEqual(f.calls[1], ["subscription", f.local.organizationId])
})
