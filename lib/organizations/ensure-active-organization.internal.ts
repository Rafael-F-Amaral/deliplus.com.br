import "server-only"

export type InternalOrganization = {
  id: string
  clerkOrganizationId: string
}

export type EnsureActiveOrganizationResult =
  | { status: "ready"; organization: InternalOrganization }
  | { status: "unauthenticated" }
  | { status: "no_active_organization" }
  | { status: "forbidden" }
  | { status: "provisioning_failed" }

type ProvisioningAuth = {
  userId: string | null
  orgId: string | null | undefined
  has: (params: { role: string }) => boolean
}

type EnsureActiveOrganizationDependencies = {
  getAuth: () => Promise<ProvisioningAuth>
  ensureOrganization: (
    clerkOrganizationId: string,
  ) => Promise<InternalOrganization>
}

export function createEnsureActiveOrganization(
  dependencies: EnsureActiveOrganizationDependencies,
) {
  return async function ensureActiveOrganization(): Promise<EnsureActiveOrganizationResult> {
    const { userId, orgId, has } = await dependencies.getAuth()

    if (!userId) {
      return { status: "unauthenticated" }
    }

    if (!orgId) {
      return { status: "no_active_organization" }
    }

    if (!has({ role: "org:admin" })) {
      return { status: "forbidden" }
    }

    try {
      const organization = await dependencies.ensureOrganization(orgId)

      return { status: "ready", organization }
    } catch {
      return { status: "provisioning_failed" }
    }
  }
}
