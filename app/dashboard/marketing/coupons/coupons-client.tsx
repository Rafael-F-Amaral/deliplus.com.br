"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  Plus,
  Trash2,
  Copy,
  Check,
  X,
  Sparkles,
  Clock,
  Users,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { createCoupon, toggleCouponStatus, deleteCoupon } from "../actions";
import CouponImageGeneratorModal from "./coupon-image-generator-modal";

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
  target_audience?: "all_customers" | "first_order";
}

interface CouponsClientProps {
  storeSlug: string;
  storeName: string;
  initialCoupons: CouponItem[];
}

const ITEMS_PER_PAGE = 6;

export default function CouponsClient({
  storeSlug,
  storeName,
  initialCoupons = []
}: CouponsClientProps) {
  const [coupons, setCoupons] = useState<CouponItem[]>(initialCoupons);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Social Media Image Generator Modal State
  const [imageGenOpen, setImageGenOpen] = useState(false);
  const [selectedCouponForImage, setSelectedCouponForImage] = useState<CouponItem | null>(null);

  // New Coupon Form
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAudience, setNewAudience] = useState<"all_customers" | "first_order">("all_customers");
  const [newDiscountType, setNewDiscountType] = useState<"percentage" | "fixed" | "free_shipping">("percentage");
  const [newDiscountValue, setNewDiscountValue] = useState(10);
  const [newMinOrder, setNewMinOrder] = useState(35);
  const [newMaxUses, setNewMaxUses] = useState<number | "">(100);
  const [newExpiresInDays, setNewExpiresInDays] = useState(30);
  const [formError, setFormError] = useState<string | null>(null);

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

  // Toggle Coupon Status with Switch
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

  // Open Image Generator for specific coupon
  const handleOpenImageGen = (coupon: CouponItem) => {
    setSelectedCouponForImage(coupon);
    setImageGenOpen(true);
  };

  // Open Image Generator without pre-selection
  const handleOpenGlobalImageGen = () => {
    setSelectedCouponForImage(coupons[0] || null);
    setImageGenOpen(true);
  };

  // Create Coupon Submit
  const handleCreateCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newCode.trim()) {
      setFormError("Informe o código do cupom.");
      return;
    }

    if (newMinOrder <= 0) {
      setFormError("O valor mínimo do pedido é obrigatório e deve ser maior que R$ 0,00.");
      return;
    }

    const expiresAt = newExpiresInDays > 0
      ? new Date(Date.now() + newExpiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const discountValueFinal = newDiscountType === "fixed"
      ? Math.round(newDiscountValue * 100)
      : newDiscountValue;

    const minOrderCents = Math.round(newMinOrder * 100);

    const fullDescription = newAudience === "first_order"
      ? `[1º Pedido no Deli] ${newDescription.trim() || "Desconto exclusivo para novos clientes"}`
      : newDescription.trim() || undefined;

    const tempId = "temp-" + Date.now();
    const optimisticCoupon: CouponItem = {
      id: tempId,
      code: newCode.trim().toUpperCase().replace(/\s+/g, ""),
      description: fullDescription,
      discount_type: newDiscountType,
      discount_value: discountValueFinal,
      min_order_cents: minOrderCents,
      max_uses: typeof newMaxUses === "number" ? newMaxUses : null,
      uses_count: 0,
      status: "active",
      expires_at: expiresAt,
      target_audience: newAudience
    };

    setCoupons(prev => [optimisticCoupon, ...prev]);
    setCreateModalOpen(false);

    // Reset Form
    setNewCode("");
    setNewDescription("");
    setNewAudience("all_customers");
    setNewDiscountValue(10);
    setNewMinOrder(35);
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

  // Pagination calculation
  const totalPages = Math.ceil(coupons.length / ITEMS_PER_PAGE) || 1;
  const paginatedCoupons = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return coupons.slice(start, start + ITEMS_PER_PAGE);
  }, [coupons, currentPage]);

  return (
    <div className="flex-1 bg-[#F7F6F2] dark:bg-[#131A15] min-h-screen text-[#1A241E] dark:text-[#F2EFE9] p-4 sm:p-6 lg:p-8 transition-colors duration-150">
      <div className="w-full">
        {/* ============================================================ */}
        {/* HEADER LIMPO E REORGANIZADO                                  */}
        {/* ============================================================ */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <h1 className="font-serif text-[30px] sm:text-[34px] lg:text-[38px] font-semibold text-[#1A241E] dark:text-[#F2EFE9] tracking-tight leading-none">
                Cupons de Desconto
              </h1>

              {/* Tooltip Padronizado DeliPlus */}
              <div className="relative group inline-block">
                <div className="w-5 h-5 rounded-full bg-[#2E4233] text-white flex items-center justify-center text-[12px] font-extrabold leading-none shadow-sm cursor-help hover:scale-105 transition-transform">
                  ?
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block w-80 p-3.5 bg-[#2E4233] text-white border border-transparent dark:bg-[#FAF8F0] dark:text-[#1C2C22] dark:border-[#E5DFD1] text-[12px] rounded-2xl shadow-2xl z-50 pointer-events-none">
                  <div className="font-bold text-[13px] text-white dark:text-[#2E4233] mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#10B981]" />
                    Regras e Boas Práticas de Cupons
                  </div>
                  <div className="space-y-1.5 text-white/90 dark:text-[#1C2C22] text-[11.5px] leading-relaxed">
                    <div className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5" />
                      <span><strong>Cupons Globais:</strong> Limitados a 1 uso por cliente (WhatsApp) para evitar uso repetido abusivo.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5" />
                      <span><strong>1º Pedido no Deli:</strong> Exclusivo para clientes na sua primeira compra no cardápio online.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5" />
                      <span><strong>Não Cumulativo:</strong> O cliente pode aplicar apenas 1 cupom por pedido no checkout.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5" />
                      <span><strong>Valor Mínimo Obrigatório:</strong> Garante ticket médio e protege a sua margem de lucro.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[13.5px] sm:text-[14.5px] text-[#5D6B60] dark:text-[#9CA79E] max-w-2xl leading-relaxed">
              Crie cupons estratégicos para sua loja e gere artes automáticas para divulgar no Instagram e WhatsApp.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleOpenGlobalImageGen}
              className="flex items-center gap-2 bg-white dark:bg-[#1B241E] hover:bg-gray-50 dark:hover:bg-[#25332A] text-[#CB5A3C] border border-[#CB5A3C]/40 font-semibold text-[13.5px] rounded-xl px-4 py-2.5 shadow-2xs transition-all cursor-pointer"
            >
              <Sparkles size={16} className="text-[#CB5A3C]" />
              <span>Gerador de Artes</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setCreateModalOpen(true);
              }}
              className="flex items-center gap-2 bg-[#2E4233] dark:bg-[#25332A] hover:bg-[#233327] dark:hover:bg-[#2F4235] text-white font-medium text-[13.5px] rounded-xl px-4 py-2.5 shadow-sm border border-transparent dark:border-[#3B4E40] transition-all cursor-pointer"
            >
              <Plus size={17} />
              <span>Novo Cupom</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* LISTAGEM COMPACTA E ORGANIZADA DE CUPONS                     */}
        {/* ============================================================ */}
        <div className="bg-white dark:bg-[#1B241E] border border-[#E3E1D9] dark:border-[#2A382E] rounded-[22px] p-5 sm:p-6 shadow-xs mb-8 transition-colors">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#ECEAE2] dark:border-[#2A382E]">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-[18px] text-[#1A241E] dark:text-[#F2EFE9]">
                Gestão de Cupons
              </h2>
            </div>
            <span className="text-[12.5px] text-[#637267] dark:text-[#9CA79E] font-medium">
              Regra: 1 cupom por pedido • Não cumulativo
            </span>
          </div>

          {coupons.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-[#FAF0ED] text-[#CB5A3C] flex items-center justify-center mx-auto mb-3">
                <Sparkles size={24} />
              </div>
              <h3 className="font-bold text-[#1A241E] dark:text-[#F2EFE9] text-[16px] mb-1">
                Nenhum cupom cadastrado ainda
              </h3>
              <p className="text-[13px] text-[#637267] dark:text-[#9CA79E] max-w-md mx-auto mb-4">
                Crie seu primeiro cupom com pedido mínimo para atrair clientes no Instagram e aumentar seus pedidos diretos.
              </p>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-2 bg-[#2E4233] dark:bg-[#25332A] text-white text-xs font-semibold px-4 py-2 rounded-xl border border-transparent dark:border-[#3B4E40]"
              >
                <Plus size={15} />
                <span>Criar Primeiro Cupom</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedCoupons.map((coupon) => {
                const isExpired = coupon.expires_at ? new Date(coupon.expires_at) < new Date() : false;
                const isFirstOrder = coupon.target_audience === "first_order" || (coupon.description && coupon.description.includes("1º Pedido"));

                return (
                  <div
                    key={coupon.id}
                    className={`border rounded-xl p-3.5 sm:p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      coupon.status === "active" && !isExpired
                        ? "bg-[#FAF9F5] dark:bg-[#161F18] border-[#E5E2D6] dark:border-[#2A382E] hover:border-[#D5D0C0] dark:hover:border-[#3D5243]"
                        : "bg-gray-50 dark:bg-[#131A15] border-gray-200 dark:border-[#222E25] opacity-65"
                    }`}
                  >
                    {/* Left: Code, Audience & Discount Info */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      {/* Ticket Code Box */}
                      <div className="bg-white dark:bg-[#1B241E] border border-dashed border-[#CB5A3C]/40 rounded-xl px-3 py-2 flex items-center gap-2 shrink-0 shadow-2xs">
                        <span className="font-mono text-[15px] font-black text-[#1A241E] dark:text-[#F2EFE9] tracking-wider">
                          {coupon.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(coupon.code, coupon.id)}
                          className="text-gray-400 dark:text-gray-500 hover:text-[#2E4233] dark:hover:text-[#F2EFE9] p-1 rounded hover:bg-gray-100 dark:hover:bg-[#25332A] transition-colors cursor-pointer"
                          title="Copiar código"
                        >
                          {copiedText === coupon.id ? (
                            <Check size={14} className="text-emerald-600" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>

                      {/* Details & Rules */}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          {/* Discount Badge */}
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            coupon.discount_type === "percentage"
                              ? "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-transparent dark:border-purple-800/40"
                              : coupon.discount_type === "fixed"
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-transparent dark:border-emerald-800/40"
                              : "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-transparent dark:border-blue-800/40"
                          }`}>
                            {coupon.discount_type === "percentage"
                              ? `${coupon.discount_value}% OFF`
                              : coupon.discount_type === "fixed"
                              ? `${formatBRL(coupon.discount_value)} OFF`
                              : "FRETE GRÁTIS"}
                          </span>

                          {/* Audience Badge */}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            isFirstOrder
                              ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40"
                              : "bg-stone-100 dark:bg-[#25332A] text-stone-700 dark:text-[#C5CEBA] border border-transparent dark:border-[#324538]"
                          }`}>
                            <Users size={11} />
                            {isFirstOrder ? "1º Pedido no Deli" : "Global (1 uso/cliente)"}
                          </span>

                          {/* Min Order Badge */}
                          <span className="text-[11.5px] font-bold text-[#CB5A3C] bg-[#FDF2F0] dark:bg-[#2A1D1A] px-2 py-0.5 rounded-md border border-[#CB5A3C]/20 dark:border-[#CB5A3C]/40">
                            {coupon.min_order_cents > 0
                              ? `Mínimo: ${formatBRL(coupon.min_order_cents)}`
                              : "Sem mínimo"}
                          </span>
                        </div>

                        {/* Description or Expiration subline */}
                        <div className="flex flex-wrap items-center gap-3 text-[11.5px] text-[#637267] dark:text-[#9CA79E]">
                          {coupon.description && (
                            <span className="truncate max-w-xs">{coupon.description}</span>
                          )}
                          <span className="flex items-center gap-1 shrink-0">
                            <Clock size={12} />
                            {coupon.expires_at
                              ? `Até ${new Date(coupon.expires_at).toLocaleDateString("pt-BR")}`
                              : "Sem expiração"}
                          </span>
                          <span className="shrink-0 font-medium">
                            {coupon.uses_count} {coupon.uses_count === 1 ? "uso realizado" : "usos realizados"}
                            {coupon.max_uses ? ` (limite ${coupon.max_uses})` : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Switch, Generate Art, Delete */}
                    <div className="flex items-center justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-[#2A382E]">
                      {/* Gerar Arte Instagram Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenImageGen(coupon)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-[#CB5A3C] bg-white dark:bg-[#1B241E] border border-[#CB5A3C]/30 hover:bg-[#FDF2F0] dark:hover:bg-[#2A1D1A] rounded-xl transition-all cursor-pointer shadow-2xs"
                        title="Gerar arte profissional para Instagram"
                      >
                        <Sparkles size={13} />
                        <span>Gerar Arte</span>
                      </button>

                      {/* DeliPlus Switch Status Toggle */}
                      <div className="flex flex-col items-center justify-center">
                        <Switch
                          checked={coupon.status === "active" && !isExpired}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleCoupon(coupon.id, coupon.status);
                          }}
                          onCheckedChange={() => handleToggleCoupon(coupon.id, coupon.status)}
                          activeTrackColor="bg-[#2E4233]"
                          inactiveTrackColor="bg-stone-300 dark:bg-stone-700"
                          aria-label={`Alternar status do cupom ${coupon.code}`}
                        />
                        <span className={`text-[10px] font-semibold mt-0.5 ${
                          coupon.status === "active" && !isExpired ? "text-[#2E4233] dark:text-[#10B981]" : "text-gray-400 dark:text-gray-500"
                        }`}>
                          {coupon.status === "active" && !isExpired ? "Ativo" : "Pausado"}
                        </span>
                      </div>

                      {/* Delete Action */}
                      {deleteConfirmId === coupon.id ? (
                        <div className="flex items-center gap-1.5 bg-red-50 p-1 rounded-lg border border-red-200">
                          <span className="text-[11px] text-red-700 font-bold">Excluir?</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(coupon.id)}
                            className="text-[11px] font-bold text-red-700 hover:underline cursor-pointer"
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-[11px] text-gray-500 hover:underline cursor-pointer ml-0.5"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(coupon.id)}
                          className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-[#25332A] transition-colors cursor-pointer"
                          title="Excluir cupom"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Standard DeliPlus Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-4 border-t border-[#ECEAE2] dark:border-[#2A382E] text-[12px] text-[#637267] dark:text-[#9CA79E]">
            <span className="font-medium">
              Mostrando {coupons.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}–{Math.min(currentPage * ITEMS_PER_PAGE, coupons.length)} de {coupons.length} cupons
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${
                      currentPage === i + 1
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
      {/* MODAL: CRIAR NOVO CUPOM COM REGRAS DELIPLUS                    */}
      {/* ============================================================== */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1B241E] rounded-2xl border border-[#E3E1D9] dark:border-[#2A382E] max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="font-serif text-[22px] font-semibold text-[#1A241E] dark:text-[#F2EFE9] mb-1">
              Criar Novo Cupom de Desconto
            </h3>
            <p className="text-[13px] text-[#637267] dark:text-[#9CA79E] mb-4">
              Configure as regras e o valor mínimo obrigatório para proteger sua margem.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCouponSubmit} className="space-y-4">
              {/* Código */}
              <div>
                <label className="block text-[13px] font-medium text-[#334237] dark:text-[#C5CEBA] mb-1">
                  Código do Cupom *
                </label>
                <input
                  type="text"
                  placeholder="EX: PROMO10, DELI15"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 border border-[#E3E1D9] dark:border-[#2A382E] bg-white dark:bg-[#161F18] text-[#1A241E] dark:text-[#F2EFE9] rounded-xl text-[14px] font-mono font-bold tracking-wider uppercase focus:outline-none focus:border-[#2E4233] dark:focus:border-[#10B981]"
                  required
                />
              </div>

              {/* Público-alvo / Regra */}
              <div>
                <label className="block text-[13px] font-medium text-[#334237] dark:text-[#C5CEBA] mb-1">
                  Público do Cupom *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewAudience("all_customers")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      newAudience === "all_customers"
                        ? "border-[#2E4233] bg-[#FAF8F0] ring-1 ring-[#2E4233]"
                        : "border-[#E3E1D9] bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="text-[12.5px] font-bold text-[#1A241E] dark:text-[#F2EFE9]">
                      👥 Global (1 uso/cliente)
                    </div>
                    <div className="text-[11px] text-[#637267] dark:text-[#9CA79E]">
                      Válido para qualquer cliente uma única vez
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewAudience("first_order")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      newAudience === "first_order"
                        ? "border-[#2E4233] bg-[#FAF8F0] ring-1 ring-[#2E4233]"
                        : "border-[#E3E1D9] bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="text-[12.5px] font-bold text-[#1A241E] dark:text-[#F2EFE9]">
                      🌟 1º Pedido no Deli
                    </div>
                    <div className="text-[11px] text-[#637267] dark:text-[#9CA79E]">
                      Apenas clientes novos sem compras anteriores
                    </div>
                  </button>
                </div>
              </div>

              {/* Tipo de Desconto */}
              <div>
                <label className="block text-[13px] font-medium text-[#334237] dark:text-[#C5CEBA] mb-1">
                  Tipo de Desconto *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewDiscountType("percentage")}
                    className={`py-2 px-3 text-[13px] font-medium rounded-xl border text-center transition-all cursor-pointer ${
                      newDiscountType === "percentage"
                        ? "bg-[#2E4233] text-white border-[#2E4233]"
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
                        ? "bg-[#2E4233] text-white border-[#2E4233]"
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
                        ? "bg-[#2E4233] text-white border-[#2E4233]"
                        : "bg-white border-[#E3E1D9] text-[#334237] hover:bg-gray-50"
                    }`}
                  >
                    Frete Grátis
                  </button>
                </div>
              </div>

              {/* Valor do Desconto & Pedido Mínimo OBRIGATÓRIO */}
              <div className="grid grid-cols-2 gap-3">
                {newDiscountType !== "free_shipping" ? (
                  <div>
                    <label className="block text-[13px] font-medium text-[#334237] dark:text-[#C5CEBA] mb-1">
                      {newDiscountType === "percentage" ? "Desconto (%) *" : "Desconto (R$) *"}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step={newDiscountType === "percentage" ? "1" : "0.50"}
                        min="1"
                        value={newDiscountValue}
                        onChange={(e) => setNewDiscountValue(parseFloat(e.target.value) || 0)}
                        className="w-full px-3.5 py-2 border border-[#E3E1D9] dark:border-[#2A382E] bg-white dark:bg-[#161F18] text-[#1A241E] dark:text-[#F2EFE9] rounded-xl text-[14px] font-bold focus:outline-none focus:border-[#2E4233] dark:focus:border-[#10B981]"
                        required
                      />
                      <span className="absolute right-3.5 top-2 text-[#637267] dark:text-[#9CA79E] text-[13px]">
                        {newDiscountType === "percentage" ? "%" : "R$"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[13px] font-medium text-[#334237] dark:text-[#C5CEBA] mb-1">
                      Benefício
                    </label>
                    <input
                      type="text"
                      disabled
                      value="Entrega 100% Grátis"
                      className="w-full px-3.5 py-2 border border-[#E3E1D9] rounded-xl text-[13px] font-semibold bg-gray-50 text-gray-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[13px] font-bold text-[#CB5A3C] mb-1">
                    Pedido Mínimo (R$) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={newMinOrder}
                    onChange={(e) => setNewMinOrder(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 border border-[#CB5A3C]/50 dark:border-[#CB5A3C]/60 rounded-xl text-[14px] font-bold text-[#CB5A3C] bg-[#FDF2F0]/30 dark:bg-[#2A1D1A]/50 focus:outline-none focus:border-[#CB5A3C]"
                    required
                  />
                  <span className="text-[11px] text-[#637267] block mt-0.5">Obrigatório para proteger a margem</span>
                </div>
              </div>

              {/* Descrição Opcional */}
              <div>
                <label className="block text-[13px] font-medium text-[#334237] dark:text-[#C5CEBA] mb-1">
                  Descrição (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Válido para lanches e combos no delivery"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#E3E1D9] dark:border-[#2A382E] bg-white dark:bg-[#161F18] text-[#1A241E] dark:text-[#F2EFE9] rounded-xl text-[14px] focus:outline-none focus:border-[#2E4233] dark:focus:border-[#10B981]"
                />
              </div>

              {/* Validade */}
              <div>
                <label className="block text-[13px] font-medium text-[#334237] dark:text-[#C5CEBA] mb-1">
                  Validade do Cupom
                </label>
                <select
                  value={newExpiresInDays}
                  onChange={(e) => setNewExpiresInDays(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2 border border-[#E3E1D9] dark:border-[#2A382E] rounded-xl text-[14px] focus:outline-none focus:border-[#2E4233] dark:focus:border-[#10B981] bg-white dark:bg-[#161F18] text-[#1A241E] dark:text-[#F2EFE9] cursor-pointer"
                >
                  <option value={7}>7 dias (Ideal para campanhas curtas)</option>
                  <option value={15}>15 dias</option>
                  <option value={30}>30 dias (1 mês)</option>
                  <option value={60}>60 dias</option>
                  <option value={0}>Sem validade definida (Indeterminado)</option>
                </select>
              </div>

              {/* Notice de Regras */}
              <div className="p-2.5 rounded-xl bg-[#FAF8F0] dark:bg-[#25332A] border border-[#EAE7DC] dark:border-[#2A382E] text-[11.5px] text-[#556358] dark:text-[#C5CEBA] flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#2E4233] shrink-0" />
                <span>
                  <strong>Não cumulativo:</strong> No carrinho do cliente, apenas 1 cupom pode ser resgatado por compra.
                </span>
              </div>

              {/* Botões */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ECEAE2] dark:border-[#2A382E]">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-[14px] text-[#556358] dark:text-[#9CA79E] hover:bg-gray-100 dark:hover:bg-[#25332A] rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-[14px] font-semibold bg-[#2E4233] dark:bg-[#25332A] hover:bg-[#233327] dark:hover:bg-[#2F4235] text-white rounded-xl shadow-sm border border-transparent dark:border-[#3B4E40] transition-all cursor-pointer"
                >
                  Criar Cupom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: GERADOR DE ARTES COM MARCA D'ÁGUA DELIPLUS              */}
      {/* ============================================================== */}
      <CouponImageGeneratorModal
        isOpen={imageGenOpen}
        onClose={() => setImageGenOpen(false)}
        coupon={selectedCouponForImage}
        storeName={storeName}
        storeSlug={storeSlug}
      />
    </div>
  );
}
