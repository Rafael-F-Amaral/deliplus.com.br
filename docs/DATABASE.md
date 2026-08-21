# DeliPlus Database

## Status

This document describes the current domain model and ownership boundaries, not a finalized SQL schema. Exact columns, constraints and RLS policies are defined through reviewed feature specifications and Supabase migrations.

The first tenant-owned schema is specified in:

`docs/features/database-tenant-core/SPEC.md`

## Principles

1. PostgreSQL is the canonical DeliPlus application data store.
2. Clerk is the canonical source of user identity, Organization membership, active Organization and Clerk Organization roles.
3. Persist DeliPlus tenant ownership explicitly.
4. Prefer UUID primary keys unless a migration establishes another convention.
5. External provider IDs such as Clerk Organization IDs must not become domain primary keys.
6. Use foreign keys for domain relationships.
7. Use migrations for every schema change.
8. Index common tenant-scoped access paths.
9. Treat RLS and server-side authorization as part of schema design.
10. Avoid duplicating the same source-of-truth state independently across Clerk, Stripe and PostgreSQL.
11. Billing/plan limits are application entitlements and must not be represented as destructive schema cardinality constraints.

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
- future subscription/billing projection association.

Do not use `clerk_organization_id` as the PostgreSQL primary key.

Clerk-managed Organization metadata such as membership and Clerk roles should not be duplicated without a concrete application requirement.

### organization_members

Not part of the current architecture.

Do not create this table merely to mirror Clerk membership.

Clerk is the source of truth for:

- Organization membership;
- active Organization;
- Clerk Organization roles.

A future feature may introduce application-specific membership data only if a concrete requirement cannot be represented reliably through Clerk.

### stores

Represents a public merchant establishment/storefront owned by one DeliPlus organization.

Current tenant-core fields are defined by its SPEC and include conceptually:

```text
id
organization_id
name
slug
status
created_at
updated_at
```

Relationship:

```text
organization 1 -> N stores
```

The database must support multiple Stores even when a billing plan limits how many may be active/created.

`slug` is the public Store identifier and is independent from the Clerk Organization slug.

Potential future fields should not be added until required, e.g. custom domain, theme configuration, contact information and operating hours.

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

Important future decisions include:

- order status lifecycle;
- customer snapshot fields;
- address snapshot fields;
- delivery/pickup;
- price snapshots;
- product/modifier snapshots;
- cancellation rules;
- merchant notifications.

Order history must not depend on mutable product names/prices remaining unchanged.

### subscriptions / billing projection

Stripe will remain the external billing source for payment/subscription lifecycle events.

DeliPlus may persist a normalized server-trusted projection associated with the internal Organization.

Conceptually:

```text
subscription
  -> organization_id
  -> Stripe customer/subscription references
  -> status
  -> plan / entitlement projection
  -> trial state
  -> current period metadata
```

Exact columns must be defined by the billing specification.

The Organization owns the subscription.

Stores do not each own an independent subscription in the current product direction.

Current business direction:

- Essential permits one Store;
- higher plans may permit additional Stores;
- exact higher-plan names, prices and Store limits are not yet fixed;
- intended trial duration is 15 days on Essential;
- trial eligibility rules must prevent repeated Organization creation from automatically becoming unlimited free trials.

## Relationship overview

```text
Clerk User
  N <-> N Clerk Organizations

Clerk Organization
  1 <-> 1 DeliPlus organization

DeliPlus organizations
  1 -> N stores
  1 -> billing/subscription projection as designed

stores
  1 -> N categories
  1 -> N products
  1 -> N orders
  1 -> N delivery configuration records
```

## Provisioning

Creating a Clerk Organization does not automatically create PostgreSQL records.

DeliPlus onboarding/provisioning will explicitly create the internal organization and initial Store at the appropriate point in the product flow.

This boundary is intentional so billing/trial eligibility and application state can be validated coherently.

The exact transaction/order of provisioning and Stripe subscription creation belongs to the onboarding/billing specification.

## Tenant-scoped indexes

As the schema becomes concrete, common access paths should generally have tenant-aware indexes.

Examples must be derived from actual queries rather than copied speculatively.

## Money

Choose one project-wide money convention before order/billing calculations are implemented.

Recommended options:

- integer minor units (centavos); or
- PostgreSQL exact numeric with a strictly defined application representation.

Never rely on JavaScript binary floating-point for authoritative money calculations.

## Timestamps

Use timezone-aware timestamps for persisted system events. Display/localization belongs at application boundaries.

## Soft delete

Do not apply soft deletion universally. Prefer explicit active/archive semantics where the product requires recoverability or historical preservation.

Orders and audit-relevant records require special retention decisions.

## Schema change checklist

Every migration should answer:

- Who owns this record?
- Which foreign key enforces that ownership?
- Does tenant context come from the verified Clerk Organization?
- Does it need RLS?
- Which roles may read/write it?
- Is billing entitlement relevant?
- Is deletion safe?
- Does it need an index?
- Does it affect existing data?
- Does documentation need updating?
