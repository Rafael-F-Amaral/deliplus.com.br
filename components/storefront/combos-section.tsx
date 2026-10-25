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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-2xl font-bold tracking-tight text-[#1A261D]">
          Combos da semana
        </h2>
        <button className="text-xs font-semibold text-[#CB5A3C] hover:underline md:text-sm">
          Ver tudo
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {combos.map((combo) => (
          <div
            key={combo.id}
            onClick={() => openProductDetail(combo)}
            className="group flex cursor-pointer items-center justify-between gap-3.5 rounded-2xl border border-[#ECE7DE] bg-white p-3.5 shadow-2xs transition hover:border-[#D8CFBE] hover:shadow-xs"
          >
            {/* Round Combo Image */}
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#F5F2EB]">
              <img
                src={combo.image_url}
                alt={combo.name}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate font-sans text-sm font-semibold text-[#1C261F]">
                {combo.name}
              </span>
              <span className="line-clamp-1 text-xs text-[#6B736E]">
                {combo.description}
              </span>

              <div className="mt-2 flex items-center gap-2">
                {combo.in_promo && combo.promo_price_cents ? (
                  <>
                    <span className="text-xs text-[#878E89] line-through">
                      {formatCurrency(combo.price_cents)}
                    </span>
                    <span className="text-sm font-bold text-[#1C261F]">
                      {formatCurrency(combo.promo_price_cents)}
                    </span>
                    {combo.discount_percentage && (
                      <span className="rounded bg-[#CB5A3C]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#CB5A3C]">
                        {combo.discount_percentage}% OFF
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-sm font-bold text-[#1C261F]">
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
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1B2A20] text-white shadow-xs transition group-hover:bg-[#283E30]"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
