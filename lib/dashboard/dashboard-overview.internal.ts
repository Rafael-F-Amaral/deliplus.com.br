import "server-only"

import type { OrganizationEntitlement } from "../billing/organization-entitlement.internal"
import type {
  AccessibleStoreSummary,
  AccessibleStoreSummaryResult,
} from "../stores/accessible-store-summary.internal"

export type DashboardOverview = {
  organization: { id: string }
  entitlement: OrganizationEntitlement
  stores: AccessibleStoreSummary
}

export type DashboardOverviewResult =
  | Exclude<AccessibleStoreSummaryResult, { status: "success" }>
  | { status: "success"; overview: DashboardOverview }

export class DashboardOverviewError extends Error {
  constructor(cause?: unknown) {
    super("Unable to read dashboard overview", { cause })
    this.name = "DashboardOverviewError"
  }
}

type Dependencies = {
  getAccessibleStoreSummary: () => Promise<AccessibleStoreSummaryResult>
  resolveOrganizationEntitlement: () => Promise<OrganizationEntitlement>
}

export function createGetDashboardOverview(dependencies: Dependencies) {
  return async function getDashboardOverview(): Promise<DashboardOverviewResult> {
    try {
      const summary = await dependencies.getAccessibleStoreSummary()
      if (summary.status !== "success") return summary

      const entitlement = await dependencies.resolveOrganizationEntitlement()
      return {
        status: "success",
        overview: {
          organization: summary.organization,
          entitlement,
          stores: summary.stores,
        },
      }
    } catch (cause) {
      throw new DashboardOverviewError(cause)
    }
  }
}
