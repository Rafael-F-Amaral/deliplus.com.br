// Storefront Checkout Payment Modal (Pix, Cartão, Dinheiro)
"use client"

import React, { useState, useEffect } from "react"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import {
  X,
  CreditCard,
  Banknote,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  Lock,
  Tag,
  ArrowLeft,
} from "lucide-react"
import { PaymentMethodType } from "@/types/storefront"

export function CheckoutPaymentModal() {
  const {
    activeModal,
    closeModal,
    openModal,
    items,
    subtotalCents,
    deliveryFeeCents,
    discountCents,
    totalCents,
    couponCode,
    appliedCoupon,
    applyCoupon,
    confirmOrder,
    store,
  } = useStorefrontCart()

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("pix")
  const [copied, setCopied] = useState(false)
  const [couponInput, setCouponInput] = useState(appliedCoupon || "")
  const [couponMessage, setCouponMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [changeFor, setChangeFor] = useState("")

  // Pix timer countdown
  const [timeLeft, setTimeLeft] = useState(1788) // 29m 48s

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  if (activeModal !== "checkout-payment") return null

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  const handleCopyPix = () => {
    navigator.clipboard.writeText(store.pix_key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponInput.trim()) return
    const res = applyCoupon(couponInput)
    setCouponMessage(res.message)
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    const changeCents =
      paymentMethod === "cash" && changeFor
        ? Math.round(parseFloat(changeFor.replace(",", ".")) * 100)
        : undefined
    await confirmOrder(paymentMethod, changeCents)
    setIsSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 md:p-4 backdrop-blur-xs">
      <div className="relative flex h-full w-full max-w-6xl flex-col overflow-hidden bg-white dark:bg-[#17211A] text-[#1F2922] dark:text-[#F2EFE9] shadow-2xl md:h-auto md:max-h-[92vh] md:rounded-2xl border dark:border-[#2A382E]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ECE7DE] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] px-6 py-4">
          <div className="font-serif text-2xl font-bold tracking-tight text-[#1A261D] dark:text-[#F2EFE9]">
            Deliplus
          </div>

          {/* Stepper Center - Sem emojis, alinhado e com contraste perfeito no claro e escuro */}
          <div className="hidden items-center gap-3 md:gap-4 text-xs sm:flex">
            <div className="flex items-center gap-1.5 font-semibold text-[#2E6B3E] dark:text-[#4ADE80]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-[#4ADE80] border border-emerald-300 dark:border-emerald-800/60 text-[11px] font-bold">
                1
              </span>
              <span>Sacola</span>
            </div>
            <span className="h-px w-6 sm:w-8 bg-[#DED7CB] dark:bg-[#2A382E]" />
            <div className="flex items-center gap-1.5 font-semibold text-[#2E6B3E] dark:text-[#4ADE80]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-[#4ADE80] border border-emerald-300 dark:border-emerald-800/60 text-[11px] font-bold">
                2
              </span>
              <span>Dados</span>
            </div>
            <span className="h-px w-6 sm:w-8 bg-[#DED7CB] dark:bg-[#2A382E]" />
            <div className="flex items-center gap-1.5 font-semibold text-[#2E6B3E] dark:text-[#4ADE80]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-[#4ADE80] border border-emerald-300 dark:border-emerald-800/60 text-[11px] font-bold">
                3
              </span>
              <span>Entrega</span>
            </div>
            <span className="h-px w-6 sm:w-8 bg-[#DED7CB] dark:bg-[#2A382E]" />
            <div className="flex items-center gap-1.5 font-bold text-[#1A261D] dark:text-white">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#CB5A3C] text-white text-[11px] font-bold shadow-xs">
                4
              </span>
              <span>Pagamento</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-1.5 text-xs text-[#2E6B3E] dark:text-[#4ADE80] md:flex">
              <ShieldCheck className="h-4 w-4" />
              <span>Compra segura • Seus dados protegidos</span>
            </div>
            <button
              onClick={closeModal}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#5D645E] dark:text-[#9CA79E] hover:bg-[#F4EFE6] dark:hover:bg-[#253528]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: 3 Columns Grid */}
        <div className="grid flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-12">
          {/* Column 1: Payment Method Selection */}
          <div className="border-b border-[#ECE7DE] dark:border-[#2A382E] p-6 lg:col-span-4 lg:border-b-0 lg:border-r lg:p-7">
            <h2 className="font-serif text-2xl font-bold text-[#1C261F] dark:text-[#F2EFE9]">
              Forma de pagamento
            </h2>
            <p className="mt-1 text-xs text-[#6B736E] dark:text-[#9CA79E]">
              Escolha a forma de pagamento que prefere para finalizar seu pedido.
            </p>

            <div className="mt-6 space-y-3">
              {/* Option: Pix */}
              <label
                onClick={() => setPaymentMethod("pix")}
                className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition ${
                  paymentMethod === "pix"
                    ? "border-[#1B2A20] bg-[#FAF8F5] dark:border-emerald-500/50 dark:bg-[#253528] ring-1 ring-[#1B2A20] dark:ring-emerald-500/50"
                    : "border-[#ECE7DE] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] hover:border-[#D5CDBD] dark:hover:border-[#384D3E]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00B494]/10 text-[#00B494]">
                    {/* Pix Diamond Icon */}
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5 fill-current"
                      aria-hidden="true"
                    >
                      <path d="M12 2L6 8l6 6 6-6-6-6zm0 14l-6-6-4 4 10 10 10-10-4-4-6 6z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1C261F] dark:text-[#F2EFE9]">Pix</h3>
                    <p className="text-xs text-[#2E6B3E] dark:text-emerald-400 font-medium">
                      Aprovação imediata
                    </p>
                  </div>
                </div>

                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    paymentMethod === "pix"
                      ? "border-[#1B2A20] bg-[#1B2A20] dark:bg-emerald-500 dark:border-emerald-500 text-white"
                      : "border-[#C5BEB3] dark:border-[#3A4B3E]"
                  }`}
                >
                  {paymentMethod === "pix" && <Check className="h-3 w-3" />}
                </div>
              </label>

              {/* Option: Cartão de Crédito */}
              <label
                onClick={() => setPaymentMethod("credit_card")}
                className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition ${
                  paymentMethod === "credit_card"
                    ? "border-[#1B2A20] bg-[#FAF8F5] dark:border-emerald-500/50 dark:bg-[#253528] ring-1 ring-[#1B2A20] dark:ring-emerald-500/50"
                    : "border-[#ECE7DE] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] hover:border-[#D5CDBD] dark:hover:border-[#384D3E]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5EFE6] dark:bg-[#253528] text-[#1B2A20] dark:text-[#4ADE80]">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                      Cartão de crédito
                    </h3>
                    <p className="text-xs text-[#6B736E] dark:text-[#9CA79E]">Pagamento seguro</p>
                  </div>
                </div>

                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    paymentMethod === "credit_card"
                      ? "border-[#1B2A20] bg-[#1B2A20] dark:bg-emerald-500 dark:border-emerald-500 text-white"
                      : "border-[#C5BEB3] dark:border-[#3A4B3E]"
                  }`}
                >
                  {paymentMethod === "credit_card" && <Check className="h-3 w-3" />}
                </div>
              </label>

              {/* Option: Dinheiro na entrega */}
              <label
                onClick={() => setPaymentMethod("cash")}
                className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition ${
                  paymentMethod === "cash"
                    ? "border-[#1B2A20] bg-[#FAF8F5] dark:border-emerald-500/50 dark:bg-[#253528] ring-1 ring-[#1B2A20] dark:ring-emerald-500/50"
                    : "border-[#ECE7DE] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] hover:border-[#D5CDBD] dark:hover:border-[#384D3E]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5EFE6] dark:bg-[#253528] text-[#1B2A20] dark:text-[#4ADE80]">
                    <Banknote className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                      Dinheiro na entrega
                    </h3>
                    <p className="text-xs text-[#6B736E] dark:text-[#9CA79E]">Pagamento ao receber</p>
                  </div>
                </div>

                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    paymentMethod === "cash"
                      ? "border-[#1B2A20] bg-[#1B2A20] dark:bg-emerald-500 dark:border-emerald-500 text-white"
                      : "border-[#C5BEB3] dark:border-[#3A4B3E]"
                  }`}
                >
                  {paymentMethod === "cash" && <Check className="h-3 w-3" />}
                </div>
              </label>
            </div>

            {/* Need Change input if cash selected */}
            {paymentMethod === "cash" && (
              <div className="mt-4 rounded-xl border border-[#ECE7DE] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#131A15] p-3 text-xs">
                <label className="mb-1 block font-semibold text-[#1C261F] dark:text-[#F2EFE9]">
                  Precisa de troco para quanto? (Opcional)
                </label>
                <input
                  type="text"
                  value={changeFor}
                  onChange={(e) => setChangeFor(e.target.value)}
                  placeholder="Ex: R$ 100,00"
                  className="w-full rounded-lg border border-[#DED7CB] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] p-2 text-sm text-[#1F2921] dark:text-[#F2EFE9]"
                />
              </div>
            )}

            {/* Coupon Box */}
            <form onSubmit={handleApplyCoupon} className="mt-6 flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7F8681] dark:text-[#9CA79E]" />
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Cupom de desconto"
                  className="w-full rounded-xl border border-[#DED7CB] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#131A15] py-2.5 pl-8 pr-3 text-xs text-[#1F2921] dark:text-[#F2EFE9] outline-hidden focus:border-[#1B2A20] dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-[#131A15] focus:ring-1 focus:ring-[#1B2A20]"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl border border-[#DED7CB] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] px-4 py-2.5 text-xs font-bold text-[#1F2921] dark:text-[#F2EFE9] transition hover:bg-[#F5F2EB] dark:hover:bg-[#253528]"
              >
                Aplicar
              </button>
            </form>
            {couponMessage && (
              <p className="mt-1 text-xs text-[#2E6B3E] dark:text-emerald-400 font-medium">
                {couponMessage}
              </p>
            )}

            {/* Security Notice */}
            <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-[#E2DDD3] dark:border-[#2A382E] bg-[#F7F4EE] dark:bg-[#1F2B22] p-3 text-xs text-[#525B54] dark:text-[#9CA79E]">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#2E6B3E] dark:text-emerald-400" />
              <div>
                <span className="font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                  Pagamento seguro.
                </span>{" "}
                <span>
                  Seus dados são protegidos com criptografia de ponta a ponta.
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: Center Payment Action (Pix QR Code) */}
          <div className="flex flex-col items-center justify-center p-6 text-center lg:col-span-5 lg:p-8">
            {paymentMethod === "pix" ? (
              <div className="flex w-full max-w-sm flex-col items-center">
                <h3 className="font-serif text-2xl font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                  Pix
                </h3>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-[#2E6B3E] dark:text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Pagamento seguro</span>
                </div>
                <p className="mt-2 text-xs text-[#68706A] dark:text-[#9CA79E]">
                  Escaneie o QR Code com o app do seu banco ou copie o código Pix para pagar.
                </p>

                {/* QR Code Container */}
                <div className="relative my-5 rounded-2xl border border-[#E5E0D5] dark:border-[#2A382E] bg-white p-4 shadow-sm">
                  {/* High Quality SVG Pix QR Code */}
                  <div className="relative flex h-52 w-52 items-center justify-center bg-[#FDFDFD]">
                    <svg
                      viewBox="0 0 100 100"
                      className="h-full w-full"
                      shapeRendering="crispEdges"
                    >
                      {/* Corner 1 */}
                      <rect x="0" y="0" width="28" height="28" fill="#1C251F" />
                      <rect x="4" y="4" width="20" height="20" fill="#FFFFFF" />
                      <rect x="8" y="8" width="12" height="12" fill="#1C251F" />
                      {/* Corner 2 */}
                      <rect x="72" y="0" width="28" height="28" fill="#1C251F" />
                      <rect x="76" y="4" width="20" height="20" fill="#FFFFFF" />
                      <rect x="80" y="8" width="12" height="12" fill="#1C251F" />
                      {/* Corner 3 */}
                      <rect x="0" y="72" width="28" height="28" fill="#1C251F" />
                      <rect x="4" y="76" width="20" height="20" fill="#FFFFFF" />
                      <rect x="8" y="80" width="12" height="12" fill="#1C251F" />
                      {/* Random authentic QR matrix modules */}
                      <rect x="36" y="4" width="8" height="8" fill="#1C251F" />
                      <rect x="48" y="8" width="8" height="8" fill="#1C251F" />
                      <rect x="60" y="4" width="8" height="8" fill="#1C251F" />
                      <rect x="8" y="36" width="8" height="8" fill="#1C251F" />
                      <rect x="20" y="44" width="8" height="8" fill="#1C251F" />
                      <rect x="8" y="56" width="8" height="8" fill="#1C251F" />
                      <rect x="36" y="36" width="6" height="6" fill="#1C251F" />
                      <rect x="58" y="36" width="6" height="6" fill="#1C251F" />
                      <rect x="36" y="58" width="6" height="6" fill="#1C251F" />
                      <rect x="58" y="58" width="6" height="6" fill="#1C251F" />
                      <rect x="72" y="36" width="8" height="8" fill="#1C251F" />
                      <rect x="84" y="48" width="8" height="8" fill="#1C251F" />
                      <rect x="76" y="60" width="8" height="8" fill="#1C251F" />
                      <rect x="36" y="76" width="8" height="8" fill="#1C251F" />
                      <rect x="48" y="84" width="8" height="8" fill="#1C251F" />
                      <rect x="60" y="76" width="8" height="8" fill="#1C251F" />
                      <rect x="76" y="76" width="8" height="8" fill="#1C251F" />
                      <rect x="84" y="88" width="8" height="8" fill="#1C251F" />
                    </svg>

                    {/* Central Pix Badge */}
                    <div className="absolute flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1.5 shadow-md">
                      <div className="flex h-full w-full items-center justify-center rounded-lg bg-[#00B494] text-white">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4 fill-current"
                        >
                          <path d="M12 2L6 8l6 6 6-6-6-6zm0 14l-6-6-4 4 10 10 10-10-4-4-6 6z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <span className="text-xs text-[#808782] dark:text-[#9CA79E]">
                  ou copie o código Pix
                </span>

                {/* Copy paste input */}
                <div className="mt-2 flex w-full items-center rounded-xl border border-[#DED7CB] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#131A15] p-2 text-xs">
                  <span className="flex-1 truncate font-mono text-[#4A534C] dark:text-[#D5DDD7]">
                    {store.pix_key.slice(0, 36)}...
                  </span>
                  <button
                    onClick={handleCopyPix}
                    className="ml-2 flex items-center gap-1 rounded-lg bg-white dark:bg-[#1B241E] px-2.5 py-1 font-semibold text-[#1B2A20] dark:text-[#F2EFE9] border dark:border-[#2A382E] shadow-xs hover:bg-[#F2ECE1] dark:hover:bg-[#253528]"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#2E6B3E] dark:text-emerald-400" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Expiration Timer */}
                <div className="mt-4 flex items-center gap-1.5 text-xs text-[#CB5A3C] dark:text-[#FF7D4F]">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Expira em {formatTimer(timeLeft)}</span>
                </div>
              </div>
            ) : paymentMethod === "credit_card" ? (
              <div className="flex max-w-sm flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FAF5EE] dark:bg-[#253528] text-[#1B2A20] dark:text-[#4ADE80]">
                  <CreditCard className="h-8 w-8" />
                </div>
                <h3 className="mt-4 font-serif text-xl font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                  Cartão na entrega
                </h3>
                <p className="mt-1 text-xs text-[#68706A] dark:text-[#9CA79E]">
                  O entregador levará a maquininha até seu endereço. Aceitamos as principais bandeiras (Visa, Mastercard, Elo, Amex).
                </p>
              </div>
            ) : (
              <div className="flex max-w-sm flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FAF5EE] dark:bg-[#253528] text-[#1B2A20] dark:text-[#4ADE80]">
                  <Banknote className="h-8 w-8" />
                </div>
                <h3 className="mt-4 font-serif text-xl font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                  Dinheiro na entrega
                </h3>
                <p className="mt-1 text-xs text-[#68706A] dark:text-[#9CA79E]">
                  O pagamento será realizado no ato da entrega diretamente com o entregador parceiro.
                </p>
              </div>
            )}
          </div>

          {/* Column 3: Order Summary & Confirm */}
          <div className="border-t border-[#ECE7DE] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#141C16] p-6 lg:col-span-3 lg:border-l lg:border-t-0 lg:p-7">
            <h3 className="font-serif text-base font-bold text-[#1C261F] dark:text-[#F2EFE9]">
              Resumo do pedido
            </h3>

            {/* Compact items list */}
            <div className="my-3 max-h-52 divide-y divide-[#ECE7DE] dark:divide-[#2A382E] overflow-y-auto">
              {items.map((it) => (
                <div key={it.id} className="flex items-center justify-between py-2 text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <img
                      src={it.image_url}
                      alt={it.name}
                      className="h-8 w-8 shrink-0 rounded object-cover"
                    />
                    <span className="truncate text-[#1C261F] dark:text-[#F2EFE9] font-medium">
                      {it.name}
                    </span>
                  </div>
                  <div className="ml-2 shrink-0 font-bold text-[#1C261F] dark:text-[#4ADE80]">
                    {it.quantity}x
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-1.5 border-t border-[#ECE7DE] dark:border-[#2A382E] pt-3 text-xs">
              <div className="flex justify-between text-[#68706A] dark:text-[#9CA79E]">
                <span>Subtotal</span>
                <span className="dark:text-[#F2EFE9]">{formatCurrency(subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-[#68706A] dark:text-[#9CA79E]">
                <span>Taxa de entrega</span>
                <span className="dark:text-[#F2EFE9]">
                  {deliveryFeeCents === 0 ? "Grátis" : formatCurrency(deliveryFeeCents)}
                </span>
              </div>
              {discountCents > 0 && (
                <div className="flex justify-between text-[#2E6B3E] dark:text-emerald-400 font-medium">
                  <span>Desconto cupom</span>
                  <span>- {formatCurrency(discountCents)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 text-sm font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                <span>Total</span>
                <span className="text-base text-[#1C261F] dark:text-[#4ADE80]">
                  {formatCurrency(totalCents)}
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-6">
              <button
                disabled={isSubmitting}
                onClick={handleConfirm}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#CB5A3C] py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#B54A2E] disabled:opacity-50"
              >
                <Lock className="h-4 w-4" />
                <span>
                  {isSubmitting ? "Processando..." : "Confirmar pagamento"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
