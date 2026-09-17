# Deli Plus — Subscription Management

**Status:** Approved hybrid architecture; implementation and additive migration correction ready for staging review
**Scope:** paid-plan upgrades, scheduled downgrades, and cancellation of a scheduled downgrade

## 1. Architecture

Subscription management deliberately uses two Stripe write paths:

```text
ACQUISITION
Deli Plus -> Stripe Checkout -> webhook -> local Billing projection -> entitlement

UPGRADE
Deli Plus pricing card -> Customer Portal subscription_update_confirm
-> Stripe payment/proration/SCA -> webhook -> local Billing projection -> entitlement

DOWNGRADE
Deli Plus -> canonical two-phase Subscription Schedule
-> webhook -> pending local projection -> renewal -> lower entitlement

READ
verified Clerk tenant -> Supabase Billing projection -> Organization Entitlement
```

The Portal owns the financially interactive upgrade experience. Deli Plus owns
end-of-period downgrades because the three monthly tiers use separate Products and
the Portal cannot cleanly express the approved downgrade policy for that catalog.
The catalog must not be migrated to one Product merely to make Portal downgrades
possible.

Deployment note: the 2026-09-16 audit confirmed version `20260912180000` applied on
the linked environment. Its exact original SQL was recovered from the remote migration
history and restored locally. The new forward-only
`20260916180000_hybrid_subscription_management.sql` converts that actual custom
schema to the approved hybrid shape; the historical migration must not be rewritten
or repaired.

## 2. Authority and tenancy

Every mutation reauthenticates the Clerk user, derives the active Organization,
requires `org:admin`, maps that tenant to its internal Organization, and then loads
the canonical local Customer/Subscription projection. The browser may submit only
one `PlanCode`. Customer, Subscription, Item, Schedule, Price, amount, period and
tenant identifiers supplied by the browser are never authority.

The supported plan order comes from stable capacity semantics:

```text
essential (1 Store) < multi_2 (2 Stores) < multi_3 (3 Stores)
```

Direction is never derived from BRL amounts.

## 3. Upgrade boundary

`createSubscriptionUpgradePortalSession(targetPlanCode)` accepts only:

```text
essential -> multi_2
essential -> multi_3
multi_2   -> multi_3
```

It rejects unauthenticated users, absent active Organizations, members, trials,
same-plan requests, lower targets, non-manageable Subscriptions, a projected
Schedule, provider/local mismatch, multiple or non-unit Items, and untrusted Prices.

The server creates an exact Customer Portal deep link:

```text
type = subscription_update_confirm
customer = canonical Customer
subscription = canonical Subscription
items[0].id = canonical existing Subscription Item
items[0].price = trusted target Price
items[0].quantity = 1
after_completion = trusted /dashboard/billing return URL
```

Deli Plus does not call `subscriptions.update()` for upgrades, calculate proration,
or orchestrate `pending_if_incomplete`. Stripe owns invoice preview, proration,
payment, failures, and 3DS/SCA. Creating a Portal Session changes neither the local
projection nor entitlement.

## 4. Dedicated Portal configuration

Upgrade sessions require `STRIPE_BILLING_PORTAL_CONFIGURATION_ID`. The referenced
configuration must be active, mode-compatible, and restricted to the reviewed
upgrade surface:

- subscription update enabled;
- `billing_cycle_anchor = unchanged`;
- `proration_behavior = always_invoice`;
- only `price` is an allowed update;
- only the approved higher target Prices are configured;
- adjustable quantity disabled;
- scheduled-at-period-end switching disabled;
- subscription cancellation, customer update, invoice history, and Portal login
  disabled;
- payment-method update enabled only because Stripe requires it whenever
  subscription update is enabled. Deli Plus exposes no generic Portal or
  `payment_method_update` flow.

The adapter retrieves and validates this configuration before creating a Session.
No generic Portal entry point is exposed. A configuration mismatch fails closed.

All current and target Prices must use the same explicit `tax_behavior`. The current
Sandbox Prices remain `unspecified`, so real Portal E2E is blocked until the owner
manually approves and applies an explicit value. Automatic Tax and Stripe Tax remain
out of scope.

## 5. Portal return

The trusted return includes presentation-only markers:

```text
/dashboard/billing?portalReturn=1&targetPlan=<PlanCode>
```

They never prove payment or grant entitlement. Billing re-reads the local projection
and refreshes about every two seconds for at most six attempts. It reports success
only when the projected current plan equals the target; otherwise it leaves a safe
"updating" message and relies on webhook reconciliation.

## 6. Scheduled downgrade

`scheduleOrganizationPlanDowngrade(targetPlanCode)` accepts only:

```text
multi_3 -> multi_2
multi_3 -> essential
multi_2 -> essential
```

The provider adapter creates or recovers one Schedule from the canonical
Subscription, persists its identity before phase mutation, and configures:

1. current Price/quantity through the canonical current period end;
2. lower target Price/quantity from that boundary;
3. `end_behavior = release`.

The current plan and capacity remain authoritative until Stripe makes the later
phase effective and a webhook projects it. Pending projection requires all four
facts together: Schedule ID, target Price, target PlanCode, and effective date.

## 7. Cancel scheduled downgrade

`cancelScheduledOrganizationPlanChange()` loads the projected canonical Schedule
server-side and calls only `subscriptionSchedules.release()`. It never cancels the
Subscription and accepts no browser Schedule ID. A provider `already_released`
result synchronously repairs a missed cancellation webhook through the same trusted
projection boundary.

## 8. Durable journal and recovery

`billing_subscription_change_attempts` exists only for custom downgrade work:

```text
schedule_downgrade
cancel_scheduled_downgrade
```

It provides one open immutable intent per Organization, deterministic Stripe
idempotency keys, revision-based CAS, Schedule correlation, and recovery after a
provider success whose webhook or response was lost. Portal upgrades do not create
journal rows or require Portal Session persistence.

If a webhook ends an attempt before the owning request performs its final CAS, the
domain re-reads the attempt and canonical projection. It treats the stale result as
success only when the attempt is ended and every expected fact has converged. Any
mismatch remains `billing_recovery_required`.

## 9. Webhook projection

The final supported event set is:

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

All Events resolve and retrieve the current canonical Subscription snapshot before
projection. `customer.subscription.pending_update_applied` and
`customer.subscription.pending_update_expired` are not retained because Deli Plus no
longer performs pending-update upgrade mutations.

## 10. Entitlement and capacity

Only the local projection drives entitlement:

- before an upgrade webhook, capacity remains old;
- after the upgrade webhook, capacity increases;
- while a downgrade is scheduled, capacity remains old;
- after the effective downgrade webhook, capacity decreases;
- existing Stores remain intact, while new activation is blocked when over capacity.

No Billing action mutates Stores.

## 11. UI policy

Paid-plan cards route higher targets to Stripe-hosted upgrade confirmation and lower
targets to the Deli Plus Schedule action. A pending downgrade displays current plan,
target plan, effective date, and `Cancelar redução agendada`; all other plan changes
are disabled until it is canceled. Members can read Billing state but cannot submit.
Trial/no-paid Organizations continue to use Checkout acquisition.

## 12. Out of scope

- a generic `Gerenciar cobrança` Portal;
- subscription cancellation, invoices, payment-method or billing-detail self-service;
- Product/Price catalog migration;
- automatic tax configuration;
- annual plans, quantity changes, multiple Subscription Items, or Store mutation;
- automatic remote Stripe or production database changes.

## 13. Acceptance criteria

- All three upgrades create only an exact `subscription_update_confirm` Session.
- Portal creation/return cannot change entitlement without a verified webhook.
- All three downgrades retain the two-phase Schedule and recovery guarantees.
- Cancellation releases only the canonical Schedule.
- Two tabs converge on one durable downgrade attempt.
- Webhook-ended stale CAS races succeed only after exact projection convergence.
- The additive hybrid migration removes custom-upgrade operations and the ending RPC
  from the published custom foundation.
- Local reset, generated types, pgTAP, focused tests, lint, typecheck, build, and
  migration dry-run are reported before E2E handoff.
