"use client"

import React from "react"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import { ShoppingBag } from "lucide-react"

export function MobileCartBar() {
  const { itemsCount, totalCents, proceedToCheckout, store } =
    useStorefrontCart()

  if (itemsCount === 0) return null

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  return (
    <aside aria-label="Resumo do carrinho flutuante" className="fixed bottom-4 left-4 right-4 z-40 md:hidden">
      <button
        onClick={proceedToCheckout}
        className="flex w-full items-center justify-between rounded-2xl bg-[#CB5A3C] p-3.5 text-white shadow-xl transition-all duration-200 active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <ShoppingBag className="h-5 w-5 text-white" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-[#CB5A3C] shadow-xs">
              {itemsCount}
            </span>
          </div>

          <div className="text-left">
            <span className="text-sm font-bold">Ver carrinho</span>
            <p className="text-[11px] text-white/80">
              Entrega grátis acima de R$ 80
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-base font-bold">
            {formatCurrency(totalCents)}
          </span>
        </div>
      </button>
    </aside>
  )
}
