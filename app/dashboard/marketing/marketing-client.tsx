"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useTransition } from "react";
import {
  TrendingUp,
  TrendingDown,
  Ticket,
  GraduationCap,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  Check,
  X,
  Camera,
  BookOpen,
  DollarSign,
  ShoppingBag,
  MousePointerClick,
  Utensils,
  Clock,
  Layers,
  Edit3
} from "lucide-react";
import {
  createCoupon,
  toggleCouponStatus,
  deleteCoupon,
  toggleProductPromo,
  updateProductPromoPrice
} from "./actions";

export interface PromoProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  categoryName: string;
  priceCents: number;
  promoPriceCents: number | null;
  discountPercentage: number;
  inPromo: boolean;
  complementsCount: number;
  totalSold: number;
  totalRevenueCents: number;
  clicksCount: number;
  conversionRate: number;
}

export interface CouponItem {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed" | "free_shipping";
  discount_value: number;
  min_order_cents: number;
  max_uses: number | null;
  uses_count: number;
  status: "active" | "paused" | "expired";
  expires_at: string | null;
}

interface MarketingClientProps {
  storeSlug: string;
  storeName: string;
  initialPromoProducts: PromoProduct[];
  initialCoupons: CouponItem[];
}

export default function MarketingClient({
  storeSlug = "loja",
  storeName = "Minha Loja",
  initialPromoProducts = [],
  initialCoupons = []
}: MarketingClientProps) {
  const [promoProducts, setPromoProducts] = useState<PromoProduct[]>(initialPromoProducts);
  const [coupons, setCoupons] = useState<CouponItem[]>(initialCoupons);
  const [activeTab, setActiveTab] = useState<"promos" | "coupons" | "academy">("promos");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Modal States
  const [createCouponModalOpen, setCreateCouponModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingPromoProduct, setEditingPromoProduct] = useState<PromoProduct | null>(null);
  const [editPromoPrice, setEditPromoPrice] = useState<number>(0);

  // New Coupon Form
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDiscountType, setNewDiscountType] = useState<"percentage" | "fixed" | "free_shipping">("percentage");
  const [newDiscountValue, setNewDiscountValue] = useState(10);
  const [newMinOrder, setNewMinOrder] = useState(0);
  const [newMaxUses, setNewMaxUses] = useState<number | "">("");
  const [newExpiresInDays, setNewExpiresInDays] = useState(30);

  const [, startTransition] = useTransition();

  // Helper format BRL
  const formatBRL = (cents: number | null | undefined): string => {
    if (typeof cents !== "number" || isNaN(cents)) return "R$ 0,00";
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).replace(/\s+/, " ");
  };

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Toggle Promo Status directly from marketing
  const handleTogglePromo = (product: PromoProduct) => {
    const nextInPromo = !product.inPromo;
    setPromoProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, inPromo: nextInPromo } : p))
    );

    startTransition(async () => {
      await toggleProductPromo(product.id, product.inPromo);
    });
  };

  // Save Promo Price Modal
  const handleSavePromoPrice = () => {
    if (!editingPromoProduct) return;
    const promoCents = Math.round(editPromoPrice * 100);
    const discount = Math.round(
      ((editingPromoProduct.priceCents - promoCents) / editingPromoProduct.priceCents) * 100
    );

    setPromoProducts((prev) =>
      prev.map((p) =>
        p.id === editingPromoProduct.id
          ? {
              ...p,
              promoPriceCents: promoCents,
              discountPercentage: discount,
              inPromo: true
            }
          : p
      )
    );

    const targetId = editingPromoProduct.id;
    setEditingPromoProduct(null);

    startTransition(async () => {
      await updateProductPromoPrice(targetId, promoCents, true);
    });
  };

  // Toggle Coupon Status
  const handleToggleCoupon = (coupon: CouponItem) => {
    const nextStatus = coupon.status === "active" ? "paused" : "active";
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, status: nextStatus } : c))
    );
    startTransition(async () => {
      await toggleCouponStatus(coupon.id, coupon.status);
    });
  };

  // Delete Coupon
  const handleDeleteCoupon = (id: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    setDeleteConfirmId(null);
    startTransition(async () => {
      await deleteCoupon(id);
    });
  };

  // Create Coupon
  const handleCreateCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    const formattedCode = newCode.trim().toUpperCase().replace(/\s+/g, "");
    const expiresAt = newExpiresInDays > 0
      ? new Date(Date.now() + newExpiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const tempCoupon: CouponItem = {
      id: "temp-" + Date.now(),
      code: formattedCode,
      description: newDescription.trim() || null,
      discount_type: newDiscountType,
      discount_value: newDiscountType === "free_shipping" ? 0 : Number(newDiscountValue),
      min_order_cents: Math.round(Number(newMinOrder) * 100),
      max_uses: newMaxUses === "" ? null : Number(newMaxUses),
      uses_count: 0,
      status: "active",
      expires_at: expiresAt
    };

    setCoupons((prev) => [tempCoupon, ...prev]);
    setCreateCouponModalOpen(false);

    setNewCode("");
    setNewDescription("");
    setNewDiscountType("percentage");
    setNewDiscountValue(10);
    setNewMinOrder(0);
    setNewMaxUses("");

    startTransition(async () => {
      const res = await createCoupon({
        code: formattedCode,
        description: tempCoupon.description || undefined,
        discount_type: tempCoupon.discount_type,
        discount_value: tempCoupon.discount_value,
        min_order_cents: tempCoupon.min_order_cents,
        max_uses: tempCoupon.max_uses,
        expires_at: expiresAt
      });
      if (res.success && res.coupon) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === tempCoupon.id ? (res.coupon as unknown as CouponItem) : c))
        );
      }
    });
  };

  // Top performers & Slow performers
  const topPerformers = [...promoProducts]
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 2);

  const slowPerformers = [...promoProducts]
    .filter((p) => p.inPromo)
    .sort((a, b) => a.totalSold - b.totalSold)
    .slice(0, 2);

  // Overall metrics
  const activePromoCount = promoProducts.filter((p) => p.inPromo).length;
  const totalPromoSold = promoProducts.reduce((acc, p) => acc + p.totalSold, 0);
  const totalPromoRevenue = promoProducts.reduce((acc, p) => acc + p.totalRevenueCents, 0);
  const totalPromoClicks = promoProducts.reduce((acc, p) => acc + p.clicksCount, 0);

  return (
    <div className="min-h-full bg-[#FAF8F0] pb-24 md:pb-12 text-[#1F2923]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-6 lg:pt-8">
        {/* ============================================================ */}
        {/* HEADER SECTION                                               */}
        {/* ============================================================ */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#2E4233]/10 text-[#2E4233]">
                <Sparkles size={13} />
                Inteligência de Vendas
              </span>
            </div>
            <h2 className="font-serif text-[32px] sm:text-[38px] lg:text-[42px] font-semibold text-[#1A241E] tracking-tight leading-none mb-1.5">
              Marketing & Promoções
            </h2>
            <p className="text-[14px] sm:text-[15px] text-[#5D6B60]">
              Acompanhe a saída dos pratos em promoção, crie cupons e aprenda a apresentar produtos que vendem.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const url = typeof window !== "undefined" ? `${window.location.origin}/${storeSlug}` : `https://deliplus.com.br/${storeSlug}`;
                handleCopy(url, "store-link");
              }}
              className="flex items-center gap-2 bg-white border border-[#E3E1D9] hover:bg-[#F4F3ED] text-[#2E4233] font-medium text-[14px] rounded-xl px-4 py-2.5 shadow-sm transition-all cursor-pointer"
            >
              {copiedText === "store-link" ? <Check size={18} className="text-[#2E7D32]" /> : <Copy size={18} />}
              <span>{copiedText === "store-link" ? "Link Copiado!" : "Copiar Link da Loja"}</span>
            </button>
            <button
              type="button"
              onClick={() => setCreateCouponModalOpen(true)}
              className="flex items-center gap-2 bg-[#253629] hover:bg-[#1E2C21] text-white font-medium text-[14px] rounded-xl px-5 py-2.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus size={18} />
              <span>Novo Cupom</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 4 SUMMARY METRIC CARDS                                       */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-6 lg:mb-8">
          {/* Card 1: Promoções Ativas */}
          <div className="bg-white border border-[#E3E1D9] rounded-[20px] p-4 sm:p-5 lg:p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)] flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F4F3EE] border border-[#ECEAE2] flex items-center justify-center text-[#2E4233] shrink-0">
                <Utensils size={19} strokeWidth={2} />
              </div>
              <span className="text-[13px] sm:text-[14px] font-medium text-[#5D6B60] leading-tight">
                Pratos em Promoção
              </span>
            </div>
            <div>
              <div className="text-[26px] sm:text-[32px] font-bold text-[#1A241E] tracking-tight leading-none mb-1.5">
                {activePromoCount} ativos
              </div>
              <div className="text-[12px] sm:text-[13px] font-medium text-[#2E7D32] flex items-center gap-1">
                <span>●</span>
                <span>Configurados no cardápio</span>
              </div>
            </div>
          </div>

          {/* Card 2: Pedidos c/ Itens Promocionais */}
          <div className="bg-white border border-[#E3E1D9] rounded-[20px] p-4 sm:p-5 lg:p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)] flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F4F3EE] border border-[#ECEAE2] flex items-center justify-center text-[#CB5A3C] shrink-0">
                <ShoppingBag size={19} strokeWidth={2} />
              </div>
              <span className="text-[13px] sm:text-[14px] font-medium text-[#5D6B60] leading-tight">
                Pratos Promocionais Vendidos
              </span>
            </div>
            <div>
              <div className="text-[26px] sm:text-[32px] font-bold text-[#1A241E] tracking-tight leading-none mb-1.5">
                {totalPromoSold} saídas
              </div>
              <div className="text-[12px] sm:text-[13px] font-medium text-[#2E7D32] flex items-center gap-1">
                <span>▲</span>
                <span>Alta aceitação no balcão</span>
              </div>
            </div>
          </div>

          {/* Card 3: Faturamento Gerado */}
          <div className="bg-white border border-[#E3E1D9] rounded-[20px] p-4 sm:p-5 lg:p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)] flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F4F3EE] border border-[#ECEAE2] flex items-center justify-center text-[#2E4233] shrink-0">
                <DollarSign size={19} strokeWidth={2} />
              </div>
              <span className="text-[13px] sm:text-[14px] font-medium text-[#5D6B60] leading-tight">
                Faturamento das Promoções
              </span>
            </div>
            <div>
              <div className="text-[24px] sm:text-[32px] font-bold text-[#1A241E] tracking-tight leading-none mb-1.5">
                {formatBRL(totalPromoRevenue)}
              </div>
              <div className="text-[12px] sm:text-[13px] font-medium text-[#2E7D32] flex items-center gap-1">
                <span>▲</span>
                <span>Inclui adicionais vendidos</span>
              </div>
            </div>
          </div>

          {/* Card 4: Cliques / Visualizações */}
          <div className="bg-white border border-[#E3E1D9] rounded-[20px] p-4 sm:p-5 lg:p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)] flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F4F3EE] border border-[#ECEAE2] flex items-center justify-center text-[#556358] shrink-0">
                <MousePointerClick size={19} strokeWidth={2} />
              </div>
              <span className="text-[13px] sm:text-[14px] font-medium text-[#5D6B60] leading-tight">
                Cliques em Pratos Promocionais
              </span>
            </div>
            <div>
              <div className="text-[26px] sm:text-[32px] font-bold text-[#1A241E] tracking-tight leading-none mb-1.5">
                {totalPromoClicks} cliques
              </div>
              <div className="text-[12px] sm:text-[13px] font-medium text-[#2E7D32] flex items-center gap-1">
                <span>▲</span>
                <span>Interesse direto no cardápio</span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* NAVIGATION TABS (3 Core Pillars)                             */}
        {/* ============================================================ */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("promos")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-medium transition-all shadow-sm whitespace-nowrap cursor-pointer ${
              activeTab === "promos"
                ? "bg-[#253629] text-white"
                : "bg-white border border-[#E3E1D9] text-[#334237] hover:bg-[#F4F3ED]"
            }`}
          >
            <TrendingUp size={16} />
            <span>Desempenho das Promoções do Cardápio</span>
            <span className={`ml-1 text-[11px] px-2 py-0.5 rounded-full ${
              activeTab === "promos" ? "bg-white/20 text-white" : "bg-[#ECEAE2] text-[#556358]"
            }`}>
              {activePromoCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("coupons")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-medium transition-all shadow-sm whitespace-nowrap cursor-pointer ${
              activeTab === "coupons"
                ? "bg-[#253629] text-white"
                : "bg-white border border-[#E3E1D9] text-[#334237] hover:bg-[#F4F3ED]"
            }`}
          >
            <Ticket size={16} />
            <span>Cupons de Desconto</span>
            <span className={`ml-1 text-[11px] px-2 py-0.5 rounded-full ${
              activeTab === "coupons" ? "bg-white/20 text-white" : "bg-[#ECEAE2] text-[#556358]"
            }`}>
              {coupons.filter(c => c.status === "active").length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("academy")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-medium transition-all shadow-sm whitespace-nowrap cursor-pointer ${
              activeTab === "academy"
                ? "bg-[#253629] text-white"
                : "bg-white border border-[#E3E1D9] text-[#334237] hover:bg-[#F4F3ED]"
            }`}
          >
            <GraduationCap size={16} />
            <span>Academia Deli — Como Vender Mais</span>
            <span className="w-2 h-2 rounded-full bg-[#CB5A3C]"></span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: DESEMPENHO DAS PROMOÇÕES DO CARDÁPIO                  */}
        {/* ============================================================ */}
        {activeTab === "promos" && (
          <div className="space-y-6">
            {/* Split Insights: Mais Vendidos vs Menos Vendidos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Box 1: Maior Saída (Top Performers) */}
              <div className="bg-white border border-[#E3E1D9] rounded-[22px] p-5 sm:p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center font-bold">
                      <TrendingUp size={18} />
                    </div>
                    <div>
                      <h3 className="font-serif text-[18px] sm:text-[20px] font-semibold text-[#1A241E]">
                        🔥 Promoções com Maior Saída
                      </h3>
                      <p className="text-[12px] text-[#637267]">
                        Pratos promocionais que os clientes mais pedem
                      </p>
                    </div>
                  </div>
                  <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#2E7D32]">
                    Top Vendas
                  </span>
                </div>

                <div className="space-y-3">
                  {topPerformers.map((item, idx) => (
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
                          <div className="font-semibold text-[14px] text-[#1A241E] truncate flex items-center gap-1.5">
                            <span className="text-[#2E4233] font-bold">#{idx + 1}</span>
                            <span>{item.name}</span>
                          </div>
                          <div className="text-[12px] text-[#556358]">
                            De {formatBRL(item.priceCents)} por{" "}
                            <span className="text-[#2E7D32] font-semibold">
                              {formatBRL(item.promoPriceCents)}
                            </span>{" "}
                            <span className="bg-[#E8F5E9] text-[#2E7D32] text-[10px] px-1 py-0.5 rounded font-bold">
                              -{item.discountPercentage}%
                            </span>
                          </div>
                          {item.complementsCount > 0 && (
                            <div className="text-[11px] text-[#CB5A3C] mt-0.5 font-medium">
                              ★ {item.complementsCount} adicionais vinculados aumentam o ticket!
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[16px] font-bold text-[#1A241E]">
                          {item.totalSold} vendidos
                        </div>
                        <div className="text-[12px] text-[#2E7D32] font-medium">
                          {formatBRL(item.totalRevenueCents)}
                        </div>
                        <div className="text-[11px] text-[#8C988F]">
                          {item.clicksCount} cliques ({item.conversionRate.toFixed(1)}% conv.)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box 2: Menor Saída (Oportunidades de Ajuste) */}
              <div className="bg-white border border-[#E3E1D9] rounded-[22px] p-5 sm:p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#FFF3E0] text-[#E65100] flex items-center justify-center font-bold">
                      <TrendingDown size={18} />
                    </div>
                    <div>
                      <h3 className="font-serif text-[18px] sm:text-[20px] font-semibold text-[#1A241E]">
                        ⚠️ Promoções com Menor Saída
                      </h3>
                      <p className="text-[12px] text-[#637267]">
                        Itens em promoção que precisam de ajuste de preço ou foto
                      </p>
                    </div>
                  </div>
                  <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full bg-[#FFF3E0] text-[#E65100]">
                    Atenção
                  </span>
                </div>

                <div className="space-y-3">
                  {slowPerformers.map((item) => (
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
                          <div className="font-semibold text-[14px] text-[#1A241E] truncate">
                            {item.name}
                          </div>
                          <div className="text-[12px] text-[#556358]">
                            De {formatBRL(item.priceCents)} por{" "}
                            <span className="text-[#2E7D32] font-semibold">
                              {formatBRL(item.promoPriceCents)}
                            </span>{" "}
                            <span className="bg-[#E8F5E9] text-[#2E7D32] text-[10px] px-1 py-0.5 rounded font-bold">
                              -{item.discountPercentage}%
                            </span>
                          </div>
                          <div className="text-[11px] text-[#E65100] mt-0.5">
                            💡 Poucas pessoas pediram. Dica: melhore a foto ou teste combo!
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[15px] font-bold text-[#1A241E]">
                          {item.totalSold} vendidos
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPromoProduct(item);
                            setEditPromoPrice(
                              item.promoPriceCents ? item.promoPriceCents / 100 : item.priceCents / 100
                            );
                          }}
                          className="mt-1 text-[11px] font-semibold text-[#CB5A3C] hover:underline flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Edit3 size={12} />
                          Ajustar Desconto
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabela Gerenciadora Completa de Promoções */}
            <div className="bg-white border border-[#E3E1D9] rounded-[22px] p-5 sm:p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="font-serif text-[22px] font-semibold text-[#1A241E]">
                    Gerenciar Promoções do Cardápio
                  </h3>
                  <p className="text-[13px] text-[#637267]">
                    Ative, pause ou ajuste o valor promocional de cada produto em tempo real.
                  </p>
                </div>
                <div className="text-[12px] text-[#556358] bg-[#FAF8F0] border border-[#ECEAE2] px-3 py-1.5 rounded-lg">
                  Integrado com o <strong>Cardápio Oficial</strong>
                </div>
              </div>

              {/* Tabela de Produtos em Promoção */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#ECEAE2] text-[13px] font-medium text-[#738276]">
                      <th className="pb-3 pl-1 font-normal">Produto & Categoria</th>
                      <th className="pb-3 font-normal">Preço Original</th>
                      <th className="pb-3 font-normal">Preço Promocional</th>
                      <th className="pb-3 font-normal text-center">Adicionais</th>
                      <th className="pb-3 font-normal text-center">Cliques</th>
                      <th className="pb-3 font-normal text-center">Saídas</th>
                      <th className="pb-3 font-normal">Faturamento</th>
                      <th className="pb-3 font-normal text-center">Status</th>
                      <th className="pb-3 text-right font-normal pr-1">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2F1EA] text-[14px]">
                    {promoProducts.map((product) => {
                      return (
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
                                  {product.categoryName}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Preço Original */}
                          <td className="py-3.5 text-[#556358] text-[14px]">
                            {formatBRL(product.priceCents)}
                          </td>

                          {/* Preço Promocional */}
                          <td className="py-3.5">
                            {product.promoPriceCents ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#2E4233] text-[15px]">
                                  {formatBRL(product.promoPriceCents)}
                                </span>
                                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#E8F5E9] text-[#2E7D32]">
                                  -{product.discountPercentage}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-[13px]">Sem promoção</span>
                            )}
                          </td>

                          {/* Adicionais Vinculados */}
                          <td className="py-3.5 text-center">
                            {product.complementsCount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-medium bg-[#FFF3E0] text-[#E65100]">
                                <Layers size={12} />
                                {product.complementsCount} adicionais
                              </span>
                            ) : (
                              <span className="text-gray-400 text-[12px]">Nenhum</span>
                            )}
                          </td>

                          {/* Cliques */}
                          <td className="py-3.5 text-center text-[#556358] text-[14px]">
                            {product.clicksCount}
                          </td>

                          {/* Saídas */}
                          <td className="py-3.5 text-center font-bold text-[#1A241E] text-[14px]">
                            {product.totalSold}
                          </td>

                          {/* Faturamento */}
                          <td className="py-3.5 font-semibold text-[#2E4233] text-[14px]">
                            {formatBRL(product.totalRevenueCents)}
                          </td>

                          {/* Status Switch */}
                          <td className="py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePromo(product)}
                              className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-colors cursor-pointer ${
                                product.inPromo
                                  ? "bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#C8E6C9]"
                                  : "bg-[#ECEAE2] text-[#637267] hover:bg-[#DDDCD5]"
                              }`}
                            >
                              {product.inPromo ? "Ativa" : "Pausada"}
                            </button>
                          </td>

                          {/* Ação: Editar */}
                          <td className="py-3.5 text-right pr-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPromoProduct(product);
                                setEditPromoPrice(
                                  product.promoPriceCents
                                    ? product.promoPriceCents / 100
                                    : product.priceCents / 100
                                );
                              }}
                              className="text-[#CB5A3C] hover:text-[#B54A2E] text-[13px] font-medium flex items-center gap-1 ml-auto cursor-pointer"
                            >
                              <Edit3 size={14} />
                              <span>Editar</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: CUPONS DE DESCONTO                                    */}
        {/* ============================================================ */}
        {activeTab === "coupons" && (
          <div className="space-y-6">
            <div className="bg-white border border-[#E3E1D9] rounded-[22px] p-5 sm:p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-serif text-[22px] font-semibold text-[#1A241E]">
                    Cupons Ativos da Loja
                  </h3>
                  <p className="text-[13px] text-[#637267]">
                    Cupons que seus clientes inserem no checkout para ganhar desconto e finalizar pedidos.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCreateCouponModalOpen(true)}
                  className="flex items-center gap-2 bg-[#253629] text-white px-4 py-2 rounded-xl text-[13px] font-medium hover:bg-[#1E2C21] transition-colors"
                >
                  <Plus size={16} />
                  <span>Novo Cupom</span>
                </button>
              </div>

              {/* Coupons Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map((coupon) => {
                  const isPercentage = coupon.discount_type === "percentage";
                  const isFreeShipping = coupon.discount_type === "free_shipping";
                  const discountDisplay = isPercentage
                    ? `${coupon.discount_value}% OFF`
                    : isFreeShipping
                    ? "Frete Grátis"
                    : `R$ ${(coupon.discount_value / 100).toFixed(2).replace(".", ",")} OFF`;

                  const isPaused = coupon.status === "paused";

                  return (
                    <div
                      key={coupon.id}
                      className={`rounded-2xl border transition-all p-5 flex flex-col justify-between ${
                        isPaused
                          ? "bg-[#F9F9F7] border-[#E5E3DC] opacity-75"
                          : "bg-white border-[#E3E1D9] hover:border-[#2E4233]/40 shadow-sm"
                      }`}
                    >
                      <div>
                        {/* Top: Code + Status Switch */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[16px] font-bold text-[#1A241E] bg-[#FAF8F0] border border-[#E3E1D9] px-2.5 py-1 rounded-lg tracking-wider">
                              {coupon.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(coupon.code, `coupon-${coupon.id}`)}
                              className="text-[#556358] hover:text-[#1A241E] p-1.5 rounded-lg hover:bg-[#F4F3ED] transition-colors cursor-pointer"
                              title="Copiar código do cupom"
                            >
                              {copiedText === `coupon-${coupon.id}` ? (
                                <Check size={16} className="text-[#2E7D32]" />
                              ) : (
                                <Copy size={16} />
                              )}
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleCoupon(coupon)}
                            className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-colors cursor-pointer ${
                              coupon.status === "active"
                                ? "bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#C8E6C9]"
                                : "bg-[#ECEAE2] text-[#637267] hover:bg-[#DDDCD5]"
                            }`}
                          >
                            {coupon.status === "active" ? "Ativo" : "Pausado"}
                          </button>
                        </div>

                        {/* Valor de Desconto */}
                        <div className="mb-2">
                          <span className="text-[20px] font-bold text-[#2E4233]">
                            {discountDisplay}
                          </span>
                        </div>

                        {/* Descrição */}
                        {coupon.description && (
                          <p className="text-[13px] text-[#556358] mb-3 leading-snug">
                            {coupon.description}
                          </p>
                        )}

                        {/* Regras */}
                        <div className="space-y-1.5 text-[12px] text-[#637267] bg-[#FAF8F0] p-3 rounded-xl border border-[#ECEAE2] mb-4">
                          <div className="flex justify-between">
                            <span>Pedido mínimo:</span>
                            <span className="font-medium text-[#1A241E]">
                              {coupon.min_order_cents > 0
                                ? `R$ ${(coupon.min_order_cents / 100).toFixed(2).replace(".", ",")}`
                                : "Sem valor mínimo"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Usos registrados:</span>
                            <span className="font-medium text-[#1A241E]">
                              {coupon.uses_count} {coupon.max_uses ? `/ ${coupon.max_uses}` : "usos"}
                            </span>
                          </div>
                          {coupon.expires_at && (
                            <div className="flex justify-between">
                              <span>Válido até:</span>
                              <span className="font-medium text-[#1A241E]">
                                {new Date(coupon.expires_at).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-[#ECEAE2]">
                        <span className="text-[11px] text-[#8C988F]">
                          {coupon.status === "active" ? "🟢 Disponível no checkout" : "⏸️ Pausado"}
                        </span>

                        <div className="flex items-center gap-1">
                          {deleteConfirmId === coupon.id ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDeleteCoupon(coupon.id)}
                                className="text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded cursor-pointer"
                              >
                                Confirmar exclusão
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="text-[11px] text-gray-500 hover:text-gray-700 px-1 cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(coupon.id)}
                              className="text-[#8C988F] hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              title="Excluir cupom"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: ACADEMIA DELI — MINI-CURSO PRÁTICO                    */}
        {/* ============================================================ */}
        {activeTab === "academy" && (
          <div className="space-y-6">
            {/* Banner Introdução da Academia */}
            <div className="bg-gradient-to-r from-[#243427] to-[#364D3A] rounded-[22px] p-6 lg:p-8 text-white shadow-lg">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-white/10 text-white mb-3">
                  <GraduationCap size={15} />
                  Guia Rápido de Vendas para Restaurantes
                </span>
                <h3 className="font-serif text-[26px] sm:text-[32px] font-semibold tracking-tight mb-2">
                  Como transformar visitantes em pedidos repetidos
                </h3>
                <p className="text-[14px] sm:text-[15px] text-gray-200 leading-relaxed">
                  No delivery próprio, a foto e o texto são os seus únicos garçons. Aprenda os segredos simples que aumentam o ticket médio em até 40% sem gastar com equipamentos caros.
                </p>
              </div>
            </div>

            {/* Módulos do Mini-Curso */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Módulo 1: Fotografia Gastronômica */}
              <div className="bg-white border border-[#E3E1D9] rounded-[22px] p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)] flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center mb-4">
                    <Camera size={24} />
                  </div>
                  <h4 className="font-serif text-[20px] font-semibold text-[#1A241E] mb-2">
                    1. Fotos que Vendem (Usando Apenas o Celular)
                  </h4>
                  <p className="text-[14px] text-[#556358] mb-4 leading-relaxed">
                    Prato bonito no cardápio vende sozinho. O cérebro do cliente decide com os olhos em 3 segundos.
                  </p>

                  <div className="space-y-2.5 text-[13px] bg-[#FAF8F0] p-4 rounded-xl border border-[#ECEAE2] mb-4">
                    <div className="flex items-start gap-2">
                      <span className="text-[#2E7D32] font-bold">✓</span>
                      <div>
                        <strong>Luz Natural Indireta:</strong> Fotografe de dia, perto de uma janela. Nunca use o flash do celular direto no prato (ele deixa a comida pálida e gordurosa).
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#2E7D32] font-bold">✓</span>
                      <div>
                        <strong>O Ângulo de 45 Graus:</strong> É a visão natural de quem está sentado prestes a comer. Para pizzas e bowls, use o ângulo de cima (90°).
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#2E7D32] font-bold">✓</span>
                      <div>
                        <strong>Contraste de Cores:</strong> Um toque verde de cheiro-verde ou molho fresco destaca pratos escuros como carnes e hambúrgueres.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[12px] text-[#8C988F] italic border-t border-[#ECEAE2] pt-3">
                  ❌ Evite: fotos com sombras duras, pratos cortados ou bandejas plásticas amassadas.
                </div>
              </div>

              {/* Módulo 2: Copywriting e Descrição de Pratos */}
              <div className="bg-white border border-[#E3E1D9] rounded-[22px] p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)] flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF3E0] text-[#E65100] flex items-center justify-center mb-4">
                    <BookOpen size={24} />
                  </div>
                  <h4 className="font-serif text-[20px] font-semibold text-[#1A241E] mb-2">
                    2. Textos que Dão Água na Boca (Copywriting)
                  </h4>
                  <p className="text-[14px] text-[#556358] mb-4 leading-relaxed">
                    A descrição do prato serve para justificar o preço e ativar a salivação do cliente.
                  </p>

                  {/* Comparativo Antes e Depois */}
                  <div className="space-y-3 mb-4">
                    <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-[13px]">
                      <div className="text-red-700 font-bold mb-1">❌ Como NÃO escrever:</div>
                      <p className="text-red-900 italic">&ldquo;Hambúrguer com queijo, bacon e batata.&rdquo;</p>
                    </div>

                    <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-[13px]">
                      <div className="text-emerald-700 font-bold mb-1"> Como escrever para vender:</div>
                      <p className="text-emerald-950 font-medium">
                        &ldquo;Smash Burger artesanal (160g) na chapa bem tostada, queijo cheddar inglês derretido, bacon crocante em tiras e maionese secreta da casa no pão brioche dourado na manteiga.&rdquo;
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-[12px] text-[#556358] border-t border-[#ECEAE2] pt-3">
                  💡 <strong>Palavras Magnéticas:</strong> Artesanal, Crocante, Derretido na chapa, Defumado, Feito do zero.
                </div>
              </div>

              {/* Módulo 3: A Estratégia dos Adicionais */}
              <div className="bg-white border border-[#E3E1D9] rounded-[22px] p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)] flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#EDE7F6] text-[#512DA8] flex items-center justify-center mb-4">
                    <Layers size={24} />
                  </div>
                  <h4 className="font-serif text-[20px] font-semibold text-[#1A241E] mb-2">
                    3. A Estratégia dos Adicionais Lucrativos
                  </h4>
                  <p className="text-[14px] text-[#556358] mb-4 leading-relaxed">
                    A promoção do prato principal é o chamariz. O lucro real do restaurante mora nos adicionais!
                  </p>

                  <div className="space-y-2.5 text-[13px] bg-[#FAF8F0] p-4 rounded-xl border border-[#ECEAE2] mb-4">
                    <p>
                      <strong>A Regra dos 3 Adicionais:</strong> Todo prato com desconto deve ter pelo menos 2 a 3 adicionais cadastrados no Cardápio (ex: Dobro de Queijo, Bacon Extra, Molho Especial).
                    </p>
                    <p>
                      <strong>A Psicologia do Cliente:</strong> Como ele economizou R$ 6 no prato promocional, ele gasta essa economia alegremente adicionando um refrigerante ou bacon por +R$ 8!
                    </p>
                  </div>
                </div>

                <div className="text-[12px] text-[#556358] border-t border-[#ECEAE2] pt-3">
                  📈 No DeliPlus, pedidos com adicionais têm ticket médio <strong>35% maior</strong>.
                </div>
              </div>

              {/* Módulo 4: Horários e Gatilhos de Divulgação */}
              <div className="bg-white border border-[#E3E1D9] rounded-[22px] p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)] flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#E0F7FA] text-[#00838F] flex items-center justify-center mb-4">
                    <Clock size={24} />
                  </div>
                  <h4 className="font-serif text-[20px] font-semibold text-[#1A241E] mb-2">
                    4. Horários de Pico da Fome nas Redes Sociais
                  </h4>
                  <p className="text-[14px] text-[#556358] mb-4 leading-relaxed">
                    Não adianta postar no horário em que o cliente acabou de almoçar. Dispare a mensagem quando a fome apertar!
                  </p>

                  <div className="space-y-2.5 text-[13px] bg-[#FAF8F0] p-4 rounded-xl border border-[#ECEAE2] mb-4">
                    <div className="flex items-center justify-between pb-1 border-b border-[#ECEAE2]/60">
                      <span><strong>Almoço:</strong> Entre 11h00 e 11h45</span>
                      <span className="text-[#2E7D32] font-semibold">Decisão rápida</span>
                    </div>
                    <div className="flex items-center justify-between pb-1 border-b border-[#ECEAE2]/60">
                      <span><strong>Jantar & Fim de Semana:</strong> Entre 18h00 e 19h15</span>
                      <span className="text-[#2E7D32] font-semibold">Pico de pedidos</span>
                    </div>
                    <p className="pt-1 text-[#637267]">
                      Sempre coloque a chamada direta: <em>&ldquo;Link na bio para entrega rápida sem taxas!&rdquo;</em>
                    </p>
                  </div>
                </div>

                <div className="text-[12px] text-[#556358] border-t border-[#ECEAE2] pt-3">
                  💬 O WhatsApp é seu canal de recompra: use listas de transmissão nas sextas-feiras!
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL: AJUSTAR PREÇO PROMOCIONAL DO PRATO                     */}
      {/* ============================================================== */}
      {editingPromoProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E3E1D9] max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setEditingPromoProduct(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 p-1 rounded-lg"
            >
              <X size={18} />
            </button>

            <h3 className="font-serif text-[20px] font-semibold text-[#1A241E] mb-1">
              Editar Promoção do Produto
            </h3>
            <p className="text-[13px] text-[#637267] mb-4">
              Ajuste o valor com desconto de <strong>{editingPromoProduct.name}</strong>
            </p>

            <div className="bg-[#FAF8F0] p-4 rounded-xl border border-[#ECEAE2] mb-4 space-y-2 text-[14px]">
              <div className="flex justify-between">
                <span className="text-[#556358]">Preço Original:</span>
                <span className="font-semibold text-[#1A241E]">
                  {formatBRL(editingPromoProduct.priceCents)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#556358]">Novo Desconto Calculado:</span>
                <span className="font-bold text-[#2E7D32]">
                  {editPromoPrice > 0
                    ? `-${Math.round(
                        ((editingPromoProduct.priceCents - editPromoPrice * 100) /
                          editingPromoProduct.priceCents) *
                          100
                      )}%`
                    : "0%"}
                </span>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-[13px] font-medium text-[#1A241E] mb-1">
                Novo Preço Promocional (R$):
              </label>
              <input
                type="number"
                step="0.10"
                min="1"
                max={editingPromoProduct.priceCents / 100}
                value={editPromoPrice}
                onChange={(e) => setEditPromoPrice(Number(e.target.value))}
                className="w-full bg-[#FAF8F0] border border-[#E3E1D9] rounded-xl py-2.5 px-3 text-[16px] font-bold text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingPromoProduct(null)}
                className="px-4 py-2 border border-[#D5D2C7] text-[#1A241E] text-[13px] font-medium rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePromoPrice}
                className="px-5 py-2 bg-[#253629] text-white text-[13px] font-medium rounded-xl hover:bg-[#1E2C21] cursor-pointer"
              >
                Salvar Promoção
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CRIAR NOVO CUPOM                                        */}
      {/* ============================================================== */}
      {createCouponModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E3E1D9] max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setCreateCouponModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 p-1 rounded-lg"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-[#FAF8F0] border border-[#ECEAE2] flex items-center justify-center text-[#2E4233]">
                <Ticket size={20} />
              </div>
              <div>
                <h3 className="font-serif text-[20px] font-semibold text-[#1A241E]">
                  Criar Novo Cupom de Desconto
                </h3>
                <p className="text-[13px] text-[#637267]">
                  Defina o código e regras para a {storeName}
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateCouponSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#1A241E] mb-1">
                  Código do Cupom:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Ex: BEMVINDO10, SEXTOU20"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    className="flex-1 uppercase font-mono tracking-wider bg-[#FAF8F0] border border-[#E3E1D9] rounded-xl py-2 px-3 text-[14px] text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const prefixes = ["DELI", "DESCONTO", "PROMO", "TOP"];
                      const rnd = prefixes[Math.floor(Math.random() * prefixes.length)] + Math.floor(Math.random() * 90 + 10);
                      setNewCode(rnd);
                    }}
                    className="px-3 py-2 bg-[#FAF8F0] border border-[#D5D2C7] rounded-xl text-[12px] font-medium text-[#556358] hover:bg-gray-100 cursor-pointer"
                  >
                    Sugerir
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#1A241E] mb-1">
                  Descrição (opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: 10% OFF em qualquer pedido acima de R$ 40"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-[#FAF8F0] border border-[#E3E1D9] rounded-xl py-2 px-3 text-[14px] text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#1A241E] mb-1">
                  Tipo de Desconto:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewDiscountType("percentage")}
                    className={`py-2 px-3 rounded-xl border text-[13px] font-medium text-center cursor-pointer ${
                      newDiscountType === "percentage"
                        ? "bg-[#253629] text-white border-[#253629]"
                        : "bg-[#FAF8F0] border-[#E3E1D9] text-[#1A241E]"
                    }`}
                  >
                    % Porcentagem
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewDiscountType("fixed")}
                    className={`py-2 px-3 rounded-xl border text-[13px] font-medium text-center cursor-pointer ${
                      newDiscountType === "fixed"
                        ? "bg-[#253629] text-white border-[#253629]"
                        : "bg-[#FAF8F0] border-[#E3E1D9] text-[#1A241E]"
                    }`}
                  >
                    R$ Valor Fixo
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewDiscountType("free_shipping")}
                    className={`py-2 px-3 rounded-xl border text-[13px] font-medium text-center cursor-pointer ${
                      newDiscountType === "free_shipping"
                        ? "bg-[#253629] text-white border-[#253629]"
                        : "bg-[#FAF8F0] border-[#E3E1D9] text-[#1A241E]"
                    }`}
                  >
                    🛵 Frete Grátis
                  </button>
                </div>
              </div>

              {newDiscountType !== "free_shipping" && (
                <div>
                  <label className="block text-[13px] font-medium text-[#1A241E] mb-1">
                    {newDiscountType === "percentage" ? "Porcentagem (%):" : "Valor do Desconto (R$):"}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={newDiscountType === "percentage" ? "100" : "500"}
                    value={newDiscountValue}
                    onChange={(e) => setNewDiscountValue(Number(e.target.value))}
                    className="w-full bg-[#FAF8F0] border border-[#E3E1D9] rounded-xl py-2 px-3 text-[14px] text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20"
                  />
                </div>
              )}

              <div>
                <label className="block text-[13px] font-medium text-[#1A241E] mb-1">
                  Valor Mínimo do Pedido (R$) - Opcional:
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0 (sem mínimo)"
                  value={newMinOrder}
                  onChange={(e) => setNewMinOrder(Number(e.target.value))}
                  className="w-full bg-[#FAF8F0] border border-[#E3E1D9] rounded-xl py-2 px-3 text-[14px] text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#1A241E] mb-1">
                    Limite Máximo de Usos:
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ilimitado"
                    value={newMaxUses}
                    onChange={(e) => setNewMaxUses(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-[#FAF8F0] border border-[#E3E1D9] rounded-xl py-2 px-3 text-[14px] text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#1A241E] mb-1">
                    Validade em Dias:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newExpiresInDays}
                    onChange={(e) => setNewExpiresInDays(Number(e.target.value))}
                    className="w-full bg-[#FAF8F0] border border-[#E3E1D9] rounded-xl py-2 px-3 text-[14px] text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#ECEAE2]">
                <button
                  type="button"
                  onClick={() => setCreateCouponModalOpen(false)}
                  className="px-4 py-2 border border-[#D5D2C7] text-[#1A241E] text-[13px] font-medium rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#253629] text-white text-[13px] font-medium rounded-xl hover:bg-[#1E2C21] cursor-pointer"
                >
                  Salvar e Ativar Cupom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
