"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getActiveStoreId } from "@/lib/stores/get-active-store"

export async function createInventoryItem(data: {
  name: string
  categoryId?: string | null
  unit: string
  quantity: number
  unitCostCents: number
  minStock: number
}) {
  const storeId = await getActiveStoreId()
  if (!storeId) throw new Error("Loja n\u00e3o encontrada")

  const supabase = createServerSupabaseClient() as any
  
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
  const storeId = await getActiveStoreId()
  if (!storeId) throw new Error("Loja não encontrada")

  const supabase = createServerSupabaseClient() as any
  
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
  const storeId = await getActiveStoreId()
  if (!storeId) throw new Error("Loja não encontrada")

  const supabase = createServerSupabaseClient() as any
  
  const { error } = await supabase.from("inventory_items").update({
    name: data.name,
    category_id: data.categoryId || null,
    unit: data.unit,
    quantity: data.quantity,
    unit_cost_cents: data.unitCostCents,
    min_stock: data.minStock
  }).eq('id', id).eq('store_id', storeId)

  if (error) {
    console.error("Erro ao atualizar item:", error)
    throw new Error("Falha ao atualizar item de estoque")
  }

  revalidatePath("/dashboard/inventory")
}

export async function deleteInventoryItem(id: string) {
  const storeId = await getActiveStoreId()
  if (!storeId) throw new Error("Loja não encontrada")

  const supabase = createServerSupabaseClient() as any
  
  const { error } = await supabase.from("inventory_items").delete().eq('id', id).eq('store_id', storeId)

  if (error) {
    console.error("Erro ao excluir item:", error)
    throw new Error("Falha ao excluir item de estoque")
  }

  revalidatePath("/dashboard/inventory")
}


export async function deleteInventoryCategory(id: string) {
  const storeId = await getActiveStoreId()
  if (!storeId) throw new Error("Loja não encontrada")

  const supabase = createServerSupabaseClient() as any
  
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
