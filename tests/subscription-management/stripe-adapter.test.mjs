import "./runtime.mjs"
import assert from "node:assert/strict"
import test from "node:test"
const { createSubscriptionManagementStripeAdapter } =
  await import("../../lib/stripe/subscription-management.internal.ts")

const attempt = {
  id: "20000000-0000-4000-8000-000000000002",
  target_stripe_price_id: "price_duo",
  stripe_subscription_schedule_id: "sub_sched_change",
  expected_period_end: "2026-10-12T00:00:00.000Z",
  livemode: false,
}
const subscription = {
  id: "sub_subscription",
  customerId: "cus_customer",
  priceId: "price_essential",
  planCode: "essential",
  status: "active",
  currentPeriodEnd: attempt.expected_period_end,
  cancelAtPeriodEnd: false,
  collectionPaused: false,
  scheduleId: null,
  pendingPriceId: null,
  livemode: false,
}

test("schedule creation and release use separate deterministic keys and never cancel", async () => {
  const calls = []
  const schedule = {
    id: "sub_sched_change",
    object: "subscription_schedule",
    livemode: false,
    subscription: "sub_subscription",
    customer: "cus_customer",
    status: "active",
  }
  const adapter = createSubscriptionManagementStripeAdapter(
    () => ({
      subscriptionSchedules: {
        create: async (...args) => {
          calls.push(["create", ...args])
          return schedule
        },
        retrieve: async (...args) => {
          calls.push(["retrieve", ...args])
          return schedule
        },
        release: async (...args) => {
          calls.push(["release", ...args])
          return {
            ...schedule,
            status: "released",
            subscription: null,
            released_subscription: "sub_subscription",
          }
        },
      },
    }),
    () => "essential"
  )
  await adapter.createSchedule(
    { ...attempt, stripe_subscription_schedule_id: null },
    subscription
  )
  assert.equal(
    await adapter.releaseSchedule(attempt, {
      ...subscription,
      scheduleId: "sub_sched_change",
    }),
    "requested"
  )
  assert.deepEqual(calls[0][1], { from_subscription: "sub_subscription" })
  assert.match(calls[0][2].idempotencyKey, /:schedule-create$/u)
  assert.deepEqual(calls[2][2], { preserve_cancel_date: false })
  assert.match(calls[2][3].idempotencyKey, /:schedule-release$/u)
})

test("downgrade accepts the inherited collection method from a from_subscription Schedule", async () => {
  const boundary = Date.parse(attempt.expected_period_end) / 1000
  const basePhase = {
    start_date: boundary - 2_592_000,
    end_date: boundary,
    items: [{ price: "price_essential", quantity: 1 }],
    add_invoice_items: [],
    application_fee_percent: null,
    billing_thresholds: null,
    discounts: [],
    default_tax_rates: [],
    invoice_settings: null,
    on_behalf_of: null,
    transfer_data: null,
    trial_end: null,
    collection_method: null,
    currency: "brl",
    automatic_tax: { enabled: false },
    description: null,
    default_payment_method: null,
    metadata: {},
    proration_behavior: "create_prorations",
  }
  let updateCall
  const baseSchedule = {
    id: "sub_sched_change",
    object: "subscription_schedule",
    livemode: false,
    subscription: "sub_subscription",
    released_subscription: null,
    customer: "cus_customer",
    status: "active",
    end_behavior: "release",
    phases: [basePhase],
  }
  const adapter = createSubscriptionManagementStripeAdapter(
    () => ({
      subscriptionSchedules: {
        retrieve: async () => baseSchedule,
        update: async (...args) => {
          updateCall = args
          return {
            ...baseSchedule,
            phases: [
              basePhase,
              {
                ...basePhase,
                start_date: boundary,
                end_date: boundary + 2_592_000,
                items: [{ price: "price_duo", quantity: 1 }],
              },
            ],
          }
        },
      },
    }),
    () => "essential"
  )
  await adapter.requestDowngrade(attempt, subscription, {
    id: "sub_sched_change",
    subscriptionId: subscription.id,
    customerId: subscription.customerId,
    released: false,
  })
  assert.equal(updateCall[1].end_behavior, "release")
  assert.equal(updateCall[1].proration_behavior, "none")
  assert.equal(updateCall[1].phases.length, 2)
  assert.equal(updateCall[1].phases[0].end_date, boundary)
  assert.deepEqual(updateCall[1].phases[1].duration, {
    interval: "month",
    interval_count: 1,
  })
  assert.equal(updateCall[1].phases[1].billing_cycle_anchor, "phase_start")
  assert.ok(
    updateCall[1].phases.every(
      (phase) =>
        phase.proration_behavior === "none" && phase.items[0].quantity === 1
    )
  )
})

test("lost-webhook recovery reads the real two-phase Schedule without updating it again", async () => {
  const recoveryAttempt = {
    ...attempt,
    state: "recovery_required",
    target_stripe_price_id: "price_essential",
  }
  const recoverySubscription = {
    ...subscription,
    priceId: "price_trio",
    planCode: "multi_3",
    scheduleId: "sub_sched_change",
  }
  const boundary = Date.parse(attempt.expected_period_end) / 1000
  const phase = (price, start, end, billingCycleAnchor) => ({
    start_date: start,
    end_date: end,
    items: [{ price, quantity: 1 }],
    add_invoice_items: [],
    application_fee_percent: null,
    billing_cycle_anchor: billingCycleAnchor,
    billing_thresholds: null,
    discounts: [],
    default_tax_rates: [],
    invoice_settings: null,
    on_behalf_of: null,
    transfer_data: null,
    trial_end: null,
    collection_method: "charge_automatically",
    currency: "brl",
    automatic_tax: { enabled: false, liability: null },
    description: null,
    default_payment_method: null,
    metadata: {},
    proration_behavior: "none",
  })
  const configuredSchedule = {
    id: "sub_sched_change",
    object: "subscription_schedule",
    livemode: false,
    subscription: "sub_subscription",
    released_subscription: null,
    customer: "cus_customer",
    status: "active",
    end_behavior: "release",
    phases: [
      phase("price_trio", boundary - 2_592_000, boundary, null),
      phase("price_essential", boundary, boundary + 2_592_000, "phase_start"),
    ],
  }
  let updates = 0
  const adapter = createSubscriptionManagementStripeAdapter(
    () => ({
      subscriptionSchedules: {
        retrieve: async () => configuredSchedule,
        update: async () => {
          updates += 1
          return configuredSchedule
        },
      },
    }),
    (price) =>
      price === "price_trio"
        ? "multi_3"
        : price === "price_essential"
          ? "essential"
          : "multi_2"
  )

  assert.deepEqual(
    await adapter.requestDowngrade(recoveryAttempt, recoverySubscription, {
      id: "sub_sched_change",
      subscriptionId: "sub_subscription",
      customerId: "cus_customer",
      released: false,
    }),
    {
      outcome: "already_configured",
      scheduleId: "sub_sched_change",
      pendingPriceId: "price_essential",
      pendingPlanCode: "essential",
      pendingEffectiveAt: attempt.expected_period_end,
    }
  )
  assert.equal(updates, 0)

  for (const mismatch of [
    { subscription: "sub_other" },
    { customer: "cus_other" },
  ]) {
    const mismatchedAdapter = createSubscriptionManagementStripeAdapter(
      () => ({
        subscriptionSchedules: {
          retrieve: async () => ({ ...configuredSchedule, ...mismatch }),
          update: async () => {
            throw new Error("must not mutate a mismatched Schedule")
          },
        },
      }),
      (price) => (price === "price_trio" ? "multi_3" : "essential")
    )
    await assert.rejects(() =>
      mismatchedAdapter.requestDowngrade(
        recoveryAttempt,
        recoverySubscription,
        {
          id: "sub_sched_change",
          subscriptionId: "sub_subscription",
          customerId: "cus_customer",
          released: false,
        }
      )
    )
  }
})
