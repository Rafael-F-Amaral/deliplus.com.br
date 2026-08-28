# ADR-001: Tenant, Store and billing ownership model

## Status

Accepted

## Context

DeliPlus needs to support:

- users who may participate in more than one independent business;
- businesses that may operate more than one establishment;
- merchant subscriptions with different Store capacities;
- Clerk Organizations for identity/membership;
- PostgreSQL/Supabase for application-domain ownership.

Treating every Store as its own tenant/subscription would make chains and multi-unit merchants unnecessarily fragmented.

Treating every Clerk User as the tenant would prevent one person from participating in multiple independent businesses with separate teams and billing.

## Decision

DeliPlus uses distinct tenant and Store concepts:

```text
Clerk User
  -> may belong to multiple Clerk Organizations

Clerk Organization
  <-> one internal DeliPlus organization

DeliPlus organization
  -> owns one subscription/plan entitlement
  -> owns one or more Stores

Store
  -> establishment/storefront
  -> owns Store-scoped commerce data
```

Clerk is the source of truth for:

- user identity;
- Organization membership;
- active Organization;
- Clerk Organization roles.

Supabase/PostgreSQL is the source of truth for:

- internal DeliPlus organization;
- Stores;
- Store-specific access assignments;
- catalog/orders/delivery;
- normalized billing projection;
- tenant-owned application data and RLS.

The internal DeliPlus organization uses its own UUID and stores a unique `clerk_organization_id`.

No `organization_members` mirror is created in the current architecture.

Store-specific access is defined separately in `ADR-002-store-level-access-model.md`.

The subscription boundary is the Organization.

Current product direction:

- `essential` allows one active Store;
- `multi_2` allows two active Stores;
- `multi_3` allows three active Stores;
- four or more Stores use a sales-assisted path;
- the intended trial is 15 days on Essential;
- exact plan prices and billing intervals remain outside this ADR;
- trial eligibility must not assume that repeatedly creating Clerk Organizations grants unlimited free trials.

Creating a Clerk Organization does not itself create an internal organization, Store or Stripe subscription.

### Durable Store lifecycle

Store setup and Store operation are distinct lifecycle phases:

```text
draft <-> ready -> active <-> inactive
```

`stores.activated_at` is nullable for `draft` and `ready`, required for `active`
and `inactive`, set on first activation, and immutable afterward. Active or
inactive Stores never return to draft/ready. Billing expiration does not
automatically change Store status; operation authorization separately evaluates
current Organization entitlement.

Plan capacity is operational capacity. `maxStores` counts only Stores with
`status = 'active'`; draft and ready Stores do not consume capacity. The
Organization-to-Store relationship remains one-to-many, without a schema
cardinality constraint derived from the current plan.

## Consequences

### Benefits

- one user can manage independent businesses without separate logins;
- one business can operate multiple Stores under shared Organization membership and billing;
- chains can upgrade Store capacity without changing tenant relationships;
- Store limits remain business entitlements rather than schema constraints;
- Organization membership is not duplicated unnecessarily between Clerk and PostgreSQL.

### Requirements

- the active Clerk Organization must be verified on tenant-scoped requests;
- every internal organization must map to exactly one Clerk Organization;
- Store ownership must always resolve through the internal organization;
- Store-level user access must follow ADR-002;
- billing features must enforce active-Store capacity limits server-side and
  atomically at activation;
- onboarding must detect an unprovisioned Clerk Organization and route it through provisioning;
- trial eligibility needs a dedicated billing rule before production.

### Trade-offs

- Organization switching becomes a real product concept;
- Store selection becomes necessary for Store-scoped dashboard features when an Organization owns multiple Stores;
- onboarding/provisioning must coordinate Clerk, PostgreSQL and eventually Stripe safely;
- team management needs DeliPlus Store assignment in addition to Clerk Organization membership.

## Alternatives considered

### One Clerk Organization per Store

Rejected because chains would require multiple tenants, memberships and subscriptions for what is operationally one business account.

### One tenant per Clerk User

Rejected because users may own or participate in multiple independent businesses and Organizations may have multiple members.

### Local `organization_members` table as the Organization membership source

Rejected because Clerk Organizations already provide tenant membership and Organization roles. PostgreSQL is used only for DeliPlus-specific Store assignment and domain data.
