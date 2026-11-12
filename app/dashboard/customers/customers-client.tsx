'use client'

import { useState, useMemo } from 'react'
import {
  Users,
  Search,
  Phone,
  ShoppingBag,
  TrendingUp,
  Star,
  Clock,
  ArrowUpDown,
  ExternalLink,
  MessageCircle,
  Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CustomerRow {
  id: string
  name: string
  phone: string | null
  email: string | null
  total_spent_cents: number
  orders_count: number
  segment: string
  last_order_at: string | null
  created_at: string
}

interface CustomersClientProps {
  initialCustomers: CustomerRow[]
  storeName: string
}

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

function formatPhoneDisplay(phoneStr: string | null): string {
  if (!phoneStr) return '-'
  const digits = phoneStr.replace(/\D/g, '')
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return phoneStr
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return (parts[0]?.[0] || 'C').toUpperCase()
}

const AVATAR_COLORS = [
  'bg-emerald-600 text-white',
  'bg-[#CB5A3C] text-white',
  'bg-amber-600 text-white',
  'bg-sky-600 text-white',
  'bg-purple-600 text-white',
  'bg-rose-600 text-white',
  'bg-teal-600 text-white',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

function getDaysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  const diffMs = Date.now() - d.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function formatLastOrder(dateStr: string | null): { text: string; badgeClass: string } {
  const days = getDaysSince(dateStr)
  if (days === null) return { text: 'Nunca', badgeClass: 'text-muted-foreground bg-gray-100 dark:bg-[#222C25]' }
  if (days === 0) return { text: 'Hoje', badgeClass: 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40' }
  if (days === 1) return { text: 'Ontem', badgeClass: 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40' }
  if (days < 7) return { text: `Há ${days} dias`, badgeClass: 'text-sky-700 bg-sky-50 dark:text-sky-300 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40' }
  if (days < 20) return { text: `Há ${days} dias`, badgeClass: 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-800 border border-gray-200 dark:border-gray-700' }
  return { text: `Há ${days} dias`, badgeClass: 'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40' }
}

export default function CustomersClient({ initialCustomers, storeName }: CustomersClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'vip' | 'recurring' | 'new' | 'inactive'>('all')
  const [sortField, setSortField] = useState<'orders' | 'total' | 'last_order' | 'name'>('orders')
  const [sortAsc, setSortAsc] = useState(false)

  // Metrics
  const metrics = useMemo(() => {
    const totalCount = initialCustomers.length
    const totalSpent = initialCustomers.reduce((acc, c) => acc + (c.total_spent_cents || 0), 0)
    const totalOrders = initialCustomers.reduce((acc, c) => acc + (c.orders_count || 0), 0)
    const avgTicket = totalOrders > 0 ? totalSpent / totalOrders : 0
    const vipCount = initialCustomers.filter((c) => c.orders_count >= 10 || c.total_spent_cents >= 50000).length
    const inactiveCount = initialCustomers.filter((c) => {
      const d = getDaysSince(c.last_order_at)
      return d !== null && d >= 20
    }).length

    return {
      totalCount,
      totalSpent,
      avgTicket,
      vipCount,
      inactiveCount
    }
  }, [initialCustomers])

  // Filtered & Sorted
  const filteredCustomers = useMemo(() => {
    let list = [...initialCustomers]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().replace(/\D/g, '')
      const textTerm = searchTerm.toLowerCase()
      list = list.filter((c) => {
        const matchesName = c.name.toLowerCase().includes(textTerm)
        const digits = (c.phone || '').replace(/\D/g, '')
        const matchesPhone = term ? digits.includes(term) : false
        return matchesName || matchesPhone
      })
    }

    if (activeFilter === 'vip') {
      list = list.filter((c) => c.orders_count >= 10 || c.total_spent_cents >= 50000)
    } else if (activeFilter === 'recurring') {
      list = list.filter((c) => c.orders_count >= 3 && c.orders_count < 10)
    } else if (activeFilter === 'new') {
      list = list.filter((c) => c.orders_count <= 2)
    } else if (activeFilter === 'inactive') {
      list = list.filter((c) => {
        const d = getDaysSince(c.last_order_at)
        return d !== null && d >= 20
      })
    }

    list.sort((a, b) => {
      let valA = 0
      let valB = 0
      if (sortField === 'orders') {
        valA = a.orders_count
        valB = b.orders_count
      } else if (sortField === 'total') {
        valA = a.total_spent_cents
        valB = b.total_spent_cents
      } else if (sortField === 'last_order') {
        valA = a.last_order_at ? new Date(a.last_order_at).getTime() : 0
        valB = b.last_order_at ? new Date(b.last_order_at).getTime() : 0
      } else if (sortField === 'name') {
        return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      }
      return sortAsc ? valA - valB : valB - valA
    })

    return list
  }, [initialCustomers, searchTerm, activeFilter, sortField, sortAsc])

  const handleSort = (field: 'orders' | 'total' | 'last_order' | 'name') => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(false)
    }
  }

  const buildWhatsAppLink = (customer: CustomerRow) => {
    if (!customer.phone) return '#'
    const raw = customer.phone.replace(/\D/g, '')
    const digits = raw.startsWith('55') ? raw : `55${raw}`
    const firstName = customer.name.split(' ')[0]
    const days = getDaysSince(customer.last_order_at)
    
    let text = `Olá ${firstName}! Tudo bem? Passando para te desejar um ótimo dia!`
    if (days !== null && days >= 15) {
      text = `Olá ${firstName}! Sentimos sua falta aqui no ${storeName}! Que tal pedir seu prato favorito hoje? Dê uma olhadinha nas nossas novidades!`
    } else if (customer.orders_count >= 10) {
      text = `Olá ${firstName}! Tudo bem? Você é um dos nossos clientes mais especiais aqui no ${storeName}! Como está seu dia?`
    }

    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
  }

  return (
    <div className="w-full max-w-6xl mx-auto flex-1 bg-[#FAF8F0] dark:bg-[#121914] text-[#1C2C22] dark:text-[#F2EFE9] p-4 sm:p-6 lg:p-8 pb-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-serif tracking-tight text-[#1C2C22] dark:text-[#F2EFE9] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#CB5A3C]" />
            Clientes & CRM
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Histórico completo de quem compra no seu delivery, frequência e canal direto de WhatsApp.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-white dark:bg-[#1C261F] border border-[#E9E4D4] dark:border-[#2A382E] rounded-xl p-3 sm:p-4 shadow-xs min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-xs font-semibold text-muted-foreground leading-tight min-w-0">Total de Clientes</span>
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          </div>
          <div className="text-[clamp(1.125rem,4.8vw,1.5rem)] sm:text-2xl font-black mt-2 tabular-nums truncate text-[#1C2C22] dark:text-[#F2EFE9]">
            {metrics.totalCount}
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">Cadastrados no sistema</span>
        </div>

        <div className="bg-white dark:bg-[#1C261F] border border-[#E9E4D4] dark:border-[#2A382E] rounded-xl p-3 sm:p-4 shadow-xs min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-xs font-semibold text-muted-foreground leading-tight min-w-0">Faturamento Acumulado</span>
            <TrendingUp className="w-4 h-4 text-[#CB5A3C] shrink-0" />
          </div>
          <div className="text-[clamp(0.95rem,4.2vw,1.5rem)] sm:text-2xl font-black mt-2 tabular-nums truncate text-[#1C2C22] dark:text-[#F2EFE9]">
            {formatBRL(metrics.totalSpent)}
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">Gasto total por clientes</span>
        </div>

        <div className="bg-white dark:bg-[#1C261F] border border-[#E9E4D4] dark:border-[#2A382E] rounded-xl p-3 sm:p-4 shadow-xs min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-xs font-semibold text-muted-foreground leading-tight min-w-0">Ticket Médio</span>
            <ShoppingBag className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
          </div>
          <div className="text-[clamp(0.95rem,4.2vw,1.5rem)] sm:text-2xl font-black mt-2 tabular-nums truncate text-[#1C2C22] dark:text-[#F2EFE9]">
            {formatBRL(Math.round(metrics.avgTicket))}
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">Média por pedido</span>
        </div>

        <div className="bg-white dark:bg-[#1C261F] border border-[#E9E4D4] dark:border-[#2A382E] rounded-xl p-3 sm:p-4 shadow-xs min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-xs font-semibold text-muted-foreground leading-tight min-w-0">Clientes VIP / Fiéis</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
          </div>
          <div className="text-[clamp(1.125rem,4.8vw,1.5rem)] sm:text-2xl font-black mt-2 tabular-nums truncate text-[#1C2C22] dark:text-[#F2EFE9]">
            {metrics.vipCount}
          </div>
          <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-0.5 block">
            10+ pedidos ou &gt; R$ 500
          </span>
        </div>
      </div>

      {/* Search & Segment Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#1C261F] border border-[#E9E4D4] dark:border-[#2A382E] p-3 rounded-xl shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-0 sm:min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            aria-label="Buscar clientes por nome ou telefone"
            className="w-full min-h-9 pl-9 pr-3 py-1.5 text-base lg:text-sm rounded-lg border border-[#E9E4D4] dark:border-[#2A382E] bg-[#FAF8F0]/50 dark:bg-[#17211A] text-[#1C2C22] dark:text-[#F2EFE9] placeholder:text-muted-foreground focus:outline-none focus:border-[#CB5A3C]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={cn(
              "min-h-9 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4482D] dark:focus-visible:ring-[#FF7D4F]",
              activeFilter === 'all'
                ? "bg-[#2E4233] text-white shadow-2xs"
                : "bg-gray-100 dark:bg-[#25332A] text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#2F4135]"
            )}
          >
            Todos ({initialCustomers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('vip')}
            className={cn(
              "min-h-9 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4482D] dark:focus-visible:ring-[#FF7D4F]",
              activeFilter === 'vip'
                ? "bg-amber-700 text-white shadow-2xs"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/70 border border-amber-200/60 dark:border-amber-800/40"
            )}
          >
            <Star className="w-3 h-3 fill-current" />
            VIPs ({metrics.vipCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('recurring')}
            className={cn(
              "min-h-9 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4482D] dark:focus-visible:ring-[#FF7D4F]",
              activeFilter === 'recurring'
                ? "bg-[#15803D] text-white shadow-2xs"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 border border-emerald-200/60 dark:border-emerald-800/40"
            )}
          >
            Recorrentes (3-9)
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('inactive')}
            className={cn(
              "min-h-9 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4482D] dark:focus-visible:ring-[#FF7D4F]",
              activeFilter === 'inactive'
                ? "bg-rose-700 text-white shadow-2xs"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/70 border border-rose-200/60 dark:border-rose-800/40"
            )}
          >
            <Clock className="w-3 h-3" />
            Inativos (&gt;20d) ({metrics.inactiveCount})
          </button>
        </div>
      </div>

      {/* Mobile Sort Bar (< md) */}
      <div className="md:hidden flex items-center justify-between gap-2 bg-white dark:bg-[#1C261F] border border-[#E9E4D4] dark:border-[#2A382E] px-3 py-2.5 rounded-xl shadow-xs">
        <label htmlFor="customer-mobile-sort" className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
          Ordenar por
        </label>
        <div className="flex items-center gap-2 min-w-0">
          <select
            id="customer-mobile-sort"
            value={sortField}
            onChange={(e) => setSortField(e.target.value as 'orders' | 'total' | 'last_order' | 'name')}
            className="min-h-9 px-2.5 py-1.5 text-base lg:text-xs font-semibold rounded-lg border border-[#E9E4D4] dark:border-[#2A382E] bg-[#FAF8F0]/60 dark:bg-[#17211A] text-[#1C2C22] dark:text-[#F2EFE9] focus:outline-none focus:border-[#CB5A3C]"
          >
            <option value="orders">Pedidos</option>
            <option value="total">Total gasto</option>
            <option value="last_order">Último pedido</option>
            <option value="name">Nome</option>
          </select>
          <button
            type="button"
            onClick={() => setSortAsc((prev) => !prev)}
            aria-label={sortAsc ? "Ordenação crescente, alternar para decrescente" : "Ordenação decrescente, alternar para crescente"}
            title={sortAsc ? "Ordem crescente" : "Ordem decrescente"}
            className="min-h-9 min-w-9 flex items-center justify-center rounded-lg border border-[#E9E4D4] dark:border-[#2A382E] bg-[#FAF8F0]/60 dark:bg-[#17211A] text-[#1C2C22] dark:text-[#F2EFE9] hover:bg-gray-100 dark:hover:bg-[#25332A] cursor-pointer"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Cards List (< md) */}
      <div className="md:hidden space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white dark:bg-[#1C261F] border border-[#E9E4D4] dark:border-[#2A382E] rounded-xl p-8 text-center text-xs text-muted-foreground shadow-xs">
            Nenhum cliente encontrado para este filtro.
          </div>
        ) : (
          filteredCustomers.map((c) => {
            const avgTicketCents = c.orders_count > 0 ? Math.round(c.total_spent_cents / c.orders_count) : 0
            const lastOrderInfo = formatLastOrder(c.last_order_at)
            const isVip = c.orders_count >= 10 || c.total_spent_cents >= 50000

            return (
              <div
                key={c.id}
                className="bg-white dark:bg-[#1C261F] border border-[#E9E4D4] dark:border-[#2A382E] rounded-xl p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs",
                        getAvatarColor(c.name)
                      )}
                    >
                      {getInitials(c.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-[#1C2C22] dark:text-[#F2EFE9] flex items-center gap-1.5 flex-wrap">
                        <span className="truncate">{c.name}</span>
                        {isVip && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            VIP
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">
                        {formatPhoneDisplay(c.phone)}
                      </div>
                      {c.email && (
                        <div className="text-[11px] text-muted-foreground truncate mt-0.5">{c.email}</div>
                      )}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0",
                      lastOrderInfo.badgeClass
                    )}
                  >
                    {lastOrderInfo.text}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-[#E9E4D4]/70 dark:border-[#2A382E]">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Pedidos</span>
                    <span className="text-xs font-bold text-[#1C2C22] dark:text-[#F2EFE9]">{c.orders_count}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Total Gasto</span>
                    <span className="text-xs font-bold text-[#1C2C22] dark:text-[#F2EFE9]">{formatBRL(c.total_spent_cents)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Ticket Médio</span>
                    <span className="text-xs font-semibold text-muted-foreground">{formatBRL(avgTicketCents)}</span>
                  </div>
                </div>

                {c.phone && (
                  <div className="pt-2.5 border-t border-[#E9E4D4]/70 dark:border-[#2A382E]">
                    <a
                      href={buildWhatsAppLink(c)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full min-h-9 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[#15803D] hover:bg-[#166534] text-white transition-all shadow-2xs active:scale-[0.99]"
                      title={`Conversar com ${c.name} no WhatsApp`}
                    >
                      <MessageCircle className="w-4 h-4 fill-white text-white" />
                      <span>Conversar no WhatsApp</span>
                    </a>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Desktop Customer List Table (>= md) */}
      <div className="hidden md:block bg-white dark:bg-[#1C261F] border border-[#E9E4D4] dark:border-[#2A382E] rounded-xl shadow-xs overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F0] dark:bg-[#17211A] border-b border-[#E9E4D4] dark:border-[#2A382E] text-gray-600 dark:text-gray-300 font-bold select-none">
              <tr>
                <th
                  aria-sort={sortField === 'name' ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                  className="py-3 px-4"
                >
                  <button
                    type="button"
                    onClick={() => handleSort('name')}
                    className="min-h-9 lg:min-h-0 inline-flex items-center gap-1 hover:text-[#1C2C22] dark:hover:text-[#F2EFE9] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4482D] dark:focus-visible:ring-[#FF7D4F] rounded"
                  >
                    <span>Cliente</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </button>
                </th>
                <th className="py-3 px-4">Telefone</th>
                <th
                  aria-sort={sortField === 'orders' ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                  className="py-3 px-4 text-center"
                >
                  <button
                    type="button"
                    onClick={() => handleSort('orders')}
                    className="min-h-9 lg:min-h-0 inline-flex items-center justify-center gap-1 hover:text-[#1C2C22] dark:hover:text-[#F2EFE9] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4482D] dark:focus-visible:ring-[#FF7D4F] rounded"
                  >
                    <span>Pedidos</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </button>
                </th>
                <th
                  aria-sort={sortField === 'total' ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                  className="py-3 px-4 text-right"
                >
                  <button
                    type="button"
                    onClick={() => handleSort('total')}
                    className="min-h-9 lg:min-h-0 inline-flex items-center justify-end gap-1 hover:text-[#1C2C22] dark:hover:text-[#F2EFE9] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4482D] dark:focus-visible:ring-[#FF7D4F] rounded"
                  >
                    <span>Total Gasto</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </button>
                </th>
                <th className="py-3 px-4 text-right">Ticket Médio</th>
                <th
                  aria-sort={sortField === 'last_order' ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                  className="py-3 px-4 text-center"
                >
                  <button
                    type="button"
                    onClick={() => handleSort('last_order')}
                    className="min-h-9 lg:min-h-0 inline-flex items-center justify-center gap-1 hover:text-[#1C2C22] dark:hover:text-[#F2EFE9] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4482D] dark:focus-visible:ring-[#FF7D4F] rounded"
                  >
                    <span>Último Pedido</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </button>
                </th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E4D4]/60 dark:divide-[#2A382E]/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                    Nenhum cliente encontrado para este filtro.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const avgTicketCents = c.orders_count > 0 ? Math.round(c.total_spent_cents / c.orders_count) : 0
                  const lastOrderInfo = formatLastOrder(c.last_order_at)
                  const isVip = c.orders_count >= 10 || c.total_spent_cents >= 50000

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-[#FAF8F0]/40 dark:hover:bg-[#25332A]/30 transition-colors"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs",
                              getAvatarColor(c.name)
                            )}
                          >
                            {getInitials(c.name)}
                          </div>
                          <div>
                            <div className="font-bold text-[#1C2C22] dark:text-[#F2EFE9] flex items-center gap-1.5">
                              <span>{c.name}</span>
                              {isVip && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                  VIP
                                </span>
                              )}
                            </div>
                            {c.email && (
                              <div className="text-[10px] text-muted-foreground">{c.email}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300 font-mono text-[11px]">
                        {formatPhoneDisplay(c.phone)}
                      </td>

                      {/* Orders Count */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF8F0] dark:bg-[#17211A] border border-[#E9E4D4] dark:border-[#2A382E] text-[#1C2C22] dark:text-[#F2EFE9]">
                          {c.orders_count}
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td className="py-3 px-4 text-right font-bold text-[#1C2C22] dark:text-[#F2EFE9]">
                        {formatBRL(c.total_spent_cents)}
                      </td>

                      {/* Average Ticket */}
                      <td className="py-3 px-4 text-right text-muted-foreground">
                        {formatBRL(avgTicketCents)}
                      </td>

                      {/* Last Order */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            "inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold",
                            lastOrderInfo.badgeClass
                          )}
                        >
                          {lastOrderInfo.text}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        {c.phone ? (
                          <a
                            href={buildWhatsAppLink(c)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-9 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#15803D] hover:bg-[#166534] text-white transition-all shadow-2xs hover:shadow-xs active:scale-95"
                            title={`Conversar com ${c.name} no WhatsApp`}
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-white text-white" />
                            <span>WhatsApp</span>
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
