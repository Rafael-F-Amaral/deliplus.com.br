import "server-only"

import { auth } from "@clerk/nextjs/server"

import { createAdminSupabaseClient } from "@/lib/supabase/admin"

import { createEnsureActiveOrganization } from "./ensure-active-organization.internal"
import {
  createOrganizationProvisioningRepository,
  reportOrganizationProvisioningFailure,
} from "./organization-provisioning.repository"

const organizationProvisioningRepository =
  createOrganizationProvisioningRepository(createAdminSupabaseClient)

const ensureActiveOrganizationForRequest = createEnsureActiveOrganization({
  async getAuth() {
    const { userId, orgId, has } = await auth()

    return { userId, orgId, has }
  },
  ensureOrganization: organizationProvisioningRepository.ensureOrganization,
  reportProvisioningFailure: reportOrganizationProvisioningFailure,
})

export async function ensureActiveOrganization() {
  return ensureActiveOrganizationForRequest()
}

export type {
  EnsureActiveOrganizationResult,
  InternalOrganization,
} from "./ensure-active-organization.internal"
