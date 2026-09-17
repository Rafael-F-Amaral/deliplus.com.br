import "server-only"

import { resolvePlanCodeFromStripePriceId } from "./config"
import { getStripe } from "./server"
import { createSubscriptionManagementStripeAdapter } from "./subscription-management.internal"

export function createStripeSubscriptionManagementProvider() {
  return createSubscriptionManagementStripeAdapter(
    getStripe,
    resolvePlanCodeFromStripePriceId
  )
}
