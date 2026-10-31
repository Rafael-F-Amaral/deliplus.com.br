import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getPublicStoreBySlug } from "@/lib/stores/public-store"
import { StorefrontCartProvider } from "@/lib/storefront/storefront-cart-context"
import { StorefrontPageClient } from "@/components/storefront/storefront-page-client"
import { StoreClosedScreen } from "@/components/storefront/store-closed-screen"
import { MOCK_CASA_NOMA_STORE } from "@/lib/storefront/mock-storefront-data"
import { StorefrontStore } from "@/types/storefront"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
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
          const { data: devSettings } = await (admin.from("store_delivery_settings" as any) as any)
            .select("is_open_override, banner_url, logo_url")
            .eq("store_id", storeRow.id)
            .maybeSingle()

          if (devSettings) {
            if (devSettings.banner_url) storeData.banner_url = devSettings.banner_url
            if (devSettings.logo_url) storeData.logo_url = devSettings.logo_url
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
          <StorefrontPageClient initialStore={storeData} />
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
        const { data: devSettings } = await (admin.from("store_delivery_settings" as any) as any)
          .select("is_open_override, banner_url, logo_url")
          .eq("store_id", storeRow.id)
          .maybeSingle()

        if (devSettings) {
          if (devSettings.banner_url) storeData.banner_url = devSettings.banner_url
          if (devSettings.logo_url) storeData.logo_url = devSettings.logo_url
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
      <StorefrontPageClient initialStore={storeData} />
    </StorefrontCartProvider>
  )
}
