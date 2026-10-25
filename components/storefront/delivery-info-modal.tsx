"use client"

import React, { useState } from "react"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import {
  X,
  MapPin,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Package,
  Zap,
} from "lucide-react"

export function DeliveryInfoModal() {
  const { activeModal, closeModal, store } = useStorefrontCart()
  const [cep, setCep] = useState("05422-010")
  const [verified, setVerified] = useState(true)

  if (activeModal !== "delivery-info") return null

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    setVerified(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ECE7DE] px-6 py-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#1C261F]">
              Informações de entrega
            </h2>
            <p className="text-xs text-[#6B736E]">
              Verifique se entregamos no seu endereço e confira os prazos.
            </p>
          </div>
          <button
            onClick={closeModal}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#5D645E] hover:bg-[#F4EFE6]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[80vh] overflow-y-auto p-6">
          {/* CEP Form */}
          <form onSubmit={handleVerify} className="mb-6 flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7F8681]" />
              <input
                type="text"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="Digite seu CEP (Ex: 05422-010)"
                className="w-full rounded-xl border border-[#DED7CB] bg-[#FAF8F5] py-2.5 pl-9 pr-3 text-sm text-[#1F2921] outline-hidden focus:border-[#1B2A20] focus:bg-white focus:ring-1 focus:ring-[#1B2A20]"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-[#1B2A20] px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#273B2E]"
            >
              Verificar
            </button>
          </form>

          {/* Delivery result card */}
          {verified && (
            <div className="mb-6 rounded-xl border border-[#CDE5D3] bg-[#F2F9F4] p-4 text-[#1C482A]">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-5 w-5 text-[#2E9B4F]" />
                <span>Entregamos no seu endereço!</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[#D7EBDC] pt-3 text-xs">
                <div>
                  <span className="text-[#597863]">Tempo estimado:</span>
                  <div className="font-bold text-[#1C482A]">25 a 35 minutos</div>
                </div>
                <div>
                  <span className="text-[#597863]">Taxa de entrega:</span>
                  <div className="font-bold text-[#1C482A]">
                    R$ 6,90 (Grátis acima de R$ 80)
                  </div>
                </div>
              </div>

              {/* Map Preview Graphic */}
              <div className="relative mt-4 h-36 w-full overflow-hidden rounded-lg border border-[#BCDCC4] bg-[#E8F3EB]">
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Delivery Polygon Graphic */}
                  <svg className="h-full w-full" viewBox="0 0 400 150">
                    <defs>
                      <pattern
                        id="grid"
                        width="20"
                        height="20"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M 20 0 L 0 0 0 20"
                          fill="none"
                          stroke="#D2E8D8"
                          strokeWidth="1"
                        />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    {/* Delivery radius circle */}
                    <circle
                      cx="200"
                      cy="75"
                      r="60"
                      fill="#35A852"
                      fillOpacity="0.15"
                      stroke="#2E9B4F"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />
                    {/* Store Pin */}
                    <circle cx="200" cy="75" r="7" fill="#1B2A20" />
                    <circle cx="200" cy="75" r="3" fill="#FFFFFF" />
                  </svg>
                  <span className="absolute bottom-2 right-3 rounded bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-[#1C482A] backdrop-blur-xs">
                    Área atendida: Vila Madalena e região
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 3 Quality & Safety Badges */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col items-center rounded-xl border border-[#ECE7DE] bg-[#FAF8F5] p-3.5 text-center">
              <Zap className="h-5 w-5 text-[#CB5A3C]" />
              <span className="mt-1.5 text-xs font-bold text-[#1C261F]">
                Entrega rápida
              </span>
              <span className="mt-0.5 text-[11px] text-[#6B736E]">
                Entregadores dedicados para manter o frescor
              </span>
            </div>

            <div className="flex flex-col items-center rounded-xl border border-[#ECE7DE] bg-[#FAF8F5] p-3.5 text-center">
              <Package className="h-5 w-5 text-[#2E6B3E]" />
              <span className="mt-1.5 text-xs font-bold text-[#1C261F]">
                Embalagens seguras
              </span>
              <span className="mt-0.5 text-[11px] text-[#6B736E]">
                Térmicas e ecológicas que preservam o calor
              </span>
            </div>

            <div className="flex flex-col items-center rounded-xl border border-[#ECE7DE] bg-[#FAF8F5] p-3.5 text-center">
              <ShieldCheck className="h-5 w-5 text-[#1B2A20]" />
              <span className="mt-1.5 text-xs font-bold text-[#1C261F]">
                Dados protegidos
              </span>
              <span className="mt-0.5 text-[11px] text-[#6B736E]">
                Total segurança do pedido ao pagamento
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#ECE7DE] bg-white px-6 py-4">
          <button
            onClick={closeModal}
            className="w-full rounded-xl bg-[#1B2A20] py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-[#273B2E]"
          >
            Continuar para o cardápio
          </button>
        </div>
      </div>
    </div>
  )
}
