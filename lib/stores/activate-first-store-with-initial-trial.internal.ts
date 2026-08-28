import "server-only"

export type StoreTrialActivationDomainResult =
  | {
      status: "activated"
      storeId: string
      trialEndsAt: Date
    }
  | {
      status: "already_activated"
      storeId: string
      trialEndsAt: Date
    }
  | { status: "not_ready" }
  | { status: "trial_not_eligible" }
  | { status: "store_unavailable" }

export type StoreTrialActivationPreconditionResult =
  | { status: "unauthenticated" }
  | { status: "no_active_organization" }
  | { status: "organization_not_provisioned" }
  | { status: "not_admin" }

export type StoreTrialActivationResult =
  StoreTrialActivationDomainResult | StoreTrialActivationPreconditionResult

type StoreTrialActivationAuth = {
  userId: string | null
  orgId: string | null | undefined
  isAdmin: boolean
}

type StoreTrialActivationRpcResult = {
  data: unknown
  error: unknown | null
}

type StoreTrialActivationDependencies = {
  getAuth: () => Promise<StoreTrialActivationAuth>
  isStoreId: (value: unknown) => value is string
  activate: (storeId: string) => Promise<StoreTrialActivationRpcResult>
}

const RPC_RESULT_KEYS = ["outcome", "trial_ends_at"] as const
const NON_SUCCESS_OUTCOMES = [
  "organization_not_provisioned",
  "not_ready",
  "trial_not_eligible",
  "store_unavailable",
] as const

type NonSuccessOutcome = (typeof NON_SUCCESS_OUTCOMES)[number]

export class StoreTrialActivationError extends Error {
  constructor(cause?: unknown) {
    super("Unable to activate Store with initial trial", { cause })
    this.name = "StoreTrialActivationError"
  }
}

function toStoreTrialActivationError(cause?: unknown) {
  return cause instanceof StoreTrialActivationError
    ? cause
    : new StoreTrialActivationError(cause)
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
): StoreTrialActivationResult {
  if (!isExactRpcResult(value)) {
    throw new StoreTrialActivationError()
  }

  const { outcome, trial_ends_at: trialEndsAtValue } = value

  if (outcome === "activated" || outcome === "already_activated") {
    if (typeof trialEndsAtValue !== "string") {
      throw new StoreTrialActivationError()
    }

    const trialEndsAt = new Date(trialEndsAtValue)

    if (!Number.isFinite(trialEndsAt.getTime())) {
      throw new StoreTrialActivationError()
    }

    return {
      status: outcome,
      storeId,
      trialEndsAt,
    }
  }

  if (!isNonSuccessOutcome(outcome) || trialEndsAtValue !== null) {
    throw new StoreTrialActivationError()
  }

  return { status: outcome }
}

export function createActivateFirstStoreWithInitialTrial(
  dependencies: StoreTrialActivationDependencies
) {
  return async function activateFirstStoreWithInitialTrial(
    storeId: string
  ): Promise<StoreTrialActivationResult> {
    let authState: StoreTrialActivationAuth

    try {
      authState = await dependencies.getAuth()
    } catch (cause) {
      throw toStoreTrialActivationError(cause)
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

    let result: StoreTrialActivationRpcResult

    try {
      result = await dependencies.activate(storeId)
    } catch (cause) {
      throw toStoreTrialActivationError(cause)
    }

    if (result.error !== null) {
      throw toStoreTrialActivationError(result.error)
    }

    return normalizeRpcResult(storeId, result.data)
  }
}
