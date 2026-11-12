"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import { X, Plus, Minus, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react"
import { StorefrontComplement, StorefrontProduct } from "@/types/storefront"
import { normalizeSearch } from "@/lib/utils"
import { StorefrontImage } from "./storefront-image"

export interface StorefrontBeverageItem {
  id: string
  name: string
  volume: string
  price_cents: number
  image_url?: string
}

function BeverageItemRow({
  bev,
  qty,
  formatCurrency,
  onUpdateQty,
}: {
  bev: StorefrontBeverageItem
  qty: number
  formatCurrency: (cents: number) => string
  onUpdateQty: (bevId: string, delta: number) => void
}) {
  const isSelected = qty > 0
  return (
    <div
      className={`flex items-center justify-between p-1.5 px-2 rounded-xl border text-left transition-all gap-1.5 ${
        isSelected
          ? "border-[#2E6B3E] bg-[#F4F9F5] dark:border-[#4ADE80] dark:bg-[#2A4834] shadow-2xs"
          : "border-[#E2DDD3] bg-[#F6F4EE] dark:border-[#2E4A36] dark:bg-[#203627] hover:border-[#D5CDBD] hover:bg-[#EFECE5] dark:hover:bg-[#253E2D]"
      }`}
    >
      <button
        type="button"
        onClick={() => {
          if (qty === 0) {
            onUpdateQty(bev.id, 1)
          }
        }}
        className="flex min-h-9 lg:min-h-8 items-center gap-2 min-w-0 flex-1 text-left cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6B3E]"
        aria-label={qty === 0 ? `Adicionar ${bev.name}` : bev.name}
      >
        <StorefrontImage
          src={bev.image_url}
          alt={bev.name}
          variant="drink"
          className="w-8 h-8 rounded-lg object-cover shrink-0 bg-[#FAF8F5] border border-[#ECE7DE] dark:border-[#2E4A36]"
          fallbackClassName="w-8 h-8 rounded-lg shrink-0 border border-[#ECE7DE] dark:border-[#2E4A36]"
          iconClassName="h-4 w-4"
        />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[11px] font-bold text-[#1F2922] dark:text-[#F2EFE9] leading-tight line-clamp-2">
            {bev.name}
          </span>
          {bev.volume && (
            <span className="text-[10px] text-[#525A54] dark:text-[#A0B0A4] font-medium leading-none mt-0.5 truncate">
              {bev.volume}
            </span>
          )}
        </div>
      </button>

      {/* Preço e Seletor de Quantidade (- e +) */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`text-[11px] font-bold whitespace-nowrap ${isSelected ? "text-[#166534] dark:text-[#4ADE80]" : "text-[#4B5563] dark:text-[#CBD5E1]"}`}>
          + {formatCurrency(bev.price_cents)}
        </span>
        <div className="flex items-center gap-0.5 rounded-lg border border-[#DED7CB] dark:border-[#2E4A36] bg-[#FAF8F5] dark:bg-[#1A2E20] px-0.5 py-0.5">
          <button
            type="button"
            disabled={qty <= 0}
            onClick={() => onUpdateQty(bev.id, -1)}
            className="h-9 w-9 min-h-9 min-w-9 lg:h-7 lg:w-7 lg:min-h-7 lg:min-w-7 flex items-center justify-center rounded-md text-[#4A534C] dark:text-[#CBD5E1] hover:text-black dark:hover:text-white disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6B3E]"
            aria-label={`Diminuir quantidade de ${bev.name}`}
            title="Diminuir"
          >
            <Minus className="h-3.5 w-3.5 lg:h-3 lg:w-3" />
          </button>
          <span className={`text-xs font-bold min-w-[14px] text-center ${isSelected ? "text-[#166534] dark:text-[#4ADE80]" : "text-[#59615B] dark:text-[#A0B0A4]"}`}>
            {qty}
          </span>
          <button
            type="button"
            onClick={() => onUpdateQty(bev.id, 1)}
            className="h-9 w-9 min-h-9 min-w-9 lg:h-7 lg:w-7 lg:min-h-7 lg:min-w-7 flex items-center justify-center rounded-md text-[#4A534C] dark:text-[#CBD5E1] hover:text-[#B4482D] dark:hover:text-[#FF7D4F] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6B3E]"
            aria-label={`Aumentar quantidade de ${bev.name}`}
            title="Aumentar"
          >
            <Plus className="h-3.5 w-3.5 lg:h-3 lg:w-3" />
          </button>
        </div>
      </div>
    </div>
  )
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
  const [beveragesPerPage, setBeveragesPerPage] = useState(5)
  const beverageListRef = useRef<HTMLDivElement>(null)

  // Adapta dinamicamente o número de bebidas para preencher o container sem deixar espaço em branco
  useEffect(() => {
    if (!selectedProduct || activeModal !== "product-detail") return

    const updateBeveragesPerPage = () => {
      // Mobile / Tablet (< 1024px): 4 bebidas mantêm o fluxo do modal equilibrado
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        setBeveragesPerPage(4)
        return
      }

      // Desktop (>= 1024px): mede a altura real disponível no container
      if (beverageListRef.current) {
        const h = beverageListRef.current.clientHeight
        if (h > 60) {
          // Cada card com controles >= 36px tem ~56px de altura + 6px de gap = ~62px
          const calculated = Math.floor((h + 6) / 62)
          setBeveragesPerPage(Math.max(3, calculated))
          return
        }
      }

      // Fallback baseado na altura da tela se o ref ainda estiver estabilizando
      if (typeof window !== "undefined") {
        const winH = window.innerHeight
        if (winH >= 950) {
          setBeveragesPerPage(6)
        } else if (winH >= 800) {
          setBeveragesPerPage(5)
        } else {
          setBeveragesPerPage(4)
        }
      }
    }

    updateBeveragesPerPage()
    const timer = setTimeout(updateBeveragesPerPage, 80)

    let observer: ResizeObserver | null = null
    if (beverageListRef.current && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        updateBeveragesPerPage()
      })
      observer.observe(beverageListRef.current)
    }

    window.addEventListener("resize", updateBeveragesPerPage)
    return () => {
      clearTimeout(timer)
      window.removeEventListener("resize", updateBeveragesPerPage)
      if (observer) observer.disconnect()
    }
  }, [selectedProduct?.id, activeModal])

  const filteredBeverages = useMemo(() => {
    const q = normalizeSearch(beverageSearch)
    if (!q) return availableBeverages
    return availableBeverages.filter(
      (b) =>
        normalizeSearch(b.name).includes(q) ||
        (b.volume && normalizeSearch(b.volume).includes(q))
    )
  }, [availableBeverages, beverageSearch])

  const totalBeveragePages = Math.max(1, Math.ceil(filteredBeverages.length / beveragesPerPage))

  const paginatedBeverages = useMemo(() => {
    const start = (beveragePage - 1) * beveragesPerPage
    return filteredBeverages.slice(start, start + beveragesPerPage)
  }, [filteredBeverages, beveragePage, beveragesPerPage])

  // Ajusta a página atual se a quantidade de páginas mudar
  useEffect(() => {
    if (beveragePage > totalBeveragePages) {
      setBeveragePage(1)
    }
  }, [totalBeveragePages, beveragePage])

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
  const isDrinkProduct = normalizeSearch(selectedProduct.category_name || "").includes("bebid")

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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 pt-safe pb-safe backdrop-blur-xs"
        onClick={handleCloseModal}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selectedProduct.name}
          className="relative flex w-full max-w-xl sm:max-lg:ultrashort:max-w-2xl lg:max-w-[840px] flex-col overflow-hidden bg-white dark:bg-[#17211A] text-[#1F2922] dark:text-[#F2EFE9] shadow-2xl rounded-2xl border border-[#ECE7DE] dark:border-[#2A382E] max-h-[92dvh] lg:max-h-[90dvh] ultrashort:max-h-[94dvh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile/Tablet Header Bar (< lg): in-flow para nunca sobrepor o conteúdo ao rolar */}
          <div className="flex lg:hidden items-center justify-between gap-2 px-3.5 sm:px-4 py-2 ultrashort:py-1.5 border-b border-[#ECE7DE] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#141C16] shrink-0">
            <nav className="text-xs font-semibold flex items-center gap-1.5 min-w-0 truncate">
              <span className="text-[#374151] dark:text-[#CBD5E1]">Cardápio</span>
              <span className="text-[#6B7280] dark:text-[#94A3B8] font-normal">&gt;</span>
              <span className="text-[#B4482D] dark:text-[#FF7D4F] font-semibold truncate">{selectedProduct.category_name}</span>
            </nav>
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex h-9 w-9 min-h-9 min-w-9 shrink-0 items-center justify-center rounded-full bg-white dark:bg-[#1F2B22] text-[#3C443E] dark:text-[#E2DED6] shadow-2xs transition hover:bg-[#EAE5DD] dark:hover:bg-[#28382C] hover:text-black dark:hover:text-white border border-[#E8E2D5] dark:border-[#2A382E] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6B3E] dark:focus-visible:ring-[#4ADE80]"
              aria-label="Fechar modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Modal Body: 1 coluna rolável até tablet (< lg), 2 colunas em landscape mobile (sm:max-lg:ultrashort) e desktop (>= lg) */}
          <div className="flex flex-col sm:max-lg:ultrashort:flex-row lg:flex-row flex-1 overflow-y-auto sm:max-lg:ultrashort:overflow-y-hidden lg:overflow-y-hidden min-h-0 storefront-scrollbar">
            {/* Left: Food Gallery Showcase & Cross-sell de Bebidas */}
            <div className="sm:max-lg:ultrashort:w-[216px] md:max-lg:ultrashort:w-[240px] lg:w-[320px] xl:w-[348px] shrink-0 bg-[#FAF8F5] dark:bg-[#131A15] p-3 sm:p-4 sm:max-lg:ultrashort:p-2.5 short:lg:p-3 border-b sm:max-lg:ultrashort:border-b-0 sm:max-lg:ultrashort:border-r lg:border-b-0 lg:border-r border-[#ECE7DE] dark:border-[#2A382E] flex flex-col gap-2.5 short:lg:gap-2 sm:max-lg:ultrashort:overflow-y-auto lg:overflow-y-auto storefront-scrollbar">
              {/* Main Active Photo with Zoom trigger & Always Visible Navigation Arrows */}
              <div className="relative shrink-0 w-full aspect-[4/3] max-h-48 sm:max-h-56 max-sm:ultrashort:h-32 sm:max-lg:ultrashort:h-[136px] max-lg:ultrashort:aspect-auto lg:aspect-[16/11] lg:max-h-none short:lg:aspect-[16/10] ultrashort:lg:h-[156px] ultrashort:lg:aspect-auto rounded-xl overflow-hidden bg-white dark:bg-[#1B241E] border border-[#E8E2D5] dark:border-[#2A382E] shadow-2xs flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(true)}
                  className="block h-full w-full cursor-zoom-in group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2E6B3E]"
                  aria-label={`Ampliar imagem de ${selectedProduct.name}`}
                  title="Clique para dar zoom na imagem"
                >
                  <StorefrontImage
                    src={activeImage}
                    alt={selectedProduct.name}
                    variant={isDrinkProduct ? "drink" : "food"}
                    className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    fallbackClassName="h-full w-full"
                    iconClassName="h-10 w-10"
                    loading="eager"
                  />

                  {/* Badge Zoom Indicator */}
                  <span className="absolute right-2 bottom-2 rounded-md bg-black/70 backdrop-blur-xs text-white px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1 shadow-xs pointer-events-none transition group-hover:bg-black/85">
                    <ZoomIn className="w-3 h-3" />
                    <span>Ampliar</span>
                  </span>
                </button>

                {/* Always Visible Left & Right Arrows */}
                {galleryImages.length > 1 && (
                  <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))
                      }}
                      className="pointer-events-auto h-9 w-9 min-h-9 min-w-9 rounded-full bg-black/65 hover:bg-black/85 text-white flex items-center justify-center shadow-md transition cursor-pointer backdrop-blur-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
                      className="pointer-events-auto h-9 w-9 min-h-9 min-w-9 rounded-full bg-black/65 hover:bg-black/85 text-white flex items-center justify-center shadow-md transition cursor-pointer backdrop-blur-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      aria-label="Próxima foto"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Thumbnail Strip (up to 5 thumbnails) */}
              {galleryImages.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 w-full shrink-0">
                  {galleryImages.map((imgUrl, idx) => {
                    const isActive = idx === activeImageIndex
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        aria-label={`Selecionar foto ${idx + 1} de ${selectedProduct.name}`}
                        className={`relative h-10 w-10 min-h-10 min-w-10 lg:h-11 lg:w-11 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6B3E] ${
                          isActive
                            ? "border-[#2E6B3E] dark:border-[#4ADE80] ring-1 ring-[#2E6B3E]/30 scale-102"
                            : "border-[#E8E2D5] dark:border-[#2A382E] opacity-75 hover:opacity-100"
                        }`}
                      >
                        <StorefrontImage
                          src={imgUrl}
                          alt={`${selectedProduct.name} - foto ${idx + 1}`}
                          variant={isDrinkProduct ? "drink" : "food"}
                          className="h-full w-full object-cover object-center"
                          fallbackClassName="h-full w-full"
                          iconClassName="h-4 w-4"
                        />
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Section: Bebidas (Cross-sell exclusivo Deli - visível na coluna esquerda em desktop >= lg) */}
              {availableBeverages.length > 0 && (
                <div className="hidden lg:flex mt-1.5 short:mt-0.5 pt-2.5 short:pt-2 border-t border-[#ECE7DE] dark:border-[#2A382E] flex-col gap-1.5 flex-1 short:flex-none min-h-0">
                  <div className="flex items-center justify-between shrink-0">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2922] dark:text-[#F2EFE9]">
                      Bebidas
                    </h3>
                    <span className="rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
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
                      aria-label="Buscar bebida"
                      placeholder="Buscar bebida..."
                      className="w-full px-2.5 py-1 min-h-8 text-base lg:text-xs bg-[#F6F4EE] dark:bg-[#203627] border border-[#E2DDD3] dark:border-[#2E4A36] rounded-lg text-[#1F2922] dark:text-[#F2EFE9] placeholder-[#5D645E] dark:placeholder-[#9CA79E] focus:outline-hidden focus:border-[#2E6B3E] dark:focus:border-[#4ADE80] transition-colors"
                    />
                  </div>

                  {/* Lista de Bebidas */}
                  <div ref={beverageListRef} className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto storefront-scrollbar pr-0.5">
                    {paginatedBeverages.length === 0 ? (
                      <div className="text-center py-3 text-xs text-[#59615B] dark:text-[#9CA79E]">
                        Nenhuma bebida encontrada
                      </div>
                    ) : (
                      paginatedBeverages.map((bev) => (
                        <BeverageItemRow
                          key={bev.id}
                          bev={bev}
                          qty={selectedBeverageQuantities[bev.id] || 0}
                          formatCurrency={formatCurrency}
                          onUpdateQty={handleUpdateBeverageQty}
                        />
                      ))
                    )}
                  </div>

                  {/* Paginação de Bebidas */}
                  {totalBeveragePages > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 border-t border-[#ECE7DE] dark:border-[#2A382E] text-[11px] shrink-0 w-full">
                      <button
                        type="button"
                        disabled={beveragePage <= 1}
                        onClick={() => setBeveragePage((p) => Math.max(1, p - 1))}
                        className="min-h-9 px-2.5 py-1 rounded-lg text-xs font-bold text-[#B4482D] dark:text-[#FF7D4F] bg-[#B4482D]/10 hover:bg-[#B4482D] hover:text-white dark:bg-[#FF7D4F]/10 dark:hover:bg-[#FF7D4F] dark:hover:text-black border border-[#B4482D]/30 dark:border-[#FF7D4F]/30 transition-all shadow-2xs disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Anterior
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalBeveragePages }).map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setBeveragePage(i + 1)}
                            aria-label={`Página ${i + 1} de bebidas`}
                            className={`h-9 min-w-9 px-2 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                              beveragePage === i + 1
                                ? "bg-[#B4482D] text-white shadow-sm"
                                : "bg-[#F6F4EE] dark:bg-[#1B241E] text-[#4A534C] dark:text-[#CBD5E1] border border-[#E2DDD3] dark:border-[#2A382E] hover:border-[#B4482D] hover:text-[#B4482D]"
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
                        className="min-h-9 px-2.5 py-1 rounded-lg text-xs font-bold text-[#B4482D] dark:text-[#FF7D4F] bg-[#B4482D]/10 hover:bg-[#B4482D] hover:text-white dark:bg-[#FF7D4F]/10 dark:hover:bg-[#FF7D4F] dark:hover:text-black border border-[#B4482D]/30 dark:border-[#FF7D4F]/30 transition-all shadow-2xs disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Próxima
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Customization Form & Info */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              {/* Top Breadcrumb + Desktop Close Button Bar (in-flow para nunca sobrepor preços ao rolar) */}
              <div className="hidden lg:flex items-center justify-between gap-2 px-4 md:px-5 pt-3.5 pb-2 short:lg:pt-2.5 short:lg:pb-1.5 border-b border-[#ECE7DE]/60 dark:border-[#2A382E]/60 shrink-0">
                <nav className="text-xs font-semibold flex items-center gap-1.5 min-w-0 truncate">
                  <span className="text-[#374151] dark:text-[#CBD5E1]">Cardápio</span>
                  <span className="text-[#6B7280] dark:text-[#94A3B8] font-normal">&gt;</span>
                  <span className="text-[#B4482D] dark:text-[#FF7D4F] font-semibold truncate">{selectedProduct.category_name}</span>
                </nav>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="hidden lg:flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F6F4EE] dark:bg-[#1F2B22] text-[#3C443E] dark:text-[#E2DED6] transition hover:bg-[#EAE5DD] dark:hover:bg-[#28382C] hover:text-black dark:hover:text-white border border-[#E8E2D5] dark:border-[#2A382E] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6B3E] dark:focus-visible:ring-[#4ADE80]"
                  aria-label="Fechar modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 p-4 md:p-5 sm:max-lg:ultrashort:p-3 short:lg:p-3.5 ultrashort:lg:p-3 flex flex-col space-y-3.5 sm:max-lg:ultrashort:space-y-2.5 short:lg:space-y-2.5 sm:max-lg:ultrashort:overflow-y-auto lg:overflow-y-auto storefront-scrollbar min-h-0">
                {/* Header info */}
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl lg:text-[26px] short:lg:text-xl ultrashort:lg:text-lg font-bold tracking-tight text-[#111827] dark:text-[#F9FAFB] leading-tight">
                    {selectedProduct.name.replace(/^M\s+/i, '')}
                  </h2>
                  {selectedProduct.description && (
                    <p className="mt-1 text-xs sm:text-sm short:lg:text-xs leading-relaxed text-[#374151] dark:text-[#D1D5DB] font-normal">
                      {selectedProduct.description}
                    </p>
                  )}
                  <div className="mt-1.5 text-sm sm:text-base short:lg:text-sm font-bold text-[#166534] dark:text-[#4ADE80]">
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
                          className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 sm:p-3 short:lg:p-2 transition text-xs sm:text-sm short:lg:text-xs ${
                            isSelected
                              ? "border-[#2E6B3E] bg-[#F4F9F5] dark:border-[#4ADE80] dark:bg-[#2A4834] shadow-2xs"
                              : "border-[#E2DDD3] bg-[#F6F4EE] dark:border-[#2E4A36] dark:bg-[#203627] hover:border-[#D5CDBD] hover:bg-[#EFECE5] dark:hover:bg-[#253E2D]"
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
                                : "border-[#E2DDD3] bg-[#F6F4EE] dark:border-[#2E4A36] dark:bg-[#203627] hover:border-[#D5CDBD] hover:bg-[#EFECE5] dark:hover:bg-[#253E2D]"
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
                              : "border-[#E2DDD3] bg-[#F6F4EE] dark:border-[#2E4A36] dark:bg-[#203627] hover:border-[#D5CDBD] hover:bg-[#EFECE5] dark:hover:bg-[#253E2D]"
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
                            className={`flex items-center gap-1 rounded-full px-3 py-1.5 min-h-9 text-xs font-medium transition cursor-pointer ${
                              isRemoved
                                ? "bg-[#B4482D] text-white shadow-2xs"
                                : "border border-[#E2DDD3] dark:border-[#2E4A36] bg-[#F6F4EE] dark:bg-[#203627] text-[#4A534B] dark:text-[#E2E8F0] hover:bg-[#EFECE5] dark:hover:bg-[#253E2D]"
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
              <div className="rounded-xl border border-[#E5E7EB] dark:border-[#2E4A36] bg-[#FAF8F5] dark:bg-[#203627] p-3 sm:p-3.5 short:lg:p-2.5 flex items-center justify-between shadow-2xs">
                <div className="flex flex-col min-w-0 pr-3">
                  <span className="text-[11px] short:lg:text-[10px] font-bold uppercase tracking-wider text-[#B4482D] dark:text-[#FF7D4F]">
                    Produto Principal
                  </span>
                  <span className="text-sm short:lg:text-xs font-semibold text-[#111827] dark:text-white truncate">
                    {selectedProduct.name.replace(/^M\s+/i, '')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-[#D1D5DB] dark:border-[#3A5C44] bg-white dark:bg-[#284933] px-1.5 py-1 short:lg:py-0.5 shadow-2xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="flex h-9 w-9 min-h-9 min-w-9 lg:h-7 lg:w-7 lg:min-h-7 lg:min-w-7 items-center justify-center rounded-full text-[#1F2922] dark:text-[#F3F4F6] transition hover:bg-[#F3F4F6] dark:hover:bg-[#345A3E] disabled:opacity-30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6B3E]"
                    aria-label="Diminuir quantidade"
                  >
                    <Minus className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                  </button>
                  <span className="min-w-6 text-center text-sm short:lg:text-xs font-bold text-[#111827] dark:text-white">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-9 w-9 min-h-9 min-w-9 lg:h-7 lg:w-7 lg:min-h-7 lg:min-w-7 items-center justify-center rounded-full text-[#1F2922] dark:text-[#F3F4F6] transition hover:bg-[#F3F4F6] dark:hover:bg-[#345A3E] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6B3E]"
                    aria-label="Aumentar quantidade"
                  >
                    <Plus className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
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
                              : "border-[#E2DDD3] bg-[#F6F4EE] dark:border-[#2E4A36] dark:bg-[#203627] hover:border-[#D5CDBD] hover:bg-[#EFECE5] dark:hover:bg-[#253E2D]"
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

              {/* Section: Bebidas (Versão Mobile/Tablet/Landscape < lg no fluxo de rolagem) */}
              {availableBeverages.length > 0 && (
                <div className="flex lg:hidden flex-col gap-2 pt-2 border-t border-[#ECE7DE] dark:border-[#2A382E]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2922] dark:text-[#F2EFE9]">
                      Bebidas
                    </h3>
                    <span className="rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
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
                      aria-label="Buscar bebida"
                      placeholder="Buscar bebida..."
                      className="w-full px-3 py-2 min-h-10 text-base lg:text-sm bg-[#F6F4EE] dark:bg-[#203627] border border-[#E2DDD3] dark:border-[#2E4A36] rounded-lg text-[#1F2922] dark:text-[#F2EFE9] placeholder-[#5D645E] dark:placeholder-[#9CA79E] focus:outline-hidden focus:border-[#2E6B3E] dark:focus:border-[#4ADE80] transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {paginatedBeverages.length === 0 ? (
                      <div className="text-center py-3 text-xs text-[#59615B] dark:text-[#9CA79E]">
                        Nenhuma bebida encontrada
                      </div>
                    ) : (
                      paginatedBeverages.map((bev) => (
                        <BeverageItemRow
                          key={bev.id}
                          bev={bev}
                          qty={selectedBeverageQuantities[bev.id] || 0}
                          formatCurrency={formatCurrency}
                          onUpdateQty={handleUpdateBeverageQty}
                        />
                      ))
                    )}
                  </div>

                  {/* Paginação de Bebidas no Mobile/Tablet */}
                  {totalBeveragePages > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 border-t border-[#ECE7DE] dark:border-[#2A382E] text-[11px] shrink-0 w-full">
                      <button
                        type="button"
                        disabled={beveragePage <= 1}
                        onClick={() => setBeveragePage((p) => Math.max(1, p - 1))}
                        className="min-h-9 px-3 py-1 rounded-lg text-xs font-bold text-[#B4482D] dark:text-[#FF7D4F] bg-[#B4482D]/10 hover:bg-[#B4482D] hover:text-white dark:bg-[#FF7D4F]/10 dark:hover:bg-[#FF7D4F] dark:hover:text-black border border-[#B4482D]/30 dark:border-[#FF7D4F]/30 transition-all shadow-2xs disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Anterior
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalBeveragePages }).map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setBeveragePage(i + 1)}
                            aria-label={`Página ${i + 1} de bebidas`}
                            className={`h-9 min-w-9 px-2 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                              beveragePage === i + 1
                                ? "bg-[#B4482D] text-white shadow-sm"
                                : "bg-[#F6F4EE] dark:bg-[#203627] text-[#4A534C] dark:text-[#E2E8F0] border border-[#E2DDD3] dark:border-[#2E4A36] hover:border-[#B4482D] hover:text-[#B4482D]"
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
                        className="min-h-9 px-3 py-1 rounded-lg text-xs font-bold text-[#B4482D] dark:text-[#FF7D4F] bg-[#B4482D]/10 hover:bg-[#B4482D] hover:text-white dark:bg-[#FF7D4F]/10 dark:hover:bg-[#FF7D4F] dark:hover:text-black border border-[#B4482D]/30 dark:border-[#FF7D4F]/30 transition-all shadow-2xs disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Próxima
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Section: Observações para a cozinha */}
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#111827] dark:text-[#F9FAFB]">
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
                  className="w-full rounded-xl border border-[#D1D5DB] dark:border-[#2E4A36] bg-[#FAF8F5] dark:bg-[#203627] p-2.5 text-base lg:text-xs font-medium text-[#111827] dark:text-white placeholder-[#5D645E] dark:placeholder-[#9CA79E] outline-hidden focus:border-[#2E6B3E] dark:focus:border-[#4ADE80] focus:bg-white dark:focus:bg-[#203627] focus:ring-1 focus:ring-[#2E6B3E]"
                  rows={2}
                />
              </div>
              </div>
            </div>
          </div>

          {/* Sticky Modal Footer */}
          <div className="shrink-0 border-t border-[#E5E7EB] dark:border-[#2A382E] bg-white dark:bg-[#141C16] p-2.5 sm:p-3 px-4 sm:px-5 short:lg:py-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={handleAdd}
              className="w-full min-h-10 short:lg:min-h-9 flex items-center justify-between rounded-xl bg-[#1B2A20] hover:bg-[#273B2E] dark:bg-[#2E4233] dark:hover:bg-[#3B5441] px-4 sm:px-5 py-2.5 short:lg:py-2 text-sm sm:text-base short:lg:text-sm font-semibold text-white shadow-md transition cursor-pointer"
            >
              <span>Adicionar ao carrinho</span>
              <span className="flex items-center gap-2">
                <span className="text-white/75">•</span>
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
          role="dialog"
          aria-modal="true"
          aria-label={`Galeria ampliada de ${selectedProduct.name}`}
          className="fixed inset-0 z-60 flex flex-col justify-between gap-2 bg-black/92 backdrop-blur-md p-3 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] animate-in fade-in duration-200"
          onClick={() => setIsZoomOpen(false)}
        >
          {/* Top Bar with title and Close Button (in-flow flex item para evitar colisão em landscape) */}
          <div
            className="flex w-full items-center justify-between gap-2 px-1 md:px-4 text-white shrink-0 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-serif text-sm sm:text-base md:text-lg font-bold truncate">
                {selectedProduct.name}
              </span>
              {galleryImages.length > 1 && (
                <span className="text-xs text-gray-200 bg-white/15 px-2.5 py-0.5 rounded-full font-medium shrink-0">
                  {activeImageIndex + 1} de {galleryImages.length}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="h-11 w-11 min-h-11 min-w-11 shrink-0 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Fechar zoom"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Main Large Image Stage (sem overflow-hidden para nunca cortar setas) */}
          <div
            className="relative flex-1 min-h-0 w-full flex items-center justify-center px-2 md:px-14"
            onClick={(e) => e.stopPropagation()}
          >
            <StorefrontImage
              src={activeImage}
              alt={selectedProduct.name}
              variant={isDrinkProduct ? "drink" : "food"}
              className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl shadow-2xl transition-all duration-300 select-none"
              fallbackClassName="h-56 w-72 rounded-xl border border-white/15"
              iconClassName="h-12 w-12"
            />

            {/* Setas Visíveis sempre dentro da viewport */}
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))
                  }}
                  className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-11 w-11 min-h-11 min-w-11 md:h-12 md:w-12 rounded-full bg-black/75 hover:bg-black/90 text-white border border-white/15 flex items-center justify-center shadow-xl transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
                  className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 h-11 w-11 min-h-11 min-w-11 md:h-12 md:w-12 rounded-full bg-black/75 hover:bg-black/90 text-white border border-white/15 flex items-center justify-center shadow-xl transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Próxima foto"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails na base do Zoom (in-flow para evitar sobreposição em landscape) */}
          {galleryImages.length > 1 && (
            <div
              className="mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar p-1.5 sm:p-2 rounded-xl bg-black/60 backdrop-blur-xs max-w-full shrink-0 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  aria-label={`Ver foto ${idx + 1} de ${selectedProduct.name}`}
                  className={`h-10 w-10 min-h-10 min-w-10 sm:h-11 sm:w-11 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4ADE80] ${
                    idx === activeImageIndex
                      ? "border-[#4ADE80] scale-105 shadow-md"
                      : "border-white/30 opacity-70 hover:opacity-100"
                  }`}
                >
                  <StorefrontImage
                    src={imgUrl}
                    alt=""
                    variant={isDrinkProduct ? "drink" : "food"}
                    className="h-full w-full object-cover"
                    fallbackClassName="h-full w-full"
                    iconClassName="h-4 w-4"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
