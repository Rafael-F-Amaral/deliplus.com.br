"use client";

import React, { useState, useTransition } from "react";
import {
  Megaphone,
  Ticket,
  QrCode,
  Share2,
  Gift,
  Copy,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  MessageCircle,
  Percent,
  DollarSign,
  X,
  Sparkles
} from "lucide-react";
import {
  createCoupon,
  toggleCouponStatus,
  deleteCoupon,
  updateBannerSettings,
  updateLoyaltySettings
} from "./actions";

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

export interface MarketingSettings {
  banner_enabled: boolean;
  banner_text: string;
  banner_color: "terracotta" | "forest" | "amber";
  loyalty_enabled: boolean;
  loyalty_goal_orders: number;
  loyalty_reward_cents: number;
  loyalty_reward_text: string;
}

interface MarketingClientProps {
  storeSlug: string;
  storeName: string;
  initialCoupons: CouponItem[];
  initialSettings: MarketingSettings;
}

export default function MarketingClient({
  storeSlug = "rafaelteste",
  storeName = "Minha Loja",
  initialCoupons = [],
  initialSettings
}: MarketingClientProps) {
  const [coupons, setCoupons] = useState<CouponItem[]>(initialCoupons);
  const [settings, setSettings] = useState<MarketingSettings>(initialSettings);
  const [activeTab, setActiveTab] = useState<"coupons" | "share" | "loyalty" | "banner">("coupons");
  const [couponSearch, setCouponSearch] = useState("");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New Coupon Form
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDiscountType, setNewDiscountType] = useState<"percentage" | "fixed" | "free_shipping">("percentage");
  const [newDiscountValue, setNewDiscountValue] = useState(10);
  const [newMinOrder, setNewMinOrder] = useState(0);
  const [newMaxUses, setNewMaxUses] = useState<number | "">("");
  const [newExpiresInDays, setNewExpiresInDays] = useState(30);

  // Banner Local State
  const [bannerEnabled, setBannerEnabled] = useState(settings.banner_enabled);
  const [bannerText, setBannerText] = useState(settings.banner_text);
  const [bannerColor, setBannerColor] = useState<"terracotta" | "forest" | "amber">(settings.banner_color);

  // Loyalty Local State
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(settings.loyalty_enabled);
  const [loyaltyGoal, setLoyaltyGoal] = useState(settings.loyalty_goal_orders);
  const [loyaltyRewardCents, setLoyaltyRewardCents] = useState(settings.loyalty_reward_cents);
  const [loyaltyRewardText, setLoyaltyRewardText] = useState(settings.loyalty_reward_text);

  const [isPending, startTransition] = useTransition();
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const storefrontUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${storeSlug}`
    : `https://deliplus.com.br/${storeSlug}`;

  // Copy helper
  const handleCopy = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(identifier);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Toggle Coupon
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
    setCreateModalOpen(false);

    // Reset Form
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

  // Save Banner
  const handleSaveBanner = () => {
    startTransition(async () => {
      await updateBannerSettings({
        banner_enabled: bannerEnabled,
        banner_text: bannerText,
        banner_color: bannerColor
      });
      setSettings((prev) => ({
        ...prev,
        banner_enabled: bannerEnabled,
        banner_text: bannerText,
        banner_color: bannerColor
      }));
      setSaveSuccessMessage("Banner promocional atualizado com sucesso!");
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    });
  };

  // Save Loyalty
  const handleSaveLoyalty = () => {
    startTransition(async () => {
      await updateLoyaltySettings({
        loyalty_enabled: loyaltyEnabled,
        loyalty_goal_orders: Number(loyaltyGoal),
        loyalty_reward_cents: Number(loyaltyRewardCents),
        loyalty_reward_text: loyaltyRewardText
      });
      setSettings((prev) => ({
        ...prev,
        loyalty_enabled: loyaltyEnabled,
        loyalty_goal_orders: Number(loyaltyGoal),
        loyalty_reward_cents: Number(loyaltyRewardCents),
        loyalty_reward_text: loyaltyRewardText
      }));
      setSaveSuccessMessage("Programa de fidelidade atualizado com sucesso!");
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    });
  };

  // Filtered coupons
  const filteredCoupons = coupons.filter((c) => {
    const q = couponSearch.toLowerCase();
    return (
      c.code.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-full bg-[#FAF8F0] pb-24 md:pb-12 text-[#1F2923]">
      {/* ============================================================== */}
      {/* MAIN CONTAINER                                                 */}
      {/* ============================================================== */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-6 lg:pt-8">
        {/* ============================================================ */}
        {/* HEADER SECTION                                               */}
        {/* ============================================================ */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#2E4233]/10 text-[#2E4233]">
                <Sparkles size={13} />
                Motor de Crescimento
              </span>
            </div>
            <h2 className="font-serif text-[32px] sm:text-[38px] lg:text-[42px] font-semibold text-[#1A241E] tracking-tight leading-none mb-1.5">
              Marketing & Vendas
            </h2>
            <p className="text-[14px] sm:text-[15px] text-[#5D6B60]">
              Ferramentas comprovadas para divulgar seu cardápio, atrair pedidos e fidelizar clientes da {storeName}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 bg-[#253629] hover:bg-[#1E2C21] text-white font-medium text-[14px] rounded-xl px-5 py-2.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus size={18} />
              <span>Novo Cupom</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {saveSuccessMessage && (
          <div className="mb-6 bg-[#E8F5E9] border border-[#C8E6C9] text-[#2E7D32] px-4 py-3 rounded-xl flex items-center justify-between text-[14px] font-medium animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check size={18} />
              <span>{saveSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveSuccessMessage(null)}
              className="text-[#2E7D32]/70 hover:text-[#2E7D32]"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* 4 KPI METRIC CARDS                                           */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-6 lg:mb-8">
          {/* Card 1: Faturamento com Cupons */}
          <div className="bg-white border border-[#E3E1D9] rounded-[20px] p-4 sm:p-5 lg:p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)] flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F4F3EE] border border-[#ECEAE2] flex items-center justify-center text-[#2E4233] shrink-0">
                <DollarSign size={19} strokeWidth={2} />
              </div>
              <span className="text-[13px] sm:text-[14px] font-medium text-[#5D6B60] leading-tight">
                Vendas com Cupons
              </span>
            </div>
            <div>
              <div className="text-[24px] sm:text-[30px] font-bold text-[#1A241E] tracking-tight leading-none mb-1.5">
                R$ 3.840,00
              </div>
              <div className="text-[12px] sm:text-[13px] font-medium text-[#2E7D32] flex items-center gap-1">
                <span>▲</span>
                <span>24% vs mês anterior</span>
              </div>
            </div>
          </div>

          {/* Card 2: Cupons Utilizados */}
          <div className="bg-white border border-[#E3E1D9] rounded-[20px] p-4 sm:p-5 lg:p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)] flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F4F3EE] border border-[#ECEAE2] flex items-center justify-center text-[#CB5A3C] shrink-0">
                <Ticket size={19} strokeWidth={2} />
              </div>
              <span className="text-[13px] sm:text-[14px] font-medium text-[#5D6B60] leading-tight">
                Cupons Resgatados
              </span>
            </div>
            <div>
              <div className="text-[26px] sm:text-[30px] font-bold text-[#1A241E] tracking-tight leading-none mb-1.5">
                74 usos
              </div>
              <div className="text-[12px] sm:text-[13px] font-medium text-[#2E7D32] flex items-center gap-1">
                <span>▲</span>
                <span>15% vs mês anterior</span>
              </div>
            </div>
          </div>

          {/* Card 3: Ticket Médio Promocional */}
          <div className="bg-white border border-[#E3E1D9] rounded-[20px] p-4 sm:p-5 lg:p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)] flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F4F3EE] border border-[#ECEAE2] flex items-center justify-center text-[#556358] shrink-0">
                <Percent size={19} strokeWidth={2} />
              </div>
              <span className="text-[13px] sm:text-[14px] font-medium text-[#5D6B60] leading-tight">
                Ticket c/ Cupom
              </span>
            </div>
            <div>
              <div className="text-[24px] sm:text-[30px] font-bold text-[#1A241E] tracking-tight leading-none mb-1.5">
                R$ 62,50
              </div>
              <div className="text-[12px] sm:text-[13px] font-medium text-[#2E7D32] flex items-center gap-1">
                <span>▲</span>
                <span>+18% que pedidos sem cupom</span>
              </div>
            </div>
          </div>

          {/* Card 4: Cliques no Cardápio */}
          <div className="bg-white border border-[#E3E1D9] rounded-[20px] p-4 sm:p-5 lg:p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)] flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F4F3EE] border border-[#ECEAE2] flex items-center justify-center text-[#556358] shrink-0">
                <Share2 size={19} strokeWidth={2} />
              </div>
              <span className="text-[13px] sm:text-[14px] font-medium text-[#5D6B60] leading-tight">
                Acessos ao Link
              </span>
            </div>
            <div>
              <div className="text-[26px] sm:text-[30px] font-bold text-[#1A241E] tracking-tight leading-none mb-1.5">
                1.420
              </div>
              <div className="text-[12px] sm:text-[13px] font-medium text-[#2E7D32] flex items-center gap-1">
                <span>▲</span>
                <span>32% no mês</span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* NAVIGATION TABS                                              */}
        {/* ============================================================ */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("coupons")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-medium transition-all shadow-sm whitespace-nowrap ${
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
            onClick={() => setActiveTab("share")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-medium transition-all shadow-sm whitespace-nowrap ${
              activeTab === "share"
                ? "bg-[#253629] text-white"
                : "bg-white border border-[#E3E1D9] text-[#334237] hover:bg-[#F4F3ED]"
            }`}
          >
            <QrCode size={16} />
            <span>Divulgação & QR Code</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("loyalty")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-medium transition-all shadow-sm whitespace-nowrap ${
              activeTab === "loyalty"
                ? "bg-[#253629] text-white"
                : "bg-white border border-[#E3E1D9] text-[#334237] hover:bg-[#F4F3ED]"
            }`}
          >
            <Gift size={16} />
            <span>Programa de Fidelidade</span>
            {loyaltyEnabled && (
              <span className="w-2 h-2 rounded-full bg-[#2E7D32]"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("banner")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-medium transition-all shadow-sm whitespace-nowrap ${
              activeTab === "banner"
                ? "bg-[#253629] text-white"
                : "bg-white border border-[#E3E1D9] text-[#334237] hover:bg-[#F4F3ED]"
            }`}
          >
            <Megaphone size={16} />
            <span>Banner no Cardápio</span>
            {bannerEnabled && (
              <span className="w-2 h-2 rounded-full bg-[#CB5A3C]"></span>
            )}
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: CUPONS DE DESCONTO                                    */}
        {/* ============================================================ */}
        {activeTab === "coupons" && (
          <div className="space-y-6">
            {/* Header with Search */}
            <div className="bg-white border border-[#E3E1D9] rounded-[22px] p-5 sm:p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-serif text-[22px] font-semibold text-[#1A241E]">
                    Cupons Ativos da Loja
                  </h3>
                  <p className="text-[13px] text-[#637267]">
                    Cupons criados podem ser inseridos pelos clientes na finalização do pedido.
                  </p>
                </div>

                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Buscar por código..."
                    value={couponSearch}
                    onChange={(e) => setCouponSearch(e.target.value)}
                    className="w-full bg-[#FAF8F0] border border-[#E3E1D9] rounded-xl py-2 px-3.5 text-[14px] text-[#1A241E] placeholder:text-[#8C988F] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20"
                  />
                </div>
              </div>

              {/* Coupons Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCoupons.map((coupon) => {
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
                        {/* Top Row: Code + Status Switch */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[16px] font-bold text-[#1A241E] bg-[#FAF8F0] border border-[#E3E1D9] px-2.5 py-1 rounded-lg tracking-wider">
                              {coupon.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(coupon.code, `coupon-${coupon.id}`)}
                              className="text-[#556358] hover:text-[#1A241E] p-1.5 rounded-lg hover:bg-[#F4F3ED] transition-colors"
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

                        {/* Discount Value Highlight */}
                        <div className="mb-2">
                          <span className="text-[20px] font-bold text-[#2E4233]">
                            {discountDisplay}
                          </span>
                        </div>

                        {/* Description */}
                        {coupon.description && (
                          <p className="text-[13px] text-[#556358] mb-3 leading-snug">
                            {coupon.description}
                          </p>
                        )}

                        {/* Rules */}
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
                          {coupon.status === "active" ? "🟢 Pronto para uso" : "⏸️ Pausado"}
                        </span>

                        <div className="flex items-center gap-1">
                          {deleteConfirmId === coupon.id ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDeleteCoupon(coupon.id)}
                                className="text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded"
                              >
                                Confirmar exclusão
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="text-[11px] text-gray-500 hover:text-gray-700 px-1"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(coupon.id)}
                              className="text-[#8C988F] hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
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

              {filteredCoupons.length === 0 && (
                <div className="text-center py-12 text-[#637267]">
                  <Ticket size={40} className="mx-auto mb-2 text-[#8C988F]" />
                  <p className="font-medium text-[16px] text-[#1A241E]">Nenhum cupom encontrado</p>
                  <p className="text-[14px]">Crie seu primeiro cupom para incentivar novos pedidos!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: DIVULGAÇÃO & QR CODE                                  */}
        {/* ============================================================ */}
        {activeTab === "share" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Link Oficial e QR Code */}
            <div className="lg:col-span-5 space-y-6">
              {/* Card Link Oficial */}
              <div className="bg-white border border-[#E3E1D9] rounded-[22px] p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)]">
                <h3 className="font-serif text-[20px] font-semibold text-[#1A241E] mb-1">
                  Seu Link de Cardápio Oficial
                </h3>
                <p className="text-[13px] text-[#637267] mb-4">
                  Coloque este link no seu Instagram, WhatsApp Business e mensagens.
                </p>

                <div className="flex items-center gap-2 bg-[#FAF8F0] border border-[#E3E1D9] rounded-xl p-3 mb-4">
                  <span className="font-mono text-[13px] text-[#1A241E] truncate flex-1 font-medium">
                    {storefrontUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(storefrontUrl, "store-link")}
                    className="flex items-center gap-1.5 bg-[#253629] text-white px-3 py-1.5 rounded-lg text-[13px] font-medium hover:bg-[#1E2C21] transition-colors shrink-0"
                  >
                    {copiedText === "store-link" ? (
                      <>
                        <Check size={14} />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>

                <a
                  href={`/${storeSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-[#D5D2C7] text-[#1A241E] font-medium text-[14px] hover:bg-[#FAF8F0] transition-colors"
                >
                  <ExternalLink size={16} />
                  <span>Testar Cardápio como Cliente</span>
                </a>
              </div>

              {/* Card QR Code */}
              <div className="bg-white border border-[#E3E1D9] rounded-[22px] p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)] text-center">
                <h3 className="font-serif text-[20px] font-semibold text-[#1A241E] mb-1">
                  QR Code para Embalagens
                </h3>
                <p className="text-[13px] text-[#637267] mb-5">
                  Imprima em adesivos para colocar na caixa da pizza ou sacolas de entrega.
                </p>

                {/* Dynamic SVG QR Code mockup */}
                <div className="inline-block p-4 bg-white border-2 border-[#1A241E] rounded-2xl shadow-sm mb-4">
                  <svg width="180" height="180" viewBox="0 0 180 180" className="mx-auto">
                    {/* Background */}
                    <rect width="180" height="180" fill="#FFFFFF" />
                    {/* Corner 1 */}
                    <rect x="15" y="15" width="45" height="45" fill="#1A241E" rx="8" />
                    <rect x="23" y="23" width="29" height="29" fill="#FFFFFF" rx="4" />
                    <rect x="30" y="30" width="15" height="15" fill="#1A241E" rx="2" />
                    {/* Corner 2 */}
                    <rect x="120" y="15" width="45" height="45" fill="#1A241E" rx="8" />
                    <rect x="128" y="23" width="29" height="29" fill="#FFFFFF" rx="4" />
                    <rect x="135" y="30" width="15" height="15" fill="#1A241E" rx="2" />
                    {/* Corner 3 */}
                    <rect x="15" y="120" width="45" height="45" fill="#1A241E" rx="8" />
                    <rect x="23" y="128" width="29" height="29" fill="#FFFFFF" rx="4" />
                    <rect x="30" y="135" width="15" height="15" fill="#1A241E" rx="2" />
                    {/* Center decorative food dots */}
                    <rect x="75" y="25" width="12" height="12" fill="#1A241E" rx="2" />
                    <rect x="95" y="25" width="12" height="12" fill="#1A241E" rx="2" />
                    <rect x="75" y="45" width="12" height="12" fill="#1A241E" rx="2" />
                    <rect x="25" y="75" width="12" height="12" fill="#1A241E" rx="2" />
                    <rect x="45" y="75" width="12" height="12" fill="#1A241E" rx="2" />
                    <rect x="75" y="75" width="30" height="30" fill="#2E4233" rx="6" />
                    <circle cx="90" cy="90" r="8" fill="#FFFFFF" />
                    <rect x="120" y="75" width="12" height="12" fill="#1A241E" rx="2" />
                    <rect x="145" y="75" width="12" height="12" fill="#1A241E" rx="2" />
                    <rect x="75" y="120" width="12" height="12" fill="#1A241E" rx="2" />
                    <rect x="95" y="120" width="12" height="12" fill="#1A241E" rx="2" />
                    <rect x="120" y="120" width="12" height="12" fill="#1A241E" rx="2" />
                    <rect x="140" y="140" width="15" height="15" fill="#CB5A3C" rx="3" />
                  </svg>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      alert("QR Code pronto para impressão! Você pode copiar e enviar diretamente para sua gráfica.");
                    }}
                    className="flex items-center gap-2 bg-[#FAF8F0] border border-[#D5D2C7] hover:bg-[#F4F3ED] text-[#1A241E] px-4 py-2 rounded-xl text-[13px] font-medium transition-colors"
                  >
                    <QrCode size={16} />
                    <span>Baixar QR Code Alta Resolução</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Templates de Mensagens para WhatsApp */}
            <div className="lg:col-span-7 bg-white border border-[#E3E1D9] rounded-[22px] p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)]">
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle size={20} className="text-[#2E7D32]" />
                <h3 className="font-serif text-[22px] font-semibold text-[#1A241E]">
                  Textos Prontos para Divulgação no WhatsApp
                </h3>
              </div>
              <p className="text-[13px] text-[#637267] mb-6">
                Copie e dispare no status, listas de transmissão ou grupos de clientes para gerar pedidos rápidos.
              </p>

              <div className="space-y-4">
                {/* Template 1 */}
                <div className="p-4 rounded-xl border border-[#ECEAE2] bg-[#FAF8F0] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-[14px] text-[#1A241E]">
                      🚀 1. Lançamento do Cardápio Direto
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          `Olá! 🍽️ Agora você pode fazer seus pedidos direto no nosso cardápio oficial, com entrega rápida e sem taxas extras!\n\nAcesse agora e confira nossos pratos: ${storefrontUrl}\n\nEsperamos seu pedido! ✨`,
                          "msg-1"
                        )
                      }
                      className="flex items-center gap-1.5 text-[12px] font-semibold text-[#2E4233] bg-white border border-[#D5D2C7] px-3 py-1.5 rounded-lg hover:bg-gray-50"
                    >
                      {copiedText === "msg-1" ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedText === "msg-1" ? "Copiado!" : "Copiar Mensagem"}</span>
                    </button>
                  </div>
                  <p className="text-[13px] text-[#556358] whitespace-pre-line leading-relaxed font-sans">
                    {`Olá! 🍽️ Agora você pode fazer seus pedidos direto no nosso cardápio oficial, com entrega rápida e sem taxas extras!\n\nAcesse agora e confira nossos pratos: ${storefrontUrl}\n\nEsperamos seu pedido! ✨`}
                  </p>
                </div>

                {/* Template 2 */}
                <div className="p-4 rounded-xl border border-[#ECEAE2] bg-[#FAF8F0] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-[14px] text-[#1A241E]">
                      🎉 2. Promoção de Sextou com Cupom
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          `Sextou com comida boa! 🍕🍔\n\nHoje tem cupom exclusivo no nosso cardápio próprio!\nUse o código *SEXTOU15* e ganhe R$ 15 OFF no seu pedido.\n\nPeça aqui em 2 minutos: ${storefrontUrl}\n\nPromoção válida enquanto durarem os estoques! 🏃💨`,
                          "msg-2"
                        )
                      }
                      className="flex items-center gap-1.5 text-[12px] font-semibold text-[#2E4233] bg-white border border-[#D5D2C7] px-3 py-1.5 rounded-lg hover:bg-gray-50"
                    >
                      {copiedText === "msg-2" ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedText === "msg-2" ? "Copiado!" : "Copiar Mensagem"}</span>
                    </button>
                  </div>
                  <p className="text-[13px] text-[#556358] whitespace-pre-line leading-relaxed font-sans">
                    {`Sextou com comida boa! 🍕🍔\n\nHoje tem cupom exclusivo no nosso cardápio próprio!\nUse o código *SEXTOU15* e ganhe R$ 15 OFF no seu pedido.\n\nPeça aqui em 2 minutos: ${storefrontUrl}\n\nPromoção válida enquanto durarem os estoques! 🏃💨`}
                  </p>
                </div>

                {/* Template 3 */}
                <div className="p-4 rounded-xl border border-[#ECEAE2] bg-[#FAF8F0] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-[14px] text-[#1A241E]">
                      🛵 3. Alerta de Entrega Grátis
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          `Bateu a fome? 🛵\n\nHoje a entrega é por nossa conta em pedidos acima de R$ 50 no nosso link oficial!\n\nConfira nosso cardápio completo: ${storefrontUrl}\n\nAproveite antes que acabe! 🔥`,
                          "msg-3"
                        )
                      }
                      className="flex items-center gap-1.5 text-[12px] font-semibold text-[#2E4233] bg-white border border-[#D5D2C7] px-3 py-1.5 rounded-lg hover:bg-gray-50"
                    >
                      {copiedText === "msg-3" ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedText === "msg-3" ? "Copiado!" : "Copiar Mensagem"}</span>
                    </button>
                  </div>
                  <p className="text-[13px] text-[#556358] whitespace-pre-line leading-relaxed font-sans">
                    {`Bateu a fome? 🛵\n\nHoje a entrega é por nossa conta em pedidos acima de R$ 50 no nosso link oficial!\n\nConfira nosso cardápio completo: ${storefrontUrl}\n\nAproveite antes que acabe! 🔥`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: PROGRAMA DE FIDELIDADE                                */}
        {/* ============================================================ */}
        {activeTab === "loyalty" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Configurações */}
            <div className="lg:col-span-7 bg-white border border-[#E3E1D9] rounded-[22px] p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)]">
              <div className="flex items-center justify-between pb-5 border-b border-[#ECEAE2] mb-6">
                <div>
                  <h3 className="font-serif text-[22px] font-semibold text-[#1A241E]">
                    Programa de Fidelidade Digital
                  </h3>
                  <p className="text-[13px] text-[#637267]">
                    Substitua o cartãozinho de carimbo de papel por um sistema automático no WhatsApp.
                  </p>
                </div>

                {/* Switch de Ativar */}
                <button
                  type="button"
                  onClick={() => setLoyaltyEnabled(!loyaltyEnabled)}
                  className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    loyaltyEnabled ? "bg-[#2E7D32]" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${
                      loyaltyEnabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-6">
                {/* Meta de Pedidos */}
                <div>
                  <label className="block text-[14px] font-medium text-[#1A241E] mb-2">
                    Meta de Pedidos para Ganhar o Prêmio:
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[5, 8, 10].map((goal) => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => setLoyaltyGoal(goal)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          loyaltyGoal === goal
                            ? "bg-[#253629] text-white border-[#253629] font-semibold"
                            : "bg-[#FAF8F0] border-[#E3E1D9] text-[#1A241E] hover:bg-gray-100"
                        }`}
                      >
                        <div className="text-[18px] font-bold">{goal} pedidos</div>
                        <div className={`text-[11px] ${loyaltyGoal === goal ? "text-gray-200" : "text-[#637267]"}`}>
                          {goal === 5 ? "Fácil alcance" : goal === 10 ? "Mais econômico" : "Equilibrado"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Valor da Recompensa */}
                <div>
                  <label className="block text-[14px] font-medium text-[#1A241E] mb-2">
                    Valor do Desconto de Recompensa:
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative w-48">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-[14px]">
                        R$
                      </span>
                      <input
                        type="number"
                        min="5"
                        max="100"
                        value={loyaltyRewardCents / 100}
                        onChange={(e) => setLoyaltyRewardCents(Math.round(Number(e.target.value) * 100))}
                        className="w-full bg-[#FAF8F0] border border-[#E3E1D9] rounded-xl py-2.5 pl-10 pr-4 text-[15px] font-semibold text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20"
                      />
                    </div>
                    <span className="text-[13px] text-[#637267]">
                      Aplicado automaticamente no próximo pedido após bater a meta.
                    </span>
                  </div>
                </div>

                {/* Texto explicativo para o cliente */}
                <div>
                  <label className="block text-[14px] font-medium text-[#1A241E] mb-2">
                    Frase exibida para o cliente no Cardápio:
                  </label>
                  <input
                    type="text"
                    value={loyaltyRewardText}
                    onChange={(e) => setLoyaltyRewardText(e.target.value)}
                    className="w-full bg-[#FAF8F0] border border-[#E3E1D9] rounded-xl py-2.5 px-4 text-[14px] text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20"
                  />
                </div>

                <div className="pt-4 border-t border-[#ECEAE2]">
                  <button
                    type="button"
                    onClick={handleSaveLoyalty}
                    disabled={isPending}
                    className="bg-[#253629] text-white px-6 py-2.5 rounded-xl text-[14px] font-medium hover:bg-[#1E2C21] transition-colors cursor-pointer"
                  >
                    {isPending ? "Salvando..." : "Salvar Programa de Fidelidade"}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Como Funciona & Pré-visualização */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-[#E3E1D9] rounded-[22px] p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)]">
                <h4 className="font-serif text-[18px] font-semibold text-[#1A241E] mb-3">
                  📱 Como o cliente enxerga no celular:
                </h4>

                {/* Mock Card do Cartão Fidelidade */}
                <div className="rounded-2xl border border-[#D5D2C7] bg-[#FAF8F0] p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Gift size={18} className="text-[#2E7D32]" />
                      <span className="font-semibold text-[14px] text-[#1A241E]">
                        Fidelidade {storeName}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32]">
                      {loyaltyEnabled ? "Ativo" : "Desativado"}
                    </span>
                  </div>

                  <p className="text-[12px] text-[#556358] mb-4">
                    Complete {loyaltyGoal} pedidos e ganhe R$ {(loyaltyRewardCents / 100).toFixed(2).replace(".", ",")} de desconto!
                  </p>

                  {/* Stamp Grid */}
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {Array.from({ length: loyaltyGoal }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-9 rounded-lg border flex items-center justify-center text-[12px] font-bold ${
                          idx < 3
                            ? "bg-[#2E4233] text-white border-[#2E4233]"
                            : "bg-white border-dashed border-[#C5C2B7] text-[#8C988F]"
                        }`}
                      >
                        {idx < 3 ? "✓" : idx + 1}
                      </div>
                    ))}
                  </div>

                  <div className="text-[11px] text-[#637267] text-center">
                    Exemplo: 3 de {loyaltyGoal} pedidos concluídos
                  </div>
                </div>

                <div className="mt-5 text-[13px] text-[#556358] space-y-2 leading-relaxed">
                  <p>
                    💡 <strong>Identificação automática:</strong> O DeliPlus reconhece o cliente pelo número de WhatsApp digitado no checkout. Não precisa de cadastro com senha nem aplicativos adicionais!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: BANNER NO CARDÁPIO                                    */}
        {/* ============================================================ */}
        {activeTab === "banner" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Editor do Banner */}
            <div className="lg:col-span-7 bg-white border border-[#E3E1D9] rounded-[22px] p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)]">
              <div className="flex items-center justify-between pb-5 border-b border-[#ECEAE2] mb-6">
                <div>
                  <h3 className="font-serif text-[22px] font-semibold text-[#1A241E]">
                    Banner de Aviso / Destaque
                  </h3>
                  <p className="text-[13px] text-[#637267]">
                    Aparece no topo do cardápio público para todos os clientes que entrarem no seu link.
                  </p>
                </div>

                {/* Switch de Ativar */}
                <button
                  type="button"
                  onClick={() => setBannerEnabled(!bannerEnabled)}
                  className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    bannerEnabled ? "bg-[#CB5A3C]" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${
                      bannerEnabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-6">
                {/* Texto do Banner */}
                <div>
                  <label className="block text-[14px] font-medium text-[#1A241E] mb-2">
                    Mensagem do Banner:
                  </label>
                  <input
                    type="text"
                    value={bannerText}
                    onChange={(e) => setBannerText(e.target.value)}
                    placeholder="Ex: 🔥 Entrega grátis hoje em pedidos acima de R$ 50!"
                    className="w-full bg-[#FAF8F0] border border-[#E3E1D9] rounded-xl py-2.5 px-4 text-[14px] text-[#1A241E] focus:outline-none focus:ring-2 focus:ring-[#2E4233]/20"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setBannerText("🔥 Entrega grátis hoje em pedidos acima de R$ 50!")}
                      className="text-[11px] text-[#556358] hover:text-[#1A241E] bg-[#FAF8F0] border border-[#ECEAE2] px-2.5 py-1 rounded-md"
                    >
                      Sugestão: Frete Grátis
                    </button>
                    <button
                      type="button"
                      onClick={() => setBannerText("🎉 Use o cupom BEMVINDO10 e ganhe 10% OFF no primeiro pedido!")}
                      className="text-[11px] text-[#556358] hover:text-[#1A241E] bg-[#FAF8F0] border border-[#ECEAE2] px-2.5 py-1 rounded-md"
                    >
                      Sugestão: Cupom de Boas-Vindas
                    </button>
                  </div>
                </div>

                {/* Cor do Banner */}
                <div>
                  <label className="block text-[14px] font-medium text-[#1A241E] mb-2">
                    Cor de Destaque:
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setBannerColor("terracotta")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[13px] font-medium transition-all ${
                        bannerColor === "terracotta"
                          ? "bg-[#CB5A3C] text-white border-[#CB5A3C]"
                          : "bg-white border-[#E3E1D9] text-[#1A241E]"
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-[#CB5A3C] border border-white"></span>
                      <span>Laranja Terracota (Padrão)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBannerColor("forest")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[13px] font-medium transition-all ${
                        bannerColor === "forest"
                          ? "bg-[#2E4233] text-white border-[#2E4233]"
                          : "bg-white border-[#E3E1D9] text-[#1A241E]"
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-[#2E4233] border border-white"></span>
                      <span>Verde Floresta</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBannerColor("amber")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[13px] font-medium transition-all ${
                        bannerColor === "amber"
                          ? "bg-[#D97706] text-white border-[#D97706]"
                          : "bg-white border-[#E3E1D9] text-[#1A241E]"
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-[#D97706] border border-white"></span>
                      <span>Âmbar Promocional</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#ECEAE2]">
                  <button
                    type="button"
                    onClick={handleSaveBanner}
                    disabled={isPending}
                    className="bg-[#253629] text-white px-6 py-2.5 rounded-xl text-[14px] font-medium hover:bg-[#1E2C21] transition-colors cursor-pointer"
                  >
                    {isPending ? "Salvando..." : "Salvar Banner Promocional"}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Live Preview no Smartphone */}
            <div className="lg:col-span-5 bg-white border border-[#E3E1D9] rounded-[22px] p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)] flex flex-col items-center">
              <h4 className="font-serif text-[18px] font-semibold text-[#1A241E] mb-4 self-start">
                📱 Pré-visualização em tempo real:
              </h4>

              {/* Phone Mockup Frame */}
              <div className="w-[280px] bg-black rounded-[36px] p-3 shadow-2xl border-4 border-gray-800">
                <div className="bg-[#FAF8F0] rounded-[28px] overflow-hidden min-h-[460px] flex flex-col">
                  {/* Phone Notch */}
                  <div className="h-5 bg-[#FAF8F0] flex items-center justify-center pt-1">
                    <div className="w-20 h-3 bg-black/10 rounded-full"></div>
                  </div>

                  {/* Banner no topo (se ativado) */}
                  {bannerEnabled ? (
                    <div
                      className={`py-2 px-3 text-center text-white text-[11px] font-medium tracking-tight animate-in fade-in ${
                        bannerColor === "forest"
                          ? "bg-[#2E4233]"
                          : bannerColor === "amber"
                          ? "bg-[#D97706]"
                          : "bg-[#CB5A3C]"
                      }`}
                    >
                      {bannerText || "Sua mensagem aqui"}
                    </div>
                  ) : (
                    <div className="py-1 px-3 bg-gray-200 text-gray-500 text-[10px] text-center">
                      Banner desativado
                    </div>
                  )}

                  {/* Header do Cardápio */}
                  <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <div className="font-serif font-bold text-[16px] text-gray-900 leading-tight">
                        {storeName}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium">● Aberto agora</div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-800">
                      DP
                    </div>
                  </div>

                  {/* Body do Cardápio */}
                  <div className="p-3 space-y-2 flex-1">
                    <div className="h-16 rounded-xl bg-white border border-gray-200 p-2 flex gap-2 items-center">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0"></div>
                      <div className="flex-1 space-y-1">
                        <div className="w-24 h-2.5 bg-gray-200 rounded"></div>
                        <div className="w-16 h-2 bg-gray-100 rounded"></div>
                      </div>
                    </div>
                    <div className="h-16 rounded-xl bg-white border border-gray-200 p-2 flex gap-2 items-center">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0"></div>
                      <div className="flex-1 space-y-1">
                        <div className="w-20 h-2.5 bg-gray-200 rounded"></div>
                        <div className="w-14 h-2 bg-gray-100 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL: CRIAR NOVO CUPOM                                        */}
      {/* ============================================================== */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E3E1D9] max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
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
                  Defina as regras e benefícios do cupom para a {storeName}
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateCouponSubmit} className="space-y-4">
              {/* Código */}
              <div>
                <label className="block text-[13px] font-medium text-[#1A241E] mb-1">
                  Código do Cupom:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Ex: PROMO10, SEXTOU20"
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
                    className="px-3 py-2 bg-[#FAF8F0] border border-[#D5D2C7] rounded-xl text-[12px] font-medium text-[#556358] hover:bg-gray-100"
                  >
                    Sugerir
                  </button>
                </div>
              </div>

              {/* Descrição */}
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

              {/* Tipo de Desconto */}
              <div>
                <label className="block text-[13px] font-medium text-[#1A241E] mb-1">
                  Tipo de Desconto:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewDiscountType("percentage")}
                    className={`py-2 px-3 rounded-xl border text-[13px] font-medium text-center ${
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
                    className={`py-2 px-3 rounded-xl border text-[13px] font-medium text-center ${
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
                    className={`py-2 px-3 rounded-xl border text-[13px] font-medium text-center ${
                      newDiscountType === "free_shipping"
                        ? "bg-[#253629] text-white border-[#253629]"
                        : "bg-[#FAF8F0] border-[#E3E1D9] text-[#1A241E]"
                    }`}
                  >
                    🛵 Frete Grátis
                  </button>
                </div>
              </div>

              {/* Valor do Desconto */}
              {newDiscountType !== "free_shipping" && (
                <div>
                  <label className="block text-[13px] font-medium text-[#1A241E] mb-1">
                    {newDiscountType === "percentage" ? "Porcentagem de Desconto (%):" : "Valor do Desconto (R$):"}
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

              {/* Pedido Mínimo */}
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

              {/* Limite de Usos e Validade */}
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
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border border-[#D5D2C7] text-[#1A241E] text-[13px] font-medium rounded-xl hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#253629] text-white text-[13px] font-medium rounded-xl hover:bg-[#1E2C21]"
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
