import "server-only"

import { createAdminSupabaseClient } from "../supabase/admin"
import { createServerSupabaseClient } from "../supabase/server"
import {
  parseSubscriptionChangeAttemptResult,
  SubscriptionManagementError,
  type SubscriptionManagementRepository,
} from "./subscription-management.internal"
import { isPlanCode } from "./plans"
import { createStripeWebhookProjectionStore } from "./subscription-projection"

export function createSubscriptionManagementRepository(): SubscriptionManagementRepository {
  let admin: ReturnType<typeof createAdminSupabaseClient> | undefined
  let projection:
    ReturnType<typeof createStripeWebhookProjectionStore> | undefined
  const privileged = () => (admin ??= createAdminSupabaseClient())
  const projectionStore = () =>
    (projection ??= createStripeWebhookProjectionStore())
  return {
    async findOrganization(clerkOrganizationId) {
      const { data, error } = await createServerSupabaseClient()
        .from("organizations")
        .select("id")
        .eq("clerk_organization_id", clerkOrganizationId)
        .maybeSingle()
      if (error) throw new SubscriptionManagementError()
      return data?.id ?? null
    },
    async readSubscription(organizationId) {
      const [{ data, error }, customerResult] = await Promise.all([
        privileged()
          .from("billing_subscriptions")
          .select(
            "organization_id,stripe_subscription_id,stripe_price_id,plan_code,status,current_period_end,cancel_at_period_end,collection_paused,stripe_subscription_schedule_id,pending_stripe_price_id,pending_plan_code,pending_effective_at"
          )
          .eq("organization_id", organizationId)
          .maybeSingle(),
        privileged()
          .from("billing_customers")
          .select("stripe_customer_id,provisioning_status")
          .eq("organization_id", organizationId)
          .maybeSingle(),
      ])
      if (error || !data) return null
      const customer = customerResult.data
      if (
        customerResult.error ||
        !customer?.stripe_customer_id ||
        customer.provisioning_status !== "ready" ||
        !isPlanCode(data.plan_code) ||
        !data.current_period_end ||
        (data.pending_plan_code !== null && !isPlanCode(data.pending_plan_code))
      )
        throw new SubscriptionManagementError()
      return {
        organizationId: data.organization_id,
        stripeCustomerId: customer.stripe_customer_id,
        stripeSubscriptionId: data.stripe_subscription_id,
        stripePriceId: data.stripe_price_id,
        planCode: data.plan_code,
        status: data.status,
        currentPeriodEnd: data.current_period_end,
        cancelAtPeriodEnd: data.cancel_at_period_end,
        collectionPaused: data.collection_paused,
        stripeSubscriptionScheduleId: data.stripe_subscription_schedule_id,
        pendingStripePriceId: data.pending_stripe_price_id,
        pendingPlanCode: data.pending_plan_code,
        pendingEffectiveAt: data.pending_effective_at,
      }
    },
    async claim(
      subscription,
      operation,
      targetPlanCode,
      targetPriceId,
      livemode
    ) {
      const { data, error } = await privileged()
        .rpc("claim_billing_subscription_change", {
          p_organization_id: subscription.organizationId,
          p_operation_kind: operation,
          p_source_plan_code: subscription.planCode,
          p_target_plan_code: targetPlanCode!,
          p_source_stripe_price_id: subscription.stripePriceId,
          p_target_stripe_price_id: targetPriceId!,
          p_stripe_subscription_id: subscription.stripeSubscriptionId,
          p_stripe_subscription_schedule_id:
            subscription.stripeSubscriptionScheduleId!,
          p_expected_period_end: subscription.currentPeriodEnd,
          p_livemode: livemode,
        })
        .single()
      if (error) throw new SubscriptionManagementError()
      return parseSubscriptionChangeAttemptResult(data)
    },
    async advance(attempt, scheduleId, state) {
      const { data, error } = await privileged()
        .rpc("advance_billing_subscription_change", {
          p_organization_id: attempt.organization_id,
          p_attempt_id: attempt.id,
          p_expected_revision: attempt.revision,
          p_expected_state: attempt.state,
          p_stripe_subscription_schedule_id: scheduleId!,
          p_state: state,
        })
        .single()
      if (error) throw new SubscriptionManagementError()
      return parseSubscriptionChangeAttemptResult(data)
    },
    repairDowngradeProjection(attempt, subscription, configured) {
      return projectionStore().applyProjection({
        stripeEventId: `evt_internal_recovery_${attempt.id.replaceAll("-", "")}`,
        eventType: "subscription_schedule.updated",
        stripeObjectId: configured.scheduleId,
        livemode: attempt.livemode,
        stripeCreatedAt: attempt.updated_at,
        subscription: {
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customerId,
          stripePriceId: subscription.priceId,
          planCode: subscription.planCode,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          collectionPaused: subscription.collectionPaused,
          stripeSubscriptionScheduleId: configured.scheduleId,
          pendingStripePriceId: configured.pendingPriceId,
          pendingPlanCode: configured.pendingPlanCode,
          pendingEffectiveAt: configured.pendingEffectiveAt,
        },
      })
    },
    repairCancellationProjection(attempt, subscription) {
      return projectionStore().applyProjection({
        stripeEventId: `evt_internal_recovery_${attempt.id.replaceAll("-", "")}`,
        eventType: "subscription_schedule.released",
        stripeObjectId: attempt.stripe_subscription_schedule_id!,
        livemode: attempt.livemode,
        stripeCreatedAt: attempt.updated_at,
        subscription: {
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customerId,
          stripePriceId: subscription.priceId,
          planCode: subscription.planCode,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          collectionPaused: subscription.collectionPaused,
          stripeSubscriptionScheduleId: null,
          pendingStripePriceId: null,
          pendingPlanCode: null,
          pendingEffectiveAt: null,
        },
      })
    },
  }
}
