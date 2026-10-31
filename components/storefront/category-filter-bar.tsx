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
    <div className="sticky top-[57px] z-30 mb-8 border-b border-[#2E6B3E] dark:border-[#E76F41] bg-white/95 dark:bg-[#131A15]/95 py-3.5 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 md:flex-row md:items-center md:justify-between md:px-6">
        {/* Category Pills (horizontal scrollable on mobile) */}
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-all cursor-pointer ${
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

        {/* Search Input */}
        <div className="relative w-full shrink-0 md:w-72">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7F8681] dark:text-[#9CA79E]" />
          <input
            id="search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar no cardápio"
            className="w-full rounded-full border border-[#DED7CB] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#1B241E] py-2 pl-9 pr-4 text-sm text-[#1F2921] dark:text-[#F2EFE9] placeholder-[#8C938E] dark:placeholder-[#6C7870] transition outline-hidden focus:border-[#1B2A20] dark:focus:border-[#4ADE80] focus:bg-white dark:focus:bg-[#1B241E] focus:ring-1 focus:ring-[#1B2A20] dark:focus:ring-[#4ADE80]"
          />
        </div>
      </div>
    </div>
  )
}
