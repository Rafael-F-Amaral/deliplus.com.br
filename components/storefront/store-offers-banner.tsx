"use client"

import React, { useState } from "react"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { StorefrontProduct } from "@/types/storefront"

export function StoreOffersBanner() {
  const { openProductDetail } = useStorefrontCart()

  const offers: {
    id: string
    title: string
    subtitle: string
    combo_name: string
    discount_badge: string
    original_price_formatted: string
    promo_price_formatted: string
    image_url: string
    product_data: StorefrontProduct
  }[] = [
    {
      id: "offer-combo-bowl-cha",
      title: "Ofertas da semana",
      subtitle: "Sabores que combinam e preços que surpreendem.",
      combo_name: "Combo Bowl + Chá",
      discount_badge: "15% OFF",
      original_price_formatted: "R$ 49,90",
      promo_price_formatted: "R$ 42,40",
      image_url:
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&h=400&q=80",
      product_data: {
        id: "combo-equilibrio",
        category_id: "combos",
        category_name: "Combos da semana",
        name: "Combo Bowl + Chá",
        description:
          "Bowl de Frango Grelhado nutritivo acompanhado do clássico Chá gelado de hibisco e frutas vermelhas da casa.",
        price_cents: 4990,
        promo_price_cents: 4240,
        in_promo: true,
        discount_percentage: 15,
        image_url:
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&h=450&q=80",
        tags: ["Oferta da Semana", "15% OFF"],
      },
    },
    {
      id: "offer-combo-leve",
      title: "Super Oferta Fitness",
      subtitle: "Alimentação limpa e saborosa para seu dia a dia.",
      combo_name: "Combo Leve (Bowl + Suco Verde)",
      discount_badge: "15% OFF",
      original_price_formatted: "R$ 52,80",
      promo_price_formatted: "R$ 44,90",
      image_url:
        "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&h=400&q=80",
      product_data: {
        id: "combo-leve",
        category_id: "combos",
        category_name: "Combos da semana",
        name: "Combo Leve",
        description:
          "Bowl Noma individual acompanhado de um Suco Verde Detox fresco e refrescante batido na hora.",
        price_cents: 5280,
        promo_price_cents: 4490,
        in_promo: true,
        discount_percentage: 15,
        image_url:
          "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&h=450&q=80",
        tags: ["Oferta", "Saudável"],
      },
    },
  ]

  const [currentIndex, setCurrentIndex] = useState(0)
  const current = offers[currentIndex]

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? offers.length - 1 : prev - 1))
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === offers.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="relative my-6 overflow-hidden rounded-2xl border border-[#E9E2D5] bg-[#F7F2EB] p-4 shadow-2xs transition-all hover:border-[#DDD4C5] md:p-6">
      <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
        {/* Left Side: Offer Title & Subtitle */}
        <div className="flex flex-1 flex-col items-start text-left">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#CB5A3C]" />
            <h2 className="font-serif text-xl font-bold tracking-tight text-[#1F2B22] md:text-2xl">
              {current.title}
            </h2>
          </div>
          <p className="mt-1 text-xs text-[#636B65] md:text-sm">
            {current.subtitle}
          </p>
        </div>

        {/* Center / Right Side: Food Preview Card */}
        <div
          onClick={() => openProductDetail(current.product_data)}
          className="group flex w-full cursor-pointer flex-col items-center gap-4 rounded-xl bg-white/70 p-3 shadow-2xs backdrop-blur-xs transition hover:bg-white sm:flex-row md:w-auto md:p-4"
        >
          <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg">
            <img
              src={current.image_url}
              alt={current.combo_name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#1B271F]">
                {current.combo_name}
              </span>
              <span className="rounded bg-[#CB5A3C] px-2 py-0.5 text-[11px] font-bold text-white shadow-xs">
                {current.discount_badge}
              </span>
            </div>

            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xs text-[#808782] line-through">
                De {current.original_price_formatted} por
              </span>
              <span className="text-base font-bold text-[#1C261F] md:text-lg">
                {current.promo_price_formatted}
              </span>
            </div>
          </div>

          <div className="ml-auto">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B2A20] text-white shadow-xs transition group-hover:bg-[#283D2F]">
              <Plus className="h-4 w-4" />
            </span>
          </div>
        </div>

        {/* Slide Controls Desktop */}
        <div className="hidden items-center gap-2 md:flex">
          <button
            onClick={prevSlide}
            aria-label="Oferta anterior"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D5CDBD] bg-white text-[#4A534B] shadow-2xs transition hover:bg-[#F0ECE3]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Próxima oferta"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D5CDBD] bg-white text-[#4A534B] shadow-2xs transition hover:bg-[#F0ECE3]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Pagination Dots (Mobile) */}
      <div className="mt-3 flex justify-center gap-1.5 md:hidden">
        {offers.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Ver oferta ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              currentIndex === idx
                ? "w-5 bg-[#1B2A20]"
                : "w-1.5 bg-[#C9BFB0]"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
