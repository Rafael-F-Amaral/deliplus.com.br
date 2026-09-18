import { normalizeStoreSlug } from "@/lib/stores/store-setup.rules"

export type NewStoreFields = {
  name: string
  slug: string
  slugEdited: boolean
}

export function createInitialNewStoreFields(name = ""): NewStoreFields {
  return {
    name,
    slug: normalizeStoreSlug(name),
    slugEdited: false,
  }
}

export function applyStoreNameChange(
  fields: NewStoreFields,
  name: string
): NewStoreFields {
  return {
    ...fields,
    name,
    slug: fields.slugEdited ? fields.slug : normalizeStoreSlug(name),
  }
}

export function applyStoreSlugChange(
  fields: NewStoreFields,
  slug: string
): NewStoreFields {
  return { ...fields, slug, slugEdited: true }
}
