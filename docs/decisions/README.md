# Architecture Decision Records (ADRs)

Use this directory for durable, non-obvious technical decisions.

ADRs should be short. They exist so future contributors and coding agents can understand why the repository follows a pattern instead of repeatedly reopening the same question.

## Naming

```text
ADR-001-short-title.md
ADR-002-short-title.md
```

## Template

```markdown
# ADR-XXX: Decision title

## Status
Proposed | Accepted | Superseded

## Context
What problem or constraint requires a decision?

## Decision
What was decided?

## Consequences
What becomes easier, harder, required or intentionally unsupported?

## Alternatives considered
Briefly list meaningful alternatives and why they were not selected.
```

## Good ADR candidates

- tenant model;
- one vs multiple stores per organization;
- Clerk-to-application identity mapping;
- RLS strategy;
- money representation;
- order lifecycle;
- custom domains;
- Stripe subscription ownership/model;
- introduction of an ORM or validation framework.

Do not write ADRs for trivial implementation details.
