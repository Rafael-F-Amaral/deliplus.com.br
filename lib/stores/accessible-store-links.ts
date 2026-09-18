import "server-only"

import { resolveOnboardingState } from "@/lib/onboarding/resolve-onboarding-state"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createListAccessibleStoreLinks } from "./accessible-store-links.internal"

const listForRequest = createListAccessibleStoreLinks({
  resolveOnboardingState,
  async readStores(organizationId) {
    return await createServerSupabaseClient()
      .from("stores")
      .select("name, slug")
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .order("slug")
  },
})

export async function listAccessibleStoreLinks() {
  return listForRequest()
}

export type {
  AccessibleStoreLink,
  AccessibleStoreLinksResult,
} from "./accessible-store-links.internal"
export { AccessibleStoreLinksError } from "./accessible-store-links.internal"
