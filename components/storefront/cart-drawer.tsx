"use client"

import React from "react"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import { StorefrontImage } from "./storefront-image"
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
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
    proceedToCheckout,
  } = useStorefrontCart()

  if (activeModal !== "cart-drawer") return null

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sua Sacola"
        className="flex h-full w-full max-w-md flex-col bg-white dark:bg-[#17211A] text-[#1C261F] dark:text-[#F2EFE9] border-l border-transparent dark:border-[#2A382E] shadow-2xl pt-safe transition-colors"
      >
        {/* Header - "Sua sacola" em laranja da logo, sem ícone e sem contador conforme solicitado */}
        <div className="flex items-center justify-between border-b border-[#2E6B3E]/40 dark:border-[#E76F41]/60 p-4 sm:p-5">
          <h2 className="font-serif text-xl font-bold text-[#B4482D] dark:text-[#FF7D4F]">
            Sua Sacola
          </h2>
          <button
            type="button"
            onClick={closeModal}
            className="flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-full text-[#4A534C] dark:text-[#CBD5E1] hover:bg-[#F4EFE6] dark:hover:bg-[#25332A] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6B3E]"
            aria-label="Fechar sacola"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5 storefront-scrollbar">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag className="h-12 w-12 text-[#C5BEB3] dark:text-[#3B4D40]" />
              <h3 className="mt-3 font-serif text-base font-semibold text-[#1C261F] dark:text-[#F2EFE9]">
                Sua sacola está vazia
              </h3>
              <p className="mt-1 text-xs font-semibold text-[#666E68] dark:text-[#9CA79E]">
                Explore nosso cardápio e adicione seus pratos favoritos!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#ECE7DE] dark:divide-[#2A382E]">
              {items.map((item) => (
                <div key={item.id} className="py-4">
                  <div className="flex items-start gap-3">
                    <StorefrontImage
                      src={item.image_url}
                      alt={item.name}
                      className="h-16 w-16 shrink-0 rounded-xl object-cover border border-[#ECE7DE] dark:border-[#2A382E]"
                      fallbackClassName="h-16 w-16 shrink-0 rounded-xl border border-[#ECE7DE] dark:border-[#2A382E]"
                      iconClassName="h-6 w-6"
                    />
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-start justify-between gap-2">
                        <span className="truncate text-sm font-bold text-[#1C261F] dark:text-[#F2EFE9] pt-1.5">
                          {item.name}
                        </span>
                        {/* Lixinho em vermelho */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="flex h-9 w-9 min-h-9 min-w-9 shrink-0 items-center justify-center text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                          aria-label={`Remover ${item.name} da sacola`}
                          title="Remover item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Portions / Proteins / Customizations / Complements - Todas letras cinzas com peso 600 */}
                      {(item.portion || item.protein || (item.removed_ingredients && item.removed_ingredients.length > 0) || (item.selected_complements && item.selected_complements.length > 0) || item.notes) && (
                        <div className="mt-1 space-y-1 text-xs font-semibold text-[#58605A] dark:text-[#A4AEA6]">
                          {/* Prato Base / Especificações */}
                          {(item.portion || item.protein || (item.removed_ingredients && item.removed_ingredients.length > 0)) && (
                            <div className="space-y-0.5 font-semibold">
                              {item.portion && <span className="block font-semibold">• Tamanho: {item.portion}</span>}
                              {item.protein && <span className="block font-semibold">• Proteína: {item.protein}</span>}
                              {item.removed_ingredients?.map((r) => (
                                <span key={r} className="block font-semibold">• Sem: {r}</span>
                              ))}
                            </div>
                          )}

                          {/* Adicionais e Opcionais Discriminados */}
                          {item.selected_complements && item.selected_complements.length > 0 && (
                            <div className="pt-1 border-t border-dashed border-[#ECE7DE] dark:border-[#2A382E] space-y-0.5 font-semibold">
                              <span className="block text-xs font-bold uppercase tracking-wider text-[#166534] dark:text-[#4ADE80]">
                                Adicionais / Opcionais:
                              </span>
                              {item.selected_complements.map((c) => (
                                <div key={c.id} className="flex items-center justify-between pl-1 font-semibold text-[#2E3830] dark:text-[#D5DDD7]">
                                  <span className="font-semibold">+ {c.name}</span>
                                  {c.price_cents > 0 && (
                                    <span className="text-xs font-semibold text-[#166534] dark:text-[#4ADE80]">
                                      (+{formatCurrency(c.price_cents)})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Observações com peso 600 */}
                          {item.notes && (
                            <p className="pt-0.5 italic font-semibold text-xs text-[#58605A] dark:text-[#A4AEA6]">
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

                        <div className="flex items-center gap-1 rounded-lg border border-[#DED7CB] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#1E2B22] px-1 py-0.5 text-xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-md text-[#4A534C] dark:text-[#CBD5E1] hover:text-black dark:hover:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6B3E]"
                            aria-label={`Diminuir quantidade de ${item.name}`}
                            title="Diminuir"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-5 text-center font-semibold text-[#1C261F] dark:text-[#F2EFE9]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-md text-[#4A534C] dark:text-[#CBD5E1] hover:text-[#B4482D] dark:hover:text-[#FF7D4F] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6B3E]"
                            aria-label={`Aumentar quantidade de ${item.name}`}
                            title="Aumentar"
                          >
                            <Plus className="h-3.5 w-3.5" />
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
          <div className="shrink-0 border-t border-[#2E6B3E]/40 dark:border-[#E76F41]/60 bg-[#FAF8F5] dark:bg-[#141C16] p-4 sm:p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {/* Resumo de valores com peso 600 em todas as linhas cinzas */}
            <div className="space-y-1.5 text-xs text-[#525A54] dark:text-[#A4AEA6] font-semibold">
              <div className="flex justify-between font-semibold">
                <span className="font-semibold text-[#525A54] dark:text-[#A4AEA6]">Subtotal</span>
                <span className="font-semibold text-[#1C261F] dark:text-[#F2EFE9]">{formatCurrency(subtotalCents)}</span>
              </div>

              <div className="flex justify-between font-semibold">
                <span className="font-semibold text-[#525A54] dark:text-[#A4AEA6]">Taxa de entrega</span>
                <span className="font-semibold text-[#1C261F] dark:text-[#F2EFE9]">
                  {deliveryFeeCents === 0 ? "Grátis" : formatCurrency(deliveryFeeCents)}
                </span>
              </div>

              {discountCents > 0 && (
                <div className="flex justify-between text-[#15803D] dark:text-[#4ADE80] font-semibold">
                  <span className="font-semibold">Desconto</span>
                  <span className="font-semibold">- {formatCurrency(discountCents)}</span>
                </div>
              )}

              <div className="flex justify-between border-t border-[#ECE7DE] dark:border-[#2A382E] pt-2 text-base font-semibold text-[#1C261F] dark:text-[#F2EFE9]">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">{formatCurrency(totalCents)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                proceedToCheckout()
              }}
              className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#B4482D] py-3.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#9D3D25] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6B3E]"
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
