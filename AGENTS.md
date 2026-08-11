# AGENTS.md — DeliPlus

This file defines the default operating rules for coding agents working in this repository.

## 1. Project context

DeliPlus is a multi-tenant SaaS for food delivery businesses such as restaurants, pizzerias, snack bars and açaí shops.

The platform has three primary surfaces:

1. Marketing and SaaS acquisition: landing page, pricing, authentication and billing.
2. Merchant dashboard: products, categories, orders, delivery configuration and store settings.
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

Planned application services:

- Supabase / PostgreSQL for application data
- Clerk for authentication and identity
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
- verify tenant isolation concerns;
- verify authorization boundaries;
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
  ui/             # shared shadcn/base UI primitives
  marketing/      # marketing-only components
  dashboard/      # merchant dashboard components
  storefront/     # public storefront components

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
- `docs/architecture*` and architecture decision records
- authentication architecture
- authorization rules
- Clerk configuration
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
organization
  -> store
     -> categories
     -> products
     -> delivery configuration
     -> orders
```

Even if the MVP initially uses one store per organization, do not hard-code that assumption into domain relationships unless the product decision is explicitly documented.

Every tenant-owned record must be scoped by an appropriate tenant/store relationship.

Never query tenant-owned data only by a user-controlled record ID or slug when authorization also requires tenant ownership verification.

Do not rely on UI hiding for authorization.

Database policies and server-side authorization are mandatory security boundaries.

See `docs/MULTI_TENANCY.md` and `docs/AUTHORIZATION.md`.

## 7. Authentication and authorization

Clerk is responsible for user identity and authentication.

PostgreSQL/Supabase is responsible for application domain data and authorization relationships.

Do not treat Clerk metadata alone as the canonical application authorization database.

Application roles should be represented through persisted membership relationships such as organization membership.

Never expose secrets or privileged Supabase credentials to client components.

## 8. Database changes

Database changes must be deliberate and reviewable.

When introducing or changing persisted data:

- use migrations;
- use stable foreign keys;
- define tenant ownership explicitly;
- consider indexes for tenant-scoped lookups;
- define deletion behavior deliberately;
- consider RLS before exposing data through Supabase;
- update `docs/DATABASE.md` when the domain model materially changes.

Do not create production tables directly from application code.

## 9. Stripe and subscriptions

Stripe is for the merchant's DeliPlus subscription in the initial scope.

Do not implement end-customer payment without an explicit product decision.

Billing state must be verified server-side. Never grant paid access based only on client state or redirect query parameters.

Webhook handlers must be idempotent and verify Stripe signatures.

## 10. Next.js rules

Use the App Router and current repository conventions.

Prefer Server Components by default. Add `"use client"` only where browser APIs, stateful interactivity or client-only libraries require it.

Keep secrets and privileged data access on the server.

Prefer server-side data access for authenticated dashboard data unless there is a concrete UX reason for client fetching.

Do not add API routes when a Server Action or server-side module is a clearer boundary; do not force Server Actions where an HTTP endpoint is required, such as third-party webhooks.

## 11. UI rules

Reuse existing shadcn/ui primitives before creating replacements.

Keep reusable primitives in `components/ui` and feature-specific composition outside it.

Do not modify generated/shared UI primitives for one isolated screen if composition or variants can solve the requirement.

Use Tailwind utilities consistently with the existing project.

Maintain accessibility:

- semantic elements;
- keyboard access;
- visible focus states;
- labels for controls;
- meaningful loading/error states.

## 12. TypeScript rules

Keep TypeScript strict and avoid `any` unless an unavoidable boundary is documented.

Prefer domain-specific types over large generic objects.

Do not duplicate database/domain types across unrelated files if a shared canonical type already exists.

Validate untrusted external input at server boundaries.

## 13. Scope discipline

Do not:

- refactor unrelated files;
- rename broad structures during a feature task;
- replace working libraries without request;
- add speculative abstractions;
- implement out-of-scope future features;
- make formatting-only repository-wide changes during feature work;
- commit secrets or real credentials;
- weaken authentication, authorization or RLS to make a feature work.

If you find an unrelated issue, report it separately instead of silently expanding scope.

## 14. Documentation rules

Documentation is part of the implementation when behavior or architecture changes.

Use:

- `docs/ARCHITECTURE.md` for system-level boundaries;
- `docs/DATABASE.md` for the current data model;
- `docs/MULTI_TENANCY.md` for tenant isolation;
- `docs/AUTHORIZATION.md` for access rules;
- `docs/GIT_WORKFLOW.md` for collaboration conventions;
- `docs/DEVELOPMENT.md` for local engineering workflow;
- `docs/features/` for feature specifications;
- `docs/decisions/` for durable architectural decisions.

Documentation should describe current approved behavior, not guesses presented as fact.

## 15. Git rules for agents

Do not commit directly to `main`.

Keep changes focused enough to review in a pull request.

Do not rewrite Git history, force push, delete branches or discard user changes unless explicitly instructed.

Never include unrelated generated files or local environment files in a commit.

Suggested branch names:

```text
feature/<short-name>
fix/<short-name>
chore/<short-name>
docs/<short-name>
```

## 16. Definition of done

A task is complete when:

- requested behavior is implemented;
- scope is respected;
- types are sound;
- relevant checks were run or limitations were stated;
- tenant and authorization boundaries were considered;
- new environment variables are documented;
- migrations are included when required;
- meaningful architectural changes are documented;
- the final diff is reviewable and contains no unrelated work.
