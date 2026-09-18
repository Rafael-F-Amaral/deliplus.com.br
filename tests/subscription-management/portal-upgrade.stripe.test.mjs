import "./runtime.mjs"
import assert from "node:assert/strict"
import test from "node:test"

const { createSubscriptionUpgradePortalStripeAdapter } =
  await import("../../lib/stripe/subscription-upgrade-portal.internal.ts")

const local = {
  organizationId: "10000000-0000-4000-8000-000000000001",
  stripeCustomerId: "cus_customer",
  stripeSubscriptionId: "sub_subscription",
  stripePriceId: "price_essential",
  planCode: "essential",
  status: "active",
  currentPeriodEnd: "2026-10-12T00:00:00.000Z",
  cancelAtPeriodEnd: false,
  collectionPaused: false,
  stripeSubscriptionScheduleId: null,
  pendingStripePriceId: null,
  pendingPlanCode: null,
  pendingEffectiveAt: null,
}

const configuration = {
  stripePriceId: "price_trio",
  portalAllowedUpgradePriceIds: ["price_duo", "price_trio"],
  portalConfigurationId: "bpc_deliplus",
  returnUrl:
    "http://localhost:3000/dashboard/billing?portalReturn=1&targetPlan=multi_3",
  currency: "brl",
  recurringInterval: "month",
  recurringIntervalCount: 1,
  livemode: false,
  stripeApiVersion: "2026-07-29.dahlia",
}

const price = (id, product, taxBehavior = "inclusive") => ({
  id,
  object: "price",
  product,
  active: true,
  livemode: false,
  currency: "brl",
  type: "recurring",
  recurring: { interval: "month", interval_count: 1, usage_type: "licensed" },
  billing_scheme: "per_unit",
  transform_quantity: null,
  tiers_mode: null,
  unit_amount: id === "price_trio" ? 27990 : 9990,
  tax_behavior: taxBehavior,
})

function fixture({
  currentTax = "inclusive",
  targetTax = "inclusive",
  duoTax = targetTax,
  includeLowerPrice = false,
  paymentMethodUpdateEnabled = true,
} = {}) {
  let sessionCall
  let configurationRetrieveCall
  const currentPrice = price("price_essential", "prod_essential", currentTax)
  const targetPrice = price("price_trio", "prod_trio", targetTax)
  const duoPrice = price("price_duo", "prod_duo", duoTax)
  const essentialPrice = price("price_essential", "prod_essential", targetTax)
  const client = {
    subscriptions: {
      retrieve: async () => ({
        id: "sub_subscription",
        object: "subscription",
        customer: "cus_customer",
        livemode: false,
        status: "active",
        collection_method: "charge_automatically",
        cancel_at_period_end: false,
        pause_collection: null,
        schedule: null,
        pending_update: null,
        items: {
          has_more: false,
          data: [{ id: "si_item", quantity: 1, price: currentPrice }],
        },
      }),
    },
    prices: {
      retrieve: async (priceId) =>
        priceId === "price_duo"
          ? duoPrice
          : priceId === "price_essential"
            ? essentialPrice
            : targetPrice,
    },
    billingPortal: {
      configurations: {
        retrieve: async (...args) => {
          configurationRetrieveCall = args
          return {
            id: "bpc_deliplus",
            active: true,
            livemode: false,
            login_page: { enabled: false },
            features: {
              customer_update: { enabled: false },
              invoice_history: { enabled: false },
              payment_method_update: {
                enabled: paymentMethodUpdateEnabled,
              },
              subscription_cancel: { enabled: false },
              subscription_update: {
                enabled: true,
                billing_cycle_anchor: "unchanged",
                proration_behavior: "always_invoice",
                default_allowed_updates: ["price"],
                schedule_at_period_end: { conditions: [] },
                products: [
                  {
                    product: "prod_duo",
                    prices: ["price_duo"],
                    adjustable_quantity: { enabled: false },
                  },
                  {
                    product: "prod_trio",
                    prices: ["price_trio"],
                    adjustable_quantity: { enabled: false },
                  },
                  ...(includeLowerPrice
                    ? [
                        {
                          product: "prod_essential",
                          prices: ["price_essential"],
                          adjustable_quantity: { enabled: false },
                        },
                      ]
                    : []),
                ],
              },
            },
          }
        },
      },
      sessions: {
        create: async (...args) => {
          sessionCall = args
          return {
            id: "bps_session",
            object: "billing_portal.session",
            livemode: false,
            customer: "cus_customer",
            configuration: "bpc_deliplus",
            url: "https://billing.stripe.com/p/session/test",
          }
        },
      },
    },
  }
  return {
    adapter: createSubscriptionUpgradePortalStripeAdapter(() => client),
    getSessionCall: () => sessionCall,
    getConfigurationRetrieveCall: () => configurationRetrieveCall,
  }
}

test("Portal adapter sends only canonical exact-upgrade confirmation parameters", async () => {
  const f = fixture()
  assert.equal(
    await f.adapter.createUpgradePortalSession(local, configuration),
    "https://billing.stripe.com/p/session/test"
  )
  assert.deepEqual(f.getConfigurationRetrieveCall().slice(0, 2), [
    "bpc_deliplus",
    { expand: ["features.subscription_update.products"] },
  ])
  assert.deepEqual(f.getSessionCall()[0], {
    customer: "cus_customer",
    configuration: "bpc_deliplus",
    return_url: configuration.returnUrl,
    flow_data: {
      type: "subscription_update_confirm",
      subscription_update_confirm: {
        subscription: "sub_subscription",
        items: [{ id: "si_item", price: "price_trio", quantity: 1 }],
      },
      after_completion: {
        type: "redirect",
        redirect: { return_url: configuration.returnUrl },
      },
    },
  })
  const flow = f.getSessionCall()[0].flow_data
  assert.equal(flow.type, "subscription_update_confirm")
  assert.equal("payment_method_update" in flow, false)
  assert.equal("subscription_update" in flow, false)
  assert.equal("subscription_cancel" in flow, false)
})

test("Portal adapter rejects payment method management disabled because Stripe requires it for subscription updates", async () => {
  const f = fixture({ paymentMethodUpdateEnabled: false })
  await assert.rejects(() =>
    f.adapter.createUpgradePortalSession(local, configuration)
  )
  assert.equal(f.getSessionCall(), undefined)
})

for (const tax of ["unspecified", "exclusive"]) {
  test(`Portal adapter rejects incompatible target tax behavior ${tax}`, async () => {
    const f = fixture({ targetTax: tax })
    await assert.rejects(() =>
      f.adapter.createUpgradePortalSession(local, configuration)
    )
    assert.equal(f.getSessionCall(), undefined)
  })
}

test("Portal adapter rejects current unspecified tax behavior", async () => {
  const f = fixture({ currentTax: "unspecified" })
  await assert.rejects(() =>
    f.adapter.createUpgradePortalSession(local, configuration)
  )
  assert.equal(f.getSessionCall(), undefined)
})

test("Portal adapter rejects mixed tax behavior among configured upgrade Prices", async () => {
  const f = fixture({ duoTax: "exclusive" })
  await assert.rejects(() =>
    f.adapter.createUpgradePortalSession(local, configuration)
  )
  assert.equal(f.getSessionCall(), undefined)
})

test("Portal adapter rejects a configuration that exposes the lower Essential Price", async () => {
  const f = fixture({ includeLowerPrice: true })
  await assert.rejects(() =>
    f.adapter.createUpgradePortalSession(local, configuration)
  )
  assert.equal(f.getSessionCall(), undefined)
})
