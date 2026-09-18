# Deli Plus Technical Handoff

## Project state

The first foundation phase is complete. The repository currently establishes:

- Clerk authentication, Organizations, active-Organization context, and roles;
- Clerk JWT integration with Supabase and tenant/Store RLS;
- trusted internal Organization provisioning and onboarding resolution;
- Store setup and `draft <-> ready -> active <-> inactive` lifecycle;
- 15-day local Essential trial and atomic Store-capacity enforcement;
- paid Organization entitlement from a trusted Stripe webhook projection;
- Stripe Checkout acquisition and Billing return confirmation;
- hybrid plan management: hosted Portal upgrades and custom scheduled downgrades;
- Dashboard Overview and authenticated links to accessible public Stores;
- the anonymous `/{storeSlug}` read boundary for active Stores.

This is a foundation, not a finished merchant product. Team management, catalog,
expanded storefront, orders, and production infrastructure remain product work.

## Where to start

Read in this order:

1. `docs/HANDOFF.md` — state, ownership, roadmap, and readiness gaps;
2. `docs/ARCHITECTURE.md` — authoritative high-level architecture;
3. `docs/DATABASE.md` and `docs/AUTHORIZATION.md` — persisted model and security;
4. `docs/FRONTEND_INTEGRATION.md` — application/domain boundaries;
5. `docs/DEVELOPMENT.md` — local environment, migrations, and verification;
6. the relevant `docs/features/**/SPEC.md`, PLAN, tests, and migrations for the
   feature being changed.

Applied migrations are immutable history and the detailed SQL source of truth.

## Authority and ownership

Rafael has full technical ownership of Deli Plus. He may change any subsystem,
including frontend, backend, Next.js architecture, Supabase schema, migrations,
RLS, functions/RPCs, Clerk, Stripe, Billing, Store access, Dashboard, Storefront,
catalog, products, orders, tests, and documentation.

No project rule requires Jesse to approve a "core", Billing, database, RLS, or
architecture change first. Jesse may collaborate on the Landing Page, product
direction, or any other area, but is not a technical approval dependency.

Current contracts are a starting point, not immutable law. Full ownership means:

```text
understand current invariants
-> design deliberate changes
-> preserve or explicitly redesign tenant/security properties
-> migrate safely
-> test
-> document the resulting architecture
```

## Current architecture

### Identity and tenancy

```text
Clerk User = person
Clerk Organization = business tenant and administrative/financial boundary
public.organizations = internal one-to-one projection of Clerk Organization
Organization -> N Stores
```

Clerk owns identity, Organization membership, active Organization, roles,
invitations, removal, and membership lifecycle. Supabase/PostgreSQL owns the
internal Organization, Stores, Store assignments, application data, Billing
projection, entitlement facts, and RLS.

Do not duplicate Clerk membership in a local `organization_members` table merely
to mirror it. Store-level access remains local because Store is a Deli Plus entity.

### Store model and access

Store is the operational/public establishment. Its public route is
`/{storeSlug}`. The lifecycle is:

```text
draft <-> ready -> active <-> inactive
```

`draft` and `ready` have `activated_at = null`; `active` and `inactive` retain a
non-null immutable first-activation timestamp. Billing expiration or a capacity
reduction does not rewrite Store lifecycle or automatically deactivate Stores.
Later protected operations must revalidate entitlement where required.

```text
org:admin -> every Store in the active Organization
member    -> only Stores explicitly assigned in store_memberships
```

Both paths require verified active-Organization ownership. Browser-supplied tenant,
Store, user, provider, and Billing identifiers are selectors at most, never authority.

### Trial and entitlement

The current trial is 15 days, card-free, full Essential entitlement, and capacity
for one active Store. It begins only when the first eligible ready Store is activated;
signup, Organization provisioning, draft creation, and ready state do not start it.
The database enforces historical initial-trial eligibility for both the Organization
and Clerk User. Paid entitlement has descriptive precedence over a valid trial.

The authority chain is:

```text
Stripe provider state
-> signed webhook and canonical Subscription retrieval
-> trusted Supabase Billing projection
-> OrganizationEntitlement
-> Store capacity and protected application behavior
```

Only eligible projected paid states (`active` or collection-active `past_due`) grant
paid entitlement. Query parameters, Checkout/Portal returns, and success markers are
presentation/navigation hints and never grant access.

## Billing contract

### Plans

| PlanCode | Name | Monthly display price | Active Store capacity |
| --- | --- | ---: | ---: |
| `essential` | Essencial | R$ 99,90 | 1 |
| `multi_2` | Duo | R$ 189,90 | 2 |
| `multi_3` | Trio | R$ 279,90 | 3 |

The current Sandbox Prices use `tax_behavior = inclusive`; displayed BRL values are
final prices. Stripe Tax and Automatic Tax are not enabled.

### Acquisition

```text
Deli Plus -> Stripe Checkout -> webhook -> Billing projection -> entitlement
```

The browser submits only an allowlisted PlanCode. The server derives Customer,
Price, mode, amount, recurrence, quantity, tenant, and trusted return URL.

### Upgrade

Allowed: Essential to Duo/Trio and Duo to Trio.

```text
Billing UI
-> exact Customer Portal subscription_update_confirm
-> hosted proration, payment, failure, and SCA/3DS handling
-> webhook
-> current Billing projection
-> entitlement
```

The dedicated Portal configuration exposes only Duo and Trio, allows only Price
updates, fixes quantity, keeps the billing-cycle anchor, uses `always_invoice`, and
disables cancellation, customer details, invoices, login, and scheduled switching.
Payment-method update is enabled only because Stripe requires it for subscription
updates. Deli Plus exposes no generic Portal or payment-method-management flow.

### Downgrade and cancellation

Allowed: Trio to Duo/Essential and Duo to Essential.

```text
Deli Plus -> canonical two-phase Subscription Schedule
-> current plan remains effective
-> lower plan starts at current_period_end
-> webhook -> pending local projection
```

Canceling a scheduled downgrade releases the canonical Schedule; the Subscription
remains active and the webhook clears pending facts.

`billing_subscriptions.plan_code` and `stripe_price_id` always represent the
effective current paid plan. A future downgrade is separate:

```text
stripe_subscription_schedule_id
pending_stripe_price_id
pending_plan_code
pending_effective_at
```

Pending facts never become current entitlement before provider effectiveness.

### Recovery and webhook contract

Portal upgrades have no custom attempt journal. The durable change journal supports
only `schedule_downgrade` and `cancel_scheduled_downgrade`, with stable idempotency,
revision/CAS guards, provider-object recovery, local/provider repair, and explicit
action/webhook race convergence.

Supported webhook Events are exactly:

```text
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.paid
invoice.payment_failed
subscription_schedule.updated
subscription_schedule.released
subscription_schedule.completed
subscription_schedule.canceled
subscription_schedule.aborted
```

Pending-update Events and the former custom-upgrade orchestration are historical,
not current runtime contracts.

## Member/team handoff

No full team-management UI exists yet. Members are not a Billing authority:

```text
org:admin
  -> Billing read and all Organization Billing mutations
  -> create upgrade Portal Session
  -> schedule downgrade
  -> cancel scheduled downgrade

member
  -> Billing read-only
  -> no upgrade/downgrade/cancellation mutation
```

Those guarantees remain server-side even if UI controls are hidden. A future Team /
Members area should use Clerk for invitations, pending invitations, member list,
Organization roles, removal, and membership lifecycle. Deli Plus should own Store
assignment and any genuinely application-specific Store role/permission added later.
Rafael owns the final UX and may redesign this model when product requirements justify it.

## Public Store and future catalog

The anonymous path is:

```text
/{storeSlug}
-> getPublicStoreBySlug()
-> anonymous Supabase client
-> get_public_store_by_slug(text)
```

It currently exposes only `name` and `slug` for an active Store. Draft, ready,
inactive, and nonexistent Stores share the same not-found behavior. Reads are dynamic,
uncached, and noindex; reserved application slugs are rejected by Store setup.

Rafael has full ownership of categories, products, variants, modifiers, options,
availability, pricing, images, inventory semantics, and shared-versus-Store-local
catalog decisions. Before adding schema, define Organization/Store ownership, foreign
keys, indexes, RLS/grants, public projection, and lifecycle/deletion behavior. No
approval from Jesse is required.

## Database and migration discipline

Rafael may create/alter tables, columns, indexes, functions, RPCs, grants, RLS, and
foreign keys, or refactor domain models. Use forward migrations:

```text
SPEC/design -> local migration -> db reset -> pgTAP -> db lint
-> regenerate database types -> application tests -> remote dry-run
-> Staging push -> verification
```

Never rewrite a migration already applied remotely. Subscription Management history is:

- `20260912180000_subscription_management.sql`: original custom management
  foundation, applied to Staging;
- `20260916180000_hybrid_subscription_management.sql`: corrective conversion to
  the final hybrid model, applied and verified on Staging.

The current management projection RPC is service-only `SECURITY DEFINER`; the older
acquisition projection remains `SECURITY INVOKER`. See `docs/DATABASE.md` for the
different grant contracts. Preserve security properties rather than blindly
preserving implementation: tenant isolation, server-derived identity, Store ownership,
RLS, safe `SECURITY DEFINER` boundaries, least-privilege grants, anonymous read shape,
service-role scope, and browser trust boundaries must always be addressed.

## Development and validation

Preferred workflow:

```text
main -> feature/* -> PR -> review / CI -> squash merge
SPEC -> PLAN -> IMPLEMENT -> VERIFY -> REVIEW
```

This is quality guidance, not an ownership restriction. For each change, select
proportionate validation from:

- unit/domain and UI tests;
- integration and concurrency tests;
- Stripe adapter and webhook tests;
- pgTAP and database lint for SQL/security changes;
- `yarn lint`, `yarn typecheck`, and `yarn build`;
- manual E2E when real provider behavior matters.

Do not repeat every historical Billing E2E for unrelated features. Use the scripts in
`package.json` and the relevant feature spec to choose regressions.

## Current roadmap

- Team/member management and Store-assignment UI;
- catalog, categories, products, and Store settings;
- expanded responsive Dashboard and operational workflows;
- expanded Storefront and customer ordering flow;
- orders, notifications, and useful merchant analytics;
- production readiness and observability.

## Production-readiness gaps

Repository evidence supports local Supabase development and a linked Staging project.
It does not establish a complete Vercel Preview-to-Staging binding or production stack.
Before go-live, verify or provision:

- Vercel Preview environment connected to the intended Supabase Staging project;
- Production Supabase, migrations, grants/RLS, backups, and recovery expectations;
- Production Clerk configuration and redirect/domain behavior;
- Stripe Live restricted key, Products/Prices, inclusive Price behavior, dedicated
  Checkout and Portal configurations, and the production webhook/signing secret;
- production `BILLING_RETURN_ORIGIN` and all hosted secret values;
- the explicit future decision on Stripe Tax/Automatic Tax by jurisdiction;
- monitoring/alerting for webhook and provider-recovery failures;
- CI status checks (no workflow is currently committed);
- optional Test Clock renewal/cycle-boundary QA for provider behavior.

Do not treat Test Clock QA as an architecture blocker. It is provider-level confidence
work for renewal boundaries, not a substitute for the existing automated suite.
