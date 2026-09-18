import "server-only"

import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createServerSupabaseClient } from "@/lib/supabase/server"

import { isStoreSetupStatus, type StoreSetupStatus } from "./store-setup.rules"

export type StoreSetupOrganizationRecord = {
  id: string
}

export type StoreSetupRecord = {
  id: string
  name: string
  slug: string
  status: StoreSetupStatus
  activatedAt: string | null
  updatedAt: string
}

export type StoreSetupRepositoryResult<T> =
  | { status: "success"; data: T }
  | { status: "not_found" }
  | { status: "slug_unavailable" }
  | { status: "setup_changed" }
  | { status: "failure"; cause: unknown }

export type StoreSetupUpdateFields = {
  name?: string
  slug?: string
}

export type StoreSetupRepository = {
  findOrganization: (
    clerkOrganizationId: string
  ) => Promise<StoreSetupRepositoryResult<StoreSetupOrganizationRecord>>
  listStores: (
    organizationId: string
  ) => Promise<StoreSetupRepositoryResult<StoreSetupRecord[]>>
  findStore: (
    organizationId: string,
    storeId: string
  ) => Promise<StoreSetupRepositoryResult<StoreSetupRecord>>
  createDraftStore: (
    organizationId: string,
    name: string,
    slug: string
  ) => Promise<StoreSetupRepositoryResult<StoreSetupRecord>>
  updateStoreSetup: (
    organizationId: string,
    storeId: string,
    expectedUpdatedAt: string,
    fields: StoreSetupUpdateFields
  ) => Promise<StoreSetupRepositoryResult<StoreSetupRecord>>
  markStoreReady: (
    organizationId: string,
    storeId: string,
    expectedUpdatedAt: string
  ) => Promise<StoreSetupRepositoryResult<StoreSetupRecord>>
}

const STORE_SETUP_SELECT =
  "id, name, slug, status, activated_at, updated_at" as const

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  )
}

function toStoreSetupRecord(value: {
  id: string
  name: string
  slug: string
  status: string
  activated_at: string | null
  updated_at: string
}): StoreSetupRecord {
  if (!isStoreSetupStatus(value.status)) {
    throw new Error("Invalid persisted Store lifecycle status")
  }

  return {
    id: value.id,
    name: value.name,
    slug: value.slug,
    status: value.status,
    activatedAt: value.activated_at,
    updatedAt: value.updated_at,
  }
}

function mapStoreData<T extends Parameters<typeof toStoreSetupRecord>[0]>(
  data: T
): StoreSetupRepositoryResult<StoreSetupRecord> {
  try {
    return { status: "success", data: toStoreSetupRecord(data) }
  } catch (cause) {
    return { status: "failure", cause }
  }
}

export function createStoreSetupRepository(): StoreSetupRepository {
  return {
    async findOrganization(clerkOrganizationId) {
      const supabase = createServerSupabaseClient()
      const { data, error } = await supabase
        .from("organizations")
        .select("id")
        .eq("clerk_organization_id", clerkOrganizationId)
        .maybeSingle()

      if (error) {
        return { status: "failure", cause: error }
      }

      if (!data) {
        return { status: "not_found" }
      }

      return { status: "success", data }
    },

    async listStores(organizationId) {
      const supabase = createServerSupabaseClient()
      const { data, error } = await supabase
        .from("stores")
        .select(STORE_SETUP_SELECT)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })

      if (error) {
        return { status: "failure", cause: error }
      }

      try {
        return {
          status: "success",
          data: data.map(toStoreSetupRecord),
        }
      } catch (cause) {
        return { status: "failure", cause }
      }
    },

    async findStore(organizationId, storeId) {
      const supabase = createServerSupabaseClient()
      const { data, error } = await supabase
        .from("stores")
        .select(STORE_SETUP_SELECT)
        .eq("id", storeId)
        .eq("organization_id", organizationId)
        .maybeSingle()

      if (error) {
        return { status: "failure", cause: error }
      }

      if (!data) {
        return { status: "not_found" }
      }

      return mapStoreData(data)
    },

    async createDraftStore(organizationId, name, slug) {
      const supabase = createAdminSupabaseClient()
      const { data, error } = await supabase
        .rpc("create_store_draft", {
          p_organization_id: organizationId,
          p_name: name,
          p_slug: slug,
        })
        .maybeSingle()

      if (error) {
        return isUniqueViolation(error)
          ? { status: "slug_unavailable" }
          : { status: "failure", cause: error }
      }

      if (!data) {
        return { status: "failure", cause: new Error("Missing Store result") }
      }

      return mapStoreData(data)
    },

    async updateStoreSetup(organizationId, storeId, expectedUpdatedAt, fields) {
      const supabase = createAdminSupabaseClient()
      const { data, error } = await supabase
        .rpc("update_store_setup", {
          p_organization_id: organizationId,
          p_store_id: storeId,
          p_expected_updated_at: expectedUpdatedAt,
          p_set_name: fields.name !== undefined,
          p_name: fields.name ?? "",
          p_set_slug: fields.slug !== undefined,
          p_slug: fields.slug ?? "",
        })
        .maybeSingle()

      if (error) {
        return isUniqueViolation(error)
          ? { status: "slug_unavailable" }
          : { status: "failure", cause: error }
      }

      if (!data) {
        return { status: "setup_changed" }
      }

      return mapStoreData(data)
    },

    async markStoreReady(organizationId, storeId, expectedUpdatedAt) {
      const supabase = createAdminSupabaseClient()
      const { data, error } = await supabase
        .rpc("mark_store_ready", {
          p_organization_id: organizationId,
          p_store_id: storeId,
          p_expected_updated_at: expectedUpdatedAt,
        })
        .maybeSingle()

      if (error) {
        return { status: "failure", cause: error }
      }

      if (!data) {
        return { status: "setup_changed" }
      }

      return mapStoreData(data)
    },
  }
}
