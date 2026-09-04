# Deli Plus — Organization Entitlement Resolver

**Path:** `docs/features/organization-entitlement-resolver/SPEC.md`<br>
**Status:** Approved<br>
**Scope:** Read-only resolution of normalized Organization entitlement<br>
**Last updated:** 2026-08-25

## 1. Purpose

This feature introduces a server-side, read-only resolver that combines the
current local-trial facts and the current paid-subscription projection for the
active Deli Plus Organization into one normalized entitlement result.

The resolver answers:

```text
valid local trial
OR
valid paid subscription projection
  → normalized Organization entitlement
```

It does not create or modify billing, tenant, Store, order, Clerk, or Stripe
state.

## 2. Architectural context

This feature concretizes the Organization entitlement model approved by
ADR-004. It preserves the tenant, authorization, and trusted-boundary decisions
already established by ADR-001, ADR-002, and ADR-003.

The relevant source-of-truth boundaries remain:

- Clerk is authoritative for authentication, the active Organization, and
  Organization membership;
- PostgreSQL is authoritative for the internal Deli Plus Organization, local
  trial grants, and the webhook-maintained paid subscription projection;
- the existing server plan registry is authoritative for the mapping from
  `planCode` to `maxStores`;
- Stripe is authoritative for its external billing objects, but it is not read
  during normal entitlement resolution;
- Store access remains a separate authorization concern from Organization
  billing entitlement.

Normal request resolution therefore uses only:

```text
Clerk server auth
+ Clerk JWT authenticated Supabase client
+ PostgreSQL billing facts
```

It never calls the Stripe API.

## 3. Approved scope

The future implementation must provide:

- a `PlanEntitlement` model for the three approved plans;
- an `OrganizationEntitlement` discriminated union;
- a server-only `resolveOrganizationEntitlement()` operation;
- explicit authentication and Organization-provisioning preconditions;
- one JWT-scoped database function that exposes only the minimum entitlement
  facts;
- deterministic trial and paid-subscription resolution rules;
- fail-closed validation of all returned facts and persisted domain values;
- focused Node tests;
- pgTAP coverage for the function, grants, isolation, and database-time rules;
- regression verification for the existing Clerk, Supabase, and Stripe
  foundations.

## 4. Explicit non-goals

This feature must not implement:

- trial creation, activation, override creation, or revocation;
- Stripe Customer creation;
- Checkout or Customer Portal flows;
- Stripe Subscription mutation;
- webhook mutation or reconciliation;
- direct Stripe reads on the request path;
- Store reads, counts, activation, creation, or capacity enforcement;
- Store membership or Store-scoped authorization changes;
- order reads, creation, or operational enforcement;
- onboarding state changes, redirects, or UI;
- a browser Supabase entitlement query;
- a Server Action, API Route, or Route Handler;
- a privileged/admin Supabase read;
- generic authenticated access to billing tables;
- new plan codes, feature gates, grace periods, or pricing rules;
- global or cross-request entitlement caching;
- any new environment variable.

## 5. Core resolver contract

The feature must expose a conceptually equivalent operation:

```ts
resolveOrganizationEntitlement(): Promise<OrganizationEntitlement>
```

The operation must be:

- server-only;
- read-only;
- scoped to the active Clerk Organization;
- argument-free with respect to identity, authority, and tenant selection;
- authenticated through `await auth()`;
- connected to Supabase exclusively through
  `createServerSupabaseClient()`;
- backed by the Clerk JWT and the authenticated Supabase role;
- free of Stripe API access;
- free of Store access;
- free of mutations;
- free of module-level mutable request state.

The resolver must not accept any browser- or caller-selected value that can
influence tenant selection, including:

- `organization_id`;
- `clerk_organization_id`;
- `clerk_user_id`;
- `store_id`;
- `stripe_customer_id`;
- `stripe_subscription_id`;
- `plan_code`;
- a subscription status;
- a role or authorization flag.

Possession or knowledge of one of those identifiers must never allow a caller
to resolve another tenant.

## 6. Result model

The normalized result must be equivalent to:

```ts
type PlanEntitlement =
  | {
      planCode: "essential"
      maxStores: 1
    }
  | {
      planCode: "multi_2"
      maxStores: 2
    }
  | {
      planCode: "multi_3"
      maxStores: 3
    }

type OrganizationEntitlement =
  | {
      entitled: false
      reason: "no_entitlement"
    }
  | ({
      entitled: true
      source: "trial"
      validUntil: Date
    } & PlanEntitlement)
  | ({
      entitled: true
      source: "paid_subscription"
    } & PlanEntitlement)
```

Only the valid absence of both an eligible paid subscription and an eligible
local trial may produce:

```ts
{
  entitled: false,
  reason: "no_entitlement",
}
```

Authentication failures, missing active Organization, missing internal
Organization, database failures, invalid facts, and unknown domain values are
errors. They are not `entitled: false` results.

No Organization, Clerk, Stripe, Store, or billing-row identifier is part of the
normalized result.

## 7. Authentication preconditions

`resolveOrganizationEntitlement()` must begin with:

```ts
await auth()
```

The resolver must distinguish these preconditions before creating or invoking
the Supabase client:

```text
no authenticated Clerk user
  → unauthenticated precondition failure

authenticated Clerk user without an active Organization
  → no_active_organization precondition failure
```

Neither condition belongs to `OrganizationEntitlement`.

The early precondition paths must perform:

- no Supabase call;
- no database function call;
- no Stripe call;
- no tenant inference from browser input.

## 8. Organization-provisioning precondition

When Clerk server auth has an active Organization but the database read boundary
finds no corresponding `public.organizations` row, resolution must fail with:

```text
organization_not_provisioned
```

It must not return `entitled: false`, because billing absence can be evaluated
only after the internal Deli Plus Organization exists.

The database function must return zero rows when the JWT has no matching
internal Organization. The application resolver interprets that zero-row result
as this precondition failure after Clerk authentication and active-Organization
checks have already succeeded.

## 9. Precondition error model

The future implementation must define a small server-side exception equivalent
to:

```ts
type OrganizationEntitlementPreconditionCode =
  "unauthenticated" | "no_active_organization" | "organization_not_provisioned"

class OrganizationEntitlementPreconditionError extends Error {
  readonly code: OrganizationEntitlementPreconditionCode
}
```

Requirements:

- codes are stable and safe for trusted server-side coordination;
- the external message is generic;
- errors do not expose internal IDs, Clerk tokens, SQL details, PostgREST
  details, Stripe identifiers, or secrets;
- the class remains distinct from infrastructure/data-resolution failures;
- callers must not convert it into a positive or negative entitlement without
  explicitly handling the precondition code.

## 10. Approved database read boundary

The approved database boundary is a function conceptually named:

```text
public.resolve_active_organization_entitlement_facts()
```

An equivalent name is acceptable only if it preserves the explicit active-JWT
tenant semantics. The preferred name above should be used unless an
implementation-time PostgreSQL naming conflict is found.

The function contract is:

```text
arguments       → none
volatility      → STABLE
security        → SECURITY DEFINER
search_path     → ''
Data API caller → authenticated only
operation       → read-only
cardinality     → zero or one row
```

The function must be introduced by a new forward-only migration. Existing
migrations must not be rewritten.

The application calls it once through the normal Clerk-JWT Supabase client.
The call is expected to use a single-row-aware PostgREST interpretation such as
`maybeSingle()` so invalid cardinality is surfaced as a resolution error.

## 11. Why `SECURITY DEFINER` is required

The four billing tables intentionally remain default-deny for normal
authenticated reads. The resolver needs narrowly selected facts from local
trial grants and the paid-subscription projection without granting generic table
access.

The approved function is therefore a narrowly reviewed exception to the normal
RLS read path:

```text
authenticated Clerk JWT caller
  → zero-argument function
  → tenant derived inside PostgreSQL from verified JWT
  → narrowly selected billing facts
```

`SECURITY DEFINER` is used only to cross the default-deny table boundary for
this read. It must not become a generic privileged query surface or a precedent
for bypassing RLS-backed access for convenience.

## 12. `SECURITY DEFINER` controls

The function must satisfy all of the following controls:

- static SQL only;
- no dynamic SQL, `EXECUTE`, interpolated identifier, or interpolated
  predicate;
- all referenced functions, schemas, tables, columns, operators where
  necessary, and types are fully qualified;
- `SET search_path = ''` in the function definition;
- no caller-controlled tenant or identity arguments;
- no writes, data-modifying CTEs, DDL, notification, external request, or
  side effect;
- no access to unrelated tables;
- no generic billing-table return surface;
- a minimal fixed return shape;
- explicit ownership by the reviewed non-login migration owner `postgres`;
- ownership must not be transferred to `authenticated`, `anon`, or another
  client-facing role;
- `PUBLIC` execute privilege explicitly revoked after creation;
- `anon` execute privilege explicitly revoked;
- `service_role` execute privilege explicitly revoked because this RPC is not
  an admin-client boundary;
- `authenticated` receives the only explicit client-role `EXECUTE` grant;
- no direct billing-table grants are added to support the function;
- the complete definition, owner, volatility, configuration, grants, and
  dependency surface receive pgTAP coverage.

If the target environment cannot preserve the reviewed owner or these grants,
implementation must stop for review instead of weakening the boundary.

The function must be safe to call directly through the Data API with any valid
authenticated Clerk session. Its lack of tenant arguments and its internal JWT
derivation are mandatory database-level protections; application-layer hiding
is not a security control.

## 13. Tenant authority and isolation

The function must derive tenant authority exclusively from:

```text
private.clerk_organization_id()
```

That helper reads the active Organization claim from the Clerk JWT supplied to
the authenticated Supabase request.

The function must map that claim through:

```text
private.clerk_organization_id()
  → public.organizations.clerk_organization_id
  → public.organizations.id
  → tenant-owned billing rows
```

It must never accept:

- internal Organization ID;
- Clerk Organization ID;
- Clerk User ID;
- Stripe Customer ID;
- Stripe Subscription ID;
- any arbitrary record ID used to choose the billing subject.

The following isolation properties are required:

- an authenticated caller can resolve only the active Organization encoded in
  its verified Clerk JWT;
- an Organization A JWT cannot select or infer Organization B entitlement;
- admin and member sessions for the same active Organization resolve the same
  Organization-level billing entitlement;
- a missing or null active-Organization claim produces zero rows at the direct
  database boundary;
- a claim without a matching internal Organization produces zero rows;
- knowing a tenant or provider identifier does not change the query target;
- minimal result fields must not allow correlation to another tenant.

Application `auth()` prechecks improve semantics and error classification, but
they do not replace the database function's independent JWT-scoped tenant
derivation.

## 14. Minimal database result

For a matching internal Organization, the function returns exactly one row with
only these conceptual columns:

```text
trial_plan_code                   text/null
trial_valid_until                 timestamptz/null
subscription_plan_code            text/null
subscription_status               text/null
subscription_collection_paused    boolean/null
```

The result represents:

- the resolved currently valid local-trial candidate, if any;
- the current paid-subscription projection facts, whether or not its status
  currently grants paid entitlement.

The function must not return:

```text
organization_id
clerk_organization_id
clerk_user_id
grant_kind
stripe_customer_id
stripe_subscription_id
stripe_price_id
past_due_since
cancel_at_period_end
current_period_start
current_period_end
webhook data
event IDs
trial history
idempotency data
created_at/updated_at metadata
```

No additional field is required by the approved resolution rules. Any future
addition requires a correctness justification, least-privilege review, updated
database types, and explicit tests before implementation.

## 15. Database cardinality and fact invariants

The database result must obey:

```text
no matching internal Organization
  → zero rows

matching internal Organization
  → exactly one row
```

Within the row:

```text
trial_plan_code IS NULL
  ↔ trial_valid_until IS NULL

subscription_plan_code IS NULL
  ↔ subscription_status IS NULL
  ↔ subscription_collection_paused IS NULL
```

A present trial is represented by a complete trial pair. A present current
subscription projection is represented by a complete subscription triple.

Partial facts, invalid types, duplicate result rows, an impossible current
subscription cardinality, or another invariant violation must fail resolution.
They must not be normalized to absence.

## 16. One statement, snapshot, and round trip

The function must obtain all of the following in one logical PostgreSQL
statement and one Data API round trip:

```text
active internal Organization
currently valid local trial facts
current subscription projection facts
```

All facts must be observed in one statement snapshot. The function must not
perform multiple application-visible PostgREST reads whose results could come
from different snapshots.

The statement must capture one PostgreSQL clock value, conceptually:

```sql
with resolution_clock as (
  select pg_catalog.now() as resolved_at
)
```

and reuse that one value for every trial boundary predicate. JavaScript time
must not decide local-trial validity.

No global cache may be introduced. A future caller may separately evaluate
request-scoped duplicate-call suppression, but cross-request or cross-tenant
cache behavior is outside this feature.

## 17. Trial validity

A local trial grant participates in current entitlement only when all of these
conditions are true at the captured PostgreSQL time:

```text
revoked_at IS NULL
AND starts_at <= resolved_at
AND resolved_at < ends_at
```

The boundaries are intentionally half-open:

```text
starts_at = resolved_at
  → active

ends_at = resolved_at
  → expired
```

The function is read-only. It does not mark a grant expired, revoke a grant, or
change trial history.

Expired, revoked, and future grants remain stored for history and eligibility
auditing but do not participate in current entitlement.

## 18. Multiple valid local grants

The resolution policy for concurrently valid grants is fixed.

### 18.1 No valid grant

Return null trial facts:

```text
trial_plan_code   = null
trial_valid_until = null
```

### 18.2 One or more valid grants with one shared `plan_code`

Return:

```text
trial_plan_code   = the shared plan_code
trial_valid_until = MAX(ends_at)
```

This applies equally to:

- an initial grant plus a same-plan manual override;
- multiple same-plan manual overrides;
- any other valid-grant combination permitted by the existing schema.

`grant_kind` is deliberately not returned and does not establish precedence.

### 18.3 Valid grants with different `plan_code` values

This is a data inconsistency. The database read must fail deterministically, and
the application must expose an `OrganizationEntitlementResolutionError`.

The resolver must not choose automatically by:

- the higher plan;
- the latest start or creation time;
- the latest end time;
- `manual_override` over `initial`;
- the largest `maxStores`;
- any implicit grant ordering.

The conflicting grants remain unchanged for administrative diagnosis. Read
resolution performs no corrective mutation.

## 19. Plan and Store-capacity model

The future implementation must reuse the existing trusted plan registry:

```text
essential → maxStores = 1
multi_2   → maxStores = 2
multi_3   → maxStores = 3
```

`maxStores` is derived in server application code from `planCode`. It is not:

- returned by the database function;
- persisted in the subscription projection;
- accepted from the browser;
- accepted from Stripe metadata as authority;
- inferred through plan-name ordering;
- defaulted when a plan is unknown.

Every non-null trial or subscription plan must be parsed through the existing
registry before entitlement precedence is applied. An unknown persisted plan is
a resolution error and fails closed. `essential` must never be used as a
fallback for invalid data.

The three approved plans share the same principal MVP functionality. This
resolver expresses only plan identity and Store capacity; it must not invent
feature-level differences.

## 20. Paid-subscription resolution

The current subscription projection grants paid entitlement only under these
rules:

| Persisted status     | Grants paid entitlement          |
| -------------------- | -------------------------------- |
| `active`             | Yes, unless collection is paused |
| `past_due`           | Yes, unless collection is paused |
| `trialing`           | No                               |
| `incomplete`         | No                               |
| `incomplete_expired` | No                               |
| `unpaid`             | No                               |
| `canceled`           | No                               |
| `paused`             | No                               |

Stripe `trialing` is not the Deli Plus local trial. The local trial is resolved
only from the local trial-grant facts.

An unknown subscription status is a resolution error. It must not be treated as
paid, trial, or ordinary absence.

The resolver uses only the local projection maintained by the verified webhook
foundation. It must not call Stripe to refresh status during a normal request.

## 21. `collection_paused` rule

The paid candidate is ineligible when:

```text
subscription_status IN ('active', 'past_due')
AND subscription_collection_paused = true
```

No additional grace period is inferred.

`collection_paused` affects only the paid-subscription source. If a valid local
trial also exists, that local trial may still grant entitlement:

```text
paid active/past_due + collection_paused = true
+ valid local trial
  → trial entitlement

paid active/past_due + collection_paused = true
+ no valid local trial
  → no_entitlement
```

A present subscription projection must always provide a real boolean value for
`subscription_collection_paused`. A null value in a present subscription triple
is an invalid partial response.

## 22. `cancel_at_period_end`

`cancel_at_period_end` is not required in the minimum fact model.

While the local subscription projection remains:

```text
active
```

or:

```text
past_due
```

and collection is not paused, paid entitlement remains valid. Effective
cancellation occurs when verified Stripe lifecycle processing updates the
projection status to a non-entitled value.

The resolver must not predict the effective cancellation time from client state
or a redirect parameter.

## 23. Paid-versus-trial precedence

Resolution order is fixed:

```text
1. validate the RPC cardinality and complete response shape
2. validate every non-null plan code
3. validate the subscription status and collection-paused fact
4. validate the trial timestamp and all other invariants
5. determine paid eligibility
6. determine local-trial eligibility from the already database-resolved facts
7. if paid is eligible, return paid_subscription
8. otherwise, if the trial is eligible, return trial
9. otherwise, return no_entitlement
```

All facts and invariants must be validated before precedence is applied. A valid
paid candidate must not hide corrupt trial facts, and a valid trial must not hide
corrupt subscription facts.

Paid precedence is descriptive only. It does not delete, revoke, shorten,
extend, or otherwise modify a trial grant.

## 24. Resolution error model

The future implementation must define a server-side exception equivalent to:

```ts
class OrganizationEntitlementResolutionError extends Error {}
```

It is distinct from `OrganizationEntitlementPreconditionError` and covers at
least:

- Supabase, PostgREST, network, or RPC failure;
- an invalid or unexpected RPC response;
- zero/one-row cardinality inconsistency other than the defined
  not-provisioned zero-row case;
- partial trial or subscription facts;
- unknown trial or subscription `plan_code`;
- unknown subscription status;
- conflicting concurrently valid trial plans;
- an invalid or non-finite trial timestamp;
- a trial `validUntil` value that cannot be represented as a valid `Date`;
- an impossible database/data invariant;
- unexpected multiple current-subscription facts.

Requirements:

- these errors must never be converted to `entitled: false`;
- the external error message is stable and generic;
- raw PostgREST details, SQL text, internal IDs, JWTs, Stripe identifiers, and
  secrets are not exposed to clients;
- the original cause may be retained for safe server-side diagnostics without
  broad logging of response or credential data;
- the resolver fails closed.

## 25. Server and framework boundaries

The public resolver module must import `server-only` and must not be imported by
Client Components.

This feature must not add:

- an API Route or Route Handler;
- a Server Action;
- Proxy database logic;
- a browser Supabase client call;
- a client hook or client component helper;
- a serialized browser authority model;
- a general-purpose entitlement endpoint.

Future consumers are expected to be trusted server-side boundaries. A future
transport must define its own authorization and output contract rather than
exposing this internal resolver automatically.

## 26. Supabase and Stripe client boundaries

The resolver must use only:

```text
createServerSupabaseClient()
  → publishable key
  → Clerk access token
  → authenticated role
  → approved JWT-scoped RPC
```

It must not import or use:

- `lib/supabase/admin.ts`;
- `SUPABASE_SECRET_KEY`;
- a service-role or Secret-key client;
- the Stripe SDK or Stripe server client;
- Stripe API keys;
- the browser Supabase client.

The `SECURITY DEFINER` function is the complete narrow database-read boundary.
The application must not supplement it with direct billing-table reads.

## 27. Organization membership and Store authorization

Entitlement belongs to the Deli Plus Organization, not an individual Clerk User
or Store.

Therefore:

```text
org:admin  ┐
           ├─ same active Organization → same Organization entitlement
org:member ┘
```

The resolver does not inspect Clerk Organization role after authentication and
active-Organization preconditions because role does not change the billing
entitlement.

Equal Organization entitlement does not grant equal Store access:

```text
Organization entitlement
  ≠ Store authorization
```

Clerk Organization admins may later access all Stores in the tenant under the
approved Store rules, while members require explicit `store_memberships`.
Nothing in this feature changes or bypasses that separate boundary.

## 28. No mutations

This feature and its database function are strictly read-only. They must not:

- insert, update, delete, truncate, or lock billing rows for modification;
- create, activate, override, expire, or revoke a trial;
- create or update a Stripe Customer or Subscription;
- mark a webhook event processed;
- reconcile the subscription projection;
- create or activate a Store;
- accept an order;
- repair inconsistent data automatically.

The database function's `STABLE` volatility declaration must match its actual
read-only body. Verification must assert that invoking the function leaves all
relevant tables unchanged.

## 29. Planned implementation shape

The future implementation is expected to use a small structure equivalent to:

```text
lib/billing/
  organization-entitlement.ts
  organization-entitlement.internal.ts

tests/organization-entitlement/
  organization-entitlement.test.mjs

supabase/migrations/
  <timestamp>_organization_entitlement_read.sql

supabase/tests/database/
  organization_entitlement_test.sql
```

The public module owns real Clerk and normal Supabase integration. A small
dependency-injected internal resolver may isolate deterministic normalization
tests without introducing a new test framework or a parallel production API.

The implementation slice must also update, only as required:

```text
lib/supabase/database.types.ts
package.json
```

`lib/supabase/database.types.ts` must be regenerated after the new migration so
the RPC return shape is represented by generated database types. `package.json`
must add only the focused test script:

```text
test:organization-entitlement
```

No file in this section is created or modified by this documentation-only
execution except this SPEC.

## 30. Planned migration

The future migration is limited to the read boundary and its explicit
privileges. It must:

1. create `public.resolve_active_organization_entitlement_facts()` with zero
   arguments;
2. declare it `STABLE` and `SECURITY DEFINER`;
3. set an empty `search_path`;
4. use only static, fully qualified SQL;
5. derive the active Clerk Organization through
   `private.clerk_organization_id()`;
6. resolve the matching internal Organization inside the function;
7. capture one PostgreSQL clock value;
8. aggregate same-plan valid trial grants to `MAX(ends_at)`;
9. fail when concurrently valid trial plans conflict;
10. read the current paid-subscription projection facts;
11. return only the five approved fields and zero or one row;
12. make no data change;
13. explicitly establish the reviewed owner and function-level grants.

The migration must not:

- change billing tables, constraints, indexes, triggers, or existing data;
- add direct billing-table grants;
- add a billing-table RLS policy;
- modify tenant-core RLS;
- alter an existing migration;
- add an admin/service-role execution path;
- create any trial or subscription data.

## 31. RLS and grant model

The current billing-table posture remains unchanged:

```text
PUBLIC        → no billing-table access
anon          → no billing-table access
authenticated → no direct billing-table SELECT or mutation
```

No new billing-table RLS policy is required. RLS remains enabled with no generic
tenant read surface on those tables.

The new capability is function-specific:

```text
PUBLIC        → no EXECUTE
anon          → no EXECUTE
service_role  → no EXECUTE
authenticated → EXECUTE only on the zero-argument entitlement facts function
```

Schema usage needed by the existing Data API posture is not a grant to billing
tables. The function's definer privilege is constrained by its fixed SQL, empty
`search_path`, minimal result, JWT tenant derivation, and explicit execution
grants.

No generic table access is granted as a convenience for tests or application
code. Test fixtures use the privileged local test role.

## 32. pgTAP requirements

Database tests must cover at minimum:

### 32.1 Function contract and security

- the function exists under the expected schema and name;
- the function has zero arguments;
- the return columns are exactly the five approved minimal fields, with the
  expected order and compatible types;
- the function is `STABLE`;
- the function is `SECURITY DEFINER`;
- the function owner is the reviewed `postgres` role;
- the function has an empty/restricted `search_path` in `proconfig`;
- the definition contains no dynamic SQL and references only the approved,
  fully qualified objects;
- `PUBLIC` cannot execute it;
- `anon` cannot execute it;
- `service_role` cannot execute it;
- `authenticated` can execute it;
- authenticated still cannot directly `SELECT` from any billing table;
- the call performs no mutation.

### 32.2 Authentication and tenant isolation

- a JWT without an active Organization resolves zero rows;
- an active Clerk Organization without an internal Organization resolves zero
  rows;
- an Organization A JWT cannot resolve Organization B facts;
- admin and member JWTs for the same active Organization receive identical
  facts;
- there is no overload or authority argument through which a caller can supply
  Organization, Clerk, or Stripe identifiers;
- knowledge of another tenant's identifiers does not alter the result.

### 32.3 Trial time and history

- no valid grant produces null trial facts;
- `starts_at = resolved_at` is active;
- `ends_at = resolved_at` is expired;
- a grant before `starts_at` is not active;
- a grant after `ends_at` is not active;
- a revoked grant is not active;
- expired, revoked, and future grants remain persisted after resolution;
- an initial grant plus a same-plan override resolves the shared plan and
  `MAX(ends_at)`;
- multiple same-plan overrides resolve the shared plan and `MAX(ends_at)`;
- concurrently valid grants with different plans make the function fail;
- the function does not modify grants during any case.

### 32.4 Paid projection and composition

- no current subscription produces null subscription facts;
- each known status is returned intact for application resolution:
  `active`, `past_due`, `trialing`, `incomplete`, `incomplete_expired`, `unpaid`,
  `canceled`, and `paused`;
- `collection_paused = false` and `true` are returned accurately;
- paid and trial facts can be returned together in the same row/snapshot;
- another tenant's subscription cannot affect the active tenant result;
- direct authenticated billing-table reads remain denied after the function is
  introduced.

Fixtures must be created with the privileged local test role, never through
authenticated billing-table writes.

## 33. Node test requirements

Focused application tests must cover at minimum:

### 33.1 Preconditions

- unauthenticated;
- authenticated without an active Organization;
- active Clerk Organization not provisioned internally;
- early preconditions make no Supabase call;
- precondition codes are stable and do not expose tenant details.

### 33.2 Valid absence and trial entitlement

- no trial and no paid projection returns `no_entitlement`;
- a valid Essential initial trial returns Essential with `maxStores = 1` and a
  valid `Date`;
- valid manual overrides resolve:
  - `essential` with `maxStores = 1`;
  - `multi_2` with `maxStores = 2`;
  - `multi_3` with `maxStores = 3`;
- expired trial does not grant entitlement;
- revoked trial does not grant entitlement;
- future trial does not grant entitlement;
- invalid or unparseable `trial_valid_until` fails closed.

### 33.3 Paid entitlement

- active paid `essential`, `multi_2`, and `multi_3` resolve their exact plan and
  Store capacity;
- `past_due` grants paid entitlement;
- `trialing` does not grant paid entitlement;
- `incomplete` does not grant paid entitlement;
- `incomplete_expired` does not grant paid entitlement;
- `unpaid` does not grant paid entitlement;
- `canceled` does not grant paid entitlement;
- `paused` does not grant paid entitlement;
- an unknown status fails closed;
- an unknown plan fails closed with no Essential fallback.

### 33.4 Collection pause and precedence

- collection-paused active/past-due subscription without a valid trial returns
  `no_entitlement`;
- collection-paused active/past-due subscription with a valid trial returns the
  trial entitlement;
- eligible paid plus eligible trial returns paid entitlement;
- paid precedence does not invoke a mutation or change the trial facts;
- all facts are validated before paid precedence.

### 33.5 Invalid data and infrastructure

- conflicting valid trial plans produce
  `OrganizationEntitlementResolutionError`;
- partial trial facts fail closed;
- partial subscription facts fail closed;
- invalid RPC response shape fails closed;
- duplicate/unexpected RPC rows fail closed;
- Supabase/PostgREST failure produces
  `OrganizationEntitlementResolutionError`;
- raw infrastructure detail is not exposed by the public error message;
- genuine errors never become `no_entitlement`.

### 33.6 Boundary constraints

- the resolver accepts no browser-selected tenant authority;
- the real integration uses `createServerSupabaseClient()`;
- the admin Supabase client is not imported or called;
- Stripe is not imported or called;
- no Store table or Store resolver is queried;
- no database or provider mutation is invoked;
- admin and member callers for the same Organization normalize the same facts;
- the module is server-only.

Tests should follow the repository's existing Node test approach and must not
add another test framework.

## 34. Regression verification

The future implementation must run focused and existing application suites:

```bash
yarn test:organization-entitlement
yarn test:stripe-webhook-foundation
yarn test:stripe-server-foundation
yarn test:tenant-provisioning
yarn test:onboarding-state-resolver
```

It must rebuild and test the local database:

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

After local implementation and review, it may validate the pending remote
migration only with:

```bash
yarn supabase db push --dry-run
```

No real remote push is authorized without explicit review.

## 35. Future onboarding integration

This feature must not modify `resolveOnboardingState()`.

Future composition should use a coordinator conceptually equivalent to:

```text
resolveOnboardingState()
  → organization_provisioned
  → resolveOrganizationEntitlement()
```

The future coordinator imports both independent resolvers. Neither resolver
should internally depend on or call the other.

This preserves separate concerns:

- onboarding resolution determines authentication, active Organization, and
  internal provisioning state;
- entitlement resolution determines normalized trial-or-paid access for an
  already provisioned Organization.

Exact future onboarding states, redirects, and UI remain outside this feature.

## 36. Future Store-capacity consumer

The normalized:

```text
planCode
maxStores
```

will be consumed by a future trusted Store-activation boundary. Draft and ready
Store creation/setup does not consume capacity and does not call this resolver.

This feature must not:

- query or count Stores;
- determine whether an additional Store can be activated;
- accept `maxStores` as sufficient authorization;
- activate a Store.

Future capacity enforcement must atomically combine trusted Organization
resolution, normalized entitlement, the approved Store-count semantics, and the
ready-to-active transition. It must count only Stores with `status = 'active'`.
A non-transactional `count → activate` sequence is not sufficient under
concurrency.

## 37. Future order-acceptance consumer

Future order operations that require an operational Organization must
revalidate entitlement server-side through the shared resolver or an approved
transactional boundary that preserves equivalent rules.

This feature does not implement orders.

Public storefront visibility, browser state, cached client flags, or UI
disabling must never replace authorization for accepting a new order. Loss of
entitlement must not delete historical orders or Store configuration.

## 38. Documentation implications

No new ADR is required. This feature concretizes ADR-004 and supplies the
separate `SECURITY DEFINER` security review anticipated by ADR-003 for a narrow
database function.

The future implementation should review and update current-state documentation
only after the behavior exists:

```text
docs/ARCHITECTURE.md
docs/AUTHORIZATION.md
docs/DATABASE.md
docs/DEVELOPMENT.md
```

A small clarification to ADR-003 is optional only if implementation review
finds it necessary to explicitly reference this JWT-scoped, read-only
`SECURITY DEFINER` exception. Such a clarification must not change ADR-003's
central decision that the privileged server client is the default trusted write
boundary.

## 39. Environment and dependencies

This feature requires no new environment variable and must not change:

```text
STRIPE_*
SUPABASE_*
CLERK_*
```

It requires no new runtime or development dependency. The future implementation
must use the Clerk, Supabase, Stripe-projection, Node test, and TypeScript
foundations already present in the repository.

No secret value may be read, logged, committed, included in a fixture, or
reported during implementation.

Stripe Tax configuration is not part of this read-only resolver. Any future
change to billing collection or tax behavior requires its own approved product
and Stripe Tax review; this feature neither enables nor changes tax collection.

## 40. Risks and mandatory mitigations

### 40.1 Definer-privilege expansion

Risk: a `SECURITY DEFINER` function can read data unavailable to its caller.

Mitigation: zero authority arguments, JWT-derived tenant, static and fully
qualified SQL, empty `search_path`, reviewed owner, minimal result fields,
explicit execute revocations, and security-focused pgTAP tests.

### 40.2 Cross-tenant disclosure

Risk: a direct Data API caller attempts to choose another Organization.

Mitigation: the function accepts no tenant identifier and resolves only
`private.clerk_organization_id()` from the verified Clerk JWT.

### 40.3 Fail-open normalization

Risk: corrupt or unknown persisted data is interpreted as ordinary lack of
entitlement or receives an unintended Essential fallback.

Mitigation: validate complete facts and all enums/plans before precedence;
surface a resolution error for every unknown or inconsistent value.

### 40.4 Time-of-check inconsistency

Risk: trial and paid facts are read at different times or trial boundaries use
an application clock.

Mitigation: one RPC, one statement snapshot, one PostgreSQL clock reference.

### 40.5 Stale paid projection

Risk: the local paid state temporarily lags Stripe.

Mitigation: retain the verified webhook and reconciliation architecture. Normal
requests intentionally consume the local projection and do not call Stripe.
Operational freshness monitoring remains a billing-webhook concern, not a new
request-path dependency.

### 40.6 Entitlement confused with Store access

Risk: Organization membership or positive billing entitlement is treated as
automatic access to every Store.

Mitigation: keep Store authorization separate and continue enforcing
`store_memberships` for members under the approved Store access model.

## 41. Acceptance criteria

Implementation is complete only when all applicable criteria are satisfied:

- [ ] `resolveOrganizationEntitlement()` is server-only, read-only, and accepts
      no authority argument.
- [ ] Authentication and active Organization are checked with `await auth()`
      before Supabase access.
- [ ] The three precondition codes are implemented outside the entitlement
      union.
- [ ] An unprovisioned Organization does not become `no_entitlement`.
- [ ] The resolver uses only `createServerSupabaseClient()` and the Clerk JWT.
- [ ] No admin Supabase client or Stripe request is used.
- [ ] The database function has zero arguments, is `STABLE`, is
      `SECURITY DEFINER`, and has an empty `search_path`.
- [ ] The function owner and execute grants match this specification.
- [ ] Tenant authority comes only from `private.clerk_organization_id()`.
- [ ] Organization A cannot resolve Organization B facts.
- [ ] Only the five approved fields are returned.
- [ ] Billing tables remain without direct authenticated `SELECT` or mutation
      privileges.
- [ ] Trial validity uses one PostgreSQL time reference and the approved
      half-open boundaries.
- [ ] Expired, revoked, and future trial history remains unchanged.
- [ ] Same-plan valid grants resolve to `MAX(ends_at)`.
- [ ] Conflicting valid grant plans fail closed.
- [ ] Only `active` and `past_due` can grant paid entitlement.
- [ ] Collection-paused subscriptions do not grant paid entitlement.
- [ ] A valid local trial can still grant when paid collection is paused.
- [ ] Paid has descriptive precedence after all facts are validated.
- [ ] `maxStores` is derived only from the existing plan registry.
- [ ] Unknown plans and statuses fail closed without fallback.
- [ ] Admin and member in the same active Organization receive the same
      Organization entitlement.
- [ ] Store access remains independently authorized.
- [ ] The resolver performs one Data API round trip and no global caching.
- [ ] No Store query or mutation is introduced.
- [ ] Focused Node and pgTAP tests pass.
- [ ] Existing billing, tenant, onboarding, lint, typecheck, build, and database
      regression checks pass.
- [ ] Generated database types reflect the RPC.
- [ ] No new dependency, environment variable, secret, or unrelated feature is
      added.

## 42. Implementation authorization

This specification is approved for a subsequent implementation phase.

It authorizes only the narrow server resolver, the zero-argument JWT-scoped read
function, its generated database types, focused test script/tests, and directly
required current-state documentation updates.

It does not authorize:

- remote database mutation or a real `db push` without review;
- Stripe Dashboard, Product, Price, webhook, Customer, or Subscription changes;
- changes to existing billing-table grants or RLS policies;
- direct authenticated billing-table access;
- trial or subscription mutations;
- Store capacity enforcement, Store creation, or order acceptance;
- onboarding integration or UI;
- new plan, pricing, grace-period, feature-gate, tax, or environment decisions;
- commit, push, merge, rebase, or history rewriting without explicit
  authorization.

Any deviation from the fixed tenant derivation, definer-security controls,
minimal fact model, fail-closed normalization, or read-only scope requires
review before implementation continues.
