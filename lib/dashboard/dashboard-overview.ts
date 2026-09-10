import "server-only"

import { resolveOrganizationEntitlement } from "@/lib/billing/organization-entitlement"
import { getAccessibleStoreSummary } from "@/lib/stores/accessible-store-summary"

import { createGetDashboardOverview } from "./dashboard-overview.internal"

const getDashboardOverviewForRequest = createGetDashboardOverview({
  getAccessibleStoreSummary,
  resolveOrganizationEntitlement,
})

export async function getDashboardOverview() {
  return getDashboardOverviewForRequest()
}

export {
  DashboardOverviewError,
  type DashboardOverview,
  type DashboardOverviewResult,
} from "./dashboard-overview.internal"
