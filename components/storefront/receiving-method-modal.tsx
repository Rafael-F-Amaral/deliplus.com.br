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
  } = useStorefrontCart()

  const [name, setName] = useState(customerData.name || "João da Silva")
  const [phone, setPhone] = useState(customerData.phone || "(11) 98765-4321")

  if (activeModal !== "receiving-method") return null

  const handleContinue = () => {
    setCustomerData({ name, phone })
    openModal("checkout-data")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 md:p-4 backdrop-blur-xs">
      <div className="relative flex h-full w-full max-w-3xl flex-col overflow-hidden bg-white shadow-2xl md:h-auto md:max-h-[90vh] md:rounded-2xl">
        {/* Top Mini Header / Steps */}
        <div className="border-b border-[#ECE7DE] bg-[#FAF8F5] px-6 py-4">
          <div className="flex items-center justify-center gap-2 text-xs md:gap-4">
            <div className="flex items-center gap-1.5 font-medium text-[#2E6B3E]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E5F3EA] text-[11px] font-bold">
                ✓
              </span>
              <span className="hidden sm:inline">Cardápio</span>
            </div>
            <span className="h-px w-6 bg-[#D8D2C5]" />
            <div className="flex items-center gap-1.5 font-medium text-[#2E6B3E]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E5F3EA] text-[11px] font-bold">
                ✓
              </span>
              <span className="hidden sm:inline">Sacola</span>
            </div>
            <span className="h-px w-6 bg-[#D8D2C5]" />
            <div className="flex items-center gap-1.5 font-bold text-[#CB5A3C]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#CB5A3C] text-[11px] text-white">
                3
              </span>
              <span>Entrega ou retirada</span>
            </div>
            <span className="h-px w-6 bg-[#D8D2C5]" />
            <div className="flex items-center gap-1.5 text-[#8F9691]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EAE5DC] text-[11px]">
                4
              </span>
              <span className="hidden sm:inline">Pagamento</span>
            </div>
            <span className="h-px w-6 bg-[#D8D2C5]" />
            <div className="flex items-center gap-1.5 text-[#8F9691]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EAE5DC] text-[11px]">
                5
              </span>
              <span className="hidden sm:inline">Confirmação</span>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mb-6">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-[#1A261D] md:text-3xl">
              Como você quer receber?
            </h2>
            <p className="mt-1 text-xs text-[#666D67] md:text-sm">
              Escolha a melhor opção para você.
            </p>
          </div>

          {/* Delivery Options Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Delivery Card */}
            <div
              onClick={() => setDeliveryMethod("delivery")}
              className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition ${
                deliveryMethod === "delivery"
                  ? "border-[#CB5A3C] bg-[#FFF8F6] ring-1 ring-[#CB5A3C]"
                  : "border-[#ECE7DE] bg-white hover:border-[#D5CDBD]"
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5EFE6] text-[#1B2A20]">
                <Bike className="h-5 w-5" />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#1C261F]">Delivery</h3>
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      deliveryMethod === "delivery"
                        ? "border-[#CB5A3C] bg-[#CB5A3C]"
                        : "border-[#C5BEB3]"
                    }`}
                  >
                    {deliveryMethod === "delivery" && (
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <p className="mt-1 text-xs text-[#6B736E]">
                  Receba seus pratos onde estiver.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[#FAF5EE] px-2 py-0.5 text-xs font-medium text-[#4D544E]">
                  <Clock className="h-3 w-3" />
                  <span>25–35 min</span>
                </div>
              </div>
            </div>

            {/* Retirada Card */}
            <div
              onClick={() => setDeliveryMethod("pickup")}
              className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition ${
                deliveryMethod === "pickup"
                  ? "border-[#CB5A3C] bg-[#FFF8F6] ring-1 ring-[#CB5A3C]"
                  : "border-[#ECE7DE] bg-white hover:border-[#D5CDBD]"
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5EFE6] text-[#1B2A20]">
                <Store className="h-5 w-5" />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#1C261F]">
                    Retirada no balcão
                  </h3>
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      deliveryMethod === "pickup"
                        ? "border-[#CB5A3C] bg-[#CB5A3C]"
                        : "border-[#C5BEB3]"
                    }`}
                  >
                    {deliveryMethod === "pickup" && (
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <p className="mt-1 text-xs text-[#6B736E]">
                  Retire seu pedido na nossa casa.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[#FAF5EE] px-2 py-0.5 text-xs font-medium text-[#4D544E]">
                  <Clock className="h-3 w-3" />
                  <span>20–30 min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details for Retirada no Balcão */}
          {deliveryMethod === "pickup" && (
            <div className="mt-6 space-y-3 rounded-2xl border border-[#ECE7DE] bg-[#FAF8F5] p-5 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 shrink-0 text-[#1B2A20]" />
                <div className="flex-1">
                  <span className="font-bold text-[#1C261F]">
                    Endereço da casa
                  </span>
                  <p className="text-[#68706A]">
                    Rua das Flores, 123, Jardim Botânico, São Paulo – SP, CEP 05422-010
                  </p>
                  <button className="mt-1 font-semibold text-[#CB5A3C] hover:underline">
                    Ver no mapa
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-[#EAE5DC] pt-3">
                <Clock className="h-4 w-4 shrink-0 text-[#1B2A20]" />
                <div>
                  <span className="font-bold text-[#1C261F]">
                    Horário de funcionamento
                  </span>
                  <p className="text-[#68706A]">
                    Segunda a Sexta: 11h às 22h • Sábados e Domingos: 11h às 23h
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-[#EAE5DC] pt-3">
                <ShoppingBag className="h-4 w-4 shrink-0 text-[#1B2A20]" />
                <div>
                  <span className="font-bold text-[#1C261F]">
                    Tempo de preparo
                  </span>
                  <p className="font-semibold text-[#CB5A3C]">
                    Seu pedido estará pronto em 20–30 min
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form: Para quem é este pedido? */}
          <div className="mt-8 border-t border-[#EAE5DC] pt-6">
            <h3 className="mb-3 text-sm font-bold text-[#1C261F]">
              Para quem é este pedido?
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#5E6660]">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full rounded-xl border border-[#DED7CB] bg-[#FAF8F5] p-3 text-sm text-[#1F2921] outline-hidden focus:border-[#1B2A20] focus:bg-white focus:ring-1 focus:ring-[#1B2A20]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#5E6660]">
                  Telefone para contato
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full rounded-xl border border-[#DED7CB] bg-[#FAF8F5] p-3 text-sm text-[#1F2921] outline-hidden focus:border-[#1B2A20] focus:bg-white focus:ring-1 focus:ring-[#1B2A20]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-[#ECE7DE] bg-white p-4 md:px-8">
          <button
            onClick={closeModal}
            className="flex items-center gap-2 text-sm font-medium text-[#5C645E] hover:text-[#1B2A20]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para o cardápio</span>
          </button>

          <button
            onClick={handleContinue}
            className="flex items-center gap-2 rounded-xl bg-[#CB5A3C] px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#B54A2E]"
          >
            <span>Continuar</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
