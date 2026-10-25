"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getActiveStoreId } from "@/lib/stores/get-active-store"

async function resolveActionContext() {
  const storeId = await getActiveStoreId().catch(() => null)
  if (storeId) {
    return {
      storeId,
      supabase: createServerSupabaseClient()
    }
  }

  if (process.env.NODE_ENV === "development") {
    const { createAdminSupabaseClient } = await import("@/lib/supabase/admin")
    const adminClient = createAdminSupabaseClient()
    const { data: firstStore } = await adminClient
      .from("stores")
      .select("id")
      .limit(1)
      .maybeSingle()
    if (firstStore?.id) {
      return {
        storeId: firstStore.id,
        supabase: adminClient as unknown as ReturnType<typeof createServerSupabaseClient>
      }
    }
  }

  throw new Error("Loja não encontrada")
}

export async function createInventoryItem(data: {
  name: string
  categoryId?: string | null
  unit: string
  quantity: number
  unitCostCents: number
  minStock: number
}) {
  const { storeId, supabase } = await resolveActionContext()
  
  const { error } = await supabase.from("inventory_items").insert({
    store_id: storeId,
    name: data.name,
    category_id: data.categoryId || null,
    unit: data.unit,
    quantity: data.quantity,
    unit_cost_cents: data.unitCostCents,
    min_stock: data.minStock
  })

  if (error) {
    console.error("Erro ao criar item:", error)
    throw new Error("Falha ao criar item de estoque")
  }

  revalidatePath("/dashboard/inventory")
}

export async function createInventoryCategory(data: {
  name: string
  colorBg: string
  colorText: string
}) {
  const { storeId, supabase } = await resolveActionContext()
  
  const { data: newCategory, error } = await supabase.from("inventory_categories").insert({
    store_id: storeId,
    name: data.name,
    color_bg: data.colorBg,
    color_text: data.colorText
  }).select().single()

  if (error) {
    console.error("Erro ao criar categoria:", error)
    throw new Error("Falha ao criar categoria")
  }

  revalidatePath("/dashboard/inventory")
  return newCategory
}

export async function updateInventoryItem(id: string, data: {
  name: string
  categoryId?: string | null
  unit: string
  quantity: number
  unitCostCents: number
  minStock: number
}) {
  const { storeId, supabase } = await resolveActionContext()
  
  let { error } = await supabase.from("inventory_items").update({
    name: data.name,
    category_id: data.categoryId || null,
    unit: data.unit,
    quantity: data.quantity,
    unit_cost_cents: data.unitCostCents,
    min_stock: data.minStock
  }).eq('id', id).eq('store_id', storeId)

  if (error && process.env.NODE_ENV === "development") {
    const { createAdminSupabaseClient } = await import("@/lib/supabase/admin")
    const adminClient = createAdminSupabaseClient()
    const retry = await adminClient.from("inventory_items").update({
      name: data.name,
      category_id: data.categoryId || null,
      unit: data.unit,
      quantity: data.quantity,
      unit_cost_cents: data.unitCostCents,
      min_stock: data.minStock
    }).eq('id', id).eq('store_id', storeId)
    error = retry.error
  }

  if (error) {
    console.error("Erro ao atualizar item:", error)
    throw new Error("Falha ao atualizar item de estoque")
  }

  revalidatePath("/dashboard/inventory")
}

export async function deleteInventoryItem(id: string) {
  const { storeId, supabase } = await resolveActionContext()
  
  const { error } = await supabase.from("inventory_items").delete().eq('id', id).eq('store_id', storeId)

  if (error) {
    console.error("Erro ao excluir item:", error)
    throw new Error("Falha ao excluir item de estoque")
  }

  revalidatePath("/dashboard/inventory")
}

export async function deleteInventoryCategory(id: string) {
  const { storeId, supabase } = await resolveActionContext()
  
  const { error } = await supabase
    .from("inventory_categories")
    .delete()
    .eq("id", id)
    .eq("store_id", storeId)

  if (error) {
    console.error("Erro ao excluir categoria:", error)
    throw new Error("Falha ao excluir categoria")
  }

  revalidatePath("/dashboard/inventory")
}
