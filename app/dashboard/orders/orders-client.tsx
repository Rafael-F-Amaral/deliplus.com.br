'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useOrganization } from '@clerk/nextjs'
import { updateOrderStatusAction, updateOrderItemsAction, cancelOrderAction, OrderStatus } from './actions'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import {
  Printer,
  X,
  Check,
  Search,
  Calendar,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Minus
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

// Helper to generate contextual WhatsApp message with store name and sanitized phone
function getWhatsAppUrl(order: Order, storeName: string): string {
  const rawDigits = order.phone.replace(/\D/g, '')
  const phoneFormatted = rawDigits.startsWith('55') ? rawDigits : `55${rawDigits}`

  const clientName = order.client.trim()
  const orderId = order.id
  let msg = ''

  if (order.status === 'Novo') {
    msg = `Olá ${clientName}! Aqui é da *${storeName}*. Recebemos seu pedido *${orderId}* e já estamos conferindo para iniciar o preparo! 👨‍🍳`
  } else if (order.status === 'Em preparo') {
    msg = `Olá ${clientName}! Aqui é da *${storeName}*. Seu pedido *${orderId}* já está sendo preparado com muito capricho pela nossa cozinha! 🍕`
  } else if (order.status === 'Pronto') {
    if (order.type === 'Retirada') {
      msg = `Olá ${clientName}! Aqui é da *${storeName}*. Seu pedido *${orderId}* já está pronto e quentinho no balcão aguardando sua retirada! 🎉`
    } else {
      msg = `Olá ${clientName}! Aqui é da *${storeName}*. Seu pedido *${orderId}* já está pronto e embalado, aguardando saída com o entregador! 🛵`
    }
  } else if (order.status === 'Em entrega') {
    msg = `Olá ${clientName}! Aqui é da *${storeName}*. Seu pedido *${orderId}* acabou de sair com nosso entregador! Fique de olho na campainha/portaria 🛵💨`
  } else if (order.status === 'Concluído') {
    msg = `Olá ${clientName}! Aqui é da *${storeName}*. Seu pedido *${orderId}* foi finalizado. Esperamos que tenha uma ótima refeição e agradecemos pela preferência! ❤️`
  } else {
    msg = `Olá ${clientName}! Aqui é da *${storeName}* sobre o seu pedido *${orderId}*.`
  }

  return `https://wa.me/${phoneFormatted}?text=${encodeURIComponent(msg)}`
}

export interface OrderItem {
  id?: string
  qty: number
  name: string
  price: string
  details?: string
  complements?: { name: string; price: string; priceCents?: number }[]
}

export type PaymentMethod = 'Débito na Entrega' | 'Crédito na Entrega' | 'Em Dinheiro'

export interface Order {
  dbId?: string
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
  status: 'Novo' | 'Em preparo' | 'Pronto' | 'Em entrega' | 'Concluído' | 'Cancelado'
  obs?: string
  isUrgent?: boolean
}

function formatBRL(cents: number | null | undefined): string {
  if (typeof cents !== 'number' || isNaN(cents)) return 'R$ 0,00'
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

function formatTime(dateStr: string): { time: string; date: string } {
  try {
    const d = new Date(dateStr)
    const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const today = new Date()
    const isToday = d.toDateString() === today.toDateString()
    const date = isToday ? 'Hoje' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    return { time, date }
  } catch {
    return { time: '12:00', date: 'Hoje' }
  }
}

function mapRowToOrder(row: Record<string, unknown>): Order {
  const { time, date } = formatTime(String(row.created_at || ''))
  const rawItems = Array.isArray(row.items_detail) ? (row.items_detail as Array<Record<string, unknown>>) : []
  return {
    dbId: typeof row.id === 'string' ? row.id : undefined,
    id: typeof row.display_id === 'string' ? row.display_id : `#${String(row.order_number || 1).padStart(4, '0')}`,
    client: typeof row.customer_name === 'string' ? row.customer_name : 'Cliente',
    phone: typeof row.customer_phone === 'string' ? row.customer_phone : '',
    itemsCount: typeof row.items_count === 'number' ? row.items_count : 0,
    itemsDesc: `${typeof row.items_count === 'number' ? row.items_count : 0} ${row.items_count === 1 ? 'item' : 'itens'}`,
    itemsDetail: rawItems.map((it) => ({
      id: typeof it.id === 'string' ? it.id : undefined,
      qty: typeof it.qty === 'number' ? it.qty : 1,
      name: typeof it.name === 'string' ? it.name : 'Item',
      price: formatBRL(typeof it.unit_price_cents === 'number' ? it.unit_price_cents : 0),
      details: typeof it.details === 'string' ? it.details : undefined,
      complements: Array.isArray(it.complements)
        ? (it.complements as Array<Record<string, unknown>>).map((c) => ({
            name: String(c.name || ''),
            price: formatBRL(typeof c.price_cents === 'number' ? c.price_cents : 0),
            priceCents: typeof c.price_cents === 'number' ? c.price_cents : 0
          }))
        : undefined
    })),
    time,
    date,
    type: row.delivery_type === 'Retirada' ? 'Retirada' : 'Delivery',
    address: typeof row.delivery_address === 'string' ? row.delivery_address : (row.delivery_type === 'Retirada' ? 'Balcão da Loja Principal' : 'Endereço não informado'),
    total: formatBRL(typeof row.total_amount_cents === 'number' ? row.total_amount_cents : 0),
    paymentMethod: (typeof row.payment_method === 'string' ? row.payment_method : 'Em Dinheiro') as PaymentMethod,
    changeFor: typeof row.change_for_cents === 'number' ? `Troco p/ ${formatBRL(row.change_for_cents)}` : undefined,
    status: (typeof row.status === 'string' ? row.status : 'Novo') as Order['status'],
    obs: typeof row.notes === 'string' ? row.notes : undefined,
    isUrgent: Boolean(row.is_urgent)
  }
}

export interface CatalogComplement {
  id: string
  name: string
  price: string
  priceCents: number
}

export interface CatalogProduct {
  id: string
  name: string
  price: string
  priceCents: number
  complements: CatalogComplement[]
}

export interface OrdersClientProps {
  initialOrders?: Order[]
  storeId?: string
  storeName?: string
  storeSlug?: string
  catalogProducts?: CatalogProduct[]
}

const INITIAL_ORDERS: Order[] = [
  {
    id: '#0001',
    client: 'Marina Souza',
    phone: '(11) 98765-4321',
    itemsCount: 7,
    itemsDesc: '3 pratos, 2 bebidas, 2 adicionais',
    itemsDetail: [
      { qty: 1, name: 'Frango Grelhado com Ervas', price: 'R$ 34,90', details: 'Arroz integral, legumes grelhados' },
      { qty: 1, name: 'Salada Noma', price: 'R$ 28,90', details: 'Folhas, tomate cereja, queijo de cabra, nozes, molho balsâmico' },
      { qty: 1, name: 'Suco Natural Laranja 300ml', price: 'R$ 12,90', details: '300ml gelado, sem açúcar' },
      { qty: 1, name: 'Porção de Batatas Rústicas', price: 'R$ 18,00', details: 'Com alecrim e sal grosso' },
      { qty: 1, name: 'Pudim de Leite Condensado', price: 'R$ 14,00', details: 'Fatia artesanal' },
      { qty: 1, name: 'Refrigerante Guaraná Lata', price: 'R$ 7,00', details: '350ml gelado' },
      { qty: 1, name: 'Molho Especial de Alho', price: 'R$ 4,50', details: 'Pote 50ml' }
    ],
    time: '12:30',
    date: 'Hoje',
    type: 'Delivery',
    address: 'Rua das Flores, 123 - Vila Madalena, São Paulo - SP, 05433-000',
    total: 'R$ 120,20',
    paymentMethod: 'Crédito na Entrega',
    status: 'Novo',
    obs: 'Sem cebola, por favor.\nBater na portaria.',
    isUrgent: true
  },
  {
    id: '#0002',
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
    id: '#0003',
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
    id: '#0004',
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
    id: '#0005',
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
    id: '#0006',
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
    id: '#0007',
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
    id: '#0008',
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
    id: '#0009',
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
    id: '#0010',
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
    id: '#0011',
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
    id: '#0012',
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
    id: '#0013',
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
    id: '#0014',
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
  },
  {
    id: '#0015',
    client: 'Marcos Vinícius',
    phone: '(11) 94321-8765',
    itemsCount: 2,
    itemsDesc: '1 prato, 1 sobremesa',
    itemsDetail: [
      { qty: 1, name: 'Risoto de Cogumelos Selvagens', price: 'R$ 58,00', details: 'Com azeite trufado' },
      { qty: 1, name: 'Panna Cotta com Frutas Vermelhas', price: 'R$ 22,00' }
    ],
    time: '10:05',
    date: 'Hoje',
    type: 'Delivery',
    address: 'Rua Fradique Coutinho, 980 - Vila Madalena, São Paulo - SP',
    total: 'R$ 80,00',
    paymentMethod: 'Crédito na Entrega',
    status: 'Concluído'
  },
  {
    id: '#0016',
    client: 'Carolina Mendes',
    phone: '(11) 93210-9876',
    itemsCount: 1,
    itemsDesc: '1 prato',
    itemsDetail: [
      { qty: 1, name: 'Salmão Grelhado com Alcaparras', price: 'R$ 72,00', details: 'Purê de mandioquinha' }
    ],
    time: '09:55',
    date: 'Hoje',
    type: 'Retirada',
    address: 'Balcão da Loja Principal',
    total: 'R$ 72,00',
    paymentMethod: 'Débito na Entrega',
    status: 'Novo'
  },
  {
    id: '#0017',
    client: 'Felipe Santana',
    phone: '(11) 92109-8765',
    itemsCount: 3,
    itemsDesc: '2 pratos, 1 bebida',
    itemsDetail: [
      { qty: 2, name: 'Hambúrguer Artesanal Trufado', price: 'R$ 84,00', details: 'Pão brioche, blend 180g, queijo brie' },
      { qty: 1, name: 'Refrigerante Orgânico 350ml', price: 'R$ 11,00' }
    ],
    time: '09:40',
    date: 'Hoje',
    type: 'Delivery',
    address: 'Alameda Santos, 1400, Conj 51 - Cerqueira César, São Paulo - SP',
    total: 'R$ 95,00',
    paymentMethod: 'Em Dinheiro',
    changeFor: 'Troco para R$ 100,00',
    status: 'Em preparo',
    obs: 'Interfone não funciona, chamar no WhatsApp ao chegar.'
  },
  {
    id: '#0018',
    client: 'Aline Barros',
    phone: '(11) 91098-7654',
    itemsCount: 2,
    itemsDesc: '1 prato, 1 bebida',
    itemsDetail: [
      { qty: 1, name: 'Gnocchi ao Pesto Genovês', price: 'R$ 49,00' },
      { qty: 1, name: 'Água com Gás e Limão', price: 'R$ 8,00' }
    ],
    time: '09:30',
    date: 'Hoje',
    type: 'Delivery',
    address: 'Rua Bela Cintra, 890, Apto 12 - Consolação, São Paulo - SP',
    total: 'R$ 57,00',
    paymentMethod: 'Crédito na Entrega',
    status: 'Pronto'
  },
  {
    id: '#0019',
    client: 'Renato Faria',
    phone: '(11) 90987-6543',
    itemsCount: 4,
    itemsDesc: '3 pratos, 1 sobremesa',
    itemsDetail: [
      { qty: 2, name: 'Escondidinho de Carne Seca', price: 'R$ 78,00' },
      { qty: 1, name: 'Salada Verde Tropical', price: 'R$ 26,00' },
      { qty: 1, name: 'Pudim de Leite Ninho', price: 'R$ 18,00' }
    ],
    time: '09:15',
    date: 'Hoje',
    type: 'Delivery',
    address: 'Rua Mourato Coelho, 450 - Pinheiros, São Paulo - SP',
    total: 'R$ 122,00',
    paymentMethod: 'Débito na Entrega',
    status: 'Em entrega'
  },
  {
    id: '#0020',
    client: 'Camila Peixoto',
    phone: '(11) 98712-3456',
    itemsCount: 2,
    itemsDesc: '2 pratos',
    itemsDetail: [
      { qty: 1, name: 'Bowl Proteico de Frango', price: 'R$ 38,90' },
      { qty: 1, name: 'Wrap de Atum com Ricota', price: 'R$ 29,90' }
    ],
    time: '09:00',
    date: 'Hoje',
    type: 'Retirada',
    address: 'Balcão da Loja Principal',
    total: 'R$ 68,80',
    paymentMethod: 'Em Dinheiro',
    status: 'Concluído'
  },
  {
    id: '#0021',
    client: 'Lucas Nogueira',
    phone: '(11) 97623-4567',
    itemsCount: 1,
    itemsDesc: '1 prato executivo',
    itemsDetail: [
      { qty: 1, name: 'Feijoada Individual Completa', price: 'R$ 54,00', details: 'Arroz, couve, farofa e torresmo' }
    ],
    time: '08:45',
    date: 'Hoje',
    type: 'Delivery',
    address: 'Rua Augusta, 2100, Apto 84 - Jardins, São Paulo - SP',
    total: 'R$ 54,00',
    paymentMethod: 'Crédito na Entrega',
    status: 'Novo',
    isUrgent: true
  },
  {
    id: '#0022',
    client: 'Tatiane Ribeiro',
    phone: '(11) 96534-5678',
    itemsCount: 3,
    itemsDesc: '2 lanches, 1 suco',
    itemsDetail: [
      { qty: 2, name: 'Sanduíche Natural de Frango', price: 'R$ 36,00' },
      { qty: 1, name: 'Suco Verde Detox 500ml', price: 'R$ 16,00' }
    ],
    time: '08:30',
    date: 'Hoje',
    type: 'Delivery',
    address: 'Av. Rebouças, 1800 - Pinheiros, São Paulo - SP',
    total: 'R$ 52,00',
    paymentMethod: 'Débito na Entrega',
    status: 'Em preparo'
  },
  {
    id: '#0023',
    client: 'Henrique Vasconcelos',
    phone: '(11) 95445-6789',
    itemsCount: 2,
    itemsDesc: '1 pizza, 1 refrigerante',
    itemsDetail: [
      { qty: 1, name: 'Pizza Margherita Especial', price: 'R$ 68,00', details: 'Massa fermentação natural' },
      { qty: 1, name: 'Coca-Cola Zero 2L', price: 'R$ 14,00' }
    ],
    time: '08:15',
    date: 'Hoje',
    type: 'Delivery',
    address: 'Rua Teodoro Sampaio, 1200 - Pinheiros, São Paulo - SP',
    total: 'R$ 82,00',
    paymentMethod: 'Em Dinheiro',
    changeFor: 'Troco para R$ 100,00',
    status: 'Pronto'
  },
  {
    id: '#0024',
    client: 'Débora Silveira',
    phone: '(11) 94356-7890',
    itemsCount: 1,
    itemsDesc: '1 prato',
    itemsDetail: [
      { qty: 1, name: 'Poke Havaiano de Salmão', price: 'R$ 52,00', details: 'Sem cebola roxa' }
    ],
    time: '08:00',
    date: 'Hoje',
    type: 'Retirada',
    address: 'Balcão da Loja Principal',
    total: 'R$ 52,00',
    paymentMethod: 'Crédito na Entrega',
    status: 'Em preparo'
  },
  {
    id: '#0025',
    client: 'Thiago Guimarães',
    phone: '(11) 93267-8901',
    itemsCount: 3,
    itemsDesc: '2 pratos, 1 sobremesa',
    itemsDetail: [
      { qty: 1, name: 'Costelinha Barbecue com Batatas', price: 'R$ 69,90' },
      { qty: 1, name: 'Porção de Onion Rings', price: 'R$ 24,00' },
      { qty: 1, name: 'Brownie com Sorvete', price: 'R$ 21,00' }
    ],
    time: '07:45',
    date: 'Hoje',
    type: 'Delivery',
    address: 'Rua Cardeal Arcoverde, 1500 - Pinheiros, São Paulo - SP',
    total: 'R$ 114,90',
    paymentMethod: 'Débito na Entrega',
    status: 'Em entrega'
  },
  {
    id: '#0026',
    client: 'Vanessa Paiva',
    phone: '(11) 92178-9012',
    itemsCount: 2,
    itemsDesc: '1 lanche, 1 bebida',
    itemsDetail: [
      { qty: 1, name: 'Torta de Frango com Requeijão', price: 'R$ 26,00' },
      { qty: 1, name: 'Cappuccino Gelado 300ml', price: 'R$ 15,00' }
    ],
    time: '07:30',
    date: 'Hoje',
    type: 'Retirada',
    address: 'Balcão da Loja Principal',
    total: 'R$ 41,00',
    paymentMethod: 'Em Dinheiro',
    status: 'Novo'
  },
  {
    id: '#0027',
    client: 'Leandro Castro',
    phone: '(11) 91089-0123',
    itemsCount: 4,
    itemsDesc: '4 pastéis',
    itemsDetail: [
      { qty: 2, name: 'Pastel Especial de Carne e Queijo', price: 'R$ 32,00' },
      { qty: 2, name: 'Pastel de Palmito com Catupiry', price: 'R$ 30,00' }
    ],
    time: '07:15',
    date: 'Hoje',
    type: 'Delivery',
    address: 'Rua Oscar Freire, 900 - Jardins, São Paulo - SP',
    total: 'R$ 62,00',
    paymentMethod: 'Crédito na Entrega',
    status: 'Concluído'
  },
  {
    id: '#0028',
    client: 'Priscila Prado',
    phone: '(11) 99890-1234',
    itemsCount: 1,
    itemsDesc: '1 combo café da manhã',
    itemsDetail: [
      { qty: 1, name: 'Combo Ovos Mexidos + Croissant + Café', price: 'R$ 35,00' }
    ],
    time: '07:00',
    date: 'Hoje',
    type: 'Delivery',
    address: 'Rua Haddock Lobo, 1100 - Cerqueira César, São Paulo - SP',
    total: 'R$ 35,00',
    paymentMethod: 'Débito na Entrega',
    status: 'Concluído'
  },
  {
    id: '#0029',
    client: 'Gustavo Mendonça',
    phone: '(11) 98701-2345',
    itemsCount: 2,
    itemsDesc: '2 pratos',
    itemsDetail: [
      { qty: 1, name: 'Lasanha à Bolonhesa Clássica', price: 'R$ 56,00' },
      { qty: 1, name: 'Petit Gâteau de Chocolate', price: 'R$ 24,00' }
    ],
    time: '06:45',
    date: 'Hoje',
    type: 'Delivery',
    address: 'Rua Pamplona, 700 - Jardim Paulista, São Paulo - SP',
    total: 'R$ 80,00',
    paymentMethod: 'Crédito na Entrega',
    status: 'Concluído'
  },
  {
    id: '#0030',
    client: 'Isabela Fontes',
    phone: '(11) 97612-3456',
    itemsCount: 3,
    itemsDesc: '2 bebidas, 1 snack',
    itemsDetail: [
      { qty: 2, name: 'Smoothie de Frutas Amarelas', price: 'R$ 34,00' },
      { qty: 1, name: 'Cookie Artesanal Gotas de Chocolate', price: 'R$ 14,00' }
    ],
    time: '06:30',
    date: 'Hoje',
    type: 'Retirada',
    address: 'Balcão da Loja Principal',
    total: 'R$ 48,00',
    paymentMethod: 'Débito na Entrega',
    status: 'Concluído'
  }
]

const KITCHEN_STATUS_OPTIONS: { label: string; value: 'Todos' | 'Novo' | 'Em preparo' | 'Pronto' }[] = [
  { label: 'Todos', value: 'Todos' },
  { label: 'Novos', value: 'Novo' },
  { label: 'Em preparo', value: 'Em preparo' },
  { label: 'Prontos', value: 'Pronto' },
]

export default function OrdersClient({
  initialOrders = [],
  storeId,
  storeName: propStoreName,
  catalogProducts = []
}: OrdersClientProps = {}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders.length > 0 ? initialOrders : INITIAL_ORDERS)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Novo' | 'Em preparo' | 'Pronto'>('Todos')
  const [typeFilter, setTypeFilter] = useState<'Todos' | 'Delivery' | 'Retirada'>('Todos')
  const [dateFilter, setDateFilter] = useState('Hoje')
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null)
  const { organization } = useOrganization()
  const storeName = propStoreName || organization?.name || 'RafaelTeste'

  // Todos os adicionais únicos cadastrados na loja
  const allDistinctComplements = useMemo(() => {
    const map = new Map<string, { name: string; price: string; priceCents: number }>()
    for (const p of catalogProducts) {
      if (Array.isArray(p.complements)) {
        for (const c of p.complements) {
          if (!map.has(c.name)) {
            map.set(c.name, { name: c.name, price: c.price, priceCents: c.priceCents })
          }
        }
      }
    }
    return Array.from(map.values())
  }, [catalogProducts])

  useEffect(() => {
    if (initialOrders && initialOrders.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOrders(initialOrders)
    }
  }, [initialOrders])

  // Realtime subscription to reflect orders changes across storefront, webhook or other sessions
  useEffect(() => {
    if (!storeId) return

    const supabase = createBrowserSupabaseClient()
    const channel = supabase
      .channel(`orders_realtime_${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeId}`
        },
        async () => {
          const { data } = await supabase
            .from('vw_orders_live')
            .select('*')
            .eq('store_id', storeId)
            .order('order_number', { ascending: false })

          if (data) {
            setOrders(data.map(mapRowToOrder))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId])

  // Drawer items pagination (5 items per page)
  const [drawerItemPage, setDrawerItemPage] = useState(1)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDrawerItemPage(1)
  }, [selectedOrderId])

  // Cancel Order Modal State
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null)
  const [isCanceling, setIsCanceling] = useState(false)

  // Edit Order Items Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [editableItems, setEditableItems] = useState<OrderItem[]>([])
  const [itemToDeleteFromOrder, setItemToDeleteFromOrder] = useState<{ index: number; name: string } | null>(null)
  
  // Form de adicionar produto
  const [selectedCatalogProdId, setSelectedCatalogProdId] = useState('')
  const [newItemName, setNewItemName] = useState('')
  const [newItemQty, setNewItemQty] = useState(1)
  const [newItemPrice, setNewItemPrice] = useState('')
  const [newItemDetails, setNewItemDetails] = useState('')

  // Form de adicionar adicional ao item
  const [targetItemIndex, setTargetItemIndex] = useState(0)
  const [selectedCatalogCompName, setSelectedCatalogCompName] = useState('')
  const [newCompName, setNewCompName] = useState('')
  const [newCompPrice, setNewCompPrice] = useState('')

  const handleOpenEditModal = (order: Order) => {
    setEditingOrder(order)
    setEditableItems(order.itemsDetail.map(it => ({
      ...it,
      complements: it.complements ? it.complements.map(c => ({ ...c })) : []
    })))
    setSelectedCatalogProdId('')
    setNewItemName('')
    setNewItemQty(1)
    setNewItemPrice('')
    setNewItemDetails('')
    setTargetItemIndex(0)
    setSelectedCatalogCompName('')
    setNewCompName('')
    setNewCompPrice('')
    setIsEditModalOpen(true)
  }

  const handleSelectCatalogProduct = (prodId: string) => {
    setSelectedCatalogProdId(prodId)
    if (!prodId || prodId === 'custom') {
      setNewItemName('')
      setNewItemPrice('')
      return
    }
    const found = catalogProducts.find(p => p.id === prodId)
    if (found) {
      setNewItemName(found.name)
      setNewItemPrice((found.priceCents / 100).toFixed(2).replace('.', ','))
    }
  }

  const handleSelectCatalogComplement = (compName: string) => {
    setSelectedCatalogCompName(compName)
    if (!compName || compName === 'custom') {
      setNewCompName('')
      setNewCompPrice('')
      return
    }
    const found = allDistinctComplements.find(c => c.name === compName)
    if (found) {
      setNewCompName(found.name)
      setNewCompPrice((found.priceCents / 100).toFixed(2).replace('.', ','))
    }
  }

  const handleRemoveItem = (index: number) => {
    setEditableItems(prev => prev.filter((_, i) => i !== index))
    setTargetItemIndex(prev => Math.max(0, Math.min(prev, editableItems.length - 2)))
  }

  const handleUpdateItemQty = (index: number, delta: number) => {
    setEditableItems(prev => prev.map((item, i) => {
      if (i === index) {
        const newQty = Math.max(1, item.qty + delta)
        return { ...item, qty: newQty }
      }
      return item
    }))
  }

  const handleAddNewItem = () => {
    if (!newItemName.trim()) return
    const priceNum = parseFloat(newItemPrice.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.')) || 0
    const formattedPrice = `R$ ${priceNum.toFixed(2).replace('.', ',')}`
    
    setEditableItems(prev => [
      ...prev,
      {
        qty: Math.max(1, newItemQty),
        name: newItemName.trim(),
        price: formattedPrice,
        details: newItemDetails.trim() || undefined,
        complements: []
      }
    ])
    setSelectedCatalogProdId('')
    setNewItemName('')
    setNewItemQty(1)
    setNewItemPrice('')
    setNewItemDetails('')
  }

  const handleAddComplementToItem = () => {
    if (!newCompName.trim() || targetItemIndex < 0 || targetItemIndex >= editableItems.length) return
    const priceNum = parseFloat(newCompPrice.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.')) || 0
    const formattedPrice = `R$ ${priceNum.toFixed(2).replace('.', ',')}`
    const priceCents = Math.round(priceNum * 100)

    setEditableItems(prev => prev.map((item, idx) => {
      if (idx !== targetItemIndex) return item
      const prevComps = item.complements || []
      return {
        ...item,
        complements: [
          ...prevComps,
          { name: newCompName.trim(), price: formattedPrice, priceCents }
        ]
      }
    }))

    setSelectedCatalogCompName('')
    setNewCompName('')
    setNewCompPrice('')
  }

  const handleRemoveComplementFromItem = (itemIdx: number, compIdx: number) => {
    setEditableItems(prev => prev.map((item, idx) => {
      if (idx !== itemIdx) return item
      return {
        ...item,
        complements: (item.complements || []).filter((_, ci) => ci !== compIdx)
      }
    }))
  }

  const calculatedTotal = useMemo(() => {
    const sum = editableItems.reduce((acc, item) => {
      const itemPriceNum = parseFloat(item.price.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.')) || 0
      const compsSum = (item.complements || []).reduce((cAcc, c) => {
        const cPrice = parseFloat(c.price.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.')) || 0
        return cAcc + cPrice
      }, 0)
      return acc + ((itemPriceNum + compsSum) * item.qty)
    }, 0)
    return `R$ ${sum.toFixed(2).replace('.', ',')}`
  }, [editableItems])

  const handleSaveEditedOrder = async () => {
    if (!editingOrder) return
    if (editableItems.length === 0) {
      alert('O pedido deve conter pelo menos um item.')
      return
    }

    const totalQty = editableItems.reduce((acc, it) => acc + it.qty, 0)
    const newItemsDesc = `${editableItems.length} ${editableItems.length === 1 ? 'item' : 'itens'}`

    // Optimistic UI update
    setOrders(prev => prev.map(o => {
      if (o.id === editingOrder.id) {
        return {
          ...o,
          itemsDetail: editableItems,
          itemsCount: totalQty,
          itemsDesc: newItemsDesc,
          total: calculatedTotal
        }
      }
      return o
    }))

    setIsEditModalOpen(false)

    // Map items to database payload with complements
    const mappedItems = editableItems.map(it => {
      const priceNum = parseFloat(
        it.price.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
      ) || 0
      return {
        name: it.name,
        qty: it.qty,
        unitPriceCents: Math.round(priceNum * 100),
        details: it.details,
        complements: (it.complements || []).map(c => {
          const cPrice = parseFloat(
            c.price.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
          ) || 0
          return {
            name: c.name,
            price_cents: Math.round(cPrice * 100)
          }
        })
      }
    })

    const targetDbId = editingOrder.dbId || editingOrder.id
    setEditingOrder(null)

    try {
      await updateOrderItemsAction(targetDbId, mappedItems)
    } catch (err) {
      console.error('Falha ao salvar itens no Supabase:', err)
      alert('Erro ao salvar as alterações no banco de dados.')
    }
  }

  type SortField = 'id' | 'client' | 'time' | 'type' | 'total' | 'status'
  type SortDirection = 'asc' | 'desc'

  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // Dynamic items per page ensuring zero vertical scrollbars and filling table down to pagination
  const [itemsPerPage, setItemsPerPage] = useState(14)

  // Mobile filter scroll state to render visible indicator bar
  const filterScrollRef = React.useRef<HTMLDivElement>(null)
  const tableAreaRef = React.useRef<HTMLDivElement>(null)
  const [filterScroll, setFilterScroll] = useState({ scrollLeft: 0, clientWidth: 0, scrollWidth: 0 })

  const updateFilterScroll = () => {
    if (!filterScrollRef.current) return
    const { scrollLeft, clientWidth, scrollWidth } = filterScrollRef.current
    setFilterScroll({ scrollLeft, clientWidth, scrollWidth })
  }

  useEffect(() => {
    updateFilterScroll()
    window.addEventListener('resize', updateFilterScroll)
    return () => window.removeEventListener('resize', updateFilterScroll)
  }, [])

  useEffect(() => {
    const calculateItemsPerPage = () => {
      if (typeof window === 'undefined') return
      const w = window.innerWidth
      const h = window.innerHeight

      if (w < 640) {
        // Mobile screens: use actual rendered container height if mounted, otherwise fallback to window height
        const containerH = tableAreaRef.current?.clientHeight || (h - 330)
        // Each mobile row with padding and metadata is ~63px; thead is ~37px
        const availableForRows = containerH - 37
        const calculatedRows = Math.floor(availableForRows / 63)
        setItemsPerPage(Math.max(4, Math.min(10, calculatedRows)))
      } else if (w < 1024) {
        // Tablets / small laptops
        if (h < 800) {
          setItemsPerPage(6)
        } else {
          setItemsPerPage(8)
        }
      } else {
        // Desktop / large screens: dynamic calculation based on container height and row size (~59px)
        const availableHeight = h - 195
        const calculatedRows = Math.floor((availableHeight - 37) / 59)
        setItemsPerPage(Math.max(6, Math.min(20, calculatedRows)))
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

    if (!sortField) {
      // Ordem de chegada estável (mais recentes primeiro por número do pedido)
      return [...list].sort((a, b) => {
        const numA = parseInt(a.id.replace(/\D/g, ''), 10) || 0
        const numB = parseInt(b.id.replace(/\D/g, ''), 10) || 0
        return numB - numA
      })
    }

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
  const handleAcceptOrder = async (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const target = orders.find(o => o.id === orderId || o.dbId === orderId)
    if (!target) return

    setOrders(prev =>
      prev.map(o => (o.id === target.id ? { ...o, status: 'Em preparo', isUrgent: false } : o))
    )

    try {
      await updateOrderStatusAction(target.dbId || target.id, 'Em preparo')
    } catch (err) {
      console.error('Falha ao aceitar pedido no Supabase:', err)
    }
  }

  // Handle Advance Status
  const handleAdvanceStatus = async (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const target = orders.find(o => o.id === orderId || o.dbId === orderId)
    if (!target) return

    let nextStatus: OrderStatus = 'Em preparo'
    if (target.status === 'Novo') nextStatus = 'Em preparo'
    else if (target.status === 'Em preparo') nextStatus = 'Pronto'
    else if (target.status === 'Pronto') {
      nextStatus = target.type === 'Retirada' ? 'Concluído' : 'Em entrega'
    } else if (target.status === 'Em entrega') {
      nextStatus = 'Concluído'
    } else {
      return
    }

    setOrders(prev =>
      prev.map(o => (o.id === target.id ? { ...o, status: nextStatus, isUrgent: false } : o))
    )

    try {
      await updateOrderStatusAction(target.dbId || target.id, nextStatus)
    } catch (err) {
      console.error('Falha ao avançar status no Supabase:', err)
    }
  }

  // Handle Cancel Order (Abre modal estilizado DeliPlus)
  const handleCancelOrder = (orderId: string) => {
    const target = orders.find(o => o.id === orderId || o.dbId === orderId)
    if (!target) return
    setOrderToCancel(target)
  }

  // Confirmar cancelamento no Modal DeliPlus e persistir no Supabase
  const handleConfirmCancelOrder = async () => {
    if (!orderToCancel) return
    setIsCanceling(true)
    const target = orderToCancel
    const targetDbId = target.dbId || target.id

    // Atualização otimista na interface
    setOrders(prev =>
      prev.map(o => (o.id === target.id || o.dbId === target.id ? { ...o, status: 'Cancelado' } : o))
    )

    try {
      await cancelOrderAction(targetDbId)
    } catch (err) {
      console.error('Falha ao cancelar pedido no Supabase:', err)
    } finally {
      setIsCanceling(false)
      setOrderToCancel(null)
    }
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
          "flex-1 flex flex-col w-full h-full max-h-full px-3.5 sm:px-4 md:px-5 pt-3 md:pt-3.5 pb-3 max-lg:pb-[84px] overflow-hidden justify-between font-sans transition-all min-w-0"
        )}
      >
        {/* Page Header (Orange title matching DeliPlus logo & Estoque/Cardápio) */}
        <div className="flex flex-col mb-2 sm:mb-2.5 shrink-0">
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
          <p className="text-[#2E4233] text-sm md:text-base font-medium mt-0.5">
            Acompanhe e gerencie em tempo real os pedidos de delivery e retirada.
          </p>
        </div>

        {/* Workspace: Table Column + Desktop Order Details Drawer */}
        <div className="flex-1 min-h-0 flex gap-3.5 md:gap-4 overflow-hidden">
          {/* Left Column: Controls + Orders Table Container */}
          <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
            {/* Controls Row: Filters & Search (Aligned directly above the Table) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 mb-2.5 shrink-0 z-30 relative bg-white/40 sm:bg-transparent p-1.5 sm:p-0 rounded-2xl">
              <div className="w-full sm:w-auto flex flex-col">
                <div 
                  ref={filterScrollRef}
                  onScroll={updateFilterScroll}
                  className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1 sm:pb-0 relative flex-nowrap"
                >
                  {/* Grupo 1: Fases de Preparo / Produção (Cozinha) */}
                  <div className="flex items-center gap-1 bg-[#F3EFE3]/80 p-0.5 rounded-full border border-[#E9E4D4] shrink-0 shadow-2xs">
                    {KITCHEN_STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setStatusFilter(option.value)
                          setCurrentPage(1)
                        }}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0",
                          statusFilter === option.value
                            ? "bg-[#2E4233] text-white shadow-xs"
                            : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {/* Separador vertical nítido entre os dois grupos */}
                  <div className="h-5 w-px bg-[#D6D0BC] shrink-0 mx-0.5 hidden sm:block" />

                  {/* Grupo 2: Modalidade e Data */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Delivery Modality Select */}
                    <div className="relative inline-block shrink-0">
                      <select
                        value={typeFilter}
                        onChange={(e) => {
                          setTypeFilter(e.target.value as 'Todos' | 'Delivery' | 'Retirada')
                          setCurrentPage(1)
                        }}
                        className="appearance-none bg-white border border-[#E9E4D4] rounded-full pl-2.5 pr-6 py-1 text-xs font-semibold text-gray-600 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A2B]/20 transition-all shadow-xs cursor-pointer"
                      >
                        <option value="Todos">Modalidade</option>
                        <option value="Delivery">Delivery</option>
                        <option value="Retirada">Retirada</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Date Selector */}
                    <div className="relative inline-block shrink-0">
                      <select
                        value={dateFilter}
                        onChange={(e) => {
                          setDateFilter(e.target.value)
                          setCurrentPage(1)
                        }}
                        className="appearance-none bg-white border border-[#E9E4D4] rounded-full pl-5.5 pr-5 py-1 text-xs font-semibold text-gray-600 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A2B]/20 transition-all shadow-xs cursor-pointer"
                      >
                        <option value="Hoje">Hoje</option>
                        <option value="Ontem">Ontem</option>
                        <option value="Últimos 7 dias">7 dias</option>
                        <option value="Este mês">Este mês</option>
                      </select>
                      <Calendar className="w-3 h-3 text-gray-400 absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <ChevronDown className="w-3 h-3 text-gray-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Barra de rolagem visível no mobile para sinalizar opções ocultas */}
                <div className="w-full h-1 bg-[#FAF8F0] border border-[#E9E4D4]/80 rounded-full overflow-hidden sm:hidden mt-1">
                  {(() => {
                    const hasOverflow = filterScroll.scrollWidth > filterScroll.clientWidth && filterScroll.clientWidth > 0
                    const thumbWidth = hasOverflow ? Math.max(25, (filterScroll.clientWidth / filterScroll.scrollWidth) * 100) : 40
                    const maxScroll = filterScroll.scrollWidth - filterScroll.clientWidth
                    const fraction = maxScroll > 0 ? Math.min(1, Math.max(0, filterScroll.scrollLeft / maxScroll)) : 0
                    const offsetLeft = fraction * (100 - thumbWidth)
                    return (
                      <div
                        className="h-full bg-[#CB5A3C] rounded-full transition-all duration-75"
                        style={{
                          width: `${thumbWidth}%`,
                          marginLeft: `${offsetLeft}%`
                        }}
                      />
                    )
                  })()}
                </div>
              </div>

              {/* Search Bar (Cardápio pattern: compact, aligned with right edge of table) */}
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <div className="relative w-full sm:w-[155px]">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder="Buscar pedido..."
                    className="w-full pl-7 pr-6 py-1 bg-white border border-[#E9E4D4] rounded-xl text-xs text-[#1C2C22] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A2B]/20 focus:border-[#1E3A2B] transition-all shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('')
                        setCurrentPage(1)
                      }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Orders Table Container */}
            <div className="bg-white rounded-2xl border border-[#E9E4D4] shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col justify-between">
          <div ref={tableAreaRef} className="overflow-x-auto overflow-y-hidden flex-1">
            <table className="w-full h-full min-h-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E9E4D4] bg-[#FAF8F0]/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th
                    onClick={() => handleSort('id')}
                    className={cn(
                      "py-2.5 pl-3.5 sm:pl-4 pr-1 whitespace-nowrap cursor-pointer select-none group transition-colors",
                      sortField === 'id' ? "text-[#CB5A3C]" : "hover:text-[#1C2C22]"
                    )}
                    title="Organizar por número do pedido"
                  >
                    <div className="inline-flex items-center gap-1">
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
                      "py-2.5 px-1.5 whitespace-nowrap cursor-pointer select-none group transition-colors",
                      sortField === 'client' ? "text-[#CB5A3C]" : "hover:text-[#1C2C22]"
                    )}
                    title="Organizar por nome do cliente"
                  >
                    <div className="inline-flex items-center gap-1">
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
                      "py-2.5 px-1.5 whitespace-nowrap cursor-pointer select-none group transition-colors",
                      sortField === 'time' ? "text-[#CB5A3C]" : "hover:text-[#1C2C22]"
                    )}
                    title="Organizar por horário"
                  >
                    <div className="inline-flex items-center gap-1">
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
                      "py-2.5 px-1.5 whitespace-nowrap cursor-pointer select-none group transition-colors",
                      sortField === 'type' ? "text-[#CB5A3C]" : "hover:text-[#1C2C22]"
                    )}
                    title="Organizar por tipo (Delivery / Retirada)"
                  >
                    <div className="inline-flex items-center gap-1">
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
                      "py-2.5 px-1.5 whitespace-nowrap cursor-pointer select-none group transition-colors",
                      sortField === 'total' ? "text-[#CB5A3C]" : "hover:text-[#1C2C22]"
                    )}
                    title="Organizar por valor total"
                  >
                    <div className="inline-flex items-center gap-1">
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
                      "py-2.5 px-1 text-center whitespace-nowrap cursor-pointer select-none group transition-colors",
                      sortField === 'status' ? "text-[#CB5A3C]" : "hover:text-[#1C2C22]"
                    )}
                    title="Organizar por status (agrupar iguais)"
                  >
                    <div className="inline-flex items-center justify-center gap-1">
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
                  <th className="py-2.5 px-1.5 text-center whitespace-nowrap select-none font-bold">
                    Ação rápida
                  </th>
                  <th className="py-2.5 px-1.5 text-center whitespace-nowrap select-none font-bold">
                    Imprimir
                  </th>
                  <th className="py-2.5 pr-3 pl-1 w-6 select-none"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E4D4]/60">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-500 text-sm">
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
                    const isConcluido = order.status === 'Concluído'
                    const isCancelado = order.status === 'Cancelado'

                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrderId(order.id)}
                        title="Clique para ver os detalhes deste pedido"
                        className={cn(
                          "cursor-pointer transition-colors relative group select-none",
                          isSelected
                            ? isCancelado
                              ? "bg-[#FEE2E2] shadow-[inset_3px_0_0_0_#DC2626]"
                              : isConcluido
                                ? "bg-[#D1FAE5] shadow-[inset_3px_0_0_0_#059669]"
                                : "bg-[#FAF5E9] shadow-[inset_3px_0_0_0_#CB5A3C]"
                            : isCancelado
                              ? "bg-[#FEE2E2]/90 hover:bg-[#FECACA]/80"
                              : isConcluido
                                ? "bg-[#D1FAE5]/90 hover:bg-[#A7F3D0]/80"
                                : "hover:bg-[#FAF8F0]/70"
                        )}
                      >
                        {/* Order ID with Urgent Stripe */}
                        <td className="py-2 pl-3.5 sm:pl-4 pr-1 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {isNovo && (
                              <span className="w-1.5 h-5 rounded-full bg-[#CB5A3C] shrink-0" />
                            )}
                            <div>
                              <span
                                className={cn(
                                  "font-bold text-[13px] transition-colors",
                                  isSelected ? "text-[#CB5A3C]" : "text-[#1C2C22] group-hover:text-[#CB5A3C]"
                                )}
                              >
                                {order.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Cliente */}
                        <td className="py-2 px-1.5 whitespace-nowrap">
                          <div className="font-semibold text-xs text-[#1C2C22] leading-tight mb-1">
                            {order.client}
                          </div>
                          <a
                            href={getWhatsAppUrl(order, storeName)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 bg-[#25D366] hover:bg-[#20bd5a] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-2xs transition-all cursor-pointer shrink-0"
                            title={`Conversar com ${order.client} no WhatsApp (${order.phone})`}
                          >
                            <WhatsAppIcon className="w-3 h-3 fill-white text-white shrink-0" />
                            <span>WhatsApp</span>
                          </a>
                        </td>

                        {/* Horário */}
                        <td className="py-2 px-1.5 whitespace-nowrap">
                          <div className="text-xs font-medium text-[#1C2C22]">{order.time}</div>
                          <div className="text-[10px] text-gray-400">{order.date}</div>
                        </td>

                        {/* Tipo */}
                        <td className="py-2 px-1.5 whitespace-nowrap">
                          {order.type === 'Delivery' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200/60">
                              Delivery
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
                              Retirada
                            </span>
                          )}
                        </td>

                        {/* Total */}
                        <td className="py-2 px-1.5 whitespace-nowrap">
                          <div className="text-sm font-bold text-[#1C2C22] leading-tight">{order.total}</div>
                          <div className="text-[10px] text-gray-600 font-medium mt-0.5 leading-tight truncate max-w-[110px]" title={order.paymentMethod}>
                            {order.paymentMethod}
                          </div>
                          {order.paymentMethod === 'Em Dinheiro' && order.changeFor && (
                            <div className="text-[10px] text-amber-800 font-semibold mt-0.5 leading-tight">
                              {order.changeFor}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-2 px-1 text-center whitespace-nowrap">
                          {isNovo && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF2EE] text-[#CB5A3C] border border-[#FADCD5]">
                              Novo
                            </span>
                          )}
                          {isPreparo && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                              Em preparo
                            </span>
                          )}
                          {isPronto && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
                              {order.type === 'Retirada' ? 'Pronto p/ retirar' : 'Pronto'}
                            </span>
                          )}
                          {isEntrega && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]">
                              Em entrega
                            </span>
                          )}
                          {order.status === 'Concluído' && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                              Concluído
                            </span>
                          )}
                          {order.status === 'Cancelado' && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]">
                              Cancelado
                            </span>
                          )}
                        </td>

                        {/* Ação rápida */}
                        <td className="py-2 px-1.5 text-center whitespace-nowrap">
                          {isNovo && (
                            <button
                              type="button"
                              onClick={(e) => handleAcceptOrder(order.id, e)}
                              className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#CB5A3C] hover:bg-[#B34B30] text-white shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
                              title="Aceitar pedido e iniciar preparo"
                            >
                              <span>Aceitar</span>
                            </button>
                          )}
                          {isPreparo && (
                            <button
                              type="button"
                              onClick={(e) => handleAdvanceStatus(order.id, e)}
                              className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#1E3A2B] hover:bg-[#162B20] text-white shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
                              title={order.type === 'Retirada' ? "Marcar como pronto para retirada no balcão" : "Marcar como pronto para entrega"}
                            >
                              <span>Pronto</span>
                            </button>
                          )}
                          {isPronto && (
                            order.type === 'Retirada' ? (
                              <button
                                type="button"
                                onClick={(e) => handleAdvanceStatus(order.id, e)}
                                className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-800 hover:bg-black text-white shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
                                title="Concluir retirada do cliente"
                              >
                                <span>Concluir</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => handleAdvanceStatus(order.id, e)}
                                className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
                                title="Marcar como em rota de entrega"
                              >
                                <span>Em rota</span>
                              </button>
                            )
                          )}
                          {isEntrega && (
                            <button
                              type="button"
                              onClick={(e) => handleAdvanceStatus(order.id, e)}
                              className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-800 hover:bg-black text-white shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
                              title="Confirmar entrega e concluir pedido"
                            >
                              <span>Concluir</span>
                            </button>
                          )}
                          {order.status === 'Concluído' && (
                            <span className="inline-flex items-center justify-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
                              <span>Finalizado</span>
                            </span>
                          )}
                          {order.status === 'Cancelado' && (
                            <span className="inline-flex items-center justify-center text-[11px] font-semibold text-[#DC2626] bg-[#FEF2F2] px-2 py-0.5 rounded-md border border-[#FCA5A5]/60">
                              <span>Cancelado</span>
                            </span>
                          )}
                        </td>

                        {/* Imprimir */}
                        <td className="py-2 px-1.5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => handleOpenPrint(order, e)}
                            className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold text-[#1C2C22] bg-[#FAF8F0] hover:bg-[#F3EEDD] border border-[#E9E4D4] hover:border-[#2E4233]/40 shadow-2xs hover:shadow-xs transition-all cursor-pointer group/print active:scale-95"
                            title="Imprimir comanda térmica 80mm"
                          >
                            <span className="font-semibold text-[11px]">Imprimir</span>
                          </button>
                        </td>

                        {/* Indicador de linha selecionada */}
                        <td className="py-2 pr-3 pl-1 text-right whitespace-nowrap">
                          <div
                            className={cn(
                              "w-5 h-5 rounded-md flex items-center justify-center transition-all ml-auto",
                              isSelected
                                ? "bg-[#CB5A3C] text-white shadow-xs"
                                : "text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5"
                            )}
                            title={isSelected ? "Pedido aberto" : "Clique para ver detalhes"}
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}

                {/* Linhas vazias para manter a grade alinhada perfeitamente até a paginação */}
                {filteredOrders.length > 0 &&
                  Array.from({ length: Math.max(0, itemsPerPage - paginatedOrders.length) }).map((_, idx) => (
                    <tr
                      key={`empty-slot-${idx}`}
                      className="border-b border-[#E9E4D4]/40 h-[46px] select-none pointer-events-none"
                    >
                      <td className="py-2.5 pl-3.5 sm:pl-4 pr-1"><span className="text-xs text-gray-200 font-medium">—</span></td>
                      <td className="py-2.5 px-1.5"><span className="text-xs text-gray-200 font-medium">—</span></td>
                      <td className="py-2.5 px-1.5"><span className="text-xs text-gray-200 font-medium">—</span></td>
                      <td className="py-2.5 px-1.5"><span className="text-xs text-gray-200 font-medium">—</span></td>
                      <td className="py-2.5 px-1.5"><span className="text-xs text-gray-200 font-medium">—</span></td>
                      <td className="py-2.5 px-1 text-center"><span className="text-xs text-gray-200 font-medium">—</span></td>
                      <td className="py-2.5 px-1.5 text-center"><span className="text-xs text-gray-200 font-medium">—</span></td>
                      <td className="py-2.5 px-1.5 text-center"><span className="text-xs text-gray-200 font-medium">—</span></td>
                      <td className="py-2.5 pr-3 pl-1 w-6"></td>
                    </tr>
                  ))}
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

      {/* Right Drawer / Order Details Panel Column */}
      <div
        className={cn(
          "flex-col shrink-0 lg:w-[340px] xl:w-[370px] lg:h-full",
          selectedOrderId ? "flex" : "hidden lg:flex"
        )}
      >
        {/* Desktop Top Spacer to align Drawer card top edge exactly with Table card top edge */}
        <div className="h-[30px] mb-2.5 shrink-0 hidden lg:block" aria-hidden="true" />

        <aside
          className={cn(
            "bg-white rounded-2xl border border-[#E9E4D4] shadow-sm flex flex-col overflow-hidden flex-1 min-h-0",
            // Mobile / Tablet: modal drawer overlay when an order is selected
            selectedOrderId && "max-lg:fixed max-lg:inset-y-0 max-lg:right-0 max-lg:w-full sm:max-lg:w-[420px] max-lg:z-50 max-lg:shadow-2xl max-lg:flex max-lg:rounded-none max-lg:animate-in max-lg:slide-in-from-right max-lg:duration-200"
          )}
        >
          {activeOrder ? (
            <>
              {/* Drawer Header (Aligned with Table Container header) */}
              <div className="px-4 py-2.5 sm:px-5 sm:py-3 border-b border-[#E9E4D4] bg-[#FAF8F0]/80 flex items-center justify-between shrink-0 min-h-[48px]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-serif font-bold text-[#1C2C22] leading-none">
                      Pedido {activeOrder.id}
                    </h2>
                    {activeOrder.status === 'Novo' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF2EE] text-[#CB5A3C] border border-[#FADCD5]">
                        Novo
                      </span>
                    )}
                    {activeOrder.status === 'Em preparo' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                        Em preparo
                      </span>
                    )}
                    {activeOrder.status === 'Pronto' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
                        {activeOrder.type === 'Retirada' ? 'Pronto p/ retirar' : 'Pronto'}
                      </span>
                    )}
                    {activeOrder.status === 'Em entrega' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]">
                        Em entrega
                      </span>
                    )}
                    {activeOrder.status === 'Concluído' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#F3F4F6] text-gray-700 border border-gray-300">
                        Concluído
                      </span>
                    )}
                    {activeOrder.status === 'Cancelado' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]">
                        Cancelado
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium mt-1">
                    Recebido às {activeOrder.time} • {activeOrder.date}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedOrderId(null)}
                  aria-label="Fechar"
                  title="Fechar detalhes"
                  className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer shrink-0 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {/* Section: Cliente */}
              <div>
                <h3 className="text-xs font-bold text-[#1C2C22] uppercase tracking-wider mb-1.5">
                  Cliente
                </h3>
                <div className="bg-[#FAF8F0]/60 border border-[#E9E4D4] rounded-xl p-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-[#1C2C22]">{activeOrder.client}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{activeOrder.phone}</div>
                  </div>
                  <a
                    href={getWhatsAppUrl(activeOrder, storeName)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    <WhatsAppIcon className="w-4 h-4 fill-white text-white shrink-0" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Section: Modalidade de Entrega */}
              <div>
                <h3 className="text-xs font-bold text-[#1C2C22] uppercase tracking-wider mb-1.5">
                  {activeOrder.type === 'Delivery' ? (
                    <>
                      ENTREGA <span className="text-[#CB5A3C]">(DELIVERY)</span>
                    </>
                  ) : (
                    <>
                      RETIRADA <span className="text-[#CB5A3C]">(NO BALCÃO)</span>
                    </>
                  )}
                </h3>
                <div className="bg-[#FAF8F0]/60 border border-[#E9E4D4] rounded-xl p-2.5">
                  <div className="font-semibold text-xs text-[#1C2C22] mb-0.5">
                    {activeOrder.type === 'Delivery' ? 'Endereço de entrega' : 'Local de retirada'}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{activeOrder.address}</p>
                </div>
              </div>

              {/* Section: Itens do pedido */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-xs font-bold text-[#1C2C22] uppercase tracking-wider">
                    Itens do pedido ({activeOrder.itemsDetail.length})
                  </h3>
                  {activeOrder.status !== 'Concluído' && (
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(activeOrder)}
                      className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-[#CB5A3C] hover:bg-[#B34B30] transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                      title="Adicionar ou excluir itens deste pedido"
                    >
                      <span>Editar pedido</span>
                    </button>
                  )}
                </div>

                {(() => {
                  const DRAWER_ITEMS_PER_PAGE = 3
                  const totalDrawerPages = Math.max(1, Math.ceil(activeOrder.itemsDetail.length / DRAWER_ITEMS_PER_PAGE))
                  const safeDrawerPage = Math.min(Math.max(1, drawerItemPage), totalDrawerPages)
                  const visibleItems = activeOrder.itemsDetail.slice(
                    (safeDrawerPage - 1) * DRAWER_ITEMS_PER_PAGE,
                    safeDrawerPage * DRAWER_ITEMS_PER_PAGE
                  )

                  return (
                    <>
                      <div className="space-y-2">
                        {visibleItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl border border-[#E9E4D4] bg-white flex items-start gap-2.5 shadow-xs"
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
                              {/* Adicionais integrados ao prato, visualmente separados */}
                              {item.complements && item.complements.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-[#E9E4D4]/70 flex flex-col gap-1">
                                  <span className="text-[10px] font-bold text-[#CB5A3C] uppercase tracking-wider flex items-center gap-1">
                                    <span>+ Adicionais ({item.complements.length}):</span>
                                  </span>
                                  <div className="flex flex-col gap-1">
                                    {item.complements.map((comp, cIdx) => (
                                      <div
                                        key={cIdx}
                                        className="flex items-center justify-between text-[11px] bg-[#FAF8F0] px-2.5 py-1 rounded-lg border border-[#E9E4D4]/60"
                                      >
                                        <span className="font-semibold text-[#1C2C22]">
                                          + {comp.name}
                                        </span>
                                        <span className="font-bold text-[#CB5A3C]">
                                          {comp.price}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination (3 em 3 itens, só se tiver mais de 3 itens) */}
                      {activeOrder.itemsDetail.length > 3 && (
                        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#E9E4D4]/60">
                          <span className="text-[11px] text-gray-500 font-medium">
                            Pág. {safeDrawerPage} de {totalDrawerPages} ({activeOrder.itemsDetail.length} itens)
                          </span>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalDrawerPages }).map((_, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setDrawerItemPage(idx + 1)}
                                className={cn(
                                  "w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center transition-colors cursor-pointer",
                                  safeDrawerPage === idx + 1
                                    ? "bg-[#CB5A3C] text-white shadow-2xs"
                                    : "bg-white text-gray-600 hover:bg-gray-100 border border-[#E9E4D4]"
                                )}
                              >
                                {idx + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>

              {/* Section: Observações */}
              {activeOrder.obs && (
                <div>
                  <h3 className="text-xs font-bold text-[#1C2C22] uppercase tracking-wider mb-1.5">
                    Observações do Cliente
                  </h3>
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 text-xs text-amber-900 leading-relaxed font-medium">
                    {activeOrder.obs}
                  </div>
                </div>
              )}

              {/* Section: Pagamento */}
              <div>
                <h3 className="text-xs font-bold text-[#1C2C22] uppercase tracking-wider mb-1.5">
                  Pagamento
                </h3>
                <div className="bg-[#FAF8F0]/60 border border-[#E9E4D4] rounded-xl p-2.5 flex items-center justify-between text-xs">
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

            {/* Drawer Bottom Actions: Apenas Cancelar Pedido conforme solicitado */}
            {activeOrder.status !== 'Concluído' && activeOrder.status !== 'Cancelado' && (
              <div className="p-3 bg-[#FAF8F0]/80 border-t border-[#E9E4D4] shrink-0">
                <button
                  type="button"
                  onClick={() => handleCancelOrder(activeOrder.id)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer text-center active:scale-95"
                >
                  Cancelar pedido
                </button>
              </div>
            )}
            {activeOrder.status === 'Cancelado' && (
              <div className="p-3 bg-[#FEF2F2] border-t border-[#FCA5A5]/60 shrink-0 text-center">
                <span className="text-xs font-bold text-[#DC2626]">Pedido Cancelado</span>
              </div>
            )}
          </>
        ) : (
          /* Centered Empty State when no order is selected */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-white">
            <div className="w-16 h-16 rounded-2xl bg-[#FAF8F0] border border-[#E9E4D4] flex items-center justify-center text-[#2E4233] mb-4 shadow-xs">
              <ClipboardList className="w-8 h-8 text-[#CB5A3C]" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1C2C22] mb-1.5">
              Nenhum pedido selecionado
            </h3>
            <p className="text-xs text-gray-500 max-w-[240px] leading-relaxed">
              Selecione um pedido na tabela ao lado para visualizar os itens, endereço, observações e dados do cliente.
            </p>
          </div>
        )}
      </aside>
    </div>
  </div>
</div>

  {/* Mobile Drawer Backdrop */}
  {selectedOrderId && (
    <div
      onClick={() => setSelectedOrderId(null)}
      className="fixed inset-0 bg-black/40 z-40 lg:hidden animate-in fade-in duration-200"
    />
  )}

  {/* Modal de Cancelamento de Pedido estilizado no padrão DeliPlus */}
  {orderToCancel && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-[#E9E4D4] animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 bg-[#FAF8F0] border-b border-[#E9E4D4] flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-[#1C2C22]">
            Cancelar Pedido {orderToCancel.id}
          </h3>
          <button
            type="button"
            onClick={() => setOrderToCancel(null)}
            className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-[#E9E4D4]/60 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 flex flex-col gap-3 bg-white">
          <p className="text-sm font-semibold text-[#1C2C22]">
            Tem certeza que deseja cancelar este pedido?
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Esta ação alterará o status do pedido para <strong className="text-red-600 font-bold">Cancelado</strong> no sistema e no banco de dados. Esta alteração não pode ser desfeita.
          </p>

          <div className="bg-[#FAF8F0] border border-[#E9E4D4] rounded-xl p-3 flex flex-col gap-1.5 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Cliente:</span>
              <span className="font-semibold text-[#1C2C22]">{orderToCancel.client}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Modalidade:</span>
              <span className="font-semibold text-[#1C2C22]">{orderToCancel.type}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Valor Total:</span>
              <span className="font-bold text-[#CB5A3C]">{orderToCancel.total}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#FAF8F0] border-t border-[#E9E4D4] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setOrderToCancel(null)}
            disabled={isCanceling}
            className="py-2 px-3.5 rounded-xl text-xs font-bold text-[#1C2C22] bg-white border border-[#E9E4D4] hover:bg-[#F3EEDD] shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleConfirmCancelOrder}
            disabled={isCanceling}
            className="py-2 px-3.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isCanceling ? 'Cancelando...' : 'Confirmar cancelamento'}
          </button>
        </div>
      </div>
    </div>
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
                      {it.complements && it.complements.map((c, ci) => (
                        <div key={ci} className="text-[10px] text-gray-700 pl-2 font-medium flex justify-between">
                          <span>+ {c.name}</span>
                          <span>{c.price}</span>
                        </div>
                      ))}
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

      {/* Edit Order Items Modal */}
      {isEditModalOpen && editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-[#E9E4D4]">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-[#FAF8F0] border-b border-[#E9E4D4] flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1C2C22] leading-none">
                  Editar Itens do Pedido {editingOrder.id}
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Adicione novos produtos ou exclua itens existentes do pedido.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-gray-200/60 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* List of current items */}
              <div>
                <label className="text-xs font-bold text-[#1C2C22] uppercase tracking-wider block mb-2">
                  Itens no Pedido ({editableItems.length})
                </label>
                {editableItems.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-gray-300 text-center text-xs text-gray-500 bg-[#FAF8F0]/40">
                    Nenhum item restante no pedido. Adicione itens abaixo antes de salvar.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {editableItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-[#E9E4D4] bg-[#FAF8F0]/30 flex flex-col gap-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs text-[#1C2C22] truncate">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-gray-500 font-medium">
                              {item.price} cada
                            </div>
                          </div>

                          {/* Quantity Stepper */}
                          <div className="flex items-center gap-1 bg-white border border-[#E9E4D4] rounded-lg p-0.5 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQty(idx, -1)}
                              className="w-6 h-6 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-black cursor-pointer text-xs"
                              title="Diminuir quantidade"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-[#1C2C22]">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQty(idx, 1)}
                              className="w-6 h-6 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-black cursor-pointer text-xs"
                              title="Aumentar quantidade"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Remove / Excluir Button */}
                          <button
                            type="button"
                            onClick={() => setItemToDeleteFromOrder({ index: idx, name: item.name })}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer shrink-0"
                            title="Excluir este item do pedido"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Complements of this item */}
                        {item.complements && item.complements.length > 0 && (
                          <div className="pt-2 border-t border-[#E9E4D4]/60 flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mr-1">
                              Adicionais:
                            </span>
                            {item.complements.map((comp, cIdx) => (
                              <span
                                key={cIdx}
                                className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200/80 px-2 py-0.5 rounded-md"
                              >
                                <span>+ {comp.name} ({comp.price})</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveComplementFromItem(idx, cIdx)}
                                  className="text-amber-700 hover:text-red-600 transition-colors cursor-pointer"
                                  title="Remover adicional"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Item Section */}
              <div className="p-3.5 rounded-xl border border-[#E9E4D4] bg-[#FAF8F0]/50 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C2C22] uppercase tracking-wider">
                  <Plus className="w-3.5 h-3.5 text-[#CB5A3C]" />
                  <span>Adicionar Produto ao Pedido</span>
                </div>

                <div className="space-y-2">
                  <select
                    value={selectedCatalogProdId}
                    onChange={(e) => handleSelectCatalogProduct(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E9E4D4] rounded-xl text-xs text-[#1C2C22] focus:outline-none focus:ring-2 focus:ring-[#1E3A2B]/20"
                  >
                    <option value="">Selecione um produto do cardápio...</option>
                    {catalogProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.price}
                      </option>
                    ))}
                    <option value="custom">Outro produto (digitar manualmente)</option>
                  </select>

                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Nome do produto"
                    className="w-full px-3 py-1.5 bg-white border border-[#E9E4D4] rounded-xl text-xs text-[#1C2C22] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A2B]/20"
                  />

                  <div className="flex gap-2">
                    <div className="w-20 shrink-0">
                      <input
                        type="number"
                        min="1"
                        value={newItemQty}
                        onChange={(e) => setNewItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                        placeholder="Qtd"
                        className="w-full px-3 py-1.5 bg-white border border-[#E9E4D4] rounded-xl text-xs text-[#1C2C22] focus:outline-none focus:ring-2 focus:ring-[#1E3A2B]/20"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        placeholder="Preço (ex: 28,00)"
                        className="w-full px-3 py-1.5 bg-white border border-[#E9E4D4] rounded-xl text-xs text-[#1C2C22] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A2B]/20"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddNewItem}
                      disabled={!newItemName.trim()}
                      className="bg-[#2E4233] hover:bg-[#1E3A2B] text-white text-xs font-bold px-3 shrink-0 rounded-xl disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Add Complement Section */}
              {editableItems.length > 0 && (
                <div className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/40 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider">
                    <Plus className="w-3.5 h-3.5 text-[#CB5A3C]" />
                    <span>Adicionar Adicional a um Item</span>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                          Item do pedido:
                        </label>
                        <select
                          value={targetItemIndex}
                          onChange={(e) => setTargetItemIndex(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E9E4D4] rounded-xl text-xs text-[#1C2C22] focus:outline-none focus:ring-2 focus:ring-[#1E3A2B]/20"
                        >
                          {editableItems.map((it, idx) => (
                            <option key={idx} value={idx}>
                              {it.qty}x {it.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                          Adicional do cardápio:
                        </label>
                        <select
                          value={selectedCatalogCompName}
                          onChange={(e) => handleSelectCatalogComplement(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E9E4D4] rounded-xl text-xs text-[#1C2C22] focus:outline-none focus:ring-2 focus:ring-[#1E3A2B]/20"
                        >
                          <option value="">Selecione um adicional...</option>
                          {allDistinctComplements.map(c => (
                            <option key={c.name} value={c.name}>
                              {c.name} — {c.price}
                            </option>
                          ))}
                          <option value="custom">Outro (digitar manualmente)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={newCompName}
                          onChange={(e) => setNewCompName(e.target.value)}
                          placeholder="Nome do adicional (ex: Bacon extra)"
                          className="w-full px-3 py-1.5 bg-white border border-[#E9E4D4] rounded-xl text-xs text-[#1C2C22] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A2B]/20"
                        />
                      </div>
                      <div className="w-24 shrink-0">
                        <input
                          type="text"
                          value={newCompPrice}
                          onChange={(e) => setNewCompPrice(e.target.value)}
                          placeholder="Preço (ex: 5,00)"
                          className="w-full px-3 py-1.5 bg-white border border-[#E9E4D4] rounded-xl text-xs text-[#1C2C22] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A2B]/20"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleAddComplementToItem}
                        disabled={!newCompName.trim()}
                        className="bg-[#CB5A3C] hover:bg-[#B34B30] text-white text-xs font-bold px-3 shrink-0 rounded-xl disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Incluir
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Recalculated Total Banner */}
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between text-xs">
                <span className="font-medium text-amber-900">Total recalculado do pedido:</span>
                <span className="font-bold text-sm text-[#1C2C22]">{calculatedTotal}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-white border-t border-[#E9E4D4] flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 text-xs"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEditedOrder}
                className="flex-1 bg-[#1E3A2B] hover:bg-[#162B20] text-white text-xs font-semibold gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação: Excluir Item do Pedido no Padrão DeliPlus */}
      {itemToDeleteFromOrder && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setItemToDeleteFromOrder(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 flex flex-col items-center text-center border border-[#E9E4D4] animate-in zoom-in-95 duration-150 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setItemToDeleteFromOrder(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-full bg-[#FDF2F0] border-2 border-[#F5D8D1] flex items-center justify-center mb-3 shadow-sm">
              <Trash2 className="w-7 h-7 text-[#CB5A3C]" />
            </div>

            <h3 className="font-bold text-[#1C2C22] text-lg mb-1">Excluir item do pedido?</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Tem certeza que deseja remover <span className="font-bold text-[#1C2C22]">&quot;{itemToDeleteFromOrder.name}&quot;</span> deste pedido? O valor total será recalculado automaticamente.
            </p>

            <div className="flex w-full gap-3">
              <button
                type="button"
                onClick={() => setItemToDeleteFromOrder(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E9E4D4] text-[14px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  handleRemoveItem(itemToDeleteFromOrder.index)
                  setItemToDeleteFromOrder(null)
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#CB5A3C] hover:bg-[#A8452B] text-[14px] font-semibold text-white shadow-sm transition-all cursor-pointer active:scale-95"
              >
                Excluir item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
