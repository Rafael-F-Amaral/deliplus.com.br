import "server-only"

import type Stripe from "stripe"
import type {
  CheckoutAttempt,
  CheckoutConfiguration,
  CheckoutProvider,
  CheckoutSession,
} from "../billing/subscription-checkout.internal"

type CheckoutSdk = Pick<
  Stripe,
  | "customers"
  | "prices"
  | "subscriptions"
  | "checkout"
  | "paymentMethodConfigurations"
>
const requestOptions = { maxNetworkRetries: 2, timeout: 10_000 } as const
function invariant(condition: unknown): asserts condition {
  if (!condition) throw new Error("Invalid Stripe Checkout contract")
}
function id(value: unknown, prefix: string): string {
  const result =
    typeof value === "string"
      ? value
      : value && typeof value === "object" && "id" in value
        ? value.id
        : null
  invariant(
    typeof result === "string" &&
      new RegExp(`^${prefix}_[A-Za-z0-9_]+$`, "u").test(result)
  )
  return result
}
function missing(error: unknown) {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "resource_missing"
  )
}

export function validateCheckoutPrice(
  price: Stripe.Price,
  config: CheckoutConfiguration
) {
  invariant(
    price.object === "price" &&
      price.id === config.stripePriceId &&
      price.active === true &&
      price.livemode === config.livemode
  )
  invariant(
    config.currency === "brl" &&
      config.recurringInterval === "month" &&
      config.recurringIntervalCount === 1
  )
  invariant(
    price.currency === config.currency &&
      price.type === "recurring" &&
      price.recurring?.interval === config.recurringInterval &&
      price.recurring.interval_count === config.recurringIntervalCount &&
      price.recurring.usage_type === "licensed"
  )
  invariant(
    price.billing_scheme === "per_unit" &&
      price.transform_quantity === null &&
      price.tiers_mode === null &&
      Number.isSafeInteger(price.unit_amount) &&
      price.unit_amount! > 0
  )
}

export function validateCheckoutPaymentConfiguration(
  value: Stripe.PaymentMethodConfiguration,
  config: CheckoutConfiguration
) {
  invariant(
    value.object === "payment_method_configuration" &&
      value.id === config.paymentMethodConfigurationId &&
      value.active === true &&
      value.livemode === config.livemode &&
      value.application === null &&
      value.parent === null
  )
  invariant(
    value.card?.available === true &&
      value.card.display_preference.value === "on"
  )
  // Card wallets still use the card rail. No Link, BNPL, Pix, boleto, or delayed rails.
  const cardRails = new Set(["card", "apple_pay", "google_pay"])
  for (const [key, method] of Object.entries(value)) {
    if (method && typeof method === "object" && "available" in method) {
      invariant(
        typeof method.available === "boolean" &&
          "display_preference" in method &&
          method.display_preference &&
          typeof method.display_preference === "object" &&
          "value" in method.display_preference
      )
      if (!cardRails.has(key))
        invariant(
          method.available === false &&
            method.display_preference.value === "off"
        )
    }
  }
}

export function checkoutSessionParameters(
  attempt: CheckoutAttempt
): Stripe.Checkout.SessionCreateParams {
  invariant(
    attempt.payload_version === 1 &&
      attempt.stripe_api_version === "2026-07-29.dahlia"
  )
  const metadata = {
    organization_id: attempt.organization_id,
    plan_code: attempt.plan_code,
    checkout_attempt_id: attempt.id,
  }
  return {
    mode: "subscription",
    ui_mode: "hosted_page",
    customer: attempt.stripe_customer_id,
    line_items: [{ price: attempt.stripe_price_id, quantity: 1 }],
    success_url: attempt.success_url,
    cancel_url: attempt.cancel_url,
    payment_method_configuration: attempt.payment_method_configuration_id,
    adaptive_pricing: { enabled: false },
    expires_at: Date.parse(attempt.expires_at) / 1000,
    integration_identifier: attempt.integration_identifier,
    metadata,
    subscription_data: { metadata },
    // Response expansion is also a stable part of payload v1.
    expand: ["line_items"],
  }
}

export function normalizeCheckoutSession(
  value: Stripe.Checkout.Session,
  attempt: CheckoutAttempt
): CheckoutSession {
  const sessionId = id(value.id, "cs")
  invariant(
    value.object === "checkout.session" &&
      value.mode === "subscription" &&
      value.ui_mode === "hosted_page"
  )
  invariant(
    id(value.customer, "cus") === attempt.stripe_customer_id &&
      value.livemode === attempt.livemode
  )
  invariant(
    !attempt.stripe_checkout_session_id ||
      sessionId === attempt.stripe_checkout_session_id
  )
  invariant(
    value.expires_at === Date.parse(attempt.expires_at) / 1000 &&
      value.success_url === attempt.success_url &&
      value.cancel_url === attempt.cancel_url &&
      value.integration_identifier === attempt.integration_identifier
  )
  invariant(
    value.metadata &&
      value.metadata.organization_id === attempt.organization_id &&
      value.metadata.plan_code === attempt.plan_code &&
      value.metadata.checkout_attempt_id === attempt.id
  )
  invariant(
    value.payment_method_configuration_details?.id ===
      attempt.payment_method_configuration_id
  )
  invariant(
    value.payment_method_types.length === 1 &&
      value.payment_method_types[0] === "card"
  )
  invariant(
    value.currency === "brl" &&
      value.adaptive_pricing?.enabled === false &&
      value.automatic_tax.enabled === false &&
      !value.allow_promotion_codes
  )
  invariant(
    !value.discounts?.length &&
      !value.after_expiration?.recovery?.enabled &&
      value.recovered_from === null
  )
  invariant(
    value.line_items &&
      value.line_items.has_more === false &&
      value.line_items.data.length === 1
  )
  const item = value.line_items.data[0]
  invariant(
    item.quantity === 1 &&
      item.price &&
      item.price.id === attempt.stripe_price_id &&
      item.price.currency === "brl" &&
      item.price.recurring?.interval === "month" &&
      item.price.recurring.interval_count === 1
  )
  invariant(["open", "complete", "expired"].includes(value.status ?? ""))
  if (value.status === "open") {
    invariant(value.url)
    const url = new URL(value.url)
    invariant(
      url.protocol === "https:" &&
        url.hostname === "checkout.stripe.com" &&
        !url.username &&
        !url.password &&
        !url.port
    )
  }
  return {
    id: sessionId,
    status: value.status as CheckoutSession["status"],
    url: value.status === "open" ? value.url : null,
    subscriptionId:
      value.subscription === null ? null : id(value.subscription, "sub"),
  }
}

// The injected instance allows tests to mock the exact SDK calls without network.
export function createCheckoutStripeAdapter(
  getClient: () => CheckoutSdk
): CheckoutProvider {
  return {
    async validateCatalog(config) {
      validateCheckoutPrice(
        await getClient().prices.retrieve(
          config.stripePriceId,
          {},
          requestOptions
        ),
        config
      )
      validateCheckoutPaymentConfiguration(
        await getClient().paymentMethodConfigurations.retrieve(
          config.paymentMethodConfigurationId,
          {},
          requestOptions
        ),
        config
      )
    },
    async createCustomer(claim, config) {
      const value = await getClient().customers.create(
        { metadata: { organization_id: claim.organization_id } },
        { ...requestOptions, idempotencyKey: claim.creation_idempotency_key }
      )
      invariant(
        value.object === "customer" &&
          value.livemode === config.livemode &&
          !value.deleted
      )
      return id(value.id, "cus")
    },
    async retrieveCustomer(customerId, config) {
      try {
        const value = await getClient().customers.retrieve(
          customerId,
          {},
          requestOptions
        )
        return (
          value.id === customerId &&
          value.object === "customer" &&
          !value.deleted &&
          value.livemode === config.livemode
        )
      } catch (error) {
        if (missing(error)) return false
        throw error
      }
    },
    async listSubscriptions(customerId, config) {
      const result = []
      const seen = new Set<string>()
      let cursor: string | undefined
      // Bounded even for unsupported accounts with excessive history; no first-page assumption.
      for (let page = 0; page < 100; page++) {
        const values = await getClient().subscriptions.list(
          {
            customer: customerId,
            status: "all",
            limit: 100,
            ...(cursor ? { starting_after: cursor } : {}),
          },
          requestOptions
        )
        invariant(
          values.object === "list" &&
            Array.isArray(values.data) &&
            typeof values.has_more === "boolean"
        )
        for (const value of values.data) {
          const subscriptionId = id(value.id, "sub")
          invariant(
            !seen.has(subscriptionId) &&
              value.object === "subscription" &&
              value.livemode === config.livemode &&
              id(value.customer, "cus") === customerId
          )
          invariant(
            typeof value.status === "string" &&
              (value.pause_collection === null ||
                ["keep_as_draft", "mark_uncollectible", "void"].includes(
                  value.pause_collection?.behavior
                ))
          )
          seen.add(subscriptionId)
          result.push({
            id: subscriptionId,
            status: value.status,
            collectionPaused: value.pause_collection !== null,
            attemptId: value.metadata?.checkout_attempt_id ?? null,
          })
        }
        if (!values.has_more) return result
        invariant(values.data.length > 0)
        cursor = values.data[values.data.length - 1].id
      }
      throw new Error("Unable to exhaust Stripe subscription history")
    },
    async createSession(attempt) {
      const value = await getClient().checkout.sessions.create(
        checkoutSessionParameters(attempt),
        { ...requestOptions, idempotencyKey: attempt.stripe_idempotency_key }
      )
      return normalizeCheckoutSession(value, attempt)
    },
    async retrieveSession(attempt) {
      invariant(attempt.stripe_checkout_session_id)
      try {
        const value = await getClient().checkout.sessions.retrieve(
          attempt.stripe_checkout_session_id,
          { expand: ["line_items"] },
          requestOptions
        )
        return normalizeCheckoutSession(value, attempt)
      } catch (error) {
        if (missing(error)) return null
        throw error
      }
    },
  }
}
