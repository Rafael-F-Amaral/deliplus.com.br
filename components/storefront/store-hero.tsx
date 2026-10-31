"use client"

import React, { useState } from "react"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import {
  Clock,
  Bike,
  MapPin,
  Sparkles,
  Star,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { StorefrontProduct } from "@/types/storefront"

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
  const { store, openModal, openProductDetail } = useStorefrontCart()

  // Imagem ampla em alta resolução sem crop apertado (mostra mais detalhes e distância como no print)
  const heroFoodImage = React.useMemo(() => {
    return widenUnsplashUrl(store.banner_url)
  }, [store.banner_url])

  // Ofertas da semana (colocadas no lugar de Ver Cardápio / Coração)
  const offers: {
    id: string
    title: string
    combo_name: string
    discount_badge: string
    original_price_formatted: string
    promo_price_formatted: string
    image_url: string
    product_data: StorefrontProduct
  }[] = [
    {
      id: "offer-combo-bowl-cha",
      title: "Ofertas da semana",
      combo_name: "Combo Bowl + Chá",
      discount_badge: "15% OFF",
      original_price_formatted: "R$ 49,90",
      promo_price_formatted: "R$ 42,40",
      image_url:
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&h=400&q=80",
      product_data: {
        id: "combo-equilibrio",
        category_id: "combos",
        category_name: "Combos da semana",
        name: "Combo Bowl + Chá",
        description:
          "Bowl de Frango Grelhado nutritivo acompanhado do clássico Chá gelado de hibisco e frutas vermelhas da casa.",
        price_cents: 4990,
        promo_price_cents: 4240,
        in_promo: true,
        discount_percentage: 15,
        image_url:
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&h=450&q=80",
        tags: ["Oferta da Semana", "15% OFF"],
      },
    },
    {
      id: "offer-combo-leve",
      title: "Ofertas da semana",
      combo_name: "Combo Leve (Bowl + Suco)",
      discount_badge: "15% OFF",
      original_price_formatted: "R$ 52,80",
      promo_price_formatted: "R$ 44,90",
      image_url:
        "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&h=400&q=80",
      product_data: {
        id: "combo-leve",
        category_id: "combos",
        category_name: "Combos da semana",
        name: "Combo Leve (Bowl + Suco Verde)",
        description:
          "Bowl nutritivo com quinoa e legumes, acompanhado do clássico Suco Verde Detox.",
        price_cents: 5280,
        promo_price_cents: 4490,
        in_promo: true,
        discount_percentage: 15,
        image_url:
          "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&h=450&q=80",
        tags: ["Oferta", "Saudável"],
      },
    },
  ]

  const [currentOfferIdx, setCurrentOfferIdx] = useState(0)
  const currentOffer = offers[currentOfferIdx]

  return (
    <section className="relative overflow-hidden border-b border-[#2E6B3E] dark:border-[#E76F41] bg-[#FAF8F5] dark:bg-[#131A15] transition-colors">
      {/* ============================================================== */}
      {/* 1. DESKTOP: FULL-BLEED RIGHT IMAGE COM FADE (PRINT QUADRADO)    */}
      {/* ============================================================== */}
      <div className="hidden md:block absolute inset-y-0 right-0 w-1/2 lg:w-[54%] xl:w-[58%] h-full overflow-hidden pointer-events-none select-none z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroFoodImage}
          alt={store.name}
          className="h-full w-full object-cover object-center"
        />
        {/* Soft Left Faded Gradient: dissolve suavemente na cor de fundo da esquerda */}
        <div className="absolute inset-y-0 left-0 w-36 md:w-48 lg:w-64 xl:w-80 bg-linear-to-r from-[#FAF8F5] via-[#FAF8F5]/80 to-transparent dark:from-[#131A15] dark:via-[#131A15]/80 pointer-events-none" />
        {/* Faded inferior suave */}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-[#FAF8F5]/40 to-transparent dark:from-[#131A15]/40 pointer-events-none" />
      </div>

      {/* ============================================================== */}
      {/* 2. MOBILE: TOP BANNER                                          */}
      {/* ============================================================== */}
      <div className="relative h-48 sm:h-56 w-full overflow-hidden md:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroFoodImage}
          alt={store.name}
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#FAF8F5] via-[#FAF8F5]/30 to-transparent dark:from-[#131A15] dark:via-[#131A15]/30 pointer-events-none" />
      </div>

      {/* ============================================================== */}
      {/* 3. STORE DETAILS CONTENT (LADO ESQUERDO DO HERO)                */}
      {/* ============================================================== */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8 lg:py-10">
        <div className="max-w-xl flex flex-col gap-3 -mt-6 md:mt-0">
          {/* Logo Emblem + Name */}
          <div className="flex items-center gap-3.5">
            {/* Circular Emblem Logo */}
            <div className="relative flex h-18 w-18 md:h-20 md:w-20 shrink-0 flex-col items-center justify-center rounded-full border-2 border-white dark:border-[#2A382E] bg-[#F7F2EB] dark:bg-[#1E2B22] p-2 text-center shadow-xs transition-colors">
              <Sparkles className="h-3.5 w-3.5 text-[#8C7A6B] dark:text-[#A79888]" />
              <span className="font-serif text-[10px] font-bold tracking-wider text-[#3C3630] dark:text-[#F2EFE9] leading-tight">
                CASA
              </span>
              <span className="font-serif text-[10px] font-bold tracking-wider text-[#3C3630] dark:text-[#F2EFE9] leading-tight">
                NOMA
              </span>
            </div>

            {/* Title & Bio */}
            <div className="flex flex-col">
              <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1C251F] dark:text-[#F2EFE9] sm:text-3xl md:text-4xl lg:text-5xl">
                {store.name}
              </h1>
              <p className="mt-0.5 text-xs text-[#5D645E] dark:text-[#9CA79E] md:text-sm max-w-md leading-relaxed">
                {store.bio}
              </p>
            </div>
          </div>

          {/* Category Tags Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {(store.tags && store.tags.length > 0
              ? store.tags
              : [store.category || "Restaurante", "Saudável", "Caseira"]
            ).map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#EFECE6] dark:bg-[#233127] text-[#5A635C] dark:text-[#CBD5CD] border border-[#E2DBD0] dark:border-[#2F4135]"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Status Row: Aberto agora | 25-35 min | Entrega grátis */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-[#4B534D] dark:text-[#9CA79E] pt-0.5">
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

          {/* Rating & Address: ★ 4,8 (320) | Rua Harmonia... */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5D645E] dark:text-[#9CA79E]">
            <span className="flex items-center gap-1 font-semibold text-[#1C251F] dark:text-[#F2EFE9]">
              <Star className="h-3.5 w-3.5 fill-[#E7A740] text-[#E7A740]" />
              <span>{store.rating ?? 4.8}</span>
              <span className="font-normal text-[#8A958E]">
                ({store.reviews_count ?? 320})
              </span>
            </span>
            <span className="text-[#D8D2C5] dark:text-[#2A382E]">|</span>
            <button
              type="button"
              onClick={() => openModal("delivery-info")}
              className="flex items-center gap-1.5 hover:text-[#1A261D] dark:hover:text-[#F2EFE9] hover:underline transition cursor-pointer"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#6E7570] dark:text-[#9CA79E]" />
              <span className="truncate max-w-xs">{store.address}</span>
            </button>
          </div>

          {/* ============================================================== */}
          {/* NO LUGAR DE "VER CARDÁPIO" E CORAÇÃO: OFERTAS DA SEMANA         */}
          {/* ============================================================== */}
          <div className="pt-1.5 max-w-md">
            <div
              onClick={() => openProductDetail(currentOffer.product_data)}
              className="group relative flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl bg-white/90 dark:bg-[#1E2B22]/90 border border-[#E8E2D8] dark:border-[#2F4135] shadow-xs hover:border-[#2E6B3E]/50 dark:hover:border-[#4ADE80]/50 hover:shadow-sm transition cursor-pointer backdrop-blur-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative h-13 w-15 sm:h-14 sm:w-16 rounded-xl overflow-hidden shrink-0 border border-[#E9E4D4] dark:border-[#2A382E]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentOffer.image_url}
                    alt={currentOffer.combo_name}
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <span className="absolute top-1 left-1 px-1 py-0.2 rounded text-[9px] font-black bg-[#CB5A3C] text-white leading-none">
                    {currentOffer.discount_badge}
                  </span>
                </div>

                <div className="min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#CB5A3C]">
                      Oferta da semana
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-[#1C251F] dark:text-[#F2EFE9] truncate">
                    {currentOffer.combo_name}
                  </p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-[10px] text-[#8C9B90] dark:text-[#7A867E] line-through">
                      De {currentOffer.original_price_formatted}
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-[#1C251F] dark:text-[#F2EFE9]">
                      {currentOffer.promo_price_formatted}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 pr-1">
                {offers.length > 1 && (
                  <div className="hidden sm:flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setCurrentOfferIdx((prev) =>
                          prev === 0 ? offers.length - 1 : prev - 1
                        )
                      }}
                      className="p-1 rounded-lg text-[#637267] hover:bg-[#F2ECE1] dark:hover:bg-[#2A382E] transition cursor-pointer"
                      title="Oferta anterior"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setCurrentOfferIdx((prev) =>
                          prev === offers.length - 1 ? 0 : prev + 1
                        )
                      }}
                      className="p-1 rounded-lg text-[#637267] hover:bg-[#F2ECE1] dark:hover:bg-[#2A382E] transition cursor-pointer"
                      title="Próxima oferta"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2E6B3E] text-white shadow-xs transition group-hover:bg-[#255732]">
                  <Plus className="h-4 w-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
