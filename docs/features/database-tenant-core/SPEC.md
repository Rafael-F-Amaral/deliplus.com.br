# Deli Plus — Database Tenant Core

**Path:** `docs/features/database-tenant-core/SPEC.md`  
**Status:** Approved  
**Scope:** First business-domain database migration  
**Last updated:** 2026-08-22

## 1. Purpose

Define the first multi-tenant and Store-access database foundation for Deli Plus.

This feature introduces the minimum database structure required to represent:

- a Deli Plus tenant linked to a Clerk Organization;
- one or more Stores owned by that tenant;
- Store-specific assignments for normal Organization members;
- tenant and Store isolation enforced by PostgreSQL Row Level Security (RLS);
- conservative Data API grants.

This specification intentionally does **not** implement products, categories, orders, delivery, billing, public storefront access, team-management UI, invitations, provisioning, webhooks or Store-specific roles.

The expected implementation flow is:

`SPEC → PLAN → MIGRATION → LOCAL RESET → RLS TESTS → REVIEW → STAGING`

---

## 2. Existing architecture

The project already uses:

- Next.js App Router;
- Clerk for authentication;
- Clerk Organizations for Organization membership and roles;
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

Supabase/PostgreSQL is the source of truth for:

- internal DeliPlus tenant data;
- Stores;
- Store-specific assignments;
- application/domain data.

Do not create a local `organization_members` mirror.

---

## 3. Locked decisions for v1

### 3.1 Tenant identity

A Deli Plus tenant is represented internally by `public.organizations`.

Each row maps to exactly one Clerk Organization through:

`organizations.clerk_organization_id`

The Clerk Organization ID is an external identifier and must not be used as the PostgreSQL primary key.

DeliPlus uses UUID primary keys internally.

### 3.2 One Organization can own multiple Stores

The relationship is:

`organization 1 → N stores`

The database must not enforce a one-Store limitation.

Current product direction:

- Essential allows one Store;
- higher plans may allow additional Stores;
- exact higher-plan limits belong to the billing specification.

This migration must not encode plan limits as database cardinality constraints.

### 3.3 Clerk Organization slug is not Store slug

The Clerk Organization slug is Clerk metadata.

The DeliPlus Store slug is the public storefront identifier used by routes such as:

`/{storeSlug}`

These values are independent.

### 3.4 Clerk remains the Organization membership source of truth

Do not create `organization_members`.

Organization membership and Organization roles come from Clerk.

### 3.5 Store assignment belongs to DeliPlus

Clerk does not know which DeliPlus Store(s) a normal Organization member may operate.

Store-specific assignment must be represented in PostgreSQL through:

`public.store_memberships`

### 3.6 Store access rule

Current Store access semantics:

```text
Organization admin
  -> may access all Stores in active Organization

Organization member
  -> may access only Stores explicitly assigned to their Clerk User ID
```

An explicit Store membership is not required for Organization admins.

An explicit Store membership never grants access across Organizations.

### 3.7 Verified identity determines access

Relevant verified Clerk JWT claims:

- user ID: `sub`
- active Organization ID: `o.id`
- Organization role: `o.rol`

If no active Organization exists, tenant/Store-scoped database access must return no tenant data.

Never trust client-supplied alternatives for these values.

### 3.8 Secure by default

- RLS must be explicitly enabled in the migration.
- Tables must not be exposed to `anon`.
- Data API privileges must be explicit and minimal.
- Normal `authenticated` access to tenant-core data is read-only in this first migration.
- Provisioning and membership mutations are not implemented in this feature.
- No service-role key is introduced into the application.

---

## 4. Goals

This feature must:

1. Create `public.organizations`.
2. Create `public.stores`.
3. Create `public.store_memberships`.
4. Link each organization to one Clerk Organization.
5. Link each Store to one internal organization.
6. Link Store assignments to Clerk User IDs.
7. Support multiple Stores per Organization.
8. Support multiple Store assignments per Organization member.
9. Enable RLS on all tenant-core tables.
10. Read Clerk user, active Organization and Organization role from `auth.jwt()`.
11. Allow Organization admins to read all Stores in their active Organization.
12. Allow normal Organization members to read only assigned Stores.
13. Prevent cross-Organization and same-Organization/unassigned-Store reads.
14. Keep tenant-core writes outside generic authenticated Data API access.
15. Be fully reproducible with `supabase db reset`.
16. Be testable locally without real data.
17. Produce/update generated TypeScript database types after schema acceptance.

---

## 5. Non-goals

Do not implement:

- products;
- categories;
- orders;
- delivery;
- Stripe;
- subscriptions;
- trial rules;
- Store-capacity enforcement;
- public storefront reads;
- anonymous database access;
- Clerk webhooks;
- Supabase webhooks;
- Clerk Organization provisioning;
- Store provisioning;
- team-management UI;
- Clerk invitation workflow;
- mutation of Store memberships through the normal authenticated Data API;
- Store-specific roles such as manager/staff;
- custom DeliPlus permission matrices;
- Realtime;
- storage buckets;
- browser Supabase client unless required by an already-approved use case.

---

## 6. Domain model

```text
Clerk

User (sub)
  │
  └── Active Organization (o.id / o.rol)
          │
          ▼

Supabase

organizations
  └── stores
       └── store_memberships
            └── clerk_user_id
```

Relationship overview:

```text
Clerk Organization 1 <-> 1 DeliPlus organization
DeliPlus organization 1 -> N Stores
Store N <-> N Clerk users through store_memberships
```

The primary tenant boundary in PostgreSQL is the internal `organizations.id`.

---

## 7. Table: `public.organizations`

### Purpose

Internal DeliPlus tenant record.

### Required columns

| Column | Type | Requirements |
| --- | --- | --- |
| `id` | `uuid` | Primary key. Generated with PostgreSQL UUID generation. |
| `clerk_organization_id` | `text` | `NOT NULL`, globally `UNIQUE`. |
| `created_at` | `timestamptz` | `NOT NULL`, default current timestamp. |
| `updated_at` | `timestamptz` | `NOT NULL`, default current timestamp. |

Do not store Clerk membership or billing fields here yet.

---

## 8. Table: `public.stores`

### Purpose

Represents a delivery establishment/storefront owned by a DeliPlus organization.

### Required columns

| Column | Type | Requirements |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `organization_id` | `uuid` | `NOT NULL`, FK to `organizations.id`. |
| `name` | `text` | `NOT NULL`. |
| `slug` | `text` | `NOT NULL`, globally `UNIQUE`. |
| `status` | `text` | `NOT NULL`, default `draft`. |
| `created_at` | `timestamptz` | `NOT NULL`, default current timestamp. |
| `updated_at` | `timestamptz` | `NOT NULL`, default current timestamp. |

Allowed status values:

- `draft`
- `active`
- `inactive`

Use a check constraint rather than a PostgreSQL enum.

Foreign-key deletion behavior must not silently cascade tenant deletion.

Provide an index on `organization_id`.

### Slug rules

Stored slug must:

- be lowercase;
- use ASCII `a-z`, digits and hyphens;
- not start/end with a hyphen;
- have no empty segments;
- be globally unique;
- be 3–63 characters.

Reserved routes remain an application-level rule.

---

## 9. Table: `public.store_memberships`

### Purpose

Represents Store-specific access for a normal Clerk Organization member.

It does **not** represent Organization membership. Clerk remains the canonical source for that.

### Required columns

| Column | Type | Requirements |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `store_id` | `uuid` | `NOT NULL`, FK to `stores.id`. |
| `clerk_user_id` | `text` | `NOT NULL`, Clerk User ID. |
| `created_at` | `timestamptz` | `NOT NULL`, default current timestamp. |
| `updated_at` | `timestamptz` | `NOT NULL`, default current timestamp. |

Constraints/indexes:

- `UNIQUE(store_id, clerk_user_id)`;
- index for lookup by `clerk_user_id`;
- Store FK deletion behavior must be explicit and reviewed.

Do not add a Store-specific role column in this migration.

### Validity rule

A membership row alone must never be sufficient for authorization.

At request time, the Store must also belong to the active Clerk Organization.

This prevents a stale/incorrect Store membership from crossing tenant boundaries.

---

## 10. Timestamp behavior

`created_at` must never be rewritten by normal updates.

`updated_at` should be updated automatically when a mutable row changes.

A small reusable trigger helper may be introduced.

---

## 11. Clerk claim helpers

The database should avoid repeating fragile JWT JSON expressions.

Private helpers should cover at least:

### `private.clerk_user_id()`

Returns:

`auth.jwt()->>'sub'`

### `private.clerk_organization_id()`

Returns:

`auth.jwt()->'o'->>'id'`

### `private.clerk_organization_role()`

Returns:

`auth.jwt()->'o'->>'rol'`

Helper requirements:

- keep outside exposed `public` schema;
- derive values only from verified request JWT;
- accept no caller-supplied identity/tenant argument;
- return `NULL` when the claim is absent;
- use least privilege;
- do not introduce `SECURITY DEFINER` unless implementation demonstrates it is required.

The implementation plan must explicitly address how Store membership is evaluated without creating RLS recursion or overexposing `store_memberships`.

---

## 12. Data API grants

RLS and PostgreSQL grants are separate security layers.

The initial tenant-core migration is intentionally conservative.

### `authenticated`

Expected normal application capability in this migration:

```text
organizations: SELECT
stores: SELECT
```

Direct `store_memberships` SELECT should be granted only if the final reviewed RLS design genuinely requires it.

Do not grant generic authenticated:

- INSERT;
- UPDATE;
- DELETE;
- TRUNCATE

on tenant-core tables.

Provisioning and team-management mutations belong to later trusted server-side features.

### `anon`

No tenant-core access.

---

## 13. RLS: `organizations`

### SELECT

An authenticated user may read the internal Organization only when:

`organizations.clerk_organization_id = verified active Clerk Organization ID`

Expected:

- active Organization A → reads A;
- active Organization A → cannot read B;
- no active Organization → zero rows.

### Writes

No normal authenticated INSERT/UPDATE/DELETE policy in this first migration.

---

## 14. RLS: `stores`

### SELECT — Organization admin

An Organization admin may read any Store where:

- Store belongs to the active internal Organization.

### SELECT — Organization member

A normal Organization member may read a Store only when:

- Store belongs to the active internal Organization; and
- a `store_memberships` row exists for:
  - that Store;
  - the verified Clerk User ID (`sub`).

### No active Organization

Returns no Stores.

### Writes

No normal authenticated INSERT/UPDATE/DELETE policy in this first migration.

---

## 15. RLS: `store_memberships`

This table exists primarily to support Store authorization and future team management.

The first migration must avoid exposing other users' Store assignments unnecessarily.

The implementation plan must choose the smallest safe approach for policy evaluation and direct table visibility.

Required outcome:

- normal members cannot enumerate arbitrary Store membership assignments;
- Store RLS can still determine whether the current user has a matching assignment;
- Organization admins do not require a membership row to access Stores;
- cross-Organization assignment data cannot grant access.

Do not add authenticated write policies in this migration.

---

## 16. No active Organization behavior

When the verified Clerk JWT has no `o.id`:

- tenant Organization SELECT returns no rows;
- Store SELECT returns no rows;
- Store membership cannot grant tenant access.

Do not fall back to client input.

---

## 17. Team-management boundary

Creating/removing Store memberships is intentionally out of scope.

A future team-management feature should coordinate:

```text
Clerk Organization member/invitation
+
DeliPlus store_memberships
```

through a trusted server-side boundary.

That feature must address:

- pending invitation lifecycle;
- accepted membership;
- assignment/removal;
- rollback/error handling;
- admin authorization;
- preventing cross-Organization Store assignment.

---

## 18. Public storefront access

Public access is explicitly out of scope.

Do not add `anon` Store/catalog policies yet.

Public Store data will be designed separately.

---

## 19. Migration strategy

Create one migration for this feature.

Recommended command:

```bash
yarn supabase migration new tenant_core
```

The migration is the source of truth.

Do not create these tables manually in the hosted Supabase Dashboard.

---

## 20. Local validation workflow

Required future workflow:

```bash
yarn supabase db reset
yarn supabase test db
yarn lint
yarn typecheck
yarn build
yarn supabase db push --dry-run
```

Do not run a real remote push until migration/RLS tests are reviewed.

---

## 21. RLS isolation test matrix

At minimum validate:

| Actor/context | Organization | Store A assigned? | Store B assigned? | Expected Store access |
| --- | --- | ---: | ---: | --- |
| Anonymous | none | n/a | n/a | none |
| Authenticated, no active org | none | n/a | n/a | none |
| Org A admin | A | no | no | all Stores in A |
| Org A member | A | yes | no | Store A only |
| Org A member | A | no | yes | Store B only |
| Org A member | A | no | no | no Stores |
| Org A member | A | membership points to Store in B | n/a | no cross-tenant access |
| Org B admin | B | n/a | n/a | all Stores in B, none in A |

Also validate:

- member cannot read unassigned Store in same Organization;
- admin access does not require Store membership;
- duplicate `(store_id, clerk_user_id)` is rejected;
- no authenticated tenant-core writes are available;
- invalid/missing claims fail safely;
- slug/status/FK constraints behave as specified.

Synthetic JWT claim context may be used locally if it accurately exercises `auth.jwt()`.

---

## 22. TypeScript database types

After migration stabilizes locally, generate types from the local `public` schema.

Preferred destination:

`lib/supabase/database.types.ts`

The server Supabase client should then use the generated `Database` type where appropriate.

Do not manually maintain generated table types.

---

## 23. Staging rollout

Only after:

- migration review;
- successful `db reset`;
- RLS isolation tests;
- lint;
- typecheck;
- build;
- `db push --dry-run`;

may the migration be proposed for `Deli Plus - Staging`.

Actual Staging push is an explicit reviewed action.

Production is out of scope.

---

## 24. Acceptance criteria

- [ ] One reviewed migration represents the tenant core.
- [ ] `organizations` uses an internal UUID primary key.
- [ ] `clerk_organization_id` is unique.
- [ ] `stores` references `organizations.id`.
- [ ] Multiple Stores per Organization are supported.
- [ ] `store_memberships` exists for Store-specific assignments.
- [ ] No local `organization_members` table exists.
- [ ] `(store_id, clerk_user_id)` is unique.
- [ ] Store-specific roles were not introduced.
- [ ] RLS is explicitly enabled on all tenant-core tables.
- [ ] `anon` has no tenant-core access.
- [ ] Authenticated tenant-core writes are unavailable.
- [ ] Organization admin can read all Stores in active Organization.
- [ ] Organization member can read assigned Store(s).
- [ ] Organization member cannot read unassigned Store in same Organization.
- [ ] Cross-Organization Store access is denied.
- [ ] Missing active Organization returns no tenant/Store access.
- [ ] `yarn supabase db reset` succeeds.
- [ ] Database/RLS tests pass.
- [ ] Supabase TypeScript types are generated.
- [ ] `yarn lint` passes.
- [ ] `yarn typecheck` passes.
- [ ] `yarn build` passes.
- [ ] `db push --dry-run` contains only expected changes.
- [ ] No real Staging mutation occurs before explicit review.

---

## 25. Future features

### Tenant provisioning

`Clerk Organization → billing/trial eligibility → DeliPlus organization → initial Store`

### Team management

`Clerk Organization member/invitation → Store assignment → store_memberships`

### Store selection

DeliPlus StoreSwitcher for Organizations with multiple Stores.

### Store roles/permissions

Potential manager/staff/etc. semantics only after product requirements are approved.

### Commerce catalog

`stores → categories → products`

### Orders

`stores → orders → order_items`

### Billing

`organizations → Stripe subscription → plan entitlement → Store capacity`

### Public storefront

`/{storeSlug}` with explicitly designed public-safe access.

---

## 26. Implementation instruction

Before changing database code, the implementation agent must:

1. read `AGENTS.md`;
2. read relevant `/docs`;
3. read ADR-001 and ADR-002;
4. inspect existing Supabase migrations/configuration;
5. compare this SPEC to the repository;
6. produce/revise the implementation plan;
7. explicitly solve Store-membership RLS evaluation without recursion or unnecessary exposure;
8. identify any blocking conflict;
9. implement only after the plan is approved.

Any proposed deviation from this SPEC must be surfaced before implementation.
