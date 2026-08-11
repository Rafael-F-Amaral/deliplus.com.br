# DeliPlus Architecture

## Purpose

DeliPlus is a multi-tenant SaaS for food-delivery businesses. This document defines the initial architectural boundaries. It is intentionally high-level and should evolve through explicit decisions rather than accidental implementation.

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

### 2. Authentication

Merchant authentication is handled by Clerk.

Examples:

```text
/sign-in
/sign-up
```

Authentication answers **who the user is**. Application authorization answers **what that user may access**.

### 3. Merchant dashboard

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

### 4. Public storefront

Each store is publicly accessible through a stable slug.

Examples:

```text
/pizzaria-do-joao
/acai-central
```

Conceptual route:

```text
/[storeSlug]
```

The slug resolves to a store; all subsequent storefront queries must be scoped to the resolved store.

Potential future custom domains should resolve to the same internal store entity instead of creating a second storefront model.

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

Initial conceptual hierarchy:

```text
Organization
  ├── Memberships
  ├── Subscription
  └── Stores
       ├── Categories
       ├── Products
       ├── Delivery configuration
       └── Orders
```

The MVP may launch with one store per organization, but the domain should avoid making this irreversible.

## Service responsibilities

### Clerk

Responsible for:

- authentication;
- user identity;
- sessions;
- authentication UI/integration.

Clerk is not the canonical source for DeliPlus domain authorization relationships.

### Supabase / PostgreSQL

Responsible for:

- organizations;
- memberships;
- stores;
- catalog;
- delivery configuration;
- orders;
- billing projection/state used by the application;
- tenant-aware application data.

PostgreSQL is the canonical application data store.

### Stripe

Initial responsibility:

- merchant subscription checkout;
- subscription lifecycle;
- billing portal when implemented;
- billing webhooks.

End-customer payment for food orders is outside the initial scope.

## Server/client boundary

Prefer server execution for:

- authenticated data access;
- authorization decisions;
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
  -> resolve active store
  -> use canonical store ID
  -> load only data belonging to that store
  -> render storefront
```

Do not continue using a raw slug as the sole authorization/ownership predicate after resolution.

## Dashboard resolution

A dashboard request conceptually follows:

```text
authenticated Clerk user
  -> resolve application membership
  -> resolve active organization/store context
  -> authorize requested action
  -> query tenant-scoped data
```

The exact active-store UX is intentionally not fixed yet.

## Cross-cutting concerns

The following need explicit treatment throughout implementation:

- tenant isolation;
- authorization;
- RLS;
- server/client boundaries;
- validation of untrusted input;
- webhook idempotency;
- observability and error handling;
- feature scope and migrations.

## Architecture changes

When a decision changes a durable system assumption, add an ADR under `docs/decisions/`.

Examples:

- one store vs multiple stores per organization;
- custom domains;
- order lifecycle design;
- RLS strategy;
- Stripe subscription ownership model.
