# Deli Plus — Store Entitlement Activation

**Path:** `docs/features/store-entitlement-activation/SPEC.md`<br>
**Status:** Approved<br>
**Scope:** Generic Store activation, reactivation, deactivation, and transactional Store-capacity enforcement<br>
**Last updated:** 2026-08-28

## 1. Purpose

This specification defines the trusted Store lifecycle boundary that consumes an
already valid Organization entitlement.

The feature has two complementary operations:

```text
activateStoreWithinEntitlement(storeId)
deactivateStore(storeId)
```

Activation answers:

```text
current valid Organization entitlement
  + eligible Store
  + available active-Store capacity
  -> Store active
```

Deactivation answers:

```text
active Store
  -> inactive Store
  -> one active-capacity slot released
```

Neither operation creates or changes billing entitlement. They consume only trusted
local PostgreSQL facts.

## 2. Final approved product decision

A currently valid initial trial is an allowed entitlement source for generic Store
activation and reactivation.

During a valid initial trial:

```text
planCode = essential
maxStores = 1
```

The Organization may:

- keep one Store active;
- deactivate its active Store;
- reactivate a previously activated Store;
- deactivate Store A and activate Store B;
- activate a different `ready` Store when no Store is currently consuming the
  Essential capacity.

The Organization may not:

- have more than one Store `active` under the Essential trial;
- create another initial grant;
- renew, restart, or extend the initial trial;
- change the grant's `starts_at` or `ends_at`;
- restore historical initial-trial eligibility;
- combine the trial capacity with another entitlement source.

Switching Stores does not restart or extend the 15-day period.

## 3. Historical initial-trial clarification

The rule:

```text
no Store previously activated
```

belongs exclusively to `activateFirstStoreWithInitialTrial(storeId)` at the moment
the initial trial is first granted.

After the initial trial exists, generic activation may create activation history on
multiple Stores:

```text
activated_at IS NOT NULL
```

That history does not consume current capacity. Generic capacity is based only on:

```text
status = 'active'
```

During an Essential initial trial, the enforced invariant is therefore:

```text
activeStoreCount <= 1
```

The specialized initial-trial RPC remains solely responsible for the first grant and
first activation. It must not become a generic activation RPC.

## 4. Existing foundations

The repository already provides:

- Clerk authentication, active Organization, membership, and Organization roles;
- a unique Clerk Organization to internal Deli Plus Organization mapping;
- Store lifecycle states `draft`, `ready`, `active`, and `inactive`;
- immutable first-activation history through `stores.activated_at`;
- Store setup operations that stop at `ready`;
- the atomic first-Store initial-trial activation boundary;
- local initial and manual-override grants;
- the current paid Stripe Subscription projection;
- a server-only Organization entitlement resolver;
- the TypeScript plan registry for `essential`, `multi_2`, and `multi_3`;
- an Organization advisory-lock convention shared by initial-trial and billing
  projection writers;
- a normal Clerk-JWT Supabase server client;
- default-deny direct billing-table access for Data API roles;
- no generic authenticated writes to Stores or billing tables.

This feature extends those foundations. It does not replace them or introduce a
parallel entitlement, lifecycle, or tenant model.

## 5. Approved scope

The implementation authorized by this SPEC includes:

- one server-only generic activation operation;
- one server-only deactivation operation;
- authentication, active-Organization, and Organization-admin preconditions;
- two narrow transactional PostgreSQL RPCs;
- private shared SQL entitlement helpers;
- one private SQL PlanCode-to-capacity helper;
- preservation of the existing public entitlement-facts contract;
- paid, manual-override, and initial-trial entitlement sources;
- active-Store capacity enforcement inside the activation transaction;
- Store reactivation with preserved `activated_at`;
- Store deactivation without an entitlement precondition;
- safe result unions and safe infrastructure errors;
- pgTAP, Node, parity, and real multi-session concurrency tests;
- generated database types and focused test scripts;
- directly required documentation updates after implementation.

## 6. Explicit non-goals

This feature must not implement:

- initial-trial creation, renewal, extension, revocation, or eligibility restoration;
- manual-override creation, revocation, or administration;
- paid Subscription creation, mutation, or cancellation;
- Stripe Customer creation;
- Stripe Checkout or Customer Portal;
- Stripe Products or Prices;
- a Stripe API or network request;
- Stripe webhook changes beyond regression compatibility;
- Stripe Tax or tax configuration;
- Store creation or setup mutation;
- Store name or slug changes;
- `draft -> ready` transitions;
- Store deletion;
- a capacity read model or `getStoreCapacity()`;
- dashboard UI, Server Actions, redirects, or onboarding coordination;
- public storefront or order-intake authorization;
- browser Supabase access;
- an admin/privileged Supabase application client;
- new plan codes, pricing, intervals, discounts, or feature gates;
- Store-specific roles or membership mutation;
- automatic Store deactivation on downgrade or entitlement loss;
- schema cardinality such as Organization-to-one-Store;
- persisted `maxStores` columns;
- new tables, Store columns, billing columns, or RLS policies;
- generic authenticated Store or billing writes;
- a new ADR.

## 7. Public operation contracts

The application operations are conceptually:

```ts
activateStoreWithinEntitlement(
  storeId: string
): Promise<StoreEntitlementActivationResult>

deactivateStore(storeId: string): Promise<StoreDeactivationResult>
```

Both operations must:

- import `server-only`;
- use `await auth()`;
- accept only a Store ID from the caller;
- use the existing Store UUID validation rule;
- call Supabase only through `createServerSupabaseClient()`;
- invoke one narrow RPC;
- expose no database/provider error details;
- keep all request authority local to the verified Clerk session/JWT.

## 8. Authentication and preconditions

Both application operations require, in order:

1. an authenticated Clerk User;
2. an active Clerk Organization;
3. the current User to have `org:admin` in that active Organization;
4. the Clerk Organization to map to an internal Deli Plus Organization.

The current project convention returns stable precondition outcomes rather than
turning them into infrastructure errors:

```ts
type StoreLifecycleMutationPreconditionResult =
  | { status: "unauthenticated" }
  | { status: "no_active_organization" }
  | { status: "organization_not_provisioned" }
  | { status: "not_admin" }
```

An Organization member is rejected by the application before the RPC call. The RPC
must independently require the verified database claim:

```text
private.clerk_organization_role() = 'admin'
```

Direct Data API calls that lack valid claims or the admin role must fail closed.

## 9. Tenant and caller authority

The browser may provide only:

```text
storeId
```

It must never provide or select:

- internal Organization ID;
- Clerk Organization ID;
- Clerk User ID;
- Organization role;
- `planCode`;
- `maxStores`;
- Store status;
- `activatedAt`;
- entitlement source or entitlement state;
- trial dates;
- Stripe Customer, Subscription, Product, or Price IDs.

The database derives tenant and role authority from trusted Clerk JWT claims and maps
the active Clerk Organization to `public.organizations.id`.

The target Store selector must always include both:

```text
store.id = p_store_id
store.organization_id = verified internal Organization UUID
```

A missing Store and a cross-tenant Store are externally indistinguishable:

```text
store_unavailable
```

## 10. Allowed entitlement sources

Generic activation accepts exactly three existing local entitlement sources.

### 10.1 Paid subscription

A paid subscription grants entitlement only when:

```text
status IN ('active', 'past_due')
AND collection_paused = false
```

`cancel_at_period_end = true` does not remove entitlement while the projected status
remains otherwise entitled.

The paid statuses `trialing`, `incomplete`, `incomplete_expired`, `unpaid`,
`canceled`, and `paused` do not grant paid entitlement.

### 10.2 Manual override

A manual override grants entitlement only when:

```text
grant_kind = 'manual_override'
revoked_at IS NULL
starts_at <= resolved_at
resolved_at < ends_at
plan_code is known
```

### 10.3 Initial trial

An initial trial grants entitlement only when:

```text
grant_kind = 'initial'
revoked_at IS NULL
starts_at <= resolved_at
resolved_at < ends_at
plan_code = 'essential'
```

The corresponding capacity is exactly one active Store.

## 11. Effective entitlement precedence

The effective entitlement is resolved as:

```text
valid paid subscription
  -> paid plan wins

else valid local grant(s)
  -> one agreed local plan

else
  -> not_entitled
```

Capacities are never added or stacked:

```text
paid + manual       != summed capacity
manual + initial    != summed capacity
initial + paid      != summed capacity
```

Example:

```text
paid multi_2 + valid initial essential
  -> effective plan multi_2
  -> maxStores = 2
  -> not 3
```

All facts must be validated before precedence is applied. Unknown or internally
inconsistent data is a resolution failure, not ordinary `not_entitled`.

## 12. Simultaneously valid local grants

All valid local grants for the Organization participate in one consistency check.

When they agree:

```text
initial essential
+ manual_override essential
  -> one effective essential entitlement
  -> maxStores = 1
```

When they conflict:

```text
initial essential
+ manual_override multi_2
  -> invariant/resolution failure
```

The implementation must not silently select the lower plan, higher plan, newest row,
longest grant, or a grant kind as an override. A future product policy may change
this, but this feature fails closed.

## 13. Capacity definition

Capacity is based only on current Store lifecycle state:

```sql
activeStoreCount =
  COUNT(*)
  FROM public.stores
  WHERE organization_id = current_organization_id
    AND status = 'active'
```

The activation comparison is:

```text
activeStoreCount < maxStores
  -> activation may proceed

activeStoreCount >= maxStores
  -> capacity_reached
```

The following states do not consume capacity:

```text
draft
ready
inactive
```

Historical activation count and `activated_at IS NOT NULL` are not generic capacity
measures. Those facts remain relevant only to historical initial-trial eligibility and
first-activation history.

## 14. Activation state matrix

| Target state         | Other conditions                 | Result              | Mutation                                      |
| -------------------- | -------------------------------- | ------------------- | --------------------------------------------- |
| `draft`              | any entitlement state            | `not_ready`         | none                                          |
| `ready`              | no effective entitlement         | `not_entitled`      | none                                          |
| `ready`              | entitled, count at/over capacity | `capacity_reached`  | none                                          |
| `ready`              | entitled, capacity available     | `activated`         | `ready -> active`; set first `activated_at`   |
| `inactive`           | no effective entitlement         | `not_entitled`      | none                                          |
| `inactive`           | entitled, count at/over capacity | `capacity_reached`  | none                                          |
| `inactive`           | entitled, capacity available     | `activated`         | `inactive -> active`; preserve `activated_at` |
| `active`             | any current entitlement/capacity | `already_active`    | none                                          |
| missing/cross-tenant | any                              | `store_unavailable` | none                                          |

An unexpected Store status/timestamp combination that violates lifecycle constraints
is an infrastructure/invariant error, not one of the domain outcomes.

## 15. Initial-trial switching examples

### 15.1 Store B cannot activate while Store A consumes the slot

```text
valid Essential initial trial
Store A = active
Store B = ready

activateStoreWithinEntitlement(Store B)
  -> capacity_reached
```

### 15.2 Deactivate A, then activate B

```text
valid Essential initial trial
Store A = active

deactivateStore(Store A)
  -> Store A = inactive
  -> deactivated

activateStoreWithinEntitlement(Store B)
  -> Store B = active
  -> Store B receives its first activated_at
  -> activated
```

The initial grant's `starts_at` and `ends_at` remain unchanged.

### 15.3 Reactivate A

```text
valid Essential initial trial
Store A = inactive

activateStoreWithinEntitlement(Store A)
  -> Store A = active
  -> original activated_at preserved
  -> activated
```

### 15.4 Trial expired

```text
expired initial trial
Store A = inactive

activateStoreWithinEntitlement(Store A)
  -> not_entitled
```

Deactivation remains available even without a current entitlement.

## 16. Deactivation semantics

`deactivateStore(storeId)` follows this state matrix:

| Target state         | Result              | Mutation                                      |
| -------------------- | ------------------- | --------------------------------------------- |
| `active`             | `deactivated`       | `active -> inactive`; preserve `activated_at` |
| `inactive`           | `already_inactive`  | none                                          |
| `draft`              | `not_active`        | none                                          |
| `ready`              | `not_active`        | none                                          |
| missing/cross-tenant | `store_unavailable` | none                                          |

Deactivation:

- requires an authenticated active-Organization admin;
- does not require current billing entitlement;
- does not read or mutate billing facts;
- uses the same Organization serialization lock as activation;
- preserves the original `activated_at`;
- does not return the Store to setup states.

Deactivation must remain available after trial expiration, canceled billing,
downgrade, collection pause, or other entitlement loss because it reduces operational
capacity.

## 17. No billing mutation

Neither operation may:

- insert, update, revoke, or delete `billing_trial_grants`;
- update `billing_subscriptions`;
- create or update `billing_customers`;
- mark Stripe webhook Events processed;
- change initial-trial eligibility;
- change grant dates;
- create an entitlement.

Activation reads local entitlement facts only. Deactivation requires no entitlement
read.

## 18. No Store setup mutation

This feature must not change:

- Store name;
- Store slug;
- setup validation;
- `draft -> ready` readiness;
- draft creation.

Generic activation accepts only `ready`, `inactive`, or idempotently `active` Stores.
A `draft` Store returns `not_ready`.

## 19. No Stripe request

The application operations and SQL transaction must not call or instantiate:

- `getStripe()`;
- Stripe Checkout;
- Stripe Customer or Subscription APIs;
- Customer Portal;
- any other Stripe network operation.

All paid facts come from the verified local PostgreSQL projection. Stripe Tax is
unchanged and out of scope. A future Checkout/tax feature must separately verify tax
requirements and active registrations before enabling `automatic_tax`.

## 20. Transactional activation model

One activation RPC invocation owns the entire decision and mutation transaction:

```text
derive and validate trusted Clerk claims
  -> resolve internal Organization
  -> acquire Organization advisory transaction lock
  -> lock/revalidate Organization row
  -> lock target Store row
  -> resolve current Store state/idempotency
  -> capture database time after lock waits
  -> resolve effective local entitlement
  -> derive maxStores in PostgreSQL
  -> count active Stores
  -> update eligible Store to active
  -> return normalized outcome
  -> commit
```

A non-transactional application sequence such as:

```text
read entitlement
  -> count Stores
  -> later activate Store
```

is forbidden because concurrent requests could exceed capacity.

No remote work, rendering, user input, or provider API call may occur while database
locks are held.

## 21. Organization lock convention and order

Both Store lifecycle RPCs must reuse exactly the existing Organization lock:

```sql
pg_advisory_xact_lock(
  hashtextextended(organization_id::text, 0)
)
```

They must not create a competing namespace for Organization capacity.

The generic activation lock order is:

1. derive Clerk User, active Clerk Organization, and role claims;
2. resolve the internal Organization UUID without caller-provided tenant authority;
3. acquire the existing Organization advisory transaction lock;
4. lock and revalidate the Organization row `FOR UPDATE`;
5. lock the tenant-scoped target Store row `FOR UPDATE`;
6. resolve safe Store idempotency/state outcomes;
7. capture the database resolution/activation time;
8. read entitlement facts;
9. derive capacity and count active Stores;
10. mutate the target Store if allowed;
11. return and commit.

Deactivation uses the same order through the target Store lock, then resolves the
current state and performs the lifecycle mutation. It does not read entitlement.

This order is compatible with:

- `activate_first_store_with_initial_trial`, which takes the Organization lock before
  its Clerk User, Store, and billing locks;
- `apply_stripe_subscription_projection`, which takes the same Organization lock
  before mutating the subscription projection.

Generic activation does not need the Clerk User advisory lock because it does not
consume User-level initial-trial eligibility.

Every future writer that can change effective Organization entitlement or active
Store count must adopt this same Organization serialization convention before
relevant row locks.

## 22. Database timestamp placement

The activation RPC must capture database time only after it has obtained the relevant
Organization and target Store locks.

This prevents a grant that expires during lock waiting from authorizing a later
activation.

One captured value, conceptually `resolved_at`, is used for:

- local-grant validity;
- effective entitlement resolution;
- first `activated_at` when the target is `ready`.

Use a PostgreSQL database clock that reflects the time after lock acquisition rather
than application/browser time or a transaction-start timestamp captured before a
wait.

For `inactive -> active`, `activated_at` remains unchanged.

## 23. Shared entitlement SQL strategy

The migration should introduce private SQL helpers equivalent to:

```text
private.resolve_organization_entitlement_facts(
  organization_id uuid,
  resolved_at timestamptz
)

private.resolve_effective_organization_entitlement(
  organization_id uuid,
  resolved_at timestamptz
)
```

The exact internal result shape may be refined during implementation, but it must
preserve these responsibilities:

- read all relevant local grants and the paid projection for one already trusted
  internal Organization;
- apply the approved half-open local-grant time boundaries;
- aggregate same-plan local grants without summing capacity;
- fail on concurrently valid local grants with different plans;
- centralize paid status and collection-pause semantics for database mutations;
- return at most one effective plan/source decision;
- accept a single database timestamp supplied by the locked mutation;
- perform no mutation;
- use static, fully qualified SQL and an empty/restricted `search_path`.

The existing public function:

```text
public.resolve_active_organization_entitlement_facts()
```

must retain:

- its zero-argument public signature;
- its five existing columns and their order/types;
- `STABLE` and `SECURITY DEFINER` behavior;
- its current JWT tenant derivation;
- its current grants/revokes;
- its read-only semantics.

Its implementation may be replaced in the new forward-only migration so it delegates
to shared private fact logic. The public application contract must not change.

The TypeScript read resolver continues normalizing that stable fact contract. The SQL
effective-entitlement helper owns equivalent mutation-time normalization. Mandatory
cross-layer parity tests prevent their semantics from drifting.

## 24. Database-side PlanCode capacity authority

The migration must introduce:

```text
private.plan_max_stores(plan_code text)
```

Required properties:

```text
IMMUTABLE
STRICT
SECURITY INVOKER
restricted/empty search_path
```

Exact mapping:

```text
essential -> 1
multi_2   -> 2
multi_3   -> 3
```

An unknown or null plan must fail closed. There is no Essential fallback.

The helper:

- reads no table;
- performs no mutation;
- is not exposed to browser/Data API callers;
- is the transactional enforcement authority for Store-capacity mutations.

`maxStores` must never be accepted as an RPC or application argument and must not be
persisted redundantly.

## 25. TypeScript and SQL parity

The existing TypeScript registry remains authoritative for application/read-model
use. The private SQL helper is authoritative inside transactionally enforced Store
mutations.

Tests must prove both layers agree exactly:

```text
essential = 1
multi_2   = 2
multi_3   = 3
```

The focused local database integration test must import the real TypeScript registry,
invoke the real private SQL helper through a privileged local test connection, and
compare every approved `PlanCode`. Separate assertions with duplicated expected
literals are useful but do not by themselves prove cross-layer parity.

An unknown SQL or TypeScript plan must fail closed. Any mismatch fails the test suite.

## 26. Activation idempotency ordering

After trusted tenant resolution and target Store locking, activation resolves safe
Store state before entitlement/capacity rejection.

If the target is already `active`, return:

```text
already_active
```

even when:

- the current entitlement has expired;
- billing collection is paused;
- the active Store count equals or exceeds current capacity after downgrade.

The call does not activate another Store or consume additional capacity, so it performs
no mutation.

This result does not authorize storefront visibility, order intake, or other protected
operations. Those boundaries must independently require current entitlement.

Other ordering rules:

- a missing/cross-tenant Store becomes `store_unavailable` before any tenant detail is
  exposed;
- `draft` becomes `not_ready` without entitlement resolution;
- `ready`/`inactive` require entitlement before capacity can be applied;
- a genuine resolution/invariant failure is never converted to a domain outcome.

## 27. Downgrade and over-capacity behavior

Example:

```text
previous plan = multi_3
active Stores = 3
current plan = essential
maxStores = 1
```

The feature must not automatically deactivate, delete, or select a Store.

Persistent Store lifecycle state remains unchanged. While:

```text
activeStoreCount >= maxStores
```

every activation or reactivation of a non-active Store returns:

```text
capacity_reached
```

Deactivation remains available. Activation may resume only after the active count is
strictly below current capacity.

No automatic downgrade remediation policy is introduced by this feature.

## 28. Store state is not operational entitlement

The persisted fact:

```text
status = 'active'
```

does not imply:

```text
Organization is currently entitled
```

This feature changes Store lifecycle state only. Future public Store reads, order
intake, and protected merchant operations must require both:

```text
eligible Store operational state
AND
current Organization entitlement
```

Loss of entitlement does not destructively erase Store configuration or history.

## 29. Database RPC contracts

The migration must create:

```sql
public.activate_store_within_entitlement(
  p_store_id uuid
)

public.deactivate_store(
  p_store_id uuid
)
```

Each RPC returns exactly one row with one minimal field:

```text
outcome text
```

The activation RPC may return:

```text
organization_not_provisioned
activated
already_active
not_ready
not_entitled
capacity_reached
store_unavailable
```

The deactivation RPC may return:

```text
organization_not_provisioned
deactivated
already_inactive
not_active
store_unavailable
```

Authorization failures from a direct RPC call raise a database authorization error.
Impossible persisted combinations and entitlement resolution failures raise an
exception so no partial mutation commits.

The RPC response must not return:

- `maxStores`;
- active Store count;
- entitlement source;
- Organization IDs;
- Clerk IDs;
- trial dates;
- Stripe IDs;
- raw database diagnostics.

## 30. RPC security and privileges

Both public RPCs must be:

```text
VOLATILE
SECURITY DEFINER
owner postgres
search_path = ''
```

Their bodies must use static SQL and fully qualified objects/functions.

Execution posture:

```text
PUBLIC        -> no EXECUTE
anon          -> no EXECUTE
service_role  -> no EXECUTE
authenticated -> EXECUTE
```

The private entitlement and capacity helpers must be owned/revoked explicitly and
must not become Data API capabilities for `PUBLIC`, `anon`, `authenticated`, or
`service_role`.

This feature grants no generic `INSERT`, `UPDATE`, `DELETE`, or `TRUNCATE` on Stores
or billing tables. Existing RLS and table grants remain unchanged.

## 31. Application result models

The exact TypeScript shape follows the existing Store Trial Activation convention:
domain outcomes and precondition outcomes form the public result; infrastructure
failures throw safe typed errors.

```ts
type StoreEntitlementActivationDomainResult =
  | {
      status: "activated"
      storeId: string
    }
  | {
      status: "already_active"
      storeId: string
    }
  | { status: "not_ready" }
  | { status: "not_entitled" }
  | { status: "capacity_reached" }
  | { status: "store_unavailable" }

type StoreEntitlementActivationResult =
  | StoreEntitlementActivationDomainResult
  | StoreLifecycleMutationPreconditionResult
```

```ts
type StoreDeactivationDomainResult =
  | {
      status: "deactivated"
      storeId: string
    }
  | {
      status: "already_inactive"
      storeId: string
    }
  | { status: "not_active" }
  | { status: "store_unavailable" }

type StoreDeactivationResult =
  StoreDeactivationDomainResult | StoreLifecycleMutationPreconditionResult
```

Malformed Store IDs normalize to `store_unavailable` before an RPC call.

## 32. Infrastructure and invariant errors

The application must define safe errors equivalent to:

```text
StoreEntitlementActivationError
StoreDeactivationError
```

They cover:

- Clerk auth lookup failure;
- Supabase/RPC transport failure;
- PostgREST error;
- malformed or unexpected RPC result;
- unknown RPC outcome;
- database invariant or entitlement-resolution failure.

They must use stable public messages and may retain a cause server-side. They must not
expose:

- raw SQL;
- PostgREST details;
- JWT/Clerk claims or IDs;
- internal Organization UUIDs;
- Stripe IDs;
- secret/environment values.

Infrastructure failures and impossible invariants are not `not_entitled`,
`capacity_reached`, or `store_unavailable`.

## 33. Planned application files

The implementation should use the existing public-facade/internal-factory pattern:

```text
lib/stores/
  activate-store-within-entitlement.ts
  activate-store-within-entitlement.internal.ts
  deactivate-store.ts
  deactivate-store.internal.ts
```

The public modules own real `await auth()` and normal Clerk-JWT Supabase integration.
The internal modules own deterministic precondition/result/error normalization for
focused tests.

A tiny shared internal type/helper may be extracted only if it removes concrete
duplication between the two operations without creating a speculative Store service
framework.

No `app/` or `components/` file is required by this feature.

## 34. Planned migration and generated types

One new forward-only migration should contain only:

1. the private shared entitlement fact/effective helpers;
2. `private.plan_max_stores(text)`;
3. a `CREATE OR REPLACE` body for the existing public entitlement-facts function,
   preserving its exact contract and privileges;
4. `public.activate_store_within_entitlement(uuid)`;
5. `public.deactivate_store(uuid)`;
6. explicit owners, comments, function configuration, revokes, and grants.

The implementation must not edit or replace an existing migration.

After applying the migration locally, regenerate:

```text
lib/supabase/database.types.ts
```

The generated types must include both new RPCs and preserve the existing entitlement
facts function signature.

No table, column, index, constraint, trigger, schema, RLS policy, or table-level grant
change is approved by this SPEC.

## 35. Capacity read model

A Store-capacity read operation is explicitly out of scope.

Do not add:

```text
getStoreCapacity()
```

The current Organization Entitlement Resolver must not begin querying Stores because
its approved boundary explicitly excludes Store reads.

A later read-only feature may expose:

```ts
{
  activeStores: number
  maxStores: number
  availableSlots: number
  overCapacity: boolean
}
```

That future result will be informative for dashboard UX. It will never replace the
activation RPC's transaction-time enforcement.

## 36. pgTAP requirements

Database tests must cover at minimum:

### 36.1 Helper and RPC metadata

- all private helpers and both public RPCs exist with exact signatures;
- capacity helper is `IMMUTABLE`, `STRICT`, and `SECURITY INVOKER`;
- entitlement helpers have volatility consistent with their read-only behavior;
- RPCs are `VOLATILE` and `SECURITY DEFINER`;
- owner is the reviewed role;
- `search_path` is empty/restricted in `proconfig`;
- definitions use static, fully qualified SQL;
- public entitlement-facts signature and columns remain unchanged.

### 36.2 Grants and table posture

- `PUBLIC`, `anon`, and `service_role` cannot execute either RPC;
- `authenticated` can execute both RPCs;
- Data API roles cannot execute private helpers;
- `authenticated` retains no direct Store or billing mutation grant;
- billing tables retain no direct authenticated read;
- no RLS policy or generic table grant was added.

### 36.3 Authentication and tenant isolation

- authenticated caller without valid claims fails closed;
- missing active Organization fails closed;
- member cannot mutate;
- admin can mutate only a Store in the active Organization;
- unprovisioned Organization returns `organization_not_provisioned`;
- missing and cross-tenant Stores both return `store_unavailable`;
- knowledge of another Store/Organization identifier provides no authority.

### 36.4 Store lifecycle

- draft activation returns `not_ready`;
- ready Store activates when entitled and below capacity;
- first activation sets `activated_at` from database time;
- active Store returns `already_active` without mutation;
- inactive Store reactivates and preserves `activated_at`;
- active Store deactivates and preserves `activated_at`;
- inactive deactivation returns `already_inactive`;
- draft/ready deactivation returns `not_active`;
- deactivation succeeds without current entitlement;
- invalid persisted combinations fail as invariants.

### 36.5 Plan and entitlement semantics

- `essential`, `multi_2`, and `multi_3` enforce capacities 1, 2, and 3;
- unknown plans fail closed;
- paid `active` is entitled;
- paid `past_due` is entitled;
- `collection_paused = true` prevents paid entitlement;
- every other known paid status is not paid-entitled;
- a valid local grant may be used when paid is not entitled;
- valid manual overrides for all three plans work;
- valid initial Essential trial works;
- initial-trial Store switching works;
- initial-trial Store reactivation works;
- expired, revoked, and future grants do not grant entitlement;
- same-plan local grants produce one capacity;
- conflicting valid local plans fail closed;
- valid paid entitlement has precedence over local entitlement;
- capacities are never added.

### 36.6 Capacity and atomicity

- activation below capacity succeeds;
- activation exactly at capacity returns `capacity_reached`;
- activation while already over capacity returns `capacity_reached`;
- target already active returns `already_active` before entitlement/capacity rejection;
- active count includes only `status = 'active'`;
- historical `activated_at` count does not define capacity;
- activation/deactivation changes no billing row;
- RPC error rolls back every Store mutation.

Fixtures must use the privileged local test role, never generic authenticated table
writes.

## 37. Real concurrency requirements

Sequential pgTAP tests do not prove capacity correctness. The implementation must
reuse the local-only multi-session `pg` harness established by Store Trial Activation.

The harness must:

- use independent PostgreSQL sessions;
- accept only a local database host;
- never read `.env.local`;
- never print credentials;
- coordinate deterministic barriers/locks rather than rely on timing sleeps;
- assert both returned outcomes and final persisted state.

Required scenarios:

### 37.1 Last available slot

```text
capacity = 2
active Store count = 1
Store B = ready
Store C = ready

concurrent activation
  -> exactly one activated
  -> exactly one capacity_reached
  -> final active Store count = 2
```

### 37.2 Same Store

```text
two concurrent activations of one eligible Store
  -> one activated
  -> one already_active
  -> one lifecycle mutation
```

### 37.3 Activation versus deactivation

Both operations must serialize through the same Organization lock. The observed
outcomes and final active count must correspond to one valid serial ordering and must
never exceed capacity.

### 37.4 Initial-trial activation versus generic activation

The specialized trial RPC and generic activation must use the same Organization lock.
The test must prove there is neither a double activation/capacity race nor duplicate
initial-trial creation.

### 37.5 Activation versus billing projection update

Using the current webhook/projection writer locking convention, prove that activation
resolves entitlement after obtaining the shared Organization lock and observes a
serialization-consistent paid projection.

### 37.6 Different Organizations

Mutations for different Organizations should not block each other except for the
conservative possibility of an advisory-hash collision.

## 38. Node test requirements

Focused application tests must cover:

### 38.1 Preconditions

- unauthenticated;
- no active Organization;
- Organization member;
- Organization admin;
- active Clerk Organization not provisioned internally;
- early preconditions avoid unnecessary RPC calls;
- precondition names match existing project conventions.

### 38.2 Caller authority and integration

- only `storeId` reaches either RPC;
- caller cannot provide Organization, User, role, plan, capacity, status, or
  entitlement authority;
- malformed Store ID becomes `store_unavailable` without RPC access;
- public modules use `createServerSupabaseClient()`;
- no admin Supabase client is imported or called;
- no Stripe module/client is imported or called;
- modules are server-only.

### 38.3 Activation outcomes

- `store_unavailable`;
- `not_ready`;
- `not_entitled`;
- `capacity_reached`;
- `activated` with the caller's validated Store ID;
- `already_active` with the Store ID;
- inactive reactivation normalizes to `activated`;
- unexpected/extra/missing RPC fields fail closed;
- unknown outcome fails closed.

### 38.4 Deactivation outcomes

- `deactivated` with Store ID;
- `already_inactive` with Store ID;
- `not_active`;
- `store_unavailable`;
- unexpected response shape/outcome fails closed.

### 38.5 Errors and parity

- thrown auth/client failures become the operation-specific safe error;
- PostgREST errors become safe errors;
- raw causes are absent from public messages;
- genuine errors never become a domain result;
- the real TypeScript registry and real local SQL helper agree for all PlanCodes;
- both sides reject unknown plans.

Tests must use the repository's existing Node test approach and must not add another
test framework.

## 39. Focused scripts and planned test files

The implementation should add only the focused scripts needed for this slice:

```text
test:store-entitlement-activation
test:store-entitlement-activation:concurrency
```

Expected test files:

```text
tests/store-entitlement-activation/
  store-entitlement-activation.test.mjs
  store-entitlement-activation.concurrency.test.mjs

supabase/tests/database/
  store_entitlement_activation_test.sql
```

The existing `pg` development dependency and test harness conventions are sufficient.
No new test dependency is required.

## 40. Regression verification

Future implementation verification must run the focused suites:

```bash
yarn test:store-entitlement-activation
yarn test:store-entitlement-activation:concurrency
```

It must rerun relevant application regressions:

```bash
yarn test:store-trial-activation
yarn test:store-trial-activation:concurrency
yarn test:store-provisioning-setup
yarn test:organization-entitlement
yarn test:stripe-webhook-foundation
yarn test:stripe-server-foundation
yarn test:tenant-provisioning
yarn test:onboarding-state-resolver
```

It must rebuild/test/lint the local database:

```bash
yarn supabase db reset
yarn supabase test db
yarn supabase db lint --local
```

It must run repository checks:

```bash
yarn lint
yarn typecheck
yarn build
git diff --check
```

No real Staging or Production database push is authorized by this SPEC. Any hosted
migration application requires separate explicit approval after review.

## 41. Documentation relationships

This feature applies:

- ADR-001 for Organization billing ownership and one-to-many Stores;
- ADR-002 for Store access remaining separate from entitlement;
- ADR-003 for narrow transactional database RPCs;
- ADR-004 for local/paid entitlement, paid precedence, and plan capacity;
- Billing Foundation SPEC for grant and paid-projection persistence;
- Organization Entitlement Resolver SPEC for the stable public read contract;
- Store Provisioning / Setup SPEC for readiness and lifecycle setup;
- Store Trial Activation SPEC for initial-grant eligibility and lock conventions.

No new ADR is required. ADR-004 requires only the approved clarification that:

```text
TypeScript plan registry
  -> application/read-model capacity authority

private SQL plan helper
  -> transactional enforcement authority
```

After implementation, current-state documentation may describe the feature as
implemented. This documentation-only phase must not do so.

## 42. Roadmap position

```text
Store Setup                                      complete
Store Trial Activation                           complete
Store Entitlement Activation / Capacity          current

then:
Stripe Checkout
Customer Portal
Onboarding coordinator
Public Store Read Boundary
Products / menu / orders
```

This roadmap note records ordering only. It does not authorize adjacent feature work.

## 43. Risks and mandatory mitigations

### 43.1 SQL/TypeScript capacity drift

Risk: application UI/read results and transaction enforcement disagree.

Mitigation: one closed PlanCode set, exact mapping in each authority, and a real
cross-layer local database parity test.

### 43.2 Entitlement algorithm drift

Risk: the read resolver and mutation helper interpret paid/local facts differently.

Mitigation: shared private fact resolution, stable public delegation, complete status
and precedence parity tests, and no independent ad hoc checks inside RPCs.

### 43.3 Writer ignores Organization lock

Risk: a future billing or Store mutation bypasses serialization and creates a
time-of-check race.

Mitigation: document and test the exact existing Organization lock as a mandatory
cross-feature protocol.

### 43.4 Definer-privilege expansion

Risk: a `SECURITY DEFINER` RPC can cross normal table RLS/grants.

Mitigation: one Store argument, JWT-derived tenant/admin, static fully qualified SQL,
empty `search_path`, minimal result, explicit grants, and tenant-isolation pgTAP.

### 43.5 Active state confused with entitlement

Risk: callers treat `active` as permission to operate after trial/subscription loss.

Mitigation: explicitly require both lifecycle and entitlement in future storefront,
order, and protected operation boundaries.

### 43.6 Stale capacity UI

Risk: a future dashboard displays an available slot that another request consumes.

Mitigation: UI data remains advisory; the activation RPC always rechecks inside its
transaction.

### 43.7 Lock contention

Risk: Organization-wide serialization delays concurrent mutations.

Mitigation: keep transactions short, use one consistent lock order, and perform no
network/provider work while holding locks.

### 43.8 Paid projection lag

Risk: local paid state temporarily trails Stripe.

Mitigation: consume only the verified local projection and retain webhook/reconciliation
monitoring as a separate billing concern. Do not add request-path Stripe calls.

## 44. Acceptance criteria

Implementation is complete only when all applicable criteria are satisfied:

- [ ] Both public modules are server-only and accept only `storeId`.
- [ ] Both call `await auth()` and require authenticated, active-Organization admin
      state.
- [ ] Preconditions use the existing stable result convention.
- [ ] Both RPCs revalidate Organization and admin role from verified JWT claims.
- [ ] Missing and cross-tenant Stores are indistinguishable.
- [ ] Generic activation accepts paid, manual-override, and initial-trial entitlement.
- [ ] A valid initial trial permits Store switching without changing trial dates.
- [ ] The historical no-previous-activation rule remains exclusive to initial trial
      creation.
- [ ] Capacity counts only Stores with `status = 'active'`.
- [ ] Capacity and activation commit through one short transaction.
- [ ] Organization locking exactly matches existing trial and billing writers.
- [ ] Entitlement time is captured after lock waiting.
- [ ] Ready activation sets first `activated_at` from database time.
- [ ] Inactive reactivation preserves original `activated_at`.
- [ ] Already-active activation is idempotent before entitlement/capacity rejection.
- [ ] Deactivation preserves `activated_at` and requires no entitlement.
- [ ] Downgrade performs no automatic deactivation.
- [ ] Paid entitlement wins without adding local capacity.
- [ ] Same-plan local grants do not add capacity.
- [ ] Conflicting local plan codes fail closed.
- [ ] SQL helper recognizes exactly the three approved plan mappings.
- [ ] TypeScript and SQL capacity mappings pass a real parity test.
- [ ] Public entitlement-facts contract remains unchanged.
- [ ] No billing, trial, Stripe, Store setup, UI, or capacity-read mutation is added.
- [ ] No generic authenticated table write or new RLS policy is added.
- [ ] RPC/helper privileges and `search_path` pass pgTAP security checks.
- [ ] Real multi-session tests prove last-slot serialization and inter-feature lock
      compatibility.
- [ ] Focused and regression tests, database reset/lint, lint, typecheck, build, and
      `git diff --check` pass.
- [ ] Generated database types include the new RPCs.
- [ ] No new dependency, environment variable, secret, remote push, or unrelated
      feature is introduced.

## 45. Remaining decisions

None.

The following work is intentionally deferred and does not block implementation:

- capacity read-model/dashboard UX;
- automatic downgrade remediation;
- administrative manual-override workflow;
- Stripe Checkout and Customer Portal;
- pricing and billing intervals;
- tax configuration;
- onboarding coordination;
- public storefront and order-intake authorization;
- four-or-more-Store sales-assisted workflow.

## 46. Implementation authorization

This SPEC is approved for a subsequent implementation phase limited to the two Store
domain operations, one forward-only migration, private entitlement/capacity helpers,
preservation of the public entitlement-read contract, generated database types,
focused tests/scripts, and directly required current-state documentation updates.

It does not authorize:

- implementation during this documentation-only execution;
- a real remote migration push;
- Stripe Dashboard or network changes;
- billing/grant mutation;
- UI or adjacent roadmap features;
- commit, push, merge, rebase, or history rewriting without explicit authorization.

```text
READY FOR STORE ENTITLEMENT ACTIVATION IMPLEMENTATION
```
