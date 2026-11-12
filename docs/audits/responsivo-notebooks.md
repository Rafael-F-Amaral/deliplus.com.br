# Auditoria de Responsividade — Tablets & Notebooks (`768px`–`1440px`)

**Agente:** `notebook-specialist` (Fase 1 — Read-only no código fonte)  
**Viewports alvo:** `768x1024`, `820x1180`, `1024x768`, `1280x720`, `1280x800`, `1366x768`, `1440x900`  
**Focos técnicos:**  
1. Transição `md:` (`768px`) → `lg:` (`1024px`) → `xl:` (`1280px`), largura útil ao lado da sidebar (`260px`) e grids/drawers comprimidos.  
2. Altura útil curta (`720px` e `768px`), travas `h-screen` / `max-h-full` / `overflow-hidden` / `overflow-y-hidden` e modais/lightboxes cortados.  
3. Tabelas, paginações e toolbars em `1024px`–`1366px`.  
4. Ergonomia Hover vs Touch/Teclado em tablets (`?` tooltips, ações hover-only) e ocultação global de scrollbars (`* { scrollbar-width: none !important }`).  
5. Contraste e integridade visual em **Light Mode** e **Dark Mode**.

---

## 1. Resumo Executivo por Severidade

| Severidade | Quantidade | Impacto Principal |
| --- | ---: | --- |
| **P0 (Crítico)** | **10** | Travamento/corte de tabelas em altura `720px`/`768px` (Financeiro, Estoque, Pedidos), texto invisível em tooltips/modais (`#2E4233` sobre `#2E4233`, branco sobre `#FAF8F0`, `dark:text-[#F2EFE9]` sobre `bg-white`), lightbox de produto cortando botões de navegação, overflow horizontal de CEP em `1024x768`, truncamento de botões de planos em Billing e modal de Promoções sem `max-h` + metade inferior clara no Dark Mode. |
| **P1 (Alto)** | **12** | Sidebar fixa de `260px` não retrátil + ocultação global de scrollbars em `globals.css`, `FloatingActionBar` colidindo com `MobileNav` em `768px`/`820px`, tooltips `?` e lixeira inacessíveis no touch, painel `Reposição` (`300px`) esmagando Estoque em `1024x768`, grids comprimidos e falhas Dark Mode em Relatórios, Financeiro, 7 modais de Cardápio, Pedidos, `CoverPhotoPickerModal`, Storefront (`CategoryFilterBar` + checkout + 3 modais) e fluxo Auth/SSO sem `dark:`. |
| **P2 (Médio)** | **5** | Switches ativos `#2E4233` pouco visíveis em cards escuros, colisão de paginação `absolute left-6` com botões em `1024x768`, bloqueio de zoom (`maximumScale: 1, userScalable: false`), ausência de atalhos operacionais no tablet `< 1024px` (`MobileNav` / `DashboardHeader`) e barra de módulos da Academy sem indicador de rolagem. |
| **Total** | **27** | **27 achados verificados diretamente no código fonte ativo.** |

### Mapa Rápido de Risco por Viewport

- **`768x1024` e `820x1180` (Tablets em retrato):** Uso ativo da `MobileNav` fixa (`h-[72px] lg:hidden`), porém falta `max-lg:pb-[84px]` global em `<main>` e `FloatingActionBar` (`bottom-6 z-40`) sobrepõe a `MobileNav` (`z-30`). Checkout (`md:grid-cols-12`) e Billing (`md:grid-cols-3`) esmagam cards e formulários. Tooltips `?` e ações `group-hover` não funcionam em touch, e `userScalable: false` bloqueia zoom.
- **`1024x768` (iPad Pro landscape / Notebook compacto):** Ponto de ruptura mais crítico do dashboard. A sidebar entra fixa em `w-[260px]` (`764px` úteis para `<main>`), enquanto drawers laterais fixos reduzem Pedidos a **`368px`** e Estoque a **`396px`**, `ProfileBrandSection` (`lg:grid-cols-3`) gera overflow no campo CEP, Billing (`md:grid-cols-3`) corta botões dos planos e `768px` de altura corta tabelas travadas com `overflow-hidden`.
- **`1280x720` e `1366x768` (Notebooks padrão 16:9):** Altura útil abaixo do header `lg:h-16` (`64px`) cai para **`656px`** (`1280x720`) e **`704px`** (`1366x768`). Containers `h-full max-h-full overflow-hidden`, `lg:overflow-hidden` e `overflow-y-hidden` (Financeiro, Estoque, Pedidos, Relatórios), somados a modais sem `max-h-[90dvh]` e `StorefrontPhoneMockup` fixo em `h-[690px]`, cortam linhas de tabela, paginações e controles inferiores.
- **`1280x800` e `1440x900` (Notebooks 16:10 / MacBook Air):** A maioria dos grids acomoda melhor a largura de `1020px`–`1180px`, mas permanecem afetados pelas falhas transversais: tooltips `?` hover-only, texto invisível em Light/Dark Mode, `overflow-hidden` do Lightbox de produto, barra de rolagem suprimida globalmente em `globals.css` e `StorefrontPhoneMockup` (`~886px` totais com controles) apertado em `800px` de altura.

---

## 2. Cobertura do Inventário (Grupos A, B e C)

Todos os arquivos ativos listados no inventário foram inspecionados diretamente:

| Grupo | Escopo / Arquivos Inspecionados | Status na Auditoria |
| --- | --- | --- |
| **A — Fundações & Entrada** | `app/layout.tsx`, `app/globals.css`, `components/theme-provider.tsx`, `app/page.tsx`, `components/AuthLayout.tsx`, `app/sign-in/[[...sign-in]]/page.tsx`, `app/sign-up/[[...sign-up]]/page.tsx`, `app/sso-callback/page.tsx`, `app/onboarding/page.tsx`, `app/onboarding/automatic-provisioning.tsx`, `app/dashboard/stores/new/page.tsx`, `app/dashboard/stores/new/new-store-form.tsx`, `app/dashboard/stores/[storeId]/setup/page.tsx`, `app/dashboard/stores/[storeId]/setup/store-setup-form.tsx`, `components/ui/*` (`alert`, `button`, `card`, `field`, `input`, `label`, `separator`, `social-icons`, `switch`) | Coberto integralmente. Achados em `layout.tsx`, `globals.css`, `AuthLayout.tsx`, `sign-in`, `sign-up`, `sso-callback`, `ui/button.tsx`, `ui/card.tsx`, `ui/switch.tsx`. Demais fluxos (`theme-provider`, `page.tsx`, `onboarding`, `stores/new`, `stores/[storeId]/setup`) sem achados críticos para notebooks/tablets. |
| **B — Storefront Público & Tracking** | `app/[storeSlug]/page.tsx`, `app/[storeSlug]/pedido/[id]/page.tsx`, `app/[storeSlug]/pedido/[id]/order-live-tracker.tsx`, e componentes ativos de `components/storefront/*`: `storefront-page-client.tsx`, `storefront-header.tsx`, `store-hero.tsx`, `category-filter-bar.tsx`, `combos-section.tsx`, `product-card.tsx`, `product-detail-modal.tsx`, `cart-drawer.tsx`, `mobile-cart-bar.tsx`, `checkout-client-data-modal.tsx`, `checkout-payment-modal.tsx`, `order-confirmed-screen.tsx`, `order-tracking-modal.tsx`, `delivery-info-modal.tsx`, `favorites-modal.tsx`, `receiving-method-modal.tsx`, `store-closed-screen.tsx`, `merchant-back-button.tsx`, `payment-brand-icons.tsx`, `storefront-theme-toggle.tsx` | Coberto integralmente (excluindo arquivos legados fora de uso). Achados em `storefront-header.tsx`, `category-filter-bar.tsx`, `product-detail-modal.tsx`, `delivery-info-modal.tsx`, `favorites-modal.tsx`, `order-tracking-modal.tsx`, `checkout-client-data-modal.tsx`, `order-confirmed-screen.tsx`. |
| **C — Dashboard Shell & Módulos** | `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`, `app/dashboard/billing-feedback.tsx`, `components/dashboard/dashboard-layout-client.tsx`, `components/dashboard/sidebar.tsx`, `components/dashboard/dashboard-header.tsx`, `components/LogoDeli.tsx`, `components/dashboard/cover-photo-picker-modal.tsx`, `app/dashboard/orders/*`, `app/dashboard/menu/*`, `app/dashboard/customers/*`, `app/dashboard/finance/*`, `app/dashboard/settings/*`, `components/dashboard/settings/*` (incluindo `floating-action-bar.tsx`, `payment-method-card.tsx`, `storefront-phone-mockup.tsx`, `weekly-schedule-manager.tsx`, `sections/*`; `settings-sidebar.tsx` presente no diretório, porém substituído pela barra de abas no `settings-client.tsx`), `app/dashboard/reports/page.tsx`, `components/dashboard/reports/reports-view.tsx`, `app/dashboard/inventory/*`, `app/dashboard/marketing/promotions/*`, `app/dashboard/marketing/academy/*` (`marketing/page.tsx` e `marketing/coupons/page.tsx` redirecionam para `/dashboard/marketing/promotions`), `app/dashboard/billing/*`, `app/dashboard/billing/success/*`, `app/dashboard/team/page.tsx` | Coberto integralmente. Achados distribuídos entre shell, Pedidos, Cardápio, Clientes, Financeiro, Configurações, Relatórios, Estoque, Promoções, Academy e Billing (`team/page.tsx` em estado placeholder `"Em construção"`). |

---

## 3. Achados Detalhados

### Severidade P0 — Críticos / Bloqueadores

#### [NB-P0-01] Financeiro trava rolagem em desktop (`lg:overflow-hidden`) e corta tabela de transações em `720px`/`768px`
- **Severidade:** P0
- **Grupo / Rota:** C — `app/dashboard/finance` (`/dashboard/finance`)
- **Arquivo:Linha:** `components/dashboard/dashboard-layout-client.tsx:29-33`; `app/dashboard/finance/finance-client.tsx:550,654,1212`
- **Viewports afetados:** `1024x768`, `1280x720`, `1366x768` (limítrofe em `1280x800`)
- **Tema:** Ambos (Light e Dark)
- **Causa raiz exata no código lido:** O wrapper `<main>` em `dashboard-layout-client.tsx:31` aplica uma exceção específica por rota: `pathname === "/dashboard/finance" ? "overflow-y-auto lg:overflow-hidden" : "overflow-y-auto"`. Ao mesmo tempo, `finance-client.tsx:550` usa `lg:max-h-full` e o bloco da tabela `Transações dos Pedidos` (`L1212`) utiliza `overflow-hidden`. Somando header interno (`~58px`), faixa de 5 KPIs (`lg:grid-cols-5` com `min-h-[112px]` em `L654`), linha de gráficos (`~260–270px`) e tabela (`4` linhas de `42px` + cabeçalho + paginação), o conteúdo atinge `~766–800px`, superando os `656px` úteis em `1280x720` (`720px - 64px` do `DashboardHeader`) e `704px` úteis em `1024x768` / `1366x768`. Resultado: linhas inferiores da tabela e controles de paginação ficam cortados sem rolagem possível.
- **Correção recomendada:** Remover o branch condicional `lg:overflow-hidden` em `dashboard-layout-client.tsx:31` (mantendo `overflow-y-auto` consistente em todas as páginas) e trocar `lg:max-h-full` / `overflow-hidden` em `finance-client.tsx:550,1212` por altura fluida com `overflow-x-auto` na tabela.

---

#### [NB-P0-02] Estoque e Cardápio prendem altura (`h-full max-h-full overflow-hidden`) e cortam ou escondem rolagem das linhas em notebooks baixos
- **Severidade:** P0
- **Grupo / Rota:** C — `app/dashboard/inventory` e `app/dashboard/menu`
- **Arquivo:Linha:** `app/dashboard/inventory/inventory-client.tsx:96,489,625`; `app/dashboard/menu/menu-client.tsx:338,1537,1712`; `app/globals.css:314-324`
- **Viewports afetados:** `1024x768`, `1280x720`, `1366x768`
- **Tema:** Ambos (Light e Dark)
- **Causa raiz exata no código lido:**
  - Em Estoque, o root (`inventory-client.tsx:489`) aplica `h-full max-h-full ... overflow-hidden`, enquanto a área da tabela (`L625`) usa `overflow-x-auto overflow-y-hidden` e pagina fixamente `ITEMS_PER_PAGE = 11` (`L96`). Em `1280x720` (`656px` disponíveis abaixo do header), KPIs + barra de ações + 11 linhas (`~44px+` cada) extrapolam a altura travada e são recortados pelo `overflow-y-hidden` sem scrollbar nem expansão da página.
  - Em Cardápio, o root (`menu-client.tsx:1537`) repete `h-full max-h-full ... overflow-hidden` com `ITEMS_PER_PAGE = 8` (`L338`); embora a tabela use `overflow-x-auto overflow-y-auto` (`L1712`), o reset global `* { scrollbar-width: none !important }` (`app/globals.css:314-324`) remove completamente a barra de rolagem visível, ocultando itens abaixo da dobra em `720px`/`768px`.
- **Correção recomendada:** Remover `h-full max-h-full overflow-hidden` dos containers raiz (`inventory-client.tsx:489`, `menu-client.tsx:1537`), trocar `overflow-y-hidden` em `inventory-client.tsx:625` por rolagem natural/visível e ajustar `ITEMS_PER_PAGE` conforme a altura útil ou deixar o `<main>` rolar verticalmente com cabeçalho da tabela sticky.

---

#### [NB-P0-03] Pedidos (`1024x768`–`1280x800`): Drawer lateral fixo reduz área da tabela para `368px` e aplica `overflow-y-hidden`
- **Severidade:** P0
- **Grupo / Rota:** C — `app/dashboard/orders` (`/dashboard/orders`)
- **Arquivo:Linha:** `app/dashboard/orders/orders-client.tsx:1148-1152,1384,1388,1570,1920,1968-1981`; `components/dashboard/sidebar.tsx:133`
- **Viewports afetados:** `1024x768` (crítico), `1280x720`, `1280x800`, `1366x768`
- **Tema:** Ambos (Light e Dark)
- **Causa raiz exata no código lido:** Em `1024px` (`lg:`), a sidebar fixa (`sidebar.tsx:133`, `w-[260px]`) coexiste com a coluna direita de detalhes do pedido (`orders-client.tsx:1969-1970`, `lg:w-[340px] xl:w-[370px]`, sempre montada via `hidden lg:flex`). Subtraindo paddings e gap em `1024x768`, restam apenas **`368px`** de largura útil para filtros, busca e a tabela de pedidos (`9` células por linha em `L1925-1933`, sendo `8` colunas de dados + coluna de ação; `594px` em `1280px` e `680px` em `1366px`). Paralelamente, `orders-client.tsx:1384,1388` travam `h-full max-h-full overflow-hidden` e `L1570` usa `overflow-x-auto overflow-y-hidden` calculando linhas com `availableHeight = h - 195` (`L1149-1151`), valor otimista frente à soma real do `DashboardHeader` (`64px`), título, tabs, barra de busca e paginação em telas `720px`/`768px`.
- **Correção recomendada:** Exibir o painel direito fixo apenas em `xl:` (`>= 1280px`) e mantê-lo como drawer overlay em `1024px–1279px` quando `selectedOrderId` estiver ativo; substituir `overflow-hidden`/`overflow-y-hidden` (`L1384,1388,1570`) por rolagem vertical segura ou diminuir o cálculo de `itemsPerPage` descontando a altura real medida do container.

---

#### [NB-P0-04] Financeiro e Relatórios (`Light Mode`): Tooltips `?` renderizam texto `#2E4233` sobre fundo `#2E4233` (invisível)
- **Severidade:** P0
- **Grupo / Rota:** C — `app/dashboard/finance` e `app/dashboard/reports`
- **Arquivo:Linha:** `app/dashboard/finance/finance-client.tsx:223,231,235` (`HelpTooltip`); `components/dashboard/reports/reports-view.tsx:101-113` (`CardHelpTooltip`)
- **Viewports afetados:** `768x1024`, `820x1180`, `1024x768`, `1280x720`, `1280x800`, `1366x768`, `1440x900`
- **Tema:** **Light Mode**
- **Causa raiz exata no código lido:** Em `finance-client.tsx:223`, o container do popover define fundo escuro `bg-[#2E4233] text-white` no modo claro, mas os elementos internos fixam `text-[#2E4233]` em `<p className="text-[11.5px] text-[#2E4233]">` (`L231`) e `<div className="... text-[11px] text-[#2E4233]">` (`L235`). A mesma inversão ocorre em `CardHelpTooltip` (`reports-view.tsx:101-113`). Como cor do texto e cor de fundo são idênticas (`#2E4233` sobre `#2E4233`), todo o conteúdo explicativo desaparece no Light Mode.
- **Correção recomendada:** Remover `text-[#2E4233]` dos elementos filhos (herdando `text-white`) ou adotar popover de alto contraste consistente (`bg-[#2E4233] text-white dark:bg-[#1B241E] dark:text-[#F2EFE9]`).

---

#### [NB-P0-05] Promoções (`Light Mode`): Título de tooltip usa `text-white` sobre fundo `#FAF8F0`
- **Severidade:** P0
- **Grupo / Rota:** C — `app/dashboard/marketing/promotions` (`/dashboard/marketing/promotions`)
- **Arquivo:Linha:** `app/dashboard/marketing/promotions/promotions-client.tsx:810,816`
- **Viewports afetados:** `768x1024`, `820x1180`, `1024x768`, `1280x720`, `1280x800`, `1366x768`, `1440x900`
- **Tema:** **Light Mode**
- **Causa raiz exata no código lido:** Na tooltip contextual da linha `L810`, o destaque `<span className="text-white ...">Gestão Centralizada:</span>` (`L816`) força texto branco sobre o fundo claro `#FAF8F0` da caixa no Light Mode, deixando o cabeçalho da dica ilegível.
- **Correção recomendada:** Substituir `text-white` por `text-[#1A241E] dark:text-white` (ou padronizar a superfície do tooltip para `#2E4233` com texto branco em Light Mode) e unificar com o padrão acessível de tooltip.

---

#### [NB-P0-06] Financeiro (`Dark Mode`): Modal de Taxas mistura `bg-white` fixo com `dark:text-[#F2EFE9]` e Modal de Detalhes ignora Dark Mode
- **Severidade:** P0
- **Grupo / Rota:** C — `app/dashboard/finance` (`/dashboard/finance`)
- **Arquivo:Linha:** `app/dashboard/finance/finance-client.tsx:1441,1469,1494,1519,1544,1586`
- **Viewports afetados:** `768x1024`, `820x1180`, `1024x768`, `1280x720`, `1280x800`, `1366x768`, `1440x900`
- **Tema:** **Dark Mode**
- **Causa raiz exata no código lido:** O container do modal de edição de taxas (`L1441`) define apenas `bg-white` sem `dark:bg-[#1B241E]`, enquanto os labels e campos nas linhas `L1469,1494,1519,1544` aplicam `dark:text-[#F2EFE9]`. No Dark Mode, o texto claro (`#F2EFE9`) é renderizado diretamente sobre o modal branco (`#FFFFFF`), tornando valores e rótulos praticamente invisíveis. Adicionalmente, o modal de detalhes do pedido (`L1586`) mantém `bg-white` hardcoded sem qualquer token `dark:`.
- **Correção recomendada:** Adicionar `dark:bg-[#1B241E] dark:border-[#2A382E] dark:text-[#F2EFE9]` aos containers `L1441` e `L1586` (bem como `max-h-[90dvh] overflow-y-auto` para segurança em altura `720px`/`768px`) e revisar superfícies internas de inputs e botões.

---

#### [NB-P0-07] Storefront Público (`>= 768px`): Lightbox de foto do produto corta botões de anterior/próximo
- **Severidade:** P0
- **Grupo / Rota:** B — `app/[storeSlug]` (`components/storefront/product-detail-modal.tsx`)
- **Arquivo:Linha:** `components/storefront/product-detail-modal.tsx:1083,1101,1112`
- **Viewports afetados:** `768x1024`, `820x1180`, `1024x768`, `1280x720`, `1280x800`, `1366x768`, `1440x900`
- **Tema:** Ambos (Light e Dark)
- **Causa raiz exata no código lido:** O container do lightbox em `L1083` declara `<div className="relative max-w-4xl max-h-[75vh] flex items-center justify-center overflow-hidden">`, enquanto as setas de navegação entre fotos são posicionadas fora dos limites desse wrapper com `md:-left-16` (`L1101`) e `md:-right-16` (`L1112`). O `overflow-hidden` do ancestral direto recorta completamente ambos os botões em qualquer viewport `>= 768px`, impedindo navegar na galeria ampliada.
- **Correção recomendada:** Remover `overflow-hidden` da caixa externa em `L1083` (aplicando `overflow-hidden` e borda arredondada apenas ao elemento da imagem) ou reposicionar as setas dentro da área segura (`left-3`/`right-3`) com fundo semitransparente contrastado.

---

#### [NB-P0-08] Configurações (`1024x768`): Grid `lg:grid-cols-3` de Perfil & Marca estoura horizontalmente no bloco de CEP
- **Severidade:** P0
- **Grupo / Rota:** C — `app/dashboard/settings` (`components/dashboard/settings/sections/profile-brand-section.tsx`)
- **Arquivo:Linha:** `components/dashboard/settings/sections/profile-brand-section.tsx:156,403-435`
- **Viewports afetados:** `1024x768` (crítico; apertado em `1280x720`/`1280x800`)
- **Tema:** Ambos (Light e Dark)
- **Causa raiz exata no código lido:** Em `1024x768`, após descontar `260px` da sidebar e os paddings da tela de configurações, `profile-brand-section.tsx:156` aplica `lg:grid-cols-3`, reduzindo cada coluna a `~220px` externos (`~152px–180px` úteis internos). Na terceira coluna (`L403-435`), a linha de CEP coloca lado a lado o input fixo `w-28` (`112px`) e o botão `Buscar CEP` com `shrink-0` (`~102px`), somando `~222px` dentro de `~152px` livres e gerando transbordamento horizontal para fora do card.
- **Correção recomendada:** Subir o grid de 3 colunas de `lg:grid-cols-3` para `xl:grid-cols-3` (usando 1 ou 2 colunas entre `768px` e `1279px`) e tornar a linha de CEP flexível (`flex-wrap` ou `grid-cols-[minmax(0,1fr)_auto]`).

---

#### [NB-P0-09] Billing (`768x1024`, `820x1180`, `1024x768`): Grid `md:grid-cols-3` comprime cards de plano e `whitespace-nowrap` corta textos dos botões
- **Severidade:** P0
- **Grupo / Rota:** C — `app/dashboard/billing` (`/dashboard/billing`)
- **Arquivo:Linha:** `app/dashboard/billing/checkout-form.tsx:35`; `app/dashboard/billing/subscription-management-form.tsx:226,286-301`; `app/dashboard/billing/page.tsx:92-108,163`; `components/ui/card.tsx:15,78`; `components/ui/button.tsx:7`
- **Viewports afetados:** `768x1024`, `820x1180`, `1024x768`
- **Tema:** Ambos (Light e Dark)
- **Causa raiz exata no código lido:** Tanto `CheckoutForm` (`checkout-form.tsx:35`) quanto `SubscriptionManagementForm` (`subscription-management-form.tsx:226`) aplicam `grid min-w-0 grid-cols-1 gap-5 md:grid-cols-3`. Em `1024x768` (`260px` sidebar + `lg:px-8` em `billing/page.tsx:163` = `700px` de seção) e `768x1024` (`px-6` = `720px`), cada `Card` recebe apenas **`220px`–`226px`** de largura. Como `Card` (`card.tsx:15,78`) aplica `overflow-hidden` e `px-(--card-spacing)` (`24px` por lado = `48px`), restam somente **`172px`–`178px`** no `CardFooter`. Como `Button` (`button.tsx:7`) impõe `whitespace-nowrap`, rótulos como `"Continuar no plano atual"`, `"Fazer upgrade para Essencial"` e `"Agendar downgrade para Essencial"` (`subscription-management-form.tsx:286-301`) extravasam os `172px` e são cortados lateralmente. Além disso, no topo do card Essencial (`220px` em `1024x768`), os badges absolutos `Plano atual` (`top-3.5 left-5`, `L98`) e `Mais Popular` (`top-3 right-4`, `L104`) quase colidem.
- **Correção recomendada:** Usar `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` (ou manter 1 coluna até `lg:` e 3 colunas só em `xl:`), mover os badges do topo para fluxo flexível (`flex-wrap justify-between gap-2`) dentro do `CardHeader`, e permitir `whitespace-normal h-auto py-2 text-center leading-snug` nos botões dos planos.

---

#### [NB-P0-10] Promoções (`720px`/`768px`, Dark Mode): Modal sem `max-h-[90dvh]` e metade inferior clara sobre fundo escuro
- **Severidade:** P0
- **Grupo / Rota:** C — `app/dashboard/marketing/promotions` (`/dashboard/marketing/promotions`)
- **Arquivo:Linha:** `app/dashboard/marketing/promotions/promotions-client.tsx:219,1068,1173-1292`
- **Viewports afetados:** `768x1024`, `820x1180`, `1024x768`, `1280x720`, `1280x800`, `1366x768`, `1440x900`
- **Tema:** Ambos (altura `720px`/`768px`) e **Dark Mode** (contraste/superfície)
- **Causa raiz exata no código lido:** O card do modal de criação/edição (`L1068`) não define `max-h-[90dvh] overflow-y-auto`, podendo cortar botões de salvar/cancelar em notebooks `720px`/`768px`, agravado quando o `DeliPlusDatePicker` (`L219`, `w-[250px]`) abre para baixo próximo ao rodapé. Em paralelo, o mesmo modal usa `dark:bg-[#1B241E]` no topo, porém sua metade inferior e rodapé (`L1173-1292`) preservam classes fixas `bg-[#FAF8F0]`, `text-gray-700` e `text-gray-600` sem `dark:`, gerando contraste quebrado e blocos claros desarmônicos no Dark Mode.
- **Correção recomendada:** Aplicar `max-h-[90dvh] overflow-y-auto` no card do modal (`L1068`), abrir o `DatePicker` com posicionamento adaptativo para cima quando perto da borda inferior, e migrar `L1173-1292` integralmente para tokens Dark Mode.

---

### Severidade P1 — Altos / Degradação Severa de Layout, Touch ou Tema

#### [NB-P1-01] Shell Global (`1024x768`–`1366x768`): Sidebar fixa não retrátil de `260px` + reset global `* { scrollbar-width: none !important }`
- **Severidade:** P1
- **Grupo / Rota:** A & C — `app/globals.css`, `components/dashboard/sidebar.tsx` (transversal ao dashboard)
- **Arquivo:Linha:** `components/dashboard/sidebar.tsx:133,246,330`; `app/globals.css:314-324,327-374`
- **Viewports afetados:** `768x1024`, `820x1180`, `1024x768`, `1280x720`, `1280x800`, `1366x768`
- **Tema:** Ambos (Light e Dark)
- **Causa raiz exata no código lido:** Em `1024px` (`lg:`), a sidebar desktop entra fixa com `w-[260px]` (`sidebar.tsx:133`) sem opção de recolhimento/compactação, consumindo `25,4%` de uma tela `1024x768` (`764px` restantes para `<main>`). O bloco inferior do usuário com `p-4 pb-12` (`L330`) comprime o `<nav overflow-y-auto>` (`L246`) em telas de `720px`/`768px` de altura. Simultaneamente, `app/globals.css:314-324` aplica `* { scrollbar-width: none !important; -ms-overflow-style: none !important; }` e `*::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }`, restaurando apenas a barra vertical do storefront (`L327-374`). Com isso, toda tabela horizontal, lista de abas, sidebar e modal rolável perde a pista visual de rolagem em notebooks e tablets.
- **Correção recomendada:** Implementar modo retrátil/colapsável (ex.: `w-16` / `w-20` no `1024px`–`1279px` ou toggle persistente), reduzir `pb-12` para `pb-4` no rodapé da sidebar em alturas curtas, e trocar o seletor universal `*` em `globals.css:314-324` por `.no-scrollbar` pontual mantendo scrollbars finas e legíveis no dashboard e tabelas.

---

#### [NB-P1-02] Tablets `< 1024px` (`768x1024`, `820x1180`): `FloatingActionBar` sobrepõe `MobileNav` e `<main>` não garante reserva inferior uniforme
- **Severidade:** P1
- **Grupo / Rota:** C — `components/dashboard/dashboard-layout-client.tsx`, `components/dashboard/sidebar.tsx`, `components/dashboard/settings/floating-action-bar.tsx`, `customers`, `promotions`, `academy`, `finance`, `billing`
- **Arquivo:Linha:** `components/dashboard/sidebar.tsx:389`; `components/dashboard/settings/floating-action-bar.tsx:53`; `components/dashboard/dashboard-layout-client.tsx:29-33`; `app/dashboard/customers/customers-client.tsx:203`; `app/dashboard/marketing/promotions/promotions-client.tsx:489`; `app/dashboard/marketing/academy/academy-client.tsx:103`; `app/dashboard/finance/finance-client.tsx:550`; `app/dashboard/billing/page.tsx:164`
- **Viewports afetados:** `768x1024`, `820x1180`
- **Tema:** Ambos (Light e Dark)
- **Causa raiz exata no código lido:** Abaixo de `1024px`, a `MobileNav` fica fixa na base com `h-[72px]` (`sidebar.tsx:389`, `lg:hidden`), porém `<main>` em `dashboard-layout-client.tsx:29-33` não inclui `max-lg:pb-[84px]`. Páginas que esqueceram esse padding — `customers-client.tsx:203` (`p-4 lg:p-8`), `promotions-client.tsx:489` e `academy-client.tsx:103` (`p-4 sm:p-6 lg:p-8`), `finance-client.tsx:550` (`pb-3.5`) e `billing/page.tsx:164` (`pb-12`) — podem ter o rodapé coberto pela barra fixa. Em Configurações, `FloatingActionBar` (`floating-action-bar.tsx:53`) posiciona-se em `fixed bottom-6 ... z-40`, sobrepondo fisicamente os ícones da `MobileNav` (`z-30`) sempre que há alterações pendentes.
- **Correção recomendada:** Centralizar `max-lg:pb-[88px]` no `<main>` de `dashboard-layout-client.tsx` e elevar `FloatingActionBar` para `bottom-[88px] lg:bottom-6`.

---

#### [NB-P1-03] Tablets Touch (`768x1024`–`1024x768`): Tooltips `?` e ações `group-hover` inacessíveis por toque ou teclado
- **Severidade:** P1
- **Grupo / Rota:** C — `orders`, `menu`, `inventory`, `promotions`, `reports`, `profile-brand-section`, `finance`
- **Arquivo:Linha:** `app/dashboard/orders/orders-client.tsx:1399-1422`; `app/dashboard/menu/menu-client.tsx:1553-1575,3167-3186,3761-3771`; `app/dashboard/inventory/inventory-client.tsx:497-501,1090,1166,1371`; `app/dashboard/marketing/promotions/promotions-client.tsx:509,553,683,810,1077,1180`; `components/dashboard/reports/reports-view.tsx:101-113`; `components/dashboard/settings/sections/profile-brand-section.tsx:195`; `app/dashboard/finance/finance-client.tsx:223`
- **Viewports afetados:** `768x1024`, `820x1180`, `1024x768`
- **Tema:** Ambos (Light e Dark)
- **Causa raiz exata no código lido:** Todas as tooltips `?` em Pedidos (`L1399-1422`), Cardápio (`L1553-1575,3167-3186,3761-3771`), Estoque (`L497-501,1090,1166,1371`), Promoções (`L509,553,683,810,1077,1180`) e Relatórios (`L101-113`) dependem exclusivamente de CSS `group-hover` + `pointer-events-none` em elementos `<div>` sem `tabIndex`, click/tap ou gerenciamento de estado aberto/fechado. No Financeiro (`finance-client.tsx:223`), existe `group-focus-within` com `tabIndex={0}`, mas sem botão real (`<button>`) de toggle ou fechamento por toque externo. Em `profile-brand-section.tsx:195`, o botão de excluir logotipo fica escondido atrás de `opacity-0 group-hover:opacity-100`, prejudicando usuários de tablet sem mouse.
- **Correção recomendada:** Extrair um componente `<HelpTooltip />` único baseado em `<button type="button">` com clique/tap, suporte a Escape e clique fora (além de hover opcional em ponteiros finos), e tornar o botão da lixeira de logo sempre visível em dispositivos sem hover (`[@media(hover:none)]:opacity-100`).

---

#### [NB-P1-04] Estoque (`1024x768`, `1280x720`): Painel fixo `Reposição` (`300px`) esmaga a tabela de 6 colunas para `396px`
- **Severidade:** P1
- **Grupo / Rota:** C — `app/dashboard/inventory` (`/dashboard/inventory`)
- **Arquivo:Linha:** `app/dashboard/inventory/inventory-client.tsx:583,1077`
- **Viewports afetados:** `1024x768` (crítico), `1280x720`, `1280x800`
- **Tema:** Ambos (Light e Dark)
- **Causa raiz exata no código lido:** A partir de `lg:` (`1024px`), o painel lateral `Reposição` (`L583`, `L1077`) é fixado com `lg:flex w-[300px]` ao lado esquerdo da tabela. Somado aos `260px` da sidebar e `48px` de padding/gap (`1024 - 260 - 48 - 300 - 20`), restam apenas **`396px`** para a barra de filtros e as 6 colunas da tabela (`652px` em `1280px`), forçando esmagamento ou rolagem horizontal cega.
- **Correção recomendada:** Fixar a coluna lateral `Reposição` apenas a partir de `xl:` (`>= 1280px`) e exibi-la como botão com drawer deslizante ou tab dedicada em `768px`–`1279px`.

---

#### [NB-P1-05] Relatórios (`1024x768`, `1280x720`, Dark Mode): `lg:overflow-hidden` comprime grids `lg:grid-cols-3` / `lg:grid-cols-2` e tem lacunas Dark Mode
- **Severidade:** P1
- **Grupo / Rota:** C — `app/dashboard/reports` (`components/dashboard/reports/reports-view.tsx`)
- **Arquivo:Linha:** `components/dashboard/reports/reports-view.tsx:496,536,799,1380,1408,1463,1640,1649,1770,1783,1788,1794,1800,1806,1822`
- **Viewports afetados:** `1024x768`, `1280x720`, `1280x800`, `1366x768`
- **Tema:** Ambos (layout) e **Dark Mode** (contraste)
- **Causa raiz exata no código lido:** O container raiz (`L799`) usa `overflow-y-auto lg:overflow-hidden`. Em `1024x768` (`~708px` internos), a segunda linha (`lg:grid-cols-3`) deixa `~228px` por card, e a terceira linha (`lg:grid-cols-2`, `~342px`/card) coloca gráficos/donuts de `140px` em `sm:flex-row` ao lado de blocos com apenas `~142–146px` de largura. Em `1280x720` (`656px` úteis), a falta de rolagem vertical em `lg:` comprime ainda mais o conjunto. Além disso, a seleção de dias (`L1408`) e o modal (`L1822`) ocultam scrollbars (`[scrollbar-width:none]`), enquanto múltiplos textos/barras/helpers (`L496,536,1380,1463,1640,1649,1770,1783,1788,1794,1800,1806`) aplicam `#2E4233`, `#525B4E`, `#717A6D`, `#EFECE3` e `#F4D6C7` sem variantes `dark:`.
- **Correção recomendada:** Remover `lg:overflow-hidden` de `L799` (permitindo rolagem vertical natural quando necessário), atrasar `lg:grid-cols-3` / `sm:flex-row` dos gráficos para `xl:` onde adequado, e completar todos os tokens `dark:` pendentes.

---

#### [NB-P1-06] Financeiro (`1024x768`, Dark Mode): KPIs `lg:grid-cols-5` + Donut `lg:col-span-5` apertados e elementos gráficos sem Dark Mode
- **Severidade:** P1
- **Grupo / Rota:** C — `app/dashboard/finance/finance-client.tsx`, `app/dashboard/finance/shift-closing-modal.tsx`
- **Arquivo:Linha:** `app/dashboard/finance/finance-client.tsx:618-621,654,788,847,868,959,1001,1053,1144,1368`; `app/dashboard/finance/shift-closing-modal.tsx:122,148`
- **Viewports afetados:** `1024x768`, `1280x720`, `1366x768`
- **Tema:** Ambos (compressão em `1024x768`) e **Dark Mode**
- **Causa raiz exata no código lido:** Em `1024x768`, o grid de 5 KPIs (`lg:grid-cols-5`, `L654`) reduz cada card a `~130px`, e o card de canais/pagamentos (`lg:col-span-5`, `L788,959,1001`) com `~287px` divide espaço em `sm:flex-row` entre um donut `w-30` (`120px`) e 4 linhas de legenda (`~117px` livres). No Dark Mode: o total central do donut usa `text-[#1C201A]` (`L1053`, quase invisível no fundo escuro), o hover das barras usa `bg-[#F8F9F3]` (`L868`), gridlines usam `border-[#1C201A]/15` (`L847`), e itens do dropdown de período (`L618-621`) mais divisores (`L1144,1368`) não possuem classes `dark:`. Em `shift-closing-modal.tsx`, a linha do operador (`L148`) aplica `flex items-center justify-between` sem `flex-wrap` dentro de `max-h-[92vh]` (`L122`).
- **Correção recomendada:** Usar `grid-cols-2 lg:grid-cols-3 xl:grid-cols-5` nos KPIs, empilhar o donut e sua legenda abaixo de `xl:`, corrigir todos os tokens `dark:` do gráfico, dropdown e divisores, e usar `flex-wrap gap-2` no cabeçalho do operador do `ShiftClosingModal` com `max-h-[90dvh]`.

---

#### [NB-P1-07] Cardápio, Pedidos, Estoque e Seletor de Capa (`Dark Mode`): Modais inteiros, inputs inline e cards com fundo claro hardcoded
- **Severidade:** P1
- **Grupo / Rota:** C — `menu`, `orders`, `inventory`, `components/dashboard/cover-photo-picker-modal.tsx`
- **Arquivo:Linha:** `app/dashboard/menu/menu-client.tsx:2373,2694,2805,2985,3156,3539,3935`; `app/dashboard/orders/orders-client.tsx:2294,2343,2406,2500,2675,2684,2717,2734,2754,2763`; `app/dashboard/inventory/inventory-client.tsx:707,728,760,895-1072,1158,1358,1599,1652`; `components/dashboard/cover-photo-picker-modal.tsx:117-328`
- **Viewports afetados:** `768x1024`, `820x1180`, `1024x768`, `1280x720`, `1280x800`, `1366x768`, `1440x900`
- **Tema:** **Dark Mode**
- **Causa raiz exata no código lido:** Um conjunto amplo de superfícies interativas permanece 100% preso à paleta clara (`bg-white`, `bg-[#FAF8F5]`, `bg-[#FAF8F0]`, `text-black`, `text-[#1C2C22]`, `text-gray-700`):
  - **Cardápio (`menu-client.tsx`):** 7 modais — Editor (`L2373`), Excluir (`L2694`), Trocar Foto (`L2805`), Editar Produto (`L2985`), Adicionais (`L3156`), Promoção (`L3539`) e Tour Prompt (`L3935`) — não têm tokens `dark:` (apenas `SizesModal` em `L3750` foi migrado).
  - **Pedidos (`orders-client.tsx`):** estados de alerta `bg-[#FEF2F2]` (`L2294`), título `text-[#1C2C22]` (`L2343`), modal de impressão em tela (`L2406,2500`) e 6 inputs/selects do modal de edição de pedido com `bg-white text-[#1C2C22]` (`L2675,2684,2717,2734,2754,2763`).
  - **Estoque (`inventory-client.tsx`):** `tbody` (`L707`), inputs inline da tabela (`L728,760`), cards para `< lg` (`L895-1072`), `NewProductModal` (`L1158`), `ShoppingListModal` (`L1358`) e ambos os modais de exclusão (`L1599,1652`).
  - **Compartilhado (`cover-photo-picker-modal.tsx:117-328`):** modal inteiro usa `bg-[#FAF8F5]`, `bg-white`, `border-[#E8E2D8]` e `text-[#1C251F]` sem variantes `dark:`.
- **Correção recomendada:** Aplicar a paleta Dark Mode padrão do sistema (`dark:bg-[#1B241E]`, `dark:bg-[#222C25]`, `dark:border-[#2A382E]`, `dark:text-[#F2EFE9]`) em todos os modais, inputs e cards listados, preservando fundo branco apenas dentro de `@media print` para o recibo térmico `#thermal-receipt`.

---

#### [NB-P1-08] Configurações (`768px`–`1366px`): Tab bar sem indicador de rolagem e `StorefrontPhoneMockup` de `690px` estoura altura `720px`/`768px`/`800px`
- **Severidade:** P1
- **Grupo / Rota:** C — `app/dashboard/settings` (`settings-client.tsx`, `storefront-phone-mockup.tsx`)
- **Arquivo:Linha:** `app/dashboard/settings/settings-client.tsx:527,652`; `components/dashboard/settings/storefront-phone-mockup.tsx:65,113,172`
- **Viewports afetados:** `768x1024`, `820x1180`, `1024x768`, `1280x720`, `1280x800`, `1366x768`
- **Tema:** Ambos (Light e Dark)
- **Causa raiz exata no código lido:** (1) A barra com 6 abas em `settings-client.tsx:527` usa `overflow-x-auto no-scrollbar` horizontal em linha única, ultrapassando os `~700px–720px` úteis em `768x1024` e `1024x768` sem setas nem gradiente lateral indicando abas escondidas à direita. (2) O preview Studio (`settings-client.tsx:652`) monta `StorefrontPhoneMockup` com altura rígida `h-[690px]` (`storefront-phone-mockup.tsx:113`), que somada ao seletor de tema (`L65-106`), cabeçalho do drawer e paddings totaliza `~886px`, excedendo viewports de `720px`, `768px` e `800px` dentro de área `overflow-y-auto no-scrollbar` sem pista visual de rolagem.
- **Correção recomendada:** Permitir `flex-wrap` na barra de abas entre `768px` e `1279px` (ou adicionar controles laterais de scroll) e tornar a altura do mockup responsiva à altura da viewport (ex.: escalar o chassi ou limitar via `max-h-[calc(100dvh-180px)]` com escala proporcional em telas `<= 850px`).

---

#### [NB-P1-09] Storefront Público (`768px`–`1366px`, Dark Mode): `CategoryFilterBar` sobrepõe header desktop, modal de produto usa `md:overflow-y-hidden` e modais secundários quebram em altura curta e Dark Mode
- **Severidade:** P1
- **Grupo / Rota:** B — `app/[storeSlug]` (`components/storefront/*`)
- **Arquivo:Linha:** `components/storefront/storefront-header.tsx:15,55`; `components/storefront/category-filter-bar.tsx:23,26,46`; `components/storefront/product-detail-modal.tsx:322,335-337,440,537,567`; `components/storefront/delivery-info-modal.tsx:49,72-132,148,158`; `components/storefront/favorites-modal.tsx:50,55,71,109`; `components/storefront/order-tracking-modal.tsx:71,75,79,115,118,123`
- **Viewports afetados:** `768x1024`, `820x1180`, `1024x768`, `1280x720`, `1366x768`
- **Tema:** Ambos (sticky/altura) e **Dark Mode** (`delivery-info-modal`, `favorites-modal`, `order-tracking-modal`)
- **Causa raiz exata no código lido:**
  - `StorefrontHeader` (`storefront-header.tsx:15,55`) no layout `md:flex px-6 py-3.5` mede `~65–67px` de altura, porém `CategoryFilterBar` (`category-filter-bar.tsx:23`) usa `sticky top-[57px] z-30`, invadindo `~8–10px` por baixo do header desktop e comprimindo chips de categoria com `no-scrollbar` (`L26`) ao lado da busca `md:w-80` (`L46`) em `768px–820px`.
  - `product-detail-modal.tsx` aplica `max-h-[90vh] md:max-h-[85vh]` com `md:overflow-y-hidden` (`L322`), coluna esquerda sem rolagem (`L335-337`), container `#beverageListRef` sem ajuste dedicado (`L440`) e paginação numérica sem limite (`L537`), sujeitando itens/botões a aperto em `720px`/`768px`.
  - `delivery-info-modal.tsx:49` define `max-h-[80vh]` só para o corpo (header + corpo + footer estouram `720px`), além de manter card de resultado em `bg-[#F2F9F4] text-[#1C482A]` (`L72-132`), SVG claro e ícone de escudo `text-[#1B2A20]` (`L148,158`) quase invisível no Dark Mode.
  - `favorites-modal.tsx` (`L50,55,71,109`) e `order-tracking-modal.tsx` (`L71,75,79,115,118,123`) têm `max-h-[75vh]` com textos/bordas parciais ou ausentes em `dark:`.
- **Correção recomendada:** Alinhar `CategoryFilterBar` com `md:top-[65px]`, trocar `md:overflow-y-hidden` de `product-detail-modal.tsx:322` por container com `max-h-[90dvh]` e scroll seguro em ambas as colunas, ajustar `delivery-info-modal.tsx` para `max-h-[90dvh]` no modal inteiro e adicionar tokens `dark:` completos nos três modais.

---

#### [NB-P1-10] Storefront Checkout & Confirmação (`768x1024`, `820x1180`, Dark Mode): `md:grid-cols-12` comprime formulário/resumo e faltam classes `dark:`
- **Severidade:** P1
- **Grupo / Rota:** B — `components/storefront/checkout-client-data-modal.tsx`, `components/storefront/order-confirmed-screen.tsx`
- **Arquivo:Linha:** `components/storefront/checkout-client-data-modal.tsx:208,265,268,521,550,789`; `components/storefront/order-confirmed-screen.tsx:45,59,73,180,206,213`
- **Viewports afetados:** `768x1024`, `820x1180`
- **Tema:** Ambos (compressão) e **Dark Mode** (contraste)
- **Causa raiz exata no código lido:** Em `checkout-client-data-modal.tsx`, a divisão `md:grid-cols-12` (`col-span-7` / `col-span-5`) já ativa em `768px`, espremendo a coluna de resumo do pedido para `~242px` e reduzindo o sub-grid de endereço `sm:grid-cols-3` para `~114px` por campo em `768x1024`. Além disso, ambos os arquivos usam `#59615B` e `#FAF8F5` sem variantes `dark:`, e `order-confirmed-screen.tsx:180` carece de `flex-wrap` para botões/blocos horizontais em larguras intermediárias.
- **Correção recomendada:** Subir o split `grid-cols-12` para `lg:grid-cols-12`, manter `grid-cols-1 md:grid-cols-3` nos campos curtos apenas quando a coluna tiver largura suficiente, adicionar `flex-wrap` em `order-confirmed-screen.tsx:180` e aplicar suporte completo a Dark Mode.

---

#### [NB-P1-11] Autenticação & SSO (`768px`–`1440px`, Dark Mode): `AuthLayout`, `/sign-in`, `/sign-up` e `/sso-callback` sem suporte a Dark Mode
- **Severidade:** P1
- **Grupo / Rota:** A — `components/AuthLayout.tsx`, `app/sign-in/[[...sign-in]]/page.tsx`, `app/sign-up/[[...sign-up]]/page.tsx`, `app/sso-callback/page.tsx`
- **Arquivo:Linha:** `components/AuthLayout.tsx:41,68,100`; `app/sign-in/[[...sign-in]]/page.tsx:17,45`; `app/sign-up/[[...sign-up]]/page.tsx:17,45`; `app/sso-callback/page.tsx:5`
- **Viewports afetados:** `768x1024`, `820x1180`, `1024x768`, `1280x720`, `1280x800`, `1366x768`, `1440x900`
- **Tema:** **Dark Mode**
- **Causa raiz exata no código lido:** `AuthLayout.tsx` aplica cores fixas claras `bg-[#2B5C60] md:bg-[#F6F5F2]` (`L41`) e `bg-[#FCFBFA] md:bg-transparent` (`L100`) com espaçamento `md:max-w-[540px] ... md:py-2` (`L68`). As páginas `sign-in` e `sign-up` fixam `bg-[#FCFBFA] ... border-[#2B5C60]/30` (`L17`) e `text-[#555]` (`L45`), enquanto `sso-callback/page.tsx:5` usa `h-screen w-screen bg-[#F6F5F2]`. Não há nenhuma classe `dark:` nessas rotas de entrada, causando contraste desconfigurado ou clarão intenso quando o tema escuro está ativo.
- **Correção recomendada:** Adicionar classes `dark:bg-[#131A15]`, `dark:bg-[#1B241E]`, `dark:text-[#F2EFE9]` e `dark:border-[#2A382E]` em `AuthLayout.tsx`, `sign-in`, `sign-up` e `sso-callback` (substituindo `h-screen w-screen` por `min-h-dvh w-full`).

---

#### [NB-P1-12] Promoções & Clientes (`768px`–`1280px`, Dark Mode): Tabelas largas com scrollbar oculta e células/filtros sem variantes `dark:`
- **Severidade:** P1
- **Grupo / Rota:** C — `app/dashboard/marketing/promotions`, `app/dashboard/customers`
- **Arquivo:Linha:** `app/dashboard/marketing/promotions/promotions-client.tsx:873,918,960-963,999`; `app/dashboard/customers/customers-client.tsx:289,301,314,326,337-338`
- **Viewports afetados:** `768x1024`, `820x1180`, `1024x768`, `1280x720`
- **Tema:** Ambos (scroll horizontal oculto) e **Dark Mode**
- **Causa raiz exata no código lido:** A tabela de 9 colunas em `promotions-client.tsx:873` e a de 7 colunas em `customers-client.tsx:337-338` dependem de `overflow-x-auto` entre `768px` e `1280px`, porém o `* { scrollbar-width: none !important }` de `globals.css` esconde qualquer pista visual de colunas fora da viewport. No Dark Mode, textos/células em `promotions-client.tsx:918,960-963,999` não trazem `dark:text-`, e as pills de filtro em `customers-client.tsx:289,301,314,326` omitem estados `dark:hover:`.
- **Correção recomendada:** Exibir barra de rolagem horizontal fina nessas tabelas (ou adicionar indicador de scroll lateral + empilhamento/ocultação de colunas secundárias abaixo de `xl:`), e completar todas as classes `dark:` / `dark:hover:` nos textos e pills.

---

### Severidade P2 — Médios / Contraste Secundário, Acessibilidade e Polimento

#### [NB-P2-01] `Switch` UI & Toggles de Configurações (`Dark Mode`): Cor ativa `#2E4233` com baixo contraste em cards escuros
- **Severidade:** P2
- **Grupo / Rota:** A & C — `components/ui/switch.tsx`, `components/dashboard/settings/sections/kitchen-printer-section.tsx`, `components/dashboard/settings/payment-method-card.tsx`
- **Arquivo:Linha:** `components/ui/switch.tsx:26`; `components/dashboard/settings/sections/kitchen-printer-section.tsx:103,212`; `components/dashboard/settings/payment-method-card.tsx:332,390,434`
- **Viewports afetados:** Todos (`768x1024` a `1440x900`)
- **Tema:** **Dark Mode**
- **Causa raiz exata no código lido:** Tanto o componente base `Switch` (`switch.tsx:26`, `activeTrackColor = "bg-[#2E4233]"`) quanto os toggles customizados em `kitchen-printer-section.tsx:103,212` e `payment-method-card.tsx:332,390,434` utilizam verde muito escuro (`#2E4233`) no estado ligado. Sobre cards escuros (`#1B241E`, `#233127`, `#243329`), a diferença visual entre estado ativo e inativo fica sutil demais.
- **Correção recomendada:** Usar `dark:bg-emerald-500` ou `dark:bg-[#CB5A3C]` quando ativo (alinhado ao padrão de `delivery-fees-section.tsx:440`).

---

#### [NB-P2-02] Pedidos & Cardápio (`768px`–`1280px`, Dark Mode): Paginação `absolute left-6` sobrepõe botões e `empty slots` do Cardápio sem `dark:border-`
- **Severidade:** P2
- **Grupo / Rota:** C — `app/dashboard/orders/orders-client.tsx`, `app/dashboard/menu/menu-client.tsx`
- **Arquivo:Linha:** `app/dashboard/orders/orders-client.tsx:1941-1961`; `app/dashboard/menu/menu-client.tsx:2013,2070-2088`
- **Viewports afetados:** `768x1024`, `1024x768`, `1280x720`
- **Tema:** Ambos (paginação) e **Dark Mode** (`menu-client.tsx:2013`)
- **Causa raiz exata no código lido:** Nas barras de paginação (`orders-client.tsx:1941-1961` e `menu-client.tsx:2070-2088`), o contador `"Mostrando ..."` fica posicionado com `absolute left-6` enquanto os botões de página ficam centralizados no mesmo container; em larguras estreitas (como `368px` na esquerda de Pedidos em `1024x768` ou muitas páginas no Cardápio), o texto colide com os números de página. Em `menu-client.tsx:2013`, as linhas vazias de preenchimento aplicam `border-[#E9E4D4]` sem classe `dark:border-`.
- **Correção recomendada:** Trocar o posicionamento absoluto por `flex flex-wrap items-center justify-between gap-2` e adicionar `dark:border-[#233026]` nas linhas vazias de `menu-client.tsx:2013`.

---

#### [NB-P2-03] Fundação (`app/layout.tsx`): `maximumScale: 1` e `userScalable: false` impedem zoom de acessibilidade em tablets
- **Severidade:** P2
- **Grupo / Rota:** A — `app/layout.tsx` (Global)
- **Arquivo:Linha:** `app/layout.tsx:20-25`
- **Viewports afetados:** `768x1024`, `820x1180`, `1024x768` (tablets touch)
- **Tema:** Ambos
- **Causa raiz exata no código lido:** O objeto `viewport` exportado em `app/layout.tsx:20-25` trava `maximumScale: 1` e `userScalable: false`, bloqueando o gesto de pinch-to-zoom em tablets touch.
- **Correção recomendada:** Remover `maximumScale: 1` e `userScalable: false`, garantindo `font-size >= 16px` nos inputs mobile/tablet para evitar zoom acidental ao digitar sem sacrificar acessibilidade.

---

#### [NB-P2-04] Tablets `< 1024px` (`768x1024`, `820x1180`): `DashboardHeader` subutilizado à esquerda e `MobileNav` sem atalhos operacionais
- **Severidade:** P2
- **Grupo / Rota:** C — `components/dashboard/dashboard-header.tsx`, `components/dashboard/sidebar.tsx`
- **Arquivo:Linha:** `components/dashboard/dashboard-header.tsx:124,134,173,286`; `components/dashboard/sidebar.tsx:389`
- **Viewports afetados:** `768x1024`, `820x1180`
- **Tema:** Ambos
- **Causa raiz exata no código lido:** Entre `768px` e `1023px`, a sidebar é substituída pela `MobileNav` (`sidebar.tsx:389`), deixando o lado esquerdo do `DashboardHeader` (`dashboard-header.tsx:124`) vazio e retirando da navegação fixa o toggle `Loja Aberta/Fechada` e o botão `+ Novo Pedido (PDV)` disponíveis na sidebar desktop. Além disso, botões icônicos do header (`L134,173,286`) dependem apenas de `title` nativo (sem tooltip visível no toque).
- **Correção recomendada:** Exibir a logo `LogoDeli` + indicador/toggle de status da loja e atalho `+ Novo Pedido` na faixa esquerda do header quando `< lg`, aproveitando a largura generosa de `768px`–`820px`.

---

#### [NB-P2-05] Marketing Academy (`768x1024`–`1024x768`): Chips de módulos usam `scrollbar-none` sem indicador de rolagem
- **Severidade:** P2
- **Grupo / Rota:** C — `app/dashboard/marketing/academy` (`academy-client.tsx`)
- **Arquivo:Linha:** `app/dashboard/marketing/academy/academy-client.tsx:139`
- **Viewports afetados:** `768x1024`, `820x1180`, `1024x768`
- **Tema:** Ambos
- **Causa raiz exata no código lido:** A barra horizontal de seleção de módulos (`L139`) aplica `overflow-x-auto scrollbar-none`, cortando os chips finais em `768px`–`1024px` sem pista visual de que a faixa pode ser arrastada lateralmente.
- **Correção recomendada:** Habilitar `flex-wrap` a partir de `md:` ou incluir gradiente/botões de rolagem lateral.
