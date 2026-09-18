import { AppShell } from "@/components/AppShell";
import { Download, ChevronDown, DollarSign, ArrowRightLeft, CreditCard, ExternalLink, Receipt } from "lucide-react";
import { KPICard } from "@/components/KPICard";

export default function FinanceiroPage() {
  return (
    <AppShell activePath="/financeiro">
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-6">
        <div>
          <h2 className="font-serif text-[42px] md:text-[50px] text-ink-950 font-medium tracking-tight mb-2">Financeiro</h2>
          <span className="text-[15px] text-ink-600 block">
            Acompanhe seus repasses e faturamento
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center gap-2 bg-surface-0 border border-border-200 hover:bg-surface-100 transition-colors rounded-[12px] px-5 py-3 shadow-sm font-medium shrink-0">
            Mês atual (Maio) <ChevronDown size={18} className="text-ink-600" />
          </button>
          <button className="flex items-center justify-center gap-2 bg-surface-0 border border-border-200 hover:bg-surface-100 transition-colors rounded-[12px] px-5 py-3 shadow-sm font-medium shrink-0">
            <Download size={18} className="text-ink-600" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="lg:col-span-2">
          <div className="bg-forest-950 border border-forest-900 rounded-[20px] p-6 shadow-sm flex flex-col justify-between h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <DollarSign size={120} strokeWidth={1} className="text-white" />
            </div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                  <DollarSign size={20} strokeWidth={1.5} />
                </div>
                <h3 className="text-[15px] font-medium text-gray-300">Próximo repasse</h3>
              </div>
              
              <div className="mt-auto">
                <div className="text-[42px] font-medium text-white tracking-tight mb-1">
                  R$ 18.240,50
                </div>
                <div className="flex items-center gap-1.5 text-[14px] text-gray-300">
                  Agendado para <span className="font-medium text-white">28 de Maio</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <KPICard 
          title="Faturamento bruto" 
          value="R$ 145.240,00" 
          icon={<Receipt size={20} strokeWidth={1.5} />} 
        />
        <KPICard 
          title="Receita líquida estimada" 
          value="R$ 126.832,20" 
          comparison="Após taxas e deduções"
          comparisonType="neutral"
          icon={<DollarSign size={20} strokeWidth={1.5} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8">
        {/* Card DRE Simplificado */}
        <div className="bg-surface-0 border border-border-200 rounded-[20px] p-6 shadow-[0_4px_16px_rgba(24,31,22,0.02)] flex flex-col">
          <h3 className="font-serif text-[22px] text-ink-950 mb-6">Resumo do período</h3>
          
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between py-3 border-b border-border-200/50">
              <span className="text-[15px] text-ink-600">Faturamento bruto (GMV)</span>
              <span className="text-[15px] font-medium text-ink-950">R$ 145.240,00</span>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-border-200/50">
              <span className="text-[15px] text-terracotta-600 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-terracotta-600"></div>
                Descontos promocionais
              </span>
              <span className="text-[15px] text-terracotta-600">- R$ 4.357,20</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border-200/50">
              <span className="text-[15px] text-terracotta-600 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-terracotta-600"></div>
                Taxas de plataforma (8%)
              </span>
              <span className="text-[15px] text-terracotta-600">- R$ 11.270,62</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border-200/50">
              <span className="text-[15px] text-terracotta-600 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-terracotta-600"></div>
                Taxas de pagamento (1.99%)
              </span>
              <span className="text-[15px] text-terracotta-600">- R$ 2.779,98</span>
            </div>
            
            <div className="flex items-center justify-between pt-4 mt-2">
              <span className="text-[16px] font-medium text-ink-950">Receita líquida estimada</span>
              <span className="text-[20px] font-medium text-olive-700">R$ 126.832,20</span>
            </div>
          </div>
        </div>

        {/* Card Repasses Anteriores */}
        <div className="bg-surface-0 border border-border-200 rounded-[20px] p-6 shadow-[0_4px_16px_rgba(24,31,22,0.02)] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-[22px] text-ink-950">Últimos repasses</h3>
            <button className="text-[14px] font-medium text-terracotta-600 hover:text-terracotta-600/80 transition-colors">
              Ver todos
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-[12px] border border-border-200 hover:bg-surface-100 transition-colors group cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-success-soft flex items-center justify-center text-olive-700">
                  <ArrowRightLeft size={18} />
                </div>
                <div>
                  <div className="font-medium text-[15px] text-ink-950">21 de Maio, 2026</div>
                  <div className="text-[13px] text-ink-600 flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-olive-700"></div> Concluído
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-[15px] text-ink-950">R$ 16.420,80</div>
                <div className="text-[13px] text-terracotta-600 flex items-center justify-end gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver recibo <ExternalLink size={12} />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-[12px] border border-border-200 hover:bg-surface-100 transition-colors group cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-success-soft flex items-center justify-center text-olive-700">
                  <ArrowRightLeft size={18} />
                </div>
                <div>
                  <div className="font-medium text-[15px] text-ink-950">14 de Maio, 2026</div>
                  <div className="text-[13px] text-ink-600 flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-olive-700"></div> Concluído
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-[15px] text-ink-950">R$ 17.184,30</div>
                <div className="text-[13px] text-terracotta-600 flex items-center justify-end gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver recibo <ExternalLink size={12} />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-[12px] border border-border-200 hover:bg-surface-100 transition-colors group cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-success-soft flex items-center justify-center text-olive-700">
                  <ArrowRightLeft size={18} />
                </div>
                <div>
                  <div className="font-medium text-[15px] text-ink-950">07 de Maio, 2026</div>
                  <div className="text-[13px] text-ink-600 flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-olive-700"></div> Concluído
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-[15px] text-ink-950">R$ 15.990,15</div>
                <div className="text-[13px] text-terracotta-600 flex items-center justify-end gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver recibo <ExternalLink size={12} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Banner */}
      <div className="bg-surface-0 border border-border-200 rounded-[20px] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center text-ink-950 shrink-0">
            <CreditCard size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h4 className="font-serif text-[18px] text-ink-950 mb-1">Dados bancários</h4>
            <p className="text-[15px] text-ink-600">Conta corrente terminada em •••• 4231 (Banco Itaú)</p>
          </div>
        </div>
        <button className="bg-surface-0 border border-border-200 hover:bg-surface-100 transition-colors rounded-[12px] px-6 py-3 shadow-sm font-medium text-ink-950 whitespace-nowrap">
          Alterar conta
        </button>
      </div>

    </AppShell>
  );
}
