import type Stripe from "stripe"

import type { PlanCode } from "./plans"

const PLAN_RANK: Record<PlanCode, number> = {
  essential: 1,
  multi_2: 2,
  multi_3: 3,
}

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

export type NormalizedStripeSubscriptionManagement =
  NormalizedStripeSubscription & {
    stripeSubscriptionScheduleId: string | null
    pendingStripePriceId: string | null
    pendingPlanCode: PlanCode | null
    pendingEffectiveAt: string | null
  }

export class StripeSubscriptionNormalizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StripeSubscriptionNormalizationError"
  }
}

function withoutPendingSchedule(
  current: NormalizedStripeSubscription
): NormalizedStripeSubscriptionManagement {
  return {
    ...current,
    stripeSubscriptionScheduleId: null,
    pendingStripePriceId: null,
    pendingPlanCode: null,
    pendingEffectiveAt: null,
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

  if (item.quantity !== 1) {
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

export function reduceStripeSubscriptionManagement(
  subscription: Stripe.Subscription,
  schedule: Stripe.SubscriptionSchedule | null,
  resolvePlanCode: (stripePriceId: string) => PlanCode
): NormalizedStripeSubscriptionManagement {
  const current = reduceStripeSubscription(subscription, resolvePlanCode)
  if (subscription.schedule === null) {
    if (schedule !== null)
      throw new StripeSubscriptionNormalizationError(
        "Unexpected Stripe Subscription Schedule"
      )
    return withoutPendingSchedule(current)
  }
  const subscriptionScheduleId = getStripeId(
    subscription.schedule,
    "sub_sched",
    "Subscription Schedule"
  )
  if (
    !schedule ||
    getStripeId(schedule.id, "sub_sched", "Subscription Schedule") !==
      subscriptionScheduleId ||
    getStripeId(schedule.subscription, "sub", "Subscription") !==
      current.stripeSubscriptionId ||
    getStripeId(schedule.customer, "cus", "Customer") !==
      current.stripeCustomerId ||
    schedule.status !== "active" ||
    schedule.end_behavior !== "release" ||
    schedule.phases.length < 1 ||
    schedule.phases.length > 2
  )
    throw new StripeSubscriptionNormalizationError(
      "Unsupported Stripe Subscription Schedule"
    )
  const activePhase = schedule.phases[0]
  if (
    activePhase.start_date >= activePhase.end_date ||
    activePhase.items.length !== 1 ||
    activePhase.items[0].quantity !== 1 ||
    new Date(activePhase.end_date * 1000).toISOString() !==
      current.currentPeriodEnd ||
    getStripeId(activePhase.items[0].price, "price", "Price") !==
      current.stripePriceId
  )
    throw new StripeSubscriptionNormalizationError(
      "Unsupported Stripe Subscription Schedule current phase"
    )

  // `from_subscription` attaches an active one-phase Schedule before the
  // command's second API call installs the reviewed future downgrade phase.
  // This provider state is valid current-plan evidence, but not yet a pending
  // downgrade, so the pending quartet deliberately remains empty.
  if (schedule.phases.length === 1) return withoutPendingSchedule(current)

  const targetPhase = schedule.phases[1]
  if (
    targetPhase.items.length !== 1 ||
    targetPhase.items[0].quantity !== 1 ||
    activePhase.end_date !== targetPhase.start_date
  )
    throw new StripeSubscriptionNormalizationError(
      "Unsupported Stripe Subscription Schedule phases"
    )
  const targetPriceId = getStripeId(
    targetPhase.items[0].price,
    "price",
    "Price"
  )
  const pendingPlanCode = resolvePlanCode(targetPriceId)
  if (PLAN_RANK[pendingPlanCode] >= PLAN_RANK[current.planCode])
    throw new StripeSubscriptionNormalizationError(
      "Stripe Subscription Schedule target is not a downgrade"
    )
  return {
    ...current,
    stripeSubscriptionScheduleId: subscriptionScheduleId,
    pendingStripePriceId: targetPriceId,
    pendingPlanCode,
    pendingEffectiveAt: current.currentPeriodEnd,
  }
}
