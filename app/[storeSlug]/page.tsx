import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getPublicStoreBySlug } from "@/lib/stores/public-store"

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
  if (result.status === "not_found") notFound()

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-16">
      <h1 className="text-3xl font-semibold">{result.store.name}</h1>
      <p className="text-muted-foreground">Loja publicada no Deli Plus.</p>
    </main>
  )
}
