import "server-only"

import { createPublicStoreService } from "./public-store.internal"
import { createPublicStoreRepository } from "./public-store.repository"

export type { PublicStore, GetPublicStoreResult } from "./public-store.internal"
export { PublicStoreReadError } from "./public-store.internal"

export async function getPublicStoreBySlug(slug: string) {
  return createPublicStoreService(
    createPublicStoreRepository()
  ).getPublicStoreBySlug(slug)
}
