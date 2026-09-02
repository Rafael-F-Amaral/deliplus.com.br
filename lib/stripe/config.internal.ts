export type StripeServerEnvironment = {
  STRIPE_SECRET_KEY?: string
  STRIPE_WEBHOOK_SECRET?: string
  STRIPE_CHECKOUT_PAYMENT_METHOD_CONFIGURATION?: string
  BILLING_RETURN_ORIGIN?: string
  VERCEL_ENV?: string
  VERCEL_URL?: string
}

export function parseCheckoutPaymentMethodConfiguration(
  environment: StripeServerEnvironment
) {
  const value = getRequiredValue(
    environment,
    "STRIPE_CHECKOUT_PAYMENT_METHOD_CONFIGURATION"
  )
  if (!/^pmc_[A-Za-z0-9]+$/u.test(value)) {
    throw new StripeConfigurationError(
      "Invalid Checkout payment method configuration"
    )
  }
  return value
}

export class StripeConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StripeConfigurationError"
  }
}

function getRequiredValue(
  environment: StripeServerEnvironment,
  name: keyof StripeServerEnvironment
) {
  const value = environment[name]

  if (!value) {
    throw new StripeConfigurationError(
      `Missing required Stripe server configuration: ${name}`
    )
  }

  if (value !== value.trim()) {
    throw new StripeConfigurationError(
      `Invalid Stripe server configuration: ${name}`
    )
  }

  return value
}

export function parseStripeSecretKey(environment: StripeServerEnvironment) {
  const secretKey = getRequiredValue(environment, "STRIPE_SECRET_KEY")

  if (!/^(?:sk|rk)_(?:test|live)_.+$/u.test(secretKey)) {
    throw new StripeConfigurationError(
      "Invalid Stripe server configuration: STRIPE_SECRET_KEY"
    )
  }

  return secretKey
}

export function parseStripeApiLivemode(environment: StripeServerEnvironment) {
  const secretKey = parseStripeSecretKey(environment)
  const match = /^(?:sk|rk)_(test|live)_.+$/u.exec(secretKey)

  if (!match) {
    throw new StripeConfigurationError(
      "Invalid Stripe server configuration: STRIPE_SECRET_KEY"
    )
  }

  return match[1] === "live"
}

export function parseStripeWebhookSecret(environment: StripeServerEnvironment) {
  const webhookSecret = getRequiredValue(environment, "STRIPE_WEBHOOK_SECRET")

  if (!/^whsec_[A-Za-z0-9]+$/u.test(webhookSecret)) {
    throw new StripeConfigurationError(
      "Invalid Stripe server configuration: STRIPE_WEBHOOK_SECRET"
    )
  }

  return webhookSecret
}

export function parseBillingReturnOrigin(value: string) {
  let url: URL

  try {
    url = new URL(value)
  } catch {
    throw new StripeConfigurationError(
      "Invalid Stripe server configuration: BILLING_RETURN_ORIGIN"
    )
  }

  const isHttps = url.protocol === "https:"
  const isLocalHttp = url.protocol === "http:" && url.hostname === "localhost"

  if (
    (!isHttps && !isLocalHttp) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new StripeConfigurationError(
      "Invalid Stripe server configuration: BILLING_RETURN_ORIGIN"
    )
  }

  return url.origin
}

export function resolveBillingReturnOrigin(
  environment: StripeServerEnvironment
) {
  if (environment.BILLING_RETURN_ORIGIN) {
    const configuredOrigin = getRequiredValue(
      environment,
      "BILLING_RETURN_ORIGIN"
    )

    return parseBillingReturnOrigin(configuredOrigin)
  }

  if (environment.VERCEL_ENV === "preview") {
    const vercelUrl = getRequiredValue(environment, "VERCEL_URL")

    return parseBillingReturnOrigin(`https://${vercelUrl}`)
  }

  throw new StripeConfigurationError(
    "Missing required Stripe server configuration: BILLING_RETURN_ORIGIN"
  )
}
