'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Clock,
  CheckCircle2,
  Bike,
  Store,
  ChefHat,
  PackageCheck,
  AlertCircle,
  MessageCircle,
  ArrowLeft,
  ShoppingBag
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { StorefrontThemeToggle } from '@/components/storefront/storefront-theme-toggle'

export interface TrackedOrder {
  id: string
  order_number: number
  display_id: string
  status: 'Novo' | 'Em preparo' | 'Pronto' | 'Em entrega' | 'Concluído' | 'Cancelado'
  delivery_type: 'Delivery' | 'Retirada'
  delivery_address: string | null
  customer_name: string
  payment_method: string
  subtotal_cents: number
  delivery_fee_cents: number
  total_amount_cents: number
  notes: string | null
  created_at: string
  updated_at: string
  store_name: string
  store_slug: string
  store_phone: string
  store_logo: string | null
  items: Array<{
    id: string
    name: string
    qty: number
    unit_price_cents: number
    complements?: Array<{ name: string; price_cents: number }>
  }>
}

interface OrderLiveTrackerProps {
  initialOrder: TrackedOrder
}

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

function playStatusChime() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime) // D5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1) // A5
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start()
    osc.stop(audioCtx.currentTime + 0.5)
  } catch {
    // Ignore audio autoplay restrictions
  }
}

export function OrderLiveTracker({ initialOrder }: OrderLiveTrackerProps) {
  const [order, setOrder] = useState<TrackedOrder>(initialOrder)

  // Realtime subscription
  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    const channel = supabase
      .channel(`order-track-${order.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${order.id}`
        },
        (payload) => {
          if (payload.new && payload.new.status) {
            playStatusChime()
            setOrder((prev) => ({
              ...prev,
              status: payload.new.status,
              updated_at: payload.new.updated_at
            }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [order.id])

  // Compute status step index
  const statusLevels: Record<string, number> = {
    'Novo': 1,
    'Em preparo': 2,
    'Pronto': 3,
    'Em entrega': 4,
    'Concluído': 5,
    'Cancelado': -1
  }

  const currentLevel = statusLevels[order.status] || 1
  const isDelivery = order.delivery_type === 'Delivery'

  const steps = isDelivery
    ? [
        { level: 1, title: 'Pedido Recebido', desc: 'Aguardando confirmação da cozinha' },
        { level: 2, title: 'Em Preparo', desc: 'Pratos sendo preparados com carinho' },
        { level: 3, title: 'Pronto e Embalado', desc: 'Aguardando o entregador retirar' },
        { level: 4, title: 'Saiu para Entrega', desc: 'Entregador a caminho do seu endereço' },
        { level: 5, title: 'Pedido Entregue', desc: 'Bom apetite!' }
      ]
    : [
        { level: 1, title: 'Pedido Recebido', desc: 'Aguardando confirmação da cozinha' },
        { level: 2, title: 'Em Preparo', desc: 'Pratos sendo preparados com carinho' },
        { level: 3, title: 'Pronto para Retirada!', desc: 'Pode se dirigir ao balcão para retirar' },
        { level: 5, title: 'Concluído', desc: 'Obrigado pela preferência!' }
      ]

  const buildWhatsAppLink = () => {
    const raw = (order.store_phone || '').replace(/\D/g, '')
    const digits = raw.startsWith('55') ? raw : `55${raw}`
    const text = encodeURIComponent(
      `Olá! Gostaria de falar sobre o meu pedido ${order.display_id || ''} no ${order.store_name}.`
    )
    return `https://wa.me/${digits}?text=${text}`
  }

  return (
    <div className="min-h-dvh bg-[#FAF8F0] dark:bg-[#121914] text-[#1C2C22] dark:text-[#F2EFE9] flex flex-col items-center py-4 sm:py-6 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-xl flex flex-col gap-5">
        {/* Top Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href={`/${order.store_slug}`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 -ml-2 text-xs font-bold text-[#2E4233] dark:text-[#CBD5E1] hover:text-[#B4482D] dark:hover:text-[#FF7D4F] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao cardápio</span>
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <StorefrontThemeToggle variant="surface" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40 animate-pulse">
              ● Ao Vivo
            </span>
          </div>
        </div>

        {/* Store Header Banner */}
        <div className="bg-white dark:bg-[#1C261F] border border-[#E9E4D4] dark:border-[#2A382E] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 shrink-0 rounded-xl bg-[#2E4233] text-white flex items-center justify-center font-serif text-lg font-bold overflow-hidden shadow-2xs">
              {order.store_logo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={order.store_logo} alt={order.store_name} className="w-full h-full object-cover" />
              ) : (
                order.store_name[0] || 'D'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-bold font-serif truncate">{order.store_name}</h1>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-[#525A54] dark:text-[#A4AEA6]">
                <span>Pedido <strong className="text-[#B4482D] dark:text-[#FF7D4F]">{order.display_id}</strong></span>
                <span>•</span>
                <span>{order.delivery_type}</span>
              </div>
            </div>
          </div>

          {order.store_phone && (
            <a
              href={buildWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Falar com a loja no WhatsApp"
              className="flex h-11 w-11 min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl bg-[#15803D] hover:bg-[#166534] text-white shadow-2xs transition-all active:scale-95"
              title="Falar com a loja no WhatsApp"
            >
              <MessageCircle className="w-4 h-4 fill-white text-white" />
            </a>
          )}
        </div>

        {/* Status Tracker Card */}
        <div className="bg-white dark:bg-[#1C261F] border border-[#E9E4D4] dark:border-[#2A382E] rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#E9E4D4] dark:border-[#2A382E]">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#525A54] dark:text-[#9CA79E]">
                Status Atual do Pedido
              </span>
              <div className="text-xl font-black font-serif text-[#1C2C22] dark:text-[#F2EFE9] mt-0.5">
                {order.status === 'Cancelado' ? 'Pedido Cancelado' : order.status}
              </div>
            </div>

            <div className="w-10 h-10 shrink-0 rounded-xl bg-[#FAF8F0] dark:bg-[#25332A] flex items-center justify-center text-[#B4482D] dark:text-[#FF7D4F]">
              {order.status === 'Cancelado' ? (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              ) : currentLevel >= 4 ? (
                <Bike className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              ) : currentLevel >= 2 ? (
                <ChefHat className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              ) : (
                <Clock className="w-5 h-5 text-[#B4482D] dark:text-[#FF7D4F]" />
              )}
            </div>
          </div>

          {/* Stepper Timeline */}
          {order.status !== 'Cancelado' ? (
            <div className="mt-6 space-y-5">
              {steps.map((st, i) => {
                const isCompleted = currentLevel > st.level || currentLevel === 5
                const isCurrent = currentLevel === st.level && currentLevel !== 5
                const isUpcoming = currentLevel < st.level

                return (
                  <div key={st.level} className="flex items-start gap-3.5 relative">
                    {/* Connecting line */}
                    {i < steps.length - 1 && (
                      <div
                        className={cn(
                          "absolute left-4 top-8 bottom-0 w-0.5 -ml-px transition-colors duration-300",
                          currentLevel > st.level ? "bg-emerald-500" : "bg-[#E2DDD3] dark:bg-[#2E3F33]"
                        )}
                      />
                    )}

                    {/* Step Icon / Circle */}
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all duration-300 z-10",
                        isCompleted
                          ? "bg-[#15803D] text-white shadow-2xs"
                          : isCurrent
                          ? "bg-[#B4482D] text-white shadow-md ring-4 ring-[#B4482D]/20 animate-pulse"
                          : "bg-[#F2ECE1] dark:bg-[#25332A] text-[#59615B] dark:text-[#9CA79E]"
                      )}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                    </div>

                    {/* Step Text */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div
                        className={cn(
                          "text-xs font-bold transition-colors",
                          isCurrent
                            ? "text-[#B4482D] dark:text-[#FF7D4F]"
                            : isCompleted
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-[#59615B] dark:text-[#9CA79E]"
                        )}
                      >
                        {st.title}
                      </div>
                      <p className="text-[11px] text-[#525A54] dark:text-[#A4AEA6] mt-0.5 leading-relaxed">
                        {st.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-red-700 dark:text-red-300 font-medium">
              Este pedido foi cancelado pelo estabelecimento. Entre em contato pelo WhatsApp para mais informações.
            </div>
          )}
        </div>

        {/* Delivery / Address Info */}
        {order.delivery_type === 'Delivery' && order.delivery_address && (
          <div className="bg-white dark:bg-[#1C261F] border border-[#E9E4D4] dark:border-[#2A382E] rounded-2xl p-4 shadow-xs text-xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#525A54] dark:text-[#9CA79E]">
              Endereço de Entrega
            </span>
            <p className="font-semibold text-[#1C2C22] dark:text-[#F2EFE9] leading-relaxed">
              {order.delivery_address}
            </p>
            {order.notes && (
              <p className="text-[11px] text-[#525A54] dark:text-[#A4AEA6] pt-1">
                Obs: {order.notes}
              </p>
            )}
          </div>
        )}

        {/* Order Items Breakdown */}
        <div className="bg-white dark:bg-[#1C261F] border border-[#E9E4D4] dark:border-[#2A382E] rounded-2xl p-5 shadow-xs text-xs space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#525A54] dark:text-[#9CA79E] block pb-2 border-b border-[#E9E4D4] dark:border-[#2A382E]">
            Itens do Pedido ({order.items.length})
          </span>

          <div className="divide-y divide-[#E9E4D4]/60 dark:divide-[#2A382E]/60">
            {order.items.map((it, idx) => (
              <div key={idx} className="py-2.5 flex justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[#1C2C22] dark:text-[#F2EFE9]">
                    {it.qty}x {it.name}
                  </div>
                  {it.complements && it.complements.length > 0 && (
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                      + {it.complements.map((c) => c.name).join(', ')}
                    </div>
                  )}
                </div>
                <div className="font-bold text-right shrink-0">
                  {formatBRL(it.unit_price_cents * it.qty)}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E9E4D4] dark:border-[#2A382E] space-y-1.5 text-xs">
            <div className="flex justify-between text-[#525A54] dark:text-[#A4AEA6]">
              <span>Subtotal</span>
              <span>{formatBRL(order.subtotal_cents)}</span>
            </div>
            {order.delivery_fee_cents > 0 && (
              <div className="flex justify-between text-[#525A54] dark:text-[#A4AEA6]">
                <span>Taxa de Entrega</span>
                <span>{formatBRL(order.delivery_fee_cents)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1.5 border-t border-[#E9E4D4]/60 dark:border-[#2A382E]/60 text-sm font-black text-[#1C2C22] dark:text-[#F2EFE9]">
              <span>Total</span>
              <span className="text-emerald-700 dark:text-emerald-400">
                {formatBRL(order.total_amount_cents)}
              </span>
            </div>
            <div className="text-[10px] text-[#525A54] dark:text-[#9CA79E] text-right pt-0.5">
              Pagamento: {order.payment_method}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
