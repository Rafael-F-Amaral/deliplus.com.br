"use client";

import React, { useState, useTransition } from "react";
import {
  Ticket,
  Plus,
  Trash2,
  Copy,
  Check,
  X,
  Sparkles,
  ShoppingBag,
  Percent,
  Clock,
  CheckCircle2
} from "lucide-react";
import { createCoupon, toggleCouponStatus, deleteCoupon } from "../actions";

export interface CouponItem {
  id: string;
  code: string;
  description?: string | null;
  discount_type: "percentage" | "fixed" | "free_shipping";
  discount_value: number;
  min_order_cents: number;
  max_uses?: number | null;
  uses_count: number;
  status: "active" | "paused" | "expired";
  expires_at?: string | null;
}

interface CouponsClientProps {
  storeSlug: string;
  storeName: string;
  initialCoupons: CouponItem[];
}

export default function CouponsClient({
  initialCoupons = []
}: CouponsClientProps) {
  const [coupons, setCoupons] = useState<CouponItem[]>(initialCoupons);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New Coupon Form
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDiscountType, setNewDiscountType] = useState<"percentage" | "fixed" | "free_shipping">("percentage");
  const [newDiscountValue, setNewDiscountValue] = useState(10);
  const [newMinOrder, setNewMinOrder] = useState(40);
  const [newMaxUses, setNewMaxUses] = useState<number | "">(100);
  const [newExpiresInDays, setNewExpiresInDays] = useState(30);

  const [, startTransition] = useTransition();

  const formatBRL = (cents: number | null | undefined): string => {
    if (typeof cents !== "number" || isNaN(cents)) return "R$ 0,00";
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).replace(/\s+/, " ");
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Toggle Coupon Status
  const handleToggleCoupon = (couponId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "paused" : "active";
    setCoupons(prev =>
      prev.map(c => (c.id === couponId ? { ...c, status: nextStatus } : c))
    );

    startTransition(async () => {
      const res = await toggleCouponStatus(couponId, currentStatus);
      if (!res.success) {
        setCoupons(prev =>
          prev.map(c => (c.id === couponId ? { ...c, status: currentStatus as CouponItem["status"] } : c))
        );
      }
    });
  };

  // Delete Coupon
  const handleDeleteCoupon = (couponId: string) => {
    setCoupons(prev => prev.filter(c => c.id !== couponId));
    setDeleteConfirmId(null);

    startTransition(async () => {
      await deleteCoupon(couponId);
    });
  };

  // Apply Predefined Template
  const handleApplyTemplate = (
    code: string,
    desc: string,
    type: "percentage" | "fixed" | "free_shipping",
    val: number,
    minOrder: number
  ) => {
    setNewCode(code);
    setNewDescription(desc);
    setNewDiscountType(type);
    setNewDiscountValue(val);
    setNewMinOrder(minOrder);
    setCreateModalOpen(true);
  };

  // Create Coupon Submit
  const handleCreateCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    const expiresAt = newExpiresInDays > 0
      ? new Date(Date.now() + newExpiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const discountValueFinal = newDiscountType === "fixed"
      ? Math.round(newDiscountValue * 100)
      : newDiscountValue;

    const minOrderCents = Math.round(newMinOrder * 100);

    const tempId = "temp-" + Date.now();
    const optimisticCoupon: CouponItem = {
      id: tempId,
      code: newCode.trim().toUpperCase().replace(/\s+/g, ""),
      description: newDescription.trim() || undefined,
      discount_type: newDiscountType,
      discount_value: discountValueFinal,
      min_order_cents: minOrderCents,
      max_uses: typeof newMaxUses === "number" ? newMaxUses : null,
      uses_count: 0,
      status: "active",
      expires_at: expiresAt
    };

    setCoupons(prev => [optimisticCoupon, ...prev]);
    setCreateModalOpen(false);

    // Reset Form
    setNewCode("");
    setNewDescription("");
    setNewDiscountValue(10);
    setNewMinOrder(40);
    setNewMaxUses(100);

    startTransition(async () => {
      const res = await createCoupon({
        code: optimisticCoupon.code,
        description: optimisticCoupon.description || undefined,
        discount_type: optimisticCoupon.discount_type,
        discount_value: optimisticCoupon.discount_value,
        min_order_cents: optimisticCoupon.min_order_cents,
        max_uses: optimisticCoupon.max_uses,
        expires_at: optimisticCoupon.expires_at
      });

      if (res.success && res.coupon) {
        setCoupons(prev =>
          prev.map(c => (c.id === tempId ? { ...c, id: res.coupon.id } : c))
        );
      }
    });
  };

  // Metric aggregates
  const activeCouponsCount = coupons.filter(c => c.status === "active").length;
  const totalUsesCount = coupons.reduce((sum, c) => sum + (c.uses_count || 0), 0);
  const estimatedSavingsCents = coupons.reduce((sum, c) => {
    if (c.discount_type === "fixed") return sum + (c.discount_value * c.uses_count);
    if (c.discount_type === "percentage") return sum + Math.round(4500 * (c.discount_value / 100) * c.uses_count);
    return sum + (800 * c.uses_count); // free shipping ~ R$ 8
  }, 0);

  return (
    <div className="flex-1 bg-[#F7F6F2] min-h-screen text-[#1A241E] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* ============================================================ */}
        {/* HEADER                                                       */}
        {/* ============================================================ */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#2E4233]/10 text-[#2E4233]">
                <Sparkles size={13} />
                Incentivo de Vendas
              </span>
            </div>
            <h1 className="font-serif text-[32px] sm:text-[38px] lg:text-[42px] font-semibold text-[#1A241E] tracking-tight leading-none mb-2">
              Cupons de Desconto
            </h1>
            <p className="text-[14px] sm:text-[15px] text-[#5D6B60] max-w-2xl">
              Crie cupons promocionais para atrair novos clientes pelo Instagram, panfletos de sacola e campanhas no WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-2">
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

        {/* ============================================================ */}
        {/* SUMMARY METRICS                                              */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-8">
          <div className="bg-white border border-[#E3E1D9] rounded-[20px] p-4 sm:p-5 lg:p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)]">
            <div className="flex items-center gap-2.5 text-[#5D6B60] text-[13px] font-medium mb-3">
              <Ticket size={18} className="text-[#2E4233]" />
              <span>Cupons Ativos</span>
            </div>
            <div className="text-[28px] font-bold text-[#1A241E] leading-none mb-1">
              {activeCouponsCount}
            </div>
            <div className="text-[12px] text-[#2E7D32] font-medium">Disponíveis no checkout</div>
          </div>

          <div className="bg-white border border-[#E3E1D9] rounded-[20px] p-4 sm:p-5 lg:p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)]">
            <div className="flex items-center gap-2.5 text-[#5D6B60] text-[13px] font-medium mb-3">
              <ShoppingBag size={18} className="text-[#CB5A3C]" />
              <span>Usos Totais</span>
            </div>
            <div className="text-[28px] font-bold text-[#1A241E] leading-none mb-1">
              {totalUsesCount} pedidos
            </div>
            <div className="text-[12px] text-[#2E7D32] font-medium">▲ Recompra estimulada</div>
          </div>

          <div className="bg-white border border-[#E3E1D9] rounded-[20px] p-4 sm:p-5 lg:p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)]">
            <div className="flex items-center gap-2.5 text-[#5D6B60] text-[13px] font-medium mb-3">
              <Percent size={18} className="text-[#2E7D32]" />
              <span>Economia Concedida</span>
            </div>
            <div className="text-[26px] font-bold text-[#1A241E] leading-none mb-1">
              {formatBRL(estimatedSavingsCents)}
            </div>
            <div className="text-[12px] text-[#637267]">Descontos aplicados</div>
          </div>

          <div className="bg-white border border-[#E3E1D9] rounded-[20px] p-4 sm:p-5 lg:p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)]">
            <div className="flex items-center gap-2.5 text-[#5D6B60] text-[13px] font-medium mb-3">
              <CheckCircle2 size={18} className="text-[#512DA8]" />
              <span>Ticket Médio c/ Cupom</span>
            </div>
            <div className="text-[26px] font-bold text-[#1A241E] leading-none mb-1">
              +28%
            </div>
            <div className="text-[12px] text-[#2E7D32] font-medium">Supera o pedido mínimo</div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* VOUCHERS GRID                                                */}
        {/* ============================================================ */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-[22px] font-semibold text-[#1A241E]">
              Cupons Cadastrados
            </h2>
            <span className="text-[13px] text-[#637267]">
              {coupons.length} cupons no total
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {coupons.map((coupon) => {
              const isExpired = coupon.expires_at ? new Date(coupon.expires_at) < new Date() : false;
              const usagePercent = coupon.max_uses ? Math.min(100, Math.round((coupon.uses_count / coupon.max_uses) * 100)) : null;

              return (
                <div
                  key={coupon.id}
                  className={`bg-white border rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between transition-all ${
                    coupon.status === "active" && !isExpired
                      ? "border-[#E3E1D9]"
                      : "border-gray-200 opacity-60 bg-gray-50/50"
                  }`}
                >
                  <div>
                    {/* Top Type Badge & Status Toggle */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        coupon.discount_type === "percentage"
                          ? "bg-purple-100 text-purple-800"
                          : coupon.discount_type === "fixed"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {coupon.discount_type === "percentage"
                          ? `${coupon.discount_value}% OFF`
                          : coupon.discount_type === "fixed"
                          ? `${formatBRL(coupon.discount_value)} OFF`
                          : "FRETE GRÁTIS"}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleCoupon(coupon.id, coupon.status)}
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                            coupon.status === "active" && !isExpired
                              ? "bg-[#E8F5E9] text-[#2E7D32]"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {coupon.status === "active" && !isExpired ? "Ativo" : "Pausado"}
                        </button>
                      </div>
                    </div>

                    {/* Big Ticket Code Box */}
                    <div className="bg-[#FAF8F0] border border-dashed border-[#D5D2C5] rounded-xl p-3 flex items-center justify-between mb-3">
                      <div>
                        <div className="font-mono text-[18px] font-black tracking-wider text-[#1A241E]">
                          {coupon.code}
                        </div>
                        <div className="text-[11px] text-[#637267]">
                          {coupon.min_order_cents > 0
                            ? `Mínimo: ${formatBRL(coupon.min_order_cents)}`
                            : "Sem valor mínimo"}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(coupon.code, coupon.id)}
                        className="flex items-center gap-1 text-[12px] font-semibold text-[#253629] bg-white border border-[#E3E1D9] hover:bg-[#F4F3ED] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        {copiedText === coupon.id ? (
                          <>
                            <Check size={14} className="text-[#2E7D32]" />
                            <span className="text-[#2E7D32]">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Description */}
                    {coupon.description && (
                      <p className="text-[13px] text-[#556358] mb-3 leading-relaxed">
                        {coupon.description}
                      </p>
                    )}

                    {/* Usage Progress */}
                    {coupon.max_uses && (
                      <div className="mb-3">
                        <div className="flex justify-between text-[11px] text-[#637267] mb-1">
                          <span>{coupon.uses_count} de {coupon.max_uses} usados</span>
                          <span className="font-semibold">{usagePercent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#2E7D32] rounded-full transition-all"
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Expiration & Delete */}
                  <div className="border-t border-[#ECEAE2] pt-3 flex items-center justify-between text-[12px] text-[#637267] mt-2">
                    <div className="flex items-center gap-1">
                      <Clock size={13} />
                      <span>
                        {coupon.expires_at
                          ? `Até ${new Date(coupon.expires_at).toLocaleDateString("pt-BR")}`
                          : "Sem expiração"}
                      </span>
                    </div>

                    {deleteConfirmId === coupon.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-red-600 font-bold">Excluir?</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="text-[11px] font-bold text-red-600 hover:underline"
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-[11px] text-gray-500 hover:underline ml-1"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(coupon.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Excluir cupom"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================ */}
        {/* TEMPLATES RECOMENDADOS                                       */}
        {/* ============================================================ */}
        <div className="bg-white border border-[#E3E1D9] rounded-[22px] p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)]">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={18} className="text-[#CB5A3C]" />
            <h3 className="font-serif text-[20px] font-semibold text-[#1A241E]">
              Modelos de Cupons que Mais Convertem no Food Delivery
            </h3>
          </div>
          <p className="text-[13px] text-[#637267] mb-6">
            Clique em qualquer modelo abaixo para criar instantaneamente com configurações validadas:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Modelo 1 */}
            <div className="p-4 rounded-xl border border-[#ECEAE2] bg-[#FAF8F0] flex flex-col justify-between">
              <div>
                <div className="font-mono font-bold text-[15px] text-[#1A241E] mb-1">
                  BEMVINDO10
                </div>
                <div className="text-[12px] font-semibold text-purple-700 mb-1.5">
                  10% OFF no 1º Pedido
                </div>
                <p className="text-[12px] text-[#637267] leading-relaxed mb-3">
                  Perfeito para colocar no panfleto dentro da sacola física ou na bio do Instagram.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleApplyTemplate("BEMVINDO10", "10% de desconto para primeiro pedido", "percentage", 10, 35)}
                className="w-full text-center text-[12px] font-semibold text-[#253629] bg-white border border-[#E3E1D9] hover:bg-[#F4F3ED] py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Usar este Modelo
              </button>
            </div>

            {/* Modelo 2 */}
            <div className="p-4 rounded-xl border border-[#ECEAE2] bg-[#FAF8F0] flex flex-col justify-between">
              <div>
                <div className="font-mono font-bold text-[15px] text-[#1A241E] mb-1">
                  SEXTOU15
                </div>
                <div className="text-[12px] font-semibold text-emerald-700 mb-1.5">
                  R$ 15 OFF no Fim de Semana
                </div>
                <p className="text-[12px] text-[#637267] leading-relaxed mb-3">
                  Exige pedido mínimo de R$ 60 para puxar o ticket médio para cima nas noites movimentadas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleApplyTemplate("SEXTOU15", "R$ 15 de desconto em pedidos de fim de semana", "fixed", 15, 60)}
                className="w-full text-center text-[12px] font-semibold text-[#253629] bg-white border border-[#E3E1D9] hover:bg-[#F4F3ED] py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Usar este Modelo
              </button>
            </div>

            {/* Modelo 3 */}
            <div className="p-4 rounded-xl border border-[#ECEAE2] bg-[#FAF8F0] flex flex-col justify-between">
              <div>
                <div className="font-mono font-bold text-[15px] text-[#1A241E] mb-1">
                  FRETEGRATIS
                </div>
                <div className="text-[12px] font-semibold text-blue-700 mb-1.5">
                  Entrega Sem Custo
                </div>
                <p className="text-[12px] text-[#637267] leading-relaxed mb-3">
                  Gatilho psicológico número 1 de fechamento em pedidos acima de R$ 50,00.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleApplyTemplate("FRETEGRATIS", "Frete grátis em pedidos acima de R$ 50", "free_shipping", 0, 50)}
                className="w-full text-center text-[12px] font-semibold text-[#253629] bg-white border border-[#E3E1D9] hover:bg-[#F4F3ED] py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Usar este Modelo
              </button>
            </div>

            {/* Modelo 4 */}
            <div className="p-4 rounded-xl border border-[#ECEAE2] bg-[#FAF8F0] flex flex-col justify-between">
              <div>
                <div className="font-mono font-bold text-[15px] text-[#1A241E] mb-1">
                  VOLTEI12
                </div>
                <div className="text-[12px] font-semibold text-orange-700 mb-1.5">
                  Reativação de Clientes
                </div>
                <p className="text-[12px] text-[#637267] leading-relaxed mb-3">
                  Dispare pelo WhatsApp para quem não compra há mais de 15 dias na loja.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleApplyTemplate("VOLTEI12", "Desconto especial de volta para clientes sumidos", "percentage", 12, 40)}
                className="w-full text-center text-[12px] font-semibold text-[#253629] bg-white border border-[#E3E1D9] hover:bg-[#F4F3ED] py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Usar este Modelo
              </button>
            </div>
          </div>
        </div>
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
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="font-serif text-[22px] font-semibold text-[#1A241E] mb-1">
              Criar Novo Cupom de Desconto
            </h3>
            <p className="text-[13px] text-[#637267] mb-5">
              Defina as regras do cupom que ficará disponível para os clientes no cardápio.
            </p>

            <form onSubmit={handleCreateCouponSubmit} className="space-y-4">
              {/* Código */}
              <div>
                <label className="block text-[13px] font-medium text-[#334237] mb-1">
                  Código do Cupom *
                </label>
                <input
                  type="text"
                  placeholder="EX: PROMO10, SEXTOU"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 border border-[#E3E1D9] rounded-xl text-[14px] font-mono font-bold tracking-wider uppercase focus:outline-none focus:border-[#253629]"
                  required
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-[13px] font-medium text-[#334237] mb-1">
                  Descrição (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 10% de desconto para novos clientes"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#E3E1D9] rounded-xl text-[14px] focus:outline-none focus:border-[#253629]"
                />
              </div>

              {/* Tipo de Desconto */}
              <div>
                <label className="block text-[13px] font-medium text-[#334237] mb-1">
                  Tipo de Desconto *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewDiscountType("percentage")}
                    className={`py-2 px-3 text-[13px] font-medium rounded-xl border text-center transition-all cursor-pointer ${
                      newDiscountType === "percentage"
                        ? "bg-[#253629] text-white border-[#253629]"
                        : "bg-white border-[#E3E1D9] text-[#334237] hover:bg-gray-50"
                    }`}
                  >
                    Percentual (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewDiscountType("fixed")}
                    className={`py-2 px-3 text-[13px] font-medium rounded-xl border text-center transition-all cursor-pointer ${
                      newDiscountType === "fixed"
                        ? "bg-[#253629] text-white border-[#253629]"
                        : "bg-white border-[#E3E1D9] text-[#334237] hover:bg-gray-50"
                    }`}
                  >
                    Valor Fixo (R$)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewDiscountType("free_shipping")}
                    className={`py-2 px-3 text-[13px] font-medium rounded-xl border text-center transition-all cursor-pointer ${
                      newDiscountType === "free_shipping"
                        ? "bg-[#253629] text-white border-[#253629]"
                        : "bg-white border-[#E3E1D9] text-[#334237] hover:bg-gray-50"
                    }`}
                  >
                    Frete Grátis
                  </button>
                </div>
              </div>

              {/* Valor do Desconto */}
              {newDiscountType !== "free_shipping" && (
                <div>
                  <label className="block text-[13px] font-medium text-[#334237] mb-1">
                    {newDiscountType === "percentage" ? "Percentual de Desconto (%)" : "Valor do Desconto (R$)"}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step={newDiscountType === "percentage" ? "1" : "0.50"}
                      min="1"
                      value={newDiscountValue}
                      onChange={(e) => setNewDiscountValue(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 border border-[#E3E1D9] rounded-xl text-[14px] font-bold focus:outline-none focus:border-[#253629]"
                      required
                    />
                    <span className="absolute right-3.5 top-2.5 text-[#637267] text-[13px]">
                      {newDiscountType === "percentage" ? "%" : "BRL"}
                    </span>
                  </div>
                </div>
              )}

              {/* Pedido Mínimo & Limite de Usos */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#334237] mb-1">
                    Pedido Mínimo (R$)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={newMinOrder}
                    onChange={(e) => setNewMinOrder(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 border border-[#E3E1D9] rounded-xl text-[14px] focus:outline-none focus:border-[#253629]"
                  />
                  <span className="text-[11px] text-[#637267] block mt-0.5">0 = sem valor mínimo</span>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#334237] mb-1">
                    Limite de Usos
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ilimitado"
                    value={newMaxUses}
                    onChange={(e) => setNewMaxUses(e.target.value ? parseInt(e.target.value) : "")}
                    className="w-full px-3.5 py-2 border border-[#E3E1D9] rounded-xl text-[14px] focus:outline-none focus:border-[#253629]"
                  />
                  <span className="text-[11px] text-[#637267] block mt-0.5">Vazio = sem limite</span>
                </div>
              </div>

              {/* Expiração */}
              <div>
                <label className="block text-[13px] font-medium text-[#334237] mb-1">
                  Validade do Cupom
                </label>
                <select
                  value={newExpiresInDays}
                  onChange={(e) => setNewExpiresInDays(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2 border border-[#E3E1D9] rounded-xl text-[14px] focus:outline-none focus:border-[#253629] bg-white cursor-pointer"
                >
                  <option value={7}>7 dias (Ideal para campanhas curtas)</option>
                  <option value={15}>15 dias</option>
                  <option value={30}>30 dias (1 mês)</option>
                  <option value={60}>60 dias</option>
                  <option value={0}>Sem validade definida (Indeterminado)</option>
                </select>
              </div>

              {/* Botões */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#ECEAE2]">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-[14px] text-[#556358] hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-[14px] font-semibold bg-[#253629] hover:bg-[#1E2C21] text-white rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Criar Cupom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
