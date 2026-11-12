"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useTransition, useMemo } from "react";
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
import { HelpTooltip } from "@/components/ui/help-tooltip";
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

interface DeliPlusDatePickerProps {
  value: string;
  onChange: (val: string) => void;
  min?: string;
  disabled?: boolean;
  placeholder?: string;
  align?: "left" | "right";
}

function DeliPlusDatePicker({
  value,
  onChange,
  min,
  disabled = false,
  placeholder = "dd/mm/aaaa",
  align = "left"
}: DeliPlusDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const parseDate = (dStr: string) => {
    if (!dStr) return null;
    const parts = dStr.split("-").map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return null;
  };

  const selectedDate = parseDate(value);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const [viewYear, setViewYear] = useState<number>(() => selectedDate ? selectedDate.getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => selectedDate ? selectedDate.getMonth() : today.getMonth());

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      if (selectedDate) {
        setViewYear(selectedDate.getFullYear());
        setViewMonth(selectedDate.getMonth());
      } else {
        setViewYear(today.getFullYear());
        setViewMonth(today.getMonth());
      }
    }
    setIsOpen(prev => !prev);
  };

  React.useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const daysOfWeek = ["D", "S", "T", "Q", "Q", "S", "S"];

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayWeekIndex = new Date(viewYear, viewMonth, 1).getDay();

  const handleSelectDay = (day: number) => {
    const dStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (min && dStr < min) return;
    onChange(dStr);
    setIsOpen(false);
  };

  const displayFormatted = selectedDate
    ? `${String(selectedDate.getDate()).padStart(2, "0")}/${String(selectedDate.getMonth() + 1).padStart(2, "0")}/${selectedDate.getFullYear()}`
    : "";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        aria-expanded={isOpen}
        className={`w-full min-h-10 flex items-center justify-between border border-[#E9E4D4] dark:border-[#2A382E] rounded-xl px-3 py-2 text-base lg:text-xs text-gray-700 dark:text-[#F2EFE9] bg-white dark:bg-[#1B241E] transition-all cursor-pointer ${
          disabled
            ? "opacity-40 cursor-not-allowed bg-gray-50 dark:bg-[#131A15]"
            : "hover:border-[#CB5A3C] dark:hover:border-[#FF7D4F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E4233]/40 dark:focus-visible:ring-[#FF7D4F]/40"
        }`}
      >
        <span className={displayFormatted ? "font-semibold text-gray-800 dark:text-[#F2EFE9]" : "text-gray-400 dark:text-[#9CA79E]"}>
          {displayFormatted || placeholder}
        </span>
        <Calendar className="w-3.5 h-3.5 text-gray-500 dark:text-[#9CA79E] shrink-0" />
      </button>

      {isOpen && !disabled && (
        <div
          data-align={align}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[210] w-[calc(100vw-1.5rem)] max-w-[300px] max-h-[88dvh] overflow-y-auto bg-white dark:bg-[#1B241E] border border-[#E9E4D4] dark:border-[#2A382E] rounded-2xl shadow-2xl p-2.5 sm:p-3 select-none animate-in fade-in zoom-in-95"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#ECEAE2] dark:border-[#2A382E]">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Mês anterior"
              className="min-h-9 min-w-9 flex items-center justify-center rounded-lg text-gray-600 dark:text-[#9CA79E] hover:bg-[#FAF8F0] dark:hover:bg-[#25332A] hover:text-[#CB5A3C] dark:hover:text-[#FF7D4F] transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-[#1A241E] dark:text-[#F2EFE9]">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Próximo mês"
              className="min-h-9 min-w-9 flex items-center justify-center rounded-lg text-gray-600 dark:text-[#9CA79E] hover:bg-[#FAF8F0] dark:hover:bg-[#25332A] hover:text-[#CB5A3C] dark:hover:text-[#FF7D4F] transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center mb-1">
            {daysOfWeek.map((dow, idx) => (
              <span key={idx} className="text-[10px] font-bold text-gray-500 dark:text-[#9CA79E]">
                {dow}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center">
            {Array.from({ length: firstDayWeekIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9 w-9" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isSelected = value === dateStr;
              const isToday = todayStr === dateStr;
              const isPastMin = min ? dateStr < min : false;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isPastMin}
                  onClick={() => handleSelectDay(day)}
                  className={`h-9 w-9 mx-auto rounded-lg text-xs flex items-center justify-center transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#B4482D] dark:bg-[#E76F41] text-white dark:text-[#131A15] font-bold shadow-xs"
                      : isToday
                      ? "border border-[#B4482D] dark:border-[#FF7D4F] text-[#B4482D] dark:text-[#FF7D4F] font-bold hover:bg-[#FAF8F0] dark:hover:bg-[#25332A]"
                      : isPastMin
                      ? "text-gray-300 dark:text-[#4E5C52] cursor-not-allowed"
                      : "text-gray-700 dark:text-[#F2EFE9] hover:bg-[#FAF8F0] dark:hover:bg-[#25332A] hover:text-[#B4482D] dark:hover:text-[#FF7D4F] font-medium"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#ECEAE2] dark:border-[#2A382E] text-[11px]">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="min-h-9 px-2 text-gray-600 dark:text-[#9CA79E] hover:text-red-600 dark:hover:text-red-400 font-medium cursor-pointer"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => {
                if (!min || todayStr >= min) {
                  onChange(todayStr);
                  setIsOpen(false);
                }
              }}
              className="min-h-9 px-2 text-[#2E4233] dark:text-[#86EFAC] hover:text-[#B4482D] dark:hover:text-[#FF7D4F] font-bold cursor-pointer"
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PromotionsClient({
  initialPromoProducts = []
}: PromotionsClientProps) {
  const [promoProducts, setPromoProducts] = useState<PromoProduct[]>(initialPromoProducts);
  const [feedbackNotification, setFeedbackNotification] = useState<string | null>(null);

  // Table filter: "todos" | "em_promocao"
  const [tableFilter, setTableFilter] = useState<"todos" | "em_promocao">("todos");
  const TABLE_ITEMS_PER_PAGE = 8;
  const [tablePage, setTablePage] = useState(1);

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
  const [selectedPromoSizeId, setSelectedPromoSizeId] = useState<string>("all");
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
    setSelectedPromoSizeId("all");
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

  const tableTotalPages = Math.max(1, Math.ceil(filteredTableProducts.length / TABLE_ITEMS_PER_PAGE));
  const paginatedTableProducts = useMemo(() => {
    const start = (tablePage - 1) * TABLE_ITEMS_PER_PAGE;
    return filteredTableProducts.slice(start, start + TABLE_ITEMS_PER_PAGE);
  }, [filteredTableProducts, tablePage]);

  useEffect(() => {
    if (!editingPromoProduct) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setEditingPromoProduct(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingPromoProduct]);

  return (
    <div className="flex-1 bg-[#F7F6F2] dark:bg-[#131A15] min-h-screen text-[#1A241E] dark:text-[#F2EFE9] p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-x-hidden transition-colors duration-150">
      <div className="w-full max-w-6xl mx-auto">
        {/* Toast / Notification feedback */}
        {feedbackNotification && (
          <div className="fixed bottom-24 lg:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-[160] max-w-sm ml-auto bg-[#2E4233] dark:bg-[#1B241E] border border-transparent dark:border-[#2A382E] text-white dark:text-[#F2EFE9] px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-bottom-2">
            <Check size={16} className="text-[#A4E0A6] shrink-0" />
            <span>{feedbackNotification}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* HEADER: MÉTRICAS PROMOCIONAIS COM TOOLTIP                    */}
        {/* ============================================================ */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-2">
            <h1 className="font-serif text-[32px] sm:text-[38px] lg:text-[42px] font-semibold text-[#B4482D] dark:text-[#FF7D4F] tracking-tight leading-none">
              Promoções
            </h1>

            <HelpTooltip
              title="Sobre esta tela:"
              description="Acompanhe o resultado das suas ofertas e gerencie os descontos aplicados no cardápio da sua loja."
              bullets={[
                "Identifique pratos promocionais com alto e baixo volume de pedidos.",
                "Alterne o status de ativação da promoção na hora usando o switch.",
                "Configure descontos em %, agende datas de validade ou mantenha por prazo indeterminado."
              ]}
              size="lg"
              align="left"
            />
          </div>

          <p className="text-[14px] sm:text-[15px] text-[#0D1510] dark:text-[#9CA79E] font-medium max-w-2xl">
            Monitore quais produtos têm maior saída, acompanhe cliques no cardápio público e ajuste preços promocionais em tempo real.
          </p>
        </div>

        {/* ============================================================ */}
        {/* SPLIT INSIGHTS: MAIS VENDIDOS VS MENOS VENDIDOS              */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
          {/* Box 1: Maior Saída (Top Performers) */}
          <div className="bg-white dark:bg-[#1B241E] border border-[#E3E1D9] dark:border-[#2A382E] rounded-[22px] p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-colors">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-[18px] sm:text-[20px] font-semibold text-[#1A241E] dark:text-[#F2EFE9]">
                    Promoções com Maior Saída
                  </h2>
                  <HelpTooltip
                    title="Como potencializar seus pratos campeões:"
                    description="Ações práticas para aumentar pedido e margem dos seus campeões."
                    bullets={[
                      "Venda Cruzada (Cross-sell): Vincule complementos e bebidas a esses pratos para elevar o ticket médio dos pedidos.",
                      "Posição de Destaque: Mantenha os itens mais vendidos no topo do cardápio para guiar a decisão dos indecisos.",
                      "Ajuste Fino de Margem: Com alta demanda comprovada, teste reduzir o desconto em 2% a 5% para capturar mais lucro líquido.",
                      "Giro de Estoque: Assegure insumos suficientes para estes itens nunca esgotarem no horário de pico."
                    ]}
                    size="sm"
                    align="left"
                  />
                </div>
              </div>
              <p className="text-[12px] text-[#637267] dark:text-[#9CA79E] mb-4">
                Pratos promocionais que os clientes mais pedem
              </p>

              <div className="space-y-3">
                {allTopPerformers.length === 0 ? (
                  <div className="text-center py-8 text-[13px] text-[#637267] dark:text-[#9CA79E]">
                    Nenhum prato em promoção cadastrado ainda.
                  </div>
                ) : (
                  paginatedTop.map((item, idx) => {
                    const itemRank = (topPage - 1) * ITEMS_PER_BOX + idx + 1;
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl border border-[#ECEAE2] dark:border-[#2A382E] bg-[#FAF8F0] dark:bg-[#25332A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#222C25] shrink-0 relative">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-[#9CA79E] text-[10px]">
                                Sem foto
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-[#1A241E] dark:text-[#F2EFE9] text-[14px] truncate flex items-center gap-1.5">
                              <span className="text-[#B4482D] dark:text-[#FF7D4F]">#{itemRank}</span>
                              <span className="truncate">{item.name}</span>
                            </div>
                            <div className="text-[12px] text-[#637267] dark:text-[#9CA79E] flex flex-wrap items-center gap-2">
                              <span>De {formatBRL(item.priceCents)} por <strong className="text-[#2E7D32] dark:text-[#86EFAC]">{formatBRL(item.promoPriceCents)}</strong></span>
                              {item.discountPercentage > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-[#FCA5A5] font-bold text-[10px]">
                                  -{item.discountPercentage}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:block sm:text-right shrink-0 gap-2 pt-2 sm:pt-0 border-t border-[#ECEAE2]/70 dark:border-[#2A382E] sm:border-t-0">
                          <div className="text-[14px] font-bold text-[#1A241E] dark:text-[#F2EFE9]">
                            {item.totalSold} vendidos
                          </div>
                          <div className="text-right">
                            <div className="text-[12px] font-semibold text-[#2E7D32] dark:text-[#86EFAC]">
                              {formatBRL(item.totalRevenueCents)}
                            </div>
                            <div className="text-[11px] text-[#637267] dark:text-[#9CA79E]">
                              {item.clicksCount} cliques ({item.conversionRate.toFixed(1)}% conv.)
                            </div>
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
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-[#ECEAE2] dark:border-[#2A382E] text-[12px] text-[#637267] dark:text-[#9CA79E]">
                <span className="font-medium text-[#637267] dark:text-[#9CA79E]">
                  {(topPage - 1) * ITEMS_PER_BOX + 1}–{Math.min(topPage * ITEMS_PER_BOX, allTopPerformers.length)} de {allTopPerformers.length} pratos
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {Array.from({ length: topTotalPages }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTopPage(i + 1)}
                      className={`min-h-9 min-w-9 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${
                        topPage === i + 1
                          ? "bg-[#B4482D] dark:bg-[#E76F41] text-white dark:text-[#131A15] shadow-sm"
                          : "bg-white dark:bg-[#1B241E] text-gray-600 dark:text-[#F2EFE9] hover:bg-gray-100 dark:hover:bg-[#25332A] border border-[#E9E4D4] dark:border-[#2A382E]"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Box 2: Menor Saída (Precisam de Atenção) */}
          <div className="bg-white dark:bg-[#1B241E] border border-[#E3E1D9] dark:border-[#2A382E] rounded-[22px] p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-colors">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-[18px] sm:text-[20px] font-semibold text-[#1A241E] dark:text-[#F2EFE9]">
                    Promoções com Menor Saída
                  </h2>
                  <HelpTooltip
                    title="Como melhorar a saída destes pratos:"
                    description="Ajustes rápidos para aumentar os cliques e a conversão destes pratos."
                    bullets={[
                      "Foto atraente: Pratos com foto nítida e bem iluminada recebem até 3x mais cliques.",
                      "Ajuste de desconto: Teste aumentar o desconto para 20% ou 25% para gerar interesse inicial.",
                      "Descrição sensorial: Destaque ingredientes especiais, crocância ou tempero marcante.",
                      "Combos e adicionais: Monte opções de combo com refrigerante ou sobremesa."
                    ]}
                    size="sm"
                    align="right"
                  />
                </div>
              </div>
              <p className="text-[12px] text-[#637267] dark:text-[#9CA79E] mb-4">
                Itens em promoção que precisam de ajuste de preço ou foto
              </p>

              <div className="space-y-3">
                {allSlowPerformers.length === 0 ? (
                  <div className="text-center py-8 text-[13px] text-[#637267] dark:text-[#9CA79E]">
                    Nenhum prato em promoção cadastrado ainda.
                  </div>
                ) : (
                  paginatedSlow.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-[#ECEAE2] dark:border-[#2A382E] bg-[#FAF8F0] dark:bg-[#25332A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#222C25] shrink-0 relative">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-[#9CA79E] text-[10px]">
                              Sem foto
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-[#1A241E] dark:text-[#F2EFE9] text-[14px] truncate">
                            {item.name}
                          </div>
                          <div className="text-[12px] text-[#637267] dark:text-[#9CA79E] flex flex-wrap items-center gap-2">
                            <span>De {formatBRL(item.priceCents)} por <strong className="text-[#2E7D32] dark:text-[#86EFAC]">{formatBRL(item.promoPriceCents)}</strong></span>
                            {item.discountPercentage > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-[#86EFAC] font-bold text-[10px]">
                                -{item.discountPercentage}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenPromoModal(item)}
                          className="min-h-9 w-full sm:w-auto text-[12px] font-semibold text-[#2E4233] dark:text-[#F2EFE9] bg-white dark:bg-[#1B241E] border border-[#E3E1D9] dark:border-[#2A382E] hover:bg-[#F4F3ED] dark:hover:bg-[#131A15] px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
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
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-[#ECEAE2] dark:border-[#2A382E] text-[12px] text-[#637267] dark:text-[#9CA79E]">
                <span className="font-medium text-[#637267] dark:text-[#9CA79E]">
                  {(slowPage - 1) * ITEMS_PER_BOX + 1}–{Math.min(slowPage * ITEMS_PER_BOX, allSlowPerformers.length)} de {allSlowPerformers.length} pratos
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {Array.from({ length: slowTotalPages }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSlowPage(i + 1)}
                      className={`min-h-9 min-w-9 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${
                        slowPage === i + 1
                          ? "bg-[#B4482D] dark:bg-[#E76F41] text-white dark:text-[#131A15] shadow-sm"
                          : "bg-white dark:bg-[#1B241E] text-gray-600 dark:text-[#F2EFE9] hover:bg-gray-100 dark:hover:bg-[#25332A] border border-[#E9E4D4] dark:border-[#2A382E]"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* TABELA & CARDS: GESTÃO DE PROMOÇÕES                          */}
        {/* ============================================================ */}
        <div className="bg-white dark:bg-[#1B241E] border border-[#E3E1D9] dark:border-[#2A382E] rounded-[22px] p-5 sm:p-6 shadow-xs mb-8 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-serif text-[22px] font-semibold text-[#B4482D] dark:text-[#FF7D4F]">
                  Gestão de Promoções
                </h2>
                <HelpTooltip
                  title="Gestão Centralizada:"
                  description="Edite qualquer item do cardápio para criar ou ajustar promoções."
                  bullets={[
                    "Ligue ou pause a promoção instantaneamente pelo switch de status.",
                    "Clique em Editar Promoção para alterar porcentagem e agendar datas.",
                    "Use as abas para alternar entre todos os pratos ou apenas os que estão em promoção."
                  ]}
                  size="sm"
                  align="left"
                />
              </div>
              <p className="text-[13px] text-[#637267] dark:text-[#9CA79E]">
                Altere regras de desconto, configure prazos e controle o status promocional dos seus pratos.
              </p>
            </div>

            {/* Filter Toggle Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 bg-[#F4F3EE] dark:bg-[#222C25] p-1 rounded-xl self-start sm:self-auto border border-[#EAE8E0] dark:border-[#2A382E]">
              <button
                type="button"
                onClick={() => {
                  setTableFilter("todos");
                  setTablePage(1);
                }}
                className={`min-h-9 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  tableFilter === "todos"
                    ? "bg-white dark:bg-[#1B241E] text-[#2E4233] dark:text-[#F2EFE9] shadow-xs"
                    : "text-[#637267] dark:text-[#9CA79E] hover:text-[#1A241E] dark:hover:text-[#F2EFE9]"
                }`}
              >
                Todos os Pratos ({promoProducts.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setTableFilter("em_promocao");
                  setTablePage(1);
                }}
                className={`min-h-9 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  tableFilter === "em_promocao"
                    ? "bg-white dark:bg-[#1B241E] text-[#2E4233] dark:text-[#F2EFE9] shadow-xs"
                    : "text-[#637267] dark:text-[#9CA79E] hover:text-[#1A241E] dark:hover:text-[#F2EFE9]"
                }`}
              >
                Em Promoção ({promoOnlyProducts.length})
              </button>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredTableProducts.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-[#637267] dark:text-[#9CA79E]">
                Nenhum prato encontrado com o filtro selecionado.
              </div>
            ) : (
              paginatedTableProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-4 rounded-xl border border-[#ECEAE2] dark:border-[#2A382E] bg-[#FAF8F0] dark:bg-[#222C25] space-y-3 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#1B241E] shrink-0 border border-[#ECEAE2] dark:border-[#2A382E]">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-[#9CA79E] text-[10px]">
                            Sem foto
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-[#1A241E] dark:text-[#F2EFE9] text-[14px] truncate">
                          {product.name}
                        </div>
                        <div className="text-[11px] text-[#637267] dark:text-[#9CA79E] truncate">
                          {product.categoryName || "Geral"} • ID {product.id.slice(0, 8)}
                        </div>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${
                      product.complementsCount > 0
                        ? "bg-[#EDE7F6] dark:bg-purple-950/60 text-[#512DA8] dark:text-[#D8B4FE]"
                        : "bg-gray-100 dark:bg-[#1B241E] text-gray-600 dark:text-[#9CA79E]"
                    }`}>
                      <Layers size={11} />
                      {product.complementsCount}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#ECEAE2] dark:border-[#2A382E]">
                    <div>
                      <span className="block text-[11px] text-[#637267] dark:text-[#9CA79E]">Preços</span>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-[#637267] dark:text-[#9CA79E] line-through">
                          {formatBRL(product.priceCents)}
                        </span>
                        {product.promoPriceCents ? (
                          <>
                            <span className="font-bold text-[#B4482D] dark:text-[#FF7D4F]">
                              {formatBRL(product.promoPriceCents)}
                            </span>
                            {product.discountPercentage > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-[#FDF2F0] dark:bg-[#3A2218] text-[#B4482D] dark:text-[#FF9E7A] font-bold text-[10px]">
                                -{product.discountPercentage}%
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-500 dark:text-[#9CA79E]">Sem promoção</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="block text-[11px] text-[#637267] dark:text-[#9CA79E]">Desempenho</span>
                      <div className="font-bold text-[#1A241E] dark:text-[#F2EFE9] mt-0.5">
                        {formatBRL(product.totalRevenueCents)}
                      </div>
                      <div className="text-[11px] text-[#637267] dark:text-[#9CA79E]">
                        {product.totalSold} vendas • {product.clicksCount} cliques
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#ECEAE2] dark:border-[#2A382E]">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={product.inPromo}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePromo(product.id, product.inPromo);
                        }}
                        onCheckedChange={() => handleTogglePromo(product.id, product.inPromo)}
                        activeTrackColor="bg-[#2E4233] dark:bg-emerald-500"
                        inactiveTrackColor="bg-[#B4482D] dark:bg-[#E76F41]"
                        aria-label={`Alternar promoção de ${product.name}`}
                      />
                      <span
                        className={`text-xs font-semibold ${
                          product.inPromo ? "text-[#2E4233] dark:text-[#86EFAC]" : "text-[#B4482D] dark:text-[#FF7D4F]"
                        }`}
                      >
                        {product.inPromo ? "Ativa" : "Pausada"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenPromoModal(product)}
                      className="min-h-9 px-3 rounded-lg bg-white dark:bg-[#1B241E] border border-[#E3E1D9] dark:border-[#2A382E] inline-flex items-center gap-1.5 text-[12px] font-bold text-[#B4482D] dark:text-[#FF7D4F] hover:bg-[#FAF8F0] dark:hover:bg-[#131A15] transition-colors cursor-pointer"
                    >
                      <Edit3 size={13} />
                      <span>Editar Promoção</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#ECEAE2] dark:border-[#2A382E] text-[#0D1510] dark:text-[#F2EFE9] font-bold">
                  <th className="pb-3 pl-1 font-bold text-[#0D1510] dark:text-[#F2EFE9]">Produto</th>
                  <th className="pb-3 font-bold text-[#0D1510] dark:text-[#F2EFE9]">Categoria</th>
                  <th className="pb-3 font-bold text-[#0D1510] dark:text-[#F2EFE9]">Preço Regular</th>
                  <th className="pb-3 font-bold text-[#0D1510] dark:text-[#F2EFE9]">Preço Promocional</th>
                  <th className="pb-3 font-bold text-[#0D1510] dark:text-[#F2EFE9]">Adicionais</th>
                  <th className="pb-3 font-bold text-[#0D1510] dark:text-[#F2EFE9]">Saídas / Cliques</th>
                  <th className="pb-3 font-bold text-[#0D1510] dark:text-[#F2EFE9]">Faturamento</th>
                  <th className="pb-3 text-center font-bold text-[#0D1510] dark:text-[#F2EFE9]">Status</th>
                  <th className="pb-3 text-right pr-1 font-bold text-[#0D1510] dark:text-[#F2EFE9]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEAE2]/60 dark:divide-[#2A382E]">
                {filteredTableProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[#637267] dark:text-[#9CA79E]">
                      Nenhum prato encontrado com o filtro selecionado.
                    </td>
                  </tr>
                ) : (
                  paginatedTableProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-[#FAF8F0]/70 dark:hover:bg-[#25332A]/70 transition-colors"
                    >
                      {/* Produto */}
                      <td className="py-3.5 pl-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#222C25] shrink-0 relative border border-[#ECEAE2] dark:border-[#2A382E]">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-[#9CA79E] text-[10px]">
                                Sem foto
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-[#1A241E] dark:text-[#F2EFE9] text-[14px]">
                              {product.name}
                            </div>
                            <div className="text-[11px] text-[#637267] dark:text-[#9CA79E]">
                              ID: {product.id.slice(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className="py-3.5 text-[#556358] dark:text-[#9CA79E] font-medium">
                        {product.categoryName || "Geral"}
                      </td>

                      {/* Preço Regular */}
                      <td className="py-3.5 text-[#637267] dark:text-[#9CA79E] line-through font-medium">
                        {formatBRL(product.priceCents)}
                      </td>

                      {/* Preço Promocional */}
                      <td className="py-3.5">
                        {product.promoPriceCents ? (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#B4482D] dark:text-[#FF7D4F] text-[14px]">
                              {formatBRL(product.promoPriceCents)}
                            </span>
                            {product.discountPercentage > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-[#FDF2F0] dark:bg-[#3A2218] text-[#B4482D] dark:text-[#FF9E7A] border border-[#CB5A3C]/20 dark:border-[#FF7D4F]/30 font-bold text-[10px]">
                                -{product.discountPercentage}%
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[13px] text-gray-500 dark:text-[#9CA79E] font-medium">
                            Sem promoção
                          </span>
                        )}
                      </td>

                      {/* Adicionais Vinculados */}
                      <td className="py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          product.complementsCount > 0
                            ? "bg-[#EDE7F6] dark:bg-purple-950/60 text-[#512DA8] dark:text-[#D8B4FE]"
                            : "bg-gray-100 dark:bg-[#222C25] text-gray-600 dark:text-[#9CA79E]"
                        }`}>
                          <Layers size={11} />
                          {product.complementsCount} adicionais
                        </span>
                      </td>

                      {/* Saídas / Cliques */}
                      <td className="py-3.5 text-[#334237] dark:text-[#F2EFE9]">
                        <span className="font-bold">{product.totalSold} vendas</span>
                        <span className="text-[11px] text-[#637267] dark:text-[#9CA79E] block">
                          {product.clicksCount} cliques ({product.conversionRate.toFixed(1)}%)
                        </span>
                      </td>

                      {/* Faturamento */}
                      <td className="py-3.5 font-bold text-[#1A241E] dark:text-[#F2EFE9]">
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
                            activeTrackColor="bg-[#2E4233] dark:bg-emerald-500"
                            inactiveTrackColor="bg-[#B4482D] dark:bg-[#E76F41]"
                            aria-label={`Alternar promoção de ${product.name}`}
                          />
                          <span
                            className={`text-[10.5px] font-semibold mt-0.5 transition-colors ${
                              product.inPromo ? "text-[#2E4233] dark:text-[#86EFAC]" : "text-[#B4482D] dark:text-[#FF7D4F]"
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
                          className="min-h-9 px-2 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#B4482D] dark:text-[#FF7D4F] underline decoration-[#B4482D]/60 dark:decoration-[#FF7D4F]/60 hover:decoration-[#B4482D] dark:hover:decoration-[#FF7D4F] hover:text-[#9E3E26] dark:hover:text-[#FF9E7A] transition-all cursor-pointer"
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

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-4 border-t border-[#ECEAE2] dark:border-[#2A382E] text-[12px] text-[#637267] dark:text-[#9CA79E]">
            <span className="font-medium text-[#637267] dark:text-[#9CA79E]">
              Mostrando {filteredTableProducts.length > 0 ? (tablePage - 1) * TABLE_ITEMS_PER_PAGE + 1 : 0}–{Math.min(tablePage * TABLE_ITEMS_PER_PAGE, filteredTableProducts.length)} de {filteredTableProducts.length} produtos
            </span>

            {tableTotalPages > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {Array.from({ length: tableTotalPages }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTablePage(i + 1)}
                    className={`min-h-9 min-w-9 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${
                      tablePage === i + 1
                        ? "bg-[#B4482D] dark:bg-[#E76F41] text-white dark:text-[#131A15] shadow-sm"
                        : "bg-white dark:bg-[#1B241E] text-gray-600 dark:text-[#F2EFE9] hover:bg-gray-100 dark:hover:bg-[#25332A] border border-[#E9E4D4] dark:border-[#2A382E]"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL COMPLETO DE EDIÇÃO DE PROMOÇÃO                            */}
      {/* ============================================================== */}
      {editingPromoProduct && (() => {
        const origNum = editingPromoProduct.priceCents / 100;
        const pct = parseFloat(discountPercentInput) || 0;
        const calculatedPromo = pct > 0 ? Math.max(0, origNum * (1 - pct / 100)) : origNum;
        const savings = origNum - calculatedPromo;

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Preço Promocional"
            className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => setEditingPromoProduct(null)}
          >
            <div
              className="bg-white dark:bg-[#1B241E] rounded-2xl w-full max-w-md max-h-[90dvh] overflow-hidden shadow-2xl flex flex-col border border-[#E9E4D4] dark:border-[#2A382E] animate-in zoom-in-95 duration-150 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="shrink-0 px-4 sm:px-5 py-3.5 sm:py-4 ultrashort:py-2.5 border-b border-[#E9E4D4] dark:border-[#2A382E] flex justify-between items-center gap-3 bg-[#FAF8F0] dark:bg-[#25332A]">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[#B4482D] dark:text-[#FF7D4F] text-base">Preço Promocional</h3>
                    <HelpTooltip
                      title="Estratégia de Preço Promocional:"
                      description="Como usar o desconto percentual para aumentar o giro dos itens."
                      bullets={[
                        "Âncora de Valor: Exibir o valor original riscado ao lado do promocional ativa a percepção imediata de economia no cliente.",
                        "Porta de Entrada: Ofertas atraem novos compradores para experimentar a loja e que voltam depois pelo cardápio regular.",
                        "Equilíbrio de Margem: Descontos estratégicos entre 10% e 20% aceleram o giro e a receita bruta sem sacrificar a rentabilidade."
                      ]}
                      size="sm"
                      align="left"
                    />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-[#9CA79E] font-medium truncate">
                    {editingPromoProduct.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPromoProduct(null)}
                  aria-label="Fechar edição de promoção"
                  className="min-h-9 min-w-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-[#9CA79E] hover:text-gray-800 dark:hover:text-[#F2EFE9] hover:bg-gray-100 dark:hover:bg-[#1B241E] transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSavePromoFull} className="flex flex-col flex-1 min-h-0">
                {/* Conteúdo configurável */}
                <div className={`p-4 sm:p-5 ultrashort:p-3.5 flex flex-col gap-3.5 sm:gap-4 ultrashort:gap-3 flex-1 min-h-0 overflow-y-auto transition-all duration-200 ${!promoIsActive ? "opacity-35 pointer-events-none select-none grayscale-[0.3]" : ""}`}>
                  {/* Comparativo de Preços */}
                  <div className="p-3.5 rounded-xl bg-[#FAF8F0] dark:bg-[#25332A] border border-[#E9E4D4] dark:border-[#2A382E] flex flex-wrap items-center justify-between gap-3 shadow-xs">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#111827] dark:text-[#F2EFE9]">Preço Original</span>
                      <span className="text-base font-extrabold text-red-600 dark:text-red-400 line-through decoration-red-600 dark:decoration-red-400 decoration-2">
                        {formatBRL(editingPromoProduct.priceCents)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/50 shadow-2xs">
                      <span className="text-xs font-extrabold text-[#059669] dark:text-[#34D399]">
                        -{pct > 0 ? pct : 0}%
                      </span>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-[#111827] dark:text-[#F2EFE9]">Preço Promocional</span>
                      <span className="text-2xl font-black text-[#059669] dark:text-[#34D399]">
                        {formatBRL(Math.round(calculatedPromo * 100))}
                      </span>
                      {savings > 0 && (
                        <span className="text-[11px] font-semibold text-[#059669] dark:text-[#34D399]">
                          Economia de {formatBRL(Math.round(savings * 100))}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Campo Porcentagem de Desconto */}
                  <div className="flex flex-col gap-2 p-1 rounded-xl">
                    <label className="text-xs font-bold text-[#111827] dark:text-[#F2EFE9] flex justify-between">
                      <span>Porcentagem de Desconto:</span>
                      <span className="text-[#059669] dark:text-[#34D399] font-extrabold">{pct > 0 ? `${pct}%` : "0%"}</span>
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
                        className="w-full min-h-10 bg-white dark:bg-[#131A15] border border-[#E9E4D4] dark:border-[#2A382E] rounded-xl pl-4 pr-10 py-2.5 text-base font-bold text-[#059669] dark:text-[#34D399] focus:outline-none focus:ring-2 focus:ring-[#059669]/20 dark:focus:ring-emerald-400/25 focus:border-[#059669] dark:focus:border-emerald-400 transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-[#9CA79E] font-bold text-sm">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Programação da Promoção */}
                  <div className="flex flex-col gap-2.5 pt-3 border-t border-gray-100 dark:border-[#2A382E] p-1 rounded-xl">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-700 dark:text-[#D5DDD2]">
                          Programar promoção
                        </span>
                        <HelpTooltip
                          title="Como funciona o agendamento:"
                          description="Escolha entre manter a oferta contínua ou definir datas exatas."
                          bullets={[
                            "Prazo indeterminado: A promoção permanece ativa continuamente no cardápio online até você desativá-la manualmente.",
                            "Datas programadas: O desconto entra no ar automaticamente às 00h00 da data inicial e encerra às 23h59 da data final, sem necessidade de alteração manual."
                          ]}
                          size="sm"
                          align="left"
                        />
                      </div>
                      <div className="flex items-center gap-2 select-none">
                        <button
                          type="button"
                          onClick={() => setPromoIndefinite(!promoIndefinite)}
                          className="inline-flex items-center min-h-[36px] lg:min-h-0 text-[11px] font-medium text-gray-600 dark:text-[#D5DDD2] cursor-pointer"
                        >
                          Prazo indeterminado
                        </button>
                        <Switch
                          checked={promoIndefinite}
                          onCheckedChange={setPromoIndefinite}
                          aria-label="Prazo indeterminado"
                          activeTrackColor="bg-[#2E4233] dark:bg-emerald-500"
                          inactiveTrackColor="bg-stone-300 dark:bg-[#2A382E]"
                        />
                      </div>
                    </div>

                    {/* Campos de Data de Início e Data de Término */}
                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 transition-all duration-200 ${promoIndefinite ? "opacity-35 pointer-events-none select-none grayscale-[0.3]" : ""}`}>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-medium text-gray-600 dark:text-[#D5DDD2]">Data de início</label>
                        <DeliPlusDatePicker
                          value={promoStartDate}
                          onChange={setPromoStartDate}
                          disabled={promoIndefinite}
                          placeholder="dd/mm/aaaa"
                          align="left"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-medium text-gray-600 dark:text-[#D5DDD2]">Data de término</label>
                        <DeliPlusDatePicker
                          value={promoEndDate}
                          min={promoStartDate}
                          onChange={setPromoEndDate}
                          disabled={promoIndefinite}
                          placeholder="dd/mm/aaaa"
                          align="right"
                        />
                      </div>
                    </div>

                    {/* Resumo do período programado */}
                    {!promoIndefinite && promoStartDate && promoEndDate && (
                      <div className="p-2.5 rounded-xl bg-[#FAF8F0] dark:bg-[#25332A] border border-[#E9E4D4] dark:border-[#2A382E] flex flex-wrap items-center justify-between gap-2 text-xs text-gray-700 dark:text-[#F2EFE9] animate-in fade-in">
                        <span className="text-[11px] text-gray-600 dark:text-[#9CA79E] font-medium">Período programado:</span>
                        <span className="text-[11.5px] font-bold text-[#2E4233] dark:text-[#86EFAC]">
                          {formatPromoPeriod(promoStartDate, promoEndDate, false).periodText}
                        </span>
                      </div>
                    )}

                    {/* Aviso quando ativado por prazo indeterminado */}
                    {promoIndefinite && (
                      <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in duration-150">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400 shrink-0" />
                        <span className="text-[11.5px] font-medium">A promoção está ativa por prazo indeterminado</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer / Ações */}
                <div className="shrink-0 pt-3 border-t border-[#E9E4D4] dark:border-[#2A382E] flex flex-wrap items-center justify-between gap-2 sm:gap-3 bg-[#FAF8F0] dark:bg-[#25332A] px-4 sm:px-5 py-3 ultrashort:py-2.5">
                  {/* Switch para ligar/desligar promoção */}
                  <div className="flex items-center gap-2 select-none rounded-lg">
                    <Switch
                      checked={promoIsActive}
                      onCheckedChange={setPromoIsActive}
                      aria-label="Ativar ou desativar promoção"
                      activeTrackColor="bg-[#2E4233] dark:bg-emerald-500"
                      inactiveTrackColor="bg-stone-300 dark:bg-[#2A382E]"
                    />
                    <button
                      type="button"
                      onClick={() => setPromoIsActive(!promoIsActive)}
                      className="inline-flex items-center min-h-[36px] lg:min-h-0 text-xs font-semibold text-gray-700 dark:text-[#D5DDD2] cursor-pointer"
                    >
                      {promoIsActive ? "Promoção ativa" : "Promoção desativada"}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setEditingPromoProduct(null)}
                      className="min-h-9 px-3.5 py-2 rounded-xl border border-[#E9E4D4] dark:border-[#2A382E] text-xs font-semibold text-gray-700 dark:text-[#D5DDD2] hover:bg-gray-100 dark:hover:bg-[#1B241E] transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="min-h-9 px-4 py-2 rounded-xl bg-[#2E4233] hover:bg-[#233327] dark:bg-[#E76F41] dark:hover:bg-[#FF7D4F] text-white dark:text-[#131A15] text-xs font-semibold shadow-sm transition-all cursor-pointer"
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
