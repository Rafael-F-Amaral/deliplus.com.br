"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import { X, Plus, Minus, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react"
import { StorefrontComplement, StorefrontProduct } from "@/types/storefront"
import { normalizeSearch } from "@/lib/utils"

export interface StorefrontBeverageItem {
  id: string
  name: string
  volume: string
  price_cents: number
  image_url?: string
}

interface ProductDetailModalProps {
  storeProducts?: StorefrontProduct[]
}

export function ProductDetailModal({ storeProducts }: ProductDetailModalProps = {}) {
  const { activeModal, selectedProduct, closeModal, addToCart } = useStorefrontCart()

  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isZoomOpen, setIsZoomOpen] = useState(false)
  const [selectedSizeId, setSelectedSizeId] = useState<string>("")
  const [selectedPortion, setSelectedPortion] = useState<string>("default")
  const [selectedProtein, setSelectedProtein] = useState<string>("default")
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([])
  const [selectedComplements, setSelectedComplements] = useState<StorefrontComplement[]>([])
  const [selectedBeverageQuantities, setSelectedBeverageQuantities] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState("")
  const [quantity, setQuantity] = useState(1)

  // Real catalog beverages
  const availableBeverages: StorefrontBeverageItem[] = useMemo(() => {
    if (!storeProducts || storeProducts.length === 0) return []
    return storeProducts
      .filter((p) => {
        if (selectedProduct && p.id === selectedProduct.id) return false
        const normName = normalizeSearch(p.name)
        const normCat = normalizeSearch(p.category_name || "")
        const isDrinkCat =
          normCat.includes("bebid") ||
          p.category_id === "c273e83b-fff8-47a5-b03b-13310706ec02"
        const hasDrinkTag = p.tags?.some((t: string) => normalizeSearch(t).includes("bebid"))
        const hasDrinkName =
          normName.includes("agua") ||
          normName.includes("suco") ||
          normName.includes("cha") ||
          normName.includes("coca") ||
          normName.includes("guarana") ||
          normName.includes("limonada") ||
          normName.includes("kombucha") ||
          normName.includes("cerveja") ||
          normName.includes("mate") ||
          normName.includes("copo")
        return isDrinkCat || hasDrinkTag || hasDrinkName
      })
      .map((p) => {
        const sizeName = p.sizes?.[0]?.name
        const volume = sizeName || (p.description?.includes("ml") ? p.description : "")
        const price = p.sizes?.[0]?.price_cents || p.promo_price_cents || p.price_cents
        return {
          id: p.id,
          name: p.name,
          volume: volume,
          price_cents: price,
          image_url: p.image_url,
        }
      })
  }, [storeProducts, selectedProduct?.id])

  const [beverageSearch, setBeverageSearch] = useState("")
  const [beveragePage, setBeveragePage] = useState(1)
  const BEVERAGES_PER_PAGE = 3

  const filteredBeverages = useMemo(() => {
    const q = normalizeSearch(beverageSearch)
    if (!q) return availableBeverages
    return availableBeverages.filter(
      (b) =>
        normalizeSearch(b.name).includes(q) ||
        (b.volume && normalizeSearch(b.volume).includes(q))
    )
  }, [availableBeverages, beverageSearch])

  const totalBeveragePages = Math.max(1, Math.ceil(filteredBeverages.length / BEVERAGES_PER_PAGE))

  const paginatedBeverages = useMemo(() => {
    const start = (beveragePage - 1) * BEVERAGES_PER_PAGE
    return filteredBeverages.slice(start, start + BEVERAGES_PER_PAGE)
  }, [filteredBeverages, beveragePage])

  // Reset beverage filter on product switch
  useEffect(() => {
    setBeverageSearch("")
    setBeveragePage(1)
  }, [selectedProduct?.id])

  // Reset all form selections helper
  const resetAllSelections = () => {
    setActiveImageIndex(0)
    setIsZoomOpen(false)
    setSelectedSizeId(selectedProduct?.sizes?.[0]?.id || "")
    setSelectedPortion("default")
    setSelectedProtein("default")
    setRemovedIngredients([])
    setSelectedComplements([])
    setSelectedBeverageQuantities({})
    setNotes("")
    setQuantity(1)
    setBeverageSearch("")
    setBeveragePage(1)
  }

  // Reset form states whenever selectedProduct changes
  useEffect(() => {
    resetAllSelections()
  }, [selectedProduct?.id, selectedProduct?.sizes])

  // Up to 5 photos for gallery
  const galleryImages: string[] = useMemo(() => {
    if (!selectedProduct) return []
    if (Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0) {
      return selectedProduct.images.filter(Boolean).slice(0, 5)
    }
    return selectedProduct.image_url ? [selectedProduct.image_url] : []
  }, [selectedProduct])

  // Keyboard navigation when Lightbox Zoom is active
  useEffect(() => {
    if (!isZoomOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsZoomOpen(false)
      if (e.key === "ArrowLeft") {
        setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))
      }
      if (e.key === "ArrowRight") {
        setActiveImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isZoomOpen, galleryImages.length])

  if (activeModal !== "product-detail" || !selectedProduct) return null

  const activeImage = galleryImages[activeImageIndex] || galleryImages[0] || selectedProduct.image_url

  const toggleRemoved = (ing: string) => {
    setRemovedIngredients((prev) =>
      prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]
    )
  }

  const toggleComplement = (comp: StorefrontComplement) => {
    setSelectedComplements((prev) =>
      prev.some((c) => c.id === comp.id)
        ? prev.filter((c) => c.id !== comp.id)
        : [...prev, comp]
    )
  }

  const handleUpdateBeverageQty = (bevId: string, delta: number) => {
    setSelectedBeverageQuantities((prev) => {
      const current = prev[bevId] || 0
      const next = Math.max(0, current + delta)
      if (next === 0) {
        const copy = { ...prev }
        delete copy[bevId]
        return copy
      }
      return { ...prev, [bevId]: next }
    })
  }

  // Calculate base price considering selected size
  const selectedSizeObj =
    selectedProduct.sizes?.find((s) => s.id === selectedSizeId) || selectedProduct.sizes?.[0]

  const basePrice = selectedSizeObj
    ? (selectedSizeObj.promo_price_cents || selectedSizeObj.price_cents)
    : (selectedProduct.promo_price_cents || selectedProduct.price_cents)

  const portionExtra =
    selectedProduct.portions?.find((p) => p.id === selectedPortion)?.extra_price_cents || 0
  const proteinExtra =
    selectedProduct.proteins?.find((p) => p.id === selectedProtein)?.extra_price_cents || 0
  const complementsExtra = selectedComplements.reduce((acc, c) => acc + c.price_cents, 0)
  
  const unitTotalCents = basePrice + portionExtra + proteinExtra + complementsExtra

  const beveragesTotalCents = Object.entries(selectedBeverageQuantities).reduce((acc, [bevId, qty]) => {
    const bev = availableBeverages.find((b) => b.id === bevId)
    return acc + (bev ? bev.price_cents * qty : 0)
  }, 0)

  const grandTotalCents = (unitTotalCents * quantity) + beveragesTotalCents

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  const handleCloseModal = () => {
    resetAllSelections()
    closeModal()
  }

  const handleAdd = () => {
    const portionName = selectedProduct.portions?.find((p) => p.id === selectedPortion)?.name
    const proteinName = selectedProduct.proteins?.find((p) => p.id === selectedProtein)?.name

    // 1. Adiciona o prato principal com complementos e observações
    addToCart({
      product_id: selectedProduct.id,
      name: selectedProduct.name,
      unit_price_cents: unitTotalCents,
      quantity,
      image_url: activeImage || selectedProduct.image_url,
      size: selectedSizeObj?.name,
      portion: selectedSizeObj?.name || portionName,
      protein: proteinName,
      removed_ingredients: removedIngredients,
      selected_complements: selectedComplements,
      notes: notes.trim() || undefined,
    })

    // 2. Adiciona cada bebida selecionada como seu próprio item no carrinho
    Object.entries(selectedBeverageQuantities).forEach(([bevId, bevQty]) => {
      if (bevQty > 0) {
        const bev = availableBeverages.find((b) => b.id === bevId)
        if (bev) {
          addToCart({
            product_id: bev.id,
            name: bev.volume ? `${bev.name} (${bev.volume})` : bev.name,
            unit_price_cents: bev.price_cents,
            quantity: bevQty,
            image_url: bev.image_url || "",
          })
        }
      }
    })

    // Zera todas as opções selecionadas imediatamente
    resetAllSelections()
    closeModal()
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs"
        onClick={handleCloseModal}
      >
        <div
          className="relative flex w-full max-w-xl md:max-w-2xl flex-col overflow-hidden bg-white dark:bg-[#17211A] text-[#1F2922] dark:text-[#F2EFE9] shadow-2xl rounded-2xl border border-[#ECE7DE] dark:border-[#2A382E] max-h-[90vh] md:max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button Top Right */}
          <button
            onClick={handleCloseModal}
            className="absolute right-3.5 top-3.5 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-[#1F2B22]/90 text-[#3C443E] dark:text-[#E2DED6] shadow-sm backdrop-blur-xs transition hover:bg-white dark:hover:bg-[#28382C] hover:text-black dark:hover:text-white border border-[#E8E2D5] dark:border-[#2A382E] cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Modal Body: Compact 2-column layout on desktop, scrollable */}
          <div className="flex flex-col md:flex-row flex-1 overflow-y-auto min-h-0">
            {/* Left: Food Gallery Showcase & Cross-sell de Bebidas */}
            <div className="md:w-[270px] shrink-0 bg-[#FAF8F5] dark:bg-[#131A15] p-3 md:p-4 md:border-r md:border-[#ECE7DE] dark:md:border-[#2A382E] flex flex-col gap-2.5">
              {/* Main Active Photo with Zoom trigger & Always Visible Navigation Arrows */}
              <div
                onClick={() => setIsZoomOpen(true)}
                className="relative w-full aspect-[4/3] md:aspect-square rounded-xl overflow-hidden bg-white dark:bg-[#1B241E] border border-[#E8E2D5] dark:border-[#2A382E] shadow-2xs flex items-center justify-center group cursor-zoom-in"
                title="Clique para dar zoom na imagem"
              >
                <img
                  src={activeImage}
                  alt={selectedProduct.name}
                  className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                  loading="eager"
                />

                {/* Badge Zoom Indicator */}
                <div className="absolute right-2 bottom-2 rounded-md bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1 shadow-xs pointer-events-none transition group-hover:bg-black/80">
                  <ZoomIn className="w-3 h-3" />
                  <span>Ampliar</span>
                </div>

                {/* Always Visible Left & Right Arrows (Shows user it is clickable & cycleable) */}
                {galleryImages.length > 1 && (
                  <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))
                      }}
                      className="pointer-events-auto h-7 w-7 rounded-full bg-black/55 hover:bg-black/85 text-white flex items-center justify-center shadow-md transition cursor-pointer backdrop-blur-xs"
                      aria-label="Foto anterior"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))
                      }}
                      className="pointer-events-auto h-7 w-7 rounded-full bg-black/55 hover:bg-black/85 text-white flex items-center justify-center shadow-md transition cursor-pointer backdrop-blur-xs"
                      aria-label="Próxima foto"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Thumbnail Strip (up to 5 thumbnails) */}
              {galleryImages.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 w-full">
                  {galleryImages.map((imgUrl, idx) => {
                    const isActive = idx === activeImageIndex
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative h-10 w-10 md:h-11 md:w-11 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                          isActive
                            ? "border-[#2E6B3E] dark:border-[#4ADE80] ring-1 ring-[#2E6B3E]/30 scale-102"
                            : "border-[#E8E2D5] dark:border-[#2A382E] opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`${selectedProduct.name} - foto ${idx + 1}`}
                          className="h-full w-full object-cover object-center"
                        />
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Section: Bebidas (Cross-sell exclusivo Deli - visível na coluna esquerda no desktop) */}
              {availableBeverages.length > 0 && (
                <div className="hidden md:flex mt-2 pt-2.5 border-t border-[#ECE7DE] dark:border-[#2A382E] flex-col gap-2 flex-1 min-h-0">
                  <div className="flex items-center justify-between shrink-0">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2922] dark:text-[#F2EFE9]">
                      Bebidas
                    </h3>
                    <span className="rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Opcional
                    </span>
                  </div>

                  {/* Campo de pesquisa de nome (sem ícones) */}
                  <div className="shrink-0">
                    <input
                      type="text"
                      value={beverageSearch}
                      onChange={(e) => {
                        setBeverageSearch(e.target.value)
                        setBeveragePage(1)
                      }}
                      placeholder="Buscar bebida..."
                      className="w-full px-2.5 py-1 text-xs bg-white dark:bg-[#203627] border border-[#E8E2D5] dark:border-[#2E4A36] rounded-lg text-[#1F2922] dark:text-[#F2EFE9] placeholder-[#9CA3AF] dark:placeholder-[#A0B0A4] focus:outline-hidden focus:border-[#2E6B3E] dark:focus:border-[#4ADE80] transition-colors"
                    />
                  </div>

                  {/* Lista de Bebidas (3 itens por página para dar espaço para o contador de quantidade e paginação) */}
                  <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto pr-0.5">
                    {paginatedBeverages.length === 0 ? (
                      <div className="text-center py-3 text-xs text-gray-400 dark:text-gray-400">
                        Nenhuma bebida encontrada
                      </div>
                    ) : (
                      paginatedBeverages.map((bev) => {
                        const qty = selectedBeverageQuantities[bev.id] || 0
                        const isSelected = qty > 0
                        return (
                          <div
                            key={bev.id}
                            onClick={() => {
                              if (qty === 0) {
                                handleUpdateBeverageQty(bev.id, 1)
                              }
                            }}
                            className={`flex items-center justify-between p-2 rounded-xl border text-left transition-all gap-2 cursor-pointer ${
                              isSelected
                                ? "border-[#2E6B3E] bg-[#F4F9F5] dark:border-[#4ADE80] dark:bg-[#2A4834] shadow-2xs"
                                : "border-[#E8E2D5] bg-white dark:border-[#2E4A36] dark:bg-[#203627] hover:border-[#CBD5E1] dark:hover:bg-[#253E2D]"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {bev.image_url ? (
                                <img
                                  src={bev.image_url}
                                  alt={bev.name}
                                  className="w-8 h-8 rounded-lg object-cover shrink-0 bg-[#FAF8F5] border border-[#ECE7DE] dark:border-[#2E4A36]"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] dark:bg-[#253E2D] border border-[#ECE7DE] dark:border-[#2E4A36] shrink-0" />
                              )}
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-xs font-bold text-[#1F2922] dark:text-[#F2EFE9] leading-tight break-words">
                                  {bev.name}
                                </span>
                                {bev.volume && (
                                  <span className="text-[10px] text-gray-500 dark:text-[#A0B0A4] font-medium leading-none mt-0.5">
                                    {bev.volume}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Preço e Seletor de Quantidade (- e +) */}
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[11px] font-bold ${isSelected ? "text-[#166534] dark:text-[#4ADE80]" : "text-[#4B5563] dark:text-[#CBD5E1]"}`}>
                                + {formatCurrency(bev.price_cents)}
                              </span>
                              <div className="flex items-center gap-1 rounded-lg border border-[#DED7CB] dark:border-[#2E4A36] bg-[#FAF8F5] dark:bg-[#1A2E20] px-1.5 py-0.5">
                                <button
                                  type="button"
                                  disabled={qty <= 0}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleUpdateBeverageQty(bev.id, -1)
                                  }}
                                  className="text-[#68706A] dark:text-[#CBD5E1] hover:text-black dark:hover:text-white disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer p-0.5"
                                  title="Diminuir"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className={`text-xs font-bold min-w-[14px] text-center ${isSelected ? "text-[#166534] dark:text-[#4ADE80]" : "text-gray-400 dark:text-[#A0B0A4]"}`}>
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleUpdateBeverageQty(bev.id, 1)
                                  }}
                                  className="text-[#68706A] dark:text-[#CBD5E1] hover:text-[#CB5A3C] dark:hover:text-[#FF7D4F] cursor-pointer p-0.5"
                                  title="Aumentar"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Paginação de Bebidas no padrão DeliPlus (em laranja, sem vazar do container) */}
                  {totalBeveragePages > 1 && (
                    <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-[#ECE7DE] dark:border-[#2A382E] text-[11px] shrink-0 w-full">
                      <button
                        type="button"
                        disabled={beveragePage <= 1}
                        onClick={() => setBeveragePage((p) => Math.max(1, p - 1))}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#CB5A3C] dark:text-[#FF7D4F] bg-[#CB5A3C]/10 hover:bg-[#CB5A3C] hover:text-white dark:bg-[#FF7D4F]/10 dark:hover:bg-[#FF7D4F] dark:hover:text-black border border-[#CB5A3C]/30 dark:border-[#FF7D4F]/30 transition-all shadow-2xs disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Anterior
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalBeveragePages }).map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setBeveragePage(i + 1)}
                            className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                              beveragePage === i + 1
                                ? "bg-[#CB5A3C] text-white shadow-sm"
                                : "bg-white dark:bg-[#1B241E] text-[#637267] dark:text-[#9CA3AF] border border-[#E9E4D4] dark:border-[#2A382E] hover:border-[#CB5A3C] hover:text-[#CB5A3C]"
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        disabled={beveragePage >= totalBeveragePages}
                        onClick={() => setBeveragePage((p) => Math.min(totalBeveragePages, p + 1))}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#CB5A3C] dark:text-[#FF7D4F] bg-[#CB5A3C]/10 hover:bg-[#CB5A3C] hover:text-white dark:bg-[#FF7D4F]/10 dark:hover:bg-[#FF7D4F] dark:hover:text-black border border-[#CB5A3C]/30 dark:border-[#FF7D4F]/30 transition-all shadow-2xs disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Próxima
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Customization Form & Info */}
            <div className="flex-1 p-4 md:p-5 flex flex-col space-y-4 md:overflow-y-auto">
              {/* Header info */}
              <div>
                <nav className="text-xs sm:text-sm font-semibold mb-1 flex items-center gap-1.5">
                  <span className="text-[#374151] dark:text-[#CBD5E1]">Cardápio</span>
                  <span className="text-[#9CA3AF] dark:text-[#64748B] font-normal">&gt;</span>
                  <span className="text-[#E76F41] font-semibold">{selectedProduct.category_name}</span>
                </nav>
                <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-[#111827] dark:text-[#F9FAFB] pr-6 leading-tight">
                  {selectedProduct.name.replace(/^M\s+/i, '')}
                </h2>
                {selectedProduct.description && (
                  <p className="mt-1.5 text-sm leading-relaxed text-[#374151] dark:text-[#D1D5DB] font-normal">
                    {selectedProduct.description}
                  </p>
                )}
                <div className="mt-2 text-base sm:text-lg font-bold text-[#166534] dark:text-[#4ADE80]">
                  {selectedProduct.sizes && selectedProduct.sizes.length > 1 ? "A partir de " : ""}
                  {formatCurrency(basePrice)}
                </div>
              </div>

              <div className="border-t border-[#ECE7DE] dark:border-[#2A382E]" />

              {/* Section: Escolha de Tamanho (Configurado pelo lojista) */}
              {selectedProduct.sizes && selectedProduct.sizes.length > 1 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#111827] dark:text-[#F9FAFB]">
                      Escolha o Tamanho
                    </h3>
                    <span className="rounded bg-[#FEE2E2] dark:bg-[#451A1A] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#991B1B] dark:text-[#FCA5A5]">
                      Obrigatório
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {selectedProduct.sizes.map((sz) => {
                      const isSelected = selectedSizeId === sz.id
                      const effectivePrice = sz.promo_price_cents || sz.price_cents
                      return (
                        <label
                          key={sz.id}
                          className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 sm:p-3 transition text-xs sm:text-sm ${
                            isSelected
                              ? "border-[#2E6B3E] bg-[#F4F9F5] dark:border-[#4ADE80] dark:bg-[#2A4834] shadow-2xs"
                              : "border-[#E5E7EB] bg-white dark:border-[#2E4A36] dark:bg-[#203627] hover:border-[#D1D5DB] dark:hover:bg-[#253E2D]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="product-size"
                              checked={isSelected}
                              onChange={() => setSelectedSizeId(sz.id)}
                              className="h-4 w-4 accent-[#2E6B3E]"
                            />
                            <span className="font-semibold text-[#111827] dark:text-white">
                              {sz.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {sz.promo_price_cents && (
                              <span className="line-through text-rose-600 dark:text-rose-400 font-semibold text-xs">
                                {formatCurrency(sz.price_cents)}
                              </span>
                            )}
                            <span className="font-bold text-[#166534] dark:text-[#4ADE80]">
                              {formatCurrency(effectivePrice)}
                            </span>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Section: Tamanho da porção legado (se houver e não tiver sizes) */}
              {(!selectedProduct.sizes || selectedProduct.sizes.length === 0) &&
                selectedProduct.portions &&
                selectedProduct.portions.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2922] dark:text-[#F2EFE9]">
                        Tamanho da porção
                      </h3>
                      <span className="rounded bg-[#EAE5DD] dark:bg-[#253528] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#4A534C] dark:text-[#A8B5AB]">
                        Obrigatório
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {selectedProduct.portions.map((portion) => {
                        const isSelected = selectedPortion === portion.id
                        return (
                          <label
                            key={portion.id}
                            className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 transition text-xs ${
                              isSelected
                                ? "border-[#2E6B3E] bg-[#F4F9F5] dark:border-[#4ADE80] dark:bg-[#2A4834]"
                                : "border-[#E8E2D7] bg-white dark:border-[#2E4A36] dark:bg-[#203627] hover:border-[#D5CDBD] dark:hover:bg-[#253E2D]"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="portion"
                                checked={isSelected}
                                onChange={() => setSelectedPortion(portion.id)}
                                className="h-3.5 w-3.5 accent-[#2E6B3E]"
                              />
                              <span className="font-medium text-[#1F2922] dark:text-white">
                                {portion.name}
                              </span>
                            </div>
                            <span className="font-semibold text-[#3C443E] dark:text-[#CBD5E1]">
                              {portion.extra_price_cents > 0
                                ? `+ ${formatCurrency(portion.extra_price_cents)}`
                                : "Incluso"}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

              {/* Section: Ponto da proteína (se houver) */}
              {selectedProduct.proteins && selectedProduct.proteins.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2922] dark:text-[#F2EFE9]">
                      Escolha a proteína
                    </h3>
                    <span className="rounded bg-[#EAE5DD] dark:bg-[#253528] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#4A534C] dark:text-[#A8B5AB]">
                      Obrigatório
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {selectedProduct.proteins.map((prot) => {
                      const isSelected = selectedProtein === prot.id
                      return (
                        <label
                          key={prot.id}
                          className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 transition text-xs ${
                            isSelected
                              ? "border-[#2E6B3E] bg-[#F4F9F5] dark:border-[#4ADE80] dark:bg-[#2A4834]"
                              : "border-[#E8E2D7] bg-white dark:border-[#2E4A36] dark:bg-[#203627] hover:border-[#D5CDBD] dark:hover:bg-[#253E2D]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="protein"
                              checked={isSelected}
                              onChange={() => setSelectedProtein(prot.id)}
                              className="h-3.5 w-3.5 accent-[#2E6B3E]"
                            />
                            <span className="font-medium text-[#1F2922] dark:text-white">
                              {prot.name}
                            </span>
                          </div>
                          <span className="font-semibold text-[#3C443E] dark:text-[#CBD5E1]">
                            {prot.extra_price_cents > 0
                              ? `+ ${formatCurrency(prot.extra_price_cents)}`
                              : "Incluso"}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Section: Remover ingredientes (se houver) */}
              {selectedProduct.removable_ingredients &&
                selectedProduct.removable_ingredients.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2922] dark:text-[#F2EFE9]">
                        Remover ingredientes
                      </h3>
                      <span className="rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Opcional
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProduct.removable_ingredients.map((ing) => {
                        const isRemoved = removedIngredients.includes(ing)
                        return (
                          <button
                            key={ing}
                            type="button"
                            onClick={() => toggleRemoved(ing)}
                            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                              isRemoved
                                ? "bg-[#CB5A3C] text-white shadow-2xs"
                                : "border border-[#DED7CB] dark:border-[#2E4A36] bg-white dark:bg-[#203627] text-[#4A534B] dark:text-[#E2E8F0] hover:bg-[#F7F5F0] dark:hover:bg-[#253E2D]"
                            }`}
                          >
                            <X className="h-3 w-3" />
                            <span>{ing}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

              {/* Section: Produto Principal & Quantidade */}
              <div className="rounded-xl border border-[#E5E7EB] dark:border-[#2E4A36] bg-[#FAF8F5] dark:bg-[#203627] p-3 sm:p-3.5 flex items-center justify-between shadow-2xs">
                <div className="flex flex-col min-w-0 pr-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#E76F41] dark:text-[#FF7D4F]">
                    Produto Principal
                  </span>
                  <span className="text-sm font-semibold text-[#111827] dark:text-white truncate">
                    {selectedProduct.name.replace(/^M\s+/i, '')}
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-full border border-[#D1D5DB] dark:border-[#3A5C44] bg-white dark:bg-[#284933] px-3 py-1.5 shadow-2xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[#1F2922] dark:text-[#F3F4F6] transition hover:bg-[#F3F4F6] dark:hover:bg-[#345A3E] disabled:opacity-30 cursor-pointer"
                    aria-label="Diminuir quantidade"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-6 text-center text-sm font-bold text-[#111827] dark:text-white">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[#1F2922] dark:text-[#F3F4F6] transition hover:bg-[#F3F4F6] dark:hover:bg-[#345A3E] cursor-pointer"
                    aria-label="Aumentar quantidade"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Section: Adicionais e complementos */}
              {selectedProduct.complements && selectedProduct.complements.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#111827] dark:text-[#F9FAFB]">
                      Adicionais e complementos
                    </h3>
                    <span className="rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Opcional
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {selectedProduct.complements.map((comp) => {
                      const isSelected = selectedComplements.some((c) => c.id === comp.id)
                      return (
                        <label
                          key={comp.id}
                          className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 sm:p-3 transition ${
                            isSelected
                              ? "border-[#2E6B3E] bg-[#F4F9F5] dark:border-[#4ADE80] dark:bg-[#2A4834] shadow-2xs"
                              : "border-[#E5E7EB] bg-white dark:border-[#2E4A36] dark:bg-[#203627] hover:border-[#D1D5DB] dark:hover:bg-[#253E2D]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleComplement(comp)}
                              className="h-4 w-4 rounded-sm accent-[#2E6B3E] shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="text-sm font-semibold text-[#111827] dark:text-white block truncate">
                                {comp.name}
                              </span>
                              {comp.description && (
                                <span className="text-xs font-medium text-[#4B5563] dark:text-[#CBD5E1] block truncate">
                                  {comp.description}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm font-bold text-[#166534] dark:text-[#4ADE80] shrink-0 ml-2">
                            + {formatCurrency(comp.price_cents)}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Section: Bebidas (Versão Mobile no fluxo de rolagem) */}
              {availableBeverages.length > 0 && (
                <div className="flex md:hidden flex-col gap-2 pt-2 border-t border-[#ECE7DE] dark:border-[#2A382E]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2922] dark:text-[#F2EFE9]">
                      Bebidas
                    </h3>
                    <span className="rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Opcional
                    </span>
                  </div>

                  {/* Campo de pesquisa de nome (sem ícones) */}
                  <div>
                    <input
                      type="text"
                      value={beverageSearch}
                      onChange={(e) => {
                        setBeverageSearch(e.target.value)
                        setBeveragePage(1)
                      }}
                      placeholder="Buscar bebida..."
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#203627] border border-[#E8E2D5] dark:border-[#2E4A36] rounded-lg text-[#1F2922] dark:text-[#F2EFE9] placeholder-[#9CA3AF] dark:placeholder-[#A0B0A4] focus:outline-hidden focus:border-[#2E6B3E] dark:focus:border-[#4ADE80] transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {paginatedBeverages.length === 0 ? (
                      <div className="text-center py-3 text-xs text-gray-400 dark:text-gray-400">
                        Nenhuma bebida encontrada
                      </div>
                    ) : (
                      paginatedBeverages.map((bev) => {
                        const qty = selectedBeverageQuantities[bev.id] || 0
                        const isSelected = qty > 0
                        return (
                          <div
                            key={bev.id}
                            onClick={() => {
                              if (qty === 0) {
                                handleUpdateBeverageQty(bev.id, 1)
                              }
                            }}
                            className={`flex items-center justify-between p-2 rounded-xl border text-left transition-all gap-2 cursor-pointer ${
                              isSelected
                                ? "border-[#2E6B3E] bg-[#F4F9F5] dark:border-[#4ADE80] dark:bg-[#2A4834] shadow-2xs"
                                : "border-[#E8E2D5] bg-white dark:border-[#2E4A36] dark:bg-[#203627] hover:border-[#CBD5E1] dark:hover:bg-[#253E2D]"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {bev.image_url ? (
                                <img
                                  src={bev.image_url}
                                  alt={bev.name}
                                  className="w-8 h-8 rounded-lg object-cover shrink-0 bg-[#FAF8F5] border border-[#ECE7DE] dark:border-[#2E4A36]"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] dark:bg-[#253E2D] border border-[#ECE7DE] dark:border-[#2E4A36] shrink-0" />
                              )}
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-xs font-bold text-[#1F2922] dark:text-[#F2EFE9] leading-tight break-words">
                                  {bev.name}
                                </span>
                                {bev.volume && (
                                  <span className="text-[10px] text-gray-500 dark:text-[#A0B0A4] font-medium leading-none mt-0.5">
                                    {bev.volume}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Preço e Seletor de Quantidade (- e +) */}
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[11px] font-bold ${isSelected ? "text-[#166534] dark:text-[#4ADE80]" : "text-[#4B5563] dark:text-[#CBD5E1]"}`}>
                                + {formatCurrency(bev.price_cents)}
                              </span>
                              <div className="flex items-center gap-1 rounded-lg border border-[#DED7CB] dark:border-[#2E4A36] bg-[#FAF8F5] dark:bg-[#1A2E20] px-1.5 py-0.5">
                                <button
                                  type="button"
                                  disabled={qty <= 0}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleUpdateBeverageQty(bev.id, -1)
                                  }}
                                  className="text-[#68706A] dark:text-[#CBD5E1] hover:text-black dark:hover:text-white disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer p-0.5"
                                  title="Diminuir"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className={`text-xs font-bold min-w-[14px] text-center ${isSelected ? "text-[#166534] dark:text-[#4ADE80]" : "text-gray-400 dark:text-[#A0B0A4]"}`}>
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleUpdateBeverageQty(bev.id, 1)
                                  }}
                                  className="text-[#68706A] dark:text-[#CBD5E1] hover:text-[#CB5A3C] dark:hover:text-[#FF7D4F] cursor-pointer p-0.5"
                                  title="Aumentar"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Paginação de Bebidas no Mobile no padrão DeliPlus (em laranja, sem vazar do container) */}
                  {totalBeveragePages > 1 && (
                    <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-[#ECE7DE] dark:border-[#2A382E] text-[11px] shrink-0 w-full">
                      <button
                        type="button"
                        disabled={beveragePage <= 1}
                        onClick={() => setBeveragePage((p) => Math.max(1, p - 1))}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#CB5A3C] dark:text-[#FF7D4F] bg-[#CB5A3C]/10 hover:bg-[#CB5A3C] hover:text-white dark:bg-[#FF7D4F]/10 dark:hover:bg-[#FF7D4F] dark:hover:text-black border border-[#CB5A3C]/30 dark:border-[#FF7D4F]/30 transition-all shadow-2xs disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Anterior
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalBeveragePages }).map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setBeveragePage(i + 1)}
                            className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                              beveragePage === i + 1
                                ? "bg-[#CB5A3C] text-white shadow-sm"
                                : "bg-white dark:bg-[#203627] text-[#637267] dark:text-[#E2E8F0] border border-[#E9E4D4] dark:border-[#2E4A36] hover:border-[#CB5A3C] hover:text-[#CB5A3C]"
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        disabled={beveragePage >= totalBeveragePages}
                        onClick={() => setBeveragePage((p) => Math.min(totalBeveragePages, p + 1))}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#CB5A3C] dark:text-[#FF7D4F] bg-[#CB5A3C]/10 hover:bg-[#CB5A3C] hover:text-white dark:bg-[#FF7D4F]/10 dark:hover:bg-[#FF7D4F] dark:hover:text-black border border-[#CB5A3C]/30 dark:border-[#FF7D4F]/30 transition-all shadow-2xs disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Próxima
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Section: Observações para a cozinha */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#111827] dark:text-[#F9FAFB]">
                    Observações para a cozinha
                  </h3>
                  <span className="text-xs font-semibold text-[#4B5563] dark:text-[#CBD5E1]">
                    {notes.length}/120
                  </span>
                </div>
                <textarea
                  value={notes}
                  maxLength={120}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: tirar o sal, molho à parte, enviar talher descartável..."
                  className="w-full rounded-xl border border-[#D1D5DB] dark:border-[#2E4A36] bg-[#FAF8F5] dark:bg-[#203627] p-3 text-sm font-medium text-[#111827] dark:text-white placeholder-[#6B7280] dark:placeholder-[#A0B0A4] outline-hidden focus:border-[#2E6B3E] dark:focus:border-[#4ADE80] focus:bg-white dark:focus:bg-[#203627] focus:ring-1 focus:ring-[#2E6B3E]"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Sticky Modal Footer */}
          <div className="shrink-0 border-t border-[#E5E7EB] dark:border-[#2A382E] bg-white dark:bg-[#141C16] p-3 px-4 sm:px-5">
            <button
              onClick={handleAdd}
              className="w-full flex items-center justify-between rounded-xl bg-[#1B2A20] hover:bg-[#273B2E] dark:bg-[#2E4233] dark:hover:bg-[#3B5441] px-5 sm:px-6 py-3.5 text-sm sm:text-base font-semibold text-white shadow-md transition cursor-pointer"
            >
              <span>Adicionar ao carrinho</span>
              <span className="flex items-center gap-2">
                <span className="text-white/60">•</span>
                <span className="text-[#86EFAC] font-bold">{formatCurrency(grandTotalCents)}</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* LIGHTBOX FULLSCREEN ZOOM OVERLAY COM NAVEGAÇÃO E SETAS VISÍVEIS */}
      {/* ============================================================== */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-60 flex flex-col items-center justify-center bg-black/92 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setIsZoomOpen(false)}
        >
          {/* Top Bar with title and Close Button */}
          <div
            className="absolute top-4 inset-x-4 md:inset-x-8 flex items-center justify-between text-white z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="font-serif text-base md:text-lg font-bold">{selectedProduct.name}</span>
              {galleryImages.length > 1 && (
                <span className="text-xs text-gray-300 bg-white/15 px-2.5 py-0.5 rounded-full font-medium">
                  {activeImageIndex + 1} de {galleryImages.length}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="h-9 w-9 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Fechar zoom"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Main Large Image */}
          <div
            className="relative max-w-4xl max-h-[75vh] flex items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeImage}
              alt={selectedProduct.name}
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl transition-all duration-300 select-none"
            />

            {/* Setas Visíveis e Destacadas nas laterais no modo Zoom */}
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))
                  }}
                  className="absolute left-2 md:-left-16 top-1/2 -translate-y-1/2 h-11 w-11 md:h-12 md:w-12 rounded-full bg-black/70 hover:bg-black/90 md:bg-white/20 md:hover:bg-white/40 text-white flex items-center justify-center shadow-xl transition cursor-pointer"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))
                  }}
                  className="absolute right-2 md:-right-16 top-1/2 -translate-y-1/2 h-11 w-11 md:h-12 md:w-12 rounded-full bg-black/70 hover:bg-black/90 md:bg-white/20 md:hover:bg-white/40 text-white flex items-center justify-center shadow-xl transition cursor-pointer"
                  aria-label="Próxima foto"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails na base do Zoom */}
          {galleryImages.length > 1 && (
            <div
              className="absolute bottom-4 flex items-center gap-2 overflow-x-auto p-2 rounded-xl bg-black/50 backdrop-blur-xs max-w-sm z-20"
              onClick={(e) => e.stopPropagation()}
            >
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`h-11 w-11 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    idx === activeImageIndex
                      ? "border-[#4ADE80] scale-105 shadow-md"
                      : "border-white/30 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
