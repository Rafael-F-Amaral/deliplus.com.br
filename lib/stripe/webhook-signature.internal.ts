import type Stripe from "stripe"

export class StripeWebhookSignatureError extends Error {
  constructor() {
    super("Invalid Stripe webhook signature")
    this.name = "StripeWebhookSignatureError"
  }
}

type StripeWebhookVerifier = Pick<Stripe, "webhooks">

export function constructVerifiedStripeEvent({
  stripe,
  rawBody,
  signature,
  webhookSecret,
}: {
  stripe: StripeWebhookVerifier
  rawBody: string
  signature: string | null
  webhookSecret: string
}) {
  if (!signature || !rawBody) {
    throw new StripeWebhookSignatureError()
  }

  try {
    return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch {
    throw new StripeWebhookSignatureError()
  }
}
