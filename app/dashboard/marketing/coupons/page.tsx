import { getActiveStoreId } from "@/lib/stores/get-active-store";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import CouponsClient, { CouponItem } from "./coupons-client";

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

interface CouponRow {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_cents: number;
  max_uses: number | null;
  uses_count: number;
  status: string;
  expires_at: string | null;
}

export default async function CouponsPage() {
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

  if (storeId) {
    try {
      const { data: storeData } = await supabase
        .from("stores")
        .select("name, slug")
        .eq("id", storeId)
        .maybeSingle();

      if (storeData) {
        storeName = storeData.name || storeName;
        storeSlug = storeData.slug || storeSlug;
      }

      const { data: couponsData } = await supabase
        .from("coupons")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });

      const couponsList = (couponsData || []) as unknown as CouponRow[];
      if (couponsList.length > 0) {
        coupons = couponsList.map((c) => ({
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
    } catch (err) {
      console.error("Erro ao carregar cupons:", err);
    }
  }

  return (
    <CouponsClient
      storeSlug={storeSlug}
      storeName={storeName}
      initialCoupons={coupons}
    />
  );
}
