import "server-only"

import { auth } from "@clerk/nextjs/server"

import {
  createStoreSetupService,
  type CreateDraftStoreInput,
  type UpdateStoreSetupInput,
} from "./store-setup.internal"
import { createStoreSetupRepository } from "./store-setup.repository"
import {
  isStoreId,
  validateAndNormalizeStoreName,
  validateAndNormalizeStoreSlug,
  validatePersistedStoreSlug,
} from "./store-setup.rules"

const storeSetupService = createStoreSetupService({
  async getAuth() {
    const { userId, orgId, has } = await auth()

    return {
      userId,
      orgId,
      isAdmin: Boolean(userId && orgId && has({ role: "org:admin" })),
    }
  },
  repository: createStoreSetupRepository(),
  rules: {
    isStoreId,
    validateName: validateAndNormalizeStoreName,
    validateSlug: validateAndNormalizeStoreSlug,
    validatePersistedSlug: validatePersistedStoreSlug,
  },
})

export async function listStoresForSetup() {
  return storeSetupService.listStoresForSetup()
}

export async function getStoreForSetup(storeId: string) {
  return storeSetupService.getStoreForSetup(storeId)
}

export async function createDraftStore(input: CreateDraftStoreInput) {
  return storeSetupService.createDraftStore(input)
}

export async function updateStoreSetup(
  storeId: string,
  input: UpdateStoreSetupInput
) {
  return storeSetupService.updateStoreSetup(storeId, input)
}

export async function markStoreReady(storeId: string) {
  return storeSetupService.markStoreReady(storeId)
}

export {
  StoreSetupError,
  type CreateDraftStoreInput,
  type ListStoresForSetupResult,
  type StoreForSetupResult,
  type StoreSetupView,
  type UpdateStoreSetupInput,
} from "./store-setup.internal"
