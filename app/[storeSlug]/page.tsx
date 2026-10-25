import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getPublicStoreBySlug } from "@/lib/stores/public-store"
import { StorefrontCartProvider } from "@/lib/storefront/storefront-cart-context"
import { StorefrontPageClient } from "@/components/storefront/storefront-page-client"
import { MOCK_CASA_NOMA_STORE } from "@/lib/storefront/mock-storefront-data"
import { StorefrontStore } from "@/types/storefront"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function PublicStorePage({
  params,
}: {
  params: Promise<{ storeSlug: string }>
}) {
  const { storeSlug } = await params

  const result = await getPublicStoreBySlug(storeSlug)

  if (result.status === "not_found") {
    if (storeSlug === "casa-noma") {
      return (
        <StorefrontCartProvider initialStore={MOCK_CASA_NOMA_STORE}>
          <div className="sr-only">
            <h1>{MOCK_CASA_NOMA_STORE.name}</h1>
            <p>Loja publicada no Deli Plus.</p>
          </div>
          <StorefrontPageClient initialStore={MOCK_CASA_NOMA_STORE} />
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
