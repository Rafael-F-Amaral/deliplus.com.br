# Deli Plus

Deli Plus is a multi-tenant SaaS for food-delivery merchants. The current
foundation combines Clerk Organizations, Supabase/PostgreSQL tenant and Store
authorization, a public Store read boundary, and Stripe subscription billing.

## Start here

1. Read [`docs/HANDOFF.md`](docs/HANDOFF.md) for the current project state,
   ownership, roadmap, and production-readiness gaps.
2. Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the authoritative
   high-level architecture.
3. Use [`docs/DATABASE.md`](docs/DATABASE.md),
   [`docs/AUTHORIZATION.md`](docs/AUTHORIZATION.md), and
   [`docs/FRONTEND_INTEGRATION.md`](docs/FRONTEND_INTEGRATION.md) for the current
   database, security, and application integration contracts.
4. Use [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) for local setup, environment
   variables, migrations, Stripe forwarding, and validation.
5. Treat `docs/features/**/SPEC.md` and `PLAN.md` as feature contracts and
   implementation history. Applied migrations under `supabase/migrations/`
   remain the SQL source of truth.

## Local development

```bash
yarn install
yarn supabase start
yarn dev
```

Copy `.env.example` to an ignored local environment file and provide only the
credentials and provider identifiers for the environment being used. Never
commit secrets.

Baseline verification:

```bash
yarn lint
yarn typecheck
yarn build
```

Domain and integration scripts are listed in `package.json`. Database security
tests run with:

```bash
yarn supabase test db
```

## Collaboration

Use feature branches and pull requests to `main`. Rafael has full technical
ownership of Deli Plus and may change any subsystem. Sensitive changes are not
reserved for Jesse; they require deliberate design, safe forward migrations,
tenant/security review, tests, and updated documentation.
