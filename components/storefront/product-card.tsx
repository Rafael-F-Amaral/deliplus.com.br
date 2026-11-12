"use client"

import React from "react"
import { Plus, Bike } from "lucide-react"
import { StorefrontProduct } from "@/types/storefront"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import { normalizeSearch } from "@/lib/utils"
import { StorefrontImage } from "./storefront-image"

interface ProductCardProps {
  product: StorefrontProduct
}

export function ProductCard({ product }: ProductCardProps) {
  const { openProductDetail, addToCart, store } = useStorefrontCart()

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  const hasOptions = Boolean(
    product.sizes?.length ||
    product.complements?.length ||
    product.portions?.length ||
    product.proteins?.length ||
    product.removable_ingredients?.length
  )

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasOptions) {
      openProductDetail(product)
    } else {
      addToCart({
        product_id: product.id,
        name: product.name,
        unit_price_cents: product.promo_price_cents || product.price_cents,
        quantity: 1,
        image_url: product.image_url,
      })
    }
  }

  const isDrink = normalizeSearch(product.category_name || "").includes("bebid")

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] p-3 md:p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D1D5DB] dark:hover:border-[#384D3E] hover:shadow-md has-focus-visible:ring-2 has-focus-visible:ring-[#B4482D]">
      {/* Product Image */}
      <div className="relative mb-2.5 aspect-4/3 short:lg:aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#F5F2EB] dark:bg-[#131A15]">
        <StorefrontImage
          src={product.image_url}
          alt={product.name}
          variant={isDrink ? "drink" : "food"}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          fallbackClassName="h-full w-full"
          iconClassName="h-8 w-8"
          loading="lazy"
        />
      </div>

      {/* Info Content */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          {/* Title */}
          <h3 className="font-sans text-sm sm:text-[15px] font-semibold text-[#111827] dark:text-[#F9FAFB] leading-snug transition-colors group-hover:text-[#2E6B3E] dark:group-hover:text-[#4ADE80]">
            <button
              type="button"
              onClick={() => openProductDetail(product)}
              className="flex min-h-9 w-full items-start pt-0.5 text-left cursor-pointer focus:outline-none after:absolute after:inset-0 after:z-0"
            >
              {product.name}
            </button>
          </h3>

          {/* Description */}
          <p className="mt-1 line-clamp-2 text-xs leading-snug text-[#374151] dark:text-[#D1D5DB] font-normal">
            {product.description}
          </p>
        </div>

        {/* Price & Add Button */}
        <div className="mt-2.5 flex items-end justify-between gap-2 pt-1">
          <div className="flex flex-col min-w-0">
            {product.in_promo && product.promo_price_cents ? (
              <>
                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 line-through">
                  {formatCurrency(product.price_cents)}
                </span>
                <span className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(product.promo_price_cents)}
                </span>
              </>
            ) : (
              <span className="text-sm sm:text-base font-bold text-[#111827] dark:text-[#F9FAFB]">
                {formatCurrency(product.price_cents)}
              </span>
            )}

            {product.free_delivery_eligible && (
              <span className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#166534] dark:text-[#4ADE80]">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#16A34A] dark:bg-[#4ADE80] animate-pulse" />
                {store?.free_delivery_above_cents
                  ? `Entrega grátis acima de R$ ${(store.free_delivery_above_cents / 100).toFixed(0)}`
                  : "Entrega grátis"}
              </span>
            )}
          </div>

          {/* Plus Add Button (Quick Add para itens simples) */}
          <button
            type="button"
            onClick={handlePlusClick}
            aria-label={`Adicionar ${product.name}`}
            className="relative z-10 flex min-h-9 min-w-9 h-9 w-9 items-center justify-center rounded-full bg-[#1B2A20] dark:bg-[#25382B] text-white dark:text-[#E2DDD5] shadow-xs transition duration-150 hover:scale-105 hover:bg-[#283E30] dark:hover:bg-[#324B3A] active:scale-95 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4482D] focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
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

  const isDrink = normalizeSearch(product.category_name || "").includes("bebid")

  return (
    <article className="group relative flex items-center gap-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] p-3 transition hover:border-[#D1D5DB] dark:hover:border-[#384D3E] has-focus-visible:ring-2 has-focus-visible:ring-[#B4482D]">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#F5F2EB] dark:bg-[#131A15]">
        <StorefrontImage
          src={product.image_url}
          alt={product.name}
          variant={isDrink ? "drink" : "food"}
          className="h-full w-full object-cover"
          fallbackClassName="h-full w-full"
          iconClassName="h-6 w-6"
          loading="lazy"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <h4 className="min-w-0 text-base font-semibold text-[#111827] dark:text-[#F9FAFB]">
            <button
              type="button"
              onClick={() => openProductDetail(product)}
              className="flex min-h-9 w-full items-center text-left cursor-pointer focus:outline-none after:absolute after:inset-0 after:z-0"
            >
              <span className="truncate">{product.name}</span>
            </button>
          </h4>
          <p className="line-clamp-2 text-xs text-[#374151] dark:text-[#D1D5DB] font-normal leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-2">
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
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              openProductDetail(product)
            }}
            aria-label={`Adicionar ${product.name}`}
            className="relative z-10 flex min-h-9 min-w-9 h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1B2A20] dark:bg-[#25382B] text-white dark:text-[#E2DDD5] shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4482D] focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  )
}
