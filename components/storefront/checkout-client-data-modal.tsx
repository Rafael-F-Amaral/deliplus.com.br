"use client"

import React, { useState } from "react"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Plus,
  Minus,
  Info,
  ArrowRight,
} from "lucide-react"

export function CheckoutClientDataModal() {
  const {
    activeModal,
    closeModal,
    openModal,
    items,
    updateQuantity,
    subtotalCents,
    totalCents,
    customerData,
    setCustomerData,
  } = useStorefrontCart()

  const [name, setName] = useState(customerData.name || "Marina Souza")
  const [whatsapp, setWhatsapp] = useState(customerData.whatsapp || "(11) 98765-4321")
  const [phone, setPhone] = useState(customerData.phone || "(11) 98765-4321")
  const [email, setEmail] = useState(customerData.email || "marina.souza@email.com")

  if (activeModal !== "checkout-data") return null

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault()
    setCustomerData({ name, whatsapp, phone, email })
    openModal("receiving-method")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 backdrop-blur-xs md:p-4">
      <div className="relative flex h-full w-full max-w-5xl flex-col overflow-hidden bg-white dark:bg-[#17211A] text-[#1F2922] dark:text-[#F2EFE9] shadow-2xl md:h-auto md:max-h-[92vh] md:rounded-2xl border dark:border-[#2A382E]">
        {/* Top Header */}
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
            <div className="flex items-center gap-1.5 font-bold text-[#1A261D] dark:text-white">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#CB5A3C] text-white text-[11px] font-bold shadow-xs">
                2
              </span>
              <span>Dados do cliente</span>
            </div>
            <span className="h-px w-6 sm:w-8 bg-[#DED7CB] dark:bg-[#2A382E]" />
            <div className="flex items-center gap-1.5 font-medium text-[#6B7280] dark:text-[#9CA3AF]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EAE5DC] dark:bg-[#2A382E] text-[#6B7280] dark:text-[#9CA3AF] text-[11px] font-semibold">
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

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-1.5 text-xs text-[#2E6B3E] dark:text-[#4ADE80] md:flex">
              <ShieldCheck className="h-4 w-4" />
              <span>Compra segura • Seus dados protegidos</span>
            </div>
            <button
              onClick={closeModal}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#5D645E] dark:text-[#9CA79E] hover:bg-[#F4EFE6] dark:hover:bg-[#253528]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: 2 Columns */}
        <div className="grid flex-1 grid-cols-1 overflow-y-auto md:grid-cols-12">
          {/* Left Column: Client Data Form */}
          <div className="p-6 md:col-span-7 md:p-8">
            <h2 className="font-serif text-2xl font-bold text-[#1C261F] dark:text-[#F2EFE9]">
              Para quem é este pedido?
            </h2>
            <p className="mt-1 text-xs text-[#6B736E] dark:text-[#9CA79E]">
              Preencha seus dados para identificação e acompanhamento do pedido.
            </p>

            <form onSubmit={handleContinue} className="mt-6 space-y-4">
              {/* Nome */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#3C443E] dark:text-[#D5DDD7]">
                  Nome completo
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full rounded-xl border border-[#DED7CB] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#131A15] p-3 text-sm text-[#1F2921] dark:text-[#F2EFE9] outline-hidden focus:border-[#1B2A20] dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-[#131A15] focus:ring-1 focus:ring-[#1B2A20]"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="flex items-center gap-1 text-xs font-semibold text-[#3C443E] dark:text-[#D5DDD7]">
                    <span>WhatsApp</span>
                    <Info className="h-3.5 w-3.5 text-[#7F8681] dark:text-[#9CA79E]" />
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full rounded-xl border border-[#35A852] bg-[#FAF8F5] dark:bg-[#131A15] p-3 pr-10 text-sm text-[#1F2921] dark:text-[#F2EFE9] outline-hidden focus:bg-white dark:focus:bg-[#131A15] focus:ring-1 focus:ring-[#35A852]"
                  />
                  <CheckCircle2 className="absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#35A852]" />
                </div>
                <p className="mt-1 text-[11px] text-[#2E6B3E] dark:text-emerald-400">
                  Usaremos para atualizações do seu pedido via WhatsApp
                </p>
              </div>

              {/* Telefone & Email */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3C443E] dark:text-[#D5DDD7]">
                    Telefone alternativo (opcional)
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full rounded-xl border border-[#DED7CB] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#131A15] p-3 text-sm text-[#1F2921] dark:text-[#F2EFE9] outline-hidden focus:border-[#1B2A20] dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-[#131A15] focus:ring-1 focus:ring-[#1B2A20]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3C443E] dark:text-[#D5DDD7]">
                    E-mail (opcional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full rounded-xl border border-[#DED7CB] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#131A15] p-3 text-sm text-[#1F2921] dark:text-[#F2EFE9] outline-hidden focus:border-[#1B2A20] dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-[#131A15] focus:ring-1 focus:ring-[#1B2A20]"
                  />
                </div>
              </div>

              {/* Security info card */}
              <div className="flex items-center gap-2.5 rounded-xl border border-[#E2DDD3] dark:border-[#2A382E] bg-[#F7F4EE] dark:bg-[#1F2B22] p-3.5 text-xs text-[#525B54] dark:text-[#9CA79E]">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#2E6B3E] dark:text-emerald-400" />
                <div>
                  <span className="font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                    Seus dados estão protegidos.
                  </span>{" "}
                  <span>Não compartilhamos suas informações pessoais.</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B2A20] dark:bg-[#2E4233] py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#283E30] dark:hover:bg-[#3B5441]"
              >
                <span>Continuar para entrega / retirada</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Right Column: Order Summary */}
          <div className="border-t border-[#ECE7DE] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#141C16] p-6 md:col-span-5 md:border-l md:border-t-0 md:p-8">
            <div className="flex items-center justify-between border-b border-[#ECE7DE] dark:border-[#2A382E] pb-4">
              <h3 className="font-serif text-lg font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                Resumo do pedido
              </h3>
              <span className="text-xs font-medium text-[#79807B] dark:text-[#9CA79E]">
                {items.length} {items.length === 1 ? "item" : "itens"}
              </span>
            </div>

            {/* Items List */}
            <div className="divide-y divide-[#ECE7DE] dark:divide-[#2A382E] py-2">
              {items.map((item) => (
                <div key={item.id} className="py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                    <div className="flex flex-1 flex-col overflow-hidden text-xs">
                      <span className="truncate font-semibold text-[#1C261F] dark:text-[#F2EFE9]">
                        {item.name}
                      </span>
                      <span className="text-xs font-bold text-[#1C261F] dark:text-[#4ADE80]">
                        {formatCurrency(item.unit_price_cents * item.quantity)}
                      </span>
                    </div>

                    {/* Qty +/- */}
                    <div className="flex items-center gap-2 rounded-lg border border-[#DED7CB] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] px-2 py-1 text-xs">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="text-[#68706A] dark:text-[#9CA79E] hover:text-black dark:hover:text-white cursor-pointer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="text-[#68706A] dark:text-[#9CA79E] hover:text-black dark:hover:text-white cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Detalhes e Adicionais Discriminados */}
                  {(item.portion || (item.selected_complements && item.selected_complements.length > 0)) && (
                    <div className="mt-1 pl-17 space-y-0.5 text-[11px] text-[#78807A] dark:text-[#9CA79E]">
                      {item.portion && <span>• {item.portion}</span>}
                      {item.selected_complements && item.selected_complements.length > 0 && (
                        <div className="pt-0.5 text-[10px]">
                          <span className="font-bold uppercase tracking-wider text-[#166534] dark:text-[#4ADE80]">
                            + Adicionais:
                          </span>{" "}
                          <span>{item.selected_complements.map(c => c.name).join(", ")}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Subtotals (Clean - Retired premature delivery selector) */}
            <div className="mt-4 space-y-2 border-t border-[#ECE7DE] dark:border-[#2A382E] pt-4 text-xs">
              <div className="flex justify-between text-[#68706A] dark:text-[#9CA79E]">
                <span>Subtotal</span>
                <span className="font-medium text-[#1C261F] dark:text-[#F2EFE9]">
                  {formatCurrency(subtotalCents)}
                </span>
              </div>
              <div className="flex justify-between pt-2 text-sm font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                <span>Total dos itens</span>
                <span className="text-base text-[#1C261F] dark:text-[#4ADE80]">
                  {formatCurrency(totalCents)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-[#7F8681]">
              <Lock className="h-3.5 w-3.5" />
              <span>Ambiente 100% seguro</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
