# DeliPlus Authentication & Authorization

## Separation of concerns

DeliPlus separates authentication from application authorization.

### Authentication

Clerk answers:

> Who is this user?

### Authorization

DeliPlus application data answers:

> Which organization/store does this user belong to, and what may they do there?

Do not collapse these into one concern.

## Identity mapping

The durable application relationship should conceptually be represented by membership data such as:

```text
organization_members
  organization_id
  clerk_user_id
  role
```

A Clerk user ID identifies the external authenticated identity. PostgreSQL relationships determine DeliPlus access.

## Initial roles

Potential initial roles:

```text
owner
admin
staff
```

Do not create a large permission matrix until product requirements justify it.

Until role behavior is formally specified, avoid scattering hard-coded role checks throughout components.

## Authorization placement

Authorization must occur at trusted server boundaries before privileged reads or writes.

Examples:

- Server Actions;
- Route Handlers;
- server-only data-access functions;
- webhook handlers where application ownership is involved.

Client-side route guards and hidden buttons improve UX but are not authorization controls.

## Recommended operation shape

Conceptually:

```text
1. obtain authenticated Clerk user
2. resolve membership
3. resolve organization/store context
4. verify required permission
5. perform tenant-scoped operation
```

Prefer shared server-side authorization helpers over repeatedly reconstructing this logic inconsistently.

Do not over-abstract before the first concrete authorization flows exist.

## Public vs private data

### Public storefront

May expose deliberately published data such as:

- store name;
- active categories;
- active products;
- public delivery information.

### Merchant dashboard

Requires authenticated and authorized membership.

### Sensitive/private data

Never expose through public storefront queries merely because records share a store ID.

## Billing authorization

A user's ability to enter the dashboard and an organization's subscription entitlement are related but distinct checks.

Billing access should be based on trusted server-side application/Stripe state.

Do not grant paid functionality from client-controlled values.

## Webhooks

Third-party webhooks are authenticated through provider-specific signature verification, not Clerk user sessions.

Stripe webhooks must:

- verify the signature;
- handle replay/idempotency safely;
- resolve the correct organization/customer association;
- update only the intended billing projection.

## Error behavior

Avoid revealing another tenant's record existence through authorization errors where practical.

For tenant-owned resource requests, prefer behavior that does not leak sensitive cross-tenant metadata.

## Security review checklist

Before merging protected dashboard functionality:

- Is authentication required?
- Where is authorization checked?
- Is the membership lookup server-side?
- Is the requested resource tenant-scoped?
- Can a client change an ID to access another tenant?
- Are privileged credentials client-visible?
- Is UI-only access control being mistaken for security?
