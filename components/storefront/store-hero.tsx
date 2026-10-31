"use client"

import React from "react"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import { Clock, Bike, MapPin } from "lucide-react"
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
      channels.push({
        id: "whatsapp",
        name: "WhatsApp",
        label: formattedNum,
        url: `https://wa.me/55${cleanNum}`,
        icon: <WhatsAppIcon className="w-3.5 h-3.5 shrink-0" />,
      })
    }

    // 2. Instagram
    const ig = links.instagram || store.instagram
    if (ig && ig.trim()) {
      const handle = ig.trim().replace(/^@/, "")
      channels.push({
        id: "instagram",
        name: "Instagram",
        label: `@${handle}`,
        url: `https://instagram.com/${handle}`,
        icon: <InstagramIcon className="w-3.5 h-3.5 shrink-0" />,
      })
    }

    // 3. Facebook
    if (links.facebook && links.facebook.trim()) {
      const fb = links.facebook.trim().replace(/^https?:\/\/(www\.)?facebook\.com\//, "")
      channels.push({
        id: "facebook",
        name: "Facebook",
        label: fb,
        url: links.facebook.startsWith("http") ? links.facebook : `https://facebook.com/${fb}`,
        icon: <FacebookIcon className="w-3.5 h-3.5 shrink-0" />,
      })
    }

    // 4. YouTube
    if (links.youtube && links.youtube.trim()) {
      const yt = links.youtube.trim()
      channels.push({
        id: "youtube",
        name: "YouTube",
        label: yt.replace(/^https?:\/\/(www\.)?youtube\.com\//, ""),
        url: yt.startsWith("http") ? yt : `https://youtube.com/${yt}`,
        icon: <YouTubeIcon className="w-3.5 h-3.5 shrink-0" />,
      })
    }

    // 5. TikTok
    if (links.tiktok && links.tiktok.trim()) {
      const tt = links.tiktok.trim()
      channels.push({
        id: "tiktok",
        name: "TikTok",
        label: tt.startsWith("@") ? tt : `@${tt}`,
        url: tt.startsWith("http") ? tt : `https://tiktok.com/@${tt.replace(/^@/, "")}`,
        icon: <TikTokIcon className="w-3.5 h-3.5 shrink-0" />,
      })
    }

    // 6. Kwai
    if (links.kwai && links.kwai.trim()) {
      const kw = links.kwai.trim()
      channels.push({
        id: "kwai",
        name: "Kwai",
        label: kw.startsWith("@") ? kw : `@${kw}`,
        url: kw.startsWith("http") ? kw : `https://kwai.com/@${kw.replace(/^@/, "")}`,
        icon: <KwaiIcon className="w-3.5 h-3.5 shrink-0" />,
      })
    }

    // Retorna no máximo 3 canais principais para o perfil
    return channels.slice(0, 3)
  }, [store.social_links, store.phone, store.instagram])

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
      <div className="relative h-44 sm:h-56 w-full overflow-hidden md:hidden">
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
        <div className="max-w-xl flex flex-col gap-3.5 -mt-6 md:mt-0">
          {/* Nome da Loja */}
          <div className="flex flex-col">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1C251F] dark:text-[#F2EFE9] sm:text-4xl md:text-5xl">
              {store.name}
            </h1>
            <p className="mt-1 text-xs text-[#5D645E] dark:text-[#9CA79E] md:text-sm max-w-md leading-relaxed">
              {store.bio}
            </p>
          </div>

          {/* Status Row: Aberto agora | 25-35 min | Entrega grátis */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-medium text-[#4B534D] dark:text-[#9CA79E] pt-0.5">
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

          {/* Endereço */}
          <div className="flex items-center gap-1.5 text-xs text-[#6B736E] dark:text-[#9CA79E] md:text-sm">
            <button
              type="button"
              onClick={() => openModal("delivery-info")}
              className="flex items-center gap-1.5 hover:text-[#1A261D] dark:hover:text-[#F2EFE9] hover:underline transition cursor-pointer"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#6E7570] dark:text-[#9CA79E]" />
              <span className="truncate max-w-sm">{store.address}</span>
            </button>
          </div>

          {/* ============================================================== */}
          {/* REDES SOCIAIS OFICIAIS CLICÁVEIS (MÁXIMO 3)                   */}
          {/* ============================================================== */}
          {socialChannels.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {socialChannels.map((channel) => (
                <a
                  key={channel.id}
                  href={channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-[#1E2B22]/90 border border-[#E4DDD2] dark:border-[#2F4135] shadow-2xs hover:border-[#2E6B3E]/50 dark:hover:border-[#4ADE80]/50 hover:shadow-xs transition cursor-pointer text-xs font-semibold text-[#1C251F] dark:text-[#F2EFE9] backdrop-blur-xs"
                >
                  <span className="shrink-0">{channel.icon}</span>
                  <span className="truncate max-w-[150px] group-hover:underline">
                    {channel.label}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
