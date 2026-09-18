import { AppShell } from "@/components/AppShell";
import { Download, ChevronDown, Activity, Clock, FileText, CheckCircle2 } from "lucide-react";
import { KPICard } from "@/components/KPICard";

export default function RelatoriosPage() {
  return (
    <AppShell activePath="/relatorios">
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-6">
        <div>
          <h2 className="font-serif text-[42px] md:text-[50px] text-ink-950 font-medium tracking-tight mb-2">Relatórios</h2>
          <span className="text-[15px] text-ink-600 block">
            Acompanhe o desempenho da sua loja
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center gap-2 bg-surface-0 border border-border-200 hover:bg-surface-100 transition-colors rounded-[12px] px-5 py-3 shadow-sm font-medium shrink-0">
            Últimos 30 dias <ChevronDown size={18} className="text-ink-600" />
          </button>
          <button className="flex items-center justify-center gap-2 bg-surface-0 border border-border-200 hover:bg-surface-100 transition-colors rounded-[12px] px-5 py-3 shadow-sm font-medium shrink-0">
            <Download size={18} className="text-ink-600" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-serif text-[26px] text-ink-950 mb-4">Vendas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <KPICard 
            title="Total de pedidos" 
            value="3.245" 
            comparison="14% vs mês anterior"
            icon={<FileText size={20} strokeWidth={1.5} />} 
          />
          <KPICard 
            title="Volume bruto (GMV)" 
            value="R$ 145.240,00" 
            comparison="18% vs mês anterior"
            icon={<Activity size={20} strokeWidth={1.5} />} 
          />
          <KPICard 
            title="Ticket médio" 
            value="R$ 44,75" 
            comparison="4% vs mês anterior"
            icon={<Activity size={20} strokeWidth={1.5} />} 
          />
          <KPICard 
            title="Descontos aplicados" 
            value="R$ 4.357,20" 
            comparison="R$ 5.240 no mês anterior"
            comparisonType="neutral"
            icon={<Activity size={20} strokeWidth={1.5} />} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8">
        {/* Gráfico GMV */}
        <div className="bg-surface-0 border border-border-200 rounded-[20px] p-6 shadow-[0_4px_16px_rgba(24,31,22,0.02)] flex flex-col min-h-[360px]">
          <h4 className="font-serif text-[22px] text-ink-950 mb-6">Volume bruto por dia</h4>
          
          <div className="flex-1 relative w-full border-b border-border-200 pb-8 mt-4 mb-4">
            {/* Y axis lines */}
            <div className="absolute inset-0 flex flex-col justify-between pt-2 pb-8">
              <div className="border-b border-border-200/50 w-full relative"><span className="absolute -left-1 text-[11px] text-ink-600 -top-2">R$ 6k</span></div>
              <div className="border-b border-border-200/50 w-full relative"><span className="absolute -left-1 text-[11px] text-ink-600 -top-2">R$ 4k</span></div>
              <div className="border-b border-border-200/50 w-full relative"><span className="absolute -left-1 text-[11px] text-ink-600 -top-2">R$ 2k</span></div>
              <div className="w-full relative"><span className="absolute -left-1 text-[11px] text-ink-600 -top-2">0</span></div>
            </div>
            
            {/* Bars */}
            <div className="absolute inset-x-0 bottom-8 h-[calc(100%-2rem)] ml-10 flex items-end justify-between px-2 gap-2">
              <div className="w-full bg-olive-700 rounded-t-[4px]" style={{ height: '40%' }}></div>
              <div className="w-full bg-olive-700 rounded-t-[4px]" style={{ height: '35%' }}></div>
              <div className="w-full bg-olive-700 rounded-t-[4px]" style={{ height: '45%' }}></div>
              <div className="w-full bg-olive-700 rounded-t-[4px]" style={{ height: '70%' }}></div>
              <div className="w-full bg-olive-700 rounded-t-[4px]" style={{ height: '85%' }}></div>
              <div className="w-full bg-olive-700 rounded-t-[4px]" style={{ height: '90%' }}></div>
              <div className="w-full bg-olive-700 rounded-t-[4px]" style={{ height: '60%' }}></div>
              <div className="w-full bg-olive-700 rounded-t-[4px] opacity-40" style={{ height: '30%' }}></div>
            </div>

            <div className="absolute bottom-0 inset-x-0 flex justify-between ml-10 px-2 text-[12px] text-ink-600">
              <span>Seg</span>
              <span>Ter</span>
              <span>Qua</span>
              <span>Qui</span>
              <span>Sex</span>
              <span>Sáb</span>
              <span>Dom</span>
              <span>Hoje</span>
            </div>
          </div>
        </div>

        {/* Gráfico Pedidos por horário */}
        <div className="bg-surface-0 border border-border-200 rounded-[20px] p-6 shadow-[0_4px_16px_rgba(24,31,22,0.02)] flex flex-col min-h-[360px]">
          <h4 className="font-serif text-[22px] text-ink-950 mb-6">Pedidos por horário</h4>
          
          <div className="flex-1 relative w-full border-b border-border-200 pb-8 mt-4 mb-4">
            {/* Y axis lines */}
            <div className="absolute inset-0 flex flex-col justify-between pt-2 pb-8">
              <div className="border-b border-border-200/50 w-full relative"><span className="absolute -left-1 text-[11px] text-ink-600 -top-2">100</span></div>
              <div className="border-b border-border-200/50 w-full relative"><span className="absolute -left-1 text-[11px] text-ink-600 -top-2">75</span></div>
              <div className="border-b border-border-200/50 w-full relative"><span className="absolute -left-1 text-[11px] text-ink-600 -top-2">50</span></div>
              <div className="w-full relative"><span className="absolute -left-1 text-[11px] text-ink-600 -top-2">0</span></div>
            </div>
            
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-x-0 bottom-8 h-[calc(100%-2rem)] w-full ml-8 z-10">
              <defs>
                <linearGradient id="gradient3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C45F37" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#C45F37" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0,90 Q 20,85 40,40 T 60,30 T 80,60 T 100,85 L 100,100 L 0,100 Z" fill="url(#gradient3)" />
              <path d="M 0,90 Q 20,85 40,40 T 60,30 T 80,60 T 100,85" fill="none" stroke="#C45F37" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            <div className="absolute bottom-0 inset-x-0 flex justify-between ml-8 text-[12px] text-ink-600">
              <span>11h</span>
              <span>13h</span>
              <span>15h</span>
              <span>17h</span>
              <span>19h</span>
              <span>21h</span>
              <span>23h</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-serif text-[26px] text-ink-950 mb-4">Operação</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <KPICard 
            title="Taxa de cancelamento" 
            value="1,2%" 
            comparison="0,4 p.p. vs mês anterior"
            comparisonType="negative"
            icon={<Activity size={20} strokeWidth={1.5} />} 
          />
          <KPICard 
            title="Avaliação média" 
            value="4,8" 
            comparison="Estável"
            comparisonType="neutral"
            icon={<CheckCircle2 size={20} strokeWidth={1.5} />} 
          />
          <KPICard 
            title="Tempo online" 
            value="284h" 
            comparison="12h a mais vs mês anterior"
            comparisonType="positive"
            icon={<Clock size={20} strokeWidth={1.5} />} 
          />
        </div>
      </div>
      
    </AppShell>
  );
}
