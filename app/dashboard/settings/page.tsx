import { auth } from "@clerk/nextjs/server";
import { getActiveStoreId } from "@/lib/stores/get-active-store";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { readBillingPageState } from "@/app/dashboard/billing/billing-state";
import SettingsClient from "./settings-client";
import { BusinessHours, PrinterSettings, StoreSettingsData } from "./types";

export const dynamic = "force-dynamic";

const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  seg: { open: "18:00", close: "23:00", enabled: true },
  ter: { open: "18:00", close: "23:00", enabled: true },
  qua: { open: "18:00", close: "23:00", enabled: true },
  qui: { open: "18:00", close: "23:00", enabled: true },
  sex: { open: "18:00", close: "23:59", enabled: true },
  sab: { open: "18:00", close: "23:59", enabled: true },
  dom: { open: "18:00", close: "23:00", enabled: true },
};

const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  auto_print: false,
  paper_width: "80mm",
  copies: 1,
  sound_alerts: true,
};

export default async function SettingsPage() {
  await auth();
  let storeId = await getActiveStoreId().catch(() => null);

  let supabase:
    | ReturnType<typeof createServerSupabaseClient>
    | ReturnType<typeof createAdminSupabaseClient> = createServerSupabaseClient();

  if (!storeId && process.env.NODE_ENV === "development") {
    try {
      const adminClient = createAdminSupabaseClient();
      const { data: firstStore } = await adminClient
        .from("stores")
        .select("id")
        .limit(1)
        .maybeSingle();
      if (firstStore) {
        storeId = firstStore.id;
        supabase = adminClient;
      }
    } catch (e) {
      console.warn("Dev store fallback failed in settings:", e);
    }
  }

  if (!storeId) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center p-10">
        <div className="text-center max-w-md bg-white p-8 rounded-2xl border border-[#E9E4D4] shadow-xs">
          <h2 className="text-xl font-bold text-[#2E4233] mb-2">Nenhuma loja selecionada</h2>
          <p className="text-sm text-[#637267]">
            Por favor, selecione ou cadastre uma loja no menu superior para gerenciar sua loja.
          </p>
        </div>
      </div>
    );
  }

  // 1. Buscar dados da loja e configurações de entrega
  const [storeRes, settingsRes, billingState] = await Promise.all([
    supabase
      .from("stores")
      .select("id, name, slug, status, organization_id")
      .eq("id", storeId)
      .maybeSingle(),
    (supabase.from("store_delivery_settings" as any) as any)
      .select("*")
      .eq("store_id", storeId)
      .maybeSingle(),
    readBillingPageState().catch(() => null),
  ]);

  if (!storeRes.data) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center p-10">
        <div className="text-center max-w-md bg-white p-8 rounded-2xl border border-[#E9E4D4] shadow-xs">
          <h2 className="text-xl font-bold text-[#2E4233] mb-2">Loja não encontrada</h2>
          <p className="text-sm text-[#637267]">
            Os dados da loja ativa não puderam ser carregados.
          </p>
        </div>
      </div>
    );
  }

  const rawSettings = settingsRes.data || {};

  // Formatar dados de billing/plano
  let billingInfo = null;
  if (billingState && billingState.kind === "resolved") {
    if (billingState.entitlement.entitled) {
      const isPaid = billingState.entitlement.source === "paid_subscription";
      const isTrial = billingState.entitlement.source === "trial";
      const planCode = billingState.entitlement.planCode;

      let planName = "Essencial";
      if (planCode === "multi_2") planName = "Duo";
      else if (planCode === "multi_3") planName = "Trio";

      billingInfo = {
        planCode,
        planName,
        isTrial,
        trialDaysRemaining: isTrial ? 15 : undefined,
        isPaid,
        maxStores: billingState.entitlement.maxStores,
        activeStoresCount: 1,
      };
    } else {
      billingInfo = {
        planCode: "essential",
        planName: "Essencial (Sem assinatura)",
        isTrial: false,
        isPaid: false,
        maxStores: 1,
        activeStoresCount: 1,
      };
    }
  }

  const initialData: StoreSettingsData = {
    store: {
      id: storeRes.data.id,
      name: storeRes.data.name,
      slug: storeRes.data.slug,
      status: storeRes.data.status,
    },
    delivery: {
      min_order_cents: rawSettings.min_order_cents ?? 0,
      default_prep_min: rawSettings.default_prep_min ?? 30,
      default_prep_max: rawSettings.default_prep_max ?? 50,
      delivery_fee_cents: rawSettings.delivery_fee_cents ?? 500,
      free_delivery_above_cents: rawSettings.free_delivery_above_cents ?? null,
      accepts_delivery: rawSettings.accepts_delivery ?? true,
      accepts_pickup: rawSettings.accepts_pickup ?? true,
      is_open_override: rawSettings.is_open_override ?? true,
      phone: rawSettings.phone || "",
      instagram: rawSettings.instagram || "",
      address: rawSettings.address || "",
      bio: rawSettings.bio || "",
      category: rawSettings.category || "Restaurante",
      logo_url: rawSettings.logo_url || null,
      banner_url: rawSettings.banner_url || null,
      pix_key: rawSettings.pix_key || "",
      pix_key_type: rawSettings.pix_key_type || "cpf",
      accept_cash: rawSettings.accept_cash ?? true,
      need_change_option: rawSettings.need_change_option ?? true,
      accept_card: rawSettings.accept_card ?? true,
      accept_pix: rawSettings.accept_pix ?? true,
      accept_meal_voucher: rawSettings.accept_meal_voucher ?? false,
      business_hours: rawSettings.business_hours || DEFAULT_BUSINESS_HOURS,
      printer_settings: rawSettings.printer_settings || DEFAULT_PRINTER_SETTINGS,
    },
    billing: billingInfo,
  };

  return <SettingsClient initialData={initialData} />;
}