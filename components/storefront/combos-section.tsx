"use client"

import React from "react"
import { Plus } from "lucide-react"
import { StorefrontProduct } from "@/types/storefront"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"

interface CombosSectionProps {
  combos: StorefrontProduct[]
}

export function CombosSection({ combos }: CombosSectionProps) {
  const { openProductDetail } = useStorefrontCart()

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  return (
    <section className="my-8">
      <div className="mb-4">
        <h2 className="font-serif text-2xl font-bold tracking-tight text-[#1A261D] dark:text-[#F2EFE9]">
          Combos da semana
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {combos.map((combo) => (
          <div
            key={combo.id}
            onClick={() => openProductDetail(combo)}
            className="group flex cursor-pointer items-center justify-between gap-3.5 rounded-2xl border border-[#ECE7DE] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] p-3.5 shadow-2xs transition hover:border-[#D8CFBE] dark:hover:border-[#384D3E] hover:shadow-xs"
          >
            {/* Round Combo Image */}
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#F5F2EB] dark:bg-[#131A15]">
              <img
                src={combo.image_url}
                alt={combo.name}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate font-sans text-sm sm:text-base font-bold text-[#111827] dark:text-[#F9FAFB]">
                {combo.name}
              </span>
              <span className="line-clamp-1 text-xs text-[#374151] dark:text-[#D1D5DB] font-medium">
                {combo.description}
              </span>

              <div className="mt-2 flex items-center gap-2">
                {combo.in_promo && combo.promo_price_cents ? (
                  <>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 line-through">
                      {formatCurrency(combo.price_cents)}
                    </span>
                    <span className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(combo.promo_price_cents)}
                    </span>
                  </>
                ) : (
                  <span className="text-sm sm:text-base font-black text-[#111827] dark:text-[#F9FAFB]">
                    {formatCurrency(combo.price_cents)}
                  </span>
                )}
              </div>
            </div>

            {/* Add Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                openProductDetail(combo)
              }}
              aria-label={`Adicionar ${combo.name}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1B2A20] dark:bg-[#2E4233] text-white shadow-xs transition group-hover:bg-[#283E30] dark:group-hover:bg-[#384F3E]"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
