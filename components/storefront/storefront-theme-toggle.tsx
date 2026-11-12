"use client"

import React, { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"

export function StorefrontThemeToggle({
  variant = "header",
  className = "",
}: {
  variant?: "header" | "surface"
  className?: string
}) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const surfaceStyles =
    variant === "surface"
      ? "bg-white dark:bg-[#1B241E] hover:bg-[#F3ECE1] dark:hover:bg-[#25332A] border border-[#E2DBD0] dark:border-[#2A382E] text-[#1C2C22] dark:text-[#F2EFE9]"
      : "bg-white/10 hover:bg-white/20 border border-white/20 text-white"

  if (!mounted) {
    return (
      <div
        className={`h-11 w-11 md:h-9 md:w-9 shrink-0 rounded-lg ${
          variant === "surface"
            ? "bg-white dark:bg-[#1B241E] border border-[#E2DBD0] dark:border-[#2A382E]"
            : "bg-white/10 border border-white/20"
        } ${className}`}
      />
    )
  }

  const isDark = resolvedTheme === "dark" || theme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`relative flex shrink-0 items-center justify-center h-11 w-11 md:h-9 md:w-9 rounded-lg transition-all cursor-pointer shadow-xs group select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CB5A3C] after:content-[''] after:absolute after:-inset-1 [@media(pointer:fine)]:after:hidden ${surfaceStyles} ${className}`}
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      aria-label="Alternar tema claro e escuro"
    >
      <span className="relative flex items-center justify-center w-full h-full overflow-hidden rounded-lg">
        {isDark ? (
          <div className="relative flex items-center justify-center w-full h-full">
            <span className="star-twinkling-1 absolute top-1 left-1 w-0.5 h-0.5 bg-amber-200 rounded-full" />
            <span className="star-twinkling-2 absolute bottom-1 right-1.5 w-0.5 h-0.5 bg-indigo-200 rounded-full" />
            <svg
              viewBox="0 0 24 14"
              className="cloud-drifting-svg absolute w-4 h-2.5 text-white/40 bottom-1 left-0.5 z-0 pointer-events-none"
              fill="currentColor"
            >
              <path d="M18.5 12a4.5 4.5 0 0 0 .5-8.97A6 6 0 0 0 7.5 4a4.5 4.5 0 0 0-.5 8.97H18.5z" />
            </svg>
            <Moon className="moon-glowing-icon w-4 h-4 text-indigo-200 relative z-10 transition-transform duration-200 group-hover:scale-110" />
          </div>
        ) : (
          <div className="relative flex items-center justify-center w-full h-full">
            <Sun
              className={`sun-spinning-icon w-4 h-4 transition-all duration-300 ${
                variant === "surface"
                  ? "text-amber-600 group-hover:text-amber-500"
                  : "text-amber-300 group-hover:text-amber-200 group-hover:drop-shadow-[0_0_6px_rgba(252,211,77,0.8)]"
              }`}
            />
          </div>
        )}
      </span>
    </button>
  )
}
