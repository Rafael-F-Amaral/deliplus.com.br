import type Stripe from "stripe"

import type { PlanCode } from "./plans"

export const BILLING_SUBSCRIPTION_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "incomplete",
  "incomplete_expired",
  "unpaid",
  "canceled",
  "paused",
] as const

export type BillingSubscriptionStatus =
  (typeof BILLING_SUBSCRIPTION_STATUSES)[number]

export type NormalizedStripeSubscription = {
  stripeSubscriptionId: string
  stripeCustomerId: string
  stripePriceId: string
  planCode: PlanCode
  status: BillingSubscriptionStatus
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  collectionPaused: boolean
}

export class StripeSubscriptionNormalizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StripeSubscriptionNormalizationError"
  }
}

function isBillingSubscriptionStatus(
  value: unknown
): value is BillingSubscriptionStatus {
  return (
    typeof value === "string" &&
    BILLING_SUBSCRIPTION_STATUSES.some((status) => status === value)
  )
}

function getStripeId(value: unknown, prefix: string, label: string) {
  const id =
    typeof value === "string"
      ? value
      : value && typeof value === "object" && "id" in value
        ? value.id
        : undefined

  if (
    typeof id !== "string" ||
    !new RegExp(`^${prefix}_[^\\s]+$`, "u").test(id)
  ) {
    throw new StripeSubscriptionNormalizationError(
      `Invalid Stripe ${label} reference`
    )
  }

  return id
}

export function reduceStripeSubscription(
  subscription: Stripe.Subscription,
  resolvePlanCode: (stripePriceId: string) => PlanCode
): NormalizedStripeSubscription {
  const stripeSubscriptionId = getStripeId(
    subscription.id,
    "sub",
    "Subscription"
  )
  const stripeCustomerId = getStripeId(subscription.customer, "cus", "Customer")
  const items = subscription.items

  if (items.has_more || items.data.length !== 1) {
    throw new StripeSubscriptionNormalizationError(
      "Unsupported Stripe Subscription item configuration"
    )
  }

  const item = items.data[0]

  if (item.quantity !== undefined && item.quantity !== 1) {
    throw new StripeSubscriptionNormalizationError(
      "Unsupported Stripe Subscription item quantity"
    )
  }

  if (item.price.type !== "recurring" || item.price.recurring === null) {
    throw new StripeSubscriptionNormalizationError(
      "Unsupported non-recurring Stripe Price"
    )
  }

  const stripePriceId = getStripeId(item.price.id, "price", "Price")
  const planCode = resolvePlanCode(stripePriceId)

  if (!isBillingSubscriptionStatus(subscription.status)) {
    throw new StripeSubscriptionNormalizationError(
      "Unsupported Stripe Subscription status"
    )
  }

  if (
    !Number.isSafeInteger(item.current_period_end) ||
    item.current_period_end <= 0
  ) {
    throw new StripeSubscriptionNormalizationError(
      "Invalid Stripe Subscription current period"
    )
  }

  return {
    stripeSubscriptionId,
    stripeCustomerId,
    stripePriceId,
    planCode,
    status: subscription.status,
    currentPeriodEnd: new Date(item.current_period_end * 1000).toISOString(),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    collectionPaused: subscription.pause_collection !== null,
  }
}
