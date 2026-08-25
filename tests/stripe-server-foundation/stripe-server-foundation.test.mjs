import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

import Stripe from "stripe"

import {
  getPlanDefinition,
  isPlanCode,
  parsePlanCode,
  PlanPriceConfigurationError,
  resolveStripePriceIdFromEnvironment,
  UnsupportedPlanCodeError,
} from "../../lib/billing/plans.ts"
import {
  parseBillingReturnOrigin,
  parseStripeSecretKey,
  resolveBillingReturnOrigin,
  StripeConfigurationError,
} from "../../lib/stripe/config.internal.ts"

const priceEnvironment = {
  STRIPE_PRICE_ESSENTIAL: "price_essential123",
  STRIPE_PRICE_MULTI_2: "price_multi2123",
  STRIPE_PRICE_MULTI_3: "price_multi3123",
}

test("the plan registry preserves the approved Store capacities", () => {
  assert.deepEqual(getPlanDefinition("essential"), {
    code: "essential",
    maxStores: 1,
  })
  assert.deepEqual(getPlanDefinition("multi_2"), {
    code: "multi_2",
    maxStores: 2,
  })
  assert.deepEqual(getPlanDefinition("multi_3"), {
    code: "multi_3",
    maxStores: 3,
  })
})

test("only approved PlanCodes are accepted", () => {
  for (const planCode of ["essential", "multi_2", "multi_3"]) {
    assert.equal(isPlanCode(planCode), true)
    assert.equal(parsePlanCode(planCode), planCode)
  }

  assert.equal(isPlanCode("multi_4"), false)
  assert.throws(() => parsePlanCode("multi_4"), UnsupportedPlanCodeError)
  assert.throws(() => getPlanDefinition(undefined), UnsupportedPlanCodeError)
})

test("each PlanCode resolves only its environment-specific Stripe Price", () => {
  assert.equal(
    resolveStripePriceIdFromEnvironment("essential", priceEnvironment),
    "price_essential123"
  )
  assert.equal(
    resolveStripePriceIdFromEnvironment("multi_2", priceEnvironment),
    "price_multi2123"
  )
  assert.equal(
    resolveStripePriceIdFromEnvironment("multi_3", priceEnvironment),
    "price_multi3123"
  )
})

test("missing Price configuration fails without falling back", () => {
  assert.throws(
    () =>
      resolveStripePriceIdFromEnvironment("multi_2", {
        STRIPE_PRICE_ESSENTIAL: "price_essential123",
      }),
    (error) => {
      assert.ok(error instanceof PlanPriceConfigurationError)
      assert.equal(
        error.message,
        "Missing required Stripe server configuration: STRIPE_PRICE_MULTI_2"
      )
      return true
    }
  )
})

test("unknown plans and invalid Price IDs fail closed", () => {
  assert.throws(
    () => resolveStripePriceIdFromEnvironment("unknown", priceEnvironment),
    UnsupportedPlanCodeError
  )

  const invalidPriceId = "product_not_a_price"

  assert.throws(
    () =>
      resolveStripePriceIdFromEnvironment("essential", {
        STRIPE_PRICE_ESSENTIAL: invalidPriceId,
      }),
    (error) => {
      assert.ok(error instanceof PlanPriceConfigurationError)
      assert.doesNotMatch(error.message, new RegExp(invalidPriceId))
      return true
    }
  )
})

test("Stripe secret validation accepts only server secret or restricted keys", () => {
  const restrictedKey = ["rk", "test", "foundation-key"].join("_")
  const secretKey = ["sk", "live", "foundation-key"].join("_")

  assert.equal(
    parseStripeSecretKey({ STRIPE_SECRET_KEY: restrictedKey }),
    restrictedKey
  )
  assert.equal(
    parseStripeSecretKey({ STRIPE_SECRET_KEY: secretKey }),
    secretKey
  )
  assert.throws(() => parseStripeSecretKey({}), StripeConfigurationError)
  assert.throws(
    () =>
      parseStripeSecretKey({
        STRIPE_SECRET_KEY: ["pk", "test", "client-key"].join("_"),
      }),
    StripeConfigurationError
  )
})

test("valid explicit origins are normalized", () => {
  assert.equal(
    parseBillingReturnOrigin("http://localhost:3000/"),
    "http://localhost:3000"
  )
  assert.equal(
    resolveBillingReturnOrigin({
      BILLING_RETURN_ORIGIN: "https://staging.deliplus.example/",
    }),
    "https://staging.deliplus.example"
  )
})

test("Vercel Preview uses only the trusted system URL fallback", () => {
  assert.equal(
    resolveBillingReturnOrigin({
      VERCEL_ENV: "preview",
      VERCEL_URL: "deliplus-preview.vercel.app",
    }),
    "https://deliplus-preview.vercel.app"
  )

  assert.throws(
    () =>
      resolveBillingReturnOrigin({
        VERCEL_ENV: "production",
        VERCEL_URL: "deliplus.vercel.app",
      }),
    StripeConfigurationError
  )
})

test("origins with paths, queries, fragments, credentials, or unsafe schemes fail", () => {
  for (const invalidOrigin of [
    "https://app.example.com/path",
    "https://app.example.com?next=attacker",
    "https://app.example.com#fragment",
    "https://user:password@app.example.com",
    "javascript:alert(1)",
    "http://app.example.com",
  ]) {
    assert.throws(
      () => parseBillingReturnOrigin(invalidOrigin),
      StripeConfigurationError
    )
  }
})

test("the Stripe client is lazy, server-only, and performs no network operation", async () => {
  const serverSource = await readFile(
    new URL("../../lib/stripe/server.ts", import.meta.url),
    "utf8"
  )
  const configSource = await readFile(
    new URL("../../lib/stripe/config.ts", import.meta.url),
    "utf8"
  )
  const packageSource = await readFile(
    new URL("../../package.json", import.meta.url),
    "utf8"
  )

  assert.match(serverSource, /import "server-only"/)
  assert.match(serverSource, /let stripeClient: Stripe \| undefined/)
  assert.match(serverSource, /new Stripe\(getStripeSecretKey\(\)\)/)
  assert.match(serverSource, /stripeClient \?\?=/)
  assert.doesNotMatch(serverSource, /apiVersion/)
  assert.doesNotMatch(
    serverSource,
    /Clerk|Supabase|customers\.create|checkout/iu
  )
  assert.equal(Stripe.API_VERSION, "2026-07-29.dahlia")

  assert.match(configSource, /import "server-only"/)
  assert.match(configSource, /process\.env/)
  assert.doesNotMatch(configSource, /NEXT_PUBLIC_/)
  assert.doesNotMatch(configSource, /headers\s*\(/)

  assert.match(packageSource, /"stripe": "22\.4\.0"/)
  assert.doesNotMatch(packageSource, /@stripe\/stripe-js/)
  assert.doesNotMatch(packageSource, /@stripe\/react-stripe-js/)
})
