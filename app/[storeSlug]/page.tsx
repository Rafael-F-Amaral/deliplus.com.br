import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getPublicStoreBySlug } from "@/lib/stores/public-store"
import { StorefrontCartProvider } from "@/lib/storefront/storefront-cart-context"
import { StorefrontPageClient } from "@/components/storefront/storefront-page-client"
import { StoreClosedScreen } from "@/components/storefront/store-closed-screen"
import { MOCK_CASA_NOMA_STORE } from "@/lib/storefront/mock-storefront-data"
import { StorefrontStore, StorefrontCategory, StorefrontProduct } from "@/types/storefront"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

async function loadStoreCatalog(admin: any, storeId: string) {
  try {
    const [categoriesRes, itemsRes] = await Promise.all([
      admin
        .from("categories")
        .select("id, name, sort_order")
        .eq("store_id", storeId)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      admin
        .from("menu_items" as any)
        .select("*")
        .eq("store_id", storeId)
        .eq("is_active", true)
        .order("category_sort_order", { ascending: true })
        .order("name", { ascending: true }),
    ])

    let categories: StorefrontCategory[] = []
    let products: StorefrontProduct[] = []

    if (categoriesRes.data && categoriesRes.data.length > 0) {
      categories = [
        { id: "todas", name: "Todas" },
        ...categoriesRes.data.map((c: any) => ({
          id: c.id,
          name: c.name,
        })),
      ]
    }

    if (itemsRes.data && itemsRes.data.length > 0) {
      products = (itemsRes.data as any[]).map((row: any) => {
        const mainCat = row.category_name || "Geral"
        const tags: string[] = Array.isArray(row.tags) && row.tags.length > 0 ? row.tags : [mainCat]
        const isFeatured = tags.some(
          (t: string) => t.toLowerCase() === "mais pedido" || t.toLowerCase() === "destaque"
        )
        const isCombo = tags.some((t: string) => t.toLowerCase().includes("combo"))

        // Mapeia adicionais e complementos do banco de dados (public.menu_items)
        const complements = Array.isArray(row.adicionais)
          ? row.adicionais
              .filter((a: any) => a && a.is_active !== false)
              .map((a: any) => ({
                id: a.id,
                name: a.name,
                description: a.description || undefined,
                price_cents: Number(a.price_cents) || 0,
              }))
          : []

        // Galeria de até 5 fotos por prato
        let images: string[] = []
        if (Array.isArray(row.images) && row.images.length > 0) {
          images = row.images.filter(Boolean).slice(0, 5)
        } else if (row.image_url) {
          if (row.name?.toLowerCase().includes("bowl") || row.name?.toLowerCase().includes("salmão")) {
            images = [
              row.image_url,
              "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&h=450&q=80",
              "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&h=450&q=80",
              "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&h=450&q=80",
              "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=600&h=450&q=80",
            ]
          } else if (row.name?.toLowerCase().includes("tapioca")) {
            images = [
              row.image_url,
              "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=600&h=450&q=80",
              "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&h=450&q=80",
            ]
          } else {
            images = [row.image_url]
          }
        }

        return {
          id: row.id || "",
          category_id: row.category_id || row.category_name?.toLowerCase() || "geral",
          category_name: mainCat,
          name: row.name || "",
          description: row.description || "",
          price_cents: row.price_cents || 0,
          promo_price_cents: row.promo_price_cents || undefined,
          in_promo: Boolean(row.in_promo),
          discount_percentage: row.discount_percentage || undefined,
          image_url:
            row.image_url ||
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&h=450&q=80",
          images,
          tags,
          is_featured: isFeatured,
          is_combo: isCombo,
          free_delivery_eligible: true,
          complements,
        }
      })

      // Se categories da tabela estiver vazio, constrói a partir dos itens do cardápio
      if (categories.length === 0) {
        const catMap = new Map<string, string>()
        itemsRes.data.forEach((it: any) => {
          if (it.category_name) catMap.set(it.category_name.toLowerCase(), it.category_name)
          if (Array.isArray(it.tags)) {
            it.tags.forEach((t: string) => {
              if (t.toLowerCase() !== "mais pedido" && t.toLowerCase() !== "destaque") {
                catMap.set(t.toLowerCase(), t)
              }
            })
          }
        })
        categories = [
          { id: "todas", name: "Todas" },
          ...Array.from(catMap.entries()).map(([id, name]) => ({ id, name })),
        ]
      }
    }

    return { categories, products }
  } catch (e) {
    console.error("Erro ao carregar catálogo da loja:", e)
    return { categories: [], products: [] }
  }
}

export default async function PublicStorePage({
  params,
  searchParams,
}: {
  params: Promise<{ storeSlug: string }>
  searchParams?: Promise<{ closed?: string; status?: string }>
}) {
  const { storeSlug } = await params
  const query = await searchParams

  let result = await getPublicStoreBySlug(storeSlug)

  if (result.status === "not_found") {
    const strippedSlug = storeSlug.replace(/-\d+$/, "")
    if (strippedSlug !== storeSlug) {
      result = await getPublicStoreBySlug(strippedSlug)
    }
  }

  if (result.status === "not_found") {
    if (storeSlug === "casa-noma" || storeSlug.startsWith("rafaelteste")) {
      const storeData: StorefrontStore = { ...MOCK_CASA_NOMA_STORE }
      let isStoreOpen = true

      let initialCategories: StorefrontCategory[] = []
      let initialProducts: StorefrontProduct[] = []

      try {
        const { createAdminSupabaseClient } = await import("@/lib/supabase/admin")
        const admin = createAdminSupabaseClient()
        let { data: storeRow } = await admin
          .from("stores")
          .select("id, status")
          .eq("slug", "casa-noma")
          .maybeSingle()

        if (!storeRow) {
          const { data: firstStore } = await admin
            .from("stores")
            .select("id, status")
            .limit(1)
            .maybeSingle()
          storeRow = firstStore
        }

        if (storeRow) {
          const [settingsRes, catalog] = await Promise.all([
            (admin.from("store_delivery_settings" as any) as any)
              .select(
                "is_open_override, banner_url, logo_url, phone, instagram, social_links, bio, address, category, default_prep_min, default_prep_max, free_delivery_above_cents"
              )
              .eq("store_id", storeRow.id)
              .maybeSingle(),
            loadStoreCatalog(admin, storeRow.id),
          ])

          const devSettings = settingsRes.data
          initialCategories = catalog.categories
          initialProducts = catalog.products

          if (devSettings) {
            if (devSettings.banner_url) storeData.banner_url = devSettings.banner_url
            if (devSettings.logo_url) storeData.logo_url = devSettings.logo_url
            if (devSettings.phone) storeData.phone = devSettings.phone
            if (devSettings.instagram) storeData.instagram = devSettings.instagram
            if (devSettings.social_links) storeData.social_links = devSettings.social_links
            if (devSettings.bio) storeData.bio = devSettings.bio
            if (devSettings.address) storeData.address = devSettings.address
            if (devSettings.category) storeData.category = devSettings.category
            if (devSettings.default_prep_min && devSettings.default_prep_max) {
              storeData.prep_time = `${devSettings.default_prep_min}–${devSettings.default_prep_max} min`
            }
            if (devSettings.free_delivery_above_cents !== undefined) {
              storeData.free_delivery_above_cents = devSettings.free_delivery_above_cents
            }
            if (devSettings.is_open_override !== null && devSettings.is_open_override !== undefined) {
              isStoreOpen = Boolean(devSettings.is_open_override)
            }
          }
        }
      } catch {
        // Fallback to default open
      }

      // Query param override for easy instant testing (?closed=true or ?status=open)
      if (query?.closed === "true" || query?.status === "closed") {
        isStoreOpen = false
      } else if (query?.closed === "false" || query?.status === "open") {
        isStoreOpen = true
      }

      storeData.is_open = isStoreOpen

      if (!isStoreOpen) {
        return <StoreClosedScreen store={storeData} />
      }

      return (
        <StorefrontCartProvider initialStore={storeData}>
          <div className="sr-only">
            <h1>{storeData.name}</h1>
            <p>Loja publicada no Deli Plus.</p>
          </div>
          <StorefrontPageClient
            initialStore={storeData}
            initialCategories={initialCategories}
            initialProducts={initialProducts}
          />
        </StorefrontCartProvider>
      )
    }
    notFound()
  }

  const storeData: StorefrontStore = {
    ...MOCK_CASA_NOMA_STORE,
    name: result.store.name,
    slug: result.store.slug,
  }

  let isStoreOpen = true
  let initialCategories: StorefrontCategory[] = []
  let initialProducts: StorefrontProduct[] = []

  try {
    const { createAdminSupabaseClient } = await import("@/lib/supabase/admin")
    const admin = createAdminSupabaseClient()
    const { data: storeRow } = await admin
      .from("stores")
      .select("id, status")
      .eq("slug", result.store.slug)
      .maybeSingle()

    if (storeRow) {
      if (storeRow.status !== "active") {
        isStoreOpen = false
      } else {
        const [settingsRes, catalog] = await Promise.all([
          (admin.from("store_delivery_settings" as any) as any)
            .select(
              "is_open_override, banner_url, logo_url, phone, instagram, social_links, bio, address, category, default_prep_min, default_prep_max, free_delivery_above_cents"
            )
            .eq("store_id", storeRow.id)
            .maybeSingle(),
          loadStoreCatalog(admin, storeRow.id),
        ])

        const devSettings = settingsRes.data
        initialCategories = catalog.categories
        initialProducts = catalog.products

        if (devSettings) {
          if (devSettings.banner_url) storeData.banner_url = devSettings.banner_url
          if (devSettings.logo_url) storeData.logo_url = devSettings.logo_url
          if (devSettings.phone) storeData.phone = devSettings.phone
          if (devSettings.instagram) storeData.instagram = devSettings.instagram
          if (devSettings.social_links) storeData.social_links = devSettings.social_links
          if (devSettings.bio) storeData.bio = devSettings.bio
          if (devSettings.address) storeData.address = devSettings.address
          if (devSettings.category) storeData.category = devSettings.category
          if (devSettings.default_prep_min && devSettings.default_prep_max) {
            storeData.prep_time = `${devSettings.default_prep_min}–${devSettings.default_prep_max} min`
          }
          if (devSettings.free_delivery_above_cents !== undefined) {
            storeData.free_delivery_above_cents = devSettings.free_delivery_above_cents
          }
          if (devSettings.is_open_override !== null && devSettings.is_open_override !== undefined) {
            isStoreOpen = Boolean(devSettings.is_open_override)
          }
        }
      }
    }
  } catch {
    // Fallback
  }

  if (query?.closed === "true" || query?.status === "closed") {
    isStoreOpen = false
  } else if (query?.closed === "false" || query?.status === "open") {
    isStoreOpen = true
  }

  storeData.is_open = isStoreOpen

  if (!isStoreOpen) {
    return <StoreClosedScreen store={storeData} />
  }

  return (
    <StorefrontCartProvider initialStore={storeData}>
      <div className="sr-only">
        <h1>{result.store.name}</h1>
        <p>Loja publicada no Deli Plus.</p>
      </div>
      <StorefrontPageClient
        initialStore={storeData}
        initialCategories={initialCategories}
        initialProducts={initialProducts}
      />
    </StorefrontCartProvider>
  )
}
