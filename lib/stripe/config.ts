import "server-only"

import {
  resolvePlanCodeFromStripePriceIdFromEnvironment,
  resolveStripePriceIdFromEnvironment,
  type StripePriceEnvironment,
  type PlanCode,
} from "../billing/plans"
import {
  parseStripeApiLivemode,
  parseCheckoutPaymentMethodConfiguration,
  parseStripeSecretKey,
  parseStripeWebhookSecret,
  resolveBillingReturnOrigin,
  type StripeServerEnvironment,
} from "./config.internal"

function getStripeServerEnvironment(): StripeServerEnvironment &
  StripePriceEnvironment {
  return {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_CHECKOUT_PAYMENT_METHOD_CONFIGURATION:
      process.env.STRIPE_CHECKOUT_PAYMENT_METHOD_CONFIGURATION,
    STRIPE_PRICE_ESSENTIAL: process.env.STRIPE_PRICE_ESSENTIAL,
    STRIPE_PRICE_MULTI_2: process.env.STRIPE_PRICE_MULTI_2,
    STRIPE_PRICE_MULTI_3: process.env.STRIPE_PRICE_MULTI_3,
    BILLING_RETURN_ORIGIN: process.env.BILLING_RETURN_ORIGIN,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
  }
}

export function getStripeSecretKey() {
  return parseStripeSecretKey(getStripeServerEnvironment())
}

export function getStripeWebhookSecret() {
  return parseStripeWebhookSecret(getStripeServerEnvironment())
}

export function getStripeApiLivemode() {
  return parseStripeApiLivemode(getStripeServerEnvironment())
}

export function resolveStripePriceId(planCode: unknown) {
  return resolveStripePriceIdFromEnvironment(
    planCode,
    getStripeServerEnvironment()
  )
}

export function resolvePlanCodeFromStripePriceId(stripePriceId: unknown) {
  return resolvePlanCodeFromStripePriceIdFromEnvironment(
    stripePriceId,
    getStripeServerEnvironment()
  )
}

export function getBillingReturnOrigin() {
  return resolveBillingReturnOrigin(getStripeServerEnvironment())
}

export function getStripeCheckoutConfiguration(planCode: PlanCode) {
  const stripePriceId = resolveStripePriceId(planCode)
  if (resolvePlanCodeFromStripePriceId(stripePriceId) !== planCode) {
    throw new Error("Invalid Checkout Price mapping")
  }
  const origin = getBillingReturnOrigin()
  return {
    stripePriceId,
    currency: "brl" as const,
    recurringInterval: "month" as const,
    recurringIntervalCount: 1 as const,
    paymentMethodConfigurationId: parseCheckoutPaymentMethodConfiguration(
      getStripeServerEnvironment()
    ),
    livemode: getStripeApiLivemode(),
    stripeApiVersion: "2026-07-29.dahlia" as const,
    successUrl: `${origin}/dashboard/billing/success`,
    cancelUrl: `${origin}/dashboard/billing`,
  }
}

export { StripeConfigurationError } from "./config.internal"
