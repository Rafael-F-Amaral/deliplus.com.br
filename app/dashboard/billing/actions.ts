"use server"

import { redirect } from "next/navigation"
import { isPlanCode } from "@/lib/billing/plans"
import { createSubscriptionCheckoutSession } from "@/lib/billing/subscription-checkout"
import type { CheckoutActionState } from "./checkout-feedback"

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
