import "server-only"

import { auth } from "@clerk/nextjs/server"
import {
  getStripeApiLivemode,
  resolvePlanCodeFromStripePriceId,
  resolveStripePriceId,
} from "../stripe/config"
import { createStripeSubscriptionManagementProvider } from "../stripe/subscription-management"
import { isPlanCode, type PlanCode } from "./plans"
import { createSubscriptionManagement } from "./subscription-management.internal"
import { createSubscriptionManagementRepository } from "./subscription-management.repository"

function configuration(planCode: PlanCode) {
  const stripePriceId = resolveStripePriceId(planCode)
  if (resolvePlanCodeFromStripePriceId(stripePriceId) !== planCode)
    throw new Error("Invalid management Price mapping")
  return {
    stripePriceId,
    currency: "brl" as const,
    recurringInterval: "month" as const,
    recurringIntervalCount: 1 as const,
    livemode: getStripeApiLivemode(),
    stripeApiVersion: "2026-07-29.dahlia" as const,
  }
}

function operation() {
  return createSubscriptionManagement({
    async getAuth() {
      const { userId, orgId, has } = await auth()
      return {
        userId,
        orgId,
        isAdmin: Boolean(userId && orgId && has({ role: "org:admin" })),
      }
    },
    isPlanCode,
    getConfiguration: configuration,
    repository: createSubscriptionManagementRepository(),
    stripe: createStripeSubscriptionManagementProvider(),
  })
}

export function scheduleOrganizationPlanDowngrade(planCode: PlanCode) {
  return operation()(planCode)
}

export function cancelScheduledOrganizationPlanChange() {
  return operation()(null)
}

export { SubscriptionManagementError } from "./subscription-management.internal"
