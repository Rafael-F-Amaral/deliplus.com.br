# Auditoria Responsiva Desktop, Ultrawide, Light/Dark Mode e Print — DeliPlus

**Escopo:** Fase 1 (Read-Only no código fonte)  
**Viewports alvo:** `1440x900`, `1600x900`, `1920x1080`, `2560x1080`, `2560x1440`  
**Focos técnicos avaliados:**
1. Proporção de grids, limites `max-w` e estiramento em `1920px` e `2560px`
2. Split-panes, drawers e alinhamento de barras fixas (`FloatingActionBar`)
3. Ergonomia com mouse (`pointer: fine`), visibilidade de scrollbars, foco e navegação por teclado
4. Integridade de `@media print` (`#thermal-receipt`, `#print-sheet-root` e impressão de displays/relatórios)
5. Auditoria de **Light Mode e Dark Mode** (tokens `app/globals.css`, classes `dark:`, contraste WCAG >= 4.5:1, tooltips `?`, modais, gráficos, tabelas e storefront)

---

## 1. Resumo Executivo por Severidade

| Severidade | Quantidade | Principais Riscos Identificados |
| :--- | :---: | :--- |
| **P0 (Crítico)** | **6** | Tooltips `?` ilegíveis em Light Mode (`1:1` e `1.06:1`); modais e templates inteiros sem Dark Mode com textos de `1:1` a `1.47:1`; impressão em branco no Display QR (`Settings`) e corte de recibos térmicos por ancestrais `overflow-hidden`; contraste abaixo de WCAG AA em tokens `:root`/`.dark`, `Academy` (`1.35:1`) e botões WhatsApp (`1.98:1`); setas do zoom em `ProductDetailModal` recortadas por `overflow-hidden`. |
| **P1 (Alto)** | **8** | `* { scrollbar-width: none !important }` ocultando barras de rolagem para mouse desktop; ausência de `max-w-*` nos módulos do Dashboard esticando tabelas e gráficos em `1920px`/`2560px`; contenção `lg:overflow-hidden` no Financeiro/Relatórios sob risco de corte vertical em `1440x900`; Hero `xl:w-[62%]` invadindo área de texto em `2560px` + `CategoryFilterBar` `top-[57px]` sobpondo header desktop de ~`65px`; Auth, `!hasStores` e tracking público sem paridade Dark Mode; `Minha Loja` sem split-pane permanente no ultrawide; overrides globais `.cl-*` sem escopo; elementos clicáveis não-nativos e `userScalable: false`. |
| **P2 (Médio)** | **3** | Spacer rígido `h-[30px]` e filtros sem `dark:` em Pedidos; bordas/badges/divisores parciais sem `dark:` em Financeiro, Relatórios, Estoque e Promoções; textos `text-gray-400` (`2.39:1`–`2.54:1`) e botões de fechar (`X`) sem `aria-label`. |
| **Total** | **17** | **Cobertura completa dos grupos A, B e C** |

---

## 2. Cobertura do Inventário (A / B / C)

| Grupo | Escopo | Arquivos Inspecionados | Status |
| :--- | :--- | :--- | :---: |
| **A** | Fundações & Entrada | `app/layout.tsx`, `app/globals.css`, `components/theme-provider.tsx`, `app/page.tsx`, `components/AuthLayout.tsx`, `app/sign-in/[[...sign-in]]/page.tsx`, `app/sign-up/[[...sign-up]]/page.tsx`, `app/sso-callback/page.tsx`, `app/onboarding/page.tsx`, `app/onboarding/automatic-provisioning.tsx`, `app/dashboard/stores/new/page.tsx`, `app/dashboard/stores/new/new-store-form.tsx`, `app/dashboard/stores/[storeId]/setup/page.tsx`, `app/dashboard/stores/[storeId]/setup/store-setup-form.tsx`, `components/LogoDeli.tsx`, `components/ui/*` | 100% |
| **B** | Storefront Público & Tracking | `app/[storeSlug]/page.tsx`, `app/[storeSlug]/pedido/[id]/page.tsx`, `app/[storeSlug]/pedido/[id]/order-live-tracker.tsx`, `components/storefront/*` ativos (`storefront-page-client.tsx`, `storefront-header.tsx`, `store-hero.tsx`, `storefront-theme-toggle.tsx`, `category-filter-bar.tsx`, `combos-section.tsx`, `product-card.tsx`, `product-detail-modal.tsx`, `cart-drawer.tsx`, `checkout-client-data-modal.tsx`, `checkout-payment-modal.tsx`, `receiving-method-modal.tsx`, `delivery-info-modal.tsx`, `favorites-modal.tsx`, `merchant-back-button.tsx`, `mobile-cart-bar.tsx`, `order-confirmed-screen.tsx`, `order-tracking-modal.tsx`, `payment-brand-icons.tsx`, `store-closed-screen.tsx`) | 100% |
| **C** | Dashboard Shell & Módulos | `app/dashboard/layout.tsx`, `app/dashboard/billing-feedback.tsx`, `components/dashboard/dashboard-layout-client.tsx`, `components/dashboard/sidebar.tsx`, `components/dashboard/dashboard-header.tsx`, `components/dashboard/cover-photo-picker-modal.tsx`, `app/dashboard/orders/page.tsx`, `orders-client.tsx`, `manual-order-modal.tsx`, `app/dashboard/menu/page.tsx`, `menu-client.tsx`, `app/dashboard/customers/page.tsx`, `customers-client.tsx`, `app/dashboard/finance/page.tsx`, `finance-client.tsx`, `shift-closing-modal.tsx`, `app/dashboard/settings/page.tsx`, `settings-client.tsx`, `components/dashboard/settings/*` (`floating-action-bar.tsx`, `settings-sidebar.tsx`, `storefront-phone-mockup.tsx`, `weekly-schedule-manager.tsx`, `payment-method-card.tsx`, `sections/*`), `app/dashboard/reports/page.tsx`, `components/dashboard/reports/reports-view.tsx`, `app/dashboard/inventory/page.tsx`, `inventory-client.tsx`, `app/dashboard/marketing/promotions/page.tsx`, `promotions-client.tsx`, `app/dashboard/marketing/academy/page.tsx`, `academy-client.tsx`, `app/dashboard/billing/*` (`page.tsx`, `billing-status.tsx`, `checkout-form.tsx`, `subscription-management-form.tsx`, `success/page.tsx`, `success/pending-confirmation.tsx`), `app/dashboard/team/page.tsx`, `app/dashboard/page.tsx`, `app/dashboard/marketing/page.tsx` | 100% |

---

## 3. Tabela Consolidada de Tokens e Contraste WCAG 2.1

Razões de contraste calculadas diretamente sobre os tokens de `app/globals.css` e pares observados nos componentes (mínimo WCAG AA para texto normal: **4.5:1**; texto grande >= 18pt ou 14pt bold: **3.0:1**):

| Par (Foreground -> Background) | Origem / Tema | Contraste | Status WCAG |
| :--- | :--- | :---: | :---: |
| `#2E4233` em `#2E4233` | `HelpTooltip` / `CardHelpTooltip` (`finance-client.tsx`, `reports-view.tsx`) — Light | **1.00:1** | **FAIL** |
| `#FFFFFF` em `#FAF8F0` | Tooltip `"Gestão Centralizada:"` (`promotions-client.tsx:816`) — Light | **1.06:1** | **FAIL** |
| `#1A241E` em `#1B241E` | Tabela de Promoções (`promotions-client.tsx:918`) — Dark | **1.00:1** | **FAIL** |
| `#1C2C22` em `#222C25` | Título modal Cancelar Pedido (`orders-client.tsx:2343`) — Dark | **1.02:1** | **FAIL** |
| `#1C201A` em `#1B241E` | Centro do gráfico Donut (`finance-client.tsx:1053`) — Dark | **1.04:1** | **FAIL** |
| `#111827` em `#1B241E` | Nome do prato em Relatórios (`reports-view.tsx:601`) — Dark | **1.11:1** | **FAIL** |
| `#000000` em `#151D17` | `TikTokIcon` (`social-icons.tsx:62`) — Dark | **1.22:1** | **FAIL** |
| `#512DA8` em `#28382D` / `#1E2922` | Academy Módulo 3 (`academy-client.tsx:394,425`) — Dark | **1.35:1** / **1.64:1** | **FAIL** |
| `#2E4233` em `#1B241E` | Chips de tamanho (`menu-client.tsx:3824`) / Status (`promotions-client.tsx:999`) — Dark | **1.47:1** | **FAIL** |
| `#FFFFFF` em `#25D366` | Botão CTA WhatsApp (`inventory-client.tsx:1576`) — Ambos | **1.98:1** | **FAIL** |
| `#9CA3AF` em `#FAF8F0` / `#FFFFFF` | Textos `text-gray-400` (`customers-client.tsx`, `order-live-tracker.tsx`) — Light | **2.39:1** / **2.54:1** | **FAIL** |
| `#2E7D32` em `#253629` / `#1E2922` | Academy Hero / Módulo 1 (`academy-client.tsx:129,223`) — Dark | **2.50:1** / **2.93:1** | **FAIL** |
| `#C2185B` em `#1E2922` | Academy Módulo 5 (`academy-client.tsx:534`) — Dark | **2.56:1** | **FAIL** |
| `#FFFFFF` em `#E76F41` | `.dark --primary-foreground` sobre `--primary` (`globals.css:71-72`) — Dark | **3.11:1** | **FAIL AA normal** |
| `#9B7608` em `#F2E5C0` | `:root --sidebar-accent-foreground` sobre `--sidebar-accent` (`globals.css:37-38`) — Light | **3.36:1** | **FAIL AA normal** |
| `#FFFFFF` em `#EF4444` | `.dark --destructive-foreground` sobre `--destructive` (`globals.css:79-80`) — Dark | **3.76:1** | **FAIL AA normal** |
| `#CB5A3C` em `#FFF0E5` / `#FAF8F0` / `#1B241E` | Terracotta marca em superfícies claras e escuras (`billing`, `finance`, `menu`) | **3.72:1** / **3.90:1** / **3.85:1** | **FAIL AA normal** |
| `#FFFFFF` em `#CB5A3C` | Botões/badges CTA Terracotta (`billing/page.tsx:105`, `checkout-form.tsx:99`) | **4.14:1** | **FAIL AA normal** |
| `#FF7D4F` em `#131A15` / `#1B241E` / `#25332A` | `.dark --accent-foreground` (`globals.css:78`) — Dark | **7.00:1** / **6.30:1** / **5.23:1** | **PASS AA** |
| `#9CA79E` em `#131A15` / `#1B241E` | `.dark --muted-foreground` (`globals.css:76`) — Dark | **7.11:1** / **6.40:1** | **PASS AA** |
| `#F2EFE9` em `#131A15` / `#1B241E` | `.dark --foreground` (`globals.css:66`) — Dark | **15.43:1** / **13.89:1** | **PASS AA** |

---

## 4. Achados Detalhados

### Severidade P0 — Críticos

#### `[P0-01]` Tooltips `?` com texto invisível (`1:1`) no Light Mode do Financeiro e Relatórios
- **Severidade:** `P0`
- **Grupo / Rota:** `C — /dashboard/finance` e `/dashboard/reports`
- **Arquivo:Linha:** `app/dashboard/finance/finance-client.tsx:222-244` (`HelpTooltip`) e `components/dashboard/reports/reports-view.tsx:84-116` (`CardHelpTooltip`)
- **Viewports afetados:** `1440x900`, `1600x900`, `1920x1080`, `2560x1080`, `2560x1440`
- **Tema:** `Light`
- **Causa raiz exata:** O container do popover usa `bg-[#2E4233] text-white dark:bg-[#FAF8F0] dark:text-[#1C2C22]`, porém os textos descritivos (`finance-client.tsx:231`, `reports-view.tsx:105`) e os blocos de bullets/dicas (`finance-client.tsx:235`, `reports-view.tsx:109`) aplicam `text-[#2E4233]` sem variante para Light Mode (`text-white/90 dark:text-[#2E4233]`). Em Light Mode, `#2E4233` sobre fundo `#2E4233` gera contraste `1.00:1`, deixando toda a ajuda ilegível. Além disso, `CardHelpTooltip` (`reports-view.tsx:95-101`) omite `tabIndex={0}` e `group-focus-within:opacity-100 group-focus-within:visible`, impossibilitando abertura via teclado.
- **Correção recomendada:** Aplicar `text-white/90 dark:text-[#1C2C22]` na descrição e nos itens, `border-white/10 dark:border-[#E5DFD1]` no divisor superior, e adicionar `tabIndex={0}` + `group-focus-within:` em `CardHelpTooltip` (padronizando ambos num componente único reutilizável).

#### `[P0-02]` Tooltip `"Gestão Centralizada:"` com texto branco sobre fundo creme (`1.06:1`) e divergência de tema em Promoções
- **Severidade:** `P0`
- **Grupo / Rota:** `C — /dashboard/marketing/promotions`
- **Arquivo:Linha:** `app/dashboard/marketing/promotions/promotions-client.tsx:810-833` e `:553-575`
- **Viewports afetados:** `1440x900`, `1600x900`, `1920x1080`, `2560x1080`, `2560x1440`
- **Tema:** `Ambos` (`Light` em `:816`; `Dark` em `:557, 814`)
- **Causa raiz exata:** Em `promotions-client.tsx:814`, o popover define apenas fundo claro `bg-[#FAF8F0] text-[#1C2C22]` (sem `dark:`), mas o rótulo em destaque na linha `:816` recebeu `text-white dark:text-[#2E4233]`. No Light Mode, o texto `"Gestão Centralizada:"` renderiza em `#FFFFFF` sobre `#FAF8F0` (`1.06:1`). Nos cards de insight (`:557`), o tooltip também fixa `bg-[#FAF8F0]` sem suporte a Dark Mode, e nenhum dos gatilhos `?` possui `tabIndex={0}`.
- **Correção recomendada:** Alinhar o popover ao padrão `bg-[#2E4233] text-white dark:bg-[#FAF8F0] dark:text-[#1C2C22]`, corrigindo `:816` para `text-white dark:text-[#2E4233]` apenas quando o container acompanhar o tema, e habilitar `tabIndex={0}` + `group-focus-within:`.

#### `[P0-03]` Modais operacionais e células sem `dark:` com textos ilegíveis (`1:1` a `1.47:1`) no Dark Mode
- **Severidade:** `P0`
- **Grupo / Rota:** `C — /dashboard/orders`, `/dashboard/menu`, `/dashboard/finance`, `/dashboard/inventory`, `/dashboard/marketing/promotions`, `/dashboard/reports`, `components/dashboard/cover-photo-picker-modal.tsx`, `B — /[storeSlug]`
- **Arquivo:Linha:**
  - `app/dashboard/orders/orders-client.tsx:2343` (`text-[#1C2C22]` sobre `dark:bg-[#222C25]` = `1.02:1`), `:2405-2503` (Modal de Impressão Térmica 100% Light), `:2667-2765` (inputs e `<select>` `bg-white text-[#1C2C22]` no Modal Alterar Pedido)
  - `app/dashboard/menu/menu-client.tsx:2371-2430` (Modal Novo/Editar Item e demais modais sem classes `dark:`), `:3824` (`bg-white dark:bg-[#1B241E] ... text-[#2E4233]` = `1.47:1` no Dark Mode)
  - `app/dashboard/finance/finance-client.tsx:1053` (total no centro do Donut `text-[#1C201A]` sobre `dark:bg-[#1B241E]` = `1.04:1`), `:868` (`hover` `bg-[#F8F9F3]` ofuscante), `:1439-1510` (Modal Configurar Taxas Bancárias 100% Light), `:1584-1662` (Modal Detalhes do Pedido 100% Light)
  - `app/dashboard/inventory/inventory-client.tsx:1156-1215` (Modal Novo Produto 100% Light) e `:1356-1410` (Modal Lista de Compras 100% Light)
  - `app/dashboard/marketing/promotions/promotions-client.tsx:212-290` (`DeliPlusDatePicker` com `text-gray-800` sobre `dark:bg-[#1B241E]` e dias do calendário sem `dark:`), `:918` (nome do prato `text-[#1A241E]` sobre `dark:bg-[#1B241E]` = `1.00:1`), `:999`, `:1128-1293` (inputs, datas e rodapé do modal sem `dark:`)
  - `components/dashboard/reports/reports-view.tsx:601` (`text-[#111827]` sobre `dark:bg-[#1B241E]` = `1.11:1`)
  - `components/dashboard/cover-photo-picker-modal.tsx:120-210` (galeria inteira hardcoded Light Mode)
  - `components/ui/social-icons.tsx:62` (`TikTokIcon` `fill="#000000"` = `1.22:1` em fundo escuro) e `components/storefront/delivery-info-modal.tsx:72-132,158` (card de resultado de entrega e ícone `ShieldCheck` `text-[#1B2A20]` sem `dark:`)
- **Viewports afetados:** `1440x900`, `1600x900`, `1920x1080`, `2560x1080`, `2560x1440`
- **Tema:** `Dark`
- **Causa raiz exata:** Mistura de superfícies `dark:bg-[#1B241E]` / `dark:bg-[#222C25]` com textos escuros herdados sem `dark:text-[#F2EFE9]`, além de modais inteiros construídos com classes fixas (`bg-white`, `bg-[#FAF8F0]`, `text-[#1C201A]`, `border-[#E9E4D4]`) e SVG com `fill="#000000"`.
- **Correção recomendada:** Migrar modais e superfícies para tokens semânticos (`bg-card`, `text-card-foreground`, `bg-popover`, `border-border`) ou pares explícitos `dark:bg-[#1B241E]` / `dark:bg-[#25332A]` / `dark:text-[#F2EFE9]`; alterar `TikTokIcon` para `fill="currentColor"` herdando cor do texto; manter apenas o papel do cupom `#thermal-receipt` em `#FFFFFF` com `#000000` como simulação fiel de bobina física.

#### `[P0-04]` `@media print` imprime página em branco em Configurações/Relatórios e arrisca truncamento em recibos térmicos
- **Severidade:** `P0`
- **Grupo / Rota:** `A — app/globals.css`, `C — /dashboard/settings`, `/dashboard/orders`, `/dashboard/finance`, `/dashboard/inventory`, `/dashboard/reports`
- **Arquivo:Linha:** `app/globals.css:377-407`, `components/dashboard/dashboard-layout-client.tsx:20-34`, `components/dashboard/settings/sections/payments-section.tsx:37-39`, `app/dashboard/orders/orders-client.tsx:2405-2425`, `app/dashboard/finance/shift-closing-modal.tsx:238-241`, `app/dashboard/inventory/inventory-client.tsx:1255-1280`
- **Viewports afetados:** `1440x900`, `1600x900`, `1920x1080`, `2560x1080`, `2560x1440`
- **Tema:** `Ambos`
- **Causa raiz exata:**
  1. `app/globals.css:382-387` define `body { visibility: hidden !important; }` e só reexibe `#thermal-receipt`. Ao clicar em `"Imprimir Display"` (`payments-section.tsx:37-39`), `window.print()` é chamado sem que exista `#thermal-receipt`, produzindo **página totalmente em branco**. O mesmo ocorre ao pressionar `Ctrl+P` em Relatórios ou Pedidos sem modal de impressão aberto.
  2. Em `orders-client.tsx:2406,2421` e `shift-closing-modal.tsx:239`, `#thermal-receipt` está aninhado dentro de overlays `fixed inset-0` com `max-h-[92vh] overflow-hidden` / `overflow-y-auto` e de `DashboardLayoutClient` (`h-screen overflow-hidden`). Sem reset de `overflow: visible !important`, `height: auto !important` e `position: static !important` nos ancestrais em `@media print`, recibos longos ficam sujeitos a corte na altura do viewport.
  3. `inventory-client.tsx:1255-1277` injeta `<style>` próprio de `@media print` com `body * { visibility: hidden !important; }` para `#print-sheet-root`, conflitando com as regras globais de `globals.css`.
- **Correção recomendada:** Centralizar zonas de impressão dedicadas (`#thermal-receipt`, `#print-sheet-root`, `#store-qr-print`) via portal direto em `document.body` ou resets de ancestral `@media print { html, body, main, #__next { height: auto !important; overflow: visible !important; position: static !important; } }`, e marcar a seção de display QR em `payments-section.tsx` como área imprimível válida sem disparar `body { visibility: hidden }` indiscriminado quando nenhum alvo específico estiver ativo.

#### `[P0-05]` Tokens globais (`:root`/`.dark`), botões Terracotta/WhatsApp e rótulos do Academy falham WCAG AA (4.5:1)
- **Severidade:** `P0`
- **Grupo / Rota:** `A — app/globals.css`, `C — /dashboard/marketing/academy`, `/dashboard/billing`, `/dashboard/inventory`, `B — /[storeSlug]/pedido/[id]`
- **Arquivo:Linha:** `app/globals.css:15-16,37-38,71-72,79-80`, `app/dashboard/marketing/academy/academy-client.tsx:129,223,293,394,417,425,462,534`, `app/dashboard/inventory/inventory-client.tsx:1576`, `app/dashboard/billing/page.tsx:94,105`, `app/dashboard/billing/checkout-form.tsx:99`
- **Viewports afetados:** `1440x900`, `1600x900`, `1920x1080`, `2560x1080`, `2560x1440`
- **Tema:** `Ambos`
- **Causa raiz exata:**
  1. Em `app/globals.css:15-16`, `:root --primary` está definido como `oklch(0.8223 0.1648 86.7192)` (`#f3bc16`, amarelo), divergindo da paleta Terracotta/Forest usada no produto, e `--sidebar-accent-foreground` sobre `--sidebar-accent` mede `3.36:1`. No `.dark` (`:71-72,79-80`), `#FFFFFF` sobre `#E76F41` mede `3.11:1` e `#FFFFFF` sobre `#EF4444` mede `3.76:1`.
  2. Em `academy-client.tsx`, badges/títulos coloridos não têm `dark:`, caindo para `1.35:1` (`#512DA8` em `#28382D`), `1.64:1` (`#512DA8` em `#1E2922`), `2.50:1` (`#2E7D32` em `#253629`), `2.56:1` (`#C2185B` em `#1E2922`) e `2.93:1` (`#2E7D32` em `#1E2922`).
  3. Botões CTA com `#FFFFFF` sobre `#25D366` (`inventory-client.tsx:1576`) atingem apenas `1.98:1`; botões/badges `#FFFFFF` sobre `#CB5A3C` atingem `4.14:1`; e `#CB5A3C` sobre `#FFF0E5` (`billing/page.tsx:94`) mede `3.72:1`.
- **Correção recomendada:** Alinhar `--primary` Light ao Terracotta escurecido acessível (`#B4482D` ou `#9E3E26` com `#FFFFFF` >= 4.5:1) ou Forest `#2E4233`; no Dark Mode usar texto `#131A15` sobre `#E76F41`/`#FF7D4F` (`> 6.0:1`) ou escurecer o fundo do botão; trocar WhatsApp CTA para `bg-[#15803D]` / `bg-[#128C7E]` (`> 4.5:1` com branco) e adicionar variantes `dark:text-emerald-300`, `dark:text-orange-300`, `dark:text-purple-300`, `dark:text-sky-300`, `dark:text-pink-300` no Academy.

#### `[P0-06]` Setas de navegação do Lightbox de Zoom em `ProductDetailModal` recortadas por `overflow-hidden`
- **Severidade:** `P0`
- **Grupo / Rota:** `B — /[storeSlug]` (`components/storefront/product-detail-modal.tsx`)
- **Arquivo:Linha:** `components/storefront/product-detail-modal.tsx:1083-1116`
- **Viewports afetados:** `1440x900`, `1600x900`, `1920x1080`, `2560x1080`, `2560x1440`
- **Tema:** `Ambos`
- **Causa raiz exata:** O container que envolve a imagem em tela cheia aplica `relative max-w-4xl max-h-[75vh] flex items-center justify-center overflow-hidden` (`:1083`), enquanto os botões anterior e próximo posicionam-se fora da caixa no desktop com `md:-left-16` (`:1101`) e `md:-right-16` (`:1112`). Qualquer deslocamento negativo fora de um ancestral com `overflow-hidden` é recortado e fica invisível/inclicável.
- **Correção recomendada:** Remover `overflow-hidden` do container externo de `:1083` (mantendo `rounded-xl` na própria `<img>`) ou mover os botões `<button>` para o wrapper pai externo do overlay de zoom (`fixed inset-0`), garantindo distância clicável segura e foco visível.

---

### Severidade P1 — Altos

#### `[P1-01]` Supressão global de scrollbars (`* { scrollbar-width: none !important }`) em dispositivos desktop (`pointer: fine`)
- **Severidade:** `P1`
- **Grupo / Rota:** `A — app/globals.css`, `B — Modal de Produto`, `C — Dashboard completo`
- **Arquivo:Linha:** `app/globals.css:314-324`, `components/dashboard/dashboard-layout-client.tsx:29`, `app/dashboard/orders/orders-client.tsx:1449`, `components/dashboard/reports/reports-view.tsx:1408`, `app/dashboard/settings/settings-client.tsx:527,652`, `components/dashboard/settings/storefront-phone-mockup.tsx:172`, `components/storefront/category-filter-bar.tsx:26`, `components/storefront/product-detail-modal.tsx:567`
- **Viewports afetados:** `1440x900`, `1600x900`, `1920x1080`, `2560x1080`, `2560x1440`
- **Tema:** `Ambos`
- **Causa raiz exata:** A regra universal `html, body, div, main, aside, section, * { scrollbar-width: none !important; }` + `*::-webkit-scrollbar { display: none !important; }` (`globals.css:315-324`) combinada com classes utilitárias inline (`[scrollbar-width:none]` / `no-scrollbar`) remove todas as barras de rolagem visuais no Dashboard e na coluna direita de opções de `ProductDetailModal` (`product-detail-modal.tsx:567`), prejudicando usuários de mouse (`pointer: fine`) em tabelas largas, listas de adicionais, logs e abas horizontais.
- **Correção recomendada:** Remover o wildcard `*` em `globals.css:315-324` e restringir a ocultação apenas a `@media (pointer: coarse)` ou containers explicitamente controlados com botões de scroll; em desktop (`pointer: fine`), estilizar scrollbars finas e visíveis (`scrollbar-width: thin`) alinhadas ao tema Light/Dark, inclusive na coluna direita de `ProductDetailModal` (`.storefront-scrollbar`).

#### `[P1-02]` Ausência de `max-w-*` nos módulos do Dashboard gera estiramento excessivo em `1920px` e `2560px` (Ultrawide)
- **Severidade:** `P1`
- **Grupo / Rota:** `C — /dashboard/orders`, `/dashboard/menu`, `/dashboard/customers`, `/dashboard/finance`, `/dashboard/reports`, `/dashboard/inventory`, `/dashboard/marketing/promotions`, `/dashboard/marketing/academy`, `/dashboard/billing`
- **Arquivo:Linha:** `app/dashboard/orders/orders-client.tsx:1384,1440`, `app/dashboard/menu/menu-client.tsx:1537`, `app/dashboard/customers/customers-client.tsx:203`, `app/dashboard/finance/finance-client.tsx:550-551,852-899,1213`, `components/dashboard/reports/reports-view.tsx:799-800,1119,1179-1181`, `app/dashboard/inventory/inventory-client.tsx:489,1077`, `app/dashboard/marketing/promotions/promotions-client.tsx:489-490`, `app/dashboard/marketing/academy/academy-client.tsx:103-109`, `app/dashboard/billing/page.tsx:163-164`
- **Viewports afetados:** `1920x1080`, `2560x1080`, `2560x1440`
- **Tema:** `Ambos`
- **Causa raiz exata:** Com sidebar fixa de `260px` (`sidebar.tsx:133`), a área principal dispõe de `2300px` em `2560px`. Apenas `settings-client.tsx:452` limita largura (`max-w-5xl`). Todos os demais módulos usam `w-full` irrestrito:
  - Em `Billing` (`billing/page.tsx:164`), os 3 cards de assinatura (`md:grid-cols-3`) esticam para ~`720px` de largura cada com apenas 3 linhas curtas.
  - Em `Finance` (`finance-client.tsx:875-899,1213`), barras de largura fixa (`w-2.5` = `10px`, `gap-1.5` = `6px`) ficam isoladas por grandes vãos enquanto a tabela `table-fixed` estica por ~`2240px`.
  - Em `Academy` (`academy-client.tsx:109`), o texto do hero é `max-w-3xl` dentro de um banner `w-full`, criando grande vazio à direita e cards de texto excessivamente largos abaixo.
  - Em `Orders` e `Inventory`, apenas os painéis laterais possuem largura fixa (`xl:w-[370px]` e `w-[300px]`), deixando as tabelas principais esticadas até `1890px–1940px`.
- **Correção recomendada:** Aplicar limite ergonômico de largura centralizada por padrão nos wrappers internos (`max-w-[1440px] mx-auto w-full` para telas operacionais de alta densidade como Pedidos/Cardápio/Financeiro/Relatórios/Estoque, e `max-w-6xl mx-auto w-full` para Billing/Academy/Customers/Promotions), com `max-h` nos SVGs e aumento proporcional de colunas de grid em `2xl` (`xl`/`2xl`).

#### `[P1-03]` Contenção vertical `lg:overflow-hidden` em Financeiro e Relatórios arrisca corte de conteúdo em `1440x900`
- **Severidade:** `P1`
- **Grupo / Rota:** `C — /dashboard/finance` e `/dashboard/reports`
- **Arquivo:Linha:** `components/dashboard/dashboard-layout-client.tsx:20,23,29-33`, `app/dashboard/finance/finance-client.tsx:550-554,1212`, `components/dashboard/reports/reports-view.tsx:799-800,1119,1569`
- **Viewports afetados:** `1440x900`, `1600x900`, `2560x1080`
- **Tema:** `Ambos`
- **Causa raiz exata:** `DashboardLayoutClient` trava a área externa em `h-screen overflow-hidden` (`:20`) e bloqueia scroll vertical especificamente para `/dashboard/finance` (`lg:overflow-hidden` at `:31`); `FinanceClient` replica `lg:max-h-full` (`:550`) + `overflow-hidden` no container da tabela de 4 linhas (`:1212`). Em `1440x900`, após `64px` do `DashboardHeader` (`836px` úteis, ainda menores com barra de navegador/zoom 110%–125%), a soma dos blocos e do alerta `savedSuccessAlert` (`:554`) tem margem apertada, com risco de corte da paginação/última linha. O mesmo ocorre em `ReportsView` (`lg:overflow-hidden` at `:799`) comprimindo 3 faixas (`KPIs` + `lg:grid-cols-3` + `lg:grid-cols-2`).
- **Correção recomendada:** Remover `lg:overflow-hidden` em `dashboard-layout-client.tsx:31`, `finance-client.tsx:1212` e `reports-view.tsx:799`, substituindo por `overflow-y-auto` com `min-h` adequado nos cards de gráficos para manter a estética compacta em telas altas sem jamais amputar conteúdo em `1440x900` ou zoom.

#### `[P1-04]` Storefront: Hero `xl:w-[62%]` invade texto em `2560px` e `CategoryFilterBar` entra sob o header desktop
- **Severidade:** `P1`
- **Grupo / Rota:** `B — /[storeSlug]`
- **Arquivo:Linha:** `components/storefront/store-hero.tsx:154,162,183-184`, `components/storefront/storefront-header.tsx:15`, `components/storefront/category-filter-bar.tsx:23-24`, `components/storefront/storefront-page-client.tsx:89`
- **Viewports afetados:** `1440x900`, `1600x900`, `1920x1080`, `2560x1080`, `2560x1440`
- **Tema:** `Ambos`
- **Causa raiz exata:**
  1. Em `store-hero.tsx:154`, a imagem absoluta `xl:w-[62%]` atinge `1587×330px` (`4.81:1`) em `2560px`, iniciando em `x = 973px` enquanto a coluna esquerda `max-w-7xl` (`640px..1240px`) ainda ocupa `973px..1240px`, fazendo a foto invadir a área de título/bio e achatar excessivamente o corte.
  2. `CategoryFilterBar` (`category-filter-bar.tsx:23`) declara `sticky top-[57px]`, mas o `StorefrontHeader` desktop (`storefront-header.tsx:15`) mede ~`65px` (`py-3.5` + linha `36px` + `1px` borda), fazendo a barra sticky deslizar **8px atrás do header**.
  3. O div interno de `CategoryFilterBar` (`:24`) reaplica `mx-auto max-w-7xl px-4 md:px-6` dentro de `<main className="mx-auto max-w-7xl px-4 pb-28 pt-6 md:px-6">` (`storefront-page-client.tsx:89`), duplicando o recuo horizontal (`48px` vs `24px` nos grids de produtos).
- **Correção recomendada:** Confinar o Hero desktop em grid/container `max-w-7xl` ou limitar largura máxima da foto + degradê lateral proporcional (`2xl:w-[54%]`); ajustar `CategoryFilterBar` para `top-[57px] md:top-[65px]`; e remover `px-4 md:px-6` redundantes de `category-filter-bar.tsx:24` (ou movê-la para fora de `<main>`).

#### `[P1-05]` Páginas de Entrada (`AuthLayout`, `app/page.tsx`), fallback `/dashboard` (`!hasStores`) e Tracking Público sem paridade de Dark Mode
- **Severidade:** `P1`
- **Grupo / Rota:** `A — /`, `/sign-in`, `/sign-up`, `/sso-callback`, `C — /dashboard` (`!hasStores`), `B — /[storeSlug]/pedido/[id]`
- **Arquivo:Linha:** `components/AuthLayout.tsx:41,93,100`, `app/page.tsx:15-62`, `app/dashboard/layout.tsx:23-28`, `app/[storeSlug]/pedido/[id]/order-live-tracker.tsx:268,282,291,307,348`
- **Viewports afetados:** `1440x900`, `1600x900`, `1920x1080`, `2560x1080`, `2560x1440`
- **Tema:** `Dark` (e `Light` por ausência de alternador)
- **Causa raiz exata:** `AuthLayout` fixa `md:bg-[#F6F5F2]` e texto/card claros sem `dark:`; `app/dashboard/layout.tsx:25` (`!hasStores`) força `bg-[#F7F6F2]` sem `dark:bg-[#131A15]`; `OrderLiveTracker` não inclui `StorefrontThemeToggle` e utiliza `text-gray-400` / `text-red-600` sem `dark:`; `app/page.tsx` não possui botão visível para alternar tema.
- **Correção recomendada:** Substituir cores fixas em `AuthLayout` e `app/dashboard/layout.tsx:25` por tokens (`bg-background`, `text-foreground`, `dark:bg-[#131A15]`), incluir `StorefrontThemeToggle` em `OrderLiveTracker` com variantes `dark:` completas e adicionar um controle discreto de tema na landing `app/page.tsx`.

#### `[P1-06]` Split-pane ausente no desktop para `Minha Loja` + `StorefrontPhoneMockup` e interação de camadas com `FloatingActionBar`
- **Severidade:** `P1`
- **Grupo / Rota:** `C — /dashboard/settings`
- **Arquivo:Linha:** `app/dashboard/settings/settings-client.tsx:452,502-513,639-686`, `components/dashboard/settings/floating-action-bar.tsx:53`, `components/dashboard/sidebar.tsx:133`
- **Viewports afetados:** `1440x900`, `1600x900`, `1920x1080`, `2560x1080`, `2560x1440`
- **Tema:** `Ambos`
- **Causa raiz exata:** Apesar de `settings-client.tsx:452` utilizar corretamente `max-w-5xl`, em viewports `1600px–2560px` o `StorefrontPhoneMockup` permanece oculto dentro de um modal slide-over (`showStudioDrawer` at `:639`, `z-50`, que não fecha com tecla `Escape`), desperdiçando grande área lateral livre que comportaria visualização side-by-side em `xl:`/`2xl:`. `FloatingActionBar` (`:53`) centraliza corretamente o eixo horizontal (`lg:left-[calc(50%+130px)]`) considerando a sidebar fixa de `260px` (`sidebar.tsx:133`), porém fica coberta (`z-40`) quando a gaveta Studio (`z-50`) está aberta.
- **Correção recomendada:** Em `xl:`/`2xl:` (`>= 1440px`), oferecer split-pane persistente (formulário `flex-1 max-w-3xl` + `StorefrontPhoneMockup` sticky à direita, recolhível) mantendo a gaveta como fallback em telas `< xl`, adicionando handler de `Escape` e ajustando `FloatingActionBar` para permanecer acessível.

#### `[P1-07]` Overrides globais do Clerk em `app/globals.css` afetam qualquer widget Clerk fora do fluxo Auth
- **Severidade:** `P1`
- **Grupo / Rota:** `A — app/globals.css`, `app/page.tsx`, `C — /dashboard/team` (impacto estrutural)
- **Arquivo:Linha:** `app/globals.css:195-237`, `app/page.tsx:51-58`, `app/dashboard/team/page.tsx:1`
- **Viewports afetados:** `1440x900`, `1600x900`, `1920x1080`, `2560x1080`, `2560x1440`
- **Tema:** `Ambos`
- **Causa raiz exata:** `app/globals.css:225-237` declara globalmente `.cl-header, .cl-headerSubtitle, .cl-headerTitle, .cl-footerAction, .cl-internal-b3al4t { display: none !important; }` e `.cl-footer * { color: #666 !important; }`. Como não há escopo por classe pai de Auth, essas regras ocultam títulos e rodapés de qualquer popover `OrganizationSwitcher`/`UserButton` (`app/page.tsx`) e de futuras telas Clerk (como `OrganizationProfile` em `/dashboard/team`, hoje apenas um placeholder `"Em construção"` em `team/page.tsx:1`).
- **Correção recomendada:** Isolar todas as regras `.cl-*` sob uma classe de escopo exclusiva de `AuthLayout` (ex.: `.deliplus-clerk-auth .cl-header { ... }`) e aplicar `dark:` adequado no fallback de `/dashboard/team`.

#### `[P1-08]` Elementos clicáveis não-nativos, switches sem ARIA e `viewport maximumScale: 1` bloqueando zoom
- **Severidade:** `P1`
- **Grupo / Rota:** `A — app/layout.tsx`, `B — /[storeSlug]`, `C — /dashboard/orders`, `/dashboard/customers`, `/dashboard/finance`, `/dashboard/inventory`, `/dashboard/settings`, `/dashboard/marketing/promotions`
- **Arquivo:Linha:**
  - `app/layout.tsx:20-25` (`maximumScale: 1, userScalable: false`)
  - `components/storefront/product-card.tsx:46-48` e `components/storefront/combos-section.tsx:32-36` (`<div onClick>` sem semântica de botão ou `tabIndex`)
  - `components/storefront/checkout-client-data-modal.tsx:669-768` (`<label onClick>` para Pix/Cartão/Dinheiro sem `<input type="radio">` acessível por teclado)
  - `app/dashboard/customers/customers-client.tsx:341-378` e `app/dashboard/orders/orders-client.tsx:1574-1625` (`<th onClick>` ordenáveis sem `<button>`)
  - `app/dashboard/finance/finance-client.tsx:1235-1239` (`<tr onClick>` sem teclado) e `:1483,1508` (inputs `focus:outline-none` sem anel `focus-visible:ring`)
  - `app/dashboard/inventory/inventory-client.tsx:731-735,820-824` (`<div onClick>` para edição inline sem teclado)
  - `components/dashboard/settings/weekly-schedule-manager.tsx:262-275`, `payment-method-card.tsx:183-195`, `sections/delivery-fees-section.tsx:162-174,200-212`, `sections/kitchen-printer-section.tsx:93-112,202-221` (switches `<button>` sem `role="switch"`, `aria-checked` e `aria-label`; em `promotions-client.tsx:1208,1264` sem `aria-label`)
  - `components/ui/switch.tsx:26-27,47` (`activeTrackColor="bg-[#2E4233]"` sem contraste de borda em `dark:bg-[#1B241E]` e `focus-visible:ring-2` sem cor `focus-visible:ring-ring`)
- **Viewports afetados:** `1440x900`, `1600x900`, `1920x1080`, `2560x1080`, `2560x1440`
- **Tema:** `Ambos`
- **Causa raiz exata:** Uso de `<div>`, `<tr>`, `<th>` e `<label>` nus com `onClick` sem controles nativos (`<button>`, `<input type="radio">`) nem `focus-visible:ring-*`, somado a bloqueio de zoom do navegador no `viewport` raiz (`userScalable: false`).
- **Correção recomendada:** Remover `maximumScale: 1` e `userScalable: false` em `app/layout.tsx`; usar `<button>` dentro dos `<th>` ordenáveis e células editáveis; inserir `<input type="radio" className="sr-only">` + `focus-within:ring-2` nos cartões de pagamento do checkout; reutilizar `Switch` (`components/ui/switch.tsx`) com `focus-visible:ring-ring`, borda `dark:border-[#3D5444]` e `aria-label` obrigatório nas seções de Settings e Promoções.

---

### Severidade P2 — Médios

#### `[P2-01]` Spacer fixo `h-[30px]` no drawer e filtros/banner sem `dark:` em Pedidos
- **Severidade:** `P2`
- **Grupo / Rota:** `C — /dashboard/orders`
- **Arquivo:Linha:** `app/dashboard/orders/orders-client.tsx:1463-1466,1974,2294-2295`
- **Viewports afetados:** `1440x900`, `1600x900`, `1920x1080`, `2560x1080`, `2560x1440`
- **Tema:** `Dark` (`:1465, 2294`) e `Ambos` (`:1974`)
- **Causa raiz exata:** Os botões de filtro de status não selecionados (`:1465`) usam `text-gray-600 hover:text-gray-900 hover:bg-white/60` sem classes `dark:`, ficando com texto apagado e hover branco no Dark Mode; o banner `"Pedido Cancelado"` (`:2294`) usa apenas `bg-[#FEF2F2] border-[#FCA5A5]/60 text-[#DC2626]`; e o alinhamento do topo do drawer direito depende de um spacer fixo `h-[30px] mb-2.5` (`:1974`) que pode desalinhar caso a barra de controles mude de altura.
- **Correção recomendada:** Adicionar variantes `dark:text-[#9CA79E] dark:hover:text-[#F2EFE9] dark:hover:bg-[#25332A]` nos filtros e `dark:bg-red-950/40 dark:border-red-800/50 dark:text-red-300` no banner de cancelado; alinhar tabela e drawer usando estrutura CSS Grid de linha compartilhada (`grid-cols-[minmax(0,1fr)_370px]`).

#### `[P2-02]` Badges, linhas de grade e divisórias parciais sem variante `dark:` em Financeiro, Relatórios, Estoque e Promoções
- **Severidade:** `P2`
- **Grupo / Rota:** `C — /dashboard/finance`, `/dashboard/reports`, `/dashboard/inventory`, `/dashboard/marketing/promotions`
- **Arquivo:Linha:**
  - `app/dashboard/finance/finance-client.tsx:847,1056,1271,1368` (`border-[#1C201A]/15` no gráfico, `text-[#82887D]`, badge `bg-[#EAF5E9] text-[#2E7D32]`, borda `border-[#F0F1ED]`)
  - `components/dashboard/reports/reports-view.tsx:614,621,1167,1463` (`bg-[#DCFCE7]`, `bg-[#EFECE3]`, divisor `bg-[#E9E4D4]`, texto `text-[#525B4E]`)
  - `app/dashboard/inventory/inventory-client.tsx:707,847,858` (`divide-[#E9E4D4]`, `hover:bg-red-50`, `text-gray-500`)
  - `app/dashboard/marketing/promotions/promotions-client.tsx:904,934,946,962-964,1081,1252` (`border-[#ECEAE2]`, `text-[#637267]`, `bg-[#FDF2F0]`, `bg-[#EDE7F6]`, `bg-amber-50/70`)
- **Viewports afetados:** `1440x900`, `1600x900`, `1920x1080`, `2560x1080`, `2560x1440`
- **Tema:** `Dark`
- **Causa raiz exata:** Bordas, linhas-guia de gráfico e badges de status foram estilizados apenas para Light Mode, gerando divisórias claras brilhantes ou linhas de grade imperceptíveis sobre fundos escuros (`#1B241E` / `#131A15`).
- **Correção recomendada:** Padronizar todas as bordas e divisórias com `dark:border-[#2A382E]` / `dark:divide-[#2A382E]` e adicionar variantes translúcidas (`dark:bg-emerald-950/40 dark:text-emerald-300`, `dark:bg-white/10`) nos badges e linhas de gráfico.

#### `[P2-03]` Textos secundários `text-gray-400` (`2.39:1`–`2.54:1`) e botões de fechar sem `aria-label`
- **Severidade:** `P2`
- **Grupo / Rota:** `B — /[storeSlug]/pedido/[id]`, `C — /dashboard/customers`, `/dashboard/settings`, `/dashboard/orders`, `/dashboard/finance`, `/dashboard/team`, `components/dashboard/cover-photo-picker-modal.tsx`
- **Arquivo:Linha:** `app/dashboard/customers/customers-client.tsx:227,238,249,385,421`, `app/[storeSlug]/pedido/[id]/order-live-tracker.tsx:268,291,307,348`, `app/dashboard/team/page.tsx:1`, `app/dashboard/settings/settings-client.tsx:665-672`, `app/dashboard/orders/orders-client.tsx:2346-2352,2412-2417`, `app/dashboard/finance/finance-client.tsx:1451-1456,1601-1606`, `components/dashboard/cover-photo-picker-modal.tsx:150-156`
- **Viewports afetados:** `1440x900`, `1600x900`, `1920x1080`, `2560x1080`, `2560x1440`
- **Tema:** `Ambos`
- **Causa raiz exata:** Uso recorrente de `text-gray-400` (`#9CA3AF`) para legendas/etiquetas em fundos brancos (`2.54:1`) e creme `#FAF8F0` (`2.39:1`), além de múltiplos botões icon-only `<X>` sem `aria-label` para leitores de tela.
- **Correção recomendada:** Substituir `text-gray-400` informativo por `text-muted-foreground` (`#595959` = `7.00:1` no branco; `#9CA79E` = `6.40:1` no card escuro) e incluir `aria-label` descritivo em todos os botões de fechar modal/drawer.
