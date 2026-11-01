"use client"

import React, { useState } from "react"
import { StorefrontStore, StorefrontCategory, StorefrontProduct } from "@/types/storefront"
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
  initialCategories?: StorefrontCategory[]
  initialProducts?: StorefrontProduct[]
}

export function StorefrontPageClient({
  initialStore: _initialStore,
  initialCategories,
  initialProducts,
}: StorefrontPageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState("todas")
  const [searchQuery, setSearchQuery] = useState("")

  const categoriesList = (initialCategories && initialCategories.length > 0) ? initialCategories : MOCK_CATEGORIES
  const productsList = (initialProducts && initialProducts.length > 0) ? initialProducts : MOCK_PRODUCTS

  // Filter products by search and category
  const filteredProducts = productsList.filter((prod) => {
    const matchesCategory =
      selectedCategory === "todas" ||
      prod.category_id === selectedCategory ||
      prod.category_name?.toLowerCase() === selectedCategory.toLowerCase() ||
      (selectedCategory === "combos" && prod.is_combo) ||
      (prod.tags && prod.tags.some((t) => t.toLowerCase() === selectedCategory.toLowerCase() || t.toLowerCase().replace(/\s+/g, "-") === selectedCategory.toLowerCase()))

    const matchesSearch =
      searchQuery.trim() === "" ||
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.description?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesSearch
  })

  // Sections
  const featuredProducts = productsList.filter((p) => p.is_featured)
  const comboProducts = productsList.filter((p) => p.is_combo)

  // Categorias para as seções na home (todas exceto "todas")
  const sectionsCategories = categoriesList.filter((c) => c.id !== "todas")

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
          categories={categoriesList}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Catalog Sections */}
        {selectedCategory === "todas" && searchQuery === "" ? (
          <div className="space-y-12">
            {/* Mais pedidos */}
            {featuredProducts.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-serif text-2xl font-bold tracking-tight text-[#1A261D] dark:text-[#F2EFE9]">
                    Mais pedidos
                  </h2>
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
            )}

            {/* Combos da semana */}
            {comboProducts.length > 0 && (
              <CombosSection combos={comboProducts} />
            )}

            {/* Seções dinâmicas por categoria do lojista */}
            {sectionsCategories.map((cat) => {
              const catProducts = productsList.filter(
                (p) =>
                  p.category_id === cat.id ||
                  p.category_name?.toLowerCase() === cat.name.toLowerCase() ||
                  (p.tags && p.tags.some((t) => t.toLowerCase() === cat.name.toLowerCase() || t.toLowerCase().replace(/\s+/g, "-") === cat.id))
              )

              if (catProducts.length === 0) return null

              return (
                <section key={cat.id}>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-serif text-2xl font-bold tracking-tight text-[#1A261D] dark:text-[#F2EFE9]">
                      {cat.name}
                    </h2>
                    <button
                      onClick={() => setSelectedCategory(cat.id)}
                      className="text-xs font-semibold text-[#CB5A3C] hover:underline md:text-sm cursor-pointer"
                    >
                      Ver tudo ({catProducts.length})
                    </button>
                  </div>

                  <div className="hidden grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 md:grid">
                    {catProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 md:hidden">
                    {catProducts.map((product) => (
                      <MobileProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        ) : (
          /* Filtered View */
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-[#1A261D] dark:text-[#F2EFE9]">
                {searchQuery
                  ? `Resultados para "${searchQuery}" (${filteredProducts.length})`
                  : (categoriesList.find((c) => c.id === selectedCategory)?.name || selectedCategory)}
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
