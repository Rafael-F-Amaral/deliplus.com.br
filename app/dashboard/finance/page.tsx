import { getActiveStoreId } from "@/lib/stores/get-active-store";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { FinanceClient, LiveOrderData, InventoryItemData } from "./finance-client";

export const dynamic = "force-dynamic";

export default async function FinanceiroPage() {
  let storeId = await getActiveStoreId().catch(() => null);
  let storeName = "DeliPlus Hamburgueria";
  let supabase: any = createServerSupabaseClient();

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
        storeName = firstStore.name || storeName;
        supabase = adminClient;
      }
    } catch (e) {
      console.warn("Dev store fallback failed:", e);
    }
  }

  let orders: LiveOrderData[] = [];
  let inventoryItems: InventoryItemData[] = [];

  if (storeId) {
    try {
      const [ordersRes, inventoryRes, storeRes] = await Promise.all([
        supabase
          .from("orders_live" as any)
          .select("id, order_number, display_id, customer_name, payment_method, total_amount_cents, status, created_at, items_detail")
          .eq("store_id", storeId)
          .order("order_number", { ascending: false }),
        supabase
          .from("inventory_items" as any)
          .select("id, name, quantity, unit_cost_cents, unit")
          .eq("store_id", storeId),
        supabase
          .from("stores")
          .select("name")
          .eq("id", storeId)
          .maybeSingle(),
      ]);

      if (storeRes?.data?.name) {
        storeName = storeRes.data.name;
      }

      if (ordersRes.data && ordersRes.data.length > 0) {
        orders = ordersRes.data;
      }

      if (inventoryRes.data && inventoryRes.data.length > 0) {
        inventoryItems = inventoryRes.data;
      }
    } catch (err) {
      console.warn("Erro ao buscar dados financeiros no Supabase:", err);
    }
  }

  return (
    <FinanceClient
      initialOrders={orders}
      initialInventoryItems={inventoryItems}
      storeName={storeName}
    />
  );
}
