"use client";

import React, { useState, useMemo } from "react";
import {
  PixOfficialIcon,
  VisaLogo,
  MastercardLogo,
  EloLogo,
  HipercardLogo,
} from "@/components/storefront/payment-brand-icons";
import {
  CheckCircle2,
  AlertCircle,
  Banknote,
  CreditCard,
  Copy,
  Check,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

export interface PaymentSettingsState {
  acceptPix: boolean;
  pixKey: string;
  pixKeyType: string;
  acceptCard: boolean;
  acceptCash: boolean;
  needChangeOption: boolean;
  acceptMealVoucher: boolean;
}

export interface PaymentMethodEditorProps {
  state: PaymentSettingsState;
  onChange: (newState: PaymentSettingsState) => void;
  onToast?: (msg: string, type?: "success" | "error") => void;
}

export function formatPixKey(value: string, type: string): string {
  const clean = value.replace(/\s+/g, "");
  if (type === "cpf") {
    const digits = clean.replace(/\D/g, "").slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  if (type === "cnpj") {
    const digits = clean.replace(/\D/g, "").slice(0, 14);
    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  }
  if (type === "phone") {
    const digits = clean.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 10) {
      return digits
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }
  return clean;
}

export function validatePixKey(
  key: string,
  type: string
): { isValid: boolean; message: string } {
  if (!key.trim()) {
    return { isValid: false, message: "Digite sua chave Pix" };
  }
  const clean = key.trim();

  if (type === "cpf") {
    const digits = clean.replace(/\D/g, "");
    if (digits.length !== 11) {
      return { isValid: false, message: "CPF deve ter 11 dígitos" };
    }
    return { isValid: true, message: "CPF com 11 dígitos" };
  }

  if (type === "cnpj") {
    const digits = clean.replace(/\D/g, "");
    if (digits.length !== 14) {
      return { isValid: false, message: "CNPJ deve ter 14 dígitos" };
    }
    return { isValid: true, message: "CNPJ com 14 dígitos" };
  }

  if (type === "phone") {
    const digits = clean.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 11) {
      return { isValid: false, message: "Celular com DDD inválido" };
    }
    return { isValid: true, message: "Celular válido com DDD" };
  }

  if (type === "email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clean)) {
      return { isValid: false, message: "Formato de e-mail inválido" };
    }
    return { isValid: true, message: "E-mail válido" };
  }

  if (type === "random") {
    if (clean.length < 32) {
      return { isValid: false, message: "Chave EVP deve conter 32 caracteres" };
    }
    return { isValid: true, message: "Chave aleatória válida" };
  }

  return { isValid: true, message: "Chave informada" };
}

export function PaymentMethodEditor({
  state,
  onChange,
  onToast,
}: PaymentMethodEditorProps) {
  const [copiedKey, setCopiedKey] = useState(false);

  const pixValidation = useMemo(
    () => validatePixKey(state.pixKey, state.pixKeyType),
    [state.pixKey, state.pixKeyType]
  );

  const handleCopyPix = () => {
    if (!state.pixKey) return;
    navigator.clipboard.writeText(state.pixKey);
    setCopiedKey(true);
    onToast?.("Chave Pix copiada para a área de transferência! 📋");
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handlePixKeyChange = (val: string) => {
    const formatted = formatPixKey(val, state.pixKeyType);
    onChange({ ...state, pixKey: formatted });
  };

  const handlePixTypeChange = (newType: string) => {
    onChange({
      ...state,
      pixKeyType: newType,
      pixKey: "",
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. CARD PIX (DESTAQUE) */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          state.acceptPix
            ? "bg-[#F5F1E6] dark:bg-[#233127] border-emerald-500/40 dark:border-emerald-500/40 shadow-xs"
            : "bg-[#FAF7F0] dark:bg-[#1E2B22] border-[#E5DFD1] dark:border-[#2A382E] opacity-70"
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-[#32BCAD]/10 flex items-center justify-center shrink-0">
              <PixOfficialIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-serif font-bold text-sm text-[#1A241E] dark:text-[#F2EFE9]">
                  Pix no Pedido (QR Code & Copia e Cola)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  Taxa 0% DeliPlus
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                O cliente finaliza o pedido e vê o QR Code oficial para pagamento direto na sua conta bancária.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <Switch
            checked={state.acceptPix}
            onCheckedChange={(checked) => onChange({ ...state, acceptPix: checked })}
            aria-label="Ativar ou desativar pagamento via Pix"
            activeTrackColor="bg-[#2E4233] dark:bg-emerald-500"
            className="shrink-0"
          />
        </div>

        {/* Configuração da Chave Pix */}
        {state.acceptPix && (
          <div className="pt-3 border-t border-[#E5DFD1]/80 dark:border-[#2F4234] space-y-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Tipo da sua Chave Pix:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "cpf", label: "CPF" },
                  { id: "cnpj", label: "CNPJ" },
                  { id: "phone", label: "Celular" },
                  { id: "email", label: "E-mail" },
                  { id: "random", label: "Chave Aleatória (EVP)" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handlePixTypeChange(t.id)}
                    className={`min-h-9 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                      state.pixKeyType === t.id
                        ? "bg-[#2E4233] dark:bg-emerald-600 text-white border-transparent shadow-2xs"
                        : "bg-[#FAF7F0] dark:bg-[#202C23] text-muted-foreground border-[#E2DDD0] dark:border-[#2F4234] hover:border-foreground/30"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Chave Pix Cadastrada:
              </label>
              <div className="flex items-center gap-2 max-w-md">
                <input
                  type="text"
                  value={state.pixKey}
                  onChange={(e) => handlePixKeyChange(e.target.value)}
                  placeholder={
                    state.pixKeyType === "cpf"
                      ? "000.000.000-00"
                      : state.pixKeyType === "cnpj"
                      ? "00.000.000/0000-00"
                      : state.pixKeyType === "phone"
                      ? "(11) 98765-4321"
                      : state.pixKeyType === "email"
                      ? "financeiro@suaempresa.com.br"
                      : "00000000-0000-0000-0000-000000000000"
                  }
                  className={`flex-1 min-w-0 px-3.5 py-2 rounded-xl border bg-white dark:bg-[#2A3B30] text-foreground text-base lg:text-xs font-medium focus:ring-2 focus:outline-none transition-all ${
                    state.pixKey && !pixValidation.isValid
                      ? "border-amber-400 focus:ring-amber-400/20"
                      : "border-[#E2DDD0] dark:border-[#384D3D] focus:ring-[#32BCAD]/20"
                  }`}
                />

                {state.pixKey && (
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    aria-label="Copiar chave Pix"
                    className="min-h-9 min-w-9 flex items-center justify-center p-2 rounded-xl border border-[#E2DDD0] dark:border-[#384D3D] bg-[#F8F6EF] dark:bg-[#243329] text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                    title="Copiar chave"
                  >
                    {copiedKey ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              {/* Status de Validação da Chave */}
              {state.pixKey && (
                <div className="flex items-center gap-1.5 mt-1.5 text-[11px]">
                  {pixValidation.isValid ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                        {pixValidation.message}
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-amber-700 dark:text-amber-400 font-medium">
                        {pixValidation.message}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. CARD CARTÕES NA MAQUININHA */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          state.acceptCard
            ? "bg-[#F8F6EF] dark:bg-[#233127] border-[#E2DDD0] dark:border-[#2F4234] shadow-xs"
            : "bg-[#FAF7F0] dark:bg-[#1E2B22] border-[#E5DFD1]/60 dark:border-[#2A382E]/60 opacity-70"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-sm text-[#1A241E] dark:text-[#F2EFE9]">
                  Cartão de Crédito e Débito
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                O entregador leva a maquininha até o cliente na entrega ou passa no balcão.
              </p>
              <div className="flex items-center gap-1.5 pt-2">
                <VisaLogo className="h-4 w-7 rounded-xs shadow-2xs" />
                <MastercardLogo className="h-4 w-7 rounded-xs shadow-2xs" />
                <EloLogo className="h-4 w-7 rounded-xs shadow-2xs" />
                <HipercardLogo className="h-4 w-7 rounded-xs shadow-2xs" />
              </div>
            </div>
          </div>

          <Switch
            checked={state.acceptCard}
            onCheckedChange={(checked) => onChange({ ...state, acceptCard: checked })}
            aria-label="Ativar ou desativar Cartão de Crédito e Débito"
            activeTrackColor="bg-[#2E4233] dark:bg-emerald-500"
            className="shrink-0"
          />
        </div>
      </div>

      {/* 3. CARD DINHEIRO EM ESPÉCIE */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          state.acceptCash
            ? "bg-[#F8F6EF] dark:bg-[#233127] border-[#E2DDD0] dark:border-[#2F4234] shadow-xs"
            : "bg-[#FAF7F0] dark:bg-[#1E2B22] border-[#E5DFD1]/60 dark:border-[#2A382E]/60 opacity-70"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Banknote className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-[#1A241E] dark:text-[#F2EFE9]">
                Dinheiro em Espécie
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pagamento físico realizado na entrega ou retirada no balcão.
              </p>
            </div>
          </div>

          <Switch
            checked={state.acceptCash}
            onCheckedChange={(checked) => onChange({ ...state, acceptCash: checked })}
            aria-label="Ativar ou desativar Dinheiro em Espécie"
            activeTrackColor="bg-[#2E4233] dark:bg-emerald-500"
            className="shrink-0"
          />
        </div>
      </div>
    </div>
  );
}
