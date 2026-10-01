import { getActiveStoreId } from "@/lib/stores/get-active-store"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import InventoryClient from "./inventory-client"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function InventoryPage() {
  const storeId = await getActiveStoreId()
  
  if (!storeId) {
    return <InventoryClient initialCategories={[]} initialItems={[]} />
  }

  const supabase = createServerSupabaseClient()
  
  const [categoriesRes, itemsRes] = await Promise.all([
    supabase.from("inventory_categories" as any).select("*").eq("store_id", storeId).order("name"),
    supabase.from("inventory_items" as any).select("*").eq("store_id", storeId).order("name")
  ])

  return (
    <InventoryClient 
      initialCategories={categoriesRes.data || []} 
      initialItems={itemsRes.data || []} 
    />
  )
}
