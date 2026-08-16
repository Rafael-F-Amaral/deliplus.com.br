"use client"

import { useMemo, useState } from "react"

type Product = {
  id: string
  category: string
  name: string
  description: string
  price: number
  badge?: string
  image: string
}

type CartLine = Product & { quantity: number; note: string }

const products: Product[] = [
  { id: "bowl-noma", category: "Mais pedidos", name: "Bowl Noma", description: "Arroz de ervas, abóbora assada, carne de panela e molho da casa.", price: 36.9, badge: "Escolha da casa", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=85" },
  { id: "brasa-limao", category: "Mais pedidos", name: "Brasa & limão", description: "Frango grelhado, milho tostado, folhas e vinagrete de limão-cravo.", price: 34.9, badge: "Leve e fresco", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=85" },
  { id: "nhoque", category: "Pratos da casa", name: "Nhoque de mandioquinha", description: "Manteiga de sálvia, cogumelos e parmesão curado.", price: 42.9, badge: "Novo", image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1000&q=85" },
  { id: "sanduiche", category: "Pratos da casa", name: "Sanduíche da esquina", description: "Pão de fermentação natural, cupim desfiado e picles artesanal.", price: 31.9, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=85" },
  { id: "cocada", category: "Doces", name: "Cocada quente", description: "Cocada cremosa, sorvete de baunilha e crocante de castanha.", price: 18.9, image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1000&q=85" },
  { id: "cha", category: "Bebidas", name: "Chá da casa", description: "Hibisco, maracujá e laranja. Sem álcool.", price: 11.9, image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1000&q=85" },
]

const categories = ["Mais pedidos", "Pratos da casa", "Doces", "Bebidas"]
const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

function Brand() {
  return <span className="font-serif text-2xl font-semibold tracking-[-.07em] text-[#25352b]">deli<span className="relative">i<span className="absolute -top-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-[#c66747]" /></span>plus</span>
}

export function StorefrontPreview() {
  const dashboardPreviewUrl = process.env.NEXT_PUBLIC_DASHBOARD_PREVIEW_URL ?? "http://localhost:3000/dashboard"
  const [activeCategory, setActiveCategory] = useState(categories[0])
  const [cart, setCart] = useState<CartLine[]>([])
  const [selected, setSelected] = useState<Product | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [checkout, setCheckout] = useState(false)
  const [success, setSuccess] = useState(false)

  const displayed = useMemo(() => products.filter((product) => product.category === activeCategory), [activeCategory])
  const itemCount = cart.reduce((total, line) => total + line.quantity, 0)
  const subtotal = cart.reduce((total, line) => total + line.price * line.quantity, 0)
  const delivery = subtotal ? 6.9 : 0

  function add(product: Product, note = "") {
    setCart((current) => {
      const line = current.find((entry) => entry.id === product.id && entry.note === note)
      return line ? current.map((entry) => entry === line ? { ...entry, quantity: entry.quantity + 1 } : entry) : [...current, { ...product, quantity: 1, note }]
    })
    setSelected(null)
  }

  function changeQuantity(id: string, direction: 1 | -1) {
    setCart((current) => current.flatMap((line) => line.id === id ? (line.quantity + direction > 0 ? [{ ...line, quantity: line.quantity + direction }] : []) : [line]))
  }

  return (
    <div className="min-h-dvh bg-[#f6f2e9] text-[#25352b]">
      <div className="border-b border-[#ded8cd] bg-[#fffdf8]"><div className="mx-auto flex h-10 w-[min(1220px,calc(100%-2rem))] items-center justify-between text-[11px] font-semibold text-[#62675e]"><span>● Esta loja funciona com Deliplus</span><a href={dashboardPreviewUrl} className="hidden text-[#25352b] underline-offset-4 hover:underline sm:block">Acessar painel do lojista →</a></div></div>
      <header className="sticky top-0 z-30 border-b border-[#ded8cd] bg-[#fffdf8]/95 backdrop-blur-xl"><div className="mx-auto flex h-[68px] w-[min(1220px,calc(100%-2rem))] items-center justify-between gap-3"><Brand /><button onClick={() => { setCartOpen(true); setCheckout(false) }} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#25352b] px-4 text-sm font-bold text-[#fffdf8] shadow-[0_7px_18px_rgb(37_53_43_/_0.15)] transition hover:bg-[#17251d] active:scale-95">Sacola {itemCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-[#c66747] text-[10px]">{itemCount}</span>}</button></div></header>

      <main>
        <section className="border-b border-[#d8d1c4] bg-[#ece4d5]"><div className="mx-auto grid w-[min(1220px,calc(100%-2rem))] gap-8 py-8 md:grid-cols-[1fr_.7fr] md:py-12"><div><div className="flex items-center gap-3"><div className="grid size-14 place-items-center rounded-2xl bg-[#25352b] text-lg font-bold text-[#fffdf8]">CN</div><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#c66747]">Cozinha de bairro</p><h1 className="mt-1 font-serif text-4xl font-semibold tracking-[-.055em]">Casa Noma</h1><p className="mt-1 text-sm font-semibold text-[#5f655c]">Centro · Limeira</p></div></div><div className="mt-7 flex flex-wrap gap-2"><span className="rounded-full bg-[#e2e9df] px-3 py-1.5 text-xs font-bold">Aberto agora</span><span className="rounded-full bg-[#efe9df] px-3 py-1.5 text-xs font-bold text-[#6d6558]">35–50 min</span><span className="rounded-full bg-[#efe9df] px-3 py-1.5 text-xs font-bold text-[#6d6558]">Retirada em 20 min</span></div><p className="mt-6 max-w-xl text-[15px] leading-7 text-[#61665e]">Comida de verdade, feita perto e servida no tempo certo. Escolha o seu ritmo: entrega ou retirada.</p><p className="mt-5 text-xs font-bold tracking-wide text-[#657067]">⌁ da nossa bancada até você</p></div><div className="relative min-h-48 overflow-hidden rounded-[1.7rem] border border-[#d4ccbd] shadow-[0_20px_40px_rgb(74_76_62_/_0.12)]"><div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1100&q=85)" }} /><div className="absolute inset-0 bg-gradient-to-r from-[#25352b]/30 to-transparent" /><span className="absolute bottom-4 left-4 rounded-xl border border-white/35 bg-white/85 px-3 py-2 text-xs font-bold backdrop-blur">Feito hoje, do nosso jeito.</span></div></div></section>

        <section className="mx-auto w-[min(1220px,calc(100%-2rem))] py-7 pb-28 md:py-10"><div className="sticky top-[68px] z-20 -mx-4 border-b border-[#ded8cd] bg-[#f6f2e9]/95 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0"><div className="flex gap-2 overflow-x-auto pb-1">{categories.map((category) => <button key={category} onClick={() => setActiveCategory(category)} className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition ${activeCategory === category ? "bg-[#25352b] text-white" : "bg-[#ece7dd] text-[#62675e] hover:bg-[#e2e9df]"}`}>{category}</button>)}</div></div><div className="mt-8"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#c66747]">● Cardápio</p><h2 className="mt-2 font-serif text-4xl tracking-[-.055em]">{activeCategory}</h2><p className="mt-2 text-xs font-semibold tracking-wide text-[#8a7a68]">RECORTES DO NOSSO CADERNO DE COZINHA</p></div><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{displayed.map((product, index) => <article key={product.id} className={`group overflow-hidden rounded-[1.45rem] border border-[#ded8cd] bg-[#fffdf8] transition hover:-translate-y-1 hover:shadow-[0_16px_32px_rgb(55_51_41_/_0.1)] ${index === 0 ? "sm:col-span-2 xl:col-span-2 xl:grid xl:grid-cols-[1.05fr_.95fr]" : ""}`}><button onClick={() => setSelected(product)} className={`relative block w-full bg-cover bg-center text-left ${index === 0 ? "h-56 xl:h-full" : "h-44"}`} style={{ backgroundImage: `url(${product.image})` }}>{product.badge && <span className="absolute left-3 top-3 rounded-full bg-[#e2e9df] px-2.5 py-1 text-[10px] font-bold">{product.badge}</span>}</button><div className={`p-4 ${index === 0 ? "xl:flex xl:flex-col xl:justify-center xl:p-7" : ""}`}><div className="flex items-start justify-between gap-3"><button onClick={() => setSelected(product)} className={`text-left font-bold tracking-[-.035em] hover:underline ${index === 0 ? "text-2xl" : "text-[1.08rem]"}`}>{product.name}</button><strong className="shrink-0 text-sm">{money(product.price)}</strong></div><p className="mt-2 min-h-11 text-sm leading-5 text-[#6d7169]">{product.description}</p><div className="mt-4 flex justify-between"><button onClick={() => setSelected(product)} className="text-xs font-bold text-[#66715f] hover:underline">Personalizar</button><button onClick={() => add(product)} aria-label={`Adicionar ${product.name}`} className="grid size-9 place-items-center rounded-full bg-[#e2e9df] text-lg font-bold transition hover:bg-[#25352b] hover:text-white">+</button></div></div></article>)}</div></section>
      </main>

      {itemCount > 0 && <button onClick={() => { setCartOpen(true); setCheckout(false) }} className="fixed bottom-4 left-4 right-4 z-30 flex items-center justify-between rounded-2xl bg-[#25352b] px-5 py-4 text-sm font-bold text-white shadow-[0_14px_35px_rgb(37_53_43_/_0.28)] md:hidden"><span>🛍 {itemCount} {itemCount === 1 ? "item" : "itens"} na sacola</span><span>Ver pedido →</span></button>}

      {selected && <ProductDialog product={selected} onClose={() => setSelected(null)} onAdd={add} />}
      {cartOpen && <CartDialog cart={cart} subtotal={subtotal} delivery={delivery} checkout={checkout} success={success} onClose={() => { setCartOpen(false); setCheckout(false); setSuccess(false) }} onCheckout={() => setCheckout(true)} onConfirm={() => setSuccess(true)} onChangeQuantity={changeQuantity} />}
    </div>
  )
}

function ProductDialog({ product, onClose, onAdd }: { product: Product; onClose: () => void; onAdd: (product: Product, note?: string) => void }) {
  const [note, setNote] = useState("Molho à parte")
  return <div className="fixed inset-0 z-50 grid place-items-end bg-[#25352b]/45 p-0 backdrop-blur-sm md:place-items-center md:p-6"><section className="max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-t-[2rem] bg-[#f6f2e9] p-5 shadow-2xl md:rounded-[2rem] md:p-7"><div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]"><div className="min-h-72 rounded-[1.5rem] bg-cover bg-center" style={{ backgroundImage: `url(${product.image})` }} /><div><button onClick={onClose} className="text-sm font-bold text-[#62675e] hover:underline">← Voltar ao cardápio</button><p className="mt-6 inline-flex rounded-full bg-[#e2e9df] px-3 py-1 text-xs font-bold">{product.badge ?? "Feito hoje"}</p><h2 className="mt-4 font-serif text-5xl leading-[.92] tracking-[-.06em]">{product.name}</h2><p className="mt-5 text-lg leading-8 text-[#656960]">{product.description}</p><p className="mt-6 text-2xl font-bold">{money(product.price)}</p><label className="mt-7 block text-sm font-bold">Alguma observação?<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={120} className="mt-3 min-h-24 w-full rounded-xl border border-[#ded8cd] bg-[#fffdf8] p-3 text-sm font-normal outline-none focus:border-[#25352b]" /></label><button onClick={() => onAdd(product, note)} className="mt-6 flex min-h-13 w-full items-center justify-center rounded-full bg-[#c66747] px-5 text-sm font-bold text-white transition hover:bg-[#aa5035]">Adicionar à sacola · {money(product.price)}</button></div></div></section></div>
}

function CartDialog({ cart, subtotal, delivery, checkout, success, onClose, onCheckout, onConfirm, onChangeQuantity }: { cart: CartLine[]; subtotal: number; delivery: number; checkout: boolean; success: boolean; onClose: () => void; onCheckout: () => void; onConfirm: () => void; onChangeQuantity: (id: string, direction: 1 | -1) => void }) {
  return <div className="fixed inset-0 z-50 bg-[#25352b]/45 p-0 backdrop-blur-sm md:p-6"><section className="absolute bottom-0 right-0 flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-y-auto rounded-t-[2rem] bg-[#f6f2e9] p-5 shadow-2xl md:bottom-6 md:right-6 md:rounded-[2rem] md:p-7"><button onClick={onClose} className="ml-auto text-sm font-bold text-[#62675e] hover:underline">Fechar ×</button>{success ? <div className="mx-auto max-w-lg py-12 text-center"><div className="mx-auto grid size-16 place-items-center rounded-full bg-[#e2e9df] text-3xl">✓</div><p className="mt-7 text-xs font-bold uppercase tracking-[.14em] text-[#c66747]">Pedido #1042 · modo local</p><h2 className="mt-4 font-serif text-5xl tracking-[-.06em]">Pedido confirmado. <em className="text-[#c66747]">Vai sair bonito.</em></h2><p className="mt-5 text-base leading-7 text-[#646960]">A Casa Noma recebeu sua pré-visualização e já está organizando a bancada.</p><button onClick={onClose} className="mt-7 rounded-full bg-[#25352b] px-5 py-3 text-sm font-bold text-white">Voltar à Casa Noma</button></div> : checkout ? <Checkout subtotal={subtotal} delivery={delivery} onConfirm={onConfirm} /> : <><div className="mt-2"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#c66747]">Seu pedido</p><h2 className="mt-2 font-serif text-5xl tracking-[-.06em]">Sacola</h2></div><div className="mt-7 space-y-3">{cart.map((line) => <article key={`${line.id}-${line.note}`} className="flex gap-3 rounded-[1.25rem] border border-[#ded8cd] bg-[#fffdf8] p-3"><div className="size-20 shrink-0 rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${line.image})` }} /><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><div><h3 className="font-bold">{line.name}</h3>{line.note && <p className="mt-1 text-xs text-[#74786f]">{line.note}</p>}</div><strong className="text-sm">{money(line.price * line.quantity)}</strong></div><div className="mt-4 flex items-center justify-between"><div className="flex items-center rounded-full border border-[#ded8cd] bg-[#f7f4ee]"><button onClick={() => onChangeQuantity(line.id, -1)} className="grid size-8 place-items-center">−</button><span className="w-7 text-center text-sm font-bold">{line.quantity}</span><button onClick={() => onChangeQuantity(line.id, 1)} className="grid size-8 place-items-center">+</button></div></div></div></article>)}</div><Summary subtotal={subtotal} delivery={delivery} action="Ir para finalização" onAction={onCheckout} /></>}</section></div>
}

function Checkout({ subtotal, delivery, onConfirm }: { subtotal: number; delivery: number; onConfirm: () => void }) {
  const [mode, setMode] = useState<"delivery" | "pickup">("delivery")
  return <div className="mt-5"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#c66747]">Finalização</p><h2 className="mt-2 font-serif text-5xl tracking-[-.06em]">Quase na mesa.</h2><div className="mt-7 grid gap-2 sm:grid-cols-2"><button onClick={() => setMode("delivery")} className={`rounded-xl border p-4 text-left ${mode === "delivery" ? "border-[#25352b] bg-[#e2e9df]" : "border-[#ded8cd]"}`}><strong className="block">Receber em casa</strong><span className="mt-1 block text-xs text-[#677068]">{money(delivery)} · 35–50 min</span></button><button onClick={() => setMode("pickup")} className={`rounded-xl border p-4 text-left ${mode === "pickup" ? "border-[#25352b] bg-[#e2e9df]" : "border-[#ded8cd]"}`}><strong className="block">Retirar na Casa Noma</strong><span className="mt-1 block text-xs text-[#677068]">Pronto em cerca de 20 min</span></button></div><div className="mt-4 rounded-xl border border-[#ded8cd] bg-[#fffdf8] p-4"><p className="font-bold">Pagamento</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><button className="rounded-xl border border-[#25352b] bg-[#e2e9df] p-3 text-left text-sm font-bold">Pix<br /><small className="font-normal text-[#677068]">Confirmação imediata</small></button><button className="rounded-xl border border-[#ded8cd] p-3 text-left text-sm font-bold">Cartão<br /><small className="font-normal text-[#677068]">Pagar na entrega</small></button></div></div><Summary subtotal={subtotal} delivery={mode === "delivery" ? delivery : 0} action="Confirmar pedido local" onAction={onConfirm} /></div>
}

function Summary({ subtotal, delivery, action, onAction }: { subtotal: number; delivery: number; action: string; onAction: () => void }) {
  return <div className="mt-6 rounded-[1.5rem] bg-[#25352b] p-6 text-[#fffdf8]"><div className="space-y-3 border-y border-white/15 py-5 text-sm text-[#dce3da]"><p className="flex justify-between"><span>Itens</span><span>{money(subtotal)}</span></p><p className="flex justify-between"><span>Entrega</span><span>{delivery ? money(delivery) : "Grátis"}</span></p></div><p className="mt-5 flex items-baseline justify-between"><span className="text-sm font-semibold">Total</span><strong className="text-2xl">{money(subtotal + delivery)}</strong></p><button onClick={onAction} className="mt-6 min-h-12 w-full rounded-full bg-[#c66747] px-4 text-sm font-bold text-white transition hover:bg-[#aa5035]">{action} →</button><p className="mt-4 text-center text-[11px] text-[#bdc8bb]">Pré-visualização local: nenhum valor será cobrado.</p></div>
}
