# Deli Plus — Stripe Checkout

**Path:** `docs/features/stripe-checkout/SPEC.md`<br>
**Status:** Approved<br>
**Scope:** Organization-admin paid acquisition, canonical Stripe Customer, and durable hosted Checkout attempts<br>
**Last updated:** 2026-09-02

## 1. Purpose and implementation status

This specification formalizes the approved Stripe Checkout architecture audit.
It defines the next backend implementation slice; it does not state that Checkout
is already implemented or authorize implementation during this documentation-only
execution.

The public domain operation is:

```text
createSubscriptionCheckoutSession(planCode)
```

Its responsibility is:

```text
authenticated active-Organization admin
  -> approved PlanCode
  -> existing internal DeliPlus Organization
  -> canonical Stripe Customer ready
  -> durable Checkout attempt
  -> Stripe-hosted subscription Checkout Session
  -> durably correlated checkout URL
```

Checkout does not grant entitlement. Paid access continues to follow:

```text
verified Stripe webhook
  -> current Subscription reconciliation
  -> billing projection
  -> resolveOrganizationEntitlement()
```

## 2. Prerequisite architecture

The audit baseline is branch `feature/stripe-checkout`, commit `50af632`, with a
clean working tree before this SPEC was created. The repository already provides:

- Clerk authentication, active Organization and Organization roles;
- `public.organizations` with unique `clerk_organization_id`;
- normal Clerk-JWT/RLS and separate server-only privileged Supabase clients;
- Organization-owned local trial grants, canonical Customer claims, paid
  subscription projection and webhook ledger;
- server-only Stripe client/configuration and trusted return-origin resolution;
- the closed TypeScript plan registry;
- verified webhook processing and its atomic projection RPC;
- local Organization entitlement resolution and separate Store setup/activation
  boundaries;
- Node built-in tests, pgTAP and a local-only multi-connection `pg` test harness.

The inspected baseline uses Next.js `16.2.6`, `@clerk/nextjs` v7 and Stripe Node SDK
`22.4.0`, whose default API version is `2026-07-29.dahlia`. Retain that reviewed
baseline; dependency/API upgrades require explicit compatibility review.

The existing SDK supports subscription-mode hosted Checkout. Its current hosted
UI literal is `hosted_page`. Do not substitute literals from examples targeting a
different API version.

This SPEC applies ADR-003 and ADR-004. It does not replace Store authorization,
entitlement algorithms, trial eligibility or the webhook's source of authority.

## 3. Approved implementation scope

The subsequent implementation includes:

- one server-only Checkout domain operation;
- Clerk admin authorization and RLS-backed Organization resolution;
- canonical Customer claim/create/finalize and safe recovery;
- one durable Checkout-attempt entity and restricted transactional operations;
- configured Price validation and hosted Session creation/reuse;
- duplicate-subscription prevention across retries and browser tabs;
- explicit business outcomes and sanitized errors;
- generated database types, focused test scripts, Node/mocked tests, pgTAP and
  real local concurrency tests;
- only the configuration/documentation adjustments required by that backend.

## 4. Explicit non-goals

This feature does not implement:

- UI, pricing pages, success/cancel pages, redirects, Server Actions or Route
  Handlers; the future transport contract is documented only;
- Organization provisioning or Clerk configuration changes;
- Store reads, creation, setup, activation, deactivation or capacity enforcement;
- trial creation, extension, restart, revocation or eligibility changes;
- Subscription upgrades/downgrades, cancellation, refunds or duplicate cleanup;
- Customer Portal or an operator/support application;
- Products, Prices, Payment Method Configurations or other remote resource setup
  without a separately authorized configuration/E2E step;
- Stripe trial, remaining-trial credit, annual offerings by assumption, new plans,
  additional-Store billing or sales-assisted implementation;
- Stripe Connect, Elements, Stripe.js, custom payment forms or food-order payments;
- Pix, boleto, delayed payment methods, multiple currencies or Adaptive Pricing;
- automatic tax, coupons, discounts or extra tax-ID/address requirements;
- normal-request Stripe reads, a reconciliation scheduler or background queue;
- generic authenticated billing access, browser Supabase access or Proxy DB logic;
- a new dependency, ORM, validation framework, test framework or infrastructure;
- changes to existing entitlement/trial/Store RPC contracts or RLS policies.

## 5. Billing subject and caller authority

Billing belongs to the internal DeliPlus Organization, never to a Store or the
current Clerk User. The caller selects only an approved `PlanCode`.

The public operation accepts no authority-bearing options object and must not use
caller-provided Organization, Clerk User, role, Customer, Price, Subscription,
amount, currency, interval, quantity, metadata, idempotency key or return URL.

Knowing an internal or provider identifier does not authorize an operation.
Customer/attempt identifiers are internal implementation details, not additional
public selectors. No Store existence or entitlement precondition is required to
buy a subscription.

## 6. Plans and approved MVP commercial configuration

The immutable domain identities and approved capacities remain:

| PlanCode    | Approved presentation name | Active-Store capacity | Approved monthly amount |
| ----------- | -------------------------- | --------------------: | ----------------------: |
| `essential` | Essencial                  |                     1 |                R$ 99,90 |
| `multi_2`   | Duo                        |                     2 |               R$ 189,90 |
| `multi_3`   | Trio                       |                     3 |               R$ 279,90 |

These amounts are final for the MVP. The previous R$ 179,90 entry for Trio was a
typographical error corrected by explicit product approval. Currency is BRL;
billing interval is monthly (`recurring.interval = month`, `interval_count = 1`).
Annual billing remains future scope. Commercial approval does not authorize
creating real Stripe resources during backend implementation.

Presentation names and amounts are not persisted plan identities and must not be
hardcoded into authorization, capacity, idempotency or other domain rules. The
three plans provide the same principal MVP functionality; no feature gates are
invented. Four or more Stores remain contact/sales-assisted.

The architecture supports one approved recurring Price per plan per environment.
Simultaneous monthly/annual offerings require a separate explicit interval-aware
contract. `maxStores` remains derived from the existing plan configuration and is
not stored on an attempt or subscription projection.

## 7. Price authority and catalog validation

Use the existing mapping:

```text
essential -> STRIPE_PRICE_ESSENTIAL
multi_2   -> STRIPE_PRICE_MULTI_2
multi_3   -> STRIPE_PRICE_MULTI_3
```

Before creating new external resources:

1. Validate runtime input through the existing approved plan registry, without
   coercion, marketing-name aliases or an Essential fallback.
2. Resolve the configured Price server-side.
3. Resolve that Price back to a plan and require the same plan. Two plans pointing
   at one Price, unknown mapping or malformed configuration fails closed.
4. In this explicit billing action, retrieve the selected Price and validate its
   identity, `active` state, expected Stripe mode, `currency = brl`, recurring
   structure and compatibility with the reviewed commercial interval.
5. Require the fixed-price, single-item subscription model; do not accept metered,
   tiered or quantity-transformed pricing as a silent substitute.

The approved catalog deployment binds each configured Price ID to its reviewed
commercial amount and exact recurrence (`interval` and `interval_count`). Before
real use, verify that tuple against product approval. An arbitrary syntactically
valid Price ID is not evidence of commercial approval. Runtime validation must
check the returned recurring tuple against the trusted catalog configuration;
the browser never supplies the expected tuple. Tests inject synthetic catalog
configuration. The approved MVP recurrence is `month` with `interval_count = 1`.
Amounts remain commercial Stripe Price configuration, not authorization logic.

The internal configuration contract supplies, per approved PlanCode, the mapped
`stripePriceId`, expected `recurringInterval` and expected
`recurringIntervalCount`. Keep it in the server configuration layer, separate
from the capacity/domain registry. Do not infer the expected recurrence from the
same retrieved Price being validated, which would make that check tautological.
The monthly BRL contract is fixed server-side for all three plans; it does not
require interval/currency environment variables or a monthly/annual selector.

Missing commercial configuration blocks the explicit real Checkout operation,
not imports, unrelated pages, builds or mocked tests. Do not make remote Price
retrieval an import-time or ordinary dashboard operation.

Pending attempts keep their original Price snapshot. Configuration changes must
not rewrite an attempt or bypass its reservation. If the snapshot is no longer
approved/recognizable, require recovery rather than charge under a changed plan.

## 8. Authentication and Organization resolution

The public module imports `server-only` and calls `await auth()` for every
invocation. Follow current mutation result conventions:

1. No authenticated user -> `unauthenticated`.
2. No active Clerk Organization -> `no_active_organization`.
3. Not `org:admin` in that Organization -> `not_admin`.
4. Invalid input plan -> `invalid_plan`.
5. Resolve the internal Organization through `createServerSupabaseClient()`:

   ```ts
   .from("organizations")
   .select("id")
   .eq("clerk_organization_id", verifiedOrgId)
   .maybeSingle()
   ```

6. Successful read with no row -> `organization_not_provisioned`.
7. Database/auth lookup failure, invalid cardinality or malformed data ->
   `StripeCheckoutError`, never ordinary absence.

`verifiedOrgId` comes only from Clerk server auth. The explicit filter complements
RLS. Early auth/role/plan rejection makes no privileged or Stripe call. A missing
internal Organization is never provisioned implicitly with
`ensureActiveOrganization()`.

Only after this boundary may the narrow billing repository instantiate the admin
client. Request authority is never cached globally or shared across tenants.

## 9. Public result and error model

Use the existing mutation convention: expected preconditions/business outcomes
form a discriminated union; infrastructure and impossible invariants throw a safe
typed error.

```ts
type StripeCheckoutPreconditionResult =
  | { status: "unauthenticated" }
  | { status: "no_active_organization" }
  | { status: "organization_not_provisioned" }
  | { status: "not_admin" }

type StripeCheckoutDomainResult =
  | { status: "checkout_ready"; checkoutUrl: string }
  | { status: "invalid_plan" }
  | { status: "already_subscribed" }
  | { status: "billing_recovery_required" }
  | { status: "checkout_in_progress" }
  | { status: "checkout_processing" }

type StripeCheckoutResult =
  | StripeCheckoutPreconditionResult
  | StripeCheckoutDomainResult

createSubscriptionCheckoutSession(
  planCode: PlanCode
): Promise<StripeCheckoutResult>
```

The TypeScript parameter documents the supported caller contract; runtime
validation remains mandatory and must reject malformed JavaScript/form input.

Only `checkout_ready` returns a URL. No result includes internal Organization,
Customer, Price, Subscription or attempt IDs, raw RPC rows or Stripe payloads.

`StripeCheckoutError` uses a stable generic public message. It covers thrown
Clerk/client failures, invalid configuration, transport/Stripe/PostgREST errors,
malformed responses, illegal transitions and invariant violations. A cause may
remain server-side but must not be serialized or broadly logged.

`billing_recovery_required` is a deliberate decision from validated conflicting
external state or an unresolved operation outside safe retry bounds. It is not
a catch-all conversion of unexpected exceptions. `checkout_processing` means a
known Checkout is complete/in progress toward subscription reconciliation; it is
not proof of entitlement.

## 10. Canonical Customer and existing constraints

`public.billing_customers` remains the only canonical Organization-to-Customer
relationship. Reuse its existing columns and constraints:

```text
organization_id             UUID PK and RESTRICT FK to organizations
stripe_customer_id          nullable, unique
provisioning_status         pending | ready
creation_idempotency_key    non-null, unique
created_at / updated_at     database timestamps
ready requires non-null stripe_customer_id
```

The current check permits `pending` with a non-null Customer ID. Treat that as
recovery: retrieve/verify the stored Customer and finalize the same identity if
coherent; never create another Customer. `ready` with no ID is an invariant error.

This feature does not need a new Customer table, claim-ID column, email column,
lease column or a replacement Customer relationship. A random claim identifier
can live within the existing persisted idempotency key.

The new operations enforce immutability of Organization, creation key and any
established Customer ID. `service_role` keeps its existing direct Customer-table
SELECT-only posture; Customer writes go through restricted RPCs.

## 11. Customer claim/create/finalize protocol

### 11.1 Claim

A short transaction, scoped to the already authorized internal Organization,
must:

- acquire the shared Organization lock and revalidate the Organization;
- insert one `pending` row only if absent;
- generate/persist one opaque creation key for a new claim;
- return an existing row/key unchanged on retries and concurrent claims;
- retain original `created_at`; retries do not extend the safe retry window;
- reject conflicting or invalid persisted state rather than replace it.

Use the existing primary/unique constraints as final backstops. Do not implement
an uncoordinated application `SELECT -> INSERT` sequence.

### 11.2 Create or recover outside the transaction

- `ready`: retrieve/validate the canonical Customer when entering the explicit
  billing flow, then reuse it.
- `pending` without ID: create/recover using exactly the persisted key and fixed
  Customer-create parameters, only within the safe retry policy.
- `pending` with ID: reconcile that ID; do not call `customers.create`.

Initial Customer creation omits email and admin-dependent name/contact fields.
Minimal metadata contains the internal Organization reference for diagnostics.
That metadata is not authorization and cannot select the tenant in the webhook.

Validate the returned Customer identity, non-deleted state and expected mode.
Missing/deleted canonical Customers or incompatible environment identity require
recovery, not automatic replacement. Do not let Checkout create a Customer
implicitly and do not call Stripe Customer creation when starting a local trial.

### 11.3 Finalize

Finalize is compare-and-set on the Organization and persisted claim key:

```text
pending + matching claim + compatible stored ID
  -> ready + verified Stripe Customer ID

ready + same claim + same Customer
  -> idempotent success

different claim or different Customer
  -> invariant failure; no mutation
```

Cross-Organization reuse of a Customer is rejected by uniqueness and scoped
checks. The transaction must commit before any Checkout Session is created.
This ordering preserves the webhook requirement for a ready canonical Customer.

## 12. Customer idempotency and retention

Use a stable key with separate operation namespace, conceptually:

```text
deli-plus:customer:v1:<claim-id>
```

Generate a high-entropy UUID once, not on retry. Do not base identity on admin
email, browser session, request timestamp or Preview URL. Keep within Stripe's
key length limit and include no secret/PII in the key.

Customer-create v1 has an immutable parameter recipe derived from the persisted
claim and internal Organization. Changing admins or deployments must not change
that recipe. Unsupported older recipe versions require recovery rather than
replaying a modified request.

Stripe may prune idempotency keys after at least 24 hours; reuse after pruning
can execute a new request. The application must use a conservative retry cutoff,
initially 23 hours from the database claim `created_at`, checked against trusted
time. It must not extend that cutoff using `updated_at`. SDK retry/time budgets
must remain bounded within the safe window. This is a safety cutoff, not a
promise of permanent exactly-once execution. [Stripe idempotency](https://docs.stripe.com/api/idempotent_requests)

When the Customer was created but the response/finalize was lost, replay the same
key/parameters inside the safe window and finalize the recovered Customer. Beyond
the cutoff, an unresolved no-ID claim returns `billing_recovery_required` and
does not issue another create. Known IDs can still be retrieved safely.

Timeouts and `500` responses may have external side effects. Preserve the claim;
do not rotate its key automatically. A definite failure also preserves the claim
and allows only a safe retry of the same operation. Permanent parameter problems
require deliberate recovery, not hidden replacement. [Stripe error handling](https://docs.stripe.com/error-low-level)

Metadata search is diagnostic only. Its eventual consistency means a negative
search result is not proof that no Customer was created. No automatic orphan
cleanup or support workflow is introduced. [Customer Search](https://docs.stripe.com/api/customers/search)

## 13. Durable Checkout attempt: purpose

Introduce `public.billing_checkout_attempts` because a unique Customer and one
local subscription projection do not prevent two payable Checkout Sessions from
creating two external subscriptions.

The enforced invariant is:

```text
at most one non-ended Checkout attempt per Organization
```

It applies across all plans, callers, tabs, processes and deployments sharing
that billing database. An in-memory mutex, local projection check, Stripe read or
Stripe subscription-limiting setting alone is insufficient.

An attempt represents one immutable acquisition intent. It is not a subscription
projection, entitlement grant, webhook ledger or general event store.

## 14. Minimum persisted attempt shape

The forward migration must use this bounded shape, with no full provider payload
or Checkout URL storage:

| Column                            | Type          | Contract                                                                                                               |
| --------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `id`                              | `uuid`        | PK; generated once for the attempt.                                                                                    |
| `organization_id`                 | `uuid`        | NOT NULL; FK to `billing_customers.organization_id`, ON UPDATE/DELETE RESTRICT, transitively owned by `organizations`. |
| `plan_code`                       | `text`        | NOT NULL; one of the three registry codes; immutable.                                                                  |
| `stripe_price_id`                 | `text`        | NOT NULL; approved Price snapshot; immutable.                                                                          |
| `stripe_customer_id`              | `text`        | NOT NULL; canonical ready Customer snapshot; immutable.                                                                |
| `stripe_idempotency_key`          | `text`        | NOT NULL, UNIQUE; stable Checkout operation key.                                                                       |
| `stripe_checkout_session_id`      | `text`        | Nullable, UNIQUE; attach once, never replace.                                                                          |
| `state`                           | `text`        | NOT NULL; closed state vocabulary below.                                                                               |
| `expires_at`                      | `timestamptz` | NOT NULL; immutable planned Stripe expiration, second precision.                                                       |
| `success_url`                     | `text`        | NOT NULL; frozen server-built URL.                                                                                     |
| `cancel_url`                      | `text`        | NOT NULL; frozen server-built URL.                                                                                     |
| `payment_method_configuration_id` | `text`        | NOT NULL; frozen approved configuration ID.                                                                            |
| `integration_identifier`          | `text`        | NOT NULL; generated once, including eight random letters as suffix.                                                    |
| `payload_version`                 | `integer`     | NOT NULL; initially 1, identifying the exact parameter recipe.                                                         |
| `stripe_api_version`              | `text`        | NOT NULL; reviewed API version used for this attempt.                                                                  |
| `livemode`                        | `boolean`     | NOT NULL; expected Stripe environment for replay/validation.                                                           |
| `revision`                        | `bigint`      | NOT NULL, initially 0; monotonically advanced on state-changing writes.                                                |
| `created_at`                      | `timestamptz` | NOT NULL; database time; immutable.                                                                                    |
| `updated_at`                      | `timestamptz` | NOT NULL; existing timestamp behavior.                                                                                 |
| `ended_at`                        | `timestamptz` | Nullable; database timestamp set only on safe closure.                                                                 |

Additional constraints/indexes:

- unique partial index on `organization_id WHERE ended_at IS NULL`;
- an Organization/history index such as `(organization_id, created_at)` to cover
  the FK/history lookup beyond the partial index;
- positive payload version, nonnegative revision and finite coherent timestamps;
- `expires_at > created_at`; no mutable-clock predicate in a CHECK/index;
- controlled nonblank provider ID/key shapes and Stripe key length limit;
- `state = 'ended'` if and only if `ended_at IS NOT NULL`;
- `creating` requires null Session ID;
- `open`, `completed` and `ended` require non-null Session ID;
- `recovery_required` may have a known or unknown Session ID.

The Customer snapshot is validated against the same Organization's ready
canonical row inside claim/reconciliation RPCs. A standalone Customer-ID FK is
not a substitute for that Organization/Customer pair check. No new Customer
column or redundant composite index is required solely for this snapshot.

Use text with CHECK constraints, UUID internal IDs and timezone-aware dates,
matching current schema conventions. Immutable fields and once-attached Session
identity must be enforced by the constrained write operations and a focused
immutable-field guard where required for database-level assertions. Idempotent
no-ops do not rewrite snapshots, revisions or timestamps.

Quantity, Checkout mode, Adaptive Pricing setting and metadata need no duplicate
columns: payload v1 fixes quantity to 1 and derives its bounded metadata from
the immutable identifiers above. No `maxStores`, amount, email, card details,
Subscription payload, generic JSON request bag or attempt lease is required.

## 15. Attempt states and transitions

Persist exactly these local lifecycle states:

| State               | Meaning                                                                         | Reservation |
| ------------------- | ------------------------------------------------------------------------------- | ----------- |
| `creating`          | Durable intent; Session ID not yet attached, including retryable response loss. | Held        |
| `open`              | Known Session last observed open.                                               | Held        |
| `completed`         | Known Session complete; not a paid-entitlement assertion.                       | Held        |
| `recovery_required` | Conflict/uncertainty requires explicit reconciliation.                          | Held        |
| `ended`             | External state was proven safe to close under this contract.                    | Released    |

Allowed transitions:

- `creating -> open | completed | recovery_required`;
- `open -> completed | recovery_required | ended`;
- `completed -> recovery_required | ended`;
- `recovery_required -> open | completed | ended`, only after matching-resource
  reconciliation proves that result;
- `ended` is immutable and never reopened.

A Session recovered already expired can first be attached in
`recovery_required`, then ended after full external/subscription verification.
No-ID attempts are not automatically ended merely because their clock expired.

Every mutating transition compares Organization, attempt ID, expected revision,
current state and existing Session identity under lock. A stale worker must not
overwrite newer state or attach its result to a replacement attempt. A rejected
stale write is followed by a scoped reread: identical already-persisted facts are
idempotent; incompatible facts fail closed. Do not leak raw race/constraint errors.

`ended` is different from Stripe's Session status `expired`. A completed Session
can eventually belong to an ended acquisition attempt after its resulting
subscription is terminal and reconciliation proves replacement safe.

## 16. Attempt claim and immutable replay

After the Customer is ready, the claim transaction:

1. takes the shared Organization lock;
2. revalidates the canonical Customer and local subscription guard;
3. resolves any non-ended attempt;
4. returns the same attempt for the same ongoing intent;
5. refuses to replace an ongoing different-plan intent;
6. otherwise persists the new immutable snapshots, expiration, key and recipe.

Use a distinct key:

```text
deli-plus:checkout:v1:<attempt-id>
```

No new key on refresh, timeout, lost response, tab change or deployment. Never
reuse a Customer key for Checkout, or use only Organization/plan as the key for
all future acquisitions.

For same-plan retries, the persisted parameters win over new candidate values.
A changed origin, Price, configuration or integration version cannot silently
mutate the pending attempt. Reuse it only if still compatible and approved;
otherwise require recovery. New SDK deployments must retain safe replay support
for outstanding recipe/API versions or fail closed, not alter their requests.

Stripe create calls happen outside database transactions. Multiple callers may
converge on the same immutable Stripe operation/key; bounded retries handle
in-flight idempotency conflicts. They must not create independent intents.

## 17. Subscription eligibility matrix and precedence

Checkout eligibility is not entitlement resolution. A valid local trial must not
block acquisition, and an unpaid/non-entitled nonterminal subscription must not
permit another acquisition.

| Validated subscription situation                                                              | Result/behavior                                                                 |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| No subscription and no non-ended attempt                                                      | New Checkout allowed after all guards.                                          |
| Local trial only: active, expired, revoked or absent                                          | Checkout allowed; trial remains unchanged.                                      |
| `active`, including `cancel_at_period_end = true`                                             | `already_subscribed`; no new acquisition.                                       |
| `past_due`                                                                                    | `billing_recovery_required`; no new subscription.                               |
| `unpaid`                                                                                      | `billing_recovery_required`.                                                    |
| `paused`                                                                                      | `billing_recovery_required`.                                                    |
| Stripe `trialing`                                                                             | `billing_recovery_required`; this flow does not create Stripe trials.           |
| `active`/`past_due` with collection paused                                                    | `billing_recovery_required`; no new subscription.                               |
| `incomplete` with the same verified open, payable Session                                     | Resume that Session only.                                                       |
| `incomplete` with known completed Session                                                     | `checkout_processing`; do not create another.                                   |
| `incomplete` without a safely resumable correlated attempt                                    | `billing_recovery_required`.                                                    |
| `canceled` or `incomplete_expired`                                                            | May acquire again only after Session/subscription reconciliation proves safety. |
| Multiple nonterminal subscriptions, unknown status or ambiguous ownership                     | `billing_recovery_required`; no automatic selection/cancellation.               |
| Current owned attempt complete, external subscription present, local projection not caught up | `checkout_processing`, unless an explicit recovery status above applies.        |
| External nonterminal subscription uncorrelated with the expected attempt/projection           | `billing_recovery_required`.                                                    |

For deterministic ordering: validate facts first; ambiguity and collection-pause
recovery take precedence over ordinary `active`; explicit subscription blockers
take precedence over an attempt reuse. If no such blocker exists, an ongoing
different-plan request returns `checkout_in_progress` and receives no URL for
the other plan. Same-plan requests reconcile/resume their existing attempt.

Local stale nonterminal state remains a guard even if Stripe is now terminal;
wait for the existing webhook projection path rather than modifying that
projection from Checkout. A malformed local row is an infrastructure/invariant
error, not an unknown-but-valid business state.

## 18. Duplicate-subscription prevention protocol

Each explicit billing invocation inspects scoped local projection/attempt state.
Before authorizing a new Session, it must also retrieve all relevant subscriptions
of the canonical Customer using `subscriptions.list` with `status = all` and
pagination. Do not inspect only the default/first page or only the selected
Price. Any nonterminal subscription is relevant, including one on an unexpected
Product. Validate ownership/mode/status and apply the matrix.

The complete protocol is:

```text
authorize and resolve Organization
  -> validate plan/config/catalog
  -> inspect scoped local projection/attempt
  -> claim/create/finalize canonical Customer when eligible
  -> reconcile Stripe Customer subscriptions and any known Session
  -> claim/reuse intent under Organization lock, rechecking local blockers
  -> before new Session creation, confirm external guard for the claimed intent
  -> create/recover the one immutable Stripe operation
  -> persist/correlate result with compare-and-set
  -> return only a currently reusable owned Session URL
```

If another caller wins a claim while remote reads are in flight, use the returned
persisted attempt, not the losing candidate. Reconcile it again when necessary.

The partial unique index and stable external operation complement the reads;
reads alone have a check/create race. A webhook can arrive between any network
and database steps: recheck local state under lock and never create a new intent
to hide projection lag. Checkout never invokes the projection writer itself.

The guarantee applies to application-controlled acquisition paths using this
protocol. Dashboard/manual/other-integration creation is an operational risk,
not something a local lock can prevent. Detect conflicts and fail closed; do not
automatically cancel, refund or pick an external subscription. Stripe's optional
subscription-limiting setting is defense in depth, not the primary guarantee.

## 19. Hosted Session configuration

Payload v1 is equivalent to:

```ts
{
  mode: "subscription",
  ui_mode: "hosted_page",
  customer: persistedCanonicalCustomerId,
  line_items: [{ price: persistedApprovedPriceId, quantity: 1 }],
  success_url: persistedSuccessUrl,
  cancel_url: persistedCancelUrl,
  payment_method_configuration: persistedPaymentConfigurationId,
  adaptive_pricing: { enabled: false },
  expires_at: persistedExpirationEpochSeconds,
  integration_identifier: persistedIntegrationIdentifier,
  metadata: {
    organization_id: internalOrganizationId,
    plan_code: persistedPlanCode,
    checkout_attempt_id: internalAttemptId,
  },
  subscription_data: {
    metadata: {
      organization_id: internalOrganizationId,
      plan_code: persistedPlanCode,
      checkout_attempt_id: internalAttemptId,
    },
  },
}
```

All values come from the trusted server/immutable attempt. Metadata is minimal
diagnostic correlation, not webhook tenant authority. Its field names/values
must be stable across retries. Generate the integration identifier once per
attempt with eight random letters as its suffix, not on each request.

Do not send `customer_creation` or rely on implicit Customer creation. Do not send
`customer_email` from the admin. Currency/amount/interval come from the approved
Price, not caller `price_data`. No Stripe trial, automatic tax, promotion codes,
discounts, adjustable quantity, extra items, upsells or automatic
`after_expiration.recovery` Sessions are permitted.

Validate provider responses before use: Session identity, mode, Customer,
environment, expiration and relevant configured payment/price facts must agree
with the attempt. Never treat an invalid response as a successful redirect.
The URL must be the Stripe-returned HTTPS hosted destination (including only an
explicitly approved Stripe custom-domain configuration if adopted later), not
an application/browser-supplied redirect. [Checkout Session API](https://docs.stripe.com/api/checkout/sessions/create)

## 20. Payment Method Configuration and BRL

Require a dedicated, reviewed Stripe Payment Method Configuration for Deli Plus
subscription acquisition. Proposed server-only configuration name:

```text
STRIPE_CHECKOUT_PAYMENT_METHOD_CONFIGURATION
```

It must be active, belong to the correct account/environment and offer only the
approved card methods. Do not fall back to an arbitrary default configuration
when missing. Omit `payment_method_types` per the approved Stripe integration
convention; pass the dedicated configuration reference instead. Validate the
effective Session method contract before exposing its URL. [Payment Method Configurations](https://docs.stripe.com/payments/payment-method-configurations)

Do not enable Pix, boleto or other delayed methods. Changes to the configuration
require review and E2E verification; an unchanged configuration ID is not
permission to enable new methods behind existing code.

Adaptive Pricing remains explicitly disabled. No currency conversion, automatic
tax, coupons or additional tax-ID collection is introduced. Fiscal requirements
and active registrations require separate production review before any future
tax enablement. Retain Stripe's default necessary billing-data collection rather
than inventing a full-address requirement.

## 21. Session persistence and reuse

Persist the returned Session ID on the exact attempt before returning any URL.
Attachment is compare-and-set and idempotent only for the same Session. A second
Session ID for one attempt is an invariant failure, not replacement.

If persistence fails, do not return the URL. On retry:

- known Session ID -> retrieve and reconcile that Session;
- unknown ID within safe replay bounds -> recover with the same creation key and
  exactly the persisted request;
- unknown ID outside those bounds -> `billing_recovery_required`, no new create.

A same-plan request reuses an open/payable Session after checking its Customer,
attempt and subscription context. It returns the same usable Stripe destination.
Refresh, back navigation, tab changes and returning to cancel do not create a
new intent.

Do not persist the Checkout URL: Session ID is sufficient for retrieval during
this explicit action. Do not return completed/expired Session URLs as
`checkout_ready`. Recheck safely after stale CAS outcomes instead of returning a
URL from an outdated response. Completion racing after the final read is handled
by Stripe/the next reconciliation; it must not cause a second acquisition.

## 22. Expiration, completion and safe closure

Use a one-hour initial expiration, derived once from database time at attempt
creation and persisted with second precision. The inspected Stripe API accepts
expiration between 30 minutes and 24 hours from Session creation. Keep creation
and retry budgets within those bounds. A retry must not refresh expiration to
make an old payload valid again.

Local elapsed time, a cancelled browser navigation or a worker timeout is not
proof that an external Session is unpayable.

Automatic closure requires all of:

1. A known Session re-retrieved from Stripe and verified as belonging to this
   Customer/attempt/environment.
2. It is expired, or complete with its resulting subscription terminal.
3. A current paginated Customer subscription read reveals no nonterminal or
   ambiguous subscription, and the correlated completed-Session subscription is
   accounted for rather than assumed absent.
4. The local projection has no nonterminal blocker.
5. Under the shared Organization lock, the same attempt/revision/Session remains
   current; recheck the local guard before setting `state = ended` and `ended_at`.

Only after that commit can another attempt/key be claimed. Never reopen an old
attempt. A completed attempt may stay reserved while the subscription is active
and be safely ended on a later explicit acquisition after effective cancellation.

No-ID indeterminate attempts remain reserved for explicit recovery, including
when their planned expiration has passed. Missing/mismatched provider objects
do not prove safe replacement. Automated `sessions.expire`/`sessions.list` are
not required by the baseline; add them only for a concrete reviewed recovery
branch, never to silently switch plans. Stripe-confirmed expiration prevents
completion; requesting expiration alone is not sufficient if it raced payment.
[Session expiration](https://docs.stripe.com/api/checkout/sessions/expire)

CAS fences database responses, not remote HTTP side effects. Do not release an
unknown operation on a lease timeout or assume an old worker disappeared. Stable
keys, bounded replay, frozen expiration and external reconciliation are separate
mandatory protections. No permanent cross-system exactly-once guarantee is claimed.

## 23. Failure and recovery matrix

| Failure point                                          | Required behavior                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Clerk/config/Organization resolution fails             | Safe error/precondition; no external creation.                                 |
| Customer claim fails                                   | No Stripe create.                                                              |
| Customer create fails definitively                     | Preserve pending claim/key; safe same-operation retry only.                    |
| Customer response lost                                 | Replay same key/parameters within cutoff; no second claim.                     |
| Customer finalize fails                                | Recover the same Customer, then retry finalize; no Session yet.                |
| Pending Customer already has an ID                     | Verify/reconcile that ID; never create another.                                |
| Canonical Customer deleted or incompatible             | `billing_recovery_required`; no replacement.                                   |
| Attempt claim fails                                    | No Session create.                                                             |
| Session create times out/returns indeterminate failure | Preserve reservation/key; bounded same-operation recovery.                     |
| Session created, DB attachment fails                   | Do not return URL; recover the same Session and persist.                       |
| Session persisted, browser response lost               | Retrieve/reuse the same open Session.                                          |
| Session complete, webhook lagging                      | `checkout_processing`; no projection mutation.                                 |
| Attempt safely expired/terminal                        | Reconcile, close by CAS, then allow a fresh attempt.                           |
| Stale worker returns                                   | Reject stale transition; reread without overwriting current state.             |
| Old indeterminate no-ID operation                      | `billing_recovery_required`; no automatic key rotation or reservation release. |
| Multiple nonterminal subscriptions                     | `billing_recovery_required`; no automatic cancellation/refund.                 |

Do not keep unbounded retry loops or sleep while holding DB locks. Use bounded
SDK retries/backoff for recoverable conflicts/network errors. When safe recovery
cannot be proven, stop rather than manufacture a new operation. Operator tooling
is deferred; a safe recovery-required outcome is an intentional MVP limitation.

## 24. Multiple browser tabs

```text
same Organization + same plan
  -> same non-ended attempt
  -> same immutable key
  -> same Session

same Organization + different plan while attempt is ongoing
  -> checkout_in_progress
  -> no replacement or other-plan URL

different Organizations
  -> independent Customer claims and attempts
```

Role and active Organization are rederived for each request. Two admins of one
Organization share its billing identity, not separate Customers. A change of
active Organization in another tab must never make a stale browser identifier
select the prior tenant. A future screen must display its current verified
Organization context and request fresh server state when that context changes.

## 25. Trusted database boundary and RPC security

Use this split:

```text
Clerk server auth
  -> normal Supabase/JWT/RLS Organization resolution
  -> server-only billing application service
  -> narrow billing repository
  -> admin Supabase client
  -> restricted transactional billing RPCs
```

Narrow privileged reads of the same Organization's Customer, attempt and current
subscription projection are justified for this explicit write/recovery workflow.
They do not replace `resolveOrganizationEntitlement()` on ordinary requests.

Customer/attempt transactional operations use `VOLATILE`, `SECURITY DEFINER`,
reviewed owner `postgres`, `SET search_path = ''`, static SQL and fully qualified
objects/types/functions. No dynamic SQL or network calls.

Execution posture for every new server-internal RPC:

```text
PUBLIC        -> denied
anon          -> denied
authenticated -> denied
service_role  -> EXECUTE only on the required narrow operations
```

Private helper/trigger functions are not Data API capabilities. Revoke default
EXECUTE explicitly. Enable RLS on the new table, without generic policies or
`FORCE ROW LEVEL SECURITY`, following the billing foundation. Revoke direct
table access from `PUBLIC`, `anon` and `authenticated`; explicitly restrict
`service_role` on the new table to SELECT, with writes only through these RPCs.

Preserve existing Customer SELECT-only privileges and unrelated webhook/table
grants. Do not grant generic Customer/attempt INSERT, UPDATE, DELETE, TRUNCATE,
REFERENCES or TRIGGER to `service_role` for convenience.

These RPCs deliberately receive trusted internal Organization context from the
already authorized application, unlike authenticated Store RPCs that derive
Clerk claims in SQL. The admin client carries no Clerk access token. SQL must not
pretend to authenticate the admin or accept a caller-supplied `isAdmin` flag.
Its security boundary is restricted execution plus fixed scoped operations and
the application authorization contract. Tests must prove both layers separately.

## 26. Restricted operation contracts

Plan five bounded database operations, named at implementation consistently with
the repository:

| Operation                    | Trusted input and required behavior                                                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claim canonical Customer     | Internal Organization; atomically create/reuse the canonical pending/ready claim and its key.                                                            |
| Finalize canonical Customer  | Organization, expected claim key, verified Customer ID; idempotent CAS, no replacement.                                                                  |
| Claim/reuse Checkout attempt | Organization and server-built immutable intent; require ready matching Customer, recheck local subscription, enforce one non-ended attempt across plans. |
| Attach/reconcile Session     | Organization, attempt, expected revision, matching provider evidence; attach once and perform only the allowed state transitions.                        |
| End externally safe attempt  | Organization, attempt, revision, Session and narrowly normalized safety facts from reconciliation; recheck local blockers and close atomically.          |

No operation is generic billing CRUD or accepts arbitrary update objects/SQL.
Every attempt operation scopes by both Organization and attempt, and checks the
canonical Customer snapshot. Return only the bounded claim/attempt fields needed
by the server workflow and a controlled internal outcome; never pass those raw
results through the public domain API.

SQL cannot verify Stripe network truth. Safety facts accepted by the close RPC
are trusted server-internal evidence, not a browser assertion. The service must
perform the external checks immediately before the guarded transition; the RPC
checks its local part. A DB flag alone cannot prove no external subscription.

## 27. Lock order, atomicity and clocks

Every Customer/attempt transaction uses the existing Organization lock:

```sql
pg_catalog.pg_advisory_xact_lock(
  pg_catalog.hashtextextended(internal_organization_uuid::text, 0)
)
```

Order: resolve trusted Organization -> advisory lock -> lock/revalidate
Organization -> canonical Customer -> current attempt -> read/recheck local
subscription guard. Keep a consistent order in all new functions. Do not lock
Store rows, trial grants or webhook ledger rows in Checkout transactions.

The same Organization namespace is already used by webhook projection and Store
activation. Reuse it rather than invent a competing checkout-only namespace.
Hash collisions may conservatively serialize unrelated Organizations; they do
not establish ownership or replace the unique constraints.

Capture transaction decision time after lock waits. Reuse the established
timestamp helper for immutable `created_at`/updated timestamps where appropriate.
All dates used for attempt creation/closure are server/database-derived, never
caller timestamps.

No Stripe request occurs inside a PostgreSQL transaction. The full workflow is
a small recoverable saga, not one distributed transaction:

```text
claim Customer -> Stripe create/recover -> finalize Customer
claim attempt  -> Stripe create/recover -> attach/reconcile Session
```

## 28. Webhook and entitlement compatibility

Retain the existing event set:

```text
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.paid
invoice.payment_failed
```

The reducer expects one recurring item, quantity 1 when provided, a recognized
Price/plan/status and the item-level `current_period_end`. Checkout supplies
quantity 1 explicitly. The canonical ready Customer exists before Session
creation, so early Subscription events can resolve ownership.

Metadata never selects the Organization in webhook processing. Its authoritative
correlation remains `billing_customers.stripe_customer_id`. Preserve the atomic
event-ledger/projection RPC and its handling of competing nonterminal subscriptions.
Detection there is not a replacement for acquisition prevention here.

Checkout does not write `billing_subscriptions` or `stripe_webhook_events`, call
the projection RPC, or grant paid state based on its Stripe reads. Attempt state
is separate from the paid projection. No webhook change is required by this
card-only contract; report a concrete incompatibility before widening that scope.

Do not add async Checkout events while delayed methods are disabled. Adding such
methods later requires webhook support and tests first. Do not make ordinary
dashboard, Store, order or entitlement requests call Stripe.

## 29. Local trial and Store boundaries

Checkout is allowed during a local trial, after it or without one. It never sets
`trial_period_days`/`trial_end`, credits unused days or writes local grant dates.

The local 15-day no-card Essential trial still grants full Essential functionality
with one active Store. Paid entitlement has the existing descriptive precedence;
capacity is never added to trial capacity. Checkout does not predict that result.

No Store read/count/mutation is necessary. Purchasing a plan does not activate a
Store, change lifecycle timestamps, assign membership or enforce active-Store
capacity. Those existing boundaries and their tests remain unchanged.

## 30. Return origin and future route contract

Use the existing trusted origin resolver:

- explicit `BILLING_RETURN_ORIGIN` for stable deployments;
- approved Vercel Preview fallback using the system `VERCEL_URL` only when
  `VERCEL_ENV = preview`;
- HTTPS except the existing HTTP `localhost` allowance;
- origin validation excluding credentials, paths, query and fragment;
- never request `Host`, `Origin`, forwarded-host or browser URL authority.

Freeze these fixed-path URLs in each attempt:

```text
success -> /dashboard/billing/success
cancel  -> /dashboard/billing
```

No initial `session_id` query parameter. If introduced later, it is only a
reconciliation hint and requires server verification of attempt/Customer/tenant
ownership before any use.

These paths are future integration contracts. This backend feature creates no
page, redirect, Action or Route Handler. A functioning return-page experience is
a separate UI rollout prerequisite, not evidence that entitlement must be
implemented on the return page.

## 31. Post-Checkout consistency and future transport

The webhook may arrive before redirect, after redirect, or without redirect.
Correctness cannot depend on navigation.

A future authenticated success page reads local state:

```text
entitlement source = paid_subscription
  -> paid subscription recognized

trial entitlement or no paid projection yet
  -> processing/pending, not payment proof

read failure
  -> error, not success or ordinary absence
```

`entitled: true` alone is insufficient because it can represent a local trial.
Do not say payment was received merely because a success URL was visited. No
unnecessary Stripe Session retrieval on ordinary page renders; no tight polling
is required. Cancel navigation does not cancel Subscription, expire Session or
end the attempt.

Future dashboard transport should be a thin Server Action:

```text
form -> Server Action -> domain operation -> redirect(checkoutUrl)
```

Authorization stays inside the domain function even if UI/layout/Proxy already
checked it. Do not create resources during rendering or GET. No additional Route
Handler is justified without an actual API consumer. The adapter returns only
safe results, never repositories/admin clients or raw error causes. Action/UI
implementation requires separate approval.

## 32. Proposed migration and application files

One new forward-only migration, with its timestamp selected at implementation,
must introduce only:

- `billing_checkout_attempts`, the specified constraints/indexes and narrow
  immutable/timestamp guards;
- Customer claim/finalize and attempt claim/reconciliation/closure operations;
- required private helpers, ownership, comments, RLS, revokes and EXECUTE grants.

Do not rewrite old migrations, create remote resources, backfill invented
Customers/subscriptions, widen tenant-core grants, or modify trial/Store/
entitlement logic. Existing billing Customer columns remain sufficient.

Expected minimal application layout:

```text
lib/billing/subscription-checkout.ts
lib/billing/subscription-checkout.internal.ts
lib/billing/subscription-checkout.repository.ts
lib/stripe/checkout.ts

tests/stripe-checkout/stripe-checkout.test.mjs
tests/stripe-checkout/stripe-checkout.concurrency.test.mjs
supabase/tests/database/stripe_checkout_test.sql
supabase/migrations/<timestamp>_stripe_checkout.sql
```

The facade owns real Clerk integration; the internal service uses the existing
dependency-injected testing pattern; the repository owns privileged persistence;
the Stripe adapter owns only actual provider operations. Avoid a parallel billing
framework or generic repository.

Update `lib/stripe/config.ts`/`config.internal.ts` only as required for the new
configuration contract. Regenerate `lib/supabase/database.types.ts` from the local
migrated schema. Add focused scripts `test:stripe-checkout` and
`test:stripe-checkout:concurrency` to `package.json`; use the installed Node/pg
tooling and Yarn. No dependency installation or competing lockfile is needed.

## 33. Node test requirements

The focused suite must cover:

### Authority and results

- all four Clerk/Organization preconditions, including rejected members;
- auth exceptions normalized as safe errors;
- the three valid PlanCodes and unknown/malformed/marketing-name/Price inputs;
- no caller authority for Organization, Customer, Price, Subscription, role,
  quantity, amount, currency, interval, metadata, key or URLs;
- normal RLS Organization lookup; no implicit provisioning;
- no privileged/Stripe work on early denial;
- every declared result, exact success shape and no identifier/object leakage;
- malformed RPC responses and true infrastructure failures never become absence.

### Catalog and Customer

- plan-to-Price round trip, ambiguous configuration and wrong catalog recurrence;
- wrong mode, inactive/non-BRL/nonrecurring/incompatible Price rejection;
- ready Customer reuse and pending claim creation/recovery;
- pending with ID never calls create;
- same claim/key across retries and concurrent admins;
- deterministic Customer parameters with omitted personal email;
- create failure, lost response, finalize failure and matching retry;
- different Customer finalization and cross-Organization ownership rejection;
- deleted/missing Customer, retention cutoff and no blind key rotation.

### Attempts and provider flow

- complete subscription matrix, including collection pause and terminal recovery;
- pagination catches nonterminal subscriptions beyond the first page;
- multiple/unknown external states fail closed;
- same-plan replay, cross-plan `checkout_in_progress` and independent tenants;
- frozen origin/Price/config/API/payload parameters across retries;
- correct hosted subscription mode, quantity 1 and approved Price;
- dedicated approved payment configuration and Adaptive Pricing disabled;
- no Stripe trial, tax, discounts, extra items or automatic recovery Session;
- Session persistence precedes URL return;
- lost Session response/attachment and same-Session recovery;
- open reuse, completed processing, expiration and safe closure;
- no local-time-only closure, unknown-ID release or stale-worker overwrite;
- no trial, Store, entitlement or subscription-projection mutation;
- no imports/network work from ordinary page/build paths.

## 34. pgTAP requirements

Test at minimum:

- exact table columns/types, nullability, PK/unique/CHECK/FK contracts;
- ON UPDATE/DELETE RESTRICT and indexed Organization lookups;
- one non-ended attempt per Organization, including different plans;
- RLS enabled, no generic policies/direct API access;
- no generic writes through `authenticated`, whether admin or member;
- reviewed function owners, volatility, static SQL and empty `search_path`;
- EXECUTE denied to PUBLIC/anon/authenticated, granted only to service_role on
  the new required operations; private helpers not exposed;
- Customer direct SELECT-only service_role regression remains intact;
- idempotent Customer claim/key and finalization;
- conflicting Customer finalization and duplicate cross-tenant Customer rejected;
- attempt claim/reuse with matching ready Customer;
- plan/key/Customer/Price/config/expiration snapshots immutable;
- attach same Session idempotent, attach different Session rejected;
- expected-revision CAS, valid state edges, late-worker response rejection;
- safe close rechecks local blockers and never reopens an ended attempt;
- Organization A context cannot attach/close Organization B's attempt;
- no modifications to trial, Stores, entitlement contracts or webhook ledger.

SQL does not call Stripe. Tests of safe closure supply trusted normalized
reconciliation evidence and verify local invariants; Node tests prove evidence
originates from provider checks, not browser input. Do not claim pgTAP proves
remote billing truth or Clerk authorization for service-only RPCs.

Create fixtures with the privileged local test role. Synthetic Clerk claims are
used for denial/isolation regressions, not to grant authenticated billing writes.
Run all existing pgTAP suites, not only the new file.

## 35. Real local concurrency requirements

Sequential pgTAP is not sufficient. Reuse the local-only Node `pg` harness with
independent connections, committed fixtures and deterministic lock barriers.
Use an observer to prove blocked contenders; arbitrary sleeps alone are not proof.

Required scenarios:

- two same-Organization Customer claims converge to one row/key;
- same-Customer finalization retries converge; conflicting finalization loses;
- same Organization/same plan produces one attempt and one external operation;
- same Organization/different plans produces one winner and one conflict;
- different Organizations remain independent;
- Session response/attachment lost while another caller retries;
- expiration/reconciliation races completion and replacement;
- a stale worker cannot attach to an ended/replaced attempt;
- Checkout guards racing the existing webhook projection use the shared lock and
  observe a valid serialization, without writing projection from Checkout.

Combine real local RPCs with a deterministic Stripe fake that models idempotency
and controlled response loss. Assert persisted rows and external object counts,
not only promise return values. Target only localhost/loopback Supabase; reject
hosted connection URLs. Never read `.env.local`, print credentials, or add test
hooks to production functions. No real Stripe network in this harness.

## 36. Stripe mocked integration requirements

Mock exactly the adapter operations used, initially:

```text
customers.create
customers.retrieve
prices.retrieve
subscriptions.list
checkout.sessions.create
checkout.sessions.retrieve
```

Add Session expire/list mocks only if an approved implementation branch uses
those APIs. Assert exact important parameters and request-option idempotency keys,
including stable metadata, integration identifier and expiration. Assert no
`subscriptions.create`, Portal, Product, Price or payment-method configuration
mutation.

Exercise retryable in-flight conflicts, network timeouts, cached/indeterminate
failures, response loss, wrong identity/mode and invalid response shapes. Regular
tests must not require real API keys, Products, Prices or network access.

## 37. Real Stripe Test/Sandbox E2E gate

Real E2E is separate from deterministic implementation verification. Prerequisites:

- the approved monthly BRL amounts from section 6 configured on matching Prices;
- explicit authorization to create Test Products/Prices and the dedicated
  card-only Payment Method Configuration;
- correct isolated Test configuration, local Supabase migrations and Clerk admin;
- Stripe CLI forwarding to the existing webhook with matching endpoint secret;
- a controlled server-side invocation of this domain operation, without exposing
  an unreviewed temporary public endpoint;
- the separately approved return-page/transport integration before claiming a
  complete customer-facing journey.

Validate:

```text
Clerk admin -> Deli Plus domain operation -> Stripe hosted Checkout
  -> test card -> verified webhook -> subscription projection
  -> entitlement source paid_subscription
```

Cover every plan, success, decline/authentication-required cards, retries, two
tabs, webhook before/after/no redirect, replay and Customer/Session correlation.
Test conversion during/after/no trial and verify trial dates and Store rows do
not change. Exercise existing-subscription rejection/recovery without opening a
second subscription.

Missing real catalog configuration does not block backend implementation/mocked tests.
It does block real E2E and production enablement. Report E2E as pending, not passed,
until those authorized checks actually run.

## 38. Environment and catalog lifecycle

Existing server-only configuration:

```text
STRIPE_SECRET_KEY
STRIPE_PRICE_ESSENTIAL
STRIPE_PRICE_MULTI_2
STRIPE_PRICE_MULTI_3
BILLING_RETURN_ORIGIN
STRIPE_WEBHOOK_SECRET
```

Checkout needs the server API key, selected approved catalog mapping, trusted
origin and dedicated `STRIPE_CHECKOUT_PAYMENT_METHOD_CONFIGURATION`. All three
plan mappings and reviewed recurrence configuration must be complete before
offering all plans. The webhook secret is required for end-to-end paid projection,
not as Customer/Session-create authority. Existing Clerk/Supabase configuration,
including server-only `SUPABASE_SECRET_KEY`, remains necessary.

No `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is required. Keep configuration lazy and
secrets server-only; prefer a restricted Stripe key with tested minimal permissions
for the operations actually used. Use ignored local configuration or sensitive
hosted environment storage, never repository values, logs or snapshots.

The future implementation may add only empty approved placeholders to
`.env.example` when needed. This documentation execution changes no env file.

| Environment | Stripe                                             | Database            |
| ----------- | -------------------------------------------------- | ------------------- |
| Local       | Dedicated Test/Sandbox, CLI forwarding             | Supabase Local      |
| Staging     | Dedicated Test/Sandbox, stable webhook destination | Supabase Staging    |
| Production  | Live resources and production webhook destination  | Supabase Production |

Never mix Test/Live keys, Customers, Prices, Sessions, subscriptions, webhook
secrets or projections. Prefer distinct Local/Staging sandboxes to avoid delivering
events to databases without their canonical Customer relation. Ephemeral Previews
must not become independent webhook writers against shared Staging. Prefer a
stable billing origin when they share durable attempts; origin changes cannot
reset acquisition identity.

Create one Product per selectable plan and a recurring Price for its approved
interval/environment only after final commercial approval. Product display names
may use Essencial/Duo/Trio without changing internal codes.

Changing a monetary price creates a new Stripe Price, not a new PlanCode. Existing
subscriptions keep historical Price associations. Before rotating mappings for
real subscribers or outstanding attempts, preserve an explicitly reviewed
historical Price-to-plan mapping so the current webhook does not reject legitimate
old Prices. This feature does not implement repricing, subscription migration or
upgrade/downgrade flows.

## 39. Customer Portal relationship

Checkout is acquisition. Existing paid/nonterminal subscriptions use future Portal
or explicit recovery/change boundaries, not a second acquisition Session.

Portal will separately address payment-method management, invoices and approved
cancellation behavior. Plan changes remain disabled until their own product and
capacity implications are approved. This SPEC creates no Portal Session or UI.

## 40. Verification plan for implementation

After the future migration, apply/reset only the authorized local test database,
regenerate database types, and run:

```bash
yarn supabase db reset
yarn supabase test db
yarn supabase db lint --local
yarn test:stripe-checkout
yarn test:stripe-checkout:concurrency
yarn test:stripe-server-foundation
yarn test:stripe-webhook-foundation
yarn test:organization-entitlement
yarn test:store-provisioning-setup
yarn test:store-trial-activation
yarn test:store-trial-activation:concurrency
yarn test:store-entitlement-activation
yarn test:store-entitlement-activation:concurrency
yarn test:tenant-provisioning
yarn test:onboarding-state-resolver
yarn lint
yarn typecheck
yarn build
git diff --check
```

Local resets destroy local test data and require applicable authorization. No
reset is performed by writing this SPEC. After local review, only
`yarn supabase db push --dry-run` may be used for remote migration inspection;
real Staging/Production application requires separate explicit approval.

Record actual command results, skips and infrastructure blockers. Do not claim
tests or real Stripe E2E passed because their plan exists. Verify the diff contains
no UI, secrets, competing lockfiles, unrelated grants or adjacent product work.

## 41. Documentation relationships and scope control

This document is the only required change in the documentation-only execution.
ADR-003 already permits reviewed atomic RPCs; ADR-004 already establishes durable
Customer claims, Organization billing and webhook authority. No new ADR or
reconciliation edit to those ADRs is necessary for this contract.

The operation name here concretizes earlier conceptual Checkout names. The
durable attempt refines the paid-conversion slice without changing entitlement
or the responsibilities of the four existing billing tables.

After implementation, update only directly affected current-state architecture,
database, authorization, development and frontend integration documentation.
Do not describe Customer/Checkout creation or the new table as implemented before
that work is delivered and verified.

## 42. Risks and mandatory mitigations

| Risk                                        | Required mitigation                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Duplicate external acquisition              | One durable non-ended intent, stable Stripe operation and local/external guards.           |
| Retention expiry/indeterminate side effects | Bounded replay; preserve reservations; explicit recovery, no blind new key.                |
| Stale worker                                | Scoped revision CAS plus external lifecycle/idempotency protections.                       |
| Config drift during an attempt              | Immutable snapshots and versioned replay; fail closed on incompatibility.                  |
| Incorrect catalog/methods                   | Approved deployment catalog, runtime validation and dedicated reviewed card configuration. |
| Privileged DB misuse                        | Clerk/RLS tenant resolution, narrow repository, service-only RPCs and security tests.      |
| Webhook lag                                 | Processing outcome; no redirect entitlement or Checkout projection writer.                 |
| Manual external Subscription creation       | Operational controls and conflict detection; no silent cancellation/refund.                |
| Price rotation breaks old subscriptions     | Reviewed historical mapping before rotation; stable PlanCodes.                             |
| Test/Live or shared-sandbox mismatch        | Separate resources/destinations and explicit mode/identity checks.                         |
| Permanent unresolved attempt                | Deliberate recovery-required result; operator workflow remains a separate feature.         |

## 43. Acceptance criteria

- [ ] Only an authenticated active-Organization admin reaches billing mutation.
- [ ] Caller authority is limited to a runtime-validated PlanCode.
- [ ] Organization resolution is RLS-backed and missing tenants are not provisioned.
- [ ] Catalog validation preserves three plans, BRL and the approved recurrence.
- [ ] Commercial names/amounts do not become domain identity or capacity logic.
- [ ] Customer claims/finalization converge without replacing canonical identity.
- [ ] Pending-with-ID and lost-response/finalize recovery never create another Customer.
- [ ] Customer is ready before Session creation.
- [ ] One non-ended attempt per Organization is enforced across plans.
- [ ] Replay parameters/keys are immutable and versioned.
- [ ] Same-plan retries reuse the Session; different-plan requests do not replace it.
- [ ] Session identity is persisted before any URL is returned.
- [ ] Existing-subscription matrix and paginated external checks prevent fresh acquisition when blocked.
- [ ] Local timeout/cancel/lease expiration never silently releases uncertain work.
- [ ] Safe closure and stale-worker CAS pass real concurrency tests.
- [ ] Hosted Checkout uses one recurring item, quantity 1 and approved card configuration.
- [ ] No trial, tax, discounts, extra methods or automatic currency conversion is enabled.
- [ ] No ordinary request calls Stripe; no new Checkout projection writer exists.
- [ ] Trial, entitlement, Store lifecycle/capacity and webhook contracts remain intact.
- [ ] RPCs/table grants/RLS preserve the least-privilege boundary and tenant isolation.
- [ ] Results/errors expose only safe outcomes and the validated hosted URL.
- [ ] Generated types and focused/regression verification pass with actual evidence.
- [ ] Real E2E is either executed under its prerequisites or explicitly reported pending.
- [ ] No UI, remote resource setup, real remote migration push or unrelated work is included.

## 44. Remaining decisions and implementation readiness

No unresolved architectural decision blocks backend implementation under this
SPEC. Technical constants such as bounded retry budgets are implementation details
within the safety limits specified here, not permission to change the protocol.

Genuinely pending configuration work is:

- creation/configuration of the approved Test/Live catalog and dedicated payment
  configuration under separate authorization before their respective real use.

The MVP amounts (R$ 99,90 / R$ 189,90 / R$ 279,90), BRL and monthly billing are
approved. Annual billing remains future scope. The pending resource setup
blocks real E2E/configuration/launch, not deterministic backend
implementation. UI/transport, Portal, taxes and price-change workflows remain
separate scopes, not hidden deliverables or blockers for this backend slice.

```text
BLOCKING DECISIONS
None.

READY FOR STRIPE CHECKOUT IMPLEMENTATION
```

Approval of this SPEC does not authorize implementation during this execution,
reading/modifying `.env.local`, creating remote Stripe resources, applying real
remote migrations, or committing/pushing/merging/rebasing without explicit request.
