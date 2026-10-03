"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import {
  Search,
  PlusCircle,
  Plus,
  ChevronDown,
  MoreVertical,
  Upload,
  Trash2,
  Calendar,
  Pencil,
  Check,
  X,
  Tag
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
  campaignId?: string
  campaignName?: string
}

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
    return item.categories
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

  // Form states inside Modal
  const [formName, setFormName] = useState("")
  const [formCategory, setFormCategory] = useState("Bowls")
  const [formExtraCategory, setFormExtraCategory] = useState("")
  const [formImage, setFormImage] = useState("")
  const [formOriginalPrice, setFormOriginalPrice] = useState("")
  const [formPromoPrice, setFormPromoPrice] = useState("")
  const [formInPromo, setFormInPromo] = useState(false)
  const [formDescription, setFormDescription] = useState("")
  const [formAvailabilitySchedule, setFormAvailabilitySchedule] = useState("Todos os dias, 11:00 – 23:00")
  const [formPromoSchedule, setFormPromoSchedule] = useState("")
  const [formDailyLimit, setFormDailyLimit] = useState("")
  const [formHasDailyLimit, setFormHasDailyLimit] = useState(false)

  // Modal: Delete confirmation
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null)

  // Toast notification
  const [notification, setNotification] = useState<string | null>(null)

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

  // Open Edit Modal
  const handleOpenEditModal = (item: MenuItem) => {
    setItemToEdit(item)
    setFormName(item.name)
    const cats = getItemCategories(item)
    setFormCategory(cats[0] || "Bowls")
    setFormExtraCategory(cats.length > 1 ? cats.slice(1).join(", ") : "")
    setFormImage(item.image)
    setFormOriginalPrice(item.originalPrice)
    setFormPromoPrice(item.promoPrice || "")
    setFormInPromo(item.inPromo)
    setFormDescription(item.description)
    setFormAvailabilitySchedule(item.availabilitySchedule || "Todos os dias, 11:00 – 23:00")
    setFormPromoSchedule(item.promoSchedule || "")
    setFormDailyLimit(item.dailyLimit !== null ? item.dailyLimit.toString() : "")
    setFormHasDailyLimit(item.dailyLimit !== null)
    setIsModalOpen(true)
  }

  // Open New Item Modal
  const handleOpenNewItemModal = () => {
    setItemToEdit(null)
    setFormName("")
    setFormCategory("Bowls")
    setFormExtraCategory("")
    setFormImage("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80")
    setFormOriginalPrice("R$ 35,00")
    setFormPromoPrice("")
    setFormInPromo(false)
    setFormDescription("")
    setFormAvailabilitySchedule("Todos os dias, 11:00 – 23:00")
    setFormPromoSchedule("")
    setFormDailyLimit("")
    setFormHasDailyLimit(false)
    setIsModalOpen(true)
  }

  // Save changes from Modal
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return

    const limitNum = formHasDailyLimit ? parseInt(formDailyLimit, 10) || null : null

    const categoryBadgeStyles: Record<string, { bg: string; text: string }> = {
      Bowls: { bg: "bg-[#EBF5ED]", text: "text-[#477A55]" },
      Bebidas: { bg: "bg-[#FDF4E7]", text: "text-[#BA732F]" },
      Sobremesas: { bg: "bg-[#F7EDF9]", text: "text-[#8E5296]" },
      Entradas: { bg: "bg-[#EFF6FF]", text: "text-[#2563EB]" }
    }

    const badgeStyle = categoryBadgeStyles[formCategory] || { bg: "bg-gray-100", text: "text-gray-700" }

    const finalCategories = [formCategory]
    if (formExtraCategory.trim()) {
      const extraList = formExtraCategory.split(",").map((c) => c.trim()).filter(Boolean)
      extraList.forEach((extra) => {
        if (!finalCategories.some((c) => c.toLowerCase() === extra.toLowerCase())) {
          finalCategories.push(extra)
        }
      })
    }

    if (itemToEdit) {
      // Editing existing item
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === itemToEdit.id) {
            return {
              ...item,
              name: formName.trim(),
              category: formCategory,
              categories: finalCategories,
              categoryBg: badgeStyle.bg,
              categoryText: badgeStyle.text,
              image: formImage || item.image,
              originalPrice: formOriginalPrice.trim() || item.originalPrice,
              promoPrice: formInPromo ? formPromoPrice.trim() || null : null,
              inPromo: formInPromo,
              description: formDescription.trim(),
              availabilitySchedule: formAvailabilitySchedule,
              promoSchedule: formInPromo ? formPromoSchedule : "",
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
        category: formCategory,
        categories: finalCategories,
        categoryBg: badgeStyle.bg,
        categoryText: badgeStyle.text,
        image: formImage || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80",
        description: formDescription.trim() || "Item adicionado ao cardápio.",
        originalPrice: formOriginalPrice.trim() || "R$ 30,00",
        promoPrice: formInPromo ? formPromoPrice.trim() || null : null,
        inPromo: formInPromo,
        isAvailable: true,
        dailyLimit: limitNum,
        remaining: limitNum,
        availabilitySchedule: formAvailabilitySchedule,
        promoSchedule: formInPromo ? formPromoSchedule : ""
      }
      setItems((prev) => [newItem, ...prev])
      setNotification("Novo item adicionado ao cardápio!")
    }

    setIsModalOpen(false)
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
                  <span>Clique nos 3 pontinhos para editar detalhes ou excluir itens.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-[#2E4233] text-sm md:text-base font-medium mt-0.5">
          Gerencie os produtos, preços e disponibilidade do seu cardápio.
        </p>
      </div>

      {/* Controls Row: Filters, Search & Novo Item (Same pattern as Estoque) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 mb-2.5 shrink-0 z-30 relative">
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
                <th className="px-4 py-2.5">Produto & Descrição</th>
                <th className="px-4 py-2.5 text-left w-[120px] whitespace-nowrap">Preço original</th>
                <th className="px-4 py-2.5 text-left w-[140px] whitespace-nowrap">Preço promocional</th>
                <th className="px-3 py-2.5 text-center w-[110px] whitespace-nowrap">Disponibilidade</th>
                <th className="px-3 py-2.5 text-center w-[110px] whitespace-nowrap">Limite diário</th>
                <th className="px-3 py-2.5 text-center w-[115px] whitespace-nowrap">Restantes</th>
                <th className="px-4 py-2.5 text-right w-[60px]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E4D4] border-b border-[#E9E4D4]">
              {paginatedItems.map((item) => {
                const isPaused = !item.isAvailable
                return (
                  <tr
                    key={item.id}
                    className={`border-b border-[#E9E4D4] hover:bg-gray-50/60 transition-colors ${
                      isPaused ? "bg-stone-50/30" : ""
                    }`}
                  >
                    {/* Foto Thumbnail */}
                    <td className={`px-4 py-2 align-middle transition-opacity duration-200 ${isPaused ? "opacity-35 grayscale-[20%]" : "opacity-100"}`}>
                      <div className="w-[58px] h-[44px] rounded-xl overflow-hidden border border-[#E9E4D4] shadow-2xs shrink-0 bg-gray-50">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>

                    {/* Produto & Descrição com badges de categoria ao lado do nome */}
                    <td className={`px-4 py-2 align-middle transition-opacity duration-200 ${isPaused ? "opacity-35" : "opacity-100"}`}>
                      <div className="flex flex-col pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-[#2E4233] text-[15px] leading-tight">
                            {item.name}
                          </span>
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

                    {/* Preço original */}
                    <td className={`px-4 py-2 align-middle text-left whitespace-nowrap transition-opacity duration-200 ${isPaused ? "opacity-35" : "opacity-100"}`}>
                      <span className="text-[14px] font-medium text-gray-700">
                        {item.originalPrice}
                      </span>
                    </td>

                    {/* Preço promocional (sem tracinho, apenas a palavra quando sem promoção) */}
                    <td className={`px-4 py-2 align-middle text-left whitespace-nowrap transition-opacity duration-200 ${isPaused ? "opacity-35" : "opacity-100"}`}>
                      {item.promoPrice ? (
                        <div className="flex flex-col">
                          <span className="text-[14.5px] font-bold text-[#CB5A3C]">
                            {item.promoPrice}
                          </span>
                          <span className="text-[11px] text-gray-400 line-through leading-tight">
                            {item.originalPrice}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[13px] text-gray-400 font-medium">
                          Sem promoção
                        </span>
                      )}
                    </td>

                    {/* Disponibilidade Switch (NÃO apagado: full opacity-100) */}
                    <td className="px-3 py-2 align-middle text-center opacity-100" onClick={(e) => e.stopPropagation()}>
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

                    {/* Limite diário (sem tracinho, apenas a palavra quando sem limite) */}
                    <td className={`px-3 py-2 align-middle text-center whitespace-nowrap transition-opacity duration-200 ${isPaused ? "opacity-35" : "opacity-100"}`}>
                      {item.dailyLimit !== null ? (
                        <span className="text-[13.5px] font-semibold text-gray-700">
                          {item.dailyLimit} un.
                        </span>
                      ) : (
                        <span className="text-[13px] text-gray-400 font-medium">
                          Sem limite
                        </span>
                      )}
                    </td>

                    {/* Restantes (sem tracinho, apenas a palavra quando ilimitado) */}
                    <td className={`px-3 py-2 align-middle text-center whitespace-nowrap transition-opacity duration-200 ${isPaused ? "opacity-35" : "opacity-100"}`}>
                      {item.remaining !== null ? (
                        item.remaining === 0 ? (
                          <div className="flex flex-col items-center">
                            <span className="text-[13px] font-bold text-[#DC2626]">
                              0 restantes
                            </span>
                            <span className="border border-[#F87171] text-[#DC2626] bg-[#FEF2F2] text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 leading-none">
                              Esgotado
                            </span>
                          </div>
                        ) : (
                          <span className="text-[13.5px] font-bold text-[#16A34A]">
                            {item.remaining} restantes
                          </span>
                        )
                      ) : (
                        <span className="text-[13px] text-gray-400 font-medium">
                          Ilimitado
                        </span>
                      )}
                    </td>

                    {/* Menu de Ações (3 pontinhos - NÃO apagado: full opacity-100) */}
                    <td className="px-4 py-2 text-right opacity-100">
                      <div className="action-menu-container relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenActionId(openActionId === item.id ? null : item.id)
                          }}
                          className="text-gray-400 hover:text-[#2E4233] p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-5 h-5 ml-auto" />
                        </button>

                        {openActionId === item.id && (
                          <div className="absolute right-0 top-full mt-1 w-32 bg-[#2E4233] rounded-xl shadow-2xl border border-[#233327] z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-left">
                            <button 
                              type="button"
                              onClick={(e) => { 
                                e.stopPropagation()
                                setOpenActionId(null)
                                handleOpenEditModal(item)
                              }} 
                              className="w-full text-left px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
                            >
                              Editar
                            </button>
                            <button 
                              type="button"
                              onClick={(e) => { 
                                e.stopPropagation()
                                setOpenActionId(null)
                                itemToDelete ? null : setItemToDelete(item)
                              }} 
                              className="w-full text-left px-4 py-2 text-sm font-semibold text-[#FF5252] hover:bg-red-500/20 transition-colors cursor-pointer"
                            >
                              Excluir
                            </button>
                          </div>
                        )}
                      </div>
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

                    {/* Limite diário */}
                    <td className="px-3 py-2 align-middle text-center whitespace-nowrap">
                      <span className="text-[14px] text-gray-300 font-medium">—</span>
                    </td>

                    {/* Restantes */}
                    <td className="px-3 py-2 align-middle text-center whitespace-nowrap">
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
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 text-sm">
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
          {paginatedItems.map((item) => {
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
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#E9E4D4] shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#2E4233] text-sm truncate">{item.name}</span>
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
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-[#2E4233]">{item.originalPrice}</span>
                      {item.promoPrice && (
                        <span className="text-xs font-bold text-[#CB5A3C]">({item.promoPrice})</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Barra de ações (Switch e botões com opacidade normal 100) */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs opacity-100">
                  <div className="flex items-center gap-2">
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
                      type="button"
                      onClick={() => setItemToDelete(item)}
                      className="text-[#CB5A3C] font-semibold hover:underline cursor-pointer"
                    >
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E9E4D4] flex justify-between items-center bg-[#FDFCF9]">
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-[#CB5A3C] text-xl tracking-tight">
                  {itemToEdit ? "Editar Item do Cardápio" : "Novo Item do Cardápio"}
                </h3>
                
                {/* Tooltip */}
                <div className="relative group inline-block">
                  <div className="w-4 h-4 rounded-full bg-[#2E4233] text-white flex items-center justify-center text-[10px] font-extrabold leading-none shadow-sm cursor-help hover:scale-105 transition-transform">
                    ?
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[270px] p-3.5 bg-[#2E4233] text-white rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none text-left">
                    <p className="text-[12px] font-bold text-white mb-2 leading-relaxed">
                      Dica de cadastro do cardápio:
                    </p>
                    <div className="flex flex-col gap-2 text-[11px] text-white/95 leading-snug">
                      <div className="flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1"></span>
                        <span>Mantenha fotos nítidas e descrições detalhadas dos ingredientes.</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1"></span>
                        <span>Preço promocional aparecerá em destaque riscando o preço original.</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1"></span>
                        <span>O limite diário pausa as vendas automaticamente ao esgotar.</span>
                      </div>
                    </div>
                  </div>
                </div>
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
            <div className="p-6 overflow-y-auto">
              <form id="menu-item-form" onSubmit={handleSaveModal} className="flex flex-col gap-4">
                
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

                {/* Categorias (Principal + Adicional) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-gray-700">Categoria Principal *</label>
                    <div className="relative">
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full appearance-none border border-[#E9E4D4] rounded-xl px-4 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233] transition-all bg-white text-gray-800 cursor-pointer"
                      >
                        <option value="Bowls">Bowls</option>
                        <option value="Bebidas">Bebidas</option>
                        <option value="Sobremesas">Sobremesas</option>
                        <option value="Entradas">Entradas</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-gray-700">Categoria Extra / Tag</label>
                    <input
                      type="text"
                      value={formExtraCategory}
                      onChange={(e) => setFormExtraCategory(e.target.value)}
                      placeholder="Ex: Mais pedido, Vegano..."
                      className="w-full border border-[#E9E4D4] rounded-xl px-4 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233] transition-all bg-white text-gray-800"
                    />
                  </div>
                </div>

                {/* Foto do Produto */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-gray-700">Foto do Produto</label>
                  <div className="flex items-center gap-3">
                    <div className="w-[72px] h-[54px] rounded-xl overflow-hidden border border-[#E9E4D4] shadow-2xs shrink-0 bg-gray-50">
                      <img
                        src={formImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1">
                      <button
                        type="button"
                        onClick={() => {
                          const newUrl = prompt("URL da nova foto:", formImage)
                          if (newUrl) setFormImage(newUrl)
                        }}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E9E4D4] bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-gray-500" />
                        <span>Alterar URL da foto</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormImage("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80")}
                        className="flex items-center justify-center gap-1 px-2 py-0.5 text-xs font-semibold text-[#DC2626] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
                        <span>Restaurar foto padrão</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Preços (Original e Promocional) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[13px] font-semibold text-gray-700">Preço Original *</label>
                    <input 
                      type="text" 
                      value={formOriginalPrice} 
                      onChange={(e) => setFormOriginalPrice(e.target.value)} 
                      required
                      className="w-full border border-[#E9E4D4] rounded-xl px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233] transition-all" 
                      placeholder="R$ 0,00" 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[13px] font-semibold text-gray-700">Preço Promocional</label>
                    <input 
                      type="text" 
                      value={formPromoPrice} 
                      onChange={(e) => setFormPromoPrice(e.target.value)} 
                      className="w-full border border-[#E9E4D4] rounded-xl px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233] transition-all" 
                      placeholder="R$ 0,00" 
                    />
                  </div>
                </div>

                {/* Checkbox: Ativar Promoção */}
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div
                      onClick={() => setFormInPromo(!formInPromo)}
                      className={`w-4 h-4 rounded flex items-center justify-center transition-colors cursor-pointer ${
                        formInPromo ? "bg-[#CB5A3C] text-white" : "border border-gray-300 bg-white"
                      }`}
                    >
                      {formInPromo && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-[13px] font-semibold text-gray-700">Ativar preço promocional</span>
                  </label>

                  {/* Interligação com Marketing */}
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-orange-50/60 border border-orange-200/80 text-xs text-[#2E4233]">
                    <Tag className="w-4 h-4 text-[#CB5A3C] shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-bold text-[#CB5A3C] text-[11.5px]">Interligado com Marketing:</span>
                      <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                        Campanhas criadas no menu <strong>Marketing</strong> podem ativar promoções automaticamente nos produtos participantes para exibição destacada no Storefront.
                      </p>
                    </div>
                  </div>
                </div>

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

                {/* Horário de Disponibilidade */}
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-gray-700">Programar Disponibilidade</label>
                  <div
                    onClick={() => {
                      const schedule = prompt("Horário de disponibilidade:", formAvailabilitySchedule)
                      if (schedule) setFormAvailabilitySchedule(schedule)
                    }}
                    className="border border-[#E9E4D4] rounded-xl px-3.5 py-2 flex items-center justify-between text-xs text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{formAvailabilitySchedule}</span>
                    </div>
                    <Pencil className="w-3.5 h-3.5 text-gray-400" />
                  </div>
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
              Tem certeza que deseja excluir <span className="font-bold text-gray-800">"{itemToDelete.name}"</span> do cardápio? Esta ação não pode ser desfeita.
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

    </div>
  )
}
