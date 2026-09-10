import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

import {
  createGetDashboardOverview,
  DashboardOverviewError,
} from "../../lib/dashboard/dashboard-overview.internal.ts"
import { createGetAccessibleStoreSummary } from "../../lib/stores/accessible-store-summary.internal.ts"
import { createResolveOnboardingState } from "../../lib/onboarding/resolve-onboarding-state.internal.ts"
import { createResolveOrganizationEntitlement } from "../../lib/billing/organization-entitlement.internal.ts"
import { getPlanDefinition } from "../../lib/billing/plans.ts"
import { BILLING_SUBSCRIPTION_STATUSES } from "../../lib/billing/subscription-reducer.ts"

const emptyFacts = {
  trial_plan_code: null,
  trial_valid_until: null,
  subscription_plan_code: null,
  subscription_status: null,
  subscription_collection_paused: null,
}
const trialFacts = {
  trial_plan_code: "essential",
  trial_valid_until: "2026-09-25T12:00:00.000Z",
}
const paidFacts = (plan) => ({
  subscription_plan_code: plan,
  subscription_status: "active",
  subscription_collection_paused: false,
})

function fixture(options = {}) {
  const calls = { organizations: [], counts: [], facts: 0 }
  const auth = {
    userId: "user_a",
    orgId: "org_a",
    has: () => true,
    ...options.auth,
  }
  const resolveOnboardingState = createResolveOnboardingState({
    getAuth: async () => auth,
    findOrganization: async (id) => {
      calls.organizations.push(id)
      return {
        data: options.unprovisioned ? null : { id: "internal_a" },
        error: null,
      }
    },
  })
  const getAccessibleStoreSummary = createGetAccessibleStoreSummary({
    resolveOnboardingState,
    countStores: async (id, activeOnly) => {
      calls.counts.push([id, activeOnly])
      if (options.countError) throw options.countError
      // These are the rows already visible through the RLS boundary, not a
      // replacement implementation of Store authorization in the read model.
      const visible = options.visibleStores ?? []
      return {
        count:
          options.invalidCount !== undefined
            ? options.invalidCount
            : visible.filter((s) => !activeOnly || s === "active").length,
        error: null,
      }
    },
  })
  const resolveOrganizationEntitlement = createResolveOrganizationEntitlement({
    getAuth: async () => auth,
    readFacts: async () => {
      calls.facts++
      return {
        data: { ...emptyFacts, ...options.facts },
        error: options.factsError ?? null,
      }
    },
    resolvePlanEntitlement: (value) => {
      const plan = getPlanDefinition(value)
      return { planCode: plan.code, maxStores: plan.maxStores }
    },
    isSubscriptionStatus: (value) =>
      BILLING_SUBSCRIPTION_STATUSES.includes(value),
  })
  return {
    calls,
    get: createGetDashboardOverview({
      getAccessibleStoreSummary,
      resolveOrganizationEntitlement,
    }),
  }
}

for (const [name, options, expected] of [
  [
    "unauthenticated",
    { auth: { userId: null } },
    { status: "unauthenticated" },
  ],
  [
    "no active Organization",
    { auth: { orgId: null } },
    { status: "no_active_organization" },
  ],
  [
    "unprovisioned admin",
    { unprovisioned: true },
    { status: "organization_not_provisioned", canProvision: true },
  ],
  [
    "unprovisioned member",
    { unprovisioned: true, auth: { has: () => false } },
    { status: "organization_not_provisioned", canProvision: false },
  ],
]) {
  test(name, async () => {
    const { get, calls } = fixture(options)
    assert.deepEqual(await get(), expected)
    assert.deepEqual(calls.counts, [])
    assert.equal(calls.facts, 0)
    if (!options.unprovisioned) assert.deepEqual(calls.organizations, [])
  })
}

test("provisioned Organization without entitlement and zero Stores is successful", async () => {
  const { get } = fixture()
  assert.deepEqual(await get(), {
    status: "success",
    overview: {
      organization: { id: "internal_a" },
      entitlement: { entitled: false, reason: "no_entitlement" },
      stores: { scope: "accessible", total: 0, active: 0 },
    },
  })
})

test("trial Essential preserves the authoritative end timestamp", async () => {
  const { get } = fixture({ facts: trialFacts, visibleStores: ["active"] })
  const { overview } = await get()
  assert.deepEqual(overview.entitlement, {
    entitled: true,
    source: "trial",
    planCode: "essential",
    maxStores: 1,
    validUntil: new Date(trialFacts.trial_valid_until),
  })
  assert.deepEqual(overview.stores, {
    scope: "accessible",
    total: 1,
    active: 1,
  })
})

for (const [plan, capacity] of [
  ["essential", 1],
  ["multi_2", 2],
  ["multi_3", 3],
]) {
  test(`paid ${plan} before any Store exists`, async () => {
    const { get } = fixture({ facts: paidFacts(plan) })
    const { overview } = await get()
    assert.deepEqual(overview.entitlement, {
      entitled: true,
      source: "paid_subscription",
      planCode: plan,
      maxStores: capacity,
    })
    assert.deepEqual(overview.stores, {
      scope: "accessible",
      total: 0,
      active: 0,
    })
  })
}

test("manual override facts retain the resolver's trial classification", async () => {
  const { get } = fixture({
    facts: { ...trialFacts, trial_plan_code: "multi_3" },
  })
  assert.deepEqual((await get()).overview.entitlement, {
    entitled: true,
    source: "trial",
    planCode: "multi_3",
    maxStores: 3,
    validUntil: new Date(trialFacts.trial_valid_until),
  })
})

test("paid precedence is delegated to the real entitlement resolver", async () => {
  const { get } = fixture({ facts: { ...trialFacts, ...paidFacts("multi_2") } })
  assert.equal((await get()).overview.entitlement.source, "paid_subscription")
})

test("past_due and collection pause behavior remains resolver-owned", async () => {
  for (const paused of [false, true]) {
    const { get } = fixture({
      facts: {
        ...trialFacts,
        ...paidFacts("multi_2"),
        subscription_status: "past_due",
        subscription_collection_paused: paused,
      },
    })
    assert.equal(
      (await get()).overview.entitlement.source,
      paused ? "trial" : "paid_subscription"
    )
  }
})

test("admin counts all RLS-visible lifecycle states, active counts only active", async () => {
  const { get } = fixture({
    visibleStores: ["draft", "ready", "active", "active", "inactive"],
  })
  assert.deepEqual((await get()).overview.stores, {
    scope: "accessible",
    total: 5,
    active: 2,
  })
})

test("member summary counts only the assigned rows returned by RLS", async () => {
  const { get } = fixture({
    auth: { has: () => false },
    visibleStores: ["active", "inactive"],
    facts: paidFacts("multi_3"),
  })
  const { overview } = await get()
  assert.deepEqual(overview.stores, {
    scope: "accessible",
    total: 2,
    active: 1,
  })
  assert.equal(overview.entitlement.maxStores, 3)
})

test("member without assignments sees zero accessible Stores", async () => {
  const { get } = fixture({ auth: { has: () => false } })
  assert.equal((await get()).overview.stores.total, 0)
})

test("counts are not limited to a Store listing page", async () => {
  const { get } = fixture({ visibleStores: Array(1501).fill("draft") })
  assert.equal((await get()).overview.stores.total, 1501)
})

test("browser arguments cannot select Organization or count scope", async () => {
  const { get, calls } = fixture()
  assert.equal(get.length, 0)
  await get({ organizationId: "internal_b", clerkOrganizationId: "org_b" })
  assert.deepEqual(calls.organizations, ["org_a"])
  assert.deepEqual(calls.counts, [
    ["internal_a", false],
    ["internal_a", true],
  ])
  assert.equal(calls.facts, 1)
})

for (const [name, options] of [
  ["Store network failure", { countError: new Error("private detail") }],
  ["entitlement failure", { factsError: new Error("private detail") }],
  [
    "unknown entitlement facts",
    { facts: { subscription_plan_code: "unsupported" } },
  ],
  ["missing count", { invalidCount: null }],
  ["negative count", { invalidCount: -1 }],
  ["fractional count", { invalidCount: 1.5 }],
]) {
  test(`${name} fails closed without an artificial empty overview`, async () => {
    await assert.rejects(fixture(options).get, (error) => {
      assert.ok(error instanceof DashboardOverviewError)
      assert.equal(error.message, "Unable to read dashboard overview")
      return true
    })
  })
}

test("public read facades preserve the normal JWT/RLS dependency boundary", async () => {
  const read = (path) =>
    readFile(new URL(`../../lib/${path}`, import.meta.url), "utf8")
  const dashboard = await read("dashboard/dashboard-overview.ts")
  const stores = await read("stores/accessible-store-summary.ts")
  for (const source of [dashboard, stores]) {
    assert.match(source, /import "server-only"/)
    assert.doesNotMatch(
      source,
      /supabase\/admin|SUPABASE_SECRET_KEY|service_role|lib\/stripe|\.rpc\(|\.(insert|update|upsert|delete)\(/
    )
  }
  assert.match(dashboard, /resolveOrganizationEntitlement/)
  assert.match(dashboard, /getAccessibleStoreSummary/)
  assert.doesNotMatch(dashboard, /\.from\(/)
  assert.match(stores, /resolveOnboardingState/)
  assert.match(stores, /createServerSupabaseClient\(\)/)
  assert.match(stores, /\.eq\("organization_id", organizationId\)/)
  assert.match(stores, /count: "exact", head: true/)
  assert.match(stores, /\.eq\("status", "active"\)/)
})
