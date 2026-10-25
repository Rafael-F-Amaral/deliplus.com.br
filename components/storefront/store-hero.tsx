"use client"

import React from "react"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import {
  Clock,
  Bike,
  Star,
  MapPin,
  ArrowRight,
  Heart,
  Sparkles,
} from "lucide-react"

export function StoreHero() {
  const { store, openModal, favorites, toggleFavorite } = useStorefrontCart()
  const isFav = favorites.includes("store-casa-noma")

  return (
    <section className="border-b border-[#ECE7DE] bg-[#FAF8F5] pb-8 pt-6">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {/* Left Column: Store Identity & Metadata */}
          <div className="flex flex-col gap-5 lg:col-span-7">
            <div className="flex items-start gap-4">
              {/* Circular Emblem Logo */}
              <div className="relative flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border border-[#DED7CB] bg-[#F7F2EB] p-2 text-center shadow-xs">
                <Sparkles className="h-4 w-4 text-[#8C7A6B]" />
                <span className="font-serif text-[11px] font-bold tracking-wider text-[#3C3630]">
                  CASA
                </span>
                <span className="font-serif text-[11px] font-bold tracking-wider text-[#3C3630]">
                  NOMA
                </span>
              </div>

              {/* Title & Bio */}
              <div className="flex flex-col">
                <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#1C251F] md:text-5xl">
                  {store.name}
                </h1>
                <p className="mt-1 text-sm text-[#5D645E] md:text-base">
                  {store.bio}
                </p>

                {/* Tags */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {store.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-[#EFECE6] px-2.5 py-1 text-xs font-medium text-[#464C44]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Meta Row 1: Status, Prep Time, Free Delivery */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-[#4B534D] md:text-sm">
              <span className="flex items-center gap-1.5 text-[#1B6B38]">
                <span className="h-2 w-2 rounded-full bg-[#2E9B4F]" />
                Aberto agora
              </span>
              <span className="text-[#C5BEB3]">|</span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#6B726C]" />
                {store.prep_time}
              </span>
              <span className="text-[#C5BEB3]">|</span>
              <span className="flex items-center gap-1.5 text-[#2C382E]">
                <Bike className="h-3.5 w-3.5 text-[#6B726C]" />
                Entrega grátis acima de R$ 80
              </span>
            </div>

            {/* Meta Row 2: Rating, Address */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#5C645E] md:text-sm">
              <button
                onClick={() => openModal("delivery-info")}
                className="flex items-center gap-1 font-semibold text-[#1A261D] hover:underline"
              >
                <Star className="h-4 w-4 fill-[#F5A623] text-[#F5A623]" />
                <span>{store.rating.toString().replace(".", ",")}</span>
                <span className="font-normal text-[#757D77]">
                  ({store.reviews_count})
                </span>
              </button>

              <span className="text-[#C5BEB3]">|</span>

              <button
                onClick={() => openModal("delivery-info")}
                className="flex items-center gap-1 text-[#4F5751] transition hover:text-[#1A261D] hover:underline"
              >
                <MapPin className="h-3.5 w-3.5 text-[#6E7570]" />
                <span className="truncate">{store.address}</span>
              </button>
            </div>

            {/* Actions: Ver cardápio & Favoritar */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="#cardapio"
                className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A20] px-5 py-2.5 text-sm font-medium text-white shadow-xs transition hover:bg-[#273B2E]"
              >
                <span>Ver cardápio</span>
                <ArrowRight className="h-4 w-4" />
              </a>

              <button
                onClick={() => toggleFavorite("store-casa-noma")}
                aria-label="Favoritar loja"
                className={`flex h-10 w-10 items-center justify-center rounded-lg border transition ${
                  isFav
                    ? "border-[#CB5A3C] bg-[#FFF5F2] text-[#CB5A3C]"
                    : "border-[#DED8CE] bg-white text-[#4A534B] hover:bg-[#F5F2EB]"
                }`}
              >
                <Heart
                  className={`h-5 w-5 ${isFav ? "fill-[#CB5A3C]" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Right Column: Hero Banner Image */}
          <div className="relative overflow-hidden rounded-2xl border border-[#E8E2D5] shadow-sm lg:col-span-5">
            <img
              src={store.banner_url}
              alt="Casa Noma Pratos Frescos"
              className="h-64 w-full object-cover transition-transform duration-500 hover:scale-105 md:h-80"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
          </div>
        </div>
      </div>
    </section>
  )
}
