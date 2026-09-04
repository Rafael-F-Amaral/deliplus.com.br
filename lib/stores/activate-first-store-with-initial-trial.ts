import "server-only"

import { auth } from "@clerk/nextjs/server"

import { createServerSupabaseClient } from "@/lib/supabase/server"

import { createActivateFirstStoreWithInitialTrial } from "./activate-first-store-with-initial-trial.internal"
import { isStoreId } from "./store-setup.rules"

const activateFirstStoreWithInitialTrialForRequest =
  createActivateFirstStoreWithInitialTrial({
    async getAuth() {
      const { userId, orgId, has } = await auth()

      return {
        userId,
        orgId,
        isAdmin: Boolean(userId && orgId && has({ role: "org:admin" })),
      }
    },
    isStoreId,
    async activate(storeId) {
      const supabase = createServerSupabaseClient()
      const { data, error } = await supabase
        .rpc("activate_first_store_with_initial_trial", {
          p_store_id: storeId,
        })
        .maybeSingle()

      return { data, error }
    },
  })

export async function activateFirstStoreWithInitialTrial(storeId: string) {
  return activateFirstStoreWithInitialTrialForRequest(storeId)
}

export {
  StoreTrialActivationError,
  type StoreTrialActivationDomainResult,
  type StoreTrialActivationPreconditionResult,
  type StoreTrialActivationResult,
} from "./activate-first-store-with-initial-trial.internal"
