# Deli Plus — Tenant Provisioning

**Path:** `docs/features/tenant-provisioning/SPEC.md`<br>
**Status:** Approved<br>
**Scope:** Phase A — provision/resolve the internal DeliPlus Organization<br>
**Last updated:** 2026-08-24

## 1. Purpose

Define the first trusted server-side provisioning operation in Deli Plus.

This feature provisions the internal `public.organizations` record that corresponds to the currently active Clerk Organization.

It intentionally does **not** create a Store, subscription, trial, Stripe customer, billing entitlement, Store membership, onboarding UI, or team-management flow.

The feature introduces the trusted server-write boundary required because normal authenticated Supabase access to the tenant core is intentionally read-only.

Expected implementation flow:

`SPEC → PLAN → IMPLEMENT → VERIFY → REVIEW`

---

## 2. Existing architecture

Deli Plus currently uses:

- Next.js App Router;
- Clerk for authentication;
- Clerk Organizations for Organization membership and roles;
- Supabase PostgreSQL for application/domain data;
- Supabase Third-Party Auth with Clerk;
- `@supabase/supabase-js`;
- a normal server-side Supabase client using the publishable key and Clerk JWT;
- RLS-protected `organizations`, `stores`, and `store_memberships`;
- tenant-core Data API access where `authenticated` has read-only access.

The tenant-core security boundary is intentionally:

```text
anon
→ no tenant-core access

authenticated
→ SELECT only
→ no INSERT / UPDATE / DELETE / TRUNCATE
```

This feature must not weaken that boundary.

---

## 3. Locked architectural decisions

### 3.1 Trusted server writes use a separate privileged Supabase client

Phase A uses a dedicated Supabase client initialized with a backend-only Supabase Secret API Key.

This client:

- exists only in server-only code;
- is separate from the normal Clerk/RLS Supabase client;
- does not forward a Clerk access token;
- bypasses RLS through the Supabase `service_role` database role;
- is used only behind narrow trusted application operations.

Do not reuse the normal RLS client for privileged writes.

Do not expose or export a general-purpose admin client to client components.

### 3.2 Prefer the current Supabase Secret API Key

Hosted environments should use the current Supabase Secret API Key (`sb_secret_...`) rather than introducing the legacy JWT-based `service_role` key when a modern secret key is available.

The application environment variable is:

```text
SUPABASE_SECRET_KEY
```

It must never use a `NEXT_PUBLIC_` prefix.

The local Supabase CLI currently exposes a local Secret key as part of the local stack, so local development should use the local secret corresponding to the local Supabase URL.

### 3.3 The privileged client must never inherit the Clerk user token

The privileged client must not configure:

```text
accessToken()
```

and must not share Supabase Auth/browser session state.

Its purpose is explicit backend administration.

### 3.4 Clerk remains the authorization source for provisioning

The privileged database credential does not authorize the human user.

Before any privileged write, Deli Plus must independently verify through Clerk:

- authenticated user;
- active Clerk Organization;
- Organization admin role.

### 3.5 Internal Organization is created before billing

The internal DeliPlus Organization may exist before Stripe/billing.

This provides a stable internal UUID for future billing references and retries.

A failed or abandoned billing flow must not automatically delete the internal Organization.

### 3.6 Store provisioning is a separate phase

Creating the internal Organization must not create an initial Store.

Future flow:

```text
Clerk Organization
  → internal DeliPlus Organization
  → draft Store
  → Store setup
  → ready Store
  → future trial/paid activation boundary
```

The current database remains `Organization 1 → N Stores`.

---

## 4. Goal

Implement one narrow server-side capability:

```text
ensureActiveOrganization()
```

Conceptually:

```text
verified Clerk session
  → verified active Clerk Organization
  → verify org:admin
  → ensure exactly one matching public.organizations row
  → return minimal internal Organization identity
```

The operation must be:

- server-only;
- idempotent;
- safe under retries;
- safe under concurrent requests;
- unable to provision another tenant chosen by the browser.

---

## 5. Non-goals

Do not implement:

- Store creation;
- Store forms;
- Store-capacity enforcement;
- Stripe;
- Stripe customer creation;
- subscriptions;
- billing projection tables;
- trial;
- trial eligibility;
- checkout;
- webhooks;
- Clerk Organization creation;
- Organization switcher;
- onboarding UI;
- middleware/proxy provisioning;
- Store memberships;
- team invitations;
- team-management UI;
- products;
- categories;
- orders;
- delivery;
- browser Supabase client;
- database RPC for provisioning;
- `SECURITY DEFINER` function.

---

## 6. Trusted Supabase client

Create a dedicated server-only module, conceptually:

```text
lib/supabase/admin.ts
```

Requirements:

- import `server-only`;
- use `@supabase/supabase-js`;
- use `NEXT_PUBLIC_SUPABASE_URL` for the project URL unless the repository establishes a server-specific URL convention;
- use `SUPABASE_SECRET_KEY`;
- fail clearly if required environment variables are absent;
- configure auth session behavior so no user/browser session is persisted or detected;
- do not provide `accessToken`;
- do not import Clerk;
- do not log keys;
- do not expose the key through return values/errors.

Recommended Supabase auth options for the admin client:

```text
autoRefreshToken: false
persistSession: false
detectSessionInUrl: false
```

The module may expose a narrowly named factory/client helper, but feature code should expose narrow domain operations rather than encouraging arbitrary privileged queries throughout the codebase.

---

## 7. Environment requirements

Add to `.env.example`:

```text
SUPABASE_SECRET_KEY=
```

Rules:

- empty placeholder only;
- no real value in Git;
- no `NEXT_PUBLIC_` prefix;
- local value belongs in ignored local environment configuration;
- Preview/Staging should use a secret belonging to the Staging Supabase project;
- Production must later use a separate Production secret;
- never share one hosted environment's secret with another environment.

The current local Supabase stack should use its local Secret key.

No secret may be printed by tests, logs, build output or final agent reports.

---

## 8. Provisioning API boundary

The implementation should expose a narrow server-side operation, conceptually:

```text
ensureActiveOrganization()
```

It must not accept:

- `clerk_organization_id`;
- internal `organization_id`;
- Organization role;
- Clerk User ID;

as authority-bearing arguments from the browser.

The identity and Organization context must be obtained inside the trusted server operation from Clerk.

---

## 9. Clerk authorization

Inside the provisioning operation:

1. call Clerk server-side auth;
2. require an authenticated user;
3. require an active Clerk Organization;
4. require Organization admin access.

Expected role:

```text
org:admin
```

The exact current Clerk API may use the server auth object's role/`has()` helpers according to the installed Clerk version.

Do not rely on:

- a client-provided role;
- hidden UI buttons;
- a prior layout guard;
- middleware alone;
- URL/query parameters.

Authorization must occur again at the mutation boundary.

---

## 10. Organization creation algorithm

The database already has:

```text
UNIQUE(clerk_organization_id)
```

Use that constraint as the concurrency boundary.

Preferred algorithm:

```text
verified orgId

INSERT organizations(clerk_organization_id = orgId)
ON CONFLICT (clerk_organization_id) DO NOTHING

SELECT id, clerk_organization_id
WHERE clerk_organization_id = verified orgId
```

Requirements:

- do not use `SELECT → INSERT` as the primary race-control strategy;
- do not use `ON CONFLICT DO UPDATE` only to force `RETURNING`, because an idempotent retry should not mutate `updated_at`;
- return the existing row after conflict;
- return only the minimal fields required by the caller.

The operation must converge to one internal UUID under concurrent requests.

No new database migration is expected for Phase A unless implementation discovers a concrete missing constraint.

---

## 11. Idempotency

Expected behavior:

### First call

```text
internal Organization missing
→ create
→ return internal Organization
```

### Repeated call

```text
internal Organization exists
→ do not mutate
→ return same internal Organization
```

### Concurrent calls

```text
multiple requests for same Clerk Organization
→ unique constraint allows one row
→ all successful callers resolve same row
```

### Unknown insert result / network failure

Retrying the operation must be safe.

---

## 12. Error behavior

The domain operation should distinguish useful application states without leaking tenant data.

Conceptual outcomes:

### Not authenticated

Provisioning does not occur.

### No active Organization

Provisioning does not occur.

The application may later route the user to Organization creation/selection.

### Organization member, not admin

Provisioning does not occur.

Return/throw an authorization-safe result suitable for the onboarding layer.

### Organization admin

Provision or resolve the internal Organization.

### Database failure

Do not return raw privileged Supabase details to the browser.

Server logs may record safe diagnostic context but must never include the Secret API Key.

---

## 13. Read path after provisioning

The privileged client is for the mutation boundary only.

Normal application reads after provisioning should continue using the existing Clerk-token/RLS Supabase client.

Conceptually:

```text
privileged client
→ ensure Organization

normal Clerk/RLS client
→ read Organization / Stores
```

Do not let the presence of a Secret key become a reason to bypass RLS for ordinary dashboard reads.

---

## 14. Onboarding state model

This Phase A prepares the following future state machine:

| State | Future destination |
| --- | --- |
| Not authenticated | Sign-in |
| Authenticated, no active Clerk Organization | Create/select Organization |
| Active Organization, no internal Organization, admin | Provision Phase A |
| Active Organization, no internal Organization, member | Wait for admin / select another Organization |
| Internal Organization, no Store | Initial draft Store setup |
| Draft Store | Continue Store setup |
| Ready Store, no entitlement | Trial/paid activation flow |
| Active Store with valid entitlement | Operational dashboard |
| Member without Store assignment | Await Store assignment |

This feature implements only the internal-Organization provisioning operation.

Do not implement the full resolver/router unless separately specified.

---

## 15. Billing boundary

Future subscription ownership remains:

```text
subscription
→ public.organizations.id
```

Not:

```text
subscription → Clerk User
subscription → individual Store
```

The internal Organization may therefore be created before billing and used as the stable billing subject.

No billing state should be inferred from the presence of an internal Organization.

---

## 16. Trial boundary

Current product direction:

```text
15-day Essential trial
```

But trial eligibility remains undefined.

This feature must not grant, start, infer or persist a trial.

Creating an internal Organization does not imply trial eligibility.

---

## 17. Store provisioning boundary

The initial Store will be implemented later.

Future Store creation must verify:

- authenticated Clerk admin;
- active Organization;
- internal Organization;
- trusted billing entitlement;
- Store capacity;
- idempotency/concurrency;
- Store validation.

Store creation must not use a simple non-transactional:

```text
count Stores
→ insert Store
```

when capacity enforcement is introduced.

The definitive transaction/locking design belongs to the Store-provisioning/billing specifications.

---

## 18. Testing requirements

Implementation must test at least:

### Privileged client boundary

- server-only module;
- missing secret fails safely;
- normal Clerk/RLS client remains unchanged;
- Secret key is never exported to client code.

### Authorization

- unauthenticated cannot provision;
- no active Organization cannot provision;
- Organization member cannot provision;
- Organization admin can provision.

### Identity authority

- browser cannot choose another Clerk Organization ID;
- operation uses verified active Organization from Clerk.

### Idempotency

- first call creates;
- repeated call returns same internal UUID;
- existing row is not updated merely due to retry.

### Concurrency strategy

Verify at least structurally/integration-wise that the implementation relies on `UNIQUE(clerk_organization_id)` + conflict handling rather than `SELECT → INSERT`.

If a practical automated concurrent integration test is reasonable in the existing test stack, include it. Do not introduce a large new testing framework solely for this feature.

---

## 19. Validation

Before review, run:

```bash
yarn lint
yarn typecheck
yarn build
```

Run any relevant tenant/provisioning tests introduced by the implementation.

Inspect:

```bash
git status
git diff
git diff --check
```

No secret may appear in the diff.

No remote database mutation is required by this Phase A if no migration is introduced.

---

## 20. Documentation requirements

Implementation should update current-state docs only where implementation makes the behavior real.

Relevant architecture decision:

```text
docs/decisions/ADR-003-trusted-server-write-boundary.md
```

Do not silently broaden the trusted boundary beyond what ADR-003 permits.

---

## 21. Acceptance criteria

- [ ] A separate server-only Supabase privileged client exists.
- [ ] It uses `SUPABASE_SECRET_KEY`.
- [ ] It never receives a Clerk access token.
- [ ] Existing Clerk/RLS Supabase client remains the normal read path.
- [ ] `.env.example` contains only an empty `SUPABASE_SECRET_KEY=` placeholder.
- [ ] No secret is committed or logged.
- [ ] `ensureActiveOrganization()` derives active Organization from Clerk server auth.
- [ ] Only Organization admins can provision.
- [ ] Clerk members cannot provision.
- [ ] Browser input cannot choose the tenant being provisioned.
- [ ] Provisioning is idempotent.
- [ ] Concurrent calls cannot create duplicate internal Organizations.
- [ ] Repeated calls do not update the row merely to return it.
- [ ] No Store is created.
- [ ] No billing/trial logic is introduced.
- [ ] No `SECURITY DEFINER` RPC is introduced.
- [ ] No tenant-core RLS/grants are weakened.
- [ ] Lint passes.
- [ ] Typecheck passes.
- [ ] Production build passes.
- [ ] Final diff contains no credentials.

---

## 22. Future features

After Phase A:

1. onboarding state resolver;
2. billing/Stripe specification;
3. billing projection/webhooks;
4. initial Store draft/setup;
5. Store activation and atomic capacity enforcement;
6. onboarding UI;
7. Store selector;
8. team management and Store assignment mutations.

---

## 23. Implementation instruction

Before implementation, the coding agent must:

1. read `AGENTS.md`;
2. read current architecture/auth/database/multi-tenancy docs;
3. read ADR-001, ADR-002 and ADR-003;
4. read this SPEC;
5. inspect the current Clerk and Supabase server helpers;
6. verify the current official APIs used by installed package versions;
7. produce a focused implementation plan if repository workflow requires one;
8. preserve the normal Clerk/RLS client;
9. keep all privileged access server-only;
10. report any required deviation before implementing it.
