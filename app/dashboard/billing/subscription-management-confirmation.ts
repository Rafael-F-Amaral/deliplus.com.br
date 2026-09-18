import type { PlanCode } from "@/lib/billing/plans"
import type { SubscriptionManagementActionState } from "./subscription-management-feedback"

export type SubscriptionManagementSubmission =
  "upgrade" | "downgrade" | "cancel" | null

export type ProjectionConfirmation = {
  key: string
  label: string
  complete: boolean
}

export function resolveProjectionConfirmation({
  latestSubmission,
  downgradeState,
  cancelState,
  pendingPlanCode,
  currentPlanCode,
  portalTargetPlanCode,
}: {
  latestSubmission: SubscriptionManagementSubmission
  downgradeState: SubscriptionManagementActionState
  cancelState: SubscriptionManagementActionState
  pendingPlanCode: PlanCode | null
  currentPlanCode: PlanCode
  portalTargetPlanCode: PlanCode | null
}): ProjectionConfirmation | null {
  if (
    latestSubmission === "downgrade" &&
    downgradeState.kind === "business" &&
    downgradeState.status === "downgrade_processing" &&
    downgradeState.targetPlanCode !== null
  ) {
    return {
      key: `downgrade:${downgradeState.targetPlanCode}`,
      label: "Confirmando mudança programada...",
      complete: pendingPlanCode === downgradeState.targetPlanCode,
    }
  }

  if (
    latestSubmission === "cancel" &&
    cancelState.kind === "business" &&
    cancelState.status === "cancellation_processing"
  ) {
    return {
      key: "cancel",
      label: "Cancelando mudança programada...",
      complete: pendingPlanCode === null,
    }
  }

  if (
    portalTargetPlanCode !== null &&
    portalTargetPlanCode !== currentPlanCode
  ) {
    return {
      key: `portal:${portalTargetPlanCode}`,
      label: "Atualizando seu plano...",
      complete: false,
    }
  }

  return null
}
