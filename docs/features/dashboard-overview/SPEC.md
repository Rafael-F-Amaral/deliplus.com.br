# Dashboard Overview read model

## Scope

Provide one server-only, zero-argument `getDashboardOverview()` operation for
dashboard frontend work. Compose existing Organization/onboarding and entitlement
APIs; preserve Clerk identity, Store RLS, billing rules and all mutation boundaries.
The public contract and read-boundary audit are documented in
`docs/FRONTEND_INTEGRATION.md` under Dashboard Overview.

## Implementation plan

1. Reuse `resolveOnboardingState()` for authenticated active-Organization resolution.
2. Add a narrow Store summary API because existing setup listing requires admin.
   Use exact JWT/RLS counts scoped by the resolved Organization; expose accessible
   total and active counts for both admins and members.
3. Compose that API with unchanged `resolveOrganizationEntitlement()`. Preserve
   explicit auth/provisioning outcomes and sanitize unexpected failures.
4. Add focused composition tests and run existing domain and tenant-isolation
   regressions, lint, typecheck, build and diff checks.

## Decisions and limits

- Organization exposes only its existing internal UUID.
- Entitlement is the existing domain union, including trial `validUntil` and
  paid plan capacity. No duplicated capacity field, Stripe IDs or statuses.
- Current manual overrides resolve as trial; no separate source is invented.
- Counts mean accessible Stores, never hidden Organization totals for members.
- Exact counts avoid listing pagination truncation; separate reads are not an
  atomic authorization snapshot and cannot authorize activation.
- No entitlement/zero Stores and paid entitlement/zero Stores are valid.
- No trial eligibility is inferred from lack of entitlement.
- No migration, policy, environment variable, dependency or dashboard layout change.

## Verification

`yarn test:dashboard-overview` covers preconditions, actual entitlement composition,
paid plans, override representation, lifecycle counts, member-visible summaries,
ignored browser tenant arguments, pagination-independent counts and safe failures.
Existing database regressions verify actual RLS, including unassigned same-tenant
Stores and cross-tenant isolation; in-memory fixtures do not claim to prove RLS.

### Verified on 2026-09-10

Base: clean `main`, matching freshly fetched `origin/main` at `949600f`.
Working branch: `feature/dashboard-overview`.

- Focused overview: 24/24 Node tests.
- Existing Node regressions: 416/416 across 15 scripts, including onboarding,
  billing UI/Checkout, entitlement, Store setup/trial/lifecycle, tenant provisioning,
  local provisioning integration and all three concurrency scripts.
- Existing database regressions: 640/640 pgTAP assertions across nine files.
- `yarn lint`, `yarn typecheck`, `yarn build`, and `git diff --check`: passed.

The sandbox initially prevented local executable/CLI metadata access; affected
checks passed after execution with the full local environment. No database reset,
migration, remote Stripe call, commit, push, merge or rebase was performed.
There is no live dashboard UI verification because the existing placeholder page
was intentionally not changed; composition is exercised by focused domain tests.
