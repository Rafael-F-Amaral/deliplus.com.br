import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { createAdminSupabaseClient } from "../supabase/admin"
import type { Database } from "../supabase/database.types"
import type {
  StripeWebhookProjectionInput,
  StripeWebhookProjectionResult,
} from "./webhooks.internal"

type AdminSupabaseClient = SupabaseClient<Database>

export class StripeWebhookProjectionError extends Error {
  constructor() {
    super("Unable to persist Stripe subscription projection")
    this.name = "StripeWebhookProjectionError"
  }
}

export function createStripeWebhookProjectionStore() {
  let adminClient: AdminSupabaseClient | undefined

  function getAdminClient() {
    adminClient ??= createAdminSupabaseClient()
    return adminClient
  }

  return {
    async isEventProcessed(stripeEventId: string) {
      const { data, error } = await getAdminClient()
        .from("stripe_webhook_events")
        .select("processed_at")
        .eq("stripe_event_id", stripeEventId)
        .maybeSingle()

      if (error) {
        throw new StripeWebhookProjectionError()
      }

      return data?.processed_at !== null && data?.processed_at !== undefined
    },

    async applyProjection(
      input: StripeWebhookProjectionInput
    ): Promise<StripeWebhookProjectionResult> {
      const { subscription } = input
      const { data, error } = await getAdminClient().rpc(
        "apply_stripe_subscription_projection",
        {
          p_cancel_at_period_end: subscription.cancelAtPeriodEnd,
          p_collection_paused: subscription.collectionPaused,
          p_current_period_end: subscription.currentPeriodEnd,
          p_event_type: input.eventType,
          p_livemode: input.livemode,
          p_plan_code: subscription.planCode,
          p_status: subscription.status,
          p_stripe_created_at: input.stripeCreatedAt,
          p_stripe_customer_id: subscription.stripeCustomerId,
          p_stripe_event_id: input.stripeEventId,
          p_stripe_object_id: input.stripeObjectId,
          p_stripe_price_id: subscription.stripePriceId,
          p_stripe_subscription_id: subscription.stripeSubscriptionId,
        }
      )

      if (
        error ||
        (data !== "applied" &&
          data !== "duplicate" &&
          data !== "ignored_non_canonical")
      ) {
        throw new StripeWebhookProjectionError()
      }

      return data
    },
  }
}
