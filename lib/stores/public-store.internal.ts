import "server-only"

import { validatePersistedStoreSlug } from "./store-setup.rules"

export type PublicStore = { name: string; slug: string }

export type GetPublicStoreResult =
  { status: "found"; store: PublicStore } | { status: "not_found" }

export class PublicStoreReadError extends Error {
  constructor(cause?: unknown) {
    super("Unable to read public Store", { cause })
    this.name = "PublicStoreReadError"
  }
}

export function createPublicStoreService(repository: {
  findBySlug: (slug: string) => Promise<unknown>
}) {
  return {
    async getPublicStoreBySlug(slug: string): Promise<GetPublicStoreResult> {
      // Public URLs must already be canonical; do not turn malformed input into
      // an unrelated Store's valid slug using the setup form's normalization.
      if (!validatePersistedStoreSlug(slug).valid) {
        return { status: "not_found" }
      }

      try {
        const rows = await repository.findBySlug(slug)
        if (!Array.isArray(rows) || rows.length > 1) {
          throw new PublicStoreReadError()
        }
        if (rows.length === 0) return { status: "not_found" }

        const row = rows[0]
        if (
          !row ||
          typeof row.name !== "string" ||
          !row.name.trim() ||
          row.slug !== slug
        ) {
          throw new PublicStoreReadError()
        }

        return { status: "found", store: { name: row.name, slug: row.slug } }
      } catch (cause) {
        throw cause instanceof PublicStoreReadError
          ? cause
          : new PublicStoreReadError(cause)
      }
    },
  }
}
