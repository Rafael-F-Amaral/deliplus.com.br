# DeliPlus Authentication & Authorization

## Separation of concerns

DeliPlus separates identity, tenant membership, application authorization and billing entitlement.

### Authentication — Clerk

Clerk answers:

> Who is this user?

### Organization membership — Clerk

Clerk answers:

> Which Clerk Organizations does this user belong to, which Organization is active, and what Clerk Organization role do they have?

### Application authorization — DeliPlus + PostgreSQL/RLS

DeliPlus answers:

> Given the verified active Clerk Organization, which internal organization and Store data may this request access or modify?

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

Clerk remains the source of truth for Organization membership and Clerk Organization roles.

The internal organization UUID is the canonical foreign-key target for DeliPlus domain data.

## Active Organization

Authenticated tenant-scoped requests must derive tenant context from the verified Clerk session/JWT.

Conceptually:

```text
Clerk session
  -> active Clerk Organization
  -> clerk_organization_id
  -> internal DeliPlus organization
  -> authorized Store(s)
```

If no active Organization exists, tenant-scoped database access must fail safely or return no tenant rows.

Never trust a browser-supplied `organization_id` as proof of access.

## Initial Clerk Organization roles

The current tenant-core specification uses Clerk Organization role semantics conservatively:

```text
admin
member
```

For the tenant core:

- `admin` may create/update its own internal tenant core data;
- `member` may read tenant core data;
- neither receives authenticated delete access in the initial migration.

Do not invent application roles such as `owner`, `staff`, `manager` or custom permissions until a feature specification requires them.

If custom Clerk roles/permissions are introduced later, document their semantics before relying on them.

## Store authorization

A Store always belongs to an internal DeliPlus organization.

For tenant-scoped dashboard operations:

```text
verified active Clerk Organization
  -> internal organization
  -> Store ownership
  -> requested operation
```

A Store ID or product/order ID supplied by a client must never be trusted without ownership verification.

## Recommended operation shape

Conceptually:

```text
1. obtain authenticated Clerk session
2. obtain verified active Clerk Organization
3. resolve internal DeliPlus organization
4. resolve Store context when required
5. verify role/permission and billing entitlement where relevant
6. perform tenant-scoped operation
```

Prefer shared server-side/data-layer authorization helpers when repeated patterns become concrete.

Do not over-abstract before real flows exist.

## RLS

RLS is a database security boundary, not a substitute for good server-side design.

Tenant-owned tables should derive Organization context from the verified Clerk JWT accepted through Supabase Third-Party Auth.

Do not create RLS policies that trust `organization_id` from request bodies, route params or client state.

## Public vs private data

### Public storefront

May expose deliberately published Store data such as:

- Store name;
- active categories;
- active products;
- public delivery information.

Public database access is not part of the initial tenant-core migration and must be designed separately.

### Merchant dashboard

Requires authenticated Clerk membership in the active Organization plus tenant-scoped application authorization.

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

Trial eligibility and Store-capacity checks must be enforced server-side against trusted billing/application state.

Repeated Organization creation must not be assumed to grant unlimited independent trials.

## Webhooks

Third-party webhooks are authenticated through provider-specific signature verification, not Clerk user sessions.

Stripe webhooks must:

- verify the signature;
- handle replay/idempotency safely;
- resolve the correct Organization/customer association;
- update only the intended billing projection.

If Clerk webhooks are introduced later, their purpose must be specified. They are not required merely to duplicate membership into PostgreSQL.

## Error behavior

Avoid revealing another tenant's record existence through authorization errors where practical.

For tenant-owned resource requests, prefer behavior that does not leak sensitive cross-tenant metadata.

## Security review checklist

Before merging protected dashboard functionality:

- Is Clerk authentication required?
- Is the active Clerk Organization verified?
- How is the internal DeliPlus organization resolved?
- Is the requested Store/resource tenant-scoped?
- Where is role/permission authorization checked?
- Is billing entitlement required for the operation?
- Can a client alter an ID to access another tenant?
- Does RLS enforce the tenant boundary?
- Are privileged credentials client-visible?
- Is UI-only access control being mistaken for security?
