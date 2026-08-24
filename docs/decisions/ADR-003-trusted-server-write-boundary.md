# ADR-003: Trusted server write boundary

## Status

Accepted

## Context

Deli Plus intentionally keeps normal tenant-core Supabase access read-only:

```text
authenticated
→ SELECT organizations
→ SELECT stores
→ SELECT store_memberships
→ no generic writes
```

This prevents a browser or authenticated user from bypassing application rules such as:

- onboarding;
- billing;
- Store-capacity limits;
- Store membership administration.

Deli Plus nevertheless requires trusted backend operations that can create or update domain records after server-side authorization.

The first such operation is creating/resolving the internal `public.organizations` row for the active Clerk Organization.

Two primary approaches were considered:

1. a server-only Supabase client using a privileged Secret API Key;
2. PostgreSQL RPC/functions using `SECURITY DEFINER`.

## Decision

Deli Plus will use a dedicated **server-only Supabase privileged client** as the default trusted write boundary for application orchestration.

Hosted environments should use a current Supabase Secret API Key (`sb_secret_...`) where available.

The application environment variable is:

```text
SUPABASE_SECRET_KEY
```

The privileged client is conceptually located at:

```text
lib/supabase/admin.ts
```

and must:

- import `server-only`;
- never be imported by Client Components;
- use a Secret API Key with no `NEXT_PUBLIC_` prefix;
- never forward a Clerk user access token;
- disable persistence/detection of user sessions;
- remain separate from the normal Clerk/RLS Supabase client;
- never be logged or returned to callers.

The Secret key bypasses RLS through Supabase's privileged database role. Therefore it is not itself an application authorization mechanism.

Every privileged domain operation must first perform explicit trusted server-side authorization using the relevant source of identity and business rules.

For tenant provisioning, this means:

```text
verified Clerk user
  → verified active Clerk Organization
  → verified Organization admin
  → privileged database write
```

Feature code should expose narrow domain operations rather than encouraging arbitrary admin-client use throughout the application.

## Phase A application

The first approved privileged operation is:

```text
ensureActiveOrganization()
```

It may create or resolve the internal DeliPlus Organization for the verified active Clerk Organization.

It must not accept a browser-selected Organization ID as authority.

It uses the existing:

```text
UNIQUE(clerk_organization_id)
```

constraint for idempotency/concurrency.

The internal Organization is allowed to exist before billing so future billing records can reference a stable internal UUID.

Creating the internal Organization does not:

- create a Store;
- grant a trial;
- create a Stripe customer/subscription;
- imply billing entitlement.

## Normal application access remains RLS-bound

The existing Supabase client that uses:

- publishable key;
- Clerk JWT via `accessToken`;

remains the normal read/access path for authenticated application behavior.

The privileged client must not replace RLS-backed access merely for convenience.

Conceptually:

```text
normal server client
→ Clerk JWT
→ RLS
→ normal tenant reads

admin server client
→ Secret API Key
→ trusted narrow mutations only
```

## Secret management

Rules:

- never commit the Secret key;
- never prefix it with `NEXT_PUBLIC_`;
- keep local values in ignored environment configuration;
- use separate hosted secrets per environment/project;
- rotate a key immediately if exposure is suspected;
- avoid logging the key or full initialized client configuration.

The Supabase Secret API Key is preferred over the legacy JWT-based `service_role` key where the current platform supports it.

## Consequences

### Benefits

- integrates cleanly with Next.js server-side orchestration;
- avoids adding privileged SQL RPC surface for simple cross-service workflows;
- supports future coordination with Stripe/webhooks;
- preserves the existing RLS model for normal application access;
- allows narrow, explicit domain mutations;
- avoids duplicating Clerk authorization logic inside PostgreSQL functions.

### Costs / risks

- the Secret key has broad database access and bypasses RLS;
- incorrect privileged queries can cross tenant boundaries;
- authorization must be performed explicitly before every trusted mutation;
- accidental client-side exposure has severe impact;
- code review must treat privileged modules as architecture-sensitive.

## Required controls

Every feature using the trusted write boundary must:

1. remain server-only;
2. authenticate/authorize before privileged access;
3. derive tenant identity from trusted server context;
4. avoid accepting client-provided tenant identity as authority;
5. scope writes explicitly;
6. keep operations narrow and auditable;
7. avoid exposing the general privileged client through UI-layer APIs;
8. include negative authorization tests;
9. avoid secrets in logs/errors;
10. preserve RLS for normal application paths.

## When an RPC may still be appropriate

This decision does not prohibit all future PostgreSQL functions.

A restricted transactional RPC may be preferable when an operation requires database-atomic behavior that is difficult to guarantee through multiple Data API calls, for example future Store-capacity enforcement.

Any future `SECURITY DEFINER` function requires a separate security review covering:

- function owner;
- `search_path`;
- EXECUTE grants;
- SQL qualification;
- RLS interactions;
- inputs derived from trusted identity;
- tests.

The default for ordinary application orchestration remains the server-only privileged client.

## Alternatives considered

### Restricted `SECURITY DEFINER` provisioning RPC

Not selected for Phase A because:

- the operation is simple;
- existing unique constraints already solve concurrency;
- it adds a privileged database object/migration;
- it duplicates some Clerk authorization concerns in SQL;
- it does not improve future Stripe orchestration.

It remains a possible option for narrow, truly transactional future database operations.

### Supabase Edge Function

Not selected because the current Next.js server already provides the trusted runtime and an additional runtime would not reduce the need for privileged credentials.

### Direct PostgreSQL connection with custom role

Not selected for the current stage because it adds database credentials, driver/pooling complexity and operational surface before there is a concrete need.

### Generic authenticated writes with RLS

Rejected.

Tenant-core generic writes would allow clients to bypass application-level onboarding, billing, Store capacity and team-management rules.
