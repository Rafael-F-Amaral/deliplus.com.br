"use client"

import React, { useState } from "react"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import {
  X,
  Bike,
  CheckCircle2,
  Clock,
  Phone,
  MessageCircle,
  ChefHat,
  PackageCheck,
  MapPin,
} from "lucide-react"

export function OrderTrackingModal() {
  const { activeModal, closeModal, lastOrder, store } = useStorefrontCart()

  if (activeModal !== "order-tracking" || !lastOrder) return null

  const steps = [
    {
      title: "Pedido recebido",
      time: "12:47",
      desc: "Seu pedido foi registrado no sistema.",
      status: "completed",
    },
    {
      title: "Em preparo na cozinha",
      time: "12:50",
      desc: "A cozinha está preparando seus pratos artesanais.",
      status: "completed",
    },
    {
      title: "Saiu para entrega",
      time: "13:05",
      desc: "O entregador Carlos Silva já está a caminho com seu pedido.",
      status: "current",
    },
    {
      title: "Entregue",
      time: "Previsão 13:25",
      desc: "Aproveite a sua refeição!",
      status: "upcoming",
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 pt-safe pb-safe backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Acompanhar pedido ${lastOrder.display_id}`}
        className="relative flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white dark:bg-[#17211A] text-[#1F2922] dark:text-[#F2EFE9] border border-[#ECE7DE] dark:border-[#2A382E] shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#ECE7DE] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] px-4 sm:px-6 py-4">
          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#B4482D] dark:text-[#FF7D4F]">
              Acompanhamento ao vivo
            </span>
            <h2 className="truncate font-serif text-xl font-bold text-[#1C261F] dark:text-[#F2EFE9]">
              Pedido {lastOrder.display_id}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Fechar acompanhamento"
            className="flex h-9 w-9 min-h-9 min-w-9 shrink-0 items-center justify-center rounded-full text-[#4A534C] dark:text-[#CBD5E1] hover:bg-[#F4EFE6] dark:hover:bg-[#253528] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6B3E]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] storefront-scrollbar">
          {/* Estimated ETA Banner */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D9EADB] dark:border-[#2A382E] bg-[#F2FAF4] dark:bg-[#1C2920] p-4 text-[#1C482A] dark:text-[#D5F0DD]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E2F3E7] dark:bg-[#253D2C] text-[#15803D] dark:text-[#4ADE80]">
                <Bike className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#3B5E45] dark:text-[#A0C4AA]">
                  Previsão de entrega
                </span>
                <div className="text-base font-bold text-[#1C482A] dark:text-[#4ADE80]">
                  13:15 a 13:30
                </div>
              </div>
            </div>
            <span className="rounded-full bg-[#15803D] dark:bg-[#2E6B3E] px-3 py-1 text-xs font-bold text-white shadow-xs">
              A caminho
            </span>
          </div>

          {/* Timeline Steps */}
          <div className="relative pl-6">
            <div className="absolute bottom-4 left-2.5 top-3 w-0.5 bg-[#EAE5DC] dark:bg-[#2A382E]" />

            <div className="space-y-6">
              {steps.map((st, idx) => {
                const isDone = st.status === "completed"
                const isCurrent = st.status === "current"
                return (
                  <div key={idx} className="relative flex items-start gap-4">
                    <div
                      className={`relative z-10 flex h-6 w-6 shrink-0 -translate-x-[22px] items-center justify-center rounded-full text-xs font-bold shadow-xs ${
                        isDone
                          ? "bg-[#15803D] text-white"
                          : isCurrent
                          ? "bg-[#B4482D] text-white ring-4 ring-[#B4482D]/20"
                          : "border-2 border-[#DED7CB] dark:border-[#3A4D3E] bg-white dark:bg-[#1B241E] text-[#59615B] dark:text-[#9CA79E]"
                      }`}
                    >
                      {isDone ? "✓" : idx + 1}
                    </div>

                    <div className="flex-1 min-w-0 -mt-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-sm font-bold ${
                            isCurrent
                              ? "text-[#B4482D] dark:text-[#FF7D4F]"
                              : isDone
                              ? "text-[#1C261F] dark:text-[#F2EFE9]"
                              : "text-[#59615B] dark:text-[#9CA79E]"
                          }`}
                        >
                          {st.title}
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-[#59615B] dark:text-[#9CA79E]">
                          {st.time}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-[#525A54] dark:text-[#A4AEA6]">
                        {st.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Courier Card */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DDD5C7] dark:border-[#2A382E] bg-[#F2ECE1] dark:bg-[#121A14] p-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1B2A20] dark:bg-[#2E4233] text-white font-bold text-sm">
                CS
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-[#525A54] dark:text-[#A4AEA6]">Entregador</span>
                <div className="truncate text-sm font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                  Carlos Silva (Honda CG 160)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const rawDigits = (store?.phone || "").replace(/\D/g, "")
                  const targetPhone =
                    rawDigits.length >= 10
                      ? rawDigits.startsWith("55")
                        ? rawDigits
                        : "55" + rawDigits
                      : "5511987654321"
                  window.open("https://wa.me/" + targetPhone, "_blank")
                }}
                aria-label="Falar com o entregador ou loja no WhatsApp"
                className="flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-lg border border-[#DED7CB] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] text-[#1B2A20] dark:text-[#F2EFE9] hover:bg-[#F2EDE4] dark:hover:bg-[#253528] cursor-pointer"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



