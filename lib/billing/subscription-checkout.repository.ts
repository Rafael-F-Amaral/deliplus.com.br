import "server-only"

import { createAdminSupabaseClient } from "../supabase/admin"
import { createServerSupabaseClient } from "../supabase/server"
import {
  parseCheckoutAttemptResult,
  parseCheckoutAttempt,
  StripeCheckoutError,
} from "./subscription-checkout.internal"
import type {
  CheckoutRepository,
  CustomerClaim,
} from "./subscription-checkout.internal"

function customerResult(
  data: CustomerClaim | null,
  error: unknown
): CustomerClaim {
  if (error || !data) throw new StripeCheckoutError()
  return data
}

export function createSubscriptionCheckoutRepository(): CheckoutRepository {
  let admin: ReturnType<typeof createAdminSupabaseClient> | undefined
  const privileged = () => (admin ??= createAdminSupabaseClient())
  return {
    async findOrganization(clerkOrganizationId) {
      const { data, error } = await createServerSupabaseClient()
        .from("organizations")
        .select("id")
        .eq("clerk_organization_id", clerkOrganizationId)
        .maybeSingle()
      if (error) throw new StripeCheckoutError()
      return data === null ? null : data.id
    },
    async readSubscription(organizationId) {
      const { data, error } = await privileged()
        .from("billing_subscriptions")
        .select(
          "stripe_subscription_id,status,collection_paused,plan_code,stripe_price_id"
        )
        .eq("organization_id", organizationId)
        .maybeSingle()
      if (error) throw new StripeCheckoutError()
      return data
    },
    async readAttempt(organizationId) {
      const { data, error } = await privileged()
        .from("billing_checkout_attempts")
        .select("*")
        .eq("organization_id", organizationId)
        .is("ended_at", null)
        .maybeSingle()
      if (error) throw new StripeCheckoutError()
      return data === null ? null : parseCheckoutAttempt(data)
    },
    async claimCustomer(organizationId) {
      const { data, error } = await privileged()
        .rpc("claim_billing_customer", { p_organization_id: organizationId })
        .single()
      return customerResult(data, error)
    },
    async finalizeCustomer(claim, customerId) {
      const { data, error } = await privileged()
        .rpc("finalize_billing_customer", {
          p_organization_id: claim.organization_id,
          p_creation_idempotency_key: claim.creation_idempotency_key,
          p_stripe_customer_id: customerId,
        })
        .single()
      return customerResult(data, error)
    },
    async claimAttempt(organizationId, customerId, plan, config) {
      const { data, error } = await privileged()
        .rpc("claim_billing_checkout_attempt", {
          p_organization_id: organizationId,
          p_stripe_customer_id: customerId,
          p_plan_code: plan,
          p_stripe_price_id: config.stripePriceId,
          p_success_url: config.successUrl,
          p_cancel_url: config.cancelUrl,
          p_payment_method_configuration_id:
            config.paymentMethodConfigurationId,
          p_livemode: config.livemode,
        })
        .single()
      if (error) throw new StripeCheckoutError()
      return parseCheckoutAttemptResult(data)
    },
    async reconcile(attempt, sessionId, state) {
      const { data, error } = await privileged()
        .rpc("reconcile_billing_checkout_attempt", {
          p_organization_id: attempt.organization_id,
          p_attempt_id: attempt.id,
          p_expected_revision: attempt.revision,
          p_expected_state: attempt.state,
          p_expected_session_id: attempt.stripe_checkout_session_id!,
          p_session_id: sessionId!,
          p_state: state,
        })
        .single()
      if (error) throw new StripeCheckoutError()
      return parseCheckoutAttemptResult(data)
    },
    async endAttempt(attempt, session, correlatedTerminal) {
      const { data, error } = await privileged()
        .rpc("end_billing_checkout_attempt", {
          p_organization_id: attempt.organization_id,
          p_attempt_id: attempt.id,
          p_expected_revision: attempt.revision,
          p_expected_state: attempt.state,
          p_session_id: session.id,
          p_external_session_status: session.status,
          p_correlated_subscription_terminal: correlatedTerminal,
          p_no_nonterminal_subscriptions: true,
        })
        .single()
      if (error) throw new StripeCheckoutError()
      return parseCheckoutAttemptResult(data)
    },
  }
}
