# DeliPlus Database

## Status

This document describes the **initial domain model**, not a finalized SQL schema. Exact columns, constraints and RLS policies should be defined through reviewed Supabase migrations.

## Principles

1. PostgreSQL is the canonical application data store.
2. Persist tenant ownership explicitly.
3. Prefer UUID primary keys unless a migration establishes another convention.
4. Use foreign keys for domain relationships.
5. Use migrations for every schema change.
6. Index common tenant-scoped access paths.
7. Treat RLS and server-side authorization as part of schema design.
8. Avoid storing the same source-of-truth state independently in Clerk, Stripe and PostgreSQL.

## Initial domain entities

### organizations

Represents the SaaS customer/business account.

Potential responsibilities:

- business-level identity;
- ownership boundary;
- subscription association;
- one or more stores.

Candidate fields:

```text
id
name
created_at
updated_at
```

### organization_members

Connects authenticated Clerk users to DeliPlus organizations.

Candidate fields:

```text
id
organization_id
clerk_user_id
role
created_at
updated_at
```

Initial role vocabulary may include:

```text
owner
admin
staff
```

Do not implement unused permission complexity prematurely. Role semantics must be documented before being relied on for authorization.

### stores

Represents a public merchant storefront.

Candidate fields:

```text
id
organization_id
name
slug
status
created_at
updated_at
```

`slug` must be unique according to the chosen public routing strategy.

Potential future fields should not be added until required, e.g. custom domain, theme configuration, contact information and operating hours.

### categories

Groups products within one store.

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

Category uniqueness rules should be scoped to a store where appropriate.

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

Use an appropriate exact numeric representation for money. Do not use floating-point arithmetic for monetary values.

Product variants, modifiers, extras and inventory are not assumed in the initial model until specified.

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

### subscriptions

Stripe remains the billing source for payment/subscription lifecycle events, while DeliPlus may persist a normalized application projection.

Potential fields:

```text
id
organization_id
stripe_customer_id
stripe_subscription_id
status
price_id
current_period_end
created_at
updated_at
```

Exact fields should follow the billing implementation and should not duplicate Stripe indiscriminately.

## Relationship overview

```text
organizations
  1 -> N organization_members
  1 -> N stores
  1 -> 0..N subscription records/events as designed

stores
  1 -> N categories
  1 -> N products
  1 -> N orders
  1 -> N delivery configuration records
```

## Tenant-scoped indexes

As the schema becomes concrete, common access paths should generally have tenant-aware indexes, for example conceptually:

```text
(store_id, is_active)
(store_id, category_id)
(organization_id, clerk_user_id)
```

Do not copy these literally without validating actual queries.

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
- Does it need RLS?
- Which roles may read/write it?
- Is deletion safe?
- Does it need an index?
- Does it affect existing data?
- Does documentation need updating?
