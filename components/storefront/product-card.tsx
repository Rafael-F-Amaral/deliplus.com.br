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
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#ECE7DE] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D5CDBD] dark:hover:border-[#384D3E] hover:shadow-md md:p-4"
    >
      {/* Product Image */}
      <div className="relative mb-3 aspect-4/3 w-full overflow-hidden rounded-xl bg-[#F5F2EB] dark:bg-[#131A15]">
        <img
          src={product.image_url}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {product.in_promo && product.discount_percentage && (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-[#CB5A3C] px-2 py-0.5 text-[11px] font-bold text-white shadow-xs">
            {product.discount_percentage}% OFF
          </span>
        )}

        {product.tags && product.tags.length > 0 && !product.in_promo && (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-white/90 dark:bg-[#1B241E]/90 px-2 py-0.5 text-[11px] font-medium text-[#2E3630] dark:text-[#E2DDD5] shadow-xs backdrop-blur-xs">
            {product.tags[0]}
          </span>
        )}
      </div>

      {/* Info Content */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          {/* Title */}
          <h3 className="font-sans text-base font-semibold text-[#1C261F] dark:text-[#F2EFE9] transition-colors group-hover:text-[#2A4733] dark:group-hover:text-[#4ADE80]">
            {product.name}
          </h3>

          {/* Description */}
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#6B736E] dark:text-[#9CA79E]">
            {product.description}
          </p>
        </div>

        {/* Price & Add Button */}
        <div className="mt-3.5 flex items-end justify-between pt-1">
          <div className="flex flex-col">
            {product.in_promo && product.promo_price_cents ? (
              <>
                <span className="text-[11px] text-[#878E89] dark:text-[#7A867E] line-through">
                  {formatCurrency(product.price_cents)}
                </span>
                <span className="text-base font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                  {formatCurrency(product.promo_price_cents)}
                </span>
              </>
            ) : (
              <span className="text-base font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                {formatCurrency(product.price_cents)}
              </span>
            )}

            {product.free_delivery_eligible && (
              <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[#2E6B3E] dark:text-[#4ADE80]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#35A852] dark:bg-[#4ADE80]" />
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
      className="flex cursor-pointer items-center gap-3.5 rounded-xl border border-[#ECE7DE] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] p-3 transition hover:border-[#D5CDBD] dark:hover:border-[#384D3E]"
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#F5F2EB] dark:bg-[#131A15]">
        <img
          src={product.image_url}
          alt={product.name}
          className="h-full w-full object-cover"
        />
        {product.in_promo && product.discount_percentage && (
          <span className="absolute left-1 top-1 rounded bg-[#CB5A3C] px-1 py-0.5 text-[9px] font-bold text-white">
            {product.discount_percentage}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between overflow-hidden">
        <div>
          <h4 className="truncate text-sm font-semibold text-[#1C261F] dark:text-[#F2EFE9]">
            {product.name}
          </h4>
          <p className="line-clamp-2 text-[11px] text-[#6B736E] dark:text-[#9CA79E]">
            {product.description}
          </p>
        </div>

        <div className="mt-1.5 flex items-center justify-between">
          <div>
            {product.in_promo && product.promo_price_cents ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] text-[#878E89] dark:text-[#7A867E] line-through">
                  {formatCurrency(product.price_cents)}
                </span>
                <span className="text-sm font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                  {formatCurrency(product.promo_price_cents)}
                </span>
              </div>
            ) : (
              <span className="text-sm font-bold text-[#1C261F] dark:text-[#F2EFE9]">
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
