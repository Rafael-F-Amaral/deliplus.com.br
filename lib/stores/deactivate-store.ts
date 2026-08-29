import "server-only"

import { auth } from "@clerk/nextjs/server"

import { createServerSupabaseClient } from "@/lib/supabase/server"

import { createDeactivateStore } from "./deactivate-store.internal"
import { isStoreId } from "./store-setup.rules"

const deactivateStoreForRequest = createDeactivateStore({
  async getAuth() {
    const { userId, orgId, has } = await auth()

    return {
      userId,
      orgId,
      isAdmin: Boolean(userId && orgId && has({ role: "org:admin" })),
    }
  },
  isStoreId,
  async deactivate(storeId) {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .rpc("deactivate_store", {
        p_store_id: storeId,
      })
      .maybeSingle()

    return { data, error }
  },
})

export async function deactivateStore(storeId: string) {
  return deactivateStoreForRequest(storeId)
}

export {
  StoreDeactivationError,
  type StoreDeactivationDomainResult,
  type StoreDeactivationPreconditionResult,
  type StoreDeactivationResult,
} from "./deactivate-store.internal"
