import { getActiveStoreId } from "@/lib/stores/get-active-store";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import MarketingClient, { CouponItem, MarketingSettings } from "./marketing-client";

export const dynamic = "force-dynamic";

const DEFAULT_COUPONS: CouponItem[] = [
  {
    id: "c-1",
    code: "BEMVINDO10",
    description: "10% de desconto no primeiro pedido para novos clientes",
    discount_type: "percentage",
    discount_value: 10,
    min_order_cents: 4000,
    max_uses: 100,
    uses_count: 38,
    status: "active",
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "c-2",
    code: "SEXTOU15",
    description: "R$ 15,00 de desconto para pedidos no fim de semana",
    discount_type: "fixed",
    discount_value: 1500,
    min_order_cents: 6000,
    max_uses: 50,
    uses_count: 24,
    status: "active",
    expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "c-3",
    code: "FRETEGRATIS",
    description: "Taxa de entrega grátis em pedidos acima de R$ 50",
    discount_type: "free_shipping",
    discount_value: 0,
    min_order_cents: 5000,
    max_uses: 30,
    uses_count: 12,
    status: "active",
    expires_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const DEFAULT_SETTINGS: MarketingSettings = {
  banner_enabled: true,
  banner_text: "🔥 Entrega grátis hoje em pedidos acima de R$ 50!",
  banner_color: "terracotta",
  loyalty_enabled: true,
  loyalty_goal_orders: 10,
  loyalty_reward_cents: 2000,
  loyalty_reward_text: "R$ 20,00 de desconto no próximo pedido"
};

export default async function MarketingPage() {
  let storeId = await getActiveStoreId().catch(() => null);
  let supabase = createServerSupabaseClient();
  let storeName = "Minha Loja";
  let storeSlug = "loja";

  if (!storeId && process.env.NODE_ENV === "development") {
    try {
      const adminClient = createAdminSupabaseClient();
      const { data: firstStore } = await adminClient
        .from("stores")
        .select("id, name, slug")
        .limit(1)
        .maybeSingle();
      if (firstStore) {
        storeId = firstStore.id;
        storeName = firstStore.name;
        storeSlug = firstStore.slug;
        supabase = adminClient as ReturnType<typeof createServerSupabaseClient>;
      }
    } catch (e) {
      console.warn("Dev store fallback failed:", e);
    }
  }

  let coupons: CouponItem[] = DEFAULT_COUPONS;
  let settings: MarketingSettings = DEFAULT_SETTINGS;

  if (storeId) {
    try {
      // 1. Fetch store info
      const { data: storeData } = await supabase
        .from("stores")
        .select("name, slug")
        .eq("id", storeId)
        .maybeSingle();

      if (storeData) {
        storeName = storeData.name || storeName;
        storeSlug = storeData.slug || storeSlug;
      }

      // 2. Fetch coupons
      let { data: dbCoupons } = await supabase
        .from("coupons")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });

      if ((!dbCoupons || dbCoupons.length === 0) && process.env.NODE_ENV === "development") {
        const adminClient = createAdminSupabaseClient();
        const { data: adminCoupons } = await adminClient
          .from("coupons")
          .select("*")
          .eq("store_id", storeId)
          .order("created_at", { ascending: false });
        if (adminCoupons && adminCoupons.length > 0) {
          dbCoupons = adminCoupons;
        }
      }

      if (dbCoupons && dbCoupons.length > 0) {
        coupons = dbCoupons.map((c) => ({
          id: c.id,
          code: c.code,
          description: c.description,
          discount_type: c.discount_type as CouponItem["discount_type"],
          discount_value: c.discount_value,
          min_order_cents: c.min_order_cents,
          max_uses: c.max_uses,
          uses_count: c.uses_count,
          status: c.status as CouponItem["status"],
          expires_at: c.expires_at
        }));
      }

      // 3. Fetch marketing settings
      let { data: dbSettings } = await supabase
        .from("store_marketing_settings")
        .select("*")
        .eq("store_id", storeId)
        .maybeSingle();

      if (!dbSettings && process.env.NODE_ENV === "development") {
        const adminClient = createAdminSupabaseClient();
        const { data: adminSettings } = await adminClient
          .from("store_marketing_settings")
          .select("*")
          .eq("store_id", storeId)
          .maybeSingle();
        if (adminSettings) {
          dbSettings = adminSettings;
        }
      }

      if (dbSettings) {
        settings = {
          banner_enabled: dbSettings.banner_enabled,
          banner_text: dbSettings.banner_text,
          banner_color: dbSettings.banner_color as MarketingSettings["banner_color"],
          loyalty_enabled: dbSettings.loyalty_enabled,
          loyalty_goal_orders: dbSettings.loyalty_goal_orders,
          loyalty_reward_cents: dbSettings.loyalty_reward_cents,
          loyalty_reward_text: dbSettings.loyalty_reward_text
        };
      }
    } catch (err) {
      console.error("Erro ao carregar dados de marketing:", err);
    }
  }

  return (
    <MarketingClient
      storeSlug={storeSlug}
      storeName={storeName}
      initialCoupons={coupons}
      initialSettings={settings}
    />
  );
}
