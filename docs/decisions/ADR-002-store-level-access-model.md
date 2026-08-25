# ADR-002: Store-level access model

## Status

Accepted

## Context

A DeliPlus Organization can own multiple Stores.

Clerk Organization membership is tenant-wide. A member added to a Clerk Organization is a member of the business, but DeliPlus needs to support cases where that user may operate only some units.

Example:

```text
Organization: Grupo Bella

Stores:
- Bella Centro
- Bella Norte
- Bella Shopping

Rafael
- Organization member
- should access Bella Centro only

Maria
- Organization member
- should access Bella Centro and Bella Shopping

João
- Organization admin
- should access every Store in the Organization
```

Modeling each Store as a separate Clerk Organization would simplify early authorization but would fragment shared billing, business administration and multi-unit management.

Storing Store IDs in Clerk membership metadata/session claims would couple dynamic application authorization to Clerk metadata and make Store assignment harder to query and maintain as the number of Stores/users grows.

## Decision

Keep:

```text
Clerk Organization = business/tenant
DeliPlus Store      = operational unit
```

Clerk remains the source of truth for:

- Organization membership;
- active Organization;
- Organization role.

DeliPlus/PostgreSQL becomes the source of truth for Store-specific assignments.

Introduce a Store assignment relation conceptually named:

```text
store_memberships
```

Initial semantics:

```text
Organization admin
  -> access all Stores owned by active Organization

Organization member
  -> access only Stores explicitly assigned through store_memberships
```

A Store membership never grants access unless the user also belongs to the matching active Clerk Organization.

The current Clerk User ID is derived from the verified JWT `sub` claim.

The Store assignment relation initially represents access only. Store-specific roles/permissions are deferred until a dedicated feature defines them.

## Data model

Conceptually:

```text
store_memberships

id
organization_id
store_id
clerk_user_id
created_at
updated_at
```

Constraints:

```text
UNIQUE(store_id, clerk_user_id)

FOREIGN KEY (organization_id, store_id)
  REFERENCES stores(organization_id, id)
```

The composite foreign key makes the Store's Organization identity explicit and
prevents cross-Organization assignment rows.

`clerk_user_id` is an external Clerk identifier, not a domain primary key.

## UI consequence

The Clerk Organization UI may remain available for Organization switching/account-level management.

DeliPlus owns Store-specific UX:

```text
StoreSwitcher
/dashboard/team
/dashboard/stores
```

Future team management should present one DeliPlus flow that coordinates:

```text
Clerk Organization invite/member
+
DeliPlus Store assignment
```

The merchant should not need to manually understand or synchronize two separate systems.

## Security consequence

Store access must always verify both:

1. Store belongs to the active Organization.
2. User has access according to Organization role / Store assignment.

For normal Organization members, knowing a Store ID or slug is never sufficient.

The first tenant-core migration should not expose generic authenticated writes for Store assignment. Assignment mutation will be implemented later through a trusted server-side team-management boundary.

## Consequences

### Benefits

- preserves one shared Organization/billing boundary for multi-unit businesses;
- supports Store-specific staff access;
- supports regional/multi-Store users;
- avoids one Clerk Organization per physical unit;
- keeps dynamic Store assignment in the application database where Stores already live;
- allows DeliPlus to build a unified team-management experience.

### Costs

- DeliPlus must build Store selection and Store team-access UI;
- team management coordinates Clerk and PostgreSQL;
- RLS becomes more sophisticated because it must distinguish Organization admins from assigned Organization members;
- pending invitation/assignment lifecycle requires explicit design.

## Alternatives considered

### One Clerk Organization per Store

Rejected because it fragments a multi-unit business into multiple tenants and complicates shared billing, administration and plans with Store capacity.

### Give every Organization member every Store

Rejected because it cannot represent real multi-unit staff boundaries.

### Store IDs in Clerk metadata/session claims

Rejected as the canonical source because Store assignment is DeliPlus domain data, may change frequently, and should remain queryable/relational in PostgreSQL.

### Local Organization membership mirror

Rejected because it duplicates Clerk Organization membership unnecessarily. Only Store-specific assignment is persisted locally.
