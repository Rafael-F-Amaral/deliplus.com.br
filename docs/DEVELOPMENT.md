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
yarn test:store-provisioning-setup
yarn test:store-trial-activation
yarn test:store-trial-activation:concurrency
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
Stripe server foundation
```

The Stripe server foundation recognizes these server-only variables:

```text
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_ESSENTIAL
STRIPE_PRICE_MULTI_2
STRIPE_PRICE_MULTI_3
BILLING_RETURN_ORIGIN
```

The configuration is lazy. Missing Stripe secrets, Price IDs, or return origin do not break unrelated pages or `next build`; an error is raised only when the route or billing operation that needs a value executes.

Use separate Stripe resources for each environment:

```text
Local           -> Stripe Test/Sandbox
Preview/Staging -> Stripe Test/Sandbox
Production      -> Stripe Live
```

Prefer a restricted Stripe API key with only the permissions required by the server integration. Store it in ignored local environment configuration or as a sensitive hosted environment variable. Never document, log, commit, or prefix a Stripe secret with `NEXT_PUBLIC_`.

Each approved `PlanCode` maps to a different environment-specific Stripe Price ID. A Test/Sandbox Price ID must never be reused as a Live Price ID. The code validates the `price_...` shape locally, but Stripe Price IDs do not encode Test/Live mode, so matching-mode verification remains an environment/deployment responsibility.

Stable Local, Staging, and Production deployments use an explicit `BILLING_RETURN_ORIGIN`. Ephemeral Vercel Preview deployments may fall back to the system-provided `VERCEL_URL`. Request headers are never an authority for billing return URLs.

No publishable Stripe key is required for the approved future server-created, Stripe-hosted Checkout redirect. `STRIPE_WEBHOOK_SECRET` is the endpoint-specific `whsec_...` signing secret; it is not an API key and must remain server-only.

Do not document real keys in repository markdown.

## Dependency policy

Before adding a package:

1. confirm the capability is not already available in the current stack;
2. explain why the dependency is needed for non-obvious additions;
3. prefer maintained libraries with a clear role;
4. avoid overlapping libraries solving the same concern;
5. keep package additions inside the feature that requires them.

Do not add `@supabase/ssr` unless a concrete requirement for Supabase-managed cookie sessions appears. Clerk currently manages authentication/session state and the application passes the Clerk token to `@supabase/supabase-js`.

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

## Identity and Store access during development

Clerk remains the source of:

- user identity;
- Organization membership;
- active Organization;
- Organization roles.

PostgreSQL contains Store assignment data.

When implementing Store-scoped features, test at minimum:

- Organization admin accessing any Store in own Organization;
- Organization member accessing an assigned Store;
- Organization member denied from an unassigned Store in the same Organization;
- user denied from a Store in another Organization;
- authenticated user with no active Organization denied from tenant/Store data.

Do not simulate authorization only in the UI.

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

It introduces:

- organizations;
- stores;
- Store membership/assignment foundation;
- tenant/Store RLS foundation.

## Initial write posture

The initial tenant-core migration should not expose generic authenticated write access for tenant-core objects.

Provisioning and team-access mutations will come later through trusted server-side features.

Store draft/setup mutations use a narrow server-only domain service and
repository. Normal Store/Organization reads remain Clerk-JWT/RLS-bound, while
the existing privileged Supabase client is created only for explicitly scoped
draft creation, name/slug updates, and `draft → ready`. The boundary does not
activate Stores or resolve billing entitlement. First-Store trial activation uses a
separate normal Clerk-JWT Supabase client plus the narrow transactional RPC and never
uses the privileged application client.

This avoids allowing a browser/Data API caller to bypass:

- onboarding;
- subscription/Store-capacity rules;
- team-management rules.

### Store setup development

The current Store setup modules are:

```text
lib/stores/store-setup.ts
lib/stores/store-setup.internal.ts
lib/stores/store-setup.rules.ts
lib/stores/store-setup.repository.ts
```

Use only the public server-only facade from dashboard/server boundaries. Do not
import `lib/supabase/admin.ts` or `store-setup.repository.ts` from `app/` or
`components/`.

The shared rules normalize Store names/slugs, enforce the central reserved-slug
set, and validate readiness. Draft/ready Store setup requires neither billing
entitlement nor trial state. Validate this slice with:

```bash
yarn test:store-provisioning-setup
yarn supabase test db
```

## Team-management development

Future DeliPlus team UX should integrate Clerk Organization membership and PostgreSQL Store assignments behind one application flow.

Do not require the merchant to understand internal provider boundaries.

A future team-management implementation may need to coordinate:

```text
Clerk invite/member lifecycle
+
DeliPlus store_memberships
```

Its pending-invite behavior, rollback/error handling and authorization require a dedicated specification.

## Billing development

The Organization is the SaaS billing boundary.

Store limits are plan entitlements.

Current database foundation:

- `billing_trial_grants` stores local trial history;
- `billing_customers` stores canonical Customer claims/identity;
- `billing_subscriptions` stores the current paid projection only;
- `stripe_webhook_events` stores minimum Event idempotency metadata;
- all four tables have RLS enabled and no direct `anon`/`authenticated` grants or policies.

Current product rules:

- `essential`: one Store;
- `multi_2`: two Stores;
- `multi_3`: three Stores;
- four or more Stores: sales-assisted;
- initial trial: 15 days on Essential, local/PostgreSQL, no card.

The Stripe Node SDK, server-only client/configuration, approved plan registry, Price mapping convention, trusted origin resolver, verified webhook route, paid-subscription reducer, and atomic Event/projection RPC are implemented. Imports, builds, unit tests, duplicate short-circuits, and unsupported Events perform no Stripe API calls. Supported webhook processing retrieves the current Subscription from Stripe before starting the short database transaction.

The webhook supports:

```text
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.paid
invoice.payment_failed
```

Checkout and Invoice Events only trigger current-Subscription reconciliation. The Subscription snapshot remains authoritative for paid projection status. Async Checkout Events are not implemented because the approved MVP configuration is card-based; if delayed payment methods are enabled later, add and test `checkout.session.async_payment_succeeded` and `checkout.session.async_payment_failed` before relying on them.

The current slices implement first-Store initial-trial activation, but still do not implement generic paid/manual-entitlement activation, Checkout creation, Customer creation, Portal, Products, Prices, or Store-capacity enforcement.

### Store trial activation development

The server-only Store trial activation modules are:

```text
lib/stores/activate-first-store-with-initial-trial.ts
lib/stores/activate-first-store-with-initial-trial.internal.ts
```

The public operation accepts only `storeId`, uses `await auth()`, requires the active
Organization's `org:admin`, and invokes
`activate_first_store_with_initial_trial(p_store_id)` through the normal Clerk-JWT
Supabase client. Do not import the admin client, Stripe, Store setup mutations, or a
browser-provided tenant/User/role into this path.

Focused validation requires:

```bash
yarn test:store-trial-activation
yarn test:store-trial-activation:concurrency
yarn supabase test db supabase/tests/database/store_trial_activation_test.sql
```

The concurrency harness uses independent `pg` sessions and only accepts a local
PostgreSQL host. It reads `SUPABASE_TEST_DB_URL` when explicitly supplied and otherwise
uses the standard local Supabase database endpoint. It never reads `.env.local` or
prints connection credentials. The local database must have all migrations applied.

### Organization entitlement resolution

Normal server requests resolve Organization entitlement through:

```text
await auth()
  → normal Clerk-JWT Supabase client
  → resolve_active_organization_entitlement_facts()
  → validated local trial + paid projection
  → plan registry maxStores
```

The RPC accepts no arguments and derives the tenant from the verified Clerk JWT. It is the only authenticated billing read surface; direct reads of billing tables remain denied. The application resolver is server-only, uses no admin Supabase client, performs no Store query, and makes no Stripe API request.

Focused validation:

```bash
yarn test:organization-entitlement
yarn supabase test db
```

### Local Stripe webhook workflow

Install the Stripe CLI outside the project by following the official Stripe CLI instructions, then authenticate:

```bash
stripe login
```

Start the application and the local Supabase stack, then forward only the implemented Event set:

```bash
stripe listen \
  --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.paid,invoice.payment_failed \
  --forward-to localhost:3000/api/stripe/webhook
```

Copy the CLI-provided local signing secret into the ignored local environment file:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

Do not copy that value into `.env.example` or repository documentation. The CLI secret is local and must not be reused for a hosted endpoint.

Real paid-projection reconciliation additionally requires a Test/Sandbox `STRIPE_SECRET_KEY`, the matching configured `STRIPE_PRICE_*`, and a controlled local `billing_customers` row that maps the Stripe Customer to a DeliPlus Organization. The future Checkout feature will establish that canonical Customer relation in normal product flows; do not create Customers or Products merely to satisfy unit tests for this foundation.

Database validation for this slice includes:

```bash
yarn supabase db reset
yarn supabase test db
yarn test:stripe-webhook-foundation
```

The pgTAP suite contains tenant-core and Billing Foundation regressions plus webhook and Store-trial RPC privilege, isolation, atomicity, retry, recovery-state, and concurrency-related invariant coverage. Real concurrency is proven separately by the multi-session Node harness rather than sequential pgTAP.

## Validation

Treat form input, URL parameters, webhook payloads and external API data as untrusted.

A validation library has not yet been selected in the current foundation. Do not assume one exists.

When a feature genuinely requires schema validation, select/introduce the solution through that feature's plan rather than embedding an undocumented new project convention.

## Tests

A project-wide application test stack is not defined yet.

Database security features should use the Supabase/PostgreSQL testing approach approved by the relevant feature plan.

For tenant/Store security, include negative cross-tenant and same-tenant/unassigned-Store cases.

Regardless of test framework, `lint`, `typecheck` and production `build` remain baseline checks.

## Documentation workflow

For a substantial feature:

1. create/update its spec under `docs/features/`;
2. agree on significant data/architecture changes;
3. implement;
4. update current-state documentation;
5. add an ADR if the decision is durable and non-obvious.
