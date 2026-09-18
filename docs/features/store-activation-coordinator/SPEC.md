# Deli Plus — First Store Setup and Activation Coordinator

**Status:** Implemented  
**Scope:** Functional first-Store UI and safe activation orchestration  
**Last updated:** 2026-09-11

## Goal

Allow an Organization admin to create and publish the first Store in one merchant-facing
step without moving lifecycle, trial, entitlement, capacity, or tenant authority into
the UI.

## Routes and mutations

```text
/dashboard/stores/new
  -> createDraftStore({ name, slug })
  -> markStoreReady(storeId)
  -> activateStoreForCurrentOrganization(storeId)
  -> /dashboard?storePublished=1

/dashboard/stores/[storeId]/setup
  -> updateStoreSetup(storeId, { name, slug })
  -> markStoreReady(storeId)
  -> activateStoreForCurrentOrganization(storeId)
  -> /dashboard
```

The first-Store Server Action explicitly orchestrates each existing transition; it does
not combine or bypass them. `createDraftStore()` already persists the only current
readiness facts, `name` and `slug`, so the happy path does not perform a redundant
`updateStoreSetup()`. Rendering and GET navigation perform no mutation.

When the active Organization has no Stores, the Server Component uses the active
Clerk session's `orgId` to read the Clerk Organization name and supplies it only as the
form's initial Store name. The slug suggestion is derived from that initial name. The
default is omitted after any Store exists, and a missing Clerk name safely leaves both
fields empty. No Organization name is synchronized to PostgreSQL.

If readiness or activation fails after creation, the Action returns the created Store
selector and last durable stage. A retry resumes from that stage instead of creating a
second Store. The existing setup route remains the explicit editing and recovery path.

## Public activation contract

```ts
type StoreActivationCoordinatorResult =
  | { status: "activated"; storeId: string }
  | { status: "already_active"; storeId: string }
  | { status: "not_ready" }
  | { status: "subscription_required" }
  | { status: "capacity_reached" }
  | { status: "store_unavailable" }
  | { status: "unauthenticated" }
  | { status: "no_active_organization" }
  | { status: "organization_not_provisioned" }
  | { status: "not_admin" }

activateStoreForCurrentOrganization(
  storeId: string
): Promise<StoreActivationCoordinatorResult>
```

Unexpected dependency or infrastructure failures throw the sanitized server-only
`StoreActivationCoordinatorError`.

## Activation decision and race safety

The coordinator uses this bounded protocol:

```text
activateStoreWithinEntitlement(storeId)
  -> activated/already_active/other safe outcome: return
  -> not_entitled:
       activateFirstStoreWithInitialTrial(storeId)
         -> activated/already_activated: success
         -> trial_not_eligible:
              retry activateStoreWithinEntitlement(storeId) once
                -> still not_entitled: subscription_required
```

The generic operation is attempted first so paid Essential, Duo, Trio, manual override,
and an existing valid trial never create a new trial. The one-time retry covers an
entitlement that appears while the initial-trial operation waits for the shared
Organization lock. Both existing RPCs remain authoritative and transactional; the
coordinator performs no entitlement read, trial eligibility check, capacity count, or
Store write itself.

## Authorization and browser authority

The underlying operations reauthenticate and require the active Clerk Organization's
`org:admin` role. Their RPCs rederive Organization and role from the verified JWT. A
Store UUID is only a resource selector. Browser inputs cannot choose Organization,
Clerk identity, role, entitlement source, plan, capacity, trial eligibility, lifecycle,
or activation timestamps. Missing and cross-tenant Stores remain indistinguishable.

## Frontend boundary

Frontend work may call:

```text
getDashboardOverview()
listStoresForSetup()
getStoreForSetup(storeId)
createDraftStore({ name, slug })
updateStoreSetup(storeId, { name?, slug? })
markStoreReady(storeId)
activateStoreForCurrentOrganization(storeId)
deactivateStore(storeId)
```

Normal frontend work must not import or choose between:

```text
activateFirstStoreWithInitialTrial(storeId)
activateStoreWithinEntitlement(storeId)
```

## No-entitlement UX

`subscription_required` displays a safe message and link to `/dashboard/billing`.
Publishing never starts Stripe Checkout automatically.

## Data and migration impact

The coordinator itself requires no schema or activation-RPC change. Manual E2E exposed
that the pre-existing Store setup repository lacked an executable trusted-write path;
migration `20260911120000_store_setup_trusted_writes.sql` adds three service-role-only
setup RPCs while retaining zero direct `service_role` privileges on `public.stores`.
Trial, entitlement, capacity, and activation RPCs remain unchanged.

## Verification

Focused tests cover paid plans, existing trial, initial trial, unavailable trial,
readiness, idempotency, capacity, member denial, cross-tenant selectors, unexpected
failures, race recheck, slug suggestion/manual editing, the one-step first-Store flow,
Organization-name initialization for zero Stores, omission for existing Stores, safe
missing-name fallback, partial-failure resume without duplicate creation, all
setup-route mutations, redirect behavior, and frontend import boundaries. Existing
Store trial/entitlement SQL and concurrency suites remain the authority for grant
cardinality and transaction-level locking.
