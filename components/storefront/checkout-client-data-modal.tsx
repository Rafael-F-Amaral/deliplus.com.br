"use client"

import React, { useState } from "react"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import {
  X,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Lock,
  Plus,
  Minus,
  Bike,
  Store,
  Info,
} from "lucide-react"

export function CheckoutClientDataModal() {
  const {
    activeModal,
    closeModal,
    openModal,
    items,
    updateQuantity,
    subtotalCents,
    deliveryFeeCents,
    totalCents,
    deliveryMethod,
    setDeliveryMethod,
    customerData,
    setCustomerData,
  } = useStorefrontCart()

  if (activeModal !== "checkout-data") return null

  const [name, setName] = useState(customerData.name || "Marina Souza")
  const [whatsapp, setWhatsapp] = useState(customerData.whatsapp || "(11) 98765-1234")
  const [phone, setPhone] = useState(customerData.phone || "(11) 98765-5678")
  const [email, setEmail] = useState(customerData.email || "marina.souza@email.com")

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault()
    setCustomerData({ name, whatsapp, phone, email })
    openModal("checkout-payment")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 md:p-4 backdrop-blur-xs">
      <div className="relative flex h-full w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl md:h-auto md:max-h-[92vh] md:rounded-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#ECE7DE] bg-white px-6 py-4">
          <div className="font-serif text-2xl font-bold tracking-tight text-[#1A261D]">
            Deliplus
          </div>

          {/* Stepper Center */}
          <div className="hidden items-center gap-6 text-xs sm:flex">
            <div className="flex items-center gap-2 text-[#7A827C]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EAE5DC]">
                🛒
              </span>
              <span>Sacola</span>
            </div>
            <span className="h-px w-8 bg-[#DED7CB]" />
            <div className="flex items-center gap-2 font-bold text-[#1B2A20]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1B2A20] text-white">
                👤
              </span>
              <span>Dados</span>
            </div>
            <span className="h-px w-8 bg-[#DED7CB]" />
            <div className="flex items-center gap-2 text-[#7A827C]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EAE5DC]">
                💳
              </span>
              <span>Pagamento</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-1.5 text-xs text-[#2E6B3E] md:flex">
              <ShieldCheck className="h-4 w-4" />
              <span>Compra segura • Seus dados protegidos</span>
            </div>
            <button
              onClick={closeModal}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#5D645E] hover:bg-[#F4EFE6]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: 2 Columns */}
        <div className="grid flex-1 grid-cols-1 overflow-y-auto md:grid-cols-12">
          {/* Left Column: Client Data Form */}
          <div className="p-6 md:col-span-7 md:p-8">
            <h2 className="font-serif text-2xl font-bold text-[#1C261F]">
              Dados do cliente
            </h2>
            <p className="mt-1 text-xs text-[#6B736E]">
              Preencha seus dados para continuar
            </p>

            <form onSubmit={handleContinue} className="mt-6 space-y-4">
              {/* Nome */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#3C443E]">
                  Nome completo
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-[#DED7CB] bg-[#FAF8F5] p-3 text-sm text-[#1F2921] outline-hidden focus:border-[#1B2A20] focus:bg-white focus:ring-1 focus:ring-[#1B2A20]"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="flex items-center gap-1 text-xs font-semibold text-[#3C443E]">
                    <span>WhatsApp</span>
                    <Info className="h-3.5 w-3.5 text-[#7F8681]" />
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full rounded-xl border border-[#35A852] bg-[#FAF8F5] p-3 pr-10 text-sm text-[#1F2921] outline-hidden focus:bg-white focus:ring-1 focus:ring-[#35A852]"
                  />
                  <CheckCircle2 className="absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#35A852]" />
                </div>
                <p className="mt-1 text-[11px] text-[#2E6B3E]">
                  Usaremos para atualizações do seu pedido via WhatsApp
                </p>
              </div>

              {/* Telefone & Email */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3C443E]">
                    Telefone alternativo
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-[#DED7CB] bg-[#FAF8F5] p-3 text-sm text-[#1F2921] outline-hidden focus:border-[#1B2A20] focus:bg-white focus:ring-1 focus:ring-[#1B2A20]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3C443E]">
                    E-mail (opcional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full rounded-xl border border-[#DED7CB] bg-[#FAF8F5] p-3 text-sm text-[#1F2921] outline-hidden focus:border-[#1B2A20] focus:bg-white focus:ring-1 focus:ring-[#1B2A20]"
                  />
                </div>
              </div>

              {/* Delivery Address Card */}
              <div className="rounded-2xl border border-[#ECE7DE] bg-[#FAF8F5] p-4 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-[#1C261F]">
                    <MapPin className="h-4 w-4 text-[#1B2A20]" />
                    <span>Endereço de entrega</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openModal("delivery-info")}
                    className="font-bold text-[#CB5A3C] hover:underline"
                  >
                    Editar
                  </button>
                </div>

                <div className="mt-2 text-[#4A534B]">
                  <p className="font-semibold text-[#1C261F]">Casa</p>
                  <p>
                    {customerData.address}, {customerData.complement}
                  </p>
                  <p>
                    {customerData.neighborhood}, {customerData.city} –{" "}
                    {customerData.state}, {customerData.cep}
                  </p>
                </div>
              </div>

              {/* Security info card */}
              <div className="flex items-center gap-2.5 rounded-xl border border-[#E2DDD3] bg-[#F7F4EE] p-3 text-xs text-[#525B54]">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#2E6B3E]" />
                <div>
                  <span className="font-bold text-[#1C261F]">
                    Seus dados estão protegidos.
                  </span>{" "}
                  <span>Não compartilhamos suas informações pessoais.</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full rounded-xl bg-[#1B2A20] py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#283E30]"
              >
                Continuar
              </button>
            </form>
          </div>

          {/* Right Column: Order Summary */}
          <div className="border-t border-[#ECE7DE] bg-[#FAF8F5] p-6 md:col-span-5 md:border-l md:border-t-0 md:p-8">
            <div className="flex items-center justify-between border-b border-[#ECE7DE] pb-4">
              <h3 className="font-serif text-lg font-bold text-[#1C261F]">
                Resumo do pedido
              </h3>
              <span className="text-xs font-medium text-[#79807B]">
                {items.length} {items.length === 1 ? "item" : "itens"}
              </span>
            </div>

            {/* Items List */}
            <div className="divide-y divide-[#ECE7DE] py-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-3">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                  <div className="flex flex-1 flex-col overflow-hidden text-xs">
                    <span className="truncate font-semibold text-[#1C261F]">
                      {item.name}
                    </span>
                    <span className="text-xs font-bold text-[#1C261F]">
                      {formatCurrency(item.unit_price_cents)}
                    </span>
                  </div>

                  {/* Qty +/- */}
                  <div className="flex items-center gap-2 rounded-lg border border-[#DED7CB] bg-white px-2 py-1 text-xs">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="text-[#68706A] hover:text-black"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="font-bold text-[#1C261F]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="text-[#68706A] hover:text-black"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotals */}
            <div className="mt-4 space-y-2 border-t border-[#ECE7DE] pt-4 text-xs">
              <div className="flex justify-between text-[#68706A]">
                <span>Subtotal</span>
                <span className="font-medium text-[#1C261F]">
                  {formatCurrency(subtotalCents)}
                </span>
              </div>
              <div className="flex justify-between text-[#68706A]">
                <span>Taxa de entrega</span>
                <span className="font-medium text-[#1C261F]">
                  {deliveryFeeCents === 0 ? "Grátis" : formatCurrency(deliveryFeeCents)}
                </span>
              </div>
              <div className="flex justify-between pt-2 text-sm font-bold text-[#1C261F]">
                <span>Total</span>
                <span className="text-base text-[#1C261F]">
                  {formatCurrency(totalCents)}
                </span>
              </div>
            </div>

            {/* Delivery / Pickup method badges */}
            <div className="mt-6 grid grid-cols-2 gap-2 text-xs">
              <div
                onClick={() => setDeliveryMethod("delivery")}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 transition ${
                  deliveryMethod === "delivery"
                    ? "border-[#1B2A20] bg-white font-bold text-[#1B2A20]"
                    : "border-[#ECE7DE] bg-[#F5F2EB] text-[#6B736E]"
                }`}
              >
                <Bike className="h-4 w-4" />
                <span>Entrega 35–50 min</span>
              </div>

              <div
                onClick={() => setDeliveryMethod("pickup")}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 transition ${
                  deliveryMethod === "pickup"
                    ? "border-[#1B2A20] bg-white font-bold text-[#1B2A20]"
                    : "border-[#ECE7DE] bg-[#F5F2EB] text-[#6B736E]"
                }`}
              >
                <Store className="h-4 w-4" />
                <span>Retirada 20 min</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[#7F8681]">
              <Lock className="h-3.5 w-3.5" />
              <span>Ambiente 100% seguro</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
