"use client";

import React from "react";
import {
  PaymentMethodEditor,
  PaymentSettingsState,
} from "@/components/dashboard/settings/payment-method-card";

export interface PaymentsSectionProps {
  state: PaymentSettingsState;
  onChange: (newState: PaymentSettingsState) => void;
  onToast?: (msg: string, type?: "success" | "error") => void;
}

export function PaymentsSection({
  state,
  onChange,
  onToast,
}: PaymentsSectionProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="border-b border-border/60 pb-3">
          <h3 className="font-serif font-bold text-lg text-[#1A241E] dark:text-[#F2EFE9]">
            Formas de Pagamento & Chave Pix
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Configure sua chave Pix, cartões aceitos na maquininha e pagamento em dinheiro exibidos no checkout da vitrine.
          </p>
        </div>

        <PaymentMethodEditor
          state={state}
          onChange={onChange}
          onToast={onToast}
        />
      </div>
    </div>
  );
}
