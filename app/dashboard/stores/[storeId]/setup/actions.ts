"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { activateStoreForCurrentOrganization } from "@/lib/stores/activate-store-for-current-organization"
import {
  markStoreReady,
  updateStoreSetup,
  type StoreSetupView,
} from "@/lib/stores/store-setup"

export type StoreSetupActionState =
  | { kind: "idle" }
  | { kind: "store"; status: "saved" | "ready"; store: StoreSetupView }
  | {
      kind: "business"
      status:
        | "invalid_input"
        | "unauthenticated"
        | "no_active_organization"
        | "forbidden"
        | "not_admin"
        | "organization_not_provisioned"
        | "store_unavailable"
        | "slug_unavailable"
        | "setup_changed"
        | "not_ready"
        | "subscription_required"
        | "capacity_reached"
      issue?: { field: "input" | "name" | "slug"; code: string }
    }
  | { kind: "error" }

type StoreSetupIntent = "save" | "ready" | "publish"

function readSingleString(formData: FormData, name: string) {
  const values = formData.getAll(name)
  return values.length === 1 && typeof values[0] === "string" ? values[0] : null
}

function isStoreSetupIntent(value: string | null): value is StoreSetupIntent {
  return value === "save" || value === "ready" || value === "publish"
}

export async function mutateStoreSetupAction(
  _previousState: StoreSetupActionState,
  formData: FormData
): Promise<StoreSetupActionState> {
  void _previousState

  if (!(formData instanceof FormData)) {
    return { kind: "business", status: "invalid_input" }
  }

  const storeId = readSingleString(formData, "storeId")
  const intent = readSingleString(formData, "intent")

  if (!storeId || !isStoreSetupIntent(intent)) {
    return { kind: "business", status: "invalid_input" }
  }

  if (intent === "publish") {
    let result

    try {
      // The coordinator and its underlying operations reauthenticate and keep
      // all entitlement/trial decisions outside this browser adapter.
      result = await activateStoreForCurrentOrganization(storeId)
    } catch {
      return { kind: "error" }
    }

    if (result.status === "activated" || result.status === "already_active") {
      redirect("/dashboard?storePublished=1")
    }

    return { kind: "business", status: result.status }
  }

  let result

  try {
    if (intent === "ready") {
      result = await markStoreReady(storeId)
    } else {
      const name = readSingleString(formData, "name")
      const slug = readSingleString(formData, "slug")

      if (name === null || slug === null) {
        return { kind: "business", status: "invalid_input" }
      }

      result = await updateStoreSetup(storeId, { name, slug })
    }
  } catch {
    return { kind: "error" }
  }

  if (result.status === "success") {
    revalidatePath(`/dashboard/stores/${storeId}/setup`)
    return {
      kind: "store",
      status: intent === "ready" ? "ready" : "saved",
      store: result.store,
    }
  }

  if (result.status === "validation_error") {
    return {
      kind: "business",
      status: "invalid_input",
      issue: result.issue,
    }
  }

  return { kind: "business", status: result.status }
}
