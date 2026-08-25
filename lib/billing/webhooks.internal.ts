import type Stripe from "stripe"

import type { PlanCode } from "./plans"
import type { NormalizedStripeSubscription } from "./subscription-reducer"
import type { StripeSubscriptionReconciliationContext } from "./webhook-events"

export type StripeWebhookProjectionInput = {
  stripeEventId: string
  eventType: string
  stripeObjectId: string
  livemode: boolean
  stripeCreatedAt: string
  subscription: NormalizedStripeSubscription
}

export type StripeWebhookProjectionResult =
  "applied" | "duplicate" | "ignored_non_canonical"

export type StripeWebhookProcessingResult =
  StripeWebhookProjectionResult | "ignored"

export type StripeWebhookProcessingDependencies = {
  getExpectedLivemode: () => boolean
  resolveContext: (
    event: Stripe.Event
  ) => StripeSubscriptionReconciliationContext | null
  isEventProcessed: (stripeEventId: string) => Promise<boolean>
  retrieveSubscription: (
    stripeSubscriptionId: string
  ) => Promise<Stripe.Subscription>
  resolvePlanCode: (stripePriceId: string) => PlanCode
  reduceSubscription: (
    subscription: Stripe.Subscription,
    resolvePlanCode: (stripePriceId: string) => PlanCode
  ) => NormalizedStripeSubscription
  applyProjection: (
    input: StripeWebhookProjectionInput
  ) => Promise<StripeWebhookProjectionResult>
}

export class StripeWebhookProcessingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StripeWebhookProcessingError"
  }
}

function validateStripeEvent(event: Stripe.Event) {
  if (!/^evt_[^\s]+$/u.test(event.id)) {
    throw new StripeWebhookProcessingError("Invalid Stripe Event identifier")
  }

  if (!Number.isSafeInteger(event.created) || event.created <= 0) {
    throw new StripeWebhookProcessingError("Invalid Stripe Event timestamp")
  }
}

export async function processStripeWebhookEventWithDependencies(
  event: Stripe.Event,
  dependencies: StripeWebhookProcessingDependencies
): Promise<StripeWebhookProcessingResult> {
  const context = dependencies.resolveContext(event)

  if (!context) {
    return "ignored"
  }

  validateStripeEvent(event)

  if (event.livemode !== dependencies.getExpectedLivemode()) {
    throw new StripeWebhookProcessingError("Stripe Event mode mismatch")
  }

  if (await dependencies.isEventProcessed(event.id)) {
    return "duplicate"
  }

  const subscription = await dependencies.retrieveSubscription(
    context.stripeSubscriptionId
  )
  const normalizedSubscription = dependencies.reduceSubscription(
    subscription,
    dependencies.resolvePlanCode
  )

  if (
    normalizedSubscription.stripeSubscriptionId !== context.stripeSubscriptionId
  ) {
    throw new StripeWebhookProcessingError(
      "Stripe Subscription reconciliation mismatch"
    )
  }

  if (normalizedSubscription.stripeCustomerId !== context.stripeCustomerId) {
    throw new StripeWebhookProcessingError(
      "Stripe Customer reconciliation mismatch"
    )
  }

  return dependencies.applyProjection({
    stripeEventId: event.id,
    eventType: context.eventType,
    stripeObjectId: context.stripeObjectId,
    livemode: event.livemode,
    stripeCreatedAt: new Date(event.created * 1000).toISOString(),
    subscription: normalizedSubscription,
  })
}
