"use client"

import React from "react"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import { ShoppingBag } from "lucide-react"

export function MobileCartBar() {
  const { itemsCount, totalCents, openModal, store } =
    useStorefrontCart()

  if (itemsCount === 0) return null

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  return (
    <aside
      aria-label="Resumo do carrinho flutuante"
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 z-40 lg:hidden"
    >
      <button
        type="button"
        suppressHydrationWarning
        onClick={() => openModal("cart-drawer")}
        className="flex w-full items-center justify-between gap-2 rounded-2xl bg-[#B4482D] hover:bg-[#9D3D25] p-3.5 text-white shadow-xl transition-all duration-200 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div suppressHydrationWarning className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <ShoppingBag suppressHydrationWarning className="h-5 w-5 text-white" />
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-white text-[11px] font-bold text-[#B4482D] shadow-xs">
              {itemsCount}
            </span>
          </div>

          <div className="min-w-0 text-left">
            <span className="block truncate text-sm font-bold">Ver sacola ({itemsCount})</span>
            <p className="truncate text-[11px] text-white/95">
              {store?.free_delivery_above_cents
                ? `Entrega grátis acima de R$ ${(store.free_delivery_above_cents / 100).toFixed(0)}`
                : "Toque para revisar seus itens"}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <span className="text-base font-bold">
            {formatCurrency(totalCents)}
          </span>
        </div>
      </button>
    </aside>
  )
}
