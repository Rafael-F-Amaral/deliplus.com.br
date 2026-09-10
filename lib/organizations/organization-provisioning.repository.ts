import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "../supabase/database.types"
import type { InternalOrganization } from "./ensure-active-organization.internal"

type AdminSupabaseClient = SupabaseClient<Database>

export type OrganizationProvisioningFailureCategory =
  | "configuration"
  | "transport"
  | "postgrest"
  | "database"
  | "trusted_rpc"
  | "invariant"
  | "unexpected"

export type OrganizationProvisioningFailureStage =
  | "admin_client_creation"
  | "trusted_rpc_request"
  | "trusted_rpc_result"
  | "response_normalization"
  | "unknown"

export class OrganizationProvisioningRepositoryError extends Error {
  readonly category: OrganizationProvisioningFailureCategory
  readonly stage: OrganizationProvisioningFailureStage
  readonly errorCode?: string

  constructor(
    category: OrganizationProvisioningFailureCategory,
    stage: OrganizationProvisioningFailureStage,
    cause?: unknown,
    errorCode?: string
  ) {
    super("Unable to ensure the Organization projection", { cause })
    this.name = "OrganizationProvisioningRepositoryError"
    this.category = category
    this.stage = stage
    this.errorCode = errorCode
  }
}

function safeErrorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return undefined
  }

  const code = error.code

  return typeof code === "string" && /^(?:PGRST\d{3}|[A-Z0-9]{5})$/u.test(code)
    ? code
    : undefined
}

function returnedErrorCategory(
  code: string | undefined
): OrganizationProvisioningFailureCategory {
  if (code?.startsWith("PGRST")) return "postgrest"
  if (code) return "database"
  return "trusted_rpc"
}

function normalizeOrganizationProjection(
  data: unknown,
  expectedClerkOrganizationId: string
): InternalOrganization {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    !("id" in data) ||
    !("clerk_organization_id" in data) ||
    typeof data.id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(
      data.id
    ) ||
    data.clerk_organization_id !== expectedClerkOrganizationId
  ) {
    throw new OrganizationProvisioningRepositoryError(
      "invariant",
      "response_normalization"
    )
  }

  return {
    id: data.id,
    clerkOrganizationId: data.clerk_organization_id,
  }
}

export function createOrganizationProvisioningRepository(
  createAdminClient: () => AdminSupabaseClient
) {
  return {
    async ensureOrganization(
      clerkOrganizationId: string
    ): Promise<InternalOrganization> {
      let supabase: AdminSupabaseClient

      try {
        supabase = createAdminClient()
      } catch (cause) {
        throw new OrganizationProvisioningRepositoryError(
          "configuration",
          "admin_client_creation",
          cause
        )
      }

      let response

      try {
        response = await supabase
          .rpc("ensure_organization_projection", {
            p_clerk_organization_id: clerkOrganizationId,
          })
          .single()
      } catch (cause) {
        throw new OrganizationProvisioningRepositoryError(
          "transport",
          "trusted_rpc_request",
          cause
        )
      }

      if (response.error) {
        const errorCode = safeErrorCode(response.error)

        throw new OrganizationProvisioningRepositoryError(
          returnedErrorCategory(errorCode),
          "trusted_rpc_result",
          response.error,
          errorCode
        )
      }

      return normalizeOrganizationProjection(response.data, clerkOrganizationId)
    },
  }
}

export function safeOrganizationProvisioningDiagnostic(error: unknown) {
  if (error instanceof OrganizationProvisioningRepositoryError) {
    return {
      boundary: "ensure_organization_projection",
      category: error.category,
      stage: error.stage,
      ...(error.errorCode ? { errorCode: error.errorCode } : {}),
    }
  }

  return {
    boundary: "ensure_organization_projection",
    category: "unexpected",
    stage: "unknown",
  }
}

export function reportOrganizationProvisioningFailure(error: unknown) {
  if (process.env.NODE_ENV !== "development") return

  console.error(
    "Organization provisioning failed",
    safeOrganizationProvisioningDiagnostic(error)
  )
}
