"use client";

import React, { useState } from "react";
import Link from "next/link";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
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
  Download,
  X,
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
  { key: "seg", label: "Segunda-feira" },
  { key: "ter", label: "Terça-feira" },
  { key: "qua", label: "Quarta-feira" },
  { key: "qui", label: "Quinta-feira" },
  { key: "sex", label: "Sexta-feira" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
];

export default function SettingsClient({
  initialData,
}: {
  initialData: StoreSettingsData;
}) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "schedule" | "payment" | "printer" | "plan"
  >("overview");

  // Feedback states
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Perfil da Loja
  const [storeName, setStoreName] = useState(initialData.store.name);
  const [bio, setBio] = useState(
    initialData.delivery.bio ||
      "Os melhores sabores preparados com ingredientes selecionados e entrega rápida na sua casa."
  );
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
    { label: "Nome do estabelecimento", ok: !!storeName.trim() },
    { label: "Segmento culinário", ok: !!category.trim() },
    { label: "WhatsApp de atendimento", ok: !!phone.trim() },
    { label: "Endereço físico informado", ok: !!address.trim() },
    { label: "Chave Pix para recebimento", ok: !!pixKey.trim() },
    { label: "Regras de taxa e delivery", ok: acceptsDelivery || acceptsPickup },
    { label: "Logo oficial da loja", ok: !!logoUrl },
    { label: "Banner de capa da vitrine", ok: !!bannerUrl },
  ];
  const completedCount = checklist.filter((item) => item.ok).length;
  const healthPercent = Math.round((completedCount / checklist.length) * 100);

  // Ação mestre de salvar (Salva Perfil + Delivery + Pagamentos)
  const handleSaveAll = async () => {
    setIsSaving(true);
    const minOrderCents = parseCurrencyInput(minOrder);
    const deliveryFeeCents = parseCurrencyInput(deliveryFee);
    const freeDeliveryCents = freeDeliveryAbove
      ? parseCurrencyInput(freeDeliveryAbove)
      : null;

    const [resProfile, resDelivery, resPayment] = await Promise.all([
      updateStoreProfile({
        name: storeName,
        bio,
        category,
        phone,
        instagram,
        address,
        logo_url: logoUrl,
        banner_url: bannerUrl,
      }),
      updateDeliverySettings({
        is_open_override: isOpen,
        accepts_delivery: acceptsDelivery,
        accepts_pickup: acceptsPickup,
        min_order_cents: minOrderCents,
        delivery_fee_cents: deliveryFeeCents,
        free_delivery_above_cents: freeDeliveryCents,
        default_prep_min: parseInt(prepMin, 10) || 30,
        default_prep_max: parseInt(prepMax, 10) || 50,
        business_hours: businessHours,
      }),
      updatePaymentSettings({
        pix_key: pixKey,
        pix_key_type: pixKeyType,
        accept_cash: acceptCash,
        need_change_option: needChangeOption,
        accept_card: acceptCard,
        accept_pix: acceptPix,
        accept_meal_voucher: acceptMealVoucher,
      }),
    ]);

    setIsSaving(false);

    if (resProfile.success && resDelivery.success && resPayment.success) {
      showToast("Todas as configurações da loja foram salvas! 🎉");
    } else {
      showToast(
        resProfile.error || resDelivery.error || resPayment.error || "Erro ao salvar alterações.",
        "error"
      );
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
        `${type === "logo" ? "Logo" : "Capa"} carregada! Clique em Salvar Alterações para confirmar.`
      );
    } else {
      showToast(res.error || "Erro no upload da imagem.", "error");
    }
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById("store-qr-canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `qrcode-${initialData.store.slug}.png`;
    downloadLink.click();
    showToast("QR Code baixado com sucesso! 📥");
  };

  const publicUrl = `/${initialData.store.slug}`;
  const fullPublicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${publicUrl}`
      : `https://deliplus.com.br${publicUrl}`;

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 lg:p-6 flex flex-col gap-5 min-h-[calc(100vh-64px)]">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border transition-all text-xs font-bold animate-in fade-in slide-in-from-bottom-3 ${
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

      {/* Modal de Impressão da Placa de Balcão / Mesa */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E9E4D4] space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-[#ECEAE2]">
              <h3 className="font-black text-base text-[#111827]">
                Plaquinha de Balcão & Mesa
              </h3>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template da Plaquinha para Impressão */}
            <div
              id="printable-tent"
              className="p-6 rounded-2xl border-2 border-dashed border-[#CB5A3C] bg-[#FAF8F0] flex flex-col items-center text-center space-y-3"
            >
              <div className="w-12 h-12 rounded-full bg-white border border-[#E9E4D4] shadow-xs flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-6 h-6 text-[#2E4233]" />
                )}
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#CB5A3C] block">
                  Cardápio Digital Oficial
                </span>
                <h4 className="text-lg font-black text-[#111827]">{storeName}</h4>
              </div>

              <div className="p-3 bg-white rounded-xl shadow-xs border border-[#E9E4D4]">
                <QRCodeSVG value={fullPublicUrl} size={150} level="H" />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-[#2E4233]">
                  Aponte a câmera do seu celular
                </p>
                <p className="text-[11px] text-[#637267]">
                  Acesse nosso cardápio completo, veja fotos e faça seu pedido direto!
                </p>
                <span className="text-[10px] font-mono text-gray-400 block pt-1">
                  deliplus.com.br{publicUrl}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-3.5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#CB5A3C] text-white text-xs font-bold hover:bg-[#b04b30] shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Plaquinha</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Navegação e Ações Rápidas */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#E9E4D4] pb-2.5">
        {/* Abas */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "overview"
                ? "bg-[#2E4233] text-white shadow-xs"
                : "bg-white text-[#637267] border border-[#E9E4D4] hover:bg-[#FAF8F0]"
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Minha Vitrine & Perfil</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("schedule")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "schedule"
                ? "bg-[#2E4233] text-white shadow-xs"
                : "bg-white text-[#637267] border border-[#E9E4D4] hover:bg-[#FAF8F0]"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Horários da Semana</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("payment")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "payment"
                ? "bg-[#2E4233] text-white shadow-xs"
                : "bg-white text-[#637267] border border-[#E9E4D4] hover:bg-[#FAF8F0]"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Formas de Pagamento</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("printer")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "printer"
                ? "bg-[#2E4233] text-white shadow-xs"
                : "bg-white text-[#637267] border border-[#E9E4D4] hover:bg-[#FAF8F0]"
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Impressão & Cozinha</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("plan")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "plan"
                ? "bg-[#2E4233] text-white shadow-xs"
                : "bg-white text-[#637267] border border-[#E9E4D4] hover:bg-[#FAF8F0]"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Plano & Diagnóstico</span>
            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-[#CB5A3C] text-white">
              {healthPercent}%
            </span>
          </button>
        </div>

        {/* Ações Rápidas Direitas */}
        <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
          {/* Status Loja Aberta/Fechada */}
          <button
            type="button"
            onClick={() => handleToggleStoreStatus(!isOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              isOpen
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
            }`}
            title="Alternar entre loja aberta e fechada"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOpen ? "bg-emerald-500 animate-pulse" : "bg-red-500"
              }`}
            />
            <span>{isOpen ? "Loja Aberta" : "Loja Fechada"}</span>
          </button>

          {/* Ver Vitrine */}
          <Link
            href={publicUrl}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-[#2E4233] border border-[#E9E4D4] hover:bg-[#FAF8F0] transition-colors cursor-pointer"
          >
            <span>Ver Vitrine</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#637267]" />
          </Link>

          {/* Botão Mestre Salvar */}
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#CB5A3C] text-white text-xs font-bold hover:bg-[#b04b30] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Salvando..." : "Salvar Alterações"}</span>
          </button>
        </div>
      </div>

      {/* Canvas escondido para download do QR Code */}
      <div className="hidden">
        <QRCodeCanvas
          id="store-qr-canvas"
          value={fullPublicUrl}
          size={500}
          level="H"
          includeMargin={true}
        />
      </div>

      {/* ================================================================ */}
      {/* ABA 1: MINHA VITRINE & PERFIL                                    */}
      {/* ================================================================ */}
      {activeTab === "overview" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Bloco 1: Capa Panorâmica + Avatar da Loja Integrados */}
          <div className="bg-white rounded-2xl border border-[#E9E4D4] overflow-hidden shadow-2xs">
            {/* Capa */}
            <div className="relative h-28 sm:h-36 bg-linear-to-r from-[#2E4233] via-[#374f3d] to-[#1c2920] flex items-center justify-center overflow-hidden">
              {bannerUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={bannerUrl}
                  alt="Capa da Loja"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-white/40 text-xs flex items-center gap-2 font-medium">
                  <Camera className="w-5 h-5" />
                  <span>Clique em &ldquo;Alterar Capa&rdquo; para personalizar o topo da sua vitrine</span>
                </div>
              )}

              <label className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-bold cursor-pointer transition-colors backdrop-blur-xs flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                <span>Alterar Capa</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleUploadImage(e, "banner")}
                />
              </label>
            </div>

            {/* Barra de Perfil e Link Compartilhável */}
            <div className="p-4 sm:p-5 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex items-end gap-3.5 -mt-10 sm:-mt-12">
                {/* Avatar da Logo */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white bg-[#FAF8F0] shadow-md overflow-hidden flex items-center justify-center shrink-0 group">
                  {logoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="w-8 h-8 text-gray-400" />
                  )}
                  <label className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-4 h-4 mb-0.5" />
                    <span className="text-[10px] font-bold">Trocar</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUploadImage(e, "logo")}
                    />
                  </label>
                </div>

                {/* Nome e Categoria */}
                <div className="pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black text-[#111827]">
                      {storeName || "Nome do Estabelecimento"}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FAF8F0] border border-[#E9E4D4] text-[#CB5A3C] text-[11px] font-black uppercase tracking-wider">
                      {category}
                    </span>
                  </div>
                  <span className="text-xs text-[#637267] font-medium block">
                    Vitrine ativa: <strong className="text-[#2E4233]">deliplus.com.br{publicUrl}</strong>
                  </span>
                </div>
              </div>

              {/* Botões de Acesso Rápido */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(fullPublicUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                    showToast("Link da vitrine copiado!");
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E9E4D4] bg-[#FAF8F0] text-xs font-bold text-[#2E4233] hover:text-[#CB5A3C] hover:border-[#CB5A3C] transition-colors cursor-pointer"
                >
                  {copiedLink ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedLink ? "Copiado!" : "Copiar Link"}</span>
                </button>

                <Link
                  href={publicUrl}
                  target="_blank"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2E4233] text-white text-xs font-bold hover:bg-[#233327] transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver Vitrine</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Grade de 2 Colunas Balanceadas: Dados da Loja e Regras de Entrega */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 items-start">
            {/* ============================================================ */}
            {/* COLUNA 1: DADOS DO ESTABELECIMENTO & CANAIS DE ATENDIMENTO  */}
            {/* ============================================================ */}
            <div className="bg-white rounded-2xl border border-[#E9E4D4] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b pb-2.5 border-[#ECEAE2]">
                <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#CB5A3C]" />
                  <span>Dados do Estabelecimento & Canais</span>
                </h3>
                <span className="text-[11px] text-[#637267]">
                  Exibidos na sua vitrine pública
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome de Exibição */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#2E4233]">
                    Nome de Exibição na Vitrine <span className="text-[#CB5A3C]">*</span>
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Ex: Pizzaria Forno Nobre"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E9E4D4] text-xs sm:text-sm font-bold text-[#111827] focus:outline-none focus:border-[#CB5A3C] transition-all bg-[#FAF8F0]/30"
                  />
                </div>

                {/* Segmento / Categoria */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#2E4233]">
                    Segmento Gastronômico
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E9E4D4] text-xs sm:text-sm font-bold text-[#111827] focus:outline-none focus:border-[#CB5A3C] transition-all bg-[#FAF8F0]/30"
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
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#2E4233] flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp de Atendimento</span>
                    </label>
                    {phone && (
                      <a
                        href={`https://wa.me/55${phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-emerald-700 font-bold hover:underline"
                      >
                        Testar ↗
                      </a>
                    )}
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E9E4D4] text-xs sm:text-sm font-bold text-[#111827] focus:outline-none focus:border-[#CB5A3C] transition-all bg-[#FAF8F0]/30"
                  />
                </div>

                {/* Instagram */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#2E4233] flex items-center gap-1">
                    <InstagramIcon className="w-3.5 h-3.5 text-pink-600" />
                    <span>Instagram Oficial</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">
                      @
                    </span>
                    <input
                      type="text"
                      value={instagram.replace(/^@/, "")}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="sualoja.oficial"
                      className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-[#E9E4D4] text-xs sm:text-sm font-bold text-[#111827] focus:outline-none focus:border-[#CB5A3C] transition-all bg-[#FAF8F0]/30"
                    />
                  </div>
                </div>

                {/* Endereço Físico */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-[#2E4233] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>Endereço Físico (Ponto de Retirada / Cozinha)</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ex: Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E9E4D4] text-xs sm:text-sm font-medium text-[#111827] focus:outline-none focus:border-[#CB5A3C] transition-all bg-[#FAF8F0]/30"
                  />
                </div>

                {/* Bio / Slogan */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-[#2E4233] flex items-center justify-between">
                    <span>Biografia / Slogan da Vitrine</span>
                    <span className="text-[10px] text-gray-400">
                      {bio.length}/150 caracteres
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    maxLength={150}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Ex: Pizzas artesanais assadas em forno à lenha com ingredientes selecionados."
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E9E4D4] text-xs sm:text-sm text-[#111827] focus:outline-none focus:border-[#CB5A3C] transition-all bg-[#FAF8F0]/30 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* COLUNA 2: REGRAS OPERACIONAIS DE ENTREGA & TAXAS            */}
            {/* ============================================================ */}
            <div className="bg-white rounded-2xl border border-[#E9E4D4] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b pb-2.5 border-[#ECEAE2]">
                <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#CB5A3C]" />
                  <span>Regras de Entrega, Prazos & Pedido Mínimo</span>
                </h3>
                <span className="text-[11px] text-[#637267]">
                  Parâmetros de atendimento
                </span>
              </div>

              {/* CONTAINER 1: MODALIDADES DE ATENDIMENTO */}
              <div className="p-3.5 rounded-xl border border-[#E9E4D4] bg-[#FAF8F0]/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#2E4233] flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-[#CB5A3C]" />
                    <span>Modalidades de Pedido</span>
                  </span>
                  <span className="text-[10px] text-[#637267]">
                    Opções disponíveis ao cliente
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Delivery */}
                  <div
                    onClick={() => setAcceptsDelivery(!acceptsDelivery)}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      acceptsDelivery
                        ? "border-[#CB5A3C] bg-white shadow-xs"
                        : "border-gray-200 bg-gray-50/70 opacity-60 hover:opacity-80"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          acceptsDelivery
                            ? "bg-[#CB5A3C] text-white"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        <Truck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-[#111827]">
                            Delivery
                          </span>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                              acceptsDelivery
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {acceptsDelivery ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#637267] block truncate">
                          Entrega por motoboy
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={acceptsDelivery}
                      onChange={(e) => setAcceptsDelivery(e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 accent-[#CB5A3C] rounded cursor-pointer shrink-0"
                    />
                  </div>

                  {/* Retirada */}
                  <div
                    onClick={() => setAcceptsPickup(!acceptsPickup)}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      acceptsPickup
                        ? "border-emerald-600 bg-white shadow-xs"
                        : "border-gray-200 bg-gray-50/70 opacity-60 hover:opacity-80"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          acceptsPickup
                            ? "bg-[#2E4233] text-white"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        <Store className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-[#111827]">
                            Retirada
                          </span>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                              acceptsPickup
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {acceptsPickup ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#637267] block truncate">
                          Busca no balcão
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={acceptsPickup}
                      onChange={(e) => setAcceptsPickup(e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 accent-[#2E4233] rounded cursor-pointer shrink-0"
                    />
                  </div>
                </div>
              </div>

              {/* CONTAINER 2: ESTIMATIVA DE TEMPO DE PREPARO */}
              <div className="p-3.5 rounded-xl border border-[#E9E4D4] bg-[#FAF8F0]/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#2E4233] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#CB5A3C]" />
                    <span>Tempo de Preparo & Espera</span>
                  </span>
                  <span className="text-[10px] font-bold text-[#2E4233] bg-white px-2 py-0.5 rounded-md border border-[#E9E4D4]">
                    ⏱️ Vitrine: {prepMin || 0} a {prepMax || 0} min
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-xl bg-white border border-[#E9E4D4] shadow-2xs space-y-1">
                    <label className="text-[10px] font-bold text-[#637267] uppercase tracking-wider block">
                      Tempo Mínimo
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="5"
                        max="180"
                        value={prepMin}
                        onChange={(e) => setPrepMin(e.target.value)}
                        className="w-full px-2 py-1 rounded-lg border border-[#E9E4D4] text-sm font-black text-[#111827] bg-[#FAF8F0]/30 text-center focus:outline-none focus:border-[#CB5A3C]"
                      />
                      <span className="text-xs font-bold text-[#637267]">min</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-[#E9E4D4] shadow-2xs space-y-1">
                    <label className="text-[10px] font-bold text-[#637267] uppercase tracking-wider block">
                      Tempo Máximo
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="5"
                        max="240"
                        value={prepMax}
                        onChange={(e) => setPrepMax(e.target.value)}
                        className="w-full px-2 py-1 rounded-lg border border-[#E9E4D4] text-sm font-black text-[#111827] bg-[#FAF8F0]/30 text-center focus:outline-none focus:border-[#CB5A3C]"
                      />
                      <span className="text-xs font-bold text-[#637267]">min</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CONTAINER 3: TAXA DE ENTREGA & PEDIDO MÍNIMO */}
              <div className="p-3.5 rounded-xl border border-[#E9E4D4] bg-[#FAF8F0]/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#2E4233] flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Taxa de Entrega & Pedido Mínimo</span>
                  </span>
                  <span className="text-[10px] text-[#637267]">
                    Cobrança no fechamento
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-xl bg-white border border-[#E9E4D4] shadow-2xs space-y-1">
                    <label className="text-[10px] font-bold text-[#637267] uppercase tracking-wider block">
                      Taxa de Entrega
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-[#637267]">
                        R$
                      </span>
                      <input
                        type="text"
                        value={deliveryFee}
                        onChange={(e) => setDeliveryFee(e.target.value)}
                        placeholder="5,00"
                        className="w-full pl-8 pr-2 py-1 rounded-lg border border-[#E9E4D4] text-sm font-black text-[#111827] bg-[#FAF8F0]/30 focus:outline-none focus:border-[#CB5A3C]"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-[#E9E4D4] shadow-2xs space-y-1">
                    <label className="text-[10px] font-bold text-[#637267] uppercase tracking-wider block">
                      Pedido Mínimo
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-[#637267]">
                        R$
                      </span>
                      <input
                        type="text"
                        value={minOrder}
                        onChange={(e) => setMinOrder(e.target.value)}
                        placeholder="0,00"
                        className="w-full pl-8 pr-2 py-1 rounded-lg border border-[#E9E4D4] text-sm font-black text-[#111827] bg-[#FAF8F0]/30 focus:outline-none focus:border-[#CB5A3C]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* CONTAINER 4: FRETE GRÁTIS PROMOCIONAL */}
              <div className="p-3.5 rounded-xl border border-amber-200/90 bg-amber-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Frete Grátis Promocional</span>
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                    Opcional
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-44 shrink-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-amber-800">
                      R$
                    </span>
                    <input
                      type="text"
                      value={freeDeliveryAbove}
                      onChange={(e) => setFreeDeliveryAbove(e.target.value)}
                      placeholder="Ex: 80,00"
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-amber-300 bg-white text-xs font-black text-[#111827] focus:outline-none focus:border-[#CB5A3C]"
                    />
                  </div>
                  <span className="text-[11px] text-[#637267] leading-tight">
                    Isenta a taxa quando o pedido atinge este valor. Deixe em branco para desativar.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* ABA 2: HORÁRIOS DA SEMANA                                       */}
      {/* ================================================================ */}
      {activeTab === "schedule" && (
        <div className="bg-white rounded-2xl border border-[#E9E4D4] p-5 shadow-2xs max-w-4xl space-y-4 animate-in fade-in duration-150">
          <div>
            <h3 className="text-sm font-black text-[#111827] uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#CB5A3C]" />
              <span>Grade Semanal de Funcionamento da Loja</span>
            </h3>
            <p className="text-xs text-[#637267] mt-0.5">
              Defina os dias em que a sua vitrine aceita pedidos automaticamente. Fora desses horários, a vitrine fica em modo &ldquo;Fechada&rdquo;.
            </p>
          </div>

          <div className="divide-y divide-[#ECEAE2] border-t border-[#ECEAE2]">
            {WEEK_DAYS.map(({ key, label }) => {
              const day = businessHours[key] || {
                open: "18:00",
                close: "23:00",
                enabled: true,
              };
              return (
                <div
                  key={key}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setBusinessHours((prev) => ({
                          ...prev,
                          [key]: { ...day, enabled: !day.enabled },
                        }));
                      }}
                      className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                        day.enabled ? "bg-emerald-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                          day.enabled ? "left-5" : "left-0.5"
                        }`}
                      />
                    </button>
                    <span
                      className={`font-black text-sm ${
                        day.enabled ? "text-[#111827]" : "text-gray-400"
                      }`}
                    >
                      {label}
                    </span>
                  </div>

                  {day.enabled ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-[#2E4233]">
                      <span>Abertura:</span>
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
                        className="px-2.5 py-1 rounded-xl border border-[#E9E4D4] bg-[#FAF8F0] font-bold text-xs"
                      />
                      <span>Fechamento:</span>
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
                        className="px-2.5 py-1 rounded-xl border border-[#E9E4D4] bg-[#FAF8F0] font-bold text-xs"
                      />
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-gray-400 italic">
                      Fechado o dia todo
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#ECEAE2] flex justify-end">
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#CB5A3C] text-white text-xs font-bold hover:bg-[#b04b30] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Salvando..." : "Salvar Horários da Semana"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* ABA 3: FORMAS DE PAGAMENTO & QR CODE                            */}
      {/* ================================================================ */}
      {activeTab === "payment" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start max-w-6xl animate-in fade-in duration-150">
          {/* Coluna Esquerda: Métodos e Chave Pix (lg:col-span-7) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E9E4D4] p-5 shadow-2xs space-y-5">
            <div>
              <h3 className="text-sm font-black text-[#111827] uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#CB5A3C]" />
                <span>Formas de Pagamento no Pedido & Entrega</span>
              </h3>
              <p className="text-xs text-[#637267] mt-0.5">
                Escolha quais opções de pagamento estarão disponíveis para o cliente no fechamento do pedido.
              </p>
            </div>

            {/* Card Chave Pix */}
            <div className="p-4 rounded-xl bg-[#FAF8F0] border border-[#E9E4D4] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#111827] flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>Chave Pix Oficial da Loja</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                  Recebimento Imediato
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#2E4233]">
                    Tipo de Chave
                  </label>
                  <select
                    value={pixKeyType}
                    onChange={(e) => setPixKeyType(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#E9E4D4] text-xs font-bold text-[#111827] bg-white focus:outline-none focus:border-[#CB5A3C]"
                  >
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="phone">Celular</option>
                    <option value="email">E-mail</option>
                    <option value="random">Chave Aleatória (EVP)</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-[#2E4233]">
                    Chave Pix
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder="Insira sua chave Pix oficial"
                      className="w-full pl-3 pr-20 py-1.5 rounded-xl border border-[#E9E4D4] text-xs font-bold text-[#111827] bg-white focus:outline-none focus:border-[#CB5A3C]"
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
                        className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg bg-[#FAF8F0] border border-[#E9E4D4] text-[10px] font-bold text-[#2E4233] hover:text-[#CB5A3C] transition-colors cursor-pointer flex items-center gap-1"
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

            {/* Grid de Métodos Aceitos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-3 rounded-xl border border-[#E9E4D4] bg-[#FAF8F0]/30 cursor-pointer hover:border-[#CB5A3C]/40 transition-colors">
                <div>
                  <span className="text-xs font-bold text-[#111827] block">
                    Pix no Pedido
                  </span>
                  <span className="text-[11px] text-[#637267]">
                    Chave Pix e QR Code direto no cardápio
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={acceptPix}
                  onChange={(e) => setAcceptPix(e.target.checked)}
                  className="w-4 h-4 accent-[#CB5A3C] rounded cursor-pointer"
                />
              </label>

              <div className="p-3 rounded-xl border border-[#E9E4D4] bg-[#FAF8F0]/30 space-y-1.5">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-[#111827] block">
                      Dinheiro em Espécie
                    </span>
                    <span className="text-[11px] text-[#637267]">
                      Pagamento ao entregador ou balcão
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
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[#637267] cursor-pointer pt-1 border-t border-[#ECEAE2]">
                    <input
                      type="checkbox"
                      checked={needChangeOption}
                      onChange={(e) => setNeedChangeOption(e.target.checked)}
                      className="w-3.5 h-3.5 accent-[#CB5A3C] rounded cursor-pointer"
                    />
                    <span>Perguntar se o cliente precisa de troco</span>
                  </label>
                )}
              </div>

              <label className="flex items-center justify-between p-3 rounded-xl border border-[#E9E4D4] bg-[#FAF8F0]/30 cursor-pointer hover:border-[#CB5A3C]/40 transition-colors">
                <div>
                  <span className="text-xs font-bold text-[#111827] block">
                    Cartão na Entrega / Balcão
                  </span>
                  <span className="text-[11px] text-[#637267]">
                    Débito e Crédito na maquininha
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={acceptCard}
                  onChange={(e) => setAcceptCard(e.target.checked)}
                  className="w-4 h-4 accent-[#CB5A3C] rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-[#E9E4D4] bg-[#FAF8F0]/30 cursor-pointer hover:border-[#CB5A3C]/40 transition-colors">
                <div>
                  <span className="text-xs font-bold text-[#111827] block">
                    Vale-Refeição / Alimentação
                  </span>
                  <span className="text-[11px] text-[#637267]">
                    VR, Sodexo, Ticket e Alelo na maquininha
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

            <div className="pt-3 border-t border-[#ECEAE2] flex justify-end">
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#CB5A3C] text-white text-xs font-bold hover:bg-[#b04b30] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? "Salvando..." : "Salvar Formas de Pagamento"}</span>
              </button>
            </div>
          </div>

          {/* Coluna Direita: QR Code da Vitrine & Pagamento (lg:col-span-5) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E9E4D4] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-[#CB5A3C]" />
                <span className="text-xs font-black text-[#111827] uppercase tracking-wider">
                  QR Code da Vitrine & Pagamento
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                Mesa & Balcão
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF8F0] border border-[#E9E4D4] flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-white rounded-2xl shadow-xs border border-[#E9E4D4]">
                <QRCodeSVG value={fullPublicUrl} size={150} level="H" />
              </div>

              <div>
                <h4 className="text-xs font-black text-[#111827]">
                  Aponte a câmera para pedir & pagar
                </h4>
                <p className="text-[11px] text-[#637267] max-w-[260px] mt-1">
                  Imprima para colocar nas mesas, balcão de atendimento ou embalagens! O cliente escaneia com o celular, acessa o cardápio e faz o pedido com pagamento Pix imediato.
                </p>
                <span className="text-[10px] font-mono text-gray-400 block pt-1.5">
                  deliplus.com.br{publicUrl}
                </span>
              </div>

              {/* Botões do QR Code */}
              <div className="flex items-center gap-2 w-full pt-1">
                <button
                  type="button"
                  onClick={downloadQRCode}
                  className="flex-1 py-2 px-3 rounded-xl bg-white border border-[#E9E4D4] text-xs font-bold text-[#2E4233] hover:text-[#CB5A3C] hover:border-[#CB5A3C] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar PNG</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#2E4233] text-white text-xs font-bold hover:bg-[#233327] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Placa</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* ABA 4: IMPRESSÃO & COZINHA                                      */}
      {/* ================================================================ */}
      {activeTab === "printer" && (
        <div className="bg-white rounded-2xl border border-[#E9E4D4] p-5 shadow-2xs max-w-4xl space-y-5 animate-in fade-in duration-150">
          <div>
            <h3 className="text-sm font-black text-[#111827] uppercase tracking-wider flex items-center gap-2">
              <Printer className="w-4 h-4 text-[#CB5A3C]" />
              <span>Alertas Sonoros & Impressão de Comandas</span>
            </h3>
            <p className="text-xs text-[#637267] mt-0.5">
              Configure como a sua cozinha recebe os novos pedidos que chegam pelo cardápio digital.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Alerta Sonoro */}
            <div className="p-4 rounded-xl border border-[#E9E4D4] bg-[#FAF8F0]/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#111827] flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-[#CB5A3C]" />
                  <span>Campainha de Novo Pedido</span>
                </span>
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
              </div>

              <p className="text-[11px] text-[#637267]">
                Toca um som em tempo real no dashboard toda vez que um cliente envia um pedido.
              </p>

              <button
                type="button"
                onClick={playTestAlertSound}
                className="w-full py-2 px-3 rounded-xl bg-white border border-[#E9E4D4] text-xs font-bold text-[#2E4233] hover:text-[#CB5A3C] hover:border-[#CB5A3C] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Volume2 className="w-4 h-4 text-[#CB5A3C]" />
                <span>Testar Som da Cozinha Agora</span>
              </button>
            </div>

            {/* Impressora Térmica */}
            <div className="p-4 rounded-xl border border-[#E9E4D4] bg-[#FAF8F0]/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#111827] flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-[#CB5A3C]" />
                  <span>Impressão Automática</span>
                </span>
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
              </div>

              <p className="text-[11px] text-[#637267]">
                Abre a janela de impressão da comanda térmica automaticamente ao confirmar o pedido.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setPrinterSettings((prev) => ({
                      ...prev,
                      paper_width: "80mm",
                    }))
                  }
                  className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                    printerSettings.paper_width === "80mm"
                      ? "border-[#CB5A3C] bg-orange-50 font-black text-[#CB5A3C]"
                      : "border-[#E9E4D4] bg-white text-gray-600 font-bold"
                  }`}
                >
                  <span className="text-xs block">Bobina 80 mm</span>
                  <span className="text-[9px] block">Padrão Restaurante</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPrinterSettings((prev) => ({
                      ...prev,
                      paper_width: "58mm",
                    }))
                  }
                  className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                    printerSettings.paper_width === "58mm"
                      ? "border-[#CB5A3C] bg-orange-50 font-black text-[#CB5A3C]"
                      : "border-[#E9E4D4] bg-white text-gray-600 font-bold"
                  }`}
                >
                  <span className="text-xs block">Bobina 58 mm</span>
                  <span className="text-[9px] block">Mini Portátil</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#ECEAE2] flex justify-end">
            <button
              type="button"
              onClick={async () => {
                setIsSaving(true);
                const res = await updatePrinterSettings(printerSettings);
                setIsSaving(false);
                if (res.success) {
                  showToast("Preferências de comanda e som salvas!");
                } else {
                  showToast(res.error || "Erro ao salvar impressora.", "error");
                }
              }}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#CB5A3C] text-white text-xs font-bold hover:bg-[#b04b30] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Salvando..." : "Salvar Impressão"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* ABA 5: PLANO & DIAGNÓSTICO                                      */}
      {/* ================================================================ */}
      {activeTab === "plan" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start max-w-5xl animate-in fade-in duration-150">
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E9E4D4] p-5 shadow-2xs space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#637267] block">
                Assinatura SaaS Ativa
              </span>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-[#111827]">
                  Plano {initialData.billing?.planName || "Essencial"}
                </h3>
                {initialData.billing?.isTrial && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                    Período de Testes
                  </span>
                )}
              </div>
              <p className="text-xs text-[#637267]">
                Capacidade: {initialData.billing?.activeStoresCount || 1} de{" "}
                {initialData.billing?.maxStores || 1} loja(s) ativa(s).
              </p>
            </div>

            <Link
              href="/dashboard/billing"
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2E4233] text-white text-xs font-bold hover:bg-[#233327] transition-colors cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Gerenciar Assinatura & Faturas</span>
            </Link>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E9E4D4] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Saúde & Checklist da Vitrine</span>
                </h3>
                <p className="text-xs text-[#637267] mt-0.5">
                  Complete todas as etapas para maximizar as vendas pelo cardápio.
                </p>
              </div>
              <span className="text-xl font-black text-[#CB5A3C]">
                {healthPercent}%
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-[#FAF8F0] border border-[#E9E4D4] overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-emerald-500 to-[#059669] transition-all duration-300 rounded-full"
                style={{ width: `${healthPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {checklist.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold ${
                    item.ok
                      ? "bg-emerald-50/50 border-emerald-200 text-emerald-900"
                      : "bg-gray-50 border-gray-200 text-gray-500"
                  }`}
                >
                  {item.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
