import Link from "next/link"

type GlyphName =
  | "home"
  | "orders"
  | "kitchen"
  | "menu"
  | "people"
  | "megaphone"
  | "money"
  | "report"
  | "team"
  | "settings"
  | "help"
  | "bag"
  | "ticket"
  | "clock"
  | "star"
  | "pause"
  | "calendar"
  | "arrow"
  | "chevron"

const navItems: Array<{ label: string; icon: GlyphName; href: string; active?: boolean }> = [
  { label: "Visão geral", icon: "home", href: "/dashboard", active: true },
  { label: "Pedidos", icon: "orders", href: "/dashboard/orders" },
  { label: "Produção", icon: "kitchen", href: "/dashboard" },
  { label: "Cardápio", icon: "menu", href: "/dashboard/menu" },
  { label: "Clientes", icon: "people", href: "/dashboard" },
  { label: "Marketing", icon: "megaphone", href: "/dashboard" },
  { label: "Financeiro", icon: "money", href: "/dashboard" },
  { label: "Relatórios", icon: "report", href: "/dashboard" },
  { label: "Equipe", icon: "team", href: "/dashboard" },
  { label: "Configurações", icon: "settings", href: "/dashboard" },
]

const metrics = [
  { label: "Pedidos hoje", value: "124", comparison: "18% vs ontem", icon: "bag" as const },
  { label: "Faturamento", value: "R$ 6.842,50", comparison: "15% vs ontem", icon: "money" as const },
  { label: "Ticket médio", value: "R$ 55,18", comparison: "8% vs ontem", icon: "ticket" as const },
  { label: "Novos clientes", value: "32", comparison: "14% vs ontem", icon: "people" as const },
]

const liveOrders = [
  { id: "#1247", customer: "Mariana Souza", time: "13:42", status: "Novo", tone: "bg-sky-50 text-sky-600" },
  { id: "#1246", customer: "Rafael Lima", time: "13:41", status: "Em preparo", tone: "bg-orange-50 text-orange-600" },
  { id: "#1245", customer: "Juliana Martins", time: "13:38", status: "Pronto", tone: "bg-green-50 text-green-700" },
  { id: "#1244", customer: "Lucas Ferreira", time: "13:35", status: "Em entrega", tone: "bg-emerald-50 text-emerald-700" },
]

function Glyph({ name, className = "" }: { name: GlyphName; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  const paths: Record<GlyphName, React.ReactNode> = {
    home: <><path {...common} d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" /></>,
    orders: <><rect {...common} x="5" y="4" width="14" height="17" rx="2" /><path {...common} d="M9 4V2m6 2V2M8 11h8m-8 4h5" /></>,
    kitchen: <><path {...common} d="M7 3v8m3-8v8M4 3v5a3 3 0 0 0 6 0V3m4 0v18m0-10c4 0 5-2 5-5V3" /></>,
    menu: <><path {...common} d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 1 4 17.5v-12Zm16 0A2.5 2.5 0 0 0 17.5 3H13v17h4.5a2.5 2.5 0 0 0 2.5-2.5v-12Z" /></>,
    people: <><circle {...common} cx="9" cy="8" r="3" /><path {...common} d="M3.8 20a5.2 5.2 0 0 1 10.4 0M16 11a3 3 0 1 0-1.7-5.5M17 20a4.5 4.5 0 0 0-2.5-4" /></>,
    megaphone: <><path {...common} d="m4 14 13-5v8L4 12v2Zm0 0v4a2 2 0 0 0 2 2h1l2-5M17 10l3-2m-3 7 3 2" /></>,
    money: <><circle {...common} cx="12" cy="12" r="9" /><path {...common} d="M15 8.5c-.6-.7-1.7-1-3-1-1.7 0-3 .8-3 2.1 0 3.3 6 1.3 6 4.2 0 1.3-1.3 2.2-3.1 2.2-1.4 0-2.6-.5-3.3-1.3M12 5.8v12.4" /></>,
    report: <><path {...common} d="M4 20V10m5 10V4m5 16v-7m5 7V7" /><path {...common} d="M2 21h20" /></>,
    team: <><circle {...common} cx="8" cy="8" r="3" /><circle {...common} cx="17" cy="9" r="2.5" /><path {...common} d="M2.5 20a5.5 5.5 0 0 1 11 0m1.5 0a4.2 4.2 0 0 1 5.5-3.9" /></>,
    settings: <><circle {...common} cx="12" cy="12" r="3" /><path {...common} d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 2-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.8v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-2-2 .1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H5.6v-2.8h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L7 8.2l2-2 .1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h2.8V5a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 2 2-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2V14h-.2a1.7 1.7 0 0 0-1.6 1Z" /></>,
    help: <><path {...common} d="M4 15v-3a8 8 0 0 1 16 0v3M4 15a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2Zm16 0a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2Zm-3 3c0 2-1.5 3-4 3" /></>,
    bag: <><path {...common} d="M5 8h14l-1 12H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2" /></>,
    ticket: <><path {...common} d="M4 8a2 2 0 0 0 0 4v4a2 2 0 0 0 2 2h12v-4a2 2 0 0 0 0-4V6H6a2 2 0 0 0-2 2Z" /><path {...common} d="M12 8v2m0 4v2" /></>,
    clock: <><circle {...common} cx="12" cy="12" r="9" /><path {...common} d="M12 7v5l3 2" /></>,
    star: <><path {...common} d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" /></>,
    pause: <><circle {...common} cx="12" cy="12" r="9" /><path {...common} d="M10 9v6m4-6v6" /></>,
    calendar: <><rect {...common} x="4" y="5" width="16" height="15" rx="2" /><path {...common} d="M8 3v4m8-4v4M4 10h16" /></>,
    arrow: <><path {...common} d="M5 12h14m-5-5 5 5-5 5" /></>,
    chevron: <path {...common} d="m8 10 4 4 4-4" />,
  }

  return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>{paths[name]}</svg>
}

function MetricCard({ label, value, comparison, icon }: (typeof metrics)[number]) {
  return <article className="min-h-[124px] rounded-xl border border-[#e9e8e3] bg-white px-6 py-5 shadow-[0_2px_10px_rgba(41,53,31,.02)]"><div className="flex items-start gap-4"><div className="grid size-11 shrink-0 place-items-center rounded-full bg-[#f2f2ee] text-[#42463c]"><Glyph name={icon} className="size-5" /></div><div className="min-w-0"><p className="text-[13px] font-medium text-[#66675f]">{label}</p><p className="mt-1 whitespace-nowrap text-[25px] font-semibold tracking-[-.045em] text-[#282a25]">{value}</p><p className="mt-2 flex items-center gap-1 whitespace-nowrap text-[12px] font-medium text-[#6c8a57]"><span className="text-[9px]">▲</span>{comparison}</p></div></div></article>
}

function Sidebar() {
  return <aside className="hidden min-h-dvh w-[250px] shrink-0 flex-col bg-[#2c391f] px-5 py-8 text-[#f4f6eb] lg:flex"><div className="px-1 font-serif text-[37px] tracking-[-.06em] text-white">Deliplus</div><div className="mt-7 flex items-center gap-3 rounded-lg border border-white/10 px-3 py-3"><div className="grid size-9 place-items-center rounded-md text-[#e9eee1]"><svg viewBox="0 0 32 32" className="size-8 fill-none stroke-current" strokeWidth="1.35"><path d="M16 3c2 7-1 12-7 14 6 1 10 4 11 10 2-6 5-10 9-11-6-1-10-6-13-13Z" /><path d="M5 7c6 4 10 8 11 16M26 7c-6 4-10 8-11 16" /></svg></div><div className="min-w-0 flex-1"><p className="text-[14px] font-medium">Casa Noma</p><p className="mt-0.5 text-[11px] text-white/65">Ver loja ↗</p></div><Glyph name="chevron" className="size-4 text-white/70" /></div><nav className="mt-7 space-y-1" aria-label="Navegação do dashboard">{navItems.map((item) => <Link key={item.label} href={item.href} className={`flex items-center gap-3 rounded-md px-4 py-3 text-[15px] transition ${item.active ? "bg-white/10 text-white" : "text-white/85 hover:bg-white/7"}`}><Glyph name={item.icon} className="size-5" /><span>{item.label}</span></Link>)}</nav><div className="mt-auto border-t border-white/10 pt-5"><div className="flex items-center gap-3 rounded-lg px-3 py-3"><Glyph name="help" className="size-6" /><div className="flex-1"><p className="text-[13px] font-medium">Precisa de ajuda?</p><p className="mt-0.5 text-[11px] text-[#d77b4e]">Fale com o suporte</p></div><Glyph name="chevron" className="size-4 text-white/70" /></div></div></aside>
}

function OrdersChart() {
  return <section className="rounded-xl border border-[#ecebe6] bg-white p-5 shadow-[0_2px_10px_rgba(41,53,31,.02)]"><div className="flex items-center justify-between"><h2 className="text-[16px] font-semibold tracking-[-.025em] text-[#33342f]">Pedidos ao longo do dia</h2><button className="flex items-center gap-2 rounded-lg border border-[#ecebe6] px-3 py-2 text-[12px] text-[#676961]"><Glyph name="calendar" className="size-4" />Hoje<Glyph name="chevron" className="size-3.5" /></button></div><div className="mt-5 grid grid-cols-[minmax(0,1fr)_115px] gap-4"><div className="min-w-0"><svg viewBox="0 0 500 225" className="h-[205px] w-full" role="img" aria-label="Gráfico de pedidos ao longo do dia"><g stroke="#ecece8" strokeWidth="1"><path d="M34 18H484M34 77H484M34 136H484M34 195H484" /></g><g fill="#777a71" fontSize="12" fontFamily="Arial, sans-serif"><text x="3" y="198">0</text><text x="0" y="139">10</text><text x="0" y="80">20</text><text x="0" y="21">30</text><text x="23" y="219">00h</text><text x="104" y="219">04h</text><text x="190" y="219">08h</text><text x="274" y="219">12h</text><text x="358" y="219">16h</text><text x="440" y="219">20h</text><text x="480" y="219">24h</text></g><path d="M35 193 C51 186 65 188 80 193 S107 198 124 185 S148 163 163 168 S187 174 202 158 S222 118 238 101 S262 80 277 93 S300 97 316 70 S340 53 354 60 S375 48 389 22 S411 15 427 35 S447 49 461 35 S475 42 485 43" fill="none" stroke="#394032" strokeWidth="3" strokeLinecap="round" /></svg></div><dl className="pt-7 text-[13px]"><div><dt className="text-[#62645d]">Total de pedidos</dt><dd className="mt-1 text-[20px] font-semibold text-[#2d2f2a]">124</dd></div><div className="mt-5"><dt className="text-[#62645d]">Concluídos</dt><dd className="mt-1 text-[19px] font-semibold text-[#5c7e4a]">98</dd></div><div className="mt-5"><dt className="text-[#62645d]">Em andamento</dt><dd className="mt-1 text-[19px] font-semibold text-[#cb6e42]">26</dd></div></dl></div><a href="#relatorio" className="mt-1 flex items-center justify-end gap-2 text-[12px] font-medium text-[#c66c45]">Ver relatório completo <Glyph name="arrow" className="size-4" /></a></section>
}

function LiveQueue() {
  return <section className="rounded-xl border border-[#ecebe6] bg-white p-5 shadow-[0_2px_10px_rgba(41,53,31,.02)]"><div className="flex items-center justify-between"><h2 className="text-[16px] font-semibold tracking-[-.025em] text-[#33342f]">Fila de pedidos ao vivo</h2><a href="#pedidos" className="text-[12px] font-medium text-[#c66c45]">Ver todos</a></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[390px] text-left text-[12px]"><thead className="border-b border-[#efeee9] text-[#66675f]"><tr><th className="pb-3 font-medium">Pedido</th><th className="pb-3 font-medium">Cliente</th><th className="pb-3 font-medium">Horário</th><th className="pb-3 text-right font-medium">Status</th></tr></thead><tbody>{liveOrders.map((order) => <tr key={order.id} className="border-b border-[#f0efeb] last:border-0"><td className="py-3 font-semibold text-[#30322c]">{order.id}</td><td className="py-3 text-[#4e504a]">{order.customer}</td><td className="py-3 text-[#4e504a]">{order.time}</td><td className="py-3 text-right"><span className={`rounded-full px-2 py-1 text-[11px] font-medium ${order.tone}`}>{order.status}</span></td></tr>)}</tbody></table></div><a href="#pedidos" className="mt-4 flex items-center gap-2 text-[12px] font-medium text-[#c66c45]">Ver todos os pedidos <Glyph name="arrow" className="size-4" /></a></section>
}

function UnavailableCard() {
  return <section className="rounded-xl border border-[#ecebe6] bg-white p-5 shadow-[0_2px_10px_rgba(41,53,31,.02)]"><div className="flex items-center gap-2"><h2 className="text-[16px] font-semibold tracking-[-.025em] text-[#33342f]">Itens indisponíveis</h2><span className="grid size-4 place-items-center rounded-full border border-[#9a9b95] text-[10px] text-[#73746d]">i</span></div><div className="mt-4 flex items-end justify-between gap-3"><ul className="space-y-3 text-[13px] text-[#5e6059]"><li className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#d65128]" />Picanha Grelhada</li><li className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#d65128]" />Suco Natural Laranja</li><li className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#d65128]" />Risoto de Camarão</li></ul><div className="grid justify-items-center"><div className="relative grid size-20 place-items-center rounded-2xl bg-[#f4f4f1] text-[#dbdbd4]"><Glyph name="orders" className="size-11" /><span className="absolute -right-1 bottom-1 grid size-7 place-items-center rounded-full bg-[#66724c] text-xl text-white">×</span></div><button className="mt-3 rounded-md border border-[#deded8] px-3 py-2 text-[12px] font-medium text-[#4b4d46]">Gerenciar cardápio</button></div></div></section>
}

function PreparationCard() {
  return <section className="rounded-xl border border-[#ecebe6] bg-white p-5 shadow-[0_2px_10px_rgba(41,53,31,.02)]"><div className="flex items-center gap-2"><h2 className="text-[16px] font-semibold tracking-[-.025em] text-[#33342f]">Tempo médio de preparo</h2><span className="grid size-4 place-items-center rounded-full border border-[#9a9b95] text-[10px] text-[#73746d]">i</span></div><div className="mt-6 flex items-end justify-between gap-4"><div><p className="text-[40px] font-semibold leading-none tracking-[-.06em] text-[#292b26]">24 <span className="text-[15px] tracking-normal">min</span></p><p className="mt-2 text-[12px] font-medium text-[#648450]">Meta: até 30 min</p></div><svg viewBox="0 0 180 55" className="h-14 w-40"><path d="M3 42 C16 44 24 42 33 36 S51 26 62 31 S78 35 90 24 S108 13 119 18 S133 31 144 22 S160 21 177 34" fill="none" stroke="#75915e" strokeWidth="2.5" strokeLinecap="round" /><path d="M3 47h174" stroke="#d9ddd2" strokeDasharray="4 4" /></svg></div><a href="#producao" className="mt-8 flex items-center gap-2 text-[12px] font-medium text-[#c66c45]">Ver desempenho da produção <Glyph name="arrow" className="size-4" /></a></section>
}

function PerformanceCard() {
  const rows = [{ icon: "bag" as const, label: "Taxa de aceitação", value: "98%", change: "3 p.p. vs ontem" }, { icon: "clock" as const, label: "Pedidos no prazo", value: "92%", change: "6 p.p. vs ontem" }, { icon: "star" as const, label: "Avaliação média", value: "4,8", change: "0,2 vs ontem" }]
  return <section className="rounded-xl border border-[#ecebe6] bg-white p-5 shadow-[0_2px_10px_rgba(41,53,31,.02)]"><div className="flex items-center justify-between"><h2 className="text-[16px] font-semibold tracking-[-.025em] text-[#33342f]">Resumo de desempenho</h2><button className="flex items-center gap-2 rounded-lg border border-[#ecebe6] px-3 py-2 text-[12px] text-[#676961]">Hoje<Glyph name="chevron" className="size-3.5" /></button></div><div className="mt-3">{rows.map((row) => <div key={row.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-[#f0efeb] py-3 last:border-0"><div className="flex items-center gap-3 text-[13px] text-[#64665f]"><Glyph name={row.icon} className="size-5 text-[#74776e]" />{row.label}</div><strong className="text-[14px] text-[#363832]">{row.value}</strong><span className="text-[11px] text-[#6a8a56]">▲ {row.change}</span></div>)}</div><a href="#relatorios" className="mt-4 flex items-center gap-2 text-[12px] font-medium text-[#c66c45]">Ver todos os relatórios <Glyph name="arrow" className="size-4" /></a></section>
}

export function DashboardPreview({ initialView }: { initialView?: "overview" | "orders" | "menu" }) {
  void initialView
  return <div className="min-h-dvh bg-[#fafaf8] text-[#2d2f2a]"><div className="lg:flex"><Sidebar /><main className="min-w-0 flex-1"><header className="flex min-h-[106px] items-center justify-between border-b border-[#efeee9] bg-white px-5 py-4 sm:px-8 lg:px-10"><div className="lg:hidden"><p className="font-serif text-[25px] tracking-[-.05em] text-[#2b391e]">Deliplus</p><p className="mt-0.5 text-[11px] text-[#73756f]">Casa Noma</p></div><div className="hidden lg:block"><h1 className="text-[34px] font-semibold tracking-[-.055em] text-[#252722]">Visão geral</h1><p className="mt-2 flex items-center gap-2 text-[13px] text-[#676961]"><span className="size-2 rounded-full bg-[#7cc65a] shadow-[0_0_0_4px_rgba(124,198,90,.11)]" />Aberta agora</p></div><div className="flex items-center gap-3"><button className="hidden items-center gap-2 rounded-lg border border-[#ddddd8] bg-white px-5 py-3 text-[13px] font-medium text-[#4a4c45] sm:flex"><Glyph name="pause" className="size-5" />Pausar pedidos</button><button className="flex items-center gap-2 rounded-lg bg-[#2b391e] px-5 py-3 text-[13px] font-medium text-white shadow-sm"><Glyph name="bag" className="size-5" />Abrir pedidos</button></div></header><div className="p-4 sm:p-6 lg:p-10"><div className="lg:hidden"><h1 className="text-[28px] font-semibold tracking-[-.05em] text-[#252722]">Visão geral</h1><p className="mt-2 flex items-center gap-2 text-[13px] text-[#676961]"><span className="size-2 rounded-full bg-[#7cc65a]" />Aberta agora</p></div><section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4 lg:mt-0">{metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</section><section className="mt-5 grid gap-5 xl:grid-cols-2"><OrdersChart /><LiveQueue /></section><section className="mt-5 grid gap-5 lg:grid-cols-[.95fr_1fr_1.14fr]"><UnavailableCard /><PreparationCard /><PerformanceCard /></section></div></main></div></div>
}
