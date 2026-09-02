import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { isPlanCode } from "../../lib/billing/plans.ts"
import { createSubscriptionCheckout } from "../../lib/billing/subscription-checkout.internal.ts"
import { createCheckoutStripeAdapter } from "../../lib/stripe/checkout.internal.ts"

export const organizationId = "90000000-0000-4000-8000-000000000001"
export const config = (plan = "essential") => ({
  stripePriceId: `price_${plan.replaceAll("_", "")}`,
  currency: "brl",
  recurringInterval: "month",
  recurringIntervalCount: 1,
  paymentMethodConfigurationId: "pmc_checkout",
  livemode: false,
  stripeApiVersion: "2026-07-29.dahlia",
  successUrl: "https://deli.example/dashboard/billing/success",
  cancelUrl: "https://deli.example/dashboard/billing",
})
export function newAttempt(
  plan = "essential",
  org = organizationId,
  customerId = "cus_checkout",
  configuration = config(plan)
) {
  const now = Date.now()
  const id = randomUUID()
  return {
    id,
    organization_id: org,
    plan_code: plan,
    stripe_customer_id: customerId,
    stripe_price_id: configuration.stripePriceId,
    stripe_idempotency_key: `deli-plus:checkout:v1:${id}`,
    stripe_checkout_session_id: null,
    state: "creating",
    expires_at: new Date(
      Math.floor(now / 1000) * 1000 + 3600_000
    ).toISOString(),
    success_url: configuration.successUrl,
    cancel_url: configuration.cancelUrl,
    payment_method_configuration_id: configuration.paymentMethodConfigurationId,
    integration_identifier: "deliplus-checkout-abcdefgh",
    payload_version: 1,
    stripe_api_version: configuration.stripeApiVersion,
    livemode: configuration.livemode,
    revision: 0,
    created_at: new Date(now).toISOString(),
    updated_at: new Date(now).toISOString(),
    ended_at: null,
  }
}
export const price = (id = config().stripePriceId) => ({
  object: "price",
  id,
  active: true,
  livemode: false,
  currency: "brl",
  type: "recurring",
  recurring: { interval: "month", interval_count: 1, usage_type: "licensed" },
  billing_scheme: "per_unit",
  tiers_mode: null,
  transform_quantity: null,
  unit_amount: 9990,
})
export const paymentConfiguration = () => ({
  id: "pmc_checkout",
  object: "payment_method_configuration",
  active: true,
  livemode: false,
  application: null,
  parent: null,
  card: { available: true, display_preference: { value: "on" } },
  pix: { available: false, display_preference: { value: "off" } },
  link: { available: false, display_preference: { value: "off" } },
})
export const subscription = (status, overrides = {}) => ({
  id: "sub_checkout",
  object: "subscription",
  customer: "cus_checkout",
  status,
  livemode: false,
  pause_collection: null,
  metadata: {},
  ...overrides,
})
export function rawSession(params, sessionId = "cs_test_checkout") {
  return {
    object: "checkout.session",
    id: sessionId,
    customer: params.customer,
    mode: params.mode,
    ui_mode: params.ui_mode,
    status: "open",
    url: `https://checkout.stripe.com/c/pay/${sessionId}`,
    livemode: false,
    currency: "brl",
    expires_at: params.expires_at,
    success_url: params.success_url,
    cancel_url: params.cancel_url,
    integration_identifier: params.integration_identifier,
    metadata: params.metadata,
    subscription: null,
    payment_method_configuration_details: {
      id: params.payment_method_configuration,
    },
    payment_method_types: ["card"],
    adaptive_pricing: { enabled: false },
    automatic_tax: { enabled: false },
    allow_promotion_codes: null,
    discounts: [],
    after_expiration: null,
    recovered_from: null,
    line_items: {
      object: "list",
      has_more: false,
      data: [{ quantity: 1, price: price(params.line_items[0].price) }],
    },
  }
}

export function fakeStripe() {
  const state = {
    calls: [],
    customers: new Map(),
    sessions: new Map(),
    subscriptions: [],
    loss: null,
    fail: null,
  }
  const keys = new Map()
  async function call(name, params, options, run) {
    state.calls.push({
      name,
      params: structuredClone(params),
      options: structuredClone(options),
    })
    if (state.fail === name) throw new Error("synthetic provider failure")
    const key = options?.idempotencyKey
    if (key && keys.has(key)) {
      const previous = keys.get(key)
      assert.deepEqual(params, previous.params)
      return structuredClone(previous.result)
    }
    const result = run()
    if (key)
      keys.set(key, {
        params: structuredClone(params),
        result: structuredClone(result),
      })
    if (state.loss === name) {
      state.loss = null
      throw new Error("synthetic response lost after creation")
    }
    return structuredClone(result)
  }
  const sdk = {
    customers: {
      create: (params, options) =>
        call("customers.create", params, options, () => {
          const value = {
            object: "customer",
            id: `cus_checkout${state.customers.size || ""}`,
            livemode: false,
          }
          state.customers.set(value.id, value)
          return value
        }),
      retrieve: (id, params, options) =>
        call("customers.retrieve", { id, ...params }, options, () => {
          const value = state.customers.get(id)
          if (!value)
            throw Object.assign(new Error("missing"), {
              code: "resource_missing",
            })
          return value
        }),
    },
    prices: {
      retrieve: (id, params, options) =>
        call("prices.retrieve", { id, ...params }, options, () => price(id)),
    },
    paymentMethodConfigurations: {
      retrieve: (id, params, options) =>
        call(
          "paymentMethodConfigurations.retrieve",
          { id, ...params },
          options,
          paymentConfiguration
        ),
    },
    subscriptions: {
      list: (params, options) =>
        call("subscriptions.list", params, options, () => {
          const start = params.starting_after
            ? state.subscriptions.findIndex(
                (s) => s.id === params.starting_after
              ) + 1
            : 0
          return {
            object: "list",
            data: state.subscriptions.slice(start, start + 100),
            has_more: start + 100 < state.subscriptions.length,
          }
        }),
    },
    checkout: {
      sessions: {
        create: (params, options) =>
          call("checkout.sessions.create", params, options, () => {
            const value = rawSession(
              params,
              `cs_test_checkout${state.sessions.size || ""}`
            )
            state.sessions.set(value.id, value)
            return value
          }),
        retrieve: (id, params, options) =>
          call("checkout.sessions.retrieve", { id, ...params }, options, () => {
            const value = state.sessions.get(id)
            if (!value)
              throw Object.assign(new Error("missing"), {
                code: "resource_missing",
              })
            return value
          }),
      },
    },
  }
  return { state, sdk, provider: createCheckoutStripeAdapter(() => sdk) }
}

export function fixture() {
  const stripe = fakeStripe()
  const state = {
    auth: { userId: "user_test", orgId: "org_test", isAdmin: true },
    organizationId,
    customer: null,
    attempt: null,
    subscription: null,
    failure: null,
    ended: [],
    calls: [],
    clockOffset: 0,
  }
  const repository = {
    async findOrganization(clerkOrg) {
      state.calls.push(["findOrganization", clerkOrg])
      return state.organizationId
    },
    async readSubscription() {
      return state.subscription
    },
    async readAttempt() {
      return structuredClone(state.attempt)
    },
    async claimCustomer(org) {
      state.calls.push(["claimCustomer", org])
      state.customer ??= {
        organization_id: org,
        stripe_customer_id: null,
        provisioning_status: "pending",
        creation_idempotency_key: `deli-plus:customer:v1:${randomUUID()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      return structuredClone(state.customer)
    },
    async finalizeCustomer(claim, id) {
      if (state.failure === "finalize") throw new Error("synthetic SQL failure")
      assert.equal(
        claim.creation_idempotency_key,
        state.customer.creation_idempotency_key
      )
      assert.ok(
        !state.customer.stripe_customer_id ||
          state.customer.stripe_customer_id === id
      )
      state.customer.stripe_customer_id = id
      state.customer.provisioning_status = "ready"
      return structuredClone(state.customer)
    },
    async claimAttempt(org, customerId, plan, configuration) {
      assert.equal(state.customer.provisioning_status, "ready")
      state.attempt ??= newAttempt(plan, org, customerId, configuration)
      return {
        outcome:
          state.attempt.plan_code === plan ? "attempt" : "checkout_in_progress",
        attempt: structuredClone(state.attempt),
      }
    },
    async reconcile(attempt, sessionId, next) {
      if (state.failure === "attach") throw new Error("synthetic SQL failure")
      if (state.failure === "stale")
        return { outcome: "stale", attempt: { ...state.attempt, revision: 99 } }
      assert.ok(
        !state.attempt.stripe_checkout_session_id ||
          state.attempt.stripe_checkout_session_id === sessionId
      )
      if (
        state.attempt.state !== next ||
        state.attempt.stripe_checkout_session_id !== sessionId
      ) {
        state.attempt.state = next
        state.attempt.stripe_checkout_session_id = sessionId
        state.attempt.revision++
      }
      return { outcome: "attempt", attempt: structuredClone(state.attempt) }
    },
    async endAttempt(attempt, session, correlatedTerminal) {
      assert.ok(session.status === "expired" || correlatedTerminal)
      const ended = {
        ...state.attempt,
        state: "ended",
        ended_at: new Date().toISOString(),
      }
      state.ended.push(ended)
      state.attempt = null
      return { outcome: "attempt", attempt: ended }
    },
  }
  const dependencies = {
    getAuth: async () => state.auth,
    repository,
    stripe: stripe.provider,
    isPlanCode,
    getConfiguration: config,
    now: () => Date.now() + state.clockOffset,
  }
  return {
    state,
    stripe,
    repository,
    dependencies,
    run: createSubscriptionCheckout(dependencies),
  }
}
