"use client"

import React, { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"

export function StorefrontThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-white/10 border border-white/20" />
    )
  }

  const isDark = resolvedTheme === "dark" || theme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer shadow-xs"
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      aria-label="Alternar tema claro e escuro"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-300" />
      ) : (
        <Moon className="w-4 h-4 text-white" />
      )}
    </button>
  )
}
