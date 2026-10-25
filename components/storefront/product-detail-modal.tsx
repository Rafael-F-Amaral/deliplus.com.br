"use client"

import React, { useState } from "react"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import { X, Plus, Minus, Leaf } from "lucide-react"
import { StorefrontComplement } from "@/types/storefront"

export function ProductDetailModal() {
  const { activeModal, selectedProduct, closeModal, addToCart } = useStorefrontCart()

  const [selectedPortion, setSelectedPortion] = useState<string>("default")
  const [selectedProtein, setSelectedProtein] = useState<string>("default")
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([])
  const [selectedComplements, setSelectedComplements] = useState<StorefrontComplement[]>([])
  const [notes, setNotes] = useState("")
  const [quantity, setQuantity] = useState(1)

  if (activeModal !== "product-detail" || !selectedProduct) return null

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
      image_url: selectedProduct.image_url,
      portion: portionName,
      protein: proteinName,
      removed_ingredients: removedIngredients,
      selected_complements: selectedComplements,
      notes: notes.trim() || undefined,
    })
    closeModal()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 backdrop-blur-xs md:p-4">
      <div className="relative flex h-full w-full max-w-4xl flex-col overflow-hidden bg-white shadow-2xl md:h-[90vh] md:max-h-[750px] md:rounded-2xl">
        {/* Close Button Top Right */}
        <button
          onClick={closeModal}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#3C443E] shadow-sm backdrop-blur-xs transition hover:bg-white hover:text-black"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Body: Split 2 columns on desktop */}
        <div className="grid flex-1 grid-cols-1 overflow-y-auto md:grid-cols-12">
          {/* Left: Food Image */}
          <div className="relative h-64 bg-[#F5F2EB] md:h-full md:col-span-5">
            <img
              src={selectedProduct.image_url}
              alt={selectedProduct.name}
              className="h-full w-full object-cover"
            />
            {selectedProduct.tags && selectedProduct.tags.length > 0 && (
              <span className="absolute left-4 top-4 rounded-md bg-[#CB5A3C] px-2.5 py-1 text-xs font-bold text-white shadow-xs">
                {selectedProduct.tags[0]}
              </span>
            )}
          </div>

          {/* Right: Customization Form */}
          <div className="flex flex-col p-5 md:col-span-7 md:p-8">
            {/* Breadcrumb */}
            <nav className="mb-2 text-xs font-medium text-[#7C847E]">
              <span>Cardápio</span> &gt;{" "}
              <span>{selectedProduct.category_name}</span> &gt;{" "}
              <span className="text-[#1F2922] font-semibold">{selectedProduct.name}</span>
            </nav>

            {/* Title & Description */}
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-[#1A261E] md:text-3xl">
                {selectedProduct.name}
              </h2>
              <Leaf className="h-4 w-4 text-[#5A7C65]" />
            </div>

            <p className="mt-1.5 text-xs leading-relaxed text-[#68706A] md:text-sm">
              {selectedProduct.description}
            </p>

            <div className="mt-2 text-sm font-semibold text-[#1A261E]">
              A partir de {formatCurrency(basePrice)}
            </div>

            <div className="my-5 border-t border-[#EFEBE4]" />

            {/* Section 1: Tamanho da porção */}
            {selectedProduct.portions && selectedProduct.portions.length > 0 && (
              <div className="mb-6">
                <div className="mb-2.5 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#1F2922]">
                      Tamanho da porção
                    </h3>
                    <p className="text-xs text-[#7F8681]">Escolha 1 opção</p>
                  </div>
                  <span className="rounded bg-[#EAE5DD] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#4A534C]">
                    Obrigatório
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedProduct.portions.map((portion) => {
                    const isSelected = selectedPortion === portion.id
                    return (
                      <label
                        key={portion.id}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                          isSelected
                            ? "border-[#1B2A20] bg-[#F7F5F0]"
                            : "border-[#E8E2D7] bg-white hover:border-[#D5CDBD]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="portion"
                            checked={isSelected}
                            onChange={() => setSelectedPortion(portion.id)}
                            className="h-4 w-4 accent-[#1B2A20]"
                          />
                          <span className="text-sm font-medium text-[#1F2922]">
                            {portion.name}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-[#3C443E]">
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

            {/* Section 2: Ponto da proteína */}
            {selectedProduct.proteins && selectedProduct.proteins.length > 0 && (
              <div className="mb-6">
                <div className="mb-2.5 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#1F2922]">
                      Escolha a proteína
                    </h3>
                    <p className="text-xs text-[#7F8681]">Escolha 1 opção</p>
                  </div>
                  <span className="rounded bg-[#EAE5DD] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#4A534C]">
                    Obrigatório
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedProduct.proteins.map((prot) => {
                    const isSelected = selectedProtein === prot.id
                    return (
                      <label
                        key={prot.id}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                          isSelected
                            ? "border-[#1B2A20] bg-[#F7F5F0]"
                            : "border-[#E8E2D7] bg-white hover:border-[#D5CDBD]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="protein"
                            checked={isSelected}
                            onChange={() => setSelectedProtein(prot.id)}
                            className="h-4 w-4 accent-[#1B2A20]"
                          />
                          <span className="text-sm font-medium text-[#1F2922]">
                            {prot.name}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-[#3C443E]">
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

            {/* Section 3: Remover ingredientes */}
            {selectedProduct.removable_ingredients &&
              selectedProduct.removable_ingredients.length > 0 && (
                <div className="mb-6">
                  <div className="mb-2.5 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#1F2922]">
                        Remover ingredientes
                      </h3>
                      <p className="text-xs text-[#7F8681]">
                        Selecione o que deseja retirar
                      </p>
                    </div>
                    <span className="text-xs font-medium text-[#7F8681]">
                      Opcional
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.removable_ingredients.map((ing) => {
                      const isRemoved = removedIngredients.includes(ing)
                      return (
                        <button
                          key={ing}
                          type="button"
                          onClick={() => toggleRemoved(ing)}
                          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                            isRemoved
                              ? "bg-[#CB5A3C] text-white shadow-xs"
                              : "border border-[#DED7CB] bg-white text-[#4A534B] hover:bg-[#F7F5F0]"
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
              <div className="mb-6">
                <div className="mb-2.5 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#1F2922]">
                      Adicionais e complementos
                    </h3>
                    <p className="text-xs text-[#7F8681]">Até 3 adicionais</p>
                  </div>
                  <span className="text-xs font-medium text-[#7F8681]">
                    Opcional
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedProduct.complements.map((comp) => {
                    const isSelected = selectedComplements.some(
                      (c) => c.id === comp.id
                    )
                    return (
                      <label
                        key={comp.id}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                          isSelected
                            ? "border-[#1B2A20] bg-[#F7F5F0]"
                            : "border-[#E8E2D7] bg-white hover:border-[#D5CDBD]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleComplement(comp)}
                            className="h-4 w-4 rounded-sm accent-[#1B2A20]"
                          />
                          <span className="text-sm font-medium text-[#1F2922]">
                            {comp.name}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-[#1F2922]">
                          + {formatCurrency(comp.price_cents)}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Section 5: Observações para a cozinha */}
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1F2922]">
                  Observações para a cozinha
                </h3>
                <span className="text-xs text-[#8B938D]">{notes.length}/120</span>
              </div>
              <textarea
                value={notes}
                maxLength={120}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: tirar o sal, molho à parte, enviar talher descartável..."
                className="w-full rounded-xl border border-[#DED7CB] bg-[#FAF8F5] p-3 text-sm text-[#1F2921] placeholder-[#8C938E] outline-hidden focus:border-[#1B2A20] focus:bg-white focus:ring-1 focus:ring-[#1B2A20]"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Sticky Modal Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-[#EAE5DC] bg-white p-4 md:px-8">
          {/* Quantity Stepper */}
          <div className="flex items-center gap-3 rounded-full border border-[#DED7CB] bg-[#FAF8F5] px-3 py-1.5">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#3C443E] transition hover:bg-white disabled:opacity-30"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-6 text-center text-sm font-bold text-[#1F2922]">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#3C443E] transition hover:bg-white"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Add Button */}
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 rounded-xl bg-[#1B2A20] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#273B2E]"
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
