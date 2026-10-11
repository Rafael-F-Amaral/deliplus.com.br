import { getActiveStoreId } from "@/lib/stores/get-active-store"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import InventoryClient from "./inventory-client"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function InventoryPage() {
  let storeId = await getActiveStoreId().catch(() => null)
  let supabase: any = createServerSupabaseClient()

  if (!storeId && process.env.NODE_ENV === "development") {
    try {
      const adminClient = createAdminSupabaseClient()
      const { data: firstStore } = await adminClient
        .from("stores")
        .select("id, name, slug")
        .limit(1)
        .maybeSingle()
      if (firstStore) {
        storeId = firstStore.id
        supabase = adminClient
      }
    } catch (e) {
      console.warn("Dev store fallback failed:", e)
    }
  }

  if (!storeId) {
    return <InventoryClient initialCategories={[]} initialItems={[]} />
  }
  
  let [categoriesRes, itemsRes, storeRes] = await Promise.all([
    supabase.from("inventory_categories" as any).select("*").eq("store_id", storeId).order("name"),
    supabase.from("inventory_items" as any).select("*").eq("store_id", storeId).order("name"),
    supabase.from("stores").select("id, name, slug").eq("id", storeId).maybeSingle()
  ])

  if ((!itemsRes.data || itemsRes.data.length === 0) && process.env.NODE_ENV === "development") {
    try {
      const adminClient = createAdminSupabaseClient()
      const [adminCats, adminItems, adminStore] = await Promise.all([
        adminClient.from("inventory_categories" as any).select("*").eq("store_id", storeId).order("name"),
        adminClient.from("inventory_items" as any).select("*").eq("store_id", storeId).order("name"),
        adminClient.from("stores").select("id, name, slug").eq("id", storeId).maybeSingle()
      ])
      if (adminItems.data && adminItems.data.length > 0) {
        categoriesRes = adminCats
        itemsRes = adminItems
        if (adminStore.data) storeRes = adminStore
      }
    } catch (err) {
      console.warn("Erro no fallback do estoque:", err)
    }
  }

  return (
    <InventoryClient 
      initialCategories={categoriesRes.data || []} 
      initialItems={itemsRes.data || []} 
      storeSlug={storeRes.data?.slug || ""}
      storeName={storeRes.data?.name || ""}
    />
  )
}
