"use client"

import React from "react"
import { Search } from "lucide-react"
import { StorefrontCategory } from "@/types/storefront"

interface CategoryFilterBarProps {
  categories: StorefrontCategory[]
  selectedCategory: string
  onSelectCategory: (id: string) => void
  searchQuery: string
  onSearchChange: (q: string) => void
}

export function CategoryFilterBar({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}: CategoryFilterBarProps) {
  return (
    <div className="sticky top-[57px] z-30 mb-6 short:mb-4 border-b border-[#2E6B3E] dark:border-[#E76F41] bg-white/95 dark:bg-[#131A15]/95 py-2.5 md:py-3 short:py-2 backdrop-blur-md transition-colors">
      <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between md:gap-4">
        {/* Category Pills (horizontal scrollable on mobile/tablet) */}
        <div className="relative min-w-0 flex-1">
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-0.5 pr-6">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  className={`min-h-10 lg:min-h-8 shrink-0 rounded-full px-4 lg:px-3.5 py-1.5 text-sm lg:text-[13px] font-medium transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4482D] ${
                    isSelected
                      ? "bg-[#1B2A20] dark:bg-[#2E4233] text-white shadow-xs"
                      : "bg-[#F4F1EA] dark:bg-[#1B241E] text-[#424840] dark:text-[#9CA79E] hover:bg-[#EAE5DD] dark:hover:bg-[#25332A] dark:hover:text-[#F2EFE9]"
                  }`}
                >
                  {cat.name}
                </button>
              )
            })}
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-linear-to-l from-white/95 dark:from-[#131A15]/95 to-transparent"
          />
        </div>

        {/* Search Input - Visualmente nítido, perceptível e destacado */}
        <div className="relative w-full shrink-0 md:w-72 lg:w-80">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A534B] dark:text-[#CBD5E1] transition-colors pointer-events-none" />
          <input
            id="search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar no cardápio..."
            className="min-h-11 lg:min-h-9 w-full rounded-full border border-[#C5BCAD] hover:border-[#8E8475] dark:border-[#384D3E] dark:hover:border-[#4E6B56] bg-[#F6F3EC] dark:bg-[#1C261F] py-2.5 lg:py-1.5 pl-10 pr-4 text-base lg:text-sm font-medium text-[#1F2921] dark:text-[#F2EFE9] placeholder-[#5A635B] dark:placeholder-[#A0B0A4] transition-all shadow-xs outline-hidden focus:border-[#E76F41] dark:focus:border-[#FF7D4F] focus:bg-white dark:focus:bg-[#18231B] focus:ring-2 focus:ring-[#E76F41]/25 dark:focus:ring-[#FF7D4F]/25"
          />
        </div>
      </div>
    </div>
  )
}
