"use server"

import { createAnonymousSupabaseClient } from "@/lib/supabase/public"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

async function safeRevalidate(path: string) {
  try {
    const { revalidatePath } = await import("next/cache")
    revalidatePath(path)
  } catch {
    // Ignora em ambientes de teste puro ou fora do Next.js
  }
}

export interface StorefrontOrderItemInput {
  product_id?: string
  name: string
  quantity: number
  unit_price_cents: number
  details?: string
  complements?: Array<{ id: string; name: string; price_cents: number }>
}

export interface SubmitOrderPayload {
  storeSlug: string
  customerName: string
  customerPhone: string
  deliveryType: "delivery" | "pickup"
  deliveryAddress?: string
  paymentMethod: string
  changeForCents?: number
  notes?: string
  items: StorefrontOrderItemInput[]
}

export async function submitStorefrontOrder(payload: SubmitOrderPayload) {
  try {
    let resolvedSlug = payload.storeSlug.trim()

    // Em desenvolvimento, se o slug for 'casa-noma' ou se a loja não existir,
    // resolvemos para a primeira loja ativa cadastrada no Supabase
    if (process.env.NODE_ENV === "development") {
      try {
        const admin = createAdminSupabaseClient()
        const { data: storeCheck } = await admin
          .from("stores")
          .select("slug")
          .eq("slug", resolvedSlug)
          .eq("status", "active")
          .maybeSingle()

        if (!storeCheck) {
          const { data: fallbackStore } = await admin
            .from("stores")
            .select("slug")
            .eq("status", "active")
            .limit(1)
            .maybeSingle()

          if (fallbackStore?.slug) {
            resolvedSlug = fallbackStore.slug
          }
        }
      } catch (e) {
        console.warn("Dev store slug fallback warning:", e)
      }
    }

    const supabase = createAnonymousSupabaseClient()

    // Mapeamento amigável da forma de pagamento para o lojista
    let paymentLabel = "Pix"
    if (payload.paymentMethod === "credit") paymentLabel = "Cartão de Crédito na Entrega"
    else if (payload.paymentMethod === "debit") paymentLabel = "Cartão de Débito na Entrega"
    else if (payload.paymentMethod === "cash") paymentLabel = "Em Dinheiro"
    else if (payload.paymentMethod === "pix") paymentLabel = "Pix"
    else paymentLabel = payload.paymentMethod

    const rpcPayload = {
      p_store_slug: resolvedSlug,
      p_customer_name: payload.customerName?.trim() || "Cliente",
      p_customer_phone: payload.customerPhone?.trim() || "",
      p_delivery_type: payload.deliveryType === "pickup" ? "Retirada" : "Delivery",
      p_delivery_address: payload.deliveryType === "pickup" ? undefined : payload.deliveryAddress?.trim() || undefined,
      p_payment_method: paymentLabel,
      p_change_for_cents: payload.changeForCents || undefined,
      p_notes: payload.notes?.trim() || undefined,
      p_items: payload.items.map((it) => ({
        product_id: it.product_id?.startsWith("prod-") ? null : it.product_id || null,
        name: it.name,
        quantity: it.quantity,
        unit_price_cents: it.unit_price_cents,
        details: it.details || null,
        complements: it.complements || [],
      })),
    }

    const { data, error } = await supabase.rpc("create_public_order", rpcPayload)

    if (error) {
      console.error("Erro na RPC create_public_order:", error)
      return { success: false, error: error.message }
    }

    // Revalidação de cache das páginas afetadas
    await safeRevalidate("/dashboard/orders")
    await safeRevalidate("/dashboard/finance")
    await safeRevalidate("/dashboard/reports")
    await safeRevalidate(`/${resolvedSlug}`)

    return {
      success: true,
      order: data as {
        order_id: string
        order_number: number
        display_id: string
        store_slug: string
        total_amount_cents: number
      },
    }
  } catch (err: any) {
    console.error("Erro ao enviar pedido do storefront:", err)
    return { success: false, error: err.message || "Erro ao processar pedido" }
  }
}

export interface GlobalCustomerRecognition {
  found: boolean
  customer?: {
    name: string
    phone: string
    deliveryAddress?: string
    storeOrigin?: string
  }
}

/**
 * Busca globalmente na Rede DeliPlus se o WhatsApp informado já realizou pedidos
 * em qualquer loja parceira, retornando nome e último endereço de entrega.
 */
export async function lookupGlobalCustomerByPhone(
  phoneInput: string
): Promise<GlobalCustomerRecognition> {
  try {
    const cleanDigits = phoneInput.replace(/\D/g, "")
    if (cleanDigits.length < 10) {
      return { found: false }
    }

    const last8 = cleanDigits.slice(-8)
    const admin = createAdminSupabaseClient()

    // 1. Buscar no histórico de pedidos (que contém o endereço de entrega completo)
    const { data: recentOrders } = await admin
      .from("orders")
      .select("customer_name, customer_phone, delivery_address")
      .ilike("customer_phone", `%${last8}%`)
      .order("created_at", { ascending: false })
      .limit(5)

    if (recentOrders && recentOrders.length > 0) {
      const match = recentOrders.find(
        (o) => o.customer_phone.replace(/\D/g, "") === cleanDigits
      ) || recentOrders[0]

      if (match) {
        return {
          found: true,
          customer: {
            name: match.customer_name,
            phone: match.customer_phone,
            deliveryAddress: match.delivery_address || undefined,
          },
        }
      }
    }

    // 2. Fallback na tabela customers
    const { data: customers } = await admin
      .from("customers")
      .select("name, phone")
      .ilike("phone", `%${last8}%`)
      .order("last_order_at", { ascending: false })
      .limit(5)

    if (customers && customers.length > 0) {
      const match =
        customers.find((c) => (c.phone || "").replace(/\D/g, "") === cleanDigits) ||
        customers[0]

      if (match) {
        return {
          found: true,
          customer: {
            name: match.name,
            phone: match.phone || phoneInput,
          },
        }
      }
    }

    return { found: false }
  } catch (err) {
    console.warn("Lookup global de cliente falhou:", err)
    return { found: false }
  }
}

