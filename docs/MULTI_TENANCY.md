# DeliPlus Multi-Tenancy

## Goal

Ensure one merchant cannot accidentally or intentionally read or modify another merchant's data while supporting:

- users who participate in more than one business;
- businesses that operate more than one Store;
- Organization members who are authorized for only a subset of Stores.

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

### Store membership

A DeliPlus relationship that grants a normal Clerk Organization member access to a specific Store.

Store membership is not a replacement for Clerk Organization membership.

It exists because a member of a business may operate only one or some of its units.

## Tenant model

The conceptual boundary is:

```text
Clerk User
  -> one or more Clerk Organizations

Clerk Organization
  <-> DeliPlus organization
        -> one or more Stores
             -> Store memberships
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

Organization is the administrative/financial boundary.

Store is the operational boundary.

## Why Store membership exists

Organization membership alone is intentionally broader than Store access.

Example:

```text
Organization: Grupo Bella

Stores:
- Bella Centro
- Bella Norte
- Bella Shopping

João
- Clerk role: admin
- Store access: all Stores

Rafael
- Clerk role: member
- Store access: Bella Centro only

Maria
- Clerk role: member
- Store access: Bella Centro + Bella Shopping
```

DeliPlus therefore keeps Store assignments in PostgreSQL.

## Current access rule

### Organization admin

An Organization admin may access all Stores belonging to the active Organization.

The admin does not require explicit Store membership rows.

### Organization member

An Organization member may access only Stores for which an explicit Store membership exists for their verified Clerk User ID.

Both checks still require the Store to belong to the active Organization.

## Multiple Organizations

DeliPlus may support a user belonging to multiple Organizations.

The active Clerk Organization determines the current tenant context.

Switching Organizations switches tenant context; it must never merge data between tenants.

The Clerk configuration may temporarily limit how many Organizations a user can create. That product/configuration limit does not change the database model.

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

- `essential` permits one Store;
- `multi_2` permits two Stores;
- `multi_3` permits three Stores;
- four or more Stores use a sales-assisted path;
- database cardinality remains `1 -> N`;
- Store-count limits are enforced by trusted application/billing rules;
- intended trial is 15 days on Essential.

Store memberships do not affect Store capacity.

The current Organization-owned billing tables have RLS enabled but no direct `anon` or `authenticated` grants or policies. This default-deny posture prevents both cross-tenant billing reads and unnecessary same-tenant exposure until a narrow entitlement read model is approved.

## Provisioning flow

Creating an Organization in Clerk does not automatically create a DeliPlus organization or Store in PostgreSQL.

Adding a Clerk Organization member does not automatically assign a Store.

Future product flow is conceptually:

```text
sign up / sign in
  -> create/select Clerk Organization
  -> onboarding/billing eligibility
  -> provision internal organization
  -> provision initial Store
  -> dashboard
```

Future team flow is conceptually:

```text
dashboard/team
  -> invite/add Organization member through Clerk
  -> assign Store(s) in DeliPlus
  -> persist store_memberships
```

The exact invitation/assignment lifecycle requires its own feature specification.

## Tenant context

Authenticated dashboard operations establish tenant context from the verified Clerk session.

Conceptually:

```text
Clerk JWT
  sub   -> Clerk user ID
  o.id  -> active Clerk Organization
  o.rol -> Organization role
        ↓
DeliPlus organizations.clerk_organization_id
        ↓
internal organization UUID
```

Do not accept `organization_id`, `store_id`, or `clerk_user_id` from a client as proof of access.

## Store context

For Store-scoped features:

```text
requested/active Store
  -> Store.organization_id must equal active internal Organization

if o.rol = admin
  -> Store access allowed

if o.rol = member
  -> matching store_membership for JWT sub is also required
```

A user with access to Organization A must never gain access to a Store in Organization B merely by changing an ID.

A member of Organization A must never gain access to another Store in A merely by knowing its ID.

## Query rule

Unsafe conceptual pattern:

```text
select orders where store_id = clientStoreId
```

Safer conceptual pattern:

```text
verified active Organization
  -> resolve Store owned by Organization
  -> verify admin or explicit Store membership
  -> query orders using authorized Store ID
```

RLS must provide an additional database-level boundary for Supabase access.

## Row Level Security

RLS policies are designed alongside tenant/Store-owned tables, not appended later.

The database must be able to derive:

- current Clerk user ID;
- active Clerk Organization ID;
- active Clerk Organization role.

The Store membership model should not require trusting caller-provided user IDs.

Do not disable RLS to unblock development without an explicitly temporary and reviewed reason.

## Service-role access

Privileged Supabase/service credentials bypassing normal client restrictions must remain server-only.

Code using privileged access is responsible for explicit authorization before tenant/Store-sensitive operations.

Service-role access is not a substitute for authorization or billing entitlement checks.

## Slugs

Store slugs are public identifiers, not secrets and not authorization credentials.

Clerk Organization slugs and DeliPlus Store slugs are different concepts.

Never use knowledge of a Store slug to grant dashboard access.

## Caching

Organization, Store and authorization context must be part of any cache key for scoped data.

Do not create shared caches where data for different Organizations/Stores can collide.

## Review checklist

For every feature involving merchant data, verify:

- What is the Organization boundary?
- What is the Store boundary?
- How is the active Clerk Organization derived?
- How is the current Clerk user ID derived?
- Is the user an Organization admin?
- If not admin, is explicit Store membership required and verified?
- Is any tenant/Store/user ID supplied by the browser?
- Where are feature permissions checked?
- Is billing/Store-capacity entitlement relevant?
- Does every mutation scope by Organization and Store?
- Could an IDOR-style request access another Store/tenant?
- Does RLS enforce the boundary?
- Are cache/storage keys tenant-aware?
