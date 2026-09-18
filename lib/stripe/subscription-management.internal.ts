import "server-only"

import type Stripe from "stripe"
import { validateCheckoutPrice } from "./checkout.internal"
import type {
  ProviderSchedule,
  ProviderSubscription,
  ProviderConfiguredDowngrade,
  SubscriptionChangeAttempt,
  SubscriptionManagementConfiguration,
  SubscriptionManagementProvider,
} from "../billing/subscription-management.internal"
import type { PlanCode } from "../billing/plans"
import {
  BILLING_SUBSCRIPTION_STATUSES,
  type BillingSubscriptionStatus,
} from "../billing/subscription-reducer"

type ManagementSdk = Pick<
  Stripe,
  "prices" | "subscriptions" | "subscriptionSchedules"
>
const requestOptions = { maxNetworkRetries: 2, timeout: 10_000 } as const

function invariant(value: unknown): asserts value {
  if (!value) throw new Error("Invalid Stripe subscription-management contract")
}

function id(value: unknown, prefix: string) {
  const result =
    typeof value === "string"
      ? value
      : value && typeof value === "object" && "id" in value
        ? value.id
        : null
  invariant(
    typeof result === "string" &&
      new RegExp(`^${prefix}_[A-Za-z0-9]+$`, "u").test(result)
  )
  return result
}

function scheduleId(value: Stripe.Subscription["schedule"]) {
  return value === null ? null : id(value, "sub_sched")
}

function normalizeSubscription(
  subscription: Stripe.Subscription,
  config: SubscriptionManagementConfiguration,
  resolvePlan: (priceId: string) => PlanCode
): ProviderSubscription {
  invariant(
    subscription.object === "subscription" &&
      subscription.livemode === config.livemode &&
      subscription.collection_method === "charge_automatically" &&
      subscription.items.has_more === false &&
      subscription.items.data.length === 1 &&
      BILLING_SUBSCRIPTION_STATUSES.includes(
        subscription.status as BillingSubscriptionStatus
      )
  )
  const item = subscription.items.data[0]
  invariant(
    item.quantity === 1 &&
      item.price.active &&
      item.price.livemode === config.livemode &&
      item.price.currency === "brl" &&
      item.price.type === "recurring" &&
      item.price.recurring?.interval === "month" &&
      item.price.recurring.interval_count === 1 &&
      item.price.recurring.usage_type === "licensed" &&
      item.price.billing_scheme === "per_unit" &&
      item.price.transform_quantity === null &&
      item.price.tiers_mode === null
  )
  const priceId = id(item.price, "price")
  const pendingItem = subscription.pending_update?.subscription_items?.[0]
  return {
    id: id(subscription, "sub"),
    customerId: id(subscription.customer, "cus"),
    priceId,
    planCode: resolvePlan(priceId),
    status: subscription.status as BillingSubscriptionStatus,
    currentPeriodEnd: new Date(item.current_period_end * 1000).toISOString(),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    collectionPaused: subscription.pause_collection !== null,
    scheduleId: scheduleId(subscription.schedule),
    pendingPriceId: pendingItem?.price ? id(pendingItem.price, "price") : null,
    livemode: subscription.livemode,
  }
}

function normalizeSchedule(
  schedule: Stripe.SubscriptionSchedule,
  subscription: ProviderSubscription,
  attempt: SubscriptionChangeAttempt
): ProviderSchedule {
  const result = {
    id: id(schedule, "sub_sched"),
    subscriptionId: id(
      schedule.subscription ?? schedule.released_subscription,
      "sub"
    ),
    customerId: id(schedule.customer, "cus"),
    released: ["released", "completed"].includes(schedule.status),
  }
  invariant(
    schedule.object === "subscription_schedule" &&
      schedule.livemode === attempt.livemode &&
      result.subscriptionId === subscription.id &&
      result.customerId === subscription.customerId
  )
  return result
}

function assertSimpleSchedule(schedule: Stripe.SubscriptionSchedule) {
  invariant(
    schedule.end_behavior === "release" &&
      schedule.phases.length >= 1 &&
      schedule.phases.length <= 2
  )
  for (const phase of schedule.phases) {
    invariant(
      phase.add_invoice_items.length === 0 &&
        phase.application_fee_percent === null &&
        phase.billing_thresholds === null &&
        phase.discounts.length === 0 &&
        (phase.default_tax_rates?.length ?? 0) === 0 &&
        phase.invoice_settings === null &&
        phase.on_behalf_of === null &&
        phase.transfer_data === null &&
        phase.trial_end === null &&
        phase.items.length === 1 &&
        phase.items[0].quantity === 1 &&
        // from_subscription represents an inherited collection method as null;
        // the owning Subscription was already validated as charge_automatically.
        (phase.collection_method === null ||
          phase.collection_method === "charge_automatically") &&
        phase.currency === "brl" &&
        phase.automatic_tax?.enabled === false &&
        (phase.automatic_tax.liability ?? null) === null &&
        phase.description === null
    )
  }
}

function inspectDowngradeSchedule(
  schedule: Stripe.SubscriptionSchedule,
  subscription: ProviderSubscription,
  attempt: SubscriptionChangeAttempt,
  resolvePlan: (priceId: string) => PlanCode
): ProviderConfiguredDowngrade | null {
  const normalized = normalizeSchedule(schedule, subscription, attempt)
  invariant(normalized.id === attempt.stripe_subscription_schedule_id)
  invariant(schedule.status === "active")
  assertSimpleSchedule(schedule)
  const current = schedule.phases[0]
  invariant(
    current.start_date < current.end_date &&
      id(current.items[0].price, "price") === subscription.priceId &&
      current.end_date === Date.parse(attempt.expected_period_end) / 1000
  )
  if (schedule.phases.length === 1) return null

  const pending = schedule.phases[1]
  invariant(
    current.proration_behavior === "none" &&
      pending.proration_behavior === "none" &&
      pending.billing_cycle_anchor === "phase_start" &&
      pending.start_date === current.end_date &&
      pending.start_date < pending.end_date
  )
  const pendingPriceId = id(pending.items[0].price, "price")
  return {
    outcome: "already_configured",
    scheduleId: normalized.id,
    pendingPriceId,
    pendingPlanCode: resolvePlan(pendingPriceId),
    pendingEffectiveAt: new Date(current.end_date * 1000).toISOString(),
  }
}

export function createSubscriptionManagementStripeAdapter(
  getClient: () => ManagementSdk,
  resolvePlan: (priceId: string) => PlanCode
): SubscriptionManagementProvider {
  return {
    async retrieveSubscription(subscriptionId, config) {
      const value = await getClient().subscriptions.retrieve(
        subscriptionId,
        { expand: ["items.data.price"] },
        requestOptions
      )
      return normalizeSubscription(value, config, resolvePlan)
    },
    async validateTargetPrice(config) {
      validateCheckoutPrice(
        await getClient().prices.retrieve(
          config.stripePriceId,
          {},
          requestOptions
        ),
        config
      )
    },
    async createSchedule(attempt, subscription) {
      const value = await getClient().subscriptionSchedules.create(
        { from_subscription: subscription.id },
        {
          ...requestOptions,
          idempotencyKey: `deli-plus:subscription-change:v1:${attempt.id}:schedule-create`,
        }
      )
      return normalizeSchedule(value, subscription, attempt)
    },
    async requestDowngrade(attempt, subscription, schedule) {
      invariant(attempt.target_stripe_price_id && !schedule.released)
      const current = await getClient().subscriptionSchedules.retrieve(
        schedule.id,
        { expand: ["phases.items.price"] },
        requestOptions
      )
      const configured = inspectDowngradeSchedule(
        current,
        subscription,
        attempt,
        resolvePlan
      )
      if (configured) return configured
      const phase = current.phases[0]
      const updated = await getClient().subscriptionSchedules.update(
        schedule.id,
        {
          end_behavior: "release",
          proration_behavior: "none",
          phases: [
            {
              start_date: phase.start_date,
              end_date: phase.end_date,
              items: [{ price: subscription.priceId, quantity: 1 }],
              collection_method: "charge_automatically",
              currency: "brl",
              automatic_tax: { enabled: false },
              proration_behavior: "none",
              metadata: phase.metadata ?? undefined,
              ...(phase.default_payment_method
                ? {
                    default_payment_method: id(
                      phase.default_payment_method,
                      "pm"
                    ),
                  }
                : {}),
            },
            {
              duration: { interval: "month", interval_count: 1 },
              items: [{ price: attempt.target_stripe_price_id, quantity: 1 }],
              billing_cycle_anchor: "phase_start",
              collection_method: "charge_automatically",
              currency: "brl",
              automatic_tax: { enabled: false },
              proration_behavior: "none",
              metadata: phase.metadata ?? undefined,
              ...(phase.default_payment_method
                ? {
                    default_payment_method: id(
                      phase.default_payment_method,
                      "pm"
                    ),
                  }
                : {}),
            },
          ],
        },
        {
          ...requestOptions,
          idempotencyKey: `deli-plus:subscription-change:v1:${attempt.id}:schedule-update`,
        }
      )
      normalizeSchedule(updated, subscription, attempt)
      invariant(
        updated.status === "active" &&
          updated.end_behavior === "release" &&
          updated.phases.length === 2 &&
          id(updated.phases[1].items[0]?.price, "price") ===
            attempt.target_stripe_price_id
      )
      return { outcome: "requested" }
    },
    async releaseSchedule(attempt, subscription) {
      invariant(attempt.stripe_subscription_schedule_id)
      const schedule = await getClient().subscriptionSchedules.retrieve(
        attempt.stripe_subscription_schedule_id,
        {},
        requestOptions
      )
      const normalized = normalizeSchedule(schedule, subscription, attempt)
      if (normalized.released) return "already_released"
      const released = await getClient().subscriptionSchedules.release(
        normalized.id,
        { preserve_cancel_date: false },
        {
          ...requestOptions,
          idempotencyKey: `deli-plus:subscription-change:v1:${attempt.id}:schedule-release`,
        }
      )
      invariant(
        normalizeSchedule(released, subscription, attempt).released &&
          released.released_subscription !== null &&
          id(released.released_subscription, "sub") === subscription.id
      )
      return "requested"
    },
  }
}
