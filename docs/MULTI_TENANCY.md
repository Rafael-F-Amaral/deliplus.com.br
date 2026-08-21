# DeliPlus Multi-Tenancy

## Goal

Ensure one merchant cannot accidentally or intentionally read or modify another merchant's data while supporting users who participate in more than one business and businesses that operate more than one Store.

Multi-tenancy is a core architectural requirement, not a later optimization.

## Terminology

### Clerk User

A person authenticated by Clerk.

One User may belong to multiple Clerk Organizations.

### Clerk Organization

The merchant/business tenant identity managed by Clerk.

Clerk is the source of truth for:

- Organization membership;
- active Organization;
- Clerk Organization roles.

### DeliPlus organization

The internal PostgreSQL representation of the same tenant.

It maps one-to-one to a Clerk Organization using:

```text
organizations.clerk_organization_id
```

It has its own internal UUID for DeliPlus foreign keys.

### Store

An establishment/storefront owned by a DeliPlus organization.

A Store is not the tenant itself.

One Organization can own multiple Stores.

## Tenant model

The conceptual boundary is:

```text
Clerk User
  -> one or more Clerk Organizations

Clerk Organization
  <-> DeliPlus organization
        -> one or more Stores
             -> categories
             -> products
             -> delivery settings
             -> orders
```

## Why Organization and Store are separate

For a simple merchant:

```text
Organization: Pizzaria do João
  -> Store: Pizzaria do João
```

For a chain:

```text
Organization: Grupo Bella
  -> Store: Bella Centro
  -> Store: Bella Shopping
  -> Store: Bella Norte
```

For one person with independent businesses:

```text
User: João
  -> Organization: Napoli Pizzarias
       -> Store: Napoli Centro
       -> Store: Napoli Shopping

  -> Organization: Tropical Açaí
       -> Store: Tropical Açaí
```

This separation allows each independent business tenant to have its own team, billing and data while still allowing one person to access multiple businesses.

## Multiple Organizations

DeliPlus should allow a user to belong to and, subject to product/Clerk configuration, create multiple Organizations.

The active Clerk Organization determines the current tenant context.

Switching to another Clerk Organization switches the tenant context; it must never merge data between tenants.

If the newly active Clerk Organization has not yet been provisioned in DeliPlus, the application should route the user into onboarding rather than treating it as an existing tenant.

## Store capacity and plans

Subscription entitlement belongs to the Organization.

Conceptually:

```text
Organization
  -> plan/subscription entitlement
  -> Store capacity
  -> Stores
```

Current product direction:

- Essential permits one Store;
- higher plans may permit more Stores;
- database cardinality remains `1 -> N`;
- Store-count limits are enforced by trusted application/billing rules, not by changing the foreign-key model;
- intended trial is 15 days on Essential.

Trial eligibility must be a deliberate billing rule.

Do not assume every newly created Clerk Organization automatically receives an unlimited sequence of free trials.

## Provisioning flow

Creating an Organization in Clerk does not automatically create a DeliPlus organization or Store in PostgreSQL.

The intended product flow is conceptually:

```text
sign up / sign in
  -> create or select Clerk Organization
  -> detect missing internal DeliPlus organization
  -> onboarding
  -> establish plan/trial entitlement
  -> provision internal organization
  -> provision initial Store
  -> dashboard
```

The exact order of Stripe customer/subscription creation and PostgreSQL provisioning will be decided in the billing/onboarding specification.

The tenant-core database migration only creates the schema and RLS foundation; it does not implement this provisioning flow.

## Tenant context

Authenticated dashboard operations establish tenant context from the verified Clerk session.

Conceptually:

```text
Clerk session
  -> active Clerk Organization (`o.id`)
  -> DeliPlus organizations.clerk_organization_id
  -> internal organization UUID
  -> authorized Store(s)
```

Do not accept `organization_id` or `store_id` from a client and trust it without verifying that it belongs to the active tenant.

## Store context

Organization-scoped features may not require a Store selection.

Store-scoped features must resolve a Store owned by the active Organization.

A user with access to Organization A must never gain access to Store B merely by changing an ID.

## Public storefront context

Public storefront data is intentionally public only where explicitly designed.

Conceptually:

```text
storeSlug
  -> active Store
  -> canonical Store ID
  -> published catalog/configuration for that Store
```

A request for `/store-a` must never combine data from `store-b` due to an unscoped query.

Public access policies are specified separately from merchant dashboard authorization.

## Query rule

Unsafe conceptual pattern:

```text
update product where id = productId
```

Safer conceptual pattern:

```text
verified active Organization
  -> resolve owned Store
  -> update product where id = productId and store_id = authorizedStoreId
```

RLS must provide an additional database-level tenant boundary for Supabase access.

## Row Level Security

RLS policies are designed alongside tenant-owned tables, not appended later.

The first tenant-core specification derives active Organization context from Clerk claims accepted by Supabase Third-Party Auth.

Do not disable RLS to unblock development without an explicitly temporary and reviewed reason.

## Service-role access

Privileged Supabase/service credentials bypassing normal client restrictions must remain server-only.

Code using privileged access is responsible for explicit authorization before tenant-sensitive operations.

Service-role access is not a substitute for authorization or billing entitlement checks.

## Slugs

Store slugs are public identifiers, not secrets and not authorization credentials.

Clerk Organization slugs and DeliPlus Store slugs are different concepts.

Never use knowledge of a Store slug to grant dashboard access.

## Caching

Tenant and Store context must be part of any cache key for scoped data.

Do not create shared caches where data for different Organizations/Stores can collide.

## Files and images

When product/Store media storage is introduced:

- storage paths should include stable tenant/Store ownership context;
- upload authorization must verify tenant access;
- deletion must verify ownership;
- public read policy should match the publication model.

## Review checklist

For every feature involving merchant data, verify:

- What is the Organization boundary?
- Does the user belong to multiple Organizations?
- How is the active Clerk Organization derived?
- How is it mapped to the internal DeliPlus organization?
- Does the operation require a Store context?
- Is any tenant/Store ID supplied by the browser?
- Where is role/permission authorization checked?
- Is billing/Store-capacity entitlement relevant?
- Does every mutation scope by tenant/Store?
- Could an IDOR-style request access another tenant's record?
- Does RLS enforce the boundary?
- Are cache/storage keys tenant-aware?
