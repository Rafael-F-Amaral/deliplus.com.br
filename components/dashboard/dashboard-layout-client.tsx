"use client"

import { usePathname } from "next/navigation"
import Image from "next/image"
import { Bell } from "lucide-react"

function SvgIcon({ path, className }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={path} />
    </svg>
  )
}

export function DashboardLayoutClient({
  children,
  sidebar
}: {
  children: React.ReactNode
  sidebar: React.ReactNode
}) {
  const pathname = usePathname()

  if (pathname === "/dashboard/stores/new") {
    return <div className="flex-1 min-h-screen bg-[#FAF8F0]">{children}</div>
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAF8F0]">
      {sidebar}

      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Actions - Desktop */}
        {/* Top Actions removidas conforme solicitado */}

        {/* Top Header - Mobile removido conforme solicitado */}
        
        {/* Page Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#FAF8F0]">
          {children}
        </div>
      </main>
    </div>
  )
}
