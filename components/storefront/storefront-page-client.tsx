"use client"

import React, { useState } from "react"
import { StorefrontStore } from "@/types/storefront"
import {
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
} from "@/lib/storefront/mock-storefront-data"
import { StorefrontHeader } from "./storefront-header"
import { StoreHero } from "./store-hero"
import { CategoryFilterBar } from "./category-filter-bar"
import { ProductCard, MobileProductCard } from "./product-card"
import { CombosSection } from "./combos-section"
import { ProductDetailModal } from "./product-detail-modal"
import { DeliveryInfoModal } from "./delivery-info-modal"
import { FavoritesModal } from "./favorites-modal"
import { ReceivingMethodModal } from "./receiving-method-modal"
import { CheckoutClientDataModal } from "./checkout-client-data-modal"
import { CheckoutPaymentModal } from "./checkout-payment-modal"
import { OrderConfirmedScreen } from "./order-confirmed-screen"
import { OrderTrackingModal } from "./order-tracking-modal"
import { CartDrawer } from "./cart-drawer"
import { MobileCartBar } from "./mobile-cart-bar"

interface StorefrontPageClientProps {
  initialStore?: StorefrontStore
}

export function StorefrontPageClient({ initialStore: _initialStore }: StorefrontPageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState("todas")
  const [searchQuery, setSearchQuery] = useState("")

  // Filter products by search and category
  const filteredProducts = MOCK_PRODUCTS.filter((prod) => {
    const matchesCategory =
      selectedCategory === "todas" ||
      prod.category_id === selectedCategory ||
      (selectedCategory === "combos" && prod.is_combo)

    const matchesSearch =
      searchQuery.trim() === "" ||
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.description.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesSearch
  })

  // Sections
  const featuredProducts = MOCK_PRODUCTS.filter((p) => p.is_featured)
  const comboProducts = MOCK_PRODUCTS.filter((p) => p.is_combo)
  const entradas = filteredProducts.filter((p) => p.category_id === "entradas")
  const bowls = filteredProducts.filter((p) => p.category_id === "bowls")
  const pratosPrincipais = filteredProducts.filter(
    (p) => p.category_id === "pratos-principais" && !p.is_featured
  )
  const bebidas = filteredProducts.filter((p) => p.category_id === "bebidas")
  const sobremesas = filteredProducts.filter((p) => p.category_id === "sobremesas")

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#131A15] text-[#1C261F] dark:text-[#F2EFE9] transition-colors duration-150">
      {/* 1. Header */}
      <StorefrontHeader />

      {/* 2. Hero Section */}
      <StoreHero />

      {/* 3. Main Menu Body */}
      <main id="cardapio" className="mx-auto max-w-7xl px-4 pb-28 pt-6 md:px-6">
        {/* Category Filter Pills & Search Input (From Image 02) */}
        <CategoryFilterBar
          categories={MOCK_CATEGORIES}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Catalog Sections */}
        {selectedCategory === "todas" && searchQuery === "" ? (
          <div className="space-y-12">
            {/* Mais pedidos */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-2xl font-bold tracking-tight text-[#1A261D] dark:text-[#F2EFE9]">
                  Mais pedidos
                </h2>
                <button
                  onClick={() => setSelectedCategory("bowls")}
                  className="text-xs font-semibold text-[#CB5A3C] hover:underline md:text-sm"
                >
                  Ver tudo
                </button>
              </div>

              {/* Desktop 3-column Grid */}
              <div className="hidden grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 md:grid">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Mobile Horizontal Cards List */}
              <div className="flex flex-col gap-3 md:hidden">
                {featuredProducts.map((product) => (
                  <MobileProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>

            {/* Combos da semana */}
            <CombosSection combos={comboProducts} />

            {/* Entradas */}
            {entradas.length > 0 && (
              <section>
                <h2 className="mb-4 font-serif text-2xl font-bold tracking-tight text-[#1A261D] dark:text-[#F2EFE9]">
                  Entradas
                </h2>

                <div className="hidden grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 md:grid">
                  {entradas.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                <div className="flex flex-col gap-3 md:hidden">
                  {entradas.map((product) => (
                    <MobileProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}

            {/* Bowls */}
            {bowls.length > 0 && (
              <section>
                <h2 className="mb-4 font-serif text-2xl font-bold tracking-tight text-[#1A261D] dark:text-[#F2EFE9]">
                  Bowls
                </h2>

                <div className="hidden grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 md:grid">
                  {bowls.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                <div className="flex flex-col gap-3 md:hidden">
                  {bowls.map((product) => (
                    <MobileProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}

            {/* Pratos Principais */}
            {pratosPrincipais.length > 0 && (
              <section>
                <h2 className="mb-4 font-serif text-2xl font-bold tracking-tight text-[#1A261D] dark:text-[#F2EFE9]">
                  Pratos principais
                </h2>

                <div className="hidden grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 md:grid">
                  {pratosPrincipais.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                <div className="flex flex-col gap-3 md:hidden">
                  {pratosPrincipais.map((product) => (
                    <MobileProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}

            {/* Bebidas & Sobremesas */}
            {bebidas.length > 0 && (
              <section>
                <h2 className="mb-4 font-serif text-2xl font-bold tracking-tight text-[#1A261D] dark:text-[#F2EFE9]">
                  Bebidas
                </h2>

                <div className="hidden grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 md:grid">
                  {bebidas.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                <div className="flex flex-col gap-3 md:hidden">
                  {bebidas.map((product) => (
                    <MobileProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}

            {sobremesas.length > 0 && (
              <section>
                <h2 className="mb-4 font-serif text-2xl font-bold tracking-tight text-[#1A261D] dark:text-[#F2EFE9]">
                  Sobremesas
                </h2>

                <div className="hidden grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 md:grid">
                  {sobremesas.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                <div className="flex flex-col gap-3 md:hidden">
                  {sobremesas.map((product) => (
                    <MobileProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          /* Filtered View */
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-[#1A261D] dark:text-[#F2EFE9]">
                {searchQuery
                  ? `Resultados para "${searchQuery}" (${filteredProducts.length})`
                  : MOCK_CATEGORIES.find((c) => c.id === selectedCategory)?.name}
              </h2>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-[#ECE7DE] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] p-12 text-center">
                <p className="text-sm text-[#79807B] dark:text-[#9CA79E]">
                  Nenhum produto encontrado com os filtros selecionados.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory("todas")
                    setSearchQuery("")
                  }}
                  className="mt-3 text-xs font-bold text-[#CB5A3C] hover:underline"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              <>
                <div className="hidden grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 md:grid">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                <div className="flex flex-col gap-3 md:hidden">
                  {filteredProducts.map((product) => (
                    <MobileProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Floating Sticky Bottom Cart on Mobile */}
      <MobileCartBar />

      {/* Modals & Drawers */}
      <ProductDetailModal />
      <DeliveryInfoModal />
      <FavoritesModal />
      <ReceivingMethodModal />
      <CheckoutClientDataModal />
      <CheckoutPaymentModal />
      <OrderConfirmedScreen />
      <OrderTrackingModal />
      <CartDrawer />
    </div>
  )
}
