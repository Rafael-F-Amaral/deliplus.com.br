# AGENTS.md — DeliPlus

This file defines the default operating rules for coding agents working in this repository.

## 1. Project context

DeliPlus is a multi-tenant SaaS for food delivery businesses such as restaurants, pizzerias, snack bars and açaí shops.

The platform has three primary surfaces:

1. Marketing and SaaS acquisition: landing page, pricing, authentication and billing.
2. Merchant dashboard: products, categories, orders, delivery configuration, team access and store settings.
3. Public storefront: customer-facing store pages available by store slug, e.g. `/store-slug`.

The end customer places an order through the storefront. End-customer online payment is out of scope for the initial product. Stripe is used for merchant SaaS subscriptions.

## 2. Current stack

Use the versions declared in `package.json` as the source of truth.

Current foundation:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Base UI
- Hugeicons
- Clerk for authentication, Organizations, Organization membership and Organization roles
- Supabase / PostgreSQL for application data and Store-level authorization
- Supabase Third-Party Auth with Clerk
- Supabase CLI for local development and migrations

Planned application service:

- Stripe for merchant subscription billing

Do not add a new framework, state library, ORM, validation library, form library or infrastructure dependency unless the task explicitly requires it or an approved plan documents the need.

## 3. Required workflow

Before changing code:

1. Read this file.
2. Read the documents relevant to the task under `docs/`.
3. Inspect the current implementation and nearby patterns.
4. Check `package.json` before assuming a dependency exists.
5. Keep the task within its requested scope.

For non-trivial work, follow:

`SPEC -> PLAN -> IMPLEMENT -> VERIFY -> REVIEW`

### SPEC

A feature should have clear requirements before implementation. If a feature spec exists under `docs/features/`, treat it as the product source of truth.

### PLAN

For architectural, cross-cutting or multi-file changes, produce a short implementation plan before editing code when requested. Identify affected files, database changes, risks and verification steps.

### IMPLEMENT

Implement the smallest coherent change that satisfies the approved scope. Reuse existing patterns instead of introducing parallel abstractions.

### VERIFY

Run the relevant checks when possible:

```bash
yarn lint
yarn typecheck
yarn build
```

Do not claim a command passed unless it was actually executed successfully.

### REVIEW

Before finishing:

- inspect the diff;
- remove unrelated edits;
- verify Organization isolation;
- verify Store-level authorization;
- mention migrations or environment-variable changes;
- document meaningful architectural decisions.

## 4. Architecture boundaries

The repository should keep clear boundaries between platform, merchant dashboard and public storefront concerns.

Preferred route direction:

```text
app/
  (marketing)/
  (auth)/
  dashboard/
  [storeSlug]/
```

Do not reorganize the route tree merely for stylistic preference. Structural changes require an explicit architectural reason.

Preferred code organization:

```text
components/
  ui/
  marketing/
  dashboard/
  storefront/

lib/
  supabase/
  clerk/
  stripe/
  validations/

hooks/
types/
```

Create folders only when they are needed. Do not prebuild empty architecture.

## 5. Protected architecture

The following areas are considered architecture-sensitive:

- `AGENTS.md`
- architecture decision records
- authentication architecture
- authorization rules
- Clerk configuration
- Store membership/access model
- Supabase clients and security model
- PostgreSQL schema and migrations
- Row Level Security policies
- Stripe billing and webhook handling
- tenancy model
- middleware / proxy / request-boundary logic
- public routing and store-slug resolution
- shared domain types
- environment-variable conventions
- CI/CD and deployment configuration

If a task appears to require changing one of these areas and the change was not explicitly requested:

1. do not silently change it;
2. explain why the change appears necessary;
3. propose the smallest safe plan;
4. wait for approval when the task is planning-only.

Never rewrite or delete migrations just to make a local implementation easier.

## 6. Multi-tenancy rules

DeliPlus is multi-tenant from the beginning.

The conceptual ownership chain is:

```text
Clerk Organization
  -> DeliPlus organization
     -> stores
        -> categories
        -> products
        -> delivery configuration
        -> orders
```

A Clerk Organization represents the merchant account / tenant identity in Clerk.

A DeliPlus `organizations` row is the internal PostgreSQL representation of that same tenant and must map to exactly one Clerk Organization through `clerk_organization_id`.

A Store is an establishment/storefront owned by an Organization.

One Organization may own multiple Stores. Even if the MVP initially provisions one Store, do not hard-code a one-store limitation into domain relationships.

Clerk Organization membership does **not** automatically grant access to every Store.

Store access rules are:

```text
Clerk Organization admin
  -> may access all Stores in the active Organization

Clerk Organization member
  -> may access only Stores explicitly assigned through DeliPlus Store membership
```

The Store assignment relation belongs to PostgreSQL because Store is a DeliPlus domain entity.

Do not recreate a local `organization_members` table merely to duplicate Clerk membership.

Every tenant-owned record must be scoped by an appropriate Organization/Store relationship.

Never query tenant-owned data only by a user-controlled record ID or slug when authorization also requires tenant/Store ownership verification.

Do not rely on UI hiding for authorization.

Database policies and server-side authorization are mandatory security boundaries.

See `docs/MULTI_TENANCY.md`, `docs/AUTHORIZATION.md`, and `docs/decisions/ADR-002-store-level-access-model.md`.

## 7. Authentication and authorization

Clerk is the source of truth for:

- user identity;
- authentication;
- Organization membership;
- active Organization;
- Clerk Organization roles.

Supabase/PostgreSQL is the source of truth for:

- internal DeliPlus organization records;
- Stores;
- Store membership/assignment;
- catalog;
- orders;
- delivery configuration;
- billing projection/state;
- other application/domain data.

Do not create a local `organization_members` table unless a future approved feature establishes a concrete application need that Clerk cannot satisfy.

The initial Store-level assignment entity is `store_memberships`.

A Store membership answers only:

> Which Store(s) inside the active Organization may this Clerk user access?

It does not replace Clerk Organization membership.

Tenant context for authenticated requests must be derived from the verified Clerk session/JWT and mapped to the internal DeliPlus organization.

Store-scoped authorization must additionally resolve either:

- Organization admin access to all Stores in the tenant; or
- an explicit `store_memberships` assignment for the current Clerk user.

Do not trust an `organization_id`, `store_id`, or `clerk_user_id` supplied by the browser without server-side/database verification.

Never expose secrets or privileged Supabase credentials to client components.

## 8. Database changes

Database changes must be deliberate and reviewable.

When introducing or changing persisted data:

- use migrations;
- use stable foreign keys;
- define Organization ownership explicitly;
- define Store access explicitly;
- consider indexes for tenant/Store-scoped lookups;
- define deletion behavior deliberately;
- design RLS together with tenant-owned schema;
- update `docs/DATABASE.md` when the domain model materially changes.

Do not create production tables directly from application code or manually treat hosted dashboard changes as the source of truth.

## 9. Stripe, plans and subscriptions

Stripe is for the merchant's DeliPlus subscription in the initial scope.

The subscription/plan boundary is the DeliPlus Organization, not an individual Store and not the Clerk User.

Conceptually:

```text
Organization
  -> Subscription / plan entitlement
  -> allowed Store capacity
  -> Stores
```

Current product direction:

- the Essential plan supports one Store;
- higher plans may support additional Stores;
- exact higher-plan names, prices and limits must not be invented before product approval;
- the intended trial is 15 days on the Essential plan;
- trial eligibility must be enforced server-side and must not assume that creating unlimited Clerk Organizations automatically grants unlimited trials.

Store access assignments do not change Store-capacity billing rules.

Do not implement end-customer payment without an explicit product decision.

Billing state and Store-capacity entitlement must be verified server-side. Never grant paid access based only on client state or redirect query parameters.

## 10. Team-management UX

The Clerk Organization UI may remain available for Organization-level account management and switching.

DeliPlus will own Store-specific team-access UX.

A future dashboard team flow should be able to conceptually perform:

```text
invite/add Organization member through Clerk
  -> assign one or more Stores in DeliPlus
```

The merchant should not be required to understand the internal split between Clerk and Supabase.

Do not implement this UI or provisioning flow unless requested by its own feature specification.

## 11. Next.js rules

Use the App Router and current repository conventions.

Prefer Server Components by default. Add `"use client"` only where browser APIs, stateful interactivity or client-only libraries require it.

Keep secrets and privileged data access on the server.

Prefer server-side data access for authenticated dashboard data unless there is a concrete UX reason for client fetching.

Do not add API routes when a Server Action or server-side module is a clearer boundary; do not force Server Actions where an HTTP endpoint is required, such as third-party webhooks.

## 12. Scope discipline

Do not:

- expand a feature into adjacent product work;
- introduce speculative abstractions;
- create empty architecture for future ideas;
- add dependencies “just in case”;
- silently alter auth, tenancy, Store access, billing or database strategy;
- bypass RLS or authorization to make development easier.

When a requirement is unclear but implementation can safely proceed within the approved spec, choose the smallest non-speculative solution and document the assumption.

## 13. Collaboration

AI-generated work follows the same Git and review rules as manual work.

Do not commit, push, merge, rebase or rewrite history unless the task explicitly authorizes it.

Keep one coherent purpose per branch and review all generated diffs before merge.
