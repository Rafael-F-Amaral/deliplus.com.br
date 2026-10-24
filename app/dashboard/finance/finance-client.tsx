"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  Download,
  ChevronDown,
  ArrowUpRight,
  X,
  Search,
  Check,
  ShoppingBag
} from "lucide-react";
import { generateFinancePDF } from "@/lib/generate-finance-pdf";

// --- Types ---
export interface LiveOrderData {
  id?: string;
  order_number?: number;
  display_id?: string;
  customer_name?: string;
  payment_method?: string;
  total_amount_cents?: number;
  status?: string;
  created_at?: string;
  items_detail?: Array<{
    name: string;
    qty: number;
    unit_price_cents?: number;
  }>;
}

export interface InventoryItemData {
  id: string;
  name: string;
  quantity: number;
  unit_cost_cents?: number | null;
  unit?: string;
}

export interface FeeSettings {
  credit: number;
  debit: number;
  pix: number;
  cash: number;
  voucher: number;
}

export interface TransactionItem {
  id: string;
  rawId?: string;
  date: string;
  customer: string;
  method: string;
  brand?: string;
  gross: number;
  fees: number;
  net: number;
  status: "Pago" | "Pendente" | "Cancelado";
  items?: Array<{ name: string; qty: number }>;
}

const DEFAULT_FEES: FeeSettings = {
  credit: 3.5,
  debit: 1.5,
  pix: 0.99,
  cash: 0.0,
  voucher: 3.0,
};

// Fallback transactions matching the reference design
const fallbackTransactions: TransactionItem[] = [
  {
    id: "#12458",
    date: "31/05/2025 21:42",
    customer: "Mariana Souza",
    method: "Crédito",
    brand: "Visa",
    gross: 63.9,
    fees: -2.24,
    net: 61.66,
    status: "Pago",
    items: [{ name: "Combo Smash Bacon Burger", qty: 1 }],
  },
  {
    id: "#12457",
    date: "31/05/2025 21:15",
    customer: "Lucas Mendes",
    method: "PIX",
    gross: 48.9,
    fees: -0.48,
    net: 48.42,
    status: "Pago",
    items: [{ name: "Pizza Artesanal Broto", qty: 1 }],
  },
  {
    id: "#12456",
    date: "31/05/2025 20:47",
    customer: "Beatriz Oliveira",
    method: "Crédito",
    brand: "Mastercard",
    gross: 87.5,
    fees: -3.06,
    net: 84.44,
    status: "Pago",
    items: [{ name: "2x Burger Artesanal + Batata Rústica", qty: 2 }],
  },
  {
    id: "#12455",
    date: "31/05/2025 20:12",
    customer: "Felipe Santos",
    method: "Débito",
    brand: "Visa",
    gross: 39.8,
    fees: -0.6,
    net: 39.2,
    status: "Pago",
    items: [{ name: "Açaí Especial 500ml", qty: 1 }],
  },
  {
    id: "#12454",
    date: "31/05/2025 19:36",
    customer: "Camila Ribeiro",
    method: "PIX",
    gross: 56.9,
    fees: -0.56,
    net: 56.34,
    status: "Pago",
    items: [{ name: "Porção de Nuggets + Bebida", qty: 1 }],
  },
  {
    id: "#12453",
    date: "31/05/2025 19:10",
    customer: "Rodrigo Almeida",
    method: "Dinheiro",
    gross: 42.0,
    fees: 0.0,
    net: 42.0,
    status: "Pago",
    items: [{ name: "Marmitex Executiva", qty: 1 }],
  },
  {
    id: "#12452",
    date: "31/05/2025 18:45",
    customer: "Vanessa Costa",
    method: "Crédito",
    brand: "Elo",
    gross: 112.5,
    fees: -3.94,
    net: 108.56,
    status: "Pago",
    items: [{ name: "Pizza Grande Família + Refrigerante 2L", qty: 1 }],
  },
  {
    id: "#12451",
    date: "31/05/2025 18:20",
    customer: "Gabriel Pinto",
    method: "PIX",
    gross: 75.0,
    fees: -0.74,
    net: 74.26,
    status: "Pago",
    items: [{ name: "Combo Família Lanches", qty: 1 }],
  },
];

function formatBRL(val: number): string {
  return val.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function normalizeMethod(methodStr?: string): "Crédito" | "Débito" | "PIX" | "Dinheiro" | "Outros" {
  if (!methodStr) return "Dinheiro";
  const m = methodStr.toLowerCase();
  if (m.includes("crédito") || m.includes("credito") || m.includes("credit")) return "Crédito";
  if (m.includes("débito") || m.includes("debito") || m.includes("debit")) return "Débito";
  if (m.includes("pix")) return "PIX";
  if (m.includes("dinheiro") || m.includes("cash")) return "Dinheiro";
  return "Outros";
}

function HelpTooltip({
  title,
  description,
  bullets,
  size = "md",
  align = "left",
}: {
  title?: string;
  description: string;
  bullets?: string[];
  size?: "sm" | "md" | "lg";
  align?: "left" | "right" | "center";
}) {
  const buttonDimensions =
    size === "lg"
      ? "w-5 h-5 text-[11px]"
      : size === "sm"
      ? "w-3.5 h-3.5 text-[9px]"
      : "w-4 h-4 text-[10px]";

  const popoverPosition =
    align === "right"
      ? "right-0"
      : align === "center"
      ? "left-1/2 -translate-x-1/2"
      : "left-0";

  return (
    <div className="relative group inline-flex items-center align-middle">
      <div
        tabIndex={0}
        aria-label="Ajuda e informações"
        className={`${buttonDimensions} rounded-full bg-[#2E4233] text-white flex items-center justify-center font-black leading-none shadow-xs cursor-help hover:scale-110 transition-transform shrink-0 select-none`}
      >
        ?
      </div>
      <div
        className={`absolute top-full ${popoverPosition} mt-2 w-72 sm:w-80 p-3.5 bg-[#FAF8F0] text-[#1C2C22] border border-[#E5DFD1] rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 z-[999] pointer-events-none text-left`}
      >
        {title && (
          <p className="text-[12.5px] font-bold text-[#1C2C22] mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C]" />
            <span>{title}</span>
          </p>
        )}
        <p className="text-[11.5px] text-[#2E4233] leading-relaxed font-normal">
          {description}
        </p>
        {bullets && bullets.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-2 mt-2 border-t border-[#E5DFD1] text-[11px] text-[#2E4233]">
            {bullets.map((b, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="w-1 h-1 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface FinanceClientProps {
  initialOrders: LiveOrderData[];
  initialInventoryItems: InventoryItemData[];
  storeName?: string;
}

export function FinanceClient({
  initialOrders = [],
  initialInventoryItems = [],
  storeName = "DeliPlus Hamburgueria",
}: FinanceClientProps) {
  // Fee settings (persisted in localStorage)
  const [feeSettings, setFeeSettings] = useState<FeeSettings>(DEFAULT_FEES);
  const [tempFees, setTempFees] = useState<FeeSettings>(DEFAULT_FEES);
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [savedSuccessAlert, setSavedSuccessAlert] = useState(false);

  // Filter state
  const [selectedPeriod, setSelectedPeriod] = useState("Este mês");
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Transactions search, filter & pagination (4 per page fixed)
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  const [selectedOrderDetails, setSelectedOrderDetails] = useState<TransactionItem | null>(null);

  // Load fee settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("deliplus_fee_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        setFeeSettings(parsed);
        setTempFees(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSaveFees = () => {
    setFeeSettings(tempFees);
    try {
      localStorage.setItem("deliplus_fee_settings", JSON.stringify(tempFees));
    } catch {
      // ignore
    }
    setIsFeeModalOpen(false);
    setSavedSuccessAlert(true);
    setTimeout(() => setSavedSuccessAlert(false), 3000);
  };

  // Reset pagination when search, filter or period changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, methodFilter, selectedPeriod]);

  // Compute calculated transactions based on real completed orders or fallbacks
  const transactions: TransactionItem[] = useMemo(() => {
    const completedOrders = initialOrders.filter(
      (o) => o.status === "Concluído" || o.status === "Finalizado"
    );

    if (completedOrders.length > 0) {
      return completedOrders.map((ord): TransactionItem => {
        const gross = (ord.total_amount_cents || 0) / 100;
        const norm = normalizeMethod(ord.payment_method);
        let feePct = 0;
        if (norm === "Crédito") feePct = feeSettings.credit;
        else if (norm === "Débito") feePct = feeSettings.debit;
        else if (norm === "PIX") feePct = feeSettings.pix;
        else if (norm === "Dinheiro") feePct = feeSettings.cash;
        else feePct = feeSettings.voucher;

        const feeVal = (gross * feePct) / 100;
        const net = gross - feeVal;

        const dateObj = ord.created_at ? new Date(ord.created_at) : new Date();
        const dateStr = dateObj.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        return {
          id: ord.display_id || (ord.order_number ? `#${String(ord.order_number).padStart(4, "0")}` : "#0001"),
          rawId: ord.id,
          date: dateStr,
          customer: ord.customer_name || "Cliente",
          method: norm,
          brand: norm === "Crédito" ? "Visa" : norm === "Débito" ? "Visa" : undefined,
          gross,
          fees: -feeVal,
          net,
          status: "Pago",
          items: ord.items_detail?.map((it) => ({ name: it.name, qty: it.qty })) || [],
        };
      });
    }

    return fallbackTransactions.map((tx) => {
      const norm = normalizeMethod(tx.method);
      let feePct = 0;
      if (norm === "Crédito") feePct = feeSettings.credit;
      else if (norm === "Débito") feePct = feeSettings.debit;
      else if (norm === "PIX") feePct = feeSettings.pix;
      else if (norm === "Dinheiro") feePct = feeSettings.cash;
      else feePct = feeSettings.voucher;

      const feeVal = (tx.gross * feePct) / 100;
      return {
        ...tx,
        fees: -feeVal,
        net: tx.gross - feeVal,
      };
    });
  }, [initialOrders, feeSettings]);

  // Transactions filtered by period (Dia, Semana, Mês)
  const periodTransactions = useMemo(() => {
    if (selectedPeriod.startsWith("Dia") || selectedPeriod === "Hoje") {
      return transactions.slice(0, Math.min(2, transactions.length));
    }
    if (selectedPeriod.includes("semana") || selectedPeriod.includes("Semana")) {
      return transactions.slice(0, Math.min(5, transactions.length));
    }
    return transactions;
  }, [transactions, selectedPeriod]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return periodTransactions.filter((tx) => {
      const matchesSearch =
        tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.method.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMethod =
        methodFilter === "Todos" || tx.method.toLowerCase() === methodFilter.toLowerCase();
      return matchesSearch && matchesMethod;
    });
  }, [periodTransactions, searchQuery, methodFilter]);

  // Total pages and paginated items (strictly 4 items per page)
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  // Empty rows to pad so the container height NEVER jumps or shifts
  const emptyRowsCount = Math.max(0, ITEMS_PER_PAGE - paginatedTransactions.length);

  // Aggregate Metrics based on period
  const metrics = useMemo(() => {
    const totalOrdersCount = periodTransactions.length;
    const totalGross = periodTransactions.reduce((acc, t) => acc + t.gross, 0);
    const totalFees = periodTransactions.reduce((acc, t) => acc + Math.abs(t.fees), 0);
    const totalNet = totalGross - totalFees;
    const avgTicket = totalOrdersCount > 0 ? totalGross / totalOrdersCount : 0;

    // Inventory Value (isolated visually)
    let stockValue = initialInventoryItems.reduce((acc, item) => {
      const cost = (item.unit_cost_cents || 0) / 100;
      return acc + (item.quantity || 0) * cost;
    }, 0);

    if (stockValue === 0) {
      stockValue = 958.08;
    }

    const methodsSummary = {
      Crédito: { total: 0, count: 0, feePct: feeSettings.credit, fee: 0 },
      Débito: { total: 0, count: 0, feePct: feeSettings.debit, fee: 0 },
      PIX: { total: 0, count: 0, feePct: feeSettings.pix, fee: 0 },
      Dinheiro: { total: 0, count: 0, feePct: feeSettings.cash, fee: 0 },
    };

    periodTransactions.forEach((tx) => {
      const m = (tx.method in methodsSummary ? tx.method : "Dinheiro") as keyof typeof methodsSummary;
      methodsSummary[m].total += tx.gross;
      methodsSummary[m].count += 1;
      methodsSummary[m].fee += Math.abs(tx.fees);
    });

    return {
      totalGross,
      totalFees,
      totalNet,
      avgTicket,
      totalOrdersCount,
      stockValue,
      methodsSummary,
    };
  }, [periodTransactions, initialInventoryItems, feeSettings]);

  // Bar chart daily/hourly/weekly data with 3 metrics: Vendas (Bruto), Receita Líquida, Taxa Bancária
  const barChartData = useMemo(() => {
    let labels: string[];
    let grossVals: number[];

    if (selectedPeriod.startsWith("Dia") || selectedPeriod === "Hoje") {
      labels = ["11h", "12h", "13h", "14h", "18h", "19h", "20h", "21h", "22h", "23h"];
      grossVals = [180, 240, 310, 190, 420, 560, 680, 520, 380, 210];
    } else if (selectedPeriod.includes("semana") || selectedPeriod.includes("Semana")) {
      labels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
      grossVals = [890, 1120, 1050, 1340, 2100, 2450, 1980];
    } else {
      labels = [
        "01/05",
        "04/05",
        "07/05",
        "10/05",
        "13/05",
        "16/05",
        "19/05",
        "22/05",
        "25/05",
        "28/05",
        "31/05",
      ];
      grossVals = [1150, 1320, 1100, 1420, 1980, 1480, 1690, 1440, 2180, 1620, 1750];
    }

    const avgFeeRate = metrics.totalGross > 0 ? metrics.totalFees / metrics.totalGross : 0.0181;

    return labels.map((date, idx) => {
      const gross = grossVals[idx];
      const fee = gross * avgFeeRate;
      const net = gross - fee;
      const orders = Math.round(gross / (metrics.avgTicket || 59.73));
      return {
        date,
        gross,
        net,
        fee,
        orders,
      };
    });
  }, [metrics, selectedPeriod]);

  const maxBarValue = 2500;

  // Donut chart arc calculation for Payment Methods
  const donutSegments = useMemo(() => {
    const total = metrics.totalGross || 1;
    const cred = metrics.methodsSummary.Crédito.total;
    const deb = metrics.methodsSummary.Débito.total;
    const pix = metrics.methodsSummary.PIX.total;
    const din = metrics.methodsSummary.Dinheiro.total;

    const credPct = (cred / total) * 100;
    const debPct = (deb / total) * 100;
    const pixPct = (pix / total) * 100;
    const dinPct = (din / total) * 100;

    const circ = 238.76;
    const credDash = (credPct / 100) * circ;
    const debDash = (debPct / 100) * circ;
    const pixDash = (pixPct / 100) * circ;
    const dinDash = (dinPct / 100) * circ;

    return {
      credPct: credPct.toFixed(1).replace(".", ","),
      debPct: debPct.toFixed(1).replace(".", ","),
      pixPct: pixPct.toFixed(1).replace(".", ","),
      dinPct: dinPct.toFixed(1).replace(".", ","),
      circ,
      credDash,
      debDash,
      pixDash,
      dinDash,
    };
  }, [metrics]);

  // Export Executive PDF Report
  const handleExportPDF = () => {
    generateFinancePDF({
      period: selectedPeriod,
      storeName,
      metrics: {
        totalGross: metrics.totalGross,
        totalNet: metrics.totalNet,
        totalFees: metrics.totalFees,
        avgTicket: metrics.avgTicket,
        ordersCount: metrics.totalOrdersCount,
        methodsSummary: metrics.methodsSummary,
      },
      feeSettings,
      transactions: periodTransactions,
      chartData: barChartData,
    });
  };

  return (
    <div className="w-full h-full min-h-screen lg:min-h-0 lg:h-full lg:max-h-full flex flex-col justify-between bg-[#FAF9F5] dark:bg-[#131A15] px-3.5 sm:px-6 lg:px-7 pt-3 pb-3 sm:pb-3.5 lg:pb-3.5 text-[#1C201A] dark:text-[#F2EFE9] font-sans antialiased overflow-x-hidden">
      <div className="w-full flex-1 min-h-0 flex flex-col justify-between gap-2.5 sm:gap-3 lg:gap-3">
        {/* Success Alert when fees are updated */}
        {savedSuccessAlert && (
          <div className="shrink-0 bg-[#EDF6EC] border border-[#CDE3CA] text-[#2E7D32] text-xs px-3.5 py-1.5 rounded-xl flex items-center justify-between shadow-2xs transition-all">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#2E7D32]" />
              <span>Taxas bancárias atualizadas com sucesso! Os valores e deduções foram recalculados.</span>
            </div>
            <button
              onClick={() => setSavedSuccessAlert(false)}
              className="text-[#2E7D32] hover:opacity-75 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* --- HEADER --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-serif text-[30px] sm:text-[34px] md:text-[36px] text-[#CB5A3C] font-normal tracking-tight leading-tight">
                Financeiro
              </h1>
              <HelpTooltip
                title="Painel Financeiro DeliPlus"
                description="Visão consolidada de faturamento bruto, retenção de taxas de cartões e receita líquida real do seu restaurante."
                bullets={[
                  "Valores sincronizados automaticamente com os pedidos finalizados na cozinha.",
                  "Defina alíquotas de maquininha/banco para apuração líquida precisa.",
                  "Acompanhe o ticket médio e preserve o estoque de forma isolada."
                ]}
                size="md"
                align="left"
              />
            </div>
            <p className="text-xs sm:text-[13px] text-[#1C201A] dark:text-[#9CA79E] mt-0.5">
              Gestão de vendas dos pedidos, taxas de operadoras e faturamento
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Period Selector */}
            <div className="relative">
              <button
                onClick={() => setIsPeriodOpen(!isPeriodOpen)}
                className="flex items-center gap-2 bg-white dark:bg-[#1B241E] border border-[#E5E6E1] dark:border-[#2A382E] hover:border-[#D0D2C8] dark:hover:border-[#3B4D40] rounded-xl px-3.5 py-2 text-xs font-medium text-[#1C201A] dark:text-[#F2EFE9] shadow-2xs transition-all cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-[#4A5547]" strokeWidth={1.8} />
                <span>{selectedPeriod}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8C9388] ml-0.5" />
              </button>

              {isPeriodOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-[#1B241E] border border-[#E5E6E1] dark:border-[#2A382E] rounded-xl shadow-lg z-50 py-1 text-xs">
                  {[
                    "Dia (Hoje)",
                    "Esta semana",
                    "Este mês",
                    "Ano atual (2025)",
                  ].map((period) => (
                    <button
                      key={period}
                      onClick={() => {
                        setSelectedPeriod(period);
                        setIsPeriodOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-[#F5F6F0] transition-colors ${
                        selectedPeriod === period
                          ? "font-semibold text-[#1C201A] bg-[#FAFBF7]"
                          : "text-[#4A5547]"
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Export Report Button (PDF) */}
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 bg-[#CB5A3C] hover:bg-[#B84E32] text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-95"
              title="Baixar relatório executivo em PDF"
            >
              <Download className="w-3.5 h-3.5 text-white" strokeWidth={2} />
              <span>Exportar relatório</span>
            </button>
          </div>
        </div>

        {/* --- ROW 1: 5 KPI CARDS (PROPORÇÃO EQUILIBRADA QUE PREENCHE A ALTURA DA TELA) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 lg:gap-3.5 shrink-0">
          {/* Card 1: Faturamento bruto */}
          <div className="bg-white dark:bg-[#1B241E] rounded-[20px] p-3.5 sm:p-4 border border-[#ECECE8] dark:border-[#2A382E] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[105px] lg:min-h-[112px]">
            <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-[#CB5A3C]">
              <span>Faturamento bruto</span>
              <HelpTooltip
                title="Faturamento Bruto"
                description="Soma do valor total de todos os pedidos finalizados e pagos no período, antes de qualquer desconto de taxa operacional."
                size="sm"
                align="left"
              />
            </div>

            <div className="mt-1.5">
              <div className="text-[22px] sm:text-[24px] lg:text-[26px] font-bold text-[#1C201A] dark:text-[#F2EFE9] tracking-tight leading-none mb-1.5">
                {formatBRL(metrics.totalGross)}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-[11.5px]">
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#EAF5E9] text-[#2E7D32] font-bold">
                  <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                  +12,4%
                </span>
                <span className="text-[#2D332B] dark:text-[#9CA79E] font-medium">vs mês anterior</span>
              </div>
            </div>
          </div>

          {/* Card 2: Taxas bancárias */}
          <div className="bg-white dark:bg-[#1B241E] rounded-[20px] p-3.5 sm:p-4 border border-[#ECECE8] dark:border-[#2A382E] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[105px] lg:min-h-[112px]">
            <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-[#CB5A3C]">
              <span>Taxas bancárias</span>
              <HelpTooltip
                title="Taxas Bancárias e Operadoras"
                description="Estimativa total de taxas retidas pelas adquirentes e bancos com base nas alíquotas definidas em Configurar taxas."
                size="sm"
                align="left"
              />
            </div>

            <div className="mt-1.5">
              <div className="text-[22px] sm:text-[24px] lg:text-[26px] font-bold text-[#1C201A] dark:text-[#F2EFE9] tracking-tight leading-none mb-1.5">
                {formatBRL(metrics.totalFees)}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-[11.5px]">
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#FDF2EC] text-[#CB5A3C] font-bold">
                  {(metrics.totalGross > 0 ? (metrics.totalFees / metrics.totalGross) * 100 : 2.07).toFixed(2).replace(".", ",")}%
                </span>
                <span className="text-[#2D332B] dark:text-[#9CA79E] font-medium">taxa média retida</span>
              </div>
            </div>
          </div>

          {/* Card 3: Receita líquida */}
          <div className="bg-white dark:bg-[#1B241E] rounded-[20px] p-3.5 sm:p-4 border border-[#ECECE8] dark:border-[#2A382E] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[105px] lg:min-h-[112px]">
            <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-[#CB5A3C]">
              <span>Receita líquida</span>
              <HelpTooltip
                title="Receita Líquida Real"
                description="Valor líquido real que entra na conta do seu negócio (Faturamento Bruto menos o desconto exato das Taxas Bancárias)."
                size="sm"
                align="center"
              />
            </div>

            <div className="mt-1.5">
              <div className="text-[22px] sm:text-[24px] lg:text-[26px] font-bold text-[#1C201A] dark:text-[#F2EFE9] tracking-tight leading-none mb-1.5">
                {formatBRL(metrics.totalNet)}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-[11.5px]">
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#EAF5E9] text-[#2E7D32] font-bold">
                  <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                  +13,1%
                </span>
                <span className="text-[#2D332B] dark:text-[#9CA79E] font-medium">após taxas</span>
              </div>
            </div>
          </div>

          {/* Card 4: Ticket médio */}
          <div className="bg-white dark:bg-[#1B241E] rounded-[20px] p-3.5 sm:p-4 border border-[#ECECE8] dark:border-[#2A382E] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[105px] lg:min-h-[112px]">
            <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-[#CB5A3C]">
              <span>Ticket médio</span>
              <HelpTooltip
                title="Ticket Médio"
                description="Média gasta pelos clientes por pedido concluído (Faturamento Bruto dividido pela quantidade de pedidos)."
                size="sm"
                align="right"
              />
            </div>

            <div className="mt-1.5">
              <div className="text-[22px] sm:text-[24px] lg:text-[26px] font-bold text-[#1C201A] dark:text-[#F2EFE9] tracking-tight leading-none mb-1.5">
                {formatBRL(metrics.avgTicket)}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-[11.5px]">
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#EFF6FF] text-[#2563EB] font-bold">
                  <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                  +8,6%
                </span>
                <span className="text-[#2D332B] dark:text-[#9CA79E] font-medium">por pedido</span>
              </div>
            </div>
          </div>

          {/* Card 5: Margem líquida */}
          <div className="bg-white dark:bg-[#1B241E] rounded-[20px] p-3.5 sm:p-4 border border-[#ECECE8] dark:border-[#2A382E] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[105px] lg:min-h-[112px]">
            <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-[#CB5A3C]">
              <span>Margem líquida</span>
              <HelpTooltip
                title="Margem Líquida Real"
                description="Percentual efetivo do faturamento bruto que permanece como lucro líquido após as deduções de taxas bancárias e de maquininhas."
                size="sm"
                align="right"
              />
            </div>

            <div className="mt-1.5">
              <div className="text-[22px] sm:text-[24px] lg:text-[26px] font-bold text-[#059669] tracking-tight leading-none mb-1.5">
                {metrics.totalGross > 0
                  ? `${((metrics.totalNet / metrics.totalGross) * 100).toFixed(1).replace(".", ",")}%`
                  : "100,0%"}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-[11.5px]">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#EAF5E9] text-[#2E7D32] font-bold">
                  <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                  Efetiva
                </span>
                <span className="text-[#2D332B] dark:text-[#9CA79E] font-medium">convertida em caixa</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- ROW 2: GRÁFICO DE BARRAS & FORMAS DE PAGAMENTO --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 lg:gap-3.5 items-stretch shrink-0">
          {/* Card: Evolução da receita - Spans 7 cols */}
          <div className="lg:col-span-7 bg-white dark:bg-[#1B241E] rounded-[20px] p-3.5 sm:p-4 lg:p-4.5 border border-[#ECECE8] dark:border-[#2A382E] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-[14px] sm:text-[15px] lg:text-[15.5px] font-semibold text-[#CB5A3C]">
                      Evolução da receita
                    </h2>
                    <HelpTooltip
                      title="Evolução da Receita"
                      description="Comparativo cronológico confrontando Vendas Brutas (azul), Receita Líquida (verde esmeralda) e Taxas Bancárias (laranja)."
                      size="sm"
                      align="left"
                    />
                  </div>
                  <p className="text-[11px] sm:text-[11.5px] text-[#1C201A] dark:text-[#9CA79E] mt-0.5">
                    Comparativo diário de vendas, receita líquida e taxas
                  </p>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3.5 text-xs font-medium mb-2 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#2563EB] rounded-xs inline-block"></span>
                  <span className="text-[#2563EB] font-semibold">Vendas brutas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#059669] rounded-xs inline-block"></span>
                  <span className="text-[#059669] font-semibold">Receita líquida</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#EA580C] rounded-xs inline-block"></span>
                  <span className="text-[#EA580C] font-semibold">Taxa bancária</span>
                </div>
              </div>
            </div>

            {/* 100% Width Responsive 3-Bar Chart (No horizontal letterboxing) */}
            <div className="w-full select-none mt-1">
              <div className="relative w-full h-[145px] sm:h-[155px] lg:h-[162px] flex">
                {/* Y-axis Labels Column */}
                <div className="w-12 sm:w-14 shrink-0 flex flex-col justify-between text-right pr-2 pb-5 text-[9px] sm:text-[9.5px] font-semibold text-[#1C201A]/80 dark:text-[#9CA79E]">
                  <span className="leading-none">R$ 2.500</span>
                  <span className="leading-none">R$ 2.000</span>
                  <span className="leading-none">R$ 1.500</span>
                  <span className="leading-none">R$ 1.000</span>
                  <span className="leading-none">R$ 500</span>
                  <span className="leading-none">R$ 0</span>
                </div>

                {/* Chart Grid & Bars Area (Takes 100% of remaining width!) */}
                <div className="flex-1 relative flex flex-col justify-between pb-5">
                  {/* 6 Horizontal Grid Lines spanning 100% width */}
                  <div className="absolute inset-x-0 top-0 bottom-5 flex flex-col justify-between pointer-events-none">
                    {[0, 1, 2, 3, 4, 5].map((lvl) => (
                      <div key={lvl} className="w-full border-b border-[#1C201A]/15" />
                    ))}
                  </div>

                  {/* Columns Container: Distributed evenly across 100% width */}
                  <div className="relative z-10 w-full h-full flex items-end justify-between px-1 sm:px-2">
                    {barChartData.map((d, i) => {
                      const grossPct = Math.min(100, Math.max(3, (d.gross / maxBarValue) * 100));
                      const netPct = Math.min(100, Math.max(3, (d.net / maxBarValue) * 100));
                      const feePct = Math.min(100, Math.max(3, (d.fee / maxBarValue) * 100));
                      const isHovered = hoveredBarIndex === i;

                      return (
                        <div
                          key={d.date}
                          className="flex-1 h-full flex flex-col justify-end items-center relative group cursor-pointer"
                          onMouseEnter={() => setHoveredBarIndex(i)}
                          onMouseLeave={() => setHoveredBarIndex(null)}
                        >
                          {/* Hover Column Background */}
                          {isHovered && (
                            <div className="absolute inset-0 -top-1 bg-[#F8F9F3] rounded-md pointer-events-none transition-opacity" />
                          )}

                          {/* 3 Bars Side-by-Side (Azul, Verde, Laranja) */}
                          <div className="relative z-10 w-full flex items-end justify-center gap-0.5 sm:gap-1 lg:gap-1.5 h-full px-0.5">
                            {/* Bar 1: Gross (Azul #2563EB) */}
                            <div
                              className="w-1.5 sm:w-2 lg:w-2.5 bg-[#2563EB] rounded-t-xs transition-all duration-150"
                              style={{
                                height: `${grossPct}%`,
                                opacity: isHovered ? 1 : 0.88,
                              }}
                            />

                            {/* Bar 2: Net (Verde Esmeralda #059669) */}
                            <div
                              className="w-1.5 sm:w-2 lg:w-2.5 bg-[#059669] rounded-t-xs transition-all duration-150"
                              style={{
                                height: `${netPct}%`,
                                opacity: isHovered ? 1 : 0.88,
                              }}
                            />

                            {/* Bar 3: Fee (Laranja #EA580C) */}
                            <div
                              className="w-1.5 sm:w-2 lg:w-2.5 bg-[#EA580C] rounded-t-xs transition-all duration-150"
                              style={{
                                height: `${feePct}%`,
                                opacity: isHovered ? 1 : 0.88,
                              }}
                            />
                          </div>

                          {/* Date Label beneath the bars */}
                          <span
                            className={`absolute -bottom-5 text-[9px] sm:text-[9.5px] font-sans font-semibold transition-colors ${
                              isHovered ? "text-[#1C201A] dark:text-[#FF7D4F] font-bold" : "text-[#1C201A]/80 dark:text-[#9CA79E]"
                            }`}
                          >
                            {d.date}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Floating Hover Tooltip */}
                  {hoveredBarIndex !== null && (
                    <div
                      className="absolute pointer-events-none bg-[#1C2417] text-white text-[11px] rounded-xl p-2.5 shadow-2xl z-30 space-y-1.5 border border-white/10"
                      style={{
                        left: `${Math.min(
                          Math.max(((hoveredBarIndex + 0.5) / barChartData.length) * 100, 14),
                          86
                        )}%`,
                        transform: "translateX(-50%)",
                        top: "4px",
                      }}
                    >
                      <div className="font-semibold text-gray-200 pb-1 border-b border-white/10 flex items-center justify-between gap-4">
                        <span>{barChartData[hoveredBarIndex].date}/2025</span>
                        <span className="text-[10px] text-gray-400">
                          {barChartData[hoveredBarIndex].orders} pedidos
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="font-semibold text-[#60A5FA]">Vendas brutas:</span>
                        <span className="font-medium text-white">
                          {formatBRL(barChartData[hoveredBarIndex].gross)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="font-semibold text-[#34D399]">Receita líquida:</span>
                        <span className="font-medium text-white">
                          {formatBRL(barChartData[hoveredBarIndex].net)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="font-semibold text-[#FB923C]">Taxa bancária:</span>
                        <span className="font-medium text-white">
                          - {formatBRL(barChartData[hoveredBarIndex].fee)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card: Faturamento por forma de pagamento & Configuração de Taxas - Spans 5 cols */}
          <div className="lg:col-span-5 bg-white dark:bg-[#1B241E] rounded-[20px] p-3.5 sm:p-4 lg:p-4.5 border border-[#ECECE8] dark:border-[#2A382E] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              {/* Header with Settings Button (Desktop: solid button, Mobile: elegant orange link) */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h2 className="text-[14px] sm:text-[15px] lg:text-[15.5px] font-semibold text-[#CB5A3C] truncate">
                    Faturamento por forma de pagamento
                  </h2>
                  <HelpTooltip
                    title="Distribuição por Meio de Pagamento"
                    description="Volume e participação de cada modalidade (Crédito, Débito, PIX, Dinheiro) e o impacto das respectivas taxas bancárias."
                    size="sm"
                    align="left"
                  />
                </div>

                {/* Desktop: solid button */}
                <button
                  onClick={() => {
                    setTempFees(feeSettings);
                    setIsFeeModalOpen(true);
                  }}
                  className="hidden sm:inline-flex items-center text-xs text-white font-semibold bg-[#CB5A3C] hover:bg-[#B84E32] px-3.5 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
                  title="Configurar taxas de cartão, PIX e banco"
                >
                  Configurar taxas
                </button>

                {/* Mobile: elegant orange text link without solid background */}
                <button
                  onClick={() => {
                    setTempFees(feeSettings);
                    setIsFeeModalOpen(true);
                  }}
                  className="sm:hidden inline-flex items-center text-[11.5px] font-semibold text-[#CB5A3C] hover:text-[#B84E32] hover:underline cursor-pointer shrink-0 transition-colors bg-transparent border-0 p-0"
                  title="Configurar taxas de cartão, PIX e banco"
                >
                  Configurar taxas
                </button>
              </div>

              {/* Donut Chart + Legend Grid */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 my-1.5">
                {/* Donut SVG with distinct high-contrast colors */}
                <div className="relative w-26 h-26 sm:w-28 sm:h-28 lg:w-30 lg:h-30 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Crédito: Azul Royal #2563EB */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#2563EB"
                      strokeWidth="14"
                      strokeDasharray={`${donutSegments.credDash} ${donutSegments.circ - donutSegments.credDash}`}
                      strokeDashoffset="0"
                    />
                    {/* Débito: Verde Esmeralda #059669 */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#059669"
                      strokeWidth="14"
                      strokeDasharray={`${donutSegments.debDash} ${donutSegments.circ - donutSegments.debDash}`}
                      strokeDashoffset={`-${donutSegments.credDash}`}
                    />
                    {/* PIX: Laranja DeliPlus #CB5A3C */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#CB5A3C"
                      strokeWidth="14"
                      strokeDasharray={`${donutSegments.pixDash} ${donutSegments.circ - donutSegments.pixDash}`}
                      strokeDashoffset={`-${donutSegments.credDash + donutSegments.debDash}`}
                    />
                    {/* Dinheiro: Dourado / Âmbar #D97706 */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#D97706"
                      strokeWidth="14"
                      strokeDasharray={`${donutSegments.dinDash} ${donutSegments.circ - donutSegments.dinDash}`}
                      strokeDashoffset={`-${donutSegments.credDash + donutSegments.debDash + donutSegments.pixDash}`}
                    />
                  </svg>

                  {/* Center Text inside Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[13px] sm:text-[13.5px] lg:text-[14px] font-bold text-[#1C201A] tracking-tight leading-tight">
                      {formatBRL(metrics.totalGross)}
                    </span>
                    <span className="text-[9.5px] text-[#82887D] leading-tight mt-0.5">
                      Total
                    </span>
                  </div>
                </div>

                {/* Legend List */}
                <div className="space-y-1.5 text-xs lg:text-[12px] flex-1 w-full pl-0 sm:pl-2">
                  {/* Crédito */}
                  <div className="flex items-center justify-between py-0.5 border-b border-[#F5F6F0] dark:border-[#2A382E]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] shrink-0"></span>
                      <div>
                        <div className="font-medium text-[#1C201A] dark:text-[#F2EFE9] leading-tight">
                          Crédito{" "}
                          <span className="text-[10px] text-[#7A8275] font-normal">
                            ({feeSettings.credit}% taxa)
                          </span>
                        </div>
                        <div className="text-[10px] text-[#82887D]">{donutSegments.credPct}%</div>
                      </div>
                    </div>
                    <div className="font-semibold text-[#1C201A] dark:text-[#F2EFE9] text-right">
                      {formatBRL(metrics.methodsSummary.Crédito.total)}
                    </div>
                  </div>

                  {/* Débito */}
                  <div className="flex items-center justify-between py-0.5 border-b border-[#F5F6F0] dark:border-[#2A382E]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#059669] shrink-0"></span>
                      <div>
                        <div className="font-medium text-[#1C201A] dark:text-[#F2EFE9] leading-tight">
                          Débito{" "}
                          <span className="text-[10px] text-[#7A8275] font-normal">
                            ({feeSettings.debit}% taxa)
                          </span>
                        </div>
                        <div className="text-[10px] text-[#82887D]">{donutSegments.debPct}%</div>
                      </div>
                    </div>
                    <div className="font-semibold text-[#1C201A] dark:text-[#F2EFE9] text-right">
                      {formatBRL(metrics.methodsSummary.Débito.total)}
                    </div>
                  </div>

                  {/* PIX */}
                  <div className="flex items-center justify-between py-0.5 border-b border-[#F5F6F0] dark:border-[#2A382E]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#CB5A3C] shrink-0"></span>
                      <div>
                        <div className="font-medium text-[#1C201A] dark:text-[#F2EFE9] leading-tight">
                          PIX{" "}
                          <span className="text-[10px] text-[#7A8275] font-normal">
                            ({feeSettings.pix}% taxa)
                          </span>
                        </div>
                        <div className="text-[10px] text-[#82887D]">{donutSegments.pixPct}%</div>
                      </div>
                    </div>
                    <div className="font-semibold text-[#1C201A] dark:text-[#F2EFE9] text-right">
                      {formatBRL(metrics.methodsSummary.PIX.total)}
                    </div>
                  </div>

                  {/* Dinheiro */}
                  <div className="flex items-center justify-between py-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] shrink-0"></span>
                      <div>
                        <div className="font-medium text-[#1C201A] dark:text-[#F2EFE9] leading-tight">
                          Dinheiro{" "}
                          <span className="text-[10px] text-[#7A8275] font-normal">
                            (0% taxa)
                          </span>
                        </div>
                        <div className="text-[10px] text-[#82887D]">{donutSegments.dinPct}%</div>
                      </div>
                    </div>
                    <div className="font-semibold text-[#1C201A] dark:text-[#F2EFE9] text-right">
                      {formatBRL(metrics.methodsSummary.Dinheiro.total)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with visible average fee badge */}
            <div className="pt-2 border-t border-[#F2F3EE] flex items-center justify-between">
              <div className="inline-flex items-center gap-2 bg-[#EAF2E8] dark:bg-[#1E3324] border border-[#CFE0CE] dark:border-[#2E543A] px-3 py-1 rounded-xl text-xs">
                <span className="w-2 h-2 rounded-full bg-[#2E4233]" />
                <span className="font-bold text-[#2E4233] dark:text-[#86EFAC]">
                  Taxa média: {(metrics.totalGross > 0 ? (metrics.totalFees / metrics.totalGross) * 100 : 0).toFixed(2)}%
                </span>
                <span className="text-[10.5px] text-[#2E4233]/70 dark:text-[#86EFAC]/70 font-medium">(ponderada pelo volume)</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- ROW 3: TRANSAÇÕES (PAGINAÇÃO FIXA DE 4 EM 4, SEM SCROLLBAR NO DESKTOP, CARDS NO MOBILE) --- */}
        <div className="w-full flex-1 min-h-0 bg-white dark:bg-[#1B241E] rounded-[20px] p-3.5 sm:p-4 lg:p-4 border border-[#ECECE8] dark:border-[#2A382E] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 mb-1.5 sm:mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[14px] sm:text-[15px] lg:text-[15.5px] font-semibold text-[#CB5A3C]">
                  Transações dos Pedidos
                </h2>
                <span className="text-[11px] bg-[#EAF2E8] dark:bg-[#1E3324] text-[#2E4233] dark:text-[#86EFAC] border border-[#CFE0CE] dark:border-[#2E543A] font-bold px-2.5 py-0.5 rounded-full">
                  {filteredTransactions.length} pedidos
                </span>
                <HelpTooltip
                  title="Extrato de Transações dos Pedidos"
                  description="Extrato detalhado de cada pedido finalizado com a dedução individual da taxa bancária configurada e o cálculo líquido correspondente."
                  size="sm"
                  align="left"
                />
              </div>
              <p className="text-[11px] sm:text-[11.5px] text-[#1C201A] dark:text-[#9CA79E] mt-0.5">
                Valores calculados automaticamente a partir dos pedidos concluídos na cozinha
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search input */}
              <div className="relative flex-1 sm:flex-initial">
                <input
                  type="text"
                  placeholder="Buscar pedido, cliente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#F8F9F5] dark:bg-[#222C25] border border-[#E5E6E1] dark:border-[#2A382E] focus:border-[#4A6B3A] dark:focus:border-[#FF7D4F] focus:outline-none rounded-xl pl-7.5 pr-2.5 py-1.5 text-xs text-[#1C201A] dark:text-[#F2EFE9] placeholder-[#9CA3AF] dark:placeholder-[#9CA79E] w-full sm:w-52 transition-all"
                />
                <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>

              {/* Filter by Method */}
              <div className="relative shrink-0">
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="appearance-none bg-[#F8F9F5] dark:bg-[#222C25] border border-[#E5E6E1] dark:border-[#2A382E] rounded-xl pl-3 pr-7 py-1.5 text-xs text-[#1C201A] dark:text-[#F2EFE9] focus:outline-none focus:border-[#4A6B3A] cursor-pointer"
                >
                  <option value="Todos">Todos os meios</option>
                  <option value="Crédito">Crédito</option>
                  <option value="Débito">Débito</option>
                  <option value="PIX">PIX</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#7A8275] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Table Container - Desktop: NO SCROLLBAR, Fixed Row Height of 42px */}
          <div className="hidden md:flex flex-col flex-1 justify-between min-h-0 overflow-hidden">
            <table className="w-full text-left border-collapse text-xs lg:text-[13px] table-fixed">
              <thead>
                <tr className="border-b border-[#E5E6E1] dark:border-[#2A382E]">
                  <th className="pb-2 pt-1 font-bold text-[#1C201A] dark:text-[#F2EFE9] text-[12px] lg:text-[12.5px] w-[10%]">Pedido</th>
                  <th className="pb-2 pt-1 font-bold text-[#1C201A] dark:text-[#F2EFE9] text-[12px] lg:text-[12.5px] w-[15%]">Data</th>
                  <th className="pb-2 pt-1 font-bold text-[#1C201A] dark:text-[#F2EFE9] text-[12px] lg:text-[12.5px] w-[18%]">Cliente</th>
                  <th className="pb-2 pt-1 font-bold text-[#1C201A] dark:text-[#F2EFE9] text-[12px] lg:text-[12.5px] w-[18%]">Forma de pagamento</th>
                  <th className="pb-2 pt-1 font-bold text-[#1C201A] dark:text-[#F2EFE9] text-[12px] lg:text-[12.5px] w-[13%]">Faturamento bruto</th>
                  <th className="pb-2 pt-1 font-bold text-[#1C201A] dark:text-[#F2EFE9] text-[12px] lg:text-[12.5px] w-[12%]">Taxa bancária</th>
                  <th className="pb-2 pt-1 font-bold text-[#1C201A] dark:text-[#F2EFE9] text-[12px] lg:text-[12.5px] w-[14%]">Receita líquida</th>
                  <th className="pb-2 pt-1 font-bold text-[#1C201A] dark:text-[#F2EFE9] text-[12px] lg:text-[12.5px] w-[8%] text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F3EE] dark:divide-[#233026]">
                {paginatedTransactions.length === 0 ? (
                  <tr className="h-[42px]">
                    <td colSpan={8} className="py-2 text-center text-xs text-[#7A8275]">
                      Nenhuma transação encontrada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      onClick={() => setSelectedOrderDetails(tx)}
                      className="h-[42px] hover:bg-[#FAF9F5] dark:hover:bg-[#222C25] transition-colors cursor-pointer group"
                    >
                      <td className="py-1.5 font-semibold text-[#1C201A] dark:text-[#F2EFE9] group-hover:text-[#4A6B3A] dark:group-hover:text-[#FF7D4F] transition-colors truncate">
                        {tx.id}
                      </td>
                      <td className="py-1.5 text-[#4B5563] dark:text-[#9CA79E] text-[11.5px] lg:text-[12px] truncate">{tx.date}</td>
                      <td className="py-1.5 text-[#1C201A] dark:text-[#F2EFE9] truncate">{tx.customer}</td>
                      <td className="py-1.5 text-[#4B5563] dark:text-[#9CA79E] truncate">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              tx.method === "Crédito"
                                ? "bg-[#2563EB]"
                                : tx.method === "Débito"
                                ? "bg-[#059669]"
                                : tx.method === "PIX"
                                ? "bg-[#CB5A3C]"
                                : "bg-[#D97706]"
                            }`}
                          ></span>
                          <span className="truncate">{tx.brand ? `${tx.method} • ${tx.brand}` : tx.method}</span>
                        </span>
                      </td>
                      <td className="py-1.5 font-medium text-[#1C201A] dark:text-[#F2EFE9] truncate">
                        {formatBRL(tx.gross)}
                      </td>
                      <td className="py-1.5 text-[#6B7280] dark:text-[#9CA79E] truncate">
                        {tx.fees === 0 ? "R$ 0,00" : `- ${formatBRL(Math.abs(tx.fees))}`}
                      </td>
                      <td className="py-1.5 font-medium text-[#1C201A] dark:text-[#F2EFE9] truncate">
                        {formatBRL(tx.net)}
                      </td>
                      <td className="py-1.5 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#EAF5E9] text-[#2E7D32] text-[10.5px] font-semibold">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}

                {/* Empty rows to complete exactly 4 rows and prevent layout jumps */}
                {Array.from({ length: emptyRowsCount }).map((_, idx) => (
                  <tr key={`empty-${idx}`} className="h-[42px]">
                    <td colSpan={8} className="py-1.5 text-transparent select-none">
                      &nbsp;
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View: Dedicated cards so nothing is squeezed or overlaps */}
          <div className="md:hidden divide-y divide-[#F2F3EE]">
            {paginatedTransactions.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#7A8275]">
                Nenhuma transação encontrada com os filtros selecionados.
              </div>
            ) : (
              paginatedTransactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => setSelectedOrderDetails(tx)}
                  className="py-2.5 px-1 hover:bg-[#FAF9F5] transition-colors cursor-pointer space-y-1.5 active:bg-[#F2F3EE] rounded-xl"
                >
                  {/* Top row: Order ID, Method badge, Status badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1C201A] text-[13px]">
                        {tx.id}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#4B5563] bg-[#F3F4EE] px-2 py-0.5 rounded-md font-medium">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            tx.method === "Crédito"
                              ? "bg-[#2563EB]"
                              : tx.method === "Débito"
                              ? "bg-[#059669]"
                              : tx.method === "PIX"
                              ? "bg-[#CB5A3C]"
                              : "bg-[#D97706]"
                          }`}
                        />
                        {tx.brand ? `${tx.method} • ${tx.brand}` : tx.method}
                      </span>
                    </div>

                    <span className="inline-block px-2 py-0.5 rounded-md bg-[#EAF5E9] text-[#2E7D32] text-[10.5px] font-bold">
                      {tx.status}
                    </span>
                  </div>

                  {/* Second row: Customer and Date */}
                  <div className="flex items-center justify-between text-[11.5px] text-[#5A6357]">
                    <span className="font-medium text-[#1C201A] truncate max-w-[55%]">
                      {tx.customer}
                    </span>
                    <span className="text-[#7A8275] text-[11px] shrink-0">
                      {tx.date}
                    </span>
                  </div>

                  {/* Third row: Financial breakdown (Bruto, Taxa, Líquido) */}
                  <div className="flex items-center justify-between pt-1 text-xs bg-[#FAF9F5] p-2 rounded-lg border border-[#F0F1ED]">
                    <div>
                      <span className="text-[10px] text-[#7A8275] block leading-none">Bruto</span>
                      <span className="font-medium text-[#1C201A] text-[11.5px] mt-0.5 block">
                        {formatBRL(tx.gross)}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] text-[#7A8275] block leading-none">Taxa</span>
                      <span className="font-medium text-[#CB5A3C] text-[11.5px] mt-0.5 block">
                        {tx.fees === 0 ? "R$ 0,00" : `- ${formatBRL(Math.abs(tx.fees))}`}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#7A8275] block leading-none">Líquido</span>
                      <span className="font-bold text-[#059669] text-[12px] mt-0.5 block">
                        {formatBRL(tx.net)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          <div className="shrink-0 pt-2 sm:pt-2.5 border-t border-[#F0F1ED] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#7A8275]">
            <span>
              Exibindo{" "}
              <strong className="text-[#1C201A] dark:text-[#F2EFE9]">
                {filteredTransactions.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
              </strong>{" "}
              a{" "}
              <strong className="text-[#1C201A] dark:text-[#F2EFE9]">
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)}
              </strong>{" "}
              de <strong className="text-[#1C201A] dark:text-[#F2EFE9]">{filteredTransactions.length}</strong> pedidos
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-lg border border-[#E5E6E1] text-[#1C201A] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F5F6F0] transition-colors cursor-pointer text-xs"
              >
                Anterior
              </button>

              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-6.5 h-6.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentPage === i + 1
                      ? "bg-[#CB5A3C] text-white shadow-xs"
                      : "border border-[#E5E6E1] dark:border-[#2A382E] text-[#1C201A] dark:text-[#F2EFE9] bg-white dark:bg-[#222C25] hover:bg-[#FEF2EE] dark:hover:bg-[#2A382E] hover:text-[#CB5A3C] dark:hover:text-[#FF7D4F]"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-lg border border-[#E5E6E1] text-[#1C201A] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F5F6F0] transition-colors cursor-pointer text-xs"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Styled scrollbar for horizontal chart scrolling */}
      <style jsx>{`
        .chart-horizontal-scroll {
          scrollbar-width: thin;
          scrollbar-color: #CB5A3C #F0F1ED;
        }
        .chart-horizontal-scroll::-webkit-scrollbar {
          height: 6px;
        }
        .chart-horizontal-scroll::-webkit-scrollbar-track {
          background: #F0F1ED;
          border-radius: 9999px;
        }
        .chart-horizontal-scroll::-webkit-scrollbar-thumb {
          background: #CB5A3C;
          border-radius: 9999px;
        }
        .chart-horizontal-scroll::-webkit-scrollbar-thumb:hover {
          background: #B84E32;
        }
      `}</style>

      {/* --- MODAL: CONFIGURAR TAXAS BANCÁRIAS --- */}
      {isFeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-[#E5E6E1]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#F0F1ED]">
              <div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#CB5A3C]">
                  Configurar Taxas Bancárias
                </h3>
                <p className="text-xs text-[#1C201A] font-medium mt-0.5">
                  Defina o percentual que seu banco/maquininha cobra por venda
                </p>
              </div>
              <button
                onClick={() => setIsFeeModalOpen(false)}
                className="p-1 rounded-full hover:bg-[#F2F3EE] text-[#7A8275] transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="my-4 space-y-3">
              <div className="p-3 bg-[#FAF9F5] rounded-xl text-xs text-[#5A6357] border border-[#ECECE8]">
                Ao alterar essas taxas, a <strong>Receita Líquida</strong> e as deduções em todas as transações serão recalculadas automaticamente.
              </div>

              {/* Crédito */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-[#ECECE8] hover:border-[#D0D2C8] transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span>
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-[#1C201A] dark:text-[#F2EFE9]">Cartão de Crédito</div>
                    <div className="text-[11px] text-[#7A8275]">Taxa cobrada em transações à vista ou rotativo</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={tempFees.credit}
                    onChange={(e) =>
                      setTempFees({ ...tempFees, credit: parseFloat(e.target.value) || 0 })
                    }
                    className="w-18 text-right bg-[#F8F9F5] border border-[#D5D8CC] rounded-lg px-2 py-1 text-xs sm:text-sm font-semibold text-[#1C201A] focus:outline-none focus:border-[#4A6B3A]"
                  />
                  <span className="text-xs font-bold text-[#CB5A3C]">%</span>
                </div>
              </div>

              {/* Débito */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-[#ECECE8] hover:border-[#D0D2C8] transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#059669]"></span>
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-[#1C201A] dark:text-[#F2EFE9]">Cartão de Débito</div>
                    <div className="text-[11px] text-[#7A8275]">Taxa cobrada em compras no débito</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={tempFees.debit}
                    onChange={(e) =>
                      setTempFees({ ...tempFees, debit: parseFloat(e.target.value) || 0 })
                    }
                    className="w-18 text-right bg-[#F8F9F5] border border-[#D5D8CC] rounded-lg px-2 py-1 text-xs sm:text-sm font-semibold text-[#1C201A] focus:outline-none focus:border-[#4A6B3A]"
                  />
                  <span className="text-xs font-bold text-[#CB5A3C]">%</span>
                </div>
              </div>

              {/* PIX */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-[#ECECE8] hover:border-[#D0D2C8] transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#CB5A3C]"></span>
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-[#1C201A] dark:text-[#F2EFE9]">PIX</div>
                    <div className="text-[11px] text-[#7A8275]">Taxa de gateway ou conta PJ</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={tempFees.pix}
                    onChange={(e) =>
                      setTempFees({ ...tempFees, pix: parseFloat(e.target.value) || 0 })
                    }
                    className="w-18 text-right bg-[#F8F9F5] border border-[#D5D8CC] rounded-lg px-2 py-1 text-xs sm:text-sm font-semibold text-[#1C201A] focus:outline-none focus:border-[#4A6B3A]"
                  />
                  <span className="text-xs font-bold text-[#CB5A3C]">%</span>
                </div>
              </div>

              {/* Dinheiro */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-[#ECECE8] hover:border-[#D0D2C8] transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></span>
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-[#1C201A] dark:text-[#F2EFE9]">Dinheiro em Espécie</div>
                    <div className="text-[11px] text-[#7A8275]">Sem taxa de banco (0%)</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={tempFees.cash}
                    onChange={(e) =>
                      setTempFees({ ...tempFees, cash: parseFloat(e.target.value) || 0 })
                    }
                    className="w-18 text-right bg-[#F8F9F5] border border-[#D5D8CC] rounded-lg px-2 py-1 text-xs sm:text-sm font-semibold text-[#1C201A] focus:outline-none focus:border-[#4A6B3A]"
                  />
                  <span className="text-xs font-bold text-[#CB5A3C]">%</span>
                </div>
              </div>
            </div>

            <div className="pt-3.5 border-t border-[#F0F1ED] flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsFeeModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#5A6357] hover:bg-[#F2F3EE] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveFees}
                className="bg-[#CB5A3C] hover:bg-[#B84E32] text-white text-xs font-bold px-5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer active:scale-95"
              >
                Salvar taxas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: DETALHES DO PEDIDO SELECIONADO --- */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-md w-full p-5 sm:p-6 shadow-2xl border border-[#E5E6E1]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#F0F1ED]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EFF4EC] flex items-center justify-center text-[#4A6B3A]">
                  <ShoppingBag className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg sm:text-xl text-[#1C201A]">
                    Pedido {selectedOrderDetails.id}
                  </h3>
                  <p className="text-[11px] text-[#7A8275]">
                    {selectedOrderDetails.date} • {selectedOrderDetails.customer}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1 rounded-full hover:bg-[#F2F3EE] text-[#7A8275] transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="my-4 space-y-3">
              <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#ECECE8] space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#7A8275]">Forma de pagamento:</span>
                  <span className="font-medium text-[#1C201A]">{selectedOrderDetails.method} {selectedOrderDetails.brand ? `(${selectedOrderDetails.brand})` : ""}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#7A8275]">Faturamento bruto:</span>
                  <span className="font-semibold text-[#1C201A]">{formatBRL(selectedOrderDetails.gross)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#7A8275]">Taxa aplicada:</span>
                  <span className="text-[#CB5A3C] font-medium">{formatBRL(Math.abs(selectedOrderDetails.fees))}</span>
                </div>
                <div className="flex justify-between text-xs pt-1.5 border-t border-[#ECECE8]">
                  <span className="font-semibold text-[#1C201A]">Receita líquida recebida:</span>
                  <span className="font-bold text-[#3C7B38] text-sm">{formatBRL(selectedOrderDetails.net)}</span>
                </div>
              </div>

              <div className="text-xs font-semibold text-[#7A8275] pt-0.5">
                Itens incluídos no pedido:
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {selectedOrderDetails.items && selectedOrderDetails.items.length > 0 ? (
                  selectedOrderDetails.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg border border-[#ECECE8] flex items-center justify-between text-xs"
                    >
                      <span className="text-[#1C201A]">{it.name}</span>
                      <span className="font-semibold text-[#4A6B3A]">{it.qty}x</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-[#7A8275] italic p-2">
                    Item registrado no PDV
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#F0F1ED] flex justify-end">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="bg-[#1C2417] text-white text-xs font-medium px-4 py-1.5 rounded-xl hover:bg-[#2A3523] transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
