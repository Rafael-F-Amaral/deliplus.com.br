import { AppShell } from "@/components/AppShell";
import { Search, Download, Users, UserPlus, Tag, RotateCw, Leaf, ChevronRight, MoreVertical, ChevronDown } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import Link from "next/link";

export default function ClientesPage() {
  return (
    <AppShell activePath="/clientes">
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-6">
        <div>
          <h2 className="font-serif text-[42px] md:text-[50px] text-ink-950 font-medium tracking-tight mb-2">Clientes</h2>
          <span className="text-[15px] text-ink-600 block">
            Entenda quem compra da sua loja
          </span>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-[320px]">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-600" />
            <input 
              type="text" 
              placeholder="Buscar cliente" 
              className="w-full bg-surface-0 border border-border-200 rounded-[12px] py-3 pl-11 pr-4 text-[15px] text-ink-950 placeholder:text-ink-600 focus:outline-none focus:ring-2 focus:ring-olive-700/50 shadow-sm"
            />
          </div>
          <button className="flex items-center justify-center gap-2 bg-surface-0 border border-border-200 hover:bg-surface-100 transition-colors rounded-[12px] px-5 py-3 shadow-sm font-medium shrink-0">
            <Download size={18} className="text-ink-600" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 hide-scrollbar">
        <button className="whitespace-nowrap px-5 py-2 bg-forest-950 text-white rounded-full text-[15px] font-medium">
          Todos
        </button>
        <button className="whitespace-nowrap px-5 py-2 bg-surface-0 border border-border-200 text-ink-950 hover:bg-surface-100 rounded-full text-[15px] font-medium transition-colors">
          Ativos
        </button>
        <button className="whitespace-nowrap px-5 py-2 bg-surface-0 border border-border-200 text-ink-950 hover:bg-surface-100 rounded-full text-[15px] font-medium transition-colors">
          Recorrentes
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <KPICard 
          title="Clientes ativos" 
          value="842" 
          comparison="12% vs mês anterior"
          icon={<Users size={20} strokeWidth={1.5} />} 
        />
        <KPICard 
          title="Novos este mês" 
          value="32" 
          comparison="18% vs mês anterior"
          icon={<UserPlus size={20} strokeWidth={1.5} />} 
        />
        <KPICard 
          title="Ticket médio" 
          value="R$ 55,18" 
          comparison="18% vs mês anterior"
          icon={<Tag size={20} strokeWidth={1.5} />} 
        />
        <KPICard 
          title="Recompra" 
          value="68%" 
          comparison="6 p.p. vs mês anterior"
          icon={<RotateCw size={20} strokeWidth={1.5} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Card Clientes Table */}
        <div className="bg-surface-0 border border-border-200 rounded-[20px] p-6 shadow-[0_4px_16px_rgba(24,31,22,0.02)] flex flex-col overflow-hidden">
          <h3 className="font-serif text-[22px] text-ink-950 mb-6">Clientes</h3>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="pb-4 text-[13px] font-medium text-ink-600 border-b border-border-200 w-1/3 min-w-[180px]">Cliente</th>
                  <th className="pb-4 text-[13px] font-medium text-ink-600 border-b border-border-200 text-right pr-4">Pedidos</th>
                  <th className="pb-4 text-[13px] font-medium text-ink-600 border-b border-border-200 min-w-[120px]">Último pedido</th>
                  <th className="pb-4 text-[13px] font-medium text-ink-600 border-b border-border-200 min-w-[100px]">Total gasto</th>
                  <th className="pb-4 text-[13px] font-medium text-ink-600 border-b border-border-200 min-w-[100px]">Segmento</th>
                  <th className="pb-4 border-b border-border-200 w-8"></th>
                </tr>
              </thead>
              <tbody className="text-[14px]">
                {/* Row 1 */}
                <tr className="border-b border-border-200/50 last:border-0 hover:bg-surface-100/50 transition-colors group">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-100 border border-border-200 flex items-center justify-center text-[11px] font-medium text-ink-600 shrink-0">MS</div>
                      <span className="font-medium text-ink-950 truncate">Mariana Souza</span>
                    </div>
                  </td>
                  <td className="py-4 text-right pr-4 text-ink-950">12</td>
                  <td className="py-4 text-ink-600">Hoje, 13:42</td>
                  <td className="py-4 font-medium text-ink-950">R$ 662,20</td>
                  <td className="py-4">
                    <span className="inline-flex px-2 py-0.5 rounded-[4px] bg-success-soft text-olive-700 text-[11px] font-medium">Recorrente</span>
                  </td>
                  <td className="py-4 text-right">
                    <button className="text-ink-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-border-200 rounded-md"><MoreVertical size={16} /></button>
                  </td>
                </tr>
                {/* Row 2 */}
                <tr className="border-b border-border-200/50 last:border-0 hover:bg-surface-100/50 transition-colors group">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-100 border border-border-200 flex items-center justify-center text-[11px] font-medium text-ink-600 shrink-0">RL</div>
                      <span className="font-medium text-ink-950 truncate">Rafael Lima</span>
                    </div>
                  </td>
                  <td className="py-4 text-right pr-4 text-ink-950">8</td>
                  <td className="py-4 text-ink-600">Ontem, 13:41</td>
                  <td className="py-4 font-medium text-ink-950">R$ 421,50</td>
                  <td className="py-4">
                    <span className="inline-flex px-2 py-0.5 rounded-[4px] bg-info-soft text-[#3070B3] text-[11px] font-medium">Novo</span>
                  </td>
                  <td className="py-4 text-right">
                    <button className="text-ink-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-border-200 rounded-md"><MoreVertical size={16} /></button>
                  </td>
                </tr>
                {/* Row 3 */}
                <tr className="border-b border-border-200/50 last:border-0 hover:bg-surface-100/50 transition-colors group">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-100 border border-border-200 flex items-center justify-center text-[11px] font-medium text-ink-600 shrink-0">JM</div>
                      <span className="font-medium text-ink-950 truncate">Juliana Martins</span>
                    </div>
                  </td>
                  <td className="py-4 text-right pr-4 text-ink-950">15</td>
                  <td className="py-4 text-ink-600">Ontem, 13:38</td>
                  <td className="py-4 font-medium text-ink-950">R$ 912,80</td>
                  <td className="py-4">
                    <span className="inline-flex px-2 py-0.5 rounded-[4px] bg-success-soft text-olive-700 text-[11px] font-medium">Frequente</span>
                  </td>
                  <td className="py-4 text-right">
                    <button className="text-ink-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-border-200 rounded-md"><MoreVertical size={16} /></button>
                  </td>
                </tr>
                {/* Row 4 */}
                <tr className="border-b border-border-200/50 last:border-0 hover:bg-surface-100/50 transition-colors group">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-100 border border-border-200 flex items-center justify-center text-[11px] font-medium text-ink-600 shrink-0">LF</div>
                      <span className="font-medium text-ink-950 truncate">Lucas Ferreira</span>
                    </div>
                  </td>
                  <td className="py-4 text-right pr-4 text-ink-950">6</td>
                  <td className="py-4 text-ink-600">Ontem, 13:35</td>
                  <td className="py-4 font-medium text-ink-950">R$ 288,60</td>
                  <td className="py-4">
                    <span className="inline-flex px-2 py-0.5 rounded-[4px] bg-info-soft text-[#3070B3] text-[11px] font-medium">Novo</span>
                  </td>
                  <td className="py-4 text-right">
                    <button className="text-ink-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-border-200 rounded-md"><MoreVertical size={16} /></button>
                  </td>
                </tr>
                {/* Row 5 */}
                <tr className="border-b border-border-200/50 last:border-0 hover:bg-surface-100/50 transition-colors group">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-100 border border-border-200 flex items-center justify-center text-[11px] font-medium text-ink-600 shrink-0">CF</div>
                      <span className="font-medium text-ink-950 truncate">Carla Fernandes</span>
                    </div>
                  </td>
                  <td className="py-4 text-right pr-4 text-ink-950">9</td>
                  <td className="py-4 text-ink-600">12/05, 11:22</td>
                  <td className="py-4 font-medium text-ink-950">R$ 507,70</td>
                  <td className="py-4">
                    <span className="inline-flex px-2 py-0.5 rounded-[4px] bg-success-soft text-olive-700 text-[11px] font-medium">Recorrente</span>
                  </td>
                  <td className="py-4 text-right">
                    <button className="text-ink-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-border-200 rounded-md"><MoreVertical size={16} /></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-4 border-t border-border-200">
            <Link href="#" className="flex items-center gap-2 text-terracotta-600 hover:text-terracotta-600/80 font-medium text-[14px] transition-colors">
              Ver todos os clientes <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        {/* Card Retenção de clientes */}
        <div className="bg-surface-0 border border-border-200 rounded-[20px] p-6 shadow-[0_4px_16px_rgba(24,31,22,0.02)] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-serif text-[22px] text-ink-950 flex items-center gap-2">
              Retenção de clientes
              <div className="w-4 h-4 rounded-full border border-ink-600 text-ink-600 flex items-center justify-center text-[10px] font-medium">i</div>
            </h3>
            
            <button className="text-[13px] font-medium text-ink-600 border border-border-200 rounded-[8px] px-3 py-1.5 flex items-center gap-2 hover:bg-surface-100 transition-colors">
              Últimos 6 meses <ChevronDown size={14} />
            </button>
          </div>
          
          <div className="flex items-end gap-3 mb-8">
            <div className="text-[48px] leading-none font-medium text-ink-950 tracking-tight">68%</div>
            <div className="text-[15px] font-medium text-ink-600 mb-1.5">Taxa de recompra</div>
            <div className="inline-flex items-center gap-1 bg-success-soft text-olive-700 px-2 py-0.5 rounded-[6px] text-[12px] font-medium mb-1.5 ml-2">
              <span className="rotate-45">↗</span> 6 p.p. vs período anterior
            </div>
          </div>

          {/* Fake Chart area */}
          <div className="flex-1 relative min-h-[220px] w-full border-b border-border-200 pb-8 mt-auto">
            {/* Y axis lines */}
            <div className="absolute inset-0 flex flex-col justify-between pt-2 pb-8">
              <div className="border-b border-border-200/50 w-full relative"><span className="absolute -left-1 text-[11px] text-ink-600 -top-2">100%</span></div>
              <div className="border-b border-border-200/50 w-full relative"><span className="absolute -left-1 text-[11px] text-ink-600 -top-2">75%</span></div>
              <div className="border-b border-border-200/50 w-full relative"><span className="absolute -left-1 text-[11px] text-ink-600 -top-2">50%</span></div>
              <div className="border-b border-border-200/50 w-full relative"><span className="absolute -left-1 text-[11px] text-ink-600 -top-2">25%</span></div>
              <div className="w-full relative"><span className="absolute -left-1 text-[11px] text-ink-600 -top-2">0%</span></div>
            </div>
            
            {/* The Line - SVG approximation of the chart */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-x-0 bottom-8 h-[calc(100%-2rem)] w-full ml-8 z-10">
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#68794A" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#68794A" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0,70 Q 15,65 25,68 T 50,55 T 75,45 T 100,40 L 100,100 L 0,100 Z" fill="url(#gradient)" />
              <path d="M 0,70 Q 15,65 25,68 T 50,55 T 75,45 T 100,40" fill="none" stroke="#68794A" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            {/* X axis labels */}
            <div className="absolute bottom-0 inset-x-0 flex justify-between ml-8 text-[12px] text-ink-600">
              <span>Dez</span>
              <span>Jan</span>
              <span>Fev</span>
              <span>Mar</span>
              <span>Abr</span>
              <span>Mai</span>
            </div>
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="bg-surface-0 border border-border-200 rounded-[20px] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center text-olive-700 shrink-0">
            <Leaf size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h4 className="font-serif text-[18px] text-ink-950 mb-1">Clientes recorrentes gastam, em média, 2,4x mais e fazem mais pedidos.</h4>
            <p className="text-[15px] text-ink-600">Invista em campanhas de fidelização para aumentar sua taxa de recompra.</p>
          </div>
        </div>
        <button className="bg-surface-0 border border-border-200 hover:bg-surface-100 transition-colors rounded-[12px] px-6 py-3 shadow-sm font-medium text-ink-950 whitespace-nowrap">
          Ver sugestões
        </button>
      </div>

    </AppShell>
  );
}
