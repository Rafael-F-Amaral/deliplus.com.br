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

Clerk also owns Organizations, Organization membership and Organization roles.

Authentication answers **who the user is**. The active Clerk Organization establishes **which tenant context is active**. DeliPlus application rules and PostgreSQL/RLS then answer **what data/actions are allowed inside that tenant**.

A user may belong to multiple Clerk Organizations.

### 3. Merchant onboarding and billing

A newly created/selected Clerk Organization is not automatically a DeliPlus database tenant merely because it exists in Clerk.

DeliPlus must explicitly provision the application-side tenant.

Conceptual flow:

```text
sign up / sign in
  -> create or select Clerk Organization
  -> detect whether DeliPlus organization exists
  -> onboarding / plan entitlement
  -> create internal organization when appropriate
  -> provision initial Store
  -> dashboard
```

Current product direction:

- subscriptions are owned by the Organization;
- Essential supports one Store;
- higher plans may increase the Store limit;
- the intended introductory trial is 15 days on Essential;
- trial eligibility is a billing policy and must not be bypassed by repeatedly creating Organizations.

Exact Stripe checkout timing, trial eligibility and higher-plan limits belong to the billing specification.

### 4. Merchant dashboard

Authenticated area for businesses using DeliPlus.

Base route:

```text
/dashboard
```

Expected feature areas over time:

```text
/dashboard
/dashboard/orders
/dashboard/products
/dashboard/categories
/dashboard/delivery
/dashboard/settings
/dashboard/billing
```

A user with multiple Organizations must operate within one active Organization at a time.

If an Organization owns multiple Stores, the dashboard must eventually establish an active Store context where the feature requires Store-scoped data.

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

## Application boundaries

The project begins as one Next.js application. Avoid splitting into multiple deployables before operational needs justify it.

Conceptual structure:

```text
app/
  (marketing)/
  (auth)/
  dashboard/
  [storeSlug]/

components/
  ui/
  marketing/
  dashboard/
  storefront/

lib/
  supabase/
  clerk/
  stripe/
  validations/
```

Route groups such as `(marketing)` are organizational and should not alter public URLs.

## Core domain

Current conceptual hierarchy:

```text
Clerk User
  -> membership in one or more Clerk Organizations

Clerk Organization
  <-> DeliPlus organization
        ├── Subscription / plan entitlement
        └── Stores
             ├── Categories
             ├── Products
             ├── Delivery configuration
             └── Orders
```

The Clerk Organization and DeliPlus `organizations` row represent the same tenant at different system boundaries:

- Clerk Organization: identity, membership, active Organization and Clerk roles;
- DeliPlus organization: stable internal UUID and application-domain ownership.

A Store represents an establishment/storefront inside an Organization.

The database supports `Organization 1 -> N Stores`. The Essential plan may initially limit entitlement to one Store, but that is a billing/business rule, not a database cardinality constraint.

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
- authentication UI/integration.

Clerk is the canonical source of Organization membership.

Server-side Supabase clients pass the current Clerk session token through Supabase Third-Party Auth. This authenticates database requests without creating a second application login.

### Supabase / PostgreSQL

Responsible for:

- internal DeliPlus organizations;
- Stores;
- catalog;
- delivery configuration;
- orders;
- normalized billing projection/state used by the application;
- tenant-aware application data;
- RLS authorization boundaries over application data.

PostgreSQL is the canonical application data store.

The DeliPlus organization maps to Clerk through a unique `clerk_organization_id`, while keeping an internal UUID as its primary key.

### Stripe

Initial responsibility:

- Organization-level merchant subscription checkout;
- trial/subscription lifecycle;
- billing portal when implemented;
- billing webhooks;
- plan/Store-capacity entitlement source in conjunction with DeliPlus billing projection.

End-customer payment for food orders is outside the initial scope.

## Provisioning boundary

Creating a Clerk Organization does not itself create:

- a Supabase `organizations` row;
- a Store;
- a Stripe subscription.

Those effects occur only through an explicit DeliPlus onboarding/provisioning flow.

This allows DeliPlus to validate billing/trial eligibility and create application records coherently.

## Server/client boundary

Prefer server execution for:

- authenticated data access;
- authorization decisions;
- tenant provisioning;
- privileged Supabase access;
- Stripe operations;
- webhook processing;
- secret-bearing integrations.

Prefer Client Components only where interaction requires browser-side state or APIs.

Never use a Client Component as a security boundary.

## Store resolution

A storefront request conceptually follows:

```text
request /<storeSlug>
  -> validate slug
  -> resolve active Store
  -> use canonical Store ID
  -> load only data belonging to that Store
  -> render storefront
```

Do not continue using a raw slug as the sole authorization/ownership predicate after resolution.

## Dashboard resolution

A dashboard request conceptually follows:

```text
authenticated Clerk user
  -> verified active Clerk Organization
  -> resolve internal DeliPlus organization
  -> verify subscription/entitlement where required
  -> resolve active Store where required
  -> authorize requested action
  -> query tenant-scoped data
```

Do not accept organization/store context supplied by the client without verification.

## Cross-cutting concerns

The following need explicit treatment throughout implementation:

- tenant isolation;
- authorization;
- RLS;
- Organization-to-Store entitlement;
- server/client boundaries;
- validation of untrusted input;
- webhook idempotency;
- observability and error handling;
- feature scope and migrations.

## Architecture changes

When a decision changes a durable system assumption, add an ADR under `docs/decisions/`.

Current tenant/billing ownership is recorded in `ADR-001-tenant-and-store-billing-model.md`.
