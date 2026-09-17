import "server-only"

import type Stripe from "stripe"
import { validateCheckoutPrice } from "./checkout.internal"
import type { ManageableSubscription } from "../billing/subscription-management.internal"
import type { UpgradePortalConfiguration } from "../billing/subscription-upgrade-portal.internal"

type UpgradePortalSdk = Pick<
  Stripe,
  "billingPortal" | "prices" | "subscriptions"
>

const requestOptions = { maxNetworkRetries: 2, timeout: 10_000 } as const

function invariant(value: unknown): asserts value {
  if (!value) throw new Error("Invalid Stripe upgrade Portal contract")
}

function id(value: unknown, prefix: string) {
  const result =
    typeof value === "string"
      ? value
      : value && typeof value === "object" && "id" in value
        ? value.id
        : null
  invariant(
    typeof result === "string" &&
      new RegExp(`^${prefix}_[A-Za-z0-9]+$`, "u").test(result)
  )
  return result
}

function validatePortalConfiguration(
  value: Stripe.BillingPortal.Configuration,
  allowedUpgradePrices: readonly Stripe.Price[],
  config: UpgradePortalConfiguration
) {
  const updates = value.features.subscription_update
  invariant(
    value.id === config.portalConfigurationId &&
      value.active &&
      value.livemode === config.livemode &&
      value.login_page.enabled === false &&
      value.features.subscription_cancel.enabled === false &&
      value.features.customer_update.enabled === false &&
      value.features.invoice_history.enabled === false &&
      value.features.payment_method_update.enabled === true &&
      updates.enabled &&
      updates.billing_cycle_anchor === "unchanged" &&
      updates.proration_behavior === "always_invoice" &&
      updates.default_allowed_updates.length === 1 &&
      updates.default_allowed_updates[0] === "price" &&
      (updates.schedule_at_period_end?.conditions.length ?? 0) === 0
  )
  const expected = new Map(
    allowedUpgradePrices.map((price) => [id(price.product, "prod"), price.id])
  )
  const products = updates.products ?? []
  invariant(
    expected.size === config.portalAllowedUpgradePriceIds.length &&
      products.length === expected.size &&
      products.every((product) => {
        const expectedPrice = expected.get(id(product.product, "prod"))
        return (
          expectedPrice !== undefined &&
          product.prices.length === 1 &&
          product.prices[0] === expectedPrice &&
          product.adjustable_quantity.enabled === false
        )
      })
  )
}

export function createSubscriptionUpgradePortalStripeAdapter(
  getClient: () => UpgradePortalSdk
) {
  return {
    async createUpgradePortalSession(
      local: ManageableSubscription,
      config: UpgradePortalConfiguration
    ) {
      const client = getClient()
      const [
        subscription,
        targetPrice,
        portalConfiguration,
        allowedUpgradePrices,
      ] = await Promise.all([
        client.subscriptions.retrieve(
          local.stripeSubscriptionId,
          { expand: ["items.data.price"] },
          requestOptions
        ),
        client.prices.retrieve(config.stripePriceId, {}, requestOptions),
        client.billingPortal.configurations.retrieve(
          config.portalConfigurationId,
          { expand: ["features.subscription_update.products"] },
          requestOptions
        ),
        Promise.all(
          config.portalAllowedUpgradePriceIds.map((priceId) =>
            client.prices.retrieve(priceId, {}, requestOptions)
          )
        ),
      ])

      validateCheckoutPrice(targetPrice, config)
      invariant(
        allowedUpgradePrices.some((price) => price.id === targetPrice.id)
      )
      for (const allowedPrice of allowedUpgradePrices)
        validateCheckoutPrice(allowedPrice, {
          ...config,
          stripePriceId: allowedPrice.id,
        })
      invariant(
        (targetPrice.tax_behavior === "inclusive" ||
          targetPrice.tax_behavior === "exclusive") &&
          allowedUpgradePrices.every(
            (price) => price.tax_behavior === targetPrice.tax_behavior
          )
      )
      validatePortalConfiguration(
        portalConfiguration,
        allowedUpgradePrices,
        config
      )
      invariant(
        subscription.object === "subscription" &&
          subscription.livemode === config.livemode &&
          subscription.status === "active" &&
          subscription.collection_method === "charge_automatically" &&
          subscription.cancel_at_period_end === false &&
          subscription.pause_collection === null &&
          subscription.schedule === null &&
          subscription.pending_update === null &&
          id(subscription.customer, "cus") === local.stripeCustomerId &&
          subscription.id === local.stripeSubscriptionId &&
          subscription.items.has_more === false &&
          subscription.items.data.length === 1
      )
      const item = subscription.items.data[0]
      invariant(
        item.quantity === 1 &&
          item.price.id === local.stripePriceId &&
          item.price.active &&
          item.price.livemode === config.livemode &&
          item.price.currency === config.currency &&
          item.price.type === "recurring" &&
          item.price.recurring?.interval === config.recurringInterval &&
          item.price.recurring.interval_count ===
            config.recurringIntervalCount &&
          item.price.recurring.usage_type === "licensed" &&
          item.price.tax_behavior === targetPrice.tax_behavior
      )

      const session = await client.billingPortal.sessions.create(
        {
          customer: local.stripeCustomerId,
          configuration: config.portalConfigurationId,
          return_url: config.returnUrl,
          flow_data: {
            type: "subscription_update_confirm",
            subscription_update_confirm: {
              subscription: local.stripeSubscriptionId,
              items: [
                {
                  id: id(item, "si"),
                  price: config.stripePriceId,
                  quantity: 1,
                },
              ],
            },
            after_completion: {
              type: "redirect",
              redirect: { return_url: config.returnUrl },
            },
          },
        },
        requestOptions
      )
      const portalUrl = new URL(session.url)
      invariant(
        session.object === "billing_portal.session" &&
          session.livemode === config.livemode &&
          session.customer === local.stripeCustomerId &&
          id(session.configuration, "bpc") === config.portalConfigurationId &&
          portalUrl.protocol === "https:"
      )
      return portalUrl.toString()
    },
  }
}
