"use client"

import React from "react"
import { StorefrontStore } from "@/types/storefront"

export function StoreClosedScreen({ store }: { store: StorefrontStore }) {
  return (
    <div className="min-h-dvh bg-[#FAF8F5] dark:bg-[#131A15] text-[#1C261F] dark:text-[#F2EFE9] flex flex-col justify-between pt-safe pb-safe selection:bg-[#B4482D]/20">
      {/* Top Bar matching DeliPlus Brand */}
      <header className="border-b border-[#2E6B3E] dark:border-[#E76F41] bg-[#1B2A20] px-4 py-3 md:px-8 text-white shrink-0">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="font-serif text-2xl font-bold tracking-tight text-[#F7F4EE]">
              {store?.name || "Deliplus"}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-red-500/20 border border-red-400/40 px-3 py-1 text-xs text-red-100 font-semibold">
            <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
            <span>Loja temporariamente fechada</span>
          </div>
        </div>
      </header>

      {/* Main Hero Visual: Imagem em destaque sem caixas ou fundo vazando */}
      <main className="flex-1 w-full flex items-center justify-center overflow-hidden p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/deli-aviso-final.svg"
          alt="Loja fechada temporariamente"
          className="w-full h-auto max-h-[calc(100dvh-130px)] object-contain select-none"
        />
      </main>

      {/* Footer colado na base sem espaço ocioso */}
      <footer className="border-t border-[#2E6B3E] dark:border-[#E76F41] bg-white dark:bg-[#1B241E] py-3 px-4 text-center text-xs text-[#59615B] dark:text-[#9CA79E] shrink-0">
        <p>© 2026 Deliplus. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
