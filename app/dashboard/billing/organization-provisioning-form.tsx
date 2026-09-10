"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"

import { provisionActiveOrganization } from "./organization-provisioning-action"
import {
  organizationProvisioningMessages,
  organizationProvisioningUnavailableMessage,
  type OrganizationProvisioningActionState,
} from "./organization-provisioning-feedback"

const initialState: OrganizationProvisioningActionState = { kind: "idle" }

export function OrganizationProvisioningForm() {
  const [state, action, pending] = useActionState(
    provisionActiveOrganization,
    initialState
  )

  return (
    <form action={action} className="flex flex-col items-start gap-3">
      <Button type="submit" disabled={pending} aria-disabled={pending}>
        {pending ? "Configurando organização…" : "Configurar organização"}
      </Button>
      <div aria-live="polite" aria-atomic="true">
        {state.kind !== "idle" ? (
          <p role="alert" className="text-destructive">
            {state.kind === "error"
              ? organizationProvisioningUnavailableMessage
              : organizationProvisioningMessages[state.status]}
          </p>
        ) : null}
      </div>
    </form>
  )
}
