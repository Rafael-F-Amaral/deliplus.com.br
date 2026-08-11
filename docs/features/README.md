# Feature Specifications

This directory contains product/engineering specifications for features before or alongside implementation.

The goal is not to produce heavy documentation. A spec should remove ambiguity that would otherwise be decided accidentally inside code or by a coding agent.

## When a spec is useful

Create a spec when a feature:

- spans multiple screens/components;
- changes persisted data;
- introduces permissions;
- has meaningful business rules;
- affects multiple contributors;
- is large enough that implementation should be planned first.

Tiny UI fixes do not require a formal spec.

## Suggested structure

Create one directory per substantial feature:

```text
docs/features/products/
  SPEC.md

docs/features/orders/
  SPEC.md
```

Add additional documents only when they provide real value.

## SPEC template

```markdown
# Feature name

## Status
Draft | Approved | Implemented

## Goal
What user/business problem does this solve?

## Actors
Who uses it?

## User flows
What can the user do?

## Requirements
- ...

## Business rules
- ...

## Data requirements
What must be persisted or queried?

## Authorization
Who may read/change what?

## UI states
Loading, empty, validation, error, success.

## Out of scope
Explicitly excluded behavior.

## Acceptance criteria
- [ ] ...

## Open questions
Only unresolved decisions that block or materially affect implementation.
```

## Implementation flow

Recommended flow:

```text
SPEC
  -> implementation plan
  -> implementation
  -> verification
  -> pull request/review
```

The spec states **what must be true**. The implementation plan states **how the current codebase will make it true**.

Do not let an implementation plan silently change approved product requirements.
