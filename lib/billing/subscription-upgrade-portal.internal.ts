import "server-only"

import { getPlanDefinition, type PlanCode } from "./plans"
import type { ManageableSubscription } from "./subscription-management.internal"

export type UpgradePortalConfiguration = {
  stripePriceId: string
  portalAllowedUpgradePriceIds: readonly [string, string]
  portalConfigurationId: string
  returnUrl: string
  currency: "brl"
  recurringInterval: "month"
  recurringIntervalCount: 1
  livemode: boolean
  stripeApiVersion: "2026-07-29.dahlia"
}

export type SubscriptionUpgradePortalResult =
  | { status: "portal_ready"; portalUrl: string }
  | {
      status:
        | "unauthenticated"
        | "no_active_organization"
        | "not_admin"
        | "organization_not_provisioned"
        | "invalid_plan"
        | "same_plan"
        | "upgrade_only"
        | "no_paid_subscription"
        | "subscription_not_manageable"
        | "scheduled_change_exists"
    }

type Dependencies = {
  getAuth: () => Promise<{
    userId: string | null
    orgId: string | null | undefined
    isAdmin: boolean
  }>
  isPlanCode: (value: unknown) => value is PlanCode
  getConfiguration: (planCode: PlanCode) => UpgradePortalConfiguration
  repository: {
    findOrganization: (clerkOrganizationId: string) => Promise<string | null>
    readSubscription: (
      organizationId: string
    ) => Promise<ManageableSubscription | null>
  }
  stripe: {
    createUpgradePortalSession: (
      subscription: ManageableSubscription,
      configuration: UpgradePortalConfiguration
    ) => Promise<string>
  }
}

export class SubscriptionUpgradePortalError extends Error {
  constructor() {
    super("Unable to create subscription upgrade Portal session")
    this.name = "SubscriptionUpgradePortalError"
  }
}

export function createSubscriptionUpgradePortal(deps: Dependencies) {
  return async function createUpgradePortalSession(
    targetPlanCode: PlanCode
  ): Promise<SubscriptionUpgradePortalResult> {
    try {
      const auth = await deps.getAuth()
      if (!auth.userId) return { status: "unauthenticated" }
      if (!auth.orgId) return { status: "no_active_organization" }
      if (!auth.isAdmin) return { status: "not_admin" }
      if (!deps.isPlanCode(targetPlanCode)) return { status: "invalid_plan" }

      const organizationId = await deps.repository.findOrganization(auth.orgId)
      if (!organizationId) return { status: "organization_not_provisioned" }
      const subscription =
        await deps.repository.readSubscription(organizationId)
      if (!subscription) return { status: "no_paid_subscription" }
      if (
        subscription.status !== "active" ||
        subscription.collectionPaused ||
        subscription.cancelAtPeriodEnd
      )
        return { status: "subscription_not_manageable" }
      if (
        subscription.stripeSubscriptionScheduleId ||
        subscription.pendingPlanCode
      )
        return { status: "scheduled_change_exists" }
      if (targetPlanCode === subscription.planCode)
        return { status: "same_plan" }
      if (
        getPlanDefinition(targetPlanCode).maxStores <=
        getPlanDefinition(subscription.planCode).maxStores
      )
        return { status: "upgrade_only" }

      const configuration = deps.getConfiguration(targetPlanCode)
      const portalUrl = await deps.stripe.createUpgradePortalSession(
        subscription,
        configuration
      )
      return { status: "portal_ready", portalUrl }
    } catch {
      throw new SubscriptionUpgradePortalError()
    }
  }
}
