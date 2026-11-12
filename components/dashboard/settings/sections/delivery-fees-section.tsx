"use client";

import React from "react";
import { Bike, ShoppingBag, Clock, Sparkles, Power } from "lucide-react";
import { ModernBusinessHours } from "@/app/dashboard/settings/types";
import { Switch } from "@/components/ui/switch";
import {
  WeeklyScheduleManager,
  normalizeBusinessHours,
} from "@/components/dashboard/settings/weekly-schedule-manager";

export interface DeliveryFeesSectionProps {
  isOpen: boolean;
  onToggleStatus: (val: boolean) => void;
  acceptsDelivery: boolean;
  setAcceptsDelivery: (val: boolean) => void;
  acceptsPickup: boolean;
  setAcceptsPickup: (val: boolean) => void;
  prepMin: string;
  setPrepMin: (val: string) => void;
  prepMax: string;
  setPrepMax: (val: string) => void;
  deliveryFee: string;
  setDeliveryFee: (val: string) => void;
  minOrder: string;
  setMinOrder: (val: string) => void;
  freeDeliveryAbove: string;
  setFreeDeliveryAbove: (val: string) => void;
  businessHours: ModernBusinessHours;
  onChangeHours: (hours: ModernBusinessHours) => void;
  onToast?: (msg: string) => void;
}

export function DeliveryFeesSection({
  isOpen,
  onToggleStatus,
  acceptsDelivery,
  setAcceptsDelivery,
  acceptsPickup,
  setAcceptsPickup,
  prepMin,
  setPrepMin,
  prepMax,
  setPrepMax,
  deliveryFee,
  setDeliveryFee,
  minOrder,
  setMinOrder,
  freeDeliveryAbove,
  setFreeDeliveryAbove,
  businessHours,
  onChangeHours,
  onToast,
}: DeliveryFeesSectionProps) {
  const normalizedHours = normalizeBusinessHours(businessHours);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. DISPONIBILIDADE & MODALIDADES DE ATENDIMENTO */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#1A241E] dark:text-[#F2EFE9]">
              Disponibilidade & Atendimento
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Controle a abertura da loja em tempo real e escolha como o cliente recebe o pedido.
            </p>
          </div>

          <div
            className={`flex items-center justify-between sm:justify-end gap-3 px-3.5 py-2.5 rounded-xl border transition-colors ${
              isOpen
                ? "bg-emerald-500/10 border-emerald-500/25"
                : "bg-amber-500/10 border-amber-500/25"
            }`}
          >
            <div className="flex items-center gap-2">
              <Power
                className={`w-4 h-4 shrink-0 ${
                  isOpen
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-amber-700 dark:text-amber-400"
                }`}
              />
              <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                {isOpen ? "Loja Aberta agora" : "Loja Fechada agora"}
              </span>
            </div>
            <Switch
              checked={isOpen}
              onCheckedChange={onToggleStatus}
              aria-label={isOpen ? "Pausar pedidos da loja" : "Abrir loja para pedidos"}
              activeTrackColor="bg-emerald-600 dark:bg-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* CARD DELIVERY */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              acceptsDelivery
                ? "bg-[#F5F1E6] dark:bg-[#233127] border-emerald-600/40 dark:border-emerald-500/40 shadow-xs"
                : "bg-[#FAF7F0] dark:bg-[#1E2B22] border-border/50 opacity-65"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Bike className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="font-serif font-bold text-sm text-foreground block">
                    Entrega (Delivery)
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    Envio até o endereço do cliente
                  </span>
                </div>
              </div>
              <Switch
                checked={acceptsDelivery}
                onCheckedChange={setAcceptsDelivery}
                aria-label="Ativar ou desativar Entrega (Delivery)"
                activeTrackColor="bg-emerald-600 dark:bg-emerald-500"
                className="shrink-0"
              />
            </div>
          </div>

          {/* CARD RETIRADA */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              acceptsPickup
                ? "bg-[#F5F1E6] dark:bg-[#233127] border-blue-600/40 dark:border-blue-500/40 shadow-xs"
                : "bg-[#FAF7F0] dark:bg-[#1E2B22] border-border/50 opacity-65"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="font-serif font-bold text-sm text-foreground block">
                    Retirada no Balcão
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    Cliente retira direto na loja
                  </span>
                </div>
              </div>
              <Switch
                checked={acceptsPickup}
                onCheckedChange={setAcceptsPickup}
                aria-label="Ativar ou desativar Retirada no Balcão"
                activeTrackColor="bg-emerald-600 dark:bg-emerald-500"
                className="shrink-0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. PRAZOS & PARÂMETROS FINANCEIROS */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="border-b border-border/60 pb-3">
          <h3 className="font-serif font-bold text-lg text-[#1A241E] dark:text-[#F2EFE9]">
            Prazos & Taxas de Entrega
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Tempo estimado exibido na vitrine, taxa única de entrega e valor mínimo do pedido.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* TEMPO MÍNIMO */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Tempo Mínimo (min)
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="number"
                min="5"
                max="180"
                value={prepMin}
                onChange={(e) => setPrepMin(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#E2DDD0] dark:border-[#324537] bg-[#F8F6EF] dark:bg-[#243329] text-foreground text-base lg:text-xs font-semibold focus:bg-white dark:focus:bg-[#2A3B30] focus:ring-2 focus:ring-[#CB5A3C]/20 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* TEMPO MÁXIMO */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Tempo Máximo (min)
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="number"
                min="10"
                max="240"
                value={prepMax}
                onChange={(e) => setPrepMax(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#E2DDD0] dark:border-[#324537] bg-[#F8F6EF] dark:bg-[#243329] text-foreground text-base lg:text-xs font-semibold focus:bg-white dark:focus:bg-[#2A3B30] focus:ring-2 focus:ring-[#CB5A3C]/20 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* TAXA PADRÃO */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Taxa de Entrega (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 lg:top-2 text-xs font-bold text-muted-foreground pointer-events-none">
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                placeholder="5,00"
                className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-[#E2DDD0] dark:border-[#324537] bg-[#F8F6EF] dark:bg-[#243329] text-foreground text-base lg:text-xs font-bold focus:bg-white dark:focus:bg-[#2A3B30] focus:ring-2 focus:ring-[#CB5A3C]/20 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* PEDIDO MÍNIMO */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Pedido Mínimo (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 lg:top-2 text-xs font-bold text-muted-foreground pointer-events-none">
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                placeholder="30,00"
                className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-[#E2DDD0] dark:border-[#324537] bg-[#F8F6EF] dark:bg-[#243329] text-foreground text-base lg:text-xs font-bold focus:bg-white dark:focus:bg-[#2A3B30] focus:ring-2 focus:ring-[#CB5A3C]/20 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* BENEFÍCIO FRETE GRÁTIS */}
        <div className="p-4 rounded-xl bg-[#FAF3E0] dark:bg-[#252F21] border border-amber-200/80 dark:border-amber-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <label className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                Frete Grátis Promocional
              </label>
            </div>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
              Isenta automaticamente a taxa de entrega quando o pedido atingir este valor (opcional).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              Acima de:
            </span>
            <div className="relative w-36">
              <span className="absolute left-3 top-2.5 lg:top-1.5 text-xs font-bold text-muted-foreground pointer-events-none">
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={freeDeliveryAbove}
                onChange={(e) => setFreeDeliveryAbove(e.target.value)}
                placeholder="Ex: 80,00"
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-[#2E3B29] text-base lg:text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. GRADE SEMANAL DE HORÁRIOS */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="border-b border-border/60 pb-3">
          <h3 className="font-serif font-bold text-lg text-[#1A241E] dark:text-[#F2EFE9] flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#B4482D] dark:text-[#FF7D4F] shrink-0" />
            <span>Horários de Funcionamento</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Defina seus dias de atendimento, turnos de almoço/jantar ou replicação rápida para a semana inteira.
          </p>
        </div>

        <WeeklyScheduleManager
          hours={normalizedHours}
          onChange={onChangeHours}
          onToast={onToast}
        />
      </div>
    </div>
  );
}
