import "server-only"

import {
  resolvePlanCodeFromStripePriceIdFromEnvironment,
  resolveStripePriceIdFromEnvironment,
  type StripePriceEnvironment,
} from "../billing/plans"
import {
  parseStripeApiLivemode,
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

export { StripeConfigurationError } from "./config.internal"
