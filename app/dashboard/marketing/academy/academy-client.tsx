"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Camera,
  BookOpen,
  Layers,
  MessageSquare,
  Sparkles,
  Copy,
  Check,
  Clock,
  HeartHandshake
} from "lucide-react";

interface CopyScript {
  id: string;
  title: string;
  bestTime: string;
  target: string;
  body: string;
}

const WHATSAPP_SCRIPTS: CopyScript[] = [
  {
    id: "script-1",
    title: "Sextou com Desconto no Cardápio",
    bestTime: "Sexta-feira entre 18h15 e 19h00",
    target: "Lista de transmissão ou grupos de clientes",
    body: `🔥 SEXTOU POR AQUI! Nada de cozinhar hoje, né?

Preparamos uma condição exclusiva pra você que é nosso cliente VIP:

🍔 Peça qualquer burger/prato do nosso cardápio e ganhe 10% OFF com o cupom SEXTOU10!

👉 Faça seu pedido agora sem taxas abusivas pelo link:
{LINK_DA_LOJA}

🚨 Atenção: Cupom válido apenas para os primeiros 30 pedidos desta noite!`
  },
  {
    id: "script-2",
    title: "Alerta de Almoço Prático & Rápido",
    bestTime: "Segunda a sexta entre 11h15 e 11h45",
    target: "Clientes de empresas e trabalhadores locais",
    body: `Bateu aquela fome do almoço? 🍽️

Nosso cardápio do dia já está a todo vapor! Comida caseira fresquinha, embalada com carinho e entrega super rápida até sua casa ou escritório.

🛵 Peça agora com entrega rápida pelo link direto:
{LINK_DA_LOJA}

Bom apetite e ótimo dia de trabalho! ✨`
  },
  {
    id: "script-3",
    title: "Reativação de Clientes Sumidos (Saudades!)",
    bestTime: "Terça ou quarta-feira às 18h30",
    target: "Clientes que não pedem há mais de 15 dias",
    body: `Oi, sumido(a)! Tudo bem com você? 🥰

Notamos que já faz um tempinho desde a última vez que você pediu com a gente e ficamos com saudades!

Para você matar a vontade hoje, preparamos um presente especial:
🎁 R$ 12,00 de desconto no seu pedido usando o cupom: VOLTEI12!

👉 Clique aqui e escolha seus favoritos:
{LINK_DA_LOJA}

Válido até domingo!`
  },
  {
    id: "script-4",
    title: "Lançamento de Novo Prato / Novidade",
    bestTime: "Quinta ou domingo às 18h45",
    target: "Todos os clientes cadastrados",
    body: `NOVIDADE FRESQUINHA NO NOSSO CARDÁPIO! 🚀😋

Depois de muitos testes na cozinha, acabamos de lançar nosso novo prato oficial! Está simplesmente surreal de saboroso.

Quer ser um dos primeiros a experimentar com preço promocional de lançamento?

👉 Acesse nosso cardápio e confira:
{LINK_DA_LOJA}

Corre antes que acabe a primeira fornada do dia!`
  }
];

export default function AcademyClient() {
  const [activeModule, setActiveModule] = useState<string>("all");
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScriptId(id);
    setTimeout(() => setCopiedScriptId(null), 2500);
  };

  return (
    <div className="flex-1 bg-[#F7F6F2] dark:bg-[#131A15] min-h-screen text-[#1A241E] dark:text-[#F2EFE9] p-4 sm:p-6 lg:p-8 transition-colors duration-150">
      <div className="w-full">
        {/* ============================================================ */}
        {/* HERO BANNER                                                  */}
        {/* ============================================================ */}
        <div className="bg-gradient-to-br from-[#253629] via-[#2F4434] to-[#1E2B20] text-white rounded-[26px] p-6 sm:p-8 lg:p-10 shadow-sm mb-8 relative overflow-hidden border border-white/5 dark:border-[#2A382E]">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-semibold bg-white/10 text-white backdrop-blur-sm mb-4">
              <GraduationCap size={15} />
              <span>Academia Deli • Como Vender Mais</span>
            </div>

            <h1 className="font-serif text-[32px] sm:text-[42px] lg:text-[46px] font-semibold text-white tracking-tight leading-tight mb-3">
              O Guia Definitivo de Vendas para Food Delivery
            </h1>

            <p className="text-[14px] sm:text-[16px] text-white/80 leading-relaxed mb-6">
              Aprenda as técnicas comprovadas que os maiores restaurantes usam para transformar visualizações em pedidos diários: fotografia com celular, copywriting salivatório, adicionais lucrativos e mensagens prontas para WhatsApp.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-[13px] text-white/90">
              <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-xl backdrop-blur-xs">
                <Sparkles size={16} className="text-[#CB5A3C]" />
                <span>5 Módulos Práticos</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-xl backdrop-blur-xs">
                <MessageSquare size={16} className="text-[#2E7D32]" />
                <span>4 Scripts Prontos de WhatsApp</span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* QUICK NAVIGATION TABS                                        */}
        {/* ============================================================ */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveModule("all")}
            className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeModule === "all"
                ? "bg-[#253629] dark:bg-[#2A3F30] text-white shadow-sm border border-transparent dark:border-[#3D5A45]"
                : "bg-white dark:bg-[#1B241E] border border-[#E3E1D9] dark:border-[#2A382E] text-[#556358] dark:text-[#9CA79E] hover:bg-[#F4F3ED] dark:hover:bg-[#25332A]"
            }`}
          >
            Todos os Conteúdos
          </button>
          <button
            type="button"
            onClick={() => setActiveModule("photo")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeModule === "photo"
                ? "bg-[#253629] dark:bg-[#2A3F30] text-white shadow-sm border border-transparent dark:border-[#3D5A45]"
                : "bg-white dark:bg-[#1B241E] border border-[#E3E1D9] dark:border-[#2A382E] text-[#556358] dark:text-[#9CA79E] hover:bg-[#F4F3ED] dark:hover:bg-[#25332A]"
            }`}
          >
            <Camera size={14} />
            <span>1. Foto com Celular</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveModule("copy")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeModule === "copy"
                ? "bg-[#253629] dark:bg-[#2A3F30] text-white shadow-sm border border-transparent dark:border-[#3D5A45]"
                : "bg-white dark:bg-[#1B241E] border border-[#E3E1D9] dark:border-[#2A382E] text-[#556358] dark:text-[#9CA79E] hover:bg-[#F4F3ED] dark:hover:bg-[#25332A]"
            }`}
          >
            <BookOpen size={14} />
            <span>2. Copywriting do Prato</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveModule("complements")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeModule === "complements"
                ? "bg-[#253629] dark:bg-[#2A3F30] text-white shadow-sm border border-transparent dark:border-[#3D5A45]"
                : "bg-white dark:bg-[#1B241E] border border-[#E3E1D9] dark:border-[#2A382E] text-[#556358] dark:text-[#9CA79E] hover:bg-[#F4F3ED] dark:hover:bg-[#25332A]"
            }`}
          >
            <Layers size={14} />
            <span>3. Lucro com Adicionais</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveModule("scripts")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeModule === "scripts"
                ? "bg-[#253629] dark:bg-[#2A3F30] text-white shadow-sm border border-transparent dark:border-[#3D5A45]"
                : "bg-white dark:bg-[#1B241E] border border-[#E3E1D9] dark:border-[#2A382E] text-[#556358] dark:text-[#9CA79E] hover:bg-[#F4F3ED] dark:hover:bg-[#25332A]"
            }`}
          >
            <MessageSquare size={14} />
            <span>4. Scripts de WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveModule("retention")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeModule === "retention"
                ? "bg-[#253629] dark:bg-[#2A3F30] text-white shadow-sm border border-transparent dark:border-[#3D5A45]"
                : "bg-white dark:bg-[#1B241E] border border-[#E3E1D9] dark:border-[#2A382E] text-[#556358] dark:text-[#9CA79E] hover:bg-[#F4F3ED] dark:hover:bg-[#25332A]"
            }`}
          >
            <HeartHandshake size={14} />
            <span>5. Migrar do iFood</span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* MÓDULO 1: FOTOGRAFIA GASTRONÔMICA COM CELULAR                */}
        {/* ============================================================ */}
        {(activeModule === "all" || activeModule === "photo") && (
          <div className="bg-white dark:bg-[#1E2922] border border-[#E3E1D9] dark:border-[#2A382E] rounded-[24px] p-6 sm:p-8 shadow-xs mb-8 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center font-bold">
                <Camera size={24} />
              </div>
              <div>
                <span className="text-[12px] font-bold uppercase tracking-wider text-[#2E7D32]">
                  Módulo 1
                </span>
                <h2 className="font-serif text-[24px] sm:text-[26px] font-semibold text-[#1A241E] dark:text-white">
                  Fotografia Gastronômica que Vende com o Celular
                </h2>
              </div>
            </div>

            <p className="text-[14px] text-[#556358] dark:text-white leading-relaxed mb-6">
              O cliente no food delivery come primeiro com os olhos. Um prato com foto real e apetitosa vende até <strong>3.4 vezes mais</strong> do que pratos sem foto. Você não precisa de câmera profissional nem iluminação cara: o seu smartphone é suficiente!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              {/* Técnica 1 */}
              <div className="p-5 rounded-2xl border border-[#ECEAE2] dark:border-[#3D5444] bg-[#FAF8F0] dark:bg-[#28382D]">
                <div className="text-[20px] mb-2">🪟</div>
                <h3 className="font-bold text-[16px] text-[#1A241E] dark:text-white mb-1">
                  A Regra da Janela Lateral
                </h3>
                <p className="text-[13px] text-[#556358] dark:text-white leading-relaxed">
                  Nunca use o flash do celular (ele achata o prato e tira a cor natural). Coloque o prato em uma mesa ao lado de uma janela com luz natural suave vindo de lado. A luz lateral cria sombras suaves que dão textura e profundidade ao alimento.
                </p>
              </div>

              {/* Técnica 2 */}
              <div className="p-5 rounded-2xl border border-[#ECEAE2] dark:border-[#3D5444] bg-[#FAF8F0] dark:bg-[#28382D]">
                <div className="text-[20px] mb-2">📐</div>
                <h3 className="font-bold text-[16px] text-[#1A241E] dark:text-white mb-1">
                  Os Ângulos Perfeitos
                </h3>
                <ul className="text-[13px] text-[#556358] dark:text-white space-y-1.5 leading-relaxed">
                  <li><strong>45 Graus:</strong> O ângulo dos olhos de quem está sentado. Ideal para hambúrgueres, copos de açaí e taças.</li>
                  <li><strong>90 Graus (Top-down):</strong> Vista de cima para pizzas inteiras, tábuas e combos.</li>
                </ul>
              </div>

              {/* Técnica 3 */}
              <div className="p-5 rounded-2xl border border-[#ECEAE2] dark:border-[#3D5444] bg-[#FAF8F0] dark:bg-[#28382D]">
                <div className="text-[20px] mb-2">🧈</div>
                <h3 className="font-bold text-[16px] text-[#1A241E] dark:text-white mb-1">
                  Segredos de Food Styling
                </h3>
                <ul className="text-[13px] text-[#556358] dark:text-white space-y-1.5 leading-relaxed">
                  <li><strong>Brilho fresco:</strong> Passe um pincel com um fio de azeite na carne antes de bater a foto.</li>
                  <li><strong>Puxa-queijo:</strong> Puxe o pedaço de pizza ou queijo quente enquanto o vapor ainda sobe.</li>
                  <li><strong>Toque de verde:</strong> Salpique cebolinha ou salsa fresca para dar contraste.</li>
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50/60 dark:bg-[#382023] text-[13px] text-red-900 dark:text-white flex items-start gap-3">
              <span className="text-red-600 font-bold text-[16px]">⚠️</span>
              <div>
                <strong>Erros que espantam clientes:</strong> Fotos com fundos bagunçados da pia ou da cozinha industrial, pratos com borda suja de molho e fotos baixadas do Google. Fotos baixadas quebram a expectativa quando o pedido chega diferente em casa!
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MÓDULO 2: COPYWRITING & TEXTOS DE PRATOS                     */}
        {/* ============================================================ */}
        {(activeModule === "all" || activeModule === "copy") && (
          <div className="bg-white dark:bg-[#1E2922] border border-[#E3E1D9] dark:border-[#2A382E] rounded-[24px] p-6 sm:p-8 shadow-xs mb-8 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF3E0] text-[#E65100] flex items-center justify-center font-bold">
                <BookOpen size={24} />
              </div>
              <div>
                <span className="text-[12px] font-bold uppercase tracking-wider text-[#E65100]">
                  Módulo 2
                </span>
                <h2 className="font-serif text-[24px] sm:text-[26px] font-semibold text-[#1A241E] dark:text-white">
                  Textos que Dão Água na Boca (Copywriting Gastronômico)
                </h2>
              </div>
            </div>

            <p className="text-[14px] text-[#556358] dark:text-white leading-relaxed mb-6">
              A descrição do prato tem duas missões: <strong>ativar as papilas gustativas do cliente</strong> e <strong>justificar o preço</strong>. Quanto melhor a descrição, menos o cliente reclama do valor!
            </p>

            {/* Fórmula de Ouro */}
            <div className="bg-[#FAF8F0] dark:bg-[#28382D] border border-[#ECEAE2] dark:border-[#3D5444] p-4 rounded-2xl mb-6">
              <div className="font-bold text-[14px] text-[#1A241E] dark:text-white mb-1 flex items-center gap-2">
                <Sparkles size={16} className="text-[#CB5A3C]" />
                <span>A Fórmula da Descrição Perfeita:</span>
              </div>
              <div className="font-mono text-[13px] text-[#253629] dark:text-white font-medium">
                [Nome Apetitoso] + [Ingrediente Nobre] + [Método de Preparo Artesanal] + [Sensação/Acompanhamento]
              </div>
            </div>

            {/* 4 Comparativos Antes vs Depois */}
            <div className="space-y-4 mb-6">
              <h3 className="font-bold text-[16px] text-[#1A241E] dark:text-[#F2EFE9]">
                Exemplos Reais Antes vs. Depois por Nicho:
              </h3>

              {/* Nicho 1: Hamburgueria */}
              <div className="border border-[#ECEAE2] dark:border-[#3D5444] rounded-2xl p-4 bg-white dark:bg-[#161F18] grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-red-200 dark:border-red-700/60 bg-red-50 dark:bg-[#382023] text-[13px]">
                  <div className="text-red-700 dark:text-[#FF8F94] font-bold mb-1">❌ Hambúrguer: Como NÃO escrever</div>
                  <p className="text-red-950 dark:text-white italic">&ldquo;X-Bacon: pão, carne 160g, queijo, bacon e molho.&rdquo;</p>
                  <span className="text-[11px] text-red-600 dark:text-red-300 block mt-2">Frio, genérico e não justifica o preço de R$ 38.</span>
                </div>
                <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-700/60 bg-emerald-50 dark:bg-[#1E3827] text-[13px]">
                  <div className="text-emerald-800 dark:text-[#52E098] font-bold mb-1"> Como escrever para vender</div>
                  <p className="text-emerald-950 dark:text-white font-medium">
                    &ldquo;Smash Burger Artesanal (160g) tostado na chapa bem quente, queijo cheddar inglês derretido, tiras crocantes de bacon defumado e nossa maionese secreta da casa no pão brioche dourado na manteiga.&rdquo;
                  </p>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block mt-2">Dá água na boca e justifica o valor alto!</span>
                </div>
              </div>

              {/* Nicho 2: Pizzaria */}
              <div className="border border-[#ECEAE2] dark:border-[#3D5444] rounded-2xl p-4 bg-white dark:bg-[#161F18] grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-red-200 dark:border-red-700/60 bg-red-50 dark:bg-[#382023] text-[13px]">
                  <div className="text-red-700 dark:text-[#FF8F94] font-bold mb-1">❌ Pizzaria: Como NÃO escrever</div>
                  <p className="text-red-950 dark:text-white italic">&ldquo;Pizza Calabresa: massa, molho, mussarela e calabresa fatiada.&rdquo;</p>
                </div>
                <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-700/60 bg-emerald-50 dark:bg-[#1E3827] text-[13px]">
                  <div className="text-emerald-800 dark:text-[#52E098] font-bold mb-1"> Como escrever para vender</div>
                  <p className="text-emerald-950 dark:text-white font-medium">
                    &ldquo;Calabresa Artesanal Defumada fatiada ultrafina sobre queijo mussarela gratinado, cebola roxa marinada no azeite extravirgem, orégano fresco e nosso molho rústico de tomates pelati italianos.&rdquo;
                  </p>
                </div>
              </div>

              {/* Nicho 3: Açaí & Sobremesas */}
              <div className="border border-[#ECEAE2] dark:border-[#3D5444] rounded-2xl p-4 bg-white dark:bg-[#161F18] grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-red-200 dark:border-red-700/60 bg-red-50 dark:bg-[#382023] text-[13px]">
                  <div className="text-red-700 dark:text-[#FF8F94] font-bold mb-1">❌ Açaí / Doce: Como NÃO escrever</div>
                  <p className="text-red-950 dark:text-white italic">&ldquo;Copo de açaí 500ml com leite em pó, morango e banana.&rdquo;</p>
                </div>
                <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-700/60 bg-emerald-50 dark:bg-[#1E3827] text-[13px]">
                  <div className="text-emerald-800 dark:text-[#52E098] font-bold mb-1"> Como escrever para vender</div>
                  <p className="text-emerald-950 dark:text-white font-medium">
                    &ldquo;Açaí Tradicional Amazônico 500ml batido cremoso e aveludado na consistência ideal (sem xarope artificial), intercalado com farto Leite Ninho original, morangos frescos fatiados e banana dourada.&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* Banco de Palavras Magnéticas */}
            <div className="p-4 rounded-xl border border-[#ECEAE2] dark:border-[#3D5444] bg-[#FAF8F0] dark:bg-[#28382D]">
              <span className="font-bold text-[13px] text-[#1A241E] dark:text-white block mb-2">
                🧲 Palavras Magnéticas de Salivação (Use no seu Cardápio):
              </span>
              <div className="flex flex-wrap gap-2 text-[12px]">
                {["Artesanal", "Crocante", "Derretido na chapa", "Defumado na lenha", "Feito do zero", "Dourado na manteiga", "Fresco da horta", "Suculento", "Caramelizado", "Cremoso"].map((word) => (
                  <span key={word} className="px-2.5 py-1 bg-white dark:bg-[#34483B] border border-[#E3E1D9] dark:border-[#4B6653] rounded-lg font-medium text-[#2E4233] dark:text-white">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MÓDULO 3: ESTRATÉGIA DOS ADICIONAIS LUCRATIVOS               */}
        {/* ============================================================ */}
        {(activeModule === "all" || activeModule === "complements") && (
          <div className="bg-white dark:bg-[#1E2922] border border-[#E3E1D9] dark:border-[#2A382E] rounded-[24px] p-6 sm:p-8 shadow-xs mb-8 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EDE7F6] text-[#512DA8] flex items-center justify-center font-bold">
                <Layers size={24} />
              </div>
              <div>
                <span className="text-[12px] font-bold uppercase tracking-wider text-[#512DA8]">
                  Módulo 3
                </span>
                <h2 className="font-serif text-[24px] sm:text-[26px] font-semibold text-[#1A241E] dark:text-white">
                  A Estratégia dos Adicionais Lucrativos (Cross-selling)
                </h2>
              </div>
            </div>

            <p className="text-[14px] text-[#556358] dark:text-white leading-relaxed mb-6">
              A promoção do prato principal é o chamariz para atrair o clique. <strong>O lucro real do restaurante mora nos adicionais!</strong> Enquanto o prato principal tem margem de 25% a 30%, os complementos têm margem de <strong>70% a 85%</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              <div className="p-5 rounded-2xl border border-[#ECEAE2] dark:border-[#3D5444] bg-[#FAF8F0] dark:bg-[#28382D]">
                <div className="text-[#CB5A3C] font-bold text-[14px] mb-1">1. Adicional de Indulgência</div>
                <h4 className="font-bold text-[16px] text-[#1A241E] dark:text-white mb-2">+ R$ 6 a R$ 9</h4>
                <p className="text-[13px] text-[#556358] dark:text-white leading-relaxed">
                  Dobro de queijo, tiras extras de bacon crocante, molho especial da casa. O cliente já economizou no prato promocional e investe essa economia no sabor extra!
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-[#ECEAE2] dark:border-[#3D5444] bg-[#FAF8F0] dark:bg-[#28382D]">
                <div className="text-[#2E7D32] font-bold text-[14px] mb-1">2. Adicional de Hidratação</div>
                <h4 className="font-bold text-[16px] text-[#1A241E] dark:text-white mb-2">+ R$ 6 a R$ 10</h4>
                <p className="text-[13px] text-[#556358] dark:text-white leading-relaxed">
                  Refrigerante lata gelada, suco natural da fruta, chá da casa. Quase todo cliente bebe algo enquanto come. Se estiver fácil no cardápio, ele adiciona sem pensar duas vezes.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-[#ECEAE2] dark:border-[#3D5444] bg-[#FAF8F0] dark:bg-[#28382D]">
                <div className="text-[#512DA8] font-bold text-[14px] mb-1">3. Adicional de Fechamento</div>
                <h4 className="font-bold text-[16px] text-[#1A241E] dark:text-white mb-2">+ R$ 8 a R$ 14</h4>
                <p className="text-[13px] text-[#556358] dark:text-white leading-relaxed">
                  Mini brownie artesanal, batata frita média, sobremesa do dia. Eleva o ticket médio final de R$ 35 para R$ 52 com zero esforço de atendimento.
                </p>
              </div>
            </div>

            <div className="bg-[#FAF8F0] dark:bg-[#28382D] border border-[#ECEAE2] dark:border-[#3D5444] p-5 rounded-2xl flex items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-[15px] text-[#1A241E] dark:text-white">
                  Configure os adicionais dos seus pratos agora mesmo
                </h4>
                <p className="text-[13px] text-[#637267] dark:text-white">
                  No menu Cardápio do DeliPlus, você pode vincular grupos de adicionais obrigatórios ou opcionais a qualquer prato em menos de 1 minuto.
                </p>
              </div>
              <Link
                href="/dashboard/menu"
                className="shrink-0 bg-[#253629] dark:bg-[#2A3F30] hover:bg-[#1E2C21] dark:hover:bg-[#344E3C] text-white font-semibold text-[13px] px-4 py-2.5 rounded-xl border border-transparent dark:border-[#3D5A45] transition-all"
              >
                Ir para o Cardápio
              </Link>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MÓDULO 4: SCRIPTS PRONTOS DE WHATSAPP                        */}
        {/* ============================================================ */}
        {(activeModule === "all" || activeModule === "scripts") && (
          <div className="bg-white dark:bg-[#1E2922] border border-[#E3E1D9] dark:border-[#2A382E] rounded-[24px] p-6 sm:p-8 shadow-xs mb-8 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold">
                <MessageSquare size={24} />
              </div>
              <div>
                <span className="text-[12px] font-bold uppercase tracking-wider text-[#0284C7]">
                  Módulo 4
                </span>
                <h2 className="font-serif text-[24px] sm:text-[26px] font-semibold text-[#1A241E] dark:text-white">
                  Scripts de WhatsApp Prontos para Copiar e Enviar
                </h2>
              </div>
            </div>

            <p className="text-[14px] text-[#556358] dark:text-white leading-relaxed mb-6">
              O WhatsApp tem taxa de abertura de <strong>98%</strong>. Use estes modelos testados de mensagens nas suas listas de transmissão e status. Basta clicar em <strong>&ldquo;Copiar Mensagem&rdquo;</strong> e disparar no horário recomendado!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {WHATSAPP_SCRIPTS.map((s) => (
                <div
                  key={s.id}
                  className="p-5 rounded-2xl border border-[#ECEAE2] dark:border-[#3D5444] bg-[#FAF8F0] dark:bg-[#28382D] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-[16px] text-[#1A241E] dark:text-white">
                        {s.title}
                      </h3>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-transparent dark:border-blue-800/40 flex items-center gap-1">
                        <Clock size={12} />
                        {s.bestTime}
                      </span>
                    </div>

                    <div className="text-[12px] text-[#637267] dark:text-white mb-3">
                      <strong>Público recomendado:</strong> {s.target}
                    </div>

                    <div className="bg-white dark:bg-[#1E2922] border border-[#E3E1D9] dark:border-[#3D5444] p-3.5 rounded-xl text-[13px] text-[#253629] dark:text-white font-sans whitespace-pre-line leading-relaxed mb-4 select-all">
                      {s.body}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(s.body, s.id)}
                    className="w-full flex items-center justify-center gap-2 bg-[#253629] dark:bg-[#2A3F30] hover:bg-[#1E2C21] dark:hover:bg-[#344E3C] text-white font-semibold text-[13px] py-2.5 rounded-xl border border-transparent dark:border-[#3D5A45] transition-all cursor-pointer shadow-sm"
                  >
                    {copiedScriptId === s.id ? (
                      <>
                        <Check size={16} className="text-emerald-400" />
                        <span>Mensagem Copiada com Sucesso!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>Copiar Mensagem Pronta</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MÓDULO 5: COMO MIGRAR CLIENTES DO IFOOD                      */}
        {/* ============================================================ */}
        {(activeModule === "all" || activeModule === "retention") && (
          <div className="bg-white dark:bg-[#1E2922] border border-[#E3E1D9] dark:border-[#2A382E] rounded-[24px] p-6 sm:p-8 shadow-xs mb-8 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FCE4EC] text-[#C2185B] flex items-center justify-center font-bold">
                <HeartHandshake size={24} />
              </div>
              <div>
                <span className="text-[12px] font-bold uppercase tracking-wider text-[#C2185B]">
                  Módulo 5
                </span>
                <h2 className="font-serif text-[24px] sm:text-[26px] font-semibold text-[#1A241E] dark:text-white">
                  A Estratégia da Sacola: Migre Clientes dos Marketplaces
                </h2>
              </div>
            </div>

            <p className="text-[14px] text-[#556358] dark:text-white leading-relaxed mb-6">
              Nos marketplaces (iFood e similares), o restaurante paga até <strong>27% de comissão</strong> sobre cada pedido. O cliente pertence à plataforma, não ao seu restaurante. Veja como usar o primeiro pedido para transformar esse cliente em comprador recorrente no seu DeliPlus com taxa 0%!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* O Panfleto da Sacola */}
              <div className="p-5 rounded-2xl border border-[#ECEAE2] dark:border-[#3D5444] bg-[#FAF8F0] dark:bg-[#28382D]">
                <h3 className="font-bold text-[16px] text-[#1A241E] dark:text-white mb-2 flex items-center gap-2">
                  <span>🛍️</span>
                  <span>O Panfleto Magnético na Sacola</span>
                </h3>
                <p className="text-[13px] text-[#556358] dark:text-white leading-relaxed mb-3">
                  Toda vez que sair um pedido do marketplace, grampeie um pequeno bilhete na sacola:
                </p>
                <div className="bg-white dark:bg-[#1E2922] p-3.5 rounded-xl border border-dashed border-[#CB5A3C] text-[13px] text-[#253629] dark:text-white italic leading-relaxed">
                  &ldquo;Gostou da sua refeição? Peça direto no nosso cardápio oficial e ganhe 10% de desconto em todos os próximos pedidos + entrega expressa! Acesse: [Seu Link DeliPlus] com o cupom CLIENTEVIP&rdquo;
                </div>
              </div>

              {/* A Matemática da Economia */}
              <div className="p-5 rounded-2xl border border-[#ECEAE2] dark:border-[#3D5444] bg-[#FAF8F0] dark:bg-[#28382D]">
                <h3 className="font-bold text-[16px] text-[#1A241E] dark:text-white mb-2 flex items-center gap-2">
                  <span>💰</span>
                  <span>A Matemática do seu Lucro</span>
                </h3>
                <div className="space-y-2 text-[13px] text-[#556358] dark:text-white">
                  <div className="flex justify-between py-1 border-b border-[#ECEAE2] dark:border-[#3D5444]">
                    <span>100 pedidos de R$ 60 no iFood (27% taxa):</span>
                    <strong className="text-red-700 dark:text-[#FF8F94]">-R$ 1.620,00 perdidos</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#ECEAE2] dark:border-[#3D5444]">
                    <span>Mesmos 100 pedidos no DeliPlus (0% taxa):</span>
                    <strong className="text-[#2E7D32] dark:text-[#52E098]">R$ 0,00 de comissão</strong>
                  </div>
                  <div className="pt-2 text-[12px] font-bold text-[#1A241E] dark:text-white">
                    Resultado: Você economiza mais de R$ 19.400 por ano apenas trazendo seus clientes fiéis para o seu link próprio!
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
