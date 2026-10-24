'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useOrganization, useUser, useClerk } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { LogoDeli } from '@/components/LogoDeli'

import {
  ShoppingBag,
  BookOpen,
  Package,
  Megaphone,
  CircleDollarSign,
  BarChart3,
  Store,
  LogOut,
  CreditCard,
  ChevronDown,
  TrendingUp,
  Ticket,
  GraduationCap,
  Check
} from 'lucide-react'

function SvgIcon({ path, className }: { path: string, className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={path} />
    </svg>
  )
}

export interface SubMenuItem {
  name: string
  short: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export interface MenuItem {
  name: string
  short: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  subItems?: SubMenuItem[]
}

// Visão Geral removed as requested
const menuItems: MenuItem[] = [
  { name: 'Pedidos', short: 'Pedidos', href: '/dashboard/orders', icon: ShoppingBag },
  { name: 'Cardápio', short: 'Cardápio', href: '/dashboard/menu', icon: BookOpen },
  { name: 'Estoque', short: 'Estoque', href: '/dashboard/inventory', icon: Package },
  {
    name: 'Marketing',
    short: 'Marketing',
    href: '/dashboard/marketing',
    icon: Megaphone,
    subItems: [
      { name: 'Promoções', short: 'Promoções', href: '/dashboard/marketing/promotions', icon: TrendingUp },
      { name: 'Cupons de Desconto', short: 'Cupons', href: '/dashboard/marketing/coupons', icon: Ticket },
      { name: 'Academia Deli', short: 'Academia', href: '/dashboard/marketing/academy', icon: GraduationCap },
    ]
  },
  { name: 'Financeiro', short: 'Financeiro', href: '/dashboard/finance', icon: CircleDollarSign },
  { name: 'Relatórios', short: 'Relatórios', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Assinatura', short: 'Assinatura', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Minha Loja', short: 'Loja', href: '/dashboard/settings', icon: Store },
]

export interface DashboardSidebarProps {
  initialStores?: { name: string; slug: string }[]
}

export function DashboardSidebar({ initialStores = [] }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { user } = useUser()
  const { organization } = useOrganization()
  const { signOut } = useClerk()
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({})

  // Store switcher state
  const [selectedStoreSlug, setSelectedStoreSlug] = useState<string>(
    initialStores[0]?.slug || 'rafaelteste'
  )
  const [isStoreSwitcherOpen, setIsStoreSwitcherOpen] = useState(false)

  const currentStore = initialStores.find(s => s.slug === selectedStoreSlug) || initialStores[0]
  const storeName = currentStore?.name || organization?.name || 'RafaelTeste'
  const hasMultipleStores = initialStores.length > 1

  const userName = user?.fullName || user?.firstName || 'Rafael'
  const userEmail = user?.primaryEmailAddress?.emailAddress || 'lojista@deliplus.com.br'

  const isSubmenuOpen = (href: string) => {
    if (openSubmenus[href] !== undefined) {
      return openSubmenus[href]
    }
    return pathname.startsWith(href)
  }

  const toggleSubmenu = (href: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [href]: !isSubmenuOpen(href),
    }))
  }

  return (
    <>
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <aside className="hidden lg:flex w-[260px] bg-[#2E4233] dark:bg-[#17211A] text-white flex-col flex-shrink-0 select-none shadow-xl border-r border-transparent dark:border-[#233026] transition-colors duration-150">
        {/* 1. Deli+ Brand Header */}
        <div className="h-[70px] flex items-center justify-between px-6 border-b border-white/10 shrink-0">
          <Link href="/dashboard/orders" className="flex items-center gap-2 group">
            <LogoDeli variant="outline-white" className="h-6 w-auto transition-transform group-hover:scale-105" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E76F41] bg-white/10 px-2 py-0.5 rounded-full">
              Lojista
            </span>
          </Link>
        </div>

        {/* 2. Round Client Logo & Store Name (with multi-store switcher if > 1) */}
        <div className="px-5 py-4 border-b border-white/10 flex flex-col items-center text-center relative shrink-0">
          {/* Round Logo */}
          <div className="relative mb-2">
            <div className="w-14 h-14 rounded-full bg-white/15 border-2 border-white/25 shadow-md flex items-center justify-center overflow-hidden p-1">
              {organization?.imageUrl || user?.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={organization?.imageUrl || user?.imageUrl}
                  alt={storeName}
                  className="w-full h-full object-contain rounded-full"
                />
              ) : (
                <span className="font-serif text-xl font-bold text-white tracking-tight uppercase">
                  {storeName[0] || 'R'}
                </span>
              )}
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#2E4233] dark:border-[#17211A]" title="Loja Online"></span>
          </div>

          {/* Store Name & Multiple Stores Selector */}
          {hasMultipleStores ? (
            <div className="w-full relative">
              <button
                type="button"
                onClick={() => setIsStoreSwitcherOpen(!isStoreSwitcherOpen)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
              >
                <span className="font-serif text-base font-bold text-white tracking-tight truncate max-w-[170px]">
                  {storeName}
                </span>
                <ChevronDown className={cn("w-4 h-4 text-gray-300 transition-transform duration-200", isStoreSwitcherOpen && "rotate-180 text-white")} />
              </button>

              {/* Multi-store selector dropdown */}
              {isStoreSwitcherOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#213125] dark:bg-[#1D2620] border border-white/15 rounded-xl shadow-2xl py-1 z-40 animate-in fade-in-50 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left border-b border-white/10">
                    Alternar Loja
                  </div>
                  {initialStores.map((st) => (
                    <button
                      key={st.slug}
                      type="button"
                      onClick={() => {
                        setSelectedStoreSlug(st.slug)
                        setIsStoreSwitcherOpen(false)
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between",
                        st.slug === selectedStoreSlug
                          ? "bg-white/15 text-white font-bold"
                          : "text-gray-300 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <span className="truncate">{st.name}</span>
                      {st.slug === selectedStoreSlug && <Check className="w-3.5 h-3.5 text-[#E76F41]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="font-serif text-base font-bold text-white tracking-tight truncate max-w-[200px]">
                {storeName}
              </span>
              <span className="text-[11px] text-gray-300 font-medium mt-0.5">
                Loja Ativa
              </span>
            </div>
          )}
        </div>

        {/* 3. Navigation Menu Items */}
        <nav className="flex-1 px-4 py-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            if (item.subItems) {
              const isParentActive = pathname.startsWith(item.href)
              const expanded = isSubmenuOpen(item.href)

              return (
                <div key={item.href} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleSubmenu(item.href)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm transition-colors cursor-pointer text-left",
                      isParentActive
                        ? "bg-[#213125] dark:bg-[#233126] text-white relative after:absolute after:left-0 after:top-2 after:bottom-2 after:w-1 after:bg-[#E76F41] dark:after:bg-[#FF7D4F] after:rounded-r-md"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn("w-5 h-5", isParentActive ? "text-white" : "text-gray-400")} />
                      <span>{item.name}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-gray-400 transition-transform duration-200",
                        expanded && "rotate-180 text-white"
                      )}
                    />
                  </button>

                  {expanded && (
                    <div className="pl-4 pr-1 py-1 space-y-1 ml-3 border-l border-white/10">
                      {item.subItems.map((sub) => {
                        const isSubActive =
                          pathname === sub.href ||
                          (sub.href === '/dashboard/marketing/promotions' && pathname === '/dashboard/marketing')

                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={cn(
                              "flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors",
                              isSubActive
                                ? "bg-white/15 text-white font-medium shadow-sm"
                                : "text-gray-300 hover:text-white hover:bg-white/5"
                            )}
                          >
                            <sub.icon
                              className={cn(
                                "w-4 h-4 shrink-0",
                                isSubActive ? "text-[#E76F41] dark:text-[#FF7D4F]" : "text-gray-400"
                              )}
                            />
                            <span className="truncate">{sub.name}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-[#213125] dark:bg-[#233126] text-white relative after:absolute after:left-0 after:top-2 after:bottom-2 after:w-1 after:bg-[#E76F41] dark:after:bg-[#FF7D4F] after:rounded-r-md"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-400")} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* 4. Bottom User Profile & Deli Logout Button */}
        <div className="p-4 pb-12 border-t border-white/10 flex flex-col gap-3 shrink-0 bg-[#253629] dark:bg-[#151E17] transition-colors duration-150">
          {/* User Profile Block */}
          <div className="flex items-center gap-3 px-1 min-w-0">
            <div className="w-9 h-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center overflow-hidden shrink-0 p-0.5">
              {user?.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={user.imageUrl} alt={userName} className="w-full h-full object-contain rounded-full" />
              ) : (
                <span className="text-xs font-bold text-white uppercase">
                  {storeName[0] || userName[0] || 'R'}
                </span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate leading-tight">
                {userName}
              </span>
              <span className="text-[11px] text-gray-300 truncate">
                {userEmail}
              </span>
            </div>
          </div>

          {/* Sair da Conta (Deli Logout Button) */}
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: '/sign-in' })}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#CB5A3C] hover:bg-[#B34B30] active:scale-[0.98] text-white text-xs font-bold transition-all duration-200 shadow-sm cursor-pointer group border border-transparent"
          >
            <LogOut className="w-4 h-4 text-white transition-transform group-hover:-translate-x-0.5" />
            <span>Sair da conta</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation (Hidden on Desktop) */}
      <MobileNav menuItems={menuItems} />
    </>
  )
}

function MobileNav({ menuItems }: { menuItems: MenuItem[] }) {
  const pathname = usePathname()
  const { signOut } = useClerk()
  const [isOpen, setIsOpen] = useState(false)

  // First 4 items for the bottom bar: Pedidos, Cardápio, Estoque, Marketing
  const mainItems = menuItems.slice(0, 4)
  // Remaining items for the "Mais" menu
  const moreItems = menuItems.slice(4)

  const flattenedMoreItems: Array<{
    short: string
    href: string
    icon: React.ComponentType<{ className?: string }>
  }> = []

  moreItems.forEach((item) => {
    if (item.subItems) {
      item.subItems.forEach((sub) => {
        flattenedMoreItems.push({
          short: sub.short,
          href: sub.href,
          icon: sub.icon,
        })
      })
    } else {
      flattenedMoreItems.push({
        short: item.short,
        href: item.href,
        icon: item.icon,
      })
    }
  })

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-white dark:bg-[#17211A] border-t border-gray-100 dark:border-[#2A382E] flex items-center justify-around px-2 z-50 pb-safe transition-colors duration-150">
        {mainItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1.5 w-16"
              onClick={() => setIsOpen(false)}
            >
              <div className="relative p-1.5 rounded-md transition-colors">
                {isActive && (
                  <div className="absolute -top-[14px] left-1/2 -translate-x-1/2 w-8 h-[3px] bg-[#E76F41] rounded-b-md" />
                )}
                <item.icon className={cn("w-6 h-6", isActive ? "text-[#CB5A3C] dark:text-[#FF7D4F]" : "text-gray-500 dark:text-[#9CA79E]")} />
              </div>
              <span className={cn("text-[10px] font-medium", isActive ? "text-[#CB5A3C] dark:text-[#FF7D4F]" : "text-gray-500 dark:text-[#9CA79E]")}>
                {item.short}
              </span>
            </Link>
          )
        })}
        {/* 'Mais' Menu Item */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex flex-col items-center justify-center gap-1.5 w-16 cursor-pointer"
        >
          <div className="relative p-1.5">
            {isOpen && (
              <div className="absolute -top-[14px] left-1/2 -translate-x-1/2 w-8 h-[3px] bg-[#E76F41] rounded-b-md" />
            )}
            <SvgIcon path="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" className={cn("w-6 h-6", isOpen ? "text-[#CB5A3C] dark:text-[#FF7D4F]" : "text-gray-500 dark:text-[#9CA79E]")} />
          </div>
          <span className={cn("text-[10px] font-medium", isOpen ? "text-[#CB5A3C] dark:text-[#FF7D4F]" : "text-gray-500 dark:text-[#9CA79E]")}>
            Mais
          </span>
        </button>
      </nav>

      {/* 'Mais' Menu Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs" onClick={() => setIsOpen(false)}>
          <div
            className="absolute bottom-[72px] left-0 right-0 bg-white dark:bg-[#1B241E] rounded-t-2xl p-4 shadow-xl border-t border-transparent dark:border-[#2A382E] animate-in slide-in-from-bottom-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-6"></div>
            <div className="grid grid-cols-4 gap-y-6 gap-x-2">
              {flattenedMoreItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                      isActive ? "bg-[#CB5A3C]/10 dark:bg-[#CB5A3C]/20" : "bg-gray-50 dark:bg-[#25332A]"
                    )}>
                      <item.icon className={cn("w-5 h-5", isActive ? "text-[#CB5A3C] dark:text-[#FF7D4F]" : "text-gray-600 dark:text-[#9CA79E]")} />
                    </div>
                    <span className={cn("text-[11px] text-center font-medium", isActive ? "text-[#CB5A3C] dark:text-[#FF7D4F]" : "text-gray-600 dark:text-[#9CA79E]")}>
                      {item.short}
                    </span>
                  </Link>
                )
              })}

              {/* Logout Option */}
              <button
                type="button"
                onClick={() => signOut({ redirectUrl: '/sign-in' })}
                className="flex flex-col items-center gap-2 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-50 dark:bg-red-950/40 text-red-500">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="text-[11px] text-center font-medium text-red-600 dark:text-red-400">
                  Sair
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
