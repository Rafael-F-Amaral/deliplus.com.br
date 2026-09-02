import "server-only"

import { getStripe } from "./server"
import { createCheckoutStripeAdapter } from "./checkout.internal"

export function createStripeCheckoutProvider() {
  return createCheckoutStripeAdapter(getStripe)
}
