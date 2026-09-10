import "server-only"

import { auth } from "@clerk/nextjs/server"
import {
  resolveOrganizationEntitlement,
  type OrganizationEntitlement,
} from "@/lib/billing/organization-entitlement"
import { resolveOnboardingState } from "@/lib/onboarding/resolve-onboarding-state"

export type BillingPageState =
  | {
      kind: "resolved"
      entitlement: OrganizationEntitlement
      isAdmin: boolean
      organizationName: string
    }
  | { kind: "unauthenticated" | "no_active_organization" | "unavailable" }
  | { kind: "organization_not_provisioned"; canProvision: boolean }

// Presentation-only read composition. Neither this result nor disabled UI grants
// permission: Checkout independently authorizes inside the domain on every POST.
export async function readBillingPageState(): Promise<BillingPageState> {
  try {
    const onboardingState = await resolveOnboardingState()

    if (onboardingState.status === "organization_not_provisioned") {
      return {
        kind: onboardingState.status,
        canProvision: onboardingState.canProvision,
      }
    }

    if (onboardingState.status !== "organization_provisioned") {
      return { kind: onboardingState.status }
    }

    const { orgSlug, has } = await auth()
    const entitlement = await resolveOrganizationEntitlement()

    return {
      kind: "resolved",
      entitlement,
      isAdmin: has({ role: "org:admin" }),
      organizationName: orgSlug || "Organização ativa",
    }
  } catch {
    return { kind: "unavailable" }
  }
}
