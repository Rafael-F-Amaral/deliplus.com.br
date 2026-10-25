"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getActiveStoreId } from "@/lib/stores/get-active-store"
import type { Database } from "@/lib/supabase/database.types"

type SupabaseServerClient = ReturnType<typeof createServerSupabaseClient>
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"]

/**
 * Resolve a loja ativa e o cliente Supabase adequado.
 * Em desenvolvimento, provê fallback gracioso para a primeira loja caso não haja sessão Clerk ativa.
 */
async function resolveActionContext(): Promise<{ storeId: string; supabase: SupabaseServerClient }> {
  const storeId = await getActiveStoreId().catch(() => null)
  if (storeId) {
    return {
      storeId,
      supabase: createServerSupabaseClient()
    }
  }

  if (process.env.NODE_ENV === "development") {
    const { createAdminSupabaseClient } = await import("@/lib/supabase/admin")
    const adminClient = createAdminSupabaseClient()
    const { data: firstStore } = await adminClient
      .from("stores")
      .select("id")
      .limit(1)
      .maybeSingle()
    if (firstStore?.id) {
      return {
        storeId: firstStore.id,
        supabase: adminClient as unknown as SupabaseServerClient
      }
    }
  }

  throw new Error("Loja não encontrada")
}

/**
 * Cria ou busca uma categoria para a loja ativa
 */
async function getOrCreateCategory(supabase: SupabaseServerClient, storeId: string, categoryName: string): Promise<string | null> {
  const cleanName = categoryName.trim()
  if (!cleanName) return null

  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("store_id", storeId)
    .ilike("name", cleanName)
    .maybeSingle()

  if (existing) return existing.id

  const { data: newCat, error } = await supabase
    .from("categories")
    .insert({
      store_id: storeId,
      name: cleanName,
      sort_order: 10
    })
    .select("id")
    .single()

  if (error) {
    console.error("Erro ao criar categoria:", error)
    return null
  }
  return newCat.id
}

/**
 * Cria um novo produto no cardápio
 */
export async function createMenuProduct(data: {
  name: string
  categoryName: string
  categories: string[]
  priceCents: number
  description?: string
  dailyLimit?: number | null
  imageUrl?: string
}) {
  const { storeId, supabase } = await resolveActionContext()
  const categoryId = await getOrCreateCategory(supabase, storeId, data.categoryName)
  if (!categoryId) throw new Error("Não foi possível associar a categoria")

  const limit = typeof data.dailyLimit === "number" && data.dailyLimit > 0 ? data.dailyLimit : null

  const { data: inserted, error } = await supabase
    .from("products")
    .insert({
      store_id: storeId,
      category_id: categoryId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      price_cents: data.priceCents,
      promo_price_cents: null,
      in_promo: false,
      promo_indefinite: true,
      is_active: true,
      daily_limit: limit,
      daily_remaining: limit,
      image_url: data.imageUrl || null,
      tags: data.categories || [data.categoryName]
    })
    .select()
    .single()

  if (error) {
    console.error("Erro ao criar produto:", error)
    throw new Error("Falha ao salvar produto no banco de dados")
  }

  revalidatePath("/dashboard/menu")
  return inserted
}

/**
 * Atualiza um produto do cardápio
 */
export async function updateMenuProduct(
  id: string,
  data: {
    name?: string
    categoryName?: string
    categories?: string[]
    priceCents?: number
    promoPriceCents?: number | null
    inPromo?: boolean
    promoIndefinite?: boolean
    promoStartDate?: string | null
    promoEndDate?: string | null
    description?: string
    dailyLimit?: number | null
    dailyRemaining?: number | null
    imageUrl?: string
    isActive?: boolean
  }
) {
  const { storeId, supabase } = await resolveActionContext()
  const updatePayload: ProductUpdate = {}

  if (data.name !== undefined) updatePayload.name = data.name.trim()
  if (data.description !== undefined) updatePayload.description = data.description.trim()
  if (data.priceCents !== undefined) updatePayload.price_cents = data.priceCents
  if (data.promoPriceCents !== undefined) updatePayload.promo_price_cents = data.promoPriceCents
  if (data.inPromo !== undefined) updatePayload.in_promo = data.inPromo
  if (data.promoIndefinite !== undefined) updatePayload.promo_indefinite = data.promoIndefinite
  if (data.promoStartDate !== undefined) updatePayload.promo_start_date = data.promoStartDate
  if (data.promoEndDate !== undefined) updatePayload.promo_end_date = data.promoEndDate
  if (data.dailyLimit !== undefined) updatePayload.daily_limit = data.dailyLimit
  if (data.dailyRemaining !== undefined) updatePayload.daily_remaining = data.dailyRemaining
  if (data.imageUrl !== undefined) updatePayload.image_url = data.imageUrl
  if (data.isActive !== undefined) updatePayload.is_active = data.isActive
  if (data.categories !== undefined) updatePayload.tags = data.categories

  if (data.categoryName) {
    const categoryId = await getOrCreateCategory(supabase, storeId, data.categoryName)
    if (categoryId) updatePayload.category_id = categoryId
  }

  const { error } = await supabase
    .from("products")
    .update(updatePayload)
    .eq("id", id)
    .eq("store_id", storeId)

  if (error) {
    console.error("Erro ao atualizar produto:", error)
    throw new Error("Falha ao atualizar produto no banco")
  }

  revalidatePath("/dashboard/menu")
}

/**
 * Exclui um produto do cardápio
 */
export async function deleteMenuProduct(id: string) {
  const { storeId, supabase } = await resolveActionContext()
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("store_id", storeId)

  if (error) {
    console.error("Erro ao excluir produto:", error)
    throw new Error("Falha ao excluir produto")
  }

  revalidatePath("/dashboard/menu")
}

/**
 * Alterna a disponibilidade (Disponível vs Pausado)
 */
export async function toggleProductAvailability(id: string, isAvailable: boolean) {
  const { storeId, supabase } = await resolveActionContext()
  const { error } = await supabase
    .from("products")
    .update({ is_active: isAvailable })
    .eq("id", id)
    .eq("store_id", storeId)

  if (error) {
    console.error("Erro ao alterar disponibilidade:", error)
    throw new Error("Falha ao alterar status de disponibilidade")
  }

  revalidatePath("/dashboard/menu")
}

/**
 * Edição inline rápida de Preço Original
 */
export async function inlineUpdatePrice(id: string, priceCents: number, promoPriceCents?: number | null) {
  const { storeId, supabase } = await resolveActionContext()
  const payload: ProductUpdate = { price_cents: priceCents }
  if (promoPriceCents !== undefined) {
    payload.promo_price_cents = promoPriceCents
  }

  const { error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .eq("store_id", storeId)

  if (error) {
    console.error("Erro ao atualizar preço:", error)
    throw new Error("Falha ao atualizar preço")
  }

  revalidatePath("/dashboard/menu")
}

/**
 * Edição inline rápida de Limite Diário
 */
export async function inlineUpdateDailyLimit(id: string, dailyLimit: number | null, dailyRemaining: number | null) {
  const { storeId, supabase } = await resolveActionContext()
  const { error } = await supabase
    .from("products")
    .update({
      daily_limit: dailyLimit,
      daily_remaining: dailyRemaining
    })
    .eq("id", id)
    .eq("store_id", storeId)

  if (error) {
    console.error("Erro ao atualizar limite diário:", error)
    throw new Error("Falha ao atualizar limite diário")
  }

  revalidatePath("/dashboard/menu")
}

/**
 * Aplica configuração de Preço Promocional
 */
export async function applyPromoDiscount(
  id: string,
  data: {
    promoPriceCents: number
    inPromo: boolean
    promoIndefinite: boolean
    promoStartDate: string | null
    promoEndDate: string | null
  }
) {
  const { storeId, supabase } = await resolveActionContext()
  const { error } = await supabase
    .from("products")
    .update({
      promo_price_cents: data.promoPriceCents,
      in_promo: data.inPromo,
      promo_indefinite: data.promoIndefinite,
      promo_start_date: data.promoStartDate || null,
      promo_end_date: data.promoEndDate || null
    })
    .eq("id", id)
    .eq("store_id", storeId)

  if (error) {
    console.error("Erro ao aplicar promoção:", error)
    throw new Error("Falha ao salvar promoção")
  }

  revalidatePath("/dashboard/menu")
}

/**
 * Desativa Preço Promocional
 */
export async function removePromoDiscount(
  id: string,
  data: {
    promoIndefinite: boolean
    promoStartDate: string | null
    promoEndDate: string | null
  }
) {
  const { storeId, supabase } = await resolveActionContext()
  const { error } = await supabase
    .from("products")
    .update({
      promo_price_cents: null,
      in_promo: false,
      promo_indefinite: data.promoIndefinite,
      promo_start_date: data.promoStartDate || null,
      promo_end_date: data.promoEndDate || null
    })
    .eq("id", id)
    .eq("store_id", storeId)

  if (error) {
    console.error("Erro ao desativar promoção:", error)
    throw new Error("Falha ao desativar promoção")
  }

  revalidatePath("/dashboard/menu")
}

/**
 * Salva a conclusão ou dispensa de um tutorial/spotlight no banco de dados.
 * Persiste por usuário do Clerk para nunca mais incomodar em nenhum dispositivo.
 */
export async function recordTourProgress(tourKey: string, options: { completed?: boolean; dismissed?: boolean }) {
  const { userId } = await auth()
  const targetUserId = userId || (process.env.NODE_ENV === "development" ? "dev_user_rafael" : null)
  if (!targetUserId) return

  let supabase: SupabaseServerClient = createServerSupabaseClient()
  if (!userId && process.env.NODE_ENV === "development") {
    const { createAdminSupabaseClient } = await import("@/lib/supabase/admin")
    supabase = createAdminSupabaseClient() as unknown as SupabaseServerClient
  }

  const now = new Date().toISOString()

  const { error } = await supabase
    .from("user_tour_progress")
    .upsert(
      {
        clerk_user_id: targetUserId,
        tour_key: tourKey,
        completed: options.completed ?? false,
        dismissed: options.dismissed ?? false,
        updated_at: now
      },
      {
        onConflict: "clerk_user_id, tour_key"
      }
    )

  if (error) {
    console.error("Erro ao salvar progresso do tutorial:", error)
  }
}

/**
 * Faz upload de imagem do produto diretamente para o Supabase Storage (bucket 'products')
 */
export async function uploadMenuProductImage(formData: FormData): Promise<{ publicUrl: string }> {
  const file = formData.get("file") as File
  if (!file) throw new Error("Nenhum arquivo enviado")

  const { storeId, supabase } = await resolveActionContext()

  const buffer = Buffer.from(await file.arrayBuffer())
  const fileExt = file.name.split(".").pop() || "jpg"
  const cleanFileName = `${storeId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`

  const { error } = await supabase.storage
    .from("products")
    .upload(cleanFileName, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: true
    })

  if (error) {
    console.error("Erro ao fazer upload para o storage:", error)
    throw new Error("Falha ao salvar imagem no storage")
  }

  const { data: { publicUrl } } = supabase.storage
    .from("products")
    .getPublicUrl(cleanFileName)

  return { publicUrl }
}

export interface ComplementInput {
  id?: string
  name: string
  description?: string
  priceCents: number
  imageUrl?: string
  isActive?: boolean
  sortOrder?: number
}

/**
 * Salva a lista completa de adicionais (complementos) de um produto no Supabase.
 */
export async function saveProductComplements(
  productId: string,
  complements: ComplementInput[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { storeId, supabase } = await resolveActionContext()

    // 1. Obter IDs dos adicionais enviados que já existem no banco
    const existingIds = complements.filter(c => c.id && !c.id.startsWith("temp-")).map(c => c.id as string)

    // 2. Remover adicionais que foram excluídos
    if (existingIds.length > 0) {
      await supabase
        .from("product_complements")
        .delete()
        .eq("product_id", productId)
        .eq("store_id", storeId)
        .not("id", "in", `(${existingIds.join(",")})`)
    } else {
      await supabase
        .from("product_complements")
        .delete()
        .eq("product_id", productId)
        .eq("store_id", storeId)
    }

    // 3. Upsert dos adicionais
    const rowsToUpsert = complements.map((c, idx) => ({
      ...(c.id && !c.id.startsWith("temp-") ? { id: c.id } : {}),
      store_id: storeId,
      product_id: productId,
      name: c.name.trim(),
      description: c.description?.trim() || null,
      price_cents: Math.max(0, c.priceCents || 0),
      image_url: c.imageUrl?.trim() || null,
      is_active: c.isActive !== false,
      sort_order: idx + 1,
      updated_at: new Date().toISOString()
    }))

    if (rowsToUpsert.length > 0) {
      const { error: upsertErr } = await supabase
        .from("product_complements")
        .upsert(rowsToUpsert)

      if (upsertErr) {
        console.error("Erro ao fazer upsert em product_complements:", upsertErr)
        return { success: false, error: upsertErr.message }
      }
    }

    revalidatePath("/dashboard/menu")
    return { success: true }
  } catch (err: unknown) {
    console.error("Erro em saveProductComplements:", err)
    const errorMsg = err instanceof Error ? err.message : "Erro desconhecido"
    return { success: false, error: errorMsg }
  }
}
