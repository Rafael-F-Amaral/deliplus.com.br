"use client"

import React from "react"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import { ShoppingBag } from "lucide-react"
import { MerchantBackButton } from "./merchant-back-button"
import { StorefrontThemeToggle } from "./storefront-theme-toggle"

export function StorefrontHeader() {
  const { itemsCount, openModal } = useStorefrontCart()

  return (
    <header className="sticky top-0 z-40 w-full bg-[#1A2B1E] dark:bg-[#121B15] border-b border-[#2E6B3E]/60 dark:border-[#E76F41] text-white shadow-xs transition-colors">
      {/* Desktop Navigation */}
      <div className="mx-auto hidden max-w-7xl items-center justify-between px-6 py-3.5 md:flex">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <a
            href="#"
            className="font-serif text-2xl font-bold tracking-tight text-white transition-opacity hover:opacity-90"
          >
            Deliplus
          </a>
        </div>

        {/* Right Actions: Tema + Voltar ao Dashboard + Carrinho */}
        <div className="flex items-center gap-3">
          <StorefrontThemeToggle />
          <MerchantBackButton />

          <button
            onClick={() => openModal("cart-drawer")}
            className="relative flex cursor-pointer items-center gap-2 rounded-lg bg-[#FAF7F2] dark:bg-[#1E2B22] px-4 py-2 text-sm font-medium text-[#1A2B1E] dark:text-[#F2EFE9] border border-transparent dark:border-[#2A382E] transition hover:bg-[#F3ECE1] dark:hover:bg-[#25352A]"
          >
            <ShoppingBag className="h-4 w-4 text-[#1A2B1E] dark:text-[#4ADE80]" />
            <span>Carrinho</span>
            {itemsCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#CB5A3C] text-[11px] font-bold text-white shadow-xs">
                {itemsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 md:hidden">
        <a
          href="#"
          className="font-serif text-2xl font-bold tracking-tight text-white"
        >
          Deliplus
        </a>

        <div className="flex items-center gap-2">
          <StorefrontThemeToggle />
          <MerchantBackButton compact />

          <button
            onClick={() => openModal("cart-drawer")}
            className="relative rounded p-1.5 text-white hover:bg-white/10"
            aria-label="Carrinho"
          >
            <ShoppingBag className="h-5 w-5" />
            {itemsCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#CB5A3C] text-[10px] font-bold text-white">
                {itemsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
