import { auth } from "@clerk/nextjs/server"
import { getActiveStoreId } from "@/lib/stores/get-active-store"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import MenuClient, { MenuItem } from "./menu-client"
import { getCategoryBadgeStyle, formatPromoPeriod } from "./menu-utils"

export const dynamic = "force-dynamic"

function formatBRL(cents: number | null | undefined): string {
  if (typeof cents !== "number" || isNaN(cents)) return "R$ 0,00"
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  })
}

export default async function CardapioPage() {
  const { userId } = await auth()
  let storeId = await getActiveStoreId().catch(() => null)

  let storeSlug = "casa-noma"
  let storeName = "Casa Noma"
  let initialItems: MenuItem[] = []
  let initialCategories: { id: string; name: string }[] = []
  let tourAlreadyDismissed = false

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
      const [storeRes, itemsRes, categoriesRes, tourRes] = await Promise.all([
        supabase.from("stores").select("id, name, slug").eq("id", storeId).maybeSingle(),
        supabase.from("vw_menu_items").select("*").eq("store_id", storeId).order("category_sort_order", { ascending: true }).order("name", { ascending: true }),
        supabase.from("categories").select("id, name, sort_order").eq("store_id", storeId).order("sort_order", { ascending: true }).order("name", { ascending: true }),
        (userId || process.env.NODE_ENV === "development")
          ? supabase.from("user_tour_progress").select("completed, dismissed").eq("clerk_user_id", userId || "dev_user_rafael").eq("tour_key", "menu_tour").maybeSingle()
          : Promise.resolve({ data: null })
      ])

      if (storeRes.data?.slug) storeSlug = storeRes.data.slug
      if (storeRes.data?.name) storeName = storeRes.data.name

      if (categoriesRes.data && categoriesRes.data.length > 0) {
        initialCategories = categoriesRes.data.map((c) => ({
          id: c.id,
          name: c.name
        }))
      }

      if (tourRes?.data) {
        tourAlreadyDismissed = Boolean(tourRes.data.completed || tourRes.data.dismissed)
      }

      if (itemsRes.error) {
        console.error("itemsRes error:", itemsRes.error)
      }

      if (itemsRes.data && itemsRes.data.length > 0) {
        console.log("CardapioPage fetched rows:", itemsRes.data.length)
        initialItems = itemsRes.data.map((row) => {
          const mainCat = row.category_name || "Geral"
          const badgeStyle = getCategoryBadgeStyle(mainCat)
          const tags: string[] = Array.isArray(row.tags) && row.tags.length > 0 ? row.tags : [mainCat]

          let promoScheduleText = ""
          if (row.in_promo && row.promo_price_cents) {
            promoScheduleText = formatPromoPeriod(
              row.promo_start_date || undefined,
              row.promo_end_date || undefined,
              Boolean(row.promo_indefinite)
            ).periodText
          }

          return {
            id: row.id || "",
            name: row.name || "",
            category: mainCat,
            categories: tags,
            categoryBg: badgeStyle.bg,
            categoryText: badgeStyle.text,
            image: row.image_url || "",
            description: row.description || "",
            originalPrice: formatBRL(row.price_cents),
            promoPrice: row.promo_price_cents ? formatBRL(row.promo_price_cents) : null,
            inPromo: Boolean(row.in_promo),
            isAvailable: Boolean(row.is_active),
            dailyLimit: row.daily_limit ?? null,
            remaining: row.daily_remaining ?? null,
            availabilitySchedule: "Todos os dias, 11:00 – 23:00",
            promoSchedule: promoScheduleText,
            promoIndefinite: Boolean(row.promo_indefinite),
            promoStartDate: row.promo_start_date || undefined,
            promoEndDate: row.promo_end_date || undefined
          } as MenuItem
        })
      }
    } catch (err) {
      console.error("Erro ao carregar dados do cardápio:", err)
    }
  }

  return (
    <MenuClient
      storeSlug={storeSlug}
      storeName={storeName}
      initialItems={initialItems}
      initialCategories={initialCategories}
      tourAlreadyDismissed={tourAlreadyDismissed}
    />
  )
}
