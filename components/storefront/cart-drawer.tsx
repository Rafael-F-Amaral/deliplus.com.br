"use client"

import React, { useState } from "react"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Tag,
} from "lucide-react"

export function CartDrawer() {
  const {
    activeModal,
    closeModal,
    items,
    updateQuantity,
    removeItem,
    subtotalCents,
    deliveryFeeCents,
    discountCents,
    totalCents,
    appliedCoupon,
    applyCoupon,
    proceedToCheckout,
  } = useStorefrontCart()

  const [couponInput, setCouponInput] = useState(appliedCoupon || "")
  const [couponMsg, setCouponMsg] = useState("")

  if (activeModal !== "cart-drawer") return null

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponInput) return
    const res = applyCoupon(couponInput)
    setCouponMsg(res.message)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="flex h-full w-full max-w-md flex-col bg-white dark:bg-[#17211A] text-[#1C261F] dark:text-[#F2EFE9] border-l border-transparent dark:border-[#2A382E] shadow-2xl transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2E6B3E]/40 dark:border-[#E76F41]/60 p-5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#1B2A20] dark:text-[#4ADE80]" />
            <h2 className="font-serif text-lg font-bold text-[#1C261F] dark:text-[#F2EFE9]">
              Sua Sacola ({items.length})
            </h2>
          </div>
          <button
            onClick={closeModal}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#5D645E] dark:text-[#9CA79E] hover:bg-[#F4EFE6] dark:hover:bg-[#25332A] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag className="h-12 w-12 text-[#C5BEB3] dark:text-[#3B4D40]" />
              <h3 className="mt-3 font-serif text-base font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                Sua sacola está vazia
              </h3>
              <p className="mt-1 text-xs text-[#7F8681] dark:text-[#9CA79E]">
                Explore nosso cardápio e adicione seus pratos favoritos!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#ECE7DE] dark:divide-[#2A382E]">
              {items.map((item) => (
                <div key={item.id} className="py-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    />
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-start justify-between">
                        <span className="truncate text-sm font-semibold text-[#1C261F] dark:text-[#F2EFE9]">
                          {item.name}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="ml-2 text-[#99A09A] dark:text-[#7A887E] hover:text-[#CB5A3C] dark:hover:text-[#FF7D4F] cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Portions / Proteins / Customizations */}
                      {(item.portion || item.protein || item.removed_ingredients?.length || item.selected_complements?.length || item.notes) && (
                        <div className="mt-1 space-y-0.5 text-[11px] text-[#78807A] dark:text-[#9CA79E]">
                          {item.portion && <span>• {item.portion}</span>}
                          {item.protein && <span> • {item.protein}</span>}
                          {item.removed_ingredients?.map((r) => (
                            <span key={r} className="block">• {r}</span>
                          ))}
                          {item.selected_complements?.map((c) => (
                            <span key={c.id} className="block">• {c.name}</span>
                          ))}
                          {item.notes && <span className="block">• Obs: {item.notes}</span>}
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                          {formatCurrency(item.unit_price_cents * item.quantity)}
                        </span>

                        <div className="flex items-center gap-2 rounded-lg border border-[#DED7CB] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#1E2B22] px-2 py-0.5 text-xs">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="text-[#68706A] dark:text-[#9CA79E] hover:text-black dark:hover:text-white cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="text-[#68706A] dark:text-[#9CA79E] hover:text-black dark:hover:text-white cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Calculations & CTA */}
        {items.length > 0 && (
          <div className="border-t border-[#2E6B3E]/40 dark:border-[#E76F41]/60 bg-[#FAF8F5] dark:bg-[#141C16] p-5">
            {/* Coupon form */}
            <form onSubmit={handleCouponSubmit} className="mb-4 flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7F8681] dark:text-[#9CA79E]" />
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Cupom de desconto"
                  className="w-full rounded-xl border border-[#DED7CB] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] py-2 pl-8 pr-3 text-xs text-[#1F2921] dark:text-[#F2EFE9] placeholder-[#7F8681] dark:placeholder-[#6C7870] outline-hidden focus:border-[#1B2A20] dark:focus:border-[#4ADE80]"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl border border-[#DED7CB] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] px-3 py-2 text-xs font-bold text-[#1F2921] dark:text-[#F2EFE9] hover:bg-[#F0ECE3] dark:hover:bg-[#25332A] cursor-pointer"
              >
                Aplicar
              </button>
            </form>
            {couponMsg && (
              <p className="mb-3 text-xs text-[#2E6B3E] dark:text-[#4ADE80] font-medium">
                {couponMsg}
              </p>
            )}

            <div className="space-y-1.5 text-xs text-[#68706A] dark:text-[#9CA79E]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotalCents)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxa de entrega</span>
                <span>
                  {deliveryFeeCents === 0 ? "Grátis" : formatCurrency(deliveryFeeCents)}
                </span>
              </div>
              {discountCents > 0 && (
                <div className="flex justify-between text-[#2E6B3E] dark:text-[#4ADE80] font-medium">
                  <span>Desconto</span>
                  <span>- {formatCurrency(discountCents)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#ECE7DE] dark:border-[#2A382E] pt-2 text-base font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                <span>Total</span>
                <span>{formatCurrency(totalCents)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                proceedToCheckout()
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#CB5A3C] py-3.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#B54A2E] cursor-pointer"
            >
              <span>Finalizar pedido</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
