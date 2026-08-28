# DeliPlus Architecture

## Purpose

DeliPlus is a multi-tenant SaaS for food-delivery businesses. This document defines the current architectural boundaries. It should evolve through explicit decisions rather than accidental implementation.

## Product surfaces

### 1. Marketing / SaaS acquisition

Public pages used to present DeliPlus and convert merchants.

Examples:

```text
/
/pricing
```

Responsibilities:

- landing page;
- plans and product communication;
- calls to authentication;
- merchant subscription entry points.

### 2. Authentication and tenant selection

Merchant authentication is handled by Clerk.

Examples:

```text
/sign-in
/sign-up
```

Clerk owns:

- user identity;
- sessions;
- Organizations;
- Organization membership;
- active Organization;
- Organization roles.

Authentication answers **who the user is**.

The active Clerk Organization establishes **which business/tenant context is active**.

DeliPlus application rules and PostgreSQL/RLS then answer **which Stores and data inside that tenant the user may access**.

A user may belong to multiple Clerk Organizations.

### 3. Merchant onboarding and billing

A newly created/selected Clerk Organization is not automatically a DeliPlus database tenant merely because it exists in Clerk.

DeliPlus must explicitly provision the application-side tenant.

Conceptual flow:

```text
sign up / sign in
  -> create or select Clerk Organization
  -> detect whether DeliPlus organization exists
  -> create internal organization when appropriate
  -> create and configure a draft Store
  -> mark Store ready
  -> later activate through an approved trial/paid entitlement boundary
  -> operational dashboard
```

Current product direction:

- subscriptions are owned by the Organization;
- the local introductory trial is 15 days on Essential and does not require Stripe;
- paid plan codes are `essential` (one Store), `multi_2` (two Stores), and `multi_3` (three Stores);
- four or more Stores use a sales-assisted path;
- `maxStores` counts only Stores with `status = 'active'`; draft and ready Stores do not consume capacity;
- trial eligibility is a billing policy and must not be bypassed by repeatedly creating Organizations.

The PostgreSQL billing schema, server-only Stripe configuration, verified webhook projection foundation, server-only Organization entitlement resolver, and Store setup foundation exist. Store setup now supports Organization-admin reads, draft creation, name/slug editing, and readiness through a narrow server-only domain boundary. Trial activation, Stripe Checkout, Customer Portal, and Store-capacity enforcement remain separate implementation slices.

### 4. Merchant dashboard

Authenticated area for businesses using DeliPlus.

Base route:

```text
/dashboard
```

Expected feature areas over time:

```text
/dashboard
/dashboard/stores
/dashboard/stores/new
/dashboard/stores/[storeId]
/dashboard/stores/[storeId]/setup
/dashboard/stores/[storeId]/products
/dashboard/stores/[storeId]/categories
/dashboard/stores/[storeId]/orders
/dashboard/stores/[storeId]/delivery
/dashboard/stores/[storeId]/settings
/dashboard/team
/dashboard/billing
```

A user with multiple Organizations operates within one active Organization at a time.

When an Organization owns multiple Stores, Store-scoped dashboard features also require an active/authorized Store context.

DeliPlus will provide the Store selector and Store-specific team-management UX because Store is a DeliPlus domain entity, not a Clerk Organization.

### 5. Public storefront

Each Store is publicly accessible through a stable slug.

Examples:

```text
/pizzaria-do-joao
/acai-central
```

Conceptual route:

```text
/[storeSlug]
```

The slug resolves to a Store; all subsequent storefront queries must be scoped to the resolved Store.

Potential future custom domains should resolve to the same internal Store entity instead of creating a second storefront model.

## Core domain

Current conceptual hierarchy:

```text
Clerk User
  -> membership in one or more Clerk Organizations

Clerk Organization
  <-> DeliPlus organization
        ├── Local trial grants
        ├── Canonical Stripe Customer identity
        ├── Paid subscription projection
        └── Stores
             ├── Store memberships
             ├── Categories
             ├── Products
             ├── Delivery configuration
             └── Orders
```

The Clerk Organization and DeliPlus `organizations` row represent the same tenant at different system boundaries:

- Clerk Organization: identity, Organization membership, active Organization and Organization roles;
- DeliPlus organization: stable internal UUID and application-domain ownership.

A Store represents an establishment/storefront inside an Organization.

The database supports:

```text
Organization 1 -> N Stores
Clerk Users N -> N Stores through store_memberships
```

Plan capacity may limit entitlement to one, two, or three active Stores, but that is a billing/business rule, not a database cardinality constraint. Draft and ready Store records do not consume capacity.

## Authorization layers

DeliPlus uses two related but distinct membership levels.

### Organization membership — Clerk

Answers:

> Is this user a member of this business/tenant, and what Organization role do they have?

### Store membership — DeliPlus / PostgreSQL

Answers:

> If this user is an Organization member, which Store(s) inside that Organization may they operate?

Current rule:

```text
Organization admin
  -> all Stores in the active Organization

Organization member
  -> only explicitly assigned Stores
```

Store assignments do not replace Clerk membership. A user must still belong to the Clerk Organization.

## Service responsibilities

### Clerk

Responsible for:

- authentication;
- user identity;
- sessions;
- Organizations;
- Organization membership;
- active Organization;
- Clerk Organization roles;
- Organization invitations/member lifecycle.

Clerk is the canonical source of Organization membership.

Server-side Supabase clients pass the current Clerk session token through Supabase Third-Party Auth.

### Supabase / PostgreSQL

Responsible for:

- internal DeliPlus organizations;
- Stores;
- Store memberships/assignments;
- catalog;
- delivery configuration;
- orders;
- normalized billing projection/state used by the application;
- tenant/Store-aware application data;
- RLS authorization boundaries over application data.

PostgreSQL is the canonical source for Store assignment because Store is a DeliPlus entity.

The DeliPlus organization maps to Clerk through a unique `clerk_organization_id`, while keeping an internal UUID as its primary key.

The current billing database foundation separates:

- `billing_trial_grants` for local trial history;
- `billing_customers` for canonical Organization-to-Stripe-Customer identity;
- `billing_subscriptions` for the current paid Subscription projection;
- `stripe_webhook_events` for minimum webhook idempotency metadata.

All four tables have RLS enabled and no direct `anon` or `authenticated` Data API access. Paid projection writes use one atomic `SECURITY INVOKER` PostgreSQL function callable only by `service_role`; that role receives only the table privileges required by the webhook slice.

Normal Organization entitlement reads use the zero-argument `public.resolve_active_organization_entitlement_facts()` function. It is a reviewed, `STABLE`, `SECURITY DEFINER` read boundary with an empty `search_path`, derives the active tenant only from the verified Clerk JWT, and returns only local-trial and paid-projection facts needed by the server resolver. Only `authenticated` may execute it; the billing tables remain unavailable for direct authenticated reads.

### Stripe

Initial responsibility:

- Organization-level merchant subscription checkout;
- paid Customer/Subscription lifecycle;
- billing portal when implemented;
- billing webhooks;
- plan/Store-capacity entitlement source in conjunction with DeliPlus billing projection.

The current Stripe server and webhook foundations provide:

- the exact official Stripe Node SDK;
- a lazy server-only client using only `STRIPE_SECRET_KEY`;
- a typed registry for `essential`, `multi_2`, and `multi_3` with Store capacities 1, 2, and 3;
- environment-specific Price resolution performed lazily from approved `PlanCode` values;
- trusted return-origin validation with an explicit stable origin or Vercel Preview fallback;
- a public Node-runtime webhook route authenticated by the Stripe signature rather than Clerk;
- raw-body verification before Event processing;
- current-Subscription reconciliation for the approved Checkout, Subscription, and Invoice Event set;
- a single paid-subscription reducer and atomic Event-ledger/projection transaction.

Only supported, verified webhook processing may retrieve the current Stripe Subscription. Imports, builds, tests, and unrelated Events perform no Stripe API call. This foundation does not create Customers, Checkout Sessions, Portal Sessions, Products, Prices, or local trials. The initial trial remains local to DeliPlus/PostgreSQL.

End-customer payment for food orders is outside the initial scope.

## Provisioning boundary

Creating a Clerk Organization does not itself create:

- a Supabase `organizations` row;
- a Store;
- a Stripe subscription.

Adding a Clerk Organization member does not itself assign Store access.

Those effects occur only through explicit DeliPlus onboarding/team-management flows.

This allows DeliPlus to validate Store ownership and Store assignment during setup, then validate billing/trial eligibility and active-Store capacity at the separate activation boundary.

The current Store setup write path uses the privileged Supabase client only
behind `lib/stores/store-setup.repository.ts`, after Clerk admin authorization
and RLS-backed tenant/Store resolution. Normal `authenticated` Data API access
remains SELECT-only. Store activation is not part of this boundary.

## Team management

The user-facing goal is one DeliPlus management experience even though Clerk and PostgreSQL have different responsibilities.

Conceptual future flow:

```text
dashboard/team
  -> invite/add member
  -> Clerk Organization membership
  -> assign Store(s)
  -> store_memberships
```

For Organization admins, Store assignment is not required for their own access because admins may access all Stores in the Organization.

For normal Organization members, one or more Store assignments are required before Store-scoped access is granted.

## Server/client boundary

Prefer server execution for:

- authenticated data access;
- authorization decisions;
- tenant/Store provisioning;
- Store membership mutations;
- privileged Supabase access;
- Stripe operations;
- webhook processing;
- secret-bearing integrations.

Prefer Client Components only where interaction requires browser-side state or APIs.

Never use a Client Component as a security boundary.

## Dashboard resolution

A Store-scoped dashboard request conceptually follows:

```text
authenticated Clerk user
  -> verified active Clerk Organization
  -> resolve internal DeliPlus organization
  -> resolve requested/active Store
  -> if Organization admin: verify Store belongs to Organization
  -> if Organization member: verify Store belongs to Organization
       AND matching store_membership exists for Clerk user
  -> authorize requested action
  -> query Store-scoped data
```

Do not accept Organization/Store context supplied by the client without verification.

## Store resolution

A storefront request conceptually follows:

```text
request /<storeSlug>
  -> validate slug
  -> resolve active Store
  -> use canonical Store ID
  -> load only explicitly public data belonging to that Store
  -> render storefront
```

Public storefront access is separate from merchant dashboard authorization.

## Cross-cutting concerns

The following need explicit treatment throughout implementation:

- tenant isolation;
- Store-level authorization;
- Organization admin bypass rules;
- RLS;
- Organization-to-Store entitlement;
- server/client boundaries;
- validation of untrusted input;
- webhook idempotency;
- observability and error handling;
- feature scope and migrations.

## Architecture decisions

Durable decisions are recorded under `docs/decisions/`.

Relevant ADRs:

- `ADR-001-tenant-and-store-billing-model.md`
- `ADR-002-store-level-access-model.md`
- `ADR-003-trusted-server-write-boundary.md`
- `ADR-004-stripe-billing-and-entitlement-model.md`
