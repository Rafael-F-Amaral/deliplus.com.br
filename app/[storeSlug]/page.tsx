import { notFound } from "next/navigation"

import { StorefrontPreview } from "@/components/storefront/storefront-preview"

export default async function StorefrontPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params
  if (storeSlug !== "casa-noma") notFound()
  return <StorefrontPreview />
}
