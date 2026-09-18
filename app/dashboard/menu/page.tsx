import { AppShell } from "@/components/AppShell";
import { Search, Plus, Image as ImageIcon, MoreVertical, Tag } from "lucide-react";

export default function CardapioPage() {
  return (
    <AppShell activePath="/cardapio">
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-6">
        <div>
          <h2 className="font-serif text-[42px] md:text-[50px] text-ink-950 font-medium tracking-tight mb-2">Cardápio</h2>
          <span className="text-[15px] text-ink-600 block">
            Gerencie itens, disponibilidade e promoções
          </span>
        </div>
        
        <button className="flex items-center justify-center gap-2 bg-forest-950 text-white hover:bg-forest-900 transition-colors rounded-[12px] px-5 py-3 shadow-sm font-medium">
          <Plus size={18} />
          <span>Novo item</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 md:max-w-[400px]">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-600" />
          <input 
            type="text" 
            placeholder="Buscar item" 
            className="w-full bg-surface-0 border border-border-200 rounded-[12px] py-3 pl-11 pr-4 text-[15px] text-ink-950 placeholder:text-ink-600 focus:outline-none focus:ring-2 focus:ring-olive-700/50"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 hide-scrollbar">
        <button className="whitespace-nowrap px-5 py-2 bg-forest-950 text-white rounded-full text-[15px] font-medium">
          Todos
        </button>
        <button className="whitespace-nowrap px-5 py-2 text-ink-600 hover:text-ink-950 rounded-full text-[15px] font-medium transition-colors">
          Bowls
        </button>
        <button className="whitespace-nowrap px-5 py-2 text-ink-600 hover:text-ink-950 rounded-full text-[15px] font-medium transition-colors">
          Bebidas
        </button>
        <button className="whitespace-nowrap px-5 py-2 text-ink-600 hover:text-ink-950 rounded-full text-[15px] font-medium transition-colors">
          Sobremesas
        </button>
      </div>

      <div className="space-y-4">
        {/* Product 1 */}
        <div className="bg-surface-0 border border-border-200 rounded-[20px] p-6 shadow-[0_4px_16px_rgba(24,31,22,0.02)] flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-[180px] h-[180px] bg-surface-100 rounded-[12px] border border-border-200 shrink-0 flex items-center justify-center overflow-hidden relative">
            <ImageIcon size={32} className="text-ink-600 opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-tr from-green-900/10 to-yellow-600/10" />
          </div>
          
          <div className="flex-1 flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-serif text-[22px] text-ink-950 font-medium">Bowl Noma</h3>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-medium text-olive-700">Disponível</span>
                <div className="w-10 h-6 bg-olive-700 rounded-full relative shadow-inner">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
            </div>
            
            <p className="text-[15px] text-ink-600 mb-4 max-w-[600px] leading-relaxed">
              Base de quinoa, falafel, hummus, abacate, pepino, repolho roxo e molho tahine.
            </p>
            
            <div className="text-[22px] font-medium text-ink-950 mb-auto">
              R$ 34,90
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-5 border-t border-border-200">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-[13px] text-ink-600">
                  <span className="w-4 flex justify-center">📊</span>
                  Limite diário: 40 unidades
                </div>
                <div className="inline-flex items-center gap-1.5 bg-success-soft text-olive-700 px-2.5 py-1 rounded-[6px] text-[12px] font-medium">
                  <Tag size={12} /> Promoção ativa
                </div>
              </div>
              <button className="text-ink-600 hover:text-ink-950 p-1">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Product 2 */}
        <div className="bg-surface-0 border border-border-200 rounded-[20px] p-6 shadow-[0_4px_16px_rgba(24,31,22,0.02)] flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-[180px] h-[180px] bg-surface-100 rounded-[12px] border border-border-200 shrink-0 flex items-center justify-center overflow-hidden relative">
            <ImageIcon size={32} className="text-ink-600 opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-700/10 to-orange-400/10" />
          </div>
          
          <div className="flex-1 flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-serif text-[22px] text-ink-950 font-medium">Chá da casa</h3>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-medium text-olive-700">Disponível</span>
                <div className="w-10 h-6 bg-olive-700 rounded-full relative shadow-inner">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
            </div>
            
            <p className="text-[15px] text-ink-600 mb-4 max-w-[600px] leading-relaxed">
              Blend exclusivo de ervas e especiarias selecionadas.
            </p>
            
            <div className="text-[22px] font-medium text-ink-950 mb-auto">
              R$ 9,90
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-5 border-t border-border-200">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-[13px] text-ink-600">
                  <span className="w-4 flex justify-center">📊</span>
                  Limite diário: 120 unidades
                </div>
                <div className="inline-flex items-center gap-1.5 bg-info-soft text-[#3070B3] px-2.5 py-1 rounded-[6px] text-[12px] font-medium">
                  10% de desconto
                </div>
              </div>
              <button className="text-ink-600 hover:text-ink-950 p-1">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-center text-[13px] text-ink-600 mb-8">
        Mostrando 2 de 2 itens
      </div>
    </AppShell>
  );
}
