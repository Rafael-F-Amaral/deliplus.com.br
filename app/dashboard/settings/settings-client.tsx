"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Store,
  Truck,
  CreditCard,
  BellRing,
  Award,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Save,
  Volume2,
  Printer,
  Clock,
  Sparkles,
  Camera,
  MapPin,
  Phone,
  FileText,
  DollarSign,
  QrCode,
  ShieldCheck,
  Check,
} from "lucide-react";
import {
  BusinessHours,
  PrinterSettings,
  StoreSettingsData,
} from "./types";
import {
  updateStoreProfile,
  updateDeliverySettings,
  updatePaymentSettings,
  updatePrinterSettings,
  toggleStoreOpenStatus,
  uploadStoreAsset,
} from "./actions";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const CATEGORIES = [
  "Restaurante Geral",
  "Pizzaria",
  "Hamburgueria",
  "Comida Japonesa",
  "Pastelaria",
  "Açaí & Sorvetes",
  "Doceria & Bolos",
  "Marmitaria / Prato Feito",
  "Churrascaria & Carnes",
  "Bebidas & Distribuidora",
  "Lanchonete & Salgados",
  "Cafeteria & Padaria",
  "Comida Saudável / Fit",
];

const WEEK_DAYS: { key: keyof BusinessHours; label: string }[] = [
  { key: "seg", label: "Segunda" },
  { key: "ter", label: "Terça" },
  { key: "qua", label: "Quarta" },
  { key: "qui", label: "Quinta" },
  { key: "sex", label: "Sexta" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
];

export default function SettingsClient({
  initialData,
}: {
  initialData: StoreSettingsData;
}) {
  const [activeTab, setActiveTab] = useState<
    "profile" | "delivery" | "payment" | "printer" | "plan"
  >("profile");

  // Feedback states
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  // Perfil da Loja
  const [storeName, setStoreName] = useState(initialData.store.name);
  const [bio, setBio] = useState(initialData.delivery.bio || "");
  const [category, setCategory] = useState(
    initialData.delivery.category || "Restaurante Geral"
  );
  const [phone, setPhone] = useState(initialData.delivery.phone || "");
  const [instagram, setInstagram] = useState(
    initialData.delivery.instagram || ""
  );
  const [address, setAddress] = useState(initialData.delivery.address || "");
  const [logoUrl, setLogoUrl] = useState<string | null>(
    initialData.delivery.logo_url
  );
  const [bannerUrl, setBannerUrl] = useState<string | null>(
    initialData.delivery.banner_url
  );

  // Delivery & Operação
  const [isOpen, setIsOpen] = useState(
    initialData.delivery.is_open_override ?? true
  );
  const [acceptsDelivery, setAcceptsDelivery] = useState(
    initialData.delivery.accepts_delivery
  );
  const [acceptsPickup, setAcceptsPickup] = useState(
    initialData.delivery.accepts_pickup
  );
  const [prepMin, setPrepMin] = useState(
    initialData.delivery.default_prep_min.toString()
  );
  const [prepMax, setPrepMax] = useState(
    initialData.delivery.default_prep_max.toString()
  );
  const [minOrder, setMinOrder] = useState(
    (initialData.delivery.min_order_cents / 100).toFixed(2).replace(".", ",")
  );
  const [deliveryFee, setDeliveryFee] = useState(
    (initialData.delivery.delivery_fee_cents / 100).toFixed(2).replace(".", ",")
  );
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState(
    initialData.delivery.free_delivery_above_cents
      ? (initialData.delivery.free_delivery_above_cents / 100)
          .toFixed(2)
          .replace(".", ",")
      : ""
  );
  const [businessHours, setBusinessHours] = useState<BusinessHours>(
    initialData.delivery.business_hours
  );

  // Pagamentos & Pix
  const [pixKey, setPixKey] = useState(initialData.delivery.pix_key || "");
  const [pixKeyType, setPixKeyType] = useState(
    initialData.delivery.pix_key_type || "cpf"
  );
  const [acceptCash, setAcceptCash] = useState(
    initialData.delivery.accept_cash
  );
  const [needChangeOption, setNeedChangeOption] = useState(
    initialData.delivery.need_change_option
  );
  const [acceptCard, setAcceptCard] = useState(
    initialData.delivery.accept_card
  );
  const [acceptPix, setAcceptPix] = useState(initialData.delivery.accept_pix);
  const [acceptMealVoucher, setAcceptMealVoucher] = useState(
    initialData.delivery.accept_meal_voucher
  );

  // Alertas & Impressão
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(
    initialData.delivery.printer_settings
  );

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const parseCurrencyInput = (val: string): number => {
    const clean = val.replace(/[^\d,.-]/g, "").replace(",", ".");
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : Math.round(num * 100);
  };

  const playTestAlertSound = () => {
    try {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880.0, ctx.currentTime + 0.18);
      gain2.gain.setValueAtTime(0.4, ctx.currentTime + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.18);
      osc2.stop(ctx.currentTime + 0.6);

      showToast("Alerta sonoro testado! 🔔");
    } catch (e) {
      console.warn("Falha ao tocar som Web Audio:", e);
    }
  };

  const checklist = [
    { label: "Nome da loja", ok: !!storeName.trim() },
    { label: "Categoria culinária", ok: !!category.trim() },
    { label: "WhatsApp de atendimento", ok: !!phone.trim() },
    { label: "Endereço físico", ok: !!address.trim() },
    { label: "Chave Pix cadastrada", ok: !!pixKey.trim() },
    { label: "Regras de delivery", ok: acceptsDelivery || acceptsPickup },
    { label: "Horários de atendimento", ok: true },
    { label: "Logo da loja", ok: !!logoUrl },
  ];
  const completedCount = checklist.filter((item) => item.ok).length;
  const healthPercent = Math.round((completedCount / checklist.length) * 100);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const res = await updateStoreProfile({
      name: storeName,
      bio,
      category,
      phone,
      instagram,
      address,
      logo_url: logoUrl,
      banner_url: bannerUrl,
    });
    setIsSaving(false);

    if (res.success) {
      showToast("Perfil da loja salvo com sucesso!");
    } else {
      showToast(res.error || "Erro ao salvar perfil.", "error");
    }
  };

  const handleSaveDelivery = async () => {
    setIsSaving(true);
    const minOrderCents = parseCurrencyInput(minOrder);
    const deliveryFeeCents = parseCurrencyInput(deliveryFee);
    const freeDeliveryCents = freeDeliveryAbove
      ? parseCurrencyInput(freeDeliveryAbove)
      : null;

    const res = await updateDeliverySettings({
      is_open_override: isOpen,
      accepts_delivery: acceptsDelivery,
      accepts_pickup: acceptsPickup,
      min_order_cents: minOrderCents,
      delivery_fee_cents: deliveryFeeCents,
      free_delivery_above_cents: freeDeliveryCents,
      default_prep_min: parseInt(prepMin, 10) || 30,
      default_prep_max: parseInt(prepMax, 10) || 50,
      business_hours: businessHours,
    });
    setIsSaving(false);

    if (res.success) {
      showToast("Regras de entrega e horários salvas!");
    } else {
      showToast(res.error || "Erro ao salvar entrega.", "error");
    }
  };

  const handleToggleStoreStatus = async (newStatus: boolean) => {
    setIsOpen(newStatus);
    const res = await toggleStoreOpenStatus(newStatus);
    if (res.success) {
      showToast(
        newStatus ? "Loja aberta para pedidos! 🟢" : "Loja fechada temporariamente! 🔴"
      );
    } else {
      setIsOpen(!newStatus);
      showToast(res.error || "Erro ao alternar status.", "error");
    }
  };

  const handleSavePayment = async () => {
    setIsSaving(true);
    const res = await updatePaymentSettings({
      pix_key: pixKey,
      pix_key_type: pixKeyType,
      accept_cash: acceptCash,
      need_change_option: needChangeOption,
      accept_card: acceptCard,
      accept_pix: acceptPix,
      accept_meal_voucher: acceptMealVoucher,
    });
    setIsSaving(false);

    if (res.success) {
      showToast("Formas de pagamento e chave Pix salvas!");
    } else {
      showToast(res.error || "Erro ao salvar pagamentos.", "error");
    }
  };

  const handleSavePrinter = async () => {
    setIsSaving(true);
    const res = await updatePrinterSettings(printerSettings);
    setIsSaving(false);

    if (res.success) {
      showToast("Preferências de comanda salvas!");
    } else {
      showToast(res.error || "Erro ao salvar impressora.", "error");
    }
  };

  const handleUploadImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "banner"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    showToast(`Enviando ${type === "logo" ? "logo" : "capa"}...`);
    const res = await uploadStoreAsset(formData);
    if (res.success && res.url) {
      if (type === "logo") setLogoUrl(res.url);
      else setBannerUrl(res.url);
      showToast(
        `${type === "logo" ? "Logo" : "Capa"} carregada! Clique em Salvar para confirmar.`
      );
    } else {
      showToast(res.error || "Erro no upload da imagem.", "error");
    }
  };

  const publicUrl = `/${initialData.store.slug}`;

  return (
    <div className="w-full max-w-7xl mx-auto p-3.5 sm:p-5 flex flex-col gap-3.5">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-xl shadow-lg border transition-all text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 ${
            toastMessage.type === "success"
              ? "bg-[#2E4233] text-white border-[#2E4233]"
              : "bg-red-600 text-white border-red-700"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Barra Superior Unificada: Abas + Ações Rápidas (Sem o header grande que ocupava espaço) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#E9E4D4] pb-1.5">
        {/* Abas de Navegação */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === "profile"
                ? "border-[#CB5A3C] text-[#CB5A3C] bg-white shadow-2xs"
                : "border-transparent text-[#637267] hover:text-[#2E4233] hover:bg-white/60"
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Perfil da Loja</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("delivery")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === "delivery"
                ? "border-[#CB5A3C] text-[#CB5A3C] bg-white shadow-2xs"
                : "border-transparent text-[#637267] hover:text-[#2E4233] hover:bg-white/60"
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Delivery & Horários</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("payment")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === "payment"
                ? "border-[#CB5A3C] text-[#CB5A3C] bg-white shadow-2xs"
                : "border-transparent text-[#637267] hover:text-[#2E4233] hover:bg-white/60"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Pagamentos & Pix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("printer")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === "printer"
                ? "border-[#CB5A3C] text-[#CB5A3C] bg-white shadow-2xs"
                : "border-transparent text-[#637267] hover:text-[#2E4233] hover:bg-white/60"
            }`}
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Alertas & Comandas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("plan")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === "plan"
                ? "border-[#CB5A3C] text-[#CB5A3C] bg-white shadow-2xs"
                : "border-transparent text-[#637267] hover:text-[#2E4233] hover:bg-white/60"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Plano & DeliPlus</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-[#CB5A3C]/10 text-[#CB5A3C]">
              {healthPercent}%
            </span>
          </button>
        </div>

        {/* Ações Rápidas Direitas */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={() => handleToggleStoreStatus(!isOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              isOpen
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
            }`}
            title="Clique para abrir ou fechar a loja para pedidos"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOpen ? "bg-emerald-500 animate-pulse" : "bg-red-500"
              }`}
            />
            <span>{isOpen ? "Loja Aberta" : "Loja Fechada"}</span>
          </button>

          <Link
            href={publicUrl}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-[#2E4233] border border-[#E9E4D4] hover:bg-[#FAF8F0] transition-colors cursor-pointer"
          >
            <span>Ver Vitrine</span>
            <ExternalLink className="w-3 h-3 text-[#637267]" />
          </Link>
        </div>
      </div>

      {/* Conteúdo das Abas em Grid Equilibrado (Sem Scrollbar Vertical) */}
      <div>
        {/* ============================================================ */}
        {/* ABA 1: PERFIL DA LOJA (2 Colunas Preenchendo a Largura)     */}
        {/* ============================================================ */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch animate-in fade-in duration-150">
            {/* Coluna Esquerda: Identidade Visual & Vitrine (lg:col-span-5) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E9E4D4] p-4 shadow-2xs flex flex-col justify-between gap-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#CB5A3C]" />
                    <span>Identidade Visual</span>
                  </h2>
                  <span className="text-[11px] text-[#637267]">
                    {initialData.store.name}
                  </span>
                </div>

                {/* Banner de Capa com Logo Sobreposta */}
                <div className="relative rounded-xl overflow-hidden border border-[#E9E4D4] bg-linear-to-r from-[#2E4233] to-[#1e2c22] h-28 sm:h-32 flex items-center justify-center">
                  {bannerUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={bannerUrl}
                      alt="Banner de Capa"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-white/60 text-[11px] flex flex-col items-center gap-1">
                      <Camera className="w-5 h-5" />
                      <span>Sem banner de capa</span>
                    </div>
                  )}

                  <label className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/80 text-white text-[11px] font-bold cursor-pointer transition-colors backdrop-blur-xs flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    <span>Alterar Capa</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUploadImage(e, "banner")}
                    />
                  </label>

                  {/* Logo Redonda Sobreposta */}
                  <div className="absolute -bottom-1.5 left-4 translate-y-1/4 w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border-2 border-white bg-[#FAF8F0] shadow-sm overflow-hidden flex items-center justify-center group">
                    {logoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="w-6 h-6 text-gray-400" />
                    )}
                    <label className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="w-4 h-4 mb-0.5" />
                      <span className="text-[9px] font-bold">Trocar Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleUploadImage(e, "logo")}
                      />
                    </label>
                  </div>
                </div>

                {/* Link da Vitrine com Botão Copiar */}
                <div className="pt-4 space-y-1">
                  <label className="text-[11px] font-bold text-[#2E4233] block">
                    Link Compartilhável da Vitrine
                  </label>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 px-3 py-1.5 rounded-lg bg-[#FAF8F0] border border-[#E9E4D4] text-xs font-semibold text-[#2E4233] truncate">
                      deliplus.com.br{publicUrl}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          navigator.clipboard.writeText(
                            `${window.location.origin}${publicUrl}`
                          );
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                          showToast("Link da vitrine copiado!");
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E9E4D4] text-xs font-bold text-[#2E4233] hover:text-[#CB5A3C] hover:border-[#CB5A3C] transition-colors cursor-pointer flex items-center gap-1"
                      title="Copiar link da vitrine"
                    >
                      {copiedLink ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedLink ? "Copiado" : "Copiar"}</span>
                    </button>
                  </div>
                </div>

                {/* Slogan / Biografia da Loja */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#2E4233] block">
                    Biografia / Slogan Curto
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Ex: O melhor hambúrguer artesanal defumado no fogo à lenha da região."
                    className="w-full px-3 py-1.5 rounded-xl border border-[#E9E4D4] text-xs text-[#111827] focus:outline-none focus:border-[#CB5A3C] transition-all bg-[#FAF8F0]/30 resize-none"
                  />
                </div>
              </div>

              <div className="text-[10px] text-[#637267] pt-2 border-t border-[#ECEAE2]">
                Dica: Logo quadrada (500x500px) e Capa horizontal (1200x400px).
              </div>
            </div>

            {/* Coluna Direita: Dados do Estabelecimento (lg:col-span-7) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E9E4D4] p-4 shadow-2xs flex flex-col justify-between gap-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#CB5A3C]" />
                    <span>Dados do Estabelecimento</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Nome da Loja */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#2E4233]">
                      Nome de Exibição <span className="text-[#CB5A3C]">*</span>
                    </label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Ex: Pizzaria Forno Nobre"
                      className="w-full px-3 py-1.5 rounded-xl border border-[#E9E4D4] text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#CB5A3C] transition-all bg-[#FAF8F0]/30"
                    />
                  </div>

                  {/* Categoria */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#2E4233]">
                      Segmento / Categoria
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-[#E9E4D4] text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#CB5A3C] transition-all bg-[#FAF8F0]/30"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#2E4233] flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>WhatsApp de Atendimento</span>
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full px-3 py-1.5 rounded-xl border border-[#E9E4D4] text-xs text-[#111827] focus:outline-none focus:border-[#CB5A3C] transition-all bg-[#FAF8F0]/30"
                    />
                  </div>

                  {/* Instagram */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#2E4233] flex items-center gap-1">
                      <InstagramIcon className="w-3 h-3 text-pink-600" />
                      <span>Instagram Oficial</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">
                        @
                      </span>
                      <input
                        type="text"
                        value={instagram.replace(/^@/, "")}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="sualoja.oficial"
                        className="w-full pl-7 pr-3 py-1.5 rounded-xl border border-[#E9E4D4] text-xs text-[#111827] focus:outline-none focus:border-[#CB5A3C] transition-all bg-[#FAF8F0]/30"
                      />
                    </div>
                  </div>

                  {/* Endereço */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-bold text-[#2E4233] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-500" />
                      <span>Endereço Físico Completo</span>
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ex: Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
                      className="w-full px-3 py-1.5 rounded-xl border border-[#E9E4D4] text-xs text-[#111827] focus:outline-none focus:border-[#CB5A3C] transition-all bg-[#FAF8F0]/30"
                    />
                  </div>
                </div>
              </div>

              {/* Botão Salvar Perfil */}
              <div className="pt-2 border-t border-[#ECEAE2] flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#CB5A3C] text-white text-xs font-bold hover:bg-[#b04b30] shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Salvando..." : "Salvar Perfil da Loja"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ABA 2: DELIVERY & HORÁRIOS (2 Colunas Equilibradas)         */}
        {/* ============================================================ */}
        {activeTab === "delivery" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch animate-in fade-in duration-150">
            {/* Coluna Esquerda: Modalidades e Taxas (lg:col-span-6) */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E9E4D4] p-4 shadow-2xs flex flex-col justify-between gap-3">
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#CB5A3C]" />
                  <span>Modalidades e Regras de Entrega</span>
                </h2>

                {/* Switches de Modalidades */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-[#E9E4D4] bg-[#FAF8F0]/40 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-[#CB5A3C]">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#111827] block">
                          Delivery
                        </span>
                        <span className="text-[10px] text-[#637267]">
                          Entrega até o cliente
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={acceptsDelivery}
                      onChange={(e) => setAcceptsDelivery(e.target.checked)}
                      className="w-4 h-4 accent-[#CB5A3C] rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-[#E9E4D4] bg-[#FAF8F0]/40 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#111827] block">
                          Retirada no Balcão
                        </span>
                        <span className="text-[10px] text-[#637267]">
                          Cliente retira na loja
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={acceptsPickup}
                      onChange={(e) => setAcceptsPickup(e.target.checked)}
                      className="w-4 h-4 accent-[#CB5A3C] rounded cursor-pointer"
                    />
                  </label>
                </div>

                {/* Prazos e Taxas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#2E4233] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#CB5A3C]" />
                      <span>Tempo Mín.</span>
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={prepMin}
                      onChange={(e) => setPrepMin(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-[#E9E4D4] text-xs font-bold text-[#111827] bg-[#FAF8F0]/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#2E4233] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#CB5A3C]" />
                      <span>Tempo Máx.</span>
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="240"
                      value={prepMax}
                      onChange={(e) => setPrepMax(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-[#E9E4D4] text-xs font-bold text-[#111827] bg-[#FAF8F0]/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#2E4233] flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-emerald-600" />
                      <span>Taxa Entrega</span>
                    </label>
                    <input
                      type="text"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value)}
                      placeholder="5,00"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-[#E9E4D4] text-xs font-bold text-[#111827] bg-[#FAF8F0]/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#2E4233] flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-[#CB5A3C]" />
                      <span>Pedido Mín.</span>
                    </label>
                    <input
                      type="text"
                      value={minOrder}
                      onChange={(e) => setMinOrder(e.target.value)}
                      placeholder="20,00"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-[#E9E4D4] text-xs font-bold text-[#111827] bg-[#FAF8F0]/30"
                    />
                  </div>

                  <div className="space-y-1 col-span-2 sm:col-span-4">
                    <label className="text-[11px] font-bold text-[#2E4233] flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Frete Grátis a partir de (R$)</span>
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Opcional
                      </span>
                    </label>
                    <input
                      type="text"
                      value={freeDeliveryAbove}
                      onChange={(e) => setFreeDeliveryAbove(e.target.value)}
                      placeholder="Ex: 80,00"
                      className="w-full px-3 py-1.5 rounded-xl border border-[#E9E4D4] text-xs font-bold text-[#111827] bg-[#FAF8F0]/30"
                    />
                  </div>
                </div>
              </div>

              {/* Botão Salvar Delivery */}
              <div className="pt-2 border-t border-[#ECEAE2] flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveDelivery}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#CB5A3C] text-white text-xs font-bold hover:bg-[#b04b30] shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Salvando..." : "Salvar Regras de Entrega"}</span>
                </button>
              </div>
            </div>

            {/* Coluna Direita: Grade Semanal de Funcionamento (lg:col-span-6) */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E9E4D4] p-4 shadow-2xs flex flex-col justify-between gap-2.5">
              <div>
                <h2 className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Clock className="w-3.5 h-3.5 text-[#CB5A3C]" />
                  <span>Grade Semanal de Funcionamento</span>
                </h2>

                <div className="space-y-1.5 divide-y divide-[#ECEAE2]">
                  {WEEK_DAYS.map(({ key, label }) => {
                    const day = businessHours[key] || {
                      open: "18:00",
                      close: "23:00",
                      enabled: true,
                    };
                    return (
                      <div
                        key={key}
                        className="pt-1.5 first:pt-0 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setBusinessHours((prev) => ({
                                ...prev,
                                [key]: { ...day, enabled: !day.enabled },
                              }));
                            }}
                            className={`w-7 h-4 rounded-full transition-colors relative cursor-pointer ${
                              day.enabled ? "bg-emerald-500" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${
                                day.enabled ? "left-3.5" : "left-0.5"
                              }`}
                            />
                          </button>
                          <span
                            className={`font-bold ${
                              day.enabled ? "text-[#111827]" : "text-gray-400"
                            }`}
                          >
                            {label}
                          </span>
                        </div>

                        {day.enabled ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#2E4233]">
                            <input
                              type="time"
                              value={day.open}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBusinessHours((prev) => ({
                                  ...prev,
                                  [key]: { ...day, open: val },
                                }));
                              }}
                              className="px-2 py-0.5 rounded-lg border border-[#E9E4D4] bg-[#FAF8F0]/50 text-xs font-bold"
                            />
                            <span>às</span>
                            <input
                              type="time"
                              value={day.close}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBusinessHours((prev) => ({
                                  ...prev,
                                  [key]: { ...day, close: val },
                                }));
                              }}
                              className="px-2 py-0.5 rounded-lg border border-[#E9E4D4] bg-[#FAF8F0]/50 text-xs font-bold"
                            />
                          </div>
                        ) : (
                          <span className="text-[11px] font-semibold text-gray-400 italic">
                            Fechado
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-[10px] text-[#637267] pt-2 border-t border-[#ECEAE2]">
                Fora desses horários, a loja recusa pedidos automaticamente na vitrine.
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ABA 3: PAGAMENTOS & PIX (2 Colunas Equilibradas)             */}
        {/* ============================================================ */}
        {activeTab === "payment" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch animate-in fade-in duration-150">
            {/* Coluna Esquerda: Chave Pix (lg:col-span-5) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E9E4D4] p-4 shadow-2xs flex flex-col justify-between gap-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Chave Pix da Loja</span>
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold">
                    Recebimento Direto
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#2E4233]">
                      Tipo de Chave Pix
                    </label>
                    <select
                      value={pixKeyType}
                      onChange={(e) => setPixKeyType(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-[#E9E4D4] text-xs font-semibold text-[#111827] bg-[#FAF8F0]/30"
                    >
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="phone">Celular</option>
                      <option value="email">E-mail</option>
                      <option value="random">Chave Aleatória (EVP)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#2E4233]">
                      Valor da Chave Pix
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={pixKey}
                        onChange={(e) => setPixKey(e.target.value)}
                        placeholder="Ex: 123.456.789-00 ou pix@sualoja.com"
                        className="w-full pl-3 pr-20 py-1.5 rounded-xl border border-[#E9E4D4] text-xs font-bold text-[#111827] focus:outline-none focus:border-[#CB5A3C] bg-[#FAF8F0]/30"
                      />
                      {pixKey && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(pixKey);
                            setCopiedPix(true);
                            setTimeout(() => setCopiedPix(false), 2000);
                            showToast("Chave Pix copiada!");
                          }}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg bg-white border border-[#E9E4D4] text-[10px] font-bold text-[#2E4233] hover:text-[#CB5A3C] transition-colors cursor-pointer flex items-center gap-1"
                        >
                          {copiedPix ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedPix ? "Copiada" : "Copiar"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-[#637267] pt-2 border-t border-[#ECEAE2]">
                O cliente copia esta chave ou escaneia o QR Code no checkout para pagar diretamente.
              </div>
            </div>

            {/* Coluna Direita: Formas de Pagamento (lg:col-span-7) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E9E4D4] p-4 shadow-2xs flex flex-col justify-between gap-3">
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#CB5A3C]" />
                  <span>Formas de Pagamento na Entrega / Balcão</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-[#E9E4D4] bg-[#FAF8F0]/30 cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-[#111827] block">
                        Pix no Pedido
                      </span>
                      <span className="text-[10px] text-[#637267]">
                        Chave e QR Code
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={acceptPix}
                      onChange={(e) => setAcceptPix(e.target.checked)}
                      className="w-4 h-4 accent-[#CB5A3C] rounded cursor-pointer"
                    />
                  </label>

                  <div className="p-2.5 rounded-xl border border-[#E9E4D4] bg-[#FAF8F0]/30 space-y-1">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-xs font-bold text-[#111827] block">
                          Dinheiro
                        </span>
                        <span className="text-[10px] text-[#637267]">
                          Pago na entrega
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={acceptCash}
                        onChange={(e) => setAcceptCash(e.target.checked)}
                        className="w-4 h-4 accent-[#CB5A3C] rounded cursor-pointer"
                      />
                    </label>
                    {acceptCash && (
                      <label className="flex items-center gap-1.5 text-[10px] font-semibold text-[#637267] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={needChangeOption}
                          onChange={(e) => setNeedChangeOption(e.target.checked)}
                          className="w-3 h-3 accent-[#CB5A3C] rounded cursor-pointer"
                        />
                        <span>Perguntar se precisa de troco</span>
                      </label>
                    )}
                  </div>

                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-[#E9E4D4] bg-[#FAF8F0]/30 cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-[#111827] block">
                        Cartão de Crédito
                      </span>
                      <span className="text-[10px] text-[#637267]">
                        Maquininha na entrega
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={acceptCard}
                      onChange={(e) => setAcceptCard(e.target.checked)}
                      className="w-4 h-4 accent-[#CB5A3C] rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-[#E9E4D4] bg-[#FAF8F0]/30 cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-[#111827] block">
                        Vale-Refeição / Alimentação
                      </span>
                      <span className="text-[10px] text-[#637267]">
                        VR, Sodexo, Ticket, Alelo
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={acceptMealVoucher}
                      onChange={(e) => setAcceptMealVoucher(e.target.checked)}
                      className="w-4 h-4 accent-[#CB5A3C] rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Botão Salvar Pagamento */}
              <div className="pt-2 border-t border-[#ECEAE2] flex justify-end">
                <button
                  type="button"
                  onClick={handleSavePayment}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#CB5A3C] text-white text-xs font-bold hover:bg-[#b04b30] shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Salvando..." : "Salvar Formas de Pagamento"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ABA 4: ALERTAS & COMANDAS (2 Colunas Equilibradas)          */}
        {/* ============================================================ */}
        {activeTab === "printer" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch animate-in fade-in duration-150">
            {/* Coluna Esquerda: Alerta Sonoro (lg:col-span-5) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E9E4D4] p-4 shadow-2xs flex flex-col justify-between gap-3">
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-[#CB5A3C]" />
                  <span>Aviso Sonoro de Pedido</span>
                </h2>

                <label className="flex items-center justify-between p-3 rounded-xl border border-[#E9E4D4] bg-[#FAF8F0]/30 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-[#111827] block">
                      Tocar campainha ao chegar pedido
                    </span>
                    <span className="text-[10px] text-[#637267]">
                      Alerta em tempo real no dashboard
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={printerSettings.sound_alerts}
                    onChange={(e) =>
                      setPrinterSettings((prev) => ({
                        ...prev,
                        sound_alerts: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 accent-[#CB5A3C] rounded cursor-pointer"
                  />
                </label>

                <button
                  type="button"
                  onClick={playTestAlertSound}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#FAF8F0] border border-[#E9E4D4] text-xs font-bold text-[#2E4233] hover:text-[#CB5A3C] hover:border-[#CB5A3C] transition-colors cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-[#CB5A3C]" />
                  <span>Testar Alarme Sonoro Agora</span>
                </button>
              </div>

              <div className="text-[10px] text-[#637267] pt-2 border-t border-[#ECEAE2]">
                O som é sintetizado diretamente no navegador, funcionando instantaneamente sem atrasos.
              </div>
            </div>

            {/* Coluna Direita: Impressão Térmica (lg:col-span-7) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E9E4D4] p-4 shadow-2xs flex flex-col justify-between gap-3">
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-[#CB5A3C]" />
                  <span>Impressão de Comanda para Cozinha & Balcão</span>
                </h2>

                {/* Auto-print switch */}
                <label className="flex items-center justify-between p-2.5 rounded-xl border border-[#E9E4D4] bg-[#FAF8F0]/30 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-[#111827] block">
                      Abrir tela de impressão ao aceitar pedido
                    </span>
                    <span className="text-[10px] text-[#637267]">
                      Dispara a impressão imediata da comanda
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={printerSettings.auto_print}
                    onChange={(e) =>
                      setPrinterSettings((prev) => ({
                        ...prev,
                        auto_print: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 accent-[#CB5A3C] rounded cursor-pointer"
                  />
                </label>

                {/* Largura de Bobina e Vias */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#2E4233]">
                      Largura da Bobina
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setPrinterSettings((prev) => ({
                            ...prev,
                            paper_width: "80mm",
                          }))
                        }
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          printerSettings.paper_width === "80mm"
                            ? "border-[#CB5A3C] bg-orange-50/40 ring-1 ring-[#CB5A3C]"
                            : "border-[#E9E4D4] bg-[#FAF8F0]/30"
                        }`}
                      >
                        <span className="text-xs font-bold text-[#111827] block">
                          80 mm
                        </span>
                        <span className="text-[9px] text-[#637267]">Padrão</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPrinterSettings((prev) => ({
                            ...prev,
                            paper_width: "58mm",
                          }))
                        }
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          printerSettings.paper_width === "58mm"
                            ? "border-[#CB5A3C] bg-orange-50/40 ring-1 ring-[#CB5A3C]"
                            : "border-[#E9E4D4] bg-[#FAF8F0]/30"
                        }`}
                      >
                        <span className="text-xs font-bold text-[#111827] block">
                          58 mm
                        </span>
                        <span className="text-[9px] text-[#637267]">Mini</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#2E4233]">
                      Número de Vias
                    </label>
                    <select
                      value={printerSettings.copies}
                      onChange={(e) =>
                        setPrinterSettings((prev) => ({
                          ...prev,
                          copies: parseInt(e.target.value, 10) || 1,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#E9E4D4] text-xs font-bold text-[#111827] bg-[#FAF8F0]/30"
                    >
                      <option value={1}>1 Via (Apenas Cozinha)</option>
                      <option value={2}>2 Vias (Cozinha + Motoboy)</option>
                      <option value={3}>3 Vias (Cozinha + Balcão + Motoboy)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Botão Salvar Impressora */}
              <div className="pt-2 border-t border-[#ECEAE2] flex justify-end">
                <button
                  type="button"
                  onClick={handleSavePrinter}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#CB5A3C] text-white text-xs font-bold hover:bg-[#b04b30] shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Salvando..." : "Salvar Impressão"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ABA 5: PLANO & DELIPLUS (2 Colunas Equilibradas)             */}
        {/* ============================================================ */}
        {activeTab === "plan" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch animate-in fade-in duration-150">
            {/* Coluna Esquerda: Assinatura Ativa (lg:col-span-5) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E9E4D4] p-4 shadow-2xs flex flex-col justify-between gap-3">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#637267] uppercase tracking-wider">
                    Plano Ativo
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#2E4233] text-white text-[10px] font-black">
                    {initialData.billing?.planName || "Essencial"}
                  </span>
                </div>
                <h3 className="text-base font-black text-[#111827]">
                  DeliPlus Assinatura
                </h3>
                <p className="text-xs text-[#637267]">
                  Capacidade: {initialData.billing?.activeStoresCount || 1} de{" "}
                  {initialData.billing?.maxStores || 1} loja ativa permitida.
                </p>
              </div>

              <div className="pt-2 border-t border-[#ECEAE2]">
                <Link
                  href="/dashboard/billing"
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#2E4233] text-white text-xs font-bold hover:bg-[#233327] transition-colors cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Gerenciar Assinatura & Faturas</span>
                </Link>
              </div>
            </div>

            {/* Coluna Direita: Diagnóstico e Checklist (lg:col-span-7) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E9E4D4] p-4 shadow-2xs flex flex-col justify-between gap-3">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Diagnóstico de Prontidão da Loja</span>
                  </h2>
                  <span className="text-base font-black text-[#CB5A3C]">
                    {healthPercent}% Concluído
                  </span>
                </div>

                {/* Barra de Progresso */}
                <div className="w-full h-2 rounded-full bg-[#FAF8F0] border border-[#E9E4D4] overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-emerald-500 to-[#059669] transition-all duration-300 rounded-full"
                    style={{ width: `${healthPercent}%` }}
                  />
                </div>

                {/* Grid Compacto do Checklist */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {checklist.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-1.5 p-2 rounded-lg border text-[11px] font-bold ${
                        item.ok
                          ? "bg-emerald-50/50 border-emerald-200 text-emerald-900"
                          : "bg-gray-50 border-gray-200 text-gray-500"
                      }`}
                    >
                      {item.ok ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      )}
                      <span className="truncate">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-[#637267] pt-2 border-t border-[#ECEAE2]">
                Complete todos os itens para oferecer a melhor experiência na sua vitrine.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
