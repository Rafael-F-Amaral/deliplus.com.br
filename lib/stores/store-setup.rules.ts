export const STORE_SETUP_STATUSES = [
  "draft",
  "ready",
  "active",
  "inactive",
] as const

export type StoreSetupStatus = (typeof STORE_SETUP_STATUSES)[number]

export const RESERVED_STORE_SLUGS = [
  "api",
  "dashboard",
  "sign-in",
  "sign-up",
  "pricing",
  "trpc",
] as const

export type StoreSetupValidationField = "input" | "name" | "slug"

export type StoreSetupValidationCode =
  | "invalid_type"
  | "required"
  | "too_short"
  | "too_long"
  | "invalid_format"
  | "reserved"

export type StoreSetupValidationIssue = {
  field: StoreSetupValidationField
  code: StoreSetupValidationCode
}

export type StoreSetupValidationResult<T> =
  { valid: true; value: T } | { valid: false; issue: StoreSetupValidationIssue }

const STORE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const STORE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const RESERVED_STORE_SLUG_SET = new Set<string>(RESERVED_STORE_SLUGS)

export function isStoreSetupStatus(value: unknown): value is StoreSetupStatus {
  return STORE_SETUP_STATUSES.some((status) => status === value)
}

export function isStoreId(value: unknown): value is string {
  return typeof value === "string" && STORE_ID_PATTERN.test(value)
}

export function validateAndNormalizeStoreName(
  value: unknown
): StoreSetupValidationResult<string> {
  if (typeof value !== "string") {
    return {
      valid: false,
      issue: { field: "name", code: "invalid_type" },
    }
  }

  const name = value.trim()

  if (!name) {
    return {
      valid: false,
      issue: { field: "name", code: "required" },
    }
  }

  return { valid: true, value: name }
}

export function normalizeStoreSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_./\\|–—]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function isReservedStoreSlug(slug: string) {
  return RESERVED_STORE_SLUG_SET.has(slug)
}

function validateCanonicalStoreSlug(
  slug: string
): StoreSetupValidationResult<string> {
  if (slug.length < 3) {
    return {
      valid: false,
      issue: { field: "slug", code: "too_short" },
    }
  }

  if (slug.length > 63) {
    return {
      valid: false,
      issue: { field: "slug", code: "too_long" },
    }
  }

  if (!STORE_SLUG_PATTERN.test(slug)) {
    return {
      valid: false,
      issue: { field: "slug", code: "invalid_format" },
    }
  }

  if (isReservedStoreSlug(slug)) {
    return {
      valid: false,
      issue: { field: "slug", code: "reserved" },
    }
  }

  return { valid: true, value: slug }
}

export function validateAndNormalizeStoreSlug(
  value: unknown
): StoreSetupValidationResult<string> {
  if (typeof value !== "string") {
    return {
      valid: false,
      issue: { field: "slug", code: "invalid_type" },
    }
  }

  return validateCanonicalStoreSlug(normalizeStoreSlug(value))
}

export function validatePersistedStoreSlug(
  value: unknown
): StoreSetupValidationResult<string> {
  if (typeof value !== "string") {
    return {
      valid: false,
      issue: { field: "slug", code: "invalid_type" },
    }
  }

  if (normalizeStoreSlug(value) !== value) {
    return {
      valid: false,
      issue: { field: "slug", code: "invalid_format" },
    }
  }

  return validateCanonicalStoreSlug(value)
}
