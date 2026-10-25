'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useUser, useClerk, useOrganization } from '@clerk/nextjs'
import { useTheme } from '@/components/theme-provider'
import {
  Sun,
  Moon,
  Bell,
  LogOut,
  Store,
  CreditCard,
  CheckCheck,
  ChevronDown,
  Sparkles,
  Info,
  Gift
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
    actionLabel: 'Ver Cardápio'
  },
  {
    id: '2',
    title: 'Estúdio de Cupons Ativo 🎨',
    message: 'Crie artes personalizadas no formato do Instagram e WhatsApp para divulgar suas promoções com 1 clique.',
    time: 'Hoje',
    isRead: false,
    type: 'update',
    actionUrl: '/dashboard/marketing/coupons',
    actionLabel: 'Criar Cupom'
  },
  {
    id: '3',
    title: 'Dica de Vendas: Fotos nos Produtos 📸',
    message: 'Restaurantes com fotos em todos os itens do cardápio vendem até 40% a mais no delivery.',
    time: 'Ontem',
    isRead: true,
    type: 'tip',
    actionUrl: '/dashboard/menu',
    actionLabel: 'Adicionar Fotos'
  }
]

export function DashboardHeader() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const { organization } = useOrganization()

  // Real Dark/Light Theme Integration via next-themes
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

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

  const unreadCount = notifications.filter(n => !n.isRead).length

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const markSingleAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? ({ ...n, isRead: true }) : n))
  }

  const userName = user?.fullName || user?.firstName || 'Rafael'
  const userEmail = user?.primaryEmailAddress?.emailAddress || 'lojista@deliplus.com.br'
  const storeName = organization?.name || 'RafaelTeste'

  return (
    <header className="h-14 lg:h-16 border-b border-[#ECE7D8] dark:border-[#2A382E] bg-[#FAF8F0]/90 dark:bg-[#131A15]/90 backdrop-blur-md px-4 lg:px-7 flex items-center justify-between shrink-0 relative z-40 transition-colors duration-150">
      {/* Empty Left Spacer */}
      <div className="flex-1" />

      {/* Right side: Trio [Theme Toggle] [Notification Bell] [User Profile] */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* 1. Theme Toggle Button (Light/Dark mode real toggle) */}
        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
          className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#1B241E] border border-[#E3E1D9] dark:border-[#2A382E] text-[#2E4233] dark:text-[#F2EFE9] hover:text-[#CB5A3C] hover:bg-[#F5F2E9] dark:hover:bg-[#25332A] flex items-center justify-center transition-all duration-200 shadow-xs cursor-pointer group"
          aria-label="Alternar tema claro/escuro"
        >
          {isDark ? (
            <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 transition-transform duration-200 group-hover:scale-110" />
          ) : (
            <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 transition-transform duration-200 group-hover:rotate-45" />
          )}
        </button>

        {/* 2. Notification Bell (Sino de alerta - Mensagens do Deli) */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setIsNotifOpen(!isNotifOpen)
              setIsProfileOpen(false)
            }}
            title="Mensagens e comunicados do Deli"
            className={cn(
              "relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#1B241E] border border-[#E3E1D9] dark:border-[#2A382E] flex items-center justify-center transition-all duration-200 shadow-xs cursor-pointer",
              isNotifOpen 
                ? "bg-[#F5F2E9] dark:bg-[#25332A] text-[#CB5A3C] border-[#CB5A3C]/40" 
                : "text-[#2E4233] dark:text-[#F2EFE9] hover:text-[#CB5A3C] hover:bg-[#F5F2E9] dark:hover:bg-[#25332A]"
            )}
            aria-label="Notificações do DeliPlus"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#CB5A3C] text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#131A15] animate-in zoom-in-50">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Popover */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-[340px] sm:w-[380px] bg-white dark:bg-[#1B241E] rounded-2xl shadow-2xl border border-[#E3E1D9] dark:border-[#2A382E] py-3 z-[100] animate-in fade-in-50 slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-4 pb-2.5 border-b border-gray-100 dark:border-[#2A382E]">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-[#2E4233] dark:text-[#F2EFE9] text-base">Mensagens Deli</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#CB5A3C]/10 text-[#CB5A3C]">
                    Oficial
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-[11px] font-medium text-gray-500 dark:text-[#9CA79E] hover:text-[#CB5A3C] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Marcar lidas
                  </button>
                )}
              </div>

              {/* Notification list */}
              <div className="max-h-[340px] overflow-y-auto divide-y divide-gray-50 dark:divide-[#25332A]">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                    Nenhuma mensagem no momento.
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => markSingleAsRead(item.id)}
                      className={cn(
                        "p-3.5 hover:bg-[#FAF9F5] dark:hover:bg-[#222C25] transition-colors cursor-pointer flex gap-3",
                        !item.isRead && "bg-[#FAF8F0]/70 dark:bg-[#243026]/70"
                      )}
                    >
                      <div className="mt-0.5 shrink-0">
                        {item.type === 'update' && (
                          <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {item.type === 'info' && (
                          <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                            <Info className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {item.type === 'tip' && (
                          <div className="w-7 h-7 rounded-full bg-[#CB5A3C]/10 dark:bg-[#CB5A3C]/20 text-[#CB5A3C] dark:text-[#FF7D4F] flex items-center justify-center">
                            <Gift className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className="text-xs font-bold text-[#1A241E] dark:text-[#F2EFE9] truncate">{item.title}</h4>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">{item.time}</span>
                        </div>
                        <p className="text-[12px] text-gray-600 dark:text-[#9CA79E] leading-snug line-clamp-2">{item.message}</p>
                        {item.actionUrl && (
                          <Link
                            href={item.actionUrl}
                            onClick={() => setIsNotifOpen(false)}
                            className="inline-block mt-2 text-[11px] font-bold text-[#CB5A3C] dark:text-[#FF7D4F] hover:underline"
                          >
                            {item.actionLabel || 'Acessar'} →
                          </Link>
                        )}
                      </div>
                      {!item.isRead && (
                        <div className="shrink-0 mt-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#CB5A3C] block"></span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 pt-2.5 border-t border-gray-100 dark:border-[#2A382E] flex items-center justify-center text-center">
                <p className="text-[11px] text-gray-600 dark:text-[#9CA79E]">
                  Mensagens e novidades enviadas pelo suporte DeliPlus.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 3. User Profile (Foto de perfil e dropdown de usuário) */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setIsProfileOpen(!isProfileOpen)
              setIsNotifOpen(false)
            }}
            className={cn(
              "flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-full sm:rounded-xl bg-white dark:bg-[#1B241E] border border-[#E3E1D9] dark:border-[#2A382E] hover:bg-[#F5F2E9] dark:hover:bg-[#25332A] transition-all duration-200 shadow-xs cursor-pointer",
              isProfileOpen && "border-[#CB5A3C]/40 bg-[#F5F2E9] dark:bg-[#25332A]"
            )}
            aria-label="Menu do perfil do usuário"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#2E4233] dark:bg-[#25332A] text-white overflow-hidden flex items-center justify-center shrink-0 border border-white/40 dark:border-white/20 p-0.5">
              {user?.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={user.imageUrl} alt={userName} className="w-full h-full object-contain rounded-full" />
              ) : (
                <span className="text-xs font-bold uppercase">{storeName[0] || userName[0] || 'R'}</span>
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

          {/* Profile Popover */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1B241E] rounded-2xl shadow-2xl border border-[#E3E1D9] dark:border-[#2A382E] py-2 z-[100] animate-in fade-in-50 slide-in-from-top-2 duration-150">
              {/* User Identity Header */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-[#2A382E] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2E4233] dark:bg-[#25332A] text-white overflow-hidden flex items-center justify-center shrink-0 border border-white/20 p-0.5">
                  {user?.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={user.imageUrl} alt={userName} className="w-full h-full object-contain rounded-full" />
                  ) : (
                    <span className="text-sm font-bold uppercase">{storeName[0] || userName[0] || 'R'}</span>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-[#1A241E] dark:text-[#F2EFE9] truncate">{userName}</span>
                  <span className="text-[11px] text-gray-600 dark:text-[#9CA79E] truncate">{userEmail}</span>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="py-1">
                <Link
                  href="/dashboard/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 dark:text-[#9CA79E] hover:text-[#CB5A3C] dark:hover:text-[#FF7D4F] hover:bg-[#FAF9F5] dark:hover:bg-[#25332A] transition-colors"
                >
                  <Store className="w-4 h-4 text-gray-400" />
                  <span>Minha Loja & Configurações</span>
                </Link>
                <Link
                  href="/dashboard/billing"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 dark:text-[#9CA79E] hover:text-[#CB5A3C] dark:hover:text-[#FF7D4F] hover:bg-[#FAF9F5] dark:hover:bg-[#25332A] transition-colors"
                >
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <span>Planos e Assinatura</span>
                </Link>
              </div>

              <div className="border-t border-gray-100 dark:border-[#2A382E] my-1"></div>

              {/* Logout Option */}
              <div className="px-2 pt-1">
                <button
                  type="button"
                  onClick={() => signOut({ redirectUrl: '/sign-in' })}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#CB5A3C] dark:text-[#FF7D4F] hover:bg-[#CB5A3C]/10 dark:hover:bg-[#CB5A3C]/20 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-[#CB5A3C] dark:text-[#FF7D4F]" />
                  <span>Sair da conta</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
