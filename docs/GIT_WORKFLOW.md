# DeliPlus Git Workflow

## Goal

Keep two-person collaboration predictable, reviewable and safe while allowing parallel feature work.

## Branch model

Use a simple GitHub Flow model.

```text
main
  <- pull request <- feature/*
  <- pull request <- fix/*
  <- pull request <- chore/*
  <- pull request <- docs/*
```

Avoid a permanent `develop` branch unless the release process later creates a concrete need for it.

## Main branch

`main` should represent the latest integrated, reviewable state.

Recommended GitHub protection:

- no direct push to `main`;
- pull request required;
- required status checks once CI exists;
- prevent force pushes;
- prevent branch deletion;
- require conversation resolution before merge.

For two collaborators, mandatory approval can be enabled when useful, especially for architecture-sensitive changes.

## Branch naming

Examples:

```text
feature/marketing-home
feature/auth
feature/billing
feature/dashboard-products
feature/storefront-cart
fix/product-form-validation
chore/update-dependencies
docs/order-spec
```

Keep one coherent purpose per branch.

## Starting work

```bash
git checkout main
git pull
git checkout -b feature/<name>
```

## Before a pull request

Run relevant checks:

```bash
yarn lint
yarn typecheck
yarn build
```

Then inspect:

```bash
git status
git diff
```

Make sure the branch contains no unrelated edits, local secrets or generated artifacts that do not belong in source control.

## Pull requests

Every non-trivial PR should state:

- what changed;
- why;
- how it was tested;
- migrations added;
- environment variables added/changed;
- screenshots for meaningful UI work when practical;
- known limitations/follow-ups.

## Parallel work

Prefer splitting work by feature/domain boundary rather than both editing the same files simultaneously.

Before beginning a large feature, communicate ownership of shared hotspots such as:

- root layout;
- middleware/request boundary;
- shared navigation;
- shared database types;
- Supabase configuration;
- Clerk configuration;
- Stripe integration;
- migrations.

Small merge conflicts are normal. Repeated conflicts in the same shared file signal that the feature boundary should be adjusted.

## Architecture-sensitive changes

Changes to the following should receive explicit review from the repository architecture owner(s):

- database schema/migrations;
- auth/authorization;
- tenancy;
- billing/webhooks;
- routing architecture;
- environment conventions;
- `AGENTS.md`;
- architecture docs.

This should eventually be reinforced with GitHub CODEOWNERS if desired.

## Commits

Prefer small, meaningful commits.

Suggested style:

```text
feat: add product creation form
fix: scope category lookup by store
chore: configure prettier
refactor: extract storefront header
docs: add product management spec
```

Do not obsess over perfect commit history during active work, but avoid commits containing unrelated features.

## Updating a branch

Before merge, integrate the latest `main` using the team's chosen policy (merge or rebase). Do not rewrite another collaborator's published history without coordination.

## AI-assisted work

AI-generated changes follow exactly the same Git rules as manually written code.

The author of the PR remains responsible for:

- reviewing the diff;
- understanding architectural changes;
- checking security-sensitive code;
- verifying commands actually ran;
- rejecting speculative or unrelated edits.
