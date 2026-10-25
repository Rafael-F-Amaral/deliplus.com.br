"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveStoreId } from "@/lib/stores/get-active-store";

async function resolveActionContext() {
  const storeId = await getActiveStoreId().catch(() => null);
  if (storeId) {
    return {
      storeId,
      supabase: createServerSupabaseClient(),
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
        supabase: adminClient,
      };
    }
  }

  throw new Error("Loja ativa não encontrada");
}

/* ============================================================== */
/* 1. PERFIL DA LOJA                                              */
/* ============================================================== */

export async function updateStoreProfile(data: {
  name: string;
  bio?: string;
  phone?: string;
  instagram?: string;
  address?: string;
  category?: string;
  logo_url?: string | null;
  banner_url?: string | null;
}) {
  const { storeId, supabase } = await resolveActionContext();

  const trimmedName = data.name.trim();
  if (!trimmedName) {
    return { success: false, error: "O nome da loja não pode ser vazio." };
  }

  // Atualizar nome na tabela stores
  const { error: storeError } = await supabase
    .from("stores")
    .update({ name: trimmedName })
    .eq("id", storeId);

  if (storeError) {
    console.error("Erro ao atualizar stores:", storeError);
    return { success: false, error: "Falha ao salvar nome da loja." };
  }

  // Atualizar dados de perfil em store_delivery_settings
  const { error: settingsError } = await (supabase.from("store_delivery_settings" as any) as any)
    .update({
      bio: data.bio?.trim() ?? "",
      phone: data.phone?.trim() ?? "",
      instagram: data.instagram?.trim() ?? "",
      address: data.address?.trim() ?? "",
      category: data.category?.trim() ?? "Restaurante",
      logo_url: data.logo_url ?? null,
      banner_url: data.banner_url ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("store_id", storeId);

  if (settingsError) {
    console.error("Erro ao atualizar perfil em store_delivery_settings:", settingsError);
    return { success: false, error: "Falha ao salvar dados complementares da loja." };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

/* ============================================================== */
/* 2. DELIVERY & OPERAÇÃO                                         */
/* ============================================================== */

export async function updateDeliverySettings(data: {
  is_open_override?: boolean | null;
  accepts_delivery: boolean;
  accepts_pickup: boolean;
  min_order_cents: number;
  delivery_fee_cents: number;
  free_delivery_above_cents: number | null;
  default_prep_min: number;
  default_prep_max: number;
  business_hours?: Record<
    string,
    { open: string; close: string; enabled: boolean }
  >;
}) {
  const { storeId, supabase } = await resolveActionContext();

  const updatePayload: Record<string, any> = {
    accepts_delivery: data.accepts_delivery,
    accepts_pickup: data.accepts_pickup,
    min_order_cents: Math.max(0, data.min_order_cents),
    delivery_fee_cents: Math.max(0, data.delivery_fee_cents),
    free_delivery_above_cents:
      data.free_delivery_above_cents !== null && data.free_delivery_above_cents > 0
        ? data.free_delivery_above_cents
        : null,
    default_prep_min: Math.max(5, data.default_prep_min),
    default_prep_max: Math.max(data.default_prep_min, data.default_prep_max),
    updated_at: new Date().toISOString(),
  };

  if (data.is_open_override !== undefined) {
    updatePayload.is_open_override = data.is_open_override;
  }

  if (data.business_hours) {
    updatePayload.business_hours = data.business_hours;
  }

  const { error } = await (supabase.from("store_delivery_settings" as any) as any)
    .update(updatePayload)
    .eq("store_id", storeId);

  if (error) {
    console.error("Erro ao atualizar delivery settings:", error);
    return { success: false, error: "Falha ao salvar configurações de entrega e horários." };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleStoreOpenStatus(isOpen: boolean) {
  const { storeId, supabase } = await resolveActionContext();

  const { error } = await (supabase.from("store_delivery_settings" as any) as any)
    .update({
      is_open_override: isOpen,
      updated_at: new Date().toISOString(),
    })
    .eq("store_id", storeId);

  if (error) {
    console.error("Erro ao alternar status da loja:", error);
    return { success: false, error: "Não foi possível alternar o status da loja." };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

/* ============================================================== */
/* 3. PAGAMENTOS & PIX                                            */
/* ============================================================== */

export async function updatePaymentSettings(data: {
  pix_key: string;
  pix_key_type: string;
  accept_cash: boolean;
  need_change_option: boolean;
  accept_card: boolean;
  accept_pix: boolean;
  accept_meal_voucher: boolean;
}) {
  const { storeId, supabase } = await resolveActionContext();

  const { error } = await (supabase.from("store_delivery_settings" as any) as any)
    .update({
      pix_key: data.pix_key.trim(),
      pix_key_type: data.pix_key_type,
      accept_cash: data.accept_cash,
      need_change_option: data.need_change_option,
      accept_card: data.accept_card,
      accept_pix: data.accept_pix,
      accept_meal_voucher: data.accept_meal_voucher,
      updated_at: new Date().toISOString(),
    })
    .eq("store_id", storeId);

  if (error) {
    console.error("Erro ao atualizar formas de pagamento:", error);
    return { success: false, error: "Falha ao salvar formas de pagamento." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

/* ============================================================== */
/* 4. ALERTAS & COMANDAS (IMPRESSÃO)                              */
/* ============================================================== */

export async function updatePrinterSettings(data: {
  auto_print: boolean;
  paper_width: "58mm" | "80mm";
  copies: number;
  sound_alerts: boolean;
}) {
  const { storeId, supabase } = await resolveActionContext();

  const { error } = await (supabase.from("store_delivery_settings" as any) as any)
    .update({
      printer_settings: {
        auto_print: data.auto_print,
        paper_width: data.paper_width,
        copies: Math.max(1, Math.min(5, data.copies)),
        sound_alerts: data.sound_alerts,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("store_id", storeId);

  if (error) {
    console.error("Erro ao atualizar impressora:", error);
    return { success: false, error: "Falha ao salvar preferências de alertas e comanda." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

/* ============================================================== */
/* 5. UPLOAD DE ATIVOS DA LOJA (LOGO / BANNER)                    */
/* ============================================================== */

export async function uploadStoreAsset(formData: FormData) {
  try {
    const { storeId, supabase } = await resolveActionContext();
    const file = formData.get("file") as File | null;
    const assetType = (formData.get("type") as string) || "logo";

    if (!file || !(file instanceof File)) {
      return { success: false, error: "Nenhum arquivo enviado." };
    }

    const fileExt = file.name.split(".").pop()?.toLowerCase() || "png";
    const fileName = `${storeId}/${assetType}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("store-assets")
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Erro upload storage:", uploadError);
      return { success: false, error: uploadError.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from("store-assets")
      .getPublicUrl(fileName);

    return { success: true, url: publicUrlData.publicUrl };
  } catch (err: any) {
    console.error("Erro inesperado no uploadStoreAsset:", err);
    return { success: false, error: err?.message || "Erro ao fazer upload da imagem." };
  }
}
