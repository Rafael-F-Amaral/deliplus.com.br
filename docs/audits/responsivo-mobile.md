# Auditoria de Responsividade Mobile & UX — DeliPlus

**Data:** 2026-11-11  
**Autor:** `mobile-specialist` (Fase 1 — Inspeção estática read-only do código-fonte ativo)  
**Escopo de viewports analisados:** `320x568`, `360x640`, `375x812`, `390x844`, `430x932` e mobile landscape (`667x375`, `844x390`)  
**Nota de breakpoints Tailwind:** `sm:` ativa em `>= 640px` (`667x375` landscape) e `md:` ativa em `>= 768px` (`844x390` landscape). Somente `lg:` (`>= 1024px`) permanece inativo nos viewports mobile landscape testados.

---

## 1. Resumo Executivo por Severidade

| Severidade | Quantidade | Critério |
| --- | :---: | --- |
| **P0 — Crítico** | **12** | Bloqueio funcional/navegação morto, conteúdo oculto em portrait/landscape, texto ilegível (contraste nulo em Light ou Dark Mode), colisão/ocultação sob barras fixas ou quebra severa de layout |
| **P1 — Alto** | **11** | Auto-zoom iOS (`font-size < 16px` em `input`/`select`/`textarea`), touch targets críticos `< 36px` / navegação `< 44px`, tabelas sem visão em cards mobile, modais sem `max-h-[90dvh]`, ausência de `pb-safe` / safe-area e Dark Mode parcial |
| **P2 — Médio / Polimento** | **5** | Quebras secundárias em `320px`, tooltips hover-only em touch, truncamentos evitáveis, pistas visuais de scroll suprimidas globalmente e pequenos ajustes de toque/contraste |
| **Total** | **28** | **12 P0 · 11 P1 · 5 P2** |

### Principais Riscos Sistêmicos Identificados

1. **Safe-area e viewport global inertes (`P0-01`):** `app/layout.tsx` não declara `viewportFit: 'cover'` e bloqueia pinch-zoom (`maximumScale: 1, userScalable: false`), enquanto `.pb-safe` usada em `MobileNav` (`components/dashboard/sidebar.tsx:389`) não existe em `app/globals.css`.
2. **Armadilha de Landscape (`667x375` e `844x390`):** Em `844x390`, `md:` (`>= 768px`) ativa regras de desktop enquanto a altura útil é de apenas `390px`, ocultando **Bebidas** no modal de produto (`P0-03`), cortando setas do lightbox (`P0-04`), reduzindo o `Input` base para `14px` via `md:text-sm` (`P1-01`), mantendo a `Sidebar` oculta até `lg:` sem paridade no header (`P0-05`) e comprimindo tabelas com `overflow-hidden` (`P1-07`, `P1-08`, `P0-08`).
3. **Contraste nulo em Light e Dark Mode (`P0-07`, `P0-08`, `P0-09`, `P0-10`, `P0-11`):** Cards mobile de `Cardápio` e `Estoque` aplicam `bg-white` sem `dark:bg-[#1B241E]` sobre textos `dark:text-[#F2EFE9]`, deixando o texto invisível no Dark Mode; tooltips de `Financeiro` e `Relatórios` aplicam `text-[#2E4233]` sobre `bg-[#2E4233]` no Light Mode; e o tooltip de `Promoções` renderiza `text-white` sobre `bg-[#FAF8F0]` no Light Mode.
4. **Sobreposição de barras fixas no Dashboard (`P0-06`, `P0-12`):** `MobileNav` (`h-[72px] z-50`) cobre o conteúdo inferior de módulos sem `pb-24` e se sobrepõe diretamente à `FloatingActionBar` (`fixed bottom-6 z-40`) em `Minha Loja / Configurações`, escondendo o botão de salvar alterações atrás da navegação inferior.

---

## 2. Cobertura do Inventário (A / B / C)

Todos os arquivos ativos listados no inventário foram inspecionados diretamente. Nenhum arquivo legado/órfão ou rota removida foi considerado ativo. Observação de roteamento: `app/dashboard/page.tsx` redireciona para `/dashboard/orders`, e `app/dashboard/marketing/page.tsx` e `app/dashboard/marketing/coupons/page.tsx` redirecionam para `/dashboard/marketing/promotions`.

| Grupo | Escopo | Arquivos Inspecionados |
| --- | --- | --- |
| **A — Fundações & Entrada** | Layout raiz, CSS global, tema, landing, auth, onboarding, criação/setup de loja, UI base | `app/layout.tsx`, `app/globals.css`, `components/theme-provider.tsx`, `app/page.tsx`, `components/AuthLayout.tsx`, `app/sign-in/[[...sign-in]]/page.tsx`, `app/sign-up/[[...sign-up]]/page.tsx`, `app/sso-callback/page.tsx`, `app/onboarding/page.tsx`, `app/onboarding/automatic-provisioning.tsx`, `app/dashboard/stores/new/page.tsx`, `app/dashboard/stores/new/new-store-form.tsx`, `app/dashboard/stores/[storeId]/setup/page.tsx`, `app/dashboard/stores/[storeId]/setup/store-setup-form.tsx`, `components/ui/alert.tsx`, `components/ui/button.tsx`, `components/ui/card.tsx`, `components/ui/field.tsx`, `components/ui/input.tsx`, `components/ui/label.tsx`, `components/ui/separator.tsx`, `components/ui/social-icons.tsx`, `components/ui/switch.tsx` |
| **B — Storefront Público & Tracking** | Página pública por slug, tracking ao vivo e componentes ativos de `components/storefront/*` | `app/[storeSlug]/page.tsx`, `app/[storeSlug]/pedido/[id]/page.tsx`, `app/[storeSlug]/pedido/[id]/order-live-tracker.tsx`, `components/storefront/storefront-page-client.tsx`, `components/storefront/storefront-header.tsx`, `components/storefront/storefront-theme-toggle.tsx`, `components/storefront/store-hero.tsx`, `components/storefront/category-filter-bar.tsx`, `components/storefront/combos-section.tsx`, `components/storefront/product-card.tsx`, `components/storefront/mobile-cart-bar.tsx`, `components/storefront/merchant-back-button.tsx`, `components/storefront/payment-brand-icons.tsx`, `components/storefront/store-closed-screen.tsx`, `components/storefront/cart-drawer.tsx`, `components/storefront/delivery-info-modal.tsx`, `components/storefront/favorites-modal.tsx`, `components/storefront/order-tracking-modal.tsx`, `components/storefront/order-confirmed-screen.tsx`, `components/storefront/checkout-payment-modal.tsx`, `components/storefront/receiving-method-modal.tsx`, `components/storefront/checkout-client-data-modal.tsx`, `components/storefront/product-detail-modal.tsx` |
| **C — Dashboard Shell & Módulos** | Shell do dashboard e todos os módulos ativos | `app/dashboard/layout.tsx`, `app/dashboard/billing-feedback.tsx`, `components/dashboard/dashboard-layout-client.tsx`, `components/dashboard/sidebar.tsx`, `components/dashboard/dashboard-header.tsx`, `components/LogoDeli.tsx`, `components/dashboard/cover-photo-picker-modal.tsx`, `app/dashboard/orders/page.tsx`, `app/dashboard/orders/orders-client.tsx`, `app/dashboard/orders/manual-order-modal.tsx`, `app/dashboard/menu/page.tsx`, `app/dashboard/menu/menu-client.tsx`, `app/dashboard/customers/page.tsx`, `app/dashboard/customers/customers-client.tsx`, `app/dashboard/finance/page.tsx`, `app/dashboard/finance/finance-client.tsx`, `app/dashboard/finance/shift-closing-modal.tsx`, `app/dashboard/settings/page.tsx`, `app/dashboard/settings/settings-client.tsx`, `components/dashboard/settings/floating-action-bar.tsx`, `components/dashboard/settings/payment-method-card.tsx`, `components/dashboard/settings/settings-sidebar.tsx`, `components/dashboard/settings/storefront-phone-mockup.tsx`, `components/dashboard/settings/weekly-schedule-manager.tsx`, `components/dashboard/settings/sections/delivery-fees-section.tsx`, `components/dashboard/settings/sections/kitchen-printer-section.tsx`, `components/dashboard/settings/sections/payments-section.tsx`, `components/dashboard/settings/sections/plan-vitality-section.tsx`, `components/dashboard/settings/sections/profile-brand-section.tsx`, `components/dashboard/settings/sections/schedule-section.tsx`, `app/dashboard/reports/page.tsx`, `components/dashboard/reports/reports-view.tsx`, `app/dashboard/inventory/page.tsx`, `app/dashboard/inventory/inventory-client.tsx`, `app/dashboard/marketing/promotions/page.tsx`, `app/dashboard/marketing/promotions/promotions-client.tsx`, `app/dashboard/marketing/academy/page.tsx`, `app/dashboard/marketing/academy/academy-client.tsx`, `app/dashboard/billing/page.tsx`, `app/dashboard/billing/billing-status.tsx`, `app/dashboard/billing/checkout-form.tsx`, `app/dashboard/billing/subscription-management-form.tsx`, `app/dashboard/billing/success/page.tsx`, `app/dashboard/billing/success/pending-confirmation.tsx`, `app/dashboard/billing/success/refresh-status.tsx`, `app/dashboard/team/page.tsx` |

---

## 3. Achados Críticos — P0 (12)

### P0-01 — Viewport bloqueia acessibilidade/zoom, omite `viewportFit: 'cover'` e `.pb-safe` é inoperante no CSS
- **Severidade:** `P0`
- **Grupo / Rota:** Grupo A — Global (todas as rotas)
- **Arquivo:Linha:** `app/layout.tsx:20-25`; `app/globals.css`; `components/dashboard/sidebar.tsx:389`
- **Viewports afetados:** `320x568`, `360x640`, `375x812`, `390x844`, `430x932`, `667x375`, `844x390`
- **Tema:** Ambos
- **Causa raiz exata no código lido:** `app/layout.tsx:20-25` exporta `viewport: Viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false }`, omitindo `viewportFit: 'cover'` (fazendo `env(safe-area-inset-*)` retornar `0px` em aparelhos com notch/home indicator) e bloqueando pinch-zoom de acessibilidade. Além disso, `components/dashboard/sidebar.tsx:389` aplica a classe `pb-safe` no `MobileNav`, mas não existe utilitário `.pb-safe` / `env(safe-area-inset-bottom)` definido em `app/globals.css` (nem plugin correspondente em `package.json`).
- **Correção recomendada:** Remover `maximumScale: 1` e `userScalable: false`, adicionar `viewportFit: 'cover'` em `app/layout.tsx`, e declarar utilitários `@utility pb-safe` / `.pb-safe` e `.pt-safe` usando `env(safe-area-inset-bottom)` / `env(safe-area-inset-top)` em `app/globals.css`.

### P0-02 — Botão voltar inerte no header mobile de Auth + compressão extrema do card Clerk em `320px`
- **Severidade:** `P0`
- **Grupo / Rota:** Grupo A — `/sign-in`, `/sign-up`
- **Arquivo:Linha:** `components/AuthLayout.tsx:48`, `components/AuthLayout.tsx:54`; `app/sign-in/[[...sign-in]]/page.tsx:17`; `app/sign-up/[[...sign-up]]/page.tsx:17`
- **Viewports afetados:** `320x568`, `360x640`, `375x812`, `390x844`, `430x932`, `667x375`
- **Tema:** Ambos
- **Causa raiz exata no código lido:** `components/AuthLayout.tsx:48` renderiza `<button className="h-[36px] w-[36px] ...">` sem `onClick`, sem `type` e sem `<Link>`, resultando em um botão de voltar completamente morto no cabeçalho mobile, além de estar abaixo de `44px` para navegação principal. Em `320x568`, a soma de `p-6` em `components/AuthLayout.tsx:54` (`48px`) com `card: "... p-8 ..."` (`64px`) em `app/sign-in/[[...sign-in]]/page.tsx:17` e `app/sign-up/[[...sign-up]]/page.tsx:17` reduz a área útil interna do formulário para apenas `208px`.
- **Correção recomendada:** Converter o botão de voltar em `<Link href="/">` com área mínima `44x44px` (`min-h-11 min-w-11`), reduzir padding combinado no mobile (`px-4 py-5` no wrapper e `p-5 sm:p-8` no card Clerk) e forçar `text-base` (`16px`) em `formFieldInput` na aparência do Clerk.

### P0-03 — Seção "Bebidas" desaparece completamente no `ProductDetailModal` em `844x390` landscape
- **Severidade:** `P0`
- **Grupo / Rota:** Grupo B — `/[storeSlug]` (Modal de Produto)
- **Arquivo:Linha:** `components/storefront/product-detail-modal.tsx:322`, `335`, `337`, `415`, `863`
- **Viewports afetados:** `844x390` (mobile landscape `>= md`)
- **Tema:** Ambos
- **Causa raiz exata no código lido:** Em `844x390` (`md:` ativo), o modal limita a altura em `md:max-h-[85vh]` (`~331px`, linha `322`) e trava a rolagem do body em `md:overflow-y-hidden` (`335`). A coluna esquerda (`md:w-[325px]` na linha `337`, sem `overflow-y-auto`) exibe a foto com `aspect-[4/3]` (`~244px` de altura) somada a padding/gap, colapsando o bloco de bebidas desktop `hidden md:flex ... flex-1 min-h-0` (`415`) para `0px` de altura visível, enquanto o bloco fallback mobile `flex md:hidden` (`863`) é ocultado por estar em `>= 768px`.
- **Correção recomendada:** Habilitar rolagem na coluna esquerda em alturas reduzidas (`md:overflow-y-auto` ou usar `lg:` para o layout de duas colunas travadas quando `max-height` for baixa) ou mover a condição de exibição do bloco de bebidas para considerar media query de altura/largura (`lg:flex` / `lg:hidden` ou `max-h-[92dvh]`).

### P0-04 — Lightbox de zoom no modal de produto corta setas laterais e colide verticalmente em landscape
- **Severidade:** `P0`
- **Grupo / Rota:** Grupo B — `/[storeSlug]` (Lightbox de Produto)
- **Arquivo:Linha:** `components/storefront/product-detail-modal.tsx:1055-1135` (`1083`, `1101`, `1112`)
- **Viewports afetados:** `667x375`, `844x390` (corte total das setas em `>= 768px`; colisão vertical em ambos)
- **Tema:** Ambos
- **Causa raiz exata no código lido:** O container da imagem ampliada (`1083`) possui `overflow-hidden`, enquanto os botões anterior/próximo usam `left-2 md:-left-16` (`1101`) e `right-2 md:-right-16` (`1112`). Em qualquer viewport `>= 768px` (incluindo `844x390` landscape), `-left-16` e `-right-16` posicionam os botões fora da caixa com `overflow-hidden`, tornando-os cortados/invisíveis. Além disso, em `667x375` e `844x390`, `max-h-[75vh]` com barra fixa `top-4` (`1060`) e miniaturas `bottom-4` (`1124`) sobrepõe a imagem e reduz o respiro vertical.
- **Correção recomendada:** Remover `overflow-hidden` do container relativo do lightbox (mantendo o `rounded-xl` apenas no `<img>`), manter as setas dentro de área segura (`left-3 md:left-4`), e estruturar o overlay em flex column com `pt-safe pb-safe` em vez de posicionamento absoluto sobreposto à imagem.

### P0-05 — Paridade Mobile vs Desktop quebrada no Dashboard: alternador de lojas, status Aberta/Fechada e rotas ocultas
- **Severidade:** `P0`
- **Grupo / Rota:** Grupo C — Shell do Dashboard (`/dashboard/*`)
- **Arquivo:Linha:** `components/dashboard/sidebar.tsx:54-60`, `133`, `166-206`, `212-229`, `237-243`, `385-410`; `components/dashboard/dashboard-header.tsx:346-391`
- **Viewports afetados:** `320x568`, `360x640`, `375x812`, `390x844`, `430x932`, `667x375`, `844x390` (`< lg`, `< 1024px`)
- **Tema:** Ambos
- **Causa raiz exata no código lido:** O `<aside>` completo da sidebar possui `hidden lg:flex` (`sidebar.tsx:133`), ficando oculto em todo mobile e landscape (`< 1024px`). Embora `DashboardHeader` replique `Ver Loja`, `Minha Loja`, `Planos e Assinatura` e `Sair da conta` no menu de perfil (`dashboard-header.tsx:347-391`), ficam **totalmente inacessíveis em `< 1024px`**: o seletor multi-loja (`sidebar.tsx:166-206`) e o botão toggle `Loja Aberta / Loja Fechada` (`sidebar.tsx:212-229`) — e mesmo no desktop, quando `hasMultipleStores` é verdadeiro, o `else` na linha `207` suprime o botão Aberta/Fechada. Adicionalmente, `menuItems` (`54-60`) e `MobileNav` (`385-410`) só contemplam 5 rotas (`Pedidos`, `Cardápio`, `Clientes`, `Finanças`, `Loja`), deixando `/dashboard/reports`, `/dashboard/inventory`, `/dashboard/marketing/promotions`, `/dashboard/marketing/academy` e `/dashboard/team` sem link de acesso no shell principal.
- **Correção recomendada:** Expor o seletor de loja ativa e o toggle `Loja Aberta / Loja Fechada` no `DashboardHeader` (ou drawer/sheet mobile acessível pelo header em `< lg`), além de incluir um menu "Mais" / drawer lateral para acessar `Relatórios`, `Estoque`, `Promoções` e `Academia`.

### P0-06 — `MobileNav` estoura `320px`, `DashboardLayoutClient` não aplica folga inferior e popover do sino vaza fora da tela
- **Severidade:** `P0`
- **Grupo / Rota:** Grupo C — Shell do Dashboard (`/dashboard/*`)
- **Arquivo:Linha:** `components/dashboard/sidebar.tsx:389`, `396`; `components/dashboard/dashboard-layout-client.tsx:20`, `28-34`; `components/dashboard/dashboard-header.tsx:192`
- **Viewports afetados:** `320x568` (estouro `MobileNav` + popover), `360x640`, `375x812`, `390x844` (estouro popover), `430x932`, `667x375`, `844x390`
- **Tema:** Ambos
- **Causa raiz exata no código lido:**
  1. `MobileNav` (`sidebar.tsx:389, 396`) renderiza 5 `<Link>` com largura fixa `w-16` (`64px * 5 = 320px`) dentro de um container com `px-2` (`+16px` = `336px`), ultrapassando `320px` e deslocando itens nas extremidades.
  2. `DashboardLayoutClient` (`dashboard-layout-client.tsx:20`) usa `h-screen overflow-hidden` (que ignora barras dinâmicas do iOS Safari vs `h-dvh`) e o container rolável (`28-34`) não inclui folga inferior para a `MobileNav` (`h-[72px] fixed bottom-0`), fazendo várias páginas (`customers`, `finance`, `promotions`, `academy`, `billing`) ficarem com o rodapé coberto pela barra.
  3. No `DashboardHeader` (`dashboard-header.tsx:192`), o popover de notificações usa `right-0 w-[340px] sm:w-[380px]` ancorado ao botão do sino (que fica à esquerda do botão de perfil). Em viewports `320px`–`390px`, o botão do sino tem direita em torno de `264px`–`319px` a partir da borda esquerda da tela, fazendo os `340px` com `right-0` vazarem entre `-21px` e `-76px` para fora da borda esquerda.
- **Correção recomendada:** Substituir `w-16` por `flex-1 min-w-0` nos links da `MobileNav`; adotar `h-dvh` e `pb-[calc(72px+env(safe-area-inset-bottom))] lg:pb-0` no container rolável de `DashboardLayoutClient` (removendo duplicidades quebradas); ancorar o popover de notificações com `fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:w-[380px]`.

### P0-07 — Texto branco sobre fundo branco nos cards mobile de `Cardápio` no Dark Mode
- **Severidade:** `P0`
- **Grupo / Rota:** Grupo C — `/dashboard/menu`
- **Arquivo:Linha:** `app/dashboard/menu/menu-client.tsx:2094`, `2103`, `2177`, `2210`, `2305`
- **Viewports afetados:** `320x568`, `360x640`, `375x812`, `390x844`, `430x932`, `667x375` (`< md`)
- **Tema:** Dark Mode
- **Causa raiz exata no código lido:** A lista de cards mobile (`md:hidden`) em `menu-client.tsx:2094` define `bg-white border border-[#E9E4D4]` sem variante `dark:bg-[#1B241E] dark:border-[#2A382E]`, enquanto os elementos filhos (`2177`, `2210`, `2305`) aplicam `dark:text-[#F2EFE9]`. No Dark Mode mobile, títulos, preços e rótulos em branco ficam renderizados sobre fundo branco, tornando o cardápio ilegível.
- **Correção recomendada:** Adicionar `dark:bg-[#1B241E] dark:border-[#2A382E]` no container `2094`, `dark:divide-[#2A382E]` em `2095` e `dark:bg-[#222C25]/40` no estado pausado `2103`.

### P0-08 — Dark Mode ilegível nos cards mobile de `Estoque` + scroll bloqueado corta itens em portrait e landscape
- **Severidade:** `P0`
- **Grupo / Rota:** Grupo C — `/dashboard/inventory`
- **Arquivo:Linha:** `app/dashboard/inventory/inventory-client.tsx:489`, `583`, `586`, `625`, `895`, `925`, `966`, `1017`, `1063`
- **Viewports afetados:** `320x568`, `360x640`, `375x812`, `390x844`, `430x932`, `667x375`, `844x390`
- **Tema:** Dark Mode (cards) / Ambos (corte de scroll)
- **Causa raiz exata no código lido:**
  1. Os cards mobile (`895`) e o accordion mobile `Alerta de reposição` (`1063`) usam `bg-white border border-[#E9E4D4]` sem `dark:bg-[#1B241E]`, enquanto textos internos (`925`, `966`, `1017`) usam `dark:text-[#F2EFE9]`, deixando o conteúdo branco sobre fundo branco no Dark Mode mobile.
  2. O wrapper raiz (`489`: `h-full max-h-full ... overflow-hidden`), o grid principal (`583`: `overflow-hidden`), a coluna esquerda (`586`) e a tabela desktop (`625`: `overflow-y-hidden`) bloqueiam rolagem vertical. Em telas curtas (`667x375`, `844x390` e até `320x568` com vários itens), a lista de insumos e o banner `Alerta de reposição` são cortados sem barra de rolagem.
- **Correção recomendada:** Adicionar `dark:bg-[#1B241E] dark:border-[#2A382E]` nas linhas `895` e `1063` (e `dark:text-[#F2EFE9]` em `1066`), e liberar rolagem vertical (`overflow-y-auto` em `489`/`583` no `< lg` e `overflow-y-auto` no wrapper da tabela `625`).

### P0-09 — Tooltip ilegível (`#2E4233` sobre `#2E4233`) no Light Mode + barra de ações do `Financeiro` estoura largura em todos os viewports portrait
- **Severidade:** `P0`
- **Grupo / Rota:** Grupo C — `/dashboard/finance`
- **Arquivo:Linha:** `app/dashboard/finance/finance-client.tsx:223-243`, `592`, `714`, `740`, `766`
- **Viewports afetados:** `320x568`, `360x640`, `375x812`, `390x844`, `430x932` (overflow do header); todos no Light Mode (tooltip)
- **Tema:** Light Mode (`HelpTooltip`) / Ambos (header)
- **Causa raiz exata no código lido:**
  1. Em `HelpTooltip` (`finance-client.tsx:223-243`), o popover tem `bg-[#2E4233] text-white ... dark:bg-[#FAF8F0] dark:text-[#1C2C22]`, mas os blocos internos da descrição e lista (`231` e `235`) usam `text-[#2E4233]` sem `dark:`: no Light Mode, texto `#2E4233` fica sobre fundo `#2E4233` (contraste 1:1, totalmente ilegível). Além disso, os tooltips com `w-72 sm:w-80` (`223`, `714`, `740`, `766`) vazam horizontalmente em `320px`.
  2. O grupo de ações do cabeçalho (`592`: `flex items-center gap-2.5` sem `flex-wrap`) alinha três botões largos (`Este mês`, `Fechamento de Caixa`, `Exportar relatório`, totalizando `~430px`) lado a lado, estourando horizontalmente todos os viewports portrait (`320px` a `430px`).
- **Correção recomendada:** Corrigir as classes do texto do tooltip para `text-white/90 dark:text-[#2E4233]` e borda `border-white/15 dark:border-[#E5DFD1]`, restringir a largura do tooltip a `max-w-[calc(100vw-2rem)]`, e aplicar `flex-wrap` na linha `592`.

### P0-10 — Tooltip ilegível no Light Mode + popover de calendário em `Relatórios` vaza horizontalmente e corta verticalmente
- **Severidade:** `P0`
- **Grupo / Rota:** Grupo C — `/dashboard/reports`
- **Arquivo:Linha:** `components/dashboard/reports/reports-view.tsx:101-114`, `815`, `881`
- **Viewports afetados:** `320x568`, `360x640` (estouro calendário), `320px–430px` (estouro tooltip `815`), `667x375`, `844x390` (corte altura calendário); Light Mode (`CardHelpTooltip`)
- **Tema:** Light Mode (`CardHelpTooltip`) / Ambos (calendário e tooltip)
- **Causa raiz exata no código lido:**
  1. `CardHelpTooltip` (`reports-view.tsx:101-114`) replica o mesmo erro de contraste: caixa `bg-[#2E4233]` no Light Mode com texto `text-[#2E4233]` nas linhas `105` e `109` (texto da mesma cor do fundo).
  2. O tooltip `?` principal (`815`) usa `left-0 w-80` (`320px`), vazando à direita em `320px`–`430px`.
  3. O dropdown do seletor de período (`881`) aplica `absolute top-full right-0 ... w-[330px] sm:w-[460px]`: em `320x568`, `330px` é maior que o próprio viewport, e em `360x640` a âncora `right-0` perto do centro-esquerda empurra parte do painel para fora da borda esquerda; em `667x375` e `844x390` landscape, a altura do calendário + atalhos excede `375px`/`390px` sem rolagem ou reposicionamento.
- **Correção recomendada:** Alterar `105` e `109` para `text-white/90 dark:text-[#2E4233]` e `border-white/15 dark:border-[#E5DFD1]`; tornar o calendário um modal/sheet responsivo em mobile (`fixed inset-x-3 top-20 max-h-[80dvh] overflow-y-auto sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:w-[460px]`).

### P0-11 — Contraste branco-sobre-creme em `Promoções`, tabela ilegível no Dark Mode e modal cortado em landscape/`320px`
- **Severidade:** `P0`
- **Grupo / Rota:** Grupo C — `/dashboard/marketing/promotions`
- **Arquivo:Linha:** `app/dashboard/marketing/promotions/promotions-client.tsx:814-816`, `918`, `934`, `973`, `999`, `1068`, `1261`
- **Viewports afetados:** `320x568` (modal footer overflow), `667x375`, `844x390` (modal cortado); Light e Dark Mode
- **Tema:** Light Mode (`816`) / Dark Mode (`918`, `999`, `1176-1293`) / Ambos (corte/overflow do modal)
- **Causa raiz exata no código lido:**
  1. No tooltip `?` de `Gestão de Promoções` (`814-816`), a caixa tem fundo claro fixo `bg-[#FAF8F0] text-[#1C2C22]` (sem `dark:`), porém o destaque na linha `816` usa `text-white dark:text-[#2E4233]`, deixando `"Gestão Centralizada:"` **branco sobre fundo creme `#FAF8F0` (invisível no Light Mode)**.
  2. Na tabela sobre `dark:bg-[#1B241E]` (`802`), o nome do produto (`918`: `text-[#1A241E]`) e o rótulo `"Ativa"` (`999`: `text-[#2E4233]`) não têm classes `dark:`, ficando escuros sobre fundo verde-escuro no Dark Mode (o mesmo ocorre em `934` e `973`).
  3. O modal `Preço Promocional` (`1068`) não tem `max-h-[90dvh] overflow-y-auto`, cortando cabeçalho e rodapé em `667x375` e `844x390` landscape; e o rodapé (`1261`: `flex items-center justify-between gap-2` sem `flex-wrap`) tenta acomodar Switch + `"Promoção ativa"` + `"Cancelar"` + `"Confirmar"` em uma única linha dentro de `288px` (`320px`), causando estouro horizontal.
- **Correção recomendada:** Corrigir linha `816` para `text-[#2E4233] dark:text-[#2E4233]` (ou alinhar tema do tooltip); adicionar `dark:text-[#F2EFE9]` / `dark:text-emerald-400` nas células `918–999`; aplicar `max-h-[90dvh] overflow-y-auto` no container do modal (`1068`) e `flex-wrap` no rodapé (`1261`).

### P0-12 — `FloatingActionBar` escondida atrás da `MobileNav` + estouramento do Drawer "Studio da Vitrine"
- **Severidade:** `P0`
- **Grupo / Rota:** Grupo C — `/dashboard/settings`
- **Arquivo:Linha:** `components/dashboard/settings/floating-action-bar.tsx:53`, `61`; `components/dashboard/sidebar.tsx:389`; `app/dashboard/settings/settings-client.tsx:652`, `677`; `components/dashboard/settings/storefront-phone-mockup.tsx:113`
- **Viewports afetados:** `320x568`, `360x640` (estouro da barra e do mockup), `375x812`, `390x844`, `430x932`, `667x375`, `844x390` (colisão `z-40` vs `z-50`)
- **Tema:** Ambos
- **Causa raiz exata no código lido:**
  1. `FloatingActionBar` (`floating-action-bar.tsx:53`) posiciona-se com `fixed bottom-6 left-1/2 -translate-x-1/2 ... z-40 ... max-w-[90vw]`. Como a `MobileNav` (`sidebar.tsx:389`) ocupa `h-[72px]` no fundo da tela com `z-50` em `< lg`, a barra flutuante de salvar/descartar fica **atrás** da navegação inferior (inacessível). Além disso, seu conteúdo em linha única com `whitespace-nowrap` (`61`: `"Alterações não salvas"` + `"Descartar"` + `"Salvar Alterações"`) ultrapassa `max-w-[90vw]` (`288px` em `320px`; `324px` em `360px`).
  2. No Drawer `Studio da Vitrine ao Vivo` (`settings-client.tsx:652, 677`), o painel usa `p-6` (`48px` horizontais) e renderiza `StorefrontPhoneMockup` com largura e altura rígidas `w-[340px] h-[690px]` (`storefront-phone-mockup.tsx:113`), exigindo `388px` de largura e estourando horizontalmente em `320px` e `360px` (além de exigir scroll constante em `568px`–`640px` e landscape).
- **Correção recomendada:** Posicionar a barra flutuante em `bottom-[calc(80px+env(safe-area-inset-bottom))] lg:bottom-6 z-[55]`, permitir `flex-wrap justify-between w-[calc(100vw-1.5rem)] sm:w-auto` no mobile; no Studio Drawer, usar `p-3 sm:p-6` e escalar o chassi com `max-w-full scale-[0.82] sm:scale-100 origin-top` em viewports estreitos/baixos.

---

## 4. Achados Altos — P1 (11)

### P1-01 — `Input` base provoca auto-zoom iOS em `844x390` landscape, `Button`/`Switch` abaixo de `36px` e `TikTokIcon` invisível em fundo escuro
- **Severidade:** `P1`
- **Grupo / Rota:** Grupo A — Componentes base (`components/ui/*`)
- **Arquivo:Linha:** `components/ui/input.tsx:11`; `components/ui/button.tsx:23-33`; `components/ui/switch.tsx:47`; `components/ui/social-icons.tsx:62`
- **Viewports afetados:** `844x390` (`Input` `md:text-sm`); todos os viewports touch (`Button`, `Switch`, `TikTokIcon`)
- **Tema:** Ambos (`Input`, `Button`, `Switch`) / Dark Mode (`TikTokIcon`)
- **Causa raiz exata no código lido:** `components/ui/input.tsx:11` define `text-base ... md:text-sm`, reduzindo a fonte para `14px` em `844x390` mobile landscape (`>= 768px`) e disparando auto-zoom do iOS Safari ao focar campos. `components/ui/button.tsx:23-33` define `default: "h-8"` (`32px`), `xs: "h-6"` (`24px`), `sm: "h-7"` (`28px`), `icon: "size-8"` (`32px`), `icon-xs: "size-6"` (`24px`) e `icon-sm: "size-7"` (`28px`). `components/ui/switch.tsx:47` tem `w-9 h-5` (`20px` de altura clicável, sem hitbox expandida). `components/ui/social-icons.tsx:62` usa `fill="#000000"` estático em `TikTokIcon`, perdendo contraste em superfícies escuras.
- **Correção recomendada:** Usar `text-base md:text-base lg:text-sm` (ou `pointer: coarse` com `16px`) em `input.tsx`, adotar `min-h-9` (`36px`) / `min-h-11` (`44px`) em variantes touch ou `lg` nos botões críticos, envolver `Switch` com `min-h-9` hit-target invisível (`::before`), e trocar `#000000` por `currentColor` em `TikTokIcon`.

### P1-02 — Auth/SSO em Light Mode fixo e botões `h-8` (`32px`) + `Input` `md:text-sm` nos fluxos de Onboarding e Criação/Setup de Loja
- **Severidade:** `P1`
- **Grupo / Rota:** Grupo A — `/sign-in`, `/sign-up`, `/sso-callback`, `/onboarding`, `/dashboard/stores/new`, `/dashboard/stores/[storeId]/setup`
- **Arquivo:Linha:** `components/AuthLayout.tsx:41`, `100`; `app/sso-callback/page.tsx:5`; `app/globals.css:232-233`; `app/onboarding/page.tsx:43`, `70`; `app/onboarding/automatic-provisioning.tsx:87`; `app/dashboard/stores/new/page.tsx:70`; `app/dashboard/stores/new/new-store-form.tsx:86`, `110`, `159`, `168`; `app/dashboard/stores/[storeId]/setup/page.tsx:96`; `app/dashboard/stores/[storeId]/setup/store-setup-form.tsx:105`, `123`, `161`
- **Viewports afetados:** `320x568` (`OrganizationList` em `px-6`), `844x390` (`Input` `md:text-sm`), todos para botões `32px` e tema fixo
- **Tema:** Dark Mode (Auth/SSO) / Ambos (inputs e touch targets)
- **Causa raiz exata no código lido:** `AuthLayout.tsx:41, 100` e `sso-callback/page.tsx:5` fixam `bg-[#2B5C60] md:bg-[#F6F5F2]` e `bg-[#F6F5F2]` sem classes `dark:`, `.cl-footer * { color: #666 !important; }` reduz contraste em rodapés Clerk, e inputs do Clerk não garantem `16px`. Nos formulários de onboarding/criação/setup de loja, todos os `<Input>` herdam `md:text-sm` (`14px` em `844x390`), e os CTAs com `buttonVariants({ variant: "outline" })` ou `<Button>` padrão herdam `h-8` (`32px < 36px`). Em `app/onboarding/page.tsx:28, 43`, `px-6` reduz a área do `<OrganizationList />` para `272px` em `320px`.
- **Correção recomendada:** Usar tokens de tema (`bg-background` / `dark:`) em Auth/SSO, aplicar `size: "lg"` (`36px`) ou `min-h-10` nos links/botões de ação, ajustar `px-4 sm:px-6` em `onboarding/page.tsx` e aplicar `16px` nos inputs.

### P1-03 — `MobileCartBar` sem safe-area e oculta em `844x390`, busca do cardápio com zoom iOS e touch targets `< 36px`/`< 44px` no Storefront
- **Severidade:** `P1`
- **Grupo / Rota:** Grupo B — `/[storeSlug]` (`StorefrontHeader`, `CategoryFilterBar`, `ProductCard`, `CombosSection`, `MobileCartBar`, `CartDrawer`)
- **Arquivo:Linha:** `components/storefront/mobile-cart-bar.tsx:21`; `components/storefront/storefront-header.tsx:79`; `components/storefront/category-filter-bar.tsx:23`, `54`; `components/storefront/product-card.tsx:173`; `components/storefront/combos-section.tsx:80`; `components/storefront/cart-drawer.tsx:47`, `140-156`, `169`
- **Viewports afetados:** `320x568`–`430x932`, `667x375`, `844x390`
- **Tema:** Ambos
- **Causa raiz exata no código lido:**
  - `MobileCartBar` (`mobile-cart-bar.tsx:21`) usa `fixed bottom-4 z-40 md:hidden`: fica sem `env(safe-area-inset-bottom)` sobre o indicador home do iOS e desaparece em `844x390` landscape (`>= md`).
  - No `StorefrontHeader` mobile (`storefront-header.tsx:79`), o botão do carrinho tem `p-1.5` ao redor de `h-5 w-5` (`~32x32px < 44px` exigido para barra de navegação principal), assim como os demais controles compactos do header (`storefront-theme-toggle.tsx` e `merchant-back-button.tsx`).
  - `CategoryFilterBar` (`category-filter-bar.tsx:54`) aplica `text-sm` (`14px`) no `<input id="search-input">`, causando auto-zoom iOS, e fixa `top-[57px]` (`23`).
  - `ProductCard` (`product-card.tsx:173`: `h-7 w-7`, `28px`), `CombosSection` (`combos-section.tsx:80`: `h-8 w-8`, `32px`) e `CartDrawer` (`cart-drawer.tsx:47`: `h-8 w-8` fechar; `140-156`: steppers `-`/`+` e lixeira com ícones de `12px–16px` sem padding mínimo `36px`; `169`: footer sem `pb-safe`) violam tamanho mínimo de alvo de toque e safe-area.
- **Correção recomendada:** Usar `bottom-[max(1rem,env(safe-area-inset-bottom))]` na `MobileCartBar`; elevar botões do header mobile para `min-h-11 min-w-11` (`44px`); mudar input de busca para `text-base lg:text-sm`; elevar steppers e botões `+`/fechar para mínimo `h-9 w-9` (`36px`) e aplicar `pb-safe` no rodapé do `CartDrawer`.

### P1-04 — Modais de Entrega, Favoritos e Rastreio cortam em landscape (`667x375`, `844x390`), dão zoom iOS no CEP e quebram Dark Mode
- **Severidade:** `P1`
- **Grupo / Rota:** Grupo B — `/[storeSlug]` (`DeliveryInfoModal`, `FavoritesModal`, `OrderTrackingModal`)
- **Arquivo:Linha:** `components/storefront/delivery-info-modal.tsx:29`, `41`, `49`, `51`, `59`, `72-89`; `components/storefront/favorites-modal.tsx:32`, `43`, `50`, `71`; `components/storefront/order-tracking-modal.tsx:51`, `64`, `71`
- **Viewports afetados:** `667x375`, `844x390` (corte landscape); todos touch (CEP `text-sm` e fechar `32px`); `320x568` (form CEP + Verificar); Dark Mode
- **Tema:** Dark Mode (`delivery-info-modal`, `favorites-modal`) / Ambos (dimensões e inputs)
- **Causa raiz exata no código lido:** Nos três modais, o container externo (`delivery-info-modal.tsx:29`, `favorites-modal.tsx:32`, `order-tracking-modal.tsx:51`) não possui `max-h-[90dvh] flex flex-col`: apenas a área de conteúdo interna usa `max-h-[80vh]` ou `max-h-[75vh]`. Somando o header (`~70px`) e `p-4` do backdrop, a altura ultrapassa `375px`/`390px` em landscape, cortando partes do modal. Em `delivery-info-modal.tsx:59`, o `<input>` de CEP usa `text-sm` (`14px`, auto-zoom iOS); os botões fechar (`41`, `43`, `64`) são `h-8 w-8` (`32px`); o card de resultado (`72-89`: `bg-[#F2F9F4] text-[#1C482A]`) e o selo `"✓ Entregue com sucesso"` (`favorites-modal.tsx:71`: `text-[#2E6B3E]`) não têm classes `dark:`.
- **Correção recomendada:** Aplicar `max-h-[90dvh] flex flex-col` no container raiz de cada modal (com body `flex-1 overflow-y-auto` sem `max-h` conflitante), alterar o input de CEP para `text-base lg:text-sm`, aumentar botões fechar para `h-9 w-9` e adicionar variantes `dark:` nos cards verdes.

### P1-05 — Checkout, Tela de Confirmação, Loja Fechada e Tracking com zoom iOS, falta de safe-area e aperto em `320px`
- **Severidade:** `P1`
- **Grupo / Rota:** Grupo B — `/[storeSlug]` e `/[storeSlug]/pedido/[id]`
- **Arquivo:Linha:** `components/storefront/checkout-client-data-modal.tsx:254`, `320`, `433`, `715-719`; `components/storefront/order-confirmed-screen.tsx:45`, `180-202`; `components/storefront/store-closed-screen.tsx:8`, `11-22`; `app/[storeSlug]/pedido/[id]/order-live-tracker.tsx:150`, `154`
- **Viewports afetados:** `320x568`, `360x640`, `375x812`, `390x844`, `430x932`, `667x375`, `844x390`
- **Tema:** Ambos (`order-confirmed-screen` tem também `text-[#59615B]` sem `dark:`)
- **Causa raiz exata no código lido:**
  - `CheckoutClientDataModal` utiliza `text-sm` (`14px`) nos inputs/selects do formulário de cliente, endereço e cupom (disparando zoom no iOS), steppers `-`/`+` de quantidade com `~22px`, botão fechar `h-8 w-8` (`254`), modo fullscreen mobile sem `pt-safe`/`pb-safe`, e aperto horizontal em `320px` no badge `"WhatsApp verificado"` (`320-327`), na grade `grid-cols-2` Delivery/Retirada (`433`) e na linha `"Cartão na maquininha"` + `<CardBrandsGroup />` (`715-719`) por falta de `flex-wrap`.
  - `OrderConfirmedScreen` (`45`: `h-full ... md:max-h-[92vh]`) não aplica `pt-safe`/`pb-safe` no mobile fullscreen e comprime o card de suporte WhatsApp (`180-202`, `flex items-center justify-between` sem `flex-wrap`) em `320px`.
  - `StoreClosedScreen` (`11-22`) alinha elementos no cabeçalho sem `flex-wrap`, estourando `320px`, e usa `min-h-screen`.
  - `OrderLiveTracker` (`150, 154`) usa `min-h-screen` e link de retorno ao cardápio abaixo de `44px`.
- **Correção recomendada:** Padronizar inputs/selects do checkout em `text-base lg:text-sm`, adicionar `pt-safe`/`pb-safe` nos containers fullscreen mobile, `flex-wrap` nos cabeçalhos/linhas críticas em `320px`, `min-h-dvh` e elevar steppers/botões para `>= 36px` (`>= 44px` no retorno de navegação).

### P1-06 — `ProductDetailModal` com múltiplos inputs `< 16px`, steppers minúsculos (`16px–28px`) e footer sem `pb-safe`
- **Severidade:** `P1`
- **Grupo / Rota:** Grupo B — `/[storeSlug]` (Modal de Produto)
- **Arquivo:Linha:** `components/storefront/product-detail-modal.tsx:328`, `435`, `498`, `512`, `532`, `542`, `789`, `800`, `883`, `945`, `959`, `979`, `989`, `1027`, `1035`
- **Viewports afetados:** `320x568`–`430x932`, `667x375`, `844x390`
- **Tema:** Ambos
- **Causa raiz exata no código lido:** O campo de busca de bebidas usa `text-xs` (`12px` em `435` e `883`) e a textarea de observações usa `text-sm` (`14px` em `1027`), ambos abaixo de `16px` (causando zoom automático no iOS Safari). Os controles interativos críticos estão severamente abaixo de `36px`: steppers `-`/`+` das bebidas (`16px`, linhas `498`, `512`, `945`, `959`), botões de paginação de bebidas (`24px`, linhas `532`, `542`, `979`, `989`), controle principal de quantidade (`28px`, linhas `789`, `800`), setas da galeria (`28px`) e fechar (`h-8 w-8`, `328`). O rodapé fixo (`1035`) não aplica `pb-safe`.
- **Correção recomendada:** Alterar busca e textarea para `text-base lg:text-sm`; reestruturar steppers/paginação/quantidade/fechar com `min-h-9 min-w-9` (`36px`); adicionar `pb-[calc(0.75rem+env(safe-area-inset-bottom))]` no footer (`1035`).

### P1-07 — Módulo `Pedidos` & PDV sem cards mobile, `tableAreaRef` quebrado em landscape, zoom iOS, `z-index` em conflito e modais sem Dark Mode
- **Severidade:** `P1`
- **Grupo / Rota:** Grupo C — `/dashboard/orders`
- **Arquivo:Linha:** `app/dashboard/orders/orders-client.tsx:1388`, `1403`, `1440`, `1442`, `2177`, `2343`, `2406`, `2525`; `app/dashboard/orders/manual-order-modal.tsx`
- **Viewports afetados:** `320x568`–`430x932`, `667x375`, `844x390`
- **Tema:** Dark Mode (`2177`, `2343`, `2406`, `2525`) / Ambos (layout, zoom, touch)
- **Causa raiz exata no código lido:**
  - `orders-client.tsx:1388, 1440, 1442` trava altura com `h-full overflow-hidden`, enquanto `tableAreaRef` recalcula linhas visíveis com base na altura remanescente — em `667x375` e `844x390` landscape, sobram poucas dezenas de pixels úteis abaixo do cabeçalho/filtros. A tabela de 8 colunas depende só de `overflow-x-auto` sem visão em cards mobile; ações na tabela usam `py-1` (`~24px`), selects/inputs usam `text-xs` (zoom iOS), tooltip `?` usa `w-80` (`1403`) estourando `320px`, drawer de detalhes no mobile disputa `z-50` com `MobileNav`, e modais de Cancelamento (`2343`), Impressão (`2406`), Edição (`2525`) e pill de pagamento (`2177`) usam fundo/texto claros fixos sem `dark:`.
  - No `ManualOrderModal` (`app/dashboard/orders/manual-order-modal.tsx`), inputs e `<select>` usam `text-xs` / `text-[11px]` (auto-zoom iOS), steppers de quantidade medem `w-6 h-6` (`24px`), botão de remover usa `p-1` e o rodapé sofre aperto/corte horizontal em `320px`.
- **Correção recomendada:** Adicionar cards mobile em `< md` e liberar rolagem em viewports com `max-height <= 500px`; elevar drawer para `z-[60]`; padronizar inputs/selects em `text-base lg:text-sm` (`text-base lg:text-xs`), touch targets `>= 36px` e suporte `dark:` completo nos modais do fluxo de pedidos e PDV.

### P1-08 — Módulo `Cardápio`: compressão em landscape, modais sem `max-h-[90dvh]` / Dark Mode, estouro em `320px` e alvos `< 36px`
- **Severidade:** `P1`
- **Grupo / Rota:** Grupo C — `/dashboard/menu`
- **Arquivo:Linha:** `app/dashboard/menu/menu-client.tsx:589-597`, `1537`, `1557`, `1696`, `1931`, `2080`, `2248`, `2316-2337`, `2358`, `2373`, `2694`, `2746`, `2805`, `2985`, `3156`, `3437`, `3483`, `3539`, `3702`, `3750`, `3765`, `3935`, `4062`
- **Viewports afetados:** `320x568`, `360x640`, `667x375`, `844x390`, `375x812`–`430x932`
- **Tema:** Dark Mode (modais) / Ambos (altura, overflow, zoom, touch)
- **Causa raiz exata no código lido:** `1537` trava altura com `h-full max-h-full overflow-hidden`, reduzindo a área dos cards/tabela para `~116px–131px` em `667x375` e `844x390` landscape. Os modais `Trocar Imagem` (`2805`), `Preço Promocional` (`3539`) e `Tour Prompt` (`3935`) não possuem `max-h-[90dvh] overflow-y-auto`, cortando botões de salvar/confirmar em `375px`/`390px` de altura; o rodapé promocional (`3702`) sem `flex-wrap` estoura `320px`; o Spotlight Tour (`589-597`, `4062`) não tem `max-h-[calc(100dvh-2rem)] overflow-y-auto` em landscape; múltiplos modais (`2373`, `2694`, `2805`, `2985`, `3156`, `3483`, `3539`, `3935`) fixam `bg-white` sem `dark:`; buscas e inputs inline/modal (`1696`, `1931`, `2248`) usam `< 16px` (zoom iOS); ações de card e paginação (`2080`, `2316-2337`, `2358`, `3437`) ficam abaixo de `36px`.
- **Correção recomendada:** Liberar `overflow-y-auto` em alturas baixas (`max-h-[90dvh] overflow-y-auto` em todos os modais + `flex-wrap` no footer `3702`), aplicar tema `dark:` em todos os modais e inputs, usar `text-base lg:text-xs` em inputs e garantir `min-h-9` (`36px`) nos controles dos cards e paginação.

### P1-09 — `Financeiro` e `Fechamento de Caixa`: sem `pb-24`, cards/modais sem Dark Mode, modais sem `90dvh`, zoom iOS e footer cortado
- **Severidade:** `P1`
- **Grupo / Rota:** Grupo C — `/dashboard/finance`
- **Arquivo:Linha:** `app/dashboard/finance/finance-client.tsx:550`, `605`, `618`, `993`, `1053`, `1291-1365`, `1368`, `1394`, `1440-1662`; `app/dashboard/finance/shift-closing-modal.tsx`
- **Viewports afetados:** `320x568`–`430x932`, `667x375`, `844x390`
- **Tema:** Dark Mode (`605`, `618`, `1053`, `1291-1365`, `1440-1662`) / Ambos (scroll, modais, zoom, touch)
- **Causa raiz exata no código lido:**
  - `finance-client.tsx:550` usa `pb-3` sem `max-lg:pb-[84px]`, deixando a paginação inferior (`1368`) encoberta pela `MobileNav`. Não há nenhuma classe `dark:` nos cards mobile de transação (`1291-1365`), no total central do gráfico donut (`1053`: `text-[#1C201A]`), no dropdown de período (`605`, `618`) nem nos modais de Taxas e Detalhe do Pedido (`1440-1662`), além desses modais não aplicarem `max-h-[90dvh] flex flex-col` (cortam em `667x375`/`844x390`). Inputs usam `text-xs`/`text-sm` (zoom iOS), e os botões `"Configurar taxas"` (`993`: `p-0`) e paginação (`1394`: `w-6.5 h-6.5`) ficam `< 36px`.
  - No `ShiftClosingModal` (`shift-closing-modal.tsx`), inputs numéricos usam `text-xs` (zoom iOS), o grid `grid-cols-3` de cards de pagamento comprime valores em `320px`, e o rodapé sem `flex-wrap` corta o botão `"Imprimir Fechamento (80mm)"` em `320px` e `360px`.
- **Correção recomendada:** Adicionar `max-lg:pb-[84px]`, variantes `dark:` completas em cards mobile, donut, dropdown e modais, adicionar `max-h-[90dvh] overflow-y-auto` nos modais, `grid-cols-1 sm:grid-cols-3` + `flex-wrap` no `ShiftClosingModal`, `text-base lg:text-xs` nos inputs e `min-h-9` nos controles de ação.

### P1-10 — `Clientes`, modais de `Estoque` e tabela/modal de `Promoções`: falta de `pb-24`, tabelas sem cards, `DatePicker` estourando e zoom iOS
- **Severidade:** `P1`
- **Grupo / Rota:** Grupo C — `/dashboard/customers`, `/dashboard/inventory`, `/dashboard/marketing/promotions`
- **Arquivo:Linha:** `app/dashboard/customers/customers-client.tsx:203`, `276`; `app/dashboard/inventory/inventory-client.tsx:1158`, `1358`, `1371`, `1471`, `1523`, `1599`, `1652`; `app/dashboard/marketing/promotions/promotions-client.tsx:206`, `219`, `273`, `489`, `598`, `619`, `660`, `726`, `761`, `784`, `873`, `1012`, `1038`, `1120`, `1164-1293`
- **Viewports afetados:** `320x568`–`430x932`, `667x375`, `844x390`
- **Tema:** Dark Mode (modais Estoque, `DeliPlusDatePicker` e metade inferior do modal de Promoções) / Ambos (scroll, tabelas, zoom, touch)
- **Causa raiz exata no código lido:**
  - `CustomersClient`: `203` omite `pb-24 lg:pb-8` (conteúdo final oculto atrás da `MobileNav`), input de busca (`276`) usa `text-xs` (zoom iOS), tabela de 7 colunas não tem visão em cards mobile e botão de WhatsApp tem `~24px` de altura.
  - `InventoryClient`: modais (`1158`, `1358`, `1599`, `1652`) têm fundo claro fixo sem `dark:`, modais de exclusão não limitam `max-h-[90dvh]`, inputs/selects usam `text-xs`/`text-sm` (zoom iOS), o tooltip `w-[270px]` (`1371`) estoura em `320px`, e a Lista de Compras (`1471`, `1523`) aperta nomes em `320px` com botões `py-1.5` (`< 36px`).
  - `PromotionsClient`: `489` omite `pb-24 lg:pb-8`; cards de Maior/Menor Saída (`598`, `619`, `726`) esmagam preços sem `flex-wrap` em `320px` e `Ajustar Oferta` (`761`: `py-1.5`) e paginações (`660`, `784`, `1038`: `w-7 h-7`) ficam `< 36px`; tabela de 9 colunas (`873`) não tem cards mobile e `"Editar Promoção"` (`1012`) é texto corrido (`~16px` altura); no modal de promoção, comparativo de preços (`1120`) aperta `320px`, controles da parte inferior/footer (`1176-1293`) usam `text-gray-700`/`bg-[#FAF8F0]` sem `dark:`, e o `DeliPlusDatePicker` (`206`, `219`, `266`) abre popover `w-[250px] left-0` dentro da segunda coluna do `grid-cols-2` (`1218`), vazando para fora da tela à direita, além de dias `h-7 w-7` (`28px`) e botão trigger `text-xs`.
- **Correção recomendada:** Aplicar `pb-24 lg:pb-8` (ou padronizar no layout pai); criar cards mobile para Clientes e Promoções; ancorar o segundo `DeliPlusDatePicker` à direita (`right-0 sm:left-0`) com dias `h-9 w-9` e `dark:`; padronizar inputs/selects `>= 16px` e adicionar `dark:` + `max-h-[90dvh] overflow-y-auto` nos modais.

### P1-11 — `Configurações` e `Assinatura (Billing)`: zoom iOS, toggles `< 36px`, cards comprimidos em `844x390` landscape e colisão com `MobileNav`
- **Severidade:** `P1`
- **Grupo / Rota:** Grupo C — `/dashboard/settings`, `/dashboard/billing`, `/dashboard/billing/success`
- **Arquivo:Linha:** `app/dashboard/settings/page.tsx:56`, `94`; `app/dashboard/settings/settings-client.tsx:475`, `500`; `components/dashboard/settings/sections/profile-brand-section.tsx:189`; `components/dashboard/settings/sections/delivery-fees-section.tsx:406`; `components/dashboard/settings/payment-method-card.tsx`; `components/dashboard/settings/weekly-schedule-manager.tsx`; `components/dashboard/settings/sections/kitchen-printer-section.tsx`; `app/dashboard/billing/page.tsx:97-109`, `164-165`; `app/dashboard/billing/billing-status.tsx:26`, `31`, `37`; `app/dashboard/billing/checkout-form.tsx:35`, `64`; `app/dashboard/billing/subscription-management-form.tsx:205`, `226`, `301`; `app/dashboard/billing/success/page.tsx:30`
- **Viewports afetados:** `320x568`–`430x932`, `667x375`, `844x390`
- **Tema:** Dark Mode (`settings/page.tsx:56, 94`) / Ambos (layout, zoom, touch)
- **Causa raiz exata no código lido:**
  - Em **Configurações**, títulos/ações do cabeçalho (`settings-client.tsx:475, 500`) apertam em `320px` por falta de `flex-wrap`; campos de formulário, horários e taxas usam `text-xs` (auto-zoom iOS); toggles customizados medem `20px–24px` (`w-10 h-6`, `w-9 h-5`, `w-8 h-5`); tabela de zonas de entrega (`delivery-fees-section.tsx:406`) tem 5 colunas sem cards mobile; remoção do logo (`profile-brand-section.tsx:189`) depende de `hover` (invisível no touch); estados vazios de `settings/page.tsx:56, 94` fixam fundo claro.
  - Em **Billing**, `pb-12` + `py-6` (`billing/page.tsx:164`) soma `72px` inferiores, encostando na `MobileNav` (`h-[72px]`), e `billing/success/page.tsx:30` não tem `pb-24` em `667x375`/`844x390` landscape; `md:grid-cols-3` (`checkout-form.tsx:35`, `subscription-management-form.tsx:226`) ativa 3 colunas já em `844x390` landscape (`~252px` cada), onde badges `"Plano atual"` + `"Mais Popular"` (`97-109`) e botões com `whitespace-nowrap` (`button.tsx:7`, `subscription-management-form.tsx:301`: `"Agendar downgrade para Essencial"` / `"Continuar no plano atual"`) sofrem aperto/estouro horizontal; botões `outline` sem `size="lg"` (`billing-status.tsx:26, 31, 37`, `checkout-form.tsx:64`, `subscription-management-form.tsx:205`) ficam em `h-8` (`32px < 36px`).
- **Correção recomendada:** Usar `lg:grid-cols-3` nos cards de planos e `pb-24 lg:pb-12` em Billing; elevar botões `outline` para `size="lg"` (`>= 36px`); aplicar `flex-wrap`, `text-base lg:text-xs`, cards mobile para zonas e botão touch visível para apagar logo em Settings.

---

## 5. Achados Médios / Polimento — P2 (5)

### P2-01 — Ocultação global de scrollbars suprime pistas visuais em carrosséis mobile
- **Severidade:** `P2`
- **Grupo / Rota:** Grupo A — Global (`app/globals.css`)
- **Arquivo:Linha:** `app/globals.css:315-324`
- **Viewports afetados:** `320x568`–`430x932`, `667x375`, `844x390`
- **Tema:** Ambos
- **Causa raiz exata no código lido:** `app/globals.css:315-324` aplica `scrollbar-width: none` globalmente, removendo indicadores visuais de rolagem horizontal em barras de categorias e filtros sem fade/indicadores compensatórios no mobile.
- **Correção recomendada:** Restringir a ocultação de scrollbar a containers que possuam gradientes de fade/setas indicativas explícitas.

### P2-02 — Truncamento precoce no `StorefrontHeader` e `StoreHero` em portrait + `grid-cols-2` estreito em `320px`
- **Severidade:** `P2`
- **Grupo / Rota:** Grupo B — `/[storeSlug]` (`StorefrontHeader`, `StoreHero`)
- **Arquivo:Linha:** `components/storefront/storefront-header.tsx:66`; `components/storefront/store-hero.tsx:195`, `254`, `270`, `279`
- **Viewports afetados:** `320x568` (botão endereço `max-w-xs` e `grid-cols-2`), `375x812`–`430x932` (`max-w-[180px]` e `truncate`)
- **Tema:** Ambos / Dark Mode (`TikTokIcon` em `store-hero.tsx:279`)
- **Causa raiz exata no código lido:** `storefront-header.tsx:66` limita o nome da loja no mobile a `max-w-[180px]`, subaproveitando largura em `390px` e `430px`. `store-hero.tsx:195` trunca o `<h1>` em uma única linha (`truncate`), `254` aplica `max-w-xs` (`320px`) dentro do texto do botão de endereço em containers menores que `320px` (devido ao padding horizontal), `270` usa `grid-cols-2` que esmaga labels sociais em `320px`, e `279` exibe `TikTokIcon` escuro em card dark.
- **Correção recomendada:** Usar `flex-1 min-w-0 truncate` no título do header mobile; permitir `line-clamp-2` no `<h1>` da loja; aplicar `max-w-full min-w-0` no botão de endereço; mudar canais sociais para `grid-cols-1 min-[360px]:grid-cols-2`.

### P2-03 — Tooltips `?` apenas `hover` no touch, toasts desalinhados e rótulo `+ Novo item` oculto em `< md`
- **Severidade:** `P2`
- **Grupo / Rota:** Grupo C — `/dashboard/menu`, `/dashboard/marketing/promotions`, `/dashboard/inventory`, `/dashboard/settings`, `/dashboard/orders`, `/dashboard/reports`
- **Arquivo:Linha:** `app/dashboard/menu/menu-client.tsx:1557`, `1699`, `3765`; `app/dashboard/marketing/promotions/promotions-client.tsx:493`, `513`, `557`, `687`, `1081`, `1184`; `app/dashboard/inventory/inventory-client.tsx:501`; `app/dashboard/orders/orders-client.tsx:1403`; `app/dashboard/settings/settings-client.tsx:457`
- **Viewports afetados:** `320x568`–`430x932`, `667x375`, `844x390`
- **Tema:** Ambos
- **Causa raiz exata no código lido:** Quase todos os popovers de ajuda `?` no dashboard dependem exclusivamente de `group-hover` com `pointer-events-none` e largura fixa `w-80` (`320px`), inacessíveis de forma previsível em dispositivos touch e vazando horizontalmente em `320px`–`360px`. Em `menu-client.tsx:1699`, o botão principal esconde o texto `"Novo item"` em `< md` (deixando só `+`). Em `promotions-client.tsx:493`, o toast `fixed bottom-6 right-6` sobrepõe a `MobileNav`, e em `settings-client.tsx:457` falta `max-w-[calc(100vw-2.5rem)]`.
- **Correção recomendada:** Converter tooltips `?` em popover acessível por clique/toque com `w-[min(20rem,calc(100vw-2rem))]`; reposicionar toasts do bottom para `bottom-24 lg:bottom-6`; exibir rótulo curto no botão de criação no Cardápio.

### P2-04 — Dark Mode incompleto em `Relatórios` e interações de gráfico `< 36px` / hover-only
- **Severidade:** `P2`
- **Grupo / Rota:** Grupo C — `/dashboard/reports`
- **Arquivo:Linha:** `components/dashboard/reports/reports-view.tsx:1182`, `1428`, `1503`, `1640`, `1649`, `1681`, `1712`, `1770`, `1783-1806`
- **Viewports afetados:** `320x568`–`430x932`, `667x375`, `844x390`
- **Tema:** Dark Mode (textos de canais/recompra) / Ambos (gráficos e alvos)
- **Causa raiz exata no código lido:** Textos das seções de canais e recompra (`1640`, `1649`, `1681`, `1712`, `1770`, `1783-1806`) omitem classes `dark:` dentro de cards `dark:bg-[#1B241E]`, reduzindo legibilidade no tema escuro. O gráfico de linhas (`1182`) exibe valores apenas via hover sem suporte a toque/tap; pílulas dos dias (`1428`: `py-0.5`) e áreas clicáveis das barras (`1503`: `~10px` de largura) ficam abaixo de `36px`.
- **Correção recomendada:** Adicionar `dark:text-[#F2EFE9]` / `dark:text-[#9CA79E]` nos cards finais, suportar seleção por toque nos pontos/barras e ampliar área clicável dos seletores de dia para `min-h-9`.

### P2-05 — `Academia`, `Equipe`, `DashboardHeader` e fallback de `Promoções`: folga inferior, ícones achatados, `p-20` e touch `36px` em header
- **Severidade:** `P2`
- **Grupo / Rota:** Grupo C — `/dashboard/marketing/academy`, `/dashboard/team`, `/dashboard/marketing/promotions`, Shell (`DashboardHeader`)
- **Arquivo:Linha:** `app/dashboard/marketing/academy/academy-client.tsx:103`, `139`, `219`, `289`, `390`, `433`, `458`, `482`, `530`, `569`, `573`; `app/dashboard/team/page.tsx:1`; `components/dashboard/dashboard-header.tsx:135`, `175`, `287`; `app/dashboard/marketing/promotions/page.tsx:215`
- **Viewports afetados:** `320x568`–`430x932`, `667x375`, `844x390`
- **Tema:** Ambos / Dark Mode (`promotions/page.tsx:215`)
- **Causa raiz exata no código lido:**
  - `AcademyClient` (`academy-client.tsx:103`) não reserva `pb-24 lg:pb-8` para a `MobileNav`; ícones `w-12 h-12` nos módulos (`219`, `289`, `390`, `458`, `530`) não têm `shrink-0`, achatando horizontalmente ao lado de títulos longos em `320px`; o bloco CTA do Módulo 3 (`433`), o cabeçalho dos scripts de WhatsApp (`482`) e as linhas comparativas de economia (`569`, `573`) apertam em `320px` por falta de `flex-wrap`/`flex-col sm:flex-row`; abas de navegação (`139`) medem `~36px` (ideal `>= 44px`).
  - `app/dashboard/team/page.tsx:1` aplica `p-20` (`160px` horizontais), sobrando `160px` para `"Em construção"` em `text-3xl` no viewport `320x568`.
  - `DashboardHeader` (`dashboard-header.tsx:135, 175`) define botões de tema e notificações com `w-9 h-9` (`36px < 44px` para navegação principal no topo), além de ocultar o atalho `"Ver Loja"` em `< sm` (`287`, ainda acessível via menu do perfil).
  - `app/dashboard/marketing/promotions/page.tsx:215` renderiza fallback `<Suspense>` com `bg-[#F7F6F2]` fixo sem `dark:bg-[#131A15]`.
- **Correção recomendada:** Aplicar `pb-24 lg:pb-8` e `shrink-0` + `flex-wrap` na `AcademyClient`; trocar `p-20` por `p-6 sm:p-20` em `team/page.tsx`; elevar botões do `DashboardHeader` mobile para `w-11 h-11 sm:w-10 sm:h-10`; adicionar classes `dark:` no fallback de `promotions/page.tsx`.
