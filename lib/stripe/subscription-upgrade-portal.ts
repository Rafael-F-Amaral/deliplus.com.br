import "server-only"

import { getStripe } from "./server"
import { createSubscriptionUpgradePortalStripeAdapter } from "./subscription-upgrade-portal.internal"

export function createStripeSubscriptionUpgradePortalProvider() {
  return createSubscriptionUpgradePortalStripeAdapter(getStripe)
}
