import "server-only"

import { auth } from "@clerk/nextjs/server"
import { getStripeUpgradePortalConfiguration } from "../stripe/config"
import { createStripeSubscriptionUpgradePortalProvider } from "../stripe/subscription-upgrade-portal"
import { isPlanCode, type PlanCode } from "./plans"
import { createSubscriptionManagementRepository } from "./subscription-management.repository"
import {
  createSubscriptionUpgradePortal,
  SubscriptionUpgradePortalError,
} from "./subscription-upgrade-portal.internal"

export function createSubscriptionUpgradePortalSession(planCode: PlanCode) {
  const operation = createSubscriptionUpgradePortal({
    async getAuth() {
      const { userId, orgId, has } = await auth()
      return {
        userId,
        orgId,
        isAdmin: Boolean(userId && orgId && has({ role: "org:admin" })),
      }
    },
    isPlanCode,
    getConfiguration: getStripeUpgradePortalConfiguration,
    repository: createSubscriptionManagementRepository(),
    stripe: createStripeSubscriptionUpgradePortalProvider(),
  })
  return operation(planCode)
}

export { SubscriptionUpgradePortalError }
