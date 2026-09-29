"use client"

import { useState, useRef, useEffect } from "react"

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

// --- MOCK DATA ---

type Category = {
  id: string;
  name: string;
  colorBg: string;
  colorText: string;
};

const CATEGORIES: Record<string, Category> = {
  'mercearia': { id: 'mercearia', name: 'Mercearia', colorBg: '#F4F5EE', colorText: '#55694C' },
  'frios': { id: 'frios', name: 'Frios', colorBg: '#E0F2FE', colorText: '#0369A1' },
  'embalagens': { id: 'embalagens', name: 'Embalagens', colorBg: '#F3E8FF', colorText: '#6B21A8' },
  'hortifruti': { id: 'hortifruti', name: 'Hortifruti', colorBg: '#ECFCCB', colorText: '#3F6212' },
};

type Product = {
  id: string;
  name: string;
  categoryId: string;
  quantity: number;
  unit: string;
  unitCost: number;
  minStock: number;
  icon: string;
};

const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Farinha de trigo', categoryId: 'mercearia', quantity: 25, unit: 'kg', unitCost: 5.80, minStock: 10, icon: '🌾' },
  { id: '2', name: 'Queijo muçarela', categoryId: 'frios', quantity: 8, unit: 'kg', unitCost: 32.90, minStock: 10, icon: '🧀' },
  { id: '3', name: 'Embalagem marmita 500ml', categoryId: 'embalagens', quantity: 120, unit: 'unidades', unitCost: 0.85, minStock: 100, icon: '🥡' },
  { id: '4', name: 'Tomate', categoryId: 'hortifruti', quantity: 4.5, unit: 'kg', unitCost: 8.90, minStock: 5, icon: '🍅' },
];

export default function InventoryPage() {
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
  
  // --- STATE ---
  const [filterMode, setFilterMode] = useState<'todos' | 'baixo'>('todos');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  // Close category menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- COMPUTATIONS ---
  const filteredProducts = MOCK_PRODUCTS.filter(p => {
    if (filterMode === 'baixo' && p.quantity > p.minStock) return false;
    if (selectedCategoryId !== 'all' && p.categoryId !== selectedCategoryId) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const lowStockProducts = MOCK_PRODUCTS.filter(p => p.quantity <= p.minStock);

  const totalValue = MOCK_PRODUCTS.reduce((acc, p) => acc + (p.quantity * p.unitCost), 0);
  const totalItems = MOCK_PRODUCTS.length;
  const lowStockCount = lowStockProducts.length;
  const averageUnitCost = totalItems > 0 ? MOCK_PRODUCTS.reduce((acc, p) => acc + p.unitCost, 0) / totalItems : 0;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="flex flex-col md:h-full w-full p-4 pb-24 md:p-6 max-w-[1400px] mx-auto min-h-0 md:overflow-hidden">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8 shrink-0">
        <div className="flex flex-col">
          <h1 className="text-4xl md:text-5xl font-serif text-[#CB5A3C] tracking-tight mb-2">Estoque</h1>
          <p className="text-[#2E4233] text-lg font-medium">Gerencie produtos e custos do seu estabelecimento.</p>
        </div>
      </div>

      {/* Visão do Estoque Section */}
      <div className="flex flex-col mb-5 shrink-0">
        
        {/* Desktop Summary Grid */}
        <div className="hidden md:flex flex-row rounded-2xl bg-white border border-[#E9E4D4] shadow-sm divide-x divide-[#E9E4D4]">
          <div className="flex-1 p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <SvgIcon path="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5 text-[#CB5A3C]" />
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Valor em estoque</span>
            </div>
            <span className="text-3xl font-bold text-[#2E4233]">{formatCurrency(totalValue)}</span>
          </div>
          
          <div className="flex-[0.8] p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <SvgIcon path="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" className="w-5 h-5 text-[#CB5A3C]" />
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Itens cadastrados</span>
            </div>
            <span className="text-3xl font-bold text-[#2E4233]">{totalItems}</span>
          </div>
          
          <div className="flex-[0.8] p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <SvgIcon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="w-5 h-5 text-[#CB5A3C]" />
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Estoque baixo</span>
            </div>
            <span className="text-3xl font-bold text-[#2E4233]">{lowStockCount}</span>
          </div>
          
          <div className="flex-1 p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <SvgIcon path="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5 text-[#CB5A3C]" />
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Custo médio unitário</span>
            </div>
            <span className="text-3xl font-bold text-[#2E4233]">{formatCurrency(averageUnitCost)}</span>
          </div>
        </div>

        {/* Mobile Summary Grid */}
        <div className="md:hidden flex flex-col gap-3">
          <div className="bg-white border border-[#E9E4D4] rounded-xl p-5 shadow-sm flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <SvgIcon path="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4 text-[#CB5A3C]" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Valor em estoque</span>
            </div>
            <span className="text-2xl font-bold text-[#2E4233]">{formatCurrency(totalValue)}</span>
          </div>
          
          <div className="flex gap-3">
            <div className="flex-1 bg-white border border-[#E9E4D4] rounded-xl p-4 shadow-sm flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-1">
                <SvgIcon path="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" className="w-4 h-4 text-[#CB5A3C]" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Itens</span>
              </div>
              <span className="text-xl font-bold text-[#2E4233]">{totalItems}</span>
            </div>
            <div className="flex-1 bg-white border border-[#E9E4D4] rounded-xl p-4 shadow-sm flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-1">
                <SvgIcon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="w-4 h-4 text-[#CB5A3C]" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estoque baixo</span>
              </div>
              <span className="text-xl font-bold text-[#2E4233]">{lowStockCount}</span>
            </div>
          </div>

          <div className="bg-white border border-[#E9E4D4] rounded-xl p-5 shadow-sm flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <SvgIcon path="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4 text-[#CB5A3C]" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Custo médio unitário</span>
            </div>
            <span className="text-2xl font-bold text-[#2E4233]">{formatCurrency(averageUnitCost)}</span>
          </div>
        </div>
      </div>

      {/* Main Layout Bottom Section */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch flex-1 min-h-0">
        
        {/* Left Side: Table & Filters */}
        <div className="flex-1 w-full flex flex-col min-w-0 min-h-0">
          
          {/* Table Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-3 shrink-0">
            
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
              <button 
                onClick={() => setFilterMode('todos')}
                className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap shadow-sm transition-colors ${filterMode === 'todos' ? 'bg-[#2E4233] text-white' : 'bg-white border border-[#E9E4D4] text-gray-500 hover:bg-[#F8F6EF]'}`}
              >
                Todos
              </button>
              <button 
                onClick={() => setFilterMode('baixo')}
                className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap shadow-sm transition-colors ${filterMode === 'baixo' ? 'bg-[#2E4233] text-white' : 'bg-white border border-[#E9E4D4] text-gray-500 hover:bg-[#F8F6EF]'}`}
              >
                Baixo estoque
              </button>
              
              <div className="relative" ref={categoryMenuRef}>
                <button 
                  onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                  className={`px-5 py-2 border rounded-full text-sm font-semibold whitespace-nowrap flex items-center gap-2 transition-colors ${selectedCategoryId !== 'all' ? 'bg-[#2E4233] text-white border-[#2E4233] shadow-sm' : 'bg-white border-[#E9E4D4] text-gray-500 hover:bg-[#F8F6EF]'}`}
                >
                  {selectedCategoryId !== 'all' ? CATEGORIES[selectedCategoryId].name : 'Por categoria'}
                  <SvgIcon path="M19 9l-7 7-7-7" className="w-4 h-4" />
                </button>
                
                {isCategoryMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-[#E9E4D4] rounded-xl shadow-lg z-50 overflow-hidden py-1">
                    <button 
                      onClick={() => { setSelectedCategoryId('all'); setIsCategoryMenuOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Todas as categorias
                    </button>
                    {Object.values(CATEGORIES).map(cat => (
                      <button 
                        key={cat.id}
                        onClick={() => { setSelectedCategoryId(cat.id); setIsCategoryMenuOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.colorText }}></div>
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-[280px]">
                <SvgIcon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Buscar produto" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E9E4D4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233] transition-all shadow-sm"
                />
              </div>
              <button className="flex shrink-0 items-center justify-center gap-2 px-4 py-2.5 bg-[#2E4233] hover:bg-[#233327] text-white rounded-xl font-semibold text-[14px] transition-all duration-300 shadow-sm">
                <SvgIcon path="M12 4v16m8-8H4" className="w-4 h-4" />
                <span className="hidden md:inline">Novo produto</span>
              </button>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:flex flex-col flex-1 bg-white border border-[#E9E4D4] rounded-2xl overflow-hidden shadow-sm min-h-0 relative">
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left text-[14px]">
                <thead className="sticky top-0 z-10 backdrop-blur-md bg-white/80 border-b border-[#E9E4D4]">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-500">Produto</th>
                    <th className="px-6 py-4 font-semibold text-gray-500">Categoria</th>
                    <th className="px-6 py-4 font-semibold text-gray-500">Quantidade</th>
                    <th className="px-6 py-4 font-semibold text-gray-500">Unidade</th>
                    <th className="px-6 py-4 font-semibold text-gray-500">Custo unitário</th>
                    <th className="px-6 py-4 font-semibold text-gray-500">Valor em estoque</th>
                    <th className="px-6 py-4 font-semibold text-gray-500 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E4D4]">
                  
                  {filteredProducts.map(product => {
                    const category = CATEGORIES[product.categoryId];
                    const isLowStock = product.quantity <= product.minStock;
                    const stockValue = product.quantity * product.unitCost;
                    
                    return (
                      <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#2E4233] text-[15px]">{product.name}</span>
                            <span className="text-gray-400 text-[12px]">{category?.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span 
                            className="px-2.5 py-1 rounded text-[11px] font-bold tracking-wide"
                            style={{ backgroundColor: category?.colorBg, color: category?.colorText }}
                          >
                            {category?.name}
                          </span>
                        </td>
                        <td className={`px-6 py-3 font-bold ${isLowStock ? 'text-[#CB5A3C]' : 'text-[#2E4233]'}`}>
                          {product.quantity.toString().replace('.', ',')}
                        </td>
                        <td className="px-6 py-3 font-medium text-gray-600">{product.unit}</td>
                        <td className="px-6 py-3 font-medium text-gray-600">{formatCurrency(product.unitCost)}</td>
                        <td className="px-6 py-3 font-bold text-[#2E4233]">{formatCurrency(stockValue)}</td>
                        <td className="px-6 py-3 text-right">
                          <button className="text-gray-400 hover:text-[#2E4233] transition-colors"><SvgIcon path="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" className="w-5 h-5 ml-auto" /></button>
                        </td>
                      </tr>
                    )
                  })}
                  
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        Nenhum produto encontrado.
                      </td>
                    </tr>
                  )}

                  {/* Filler Rows */}
                  {filteredProducts.length > 0 && Array.from({ length: Math.max(0, 5 - filteredProducts.length) }).map((_, i) => (
                    <tr key={`filler-${i}`} className="border-b border-[#E9E4D4]">
                      <td className="px-6 py-4 font-bold text-[#2E4233] text-[15px] text-center">-</td>
                      <td className="px-6 py-4 font-bold text-[#2E4233] text-[15px] text-center">-</td>
                      <td className="px-6 py-4 font-bold text-[#2E4233] text-[15px] text-center">-</td>
                      <td className="px-6 py-4 font-bold text-[#2E4233] text-[15px] text-center">-</td>
                      <td className="px-6 py-4 font-bold text-[#2E4233] text-[15px] text-center">-</td>
                      <td className="px-6 py-4 font-bold text-[#2E4233] text-[15px] text-center">-</td>
                      <td className="px-6 py-4 text-center"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile List View */}
          <div className="md:hidden flex flex-col gap-0 mb-6 bg-white border border-[#E9E4D4] rounded-2xl overflow-hidden shadow-sm">
            
            {filteredProducts.map(product => {
              const category = CATEGORIES[product.categoryId];
              const isLowStock = product.quantity <= product.minStock;
              const stockValue = product.quantity * product.unitCost;
              
              return (
                <div key={product.id} className="flex flex-col p-4 border-b border-[#E9E4D4] relative">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{product.icon}</span>
                    <div className="flex flex-col flex-1">
                      <div className="flex justify-between items-start w-full">
                        <span className="font-bold text-[#2E4233] text-[15px]">{product.name}</span>
                      </div>
                      <span className="text-gray-400 text-[12px] mb-3">{category?.name}</span>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col">
                          <span className={`font-bold text-sm ${isLowStock ? 'text-[#CB5A3C]' : 'text-[#2E4233]'}`}>
                            {product.quantity.toString().replace('.', ',')} {product.unit === 'unidades' ? 'unid.' : product.unit}
                          </span>
                          <span className="text-[10px] text-gray-400">Qtd./Unid.</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[#2E4233] text-sm">{formatCurrency(product.unitCost)}</span>
                          <span className="text-[10px] text-gray-400">Custo</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[#2E4233] text-sm">{formatCurrency(stockValue)}</span>
                          <span className="text-[10px] text-gray-400">Total</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <SvgIcon path="M9 5l7 7-7 7" className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
                </div>
              )
            })}
            
            {filteredProducts.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                Nenhum produto encontrado.
              </div>
            )}

            {/* Filler Mobile Items */}
            {filteredProducts.length > 0 && Array.from({ length: Math.max(0, 4 - filteredProducts.length) }).map((_, i) => (
              <div key={`filler-mob-${i}`} className="flex flex-col p-4 border-t border-[#E9E4D4] relative">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-1 text-[#2E4233] font-bold ml-1 text-center w-6">-</span>
                  <div className="flex flex-col flex-1 ml-2">
                    <div className="flex justify-between items-start w-full">
                      <span className="font-bold text-[#2E4233] text-[15px] text-center w-full">-</span>
                    </div>
                    <span className="text-[#2E4233] font-bold text-[15px] mb-3 text-center w-full">-</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-[#2E4233] text-sm">-</span>
                        <span className="text-[10px] text-gray-400">Qtd./Unid.</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-[#2E4233] text-sm">-</span>
                        <span className="text-[10px] text-gray-400">Custo</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-[#2E4233] text-sm">-</span>
                        <span className="text-[10px] text-gray-400">Total</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Alerta Accordion */}
          <div className="md:hidden bg-white border border-[#E9E4D4] rounded-2xl p-4 flex justify-between items-center shadow-sm cursor-pointer" onClick={() => setIsShoppingListOpen(true)}>
            <div className="flex items-center gap-2">
              <SvgIcon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="w-5 h-5 text-[#CB5A3C]" />
              <h3 className="font-bold text-[#2E4233] text-[15px]">Alerta de reposição</h3>
            </div>
            <div className="flex items-center gap-2">
              {lowStockCount > 0 && <span className="bg-[#CB5A3C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{lowStockCount} alertas</span>}
              <SvgIcon path="M9 5l7 7-7 7" className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          
        </div>

        {/* Right Side: Alerta de Reposição (Desktop) */}
        <div className="hidden lg:flex flex-col w-[300px] shrink-0 pt-[52px] min-h-0">
          <div className="bg-white border border-[#E9E4D4] rounded-2xl p-0 shadow-sm flex-1 flex flex-col min-h-0 relative overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#E9E4D4] bg-[#FAF8F0]">
              <div className="flex items-center gap-2">
                <SvgIcon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="w-5 h-5 text-[#CB5A3C]" />
                <h3 className="font-serif font-bold text-[#2E4233] text-[19px]">Reposição</h3>
              </div>
              {lowStockCount > 0 && <span className="bg-[#CB5A3C] text-white text-[11px] font-bold px-2 py-1 rounded-full">{lowStockCount} alertas</span>}
            </div>
            
            <div className="flex flex-col gap-3 p-5 overflow-y-auto flex-1 hide-scrollbar pb-[90px]">
              
              {lowStockProducts.map(product => {
                const category = CATEGORIES[product.categoryId];
                return (
                  <div key={`alert-${product.id}`} className="flex flex-col gap-1 p-3 bg-white border border-[#F5D8D1] rounded-xl shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#CB5A3C]"></div>
                    <div className="flex justify-between items-start pl-2">
                      <span className="font-bold text-[#2E4233] text-[14px]">{product.name}</span>
                      <span 
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase"
                        style={{ backgroundColor: category?.colorText + '1A', color: category?.colorText }}
                      >
                        {category?.name}
                      </span>
                    </div>
                    <span className="text-[13px] text-gray-500 pl-2 mt-1 font-medium">Restam apenas <span className="text-[#CB5A3C] font-bold">{product.quantity.toString().replace('.', ',')} {product.unit}</span></span>
                  </div>
                )
              })}

              {/* Informational empty state */}
              {lowStockCount === 0 && (
                <div className="flex flex-col items-center justify-center p-4 mt-2 text-center h-full">
                  <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-3">
                    <SvgIcon path="M5 13l4 4L19 7" className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="text-[13px] text-gray-500 font-medium">Todos os produtos estão com estoque adequado.</p>
                </div>
              )}
              {lowStockCount > 0 && (
                <div className="flex flex-col items-center justify-center p-4 mt-2 text-center">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                    <SvgIcon path="M5 13l4 4L19 7" className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-[12px] text-gray-400 font-medium">Nenhum outro produto crítico.</p>
                </div>
              )}
              
            </div>

            {/* Sticky button at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-[#E9E4D4]">
              <button 
                onClick={() => setIsShoppingListOpen(true)}
                className="w-full py-3 bg-[#2E4233] hover:bg-[#233327] text-white rounded-xl font-bold text-[14px] transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <SvgIcon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 012-2h2a2 2 0 012 2" className="w-4 h-4" />
                Lista de Compras
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Lista de Compras */}
      {isShoppingListOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[500px] overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E9E4D4] flex justify-between items-center bg-[#FAF8F0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2E4233]/10 flex items-center justify-center">
                  <SvgIcon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" className="w-5 h-5 text-[#2E4233]" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-[#2E4233] text-xl">Lista de Compras</h3>
                  <p className="text-sm text-gray-500">{lowStockCount} {lowStockCount === 1 ? 'item' : 'itens'} em estado crítico</p>
                </div>
              </div>
              <button 
                onClick={() => setIsShoppingListOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
              >
                <SvgIcon path="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 bg-white">
              
              <div className="flex flex-col gap-4">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Sugestão Automática</h4>
                
                {lowStockProducts.length === 0 ? (
                  <div className="p-4 bg-gray-50 rounded-xl text-center text-sm text-gray-500">
                    Nenhum produto em estado crítico no momento.
                  </div>
                ) : (
                  lowStockProducts.map(product => (
                    <div key={`shop-${product.id}`} className="flex items-center justify-between gap-4 p-3 border border-[#E9E4D4] rounded-xl bg-[#FAF8F0]/50">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#2E4233] text-[15px]">{product.name}</span>
                        <span className="text-[12px] text-gray-500">Atual: <span className="font-bold text-[#CB5A3C]">{product.quantity.toString().replace('.', ',')} {product.unit === 'unidades' ? 'unid.' : product.unit}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-[#E9E4D4] rounded-lg bg-white overflow-hidden shadow-sm">
                          <button className="px-3 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-[#2E4233] transition-colors"><SvgIcon path="M20 12H4" className="w-4 h-4" /></button>
                          <input type="number" defaultValue={Math.max(1, product.minStock * 2)} className="w-12 text-center py-1.5 text-[15px] font-bold text-[#2E4233] focus:outline-none border-x border-[#E9E4D4]" />
                          <button className="px-3 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-[#2E4233] transition-colors"><SvgIcon path="M12 4v16m8-8H4" className="w-4 h-4" /></button>
                        </div>
                        <span className="text-sm font-medium text-gray-500 w-6">{product.unit === 'unidades' ? 'un' : product.unit}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Itens Extras</h4>
                <div className="flex gap-2">
                  <input type="text" placeholder="Ex: Detergente, papel toalha..." className="flex-1 border border-[#E9E4D4] rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20 focus:border-[#2E4233] transition-all shadow-sm" />
                  <button className="px-4 py-2.5 bg-[#FAF8F0] border border-[#E9E4D4] text-[#2E4233] font-bold rounded-xl hover:bg-[#E9E4D4] transition-colors text-[14px] flex items-center justify-center gap-2 shadow-sm">
                    <SvgIcon path="M12 4v16m8-8H4" className="w-4 h-4" />
                    Incluir
                  </button>
                </div>
              </div>
            </div>
            
            {/* Modal Footer (Actions) */}
            <div className="p-5 border-t border-[#E9E4D4] bg-[#FAF8F0] flex flex-col sm:flex-row gap-3">
              <button className="flex-1 py-3 bg-[#25D366] hover:bg-[#1EBE5C] text-white rounded-xl font-bold text-[14px] transition-all flex items-center justify-center gap-2 shadow-sm">
                <SvgIcon path="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" className="w-5 h-5" />
                Enviar para Fornecedor
              </button>
              <div className="flex gap-3">
                <button className="flex-1 sm:flex-none px-6 py-3 bg-white border border-[#E9E4D4] text-[#2E4233] hover:bg-gray-50 rounded-xl font-bold text-[14px] transition-all flex items-center justify-center gap-2 shadow-sm">
                  <SvgIcon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" className="w-5 h-5" />
                  PDF
                </button>
                <button className="flex-1 sm:flex-none px-6 py-3 bg-white border border-[#E9E4D4] text-[#2E4233] hover:bg-gray-50 rounded-xl font-bold text-[14px] transition-all flex items-center justify-center gap-2 shadow-sm">
                  <SvgIcon path="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" className="w-5 h-5" />
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
