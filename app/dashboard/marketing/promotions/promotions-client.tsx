"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Utensils,
  ShoppingBag,
  DollarSign,
  MousePointerClick,
  Copy,
  Check,
  Edit3,
  X,
  ExternalLink,
  Layers,
  ArrowRight
} from "lucide-react";
import { toggleProductPromo, updateProductPromoPrice } from "../actions";

export interface PromoProduct {
  id: string;
  name: string;
  imageUrl?: string | null;
  categoryName?: string;
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

interface PromotionsClientProps {
  storeSlug: string;
  storeName: string;
  initialPromoProducts: PromoProduct[];
}

export default function PromotionsClient({
  storeSlug = "loja",
  initialPromoProducts = []
}: PromotionsClientProps) {
  const [promoProducts, setPromoProducts] = useState<PromoProduct[]>(initialPromoProducts);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Modal State for Promo Price edit
  const [editingPromoProduct, setEditingPromoProduct] = useState<PromoProduct | null>(null);
  const [editPromoPrice, setEditPromoPrice] = useState<number>(0);
  const [, startTransition] = useTransition();

  // Helper format BRL
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

  // Toggle inPromo status
  const handleTogglePromo = (productId: string, currentInPromo: boolean) => {
    setPromoProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, inPromo: !currentInPromo } : p))
    );

    startTransition(async () => {
      const res = await toggleProductPromo(productId, currentInPromo);
      if (!res.success) {
        setPromoProducts(prev =>
          prev.map(p => (p.id === productId ? { ...p, inPromo: currentInPromo } : p))
        );
      }
    });
  };

  // Save Promo Price
  const handleSavePromoPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromoProduct) return;

    const newPriceCents = Math.round(editPromoPrice * 100);
    if (newPriceCents <= 0) return;

    const discount = editingPromoProduct.priceCents > 0
      ? Math.round(((editingPromoProduct.priceCents - newPriceCents) / editingPromoProduct.priceCents) * 100)
      : 0;

    const targetId = editingPromoProduct.id;
    setPromoProducts(prev =>
      prev.map(p =>
        p.id === targetId
          ? {
              ...p,
              promoPriceCents: newPriceCents,
              discountPercentage: discount,
              inPromo: true
            }
          : p
      )
    );
    setEditingPromoProduct(null);

    await updateProductPromoPrice(targetId, newPriceCents, true);
  };

  // Aggregated Stats
  const activePromoCount = promoProducts.filter(p => p.inPromo).length;
  const totalPromoSold = promoProducts.reduce((sum, p) => sum + p.totalSold, 0);
  const totalPromoRevenue = promoProducts.reduce((sum, p) => sum + p.totalRevenueCents, 0);
  const totalPromoClicks = promoProducts.reduce((sum, p) => sum + p.clicksCount, 0);

  // Top vs Slow Performers
  const sortedBySales = [...promoProducts].sort((a, b) => b.totalSold - a.totalSold);
  const topPerformers = sortedBySales.slice(0, 2);
  const slowPerformers = [...promoProducts]
    .sort((a, b) => a.totalSold - b.totalSold)
    .filter(p => p.totalSold <= 4)
    .slice(0, 2);

  return (
    <div className="flex-1 bg-[#F7F6F2] min-h-screen text-[#1A241E] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* ============================================================ */}
        {/* HEADER & ACTIONS                                             */}
        {/* ============================================================ */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#2E4233]/10 text-[#2E4233]">
                <Sparkles size={13} />
                Inteligência de Vendas
              </span>
            </div>
            <h1 className="font-serif text-[32px] sm:text-[38px] lg:text-[42px] font-semibold text-[#1A241E] tracking-tight leading-none mb-2">
              Desempenho das Promoções do Cardápio
            </h1>
            <p className="text-[14px] sm:text-[15px] text-[#5D6B60] max-w-2xl">
              Monitore quais produtos têm maior saída, acompanhe cliques no cardápio público e ajuste preços promocionais em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const url = typeof window !== "undefined"
                  ? `${window.location.origin}/${storeSlug}`
                  : `https://deliplus.com.br/${storeSlug}`;
                handleCopy(url, "store-link");
              }}
              className="flex items-center gap-2 bg-white border border-[#E3E1D9] hover:bg-[#F4F3ED] text-[#2E4233] font-medium text-[14px] rounded-xl px-4 py-2.5 shadow-sm transition-all cursor-pointer"
            >
              {copiedText === "store-link" ? <Check size={18} className="text-[#2E7D32]" /> : <Copy size={18} />}
              <span>{copiedText === "store-link" ? "Link Copiado!" : "Copiar Link do Cardápio"}</span>
            </button>
            <Link
              href="/dashboard/menu"
              className="flex items-center gap-2 bg-[#253629] hover:bg-[#1E2C21] text-white font-medium text-[14px] rounded-xl px-4 py-2.5 shadow-sm transition-all cursor-pointer"
            >
              <span>Gerenciar Cardápio</span>
              <ExternalLink size={16} />
            </Link>
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
        {/* SPLIT INSIGHTS: MAIS VENDIDOS VS MENOS VENDIDOS              */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
          {/* Box 1: Maior Saída (Top Performers) */}
          <div className="bg-white border border-[#E3E1D9] rounded-[22px] p-5 sm:p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center font-bold">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h2 className="font-serif text-[18px] sm:text-[20px] font-semibold text-[#1A241E]">
                    🔥 Promoções com Maior Saída
                  </h2>
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
                      <div className="font-semibold text-[#1A241E] text-[14px] truncate flex items-center gap-1.5">
                        <span className="text-[#CB5A3C]">#{idx + 1}</span>
                        <span>{item.name}</span>
                      </div>
                      <div className="text-[12px] text-[#637267] flex items-center gap-2">
                        <span>De {formatBRL(item.priceCents)} por <strong className="text-[#2E7D32]">{formatBRL(item.promoPriceCents)}</strong></span>
                        <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 font-bold text-[10px]">
                          -{item.discountPercentage}%
                        </span>
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
              ))}
            </div>
          </div>

          {/* Box 2: Menor Saída (Precisam de Atenção) */}
          <div className="bg-white border border-[#E3E1D9] rounded-[22px] p-5 sm:p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#FFF3E0] text-[#E65100] flex items-center justify-center font-bold">
                  <TrendingDown size={18} />
                </div>
                <div>
                  <h2 className="font-serif text-[18px] sm:text-[20px] font-semibold text-[#1A241E]">
                    ⚠️ Promoções com Menor Saída
                  </h2>
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
              {slowPerformers.length === 0 ? (
                <div className="text-center py-6 text-[13px] text-[#637267]">
                  Todas as suas promoções estão com bom volume de vendas!
                </div>
              ) : (
                slowPerformers.map((item) => (
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
                          <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            -{item.discountPercentage}%
                          </span>
                        </div>
                        <div className="text-[11px] text-[#E65100] mt-0.5">
                          💡 Poucas pessoas pediram. Dica: melhore a foto ou teste combo!
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPromoProduct(item);
                          setEditPromoPrice(item.promoPriceCents ? item.promoPriceCents / 100 : item.priceCents / 100);
                        }}
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
        </div>

        {/* ============================================================ */}
        {/* TABELA DE GESTÃO COMPLETA DE PRATOS EM PROMOÇÃO              */}
        {/* ============================================================ */}
        <div className="bg-white border border-[#E3E1D9] rounded-[22px] p-5 sm:p-6 shadow-[0_2px_12px_rgba(30,40,30,0.02)] mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="font-serif text-[22px] font-semibold text-[#1A241E]">
                Todos os Pratos Promocionais do Cardápio
              </h2>
              <p className="text-[13px] text-[#637267]">
                Altere preços promocionais e controle quais pratos estão com desconto ativo na sua loja.
              </p>
            </div>
            <Link
              href="/dashboard/marketing/academy"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#2E7D32] hover:underline"
            >
              <span>Ver técnicas de apresentação na Academia Deli</span>
              <ArrowRight size={14} />
            </Link>
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
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 text-right pr-1 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEAE2]/60">
                {promoProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[#637267]">
                      Nenhum produto configurado em promoção. Cadastre um preço promocional no seu Cardápio!
                    </td>
                  </tr>
                ) : (
                  promoProducts.map((product) => (
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

                      {/* Preço Normal */}
                      <td className="py-3.5 text-[#637267] line-through font-medium">
                        {formatBRL(product.priceCents)}
                      </td>

                      {/* Preço Promo */}
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#2E7D32] text-[14px]">
                            {formatBRL(product.promoPriceCents)}
                          </span>
                          {product.discountPercentage > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              -{product.discountPercentage}%
                            </span>
                          )}
                        </div>
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

                      {/* Status */}
                      <td className="py-3.5">
                        <button
                          type="button"
                          onClick={() => handleTogglePromo(product.id, product.inPromo)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold transition-all cursor-pointer ${
                            product.inPromo
                              ? "bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#C8E6C9]"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${product.inPromo ? "bg-[#2E7D32]" : "bg-gray-400"}`}></span>
                          <span>{product.inPromo ? "Ativa" : "Pausada"}</span>
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 text-right pr-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPromoProduct(product);
                            setEditPromoPrice(product.promoPriceCents ? product.promoPriceCents / 100 : product.priceCents / 100);
                          }}
                          className="inline-flex items-center gap-1 text-[12px] font-medium text-[#2E4233] bg-[#F4F3EE] hover:bg-[#EAE8E0] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 size={13} />
                          <span>Editar Preço</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BANNER DESTRATÉGICO: ADICIONAIS & CARDÁPIO                   */}
        {/* ============================================================ */}
        <div className="bg-gradient-to-r from-[#253629] to-[#364D3B] text-white rounded-[22px] p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#CB5A3C] font-semibold text-[13px]">
              <Sparkles size={16} />
              <span>Dica de Ouro da Engenharia de Cardápio</span>
            </div>
            <h3 className="font-serif text-[20px] font-semibold text-white">
              O prato em promoção atrai o clique. O adicional gera o lucro real!
            </h3>
            <p className="text-[13px] text-white/80 max-w-xl">
              Clientes que economizam no prato principal tendem a adicionar queijo duplo, bacon ou refrigerante. Certifique-se de que seus pratos em oferta tenham pelo menos 2 adicionais cadastrados no Cardápio.
            </p>
          </div>
          <Link
            href="/dashboard/menu"
            className="shrink-0 bg-white text-[#253629] hover:bg-[#FAF8F0] font-semibold text-[14px] px-5 py-2.5 rounded-xl shadow-sm transition-all"
          >
            Cadastrar Adicionais
          </Link>
        </div>
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
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="font-serif text-[20px] font-semibold text-[#1A241E] mb-1">
              Ajustar Preço Promocional
            </h3>
            <p className="text-[13px] text-[#637267] mb-4">
              {editingPromoProduct.name} • Preço Regular: {formatBRL(editingPromoProduct.priceCents)}
            </p>

            <form onSubmit={handleSavePromoPrice} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#334237] mb-1">
                  Novo Preço com Desconto (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[#637267] text-[14px]">R$</span>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    max={(editingPromoProduct.priceCents / 100) - 0.10}
                    value={editPromoPrice}
                    onChange={(e) => setEditPromoPrice(parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-4 py-2 border border-[#E3E1D9] rounded-xl text-[15px] font-bold text-[#1A241E] focus:outline-none focus:border-[#253629]"
                    required
                  />
                </div>
                {editPromoPrice > 0 && editingPromoProduct.priceCents > 0 && (
                  <div className="text-[12px] text-[#2E7D32] font-semibold mt-1.5 flex items-center gap-1">
                    <span>Desconto resultante:</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100">
                      -{Math.max(0, Math.round(((editingPromoProduct.priceCents - editPromoPrice * 100) / editingPromoProduct.priceCents) * 100))}%
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ECEAE2]">
                <button
                  type="button"
                  onClick={() => setEditingPromoProduct(null)}
                  className="px-4 py-2 text-[14px] text-[#556358] hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-[14px] font-semibold bg-[#253629] hover:bg-[#1E2C21] text-white rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Salvar Preço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
