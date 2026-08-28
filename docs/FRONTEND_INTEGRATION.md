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
or enforce paid Store capacity. Those behaviors belong to a future reviewed
activation boundary.

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
  → future transactional PostgreSQL RPC
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

- Store activation and deactivation operations;
- initial-trial activation and historical trial eligibility;
- paid activation and atomic Store-capacity enforcement;
- post-activation slug policy;
- storefront visibility and cache behavior;
- order-intake authorization;
- catalog, delivery, and order schema/RLS;
- internal operator implementation.

Until those features exist, frontend work must not infer those policies from
route shape, Store setup status, or presentation state.
