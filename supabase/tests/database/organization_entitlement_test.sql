begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select no_plan();

insert into public.organizations (id, clerk_organization_id)
values
  ('61000000-0000-0000-0000-000000000001', 'entitlement_org_a'),
  ('61000000-0000-0000-0000-000000000002', 'entitlement_org_b'),
  ('61000000-0000-0000-0000-000000000003', 'entitlement_org_empty');

insert into public.billing_customers (
  organization_id,
  stripe_customer_id,
  provisioning_status,
  creation_idempotency_key
)
values (
  '61000000-0000-0000-0000-000000000001',
  'cus_entitlement_a',
  'ready',
  'idem_entitlement_a'
);

-- Function definition and hardening.
select has_function(
  'public',
  'resolve_active_organization_entitlement_facts',
  array[]::text[],
  'Organization entitlement facts function exists with zero arguments'
);

select ok(
  function.pronargs = 0
  and function.proretset
  and function.provolatile = 's'
  and function.prosecdef,
  'entitlement function is zero-argument, set-returning, STABLE, and SECURITY DEFINER'
)
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
where namespace.nspname = 'public'
  and function.proname = 'resolve_active_organization_entitlement_facts';

select is(
  owner.rolname,
  'postgres',
  'entitlement function has the reviewed postgres owner'
)
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
join pg_catalog.pg_roles as owner
  on owner.oid = function.proowner
where namespace.nspname = 'public'
  and function.proname = 'resolve_active_organization_entitlement_facts';

select ok(
  function.proconfig @> array['search_path=""']::text[],
  'entitlement function has an empty search_path'
)
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
where namespace.nspname = 'public'
  and function.proname = 'resolve_active_organization_entitlement_facts';

select ok(
  function.proargnames = array[
    'trial_plan_code',
    'trial_valid_until',
    'subscription_plan_code',
    'subscription_status',
    'subscription_collection_paused'
  ]::text[]
  and function.proargmodes::text = '{t,t,t,t,t}'
  and function.proallargtypes = array[
    'text'::pg_catalog.regtype::oid,
    'timestamptz'::pg_catalog.regtype::oid,
    'text'::pg_catalog.regtype::oid,
    'text'::pg_catalog.regtype::oid,
    'boolean'::pg_catalog.regtype::oid
  ]::oid[],
  'entitlement function returns exactly the five approved facts'
)
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
where namespace.nspname = 'public'
  and function.proname = 'resolve_active_organization_entitlement_facts';

select ok(
  position('private.clerk_organization_id()' in function.prosrc) > 0
  and position('public.organizations' in function.prosrc) > 0
  and position(
    'private.resolve_organization_entitlement_facts('
    in function.prosrc
  ) > 0
  and position('public.billing_trial_grants' in function.prosrc) = 0
  and position('public.billing_subscriptions' in function.prosrc) = 0
  and position('public.stores' in function.prosrc) = 0
  and position('public.store_memberships' in function.prosrc) = 0,
  'entitlement function derives the approved tenant and delegates only to the shared private billing-facts helper'
)
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
where namespace.nspname = 'public'
  and function.proname = 'resolve_active_organization_entitlement_facts';

select ok(
  position('execute ' in pg_catalog.lower(function.prosrc)) = 0
  and function.prosrc !~* '\m(insert|update|delete|truncate|merge|call)\M',
  'entitlement function uses static read-only SQL'
)
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
where namespace.nspname = 'public'
  and function.proname = 'resolve_active_organization_entitlement_facts';

select ok(
  not exists (
    select 1
    from pg_catalog.pg_proc as function
    cross join lateral pg_catalog.aclexplode(
      coalesce(
        function.proacl,
        pg_catalog.acldefault('f', function.proowner)
      )
    ) as privilege
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = function.pronamespace
    where namespace.nspname = 'public'
      and function.proname =
        'resolve_active_organization_entitlement_facts'
      and privilege.grantee = 0
      and privilege.privilege_type = 'EXECUTE'
  ),
  'PUBLIC has no EXECUTE privilege on the entitlement function'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.resolve_active_organization_entitlement_facts()',
    'EXECUTE'
  ),
  'anon cannot execute the entitlement function'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.resolve_active_organization_entitlement_facts()',
    'EXECUTE'
  ),
  'authenticated can execute the entitlement function'
);

select ok(
  not has_function_privilege(
    'service_role',
    'public.resolve_active_organization_entitlement_facts()',
    'EXECUTE'
  ),
  'service_role has no EXECUTE privilege on the entitlement function'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.billing_trial_grants',
    'SELECT'
  )
  and not has_table_privilege(
    'authenticated',
    'public.billing_customers',
    'SELECT'
  )
  and not has_table_privilege(
    'authenticated',
    'public.billing_subscriptions',
    'SELECT'
  )
  and not has_table_privilege(
    'authenticated',
    'public.stripe_webhook_events',
    'SELECT'
  ),
  'authenticated receives no direct billing-table SELECT privilege'
);

set local role anon;
select throws_ok(
  $$select * from public.resolve_active_organization_entitlement_facts()$$,
  '42501',
  null,
  'anon execution is denied by PostgreSQL'
);
reset role;

set local role service_role;
select throws_ok(
  $$select * from public.resolve_active_organization_entitlement_facts()$$,
  '42501',
  null,
  'service_role execution is denied by PostgreSQL'
);
reset role;

-- Missing active/mapped Organizations and empty entitlement semantics.
set local role authenticated;
set local request.jwt.claims = '{"sub":"entitlement_no_org"}';
select is(
  (
    select pg_catalog.count(*)
    from public.resolve_active_organization_entitlement_facts()
  ),
  0::bigint,
  'JWT without an active Organization resolves zero rows'
);

set local request.jwt.claims =
  '{"sub":"entitlement_unprovisioned","o":{"id":"entitlement_org_missing","rol":"admin"}}';
select is(
  (
    select pg_catalog.count(*)
    from public.resolve_active_organization_entitlement_facts()
  ),
  0::bigint,
  'active Clerk Organization without an internal Organization resolves zero rows'
);

set local request.jwt.claims =
  '{"sub":"entitlement_admin_empty","o":{"id":"entitlement_org_empty","rol":"admin"}}';
select results_eq(
  $$select * from public.resolve_active_organization_entitlement_facts()$$,
  $$values (null::text, null::timestamptz, null::text, null::text, null::boolean)$$,
  'provisioned Organization without trial or subscription returns one empty-facts row'
);
reset role;

-- Tenant isolation and identical Organization-level facts for admin/member.
insert into public.billing_trial_grants (
  organization_id,
  clerk_user_id,
  grant_kind,
  plan_code,
  starts_at,
  ends_at
)
values (
  '61000000-0000-0000-0000-000000000002',
  'entitlement_user_b',
  'manual_override',
  'multi_3',
  pg_catalog.now(),
  pg_catalog.now() + interval '3 days'
);

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"entitlement_admin_a","o":{"id":"entitlement_org_a","rol":"admin"}}';
select is(
  (
    select facts.trial_plan_code
    from public.resolve_active_organization_entitlement_facts() as facts
  ),
  null,
  'Organization A cannot resolve Organization B trial facts'
);

set local request.jwt.claims =
  '{"sub":"entitlement_admin_b","o":{"id":"entitlement_org_b","rol":"admin"}}';
select is(
  (
    select facts.trial_plan_code
    from public.resolve_active_organization_entitlement_facts() as facts
  ),
  'multi_3',
  'Organization B resolves its own trial facts'
);

set local request.jwt.claims =
  '{"sub":"entitlement_member_b","o":{"id":"entitlement_org_b","rol":"member"}}';
select is(
  (
    select facts.trial_plan_code
    from public.resolve_active_organization_entitlement_facts() as facts
  ),
  'multi_3',
  'Organization member resolves the same Organization entitlement facts as admin'
);
reset role;

select is(
  (
    select pg_catalog.count(*)
    from pg_catalog.pg_proc as function
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = function.pronamespace
    where namespace.nspname = 'public'
      and function.proname =
        'resolve_active_organization_entitlement_facts'
  ),
  1::bigint,
  'no overload or authority-bearing function signature exists'
);

-- Trial clock boundaries and persisted-history behavior.
delete from public.billing_trial_grants
where organization_id = '61000000-0000-0000-0000-000000000001';

insert into public.billing_trial_grants (
  organization_id,
  clerk_user_id,
  grant_kind,
  plan_code,
  starts_at,
  ends_at
)
values (
  '61000000-0000-0000-0000-000000000001',
  'entitlement_starts_now',
  'manual_override',
  'essential',
  pg_catalog.now(),
  pg_catalog.now() + interval '1 day'
);

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"entitlement_admin_a","o":{"id":"entitlement_org_a","rol":"admin"}}';
select is(
  (
    select facts.trial_plan_code
    from public.resolve_active_organization_entitlement_facts() as facts
  ),
  'essential',
  'trial with starts_at equal to database now is active'
);
reset role;

delete from public.billing_trial_grants
where organization_id = '61000000-0000-0000-0000-000000000001';
insert into public.billing_trial_grants (
  organization_id,
  clerk_user_id,
  grant_kind,
  plan_code,
  starts_at,
  ends_at
)
values (
  '61000000-0000-0000-0000-000000000001',
  'entitlement_ends_now',
  'manual_override',
  'essential',
  pg_catalog.now() - interval '1 day',
  pg_catalog.now()
);

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"entitlement_admin_a","o":{"id":"entitlement_org_a","rol":"admin"}}';
select is(
  (
    select facts.trial_plan_code
    from public.resolve_active_organization_entitlement_facts() as facts
  ),
  null,
  'trial with ends_at equal to database now is expired'
);
reset role;

delete from public.billing_trial_grants
where organization_id = '61000000-0000-0000-0000-000000000001';
insert into public.billing_trial_grants (
  organization_id,
  clerk_user_id,
  grant_kind,
  plan_code,
  starts_at,
  ends_at
)
values
  (
    '61000000-0000-0000-0000-000000000001',
    'entitlement_future',
    'manual_override',
    'essential',
    pg_catalog.now() + interval '1 day',
    pg_catalog.now() + interval '2 days'
  ),
  (
    '61000000-0000-0000-0000-000000000001',
    'entitlement_expired',
    'manual_override',
    'essential',
    pg_catalog.now() - interval '2 days',
    pg_catalog.now() - interval '1 day'
  ),
  (
    '61000000-0000-0000-0000-000000000001',
    'entitlement_revoked',
    'manual_override',
    'essential',
    pg_catalog.now() - interval '1 day',
    pg_catalog.now() + interval '1 day'
  );

update public.billing_trial_grants
set revoked_at = pg_catalog.now()
where clerk_user_id = 'entitlement_revoked';

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"entitlement_admin_a","o":{"id":"entitlement_org_a","rol":"admin"}}';
select is(
  (
    select facts.trial_plan_code
    from public.resolve_active_organization_entitlement_facts() as facts
  ),
  null,
  'future, expired, and revoked trials do not participate in entitlement'
);
reset role;

select is(
  (
    select pg_catalog.count(*)
    from public.billing_trial_grants
    where organization_id = '61000000-0000-0000-0000-000000000001'
  ),
  3::bigint,
  'future, expired, and revoked trial history remains persisted'
);

-- Same-plan aggregation uses MAX(ends_at), regardless of grant kind.
delete from public.billing_trial_grants
where organization_id = '61000000-0000-0000-0000-000000000001';
insert into public.billing_trial_grants (
  organization_id,
  clerk_user_id,
  grant_kind,
  plan_code,
  starts_at,
  ends_at
)
values
  (
    '61000000-0000-0000-0000-000000000001',
    'entitlement_initial',
    'initial',
    'essential',
    pg_catalog.now(),
    pg_catalog.now() + interval '15 days'
  ),
  (
    '61000000-0000-0000-0000-000000000001',
    'entitlement_override_essential',
    'manual_override',
    'essential',
    pg_catalog.now(),
    pg_catalog.now() + interval '20 days'
  );

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"entitlement_admin_a","o":{"id":"entitlement_org_a","rol":"admin"}}';
select results_eq(
  $$select facts.trial_plan_code, facts.trial_valid_until from public.resolve_active_organization_entitlement_facts() as facts$$,
  $$values ('essential'::text, pg_catalog.now() + interval '20 days')$$,
  'initial plus same-plan override resolves the shared plan and latest end time'
);
reset role;

delete from public.billing_trial_grants
where organization_id = '61000000-0000-0000-0000-000000000001';
insert into public.billing_trial_grants (
  organization_id,
  clerk_user_id,
  grant_kind,
  plan_code,
  starts_at,
  ends_at
)
values
  (
    '61000000-0000-0000-0000-000000000001',
    'entitlement_override_multi_2_short',
    'manual_override',
    'multi_2',
    pg_catalog.now(),
    pg_catalog.now() + interval '5 days'
  ),
  (
    '61000000-0000-0000-0000-000000000001',
    'entitlement_override_multi_2_long',
    'manual_override',
    'multi_2',
    pg_catalog.now(),
    pg_catalog.now() + interval '10 days'
  );

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"entitlement_member_a","o":{"id":"entitlement_org_a","rol":"member"}}';
select results_eq(
  $$select facts.trial_plan_code, facts.trial_valid_until from public.resolve_active_organization_entitlement_facts() as facts$$,
  $$values ('multi_2'::text, pg_catalog.now() + interval '10 days')$$,
  'same-plan overrides resolve their shared plan and MAX ends_at'
);
reset role;

insert into public.billing_trial_grants (
  organization_id,
  clerk_user_id,
  grant_kind,
  plan_code,
  starts_at,
  ends_at
)
values (
  '61000000-0000-0000-0000-000000000001',
  'entitlement_override_conflict',
  'manual_override',
  'multi_3',
  pg_catalog.now(),
  pg_catalog.now() + interval '8 days'
);

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"entitlement_admin_a","o":{"id":"entitlement_org_a","rol":"admin"}}';
select throws_ok(
  $$select * from public.resolve_active_organization_entitlement_facts()$$,
  'P0001',
  'Conflicting active Organization trial plans',
  'different concurrently valid trial plans fail deterministically'
);
reset role;

delete from public.billing_trial_grants
where organization_id = '61000000-0000-0000-0000-000000000001';

-- Paid projection facts preserve every known status and collection pause.
insert into public.billing_subscriptions (
  organization_id,
  stripe_subscription_id,
  stripe_price_id,
  plan_code,
  status,
  current_period_end,
  last_synced_at
)
values (
  '61000000-0000-0000-0000-000000000001',
  'sub_entitlement_a',
  'price_entitlement_a',
  'essential',
  'active',
  pg_catalog.now() + interval '30 days',
  pg_catalog.now()
);

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"entitlement_admin_a","o":{"id":"entitlement_org_a","rol":"admin"}}';
select results_eq(
  $$select facts.subscription_plan_code, facts.subscription_status, facts.subscription_collection_paused from public.resolve_active_organization_entitlement_facts() as facts$$,
  $$values ('essential'::text, 'active'::text, false)$$,
  'active subscription facts are returned without provider identifiers'
);
reset role;

update public.billing_subscriptions
set status = 'past_due',
    past_due_since = pg_catalog.now();
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"entitlement_admin_a","o":{"id":"entitlement_org_a","rol":"admin"}}';
select is(
  (
    select facts.subscription_status
    from public.resolve_active_organization_entitlement_facts() as facts
  ),
  'past_due',
  'past_due subscription status is returned'
);
reset role;

update public.billing_subscriptions
set status = 'trialing', past_due_since = null;
set local role authenticated;
select is(
  (
    select facts.subscription_status
    from public.resolve_active_organization_entitlement_facts() as facts
  ),
  'trialing',
  'trialing subscription status is returned for fail-closed application mapping'
);
reset role;

update public.billing_subscriptions set status = 'incomplete';
set local role authenticated;
select is(
  (
    select facts.subscription_status
    from public.resolve_active_organization_entitlement_facts() as facts
  ),
  'incomplete',
  'incomplete subscription status is returned'
);
reset role;

update public.billing_subscriptions set status = 'incomplete_expired';
set local role authenticated;
select is(
  (
    select facts.subscription_status
    from public.resolve_active_organization_entitlement_facts() as facts
  ),
  'incomplete_expired',
  'incomplete_expired subscription status is returned'
);
reset role;

update public.billing_subscriptions set status = 'unpaid';
set local role authenticated;
select is(
  (
    select facts.subscription_status
    from public.resolve_active_organization_entitlement_facts() as facts
  ),
  'unpaid',
  'unpaid subscription status is returned'
);
reset role;

update public.billing_subscriptions set status = 'canceled';
set local role authenticated;
select is(
  (
    select facts.subscription_status
    from public.resolve_active_organization_entitlement_facts() as facts
  ),
  'canceled',
  'canceled subscription status is returned'
);
reset role;

update public.billing_subscriptions set status = 'paused';
set local role authenticated;
select is(
  (
    select facts.subscription_status
    from public.resolve_active_organization_entitlement_facts() as facts
  ),
  'paused',
  'paused subscription status is returned'
);
reset role;

update public.billing_subscriptions
set status = 'active', collection_paused = true;
set local role authenticated;
select is(
  (
    select facts.subscription_collection_paused
    from public.resolve_active_organization_entitlement_facts() as facts
  ),
  true,
  'collection_paused is returned accurately'
);
reset role;

-- Combined paid and trial facts are returned from the same call.
insert into public.billing_trial_grants (
  organization_id,
  clerk_user_id,
  grant_kind,
  plan_code,
  starts_at,
  ends_at
)
values (
  '61000000-0000-0000-0000-000000000001',
  'entitlement_combined_trial',
  'manual_override',
  'multi_2',
  pg_catalog.now(),
  pg_catalog.now() + interval '4 days'
);

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"entitlement_member_a","o":{"id":"entitlement_org_a","rol":"member"}}';
select results_eq(
  $$select facts.trial_plan_code, facts.subscription_plan_code, facts.subscription_status, facts.subscription_collection_paused from public.resolve_active_organization_entitlement_facts() as facts$$,
  $$values ('multi_2'::text, 'essential'::text, 'active'::text, true)$$,
  'trial and paid projection facts are returned together in one RPC row'
);
reset role;

-- Calling the read boundary must leave source tables unchanged.
create temporary table entitlement_read_snapshot as
select
  (
    select coalesce(
      pg_catalog.jsonb_agg(pg_catalog.to_jsonb(trial) order by trial.id),
      '[]'::jsonb
    )
    from public.billing_trial_grants as trial
  ) as trials,
  (
    select coalesce(
      pg_catalog.jsonb_agg(
        pg_catalog.to_jsonb(subscription)
        order by subscription.organization_id
      ),
      '[]'::jsonb
    )
    from public.billing_subscriptions as subscription
  ) as subscriptions;

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"entitlement_admin_a","o":{"id":"entitlement_org_a","rol":"admin"}}';
select lives_ok(
  $$select * from public.resolve_active_organization_entitlement_facts()$$,
  'entitlement facts can be resolved without mutation'
);
reset role;

select is(
  (
    select snapshot.trials
    from entitlement_read_snapshot as snapshot
  ),
  (
    select coalesce(
      pg_catalog.jsonb_agg(pg_catalog.to_jsonb(trial) order by trial.id),
      '[]'::jsonb
    )
    from public.billing_trial_grants as trial
  ),
  'entitlement resolution does not mutate trial grants'
);

select is(
  (
    select snapshot.subscriptions
    from entitlement_read_snapshot as snapshot
  ),
  (
    select coalesce(
      pg_catalog.jsonb_agg(
        pg_catalog.to_jsonb(subscription)
        order by subscription.organization_id
      ),
      '[]'::jsonb
    )
    from public.billing_subscriptions as subscription
  ),
  'entitlement resolution does not mutate paid projections'
);

set local role authenticated;
select throws_ok(
  $$select * from public.billing_trial_grants$$,
  '42501',
  null,
  'authenticated still cannot directly read trial grants after RPC execution'
);
select throws_ok(
  $$select * from public.billing_subscriptions$$,
  '42501',
  null,
  'authenticated still cannot directly read paid projections after RPC execution'
);
reset role;

select * from finish();
rollback;
