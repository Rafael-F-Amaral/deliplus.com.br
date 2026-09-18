import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

import Stripe from "stripe"

import {
  PlanPriceConfigurationError,
  resolvePlanCodeFromStripePriceIdFromEnvironment,
  UnknownStripePriceError,
} from "../../lib/billing/plans.ts"
import {
  BILLING_SUBSCRIPTION_STATUSES,
  reduceStripeSubscription,
  reduceStripeSubscriptionManagement,
  StripeSubscriptionNormalizationError,
} from "../../lib/billing/subscription-reducer.ts"
import { resolveStripeSubscriptionReconciliationContext } from "../../lib/billing/webhook-events.ts"
import {
  processStripeWebhookEventWithDependencies,
  StripeWebhookProcessingError,
} from "../../lib/billing/webhooks.internal.ts"
import {
  constructVerifiedStripeEvent,
  StripeWebhookSignatureError,
} from "../../lib/stripe/webhook-signature.internal.ts"
import {
  parseStripeApiLivemode,
  parseStripeWebhookSecret,
  StripeConfigurationError,
} from "../../lib/stripe/config.internal.ts"

const priceEnvironment = {
  STRIPE_PRICE_ESSENTIAL: "price_essential123",
  STRIPE_PRICE_MULTI_2: "price_multi2123",
  STRIPE_PRICE_MULTI_3: "price_multi3123",
}

const resolvePlanCode = (stripePriceId) =>
  resolvePlanCodeFromStripePriceIdFromEnvironment(
    stripePriceId,
    priceEnvironment
  )

function createSubscription(overrides = {}) {
  const itemOverrides = overrides.item ?? {}
  const { price: priceOverrides = {}, ...itemFields } = itemOverrides

  return {
    id: "sub_current123",
    customer: "cus_current123",
    status: "active",
    cancel_at_period_end: false,
    pause_collection: null,
    items: {
      data: [
        {
          id: "si_current123",
          quantity: 1,
          current_period_end: 1_800_000_000,
          price: {
            id: "price_essential123",
            type: "recurring",
            recurring: { interval: "month" },
            ...priceOverrides,
          },
          ...itemFields,
        },
      ],
      has_more: false,
      ...overrides.items,
    },
    ...overrides,
  }
}

function createEvent(type, overrides = {}) {
  const subscriptionObject = {
    id: "sub_current123",
    customer: "cus_current123",
  }
  let object

  if (type.startsWith("customer.subscription.")) {
    object = subscriptionObject
  } else if (type.startsWith("subscription_schedule.")) {
    object = {
      id: "sub_sched_current123",
      customer: "cus_current123",
      subscription:
        type === "subscription_schedule.released" ? null : "sub_current123",
      released_subscription:
        type === "subscription_schedule.released" ? "sub_current123" : null,
    }
  } else if (type === "checkout.session.completed") {
    object = {
      id: "cs_test_current123",
      mode: "subscription",
      customer: "cus_current123",
      subscription: "sub_current123",
    }
  } else if (type.startsWith("invoice.")) {
    object = {
      id: "in_current123",
      customer: "cus_current123",
      parent: {
        type: "subscription_details",
        subscription_details: {
          subscription: "sub_current123",
        },
      },
    }
  } else {
    object = { id: "prod_unrelated123" }
  }

  return {
    id: "evt_current123",
    object: "event",
    created: 1_800_000_000,
    livemode: false,
    type,
    data: { object },
    ...overrides,
  }
}

function createProcessingHarness(overrides = {}) {
  const calls = {
    mode: 0,
    processed: [],
    retrieved: [],
    applied: [],
  }

  const dependencies = {
    getExpectedLivemode() {
      calls.mode += 1
      return false
    },
    resolveContext: resolveStripeSubscriptionReconciliationContext,
    async isEventProcessed(eventId) {
      calls.processed.push(eventId)
      return false
    },
    async retrieveSubscription(subscriptionId) {
      calls.retrieved.push(subscriptionId)
      return createSubscription()
    },
    resolvePlanCode,
    reduceSubscription: reduceStripeSubscription,
    async applyProjection(input) {
      calls.applied.push(input)
      return "applied"
    },
    ...overrides,
  }

  return { calls, dependencies }
}

test("Stripe webhook configuration is lazy, secret-safe, and mode-aware", () => {
  const testSecretKey = ["sk", "test", "unit123"].join("_")
  const liveRestrictedKey = ["rk", "live", "unit123"].join("_")

  assert.equal(
    parseStripeWebhookSecret({ STRIPE_WEBHOOK_SECRET: "whsec_unit123" }),
    "whsec_unit123"
  )
  assert.equal(
    parseStripeApiLivemode({ STRIPE_SECRET_KEY: testSecretKey }),
    false
  )
  assert.equal(
    parseStripeApiLivemode({ STRIPE_SECRET_KEY: liveRestrictedKey }),
    true
  )
  assert.throws(() => parseStripeWebhookSecret({}), StripeConfigurationError)
  assert.throws(
    () =>
      parseStripeWebhookSecret({
        STRIPE_WEBHOOK_SECRET: "not-a-webhook-secret",
      }),
    (error) => {
      assert.ok(error instanceof StripeConfigurationError)
      assert.doesNotMatch(error.message, /not-a-webhook-secret/u)
      return true
    }
  )
})

test("Price IDs resolve to exactly one approved PlanCode", () => {
  assert.equal(resolvePlanCode("price_essential123"), "essential")
  assert.equal(resolvePlanCode("price_multi2123"), "multi_2")
  assert.equal(resolvePlanCode("price_multi3123"), "multi_3")
})

test("unknown, invalid, and ambiguously configured Prices fail closed", () => {
  assert.throws(
    () => resolvePlanCode("price_unknown123"),
    UnknownStripePriceError
  )
  assert.throws(
    () => resolvePlanCode("product_not_price"),
    UnknownStripePriceError
  )
  assert.throws(
    () =>
      resolvePlanCodeFromStripePriceIdFromEnvironment("price_duplicate123", {
        STRIPE_PRICE_ESSENTIAL: "price_duplicate123",
        STRIPE_PRICE_MULTI_2: "price_duplicate123",
      }),
    UnknownStripePriceError
  )
  assert.throws(
    () =>
      resolvePlanCodeFromStripePriceIdFromEnvironment("price_essential123", {
        STRIPE_PRICE_ESSENTIAL: "price_essential123",
        STRIPE_PRICE_MULTI_2: "invalid",
      }),
    PlanPriceConfigurationError
  )
})

test("the reducer accepts every schema-approved Stripe status", () => {
  for (const status of BILLING_SUBSCRIPTION_STATUSES) {
    const projection = reduceStripeSubscription(
      createSubscription({ status }),
      resolvePlanCode
    )

    assert.equal(projection.status, status)
  }
})

test("the reducer uses the one Subscription Item period and Price", () => {
  const projection = reduceStripeSubscription(
    createSubscription({
      cancel_at_period_end: true,
      pause_collection: {
        behavior: "keep_as_draft",
        resumes_at: null,
      },
      item: {
        current_period_end: 1_800_000_000,
        price: {
          id: "price_multi2123",
        },
      },
    }),
    resolvePlanCode
  )

  assert.deepEqual(projection, {
    stripeSubscriptionId: "sub_current123",
    stripeCustomerId: "cus_current123",
    stripePriceId: "price_multi2123",
    planCode: "multi_2",
    status: "active",
    currentPeriodEnd: new Date(1_800_000_000 * 1000).toISOString(),
    cancelAtPeriodEnd: true,
    collectionPaused: true,
  })
})

test("zero, multiple, paginated, and non-unit Subscription items fail closed", () => {
  for (const subscription of [
    createSubscription({ items: { data: [] } }),
    createSubscription({
      items: {
        data: [
          createSubscription().items.data[0],
          createSubscription().items.data[0],
        ],
      },
    }),
    createSubscription({ items: { has_more: true } }),
    createSubscription({ item: { quantity: 2 } }),
  ]) {
    assert.throws(
      () => reduceStripeSubscription(subscription, resolvePlanCode),
      StripeSubscriptionNormalizationError
    )
  }
})

test("non-recurring Prices and invalid item periods fail closed", () => {
  assert.throws(
    () =>
      reduceStripeSubscription(
        createSubscription({
          item: { price: { type: "one_time", recurring: null } },
        }),
        resolvePlanCode
      ),
    StripeSubscriptionNormalizationError
  )
  assert.throws(
    () =>
      reduceStripeSubscription(
        createSubscription({ item: { current_period_end: undefined } }),
        resolvePlanCode
      ),
    StripeSubscriptionNormalizationError
  )
})

test("management reducer keeps current plan and projects only the canonical target phase", () => {
  const boundary = 1_800_000_000
  const subscription = createSubscription({
    schedule: "sub_sched_current123",
    metadata: { plan_code: "multi_2" },
    item: { price: { id: "price_multi3123" } },
  })
  const schedule = {
    id: "sub_sched_current123",
    customer: "cus_current123",
    subscription: "sub_current123",
    status: "active",
    end_behavior: "release",
    phases: [
      {
        start_date: boundary - 2_592_000,
        end_date: boundary,
        items: [{ price: "price_multi3123", quantity: 1 }],
      },
      {
        start_date: boundary,
        end_date: boundary + 2_592_000,
        items: [{ price: "price_essential123", quantity: 1 }],
      },
    ],
  }
  const projection = reduceStripeSubscriptionManagement(
    subscription,
    schedule,
    resolvePlanCode
  )
  assert.equal(projection.planCode, "multi_3")
  assert.equal(projection.pendingPlanCode, "essential")
  assert.equal(
    projection.pendingEffectiveAt,
    new Date(boundary * 1000).toISOString()
  )
})

test("real Stripe Schedule-attachment snapshot keeps stale acquisition metadata out of current-plan authority", () => {
  const boundary = 1_800_000_000
  const subscription = createSubscription({
    collection_method: "charge_automatically",
    metadata: {
      plan_code: "multi_2",
      organization_id: "10000000-0000-4000-8000-000000000001",
      checkout_attempt_id: "20000000-0000-4000-8000-000000000002",
    },
    schedule: "sub_sched_current123",
    item: {
      quantity: 1,
      price: {
        id: "price_multi3123",
        active: true,
        currency: "brl",
        livemode: false,
        type: "recurring",
        recurring: {
          interval: "month",
          interval_count: 1,
          usage_type: "licensed",
        },
      },
    },
  })
  const schedule = {
    id: "sub_sched_current123",
    customer: "cus_current123",
    subscription: "sub_current123",
    status: "active",
    end_behavior: "release",
    phases: [
      {
        start_date: boundary - 2_592_000,
        end_date: boundary,
        items: [{ price: "price_multi3123", quantity: 1 }],
      },
    ],
  }

  assert.deepEqual(
    reduceStripeSubscriptionManagement(subscription, schedule, resolvePlanCode),
    {
      stripeSubscriptionId: "sub_current123",
      stripeCustomerId: "cus_current123",
      stripePriceId: "price_multi3123",
      planCode: "multi_3",
      status: "active",
      currentPeriodEnd: new Date(boundary * 1000).toISOString(),
      cancelAtPeriodEnd: false,
      collectionPaused: false,
      stripeSubscriptionScheduleId: null,
      pendingStripePriceId: null,
      pendingPlanCode: null,
      pendingEffectiveAt: null,
    }
  )
})

test("management reducer rejects a Schedule target that is not a lower plan", () => {
  const boundary = 1_800_000_000
  const subscription = createSubscription({ schedule: "sub_sched_current123" })
  const schedule = {
    id: "sub_sched_current123",
    customer: "cus_current123",
    subscription: "sub_current123",
    status: "active",
    end_behavior: "release",
    phases: [
      {
        start_date: boundary - 2_592_000,
        end_date: boundary,
        items: [{ price: "price_essential123", quantity: 1 }],
      },
      {
        start_date: boundary,
        end_date: boundary + 2_592_000,
        items: [{ price: "price_multi2123", quantity: 1 }],
      },
    ],
  }
  assert.throws(
    () =>
      reduceStripeSubscriptionManagement(
        subscription,
        schedule,
        resolvePlanCode
      ),
    StripeSubscriptionNormalizationError
  )
})

test("supported events resolve the canonical Subscription and Customer", () => {
  for (const type of [
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.paid",
    "invoice.payment_failed",
    "subscription_schedule.updated",
    "subscription_schedule.released",
    "subscription_schedule.completed",
    "subscription_schedule.canceled",
    "subscription_schedule.aborted",
  ]) {
    assert.deepEqual(
      resolveStripeSubscriptionReconciliationContext(createEvent(type)),
      {
        eventType: type,
        stripeObjectId:
          type === "checkout.session.completed"
            ? "cs_test_current123"
            : type.startsWith("invoice.")
              ? "in_current123"
              : type.startsWith("subscription_schedule.")
                ? "sub_sched_current123"
                : "sub_current123",
        stripeSubscriptionId: "sub_current123",
        stripeCustomerId: "cus_current123",
      }
    )
  }
})

test("unrelated events, non-subscription Checkout, and non-subscription invoices are ignored", () => {
  assert.equal(
    resolveStripeSubscriptionReconciliationContext(
      createEvent("product.updated")
    ),
    null
  )
  assert.equal(
    resolveStripeSubscriptionReconciliationContext(
      createEvent("checkout.session.completed", {
        data: {
          object: {
            id: "cs_test_payment123",
            mode: "payment",
          },
        },
      })
    ),
    null
  )
  assert.equal(
    resolveStripeSubscriptionReconciliationContext(
      createEvent("invoice.paid", {
        data: {
          object: {
            id: "in_manual123",
            customer: "cus_current123",
            parent: null,
          },
        },
      })
    ),
    null
  )
})

test("unsupported events return success semantics without dependencies", async () => {
  const { calls, dependencies } = createProcessingHarness({
    getExpectedLivemode() {
      throw new Error("must not run")
    },
  })

  assert.equal(
    await processStripeWebhookEventWithDependencies(
      createEvent("product.updated"),
      dependencies
    ),
    "ignored"
  )
  assert.equal(calls.processed.length, 0)
  assert.equal(calls.retrieved.length, 0)
  assert.equal(calls.applied.length, 0)
})

test("supported events reconcile through one current-snapshot projection path", async () => {
  for (const type of [
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.paid",
    "invoice.payment_failed",
    "subscription_schedule.updated",
    "subscription_schedule.released",
    "subscription_schedule.completed",
    "subscription_schedule.canceled",
    "subscription_schedule.aborted",
  ]) {
    const { calls, dependencies } = createProcessingHarness()
    const result = await processStripeWebhookEventWithDependencies(
      createEvent(type),
      dependencies
    )

    assert.equal(result, "applied")
    assert.deepEqual(calls.retrieved, ["sub_current123"])
    assert.equal(calls.applied.length, 1)
    assert.equal(calls.applied[0].subscription.status, "active")
  }
})

test("a processed Event ID is a duplicate no-op", async () => {
  const { calls, dependencies } = createProcessingHarness({
    async isEventProcessed(eventId) {
      calls.processed.push(eventId)
      return true
    },
  })

  assert.equal(
    await processStripeWebhookEventWithDependencies(
      createEvent("customer.subscription.updated"),
      dependencies
    ),
    "duplicate"
  )
  assert.equal(calls.retrieved.length, 0)
  assert.equal(calls.applied.length, 0)
})

test("Test and Live mode mismatch fails before database or Stripe calls", async () => {
  const { calls, dependencies } = createProcessingHarness()

  await assert.rejects(
    processStripeWebhookEventWithDependencies(
      createEvent("customer.subscription.updated", { livemode: true }),
      dependencies
    ),
    StripeWebhookProcessingError
  )
  assert.equal(calls.processed.length, 0)
  assert.equal(calls.retrieved.length, 0)
})

test("Event and retrieved Subscription Customer mismatch is rejected", async () => {
  const { calls, dependencies } = createProcessingHarness({
    async retrieveSubscription(subscriptionId) {
      calls.retrieved.push(subscriptionId)
      return createSubscription({ customer: "cus_different123" })
    },
  })

  await assert.rejects(
    processStripeWebhookEventWithDependencies(
      createEvent("invoice.paid"),
      dependencies
    ),
    StripeWebhookProcessingError
  )
  assert.equal(calls.applied.length, 0)
})

test("retrieved Subscription identity mismatch is rejected", async () => {
  const { calls, dependencies } = createProcessingHarness({
    async retrieveSubscription(subscriptionId) {
      calls.retrieved.push(subscriptionId)
      return createSubscription({ id: "sub_different123" })
    },
  })

  await assert.rejects(
    processStripeWebhookEventWithDependencies(
      createEvent("customer.subscription.updated"),
      dependencies
    ),
    StripeWebhookProcessingError
  )
  assert.equal(calls.applied.length, 0)
})

test("different out-of-order Events apply the same current Stripe snapshot", async () => {
  const applied = []
  const currentSubscription = createSubscription({
    status: "past_due",
    item: { price: { id: "price_multi3123" } },
  })
  const shared = {
    getExpectedLivemode: () => false,
    resolveContext: resolveStripeSubscriptionReconciliationContext,
    isEventProcessed: async () => false,
    retrieveSubscription: async () => currentSubscription,
    resolvePlanCode,
    reduceSubscription: reduceStripeSubscription,
    async applyProjection(input) {
      applied.push(input.subscription)
      return "applied"
    },
  }

  await processStripeWebhookEventWithDependencies(
    createEvent("customer.subscription.updated", { id: "evt_newer123" }),
    shared
  )
  await processStripeWebhookEventWithDependencies(
    createEvent("customer.subscription.updated", { id: "evt_older123" }),
    shared
  )

  assert.equal(applied.length, 2)
  assert.deepEqual(applied[0], applied[1])
  assert.equal(applied[1].status, "past_due")
  assert.equal(applied[1].planCode, "multi_3")
})

test("a failed projection remains retryable", async () => {
  let attempt = 0
  const { calls, dependencies } = createProcessingHarness({
    async applyProjection(input) {
      calls.applied.push(input)
      attempt += 1
      if (attempt === 1) {
        throw new Error("simulated database failure")
      }
      return "applied"
    },
  })
  const event = createEvent("customer.subscription.updated")

  await assert.rejects(
    processStripeWebhookEventWithDependencies(event, dependencies),
    /simulated database failure/u
  )
  assert.equal(
    await processStripeWebhookEventWithDependencies(event, dependencies),
    "applied"
  )
  assert.equal(calls.applied.length, 2)
})

test("unknown canonical Customer failures are not converted into success", async () => {
  const { dependencies } = createProcessingHarness({
    async applyProjection() {
      throw new Error("canonical customer missing")
    },
  })

  await assert.rejects(
    processStripeWebhookEventWithDependencies(
      createEvent("customer.subscription.created"),
      dependencies
    ),
    /canonical customer missing/u
  )
})

test("official signature verification accepts exact raw bytes only", () => {
  const stripe = new Stripe(["sk", "test", "signature123"].join("_"))
  const webhookSecret = ["whsec", "signature123"].join("_")
  const rawBody = JSON.stringify(createEvent("product.updated"))
  const signature = stripe.webhooks.generateTestHeaderString({
    payload: rawBody,
    secret: webhookSecret,
  })

  assert.equal(
    constructVerifiedStripeEvent({
      stripe,
      rawBody,
      signature,
      webhookSecret,
    }).id,
    "evt_current123"
  )
  assert.throws(
    () =>
      constructVerifiedStripeEvent({
        stripe,
        rawBody: `${rawBody} `,
        signature,
        webhookSecret,
      }),
    StripeWebhookSignatureError
  )
  assert.throws(
    () =>
      constructVerifiedStripeEvent({
        stripe,
        rawBody,
        signature: null,
        webhookSecret,
      }),
    StripeWebhookSignatureError
  )
})

test("the Route Handler preserves raw body and exposes only POST", async () => {
  const routeSource = await readFile(
    new URL("../../app/api/stripe/webhook/route.ts", import.meta.url),
    "utf8"
  )

  assert.match(routeSource, /export const runtime = "nodejs"/u)
  assert.match(routeSource, /await request\.text\(\)/u)
  assert.match(routeSource, /headers\.get\("stripe-signature"\)/u)
  assert.match(routeSource, /export async function POST/u)
  assert.doesNotMatch(routeSource, /request\.json\(/u)
  assert.doesNotMatch(
    routeSource,
    /export async function (?:GET|PUT|PATCH|DELETE)/u
  )
  assert.doesNotMatch(routeSource, /auth\(|currentUser|@clerk/u)
})

test("the trusted webhook layer does not mutate trials or expose generic admin CRUD", async () => {
  const webhookSource = await readFile(
    new URL("../../lib/billing/webhooks.ts", import.meta.url),
    "utf8"
  )
  const projectionSource = await readFile(
    new URL("../../lib/billing/subscription-projection.ts", import.meta.url),
    "utf8"
  )

  assert.match(webhookSource, /import "server-only"/u)
  assert.match(projectionSource, /import "server-only"/u)
  assert.doesNotMatch(
    `${webhookSource}\n${projectionSource}`,
    /billing_trial_grants|\.insert\(|\.update\(|\.delete\(/u
  )
  assert.match(
    projectionSource,
    /apply_stripe_subscription_management_projection/u
  )
})
