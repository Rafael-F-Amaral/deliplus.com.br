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

interface DeliPlusDatePickerProps {
  value: string;
  onChange: (val: string) => void;
  min?: string;
  disabled?: boolean;
  placeholder?: string;
}

function DeliPlusDatePicker({
  value,
  onChange,
  min,
  disabled = false,
  placeholder = "dd/mm/aaaa"
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
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
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
        className={`w-full flex items-center justify-between border border-[#E9E4D4] dark:border-[#2A382E] rounded-xl px-2.5 py-1.5 text-xs text-gray-700 dark:text-[#F2EFE9] bg-white dark:bg-[#1B241E] transition-all cursor-pointer ${
          disabled
            ? "opacity-40 cursor-not-allowed bg-gray-50"
            : "hover:border-[#CB5A3C] focus:outline-none focus:ring-1 focus:ring-[#2E4233]"
        }`}
      >
        <span className={displayFormatted ? "font-semibold text-gray-800" : "text-gray-400"}>
          {displayFormatted || placeholder}
        </span>
        <Calendar className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-1.5 z-[180] w-[250px] bg-white dark:bg-[#1B241E] border border-[#E9E4D4] dark:border-[#2A382E] rounded-2xl shadow-2xl p-3 select-none animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#ECEAE2] dark:border-[#2A382E]">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-gray-600 hover:bg-[#FAF8F0] hover:text-[#CB5A3C] transition-colors cursor-pointer"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-xs font-bold text-[#1A241E] dark:text-[#F2EFE9]">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-gray-600 hover:bg-[#FAF8F0] hover:text-[#CB5A3C] transition-colors cursor-pointer"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {daysOfWeek.map((dow, idx) => (
              <span key={idx} className="text-[10px] font-bold text-gray-400">
                {dow}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: firstDayWeekIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-7 w-7" />
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
                  className={`h-7 w-7 mx-auto rounded-lg text-xs flex items-center justify-center transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#CB5A3C] text-white font-bold shadow-xs"
                      : isToday
                      ? "border border-[#CB5A3C] text-[#CB5A3C] font-bold hover:bg-[#FAF8F0]"
                      : isPastMin
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-700 hover:bg-[#FAF8F0] hover:text-[#CB5A3C] font-medium"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#ECEAE2] text-[11px]">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="text-gray-500 hover:text-red-600 font-medium cursor-pointer"
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
              className="text-[#2E4233] hover:text-[#CB5A3C] font-bold cursor-pointer"
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

  const tableTotalPages = Math.max(1, Math.ceil(filteredTableProducts.length / TABLE_ITEMS_PER_PAGE));
  const paginatedTableProducts = useMemo(() => {
    const start = (tablePage - 1) * TABLE_ITEMS_PER_PAGE;
    return filteredTableProducts.slice(start, start + TABLE_ITEMS_PER_PAGE);
  }, [filteredTableProducts, tablePage]);

  return (
    <div className="flex-1 bg-[#F7F6F2] dark:bg-[#131A15] min-h-screen text-[#1A241E] dark:text-[#F2EFE9] p-4 sm:p-6 lg:p-8 transition-colors duration-150">
      <div className="w-full">
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
            <h1 className="font-serif text-[32px] sm:text-[38px] lg:text-[42px] font-semibold text-[#CB5A3C] tracking-tight leading-none">
              Promoções
            </h1>

            {/* Tooltip Icon & Popover */}
            <div className="relative group inline-block">
              <div className="w-5 h-5 rounded-full bg-[#2E4233] text-white flex items-center justify-center text-[12px] font-extrabold leading-none shadow-sm cursor-help hover:scale-105 transition-transform">
                ?
              </div>
              <div className="absolute top-full left-0 mt-2 w-80 p-4 bg-[#2E4233] text-white border border-transparent dark:bg-[#FAF8F0] dark:text-[#1C2C22] dark:border-[#E5DFD1] rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                <p className="text-[13px] text-white dark:text-[#1C2C22] mb-2 leading-relaxed">
                  <span className="font-extrabold text-white dark:text-[#2E4233]">Sobre esta tela:</span> Acompanhe o resultado das suas ofertas e gerencie os descontos aplicados no cardápio da sua loja.
                </p>
                <div className="flex flex-col gap-2 pt-2 border-t border-white/10 dark:border-[#E5DFD1] text-[12px] text-white/90 dark:text-[#1C2C22]">
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
                  {/* Tooltip padronizado com bullet points */}
                  <div className="relative group inline-block">
                    <div className="w-4 h-4 rounded-full bg-[#2E4233] text-white flex items-center justify-center text-[10px] font-extrabold leading-none shadow-sm cursor-help hover:scale-105 transition-transform">
                      ?
                    </div>
                    <div className="absolute top-full left-0 mt-2 w-80 p-4 bg-[#FAF8F0] text-[#1C2C22] border border-[#E5DFD1] rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                      <p className="text-[13px] text-[#1C2C22] mb-2 leading-relaxed font-bold">
                        Como potencializar seus pratos campeões:
                      </p>
                      <div className="flex flex-col gap-2 pt-2 border-t border-[#E5DFD1] text-[12px] text-[#2E4233]">
                        <div className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5"></span>
                          <span><strong>Venda Cruzada (Cross-sell):</strong> Vincule complementos e bebidas a esses pratos para elevar o ticket médio dos pedidos.</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5"></span>
                          <span><strong>Posição de Destaque:</strong> Mantenha os itens mais vendidos no topo do cardápio para guiar a decisão dos indecisos.</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5"></span>
                          <span><strong>Ajuste Fino de Margem:</strong> Com alta demanda comprovada, teste reduzir o desconto em 2% a 5% para capturar mais lucro líquido.</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5"></span>
                          <span><strong>Giro de Estoque:</strong> Assegure insumos suficientes para estes itens nunca esgotarem no horário de pico.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[12px] text-[#637267] dark:text-[#9CA79E] mb-4">
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
                        className="p-3.5 rounded-xl border border-[#ECEAE2] dark:border-[#2A382E] bg-[#FAF8F0] dark:bg-[#25332A] flex items-center justify-between gap-3 transition-colors"
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
                            <div className="font-semibold text-[#1A241E] dark:text-[#F2EFE9] text-[14px] truncate flex items-center gap-1.5">
                              <span className="text-[#CB5A3C]">#{itemRank}</span>
                              <span>{item.name}</span>
                            </div>
                            <div className="text-[12px] text-[#637267] dark:text-[#9CA79E] flex items-center gap-2">
                              <span>De {formatBRL(item.priceCents)} por <strong className="text-[#2E7D32]">{formatBRL(item.promoPriceCents)}</strong></span>
                              {item.discountPercentage > 0 && (
                                <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 font-bold text-[10px]">
                                  -{item.discountPercentage}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-[14px] font-bold text-[#1A241E] dark:text-[#F2EFE9]">
                            {item.totalSold} vendidos
                          </div>
                          <div className="text-[12px] font-semibold text-[#2E7D32]">
                            {formatBRL(item.totalRevenueCents)}
                          </div>
                          <div className="text-[11px] text-[#637267] dark:text-[#9CA79E]">
                            {item.clicksCount} cliques ({item.conversionRate.toFixed(1)}% conv.)
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Pagination Controls no padrão DeliPlus (Contador de um lado, botões do outro) */}
            {topTotalPages > 1 && (
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#ECEAE2] dark:border-[#2A382E] text-[12px] text-[#637267] dark:text-[#9CA79E]">
                <span className="font-medium text-[#637267] dark:text-[#9CA79E]">
                  {(topPage - 1) * ITEMS_PER_BOX + 1}–{Math.min(topPage * ITEMS_PER_BOX, allTopPerformers.length)} de {allTopPerformers.length} pratos
                </span>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: topTotalPages }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTopPage(i + 1)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${
                        topPage === i + 1
                          ? "bg-[#CB5A3C] text-white shadow-sm"
                          : "bg-white dark:bg-[#1B241E] text-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-[#25332A] border border-[#E9E4D4] dark:border-[#2A382E]"
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
                  {/* Tooltip com dicas de melhoria */}
                  <div className="relative group inline-block">
                    <div className="w-4 h-4 rounded-full bg-[#2E4233] text-white flex items-center justify-center text-[10px] font-extrabold leading-none shadow-sm cursor-help hover:scale-105 transition-transform">
                      ?
                    </div>
                    <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-2 w-80 p-4 bg-[#FAF8F0] text-[#1C2C22] border border-[#E5DFD1] rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                      <p className="text-[13px] text-[#1C2C22] mb-2 leading-relaxed font-bold">
                        Como melhorar a saída destes pratos:
                      </p>
                      <div className="flex flex-col gap-2 pt-2 border-t border-[#E5DFD1] text-[12px] text-[#2E4233]">
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
              <p className="text-[12px] text-[#637267] dark:text-[#9CA79E] mb-4">
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
                      className="p-3.5 rounded-xl border border-[#ECEAE2] dark:border-[#2A382E] bg-[#FAF8F0] dark:bg-[#25332A] flex items-center justify-between gap-3 transition-colors"
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
                          <div className="font-semibold text-[#1A241E] dark:text-[#F2EFE9] text-[14px] truncate">
                            {item.name}
                          </div>
                          <div className="text-[12px] text-[#637267] dark:text-[#9CA79E] flex items-center gap-2">
                            <span>De {formatBRL(item.priceCents)} por <strong className="text-[#2E7D32]">{formatBRL(item.promoPriceCents)}</strong></span>
                            {item.discountPercentage > 0 && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                -{item.discountPercentage}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenPromoModal(item)}
                          className="text-[12px] font-semibold text-[#2E4233] dark:text-[#F2EFE9] bg-white dark:bg-[#1B241E] border border-[#E3E1D9] dark:border-[#2A382E] hover:bg-[#F4F3ED] dark:hover:bg-[#25332A] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Ajustar Oferta
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pagination Controls no padrão DeliPlus (Contador de um lado, botões do outro) */}
            {slowTotalPages > 1 && (
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#ECEAE2] dark:border-[#2A382E] text-[12px] text-[#637267] dark:text-[#9CA79E]">
                <span className="font-medium text-[#637267] dark:text-[#9CA79E]">
                  {(slowPage - 1) * ITEMS_PER_BOX + 1}–{Math.min(slowPage * ITEMS_PER_BOX, allSlowPerformers.length)} de {allSlowPerformers.length} pratos
                </span>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: slowTotalPages }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSlowPage(i + 1)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${
                        slowPage === i + 1
                          ? "bg-[#CB5A3C] text-white shadow-sm"
                          : "bg-white dark:bg-[#1B241E] text-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-[#25332A] border border-[#E9E4D4] dark:border-[#2A382E]"
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
        {/* TABELA: GESTÃO DE PROMOÇÕES COM TOOLTIP E SWITCH             */}
        {/* ============================================================ */}
        <div className="bg-white dark:bg-[#1B241E] border border-[#E3E1D9] dark:border-[#2A382E] rounded-[22px] p-5 sm:p-6 shadow-xs mb-8 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-serif text-[22px] font-semibold text-[#CB5A3C]">
                  Gestão de Promoções
                </h2>
                {/* Tooltip */}
                <div className="relative group inline-block">
                  <div className="w-4 h-4 rounded-full bg-[#2E4233] text-white flex items-center justify-center text-[10px] font-extrabold leading-none shadow-sm cursor-help hover:scale-105 transition-transform">
                    ?
                  </div>
                  <div className="absolute top-full left-0 mt-2 w-80 p-4 bg-[#FAF8F0] text-[#1C2C22] border border-[#E5DFD1] rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                    <p className="text-[13px] text-[#1C2C22] mb-2 leading-relaxed">
                      <span className="font-extrabold text-white dark:text-[#2E4233]">Gestão Centralizada:</span> Edite qualquer item do cardápio para criar ou ajustar promoções.
                    </p>
                    <div className="flex flex-col gap-2 pt-2 border-t border-[#E5DFD1] text-[12px] text-[#2E4233]">
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
              <p className="text-[13px] text-[#637267] dark:text-[#9CA79E]">
                Altere regras de desconto, configure prazos e controle o status promocional dos seus pratos.
              </p>
            </div>

            {/* Filter Toggle Buttons */}
            <div className="flex items-center gap-2 bg-[#F4F3EE] dark:bg-[#222C25] p-1 rounded-xl self-start sm:self-auto border border-[#EAE8E0] dark:border-[#2A382E]">
              <button
                type="button"
                onClick={() => {
                  setTableFilter("todos");
                  setTablePage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
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
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  tableFilter === "em_promocao"
                    ? "bg-white dark:bg-[#1B241E] text-[#2E4233] dark:text-[#F2EFE9] shadow-xs"
                    : "text-[#637267] dark:text-[#9CA79E] hover:text-[#1A241E] dark:hover:text-[#F2EFE9]"
                }`}
              >
                Em Promoção ({promoOnlyProducts.length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#ECEAE2] dark:border-[#2A382E] text-[#0D1510] font-bold">
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
                    <td colSpan={9} className="py-8 text-center text-[#637267]">
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
                      <td className="py-3.5 text-[#334237] dark:text-[#F2EFE9]">
                        <span className="font-bold">{product.totalSold} vendas</span>
                        <span className="text-[11px] text-[#637267] block">
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

          {/* Pagination Controls no padrão DeliPlus (8 em 8 produtos) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-4 border-t border-[#ECEAE2] dark:border-[#2A382E] text-[12px] text-[#637267] dark:text-[#9CA79E]">
            <span className="font-medium text-[#637267] dark:text-[#9CA79E]">
              Mostrando {filteredTableProducts.length > 0 ? (tablePage - 1) * TABLE_ITEMS_PER_PAGE + 1 : 0}–{Math.min(tablePage * TABLE_ITEMS_PER_PAGE, filteredTableProducts.length)} de {filteredTableProducts.length} produtos
            </span>

            {tableTotalPages > 1 && (
              <div className="flex items-center gap-1.5">
                {Array.from({ length: tableTotalPages }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTablePage(i + 1)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${
                      tablePage === i + 1
                        ? "bg-[#CB5A3C] text-white shadow-sm"
                        : "bg-white dark:bg-[#1B241E] text-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-[#25332A] border border-[#E9E4D4] dark:border-[#2A382E]"
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
              className="bg-white dark:bg-[#1B241E] rounded-2xl w-full max-w-md shadow-2xl flex flex-col border border-[#E9E4D4] dark:border-[#2A382E] animate-in zoom-in-95 duration-150 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-[#E9E4D4] dark:border-[#2A382E] flex justify-between items-center bg-[#FAF8F0] dark:bg-[#25332A] rounded-t-2xl">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[#CB5A3C] text-base">Preço Promocional</h3>
                    {/* Tooltip Preço Promocional */}
                    <div className="relative group inline-block">
                      <div className="w-4 h-4 rounded-full bg-[#2E4233] text-white flex items-center justify-center text-[10px] font-extrabold leading-none shadow-sm cursor-help hover:scale-105 transition-transform shrink-0">
                        ?
                      </div>
                      <div className="absolute top-full left-0 sm:left-[-30px] mt-2 w-72 sm:w-80 p-3.5 bg-[#2E4233] text-white border border-transparent dark:bg-[#FAF8F0] dark:text-[#1C2C22] dark:border-[#E5DFD1] rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[160] pointer-events-none">
                        <p className="text-[12px] text-white dark:text-[#1C2C22] leading-relaxed">
                          <span className="font-extrabold text-white dark:text-[#2E4233]">Estratégia de Preço Promocional:</span>
                        </p>
                        <div className="flex flex-col gap-1.5 pt-2 mt-2 border-t border-white/10 dark:border-[#E5DFD1] text-[11px] text-white/90 dark:text-[#1C2C22]">
                          <div className="flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1"></span>
                            <span><strong>Âncora de Valor:</strong> Exibir o valor original riscado ao lado do promocional ativa a percepção imediata de economia no cliente.</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1"></span>
                            <span><strong>Porta de Entrada:</strong> Ofertas atraem novos compradores para experimentar a loja e que voltam depois pelo cardápio regular.</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1"></span>
                            <span><strong>Equilíbrio de Margem:</strong> Descontos estratégicos entre 10% e 20% aceleram o giro e a receita bruta sem sacrificar a rentabilidade.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
                  <div className="p-3.5 rounded-xl bg-[#FAF8F0] dark:bg-[#25332A] border border-[#E9E4D4] dark:border-[#2A382E] flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#111827] dark:text-[#F2EFE9]">Preço Original</span>
                      <span className="text-base font-extrabold text-red-600 line-through decoration-red-600 decoration-2">
                        {formatBRL(editingPromoProduct.priceCents)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 shadow-2xs">
                      <span className="text-xs font-extrabold text-[#059669]">
                        -{pct > 0 ? pct : 0}%
                      </span>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-[#111827] dark:text-[#F2EFE9]">Preço Promocional</span>
                      <span className="text-2xl font-black text-[#059669]">
                        {formatBRL(Math.round(calculatedPromo * 100))}
                      </span>
                      {savings > 0 && (
                        <span className="text-[11px] font-semibold text-[#059669]">
                          Economia de {formatBRL(Math.round(savings * 100))}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Campo Porcentagem de Desconto */}
                  <div className="flex flex-col gap-2 p-1 rounded-xl">
                    <label className="text-xs font-bold text-[#111827] dark:text-[#F2EFE9] flex justify-between">
                      <span>Porcentagem de Desconto:</span>
                      <span className="text-[#059669] font-extrabold">{pct > 0 ? `${pct}%` : "0%"}</span>
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
                        className="w-full border border-[#E9E4D4] rounded-xl pl-4 pr-10 py-2.5 text-base font-bold text-[#059669] focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669] transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Programação da Promoção */}
                  <div className="flex flex-col gap-2.5 pt-3 border-t border-gray-100 p-1 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-700">
                          Programar promoção
                        </span>
                        {/* Tooltip Programar Promoção */}
                        <div className="relative group inline-block">
                          <div className="w-4 h-4 rounded-full bg-[#2E4233] text-white flex items-center justify-center text-[10px] font-extrabold leading-none shadow-sm cursor-help hover:scale-105 transition-transform shrink-0">
                            ?
                          </div>
                          <div className="absolute bottom-full left-0 sm:left-[-40px] mb-2 w-72 sm:w-80 p-3.5 bg-[#2E4233] text-white border border-transparent dark:bg-[#FAF8F0] dark:text-[#1C2C22] dark:border-[#E5DFD1] rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[160] pointer-events-none">
                            <p className="text-[12px] text-white dark:text-[#1C2C22] leading-relaxed">
                              <span className="font-extrabold text-white dark:text-[#2E4233]">Como funciona o agendamento:</span>
                            </p>
                            <div className="flex flex-col gap-1.5 pt-2 mt-2 border-t border-white/10 dark:border-[#E5DFD1] text-[11px] text-white/90 dark:text-[#1C2C22]">
                              <div className="flex items-start gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1"></span>
                                <span><strong>Prazo indeterminado:</strong> A promoção permanece ativa continuamente no cardápio online até você desativá-la manualmente.</span>
                              </div>
                              <div className="flex items-start gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1"></span>
                                <span><strong>Datas programadas:</strong> O desconto entra no ar automaticamente às 00h00 da data inicial e encerra às 23h59 da data final, sem necessidade de alteração manual.</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
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

                    {/* Campos de Data de Início e Data de Término com Calendário DeliPlus */}
                    <div className={`grid grid-cols-2 gap-2.5 transition-all duration-200 ${promoIndefinite ? "opacity-35 pointer-events-none select-none grayscale-[0.3]" : ""}`}>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-medium text-gray-600">Data de início</label>
                        <DeliPlusDatePicker
                          value={promoStartDate}
                          onChange={setPromoStartDate}
                          disabled={promoIndefinite}
                          placeholder="dd/mm/aaaa"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-medium text-gray-600">Data de término</label>
                        <DeliPlusDatePicker
                          value={promoEndDate}
                          min={promoStartDate}
                          onChange={setPromoEndDate}
                          disabled={promoIndefinite}
                          placeholder="dd/mm/aaaa"
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
                <div className="pt-3 border-t border-[#E9E4D4] flex items-center justify-between gap-2 bg-[#FAF8F0] px-5 py-3.5 rounded-b-2xl">
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
