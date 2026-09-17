import "server-only"

import type { PlanCode } from "./plans"
import type { BillingSubscriptionStatus } from "./subscription-reducer"

const PLAN_RANK: Record<PlanCode, number> = {
  essential: 1,
  multi_2: 2,
  multi_3: 3,
}

export type SubscriptionChangeOperation =
  "schedule_downgrade" | "cancel_scheduled_downgrade"

export type SubscriptionChangeAttemptState =
  | "claimed"
  | "provider_object_created"
  | "requested"
  | "recovery_required"
  | "ended"

export type SubscriptionChangeAttempt = {
  id: string
  organization_id: string
  operation_kind: SubscriptionChangeOperation
  state: SubscriptionChangeAttemptState
  source_plan_code: PlanCode
  target_plan_code: PlanCode | null
  source_stripe_price_id: string
  target_stripe_price_id: string | null
  stripe_subscription_id: string
  stripe_subscription_schedule_id: string | null
  expected_period_end: string
  livemode: boolean
  stripe_api_version: "2026-07-29.dahlia"
  revision: number
  created_at: string
  updated_at: string
  ended_at: string | null
}

export type ManageableSubscription = {
  organizationId: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  stripePriceId: string
  planCode: PlanCode
  status: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  collectionPaused: boolean
  stripeSubscriptionScheduleId: string | null
  pendingStripePriceId: string | null
  pendingPlanCode: PlanCode | null
  pendingEffectiveAt: string | null
}

export type SubscriptionManagementConfiguration = {
  stripePriceId: string
  currency: "brl"
  recurringInterval: "month"
  recurringIntervalCount: 1
  livemode: boolean
  stripeApiVersion: "2026-07-29.dahlia"
}

export type ProviderSubscription = {
  id: string
  customerId: string
  priceId: string
  planCode: PlanCode
  status: BillingSubscriptionStatus
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  collectionPaused: boolean
  scheduleId: string | null
  pendingPriceId: string | null
  livemode: boolean
}

export type ProviderConfiguredDowngrade = {
  outcome: "already_configured"
  scheduleId: string
  pendingPriceId: string
  pendingPlanCode: PlanCode
  pendingEffectiveAt: string
}

export type ProviderDowngradeResult =
  { outcome: "requested" } | ProviderConfiguredDowngrade

export type ProviderSchedule = {
  id: string
  subscriptionId: string
  customerId: string
  released: boolean
}

export type SubscriptionManagementResult = {
  status:
    | "downgrade_processing"
    | "cancellation_processing"
    | "unauthenticated"
    | "no_active_organization"
    | "not_admin"
    | "organization_not_provisioned"
    | "invalid_plan"
    | "same_plan"
    | "downgrade_only"
    | "no_paid_subscription"
    | "subscription_not_manageable"
    | "scheduled_change_exists"
    | "no_scheduled_change"
    | "plan_change_in_progress"
    | "billing_recovery_required"
}

export type AttemptResult = {
  outcome:
    | "attempt"
    | "stale"
    | "no_paid_subscription"
    | "subscription_not_manageable"
    | "scheduled_change_exists"
    | "no_scheduled_change"
    | "plan_change_in_progress"
  attempt: SubscriptionChangeAttempt | null
}

export type SubscriptionManagementRepository = {
  findOrganization: (clerkOrganizationId: string) => Promise<string | null>
  readSubscription: (
    organizationId: string
  ) => Promise<ManageableSubscription | null>
  claim: (
    subscription: ManageableSubscription,
    operation: SubscriptionChangeOperation,
    targetPlanCode: PlanCode | null,
    targetStripePriceId: string | null,
    livemode: boolean
  ) => Promise<AttemptResult>
  advance: (
    attempt: SubscriptionChangeAttempt,
    scheduleId: string | null,
    state: Exclude<SubscriptionChangeAttemptState, "ended">
  ) => Promise<AttemptResult>
  repairDowngradeProjection: (
    attempt: SubscriptionChangeAttempt,
    subscription: ProviderSubscription,
    configured: ProviderConfiguredDowngrade
  ) => Promise<"applied" | "duplicate" | "ignored_non_canonical">
  repairCancellationProjection: (
    attempt: SubscriptionChangeAttempt,
    subscription: ProviderSubscription
  ) => Promise<"applied" | "duplicate" | "ignored_non_canonical">
}

export type SubscriptionManagementProvider = {
  retrieveSubscription: (
    subscriptionId: string,
    config: SubscriptionManagementConfiguration
  ) => Promise<ProviderSubscription>
  validateTargetPrice: (
    config: SubscriptionManagementConfiguration
  ) => Promise<void>
  createSchedule: (
    attempt: SubscriptionChangeAttempt,
    subscription: ProviderSubscription
  ) => Promise<ProviderSchedule>
  requestDowngrade: (
    attempt: SubscriptionChangeAttempt,
    subscription: ProviderSubscription,
    schedule: ProviderSchedule
  ) => Promise<ProviderDowngradeResult>
  releaseSchedule: (
    attempt: SubscriptionChangeAttempt,
    subscription: ProviderSubscription
  ) => Promise<"requested" | "already_released">
}

type Dependencies = {
  getAuth: () => Promise<{
    userId: string | null
    orgId: string | null | undefined
    isAdmin: boolean
  }>
  isPlanCode: (value: unknown) => value is PlanCode
  getConfiguration: (planCode: PlanCode) => SubscriptionManagementConfiguration
  repository: SubscriptionManagementRepository
  stripe: SubscriptionManagementProvider
}

export class SubscriptionManagementError extends Error {
  constructor() {
    super("Unable to manage subscription")
    this.name = "SubscriptionManagementError"
  }
}

const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/iu
const stripeId = (prefix: string) => new RegExp(`^${prefix}_[A-Za-z0-9]+$`, "u")

export function parseSubscriptionChangeAttempt(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new SubscriptionManagementError()
  const row = value as Record<string, unknown>
  if (
    !uuid.test(String(row.id)) ||
    !uuid.test(String(row.organization_id)) ||
    !["schedule_downgrade", "cancel_scheduled_downgrade"].includes(
      String(row.operation_kind)
    ) ||
    ![
      "claimed",
      "provider_object_created",
      "requested",
      "recovery_required",
      "ended",
    ].includes(String(row.state)) ||
    !stripeId("sub").test(String(row.stripe_subscription_id)) ||
    !stripeId("price").test(String(row.source_stripe_price_id)) ||
    !Number.isSafeInteger(row.revision) ||
    !Number.isFinite(Date.parse(String(row.expected_period_end)))
  )
    throw new SubscriptionManagementError()
  return value as SubscriptionChangeAttempt
}

export function parseSubscriptionChangeAttemptResult(
  value: unknown
): AttemptResult {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new SubscriptionManagementError()
  const row = value as Record<string, unknown>
  if (
    ![
      "attempt",
      "stale",
      "no_paid_subscription",
      "subscription_not_manageable",
      "scheduled_change_exists",
      "no_scheduled_change",
      "plan_change_in_progress",
    ].includes(String(row.outcome))
  )
    throw new SubscriptionManagementError()
  return {
    outcome: row.outcome as AttemptResult["outcome"],
    attempt:
      row.attempt === null ? null : parseSubscriptionChangeAttempt(row.attempt),
  }
}

function validateProvider(
  local: ManageableSubscription,
  external: ProviderSubscription,
  config: SubscriptionManagementConfiguration
) {
  return !(
    external.id !== local.stripeSubscriptionId ||
    external.customerId !== local.stripeCustomerId ||
    external.priceId !== local.stripePriceId ||
    external.planCode !== local.planCode ||
    external.status !== "active" ||
    Date.parse(external.currentPeriodEnd) !==
      Date.parse(local.currentPeriodEnd) ||
    external.cancelAtPeriodEnd ||
    external.collectionPaused ||
    config.livemode !== external.livemode
  )
}

function outcome(
  status: AttemptResult["outcome"]
): SubscriptionManagementResult {
  if (status === "attempt") throw new SubscriptionManagementError()
  if (status === "stale") return { status: "billing_recovery_required" }
  return { status }
}

function validateConfiguredDowngrade(
  attempt: SubscriptionChangeAttempt,
  subscription: ProviderSubscription,
  configured: ProviderConfiguredDowngrade
) {
  return (
    attempt.operation_kind === "schedule_downgrade" &&
    attempt.state !== "ended" &&
    attempt.target_plan_code !== null &&
    attempt.target_stripe_price_id !== null &&
    attempt.stripe_subscription_schedule_id !== null &&
    subscription.id === attempt.stripe_subscription_id &&
    subscription.priceId === attempt.source_stripe_price_id &&
    subscription.planCode === attempt.source_plan_code &&
    subscription.scheduleId === attempt.stripe_subscription_schedule_id &&
    configured.scheduleId === attempt.stripe_subscription_schedule_id &&
    configured.pendingPriceId === attempt.target_stripe_price_id &&
    configured.pendingPlanCode === attempt.target_plan_code &&
    Date.parse(configured.pendingEffectiveAt) ===
      Date.parse(attempt.expected_period_end)
  )
}

function isSameAttempt(
  expected: SubscriptionChangeAttempt,
  actual: SubscriptionChangeAttempt
) {
  return (
    actual.id === expected.id &&
    actual.organization_id === expected.organization_id &&
    actual.operation_kind === expected.operation_kind &&
    actual.source_plan_code === expected.source_plan_code &&
    actual.target_plan_code === expected.target_plan_code &&
    actual.source_stripe_price_id === expected.source_stripe_price_id &&
    actual.target_stripe_price_id === expected.target_stripe_price_id &&
    actual.stripe_subscription_id === expected.stripe_subscription_id &&
    Date.parse(actual.expected_period_end) ===
      Date.parse(expected.expected_period_end) &&
    actual.livemode === expected.livemode &&
    actual.state === "ended" &&
    actual.ended_at !== null
  )
}

async function hasConvergedAfterStale(
  deps: Dependencies,
  expected: SubscriptionChangeAttempt,
  stale: AttemptResult
) {
  if (
    stale.outcome !== "stale" ||
    !stale.attempt ||
    !isSameAttempt(expected, stale.attempt)
  )
    return false
  const local = await deps.repository.readSubscription(expected.organization_id)
  if (
    !local ||
    local.stripeSubscriptionId !== expected.stripe_subscription_id ||
    local.planCode !== expected.source_plan_code ||
    local.stripePriceId !== expected.source_stripe_price_id ||
    Date.parse(local.currentPeriodEnd) !==
      Date.parse(expected.expected_period_end)
  )
    return false
  if (expected.operation_kind === "cancel_scheduled_downgrade") {
    return (
      local.stripeSubscriptionScheduleId === null &&
      local.pendingStripePriceId === null &&
      local.pendingPlanCode === null &&
      local.pendingEffectiveAt === null
    )
  }
  return (
    expected.target_plan_code !== null &&
    expected.target_stripe_price_id !== null &&
    stale.attempt.stripe_subscription_schedule_id !== null &&
    local.stripeSubscriptionScheduleId ===
      stale.attempt.stripe_subscription_schedule_id &&
    local.pendingStripePriceId === expected.target_stripe_price_id &&
    local.pendingPlanCode === expected.target_plan_code &&
    local.pendingEffectiveAt !== null &&
    Date.parse(local.pendingEffectiveAt) ===
      Date.parse(expected.expected_period_end)
  )
}

export function createSubscriptionManagement(deps: Dependencies) {
  return async function manageScheduledDowngrade(
    targetPlanCode: PlanCode | null
  ): Promise<SubscriptionManagementResult> {
    try {
      const auth = await deps.getAuth()
      if (!auth.userId) return { status: "unauthenticated" }
      if (!auth.orgId) return { status: "no_active_organization" }
      if (!auth.isAdmin) return { status: "not_admin" }
      if (targetPlanCode !== null && !deps.isPlanCode(targetPlanCode))
        return { status: "invalid_plan" }
      const organizationId = await deps.repository.findOrganization(auth.orgId)
      if (!organizationId) return { status: "organization_not_provisioned" }
      const local = await deps.repository.readSubscription(organizationId)
      if (!local) return { status: "no_paid_subscription" }
      if (
        local.status !== "active" ||
        local.collectionPaused ||
        local.cancelAtPeriodEnd
      )
        return { status: "subscription_not_manageable" }

      const config = deps.getConfiguration(targetPlanCode ?? local.planCode)
      const external = await deps.stripe.retrieveSubscription(
        local.stripeSubscriptionId,
        config
      )
      if (!validateProvider(local, external, config))
        return { status: "subscription_not_manageable" }

      let operation: SubscriptionChangeOperation
      if (targetPlanCode === null) {
        if (!local.stripeSubscriptionScheduleId)
          return { status: "no_scheduled_change" }
        operation = "cancel_scheduled_downgrade"
      } else {
        if (targetPlanCode === local.planCode) return { status: "same_plan" }
        if (local.stripeSubscriptionScheduleId)
          return { status: "scheduled_change_exists" }
        if (PLAN_RANK[targetPlanCode] >= PLAN_RANK[local.planCode])
          return { status: "downgrade_only" }
        await deps.stripe.validateTargetPrice(config)
        operation = "schedule_downgrade"
      }

      if (external.pendingPriceId !== null)
        return { status: "subscription_not_manageable" }

      const claimed = await deps.repository.claim(
        local,
        operation,
        targetPlanCode,
        targetPlanCode ? config.stripePriceId : null,
        config.livemode
      )
      if (claimed.outcome !== "attempt" || !claimed.attempt)
        return outcome(claimed.outcome)
      let attempt = claimed.attempt

      if (
        (operation === "cancel_scheduled_downgrade" &&
          external.scheduleId !== null &&
          external.scheduleId !== local.stripeSubscriptionScheduleId) ||
        (operation === "schedule_downgrade" &&
          attempt.stripe_subscription_schedule_id !== null &&
          external.scheduleId !== attempt.stripe_subscription_schedule_id)
      )
        throw new SubscriptionManagementError()

      try {
        if (operation === "schedule_downgrade") {
          let schedule: ProviderSchedule
          if (attempt.stripe_subscription_schedule_id) {
            schedule = {
              id: attempt.stripe_subscription_schedule_id,
              subscriptionId: external.id,
              customerId: external.customerId,
              released: false,
            }
          } else {
            schedule = await deps.stripe.createSchedule(attempt, external)
            const saved = await deps.repository.advance(
              attempt,
              schedule.id,
              "provider_object_created"
            )
            if (saved.outcome !== "attempt" || !saved.attempt)
              return outcome(saved.outcome)
            attempt = saved.attempt
          }
          const downgrade = await deps.stripe.requestDowngrade(
            attempt,
            external,
            schedule
          )
          if (downgrade.outcome === "already_configured") {
            if (!validateConfiguredDowngrade(attempt, external, downgrade))
              throw new SubscriptionManagementError()
            const repaired = await deps.repository.repairDowngradeProjection(
              attempt,
              external,
              downgrade
            )
            if (repaired !== "applied" && repaired !== "duplicate")
              throw new SubscriptionManagementError()
            return { status: "downgrade_processing" }
          }
          const advanced = await deps.repository.advance(
            attempt,
            schedule.id,
            "requested"
          )
          if (advanced.outcome !== "attempt") {
            if (await hasConvergedAfterStale(deps, attempt, advanced))
              return { status: "downgrade_processing" }
            return outcome(advanced.outcome)
          }
          return { status: "downgrade_processing" }
        }

        const release = await deps.stripe.releaseSchedule(attempt, external)
        if (release === "already_released") {
          const repaired = await deps.repository.repairCancellationProjection(
            attempt,
            external
          )
          if (repaired !== "applied" && repaired !== "duplicate")
            throw new SubscriptionManagementError()
          return { status: "cancellation_processing" }
        }
        const advanced = await deps.repository.advance(
          attempt,
          attempt.stripe_subscription_schedule_id,
          "requested"
        )
        if (advanced.outcome !== "attempt") {
          if (await hasConvergedAfterStale(deps, attempt, advanced))
            return { status: "cancellation_processing" }
          return outcome(advanced.outcome)
        }
        return { status: "cancellation_processing" }
      } catch {
        const recovery = await deps.repository
          .advance(
            attempt,
            attempt.stripe_subscription_schedule_id,
            "recovery_required"
          )
          .catch(() => null)
        if (recovery && (await hasConvergedAfterStale(deps, attempt, recovery)))
          return {
            status:
              operation === "schedule_downgrade"
                ? "downgrade_processing"
                : "cancellation_processing",
          }
        return { status: "billing_recovery_required" }
      }
    } catch {
      throw new SubscriptionManagementError()
    }
  }
}
