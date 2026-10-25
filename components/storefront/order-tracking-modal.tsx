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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ECE7DE] bg-white px-6 py-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#CB5A3C]">
              Acompanhamento ao vivo
            </span>
            <h2 className="font-serif text-xl font-bold text-[#1C261F]">
              Pedido {lastOrder.display_id}
            </h2>
          </div>
          <button
            onClick={closeModal}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#5D645E] hover:bg-[#F4EFE6]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[75vh] overflow-y-auto p-6">
          {/* Estimated ETA Banner */}
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-[#D9EADB] bg-[#F2FAF4] p-4 text-[#1C482A]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E2F3E7] text-[#2E9B4F]">
                <Bike className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-[#52775E]">Previsão de entrega</span>
                <div className="text-base font-bold">13:15 a 13:30</div>
              </div>
            </div>
            <span className="rounded-full bg-[#2E9B4F] px-2.5 py-1 text-xs font-bold text-white shadow-xs">
              A caminho
            </span>
          </div>

          {/* Timeline Steps */}
          <div className="relative pl-6">
            <div className="absolute bottom-4 left-2.5 top-3 w-0.5 bg-[#EAE5DC]" />

            <div className="space-y-6">
              {steps.map((st, idx) => {
                const isDone = st.status === "completed"
                const isCurrent = st.status === "current"
                return (
                  <div key={idx} className="relative flex items-start gap-4">
                    <div
                      className={`relative z-10 flex h-6 w-6 shrink-0 -translate-x-[22px] items-center justify-center rounded-full text-white text-xs font-bold shadow-xs ${
                        isDone
                          ? "bg-[#2E9B4F]"
                          : isCurrent
                          ? "bg-[#CB5A3C] ring-4 ring-[#CB5A3C]/20"
                          : "border-2 border-[#DED7CB] bg-white text-[#99A09A]"
                      }`}
                    >
                      {isDone ? "✓" : idx + 1}
                    </div>

                    <div className="flex-1 -mt-0.5">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-bold ${
                            isCurrent
                              ? "text-[#CB5A3C]"
                              : isDone
                              ? "text-[#1C261F]"
                              : "text-[#8E9690]"
                          }`}
                        >
                          {st.title}
                        </span>
                        <span className="text-xs text-[#7E8580]">{st.time}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#6B736E]">{st.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Courier Card */}
          <div className="mt-8 flex items-center justify-between rounded-xl border border-[#ECE7DE] bg-[#FAF8F5] p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1B2A20] text-white font-bold text-sm">
                CS
              </div>
              <div>
                <span className="text-xs text-[#7F8681]">Entregador</span>
                <div className="text-sm font-bold text-[#1C261F]">
                  Carlos Silva (Honda CG 160)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  window.open("https://wa.me/5511987654321", "_blank")
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DED7CB] bg-white text-[#1B2A20] hover:bg-[#F2EDE4]"
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
