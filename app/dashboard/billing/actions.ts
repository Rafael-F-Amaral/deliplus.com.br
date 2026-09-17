"use server"

import { redirect } from "next/navigation"
import { isPlanCode } from "@/lib/billing/plans"
import { createSubscriptionCheckoutSession } from "@/lib/billing/subscription-checkout"
import type { CheckoutActionState } from "./checkout-feedback"
import {
  cancelScheduledOrganizationPlanChange,
  scheduleOrganizationPlanDowngrade,
} from "@/lib/billing/subscription-management"
import { createSubscriptionUpgradePortalSession } from "@/lib/billing/subscription-upgrade-portal"
import type { SubscriptionManagementActionState } from "./subscription-management-feedback"

export async function startCheckout(
  _previousState: CheckoutActionState,
  formData: FormData
): Promise<CheckoutActionState> {
  if (!(formData instanceof FormData))
    return { kind: "business", status: "invalid_plan" }
  const plans = formData.getAll("planCode")
  const planCode = plans[0]
  if (plans.length !== 1 || !isPlanCode(planCode))
    return { kind: "business", status: "invalid_plan" }

  let result
  try {
    // This domain operation reauthenticates and authorizes every submission.
    // No other browser field or previous action state is authority.
    result = await createSubscriptionCheckoutSession(planCode)
  } catch {
    // Infrastructure failure stays distinct from every business outcome.
    return { kind: "error" }
  }
  // redirect throws a Next.js control-flow exception: keep it outside the catch.
  if (result.status === "checkout_ready") redirect(result.checkoutUrl)
  return { kind: "business", status: result.status }
}

export async function startSubscriptionUpgrade(
  _previousState: SubscriptionManagementActionState,
  formData: FormData
): Promise<SubscriptionManagementActionState> {
  if (!(formData instanceof FormData))
    return { kind: "business", status: "invalid_plan", targetPlanCode: null }
  const values = formData.getAll("planCode")
  if (values.length !== 1 || !isPlanCode(values[0]))
    return { kind: "business", status: "invalid_plan", targetPlanCode: null }
  let result
  try {
    result = await createSubscriptionUpgradePortalSession(values[0])
  } catch {
    return { kind: "error" }
  }
  if (result.status === "portal_ready") redirect(result.portalUrl)
  return {
    kind: "business",
    status: result.status,
    targetPlanCode: values[0],
  }
}

export async function scheduleSubscriptionDowngrade(
  _previousState: SubscriptionManagementActionState,
  formData: FormData
): Promise<SubscriptionManagementActionState> {
  if (!(formData instanceof FormData))
    return { kind: "business", status: "invalid_plan", targetPlanCode: null }
  const values = formData.getAll("planCode")
  if (values.length !== 1 || !isPlanCode(values[0]))
    return { kind: "business", status: "invalid_plan", targetPlanCode: null }
  try {
    const result = await scheduleOrganizationPlanDowngrade(values[0])
    return {
      kind: "business",
      status: result.status,
      targetPlanCode: values[0],
    }
  } catch {
    return { kind: "error" }
  }
}

export async function cancelScheduledPlanChange(
  _previousState: SubscriptionManagementActionState
): Promise<SubscriptionManagementActionState> {
  void _previousState
  try {
    const result = await cancelScheduledOrganizationPlanChange()
    return { kind: "business", status: result.status, targetPlanCode: null }
  } catch {
    return { kind: "error" }
  }
}
