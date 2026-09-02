import "server-only"

import { auth } from "@clerk/nextjs/server"
import { isPlanCode, type PlanCode } from "./plans"
import { getStripeCheckoutConfiguration } from "../stripe/config"
import { createStripeCheckoutProvider } from "../stripe/checkout"
import { createSubscriptionCheckout } from "./subscription-checkout.internal"
import { createSubscriptionCheckoutRepository } from "./subscription-checkout.repository"

export async function createSubscriptionCheckoutSession(planCode: PlanCode) {
  // Per-invocation repository/client; no tenant state survives across requests.
  return createSubscriptionCheckout({
    async getAuth() {
      const { userId, orgId, has } = await auth()
      return {
        userId,
        orgId,
        isAdmin: Boolean(userId && orgId && has({ role: "org:admin" })),
      }
    },
    isPlanCode,
    getConfiguration: getStripeCheckoutConfiguration,
    repository: createSubscriptionCheckoutRepository(),
    stripe: createStripeCheckoutProvider(),
    now: Date.now,
  })(planCode)
}

export {
  StripeCheckoutError,
  type StripeCheckoutResult,
} from "./subscription-checkout.internal"
