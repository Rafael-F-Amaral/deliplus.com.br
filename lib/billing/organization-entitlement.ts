import "server-only"

import { auth } from "@clerk/nextjs/server"

import { createServerSupabaseClient } from "@/lib/supabase/server"

import { getPlanDefinition } from "./plans"
import { BILLING_SUBSCRIPTION_STATUSES } from "./subscription-reducer"
import {
  createResolveOrganizationEntitlement,
  type PlanEntitlement,
} from "./organization-entitlement.internal"

function resolvePlanEntitlement(value: unknown): PlanEntitlement {
  const plan = getPlanDefinition(value)

  switch (plan.code) {
    case "essential":
      return {
        planCode: plan.code,
        maxStores: plan.maxStores,
      }
    case "multi_2":
      return {
        planCode: plan.code,
        maxStores: plan.maxStores,
      }
    case "multi_3":
      return {
        planCode: plan.code,
        maxStores: plan.maxStores,
      }
  }
}

function isSubscriptionStatus(
  value: unknown
): value is (typeof BILLING_SUBSCRIPTION_STATUSES)[number] {
  return (
    typeof value === "string" &&
    BILLING_SUBSCRIPTION_STATUSES.some((status) => status === value)
  )
}

async function readActiveOrganizationEntitlementFacts() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .rpc("resolve_active_organization_entitlement_facts")
    .maybeSingle()

  return { data, error }
}

const resolveOrganizationEntitlementForRequest =
  createResolveOrganizationEntitlement({
    async getAuth() {
      const { userId, orgId } = await auth()

      return { userId, orgId }
    },
    readFacts: readActiveOrganizationEntitlementFacts,
    resolvePlanEntitlement,
    isSubscriptionStatus,
  })

export async function resolveOrganizationEntitlement() {
  return resolveOrganizationEntitlementForRequest()
}

export {
  OrganizationEntitlementPreconditionError,
  OrganizationEntitlementResolutionError,
  type OrganizationEntitlement,
  type OrganizationEntitlementPreconditionCode,
  type PlanEntitlement,
} from "./organization-entitlement.internal"
