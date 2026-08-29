import "server-only"

export type StoreDeactivationDomainResult =
  | {
      status: "deactivated"
      storeId: string
    }
  | {
      status: "already_inactive"
      storeId: string
    }
  | { status: "not_active" }
  | { status: "store_unavailable" }

export type StoreDeactivationPreconditionResult =
  | { status: "unauthenticated" }
  | { status: "no_active_organization" }
  | { status: "organization_not_provisioned" }
  | { status: "not_admin" }

export type StoreDeactivationResult =
  StoreDeactivationDomainResult | StoreDeactivationPreconditionResult

type StoreDeactivationAuth = {
  userId: string | null
  orgId: string | null | undefined
  isAdmin: boolean
}

type StoreDeactivationRpcResult = {
  data: unknown
  error: unknown | null
}

type StoreDeactivationDependencies = {
  getAuth: () => Promise<StoreDeactivationAuth>
  isStoreId: (value: unknown) => value is string
  deactivate: (storeId: string) => Promise<StoreDeactivationRpcResult>
}

const RPC_RESULT_KEYS = ["outcome"] as const
const NON_SUCCESS_OUTCOMES = [
  "organization_not_provisioned",
  "not_active",
  "store_unavailable",
] as const

type NonSuccessOutcome = (typeof NON_SUCCESS_OUTCOMES)[number]

export class StoreDeactivationError extends Error {
  constructor(cause?: unknown) {
    super("Unable to deactivate Store", { cause })
    this.name = "StoreDeactivationError"
  }
}

function toStoreDeactivationError(cause?: unknown) {
  return cause instanceof StoreDeactivationError
    ? cause
    : new StoreDeactivationError(cause)
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
): StoreDeactivationResult {
  if (!isExactRpcResult(value)) {
    throw new StoreDeactivationError()
  }

  if (value.outcome === "deactivated" || value.outcome === "already_inactive") {
    return {
      status: value.outcome,
      storeId,
    }
  }

  if (!isNonSuccessOutcome(value.outcome)) {
    throw new StoreDeactivationError()
  }

  return { status: value.outcome }
}

export function createDeactivateStore(
  dependencies: StoreDeactivationDependencies
) {
  return async function deactivateStore(
    storeId: string
  ): Promise<StoreDeactivationResult> {
    let authState: StoreDeactivationAuth

    try {
      authState = await dependencies.getAuth()
    } catch (cause) {
      throw toStoreDeactivationError(cause)
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

    let result: StoreDeactivationRpcResult

    try {
      result = await dependencies.deactivate(storeId)
    } catch (cause) {
      throw toStoreDeactivationError(cause)
    }

    if (result.error !== null) {
      throw toStoreDeactivationError(result.error)
    }

    return normalizeRpcResult(storeId, result.data)
  }
}
