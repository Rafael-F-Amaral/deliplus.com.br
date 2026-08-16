"use client"

import Link from "next/link"
import { useState } from "react"

type View = "overview" | "orders" | "menu"
type OrderStatus = "Novo" | "Em preparo" | "Pronto"
type Order = { id: string; customer: string; items: string; time: string; status: OrderStatus; total: string }

const menuItems = [
  { id: "bowl", name: "Bowl Noma", category: "Mais pedidos", price: "R$ 36,90", available: true },
  { id: "brasa", name: "Brasa & limão", category: "Mais pedidos", price: "R$ 34,90", available: true },
  { id: "nhoque", name: "Nhoque de mandioquinha", category: "Pratos da casa", price: "R$ 42,90", available: true },
  { id: "sanduiche", name: "Sanduíche da esquina", category: "Pratos da casa", price: "R$ 31,90", available: false },
]

const initialOrders: Order[] = [
  { id: "1987", customer: "Marina A.", items: "1× Bowl Noma · 1× Chá da casa", time: "há 2 min", status: "Novo", total: "R$ 48,80" },
  { id: "1986", customer: "João V.", items: "2× Brasa & limão", time: "há 9 min", status: "Em preparo", total: "R$ 69,80" },
  { id: "1985", customer: "Lívia S.", items: "1× Sanduíche da esquina", time: "há 21 min", status: "Pronto", total: "R$ 38,80" },
]

const labels: Record<View, { eyebrow: string; title: string; sub: string }> = {
  overview: { eyebrow: "Bom dia, Marina", title: "Hoje está no seu ritmo.", sub: "Terça, 12 de agosto · 12:20" },
  orders: { eyebrow: "Central operacional", title: "Pedidos em movimento.", sub: "Acompanhe cada etapa sem perder o ritmo." },
  menu: { eyebrow: "Gestão do cardápio", title: "Seu cardápio, vivo.", sub: "Disponibilidade que reflete a sua operação." },
}

function Brand() {
  return <span className="font-serif text-2xl font-semibold tracking-[-.07em] text-[#25352b]">deli<span className="relative">i<span className="absolute -top-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-[#c66747]" /></span>plus</span>
}

export function DashboardPreview() {
  const storefrontPreviewUrl = process.env.NEXT_PUBLIC_STOREFRONT_PREVIEW_URL ?? "http://localhost:3001/casa-noma"
  const [view, setView] = useState<View>("overview")
  const [open, setOpen] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [orders, setOrders] = useState(initialOrders)
  const [availability, setAvailability] = useState<Record<string, boolean>>(() => Object.fromEntries(menuItems.map((item) => [item.id, item.available])))

  function advance(id: string) {
    setOrders((current) => current.map((order) => order.id !== id ? order : { ...order, status: order.status === "Novo" ? "Em preparo" : "Pronto" }))
  }

  const current = labels[view]
  return <div className="min-h-dvh bg-[#f6f2e9] text-[#25352b] lg:flex">
    <Sidebar active={view} onNavigate={setView} />
    <main className="min-w-0 flex-1">
      <header className="sticky top-0 z-30 border-b border-[#ded8cd] bg-[#f6f2e9]/92 px-5 py-4 backdrop-blur-xl md:px-8"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3 lg:hidden"><button onClick={() => setMenuOpen(true)} className="grid size-10 place-items-center rounded-xl border border-[#ded8cd] bg-[#fffdf8] text-lg" aria-label="Abrir menu">☰</button><Brand /></div><div className="hidden lg:block"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#7f837a]">Casa Noma · {view === "overview" ? "Visão geral" : view === "orders" ? "Pedidos" : "Cardápio"}</p><p className="mt-1 text-sm font-semibold text-[#596058]">{current.sub}</p></div><div className="flex items-center gap-2"><button className="grid size-10 place-items-center rounded-xl border border-[#ded8cd] bg-[#fffdf8] text-[#566057]">◌</button><a href={storefrontPreviewUrl} className="hidden rounded-full border border-[#d9d4c9] bg-[#fffdf8] px-4 py-2 text-sm font-bold transition hover:border-[#25352b] md:block">Ver loja</a><span className="grid size-10 place-items-center rounded-full bg-[#c66747] text-sm font-bold text-white">MN</span></div></div></header>
      <section className="p-5 md:p-8"><div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#c66747]">● {current.eyebrow}</p><h1 className="mt-2 font-serif text-4xl tracking-[-.06em] md:text-5xl">{current.title}</h1></div>{view === "overview" && <button onClick={() => setView("orders")} className="rounded-full bg-[#25352b] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgb(37_53_43_/_0.15)]">▣ Abrir pedidos</button>}{view === "menu" && <button className="rounded-full bg-[#25352b] px-5 py-3 text-sm font-bold text-white">＋ Novo item</button>}</div>
      {view === "overview" ? <Overview orders={orders} open={open} onToggleOpen={() => setOpen((value) => !value)} onOrders={() => setView("orders")} onMenu={() => setView("menu")} onAdvance={advance} /> : null}
      {view === "orders" ? <OrderBoard orders={orders} onAdvance={advance} /> : null}
      {view === "menu" ? <MenuManager availability={availability} onToggle={(id) => setAvailability((current) => ({ ...current, [id]: !current[id] }))} /> : null}
      </section>
    </main>
    {menuOpen ? <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Fechar menu" onClick={() => setMenuOpen(false)} className="absolute inset-0 bg-[#25352b]/35 backdrop-blur-sm" /><aside className="relative flex h-full w-[min(86vw,320px)] flex-col bg-[#fffdf8] p-5 shadow-2xl"><div className="flex items-center justify-between"><Brand /><button onClick={() => setMenuOpen(false)} className="grid size-10 place-items-center rounded-xl hover:bg-[#f2f0ea]">×</button></div><Sidebar active={view} onNavigate={(next) => { setView(next); setMenuOpen(false) }} mobile /></aside></div> : null}
  </div>
}

function Sidebar({ active, onNavigate, mobile = false }: { active: View; onNavigate: (view: View) => void; mobile?: boolean }) {
  const entries: Array<{ view: View; label: string; icon: string }> = [{ view: "overview", label: "Visão geral", icon: "▦" }, { view: "orders", label: "Pedidos", icon: "▣" }, { view: "menu", label: "Cardápio", icon: "⌁" }]
  const nav = <><div className="mt-9"><p className="px-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#8a8d86]">Casa Noma</p><nav className="mt-3 space-y-1">{entries.map((entry) => <button key={entry.view} onClick={() => onNavigate(entry.view)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${active === entry.view ? "bg-[#e2e9df] text-[#25352b]" : "text-[#6c7068] hover:bg-[#f2f0ea]"}`}><span className="text-base">{entry.icon}</span>{entry.label}{entry.view === "orders" && <span className="ml-auto grid size-5 place-items-center rounded-full bg-[#c66747] text-[10px] text-white">3</span>}</button>)}</nav></div><div className="mt-10 border-t border-[#e5e0d6] pt-6"><p className="px-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#8a8d86]">Configurações</p><button className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-[#6c7068] hover:bg-[#f2f0ea]">⚙ Minha loja</button><Link href="/casa-noma" className="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-[#6c7068] hover:bg-[#f2f0ea]">◉ Ver loja pública</Link></div></>
  if (mobile) return <>{nav}<div className="mt-auto rounded-2xl bg-[#25352b] p-4 text-[#fffdf8]"><p className="text-xs font-bold text-[#e7a789]">MODO LOCAL</p><p className="mt-2 text-sm font-semibold leading-5">Pré-visualização da operação da Casa Noma.</p></div></>
  return <aside className="hidden min-h-dvh w-[248px] shrink-0 border-r border-[#ded8cd] bg-[#fffdf8] p-5 lg:block"><Link href="/"><Brand /></Link>{nav}<div className="mt-12 rounded-2xl bg-[#25352b] p-4 text-[#fffdf8]"><p className="text-xs font-bold text-[#e7a789]">MODO LOCAL</p><p className="mt-2 text-sm font-semibold leading-5">Pré-visualização da operação da Casa Noma.</p></div></aside>
}

function Overview({ orders, open, onToggleOpen, onOrders, onMenu, onAdvance }: { orders: Order[]; open: boolean; onToggleOpen: () => void; onOrders: () => void; onMenu: () => void; onAdvance: (id: string) => void }) {
  return <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[{ label: "Vendas hoje", value: "R$ 1.284", detail: "+18% vs. terça" }, { label: "Pedidos", value: "38", detail: "6 em andamento" }, { label: "Ticket médio", value: "R$ 33,79", detail: "Meta: R$ 32" }, { label: "Clientes que voltaram", value: "41%", detail: "Últimos 30 dias" }].map((metric) => <article key={metric.label} className="rounded-[1.35rem] border border-[#ded8cd] bg-[#fffdf8] p-5"><p className="text-xs font-bold uppercase tracking-[.1em] text-[#82867e]">{metric.label}</p><p className="mt-4 text-3xl font-bold tracking-[-.055em]">{metric.value}</p><p className="mt-3 text-xs font-semibold text-[#6f806f]">{metric.detail}</p></article>)}</div><div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_.75fr]"><section className="rounded-[1.5rem] border border-[#ded8cd] bg-[#fffdf8] p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#c66747]">● Agora</p><h2 className="mt-2 text-xl font-bold tracking-[-.035em]">Pedidos para agir</h2></div><button onClick={onOrders} className="text-sm font-bold text-[#a14d34] hover:underline">Ver todos</button></div><div className="mt-5 space-y-3">{orders.map((order) => <article key={order.id} className="flex flex-col gap-4 rounded-xl bg-[#f6f3ec] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-xs font-bold">{order.id}</span><div><p className="text-sm font-bold">{order.customer} <span className="ml-1 text-xs font-medium text-[#858980]">{order.time}</span></p><p className="mt-1 text-xs text-[#72776e]">{order.items}</p></div></div><div className="flex items-center gap-3"><Status status={order.status} />{order.status !== "Pronto" ? <button onClick={() => onAdvance(order.id)} className="rounded-full bg-[#25352b] px-3 py-2 text-xs font-bold text-white">{order.status === "Novo" ? "Aceitar" : "Marcar pronto"}</button> : null}</div></article>)}</div></section><section className="rounded-[1.5rem] bg-[#25352b] p-5 text-white"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.12em] text-[#e7a789]">Status da loja</p><h2 className="mt-2 text-xl font-bold">{open ? "Recebendo pedidos" : "Loja pausada"}</h2></div><button onClick={onToggleOpen} className={`relative h-7 w-12 rounded-full transition ${open ? "bg-[#c66747]" : "bg-white/20"}`}><span className={`absolute top-1 size-5 rounded-full bg-white transition ${open ? "left-6" : "left-1"}`} /></button></div><div className="mt-8 space-y-4 border-t border-white/15 pt-5 text-sm text-[#d8ded6]"><p className="flex justify-between"><span>Próxima abertura</span><strong className="text-white">Agora</strong></p><p className="flex justify-between"><span>Tempo médio</span><strong className="text-white">31 min</strong></p><p className="flex justify-between"><span>Área atendida</span><strong className="text-white">3 bairros</strong></p></div><button onClick={onMenu} className="mt-7 w-full rounded-full border border-white/20 py-3 text-sm font-bold transition hover:bg-white/10">Ajustar cardápio</button></section></div></>
}

function Status({ status }: { status: OrderStatus }) { return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[.06em] ${status === "Novo" ? "bg-[#f1ded2] text-[#9a4028]" : status === "Em preparo" ? "bg-[#e2e9df] text-[#25352b]" : "bg-[#efe9df] text-[#6d6558]"}`}>{status}</span> }

function OrderBoard({ orders, onAdvance }: { orders: Order[]; onAdvance: (id: string) => void }) {
  const columns: Array<{ status: OrderStatus; title: string; dot: string }> = [{ status: "Novo", title: "Para aceitar", dot: "bg-[#c66747]" }, { status: "Em preparo", title: "Na cozinha", dot: "bg-[#25352b]" }, { status: "Pronto", title: "Prontos", dot: "bg-[#a8906f]" }]
  return <div className="grid gap-4 xl:grid-cols-3">{columns.map((column) => { const rows = orders.filter((order) => order.status === column.status); return <section key={column.status} className="min-h-[420px] rounded-[1.5rem] border border-[#ded8cd] bg-[#ece9e1] p-4"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><span className={`size-2.5 rounded-full ${column.dot}`} /><h2 className="font-bold">{column.title}</h2></div><span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-[#697068]">{rows.length}</span></div><div className="space-y-3">{rows.map((order) => <article key={order.id} className="rounded-xl bg-[#fffdf8] p-4 shadow-[0_5px_12px_rgb(55_51_41_/_0.07)]"><div className="flex justify-between gap-3"><div><p className="text-xs font-bold text-[#c66747]">#{order.id} · {order.time}</p><h3 className="mt-1 font-bold">{order.customer}</h3></div><Status status={order.status} /></div><p className="mt-3 text-xs leading-5 text-[#6f736b]">{order.items}</p><div className="mt-4 flex items-center justify-between border-t border-[#e8e2d8] pt-3"><strong className="text-sm">{order.total}</strong>{order.status !== "Pronto" ? <button onClick={() => onAdvance(order.id)} className="rounded-full bg-[#25352b] px-3 py-2 text-xs font-bold text-white">{order.status === "Novo" ? "Aceitar pedido" : "Marcar pronto"}</button> : <button className="rounded-full bg-[#e2e9df] px-3 py-2 text-xs font-bold">Chamar entregador</button>}</div></article>)}</div></section> })}</div>
}

function MenuManager({ availability, onToggle }: { availability: Record<string, boolean>; onToggle: (id: string) => void }) { return <section className="rounded-[1.5rem] border border-[#ded8cd] bg-[#fffdf8] p-5"><div className="flex flex-col justify-between gap-4 border-b border-[#e7e1d6] pb-5 sm:flex-row sm:items-center"><div><h2 className="text-xl font-bold tracking-[-.035em]">Itens do cardápio</h2><p className="mt-1 text-sm text-[#73776f]">A disponibilidade muda o que aparece na loja pública.</p></div></div><div className="mt-5 space-y-3">{menuItems.map((item) => <article key={item.id} className="flex flex-col gap-4 rounded-xl border border-[#e4dfd5] p-3 sm:flex-row sm:items-center"><div className="grid size-16 place-items-center rounded-xl bg-[#e2e9df] font-serif text-xl">{item.name.slice(0, 1)}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{item.name}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${availability[item.id] ? "bg-[#e2e9df] text-[#25352b]" : "bg-[#efede8] text-[#70746c]"}`}>{availability[item.id] ? "Disponível" : "Esgotado"}</span></div><p className="mt-1 text-sm text-[#73776f]">{item.category} · {item.price}</p></div><button onClick={() => onToggle(item.id)} className={`relative h-7 w-12 rounded-full transition ${availability[item.id] ? "bg-[#25352b]" : "bg-[#d3d0c8]"}`} aria-label={`Alterar disponibilidade de ${item.name}`}><span className={`absolute top-1 size-5 rounded-full bg-white transition ${availability[item.id] ? "left-6" : "left-1"}`} /></button></article>)}</div></section> }
