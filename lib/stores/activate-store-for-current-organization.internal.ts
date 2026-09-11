import "server-only"

import type { StoreTrialActivationResult } from "./activate-first-store-with-initial-trial.internal"
import type { StoreEntitlementActivationResult } from "./activate-store-within-entitlement.internal"

export type StoreActivationCoordinatorResult =
  | { status: "activated"; storeId: string }
  | { status: "already_active"; storeId: string }
  | { status: "not_ready" }
  | { status: "subscription_required" }
  | { status: "capacity_reached" }
  | { status: "store_unavailable" }
  | { status: "unauthenticated" }
  | { status: "no_active_organization" }
  | { status: "organization_not_provisioned" }
  | { status: "not_admin" }

type StoreActivationCoordinatorDependencies = {
  activateWithinEntitlement: (
    storeId: string
  ) => Promise<StoreEntitlementActivationResult>
  activateWithInitialTrial: (
    storeId: string
  ) => Promise<StoreTrialActivationResult>
}

export class StoreActivationCoordinatorError extends Error {
  constructor(cause?: unknown) {
    super("Unable to activate Store", { cause })
    this.name = "StoreActivationCoordinatorError"
  }
}

function toCoordinatorError(cause?: unknown) {
  return cause instanceof StoreActivationCoordinatorError
    ? cause
    : new StoreActivationCoordinatorError(cause)
}

function normalizeEntitlementResult(
  result: Exclude<StoreEntitlementActivationResult, { status: "not_entitled" }>
): StoreActivationCoordinatorResult {
  return result
}

export function createActivateStoreForCurrentOrganization(
  dependencies: StoreActivationCoordinatorDependencies
) {
  async function activateWithinEntitlement(storeId: string) {
    try {
      return await dependencies.activateWithinEntitlement(storeId)
    } catch (cause) {
      throw toCoordinatorError(cause)
    }
  }

  async function activateWithInitialTrial(storeId: string) {
    try {
      return await dependencies.activateWithInitialTrial(storeId)
    } catch (cause) {
      throw toCoordinatorError(cause)
    }
  }

  return async function activateStoreForCurrentOrganization(
    storeId: string
  ): Promise<StoreActivationCoordinatorResult> {
    const entitlementResult = await activateWithinEntitlement(storeId)

    if (entitlementResult.status !== "not_entitled") {
      return normalizeEntitlementResult(entitlementResult)
    }

    const trialResult = await activateWithInitialTrial(storeId)

    if (trialResult.status === "activated") {
      return { status: "activated", storeId: trialResult.storeId }
    }

    if (trialResult.status === "already_activated") {
      return { status: "already_active", storeId: trialResult.storeId }
    }

    if (trialResult.status !== "trial_not_eligible") {
      return trialResult
    }

    // An entitlement may have appeared while the initial-trial RPC waited for
    // the shared Organization lock. Recheck once through the transactional
    // entitlement boundary before reporting that a subscription is required.
    const retryResult = await activateWithinEntitlement(storeId)

    return retryResult.status === "not_entitled"
      ? { status: "subscription_required" }
      : normalizeEntitlementResult(retryResult)
  }
}
