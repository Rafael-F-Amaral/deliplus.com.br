import "server-only"

export type StoreEntitlementActivationDomainResult =
  | {
      status: "activated"
      storeId: string
    }
  | {
      status: "already_active"
      storeId: string
    }
  | { status: "not_ready" }
  | { status: "not_entitled" }
  | { status: "capacity_reached" }
  | { status: "store_unavailable" }

export type StoreEntitlementActivationPreconditionResult =
  | { status: "unauthenticated" }
  | { status: "no_active_organization" }
  | { status: "organization_not_provisioned" }
  | { status: "not_admin" }

export type StoreEntitlementActivationResult =
  | StoreEntitlementActivationDomainResult
  | StoreEntitlementActivationPreconditionResult

type StoreEntitlementActivationAuth = {
  userId: string | null
  orgId: string | null | undefined
  isAdmin: boolean
}

type StoreEntitlementActivationRpcResult = {
  data: unknown
  error: unknown | null
}

type StoreEntitlementActivationDependencies = {
  getAuth: () => Promise<StoreEntitlementActivationAuth>
  isStoreId: (value: unknown) => value is string
  activate: (storeId: string) => Promise<StoreEntitlementActivationRpcResult>
}

const RPC_RESULT_KEYS = ["outcome"] as const
const NON_SUCCESS_OUTCOMES = [
  "organization_not_provisioned",
  "not_ready",
  "not_entitled",
  "capacity_reached",
  "store_unavailable",
] as const

type NonSuccessOutcome = (typeof NON_SUCCESS_OUTCOMES)[number]

export class StoreEntitlementActivationError extends Error {
  constructor(cause?: unknown) {
    super("Unable to activate Store within entitlement", { cause })
    this.name = "StoreEntitlementActivationError"
  }
}

function toStoreEntitlementActivationError(cause?: unknown) {
  return cause instanceof StoreEntitlementActivationError
    ? cause
    : new StoreEntitlementActivationError(cause)
}

function isExactRpcResult(
  value: unknown
): value is Record<(typeof RPC_RESULT_KEYS)[number], unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false
  }

  const keys = Object.keys(value)

  return (
    keys.length === RPC_RESULT_KEYS.length &&
    RPC_RESULT_KEYS.every((key) => Object.hasOwn(value, key))
  )
}

function isNonSuccessOutcome(value: unknown): value is NonSuccessOutcome {
  return NON_SUCCESS_OUTCOMES.some((outcome) => outcome === value)
}

function normalizeRpcResult(
  storeId: string,
  value: unknown
): StoreEntitlementActivationResult {
  if (!isExactRpcResult(value)) {
    throw new StoreEntitlementActivationError()
  }

  if (value.outcome === "activated" || value.outcome === "already_active") {
    return {
      status: value.outcome,
      storeId,
    }
  }

  if (!isNonSuccessOutcome(value.outcome)) {
    throw new StoreEntitlementActivationError()
  }

  return { status: value.outcome }
}

export function createActivateStoreWithinEntitlement(
  dependencies: StoreEntitlementActivationDependencies
) {
  return async function activateStoreWithinEntitlement(
    storeId: string
  ): Promise<StoreEntitlementActivationResult> {
    let authState: StoreEntitlementActivationAuth

    try {
      authState = await dependencies.getAuth()
    } catch (cause) {
      throw toStoreEntitlementActivationError(cause)
    }

    if (!authState.userId) {
      return { status: "unauthenticated" }
    }

    if (!authState.orgId) {
      return { status: "no_active_organization" }
    }

    if (!authState.isAdmin) {
      return { status: "not_admin" }
    }

    if (!dependencies.isStoreId(storeId)) {
      return { status: "store_unavailable" }
    }

    let result: StoreEntitlementActivationRpcResult

    try {
      result = await dependencies.activate(storeId)
    } catch (cause) {
      throw toStoreEntitlementActivationError(cause)
    }

    if (result.error !== null) {
      throw toStoreEntitlementActivationError(result.error)
    }

    return normalizeRpcResult(storeId, result.data)
  }
}
