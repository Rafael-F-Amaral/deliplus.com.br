# DeliPlus Multi-Tenancy

## Goal

Ensure one merchant cannot accidentally or intentionally read or modify another merchant's data.

Multi-tenancy is a core architectural requirement, not a later optimization.

## Tenant model

The initial conceptual boundary is:

```text
organization
  -> store
```

An organization represents the DeliPlus customer account. A store represents a public ordering storefront.

Store-owned entities include, at minimum as they are introduced:

- categories;
- products;
- delivery settings;
- orders.

## MVP assumption

The MVP may expose a single store per organization. The database should still preserve the `organization -> stores` relationship unless an explicit product decision changes this.

## Tenant context

Authenticated dashboard operations should establish tenant context from trusted server-side relationships.

Conceptually:

```text
Clerk session
  -> clerk user ID
  -> organization_members
  -> organization
  -> authorized store(s)
```

Do not accept `organization_id` or `store_id` from a client and trust it without verifying membership.

## Public storefront context

Public storefront data is intentionally public, but it remains scoped to one store.

Conceptually:

```text
storeSlug
  -> active store
  -> canonical store ID
  -> published catalog/configuration for that store
```

A request for `/store-a` must never combine data from `store-b` due to an unscoped query.

## Query rule

Tenant-owned database queries must include the tenant/store relationship appropriate for the operation.

Unsafe conceptual pattern:

```text
update product where id = productId
```

Safer conceptual pattern:

```text
verify membership/store access
update product where id = productId and store_id = authorizedStoreId
```

RLS should provide an additional database-level boundary where Supabase access paths make it applicable.

## Row Level Security

RLS policies should be designed alongside tables, not appended after features are complete.

Do not disable RLS to unblock development without an explicitly temporary and reviewed reason.

The exact strategy depends on how Clerk identity is securely propagated to Supabase/PostgreSQL and must be documented before production use.

## Service-role access

Privileged Supabase/service credentials bypassing normal client restrictions must remain server-only.

Code using privileged access is responsible for explicit authorization before executing tenant-sensitive operations.

Service-role access is not a substitute for authorization.

## Slugs

Store slugs are public identifiers, not secrets and not authorization credentials.

A valid slug allows discovery of intentionally public storefront data only.

Never use knowledge of a slug to grant dashboard access.

## Caching

Tenant/store context must be part of any cache key for tenant-scoped data.

Do not create shared caches where data for different stores can collide.

## Files and images

When product/store media storage is introduced:

- storage paths should include stable tenant/store ownership context;
- upload authorization must verify tenant access;
- deletion must verify ownership;
- public read policy should match the product's publication model.

## Review checklist

For every feature involving merchant data, verify:

- What is the tenant boundary?
- How is tenant context derived?
- Is any tenant ID supplied by the browser?
- Where is membership verified?
- Does every mutation scope by tenant/store?
- Could an IDOR-style request access another tenant's record?
- Is RLS applicable?
- Are cache/storage keys tenant-aware?
