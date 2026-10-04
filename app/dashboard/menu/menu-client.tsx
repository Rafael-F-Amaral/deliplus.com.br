"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import {
  Search,
  PlusCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Upload,
  Trash2,
  Calendar,
  Pencil,
  Check,
  X,
  Tag,
  Maximize2,
  Camera,
  Sparkles,
  Play
} from "lucide-react"
import { Switch } from "@/components/ui/switch"

export interface MenuItem {
  id: string
  name: string
  category: "Bowls" | "Bebidas" | "Sobremesas" | "Entradas" | string
  categories?: string[]
  categoryBg: string
  categoryText: string
  image: string
  description: string
  originalPrice: string
  promoPrice: string | null
  inPromo: boolean
  isAvailable: boolean
  dailyLimit: number | null
  remaining: number | null
  availabilitySchedule?: string
  promoSchedule?: string
  promoIndefinite?: boolean
  promoStartDate?: string
  promoEndDate?: string
  campaignId?: string
  campaignName?: string
}

export interface TourStep {
  targetId: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

export const TOUR_STEPS: TourStep[] = [
  {
    targetId: "tour-filters",
    title: "Busca e Filtros Inteligentes",
    description: "Filtre seus pratos por categoria, veja apenas os itens em promoção ou disponíveis, e localize qualquer item em segundos digitando na busca.",
    icon: Search
  },
  {
    targetId: "tour-product-info",
    title: "Edição com um Toque",
    description: "Clique diretamente no nome ou descrição do prato para editar os dados e associar de 1 a 3 categorias sem precisar abrir formulários complexos.",
    icon: Pencil
  },
  {
    targetId: "tour-photo-action",
    title: "Foto do Produto",
    description: "Toque na foto para ampliar em tela cheia ou trocar rapidamente por upload ou arrastando um arquivo direto do seu computador.",
    icon: Camera
  },
  {
    targetId: "tour-price-inline",
    title: "Preço e Estoque sem Salvar",
    description: "Clique no preço original ou na quantidade para alterar o valor na hora. Não precisa de botão salvar: é só digitar e pronto!",
    icon: Tag
  },
  {
    targetId: "tour-promo-action",
    title: "Preço Promocional e Período",
    description: "Defina descontos em porcentagem com cálculo automático. Programe períodos de validade com data de início e término ou mantenha por prazo indeterminado.",
    icon: Calendar
  },
  {
    targetId: "tour-availability-switch",
    title: "Disponibilidade Instantânea",
    description: "Pause ou ative as vendas de qualquer produto na hora através do interruptor, sem sair da tela.",
    icon: Check
  },
  {
    targetId: "tour-delete-action",
    title: "Exclusão com Confirmação",
    description: "Remova produtos que não deseja mais no cardápio através do botão de lixeira laranja com modal de confirmação para evitar erros acidentais.",
    icon: Trash2
  }
]

export const TOUR_PROMO_MODAL_STEPS: TourStep[] = [
  {
    targetId: "tour-promo-modal-switch",
    title: "Interruptor de Ativação",
    description: "Ative ou pause a promoção instantaneamente. Ao desativar, todas as regras e datas continuam salvas, mas o desconto fica pausado para os clientes.",
    icon: Check
  },
  {
    targetId: "tour-promo-modal-calc",
    title: "Desconto em % e Economia",
    description: "Digite o desconto desejado ou toque nos atalhos rápidos (5% a 30%). O DeliPlus calcula automaticamente o novo preço e o valor economizado.",
    icon: Tag
  },
  {
    targetId: "tour-promo-modal-schedule",
    title: "Período ou Prazo Indeterminado",
    description: "Programe a promoção para começar e terminar em datas específicas, ou marque 'Prazo indeterminado' para mantê-la sem data de término.",
    icon: Calendar
  },
  {
    targetId: "tour-promo-modal-confirm",
    title: "Confirmar Alterações",
    description: "Clique em Confirmar para aplicar a promoção imediatamente. Os novos valores serão refletidos no cardápio e na sua loja online.",
    icon: Check
  }
]

export const TOUR_NEW_ITEM_MODAL_STEPS: TourStep[] = [
  {
    targetId: "tour-new-item-image",
    title: "Foto do Produto",
    description: "Suba uma foto atrativa do produto por upload ou arrastando direto do seu computador. Você pode trocar ou remover a foto a qualquer momento.",
    icon: Camera
  },
  {
    targetId: "tour-new-item-name-price",
    title: "Nome e Preço Original",
    description: "Preencha o nome do prato e o preço padrão de venda. Esses campos são a base de exibição no seu cardápio.",
    icon: Tag
  },
  {
    targetId: "tour-new-item-categories",
    title: "Categorias e Tags Livres",
    description: "Adicione categorias livres separadas por vírgula ou toque nas sugestões rápidas. O cliente poderá filtrar os pratos por essas tags.",
    icon: Pencil
  },
  {
    targetId: "tour-new-item-desc-limit",
    title: "Descrição e Limite Diário",
    description: "Detalhe ingredientes e modo de preparo, e ative um limite diário de vendas se o produto tiver estoque limitado por dia.",
    icon: Check
  }
]

export function getCategoryBadgeStyle(catName: string): { bg: string; text: string } {
  const lower = catName.toLowerCase()
  if (lower.includes("bowl")) return { bg: "bg-[#EBF5ED]", text: "text-[#477A55]" }
  if (lower.includes("bebid")) return { bg: "bg-[#FDF4E7]", text: "text-[#BA732F]" }
  if (lower.includes("sobrem")) return { bg: "bg-[#F7EDF9]", text: "text-[#8E5296]" }
  if (lower.includes("entrad")) return { bg: "bg-[#EFF6FF]", text: "text-[#2563EB]" }
  if (lower.includes("promo") || lower.includes("oferta")) return { bg: "bg-[#FDF2F0]", text: "text-[#CB5A3C]" }
  if (lower.includes("mais pedido") || lower.includes("destaque")) return { bg: "bg-[#FEF3C7]", text: "text-[#B45309]" }
  if (lower.includes("organ") || lower.includes("vegan")) return { bg: "bg-[#DCFCE7]", text: "text-[#15803D]" }
  if (lower.includes("gluten") || lower.includes("glúten")) return { bg: "bg-[#F1F5F9]", text: "text-[#475569]" }
  return { bg: "bg-gray-100", text: "text-gray-700" }
}

export function getItemCategories(item: MenuItem): string[] {
  if (item.categories && item.categories.length > 0) {
    return item.categories.slice(0, 3)
  }
  return item.category ? [item.category] : []
}

const INITIAL_ITEMS: MenuItem[] = [
  {
    id: "item-1",
    name: "M Bowl Noma",
    category: "Bowls",
    categories: ["Bowls", "Mais pedido"],
    categoryBg: "bg-[#EBF5ED]",
    categoryText: "text-[#477A55]",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80",
    description: "Salmão grelhado, arroz cateto, edamame, manga, repolho roxo, cenoura, gergelim e molho da casa.",
    originalPrice: "R$ 49,90",
    promoPrice: "R$ 42,90",
    inPromo: true,
    isAvailable: true,
    dailyLimit: null,
    remaining: null,
    availabilitySchedule: "Todos os dias, 11:00 – 23:00",
    promoSchedule: "Até 15/07/2025"
  },
  {
    id: "item-2",
    name: "Chá da casa",
    category: "Bebidas",
    categories: ["Bebidas", "Orgânico"],
    categoryBg: "bg-[#FDF4E7]",
    categoryText: "text-[#BA732F]",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80",
    description: "Blend de ervas orgânicas da estação. Leve, aromático e reconfortante.",
    originalPrice: "R$ 12,90",
    promoPrice: "R$ 10,90",
    inPromo: true,
    isAvailable: true,
    dailyLimit: 50,
    remaining: 0,
    availabilitySchedule: "Todos os dias, 07:00 – 22:00",
    promoSchedule: "Até 01/06/2025"
  },
  {
    id: "item-3",
    name: "Brownie de chocolate",
    category: "Sobremesas",
    categoryBg: "bg-[#F7EDF9]",
    categoryText: "text-[#8E5296]",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&auto=format&fit=crop&q=80",
    description: "Brownie úmido com cacau belga e gotas de chocolate nobre.",
    originalPrice: "R$ 16,90",
    promoPrice: null,
    inPromo: false,
    isAvailable: true,
    dailyLimit: null,
    remaining: null,
    availabilitySchedule: "Todos os dias, 11:00 – 22:00",
    promoSchedule: ""
  },
  {
    id: "item-4",
    name: "Suco detox verde",
    category: "Bebidas",
    categoryBg: "bg-[#FDF4E7]",
    categoryText: "text-[#BA732F]",
    image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&auto=format&fit=crop&q=80",
    description: "Couve, maçã verde, pepino, limão e gengibre prensados a frio.",
    originalPrice: "R$ 15,90",
    promoPrice: null,
    inPromo: false,
    isAvailable: true,
    dailyLimit: 30,
    remaining: 18,
    availabilitySchedule: "Todos os dias, 08:00 – 20:00",
    promoSchedule: ""
  },
  {
    id: "item-5",
    name: "Poke Clássico de Atum",
    category: "Bowls",
    categories: ["Bowls", "Destaque"],
    categoryBg: "bg-[#EBF5ED]",
    categoryText: "text-[#477A55]",
    image: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=400&auto=format&fit=crop&q=80",
    description: "Atum fresco marinado, arroz shari, avocado, nori, pepino e molho shoyu especial.",
    originalPrice: "R$ 52,90",
    promoPrice: "R$ 47,90",
    inPromo: true,
    isAvailable: true,
    dailyLimit: 40,
    remaining: 12,
    availabilitySchedule: "Todos os dias, 11:30 – 22:30",
    promoSchedule: "Até 30/08/2025"
  },
  {
    id: "item-6",
    name: "Bowl Frango Teriyaki",
    category: "Bowls",
    categoryBg: "bg-[#EBF5ED]",
    categoryText: "text-[#477A55]",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&auto=format&fit=crop&q=80",
    description: "Filé de frango grelhado ao molho teriyaki, quinoa real, brócolis tostado e lâminas de amêndoas.",
    originalPrice: "R$ 44,90",
    promoPrice: null,
    inPromo: false,
    isAvailable: true,
    dailyLimit: 35,
    remaining: 20,
    availabilitySchedule: "Todos os dias, 11:00 – 23:00",
    promoSchedule: ""
  },
  {
    id: "item-7",
    name: "Açaí Especial Noma 400ml",
    category: "Sobremesas",
    categoryBg: "bg-[#F7EDF9]",
    categoryText: "text-[#8E5296]",
    image: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&auto=format&fit=crop&q=80",
    description: "Açaí puro batido com banana, granola crocante artesanal, morangos frescos e mel orgânico.",
    originalPrice: "R$ 28,00",
    promoPrice: "R$ 24,00",
    inPromo: true,
    isAvailable: true,
    dailyLimit: 60,
    remaining: 45,
    availabilitySchedule: "Todos os dias, 12:00 – 22:00",
    promoSchedule: "Até 20/07/2025"
  },
  {
    id: "item-8",
    name: "Kombucha Hibisco e Limão",
    category: "Bebidas",
    categoryBg: "bg-[#FDF4E7]",
    categoryText: "text-[#BA732F]",
    image: "https://images.unsplash.com/photo-1556881286-fc6915169721?w=400&auto=format&fit=crop&q=80",
    description: "Bebida fermentada naturalmente probiótica com infusão de flores de hibisco.",
    originalPrice: "R$ 18,00",
    promoPrice: null,
    inPromo: false,
    isAvailable: false,
    dailyLimit: 25,
    remaining: 0,
    availabilitySchedule: "Todos os dias, 08:00 – 22:00",
    promoSchedule: ""
  },
  {
    id: "item-9",
    name: "Dadinhos de Tapioca",
    category: "Entradas",
    categories: ["Entradas", "Mais pedido"],
    categoryBg: "bg-[#EFF6FF]",
    categoryText: "text-[#2563EB]",
    image: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&auto=format&fit=crop&q=80",
    description: "Queijo coalho e tapioca granulada crocantes, acompanhados de geleia de pimenta defumada.",
    originalPrice: "R$ 26,00",
    promoPrice: "R$ 22,00",
    inPromo: true,
    isAvailable: true,
    dailyLimit: null,
    remaining: null,
    availabilitySchedule: "Todos os dias, 12:00 – 23:00",
    promoSchedule: "Até 10/08/2025"
  },
  {
    id: "item-10",
    name: "Bowl Vegano Raízes",
    category: "Bowls",
    categories: ["Bowls", "Vegano"],
    categoryBg: "bg-[#EBF5ED]",
    categoryText: "text-[#477A55]",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80",
    description: "Abóbora assada, grão de bico crocante, rúcula, castanhas e molho tahine artesanal.",
    originalPrice: "R$ 39,90",
    promoPrice: "R$ 34,90",
    inPromo: true,
    isAvailable: true,
    dailyLimit: null,
    remaining: null,
    availabilitySchedule: "Todos os dias, 11:00 – 22:00",
    promoSchedule: "Até 31/07/2025"
  },
  {
    id: "item-11",
    name: "Cheesecake Frutas Vermelhas",
    category: "Sobremesas",
    categoryBg: "bg-[#F7EDF9]",
    categoryText: "text-[#8E5296]",
    image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&auto=format&fit=crop&q=80",
    description: "Base crocante de amêndoas com creme leve de cream cheese e calda artesanal de amoras.",
    originalPrice: "R$ 22,00",
    promoPrice: null,
    inPromo: false,
    isAvailable: false,
    dailyLimit: null,
    remaining: null,
    availabilitySchedule: "Todos os dias, 12:00 – 22:00",
    promoSchedule: ""
  },
  {
    id: "item-12",
    name: "Edamame ao Sal Grosso",
    category: "Entradas",
    categoryBg: "bg-[#EFF6FF]",
    categoryText: "text-[#2563EB]",
    image: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&auto=format&fit=crop&q=80",
    description: "Vagens frescas de soja no vapor finalizadas com flor de sal e óleo de gergelim tostado.",
    originalPrice: "R$ 19,90",
    promoPrice: null,
    inPromo: false,
    isAvailable: true,
    dailyLimit: null,
    remaining: null,
    availabilitySchedule: "Todos os dias, 11:30 – 23:00",
    promoSchedule: ""
  },
  {
    id: "item-13",
    name: "Água de Coco Natural",
    category: "Bebidas",
    categoryBg: "bg-[#FDF4E7]",
    categoryText: "text-[#BA732F]",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80",
    description: "Água de coco 100% natural servida bem gelada (300ml).",
    originalPrice: "R$ 11,00",
    promoPrice: null,
    inPromo: false,
    isAvailable: true,
    dailyLimit: null,
    remaining: null,
    availabilitySchedule: "Todos os dias, 08:00 – 23:00",
    promoSchedule: ""
  },
  {
    id: "item-14",
    name: "Wrap de Frango com Cream Cheese",
    category: "Entradas",
    categoryBg: "bg-[#EFF6FF]",
    categoryText: "text-[#2563EB]",
    image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400&auto=format&fit=crop&q=80",
    description: "Pão folha integral, tiras de peito de frango grelhado, cream cheese, alface romana e tomate.",
    originalPrice: "R$ 32,00",
    promoPrice: null,
    inPromo: false,
    isAvailable: true,
    dailyLimit: 30,
    remaining: 14,
    availabilitySchedule: "Todos os dias, 11:00 – 22:30",
    promoSchedule: ""
  },
  {
    id: "item-15",
    name: "Pudim de Leite Artesanal",
    category: "Sobremesas",
    categoryBg: "bg-[#F7EDF9]",
    categoryText: "text-[#8E5296]",
    image: "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=400&auto=format&fit=crop&q=80",
    description: "Pudim cremoso sem furinhos com calda clássica de caramelo dourado.",
    originalPrice: "R$ 14,00",
    promoPrice: null,
    inPromo: false,
    isAvailable: true,
    dailyLimit: 20,
    remaining: 5,
    availabilitySchedule: "Todos os dias, 11:30 – 22:00",
    promoSchedule: ""
  },
  {
    id: "item-16",
    name: "Bowl Salmão Fresh",
    category: "Bowls",
    categoryBg: "bg-[#EBF5ED]",
    categoryText: "text-[#477A55]",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80",
    description: "Cubos de salmão fresco marinado no limão siciliano, arroz integral, manga e cebolinha.",
    originalPrice: "R$ 56,00",
    promoPrice: "R$ 49,90",
    inPromo: true,
    isAvailable: true,
    dailyLimit: null,
    remaining: null,
    availabilitySchedule: "Todos os dias, 11:30 – 23:00",
    promoSchedule: "Até 31/08/2025"
  }
]

function parseCurrency(str: string): number {
  if (!str) return 0
  const clean = str.replace(/[^\d,.-]/g, "").replace(",", ".")
  return parseFloat(clean) || 0
}

function formatCurrency(num: number): string {
  return `R$ ${num.toFixed(2).replace(".", ",")}`
}

function getDiscountPercentage(original: string, promo: string | null): number {
  if (!promo) return 0
  const orig = parseCurrency(original)
  const p = parseCurrency(promo)
  if (orig <= 0 || p <= 0 || p >= orig) return 0
  return Math.round(((orig - p) / orig) * 100)
}

function formatPromoPeriod(
  startDateStr: string,
  endDateStr: string,
  isIndefinite: boolean
): { periodText: string; totalDays: number } {
  if (isIndefinite) {
    return {
      periodText: "Prazo indeterminado",
      totalDays: Infinity
    }
  }

  if (!startDateStr && !endDateStr) {
    return {
      periodText: "Prazo indeterminado",
      totalDays: Infinity
    }
  }

  const formatDateBR = (isoDate: string) => {
    if (!isoDate) return ""
    const parts = isoDate.split("-")
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return isoDate
  }

  const startBR = formatDateBR(startDateStr)
  const endBR = formatDateBR(endDateStr)

  let totalDays = 0
  if (startDateStr && endDateStr) {
    const start = new Date(`${startDateStr}T00:00:00`)
    const end = new Date(`${endDateStr}T23:59:59`)
    const diffMs = end.getTime() - start.getTime()
    totalDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)))
  }

  const periodText = startBR && endBR
    ? `${startBR} até ${endBR} (${totalDays} ${totalDays === 1 ? "dia" : "dias"})`
    : startBR
    ? `A partir de ${startBR}`
    : `Até ${endBR}`

  return {
    periodText,
    totalDays
  }
}

interface MenuClientProps {
  storeSlug?: string
  storeName?: string
}

export default function MenuClient({ storeSlug = "casa-noma", storeName = "Casa Noma" }: MenuClientProps) {
  const [items, setItems] = useState<MenuItem[]>(INITIAL_ITEMS)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [availabilityFilter, setAvailabilityFilter] = useState<"todos" | "disponiveis" | "promocao">("todos")
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
  const categoryMenuRef = useRef<HTMLDivElement>(null)

  // Pagination (11 items per page: fills container height smoothly without scrollbar, matching Estoque)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 11

  // 3-dots actions menu state
  const [openActionId, setOpenActionId] = useState<string | null>(null)

  // Modal: Edit or Create item
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [itemToEdit, setItemToEdit] = useState<MenuItem | null>(null)

  // Form states inside Modal (Novo Item / Editar Item)
  const [formName, setFormName] = useState("")
  const [formCategories, setFormCategories] = useState<string[]>(["Bowls"])
  const [formCategoryInput, setFormCategoryInput] = useState("")
  const [formImage, setFormImage] = useState("")
  const [formOriginalPrice, setFormOriginalPrice] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formDailyLimit, setFormDailyLimit] = useState("")
  const [formHasDailyLimit, setFormHasDailyLimit] = useState(false)
  const [newItemIsDragging, setNewItemIsDragging] = useState(false)
  const newItemFileInputRef = useRef<HTMLInputElement>(null)

  // Modal: Delete confirmation
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null)

  // Photo interaction states (Ampliar imagem & Trocar imagem)
  const [openPhotoMenuId, setOpenPhotoMenuId] = useState<string | null>(null)
  const [zoomedItem, setZoomedItem] = useState<MenuItem | null>(null)
  const [itemToChangeImage, setItemToChangeImage] = useState<MenuItem | null>(null)
  const [newImageUrl, setNewImageUrl] = useState<string>("")
  const [isDragging, setIsDragging] = useState(false)
  const [showDeletePhotoConfirm, setShowDeletePhotoConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Preço Promocional: Modal de Porcentagem de Desconto e Programação
  const [discountModalItem, setDiscountModalItem] = useState<MenuItem | null>(null)
  const [discountPercentInput, setDiscountPercentInput] = useState<string>("15")
  const [promoIsActive, setPromoIsActive] = useState<boolean>(false)
  const [promoIndefinite, setPromoIndefinite] = useState<boolean>(true)
  const [promoStartDate, setPromoStartDate] = useState<string>(() => new Date().toISOString().split("T")[0])
  const [promoEndDate, setPromoEndDate] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().split("T")[0]
  })

  // Edição rápida inline (Preço original e Quantidade)
  const [inlineEditingCell, setInlineEditingCell] = useState<{ id: string; field: "originalPrice" | "dailyLimit" } | null>(null)
  const [inlineEditValue, setInlineEditValue] = useState<string>("")
  const [inlineSuccessCellId, setInlineSuccessCellId] = useState<string | null>(null)

  // Modal Pequeno: Editar Produto (Nome, Descrição e 1 a 3 Categorias)
  const [prodModalItem, setProdModalItem] = useState<MenuItem | null>(null)
  const [prodModalName, setProdModalName] = useState("")
  const [prodModalDesc, setProdModalDesc] = useState("")
  const [prodModalCategories, setProdModalCategories] = useState<string[]>([])
  const [prodModalNewCat, setProdModalNewCat] = useState("")

  // Toast notification
  const [notification, setNotification] = useState<string | null>(null)

  // Tutorial / Spotlight states
  const [showTourPrompt, setShowTourPrompt] = useState<boolean>(true)
  const [tourStep, setTourStep] = useState<number | null>(null)
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null)
  const [modalTourType, setModalTourType] = useState<"promo" | "new_item" | null>(null)
  const [modalTourStep, setModalTourStep] = useState<number | null>(null)

  // Current active step across main tour and in-modal tours
  const activeTourStep = useMemo(() => {
    if (modalTourType === "promo" && modalTourStep !== null) {
      return TOUR_PROMO_MODAL_STEPS[modalTourStep] || null
    }
    if (modalTourType === "new_item" && modalTourStep !== null) {
      return TOUR_NEW_ITEM_MODAL_STEPS[modalTourStep] || null
    }
    if (tourStep !== null) {
      return TOUR_STEPS[tourStep] || null
    }
    return null
  }, [modalTourType, modalTourStep, tourStep])

  const activeTourTotalSteps = useMemo(() => {
    if (modalTourType === "promo") return TOUR_PROMO_MODAL_STEPS.length
    if (modalTourType === "new_item") return TOUR_NEW_ITEM_MODAL_STEPS.length
    return TOUR_STEPS.length
  }, [modalTourType])

  const activeTourCurrentIndex = useMemo(() => {
    if (modalTourType !== null) return modalTourStep ?? 0
    return tourStep ?? 0
  }, [modalTourType, modalTourStep, tourStep])

  const handleNextTour = () => {
    if (modalTourType === "promo" && modalTourStep !== null) {
      if (modalTourStep < TOUR_PROMO_MODAL_STEPS.length - 1) {
        setModalTourStep(modalTourStep + 1)
      } else {
        setModalTourType(null)
        setModalTourStep(null)
        setDiscountModalItem(null)
        if (tourStep !== null) {
          setTourStep(5)
        }
      }
    } else if (modalTourType === "new_item" && modalTourStep !== null) {
      if (modalTourStep < TOUR_NEW_ITEM_MODAL_STEPS.length - 1) {
        setModalTourStep(modalTourStep + 1)
      } else {
        setModalTourType(null)
        setModalTourStep(null)
      }
    } else if (tourStep !== null) {
      if (tourStep < TOUR_STEPS.length - 1) {
        setTourStep(tourStep + 1)
      } else {
        setTourStep(null)
        setNotification("🎉 Tutorial concluído! Bom trabalho.")
        setTimeout(() => setNotification(null), 3500)
      }
    }
  }

  const handlePrevTour = () => {
    if (modalTourType !== null && modalTourStep !== null) {
      if (modalTourStep > 0) {
        setModalTourStep(modalTourStep - 1)
      }
    } else if (tourStep !== null && tourStep > 0) {
      setTourStep(tourStep - 1)
    }
  }

  const handleCloseTour = () => {
    if (modalTourType !== null) {
      setModalTourType(null)
      setModalTourStep(null)
    } else {
      setTourStep(null)
    }
  }

  // Spotlight position tracker & keyboard listener
  useEffect(() => {
    if (!activeTourStep) return

    const updateRect = () => {
      // Find element (desktop or mobile)
      let el = document.getElementById(activeTourStep.targetId)
      if (!el || el.offsetParent === null) {
        const mEl = document.getElementById(`m-${activeTourStep.targetId}`)
        if (mEl && mEl.offsetParent !== null) {
          el = mEl
        }
      }

      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" })
        const rect = el.getBoundingClientRect()
        setSpotlightRect(rect)
      } else {
        setSpotlightRect(null)
      }
    }

    const rafId = requestAnimationFrame(updateRect)
    const timer = setTimeout(updateRect, 120)

    window.addEventListener("resize", updateRect)
    window.addEventListener("scroll", updateRect, true)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseTour()
      } else if (e.key === "ArrowRight") {
        handleNextTour()
      } else if (e.key === "ArrowLeft") {
        handlePrevTour()
      }
    }
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(timer)
      window.removeEventListener("resize", updateRect)
      window.removeEventListener("scroll", updateRect, true)
      window.removeEventListener("keydown", handleKeyDown)
      setSpotlightRect(null)
    }
  }, [activeTourStep])

  const getTourCardStyle = () => {
    if (typeof window === "undefined") {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
    }

    const isMobile = window.innerWidth < 768
    if (isMobile) {
      return {
        bottom: 24,
        left: 16,
        right: 16,
        maxWidth: "calc(100vw - 32px)",
        margin: "0 auto"
      }
    }

    if (!spotlightRect) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)"
      }
    }

    const cardWidth = 380
    const estimatedCardHeight = 260
    const padding = 16

    const spaceBelow = window.innerHeight - (spotlightRect.bottom + padding)
    const spaceAbove = spotlightRect.top - padding

    let top = 0
    let transform: string | undefined = undefined

    if (spaceBelow >= estimatedCardHeight || spaceBelow >= spaceAbove) {
      top = spotlightRect.bottom + padding
    } else {
      top = Math.max(estimatedCardHeight + padding, spotlightRect.top - padding)
      transform = "translateY(-100%)"
    }

    let left = spotlightRect.left + spotlightRect.width / 2 - cardWidth / 2
    left = Math.max(padding, Math.min(left, window.innerWidth - cardWidth - padding))

    return {
      top,
      left,
      width: cardWidth,
      transform
    }
  }

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(target as Node)) {
        setIsCategoryMenuOpen(false)
      }
      if (!target.closest(".action-menu-container")) {
        setOpenActionId(null)
      }
      if (!target.closest(".photo-menu-container")) {
        setOpenPhotoMenuId(null)
      }
    }
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  // Categories list
  const categories = useMemo(() => {
    return [
      { id: "all", name: "Todas as categorias" },
      { id: "Bowls", name: "Bowls", color: "#477A55" },
      { id: "Bebidas", name: "Bebidas", color: "#BA732F" },
      { id: "Sobremesas", name: "Sobremesas", color: "#8E5296" },
      { id: "Entradas", name: "Entradas", color: "#2563EB" }
    ]
  }, [])

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = item.name.toLowerCase().includes(query)
        const matchesDesc = item.description.toLowerCase().includes(query)
        if (!matchesName && !matchesDesc) return false
      }

      if (selectedCategory !== "all") {
        const itemCats = getItemCategories(item)
        if (!itemCats.some((c) => c.toLowerCase() === selectedCategory.toLowerCase())) {
          return false
        }
      }

      if (availabilityFilter === "disponiveis" && !item.isAvailable) {
        return false
      }

      if (availabilityFilter === "promocao" && !item.inPromo) {
        return false
      }

      return true
    })
  }, [items, searchQuery, selectedCategory, availabilityFilter])

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE))
  const paginatedItems = useMemo(() => {
    return filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  }, [filteredItems, currentPage, ITEMS_PER_PAGE])

  // Toggle availability switch directly from table
  const handleToggleAvailability = (id: string, e?: React.MouseEvent | React.SyntheticEvent) => {
    e?.stopPropagation()
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
      )
    )
  }

  // Adicionar categoria livre ao formulário de item (suporta vírgulas)
  const handleAddCategoryToForm = (catStr: string) => {
    if (!catStr) return
    const parts = catStr.split(",").map((c) => c.trim()).filter(Boolean)
    setFormCategories((prev) => {
      const next = [...prev]
      for (const p of parts) {
        if (!next.some((c) => c.toLowerCase() === p.toLowerCase())) {
          next.push(p)
        }
      }
      return next
    })
  }

  // Processar upload de imagem no modal de novo item
  const handleProcessNewItemImage = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP).")
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        setFormImage(e.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  // Open Edit Modal
  const handleOpenEditModal = (item: MenuItem) => {
    setItemToEdit(item)
    setFormName(item.name)
    const cats = getItemCategories(item)
    setFormCategories(cats.length > 0 ? cats : [item.category || "Bowls"])
    setFormCategoryInput("")
    setFormImage(item.image)
    setFormOriginalPrice(item.originalPrice)
    setFormDescription(item.description)
    setFormDailyLimit(item.dailyLimit !== null ? item.dailyLimit.toString() : "")
    setFormHasDailyLimit(item.dailyLimit !== null)
    setIsModalOpen(true)
  }

  // Open New Item Modal
  const handleOpenNewItemModal = () => {
    setItemToEdit(null)
    setFormName("")
    setFormCategories(["Bowls"])
    setFormCategoryInput("")
    setFormImage("")
    setFormOriginalPrice("R$ 35,00")
    setFormDescription("")
    setFormDailyLimit("")
    setFormHasDailyLimit(false)
    setIsModalOpen(true)
  }

  // Save changes from Modal
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return

    const limitNum = formHasDailyLimit && formDailyLimit.trim() ? parseInt(formDailyLimit, 10) || null : null

    // Incorporar qualquer texto restante no input de categoria livre
    let finalCategories = [...formCategories]
    if (formCategoryInput.trim()) {
      const extraParts = formCategoryInput.split(",").map((s) => s.trim()).filter(Boolean)
      for (const p of extraParts) {
        if (!finalCategories.some((c) => c.toLowerCase() === p.toLowerCase())) {
          finalCategories.push(p)
        }
      }
    }
    if (finalCategories.length === 0) {
      finalCategories = ["Geral"]
    }
    const mainCategory = finalCategories[0]
    const badgeStyle = getCategoryBadgeStyle(mainCategory)

    if (itemToEdit) {
      // Editing existing item
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === itemToEdit.id) {
            return {
              ...item,
              name: formName.trim(),
              category: mainCategory,
              categories: finalCategories,
              categoryBg: badgeStyle.bg,
              categoryText: badgeStyle.text,
              image: formImage || item.image,
              originalPrice: formOriginalPrice.trim() || item.originalPrice,
              description: formDescription.trim(),
              dailyLimit: limitNum,
              remaining: limitNum !== null ? (item.remaining ?? limitNum) : null
            }
          }
          return item
        })
      )
      setNotification("Item atualizado com sucesso!")
    } else {
      // Creating new item
      const newItem: MenuItem = {
        id: `item-${Date.now()}`,
        name: formName.trim(),
        category: mainCategory,
        categories: finalCategories,
        categoryBg: badgeStyle.bg,
        categoryText: badgeStyle.text,
        image: formImage || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80",
        description: formDescription.trim() || "Item adicionado ao cardápio.",
        originalPrice: formOriginalPrice.trim() || "R$ 35,00",
        promoPrice: null,
        inPromo: false,
        isAvailable: true,
        dailyLimit: limitNum,
        remaining: limitNum,
        availabilitySchedule: "Todos os dias, 11:00 – 23:00",
        promoSchedule: ""
      }
      setItems((prev) => [newItem, ...prev])
      setNotification("Novo item adicionado ao cardápio!")
    }

    setIsModalOpen(false)
    setTimeout(() => setNotification(null), 3000)
  }


  // Salvar imagem a partir do modal dedicado de troca de foto
  const handleSaveChangeImage = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!itemToChangeImage) return

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemToChangeImage.id) {
          return {
            ...item,
            image: newImageUrl.trim()
          }
        }
        return item
      })
    )
    setItemToChangeImage(null)
    setNewImageUrl("")
    setShowDeletePhotoConfirm(false)
    setNotification(newImageUrl.trim() ? "Foto do produto atualizada!" : "Foto removida com sucesso!")
    setTimeout(() => setNotification(null), 3000)
  }

  // Processar arquivo de imagem do computador
  const handleProcessImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP).")
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        setNewImageUrl(e.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleDropImage = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessImageFile(e.dataTransfer.files[0])
    }
  }

  // Preço Promocional: Abrir modal de desconto em % e agendamento
  const handleOpenDiscountModal = (item: MenuItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setDiscountModalItem(item)
    const currentDiscount = getDiscountPercentage(item.originalPrice, item.promoPrice)
    setDiscountPercentInput(currentDiscount > 0 ? currentDiscount.toString() : "15")

    // Define o switch conforme o estado real atual do produto:
    // Se o item NÃO estiver em promoção ativa, abre com switch OFF ("Promoção desativada") e conteúdo apagado!
    const isCurrentlyInPromo = Boolean(item.inPromo && item.promoPrice)
    setPromoIsActive(isCurrentlyInPromo)

    if (typeof item.promoIndefinite === "boolean") {
      setPromoIndefinite(item.promoIndefinite)
    } else {
      const isIndefinite = !item.promoSchedule || item.promoSchedule === "Prazo indeterminado" || !item.promoSchedule.includes("até")
      setPromoIndefinite(isIndefinite)
    }

    if (item.promoStartDate) {
      setPromoStartDate(item.promoStartDate)
    } else {
      const today = new Date().toISOString().split("T")[0]
      setPromoStartDate(today)
    }

    if (item.promoEndDate) {
      setPromoEndDate(item.promoEndDate)
    } else {
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      setPromoEndDate(nextWeek.toISOString().split("T")[0])
    }
  }

  const handleApplyDiscount = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!discountModalItem) return

    if (!promoIsActive) {
      handleRemoveDiscount()
      return
    }

    const pct = parseFloat(discountPercentInput)
    if (isNaN(pct) || pct <= 0) {
      handleRemoveDiscount()
      return
    }
    const cappedPct = Math.min(99, Math.max(1, Math.round(pct)))
    const orig = parseCurrency(discountModalItem.originalPrice)
    const calculatedPromo = orig * (1 - cappedPct / 100)
    const formattedPromo = formatCurrency(calculatedPromo)

    const periodInfo = formatPromoPeriod(promoStartDate, promoEndDate, promoIndefinite)
    const scheduleText = periodInfo.periodText

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === discountModalItem.id) {
          return {
            ...item,
            promoPrice: formattedPromo,
            inPromo: true,
            promoSchedule: scheduleText,
            promoIndefinite: promoIndefinite,
            promoStartDate: promoStartDate,
            promoEndDate: promoEndDate
          }
        }
        return item
      })
    )
    setDiscountModalItem(null)
    setNotification(`Promoção confirmada! Preço promocional: ${formattedPromo}`)
    setTimeout(() => setNotification(null), 3000)
  }

  const handleRemoveDiscount = () => {
    if (!discountModalItem) return
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === discountModalItem.id) {
          return {
            ...item,
            promoPrice: null,
            inPromo: false,
            promoSchedule: "",
            promoIndefinite: promoIndefinite,
            promoStartDate: promoStartDate,
            promoEndDate: promoEndDate
          }
        }
        return item
      })
    )
    setDiscountModalItem(null)
    setNotification("Preço promocional desativado.")
    setTimeout(() => setNotification(null), 3000)
  }

  // Formatar entrada de moeda em tempo real (R$ 0,00)
  const formatCurrencyInput = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, "")
    if (!digits) return ""
    const cents = parseInt(digits, 10)
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }

  // Iniciar edição rápida inline (Preço original e Quantidade)
  const startInlineEdit = (item: MenuItem, field: "originalPrice" | "dailyLimit", e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setInlineEditingCell({ id: item.id, field })
    if (field === "originalPrice") {
      setInlineEditValue(item.originalPrice)
    } else if (field === "dailyLimit") {
      setInlineEditValue(item.dailyLimit !== null ? item.dailyLimit.toString() : "")
    }
  }

  // Salvar alteração rápida inline sem botão de salvar
  const saveInlineEdit = (item: MenuItem, field: "originalPrice" | "dailyLimit") => {
    const val = inlineEditValue
    setInlineEditingCell(null)

    if (field === "originalPrice") {
      const digits = val.replace(/\D/g, "")
      if (!digits) return
      const cents = parseInt(digits, 10)
      if (cents <= 0) return
      const formattedPrice = (cents / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      })
      if (formattedPrice === item.originalPrice) return

      setItems((prev) =>
        prev.map((it) => {
          if (it.id === item.id) {
            let updatedPromo = it.promoPrice
            if (it.inPromo && it.promoPrice) {
              const oldPct = getDiscountPercentage(it.originalPrice, it.promoPrice)
              if (oldPct > 0) {
                const newOrig = cents / 100
                const calculated = newOrig * (1 - oldPct / 100)
                updatedPromo = formatCurrency(calculated)
              }
            }
            return {
              ...it,
              originalPrice: formattedPrice,
              promoPrice: updatedPromo
            }
          }
          return it
        })
      )
      setInlineSuccessCellId(`${item.id}-originalPrice`)
      setTimeout(() => setInlineSuccessCellId(null), 1500)
    } else if (field === "dailyLimit") {
      const trimmed = val.trim()
      let newLimit: number | null = null
      if (trimmed !== "") {
        const parsed = parseInt(trimmed, 10)
        if (isNaN(parsed) || parsed < 0) return
        newLimit = parsed
      }
      if (newLimit === item.dailyLimit) return

      setItems((prev) =>
        prev.map((it) => {
          if (it.id === item.id) {
            return {
              ...it,
              dailyLimit: newLimit,
              remaining: newLimit !== null ? (it.remaining !== null ? Math.min(it.remaining, newLimit) : newLimit) : null
            }
          }
          return it
        })
      )
      setInlineSuccessCellId(`${item.id}-dailyLimit`)
      setTimeout(() => setInlineSuccessCellId(null), 1500)
    }
  }

  // Abrir Modal Pequeno para Editar Produto (Nome, Descrição e Categorias)
  const handleOpenProductModal = (item: MenuItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setProdModalItem(item)
    setProdModalName(item.name)
    setProdModalDesc(item.description)
    const cats = getItemCategories(item)
    setProdModalCategories(cats.length > 0 ? cats : [item.category || "Bowls"])
    setProdModalNewCat("")
  }

  // Adicionar categoria ao Produto Modal (mínimo 1, máximo 3)
  const handleAddCatToProdModal = (catName: string) => {
    const trimmed = catName.trim()
    if (!trimmed) return
    if (prodModalCategories.length >= 3) return
    if (prodModalCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return
    setProdModalCategories((prev) => [...prev, trimmed])
    setProdModalNewCat("")
  }

  // Salvar alterações do Modal Pequeno de Produto
  const handleSaveProductModal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prodModalItem || !prodModalName.trim()) return
    if (prodModalCategories.length < 1) return

    const mainCategory = prodModalCategories[0]
    const badgeStyle = getCategoryBadgeStyle(mainCategory)

    setItems((prev) =>
      prev.map((it) => {
        if (it.id === prodModalItem.id) {
          return {
            ...it,
            name: prodModalName.trim(),
            description: prodModalDesc.trim(),
            category: mainCategory,
            categories: prodModalCategories,
            categoryBg: badgeStyle.bg,
            categoryText: badgeStyle.text
          }
        }
        return it
      })
    )
    setProdModalItem(null)
    setNotification("Produto atualizado com sucesso!")
    setTimeout(() => setNotification(null), 3000)
  }

  return (
    <div className="flex flex-col w-full h-full max-h-full max-w-[1400px] mx-auto p-3 md:px-6 pt-3 md:pt-5 pb-3 overflow-hidden justify-between font-sans">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-[120] bg-[#16A34A] text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-semibold transition-all">
          <Check className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Area (Orange title matching DeliPlus logo & Estoque) */}
      <div className="flex flex-col mb-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <h1 className="text-3xl md:text-4xl font-serif text-[#CB5A3C] tracking-tight">Cardápio</h1>
          
          {/* Tooltip Icon & Popover */}
          <div className="relative group inline-block">
            <div className="w-5 h-5 rounded-full bg-[#2E4233] text-white flex items-center justify-center text-[12px] font-extrabold leading-none shadow-sm cursor-help hover:scale-105 transition-transform">
              ?
            </div>
            <div className="absolute top-full left-0 mt-2 w-80 p-4 bg-[#2E4233] text-white rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
              <p className="text-[13px] text-white mb-2 leading-relaxed">
                <span className="font-extrabold text-white">Dica:</span> Aqui você gerencia os pratos, bebidas e itens do cardápio visíveis para seus clientes.
              </p>
              <div className="flex flex-col gap-2 pt-2 border-t border-white/10 text-[12px] text-white">
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5"></span>
                  <span>Ative ou pause a disponibilidade de itens em tempo real pelo switch.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5"></span>
                  <span>Defina preços promocionais e limites diários de produção.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5"></span>
                  <span>Toque ou clique direto nas informações para editar produto, preço e quantidade.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botão de Tutorial Interativo / Spotlight */}
          <button
            type="button"
            onClick={() => {
              setShowTourPrompt(false)
              setTourStep(0)
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F0] border border-[#E9E4D4] hover:border-[#2E4233] text-[#2E4233] text-xs font-semibold hover:bg-white shadow-2xs transition-all cursor-pointer group ml-1"
            title="Abrir o tutorial interativo do Cardápio"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#CB5A3C] group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Tutorial interativo</span>
            <span className="sm:hidden">Tutorial</span>
          </button>
        </div>
        <p className="text-[#2E4233] text-sm md:text-base font-medium mt-0.5">
          Gerencie os produtos, preços e disponibilidade do seu cardápio.
        </p>
      </div>

      {/* Controls Row: Filters, Search & Novo Item (Same pattern as Estoque) */}
      <div id="tour-filters" className="flex flex-col sm:flex-row items-center justify-between gap-2.5 mb-2.5 shrink-0 z-30 relative bg-white/40 sm:bg-transparent p-1.5 sm:p-0 rounded-2xl">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-visible relative flex-wrap">
          <button 
            type="button"
            onClick={() => { setAvailabilityFilter("todos"); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm transition-colors cursor-pointer ${
              availabilityFilter === "todos" 
                ? "bg-[#2E4233] text-white" 
                : "bg-white border border-[#E9E4D4] text-gray-500 hover:bg-[#F8F6EF]"
            }`}
          >
            Todos
          </button>

          <button 
            type="button"
            onClick={() => { setAvailabilityFilter("disponiveis"); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm transition-colors cursor-pointer ${
              availabilityFilter === "disponiveis" 
                ? "bg-[#2E4233] text-white" 
                : "bg-white border border-[#E9E4D4] text-gray-500 hover:bg-[#F8F6EF]"
            }`}
          >
            Disponíveis
          </button>

          <button 
            type="button"
            onClick={() => { setAvailabilityFilter("promocao"); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm transition-colors cursor-pointer ${
              availabilityFilter === "promocao" 
                ? "bg-[#2E4233] text-white" 
                : "bg-white border border-[#E9E4D4] text-gray-500 hover:bg-[#F8F6EF]"
            }`}
          >
            Em promoção
          </button>
          
          {/* Custom Category Dropdown */}
          <div className="relative" ref={categoryMenuRef}>
            <button 
              type="button"
              onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
              className={`px-3.5 py-1.5 border rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer ${
                selectedCategory !== "all" 
                  ? "bg-[#2E4233] text-white border-[#2E4233] shadow-sm" 
                  : "bg-white border-[#E9E4D4] text-gray-500 hover:bg-[#F8F6EF]"
              }`}
            >
              {selectedCategory !== "all" 
                ? (categories.find((c) => c.id === selectedCategory)?.name || "Categoria") 
                : "Por categoria"}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCategoryMenuOpen ? "rotate-180" : ""}`} />
            </button>
            
            {isCategoryMenuOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-52 bg-white border border-[#E9E4D4] rounded-xl shadow-xl z-50 overflow-hidden py-1 max-h-60 overflow-y-auto">
                {categories.map((cat) => (
                  <button 
                    key={cat.id}
                    type="button"
                    onClick={() => { 
                      setSelectedCategory(cat.id); 
                      setIsCategoryMenuOpen(false); 
                      setCurrentPage(1); 
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-gray-50 flex items-center justify-between transition-colors cursor-pointer ${
                      selectedCategory === cat.id 
                        ? "text-[#CB5A3C] font-bold bg-orange-50/40" 
                        : "text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      {cat.color && (
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      )}
                      <span className="truncate">{cat.name}</span>
                    </div>
                    {selectedCategory === cat.id && (
                      <Check className="w-3.5 h-3.5 text-[#CB5A3C] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Search Bar & + Novo Item button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-[240px]">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Buscar no cardápio" 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E9E4D4] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233] transition-all shadow-sm"
            />
          </div>
          <button 
            type="button"
            onClick={handleOpenNewItemModal} 
            className="flex shrink-0 items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#2E4233] hover:bg-[#233327] text-white rounded-xl font-semibold text-xs transition-all duration-300 shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Novo item</span>
          </button>
        </div>
      </div>

      {/* Main Table Container: Stretches to fill available screen height without outer scrollbar */}
      <div className="hidden md:flex flex-col flex-1 h-full min-h-0 bg-white border border-[#E9E4D4] rounded-2xl shadow-sm overflow-hidden justify-between">
        <div className="w-full overflow-x-auto overflow-y-hidden">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#FAF8F0] border-b border-[#E9E4D4]">
              <tr className="text-[14px] font-semibold text-[#2E4233]">
                <th className="px-4 py-2.5 w-[80px]">Foto</th>
                <th className="px-4 py-2.5">Produto</th>
                <th className="px-4 py-2.5 text-left w-[120px] whitespace-nowrap">Preço original</th>
                <th className="px-4 py-2.5 text-left w-[140px] whitespace-nowrap">Preço promocional</th>
                <th className="px-3 py-2.5 text-center w-[110px] whitespace-nowrap">Disponibilidade</th>
                <th className="px-4 py-2.5 text-center w-[130px] whitespace-nowrap">Quantidade</th>
                <th className="px-4 py-2.5 text-right w-[60px]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E4D4] border-b border-[#E9E4D4]">
              {paginatedItems.map((item, itemIdx) => {
                const isPaused = !item.isAvailable
                return (
                  <tr
                    key={item.id}
                    className={`border-b border-[#E9E4D4] hover:bg-gray-50/60 transition-colors ${
                      isPaused ? "bg-stone-50/30" : ""
                    }`}
                  >
                    {/* Foto Thumbnail com Menu: Ampliar / Trocar */}
                    <td id={itemIdx === 0 ? "tour-photo-action" : undefined} className={`px-4 py-2 align-middle transition-opacity duration-200 ${isPaused ? "opacity-35 grayscale-[20%]" : "opacity-100"}`}>
                      <div className="photo-menu-container relative inline-block">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenPhotoMenuId(openPhotoMenuId === item.id ? null : item.id)
                          }}
                          className="w-[58px] h-[44px] rounded-xl overflow-hidden border border-[#E9E4D4] shadow-2xs shrink-0 bg-gray-50 block cursor-pointer group/photo relative hover:border-[#2E4233] transition-all"
                          title="Clique para ampliar ou trocar a foto"
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                              <Camera className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover/photo:bg-black/25 flex items-center justify-center transition-colors">
                            <Maximize2 className="w-3.5 h-3.5 text-white opacity-0 group-hover/photo:opacity-100 transition-opacity drop-shadow" />
                          </div>
                        </button>

                        {/* Menu de duas escolhas: Ampliar e Trocar imagem */}
                        {openPhotoMenuId === item.id && (
                          <div className="absolute left-0 top-full mt-1.5 w-44 bg-[#2E4233] text-white rounded-xl shadow-2xl border border-[#233327] z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenPhotoMenuId(null)
                                setZoomedItem(item)
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
                            >
                              <Maximize2 className="w-3.5 h-3.5 text-white/80" />
                              <span>Ampliar imagem</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenPhotoMenuId(null)
                                setItemToChangeImage(item)
                                setNewImageUrl(item.image)
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
                            >
                              <Camera className="w-3.5 h-3.5 text-white/80" />
                              <span>Trocar imagem</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Produto com badges de categoria ao lado do nome - Clicável para abrir modal pequeno de edição */}
                    <td id={itemIdx === 0 ? "tour-product-info" : undefined} className={`px-4 py-2 align-middle transition-opacity duration-200 ${isPaused ? "opacity-35" : "opacity-100"}`}>
                      <div 
                        onClick={(e) => handleOpenProductModal(item, e)}
                        className="group/prod flex flex-col pr-2 cursor-pointer p-1.5 -m-1.5 rounded-xl hover:bg-[#FAF8F0] transition-colors"
                        title="Toque ou clique para editar nome, descrição e categorias"
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-[#2E4233] text-[15px] leading-tight group-hover/prod:underline decoration-[#2E4233]/40 underline-offset-2">
                            {item.name}
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-[#2E4233] shrink-0" />
                          {getItemCategories(item).map((cat, idx) => {
                            const style = getCategoryBadgeStyle(cat)
                            return (
                              <span
                                key={idx}
                                className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wide ${style.bg} ${style.text}`}
                              >
                                {cat}
                              </span>
                            )
                          })}
                        </div>
                        <span className="text-[12px] text-gray-500 leading-relaxed line-clamp-1 mt-1 max-w-[360px]">
                          {item.description}
                        </span>
                      </div>
                    </td>

                    {/* Preço original com edição inline automática */}
                    <td id={itemIdx === 0 ? "tour-price-inline" : undefined} className={`px-4 py-2 align-middle text-left whitespace-nowrap transition-opacity duration-200 ${isPaused ? "opacity-35" : "opacity-100"}`}>
                      {inlineEditingCell?.id === item.id && inlineEditingCell?.field === "originalPrice" ? (
                        <input
                          type="text"
                          autoFocus
                          value={inlineEditValue}
                          onChange={(e) => setInlineEditValue(formatCurrencyInput(e.target.value))}
                          onBlur={() => saveInlineEdit(item, "originalPrice")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveInlineEdit(item, "originalPrice")
                            if (e.key === "Escape") setInlineEditingCell(null)
                          }}
                          className="w-28 px-2.5 py-1 text-[14px] font-bold text-[#2E4233] bg-white border-2 border-[#2E4233] rounded-lg shadow-sm focus:outline-none"
                        />
                      ) : (
                        <div
                          onClick={(e) => startInlineEdit(item, "originalPrice", e)}
                          className="group/orig inline-flex items-center gap-1.5 cursor-pointer py-1 px-1.5 -mx-1.5 rounded-lg hover:bg-[#FAF8F0] transition-colors"
                          title="Toque ou clique para alterar o preço original"
                        >
                          <span className="text-[14px] font-medium text-gray-700 group-hover/orig:text-[#2E4233]">
                            {item.originalPrice}
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-[#2E4233] shrink-0" />
                          {inlineSuccessCellId === `${item.id}-originalPrice` && (
                            <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0 animate-in fade-in" />
                          )}
                        </div>
                      )}
                    </td>

                    {/* Preço promocional em Laranja da Logo com link sublinhado "Editar Promoção" */}
                    <td id={itemIdx === 0 ? "tour-promo-action" : undefined} className={`px-4 py-2 align-middle text-left whitespace-nowrap transition-opacity duration-200 ${isPaused ? "opacity-35" : "opacity-100"}`}>
                      <div className="flex flex-col items-start gap-0.5">
                        {item.promoPrice ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[14.5px] font-bold text-[#CB5A3C]">
                              {item.promoPrice}
                            </span>
                            <span className="text-[10px] font-bold bg-[#FDF2F0] text-[#CB5A3C] border border-[#CB5A3C]/20 px-1.5 py-0.5 rounded-full">
                              -{getDiscountPercentage(item.originalPrice, item.promoPrice)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-[13px] text-gray-400 font-medium">
                            Sem promoção
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            handleOpenDiscountModal(item, e)
                            if (tourStep === 4) {
                              setModalTourType("promo")
                              setModalTourStep(0)
                            }
                          }}
                          className="text-[11.5px] font-semibold text-[#CB5A3C] underline decoration-[#CB5A3C]/60 hover:decoration-[#CB5A3C] hover:text-[#b0482e] transition-all cursor-pointer text-left"
                        >
                          Editar Promoção
                        </button>
                      </div>
                    </td>

                    {/* Disponibilidade Switch (NÃO apagado: full opacity-100) */}
                    <td id={itemIdx === 0 ? "tour-availability-switch" : undefined} className="px-3 py-2 align-middle text-center opacity-100" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col items-center justify-center">
                        <Switch
                          checked={item.isAvailable}
                          onClick={(e) => handleToggleAvailability(item.id, e)}
                          onCheckedChange={() => handleToggleAvailability(item.id)}
                          aria-label={`Alternar disponibilidade de ${item.name}`}
                        />
                        <span
                          className={`text-[11px] font-semibold mt-0.5 transition-colors ${
                            item.isAvailable ? "text-[#2E4233]" : "text-[#CB5A3C]"
                          }`}
                        >
                          {item.isAvailable ? "Disponível" : "Pausado"}
                        </span>
                      </div>
                    </td>

                    {/* Quantidade com edição inline rápida */}
                    <td className={`px-4 py-2 align-middle text-center whitespace-nowrap transition-opacity duration-200 ${isPaused ? "opacity-35" : "opacity-100"}`}>
                      {inlineEditingCell?.id === item.id && inlineEditingCell?.field === "dailyLimit" ? (
                        <input
                          type="number"
                          min="0"
                          autoFocus
                          value={inlineEditValue}
                          placeholder="Ilimitado"
                          onChange={(e) => setInlineEditValue(e.target.value)}
                          onBlur={() => saveInlineEdit(item, "dailyLimit")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveInlineEdit(item, "dailyLimit")
                            if (e.key === "Escape") setInlineEditingCell(null)
                          }}
                          className="w-20 px-2 py-1 text-center text-[13.5px] font-bold text-[#2E4233] bg-white border-2 border-[#2E4233] rounded-lg shadow-sm focus:outline-none"
                        />
                      ) : (
                        <div
                          onClick={(e) => startInlineEdit(item, "dailyLimit", e)}
                          className="group/qty inline-flex flex-col items-center justify-center cursor-pointer py-1 px-2 -mx-1 rounded-lg hover:bg-[#FAF8F0] transition-colors"
                          title="Toque ou clique para alterar o limite de quantidade diária"
                        >
                          <div className="flex items-center gap-1">
                            {item.dailyLimit !== null ? (
                              item.remaining === 0 ? (
                                <span className="text-[13.5px] font-bold text-[#CB5A3C]">
                                  0 restantes
                                </span>
                              ) : (
                                <span className="text-[13.5px] font-bold text-[#16A34A]">
                                  {item.remaining ?? item.dailyLimit} restantes
                                </span>
                              )
                            ) : (
                              <span className="text-[13px] text-gray-400 font-medium">
                                Sem limite
                              </span>
                            )}
                            <ChevronDown className="w-3.5 h-3.5 text-[#2E4233] shrink-0" />
                            {inlineSuccessCellId === `${item.id}-dailyLimit` && (
                              <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0 animate-in fade-in" />
                            )}
                          </div>
                          <span className="text-[11px] text-gray-400 font-medium">
                            {item.dailyLimit !== null ? `Limite: ${item.dailyLimit} un.` : "Ilimitado"}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Ações: Lixinho laranja de excluir direto com modal de confirmação */}
                    <td id={itemIdx === 0 ? "tour-delete-action" : undefined} className="px-4 py-2 text-right opacity-100" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setItemToDelete(item)
                        }}
                        title="Excluir produto do cardápio"
                        className="p-1.5 text-[#CB5A3C] hover:bg-[#CB5A3C]/10 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center group"
                      >
                        <Trash2 className="w-4 h-4 text-[#CB5A3C] group-hover:scale-110 transition-transform" />
                      </button>
                    </td>
                  </tr>
                )
              })}

              {/* Linhas vazias com tracinhos para preencher a grade até a paginação */}
              {filteredItems.length > 0 &&
                Array.from({ length: Math.max(0, ITEMS_PER_PAGE - paginatedItems.length) }).map((_, idx) => (
                  <tr
                    key={`empty-slot-${idx}`}
                    className="border-b border-[#E9E4D4] h-[60px]"
                  >
                    {/* Foto */}
                    <td className="px-4 py-2 align-middle">
                      <span className="text-[14px] text-gray-300 font-medium">—</span>
                    </td>

                    {/* Produto & Descrição */}
                    <td className="px-4 py-2 align-middle">
                      <span className="text-[14px] text-gray-300 font-medium">—</span>
                    </td>

                    {/* Preço original */}
                    <td className="px-4 py-2 align-middle text-left whitespace-nowrap">
                      <span className="text-[14px] text-gray-300 font-medium">—</span>
                    </td>

                    {/* Preço promocional */}
                    <td className="px-4 py-2 align-middle text-left whitespace-nowrap">
                      <span className="text-[14px] text-gray-300 font-medium">—</span>
                    </td>

                    {/* Disponibilidade */}
                    <td className="px-3 py-2 align-middle text-center">
                      <span className="text-[14px] text-gray-300 font-medium">—</span>
                    </td>

                    {/* Limite & Restantes */}
                    <td className="px-4 py-2 align-middle text-center whitespace-nowrap">
                      <span className="text-[14px] text-gray-300 font-medium">—</span>
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-2 text-right">
                      <span className="text-[14px] text-gray-300 font-medium pr-2">—</span>
                    </td>
                  </tr>
                ))}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 text-sm">
                    Nenhum item encontrado no cardápio.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls pinned at bottom (Centered) */}
        <div className="relative flex justify-center items-center px-6 py-2.5 border-t border-[#E9E4D4] bg-[#FAF8F0]/30 shrink-0 min-h-[44px]">
          <span className="hidden sm:inline-block absolute left-6 text-xs text-gray-500 font-medium">
            Mostrando {filteredItems.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)} de {filteredItems.length} itens
          </span>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${
                    currentPage === i + 1 
                      ? "bg-[#CB5A3C] text-white shadow-sm" 
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-[#E9E4D4]"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Card List View (Matching Estoque mobile responsive behavior) */}
      <div className="md:hidden flex flex-col flex-1 h-full min-h-0 bg-white border border-[#E9E4D4] rounded-2xl overflow-hidden shadow-sm justify-between">
        <div className="overflow-y-auto divide-y divide-[#E9E4D4]">
          {paginatedItems.map((item, itemIdx) => {
            const isPaused = !item.isAvailable
            return (
              <div
                key={item.id}
                className={`p-3 flex flex-col gap-2 transition-colors ${
                  isPaused ? "bg-stone-50/30" : ""
                }`}
              >
                {/* Detalhes do Produto (Apagado quando desativado) */}
                <div
                  className={`flex items-start gap-3 transition-opacity duration-200 ${
                    isPaused ? "opacity-35 grayscale-[20%]" : "opacity-100"
                  }`}
                >
                  {/* Foto Thumbnail com Menu: Ampliar / Trocar */}
                  <div id={itemIdx === 0 ? "m-tour-photo-action" : undefined} className="photo-menu-container relative shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenPhotoMenuId(openPhotoMenuId === `m-${item.id}` ? null : `m-${item.id}`)
                      }}
                      className="w-14 h-14 rounded-xl overflow-hidden border border-[#E9E4D4] shrink-0 block relative group/mphoto cursor-pointer active:scale-95 transition-all bg-gray-50"
                      title="Toque para ampliar ou trocar a foto"
                    >
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                          <Camera className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover/mphoto:opacity-100 transition-opacity">
                        <Maximize2 className="w-4 h-4 text-white drop-shadow" />
                      </div>
                    </button>

                    {/* Menu de duas escolhas: Ampliar e Trocar imagem */}
                    {openPhotoMenuId === `m-${item.id}` && (
                      <div className="absolute left-0 top-full mt-1.5 w-44 bg-[#2E4233] text-white rounded-xl shadow-2xl border border-[#233327] z-50 py-1.5 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenPhotoMenuId(null)
                            setZoomedItem(item)
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-white/80" />
                          <span>Ampliar imagem</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenPhotoMenuId(null)
                            setItemToChangeImage(item)
                            setNewImageUrl(item.image)
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5 text-white/80" />
                          <span>Trocar imagem</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Toque no Produto abre o Modal Pequeno de Edição */}
                    <div 
                      id={itemIdx === 0 ? "m-tour-product-info" : undefined}
                      onClick={(e) => handleOpenProductModal(item, e)}
                      className="cursor-pointer group/mprod"
                      title="Toque para editar nome, descrição e categorias"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="font-bold text-[#2E4233] text-sm truncate group-hover/mprod:underline">
                            {item.name}
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-[#2E4233] shrink-0" />
                        </div>
                        <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                          {getItemCategories(item).map((cat, idx) => {
                            const style = getCategoryBadgeStyle(cat)
                            return (
                              <span
                                key={idx}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${style.bg} ${style.text}`}
                              >
                                {cat}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>
                    </div>

                    {/* Preços e Quantidade */}
                    <div className="flex items-start justify-between gap-2 mt-2 pt-1.5 border-t border-gray-100 flex-wrap">
                      <div className="flex flex-col gap-1">
                        {/* Preço original inline */}
                        <div id={itemIdx === 0 ? "m-tour-price-inline" : undefined} className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold text-gray-400">Orig:</span>
                          {inlineEditingCell?.id === item.id && inlineEditingCell?.field === "originalPrice" ? (
                            <input
                              type="text"
                              autoFocus
                              value={inlineEditValue}
                              onChange={(e) => setInlineEditValue(formatCurrencyInput(e.target.value))}
                              onBlur={() => saveInlineEdit(item, "originalPrice")}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveInlineEdit(item, "originalPrice")
                                if (e.key === "Escape") setInlineEditingCell(null)
                              }}
                              className="w-20 px-1 py-0.5 text-xs font-bold text-[#2E4233] bg-white border border-[#2E4233] rounded"
                            />
                          ) : (
                            <div 
                              onClick={(e) => startInlineEdit(item, "originalPrice", e)}
                              className="flex items-center gap-1 cursor-pointer"
                              title="Toque para editar preço original"
                            >
                              <span className="text-xs font-bold text-[#2E4233]">{item.originalPrice}</span>
                              <ChevronDown className="w-3 h-3 text-[#2E4233] shrink-0" />
                              {inlineSuccessCellId === `${item.id}-originalPrice` && (
                                <Check className="w-3 h-3 text-[#16A34A] shrink-0" />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Preço Promocional em Laranja da Logo + Link Editar Promoção */}
                        <div id={itemIdx === 0 ? "m-tour-promo-action" : undefined} className="flex flex-col items-start">
                          {item.promoPrice ? (
                            <span className="text-xs font-bold text-[#CB5A3C] bg-[#FDF2F0] border border-[#CB5A3C]/20 px-1.5 py-0.5 rounded">
                              {item.promoPrice} (-{getDiscountPercentage(item.originalPrice, item.promoPrice)}%)
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-400 font-medium">Sem promoção</span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              handleOpenDiscountModal(item, e)
                              if (tourStep === 4) {
                                setModalTourType("promo")
                                setModalTourStep(0)
                              }
                            }}
                            className="text-[11px] font-semibold text-[#CB5A3C] underline decoration-[#CB5A3C]/60 hover:decoration-[#CB5A3C] mt-0.5 cursor-pointer text-left"
                          >
                            Editar Promoção
                          </button>
                        </div>
                      </div>

                      {/* Quantidade mobile com edição rápida */}
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Estoque diário</span>
                        {inlineEditingCell?.id === item.id && inlineEditingCell?.field === "dailyLimit" ? (
                          <input
                            type="number"
                            min="0"
                            autoFocus
                            value={inlineEditValue}
                            placeholder="Ilimitado"
                            onChange={(e) => setInlineEditValue(e.target.value)}
                            onBlur={() => saveInlineEdit(item, "dailyLimit")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveInlineEdit(item, "dailyLimit")
                              if (e.key === "Escape") setInlineEditingCell(null)
                            }}
                            className="w-16 px-1 py-0.5 text-center text-xs font-bold text-[#2E4233] bg-white border border-[#2E4233] rounded"
                          />
                        ) : (
                          <div
                            onClick={(e) => startInlineEdit(item, "dailyLimit", e)}
                            className="flex items-center gap-1 cursor-pointer"
                            title="Toque para editar limite diário"
                          >
                            {item.dailyLimit !== null ? (
                              item.remaining === 0 ? (
                                <span className="text-[11px] font-bold text-[#CB5A3C] bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full leading-tight">
                                  0 rest. · Lim: {item.dailyLimit}
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-[#16A34A] bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full leading-tight">
                                  {item.remaining ?? item.dailyLimit} rest. · Lim: {item.dailyLimit}
                                </span>
                              )
                            ) : (
                              <span className="text-[11px] text-gray-400 font-medium">
                                Sem limite
                              </span>
                            )}
                            <ChevronDown className="w-3 h-3 text-[#2E4233] shrink-0" />
                            {inlineSuccessCellId === `${item.id}-dailyLimit` && (
                              <Check className="w-3 h-3 text-[#16A34A] shrink-0" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Barra de ações (Switch e botões com opacidade normal 100) */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs opacity-100">
                  <div id={itemIdx === 0 ? "m-tour-availability-switch" : undefined} className="flex items-center gap-2">
                    <Switch
                      checked={item.isAvailable}
                      onClick={(e) => handleToggleAvailability(item.id, e)}
                      onCheckedChange={() => handleToggleAvailability(item.id)}
                      aria-label={`Alternar disponibilidade de ${item.name}`}
                    />
                    <span
                      className={`text-xs font-semibold transition-colors ${
                        item.isAvailable ? "text-[#2E4233]" : "text-[#CB5A3C]"
                      }`}
                    >
                      {item.isAvailable ? "Disponível" : "Pausado"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      className="text-[#2E4233] font-semibold hover:underline cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      id={itemIdx === 0 ? "m-tour-delete-action" : undefined}
                      type="button"
                      onClick={() => setItemToDelete(item)}
                      title="Excluir item"
                      className="text-[#CB5A3C] font-semibold hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#CB5A3C]" />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {filteredItems.length === 0 && (
            <div className="p-6 text-center text-gray-500 text-sm">
              Nenhum item encontrado no cardápio.
            </div>
          )}
        </div>

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 p-2.5 border-t border-[#E9E4D4] bg-[#FAF8F0]/30 shrink-0">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentPage(i + 1)}
                className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${
                  currentPage === i + 1 
                    ? "bg-[#CB5A3C] text-white shadow-sm" 
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-[#E9E4D4]"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ==================== MODAL: EDITOR DE ITEM ==================== */}
      {isModalOpen && (
        <div className={`fixed inset-0 ${modalTourType === "new_item" ? "z-[135]" : "z-50"} flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150`}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E9E4D4] flex justify-between items-center bg-[#FDFCF9]">
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-[#CB5A3C] text-xl tracking-tight">
                  {itemToEdit ? "Editar Item do Cardápio" : "Novo Item do Cardápio"}
                </h3>
                
                {/* Botão de Tutorial Interativo (?) */}
                <button
                  id="tour-help-new-item"
                  type="button"
                  onClick={() => {
                    setModalTourType("new_item")
                    setModalTourStep(0)
                  }}
                  className="w-5 h-5 rounded-full bg-[#2E4233] text-white flex items-center justify-center text-[11px] font-extrabold shadow-sm hover:bg-[#233327] hover:scale-105 transition-all cursor-pointer"
                  title="Iniciar tutorial guiado deste modal"
                >
                  ?
                </button>
              </div>

              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 rounded-lg text-[#CB5A3C] hover:bg-[#CB5A3C]/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-[#CB5A3C]" />
              </button>
            </div>
            
            {/* Modal Body / Scrollable Form */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <form id="menu-item-form" onSubmit={handleSaveModal} className="flex flex-col gap-4">
                
                {/* 1. Foto do Produto */}
                <div id="tour-new-item-image" className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-semibold text-gray-700">Foto do Produto</label>
                    <span className="text-[11px] text-gray-400">Opcional</span>
                  </div>

                  {formImage ? (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl border border-[#E9E4D4] bg-[#FAF8F0]/60">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#E9E4D4] bg-white shrink-0 shadow-xs">
                        <img src={formImage} alt="Foto do produto" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center min-w-0">
                        <span className="text-xs font-bold text-gray-800 truncate">Foto anexada</span>
                        <span className="text-[11px] text-gray-500">Exibição otimizada para o cliente</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => newItemFileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg border border-[#E9E4D4] bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#2E4233] transition-colors cursor-pointer"
                        >
                          Trocar
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormImage("")}
                          className="p-1.5 rounded-lg text-[#CB5A3C] hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remover foto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => newItemFileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setNewItemIsDragging(true)
                      }}
                      onDragLeave={() => setNewItemIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setNewItemIsDragging(false)
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleProcessNewItemImage(e.dataTransfer.files[0])
                        }
                      }}
                      className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        newItemIsDragging
                          ? "border-[#2E4233] bg-[#EBF5ED]/50"
                          : "border-[#E9E4D4] hover:border-[#2E4233] bg-[#FAF8F0]/30 hover:bg-[#FAF8F0]/60"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-white border border-[#E9E4D4] flex items-center justify-center text-[#CB5A3C] shadow-xs">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-gray-800">
                          Clique ou arraste uma foto para subir
                        </span>
                        <span className="text-[11px] text-gray-400">
                          PNG, JPG ou WebP até 5MB
                        </span>
                      </div>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={newItemFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleProcessNewItemImage(file)
                      e.target.value = ""
                    }}
                  />
                </div>

                {/* 2. Nome e Preço Original */}
                <div id="tour-new-item-name-price" className="flex flex-col gap-3">
                  {/* Nome do Item */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-gray-700">Nome do Item *</label>
                    <input 
                      type="text" 
                      value={formName} 
                      onChange={(e) => setFormName(e.target.value)} 
                      required 
                      className="w-full border border-[#E9E4D4] rounded-xl px-4 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233] transition-all" 
                      placeholder="Ex: Bowl Salmão Grelhado" 
                    />
                  </div>

                  {/* Preço Original */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[13px] font-semibold text-gray-700">Preço Original *</label>
                    <input 
                      type="text" 
                      value={formOriginalPrice} 
                      onChange={(e) => setFormOriginalPrice(e.target.value)} 
                      required
                      className="w-full border border-[#E9E4D4] rounded-xl px-4 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233] transition-all" 
                      placeholder="R$ 0,00" 
                    />
                  </div>
                </div>

                {/* 3. Categorias (Tags livres) */}
                <div id="tour-new-item-categories" className="flex flex-col gap-2 pt-2 border-t border-[#E9E4D4]/60">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-semibold text-gray-700">
                      Categorias / Tags
                    </label>
                    <span className="text-[11px] text-gray-400 font-medium">
                      Campo livre · Separe por vírgulas
                    </span>
                  </div>

                  {/* Tags adicionadas */}
                  {formCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-[#FAF8F0]/70 rounded-xl border border-[#E9E4D4] items-center">
                      {formCategories.map((cat, idx) => {
                        const style = getCategoryBadgeStyle(cat)
                        return (
                          <div
                            key={idx}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${style.bg} ${style.text} shadow-2xs`}
                          >
                            <span>{cat}</span>
                            <button
                              type="button"
                              onClick={() => setFormCategories((prev) => prev.filter((_, i) => i !== idx))}
                              className="hover:opacity-75 cursor-pointer p-0.5 rounded transition-opacity"
                              title="Remover tag"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Input livre para digitar categorias */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formCategoryInput}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val.includes(",")) {
                          handleAddCategoryToForm(val)
                          setFormCategoryInput("")
                        } else {
                          setFormCategoryInput(val)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault()
                          if (formCategoryInput.trim()) {
                            handleAddCategoryToForm(formCategoryInput)
                            setFormCategoryInput("")
                          }
                        }
                      }}
                      placeholder="Digite categorias (ex: Bowls, Vegano, Sem Glúten)..."
                      className="flex-1 px-3.5 py-2 border border-[#E9E4D4] rounded-xl text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (formCategoryInput.trim()) {
                          handleAddCategoryToForm(formCategoryInput)
                          setFormCategoryInput("")
                        }
                      }}
                      className="px-3.5 py-2 bg-[#2E4233] text-white text-xs font-semibold rounded-xl hover:bg-[#233327] transition-colors cursor-pointer shrink-0"
                    >
                      + Adicionar
                    </button>
                  </div>

                  {/* Sugestões rápidas de categoria */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-gray-400 font-medium">Sugestões:</span>
                    {["Bowls", "Bebidas", "Sobremesas", "Entradas", "Mais pedido", "Vegano", "Destaque", "Fitness"].map((sug) => {
                      const alreadyHas = formCategories.some((c) => c.toLowerCase() === sug.toLowerCase())
                      if (alreadyHas) return null
                      return (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => handleAddCategoryToForm(sug)}
                          className="px-2 py-0.5 bg-white border border-[#E9E4D4] hover:border-[#2E4233] text-gray-600 hover:text-[#2E4233] rounded-md text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          + {sug}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 4. Descrição e Limite Diário */}
                <div id="tour-new-item-desc-limit" className="flex flex-col gap-3">
                  {/* Descrição / Ingredientes */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[13px] font-semibold text-gray-700">Descrição / Ingredientes</label>
                      <span className="text-[11px] text-gray-400">{formDescription.length}/300</span>
                    </div>
                    <textarea
                      value={formDescription}
                      maxLength={300}
                      onChange={(e) => setFormDescription(e.target.value)}
                      rows={3}
                      className="w-full border border-[#E9E4D4] rounded-xl p-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233] transition-all resize-none leading-relaxed"
                      placeholder="Descreva os ingredientes e detalhes para o cliente..."
                    />
                  </div>

                  {/* Limite Diário */}
                  <div className="flex flex-col gap-2 pt-1 border-t border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div
                        onClick={() => setFormHasDailyLimit(!formHasDailyLimit)}
                        className={`w-4 h-4 rounded flex items-center justify-center transition-colors cursor-pointer ${
                          formHasDailyLimit ? "bg-[#CB5A3C] text-white" : "border border-gray-300 bg-white"
                        }`}
                      >
                        {formHasDailyLimit && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-[13px] font-semibold text-gray-700">Ativar limite diário de vendas</span>
                    </label>

                    {formHasDailyLimit && (
                      <div className="flex items-center gap-2 pl-6">
                        <input
                          type="number"
                          value={formDailyLimit}
                          onChange={(e) => setFormDailyLimit(e.target.value)}
                          placeholder="Ex: 50"
                          className="w-24 border border-[#E9E4D4] rounded-xl px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233]"
                        />
                        <span className="text-xs text-gray-500 font-medium">unidades por dia</span>
                      </div>
                    )}
                  </div>
                </div>

              </form>
            </div>


            {/* Modal Footer (Matching Estoque) */}
            <div className="p-4 border-t border-[#E9E4D4] bg-[#FDFCF9] flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="px-5 py-2.5 text-[14px] font-semibold text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                form="menu-item-form" 
                disabled={!formName.trim()} 
                className="px-6 py-2.5 bg-[#CB5A3C] hover:bg-[#A8452B] text-white rounded-xl font-semibold text-[14px] transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {itemToEdit ? "Salvar Alterações" : "Adicionar Item"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==================== CUSTOM DELETE CONFIRMATION MODAL (Matching Estoque) ==================== */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 flex flex-col items-center text-center relative overflow-hidden">
            <button 
              type="button"
              onClick={() => setItemToDelete(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#CB5A3C] hover:bg-[#CB5A3C]/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-[#CB5A3C]" />
            </button>

            <div className="w-14 h-14 rounded-full bg-[#FDF2F0] border-2 border-[#F5D8D1] flex items-center justify-center mb-3 shadow-sm">
              <Trash2 className="w-7 h-7 text-[#CB5A3C]" />
            </div>

            <h3 className="font-bold text-[#2E4233] text-lg mb-1">Excluir item?</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Tem certeza que deseja excluir <span className="font-bold text-gray-800">&quot;{itemToDelete.name}&quot;</span> do cardápio? Esta ação não pode ser desfeita.
            </p>

            <div className="flex w-full gap-3">
              <button 
                type="button" 
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E9E4D4] text-[14px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id))
                  setItemToDelete(null)
                  setNotification("Item removido do cardápio.")
                  setTimeout(() => setNotification(null), 3000)
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#CB5A3C] hover:bg-[#A8452B] text-[14px] font-semibold text-white shadow-sm transition-all cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== LIGHTBOX MODAL: AMPLIAR IMAGEM ==================== */}
      {zoomedItem && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setZoomedItem(null)}
        >
          <div 
            className="bg-[#2E4233] text-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col border border-[#3d5743] relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-white/10 flex justify-between items-center bg-[#233327]">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span className="font-bold text-white text-base truncate">{zoomedItem.name}</span>
                <span className="text-xs text-white/60 shrink-0 font-medium">({zoomedItem.category})</span>
              </div>
              <button
                type="button"
                onClick={() => setZoomedItem(null)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Imagem Ampliada */}
            <div className="p-4 bg-black/40 flex items-center justify-center overflow-hidden max-h-[70vh]">
              <img
                src={zoomedItem.image}
                alt={zoomedItem.name}
                className="w-full max-h-[60vh] object-contain rounded-xl shadow-lg border border-white/10"
              />
            </div>

            {/* Footer com informações e botão para trocar foto */}
            <div className="px-5 py-3 border-t border-white/10 bg-[#233327] flex items-center justify-between gap-3 text-xs">
              <span className="text-white/80 line-clamp-1 flex-1">{zoomedItem.description}</span>
              <button
                type="button"
                onClick={() => {
                  const item = zoomedItem
                  setZoomedItem(null)
                  setItemToChangeImage(item)
                  setNewImageUrl(item.image)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors shrink-0 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-white/90" />
                <span>Trocar foto</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: TROCAR IMAGEM (DRAG & DROP / UPLOAD DO COMPUTADOR) ==================== */}
      {itemToChangeImage && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => {
            setItemToChangeImage(null)
            setShowDeletePhotoConfirm(false)
          }}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col border border-[#E9E4D4] animate-in zoom-in-95 duration-150 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#E9E4D4] flex justify-between items-center bg-[#FAF8F0]">
              <div className="flex flex-col">
                <h3 className="font-bold text-[#2E4233] text-lg">Trocar Imagem</h3>
                <span className="text-xs text-gray-500 font-medium truncate max-w-[280px]">
                  {itemToChangeImage.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setItemToChangeImage(null)
                  setShowDeletePhotoConfirm(false)
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleProcessImageFile(file)
                e.target.value = ""
              }}
            />

            {/* Body */}
            <form onSubmit={handleSaveChangeImage} className="p-6 flex flex-col gap-4">
              {newImageUrl.trim() ? (
                /* Imagem com Lixinho no Topo */
                <div className="flex flex-col gap-3">
                  <div className="relative w-full h-48 rounded-xl border border-[#E9E4D4] overflow-hidden bg-gray-50 shadow-inner group">
                    <img
                      src={newImageUrl}
                      alt="Prévia da imagem"
                      className="w-full h-full object-cover"
                    />

                    {/* Lixinho no topo da imagem para excluir */}
                    <button
                      type="button"
                      onClick={() => setShowDeletePhotoConfirm(true)}
                      className="absolute top-3 right-3 p-2 rounded-xl bg-white/95 hover:bg-white text-[#CB5A3C] shadow-lg border border-[#E9E4D4] transition-all hover:scale-105 cursor-pointer flex items-center justify-center"
                      title="Excluir imagem"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Área para arrastar outra ou carregar do computador */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDragging(true)
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDropImage}
                    className={`border-2 border-dashed rounded-xl p-3.5 flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      isDragging
                        ? "border-[#2E4233] bg-[#FAF8F0]"
                        : "border-[#E9E4D4] hover:border-[#2E4233] bg-[#FAF8F0]/40 hover:bg-[#FAF8F0]"
                    }`}
                  >
                    <Upload className="w-4 h-4 text-[#2E4233]" />
                    <span className="text-xs font-semibold text-[#2E4233]">
                      Arraste outra foto ou clique para carregar
                    </span>
                  </div>
                </div>
              ) : (
                /* Área para arrastar imagem ou carregar do computador (Sem foto) */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDropImage}
                  className={`w-full h-52 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 cursor-pointer transition-all ${
                    isDragging
                      ? "border-[#2E4233] bg-[#FAF8F0] scale-[0.99]"
                      : "border-[#E9E4D4] hover:border-[#2E4233] bg-[#FAF8F0]/40 hover:bg-[#FAF8F0]"
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-[#E9E4D4] flex items-center justify-center mb-3 text-[#2E4233]">
                    <Upload className="w-6 h-6 text-[#2E4233]" />
                  </div>
                  <p className="text-[13px] font-bold text-[#2E4233]">
                    Arraste e solte uma imagem aqui
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ou <span className="text-[#CB5A3C] font-semibold underline">clique para carregar do computador</span>
                  </p>
                  <span className="text-[11px] text-gray-400 mt-3 bg-white px-2.5 py-0.5 rounded-full border border-gray-100">
                    PNG, JPG ou WebP
                  </span>
                </div>
              )}

              {/* Footer */}
              <div className="pt-3 border-t border-[#E9E4D4] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setItemToChangeImage(null)
                    setShowDeletePhotoConfirm(false)
                  }}
                  className="px-4 py-2 rounded-xl border border-[#E9E4D4] text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#CB5A3C] hover:bg-[#A8452B] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Salvar Imagem
                </button>
              </div>
            </form>

            {/* Modal de Confirmação: Excluir Foto */}
            {showDeletePhotoConfirm && (
              <div 
                className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 rounded-2xl animate-in fade-in duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-white rounded-2xl w-full max-w-xs shadow-2xl p-5 flex flex-col items-center text-center border border-[#E9E4D4] animate-in zoom-in-95 duration-100">
                  <div className="w-12 h-12 rounded-full bg-[#FDF2F0] border border-[#F5D8D1] flex items-center justify-center mb-2.5">
                    <Trash2 className="w-6 h-6 text-[#CB5A3C]" />
                  </div>
                  <h4 className="font-bold text-[#2E4233] text-base mb-1">Excluir foto?</h4>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                    Tem certeza que deseja excluir a foto deste produto? Ele ficará sem foto no cardápio.
                  </p>
                  <div className="flex w-full gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeletePhotoConfirm(false)}
                      className="flex-1 py-2 rounded-xl border border-[#E9E4D4] text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewImageUrl("")
                        setShowDeletePhotoConfirm(false)
                      }}
                      className="flex-1 py-2 rounded-xl bg-[#CB5A3C] hover:bg-[#A8452B] text-xs font-semibold text-white shadow-sm transition-all cursor-pointer"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ==================== MODAL PEQUENO: EDITAR PRODUTO (NOME, DESCRIÇÃO, CATEGORIAS 1 A 3) ==================== */}
      {prodModalItem && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setProdModalItem(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col border border-[#E9E4D4] animate-in zoom-in-95 duration-150 max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#E9E4D4] flex justify-between items-center bg-[#FAF8F0]">
              <div>
                <h3 className="font-bold text-[#2E4233] text-base">Editar Produto</h3>
                <p className="text-xs text-gray-500 font-medium">Nome, descrição e categorias (mín. 1, máx. 3)</p>
              </div>
              <button
                type="button"
                onClick={() => setProdModalItem(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProductModal} className="p-5 flex flex-col gap-4 overflow-y-auto">
              {/* Nome do Produto */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  Nome do Produto <span className="text-[#CB5A3C]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={prodModalName}
                  onChange={(e) => setProdModalName(e.target.value)}
                  placeholder="Ex: Bowl Salmão Grelhado"
                  className="w-full px-3.5 py-2 border border-[#E9E4D4] rounded-xl text-sm font-semibold text-[#2E4233] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233] transition-all"
                />
              </div>

              {/* Descrição */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  Descrição
                </label>
                <textarea
                  rows={3}
                  value={prodModalDesc}
                  onChange={(e) => setProdModalDesc(e.target.value)}
                  placeholder="Descreva os ingredientes, modo de preparo ou especificações..."
                  className="w-full px-3.5 py-2 border border-[#E9E4D4] rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233] transition-all resize-none"
                />
              </div>

              {/* Categorias (Travadas em mínimo 1 e máximo 3) */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[#E9E4D4]/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700">
                    Categorias ({prodModalCategories.length}/3)
                  </label>
                  <span className="text-[11px] font-medium text-gray-400">
                    Mínimo 1 · Máximo 3
                  </span>
                </div>

                {/* Chips selecionados */}
                <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-[#FAF8F0]/70 rounded-xl border border-[#E9E4D4] items-center">
                  {prodModalCategories.map((cat, idx) => {
                    const style = getCategoryBadgeStyle(cat)
                    const canRemove = prodModalCategories.length > 1
                    return (
                      <div
                        key={idx}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${style.bg} ${style.text} shadow-2xs`}
                      >
                        <span>{cat}</span>
                        {canRemove ? (
                          <button
                            type="button"
                            onClick={() => setProdModalCategories((prev) => prev.filter((_, i) => i !== idx))}
                            className="hover:opacity-75 cursor-pointer p-0.5 rounded transition-opacity"
                            title="Remover tag"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-[10px] opacity-40 ml-0.5" title="Mínimo de 1 categoria obrigatória">
                            (fixa)
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Campo para adicionar categoria se < 3 */}
                {prodModalCategories.length < 3 ? (
                  <div className="flex flex-col gap-2 mt-1">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={prodModalNewCat}
                        onChange={(e) => setProdModalNewCat(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleAddCatToProdModal(prodModalNewCat)
                          }
                        }}
                        placeholder="Digitar nova tag ou escolher abaixo..."
                        className="flex-1 px-3 py-1.5 border border-[#E9E4D4] rounded-xl text-xs focus:outline-none focus:border-[#2E4233]"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCatToProdModal(prodModalNewCat)}
                        className="px-3 py-1.5 bg-[#2E4233] text-white text-xs font-semibold rounded-xl hover:bg-[#233327] transition-colors cursor-pointer"
                      >
                        + Adicionar
                      </button>
                    </div>

                    {/* Sugestões rápidas de categoria */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-gray-400 font-medium">Sugestões:</span>
                      {["Bowls", "Bebidas", "Sobremesas", "Entradas", "Mais pedido", "Vegano", "Orgânico", "Destaque"].map((sug) => {
                        const alreadyHas = prodModalCategories.some((c) => c.toLowerCase() === sug.toLowerCase())
                        if (alreadyHas) return null
                        return (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => handleAddCatToProdModal(sug)}
                            className="px-2 py-0.5 bg-white border border-[#E9E4D4] hover:border-[#2E4233] text-gray-600 hover:text-[#2E4233] rounded-md text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            + {sug}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg font-medium">
                    Limite máximo de 3 categorias atingido.
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProdModalItem(null)}
                  className="px-4 py-2 rounded-xl border border-[#E9E4D4] text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2E4233] hover:bg-[#233327] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: DEFINIR PREÇO PROMOCIONAL (TEMA LARANJA DELI + BOTÕES VERDES) ==================== */}
      {discountModalItem && (() => {
        const origNum = parseCurrency(discountModalItem.originalPrice)
        const pct = parseFloat(discountPercentInput) || 0
        const calculatedPromo = pct > 0 ? Math.max(0, origNum * (1 - pct / 100)) : origNum
        const savings = origNum - calculatedPromo

        return (
          <div 
            className={`fixed inset-0 ${modalTourType === "promo" ? "z-[135]" : "z-[110]"} flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150`}
            onClick={() => setDiscountModalItem(null)}
          >
            <div 
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col border border-[#E9E4D4] animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-[#E9E4D4] flex justify-between items-center bg-[#FAF8F0]">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <h3 className="font-bold text-[#CB5A3C] text-base">Preço Promocional</h3>
                    <span className="text-xs text-gray-500 font-medium truncate max-w-[240px]">
                      {discountModalItem.name}
                    </span>
                  </div>
                  <button
                    id="tour-help-promo"
                    type="button"
                    onClick={() => {
                      setModalTourType("promo")
                      setModalTourStep(0)
                    }}
                    className="w-5 h-5 rounded-full bg-[#2E4233] text-white flex items-center justify-center text-[11px] font-extrabold shadow-sm hover:bg-[#233327] hover:scale-105 transition-all cursor-pointer shrink-0"
                    title="Iniciar tutorial guiado deste modal"
                  >
                    ?
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setDiscountModalItem(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleApplyDiscount} className="flex flex-col">
                
                {/* Conteúdo configurável (Apagado quando promoção desativada) */}
                <div className={`p-5 flex flex-col gap-4 transition-all duration-200 ${!promoIsActive ? "opacity-35 pointer-events-none select-none grayscale-[0.3]" : ""}`}>
                  
                  {/* Comparativo de Preços: Original e Promocional juntos */}
                  <div className="p-3.5 rounded-xl bg-[#FAF8F0] border border-[#E9E4D4] flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-gray-500 font-medium">Preço Original</span>
                      <span className="text-sm font-semibold text-gray-400 line-through">
                        {discountModalItem.originalPrice}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FDF2F0] border border-[#CB5A3C]/20">
                      <span className="text-xs font-bold text-[#CB5A3C]">
                        -{pct > 0 ? pct : 0}%
                      </span>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-[11px] text-gray-500 font-medium">Preço Promocional</span>
                      <span className="text-xl font-extrabold text-[#CB5A3C]">
                        {formatCurrency(calculatedPromo)}
                      </span>
                      {savings > 0 && (
                        <span className="text-[10.5px] font-semibold text-[#2E4233]">
                          Economia de {formatCurrency(savings)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Campo Porcentagem de Desconto */}
                  <div id="tour-promo-modal-calc" className="flex flex-col gap-2 p-1 rounded-xl">
                    <label className="text-xs font-semibold text-gray-700 flex justify-between">
                      <span>Porcentagem de Desconto:</span>
                      <span className="text-[#CB5A3C] font-bold">{pct > 0 ? `${pct}%` : "0%"}</span>
                    </label>
                    
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="99"
                        step="1"
                        value={discountPercentInput}
                        onChange={(e) => setDiscountPercentInput(e.target.value)}
                        placeholder="Ex: 15"
                        autoFocus={promoIsActive}
                        className="w-full border border-[#E9E4D4] rounded-xl pl-4 pr-10 py-2.5 text-base font-bold text-[#CB5A3C] focus:outline-none focus:ring-2 focus:ring-[#CB5A3C]/20 focus:border-[#CB5A3C] transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                        %
                      </span>
                    </div>

                    {/* Atalhos rápidos de % (Botões na cor verde Deli) */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {[5, 10, 15, 20, 25, 30].map((quickPct) => (
                        <button
                          key={quickPct}
                          type="button"
                          onClick={() => setDiscountPercentInput(quickPct.toString())}
                          className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            pct === quickPct
                              ? "bg-[#2E4233] text-white border-[#2E4233]"
                              : "bg-white text-gray-600 border-[#E9E4D4] hover:bg-[#FAF8F0] hover:text-[#2E4233]"
                          }`}
                        >
                          {quickPct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Programação da Promoção (acima dos botões) */}
                  <div id="tour-promo-modal-schedule" className="flex flex-col gap-2.5 pt-3 border-t border-gray-100 p-1 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        Programar promoção
                      </span>
                      <div className="flex items-center gap-2 select-none">
                        <span 
                          onClick={() => setPromoIndefinite(!promoIndefinite)}
                          className="text-[11px] font-medium text-gray-600 cursor-pointer"
                        >
                          Prazo indeterminado
                        </span>
                        <Switch
                          checked={promoIndefinite}
                          onCheckedChange={setPromoIndefinite}
                          activeTrackColor="bg-[#2E4233]"
                          inactiveTrackColor="bg-stone-300"
                        />
                      </div>
                    </div>

                    {/* Campos de Data de Início e Data de Término (Apagados quando prazo indeterminado) */}
                    <div className={`grid grid-cols-2 gap-2.5 transition-all duration-200 ${promoIndefinite ? "opacity-35 pointer-events-none select-none grayscale-[0.3]" : ""}`}>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-medium text-gray-600">Data de início</label>
                        <input
                          type="date"
                          value={promoStartDate}
                          onChange={(e) => setPromoStartDate(e.target.value)}
                          disabled={promoIndefinite}
                          className="w-full border border-[#E9E4D4] rounded-xl px-2.5 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#2E4233]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-medium text-gray-600">Data de término</label>
                        <input
                          type="date"
                          value={promoEndDate}
                          min={promoStartDate}
                          onChange={(e) => setPromoEndDate(e.target.value)}
                          disabled={promoIndefinite}
                          className="w-full border border-[#E9E4D4] rounded-xl px-2.5 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#2E4233]"
                        />
                      </div>
                    </div>

                    {/* Resumo do período programado quando NÃO for prazo indeterminado */}
                    {!promoIndefinite && promoStartDate && promoEndDate && (
                      <div className="p-2 rounded-xl bg-[#FAF8F0] border border-[#E9E4D4] flex items-center justify-between text-xs text-gray-700 animate-in fade-in">
                        <span className="text-[11px] text-gray-500 font-medium">Período programado:</span>
                        <span className="text-[11.5px] font-bold text-[#2E4233]">
                          {formatPromoPeriod(promoStartDate, promoEndDate, false).periodText}
                        </span>
                      </div>
                    )}

                    {/* Aviso quando ativado por prazo indeterminado (Regra estrita: NÃO escrever 'permanente') */}
                    {promoIndefinite && (
                      <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-center gap-2 text-xs text-amber-900 animate-in fade-in duration-150">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                        <span className="text-[11.5px] font-medium">A promoção está ativa por prazo indeterminado</span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Footer / Ações */}
                <div className="pt-3 border-t border-[#E9E4D4] flex items-center justify-between gap-2 bg-[#FAF8F0] px-5 py-3.5">
                  {/* Switch para ligar/desligar promoção (Substitui 'Remover promoção') */}
                  <div id="tour-promo-modal-switch" className="flex items-center gap-2 select-none p-1 rounded-lg">
                    <Switch
                      checked={promoIsActive}
                      onCheckedChange={setPromoIsActive}
                      activeTrackColor="bg-[#2E4233]"
                      inactiveTrackColor="bg-stone-300"
                    />
                    <span 
                      onClick={() => setPromoIsActive(!promoIsActive)}
                      className="text-xs font-semibold text-gray-700 cursor-pointer"
                    >
                      {promoIsActive ? "Promoção ativa" : "Promoção desativada"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDiscountModalItem(null)}
                      className="px-3.5 py-2 rounded-xl border border-[#E9E4D4] text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      id="tour-promo-modal-confirm"
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#2E4233] hover:bg-[#233327] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>

              </form>
            </div>
          </div>
        )
      })()}

      {/* Modal de Pergunta / Aviso Pré-Tutorial */}
      {showTourPrompt && tourStep === null && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E9E4D4] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header com cor verde Deli */}
            <div className="bg-[#2E4233] p-5 text-white flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20">
                  <Sparkles className="w-5 h-5 text-[#CB5A3C]" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold text-white/90 mb-1">
                    <span>Tutorial Rápido</span>
                    <span>•</span>
                    <span>1 minuto</span>
                  </div>
                  <h3 className="text-lg font-serif font-bold text-white tracking-tight">
                    Conheça o Cardápio DeliPlus
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTourPrompt(false)}
                className="text-white/60 hover:text-white transition-colors cursor-pointer p-1"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo da pergunta */}
            <div className="p-5 flex flex-col gap-4">
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-1">
                  Gostaria de ver um breve tutorial interativo?
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Preparamos um guia com efeito holofote que destaca cada funcionalidade diretamente na sua tela:
                </p>
              </div>

              {/* Recursos em destaque */}
              <div className="grid grid-cols-1 gap-2 bg-[#FAF8F0] p-3 rounded-xl border border-[#E9E4D4] text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#EBF5ED] text-[#477A55] flex items-center justify-center font-bold text-[11px] shrink-0">✓</span>
                  <span><strong>Edição com um toque:</strong> altere nome, preço e estoque sem salvar.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#FDF2F0] text-[#CB5A3C] flex items-center justify-center font-bold text-[11px] shrink-0">%</span>
                  <span><strong>Preços promocionais:</strong> cálculo em porcentagem e datas agendadas.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-[11px] shrink-0">📸</span>
                  <span><strong>Fotos dos pratos:</strong> amplie e troque com upload ou arrastar arquivos.</span>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTourPrompt(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E9E4D4] text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Agora não / Pular
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTourPrompt(false)
                    setTourStep(0)
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2E4233] hover:bg-[#233327] text-white text-xs font-bold shadow-md hover:shadow transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Iniciar tutorial</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spotlight Overlay & Floating Step Card */}
      {activeTourStep && (
        <div className="fixed inset-0 z-[140] pointer-events-auto">
          {/* SVG Cutout Darkness Mask */}
          <svg className="fixed inset-0 w-full h-full pointer-events-none z-[141]">
            <defs>
              <mask id="spotlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {spotlightRect && (
                  <rect
                    x={Math.max(0, spotlightRect.left - 6)}
                    y={Math.max(0, spotlightRect.top - 6)}
                    width={spotlightRect.width + 12}
                    height={spotlightRect.height + 12}
                    rx={14}
                    ry={14}
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(15, 23, 42, 0.78)"
              mask="url(#spotlight-mask)"
            />
          </svg>

          {/* Highlighted Pulse Ring around element */}
          {spotlightRect && (
            <div
              className="fixed pointer-events-none z-[142] rounded-2xl border-2 border-[#16A34A] ring-4 ring-[#16A34A]/30 shadow-[0_0_30px_rgba(22,163,74,0.45)] transition-all duration-300 animate-pulse"
              style={{
                top: Math.max(0, spotlightRect.top - 6),
                left: Math.max(0, spotlightRect.left - 6),
                width: spotlightRect.width + 12,
                height: spotlightRect.height + 12,
              }}
            />
          )}

          {/* Floating Step Popover Card */}
          <div
            className="fixed z-[143] bg-white rounded-2xl shadow-2xl border border-stone-200 p-5 transition-all duration-300 animate-in fade-in zoom-in-95 max-w-[380px]"
            style={getTourCardStyle() as React.CSSProperties}
          >
            {/* Top Bar: Step Counter & Close */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#EBF5ED] text-[#2E4233] text-[11px] font-bold tracking-wide">
                  {modalTourType === "promo" 
                    ? `PROMOÇÃO: ${activeTourCurrentIndex + 1}/${activeTourTotalSteps}`
                    : modalTourType === "new_item"
                    ? `NOVO ITEM: ${activeTourCurrentIndex + 1}/${activeTourTotalSteps}`
                    : `PASSO ${activeTourCurrentIndex + 1} DE ${activeTourTotalSteps}`}
                </span>
                <span className="text-[11px] text-gray-400 font-medium">
                  {modalTourType ? "Modo Interativo" : "Tutorial Cardápio"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCloseTour}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                title="Fechar tutorial (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Content */}
            <div className="py-4">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#FAF8F0] border border-[#E9E4D4] flex items-center justify-center text-[#2E4233] shrink-0">
                  {(() => {
                    const StepIcon = activeTourStep.icon
                    return <StepIcon className="w-4 h-4 text-[#CB5A3C]" />
                  })()}
                </div>
                <h4 className="font-bold text-gray-900 text-sm md:text-base leading-tight">
                  {activeTourStep.title}
                </h4>
              </div>
              <p className="text-xs md:text-[13px] text-gray-600 leading-relaxed">
                {activeTourStep.description}
              </p>

              {/* Botão Interativo para entrar no modal de promoção quando no passo 4 */}
              {tourStep === 4 && modalTourType === null && (
                <div className="mt-3 p-3 rounded-xl bg-orange-50 border border-orange-200/80 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#CB5A3C]">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Quer testar as opções no modal agora?</span>
                  </div>
                  <p className="text-[11.5px] text-gray-600 leading-snug">
                    Abra o modal para o spotlight explicar o switch de ativação, o cálculo de % e os prazos.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const itemToPromo = items.find((i) => i.id === "item-1") || items[0]
                      if (itemToPromo) {
                        handleOpenDiscountModal(itemToPromo)
                        setModalTourType("promo")
                        setModalTourStep(0)
                      }
                    }}
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#CB5A3C] hover:bg-[#A8452B] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Abrir modal e iniciar explicação</span>
                  </button>
                </div>
              )}
            </div>

            {/* Progress Dots */}
            <div className="flex items-center justify-center gap-1.5 pb-4">
              {Array.from({ length: activeTourTotalSteps }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (modalTourType !== null) {
                      setModalTourStep(idx)
                    } else {
                      setTourStep(idx)
                    }
                  }}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === activeTourCurrentIndex
                      ? "w-6 bg-[#2E4233]"
                      : idx < activeTourCurrentIndex
                      ? "w-2 bg-[#2E4233]/40"
                      : "w-2 bg-gray-200"
                  }`}
                  title={`Ir para passo ${idx + 1}`}
                />
              ))}
            </div>

            {/* Navigation Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCloseTour}
                className="text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                Pular tutorial
              </button>

              <div className="flex items-center gap-2">
                {activeTourCurrentIndex > 0 && (
                  <button
                    type="button"
                    onClick={handlePrevTour}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#E9E4D4] text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Anterior</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNextTour}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-[#2E4233] hover:bg-[#233327] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <span>
                    {activeTourCurrentIndex === activeTourTotalSteps - 1
                      ? modalTourType === "promo"
                        ? "Voltar ao Cardápio"
                        : "Concluir"
                      : "Próximo"}
                  </span>
                  {activeTourCurrentIndex < activeTourTotalSteps - 1 && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
