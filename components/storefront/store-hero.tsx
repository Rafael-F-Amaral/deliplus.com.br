"use client"

import React from "react"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import { StorefrontImage } from "./storefront-image"
import { Clock, Bike, MapPin, ChevronRight } from "lucide-react"
import {
  WhatsAppIcon,
  InstagramIcon,
  FacebookIcon,
  YouTubeIcon,
  TikTokIcon,
  KwaiIcon,
} from "@/components/ui/social-icons"

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

  // Imagem ampla em alta resolução sem crop apertado (mostra mais detalhes e distância como no print)
  const heroFoodImage = React.useMemo(() => {
    return widenUnsplashUrl(store.banner_url)
  }, [store.banner_url])

  // Processar canais sociais configurados (máximo 3 exibidos no perfil da vitrine)
  const socialChannels = React.useMemo(() => {
    const links = store.social_links || {}
    const channels: {
      id: string
      name: string
      label: string
      url: string
      icon: React.ReactNode
    }[] = []

    // 1. WhatsApp
    const wa = links.whatsapp || store.phone
    if (wa && wa.trim()) {
      const cleanNum = wa.replace(/\D/g, "")
      const formattedNum = wa.trim()
      if (cleanNum) {
        channels.push({
          id: "whatsapp",
          name: "WhatsApp",
          label: formattedNum,
          url: `https://wa.me/55${cleanNum}`,
          icon: <WhatsAppIcon className="w-3.5 h-3.5 shrink-0" />,
        })
      }
    }

    // 2. Instagram
    const ig = links.instagram || store.instagram
    if (ig && ig.trim()) {
      const handle = ig.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
      if (handle) {
        channels.push({
          id: "instagram",
          name: "Instagram",
          label: `@${handle}`,
          url: `https://instagram.com/${handle}`,
          icon: <InstagramIcon className="w-3.5 h-3.5 shrink-0" />,
        })
      }
    }

    // 3. Facebook
    if (links.facebook && links.facebook.trim()) {
      const rawFb = links.facebook.trim()
      const fbHandle = rawFb.replace(/^https?:\/\/(www\.)?facebook\.com\//, "").replace(/^\//, "")
      if (fbHandle) {
        channels.push({
          id: "facebook",
          name: "Facebook",
          label: fbHandle.startsWith("@") ? fbHandle : `@${fbHandle}`,
          url: rawFb.startsWith("http") ? rawFb : `https://facebook.com/${fbHandle}`,
          icon: <FacebookIcon className="w-3.5 h-3.5 shrink-0" />,
        })
      }
    }

    // 4. YouTube
    if (links.youtube && links.youtube.trim()) {
      const rawYt = links.youtube.trim()
      const ytHandle = rawYt.replace(/^https?:\/\/(www\.)?youtube\.com\//, "").replace(/^\//, "")
      if (ytHandle) {
        channels.push({
          id: "youtube",
          name: "YouTube",
          label: ytHandle.startsWith("@") ? ytHandle : `@${ytHandle}`,
          url: rawYt.startsWith("http") ? rawYt : `https://youtube.com/${ytHandle}`,
          icon: <YouTubeIcon className="w-3.5 h-3.5 shrink-0" />,
        })
      }
    }

    // 5. TikTok
    if (links.tiktok && links.tiktok.trim()) {
      const rawTt = links.tiktok.trim()
      const ttHandle = rawTt.replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/, "").replace(/^@/, "")
      if (ttHandle) {
        channels.push({
          id: "tiktok",
          name: "TikTok",
          label: `@${ttHandle}`,
          url: `https://tiktok.com/@${ttHandle}`,
          icon: <TikTokIcon className="w-3.5 h-3.5 shrink-0" />,
        })
      }
    }

    // 6. Kwai
    if (links.kwai && links.kwai.trim()) {
      const rawKw = links.kwai.trim()
      const kwHandle = rawKw.replace(/^https?:\/\/(www\.)?kwai\.com\/@?/, "").replace(/^@/, "")
      if (kwHandle) {
        channels.push({
          id: "kwai",
          name: "Kwai",
          label: `@${kwHandle}`,
          url: `https://kwai.com/@${kwHandle}`,
          icon: <KwaiIcon className="w-3.5 h-3.5 shrink-0" />,
        })
      }
    }

    // Retorna no máximo 4 canais que estiverem preenchidos para o perfil
    return channels.slice(0, 4)
  }, [store.social_links, store.phone, store.instagram])

  return (
    <section className="relative overflow-hidden border-b border-[#2E6B3E] dark:border-[#E76F41] bg-[#FAF8F5] dark:bg-[#131A15] transition-colors">
      {/* ============================================================== */}
      {/* 1. DESKTOP: RIGHT IMAGE CONFINED TO MAX-W-7XL COM FADE         */}
      {/* ============================================================== */}
      <div className="hidden md:block pointer-events-none select-none absolute inset-0 mx-auto max-w-7xl z-0">
        <div className="absolute inset-y-0 right-0 w-[48%] lg:w-[52%] h-full overflow-hidden">
          <StorefrontImage
            src={heroFoodImage}
            alt={store.name}
            className="h-full w-full object-cover object-center"
            fallbackClassName="h-full w-full"
            iconClassName="h-10 w-10"
          />
          {/* Soft Left Faded Gradient: dissolve suavemente na cor de fundo da esquerda */}
          <div className="absolute inset-y-0 left-0 w-36 md:w-44 lg:w-56 xl:w-64 bg-linear-to-r from-[#FAF8F5] via-[#FAF8F5]/80 to-transparent dark:from-[#131A15] dark:via-[#131A15]/80 pointer-events-none" />
          {/* Soft Right Faded Gradient em telas maiores que max-w-7xl */}
          <div className="hidden min-[1281px]:block absolute inset-y-0 right-0 w-24 bg-linear-to-l from-[#FAF8F5] via-[#FAF8F5]/40 to-transparent dark:from-[#131A15] dark:via-[#131A15]/40 pointer-events-none" />
          {/* Faded inferior suave */}
          <div className="absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-[#FAF8F5]/40 to-transparent dark:from-[#131A15]/40 pointer-events-none" />
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MOBILE: TOP BANNER                                          */}
      {/* ============================================================== */}
      <div className="relative h-48 sm:h-60 short:h-36 w-full overflow-hidden md:hidden">
        <StorefrontImage
          src={heroFoodImage}
          alt={store.name}
          className="h-full w-full object-cover object-center"
          fallbackClassName="h-full w-full"
          iconClassName="h-10 w-10"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#FAF8F5] via-[#FAF8F5]/30 to-transparent dark:from-[#131A15] dark:via-[#131A15]/30 pointer-events-none" />
      </div>

      {/* ============================================================== */}
      {/* 3. STORE DETAILS CONTENT (LADO ESQUERDO DO HERO)                */}
      {/* ============================================================== */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-9 lg:py-11 short:py-4 short:md:py-4 short:lg:py-4 ultrashort:py-3 ultrashort:lg:py-3 min-h-[240px] md:min-h-[280px] lg:min-h-[300px] short:min-h-0 flex flex-col justify-center">
        <div className="w-full max-w-xl md:max-w-[54%] lg:max-w-[490px] xl:max-w-xl flex flex-col gap-3.5 short:gap-2.5 -mt-6 short:-mt-3 md:mt-0">
          {/* Identidade da Loja */}
          <div className="flex items-start gap-3.5 short:gap-3">
            {store.logo_url && (
              <StorefrontImage
                src={store.logo_url}
                alt={store.name}
                variant="logo"
                className="h-14 w-14 sm:h-16 sm:w-16 lg:h-18 lg:w-18 short:h-12 short:w-12 short:lg:h-14 short:lg:w-14 rounded-2xl object-cover border-2 border-white dark:border-[#2A382E] shadow-md shrink-0 bg-white dark:bg-[#1A251D]"
                fallbackClassName="h-14 w-14 sm:h-16 sm:w-16 lg:h-18 lg:w-18 short:h-12 short:w-12 short:lg:h-14 short:lg:w-14 rounded-2xl border-2 border-white dark:border-[#2A382E] shadow-md shrink-0"
                iconClassName="h-6 w-6"
              />
            )}
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[42px] short:text-2xl short:lg:text-3xl font-bold tracking-tight text-[#162019] dark:text-[#F4EFEA] leading-tight line-clamp-2 break-words">
                {store.name}
              </h1>
              {store.bio && (
                <p className="text-xs sm:text-[13px] short:text-xs text-[#374151] dark:text-[#D1D5DB] max-w-lg leading-relaxed short:leading-snug font-normal line-clamp-2">
                  {store.bio}
                </p>
              )}
            </div>
          </div>

          {/* Chips de Status & Entrega (Pills Modernos / Bento Bar) */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-0.5">
            {/* Status: Aberto ou Fechado */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 short:py-0.5 rounded-full text-xs font-semibold backdrop-blur-xs transition shadow-2xs ${
                store.is_open
                  ? "bg-emerald-500/12 text-emerald-800 dark:text-emerald-300 border border-emerald-600/25 dark:border-emerald-500/30"
                  : "bg-amber-500/12 text-amber-800 dark:text-amber-300 border border-amber-600/25 dark:border-amber-500/30"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  store.is_open
                    ? "bg-emerald-600 dark:bg-emerald-400 animate-pulse"
                    : "bg-amber-600 dark:bg-amber-400"
                }`}
              />
              {store.is_open ? "Aberto agora" : "Fechado temporariamente"}
            </span>

            {/* Tempo de Preparo */}
            {store.prep_time && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/85 dark:bg-[#1E2B22]/85 border border-[#E4DDD2] dark:border-[#2D3D32] text-[#2C382E] dark:text-[#CBD5CD] shadow-2xs backdrop-blur-xs">
                <Clock className="h-3.5 w-3.5 text-[#5C665F] dark:text-[#9CA79E] shrink-0" />
                <span>{store.prep_time}</span>
              </span>
            )}

            {/* Regra de Frete */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#2E6B3E]/10 dark:bg-[#4ADE80]/10 border border-[#2E6B3E]/20 dark:border-[#4ADE80]/20 text-[#1B6B38] dark:text-[#4ADE80] shadow-2xs backdrop-blur-xs">
              <Bike className="h-3.5 w-3.5 shrink-0" />
              <span>
                {store.free_delivery_above_cents
                  ? `Entrega grátis acima de R$ ${(store.free_delivery_above_cents / 100).toFixed(0)}`
                  : "Entrega Disponível"}
              </span>
            </span>
          </div>

          {/* Endereço Clicável com Micro-Pill Moderno */}
          {store.address && (
            <div className="pt-0.5 max-w-full">
              <button
                type="button"
                onClick={() => openModal("delivery-info")}
                className="group inline-flex min-h-9 max-w-full min-w-0 items-center gap-2 px-3 py-1.5 rounded-xl bg-white/70 dark:bg-[#1E2B22]/70 hover:bg-white dark:hover:bg-[#1E2B22] border border-[#E4DDD2] dark:border-[#2F4135] hover:border-[#2E6B3E]/50 dark:hover:border-[#4ADE80]/50 shadow-2xs transition-all cursor-pointer text-xs font-medium text-[#4D5650] dark:text-[#A0ABA2] hover:text-[#1C251F] dark:hover:text-[#F2EFE9] backdrop-blur-xs"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-[#2E6B3E] dark:text-[#4ADE80]" />
                <span className="min-w-0 flex-1 truncate text-left">{store.address}</span>
                <ChevronRight className="h-3.5 w-3.5 text-[#59615B] dark:text-[#9CA79E] group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* REDES SOCIAIS OFICIAIS CLICÁVEIS (ATÉ 4 PREENCHIDAS)          */}
          {/* ============================================================== */}
          {socialChannels.length > 0 && (
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-wider uppercase text-[#111827] dark:text-[#E8F0EA]">
                  Canais Oficiais & Atendimento
                </span>
              </div>
              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 w-full max-w-sm sm:max-w-md pt-0.5">
                {socialChannels.map((channel) => (
                  <a
                    key={channel.id}
                    href={channel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex min-h-11 lg:min-h-10 min-w-0 items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-[#1E2B22]/95 border border-[#E2DBD0] dark:border-[#2F4135] shadow-2xs hover:border-[#2E6B3E] dark:hover:border-[#4ADE80] hover:shadow-xs transition-all cursor-pointer backdrop-blur-xs"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FAF8F5] dark:bg-[#151D17] border border-[#EAE4D8] dark:border-[#263529] text-[#1B291F] dark:text-[#F2EFE9] group-hover:scale-105 transition-transform">
                      {channel.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#59615B] dark:text-[#9CA79E] leading-tight">
                        {channel.name}
                      </div>
                      <div className="truncate text-xs font-semibold text-[#1B291F] dark:text-[#F2EFE9] group-hover:text-[#2E6B3E] dark:group-hover:text-[#4ADE80] transition-colors">
                        {channel.label}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
