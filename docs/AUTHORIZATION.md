# DeliPlus Authentication & Authorization

## Separation of concerns

DeliPlus separates identity, Organization membership, Store access, application authorization and billing entitlement.

### Authentication — Clerk

Clerk answers:

> Who is this user?

### Organization membership — Clerk

Clerk answers:

> Which Clerk Organizations does this user belong to, which Organization is active, and what Organization role do they have?

### Store access — DeliPlus + PostgreSQL

DeliPlus answers:

> Within the active Organization, which Store(s) may this Clerk user operate?

### Application authorization — DeliPlus + PostgreSQL/RLS

DeliPlus answers:

> Given the active Organization, Store access and requested resource, what may this request read or modify?

### Billing entitlement — DeliPlus + Stripe state

Billing answers:

> Is this Organization currently entitled to this paid capability, including its allowed Store capacity?

These concerns are related but must not be collapsed into one client-side check.

## Tenant identity mapping

The durable application mapping is:

```text
Clerk Organization
  id: org_...

      ↕

public.organizations
  id: internal UUID
  clerk_organization_id: org_...
```

Do not create a local `organization_members` table in the current architecture.

Clerk remains the source of truth for Organization membership and Organization roles.

The internal organization UUID is the canonical foreign-key target for DeliPlus domain data.

## Store assignment model

Store-specific access is represented in PostgreSQL because Stores do not exist in Clerk.

Conceptually:

```text
public.store_memberships

id
organization_id
store_id
clerk_user_id
created_at
updated_at
```

The initial model records **assignment/access only**.

Do not introduce Store-specific roles such as `manager`, `staff`, `kitchen`, or custom permissions until a dedicated feature specification defines their semantics.

The pair:

```text
(store_id, clerk_user_id)
```

must be unique.

The composite foreign key:

```text
(organization_id, store_id)
  -> stores(organization_id, id)
```

prevents a Store assignment from pairing one Organization with another
Organization's Store.

A Store membership does not prove Organization membership by itself. The authenticated user must also have a verified active Clerk Organization matching the Store's parent Organization.

## Current Store access rule

### Organization admin

A Clerk Organization admin may access every Store belonging to the active Organization.

No `store_memberships` row is required for admin access.

### Organization member

A Clerk Organization member may access only Stores that:

1. belong to the active Organization; and
2. have a `store_memberships` row for the current Clerk user ID.

A Store assignment must never grant access across Organizations.

## Active identity claims

Authenticated tenant/Store-scoped requests derive identity from the verified Clerk JWT.

Relevant claims:

```text
sub
  -> Clerk User ID

o.id
  -> active Clerk Organization ID

o.rol
  -> active Clerk Organization role
```

Do not accept client-supplied replacements for these values.

## Recommended operation shape

Conceptually:

```text
1. obtain authenticated Clerk session
2. obtain verified Clerk user ID
3. obtain verified active Clerk Organization
4. resolve internal DeliPlus organization
5. resolve Store context when required
6. authorize Store access:
     admin -> Store belongs to Organization
     member -> Store belongs to Organization + store_membership exists
7. verify feature permission/billing entitlement where relevant
8. perform tenant/Store-scoped operation
```

Prefer shared server/data-layer authorization helpers when repeated patterns become concrete.

Do not over-abstract before real flows exist.

## RLS

RLS is a database security boundary, not a substitute for good server-side design.

Tenant/Store-owned tables should derive identity from the verified Clerk JWT accepted through Supabase Third-Party Auth.

Do not create RLS policies that trust:

- `organization_id` from request bodies;
- `store_id` from request bodies/routes;
- `clerk_user_id` supplied by the client.

Store-scoped RLS must account for:

- active Organization ownership;
- Clerk Organization role;
- current Clerk user ID;
- Store assignment for normal members.

## Initial tenant-core write boundary

The initial `database-tenant-core` migration is a security foundation, not the onboarding/team-management implementation.

Normal `authenticated` Data API access should be read-only for tenant-core records in the initial migration.

Do not grant generic authenticated writes to:

- organizations;
- stores;
- store_memberships.

Provisioning and Store-membership mutation will be implemented later through an explicitly trusted server-side boundary so billing/Store-capacity and membership lifecycle rules cannot be bypassed.

## Team management

The intended future merchant UX is a DeliPlus-owned team screen.

Conceptual flow:

```text
invite member
  -> create/send Clerk Organization invitation
  -> after/with accepted Organization membership
  -> assign Store(s) in DeliPlus
```

The exact lifecycle for pending invitations versus accepted members requires its own feature specification.

Do not force merchants to manually coordinate the Clerk Organization profile and a separate low-level database screen.

## Public vs private data

### Public storefront

May expose deliberately published Store data such as:

- Store name;
- active categories;
- active products;
- public delivery information.

Public database access is not part of the initial tenant-core migration and must be designed separately.

### Merchant dashboard

Requires authenticated Clerk membership in the active Organization plus Store authorization for Store-scoped resources.

### Sensitive/private data

Never expose through public storefront queries merely because records share a Store ID.

## Billing authorization and Store capacity

Subscription entitlement belongs to the Organization.

Conceptually:

```text
Organization
  -> plan
  -> max Stores / entitlements
```

Current product direction:

- Essential supports one Store;
- higher plans may support more Stores;
- exact higher-plan limits remain a billing/product decision;
- intended trial duration is 15 days on Essential.

Creating a Clerk Organization does not itself grant a trial, create a Store or establish paid access.

Adding Store memberships does not change billing Store capacity.

Trial eligibility and Store-capacity checks must be enforced server-side against trusted billing/application state.

## Error behavior

Avoid revealing another tenant's or unauthorized Store's existence through authorization errors where practical.

For Store-owned resource requests, prefer behavior that does not leak sensitive cross-Store/cross-tenant metadata.

## Security review checklist

Before merging protected dashboard functionality:

- Is Clerk authentication required?
- Is the active Clerk Organization verified?
- Is the current Clerk user ID derived from the verified token?
- How is the internal DeliPlus organization resolved?
- Does the operation require a Store?
- Does the Store belong to the active Organization?
- If the user is not an Organization admin, is Store membership verified?
- Where are additional feature permissions checked?
- Is billing entitlement relevant?
- Can a client alter an ID to access another Store/tenant?
- Does RLS enforce the same boundary?
- Are privileged credentials client-visible?
- Is UI-only access control being mistaken for security?
