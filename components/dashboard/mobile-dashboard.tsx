"use client"

import { useState } from "react"

type MobileView = "overview" | "orders" | "performance"
type IconName = "menu" | "bag" | "pause" | "calendar" | "chevron" | "home" | "orders" | "kitchen" | "book" | "more" | "clock" | "star" | "check" | "close" | "search" | "filter"

const orders = [
  { id: "#1247", customer: "Mariana Souza", time: "13:42", status: "Novo", tone: "bg-[#eef7ff] text-[#2675a5]" },
  { id: "#1246", customer: "Rafael Lima", time: "13:41", status: "Em preparo", tone: "bg-[#fff4e8] text-[#bb6a22]" },
  { id: "#1245", customer: "Juliana Martins", time: "13:38", status: "Pronto", tone: "bg-[#eef7ed] text-[#4c7a4b]" },
  { id: "#1244", customer: "Lucas Ferreira", time: "13:35", status: "Em entrega", tone: "bg-[#ecf6f1] text-[#34755f]" },
]

function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  const paths: Record<IconName, React.ReactNode> = {
    menu: <path {...common} d="M4 7h16M4 12h16M4 17h16" />,
    bag: <><path {...common} d="M5 8h14l-1 12H6L5 8Z" /><path {...common} d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
    pause: <><circle {...common} cx="12" cy="12" r="9" /><path {...common} d="M10 9v6m4-6v6" /></>,
    calendar: <><rect {...common} x="4" y="5" width="16" height="15" rx="2" /><path {...common} d="M8 3v4m8-4v4M4 10h16" /></>,
    chevron: <path {...common} d="m9 6 6 6-6 6" />,
    home: <path {...common} d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" />,
    orders: <><rect {...common} x="5" y="4" width="14" height="17" rx="2" /><path {...common} d="M9 4V2m6 2V2M8 11h8m-8 4h5" /></>,
    kitchen: <path {...common} d="M7 3v8m3-8v8M4 3v5a3 3 0 0 0 6 0V3m4 0v18m0-10c4 0 5-2 5-5V3" />,
    book: <path {...common} d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 1 4 17.5v-12Zm16 0A2.5 2.5 0 0 0 17.5 3H13v17h4.5a2.5 2.5 0 0 0 2.5-2.5v-12Z" />,
    more: <path {...common} d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth="3.5" />,
    clock: <><circle {...common} cx="12" cy="12" r="9" /><path {...common} d="M12 7v5l3 2" /></>,
    star: <path {...common} d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />,
    check: <><circle {...common} cx="12" cy="12" r="9" /><path {...common} d="m8 12 2.5 2.5L16.5 9" /></>,
    close: <><path {...common} d="m6 6 12 12M18 6 6 18" /></>,
    search: <><circle {...common} cx="10.8" cy="10.8" r="6.8" /><path {...common} d="m16 16 4.5 4.5" /></>,
    filter: <path {...common} d="M4 6h16M7 12h10m-7 6h4" />,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>{paths[name]}</svg>
}

function MobileHeader({ active }: { active: MobileView }) {
  const [open, setOpen] = useState(false)
  const items = [
    { label: "Visão geral", href: "/dashboard", view: "overview" as MobileView },
    { label: "Pedidos", href: "/dashboard/orders", view: "orders" as MobileView },
    { label: "Produção", href: "/dashboard", view: "performance" as MobileView },
    { label: "Cardápio", href: "/dashboard/menu", view: "performance" as MobileView },
    { label: "Clientes", href: "/dashboard", view: "performance" as MobileView },
    { label: "Marketing", href: "/dashboard", view: "performance" as MobileView },
    { label: "Financeiro", href: "/dashboard", view: "performance" as MobileView },
    { label: "Relatórios", href: "/dashboard", view: "performance" as MobileView },
    { label: "Equipe", href: "/dashboard", view: "performance" as MobileView },
    { label: "Configurações", href: "/dashboard", view: "performance" as MobileView },
  ]
  return <>
    <header className="flex items-center justify-between border-b border-[#e8e8e3] bg-white px-5 pb-5 pt-6">
      <button type="button" aria-label="Abrir navegação" aria-expanded={open} onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-lg text-[#30342a] transition hover:bg-[#f3f3ee] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ba633e]"><Icon name="menu" className="size-6" /></button>
      <p className="font-serif text-[28px] tracking-[-.055em] text-[#28301f]">Deliplus</p>
      <span className="grid size-10 place-items-center rounded-full bg-[#c96543] text-[14px] font-medium text-white">MN</span>
    </header>
    {open && <div className="fixed inset-0 z-40 bg-[#1f2919]/35" role="presentation" onClick={() => setOpen(false)}>
      <aside role="dialog" aria-label="Menu principal" className="h-full w-[min(86vw,340px)] bg-[#2c391f] px-5 py-7 text-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between"><p className="font-serif text-[32px] tracking-[-.06em]">Deliplus</p><button type="button" aria-label="Fechar navegação" onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-lg text-white/90 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><Icon name="close" className="size-5" /></button></div>
        <div className="mt-8 rounded-xl border border-white/10 px-4 py-3"><p className="text-[15px] font-medium">Casa Noma</p><p className="mt-1 text-[12px] text-white/65">Loja aberta agora</p></div>
        <nav className="mt-6 space-y-1" aria-label="Navegação principal">{items.map((item) => <a key={item.label} href={item.href} onClick={() => setOpen(false)} className={`flex min-h-11 items-center rounded-lg px-4 text-[15px] ${item.view === active ? "bg-white/12 font-semibold text-white" : "text-white/82 hover:bg-white/8"}`}>{item.label}</a>)}</nav>
      </aside>
    </div>}
  </>
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-[#e9e9e4] bg-white shadow-[0_2px_10px_rgba(39,49,31,.02)] ${className}`}>{children}</section>
}

function Chart() {
  return <Panel className="p-4"><div className="flex items-center justify-between"><h2 className="text-[16px] font-semibold tracking-[-.035em]">Pedidos ao longo do dia</h2><button className="flex items-center gap-1.5 rounded-lg border border-[#e8e8e3] px-2.5 py-1.5 text-[12px]"><Icon name="calendar" className="size-4" />Hoje<Icon name="chevron" className="size-3.5 rotate-90" /></button></div><svg viewBox="0 0 310 190" className="mt-3 h-auto w-full" role="img" aria-label="Gráfico de pedidos ao longo do dia"><g stroke="#eeeeea" strokeWidth="1"><path d="M28 20h270M28 65h270M28 110h270M28 155h270" /></g><g fill="#777a71" fontSize="10" fontFamily="Arial, sans-serif"><text x="5" y="158">0</text><text x="1" y="113">10</text><text x="1" y="68">20</text><text x="1" y="23">30</text><text x="24" y="180">00h</text><text x="72" y="180">04h</text><text x="120" y="180">08h</text><text x="169" y="180">12h</text><text x="217" y="180">16h</text><text x="264" y="180">20h</text><text x="289" y="180">24h</text></g><path d="M29 154 C42 150 50 155 62 153 S80 148 89 141 S104 132 116 136 S132 138 143 121 S159 87 173 80 S188 91 199 78 S214 53 226 58 S240 67 251 42 S267 19 279 35 S290 45 299 35" fill="none" stroke="#48543b" strokeWidth="2.5" strokeLinecap="round" /></svg></Panel>
}

function BottomNav({ active }: { active: MobileView }) {
  const items: Array<{ view: MobileView | "kitchen" | "menu" | "more"; label: string; icon: IconName; href: string }> = [{ view: "overview", label: "Visão geral", icon: "home", href: "/dashboard" }, { view: "orders", label: "Pedidos", icon: "orders", href: "/dashboard/orders" }, { view: "kitchen", label: "Produção", icon: "kitchen", href: "/dashboard" }, { view: "menu", label: "Cardápio", icon: "book", href: "/dashboard/menu" }, { view: "more", label: "Mais", icon: "more", href: "/dashboard" }]
  return <nav className="sticky bottom-0 z-10 mt-7 grid grid-cols-5 border-t border-[#e8e8e3] bg-white px-1 pb-[max(14px,env(safe-area-inset-bottom))] pt-3" aria-label="Navegação móvel">{items.map((item) => <a key={item.label} href={item.href} className={`grid justify-items-center gap-1 text-[10px] ${item.view === active ? "font-semibold text-[#4a5b36]" : "text-[#555951]"}`}><Icon name={item.icon} className="size-5" /><span>{item.label}</span></a>)}</nav>
}

function MobileOverview() {
  return <><MobileHeader active="overview" /><main className="px-5 pb-4"><h1 className="text-[27px] font-semibold tracking-[-.055em]">Visão geral</h1><Panel className="mt-3 flex items-center gap-3 p-3"><div className="grid size-11 place-items-center rounded-full bg-[#f3f3ee] text-[#35442a]"><span className="text-2xl">♧</span></div><div className="min-w-0 flex-1"><p className="text-[15px] font-semibold">Casa Noma</p><p className="mt-1 flex items-center gap-1.5 text-[12px] text-[#62675d]"><span className="size-2 rounded-full bg-[#79c65a]" />Aberta agora</p></div><Icon name="chevron" className="size-5 text-[#5f625b]" /></Panel><div className="mt-4 grid grid-cols-2 gap-3"><button className="flex items-center justify-center gap-2 rounded-lg border border-[#53564d] bg-white px-3 py-3 text-[13px] font-medium"><Icon name="pause" className="size-5" />Pausar pedidos</button><button className="flex items-center justify-center gap-2 rounded-lg bg-[#39492a] px-3 py-3 text-[13px] font-medium text-white"><Icon name="bag" className="size-5" />Abrir pedidos</button></div><div className="mt-5 grid grid-cols-2 gap-3"><MobileMetric icon="bag" label="Pedidos hoje" value="124" comparison="18% vs ontem" /><MobileMetric icon="calendar" label="Faturamento" value="R$ 6.842,50" comparison="15% vs ontem" /><MobileMetric icon="book" label="Ticket médio" value="R$ 55,18" comparison="8% vs ontem" /><MobileMetric icon="orders" label="Novos clientes" value="32" comparison="14% vs ontem" /></div><div className="mt-4"><Chart /></div></main><BottomNav active="overview" /></>
}

function MobileMetric({ icon, label, value, comparison }: { icon: IconName; label: string; value: string; comparison: string }) {
  const iconTone: Record<IconName, string> = {
    menu: "bg-[#f2ecfb] text-[#7958a1]",
    bag: "bg-[#fff0e9] text-[#c96743]",
    pause: "bg-[#f1f1ee] text-[#687066]",
    calendar: "bg-[#edf2fb] text-[#5273a1]",
    chevron: "bg-[#f1f1ee] text-[#687066]",
    home: "bg-[#eef3e8] text-[#668253]",
    orders: "bg-[#eef3e8] text-[#668253]",
    kitchen: "bg-[#fff0de] text-[#b7742e]",
    book: "bg-[#f2ecfb] text-[#7958a1]",
    more: "bg-[#f1f1ee] text-[#687066]",
    clock: "bg-[#fff0de] text-[#b7742e]",
    star: "bg-[#fff6df] text-[#b47d20]",
    check: "bg-[#edf4e8] text-[#5d7b4e]",
    close: "bg-[#fff0e9] text-[#c96743]",
    search: "bg-[#edf2fb] text-[#5273a1]",
    filter: "bg-[#edf2fb] text-[#5273a1]",
  }
  return <Panel className="min-h-[112px] p-3.5"><div className={`grid size-9 place-items-center rounded-full ${iconTone[icon]}`}><Icon name={icon} className="size-5" /></div><p className="mt-2 text-[12px] text-[#66685f]">{label}</p><p className="mt-1 whitespace-nowrap text-[20px] font-semibold tracking-[-.045em]">{value}</p><p className="mt-1.5 flex items-center gap-1 whitespace-nowrap text-[10px] text-[#668452]"><span className="text-[8px]">▲</span>{comparison}</p></Panel>
}

function MobileOrderCard({ order, expanded = false }: { order: (typeof orders)[number]; expanded?: boolean }) {
  return <article className={`rounded-xl border border-[#e5e5df] bg-white p-4 shadow-[0_2px_10px_rgba(39,49,31,.04)] ${expanded ? "ring-1 ring-[#d8754b]/35" : ""}`}>
    <div className="flex items-start justify-between gap-3"><div><p className="text-[26px] font-semibold tracking-[-.06em] text-[#28301f]">{order.id}</p><p className="mt-1 text-[16px] font-semibold text-[#30342a]">{order.customer}</p><p className="mt-2 flex items-center gap-2 text-[14px] text-[#64685d]"><Icon name="clock" className="size-4" />{order.time}</p></div><div className="text-right"><p className="text-[14px] text-[#5d6158]">{expanded ? "2 itens" : "3 itens"}</p><p className="mt-1 text-[22px] font-semibold text-[#28301f]">{expanded ? "R$ 64,00" : "R$ 87,50"}</p><span className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-[14px] font-semibold ${order.tone}`}>{order.status}</span></div></div>
    {expanded && <div className="mt-4 border-t border-[#ecebe7] pt-4"><div className="grid gap-4 sm:grid-cols-2"><div><h3 className="text-[15px] font-semibold">Itens do pedido</h3><p className="mt-2 text-[14px] text-[#565b50]">1x Bowl Frango Grelhado <span className="float-right text-[#30342a]">R$ 34,00</span></p><p className="mt-2 text-[14px] text-[#565b50]">1x Suco Natural Laranja <span className="float-right text-[#30342a]">R$ 12,00</span></p><p className="mt-2 text-[14px] text-[#565b50]">1x Taxa de entrega <span className="float-right text-[#30342a]">R$ 18,00</span></p></div><div><h3 className="text-[15px] font-semibold">Observação do cliente</h3><p className="mt-2 text-[14px] text-[#565b50]">Sem cebola, por favor.</p><h3 className="mt-4 text-[15px] font-semibold">Pagamento</h3><p className="mt-2 text-[14px] font-semibold text-[#4f7b46]">Pago online ✓</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><button type="button" className="min-h-12 rounded-lg bg-[#39492a] px-4 text-[16px] font-semibold text-white">Aceitar pedido</button><button type="button" className="min-h-12 rounded-lg border-2 border-[#bf673f] px-4 text-[16px] font-semibold text-[#b75f3b]">Rejeitar</button></div></div>}
  </article>
}

function MobileOrders() {
  return <><MobileHeader active="orders" /><main className="px-5 pb-5"><h1 className="mt-5 text-[32px] font-semibold tracking-[-.055em] text-[#28301f]">Pedidos</h1><div className="mt-5 flex items-center justify-between gap-3"><button type="button" className="flex min-h-12 items-center gap-3 rounded-xl border border-[#e1e1db] bg-white px-4 text-[16px] text-[#52564e]"><Icon name="calendar" className="size-5" />Hoje<Icon name="chevron" className="ml-5 size-4 rotate-90" /></button><div className="flex gap-2"><button type="button" aria-label="Buscar pedido" className="grid size-12 place-items-center rounded-xl border border-[#e1e1db] bg-white"><Icon name="search" className="size-6" /></button><button type="button" aria-label="Filtrar pedidos" className="grid size-12 place-items-center rounded-xl border border-[#e1e1db] bg-white"><Icon name="filter" className="size-6" /></button></div></div><div className="mt-6 grid grid-cols-3 gap-3"><Panel className="p-3 text-center"><p className="text-[14px] font-medium text-[#5d6158]">Novos</p><p className="mt-1 text-[30px] font-semibold text-[#28301f]">8</p></Panel><Panel className="p-3 text-center"><p className="text-[14px] font-medium text-[#5d6158]">Em preparo</p><p className="mt-1 text-[30px] font-semibold text-[#28301f]">12</p></Panel><Panel className="p-3 text-center"><p className="text-[14px] font-medium text-[#5d6158]">Prontos</p><p className="mt-1 text-[30px] font-semibold text-[#28301f]">6</p></Panel></div><div className="mt-7 flex items-center justify-between"><h2 className="flex items-center gap-3 text-[20px] font-semibold tracking-[-.035em]"><span className="size-3 rounded-full bg-[#c96743]" />Fila de pedidos ao vivo</h2><span className="text-[14px] text-[#b75f3b]">Atualizado agora</span></div><div className="mt-4 space-y-3"><MobileOrderCard order={orders[0]} /><MobileOrderCard order={orders[1]} /><MobileOrderCard order={orders[2]} expanded /></div></main><BottomNav active="orders" /></>
}

function MobilePerformance() {
  const rows = [{ icon: "check" as IconName, label: "Taxa de aceitação", value: "98%", change: "3 p.p. vs ontem" }, { icon: "clock" as IconName, label: "Pedidos no prazo", value: "92%", change: "6 p.p. vs ontem" }, { icon: "star" as IconName, label: "Avaliação média", value: "4,8", change: "0,2 vs ontem" }]
  return <><MobileHeader active="overview" /><main className="px-5 pb-4"><h1 className="text-[27px] font-semibold tracking-[-.055em]">Desempenho</h1><Panel className="mt-4 p-4"><h2 className="flex items-center gap-2 text-[17px] font-semibold tracking-[-.035em]">Itens indisponíveis <span className="grid size-4 place-items-center rounded-full border border-[#9c9e97] text-[10px] text-[#6d7068]">i</span></h2><div className="mt-4 flex items-center justify-between gap-3"><ul className="space-y-3 text-[14px] text-[#5b5e56]"><li className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#c95029]" />Picanha Grelhada</li><li className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#c95029]" />Suco Natural Laranja</li><li className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#c95029]" />Risoto de Camarão</li></ul><div className="relative grid size-20 place-items-center rounded-2xl bg-[#f5f5f1] text-[#deded8]"><Icon name="orders" className="size-11" /><span className="absolute -right-1 bottom-1 grid size-7 place-items-center rounded-full bg-[#596943] text-white">×</span></div></div><button className="mt-5 w-full rounded-lg border border-[#656861] py-2.5 text-[13px] font-medium">Gerenciar cardápio</button></Panel><Panel className="mt-4 p-4"><h2 className="flex items-center gap-2 text-[17px] font-semibold tracking-[-.035em]">Tempo médio de preparo <span className="grid size-4 place-items-center rounded-full border border-[#9c9e97] text-[10px] text-[#6d7068]">i</span></h2><div className="mt-5 flex items-end justify-between"><div><p className="text-[40px] font-semibold leading-none tracking-[-.06em]">24 <span className="text-[16px] tracking-normal">min</span></p><p className="mt-2 text-[13px] text-[#648450]">Meta: até 30 min</p></div><svg viewBox="0 0 154 55" className="h-14 w-36"><path d="M3 42 C16 44 24 42 33 36 S51 26 62 31 S78 35 90 24 S108 13 119 18 S133 31 144 22 S150 21 152 30" fill="none" stroke="#627b4b" strokeWidth="2.5" strokeLinecap="round" /><path d="M3 47h149" stroke="#d9ddd2" strokeDasharray="4 4" /></svg></div></Panel><Panel className="mt-4 p-4"><h2 className="flex items-center gap-2 text-[17px] font-semibold tracking-[-.035em]">Resumo de desempenho <span className="grid size-4 place-items-center rounded-full border border-[#9c9e97] text-[10px] text-[#6d7068]">i</span></h2><div className="mt-3 divide-y divide-[#efefeb]">{rows.map((row) => <div key={row.label} className="grid grid-cols-[24px_1fr_auto] items-center gap-2 py-3.5"><Icon name={row.icon} className="size-5 text-[#62675d]" /><span className="text-[13px] text-[#5a5e55]">{row.label}</span><strong className="text-[17px]">{row.value}</strong><span /><span className="col-span-2 text-right text-[10px] text-[#668452]">▲ {row.change}</span></div>)}</div></Panel></main><BottomNav active="overview" /></>
}

export function MobileDashboard({ view }: { view: MobileView }) {
  return <div className="min-h-dvh bg-[#fafaf8] text-[#30332d]">{view === "overview" ? <MobileOverview /> : view === "orders" ? <MobileOrders /> : <MobilePerformance />}</div>
}
