import type Stripe from "stripe"

export const SUPPORTED_STRIPE_WEBHOOK_EVENT_TYPES = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
] as const

export type SupportedStripeWebhookEventType =
  (typeof SUPPORTED_STRIPE_WEBHOOK_EVENT_TYPES)[number]

export type StripeSubscriptionReconciliationContext = {
  eventType: SupportedStripeWebhookEventType
  stripeObjectId: string
  stripeSubscriptionId: string
  stripeCustomerId: string
}

export class StripeWebhookEventError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StripeWebhookEventError"
  }
}

function isSupportedEventType(
  value: string
): value is SupportedStripeWebhookEventType {
  return SUPPORTED_STRIPE_WEBHOOK_EVENT_TYPES.some(
    (eventType) => eventType === value
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
    throw new StripeWebhookEventError(`Invalid Stripe ${label} reference`)
  }

  return id
}

function getObjectId(value: unknown) {
  if (
    !value ||
    typeof value !== "object" ||
    !("id" in value) ||
    typeof value.id !== "string" ||
    !value.id ||
    /\s/u.test(value.id)
  ) {
    throw new StripeWebhookEventError("Invalid Stripe Event object")
  }

  return value.id
}

export function resolveStripeSubscriptionReconciliationContext(
  event: Stripe.Event
): StripeSubscriptionReconciliationContext | null {
  if (!isSupportedEventType(event.type)) {
    return null
  }

  const eventObject = event.data.object
  const stripeObjectId = getObjectId(eventObject)

  if (event.type.startsWith("customer.subscription.")) {
    const subscription = eventObject as Stripe.Subscription

    return {
      eventType: event.type,
      stripeObjectId,
      stripeSubscriptionId: getStripeId(subscription.id, "sub", "Subscription"),
      stripeCustomerId: getStripeId(subscription.customer, "cus", "Customer"),
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = eventObject as Stripe.Checkout.Session

    if (session.mode !== "subscription") {
      return null
    }

    return {
      eventType: event.type,
      stripeObjectId,
      stripeSubscriptionId: getStripeId(
        session.subscription,
        "sub",
        "Subscription"
      ),
      stripeCustomerId: getStripeId(session.customer, "cus", "Customer"),
    }
  }

  const invoice = eventObject as Stripe.Invoice
  const subscriptionDetails =
    invoice.parent?.type === "subscription_details"
      ? invoice.parent.subscription_details
      : null

  if (!subscriptionDetails) {
    return null
  }

  return {
    eventType: event.type,
    stripeObjectId,
    stripeSubscriptionId: getStripeId(
      subscriptionDetails.subscription,
      "sub",
      "Subscription"
    ),
    stripeCustomerId: getStripeId(invoice.customer, "cus", "Customer"),
  }
}
