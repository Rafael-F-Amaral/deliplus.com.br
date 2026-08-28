# Deli Plus — Store Trial Activation

```text
Status: Approved
```

## 1. Purpose

This specification defines the first Store activation boundary for Deli Plus.

The feature has one narrow responsibility:

```text
eligible Clerk Organization admin
  + provisioned DeliPlus Organization
  + first Store in ready state
  + Organization and Clerk User historically eligible for an initial trial
  -> atomically activate the Store and create one 15-day Essential trial grant
```

The public domain operation is:

```text
activateFirstStoreWithInitialTrial(storeId)
```

This operation is intentionally not the generic Store activation path. Activating
another Store within an existing paid or administratively granted entitlement is a
future feature with a separate operation:

```text
activateStoreWithinEntitlement(storeId)
```

## 2. Current prerequisite state

The current repository already provides the foundations required by this feature:

- Clerk is the source of truth for authentication, active Organization, Organization
  membership and Organization role;
- `public.organizations` maps one Clerk Organization to one internal DeliPlus
  Organization;
- `public.stores` belongs to the internal Organization and has the lifecycle states
  `draft`, `ready`, `active` and `inactive`;
- `public.stores.activated_at` records Store activation history and is immutable after
  its first non-null value;
- the lifecycle trigger permits `ready -> active` and requires `activated_at` for
  `active` and `inactive` Stores;
- `public.billing_trial_grants` stores local trial projections, including initial
  trials and manual overrides;
- the database constraints already restrict an initial trial to the `essential` plan,
  require exactly 15 days, and enforce at most one initial trial per Organization and
  per Clerk User;
- `public.billing_subscriptions` stores the local Stripe subscription projection;
- the Organization entitlement resolver defines paid, trial and manual-override
  entitlement semantics without making live Stripe calls;
- authenticated application traffic uses the normal Clerk JWT-backed Supabase client;
- generic direct writes by `authenticated` to Store and billing tables remain denied.

The Store Setup implementation currently exposes:

```text
listStoresForSetup()
getStoreForSetup(storeId)
createDraftStore(input)
updateStoreSetup(storeId, input)
markStoreReady(storeId)
```

This feature extends that lifecycle only after `markStoreReady()` has completed. It
does not duplicate Store naming, slug validation, readiness validation or setup
mutations.

The task premise states that the existing Store Setup migration is already applied in
Staging. This SPEC does not perform or verify a Staging deployment.

## 3. Approved scope

The implementation described by this SPEC will include:

- one server-only application operation;
- authentication and Organization-admin precondition handling;
- one narrow transactional PostgreSQL RPC;
- historical initial-trial eligibility checks for the active Organization and current
  Clerk User;
- local paid/manual entitlement conflict checks;
- first-Store historical activation validation;
- atomic insertion of the initial trial grant and `ready -> active` Store transition;
- safe, minimal domain outcomes;
- pgTAP, Node and real multi-connection concurrency tests;
- focused documentation updates required by the completed implementation.

## 4. Explicit non-goals

This feature does not implement:

- a generic paid Store activation flow;
- activation of an additional Store under `multi_2` or `multi_3`;
- Store-capacity enforcement for generic activation;
- trial checkout, card collection or Stripe Checkout;
- Stripe Product or Price creation;
- a Stripe API call during activation;
- a Stripe subscription mutation;
- manual-override creation, revocation or administration;
- trial extension, restart or reactivation;
- a trial eligibility preview exposed to the browser;
- lifecycle changes when a trial expires;
- Store suspension, deactivation or deletion;
- onboarding UI, redirects or a Server Action;
- browser-side Supabase access;
- new persisted plan-capacity columns;
- a new Store-to-trial foreign key;
- schema changes to existing Store or billing tables;
- RLS changes unrelated to the narrow RPC;
- an ADR.

## 5. Operation contract

The public operation is conceptually:

```ts
activateFirstStoreWithInitialTrial(storeId: string): Promise<StoreTrialActivationResult>
```

The browser may supply only:

```text
storeId
```

The browser must never supply or choose:

- Clerk Organization ID;
- internal Organization ID;
- Clerk User ID;
- Organization role;
- trial kind;
- plan code;
- Store status;
- activation timestamp;
- trial start or end timestamp;
- Store capacity;
- entitlement status.

The operation must use the existing Store UUID validation rule. A malformed `storeId`
is normalized to the safe `store_unavailable` result and must not be interpolated into
SQL or accepted as authority.

## 6. Authentication and authorization

The application boundary must execute server-side and call:

```ts
await auth()
```

The preconditions are evaluated in this order:

1. the request is authenticated;
2. the Clerk session has an active Organization;
3. the current user has `org:admin` in that active Organization;
4. the active Clerk Organization maps to a DeliPlus Organization.

An Organization member is rejected before the application requests a mutation.

The database RPC must independently fail closed by deriving and validating the Clerk
claims from the verified JWT. In particular, it must require the database role claim:

```text
private.clerk_organization_role() = 'admin'
```

The application's `org:admin` check is a fast and explicit product boundary. The RPC
check is defense in depth and remains mandatory for direct Data API calls.

Authentication and role failures are not infrastructure errors. They use the explicit
precondition results defined later in this document.

## 7. Tenant and user authority

All authority originates from verified Clerk session/JWT claims:

```text
Clerk active Organization ID
  -> private.clerk_organization_id()
  -> public.organizations.clerk_organization_id
  -> internal Organization UUID

Clerk User ID
  -> private.clerk_user_id()
  -> billing_trial_grants.clerk_user_id
```

The current Clerk User ID stored in the initial trial grant must be derived inside the
database boundary. It must never be accepted as an RPC argument.

The target Store must be selected using both:

```text
store id = p_store_id
organization_id = verified internal Organization UUID
```

A nonexistent Store and a Store owned by another Organization are deliberately
indistinguishable and both return:

```text
store_unavailable
```

No response may reveal another tenant's Organization, Store, trial or billing facts.

## 8. Store preconditions

The target Store is eligible for its first activation only when all of the following
are true under the transaction locks:

- it belongs to the active Organization;
- its status is `ready`;
- `activated_at` is null;
- no Store in the Organization has ever had a non-null `activated_at`;
- all trial and entitlement eligibility conditions in this SPEC are satisfied.

A `draft` Store returns:

```text
not_ready
```

The activation operation must not repeat or relax the readiness rules already enforced
by `markStoreReady()`.

An `active` Store is handled only by the same-Store idempotency rules. An `inactive`
Store or another previously activated lifecycle state cannot start an initial trial.

## 9. Initial trial definition

The grant created by this operation is exactly:

```text
grant_kind = initial
plan_code = essential
starts_at = transaction activation timestamp
ends_at = starts_at + 15 days
revoked_at = null
```

The trial:

- requires no card;
- makes no Stripe API call;
- provides full Essential functionality while valid;
- derives `maxStores = 1` from the plan registry;
- does not persist `maxStores` in the trial projection;
- does not create a Stripe Customer or Subscription;
- cannot be upgraded to a multi-Store trial by this operation.

One database timestamp must be captured and reused for:

```text
billing_trial_grants.starts_at
stores.activated_at
```

The same value is the basis for:

```text
billing_trial_grants.ends_at = starts_at + interval '15 days'
```

Application server time and browser time are never authoritative.

## 10. Trial eligibility

Initial trial eligibility is historical, not merely current.

The Organization is eligible only if no row has ever existed with:

```text
organization_id = active internal Organization UUID
grant_kind = initial
```

The Clerk User is eligible only if no row has ever existed with:

```text
clerk_user_id = verified current Clerk User ID
grant_kind = initial
```

An expired or revoked initial trial still consumes eligibility for both dimensions.
Deleting or changing a Clerk Organization does not restore a consumed Clerk User trial.

An administrative manual override:

- is not an initial trial;
- does not by itself consume historical initial-trial eligibility;
- does not restore eligibility already consumed by an initial trial;
- is never created, revoked or altered by this operation.

The existing partial unique indexes for initial grants per Organization and per Clerk
User remain mandatory database backstops. They complement rather than replace the
explicit eligibility checks and concurrency locks.

## 11. Existing paid or manual entitlement behavior

The operation must inspect only the local billing projection inside the transaction.
It must not call the TypeScript entitlement resolver, Stripe or another service while
database locks are held.

For this operation, a current paid entitlement exists when the local subscription row
has:

```text
status in (active, past_due)
collection_paused = false
```

A current manual-override entitlement exists when a local grant has:

```text
grant_kind = manual_override
revoked_at is null
starts_at <= shared database timestamp
shared database timestamp < ends_at
```

If either current entitlement exists, the operation must not create an initial trial
and must not activate the Store. It returns:

```text
trial_not_eligible
```

The future generic operation `activateStoreWithinEntitlement(storeId)` will own that
activation path and its Store-capacity enforcement.

Starting an eligible initial trial does not require any pre-existing entitlement row.

## 12. Store historical activation invariant

Before a new initial trial may be created, the active Organization must have zero
Stores where:

```text
activated_at is not null
```

This is deliberately stricter than counting currently active Stores. `inactive` Stores
with a historical activation still prove that the first activation has already
occurred.

The invariant prevents an initial trial from being used as a second activation path
after a Store was previously active, regardless of its current lifecycle status.

The one-Store Essential capacity rule remains derived from the plan registry. This
historical invariant is an additional first-activation rule, not a replacement for
future generic capacity enforcement.

## 13. Atomic transaction model

Trial creation and Store activation must occur in one PostgreSQL transaction owned by
one RPC invocation:

```text
insert initial billing_trial_grants row
  +
update target Store ready -> active and set activated_at
```

Either both changes commit or neither change commits.

The implementation must verify that exactly one intended `ready` Store row is updated.
If the trial insert succeeds but the Store update fails or affects an unexpected row
count, the function must raise an exception so PostgreSQL rolls back the inserted
grant.

If the trial insert fails, the Store must remain unchanged.

No network request, Stripe request or application callback may occur inside this
transaction.

## 14. RPC model

The database boundary is:

```text
public.activate_first_store_with_initial_trial(p_store_id uuid)
```

Required properties:

```text
VOLATILE
SECURITY DEFINER
SET search_path = ''
owner = postgres
```

The function must:

- use only static SQL;
- fully qualify all schemas, tables, functions, operators where required by an empty
  `search_path`, and types;
- use the private verified Clerk claim helpers;
- accept only the target Store UUID;
- return only a fixed, minimal result shape;
- contain no dynamic SQL;
- contain no external calls;
- never trust metadata supplied by the client;
- fail closed for absent or malformed verified claims.

The proposed database result is one row containing:

```text
outcome text
trial_ends_at timestamptz nullable
```

Only `activated` and `already_activated` may return a non-null `trial_ends_at`.
Provider identifiers, internal Organization IDs, Clerk User IDs, plan provider IDs and
raw billing rows must not be returned.

Execution privileges must be explicit:

```text
PUBLIC        -> no EXECUTE
anon          -> no EXECUTE
authenticated -> EXECUTE
service_role  -> no feature-specific grant required
```

This RPC does not grant generic `INSERT` or `UPDATE` on `public.stores` or billing
tables to `authenticated`. Existing table-deny posture and RLS remain unchanged.

## 15. Lock order

All callers and tests must use the following deterministic lock order:

1. derive the verified Clerk User ID, active Clerk Organization ID and role;
2. resolve the internal Organization UUID without accepting tenant authority from the
   caller;
3. acquire the existing Organization advisory transaction lock using the exact same
   namespace/convention already used by Organization billing projection writes:

   ```text
   pg_advisory_xact_lock(hashtextextended(internal_organization_uuid::text, 0))
   ```

4. lock and revalidate the resolved `public.organizations` row `FOR UPDATE`;
5. acquire the Clerk User advisory transaction lock defined in the next section;
6. lock the target Store row, scoped to the internal Organization, `FOR UPDATE`;
7. read and lock the relevant Organization trial, manual-override and subscription
   facts as needed;
8. evaluate idempotency and eligibility;
9. insert the trial grant;
10. update the Store;
11. return the normalized outcome and commit.

The Organization advisory lock is acquired before Organization, Store and billing row
locks so this feature is compatible with the convention already used by the Stripe
webhook projection. Future Store activation/capacity operations must use the same
Organization lock first.

The database transaction must remain short. No application rendering, user input,
Stripe operation or other remote work may run between these lock steps.

## 16. Clerk User concurrency strategy

The per-Organization lock cannot prevent the same Clerk User from racing two first
trial activations in two different Organizations. Therefore the RPC must also acquire
a transaction-scoped advisory lock keyed by the verified Clerk User ID.

The approved direction is a separate, stable two-integer advisory namespace, for
example conceptually:

```text
pg_advisory_xact_lock(
  hashtext('deliplus:initial-trial-user'),
  hashtext(verified_clerk_user_id)
)
```

The implementation must use fully qualified PostgreSQL functions under the empty
`search_path` and document the exact stable namespace in the migration.

Hash collisions may conservatively serialize unrelated users but must never weaken
correctness. The unique partial index on initial Clerk User grants remains the final
constraint backstop.

This advisory lock is acquired after the Organization lock and before Store/billing
mutation locks. Every future operation that can create an initial trial grant must use
the same Clerk User lock convention and order.

## 17. Transaction flow

The RPC follows this logical flow:

```text
verified JWT claims present?
  no -> fail closed / precondition outcome

verified Organization role is admin?
  no -> reject mutation

active Clerk Organization maps to DeliPlus Organization?
  no -> organization_not_provisioned

acquire Organization lock
lock/revalidate Organization row
acquire Clerk User lock

target Store exists in active Organization?
  no -> store_unavailable

lock target Store

coherent same-Store successful retry?
  yes -> already_activated

target Store ready with activated_at null?
  no, draft -> not_ready
  no, historical/non-coherent state -> trial_not_eligible or invariant error

current paid entitlement or valid manual override?
  yes -> trial_not_eligible

Organization has any historical initial trial?
  yes -> trial_not_eligible

Clerk User has any historical initial trial?
  yes -> trial_not_eligible

Organization has any historically activated Store?
  yes -> trial_not_eligible

capture one database timestamp
insert 15-day Essential initial trial
update target Store ready -> active with same timestamp
verify exact affected row
return activated
```

Unexpected combinations that violate persisted constraints or make ownership of the
original activation ambiguous are infrastructure/invariant failures, not valid
onboarding outcomes.

## 18. Idempotency model

The first successful call returns:

```text
activated
```

An exact retry of the same completed activation may return:

```text
already_activated
```

No idempotency key is accepted from the browser. Idempotency is derived from locked
database state.

The retry must never:

- insert another trial grant;
- restart or extend the trial;
- change `starts_at`, `ends_at` or `activated_at`;
- rewrite the Store lifecycle;
- replace the original Clerk User identity;
- turn an expired or revoked trial into a valid trial.

## 19. Same Store retry

A same-Store retry is coherent only when all of these facts hold under lock:

- the target Store is `active`;
- the target Store has a non-null `activated_at`;
- the Organization has exactly one initial grant;
- that initial grant is currently valid and not revoked;
- `store.activated_at = initial_grant.starts_at`;
- no other Store in the Organization shares that first activation timestamp;
- the persisted trial interval and plan satisfy the existing initial-trial constraints.

When coherent, return `already_activated` with the original `ends_at`.

Any current admin of the same active Organization may receive this idempotent result.
The retry does not require the current admin to be the Clerk User who originally
started the trial, and it does not transfer or rewrite the grant's historical
`clerk_user_id`.

The Organization may have acquired a paid entitlement and activated other Stores after
the original first activation. Those later Stores do not invalidate an otherwise
coherent retry; the match is based on the original Store/timestamp/trial facts.

If the Organization initial trial is expired or revoked, the result is
`trial_not_eligible`; it is never restarted.

If a current initial grant exists but the caller targets a different Store, no Store is
activated and the result is `trial_not_eligible`.

Impossible or ambiguous combinations, such as multiple candidate Stores sharing the
initial timestamp, raise `StoreTrialActivationError` through the application boundary.

## 20. Two Store race

When two ready Stores in the same Organization race to start the initial trial:

- the shared Organization advisory lock serializes the operations;
- exactly one Store may transition to `active`;
- exactly one initial trial grant may be inserted;
- the winner returns `activated`;
- the loser returns `trial_not_eligible`;
- the losing Store remains `ready` with null `activated_at`.

The outcome must not depend solely on the unique-index violation path. Eligibility is
re-evaluated after the transaction acquires the locks.

## 21. Cross-Organization same-user race

When the same Clerk User is an admin in two Organizations and concurrently attempts to
start two initial trials:

- each request first acquires its Organization lock;
- both use the same Clerk User advisory lock namespace;
- only one transaction may pass the historical Clerk User eligibility check;
- exactly one Organization receives an initial grant and one active Store;
- the other operation returns `trial_not_eligible` and leaves its Store `ready`;
- the unique Clerk User initial-grant index remains the constraint backstop.

The application must not select the winner. It is whichever transaction obtains the
required locks and commits first.

## 22. Store lifecycle interaction

This feature uses the existing lifecycle transition only:

```text
ready -> active
```

It sets `activated_at` exactly once. It must not disable, replace or weaken the existing
Store lifecycle trigger.

The feature must not activate:

- a draft Store;
- an inactive Store;
- an already active but non-coherent Store;
- a Store from another tenant;
- a Store that became non-ready while the request waited for locks.

The Store state is revalidated inside the transaction after all relevant locks are
held.

## 23. Trial expiration behavior

Trial expiration is an entitlement resolution event, not a Store lifecycle mutation.

When the 15-day trial expires, this feature does not:

- change the Store from `active` to `inactive`;
- clear or rewrite `activated_at`;
- delete the Store;
- revoke or delete the historical grant;
- automatically create a Stripe subscription;
- restart the trial.

Access gating after expiration belongs to entitlement-aware application features. A
future explicit lifecycle policy may change Store status, but it is outside this SPEC.

## 24. Result model

The domain outcomes are distinct from authentication/authorization preconditions:

```ts
type StoreTrialActivationDomainResult =
  | {
      status: "activated";
      storeId: string;
      trialEndsAt: Date;
    }
  | {
      status: "already_activated";
      storeId: string;
      trialEndsAt: Date;
    }
  | { status: "not_ready" }
  | { status: "trial_not_eligible" }
  | { status: "store_unavailable" };

type StoreTrialActivationPreconditionResult =
  | { status: "unauthenticated" }
  | { status: "no_active_organization" }
  | { status: "organization_not_provisioned" }
  | { status: "not_admin" };

type StoreTrialActivationResult =
  | StoreTrialActivationDomainResult
  | StoreTrialActivationPreconditionResult;
```

Successful date values are normalized to `Date` by the server-only application module.
The raw RPC response is not exposed to Client Components.

`canProvision`, query parameters, client claims and UI state do not authorize this
mutation.

## 25. Error model

Expected product/precondition states use the result union. Unexpected failures throw a
small server-side error:

```text
StoreTrialActivationError
```

This error covers, for example:

- Supabase/PostgREST transport or execution errors;
- unexpected RPC outcome values;
- missing or malformed required successful result fields;
- persisted invariant contradictions;
- an unexpected mutation row count;
- database constraint failures that indicate a race or bug not normalized after locks.

The public error must not include raw PostgREST messages, SQL, constraint details,
provider identifiers, JWT claims or cross-tenant facts. Detailed diagnostics may be
recorded only in server-side observability with secret-safe structured metadata.

Real infrastructure failures must never be silently converted into `not_ready`,
`trial_not_eligible` or `store_unavailable`.

## 26. Proposed application files

Implementation should add only the smallest coherent server-side module set:

```text
lib/stores/activate-first-store-with-initial-trial.ts
lib/stores/activate-first-store-with-initial-trial.internal.ts
```

The public module must:

- import `server-only`;
- call `await auth()`;
- enforce authenticated, active Organization and `org:admin` preconditions;
- validate the Store UUID with the existing Store rule;
- use only `createServerSupabaseClient()`;
- call the narrow RPC;
- normalize the result and date;
- throw only the safe application error for infrastructure/invariant failures.

The internal module may contain pure result validation/normalization helpers that are
unit-testable without request-boundary mocking.

The feature must not use:

- `lib/supabase/admin.ts`;
- `SUPABASE_SECRET_KEY`;
- service-role credentials;
- a browser Supabase client;
- a Server Action;
- an API Route;
- Proxy database logic.

## 27. Proposed migration

Implementation should add one forward-only migration containing only:

- `public.activate_first_store_with_initial_trial(uuid)`;
- its explicit ownership and secure function attributes;
- explicit EXECUTE revocations;
- the narrow `authenticated` EXECUTE grant;
- comments needed to explain the lock namespaces and security boundary.

The migration must not:

- alter existing tables or columns;
- add a `store_id` column to `billing_trial_grants`;
- add redundant Store-capacity data;
- rewrite earlier migrations;
- grant generic table writes;
- introduce a service-role application path;
- change existing RLS policies;
- create Stripe objects or environment configuration.

The exact migration timestamp/filename is chosen at implementation time using the
repository convention.

## 28. pgTAP requirements

The migration must be covered by focused pgTAP tests. At minimum they must prove:

### Function security and shape

- the RPC exists with the exact argument type;
- it is `VOLATILE`;
- it is `SECURITY DEFINER`;
- its owner is `postgres`;
- its configured `search_path` is empty;
- `PUBLIC` cannot execute it;
- `anon` cannot execute it;
- `authenticated` can execute it;
- no new generic table write privilege was granted to `authenticated`;
- the function definition contains no dynamic SQL;
- the function definition contains no reference to service-role credentials;
- the function accepts no Organization, user, role, plan or timestamp authority.

### Authentication and tenant isolation

- missing user claim fails closed;
- missing active Organization claim fails closed;
- missing/invalid Organization role fails closed;
- `org:member` cannot mutate through direct RPC execution;
- `org:admin` can reach the eligible path;
- an unprovisioned active Organization produces the distinct expected outcome;
- a cross-tenant Store is indistinguishable from a missing Store;
- synthetic local Clerk claims are the only tenant/user authority.

### Eligibility and lifecycle

- an eligible ready first Store becomes active;
- the Store and grant use the exact same database timestamp;
- the initial grant is Essential and exactly 15 days;
- a draft Store returns `not_ready` and creates no grant;
- an inactive/historically activated Store cannot start a trial;
- any previously activated Store in the Organization blocks a new initial trial;
- an Organization historical initial grant blocks eligibility even when expired;
- an Organization historical initial grant blocks eligibility even when revoked;
- a Clerk User historical initial grant in another Organization blocks eligibility even
  when expired or revoked;
- a valid manual override blocks this trial-starting operation;
- a current paid entitlement blocks this trial-starting operation;
- `past_due` without collection pause blocks this trial-starting operation;
- `collection_paused = true` does not qualify as current paid entitlement, while all
  other historical eligibility rules still apply;
- no paid/manual entitlement is required for an otherwise eligible trial;
- no manual override is mutated;
- no capacity value is persisted.

### Idempotency

- a coherent immediate retry of the same Store returns `already_activated`;
- retry preserves trial start/end and Store activation timestamps;
- retry creates no second grant;
- retry after expiration returns `trial_not_eligible`;
- retry after revocation returns `trial_not_eligible`;
- targeting another Store while the initial trial exists does not activate it;
- ambiguous or contradictory persisted facts raise an invariant failure rather than a
  valid onboarding result.

### Atomic rollback

- a forced failure during trial insertion leaves the Store unchanged;
- a forced failure during Store update rolls back the trial insertion;
- an unexpected Store update row count rolls back the transaction.

Failure injection may use test-only triggers created inside the pgTAP test transaction
and removed by rollback. Production migrations must not contain test hooks.

Existing pgTAP suites remain regression requirements and must be rerun.

## 29. Concurrency test requirements

Ordinary sequential pgTAP assertions are insufficient for the approved race guarantees.
Implementation must include a real local concurrency harness using independent
PostgreSQL connections.

The approved tooling direction is:

```text
Node built-in node:test
  +
focused development-only PostgreSQL driver (pg)
  +
independent pg.Client connections to the local Supabase PostgreSQL instance
```

This is not approval for a new test framework. The `pg` dependency is allowed only as
the minimal driver required to create and coordinate truly independent database
sessions.

Proposed files/scripts:

```text
tests/store-trial-activation/store-trial-activation.concurrency.test.mjs
yarn test:store-trial-activation:concurrency
```

The harness must:

- target local Supabase only;
- receive its connection string from a dedicated test configuration such as
  `SUPABASE_TEST_DB_URL`, or derive the local CLI connection safely;
- never read, print or commit hosted database credentials;
- never print JWTs or secrets;
- set synthetic `request.jwt.claims` and `SET LOCAL ROLE authenticated` per test
  transaction;
- coordinate transactions through the actual production advisory locks;
- use a separate observer connection or lock-state inspection to prove a contender is
  blocked, instead of relying only on arbitrary sleeps;
- clean up through test transactions or a known local database reset;
- fail clearly if it is pointed at a non-local/hosted database.

### Deterministic orchestration

The race tests must force the intended ordering through the same transaction-scoped
locks used by production code:

1. create and commit fixtures before opening contenders;
2. start contender A with synthetic Clerk claims and the `authenticated` role;
3. have A acquire the production leading lock sequence for the scenario;
4. start contender B and invoke the real RPC;
5. use a third local privileged observer connection to verify through PostgreSQL lock
   state that B is waiting on the expected advisory lock;
6. invoke the real RPC in A's existing transaction; advisory lock acquisition is
   transaction-reentrant in that same session;
7. commit A;
8. observe B resume and complete;
9. assert both returned outcomes and final persisted facts.

For same-Organization scenarios, A pre-acquires the exact Organization advisory lock,
so B waits before eligibility evaluation. For the same-user/two-Organization scenario,
A acquires its Organization lock and then the exact Clerk User lock; B acquires its own
Organization lock through the RPC and waits on the shared Clerk User lock. This keeps
the production lock order intact while deterministically selecting the first
transaction.

The observer is test infrastructure only and may use the local database owner to read
`pg_locks`/`pg_stat_activity`. It must never be part of the application runtime or be
configured with a hosted credential. Timeouts exist only to fail a stuck test; elapsed
time alone is not proof that a contender reached the barrier.

Required concurrent scenarios:

### Same Store, same Organization

Two independent callers race the same ready Store:

```text
one -> activated
one -> already_activated
```

Assertions:

- one grant only;
- one activation only;
- both success results reference the original unchanged timestamps.

### Two Stores, same Organization

Two independent callers race different ready Stores:

```text
one -> activated
one -> trial_not_eligible
```

Assertions:

- one initial grant only;
- one active Store only;
- losing Store remains ready;
- no unique-index error leaks as the public outcome.

### Same Clerk User, two Organizations

The same synthetic Clerk User concurrently acts as admin in two provisioned
Organizations:

```text
one -> activated
one -> trial_not_eligible
```

Assertions:

- only one initial Clerk User grant exists globally;
- only the winning Organization has an active Store and new initial grant;
- the losing Organization Store remains ready;
- the Clerk User advisory lock, not timing alone, serializes eligibility.

The concurrency suite is mandatory for implementation readiness and is run after a
local database reset/migration application.

## 30. Node test requirements

Focused Node tests must cover application and pure normalization behavior, including:

- unauthenticated;
- no active Organization;
- active Organization member returns `not_admin` and never calls the RPC;
- Organization admin uses the normal Supabase server client;
- malformed Store ID returns `store_unavailable` and never calls the RPC;
- tenant/user/role/plan/timestamps cannot be provided as application arguments;
- every recognized RPC outcome maps to the exact domain result;
- successful ISO timestamps normalize to valid `Date` values;
- malformed successful timestamp throws `StoreTrialActivationError`;
- unknown RPC outcome throws `StoreTrialActivationError`;
- Supabase error throws `StoreTrialActivationError` without leaking the raw message;
- `admin.ts` is not imported or used;
- no service-role credential is used;
- no Store, billing or trial mutation occurs outside the RPC;
- no Stripe client/API is invoked;
- no Server Action, API Route, Proxy or browser client is introduced;
- the public result exposes no internal Organization or Clerk identifiers.

The focused script should follow the current repository convention:

```text
yarn test:store-trial-activation
```

## 31. Frontend integration contract

No frontend implementation is part of this feature.

A future onboarding or Store Setup UI may call the server-side domain operation through
a thin, separately reviewed Server Action. That integration must:

- send only `storeId`;
- treat `activated` and `already_activated` as success;
- display `trialEndsAt` only from the server result;
- handle `not_ready`, `trial_not_eligible` and `store_unavailable` without inferring
  authorization details;
- handle authentication and Organization preconditions explicitly;
- never predict or grant eligibility from client state;
- never mutate Store or billing tables directly;
- never treat a redirect or query parameter as proof of entitlement.

## 32. Store Setup integration contract

The approved sequence is:

```text
createDraftStore()
  -> updateStoreSetup()
  -> markStoreReady()
  -> activateFirstStoreWithInitialTrial(storeId)
```

Store Setup remains responsible for Store data and readiness. Store Trial Activation
remains responsible for historical trial eligibility and atomic first activation.

This feature must not modify Store name/slug/readiness validation or make `ready`
implicit.

## 33. Future generic activation relationship

The future operation:

```text
activateStoreWithinEntitlement(storeId)
```

will be responsible for:

- activating a ready Store under an already valid paid/manual entitlement;
- deriving `maxStores` from the plan registry;
- counting capacity with approved lifecycle semantics;
- serializing all capacity-consuming Store activations with the same Organization lock;
- supporting `essential`, `multi_2` and `multi_3` without inventing feature gates;
- handling sales-assisted 4+ Store scenarios only after separate product approval.

It must not be folded into the initial-trial operation. Conversely,
`activateFirstStoreWithInitialTrial()` must not grow generic paid activation branches.

## 34. Documentation relationships

This feature applies the existing decisions in:

- ADR-001 for Clerk and Supabase responsibility boundaries;
- ADR-002 for Organization/Store authorization boundaries;
- ADR-003 for atomic privileged database RPCs;
- ADR-004 for Organization-owned billing projection and entitlement semantics;
- Billing Foundation SPEC for 15-day local Essential trial semantics;
- Organization Entitlement Resolver SPEC for paid, trial and manual-override facts;
- Store Provisioning / Setup SPEC for Store lifecycle and readiness.

The exact operation name in this document supersedes earlier conceptual names such as
`activateStoreAndStartTrial` for this specific first-Store boundary.

Any earlier planning language that withheld authenticated RPC execution is refined by
this approved design: `authenticated` receives EXECUTE only on this narrow,
JWT-authorized, `SECURITY DEFINER` function. It still receives no generic Store or
billing table write privilege.

No new ADR is required because this feature instantiates already approved boundaries.

After implementation, the minimum documentation follow-up is:

- update `docs/DATABASE.md` with the RPC and lock/atomicity contract;
- update `docs/AUTHORIZATION.md` with the Organization-admin application and database
  checks;
- update `docs/FRONTEND_INTEGRATION.md` with the future thin integration contract;
- update roadmap/current-state documentation only to record actual implemented state.

## 35. Verification plan

Implementation verification must run, in this order where applicable:

```bash
yarn supabase db reset
yarn supabase test db
yarn test:store-trial-activation
yarn test:store-trial-activation:concurrency
yarn test:tenant-provisioning
yarn test:onboarding-state-resolver
yarn test:organization-entitlement
yarn test:store-provisioning-setup
yarn test:stripe-server-foundation
yarn test:stripe-webhook-foundation
yarn lint
yarn typecheck
yarn build
git diff --check
```

Hosted Staging must not be mutated during ordinary implementation verification. Any
future Staging migration application requires an explicit, separately reviewed step.

## 36. Acceptance criteria

The implementation is complete only when:

- only an authenticated active-Organization admin can invoke the mutation path;
- tenant and user identity come exclusively from verified Clerk claims;
- a cross-tenant Store cannot be discovered or mutated;
- exactly one eligible ready first Store and one initial Essential trial commit together;
- the Store and grant share one database timestamp;
- historical Organization and Clerk User trial eligibility is enforced;
- current paid/manual entitlement is not consumed by this specialized operation;
- Store historical activation blocks a new initial trial;
- coherent same-Store retry is idempotent;
- expired/revoked trials never restart;
- same-Organization and cross-Organization races satisfy the approved outcomes;
- no generic table writes are granted;
- no privileged application client or Stripe call is used;
- all focused, concurrency, regression, lint, typecheck, build and diff checks pass;
- the final diff contains only approved implementation, tests and documentation.

## 37. Remaining decisions

None for Store Trial Activation implementation.

The following product/architecture work remains intentionally deferred and does not
block this feature:

- generic paid/manual-entitlement Store activation;
- multi-Store capacity enforcement;
- frontend onboarding integration;
- trial-expiration access UX;
- administrative manual-override workflow;
- Stripe checkout/subscription acquisition;
- sales-assisted 4+ Store handling.

## 38. Implementation readiness

The operation boundary, authority sources, eligibility semantics, transaction model,
lock order, idempotency, concurrency harness, result/error model, migration scope and
verification requirements are approved and sufficiently defined for implementation.

```text
READY FOR STORE TRIAL ACTIVATION IMPLEMENTATION
```
