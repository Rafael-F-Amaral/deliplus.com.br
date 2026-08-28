# DeliPlus Database

## Status

This document describes the current domain model and ownership boundaries, not a finalized SQL schema. Exact columns, constraints and RLS policies are defined through reviewed feature specifications and Supabase migrations.

The first tenant-owned schema is specified in:

`docs/features/database-tenant-core/SPEC.md`

The current billing schema is specified in:

`docs/features/billing-foundation/SPEC.md`

## Principles

1. PostgreSQL is the canonical DeliPlus application data store.
2. Clerk is the canonical source of user identity, Organization membership, active Organization and Clerk Organization roles.
3. Persist DeliPlus tenant ownership explicitly.
4. Persist Store-specific user access explicitly when it is not represented by Clerk.
5. Prefer UUID primary keys unless a migration establishes another convention.
6. External provider IDs such as Clerk Organization/User IDs must not become domain primary keys.
7. Use foreign keys for domain relationships.
8. Use migrations for every schema change.
9. Index common tenant/Store-scoped access paths.
10. Treat RLS and server-side authorization as part of schema design.
11. Avoid duplicating the same source-of-truth state independently across Clerk, Stripe and PostgreSQL.
12. Billing/plan limits are application entitlements and must not be represented as destructive schema cardinality constraints.

## Initial domain entities

### organizations

Represents the internal DeliPlus tenant/business account.

Each row maps to exactly one Clerk Organization.

Current tenant-core fields:

```text
id                    UUID primary key
clerk_organization_id unique external Clerk Organization ID
created_at
updated_at
```

Responsibilities:

- stable internal tenant identity;
- ownership boundary for DeliPlus data;
- parent of one or more Stores;
- owner of local trial and paid billing records.

Do not use `clerk_organization_id` as the PostgreSQL primary key.

Clerk-managed Organization membership and Organization roles should not be duplicated locally.

### organization_members

Not part of the current architecture.

Do not create this table merely to mirror Clerk membership.

Clerk is the source of truth for:

- Organization membership;
- active Organization;
- Clerk Organization roles.

### stores

Represents a public merchant establishment/storefront owned by one DeliPlus organization.

Current tenant-core fields include conceptually:

```text
id
organization_id
name
slug
status
activated_at
created_at
updated_at
```

Relationship:

```text
organization 1 -> N stores
```

The database supports multiple Store records independently from plan capacity.
`maxStores` counts only Stores whose status is `active`; draft and ready Stores
do not consume capacity.

`slug` is the public Store identifier and is independent from the Clerk Organization slug.

Current persisted lifecycle:

```text
draft <-> ready -> active <-> inactive
```

`activated_at` is null for draft/ready and required for active/inactive. The
first activation timestamp is immutable, and active/inactive Stores cannot
return to setup states. The database accepts new Stores only as unactivated
drafts and rejects blank names. Store setup itself still stops at `ready`; the
separate initial-trial activation RPC now owns the first eligible `ready -> active`
transition.

### store_memberships

Represents Store-specific access for a Clerk Organization member.

This table exists because Clerk Organization membership is tenant-wide while Store access may be narrower.

Initial tenant-core shape:

```text
id
organization_id
store_id
clerk_user_id
created_at
updated_at
```

Relationship:

```text
stores N <-> N Clerk users through store_memberships
```

Requirements:

- `(organization_id, store_id)` references `stores(organization_id, id)`;
- the composite FK rejects Organization/Store mismatches and cascades on Store deletion;
- `clerk_user_id` stores the external Clerk User ID;
- `(store_id, clerk_user_id)` is unique;
- indexes support `(organization_id, store_id)` and
  `(organization_id, clerk_user_id)` lookups;
- Store-specific roles are intentionally deferred.

An Organization admin does not need a `store_memberships` row to access Stores in their active Organization.

A normal Organization member requires an explicit Store membership for Store-scoped access.

A Store membership never replaces the requirement that the user belongs to the Store's Clerk Organization.

### categories

Groups products within one Store.

Candidate fields:

```text
id
store_id
name
slug
sort_order
is_active
created_at
updated_at
```

Category uniqueness rules should be scoped to a Store where appropriate.

### products

Represents an orderable catalog item.

Candidate fields:

```text
id
store_id
category_id
name
description
price
image_url
is_active
sort_order
created_at
updated_at
```

Use an appropriate exact numeric representation for money. Do not use floating-point arithmetic for authoritative monetary values.

Product variants, modifiers, extras and inventory are not assumed until specified.

### delivery configuration

The exact schema is intentionally deferred until delivery requirements are specified.

Likely concepts include:

```text
delivery_methods
delivery_zones
store_delivery_settings
```

Do not design geographic complexity before requirements are known.

### orders

Order design should receive its own feature specification before schema finalization.

Likely concepts:

```text
orders
order_items
```

Order history must not depend on mutable product names/prices remaining unchanged.

### billing_trial_grants

Stores local trial grants and consumed-trial history independently from Stripe.

Initial grants are exactly 15 days on `essential`, with at most one initial grant per Organization and per Clerk User. `manual_override` rows may use an approved plan code without replacing initial history.

### billing_customers

Stores the canonical one-to-zero-or-one relationship between a DeliPlus Organization and Stripe Customer. A pending claim may exist before `stripe_customer_id` is known. Customer creation itself is not implemented yet.

### billing_subscriptions

Stores at most one current paid Stripe Subscription projection for an Organization with a canonical billing Customer. Verified webhook reconciliation now maintains its provider identifiers, internal `plan_code`, status and period/recovery metadata. Local trial fields and `maxStores` are deliberately absent.

Approved plan codes are:

```text
essential -> maxStores 1
multi_2   -> maxStores 2
multi_3   -> maxStores 3
```

Capacity remains application configuration and not a schema cardinality or subscription column.

### stripe_webhook_events

Stores minimum Stripe Event metadata for webhook idempotency/auditing. `processed_at` is written only in the same database transaction that applies or safely ignores the paid projection. A failed transaction leaves the Event retryable. The full webhook payload and `organization_id` are not persisted.

### Paid webhook projection transaction

`public.apply_stripe_subscription_projection(...)` is the narrow atomic boundary for paid webhook writes. It:

- runs as `SECURITY INVOKER` with an empty `search_path`;
- accepts only normalized Event and current-Subscription fields, never the full Stripe payload;
- resolves Organization ownership from a ready canonical `billing_customers.stripe_customer_id`;
- serializes projection changes with a transaction-scoped advisory lock keyed by Organization;
- deduplicates by `stripe_webhook_events.stripe_event_id`;
- applies ledger and projection changes in one short transaction;
- preserves the first `past_due_since` while status remains `past_due` and clears it after recovery;
- permits a different Subscription to replace the canonical row only after the prior row is terminal (`canceled` or `incomplete_expired`);
- leaves competing non-terminal Subscription Events retryable instead of prematurely acknowledging an ambiguous canonical transition;
- acknowledges stale non-canonical Subscription Events without allowing them to overwrite the current row.

The function is executable only by `service_role`. That role has read-only access to `billing_customers` and only `SELECT`/`INSERT`/`UPDATE` on the paid projection and Event ledger for this slice; it receives no `DELETE` or `TRUNCATE` capability there. External Stripe API retrieval happens before the transaction begins.

### Billing access posture

All four billing tables have RLS enabled without `FORCE ROW LEVEL SECURITY`. They expose no policies or direct table privileges to `anon` or `authenticated`. Narrow entitlement-read and first-Store trial-activation functions expose only their reviewed fact/result surfaces; they do not grant table access.

## Relationship overview

```text
Clerk User
  N <-> N Clerk Organizations

Clerk Organization
  1 <-> 1 DeliPlus organization

DeliPlus organizations
  1 -> N stores
  1 -> N billing_trial_grants
  1 -> 0..1 billing_customers
  1 -> 0..1 current billing_subscriptions through billing_customers

stores
  N <-> N Clerk users via store_memberships
  1 -> N categories
  1 -> N products
  1 -> N orders
  1 -> N delivery configuration records
```

## Provisioning

Creating a Clerk Organization does not automatically create PostgreSQL records.

Adding a member to Clerk does not automatically grant Store access.

DeliPlus application flows explicitly create or will create:

- internal organization records;
- initial/additional Store drafts through the Store setup domain boundary;
- Store membership assignments.

The exact transaction/order of provisioning and Stripe subscription creation belongs to onboarding/billing specs.

Store membership mutation belongs to a dedicated team-access feature and must use a trusted server-side boundary.

## Tenant and Store access lookup

For authenticated Store-scoped access, the application/database conceptually resolves:

```text
Clerk JWT sub
Clerk JWT o.id
Clerk JWT o.rol
        ↓
internal organization
        ↓
Store
        ↓
if admin: tenant Store ownership is sufficient
if member: matching store_membership is also required
```

## Initial Data API posture

The first tenant-core migration should be conservative.

Normal `authenticated` access should be read-only for:

- organizations;
- stores;
- store_memberships, limited by RLS to the active member's own assignments.

Generic authenticated INSERT/UPDATE/DELETE for tenant-core records is not part of the first migration.

Tenant provisioning and Store draft/setup mutations use separate narrow
server-only boundaries. Team membership mutation remains separate. Store setup
uses RLS-backed reads and an explicitly scoped privileged repository for simple
writes; it does not activate a Store, grant entitlement, or expose generic
authenticated writes.

The billing foundation is stricter: `anon` and `authenticated` have no direct reads or writes on any billing table. RLS remains default-deny. The dedicated entitlement read model exposes only a zero-argument function to `authenticated`, not table access.

### Organization entitlement read boundary

`public.resolve_active_organization_entitlement_facts()` is the narrow Data API read boundary for normalized Organization entitlement. It:

- is `STABLE` and `SECURITY DEFINER` with `search_path = ''`;
- is owned by the reviewed `postgres` migration role;
- accepts no arguments and derives the active Clerk Organization through `private.clerk_organization_id()`;
- maps the Clerk Organization to the internal `organizations.id` inside PostgreSQL;
- uses one statement snapshot and one PostgreSQL clock reference for trial validity;
- aggregates concurrently valid same-plan grants with `MAX(ends_at)`;
- raises an error for concurrently valid grants with different plans;
- returns only trial plan/end and paid plan/status/collection-pause facts;
- performs no mutation and exposes no provider or tenant identifiers;
- is executable by `authenticated`, while `PUBLIC`, `anon`, and `service_role` have no execution grant.

The server-only `resolveOrganizationEntitlement()` calls this function through the normal Clerk-JWT Supabase client. It derives `maxStores` from the application plan registry, validates unknown/partial data fail-closed, and never reads Stripe or a privileged Supabase client.

### First-Store trial activation boundary

`public.activate_first_store_with_initial_trial(p_store_id uuid)` is the narrow atomic
write boundary for an eligible first Store and initial local trial. It:

- is `VOLATILE` and `SECURITY DEFINER` with `search_path = ''`;
- is owned by the reviewed `postgres` migration role;
- accepts only a Store UUID and derives Clerk User, active Organization and role from
  private JWT helpers;
- requires the verified Organization database role `admin`;
- resolves the internal Organization before scoping and locking the target Store;
- serializes Organization operations with the same advisory-lock convention used by
  paid projection writes;
- serializes historical Clerk User trial eligibility with a separate stable advisory
  transaction lock;
- rejects any prior initial grant for the Organization or Clerk User, including expired
  or revoked grants;
- rejects current paid entitlement or valid manual override because those cases belong
  to generic Store activation;
- requires no Store in the Organization to have a prior non-null `activated_at`;
- inserts the 15-day Essential initial grant and updates the target Store from `ready`
  to `active` in one transaction using one PostgreSQL timestamp;
- returns only `outcome` and `trial_ends_at`;
- is executable by `authenticated`, while `PUBLIC`, `anon`, and `service_role` receive
  no execution grant.

Direct authenticated writes to `stores`, `billing_trial_grants`, and
`billing_subscriptions` remain denied. Coherent retries of the same Store during the
active initial trial return `already_activated` without changing any persisted date or
historical Clerk User.

## Money

Choose one project-wide money convention before order/billing calculations are implemented.

Recommended options:

- integer minor units (centavos); or
- PostgreSQL exact numeric with a strictly defined application representation.

Never rely on JavaScript binary floating-point for authoritative money calculations.

## Timestamps

Use timezone-aware timestamps for persisted system events. Display/localization belongs at application boundaries.

## Schema change checklist

Every migration should answer:

- Who owns this record?
- Which Organization owns the Store/resource?
- Is Store-level assignment relevant?
- Which foreign key enforces ownership?
- Does tenant context come from the verified Clerk Organization?
- Does user identity come from verified Clerk `sub`?
- Does it need RLS?
- Which roles/memberships may read/write it?
- Is billing entitlement relevant?
- Is deletion safe?
- Does it need an index?
- Does it affect existing data?
- Does documentation need updating?
