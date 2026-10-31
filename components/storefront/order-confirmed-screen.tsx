"use client"

import React from "react"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import {
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Bike,
  UtensilsCrossed,
  MessageCircle,
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
    const text = encodeURIComponent(
      `Olá ${store.name}, gostaria de tirar uma dúvida sobre o meu pedido ${lastOrder.display_id}.`
    )
    window.open(`https://wa.me/5511987654321?text=${text}`, "_blank")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 md:p-4 backdrop-blur-xs">
      <div className="relative flex h-full w-full max-w-5xl flex-col overflow-hidden bg-white dark:bg-[#17211A] text-[#1F2922] dark:text-[#F2EFE9] border dark:border-[#2A382E] shadow-2xl md:h-auto md:max-h-[92vh] md:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ECE7DE] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] px-6 py-4">
          <div className="font-serif text-2xl font-bold tracking-tight text-[#1A261D]">
            Deliplus
          </div>
          <button
            onClick={closeModal}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#5D645E] dark:text-[#9CA79E] hover:bg-[#F4EFE6] dark:hover:bg-[#253528]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: 2 Columns */}
        <div className="grid flex-1 grid-cols-1 overflow-y-auto md:grid-cols-12">
          {/* Left Column: Order Success & Details */}
          <div className="p-6 md:col-span-7 md:p-8">
            <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
              {/* Soft Sage Circle */}
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E5F3EA] text-[#2E9B4F]">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <h2 className="mt-4 font-serif text-3xl font-bold tracking-tight text-[#1A261D] dark:text-[#F2EFE9] md:text-4xl">
                Pedido confirmado!
              </h2>

              <div className="mt-1 flex items-center gap-2">
                <span className="text-base text-[#59615B]">Pedido</span>
                <span className="font-serif text-lg font-bold text-[#CB5A3C]">
                  {lastOrder.display_id}
                </span>
              </div>

              <p className="mt-1 text-xs text-[#6B736E] dark:text-[#9CA79E] md:text-sm">
                Recebemos seu pedido e já estamos preparando tudo com muito carinho.
              </p>
            </div>

            {/* Info Cards Grid */}
            <div className="mt-6 space-y-3">
              {/* Time ETA Card */}
              <div className="flex items-start gap-3.5 rounded-2xl border border-[#ECE7DE] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#131A15] p-4 text-xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0EBE1] text-[#1B2A20]">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[#6D746F]">Chega entre</span>
                  <div className="text-sm font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                    {lastOrder.estimated_delivery_time}
                  </div>
                  <span className="text-[#88908B]">Hoje, 27 de maio</span>
                </div>
              </div>

              {/* Payment Approved Card */}
              <div className="flex items-start gap-3.5 rounded-2xl border border-[#ECE7DE] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#131A15] p-4 text-xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E5F3EA] text-[#2E9B4F]">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[#6D746F]">Pagamento</span>
                  <div className="text-sm font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                    Pagamento aprovado
                  </div>
                  <span className="text-[#88908B]">
                    Seu pagamento foi processado com sucesso.
                  </span>
                </div>
              </div>

              {/* Delivery Address Card */}
              <div className="flex items-start gap-3.5 rounded-2xl border border-[#ECE7DE] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#131A15] p-4 text-xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0EBE1] text-[#1B2A20]">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="text-[#4A534B]">
                  <span className="font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                    Endereço de entrega
                  </span>
                  <p className="mt-0.5 font-medium text-[#1C261F]">
                    {lastOrder.customer.name}
                  </p>
                  <p>
                    {lastOrder.customer.address},{" "}
                    {lastOrder.customer.complement}
                  </p>
                  <p>
                    {lastOrder.customer.neighborhood},{" "}
                    {lastOrder.customer.city} – {lastOrder.customer.state},{" "}
                    {lastOrder.customer.cep}
                  </p>
                  {lastOrder.customer.reference && (
                    <p className="text-[#838A85]">
                      Referência: {lastOrder.customer.reference}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mt-6 space-y-2.5">
              <button
                onClick={() => openModal("order-tracking")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B2A20] dark:bg-[#2E4233] py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#283E30] dark:hover:bg-[#3B5441]"
              >
                <Bike className="h-4 w-4" />
                <span>Acompanhar pedido</span>
              </button>

              <button
                onClick={closeModal}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#CB5A3C] bg-white dark:bg-[#1B241E] py-3 text-sm font-bold text-[#CB5A3C] transition hover:bg-[#FFF5F2] dark:hover:bg-[#2A1E19]"
              >
                <UtensilsCrossed className="h-4 w-4" />
                <span>Voltar ao cardápio</span>
              </button>
            </div>

            {/* Help / WhatsApp Contact Card */}
            <div className="mt-6 flex items-center justify-between rounded-xl border border-[#ECE7DE] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#131A15] p-3.5 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#1B2A20]">
                  <Store className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-semibold text-[#1C261F]">
                    Precisa de ajuda ou tem alguma dúvida?
                  </span>
                  <p className="text-[11px] text-[#6E7570]">
                    Fale diretamente com o {store.name}
                  </p>
                </div>
              </div>

              <button
                onClick={handleWhatsAppHelp}
                className="flex items-center gap-1 font-bold text-[#CB5A3C] hover:underline"
              >
                <span>Entrar em contato</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Right Column: Order Items Summary & Eco Notice */}
          <div className="border-t border-[#ECE7DE] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#141C16] p-6 md:col-span-5 md:border-l md:border-t-0 md:p-8">
            <h3 className="font-serif text-lg font-bold text-[#1C261F]">
              Resumo do pedido
            </h3>

            {/* Store Header */}
            <div className="my-4 flex items-center gap-3 rounded-xl bg-white dark:bg-[#1B241E] p-3 border dark:border-[#2A382E] shadow-2xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E5E0D5] bg-[#FAF8F5]">
                <Leaf className="h-5 w-5 text-[#5A7C65]" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-[#1C261F] dark:text-[#F2EFE9]">{store.name}</span>
                <p className="text-[#7F8681]">
                  {lastOrder.items.length}{" "}
                  {lastOrder.items.length === 1 ? "item" : "itens"}
                </p>
              </div>
            </div>

            {/* Items with Customizations */}
            <div className="divide-y divide-[#ECE7DE] dark:divide-[#2A382E]">
              {lastOrder.items.map((it) => (
                <div key={it.id} className="py-3 text-xs">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2.5">
                      <img
                        src={it.image_url}
                        alt={it.name}
                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      />
                      <div>
                        <span className="font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                          {it.name}
                        </span>
                        <div className="mt-0.5 text-[11px] text-[#69716B]">
                          <span>{it.quantity}x • Personalização</span>
                        </div>
                        {/* Customization Details */}
                        <ul className="mt-1 space-y-0.5 text-[11px] text-[#78807A]">
                          {it.protein && <li>• {it.protein}</li>}
                          {it.portion && <li>• {it.portion}</li>}
                          {it.removed_ingredients?.map((r) => (
                            <li key={r}>• {r}</li>
                          ))}
                          {it.selected_complements?.map((c) => (
                            <li key={c.id}>• {c.name}</li>
                          ))}
                          {it.notes && <li>• Obs: {it.notes}</li>}
                        </ul>
                      </div>
                    </div>
                    <span className="font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                      {formatCurrency(it.unit_price_cents * it.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="mt-4 space-y-2 border-t border-[#ECE7DE] dark:border-[#2A382E] pt-4 text-xs">
              <div className="flex justify-between text-[#68706A] dark:text-[#9CA79E]">
                <span>Subtotal</span>
                <span className="font-medium text-[#1C261F] dark:text-[#F2EFE9]">
                  {formatCurrency(lastOrder.subtotal_cents)}
                </span>
              </div>
              <div className="flex justify-between text-[#68706A] dark:text-[#9CA79E]">
                <span>Taxa de entrega</span>
                <span className="font-medium text-[#1C261F] dark:text-[#F2EFE9]">
                  {lastOrder.delivery_fee_cents === 0
                    ? "Grátis"
                    : formatCurrency(lastOrder.delivery_fee_cents)}
                </span>
              </div>
              <div className="flex justify-between pt-2 text-sm font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                <span>Total</span>
                <span className="text-base text-[#1C261F] dark:text-[#4ADE80]">
                  {formatCurrency(lastOrder.total_cents)}
                </span>
              </div>
            </div>

            {/* Eco Sustainability Badge */}
            <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-[#D5E5DA] bg-[#F0F8F3] p-3 text-xs text-[#245833]">
              <Leaf className="h-4 w-4 shrink-0 text-[#2E9B4F]" />
              <div>
                <span className="font-bold">Embalagens sustentáveis</span>
                <p className="mt-0.5 text-[11px] text-[#3A6B48]">
                  Seu pedido será entregue com embalagens biodegradáveis que causam menos impacto no planeta.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
