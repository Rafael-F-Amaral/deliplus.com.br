'use client'

import { useState, useMemo } from 'react'
import {
  X,
  Printer,
  Receipt,
  DollarSign,
  QrCode,
  CreditCard,
  Bike,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LiveOrderData } from './finance-client'

interface ShiftClosingModalProps {
  isOpen: boolean
  onClose: () => void
  storeName: string
  orders: LiveOrderData[]
}

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

export function ShiftClosingModal({
  isOpen,
  onClose,
  storeName,
  orders
}: ShiftClosingModalProps) {
  const [operatorName, setOperatorName] = useState('Gerente / Operador')
  const [closingNotes, setClosingNotes] = useState('')

  // Compute today's shift orders
  const shiftData = useMemo(() => {
    const today = new Date().toDateString()
    
    // Filter orders created today (or all orders if in test/mock mode with today timestamps)
    const todayOrders = orders.filter((o) => {
      try {
        return o.created_at ? new Date(o.created_at).toDateString() === today : false
      } catch {
        return true
      }
    })

    const relevantOrders = todayOrders.length > 0 ? todayOrders : orders

    let totalCents = 0
    let cashCents = 0
    let pixCents = 0
    let debitCents = 0
    let creditCents = 0
    let deliveryCount = 0
    let deliveryFeeCents = 0
    let pickupCount = 0

    relevantOrders.forEach((o) => {
      const amt = o.total_amount_cents || 0
      totalCents += amt

      const method = (o.payment_method || '').toLowerCase()
      if (method.includes('dinheiro')) {
        cashCents += amt
      } else if (method.includes('pix')) {
        pixCents += amt
      } else if (method.includes('débito') || method.includes('debito')) {
        debitCents += amt
      } else {
        creditCents += amt
      }

      // Check delivery vs pickup
      const isDeliv = (o as any).delivery_type === 'Delivery' || !((o as any).delivery_type?.includes('Retirada'))
      if (isDeliv) {
        deliveryCount += 1
        deliveryFeeCents += 500 // default or real
      } else {
        pickupCount += 1
      }
    })

    return {
      orderCount: relevantOrders.length,
      totalCents,
      cashCents,
      pixCents,
      debitCents,
      creditCents,
      deliveryCount,
      deliveryFeeCents,
      pickupCount,
      dateFormatted: new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      timeFormatted: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }, [orders])

  if (!isOpen) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1C261F] border border-[#E9E4D4] dark:border-[#2A382E] rounded-2xl shadow-2xl w-full max-w-xl max-h-[90dvh] flex flex-col overflow-hidden text-[#1C2C22] dark:text-[#F2EFE9]">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[#E9E4D4] dark:border-[#2A382E] flex items-center justify-between gap-3 bg-[#FAF8F0] dark:bg-[#17211A] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#2E4233] text-white flex items-center justify-center shadow-xs shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold font-serif truncate">Fechamento de Caixa do Turno</h2>
              <p className="text-[11px] text-gray-600 dark:text-[#9CA79E] capitalize truncate">
                {shiftData.dateFormatted} • {shiftData.timeFormatted}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar fechamento de caixa"
            className="min-h-9 min-w-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-[#9CA79E] hover:text-gray-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E4233]/40 dark:focus-visible:ring-[#E76F41]/50 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* Operator input */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-[#FAF8F0]/60 dark:bg-[#17211A] border border-[#E9E4D4] dark:border-[#2A382E]">
            <label htmlFor="shift-operator-name" className="font-semibold text-gray-700 dark:text-[#D5DDD2]">
              Operador do Caixa:
            </label>
            <input
              id="shift-operator-name"
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              className="w-full sm:w-auto sm:min-w-[210px] px-3 py-1.5 min-h-9 text-base lg:text-xs font-bold rounded-lg border border-[#E9E4D4] dark:border-[#2A382E] bg-white dark:bg-[#1C261F] text-[#1C2C22] dark:text-[#F2EFE9] text-left sm:text-right focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E4233]/35 dark:focus-visible:ring-[#E76F41]/50"
            />
          </div>

          {/* Dinheiro na Gaveta (Destaque Máximo para Conferência Física) */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold">
                <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Dinheiro em Espécie (Gaveta)</span>
              </div>
              <span className="text-lg font-black font-serif text-amber-950 dark:text-amber-100">
                {formatBRL(shiftData.cashCents)}
              </span>
            </div>
            <p className="text-[11px] text-amber-800/90 dark:text-amber-300">
              Valor físico que deve ser contado e conferido na gaveta neste fechamento.
            </p>
          </div>

          {/* Recebimentos Digitais */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-[#9CA79E] block">
              Recebimentos Eletrônicos & Cartões
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-3 rounded-xl border border-[#E9E4D4] dark:border-[#2A382E] bg-white dark:bg-[#17211A]">
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-[#9CA79E] mb-1">
                  <QrCode className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span className="font-semibold text-[11px]">PIX</span>
                </div>
                <div className="font-black text-sm">{formatBRL(shiftData.pixCents)}</div>
              </div>

              <div className="p-3 rounded-xl border border-[#E9E4D4] dark:border-[#2A382E] bg-white dark:bg-[#17211A]">
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-[#9CA79E] mb-1">
                  <CreditCard className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span className="font-semibold text-[11px]">Débito</span>
                </div>
                <div className="font-black text-sm">{formatBRL(shiftData.debitCents)}</div>
              </div>

              <div className="p-3 rounded-xl border border-[#E9E4D4] dark:border-[#2A382E] bg-white dark:bg-[#17211A]">
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-[#9CA79E] mb-1">
                  <CreditCard className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span className="font-semibold text-[11px]">Crédito</span>
                </div>
                <div className="font-black text-sm">{formatBRL(shiftData.creditCents)}</div>
              </div>
            </div>
          </div>

          {/* Logística & Entregadores */}
          <div className="p-3.5 rounded-xl border border-[#E9E4D4] dark:border-[#2A382E] bg-white dark:bg-[#17211A] space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-bold">
                <Bike className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Acerto de Entregadores (Delivery)</span>
              </div>
              <span className="font-bold text-gray-600 dark:text-[#9CA79E]">{shiftData.deliveryCount} entregas</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-dashed border-gray-200 dark:border-[#2A382E]">
              <span className="text-gray-600 dark:text-[#9CA79E]">Total estimado em taxas de entrega:</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                {formatBRL(shiftData.deliveryFeeCents)}
              </span>
            </div>
          </div>

          {/* Observações do Fechamento */}
          <div>
            <label htmlFor="shift-closing-notes" className="text-[11px] font-semibold text-gray-600 dark:text-[#9CA79E] mb-1 block">
              Observações do Fechamento (opcional)
            </label>
            <input
              id="shift-closing-notes"
              type="text"
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              placeholder="Ex: Diferença de R$ 1,50 na gaveta, motoboy Marcos recebeu diária..."
              className="w-full px-3 py-2 min-h-9 text-base lg:text-xs rounded-xl border border-[#E9E4D4] dark:border-[#2A382E] bg-white dark:bg-[#17211A] text-[#1C2C22] dark:text-[#F2EFE9] placeholder:text-gray-400 dark:placeholder:text-[#9CA79E]/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E4233]/35 dark:focus-visible:ring-[#E76F41]/50"
            />
          </div>

          {/* Hidden Thermal Receipt Print Template */}
          <div
            id="thermal-receipt"
            className="hidden print:block bg-white text-black font-mono text-[11px] leading-tight p-4 border border-dashed border-gray-300 space-y-2"
          >
            <div className="text-center pb-2 border-b border-dashed border-gray-400">
              <div className="font-bold text-base uppercase">{storeName}</div>
              <div className="text-[10px]">FECHAMENTO DE CAIXA • NÃO FISCAL</div>
              <div>{shiftData.dateFormatted} • {shiftData.timeFormatted}</div>
              <div>OPERADOR: {operatorName}</div>
            </div>

            <div className="space-y-1 border-b border-dashed border-gray-400 pb-2">
              <div className="flex justify-between font-bold">
                <span>TOTAL PEDIDOS:</span>
                <span>{shiftData.orderCount}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>FATURAMENTO TOTAL:</span>
                <span>{formatBRL(shiftData.totalCents)}</span>
              </div>
            </div>

            <div className="space-y-1 border-b border-dashed border-gray-400 pb-2">
              <div className="font-bold text-[10px] uppercase">FORMA DE PAGAMENTO</div>
              <div className="flex justify-between font-bold">
                <span>DINHEIRO NA GAVETA:</span>
                <span>{formatBRL(shiftData.cashCents)}</span>
              </div>
              <div className="flex justify-between">
                <span>PIX:</span>
                <span>{formatBRL(shiftData.pixCents)}</span>
              </div>
              <div className="flex justify-between">
                <span>CARTÃO DÉBITO:</span>
                <span>{formatBRL(shiftData.debitCents)}</span>
              </div>
              <div className="flex justify-between">
                <span>CARTÃO CRÉDITO:</span>
                <span>{formatBRL(shiftData.creditCents)}</span>
              </div>
            </div>

            <div className="space-y-1 border-b border-dashed border-gray-400 pb-2">
              <div className="font-bold text-[10px] uppercase">ENTREGADORES</div>
              <div className="flex justify-between">
                <span>ENTREGAS:</span>
                <span>{shiftData.deliveryCount}</span>
              </div>
              <div className="flex justify-between">
                <span>TAXAS TOTAIS:</span>
                <span>{formatBRL(shiftData.deliveryFeeCents)}</span>
              </div>
            </div>

            {closingNotes && (
              <div className="border-b border-dashed border-gray-400 pb-2">
                <div className="font-bold text-[10px]">OBSERVAÇÕES:</div>
                <div>{closingNotes}</div>
              </div>
            )}

            <div className="pt-4 text-center space-y-3">
              <div className="border-t border-black w-40 mx-auto pt-1 text-[9px]">
                ASSINATURA DO OPERADOR
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-t border-[#E9E4D4] dark:border-[#2A382E] bg-[#FAF8F0] dark:bg-[#17211A] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-[10px] text-gray-600 dark:text-[#9CA79E] uppercase font-bold block">Faturamento do Turno</span>
            <span className="text-xl font-black font-serif text-[#1C2C22] dark:text-[#F2EFE9]">
              {formatBRL(shiftData.totalCents)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-9 px-4 py-2 rounded-xl text-xs font-semibold border border-[#E9E4D4] dark:border-[#2A382E] text-gray-700 dark:text-[#D5DDD2] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="min-h-9 px-4 py-2 rounded-xl text-xs font-bold bg-[#2E4233] hover:bg-[#213125] dark:bg-[#E76F41] dark:hover:bg-[#FF7D4F] text-white dark:text-[#131A15] shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>Imprimir Fechamento (80mm)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
