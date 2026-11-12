---
name: skill
description: >-
  Catálogo interativo e guia rápido de todas as skills instaladas no Antigravity.
  Lista visual com comando, o que faz e quando usar cada uma sem precisar abrir pasta por pasta.
  Acionado por /skill ou /skills.
metadata:
  icon: command
---

# 📖 Guia Rápido de Comandos e Skills do Antigravity

Consulte este arquivo para saber exatamente **qual comando usar** para cada situação do seu dia a dia, sem precisar abrir pasta por pasta.

---

## ⚡ Guia Rápido: "O que você quer fazer agora?"

| Se você precisa de... | Digite este comando | O que ele vai fazer |
| :--- | :--- | :--- |
| **Remover algo da tela via print** | `/retire` | Tira do código o que estiver dentro de caixas vermelhas no print. |
| **Fazer a IA pensar mais fundo** | `/pensar` ou `/think` | Calibra o raciocínio da IA para tarefas complexas sem dar respostas rasas. |
| **Planejar uma feature antes de codar** | `/spec` ou `/spec-driven` | Cria uma especificação técnica (RFC) para alinhar escopo antes do código. |
| **Criar uma tela bonita e moderna** | `/ui-design` ou `/frontend-design` | Cria interfaces elegantes, responsivas e profissionais (anti-slop de IA). |
| **Descobrir por que um bug aconteceu** | `/rca` ou `/root-cause` | Análise de causa raiz profunda (5-Porquês) para bugs e incidentes. |
| **Escolher entre duas ideias ou tecnologias** | `/matrix` ou `/decision` | Monta uma matriz comparativa com notas e critérios para decidir com segurança. |
| **Testar se uma solução tem falhas ocultas** | `/doubt` ou `/advogado-do-diabo`| Age como advogado do diabo, tentando achar falhas e quebrar a solução proposta. |
| **Destrinchar uma ideia vaga ou confusa** | `/grill-me` ou `/interview-me` | Faz perguntas investigativas para extrair detalhes que você ainda não definiu. |
| **Resolver um problema em etapas lógicas** | `/seq` ou `/sequential-thinking` | Raciocínio passo a passo com ramificações e revisão de premissas. |
| **Pesquisar a fundo na internet** | `/pesquisa` ou `/deep-research` | Varredura profunda no Google cruzando 3 fontes independentes com fatos. |
| **Limpar ou tratar uma planilha/banco** | `/dados` ou `/data` | Higieniza, cruza e analisa dados brutos de CSV, JSON ou tabelas SQL. |
| **Criar ou formatar Word, Excel ou PDF** | `/office` ou `/docx` / `/xlsx` | Gera arquivos profissionais de escritório do pacote Office e PDFs. |
| **Criar paleta de cores harmoniosa** | `/palette` ou `/theme` | Gera sistema de cores equilibrado com checagem de contraste acessível (WCAG). |
| **Criar arte, ilustrações SVG ou Canvas** | `/art` ou `/svg` | Desenha gráficos vetoriais, arte generativa e diagramas matemáticos. |
| **Criar ou integrar um servidor MCP** | `/mcp` ou `/mcp-builder` | Cria e valida novos servidores Model Context Protocol para o Antigravity. |
| **Padronizar texto institucional da marca** | `/brand` ou `/comms` | Padroniza tom de voz corporativo, mensagens institucionais e liderança. |
| **Escrever proposta, artigo ou documento** | `/coauthor` ou `/doc` | Fluxo estruturado em 3 etapas para criar documentos técnicos ou executivos. |
| **Ver este catálogo na tela** | `/skill` ou `/skills` | Mostra esta lista completa para consulta rápida no chat. |

---

## 🎨 1. Telas, Design & Interface

### `/retire` — Remoção por Marcação Vermelha
- **O que faz:** Remove botões, textos, modais, cards ou blocos inteiros que você desenhou ou circulou em **vermelho** em uma captura de tela.
- **Quando usar:** Quando você tira um print da tela, desenha um retângulo vermelho no Paint/Figma e manda no chat dizendo: *"tira isso pra mim"*.
- **Arquivo da skill:** [`retire/SKILL.md`](file:///C:/Users/rafae/.gemini/config/skills/retire/SKILL.md)

### `/frontend-design` ou `/ui-design` — Design de Interface Autoral
- **O que faz:** Orienta a construção de interfaces com identidade visual forte, excelente hierarquia tipográfica, microinterações e estética refinada.
- **Quando usar:** Ao criar telas novas ou redesenhar telas existentes para evitar componentes genéricos e "caras de template de IA".
- **Arquivo da skill:** [`frontend-design/SKILL.md`](file:///C:/Users/rafae/.gemini/config/skills/frontend-design/SKILL.md)

### `/theme-factory`, `/palette` ou `/cores` — Fábrica de Cores & Design Tokens
- **O que faz:** Gera esquemas de cores harmoniosos (primária, secundária, superfície, neutros) e valida contraste de acessibilidade WCAG (AA/AAA).
- **Quando usar:** Ao definir a paleta de um projeto, modo escuro/claro, ou ajustar cores de botões para garantir leitura perfeita.
- **Arquivo da skill:** [`theme-factory/SKILL.md`](file:///C:/Users/rafae/.gemini/config/skills/theme-factory/SKILL.md)

### `/algorithmic-art`, `/art`, `/svg` ou `/canvas` — Arte Generativa & Gráficos SVG
- **O que faz:** Produz arte generativa, diagramas visuais e ilustrações vetoriais diretas em SVG, HTML5 Canvas ou p5.js.
- **Quando usar:** Para criar ilustrações customizadas, gráficos matemáticos, backgrounds decorativos ou ícones vetoriais sob medida.
- **Arquivo da skill:** [`algorithmic-art/SKILL.md`](file:///C:/Users/rafae/.gemini/config/skills/algorithmic-art/SKILL.md)

---

## 🧠 2. Raciocínio, Decisão & Calibração da IA

### `/pensar` ou `/think` — Calibração Dinâmica de Raciocínio
- **O que faz:** Avalia a complexidade da tarefa (Tiers 1 a 5) e força a IA a gastar o tempo de raciocínio necessário antes de dar uma resposta.
- **Quando usar:** Sempre que a tarefa for crítica (banco de dados, autenticação, arquitetura) e você quiser garantir que a IA não dê uma resposta rasa ou afobada.
- **Arquivo da skill:** [`pensar/SKILL.md`](file:///C:/Users/rafae/.gemini/config/skills/pensar/SKILL.md)

### `/doubt-driven`, `/doubt` ou `/advogado-do-diabo` — Falseamento Crítico
- **O que faz:** Assume o papel de "advogado do diabo" para caçar ativamente furos, vulnerabilidades, premissas erradas e casos de borda que podem quebrar sua ideia.
- **Quando usar:** Antes de aprovar uma arquitetura, regra de negócio ou migração importante, perguntando: *"o que pode dar errado aqui?"*.
- **Arquivo da skill:** [`doubt-driven/SKILL.md`](file:///C:/Users/rafae/.gemini/config/skills/doubt-driven/SKILL.md)

### `/decision-matrix`, `/matrix` ou `/decisao` — Matriz de Decisão Ponderada
- **O que faz:** Compara 2 ou mais opções lado a lado em uma tabela com notas, pesos e análise por primeiros princípios.
- **Quando usar:** Quando você estiver na dúvida entre duas tecnologias, bibliotecas ou estratégias de produto e precisar de clareza matemática para escolher.
- **Arquivo da skill:** [`decision-matrix/SKILL.md`](file:///C:/Users/rafae/.gemini/config/skills/decision-matrix/SKILL.md)

### `/sequential-thinking` ou `/seq` — Raciocínio Sequencial Passo a Passo
- **O que faz:** Divide problemas lógicos complexos em etapas lineares e ramificadas, conferindo hipóteses e corrigindo o rumo conforme descobre novidades.
- **Quando usar:** Para resolver quebra-cabeças lógicos difíceis, problemas matemáticos ou investigações com muitas peças móveis.
- **Arquivo da skill:** [`sequential-thinking/SKILL.md`](file:///C:/Users/rafae/.gemini/config/skills/sequential-thinking/SKILL.md)

---

## ⚙️ 3. Planejamento, Engenharia & Resolução de Bugs

### `/spec-driven` ou `/spec` — Engenharia Orientada a Especificação
- **O que faz:** Cria uma especificação técnica formal (RFC / Design Doc) detalhando requisitos, banco de dados, fluxos e riscos ANTES de encostar no código.
- **Quando usar:** Antes de iniciar qualquer feature média ou grande para garantir que o plano foi 100% aprovado antes da execução.
- **Arquivo da skill:** [`spec-driven/SKILL.md`](file:///C:/Users/rafae/.gemini/config/skills/spec-driven/SKILL.md)

### `/interview-me`, `/grill-me` ou `/pergunte` — Entrevista Investigativa de Requisitos
- **O que faz:** Faz perguntas diretas e inteligentes a você para extrair regras de negócio, limites e premissas ocultas que ainda não foram ditas.
- **Quando usar:** Quando você tem uma ideia na cabeça mas não sabe como detalhar tudo de uma vez. A IA te entrevista para montar o escopo junto com você.
- **Arquivo da skill:** [`interview-me/SKILL.md`](file:///C:/Users/rafae/.gemini/config/skills/interview-me/SKILL.md)

### `/root-cause-analysis`, `/rca` ou `/root-cause` — Análise de Causa Raiz
- **O que faz:** Aplica técnicas formais de engenharia (como 5-Porquês e diagrama de causa e efeito) para achar a origem real de uma falha ou bug grave.
- **Quando usar:** Quando um erro quebra algo importante em produção ou volta a acontecer repetidamente e você precisa exterminar a causa raiz.
- **Arquivo da skill:** [`root-cause-analysis/SKILL.md`](file:///C:/Users/rafae/.gemini/config/skills/root-cause-analysis/SKILL.md)

### `/mcp-builder` ou `/mcp` — Construtor de Servidores MCP
- **O que faz:** Auxilia na criação, tipagem TypeScript/Python e testes de servidores Model Context Protocol para plugar novas ferramentas externas ao Antigravity.
- **Quando usar:** Ao criar integrações de MCP personalizadas para conectar o assistente a sistemas legados, APIs internas ou bancos locais.
- **Arquivo da skill:** [`mcp-builder/SKILL.md`](file:///C:/Users/rafae/.gemini/config/skills/mcp-builder/SKILL.md)

---

## 🔍 4. Pesquisa & Análise de Dados

### `/deep-research` ou `/pesquisa` — Pesquisa Aprofundada na Web
- **O que faz:** Faz buscas exaustivas, cruza dados de pelo menos 3 fontes confiáveis, verifica dados factuais e monta um relatório executivo sintetizado.
- **Quando usar:** Para estudar concorrentes, encontrar dados de mercado, comparar soluções técnicas recentes ou verificar novidades de bibliotecas.
- **Arquivo da skill:** [`deep-research/SKILL.md`](file:///C:/Users/rafae/.gemini/config/skills/deep-research/SKILL.md)

### `/data-wrangler`, `/data` ou `/dados` — Tratamento e Limpeza de Dados
- **O que faz:** Inspeciona bases em CSV, JSON, Parquet ou tabelas SQL para encontrar valores nulos, discrepâncias (outliers), duplicatas e gerar métricas.
- **Quando usar:** Ao receber planilhas desorganizadas, arquivos de exportação com erro de formatação ou quando precisar calcular resumos analíticos.
- **Arquivo da skill:** [`data-wrangler/SKILL.md`](file:///C:/Users/rafae/.gemini/config/skills/data-wrangler/SKILL.md)

---

## 📝 5. Documentos Executivos, Textos & Office

### `/office-suite`, `/office`, `/docx`, `/xlsx` ou `/pdf` — Automação Office
- **O que faz:** Manipula e gera deterministamente arquivos do Microsoft Word (.docx), planilhas do Excel (.xlsx), apresentações PowerPoint (.pptx) e relatórios em PDF.
- **Quando usar:** Para criar relatórios executivos formatados, planilhas financeiras com fórmulas ou slides prontos para reunião.
- **Arquivo da skill:** [`office-suite/SKILL.md`](file:///C:/Users/rafae/.gemini/config/skills/office-suite/SKILL.md)

### `/doc-coauthoring`, `/coauthor` ou `/doc` — Coautoria Estruturada de Documentos
- **O que faz:** Guia a criação de propostas, artigos e relatórios técnicos em 3 etapas sequenciais (1: Contexto e audiência; 2: Esqueleto; 3: Escrita refinada).
- **Quando usar:** Para escrever propostas comerciais, artigos técnicos ou manuais garantindo alta densidade e foco sem enrolação.
- **Arquivo da skill:** [`doc-coauthoring/SKILL.md`](file:///C:/Users/rafae/.gemini/config/skills/doc-coauthoring/SKILL.md)

### `/brand-guidelines`, `/brand` ou `/comms` — Comunicação & Voz da Marca
- **O que faz:** Padroniza textos seguindo o método BLUF (ponto principal logo no início), voz institucional executiva e sem chavões corporativos vazios.
- **Quando usar:** Para redigir comunicados de liderança, e-mails importantes para clientes ou textos institucionais que precisam passar autoridade.
- **Arquivo da skill:** [`brand-guidelines/SKILL.md`](file:///C:/Users/rafae/.gemini/config/skills/brand-guidelines/SKILL.md)

---

## 🛠️ 6. Especialistas de Código & Projeto (DeliPlus)

Estas skills contêm as regras arquiteturais específicas do repositório DeliPlus:

| Especialidade | O que orienta | Arquivo de Regras |
| :--- | :--- | :--- |
| **Supabase / Postgres** | Migrations semânticas, views de domínio, regras de RLS seguras, RPCs transacionais e performance de banco. | [`supabase-postgres-best-practices`](file:///c:/Users/rafae/.gemini/antigravity/scratch/deliplus.com.br/.agents/skills/supabase-postgres-best-practices/SKILL.md) |
| **Next.js & React** | Otimização no App Router, Server Components vs Client Components, bundle splitting e boas práticas da Vercel. | [`vercel-react-best-practices`](file:///c:/Users/rafae/.gemini/antigravity/scratch/deliplus.com.br/.agents/skills/vercel-react-best-practices/SKILL.md) |
| **shadcn/ui & Base UI** | Adição de componentes, estilização Tailwind v4, acessibilidade Radix/Base UI e padrões de formulário. | [`shadcn`](file:///c:/Users/rafae/.gemini/antigravity/scratch/deliplus.com.br/.agents/skills/shadcn/SKILL.md) |
| **Clerk Auth & Tenancy** | Multi-tenancy por Organizations, sessão autenticada, papeis de lojista e isolamento de lojas. | [`clerk`](file:///c:/Users/rafae/.gemini/antigravity/scratch/deliplus.com.br/.agents/skills/clerk/SKILL.md) |
| **Stripe Billing** | Checkout Sessions, planos de assinatura (Essential, Duo, Trio), webhooks seguros e limites de lojas. | [`stripe-best-practices`](file:///c:/Users/rafae/.gemini/antigravity/scratch/deliplus.com.br/.agents/skills/stripe-best-practices/SKILL.md) |
