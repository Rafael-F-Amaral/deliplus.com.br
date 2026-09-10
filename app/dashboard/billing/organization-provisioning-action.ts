"use server"

import { redirect } from "next/navigation"

import { ensureActiveOrganization } from "@/lib/organizations/ensure-active-organization"

import type { OrganizationProvisioningActionState } from "./organization-provisioning-feedback"

export async function provisionActiveOrganization(
  _previousState: OrganizationProvisioningActionState,
  _formData: FormData
): Promise<OrganizationProvisioningActionState> {
  void _previousState
  void _formData

  let result

  try {
    // The domain operation derives the tenant and reauthorizes the current
    // Clerk Organization admin. Browser fields are intentionally ignored.
    result = await ensureActiveOrganization()
  } catch {
    return { kind: "error" }
  }

  // Keep Next.js redirect control flow outside the infrastructure catch.
  if (result.status === "ready") redirect("/dashboard/billing")

  return { kind: "business", status: result.status }
}
