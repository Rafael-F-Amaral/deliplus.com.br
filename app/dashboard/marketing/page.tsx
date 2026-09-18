import { AppShell } from "@/components/AppShell";
import { Plus, Megaphone, Users, ShoppingBag, DollarSign, ChevronRight, PlayCircle, Leaf, ChevronDown } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import Link from "next/link";

export default function MarketingPage() {
  return (
    <AppShell activePath="/marketing">
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-6">
        <div>
          <h2 className="font-serif text-[42px] md:text-[50px] text-ink-950 font-medium tracking-tight mb-2">Marketing</h2>
          <span className="text-[15px] text-ink-600 block">
            Crie campanhas que trazem seus clientes de volta
          </span>
        </div>
        
        <button className="flex items-center justify-center gap-2 bg-forest-950 text-white hover:bg-forest-900 transition-colors rounded-[12px] px-5 py-3 shadow-sm font-medium">
          <Plus size={18} />
          <span>Nova campanha</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <KPICard 
          title="Campanhas ativas" 
          value="3" 
          comparison="1 vs mês anterior"
          icon={<Megaphone size={20} strokeWidth={1.5} />} 
        />
        <KPICard 
          title="Clientes alcançados" 
          value="1.284" 
          comparison="16% vs mês anterior"
          icon={<Users size={20} strokeWidth={1.5} />} 
        />
        <KPICard 
          title="Pedidos gerados" 
          value="86" 
          comparison="28% vs mês anterior"
          icon={<ShoppingBag size={20} strokeWidth={1.5} />} 
        />
        <KPICard 
          title="Receita atribuída" 
          value="R$ 4.286,70" 
          comparison="23% vs mês anterior"
          icon={<DollarSign size={20} strokeWidth={1.5} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Card Campanhas ativas (Left, larger) */}
        <div className="lg:col-span-7 bg-surface-0 border border-border-200 rounded-[20px] p-6 shadow-[0_4px_16px_rgba(24,31,22,0.02)] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-[22px] text-ink-950">Campanhas ativas</h3>
            <Link href="#" className="text-[14px] font-medium text-terracotta-600 hover:text-terracotta-600/80 flex items-center gap-1 transition-colors">
              Ver todas as campanhas <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="space-y-4 flex-1">
            {/* Campanha 1 */}
            <div className="p-4 rounded-[16px] border border-border-200 bg-surface-0 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-ink-600 shrink-0">
                  <TagIcon size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-medium text-ink-950 text-[15px]">10% de desconto no primeiro pedido</h4>
                    <span className="inline-flex px-2 py-0.5 rounded-[4px] bg-success-soft text-olive-700 text-[11px] font-medium">Ativa</span>
                  </div>
                  <p className="text-[14px] text-ink-600">Incentive novos clientes a fazerem o primeiro pedido.</p>
                  
                  <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
                    <div>
                      <div className="text-[12px] text-ink-600 mb-0.5">Público</div>
                      <div className="text-[13px] font-medium text-ink-950">Novos clientes</div>
                    </div>
                    <div>
                      <div className="text-[12px] text-ink-600 mb-0.5">Período</div>
                      <div className="text-[13px] font-medium text-ink-950">05/05 – 31/05</div>
                    </div>
                    <div>
                      <div className="text-[12px] text-ink-600 mb-0.5">Resgates</div>
                      <div className="text-[13px] font-medium text-ink-950">42</div>
                    </div>
                  </div>
                </div>
              </div>
              <Link href="#" className="text-[14px] font-medium text-terracotta-600 hover:text-terracotta-600/80 flex items-center gap-1 transition-colors mt-2 md:mt-0 whitespace-nowrap self-end md:self-auto">
                Ver desempenho <ChevronRight size={16} />
              </Link>
            </div>

            {/* Campanha 2 */}
            <div className="p-4 rounded-[16px] border border-border-200 bg-surface-0 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-ink-600 shrink-0">
                  <SoupIcon size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-medium text-ink-950 text-[15px]">Volte para o seu bowl</h4>
                    <span className="inline-flex px-2 py-0.5 rounded-[4px] bg-success-soft text-olive-700 text-[11px] font-medium">Ativa</span>
                  </div>
                  <p className="text-[14px] text-ink-600">Clientes inativos há mais de 30 dias.</p>
                  
                  <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
                    <div>
                      <div className="text-[12px] text-ink-600 mb-0.5">Público</div>
                      <div className="text-[13px] font-medium text-ink-950">Clientes inativos</div>
                    </div>
                    <div>
                      <div className="text-[12px] text-ink-600 mb-0.5">Período</div>
                      <div className="text-[13px] font-medium text-ink-950">01/05 – 31/05</div>
                    </div>
                    <div>
                      <div className="text-[12px] text-ink-600 mb-0.5">Resgates</div>
                      <div className="text-[13px] font-medium text-ink-950">28</div>
                    </div>
                  </div>
                </div>
              </div>
              <Link href="#" className="text-[14px] font-medium text-terracotta-600 hover:text-terracotta-600/80 flex items-center gap-1 transition-colors mt-2 md:mt-0 whitespace-nowrap self-end md:self-auto">
                Ver desempenho <ChevronRight size={16} />
              </Link>
            </div>

            {/* Campanha 3 */}
            <div className="p-4 rounded-[16px] border border-border-200 bg-surface-0 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-ink-600 shrink-0">
                  <TruckIcon size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-medium text-ink-950 text-[15px]">Frete grátis acima de R$ 80</h4>
                    <span className="inline-flex px-2 py-0.5 rounded-[4px] bg-warning-soft text-[#B37930] text-[11px] font-medium">Agendada</span>
                  </div>
                  <p className="text-[14px] text-ink-600">Aumente o ticket médio com frete grátis.</p>
                  
                  <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
                    <div>
                      <div className="text-[12px] text-ink-600 mb-0.5">Público</div>
                      <div className="text-[13px] font-medium text-ink-950">Todos os clientes</div>
                    </div>
                    <div>
                      <div className="text-[12px] text-ink-600 mb-0.5">Período</div>
                      <div className="text-[13px] font-medium text-ink-950">20/05 – 31/05</div>
                    </div>
                    <div>
                      <div className="text-[12px] text-ink-600 mb-0.5">Resgates</div>
                      <div className="text-[13px] font-medium text-ink-950">—</div>
                    </div>
                  </div>
                </div>
              </div>
              <Link href="#" className="text-[14px] font-medium text-terracotta-600 hover:text-terracotta-600/80 flex items-center gap-1 transition-colors mt-2 md:mt-0 whitespace-nowrap self-end md:self-auto">
                Editar campanha <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 flex flex-col gap-4 md:gap-6">
          {/* Card Desempenho */}
          <div className="bg-surface-0 border border-border-200 rounded-[20px] p-6 shadow-[0_4px_16px_rgba(24,31,22,0.02)] flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-serif text-[22px] text-ink-950">Desempenho das campanhas</h3>
              <button className="text-[13px] font-medium text-ink-600 border border-border-200 rounded-[8px] px-3 py-1.5 flex items-center gap-2 hover:bg-surface-100 transition-colors">
                Últimos 30 dias <ChevronDown size={14} />
              </button>
            </div>

            <div className="flex gap-12 mb-8">
              <div>
                <div className="flex items-center gap-1.5 mb-1 text-[13px] text-ink-600">
                  Taxa de conversão <div className="w-3.5 h-3.5 rounded-full border border-ink-600 text-[9px] flex items-center justify-center font-medium">i</div>
                </div>
                <div className="text-[32px] font-medium text-ink-950 tracking-tight leading-tight mb-2">18,4%</div>
                <div className="inline-flex items-center gap-1 text-olive-700 text-[12px] font-medium">
                  <span className="rotate-45">↗</span> 3,2 p.p. vs período anterior
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1 text-[13px] text-ink-600">
                  Ticket médio <div className="w-3.5 h-3.5 rounded-full border border-ink-600 text-[9px] flex items-center justify-center font-medium">i</div>
                </div>
                <div className="text-[32px] font-medium text-ink-950 tracking-tight leading-tight mb-2">R$ 49,90</div>
                <div className="inline-flex items-center gap-1 text-olive-700 text-[12px] font-medium">
                  <span className="rotate-45">↗</span> 8% vs período anterior
                </div>
              </div>
            </div>

            {/* Fake Chart area */}
            <div className="flex-1 relative min-h-[160px] w-full border-b border-border-200 pb-8 mt-auto mb-6">
              {/* Y axis lines */}
              <div className="absolute inset-0 flex flex-col justify-between pt-2 pb-8">
                <div className="border-b border-border-200/50 w-full relative"><span className="absolute -left-1 text-[11px] text-ink-600 -top-2">30%</span></div>
                <div className="border-b border-border-200/50 w-full relative"><span className="absolute -left-1 text-[11px] text-ink-600 -top-2">20%</span></div>
                <div className="border-b border-border-200/50 w-full relative"><span className="absolute -left-1 text-[11px] text-ink-600 -top-2">10%</span></div>
                <div className="w-full relative"><span className="absolute -left-1 text-[11px] text-ink-600 -top-2">0%</span></div>
              </div>
              
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-x-0 bottom-8 h-[calc(100%-2rem)] w-full ml-8 z-10">
                <defs>
                  <linearGradient id="gradient2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#68794A" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#68794A" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M 0,80 Q 15,85 25,60 T 50,45 T 75,30 T 100,35 L 100,100 L 0,100 Z" fill="url(#gradient2)" />
                <path d="M 0,80 Q 15,85 25,60 T 50,45 T 75,30 T 100,35" fill="none" stroke="#68794A" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

              <div className="absolute bottom-0 inset-x-0 flex justify-between ml-8 text-[12px] text-ink-600">
                <span>20 Abr</span>
                <span>27 Abr</span>
                <span>04 Mai</span>
                <span>11 Mai</span>
                <span>18 Mai</span>
              </div>
            </div>

            <Link href="#" className="text-[14px] font-medium text-terracotta-600 hover:text-terracotta-600/80 flex items-center gap-1 transition-colors">
              Ver relatório completo <ChevronRight size={16} />
            </Link>
          </div>

          {/* Card Academia */}
          <div className="bg-cream-50 border border-border-200 rounded-[20px] p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <PlayCircle size={120} strokeWidth={1} />
            </div>
            
            <div className="relative z-10">
              <div className="text-[13px] font-medium text-ink-600 uppercase tracking-widest mb-2">Academia Deliplus</div>
              <h3 className="font-serif text-[26px] text-ink-950 leading-tight mb-2">Curso básico de marketing</h3>
              <p className="text-[15px] text-ink-600 mb-4 max-w-[280px]">
                Aprenda a criar campanhas que trazem seus clientes de volta.
              </p>
              
              <div className="inline-block bg-white border border-border-200 text-ink-950 px-2.5 py-1 rounded-[6px] text-[12px] font-medium mb-6 shadow-sm">
                Exclusivo para assinantes
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-[13px] text-ink-600 font-medium mb-2">
                  <span>2 de 6 aulas concluídas</span>
                </div>
                <div className="w-full bg-white border border-border-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-olive-600 h-full rounded-full" style={{ width: '33%' }}></div>
                </div>
              </div>

              <button className="flex items-center justify-center gap-2 bg-surface-0 border border-border-200 hover:bg-white transition-colors rounded-[12px] px-5 py-3 shadow-sm font-medium text-ink-950 w-full sm:w-auto">
                <PlayCircle size={18} />
                <span>Continuar curso</span>
              </button>
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
            <h4 className="font-serif text-[18px] text-ink-950 mb-1">Clientes recorrentes estão prontos para voltar</h4>
            <p className="text-[15px] text-ink-600">Temos sugestões de campanhas personalizadas para reengajar clientes que já compraram de você e aumentar suas vendas.</p>
          </div>
        </div>
        <button className="bg-surface-0 border border-border-200 hover:bg-surface-100 transition-colors rounded-[12px] px-6 py-3 shadow-sm font-medium text-ink-950 whitespace-nowrap">
          Criar campanha
        </button>
      </div>
    </AppShell>
  );
}

// Quick inline icons for the campaigns to avoid massive imports
function TagIcon({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>
}
function SoupIcon({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"/><path d="M7 21h10"/><path d="M19.5 12 22 6"/><path d="M16.25 12 17.5 6"/><path d="M13 12l.5-6"/><path d="M9.75 12 8.5 6"/><path d="M6.5 12 4 6"/></svg>
}
function TruckIcon({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
}
