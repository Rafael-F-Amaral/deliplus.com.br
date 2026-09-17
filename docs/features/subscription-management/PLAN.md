# Deli Plus — Subscription Management Implementation Plan

**Status:** Implemented locally; additive migration correction ready for staging review

## 1. Keep, simplify, remove

### Keep

- canonical current Subscription projection and Organization Entitlement;
- four-field pending Schedule projection;
- Schedule reducer and lifecycle Events;
- two-phase downgrade creation/configuration and Schedule release;
- one durable, recoverable custom mutation per Organization;
- authenticated provider-ID-free Billing read and capacity enforcement.

### Simplify

- journal operations to `schedule_downgrade` and
  `cancel_scheduled_downgrade`;
- management domain into a Portal upgrade facade plus custom downgrade facade;
- UI into direction-specific Server Actions;
- webhook allowlist to acquisition, canonical Subscription/Invoice, and Schedule
  lifecycle Events.

### Remove

- custom `subscriptions.update()` upgrade mutation;
- `pending_if_incomplete`, custom proration and upgrade idempotency/recovery;
- upgrade-specific journal states, ending RPC, and payment-pending UI outcomes;
- pending-update webhook Events and custom-upgrade mutation tests.

## 2. Files and boundaries

```text
app/dashboard/billing/actions.ts
  -> createSubscriptionUpgradePortalSession(planCode)
  -> scheduleOrganizationPlanDowngrade(planCode)
  -> cancelScheduledOrganizationPlanChange()

lib/billing/subscription-upgrade-portal*.ts
  auth/tenant/direction/policy
  -> lib/stripe/subscription-upgrade-portal*.ts

lib/billing/subscription-management*.ts
  downgrade journal/recovery/CAS
  -> lib/stripe/subscription-management*.ts

Stripe webhooks
  -> canonical local Billing projection
  -> Organization Entitlement
```

## 3. Database work

The final audit invalidated the earlier unpublished-migration premise: remote history
already contains `20260912180000`. Its exact original SQL was recovered through
`supabase migration fetch` and restored byte-for-byte. Do not rewrite or repair it.

Apply the conversion only through the new forward migration
`20260916180000_hybrid_subscription_management.sql`. It retains the four pending
Schedule columns and paid subscription projection, deterministically deletes only
obsolete `upgrade` attempt-journal rows, constrains operations/directions to the two
custom downgrade paths, replaces claim/projection RPC definitions, removes
`end_billing_subscription_change`, and preserves revoked direct journal privileges.
Regenerate `lib/supabase/database.types.ts` after a local reset.

## 4. Race correction

After a final CAS returns stale:

1. re-read the Organization's attempt and local canonical projection;
2. require the same attempt to be ended;
3. for schedule creation, require unchanged current plan, exact Schedule ID, pending
   Price/PlanCode, and effective date;
4. for cancellation, require unchanged current plan and all pending fields cleared;
5. return success only on complete convergence; otherwise fail closed.

## 5. Portal configuration gate

Add the server-only `STRIPE_BILLING_PORTAL_CONFIGURATION_ID`. Validate the retrieved
configuration, current Subscription/Item, target Price, recurrence, currency,
quantity, mode, and explicit compatible tax behavior before creating an exact deep
link. Do not create or mutate the remote configuration in implementation.

## 6. Tests

- Portal: three upgrades, exact Session parameters, auth, trial/same/downgrade,
  cross-tenant, Schedule conflict, config and tax gate.
- Downgrade: three directions, phase shape, release, response/webhook loss recovery,
  duplicate retry, two-tab conflict, and webhook-ended stale race.
- Authority: Portal create/return leave local truth unchanged; only webhook projection
  changes plan/capacity.
- Regression: Billing UI, Checkout, Billing success, webhook, entitlement, dashboard,
  Store capacity, and full pgTAP.

## 7. Verification and handoff

Run local reset, regenerate types, pgTAP, focused/regression suites, database lint,
ESLint, TypeScript, production build, `git diff --check`, migration list, and remote
push dry-run. Do not execute a remote push. Hand off the explicit Price tax behavior
and dedicated Portal configuration as manual Sandbox prerequisites for E2E.
