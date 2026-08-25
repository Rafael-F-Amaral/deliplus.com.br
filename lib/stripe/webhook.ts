import "server-only"

import { getStripeWebhookSecret } from "./config"
import { getStripe } from "./server"
import { constructVerifiedStripeEvent } from "./webhook-signature.internal"

export function verifyStripeWebhookEvent(
  rawBody: string,
  signature: string | null
) {
  return constructVerifiedStripeEvent({
    stripe: getStripe(),
    rawBody,
    signature,
    webhookSecret: getStripeWebhookSecret(),
  })
}

export { StripeWebhookSignatureError } from "./webhook-signature.internal"
