"use client"

import React from "react"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import { X, Heart, RotateCcw, Plus, MapPin } from "lucide-react"
import { MOCK_PRODUCTS } from "@/lib/storefront/mock-storefront-data"
import { StorefrontImage } from "./storefront-image"

export function FavoritesModal() {
  const {
    activeModal,
    closeModal,
    favorites,
    toggleFavorite,
    repeatLastOrder,
    openProductDetail,
    customerData,
  } = useStorefrontCart()

  if (activeModal !== "favorites") return null

  const favoriteProducts = MOCK_PRODUCTS.filter((p) => favorites.includes(p.id))

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 pt-safe pb-safe backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Favoritos e pedidos anteriores"
        className="relative flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white dark:bg-[#17211A] text-[#1F2922] dark:text-[#F2EFE9] border border-[#ECE7DE] dark:border-[#2A382E] shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#ECE7DE] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] px-4 sm:px-6 py-4">
          <div className="flex min-w-0 items-center gap-2">
            <Heart className="h-5 w-5 shrink-0 fill-[#B4482D] text-[#B4482D] dark:fill-[#FF7D4F] dark:text-[#FF7D4F]" />
            <h2 className="truncate font-serif text-lg sm:text-xl font-bold text-[#1C261F] dark:text-[#F2EFE9]">
              Favoritos e pedidos anteriores
            </h2>
          </div>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Fechar favoritos"
            className="flex h-9 w-9 min-h-9 min-w-9 shrink-0 items-center justify-center rounded-full text-[#4A534C] dark:text-[#CBD5E1] hover:bg-[#F4EFE6] dark:hover:bg-[#253528] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6B3E]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] storefront-scrollbar">
          {/* Last Order Repetir Card */}
          <div className="rounded-xl border border-[#DED7CB] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#131A15] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#59615B] dark:text-[#9CA79E]">
                  Último pedido
                </span>
                <h3 className="font-serif text-base font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                  Pedido #1184 • 20 de maio
                </h3>
              </div>
              <span className="text-sm font-bold text-[#1C261F] dark:text-[#4ADE80]">R$ 47,80</span>
            </div>

            <p className="mt-2 text-xs text-[#525A54] dark:text-[#A4AEA6]">
              1x Bowl Noma (com tofu grelhado, sem tomate), 1x Chá da casa
              gelado
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-2">
              <span className="text-xs font-semibold text-[#166534] dark:text-[#4ADE80]">
                ✓ Entregue com sucesso
              </span>
              <button
                type="button"
                onClick={() => {
                  repeatLastOrder()
                }}
                className="flex min-h-9 items-center gap-1.5 rounded-lg bg-[#B4482D] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#9D3D25] cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Repetir pedido</span>
              </button>
            </div>
          </div>

          {/* Saved Address Card */}
          <div className="flex items-start gap-3 rounded-xl border border-[#ECE7DE] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] p-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F2EDE4] dark:bg-[#253528] text-[#1B2A20] dark:text-[#4ADE80]">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0 text-xs">
              <span className="font-semibold text-[#1C261F] dark:text-[#F2EFE9]">
                Endereço padrão de entrega (Casa)
              </span>
              <p className="text-[#525A54] dark:text-[#9CA79E]">
                {customerData.address}, {customerData.complement} -{" "}
                {customerData.neighborhood}, {customerData.city}
              </p>
            </div>
          </div>

          {/* Favorited Products Grid */}
          <div>
            <h3 className="mb-3 text-sm font-bold text-[#1C261F] dark:text-[#F2EFE9]">
              Pratos salvos ({favoriteProducts.length})
            </h3>

            {favoriteProducts.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#59615B] dark:text-[#9CA79E]">
                Você ainda não favoritou nenhum prato. Clique no coração em qualquer item para salvar!
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {favoriteProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between gap-2.5 rounded-xl border border-[#ECE7DE] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] p-3 transition hover:border-[#DED7CB] dark:hover:border-[#384D3E]"
                  >
                    <StorefrontImage src={prod.image_url} alt={prod.name} className="h-14 w-14 shrink-0 rounded-lg object-cover" fallbackClassName="h-14 w-14 shrink-0 rounded-lg" iconClassName="h-5 w-5" />
                    <div className="flex flex-1 flex-col overflow-hidden min-w-0">
                      <span className="truncate text-xs font-semibold text-[#1C261F] dark:text-[#F2EFE9]">
                        {prod.name}
                      </span>
                      <span className="text-xs font-bold text-[#1C261F] dark:text-[#4ADE80]">
                        {formatCurrency(prod.promo_price_cents || prod.price_cents)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleFavorite(prod.id)}
                        aria-label={`Remover ${prod.name} dos favoritos`}
                        className="flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-lg text-[#B4482D] dark:text-[#FF7D4F] hover:bg-[#FAF8F5] dark:hover:bg-[#253528] cursor-pointer"
                      >
                        <Heart className="h-4 w-4 fill-current" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openProductDetail(prod)}
                        aria-label={`Adicionar ${prod.name}`}
                        className="flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-full bg-[#1B2A20] dark:bg-[#2E4233] text-white hover:bg-[#273B2E] dark:hover:bg-[#3B5441] cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
