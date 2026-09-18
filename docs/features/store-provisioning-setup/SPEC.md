# Deli Plus — Store Provisioning / Setup Foundation

**Path:** `docs/features/store-provisioning-setup/SPEC.md`  
**Status:** Implemented
**Scope:** Store draft creation, setup editing, and readiness  
**Last updated:** 2026-09-11

## 1. Purpose

Define the trusted Store setup foundation that follows internal Organization
provisioning and precedes operational Store activation.

This feature establishes the future flow:

```text
verified active Clerk Organization
  → provisioned internal Deli Plus Organization
  → draft Store
  → Store setup
  → ready Store
```

It deliberately stops before trial, entitlement, capacity enforcement, Stripe,
public storefront, catalog, and order behavior.

Expected delivery model:

`SPEC → PLAN → IMPLEMENT → VERIFY → REVIEW`

## 2. Architectural context

Deli Plus already has:

- Clerk authentication and Organizations;
- an internal `public.organizations` tenant mapping;
- `public.stores` and `public.store_memberships`;
- tenant/Store RLS with authenticated reads only;
- a normal Clerk-JWT Supabase client;
- a separate server-only privileged Supabase client;
- a normalized Organization entitlement resolver;
- local trial and paid-subscription persistence foundations.

This feature applies ADR-001, ADR-002, ADR-003, and ADR-004 without weakening
their authorization or billing boundaries.

Clerk remains canonical for:

- authenticated user identity;
- active Organization;
- Organization membership;
- Organization role.

PostgreSQL remains canonical for:

- the internal Deli Plus Organization;
- Store ownership;
- persisted Store lifecycle;
- Store-specific assignment;
- future Store-scoped domain data.

## 3. Approved scope

The implementation may provide only:

- the Store lifecycle schema foundation described by this specification;
- Store draft creation for an already provisioned Organization;
- Store setup reads for the active Organization admin;
- allow-listed Store name/slug updates;
- explicit readiness validation and `draft → ready` transition;
- the server-only Store setup domain API;
- focused Node and pgTAP coverage;
- generated database types and directly required current-state documentation.

## 4. Persisted Store lifecycle

The approved lifecycle is:

```text
draft ↔ ready → active ↔ inactive
```

| Status     | Meaning                                                                                                     | `activated_at` |
| ---------- | ----------------------------------------------------------------------------------------------------------- | -------------- |
| `draft`    | Store exists and can be configured.                                                                         | `NULL`         |
| `ready`    | Current persisted setup passed the approved readiness rules, but the Store has not been activated.          | `NULL`         |
| `active`   | Store was activated historically and is operationally enabled, subject to current Organization entitlement. | Non-null       |
| `inactive` | Store was activated historically and was explicitly disabled operationally.                                 | Non-null       |

Allowed status transitions:

| From                   | To                     | Allowed                                           |
| ---------------------- | ---------------------- | ------------------------------------------------- |
| insert                 | `draft`                | Yes                                               |
| `draft`                | `ready`                | Yes                                               |
| `ready`                | `draft`                | Yes                                               |
| `ready`                | `active`               | Yes, through a future trusted activation boundary |
| `active`               | `inactive`             | Yes, through a future operational boundary        |
| `inactive`             | `active`               | Yes, through a future entitlement-aware boundary  |
| any status             | same status            | Yes when other mutation rules permit              |
| `draft`                | `active` or `inactive` | No                                                |
| `ready`                | `inactive`             | No                                                |
| `active` or `inactive` | `draft` or `ready`     | No                                                |

`activated_at` records the first activation:

- it is set using the PostgreSQL clock during the future first activation;
- it remains unchanged during `active ↔ inactive` transitions;
- it is immutable after becoming non-null;
- it must never be supplied as browser authority.

Billing expiration does not automatically set a Store to `inactive`. Entitlement
loss and explicit operational disablement are separate facts.

This feature does not perform any transition to `active` or `inactive`.

## 5. Capacity and trial relationship

Store capacity is interpreted as:

```text
maxStores
→ count of Stores where status = active
```

Therefore:

- `draft` Stores do not consume billing capacity;
- `ready` Stores do not consume billing capacity;
- `inactive` Stores do not count as currently operational active capacity;
- creation of a draft Store does not require entitlement.

The future initial-trial activation has a stronger historical invariant:

```text
no Store owned by the Organization may have activated_at IS NOT NULL
```

before the first Store can receive initial-trial activation.

An Organization with an existing valid paid entitlement or valid manual
override must not automatically receive an initial trial. Paid/manual activation
belongs to a separate future operation.

## 6. Actors and authorization

Normal merchant Store setup is Organization-admin only.

Every public Store setup operation must:

1. execute server-side;
2. call `await auth()` inside the operation;
3. require an authenticated Clerk user;
4. require an active Clerk Organization;
5. require `has({ role: "org:admin" })`;
6. resolve the matching internal Deli Plus Organization;
7. fail safely when that Organization is not provisioned.

An Organization member cannot list setup data, create a Store, edit Store setup,
or mark a Store ready through this feature.

Authorization inside a layout, Proxy, Server Component, hidden button, or thin
Server Action does not replace authorization inside the domain operation.

## 7. Browser authority

Browser/client input may contain only Store business data and a candidate
resource selector:

- `name`;
- `slug`;
- `storeId` where the operation targets an existing Store.

Browser/client input must not choose or assert:

- internal `organizationId`;
- Clerk Organization ID;
- Clerk User ID;
- Organization role;
- `status`;
- `activatedAt`;
- trial eligibility or timestamps;
- entitlement, plan, or `maxStores`;
- Stripe Customer, Subscription, Price, or status.

`storeId` is a resource selector, not proof of ownership or authorization.

## 8. Public server-side Store setup API

The planned minimal public domain API is:

```ts
listStoresForSetup()

getStoreForSetup(storeId)

createDraftStore({
  name,
  slug,
})

updateStoreSetup(storeId, {
  name?,
  slug?,
})

markStoreReady(storeId)
```

All functions are server-only and must keep request-scoped identity local to
the current invocation. They are domain/application operations, not generic
Supabase helpers and not automatically exposed HTTP endpoints.

The safe Store setup DTO is conceptually:

```ts
type StoreSetupView = {
  id: string
  name: string
  slug: string
  status: "draft" | "ready" | "active" | "inactive"
  updatedAt: string
}
```

It does not expose internal Organization IDs, Clerk IDs, billing data, or
provider identifiers.

## 9. Safe operation outcomes

Expected domain outcomes may distinguish:

- unauthenticated;
- no active Organization;
- forbidden;
- internal Organization not provisioned;
- Store unavailable;
- input validation failure;
- slug unavailable;
- setup changed concurrently;
- created/updated/ready/already-ready success.

Missing and cross-tenant Store identifiers must produce the same safe
`store_unavailable` outcome.

Infrastructure/database failures must use a small server-only error boundary
such as `StoreSetupError`. Raw PostgREST details, SQL text, internal IDs,
credentials, or tenant-sensitive information must not be returned to the
browser.

## 10. Setup read operations

`listStoresForSetup()` and `getStoreForSetup(storeId)` must:

- apply the same authentication and Organization-admin checks as mutations;
- derive the active tenant from the Clerk session;
- use the normal Clerk-JWT Supabase client and existing RLS for reads;
- explicitly scope an existing Store lookup by `storeId + organization_id`;
- return safe Store DTOs only;
- avoid billing, trial, Stripe, catalog, order, or public-storefront queries.

An `active` or `inactive` Store may appear in the list as lifecycle context, but
it cannot be edited through the setup mutation operations.

## 11. Draft Store creation

`createDraftStore(input)` must:

1. authenticate and authorize the current request;
2. resolve the active internal Organization through the normal tenant/RLS path;
3. validate the Store name;
4. canonicalize and validate the Store slug;
5. reject a reserved slug;
6. create the privileged client only after all early checks pass;
7. insert through a narrow Store repository;
8. assign `organization_id` exclusively from the trusted server resolution;
9. force `status = 'draft'`;
10. force `activated_at = NULL`;
11. return only the safe Store DTO.

The insert payload must be constructed explicitly. It must never spread a
browser object into the database mutation.

Creation must not:

- resolve entitlement;
- count Stores for billing capacity;
- insert a trial grant;
- create Stripe resources;
- call Stripe;
- activate the Store;
- create products, menu data, orders, or Store memberships.

Global slug uniqueness remains the database concurrency boundary. A duplicate
slug returns a safe `slug_unavailable` result; the server does not generate an
automatic suffix.

## 12. Store setup update

`updateStoreSetup(storeId, patch)` must:

- authenticate and authorize again;
- derive the Organization from the current session;
- resolve the Store with `storeId + organization_id`;
- allow only `name` and `slug`;
- reject or ignore authority-bearing fields without propagating them;
- normalize and validate the fields before persistence;
- construct the update payload field by field;
- permit updates only while status is `draft` or `ready`;
- use the previously read `updated_at` value as an optimistic concurrency
  predicate;
- return `setup_changed` rather than overwriting when that predicate no longer
  matches.

An actual material change to a readiness-relevant field performs:

```text
ready → draft
```

Saving values identical to the persisted canonical values must preserve
`ready` and avoid a meaningless status transition.

The operation must not allow an `active` or `inactive` Store to re-enter the
setup lifecycle.

## 13. Readiness boundary

`markStoreReady(storeId)` must:

1. authenticate and require active Organization admin;
2. derive the internal Organization from trusted server context;
3. re-read the persisted Store by `storeId + organization_id`;
4. require `activated_at IS NULL`;
5. require status `draft` or `ready`;
6. validate the actual persisted name;
7. validate the actual persisted canonical slug;
8. reject reserved slugs;
9. transition `draft → ready` with an `updated_at` concurrency predicate;
10. treat an already-valid `ready` Store as idempotent success.

The operation accepts no setup fields and no browser `ready=true` assertion.

Current readiness means only:

- non-blank persisted name;
- valid non-reserved persisted slug;
- Store belongs to the active internal Organization;
- Store has never been activated;
- explicit trusted confirmation of the current persisted setup.

Products, categories, menu completeness, business hours, delivery configuration,
payment configuration, images, or other future data are not readiness
requirements until their own approved feature changes this contract.

`markStoreReady()` does not start trial, read billing, call Stripe, enforce
capacity, publish a storefront, or enable order intake.

## 14. Deterministic `ready → draft` behavior

Readiness is invalidated only by an actual material change to a field that
participates in the readiness rules.

For the current scope, those fields are:

- `name`;
- `slug`.

Rules:

- opening an edit page does not change lifecycle state;
- submitting no effective canonical change preserves `ready`;
- changing `name` or `slug` through the setup operation changes `ready` to
  `draft`;
- readiness is restored only through a later explicit `markStoreReady()` call;
- future feature mutations must explicitly document which of their fields
  affect readiness and must use the shared invalidation rule.

A separate public `markStoreDraft()` operation is not required in this feature.

## 15. Store name

The Store name must:

- be a string;
- be trimmed before persistence;
- be rejected when empty or whitespace-only.

No arbitrary product-name maximum is introduced by this specification.

The future migration adds a database check equivalent to:

```sql
btrim(name) <> ''
```

Application validation complements this constraint and provides field-level
feedback.

## 16. Store slug

Slug canonicalization is authoritative on the server:

1. trim surrounding whitespace;
2. lowercase;
3. remove diacritics;
4. convert whitespace/separators to hyphens;
5. collapse duplicate hyphens;
6. remove unsupported characters;
7. remove leading/trailing hyphens;
8. validate the final canonical value.

Final rule:

```text
^[a-z0-9]+(-[a-z0-9]+)*$
```

The canonical slug must be between 3 and 63 characters and globally unique.

No automatic collision suffix is generated. The user must select another slug.

This feature allows slug changes only for `draft` and `ready` Stores.
Post-activation slug changes, permanent redirects, aliases, and URL-history
policy belong to future storefront work.

## 17. Reserved storefront slugs

The initial reserved set is:

```text
api
dashboard
sign-in
sign-up
pricing
trpc
```

The list must live in one central Store-domain rules helper and must not be
duplicated across UI components.

Create, update, and readiness validation must all use the same reserved-slug
rule.

Any new top-level static application route must be reviewed against the
reserved storefront slug set before that route is released.

## 18. Application layering

The approved dependency direction is:

```text
app / components
  → Server Components / thin Server Actions
  → lib/stores/store-setup.ts
  → lib/stores/store-setup.internal.ts
  → lib/stores/store-setup.rules.ts
  → lib/stores/store-setup.repository.ts
  → Supabase/PostgreSQL
```

Responsibilities:

- `store-setup.ts`: public server-only facade and real Clerk/request integration;
- `store-setup.internal.ts`: dependency-injected application workflow and safe
  result mapping;
- `store-setup.rules.ts`: name/slug normalization, validation, reserved slugs,
  readiness, and allow-list rules;
- `store-setup.repository.ts`: internal server-only normal reads and privileged
  Store mutations;
- UI: presentation, forms, navigation, and safe result handling only.

Client Components must not import the admin client, repository, Clerk server
helpers, or privileged domain internals.

Server Actions, if introduced by later UI work, must remain thin transport
adapters. The Store domain operation must authenticate and authorize again
because a Server Action can be invoked independently of a page or layout.

No mutable request/tenant state may be stored at module scope.

## 19. Trusted write strategy

The implemented trusted-write posture is:

```text
draft/setup CRUD
  → narrow server-only Store domain service
  → narrow Store repository
  → action-specific service-role-only RPCs

trial activation / paid activation / capacity
  → separate authenticated transactional PostgreSQL RPCs
```

The repository uses the privileged client only to invoke `create_store_draft`,
`update_store_setup`, and `mark_store_ready`. Each function expresses one domain action,
uses tenant/lifecycle/concurrency predicates, and returns only the existing Store setup
facts. `service_role` receives EXECUTE on these functions and no direct table privilege
on `public.stores`.

The Store API must never export:

- the admin Supabase client;
- an arbitrary table/query callback;
- a generic Store CRUD repository;
- caller-selected tenant authority.

## 20. Planned database migration

The future implementation introduces one forward-only migration. It must not
rewrite the tenant-core migration.

Planned schema changes:

```text
public.stores.activated_at
  timestamptz
  nullable
  no default

public.stores.status
  draft | ready | active | inactive
```

Planned constraints:

```text
draft / ready
  → activated_at IS NULL

active / inactive
  → activated_at IS NOT NULL

btrim(name) <> ''
```

The migration must replace the existing status check rather than introduce a
conflicting duplicate.

The planned private lifecycle trigger must:

- be `SECURITY INVOKER`;
- use an empty/restricted `search_path`;
- use fully qualified PostgreSQL objects where relevant;
- allow INSERT only as `draft` with `activated_at = NULL`;
- enforce the approved transition matrix;
- reject `active/inactive → draft/ready`;
- reject changing or clearing `activated_at` after it becomes non-null;
- coexist with the existing row-timestamp trigger;
- not start a trial or perform billing work.

The first future activation boundary, not this trigger, must set
`activated_at = pg_catalog.now()` in the same transaction as the applicable
activation rules.

No new Store index is required by this setup migration. Future activation
queries may add an index only after their exact access path is approved.

After the migration stabilizes, regenerate:

```text
lib/supabase/database.types.ts
```

## 21. Hosted deployment data-audit gate

Before applying the lifecycle migration to any hosted environment, run and
review:

```sql
select status, count(*)
from public.stores
group by status;

select id, status, created_at, updated_at
from public.stores
where status in ('active', 'inactive');

select id
from public.stores
where btrim(name) = '';
```

Rules:

- do not infer `activated_at` from `created_at`;
- do not infer `activated_at` from `updated_at`;
- do not silently rewrite non-blank business names;
- if any `active` or `inactive` Store exists, stop deployment;
- require an audited remediation with a trustworthy first-activation timestamp
  before validating the strict lifecycle constraint;
- if blank names exist, stop and remediate them explicitly before validating
  the name constraint.

A local reset creating an empty Store table does not prove that a hosted
environment contains no legacy/manual rows.

No real remote migration push is authorized by this specification.

## 22. RLS and grants

The existing direct Data API posture remains:

```text
anon
  → no access to organizations, stores, or store_memberships

authenticated
  → SELECT only under the existing RLS policies
  → no generic INSERT / UPDATE / DELETE / TRUNCATE
```

This feature must not:

- add authenticated Store write grants;
- add Store write policies;
- weaken tenant isolation;
- expose public storefront reads;
- make the admin client a normal application read path.

The trusted Store setup RPCs are `VOLATILE SECURITY DEFINER`, owned by `postgres`, use
an empty `search_path`, and are executable only by `service_role`. `PUBLIC`, `anon`, and
`authenticated` cannot execute them. Direct `service_role` privileges on
`public.stores`, including SELECT, INSERT, UPDATE, DELETE, and TRUNCATE, remain denied.

UI freedom comes from the approved domain operations, not weaker database
security.

## 23. Concurrency behavior

Creation:

- relies on global Store slug uniqueness;
- a simultaneous duplicate produces one success and one safe slug conflict;
- no automatic retry may invent a different slug.

Update:

- reads the current Store and `updated_at`;
- writes with `id + organization_id + eligible status + updated_at` predicates;
- zero updated rows after a valid read produce `setup_changed` or a safe
  unavailable result after re-resolution;
- it must not overwrite a concurrent activation or edit.

Readiness:

- validates persisted fields;
- transitions with the same `updated_at` optimistic predicate;
- a concurrent setup change prevents readiness from being asserted over a
  stale read.

Cross-row transactional locking is not introduced because this feature performs
no entitlement, capacity, or trial operation.

## 24. Future Deli Plus operator compatibility

Deli Plus may later assist merchants with Store setup or menu configuration.

That future capability must use:

```text
internal operator authentication
  → explicit operator authorization
  → verified tenant resolution
  → audit trail
  → shared Store setup business rules
  → narrow repository operation
```

It must never:

- impersonate `org:admin`;
- call the merchant facade with a fabricated Clerk session;
- expose generic service-role CRUD;
- trust a browser-selected tenant as authorization;
- bypass auditing.

Current code should keep merchant authorization/tenant resolution separate from
pure Store setup rules and persistence workflows so a future reviewed operator
adapter can reuse the latter.

No internal operator identity, role, table, audit log, or UI is introduced by
this feature.

## 25. Route compatibility

The Store setup domain API supports the approved dashboard direction:

```text
/dashboard
/dashboard/stores
/dashboard/stores/new
/dashboard/stores/[storeId]
/dashboard/stores/[storeId]/setup
```

The dashboard uses the internal Store UUID as a candidate selector. It never
uses the public slug as authorization.

The future public storefront remains:

```text
/[storeSlug]
```

Route implementation and UI are outside this feature. The stable frontend
contract is documented in `docs/FRONTEND_INTEGRATION.md`.

## 26. Explicit non-goals

Do not implement in this feature:

- Store activation;
- local trial creation, activation, override, or revocation;
- Organization entitlement reads;
- Store-capacity enforcement;
- Stripe Customer, Checkout, Portal, Subscription, or API calls;
- products, categories, modifiers, or menu;
- Store settings beyond current name/slug;
- business hours or delivery configuration;
- public storefront;
- public/anonymous database access;
- orders or order intake;
- onboarding UI or coordinator;
- redirects;
- Store deletion;
- Store membership/team management;
- browser Supabase client;
- internal Deli Plus operator system;
- post-activation slug changes or redirects;
- new generic authenticated Store writes.

## 27. Node test requirements

Focused application tests must cover at minimum:

### Authentication and authority

- unauthenticated;
- authenticated without an active Organization;
- Organization member rejected;
- internal Organization not provisioned;
- admin accepted;
- tenant derived only from the current session;
- no `organizationId`, role, status, `activatedAt`, entitlement, or trial
  authority accepted from the caller;
- early failures do not create an admin client or perform writes.

### Creation and validation

- admin creates a Store as `draft` with null `activated_at`;
- name is trimmed;
- blank/whitespace-only name rejected;
- slug canonicalization, including diacritics, spaces, separators, and duplicate
  hyphens;
- final slug format and length;
- every reserved slug rejected;
- global slug conflict returns a safe result;
- no automatic suffix;
- explicit insert payload contains only approved fields.

### Ownership and updates

- Store lookup is scoped by Store and Organization;
- missing and cross-tenant Store IDs share the same safe result;
- only name/slug are updateable;
- arbitrary input fields are not spread;
- optimistic concurrency conflict does not overwrite;
- `active` and `inactive` Stores are rejected from setup update;
- actual `ready` field change returns the Store to `draft`;
- identical canonical update preserves `ready`.

### Readiness

- `draft → ready`;
- already-valid `ready` is idempotent;
- persisted Store fields are re-read;
- invalid persisted name/slug/reserved slug is rejected;
- non-null `activated_at` is rejected;
- concurrency conflict does not assert stale readiness.

### Boundary regression

- no trial or billing mutation;
- no entitlement resolver call;
- no Stripe import or API call;
- no Store activation;
- no generic admin CRUD exposure;
- UI modules do not import `lib/supabase/admin.ts`;
- public Store modules are server-only;
- no mutable request authority at module scope.

Use the repository's existing Node test approach and add only the focused Yarn
script:

```text
test:store-provisioning-setup
```

## 28. pgTAP requirements

Database tests must cover at minimum:

### Schema and constraints

- `activated_at` exists as nullable `timestamptz` without a default;
- status accepts exactly `draft`, `ready`, `active`, and `inactive`;
- name cannot be blank/whitespace-only;
- draft/ready require null `activated_at`;
- active/inactive require non-null `activated_at`;
- existing slug format, length, and global uniqueness remain enforced.

### Lifecycle trigger

- trigger and private function exist;
- function is `SECURITY INVOKER` with empty/restricted `search_path`;
- API roles cannot execute it directly;
- INSERT draft/null succeeds;
- INSERT ready/active/inactive is rejected;
- `draft ↔ ready` succeeds;
- `ready → active` succeeds only with non-null `activated_at`;
- `active ↔ inactive` succeeds while preserving `activated_at`;
- `draft → active/inactive` is rejected;
- `ready → inactive` is rejected;
- `active/inactive → draft/ready` is rejected;
- changing or clearing a non-null `activated_at` is rejected;
- lifecycle validation and the existing timestamp trigger coexist.

### Security regression

- RLS remains enabled on tenant-core tables;
- Store SELECT policies remain unchanged;
- `authenticated` remains SELECT-only;
- `anon` remains denied;
- Organization admin sees only its tenant's Stores;
- member Store-assignment isolation remains correct;
- cross-tenant reads remain denied;
- authenticated admin/member Store writes remain denied;
- invoking setup-related schema behavior changes no billing/trial row.

Fixtures must use the privileged local test role and create lifecycle states
through valid transitions rather than inserting impossible rows.

## 29. Verification plan

The implementation phase must run:

```bash
yarn test:store-provisioning-setup
yarn test:tenant-provisioning
yarn test:onboarding-state-resolver
yarn test:organization-entitlement
yarn supabase db reset
yarn supabase test db
yarn supabase db lint --local
yarn lint
yarn typecheck
yarn build
git diff --check
```

After local implementation and review, a pending migration may be inspected
with:

```bash
yarn supabase db push --dry-run
```

No real hosted push occurs without explicit authorization and completion of the
data-audit gate.

## 30. Planned implementation shape

Expected future files:

```text
lib/stores/store-setup.ts
lib/stores/store-setup.internal.ts
lib/stores/store-setup.rules.ts
lib/stores/store-setup.repository.ts
tests/store-provisioning-setup/store-provisioning-setup.test.mjs
supabase/migrations/<timestamp>_store_provisioning_setup.sql
supabase/tests/database/store_provisioning_setup_test.sql
```

Expected directly required updates:

```text
lib/supabase/database.types.ts
package.json
docs/ARCHITECTURE.md
docs/AUTHORIZATION.md
docs/DATABASE.md
docs/DEVELOPMENT.md
docs/MULTI_TENANCY.md
```

This documentation-only execution creates no implementation file from this
section.

## 31. Documentation relationship

This specification:

- extends the tenant-core Store schema without rewriting its migration;
- follows ADR-003 for narrow server-only privileged writes;
- leaves activation/trial atomicity to the later Store Trial Activation feature;
- leaves Store capacity activation to a later entitlement-aware feature;
- uses `docs/FRONTEND_INTEGRATION.md` as the stable frontend/backend handoff;
- does not introduce a new ADR.

ADR-001 records the durable Store lifecycle. ADR-004 records that Store capacity
counts active operational Stores rather than draft Store records.

## 32. Acceptance criteria

The feature is complete only when:

- [ ] Store lifecycle and `activated_at` constraints match this specification.
- [ ] Strict hosted migration audit/remediation behavior is implemented.
- [ ] `authenticated` and `anon` grants/RLS remain unchanged.
- [ ] The five approved server-only domain operations exist.
- [ ] Every operation derives tenant and role from current Clerk server auth.
- [ ] Only Organization admins can use Store setup operations.
- [ ] Store creation forces draft/null without entitlement, trial, or Stripe.
- [ ] Store update allows only name/slug and uses optimistic concurrency.
- [ ] Missing and cross-tenant Stores share a safe outcome.
- [ ] Material readiness changes return ready Stores to draft.
- [ ] Identical updates preserve ready.
- [ ] Readiness validates persisted fields and is idempotent.
- [ ] Name, slug normalization, uniqueness, and reserved-slug rules are shared.
- [ ] Active/inactive Stores cannot return to setup.
- [ ] No Store activation, trial, capacity, catalog, storefront, or order work is
      introduced.
- [ ] No generic admin CRUD or authenticated Store writes are exposed.
- [ ] Node and pgTAP coverage required by this specification passes.
- [ ] Existing tenant, billing, onboarding, and entitlement regressions pass.
- [ ] Generated database types are updated.
- [ ] Lint, typecheck, build, database lint, and diff checks pass.
- [ ] No secret, unrelated dependency, or out-of-scope file is introduced.

## 33. Blocking decisions

No product or architecture decision remains open for implementation.

Hosted deployment remains conditionally blocked if the required data audit
finds active/inactive Stores without a trustworthy first-activation timestamp
or blank Store names. Such data requires reviewed remediation; it must not be
silently backfilled.

## 34. Implementation authorization

This specification is approved for a subsequent Store setup implementation.

It does not authorize:

- a real hosted migration push;
- Store activation or trial activation;
- paid activation or Store-capacity enforcement;
- Stripe configuration or remote Stripe changes;
- storefront, catalog, orders, or onboarding UI;
- internal operator access;
- generic authenticated Store writes;
- commit, push, merge, rebase, or history rewriting without explicit user
  authorization.

Any deviation from the approved lifecycle, tenant derivation, admin-only setup,
hybrid trusted-write strategy, or default-deny Data API posture requires review
before implementation continues.
