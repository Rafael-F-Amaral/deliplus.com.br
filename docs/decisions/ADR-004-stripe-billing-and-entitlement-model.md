# ADR-004: Stripe billing and Organization entitlement model

## Status

Accepted

## Context

Deli Plus needs to support two different paths to Organization-level product access:

1. an initial acquisition trial with no payment method;
2. a paid recurring subscription managed by Stripe.

The trial should not begin merely because a Clerk User signs up or creates an Organization. Merchants may complete assisted onboarding and configure a Store before consuming trial time.

The approved product flow is:

```text
User registers
  → Clerk Organization selected/created
  → internal DeliPlus Organization provisioned
  → Store setup
  → trusted Store activation
  → 15-day Essential trial
```

During that trial, the Organization must have the same Essential entitlement as a paid Essential subscription, including normal Store operation, normal order intake, and `maxStores = 1`.

Paid conversion must initially support three Store-capacity tiers with the same principal MVP functionality:

```text
essential → maxStores = 1
multi_2   → maxStores = 2
multi_3   → maxStores = 3
```

Demand for four or more Stores is sales-assisted rather than an automatically generated fourth plan. Internal plan codes must remain stable even if commercial display names change later.

Creating Stripe Customers and trialing Stripe Subscriptions for every local trial would:

- couple acquisition/onboarding state to the payment provider;
- create external resources for merchants who might never enter paid conversion;
- start Stripe lifecycle before payment information is needed;
- make local eligibility and Store activation harder to coordinate atomically;
- incorrectly treat Stripe `trialing` as the only trial entitlement source.

Deli Plus also needs paid lifecycle changes to be processed asynchronously and made available to normal application authorization without calling Stripe on every request.

ADR-001 already establishes the DeliPlus Organization as the subscription and Store-capacity boundary. ADR-003 establishes the server-only privileged Supabase client as the default trusted write boundary and permits restricted transactional RPCs when database atomicity genuinely requires them.

## Decision

### Billing subject

The internal DeliPlus Organization is the billing and entitlement subject:

```text
public.organizations.id
  → local trial grants
  → canonical Stripe Customer
  → paid Stripe Subscription projection
  → plan entitlement
  → Store capacity
```

Billing does not belong to an individual Clerk User or Store.

The Clerk User remains relevant to initial-trial eligibility, not ownership of the Organization's entitlement.

### Local initial trial

The initial trial is owned by Deli Plus/PostgreSQL, not Stripe.

```text
duration: 15 days
payment method: none
plan: Essential
Stripe Customer: not required
Stripe Subscription: not required
```

Trial activation is a future trusted server operation conceptually named:

```text
activateStoreAndStartTrial(...)
```

It starts the trial only after separately specified Store-readiness conditions pass. Trial grant and Store activation must be database-atomic.

Trial validity is derived using the database clock:

```text
revoked_at IS NULL
AND starts_at <= database now
AND database now < ends_at
```

No scheduler is required to revoke authorization at expiration. Scheduled jobs may be used for reminders and observability only.

### Trial eligibility and overrides

The MVP permits:

```text
one initial trial per Clerk User
AND
one initial trial per DeliPlus Organization
```

An initial grant remains consumed after expiration or revocation.

The future initial-trial activation boundary must also verify that no Store in
the Organization has ever been activated (`activated_at IS NOT NULL`). Draft or
ready Store setup does not start or consume a trial.

Deli Plus may create exceptional `manual_override` grants through an administrative boundary. A Clerk Organization admin cannot self-grant an override.

The model may later support a Deli Plus-administered multi-Store override/pilot using an approved plan code. This decision does not define its workflow, eligibility, duration, or self-service availability.

Complex antifraud signals such as CPF/CNPJ, payment-method fingerprint, IP address, device fingerprint, and email domain are deferred until real abuse justifies them.

### Full trial entitlement

A valid trial grants the complete Essential product entitlement:

```text
planCode = essential
maxStores = 1
normal Store operation
normal intake of new orders
```

There is no reduced Essential trial tier.

At expiration, new actions requiring entitlement are denied unless paid entitlement exists. Organization, Store, product/configuration, and historical order data are not destructively deleted.

### Paid Stripe lifecycle

Stripe begins only when an Organization admin chooses paid conversion:

```text
local trial active or expired
  → canonical Stripe Customer created/reused
  → Stripe-hosted Checkout
  → payment method/card
  → paid Stripe Subscription
  → verified webhooks
  → PostgreSQL paid projection
```

The paid Checkout flow does not configure a Stripe trial or `subscription_data.trial_period_days`. Conversion creates the paid subscription without translating remaining local trial days into Stripe credit.

The approved Stripe integration is:

```text
Stripe Billing
+ Stripe-hosted Checkout
+ Customer Portal
+ mandatory webhooks
```

Stripe Connect, custom payment forms, and Elements are not used initially.

Cards in BRL are the initial recurring-payment direction. Deli Plus does not implement a recurring Pix workaround. Checkout omits `payment_method_types` and relies on an approved Stripe payment-method configuration.

### Canonical Stripe Customer

An Organization has zero or one canonical Stripe Customer.

The Customer is created only when paid conversion or a future explicitly approved Stripe flow requires it. A local trial can exist forever without a Stripe Customer.

PostgreSQL stores the canonical Organization-to-Customer relationship and enforces uniqueness. Stripe metadata may include the internal Organization ID for recovery/auditing but does not replace the local relationship.

Customer creation uses a persistent local claim and Stripe idempotency key so concurrent conversion requests converge on one canonical Customer without holding a database transaction open across the Stripe API call.

### Separate persistence models

Deli Plus uses four distinct conceptual entities:

```text
billing_trial_grants
  → local trial grants, consumption, and overrides

billing_customers
  → canonical Organization-to-Stripe-Customer identity

billing_subscriptions
  → current paid Stripe Subscription projection only

stripe_webhook_events
  → minimum webhook idempotency/audit ledger
```

Local trial fields do not belong in the paid Subscription projection.

Full Stripe webhook payloads are not persisted by default.

### Normalized Organization entitlement

Application access is computed from two independent sources:

```text
valid local trial
OR
valid paid Stripe Subscription
→ Organization entitled
```

The normalized result is conceptually based on an exact trusted plan-to-capacity mapping:

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

The self-service initial trial always uses `essential`. A non-Essential trial entitlement is reserved for a future Deli Plus administrative override/pilot and is not enabled by this decision.

When both sources are valid, the paid subscription has descriptive precedence.

Future Store activation, Store-capacity enforcement, new-order intake, and protected merchant operations consume the same normalized entitlement rather than implementing independent `isTrial`, `isPaid`, or Stripe-status checks.

### Paid status mapping

Paid entitlement follows this policy:

```text
active             → entitled
past_due           → entitled during Stripe recovery
incomplete         → not entitled
incomplete_expired → not entitled
unpaid             → not entitled
canceled           → not entitled
paused             → not entitled
trialing           → not entitled for the local initial-trial model
unknown            → fail closed
```

`cancel_at_period_end = true` preserves paid entitlement while status remains `active` or `past_due`.

No additional local grace duration applies to `past_due` initially. The projection records `past_due_since` so a future explicit duration policy can be added.

Collection-paused state does not silently grant paid entitlement without a separately approved policy.

### Source-of-truth split

Stripe is canonical for:

- external paid Customer/Subscription objects;
- invoices and payments;
- external paid subscription status and cancellation lifecycle.

PostgreSQL is canonical for:

- Organization ownership relationship;
- local trial grant and consumed-trial history;
- internal `plan_code`;
- normalized application entitlement;
- Store capacity;
- application-readable paid projection.

Normal application requests do not call Stripe to resolve entitlement.

### Webhook projection

Paid Stripe lifecycle is synchronized through a Node-runtime route with raw-body signature verification.

The route:

- does not require Clerk authentication;
- verifies `Stripe-Signature` before processing;
- does not trust browser or success-page state;
- persists minimum Event ID metadata;
- retrieves current Stripe Subscription state when needed;
- sends all paid subscription updates through one reducer;
- atomically records Event processing and applies the local projection;
- handles duplicate, replayed, concurrent, and out-of-order delivery.

Trial activation and expiration have no Stripe webhook dependency.

### Internal plan identity and Store capacity

Internal plan codes are independent from commercial display names and Stripe Price IDs:

```text
essential
  → application config: maxStores = 1
  → environment config: STRIPE_PRICE_ESSENTIAL

multi_2
  → application config: maxStores = 2
  → environment config: STRIPE_PRICE_MULTI_2

multi_3
  → application config: maxStores = 3
  → environment config: STRIPE_PRICE_MULTI_3
```

All three plans initially offer the same principal functionality. Store capacity is their approved product distinction; no feature gates are inferred from these codes.

The application plan registry is canonical for `maxStores`. The paid subscription projection stores `plan_code` and the actual Stripe Price ID but does not persist `maxStores` redundantly.

The browser may select only an approved internal plan code and never an arbitrary Stripe Price ID or capacity value. The server maps the code to the environment-specific Price. Test/Sandbox and Live Price IDs remain distinct.

When the remote Stripe catalog is approved, each selectable plan uses its own Stripe Product and recurring Price. Amounts, billing intervals, discounts, additional-Store pricing, and custom/enterprise pricing remain undecided; no Product or Price is created by this decision.

Four-or-more-Store demand follows a Deli Plus contact/sales-assisted path. No `multi_4` or fourth Price is inferred automatically.

Store capacity is a trusted entitlement rule, not an `Organization → exactly one Store` schema cardinality constraint. `maxStores` counts only Stores with `status = 'active'`; draft and ready Stores may be created and configured without consuming capacity. Future Store activation must enforce entitlement and capacity atomically.

### Security boundaries

All billing mutations are server-only and narrow:

- trial activation/override: trusted Deli Plus operation;
- Customer/Checkout/Portal: verified Organization-admin operation;
- paid projection/event ledger: verified Stripe webhook or trusted reconciliation.

Normal authenticated access has no generic billing writes. `anon` has no billing-table access. Tenant-readable facts use explicit minimal grants and RLS derived from verified Clerk Organization context.

Stripe API and webhook secrets remain server-only, environment-specific, and never use a `NEXT_PUBLIC_` prefix. A restricted Stripe API key is preferred where its permissions cover the required calls.

Stripe Tax remains outside this decision. `automatic_tax` must not be enabled without a separately approved tax requirement, active registrations, and reviewed tax configuration.

## Consequences

### Benefits

- onboarding and Store configuration do not consume trial time prematurely;
- merchants can start a no-card trial without creating unused Stripe resources;
- local trial eligibility remains enforceable independently from payment identity;
- paid Stripe lifecycle remains webhook-driven and auditable;
- application authorization reads one normalized entitlement model;
- trial and paid Essential behavior remain product-consistent;
- Store capacity stays independent from Store cardinality;
- provider failures do not require Stripe calls on every application request;
- the approved two- and three-Store plans reuse the same authorization model without changing Store cardinality;
- future capacities above three or explicit payment-recovery grace can extend the model only through deliberate decisions.

### Requirements

- database constraints must enforce initial-trial uniqueness and duration;
- trial activation and Store activation must commit atomically;
- Customer creation must be idempotent and concurrency-safe;
- webhook signatures, duplicate delivery, replay, and ordering must be tested;
- paid projection writes must be trusted and transactional;
- all protected operations must converge on the normalized entitlement resolver;
- plan constraints and server configuration must recognize only `essential`, `multi_2`, and `multi_3` and derive capacities 1, 2, and 3 respectively;
- every environment must map each approved `plan_code` to a matching-mode Stripe Price without persisting capacity redundantly;
- local/Stripe Test and Production/Live data must remain isolated;
- current-state architecture/database documentation must be updated as implementation makes these concepts real.

### Trade-offs and risks

- Deli Plus owns trial timing, eligibility, override auditing, and expiration semantics;
- the application must combine two entitlement sources correctly;
- a paid conversion can leave an abandoned Stripe Customer without a Subscription;
- webhook lag can temporarily delay paid projection updates;
- `past_due` access follows Stripe recovery length until a local duration is approved;
- manual Dashboard changes in Stripe can create unsupported states and must fail closed;
- three selectable paid tiers require three independently managed Product/Price mappings per Stripe mode once pricing is approved;
- a privileged server credential or restricted transactional RPC can cross RLS if implemented incorrectly;
- trial abuse remains possible through multiple Clerk accounts and is accepted as an MVP trade-off.

## Alternatives considered

### Stripe Subscription trial for every initial trial

Rejected because the approved initial trial requires no card or Stripe interaction, starts at trusted Store activation, and should not create Stripe resources for non-converting merchants.

### Start trial at User sign-up or Clerk Organization creation

Rejected because assisted onboarding and Store configuration may happen before the merchant is ready to operate. Trial time starts only when the Store is ready for trusted activation.

### One combined trial/Customer/Subscription table

Rejected because local trial, Stripe Customer identity, and paid Subscription have independent optional lifecycles. Combining them would force nullable/provider-specific state into unrelated flows and obscure source-of-truth boundaries.

### Stripe API lookup on every protected request

Rejected because it adds latency, external availability dependence, rate-limit pressure, and inconsistent authorization paths. Normal access reads the local trusted projection.

### Grant entitlement from Checkout success redirect

Rejected because browser redirects are not a payment or subscription authorization boundary. Paid state is accepted only through verified webhook/reconciliation processing.

### One Stripe Customer per Clerk User or Store

Rejected because the DeliPlus Organization is the financial and Store-capacity owner established by ADR-001.

### Stripe Connect

Rejected because this scope is merchant-to-Deli Plus SaaS billing, not consumer-to-restaurant marketplace payment processing.

### Store cardinality constraint per plan

Rejected because Organization-to-Store remains one-to-many across all approved plans. Capacity 1, 2, or 3 belongs to trusted entitlement enforcement and not relational cardinality.

## Relationship to existing decisions

- **ADR-001** remains authoritative for Organization billing ownership and Organization-to-Store cardinality.
- **ADR-002** remains authoritative for Store-level member access; Store membership does not change entitlement or capacity.
- **ADR-003** remains authoritative for trusted server writes. This ADR justifies restricted transactional database operations only where billing/trial atomicity cannot be guaranteed through multiple Data API calls.

This ADR supersedes any earlier conceptual wording that treated the initial Deli Plus trial as necessarily part of the Stripe Subscription lifecycle.
