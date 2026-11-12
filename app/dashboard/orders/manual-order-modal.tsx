'use client'

import { useState, useMemo } from 'react'
import {
  X,
  Plus,
  Trash2,
  ShoppingBag,
  Bike,
  Store,
  DollarSign,
  QrCode,
  CreditCard,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createManualOrderAction, ManualOrderInput } from './actions'
import { CatalogProduct } from './orders-client'

interface ManualOrderModalProps {
  isOpen: boolean
  onClose: () => void
  catalogProducts: CatalogProduct[]
  storeName: string
  onOrderCreated?: (orderNumber?: number) => void
}

interface CartItem {
  productId: string
  name: string
  qty: number
  unitPriceCents: number
  notes?: string
}

export function ManualOrderModal({
  isOpen,
  onClose,
  catalogProducts,
  storeName,
  onOrderCreated
}: ManualOrderModalProps) {
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [deliveryType, setDeliveryType] = useState<'Delivery' | 'Retirada'>('Retirada')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'Em Dinheiro' | 'PIX' | 'Cartão de Débito' | 'Cartão de Crédito'>('Em Dinheiro')
  const [changeFor, setChangeFor] = useState('')
  const [generalNotes, setGeneralNotes] = useState('')

  // Cart
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProdId, setSelectedProdId] = useState('')
  const [selectedQty, setSelectedQty] = useState(1)
  const [selectedItemNote, setSelectedItemNote] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Subtotal calculation
  const subtotalCents = useMemo(() => {
    return cart.reduce((acc, it) => acc + (it.unitPriceCents * it.qty), 0)
  }, [cart])

  const changeForCents = useMemo(() => {
    if (paymentMethod !== 'Em Dinheiro' || !changeFor.trim()) return null
    const digits = changeFor.replace(/\D/g, '')
    return digits ? parseInt(digits, 10) : null
  }, [paymentMethod, changeFor])

  const changeDueCents = useMemo(() => {
    if (!changeForCents || changeForCents <= subtotalCents) return 0
    return changeForCents - subtotalCents
  }, [changeForCents, subtotalCents])

  if (!isOpen) return null

  const handleAddItem = () => {
    if (!selectedProdId) return
    const prod = catalogProducts.find((p) => p.id === selectedProdId)
    if (!prod) return

    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.productId === prod.id && (i.notes || '') === selectedItemNote.trim())
      if (existingIdx !== -1) {
        const copy = [...prev]
        copy[existingIdx].qty += selectedQty
        return copy
      }
      return [
        ...prev,
        {
          productId: prod.id,
          name: prod.name,
          qty: selectedQty,
          unitPriceCents: prod.priceCents,
          notes: selectedItemNote.trim() || undefined
        }
      ]
    })

    setSelectedProdId('')
    setSelectedQty(1)
    setSelectedItemNote('')
  }

  const handleRemoveItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpdateQty = (index: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((it, i) => {
          if (i === index) {
            const newQty = it.qty + delta
            return newQty > 0 ? { ...it, qty: newQty } : null
          }
          return it
        })
        .filter(Boolean) as CartItem[]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (cart.length === 0) {
      setErrorMsg('Adicione pelo menos 1 item ao pedido.')
      return
    }

    if (deliveryType === 'Delivery' && !deliveryAddress.trim()) {
      setErrorMsg('Por favor informe o endereço de entrega.')
      return
    }

    setIsLoading(true)

    try {
      const payload: ManualOrderInput = {
        customerName: customerName.trim() || 'Cliente Balcão',
        customerPhone: customerPhone.trim() || undefined,
        deliveryType,
        deliveryAddress: deliveryType === 'Delivery' ? deliveryAddress.trim() : undefined,
        paymentMethod,
        changeForCents: changeForCents,
        notes: generalNotes.trim() || undefined,
        items: cart.map((it) => ({
          product_id: it.productId,
          name: it.name,
          qty: it.qty,
          unit_price_cents: it.unitPriceCents,
          details: it.notes
        }))
      }

      const res = await createManualOrderAction(payload)

      if (onOrderCreated) {
        onOrderCreated(res?.order_number)
      }

      onClose()
    } catch (err: any) {
      console.error('Erro ao criar pedido manual:', err)
      setErrorMsg(err?.message || 'Erro ao criar pedido no sistema.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-order-title"
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-[#1C261F] border border-[#E9E4D4] dark:border-[#2A382E] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden text-[#1C2C22] dark:text-[#F2EFE9]">
        {/* Header */}
        <div className="px-4 sm:px-5 py-4 border-b border-[#E9E4D4] dark:border-[#2A382E] flex items-center justify-between gap-3 bg-[#FAF8F0] dark:bg-[#17211A] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#B4482D] text-white flex items-center justify-center shadow-xs shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 id="manual-order-title" className="text-base font-bold font-serif truncate">Novo Pedido Manual (PDV)</h2>
              <p className="text-[11px] text-muted-foreground">
                Lançar pedido de balcão, telefone ou WhatsApp direto na cozinha
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar pedido manual"
            className="min-h-9 min-w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-[#1C2C22] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Tipo do Pedido: Balcão vs Delivery */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Tipo de Atendimento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeliveryType('Retirada')}
                className={cn(
                  "min-h-10 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                  deliveryType === 'Retirada'
                    ? "bg-[#2E4233] text-white border-[#2E4233] shadow-xs"
                    : "bg-white dark:bg-[#17211A] border-[#E9E4D4] dark:border-[#2A382E] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#222C25]"
                )}
              >
                <Store className="w-4 h-4" />
                <span>Balcão / Retirada</span>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryType('Delivery')}
                className={cn(
                  "min-h-10 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                  deliveryType === 'Delivery'
                    ? "bg-[#B4482D] text-white border-[#B4482D] shadow-xs"
                    : "bg-white dark:bg-[#17211A] border-[#E9E4D4] dark:border-[#2A382E] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#222C25]"
                )}
              >
                <Bike className="w-4 h-4" />
                <span>Entrega / Delivery</span>
              </button>
            </div>
          </div>

          {/* 2. Dados do Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block">Nome do Cliente</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full min-h-9 px-3 py-2 text-base lg:text-sm rounded-xl border border-[#E9E4D4] dark:border-[#2A382E] bg-white dark:bg-[#17211A] text-[#1C2C22] dark:text-[#F2EFE9] placeholder:text-muted-foreground focus:outline-none focus:border-[#CB5A3C]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block">Telefone / WhatsApp</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Ex: (11) 98765-4321"
                className="w-full min-h-9 px-3 py-2 text-base lg:text-sm rounded-xl border border-[#E9E4D4] dark:border-[#2A382E] bg-white dark:bg-[#17211A] text-[#1C2C22] dark:text-[#F2EFE9] placeholder:text-muted-foreground focus:outline-none focus:border-[#CB5A3C]"
              />
            </div>
          </div>

          {/* Endereço (se Delivery) */}
          {deliveryType === 'Delivery' && (
            <div>
              <label className="text-xs font-semibold mb-1 block">
                Endereço de Entrega <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Rua, número, bairro e complemento..."
                className="w-full min-h-9 px-3 py-2 text-base lg:text-sm rounded-xl border border-[#E9E4D4] dark:border-[#2A382E] bg-white dark:bg-[#17211A] text-[#1C2C22] dark:text-[#F2EFE9] placeholder:text-muted-foreground focus:outline-none focus:border-[#CB5A3C]"
              />
            </div>
          )}

          {/* 3. Seletor de Itens do Cardápio */}
          <div className="pt-2 border-t border-[#E9E4D4] dark:border-[#2A382E]">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Adicionar Itens ao Pedido
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedProdId}
                onChange={(e) => setSelectedProdId(e.target.value)}
                className="flex-1 min-h-9 px-3 py-2 text-base lg:text-sm rounded-xl border border-[#E9E4D4] dark:border-[#2A382E] bg-white dark:bg-[#17211A] text-[#1C2C22] dark:text-[#F2EFE9] focus:outline-none focus:border-[#CB5A3C]"
              >
                <option value="">-- Selecione um produto do cardápio --</option>
                {catalogProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {(p.priceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={selectedQty}
                  onChange={(e) => setSelectedQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-16 min-h-9 px-2 py-2 text-base lg:text-sm text-center rounded-xl border border-[#E9E4D4] dark:border-[#2A382E] bg-white dark:bg-[#17211A] text-[#1C2C22] dark:text-[#F2EFE9] focus:outline-none focus:border-[#CB5A3C] font-bold"
                  title="Quantidade"
                  aria-label="Quantidade do item"
                />

                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedProdId}
                  className="min-h-9 flex-1 sm:flex-initial justify-center px-3 py-2 rounded-xl text-xs font-bold bg-[#2E4233] hover:bg-[#213125] text-white disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>

            {selectedProdId && (
              <input
                type="text"
                value={selectedItemNote}
                onChange={(e) => setSelectedItemNote(e.target.value)}
                placeholder="Observação do item (opcional, ex: sem cebola)..."
                className="w-full min-h-9 mt-2 px-3 py-1.5 text-base lg:text-sm rounded-lg border border-dashed border-[#E9E4D4] dark:border-[#2A382E] bg-[#FAF8F0]/40 dark:bg-[#17211A] text-[#1C2C22] dark:text-[#F2EFE9] placeholder:text-muted-foreground focus:outline-none focus:border-[#CB5A3C]"
              />
            )}
          </div>

          {/* Carrinho de Itens Selecionados */}
          {cart.length > 0 ? (
            <div className="border border-[#E9E4D4] dark:border-[#2A382E] rounded-xl overflow-hidden divide-y divide-[#E9E4D4]/60 dark:divide-[#2A382E]/60 bg-[#FAF8F0]/20 dark:bg-[#17211A]/40">
              {cart.map((item, idx) => (
                <div key={idx} className="p-2.5 flex flex-wrap sm:flex-nowrap items-center justify-between text-xs gap-2.5">
                  <div className="flex-1 min-w-[140px]">
                    <div className="font-bold truncate text-[#1C2C22] dark:text-[#F2EFE9]">{item.name}</div>
                    {item.notes && (
                      <div className="text-[11px] text-muted-foreground">↳ {item.notes}</div>
                    )}
                    <div className="text-[11px] text-muted-foreground">
                      {(item.unitPriceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} un.
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 w-full sm:w-auto">
                    {/* Qty controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(idx, -1)}
                        aria-label={`Diminuir quantidade de ${item.name}`}
                        className="min-h-9 min-w-9 w-9 h-9 rounded-lg bg-gray-100 dark:bg-[#25332A] flex items-center justify-center font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#2F4135] cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-xs">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(idx, 1)}
                        aria-label={`Aumentar quantidade de ${item.name}`}
                        className="min-h-9 min-w-9 w-9 h-9 rounded-lg bg-gray-100 dark:bg-[#25332A] flex items-center justify-center font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#2F4135] cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right font-bold min-w-[72px] shrink-0">
                      {((item.unitPriceCents * item.qty) / 100).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      aria-label={`Remover ${item.name}`}
                      className="min-h-9 min-w-9 flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-muted-foreground border border-dashed border-[#E9E4D4] dark:border-[#2A382E] rounded-xl">
              Nenhum item adicionado ao pedido ainda.
            </div>
          )}

          {/* 4. Forma de Pagamento */}
          <div className="pt-2 border-t border-[#E9E4D4] dark:border-[#2A382E]">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'Em Dinheiro', label: 'Dinheiro', icon: DollarSign },
                { id: 'PIX', label: 'Pix', icon: QrCode },
                { id: 'Cartão de Débito', label: 'Débito', icon: CreditCard },
                { id: 'Cartão de Crédito', label: 'Crédito', icon: CreditCard }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as 'Em Dinheiro' | 'PIX' | 'Cartão de Débito' | 'Cartão de Crédito')}
                  className={cn(
                    "min-h-11 flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
                    paymentMethod === m.id
                      ? "bg-[#2E4233] text-white border-[#2E4233] shadow-xs"
                      : "bg-white dark:bg-[#17211A] border-[#E9E4D4] dark:border-[#2A382E] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#222C25]"
                  )}
                >
                  <m.icon className="w-4 h-4" />
                  <span className="text-[11px]">{m.label}</span>
                </button>
              ))}
            </div>

            {/* Troco se Dinheiro */}
            {paymentMethod === 'Em Dinheiro' && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div>
                  <label className="font-semibold text-amber-900 dark:text-amber-300 block">
                    Precisa de troco para quanto?
                  </label>
                  <span className="text-[11px] text-amber-800 dark:text-amber-300">
                    {changeDueCents > 0
                      ? `Troco a devolver: ${(changeDueCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
                      : 'Deixe vazio se não precisar de troco'}
                  </span>
                </div>
                <input
                  type="text"
                  value={changeFor}
                  onChange={(e) => setChangeFor(e.target.value)}
                  placeholder="Ex: 50,00"
                  className="w-full sm:w-28 min-h-9 px-2.5 py-1.5 text-right text-base lg:text-sm font-bold rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-[#17211A] text-amber-900 dark:text-amber-200 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* 5. Observações Gerais */}
          <div>
            <label className="text-xs font-semibold mb-1 block">Observações Gerais do Pedido</label>
            <input
              type="text"
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Ex: Tocar o interfone 202, não buzinar..."
              className="w-full min-h-9 px-3 py-2 text-base lg:text-sm rounded-xl border border-[#E9E4D4] dark:border-[#2A382E] bg-white dark:bg-[#17211A] text-[#1C2C22] dark:text-[#F2EFE9] placeholder:text-muted-foreground focus:outline-none focus:border-[#CB5A3C]"
            />
          </div>
        </form>

        {/* Footer with Subtotal & Submit */}
        <div className="px-4 sm:px-5 py-4 border-t border-[#E9E4D4] dark:border-[#2A382E] bg-[#FAF8F0] dark:bg-[#17211A] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-[11px] text-muted-foreground block">Total do Pedido</span>
            <span className="text-xl font-black font-serif text-[#1C2C22] dark:text-[#F2EFE9]">
              {(subtotalCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="min-h-10 px-4 py-2 rounded-xl text-xs font-semibold border border-[#E9E4D4] dark:border-[#2A382E] text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-[#222C25] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || cart.length === 0}
              className="min-h-10 px-5 py-2 rounded-xl text-xs font-bold bg-[#B4482D] hover:bg-[#9C3B23] text-white shadow-md active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isLoading ? (
                <span>Lançando...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Lançar Pedido</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
