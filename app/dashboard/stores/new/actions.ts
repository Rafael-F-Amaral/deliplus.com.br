"use server"

import { redirect } from "next/navigation"

import { activateStoreForCurrentOrganization } from "@/lib/stores/activate-store-for-current-organization"
import { createDraftStore, markStoreReady } from "@/lib/stores/store-setup"

type NewStoreRecovery = {
  storeId: string
  stage: "draft" | "ready"
}

type NewStoreBusinessStatus =
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

export type NewStoreActionState =
  | { kind: "idle" }
  | {
      kind: "business"
      status: NewStoreBusinessStatus
      issue?: {
        field: "input" | "name" | "slug"
        code: string
      }
      recovery?: NewStoreRecovery
    }
  | { kind: "error"; recovery?: NewStoreRecovery }

function readSingleString(formData: FormData, name: string) {
  const values = formData.getAll(name)
  return values.length === 1 && typeof values[0] === "string" ? values[0] : null
}

function readRecovery(state: unknown): NewStoreRecovery | null {
  if (
    !state ||
    typeof state !== "object" ||
    Array.isArray(state) ||
    !("kind" in state) ||
    (state.kind !== "business" && state.kind !== "error") ||
    !("recovery" in state) ||
    !state.recovery ||
    typeof state.recovery !== "object" ||
    Array.isArray(state.recovery) ||
    !("storeId" in state.recovery) ||
    typeof state.recovery.storeId !== "string" ||
    !("stage" in state.recovery) ||
    (state.recovery.stage !== "draft" && state.recovery.stage !== "ready")
  ) {
    return null
  }

  return {
    storeId: state.recovery.storeId,
    stage: state.recovery.stage,
  }
}

export async function createAndPublishStoreAction(
  previousState: NewStoreActionState,
  formData: FormData
): Promise<NewStoreActionState> {
  if (!(formData instanceof FormData)) {
    return { kind: "business", status: "invalid_input" }
  }

  let recovery = readRecovery(previousState)

  if (!recovery) {
    const name = readSingleString(formData, "name")
    const slug = readSingleString(formData, "slug")

    if (name === null || slug === null) {
      return { kind: "business", status: "invalid_input" }
    }

    let createResult

    try {
      createResult = await createDraftStore({ name, slug })
    } catch {
      return { kind: "error" }
    }

    if (createResult.status === "validation_error") {
      return {
        kind: "business",
        status: "invalid_input",
        issue: createResult.issue,
      }
    }

    if (createResult.status !== "success") {
      return { kind: "business", status: createResult.status }
    }

    recovery = { storeId: createResult.store.id, stage: "draft" }
  }

  if (recovery.stage === "draft") {
    let readyResult

    try {
      readyResult = await markStoreReady(recovery.storeId)
    } catch {
      return { kind: "error", recovery }
    }

    if (readyResult.status === "validation_error") {
      return {
        kind: "business",
        status: "invalid_input",
        issue: readyResult.issue,
        recovery,
      }
    }

    if (readyResult.status !== "success") {
      return { kind: "business", status: readyResult.status, recovery }
    }

    recovery = { storeId: recovery.storeId, stage: "ready" }
  }

  let activationResult

  try {
    // This coordinator alone decides whether paid entitlement, an existing
    // trial, or an eligible initial trial authorizes publication.
    activationResult = await activateStoreForCurrentOrganization(
      recovery.storeId
    )
  } catch {
    return { kind: "error", recovery }
  }

  if (
    activationResult.status === "activated" ||
    activationResult.status === "already_active"
  ) {
    redirect("/dashboard?storePublished=1")
  }

  return {
    kind: "business",
    status: activationResult.status,
    recovery:
      activationResult.status === "not_ready"
        ? { storeId: recovery.storeId, stage: "draft" }
        : recovery,
  }
}
