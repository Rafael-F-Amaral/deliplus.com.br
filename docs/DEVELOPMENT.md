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
yarn test:store-provisioning-setup:integration
yarn test:store-trial-activation
yarn test:store-trial-activation:concurrency
yarn test:store-entitlement-activation
yarn test:store-entitlement-activation:concurrency
yarn test:store-activation-coordinator
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
STRIPE_CHECKOUT_PAYMENT_METHOD_CONFIGURATION
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

Each approved `PlanCode` maps to a different environment-specific Stripe Price ID. A Test/Sandbox Price ID must never be reused as a Live Price ID. Checkout validates the mapping round trip and retrieves the Price during the explicit billing action to check identity, active state, mode, BRL, fixed per-unit licensed pricing and monthly recurrence (`month`, count 1). Deployment review still verifies the approved commercial amount on each Price.

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
uses the privileged application client. Generic entitlement activation and
deactivation follow that same normal-client/RPC boundary.

This avoids allowing a browser/Data API caller to bypass:

- onboarding;
- subscription/Store-capacity rules;
- team-management rules.

### Tenant provisioning development

`ensureActiveOrganization()` authenticates with Clerk, requires the active
Organization's `org:admin`, and delegates persistence to the service-role-only
`ensure_organization_projection(text)` RPC. The admin client has no direct privileges
on `public.organizations`. Unit tests inject the persistence dependency to verify auth,
domain outcomes, normalization, and safe diagnostics. The integration test uses the
real local Secret API Key, Data API, RPC, grants, and PostgreSQL state without calling
Clerk or Stripe or printing credentials.

Validate this boundary with:

```bash
yarn test:tenant-provisioning
yarn test:tenant-provisioning:integration
yarn supabase test db supabase/tests/database/tenant_provisioning_test.sql
```

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
entitlement nor trial state. Trusted writes use the service-role-only
`create_store_draft`, `update_store_setup`, and `mark_store_ready` RPCs. The Secret API
Key has no direct table privileges on `public.stores`. Validate this slice with:

```bash
yarn test:store-provisioning-setup
yarn test:store-provisioning-setup:integration
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
- `billing_checkout_attempts` stores durable acquisition reservations and frozen replay parameters;
- all five tables have RLS enabled and no direct `anon`/`authenticated` grants or policies.

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

The current slices implement first-Store initial-trial activation, generic entitlement-based Store activation/deactivation, atomic active-Store capacity enforcement, the server-only Customer/Checkout acquisition backend, and the billing acquisition UI/Server Action. Portal and real Product/Price configuration remain separate work.

### Stripe Checkout development

Use only `createSubscriptionCheckoutSession(planCode)` from the public billing facade.
It accepts no tenant/provider/money/URL authority. Its internal repository is the only
Checkout module importing the admin Supabase client. The Stripe adapter validates
provider contracts and uses bounded retries (two retries, ten-second request timeout).
Tests inject exact SDK-method mocks; no real Stripe resources are created.

MVP catalog: Essencial R$ 99,90/month, Duo R$ 189,90/month, Trio R$ 279,90/month, BRL.
The interval is fixed server-side, not selected by the browser or new interval env vars.
Annual plans remain future scope. Configure one Product/Price per approved plan and
environment only under separate authorization. Keep amounts outside authorization logic.

Runtime requires the dedicated `STRIPE_CHECKOUT_PAYMENT_METHOD_CONFIGURATION`, active
in the correct mode and limited to card/card wallets. No fallback to the account default,
Link, Pix, boleto, delayed methods, Adaptive Pricing, promotion codes, Stripe trial or
automatic tax. Prefer a restricted key with Customer create/read, Price read,
Subscription list/read, Payment Method Configuration read and Checkout Session
create/read permissions; validate exact permissions before real rollout.

Validation:

```bash
yarn test:billing-checkout-ui
yarn test:stripe-checkout
yarn test:stripe-checkout:concurrency
yarn supabase test db
yarn supabase db lint --local
yarn lint
yarn typecheck
yarn build
```

The concurrency harness uses independent local PostgreSQL sessions, observed lock
barriers and an idempotent Stripe fake. It never reads `.env.local` or uses hosted
credentials. Apply the pending migration locally; a destructive reset requires fresh
explicit permission and is not assumed from an earlier feature.

Customer creation retains one claim/key with a conservative 23-hour cutoff and a
two-minute request-budget margin. Attempts freeze one-hour expiration; unknown-ID POST
replay stops when fewer than 32 minutes remain. Unknown old operations stay reserved
for recovery, not automatic new keys. Known Sessions are retrieved and checked against
all paginated Customer subscriptions and local projection before safe closure/reuse.
No current operator recovery UI exists. Do not manually rotate keys to bypass uncertainty.

The acquisition page is `/dashboard/billing`; it submits only `planCode` to a thin
Server Action and redirects server-side for `checkout_ready`. The success and cancel
return paths are `/dashboard/billing/success` and `/dashboard/billing`, without
`session_id`. The success page reads the normal local entitlement projection and only
recognizes `source: "paid_subscription"` as confirmed; it neither calls Stripe nor
uses the return navigation as payment proof. A trial remains visibly distinct from a
paid subscription, and a pending projection can be refreshed manually without polling.
The first real Stripe Sandbox E2E has passed; see the sanitized record below. Stripe
Tax remains disabled pending separate fiscal review.

#### First real Sandbox E2E — passed

Recorded on 2026-09-10 from the project owner's completed manual verification:
a new Clerk user created an Organization, explicitly used `Configurar organização`
to create the internal projection, selected a plan on Billing, and successfully paid
by card in Stripe-hosted Sandbox Checkout. Webhooks forwarded to localhost reconciled
the subscription projection; the local Organization Entitlement Resolver recognized
`paid_subscription`, and `/dashboard/billing/success` displayed `Assinatura confirmada`.
The listener reported HTTP 200 for `invoice.paid`, `checkout.session.completed`, and
`customer.subscription.created`. No provider identifiers or credentials are retained
in this record.

The earlier missing webhook delivery was caused by Stripe CLI authentication against
a different Sandbox/account than the application's Stripe API key, not an application
defect. Before repeating E2E, verify that the CLI and application use the same
Sandbox/account and that the local signing secret belongs to the running listener.

The automatic onboarding coordinator now lives at `/onboarding`. Clerk sign-up forces
that destination and sign-in uses it as a fallback; Organization create/select returns
there as well. The Server Component resolves state without mutation. Only the small
client coordinator auto-submits the provisioning Server Action, once per mount, and the
Action revalidates through `ensureActiveOrganization()` before redirecting back. Store
presence is read through `listStoresForSetup()`; no direct table access was added.

Run its focused suite with:

```bash
yarn test:onboarding-coordinator
```

For manual E2E, verify new sign-up, Organization creation/selection, automatic tenant
provisioning, refresh/retry idempotency, the member waiting state, zero-Store navigation
to `/dashboard/stores/new`, and existing-Store navigation to `/dashboard`. Reaching the
first-Store route must not start a trial or mutate Store state.

#### Automatic onboarding manual E2E — passed

The project owner confirmed a new signup reached `/onboarding` with an active Clerk
Organization, briefly displayed automatic preparation, provisioned the internal
Organization without an explicit provisioning click, and reached
`/dashboard/stores/new` as an admin with zero Stores. Preparation may be transient when
provisioning completes quickly. The subsequent dashboard -> Billing -> Stripe Checkout
-> confirmed paid subscription flow also passed. This record confirms that happy path;
it does not claim manual coverage of member, retry, or existing-Store scenarios.

The temporary `Configurar organização` control and its Billing Action/form/feedback
have been removed. Unprovisioned Billing requests now redirect read-only to `/onboarding`
for admins and members alike; only the onboarding Action can request tenant provisioning.

Early paid subscription remains supported before the first Store exists or activates.
The Store activation coordinator now tries `activateStoreWithinEntitlement()` first, so
a paid Organization publishes without creating a local trial. Only `not_entitled` may
fall through to `activateFirstStoreWithInitialTrial()`. The frontend never selects the
activation path.

Existing paid subscriptions continue blocking another acquisition; upgrade/downgrade
and Customer Portal are separate features. The success page now coordinates bounded
local confirmation and automatic dashboard navigation. Return URLs never establish
entitlement. Landing-page work remains separate.

On 2026-09-10, `yarn supabase migration list` confirmed
`20260904120000_tenant_provisioning_trusted_rpc.sql` in the linked Staging database.
`yarn supabase db push --dry-run` reported no pending migrations. No remote push was
performed during final verification.

An additional `yarn supabase db diff --linked --schema public,private` found no
differences in feature/domain objects. It did report differences outside this feature's
migration: the hosted `public.rls_auto_enable()` event-trigger helper and default
sequence privileges for `anon`, `authenticated`, and `service_role`. Migration history
being up to date is not a claim of a completely empty schema diff. These differences
were not applied or normalized during finalization.

Final local regression passed: 401 Node tests across 14 scripts and 640 pgTAP tests
across nine files. Local database lint, application lint, typecheck, production build,
and the normalized comparison of freshly generated public database types all passed.

Database tests must scope fixture queries and mutations to their own Organization or
attempt, including when local E2E data already exists. Checkout pgTAP formerly assumed
an otherwise empty attempts table; fixture predicates now remove that assumption
without deleting existing data or requiring a local reset.

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

### Store entitlement activation development

The generic server-only Store lifecycle modules are:

```text
lib/stores/activate-store-within-entitlement.ts
lib/stores/activate-store-within-entitlement.internal.ts
lib/stores/deactivate-store.ts
lib/stores/deactivate-store.internal.ts
```

Both public operations accept only `storeId`, use `await auth()`, require the active
Organization's `org:admin`, and call their narrow RPC through the normal Clerk-JWT
Supabase client. Do not pass Organization, User, role, plan, capacity, lifecycle, or
entitlement authority from the browser.

The migration keeps a closed private SQL capacity mapping for transactional enforcement
and leaves the TypeScript registry authoritative for application/read results. The
focused Node suite compares the real registries through a local PostgreSQL connection.
The concurrency suite uses independent sessions and deterministic advisory-lock barriers
for the last slot, same Store, activation/deactivation, initial trial, paid projection,
and different-Organization cases.

Validate this slice with:

```bash
yarn test:store-entitlement-activation
yarn test:store-entitlement-activation:concurrency
yarn supabase test db supabase/tests/database/store_entitlement_activation_test.sql
```

Start/apply the local Supabase migrations before either focused script because the Node
suite performs real SQL/TypeScript plan parity and the concurrency suite calls the RPCs.
Neither script reads `.env.local` or prints credentials.

### First Store activation coordinator development

The public UI activation boundary is:

```text
lib/stores/activate-store-for-current-organization.ts
```

`activateStoreForCurrentOrganization(storeId)` composes only the two existing Store
activation operations. It performs no direct Supabase, Stripe, billing-table, trial, or
capacity access. The ordering is generic entitlement activation first, initial trial
only after `not_entitled`, then one generic retry after `trial_not_eligible` to cover a
concurrent entitlement change.

The functional routes are:

```text
/dashboard/stores/new
/dashboard/stores/[storeId]/setup
```

Their Server Actions accept only Store business fields and a Store selector. The default
first-Store submission composes `createDraftStore()`, `markStoreReady()`, and
`activateStoreForCurrentOrganization()` while preserving each explicit domain mutation.
After a durable creation, retry state resumes from the stored Store selector instead of
creating a duplicate. The setup route retains separate save, readiness, and publish
actions for editing/recovery; page rendering performs no mutation. Validate the
coordinator and UI adapters with:

```bash
yarn test:store-activation-coordinator
```

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

Start the application and the local Supabase stack, then forward only the implemented
Event set. In PowerShell, quote the complete events argument:

```powershell
stripe listen --events "checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.paid,invoice.payment_failed" --forward-to "http://localhost:3000/api/stripe/webhook"
```

Copy the CLI-provided local signing secret into the ignored local environment file:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

Do not copy that value into `.env.example` or repository documentation. The CLI secret is local and must not be reused for a hosted endpoint.

Real paid-projection reconciliation additionally requires a Test/Sandbox `STRIPE_SECRET_KEY`, the matching configured `STRIPE_PRICE_*`, and a canonical ready `billing_customers` row. The Checkout backend establishes that relation before Session creation; do not create Customers or Products merely to satisfy mocked unit tests.

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

### Billing success automatic confirmation

Stripe return → transient local confirmation → paid entitlement → dashboard.
The Stripe return URL is presentation/navigation only. Webhook-projected local
entitlement remains authoritative. The initial server read redirects immediately
when paid; otherwise the resolved pending page refreshes every 2 seconds, bounded
to 12 seconds, then navigates to the dashboard with a pending presentation marker.
Trial remains valid during the wait. No new migration, environment variable, Stripe
request, database write, or acquisition change is involved.

Run `yarn test:billing-success-ui` plus Billing Checkout UI, Stripe Checkout,
Stripe Webhook, Organization Entitlement, Dashboard Overview, Store Trial and
Onboarding regressions. Fake timers cover the actual polling effect and cleanup.
SQL is unchanged and no database reset is needed. The existing local pgTAP suite
was also run under the Billing baseline policy: 675 assertions across nine files passed.

Manual Sandbox E2E: start the app and existing Stripe webhook listener, sign in to a
trial Organization, choose **Assinar agora**, select a plan, and complete Sandbox
Checkout manually. Expect either immediate dashboard navigation or a brief
**Confirmando sua assinatura...** screen, followed by the paid plan and
**Assinatura ativada com sucesso.** The success Alert disappears after six seconds
and its billing markers are removed. Confirm Store-publication feedback still works.
For delayed projection, pause the local listener before payment and wait 12 seconds:
the dashboard should show a pending notice and the real trial/no-paid state. Restore
webhook delivery and replay the missed Sandbox event if necessary; refresh the
dashboard to see the paid plan and success feedback. No payment failure is inferred
from timeout. No automated purchases are part of these checks.
