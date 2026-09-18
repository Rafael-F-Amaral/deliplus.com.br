begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select no_plan();

create temporary table store_trial_activation_results (
  outcome text,
  trial_ends_at timestamptz
);

grant insert, select on table store_trial_activation_results to authenticated;

-- RPC metadata and least-privilege grants.
select has_function(
  'public',
  'activate_first_store_with_initial_trial',
  array['uuid'],
  'Store trial activation RPC exists with exactly one uuid argument'
);

select ok(
  function.pronargs = 1
  and function.proretset
  and function.provolatile = 'v'
  and function.prosecdef,
  'activation RPC is one-argument, set-returning, VOLATILE, and SECURITY DEFINER'
)
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
where namespace.nspname = 'public'
  and function.proname = 'activate_first_store_with_initial_trial';

select is(
  owner.rolname,
  'postgres',
  'activation RPC has the reviewed postgres owner'
)
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
join pg_catalog.pg_roles as owner
  on owner.oid = function.proowner
where namespace.nspname = 'public'
  and function.proname = 'activate_first_store_with_initial_trial';

select ok(
  function.proconfig @> array['search_path=""']::text[],
  'activation RPC has an empty search_path'
)
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
where namespace.nspname = 'public'
  and function.proname = 'activate_first_store_with_initial_trial';

select ok(
  function.proargnames = array[
    'p_store_id',
    'outcome',
    'trial_ends_at'
  ]::text[]
  and function.proargmodes::text = '{i,t,t}'
  and function.proallargtypes = array[
    'uuid'::pg_catalog.regtype::oid,
    'text'::pg_catalog.regtype::oid,
    'timestamptz'::pg_catalog.regtype::oid
  ]::oid[],
  'activation RPC accepts only Store id and returns only outcome and trial end'
)
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
where namespace.nspname = 'public'
  and function.proname = 'activate_first_store_with_initial_trial';

select ok(
  position('private.clerk_user_id()' in function.prosrc) > 0
  and position('private.clerk_organization_id()' in function.prosrc) > 0
  and position('private.clerk_organization_role()' in function.prosrc) > 0
  and position('public.organizations' in function.prosrc) > 0
  and position('public.stores' in function.prosrc) > 0
  and position('public.billing_trial_grants' in function.prosrc) > 0
  and position('public.billing_subscriptions' in function.prosrc) > 0,
  'activation RPC derives Clerk authority and uses only approved local domain facts'
)
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
where namespace.nspname = 'public'
  and function.proname = 'activate_first_store_with_initial_trial';

select ok(
  position('execute ' in pg_catalog.lower(function.prosrc)) = 0
  and position('stripe.' in pg_catalog.lower(function.prosrc)) = 0
  and position('service_role' in pg_catalog.lower(function.prosrc)) = 0,
  'activation RPC uses static local SQL without Stripe or service-role paths'
)
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
where namespace.nspname = 'public'
  and function.proname = 'activate_first_store_with_initial_trial';

select ok(
  position(
    'pg_catalog.hashtextextended(v_organization_id::text, 0)'
    in function.prosrc
  ) > 0
  and position(
    'deliplus:initial-trial-user'
    in function.prosrc
  ) > 0,
  'activation RPC contains the approved Organization and Clerk User lock namespaces'
)
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
where namespace.nspname = 'public'
  and function.proname = 'activate_first_store_with_initial_trial';

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
      and function.proname = 'activate_first_store_with_initial_trial'
      and privilege.grantee = 0
      and privilege.privilege_type = 'EXECUTE'
  ),
  'PUBLIC has no EXECUTE privilege on the activation RPC'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.activate_first_store_with_initial_trial(uuid)',
    'EXECUTE'
  ),
  'anon cannot execute the activation RPC'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.activate_first_store_with_initial_trial(uuid)',
    'EXECUTE'
  ),
  'authenticated can execute only the narrow activation RPC'
);

select ok(
  not has_function_privilege(
    'service_role',
    'public.activate_first_store_with_initial_trial(uuid)',
    'EXECUTE'
  ),
  'service_role receives no feature-specific activation grant'
);

select ok(
  has_table_privilege('authenticated', 'public.stores', 'SELECT')
  and not has_table_privilege('authenticated', 'public.stores', 'INSERT')
  and not has_table_privilege('authenticated', 'public.stores', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.stores', 'DELETE')
  and not has_table_privilege(
    'authenticated',
    'public.billing_trial_grants',
    'SELECT'
  )
  and not has_table_privilege(
    'authenticated',
    'public.billing_trial_grants',
    'INSERT'
  )
  and not has_table_privilege(
    'authenticated',
    'public.billing_trial_grants',
    'UPDATE'
  )
  and not has_table_privilege(
    'authenticated',
    'public.billing_subscriptions',
    'SELECT'
  )
  and not has_table_privilege(
    'authenticated',
    'public.billing_subscriptions',
    'UPDATE'
  ),
  'authenticated retains no generic Store mutation or billing-table access'
);

-- Fixtures.
insert into public.organizations (id, clerk_organization_id)
values
  ('71000000-0000-0000-0000-000000000001', 'trial_activation_org_success'),
  ('71000000-0000-0000-0000-000000000002', 'trial_activation_org_other'),
  ('71000000-0000-0000-0000-000000000003', 'trial_activation_org_draft'),
  ('71000000-0000-0000-0000-000000000004', 'trial_activation_org_historical'),
  ('71000000-0000-0000-0000-000000000005', 'trial_activation_org_initial_active'),
  ('71000000-0000-0000-0000-000000000006', 'trial_activation_org_initial_expired'),
  ('71000000-0000-0000-0000-000000000007', 'trial_activation_org_initial_revoked'),
  ('71000000-0000-0000-0000-000000000008', 'trial_activation_org_user_source'),
  ('71000000-0000-0000-0000-000000000009', 'trial_activation_org_user_target'),
  ('71000000-0000-0000-0000-000000000010', 'trial_activation_org_paid_active'),
  ('71000000-0000-0000-0000-000000000011', 'trial_activation_org_paid_past_due'),
  ('71000000-0000-0000-0000-000000000012', 'trial_activation_org_paid_paused'),
  ('71000000-0000-0000-0000-000000000013', 'trial_activation_org_manual'),
  ('71000000-0000-0000-0000-000000000014', 'trial_activation_org_insert_failure'),
  ('71000000-0000-0000-0000-000000000015', 'trial_activation_org_update_failure');

insert into public.stores (id, organization_id, name, slug)
values
  ('72000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', 'Trial Success', 'trial-success'),
  ('72000000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000002', 'Other Tenant', 'trial-other'),
  ('72000000-0000-0000-0000-000000000003', '71000000-0000-0000-0000-000000000003', 'Draft Store', 'trial-draft'),
  ('72000000-0000-0000-0000-000000000004', '71000000-0000-0000-0000-000000000004', 'Historical Store', 'trial-historical'),
  ('72000000-0000-0000-0000-000000000005', '71000000-0000-0000-0000-000000000004', 'Historical Target', 'trial-historical-target'),
  ('72000000-0000-0000-0000-000000000006', '71000000-0000-0000-0000-000000000005', 'Initial Active', 'trial-initial-active'),
  ('72000000-0000-0000-0000-000000000007', '71000000-0000-0000-0000-000000000006', 'Initial Expired', 'trial-initial-expired'),
  ('72000000-0000-0000-0000-000000000008', '71000000-0000-0000-0000-000000000007', 'Initial Revoked', 'trial-initial-revoked'),
  ('72000000-0000-0000-0000-000000000009', '71000000-0000-0000-0000-000000000009', 'User Target', 'trial-user-target'),
  ('72000000-0000-0000-0000-000000000010', '71000000-0000-0000-0000-000000000010', 'Paid Active', 'trial-paid-active'),
  ('72000000-0000-0000-0000-000000000011', '71000000-0000-0000-0000-000000000011', 'Paid Past Due', 'trial-paid-past-due'),
  ('72000000-0000-0000-0000-000000000012', '71000000-0000-0000-0000-000000000012', 'Paid Paused', 'trial-paid-paused'),
  ('72000000-0000-0000-0000-000000000013', '71000000-0000-0000-0000-000000000013', 'Manual Override', 'trial-manual'),
  ('72000000-0000-0000-0000-000000000014', '71000000-0000-0000-0000-000000000014', 'Insert Failure', 'trial-insert-failure'),
  ('72000000-0000-0000-0000-000000000015', '71000000-0000-0000-0000-000000000015', 'Update Failure', 'trial-update-failure');

update public.stores
set status = 'ready'
where id::text like '72000000-%'
  and id <> '72000000-0000-0000-0000-000000000003';

update public.stores
set
  status = 'active',
  activated_at = '2026-08-01 12:00:00+00'
where id = '72000000-0000-0000-0000-000000000004';

update public.stores
set status = 'inactive'
where id = '72000000-0000-0000-0000-000000000004';

insert into public.billing_trial_grants (
  organization_id,
  clerk_user_id,
  grant_kind,
  plan_code,
  starts_at,
  ends_at,
  revoked_at
)
values
  ('71000000-0000-0000-0000-000000000005', 'trial_initial_active_user', 'initial', 'essential', now() - interval '1 day', now() + interval '14 days', null),
  ('71000000-0000-0000-0000-000000000006', 'trial_initial_expired_user', 'initial', 'essential', now() - interval '30 days', now() - interval '15 days', null),
  ('71000000-0000-0000-0000-000000000007', 'trial_initial_revoked_user', 'initial', 'essential', now() - interval '1 day', now() + interval '14 days', now()),
  ('71000000-0000-0000-0000-000000000008', 'trial_shared_user', 'initial', 'essential', now() - interval '30 days', now() - interval '15 days', null),
  ('71000000-0000-0000-0000-000000000013', 'trial_manual_owner', 'manual_override', 'multi_2', now() - interval '1 day', now() + interval '30 days', null);

insert into public.billing_customers (
  organization_id,
  stripe_customer_id,
  provisioning_status,
  creation_idempotency_key
)
values
  ('71000000-0000-0000-0000-000000000010', 'cus_trial_paid_active', 'ready', 'idem_trial_paid_active'),
  ('71000000-0000-0000-0000-000000000011', 'cus_trial_paid_past_due', 'ready', 'idem_trial_paid_past_due'),
  ('71000000-0000-0000-0000-000000000012', 'cus_trial_paid_paused', 'ready', 'idem_trial_paid_paused');

insert into public.billing_subscriptions (
  organization_id,
  stripe_subscription_id,
  stripe_price_id,
  plan_code,
  status,
  current_period_end,
  collection_paused,
  past_due_since,
  last_synced_at
)
values
  ('71000000-0000-0000-0000-000000000010', 'sub_trial_paid_active', 'price_trial_paid_active', 'essential', 'active', now() + interval '30 days', false, null, now()),
  ('71000000-0000-0000-0000-000000000011', 'sub_trial_paid_past_due', 'price_trial_paid_past_due', 'multi_2', 'past_due', now() + interval '30 days', false, now() - interval '1 day', now()),
  ('71000000-0000-0000-0000-000000000012', 'sub_trial_paid_paused', 'price_trial_paid_paused', 'multi_3', 'active', now() + interval '30 days', true, null, now());

-- Defense-in-depth auth and safe tenant lookup.
set local role authenticated;
set local request.jwt.claims = '{}';

select throws_ok(
  $$select * from public.activate_first_store_with_initial_trial('72000000-0000-0000-0000-000000000001')$$,
  '42501',
  'Store trial activation is not authorized',
  'missing verified Clerk claims fail closed'
);

set local request.jwt.claims =
  '{"sub":"trial_member","o":{"id":"trial_activation_org_success","rol":"member"}}';

select throws_ok(
  $$select * from public.activate_first_store_with_initial_trial('72000000-0000-0000-0000-000000000001')$$,
  '42501',
  'Store trial activation is not authorized',
  'Organization member is denied inside the RPC'
);

set local request.jwt.claims =
  '{"sub":"trial_admin_missing_org","o":{"id":"trial_activation_org_missing","rol":"admin"}}';

select is(
  (
    select outcome
    from public.activate_first_store_with_initial_trial(
      '72000000-0000-0000-0000-000000000001'
    )
  ),
  'organization_not_provisioned',
  'unprovisioned active Organization is a distinct precondition outcome'
);

set local request.jwt.claims =
  '{"sub":"trial_admin_success","o":{"id":"trial_activation_org_success","rol":"admin"}}';

select is(
  (
    select outcome
    from public.activate_first_store_with_initial_trial(
      'ffffffff-ffff-ffff-ffff-ffffffffffff'
    )
  ),
  'store_unavailable',
  'missing Store returns the safe unavailable outcome'
);

select is(
  (
    select outcome
    from public.activate_first_store_with_initial_trial(
      '72000000-0000-0000-0000-000000000002'
    )
  ),
  'store_unavailable',
  'cross-tenant Store is indistinguishable from a missing Store'
);

reset role;

select is(
  (
    select count(*)
    from public.billing_trial_grants
    where clerk_user_id in ('trial_member', 'trial_admin_missing_org')
  ),
  0::bigint,
  'denied and unprovisioned callers create no trial data'
);

-- Successful first activation and same-Store idempotency.
delete from store_trial_activation_results;
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"trial_admin_success","o":{"id":"trial_activation_org_success","rol":"admin"}}';

insert into store_trial_activation_results
select *
from public.activate_first_store_with_initial_trial(
  '72000000-0000-0000-0000-000000000001'
);

reset role;

select is(
  (select outcome from store_trial_activation_results),
  'activated',
  'eligible admin activates the first ready Store'
);

select is(
  (select status from public.stores where id = '72000000-0000-0000-0000-000000000001'),
  'active',
  'successful activation moves Store to active'
);

select is(
  (
    select grant_kind
    from public.billing_trial_grants
    where organization_id = '71000000-0000-0000-0000-000000000001'
  ),
  'initial',
  'successful activation creates an initial grant'
);

select is(
  (
    select plan_code
    from public.billing_trial_grants
    where organization_id = '71000000-0000-0000-0000-000000000001'
  ),
  'essential',
  'initial grant uses the Essential plan'
);

select is(
  (
    select clerk_user_id
    from public.billing_trial_grants
    where organization_id = '71000000-0000-0000-0000-000000000001'
  ),
  'trial_admin_success',
  'initial grant records the verified Clerk User from JWT'
);

select is(
  (
    select ends_at - starts_at
    from public.billing_trial_grants
    where organization_id = '71000000-0000-0000-0000-000000000001'
  ),
  interval '15 days',
  'initial grant lasts exactly 15 days'
);

select is(
  (
    select trial.starts_at
    from public.billing_trial_grants as trial
    where trial.organization_id = '71000000-0000-0000-0000-000000000001'
  ),
  (
    select store.activated_at
    from public.stores as store
    where store.id = '72000000-0000-0000-0000-000000000001'
  ),
  'trial starts_at and Store activated_at use the same database timestamp'
);

select is(
  (select trial_ends_at from store_trial_activation_results),
  (
    select ends_at
    from public.billing_trial_grants
    where organization_id = '71000000-0000-0000-0000-000000000001'
  ),
  'RPC returns the persisted trial end timestamp'
);

create temporary table store_trial_activation_original_facts as
select
  store.activated_at,
  trial.starts_at,
  trial.ends_at,
  trial.clerk_user_id
from public.stores as store
join public.billing_trial_grants as trial
  on trial.organization_id = store.organization_id
  and trial.grant_kind = 'initial'
where store.id = '72000000-0000-0000-0000-000000000001';

delete from store_trial_activation_results;
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"trial_admin_retry","o":{"id":"trial_activation_org_success","rol":"admin"}}';

insert into store_trial_activation_results
select *
from public.activate_first_store_with_initial_trial(
  '72000000-0000-0000-0000-000000000001'
);

reset role;

select is(
  (select outcome from store_trial_activation_results),
  'already_activated',
  'another current Organization admin receives coherent idempotent success'
);

select is(
  (
    select count(*)
    from public.billing_trial_grants
    where organization_id = '71000000-0000-0000-0000-000000000001'
      and grant_kind = 'initial'
  ),
  1::bigint,
  'same-Store retry creates no second initial grant'
);

select is(
  (
    select jsonb_build_array(
      store.activated_at,
      trial.starts_at,
      trial.ends_at,
      trial.clerk_user_id
    )
    from public.stores as store
    join public.billing_trial_grants as trial
      on trial.organization_id = store.organization_id
      and trial.grant_kind = 'initial'
    where store.id = '72000000-0000-0000-0000-000000000001'
  ),
  (
    select jsonb_build_array(
      activated_at,
      starts_at,
      ends_at,
      clerk_user_id
    )
    from store_trial_activation_original_facts
  ),
  'retry preserves activation, trial dates, and historical Clerk User'
);

-- Store readiness and historical activation.
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"trial_draft_user","o":{"id":"trial_activation_org_draft","rol":"admin"}}';

select is(
  (
    select outcome
    from public.activate_first_store_with_initial_trial(
      '72000000-0000-0000-0000-000000000003'
    )
  ),
  'not_ready',
  'draft Store is not activated by the trial operation'
);

set local request.jwt.claims =
  '{"sub":"trial_historical_user","o":{"id":"trial_activation_org_historical","rol":"admin"}}';

select is(
  (
    select outcome
    from public.activate_first_store_with_initial_trial(
      '72000000-0000-0000-0000-000000000005'
    )
  ),
  'trial_not_eligible',
  'historically activated inactive Store blocks a new initial trial'
);

reset role;

select is(
  (
    select jsonb_build_array(status, activated_at)
    from public.stores
    where id = '72000000-0000-0000-0000-000000000005'
  ),
  jsonb_build_array('ready', null),
  'blocked historical activation leaves the target Store ready and untouched'
);

-- Historical trial eligibility for Organization and Clerk User.
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"trial_active_candidate","o":{"id":"trial_activation_org_initial_active","rol":"admin"}}';

select is(
  (select outcome from public.activate_first_store_with_initial_trial('72000000-0000-0000-0000-000000000006')),
  'trial_not_eligible',
  'active historical initial grant consumes Organization eligibility'
);

set local request.jwt.claims =
  '{"sub":"trial_expired_candidate","o":{"id":"trial_activation_org_initial_expired","rol":"admin"}}';

select is(
  (select outcome from public.activate_first_store_with_initial_trial('72000000-0000-0000-0000-000000000007')),
  'trial_not_eligible',
  'expired initial grant permanently consumes Organization eligibility'
);

set local request.jwt.claims =
  '{"sub":"trial_revoked_candidate","o":{"id":"trial_activation_org_initial_revoked","rol":"admin"}}';

select is(
  (select outcome from public.activate_first_store_with_initial_trial('72000000-0000-0000-0000-000000000008')),
  'trial_not_eligible',
  'revoked initial grant permanently consumes Organization eligibility'
);

set local request.jwt.claims =
  '{"sub":"trial_shared_user","o":{"id":"trial_activation_org_user_target","rol":"admin"}}';

select is(
  (select outcome from public.activate_first_store_with_initial_trial('72000000-0000-0000-0000-000000000009')),
  'trial_not_eligible',
  'historical initial grant in another Organization consumes Clerk User eligibility'
);

reset role;

-- Existing paid/manual entitlement paths belong to future generic activation.
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"trial_paid_active_user","o":{"id":"trial_activation_org_paid_active","rol":"admin"}}';

select is(
  (select outcome from public.activate_first_store_with_initial_trial('72000000-0000-0000-0000-000000000010')),
  'trial_not_eligible',
  'active paid entitlement does not start an initial trial'
);

set local request.jwt.claims =
  '{"sub":"trial_paid_past_due_user","o":{"id":"trial_activation_org_paid_past_due","rol":"admin"}}';

select is(
  (select outcome from public.activate_first_store_with_initial_trial('72000000-0000-0000-0000-000000000011')),
  'trial_not_eligible',
  'past_due paid entitlement retains the no-trial behavior'
);

set local request.jwt.claims =
  '{"sub":"trial_paid_paused_user","o":{"id":"trial_activation_org_paid_paused","rol":"admin"}}';

select is(
  (select outcome from public.activate_first_store_with_initial_trial('72000000-0000-0000-0000-000000000012')),
  'activated',
  'collection-paused subscription does not provide paid entitlement'
);

set local request.jwt.claims =
  '{"sub":"trial_manual_candidate","o":{"id":"trial_activation_org_manual","rol":"admin"}}';

select is(
  (select outcome from public.activate_first_store_with_initial_trial('72000000-0000-0000-0000-000000000013')),
  'trial_not_eligible',
  'valid manual override does not start an initial trial'
);

reset role;

select is(
  (
    select jsonb_build_array(grant_kind, plan_code, revoked_at)
    from public.billing_trial_grants
    where organization_id = '71000000-0000-0000-0000-000000000013'
  ),
  jsonb_build_array('manual_override', 'multi_2', null),
  'manual override remains untouched'
);

select is(
  (
    select jsonb_build_array(status, collection_paused)
    from public.billing_subscriptions
    where organization_id = '71000000-0000-0000-0000-000000000012'
  ),
  jsonb_build_array('active', true),
  'subscription projection remains untouched'
);

-- Atomic rollback with test-only failure triggers.
create function pg_temp.fail_store_trial_insert()
returns trigger
language plpgsql
as $$
begin
  if new.organization_id = '71000000-0000-0000-0000-000000000014' then
    raise exception using errcode = 'P0001', message = 'forced trial insert failure';
  end if;

  return new;
end;
$$;

create trigger aaa_test_fail_store_trial_insert
before insert on public.billing_trial_grants
for each row
execute function pg_temp.fail_store_trial_insert();

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"trial_insert_failure_user","o":{"id":"trial_activation_org_insert_failure","rol":"admin"}}';

select throws_ok(
  $$select * from public.activate_first_store_with_initial_trial('72000000-0000-0000-0000-000000000014')$$,
  'P0001',
  'forced trial insert failure',
  'trial insert failure aborts the activation statement'
);

reset role;
drop trigger aaa_test_fail_store_trial_insert on public.billing_trial_grants;

select is(
  (
    select jsonb_build_array(status, activated_at)
    from public.stores
    where id = '72000000-0000-0000-0000-000000000014'
  ),
  jsonb_build_array('ready', null),
  'trial insert failure leaves Store unchanged'
);

select is(
  (
    select count(*)
    from public.billing_trial_grants
    where organization_id = '71000000-0000-0000-0000-000000000014'
  ),
  0::bigint,
  'trial insert failure persists no grant'
);

create function pg_temp.fail_store_trial_update()
returns trigger
language plpgsql
as $$
begin
  if new.id = '72000000-0000-0000-0000-000000000015'
    and new.status = 'active'
  then
    raise exception using errcode = 'P0001', message = 'forced Store update failure';
  end if;

  return new;
end;
$$;

create trigger aaa_test_fail_store_trial_update
before update on public.stores
for each row
execute function pg_temp.fail_store_trial_update();

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"trial_update_failure_user","o":{"id":"trial_activation_org_update_failure","rol":"admin"}}';

select throws_ok(
  $$select * from public.activate_first_store_with_initial_trial('72000000-0000-0000-0000-000000000015')$$,
  'P0001',
  'forced Store update failure',
  'Store transition failure aborts the activation statement'
);

reset role;
drop trigger aaa_test_fail_store_trial_update on public.stores;

select is(
  (
    select jsonb_build_array(status, activated_at)
    from public.stores
    where id = '72000000-0000-0000-0000-000000000015'
  ),
  jsonb_build_array('ready', null),
  'Store transition failure leaves Store unchanged'
);

select is(
  (
    select count(*)
    from public.billing_trial_grants
    where organization_id = '71000000-0000-0000-0000-000000000015'
  ),
  0::bigint,
  'Store transition failure rolls back the inserted trial grant'
);

-- Isolation regressions.
select is(
  (
    select jsonb_build_array(status, activated_at)
    from public.stores
    where id = '72000000-0000-0000-0000-000000000002'
  ),
  jsonb_build_array('ready', null),
  'cross-tenant Store remains untouched'
);

select is(
  (
    select count(*)
    from public.billing_trial_grants
    where organization_id = '71000000-0000-0000-0000-000000000002'
  ),
  0::bigint,
  'cross-tenant Organization receives no trial'
);

select * from finish();
rollback;
