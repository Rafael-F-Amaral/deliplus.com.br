"use client"

import { useState } from 'react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function SvgIcon({ path, className }: { path: string, className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={path} />
    </svg>
  )
}

const dummyTickets = [
  {
    id: '#1247',
    timeElapsed: '12 min',
    isLate: true,
    client: 'Marina Souza',
    items: [
      { qty: 1, name: 'Bowl Frango Grelhado', obs: 'Sem cebola' },
      { qty: 1, name: 'Suco Natural Laranja 300ml' }
    ]
  },
  {
    id: '#1248',
    timeElapsed: '8 min',
    isLate: false,
    client: 'Carlos Almeida',
    items: [
      { qty: 2, name: 'Salada Noma' },
      { qty: 2, name: 'Refrigerante Cola' }
    ]
  },
  {
    id: '#1249',
    timeElapsed: '5 min',
    isLate: false,
    client: 'Ana Paula',
    items: [
      { qty: 1, name: 'Bowl Salmão', obs: 'Extra molho teriyaki' }
    ]
  },
  {
    id: '#1250',
    timeElapsed: '1 min',
    isLate: false,
    client: 'Fernando Costa',
    items: [
      { qty: 3, name: 'Suco Natural Laranja 300ml' },
      { qty: 1, name: 'Bolo de Cenoura' }
    ]
  }
]

export default function ProductionPage() {
  const [tickets, setTickets] = useState(dummyTickets)

  const handleConcluir = (id: string) => {
    setTickets(tickets.filter(t => t.id !== id))
  }

  return (
    <div className="flex h-full w-full relative">
      <div className="flex-1 flex flex-col p-4 pb-24 lg:p-8 lg:pb-8 transition-all w-full">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 lg:mb-8">
          <h1 className="text-[32px] font-serif text-[#1C2C22] mb-4 lg:mb-0">Produção</h1>
          
          <div className="flex items-center gap-2 border border-gray-200 rounded-md px-3 py-2 bg-white text-gray-700 w-full lg:w-auto cursor-pointer shadow-sm">
            <span>Todos os pedidos</span>
            <SvgIcon path="M6 9l6 6 6-6" className="w-4 h-4 ml-auto lg:ml-2 text-gray-400" />
          </div>
        </div>

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm flex flex-col">
              
              {/* Ticket Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-[#FAFAFA]">
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900 text-lg leading-none">{ticket.id}</span>
                  <span className="text-gray-500 text-xs mt-1">{ticket.client}</span>
                </div>
                <div className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-bold",
                  ticket.isLate ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                )}>
                  {ticket.timeElapsed}
                </div>
              </div>

              {/* Ticket Items */}
              <div className="p-4 flex-1 flex flex-col gap-3">
                {ticket.items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-0.5 rounded h-fit shrink-0">
                      {item.qty}x
                    </span>
                    <div className="flex flex-col">
                      <span className="text-gray-900 text-[15px] font-medium leading-snug">{item.name}</span>
                      {item.obs && (
                        <span className="text-[#CB5A3C] text-sm font-medium mt-0.5">Obs: {item.obs}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Ticket Actions */}
              <div className="p-4 pt-0 mt-auto">
                <Button 
                  onClick={() => handleConcluir(ticket.id)}
                  className="w-full bg-[#50C878] hover:bg-[#45B269] text-white h-11 text-[15px] font-medium rounded-md shadow-sm border-0 transition-colors"
                >
                  <SvgIcon path="M20 6L9 17l-5-5" className="w-5 h-5 mr-2" />
                  Concluir Preparo
                </Button>
              </div>

            </div>
          ))}
          
          {tickets.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400">
              <SvgIcon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg">Nenhum pedido na fila de produção.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}