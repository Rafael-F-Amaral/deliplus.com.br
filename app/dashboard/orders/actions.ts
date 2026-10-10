"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getActiveStoreId } from "@/lib/stores/get-active-store"
import type { Database } from "@/lib/supabase/database.types"

type SupabaseServerClient = ReturnType<typeof createServerSupabaseClient>
type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"]

/**
 * Resolve a loja ativa e o cliente Supabase adequado.
 * Em desenvolvimento, provê fallback gracioso para a primeira loja caso não haja sessão Clerk ativa.
 */
async function resolveActionContext(): Promise<{ storeId: string; supabase: SupabaseServerClient }> {
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
        supabase: adminClient as unknown as SupabaseServerClient
      }
    }
  }

  throw new Error("Loja não encontrada")
}

export type OrderStatus = 'Novo' | 'Em preparo' | 'Pronto' | 'Em entrega' | 'Concluído' | 'Cancelado'

/**
 * Atualiza o status do pedido e registra o timestamp correspondente no Supabase.
 */
export async function updateOrderStatusAction(orderId: string, newStatus: OrderStatus) {
  const { storeId, supabase } = await resolveActionContext()
  const now = new Date().toISOString()

  const updatePayload: OrderUpdate = {
    status: newStatus,
    updated_at: now
  }

  if (newStatus === 'Em preparo') {
    updatePayload.accepted_at = now
    updatePayload.is_urgent = false
  } else if (newStatus === 'Pronto') {
    updatePayload.ready_at = now
  } else if (newStatus === 'Em entrega') {
    updatePayload.dispatched_at = now
  } else if (newStatus === 'Concluído') {
    updatePayload.completed_at = now
  } else if (newStatus === 'Cancelado') {
    updatePayload.canceled_at = now
  }

  const { error } = await supabase
    .from("orders")
    .update(updatePayload)
    .eq("id", orderId)
    .eq("store_id", storeId)

  if (error) {
    console.error("Erro ao atualizar status do pedido:", error)
    throw new Error(`Falha ao atualizar status do pedido para ${newStatus}`)
  }

  revalidatePath("/dashboard/orders")
  return { success: true, status: newStatus }
}

/**
 * Cancela um pedido
 */
export async function cancelOrderAction(orderId: string) {
  return updateOrderStatusAction(orderId, 'Cancelado')
}

export interface EditableOrderItemInput {
  name: string
  qty: number
  unitPriceCents: number
  details?: string
}

/**
 * Atualiza os itens do pedido no Supabase e recalcula o valor total.
 */
export async function updateOrderItemsAction(orderId: string, items: EditableOrderItemInput[]) {
  const { storeId, supabase } = await resolveActionContext()

  if (!items || items.length === 0) {
    throw new Error("O pedido deve conter pelo menos um item.")
  }

  // 1. Verificar se o pedido pertence à loja
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, delivery_fee_cents, discount_cents")
    .eq("id", orderId)
    .eq("store_id", storeId)
    .single()

  if (orderErr || !order) {
    throw new Error("Pedido não encontrado.")
  }

  // 2. Buscar produtos da loja para manter vínculo de product_id se houver
  const { data: prods } = await supabase
    .from("products")
    .select("id, name")
    .eq("store_id", storeId)

  const productMap = new Map<string, string>()
  if (prods) {
    for (const p of prods) {
      productMap.set(p.name.toLowerCase().trim(), p.id)
    }
  }

  // 3. Remover itens antigos do pedido
  const { error: delErr } = await supabase
    .from("order_items")
    .delete()
    .eq("order_id", orderId)

  if (delErr) {
    console.error("Erro ao limpar itens anteriores do pedido:", delErr)
    throw new Error("Falha ao atualizar itens do pedido.")
  }

  // 4. Inserir novos itens
  let subtotalCents = 0
  const itemsToInsert = items.map(it => {
    const qty = Math.max(1, it.qty)
    const unitPrice = Math.max(0, it.unitPriceCents)
    const totalPrice = qty * unitPrice
    subtotalCents += totalPrice

    const matchedId = productMap.get(it.name.toLowerCase().trim()) || null

    return {
      order_id: orderId,
      product_id: matchedId,
      name: it.name.trim(),
      quantity: qty,
      unit_price_cents: unitPrice,
      total_price_cents: totalPrice,
      details: it.details ? it.details.trim() : null
    }
  })

  const { error: insertErr } = await supabase
    .from("order_items")
    .insert(itemsToInsert)

  if (insertErr) {
    console.error("Erro ao inserir novos itens do pedido:", insertErr)
    throw new Error("Falha ao salvar os novos itens do pedido.")
  }

  // 5. Atualizar subtotal e total no pedido
  const totalAmountCents = subtotalCents + (order.delivery_fee_cents || 0) - (order.discount_cents || 0)

  const { error: updateOrderErr } = await supabase
    .from("orders")
    .update({
      subtotal_cents: subtotalCents,
      total_amount_cents: totalAmountCents,
      updated_at: new Date().toISOString()
    })
    .eq("id", orderId)
    .eq("store_id", storeId)

  if (updateOrderErr) {
    console.error("Erro ao atualizar totais do pedido:", updateOrderErr)
    throw new Error("Falha ao recalcular totais do pedido.")
  }

  revalidatePath("/dashboard/orders")
  return {
    success: true,
    subtotalCents,
    totalAmountCents
  }
}
