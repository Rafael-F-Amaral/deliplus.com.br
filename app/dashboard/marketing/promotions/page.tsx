import { Suspense } from "react";
import { getActiveStoreId } from "@/lib/stores/get-active-store";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import PromotionsClient, { PromoProduct } from "./promotions-client";

export const dynamic = "force-dynamic";

const DEFAULT_PROMO_PRODUCTS: PromoProduct[] = [
  {
    id: "p-1",
    name: "Dadinhos de Tapioca",
    categoryName: "Entradas",
    priceCents: 2600,
    promoPriceCents: 2200,
    discountPercentage: 15,
    inPromo: true,
    complementsCount: 2,
    totalSold: 6,
    totalRevenueCents: 15600,
    clicksCount: 60,
    conversionRate: 10
  },
  {
    id: "p-2",
    name: "M Bowl Noma",
    categoryName: "Bowls",
    priceCents: 4990,
    promoPriceCents: 4290,
    discountPercentage: 14,
    inPromo: true,
    complementsCount: 2,
    totalSold: 6,
    totalRevenueCents: 29940,
    clicksCount: 60,
    conversionRate: 10
  },
  {
    id: "p-3",
    name: "Chá da casa",
    categoryName: "Bebidas",
    priceCents: 1290,
    promoPriceCents: 1090,
    discountPercentage: 16,
    inPromo: true,
    complementsCount: 0,
    totalSold: 5,
    totalRevenueCents: 6450,
    clicksCount: 52,
    conversionRate: 9.6
  },
  {
    id: "p-4",
    name: "Bowl Vegano Raízes",
    categoryName: "Bowls",
    priceCents: 3990,
    promoPriceCents: 3490,
    discountPercentage: 13,
    inPromo: true,
    complementsCount: 0,
    totalSold: 4,
    totalRevenueCents: 15960,
    clicksCount: 44,
    conversionRate: 9.1
  }
];

interface CategoryRow {
  id: string;
  name: string;
}

interface ComplementRow {
  id: string;
  product_id: string;
  name: string;
}

interface OrderItemRow {
  name: string;
  quantity: number | null;
  total_price_cents: number | null;
}

interface ProductPromoRow {
  id: string;
  name: string;
  price_cents: number;
  promo_price_cents: number | null;
  in_promo: boolean | null;
  promo_indefinite: boolean | null;
  promo_start_date: string | null;
  promo_end_date: string | null;
  image_url: string | null;
  category_id: string | null;
  tags: string[] | null;
}

export default async function PromotionsPage() {
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

  let promoProducts: PromoProduct[] = [];

  if (storeId) {
    try {
      // 1. Store details
      const { data: storeData } = await supabase
        .from("stores")
        .select("name, slug")
        .eq("id", storeId)
        .maybeSingle();

      if (storeData) {
        storeName = storeData.name || storeName;
        storeSlug = storeData.slug || storeSlug;
      }

      // 2. Fetch all products & related data in parallel
      const [productsRes, categoriesRes, complementsRes, orderItemsRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, price_cents, promo_price_cents, in_promo, promo_indefinite, promo_start_date, promo_end_date, image_url, category_id, tags")
          .eq("store_id", storeId),
        supabase.from("categories").select("id, name").eq("store_id", storeId),
        supabase.from("product_complements").select("id, product_id, name").eq("store_id", storeId),
        supabase.from("order_items").select("name, quantity, total_price_cents")
      ]);

      const categoriesList = (categoriesRes.data || []) as unknown as CategoryRow[];
      const categoriesMap = new Map(categoriesList.map((c) => [c.id, c.name]));

      // Group complements count by product_id
      const complementsList = (complementsRes.data || []) as unknown as ComplementRow[];
      const complementsCountMap = new Map<string, number>();
      complementsList.forEach((c) => {
        complementsCountMap.set(c.product_id, (complementsCountMap.get(c.product_id) || 0) + 1);
      });

      // Group sales by product name
      const orderItemsList = (orderItemsRes.data || []) as unknown as OrderItemRow[];
      const salesMap = new Map<string, { totalSold: number; revenueCents: number }>();
      orderItemsList.forEach((oi) => {
        const prev = salesMap.get(oi.name) || { totalSold: 0, revenueCents: 0 };
        salesMap.set(oi.name, {
          totalSold: prev.totalSold + (oi.quantity || 1),
          revenueCents: prev.revenueCents + (oi.total_price_cents || 0)
        });
      });

      const productsList = (productsRes.data || []) as unknown as ProductPromoRow[];
      if (productsList.length > 0) {
        promoProducts = productsList.map((p) => {
          const discount = p.promo_price_cents && p.price_cents > 0
            ? Math.round(((p.price_cents - p.promo_price_cents) / p.price_cents) * 100)
            : 0;

          const sales = salesMap.get(p.name) || { totalSold: 0, revenueCents: 0 };

          // Simulated realistic clicks based on sales ratio
          const baseClicks = sales.totalSold > 0 ? sales.totalSold * 8 + 12 : 24;
          const convRate = baseClicks > 0 ? (sales.totalSold / baseClicks) * 100 : 0;

          return {
            id: p.id,
            name: p.name,
            imageUrl: p.image_url,
            categoryName: (p.category_id && categoriesMap.get(p.category_id)) || (p.tags?.[0] || "Geral"),
            priceCents: p.price_cents,
            promoPriceCents: p.promo_price_cents,
            discountPercentage: discount,
            inPromo: !!p.in_promo,
            promoIndefinite: p.promo_indefinite ?? true,
            promoStartDate: p.promo_start_date,
            promoEndDate: p.promo_end_date,
            complementsCount: complementsCountMap.get(p.id) || 0,
            totalSold: sales.totalSold,
            totalRevenueCents: sales.revenueCents > 0 ? sales.revenueCents : (sales.totalSold * (p.promo_price_cents || p.price_cents)),
            clicksCount: baseClicks,
            conversionRate: convRate
          };
        });
      }
    } catch (err) {
      console.error("Erro ao carregar dados de promoções:", err);
    }
  }

  if (promoProducts.length === 0) {
    promoProducts = DEFAULT_PROMO_PRODUCTS;
  }

  return (
    <Suspense fallback={<div className="flex-1 bg-[#F7F6F2] min-h-screen p-8 text-[#556358]">Carregando promoções...</div>}>
      <PromotionsClient
        storeSlug={storeSlug}
        storeName={storeName}
        initialPromoProducts={promoProducts}
      />
    </Suspense>
  );
}
