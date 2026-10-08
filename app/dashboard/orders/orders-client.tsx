'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ShoppingBag,
  CircleCheck,
  Bike,
  Printer,
  User,
  CreditCard,
  ReceiptText,
  FileText,
  X,
  Check,
  Search,
  Calendar,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MapPin,
  Clock,
  ExternalLink
} from 'lucide-react'

// Official WhatsApp Vector Icon (White / Crisp)
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export interface OrderItem {
  qty: number
  name: string
  price: string
  details?: string
}

export type PaymentMethod = 'Débito na Entrega' | 'Crédito na Entrega' | 'Em Dinheiro'

export interface Order {
  id: string
  client: string
  phone: string
  itemsCount: number
  itemsDesc: string
  itemsDetail: OrderItem[]
  time: string
  date: string
  type: 'Delivery' | 'Retirada'
  address: string
  total: string
  paymentMethod: PaymentMethod
  changeFor?: string
  status: 'Novo' | 'Em preparo' | 'Pronto' | 'Em entrega' | 'Concluído'
  obs?: string
  isUrgent?: boolean
}

const INITIAL_ORDERS: Order[] = [
  {
    id: '#1247',
    client: 'Marina Souza',
    phone: '(11) 98765-4321',
    itemsCount: 3,
    itemsDesc: '2 pratos, 1 bebida',
    itemsDetail: [
      { qty: 1, name: 'Frango Grelhado com Ervas', price: 'R$ 34,90', details: 'Arroz integral, legumes grelhados' },
      { qty: 1, name: 'Salada Noma', price: 'R$ 28,90', details: 'Folhas, tomate cereja, queijo de cabra, nozes, molho balsâmico' },
      { qty: 1, name: 'Suco Natural Laranja 300ml', price: 'R$ 12,90', details: '300ml gelado, sem açúcar' }
    ],
    time: '12:30',
    date: 'Hoje',
    type: 'Delivery',
    address: 'Rua das Flores, 123 - Vila Madalena, São Paulo - SP, 05433-000',
    total: 'R$ 89,90',
    paymentMethod: 'Crédito na Entrega',
    status: 'Novo',
    obs: 'Sem cebola, por favor.\nBater na portaria.',
    isUrgent: true
  },
  {
    id: '#1246',
    client: 'Rafael Lima',
    phone: '(11) 97654-3210',
    itemsCount: 2,
    itemsDesc: '2 pratos',
    itemsDetail: [
      { qty: 1, name: 'Bowl Vegano Raízes', price: 'R$ 39,90', details: 'Abóbora assada, grão de bico crocante' },
      { qty: 1, name: 'Dadinhos de Tapioca', price: 'R$ 22,00', details: 'Porção com geleia de pimenta' }
    ],
    time: '12:20',
    date: 'Hoje',
    type: 'Delivery',
    address: 'Av. Paulista, 1000, Apto 42 - Bela Vista, São Paulo - SP',
    total: 'R$ 64,90',
    paymentMethod: 'Débito na Entrega',
    status: 'Em preparo',
    obs: 'Deixar na portaria com o zelador Silva.'
  },
  {
    id: '#1245',
    client: 'Juliana Martins',
    phone: '(11) 96543-2109',
    itemsCount: 4,
    itemsDesc: '3 pratos, 1 bebida',
    itemsDetail: [
      { qty: 2, name: 'M Bowl Noma', price: 'R$ 85,80', details: 'Salmão grelhado, edamame, arroz cateto' },
      { qty: 1, name: 'Brownie de Chocolate', price: 'R$ 16,90', details: 'Cacau belga' },
      { qty: 1, name: 'Suco Detox Verde', price: 'R$ 9,70', details: '300ml prensado a frio' }
    ],
    time: '12:10',
    date: 'Hoje',
    type: 'Retirada',
    address: 'Retirada no Balcão Casa Noma',
    total: 'R$ 112,40',
    paymentMethod: 'Em Dinheiro',
    changeFor: 'Troco para R$ 150,00',
    status: 'Pronto',
    obs: 'Caprichar no molho tarê, por favor!'
  },
  {
    id: '#1244',
    client: 'Lucas Ferreira',
    phone: '(11) 95432-1098',
    itemsCount: 2,
    itemsDesc: '1 prato, 1 bebida',
    itemsDetail: [
      { qty: 1, name: 'Poke Clássico de Atum', price: 'R$ 46,00', details: 'Atum fresco, nori, shari' },
      { qty: 1, name: 'Chá da Casa Orgânico', price: 'R$ 12,90', details: 'Ervas frescas da estação' }
    ],
    time: '12:05',
    date: 'Hoje',
    type: 'Delivery',
    address: 'Rua Mourato Coelho, 780 - Pinheiros, São Paulo - SP',
    total: 'R$ 58,90',
    paymentMethod: 'Crédito na Entrega',
    status: 'Em entrega',
    obs: 'Levar maquininha de cartão Stone.'
  },
  {
    id: '#1243',
    client: 'Beatriz Costa',
    phone: '(11) 94321-0987',
    itemsCount: 1,
    itemsDesc: '1 prato',
    itemsDetail: [
      { qty: 1, name: 'Bowl Frango Teriyaki', price: 'R$ 39,90', details: 'Filé grelhado ao molho teriyaki especial' }
    ],
    time: '11:50',
    date: 'Hoje',
    type: 'Retirada',
    address: 'Retirada no Balcão Casa Noma',
    total: 'R$ 39,90',
    paymentMethod: 'Débito na Entrega',
    status: 'Pronto'
  },
  {
    id: '#1242',
    client: 'Thiago Almeida',
    phone: '(11) 93210-9876',
    itemsCount: 3,
    itemsDesc: '2 pratos, 1 bebida',
    itemsDetail: [
      { qty: 1, name: 'Bowl Frango Teriyaki', price: 'R$ 44,90', details: 'Quinoa real, brócolis ao vapor' },
      { qty: 1, name: 'Açaí Especial Noma 400ml', price: 'R$ 28,90', details: 'Granola artesanal, banana fatiada' },
      { qty: 1, name: 'Suco Natural Laranja 300ml', price: 'R$ 13,50', details: 'Sem açúcar' }
    ],
    time: '11:45',
    date: 'Hoje',
    type: 'Delivery',
    address: 'Rua Harmonia, 345 - Vila Madalena, São Paulo - SP',
    total: 'R$ 87,30',
    paymentMethod: 'Em Dinheiro',
    changeFor: 'Troco para R$ 100,00',
    status: 'Em entrega'
  },
  {
    id: '#1241',
    client: 'Camila Rocha',
    phone: '(11) 92109-8765',
    itemsCount: 2,
    itemsDesc: '2 pratos',
    itemsDetail: [
      { qty: 1, name: 'Salada Noma', price: 'R$ 38,90', details: 'Queijo de cabra e molho balsâmico' },
      { qty: 1, name: 'Cheesecake Frutas Vermelhas', price: 'R$ 28,90', details: 'Creme leve e calda artesanal' }
    ],
    time: '11:30',
    date: 'Hoje',
    type: 'Retirada',
    address: 'Retirada no Balcão Casa Noma',
    total: 'R$ 67,80',
    paymentMethod: 'Crédito na Entrega',
    status: 'Em preparo',
    obs: 'Cliente vai retirar às 12h15 em ponto.'
  },
  {
    id: '#1240',
    client: 'Bruno Santos',
    phone: '(11) 91098-7654',
    itemsCount: 1,
    itemsDesc: '1 bebida',
    itemsDetail: [
      { qty: 1, name: 'Kombucha Hibisco e Limão', price: 'R$ 18,90', details: 'Garrafa de vidro 300ml' }
    ],
    time: '11:20',
    date: 'Hoje',
    type: 'Delivery',
    address: 'Rua Fradique Coutinho, 510 - Pinheiros, São Paulo - SP',
    total: 'R$ 18,90',
    paymentMethod: 'Em Dinheiro',
    changeFor: 'Troco para R$ 50,00',
    status: 'Novo',
    isUrgent: false
  },
  {
    id: '#1239',
    client: 'Fernanda Dias',
    phone: '(11) 90987-6543',
    itemsCount: 2,
    itemsDesc: '2 pratos',
    itemsDetail: [
      { qty: 1, name: 'Risoto de Cogumelos Frescos', price: 'R$ 52,50', details: 'Arroz arbóreo, shimeji e parmesão' },
      { qty: 1, name: 'Torta de Limão Siciliano', price: 'R$ 22,00', details: 'Merengue tostado' }
    ],
    time: '11:15',
    date: 'Hoje',
    type: 'Delivery',
    address: 'Rua Purpurina, 210 - Vila Madalena, São Paulo - SP',
    total: 'R$ 74,50',
    paymentMethod: 'Débito na Entrega',
    status: 'Em preparo',
    obs: 'Interfone 32, Bloco B.'
  },
  {
    id: '#1238',
    client: 'Rodrigo Silveira',
    phone: '(11) 99876-5432',
    itemsCount: 3,
    itemsDesc: '2 pratos, 1 bebida',
    itemsDetail: [
      { qty: 2, name: 'Hambúrguer Artesanal Noma', price: 'R$ 98,00', details: 'Blend 180g, queijo cheddar inglês, bacon' },
      { qty: 1, name: 'Batata Rústica com Alecrim', price: 'R$ 19,00', details: 'Maionese da casa de ervas' },
      { qty: 1, name: 'Refrigerante Orgânico 350ml', price: 'R$ 12,00', details: 'Guaraná natural' }
    ],
    time: '11:05',
    date: 'Hoje',
    type: 'Delivery',
    address: 'Rua Girassol, 480 - Vila Madalena, São Paulo - SP',
    total: 'R$ 129,00',
    paymentMethod: 'Crédito na Entrega',
    status: 'Em entrega',
    obs: 'Ponto da carne: ao ponto para bem.'
  },
  {
    id: '#1237',
    client: 'Patrícia Gomes',
    phone: '(11) 98765-1234',
    itemsCount: 1,
    itemsDesc: '1 prato',
    itemsDetail: [
      { qty: 1, name: 'Salmão com Crosta de Gergelim', price: 'R$ 45,90', details: 'Purê de mandioquinha e aspargos' }
    ],
    time: '10:55',
    date: 'Hoje',
    type: 'Retirada',
    address: 'Retirada no Balcão Casa Noma',
    total: 'R$ 45,90',
    paymentMethod: 'Em Dinheiro',
    changeFor: 'Não precisa de troco',
    status: 'Pronto'
  },
  {
    id: '#1236',
    client: 'Gabriel Ramos',
    phone: '(11) 97654-2345',
    itemsCount: 2,
    itemsDesc: '2 pratos',
    itemsDetail: [
      { qty: 1, name: 'Pizza Margherita Especial', price: 'R$ 68,30', details: 'Massa fermentação natural, búfala e manjericão' },
      { qty: 1, name: 'Tiramisù Clássico', price: 'R$ 29,90', details: 'Mascarpone artesanal e café especial' }
    ],
    time: '10:40',
    date: 'Hoje',
    type: 'Delivery',
    address: 'Rua Aspicuelta, 320 - Vila Madalena, São Paulo - SP',
    total: 'R$ 98,20',
    paymentMethod: 'Crédito na Entrega',
    status: 'Novo',
    obs: 'Caprichar no manjericão fresco.'
  },
  {
    id: '#1235',
    client: 'Larissa Azevedo',
    phone: '(11) 96543-3456',
    itemsCount: 2,
    itemsDesc: '1 prato, 1 bebida',
    itemsDetail: [
      { qty: 1, name: 'Bowl Quinoa e Cogumelos', price: 'R$ 38,00', details: 'Mix de cogumelos, tomate confit e pesto' },
      { qty: 1, name: 'Água de Coco Integral 300ml', price: 'R$ 14,00', details: 'Natural da fruta' }
    ],
    time: '10:30',
    date: 'Hoje',
    type: 'Retirada',
    address: 'Retirada no Balcão Casa Noma',
    total: 'R$ 52,00',
    paymentMethod: 'Débito na Entrega',
    status: 'Em preparo'
  },
  {
    id: '#1234',
    client: 'Eduardo Moreira',
    phone: '(11) 95432-4567',
    itemsCount: 3,
    itemsDesc: '2 pratos, 1 bebida',
    itemsDetail: [
      { qty: 1, name: 'Filé Mignon ao Molho Mostarda', price: 'R$ 69,90', details: 'Batatas rústicas e salada verde' },
      { qty: 1, name: 'Mousse de Maracujá com Calda', price: 'R$ 24,00', details: 'Chocolate meio amargo e maracujá' },
      { qty: 1, name: 'Suco Natural Abacaxi com Hortelã', price: 'R$ 21,90', details: '500ml gelado' }
    ],
    time: '10:15',
    date: 'Hoje',
    type: 'Delivery',
    address: 'Rua Simão Álvares, 650 - Pinheiros, São Paulo - SP',
    total: 'R$ 115,80',
    paymentMethod: 'Em Dinheiro',
    changeFor: 'Troco para R$ 150,00',
    status: 'Pronto',
    obs: 'Deixar na recepção do condomínio.'
  }
]

export default function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>('#1247')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Novo' | 'Em preparo' | 'Pronto' | 'Em entrega'>('Todos')
  const [typeFilter, setTypeFilter] = useState<'Todos' | 'Delivery' | 'Retirada'>('Todos')
  const [dateFilter, setDateFilter] = useState('Hoje')
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null)
  type SortField = 'id' | 'client' | 'time' | 'type' | 'total' | 'status'
  type SortDirection = 'asc' | 'desc'

  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // Dynamic items per page ensuring zero vertical scrollbars on any device size
  const [itemsPerPage, setItemsPerPage] = useState(7)

  useEffect(() => {
    const calculateItemsPerPage = () => {
      if (typeof window === 'undefined') return
      const w = window.innerWidth
      const h = window.innerHeight

      if (w < 640) {
        // Mobile screens: filters stack vertically and bottom nav takes 72px
        if (h < 750) {
          setItemsPerPage(3)
        } else if (h < 900) {
          setItemsPerPage(4)
        } else {
          setItemsPerPage(5)
        }
      } else if (w < 1024) {
        // Tablets / small laptops
        if (h < 800) {
          setItemsPerPage(5)
        } else if (h < 950) {
          setItemsPerPage(6)
        } else {
          setItemsPerPage(7)
        }
      } else {
        // Desktop / large screens
        if (h < 750) {
          setItemsPerPage(5)
        } else if (h < 850) {
          setItemsPerPage(6)
        } else if (h < 1000) {
          setItemsPerPage(7)
        } else {
          setItemsPerPage(8)
        }
      }
    }

    calculateItemsPerPage()
    window.addEventListener('resize', calculateItemsPerPage)
    return () => window.removeEventListener('resize', calculateItemsPerPage)
  }, [])

  const handleSort = (field: SortField) => {
    setCurrentPage(1)
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Selected Order
  const activeOrder = useMemo(() => {
    return orders.find(o => o.id === selectedOrderId) || null
  }, [orders, selectedOrderId])

  // Filtered and sorted orders
  const filteredOrders = useMemo(() => {
    const list = orders.filter(order => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesClient = order.client.toLowerCase().includes(query)
        const matchesId = order.id.toLowerCase().includes(query)
        const matchesPhone = order.phone.replace(/\D/g, '').includes(query.replace(/\D/g, ''))
        if (!matchesClient && !matchesId && !matchesPhone) return false
      }
      // Status
      if (statusFilter !== 'Todos' && order.status !== statusFilter) {
        return false
      }
      // Type
      if (typeFilter !== 'Todos' && order.type !== typeFilter) {
        return false
      }
      return true
    })

    if (!sortField) return list

    const STATUS_PRIORITY: Record<string, number> = {
      'Novo': 1,
      'Em preparo': 2,
      'Pronto': 3,
      'Em entrega': 4,
      'Concluído': 5,
    }

    return [...list].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'id': {
          const numA = parseInt(a.id.replace(/\D/g, ''), 10) || 0
          const numB = parseInt(b.id.replace(/\D/g, ''), 10) || 0
          comparison = numA - numB
          break
        }
        case 'client': {
          comparison = a.client.localeCompare(b.client, 'pt-BR', { sensitivity: 'base' })
          break
        }
        case 'time': {
          const [hA, mA] = a.time.split(':').map(Number)
          const [hB, mB] = b.time.split(':').map(Number)
          comparison = (hA * 60 + mA) - (hB * 60 + mB)
          break
        }
        case 'type': {
          comparison = a.type.localeCompare(b.type, 'pt-BR')
          break
        }
        case 'total': {
          const parseTotal = (t: string) => {
            const clean = t.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
            return parseFloat(clean) || 0
          }
          comparison = parseTotal(a.total) - parseTotal(b.total)
          break
        }
        case 'status': {
          const priorityA = STATUS_PRIORITY[a.status] || 99
          const priorityB = STATUS_PRIORITY[b.status] || 99
          comparison = priorityA - priorityB
          if (comparison === 0) {
            const numA = parseInt(a.id.replace(/\D/g, ''), 10) || 0
            const numB = parseInt(b.id.replace(/\D/g, ''), 10) || 0
            return numB - numA
          }
          break
        }
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [orders, searchQuery, statusFilter, typeFilter, sortField, sortDirection])

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage)
  }, [filteredOrders, safeCurrentPage, itemsPerPage])

  // Handle Order Accept
  const handleAcceptOrder = (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: 'Em preparo', isUrgent: false } : o))
    )
  }

  // Handle Advance Status
  const handleAdvanceStatus = (orderId: string) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o
        if (o.status === 'Novo') return { ...o, status: 'Em preparo', isUrgent: false }
        if (o.status === 'Em preparo') return { ...o, status: 'Pronto' }
        if (o.status === 'Pronto') return { ...o, status: 'Em entrega' }
        if (o.status === 'Em entrega') return { ...o, status: 'Concluído' }
        return o
      })
    )
  }

  // Handle Print Action
  const handleOpenPrint = (order: Order, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setPrintingOrder(order)
    setIsPrintModalOpen(true)
  }

  return (
    <div className="flex w-full h-full max-h-full overflow-hidden relative bg-[#FAF8F0]">
      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 flex flex-col w-full h-full max-h-full max-w-[1400px] mx-auto p-3 md:px-6 pt-3 md:pt-4 pb-3 max-lg:pb-[84px] overflow-hidden justify-between font-sans transition-all min-w-0",
          activeOrder ? "lg:pr-[440px]" : ""
        )}
      >
        {/* Page Header (Orange title matching DeliPlus logo & Estoque/Cardápio) */}
        <div className="flex flex-col mb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl md:text-4xl font-serif text-[#CB5A3C] tracking-tight">
              Pedidos
            </h1>

            {/* Tooltip Icon & Popover */}
            <div className="relative group inline-block">
              <div className="w-5 h-5 rounded-full bg-[#2E4233] text-white flex items-center justify-center text-[12px] font-extrabold leading-none shadow-sm cursor-help hover:scale-105 transition-transform">
                ?
              </div>
              <div className="absolute top-full left-0 mt-2 w-80 p-4 bg-[#2E4233] text-white rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                <p className="text-[13px] text-white mb-2 leading-relaxed">
                  <span className="font-extrabold text-white">Dica:</span> Acompanhe e gerencie todos os pedidos em tempo real da sua operação de delivery e retirada.
                </p>
                <div className="flex flex-col gap-2 pt-2 border-t border-white/10 text-[12px] text-white">
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5"></span>
                    <span>Aceite novos pedidos, altere o status de preparo, saída e entrega com um clique.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5"></span>
                    <span>Acesse os dados do cliente e chame diretamente no WhatsApp oficial.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5"></span>
                    <span>Imprima comandas térmicas padronizadas (80mm) para sua cozinha e entregadores.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-3 shrink-0">
          {/* Date Selector */}
          <div className="relative inline-block">
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="appearance-none bg-white border border-[#E9E4D4] rounded-xl pl-9 pr-8 py-2.5 text-xs font-semibold text-[#1C2C22] hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A2B]/20 transition-all shadow-sm cursor-pointer"
            >
              <option value="Hoje">Hoje</option>
              <option value="Ontem">Ontem</option>
              <option value="Últimos 7 dias">Últimos 7 dias</option>
              <option value="Este mês">Este mês</option>
            </select>
            <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Buscar pedido, cliente ou telefone..."
              className="w-full bg-white border border-[#E9E4D4] rounded-xl pl-10 pr-9 py-2.5 text-xs text-[#1C2C22] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A2B]/20 focus:border-[#1E3A2B] transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setCurrentPage(1)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative inline-block">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'Todos' | 'Novo' | 'Em preparo' | 'Pronto' | 'Em entrega')
                setCurrentPage(1)
              }}
              className="appearance-none bg-white border border-[#E9E4D4] rounded-xl pl-4 pr-8 py-2.5 text-xs font-semibold text-[#1C2C22] hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A2B]/20 transition-all shadow-sm cursor-pointer"
            >
              <option value="Todos">Todos os status</option>
              <option value="Novo">Novos</option>
              <option value="Em preparo">Em preparo</option>
              <option value="Pronto">Prontos</option>
              <option value="Em entrega">Em entrega</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Type Filter */}
          <div className="relative inline-block">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as 'Todos' | 'Delivery' | 'Retirada')
                setCurrentPage(1)
              }}
              className="appearance-none bg-white border border-[#E9E4D4] rounded-xl pl-4 pr-8 py-2.5 text-xs font-semibold text-[#1C2C22] hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A2B]/20 transition-all shadow-sm cursor-pointer"
            >
              <option value="Todos">Todos os tipos de entrega</option>
              <option value="Delivery">Delivery (Entrega)</option>
              <option value="Retirada">Retirada no Balcão</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>



        {/* Orders Table Container */}
        <div className="bg-white rounded-2xl border border-[#E9E4D4] shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col justify-between">
          <div className="overflow-x-auto overflow-y-hidden flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E9E4D4] bg-[#FAF8F0]/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th
                    onClick={() => handleSort('id')}
                    className={cn(
                      "py-2.5 pl-5 pr-2 whitespace-nowrap cursor-pointer select-none group transition-colors",
                      sortField === 'id' ? "text-[#CB5A3C]" : "hover:text-[#1C2C22]"
                    )}
                    title="Organizar por número do pedido"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>Pedido</span>
                      {sortField === 'id' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#CB5A3C]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#CB5A3C]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('client')}
                    className={cn(
                      "py-2.5 px-2 whitespace-nowrap cursor-pointer select-none group transition-colors",
                      sortField === 'client' ? "text-[#CB5A3C]" : "hover:text-[#1C2C22]"
                    )}
                    title="Organizar por nome do cliente"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>Cliente</span>
                      {sortField === 'client' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#CB5A3C]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#CB5A3C]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('time')}
                    className={cn(
                      "py-2.5 px-2 whitespace-nowrap cursor-pointer select-none group transition-colors",
                      sortField === 'time' ? "text-[#CB5A3C]" : "hover:text-[#1C2C22]"
                    )}
                    title="Organizar por horário"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>Horário</span>
                      {sortField === 'time' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#CB5A3C]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#CB5A3C]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('type')}
                    className={cn(
                      "py-2.5 px-2 whitespace-nowrap cursor-pointer select-none group transition-colors",
                      sortField === 'type' ? "text-[#CB5A3C]" : "hover:text-[#1C2C22]"
                    )}
                    title="Organizar por tipo (Delivery / Retirada)"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>Tipo</span>
                      {sortField === 'type' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#CB5A3C]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#CB5A3C]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('total')}
                    className={cn(
                      "py-2.5 px-2 whitespace-nowrap cursor-pointer select-none group transition-colors",
                      sortField === 'total' ? "text-[#CB5A3C]" : "hover:text-[#1C2C22]"
                    )}
                    title="Organizar por valor total"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>Total</span>
                      {sortField === 'total' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#CB5A3C]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#CB5A3C]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className={cn(
                      "py-2.5 px-2 text-center whitespace-nowrap cursor-pointer select-none group transition-colors",
                      sortField === 'status' ? "text-[#CB5A3C]" : "hover:text-[#1C2C22]"
                    )}
                    title="Organizar por status (agrupar iguais)"
                  >
                    <div className="inline-flex items-center justify-center gap-1.5">
                      <span>Status</span>
                      {sortField === 'status' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#CB5A3C]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#CB5A3C]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th className="py-2.5 pr-5 pl-2 text-right whitespace-nowrap select-none">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E4D4]/60">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500 text-sm">
                      Nenhum pedido encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => {
                    const isSelected = order.id === selectedOrderId
                    const isNovo = order.status === 'Novo'
                    const isPreparo = order.status === 'Em preparo'
                    const isPronto = order.status === 'Pronto'
                    const isEntrega = order.status === 'Em entrega'

                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrderId(order.id)}
                        className={cn(
                          "cursor-pointer transition-colors relative group",
                          isSelected
                            ? "bg-[#FAF8F0]"
                            : "hover:bg-[#FAF8F0]/40"
                        )}
                      >
                        {/* Order ID with Urgent Stripe */}
                        <td className="py-2.5 pl-5 pr-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {isNovo && (
                              <span className="w-1.5 h-6 rounded-full bg-[#CB5A3C] shrink-0" />
                            )}
                            <div>
                              <span className="font-bold text-sm text-[#1C2C22] group-hover:text-[#CB5A3C] transition-colors">
                                {order.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Cliente */}
                        <td className="py-2.5 px-2">
                          <div className="font-semibold text-sm text-[#1C2C22] leading-tight mb-1.5">
                            {order.client}
                          </div>
                          <a
                            href={`https://wa.me/55${order.phone.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(order.client)}%2C%20tudo%20bem%3F%20Aqui%20%C3%A9%20da%20Casa%20Noma%20sobre%20seu%20pedido%20${order.id}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm transition-all cursor-pointer shrink-0"
                            title={`Conversar com ${order.client} no WhatsApp (${order.phone})`}
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5 fill-white text-white shrink-0" />
                            <span>WhatsApp</span>
                          </a>
                        </td>

                        {/* Horário */}
                        <td className="py-2.5 px-2 whitespace-nowrap">
                          <div className="text-sm font-medium text-[#1C2C22]">{order.time}</div>
                          <div className="text-[11px] text-gray-400">{order.date}</div>
                        </td>

                        {/* Tipo */}
                        <td className="py-2.5 px-2 whitespace-nowrap">
                          {order.type === 'Delivery' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200/60">
                              Delivery
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
                              Retirada
                            </span>
                          )}
                        </td>

                        {/* Total */}
                        <td className="py-2.5 px-2 whitespace-nowrap">
                          <div className="text-[15px] font-bold text-[#1C2C22] leading-tight">{order.total}</div>
                          <div className="text-xs text-gray-700 font-semibold mt-0.5 leading-tight">
                            {order.paymentMethod}
                          </div>
                          {order.paymentMethod === 'Em Dinheiro' && order.changeFor && (
                            <div className="text-xs text-amber-800 font-bold mt-0.5 leading-tight">
                              {order.changeFor}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          {isNovo && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF2EE] text-[#CB5A3C] border border-[#FADCD5]">
                              Novo
                            </span>
                          )}
                          {isPreparo && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                              Em preparo
                            </span>
                          )}
                          {isPronto && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
                              Pronto
                            </span>
                          )}
                          {isEntrega && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]">
                              Em entrega
                            </span>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="py-2.5 pr-5 pl-2 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {isNovo ? (
                              <button
                                onClick={(e) => handleAcceptOrder(order.id, e)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#CB5A3C] hover:bg-[#B34B30] text-white shadow-sm transition-all flex items-center gap-1 shrink-0"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Aceitar
                              </button>
                            ) : null}

                            <button
                              onClick={() => setSelectedOrderId(order.id)}
                              className={cn(
                                "px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all shrink-0",
                                isSelected
                                    ? "bg-[#1E3A2B] text-white border-[#1E3A2B]"
                                    : "bg-white text-[#1C2C22] border-[#E9E4D4] hover:bg-[#F5F2E9]"
                              )}
                            >
                              Ver pedido
                            </button>

                            <button
                              onClick={(e) => handleOpenPrint(order, e)}
                              className="p-1.5 rounded-xl text-gray-500 hover:text-[#1C2C22] border border-[#E9E4D4] hover:bg-white transition-all shrink-0"
                              title="Imprimir comanda"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls pinned at bottom (Centered with item count) */}
          <div className="relative flex justify-center items-center px-6 py-2.5 border-t border-[#E9E4D4] bg-[#FAF8F0]/30 shrink-0 min-h-[44px]">
            <span className="hidden sm:inline-block absolute left-6 text-xs text-gray-500 font-medium">
              Mostrando {filteredOrders.length > 0 ? (safeCurrentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(safeCurrentPage * itemsPerPage, filteredOrders.length)} de {filteredOrders.length} pedidos
            </span>

            <div className="flex justify-center items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${
                    safeCurrentPage === i + 1 
                      ? "bg-[#CB5A3C] text-white shadow-sm" 
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-[#E9E4D4]"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Drawer / Order Details Panel */}
      {activeOrder && (
        <aside
          className="fixed lg:fixed top-0 lg:top-0 right-0 bottom-0 w-full sm:w-[420px] bg-white border-l border-[#E9E4D4] shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200"
        >
          {/* Drawer Header */}
          <div className="p-6 border-b border-[#E9E4D4] bg-[#FAF8F0]/80 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-serif font-bold text-[#1C2C22] leading-tight">
                  Pedido {activeOrder.id}
                </h2>
                {activeOrder.status === 'Novo' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF2EE] text-[#CB5A3C] border border-[#FADCD5]">
                    Novo
                  </span>
                )}
                {activeOrder.status === 'Em preparo' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                    Em preparo
                  </span>
                )}
                {activeOrder.status === 'Pronto' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
                    Pronto
                  </span>
                )}
                {activeOrder.status === 'Em entrega' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]">
                    Em entrega
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                Recebido às {activeOrder.time} • {activeOrder.date}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedOrderId(null)}
              aria-label="Fechar"
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Section: Cliente */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Cliente
              </h3>
              <div className="bg-[#FAF8F0]/60 border border-[#E9E4D4] rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-[#1C2C22]">{activeOrder.client}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{activeOrder.phone}</div>
                </div>
                <a
                  href={`https://wa.me/55${activeOrder.phone.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(activeOrder.client)}%2C%20aqui%20%C3%A9%20da%20Casa%20Noma.%20Sobre%20seu%20pedido%20${activeOrder.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-white text-white shrink-0" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Section: Entrega */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                {activeOrder.type === 'Delivery' ? (
                  <>
                    <Bike className="w-3.5 h-3.5" />
                    Entrega (Delivery)
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Retirada no Balcão
                  </>
                )}
              </h3>
              <div className="bg-[#FAF8F0]/60 border border-[#E9E4D4] rounded-xl p-3.5">
                <div className="font-semibold text-xs text-[#1C2C22] mb-1">
                  {activeOrder.type === 'Delivery' ? 'Endereço de entrega' : 'Local de Retirada'}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{activeOrder.address}</p>
                {activeOrder.type === 'Delivery' && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeOrder.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#CB5A3C] hover:underline mt-2.5"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Ver rota no Google Maps</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Section: Itens do pedido */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <ReceiptText className="w-3.5 h-3.5" />
                Itens do pedido ({activeOrder.itemsDetail.length})
              </h3>
              <div className="space-y-2.5">
                {activeOrder.itemsDetail.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-[#E9E4D4] bg-white flex items-start gap-3 shadow-xs"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#FAF8F0] border border-[#E9E4D4] text-[#1C2C22] font-bold text-xs flex items-center justify-center shrink-0">
                      {item.qty}x
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-[#1C2C22] truncate">
                          {item.name}
                        </span>
                        <span className="font-bold text-xs text-[#1C2C22] shrink-0">
                          {item.price}
                        </span>
                      </div>
                      {item.details && (
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{item.details}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section: Observações */}
            {activeOrder.obs && (
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Observações do Cliente
                </h3>
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 leading-relaxed font-medium">
                  {activeOrder.obs}
                </div>
              </div>
            )}

            {/* Section: Pagamento */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                Pagamento
              </h3>
              <div className="bg-[#FAF8F0]/60 border border-[#E9E4D4] rounded-xl p-3.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-[#1C2C22]">{activeOrder.paymentMethod}</span>
                  <div className="text-[11px] text-gray-600 mt-0.5">
                    {activeOrder.paymentMethod === 'Em Dinheiro' && activeOrder.changeFor
                      ? activeOrder.changeFor
                      : 'Cobrar na entrega / retirada'}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full font-bold text-[11px] bg-amber-50 text-amber-800 border border-amber-200">
                  {activeOrder.type === 'Delivery' ? 'Na entrega' : 'No balcão'}
                </span>
              </div>
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-6 border-t border-[#E9E4D4] bg-[#FAF8F0]/90 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Total do pedido
              </span>
              <span className="text-2xl font-serif font-bold text-[#1C2C22]">
                {activeOrder.total}
              </span>
            </div>

            {/* Primary Action Button (State dependent) */}
            {activeOrder.status === 'Novo' ? (
              <button
                onClick={() => handleAcceptOrder(activeOrder.id)}
                className="w-full py-3.5 rounded-xl bg-[#CB5A3C] hover:bg-[#B34B30] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Aceitar pedido</span>
              </button>
            ) : activeOrder.status === 'Em preparo' ? (
              <button
                onClick={() => handleAdvanceStatus(activeOrder.id)}
                className="w-full py-3.5 rounded-xl bg-[#1E3A2B] hover:bg-[#162B20] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <CircleCheck className="w-4 h-4 text-emerald-400" />
                <span>Marcar como Pronto</span>
              </button>
            ) : activeOrder.status === 'Pronto' ? (
              <button
                onClick={() => handleAdvanceStatus(activeOrder.id)}
                className="w-full py-3.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Bike className="w-4 h-4" />
                <span>Despachar pedido</span>
              </button>
            ) : (
              <button
                onClick={() => handleAdvanceStatus(activeOrder.id)}
                className="w-full py-3.5 rounded-xl bg-gray-800 hover:bg-black text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Concluir pedido</span>
              </button>
            )}

            {/* Print Button */}
            <button
              onClick={() => handleOpenPrint(activeOrder)}
              className="w-full py-3 rounded-xl bg-white border border-[#E9E4D4] hover:bg-[#F5F2E9] text-[#1C2C22] font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <Printer className="w-4 h-4 text-gray-600" />
              <span>Imprimir comanda térmica (80mm)</span>
            </button>
          </div>
        </aside>
      )}

      {/* Thermal Receipt Preview Modal (80mm Cupom) */}
      {isPrintModalOpen && printingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 bg-[#1E3A2B] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-sm">Impressão Térmica 80mm</span>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Thermal Receipt Mockup */}
            <div className="p-6 overflow-y-auto flex-1 bg-[#F9F9F8]">
              <div
                id="thermal-receipt"
                className="bg-white border border-dashed border-gray-300 p-5 font-mono text-[11px] leading-tight text-black shadow-inner space-y-3"
              >
                <div className="text-center pb-2 border-b border-dashed border-gray-400">
                  <div className="font-bold text-base tracking-wider">CASA NOMA</div>
                  <div>Rua das Flores, 123 - São Paulo</div>
                  <div>CNPJ: 12.345.678/0001-90</div>
                  <div className="mt-1">COMANDA NÃO FISCAL</div>
                </div>

                <div className="flex justify-between border-b border-dashed border-gray-400 pb-2">
                  <span className="font-bold">PEDIDO {printingOrder.id}</span>
                  <span>{printingOrder.time} • {printingOrder.date}</span>
                </div>

                <div className="border-b border-dashed border-gray-400 pb-2">
                  <div className="font-bold">CLIENTE: {printingOrder.client}</div>
                  <div>FONE: {printingOrder.phone}</div>
                  <div>TIPO: {printingOrder.type.toUpperCase()}</div>
                  {printingOrder.type === 'Delivery' && (
                    <div className="mt-1 text-[10px]">END: {printingOrder.address}</div>
                  )}
                </div>

                <div className="border-b border-dashed border-gray-400 pb-2 space-y-1.5">
                  <div className="font-bold flex justify-between">
                    <span>QTD ITEM</span>
                    <span>VALOR</span>
                  </div>
                  {printingOrder.itemsDetail.map((it, i) => (
                    <div key={i}>
                      <div className="flex justify-between">
                        <span>{it.qty}x {it.name}</span>
                        <span>{it.price}</span>
                      </div>
                      {it.details && (
                        <div className="text-[10px] text-gray-600 pl-2">↳ {it.details}</div>
                      )}
                    </div>
                  ))}
                </div>

                {printingOrder.obs && (
                  <div className="border-b border-dashed border-gray-400 pb-2">
                    <span className="font-bold">OBSERVAÇÕES:</span>
                    <div>{printingOrder.obs}</div>
                  </div>
                )}

                <div className="border-b border-dashed border-gray-400 pb-2">
                  <div className="flex justify-between">
                    <span>FORMA PGTO:</span>
                    <span className="font-bold">{printingOrder.paymentMethod}</span>
                  </div>
                  {printingOrder.paymentMethod === 'Em Dinheiro' && printingOrder.changeFor && (
                    <div className="text-[10px] text-gray-700">↳ {printingOrder.changeFor}</div>
                  )}
                </div>

                <div className="pt-1 flex justify-between font-bold text-xs">
                  <span>TOTAL A PAGAR:</span>
                  <span>{printingOrder.total}</span>
                </div>

                <div className="text-center pt-2 text-[10px] text-gray-500">
                  DeliPlus Sistema de Gestão
                  <br />
                  Obrigado pela preferência!
                </div>
              </div>
            </div>

            {/* Print Dialog Actions */}
            <div className="p-4 bg-white border-t border-gray-200 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsPrintModalOpen(false)}
                className="flex-1 text-xs"
              >
                Fechar
              </Button>
              <Button
                onClick={() => {
                  if (typeof window !== 'undefined') window.print()
                }}
                className="flex-1 bg-[#1E3A2B] hover:bg-[#162B20] text-white text-xs font-semibold gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Cupom
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
