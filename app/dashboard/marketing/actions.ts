"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveStoreId } from "@/lib/stores/get-active-store";

async function resolveActionContext() {
  const storeId = await getActiveStoreId().catch(() => null);
  if (storeId) {
    return {
      storeId,
      supabase: createServerSupabaseClient()
    };
  }

  if (process.env.NODE_ENV === "development") {
    const { createAdminSupabaseClient } = await import("@/lib/supabase/admin");
    const adminClient = createAdminSupabaseClient();
    const { data: firstStore } = await adminClient
      .from("stores")
      .select("id")
      .limit(1)
      .maybeSingle();
    if (firstStore?.id) {
      return {
        storeId: firstStore.id,
        supabase: adminClient
      };
    }
  }

  throw new Error("Loja ativa não encontrada");
}

export async function createCoupon(data: {
  code: string;
  description?: string;
  discount_type: "percentage" | "fixed" | "free_shipping";
  discount_value: number;
  min_order_cents?: number;
  max_uses?: number | null;
  expires_at?: string | null;
}) {
  const { storeId, supabase } = await resolveActionContext();

  const formattedCode = data.code.trim().toUpperCase().replace(/\s+/g, "");

  const { data: coupon, error } = await supabase
    .from("coupons")
    .insert({
      store_id: storeId,
      code: formattedCode,
      description: data.description || null,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      min_order_cents: data.min_order_cents || 0,
      max_uses: data.max_uses || null,
      status: "active",
      expires_at: data.expires_at || null
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar cupom:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/marketing");
  return { success: true, coupon };
}

export async function toggleCouponStatus(couponId: string, currentStatus: string) {
  const { storeId, supabase } = await resolveActionContext();
  const nextStatus = currentStatus === "active" ? "paused" : "active";

  const { error } = await supabase
    .from("coupons")
    .update({ status: nextStatus })
    .eq("id", couponId)
    .eq("store_id", storeId);

  if (error) {
    console.error("Erro ao alternar status do cupom:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/marketing");
  return { success: true, status: nextStatus };
}

export async function deleteCoupon(couponId: string) {
  const { storeId, supabase } = await resolveActionContext();

  const { error } = await supabase
    .from("coupons")
    .delete()
    .eq("id", couponId)
    .eq("store_id", storeId);

  if (error) {
    console.error("Erro ao excluir cupom:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/marketing");
  return { success: true };
}

export async function updateBannerSettings(data: {
  banner_enabled: boolean;
  banner_text: string;
  banner_color: "terracotta" | "forest" | "amber";
}) {
  const { storeId, supabase } = await resolveActionContext();

  const { error } = await supabase
    .from("store_marketing_settings")
    .upsert({
      store_id: storeId,
      banner_enabled: data.banner_enabled,
      banner_text: data.banner_text,
      banner_color: data.banner_color,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error("Erro ao atualizar banner promocional:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/marketing");
  return { success: true };
}

export async function updateLoyaltySettings(data: {
  loyalty_enabled: boolean;
  loyalty_goal_orders: number;
  loyalty_reward_cents: number;
  loyalty_reward_text: string;
}) {
  const { storeId, supabase } = await resolveActionContext();

  const { error } = await supabase
    .from("store_marketing_settings")
    .upsert({
      store_id: storeId,
      loyalty_enabled: data.loyalty_enabled,
      loyalty_goal_orders: data.loyalty_goal_orders,
      loyalty_reward_cents: data.loyalty_reward_cents,
      loyalty_reward_text: data.loyalty_reward_text,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error("Erro ao atualizar programa de fidelidade:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/marketing");
  return { success: true };
}
