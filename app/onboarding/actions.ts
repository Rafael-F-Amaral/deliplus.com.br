"use server"

import { redirect } from "next/navigation"

import { ensureActiveOrganization } from "@/lib/organizations/ensure-active-organization"

export type AutomaticProvisioningActionState =
  | { kind: "idle" }
  | {
      kind: "business"
      status:
        | "unauthenticated"
        | "no_active_organization"
        | "forbidden"
        | "provisioning_failed"
    }
  | { kind: "error" }

export async function provisionOrganizationForOnboarding(
  _previousState: AutomaticProvisioningActionState,
  _formData: FormData
): Promise<AutomaticProvisioningActionState> {
  void _previousState
  void _formData

  let result

  try {
    // This domain operation reauthenticates, derives the active Organization,
    // and verifies org:admin. The browser supplies no authority.
    result = await ensureActiveOrganization()
  } catch {
    return { kind: "error" }
  }

  // Redirect control flow must remain outside the infrastructure catch.
  if (result.status === "ready") redirect("/onboarding")

  return { kind: "business", status: result.status }
}
