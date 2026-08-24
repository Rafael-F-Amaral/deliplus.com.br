import "server-only"

import { auth } from "@clerk/nextjs/server"

import { createAdminSupabaseClient } from "@/lib/supabase/admin"

import { createEnsureActiveOrganization } from "./ensure-active-organization.internal"

async function ensureOrganizationForClerkOrganization(
  clerkOrganizationId: string,
) {
  const supabase = createAdminSupabaseClient()
  const { error: insertError } = await supabase.from("organizations").upsert(
    { clerk_organization_id: clerkOrganizationId },
    {
      onConflict: "clerk_organization_id",
      ignoreDuplicates: true,
    },
  )

  if (insertError) {
    throw new Error("Unable to provision the active Organization")
  }

  const { data, error: selectError } = await supabase
    .from("organizations")
    .select("id, clerk_organization_id")
    .eq("clerk_organization_id", clerkOrganizationId)
    .single()

  if (selectError || !data) {
    throw new Error("Unable to resolve the active Organization")
  }

  return {
    id: data.id,
    clerkOrganizationId: data.clerk_organization_id,
  }
}

const ensureActiveOrganizationForRequest = createEnsureActiveOrganization({
  async getAuth() {
    const { userId, orgId, has } = await auth()

    return { userId, orgId, has }
  },
  ensureOrganization: ensureOrganizationForClerkOrganization,
})

export async function ensureActiveOrganization() {
  return ensureActiveOrganizationForRequest()
}

export type {
  EnsureActiveOrganizationResult,
  InternalOrganization,
} from "./ensure-active-organization.internal"
