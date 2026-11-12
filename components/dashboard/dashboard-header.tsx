'use client'

import React, { useState, useRef, useEffect, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser, useClerk, useOrganization } from '@clerk/nextjs'
import { useTheme } from '@/components/theme-provider'
import { toggleStoreOpenStatus, getStoreOpenStatus } from '@/app/dashboard/settings/actions'
import { LogoDeli } from '@/components/LogoDeli'
import {
  Sun,
  Moon,
  Bell,
  LogOut,
  Store,
  CreditCard,
  ExternalLink,
  CheckCheck,
  ChevronDown,
  Sparkles,
  Info,
  Gift,
  Menu,
  X,
  PlusCircle,
  ShoppingBag,
  BookOpen,
  Users,
  CircleDollarSign,
  BarChart3,
  Package,
  Megaphone,
  GraduationCap,
  ShieldCheck,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotificationItem {
  id: string
  title: string
  message: string
  time: string
  isRead: boolean
  type: 'info' | 'update' | 'tip'
  actionUrl?: string
  actionLabel?: string
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Bem-vindo ao DeliPlus! 🍕',
    message: 'Seu painel operacional está pronto. Cadastre seus produtos no Cardápio e comece a receber pedidos online.',
    time: 'Hoje',
    isRead: false,
    type: 'info',
    actionUrl: '/dashboard/menu',
    actionLabel: 'Ver Cardápio',
  },
  {
    id: '2',
    title: 'Central de Promoções Ativa 🔥',
    message: 'Destaque seus pratos com preços promocionais direto no cardápio para impulsionar suas vendas.',
    time: 'Hoje',
    isRead: false,
    type: 'update',
    actionUrl: '/dashboard/marketing/promotions',
    actionLabel: 'Ver Promoções',
  },
  {
    id: '3',
    title: 'Dica de Vendas: Fotos nos Produtos 📸',
    message: 'Restaurantes com fotos em todos os itens do cardápio vendem até 40% a mais no delivery.',
    time: 'Ontem',
    isRead: true,
    type: 'tip',
    actionUrl: '/dashboard/menu',
    actionLabel: 'Adicionar Fotos',
  },
]

const CORE_MENU_LINKS = [
  { name: 'Pedidos', href: '/dashboard/orders', icon: ShoppingBag },
  { name: 'Cardápio', href: '/dashboard/menu', icon: BookOpen },
  { name: 'Clientes', href: '/dashboard/customers', icon: Users },
  { name: 'Caixa & Finanças', href: '/dashboard/finance', icon: CircleDollarSign },
  { name: 'Minha Loja', href: '/dashboard/settings', icon: Store },
]

const SECONDARY_MENU_LINKS = [
  { name: 'Relatórios', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Estoque', href: '/dashboard/inventory', icon: Package },
  { name: 'Promoções', href: '/dashboard/marketing/promotions', icon: Megaphone },
  { name: 'Academia DeliPlus', href: '/dashboard/marketing/academy', icon: GraduationCap },
  { name: 'Equipe', href: '/dashboard/team', icon: ShieldCheck },
]

export interface DashboardHeaderProps {
  initialStores?: { name: string; slug: string }[]
}

export function DashboardHeader({ initialStores = [] }: DashboardHeaderProps) {
  const pathname = usePathname()
  const { user } = useUser()
  const { signOut } = useClerk()
  const { organization } = useOrganization()

  // Real Dark/Light Theme Integration via next-themes
  const { theme, setTheme, resolvedTheme } = useTheme()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark')

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  // Profile dropdown state
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // Mobile/Tablet drawer state (< lg), scoped to current pathname so route navigation auto-closes it
  const [menuOpenPath, setMenuOpenPath] = useState<string | null>(null)
  const [storeListOpenPath, setStoreListOpenPath] = useState<string | null>(null)
  const isMobileMenuOpen = menuOpenPath === pathname
  const isStoreListOpen = storeListOpenPath === pathname
  const setIsMobileMenuOpen = (open: boolean) => setMenuOpenPath(open ? pathname : null)
  const setIsStoreListOpen = (open: boolean) => setStoreListOpenPath(open ? pathname : null)

  // Store selector & open/closed sync state
  const [selectedStoreSlug, setSelectedStoreSlug] = useState<string>(
    initialStores[0]?.slug || ''
  )
  const [isOpen, setIsOpen] = useState(true)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)

  const unreadCount = notifications.filter((n) => !n.isRead).length

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

  // Close dropdowns/drawer on click outside and Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsNotifOpen(false)
        setIsProfileOpen(false)
        setMenuOpenPath(null)
        setStoreListOpenPath(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleToggleStoreStatus = async () => {
    if (isTogglingStatus) return
    const nextStatus = !isOpen
    setIsOpen(nextStatus)
    window.dispatchEvent(
      new CustomEvent('deliplus:store-status-changed', {
        detail: { isOpen: nextStatus, storeSlug },
      })
    )
    setIsTogglingStatus(true)
    try {
      const res = await toggleStoreOpenStatus(nextStatus)
      if (res && res.success === false) {
        setIsOpen(!nextStatus)
        window.dispatchEvent(
          new CustomEvent('deliplus:store-status-changed', {
            detail: { isOpen: !nextStatus, storeSlug },
          })
        )
      }
    } catch {
      setIsOpen(!nextStatus)
      window.dispatchEvent(
        new CustomEvent('deliplus:store-status-changed', {
          detail: { isOpen: !nextStatus, storeSlug },
        })
      )
    } finally {
      setIsTogglingStatus(false)
    }
  }

  const handleSelectStore = (slug: string) => {
    setSelectedStoreSlug(slug)
    setIsStoreListOpen(false)
    window.dispatchEvent(
      new CustomEvent('deliplus:store-changed', {
        detail: { storeSlug: slug },
      })
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const markSingleAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  const currentStore =
    initialStores.find((s) => s.slug === selectedStoreSlug) || initialStores[0]
  const hasMultipleStores = initialStores.length > 1

  const userName = user?.fullName || user?.firstName || 'Rafael'
  const userEmail =
    user?.primaryEmailAddress?.emailAddress || 'lojista@deliplus.com.br'
  const storeName = currentStore?.name || organization?.name || 'RafaelTeste'
  const storeSlug =
    currentStore?.slug ||
    (organization?.slug ? organization.slug.replace(/-\d+$/, '') : 'rafaelteste')

  return (
    <>
      <header className="print:hidden h-14 lg:h-16 border-b border-[#ECE7D8] dark:border-[#2A382E] bg-[#FAF8F0]/90 dark:bg-[#131A15]/90 backdrop-blur-md px-2.5 sm:px-4 lg:px-7 flex items-center justify-between gap-2 shrink-0 relative z-40 transition-colors duration-150">
        {/* Left side (< lg): Menu Drawer Trigger + Adaptive Store Status/Name + Quick PDV Shortcut */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(true)
              setIsNotifOpen(false)
              setIsProfileOpen(false)
            }}
            aria-label="Abrir menu da loja"
            aria-expanded={isMobileMenuOpen}
            className="lg:hidden inline-flex items-center justify-center gap-1.5 min-h-11 min-w-11 px-2.5 rounded-xl bg-white dark:bg-[#1B241E] border border-[#E3E1D9] dark:border-[#2A382E] text-[#2E4233] dark:text-[#F2EFE9] hover:bg-[#F5F2E9] dark:hover:bg-[#25332A] text-xs font-semibold shadow-xs cursor-pointer shrink-0 transition-colors"
          >
            <Menu className="w-5 h-5 shrink-0" />
            <span className="hidden min-[360px]:inline">Menu</span>
          </button>

          <button
            type="button"
            onClick={handleToggleStoreStatus}
            disabled={isTogglingStatus}
            aria-pressed={isOpen}
            aria-label={isOpen ? 'Loja Aberta — clique para fechar' : 'Loja Fechada — clique para abrir'}
            title={isOpen ? 'Loja Aberta — clique para fechar' : 'Loja Fechada — clique para abrir'}
            className={cn(
              'lg:hidden inline-flex items-center gap-1.5 min-h-11 px-2.5 sm:px-3 rounded-full text-[11px] font-bold border transition-colors cursor-pointer shrink-0 select-none',
              isOpen
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700/60 hover:bg-amber-100 dark:hover:bg-amber-900/60'
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full shrink-0',
                isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              )}
            />
            <span>{isOpen ? 'Aberta' : 'Fechada'}</span>
          </button>

          <span className="hidden md:inline-block lg:hidden font-serif text-sm font-bold text-[#2E4233] dark:text-[#F2EFE9] truncate max-w-[180px]">
            {storeName}
          </span>

          <Link
            href="/dashboard/orders?novo=1"
            className="hidden sm:inline-flex lg:hidden items-center gap-1.5 min-h-10 px-3 rounded-xl bg-[#B4482D] hover:bg-[#9E3D25] text-white text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5 shrink-0" />
            <span>+ Novo Pedido</span>
          </Link>
        </div>

        {/* Right side: Theme Toggle, Notification Bell, Ver Loja, User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3 shrink-0">
          {/* 1. Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            className="relative w-11 h-11 lg:w-10 lg:h-10 rounded-full bg-white dark:bg-[#1B241E] border border-[#E3E1D9] dark:border-[#2A382E] text-[#2E4233] dark:text-[#F2EFE9] hover:bg-[#F5F2E9] dark:hover:bg-[#25332A] flex items-center justify-center transition-all duration-200 shadow-xs cursor-pointer group overflow-hidden select-none"
            aria-label="Alternar tema claro/escuro"
          >
            {isDark ? (
              <div className="relative flex items-center justify-center w-full h-full">
                <span className="star-twinkling-1 absolute top-1.5 left-2 w-1 h-1 bg-amber-200 rounded-full" />
                <span className="star-twinkling-2 absolute bottom-2 right-2.5 w-1 h-1 bg-indigo-200 rounded-full" />
                <span className="star-twinkling-3 absolute top-2 right-2 w-0.5 h-0.5 bg-white rounded-full" />
                <svg
                  viewBox="0 0 24 14"
                  className="cloud-drifting-svg absolute w-5 h-3 text-white/50 dark:text-white/30 bottom-1.5 left-1 z-0 pointer-events-none"
                  fill="currentColor"
                >
                  <path d="M18.5 12a4.5 4.5 0 0 0 .5-8.97A6 6 0 0 0 7.5 4a4.5 4.5 0 0 0-.5 8.97H18.5z" />
                </svg>
                <Moon className="moon-glowing-icon w-5 h-5 text-indigo-300 relative z-10 transition-transform duration-200 group-hover:scale-110" />
              </div>
            ) : (
              <div className="relative flex items-center justify-center w-full h-full">
                <Sun className="sun-spinning-icon w-5 h-5 text-amber-600 transition-all duration-300 group-hover:text-amber-500 group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              </div>
            )}
          </button>

          {/* 2. Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setIsNotifOpen((prev) => !prev)
                setIsProfileOpen(false)
              }}
              title="Mensagens e comunicados do Deli"
              aria-expanded={isNotifOpen}
              className={cn(
                'relative w-11 h-11 lg:w-10 lg:h-10 rounded-full bg-white dark:bg-[#1B241E] border border-[#E3E1D9] dark:border-[#2A382E] flex items-center justify-center transition-all duration-200 shadow-xs cursor-pointer',
                isNotifOpen
                  ? 'bg-[#F5F2E9] dark:bg-[#25332A] text-[#B4482D] dark:text-[#FF7D4F] border-[#B4482D]/40'
                  : 'text-[#2E4233] dark:text-[#F2EFE9] hover:text-[#B4482D] dark:hover:text-[#FF7D4F] hover:bg-[#F5F2E9] dark:hover:bg-[#25332A]'
              )}
              aria-label="Notificações do DeliPlus"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#B4482D] text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#131A15] animate-in zoom-in-50">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Popover */}
            {isNotifOpen && (
              <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[380px] max-h-[calc(100dvh-6rem)] flex flex-col bg-white dark:bg-[#1B241E] rounded-2xl shadow-2xl border border-[#E3E1D9] dark:border-[#2A382E] py-3 z-[100] animate-in fade-in-50 slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between px-4 pb-2.5 border-b border-gray-100 dark:border-[#2A382E] shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-[#2E4233] dark:text-[#F2EFE9] text-base">
                      Mensagens Deli
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#B4482D]/10 dark:bg-[#E76F41]/20 text-[#9A3B22] dark:text-[#FF9E7A]">
                      Oficial
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="min-h-9 lg:min-h-8 px-2.5 lg:px-1.5 rounded-md text-[11px] font-medium text-gray-600 dark:text-[#9CA79E] hover:text-[#B4482D] dark:hover:text-[#FF7D4F] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Marcar lidas
                    </button>
                  )}
                </div>

                <div className="flex-1 min-h-0 max-h-[340px] overflow-y-auto divide-y divide-gray-100 dark:divide-[#25332A]">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-[#9CA79E] text-sm">
                      Nenhuma mensagem no momento.
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => markSingleAsRead(item.id)}
                        className={cn(
                          'p-3.5 hover:bg-[#FAF9F5] dark:hover:bg-[#222C25] transition-colors cursor-pointer flex gap-3',
                          !item.isRead && 'bg-[#FAF8F0]/70 dark:bg-[#243026]/70'
                        )}
                      >
                        <div className="mt-0.5 shrink-0">
                          {item.type === 'update' && (
                            <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center">
                              <Sparkles className="w-3.5 h-3.5" />
                            </div>
                          )}
                          {item.type === 'info' && (
                            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                              <Info className="w-3.5 h-3.5" />
                            </div>
                          )}
                          {item.type === 'tip' && (
                            <div className="w-7 h-7 rounded-full bg-[#B4482D]/10 dark:bg-[#B4482D]/20 text-[#9A3B22] dark:text-[#FF7D4F] flex items-center justify-center">
                              <Gift className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h4 className="text-xs font-bold text-[#1A241E] dark:text-[#F2EFE9] truncate">
                              {item.title}
                            </h4>
                            <span className="text-[10px] text-gray-500 dark:text-[#9CA79E] shrink-0">
                              {item.time}
                            </span>
                          </div>
                          <p className="text-[12px] text-gray-600 dark:text-[#9CA79E] leading-snug line-clamp-2">
                            {item.message}
                          </p>
                          {item.actionUrl && (
                            <Link
                              href={item.actionUrl}
                              onClick={() => setIsNotifOpen(false)}
                              className="inline-flex items-center min-h-9 lg:min-h-0 mt-1 lg:mt-2 text-[11px] font-bold text-[#B4482D] dark:text-[#FF7D4F] hover:underline"
                            >
                              {item.actionLabel || 'Acessar'} →
                            </Link>
                          )}
                        </div>
                        {!item.isRead && (
                          <div className="shrink-0 mt-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#B4482D] dark:bg-[#FF7D4F] block" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="px-4 pt-2.5 border-t border-gray-100 dark:border-[#2A382E] flex items-center justify-center text-center shrink-0">
                  <p className="text-[11px] text-gray-600 dark:text-[#9CA79E]">
                    Mensagens e novidades enviadas pelo suporte DeliPlus.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Link: Acessar Loja no Storefront */}
          <Link
            href={`/${storeSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir Storefront da loja em nova aba"
            className="hidden sm:inline-flex items-center gap-1.5 min-h-10 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1B241E] border border-[#E3E1D9] dark:border-[#2A382E] text-xs font-semibold text-[#1A241E] dark:text-[#F2EFE9] hover:text-emerald-700 dark:hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all duration-200 shadow-xs cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>Ver Loja</span>
          </Link>

          {/* 3. User Profile */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen((prev) => !prev)
                setIsNotifOpen(false)
              }}
              aria-expanded={isProfileOpen}
              className={cn(
                'flex items-center justify-center gap-2 min-h-11 min-w-11 lg:min-h-10 lg:min-w-10 p-1 sm:px-2.5 sm:py-1.5 rounded-full sm:rounded-xl bg-white dark:bg-[#1B241E] border border-[#E3E1D9] dark:border-[#2A382E] hover:bg-[#F5F2E9] dark:hover:bg-[#25332A] transition-all duration-200 shadow-xs cursor-pointer',
                isProfileOpen && 'border-[#B4482D]/40 bg-[#F5F2E9] dark:bg-[#25332A]'
              )}
              aria-label="Menu do perfil do usuário"
            >
              <div className="w-8 h-8 rounded-full bg-[#2E4233] dark:bg-[#25332A] text-white overflow-hidden flex items-center justify-center shrink-0 border border-white/40 dark:border-white/20 p-0.5">
                {user?.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={user.imageUrl}
                    alt={userName}
                    className="w-full h-full object-contain rounded-full"
                  />
                ) : (
                  <span className="text-xs font-bold uppercase">
                    {storeName[0] || userName[0] || 'R'}
                  </span>
                )}
              </div>
              <div className="hidden md:flex flex-col text-left pr-1">
                <span className="text-xs font-bold text-[#1A241E] dark:text-[#F2EFE9] leading-tight truncate max-w-[120px]">
                  {userName}
                </span>
                <span className="text-[10px] text-gray-600 dark:text-[#9CA79E] truncate max-w-[120px]">
                  Administrador
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-600 dark:text-[#9CA79E] hidden sm:block shrink-0" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-[#1B241E] rounded-2xl shadow-2xl border border-[#E3E1D9] dark:border-[#2A382E] py-2 z-[100] animate-in fade-in-50 slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-[#2A382E] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2E4233] dark:bg-[#25332A] text-white overflow-hidden flex items-center justify-center shrink-0 border border-white/20 p-0.5">
                    {user?.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={user.imageUrl}
                        alt={userName}
                        className="w-full h-full object-contain rounded-full"
                      />
                    ) : (
                      <span className="text-sm font-bold uppercase">
                        {storeName[0] || userName[0] || 'R'}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-[#1A241E] dark:text-[#F2EFE9] truncate">
                      {userName}
                    </span>
                    <span className="text-[11px] text-gray-600 dark:text-[#9CA79E] truncate">
                      {userEmail}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href={`/${storeSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsProfileOpen(false)}
                    className="w-full min-h-10 flex items-center justify-between px-4 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <ExternalLink className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      <span>Ver Loja no Storefront</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                      Ao vivo
                    </span>
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="w-full min-h-10 flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 dark:text-[#9CA79E] hover:text-[#B4482D] dark:hover:text-[#FF7D4F] hover:bg-[#FAF9F5] dark:hover:bg-[#25332A] transition-colors"
                  >
                    <Store className="w-4 h-4 text-gray-500 dark:text-[#9CA79E]" />
                    <span>Minha Loja & Configurações</span>
                  </Link>
                  <Link
                    href="/dashboard/billing"
                    onClick={() => setIsProfileOpen(false)}
                    className="w-full min-h-10 flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 dark:text-[#9CA79E] hover:text-[#B4482D] dark:hover:text-[#FF7D4F] hover:bg-[#FAF9F5] dark:hover:bg-[#25332A] transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-gray-500 dark:text-[#9CA79E]" />
                    <span>Planos e Assinatura</span>
                  </Link>
                </div>

                <div className="border-t border-gray-100 dark:border-[#2A382E] my-1" />

                <div className="px-2 pt-1">
                  <button
                    type="button"
                    onClick={() => signOut({ redirectUrl: '/sign-in' })}
                    className="w-full min-h-10 flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#B4482D] dark:text-[#FF7D4F] hover:bg-[#B4482D]/10 dark:hover:bg-[#B4482D]/20 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-[#B4482D] dark:text-[#FF7D4F]" />
                    <span>Sair da conta</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile & Tablet Full-Parity Drawer (< lg), Portaled outside header backdrop-blur */}
      {mounted &&
        isMobileMenuOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="lg:hidden print:hidden fixed inset-0 z-[80] flex"
            role="dialog"
            aria-modal="true"
            aria-label="Menu completo do painel"
          >
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/55 backdrop-blur-[2px] animate-in fade-in duration-150"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer Panel */}
            <aside className="relative z-10 w-[min(320px,88vw)] h-dvh bg-[#2E4233] dark:bg-[#17211A] text-white flex flex-col shadow-2xl border-r border-white/10 pt-safe pb-safe animate-in slide-in-from-left duration-200">
              {/* Brand & Close */}
              <div className="h-14 ultrashort:h-12 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
                <Link
                  href="/dashboard/orders"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="min-h-9 lg:min-h-0 flex items-center gap-2"
                >
                  <LogoDeli variant="outline-white" className="h-6 w-auto" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFAA8A] bg-white/10 px-2 py-0.5 rounded-full">
                    Lojista
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Fechar menu"
                  className="min-h-11 min-w-11 ultrashort:min-h-9 ultrashort:min-w-9 rounded-xl flex items-center justify-center text-gray-200 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body + Footer wrapper: unified scroll on ultrashort/landscape heights */}
              <div className="flex-1 min-h-0 flex flex-col ultrashort:block ultrashort:overflow-y-auto">
                {/* Scrollable Content */}
                <div className="flex-1 min-h-0 overflow-y-auto ultrashort:overflow-visible px-4 py-4 ultrashort:px-3.5 ultrashort:py-2.5 space-y-5 ultrashort:space-y-2.5">
                  {/* Store Card, Switcher & Status */}
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 ultrashort:p-2.5 space-y-3 ultrashort:space-y-1.5">
                    <div className="flex items-center gap-3 ultrashort:gap-2.5">
                      <div className="w-11 h-11 ultrashort:w-8 ultrashort:h-8 rounded-full bg-white/15 border border-white/25 flex items-center justify-center overflow-hidden p-0.5 shrink-0">
                        {organization?.imageUrl || user?.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={organization?.imageUrl || user?.imageUrl}
                            alt={storeName}
                            className="w-full h-full object-contain rounded-full"
                          />
                        ) : (
                          <span className="font-serif text-lg ultrashort:text-sm font-bold text-white uppercase">
                            {storeName[0] || 'R'}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-serif text-base ultrashort:text-sm font-bold text-white truncate">
                          {storeName}
                        </p>
                        <p className="text-[11px] text-gray-300 truncate">{userEmail}</p>
                      </div>
                    </div>

                    {hasMultipleStores && (
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={() => setIsStoreListOpen(!isStoreListOpen)}
                          aria-expanded={isStoreListOpen}
                          className="w-full min-h-11 ultrashort:min-h-9 flex items-center justify-between px-3 py-2 ultrashort:py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white cursor-pointer"
                        >
                          <span className="truncate">Alternar loja ({storeName})</span>
                          <ChevronDown
                            className={cn(
                              'w-4 h-4 shrink-0 transition-transform',
                              isStoreListOpen && 'rotate-180'
                            )}
                          />
                        </button>

                        {isStoreListOpen && (
                          <div className="rounded-xl bg-[#213125] dark:bg-[#1D2620] border border-white/15 py-1">
                            {initialStores.map((st) => (
                              <button
                                key={st.slug}
                                type="button"
                                onClick={() => handleSelectStore(st.slug)}
                                className={cn(
                                  'w-full min-h-11 ultrashort:min-h-9 px-3 py-2 ultrashort:py-1.5 text-left text-xs flex items-center justify-between cursor-pointer',
                                  st.slug === storeSlug
                                    ? 'bg-white/15 text-white font-bold'
                                    : 'text-gray-200 hover:text-white hover:bg-white/5'
                                )}
                              >
                                <span className="truncate">{st.name}</span>
                                {st.slug === storeSlug && (
                                  <Check className="w-4 h-4 text-[#E76F41] shrink-0" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleToggleStoreStatus}
                      disabled={isTogglingStatus}
                      aria-pressed={isOpen}
                      className={cn(
                        'w-full min-h-11 ultrashort:min-h-9 flex items-center justify-between px-3.5 py-2 ultrashort:py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer',
                        isOpen
                          ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40 hover:bg-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-200 border-amber-400/40 hover:bg-amber-500/30'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            'w-2.5 h-2.5 rounded-full',
                            isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                          )}
                        />
                        <span>{isOpen ? 'Loja Aberta' : 'Loja Fechada'}</span>
                      </span>
                      <span
                        className={cn(
                          'w-7 h-4 rounded-full relative transition-colors',
                          isOpen ? 'bg-emerald-500' : 'bg-white/25'
                        )}
                      >
                        <span
                          className={cn(
                            'w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform',
                            isOpen ? 'left-3.5' : 'left-0.5'
                          )}
                        />
                      </span>
                    </button>

                    <Link
                      href="/dashboard/orders?novo=1"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full min-h-11 ultrashort:min-h-9 flex items-center justify-center gap-2 px-3 py-2.5 ultrashort:py-1.5 rounded-xl bg-[#B4482D] hover:bg-[#9E3D25] text-white text-xs font-bold shadow-md transition-colors"
                    >
                      <PlusCircle className="w-4 h-4 shrink-0" />
                      <span>+ Novo Pedido (PDV)</span>
                    </Link>
                  </div>

                  <nav aria-label="Navegação do painel" className="space-y-5 ultrashort:space-y-2.5">
                    {/* Core Navigation */}
                    <div className="space-y-1 ultrashort:space-y-0.5">
                      <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-300">
                        Operação Principal
                      </p>
                      {CORE_MENU_LINKS.map((item) => {
                        const isActive =
                          pathname === item.href || pathname.startsWith(`${item.href}/`)
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              'min-h-11 ultrashort:min-h-9 flex items-center gap-3 px-3 py-2.5 ultrashort:py-1.5 rounded-xl text-sm transition-colors',
                              isActive
                                ? 'bg-[#213125] dark:bg-[#233126] text-white font-semibold border-l-4 border-[#E76F41]'
                                : 'text-gray-200 hover:text-white hover:bg-white/10'
                            )}
                          >
                            <item.icon className="w-5 h-5 shrink-0" />
                            <span>{item.name}</span>
                          </Link>
                        )
                      })}
                    </div>

                    {/* Secondary / Management Routes */}
                    <div className="space-y-1 ultrashort:space-y-0.5">
                      <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-300">
                        Gestão & Crescimento
                      </p>
                      {SECONDARY_MENU_LINKS.map((item) => {
                        const isActive =
                          pathname === item.href || pathname.startsWith(`${item.href}/`)
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              'min-h-11 ultrashort:min-h-9 flex items-center gap-3 px-3 py-2.5 ultrashort:py-1.5 rounded-xl text-sm transition-colors',
                              isActive
                                ? 'bg-[#213125] dark:bg-[#233126] text-white font-semibold border-l-4 border-[#E76F41]'
                                : 'text-gray-200 hover:text-white hover:bg-white/10'
                            )}
                          >
                            <item.icon className="w-5 h-5 shrink-0" />
                            <span>{item.name}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </nav>
                </div>

                {/* Footer Actions */}
                <div className="p-4 ultrashort:p-3 border-t border-white/10 bg-[#253629] dark:bg-[#151E17] space-y-2 ultrashort:space-y-1.5 shrink-0">
                  <Link
                    href={`/${storeSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full min-h-11 ultrashort:min-h-9 flex items-center justify-between px-3 py-2 ultrashort:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-200 text-xs font-semibold transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 shrink-0" />
                      <span>Ver Loja no Storefront</span>
                    </span>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-700/50">
                      Ao vivo
                    </span>
                  </Link>

                  <Link
                    href="/dashboard/billing"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full min-h-11 ultrashort:min-h-9 flex items-center justify-between px-3 py-2 ultrashort:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white text-xs font-medium transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#E76F41] shrink-0" />
                      <span>Assinatura & Plano</span>
                    </span>
                    <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider bg-emerald-950/70 border border-emerald-700/50 px-1.5 py-0.5 rounded">
                      Ativo
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      signOut({ redirectUrl: '/sign-in' })
                    }}
                    className="w-full min-h-11 ultrashort:min-h-9 flex items-center justify-center gap-2 px-3 py-2.5 ultrashort:py-1.5 rounded-xl bg-[#B4482D] hover:bg-[#9E3D25] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Sair da conta</span>
                  </button>
                </div>
              </div>
            </aside>
          </div>,
          document.body
        )}
    </>
  )
}
