"use client"

import React from "react"
import Link from "next/link"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import { StorefrontImage } from "./storefront-image"
import {
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Bike,
  UtensilsCrossed,
  Leaf,
  Store,
  ArrowRight,
  X,
} from "lucide-react"

export function OrderConfirmedScreen() {
  const { activeModal, closeModal, openModal, lastOrder, store } =
    useStorefrontCart()

  if (activeModal !== "order-confirmed" || !lastOrder) return null

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  const handleWhatsAppHelp = () => {
    const rawDigits = (store?.phone || "").replace(/\D/g, "")
    const targetPhone = rawDigits.length >= 10 
      ? (rawDigits.startsWith("55") ? rawDigits : `55${rawDigits}`)
      : "5511987654321"
    const text = encodeURIComponent(
      `Olá ${store?.name || "Restaurante"}, gostaria de tirar uma dúvida sobre o meu pedido ${lastOrder?.display_id || ""}.`
    )
    window.open(`https://wa.me/${targetPhone}?text=${text}`, "_blank")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 md:p-4 short:p-0 lg:short:p-4 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pedido confirmado"
        className="relative flex h-dvh w-full max-w-2xl lg:max-w-5xl flex-col overflow-hidden bg-white dark:bg-[#17211A] text-[#1F2922] dark:text-[#F2EFE9] border border-[#ECE7DE] dark:border-[#2A382E] shadow-2xl pt-safe pb-safe md:pt-0 md:pb-0 md:h-auto md:max-h-[90dvh] md:rounded-2xl short:h-dvh short:max-h-dvh short:rounded-none short:pt-safe short:pb-safe lg:short:h-auto lg:short:max-h-[90dvh] lg:short:rounded-2xl lg:short:pt-0 lg:short:pb-0"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#ECE7DE] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] px-4 sm:px-6 py-3 sm:py-4">
          <div className="w-9" />
          <button
            type="button"
            onClick={closeModal}
            className="flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-full text-[#4A534C] dark:text-[#CBD5E1] hover:bg-[#F4EFE6] dark:hover:bg-[#253528] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6B3E]"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: 2 Columns no desktop (>= lg) */}
        <div className="grid flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-12 storefront-scrollbar">
          {/* Left Column: Order Success & Details */}
          <div className="p-4 sm:p-6 lg:col-span-7 lg:p-8">
            <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
              {/* Soft Sage Circle */}
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E5F3EA] dark:bg-[#192A1E] text-[#15803D] dark:text-[#4ADE80]">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <h2 className="mt-4 font-serif text-3xl font-bold tracking-tight text-[#1A261D] dark:text-[#F2EFE9] md:text-4xl">
                Pedido confirmado!
              </h2>

              <div className="mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-base text-[#525A54] dark:text-[#9CA79E] font-semibold">Pedido</span>
                <span className="font-serif text-lg font-bold text-[#B4482D] dark:text-[#FF7D4F]">
                  {lastOrder.display_id}
                </span>
              </div>

              <p className="mt-1 text-xs text-[#525A54] dark:text-[#9CA79E] md:text-sm font-semibold">
                Recebemos seu pedido e já estamos preparando tudo com muito carinho.
              </p>
            </div>

            {/* Info Cards Grid */}
            <div className="mt-6 space-y-3 font-semibold">
              {/* Time ETA Card */}
              <div className="flex items-start gap-3.5 rounded-2xl border border-[#DDD5C7] dark:border-[#2A382E] bg-[#F2ECE1] dark:bg-[#121A14] p-4 text-xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[#525A54] dark:text-[#A4AEA6] font-semibold">Previsão de entrega</span>
                  <div className="text-sm font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                    {lastOrder.estimated_delivery_time}
                  </div>
                  <span className="text-[#525A54] dark:text-[#9CA79E] text-[11px] font-semibold">Hoje</span>
                </div>
              </div>

              {/* Payment Info Card (Direct with store) */}
              <div className="flex items-start gap-3.5 rounded-2xl border border-[#DDD5C7] dark:border-[#2A382E] bg-[#F2ECE1] dark:bg-[#121A14] p-4 text-xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[#525A54] dark:text-[#A4AEA6] font-semibold">Pagamento na entrega / retirada</span>
                  <div className="text-sm font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                    {lastOrder.payment_method === "pix"
                      ? "Pix diretamente à loja"
                      : lastOrder.payment_method === "credit_card"
                      ? "Cartão na maquininha"
                      : "Dinheiro"}
                  </div>
                  <span className="text-[#525A54] dark:text-[#A4AEA6] text-xs font-semibold block mt-0.5">
                    {lastOrder.payment_method === "cash" && lastOrder.change_for_cents
                      ? `Troco preparado para ${formatCurrency(lastOrder.change_for_cents)}`
                      : "O acerto é realizado diretamente com o estabelecimento ou entregador."}
                  </span>
                </div>
              </div>

              {/* Delivery Address Card */}
              <div className="flex items-start gap-3.5 rounded-2xl border border-[#DDD5C7] dark:border-[#2A382E] bg-[#F2ECE1] dark:bg-[#121A14] p-4 text-xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="min-w-0 text-[#4A534B] dark:text-[#D5DDD7]">
                  <span className="font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                    {lastOrder.delivery_method === "pickup"
                      ? "Retirada no balcão"
                      : "Endereço de entrega"}
                  </span>
                  <p className="mt-0.5 font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                    {lastOrder.customer.name}
                  </p>
                  {lastOrder.delivery_method === "pickup" ? (
                    <p className="text-[#525A54] dark:text-[#A4AEA6] font-semibold">{store.address}</p>
                  ) : (
                    <>
                      <p className="font-semibold text-[#1C261F] dark:text-[#F2EFE9]">
                        {lastOrder.customer.address},{" "}
                        {lastOrder.customer.complement}
                      </p>
                      <p className="font-semibold text-[#525A54] dark:text-[#A4AEA6]">
                        {lastOrder.customer.neighborhood},{" "}
                        {lastOrder.customer.city}
                      </p>
                      {lastOrder.customer.reference && (
                        <p className="text-[#525A54] dark:text-[#9CA79E] font-semibold">
                          Referência: {lastOrder.customer.reference}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mt-6 space-y-2.5">
              <Link
                href={lastOrder.order_id ? `/${store?.slug || 'rafaelteste'}/pedido/${lastOrder.order_id}` : "#"}
                onClick={() => closeModal()}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1B2A20] dark:bg-[#2E4233] py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#283E30] dark:hover:bg-[#3B5441] cursor-pointer"
              >
                <Bike className="h-4 w-4" />
                <span>Acompanhar pedido ao vivo</span>
              </Link>

              <button
                type="button"
                onClick={closeModal}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#B4482D] dark:border-[#FF7D4F]/60 bg-white dark:bg-[#1B241E] py-3 text-sm font-semibold text-[#B4482D] dark:text-[#FF7D4F] transition hover:bg-[#FFF5F2] dark:hover:bg-[#2A1E19] cursor-pointer"
              >
                <UtensilsCrossed className="h-4 w-4" />
                <span>Voltar ao cardápio</span>
              </button>
            </div>

            {/* Help / WhatsApp Contact Card */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DDD5C7] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#131A15] p-3.5 text-xs font-semibold">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-[#1B241E] text-[#1B2A20] dark:text-[#4ADE80] border border-[#DDD5C7] dark:border-[#2A382E]">
                  <Store className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[#1C261F] dark:text-[#F2EFE9] font-bold">
                    Precisa de ajuda ou tem alguma dúvida?
                  </span>
                  <p className="text-xs text-[#525A54] dark:text-[#A4AEA6] font-semibold">
                    Fale diretamente com o {store.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleWhatsAppHelp}
                className="flex min-h-9 shrink-0 items-center gap-1 font-bold text-[#B4482D] dark:text-[#FF7D4F] hover:underline cursor-pointer"
              >
                <span>Entrar em contato</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Right Column: Order Items Summary & Store Header */}
          <div className="border-t border-[#DDD5C7] dark:border-[#2A382E] bg-[#F2ECE1] dark:bg-[#121A14] p-4 sm:p-6 lg:col-span-5 lg:border-l lg:border-t-0 lg:p-8">
            <h3 className="font-serif text-xl font-bold text-[#1C261F] dark:text-[#F2EFE9]">
              Resumo do pedido
            </h3>

            {/* Store Header */}
            <div className="my-4 flex items-center gap-3 rounded-xl bg-white dark:bg-[#1B241E] p-3 border border-[#DDD5C7] dark:border-[#2A382E] shadow-2xs">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#DDD5C7] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#131A15]">
                <Leaf className="h-5 w-5 text-[#2E6B3E] dark:text-[#4ADE80]" />
              </div>
              <div className="text-xs font-semibold">
                <span className="text-[#1C261F] dark:text-[#F2EFE9] font-bold block">{store.name}</span>
                <p className="text-[#525A54] dark:text-[#A4AEA6] font-semibold">
                  {lastOrder.items.length}{" "}
                  {lastOrder.items.length === 1 ? "item" : "itens"}
                </p>
              </div>
            </div>

            {/* Items with Customizations e scrollbar */}
            <div className="max-h-[340px] overflow-y-auto pr-1 storefront-scrollbar divide-y divide-[#E4DDD0] dark:divide-[#2A382E]">
              {lastOrder.items.map((it) => (
                <div key={it.id} className="py-3 text-xs font-semibold">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2.5">
                      <StorefrontImage src={it.image_url} alt={it.name} className="h-14 w-14 shrink-0 rounded-xl object-cover border border-[#DDD5C7] dark:border-[#2A382E]" fallbackClassName="h-14 w-14 shrink-0 rounded-xl border border-[#DDD5C7] dark:border-[#2A382E]" iconClassName="h-5 w-5" />
                      <div>
                        <span className="text-[#1C261F] dark:text-[#F2EFE9] font-bold block">
                          {it.quantity}x {it.name}
                        </span>
                        {it.portion && (
                          <p className="text-xs font-semibold text-[#525A54] dark:text-[#A4AEA6]">
                            • {it.portion}
                          </p>
                        )}
                        {it.selected_complements &&
                          it.selected_complements.length > 0 && (
                            <p className="text-xs font-bold text-[#166534] dark:text-[#4ADE80]">
                              + {it.selected_complements.map((c) => c.name).join(", ")}
                            </p>
                          )}
                      </div>
                    </div>
                    <span className="text-[#1C261F] dark:text-[#F2EFE9] font-semibold">
                      {formatCurrency(it.unit_price_cents * it.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Calculations com peso 600 em textos cinzas */}
            <div className="mt-4 space-y-2 border-t border-[#D8CFBF] dark:border-[#2A382E] pt-4 text-xs font-semibold">
              <div className="flex justify-between font-semibold text-[#525A54] dark:text-[#A4AEA6]">
                <span className="font-semibold">Subtotal</span>
                <span className="text-[#1C261F] dark:text-[#F2EFE9] font-semibold">
                  {formatCurrency(lastOrder.subtotal_cents)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-[#525A54] dark:text-[#A4AEA6]">
                <span className="font-semibold">Taxa de entrega</span>
                <span className="text-[#1C261F] dark:text-[#F2EFE9] font-semibold">
                  {lastOrder.delivery_fee_cents === 0
                    ? "Grátis"
                    : formatCurrency(lastOrder.delivery_fee_cents)}
                </span>
              </div>
              {lastOrder.discount_cents > 0 && (
                <div className="flex justify-between text-[#166534] dark:text-emerald-400 font-semibold">
                  <span className="font-semibold">Desconto promocional</span>
                  <span className="font-semibold">- {formatCurrency(lastOrder.discount_cents)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-[#E0D8CB] dark:border-[#2A382E] text-sm text-[#1C261F] dark:text-[#F2EFE9] font-semibold">
                <span className="font-bold">Total</span>
                <span className="text-base font-bold text-[#1C261F] dark:text-[#4ADE80]">
                  {formatCurrency(lastOrder.total_cents)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
