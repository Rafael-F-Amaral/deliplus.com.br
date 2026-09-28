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

        {/* Top Header - Mobile */}
        <header className="flex lg:hidden h-[64px] items-center justify-between px-4 border-b border-gray-100 bg-[#FAF8F0] sticky top-0 z-40">
          <button className="p-2 text-gray-700">
            <SvgIcon path="M3 12h18 M3 6h18 M3 18h18" className="w-6 h-6" />
          </button>
          
          <div className="flex items-center">
            <Image 
              src="/logo.png" 
              alt="DELi+" 
              width={90} 
              height={30} 
              className="h-7 w-auto object-contain" 
              priority
            />
          </div>

          <div className="w-8 h-8 rounded-full bg-[#CB5A3C] text-white flex items-center justify-center text-xs font-medium">
            MN
          </div>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#FAF8F0]">
          {children}
        </div>
      </main>
    </div>
  )
}
