import "server-only"

import { createServerSupabaseClient } from "../supabase/server"
import { parseOrganizationBillingState } from "./organization-billing-state.internal"

export async function resolveOrganizationBillingState() {
  const { data, error } = await createServerSupabaseClient()
    .rpc("resolve_active_organization_billing_state")
    .maybeSingle()
  if (error) throw new Error("Unable to resolve organization billing state")
  return parseOrganizationBillingState(data)
}

export type { OrganizationBillingState } from "./organization-billing-state.internal"
