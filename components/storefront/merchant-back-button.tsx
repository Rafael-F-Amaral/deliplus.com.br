"use client"

import React, { useState, useEffect } from "react"
import { LayoutDashboard } from "lucide-react"

export function MerchantBackButton({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const checkAuth = () => {
      try {
        const clerk = (window as any).Clerk
        if (clerk?.user || (clerk?.session && clerk.session.status === "active")) {
          return true
        }
        const cookies = document.cookie || ""
        const uatMatch = cookies.match(/__client_uat=(\d+)/)
        if (uatMatch && Number(uatMatch[1]) > 0) {
          return true
        }
        if (cookies.includes("__session") && !cookies.includes("__client_uat=0")) {
          return true
        }
      } catch {
        // Safe fallback
      }
      return false
    }

    if (checkAuth()) {
      setIsLoggedIn(true)
      return
    }

    // Interval check for Clerk initialization
    const interval = setInterval(() => {
      if (checkAuth()) {
        setIsLoggedIn(true)
        clearInterval(interval)
      }
    }, 200)

    const timeout = setTimeout(() => {
      clearInterval(interval)
    }, 3000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  if (!isLoggedIn) return null

  if (compact) {
    return (
      <a
        href="/dashboard/orders"
        className={
          className ||
          "flex items-center gap-1.5 rounded-md bg-white/10 border border-white/20 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-white/20 transition cursor-pointer"
        }
        title="Painel do Lojista"
      >
        <LayoutDashboard className="h-3.5 w-3.5 text-emerald-400" />
        <span>Painel</span>
      </a>
    )
  }

  return (
    <a
      href="/dashboard/orders"
      className={
        className ||
        "flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2 text-xs font-semibold text-white transition-all shadow-xs cursor-pointer"
      }
      title="Voltar ao Painel do Lojista"
    >
      <LayoutDashboard className="h-4 w-4 text-emerald-400" />
      <span>Painel</span>
    </a>
  )
}
