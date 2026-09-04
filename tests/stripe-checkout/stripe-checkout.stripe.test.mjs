import assert from "node:assert/strict"
import test from "node:test"
import {
  config,
  newAttempt,
  price,
  paymentConfiguration,
  fakeStripe,
  subscription,
  rawSession,
  fixture,
} from "./fixtures.mjs"
import {
  checkoutSessionParameters,
  normalizeCheckoutSession,
  validateCheckoutPrice,
  validateCheckoutPaymentConfiguration,
} from "../../lib/stripe/checkout.internal.ts"
import { parseCheckoutPaymentMethodConfiguration } from "../../lib/stripe/config.internal.ts"
import {
  resolveStripePriceIdFromEnvironment,
  resolvePlanCodeFromStripePriceIdFromEnvironment,
} from "../../lib/billing/plans.ts"

for (const patch of [
  { active: false },
  { currency: "usd" },
  { livemode: true },
  { type: "one_time" },
  { id: "price_other" },
  {
    recurring: { interval: "year", interval_count: 1, usage_type: "licensed" },
  },
  {
    recurring: { interval: "month", interval_count: 2, usage_type: "licensed" },
  },
  {
    recurring: { interval: "month", interval_count: 1, usage_type: "metered" },
  },
  { billing_scheme: "tiered" },
  { transform_quantity: { divide_by: 2 } },
  { unit_amount: null },
  { unit_amount: 0 },
]) {
  test(`stripe mock: invalid Price ${JSON.stringify(patch)}`, () =>
    assert.throws(() =>
      validateCheckoutPrice({ ...price(), ...patch }, config())
    ))
}
test("stripe mock: approved monthly BRL fixed Price is accepted", () =>
  assert.doesNotThrow(() => validateCheckoutPrice(price(), config())))
test("stripe mock: ambiguous server Price mapping fails round trip", () => {
  const env = {
    STRIPE_PRICE_ESSENTIAL: "price_same",
    STRIPE_PRICE_MULTI_2: "price_same",
  }
  const mapped = resolveStripePriceIdFromEnvironment("essential", env)
  assert.throws(() =>
    resolvePlanCodeFromStripePriceIdFromEnvironment(mapped, env)
  )
})
test("stripe mock: dedicated PMC lazy validation has no default", () => {
  for (const value of [undefined, "", "pmc_bad value", "wrong"])
    assert.throws(() =>
      parseCheckoutPaymentMethodConfiguration({
        STRIPE_CHECKOUT_PAYMENT_METHOD_CONFIGURATION: value,
      })
    )
  assert.equal(
    parseCheckoutPaymentMethodConfiguration({
      STRIPE_CHECKOUT_PAYMENT_METHOD_CONFIGURATION: "pmc_checkout",
    }),
    "pmc_checkout"
  )
})
for (const patch of [
  { active: false },
  { livemode: true },
  { card: { available: false, display_preference: { value: "off" } } },
  { pix: { available: true, display_preference: { value: "on" } } },
  { boleto: { available: false, display_preference: { value: "on" } } },
  { link: { available: true, display_preference: { value: "on" } } },
  { application: "ca_connect" },
]) {
  test(`stripe mock: unsafe PMC ${JSON.stringify(patch)}`, () =>
    assert.throws(() =>
      validateCheckoutPaymentConfiguration(
        { ...paymentConfiguration(), ...patch },
        config()
      )
    ))
}
test("stripe mock: SDK payload is fixed and excludes adjacent billing features", async () => {
  const f = fixture()
  await f.run("essential")
  const call = f.stripe.state.calls.find(
    (c) => c.name === "checkout.sessions.create"
  )
  const customer = f.stripe.state.calls.find(
    (c) => c.name === "customers.create"
  )
  assert.equal(call.params.mode, "subscription")
  assert.equal(call.params.ui_mode, "hosted_page")
  assert.deepEqual(call.params.line_items, [
    { price: config().stripePriceId, quantity: 1 },
  ])
  assert.equal(call.params.customer, f.state.customer.stripe_customer_id)
  assert.equal(call.params.payment_method_configuration, "pmc_checkout")
  assert.deepEqual(call.params.adaptive_pricing, { enabled: false })
  assert.equal(call.params.success_url, config().successUrl)
  assert.equal(call.params.cancel_url, config().cancelUrl)
  assert.equal(
    call.params.expires_at,
    Date.parse(f.state.attempt.expires_at) / 1000
  )
  for (const field of [
    "customer_creation",
    "customer_email",
    "payment_method_types",
    "automatic_tax",
    "allow_promotion_codes",
    "discounts",
    "after_expiration",
    "price_data",
    "currency",
    "amount",
  ])
    assert.equal(field in call.params, false)
  assert.deepEqual(Object.keys(call.params.subscription_data), ["metadata"])
  assert.deepEqual(customer.params, {
    metadata: { organization_id: f.state.customer.organization_id },
  })
  assert.notEqual(customer.options.idempotencyKey, call.options.idempotencyKey)
  assert.equal(call.options.maxNetworkRetries, 2)
  assert.equal(call.options.timeout, 10000)
  assert.match(
    call.params.integration_identifier,
    /^deliplus-checkout-[a-z]{8}$/u
  )
})
test("stripe mock: paginated status=all catches later nonterminal subscriptions", async () => {
  const f = fakeStripe()
  f.state.subscriptions = Array.from({ length: 101 }, (_, i) =>
    subscription(i === 100 ? "unpaid" : "canceled", { id: `sub_${i}` })
  )
  const result = await f.provider.listSubscriptions("cus_checkout", config())
  assert.equal(result.length, 101)
  assert.equal(result[100].status, "unpaid")
  const calls = f.state.calls.filter((c) => c.name === "subscriptions.list")
  assert.equal(calls.length, 2)
  assert.equal(calls[0].params.status, "all")
  assert.equal(calls[1].params.starting_after, "sub_99")
})
for (const patch of [
  { customer: "cus_other" },
  { livemode: true },
  { mode: "payment" },
  { ui_mode: "embedded_page" },
  { currency: "usd" },
  { expires_at: 1 },
  { payment_method_types: ["card", "pix"] },
  { url: "https://evil.example/checkout" },
  { automatic_tax: { enabled: true } },
  { adaptive_pricing: { enabled: true } },
  { allow_promotion_codes: true },
  { discounts: [{ coupon: "coupon_test" }] },
  { metadata: {} },
  { payment_method_configuration_details: { id: "pmc_other" } },
  { line_items: { has_more: true, data: [] } },
  { status: "future" },
]) {
  test(`stripe mock: unsafe Session ${JSON.stringify(patch)}`, () => {
    const attempt = newAttempt()
    const raw = rawSession(checkoutSessionParameters(attempt))
    assert.throws(() => normalizeCheckoutSession({ ...raw, ...patch }, attempt))
  })
}
test("stripe mock: auth and config exceptions never leak raw cause", async () => {
  const f = fixture()
  f.dependencies.getConfiguration = () => {
    throw new Error("synthetic sensitive config")
  }
  await assert.rejects(
    f.run("essential"),
    (e) =>
      e.message === "Unable to resolve subscription Checkout" &&
      e.cause === undefined
  )
})

for (const operation of ["customer", "session"]) {
  for (const failure of ["inflight_conflict", "timeout", "cached_failure"]) {
    test(`stripe mock: ${operation} ${failure} never rotates the persisted key`, async () => {
      const f = fixture()
      const resource =
        operation === "customer"
          ? f.stripe.sdk.customers
          : f.stripe.sdk.checkout.sessions
      const original = resource.create
      const calls = []
      resource.create = async (params, options) => {
        calls.push(structuredClone({ params, options }))
        if (failure === "inflight_conflict" && calls.length === 1)
          throw Object.assign(new Error("Synthetic concurrent request"), {
            statusCode: 409,
            code: "idempotency_key_in_use",
          })
        const result = await original(params, options)
        if (
          failure === "cached_failure" ||
          (failure === "timeout" && calls.length === 1)
        )
          throw Object.assign(new Error("Synthetic provider details"), {
            statusCode: failure === "cached_failure" ? 500 : undefined,
            code: "ETIMEDOUT",
          })
        return result
      }
      const sanitized = (error) =>
        error.name === "StripeCheckoutError" &&
        error.cause === undefined &&
        error.message === "Unable to resolve subscription Checkout"
      await assert.rejects(f.run("essential"), sanitized)
      if (failure === "cached_failure") {
        await assert.rejects(f.run("essential"), sanitized)
        assert.equal(
          operation === "customer"
            ? f.state.customer.provisioning_status
            : f.state.attempt.state,
          operation === "customer" ? "pending" : "creating"
        )
      } else {
        assert.equal((await f.run("essential")).status, "checkout_ready")
      }
      assert.equal(calls.length, 2)
      assert.deepEqual(calls[0], calls[1])
      assert.equal(f.stripe.state.customers.size, 1)
      assert.equal(
        f.stripe.state.sessions.size,
        operation === "customer" && failure === "cached_failure" ? 0 : 1
      )
    })
  }
}
