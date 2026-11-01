"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import { X, Plus, Minus, ChevronLeft, ChevronRight } from "lucide-react"
import { StorefrontComplement } from "@/types/storefront"

export function ProductDetailModal() {
  const { activeModal, selectedProduct, closeModal, addToCart } = useStorefrontCart()

  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [selectedPortion, setSelectedPortion] = useState<string>("default")
  const [selectedProtein, setSelectedProtein] = useState<string>("default")
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([])
  const [selectedComplements, setSelectedComplements] = useState<StorefrontComplement[]>([])
  const [notes, setNotes] = useState("")
  const [quantity, setQuantity] = useState(1)

  // Reset form states whenever selectedProduct changes
  useEffect(() => {
    setActiveImageIndex(0)
    setSelectedPortion("default")
    setSelectedProtein("default")
    setRemovedIngredients([])
    setSelectedComplements([])
    setNotes("")
    setQuantity(1)
  }, [selectedProduct?.id])

  // Up to 5 photos for gallery
  const galleryImages: string[] = useMemo(() => {
    if (!selectedProduct) return []
    if (Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0) {
      return selectedProduct.images.filter(Boolean).slice(0, 5)
    }
    return selectedProduct.image_url ? [selectedProduct.image_url] : []
  }, [selectedProduct])

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

  // Calculate unit price based on options
  const basePrice = selectedProduct.promo_price_cents || selectedProduct.price_cents
  const portionExtra =
    selectedProduct.portions?.find((p) => p.id === selectedPortion)?.extra_price_cents || 0
  const proteinExtra =
    selectedProduct.proteins?.find((p) => p.id === selectedProtein)?.extra_price_cents || 0
  const complementsExtra = selectedComplements.reduce((acc, c) => acc + c.price_cents, 0)

  const unitTotalCents = basePrice + portionExtra + proteinExtra + complementsExtra
  const grandTotalCents = unitTotalCents * quantity

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  const handleAdd = () => {
    const portionName = selectedProduct.portions?.find((p) => p.id === selectedPortion)?.name
    const proteinName = selectedProduct.proteins?.find((p) => p.id === selectedProtein)?.name

    addToCart({
      product_id: selectedProduct.id,
      name: selectedProduct.name,
      unit_price_cents: unitTotalCents,
      quantity,
      image_url: activeImage || selectedProduct.image_url,
      portion: portionName,
      protein: proteinName,
      removed_ingredients: removedIngredients,
      selected_complements: selectedComplements,
      notes: notes.trim() || undefined,
    })
    closeModal()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs">
      <div className="relative flex w-full max-w-xl md:max-w-2xl flex-col overflow-hidden bg-white dark:bg-[#17211A] text-[#1F2922] dark:text-[#F2EFE9] shadow-2xl rounded-2xl border border-[#ECE7DE] dark:border-[#2A382E] max-h-[90vh] md:max-h-[85vh]">
        {/* Close Button Top Right */}
        <button
          onClick={closeModal}
          className="absolute right-3.5 top-3.5 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-[#1F2B22]/90 text-[#3C443E] dark:text-[#E2DED6] shadow-sm backdrop-blur-xs transition hover:bg-white dark:hover:bg-[#28382C] hover:text-black dark:hover:text-white border border-[#E8E2D5] dark:border-[#2A382E] cursor-pointer"
          aria-label="Fechar modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Body: Compact 2-column layout on desktop, scrollable */}
        <div className="flex flex-col md:flex-row flex-1 overflow-y-auto min-h-0">
          {/* Left: Food Gallery Showcase (Up to 5 photos) */}
          <div className="md:w-[270px] shrink-0 bg-[#FAF8F5] dark:bg-[#131A15] p-4 md:border-r md:border-[#ECE7DE] dark:md:border-[#2A382E] flex flex-col gap-2.5">
            {/* Main Active Photo */}
            <div className="relative w-full aspect-[4/3] md:aspect-square rounded-xl overflow-hidden bg-white dark:bg-[#1B241E] border border-[#E8E2D5] dark:border-[#2A382E] shadow-2xs flex items-center justify-center group">
              <img
                src={activeImage}
                alt={selectedProduct.name}
                className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                loading="eager"
              />
              {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                <span className="absolute left-2.5 top-2.5 rounded-md bg-[#CB5A3C] px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                  {selectedProduct.tags[0]}
                </span>
              )}
              {galleryImages.length > 1 && (
                <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))
                    }}
                    className="pointer-events-auto h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center shadow-xs transition cursor-pointer"
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
                    className="pointer-events-auto h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center shadow-xs transition cursor-pointer"
                    aria-label="Próxima foto"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Thumbnail Strip (up to 5 thumbnails) */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {galleryImages.map((imgUrl, idx) => {
                  const isActive = idx === activeImageIndex
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative h-11 w-11 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
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
          </div>

          {/* Right: Customization Form & Info */}
          <div className="flex-1 p-4 md:p-5 flex flex-col space-y-4 overflow-y-auto">
            {/* Header info */}
            <div>
              <nav className="text-[11px] font-medium text-[#7C847E] dark:text-[#8E9B91] mb-1">
                <span>Cardápio</span> &gt; <span>{selectedProduct.category_name}</span>
              </nav>
              <h2 className="font-serif text-xl md:text-2xl font-bold tracking-tight text-[#1A261E] dark:text-[#F2EFE9] pr-6">
                {selectedProduct.name}
              </h2>
              {selectedProduct.description && (
                <p className="mt-1 text-xs leading-relaxed text-[#68706A] dark:text-[#9CA79E]">
                  {selectedProduct.description}
                </p>
              )}
              <div className="mt-2 text-sm font-bold text-[#2E6B3E] dark:text-[#4ADE80]">
                A partir de {formatCurrency(basePrice)}
              </div>
            </div>

            <div className="border-t border-[#ECE7DE] dark:border-[#2A382E]" />

            {/* Section 1: Tamanho da porção (se houver) */}
            {selectedProduct.portions && selectedProduct.portions.length > 0 && (
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
                            ? "border-[#2E6B3E] bg-[#F4F9F5] dark:border-[#4ADE80]/60 dark:bg-[#1E2B22]"
                            : "border-[#E8E2D7] bg-white dark:border-[#2A382E] dark:bg-[#1B241E] hover:border-[#D5CDBD]"
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
                          <span className="font-medium text-[#1F2922] dark:text-[#F2EFE9]">
                            {portion.name}
                          </span>
                        </div>
                        <span className="font-semibold text-[#3C443E] dark:text-[#9CA79E]">
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

            {/* Section 2: Ponto da proteína (se houver) */}
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
                            ? "border-[#2E6B3E] bg-[#F4F9F5] dark:border-[#4ADE80]/60 dark:bg-[#1E2B22]"
                            : "border-[#E8E2D7] bg-white dark:border-[#2A382E] dark:bg-[#1B241E] hover:border-[#D5CDBD]"
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
                          <span className="font-medium text-[#1F2922] dark:text-[#F2EFE9]">
                            {prot.name}
                          </span>
                        </div>
                        <span className="font-semibold text-[#3C443E] dark:text-[#9CA79E]">
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

            {/* Section 3: Remover ingredientes (se houver) */}
            {selectedProduct.removable_ingredients &&
              selectedProduct.removable_ingredients.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2922] dark:text-[#F2EFE9]">
                      Remover ingredientes
                    </h3>
                    <span className="text-[11px] text-[#7F8681] dark:text-[#9CA79E]">
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
                              : "border border-[#DED7CB] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] text-[#4A534B] dark:text-[#D5DDD7] hover:bg-[#F7F5F0]"
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

            {/* Section 4: Adicionais e complementos */}
            {selectedProduct.complements && selectedProduct.complements.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2922] dark:text-[#F2EFE9]">
                    Adicionais e complementos
                  </h3>
                  <span className="rounded-sm bg-[#EAE5DD] dark:bg-[#253528] px-1.5 py-0.5 text-[10px] font-semibold text-[#4A534C] dark:text-[#A8B5AB]">
                    Opcional
                  </span>
                </div>

                <div className="space-y-1.5">
                  {selectedProduct.complements.map((comp) => {
                    const isSelected = selectedComplements.some((c) => c.id === comp.id)
                    return (
                      <label
                        key={comp.id}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 transition ${
                          isSelected
                            ? "border-[#2E6B3E] bg-[#F4F9F5] dark:border-[#4ADE80]/60 dark:bg-[#1E2B22]"
                            : "border-[#E8E2D7] bg-white dark:border-[#2A382E] dark:bg-[#1B241E] hover:border-[#D5CDBD] dark:hover:border-[#384D3E]"
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
                            <span className="text-xs font-semibold text-[#1F2922] dark:text-[#F2EFE9] block truncate">
                              {comp.name}
                            </span>
                            {comp.description && (
                              <span className="text-[11px] text-[#7F8681] dark:text-[#9CA79E] block truncate">
                                {comp.description}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#2E6B3E] dark:text-[#4ADE80] shrink-0 ml-2">
                          + {formatCurrency(comp.price_cents)}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Section 5: Observações para a cozinha */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2922] dark:text-[#F2EFE9]">
                  Observações para a cozinha
                </h3>
                <span className="text-[11px] text-[#8B938D] dark:text-[#9CA79E]">
                  {notes.length}/120
                </span>
              </div>
              <textarea
                value={notes}
                maxLength={120}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: tirar o sal, molho à parte, enviar talher descartável..."
                className="w-full rounded-xl border border-[#DED7CB] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#131A15] p-2.5 text-xs text-[#1F2921] dark:text-[#F2EFE9] placeholder-[#8C938E] outline-hidden focus:border-[#2E6B3E] dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-[#131A15] focus:ring-1 focus:ring-[#2E6B3E]"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Sticky Modal Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-[#ECE7DE] dark:border-[#2A382E] bg-white dark:bg-[#141C16] p-3 px-4 sm:px-5">
          {/* Quantity Stepper */}
          <div className="flex items-center gap-2.5 rounded-full border border-[#DED7CB] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#1B241E] px-2.5 py-1">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[#3C443E] dark:text-[#D5DDD7] transition hover:bg-white dark:hover:bg-[#253528] disabled:opacity-30 cursor-pointer"
              aria-label="Diminuir quantidade"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="min-w-5 text-center text-xs font-bold text-[#1F2922] dark:text-[#F2EFE9]">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[#3C443E] dark:text-[#D5DDD7] transition hover:bg-white dark:hover:bg-[#253528] cursor-pointer"
              aria-label="Aumentar quantidade"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Add Button */}
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 rounded-xl bg-[#1B2A20] dark:bg-[#2E4233] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-[#273B2E] dark:hover:bg-[#3B5441] cursor-pointer"
          >
            <span>Adicionar ao carrinho</span>
            <span>•</span>
            <span>{formatCurrency(grandTotalCents)}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
