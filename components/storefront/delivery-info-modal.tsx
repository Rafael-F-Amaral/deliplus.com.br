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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 pt-safe pb-safe backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Informações de entrega"
        className="relative flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white dark:bg-[#17211A] text-[#1F2922] dark:text-[#F2EFE9] border border-[#ECE7DE] dark:border-[#2A382E] shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#ECE7DE] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] px-4 sm:px-6 py-4">
          <div className="min-w-0">
            <h2 className="font-serif text-xl font-bold text-[#1C261F] dark:text-[#F2EFE9]">
              Informações de entrega
            </h2>
            <p className="text-xs text-[#525A54] dark:text-[#9CA79E]">
              Verifique se entregamos no seu endereço e confira os prazos.
            </p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Fechar informações de entrega"
            className="flex h-9 w-9 min-h-9 min-w-9 shrink-0 items-center justify-center rounded-full text-[#4A534C] dark:text-[#CBD5E1] hover:bg-[#F4EFE6] dark:hover:bg-[#253528] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6B3E]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 storefront-scrollbar">
          {/* CEP Form */}
          <form onSubmit={handleVerify} className="mb-6 flex flex-col min-[360px]:flex-row gap-2">
            <div className="relative flex-1 min-w-0">
              <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5D645E] dark:text-[#9CA79E]" />
              <input
                type="text"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                aria-label="Digite seu CEP"
                placeholder="Digite seu CEP (Ex: 05422-010)"
                className="w-full min-h-10 rounded-xl border border-[#DED7CB] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#131A15] py-2 pl-9 pr-3 text-base lg:text-sm text-[#1F2921] dark:text-[#F2EFE9] placeholder-[#5D645E] dark:placeholder-[#9CA79E] outline-hidden focus:border-[#1B2A20] dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-[#131A15] focus:ring-1 focus:ring-[#1B2A20]"
              />
            </div>
            <button
              type="submit"
              className="min-h-10 shrink-0 rounded-xl bg-[#1B2A20] dark:bg-[#2E4233] px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#273B2E] dark:hover:bg-[#3B5441] cursor-pointer"
            >
              Verificar
            </button>
          </form>

          {/* Delivery result card */}
          {verified && (
            <div className="mb-6 rounded-xl border border-[#CDE5D3] dark:border-[#2E4A36] bg-[#F2F9F4] dark:bg-[#192A1E] p-4 text-[#1C482A] dark:text-[#D5F0DD]">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#15803D] dark:text-[#4ADE80]" />
                <span>Entregamos no seu endereço!</span>
              </div>

              <div className="mt-3 grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 border-t border-[#D7EBDC] dark:border-[#2E4A36] pt-3 text-xs">
                <div>
                  <span className="text-[#3B5E45] dark:text-[#A0C4AA]">Tempo estimado:</span>
                  <div className="font-bold text-[#1C482A] dark:text-[#F2EFE9]">25 a 35 minutos</div>
                </div>
                <div>
                  <span className="text-[#3B5E45] dark:text-[#A0C4AA]">Taxa de entrega:</span>
                  <div className="font-bold text-[#1C482A] dark:text-[#F2EFE9]">
                    R$ 6,90 (Grátis acima de R$ 80)
                  </div>
                </div>
              </div>

              {/* Map Preview Graphic */}
              <div className="relative mt-4 h-36 w-full overflow-hidden rounded-lg border border-[#BCDCC4] dark:border-[#2E4A36] bg-[#E8F3EB] dark:bg-[#132017]">
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
                          className="stroke-[#D2E8D8] dark:stroke-[#263C2C]"
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
                      fillOpacity="0.18"
                      stroke="#2E9B4F"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />
                    {/* Store Pin */}
                    <circle cx="200" cy="75" r="7" className="fill-[#1B2A20] dark:fill-[#4ADE80]" />
                    <circle cx="200" cy="75" r="3" className="fill-white dark:fill-[#132017]" />
                  </svg>
                  <span className="absolute bottom-2 right-3 rounded bg-white/90 dark:bg-[#17211A]/90 px-2 py-0.5 text-[10px] font-semibold text-[#1C482A] dark:text-[#D5F0DD] backdrop-blur-xs">
                    Área atendida: Vila Madalena e região
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 3 Quality & Safety Badges */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col items-center rounded-xl border border-[#ECE7DE] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#1B241E] p-3.5 text-center">
              <Zap className="h-5 w-5 text-[#B4482D] dark:text-[#FF7D4F]" />
              <span className="mt-1.5 text-xs font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                Entrega rápida
              </span>
              <span className="mt-0.5 text-[11px] text-[#525A54] dark:text-[#9CA79E]">
                Entregadores dedicados para manter o frescor
              </span>
            </div>

            <div className="flex flex-col items-center rounded-xl border border-[#ECE7DE] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#1B241E] p-3.5 text-center">
              <Package className="h-5 w-5 text-[#2E6B3E] dark:text-[#4ADE80]" />
              <span className="mt-1.5 text-xs font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                Embalagens seguras
              </span>
              <span className="mt-0.5 text-[11px] text-[#525A54] dark:text-[#9CA79E]">
                Térmicas e ecológicas que preservam o calor
              </span>
            </div>

            <div className="flex flex-col items-center rounded-xl border border-[#ECE7DE] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#1B241E] p-3.5 text-center">
              <ShieldCheck className="h-5 w-5 text-[#1B2A20] dark:text-[#4ADE80]" />
              <span className="mt-1.5 text-xs font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                Dados protegidos
              </span>
              <span className="mt-0.5 text-[11px] text-[#525A54] dark:text-[#9CA79E]">
                Total segurança do pedido ao pagamento
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[#ECE7DE] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] px-4 sm:px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={closeModal}
            className="min-h-11 w-full rounded-xl bg-[#1B2A20] dark:bg-[#2E4233] py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-[#273B2E] dark:hover:bg-[#3B5441] cursor-pointer"
          >
            Continuar para o cardápio
          </button>
        </div>
      </div>
    </div>
  )
}
