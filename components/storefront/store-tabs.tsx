"use client"

import React from "react"
import { useStorefrontCart, ActiveModalType } from "@/lib/storefront/storefront-cart-context"

interface StoreTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function StoreTabs({ activeTab, onTabChange }: StoreTabsProps) {
  const { openModal } = useStorefrontCart()

  const tabs: { id: string; label: string; modal?: ActiveModalType }[] = [
    { id: "cardapio", label: "Cardápio" },
    { id: "avaliacoes", label: "Avaliações 320", modal: "delivery-info" },
    { id: "sobre", label: "Sobre", modal: "delivery-info" },
    { id: "informacoes", label: "Informações", modal: "delivery-info" },
  ]

  return (
    <div className="border-b border-[#EAE5DC] bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-8 px-4 md:px-6">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id)
                if (tab.modal) {
                  openModal(tab.modal)
                }
              }}
              className={`relative py-4 text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? "font-semibold text-[#1B2A20]"
                  : "text-[#626A64] hover:text-[#1B2A20]"
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1B2A20]" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
