import "server-only"

import type { PlanCode } from "./plans"

export type OrganizationBillingState = {
  planCode: PlanCode
  status: string
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  collectionPaused: boolean
  pendingPlanCode: PlanCode | null
  pendingEffectiveAt: Date | null
  planChangeInProgress: boolean
}

export function parseOrganizationBillingState(
  value: Record<string, unknown> | null
): OrganizationBillingState | null {
  if (value === null) return null
  const plans = ["essential", "multi_2", "multi_3"]
  if (
    !plans.includes(String(value.plan_code)) ||
    typeof value.status !== "string" ||
    !Number.isFinite(Date.parse(String(value.current_period_end))) ||
    typeof value.cancel_at_period_end !== "boolean" ||
    typeof value.collection_paused !== "boolean" ||
    (value.pending_plan_code !== null &&
      !plans.includes(String(value.pending_plan_code))) ||
    (value.pending_effective_at !== null &&
      !Number.isFinite(Date.parse(String(value.pending_effective_at)))) ||
    typeof value.plan_change_in_progress !== "boolean"
  )
    throw new Error("Invalid organization billing state")
  return {
    planCode: value.plan_code as PlanCode,
    status: value.status,
    currentPeriodEnd: new Date(value.current_period_end as string),
    cancelAtPeriodEnd: value.cancel_at_period_end,
    collectionPaused: value.collection_paused,
    pendingPlanCode: value.pending_plan_code as PlanCode | null,
    pendingEffectiveAt:
      value.pending_effective_at === null
        ? null
        : new Date(value.pending_effective_at as string),
    planChangeInProgress: value.plan_change_in_progress,
  }
}
