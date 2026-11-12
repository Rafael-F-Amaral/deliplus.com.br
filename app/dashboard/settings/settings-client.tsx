"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  X,
  Store,
  Truck,
  CreditCard,
  QrCode,
} from "lucide-react";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import {
  StoreSettingsData,
  ModernBusinessHours,
  StorefrontPreviewData,
} from "./types";
import {
  updateStoreProfile,
  updateDeliverySettings,
  updatePaymentSettings,
  toggleStoreOpenStatus,
  uploadStoreAsset,
} from "./actions";
import { StorefrontPhoneMockup } from "@/components/dashboard/settings/storefront-phone-mockup";
import { FloatingActionBar } from "@/components/dashboard/settings/floating-action-bar";
import { StoreQrModal } from "@/components/dashboard/settings/store-qr-modal";
import { ProfileBrandSection } from "@/components/dashboard/settings/sections/profile-brand-section";
import { DeliveryFeesSection } from "@/components/dashboard/settings/sections/delivery-fees-section";
import { PaymentsSection } from "@/components/dashboard/settings/sections/payments-section";
import { normalizeBusinessHours } from "@/components/dashboard/settings/weekly-schedule-manager";
import { PaymentSettingsState } from "@/components/dashboard/settings/payment-method-card";

export type SettingsTabId = "profile" | "delivery" | "payments";

interface SettingsBaselineSnapshot {
  storeName: string;
  bio: string;
  category: string;
  phone: string;
  instagram: string;
  address: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  acceptsDelivery: boolean;
  acceptsPickup: boolean;
  prepMin: string;
  prepMax: string;
  minOrder: string;
  deliveryFee: string;
  freeDeliveryAbove: string;
  businessHours: ModernBusinessHours;
  paymentState: PaymentSettingsState;
}

function createSnapshotFromInitial(data: StoreSettingsData): SettingsBaselineSnapshot {
  return {
    storeName: data.store.name,
    bio: data.delivery.bio || "",
    category: data.delivery.category || "Restaurante Geral",
    phone: data.delivery.social_links?.whatsapp || data.delivery.phone || "",
    instagram: data.delivery.social_links?.instagram || data.delivery.instagram || "",
    address: data.delivery.address || "",
    logoUrl: data.delivery.logo_url,
    bannerUrl: data.delivery.banner_url,
    acceptsDelivery: data.delivery.accepts_delivery,
    acceptsPickup: data.delivery.accepts_pickup,
    prepMin: data.delivery.default_prep_min.toString(),
    prepMax: data.delivery.default_prep_max.toString(),
    minOrder: (data.delivery.min_order_cents / 100).toFixed(2).replace(".", ","),
    deliveryFee: (data.delivery.delivery_fee_cents / 100).toFixed(2).replace(".", ","),
    freeDeliveryAbove: data.delivery.free_delivery_above_cents
      ? (data.delivery.free_delivery_above_cents / 100).toFixed(2).replace(".", ",")
      : "",
    businessHours: normalizeBusinessHours(data.delivery.business_hours),
    paymentState: {
      acceptPix: data.delivery.accept_pix,
      pixKey: data.delivery.pix_key || "",
      pixKeyType: data.delivery.pix_key_type || "cpf",
      acceptCard: data.delivery.accept_card,
      acceptCash: data.delivery.accept_cash,
      needChangeOption: data.delivery.need_change_option,
      acceptMealVoucher: data.delivery.accept_meal_voucher,
    },
  };
}

export default function SettingsClient({
  initialData,
}: {
  initialData: StoreSettingsData;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTabId>("profile");
  const [showStudioDrawer, setShowStudioDrawer] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const [savedSnapshot, setSavedSnapshot] = useState<SettingsBaselineSnapshot>(() =>
    createSnapshotFromInitial(initialData)
  );

  useEffect(() => {
    if (!showStudioDrawer) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowStudioDrawer(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showStudioDrawer]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Estados de Vitrine & Contato
  const [storeName, setStoreName] = useState(savedSnapshot.storeName);
  const [bio, setBio] = useState(savedSnapshot.bio);
  const [category, setCategory] = useState(savedSnapshot.category);
  const [phone, setPhone] = useState(savedSnapshot.phone);
  const [instagram, setInstagram] = useState(savedSnapshot.instagram);
  const [address, setAddress] = useState(savedSnapshot.address);
  const [logoUrl, setLogoUrl] = useState<string | null>(savedSnapshot.logoUrl);
  const [bannerUrl, setBannerUrl] = useState<string | null>(savedSnapshot.bannerUrl);
  const [showCoverPickerModal, setShowCoverPickerModal] = useState(false);

  // 2. Estados de Entrega & Horários
  const [isOpen, setIsOpen] = useState(initialData.delivery.is_open_override ?? true);
  const [acceptsDelivery, setAcceptsDelivery] = useState(savedSnapshot.acceptsDelivery);
  const [acceptsPickup, setAcceptsPickup] = useState(savedSnapshot.acceptsPickup);
  const [prepMin, setPrepMin] = useState(savedSnapshot.prepMin);
  const [prepMax, setPrepMax] = useState(savedSnapshot.prepMax);
  const [minOrder, setMinOrder] = useState(savedSnapshot.minOrder);
  const [deliveryFee, setDeliveryFee] = useState(savedSnapshot.deliveryFee);
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState(
    savedSnapshot.freeDeliveryAbove
  );
  const [businessHours, setBusinessHours] = useState<ModernBusinessHours>(
    savedSnapshot.businessHours
  );

  // 3. Pagamentos & Pix
  const [paymentState, setPaymentState] = useState<PaymentSettingsState>(
    savedSnapshot.paymentState
  );

  // Parsing monetário
  const parseCurrencyInput = (val: string): number => {
    const clean = val.replace(/[^\d,.-]/g, "").replace(",", ".");
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : Math.round(num * 100);
  };

  // Cálculo de Dirty State (inclui horários semanais!)
  const dirtyChanges = useMemo(() => {
    const changes: string[] = [];
    if (storeName !== savedSnapshot.storeName) changes.push("storeName");
    if (bio !== savedSnapshot.bio) changes.push("bio");
    if (category !== savedSnapshot.category) changes.push("category");
    if (phone !== savedSnapshot.phone) changes.push("phone");
    if (instagram !== savedSnapshot.instagram) changes.push("instagram");
    if (address !== savedSnapshot.address) changes.push("address");
    if (logoUrl !== savedSnapshot.logoUrl) changes.push("logoUrl");
    if (bannerUrl !== savedSnapshot.bannerUrl) changes.push("bannerUrl");
    if (acceptsDelivery !== savedSnapshot.acceptsDelivery) changes.push("acceptsDelivery");
    if (acceptsPickup !== savedSnapshot.acceptsPickup) changes.push("acceptsPickup");
    if (prepMin !== savedSnapshot.prepMin) changes.push("prepMin");
    if (prepMax !== savedSnapshot.prepMax) changes.push("prepMax");
    if (minOrder !== savedSnapshot.minOrder) changes.push("minOrder");
    if (deliveryFee !== savedSnapshot.deliveryFee) changes.push("deliveryFee");
    if (freeDeliveryAbove !== savedSnapshot.freeDeliveryAbove) {
      changes.push("freeDeliveryAbove");
    }

    if (
      JSON.stringify(normalizeBusinessHours(businessHours)) !==
      JSON.stringify(normalizeBusinessHours(savedSnapshot.businessHours))
    ) {
      changes.push("businessHours");
    }

    if (paymentState.acceptPix !== savedSnapshot.paymentState.acceptPix) {
      changes.push("acceptPix");
    }
    if (paymentState.pixKey !== savedSnapshot.paymentState.pixKey) {
      changes.push("pixKey");
    }
    if (paymentState.pixKeyType !== savedSnapshot.paymentState.pixKeyType) {
      changes.push("pixKeyType");
    }
    if (paymentState.acceptCard !== savedSnapshot.paymentState.acceptCard) {
      changes.push("acceptCard");
    }
    if (paymentState.acceptCash !== savedSnapshot.paymentState.acceptCash) {
      changes.push("acceptCash");
    }

    return changes;
  }, [
    storeName,
    bio,
    category,
    phone,
    instagram,
    address,
    logoUrl,
    bannerUrl,
    acceptsDelivery,
    acceptsPickup,
    prepMin,
    prepMax,
    minOrder,
    deliveryFee,
    freeDeliveryAbove,
    businessHours,
    paymentState,
    savedSnapshot,
  ]);

  const isDirty = dirtyChanges.length > 0;

  // Descartar alterações
  const handleDiscardChanges = () => {
    setStoreName(savedSnapshot.storeName);
    setBio(savedSnapshot.bio);
    setCategory(savedSnapshot.category);
    setPhone(savedSnapshot.phone);
    setInstagram(savedSnapshot.instagram);
    setAddress(savedSnapshot.address);
    setLogoUrl(savedSnapshot.logoUrl);
    setBannerUrl(savedSnapshot.bannerUrl);
    setAcceptsDelivery(savedSnapshot.acceptsDelivery);
    setAcceptsPickup(savedSnapshot.acceptsPickup);
    setPrepMin(savedSnapshot.prepMin);
    setPrepMax(savedSnapshot.prepMax);
    setMinOrder(savedSnapshot.minOrder);
    setDeliveryFee(savedSnapshot.deliveryFee);
    setFreeDeliveryAbove(savedSnapshot.freeDeliveryAbove);
    setBusinessHours(savedSnapshot.businessHours);
    setPaymentState(savedSnapshot.paymentState);
    showToast("Alterações descartadas! Valores anteriores restaurados.");
  };

  // Upload instantâneo com URL.createObjectURL para latência 0ms
  const handleUploadImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "banner"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localBlobUrl = URL.createObjectURL(file);
    if (type === "logo") setLogoUrl(localBlobUrl);
    else setBannerUrl(localBlobUrl);

    showToast(`Enviando ${type === "logo" ? "logotipo" : "capa"}...`);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const res = await uploadStoreAsset(formData);
    if (res.success && res.url) {
      if (type === "logo") setLogoUrl(res.url);
      else setBannerUrl(res.url);
      URL.revokeObjectURL(localBlobUrl);
      showToast(
        `${type === "logo" ? "Logotipo" : "Capa"} carregada! Clique em Salvar para confirmar.`
      );
    } else {
      showToast(res.error || "Erro no upload da imagem.", "error");
    }
  };

  // Salvar todas as configurações ativas
  const handleSaveAll = async () => {
    setIsSaving(true);
    const minOrderCents = parseCurrencyInput(minOrder);
    const deliveryFeeCents = parseCurrencyInput(deliveryFee);
    const freeDeliveryCents = freeDeliveryAbove
      ? parseCurrencyInput(freeDeliveryAbove)
      : null;
    const normalizedHours = normalizeBusinessHours(businessHours);

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
        social_links: {
          whatsapp: phone,
          instagram,
        },
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
        business_hours: normalizedHours as unknown as Parameters<
          typeof updateDeliverySettings
        >[0]["business_hours"],
      }),
      updatePaymentSettings({
        pix_key: paymentState.pixKey,
        pix_key_type: paymentState.pixKeyType,
        accept_cash: paymentState.acceptCash,
        need_change_option: paymentState.needChangeOption,
        accept_card: paymentState.acceptCard,
        accept_pix: paymentState.acceptPix,
        accept_meal_voucher: paymentState.acceptMealVoucher,
      }),
    ]);

    setIsSaving(false);

    if (resProfile.success && resDelivery.success && resPayment.success) {
      setSavedSnapshot({
        storeName,
        bio,
        category,
        phone,
        instagram,
        address,
        logoUrl,
        bannerUrl,
        acceptsDelivery,
        acceptsPickup,
        prepMin,
        prepMax,
        minOrder,
        deliveryFee,
        freeDeliveryAbove,
        businessHours: normalizedHours,
        paymentState: { ...paymentState },
      });
      showToast("Configurações da loja salvas!");
      router.refresh();
    } else {
      showToast(
        resProfile.error ||
          resDelivery.error ||
          resPayment.error ||
          "Erro ao salvar alterações.",
        "error"
      );
    }
  };

  // Toggle status aberto/fechado (salvamento imediato)
  const handleToggleStoreStatus = async (newStatus: boolean) => {
    setIsOpen(newStatus);
    const res = await toggleStoreOpenStatus(newStatus);
    if (res.success) {
      showToast(
        newStatus ? "Loja aberta para pedidos!" : "Loja pausada temporariamente."
      );
      router.refresh();
    } else {
      setIsOpen(!newStatus);
      showToast(res.error || "Erro ao alternar status.", "error");
    }
  };

  // Dados reativos para o Live Phone Mockup
  const previewData: StorefrontPreviewData = {
    name: storeName,
    slug: initialData.store.slug,
    bio,
    category,
    logoUrl,
    bannerUrl,
    isOpen,
    acceptsDelivery,
    acceptsPickup,
    prepTimeMin: parseInt(prepMin, 10) || 30,
    prepTimeMax: parseInt(prepMax, 10) || 50,
    deliveryFeeCents: parseCurrencyInput(deliveryFee),
    minOrderCents: parseCurrencyInput(minOrder),
    freeDeliveryAboveCents: freeDeliveryAbove ? parseCurrencyInput(freeDeliveryAbove) : null,
    whatsapp: phone,
    instagram,
  };

  const tabsConfig = [
    {
      id: "profile" as const,
      label: "Vitrine & Contato",
      icon: Store,
    },
    {
      id: "delivery" as const,
      label: "Entrega & Horários",
      icon: Truck,
      badge: (
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            isOpen
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
          }`}
        >
          {isOpen ? "Aberta" : "Fechada"}
        </span>
      ),
    },
    {
      id: "payments" as const,
      label: "Pagamentos",
      icon: CreditCard,
      badge: paymentState.pixKey.trim() ? (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
          ✓ Pix
        </span>
      ) : (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
          Sem Pix
        </span>
      ),
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 min-h-[calc(100dvh-64px)] pb-32">
      {/* TOAST DE FEEDBACK */}
      {toastMessage && (
        <div
          role="status"
          className={`fixed top-5 left-1/2 -translate-x-1/2 lg:left-[calc(50%+var(--sidebar-w,260px)/2)] w-[calc(100vw-2rem)] sm:w-auto sm:max-w-md z-[55] flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-300 print:hidden ${
            toastMessage.type === "success"
              ? "bg-[#2E4233] text-white border border-emerald-500/30"
              : "bg-red-700 text-white border border-red-500/30"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-200 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* CABEÇALHO DE "MINHA LOJA" */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/80 print:hidden">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <h1 className="font-serif text-2xl lg:text-3xl font-bold tracking-tight text-[#1A241E] dark:text-[#F2EFE9]">
              Minha Loja
            </h1>
            <HelpTooltip
              title="Gestão da Vitrine & Operação"
              description="Gerencie sua vitrine, regras de entrega, horários semanais e pagamentos em 3 áreas simples."
              tip="Use Pré-visualizar Vitrine para conferir o cardápio ao vivo no celular antes de salvar."
            />
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isOpen
                  ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOpen ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              {isOpen ? "Aberta para Pedidos" : "Fechada Temporariamente"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Configure identidade da vitrine, operação de entrega, horários e formas de recebimento.
          </p>
        </div>

        {/* AÇÕES RÁPIDAS */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-1.5 min-h-9 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#1B241E] border border-border text-foreground hover:bg-[#FAF8F0] dark:hover:bg-[#25332A] transition-colors shadow-2xs cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-[#B4482D] dark:text-[#FF7D4F]" />
            <span>QR Code</span>
          </button>

          <button
            type="button"
            onClick={() => setShowStudioDrawer(true)}
            className="flex items-center gap-2 min-h-9 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#1B241E] border border-border text-foreground hover:bg-[#FAF8F0] dark:hover:bg-[#25332A] transition-all shadow-2xs cursor-pointer group"
          >
            <Smartphone className="w-4 h-4 text-[#B4482D] dark:text-[#FF7D4F] group-hover:scale-110 transition-transform" />
            <span>Pré-visualizar Vitrine</span>
          </button>

          <Link
            href={`/${initialData.store.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 min-h-9 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#2E4233] text-white hover:bg-[#25352A] transition-colors shadow-2xs"
          >
            <span>Ver Vitrine Pública</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* 3 ABAS PRINCIPAIS */}
      <div className="relative print:hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar sm:flex-wrap p-1.5 pr-8 sm:pr-1.5 rounded-2xl bg-[#F5F1E6] dark:bg-[#162019] border border-[#E5DFD1] dark:border-[#28382D]">
          {tabsConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 min-h-9 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-white dark:bg-[#243329] text-[#2E4233] dark:text-[#F2EFE9] shadow-xs border border-[#E2DDD0] dark:border-[#344638]"
                    : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-[#B4482D] dark:text-[#FF7D4F]" : "text-muted-foreground"
                  }`}
                />
                <span>{tab.label}</span>
                {tab.badge && <span className="ml-0.5">{tab.badge}</span>}
              </button>
            );
          })}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 rounded-r-2xl bg-gradient-to-l from-[#F5F1E6] dark:from-[#162019] to-transparent sm:hidden"
        />
      </div>

      {/* CONTEÚDO DA ABA SELECIONADA */}
      <section aria-label="Configurações da loja" className="w-full min-w-0 print:hidden">
        {activeTab === "profile" && (
          <ProfileBrandSection
            storeName={storeName}
            setStoreName={setStoreName}
            category={category}
            setCategory={setCategory}
            bio={bio}
            setBio={setBio}
            address={address}
            setAddress={setAddress}
            phone={phone}
            setPhone={setPhone}
            instagram={instagram}
            setInstagram={setInstagram}
            logoUrl={logoUrl}
            setLogoUrl={setLogoUrl}
            bannerUrl={bannerUrl}
            setBannerUrl={setBannerUrl}
            onUploadImage={handleUploadImage}
            showCoverPickerModal={showCoverPickerModal}
            setShowCoverPickerModal={setShowCoverPickerModal}
          />
        )}

        {activeTab === "delivery" && (
          <DeliveryFeesSection
            isOpen={isOpen}
            onToggleStatus={handleToggleStoreStatus}
            acceptsDelivery={acceptsDelivery}
            setAcceptsDelivery={setAcceptsDelivery}
            acceptsPickup={acceptsPickup}
            setAcceptsPickup={setAcceptsPickup}
            prepMin={prepMin}
            setPrepMin={setPrepMin}
            prepMax={prepMax}
            setPrepMax={setPrepMax}
            deliveryFee={deliveryFee}
            setDeliveryFee={setDeliveryFee}
            minOrder={minOrder}
            setMinOrder={setMinOrder}
            freeDeliveryAbove={freeDeliveryAbove}
            setFreeDeliveryAbove={setFreeDeliveryAbove}
            businessHours={businessHours}
            onChangeHours={setBusinessHours}
            onToast={showToast}
          />
        )}

        {activeTab === "payments" && (
          <PaymentsSection
            state={paymentState}
            onChange={setPaymentState}
            onToast={showToast}
          />
        )}
      </section>

      {/* MODAL DE QR CODE DA VITRINE */}
      <StoreQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        storeName={storeName}
        storeSlug={initialData.store.slug}
        onToast={showToast}
      />

      {/* GAVETA / DRAWER SLIDE-OVER DO LIVE STUDIO (IPHONE 15 PRO) */}
      {showStudioDrawer && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Studio da Vitrine ao Vivo"
          className="fixed inset-0 z-[60] flex items-center justify-end overflow-hidden bg-black/55 backdrop-blur-xs animate-in fade-in duration-200 print:hidden"
        >
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={() => setShowStudioDrawer(false)}
          />

          <div className="relative z-10 h-full w-full max-w-md bg-card border-l border-border shadow-2xl p-3 sm:p-6 ultrashort:py-3 ultrashort:px-4 flex flex-col items-center justify-between overflow-y-auto no-scrollbar animate-in slide-in-from-right duration-300 pb-safe">
            <div className="w-full shrink-0 flex items-center justify-between gap-2 pb-3 ultrashort:pb-2 border-b border-border/80 mb-3 ultrashort:mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <h3 className="font-serif font-bold text-base text-foreground truncate">
                  Studio da Vitrine ao Vivo
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowStudioDrawer(false)}
                aria-label="Fechar Studio da Vitrine"
                className="min-h-9 min-w-9 flex items-center justify-center p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                title="Fechar Studio"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full flex-1 flex items-center justify-center py-2 ultrashort:py-1">
              <StorefrontPhoneMockup data={previewData} isDirty={isDirty} />
            </div>

            <div className="w-full shrink-0 pt-3 ultrashort:pt-2 border-t border-border/80 text-center text-xs text-muted-foreground">
              Qualquer alteração digitada é refletida instantaneamente na prévia.
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION BAR */}
      <FloatingActionBar
        isDirty={isDirty}
        isSaving={isSaving}
        dirtyCount={dirtyChanges.length}
        onSave={handleSaveAll}
        onDiscard={handleDiscardChanges}
      />
    </div>
  );
}
