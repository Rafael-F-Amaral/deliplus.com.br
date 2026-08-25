'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { ShoppingBag, CookingPot, CircleCheck, Scooter, Printer, User, MessageSquare, CreditCard, ReceiptText, X, Check } from 'lucide-react'

function SvgIcon({ path, className }: { path: string, className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={path} />
    </svg>
  )
}

const statusColors = {
  Novo: 'bg-[#FEF2F2] text-[#DC2626]',
  'Em preparo': 'bg-[#FEF9C3] text-[#D97706]',
  Pronto: 'bg-[#DCFCE7] text-[#16A34A]',
  'Em entrega': 'bg-[#F3F4F6] text-[#4B5563]'
}

// Extended mock data to ensure all info is present
const orders = [
  { id: '#1247', client: 'Marina Souza', phone: '(11) 98765-4321', items: 3, itemsDesc: '2 pratos, 1 bebida', itemsDetail: [{qty: 1, name: 'Bowl Frango Grelhado', price: 'R$ 34,00'}, {qty: 1, name: 'Suco Natural Laranja 300ml', price: 'R$ 12,00'}, {qty: 1, name: 'Taxa de entrega', price: 'R$ 18,00'}], obs: 'Sem cebola, por favor.', payment: 'Pago online', time: '13:42', date: 'Hoje', type: 'Delivery', address: 'Rua das Flores, 123 - Vila Madalena, SP', total: 'R$ 87,50', status: 'Novo' },
  { id: '#1246', client: 'Rafael Lima', phone: '(11) 97654-3210', items: 4, itemsDesc: '2 pratos', itemsDetail: [], obs: '', payment: 'Na entrega', time: '13:41', date: 'Hoje', type: 'Delivery', address: 'Av. Paulista, 1000 - Bela Vista, SP', total: 'R$ 112,90', status: 'Em preparo' },
  { id: '#1245', client: 'Juliana Martins', phone: '(11) 96543-2109', items: 2, itemsDesc: '3 pratos, 1 bebida', itemsDetail: [{qty: 1, name: 'Bowl Frango Grelhado', price: 'R$ 34,00'}, {qty: 1, name: 'Suco Natural Laranja 300ml', price: 'R$ 12,00'}, {qty: 1, name: 'Taxa de entrega', price: 'R$ 18,00'}], obs: 'Sem cebola, por favor.', payment: 'Pago online', time: '13:38', date: 'Hoje', type: 'Retirada', address: 'Retirada no balcão', total: 'R$ 64,00', status: 'Pronto' },
]

export default function OrdersPage() {
  const [selectedOrderDesktop, setSelectedOrderDesktop] = useState<string | null>('#1247')
  const [expandedOrderMobile, setExpandedOrderMobile] = useState<string | null>('#1245')

  const activeDesktopOrder = orders.find(o => o.id === selectedOrderDesktop)

  return (
    <div className="flex h-full w-full relative">
      
      {/* Main Content Area */}
      <div className={cn("flex-1 flex flex-col p-4 pb-24 lg:p-8 lg:pb-8 transition-all w-full", selectedOrderDesktop ? "lg:pr-[464px]" : "")}>
        
        {/* Header & Mobile Filters */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6">
          <h1 className="text-[32px] font-serif text-[#1C2C22] mb-4 lg:mb-0">Pedidos</h1>
          
          {/* Mobile Filters (Hidden on Desktop) */}
          <div className="flex lg:hidden items-center justify-between">
            <div className="flex items-center gap-2 border border-gray-200 rounded-md px-3 py-2 bg-white text-gray-700 min-w-[120px]">
              <SvgIcon path="M3 4h18v16H3z M16 2v4 M8 2v4 M3 10h18" className="w-4 h-4 text-gray-400" />
              <span>Hoje</span>
              <SvgIcon path="M6 9l6 6 6-6" className="w-4 h-4 ml-auto text-gray-400" />
            </div>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 border border-gray-200 rounded-md bg-white flex items-center justify-center text-gray-600">
                <SvgIcon path="M21 21l-6-6 M15 10a5 5 0 1 0-10 0 5 5 0 0 0 10 0z" className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 border border-gray-200 rounded-md bg-white flex items-center justify-center text-gray-600">
                <SvgIcon path="M4 6h16 M4 12h16 M4 18h16" className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Filters Row (Hidden on Mobile) */}
        <div className="hidden lg:flex items-center gap-3 mb-8 text-sm">
          <div className="flex items-center gap-2 border border-gray-200 rounded-md px-3 py-2 bg-white text-gray-700 min-w-[120px] cursor-pointer">
            <SvgIcon path="M3 4h18v16H3z M16 2v4 M8 2v4 M3 10h18" className="w-4 h-4 text-gray-400" />
            <span>Hoje</span>
            <SvgIcon path="M6 9l6 6 6-6" className="w-4 h-4 ml-auto text-gray-400" />
          </div>
          <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-md px-3 py-2 bg-white text-gray-400">
            <input type="text" placeholder="Buscar pedido, cliente ou telefone..." className="flex-1 outline-none text-gray-700 placeholder-gray-400" />
            <SvgIcon path="M21 21l-6-6 M15 10a5 5 0 1 0-10 0 5 5 0 0 0 10 0z" className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 border border-gray-200 rounded-md px-3 py-2 bg-white text-gray-700 min-w-[180px] cursor-pointer">
            <span>Todos os status</span>
            <SvgIcon path="M6 9l6 6 6-6" className="w-4 h-4 ml-auto text-gray-400" />
          </div>
          <div className="flex items-center gap-2 border border-gray-200 rounded-md px-3 py-2 bg-white text-gray-700 min-w-[200px] cursor-pointer">
            <span>Todos os tipos de entrega</span>
            <SvgIcon path="M6 9l6 6 6-6" className="w-4 h-4 ml-auto text-gray-400" />
          </div>
        </div>

        {/* Summary Cards */}
        {/* Mobile: scrollable flex. Desktop: grid */}
        <div className="flex lg:grid lg:grid-cols-4 gap-4 mb-6 lg:mb-8 overflow-x-auto pb-2 lg:pb-0 snap-x hide-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
          
          <div className="min-w-[140px] lg:min-w-0 bg-white p-4 rounded-md border border-red-100 flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:gap-4 shadow-sm snap-start shrink-0">
            <div className="flex flex-col-reverse lg:flex-col">
              <span className="text-2xl font-serif lg:font-sans lg:font-semibold text-gray-900 leading-none">12</span>
              <span className="text-xs lg:text-sm text-gray-500 lg:mt-1 font-medium mb-1 lg:mb-0 lg:border-b-2 lg:border-blue-500 pb-0.5 inline-block w-fit">Novos</span>
            </div>
          </div>

          <div className="min-w-[140px] lg:min-w-0 bg-white p-4 rounded-md border border-yellow-100 flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:gap-4 shadow-sm snap-start shrink-0">
            <div className="flex flex-col-reverse lg:flex-col">
              <span className="text-2xl font-serif lg:font-sans lg:font-semibold text-gray-900 leading-none">8</span>
              <span className="text-xs lg:text-sm text-gray-500 lg:mt-1 font-medium mb-1 lg:mb-0 lg:border-b-2 lg:border-yellow-400 pb-0.5 inline-block w-fit">Em preparo</span>
            </div>
          </div>

          <div className="min-w-[140px] lg:min-w-0 bg-white p-4 rounded-md border border-green-100 flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:gap-4 shadow-sm snap-start shrink-0">
            <div className="flex flex-col-reverse lg:flex-col">
              <span className="text-2xl font-serif lg:font-sans lg:font-semibold text-gray-900 leading-none">16</span>
              <span className="text-xs lg:text-sm text-gray-500 lg:mt-1 font-medium mb-1 lg:mb-0 lg:border-b-2 lg:border-orange-500 pb-0.5 inline-block w-fit">Prontos</span>
            </div>
          </div>

          <div className="min-w-[140px] lg:min-w-0 bg-white p-4 rounded-md border border-green-100 flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:gap-4 shadow-sm snap-start shrink-0">
            <div className="flex flex-col-reverse lg:flex-col">
              <span className="text-2xl font-serif lg:font-sans lg:font-semibold text-gray-900 leading-none">7</span>
              <span className="text-xs lg:text-sm text-gray-500 lg:mt-1 font-medium mb-1 lg:mb-0 lg:border-b-2 lg:border-green-500 pb-0.5 inline-block w-fit">Em entrega</span>
            </div>
          </div>
        </div>

        {/* Mobile-only Subheader */}
        <div className="flex lg:hidden items-center justify-between mb-4 mt-2 px-1">
          <div className="flex items-center gap-2 text-[#1C2C22] font-serif text-lg">
            <div className="w-2.5 h-2.5 bg-[#CB5A3C] rounded-full"></div>
            Fila de pedidos ao vivo
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            Atualizado agora
            <SvgIcon path="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8 M3 3v5h5" className="w-3 h-3" />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:flex bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm flex-1 flex-col">
          <div className="grid grid-cols-[1fr_2fr_1.5fr_1fr_1fr_1fr_1.5fr_2fr] gap-4 p-4 border-b border-gray-100 bg-white text-xs font-medium text-gray-500">
            <div>Pedido</div>
            <div>Cliente</div>
            <div>Itens</div>
            <div>Horário</div>
            <div>Tipo</div>
            <div>Total</div>
            <div>Status</div>
            <div className="text-right pr-4">Ações</div>
          </div>
          
          <div className="overflow-auto flex-1">
            {orders.map((order, index) => (
              <div 
                key={order.id} 
                onClick={() => setSelectedOrderDesktop(order.id)}
                className={cn(
                  "grid grid-cols-[1fr_2fr_1.5fr_1fr_1fr_1fr_1.5fr_2fr] gap-4 p-4 items-center border-b border-gray-100 hover:bg-gray-200 cursor-pointer transition-colors text-sm",
                  index % 2 === 0 ? "bg-[#f4f4f5]" : "bg-white",
                  selectedOrderDesktop === order.id ? "bg-red-50/30 relative" : ""
                )}
              >
                {selectedOrderDesktop === order.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#CB5A3C]"></div>
                )}
                <div className="font-medium text-gray-900">{order.id}</div>
                <div className="flex flex-col">
                  <span className="text-gray-900 font-medium">{order.client}</span>
                  <span className="text-gray-500 text-xs mt-0.5">{order.phone}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-900 font-medium">{order.items} itens</span>
                  <span className="text-gray-500 text-xs mt-0.5">{order.itemsDesc}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-900 font-medium">{order.time}</span>
                  <span className="text-gray-500 text-xs mt-0.5">{order.date}</span>
                </div>
                <div className="text-gray-600">
                  <span>{order.type}</span>
                </div>
                <div className="font-medium text-gray-900">{order.total}</div>
                <div>
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", statusColors[order.status as keyof typeof statusColors])}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2 pr-2">
                  {order.status === 'Novo' ? (
                    <Button className="bg-[#CB5A3C] hover:bg-[#B34B30] text-white h-[34px] px-4 text-[13px] font-medium rounded-md shadow-sm transition-colors border-0">
                      Aceitar
                    </Button>
                  ) : (
                    <Button variant="outline" className="h-[34px] px-4 text-[13px] font-medium text-gray-700 rounded-md bg-white border-gray-300 hover:bg-gray-50 transition-colors shadow-sm">
                      Ver pedido
                    </Button>
                  )}
                  <Button variant="outline" className="h-[34px] px-4 text-[13px] font-medium text-gray-700 rounded-md bg-white border-gray-300 hover:bg-gray-50 transition-colors shadow-sm">
                    Imprimir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Cards List */}
        <div className="flex flex-col lg:hidden gap-3 pb-8">
          {orders.map((order) => {
            const isExpanded = expandedOrderMobile === order.id
            return (
              <div 
                key={order.id} 
                className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm"
              >
                {/* Card Header (Always visible) */}
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedOrderMobile(isExpanded ? null : order.id)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 text-lg">{order.id}</span>
                    <span className="text-gray-600">{order.client}</span>
                    <div className="text-gray-500 text-sm mt-1">
                      {order.time} • {order.date}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <span className="text-gray-500 text-xs">
                          {order.items} itens
                        </span>
                        <span className="font-medium text-gray-900">{order.total}</span>
                      </div>
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap", statusColors[order.status as keyof typeof statusColors])}>
                        {order.status}
                      </span>
                      <SvgIcon 
                        path={isExpanded ? "M18 15l-6-6-6 6" : "M9 18l6-6-6-6"} 
                        className="w-4 h-4 text-gray-400 ml-1 transition-transform" 
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Area */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-white space-y-4">
                    
                    {/* INCLUDED FIX: CRITICAL MISSING DATA (Address, Type, Phone) */}
                    <div className="bg-[#FAFAFA] p-3 rounded-md border border-gray-100 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700 font-semibold">
                          {order.type}
                        </div>
                        <a href={`https://wa.me/55${order.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-[#25D366] text-white hover:bg-[#20bd5a] px-3 py-1.5 rounded-md text-[10px] uppercase tracking-wider font-bold shadow-sm transition-colors">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                          </svg>
                          {order.phone}
                        </a>
                      </div>
                      <div className="text-sm text-gray-600 border-t border-gray-100 pt-2 mt-1">
                        {order.address}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <div className="text-sm font-bold text-gray-900 mb-3">Itens do pedido</div>
                        <div className="space-y-3">
                          {order.itemsDetail.map((item, idx) => (
                            <div key={idx} className="flex items-start justify-between text-sm">
                              <div className="flex gap-2">
                                <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-0.5 rounded h-fit">{item.qty}x</span>
                                <span className="text-gray-800 font-medium">{item.name}</span>
                              </div>
                              <span className="text-gray-900 font-bold whitespace-nowrap ml-2">{item.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="text-sm font-bold text-gray-900 mb-1">Observação do cliente</div>
                          <div className="text-sm text-gray-600">
                            {order.obs || 'Sem observações'}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-bold text-gray-900 mb-1">Pagamento</div>
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            {order.payment}
                            <span className="text-xs font-bold text-[#16A34A] bg-[#16A34A]/10 px-1.5 py-0.5 rounded uppercase tracking-wider">Pago</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-3 border-t border-gray-100 mt-2">
                      {order.status === 'Novo' && (
                        <Button className="w-full bg-[#CB5A3C] hover:bg-[#B34B30] text-white h-11 text-[15px] font-medium rounded-md shadow-sm border-0 transition-colors">
                          Aceitar pedido
                        </Button>
                      )}
                      <Button variant="outline" className="w-full h-11 text-[15px] font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors">
                        Imprimir
                      </Button>
                    </div>

                  </div>
                )}
              </div>
            )
          })}
        </div>

            {/* Right Sidebar (Desktop Order Details - Hidden on Mobile) */}
      {selectedOrderDesktop && activeDesktopOrder && (
        <div className="hidden lg:flex fixed top-[104px] right-8 bottom-8 w-[400px] bg-white rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex-col overflow-hidden border border-gray-100 z-50">
          
          <div className="flex justify-between items-start p-6 pb-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-[26px] font-serif text-[#0f172a] leading-none">Pedido {activeDesktopOrder.id}</h2>
              <div className="flex items-center gap-2">
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", statusColors[activeDesktopOrder.status as keyof typeof statusColors])}>
                  {activeDesktopOrder.status}
                </span>
                <span className="text-[13px] text-gray-500 font-medium">
                  Recebido às {activeDesktopOrder.time} • {activeDesktopOrder.date}
                </span>
              </div>
            </div>
            <button onClick={() => setSelectedOrderDesktop(null)} className="text-gray-400 hover:text-gray-900 transition-colors mt-1 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="overflow-auto flex-1 px-6 hide-scrollbar text-[14px]">
            <div className="space-y-6 py-2">
              
              {/* Cliente */}
              <div>
                <h3 className="font-semibold text-[#0f172a] text-[15px] mb-3">Cliente</h3>
                <div>
                  <div className="text-[#0f172a] text-[15px] mb-2">{activeDesktopOrder.client}</div>
                  <a href={`https://wa.me/55${activeDesktopOrder.phone.replace(/\D/g, '')}?text=Ol%C3%A1%2C%20aqui%20%C3%A9%20Sabor%20%26%20Cia.%20Tudo%20bem%3F`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-[#25D366] text-white hover:bg-[#20bd5a] px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors shadow-sm">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                    {activeDesktopOrder.phone}
                  </a>
                </div>
              </div>

              <div className="w-full border-t border-dashed border-gray-200"></div>

              {/* Entrega */}
              <div>
                <h3 className="font-semibold text-[#0f172a] text-[15px] mb-3">Entrega</h3>
                <div>
                  <div className="text-[#0f172a] font-medium mb-0.5">{activeDesktopOrder.type}</div>
                  <div className="text-gray-500 text-[13px]">
                    {activeDesktopOrder.address}
                  </div>
                </div>
              </div>

              <div className="w-full border-t border-dashed border-gray-200"></div>

              {/* Itens do pedido */}
              <div>
                <h3 className="font-semibold text-[#0f172a] text-[15px] mb-3">Itens do pedido</h3>
                <div className="space-y-4">
                  {activeDesktopOrder.itemsDetail.map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="bg-gray-100 text-gray-700 text-xs font-semibold px-2 py-1 rounded w-8 text-center h-fit">{item.qty}x</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <span className="text-[14px] font-medium text-[#0f172a] leading-tight">{item.name}</span>
                          <span className="text-[14px] text-[#0f172a]">{item.price}</span>
                        </div>
                        <div className="text-[13px] text-gray-500 mt-0.5 pr-2">
                          {item.name === "Frango Grelhado com Ervas" ? "Arroz integral, legumes grelhados" : item.name === "Salada Noma" ? "Folhas, tomate cereja, queijo de cabra, nozes, molho balsâmico" : "300ml"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full border-t border-dashed border-gray-200"></div>

              {/* Observações */}
              <div>
                <h3 className="font-semibold text-[#0f172a] text-[15px] mb-3">Observações</h3>
                <div>
                  <div className="text-[14px] text-gray-600">
                    {activeDesktopOrder.obs || 'Sem cebola, por favor.\nBater na portaria.'}
                  </div>
                </div>
              </div>

              <div className="w-full border-t border-dashed border-gray-200"></div>

              {/* Pagamento */}
              <div>
                <h3 className="font-semibold text-[#0f172a] text-[15px] mb-3">Pagamento</h3>
                <div className="pb-2 flex items-center justify-between">
                  <div className="text-[14px] text-gray-600">{activeDesktopOrder.payment}</div>
                  <span className="text-[12px] font-medium text-[#16A34A] bg-[#16A34A]/10 px-2 py-0.5 rounded-full">Pago</span>
                </div>
              </div>

            </div>
          </div>

          <div className="px-6 py-5 bg-white">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[#0f172a] font-medium">Total do pedido</span>
              <span className="text-[22px] font-medium text-[#0f172a]">{activeDesktopOrder.total}</span>
            </div>
            
            <div className="space-y-2.5">
              <Button className="w-full bg-[#CB5A3C] hover:bg-[#B34B30] text-white h-[46px] text-[15px] font-medium rounded-md border-0 transition-colors">
                <Check className="w-5 h-5 mr-2" />
                Aceitar pedido
              </Button>
              <Button variant="outline" className="w-full h-[46px] text-[15px] font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors">
                <Printer className="w-5 h-5 mr-2" />
                Imprimir pedido
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}
