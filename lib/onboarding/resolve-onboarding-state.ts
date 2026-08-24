import "server-only"

import { auth } from "@clerk/nextjs/server"

import { createServerSupabaseClient } from "@/lib/supabase/server"

import { createResolveOnboardingState } from "./resolve-onboarding-state.internal"

async function findOrganizationForClerkOrganization(
  clerkOrganizationId: string
) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from("organizations")
    .select("id")
    .eq("clerk_organization_id", clerkOrganizationId)
    .maybeSingle()

  return { data, error }
}

const resolveOnboardingStateForRequest = createResolveOnboardingState({
  async getAuth() {
    const { userId, orgId, has } = await auth()

    return { userId, orgId, has }
  },
  findOrganization: findOrganizationForClerkOrganization,
})

export async function resolveOnboardingState() {
  return resolveOnboardingStateForRequest()
}

export {
  OnboardingStateResolutionError,
  type OnboardingState,
} from "./resolve-onboarding-state.internal"
