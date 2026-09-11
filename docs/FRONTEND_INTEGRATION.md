# DeliPlus Frontend Integration Contract

## Purpose

This document defines stable integration boundaries that let dashboard and
storefront features evolve without coupling presentation code to privileged
infrastructure, tenant resolution, billing internals, or database policy
details.

It is a contract for future implementation. It does not mean that every route
or domain operation described here already exists.

## Core boundary

Frontend code consumes reviewed domain operations. It does not directly own
authentication authority, tenant selection, privileged persistence, billing
decisions, or Store activation.

```text
app / components
  → Server Components / thin Server Actions
  → approved server-only domain API
  → internal domain service and repository
  → Supabase / PostgreSQL
```

Client Components are limited to interaction, forms, and serializable DTOs.
Authentication and authorization remain inside every sensitive domain
operation, even when a layout, Proxy, or UI has already checked access.

## Stable dashboard route direction

The following routes are the stable direction for the merchant dashboard:

```text
/dashboard
/dashboard/stores
/dashboard/stores/new
/dashboard/stores/[storeId]
/dashboard/stores/[storeId]/setup
```

Future Store-scoped feature routes:

```text
/dashboard/stores/[storeId]/products
/dashboard/stores/[storeId]/categories
/dashboard/stores/[storeId]/orders
/dashboard/stores/[storeId]/delivery
/dashboard/stores/[storeId]/settings
```

Organization-scoped routes:

```text
/dashboard/team
/dashboard/billing
```

Dashboard routes use the internal Store UUID as a resource selector. A public
Store slug is not an authorization boundary and must never replace tenant and
Store ownership verification.

These paths are integration contracts, not authorization grants. Route
visibility, navigation state, layouts, and Proxy checks may improve UX, but the
invoked domain operation must independently authenticate and authorize the
request.

## Stable storefront route direction

The public storefront route is:

```text
/[storeSlug]
```

The slug is a public locator, not trusted tenant or Store authority. Storefront
resolution must use the canonical persisted slug and the visibility rules
approved for that feature.

```text
storefront visibility
  !=
authorization to accept an order
```

A future order mutation must revalidate the Store lifecycle status and current
Organization entitlement server-side at the mutation boundary. The fact that
a storefront page can be rendered, cached, or reached by URL never proves that
the Store may accept an order.

Any new top-level static application route must be reviewed against the central
reserved storefront slug set before release.

## Dashboard Overview read contract

Dashboard Server Components should call only
`getDashboardOverview()` from `@/lib/dashboard/dashboard-overview` for their
high-level Organization, entitlement and Store summary. It accepts no arguments.

```ts
const result = await getDashboardOverview()
if (result.status === "success") {
  const { organization, entitlement, stores } = result.overview
  // Presentation only; mutations reauthorize independently.
}
```

The public types are:

```ts
type PlanEntitlement =
  | { planCode: "essential"; maxStores: 1 }
  | { planCode: "multi_2"; maxStores: 2 }
  | { planCode: "multi_3"; maxStores: 3 }

type OrganizationEntitlement =
  | { entitled: false; reason: "no_entitlement" }
  | ({ entitled: true; source: "trial"; validUntil: Date } & PlanEntitlement)
  | ({ entitled: true; source: "paid_subscription" } & PlanEntitlement)

type DashboardOverview = {
  organization: { id: string }
  entitlement: OrganizationEntitlement
  stores: { scope: "accessible"; total: number; active: number }
}

type DashboardOverviewResult =
  | { status: "unauthenticated" }
  | { status: "no_active_organization" }
  | { status: "organization_not_provisioned"; canProvision: boolean }
  | { status: "success"; overview: DashboardOverview }
```

Auth/provisioning outcomes are navigation/presentation states. Unexpected read
failures throw `DashboardOverviewError` with a safe message; do not expose its
internal cause. A provisioned Organization with no entitlement and zero Stores
returns success, as does a paid Organization with zero Stores. Reading never
provisions, starts a trial, activates a Store, or creates a Stripe resource.
No entitlement alone does not prove initial-trial eligibility: it may also mean
an expired or revoked grant. Activation remains the authority for eligibility.

### Read-boundary audit and composition

- `resolveOnboardingState()` already resolves the active Organization's internal
  UUID using verified Clerk auth and normal JWT/RLS reads. The overview reuses
  this through the Store summary instead of calling the provisioning mutation
  `ensureActiveOrganization()`.
- `resolveOrganizationEntitlement()` is reused without changing its result or
  precedence rules. It reads the existing zero-argument entitlement-facts RPC,
  which returns only valid local-grant and paid-projection facts. No dashboard
  import of trial/billing repositories, Stripe statuses or private SQL helpers
  is needed.
- `listStoresForSetup()` and `getStoreForSetup()` are **admin-only**, including
  their reads. They are still the approved setup UI APIs; they cannot provide
  a member dashboard summary. Their shared repository also imports the admin
  write client, so this read path does not import that repository.
- The new `getAccessibleStoreSummary()` Store domain API composes onboarding
  resolution and two exact, head-only Store counts using the normal Clerk-JWT
  client, scoped to the resolved Organization UUID and existing Store RLS.
  It supports both admins and members without changing setup authorization.
  Dashboard code consumes it through `getDashboardOverview()`.

### Count and capacity semantics

`scope: "accessible"` always means Stores visible to this request. For an admin,
that is all Stores in the active Organization; for a member, only assigned Stores
in that Organization. Zero for a member means no accessible Stores, not necessarily
an empty Organization. `total` includes draft, ready, active and inactive Stores;
`active` counts only `status = 'active'`. Counts are exact rather than the length of
a potentially truncated listing.

Organization capacity is available only as `entitlement.maxStores` after narrowing
`entitled: true`; the presentation fallback may be `null`. It is not duplicated in
`stores`, and is not a member's personal quota. Do not subtract a member's accessible
active count from Organization capacity to infer available Organization slots.

These independent reads are a display snapshot, not a database-atomic capacity
check. Concurrent changes can temporarily produce differing count/entitlement
snapshots. Do not clamp counts to capacity or use them to authorize mutations;
existing activation operations enforce current capacity transactionally. No shared
cross-request cache is introduced.

### Trial, override and paid presentation

Use the resolver's `source` and stable `planCode`. For local grants, `validUntil`
is the authoritative end fact; calculate remaining time in the presentation layer.
Do not persist days remaining or invent a paid end date. The current resolver
classifies valid `manual_override` grants as `source: "trial"` and does not expose
grant kind. A distinct override badge cannot be supported by this contract without
a separately reviewed extension; do not infer override origin from plan code.

`essential`, `multi_2`, `multi_3` correspond to Essencial, Duo, Trio. The existing
`lib/billing/plans.ts` registry provides codes and capacities, but no labels or
prices. Commercial labels/prices currently live in the billing page's application
presentation configuration. Keep those concerns out of this read model and do not
read Stripe Price IDs for display. Early paid subscription grants entitlement
independently of Store creation/activation; it does not start another trial.

Frontend code must not import Supabase repositories/clients, billing repositories,
private entitlement helpers, or Stripe clients for the overview. The temporary
dashboard status presentation consumes only `getDashboardOverview()`. Its
`storePublished=1` query marker controls success feedback only and never proves
Store or entitlement state. Future Store UI
may use the existing public setup and activation/deactivation operations documented
below through Server Components or thin Server Actions. Setup and lifecycle mutations
remain Organization-admin operations. Final dashboard layout, empty states, plan
labels, trial countdown presentation, Store wizard, and subscription management UI
remain separate work. The current temporary dashboard rendering is intentionally
limited to functional state visibility before the final frontend design.

## Store setup domain contract

The initial server-only Store setup API is:

```text
listStoresForSetup()
getStoreForSetup(storeId)
createDraftStore({ name, slug })
updateStoreSetup(storeId, { name?, slug? })
markStoreReady(storeId)
```

The detailed behavior is defined by
`docs/features/store-provisioning-setup/SPEC.md`.

The API contract intentionally does not accept browser-provided:

- `organizationId` or another tenant selector;
- Clerk role or user identity;
- Store status or `activatedAt` authority;
- entitlement, trial, subscription, or capacity state.

The active Organization, user identity, and Clerk Organization role are derived
from verified server auth. A `storeId` is only a resource selector; the domain
operation must scope the lookup to the resolved internal Organization.

The Store setup API does not activate a Store, start a trial, consult Stripe,
or enforce paid Store capacity. The normal frontend publish API is:

```text
activateStoreForCurrentOrganization(storeId)
```

Its public result is:

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
```

The UI requests “publish this Store.” The backend decides whether activation consumes
current entitlement or attempts the initial trial. `subscription_required` may direct
the merchant to `/dashboard/billing`; it never creates Checkout automatically.

The lower-level activation operations are internal implementation details for normal UI
work:

```text
activateFirstStoreWithInitialTrial(storeId)
activateStoreWithinEntitlement(storeId)
```

Both accept only `storeId` and require the verified active Organization admin. The first
may return `activated`, `already_activated`, `not_ready`, `trial_not_eligible`, or
`store_unavailable`. The generic operation may return `activated`, `already_active`,
`not_ready`, `not_entitled`, `capacity_reached`, or `store_unavailable`. Normal frontend
code must not invoke either operation or predict eligibility directly.

`deactivateStore(storeId)` remains a public lifecycle operation. It may return
`deactivated`, `already_inactive`, `not_active`, or `store_unavailable`. All lifecycle
operations use the existing auth/Organization precondition outcomes. Frontend code may
treat coordinator/deactivation results as flow hints but must not calculate or override
entitlement/capacity locally.

## Stripe Checkout backend contract

The server-only `createSubscriptionCheckoutSession(planCode)` backend is available.
It accepts only `essential`, `multi_2` or `multi_3`; it reauthenticates, requires the
active Organization admin and resolves the internal tenant through Clerk-JWT/RLS.
Do not import its internal repository, Stripe adapter or Supabase admin client from UI.

The only successful payload is `{ status: "checkout_ready", checkoutUrl: string }`.
Other outcomes are `invalid_plan`, `already_subscribed`, `billing_recovery_required`,
`checkout_in_progress`, `checkout_processing`, `unauthenticated`,
`no_active_organization`, `not_admin` and `organization_not_provisioned`.
Infrastructure/configuration/invariant failures throw a sanitized `StripeCheckoutError`.
No provider IDs, Organization UUID, raw errors or Stripe objects belong in UI results.

The billing acquisition UI is available at `/dashboard/billing`. Its thin Server
Action accepts only `planCode`, validates the plan allowlist, calls the public
`createSubscriptionCheckoutSession(planCode)` facade after explicit form submission,
and performs a server-side redirect only for `checkout_ready`. Never call Checkout
during render or GET, and never pass tenant, provider, price, amount, interval,
currency, quantity, or return-URL authority from the browser.

The Action presents business outcomes as safe flow feedback and keeps unexpected
infrastructure failures distinct without exposing raw details. Pending submissions
disable the plan controls and announce redirect progress. Entitlement, Organization
role, and disabled controls are presentation hints only: the Checkout domain operation
reauthenticates and reauthorizes every submission.

Before acquisition, the billing page composes the read-only
`resolveOnboardingState()` result. `organization_not_provisioned` redirects to
`/onboarding` for both admins and members. Billing exposes no provisioning Action or
form; its redirect performs no mutation. The payment-return status can link to the
same coordinator without performing provisioning itself.

The automatic coordinator is available at `/onboarding`. Clerk sign-up forces that
destination, sign-in uses it as a fallback, and Organization create/select returns to
the same stable route. Its Server Component composes `resolveOnboardingState()` and
`listStoresForSetup()` without mutation. For an unprovisioned admin, a small client
coordinator submits a Server Action once; that Action accepts no tenant authority and
calls only `ensureActiveOrganization()`. Members see a safe administrator-required
state. Provisioning must not run during render/GET.

After provisioning, an admin with zero Stores is redirected to
`/dashboard/stores/new`; one or more Stores redirect to `/dashboard`. A provisioned
member who is not authorized for Store setup also returns to `/dashboard` and does not
gain setup-read authority merely for routing. The first-Store route collects the current
required name and slug, then its Server Action explicitly composes draft creation,
readiness, and activation before redirecting directly to the dashboard. Partial failures
retain the created Store selector for retry/setup recovery rather than creating a second
Store. The setup route remains available for editing and recovery. Billing remains
optional before Store
activation, and neither Clerk Organization creation, Organization provisioning, route
navigation, nor rendering starts the trial. The main manual coordinator E2E passed and
the temporary billing-page provisioning control has been removed.

Merchants may subscribe before creating or activating their first Store. Publish UI must
call only `activateStoreForCurrentOrganization()`: it must not import or choose between
`activateStoreWithinEntitlement()` and `activateFirstStoreWithInitialTrial()`.

The return routes are `/dashboard/billing/success` and `/dashboard/billing`, without
`session_id`. The success page reads only `resolveOrganizationEntitlement()` through
the shared server-side billing state composition. It does not call Stripe and does not
infer payment from navigation. Only `source: "paid_subscription"` renders confirmed;
trial or absent entitlement remains a processing state with an explicit manual refresh.

Cancel navigation does not end an attempt. An ongoing different-plan attempt returns
`checkout_in_progress`; same-plan retry reuses the owned Session. Recovery must not
be implemented as blind new acquisition. After Checkout, only webhook-projected
`source: "paid_subscription"` indicates recognized paid entitlement; a valid local
trial or visiting the success URL is not proof of payment. Checkout never activates
a Store or changes trial dates.

## Frontend developer freedoms

Dashboard and storefront developers may:

- create pages, layouts, and components;
- build forms and feature interaction;
- design loading, error, empty, and success states;
- use the established Tailwind and shadcn/ui foundations;
- create navigation and feature-level UX;
- consume approved domain APIs through Server Components or thin Server
  Actions;
- propose feature-level database structures and forward-only migrations for
  reviewed features.

This contract intentionally leaves visual composition and feature UX flexible.
The frontend may present safe capability hints, but those hints never replace
authorization at the operation that reads or changes protected data.

## Frontend restrictions

Dashboard and storefront code must not:

- import `lib/supabase/admin.ts` or another privileged client;
- choose `organizationId` as authority from browser input;
- implement tenant selection in browser state;
- create independent `isPaid`, `isTrial`, or equivalent authorization logic;
- read billing tables directly from UI code;
- weaken or bypass RLS;
- add generic writes for the `authenticated` database role;
- alter core `SECURITY DEFINER` functions without architecture and security
  review;
- expose a general-purpose service-role repository;
- trust only route visibility, disabled controls, or hidden UI for
  authorization.

Client input must use explicit DTOs and allow-listed fields. Never spread an
arbitrary browser object into a persistence operation.

## Server integration rules

Server Components and Server Actions should stay thin:

- call the approved domain operation;
- translate domain outcomes into page, form, navigation, or error behavior;
- avoid duplicating validation and authorization rules;
- avoid importing internal repositories or privileged clients;
- return only the minimum safe data required by the UI.

Domain operations are responsible for reauthentication, active Organization
resolution, role enforcement, tenant mapping, resource ownership, business
rules, and safe error semantics.

For Store setup specifically, a missing Store and a cross-tenant Store must not
be distinguishable through the public operation result. Optimistic concurrency
must be surfaced as a safe stale-write outcome that the UI can handle by
refreshing the persisted state.

## Supabase feature evolution contract

Feature developers may propose and implement reviewed feature-level schemas
for domains such as:

- products;
- categories;
- modifiers;
- Store settings;
- opening hours;
- delivery configuration;
- orders.

Every database-backed feature must include, as applicable:

- forward-only migrations;
- explicit Organization and/or Store ownership;
- appropriate foreign keys and deliberate deletion behavior;
- indexes for tenant- and Store-scoped access paths;
- least-privilege grants and RLS;
- tenant-isolation and authorization tests;
- regenerated TypeScript database types.

Feature code must not query tenant-owned records only by a user-controlled ID
or slug when ownership also needs verification.

## Changes requiring architectural review

Architectural and security review is required before changing:

- `public.organizations` ownership or lifecycle;
- the `public.stores` lifecycle or activation semantics;
- `store_memberships` and Store-level access behavior;
- `billing_*` tables or billing projection behavior;
- tenant-resolution helpers or Clerk claim interpretation;
- existing `SECURITY DEFINER` boundaries;
- the Supabase admin-client boundary;
- entitlement, trial, or Store-capacity rules.

These boundaries are shared infrastructure. A feature must not reshape them
only to simplify its local UI or persistence needs.

## Trusted write strategy

Store setup uses the approved hybrid strategy:

```text
draft/setup CRUD
  → narrow server-only Store domain service
  → narrow internal repository
  → Supabase admin client

trial activation / paid activation / capacity
  → transactional PostgreSQL RPC

implemented initial-trial activation
  → activateFirstStoreWithInitialTrial(storeId)
  → normal Clerk-JWT Supabase client
  → activate_first_store_with_initial_trial(uuid)

implemented generic entitlement activation + capacity
  → activateStoreWithinEntitlement(storeId)
  → normal Clerk-JWT Supabase client
  → activate_store_within_entitlement(uuid)

implemented deactivation
  → deactivateStore(storeId)
  → normal Clerk-JWT Supabase client
  → deactivate_store(uuid)
```

The privileged client is an internal persistence mechanism, not a domain API.
It must remain unreachable from Client Components and must not become generic
CRUD. The domain service must constrain both tenant scope and mutable fields.

## Future internal operator support

DeliPlus staff may eventually assist a merchant with Store setup or menu data.
That capability requires a separate, reviewed operator boundary:

```text
internal operator authentication
  + explicit operator authorization
  + verified tenant resolution
  + audit trail
  + shared Store setup business rules
```

Operator tooling must reuse the same domain validation and lifecycle rules. It
must never impersonate `org:admin`, expose generic service-role CRUD, or trust a
browser-selected tenant without server verification.

This document does not authorize or specify an operator identity system, role
model, UI, or audit schema.

## Ownership of future decisions

The following remain feature-specific and require their own approved specs:

- dashboard visual presentation beyond the Overview read contract above;
- automatic downgrade remediation policy;
- post-activation slug policy;
- storefront visibility and cache behavior;
- order-intake authorization;
- catalog, delivery, and order schema/RLS;
- internal operator implementation.

Until those features exist, frontend work must not infer those policies from
route shape, Store setup status, or presentation state.
