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
  const [couponMsg, setCouponMsg] = useState(
    appliedCoupon ? `Cupom ${appliedCoupon} ativo!` : ""
  )
  const [couponStatus, setCouponStatus] = useState<"idle" | "success" | "error">(
    appliedCoupon ? "success" : "idle"
  )

  if (activeModal !== "cart-drawer") return null

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponInput.trim()) return
    const res = applyCoupon(couponInput)
    setCouponMsg(res.message)
    setCouponStatus(res.success ? "success" : "error")
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="flex h-full w-full max-w-md flex-col bg-white dark:bg-[#17211A] text-[#1C261F] dark:text-[#F2EFE9] border-l border-transparent dark:border-[#2A382E] shadow-2xl transition-colors">
        {/* Header - "Sua sacola" em laranja da logo, sem ícone e sem contador conforme solicitado */}
        <div className="flex items-center justify-between border-b border-[#2E6B3E]/40 dark:border-[#E76F41]/60 p-5">
          <h2 className="font-serif text-xl font-bold text-[#CB5A3C] dark:text-[#FF7D4F]">
            Sua Sacola
          </h2>
          <button
            onClick={closeModal}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#5D645E] dark:text-[#9CA79E] hover:bg-[#F4EFE6] dark:hover:bg-[#25332A] cursor-pointer"
            aria-label="Fechar sacola"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag className="h-12 w-12 text-[#C5BEB3] dark:text-[#3B4D40]" />
              <h3 className="mt-3 font-serif text-base font-semibold text-[#1C261F] dark:text-[#F2EFE9]">
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
                      className="h-16 w-16 shrink-0 rounded-xl object-cover border border-[#ECE7DE] dark:border-[#2A382E]"
                    />
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-start justify-between">
                        <span className="truncate text-sm font-semibold text-[#1C261F] dark:text-[#F2EFE9]">
                          {item.name}
                        </span>
                        {/* Lixinho em vermelho */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors cursor-pointer"
                          title="Remover item"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>

                      {/* Portions / Proteins / Customizations / Complements */}
                      {(item.portion || item.protein || (item.removed_ingredients && item.removed_ingredients.length > 0) || (item.selected_complements && item.selected_complements.length > 0) || item.notes) && (
                        <div className="mt-1 space-y-1 text-[11px] text-[#78807A] dark:text-[#9CA79E]">
                          {/* Prato Base / Especificações */}
                          {(item.portion || item.protein || (item.removed_ingredients && item.removed_ingredients.length > 0)) && (
                            <div className="space-y-0.5">
                              {item.portion && <span className="block">• Tamanho: {item.portion}</span>}
                              {item.protein && <span className="block">• Proteína: {item.protein}</span>}
                              {item.removed_ingredients?.map((r) => (
                                <span key={r} className="block">• Sem: {r}</span>
                              ))}
                            </div>
                          )}

                          {/* Adicionais e Opcionais Discriminados */}
                          {item.selected_complements && item.selected_complements.length > 0 && (
                            <div className="pt-1 border-t border-dashed border-[#ECE7DE] dark:border-[#2A382E] space-y-0.5">
                              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#166534] dark:text-[#4ADE80]">
                                Adicionais / Opcionais:
                              </span>
                              {item.selected_complements.map((c) => (
                                <div key={c.id} className="flex items-center justify-between pl-1 font-medium text-[#2E3830] dark:text-[#D5DDD7]">
                                  <span>+ {c.name}</span>
                                  {c.price_cents > 0 && (
                                    <span className="text-[10px] font-semibold text-[#166534] dark:text-[#4ADE80]">
                                      (+{formatCurrency(c.price_cents)})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Observações */}
                          {item.notes && (
                            <p className="pt-0.5 italic text-[#6B7280] dark:text-[#9CA3AF]">
                              Obs: {item.notes}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between">
                        {/* Preço do item com peso 600 */}
                        <span className="text-sm font-semibold text-[#1C261F] dark:text-[#F2EFE9]">
                          {formatCurrency(item.unit_price_cents * item.quantity)}
                        </span>

                        <div className="flex items-center gap-2 rounded-lg border border-[#DED7CB] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#1E2B22] px-2 py-0.5 text-xs">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="text-[#68706A] dark:text-[#9CA79E] hover:text-black dark:hover:text-white cursor-pointer"
                            title="Diminuir"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="font-semibold text-[#1C261F] dark:text-[#F2EFE9]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="text-[#68706A] dark:text-[#9CA79E] hover:text-[#CB5A3C] dark:hover:text-[#FF7D4F] cursor-pointer"
                            title="Aumentar"
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
            {/* Form de cupom: apenas o ícone e a borda mudam de cor (vermelho no erro, verde no sucesso). Botão, texto e background permanecem padrão */}
            <form onSubmit={handleCouponSubmit} className="mb-3 flex gap-2">
              <div className="relative flex-1">
                <Tag
                  className={`absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 transition-colors ${
                    couponStatus === "success"
                      ? "text-[#059669] dark:text-[#34D399]"
                      : couponStatus === "error"
                      ? "text-red-500"
                      : "text-[#CB5A3C] dark:text-[#FF7D4F]"
                  }`}
                />
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value)
                    if (couponStatus !== "idle") setCouponStatus("idle")
                  }}
                  placeholder="Cupom de desconto"
                  className={`w-full rounded-xl border py-2 pl-8 pr-3 text-xs outline-hidden transition-all bg-white dark:bg-[#1B241E] text-[#1F2921] dark:text-[#F2EFE9] placeholder-[#7F8681] dark:placeholder-[#6C7870] ${
                    couponStatus === "success"
                      ? "border-[#059669] dark:border-[#059669]"
                      : couponStatus === "error"
                      ? "border-red-500 dark:border-red-500"
                      : "border-[#DED7CB] dark:border-[#2A382E] focus:border-[#CB5A3C]"
                  }`}
                />
              </div>
              <button
                type="submit"
                className="rounded-xl border border-[#DED7CB] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] px-3 py-2 text-xs font-semibold text-[#1F2921] dark:text-[#F2EFE9] hover:bg-[#F0ECE3] dark:hover:bg-[#25332A] transition-all cursor-pointer"
              >
                Aplicar
              </button>
            </form>

            {/* Mensagem do cupom */}
            {couponMsg && (
              <p
                className={`mb-3 text-xs font-semibold transition-colors ${
                  couponStatus === "success"
                    ? "text-[#059669] dark:text-[#34D399]"
                    : "text-red-500"
                }`}
              >
                {couponMsg}
              </p>
            )}

            {/* Resumo de valores com peso 600 e exibição do cupom aplicado */}
            <div className="space-y-1.5 text-xs text-[#68706A] dark:text-[#9CA79E]">
              <div className="flex justify-between font-semibold">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotalCents)}</span>
              </div>

              <div className="flex justify-between font-semibold">
                <span>Taxa de entrega</span>
                <span>
                  {deliveryFeeCents === 0 ? "Grátis" : formatCurrency(deliveryFeeCents)}
                </span>
              </div>

              {/* Cupom aplicado exibido junto com o preço */}
              {appliedCoupon && (
                <div className="flex justify-between text-[#059669] dark:text-[#34D399] font-semibold">
                  <span>Cupom ({appliedCoupon})</span>
                  <span>{discountCents > 0 ? `- ${formatCurrency(discountCents)}` : "Grátis"}</span>
                </div>
              )}

              {discountCents > 0 && !appliedCoupon && (
                <div className="flex justify-between text-[#059669] dark:text-[#34D399] font-semibold">
                  <span>Desconto</span>
                  <span>- {formatCurrency(discountCents)}</span>
                </div>
              )}

              <div className="flex justify-between border-t border-[#ECE7DE] dark:border-[#2A382E] pt-2 text-base font-semibold text-[#1C261F] dark:text-[#F2EFE9]">
                <span>Total</span>
                <span>{formatCurrency(totalCents)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                proceedToCheckout()
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#CB5A3C] py-3.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#B54A2E] cursor-pointer"
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
