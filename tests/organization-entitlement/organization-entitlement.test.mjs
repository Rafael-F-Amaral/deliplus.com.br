import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

import {
  createResolveOrganizationEntitlement,
  OrganizationEntitlementPreconditionError,
  OrganizationEntitlementResolutionError,
} from "../../lib/billing/organization-entitlement.internal.ts"
import { getPlanDefinition } from "../../lib/billing/plans.ts"
import { BILLING_SUBSCRIPTION_STATUSES } from "../../lib/billing/subscription-reducer.ts"

const authenticated = {
  userId: "user_entitlement",
  orgId: "org_entitlement",
}

const emptyFacts = Object.freeze({
  trial_plan_code: null,
  trial_valid_until: null,
  subscription_plan_code: null,
  subscription_status: null,
  subscription_collection_paused: null,
})

function facts(overrides = {}) {
  return { ...emptyFacts, ...overrides }
}

function resolvePlanEntitlement(value) {
  const plan = getPlanDefinition(value)

  return {
    planCode: plan.code,
    maxStores: plan.maxStores,
  }
}

function isSubscriptionStatus(value) {
  return BILLING_SUBSCRIPTION_STATUSES.some((status) => status === value)
}

function createTestResolver({
  authState = authenticated,
  getAuth = async () => authState,
  readResult = { data: emptyFacts, error: null },
  readFacts = async () => readResult,
} = {}) {
  return createResolveOrganizationEntitlement({
    getAuth,
    readFacts,
    resolvePlanEntitlement,
    isSubscriptionStatus,
  })
}

async function expectPrecondition(operation, code) {
  await assert.rejects(operation, (error) => {
    assert.ok(error instanceof OrganizationEntitlementPreconditionError)
    assert.equal(error.name, "OrganizationEntitlementPreconditionError")
    assert.equal(error.message, "Organization entitlement precondition failed")
    assert.equal(error.code, code)
    assert.doesNotMatch(error.message, /user_|org_|[0-9a-f]{8}-/iu)
    return true
  })
}

async function expectResolutionError(operation) {
  await assert.rejects(operation, (error) => {
    assert.ok(error instanceof OrganizationEntitlementResolutionError)
    assert.equal(error.name, "OrganizationEntitlementResolutionError")
    assert.equal(error.message, "Unable to resolve Organization entitlement")
    return true
  })
}

test("unauthenticated requests fail before querying Supabase", async () => {
  let reads = 0
  const resolve = createTestResolver({
    authState: { ...authenticated, userId: null },
    readFacts: async () => {
      reads += 1
      throw new Error("must not be called")
    },
  })

  await expectPrecondition(resolve, "unauthenticated")
  assert.equal(reads, 0)
})

test("requests without an active Organization fail before querying Supabase", async () => {
  let reads = 0
  const resolve = createTestResolver({
    authState: { ...authenticated, orgId: null },
    readFacts: async () => {
      reads += 1
      throw new Error("must not be called")
    },
  })

  await expectPrecondition(resolve, "no_active_organization")
  assert.equal(reads, 0)
})

test("Clerk auth failures use the safe resolution boundary", async () => {
  const rawError = new Error("raw Clerk request detail")
  const resolve = createTestResolver({
    getAuth: async () => {
      throw rawError
    },
  })

  await assert.rejects(resolve, (error) => {
    assert.ok(error instanceof OrganizationEntitlementResolutionError)
    assert.equal(error.cause, rawError)
    assert.doesNotMatch(error.message, /raw Clerk request detail/)
    return true
  })
})

test("an active Clerk Organization without an internal row is a precondition failure", async () => {
  const resolve = createTestResolver({
    readResult: { data: null, error: null },
  })

  await expectPrecondition(resolve, "organization_not_provisioned")
})

test("valid absence of trial and paid facts returns no entitlement", async () => {
  const resolve = createTestResolver()

  assert.deepEqual(await resolve(), {
    entitled: false,
    reason: "no_entitlement",
  })
})

test("a valid Essential initial trial returns the registry capacity and Date", async () => {
  const validUntil = "2026-09-09T12:00:00.000Z"
  const resolve = createTestResolver({
    readResult: {
      data: facts({
        trial_plan_code: "essential",
        trial_valid_until: validUntil,
      }),
      error: null,
    },
  })

  assert.deepEqual(await resolve(), {
    entitled: true,
    source: "trial",
    planCode: "essential",
    maxStores: 1,
    validUntil: new Date(validUntil),
  })
})

test("manual overrides resolve every approved plan through the registry", async (t) => {
  for (const [planCode, maxStores] of [
    ["essential", 1],
    ["multi_2", 2],
    ["multi_3", 3],
  ]) {
    await t.test(planCode, async () => {
      const resolve = createTestResolver({
        readResult: {
          data: facts({
            trial_plan_code: planCode,
            trial_valid_until: "2026-09-10T12:00:00.000Z",
          }),
          error: null,
        },
      })

      assert.deepEqual(await resolve(), {
        entitled: true,
        source: "trial",
        planCode,
        maxStores,
        validUntil: new Date("2026-09-10T12:00:00.000Z"),
      })
    })
  }
})

test("expired, revoked, and future trials are ordinary absence after database filtering", async (t) => {
  for (const state of ["expired", "revoked", "future"]) {
    await t.test(state, async () => {
      const resolve = createTestResolver()

      assert.deepEqual(await resolve(), {
        entitled: false,
        reason: "no_entitlement",
      })
    })
  }
})

test("active paid subscriptions resolve every approved plan", async (t) => {
  for (const [planCode, maxStores] of [
    ["essential", 1],
    ["multi_2", 2],
    ["multi_3", 3],
  ]) {
    await t.test(planCode, async () => {
      const resolve = createTestResolver({
        readResult: {
          data: facts({
            subscription_plan_code: planCode,
            subscription_status: "active",
            subscription_collection_paused: false,
          }),
          error: null,
        },
      })

      assert.deepEqual(await resolve(), {
        entitled: true,
        source: "paid_subscription",
        planCode,
        maxStores,
      })
    })
  }
})

test("past_due retains paid entitlement", async () => {
  const resolve = createTestResolver({
    readResult: {
      data: facts({
        subscription_plan_code: "multi_2",
        subscription_status: "past_due",
        subscription_collection_paused: false,
      }),
      error: null,
    },
  })

  assert.deepEqual(await resolve(), {
    entitled: true,
    source: "paid_subscription",
    planCode: "multi_2",
    maxStores: 2,
  })
})

test("known non-entitled Stripe statuses do not grant paid entitlement", async (t) => {
  for (const status of [
    "trialing",
    "incomplete",
    "incomplete_expired",
    "unpaid",
    "canceled",
    "paused",
  ]) {
    await t.test(status, async () => {
      const resolve = createTestResolver({
        readResult: {
          data: facts({
            subscription_plan_code: "essential",
            subscription_status: status,
            subscription_collection_paused: false,
          }),
          error: null,
        },
      })

      assert.deepEqual(await resolve(), {
        entitled: false,
        reason: "no_entitlement",
      })
    })
  }
})

test("collection_paused removes paid entitlement when no trial exists", async () => {
  const resolve = createTestResolver({
    readResult: {
      data: facts({
        subscription_plan_code: "multi_3",
        subscription_status: "active",
        subscription_collection_paused: true,
      }),
      error: null,
    },
  })

  assert.deepEqual(await resolve(), {
    entitled: false,
    reason: "no_entitlement",
  })
})

test("a valid local trial grants entitlement while paid collection is paused", async () => {
  const resolve = createTestResolver({
    readResult: {
      data: facts({
        trial_plan_code: "multi_2",
        trial_valid_until: "2026-09-12T12:00:00.000Z",
        subscription_plan_code: "multi_3",
        subscription_status: "past_due",
        subscription_collection_paused: true,
      }),
      error: null,
    },
  })

  assert.deepEqual(await resolve(), {
    entitled: true,
    source: "trial",
    planCode: "multi_2",
    maxStores: 2,
    validUntil: new Date("2026-09-12T12:00:00.000Z"),
  })
})

test("paid entitlement has descriptive precedence over a valid trial", async () => {
  const resolve = createTestResolver({
    readResult: {
      data: facts({
        trial_plan_code: "multi_3",
        trial_valid_until: "2026-09-15T12:00:00.000Z",
        subscription_plan_code: "essential",
        subscription_status: "active",
        subscription_collection_paused: false,
      }),
      error: null,
    },
  })

  assert.deepEqual(await resolve(), {
    entitled: true,
    source: "paid_subscription",
    planCode: "essential",
    maxStores: 1,
  })
})

test("unknown trial and paid plan codes fail closed without fallback", async (t) => {
  for (const data of [
    facts({
      trial_plan_code: "unknown_trial",
      trial_valid_until: "2026-09-15T12:00:00.000Z",
    }),
    facts({
      subscription_plan_code: "unknown_paid",
      subscription_status: "active",
      subscription_collection_paused: false,
    }),
  ]) {
    await t.test(
      String(data.trial_plan_code ?? data.subscription_plan_code),
      () =>
        expectResolutionError(
          createTestResolver({ readResult: { data, error: null } })
        )
    )
  }
})

test("all facts are validated before paid precedence", async () => {
  const resolve = createTestResolver({
    readResult: {
      data: facts({
        trial_plan_code: "unknown_trial",
        trial_valid_until: "2026-09-15T12:00:00.000Z",
        subscription_plan_code: "essential",
        subscription_status: "active",
        subscription_collection_paused: false,
      }),
      error: null,
    },
  })

  await expectResolutionError(resolve)
})

test("unknown subscription status fails closed", () =>
  expectResolutionError(
    createTestResolver({
      readResult: {
        data: facts({
          subscription_plan_code: "essential",
          subscription_status: "future_status",
          subscription_collection_paused: false,
        }),
        error: null,
      },
    })
  ))

test("invalid trial timestamp fails closed", () =>
  expectResolutionError(
    createTestResolver({
      readResult: {
        data: facts({
          trial_plan_code: "essential",
          trial_valid_until: "not-a-date",
        }),
        error: null,
      },
    })
  ))

test("partial trial and subscription facts fail closed", async (t) => {
  for (const data of [
    facts({ trial_plan_code: "essential" }),
    facts({ trial_valid_until: "2026-09-15T12:00:00.000Z" }),
    facts({ subscription_plan_code: "essential" }),
    facts({
      subscription_plan_code: "essential",
      subscription_status: "active",
    }),
  ]) {
    await t.test(JSON.stringify(data), () =>
      expectResolutionError(
        createTestResolver({ readResult: { data, error: null } })
      )
    )
  }
})

test("invalid RPC response shape and cardinality fail closed", async (t) => {
  for (const data of [
    undefined,
    [],
    [emptyFacts, emptyFacts],
    { ...emptyFacts, unexpected: true },
    { trial_plan_code: null },
  ]) {
    await t.test(String(data), () =>
      expectResolutionError(
        createTestResolver({ readResult: { data, error: null } })
      )
    )
  }
})

test("Supabase errors and thrown read failures use a safe public error", async (t) => {
  const rawPostgrestError = new Error(
    "raw SQL detail with org_secret and stripe identifiers"
  )

  await t.test("returned error", async () => {
    const resolve = createTestResolver({
      readResult: { data: null, error: rawPostgrestError },
    })

    await assert.rejects(resolve, (error) => {
      assert.ok(error instanceof OrganizationEntitlementResolutionError)
      assert.equal(error.cause, rawPostgrestError)
      assert.doesNotMatch(error.message, /raw SQL|org_secret|stripe/iu)
      return true
    })
  })

  await t.test("thrown error", async () => {
    const resolve = createTestResolver({
      readFacts: async () => {
        throw rawPostgrestError
      },
    })

    await assert.rejects(resolve, (error) => {
      assert.ok(error instanceof OrganizationEntitlementResolutionError)
      assert.equal(error.cause, rawPostgrestError)
      assert.doesNotMatch(error.message, /raw SQL|org_secret|stripe/iu)
      return true
    })
  })
})

test("conflicting active trial plans surface as a resolution error", async () => {
  const conflictError = new Error("Conflicting active Organization trial plans")
  const resolve = createTestResolver({
    readResult: { data: null, error: conflictError },
  })

  await assert.rejects(resolve, (error) => {
    assert.ok(error instanceof OrganizationEntitlementResolutionError)
    assert.equal(error.cause, conflictError)
    assert.doesNotMatch(error.message, /Conflicting active/)
    return true
  })
})

test("admin and member sessions in the same Organization normalize identical facts", async () => {
  const sharedFacts = facts({
    subscription_plan_code: "multi_3",
    subscription_status: "active",
    subscription_collection_paused: false,
  })
  const adminResolver = createTestResolver({
    authState: { userId: "admin", orgId: "org_shared" },
    readResult: { data: sharedFacts, error: null },
  })
  const memberResolver = createTestResolver({
    authState: { userId: "member", orgId: "org_shared" },
    readResult: { data: sharedFacts, error: null },
  })

  assert.deepEqual(await adminResolver(), await memberResolver())
})

test("callers cannot choose tenant authority through an argument", async () => {
  const readArguments = []
  const resolve = createTestResolver({
    readFacts: async (...args) => {
      readArguments.push(args)
      return { data: emptyFacts, error: null }
    },
  })

  assert.equal(resolve.length, 0)
  await resolve("org_attacker", "sub_attacker")
  assert.deepEqual(readArguments, [[]])
})

test("the public resolver preserves all approved server and data boundaries", async () => {
  const publicSource = await readFile(
    new URL("../../lib/billing/organization-entitlement.ts", import.meta.url),
    "utf8"
  )
  const internalSource = await readFile(
    new URL(
      "../../lib/billing/organization-entitlement.internal.ts",
      import.meta.url
    ),
    "utf8"
  )
  const combinedSource = `${publicSource}\n${internalSource}`

  assert.match(publicSource, /import "server-only"/)
  assert.match(publicSource, /await auth\(\)/)
  assert.match(publicSource, /createServerSupabaseClient\(\)/)
  assert.match(
    publicSource,
    /\.rpc\("resolve_active_organization_entitlement_facts"\)/
  )
  assert.match(publicSource, /\.maybeSingle\(\)/)
  assert.match(
    publicSource,
    /export async function resolveOrganizationEntitlement\(\)/
  )
  assert.match(publicSource, /getPlanDefinition\(value\)/)

  assert.doesNotMatch(combinedSource, /supabase\/admin/)
  assert.doesNotMatch(combinedSource, /SUPABASE_SECRET_KEY/)
  assert.doesNotMatch(combinedSource, /getStripe|stripe\.subscriptions/)
  assert.doesNotMatch(combinedSource, /\.from\(/)
  assert.doesNotMatch(combinedSource, /\.(insert|upsert|update|delete)\s*\(/)
  assert.doesNotMatch(combinedSource, /["'](stores|store_memberships)["']/)
  assert.doesNotMatch(combinedSource, /["']use server["']/)
  assert.doesNotMatch(combinedSource, /globalThis|new Map\(|new Set\(/)
})
