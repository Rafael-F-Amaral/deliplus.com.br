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

Before opening a PR:

```bash
yarn lint
yarn typecheck
yarn build
```

## Environment variables

Do not commit real secrets.

When the first external services are configured, add a committed `.env.example` containing variable names and safe placeholders.

Expected categories over time:

```text
Clerk
Supabase
Stripe
application URL/configuration
```

Do not document real keys in repository markdown.

## Dependency policy

Before adding a package:

1. confirm the capability is not already available in the current stack;
2. explain why the dependency is needed for non-obvious additions;
3. prefer maintained libraries with a clear role;
4. avoid overlapping libraries solving the same concern;
5. keep package additions inside the feature that requires them.

Planned services such as Clerk, Supabase and Stripe should be added when their implementation begins, not merely because they appear in architecture documents.

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

Conceptual examples:

```text
lib/supabase/server.ts
lib/supabase/client.ts
```

Exact file names may change after implementation planning.

Do not create a privileged service-role browser client.

The current server-side Supabase client uses the publishable key and forwards
the active Clerk session token through Supabase Third-Party Auth. Clerk remains
the application's only authentication provider.

Local development uses the Supabase stack configured under `supabase/`. Check
its health with:

```bash
yarn supabase status
```

No application schema or RLS policies have been implemented yet. Those
security boundaries must be designed together in the feature that introduces
the first tenant-owned tables.

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

## Documentation workflow

For a substantial feature:

1. create/update its spec under `docs/features/`;
2. agree on significant data/architecture changes;
3. implement;
4. update current-state documentation;
5. add an ADR if the decision is durable and non-obvious.
