import "server-only"

import type { OnboardingState } from "../onboarding/resolve-onboarding-state.internal"

export type AccessibleStoreSummary = {
  scope: "accessible"
  total: number
  active: number
}

export type AccessibleStoreSummaryResult =
  | Exclude<OnboardingState, { status: "organization_provisioned" }>
  | {
      status: "success"
      organization: { id: string }
      stores: AccessibleStoreSummary
    }

export class AccessibleStoreSummaryError extends Error {
  constructor(cause?: unknown) {
    super("Unable to read accessible Store summary", { cause })
    this.name = "AccessibleStoreSummaryError"
  }
}

type Dependencies = {
  resolveOnboardingState: () => Promise<OnboardingState>
  countStores: (
    organizationId: string,
    activeOnly: boolean
  ) => Promise<{ count: number | null; error: unknown | null }>
}

export function createGetAccessibleStoreSummary(dependencies: Dependencies) {
  return async function getAccessibleStoreSummary(): Promise<AccessibleStoreSummaryResult> {
    try {
      const state = await dependencies.resolveOnboardingState()
      if (state.status !== "organization_provisioned") return state

      const results = await Promise.all([
        dependencies.countStores(state.organizationId, false),
        dependencies.countStores(state.organizationId, true),
      ])
      const counts = results.map(({ count, error }) => {
        if (
          error !== null ||
          count === null ||
          !Number.isSafeInteger(count) ||
          count < 0
        ) {
          throw new AccessibleStoreSummaryError(error)
        }
        return count
      })

      return {
        status: "success",
        organization: { id: state.organizationId },
        stores: { scope: "accessible", total: counts[0], active: counts[1] },
      }
    } catch (cause) {
      throw cause instanceof AccessibleStoreSummaryError
        ? cause
        : new AccessibleStoreSummaryError(cause)
    }
  }
}
