'use client'

import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import { toggleStoreOpenStatus, getStoreOpenStatus } from '@/app/dashboard/settings/actions'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useOrganization, useUser, useClerk } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { LogoDeli } from '@/components/LogoDeli'

import {
  PlusCircle,
  Users,
  ShoppingBag,
  BookOpen,
  CircleDollarSign,
  Store,
  LogOut,
  CreditCard,
  ChevronDown,
  Check,
  PanelLeftOpen,
  PanelLeftClose,
} from 'lucide-react'

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

const menuItems: MenuItem[] = [
  { name: 'Pedidos', short: 'Pedidos', href: '/dashboard/orders', icon: ShoppingBag },
  { name: 'Cardápio', short: 'Cardápio', href: '/dashboard/menu', icon: BookOpen },
  { name: 'Clientes', short: 'Clientes', href: '/dashboard/customers', icon: Users },
  { name: 'Caixa & Finanças', short: 'Finanças', href: '/dashboard/finance', icon: CircleDollarSign },
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

  // Adaptive desktop width: compact (76px) on lg (1024-1279px), expanded (260px) on xl (>=1280px).
  // `null` keeps CSS breakpoint classes active on SSR/first paint to avoid hydration flicker.
  const [manualExpanded, setManualExpanded] = useState<boolean | null>(null)
  const isXlViewport = useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia('(min-width: 1280px)')
      mq.addEventListener('change', onStoreChange)
      return () => mq.removeEventListener('change', onStoreChange)
    },
    () => window.matchMedia('(min-width: 1280px)').matches,
    () => true
  )

  // Store switcher state
  const [selectedStoreSlug, setSelectedStoreSlug] = useState<string>(
    initialStores[0]?.slug || 'rafaelteste'
  )
  const [isStoreSwitcherOpen, setIsStoreSwitcherOpen] = useState(false)
  const storeSwitcherRef = useRef<HTMLDivElement>(null)

  // Store open/closed state
  const [isOpen, setIsOpen] = useState(true)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)')
    const handleBreakpointChange = (e: MediaQueryListEvent) => {
      setManualExpanded(null)
      window.dispatchEvent(
        new CustomEvent('deliplus:sidebar-toggle', {
          detail: { expanded: e.matches, width: e.matches ? 260 : 76, reset: true },
        })
      )
    }

    mq.addEventListener('change', handleBreakpointChange)
    return () => mq.removeEventListener('change', handleBreakpointChange)
  }, [])

  useEffect(() => {
    let isMounted = true
    getStoreOpenStatus().then((res) => {
      if (isMounted && res.success && typeof res.isOpen === 'boolean') {
        setIsOpen(res.isOpen)
      }
    })
    return () => {
      isMounted = false
    }
  }, [selectedStoreSlug])

  useEffect(() => {
    const handleStatusSync = (e: Event) => {
      const custom = e as CustomEvent<{ isOpen?: boolean }>
      if (typeof custom.detail?.isOpen === 'boolean') {
        setIsOpen(custom.detail.isOpen)
      }
    }
    const handleStoreSync = (e: Event) => {
      const custom = e as CustomEvent<{ storeSlug?: string }>
      if (custom.detail?.storeSlug) {
        setSelectedStoreSlug(custom.detail.storeSlug)
      }
    }

    window.addEventListener('deliplus:store-status-changed', handleStatusSync)
    window.addEventListener('deliplus:store-changed', handleStoreSync)
    return () => {
      window.removeEventListener('deliplus:store-status-changed', handleStatusSync)
      window.removeEventListener('deliplus:store-changed', handleStoreSync)
    }
  }, [])

  useEffect(() => {
    if (!isStoreSwitcherOpen) return

    const handleOutside = (event: MouseEvent) => {
      if (storeSwitcherRef.current && !storeSwitcherRef.current.contains(event.target as Node)) {
        setIsStoreSwitcherOpen(false)
      }
    }
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsStoreSwitcherOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [isStoreSwitcherOpen])

  const isEffectiveExpanded = manualExpanded ?? isXlViewport

  const handleToggleSidebar = () => {
    const next = !isEffectiveExpanded
    setManualExpanded(next)
    setIsStoreSwitcherOpen(false)
    window.dispatchEvent(
      new CustomEvent('deliplus:sidebar-toggle', {
        detail: { expanded: next, width: next ? 260 : 76 },
      })
    )
  }

  const handleToggleStoreStatus = async () => {
    if (isTogglingStatus) return
    const nextStatus = !isOpen
    setIsOpen(nextStatus)
    window.dispatchEvent(
      new CustomEvent('deliplus:store-status-changed', {
        detail: { isOpen: nextStatus, storeSlug: selectedStoreSlug },
      })
    )
    setIsTogglingStatus(true)
    try {
      const res = await toggleStoreOpenStatus(nextStatus)
      if (res && res.success === false) {
        setIsOpen(!nextStatus)
        window.dispatchEvent(
          new CustomEvent('deliplus:store-status-changed', {
            detail: { isOpen: !nextStatus, storeSlug: selectedStoreSlug },
          })
        )
      }
    } catch {
      setIsOpen(!nextStatus)
      window.dispatchEvent(
        new CustomEvent('deliplus:store-status-changed', {
          detail: { isOpen: !nextStatus, storeSlug: selectedStoreSlug },
        })
      )
    } finally {
      setIsTogglingStatus(false)
    }
  }

  const currentStore = initialStores.find((s) => s.slug === selectedStoreSlug) || initialStores[0]
  const storeName = currentStore?.name || organization?.name || 'RafaelTeste'
  const hasMultipleStores = initialStores.length > 1

  const userName = user?.fullName || user?.firstName || 'Rafael'
  const userEmail = user?.primaryEmailAddress?.emailAddress || 'lojista@deliplus.com.br'

  const asideWidthClass =
    manualExpanded === null
      ? 'lg:w-[76px] xl:w-[260px]'
      : manualExpanded
        ? 'w-[260px]'
        : 'w-[76px]'

  const expandedOnlyFlex =
    manualExpanded === null ? 'lg:hidden xl:flex' : manualExpanded ? 'flex' : 'hidden'
  const expandedOnlyInline =
    manualExpanded === null ? 'lg:hidden xl:inline' : manualExpanded ? 'inline' : 'hidden'
  const compactOnlyInline =
    manualExpanded === null ? 'lg:inline-flex xl:hidden' : manualExpanded ? 'hidden' : 'inline-flex'

  return (
    <>
      {/* Desktop Sidebar (Hidden on < lg and print) */}
      <aside
        aria-label="Menu lateral do lojista"
        className={cn(
          'hidden lg:flex lg:max-h-dvh lg:overflow-y-auto print:hidden bg-[#2E4233] dark:bg-[#17211A] text-white flex-col flex-shrink-0 select-none shadow-xl border-r border-transparent dark:border-[#233026] transition-[width,colors] duration-200 relative z-45',
          asideWidthClass
        )}
      >
        {/* 1. Deli+ Brand Header & Collapse Toggle */}
        <div
          className={cn(
            'h-[70px] short:h-14 ultrashort:h-11 flex items-center border-b border-white/10 shrink-0',
            manualExpanded === null
              ? 'lg:px-2 lg:justify-center xl:px-5 xl:justify-between ultrashort:xl:px-4'
              : manualExpanded
                ? 'px-5 justify-between ultrashort:px-4'
                : 'px-2 justify-center'
          )}
        >
          <Link
            href="/dashboard/orders"
            className={cn('items-center gap-2 group min-w-0', expandedOnlyFlex)}
          >
            <LogoDeli
              variant="outline-white"
              className="h-6 w-auto transition-transform group-hover:scale-105"
            />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFAA8A] bg-white/10 px-2 py-0.5 rounded-full shrink-0">
              Lojista
            </span>
          </Link>

          <button
            type="button"
            onClick={handleToggleSidebar}
            aria-label={isEffectiveExpanded ? 'Recolher menu lateral' : 'Expandir menu lateral'}
            title={isEffectiveExpanded ? 'Recolher menu lateral' : 'Expandir menu lateral'}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E76F41]"
          >
            <PanelLeftOpen
              className={cn(
                'w-5 h-5',
                manualExpanded === null
                  ? 'block xl:hidden'
                  : manualExpanded
                    ? 'hidden'
                    : 'block'
              )}
            />
            <PanelLeftClose
              className={cn(
                'w-5 h-5',
                manualExpanded === null
                  ? 'hidden xl:block'
                  : manualExpanded
                    ? 'block'
                    : 'hidden'
              )}
            />
          </button>
        </div>

        {/* 2. Round Client Logo, Store Name/Switcher & Open/Closed Status Toggle */}
        <div
          className={cn(
            'border-b border-white/10 flex flex-col items-center text-center relative shrink-0',
            manualExpanded === null
              ? 'lg:px-2 lg:py-3 ultrashort:max-xl:py-2 xl:px-5 xl:py-4 short:xl:py-2.5 ultrashort:xl:flex-row ultrashort:xl:items-center ultrashort:xl:text-left ultrashort:xl:gap-2.5 ultrashort:xl:px-3.5 ultrashort:xl:py-2'
              : manualExpanded
                ? 'px-5 py-4 short:py-2.5 ultrashort:flex-row ultrashort:items-center ultrashort:text-left ultrashort:gap-2.5 ultrashort:px-3.5 ultrashort:py-2'
                : 'px-2 py-3 ultrashort:py-2'
          )}
        >
          {/* Round Logo */}
          <div
            className={cn(
              'relative mb-2 short:mb-1.5 shrink-0',
              manualExpanded === null
                ? 'ultrashort:max-xl:mb-1 ultrashort:xl:mb-0'
                : manualExpanded
                  ? 'ultrashort:mb-0'
                  : 'ultrashort:mb-1'
            )}
          >
            <div
              className={cn(
                'rounded-full bg-white/15 border-2 border-white/25 shadow-md flex items-center justify-center overflow-hidden p-1 transition-[width,height] duration-200',
                manualExpanded === null
                  ? 'lg:w-10 lg:h-10 ultrashort:max-xl:w-9 ultrashort:max-xl:h-9 xl:w-14 xl:h-14 short:xl:w-11 short:xl:h-11 ultrashort:xl:w-9 ultrashort:xl:h-9'
                  : manualExpanded
                    ? 'w-14 h-14 short:w-11 short:h-11 ultrashort:w-9 ultrashort:h-9'
                    : 'w-10 h-10 ultrashort:w-9 ultrashort:h-9'
              )}
            >
              {organization?.imageUrl || user?.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={organization?.imageUrl || user?.imageUrl}
                  alt={storeName}
                  className="w-full h-full object-contain rounded-full"
                />
              ) : (
                <span className="font-serif text-lg xl:text-xl ultrashort:text-base font-bold text-white tracking-tight uppercase">
                  {storeName[0] || 'R'}
                </span>
              )}
            </div>
            <span
              className={cn(
                'absolute bottom-0 right-0 rounded-full border-2 border-[#2E4233] dark:border-[#17211A]',
                isOpen ? 'bg-emerald-500' : 'bg-amber-400',
                manualExpanded === null
                  ? 'lg:w-3 lg:h-3 xl:w-3.5 xl:h-3.5 ultrashort:w-2.5 ultrashort:h-2.5'
                  : manualExpanded
                    ? 'w-3.5 h-3.5 ultrashort:w-2.5 ultrashort:h-2.5'
                    : 'w-3 h-3 ultrashort:w-2.5 ultrashort:h-2.5'
              )}
              title={isOpen ? 'Loja Aberta' : 'Loja Fechada'}
            />
          </div>

          <div
            className={cn(
              'flex flex-col items-center min-w-0 w-full',
              manualExpanded === null
                ? 'ultrashort:xl:flex-1 ultrashort:xl:items-start'
                : manualExpanded
                  ? 'ultrashort:flex-1 ultrashort:items-start'
                  : ''
            )}
          >
            {/* Store Name & Multi-Store Switcher */}
            {hasMultipleStores ? (
              <div className="w-full relative" ref={storeSwitcherRef}>
                <button
                  type="button"
                  onClick={() => setIsStoreSwitcherOpen((prev) => !prev)}
                  aria-expanded={isStoreSwitcherOpen}
                  aria-label={`Alternar loja ativa (${storeName})`}
                  title={`Alternar loja: ${storeName}`}
                  className={cn(
                    'mx-auto flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E76F41]',
                    manualExpanded === null
                      ? 'lg:w-11 lg:h-8 xl:w-full xl:h-auto xl:gap-1.5 xl:py-1.5 xl:px-3 ultrashort:xl:justify-between ultrashort:xl:py-1 ultrashort:xl:px-2'
                      : manualExpanded
                        ? 'w-full gap-1.5 py-1.5 px-3 ultrashort:justify-between ultrashort:py-1 ultrashort:px-2'
                        : 'w-11 h-8'
                  )}
                >
                  <span
                    className={cn(
                      'font-serif text-base ultrashort:text-sm font-bold text-white tracking-tight truncate max-w-[170px]',
                      expandedOnlyInline
                    )}
                  >
                    {storeName}
                  </span>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-gray-200 transition-transform duration-200 shrink-0',
                      isStoreSwitcherOpen && 'rotate-180 text-white'
                    )}
                  />
                </button>

                {isStoreSwitcherOpen && (
                  <div
                    className={cn(
                      'bg-[#213125] dark:bg-[#1D2620] border border-white/15 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in-50 duration-150',
                      manualExpanded === null
                        ? 'lg:absolute lg:left-full lg:top-0 lg:ml-2 lg:w-56 xl:left-0 xl:right-0 xl:top-full xl:ml-0 xl:mt-1.5 xl:w-auto'
                        : manualExpanded
                          ? 'absolute top-full left-0 right-0 mt-1.5'
                          : 'absolute left-full top-0 ml-2 w-56'
                    )}
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-300 text-left border-b border-white/10">
                      Alternar Loja
                    </div>
                    {initialStores.map((st) => (
                      <button
                        key={st.slug}
                        type="button"
                        onClick={() => {
                          setSelectedStoreSlug(st.slug)
                          setIsStoreSwitcherOpen(false)
                          window.dispatchEvent(
                            new CustomEvent('deliplus:store-changed', {
                              detail: { storeSlug: st.slug },
                            })
                          )
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer',
                          st.slug === selectedStoreSlug
                            ? 'bg-white/15 text-white font-bold'
                            : 'text-gray-200 hover:text-white hover:bg-white/5'
                        )}
                      >
                        <span className="truncate">{st.name}</span>
                        {st.slug === selectedStoreSlug && (
                          <Check className="w-3.5 h-3.5 text-[#E76F41] shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <span
                className={cn(
                  'font-serif text-base ultrashort:text-sm font-bold text-white tracking-tight truncate max-w-full leading-tight',
                  expandedOnlyInline
                )}
              >
                {storeName}
              </span>
            )}

            {/* Store Open / Closed Toggle — Always visible, including multi-store accounts */}
            <button
              type="button"
              onClick={handleToggleStoreStatus}
              disabled={isTogglingStatus}
              aria-pressed={isOpen}
              aria-label={isOpen ? 'Loja Aberta — clique para fechar' : 'Loja Fechada — clique para abrir'}
              title={
                isOpen
                  ? 'Loja Aberta — clique para pausar o recebimento de pedidos'
                  : 'Loja Fechada — clique para abrir a loja para novos pedidos'
              }
              className={cn(
                'mt-2 short:mt-1.5 ultrashort:mt-1 flex items-center justify-center rounded-full text-[11px] font-bold transition-all cursor-pointer border select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E76F41]',
                manualExpanded === null
                  ? 'lg:w-11 lg:h-8 lg:px-0 ultrashort:max-xl:h-7 xl:w-auto xl:h-auto xl:min-h-8 xl:px-3 xl:py-1 xl:gap-1.5 ultrashort:xl:min-h-6 ultrashort:xl:px-2.5 ultrashort:xl:py-0.5 ultrashort:xl:text-[10px]'
                  : manualExpanded
                    ? 'min-h-8 px-3 py-1 gap-1.5 ultrashort:min-h-6 ultrashort:px-2.5 ultrashort:py-0.5 ultrashort:text-[10px]'
                    : 'w-11 h-8 px-0 ultrashort:h-7',
                isOpen
                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40 hover:bg-emerald-500/30 shadow-xs'
                  : 'bg-amber-500/20 text-amber-200 border-amber-400/40 hover:bg-amber-500/30'
              )}
            >
              <span
                className={cn(
                  'w-2 h-2 rounded-full shrink-0',
                  isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                )}
              />
              <span className={expandedOnlyInline}>
                {isOpen ? 'Loja Aberta' : 'Loja Fechada'}
              </span>
              <span
                className={cn(
                  'w-6 h-3.5 rounded-full relative transition-colors ml-0.5 shrink-0',
                  expandedOnlyInline,
                  isOpen ? 'bg-emerald-500' : 'bg-white/25'
                )}
              >
                <span
                  className={cn(
                    'w-2.5 h-2.5 rounded-full bg-white absolute top-0.5 transition-transform',
                    isOpen ? 'left-3' : 'left-0.5'
                  )}
                />
              </span>
            </button>
          </div>
        </div>

        {/* 3. Quick Action: Novo Pedido Balcão / Telefone (PDV) */}
        <div
          className={cn(
            'pt-3 pb-1 short:pt-2 ultrashort:pt-1.5 ultrashort:pb-0.5 shrink-0',
            manualExpanded === null
              ? 'lg:px-2 xl:px-4 ultrashort:xl:px-3'
              : manualExpanded
                ? 'px-4 ultrashort:px-3'
                : 'px-2'
          )}
        >
          <Link
            href="/dashboard/orders?novo=1"
            title="+ Novo Pedido (PDV)"
            aria-label="Novo Pedido (PDV)"
            className={cn(
              'mx-auto flex items-center justify-center rounded-xl bg-[#B4482D] hover:bg-[#9E3D25] active:scale-[0.98] text-white text-xs font-bold transition-all duration-200 shadow-md cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
              manualExpanded === null
                ? 'lg:w-11 lg:h-11 lg:px-0 ultrashort:max-xl:w-10 ultrashort:max-xl:h-9 xl:w-full xl:h-auto xl:py-2.5 xl:px-3 xl:gap-2 ultrashort:xl:py-1.5'
                : manualExpanded
                  ? 'w-full py-2.5 px-3 gap-2 ultrashort:py-1.5'
                  : 'w-11 h-11 px-0 ultrashort:w-10 ultrashort:h-9'
            )}
          >
            <PlusCircle className="w-5 h-5 xl:w-4 xl:h-4 text-white transition-transform group-hover:rotate-90 shrink-0" />
            <span className={expandedOnlyInline}>+ Novo Pedido (PDV)</span>
          </Link>
        </div>

        {/* 4. Core 5 Navigation Menu Items */}
        <nav
          aria-label="Menus principais"
          className={cn(
            'flex-1 min-h-0 overflow-y-auto',
            manualExpanded === null
              ? 'lg:px-2 lg:py-2 lg:space-y-1.5 ultrashort:max-xl:py-1 ultrashort:max-xl:space-y-0.5 xl:px-4 xl:py-3 xl:space-y-1 short:xl:py-2 ultrashort:xl:px-3 ultrashort:xl:py-1 ultrashort:xl:space-y-0.5'
              : manualExpanded
                ? 'px-4 py-3 space-y-1 short:py-2 ultrashort:px-3 ultrashort:py-1 ultrashort:space-y-0.5'
                : 'px-2 py-2 space-y-1.5 ultrashort:py-1 ultrashort:space-y-0.5'
          )}
        >
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.name}
                aria-label={item.name}
                className={cn(
                  'flex items-center rounded-lg text-sm ultrashort:text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E76F41]',
                  manualExpanded === null
                    ? 'lg:w-11 lg:h-11 lg:mx-auto lg:justify-center lg:px-0 ultrashort:max-xl:w-10 ultrashort:max-xl:h-9 xl:w-full xl:h-auto xl:mx-0 xl:justify-start xl:gap-3 xl:px-3 xl:py-2.5 short:xl:py-2 ultrashort:xl:py-1.5 ultrashort:xl:gap-2.5'
                    : manualExpanded
                      ? 'w-full justify-start gap-3 px-3 py-2.5 short:py-2 ultrashort:py-1.5 ultrashort:gap-2.5'
                      : 'w-11 h-11 mx-auto justify-center px-0 ultrashort:w-10 ultrashort:h-9',
                  isActive
                    ? 'bg-[#213125] dark:bg-[#233126] text-white font-semibold relative after:absolute after:left-0 after:top-2 after:bottom-2 after:w-1 after:bg-[#E76F41] dark:after:bg-[#FF7D4F] after:rounded-r-md'
                    : 'text-gray-200 hover:text-white hover:bg-white/10'
                )}
              >
                <item.icon
                  className={cn(
                    'w-5 h-5 ultrashort:w-4 ultrashort:h-4 shrink-0',
                    isActive ? 'text-white' : 'text-gray-300'
                  )}
                />
                <span className={cn('truncate', expandedOnlyInline)}>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* 5. Bottom User Profile, Billing & Logout Button */}
        <div
          className={cn(
            'border-t border-white/10 flex flex-col gap-3 short:gap-2 ultrashort:gap-1.5 shrink-0 bg-[#253629] dark:bg-[#151E17] transition-colors duration-150',
            manualExpanded === null
              ? 'lg:px-2 lg:py-3 lg:pb-4 ultrashort:max-xl:py-2 ultrashort:max-xl:pb-2.5 xl:p-4 xl:pb-6 short:xl:p-3 short:xl:pb-3 ultrashort:xl:p-2.5 ultrashort:xl:pb-2.5'
              : manualExpanded
                ? 'p-4 pb-6 short:p-3 short:pb-3 ultrashort:p-2.5 ultrashort:pb-2.5'
                : 'px-2 py-3 pb-4 ultrashort:py-2 ultrashort:pb-2.5'
          )}
        >
          {/* User Profile Block */}
          <div
            className={cn(
              'flex items-center min-w-0',
              manualExpanded === null
                ? 'lg:justify-center xl:justify-start xl:gap-3 xl:px-1 ultrashort:xl:gap-2'
                : manualExpanded
                  ? 'justify-start gap-3 px-1 ultrashort:gap-2'
                  : 'justify-center'
            )}
          >
            <div
              className="w-9 h-9 ultrashort:w-7 ultrashort:h-7 rounded-full bg-white/15 border border-white/20 flex items-center justify-center overflow-hidden shrink-0 p-0.5"
              title={`${userName} (${userEmail})`}
            >
              {user?.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={user.imageUrl} alt={userName} className="w-full h-full object-contain rounded-full" />
              ) : (
                <span className="text-xs font-bold text-white uppercase">
                  {storeName[0] || userName[0] || 'R'}
                </span>
              )}
            </div>
            <div className={cn('flex-col min-w-0', expandedOnlyFlex)}>
              <span className="text-xs font-bold text-white truncate leading-tight">
                {userName}
              </span>
              <span className="text-[11px] text-gray-300 truncate ultrashort:hidden">
                {userEmail}
              </span>
            </div>
          </div>

          {/* Assinatura & Plano */}
          <Link
            href="/dashboard/billing"
            title="Assinatura & Plano"
            aria-label="Assinatura & Plano"
            className={cn(
              'mx-auto flex items-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E76F41]',
              manualExpanded === null
                ? 'lg:w-11 lg:h-11 lg:justify-center lg:px-0 ultrashort:max-xl:w-10 ultrashort:max-xl:h-9 xl:w-full xl:h-auto xl:justify-between xl:py-2 xl:px-3 ultrashort:xl:py-1.5 ultrashort:xl:px-2.5'
                : manualExpanded
                  ? 'w-full justify-between py-2 px-3 ultrashort:py-1.5 ultrashort:px-2.5'
                  : 'w-11 h-11 justify-center px-0 ultrashort:w-10 ultrashort:h-9'
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <CreditCard className="w-4 h-4 xl:w-3.5 xl:h-3.5 text-[#E76F41] shrink-0" />
              <span className={cn('truncate', expandedOnlyInline)}>Assinatura & Plano</span>
            </div>
            <span
              className={cn(
                'text-[10px] text-emerald-300 font-bold uppercase tracking-wider bg-emerald-950/70 border border-emerald-700/50 px-1.5 py-0.5 rounded shrink-0',
                expandedOnlyInline
              )}
            >
              Ativo
            </span>
          </Link>

          {/* Sair da Conta (Deli Logout Button) */}
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: '/sign-in' })}
            title="Sair da conta"
            aria-label="Sair da conta"
            className={cn(
              'mx-auto flex items-center justify-center rounded-xl bg-[#B4482D] hover:bg-[#9E3D25] active:scale-[0.98] text-white text-xs font-bold transition-all duration-200 shadow-sm cursor-pointer group border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
              manualExpanded === null
                ? 'lg:w-11 lg:h-11 lg:px-0 ultrashort:max-xl:w-10 ultrashort:max-xl:h-9 xl:w-full xl:h-auto xl:py-2.5 xl:px-3 xl:gap-2 ultrashort:xl:py-1.5'
                : manualExpanded
                  ? 'w-full py-2.5 px-3 gap-2 ultrashort:py-1.5'
                  : 'w-11 h-11 px-0 ultrashort:w-10 ultrashort:h-9'
            )}
          >
            <LogOut className="w-4 h-4 text-white transition-transform group-hover:-translate-x-0.5 shrink-0" />
            <span className={expandedOnlyInline}>Sair da conta</span>
            <span className={cn('sr-only', compactOnlyInline)}>Sair da conta</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation (Hidden on >= lg and print) */}
      <MobileNav menuItems={menuItems} />
    </>
  )
}

function MobileNav({ menuItems }: { menuItems: MenuItem[] }) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navegação principal mobile"
      className="lg:hidden print:hidden fixed bottom-0 left-0 right-0 h-[calc(72px+env(safe-area-inset-bottom))] bg-white/95 dark:bg-[#17211A]/95 backdrop-blur-md border-t border-gray-200 dark:border-[#2A382E] flex items-center justify-around px-1.5 sm:px-2 z-50 pb-safe transition-colors duration-150"
    >
      {menuItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className="relative flex-1 min-w-0 min-h-[44px] flex flex-col items-center justify-center gap-1 py-1 px-0.5 rounded-lg"
          >
            {isActive && (
              <span
                aria-hidden="true"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-[#B4482D] dark:bg-[#FF7D4F] rounded-b-md"
              />
            )}
            <item.icon
              className={cn(
                'w-5 h-5 sm:w-6 sm:h-6 shrink-0',
                isActive
                  ? 'text-[#B4482D] dark:text-[#FF7D4F]'
                  : 'text-[#4B5563] dark:text-[#9CA79E]'
              )}
            />
            <span
              className={cn(
                'text-[10px] leading-tight truncate max-w-full',
                isActive
                  ? 'font-bold text-[#B4482D] dark:text-[#FF7D4F]'
                  : 'font-medium text-[#4B5563] dark:text-[#9CA79E]'
              )}
            >
              {item.short}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
