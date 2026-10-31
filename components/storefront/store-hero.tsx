"use client"

import React from "react"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import { Clock, Bike, MapPin, Sparkles } from "lucide-react"
import { StoreOffersBanner } from "./store-offers-banner"

function widenUnsplashUrl(url: string | null | undefined): string {
  if (!url) {
    return "https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&w=1800&q=85"
  }
  if (!url.includes("images.unsplash.com")) {
    return url
  }
  try {
    const parsed = new URL(url)
    parsed.searchParams.delete("fit")
    parsed.searchParams.delete("h")
    parsed.searchParams.set("w", "1800")
    parsed.searchParams.set("q", "85")
    parsed.searchParams.set("auto", "format")
    return parsed.toString()
  } catch {
    return url
  }
}

export function StoreHero() {
  const { store, openModal } = useStorefrontCart()

  // Imagem ampla em alta resolução sem crop apertado (mostra mais detalhes e distância)
  const heroFoodImage = React.useMemo(() => {
    return widenUnsplashUrl(store.banner_url)
  }, [store.banner_url])

  return (
    <section className="border-b border-[#2E6B3E] dark:border-[#E76F41] bg-[#FAF8F5] dark:bg-[#131A15] transition-colors pb-8 md:pb-10 pt-4 md:pt-6">
      <div className="mx-auto max-w-7xl px-4 md:px-6 flex flex-col gap-4 md:gap-5">
        {/* ============================================================== */}
        {/* 1. OUTROS TEXTOS: IDENTIDADE E METADADOS DA LOJA                */}
        {/* ============================================================== */}
        <div className="flex flex-col gap-3.5">
          {/* Logo + Name Header */}
          <div className="flex items-center gap-4">
            {/* Circular Emblem Logo */}
            <div className="relative flex h-20 w-20 md:h-22 md:w-22 shrink-0 flex-col items-center justify-center rounded-full border-2 border-white dark:border-[#2A382E] bg-[#F7F2EB] dark:bg-[#1E2B22] p-2 text-center shadow-md md:shadow-xs transition-colors">
              <Sparkles className="h-4 w-4 text-[#8C7A6B] dark:text-[#A79888]" />
              <span className="font-serif text-[11px] font-bold tracking-wider text-[#3C3630] dark:text-[#F2EFE9]">
                CASA
              </span>
              <span className="font-serif text-[11px] font-bold tracking-wider text-[#3C3630] dark:text-[#F2EFE9]">
                NOMA
              </span>
            </div>

            {/* Title & Bio */}
            <div className="flex flex-col">
              <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1C251F] dark:text-[#F2EFE9] md:text-4xl lg:text-5xl">
                {store.name}
              </h1>
              <p className="mt-1 text-xs text-[#5D645E] dark:text-[#9CA79E] md:text-sm max-w-xl leading-relaxed">
                {store.bio}
              </p>
            </div>
          </div>

          {/* Metadata Row: Status, Prep Time, Free Delivery */}
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 text-xs font-medium text-[#4B534D] dark:text-[#9CA79E] md:text-sm pt-0.5">
            <span className="flex items-center gap-1.5 font-semibold text-[#1B6B38] dark:text-[#4ADE80]">
              <span className="h-2 w-2 rounded-full bg-[#2E9B4F] dark:bg-[#4ADE80] animate-pulse" />
              {store.is_open ? "Aberto agora" : "Fechado temporariamente"}
            </span>
            <span className="text-[#D8D2C5] dark:text-[#2A382E]">|</span>
            <span className="flex items-center gap-1.5 text-[#3D4740] dark:text-[#CBD5CD]">
              <Clock className="h-3.5 w-3.5 text-[#6B726C] dark:text-[#9CA79E]" />
              {store.prep_time}
            </span>
            <span className="text-[#D8D2C5] dark:text-[#2A382E]">|</span>
            <span className="flex items-center gap-1.5 text-[#2C382E] dark:text-[#CBD5CD]">
              <Bike className="h-3.5 w-3.5 text-[#6B726C] dark:text-[#9CA79E]" />
              Entrega grátis acima de R$ 80
            </span>
          </div>

          {/* Metadata Row 2: Address */}
          <div className="flex items-center gap-1.5 text-xs text-[#6B736E] dark:text-[#9CA79E] md:text-sm">
            <button
              type="button"
              onClick={() => openModal("delivery-info")}
              className="flex items-center gap-1.5 text-[#5A635C] dark:text-[#9CA79E] transition hover:text-[#1A261D] dark:hover:text-[#F2EFE9] hover:underline cursor-pointer"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#6E7570] dark:text-[#9CA79E]" />
              <span className="truncate">{store.address}</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. OFERTAS DA SEMANA (ABAIXO DOS TEXTOS, ACIMA DA IMAGEM)       */}
        {/* ============================================================== */}
        <div className="-my-2">
          <StoreOffersBanner />
        </div>

        {/* ============================================================== */}
        {/* 3. A IMAGEM LIMPA PRA SER VISTA (ABAIXO DE OFERTAS DA SEMANA)   */}
        {/* ============================================================== */}
        <div className="relative w-full h-56 sm:h-72 md:h-88 lg:h-96 rounded-2xl md:rounded-3xl overflow-hidden shadow-xs border border-[#E8E2D8] dark:border-[#2A382E]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroFoodImage}
            alt={store.name}
            className="h-full w-full object-cover object-center transition-all duration-300"
          />
        </div>
      </div>
    </section>
  )
}
