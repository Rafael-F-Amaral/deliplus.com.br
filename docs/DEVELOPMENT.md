# DeliPlus Development Guide

## Current project foundation

The repository was initialized with Next.js, TypeScript, Tailwind CSS and shadcn/ui.

Use `package.json` as the source of truth for versions and scripts.

Current scripts:

```bash
yarn dev
yarn build
yarn start
yarn lint
yarn format
yarn typecheck
```

## Package manager

A `yarn.lock` is committed, so use Yarn consistently unless the team explicitly migrates package managers.

Do not commit competing lockfiles.

## Local setup

Typical setup:

```bash
yarn install
yarn dev
```

Supabase local development also requires the Docker-compatible local stack:

```bash
yarn supabase start
yarn supabase status
```

Before opening a PR:

```bash
yarn lint
yarn typecheck
yarn build
```

## Environment variables

Do not commit real secrets.

The project keeps safe variable names/placeholders in `.env.example` and real local values in ignored environment files.

Current external-service categories:

```text
Clerk
Supabase
```

Planned:

```text
Stripe
application URL/configuration as required
```

Do not document real keys in repository markdown.

## Dependency policy

Before adding a package:

1. confirm the capability is not already available in the current stack;
2. explain why the dependency is needed for non-obvious additions;
3. prefer maintained libraries with a clear role;
4. avoid overlapping libraries solving the same concern;
5. keep package additions inside the feature that requires them.

Do not add `@supabase/ssr` unless a concrete requirement for Supabase-managed cookie sessions appears. Clerk currently manages authentication/session state and the application passes the Clerk token to `@supabase/supabase-js`.

## UI development

The project uses shadcn/ui and Tailwind.

Guidelines:

- reuse `components/ui` primitives;
- use composition for feature-specific components;
- keep marketing/dashboard/storefront components in their own boundaries as they appear;
- preserve accessibility;
- avoid introducing another component system without an architectural decision.

## Server and client components

Default to server-side code in the App Router.

Use Client Components only when required for:

- local interactive state;
- event handlers;
- browser APIs;
- client-only third-party libraries.

Never put server secrets into code reachable by the browser.

## Data access

Keep Supabase clients/helpers separated by execution context rather than using one universal privileged client.

The current server-side Supabase client:

- uses the Supabase publishable key;
- forwards the active Clerk session token through Supabase Third-Party Auth;
- does not use Supabase Auth as a second application login;
- does not use a service-role key for normal tenant access.

Current helper:

```text
lib/supabase/server.ts
```

Do not create a browser Supabase client until a concrete feature requires one.

Local development uses the Supabase stack configured under `supabase/`.

## Database workflow

Database changes use Supabase migrations as the source of truth.

Typical feature flow:

```text
SPEC
  -> PLAN
  -> migration
  -> yarn supabase db reset
  -> local RLS / isolation verification
  -> review
  -> yarn supabase db push --dry-run
  -> explicit Staging push only after approval
```

Do not create application tables manually in the hosted Dashboard as the canonical schema.

The first tenant-owned schema is specified in:

```text
docs/features/database-tenant-core/SPEC.md
```

It introduces the `organizations` / `stores` tenant core and RLS foundation.

## Multi-tenant development

Clerk is the source of truth for Organization membership and Organization roles.

PostgreSQL stores the internal DeliPlus tenant and Store relationships.

Do not create a local `organization_members` mirror unless a future approved feature requires application-specific membership data.

When testing tenant-owned data, include cross-tenant negative cases, not only successful same-tenant cases.

## Billing development

The Organization is the SaaS billing boundary.

Store limits are plan entitlements.

Current product direction:

- Essential: one Store;
- intended trial: 15 days on Essential;
- higher Store capacities: to be defined by billing/product specification.

Do not implement trial eligibility or higher-plan limits speculatively.

In particular, do not assume that every new Clerk Organization automatically receives another free trial.

## Validation

Treat form input, URL parameters, webhook payloads and external API data as untrusted.

A validation library has not yet been selected in the current foundation. Do not assume one exists.

When a feature genuinely requires schema validation, select/introduce the solution through that feature's plan rather than embedding an undocumented new project convention.

## Errors

Features should provide deliberate:

- loading states;
- empty states;
- validation feedback;
- recoverable error messages;
- server-side logging where appropriate.

Do not expose secrets, stack traces or cross-tenant details to end users.

## Tests

A project-wide automated test stack is not defined yet.

Do not invent a test framework silently. When critical domain logic appears, define the testing approach in an explicit task/decision.

Regardless of test framework, `lint`, `typecheck` and production `build` remain baseline checks.

Database security features must also include appropriate local isolation verification.

## Documentation workflow

For a substantial feature:

1. create/update its spec under `docs/features/`;
2. agree on significant data/architecture changes;
3. implement;
4. update current-state documentation;
5. add an ADR if the decision is durable and non-obvious.
