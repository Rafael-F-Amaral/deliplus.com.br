import "server-only"
import { resolveOnboardingState } from "@/lib/onboarding/resolve-onboarding-state"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function getActiveStoreId() {
  const state = await resolveOnboardingState()
  if (state.status !== "organization_provisioned") return null
  
  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from("stores")
    .select("id")
    .eq("organization_id", state.organizationId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle()
    
  return data?.id || null
}
