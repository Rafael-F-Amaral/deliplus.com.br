"use client"

import React, { useState } from "react"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import {
  Bike,
  Store,
  Clock,
  MapPin,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  X,
  ShieldCheck,
} from "lucide-react"

export function ReceivingMethodModal() {
  const {
    activeModal,
    closeModal,
    openModal,
    deliveryMethod,
    setDeliveryMethod,
    customerData,
    setCustomerData,
    store,
  } = useStorefrontCart()

  const [cep, setCep] = useState(customerData.cep || "05432-001")
  const [address, setAddress] = useState(customerData.address || "Rua das Flores")
  const [number, setNumber] = useState("123")
  const [complement, setComplement] = useState(customerData.complement || "Apto 45")
  const [neighborhood, setNeighborhood] = useState(customerData.neighborhood || "Vila Madalena")
  const [city, setCity] = useState(customerData.city || "São Paulo")
  const [reference, setReference] = useState(customerData.reference || "Portaria com interfone")

  if (activeModal !== "receiving-method") return null

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault()
    if (deliveryMethod === "delivery") {
      setCustomerData({
        cep,
        address: `${address}, ${number}`,
        complement,
        neighborhood,
        city,
        reference,
      })
    }
    openModal("checkout-payment")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 backdrop-blur-xs md:p-4">
      <div className="relative flex h-full w-full max-w-3xl flex-col overflow-hidden bg-white dark:bg-[#17211A] text-[#1F2922] dark:text-[#F2EFE9] shadow-2xl md:h-auto md:max-h-[90vh] md:rounded-2xl border dark:border-[#2A382E]">
        {/* Top Header / Steps */}
        <div className="flex items-center justify-between border-b border-[#ECE7DE] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] px-6 py-4">
          <div className="font-serif text-2xl font-bold tracking-tight text-[#1A261D] dark:text-[#F2EFE9]">
            Deliplus
          </div>

          {/* Stepper Center - Sem emojis, alinhado e com contraste perfeito no claro e escuro */}
          <div className="hidden items-center gap-3 md:gap-4 text-xs sm:flex">
            <div className="flex items-center gap-1.5 font-semibold text-[#2E6B3E] dark:text-[#4ADE80]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-[#4ADE80] border border-emerald-300 dark:border-emerald-800/60 text-[11px] font-bold">
                1
              </span>
              <span>Sacola</span>
            </div>
            <span className="h-px w-6 sm:w-8 bg-[#DED7CB] dark:bg-[#2A382E]" />
            <div className="flex items-center gap-1.5 font-semibold text-[#2E6B3E] dark:text-[#4ADE80]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-[#4ADE80] border border-emerald-300 dark:border-emerald-800/60 text-[11px] font-bold">
                2
              </span>
              <span>Dados</span>
            </div>
            <span className="h-px w-6 sm:w-8 bg-[#DED7CB] dark:bg-[#2A382E]" />
            <div className="flex items-center gap-1.5 font-bold text-[#1A261D] dark:text-white">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#CB5A3C] text-white text-[11px] font-bold shadow-xs">
                3
              </span>
              <span>Entrega / Retirada</span>
            </div>
            <span className="h-px w-6 sm:w-8 bg-[#DED7CB] dark:bg-[#2A382E]" />
            <div className="flex items-center gap-1.5 font-medium text-[#6B7280] dark:text-[#9CA3AF]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EAE5DC] dark:bg-[#2A382E] text-[#6B7280] dark:text-[#9CA3AF] text-[11px] font-semibold">
                4
              </span>
              <span>Pagamento</span>
            </div>
          </div>

          <button
            onClick={closeModal}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#5D645E] dark:text-[#9CA79E] hover:bg-[#F4EFE6] dark:hover:bg-[#253528]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleContinue} className="flex flex-1 flex-col overflow-y-auto p-6 md:p-8">
          <div className="mb-6">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-[#1A261D] dark:text-[#F2EFE9] md:text-3xl">
              Como você quer receber?
            </h2>
            <p className="mt-1 text-xs text-[#666D67] dark:text-[#9CA79E] md:text-sm">
              {customerData.name ? `Para ${customerData.name}: ` : ""}
              Escolha entre receber em casa por delivery ou retirar no balcão.
            </p>
          </div>

          {/* Delivery Options Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Delivery Card */}
            <div
              onClick={() => setDeliveryMethod("delivery")}
              className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition ${
                deliveryMethod === "delivery"
                  ? "border-[#CB5A3C] bg-[#FFF8F6] dark:bg-[#2A1E19] ring-1 ring-[#CB5A3C]"
                  : "border-[#ECE7DE] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] hover:border-[#D5CDBD] dark:hover:border-[#384D3E]"
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5EFE6] dark:bg-[#253528] text-[#1B2A20] dark:text-[#4ADE80]">
                <Bike className="h-5 w-5" />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#1C261F] dark:text-[#F2EFE9]">Delivery</h3>
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      deliveryMethod === "delivery"
                        ? "border-[#CB5A3C] bg-[#CB5A3C]"
                        : "border-[#C5BEB3] dark:border-[#3A4B3E]"
                    }`}
                  >
                    {deliveryMethod === "delivery" && (
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <p className="mt-1 text-xs text-[#6B736E] dark:text-[#9CA79E]">
                  Entregamos quentinho no seu endereço.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[#FAF5EE] dark:bg-[#253528] px-2 py-0.5 text-xs font-medium text-[#4D544E] dark:text-[#D5DDD7]">
                  <Clock className="h-3 w-3" />
                  <span>35–50 min</span>
                </div>
              </div>
            </div>

            {/* Retirada Card */}
            <div
              onClick={() => setDeliveryMethod("pickup")}
              className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition ${
                deliveryMethod === "pickup"
                  ? "border-[#CB5A3C] bg-[#FFF8F6] dark:bg-[#2A1E19] ring-1 ring-[#CB5A3C]"
                  : "border-[#ECE7DE] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] hover:border-[#D5CDBD] dark:hover:border-[#384D3E]"
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5EFE6] dark:bg-[#253528] text-[#1B2A20] dark:text-[#4ADE80]">
                <Store className="h-5 w-5" />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                    Retirada no balcão
                  </h3>
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      deliveryMethod === "pickup"
                        ? "border-[#CB5A3C] bg-[#CB5A3C]"
                        : "border-[#C5BEB3] dark:border-[#3A4B3E]"
                    }`}
                  >
                    {deliveryMethod === "pickup" && (
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <p className="mt-1 text-xs text-[#6B736E] dark:text-[#9CA79E]">
                  Retire sem taxa diretamente na loja.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[#E8F4EC] dark:bg-emerald-950/60 px-2 py-0.5 text-xs font-semibold text-[#276F3B] dark:text-emerald-400">
                  <Clock className="h-3 w-3" />
                  <span>15–25 min • Grátis</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Content based on chosen method */}
          {deliveryMethod === "delivery" ? (
            /* DELIVERY FORM (Corrected - was previously missing/inverted) */
            <div className="mt-6 space-y-4 rounded-2xl border border-[#ECE7DE] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#141C16] p-5">
              <div className="flex items-center gap-2 border-b border-[#EAE5DC] dark:border-[#2A382E] pb-3 text-sm font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                <MapPin className="h-4 w-4 text-[#CB5A3C]" />
                <span>Onde devemos entregar seu pedido?</span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#5E6660] dark:text-[#9CA79E]">
                    CEP
                  </label>
                  <input
                    type="text"
                    required
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    placeholder="00000-000"
                    className="w-full rounded-xl border border-[#DED7CB] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] p-2.5 text-sm text-[#1F2921] dark:text-[#F2EFE9] outline-hidden focus:border-[#1B2A20] dark:focus:border-emerald-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-[#5E6660] dark:text-[#9CA79E]">
                    Rua / Avenida
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Nome da sua rua"
                    className="w-full rounded-xl border border-[#DED7CB] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] p-2.5 text-sm text-[#1F2921] dark:text-[#F2EFE9] outline-hidden focus:border-[#1B2A20] dark:focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#5E6660] dark:text-[#9CA79E]">
                    Número
                  </label>
                  <input
                    type="text"
                    required
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="123"
                    className="w-full rounded-xl border border-[#DED7CB] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] p-2.5 text-sm text-[#1F2921] dark:text-[#F2EFE9] outline-hidden focus:border-[#1B2A20] dark:focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#5E6660] dark:text-[#9CA79E]">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Apto 45, Bloco B..."
                    className="w-full rounded-xl border border-[#DED7CB] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] p-2.5 text-sm text-[#1F2921] dark:text-[#F2EFE9] outline-hidden focus:border-[#1B2A20] dark:focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#5E6660] dark:text-[#9CA79E]">
                    Bairro
                  </label>
                  <input
                    type="text"
                    required
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Bairro"
                    className="w-full rounded-xl border border-[#DED7CB] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] p-2.5 text-sm text-[#1F2921] dark:text-[#F2EFE9] outline-hidden focus:border-[#1B2A20] dark:focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#5E6660] dark:text-[#9CA79E]">
                  Ponto de referência (opcional)
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ex: Próximo à padaria, portaria com interfone..."
                  className="w-full rounded-xl border border-[#DED7CB] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] p-2.5 text-sm text-[#1F2921] dark:text-[#F2EFE9] outline-hidden focus:border-[#1B2A20] dark:focus:border-emerald-500"
                />
              </div>
            </div>
          ) : (
            /* PICKUP DETAILS (Corrected - was previously shown unconditionally) */
            <div className="mt-6 space-y-3 rounded-2xl border border-[#ECE7DE] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#141C16] p-5 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 shrink-0 text-[#1B2A20] dark:text-[#4ADE80]" />
                <div className="flex-1">
                  <span className="font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                    Endereço para retirada
                  </span>
                  <p className="text-[#68706A] dark:text-[#9CA79E]">
                    {store.address}
                  </p>
                  <span className="mt-1 inline-block text-[11px] font-semibold text-[#CB5A3C]">
                    Ponto de referência: Próximo ao metrô Fradique Coutinho
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-[#EAE5DC] dark:border-[#2A382E] pt-3">
                <Clock className="h-4 w-4 shrink-0 text-[#1B2A20] dark:text-[#4ADE80]" />
                <div>
                  <span className="font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                    Horário de funcionamento
                  </span>
                  <p className="text-[#68706A] dark:text-[#9CA79E]">
                    Terça a Domingo: 11:30 às 22:30
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-[#EAE5DC] dark:border-[#2A382E] pt-3">
                <ShoppingBag className="h-4 w-4 shrink-0 text-[#1B2A20] dark:text-[#4ADE80]" />
                <div>
                  <span className="font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                    Instrução de retirada
                  </span>
                  <p className="text-[#276F3B] dark:text-emerald-400 font-medium">
                    Ao chegar no balcão, informe seu nome ({customerData.name || "cliente"}) ou o número do pedido. Seu pedido não tem taxa de entrega!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="mt-8 flex items-center justify-between border-t border-[#ECE7DE] dark:border-[#2A382E] pt-4">
            <button
              type="button"
              onClick={() => openModal("checkout-data")}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#68706A] dark:text-[#9CA79E] transition hover:text-black dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar aos dados</span>
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-[#1B2A20] dark:bg-[#2E4233] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#283E30] dark:hover:bg-[#3B5441]"
            >
              <span>Continuar para pagamento</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
