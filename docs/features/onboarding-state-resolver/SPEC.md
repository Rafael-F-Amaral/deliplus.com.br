# Deli Plus — Onboarding State Resolver

**Path:** `docs/features/onboarding-state-resolver/SPEC.md`<br>
**Status:** Approved<br>
**Scope:** Read-only resolution of the initial onboarding state<br>
**Last updated:** 2026-08-24

## 1. Purpose

This feature introduces a server-side, read-only resolver that determines the current onboarding state from verified Clerk authentication context and tenant data visible through Supabase Row Level Security (RLS).

The resolver answers only whether:

- the request is authenticated;
- an active Clerk Organization exists;
- that active Organization has already been provisioned as a Deli Plus `public.organizations` row.

It does not perform onboarding, provisioning, redirects, billing checks, Store checks, or any mutation.

## 2. Approved scope

The feature must provide:

- an `OnboardingState` discriminated union containing only the four approved initial states;
- a server-only `resolveOnboardingState()` operation;
- a read of `public.organizations` through the normal server Supabase client;
- safe derivation of `canProvision` from the verified Clerk Organization role;
- explicit handling of infrastructure and resolution failures;
- focused automated tests for state resolution, tenant isolation, and boundary constraints;
- a dedicated `test:onboarding-state-resolver` Yarn script.

## 3. Architectural context

This feature applies the decisions already established by:

- ADR-001 — Tenant, Store and billing ownership model;
- ADR-002 — Store-level access model;
- ADR-003 — tenant provisioning boundary.

Clerk remains the source of truth for:

- authentication;
- the current Clerk user;
- the active Clerk Organization;
- Clerk Organization membership and role.

Supabase/PostgreSQL remains the source of truth for:

- the internal Deli Plus Organization identifier;
- whether the active Clerk Organization has a matching `public.organizations` row;
- tenant isolation enforced by RLS.

The existing tenant-core RLS policy is a required security boundary. The resolver must not bypass it.

## 4. Initial state model

The result model must contain exactly these states:

```ts
type OnboardingState =
  | { status: "unauthenticated" }
  | { status: "no_active_organization" }
  | {
      status: "organization_not_provisioned"
      canProvision: boolean
    }
  | {
      status: "organization_provisioned"
      organizationId: string
    }
```

No additional state may be introduced in this feature.

In particular, the following states are not part of this model because their backing features do not exist yet:

- `no_billing_entitlement`;
- `no_store`;
- `ready`.

Future features may extend the discriminated union only when the corresponding server-side data and authorization boundaries have been specified and implemented.

### 4.1 `unauthenticated`

Returned when `await auth()` indicates that no verified Clerk user is authenticated.

Requirements:

- no Supabase query is executed;
- no Organization or tenant identifier is inferred from browser input;
- the state carries no additional data.

### 4.2 `no_active_organization`

Returned when the request is authenticated but Clerk server auth has no active Organization identifier.

Requirements:

- no Supabase query is executed;
- the absence of an active Organization is not treated as an infrastructure error;
- the state carries no additional data.

### 4.3 `organization_not_provisioned`

Returned only when all of the following are true:

- the request is authenticated;
- Clerk server auth provides a verified active Organization identifier;
- the Supabase query completes without error;
- the RLS-protected query returns no matching `public.organizations` row.

The state includes:

```ts
canProvision: boolean
```

`canProvision` is derived only from the verified Clerk server auth role, using the server auth capability check equivalent to `has({ role: "org:admin" })`:

```text
org:admin  -> true
org:member -> false
```

It is a safe flow and UI hint only. It is not an authorization decision and must never replace the independent authorization revalidation performed by `ensureActiveOrganization()` before provisioning.

### 4.4 `organization_provisioned`

Returned when the RLS-protected query finds the internal Deli Plus Organization corresponding to the verified active Clerk Organization.

The state includes:

```ts
organizationId: string
```

`organizationId` is the internal UUID from `public.organizations.id`.

Both `org:admin` and `org:member` return `organization_provisioned` when the Organization exists and RLS permits the row for the active Organization. The Clerk role does not change this state and must not be used to introduce a privileged read path.

## 5. Resolver contract

The feature must expose a conceptually equivalent operation:

```ts
resolveOnboardingState(): Promise<OnboardingState>
```

The resolver must be:

- server-only;
- read-only;
- argument-free with respect to authority and tenant selection;
- based on `await auth()`;
- based exclusively on `createServerSupabaseClient()` for database access;
- authenticated to Supabase through the Clerk JWT;
- subject to Supabase RLS;
- free of module-level mutable request state.

The resolver must not accept any of the following from callers or the browser:

- `organizationId`;
- `clerkOrganizationId`;
- `storeId`;
- `clerkUserId`;
- Clerk Organization role;
- any flag that changes authorization or tenant selection.

The active Organization identifier used by the query must come exclusively from Clerk `auth()` in the current server request.

## 6. Resolution flow

The required flow is:

```text
await auth()
  |
  +-- not authenticated
  |     -> unauthenticated
  |
  +-- authenticated, no active Organization
  |     -> no_active_organization
  |
  +-- authenticated, active Organization
        -> createServerSupabaseClient()
        -> SELECT public.organizations through Clerk JWT + RLS
             |
             +-- zero rows, no error
             |     -> organization_not_provisioned
             |
             +-- matching row
             |     -> organization_provisioned
             |
             +-- Supabase error
                   -> infrastructure/resolution error
```

Authentication and active-Organization checks must happen before constructing or invoking database access so the two early states do not issue unnecessary queries.

## 7. Data access

The Organization lookup may follow this shape:

```ts
const { data, error } = await supabase
  .from("organizations")
  .select("id")
  .eq("clerk_organization_id", verifiedOrgId)
  .maybeSingle()
```

Where:

- `supabase` is created only through `createServerSupabaseClient()`;
- `verifiedOrgId` is obtained only from `await auth()`;
- only `public.organizations.id` is selected;
- the operation performs no mutation;
- the operation performs no Store or billing query.

The explicit `clerk_organization_id` filter is defense in depth and constrains the lookup. It complements but does not replace RLS.

The resolver must not use:

- `lib/supabase/admin.ts` or an equivalent privileged client;
- `SUPABASE_SECRET_KEY`;
- a service-role or secret key;
- a browser Supabase client;
- an RPC that bypasses the normal tenant read policy;
- direct SQL outside the established Supabase client boundary.

## 8. Security and tenant isolation

The resolver relies on two independent constraints:

1. Clerk server auth supplies the verified active Organization identifier and the Clerk JWT.
2. Supabase RLS limits `public.organizations` visibility to the active Organization represented by the verified JWT claim.

The explicit query filter must match the Organization identifier obtained from the same server auth context. A caller cannot select another tenant because the resolver accepts no tenant argument.

The resolver must not treat an Organization-admin role as permission to bypass RLS. Admin and member reads use the same normal Supabase client and the same tenant-isolated policy.

`canProvision` does not grant mutation permission. Provisioning remains exclusively owned by the separately specified trusted operation `ensureActiveOrganization()`, which must re-read and revalidate the current authentication and role context at mutation time.

## 9. Error model

The result interpretation is fixed:

```text
error === null && data === null
  -> organization_not_provisioned

data exists and error === null
  -> organization_provisioned

Supabase error
  -> infrastructure/resolution error
```

A genuine Supabase, PostgREST, network, decoding, cardinality, or other resolution error must never be silently converted into a valid onboarding state.

The implementation may define a small server-side exception such as:

```ts
OnboardingStateResolutionError
```

If defined, it must:

- represent a failure to resolve state, not another `OnboardingState` variant;
- expose a stable, generic server-facing message;
- avoid exposing raw PostgREST details, SQL details, credentials, JWTs, or tenant-sensitive metadata to clients;
- preserve the original error only for safe server-side diagnostics through an appropriate cause or internal logging boundary.

`maybeSingle()` returning a cardinality error is a resolution failure. The database uniqueness constraint on `clerk_organization_id` should prevent multiple matching rows, but the resolver must not reinterpret an invariant violation as `organization_not_provisioned`.

A zero-row response caused by a valid RLS decision is indistinguishable at this read boundary from a missing row. Therefore, existing tenant-core pgTAP coverage remains part of verification to prove that the intended active tenant is visible and other tenants remain hidden.

## 10. Request and framework boundaries

`resolveOnboardingState()` is a reusable server module, not a transport endpoint.

This feature must not add:

- a Server Action;
- an API Route or Route Handler;
- Proxy database logic;
- a client component;
- browser-side state resolution;
- redirects or navigation behavior.

The existing Proxy remains limited to its authentication request-boundary responsibilities. It must not query Supabase or attempt to resolve onboarding state.

The initial implementation must not add cross-request or global caching. If a later caller needs duplicate-call suppression within one render/request, it may be evaluated separately with request-scoped semantics and without sharing tenant state across requests.

## 11. Planned implementation shape

The implementation is expected to remain small and may use the following organization:

```text
lib/onboarding/
  resolve-onboarding-state.ts
  resolve-onboarding-state.internal.ts

tests/onboarding/
  resolve-onboarding-state.test.mjs
```

The exact internal split may be simplified during implementation if testability remains clear and no parallel abstraction is introduced.

The public server module owns the real Clerk and Supabase integration. A small internal dependency-injected resolver may be used for deterministic unit tests, following the existing tenant-provisioning test pattern and without introducing a new test framework.

The implementation must add the Yarn script:

```json
"test:onboarding-state-resolver": "node --test tests/onboarding/resolve-onboarding-state.test.mjs"
```

The implementation must use the repository's installed dependencies and must not add a dependency solely for this feature unless a separately approved change establishes the need.

## 12. Required test coverage

Automated tests must cover at least the following cases.

### 12.1 State resolution

1. Unauthenticated request:
   - returns `unauthenticated`;
   - does not create or query a Supabase client.

2. Authenticated request without an active Organization:
   - returns `no_active_organization`;
   - does not create or query a Supabase client.

3. `org:admin` with no matching Organization row:
   - the query succeeds with `data === null`;
   - returns `organization_not_provisioned`;
   - returns `canProvision: true`.

4. `org:member` with no matching Organization row:
   - the query succeeds with `data === null`;
   - returns `organization_not_provisioned`;
   - returns `canProvision: false`.

5. Existing Organization:
   - returns `organization_provisioned`;
   - returns the internal Organization UUID;
   - behaves the same for admin and member when RLS permits the active Organization.

6. Supabase error:
   - throws or rejects with the approved resolution-error boundary;
   - does not return `organization_not_provisioned` or any other valid state;
   - does not expose raw PostgREST details through the public error message.

### 12.2 Boundary and security assertions

Tests or structural verification must prove that:

- tenant selection cannot be supplied through a resolver argument;
- the query filter uses the verified active Clerk Organization identifier;
- the admin Supabase client is not imported or used;
- `SUPABASE_SECRET_KEY` is not used;
- no `insert`, `upsert`, `update`, `delete`, or other mutation is performed;
- no Store table is queried;
- no billing, subscription, entitlement, trial, or Stripe data is queried;
- no Server Action, API Route, or Proxy database logic is introduced.

### 12.3 Existing database isolation coverage

Verification must rerun the existing tenant-core pgTAP suite. Its coverage must continue to demonstrate that:

- an authenticated request with the active Organization sees its own Organization;
- another tenant's Organization is not visible;
- the absence of an active Organization does not expose tenant rows;
- tenant-core write restrictions remain unchanged.

No migration or RLS test change is expected from this feature unless implementation discovers a genuine mismatch, in which case work must stop for architectural review rather than silently expanding scope.

## 13. Verification commands

The implementation phase must execute:

```bash
yarn test:onboarding-state-resolver
yarn supabase test db
yarn lint
yarn typecheck
yarn build
git diff --check
```

Every command result must be reported accurately. A command may be marked successful only if it was actually executed and exited successfully.

## 14. Explicit non-goals

This feature must not implement or specify behavior for:

- tenant provisioning mutation;
- Store provisioning;
- Store reads;
- billing;
- Stripe;
- trials;
- subscriptions;
- webhooks;
- Store-capacity entitlement;
- onboarding UI;
- redirects;
- Proxy database logic;
- a browser Supabase client;
- privileged reads;
- migrations;
- RLS changes.

It also must not change:

- `ensureActiveOrganization()` authorization responsibilities;
- Clerk Organization role semantics;
- the tenant-core schema;
- the existing Organization-to-Store ownership model;
- the existing Store membership/access model.

## 15. Documentation requirements

No new ADR is required. This feature applies ADR-001, ADR-002, and ADR-003 without changing their decisions.

The implementation must update documentation only if the final code introduces a meaningful deviation from this approved specification. Any architectural deviation requires review before implementation continues.

## 16. Acceptance criteria

The feature is complete only when:

- `OnboardingState` contains exactly the four approved initial states;
- `resolveOnboardingState()` is server-only, read-only, and accepts no tenant authority argument;
- authentication and active Organization are resolved with `await auth()`;
- unauthenticated and no-active-Organization paths perform no Supabase query;
- the Organization lookup uses only `createServerSupabaseClient()`;
- the lookup uses the verified Clerk Organization ID and remains protected by RLS;
- missing data is distinguished from a Supabase error;
- real errors cannot become valid onboarding states;
- admin and member receive the correct `canProvision` hint only when provisioning is missing;
- both roles receive `organization_provisioned` for an existing, RLS-visible Organization;
- no privileged client, secret key, mutation, Store query, or billing query is introduced;
- the required resolver tests pass;
- existing tenant-core pgTAP tests pass;
- lint, typecheck, build, and diff checks pass;
- no out-of-scope feature or dependency is added.

## 17. Implementation authorization

This specification is approved for a subsequent implementation phase. This document does not itself authorize expanding the state model, changing RLS, introducing privileged reads, or implementing any of the explicit non-goals.
