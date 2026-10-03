"use client"

import { useState, useRef, useEffect } from "react"
import { createInventoryItem, createInventoryCategory, updateInventoryItem, deleteInventoryItem, deleteInventoryCategory } from "./actions"
import { generateShoppingListPDF } from "@/lib/generate-pdf"

function SvgIcon({ path, className }: { path: string, className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={path} />
    </svg>
  )
}

function SolidIcon({ path, className }: { path: string, className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d={path} />
    </svg>
  )
}

export default function InventoryClient({ 
  initialCategories, 
  initialItems,
  storeSlug = "",
  storeName = ""
}: { 
  initialCategories: any[], 
  initialItems: any[],
  storeSlug?: string,
  storeName?: string
}) {
  const [products, setProducts] = useState<any[]>(initialItems);
  const [categories, setCategories] = useState<any[]>(initialCategories);

  // Store public domain URL (https://deliplus.com.br/slug)
  const storeUrl = storeSlug ? `https://deliplus.com.br/${storeSlug}` : "https://deliplus.com.br";

  // Modals state
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<any>(null);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // Category dropdown custom select states
  const [isNewProductCatOpen, setIsNewProductCatOpen] = useState(false);
  const [isEditProductCatOpen, setIsEditProductCatOpen] = useState(false);
  const newProductCatRef = useRef<HTMLDivElement>(null);
  const editProductCatRef = useRef<HTMLDivElement>(null);

  // 3-dots actions menu
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Extra items & adjustments for shopping list (purely local to shopping list session)
  interface ExtraShoppingItem {
    id: string;
    name: string;
    quantity: number;
    unit: string;
  }
  const [extraItems, setExtraItems] = useState<ExtraShoppingItem[]>([]);
  const [newExtraItemName, setNewExtraItemName] = useState("");
  const [newExtraItemQty, setNewExtraItemQty] = useState("1");
  const [newExtraItemUnit, setNewExtraItemUnit] = useState("unidades");
  const [excludedShoppingProductIds, setExcludedShoppingProductIds] = useState<string[]>([]);
  const [shoppingQuantities, setShoppingQuantities] = useState<Record<string, number>>({});

  // Form states for Product
  const [newItemName, setNewItemName] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("unidades");
  const [newItemMinStock, setNewItemMinStock] = useState("");
  const [newItemUnitCost, setNewItemUnitCost] = useState("");
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Form states for Category (Solid Colors)
  const PRESET_COLORS = [
    { bg: '#475569', text: '#FFFFFF' }, // Slate sólido
    { bg: '#DC2626', text: '#FFFFFF' }, // Vermelho sólido
    { bg: '#D97706', text: '#FFFFFF' }, // Âmbar sólido
    { bg: '#16A34A', text: '#FFFFFF' }, // Verde sólido
    { bg: '#2563EB', text: '#FFFFFF' }, // Azul sólido
    { bg: '#9333EA', text: '#FFFFFF' }, // Roxo sólido
    { bg: '#2E4233', text: '#FFFFFF' }, // Verde Deli
    { bg: '#CB5A3C', text: '#FFFFFF' }  // Laranja Deli
  ];

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(PRESET_COLORS[0].bg);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // 11 items per page: fills all available rows with real DB items
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 11;
  const [filterMode, setFilterMode] = useState<'todos' | 'baixo'>('todos');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  // Helper for real currency formatting (R$ 0,00)
  const formatCurrencyInput = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, "");
    if (!digits) return "";
    const cents = parseInt(digits, 10);
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  };

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(target as Node)) {
        setIsCategoryMenuOpen(false);
      }
      if (newProductCatRef.current && !newProductCatRef.current.contains(target as Node)) {
        setIsNewProductCatOpen(false);
      }
      if (editProductCatRef.current && !editProductCatRef.current.contains(target as Node)) {
        setIsEditProductCatOpen(false);
      }
      if (!target.closest('.action-menu-container')) {
        setOpenActionMenuId(null);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Format quantities (e.g. 0.5 kg -> 500 g)
  const formatQuantity = (quantity: number, unit: string) => {
    if (unit === 'kg' && quantity < 1) {
      const grams = Math.round(quantity * 1000);
      return {
        qty: grams.toLocaleString('pt-BR'),
        unit: 'g'
      };
    }
    return {
      qty: quantity.toString().replace('.', ','),
      unit: unit === 'unidades' ? 'un' : unit
    };
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Computations
  const filteredProducts = products.filter((p: any) => {
    if (filterMode === 'baixo' && p.quantity > p.min_stock) return false;
    if (selectedCategoryId !== 'all' && p.category_id !== selectedCategoryId) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const lowStockProducts = products.filter((p: any) => p.quantity <= p.min_stock);
  const activeLowStockProducts = lowStockProducts.filter((p: any) => !excludedShoppingProductIds.includes(p.id));
  const totalValue = products.reduce((acc: number, p: any) => acc + (p.quantity * (p.unit_cost_cents / 100)), 0);
  const totalItems = products.length;
  const lowStockCount = lowStockProducts.length;

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Handlers
  // Shopping list handlers
  const handleAddExtraItem = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter') return;
    if (e && 'preventDefault' in e) e.preventDefault();
    if (newExtraItemName.trim()) {
      const parsedQty = parseFloat(newExtraItemQty.replace(',', '.')) || 1;
      const newItem: ExtraShoppingItem = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        name: newExtraItemName.trim(),
        quantity: Math.max(0.1, parsedQty),
        unit: newExtraItemUnit
      };
      setExtraItems(prev => [newItem, ...prev]);
      setNewExtraItemName("");
      setNewExtraItemQty("1");
    }
  };

  const handleRemoveExtraItem = (id: string) => {
    setExtraItems(prev => prev.filter(item => item.id !== id));
    setShoppingQuantities(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleExcludeProduct = (productId: string) => {
    setExcludedShoppingProductIds(prev => [...prev, productId]);
  };

  const updateShoppingQty = (id: string, newQty: number) => {
    const val = Math.max(0.1, isNaN(newQty) ? 1 : Math.round(newQty * 100) / 100);
    setShoppingQuantities(prev => ({
      ...prev,
      [id]: val
    }));
  };

  const handleEditClick = (p: any) => {
    setProductToEdit(p);
    setNewItemName(p.name);
    setNewCategoryId(p.category_id || "");
    setNewItemQuantity(p.quantity.toString());
    setNewItemUnit(p.unit);
    setNewItemMinStock(p.min_stock.toString());
    const formattedCost = (p.unit_cost_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    setNewItemUnitCost(formattedCost);
    setIsEditProductModalOpen(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || isSavingProduct || !productToEdit) return;
    setIsSavingProduct(true);
    try {
      const digits = newItemUnitCost.replace(/\D/g, "");
      const costCents = digits ? parseInt(digits, 10) : 0;
      await updateInventoryItem(productToEdit.id, {
        name: newItemName.trim(),
        categoryId: newCategoryId || null,
        unit: newItemUnit,
        quantity: parseFloat(newItemQuantity.replace(',', '.')) || 0,
        unitCostCents: costCents,
        minStock: parseFloat(newItemMinStock.replace(',', '.')) || 0
      });

      // Update local state
      setProducts(products.map(p => p.id === productToEdit.id ? {
        ...p,
        name: newItemName.trim(),
        category_id: newCategoryId || null,
        unit: newItemUnit,
        quantity: parseFloat(newItemQuantity.replace(',', '.')) || 0,
        unit_cost_cents: costCents,
        min_stock: parseFloat(newItemMinStock.replace(',', '.')) || 0
      } : p));

      setIsEditProductModalOpen(false);
      setProductToEdit(null);
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar produto");
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || isSavingProduct) return;
    setIsSavingProduct(true);
    try {
      const digits = newItemUnitCost.replace(/\D/g, "");
      const costCents = digits ? parseInt(digits, 10) : 0;
      await createInventoryItem({
        name: newItemName.trim(),
        categoryId: newCategoryId || null,
        unit: newItemUnit,
        quantity: parseFloat(newItemQuantity.replace(',', '.')) || 0,
        unitCostCents: costCents,
        minStock: parseFloat(newItemMinStock.replace(',', '.')) || 0
      });
      setIsNewProductModalOpen(false);
      setNewItemName('');
      setNewItemQuantity('');
      setNewItemUnit('unidades');
      setNewItemMinStock('');
      setNewItemUnitCost('');
    } catch (err) {
      console.error(err);
      alert("Erro ao criar produto");
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleSaveCategory = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || isSavingCategory) return;
    setIsSavingCategory(true);
    try {
      const colorObj = PRESET_COLORS.find(c => c.bg === newCategoryColor) || PRESET_COLORS[0];
      const newCat = await createInventoryCategory({
        name: newCategoryName.trim(),
        colorBg: colorObj.bg,
        colorText: colorObj.text
      });
      setCategories([...categories, newCat]);
      setIsAddingCategory(false);
      setNewCategoryName('');
      setNewCategoryId(newCat.id);
    } catch (err) {
      console.error(err);
      alert("Erro ao criar categoria");
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleGeneratePDF = () => {
    const activeLowStockProducts = lowStockProducts
      .filter((p: any) => !excludedShoppingProductIds.includes(p.id))
      .map((p: any) => ({
        ...p,
        shoppingQty: shoppingQuantities[p.id] ?? Math.max(1, p.min_stock * 2)
      }));

    const activeExtraItems = extraItems.map(item => ({
      id: item.id,
      name: item.name,
      quantity: shoppingQuantities[item.id] ?? item.quantity,
      unit: item.unit
    }));

    generateShoppingListPDF(activeLowStockProducts, categories, activeExtraItems, storeUrl);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    let msg = `*LISTA DE COMPRAS*\n`;
    if (storeName) {
      msg += `*Loja:* ${storeName}\n`;
    }
    msg += `*Data:* ${getFormattedDate()}\n\n`;

    const activeLowStockProducts = lowStockProducts.filter((p: any) => !excludedShoppingProductIds.includes(p.id));

    if (activeLowStockProducts.length > 0) {
      msg += `*ITENS PARA REPOSIÇÃO:*\n`;
      activeLowStockProducts.forEach((p: any) => {
        const qty = shoppingQuantities[p.id] ?? Math.max(1, p.min_stock * 2);
        const formatted = formatQuantity(qty, p.unit);
        msg += `• ${p.name}: *${formatted.qty} ${formatted.unit}*\n`;
      });
      msg += `\n`;
    }

    if (extraItems.length > 0) {
      msg += `*ITENS EXTRAS:*\n`;
      extraItems.forEach(item => {
        const qty = shoppingQuantities[item.id] ?? item.quantity;
        const unitDisplay = item.unit === 'unidades' ? 'un' : item.unit === 'caixas' ? 'cx' : item.unit === 'pacotes' ? 'pct' : item.unit;
        msg += `• ${item.name}: *${qty} ${unitDisplay}*\n`;
      });
      msg += `\n`;
    }

    if (storeUrl) {
      msg += `Acesse nossa loja: ${storeUrl}\n`;
    }

    const encoded = encodeURIComponent(msg);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const getFormattedDate = () => {
    const d = new Date();
    const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
  };

  return (
    <div className="flex flex-col w-full h-full max-h-full max-w-[1400px] mx-auto p-3 md:px-6 pt-3 md:pt-5 pb-3 overflow-hidden justify-between">
      
      {/* Header Area (Unstuck from top, orange title) */}
      <div className="flex flex-col mb-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <h1 className="text-3xl md:text-4xl font-serif text-[#CB5A3C] tracking-tight">Estoque</h1>
          
          {/* Tooltip Icon & Popover */}
          <div className="relative group inline-block">
            <div className="w-5 h-5 rounded-full bg-[#2E4233] text-white flex items-center justify-center text-[12px] font-extrabold leading-none shadow-sm cursor-help hover:scale-105 transition-transform">
              ?
            </div>
            <div className="absolute top-full left-0 mt-2 w-80 p-4 bg-[#2E4233] text-white rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
              <p className="text-[13px] text-white mb-2 leading-relaxed">
                <span className="font-extrabold text-white">Dica:</span> Esta página gerencia todos os insumos, produtos e custos da sua operação.
              </p>
              <div className="flex flex-col gap-2 pt-2 border-t border-white/10 text-[12px] text-white">
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5"></span>
                  <span>Acompanhe o estoque atual e receba alertas automáticos de reposição.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5"></span>
                  <span>Gere e imprima listas de compras personalizadas para seus fornecedores.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5"></span>
                  <span>Controle o custo unitário e o valor total imobilizado em estoque.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-[#2E4233] text-sm md:text-base font-medium mt-0.5">Gerencie produtos e custos do seu estabelecimento.</p>
      </div>

      {/* Summary Cards Row (Full Width Below Title) */}
      <div className="flex flex-col mb-3 shrink-0">
        <div className="hidden md:flex flex-row rounded-2xl bg-white border border-[#E9E4D4] shadow-sm divide-x divide-[#E9E4D4]">
          <div className="flex-1 p-3 px-5 flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-gray-500 mb-0.5">
              <SvgIcon path="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4 text-[#CB5A3C]" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Valor em estoque</span>
            </div>
            <span className="text-2xl font-bold text-[#2E4233]">{formatCurrency(totalValue)}</span>
          </div>
          
          <div className="flex-1 p-3 px-5 flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-gray-500 mb-0.5">
              <SvgIcon path="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" className="w-4 h-4 text-[#CB5A3C]" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Itens cadastrados</span>
            </div>
            <span className="text-2xl font-bold text-[#2E4233]">{totalItems}</span>
          </div>

          <div className="flex-1 p-3 px-5 flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-gray-500 mb-0.5">
              <SvgIcon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="w-4 h-4 text-[#CB5A3C]" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estoque baixo</span>
            </div>
            <span className="text-2xl font-bold text-[#2E4233]">{lowStockCount}</span>
          </div>
        </div>

        {/* Mobile Summary Grid */}
        <div className="md:hidden flex flex-col gap-2 w-full">
          <div className="bg-white border border-[#E9E4D4] rounded-xl p-3 shadow-sm flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <SvgIcon path="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4 text-[#CB5A3C]" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Valor em estoque</span>
            </div>
            <span className="text-xl font-bold text-[#2E4233]">{formatCurrency(totalValue)}</span>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1 bg-white border border-[#E9E4D4] rounded-xl p-3 shadow-sm flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <SvgIcon path="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" className="w-4 h-4 text-[#CB5A3C]" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Itens</span>
              </div>
              <span className="text-base font-bold text-[#2E4233]">{totalItems}</span>
            </div>
            <div className="flex-1 bg-white border border-[#E9E4D4] rounded-xl p-3 shadow-sm flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <SvgIcon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="w-4 h-4 text-[#CB5A3C]" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estoque baixo</span>
              </div>
              <span className="text-base font-bold text-[#2E4233]">{lowStockCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout Bottom Section (Stretches to 100% available height with NO page scrollbar) */}
      <div className="flex flex-col lg:flex-row gap-5 items-stretch flex-1 min-h-0 overflow-hidden">
        
        {/* Left Side: Table & Filters */}
        <div className="flex-1 w-full flex flex-col min-w-0 min-h-0 h-full">
          
          {/* Table Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 mb-2.5 shrink-0 z-30 relative">
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-visible relative">
              <button 
                onClick={() => { setFilterMode('todos'); setCurrentPage(1); }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm transition-colors ${filterMode === 'todos' ? 'bg-[#2E4233] text-white' : 'bg-white border border-[#E9E4D4] text-gray-500 hover:bg-[#F8F6EF]'}`}
              >
                Todos
              </button>
              <button 
                onClick={() => { setFilterMode('baixo'); setCurrentPage(1); }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm transition-colors ${filterMode === 'baixo' ? 'bg-[#2E4233] text-white' : 'bg-white border border-[#E9E4D4] text-gray-500 hover:bg-[#F8F6EF]'}`}
              >
                Baixo estoque
              </button>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-[240px]">
                <SvgIcon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Buscar produto" 
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E9E4D4] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233] transition-all shadow-sm"
                />
              </div>
              <button onClick={() => setIsNewProductModalOpen(true)} className="flex shrink-0 items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#2E4233] hover:bg-[#233327] text-white rounded-xl font-semibold text-xs transition-all duration-300 shadow-sm">
                <SvgIcon path="M12 4v16m8-8H4" className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Novo produto</span>
              </button>
            </div>
          </div>

          {/* Desktop Table (Larger fonts, no subtitle, Geral hidden, reliable 3 dots) */}
          <div className="hidden md:flex flex-col flex-1 h-full min-h-0 bg-white border border-[#E9E4D4] rounded-2xl shadow-sm overflow-hidden justify-between">
            <div className="w-full overflow-x-auto overflow-y-hidden">
              <table className="w-full text-left text-[14px]">
                <thead className="bg-[#FAF8F0] border-b border-[#E9E4D4]">
                  <tr>
                    <th className="px-6 py-2.5 font-semibold text-[#2E4233]">Produto</th>
                    <th className="px-6 py-2.5 font-semibold text-[#2E4233]">Quantidade</th>
                    <th className="px-6 py-2.5 font-semibold text-[#2E4233]">Unidade</th>
                    <th className="px-6 py-2.5 font-semibold text-[#2E4233]">Custo unitário</th>
                    <th className="px-6 py-2.5 font-semibold text-[#2E4233]">Valor em estoque</th>
                    <th className="px-6 py-2.5 font-semibold text-[#2E4233] text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E4D4] border-b border-[#E9E4D4]">
                  {paginatedProducts.map((product: any) => {
                    const isLowStock = product.quantity <= product.min_stock;
                    const stockValue = product.quantity * (product.unit_cost_cents / 100);
                    const formatted = formatQuantity(product.quantity, product.unit);
                    
                    return (
                      <tr key={product.id} className="border-b border-[#E9E4D4] hover:bg-gray-50/50 transition-colors">
                        {/* Produto: Apenas o nome com fonte destacada, sem subtítulo de categoria */}
                        <td className="px-6 py-2">
                          <span className="font-bold text-[#2E4233] text-[15px]">{product.name}</span>
                        </td>
                        
                        <td className={`px-6 py-2 font-bold text-[15px] ${isLowStock ? 'text-[#CB5A3C]' : 'text-[#2E4233]'}`}>
                          {formatted.qty}
                        </td>
                        <td className="px-6 py-2 font-medium text-gray-600 text-[14px]">{formatted.unit}</td>
                        <td className="px-6 py-2 font-medium text-gray-600 text-[14px]">{formatCurrency((product.unit_cost_cents / 100))}</td>
                        <td className="px-6 py-2 font-bold text-[#2E4233] text-[14px]">{formatCurrency(stockValue)}</td>
                        
                        {/* Menu de Ações (3 pontinhos - Janela verde, Editar branco, Excluir vermelho) */}
                        <td className="px-6 py-2 text-right">
                          <div className="action-menu-container relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionMenuId(openActionMenuId === product.id ? null : product.id);
                              }}
                              className="text-gray-400 hover:text-[#2E4233] p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <SvgIcon path="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" className="w-5 h-5 ml-auto" />
                            </button>
                            {openActionMenuId === product.id && (
                              <div className="absolute right-0 top-full mt-1 w-32 bg-[#2E4233] rounded-xl shadow-2xl border border-[#233327] z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-left">
                                <button 
                                  type="button"
                                  onClick={(e) => { 
                                    e.stopPropagation();
                                    setOpenActionMenuId(null); 
                                    handleEditClick(product); 
                                  }} 
                                  className="w-full text-left px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                                >
                                  Editar
                                </button>
                                <button 
                                  type="button"
                                  onClick={(e) => { 
                                    e.stopPropagation();
                                    setOpenActionMenuId(null); 
                                    setProductToDelete(product); 
                                  }} 
                                  className="w-full text-left px-4 py-2 text-sm font-semibold text-[#FF5252] hover:bg-red-500/20 transition-colors"
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
                  
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500 text-sm">
                        Nenhum produto encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls pinned at bottom */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 p-2.5 border-t border-[#E9E4D4] bg-[#FAF8F0]/30 shrink-0">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${
                      currentPage === i + 1 
                        ? 'bg-[#CB5A3C] text-white shadow-sm' 
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-[#E9E4D4]'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile List View */}
          <div className="md:hidden flex flex-col gap-0 mb-4 bg-white border border-[#E9E4D4] rounded-2xl overflow-hidden shadow-sm">
            {paginatedProducts.map((product: any) => {
              const isLowStock = product.quantity <= product.min_stock;
              const stockValue = product.quantity * (product.unit_cost_cents / 100);
              const formatted = formatQuantity(product.quantity, product.unit);
              
              return (
                <div key={product.id} className="flex flex-col p-3 border-b border-[#E9E4D4] relative">
                  <div className="flex items-start gap-2.5">
                    <div className="flex flex-col flex-1">
                      <div className="flex justify-between items-start w-full">
                        <span className="font-bold text-[#2E4233] text-[14px]">{product.name}</span>
                        <div className="flex gap-2">
                          <button onClick={() => handleEditClick(product)} className="text-gray-400 hover:text-[#2E4233] text-xs font-semibold">Editar</button>
                          <button onClick={() => setProductToDelete(product)} className="text-[#CB5A3C] hover:text-[#A8452B] text-xs font-semibold">Excluir</button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div className="flex flex-col">
                          <span className={`font-bold text-sm ${isLowStock ? 'text-[#CB5A3C]' : 'text-[#2E4233]'}`}>
                            {formatted.qty} {formatted.unit}
                          </span>
                          <span className="text-[10px] text-gray-400">Qtd./Unid.</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[#2E4233] text-sm">{formatCurrency((product.unit_cost_cents / 100))}</span>
                          <span className="text-[10px] text-gray-400">Custo</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[#2E4233] text-sm">{formatCurrency(stockValue)}</span>
                          <span className="text-[10px] text-gray-400">Total</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {filteredProducts.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-xs">
                Nenhum produto encontrado.
              </div>
            )}

            {/* Mobile Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-1.5 p-2 bg-[#FAF8F0]/30 border-t border-[#E9E4D4]">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${
                      currentPage === i + 1 
                        ? 'bg-[#CB5A3C] text-white shadow-sm' 
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-[#E9E4D4]'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Alerta Accordion */}
          <div className="md:hidden bg-white border border-[#E9E4D4] rounded-2xl p-3 flex justify-between items-center shadow-sm cursor-pointer mb-4" onClick={() => setIsShoppingListOpen(true)}>
            <div className="flex items-center gap-2">
              <SvgIcon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="w-4 h-4 text-[#CB5A3C]" />
              <h3 className="font-bold text-[#2E4233] text-[13px]">Alerta de reposição</h3>
            </div>
            <div className="flex items-center gap-2">
              {lowStockCount > 0 && <span className="bg-[#CB5A3C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{lowStockCount} alertas</span>}
              <SvgIcon path="M9 5l7 7-7 7" className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          
        </div>

        {/* Right Side: Alerta de Reposição (Larger font, proportional, no modal on card click) */}
        <div className="hidden lg:flex flex-col w-[300px] shrink-0 h-full min-h-0">
          <div className="bg-white border border-[#E9E4D4] rounded-2xl shadow-sm flex flex-col h-full min-h-0 justify-between relative">
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between p-4 border-b border-[#E9E4D4] bg-[#FAF8F0] shrink-0 rounded-t-2xl relative z-10 overflow-visible">
                <div className="flex items-center gap-2">
                  <SvgIcon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="w-4 h-4 text-[#CB5A3C]" />
                  <h3 className="font-serif font-bold text-[#2E4233] text-[17px]">Reposição</h3>
                  
                  {/* Tooltip for Reposição */}
                  <div className="relative group inline-block">
                    <div className="w-4 h-4 rounded-full bg-[#2E4233] text-white flex items-center justify-center text-[10px] font-extrabold leading-none shadow-sm cursor-help hover:scale-105 transition-transform">
                      ?
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[240px] p-3.5 bg-[#2E4233] text-white rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none text-left">
                      <p className="text-[12px] font-bold text-white mb-2 leading-relaxed">
                        Dica:
                      </p>
                      <div className="flex flex-col gap-2 text-[11px] text-white/95 leading-snug">
                        <div className="flex items-start gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1"></span>
                          <span>Produtos que atingiram ou estão abaixo do estoque mínimo.</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1"></span>
                          <span>Clique em "Lista de Compras" para gerar pedido a fornecedores.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {lowStockCount > 0 && <span className="bg-[#CB5A3C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{lowStockCount} alertas</span>}
              </div>
              
              <div className="flex flex-col gap-2.5 p-3.5 overflow-y-auto flex-1 min-h-0">
                {lowStockProducts.map((product: any) => {
                  const formatted = formatQuantity(product.quantity, product.unit);

                  return (
                    <div key={`alert-${product.id}`} className="flex flex-col shrink-0 gap-1 p-2.5 bg-white border border-[#F5D8D1] rounded-xl shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#CB5A3C]"></div>
                      <div className="pl-2">
                        <span className="font-bold text-[#2E4233] text-[14px] truncate block">{product.name}</span>
                      </div>
                      <span className="text-[13px] text-gray-500 pl-2 mt-0.5 font-medium">
                        Restam apenas <span className="text-[#CB5A3C] font-bold">{formatted.qty} {formatted.unit}</span>
                      </span>
                    </div>
                  )
                })}

                {lowStockCount === 0 && (
                  <div className="flex flex-col items-center justify-center p-4 text-center h-full">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center mb-1.5">
                      <SvgIcon path="M5 13l4 4L19 7" className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-[12px] text-gray-500 font-medium">Todos os produtos estão com estoque adequado.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Button at bottom of Reposição card (Pinned to bottom baseline) */}
            <div className="p-3.5 bg-white border-t border-[#E9E4D4] shrink-0">
              <button 
                onClick={() => setIsShoppingListOpen(true)}
                className="w-full py-2.5 bg-[#2E4233] hover:bg-[#233327] text-white rounded-xl font-bold text-[13px] transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <SvgIcon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 012-2h2a2 2 0 012 2" className="w-4 h-4" />
                Lista de Compras
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ==================== MODAL: EDITAR PRODUTO ==================== */}
      {isEditProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#E9E4D4] flex justify-between items-center bg-[#FDFCF9]">
              <h3 className="font-serif font-bold text-[#CB5A3C] text-xl tracking-tight">Editar Produto</h3>
              <button onClick={() => setIsEditProductModalOpen(false)} className="p-1.5 rounded-lg text-[#CB5A3C] hover:bg-[#CB5A3C]/10 transition-colors">
                <SvgIcon path="M6 18L18 6M6 6l12 12" className="w-5 h-5 text-[#CB5A3C]" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="edit-product-form" onSubmit={handleUpdateProduct} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-gray-700">Nome do Produto *</label>
                  <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} required className="w-full border border-[#E9E4D4] rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233] transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-gray-700">Quantidade</label>
                    <input type="text" value={newItemQuantity} onChange={e => setNewItemQuantity(e.target.value)} className="w-full border border-[#E9E4D4] rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233] transition-all" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-gray-700">Unidade</label>
                    <div className="relative">
                      <select value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)} className="w-full appearance-none border border-[#E9E4D4] rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233] transition-all bg-white">
                        <option value="unidades">unidades</option>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="L">L</option>
                        <option value="ml">ml</option>
                        <option value="caixas">caixas</option>
                        <option value="pacotes">pacotes</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <SvgIcon path="M19 9l-7 7-7-7" className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-gray-700">Custo Unitário (R$)</label>
                    <input 
                      type="text" 
                      value={newItemUnitCost} 
                      onChange={e => setNewItemUnitCost(formatCurrencyInput(e.target.value))} 
                      className="w-full border border-[#E9E4D4] rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233] transition-all" 
                      placeholder="R$ 0,00" 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-gray-700">Estoque Mínimo</label>
                    <input type="text" value={newItemMinStock} onChange={e => setNewItemMinStock(e.target.value)} className="w-full border border-[#E9E4D4] rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233] transition-all" />
                  </div>
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-[#E9E4D4] bg-[#FDFCF9] flex justify-end gap-3">
              <button type="button" onClick={() => setIsEditProductModalOpen(false)} className="px-5 py-2.5 text-[14px] font-semibold text-gray-600 hover:text-gray-800 transition-colors">
                Cancelar
              </button>
              <button type="submit" form="edit-product-form" disabled={isSavingProduct || !newItemName.trim()} className="px-6 py-2.5 bg-[#CB5A3C] hover:bg-[#A8452B] text-white rounded-xl font-semibold text-[14px] transition-all shadow-sm disabled:opacity-50">
                {isSavingProduct ? 'Atualizando...' : 'Atualizar Produto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: NOVO PRODUTO ==================== */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#E9E4D4] flex justify-between items-center bg-[#FDFCF9]">
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-[#CB5A3C] text-xl tracking-tight">Novo Produto</h3>
                <div className="relative group inline-block">
                  <div className="w-4 h-4 rounded-full bg-[#2E4233] text-white flex items-center justify-center text-[10px] font-extrabold leading-none shadow-sm cursor-help hover:scale-105 transition-transform">
                    ?
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[250px] p-3.5 bg-[#2E4233] text-white rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none text-left">
                    <p className="text-[12px] font-bold text-white mb-2 leading-relaxed">
                      Dica de cadastro:
                    </p>
                    <div className="flex flex-col gap-2 text-[11px] text-white/95 leading-snug">
                      <div className="flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1"></span>
                        <span>Cadastre insumos, produtos acabados ou embalagens.</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1"></span>
                        <span>Defina a quantidade atual e o estoque mínimo para alertas automáticos.</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1"></span>
                        <span>Informe o custo unitário para cálculo do patrimônio em estoque.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsNewProductModalOpen(false)} className="p-1.5 rounded-lg text-[#CB5A3C] hover:bg-[#CB5A3C]/10 transition-colors">
                <SvgIcon path="M6 18L18 6M6 6l12 12" className="w-5 h-5 text-[#CB5A3C]" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="new-product-form" onSubmit={handleSaveProduct} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-gray-700">Nome do Produto *</label>
                  <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} required className="w-full border border-[#E9E4D4] rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233] transition-all" placeholder="Ex: Açúcar Refinado" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-gray-700">Quantidade</label>
                    <input type="text" value={newItemQuantity} onChange={e => setNewItemQuantity(e.target.value)} className="w-full border border-[#E9E4D4] rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233] transition-all" placeholder="0" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-gray-700">Unidade</label>
                    <div className="relative">
                      <select value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)} className="w-full appearance-none border border-[#E9E4D4] rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233] transition-all bg-white">
                        <option value="unidades">unidades</option>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="L">L</option>
                        <option value="ml">ml</option>
                        <option value="caixas">caixas</option>
                        <option value="pacotes">pacotes</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <SvgIcon path="M19 9l-7 7-7-7" className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-gray-700">Custo Unitário (R$)</label>
                    <input 
                      type="text" 
                      value={newItemUnitCost} 
                      onChange={e => setNewItemUnitCost(formatCurrencyInput(e.target.value))} 
                      className="w-full border border-[#E9E4D4] rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233] transition-all" 
                      placeholder="R$ 0,00" 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-gray-700">Estoque Mínimo</label>
                    <input type="text" value={newItemMinStock} onChange={e => setNewItemMinStock(e.target.value)} className="w-full border border-[#E9E4D4] rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233] transition-all" placeholder="0" />
                  </div>
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-[#E9E4D4] bg-[#FDFCF9] flex justify-end gap-3">
              <button type="button" onClick={() => setIsNewProductModalOpen(false)} className="px-5 py-2.5 text-[14px] font-semibold text-gray-600 hover:text-gray-800 transition-colors">
                Cancelar
              </button>
              <button type="submit" form="new-product-form" disabled={isSavingProduct || !newItemName.trim()} className="px-6 py-2.5 bg-[#CB5A3C] hover:bg-[#A8452B] text-white rounded-xl font-semibold text-[14px] transition-all shadow-sm disabled:opacity-50">
                {isSavingProduct ? 'Salvando...' : 'Salvar Produto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PRINT STYLES ==================== */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-sheet-root, #print-sheet-root * {
            visibility: visible !important;
          }
          #print-sheet-root {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            min-height: 100vh !important;
            background-color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 32px !important;
          }
        }
      `}</style>

      {/* ==================== DEDICATED PRINT SHEET (EXACT PDF DESIGN) ==================== */}
      <div id="print-sheet-root" className="hidden print:block min-h-screen bg-white text-[#223829] font-sans relative overflow-hidden">
        {/* Top Header */}
        <div className="relative z-10 flex justify-between items-start text-[8px] tracking-widest text-[#788278] uppercase mb-4 px-2">
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-[#505a50]">Ingredientes</span>
            <span className="font-bold text-[#505a50]">para grandes</span>
            <span className="font-bold text-[#505a50]">histórias</span>
            <div className="w-5 h-[2px] bg-[#C46949] mt-1"></div>
          </div>
          <div className="flex flex-col items-center">
            <img src="/images/logo-opt.png" alt="DeliPlus" className="h-10 object-contain mb-1" />
            <span className="text-[7px] tracking-[0.25em]">Soluções para uma cozinha mais eficiente</span>
          </div>
          <div className="flex flex-col items-end gap-0.5 text-right">
            <span className="font-bold text-[#505a50]">Boa comida</span>
            <span className="font-bold text-[#505a50]">move negócios</span>
            <div className="w-5 h-[2px] bg-[#C46949] mt-1"></div>
          </div>
        </div>

        {/* Title */}
        <div className="relative z-10 text-center my-6">
          <h1 className="text-3xl font-serif tracking-wider text-[#223829]">LISTA DE COMPRAS</h1>
          <div className="w-12 h-[2px] bg-[#C46949] mx-auto mt-2"></div>
        </div>

        {/* Table */}
        <div className="relative z-10 max-w-xl mx-auto my-6">
          <div className="flex justify-between font-serif font-bold text-xs pb-1.5 border-b border-[#b4beb4] text-[#223829]">
            <span>PRODUTOS</span>
            <span>QUANTIDADE</span>
          </div>
          <div className="divide-y divide-[#b4beb4]/40 text-xs">
            {lowStockProducts
              .filter((p: any) => !excludedShoppingProductIds.includes(p.id))
              .map((p: any) => {
                const qty = shoppingQuantities[p.id] ?? Math.max(1, p.min_stock * 2);
                const formatted = formatQuantity(qty, p.unit);
                return (
                  <div key={p.id} className="flex justify-between py-2 text-[#3c463c]">
                    <span className="font-medium">{p.name}</span>
                    <span className="font-bold">{formatted.qty} {formatted.unit}</span>
                  </div>
                );
              })}
            {extraItems.map((item) => {
              const qty = shoppingQuantities[item.id] ?? item.quantity;
              const unitDisplay = item.unit === 'unidades' ? 'un' : item.unit === 'caixas' ? 'cx' : item.unit === 'pacotes' ? 'pct' : item.unit;
              return (
                <div key={item.id} className="flex justify-between py-2 text-[#3c463c]">
                  <span className="font-medium">{item.name}</span>
                  <span className="font-bold">{qty} {unitDisplay}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 mt-16 pt-6 border-t border-[#c8d0c8]/60 flex justify-between items-end text-[9px] text-[#505a50]">
          <div className="font-serif italic text-xs">
            <p>Cozinhas que alimentam o amanhã</p>
            <div className="w-6 h-[2px] bg-[#C46949] mt-1"></div>
          </div>
          <div className="text-center">
            <p suppressHydrationWarning className="font-serif text-[#646e64]">{storeUrl}</p>
            <p suppressHydrationWarning className="text-[8px] text-[#646e64]">{getFormattedDate()}</p>
          </div>
          <div className="text-right tracking-widest text-[7px] text-[#828278]">
            <div className="w-5 h-[2px] bg-[#C46949] ml-auto mb-1"></div>
            <p>PESSOAS ALIMENTAM RESULTADOS</p>
          </div>
        </div>
      </div>

      {/* ==================== MODAL: LISTA DE COMPRAS ==================== */}
      {isShoppingListOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[500px] overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header (Título laranja, interrogação com dicas e botão fechar) */}
            <div className="px-6 py-4 border-b border-[#E9E4D4] flex justify-between items-center bg-[#FAF8F0] relative z-20 overflow-visible">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-[#CB5A3C] text-xl tracking-tight">Lista de Compras</h3>
                  
                  {/* Tooltip for Lista de Compras */}
                  <div className="relative group inline-block">
                    <div className="w-4 h-4 rounded-full bg-[#2E4233] text-white flex items-center justify-center text-[10px] font-extrabold leading-none shadow-sm cursor-help hover:scale-105 transition-transform">
                      ?
                    </div>
                    <div className="absolute top-full left-0 mt-2 w-[270px] p-3.5 bg-[#2E4233] text-white rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none text-left">
                      <p className="text-[12px] font-bold text-white mb-2 leading-relaxed">
                        Dica da Lista de Compras:
                      </p>
                      <div className="flex flex-col gap-2 text-[11px] text-white/95 leading-snug">
                        <div className="flex items-start gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1"></span>
                          <span>Produtos com estoque em estado crítico são sugeridos automaticamente.</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1"></span>
                          <span>Adicione itens avulsos com a quantidade e unidade de medida desejada.</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1"></span>
                          <span>Envie a lista pronta pelo WhatsApp, baixe o PDF estilizado ou imprima direto.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {activeLowStockProducts.length + extraItems.length} {activeLowStockProducts.length + extraItems.length === 1 ? 'item' : 'itens'} na lista
                </p>
              </div>
              <button 
                onClick={() => setIsShoppingListOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#CB5A3C]/10 text-[#CB5A3C] transition-colors"
              >
                <SvgIcon path="M6 18L18 6M6 6l12 12" className="w-5 h-5 text-[#CB5A3C]" />
              </button>
            </div>

            {/* Campo Fixo de Itens Extras (Posicionado acima da lista) */}
            <div className="px-6 py-3.5 border-b border-[#E9E4D4] bg-[#FDFCF9] shrink-0">
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="text" 
                  placeholder="Item extra (ex: Detergente, papel toalha...)" 
                  value={newExtraItemName}
                  onChange={(e) => setNewExtraItemName(e.target.value)}
                  onKeyDown={handleAddExtraItem}
                  className="flex-1 min-w-0 border border-[#E9E4D4] rounded-xl px-3.5 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233] transition-all shadow-sm bg-white" 
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    placeholder="Qtd"
                    value={newExtraItemQty}
                    onChange={(e) => setNewExtraItemQty(e.target.value)}
                    onKeyDown={handleAddExtraItem}
                    className="w-16 border border-[#E9E4D4] rounded-xl px-2 py-2 text-[13px] font-semibold text-center focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233] transition-all shadow-sm bg-white"
                  />
                  <div className="relative">
                    <select
                      value={newExtraItemUnit}
                      onChange={(e) => setNewExtraItemUnit(e.target.value)}
                      className="appearance-none border border-[#E9E4D4] rounded-xl pl-2.5 pr-6 py-2 text-[13px] font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233] shadow-sm text-gray-700 cursor-pointer"
                    >
                      <option value="unidades">un</option>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="L">L</option>
                      <option value="ml">ml</option>
                      <option value="caixas">cx</option>
                      <option value="pacotes">pct</option>
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <SvgIcon path="M19 9l-7 7-7-7" className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={handleAddExtraItem}
                    disabled={!newExtraItemName.trim()}
                    className="px-3.5 py-2 bg-[#2E4233] hover:bg-[#233327] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all text-[13px] flex items-center justify-center gap-1 shadow-sm shrink-0"
                  >
                    <SvgIcon path="M12 4v16m8-8H4" className="w-4 h-4" />
                    Incluir
                  </button>
                </div>
              </div>
            </div>
            
            {/* Modal Body: Lista de Produtos para Reposição & Itens Extras */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-3 bg-white">
              {activeLowStockProducts.length === 0 && extraItems.length === 0 ? (
                <div className="p-8 bg-gray-50 rounded-2xl text-center text-sm text-gray-500 border border-[#E9E4D4]">
                  Nenhum item na lista de compras no momento.
                </div>
              ) : (
                <>
                  {/* Extra Items (Renderizados como cards iguais aos demais) */}
                  {extraItems.map((item) => {
                    const currentQty = shoppingQuantities[item.id] ?? item.quantity;
                    const unitDisplay = item.unit === 'unidades' ? 'un' : item.unit === 'caixas' ? 'cx' : item.unit === 'pacotes' ? 'pct' : item.unit;
                    
                    return (
                      <div key={item.id} className="flex items-center justify-between shrink-0 gap-3 p-3 border border-[#E9E4D4] rounded-xl bg-white shadow-sm hover:border-[#CB5A3C]/40 transition-colors">
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-bold text-[#2E4233] text-[15px] truncate">{item.name}</span>
                          <span className="text-[12px] text-gray-400 font-medium">
                            Item extra
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center border border-[#E9E4D4] rounded-lg bg-white overflow-hidden shadow-sm">
                            <button 
                              type="button" 
                              onClick={() => updateShoppingQty(item.id, currentQty - 1)}
                              className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-[#2E4233] transition-colors"
                            >
                              <SvgIcon path="M20 12H4" className="w-3.5 h-3.5" />
                            </button>
                            <input 
                              type="number" 
                              step="any"
                              value={currentQty} 
                              onChange={(e) => updateShoppingQty(item.id, parseFloat(e.target.value) || 1)}
                              className="w-12 text-center py-1.5 text-[15px] font-bold text-[#2E4233] focus:outline-none border-x border-[#E9E4D4]" 
                            />
                            <button 
                              type="button" 
                              onClick={() => updateShoppingQty(item.id, currentQty + 1)}
                              className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-[#2E4233] transition-colors"
                            >
                              <SvgIcon path="M12 4v16m8-8H4" className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="text-sm font-medium text-gray-500 w-6 text-center">{unitDisplay}</span>
                          <button 
                            type="button"
                            onClick={() => handleRemoveExtraItem(item.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#CB5A3C] hover:bg-red-50 transition-colors"
                            title="Excluir apenas da lista de compras"
                          >
                            <SvgIcon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Low Stock Products */}
                  {activeLowStockProducts.map((product: any) => {
                    const defaultQty = Math.max(1, product.min_stock * 2);
                    const currentQty = shoppingQuantities[product.id] ?? defaultQty;
                    const formatted = formatQuantity(product.quantity, product.unit);
                    
                    return (
                      <div key={`shop-${product.id}`} className="flex items-center justify-between shrink-0 gap-3 p-3 border border-[#E9E4D4] rounded-xl bg-white shadow-sm hover:border-[#CB5A3C]/40 transition-colors">
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-bold text-[#2E4233] text-[15px] truncate">{product.name}</span>
                          <span className="text-[12px] text-gray-500">
                            Atual: <span className="font-bold text-[#CB5A3C]">{formatted.qty} {formatted.unit}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center border border-[#E9E4D4] rounded-lg bg-white overflow-hidden shadow-sm">
                            <button 
                              type="button" 
                              onClick={() => updateShoppingQty(product.id, currentQty - 1)}
                              className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-[#2E4233] transition-colors"
                            >
                              <SvgIcon path="M20 12H4" className="w-3.5 h-3.5" />
                            </button>
                            <input 
                              type="number" 
                              step="any"
                              value={currentQty} 
                              onChange={(e) => updateShoppingQty(product.id, parseFloat(e.target.value) || 1)}
                              className="w-12 text-center py-1.5 text-[15px] font-bold text-[#2E4233] focus:outline-none border-x border-[#E9E4D4]" 
                            />
                            <button 
                              type="button" 
                              onClick={() => updateShoppingQty(product.id, currentQty + 1)}
                              className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-[#2E4233] transition-colors"
                            >
                              <SvgIcon path="M12 4v16m8-8H4" className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="text-sm font-medium text-gray-500 w-6 text-center">{formatted.unit}</span>
                          <button 
                            type="button"
                            onClick={() => handleExcludeProduct(product.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#CB5A3C] hover:bg-red-50 transition-colors"
                            title="Excluir apenas da lista de compras"
                          >
                            <SvgIcon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
            
            {/* Modal Footer (Actions) */}
            <div className="p-5 border-t border-[#E9E4D4] bg-[#FAF8F0] flex flex-col sm:flex-row gap-3">
              <button 
                type="button"
                onClick={handleShareWhatsApp}
                className="flex-1 py-3 bg-[#25D366] hover:bg-[#1EBE5C] text-white rounded-xl font-bold text-[14px] transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <SvgIcon path="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" className="w-5 h-5" />
                Enviar para Fornecedor
              </button>
              <div className="flex gap-3">
                <button onClick={handleGeneratePDF} className="flex-1 sm:flex-none px-6 py-3 bg-white border border-[#E9E4D4] text-[#2E4233] hover:bg-gray-50 rounded-xl font-bold text-[14px] transition-all flex items-center justify-center gap-2 shadow-sm">
                  <SvgIcon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" className="w-5 h-5" />
                  PDF
                </button>
                <button onClick={handlePrint} className="flex-1 sm:flex-none px-6 py-3 bg-white border border-[#E9E4D4] text-[#2E4233] hover:bg-gray-50 rounded-xl font-bold text-[14px] transition-all flex items-center justify-center gap-2 shadow-sm">
                  <SvgIcon path="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" className="w-5 h-5" />
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CUSTOM DELETE CONFIRMATION MODAL (PRODUTO) ==================== */}
      {productToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 flex flex-col items-center text-center relative overflow-hidden">
            <button 
              onClick={() => setProductToDelete(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#CB5A3C] hover:bg-[#CB5A3C]/10 transition-colors"
            >
              <SvgIcon path="M6 18L18 6M6 6l12 12" className="w-5 h-5 text-[#CB5A3C]" />
            </button>

            <div className="w-14 h-14 rounded-full bg-[#FDF2F0] border-2 border-[#F5D8D1] flex items-center justify-center mb-3 shadow-sm">
              <SvgIcon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-7 h-7 text-[#CB5A3C]" />
            </div>

            <h3 className="font-bold text-[#2E4233] text-lg mb-1">Excluir produto?</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Tem certeza que deseja excluir <span className="font-bold text-gray-800">"{productToDelete.name}"</span>? Esta ação não pode ser desfeita.
            </p>

            <div className="flex w-full gap-3">
              <button 
                type="button" 
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E9E4D4] text-[14px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="button"
                disabled={isDeletingProduct}
                onClick={async () => {
                  setIsDeletingProduct(true);
                  try {
                    await deleteInventoryItem(productToDelete.id);
                    setProducts(products.filter((p: any) => p.id !== productToDelete.id));
                    setProductToDelete(null);
                  } catch (err) {
                    console.error(err);
                    alert("Erro ao excluir produto");
                  } finally {
                    setIsDeletingProduct(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#CB5A3C] hover:bg-[#A8452B] text-[14px] font-semibold text-white shadow-sm transition-all disabled:opacity-50"
              >
                {isDeletingProduct ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CUSTOM DELETE CONFIRMATION MODAL (CATEGORIA) ==================== */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 flex flex-col items-center text-center relative overflow-hidden">
            <button 
              onClick={() => setCategoryToDelete(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#CB5A3C] hover:bg-[#CB5A3C]/10 transition-colors"
            >
              <SvgIcon path="M6 18L18 6M6 6l12 12" className="w-5 h-5 text-[#CB5A3C]" />
            </button>

            <div className="w-14 h-14 rounded-full bg-[#FDF2F0] border-2 border-[#F5D8D1] flex items-center justify-center mb-3 shadow-sm">
              <SvgIcon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-7 h-7 text-[#CB5A3C]" />
            </div>

            <h3 className="font-bold text-[#2E4233] text-lg mb-1">Excluir categoria?</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Tem certeza que deseja excluir a categoria <span className="font-bold text-gray-800">"{categoryToDelete.name}"</span>? Os produtos vinculados a ela não serão apagados.
            </p>

            <div className="flex w-full gap-3">
              <button 
                type="button" 
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E9E4D4] text-[14px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                disabled={isDeletingCategory}
                onClick={async () => {
                  setIsDeletingCategory(true);
                  try {
                    await deleteInventoryCategory(categoryToDelete.id);
                    setCategories(categories.filter((c: any) => c.id !== categoryToDelete.id));
                    if (newCategoryId === categoryToDelete.id) {
                      setNewCategoryId('');
                    }
                    setCategoryToDelete(null);
                  } catch (err) {
                    console.error(err);
                    alert("Erro ao excluir categoria");
                  } finally {
                    setIsDeletingCategory(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#CB5A3C] hover:bg-[#A8452B] text-[14px] font-semibold text-white shadow-sm transition-all disabled:opacity-50"
              >
                {isDeletingCategory ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
