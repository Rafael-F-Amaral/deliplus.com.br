import { getActiveStoreId } from "@/lib/stores/get-active-store"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import MenuClient from "./menu-client"

export const dynamic = "force-dynamic"

export default async function CardapioPage() {
  const storeId = await getActiveStoreId().catch(() => null)

  let storeSlug = "casa-noma"
  let storeName = "Casa Noma"

  if (storeId) {
    try {
      const supabase = createServerSupabaseClient()
      const { data } = await supabase
        .from("stores")
        .select("id, name, slug")
        .eq("id", storeId)
        .maybeSingle()

      if (data?.slug) storeSlug = data.slug
      if (data?.name) storeName = data.name
    } catch {
      // fallback to mock defaults
    }
  }

  return <MenuClient storeSlug={storeSlug} storeName={storeName} />
}
