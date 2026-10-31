"use client"

import React from "react"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import { X, Heart, RotateCcw, Plus, MapPin } from "lucide-react"
import { MOCK_PRODUCTS } from "@/lib/storefront/mock-storefront-data"

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white dark:bg-[#17211A] text-[#1F2922] dark:text-[#F2EFE9] border dark:border-[#2A382E] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ECE7DE] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] px-6 py-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 fill-[#CB5A3C] text-[#CB5A3C]" />
            <h2 className="font-serif text-xl font-bold text-[#1C261F] dark:text-[#F2EFE9]">
              Favoritos e pedidos anteriores
            </h2>
          </div>
          <button
            onClick={closeModal}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#5D645E] dark:text-[#9CA79E] hover:bg-[#F4EFE6] dark:hover:bg-[#253528]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[75vh] space-y-6 overflow-y-auto p-6">
          {/* Last Order Repetir Card */}
          <div className="rounded-xl border border-[#DED7CB] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#131A15] p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#79807B]">
                  Último pedido
                </span>
                <h3 className="font-serif text-base font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                  Pedido #1184 • 20 de maio
                </h3>
              </div>
              <span className="text-sm font-bold text-[#1C261F] dark:text-[#4ADE80]">R$ 47,80</span>
            </div>

            <p className="mt-2 text-xs text-[#636A65] dark:text-[#9CA79E]">
              1x Bowl Noma (com tofu grelhado, sem tomate), 1x Chá da casa
              gelado
            </p>

            <div className="mt-4 flex items-center justify-between pt-2">
              <span className="text-xs font-medium text-[#2E6B3E]">
                ✓ Entregue com sucesso
              </span>
              <button
                onClick={() => {
                  repeatLastOrder()
                }}
                className="flex items-center gap-1.5 rounded-lg bg-[#CB5A3C] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#B54A2E]"
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
            <div className="flex-1 text-xs">
              <span className="font-semibold text-[#1C261F] dark:text-[#F2EFE9]">
                Endereço padrão de entrega (Casa)
              </span>
              <p className="text-[#68706A] dark:text-[#9CA79E]">
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
              <p className="py-6 text-center text-xs text-[#808782]">
                Você ainda não favoritou nenhum prato. Clique no coração em qualquer item para salvar!
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {favoriteProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#ECE7DE] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] p-3 transition hover:border-[#DED7CB] dark:hover:border-[#384D3E]"
                  >
                    <img
                      src={prod.image_url}
                      alt={prod.name}
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                    <div className="flex flex-1 flex-col overflow-hidden">
                      <span className="truncate text-xs font-semibold text-[#1C261F] dark:text-[#F2EFE9]">
                        {prod.name}
                      </span>
                      <span className="text-xs font-bold text-[#1C261F] dark:text-[#4ADE80]">
                        {formatCurrency(prod.promo_price_cents || prod.price_cents)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleFavorite(prod.id)}
                        className="p-1 text-[#CB5A3C] hover:opacity-80"
                      >
                        <Heart className="h-4 w-4 fill-[#CB5A3C]" />
                      </button>
                      <button
                        onClick={() => openProductDetail(prod)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1B2A20] dark:bg-[#2E4233] text-white"
                      >
                        <Plus className="h-3.5 w-3.5" />
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
