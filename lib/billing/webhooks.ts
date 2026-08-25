import "server-only"

import type Stripe from "stripe"

import {
  getStripeApiLivemode,
  resolvePlanCodeFromStripePriceId,
} from "../stripe/config"
import { getStripe } from "../stripe/server"
import { reduceStripeSubscription } from "./subscription-reducer"
import { createStripeWebhookProjectionStore } from "./subscription-projection"
import { resolveStripeSubscriptionReconciliationContext } from "./webhook-events"
import { processStripeWebhookEventWithDependencies } from "./webhooks.internal"

export function processStripeWebhookEvent(event: Stripe.Event) {
  const projectionStore = createStripeWebhookProjectionStore()

  return processStripeWebhookEventWithDependencies(event, {
    getExpectedLivemode: getStripeApiLivemode,
    resolveContext: resolveStripeSubscriptionReconciliationContext,
    isEventProcessed: projectionStore.isEventProcessed,
    retrieveSubscription: (stripeSubscriptionId) =>
      getStripe().subscriptions.retrieve(stripeSubscriptionId),
    resolvePlanCode: resolvePlanCodeFromStripePriceId,
    reduceSubscription: reduceStripeSubscription,
    applyProjection: projectionStore.applyProjection,
  })
}
