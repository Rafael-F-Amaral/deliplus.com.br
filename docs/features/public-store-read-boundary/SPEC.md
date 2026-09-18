# Public Store Read Boundary

## Scope and contract

`/{storeSlug}` renders a minimal public Store page without a Clerk session, active
Organization, billing lookup, or authenticated database role. Only persisted `active`
Stores are visible. Draft, ready, inactive, unknown and invalid slugs converge to
`not_found` and Next.js `notFound()`. Infrastructure failures throw
`PublicStoreReadError`; they are never silently converted to absence.

```ts
type PublicStore = { name: string; slug: string }
type GetPublicStoreResult =
  | { status: "found"; store: PublicStore }
  | { status: "not_found" }
```

Dependency direction:

```text
app/[storeSlug]/page.tsx
  -> getPublicStoreBySlug()
  -> public-store.repository.ts
  -> createAnonymousSupabaseClient()
  -> public.get_public_store_by_slug(p_slug text)
  -> active public.stores row only
```

The explicit projection is `TABLE(name text, slug text)`. No UUID, tenant identity,
Clerk identity, status, timestamp, billing or entitlement fact is public. Unexpected
row counts/shapes fail closed. The DTO copies allowlisted fields rather than spreading
the RPC row. Public input must already be canonical; unlike setup input, it is not
lossily normalized into another Store's URL.

## Schema and route audit

Reviewed `main` at `b956236` after fetch; clean and equal to `origin/main`.
`stores` columns: `id uuid`, `organization_id uuid`, `name text`, `slug text`,
`status text`, `created_at timestamptz`, `updated_at timestamptz`, nullable
`activated_at timestamptz`. Other columns are NOT NULL. Status is
`draft | ready | active | inactive`; activation timestamp invariants and lifecycle
triggers remain unchanged. The name must not be blank.

Slug uniqueness is GLOBAL: `stores_slug_key` is a unique B-tree on `slug`, not on
`(organization_id, slug)`. The format constraint permits 3–63 lowercase ASCII
alphanumeric characters separated by single hyphens. Other Store indexes are
`stores_pkey (id)` and `stores_organization_id_id_key (organization_id, id)`.
The global unique index already serves this lookup; no new index is necessary.
The local catalog confirms these indexes and zero existing reserved slugs at audit.

Actual top-level routes: `/`, `/dashboard` and its children, `/onboarding`,
`/sign-in/[[...sign-in]]`, `/sign-up/[[...sign-up]]`, `/api/stripe/webhook`.
`app/favicon.ico` is the only current static asset; `public/` has no assets.
The existing reserved list retains `api`, `dashboard`, `sign-in`, `sign-up`,
`pricing`, `trpc` and now adds the missing `onboarding`. `pricing` is an existing
product reservation; `trpc` is already in the proxy matcher. No speculative list
is added. `_next`, `__clerk`, `.well-known`, `favicon.ico`, `robots.txt`,
`sitemap.xml` and metadata filenames with dots are already invalid canonical slugs.
The root URL cannot be a slug. Future static segments/assets must update this audit
and shared validation before launch; a test checks actual top-level directories.

`isReservedStoreSlug()` remains centralized in `store-setup.rules.ts` and is
enforced server-side by both create and update, as well as readiness validation.
Application-domain validation is sufficient under the existing trusted write
contract: anon/authenticated cannot write Store setup and service-role RPCs are
reachable only behind the authorized server domain service. There is deliberately
no duplicate SQL reserved-word list or new constraint; future trusted writers must
reuse the same domain rules. This is not a guarantee against privileged operator SQL.

## Database security and migration

Forward-only migration `20260912120000_public_store_read_boundary.sql` creates one
SQL, STABLE, SECURITY DEFINER function owned by postgres with `search_path = ''`,
qualified objects, parameterized static SQL and `status = 'active'`.
It revokes execution from PUBLIC, anon, authenticated and service_role, then grants
only anon EXECUTE. No table grants, policies, historical migrations or lifecycle
functions change. `anon` has neither table nor column SELECT on stores.
Authenticated SELECT remains subject to active-Organization RLS: admins see their
Organization's Stores; members see only assigned Stores in that Organization.
The owner has administrative privileges; service_role has no direct Store grants.

The server-only anonymous client uses only existing
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, disables
session persistence/refresh/URL detection, and supplies no Clerk token or secret key.
It remains anonymous even when the visitor is signed in to Clerk.

## Freshness and indexing

The page is `force-dynamic`; anonymous client fetches are `cache: "no-store"`.
No long-lived or cross-request cache is introduced. A subsequent request sees
deactivation; an already-open page is not pushed an update. The temporary page uses
`robots: { index: false, follow: false }` until catalog/storefront UI is ready.
No sitemap, SEO system, catalog, orders, cart or checkout is included.

The root ClerkProvider and passive clerkMiddleware remain shared application
infrastructure but perform no login/onboarding redirect for this page. Independence
means no visitor session is required, not removal of the installed Clerk integration.

Public GET deliberately does not check billing. Publication relies on persisted
Store state. Entitlement expiration and any future unpublishing policy remain a
separate lifecycle decision; protected operations/order intake are not authorized by
this public read contract.

## Verification and implementation plan

1. Audit schema, grants, routes and trusted write boundaries; stop on scoped slug uniqueness.
2. Add the narrow RPC and anonymous/domain/repository layers, extend shared slug rule.
3. Add minimal page, pgTAP metadata/grant/behavior tests, application and route tests.
4. Apply locally, run full pgTAP and relevant regressions, lint/types/build/diff checks.
5. Inspect migration list and remote dry-run only; document exact local E2E.

No remote database mutation, commit, push, merge or rebase is authorized.

## Implementation verification (2026-09-12)

- Application/route tests: 11 passed; real local anonymous Data API integration:
  8 passed (including parent), including authenticated deactivation followed by absence.
- Store setup: 53 passed, plus 1 real trusted-write integration.
- Trial activation: 28 passed + 3 concurrency; entitlement activation: 48 passed +
  6 concurrency; activation coordinator: 34 passed.
- Onboarding resolver: 11 passed; coordinator: 21 passed; tenant provisioning: 19 passed.
- Dashboard Overview: 24 domain + 15 UI passed; entitlement resolver: 53 passed.
- Full pgTAP: 700 assertions in 10 files passed, including 25 public-read assertions.
- SQL lint, TypeScript, production build and diff whitespace check passed. Build
  required network access for the existing Google Fonts downloads.
- Initial verification found an existing `@next/next/no-html-link-for-pages`
  violation in `app/dashboard/billing/success/page.tsx:73`, also present in main.
  The authorized finalization replaces the same-page refresh anchor with a small
  `router.refresh()` button. Polling, entitlement and redirects remain unchanged.
- Generated local database types were checked against the added RPC declaration.
- Production route manifest retains static application routes; Clerk sign-in/up
  catch-all entries precede `/{storeSlug}` in dynamic route matching.
- Remote migration list/dry-run shows only `20260912120000_public_store_read_boundary.sql`
  pending. No remote push was executed.

Jesse subsequently reported that the manual public storefront E2E passed.
This is user-reported browser verification. Exact steps are in `docs/DEVELOPMENT.md`.

## Dashboard link finalization

`listAccessibleStoreLinks()` is a separate zero-argument authenticated read API.
It resolves the verified Clerk tenant through the existing onboarding resolver,
uses the normal Clerk-JWT Supabase client and existing RLS, and selects only
`name, slug` for active Stores in that Organization. The setup API is admin-only,
and the accessible summary provides only counts, so neither is an appropriate
link listing. Dashboard Overview remains unchanged. No admin client, anonymous RPC,
billing read, new grant, policy, or migration is introduced for this listing.

The dashboard renders one “Abrir loja” link per accessible active Store, opening
`/{slug}` in a new tab with `noopener noreferrer`. It shows no public link for
unavailable Stores. A failed read shows a safe message; no links are fabricated.
The public RPC remains authoritative if Store state changes after dashboard render.

Finalization validation: 177 application/integration tests passed (4 Store links,
42 Dashboard, 20 Billing Success, 39 billing UI, 19 public Store, 53 Store setup).
All 700 pgTAP assertions passed again. Global lint, typecheck, production build and
`git diff --check` passed. Migration list and remote dry-run still show only
`20260912120000_public_store_read_boundary.sql` pending; no remote push occurred.
