"use client"

import React from "react"
import { Plus, Bike } from "lucide-react"
import { StorefrontProduct } from "@/types/storefront"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"

interface ProductCardProps {
  product: StorefrontProduct
}

export function ProductCard({ product }: ProductCardProps) {
  const { openProductDetail } = useStorefrontCart()

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  return (
    <div
      onClick={() => openProductDetail(product)}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D1D5DB] dark:hover:border-[#384D3E] hover:shadow-md md:p-4"
    >
      {/* Product Image */}
      <div className="relative mb-3 aspect-4/3 w-full overflow-hidden rounded-xl bg-[#F5F2EB] dark:bg-[#131A15]">
        <img
          src={product.image_url}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Info Content */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          {/* Title */}
          <h3 className="font-sans text-base sm:text-[17px] font-semibold text-[#111827] dark:text-[#F9FAFB] leading-snug transition-colors group-hover:text-[#2E6B3E] dark:group-hover:text-[#4ADE80]">
            {product.name}
          </h3>

          {/* Description */}
          <p className="mt-1.5 line-clamp-2 text-xs sm:text-[13px] leading-relaxed text-[#374151] dark:text-[#D1D5DB] font-normal">
            {product.description}
          </p>
        </div>

        {/* Price & Add Button */}
        <div className="mt-3.5 flex items-end justify-between pt-1">
          <div className="flex flex-col">
            {product.in_promo && product.promo_price_cents ? (
              <>
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 line-through">
                  {formatCurrency(product.price_cents)}
                </span>
                <span className="text-base sm:text-lg font-bold text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(product.promo_price_cents)}
                </span>
              </>
            ) : (
              <span className="text-base sm:text-lg font-bold text-[#111827] dark:text-[#F9FAFB]">
                {formatCurrency(product.price_cents)}
              </span>
            )}

            {product.free_delivery_eligible && (
              <span className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#166534] dark:text-[#4ADE80]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A] dark:bg-[#4ADE80] animate-pulse" />
                Entrega grátis acima de R$ 80
              </span>
            )}
          </div>

          {/* Plus Add Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              openProductDetail(product)
            }}
            aria-label={`Adicionar ${product.name}`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1B2A20] dark:bg-[#25382B] text-white dark:text-[#E2DDD5] shadow-xs transition duration-150 hover:scale-105 hover:bg-[#283E30] dark:hover:bg-[#324B3A] active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function MobileProductCard({ product }: ProductCardProps) {
  const { openProductDetail } = useStorefrontCart()

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  return (
    <div
      onClick={() => openProductDetail(product)}
      className="flex cursor-pointer items-center gap-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] p-3 transition hover:border-[#D1D5DB] dark:hover:border-[#384D3E]"
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#F5F2EB] dark:bg-[#131A15]">
        <img
          src={product.image_url}
          alt={product.name}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between overflow-hidden">
        <div>
          <h4 className="truncate text-base font-semibold text-[#111827] dark:text-[#F9FAFB]">
            {product.name}
          </h4>
          <p className="line-clamp-2 text-xs text-[#374151] dark:text-[#D1D5DB] font-normal leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="mt-1.5 flex items-center justify-between">
          <div>
            {product.in_promo && product.promo_price_cents ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 line-through">
                  {formatCurrency(product.price_cents)}
                </span>
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(product.promo_price_cents)}
                </span>
              </div>
            ) : (
              <span className="text-base font-bold text-[#111827] dark:text-[#F9FAFB]">
                {formatCurrency(product.price_cents)}
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              openProductDetail(product)
            }}
            aria-label={`Adicionar ${product.name}`}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1B2A20] dark:bg-[#25382B] text-white dark:text-[#E2DDD5] shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
