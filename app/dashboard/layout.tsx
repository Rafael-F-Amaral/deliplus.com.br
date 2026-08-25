import { DashboardSidebar } from '@/components/dashboard/sidebar'
import Image from 'next/image'

import { Bell, ChefHat, Search } from 'lucide-react'

function SvgIcon({ path, className }: { path: string, className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={path} />
    </svg>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F6F2]">
      <DashboardSidebar />

      <main className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Top Actions - Desktop */}
        <div className="hidden lg:flex absolute top-0 right-0 p-8 items-center gap-6 z-10">
          <button className="relative text-gray-500 hover:text-gray-900 transition-colors">
            <Bell className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-[#CB5A3C] rounded-full ring-2 ring-[#F7F6F2]"></span>
          </button>
          <div className="flex items-center gap-3 border-l border-gray-200 pl-6 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-[#405445] text-white flex items-center justify-center font-medium">
              AB
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900 leading-tight">Ana Beatriz</span>
              <span className="text-xs text-gray-500">Proprietária</span>
            </div>
          </div>
        </div>

        {/* Top Header - Mobile */}
        <header className="flex lg:hidden h-[64px] items-center justify-between px-4 border-b border-gray-100 bg-white sticky top-0 z-40">
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F7F6F2]">
          {children}
        </div>
      </main>
    </div>
  )
}
