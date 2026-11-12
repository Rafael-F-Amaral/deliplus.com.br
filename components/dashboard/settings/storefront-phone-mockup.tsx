"use client";

import React, { useState } from "react";
import { StorefrontPreviewData } from "@/app/dashboard/settings/types";
import {
  Clock,
  Bike,
  Sparkles,
  ExternalLink,
  Moon,
  Sun,
  ShieldCheck,
  ShoppingBag,
  Plus,
} from "lucide-react";
import { WhatsAppIcon, InstagramIcon } from "@/components/ui/social-icons";

export interface StorefrontPhoneMockupProps {
  data: StorefrontPreviewData;
  isDirty?: boolean;
}

export function StorefrontPhoneMockup({
  data,
  isDirty = false,
}: StorefrontPhoneMockupProps) {
  const [phoneTheme, setPhoneTheme] = useState<"light" | "dark">("light");
  const isPhoneDark = phoneTheme === "dark";
  const [mockCartCount, setMockCartCount] = useState(0);

  const bannerImg =
    data.bannerUrl ||
    "https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&w=800&q=80";

  const cleanWhatsapp = (data.whatsapp || "").replace(/\D/g, "");

  // Amostra de produtos para deixar a vitrine viva
  const sampleProducts = [
    {
      id: "p1",
      name: "Prato / Item Especial",
      desc: "Preparado artesanalmente com ingredientes nobres e frescos.",
      price: "R$ 49,90",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&w=200&q=80",
    },
    {
      id: "p2",
      name: "Combo da Casa",
      desc: "A combinação perfeita com acompanhamento e molho da casa.",
      price: "R$ 68,00",
      image:
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&w=200&q=80",
    },
    {
      id: "p3",
      name: "Bebida Gelada 350ml",
      desc: "Lata gelada para acompanhar o seu pedido com perfeição.",
      price: "R$ 8,00",
      image:
        "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&w=200&q=80",
    },
  ];

  return (
    <aside className="w-full max-w-[340px] sm:max-w-[380px] shrink-0 flex flex-col items-center">
      {/* Barra de Controles Superiores do Studio */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 px-3 py-2 mb-3 ultrashort:mb-2 bg-white dark:bg-[#1B241E] border border-[#E9E4D4] dark:border-[#2A382E] rounded-2xl shadow-xs text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-[#2E4233] dark:text-[#F2EFE9]">
            Live Studio
          </span>
          {isDirty && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              Modificado
            </span>
          )}
        </div>

        {/* Switcher de Tema no Celular */}
        <div className="flex items-center gap-1 bg-[#F5F1E6] dark:bg-[#233127] p-1 rounded-xl border border-[#E5DFD1] dark:border-[#2F4234]">
          <button
            type="button"
            onClick={() => setPhoneTheme("light")}
            aria-label="Visualizar vitrine no tema claro"
            aria-pressed={phoneTheme === "light"}
            className={`min-w-[36px] min-h-[36px] lg:min-w-[32px] lg:min-h-[32px] flex items-center justify-center p-1.5 rounded-lg transition-colors cursor-pointer ${
              phoneTheme === "light"
                ? "bg-white text-amber-700 shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Ver tema claro"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setPhoneTheme("dark")}
            aria-label="Visualizar vitrine no tema escuro"
            aria-pressed={phoneTheme === "dark"}
            className={`min-w-[36px] min-h-[36px] lg:min-w-[32px] lg:min-h-[32px] flex items-center justify-center p-1.5 rounded-lg transition-colors cursor-pointer ${
              phoneTheme === "dark"
                ? "bg-[#1E2721] text-amber-400 shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Ver tema escuro"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* CHASSI DO IPHONE 15 PRO — responsivo em largura (320px+) e altura (720px/landscape) */}
      <div className="relative w-full max-w-[340px] h-[clamp(280px,calc(100dvh-215px),690px)] short:rounded-[38px] rounded-[42px] sm:rounded-[48px] border-[8px] sm:border-[10px] border-[#1C261F] shadow-2xl ring-1 ring-black/10 overflow-hidden bg-[#1C261F] flex flex-col select-none">
        {/* Dynamic Island */}
        <div className="absolute top-2.5 inset-x-0 z-50 flex justify-center pointer-events-none">
          <div className="w-24 h-5 bg-black rounded-full flex items-center justify-between px-2.5 shadow-xs">
            <div className="w-2 h-2 rounded-full bg-neutral-900 border border-neutral-800" />
            <div className="w-2 h-2 rounded-full bg-[#102030]" />
          </div>
        </div>

        {/* Status Bar do iOS */}
        <div
          className={`h-9 px-6 pt-1.5 flex items-center justify-between text-[11px] font-semibold shrink-0 z-40 transition-colors ${
            isPhoneDark ? "bg-[#131A15] text-white" : "bg-[#FAF8F5] text-black"
          }`}
        >
          <span>9:41</span>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span>5G</span>
            <div className="w-4 h-2 rounded-xs border border-current flex items-center p-0.5">
              <div className="h-full w-full bg-current rounded-2xs" />
            </div>
          </div>
        </div>

        {/* Mini Safari Address Bar */}
        <div
          className={`px-3 py-1.5 shrink-0 z-40 border-b ${
            phoneTheme === "dark"
              ? "bg-[#131A15] border-[#2A382E] text-white"
              : "bg-[#FAF8F5] border-[#EAE4D7] text-neutral-800"
          }`}
        >
          <div
            className={`flex items-center justify-between px-2.5 py-1 rounded-lg text-[10px] font-mono border ${
              phoneTheme === "dark"
                ? "bg-[#1B241E] border-[#2A382E] text-[#9CA79E]"
                : "bg-white border-[#E5DFD3] text-neutral-600 shadow-2xs"
            }`}
          >
            <div className="flex items-center gap-1 truncate">
              <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
              <span className="truncate">
                deliplus.com.br/{data.slug || "sua-loja"}
              </span>
            </div>
            <a
              href={`/${data.slug || ""}`}
              target="_blank"
              rel="noreferrer"
              className={`relative shrink-0 ml-1 min-w-4 min-h-4 inline-flex items-center justify-center transition-colors after:content-[''] after:absolute after:-inset-2.5 lg:after:hidden ${
                isPhoneDark
                  ? "text-[#9CA79E] hover:text-[#F2EFE9]"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
              title="Abrir em nova aba"
            >
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>

        {/* TELA INTERNA DO CELULAR (EXCLUSIVAMENTE REGIDA POR phoneTheme) */}
        <div
          className={`relative flex-1 overflow-y-auto no-scrollbar pb-8 transition-colors ${
            isPhoneDark ? "bg-[#131A15] text-[#F2EFE9]" : "bg-[#FAF8F5] text-[#1A241E]"
          }`}
        >
          {/* BANNER DA VITRINE */}
          <div
            className={`relative h-32 w-full overflow-hidden shrink-0 ${
              isPhoneDark ? "bg-neutral-800" : "bg-neutral-200"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bannerImg}
              alt={data.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* Header Flutuante do Celular com Carrinho Mock */}
            <div className="absolute top-2 right-2 z-10">
              <div className="relative p-1.5 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20 shadow-xs">
                <ShoppingBag className="w-3.5 h-3.5" />
                {mockCartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#CB5A3C] text-[9px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center">
                    {mockCartCount}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* AVATAR DA LOGO + INFOS DA LOJA */}
          <div className="px-3.5 -mt-8 relative z-10 flex flex-col gap-2">
            <div className="flex items-end justify-between">
              {/* Logo Flutuante 56px */}
              <div
                className={`h-14 w-14 rounded-2xl overflow-hidden border-2 shadow-md shrink-0 flex items-center justify-center ${
                  isPhoneDark
                    ? "border-[#1E2B22] bg-[#1B241E]"
                    : "border-white bg-white"
                }`}
              >
                {data.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.logoUrl}
                    alt={data.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span
                    className={`font-serif font-bold text-lg ${
                      isPhoneDark ? "text-[#E76F41]" : "text-[#2E4233]"
                    }`}
                  >
                    {(data.name || "D").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Status Pill */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  data.isOpen
                    ? isPhoneDark
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                    : isPhoneDark
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-amber-500/10 text-amber-700 border-amber-500/20"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    data.isOpen ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`}
                />
                {data.isOpen ? "Aberto agora" : "Fechado"}
              </span>
            </div>

            {/* Nome e Segmento */}
            <div>
              <div className="flex items-center gap-1.5">
                <h1
                  className={`font-serif text-base font-bold tracking-tight leading-snug line-clamp-1 ${
                    isPhoneDark ? "text-[#F2EFE9]" : "text-[#1A241E]"
                  }`}
                >
                  {data.name || "Nome da Sua Loja"}
                </h1>
              </div>
              <p
                className={`text-[10px] font-medium ${
                  isPhoneDark ? "text-[#9CA79E]" : "text-[#5A655D]"
                }`}
              >
                {data.category || "Restaurante"}
              </p>
            </div>

            {/* Bio Curta */}
            {data.bio && (
              <p
                className={`text-[11px] leading-relaxed line-clamp-2 ${
                  isPhoneDark ? "text-[#9CA79E]" : "text-[#5A655D]"
                }`}
              >
                {data.bio}
              </p>
            )}

            {/* Badges de Operação (Tempo e Taxa) */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${
                  isPhoneDark
                    ? "bg-white/5 border-white/10 text-[#9CA79E]"
                    : "bg-black/5 border-black/5 text-[#5A655D]"
                }`}
              >
                <Clock className="w-2.5 h-2.5 shrink-0" />
                <span>
                  {data.prepTimeMin}–{data.prepTimeMax} min
                </span>
              </span>

              {data.acceptsDelivery && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${
                    isPhoneDark
                      ? "bg-white/5 border-white/10 text-[#9CA79E]"
                      : "bg-black/5 border-black/5 text-[#5A655D]"
                  }`}
                >
                  <Bike className="w-2.5 h-2.5 shrink-0" />
                  <span>
                    {data.deliveryFeeCents > 0
                      ? `R$ ${(data.deliveryFeeCents / 100).toFixed(2).replace(".", ",")}`
                      : "Entrega Grátis"}
                  </span>
                </span>
              )}

              {data.freeDeliveryAboveCents && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold border ${
                    isPhoneDark
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                  }`}
                >
                  <Sparkles className="w-2.5 h-2.5 shrink-0" />
                  Frete grátis +R${" "}
                  {(data.freeDeliveryAboveCents / 100).toFixed(0)}
                </span>
              )}
            </div>

            {/* Canais Oficiais de Contato */}
            {(cleanWhatsapp || data.instagram) && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {cleanWhatsapp && (
                  <a
                    href={`https://wa.me/55${cleanWhatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="relative flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-[10px] font-semibold shadow-2xs transition-colors after:content-[''] after:absolute after:-inset-y-2 after:inset-x-0 lg:after:hidden"
                  >
                    <WhatsAppIcon className="w-3 h-3 shrink-0" />
                    <span>WhatsApp</span>
                  </a>
                )}
                {data.instagram && (
                  <a
                    href={`https://instagram.com/${data.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`relative min-w-[36px] flex items-center justify-center gap-1 py-1 px-2.5 rounded-lg border text-[10px] font-medium transition-colors max-w-full after:content-[''] after:absolute after:-inset-y-2 after:inset-x-0 lg:after:hidden ${
                      isPhoneDark
                        ? "bg-white/5 border-white/10 hover:bg-white/10 text-[#F2EFE9]"
                        : "bg-black/5 border-black/10 hover:bg-black/10 text-[#1A241E]"
                    }`}
                  >
                    <InstagramIcon className="w-3 h-3 shrink-0" />
                    <span className="truncate">@{data.instagram.replace("@", "")}</span>
                  </a>
                )}
              </div>
            )}

            {/* SEPARADOR DO CARDÁPIO */}
            <div
              className={`pt-2 border-t mt-1 ${
                isPhoneDark ? "border-white/5" : "border-black/5"
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  isPhoneDark ? "text-[#9CA79E]/80" : "text-[#5A655D]/80"
                }`}
              >
                Cardápio em Destaque
              </span>
            </div>

            {/* PRODUTOS MOCKADOS INTERATIVOS */}
            <div className="space-y-2 pt-1">
              {sampleProducts.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2 rounded-xl border shadow-2xs gap-2 ${
                    isPhoneDark
                      ? "bg-[#1B241E] border-white/10"
                      : "bg-white border-black/5"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-11 h-11 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p
                        className={`text-[11px] font-semibold truncate leading-tight ${
                          isPhoneDark ? "text-[#F2EFE9]" : "text-[#1A241E]"
                        }`}
                      >
                        {p.name}
                      </p>
                      <p
                        className={`text-[9px] truncate leading-tight ${
                          isPhoneDark ? "text-[#9CA79E]" : "text-[#5A655D]"
                        }`}
                      >
                        {p.desc}
                      </p>
                      <p
                        className={`text-[10px] font-bold pt-0.5 ${
                          isPhoneDark ? "text-[#FF7D4F]" : "text-[#CB5A3C]"
                        }`}
                      >
                        {p.price}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMockCartCount((prev) => prev + 1)}
                    aria-label={`Adicionar amostra ${p.name} ao carrinho`}
                    className={`relative p-1 rounded-lg transition-colors shrink-0 cursor-pointer after:content-[''] after:absolute after:-inset-2 lg:after:hidden ${
                      isPhoneDark
                        ? "bg-[#25332A] text-[#E76F41] hover:bg-[#2F4235]"
                        : "bg-[#FAF8F0] text-[#2E4233] hover:bg-[#E9E4D4]"
                    }`}
                    title="Adicionar amostra ao carrinho"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* AVISO SE LOJA ESTIVER FECHADA */}
            {!data.isOpen && (
              <div
                className={`p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center mt-2 ${
                  isPhoneDark ? "text-amber-300" : "text-amber-800"
                }`}
              >
                <p className="text-[11px] font-bold">Loja Fechada no Momento</p>
                <p
                  className={`text-[9px] ${
                    isPhoneDark ? "text-amber-300/80" : "text-amber-700/80"
                  }`}
                >
                  Novos pedidos não serão recebidos até a reabertura.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Home Indicator Bar do iOS */}
        <div
          className={`w-28 h-1 rounded-full mx-auto absolute bottom-1.5 inset-x-0 pointer-events-none z-50 opacity-60 ${
            isPhoneDark ? "bg-neutral-600" : "bg-neutral-400"
          }`}
        />
      </div>
    </aside>
  );
}
