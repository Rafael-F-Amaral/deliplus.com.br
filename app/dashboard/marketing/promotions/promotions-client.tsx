"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useTransition, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  Edit3,
  X,
  Layers,
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toggleProductPromo, updateProductPromoFull } from "../actions";

export interface PromoProduct {
  id: string;
  name: string;
  imageUrl?: string | null;
  categoryName?: string;
  priceCents: number;
  promoPriceCents: number | null;
  discountPercentage: number;
  inPromo: boolean;
  promoIndefinite?: boolean;
  promoStartDate?: string | null;
  promoEndDate?: string | null;
  complementsCount: number;
  totalSold: number;
  totalRevenueCents: number;
  clicksCount: number;
  conversionRate: number;
}

interface PromotionsClientProps {
  storeSlug: string;
  storeName: string;
  initialPromoProducts: PromoProduct[];
}

function formatPromoPeriod(
  startDateStr?: string | null,
  endDateStr?: string | null,
  isIndefinite?: boolean
): { periodText: string; totalDays: number } {
  if (isIndefinite) {
    return {
      periodText: "Prazo indeterminado",
      totalDays: Infinity
    };
  }

  if (!startDateStr && !endDateStr) {
    return {
      periodText: "Prazo indeterminado",
      totalDays: Infinity
    };
  }

  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const start = startDateStr ? parseLocalDate(startDateStr) : null;
  const end = endDateStr ? parseLocalDate(endDateStr) : null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  if (start && end) {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return {
      periodText: `${formatDate(start)} até ${formatDate(end)} (${totalDays} ${totalDays === 1 ? "dia" : "dias"})`,
      totalDays
    };
  } else if (start) {
    return {
      periodText: `A partir de ${formatDate(start)}`,
      totalDays: Infinity
    };
  } else if (end) {
    return {
      periodText: `Até ${formatDate(end)}`,
      totalDays: Infinity
    };
  }

  return { periodText: "Prazo indeterminado", totalDays: Infinity };
}

export default function PromotionsClient({
  initialPromoProducts = []
}: PromotionsClientProps) {
  const [promoProducts, setPromoProducts] = useState<PromoProduct[]>(initialPromoProducts);
  const [feedbackNotification, setFeedbackNotification] = useState<string | null>(null);

  // Table filter: "todos" | "em_promocao"
  const [tableFilter, setTableFilter] = useState<"todos" | "em_promocao">("todos");

  // Pagination for top / slow performers (2 items per box)
  const ITEMS_PER_BOX = 2;
  const [topPage, setTopPage] = useState(1);
  const [slowPage, setSlowPage] = useState(1);

  // Auto-open modal if navigated from Cardápio with ?editProduct=xxx
  const searchParams = useSearchParams();
  const editProductId = searchParams.get("editProduct");

  const initialTarget = useMemo(() => {
    if (!editProductId) return null;
    return initialPromoProducts.find(p => p.id === editProductId) || null;
  }, [editProductId, initialPromoProducts]);

  // Rich Promo Modal State
  const [editingPromoProduct, setEditingPromoProduct] = useState<PromoProduct | null>(initialTarget);
  const [discountPercentInput, setDiscountPercentInput] = useState<string>(() => {
    if (!initialTarget) return "15";
    return initialTarget.discountPercentage > 0
      ? initialTarget.discountPercentage.toString()
      : (initialTarget.promoPriceCents && initialTarget.priceCents > 0
          ? Math.round(((initialTarget.priceCents - initialTarget.promoPriceCents) / initialTarget.priceCents) * 100).toString()
          : "15");
  });
  const [promoIndefinite, setPromoIndefinite] = useState<boolean>(() => initialTarget?.promoIndefinite ?? true);
  const [promoStartDate, setPromoStartDate] = useState<string>(() => initialTarget?.promoStartDate || "");
  const [promoEndDate, setPromoEndDate] = useState<string>(() => initialTarget?.promoEndDate || "");
  const [promoIsActive, setPromoIsActive] = useState<boolean>(() => initialTarget?.inPromo ?? true);

  const [, startTransition] = useTransition();

  // Helper format BRL
  const formatBRL = (cents: number | null | undefined): string => {
    if (typeof cents !== "number" || isNaN(cents)) return "R$ 0,00";
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).replace(/\s+/, " ");
  };

  const handleOpenPromoModal = (product: PromoProduct) => {
    setEditingPromoProduct(product);
    const existingDiscount = product.discountPercentage > 0
      ? product.discountPercentage.toString()
      : (product.promoPriceCents && product.priceCents > 0
          ? Math.round(((product.priceCents - product.promoPriceCents) / product.priceCents) * 100).toString()
          : "15");
    setDiscountPercentInput(existingDiscount);
    setPromoIndefinite(product.promoIndefinite ?? true);
    setPromoStartDate(product.promoStartDate || "");
    setPromoEndDate(product.promoEndDate || "");
    setPromoIsActive(product.inPromo);
  };

  // Toggle promo status directly from table row
  const handleTogglePromo = (productId: string, currentInPromo: boolean) => {
    const nextInPromo = !currentInPromo;
    setPromoProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, inPromo: nextInPromo } : p))
    );

    startTransition(async () => {
      const res = await toggleProductPromo(productId, currentInPromo);
      if (!res.success) {
        setPromoProducts(prev =>
          prev.map(p => (p.id === productId ? { ...p, inPromo: currentInPromo } : p))
        );
      } else {
        setFeedbackNotification(nextInPromo ? "Promoção ativada!" : "Promoção pausada.");
        setTimeout(() => setFeedbackNotification(null), 3000);
      }
    });
  };

  // Save Full Promo Settings from Modal
  const handleSavePromoFull = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromoProduct) return;

    const origNum = editingPromoProduct.priceCents / 100;
    const pct = parseFloat(discountPercentInput) || 0;
    const cappedPct = Math.min(Math.max(pct, 1), 99);
    const calculatedPromo = origNum * (1 - cappedPct / 100);
    const calculatedPromoCents = Math.round(calculatedPromo * 100);

    const targetId = editingPromoProduct.id;
    setPromoProducts(prev =>
      prev.map(p =>
        p.id === targetId
          ? {
              ...p,
              promoPriceCents: promoIsActive ? calculatedPromoCents : null,
              discountPercentage: promoIsActive ? cappedPct : 0,
              inPromo: promoIsActive,
              promoIndefinite,
              promoStartDate: promoStartDate || null,
              promoEndDate: promoEndDate || null
            }
          : p
      )
    );

    setEditingPromoProduct(null);
    setFeedbackNotification(
      promoIsActive
        ? `Promoção salva! Preço promocional: ${formatBRL(calculatedPromoCents)} (-${cappedPct}%)`
        : "Promoção desativada com sucesso."
    );
    setTimeout(() => setFeedbackNotification(null), 3500);

    startTransition(async () => {
      await updateProductPromoFull(targetId, {
        promoPriceCents: promoIsActive ? calculatedPromoCents : null,
        inPromo: promoIsActive,
        promoIndefinite,
        promoStartDate: promoStartDate || null,
        promoEndDate: promoEndDate || null
      });
    });
  };

  // Filter only items in promo for sales ranking insights
  const promoOnlyProducts = useMemo(
    () => promoProducts.filter(p => p.inPromo || p.promoPriceCents !== null),
    [promoProducts]
  );

  // All Top Performers (descending by sales)
  const allTopPerformers = useMemo(
    () => [...promoOnlyProducts].sort((a, b) => b.totalSold - a.totalSold),
    [promoOnlyProducts]
  );
  const topTotalPages = Math.ceil(allTopPerformers.length / ITEMS_PER_BOX) || 1;
  const paginatedTop = useMemo(() => {
    const start = (topPage - 1) * ITEMS_PER_BOX;
    return allTopPerformers.slice(start, start + ITEMS_PER_BOX);
  }, [allTopPerformers, topPage]);

  // All Slow Performers (ascending by sales)
  const allSlowPerformers = useMemo(
    () => [...promoOnlyProducts].sort((a, b) => a.totalSold - b.totalSold),
    [promoOnlyProducts]
  );
  const slowTotalPages = Math.ceil(allSlowPerformers.length / ITEMS_PER_BOX) || 1;
  const paginatedSlow = useMemo(() => {
    const start = (slowPage - 1) * ITEMS_PER_BOX;
    return allSlowPerformers.slice(start, start + ITEMS_PER_BOX);
  }, [allSlowPerformers, slowPage]);

  // Filter table list
  const filteredTableProducts = useMemo(() => {
    if (tableFilter === "em_promocao") {
      return promoProducts.filter(p => p.inPromo || p.promoPriceCents !== null);
    }
    return promoProducts;
  }, [promoProducts, tableFilter]);

  return (
    <div className="flex-1 bg-[#F7F6F2] min-h-screen text-[#1A241E] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Toast / Notification feedback */}
        {feedbackNotification && (
          <div className="fixed bottom-6 right-6 z-[160] bg-[#2E4233] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-bottom-2">
            <Check size={16} className="text-[#A4E0A6]" />
            <span>{feedbackNotification}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* HEADER: MÉTRICAS PROMOCIONAIS COM TOOLTIP                    */}
        {/* ============================================================ */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-2">
            <h1 className="font-serif text-[32px] sm:text-[38px] lg:text-[42px] font-semibold text-[#1A241E] tracking-tight leading-none">
              Métricas Promocionais
            </h1>

            {/* Tooltip Icon & Popover */}
            <div className="relative group inline-block">
              <div className="w-5 h-5 rounded-full bg-[#2E4233] text-white flex items-center justify-center text-[12px] font-extrabold leading-none shadow-sm cursor-help hover:scale-105 transition-transform">
                ?
              </div>
              <div className="absolute top-full left-0 mt-2 w-80 p-4 bg-[#2E4233] text-white rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                <p className="text-[13px] text-white mb-2 leading-relaxed">
                  <span className="font-extrabold text-white">Sobre esta tela:</span> Acompanhe o resultado das suas ofertas e gerencie os descontos aplicados no cardápio da sua loja.
                </p>
                <div className="flex flex-col gap-2 pt-2 border-t border-white/10 text-[12px] text-white/90">
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5"></span>
                    <span>Identifique pratos promocionais com alto e baixo volume de pedidos.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5"></span>
                    <span>Alterne o status de ativação da promoção na hora usando o switch.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5"></span>
                    <span>Configure descontos em %, agende datas de validade ou mantenha por prazo indeterminado.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[14px] sm:text-[15px] text-[#5D6B60] max-w-2xl">
            Monitore quais produtos têm maior saída, acompanhe cliques no cardápio público e ajuste preços promocionais em tempo real.
          </p>
        </div>

        {/* ============================================================ */}
        {/* SPLIT INSIGHTS: MAIS VENDIDOS VS MENOS VENDIDOS              */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
          {/* Box 1: Maior Saída (Top Performers) */}
          <div className="bg-white border border-[#E3E1D9] rounded-[22px] p-5 sm:p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-[18px] sm:text-[20px] font-semibold text-[#1A241E]">
                    Promoções com Maior Saída
                  </h2>
                  {/* Tooltip */}
                  <div className="relative group inline-block">
                    <div className="w-4 h-4 rounded-full bg-[#2E4233] text-white flex items-center justify-center text-[10px] font-extrabold leading-none shadow-sm cursor-help hover:scale-105 transition-transform">
                      ?
                    </div>
                    <div className="absolute top-full left-0 mt-2 w-72 p-3.5 bg-[#2E4233] text-white rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                      <p className="text-[12px] text-white leading-relaxed">
                        <span className="font-bold text-white">Top Vendas:</span> Mostra os itens em promoção com melhor aceitação pelos clientes. Vincule adicionais a esses pratos para aumentar o ticket médio por pedido.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[12px] text-[#637267] mb-4">
                Pratos promocionais que os clientes mais pedem
              </p>

              <div className="space-y-3">
                {allTopPerformers.length === 0 ? (
                  <div className="text-center py-8 text-[13px] text-[#637267]">
                    Nenhum prato em promoção cadastrado ainda.
                  </div>
                ) : (
                  paginatedTop.map((item, idx) => {
                    const itemRank = (topPage - 1) * ITEMS_PER_BOX + idx + 1;
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl border border-[#ECEAE2] bg-[#FAF8F0] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 shrink-0 relative">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">
                                Sem foto
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-[#1A241E] text-[14px] truncate flex items-center gap-1.5">
                              <span className="text-[#CB5A3C]">#{itemRank}</span>
                              <span>{item.name}</span>
                            </div>
                            <div className="text-[12px] text-[#637267] flex items-center gap-2">
                              <span>De {formatBRL(item.priceCents)} por <strong className="text-[#2E7D32]">{formatBRL(item.promoPriceCents)}</strong></span>
                              {item.discountPercentage > 0 && (
                                <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 font-bold text-[10px]">
                                  -{item.discountPercentage}%
                                </span>
                              )}
                            </div>
                            {item.complementsCount > 0 && (
                              <div className="text-[11px] text-[#CB5A3C] font-medium mt-0.5">
                                ★ {item.complementsCount} adicionais vinculados aumentam o ticket!
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-[14px] font-bold text-[#1A241E]">
                            {item.totalSold} vendidos
                          </div>
                          <div className="text-[12px] font-semibold text-[#2E7D32]">
                            {formatBRL(item.totalRevenueCents)}
                          </div>
                          <div className="text-[11px] text-[#637267]">
                            {item.clicksCount} cliques ({item.conversionRate.toFixed(1)}% conv.)
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Pagination Controls */}
            {topTotalPages > 1 && (
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#ECEAE2] text-[12px] text-[#637267]">
                <span>
                  {(topPage - 1) * ITEMS_PER_BOX + 1}–{Math.min(topPage * ITEMS_PER_BOX, allTopPerformers.length)} de {allTopPerformers.length} pratos
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={topPage <= 1}
                    onClick={() => setTopPage(p => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-[#E3E1D9] bg-white hover:bg-[#F4F3ED] text-[#2E4233] disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="font-semibold text-[#1A241E] px-1.5">
                    {topPage} de {topTotalPages}
                  </span>
                  <button
                    type="button"
                    disabled={topPage >= topTotalPages}
                    onClick={() => setTopPage(p => Math.min(topTotalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-[#E3E1D9] bg-white hover:bg-[#F4F3ED] text-[#2E4233] disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Próxima página"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Box 2: Menor Saída (Precisam de Atenção) */}
          <div className="bg-white border border-[#E3E1D9] rounded-[22px] p-5 sm:p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-[18px] sm:text-[20px] font-semibold text-[#1A241E]">
                    Promoções com Menor Saída
                  </h2>
                  {/* Tooltip com dicas de melhoria */}
                  <div className="relative group inline-block">
                    <div className="w-4 h-4 rounded-full bg-[#2E4233] text-white flex items-center justify-center text-[10px] font-extrabold leading-none shadow-sm cursor-help hover:scale-105 transition-transform">
                      ?
                    </div>
                    <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-2 w-80 p-4 bg-[#2E4233] text-white rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                      <p className="text-[13px] text-white mb-2 leading-relaxed font-bold">
                        Como melhorar a saída destes pratos:
                      </p>
                      <div className="flex flex-col gap-2 pt-2 border-t border-white/10 text-[12px] text-white/90">
                        <div className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5"></span>
                          <span><strong>Foto atraente:</strong> Pratos com foto nítida e bem iluminada recebem até 3x mais cliques.</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5"></span>
                          <span><strong>Ajuste de desconto:</strong> Teste aumentar o desconto para 20% ou 25% para gerar interesse inicial.</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5"></span>
                          <span><strong>Descrição sensorial:</strong> Destaque ingredientes especiais, crocância ou tempero marcante.</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5"></span>
                          <span><strong>Combos e adicionais:</strong> Monte opções de combo com refrigerante ou sobremesa.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[12px] text-[#637267] mb-4">
                Itens em promoção que precisam de ajuste de preço ou foto
              </p>

              <div className="space-y-3">
                {allSlowPerformers.length === 0 ? (
                  <div className="text-center py-8 text-[13px] text-[#637267]">
                    Nenhum prato em promoção cadastrado ainda.
                  </div>
                ) : (
                  paginatedSlow.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-[#ECEAE2] bg-[#FAF8F0] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 shrink-0 relative">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">
                              Sem foto
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-[#1A241E] text-[14px] truncate">
                            {item.name}
                          </div>
                          <div className="text-[12px] text-[#637267] flex items-center gap-2">
                            <span>De {formatBRL(item.priceCents)} por <strong className="text-[#2E7D32]">{formatBRL(item.promoPriceCents)}</strong></span>
                            {item.discountPercentage > 0 && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                -{item.discountPercentage}%
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#E65100] mt-0.5">
                            💡 Poucas pessoas pediram. Dica: ajuste o desconto ou melhore a apresentação!
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenPromoModal(item)}
                          className="text-[12px] font-semibold text-[#2E4233] bg-white border border-[#E3E1D9] hover:bg-[#F4F3ED] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Ajustar Oferta
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pagination Controls */}
            {slowTotalPages > 1 && (
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#ECEAE2] text-[12px] text-[#637267]">
                <span>
                  {(slowPage - 1) * ITEMS_PER_BOX + 1}–{Math.min(slowPage * ITEMS_PER_BOX, allSlowPerformers.length)} de {allSlowPerformers.length} pratos
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={slowPage <= 1}
                    onClick={() => setSlowPage(p => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-[#E3E1D9] bg-white hover:bg-[#F4F3ED] text-[#2E4233] disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="font-semibold text-[#1A241E] px-1.5">
                    {slowPage} de {slowTotalPages}
                  </span>
                  <button
                    type="button"
                    disabled={slowPage >= slowTotalPages}
                    onClick={() => setSlowPage(p => Math.min(slowTotalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-[#E3E1D9] bg-white hover:bg-[#F4F3ED] text-[#2E4233] disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Próxima página"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* TABELA: GESTÃO DE PROMOÇÕES COM TOOLTIP E SWITCH             */}
        {/* ============================================================ */}
        <div className="bg-white border border-[#E3E1D9] rounded-[22px] p-5 sm:p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)] mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-serif text-[22px] font-semibold text-[#1A241E]">
                  Gestão de Promoções
                </h2>
                {/* Tooltip */}
                <div className="relative group inline-block">
                  <div className="w-4 h-4 rounded-full bg-[#2E4233] text-white flex items-center justify-center text-[10px] font-extrabold leading-none shadow-sm cursor-help hover:scale-105 transition-transform">
                    ?
                  </div>
                  <div className="absolute top-full left-0 mt-2 w-80 p-4 bg-[#2E4233] text-white rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                    <p className="text-[13px] text-white mb-2 leading-relaxed">
                      <span className="font-extrabold text-white">Gestão Centralizada:</span> Edite qualquer item do cardápio para criar ou ajustar promoções.
                    </p>
                    <div className="flex flex-col gap-2 pt-2 border-t border-white/10 text-[12px] text-white/90">
                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5"></span>
                        <span>Ligue ou pause a promoção instantaneamente pelo switch de status.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5"></span>
                        <span>Clique em <strong>Editar Promoção</strong> para alterar porcentagem e agendar datas.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5"></span>
                        <span>Use as abas para alternar entre todos os pratos ou apenas os que estão em promoção.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[13px] text-[#637267]">
                Altere regras de desconto, configure prazos e controle o status promocional dos seus pratos.
              </p>
            </div>

            {/* Filter Toggle Buttons */}
            <div className="flex items-center gap-2 bg-[#F4F3EE] p-1 rounded-xl self-start sm:self-auto border border-[#EAE8E0]">
              <button
                type="button"
                onClick={() => setTableFilter("todos")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  tableFilter === "todos"
                    ? "bg-white text-[#2E4233] shadow-xs"
                    : "text-[#637267] hover:text-[#1A241E]"
                }`}
              >
                Todos os Pratos ({promoProducts.length})
              </button>
              <button
                type="button"
                onClick={() => setTableFilter("em_promocao")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  tableFilter === "em_promocao"
                    ? "bg-white text-[#2E4233] shadow-xs"
                    : "text-[#637267] hover:text-[#1A241E]"
                }`}
              >
                Em Promoção ({promoOnlyProducts.length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#ECEAE2] text-[#637267] font-medium">
                  <th className="pb-3 pl-1 font-semibold">Produto</th>
                  <th className="pb-3 font-semibold">Categoria</th>
                  <th className="pb-3 font-semibold">Preço Regular</th>
                  <th className="pb-3 font-semibold">Preço Promocional</th>
                  <th className="pb-3 font-semibold">Adicionais</th>
                  <th className="pb-3 font-semibold">Saídas / Cliques</th>
                  <th className="pb-3 font-semibold">Faturamento</th>
                  <th className="pb-3 text-center font-semibold">Status</th>
                  <th className="pb-3 text-right pr-1 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEAE2]/60">
                {filteredTableProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[#637267]">
                      Nenhum prato encontrado com o filtro selecionado.
                    </td>
                  </tr>
                ) : (
                  filteredTableProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-[#FAF8F0]/70 transition-colors"
                    >
                      {/* Produto */}
                      <td className="py-3.5 pl-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 shrink-0 relative border border-[#ECEAE2]">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">
                                Sem foto
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-[#1A241E] text-[14px]">
                              {product.name}
                            </div>
                            <div className="text-[11px] text-[#637267]">
                              ID: {product.id.slice(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className="py-3.5 text-[#556358] font-medium">
                        {product.categoryName || "Geral"}
                      </td>

                      {/* Preço Regular */}
                      <td className="py-3.5 text-[#637267] line-through font-medium">
                        {formatBRL(product.priceCents)}
                      </td>

                      {/* Preço Promocional */}
                      <td className="py-3.5">
                        {product.promoPriceCents ? (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#CB5A3C] text-[14px]">
                              {formatBRL(product.promoPriceCents)}
                            </span>
                            {product.discountPercentage > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-[#FDF2F0] text-[#CB5A3C] border border-[#CB5A3C]/20 font-bold text-[10px]">
                                -{product.discountPercentage}%
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[13px] text-gray-400 font-medium">
                            Sem promoção
                          </span>
                        )}
                      </td>

                      {/* Adicionais Vinculados */}
                      <td className="py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          product.complementsCount > 0
                            ? "bg-[#EDE7F6] text-[#512DA8]"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          <Layers size={11} />
                          {product.complementsCount} adicionais
                        </span>
                      </td>

                      {/* Saídas / Cliques */}
                      <td className="py-3.5 text-[#334237]">
                        <span className="font-bold">{product.totalSold} vendas</span>
                        <span className="text-[11px] text-[#637267] block">
                          {product.clicksCount} cliques ({product.conversionRate.toFixed(1)}%)
                        </span>
                      </td>

                      {/* Faturamento */}
                      <td className="py-3.5 font-bold text-[#1A241E]">
                        {formatBRL(product.totalRevenueCents)}
                      </td>

                      {/* Status com Switch DeliPlus */}
                      <td className="py-3.5 align-middle text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col items-center justify-center">
                          <Switch
                            checked={product.inPromo}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePromo(product.id, product.inPromo);
                            }}
                            onCheckedChange={() => handleTogglePromo(product.id, product.inPromo)}
                            activeTrackColor="bg-[#2E4233]"
                            inactiveTrackColor="bg-[#CB5A3C]"
                            aria-label={`Alternar promoção de ${product.name}`}
                          />
                          <span
                            className={`text-[10.5px] font-semibold mt-0.5 transition-colors ${
                              product.inPromo ? "text-[#2E4233]" : "text-[#CB5A3C]"
                            }`}
                          >
                            {product.inPromo ? "Ativa" : "Pausada"}
                          </span>
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 text-right pr-1">
                        <button
                          type="button"
                          onClick={() => handleOpenPromoModal(product)}
                          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#CB5A3C] underline decoration-[#CB5A3C]/60 hover:decoration-[#CB5A3C] hover:text-[#b0482e] transition-all cursor-pointer"
                        >
                          <Edit3 size={13} />
                          <span>Editar Promoção</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL COMPLETO DE EDIÇÃO DE PROMOÇÃO (MIGRADO DO CARDÁPIO)      */}
      {/* ============================================================== */}
      {editingPromoProduct && (() => {
        const origNum = editingPromoProduct.priceCents / 100;
        const pct = parseFloat(discountPercentInput) || 0;
        const calculatedPromo = pct > 0 ? Math.max(0, origNum * (1 - pct / 100)) : origNum;
        const savings = origNum - calculatedPromo;

        return (
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => setEditingPromoProduct(null)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col border border-[#E9E4D4] animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-[#E9E4D4] flex justify-between items-center bg-[#FAF8F0]">
                <div className="flex flex-col">
                  <h3 className="font-bold text-[#CB5A3C] text-base">Preço Promocional</h3>
                  <span className="text-xs text-gray-500 font-medium truncate max-w-[280px]">
                    {editingPromoProduct.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPromoProduct(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSavePromoFull} className="flex flex-col">
                {/* Conteúdo configurável (Apagado quando promoção desativada) */}
                <div className={`p-5 flex flex-col gap-4 transition-all duration-200 ${!promoIsActive ? "opacity-35 pointer-events-none select-none grayscale-[0.3]" : ""}`}>
                  {/* Comparativo de Preços: Original e Promocional juntos */}
                  <div className="p-3.5 rounded-xl bg-[#FAF8F0] border border-[#E9E4D4] flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-gray-500 font-medium">Preço Original</span>
                      <span className="text-sm font-semibold text-gray-400 line-through">
                        {formatBRL(editingPromoProduct.priceCents)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FDF2F0] border border-[#CB5A3C]/20">
                      <span className="text-xs font-bold text-[#CB5A3C]">
                        -{pct > 0 ? pct : 0}%
                      </span>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-[11px] text-gray-500 font-medium">Preço Promocional</span>
                      <span className="text-xl font-extrabold text-[#CB5A3C]">
                        {formatBRL(Math.round(calculatedPromo * 100))}
                      </span>
                      {savings > 0 && (
                        <span className="text-[10.5px] font-semibold text-[#2E4233]">
                          Economia de {formatBRL(Math.round(savings * 100))}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Campo Porcentagem de Desconto */}
                  <div className="flex flex-col gap-2 p-1 rounded-xl">
                    <label className="text-xs font-semibold text-gray-700 flex justify-between">
                      <span>Porcentagem de Desconto:</span>
                      <span className="text-[#CB5A3C] font-bold">{pct > 0 ? `${pct}%` : "0%"}</span>
                    </label>

                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="99"
                        step="1"
                        value={discountPercentInput}
                        onChange={(e) => setDiscountPercentInput(e.target.value)}
                        placeholder="Ex: 15"
                        autoFocus={promoIsActive}
                        className="w-full border border-[#E9E4D4] rounded-xl pl-4 pr-10 py-2.5 text-base font-bold text-[#CB5A3C] focus:outline-none focus:ring-2 focus:ring-[#CB5A3C]/20 focus:border-[#CB5A3C] transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                        %
                      </span>
                    </div>

                    {/* Atalhos rápidos de % (Botões na cor verde Deli) */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {[5, 10, 15, 20, 25, 30].map((quickPct) => (
                        <button
                          key={quickPct}
                          type="button"
                          onClick={() => setDiscountPercentInput(quickPct.toString())}
                          className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            pct === quickPct
                              ? "bg-[#2E4233] text-white border-[#2E4233]"
                              : "bg-white text-gray-600 border-[#E9E4D4] hover:bg-[#FAF8F0] hover:text-[#2E4233]"
                          }`}
                        >
                          {quickPct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Programação da Promoção */}
                  <div className="flex flex-col gap-2.5 pt-3 border-t border-gray-100 p-1 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        Programar promoção
                      </span>
                      <div className="flex items-center gap-2 select-none">
                        <span
                          onClick={() => setPromoIndefinite(!promoIndefinite)}
                          className="text-[11px] font-medium text-gray-600 cursor-pointer"
                        >
                          Prazo indeterminado
                        </span>
                        <Switch
                          checked={promoIndefinite}
                          onCheckedChange={setPromoIndefinite}
                          activeTrackColor="bg-[#2E4233]"
                          inactiveTrackColor="bg-stone-300"
                        />
                      </div>
                    </div>

                    {/* Campos de Data de Início e Data de Término */}
                    <div className={`grid grid-cols-2 gap-2.5 transition-all duration-200 ${promoIndefinite ? "opacity-35 pointer-events-none select-none grayscale-[0.3]" : ""}`}>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-medium text-gray-600">Data de início</label>
                        <input
                          type="date"
                          value={promoStartDate}
                          onChange={(e) => setPromoStartDate(e.target.value)}
                          disabled={promoIndefinite}
                          className="w-full border border-[#E9E4D4] rounded-xl px-2.5 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#2E4233]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-medium text-gray-600">Data de término</label>
                        <input
                          type="date"
                          value={promoEndDate}
                          min={promoStartDate}
                          onChange={(e) => setPromoEndDate(e.target.value)}
                          disabled={promoIndefinite}
                          className="w-full border border-[#E9E4D4] rounded-xl px-2.5 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#2E4233]"
                        />
                      </div>
                    </div>

                    {/* Resumo do período programado quando NÃO for prazo indeterminado */}
                    {!promoIndefinite && promoStartDate && promoEndDate && (
                      <div className="p-2 rounded-xl bg-[#FAF8F0] border border-[#E9E4D4] flex items-center justify-between text-xs text-gray-700 animate-in fade-in">
                        <span className="text-[11px] text-gray-500 font-medium">Período programado:</span>
                        <span className="text-[11.5px] font-bold text-[#2E4233]">
                          {formatPromoPeriod(promoStartDate, promoEndDate, false).periodText}
                        </span>
                      </div>
                    )}

                    {/* Aviso quando ativado por prazo indeterminado */}
                    {promoIndefinite && (
                      <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-center gap-2 text-xs text-amber-900 animate-in fade-in duration-150">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                        <span className="text-[11.5px] font-medium">A promoção está ativa por prazo indeterminado</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer / Ações */}
                <div className="pt-3 border-t border-[#E9E4D4] flex items-center justify-between gap-2 bg-[#FAF8F0] px-5 py-3.5">
                  {/* Switch para ligar/desligar promoção */}
                  <div className="flex items-center gap-2 select-none p-1 rounded-lg">
                    <Switch
                      checked={promoIsActive}
                      onCheckedChange={setPromoIsActive}
                      activeTrackColor="bg-[#2E4233]"
                      inactiveTrackColor="bg-stone-300"
                    />
                    <span
                      onClick={() => setPromoIsActive(!promoIsActive)}
                      className="text-xs font-semibold text-gray-700 cursor-pointer"
                    >
                      {promoIsActive ? "Promoção ativa" : "Promoção desativada"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingPromoProduct(null)}
                      className="px-3.5 py-2 rounded-xl border border-[#E9E4D4] text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#2E4233] hover:bg-[#233327] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
