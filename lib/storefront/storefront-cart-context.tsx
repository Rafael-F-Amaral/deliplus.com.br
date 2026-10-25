"use client"

import React, { createContext, useContext, useState } from "react"
import {
  CartItem,
  CustomerData,
  DeliveryMethod,
  PaymentMethodType,
  OrderConfirmationData,
  StorefrontProduct,
  StorefrontStore,
} from "@/types/storefront"
import { MOCK_CASA_NOMA_STORE } from "./mock-storefront-data"

export type ActiveModalType =
  | null
  | "product-detail"
  | "delivery-info"
  | "favorites"
  | "receiving-method"
  | "checkout-data"
  | "checkout-payment"
  | "order-confirmed"
  | "order-tracking"
  | "cart-drawer"

interface StorefrontCartContextValue {
  store: StorefrontStore
  items: CartItem[]
  itemsCount: number
  subtotalCents: number
  deliveryFeeCents: number
  discountCents: number
  totalCents: number
  couponCode: string
  appliedCoupon: string | null
  deliveryMethod: DeliveryMethod
  customerData: CustomerData
  activeModal: ActiveModalType
  selectedProduct: StorefrontProduct | null
  lastOrder: OrderConfirmationData | null
  favorites: string[]
  isFavorite: (productId: string) => boolean
  toggleFavorite: (productId: string) => void
  addToCart: (item: Omit<CartItem, "id">) => void
  updateQuantity: (id: string, delta: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
  setDeliveryMethod: (method: DeliveryMethod) => void
  setCustomerData: (data: Partial<CustomerData>) => void
  applyCoupon: (code: string) => { success: boolean; message: string }
  openProductDetail: (product: StorefrontProduct) => void
  openModal: (modal: ActiveModalType) => void
  closeModal: () => void
  proceedToCheckout: () => void
  confirmOrder: (paymentMethod: PaymentMethodType, changeForCents?: number) => Promise<void>
  repeatLastOrder: () => void
}

const StorefrontCartContext = createContext<StorefrontCartContextValue | null>(null)

export function StorefrontCartProvider({
  children,
  initialStore = MOCK_CASA_NOMA_STORE,
}: {
  children: React.ReactNode
  initialStore?: StorefrontStore
}) {
  const [store] = useState<StorefrontStore>(initialStore)

  // Seed default items in cart matching mockups (Bowl Noma + Chá da casa)
  const [items, setItems] = useState<CartItem[]>([
    {
      id: "cart-item-1",
      product_id: "prod-bowl-frango",
      name: "Bowl Noma",
      unit_price_cents: 3490,
      quantity: 1,
      image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&h=300&q=80",
      portion: "Individual (450g)",
      protein: "Tofu grelhado com gergelim",
      removed_ingredients: ["Sem tomate cereja"],
      selected_complements: [
        { id: "comp-molho", name: "Molho extra", price_cents: 0 },
      ],
      notes: "Molho bem servido por favor",
    },
    {
      id: "cart-item-2",
      product_id: "prod-cha-casa",
      name: "Chá da casa",
      unit_price_cents: 1290,
      quantity: 1,
      image_url: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&h=300&q=80",
      notes: "Gelado com bastante gelo",
    },
  ])

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("delivery")
  const [customerData, setCustomerDataState] = useState<CustomerData>({
    name: "Marina Souza",
    phone: "(11) 98765-4321",
    whatsapp: "(11) 98765-4321",
    email: "marina.souza@email.com",
    address: "Rua das Flores, 123",
    complement: "Apto 45",
    neighborhood: "Vila Madalena",
    city: "São Paulo",
    state: "SP",
    cep: "05432-001",
    reference: "Portaria com interfone",
  })

  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [discountCents, setDiscountCents] = useState<number>(0)
  const [couponCode, setCouponCode] = useState<string>("")
  const [activeModal, setActiveModal] = useState<ActiveModalType>(null)
  const [selectedProduct, setSelectedProduct] = useState<StorefrontProduct | null>(null)
  const [favorites, setFavorites] = useState<string[]>(["prod-bowl-frango", "prod-cha-casa"])

  // Default initial order confirmation matching mockup #1247
  const [lastOrder, setLastOrder] = useState<OrderConfirmationData | null>({
    order_id: "ord-mock-1247",
    display_id: "#1247",
    created_at: new Date().toISOString(),
    store_name: "Casa Noma",
    customer: {
      name: "Marina Souza",
      phone: "(11) 98765-4321",
      whatsapp: "(11) 98765-4321",
      email: "marina.souza@email.com",
      address: "Rua Harmonia, 125",
      complement: "Apto 12B",
      neighborhood: "Vila Madalena",
      city: "São Paulo",
      state: "SP",
      cep: "05435-000",
      reference: "Portaria com interfone",
    },
    delivery_method: "delivery",
    estimated_delivery_time: "13:00 e 13:30",
    items: [
      {
        id: "ord-item-1",
        product_id: "prod-bowl-frango",
        name: "Bowl Noma",
        unit_price_cents: 3490,
        quantity: 1,
        image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&h=300&q=80",
        protein: "Trocar frango grelhado por tofu grelhado",
        removed_ingredients: ["Sem tomate cereja"],
        selected_complements: [{ id: "comp-1", name: "Molho extra", price_cents: 0 }],
      },
      {
        id: "ord-item-2",
        product_id: "prod-cha-casa",
        name: "Chá da casa",
        unit_price_cents: 1290,
        quantity: 1,
        image_url: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&h=300&q=80",
        notes: "Gelado",
      },
    ],
    subtotal_cents: 4780,
    delivery_fee_cents: 690,
    discount_cents: 0,
    total_cents: 5470,
    payment_method: "pix",
    payment_status: "approved",
    pix_code: "00020126580014BR.GOV.BCB.PIX0136deliplus-pix-casa-noma520400005303986540589.905802BR5913Casa Noma Deli6009Sao Paulo62070503***6304E8A9",
  })

  const itemsCount = items.reduce((acc, item) => acc + item.quantity, 0)

  const subtotalCents = items.reduce(
    (acc, item) => acc + item.unit_price_cents * item.quantity,
    0
  )

  const isFreeDelivery =
    deliveryMethod === "pickup" ||
    (store.free_delivery_above_cents > 0 &&
      subtotalCents >= store.free_delivery_above_cents)

  const deliveryFeeCents =
    deliveryMethod === "pickup" ? 0 : isFreeDelivery ? 0 : store.delivery_fee_cents

  const totalCents = Math.max(0, subtotalCents + deliveryFeeCents - discountCents)

  const isFavorite = (productId: string) => favorites.includes(productId)

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    )
  }

  const addToCart = (newItem: Omit<CartItem, "id">) => {
    const id = `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    setItems((prev) => [...prev, { ...newItem, id }])
  }

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta
            return nextQty > 0 ? { ...item, quantity: nextQty } : null
          }
          return item
        })
        .filter(Boolean) as CartItem[]
    )
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const clearCart = () => {
    setItems([])
  }

  const setCustomerData = (partial: Partial<CustomerData>) => {
    setCustomerDataState((prev) => ({ ...prev, ...partial }))
  }

  const applyCoupon = (code: string) => {
    const clean = code.trim().toUpperCase()
    setCouponCode(clean)
    if (clean === "DELI10" || clean === "PRIMEIRA10") {
      setAppliedCoupon(clean)
      setDiscountCents(Math.round(subtotalCents * 0.1))
      return { success: true, message: "Cupom de 10% aplicado com sucesso!" }
    }
    if (clean === "FRETEGRATIS") {
      setAppliedCoupon(clean)
      setDiscountCents(deliveryFeeCents)
      return { success: true, message: "Cupom de Frete Grátis aplicado com sucesso!" }
    }
    return { success: false, message: "Cupom inválido ou expirado." }
  }

  const openProductDetail = (product: StorefrontProduct) => {
    setSelectedProduct(product)
    setActiveModal("product-detail")
  }

  const openModal = (modal: ActiveModalType) => {
    setActiveModal(modal)
  }

  const closeModal = () => {
    setActiveModal(null)
  }

  const proceedToCheckout = () => {
    if (items.length === 0) return
    setActiveModal("receiving-method")
  }

  const repeatLastOrder = () => {
    if (!lastOrder) return
    setItems(lastOrder.items.map((it, idx) => ({ ...it, id: `repeat-${idx}-${Date.now()}` })))
    setActiveModal("cart-drawer")
  }

  const confirmOrder = async (
    paymentMethod: PaymentMethodType,
    changeForCents?: number
  ) => {
    const newDisplayId = `#${Math.floor(1000 + Math.random() * 9000)}`
    const now = new Date()
    const etaMin = new Date(now.getTime() + 25 * 60000)
    const etaMax = new Date(now.getTime() + 45 * 60000)
    const formatTime = (d: Date) =>
      d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

    const orderRecord: OrderConfirmationData = {
      order_id: `ord-${Date.now()}`,
      display_id: newDisplayId,
      created_at: now.toISOString(),
      store_name: store.name,
      customer: customerData,
      delivery_method: deliveryMethod,
      estimated_delivery_time: `${formatTime(etaMin)} e ${formatTime(etaMax)}`,
      items: [...items],
      subtotal_cents: subtotalCents,
      delivery_fee_cents: deliveryFeeCents,
      discount_cents: discountCents,
      total_cents: totalCents,
      payment_method: paymentMethod,
      payment_status: paymentMethod === "pix" ? "approved" : "pending",
      pix_code: store.pix_key,
      change_for_cents: changeForCents,
    }

    setLastOrder(orderRecord)
    setActiveModal("order-confirmed")
  }

  return (
    <StorefrontCartContext.Provider
      value={{
        store,
        items,
        itemsCount,
        subtotalCents,
        deliveryFeeCents,
        discountCents,
        totalCents,
        couponCode,
        appliedCoupon,
        deliveryMethod,
        customerData,
        activeModal,
        selectedProduct,
        lastOrder,
        favorites,
        isFavorite,
        toggleFavorite,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        setDeliveryMethod,
        setCustomerData,
        applyCoupon,
        openProductDetail,
        openModal,
        closeModal,
        proceedToCheckout,
        confirmOrder,
        repeatLastOrder,
      }}
    >
      {children}
    </StorefrontCartContext.Provider>
  )
}

export function useStorefrontCart() {
  const context = useContext(StorefrontCartContext)
  if (!context) {
    throw new Error("useStorefrontCart must be used within StorefrontCartProvider")
  }
  return context
}
