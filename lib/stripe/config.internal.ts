export type StripeServerEnvironment = {
  STRIPE_SECRET_KEY?: string
  BILLING_RETURN_ORIGIN?: string
  VERCEL_ENV?: string
  VERCEL_URL?: string
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
