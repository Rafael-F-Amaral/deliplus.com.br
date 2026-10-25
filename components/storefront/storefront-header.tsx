"use client"

import React from "react"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import {
  Search,
  User,
  ShoppingBag,
  Menu,
  Heart,
} from "lucide-react"

export function StorefrontHeader() {
  const { itemsCount, openModal } = useStorefrontCart()

  return (
    <header className="sticky top-0 z-40 w-full bg-[#1A2B1E] text-white shadow-sm transition-all">
      {/* Desktop Navigation */}
      <div className="mx-auto hidden max-w-7xl items-center justify-between px-6 py-3.5 md:flex">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <a
            href="#"
            className="font-serif text-2xl font-bold tracking-tight text-white transition-opacity hover:opacity-90"
          >
            Deliplus
          </a>

          <nav className="flex items-center gap-6 text-sm text-[#D1D9D3]">
            <a href="#cardapio" className="transition-colors hover:text-white">
              Cardápio
            </a>
            <a href="#como-funciona" className="transition-colors hover:text-white">
              Como funciona
            </a>
            <a href="#para-empresas" className="transition-colors hover:text-white">
              Para empresas
            </a>
            <button
              onClick={() => openModal("delivery-info")}
              className="cursor-pointer transition-colors hover:text-white"
            >
              Sobre a casa
            </button>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const el = document.getElementById("search-input")
              el?.focus()
            }}
            className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-[#D1D9D3] transition-colors hover:text-white"
          >
            <Search className="h-4 w-4" />
            <span>Buscar</span>
          </button>

          <button
            onClick={() => openModal("favorites")}
            className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-[#D1D9D3] transition-colors hover:text-white"
          >
            <Heart className="h-4 w-4" />
            <span>Favoritos</span>
          </button>

          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/sign-in"
            className="flex items-center gap-1.5 text-sm font-medium text-[#D1D9D3] transition-colors hover:text-white"
          >
            <User className="h-4 w-4" />
            <span>Entrar</span>
          </a>

          <button
            onClick={() => openModal("cart-drawer")}
            className="relative flex cursor-pointer items-center gap-2 rounded-lg bg-[#FAF7F2] px-3.5 py-1.5 text-sm font-medium text-[#1A2B1E] transition hover:bg-[#F3ECE1]"
          >
            <ShoppingBag className="h-4 w-4 text-[#1A2B1E]" />
            <span>Carrinho</span>
            {itemsCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#CB5A3C] text-[11px] font-bold text-white shadow">
                {itemsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 md:hidden">
        <button
          aria-label="Abrir menu"
          onClick={() => openModal("delivery-info")}
          className="rounded p-1 text-white hover:bg-white/10"
        >
          <Menu className="h-6 w-6" />
        </button>

        <a
          href="#"
          className="font-serif text-2xl font-bold tracking-tight text-white"
        >
          Deliplus
        </a>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openModal("favorites")}
            className="rounded p-1 text-white hover:bg-white/10"
            aria-label="Favoritos"
          >
            <Heart className="h-5 w-5" />
          </button>
          <button
            onClick={() => openModal("cart-drawer")}
            className="relative rounded p-1 text-white hover:bg-white/10"
            aria-label="Carrinho"
          >
            <ShoppingBag className="h-6 w-6" />
            {itemsCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#CB5A3C] text-[10px] font-bold text-white">
                {itemsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
