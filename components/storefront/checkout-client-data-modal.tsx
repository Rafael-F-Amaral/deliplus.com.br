"use client"

import React, { useState, useEffect } from "react"
import { useStorefrontCart } from "@/lib/storefront/storefront-cart-context"
import { lookupGlobalCustomerByPhone } from "@/lib/storefront/actions"
import {
  X,
  CheckCircle2,
  Plus,
  Minus,
  ArrowLeft,
  Clock,
  MapPin,
  Store as StoreIcon,
  Check,
  CreditCard,
  Banknote,
  Sparkles,
  Pencil,
  UserCheck,
  Search,
} from "lucide-react"
import { PaymentMethodType } from "@/types/storefront"
import { PixOfficialIcon, CardBrandsGroup } from "./payment-brand-icons"
import { StorefrontImage } from "./storefront-image"

const GLOBAL_STORAGE_KEY = "deliplus_global_customer_v1"

export function CheckoutClientDataModal() {
  const {
    activeModal,
    closeModal,
    openModal,
    items,
    updateQuantity,
    subtotalCents,
    deliveryFeeCents,
    discountCents,
    totalCents,
    deliveryMethod,
    setDeliveryMethod,
    customerData,
    setCustomerData,
    store,
    confirmOrder,
  } = useStorefrontCart()

  // 1. Dados do Cliente
  const [name, setName] = useState(customerData.name || "")
  const [whatsapp, setWhatsapp] = useState(customerData.whatsapp || "")

  // 2. Endereço de Entrega
  const [cep, setCep] = useState(customerData.cep || "")
  const [address, setAddress] = useState(
    customerData.address?.split(",")[0]?.trim() || ""
  )
  const [number, setNumber] = useState("")
  const [complement, setComplement] = useState(customerData.complement || "")
  const [neighborhood, setNeighborhood] = useState(customerData.neighborhood || "")
  const [city, setCity] = useState(customerData.city || "")
  const [reference, setReference] = useState(customerData.reference || "")

  // Estados de Edição vs Visualização Rápida (Cliente Já Reconhecido)
  const [isEditingProfile, setIsEditingProfile] = useState(!customerData.name)
  const [isEditingAddress, setIsEditingAddress] = useState(!customerData.address)
  const [isRecognizedCustomer, setIsRecognizedCustomer] = useState(Boolean(customerData.name && customerData.whatsapp))
  const [isSearchingPhone, setIsSearchingPhone] = useState(false)
  const [lookupFeedback, setLookupFeedback] = useState<string | null>(null)
  const [orderError, setOrderError] = useState<string | null>(null)

  // 3. Pagamento
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("pix")
  const [changeFor, setChangeFor] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Carrega dados salvos globalmente na Rede DeliPlus (localStorage) ao abrir
  useEffect(() => {
    try {
      const raw = localStorage.getItem(GLOBAL_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.name) setName(parsed.name)
        if (parsed.whatsapp) setWhatsapp(parsed.whatsapp)
        if (parsed.cep) setCep(parsed.cep)
        if (parsed.address) setAddress(parsed.address)
        if (parsed.number) setNumber(parsed.number)
        if (parsed.complement !== undefined) setComplement(parsed.complement)
        if (parsed.neighborhood) setNeighborhood(parsed.neighborhood)
        if (parsed.city) setCity(parsed.city)
        if (parsed.reference !== undefined) setReference(parsed.reference)
        if (parsed.name && parsed.whatsapp) {
          setIsRecognizedCustomer(true)
          setIsEditingProfile(false)
          setIsEditingAddress(false)
        }
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  const isCheckoutOpen =
    activeModal === "checkout-data" ||
    activeModal === "receiving-method" ||
    activeModal === "checkout-payment"

  if (!isCheckoutOpen) return null

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  // Busca global no Supabase quando o cliente digita o WhatsApp
  const handlePhoneLookup = async (phoneValue: string) => {
    const digits = phoneValue.replace(/\D/g, "")
    if (digits.length < 10) return

    setIsSearchingPhone(true)
    setLookupFeedback(null)
    try {
      const res = await lookupGlobalCustomerByPhone(phoneValue)
      if (res.found && res.customer) {
        setName(res.customer.name)
        if (res.customer.deliveryAddress) {
          const parts = res.customer.deliveryAddress.split(" - ")
          if (parts[0]) {
            const [streetPart, numPart] = parts[0].split(",")
            if (streetPart) setAddress(streetPart.trim())
            if (numPart) setNumber(numPart.trim())
          }
          if (parts[1]) setNeighborhood(parts[1].trim())
        }
        setIsRecognizedCustomer(true)
        setLookupFeedback("Cadastro encontrado na Rede DeliPlus! Dados preenchidos.")
      }
    } finally {
      setIsSearchingPhone(false)
    }
  }

  const saveGlobalProfile = () => {
    try {
      localStorage.setItem(
        GLOBAL_STORAGE_KEY,
        JSON.stringify({
          name: name.trim(),
          whatsapp: whatsapp.trim(),
          cep: cep.trim(),
          address: address.trim(),
          number: number.trim(),
          complement: complement.trim(),
          neighborhood: neighborhood.trim(),
          city: city.trim(),
          reference: reference.trim(),
        })
      )
    } catch {
      // ignore
    }
  }

  const handleConfirmUnifiedOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !whatsapp.trim()) {
      setIsEditingProfile(true)
      return
    }

    setIsSubmitting(true)
    saveGlobalProfile()

    let changeForCents: number | undefined = undefined
    if (paymentMethod === "cash" && changeFor.trim()) {
      const clean = changeFor.replace(/\D/g, "")
      if (clean) changeForCents = parseInt(clean, 10)
    }

    const updatedCustomer = {
      name: name.trim(),
      phone: whatsapp.trim(),
      whatsapp: whatsapp.trim(),
      ...(deliveryMethod === "delivery"
        ? {
            cep: cep.trim(),
            address: number.trim() ? `${address.trim()}, ${number.trim()}` : address.trim(),
            complement: complement.trim(),
            neighborhood: neighborhood.trim(),
            city: city.trim(),
            reference: reference.trim(),
          }
        : {}),
    }

    try {
      setOrderError(null)
      await confirmOrder(paymentMethod, changeForCents, updatedCustomer)
    } catch (err: any) {
      setOrderError(err?.message || "Não foi possível confirmar o pedido. Verifique os dados e tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 backdrop-blur-xs md:p-4 short:p-0 lg:short:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Finalizar pedido"
        className="relative flex h-dvh w-full max-w-2xl lg:max-w-6xl flex-col overflow-hidden bg-white dark:bg-[#17211A] text-[#1F2922] dark:text-[#F2EFE9] shadow-2xl pt-safe pb-safe md:pt-0 md:pb-0 md:h-auto md:max-h-[90dvh] md:rounded-2xl short:h-dvh short:max-h-dvh short:rounded-none short:pt-safe short:pb-safe lg:short:h-auto lg:short:max-h-[90dvh] lg:short:rounded-2xl lg:short:pt-0 lg:short:pb-0 border border-[#ECE7DE] dark:border-[#2A382E]"
      >
        {orderError && (
          <div className="mx-4 sm:mx-6 mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            ⚠️ {orderError}
          </div>
        )}
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 border-b border-[#ECE7DE] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] px-4 sm:px-6 py-3 sm:py-4 shrink-0">
          <button
            type="button"
            onClick={() => {
              closeModal()
              openModal("cart-drawer")
            }}
            className="flex min-h-9 items-center gap-1.5 rounded-lg px-2 -ml-2 text-xs font-semibold text-[#B4482D] dark:text-[#FF7D4F] hover:bg-[#FAF8F5] dark:hover:bg-[#253528] transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar à sacola</span>
          </button>

          {/* Stepper Center Simplificado */}
          <div className="hidden items-center gap-3 md:gap-4 text-xs sm:flex">
            <button
              type="button"
              onClick={() => {
                closeModal()
                openModal("cart-drawer")
              }}
              className="flex min-h-9 items-center gap-1.5 font-semibold text-[#2E6B3E] dark:text-[#4ADE80] hover:opacity-80 transition cursor-pointer"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-[#4ADE80] border border-emerald-300 dark:border-emerald-800/60 text-[11px] font-bold">
                1
              </span>
              <span className="font-semibold">Sacola</span>
            </button>
            <span className="h-px w-8 bg-[#DED7CB] dark:bg-[#2A382E]" />
            <div className="flex items-center gap-1.5 font-bold text-[#1A261D] dark:text-white">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#B4482D] text-white text-[11px] font-bold shadow-xs">
                2
              </span>
              <span className="font-bold">Finalizar Pedido Rápido</span>
            </div>
          </div>

          <button
            type="button"
            onClick={closeModal}
            className="flex h-9 w-9 min-h-9 min-w-9 shrink-0 items-center justify-center rounded-full text-[#4A534C] dark:text-[#CBD5E1] hover:bg-[#F4EFE6] dark:hover:bg-[#253528] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6B3E]"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: 2 Columns no desktop (>= lg) */}
        <form
          onSubmit={handleConfirmUnifiedOrder}
          className="grid flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-12 storefront-scrollbar"
        >
          {/* Left Column: All-in-One Checkout Form */}
          <div className="space-y-6 p-4 sm:p-6 lg:col-span-7 lg:p-8 border-b border-[#ECE7DE] dark:border-[#2A382E] lg:border-b-0 lg:border-r">
            {/* Banner de Reconhecimento Global DeliPlus */}
            {isRecognizedCustomer && !isEditingProfile && !isEditingAddress && (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-600/30 bg-emerald-50/80 dark:bg-emerald-950/30 dark:border-emerald-500/30 px-4 py-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#15803D] text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <span className="font-bold text-emerald-950 dark:text-emerald-300 block">
                      Reconhecido pela Rede DeliPlus!
                    </span>
                    <span className="font-semibold text-emerald-800/90 dark:text-emerald-400/90">
                      Seus dados e endereço já estão prontos. Basta escolher o pagamento e confirmar!
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 1. IDENTIFICAÇÃO DO CLIENTE */}
            <section>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1B2A20] dark:bg-[#15803D] text-white text-xs font-bold">
                    1
                  </span>
                  <h2 className="font-serif text-lg font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                    Seus dados
                  </h2>
                </div>

                {!isEditingProfile && (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#DED7CB] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#1B241E] px-3 py-1.5 text-xs font-bold text-[#B4482D] dark:text-[#FF7D4F] hover:bg-[#F2ECE1] dark:hover:bg-[#253528] transition cursor-pointer"
                  >
                    <Pencil className="h-3 w-3" />
                    <span>Trocar / Editar</span>
                  </button>
                )}
              </div>

              {!isEditingProfile ? (
                /* Cartão Compacto de Cliente Já Cadastrado */
                <div className="flex items-center justify-between rounded-2xl border border-[#DDD5C7] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#1B241E] p-4 shadow-2xs">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-[#1C261F] dark:text-[#F2EFE9] break-words">
                          {name}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/15 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 shrink-0">
                          <CheckCircle2 className="h-3 w-3" />
                          WhatsApp verificado
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-[#525A54] dark:text-[#A4AEA6]">
                        WhatsApp: <strong className="text-[#1C261F] dark:text-[#F2EFE9]">{whatsapp}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Formulário de Edição / Novo Cliente com Busca Global por WhatsApp */
                <div className="rounded-2xl border border-[#DDD5C7] dark:border-[#2A382E] bg-[#F2ECE1] dark:bg-[#121A14] p-4 space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 flex items-center justify-between text-xs font-semibold text-[#2D352F] dark:text-[#D5DDD7]">
                        <span>WhatsApp *</span>
                        {isSearchingPhone && (
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 animate-pulse">
                            Buscando cadastro...
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={whatsapp}
                          onChange={(e) => {
                            setWhatsapp(e.target.value)
                            const digits = e.target.value.replace(/\D/g, "")
                            if (digits.length >= 10) {
                              handlePhoneLookup(e.target.value)
                            }
                          }}
                          placeholder="(11) 99999-9999"
                          className="w-full min-h-10 rounded-xl border border-emerald-600 dark:border-emerald-500 bg-white dark:bg-[#1B241E] p-2.5 pr-9 text-base lg:text-sm text-[#1F2921] dark:text-[#F2EFE9] outline-hidden font-semibold"
                        />
                        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#2D352F] dark:text-[#D5DDD7]">
                        Nome completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu nome completo"
                        className="w-full min-h-10 rounded-xl border border-[#D5CDBD] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] p-2.5 text-base lg:text-sm text-[#1F2921] dark:text-[#F2EFE9] outline-hidden focus:border-[#1B2A20] dark:focus:border-emerald-500 font-semibold"
                      />
                    </div>
                  </div>

                  {lookupFeedback && (
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{lookupFeedback}</span>
                    </p>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (name.trim() && whatsapp.trim()) {
                          setCustomerData({ name: name.trim(), phone: whatsapp.trim(), whatsapp: whatsapp.trim() })
                          saveGlobalProfile()
                          setIsEditingProfile(false)
                        }
                      }}
                      className="min-h-10 rounded-xl bg-[#1B2A20] dark:bg-[#15803D] px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition cursor-pointer"
                    >
                      Salvar dados
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* 2. COMO VOCÊ QUER RECEBER? */}
            <section className="border-t border-[#ECE7DE] dark:border-[#2A382E] pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1B2A20] dark:bg-[#15803D] text-white text-xs font-bold">
                    2
                  </span>
                  <h2 className="font-serif text-lg font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                    Entrega ou Retirada
                  </h2>
                </div>

                {deliveryMethod === "delivery" && !isEditingAddress && (
                  <button
                    type="button"
                    onClick={() => setIsEditingAddress(true)}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#DED7CB] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#1B241E] px-3 py-1.5 text-xs font-bold text-[#B4482D] dark:text-[#FF7D4F] hover:bg-[#F2ECE1] dark:hover:bg-[#253528] transition cursor-pointer"
                  >
                    <Pencil className="h-3 w-3" />
                    <span>Trocar endereço</span>
                  </button>
                )}
              </div>

              {/* Seletor Delivery vs Retirada */}
              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3" role="radiogroup" aria-label="Método de recebimento">
                <label
                  className={`relative flex cursor-pointer items-center justify-between gap-2 rounded-xl border p-3.5 transition focus-within:ring-2 focus-within:ring-emerald-600 ${
                    deliveryMethod === "delivery"
                      ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/25 ring-1 ring-emerald-600 dark:border-emerald-500 dark:ring-emerald-500"
                      : "border-[#DED7CB] dark:border-[#2A382E] bg-white dark:bg-[#1B241E]"
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="delivery"
                    checked={deliveryMethod === "delivery"}
                    onChange={() => setDeliveryMethod("delivery")}
                    className="sr-only"
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                      Delivery
                    </h3>
                    <span className="text-xs font-semibold text-[#1E5C30] dark:text-emerald-400">
                      {store.prep_time || "35–50 min"}
                    </span>
                  </div>
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      deliveryMethod === "delivery"
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-[#C5BEB3] dark:border-[#4A5D4F]"
                    }`}
                  >
                    {deliveryMethod === "delivery" && <Check className="h-3 w-3" />}
                  </div>
                </label>

                <label
                  className={`relative flex cursor-pointer items-center justify-between gap-2 rounded-xl border p-3.5 transition focus-within:ring-2 focus-within:ring-emerald-600 ${
                    deliveryMethod === "pickup"
                      ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/25 ring-1 ring-emerald-600 dark:border-emerald-500 dark:ring-emerald-500"
                      : "border-[#DED7CB] dark:border-[#2A382E] bg-white dark:bg-[#1B241E]"
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="pickup"
                    checked={deliveryMethod === "pickup"}
                    onChange={() => setDeliveryMethod("pickup")}
                    className="sr-only"
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                      Retirar na loja
                    </h3>
                    <span className="text-xs font-semibold text-[#1E5C30] dark:text-emerald-400">
                      15–25 min • Grátis
                    </span>
                  </div>
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      deliveryMethod === "pickup"
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-[#C5BEB3] dark:border-[#4A5D4F]"
                    }`}
                  >
                    {deliveryMethod === "pickup" && <Check className="h-3 w-3" />}
                  </div>
                </label>
              </div>

              {/* Cartão de Endereço Salvo (ou Formulário se estiver editando) */}
              {deliveryMethod === "delivery" ? (
                !isEditingAddress ? (
                  <div className="mt-3 flex items-start justify-between rounded-2xl border border-[#DDD5C7] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#1B241E] p-4 shadow-2xs">
                    <div className="flex min-w-0 items-start gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                            {address}, {number}
                          </span>
                          {complement && (
                            <span className="rounded-md bg-[#E8E2D5] dark:bg-[#25332A] px-2 py-0.5 text-xs font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                              {complement}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs font-semibold text-[#525A54] dark:text-[#A4AEA6]">
                          {neighborhood} • {city} • CEP {cep}
                        </p>
                        {reference && (
                          <p className="mt-1 text-xs font-semibold text-[#B4482D] dark:text-[#FF7D4F]">
                            Ref: {reference}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 space-y-3 rounded-2xl border border-[#DDD5C7] dark:border-[#2A382E] bg-[#F2ECE1] dark:bg-[#121A14] p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[#2D352F] dark:text-[#D5DDD7]">
                          CEP
                        </label>
                        <input
                          type="text"
                          required
                          value={cep}
                          onChange={(e) => setCep(e.target.value)}
                          placeholder="00000-000"
                          className="w-full min-h-10 rounded-xl border border-[#D5CDBD] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] p-2.5 text-base lg:text-sm text-[#1F2921] dark:text-[#F2EFE9] outline-hidden font-semibold"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-[#2D352F] dark:text-[#D5DDD7]">
                          Rua / Avenida *
                        </label>
                        <input
                          type="text"
                          required
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Nome da sua rua"
                          className="w-full min-h-10 rounded-xl border border-[#D5CDBD] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] p-2.5 text-base lg:text-sm text-[#1F2921] dark:text-[#F2EFE9] outline-hidden font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[#2D352F] dark:text-[#D5DDD7]">
                          Número *
                        </label>
                        <input
                          type="text"
                          required
                          value={number}
                          onChange={(e) => setNumber(e.target.value)}
                          placeholder="123"
                          className="w-full min-h-10 rounded-xl border border-[#D5CDBD] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] p-2.5 text-base lg:text-sm text-[#1F2921] dark:text-[#F2EFE9] outline-hidden font-semibold"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[#2D352F] dark:text-[#D5DDD7]">
                          Complemento
                        </label>
                        <input
                          type="text"
                          value={complement}
                          onChange={(e) => setComplement(e.target.value)}
                          placeholder="Apto 45..."
                          className="w-full min-h-10 rounded-xl border border-[#D5CDBD] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] p-2.5 text-base lg:text-sm text-[#1F2921] dark:text-[#F2EFE9] outline-hidden font-semibold"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[#2D352F] dark:text-[#D5DDD7]">
                          Bairro *
                        </label>
                        <input
                          type="text"
                          required
                          value={neighborhood}
                          onChange={(e) => setNeighborhood(e.target.value)}
                          placeholder="Bairro"
                          className="w-full min-h-10 rounded-xl border border-[#D5CDBD] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] p-2.5 text-base lg:text-sm text-[#1F2921] dark:text-[#F2EFE9] outline-hidden font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[#2D352F] dark:text-[#D5DDD7]">
                          Cidade *
                        </label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Cidade"
                          className="w-full min-h-10 rounded-xl border border-[#D5CDBD] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] p-2.5 text-base lg:text-sm text-[#1F2921] dark:text-[#F2EFE9] outline-hidden font-semibold"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-[#2D352F] dark:text-[#D5DDD7]">
                          Ponto de referência
                        </label>
                        <input
                          type="text"
                          value={reference}
                          onChange={(e) => setReference(e.target.value)}
                          placeholder="Portaria com interfone..."
                          className="w-full min-h-10 rounded-xl border border-[#D5CDBD] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] p-2.5 text-base lg:text-sm text-[#1F2921] dark:text-[#F2EFE9] outline-hidden font-semibold"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (address.trim() && number.trim() && neighborhood.trim()) {
                            setCustomerData({
                              cep: cep.trim(),
                              address: `${address.trim()}, ${number.trim()}`,
                              complement: complement.trim(),
                              neighborhood: neighborhood.trim(),
                              city: city.trim(),
                              reference: reference.trim(),
                            })
                            saveGlobalProfile()
                            setIsEditingAddress(false)
                          }
                        }}
                        className="min-h-10 rounded-xl bg-[#1B2A20] dark:bg-[#15803D] px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition cursor-pointer"
                      >
                        Salvar endereço
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="mt-3 rounded-2xl border border-[#DDD5C7] dark:border-[#2A382E] bg-[#FAF8F5] dark:bg-[#1B241E] p-4 text-xs font-semibold">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                    <StoreIcon className="h-4 w-4" />
                    <span>Retirar no balcão da loja (Sem taxa de entrega)</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                    {store.address || "Rua Harmonia, 123 - Vila Madalena, São Paulo - SP"}
                  </p>
                </div>
              )}
            </section>

            {/* 3. FORMA DE PAGAMENTO */}
            <section className="border-t border-[#ECE7DE] dark:border-[#2A382E] pt-5">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1B2A20] dark:bg-[#15803D] text-white text-xs font-bold">
                  3
                </span>
                <h2 className="font-serif text-lg font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                  Forma de pagamento na entrega
                </h2>
              </div>

              <div className="space-y-2.5" role="radiogroup" aria-label="Forma de pagamento">
                {/* Pix */}
                <label
                  className={`relative flex cursor-pointer items-center justify-between gap-2 rounded-2xl border p-3.5 transition focus-within:ring-2 focus-within:ring-emerald-600 ${
                    paymentMethod === "pix"
                      ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/25 ring-1 ring-emerald-600 dark:border-emerald-500 dark:ring-emerald-500"
                      : "border-[#DED7CB] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] hover:border-[#C5BEB3]"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="pix"
                    checked={paymentMethod === "pix"}
                    onChange={() => setPaymentMethod("pix")}
                    className="sr-only"
                  />
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#32BCAD]/10 text-[#32BCAD] border border-[#32BCAD]/20">
                      <PixOfficialIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                        Pix
                      </h3>
                      <p className="text-xs font-semibold text-[#525A54] dark:text-[#A4AEA6]">
                        Pague direto para a chave da loja ou QR Code da maquininha
                      </p>
                    </div>
                  </div>
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                      paymentMethod === "pix"
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-[#C5BEB3] dark:border-[#4A5D4F]"
                    }`}
                  >
                    {paymentMethod === "pix" && <Check className="h-3.5 w-3.5" />}
                  </div>
                </label>

                {/* Cartão na maquininha */}
                <label
                  className={`relative flex cursor-pointer items-center justify-between gap-2 rounded-2xl border p-3.5 transition focus-within:ring-2 focus-within:ring-emerald-600 ${
                    paymentMethod === "credit_card"
                      ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/25 ring-1 ring-emerald-600 dark:border-emerald-500 dark:ring-emerald-500"
                      : "border-[#DED7CB] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] hover:border-[#C5BEB3]"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="credit_card"
                    checked={paymentMethod === "credit_card"}
                    onChange={() => setPaymentMethod("credit_card")}
                    className="sr-only"
                  />
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                          Cartão na maquininha
                        </h3>
                        <CardBrandsGroup />
                      </div>
                      <p className="text-xs font-semibold text-[#525A54] dark:text-[#A4AEA6] mt-0.5">
                        Crédito, débito ou refeição no ato da entrega / retirada
                      </p>
                    </div>
                  </div>
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                      paymentMethod === "credit_card"
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-[#C5BEB3] dark:border-[#4A5D4F]"
                    }`}
                  >
                    {paymentMethod === "credit_card" && <Check className="h-3.5 w-3.5" />}
                  </div>
                </label>

                {/* Dinheiro */}
                <label
                  className={`relative flex cursor-pointer items-center justify-between gap-2 rounded-2xl border p-3.5 transition focus-within:ring-2 focus-within:ring-emerald-600 ${
                    paymentMethod === "cash"
                      ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/25 ring-1 ring-emerald-600 dark:border-emerald-500 dark:ring-emerald-500"
                      : "border-[#DED7CB] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] hover:border-[#C5BEB3]"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={() => setPaymentMethod("cash")}
                    className="sr-only"
                  />
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40">
                      <Banknote className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                        Dinheiro na entrega
                      </h3>
                      <p className="text-xs font-semibold text-[#525A54] dark:text-[#A4AEA6]">
                        Pagamento em espécie ao receber
                      </p>
                    </div>
                  </div>
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                      paymentMethod === "cash"
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-[#C5BEB3] dark:border-[#4A5D4F]"
                    }`}
                  >
                    {paymentMethod === "cash" && <Check className="h-3.5 w-3.5" />}
                  </div>
                </label>

                {paymentMethod === "cash" && (
                  <div className="rounded-2xl border border-[#DDD5C7] dark:border-[#2A382E] bg-[#F2ECE1] dark:bg-[#121A14] p-4 text-xs font-semibold">
                    <label className="mb-1 block font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                      Precisa de troco para quanto? (Opcional)
                    </label>
                    <input
                      type="text"
                      value={changeFor}
                      onChange={(e) => setChangeFor(e.target.value)}
                      placeholder="Ex: R$ 50,00 ou R$ 100,00"
                      className="w-full min-h-10 rounded-xl border border-[#D5CDBD] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] p-2.5 text-base lg:text-sm text-[#1F2921] dark:text-[#F2EFE9] font-semibold outline-hidden focus:border-[#1B2A20] dark:focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Order Summary & Final Submit CTA */}
          <div className="flex flex-col justify-between bg-[#F2ECE1] dark:bg-[#121A14] p-4 sm:p-6 lg:col-span-5 lg:p-8">
            <div>
              <div className="flex items-center justify-between border-b border-[#D8CFBF] dark:border-[#2A382E] pb-4">
                <h3 className="font-serif text-xl font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                  Resumo do pedido
                </h3>
                <span className="text-xs font-semibold text-[#525A54] dark:text-[#A4AEA6]">
                  {items.length} {items.length === 1 ? "item" : "itens"}
                </span>
              </div>

              {/* Items List */}
              <div className="max-h-[320px] overflow-y-auto pr-1 storefront-scrollbar divide-y divide-[#E4DDD0] dark:divide-[#2A382E] py-2">
                {items.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <StorefrontImage src={item.image_url} alt={item.name} className="h-14 w-14 rounded-xl object-cover bg-white dark:bg-[#1B241E] border border-[#DDD5C7] dark:border-[#2A382E] shrink-0" fallbackClassName="h-14 w-14 rounded-xl border border-[#DDD5C7] dark:border-[#2A382E] shrink-0" iconClassName="h-5 w-5" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-bold text-[#1C261F] dark:text-[#F2EFE9] block truncate">
                          {item.name}
                        </span>
                        {item.portion && (
                          <span className="text-xs font-semibold text-[#525A54] dark:text-[#A4AEA6] block">
                            • {item.portion}
                          </span>
                        )}
                        <div className="mt-1.5 inline-flex items-center gap-1 rounded-lg border border-[#D5CDBD] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] px-1 py-0.5 text-xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            aria-label={`Diminuir quantidade de ${item.name}`}
                            className="flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-md text-[#4A534C] dark:text-[#CBD5E1] hover:text-black dark:hover:text-white cursor-pointer"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-5 text-center font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            aria-label={`Aumentar quantidade de ${item.name}`}
                            className="flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-md text-[#4A534C] dark:text-[#CBD5E1] hover:text-[#B4482D] dark:hover:text-[#FF7D4F] cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#1C261F] dark:text-[#F2EFE9] shrink-0">
                      {formatCurrency(item.unit_price_cents * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Subtotals */}
              <div className="mt-4 space-y-2 border-t border-[#D8CFBF] dark:border-[#2A382E] pt-4 text-xs font-semibold">
                <div className="flex justify-between font-semibold text-[#525A54] dark:text-[#A4AEA6]">
                  <span>Subtotal</span>
                  <span className="text-[#1C261F] dark:text-[#F2EFE9]">
                    {formatCurrency(subtotalCents)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-[#525A54] dark:text-[#A4AEA6]">
                  <span>Taxa de entrega</span>
                  <span className="text-[#1C261F] dark:text-[#F2EFE9]">
                    {deliveryMethod === "pickup" || deliveryFeeCents === 0
                      ? "Grátis"
                      : formatCurrency(deliveryFeeCents)}
                  </span>
                </div>
                {discountCents > 0 && (
                  <div className="flex justify-between text-[#166534] dark:text-[#4ADE80] font-semibold">
                    <span>Desconto promocional</span>
                    <span>- {formatCurrency(discountCents)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-[#E0D8CB] dark:border-[#2A382E] text-base font-bold text-[#1C261F] dark:text-[#F2EFE9]">
                  <span>Total a pagar</span>
                  <span className="text-lg font-bold text-[#1C261F] dark:text-[#4ADE80]">
                    {formatCurrency(totalCents)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Submit CTA */}
            <div className="mt-6 space-y-3 pt-4 border-t border-[#D8CFBF] dark:border-[#2A382E]">
              <div className="rounded-xl border border-[#DDD5C7] dark:border-[#2A382E] bg-white/80 dark:bg-[#1B241E] p-3 text-[11px] font-semibold text-[#525A54] dark:text-[#A4AEA6]">
                💡 <strong className="text-[#1C261F] dark:text-[#F2EFE9]">Pagamento na entrega/retirada:</strong> Você paga diretamente ao restaurante ao receber seu pedido.
              </div>

              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#B4482D] py-3.5 text-base font-bold text-white shadow-md transition hover:bg-[#9D3D25] disabled:opacity-50 cursor-pointer"
              >
                <span>
                  {isSubmitting
                    ? "Enviando pedido..."
                    : `Confirmar pedido • ${formatCurrency(totalCents)}`}
                </span>
                <Check className="h-5 w-5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
