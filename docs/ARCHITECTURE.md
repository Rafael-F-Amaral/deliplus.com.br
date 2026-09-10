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
  -> activate the first eligible Store with a local initial trial
  -> operational dashboard
```

The approved target navigation is `Clerk signup + Organization -> /onboarding ->
trusted automatic Organization provisioning -> /dashboard/stores/new`. The mutation
must run through an explicit server-side action, never during Server Component render
or GET. The current billing-page `Configurar organização` control is only a temporary
development/E2E bridge and is not part of the final merchant journey.

Current product direction:

- subscriptions are owned by the Organization;
- the local introductory trial is 15 days on Essential and does not require Stripe;
- paid plan codes are `essential` (one Store), `multi_2` (two Stores), and `multi_3` (three Stores);
- four or more Stores use a sales-assisted path;
- `maxStores` counts only Stores with `status = 'active'`; draft and ready Stores do not consume capacity;
- trial eligibility is a billing policy and must not be bypassed by repeatedly creating Organizations.

The PostgreSQL billing schema, server-only Stripe configuration, verified webhook projection foundation, server-only Organization entitlement resolver, Store setup foundation, first-Store trial activation, and generic Store entitlement activation boundaries exist. Store setup supports Organization-admin reads, draft creation, name/slug editing, and readiness. `activateFirstStoreWithInitialTrial(storeId)` atomically activates the first eligible ready Store and creates its 15-day Essential trial. `activateStoreWithinEntitlement(storeId)` and `deactivateStore(storeId)` enforce the current paid/local plan capacity for later lifecycle changes. The Stripe Checkout backend and billing acquisition UI/Server Action now exist; Customer Portal remains a separate implementation slice.

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
- `billing_checkout_attempts` for immutable acquisition intents, Session correlation,
  retry/recovery and one non-ended reservation per Organization across plans.

All five tables have RLS enabled and no direct `anon` or `authenticated` Data API access. Paid projection writes use one atomic `SECURITY INVOKER` PostgreSQL function callable only by `service_role`; that role receives only the table privileges required by the webhook slice. Checkout Customer/attempt writes use five narrow service-only `SECURITY DEFINER` RPCs; direct Customer/attempt access remains SELECT-only for `service_role`.

Normal Organization entitlement reads use the zero-argument `public.resolve_active_organization_entitlement_facts()` function. It is a reviewed, `STABLE`, `SECURITY DEFINER` read boundary with an empty `search_path`, derives the active tenant only from the verified Clerk JWT, and returns only local-trial and paid-projection facts needed by the server resolver. Only `authenticated` may execute it; the billing tables remain unavailable for direct authenticated reads.

First-Store trial activation uses the narrow `public.activate_first_store_with_initial_trial(uuid)` function. It is a `VOLATILE`, `SECURITY DEFINER` transaction boundary with an empty `search_path`. It derives the Clerk User, active Organization and admin role from the verified JWT, serializes both Organization and Clerk User eligibility, and commits the initial grant plus `ready -> active` transition atomically. `authenticated` receives only EXECUTE on this function; direct Store and billing writes remain denied.

Generic Store lifecycle changes use `public.activate_store_within_entitlement(uuid)` and `public.deactivate_store(uuid)`. Both are narrow `VOLATILE`, `SECURITY DEFINER` boundaries that accept only a Store selector, rederive Organization-admin authority from the verified Clerk JWT, and serialize through the same Organization advisory lock as trial and paid-projection writers. Activation resolves paid-first entitlement from local PostgreSQL facts, maps `essential`/`multi_2`/`multi_3` to capacities 1/2/3 inside the transaction, counts only active Stores, and atomically performs `ready|inactive -> active`. Deactivation performs `active -> inactive` without requiring entitlement. Neither operation changes billing rows or grants generic table writes.

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

Supported, verified webhook processing retrieves current Stripe Subscription state.
The explicit `createSubscriptionCheckoutSession(planCode)` billing action also reads
Stripe to validate catalog, Customer, subscriptions and owned Sessions. It requires
the verified active Organization admin, resolves the internal Organization through
normal Clerk-JWT/RLS reads, then uses the narrow billing repository. Customer
claim/create/finalize precedes durable attempt claim/create/attach. External calls
never span database transactions. Stable persisted keys and frozen snapshots protect
retries; unknown outcomes retain the reservation instead of rotating keys.

Hosted Checkout uses one quantity-1 monthly BRL Price and a dedicated card-only
Payment Method Configuration, with Adaptive Pricing disabled. MVP commercial
configuration is Essencial R$ 99,90, Duo R$ 189,90 and Trio R$ 279,90 per month;
these amounts are not domain identity or authorization constants.

Imports, builds, automated tests and unrelated Events perform no real Stripe API call.
The billing acquisition UI uses a thin Server Action and a read-only success page;
its first real Sandbox E2E is recorded in `docs/DEVELOPMENT.md`. Portal, remote catalog
creation, tax, Stripe trial and Store mutations are not part of this UI feature. Paid
entitlement still comes only from the verified webhook projection, never a redirect. See
`docs/features/stripe-checkout/SPEC.md` for the acquisition/recovery contract.

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
remains SELECT-only. Store setup does not activate Stores. Initial-trial activation,
generic entitlement activation, and deactivation use the normal Clerk-JWT Supabase
client plus their transactional database RPCs; they do not use the privileged
application client.

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
