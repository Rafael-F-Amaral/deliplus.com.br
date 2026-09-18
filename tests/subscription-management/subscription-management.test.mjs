import assert from "node:assert/strict"
import test from "node:test"
import { createSubscriptionManagement } from "../../lib/billing/subscription-management.internal.ts"

const plans = ["essential", "multi_2", "multi_3"]
const planPrice = {
  essential: "price_essential",
  multi_2: "price_duo",
  multi_3: "price_trio",
}
const org = "10000000-0000-4000-8000-000000000001"

function fixture({ current = "essential", scheduleId = null } = {}) {
  const calls = []
  const behavior = {
    fail: null,
    configuredTarget: null,
    configuredScheduleId: "sub_sched_change",
    staleOnState: null,
    staleWithoutProjection: false,
    releaseAlready: false,
    scheduleIds: [],
  }
  let attempt = null
  let attemptSequence = 0
  const completedAttempts = []
  const local = {
    organizationId: org,
    stripeCustomerId: "cus_customer",
    stripeSubscriptionId: "sub_subscription",
    stripePriceId: planPrice[current],
    planCode: current,
    status: "active",
    currentPeriodEnd: "2026-10-12T00:00:00.000Z",
    cancelAtPeriodEnd: false,
    collectionPaused: false,
    stripeSubscriptionScheduleId: scheduleId,
    pendingStripePriceId: scheduleId ? planPrice.essential : null,
    pendingPlanCode: scheduleId ? "essential" : null,
    pendingEffectiveAt: scheduleId ? "2026-10-12T00:00:00.000Z" : null,
  }
  const external = {
    id: local.stripeSubscriptionId,
    customerId: local.stripeCustomerId,
    priceId: local.stripePriceId,
    planCode: local.planCode,
    status: "active",
    currentPeriodEnd: local.currentPeriodEnd,
    cancelAtPeriodEnd: false,
    collectionPaused: false,
    scheduleId,
    pendingPriceId: null,
    livemode: false,
  }
  const makeAttempt = (operation, target, targetPrice) => ({
    id: `20000000-0000-4000-8000-${String(++attemptSequence).padStart(12, "0")}`,
    organization_id: org,
    operation_kind: operation,
    state: "claimed",
    source_plan_code: current,
    target_plan_code: target,
    source_stripe_price_id: local.stripePriceId,
    target_stripe_price_id: targetPrice,
    stripe_subscription_id: local.stripeSubscriptionId,
    stripe_subscription_schedule_id: local.stripeSubscriptionScheduleId,
    expected_period_end: local.currentPeriodEnd,
    livemode: false,
    stripe_api_version: "2026-07-29.dahlia",
    revision: 0,
    created_at: "2026-09-12T00:00:00.000Z",
    updated_at: "2026-09-12T00:00:00.000Z",
    ended_at: null,
  })
  const run = createSubscriptionManagement({
    getAuth: async () => ({
      userId: "user",
      orgId: "org_clerk",
      isAdmin: true,
    }),
    isPlanCode: (value) => plans.includes(value),
    getConfiguration: (plan) => ({
      stripePriceId: planPrice[plan],
      currency: "brl",
      recurringInterval: "month",
      recurringIntervalCount: 1,
      livemode: false,
      stripeApiVersion: "2026-07-29.dahlia",
    }),
    repository: {
      findOrganization: async () => org,
      readSubscription: async () => local,
      claim: async (_local, operation, target, targetPrice) => {
        calls.push(["claim", operation, target])
        attempt ??= makeAttempt(operation, target, targetPrice)
        return { outcome: "attempt", attempt }
      },
      advance: async (value, id, state) => {
        calls.push(["advance", state, id])
        if (behavior.staleOnState === state) {
          attempt = {
            ...value,
            state: "ended",
            stripe_subscription_schedule_id: id,
            revision: value.revision + 1,
            ended_at: "2026-09-12T00:01:00.000Z",
          }
          if (!behavior.staleWithoutProjection) {
            if (value.operation_kind === "schedule_downgrade") {
              local.stripeSubscriptionScheduleId = id
              local.pendingStripePriceId = value.target_stripe_price_id
              local.pendingPlanCode = value.target_plan_code
              local.pendingEffectiveAt = value.expected_period_end
            } else {
              local.stripeSubscriptionScheduleId = null
              local.pendingStripePriceId = null
              local.pendingPlanCode = null
              local.pendingEffectiveAt = null
            }
          }
          return { outcome: "stale", attempt }
        }
        attempt = {
          ...value,
          state,
          stripe_subscription_schedule_id: id,
          revision: value.revision + 1,
        }
        return { outcome: "attempt", attempt }
      },
      repairDowngradeProjection: async (_value, provider, scheduled) => {
        calls.push(["repair", scheduled.pendingPlanCode])
        local.stripeSubscriptionScheduleId = scheduled.scheduleId
        local.pendingStripePriceId = scheduled.pendingPriceId
        local.pendingPlanCode = scheduled.pendingPlanCode
        local.pendingEffectiveAt = scheduled.pendingEffectiveAt
        attempt = {
          ...attempt,
          state: "ended",
          revision: attempt.revision + 1,
          ended_at: "2026-09-12T00:01:00.000Z",
        }
        assert.equal(provider.id, external.id)
        return "applied"
      },
      repairCancellationProjection: async (_value, provider) => {
        calls.push(["repairCancellation"])
        local.stripeSubscriptionScheduleId = null
        local.pendingStripePriceId = null
        local.pendingPlanCode = null
        local.pendingEffectiveAt = null
        attempt = {
          ...attempt,
          state: "ended",
          revision: attempt.revision + 1,
          ended_at: "2026-09-12T00:01:00.000Z",
        }
        assert.equal(provider.id, external.id)
        return "applied"
      },
    },
    stripe: {
      retrieveSubscription: async () => external,
      validateTargetPrice: async () => calls.push(["validatePrice"]),
      createSchedule: async () => {
        if (behavior.fail === "createSchedule") throw new Error("provider")
        const scheduleId =
          behavior.scheduleIds.shift() ?? behavior.configuredScheduleId
        calls.push(["createSchedule", scheduleId])
        return {
          id: scheduleId,
          subscriptionId: external.id,
          customerId: external.customerId,
          released: false,
        }
      },
      requestDowngrade: async () => {
        calls.push(["downgrade"])
        if (behavior.fail === "downgrade") throw new Error("provider")
        if (behavior.configuredTarget) {
          return {
            outcome: "already_configured",
            scheduleId: behavior.configuredScheduleId,
            pendingPriceId: planPrice[behavior.configuredTarget],
            pendingPlanCode: behavior.configuredTarget,
            pendingEffectiveAt: local.currentPeriodEnd,
          }
        }
        return { outcome: "requested" }
      },
      releaseSchedule: async () => {
        calls.push(["release"])
        if (behavior.fail === "release") throw new Error("provider")
        return behavior.releaseAlready ? "already_released" : "requested"
      },
    },
  })
  const endAttempt = () => {
    assert.ok(attempt)
    attempt = {
      ...attempt,
      state: "ended",
      revision: attempt.revision + 1,
      ended_at: "2026-09-12T00:01:00.000Z",
    }
    completedAttempts.push(attempt)
    attempt = null
  }
  return {
    run,
    calls,
    local,
    external,
    behavior,
    completedAttempts,
    openAttempt: () => attempt,
    projectDowngrade(target, scheduleId) {
      local.stripeSubscriptionScheduleId = scheduleId
      local.pendingStripePriceId = planPrice[target]
      local.pendingPlanCode = target
      local.pendingEffectiveAt = local.currentPeriodEnd
      external.scheduleId = scheduleId
      endAttempt()
    },
    projectCancellation() {
      local.stripeSubscriptionScheduleId = null
      local.pendingStripePriceId = null
      local.pendingPlanCode = null
      local.pendingEffectiveAt = null
      external.scheduleId = null
      endAttempt()
    },
  }
}

for (const [patch, status] of [
  [{ userId: null }, "unauthenticated"],
  [{ orgId: null }, "no_active_organization"],
  [{ isAdmin: false }, "not_admin"],
]) {
  test(`authorization: ${status} stops before tenant/provider work`, async () => {
    const f = fixture()
    const base = f.run
    const run = createSubscriptionManagement({
      getAuth: async () => ({
        userId: "user",
        orgId: "org",
        isAdmin: true,
        ...patch,
      }),
      isPlanCode: (value) => plans.includes(value),
      getConfiguration: () => {
        throw new Error("not reached")
      },
      repository: {
        findOrganization: async () => {
          throw new Error("not reached")
        },
      },
      stripe: {},
    })
    assert.deepEqual(await run("multi_2"), { status })
    assert.ok(base)
  })
}

for (const [current, target] of [
  ["essential", "multi_2"],
  ["essential", "multi_3"],
  ["multi_2", "multi_3"],
]) {
  test(`custom downgrade boundary rejects upgrade ${current} -> ${target}`, async () => {
    const f = fixture({ current })
    assert.equal((await f.run(target)).status, "downgrade_only")
    assert.deepEqual(f.calls, [])
  })
}

test("downgrade persists schedule identity before requesting phases", async () => {
  const f = fixture({ current: "multi_3" })
  assert.deepEqual(await f.run("essential"), { status: "downgrade_processing" })
  assert.deepEqual(
    f.calls.map((x) => x[0]),
    [
      "validatePrice",
      "claim",
      "createSchedule",
      "advance",
      "downgrade",
      "advance",
    ]
  )
})

test("downgrade retry reuses the Schedule recorded before a lost phase-update response", async () => {
  const f = fixture({ current: "multi_3" })
  f.behavior.fail = "downgrade"
  assert.deepEqual(await f.run("essential"), {
    status: "billing_recovery_required",
  })

  f.behavior.fail = null
  f.external.scheduleId = "sub_sched_change"
  assert.deepEqual(await f.run("essential"), { status: "downgrade_processing" })
  assert.equal(f.calls.filter(([name]) => name === "createSchedule").length, 1)
  assert.equal(f.calls.filter(([name]) => name === "downgrade").length, 2)
})

test("lost-webhook retry repairs a canonically configured downgrade and resolves its attempt", async () => {
  const f = fixture({ current: "multi_3" })
  f.behavior.fail = "downgrade"
  assert.equal((await f.run("essential")).status, "billing_recovery_required")

  f.behavior.fail = null
  f.behavior.configuredTarget = "essential"
  f.external.scheduleId = "sub_sched_change"
  const repaired = await f.run("essential")
  assert.equal(repaired.status, "downgrade_processing", JSON.stringify(f.calls))
  assert.equal(f.local.planCode, "multi_3")
  assert.equal(f.local.pendingPlanCode, "essential")
  assert.equal(f.calls.filter(([name]) => name === "createSchedule").length, 1)
  assert.equal(f.calls.filter(([name]) => name === "repair").length, 1)

  assert.equal((await f.run("essential")).status, "scheduled_change_exists")
  assert.equal(f.calls.filter(([name]) => name === "createSchedule").length, 1)
  assert.equal(f.calls.filter(([name]) => name === "downgrade").length, 2)
  assert.equal(f.calls.filter(([name]) => name === "repair").length, 1)
})

for (const [name, patch] of [
  ["provider target mismatch", { configuredTarget: "multi_2" }],
  [
    "wrong Schedule correlation",
    { configuredTarget: "essential", configuredScheduleId: "sub_sched_other" },
  ],
]) {
  test(`lost-webhook recovery rejects ${name}`, async () => {
    const f = fixture({ current: "multi_3" })
    f.behavior.fail = "downgrade"
    assert.equal((await f.run("essential")).status, "billing_recovery_required")
    f.behavior.fail = null
    Object.assign(f.behavior, patch)
    f.external.scheduleId = "sub_sched_change"
    assert.equal((await f.run("essential")).status, "billing_recovery_required")
    assert.equal(f.calls.filter(([call]) => call === "repair").length, 0)
    assert.equal(
      f.calls.filter(([call]) => call === "createSchedule").length,
      1
    )
  })
}

for (const [current, target] of [
  ["multi_3", "multi_2"],
  ["multi_3", "essential"],
  ["multi_2", "essential"],
]) {
  test(`approved downgrade ${current} -> ${target} leaves current authority unchanged`, async () => {
    const f = fixture({ current })
    assert.equal((await f.run(target)).status, "downgrade_processing")
    assert.equal(f.local.planCode, current)
    assert.equal(f.local.pendingPlanCode, null)
  })
}

test("cancel releases only the projected schedule", async () => {
  const f = fixture({ current: "multi_2", scheduleId: "sub_sched_change" })
  assert.deepEqual(await f.run(null), { status: "cancellation_processing" })
  assert.deepEqual(
    f.calls.map((x) => x[0]),
    ["claim", "release", "advance"]
  )
})

test("an already released Schedule repairs the missed cancellation webhook", async () => {
  const f = fixture({ current: "multi_2", scheduleId: "sub_sched_change" })
  f.behavior.releaseAlready = true
  assert.deepEqual(await f.run(null), { status: "cancellation_processing" })
  assert.equal(f.local.pendingPlanCode, null)
  assert.deepEqual(
    f.calls.map((x) => x[0]),
    ["claim", "release", "repairCancellation"]
  )
})

for (const secondTarget of ["essential", "multi_2"]) {
  test(`schedule, release, and reschedule ${secondTarget} creates a new canonical Schedule`, async () => {
    const f = fixture({ current: "multi_3" })
    f.behavior.scheduleIds.push("sub_sched_first", "sub_sched_second")

    assert.equal((await f.run("essential")).status, "downgrade_processing")
    f.projectDowngrade("essential", "sub_sched_first")

    assert.equal((await f.run(null)).status, "cancellation_processing")
    f.projectCancellation()

    assert.equal((await f.run(secondTarget)).status, "downgrade_processing")
    f.projectDowngrade(secondTarget, "sub_sched_second")

    assert.deepEqual(
      f.calls.filter(([name]) => name === "createSchedule"),
      [
        ["createSchedule", "sub_sched_first"],
        ["createSchedule", "sub_sched_second"],
      ]
    )
    assert.equal(f.local.planCode, "multi_3")
    assert.equal(f.local.stripeSubscriptionScheduleId, "sub_sched_second")
    assert.equal(f.local.pendingPlanCode, secondTarget)
    assert.equal(f.local.pendingStripePriceId, planPrice[secondTarget])
    assert.equal(f.local.pendingEffectiveAt, f.local.currentPeriodEnd)
    assert.equal(f.openAttempt(), null)
    assert.deepEqual(
      f.completedAttempts.map((value) => [
        value.operation_kind,
        value.state,
        value.stripe_subscription_schedule_id,
      ]),
      [
        ["schedule_downgrade", "ended", "sub_sched_first"],
        ["cancel_scheduled_downgrade", "ended", "sub_sched_first"],
        ["schedule_downgrade", "ended", "sub_sched_second"],
      ]
    )
  })
}

for (const [name, setup, target, expected] of [
  [
    "scheduled downgrade",
    { current: "multi_3" },
    "essential",
    "downgrade_processing",
  ],
  [
    "scheduled-downgrade cancellation",
    { current: "multi_2", scheduleId: "sub_sched_change" },
    null,
    "cancellation_processing",
  ],
]) {
  test(`webhook-ended CAS race converges as success for ${name}`, async () => {
    const f = fixture(setup)
    f.behavior.staleOnState = "requested"
    assert.equal((await f.run(target)).status, expected)
    assert.equal(f.calls.at(-1)[0], "advance")
  })

  test(`webhook-ended CAS race fails closed on projection mismatch for ${name}`, async () => {
    const f = fixture(setup)
    f.behavior.staleOnState = "requested"
    f.behavior.staleWithoutProjection = true
    assert.equal((await f.run(target)).status, "billing_recovery_required")
  })
}

test("provider/local mismatch fails closed before mutation", async () => {
  const f = fixture()
  f.external.priceId = "price_other"
  assert.deepEqual(await f.run("multi_2"), {
    status: "subscription_not_manageable",
  })
  assert.deepEqual(f.calls, [])
})

test("provider pending update blocks a custom downgrade", async () => {
  const f = fixture({ current: "multi_3" })
  f.external.pendingPriceId = "price_duo"
  assert.deepEqual(await f.run("essential"), {
    status: "subscription_not_manageable",
  })
  assert.equal(f.local.planCode, "multi_3")
  assert.deepEqual(f.calls, [["validatePrice"]])
})

for (const failure of ["createSchedule", "downgrade", "release"]) {
  test(`provider failure at ${failure} is retained for safe recovery`, async () => {
    const setup =
      failure === "release"
        ? { current: "multi_2", scheduleId: "sub_sched_change" }
        : { current: "multi_3" }
    const f = fixture(setup)
    f.behavior.fail = failure
    const target = failure === "release" ? null : "essential"
    assert.deepEqual(await f.run(target), {
      status: "billing_recovery_required",
    })
    assert.equal(f.calls.at(-1)[1], "recovery_required")
  })
}
