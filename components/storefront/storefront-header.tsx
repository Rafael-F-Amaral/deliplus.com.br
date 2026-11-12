"use client"

import React from "react"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import { ShoppingBag } from "lucide-react"
import { MerchantBackButton } from "./merchant-back-button"
import { StorefrontThemeToggle } from "./storefront-theme-toggle"
import { StorefrontImage } from "./storefront-image"

export function StorefrontHeader() {
  const { store, itemsCount, openModal } = useStorefrontCart()

  return (
    <header className="sticky top-0 z-40 w-full bg-[#1A2B1E] dark:bg-[#121B15] border-b border-[#2E6B3E]/60 dark:border-[#E76F41] text-white shadow-xs transition-colors">
      {/* Desktop Navigation */}
      <div className="mx-auto hidden h-14 max-w-7xl items-center justify-between gap-4 px-5 lg:px-6 md:flex">
        {/* Brand */}
        <div className="flex min-w-0 items-center gap-2.5">
          {store?.logo_url && (
            <StorefrontImage
              src={store.logo_url}
              alt={store.name || "Logo"}
              variant="logo"
              className="h-7 w-7 shrink-0 rounded-lg object-cover border border-white/20 shadow-xs"
              fallbackClassName="h-7 w-7 shrink-0 rounded-lg border border-white/20 bg-white/10 text-white/80"
              iconClassName="h-4 w-4"
            />
          )}
          <a
            href="#"
            className="flex min-h-9 min-w-0 items-center font-serif text-xl lg:text-[22px] short:text-lg font-bold tracking-tight text-white transition-opacity hover:opacity-90"
          >
            <span className="truncate">{store?.name || "Deliplus"}</span>
          </a>
        </div>

        {/* Right Actions: Tema + Voltar ao Dashboard + Carrinho */}
        <div className="flex shrink-0 items-center gap-3">
          <StorefrontThemeToggle />
          <MerchantBackButton />

          <button
            type="button"
            suppressHydrationWarning
            onClick={() => openModal("cart-drawer")}
            className="relative flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-[#FAF7F2] dark:bg-[#1E2B22] px-4 text-sm font-medium text-[#1A2B1E] dark:text-[#F2EFE9] border border-transparent dark:border-[#2A382E] transition hover:bg-[#F3ECE1] dark:hover:bg-[#25352A] after:content-[''] after:absolute after:-inset-1 [@media(pointer:fine)]:after:hidden"
          >
            <ShoppingBag suppressHydrationWarning className="h-4 w-4 text-[#1A2B1E] dark:text-[#4ADE80]" />
            <span suppressHydrationWarning>Carrinho</span>
            {itemsCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#B4482D] text-[11px] font-bold text-white shadow-xs">
                {itemsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Top Bar */}
      <div className="flex min-h-[56px] items-center justify-between gap-2 px-3 sm:px-4 py-1.5 md:hidden">
        <div className="flex flex-1 min-w-0 items-center gap-2.5">
          {store?.logo_url && (
            <StorefrontImage
              src={store.logo_url}
              alt={store.name || "Logo"}
              variant="logo"
              className="h-7 w-7 rounded-md object-cover border border-white/20 shadow-xs shrink-0"
              fallbackClassName="h-7 w-7 rounded-md border border-white/20 bg-white/10 text-white/80 shrink-0"
              iconClassName="h-4 w-4"
            />
          )}
          <a
            href="#"
            className="flex flex-1 min-w-0 min-h-9 items-center font-serif text-xl font-bold tracking-tight text-white"
          >
            <span className="truncate">{store?.name || "Deliplus"}</span>
          </a>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <StorefrontThemeToggle />
          <MerchantBackButton compact />

          <button
            type="button"
            suppressHydrationWarning
            onClick={() => openModal("cart-drawer")}
            className="relative flex min-h-11 min-w-11 items-center justify-center rounded-lg text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Carrinho"
          >
            <ShoppingBag suppressHydrationWarning className="h-5 w-5" />
            {itemsCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#B4482D] px-1 text-[10px] font-bold text-white">
                {itemsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
