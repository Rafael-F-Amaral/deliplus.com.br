import "server-only"

import type {
  StoreSetupRecord,
  StoreSetupRepository,
  StoreSetupRepositoryResult,
  StoreSetupUpdateFields,
} from "./store-setup.repository"
import type {
  StoreSetupStatus,
  StoreSetupValidationIssue,
} from "./store-setup.rules"

export type StoreSetupView = {
  id: string
  name: string
  slug: string
  status: StoreSetupStatus
  updatedAt: string
}

export type CreateDraftStoreInput = {
  name: string
  slug: string
}

export type UpdateStoreSetupInput = {
  name?: string
  slug?: string
}

type StoreSetupPreconditionFailure =
  | { status: "unauthenticated" }
  | { status: "no_active_organization" }
  | { status: "forbidden" }
  | { status: "organization_not_provisioned" }

type StoreSetupResourceFailure =
  | { status: "store_unavailable" }
  | { status: "slug_unavailable" }
  | { status: "setup_changed" }
  | { status: "validation_error"; issue: StoreSetupValidationIssue }

export type ListStoresForSetupResult =
  | StoreSetupPreconditionFailure
  | { status: "success"; stores: StoreSetupView[] }

export type StoreForSetupResult =
  | StoreSetupPreconditionFailure
  | StoreSetupResourceFailure
  | { status: "success"; store: StoreSetupView }

type StoreSetupAuth = {
  userId: string | null
  orgId: string | null | undefined
  isAdmin: boolean
}

type StoreSetupDependencies = {
  getAuth: () => Promise<StoreSetupAuth>
  repository: StoreSetupRepository
  rules: {
    isStoreId: (value: unknown) => value is string
    validateName: (
      value: unknown
    ) =>
      | { valid: true; value: string }
      | { valid: false; issue: StoreSetupValidationIssue }
    validateSlug: (
      value: unknown
    ) =>
      | { valid: true; value: string }
      | { valid: false; issue: StoreSetupValidationIssue }
    validatePersistedSlug: (
      value: unknown
    ) =>
      | { valid: true; value: string }
      | { valid: false; issue: StoreSetupValidationIssue }
  }
}

type AuthorizedOrganization = {
  status: "authorized"
  organizationId: string
}

type AuthorizationResult =
  AuthorizedOrganization | StoreSetupPreconditionFailure

export class StoreSetupError extends Error {
  constructor(cause?: unknown) {
    super("Unable to complete Store setup operation", { cause })
    this.name = "StoreSetupError"
  }
}

function toStoreSetupError(cause?: unknown) {
  return cause instanceof StoreSetupError ? cause : new StoreSetupError(cause)
}

function isInputRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function toStoreSetupView(store: StoreSetupRecord): StoreSetupView {
  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    status: store.status,
    updatedAt: store.updatedAt,
  }
}

function unexpectedRepositoryResult<T>(
  result: StoreSetupRepositoryResult<T>
): never {
  if (result.status === "failure") {
    throw toStoreSetupError(result.cause)
  }

  throw new StoreSetupError()
}

function validationFailure(
  issue: StoreSetupValidationIssue
): StoreSetupResourceFailure {
  return { status: "validation_error", issue }
}

export function createStoreSetupService(dependencies: StoreSetupDependencies) {
  async function authorizeOrganization(): Promise<AuthorizationResult> {
    let authState: StoreSetupAuth

    try {
      authState = await dependencies.getAuth()
    } catch (cause) {
      throw toStoreSetupError(cause)
    }

    if (!authState.userId) {
      return { status: "unauthenticated" }
    }

    if (!authState.orgId) {
      return { status: "no_active_organization" }
    }

    if (!authState.isAdmin) {
      return { status: "forbidden" }
    }

    let organizationResult: StoreSetupRepositoryResult<{ id: string }>

    try {
      organizationResult = await dependencies.repository.findOrganization(
        authState.orgId
      )
    } catch (cause) {
      throw toStoreSetupError(cause)
    }

    if (organizationResult.status === "not_found") {
      return { status: "organization_not_provisioned" }
    }

    if (organizationResult.status !== "success") {
      return unexpectedRepositoryResult(organizationResult)
    }

    return {
      status: "authorized",
      organizationId: organizationResult.data.id,
    }
  }

  async function findAuthorizedStore(
    organizationId: string,
    storeId: string
  ): Promise<StoreSetupRecord | null> {
    if (!dependencies.rules.isStoreId(storeId)) {
      return null
    }

    let storeResult: StoreSetupRepositoryResult<StoreSetupRecord>

    try {
      storeResult = await dependencies.repository.findStore(
        organizationId,
        storeId
      )
    } catch (cause) {
      throw toStoreSetupError(cause)
    }

    if (storeResult.status === "not_found") {
      return null
    }

    if (storeResult.status !== "success") {
      return unexpectedRepositoryResult(storeResult)
    }

    return storeResult.data
  }

  return {
    async listStoresForSetup(): Promise<ListStoresForSetupResult> {
      const authorization = await authorizeOrganization()

      if (authorization.status !== "authorized") {
        return authorization
      }

      let storesResult: StoreSetupRepositoryResult<StoreSetupRecord[]>

      try {
        storesResult = await dependencies.repository.listStores(
          authorization.organizationId
        )
      } catch (cause) {
        throw toStoreSetupError(cause)
      }

      if (storesResult.status !== "success") {
        return unexpectedRepositoryResult(storesResult)
      }

      return {
        status: "success",
        stores: storesResult.data.map(toStoreSetupView),
      }
    },

    async getStoreForSetup(storeId: string): Promise<StoreForSetupResult> {
      const authorization = await authorizeOrganization()

      if (authorization.status !== "authorized") {
        return authorization
      }

      const store = await findAuthorizedStore(
        authorization.organizationId,
        storeId
      )

      return store
        ? { status: "success", store: toStoreSetupView(store) }
        : { status: "store_unavailable" }
    },

    async createDraftStore(
      input: CreateDraftStoreInput
    ): Promise<StoreForSetupResult> {
      const authorization = await authorizeOrganization()

      if (authorization.status !== "authorized") {
        return authorization
      }

      if (!isInputRecord(input)) {
        return validationFailure({ field: "input", code: "invalid_type" })
      }

      const nameResult = dependencies.rules.validateName(input.name)

      if (!nameResult.valid) {
        return validationFailure(nameResult.issue)
      }

      const slugResult = dependencies.rules.validateSlug(input.slug)

      if (!slugResult.valid) {
        return validationFailure(slugResult.issue)
      }

      let createResult: StoreSetupRepositoryResult<StoreSetupRecord>

      try {
        createResult = await dependencies.repository.createDraftStore(
          authorization.organizationId,
          nameResult.value,
          slugResult.value
        )
      } catch (cause) {
        throw toStoreSetupError(cause)
      }

      if (createResult.status === "slug_unavailable") {
        return { status: "slug_unavailable" }
      }

      if (createResult.status !== "success") {
        return unexpectedRepositoryResult(createResult)
      }

      return {
        status: "success",
        store: toStoreSetupView(createResult.data),
      }
    },

    async updateStoreSetup(
      storeId: string,
      input: UpdateStoreSetupInput
    ): Promise<StoreForSetupResult> {
      const authorization = await authorizeOrganization()

      if (authorization.status !== "authorized") {
        return authorization
      }

      const store = await findAuthorizedStore(
        authorization.organizationId,
        storeId
      )

      if (
        !store ||
        (store.status !== "draft" && store.status !== "ready") ||
        store.activatedAt !== null
      ) {
        return { status: "store_unavailable" }
      }

      if (!isInputRecord(input)) {
        return validationFailure({ field: "input", code: "invalid_type" })
      }

      const fields: StoreSetupUpdateFields = {}
      let changed = false

      if (Object.hasOwn(input, "name")) {
        const nameResult = dependencies.rules.validateName(input.name)

        if (!nameResult.valid) {
          return validationFailure(nameResult.issue)
        }

        if (nameResult.value !== store.name) {
          fields.name = nameResult.value
          changed = true
        }
      }

      if (Object.hasOwn(input, "slug")) {
        const slugResult = dependencies.rules.validateSlug(input.slug)

        if (!slugResult.valid) {
          return validationFailure(slugResult.issue)
        }

        if (slugResult.value !== store.slug) {
          fields.slug = slugResult.value
          changed = true
        }
      }

      if (!changed) {
        return { status: "success", store: toStoreSetupView(store) }
      }

      let updateResult: StoreSetupRepositoryResult<StoreSetupRecord>

      try {
        updateResult = await dependencies.repository.updateStoreSetup(
          authorization.organizationId,
          store.id,
          store.updatedAt,
          fields
        )
      } catch (cause) {
        throw toStoreSetupError(cause)
      }

      if (updateResult.status === "slug_unavailable") {
        return { status: "slug_unavailable" }
      }

      if (
        updateResult.status === "setup_changed" ||
        updateResult.status === "not_found"
      ) {
        return { status: "setup_changed" }
      }

      if (updateResult.status !== "success") {
        return unexpectedRepositoryResult(updateResult)
      }

      if (
        (updateResult.data.status !== "draft" &&
          updateResult.data.status !== "ready") ||
        updateResult.data.activatedAt !== null
      ) {
        throw new StoreSetupError()
      }

      return {
        status: "success",
        store: toStoreSetupView(updateResult.data),
      }
    },

    async markStoreReady(storeId: string): Promise<StoreForSetupResult> {
      const authorization = await authorizeOrganization()

      if (authorization.status !== "authorized") {
        return authorization
      }

      const store = await findAuthorizedStore(
        authorization.organizationId,
        storeId
      )

      if (
        !store ||
        (store.status !== "draft" && store.status !== "ready") ||
        store.activatedAt !== null
      ) {
        return { status: "store_unavailable" }
      }

      const nameResult = dependencies.rules.validateName(store.name)

      if (!nameResult.valid) {
        return validationFailure(nameResult.issue)
      }

      const slugResult = dependencies.rules.validatePersistedSlug(store.slug)

      if (!slugResult.valid) {
        return validationFailure(slugResult.issue)
      }

      if (store.status === "ready") {
        return { status: "success", store: toStoreSetupView(store) }
      }

      let readyResult: StoreSetupRepositoryResult<StoreSetupRecord>

      try {
        readyResult = await dependencies.repository.markStoreReady(
          authorization.organizationId,
          store.id,
          store.updatedAt
        )
      } catch (cause) {
        throw toStoreSetupError(cause)
      }

      if (
        readyResult.status === "setup_changed" ||
        readyResult.status === "not_found"
      ) {
        return { status: "setup_changed" }
      }

      if (readyResult.status !== "success") {
        return unexpectedRepositoryResult(readyResult)
      }

      if (
        readyResult.data.status !== "ready" ||
        readyResult.data.activatedAt !== null
      ) {
        throw new StoreSetupError()
      }

      return {
        status: "success",
        store: toStoreSetupView(readyResult.data),
      }
    },
  }
}
