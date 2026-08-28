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

### Billing entitlement — DeliPlus + projected Stripe paid state

Billing answers:

> Does this Organization have a valid local trial or paid-subscription projection for the requested capability and Store capacity?

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

Tenant provisioning uses its reviewed server-only boundary. Store setup uses a
separate narrow server-only service that can create only draft Stores, update
name/slug, and mark valid drafts ready; it does not activate Stores or grant entitlement.
The separate first-Store activation boundary now enforces historical initial-trial
eligibility and commits the initial grant plus Store activation atomically. Generic
paid/manual-entitlement activation and active-Store capacity enforcement remain future
features. Store-membership mutation also requires its own reviewed trusted boundary.

Every Store setup operation authenticates with Clerk, requires the active
Organization's `org:admin` role, resolves the internal Organization through the
normal Clerk-JWT/RLS client, and scopes Store selectors to that Organization.
Missing and cross-tenant Stores share the same safe public outcome.

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

- `essential` supports one Store;
- `multi_2` supports two Stores;
- `multi_3` supports three Stores;
- four or more Stores use a sales-assisted path;
- the initial self-service trial is 15 days on Essential, with no card and no Stripe trial.

`maxStores` is operational capacity: it counts only Stores with
`status = 'active'`. Draft and ready Stores do not consume capacity. Creating or
configuring a draft Store therefore grants no operational entitlement. A future
activation boundary must count and activate atomically.

Initial-trial activation must also verify that the Organization has no Store
that was previously activated (`activated_at IS NOT NULL`), in addition to the
approved User- and Organization-level trial history rules.

The implemented `activateFirstStoreWithInitialTrial(storeId)` operation:

- runs server-side and accepts only the Store UUID as a resource selector;
- requires authenticated Clerk state, an active Organization and `org:admin`;
- repeats the admin-role check inside PostgreSQL from the verified JWT;
- derives both internal Organization and Clerk User identity without browser authority;
- treats missing and cross-tenant Stores as the same `store_unavailable` outcome;
- permits only the first historical `ready -> active` transition;
- denies a new initial trial after any Organization/User initial grant, including expired or revoked grants;
- directs valid paid/manual-entitlement cases to the future generic activation flow;
- uses one PostgreSQL timestamp for trial start and Store activation;
- makes no Stripe request and uses no Supabase admin client.

The corresponding `SECURITY DEFINER` RPC is executable only by `authenticated` among
Data API roles. It grants no generic authenticated write capability on Store or billing
tables.

The current billing database foundation contains Organization-owned local trial history, canonical Stripe Customer identity, paid Subscription projection, and webhook Event ledger tables. RLS is enabled on all four.

Neither `anon` nor `authenticated` has direct access to any billing table. There are no billing RLS policies and no generic billing writes. Normal server-side billing authorization uses `resolveOrganizationEntitlement()`, which calls the zero-argument `public.resolve_active_organization_entitlement_facts()` function through the Clerk-JWT Supabase client.

The entitlement facts function:

- derives the tenant exclusively from `private.clerk_organization_id()`;
- accepts no Organization, Clerk, Store, Customer, or Subscription identifier;
- is `STABLE` and `SECURITY DEFINER` with an empty `search_path`;
- is executable only by `authenticated` among Data API client roles;
- returns only the resolved active-trial plan/end and current paid plan/status/collection-pause facts;
- does not grant direct billing-table access or perform mutations.

The server resolver treats missing authentication, missing active Organization, and missing internal Organization as explicit precondition failures. It validates all returned facts before applying paid-over-trial descriptive precedence. Only `active` and `past_due` with collection active grant paid entitlement; a valid local trial may still grant entitlement while paid collection is paused. Unknown or inconsistent facts fail closed.

Paid projection mutation is now restricted to this verified boundary:

```text
raw Stripe request
  -> Stripe-Signature verification
  -> current Stripe Subscription retrieval
  -> canonical billing Customer lookup
  -> known Price-to-PlanCode mapping
  -> atomic Event ledger + paid projection RPC
```

The webhook does not use Clerk because the Stripe signature authenticates that machine-to-machine request. It cannot choose an Organization from browser input or Stripe metadata: the internal Organization is derived only from the local canonical `billing_customers.stripe_customer_id` relation. The transactional RPC is `SECURITY INVOKER`, is executable only by `service_role`, and does not grant `anon` or `authenticated` any billing capability.

Webhook processing never creates or changes `billing_trial_grants`. Invoice and Checkout Events trigger reconciliation only; they do not grant entitlement directly. The Organization entitlement resolver interprets the trusted local trial and paid projections without calling Stripe on the normal request path.

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
