'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

import { Home, ShoppingBag, ChefHat, BookOpen, User, Megaphone, CircleDollarSign, BarChart3, Users, Settings, LogOut } from 'lucide-react'

function SvgIcon({ path, className }: { path: string, className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={path} />
    </svg>
  )
}

const menuItems = [
  { name: 'Visão geral', short: 'Visão geral', href: '/dashboard', icon: Home },
  { name: 'Pedidos', short: 'Pedidos', href: '/dashboard/orders', icon: ShoppingBag },
  { name: 'Produção', short: 'Produção', href: '/dashboard/production', icon: ChefHat },
  { name: 'Cardápio', short: 'Cardápio', href: '/dashboard/menu', icon: BookOpen },
  { name: 'Clientes', short: 'Clientes', href: '/dashboard/customers', icon: User },
  { name: 'Marketing', short: 'Marketing', href: '/dashboard/marketing', icon: Megaphone },
  { name: 'Financeiro', short: 'Financeiro', href: '/dashboard/finance', icon: CircleDollarSign },
  { name: 'Relatórios', short: 'Relatórios', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Equipe', short: 'Equipe', href: '/dashboard/team', icon: Users },
  { name: 'Configurações', short: 'Config.', href: '/dashboard/settings', icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  // For the mobile bottom bar, we only show the first 4 items, and a "Mais" button
  const mobileNavItems = menuItems.slice(0, 4)

  return (
    <>
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <aside className="hidden lg:flex w-[260px] bg-[#2E4233] text-white flex-col flex-shrink-0">
        <div className="h-[88px] flex items-center px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl tracking-tight leading-none text-white">Sabor & Cia</span>
            </div>
          </Link>
        </div>

        <div className="px-4 mb-6">
          <button className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-md p-2 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#405445] text-sm flex items-center justify-center font-medium">
                SC
              </div>
              <span className="font-medium text-sm">Sabor & Cia Centro</span>
            </div>
            <SvgIcon path="M6 9l6 6 6-6" className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                  isActive 
                    ? "bg-[#213125] text-white relative after:absolute after:left-0 after:top-2 after:bottom-2 after:w-1 after:bg-[#E76F41] after:rounded-r-md" 
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-400")} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-6">
          <button className="w-full text-sm text-gray-400 flex items-center gap-2 hover:text-white transition-colors">
            <LogOut className="w-5 h-5" />
            Sair da conta
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation (Hidden on Desktop) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-white border-t border-gray-100 flex items-center justify-around px-2 z-50 pb-safe">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className="flex flex-col items-center justify-center gap-1.5 w-16"
            >
              <div className={cn(
                "relative p-1.5 rounded-md transition-colors",
                isActive ? "" : ""
              )}>
                {isActive && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-[#E76F41] rounded-b-md" />
                )}
                <item.icon className={cn("w-6 h-6", isActive ? "text-[#CB5A3C]" : "text-gray-500")} />
              </div>
              <span className={cn("text-[10px] font-medium", isActive ? "text-[#CB5A3C]" : "text-gray-500")}>
                {item.short}
              </span>
            </Link>
          )
        })}
        {/* 'Mais' Menu Item */}
        <button className="flex flex-col items-center justify-center gap-1.5 w-16">
          <div className="relative p-1.5">
            <SvgIcon path="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" className="w-6 h-6 text-gray-500" />
          </div>
          <span className="text-[10px] font-medium text-gray-500">Mais</span>
        </button>
      </nav>
    </>
  )
}
