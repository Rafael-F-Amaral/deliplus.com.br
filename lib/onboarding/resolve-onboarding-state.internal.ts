export type OnboardingState =
  | { status: "unauthenticated" }
  | { status: "no_active_organization" }
  | {
      status: "organization_not_provisioned"
      canProvision: boolean
    }
  | {
      status: "organization_provisioned"
      organizationId: string
    }

type OnboardingAuth = {
  userId: string | null
  orgId: string | null | undefined
  has: (params: { role: string }) => boolean
}

type OrganizationLookupResult = {
  data: { id: string } | null
  error: unknown | null
}

type ResolveOnboardingStateDependencies = {
  getAuth: () => Promise<OnboardingAuth>
  findOrganization: (
    clerkOrganizationId: string
  ) => Promise<OrganizationLookupResult>
}

export class OnboardingStateResolutionError extends Error {
  constructor(cause?: unknown) {
    super("Unable to resolve onboarding state", { cause })
    this.name = "OnboardingStateResolutionError"
  }
}

export function createResolveOnboardingState(
  dependencies: ResolveOnboardingStateDependencies
) {
  return async function resolveOnboardingState(): Promise<OnboardingState> {
    const { userId, orgId, has } = await dependencies.getAuth()

    if (!userId) {
      return { status: "unauthenticated" }
    }

    if (!orgId) {
      return { status: "no_active_organization" }
    }

    let lookupResult: OrganizationLookupResult

    try {
      lookupResult = await dependencies.findOrganization(orgId)
    } catch (cause) {
      throw new OnboardingStateResolutionError(cause)
    }

    if (lookupResult.error !== null) {
      throw new OnboardingStateResolutionError(lookupResult.error)
    }

    if (!lookupResult.data) {
      return {
        status: "organization_not_provisioned",
        canProvision: has({ role: "org:admin" }),
      }
    }

    return {
      status: "organization_provisioned",
      organizationId: lookupResult.data.id,
    }
  }
}
