export interface StorefrontComplement {
  id: string
  name: string
  description?: string
  price_cents: number
}

export interface StorefrontSizeOption {
  id: string
  name: string
  price_cents: number
  promo_price_cents?: number
}

export interface StorefrontPortionOption {
  id: string
  name: string
  description?: string
  extra_price_cents: number
}

export interface StorefrontProteinOption {
  id: string
  name: string
  description?: string
  extra_price_cents: number
}

export interface StorefrontProduct {
  id: string
  category_id: string
  category_name: string
  name: string
  description: string
  price_cents: number
  promo_price_cents?: number
  in_promo?: boolean
  discount_percentage?: number
  image_url: string
  images?: string[]
  tags?: string[]
  is_featured?: boolean
  is_combo?: boolean
  free_delivery_eligible?: boolean
  portions?: StorefrontPortionOption[]
  sizes?: StorefrontSizeOption[]
  proteins?: StorefrontProteinOption[]
  removable_ingredients?: string[]
  complements?: StorefrontComplement[]
}

export interface StorefrontCategory {
  id: string
  name: string
  icon?: string
}

export interface StorefrontOfferBanner {
  id: string
  title: string
  subtitle: string
  combo_name: string
  discount_badge: string
  original_price_cents: number
  promo_price_cents: number
  image_url: string
}

export interface StorefrontStore {
  id: string
  name: string
  slug: string
  bio: string
  category: string
  tags: string[]
  logo_url: string
  banner_url: string
  address: string
  phone: string
  instagram: string
  social_links?: {
    whatsapp?: string
    instagram?: string
    facebook?: string
    youtube?: string
    tiktok?: string
    kwai?: string
  }
  rating: number
  reviews_count: number
  is_open: boolean
  prep_time: string
  delivery_fee_cents: number
  free_delivery_above_cents: number
  min_order_cents: number
  accepts_delivery: boolean
  accepts_pickup: boolean
  accept_pix: boolean
  accept_card: boolean
  accept_cash: boolean
  pix_key: string
  business_hours_text: string
}

export interface CartItem {
  id: string
  product_id: string
  name: string
  unit_price_cents: number
  quantity: number
  image_url: string
  portion?: string
  size?: string
  protein?: string
  removed_ingredients?: string[]
  selected_complements?: StorefrontComplement[]
  notes?: string
}

export interface CustomerData {
  name: string
  phone: string
  whatsapp: string
  email?: string
  address: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  cep?: string
  reference?: string
}

export type DeliveryMethod = "delivery" | "pickup"

export type PaymentMethodType = "pix" | "credit_card" | "cash"

export interface OrderConfirmationData {
  order_id: string
  display_id: string
  created_at: string
  store_name: string
  customer: CustomerData
  delivery_method: DeliveryMethod
  estimated_delivery_time: string
  items: CartItem[]
  subtotal_cents: number
  delivery_fee_cents: number
  discount_cents: number
  total_cents: number
  payment_method: PaymentMethodType
  payment_status: "approved" | "pending"
  pix_code?: string
  pix_expires_at?: string
  change_for_cents?: number
}
