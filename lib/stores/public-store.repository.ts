import "server-only"

import { createAnonymousSupabaseClient } from "@/lib/supabase/public"

export function createPublicStoreRepository() {
  return {
    async findBySlug(slug: string): Promise<unknown> {
      const { data, error } = await createAnonymousSupabaseClient().rpc(
        "get_public_store_by_slug",
        { p_slug: slug }
      )
      if (error) throw error
      return data
    },
  }
}
