import "server-only"

import { resolveOnboardingState } from "@/lib/onboarding/resolve-onboarding-state"
import { createServerSupabaseClient } from "@/lib/supabase/server"

import { createGetAccessibleStoreSummary } from "./accessible-store-summary.internal"

const getAccessibleStoreSummaryForRequest = createGetAccessibleStoreSummary({
  resolveOnboardingState,
  async countStores(organizationId, activeOnly) {
    const supabase = createServerSupabaseClient()
    let query = supabase
      .from("stores")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)

    if (activeOnly) query = query.eq("status", "active")

    const { count, error } = await query
    return { count, error }
  },
})

export async function getAccessibleStoreSummary() {
  return getAccessibleStoreSummaryForRequest()
}

export {
  AccessibleStoreSummaryError,
  type AccessibleStoreSummary,
  type AccessibleStoreSummaryResult,
} from "./accessible-store-summary.internal"
