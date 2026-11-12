# Plano Mestre de Responsividade & Light/Dark Mode — DeliPlus

**Data:** 2026-11-11  
**Coordenador:** Consolidação das auditorias Fase 1 ([`responsivo-mobile.md`](./responsivo-mobile.md), [`responsivo-notebooks.md`](./responsivo-notebooks.md), [`responsivo-desktop.md`](./responsivo-desktop.md))  
**Escopo de viewports:**  
- **Mobile & Landscape Touch:** `320x568`, `360x640`, `375x812`, `390x844`, `430x932`, `667x375`, `844x390`
- **Tablets & Notebooks:** `768x1024`, `820x1180`, `1024x768`, `1280x720`, `1280x800`, `1366x768`, `1440x900`
- **Desktop & Ultrawide:** `1440x900`, `1600x900`, `1920x1080`, `2560x1080`, `2560x1440`

---

## 1. Regras Absolutas de Integridade (Restrições de Execução)

1. **Zero alterações em lógica de domínio/infraestrutura:** não modificar autenticação/organização (Clerk), banco/migrations/RLS (Supabase), Stripe/billing/webhooks, contratos de dados ou Server Actions (`actions.ts`).
2. **Preservação integral das funcionalidades existentes:** manter a sidebar enxuta de 5 menus core (`Pedidos`, `Cardápio`, `Clientes`, `Caixa & Finanças`, `Minha Loja`) + `+ Novo Pedido (PDV)` + `Assinatura & Plano`, módulo `/dashboard/customers`, rastreador público `/[storeSlug]/pedido/[id]`, `manual-order-modal.tsx`, `shift-closing-modal.tsx` e os componentes da tela `Minha Loja` (`components/dashboard/settings/*`).
3. **Arquivos fora de escopo (proibido editar):**
   - Legados/órfãos: `components/AppShell.tsx`, `components/Sidebar.tsx`, `components/MobileHeader.tsx`, `components/MobileBottomNav.tsx`, `components/DeviceWrapper.tsx`, `components/KPICard.tsx`, `components/storefront/store-tabs.tsx`, `components/storefront/store-offers-banner.tsx`.
   - Rotas de redirecionamento: `app/dashboard/page.tsx`, `app/dashboard/marketing/page.tsx`, `app/dashboard/marketing/coupons/*`.
   - Não recriar rotas removidas (`/dashboard/production`, `overview-client.tsx`).
   - Não adicionar dependências em `package.json`.

---

## 2. Priorização Consolidada (P0 -> P1 -> P2)

### Prioridade P0 — Bloqueadores Críticos de Uso, Visibilidade, Print & Layout

| ID | Tema / Problema Consolidado | Relatórios Origem | Dono Exclusivo |
| :--- | :--- | :--- | :--- |
| **PM-P0-01** | **Viewport raiz, safe-area e scrollbars:** `app/layout.tsx` bloqueia zoom (`maximumScale: 1, userScalable: false`) e omite `viewportFit: 'cover'`; `.pb-safe` usada em `MobileNav` não existe em `globals.css`; wildcard `* { scrollbar-width: none !important }` oculta scrollbars para usuários desktop (`pointer: fine`); ausência de tokens/utilitários de altura curta (`short:`) e regra anti-zoom `16px` em inputs touch; tokens `:root`/`.dark` com contraste `< 4.5:1` (`--primary`, `--sidebar-accent-foreground`, `--destructive`); overrides `.cl-*` sem escopo de Auth; `@media print` imprimindo em branco fora de `#thermal-receipt` e risco de corte por `overflow-hidden` em ancestrais. | Mobile `P0-01`, `P2-01`; NB `P1-01`, `P2-03`; Desk `P0-04`, `P0-05`, `P1-01`, `P1-07`, `P1-08` | `shell-foundation` |
| **PM-P0-02** | **Shell do Dashboard (`MobileNav`, `DashboardHeader`, `Sidebar`, `DashboardLayoutClient`):** `MobileNav` com `w-16` estoura `320px` (5×64+16=336px), falta `pb-safe` real e padding inferior global em `<main>` (`max-lg:pb-[calc(72px+env(safe-area-inset-bottom))]`); popover de notificações (`right-0 w-[340px]`) vaza para fora da borda esquerda em `320px–390px`; falta paridade Mobile/Tablet `< 1024px` (toggle `Loja Aberta/Fechada`, seletor multi-loja, `+ Novo Pedido (PDV)`, acesso a `Relatórios`, `Estoque`, `Promoções`, `Academia`, `Assinatura & Plano`); `Sidebar` fixa `260px` comprime notebooks `1024x768–1279px` e suprime toggle `Aberta/Fechada` quando há múltiplas lojas; `DashboardLayoutClient` trava `/dashboard/finance` com `lg:overflow-hidden` e usa `h-screen` em vez de `h-dvh`. | Mobile `P0-05`, `P0-06`, `P2-05`; NB `P0-01`, `P1-01`, `P1-02`, `P2-04`; Desk `P1-03` | `shell-foundation` |
| **PM-P0-03** | **Tooltips `?` ilegíveis (`1:1` / `1.06:1`) e inacessíveis em touch/teclado:** `Financeiro` (`HelpTooltip`), `Relatórios` (`CardHelpTooltip`) e `Promoções` (`Gestão Centralizada:`) renderizam texto da mesma cor do fundo no Light Mode; demais tooltips em Pedidos, Cardápio, Estoque, Configurações dependem só de `group-hover` e estouram `320px`. Extrair `<HelpTooltip />` acessível em `components/ui/help-tooltip.tsx` (Etapa 2A) e adotar nos módulos (Etapa 2B). | Mobile `P0-09`, `P0-10`, `P0-11`, `P2-03`; NB `P0-04`, `P0-05`, `P1-03`; Desk `P0-01`, `P0-02` | `shell-foundation` (componente) + `dashboard-ops-dev` / `dashboard-biz-dev` (adoção) |
| **PM-P0-04** | **Storefront `ProductDetailModal` & Lightbox:** Seção "Bebidas" desaparece em `844x390` landscape (`md:max-h-[85vh]` + `md:overflow-y-hidden` + colapsamento da coluna esquerda); Lightbox de zoom recorta setas laterais `md:-left-16`/`md:-right-16` dentro de `overflow-hidden` e colide com barra/miniaturas em `667x375` e `844x390`; inputs `< 16px` (`text-xs`/`text-sm`), steppers `16px–28px` e footer sem `pb-safe`. | Mobile `P0-03`, `P0-04`, `P1-06`; NB `P0-07`, `P1-09`; Desk `P0-06` | `storefront-dev` |
| **PM-P0-05** | **`AuthLayout` e `/sign-in` / `/sign-up`:** botão voltar no header mobile de `AuthLayout` está inerte (sem `Link`/`onClick`) e `< 44px`; padding combinado comprime card Clerk para `208px` em `320px`; ausência de Dark Mode e regras `.cl-*` sem escopo. | Mobile `P0-02`, `P1-02`; NB `P1-11`; Desk `P1-05`, `P1-07` | `dashboard-biz-dev` (páginas/AuthLayout) + `shell-foundation` (escopo CSS `.cl-*`) |
| **PM-P0-06** | **Travamento vertical em alturas curtas (`720px`/`768px`/landscape) e Dark Mode quebrado em `Cardápio`, `Estoque` e `Pedidos`:** `h-full max-h-full overflow-hidden` / `overflow-y-hidden` cortam linhas e alertas de reposição; cards mobile (`bg-white` + `dark:text-[#F2EFE9]`) tornam texto branco sobre fundo branco no Dark Mode (`menu-client.tsx`, `inventory-client.tsx`); 7 modais de Cardápio, 3 modais/inputs de Pedidos, 4 modais de Estoque e `CoverPhotoPickerModal` sem `dark:` e sem `max-h-[90dvh]`; drawer fixo de Pedidos comprime `1024x768` para `368px` e painel `Reposição` (`300px`) comprime Estoque para `396px`; integridade de colunas `<th>`/`<td>` e `manual-order-modal` em `320px`. | Mobile `P0-07`, `P0-08`, `P1-07`, `P1-08`; NB `P0-02`, `P0-03`, `P1-04`, `P1-07`; Desk `P0-03`, `P1-02`, `P2-01` | `dashboard-ops-dev` |
| **PM-P0-07** | **`Minha Loja / Configurações` (`FloatingActionBar`, `StorefrontPhoneMockup`, `ProfileBrandSection`, `Payments`, `DeliveryFees`, `Schedule`):** `FloatingActionBar` (`bottom-6 z-40`) fica atrás da `MobileNav` (`z-50`) no mobile/tablet e estoura `320px–360px` com `whitespace-nowrap`; drawer Studio com `StorefrontPhoneMockup` fixo `340x690` estoura `320px/360px` e altura `720px–800px` (além de subutilizar split-pane em `xl:`/`2xl:`); `ProfileBrandSection` `lg:grid-cols-3` gera overflow de CEP em `1024x768`; impressão `"Imprimir Display"` imprime em branco com `@media print` atual; `delivery-fees` sem cards mobile; switches sem ARIA/contraste. | Mobile `P0-12`, `P1-11`; NB `P0-08`, `P1-02`, `P1-08`; Desk `P0-04`, `P1-06`, `P1-08` | `dashboard-biz-dev` (+ `--sidebar-w` e `@media print` em `shell-foundation`) |
| **PM-P0-08** | **`Financeiro`, `Relatórios`, `Promoções` e `Billing`:** header de ações do Financeiro estoura `320px–430px`; modais de Taxas/Detalhes sem `dark:` (texto branco sobre fundo branco) e sem `max-h-[90dvh]`; tabela `table-fixed` do Financeiro somando `100%` com scroll horizontal seguro em telas menores; `Relatórios` com `CardHelpTooltip` ilegível, calendário `w-[330px]` estourando `320px` e textos escuros no Dark Mode; `Promoções` com tooltip branco-sobre-creme, tabela/modal sem `dark:`, modal sem `max-h-[90dvh]`, `DeliPlusDatePicker` vazando à direita e footer sem `flex-wrap`; `Billing` com `md:grid-cols-3` comprimindo cards/badges e cortando botões `whitespace-nowrap` em `768px–1024px`. | Mobile `P0-09`, `P0-10`, `P0-11`, `P1-09`, `P1-10`, `P1-11`; NB `P0-01`, `P0-04`, `P0-05`, `P0-06`, `P0-09`, `P0-10`, `P1-05`, `P1-06`, `P1-12`; Desk `P0-01`, `P0-02`, `P0-03`, `P0-05`, `P1-02`, `P1-03` | `dashboard-biz-dev` |

### Prioridade P1 — Alto Impacto (Touch, iOS Anti-Zoom, Storefront, Ultrawide, Dark Mode e Acessibilidade)

- **PM-P1-01 (Fundação UI):** `components/ui/input.tsx` (`md:text-sm` ativa `14px` em `844x390` landscape -> usar `text-base lg:text-sm` ou regra CSS touch), `components/ui/button.tsx` (`min-h-9` / área de toque adequada em variantes usadas em ações críticas), `components/ui/switch.tsx` (hitbox acessível + contraste `dark:bg-emerald-500` + `focus-visible:ring-ring`), `components/ui/social-icons.tsx` (`TikTokIcon` `fill="currentColor"`), `components/ui/card.tsx` (evitar corte involuntário).
- **PM-P1-02 (Storefront Sticky, Hero, Cart, Modais, Checkout & Tracking):** `CategoryFilterBar` (`top-[57px] md:top-[65px]` para não deslizar sob `StorefrontHeader`, remover padding redundante `px-4 md:px-6` dentro de `<main>`, input busca `text-base lg:text-sm`); `StoreHero` em landscape/curtas e `2560px` (`xl:w-[62%]` -> confinar/proporcionar `max-w-7xl`); `MobileCartBar` com `pb-safe` / `bottom-[max(1rem,env(safe-area-inset-bottom))]` e visível até `< lg`; `StorefrontHeader` / `StorefrontThemeToggle` / `MerchantBackButton` touch `>= 44px` no mobile e grid até `1440px`/`2560px`; `CartDrawer`, `DeliveryInfoModal`, `FavoritesModal`, `OrderTrackingModal`, `ReceivingMethodModal`, `CheckoutClientDataModal`, `CheckoutPaymentModal`, `OrderConfirmedScreen`, `StoreClosedScreen` e `OrderLiveTracker` (`max-h-[90dvh]`, inputs `16px` no touch, steppers `>= 36px`, Dark Mode completo, `lg:grid-cols-12` no checkout, semântica `<button>`/`<input type="radio">` acessível).
- **PM-P1-03 (Operação Dashboard — Cards Mobile, Paginação, Colunas & Modais):** Visão em cards mobile + consistência estrita de colunas `<th>` == `<td>` (inclusive slots vazios) em `Orders`, `Menu`, `Customers`, `Inventory`; `max-h-[90dvh] overflow-y-auto` em todos os modais + `ManualOrderModal`; elevação de z-index de drawers e spotlight tour acima da `MobileNav`; `max-w-[1440px]` / `max-w-6xl` em `1920px`/`2560px` para evitar estiramento extremo.
- **PM-P1-04 (Gestão, Relatórios, Academy, Team, Auth & Entrada):** `Academy` com contraste WCAG >= 4.5:1 no Dark Mode, chips acessíveis, `shrink-0` e `flex-wrap`; `Customers` com cards mobile, `pb-safe`/folga e botões ordenáveis acessíveis; `Team` (`p-6 sm:p-20` + `dark:`), `app/page.tsx` (tema Dark/Light + layout ultrawide), `sso-callback`, `onboarding`, `stores/new`, `stores/[storeId]/setup` (Dark Mode, touch `>= 36px`, inputs `16px`).

### Prioridade P2 — Polimento, Semântica e Contraste Fino

- **PM-P2-01:** Substituir `text-gray-400` informativo (`2.39:1`–`2.54:1`) por `text-muted-foreground` (`>= 4.5:1`) e ajustar CTAs WhatsApp (`bg-[#15803D]` / `bg-[#128C7E]`) e Terracotta/Badges para WCAG >= 4.5:1 em Light e Dark.
- **PM-P2-02:** Adicionar `aria-label` em todos os botões `<X>` icon-only, converter `<th>`/`<tr>`/`<div>` clicáveis críticos em `<button>` ou controles acessíveis com `focus-visible:ring`, e corrigir paginações `absolute left-6` para `flex flex-wrap justify-between gap-2`.
- **PM-P2-03:** Expor pistas visuais (gradientes/setas) em barras de abas horizontais roláveis (`Settings`, `Academy`, `CategoryFilterBar`) e remover spacers rígidos (`h-[30px]` em `Orders`).

---

## 3. Mapa de Propriedade Exclusiva de Arquivos (Fase 2)

> **Regra de ouro:** nenhum arquivo aparece em dois workers. A Etapa 2B só inicia após a Etapa 2A passar `yarn typecheck`.

### Etapa 2A — Sequencial Preparatória (`shell-foundation`)
**Arquivos exclusivos:**
- `app/layout.tsx`
- `app/globals.css`
- `components/theme-provider.tsx`
- `app/dashboard/layout.tsx` *(APENAS ajuste de classe CSS na linha 25 `!hasStores`: `min-h-dvh ... dark:bg-[#131A15]`, mais repasse opcional de `initialStores` ao `DashboardLayoutClient` se usado para header mobile; zero mudança em auth/Clerk/queries)*
- `components/dashboard/dashboard-layout-client.tsx`
- `components/dashboard/sidebar.tsx`
- `components/dashboard/dashboard-header.tsx`
- `components/LogoDeli.tsx` *(somente se necessário ajuste mínimo de tamanho/contraste)*
- `components/ui/input.tsx`
- `components/ui/button.tsx`
- `components/ui/switch.tsx`
- `components/ui/social-icons.tsx`
- `components/ui/card.tsx`
- `components/ui/alert.tsx`, `components/ui/field.tsx`, `components/ui/label.tsx`, `components/ui/separator.tsx` *(apenas se necessário contraste/spacing)*
- Novo componente compartilhado sem dependências externas: `components/ui/help-tooltip.tsx` (popover acessível por clique/toque/teclado/Escape + hover em `pointer: fine`, contraste WCAG >= 4.5:1 Light/Dark e largura segura `w-[min(20rem,calc(100vw-2rem))]`).

### Etapa 2B — Paralela (3 Workers com Propriedade 100% Disjunta)

1. **`storefront-dev`**
   - `app/[storeSlug]/page.tsx` *(somente ajustes de container/classes/tema caso necessário; sem alterar queries/fallback)*
   - `app/[storeSlug]/pedido/[id]/page.tsx` e `app/[storeSlug]/pedido/[id]/order-live-tracker.tsx`
   - Todos os arquivos ativos de `components/storefront/*`:
     `storefront-page-client.tsx`, `storefront-header.tsx`, `storefront-theme-toggle.tsx`, `store-hero.tsx`, `category-filter-bar.tsx`, `combos-section.tsx`, `product-card.tsx`, `product-detail-modal.tsx`, `cart-drawer.tsx`, `mobile-cart-bar.tsx`, `checkout-client-data-modal.tsx`, `checkout-payment-modal.tsx`, `receiving-method-modal.tsx`, `delivery-info-modal.tsx`, `favorites-modal.tsx`, `order-tracking-modal.tsx`, `order-confirmed-screen.tsx`, `store-closed-screen.tsx`, `merchant-back-button.tsx`, `payment-brand-icons.tsx`
   - **Proibido tocar:** `store-tabs.tsx`, `store-offers-banner.tsx`, `lib/storefront/actions.ts`.

2. **`dashboard-ops-dev`**
   - `app/dashboard/orders/page.tsx`, `app/dashboard/orders/orders-client.tsx`, `app/dashboard/orders/manual-order-modal.tsx`
   - `app/dashboard/menu/page.tsx`, `app/dashboard/menu/menu-client.tsx`, `app/dashboard/menu/menu-utils.ts`
   - `app/dashboard/customers/page.tsx`, `app/dashboard/customers/customers-client.tsx`
   - `app/dashboard/inventory/page.tsx`, `app/dashboard/inventory/inventory-client.tsx`
   - `components/dashboard/cover-photo-picker-modal.tsx`
   - **Proibido tocar:** `app/dashboard/orders/actions.ts`, `app/dashboard/menu/actions.ts`, `app/dashboard/inventory/actions.ts`.

3. **`dashboard-biz-dev`**
   - `app/dashboard/settings/page.tsx`, `app/dashboard/settings/settings-client.tsx`, `app/dashboard/settings/types.ts`
   - `components/dashboard/settings/floating-action-bar.tsx`, `settings-sidebar.tsx`, `storefront-phone-mockup.tsx`, `weekly-schedule-manager.tsx`, `payment-method-card.tsx`, `sections/delivery-fees-section.tsx`, `sections/kitchen-printer-section.tsx`, `sections/payments-section.tsx`, `sections/plan-vitality-section.tsx`, `sections/profile-brand-section.tsx`, `sections/schedule-section.tsx`
   - `app/dashboard/finance/page.tsx`, `app/dashboard/finance/finance-client.tsx`, `app/dashboard/finance/shift-closing-modal.tsx`
   - `app/dashboard/reports/page.tsx`, `components/dashboard/reports/reports-view.tsx`
   - `app/dashboard/marketing/promotions/page.tsx`, `app/dashboard/marketing/promotions/promotions-client.tsx`
   - `app/dashboard/marketing/academy/page.tsx`, `app/dashboard/marketing/academy/academy-client.tsx`
   - `app/dashboard/billing/page.tsx`, `app/dashboard/billing/billing-status.tsx`, `app/dashboard/billing/checkout-form.tsx`, `app/dashboard/billing/subscription-management-form.tsx`, `app/dashboard/billing/success/page.tsx`, `app/dashboard/billing/success/pending-confirmation.tsx`, `app/dashboard/billing/success/refresh-status.tsx`, `app/dashboard/billing-feedback.tsx`
   - `app/dashboard/team/page.tsx`
   - `app/page.tsx`, `components/AuthLayout.tsx`, `app/sign-in/[[...sign-in]]/page.tsx`, `app/sign-up/[[...sign-up]]/page.tsx`, `app/sso-callback/page.tsx`
   - `app/onboarding/page.tsx`, `app/onboarding/automatic-provisioning.tsx`
   - `app/dashboard/stores/new/page.tsx`, `app/dashboard/stores/new/new-store-form.tsx`
   - `app/dashboard/stores/[storeId]/setup/page.tsx`, `app/dashboard/stores/[storeId]/setup/store-setup-form.tsx`
   - **Proibido tocar:** `actions.ts`, `billing-state.ts`, `subscription-management-*.ts`, `checkout-feedback.ts`, `onboarding-state.ts`, `automatic-provisioning.internal.ts`, `app/dashboard/marketing/page.tsx`, `app/dashboard/marketing/coupons/*`.

### Fase 3 — Verificação & Auditoria (`qa-verifier`, sem editar código dos devs)
- Execução de `yarn typecheck`, `yarn lint`, `yarn build`, suítes de UI/rota existentes (`yarn test:public-store`, `yarn test:accessible-store-links`, `yarn test:sidebar-storefront`, `yarn test:billing-checkout-ui`, `yarn test:billing-success-ui`) e script `puppeteer` em toda a matriz de viewports Light/Dark.
- Auditoria final de integridade do `git diff` garantindo zero alteração fora do escopo UI/CSS/responsivo.
