# Deli Plus — Database Tenant Core

**Path:** `docs/features/database-tenant-core/SPEC.md`  
**Status:** Draft for review  
**Scope:** First business-domain database migration  
**Last updated:** 2026-08-21

## 1. Purpose

Define the first multi-tenant database foundation for Deli Plus.

This feature introduces only the minimum database structure required to represent:

- a Deli Plus tenant linked to a Clerk Organization;
- one or more stores owned by that tenant;
- tenant isolation enforced by PostgreSQL Row Level Security (RLS);
- explicit Data API grants for authenticated users.

This specification intentionally does **not** implement products, categories, orders, delivery, billing, public storefront access, webhooks, or organization synchronization.

The expected implementation flow is:

`SPEC → PLAN → MIGRATION → LOCAL RESET → RLS TESTS → REVIEW → STAGING`

---

## 2. Existing architecture

The project already uses:

- Next.js App Router;
- Clerk for authentication;
- Clerk Organizations for organization membership and roles;
- Supabase PostgreSQL for application data;
- Supabase Third-Party Auth with Clerk;
- `@supabase/supabase-js`;
- Clerk session tokens passed to Supabase through `accessToken`;
- Supabase CLI and local Docker development;
- a hosted Supabase project named `Deli Plus - Staging`.

Clerk is the source of truth for:

- authenticated user identity;
- Organization membership;
- active Organization;
- Organization role.

Supabase is the source of truth for Deli Plus application data.

The database must not duplicate Clerk membership unless a future feature has a concrete reason to do so.

---

## 3. Locked decisions for v1

The following decisions are part of this specification and should not be changed during implementation without updating the spec first.

### 3.1 Tenant identity

A Deli Plus tenant is represented internally by `public.organizations`.

Each row maps to exactly one Clerk Organization through:

`organizations.clerk_organization_id`

The Clerk Organization ID is an external identifier and must **not** be used as the PostgreSQL primary key.

The Deli Plus database uses UUID primary keys internally.

### 3.2 One Organization can own multiple Stores

The relationship is:

`organization 1 → N stores`

The database must not enforce a one-store limitation.

The current product direction is that Store capacity is controlled by the Organization's billing entitlement instead:

- Essential allows one Store;
- higher plans may allow additional Stores;
- exact higher-plan limits belong to the billing specification.

This migration must not encode plan limits as database cardinality constraints.

### 3.3 Clerk Organization slug is not Store slug

The Clerk Organization slug is authentication/organization metadata.

The Deli Plus store slug is the public storefront identifier used by routes such as:

`/{storeSlug}`

These values are independent.

### 3.4 Clerk remains the membership source of truth

Do not create a local `organization_members` table in this feature.

Membership and Organization roles come from Clerk.

### 3.5 Active Organization determines tenant context

Every authenticated tenant-scoped request must use the active Clerk Organization contained in the Clerk session token.

For the current Clerk session-token format, the active Organization context is available in the Organization claim:

- Organization ID: `o.id`
- Organization role: `o.rol`

If no active Organization exists in the token, tenant-scoped database access must return no rows and reject writes.

### 3.6 Secure by default

- RLS must be explicitly enabled in the migration even if automatic RLS is enabled in the Supabase project settings.
- Tables must not be exposed to `anon`.
- Data API privileges must be explicitly granted only where required.
- No delete access is granted to normal authenticated users in this feature.
- No service-role key is introduced into the application.

---

## 4. Goals

This feature must:

1. Create `public.organizations`.
2. Create `public.stores`.
3. Link each organization to one Clerk Organization.
4. Link each store to one internal organization.
5. Support multiple stores per organization.
6. Enable RLS on both tables.
7. Read the active Clerk Organization from `auth.jwt()`.
8. Prevent cross-tenant reads and writes.
9. Allow authenticated organization members to read their own tenant core data.
10. Restrict tenant-core creation and updates to Clerk Organization admins.
11. Explicitly grant only the Data API privileges required by this feature.
12. Be fully reproducible with `supabase db reset`.
13. Be testable locally without real production data.
14. Produce/update generated TypeScript database types after the schema is accepted.

---

## 5. Non-goals

Do **not** implement in this feature:

- products;
- categories;
- product variants;
- pizza sizes or flavors;
- complements or modifiers;
- orders;
- order items;
- customers;
- delivery regions;
- delivery fees;
- operating hours;
- Stripe;
- subscriptions;
- public storefront reads;
- anonymous database access;
- Clerk webhooks;
- Supabase webhooks;
- Clerk Organization provisioning;
- automatic synchronization of Clerk Organization metadata;
- local membership tables;
- custom Deli Plus roles;
- soft deletion framework;
- audit log framework;
- storage buckets;
- Realtime;
- a browser Supabase client unless required by an already-approved use case.

---

## 6. Domain model

```text
Clerk

User
  │
  └── Active Organization
          │
          │ o.id
          ▼

Supabase

organizations
  ├── id (UUID)
  ├── clerk_organization_id
  │
  └── stores
        ├── id (UUID)
        ├── organization_id
        ├── name
        ├── slug
        └── status
```

The primary tenant boundary in PostgreSQL is the internal `organizations.id`.

The Clerk Organization ID is used to resolve which internal organization the current authenticated request is allowed to access.

---

## 7. Table: `public.organizations`

### Purpose

Internal Deli Plus tenant record.

It exists to provide a stable internal UUID that can be referenced by stores, subscriptions, orders and future tenant-owned data without coupling foreign keys to Clerk identifiers.

### Required columns

| Column | Type | Requirements |
| --- | --- | --- |
| `id` | `uuid` | Primary key. Generated with PostgreSQL UUID generation. |
| `clerk_organization_id` | `text` | `NOT NULL`, globally `UNIQUE`. |
| `created_at` | `timestamptz` | `NOT NULL`, default current timestamp. |
| `updated_at` | `timestamptz` | `NOT NULL`, default current timestamp. |

### Intentionally excluded

Do not store these yet:

- Clerk Organization name;
- Clerk Organization slug;
- billing fields;
- Stripe IDs;
- plan;
- subscription status;
- member count.

Clerk remains the source of truth for Clerk-managed organization metadata.

Fields should only be duplicated later when Deli Plus has a concrete application requirement for them.

---

## 8. Table: `public.stores`

### Purpose

Represents a delivery establishment/store owned by a Deli Plus organization.

### Required columns

| Column | Type | Requirements |
| --- | --- | --- |
| `id` | `uuid` | Primary key. Generated with PostgreSQL UUID generation. |
| `organization_id` | `uuid` | `NOT NULL`. Foreign key to `organizations.id`. |
| `name` | `text` | `NOT NULL`. Trimmed application input. |
| `slug` | `text` | `NOT NULL`, globally `UNIQUE`. |
| `status` | `text` | `NOT NULL`, default `draft`. |
| `created_at` | `timestamptz` | `NOT NULL`, default current timestamp. |
| `updated_at` | `timestamptz` | `NOT NULL`, default current timestamp. |

### Store status values

For v1, allowed values are:

- `draft`
- `active`
- `inactive`

Use a check constraint rather than a PostgreSQL enum so future states can be introduced without unnecessary enum migration complexity.

### Organization foreign key

The database must preserve referential integrity.

Do not add automatic destructive tenant deletion behavior in this feature.

The foreign key should therefore avoid silently deleting stores if an organization row is deleted.

Organization deletion will be designed separately.

### Indexes

The migration must provide:

- the unique index implied by `stores.slug`;
- an index on `stores.organization_id`.

### Slug rules

A store slug is the future public identifier for:

`/{storeSlug}`

The canonical stored slug must:

- be lowercase;
- use only ASCII letters `a-z`, digits `0-9`, and hyphens;
- not start or end with a hyphen;
- not contain empty path-like segments;
- have a reasonable bounded length;
- be globally unique across Deli Plus.

Recommended v1 length:

- minimum: 3 characters;
- maximum: 63 characters.

The migration should enforce structural validity with a check constraint.

Reserved application routes such as `dashboard`, `api`, `sign-in`, and future marketing routes are an **application-level concern** and should be validated by a central application rule rather than hardcoded permanently into the database migration.

---

## 9. Timestamp behavior

`created_at` must never be rewritten by normal updates.

`updated_at` should be updated automatically by the database whenever a mutable tenant-core row changes.

The implementation may introduce one small reusable trigger function for `updated_at`.

If a shared timestamp trigger already exists by implementation time, reuse it instead of creating a duplicate.

---

## 10. Clerk claim helpers

RLS policies will be used repeatedly across future tenant-owned tables.

The migration should avoid copying fragile JWT JSON expressions into every future policy.

Create a small private database helper layer for extracting trusted Clerk Organization context from `auth.jwt()`.

Recommended private helpers:

### `private.clerk_organization_id()`

Returns the active Clerk Organization ID from:

`auth.jwt()->'o'->>'id'`

Return type:

`text`

If no active Organization exists, return `NULL`.

### `private.clerk_organization_role()`

Returns the active Clerk Organization role from:

`auth.jwt()->'o'->>'rol'`

Return type:

`text`

For Clerk's default Organization roles, expected examples include:

- `admin`
- `member`

If there is no active Organization, return `NULL`.

### Helper requirements

- Keep helpers outside the exposed `public` schema.
- They must not accept a tenant ID from the caller.
- They must derive tenant context only from the verified request JWT.
- They must be minimal and deterministic for the request.
- Do not introduce a `SECURITY DEFINER` function unless implementation proves it is required.
- If helper execution privileges are required by PostgreSQL, grant only the minimum necessary privilege to `authenticated`.
- Do not grant these helpers to `anon`.

---

## 11. Data API grants

The Deli Plus Supabase project uses explicit Data API exposure.

RLS and PostgreSQL grants are separate security layers.

For this feature, grant the `authenticated` role only the privileges needed by the approved policies.

### `public.organizations`

Authenticated role:

- `SELECT`
- `INSERT`
- `UPDATE`

Do not grant:

- `DELETE`
- `TRUNCATE`

### `public.stores`

Authenticated role:

- `SELECT`
- `INSERT`
- `UPDATE`

Do not grant:

- `DELETE`
- `TRUNCATE`

### Anonymous role

Do not grant `anon` privileges on either table in this feature.

Public storefront access will be designed separately.

---

## 12. Row Level Security

RLS must be explicitly enabled on:

- `public.organizations`
- `public.stores`

No policy should trust an organization ID supplied by URL params, request body, form data, query string, or client state.

Authorization comes from the verified Clerk JWT.

---

## 13. RLS: `organizations`

### SELECT

An authenticated user can read an organization only when:

`organizations.clerk_organization_id = private.clerk_organization_id()`

Expected behavior:

- active Organization A → can read A;
- active Organization A → cannot read B;
- no active Organization → reads zero organizations.

### INSERT

Only a Clerk Organization admin may create the internal organization row.

Requirements:

- current Clerk Organization role is `admin`;
- inserted `clerk_organization_id` exactly equals `private.clerk_organization_id()`;
- cross-tenant insertion is rejected;
- unique constraint prevents duplicate internal organizations for the same Clerk Organization.

This allows a future onboarding flow to provision the Deli Plus organization after the Clerk Organization exists and is active.

### UPDATE

Only a Clerk Organization admin may update their own organization row.

Both `USING` and `WITH CHECK` must preserve tenant ownership.

Changing `clerk_organization_id` to another tenant must be impossible through normal authenticated access.

### DELETE

No authenticated delete policy in v1.

---

## 14. RLS: `stores`

Every store operation must resolve tenant ownership through:

`stores.organization_id → organizations.id → organizations.clerk_organization_id`

### SELECT

Any authenticated member of the active Clerk Organization may read stores belonging to that organization.

A member of Organization A must never be able to read a store owned by Organization B.

### INSERT

Only an active Clerk Organization admin may insert a store.

The supplied `organization_id` must resolve to the same organization represented by the active Clerk Organization claim.

A caller must not be able to create a store for another tenant by guessing or obtaining another UUID.

### UPDATE

Only an active Clerk Organization admin may update a store belonging to the active organization.

Both `USING` and `WITH CHECK` must prevent the store from being reassigned to another organization.

### DELETE

No authenticated delete policy in v1.

Store deletion/archiving behavior will be specified later.

---

## 15. Role policy for tenant core

For this initial core:

### Clerk Organization admin

May:

- read own organization;
- insert own internal organization mapping;
- update own organization row;
- read own stores;
- create own stores;
- update own stores.

May not:

- access another tenant;
- delete organizations;
- delete stores.

### Clerk Organization member

May:

- read own organization;
- read own stores.

May not:

- create/update/delete organizations;
- create/update/delete stores.

This conservative rule applies only to the tenant core.

Product/order permissions will be defined separately and may allow additional Clerk roles or permissions.

---

## 16. No active Organization behavior

An authenticated Clerk user can exist without a valid active Organization context during transitions or incorrect navigation.

Database behavior must remain safe.

When the Clerk JWT has no `o.id`:

- `private.clerk_organization_id()` returns `NULL`;
- tenant SELECT queries return no rows;
- tenant INSERT/UPDATE operations fail RLS;
- the database must never fall back to a tenant ID supplied by the client.

Application UX for selecting/creating an Organization is outside this migration.

---

## 17. Public storefront access

Public access is explicitly out of scope.

Do not add `anon` policies such as:

`status = 'active'`

yet.

When the storefront feature is designed, public-safe access should be added intentionally.

If `stores` later contains private configuration, prefer exposing a dedicated public view/RPC or explicitly selected public-safe data rather than granting broad anonymous access to the entire tenant-core record.

---

## 18. Migration strategy

Create one migration for this feature.

Recommended command:

```bash
yarn supabase migration new tenant_core
```

The generated migration must contain all schema, constraints, indexes, grants, helper functions, triggers, RLS enablement and policies needed by this specification.

Do not create tables manually in the hosted Supabase Dashboard.

The migration is the source of truth.

---

## 19. Local validation workflow

Implementation must be reproducible from a clean local database.

Required workflow:

```bash
yarn supabase db reset
```

A successful reset must recreate the tenant-core schema and policies from migrations alone.

After the migration applies successfully, run project validations:

```bash
yarn lint
yarn typecheck
yarn build
```

Before applying anything remotely:

```bash
yarn supabase db push --dry-run
```

Do not run a real remote `db push` until the migration and RLS tests have been reviewed.

---

## 20. RLS isolation test matrix

RLS must be tested before this migration reaches Staging.

Use local-only fake tenant identifiers or another safe local strategy.

Do not use real customer data.

At minimum test:

| Actor/context | Operation | Tenant A | Tenant B |
| --- | --- | --- | --- |
| Anonymous | SELECT organization/store | Denied | Denied |
| Authenticated, no active org | SELECT | No rows | No rows |
| Org A member | SELECT | Allowed | Denied |
| Org A member | INSERT/UPDATE | Denied | Denied |
| Org A admin | SELECT | Allowed | Denied |
| Org A admin | INSERT own tenant/store | Allowed | N/A |
| Org A admin | INSERT using Tenant B IDs | N/A | Denied |
| Org A admin | UPDATE own store | Allowed | N/A |
| Org A admin | Reassign store to Tenant B | N/A | Denied |
| Org A admin | DELETE | Denied | Denied |

The implementation plan must explain how these tests will be executed locally.

Synthetic JWT claim context may be used in local SQL tests if it accurately exercises `auth.jwt()` and does not weaken production policies.

---

## 21. TypeScript database types

After the migration is stable locally, generate Supabase TypeScript types from the local schema.

Prefer a project-owned generated file such as:

`lib/supabase/database.types.ts`

unless the existing repository already defines another convention.

The server Supabase client should then use the generated `Database` type where appropriate.

Generated database types must be reproducible from the local schema and committed to Git.

Do not manually maintain generated table types.

---

## 22. Staging rollout

Only after:

- migration review;
- successful `db reset`;
- RLS isolation tests;
- lint;
- typecheck;
- build;
- `db push --dry-run`;

may the migration be proposed for `Deli Plus - Staging`.

The actual Staging push should be an explicit reviewed action.

Production is out of scope.

---

## 23. Acceptance criteria

This feature is complete when all of the following are true:

- [ ] One reviewed migration represents the tenant core.
- [ ] `organizations` uses an internal UUID primary key.
- [ ] `clerk_organization_id` is unique and not the database PK.
- [ ] `stores` references `organizations.id`.
- [ ] Multiple stores per organization are supported.
- [ ] Store slugs are globally unique and structurally validated.
- [ ] RLS is explicitly enabled on both tables.
- [ ] No `anon` table privileges are granted.
- [ ] `authenticated` has only the required Data API privileges.
- [ ] Tenant context comes from the verified Clerk JWT.
- [ ] No active Organization results in no tenant access.
- [ ] Members can read only their own tenant.
- [ ] Admins can create/update only their own tenant core data.
- [ ] Cross-tenant access tests fail as expected.
- [ ] Authenticated delete remains unavailable.
- [ ] No `organization_members` table exists.
- [ ] No product/order/billing schema was introduced.
- [ ] `yarn supabase db reset` succeeds from a clean local database.
- [ ] Supabase TypeScript types are generated from the local schema.
- [ ] `yarn lint` passes.
- [ ] `yarn typecheck` passes.
- [ ] `yarn build` passes.
- [ ] `yarn supabase db push --dry-run` shows only the expected migration.
- [ ] No real Staging mutation occurs before explicit review.

---

## 24. Future features

This specification intentionally prepares for, but does not implement:

### Onboarding / provisioning

Creating a Clerk Organization does not automatically create application records.

The intended future flow is:

`Clerk Organization → billing/trial eligibility → DeliPlus organization → initial Store`

The intended introductory offer is a 15-day Essential trial, but exact trial eligibility must be defined by the billing/onboarding specification. Repeated Clerk Organization creation must not be assumed to grant unlimited trials.

### Commerce catalog

`stores → categories → products → options/modifiers`

### Orders

`stores → orders → order_items`

### Delivery

`stores → delivery configuration / zones`

### Billing

`organizations → Stripe customer / subscription → plan entitlement → Store capacity`

The Organization is the subscription boundary. Stores do not each own a separate SaaS subscription in the current product direction.

### Public storefront

`/{storeSlug}` with explicitly designed public-safe database access.

### Advanced authorization

Clerk permissions or additional roles for employees/operators when real product requirements are known.

---

## 25. Implementation instruction

The implementation agent must not reinterpret or expand this specification silently.

Before changing database code, it should:

1. read `AGENTS.md`;
2. read the relevant `/docs`;
3. inspect all existing Supabase migrations and configuration;
4. confirm current Clerk/Supabase integration;
5. compare this specification against the current repository;
6. produce an implementation plan;
7. identify any conflict or required architectural change;
8. wait for plan approval before implementing if repository instructions require approval for database/schema changes.

Any proposed deviation from this spec must be called out explicitly before implementation.
