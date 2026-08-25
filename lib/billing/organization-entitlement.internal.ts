import type { BillingSubscriptionStatus } from "./subscription-reducer"

export type PlanEntitlement =
  | {
      planCode: "essential"
      maxStores: 1
    }
  | {
      planCode: "multi_2"
      maxStores: 2
    }
  | {
      planCode: "multi_3"
      maxStores: 3
    }

export type OrganizationEntitlement =
  | {
      entitled: false
      reason: "no_entitlement"
    }
  | ({
      entitled: true
      source: "trial"
      validUntil: Date
    } & PlanEntitlement)
  | ({
      entitled: true
      source: "paid_subscription"
    } & PlanEntitlement)

export type OrganizationEntitlementPreconditionCode =
  "unauthenticated" | "no_active_organization" | "organization_not_provisioned"

type OrganizationEntitlementAuth = {
  userId: string | null
  orgId: string | null | undefined
}

type OrganizationEntitlementFactsReadResult = {
  data: unknown
  error: unknown | null
}

type ResolveOrganizationEntitlementDependencies = {
  getAuth: () => Promise<OrganizationEntitlementAuth>
  readFacts: () => Promise<OrganizationEntitlementFactsReadResult>
  resolvePlanEntitlement: (value: unknown) => PlanEntitlement
  isSubscriptionStatus: (value: unknown) => value is BillingSubscriptionStatus
}

type TrialEntitlementCandidate = {
  plan: PlanEntitlement
  validUntil: Date
}

type PaidSubscriptionCandidate = {
  plan: PlanEntitlement
  status: BillingSubscriptionStatus
  collectionPaused: boolean
}

const FACT_KEYS = [
  "trial_plan_code",
  "trial_valid_until",
  "subscription_plan_code",
  "subscription_status",
  "subscription_collection_paused",
] as const

export class OrganizationEntitlementPreconditionError extends Error {
  readonly code: OrganizationEntitlementPreconditionCode

  constructor(code: OrganizationEntitlementPreconditionCode) {
    super("Organization entitlement precondition failed")
    this.name = "OrganizationEntitlementPreconditionError"
    this.code = code
  }
}

export class OrganizationEntitlementResolutionError extends Error {
  constructor(cause?: unknown) {
    super("Unable to resolve Organization entitlement", { cause })
    this.name = "OrganizationEntitlementResolutionError"
  }
}

function toResolutionError(cause?: unknown) {
  return cause instanceof OrganizationEntitlementResolutionError
    ? cause
    : new OrganizationEntitlementResolutionError(cause)
}

function isExactFactsRecord(
  value: unknown
): value is Record<(typeof FACT_KEYS)[number], unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false
  }

  const keys = Object.keys(value)

  return (
    keys.length === FACT_KEYS.length &&
    FACT_KEYS.every((key) => Object.hasOwn(value, key))
  )
}

function resolvePlan(
  value: unknown,
  dependencies: ResolveOrganizationEntitlementDependencies
) {
  try {
    return dependencies.resolvePlanEntitlement(value)
  } catch (cause) {
    throw toResolutionError(cause)
  }
}

function resolveTrialCandidate(
  facts: Record<(typeof FACT_KEYS)[number], unknown>,
  dependencies: ResolveOrganizationEntitlementDependencies
): TrialEntitlementCandidate | null {
  const planCode = facts.trial_plan_code
  const validUntilValue = facts.trial_valid_until
  const planMissing = planCode === null
  const validUntilMissing = validUntilValue === null

  if (planMissing !== validUntilMissing) {
    throw new OrganizationEntitlementResolutionError()
  }

  if (planMissing) {
    return null
  }

  if (typeof planCode !== "string" || typeof validUntilValue !== "string") {
    throw new OrganizationEntitlementResolutionError()
  }

  const plan = resolvePlan(planCode, dependencies)
  const validUntil = new Date(validUntilValue)

  if (!Number.isFinite(validUntil.getTime())) {
    throw new OrganizationEntitlementResolutionError()
  }

  return { plan, validUntil }
}

function resolvePaidSubscriptionCandidate(
  facts: Record<(typeof FACT_KEYS)[number], unknown>,
  dependencies: ResolveOrganizationEntitlementDependencies
): PaidSubscriptionCandidate | null {
  const planCode = facts.subscription_plan_code
  const status = facts.subscription_status
  const collectionPaused = facts.subscription_collection_paused
  const missingValues = [planCode, status, collectionPaused].filter(
    (value) => value === null
  ).length

  if (missingValues === 3) {
    return null
  }

  if (missingValues !== 0) {
    throw new OrganizationEntitlementResolutionError()
  }

  if (
    typeof planCode !== "string" ||
    !dependencies.isSubscriptionStatus(status) ||
    typeof collectionPaused !== "boolean"
  ) {
    throw new OrganizationEntitlementResolutionError()
  }

  return {
    plan: resolvePlan(planCode, dependencies),
    status,
    collectionPaused,
  }
}

function resolveFacts(
  value: unknown,
  dependencies: ResolveOrganizationEntitlementDependencies
): OrganizationEntitlement {
  if (!isExactFactsRecord(value)) {
    throw new OrganizationEntitlementResolutionError()
  }

  const trial = resolveTrialCandidate(value, dependencies)
  const paidSubscription = resolvePaidSubscriptionCandidate(value, dependencies)
  const paidIsEntitled =
    paidSubscription !== null &&
    (paidSubscription.status === "active" ||
      paidSubscription.status === "past_due") &&
    !paidSubscription.collectionPaused

  if (paidSubscription && paidIsEntitled) {
    return {
      entitled: true,
      source: "paid_subscription",
      ...paidSubscription.plan,
    }
  }

  if (trial) {
    return {
      entitled: true,
      source: "trial",
      validUntil: trial.validUntil,
      ...trial.plan,
    }
  }

  return {
    entitled: false,
    reason: "no_entitlement",
  }
}

export function createResolveOrganizationEntitlement(
  dependencies: ResolveOrganizationEntitlementDependencies
) {
  return async function resolveOrganizationEntitlement(): Promise<OrganizationEntitlement> {
    let authState: OrganizationEntitlementAuth

    try {
      authState = await dependencies.getAuth()
    } catch (cause) {
      throw toResolutionError(cause)
    }

    if (!authState.userId) {
      throw new OrganizationEntitlementPreconditionError("unauthenticated")
    }

    if (!authState.orgId) {
      throw new OrganizationEntitlementPreconditionError(
        "no_active_organization"
      )
    }

    let result: OrganizationEntitlementFactsReadResult

    try {
      result = await dependencies.readFacts()
    } catch (cause) {
      throw toResolutionError(cause)
    }

    if (result.error !== null) {
      throw toResolutionError(result.error)
    }

    if (result.data === null) {
      throw new OrganizationEntitlementPreconditionError(
        "organization_not_provisioned"
      )
    }

    return resolveFacts(result.data, dependencies)
  }
}
