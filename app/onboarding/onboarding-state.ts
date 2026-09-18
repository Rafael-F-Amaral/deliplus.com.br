import "server-only"

import { resolveOnboardingState } from "@/lib/onboarding/resolve-onboarding-state"
import { listStoresForSetup } from "@/lib/stores/store-setup"

export type OnboardingCoordinatorState =
  | { kind: "unauthenticated" }
  | { kind: "no_active_organization" }
  | { kind: "organization_not_provisioned"; canProvision: boolean }
  | { kind: "redirect"; destination: "/dashboard" | "/dashboard/stores/new" }
  | { kind: "unavailable" }

export async function readOnboardingCoordinatorState(): Promise<OnboardingCoordinatorState> {
  try {
    const onboardingState = await resolveOnboardingState()

    if (onboardingState.status === "unauthenticated") {
      return { kind: "unauthenticated" }
    }

    if (onboardingState.status === "no_active_organization") {
      return { kind: "no_active_organization" }
    }

    if (onboardingState.status === "organization_not_provisioned") {
      return {
        kind: "organization_not_provisioned",
        canProvision: onboardingState.canProvision,
      }
    }

    const stores = await listStoresForSetup()

    if (stores.status === "success") {
      return {
        kind: "redirect",
        destination:
          stores.stores.length === 0 ? "/dashboard/stores/new" : "/dashboard",
      }
    }

    // Store setup is intentionally admin-only. A provisioned member must not
    // gain setup authority merely so this coordinator can count Stores.
    if (stores.status === "forbidden") {
      return { kind: "redirect", destination: "/dashboard" }
    }

    if (stores.status === "unauthenticated") {
      return { kind: "unauthenticated" }
    }

    if (stores.status === "no_active_organization") {
      return { kind: "no_active_organization" }
    }

    return { kind: "unavailable" }
  } catch {
    return { kind: "unavailable" }
  }
}
