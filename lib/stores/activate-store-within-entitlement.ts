import "server-only"

import { auth } from "@clerk/nextjs/server"

import { createServerSupabaseClient } from "@/lib/supabase/server"

import { createActivateStoreWithinEntitlement } from "./activate-store-within-entitlement.internal"
import { isStoreId } from "./store-setup.rules"

const activateStoreWithinEntitlementForRequest =
  createActivateStoreWithinEntitlement({
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
        .rpc("activate_store_within_entitlement", {
          p_store_id: storeId,
        })
        .maybeSingle()

      return { data, error }
    },
  })

export async function activateStoreWithinEntitlement(storeId: string) {
  return activateStoreWithinEntitlementForRequest(storeId)
}

export {
  StoreEntitlementActivationError,
  type StoreEntitlementActivationDomainResult,
  type StoreEntitlementActivationPreconditionResult,
  type StoreEntitlementActivationResult,
} from "./activate-store-within-entitlement.internal"
