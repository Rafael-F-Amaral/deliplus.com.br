import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getActiveStoreId } from "@/lib/stores/get-active-store"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

interface UntypedQueryBuilder {
  select: (columns: string) => UntypedQueryBuilder
  eq: (column: string, value: string) => UntypedQueryBuilder
  order: (column: string, opts?: { ascending?: boolean }) => UntypedQueryBuilder
  limit: (count: number) => Promise<{ data: Record<string, unknown>[] | null; error: unknown }>
  maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>
  upsert: (
    values: Record<string, unknown>,
    opts?: { onConflict?: string }
  ) => Promise<{ error: unknown }>
  update: (values: Record<string, unknown>) => UntypedQueryBuilder
}

interface UntypedSupabase {
  from: (table: string) => UntypedQueryBuilder
}

async function resolveStoreAndClient(): Promise<{
  storeId: string | null
  db: UntypedSupabase
}> {
  await auth().catch(() => null)
  let storeId = await getActiveStoreId().catch(() => null)
  let supabase: unknown = createServerSupabaseClient()

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
      console.warn("Overview dev fallback failed:", e)
    }
  } else if (process.env.NODE_ENV === "development") {
    try {
      supabase = createAdminSupabaseClient()
    } catch {
      // keep server client
    }
  }

  return { storeId, db: supabase as UntypedSupabase }
}

export async function GET() {
  try {
    const { storeId, db } = await resolveStoreAndClient()
    if (!storeId) {
      return NextResponse.json({ status: "no_store" })
    }

    const [
      storeRes,
      deliveryRes,
      ordersRes,
      menuRes,
      alertsRes,
      couponsRes,
    ] = await Promise.all([
      db.from("stores").select("id, name, slug, status").eq("id", storeId).maybeSingle(),
      db.from("store_delivery_settings").select("*").eq("store_id", storeId).maybeSingle(),
      db
        .from("orders_live")
        .select("*")
        .eq("store_id", storeId)
        .order("order_number", { ascending: false })
        .limit(30),
      db
        .from("menu_items")
        .select(
          "id, name, category_name, price_cents, promo_price_cents, in_promo, is_active, image_url, daily_limit, daily_remaining"
        )
        .eq("store_id", storeId)
        .order("name", { ascending: true })
        .limit(40),
      db
        .from("inventory_alerts")
        .select("id, name, quantity, unit, min_stock, category_name")
        .eq("store_id", storeId)
        .limit(10),
      db
        .from("coupons")
        .select(
          "id, code, description, discount_type, discount_value, min_order_cents, max_uses, uses_count, status"
        )
        .eq("store_id", storeId)
        .order("uses_count", { ascending: false })
        .limit(10),
    ])

    return NextResponse.json({
      status: "ok",
      store: storeRes.data || null,
      deliverySettings: deliveryRes.data || null,
      orders: ordersRes.data || [],
      menuItems: menuRes.data || [],
      inventoryAlerts: alertsRes.data || [],
      coupons: couponsRes.data || [],
    })
  } catch (err) {
    console.error("Error in GET /api/dashboard/overview-live:", err)
    return NextResponse.json({ status: "error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { storeId, db } = await resolveStoreAndClient()
    if (!storeId) {
      return NextResponse.json(
        { ok: false, error: "Loja não identificada" },
        { status: 400 }
      )
    }

    const body = (await request.json()) as Record<string, unknown>
    const { action } = body

    if (action === "toggle_store_open") {
      const isOpen = Boolean(body.isOpen)
      const prepMin = typeof body.prepMin === "number" ? body.prepMin : 35
      const prepMax = typeof body.prepMax === "number" ? body.prepMax : 50

      await db.from("store_delivery_settings").upsert(
        {
          store_id: storeId,
          is_open_override: isOpen,
          default_prep_min: prepMin,
          default_prep_max: prepMax,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "store_id" }
      )

      return NextResponse.json({ ok: true, isOpen, prepMin, prepMax })
    }

    if (action === "update_order_status") {
      const orderId = typeof body.orderId === "string" ? body.orderId : ""
      const status = typeof body.status === "string" ? body.status : ""
      if (!orderId || !status) {
        return NextResponse.json(
          { ok: false, error: "Dados inválidos" },
          { status: 400 }
        )
      }

      const now = new Date().toISOString()
      const extraTimestamps: Record<string, unknown> = { updated_at: now }
      if (status === "Em preparo") extraTimestamps.accepted_at = now
      if (status === "Pronto") extraTimestamps.ready_at = now
      if (status === "Em entrega") extraTimestamps.dispatched_at = now
      if (status === "Concluído") extraTimestamps.completed_at = now

      await db
        .from("orders")
        .update({
          status,
          ...(status === "Em preparo" ? { is_urgent: false } : {}),
          ...extraTimestamps,
        })
        .eq("id", orderId)
        .eq("store_id", storeId)

      return NextResponse.json({ ok: true })
    }

    if (action === "toggle_product_active") {
      const productId = typeof body.productId === "string" ? body.productId : ""
      const isActive = Boolean(body.isActive)
      if (!productId) {
        return NextResponse.json(
          { ok: false, error: "Produto inválido" },
          { status: 400 }
        )
      }

      await db
        .from("products")
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId)
        .eq("store_id", storeId)

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json(
      { ok: false, error: "Ação desconhecida" },
      { status: 400 }
    )
  } catch (err) {
    console.error("Error in POST /api/dashboard/overview-live:", err)
    return NextResponse.json(
      { ok: false, error: "Falha ao executar ação" },
      { status: 500 }
    )
  }
}
