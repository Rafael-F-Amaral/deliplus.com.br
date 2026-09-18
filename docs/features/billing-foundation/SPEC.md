# Deli Plus — Billing Foundation

**Path:** `docs/features/billing-foundation/SPEC.md`<br>
**Status:** Approved<br>
**Scope:** Organization billing, local trial entitlement, paid Stripe projection, and future enforcement boundaries<br>
**Last updated:** 2026-08-24

## 1. Purpose

Define the billing and entitlement foundation for Deli Plus without collapsing the local product trial into the external Stripe subscription lifecycle.

This specification establishes:

- a 15-day, no-card Essential trial owned by Deli Plus/PostgreSQL;
- one initial trial per Clerk User and per DeliPlus Organization;
- a trusted future boundary that starts the trial only when a Store is ready for activation;
- Stripe Billing with hosted Checkout for paid conversion;
- one canonical Stripe Customer and one current paid-subscription projection per Organization;
- webhook-driven synchronization of paid subscription state;
- one normalized Organization entitlement resolver shared by future Store, order, and capacity operations;
- conservative RLS, grants, idempotency, and environment boundaries.

This document specifies future implementation. It does not itself create database objects, install Stripe, start trials, create Stripe resources, or change onboarding behavior.

Expected delivery model:

`SPEC → INCREMENTAL IMPLEMENTATION → VERIFY → REVIEW`

---

## 2. Architectural context

Deli Plus already establishes the following ownership chain:

```text
Clerk Organization
  ↕
public.organizations
  ├── Stores
  ├── local trial grants
  └── paid Stripe Customer/Subscription projection
```

The Organization, represented by `public.organizations.id`, is the billing subject.

Billing does not belong to:

- an individual Clerk User;
- an individual Store;
- a Store membership;
- a browser session.

Clerk remains canonical for:

- authentication;
- Clerk User identity;
- active Organization;
- Organization membership;
- Organization roles.

PostgreSQL remains canonical for:

- the internal DeliPlus Organization relationship;
- local trial grants and eligibility history;
- internal plan identity;
- normalized application entitlement;
- Store capacity;
- the application-readable paid subscription projection.

Stripe remains canonical for:

- Stripe Customer and Subscription objects;
- external paid subscription lifecycle;
- payments and invoices;
- Stripe subscription status.

This specification applies ADR-001, ADR-002, and ADR-003 and introduces ADR-004.

---

## 3. Locked product decisions

### 3.1 Initial trial

```text
Duration: 15 days
Payment method: not required
Owner: Deli Plus / PostgreSQL
Plan: Essential
```

Starting the initial trial must not create:

- a Stripe Customer;
- a Stripe Checkout Session;
- a Stripe Subscription;
- a Stripe `trialing` status.

### 3.2 Full Essential entitlement during trial

During a valid local trial, the Organization receives the same product entitlement as a paid Essential subscription, including:

- normal Store operation;
- normal intake of new orders;
- all Essential functionality;
- `maxStores = 1`.

Do not create a reduced or feature-limited trial edition of Essential.

### 3.3 Trial activation timing

The trial does not start on:

- Clerk User sign-up;
- Clerk Organization creation;
- internal DeliPlus Organization provisioning;
- Store draft creation by itself.

Approved direction:

```text
User registers
  → Organization provisioned
  → Store setup
  → Store configuration ready
  → trusted activation
  → 15-day trial starts
  → Store becomes operational
```

### 3.4 Trial eligibility

MVP policy:

```text
maximum one initial trial per Clerk User
AND
maximum one initial trial per DeliPlus Organization
```

An exceptional manual override may be granted only through a Deli Plus administrative boundary.

Do not use in this foundation:

- CPF/CNPJ;
- payment-method fingerprint;
- IP address;
- device fingerprint;
- email domain;
- complex fraud scoring.

### 3.5 Payment recovery

```text
Stripe status past_due
→ retain paid entitlement while Stripe recovery continues
```

No separate local grace duration is introduced initially. A future policy may use `past_due_since`.

### 3.6 Cancellation

Customer Portal cancellation defaults to:

```text
cancel at period end
```

The Organization retains access while the paid subscription status remains entitled.

### 3.7 Approved commercial Store capacities

The initial paid plan catalog uses stable internal codes:

| `plan_code` | `maxStores` |
| ----------- | ----------: |
| `essential` |           1 |
| `multi_2`   |           2 |
| `multi_3`   |           3 |

All three plans provide the same principal MVP functionality. Their initial product differentiation is Store capacity; do not invent feature gates between them.

Organizations that need four or more Stores follow a Deli Plus contact/sales-assisted path. This foundation does not define or automatically create a fourth plan, custom Price, or self-service capacity above three Stores.

---

## 4. Goals

The complete Billing Foundation must eventually:

1. Represent local trial grants independently from Stripe.
2. Enforce one initial trial per Clerk User and Organization.
3. Support auditable Deli Plus administrative overrides.
4. Derive trial validity from the trusted database clock.
5. Represent one canonical Stripe Customer per Organization.
6. Persist one current paid-subscription projection per Organization.
7. Synchronize paid Stripe lifecycle through verified, idempotent webhooks.
8. Support `essential`, `multi_2`, and `multi_3` as stable internal plan codes independently from Stripe Price IDs and commercial display names.
9. Resolve one normalized Organization entitlement from trial or paid state.
10. Allow future Store-capacity and order operations to consume that resolver.
11. Keep all billing mutations behind trusted server boundaries.
12. Keep normal application reads tenant-isolated through RLS where applicable.
13. Separate Local, Preview/Staging, and Production credentials/resources.
14. Be implemented and reviewed in incremental slices.

---

## 5. Explicit non-goals

Do not implement or specify detailed behavior for:

- Store provisioning;
- Store readiness criteria;
- order schema or order workflow;
- end-customer online payments;
- Stripe Connect;
- Stripe Elements or custom payment UI;
- recurring Pix workarounds;
- taxes or `automatic_tax`;
- coupons, promotions, or affiliates;
- multiple currencies;
- multiple concurrent paid subscriptions per Organization;
- plan upgrades/downgrades;
- annual billing unless separately approved;
- commercial display names, prices, discounts, custom/enterprise pricing, or Store capacities above three;
- invoice accounting integration;
- complex trial fraud prevention;
- destructive cleanup after entitlement expiration.

Stripe Tax must remain disabled until a separate requirement confirms the applicable tax treatment, registrations, and product tax configuration.

---

## 6. Domain model

```text
public.organizations
  ├── 0..N billing_trial_grants
  ├── 0..1 billing_customers
  └── 0..1 current billing_subscriptions

Stripe
  └── paid lifecycle only

valid local trial
OR
valid paid subscription
  → normalized Organization entitlement
  → plan configuration
  → Store capacity and protected operations
```

`billing_trial_grants`, `billing_customers`, `billing_subscriptions`, and `stripe_webhook_events` are distinct entities with distinct lifecycles.

Trial existence must never require a Stripe Customer or Subscription.

---

## 7. Internal plan identity and configuration

The approved internal plan codes and capacities are:

```text
essential → maxStores: 1
multi_2   → maxStores: 2
multi_3   → maxStores: 3
```

These codes are stable domain identifiers. They do not depend on future commercial display names such as Plus, Pro, or similar branding.

All three plans initially provide the same principal product functionality. Do not add feature flags or feature gates that differentiate them. Store capacity is the approved commercial distinction.

For four or more Stores:

```text
contact Deli Plus / sales-assisted
```

Do not infer a `multi_4`, unlimited, custom, or enterprise `PlanCode`. A later approved decision must define any capacity above three.

Internal plan identity is not a Stripe Price ID or a commercial display name.

Use a hybrid configuration model:

```text
application configuration
  → PlanCode
  → domain entitlements
  → maxStores

environment configuration
  → Stripe Price ID for the deployment environment
```

Conceptually:

```text
essential
  → maxStores: 1
  → STRIPE_PRICE_ESSENTIAL

multi_2
  → maxStores: 2
  → STRIPE_PRICE_MULTI_2

multi_3
  → maxStores: 3
  → STRIPE_PRICE_MULTI_3
```

The application plan registry is the only source for `maxStores`. Do not persist `maxStores` redundantly in `billing_subscriptions` or accept it from the browser.

Each selectable paid plan must eventually map to its own Stripe Product and environment-specific recurring Price. No Stripe Product or Price is created by this specification. The remote Product display names may change without changing the internal `PlanCode`.

The environment convention represents one approved recurring Price per `PlanCode` in each deployment. If multiple billing intervals are approved later, a separate decision must introduce explicit interval-aware configuration rather than overloading these variables.

The browser may send only an approved internal `PlanCode`.

The browser must never provide an authoritative:

- Stripe Price ID;
- amount;
- currency;
- billing interval;
- Store capacity.

Stripe Price IDs differ between Test/Sandbox and Live. Each environment must configure all three approved codes with Prices from the matching Stripe mode. The Price used for a subscription must be persisted in the paid projection without replacing `plan_code`.

Changing a plan's price in the future requires a new Stripe Price. Existing subscriptions retain their historical Price association. A Price transition must be deliberate and must not remap an unknown Price or Price-to-plan combination silently.

Do not invent amounts, billing intervals, discounts, additional-Store pricing, or custom/enterprise pricing in this specification.

---

## 8. Entity: `public.billing_trial_grants`

### 8.1 Purpose

Represent local trial authorization and consumed-trial history independently from Stripe.

### 8.2 Conceptual columns

| Column            | Planned type  | Requirements                                                      |
| ----------------- | ------------- | ----------------------------------------------------------------- |
| `id`              | `uuid`        | Primary key.                                                      |
| `organization_id` | `uuid`        | `NOT NULL`, FK to `public.organizations.id`.                      |
| `clerk_user_id`   | `text`        | `NOT NULL`; verified Clerk User that consumed/received the grant. |
| `grant_kind`      | `text`        | `NOT NULL`; `initial` or `manual_override`.                       |
| `plan_code`       | `text`        | `NOT NULL`; approved catalog code.                                |
| `starts_at`       | `timestamptz` | `NOT NULL`; trusted database timestamp.                           |
| `ends_at`         | `timestamptz` | `NOT NULL`; trusted database timestamp.                           |
| `revoked_at`      | `timestamptz` | Nullable.                                                         |
| `created_at`      | `timestamptz` | `NOT NULL`, database default.                                     |
| `updated_at`      | `timestamptz` | `NOT NULL`, database default and normal timestamp behavior.       |

Use text with check constraints rather than PostgreSQL enum types for `grant_kind` and `plan_code`.

### 8.3 Required constraints

- primary key on `id`;
- FK `organization_id → organizations.id` with `ON UPDATE RESTRICT` and `ON DELETE RESTRICT`;
- `grant_kind IN ('initial', 'manual_override')`;
- `plan_code IN ('essential', 'multi_2', 'multi_3')`;
- every `initial` grant must use `plan_code = 'essential'`;
- `ends_at > starts_at`;
- an `initial` grant must be exactly 15 days;
- partial unique index for one `initial` grant per `organization_id`;
- partial unique index for one `initial` grant per `clerk_user_id`;
- index supporting active Organization trial lookup by `organization_id` and time/revocation state.

The partial uniqueness rules apply only to `grant_kind = 'initial'`. Manual overrides are additional rows and remain visible in the audit history.

### 8.4 Consumed-trial semantics

An initial trial is considered consumed if an `initial` row exists for the Organization or Clerk User, even when the row is:

- expired;
- revoked;
- superseded descriptively by a paid subscription.

Deleting a row must not be used to restore eligibility.

### 8.5 Manual override

A manual override:

- is an additional grant row;
- does not erase or mutate the initial grant history;
- may overlap an expired or revoked initial grant;
- must be created only through an explicitly authorized Deli Plus administrative operation;
- must not be available to a Clerk Organization admin as self-service;
- must be covered by audit-safe server logs/operational controls without exposing secrets or sensitive payloads.

The schema may represent a future Deli Plus-administered multi-Store pilot by assigning an approved non-Essential `plan_code` to a `manual_override` grant. This capability does not define or authorize the pilot workflow, eligibility, duration, or self-service access.

The exact support UI and operator-identity fields are outside this foundation.

### 8.6 Trial validity

A trial grant is valid only when:

```text
revoked_at IS NULL
AND starts_at <= database now
AND database now < ends_at
```

Application time and browser time are not authoritative.

No cron is required for authorization correctness. Scheduled work may later handle reminders, emails, or observability only.

---

## 9. Trial activation boundary

The future trusted operation is conceptually:

```text
activateStoreAndStartTrial(...)
```

It must:

1. run server-side;
2. call Clerk server auth and require an authenticated user;
3. require a verified active Clerk Organization;
4. require `org:admin`;
5. resolve the internal DeliPlus Organization;
6. resolve the target Store and verify Organization ownership;
7. validate the separately specified Store-readiness criteria;
8. verify initial-trial eligibility for both verified Clerk User and Organization;
9. use database time for `starts_at` and `ends_at`;
10. insert the initial grant and activate the Store atomically;
11. return a minimal result without exposing privileged details.

The browser may identify a candidate Store, but the Store and tenant relationship must be re-resolved server-side. The browser cannot supply authority-bearing values for:

- `organization_id`;
- `clerk_user_id`;
- Organization role;
- `starts_at`;
- `ends_at`;
- trial eligibility;
- entitlement.

The operation should use a narrowly reviewed transactional database boundary because trial claim and Store activation must commit or roll back together. If implemented as `SECURITY DEFINER`, it must follow ADR-003 controls: private schema, restricted `search_path`, fully qualified objects, minimal EXECUTE grants, no public/authenticated execution, and dedicated security tests.

Activating additional Stores must never start another initial trial.

Store-readiness rules and the operation itself belong to a later implementation slice/specification.

---

## 10. Trial expiration behavior

At `ends_at`, a local trial ceases to grant entitlement automatically.

When no paid entitlement exists:

```text
new operational actions requiring entitlement
→ denied
```

This includes future enforcement for:

- intake of new orders;
- Store operational activation/use;
- Store-capacity-protected mutations;
- other protected merchant operations.

Expiration must not:

- delete the Organization;
- delete or deactivate records destructively;
- delete Stores, products, configuration, or historical orders;
- remove billing/conversion access;
- treat missing frontend visibility as authorization.

Historical data remains available according to the future expired-account UX and normal authorization rules. Billing/conversion surfaces remain reachable so the Organization can subscribe.

New-order creation must eventually revalidate entitlement server-side at the operation boundary.

---

## 11. Entity: `public.billing_customers`

### 11.1 Purpose

Maintain the canonical local relationship between one DeliPlus Organization and at most one Stripe Customer.

The row is not created when a local trial starts. It is created/claimed only when the Organization begins paid conversion or another future approved Stripe flow genuinely requires a Customer.

### 11.2 Conceptual columns

| Column                     | Planned type  | Requirements                                                               |
| -------------------------- | ------------- | -------------------------------------------------------------------------- |
| `organization_id`          | `uuid`        | Primary key and FK to `public.organizations.id`.                           |
| `stripe_customer_id`       | `text`        | Nullable during a controlled creation claim; globally unique when present. |
| `creation_idempotency_key` | `text`        | `NOT NULL`, unique, server-generated.                                      |
| `provisioning_status`      | `text`        | `NOT NULL`; controlled lifecycle such as `pending` or `ready`.             |
| `created_at`               | `timestamptz` | `NOT NULL`, database default.                                              |
| `updated_at`               | `timestamptz` | `NOT NULL`, normal timestamp behavior.                                     |

Required behavior:

- `organization_id` uses `ON UPDATE RESTRICT` and `ON DELETE RESTRICT`;
- at most one canonical row per Organization;
- `stripe_customer_id` is unique when non-null;
- creation state is constrained to approved values;
- `ready` requires a non-null Stripe Customer ID;
- no authenticated generic access is required;
- all creation/recovery writes use the trusted server boundary.

### 11.3 Customer creation and concurrency

Recommended flow:

```text
trusted Organization admin conversion request
  → atomically claim billing_customers row
  → winner calls Stripe outside database transaction
  → customers.create with persisted idempotency key
  → Organization ID in Stripe metadata
  → finalize local row as ready
```

Do not keep a PostgreSQL transaction open while calling Stripe.

Concurrent callers must observe/reuse the same claim rather than create another Customer.

Stripe metadata may contain the internal `organization_id` for recovery and auditing. It is not the canonical relationship and must not replace the local PK/FK/unique constraints.

If a claim remains unresolved beyond Stripe's idempotency-retention assumptions, the system must enter a reconciliation path rather than blindly creating another Customer.

---

## 12. Entity: `public.billing_subscriptions`

### 12.1 Purpose

Store the current normalized projection of the Organization's paid Stripe subscription.

This table does not represent the initial Deli Plus trial.

### 12.2 Conceptual columns

| Column                   | Planned type  | Requirements                                                                 |
| ------------------------ | ------------- | ---------------------------------------------------------------------------- |
| `organization_id`        | `uuid`        | Primary key; FK to the canonical billing Customer/Organization relationship. |
| `stripe_subscription_id` | `text`        | `NOT NULL`, globally unique.                                                 |
| `stripe_price_id`        | `text`        | `NOT NULL`; actual Stripe Price on the current subscription.                 |
| `plan_code`              | `text`        | `NOT NULL`; approved internal plan code.                                     |
| `status`                 | `text`        | `NOT NULL`; normalized Stripe status.                                        |
| `current_period_end`     | `timestamptz` | Nullable only when the current Stripe state legitimately lacks it.           |
| `cancel_at_period_end`   | `boolean`     | `NOT NULL`, default `false`.                                                 |
| `collection_paused`      | `boolean`     | `NOT NULL`, default `false`.                                                 |
| `past_due_since`         | `timestamptz` | Nullable; set on first transition into `past_due`, cleared after leaving it. |
| `last_synced_at`         | `timestamptz` | `NOT NULL`; latest successful Stripe reconciliation.                         |
| `created_at`             | `timestamptz` | `NOT NULL`, database default.                                                |
| `updated_at`             | `timestamptz` | `NOT NULL`, normal timestamp behavior.                                       |

Do not add local trial timestamps or trial eligibility fields.

With the approved current Stripe API baseline, the reducer must derive `current_period_end` from the canonical recurring Subscription Item rather than assume that this field remains at the Subscription root. An unsupported multi-item or ambiguous recurring configuration must fail closed instead of selecting a period arbitrarily.

### 12.3 Required constraints and indexes

- one current row per `organization_id`;
- FK to the Organization's canonical billing Customer with `ON UPDATE RESTRICT` and `ON DELETE RESTRICT`;
- unique `stripe_subscription_id`;
- `plan_code IN ('essential', 'multi_2', 'multi_3')`;
- `status` constrained to recognized Stripe statuses;
- index on `stripe_subscription_id` is covered by uniqueness;
- Organization lookup is covered by the primary key;
- indexes needed by RLS predicates and webhook correlation must be explicit and non-redundant.

An unknown Stripe status or unknown Price/plan transition must fail closed and produce an operational error. It must not be silently mapped to entitlement.

Only one current paid subscription per Organization is in scope. Historical subscription reporting remains canonical in Stripe and may receive a separate application model later.

---

## 13. Paid subscription status mapping

| Stripe status        | Paid entitlement | Rule                                                  |
| -------------------- | ---------------: | ----------------------------------------------------- |
| `active`             |              Yes | Paid subscription is entitled.                        |
| `past_due`           |              Yes | Retain access during Stripe recovery.                 |
| `incomplete`         |               No | Initial payment has not completed.                    |
| `incomplete_expired` |               No | Initial payment failed/expired.                       |
| `unpaid`             |               No | Recovery has ended without payment.                   |
| `canceled`           |               No | Terminal cancellation.                                |
| `paused`             |               No | No paid entitlement.                                  |
| `trialing`           |               No | Initial trial is local; Stripe trial is not approved. |
| unknown              |               No | Fail closed and alert.                                |

Additional rules:

- `cancel_at_period_end = true` does not revoke access while status remains `active` or `past_due`;
- `collection_paused = true` does not silently grant paid entitlement and must fail closed until a separate policy approves that operational state;
- no separate local grace duration applies to `past_due` initially;
- `past_due_since` preserves the ability to introduce a future duration policy without redesigning the projection.

---

## 14. Organization entitlement model

There are two independent entitlement sources:

```text
valid local trial
OR
valid paid Stripe subscription
→ Organization entitled
```

The conceptual result preserves the exact trusted mapping between plan and capacity:

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

The self-service initial trial always resolves to `essential` with `maxStores = 1`. The broader trial union only preserves room for a future authorized `manual_override` pilot using an approved plan code; it does not create that flow.

Resolution precedence:

1. valid paid subscription;
2. otherwise valid local trial;
3. otherwise not entitled.

When both are valid, `paid_subscription` has descriptive precedence. The trial row remains historical and consumed.

The resolver must derive `maxStores` from trusted plan configuration. It must not read a redundant capacity from `billing_subscriptions` or trust a client-supplied capacity value.

The resolver must distinguish:

- valid `entitled: false`;
- infrastructure/resolution failure;
- unsupported/unknown provider state.

A database or normalization error must not be converted into a normal no-entitlement state.

### 14.1 Shared authorization rule

Future protected operations must consume the same entitlement result rather than scattering checks such as:

- `isTrial`;
- `isPaid`;
- `isSubscriptionActive`;
- direct timestamp comparisons;
- direct Stripe status comparisons.

Conceptually, shared resolution may be exposed through:

```text
resolveOrganizationEntitlement(...)
```

Context-specific callers must derive the trusted internal Organization before calling the core resolver:

- authenticated merchant flow: verified Clerk active Organization → internal Organization;
- public order flow: server-resolved Store → owning internal Organization.

A browser-provided Organization or Store ID is never sufficient authority.

---

## 15. Stripe integration architecture

Approved integration:

```text
Stripe Billing
+ Stripe-hosted Checkout
+ Customer Portal
+ verified webhooks
```

Do not use:

- Stripe Connect;
- a custom card form;
- Elements/Payment Element initially;
- raw PaymentIntents as a subscription-renewal system;
- Stripe trial for the initial Deli Plus trial.

The recurring MVP method is cards in BRL. Do not implement a recurring Pix workaround. Other methods may be enabled only when they are officially supported for this subscription model and the actual Stripe account/market.

Do not pass `payment_method_types` to Checkout. Eligible methods are controlled through Stripe's payment-method configuration. If the configured set can produce asynchronous completion, the corresponding Checkout async events become mandatory.

---

## 16. Stripe server client and API version

The Stripe client must be server-only and conceptually located at:

```text
lib/stripe/server.ts
```

Requirements:

- official `stripe` Node package;
- `import "server-only"`;
- instantiate and call a Stripe client instance;
- read `STRIPE_SECRET_KEY` only on the server;
- prefer a restricted API key with the minimum tested permissions;
- never log keys or initialized client configuration;
- no request/tenant state in module-global mutable data;
- a lazy process-local client cache is acceptable because the SDK client contains no tenant authority;
- use Node runtime for Stripe SDK and webhook work.

As of SPEC approval, the current stable baseline is:

```text
stripe-node 22.4.0
Stripe API 2026-07-29.dahlia
```

The implementation must verify the current stable SDK before installation. Use the SDK's matching default API version rather than supplying an arbitrary `apiVersion`. Pin the selected package version through `package.json`/`yarn.lock`, and treat SDK upgrades as explicit API upgrades with changelog and test review.

The Stripe webhook destination must use the same API version expected by the deployed SDK/reducer.

---

## 17. Paid Checkout conversion boundary

The future narrow mutation is conceptually:

```text
createCheckoutSession(planCode)
```

It must:

1. run server-side;
2. call `await auth()`;
3. require an authenticated Clerk User;
4. require a verified active Clerk Organization;
5. require `org:admin`;
6. resolve the internal DeliPlus Organization;
7. accept only `essential`, `multi_2`, or `multi_3` as an approved internal `PlanCode`;
8. map that code server-side to the matching environment-specific Stripe Price;
9. reject arbitrary browser-supplied Stripe Price IDs, capacities, or unknown plan codes;
10. check for an existing current subscription/Checkout conflict;
11. claim, create, or reuse the canonical Stripe Customer;
12. create hosted Checkout in `subscription` mode;
13. omit Stripe trial configuration, including `subscription_data.trial_period_days`;
14. include an `integration_identifier` compatible with the current Stripe API requirement and a random eight-letter suffix;
15. attach internal Organization identity and `plan_code` in appropriate Session/Subscription metadata;
16. build fixed-path return URLs from a trusted server origin;
17. return/redirect only to the Stripe-generated hosted Session URL.

Conversion creates an immediately paid subscription. Remaining local trial time is not converted into a Stripe credit or additional Stripe trial.

Until verified webhook/reconciliation state establishes paid entitlement, the local trial remains the only possible entitlement source.

The Checkout success page is never proof of payment or entitlement.

---

## 18. Customer Portal boundary

Use Stripe Customer Portal for:

- payment-method management;
- invoice access;
- cancellation at period end;
- other explicitly enabled self-service billing actions.

The Portal Session creator must:

- run server-side;
- authenticate and require active Organization admin;
- derive the Organization from verified Clerk context;
- read the canonical Stripe Customer ID locally;
- reject a browser-supplied Customer ID;
- create a short-lived Portal Session on demand;
- use a trusted fixed-path return URL.

Plan switching through Customer Portal must remain disabled until upgrade/downgrade semantics between the three approved plan codes are separately approved. Offering three plans for initial Checkout does not implicitly authorize self-service switching.

Customer Portal changes become application entitlement changes only through the verified webhook projection.

---

## 19. Entity: `public.stripe_webhook_events`

### 19.1 Purpose

Provide minimum webhook idempotency and audit metadata without persisting full Stripe payloads.

### 19.2 Conceptual columns

| Column              | Planned type  | Requirements                                       |
| ------------------- | ------------- | -------------------------------------------------- |
| `stripe_event_id`   | `text`        | Primary key.                                       |
| `event_type`        | `text`        | `NOT NULL`.                                        |
| `stripe_object_id`  | `text`        | Nullable when the event has no relevant object ID. |
| `livemode`          | `boolean`     | `NOT NULL`.                                        |
| `stripe_created_at` | `timestamptz` | `NOT NULL`.                                        |
| `processed_at`      | `timestamptz` | Nullable until successful processing.              |
| `created_at`        | `timestamptz` | `NOT NULL`, database default.                      |

Do not store the complete webhook payload by default.

No `anon` or `authenticated` access is required. The table is owned by the trusted webhook processing boundary.

---

## 20. Webhook route and signature boundary

The future route is:

```text
app/api/stripe/webhook/route.ts
```

It must:

- use Node runtime;
- accept `POST` only;
- read the raw request body before JSON parsing;
- read `Stripe-Signature`;
- verify the signature with `STRIPE_WEBHOOK_SECRET` before processing;
- reject invalid/missing signatures;
- not require Clerk authentication;
- not trust browser state or return-page state;
- validate `livemode` against the deployed environment;
- perform only narrowly scoped trusted projection writes;
- never log secrets or complete sensitive payloads;
- return a successful response only after required durable processing succeeds.

The endpoint must be publicly reachable over HTTPS in hosted environments.

---

## 21. Webhook event strategy

Minimum paid-subscription event set:

| Event                           | Purpose                                                                                                        |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `checkout.session.completed`    | Correlate Session, Customer, Subscription, and Organization; never grant directly from redirect/browser state. |
| `customer.subscription.created` | Retrieve and reduce the current paid Subscription state.                                                       |
| `customer.subscription.updated` | Reconcile status, Price, cancellation, period, collection pause, and recovery state.                           |
| `customer.subscription.deleted` | Reconcile terminal cancellation.                                                                               |
| `invoice.paid`                  | Reconcile the current Subscription after successful payment/renewal.                                           |
| `invoice.payment_failed`        | Reconcile payment-recovery state and support future notification.                                              |

Add these only when the configured Checkout methods can complete asynchronously:

```text
checkout.session.async_payment_succeeded
checkout.session.async_payment_failed
```

Do not subscribe to events without a defined reducer, correlation, notification, or operational purpose.

All subscription-relevant events converge on one normalized reducer. Invoice and Checkout handlers must not maintain contradictory entitlement rules.

Trial activation/expiration never depends on Stripe events.

---

## 22. Webhook idempotency, ordering, and concurrency

Stripe delivery may be duplicated, retried, replayed, and received out of order.

Required strategy:

1. verify the webhook signature;
2. extract only trusted event/object identifiers;
3. retrieve the current Stripe Subscription when applicable;
4. normalize it through the one reducer;
5. atomically register the Event ID and apply the local projection;
6. treat an already processed Event ID as a successful no-op;
7. let transactional failure remain retryable;
8. ignore/alert stale events for a replaced non-canonical Subscription.

The atomic ledger/projection application may use a narrow restricted PostgreSQL RPC because multiple Data API calls cannot guarantee this transaction.

Any such RPC must:

- live outside exposed schemas where appropriate;
- use a restricted `search_path` and fully qualified names;
- have EXECUTE revoked from `PUBLIC`, `anon`, and `authenticated`;
- be callable only from the trusted webhook boundary;
- receive normalized fields rather than a complete untrusted payload;
- be idempotent by `stripe_event_id`;
- receive dedicated pgTAP/security coverage.

External Stripe API calls must happen outside PostgreSQL transactions. Database transactions must remain short.

Retrieving current Stripe state reduces event-order dependence. It does not eliminate the need for Event ID deduplication or canonical Subscription checks.

---

## 23. Source-of-truth and read model

### Stripe is canonical for

- external Customer/Subscription objects;
- invoices and payment lifecycle;
- external subscription status;
- paid cancellation and recovery lifecycle.

### PostgreSQL is canonical for

- Organization ownership relationship;
- local trial grant/consumption history;
- internal `plan_code`;
- normalized application entitlement;
- Store capacity;
- application-readable paid projection.

Normal requests must not call Stripe to determine whether the Organization can operate.

Webhook processing and explicit trusted reconciliation update PostgreSQL. Application authorization reads the PostgreSQL facts and trusted plan configuration.

Stale projection is an operational risk. `last_synced_at`, webhook delivery monitoring, replay support, and a future reconciliation process must make it diagnosable without introducing Stripe calls on every request.

---

## 24. Database grants and RLS posture

All four billing entities are Organization-sensitive.

### `anon`

No access to billing tables.

### `authenticated`

No generic `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, or `TRIGGER` privileges on any billing table.

Normal authenticated reads may expose only the minimum entitlement-safe fields for the active Organization:

- local trial timing/revocation/plan facts needed to resolve entitlement;
- paid subscription plan/status/period/cancellation facts needed to resolve entitlement.

`billing_customers`, Stripe Customer IDs, idempotency keys, provisioning state, webhook events, and administrative override-only metadata do not require generic authenticated visibility.

The migration implementation must choose explicit column grants or a deliberately minimal read surface so `clerk_user_id` and provider identifiers are not exposed unnecessarily.

### RLS

RLS must be enabled explicitly on tenant-readable billing tables.

Tenant reads must derive active Organization from verified Clerk JWT claims and map it through `public.organizations`. Policies must not trust caller-supplied Organization/User identifiers.

Use indexed `organization_id` access paths and the repository's existing private Clerk claim helpers. Wrap stable auth/helper calls as appropriate for RLS performance.

### Trusted writes

- trial activation/override: narrow server operation, with database-atomic enforcement where required;
- Customer/Checkout: narrow server-only Organization-admin operation;
- paid projection/event ledger: verified webhook/trusted reconciliation operation;
- no browser or generic Data API write path.

ADR-003's privileged Supabase client remains the default orchestration boundary. Restricted transactional RPCs are allowed only for operations whose atomicity genuinely requires them and must receive the ADR-003 security review.

---

## 25. Environment variables

Future empty placeholders:

```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ESSENTIAL=
STRIPE_PRICE_MULTI_2=
STRIPE_PRICE_MULTI_3=
BILLING_RETURN_ORIGIN=
```

Rules:

- no real values in Git;
- no Stripe API/webhook secret under `NEXT_PUBLIC_`;
- no `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` unless a future client-side Stripe integration creates a concrete need;
- prefer a restricted Stripe API key of least privilege;
- one webhook signing secret per endpoint/environment;
- values must never appear in logs, exceptions, test snapshots, or agent reports.

### 25.1 Return URL resolution

Checkout success/cancel URLs and Portal return URLs use fixed application paths.

Trusted origin resolution:

1. use an explicitly configured `BILLING_RETURN_ORIGIN` for Local, stable Staging, and Production;
2. for an ephemeral Vercel Preview, the server may use the trusted system-provided deployment URL;
3. never use a browser-provided absolute URL;
4. never trust an unvalidated `Host`, `Origin`, or forwarded-host header;
5. normalize/validate the configured value as an origin without credentials, query, or fragment.

This avoids open redirects while supporting variable Preview URLs.

---

## 26. Environment matrix

### Local

```text
Supabase Local
Stripe Test/Sandbox dedicated to local development
Stripe CLI forwarding
local CLI webhook signing secret
local/test Price IDs for Essential, Multi 2, and Multi 3
BILLING_RETURN_ORIGIN=http://localhost:3000
```

Conceptual local forwarding:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI output's webhook secret is local and must not be reused for hosted endpoints.

### Preview/Staging

```text
Deli Plus - Staging Supabase
Stripe Test/Sandbox
stable public Staging webhook endpoint
Staging webhook signing secret
Staging/test Price IDs for Essential, Multi 2, and Multi 3
stable Staging origin or trusted Vercel Preview URL
```

Ephemeral Preview deployments should not each become independent webhook writers. End-to-end billing acceptance should target the stable Staging environment unless a dedicated isolated sandbox/database is intentionally provisioned.

### Production

```text
Production Supabase
Stripe Live
Production webhook endpoint
Production-only restricted API key
Production webhook signing secret
Live Price IDs for Essential, Multi 2, and Multi 3
canonical Production origin
```

Test and Live credentials, Customer IDs, Subscription IDs, Price IDs, webhook secrets, and database projections must never be mixed.

---

## 27. Store capacity integration

Store capacity is derived from entitlement:

```text
Organization entitlement
  → planCode
  → trusted plan configuration
  → maxStores
```

Approved rules:

```text
essential.maxStores = 1
multi_2.maxStores = 2
multi_3.maxStores = 3

4+ Stores → contact Deli Plus / sales-assisted
```

`maxStores` is derived from the trusted plan registry and is not a column in the paid subscription projection.

Do not add a one-Store Organization cardinality constraint. The domain relationship remains:

```text
Organization 1 → N Stores
```

Future Store activation must atomically:

1. resolve trusted Organization context;
2. resolve normalized entitlement;
3. count Stores with `status = 'active'`;
4. compare with `maxStores`;
5. activate the ready Store only when capacity remains.

A non-transactional `count → activate` sequence is insufficient under
concurrency. Draft and ready Store creation/setup does not consume capacity and
must not require entitlement.

Future initial-trial activation must additionally verify that no Store in the
Organization has ever been activated (`activated_at IS NOT NULL`).

Store memberships do not alter Store capacity.

---

## 28. Store operations and new orders

Every protected operation must consume the shared normalized entitlement resolver.

The future order-creation boundary must:

- resolve the Store server-side;
- derive its owning Organization;
- resolve Organization entitlement;
- reject new order intake when not entitled;
- not rely on storefront visibility, cached browser flags, or UI disabling.

An active local trial authorizes the same normal Essential Store operation and order intake as an active paid Essential subscription.

Trial expiration or paid entitlement loss must not delete historical orders or configuration.

Exact order implementation remains outside this specification.

---

## 29. Onboarding integration direction

Do not immediately expand the existing onboarding resolver with speculative state names.

Future onboarding should compose independent facts:

```text
authenticated?
active Organization?
internal Organization provisioned?
Store configuration complete?
initial trial eligible/consumed?
local trial active/expired?
paid subscription entitled?
Store operationally ready?
```

Distinguish:

```text
Store configuration ready
```

from:

```text
Store operationally entitled
```

This permits free/assisted Store setup before the trial starts and avoids a circular dependency between Store readiness and entitlement.

The future state resolver may express states corresponding to setup, trial-not-started, trial-active, expired-without-paid-access, paid access, and ready. Exact names and redirects belong to a dedicated onboarding integration specification after the underlying billing and Store facts exist.

Infrastructure errors must remain errors rather than valid onboarding states.

---

## 30. Testing strategy

### 30.1 pgTAP / database tests

Cover at minimum:

- table/column/constraint/index existence;
- FK and deletion behavior;
- exactly one initial grant per Organization;
- exactly one initial grant per Clerk User;
- multiple auditable manual overrides allowed;
- initial grants accept only `essential`, while a future manual override may reference another approved plan code;
- initial grant exactly 15 days;
- expired/revoked initial grant remains consumed;
- database-time boundary at `starts_at` and `ends_at`;
- unique canonical Customer per Organization;
- unique non-null Stripe Customer ID;
- unique current Stripe Subscription ID;
- recognized `essential`/`multi_2`/`multi_3` plan and status checks;
- rejection of unknown plan codes and absence of redundant `maxStores` subscription state;
- `anon` denied;
- own active tenant minimum read allowed where specified;
- other tenant read denied;
- authenticated direct writes denied for member and admin;
- Customer/webhook ledger not generically visible;
- restricted RPC EXECUTE unavailable to `PUBLIC`, `anon`, and `authenticated`;
- existing tenant-core isolation tests remain green.

Fixtures use the privileged local test role, not authenticated writes.

### 30.2 Node/application tests

Cover at minimum:

- Stripe server-client env validation and server-only boundary;
- exact plan-to-capacity and environment Price mappings for all three approved plan codes;
- rejection of arbitrary Price IDs, unknown plan codes, and client-supplied capacities;
- origin resolver across Local, Preview/Staging, and Production;
- open-redirect/host-header attempts;
- unauthenticated/member denial for Checkout and Portal;
- Organization admin authorization and verified tenant derivation;
- Customer claim/idempotency/concurrency behavior;
- trial and paid entitlement matrix;
- paid-over-trial descriptive precedence;
- expired/revoked trial behavior;
- `past_due` entitlement and `past_due_since` transitions;
- unknown/collection-paused state fails closed;
- raw-body signature verification;
- invalid/missing webhook signature rejection;
- event replay and duplicate Event IDs;
- out-of-order events;
- stale replaced Subscription cannot overwrite the canonical row;
- all paid event handlers use one reducer;
- success/cancel pages do not grant entitlement;
- no client-authoritative Organization, Customer, Price, plan capacity, or status.

### 30.3 Stripe Test/Sandbox verification

Before Production, verify:

- hosted Checkout with the configured recurring BRL card flow;
- separate configured Product/Price mapping for each of the three selectable plans;
- successful initial payment;
- declined/authentication-required payment;
- renewal/payment failure and recovery;
- `past_due`, `unpaid`, and cancellation transitions;
- cancellation at period end through Customer Portal;
- webhook replay;
- Test/Live separation;
- async Checkout events if the final payment-method configuration can produce them.

### 30.4 Baseline commands

Each implementation slice must run its focused tests plus applicable repository checks:

```bash
yarn supabase db reset
yarn supabase test db
yarn lint
yarn typecheck
yarn build
git diff --check
```

Stripe CLI/Test verification is required for the slices that introduce Checkout/webhooks, not for the initial documentation or schema-only slice.

No real Staging or Production mutation occurs without explicit review.

---

## 31. Incremental implementation breakdown

Implement as separate, reviewable slices:

1. **Billing database schema/RLS**
   - four planned entities, constraints, grants, RLS, generated types, and pgTAP.

2. **Stripe server client/configuration**
   - dependency, server client, plan registry, env validation, origin resolver.

3. **Webhook and paid-subscription reducer**
   - route, signature verification, Event ledger, transactional projection path, replay/order tests.

4. **Organization entitlement resolver**
   - local trial + paid projection composition and focused tests.

5. **Trial activation mechanics**
   - only after Store readiness/activation requirements are approved; atomic trial claim + Store activation.

6. **Customer and hosted Checkout conversion**
   - canonical Customer claim, admin-only paid conversion, no Stripe trial.

7. **Customer Portal**
   - admin-only Portal Session and cancel-at-period-end configuration.

8. **Onboarding integration**
   - compose Store setup and billing facts into approved UI states.

9. **Store-capacity enforcement**
   - atomic active-Store capacity verification during Store activation; draft/ready setup remains outside capacity.

10. **Order entitlement enforcement**
    - part of the future order feature, using the shared resolver.

The webhook/projection foundation must exist before real paid Checkout is enabled.

---

## 32. Required current-state documentation follow-up

After the corresponding behavior is implemented, review/update:

- `docs/ARCHITECTURE.md` — distinguish local initial trial from paid Stripe lifecycle;
- `docs/AUTHORIZATION.md` — identify trial-or-paid normalized entitlement;
- `docs/DATABASE.md` — replace the single mixed trial/subscription concept with the four planned entities;
- `docs/MULTI_TENANCY.md` — reference normalized Organization entitlement where relevant;
- `docs/DEVELOPMENT.md` — document Stripe environment/CLI workflow;
- `.env.example` — add only approved empty placeholders in the implementation slice that needs them.

These current-state files must not claim unimplemented billing behavior as already available.

---

## 33. Acceptance criteria

The Billing Foundation is complete only when the applicable incremental slices have satisfied all of the following:

- [ ] Initial trial is local/PostgreSQL and lasts exactly 15 days.
- [ ] Starting a trial creates no Stripe Customer or Subscription.
- [ ] One initial trial per Clerk User and per Organization is database-enforced.
- [ ] Expired/revoked initial trials remain consumed.
- [ ] Manual overrides are additional, auditable, and Deli Plus admin-only.
- [ ] Trial validity uses database time.
- [ ] Trial grants full Essential entitlement, including normal order intake and `maxStores = 1`.
- [ ] Initial self-service trial cannot resolve to a multi-Store plan.
- [ ] Trial expiration performs no destructive deletion.
- [ ] Stripe begins only at paid conversion.
- [ ] One canonical Stripe Customer exists at most per Organization.
- [ ] Paid Checkout accepts only an internal PlanCode and server-mapped Price.
- [ ] `essential`, `multi_2`, and `multi_3` resolve respectively to Store capacities 1, 2, and 3.
- [ ] All three plans retain the same principal MVP functionality without invented feature gates.
- [ ] `maxStores` is derived from plan configuration and is not persisted redundantly in the subscription projection.
- [ ] Four-or-more-Store demand follows a contact/sales-assisted path without an automatic fourth plan.
- [ ] No Stripe trial is configured in paid conversion.
- [ ] Hosted Checkout, Customer Portal, and mandatory webhooks use server-only boundaries.
- [ ] Stripe Connect and custom payment UI are absent.
- [ ] No publishable Stripe key is introduced without a concrete client-side requirement.
- [ ] Paid projection contains no local trial fields.
- [ ] `active` and `past_due` grant paid entitlement.
- [ ] `incomplete`, `incomplete_expired`, `unpaid`, `canceled`, `paused`, `trialing`, unknown, and collection-paused states do not grant paid entitlement.
- [ ] Cancel-at-period-end retains access while status remains entitled.
- [ ] Local trial or paid subscription resolves through one normalized entitlement model.
- [ ] Paid entitlement has descriptive precedence when both sources are valid.
- [ ] Webhook signatures are verified against raw bodies before processing.
- [ ] Webhook Event IDs are persisted and projection application is idempotent/atomic.
- [ ] Full Stripe webhook payloads are not persisted by default.
- [ ] Normal requests do not call Stripe to resolve entitlement.
- [ ] `anon` has no billing table access.
- [ ] `authenticated` has no generic billing writes.
- [ ] Tenant isolation and least-privilege reads are enforced by RLS/grants.
- [ ] Store-capacity checks derive from `planCode`, not a one-Store schema constraint.
- [ ] New-order authorization is planned to revalidate entitlement server-side.
- [ ] Local, Staging/Test, and Production/Live resources remain isolated.
- [ ] Focused Node and pgTAP tests pass for each implemented slice.
- [ ] Existing tenant-core tests continue to pass.
- [ ] Lint, typecheck, build, and diff checks pass.
- [ ] No secrets or real environment values are committed/logged.
- [ ] No out-of-scope feature is introduced.

---

## 34. Implementation authorization

This specification is approved for incremental implementation.

It does not authorize:

- remote Stripe Product/Price creation without explicit action approval;
- hosted webhook configuration without explicit action approval;
- Staging/Production database mutation without explicit review;
- inventing any plan price, billing interval, discount, additional-Store price, or custom/enterprise price;
- implementing Store readiness, Store creation, or orders outside their own approved features;
- enabling Stripe Tax without a separately approved tax requirement and active registrations;
- expanding the self-service plan catalog beyond `essential`, `multi_2`, and `multi_3`;
- creating an automatic plan or Stripe Price for four or more Stores.

Any deviation from the locked product decisions or source-of-truth boundaries requires review before implementation continues.

## 35. Billing success confirmation coordinator

The Stripe return URL is presentation/navigation only. Webhook-projected local
entitlement remains authoritative. Preserve the acquisition and webhook boundaries.

- `/dashboard/billing/success` reads the existing local Billing state. Paid entitlement
  redirects server-side immediately to `/dashboard?billingSuccess=1`.
- Resolved trial/no-paid state renders confirmation pending, without asserting payment
  receipt. A client effect refreshes the local server read every 2 seconds, at most
  12 seconds, and clears both timers on unmount/navigation.
- Timeout replaces the route with `/dashboard?billingPending=1`, never payment failure.
- Dashboard keeps `getDashboardOverview()` as its only read model. Either exact marker
  plus paid entitlement shows a temporary success Alert; otherwise an informational
  confirmation Alert persists. Normal visits show no Billing feedback.
- Confirmed feedback consumes billing markers without changing other query values or
  business state. Existing authentication, provisioning, Store access, trial precedence,
  plan cards and publication feedback remain intact.
- No Stripe polling, Session ID dependency, billing write, migration, environment
  variable, new dependency or automatic purchase is required.
