import "server-only"

import type { OnboardingState } from "../onboarding/resolve-onboarding-state.internal"
import { validatePersistedStoreSlug } from "./store-setup.rules"

export type AccessibleStoreLink = { name: string; slug: string }
export type AccessibleStoreLinksResult =
  | Exclude<OnboardingState, { status: "organization_provisioned" }>
  | { status: "success"; stores: AccessibleStoreLink[] }

export class AccessibleStoreLinksError extends Error {
  constructor(cause?: unknown) {
    super("Unable to read accessible Store links", { cause })
    this.name = "AccessibleStoreLinksError"
  }
}

export function createListAccessibleStoreLinks(dependencies: {
  resolveOnboardingState: () => Promise<OnboardingState>
  readStores: (
    organizationId: string
  ) => Promise<{ data: unknown; error: unknown }>
}) {
  return async function listAccessibleStoreLinks(): Promise<AccessibleStoreLinksResult> {
    try {
      const state = await dependencies.resolveOnboardingState()
      if (state.status !== "organization_provisioned") return state
      const { data, error } = await dependencies.readStores(
        state.organizationId
      )
      if (error || !Array.isArray(data))
        throw new AccessibleStoreLinksError(error)
      const stores = data.map((row): AccessibleStoreLink => {
        if (
          !row ||
          typeof row.name !== "string" ||
          !row.name.trim() ||
          !validatePersistedStoreSlug(row.slug).valid
        ) {
          throw new AccessibleStoreLinksError()
        }
        return { name: row.name, slug: row.slug }
      })
      return { status: "success", stores }
    } catch (cause) {
      throw cause instanceof AccessibleStoreLinksError
        ? cause
        : new AccessibleStoreLinksError(cause)
    }
  }
}
