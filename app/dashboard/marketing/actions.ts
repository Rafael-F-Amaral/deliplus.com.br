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

/* ============================================================== */
/* CUPONS                                                         */
/* ============================================================== */

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
  revalidatePath("/dashboard/marketing/promotions");
  revalidatePath("/dashboard/marketing/coupons");
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
  revalidatePath("/dashboard/marketing/promotions");
  revalidatePath("/dashboard/marketing/coupons");
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
  revalidatePath("/dashboard/marketing/promotions");
  revalidatePath("/dashboard/marketing/coupons");
  return { success: true };
}

/* ============================================================== */
/* GESTÃO DE PROMOÇÕES DO CARDÁPIO (DIRETO DO MARKETING)          */
/* ============================================================== */

export async function toggleProductPromo(productId: string, currentInPromo: boolean) {
  const { storeId, supabase } = await resolveActionContext();
  const nextInPromo = !currentInPromo;

  const { error } = await supabase
    .from("products")
    .update({ in_promo: nextInPromo })
    .eq("id", productId)
    .eq("store_id", storeId);

  if (error) {
    console.error("Erro ao alternar promoção do produto:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/marketing");
  revalidatePath("/dashboard/marketing/promotions");
  revalidatePath("/dashboard/marketing/coupons");
  revalidatePath("/dashboard/menu");
  return { success: true, inPromo: nextInPromo };
}

export async function updateProductPromoPrice(
  productId: string,
  promoPriceCents: number,
  inPromo: boolean = true
) {
  const { storeId, supabase } = await resolveActionContext();

  const { error } = await supabase
    .from("products")
    .update({
      promo_price_cents: promoPriceCents,
      in_promo: inPromo
    })
    .eq("id", productId)
    .eq("store_id", storeId);

  if (error) {
    console.error("Erro ao atualizar preço promocional:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/marketing");
  revalidatePath("/dashboard/marketing/promotions");
  revalidatePath("/dashboard/marketing/coupons");
  revalidatePath("/dashboard/menu");
  return { success: true };
}

export async function updateProductPromoFull(
  productId: string,
  data: {
    promoPriceCents: number | null;
    inPromo: boolean;
    promoIndefinite: boolean;
    promoStartDate: string | null;
    promoEndDate: string | null;
  }
) {
  const { storeId, supabase } = await resolveActionContext();

  let { error } = await supabase
    .from("products")
    .update({
      promo_price_cents: data.inPromo ? data.promoPriceCents : null,
      in_promo: data.inPromo,
      promo_indefinite: data.promoIndefinite,
      promo_start_date: data.promoStartDate || null,
      promo_end_date: data.promoEndDate || null
    })
    .eq("id", productId)
    .eq("store_id", storeId);

  if (error && process.env.NODE_ENV === "development") {
    const { createAdminSupabaseClient } = await import("@/lib/supabase/admin");
    const adminClient = createAdminSupabaseClient();
    const retry = await adminClient
      .from("products")
      .update({
        promo_price_cents: data.inPromo ? data.promoPriceCents : null,
        in_promo: data.inPromo,
        promo_indefinite: data.promoIndefinite,
        promo_start_date: data.promoStartDate || null,
        promo_end_date: data.promoEndDate || null
      })
      .eq("id", productId)
      .eq("store_id", storeId);
    error = retry.error;
  }

  if (error) {
    console.error("Erro ao salvar promoção completa:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/marketing");
  revalidatePath("/dashboard/marketing/promotions");
  revalidatePath("/dashboard/menu");
  return { success: true };
}

