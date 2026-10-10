import { auth } from "@clerk/nextjs/server"
import { getActiveStoreId } from "@/lib/stores/get-active-store"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import OrdersClient, { Order } from "./orders-client"

export const dynamic = "force-dynamic"

function formatBRL(cents: number | null | undefined): string {
  if (typeof cents !== "number" || isNaN(cents)) return "R$ 0,00"
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  })
}

function formatTime(dateStr: string): { time: string; date: string } {
  try {
    const d = new Date(dateStr)
    const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    const today = new Date()
    const isToday = d.toDateString() === today.toDateString()
    const date = isToday ? "Hoje" : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    return { time, date }
  } catch {
    return { time: "12:00", date: "Hoje" }
  }
}

interface LiveOrderItem {
  id?: string
  qty: number
  name: string
  unit_price_cents: number
  details?: string
  complements?: { name: string; price_cents: number }[]
}

interface LiveOrderRow {
  id: string
  store_id: string
  order_number: number
  display_id: string | null
  customer_name: string | null
  customer_phone: string | null
  delivery_type: string | null
  delivery_address: string | null
  payment_method: string | null
  change_for_cents: number | null
  total_amount_cents: number | null
  status: Order['status']
  notes: string | null
  is_urgent: boolean | null
  created_at: string
  items_count: number | null
  items_detail: LiveOrderItem[] | null
}

export default async function OrdersPage() {
  await auth()
  let storeId = await getActiveStoreId().catch(() => null)

  let storeSlug = "rafaelteste"
  let storeName = "RafaelTeste"
  let initialOrders: Order[] = []

  let supabase: ReturnType<typeof createServerSupabaseClient> | ReturnType<typeof createAdminSupabaseClient> = createServerSupabaseClient()

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
        storeSlug = firstStore.slug
        storeName = firstStore.name
        supabase = adminClient
      }
    } catch (e) {
      console.warn("Dev store fallback failed:", e)
    }
  }

  if (storeId) {
    try {
      const [storeRes, ordersRes] = await Promise.all([
        supabase.from("stores").select("id, name, slug").eq("id", storeId).maybeSingle(),
        supabase
          .from("vw_orders_live")
          .select("*")
          .eq("store_id", storeId)
          .order("order_number", { ascending: false })
      ])

      if (storeRes.data?.slug) storeSlug = storeRes.data.slug
      if (storeRes.data?.name) storeName = storeRes.data.name

      if (ordersRes.data) {
        const rows = ordersRes.data as unknown as LiveOrderRow[]
        initialOrders = rows.map((row): Order => {
          const { time, date } = formatTime(row.created_at)
          return {
            dbId: row.id,
            id: row.display_id || `#${String(row.order_number).padStart(4, "0")}`,
            client: row.customer_name || "Cliente",
            phone: row.customer_phone || "",
            itemsCount: row.items_count || 0,
            itemsDesc: `${row.items_count || 0} ${row.items_count === 1 ? "item" : "itens"}`,
            itemsDetail: (row.items_detail || []).map((it) => ({
              id: it.id,
              qty: it.qty,
              name: it.name,
              price: formatBRL(it.unit_price_cents),
              details: it.details || undefined,
              complements: Array.isArray(it.complements)
                ? it.complements.map((c) => ({
                    name: c.name || "",
                    price: formatBRL(c.price_cents),
                    priceCents: c.price_cents || 0
                  }))
                : []
            })),
            time,
            date,
            type: (row.delivery_type === "Retirada" ? "Retirada" : "Delivery"),
            address: row.delivery_address || (row.delivery_type === "Retirada" ? "Balcão da Loja Principal" : "Endereço não informado"),
            total: formatBRL(row.total_amount_cents),
            paymentMethod: (row.payment_method as Order['paymentMethod']) || "Em Dinheiro",
            changeFor: row.change_for_cents ? `Troco p/ ${formatBRL(row.change_for_cents)}` : undefined,
            status: row.status,
            obs: row.notes || undefined,
            isUrgent: !!row.is_urgent
          }
        })
      }
    } catch (err) {
      console.error("Erro ao carregar pedidos da loja:", err)
    }
  }

  return (
    <OrdersClient
      initialOrders={initialOrders}
      storeId={storeId || undefined}
      storeName={storeName}
      storeSlug={storeSlug}
    />
  )
}
