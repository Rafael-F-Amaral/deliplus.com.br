import "server-only"

import { activateFirstStoreWithInitialTrial } from "./activate-first-store-with-initial-trial"
import { activateStoreWithinEntitlement } from "./activate-store-within-entitlement"
import { createActivateStoreForCurrentOrganization } from "./activate-store-for-current-organization.internal"

const activateStoreForRequest = createActivateStoreForCurrentOrganization({
  activateWithinEntitlement: activateStoreWithinEntitlement,
  activateWithInitialTrial: activateFirstStoreWithInitialTrial,
})

export async function activateStoreForCurrentOrganization(storeId: string) {
  return activateStoreForRequest(storeId)
}

export {
  StoreActivationCoordinatorError,
  type StoreActivationCoordinatorResult,
} from "./activate-store-for-current-organization.internal"
