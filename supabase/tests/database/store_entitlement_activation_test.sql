begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select no_plan();

create temporary table store_entitlement_activation_timestamps (
  store_id uuid primary key,
  activated_at timestamptz not null
);

grant insert, select
on table store_entitlement_activation_timestamps
to authenticated;

-- Helper and RPC metadata.
select has_function(
  'private',
  'plan_max_stores',
  array['text'],
  'private plan-capacity helper exists with exactly one text argument'
);

select has_function(
  'private',
  'resolve_organization_entitlement_facts',
  array['uuid', 'timestamptz'],
  'private Organization entitlement-facts helper exists'
);

select has_function(
  'private',
  'resolve_effective_organization_entitlement',
  array['uuid', 'timestamptz'],
  'private effective-entitlement helper exists'
);

select has_function(
  'public',
  'activate_store_within_entitlement',
  array['uuid'],
  'generic Store activation RPC exists with exactly one uuid argument'
);

select has_function(
  'public',
  'deactivate_store',
  array['uuid'],
  'Store deactivation RPC exists with exactly one uuid argument'
);

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
      and function.proname in (
        'activate_store_within_entitlement',
        'deactivate_store'
      )
      and privilege.grantee = 0
      and privilege.privilege_type = 'EXECUTE'
  ),
  'PUBLIC has no EXECUTE privilege on either Store mutation RPC'
);

select ok(
  function.provolatile = 'i'
  and function.proisstrict
  and not function.prosecdef
  and function.proconfig @> array['search_path=""']::text[],
  'plan-capacity helper is IMMUTABLE, STRICT, SECURITY INVOKER, and hardened'
)
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
where namespace.nspname = 'private'
  and function.proname = 'plan_max_stores';

select ok(
  pg_catalog.bool_and(
    function.provolatile = 's'
    and function.proisstrict
    and not function.prosecdef
    and function.proconfig @> array['search_path=""']::text[]
  ),
  'private entitlement helpers are STABLE, STRICT, SECURITY INVOKER, and hardened'
)
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
where namespace.nspname = 'private'
  and function.proname in (
    'resolve_organization_entitlement_facts',
    'resolve_effective_organization_entitlement'
  );

select ok(
  pg_catalog.bool_and(
    function.provolatile = 'v'
    and function.proretset
    and function.prosecdef
    and function.proconfig @> array['search_path=""']::text[]
  ),
  'Store mutation RPCs are set-returning, VOLATILE, SECURITY DEFINER, and hardened'
)
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
where namespace.nspname = 'public'
  and function.proname in (
    'activate_store_within_entitlement',
    'deactivate_store'
  );

select ok(
  pg_catalog.bool_and(owner.rolname = 'postgres'),
  'all new helpers and RPCs have the reviewed postgres owner'
)
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
join pg_catalog.pg_roles as owner
  on owner.oid = function.proowner
where (
    namespace.nspname = 'private'
    and function.proname in (
      'plan_max_stores',
      'resolve_organization_entitlement_facts',
      'resolve_effective_organization_entitlement'
    )
  ) or (
    namespace.nspname = 'public'
    and function.proname in (
      'activate_store_within_entitlement',
      'deactivate_store'
    )
  );

select ok(
  function.proargnames = array['p_store_id', 'outcome']::text[]
  and function.proargmodes::text = '{i,t}'
  and function.proallargtypes = array[
    'uuid'::pg_catalog.regtype::oid,
    'text'::pg_catalog.regtype::oid
  ]::oid[],
  function.proname || ' accepts only Store id and returns only outcome'
)
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
where namespace.nspname = 'public'
  and function.proname in (
    'activate_store_within_entitlement',
    'deactivate_store'
  )
order by function.proname;

select ok(
  pg_catalog.bool_and(
    position('private.clerk_user_id()' in function.prosrc) > 0
    and position('private.clerk_organization_id()' in function.prosrc) > 0
    and position('private.clerk_organization_role()' in function.prosrc) > 0
    and position('public.organizations' in function.prosrc) > 0
    and position('public.stores' in function.prosrc) > 0
    and position(
      'pg_catalog.hashtextextended(v_organization_id::text, 0)'
      in function.prosrc
    ) > 0
    and position('execute ' in pg_catalog.lower(function.prosrc)) = 0
    and position('stripe.' in pg_catalog.lower(function.prosrc)) = 0
    and position('service_role' in pg_catalog.lower(function.prosrc)) = 0
  ),
  'Store RPCs derive Clerk authority, share the exact Organization lock, and use static local SQL'
)
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
where namespace.nspname = 'public'
  and function.proname in (
    'activate_store_within_entitlement',
    'deactivate_store'
  );

select ok(
  function.proargnames = array[
    'trial_plan_code',
    'trial_valid_until',
    'subscription_plan_code',
    'subscription_status',
    'subscription_collection_paused'
  ]::text[]
  and function.proargmodes::text = '{t,t,t,t,t}'
  and function.provolatile = 's'
  and function.prosecdef,
  'public entitlement-facts RPC preserves its exact five-column contract'
)
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
where namespace.nspname = 'public'
  and function.proname = 'resolve_active_organization_entitlement_facts';

-- Explicit grants and unchanged table/RLS posture.
select ok(
  not has_function_privilege(
    'anon',
    'public.activate_store_within_entitlement(uuid)',
    'EXECUTE'
  )
  and not has_function_privilege(
    'service_role',
    'public.activate_store_within_entitlement(uuid)',
    'EXECUTE'
  )
  and has_function_privilege(
    'authenticated',
    'public.activate_store_within_entitlement(uuid)',
    'EXECUTE'
  )
  and not has_function_privilege(
    'anon',
    'public.deactivate_store(uuid)',
    'EXECUTE'
  )
  and not has_function_privilege(
    'service_role',
    'public.deactivate_store(uuid)',
    'EXECUTE'
  )
  and has_function_privilege(
    'authenticated',
    'public.deactivate_store(uuid)',
    'EXECUTE'
  ),
  'only authenticated receives feature-specific Store RPC execution'
);

select ok(
  not exists (
    select 1
    from (
      values
        ('anon', 'private.plan_max_stores(text)'),
        ('authenticated', 'private.plan_max_stores(text)'),
        ('service_role', 'private.plan_max_stores(text)'),
        ('anon', 'private.resolve_organization_entitlement_facts(uuid,timestamptz)'),
        ('authenticated', 'private.resolve_organization_entitlement_facts(uuid,timestamptz)'),
        ('service_role', 'private.resolve_organization_entitlement_facts(uuid,timestamptz)'),
        ('anon', 'private.resolve_effective_organization_entitlement(uuid,timestamptz)'),
        ('authenticated', 'private.resolve_effective_organization_entitlement(uuid,timestamptz)'),
        ('service_role', 'private.resolve_effective_organization_entitlement(uuid,timestamptz)')
    ) as capability(role_name, function_signature)
    where has_function_privilege(
      capability.role_name,
      capability.function_signature,
      'EXECUTE'
    )
  )
  and not exists (
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
    where namespace.nspname = 'private'
      and function.proname in (
        'plan_max_stores',
        'resolve_organization_entitlement_facts',
        'resolve_effective_organization_entitlement'
      )
      and privilege.grantee = 0
      and privilege.privilege_type = 'EXECUTE'
  ),
  'private helpers are not PUBLIC or Data API capabilities'
);

select ok(
  has_table_privilege('authenticated', 'public.stores', 'SELECT')
  and not has_table_privilege('authenticated', 'public.stores', 'INSERT')
  and not has_table_privilege('authenticated', 'public.stores', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.stores', 'DELETE')
  and not has_table_privilege('authenticated', 'public.stores', 'TRUNCATE')
  and not has_table_privilege(
    'authenticated',
    'public.billing_trial_grants',
    'SELECT'
  )
  and not has_table_privilege(
    'authenticated',
    'public.billing_trial_grants',
    'UPDATE'
  )
  and not has_table_privilege(
    'authenticated',
    'public.billing_trial_grants',
    'DELETE'
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
  )
  and not has_table_privilege(
    'authenticated',
    'public.billing_subscriptions',
    'DELETE'
  ),
  'authenticated retains read-only Store access and no direct billing access'
);

select is(
  (
    select pg_catalog.count(*)
    from pg_catalog.pg_policies as policy
    where policy.schemaname = 'public'
      and policy.tablename = 'stores'
  ),
  2::bigint,
  'Store RLS policies remain unchanged'
);

select is(
  (
    select pg_catalog.count(*)
    from pg_catalog.pg_policies as policy
    where policy.schemaname = 'public'
      and policy.tablename in (
        'billing_trial_grants',
        'billing_customers',
        'billing_subscriptions',
        'stripe_webhook_events'
      )
  ),
  0::bigint,
  'billing tables retain their default-deny RLS policy posture'
);

-- Closed plan registry.
select is(
  private.plan_max_stores('essential'),
  1,
  'Essential permits one active Store'
);

select is(
  private.plan_max_stores('multi_2'),
  2,
  'multi_2 permits two active Stores'
);

select is(
  private.plan_max_stores('multi_3'),
  3,
  'multi_3 permits three active Stores'
);

select throws_ok(
  $$select private.plan_max_stores('unknown_plan')$$,
  '22023',
  'Unsupported Store capacity plan',
  'unknown SQL plans fail closed'
);

-- Privileged fixtures.
insert into public.organizations (id, clerk_organization_id)
values
  ('a1000000-0000-0000-0000-000000000001', 'entitlement_activation_other'),
  ('a1000000-0000-0000-0000-000000000002', 'entitlement_activation_none'),
  ('a1000000-0000-0000-0000-000000000003', 'entitlement_activation_draft'),
  ('a1000000-0000-0000-0000-000000000004', 'entitlement_activation_lifecycle'),
  ('a1000000-0000-0000-0000-000000000005', 'entitlement_activation_essential_cap'),
  ('a1000000-0000-0000-0000-000000000006', 'entitlement_activation_multi_2'),
  ('a1000000-0000-0000-0000-000000000007', 'entitlement_activation_multi_3'),
  ('a1000000-0000-0000-0000-000000000008', 'entitlement_activation_trial_switch'),
  ('a1000000-0000-0000-0000-000000000009', 'entitlement_activation_paid'),
  ('a1000000-0000-0000-0000-00000000000a', 'entitlement_activation_paid_trial'),
  ('a1000000-0000-0000-0000-00000000000b', 'entitlement_activation_local_facts'),
  ('a1000000-0000-0000-0000-00000000000c', 'entitlement_activation_conflict'),
  ('a1000000-0000-0000-0000-00000000000d', 'entitlement_activation_deactivate'),
  ('a1000000-0000-0000-0000-00000000000e', 'entitlement_activation_rollback'),
  ('a1000000-0000-0000-0000-00000000000f', 'entitlement_activation_over_cap'),
  ('a1000000-0000-0000-0000-000000000010', 'entitlement_activation_invalid');

insert into public.stores (id, organization_id, name, slug)
values
  ('a2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Other tenant', 'entitlement-other'),
  ('a2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'No entitlement ready', 'entitlement-none'),
  ('a2000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'Draft Store', 'entitlement-draft'),
  ('a2000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 'Lifecycle ready', 'entitlement-lifecycle'),
  ('a2000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000004', 'Lifecycle inactive', 'entitlement-lifecycle-old'),
  ('a2000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000005', 'Essential active', 'entitlement-essential-active'),
  ('a2000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000005', 'Essential target', 'entitlement-essential-target'),
  ('a2000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000006', 'Multi 2 active', 'entitlement-multi2-active'),
  ('a2000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000006', 'Multi 2 target', 'entitlement-multi2-target'),
  ('a2000000-0000-0000-0000-00000000000a', 'a1000000-0000-0000-0000-000000000007', 'Multi 3 active one', 'entitlement-multi3-one'),
  ('a2000000-0000-0000-0000-00000000000b', 'a1000000-0000-0000-0000-000000000007', 'Multi 3 active two', 'entitlement-multi3-two'),
  ('a2000000-0000-0000-0000-00000000000c', 'a1000000-0000-0000-0000-000000000007', 'Multi 3 target', 'entitlement-multi3-target'),
  ('a2000000-0000-0000-0000-00000000000d', 'a1000000-0000-0000-0000-000000000008', 'Trial old Store', 'entitlement-trial-old'),
  ('a2000000-0000-0000-0000-00000000000e', 'a1000000-0000-0000-0000-000000000008', 'Trial switch target', 'entitlement-trial-target'),
  ('a2000000-0000-0000-0000-00000000000f', 'a1000000-0000-0000-0000-00000000000d', 'No entitlement active', 'entitlement-deactivate'),
  ('a2000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-00000000000e', 'Rollback target', 'entitlement-rollback'),
  ('a2000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-00000000000f', 'Over cap one', 'entitlement-over-one'),
  ('a2000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-00000000000f', 'Over cap two', 'entitlement-over-two'),
  ('a2000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-00000000000f', 'Over cap target', 'entitlement-over-target'),
  ('a2000000-0000-0000-0000-000000000014', 'a1000000-0000-0000-0000-000000000010', 'Invalid lifecycle', 'entitlement-invalid'),
  ('a2000000-0000-0000-0000-000000000015', 'a1000000-0000-0000-0000-000000000009', 'Paid activation target', 'entitlement-paid-target');

update public.stores
set status = 'ready'
where id <> 'a2000000-0000-0000-0000-000000000003';

update public.stores
set
  status = 'active',
  activated_at = now() - interval '10 days'
where id in (
  'a2000000-0000-0000-0000-000000000005',
  'a2000000-0000-0000-0000-000000000006',
  'a2000000-0000-0000-0000-000000000008',
  'a2000000-0000-0000-0000-00000000000a',
  'a2000000-0000-0000-0000-00000000000b',
  'a2000000-0000-0000-0000-00000000000d',
  'a2000000-0000-0000-0000-00000000000f',
  'a2000000-0000-0000-0000-000000000011',
  'a2000000-0000-0000-0000-000000000012'
);

update public.stores
set status = 'inactive'
where id in (
  'a2000000-0000-0000-0000-000000000005',
  'a2000000-0000-0000-0000-00000000000d'
);

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
  ('a1000000-0000-0000-0000-000000000004', 'entitlement_lifecycle_owner', 'manual_override', 'essential', now() - interval '1 day', now() + interval '30 days', null),
  ('a1000000-0000-0000-0000-000000000005', 'entitlement_essential_owner', 'manual_override', 'essential', now() - interval '1 day', now() + interval '30 days', null),
  ('a1000000-0000-0000-0000-000000000006', 'entitlement_multi2_owner', 'manual_override', 'multi_2', now() - interval '1 day', now() + interval '30 days', null),
  ('a1000000-0000-0000-0000-000000000007', 'entitlement_multi3_owner', 'manual_override', 'multi_3', now() - interval '1 day', now() + interval '30 days', null),
  ('a1000000-0000-0000-0000-000000000008', 'entitlement_trial_owner', 'initial', 'essential', now() - interval '1 day', now() + interval '14 days', null),
  ('a1000000-0000-0000-0000-00000000000a', 'entitlement_paid_trial_owner', 'manual_override', 'multi_2', now() - interval '1 day', now() + interval '30 days', null),
  ('a1000000-0000-0000-0000-00000000000b', 'entitlement_local_valid', 'manual_override', 'multi_3', now() - interval '2 days', now() + interval '2 days', null),
  ('a1000000-0000-0000-0000-00000000000b', 'entitlement_local_same', 'manual_override', 'multi_3', now() - interval '1 day', now() + interval '5 days', null),
  ('a1000000-0000-0000-0000-00000000000b', 'entitlement_local_expired', 'manual_override', 'essential', now() - interval '10 days', now() - interval '5 days', null),
  ('a1000000-0000-0000-0000-00000000000b', 'entitlement_local_future', 'manual_override', 'multi_2', now() + interval '1 day', now() + interval '2 days', null),
  ('a1000000-0000-0000-0000-00000000000b', 'entitlement_local_revoked', 'manual_override', 'essential', now() - interval '1 day', now() + interval '1 day', now()),
  ('a1000000-0000-0000-0000-00000000000c', 'entitlement_conflict_one', 'manual_override', 'essential', now() - interval '1 day', now() + interval '10 days', null),
  ('a1000000-0000-0000-0000-00000000000c', 'entitlement_conflict_two', 'manual_override', 'multi_2', now() - interval '1 day', now() + interval '10 days', null),
  ('a1000000-0000-0000-0000-00000000000e', 'entitlement_rollback_owner', 'manual_override', 'essential', now() - interval '1 day', now() + interval '30 days', null),
  ('a1000000-0000-0000-0000-00000000000f', 'entitlement_over_owner', 'manual_override', 'essential', now() - interval '1 day', now() + interval '30 days', null),
  ('a1000000-0000-0000-0000-000000000010', 'entitlement_invalid_owner', 'manual_override', 'essential', now() - interval '1 day', now() + interval '30 days', null);

insert into public.billing_customers (
  organization_id,
  stripe_customer_id,
  provisioning_status,
  creation_idempotency_key
)
values
  ('a1000000-0000-0000-0000-000000000009', 'cus_entitlement_activation_paid', 'ready', 'idem_entitlement_activation_paid'),
  ('a1000000-0000-0000-0000-00000000000a', 'cus_entitlement_activation_paid_trial', 'ready', 'idem_entitlement_activation_paid_trial');

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
  ('a1000000-0000-0000-0000-000000000009', 'sub_entitlement_activation_paid', 'price_entitlement_activation_paid', 'multi_3', 'active', now() + interval '30 days', false, null, now()),
  ('a1000000-0000-0000-0000-00000000000a', 'sub_entitlement_activation_paid_trial', 'price_entitlement_activation_paid_trial', 'essential', 'active', now() + interval '30 days', false, null, now());

-- Shared entitlement facts, local grants, paid rules, and precedence.
select results_eq(
  $$
    select trial_plan_code, trial_valid_until
    from private.resolve_organization_entitlement_facts(
      'a1000000-0000-0000-0000-00000000000b',
      now()
    )
  $$,
  $$
    select 'multi_3'::text, now() + interval '5 days'
  $$,
  'same-plan valid local grants use one plan and the latest end while expired, future, and revoked grants are ignored'
);

select throws_ok(
  $$
    select *
    from private.resolve_organization_entitlement_facts(
      'a1000000-0000-0000-0000-00000000000c',
      now()
    )
  $$,
  'P0001',
  'Conflicting active Organization trial plans',
  'different simultaneously valid local plans fail closed'
);

select results_eq(
  $$
    select entitled, source, plan_code
    from private.resolve_effective_organization_entitlement(
      'a1000000-0000-0000-0000-00000000000a',
      now()
    )
  $$,
  $$values (true, 'paid_subscription'::text, 'essential'::text)$$,
  'eligible paid entitlement has descriptive precedence without adding local capacity'
);

update public.billing_subscriptions
set collection_paused = true
where organization_id = 'a1000000-0000-0000-0000-00000000000a';

select results_eq(
  $$
    select entitled, source, plan_code
    from private.resolve_effective_organization_entitlement(
      'a1000000-0000-0000-0000-00000000000a',
      now()
    )
  $$,
  $$values (true, 'local_grant'::text, 'multi_2'::text)$$,
  'collection-paused paid projection falls back to a valid local grant'
);

update public.billing_subscriptions
set collection_paused = false
where organization_id = 'a1000000-0000-0000-0000-000000000009';

select results_eq(
  $$
    select entitled, source, plan_code
    from private.resolve_effective_organization_entitlement(
      'a1000000-0000-0000-0000-000000000009',
      now()
    )
  $$,
  $$values (true, 'paid_subscription'::text, 'multi_3'::text)$$,
  'paid active grants entitlement'
);

update public.billing_subscriptions
set status = 'past_due', past_due_since = now()
where organization_id = 'a1000000-0000-0000-0000-000000000009';

select is(
  (
    select entitled
    from private.resolve_effective_organization_entitlement(
      'a1000000-0000-0000-0000-000000000009',
      now()
    )
  ),
  true,
  'paid past_due grants entitlement'
);

update public.billing_subscriptions
set status = 'active', past_due_since = null, collection_paused = true
where organization_id = 'a1000000-0000-0000-0000-000000000009';

select is(
  (
    select entitled
    from private.resolve_effective_organization_entitlement(
      'a1000000-0000-0000-0000-000000000009',
      now()
    )
  ),
  false,
  'collection pause prevents paid entitlement without a local grant'
);

update public.billing_subscriptions
set status = 'trialing', collection_paused = false
where organization_id = 'a1000000-0000-0000-0000-000000000009';

select is(
  (
    select entitled
    from private.resolve_effective_organization_entitlement(
      'a1000000-0000-0000-0000-000000000009',
      now()
    )
  ),
  false,
  'paid trialing does not grant entitlement'
);

update public.billing_subscriptions
set status = 'incomplete'
where organization_id = 'a1000000-0000-0000-0000-000000000009';

select is(
  (select entitled from private.resolve_effective_organization_entitlement('a1000000-0000-0000-0000-000000000009', now())),
  false,
  'paid incomplete does not grant entitlement'
);

update public.billing_subscriptions
set status = 'incomplete_expired'
where organization_id = 'a1000000-0000-0000-0000-000000000009';

select is(
  (select entitled from private.resolve_effective_organization_entitlement('a1000000-0000-0000-0000-000000000009', now())),
  false,
  'paid incomplete_expired does not grant entitlement'
);

update public.billing_subscriptions
set status = 'unpaid'
where organization_id = 'a1000000-0000-0000-0000-000000000009';

select is(
  (select entitled from private.resolve_effective_organization_entitlement('a1000000-0000-0000-0000-000000000009', now())),
  false,
  'paid unpaid does not grant entitlement'
);

update public.billing_subscriptions
set status = 'canceled'
where organization_id = 'a1000000-0000-0000-0000-000000000009';

select is(
  (select entitled from private.resolve_effective_organization_entitlement('a1000000-0000-0000-0000-000000000009', now())),
  false,
  'paid canceled does not grant entitlement'
);

update public.billing_subscriptions
set status = 'paused'
where organization_id = 'a1000000-0000-0000-0000-000000000009';

select is(
  (select entitled from private.resolve_effective_organization_entitlement('a1000000-0000-0000-0000-000000000009', now())),
  false,
  'paid paused does not grant entitlement'
);

update public.billing_subscriptions
set status = 'active', collection_paused = false
where organization_id = 'a1000000-0000-0000-0000-000000000009';

-- RPC authorization and tenant isolation.
set local role authenticated;
set local request.jwt.claims = '{}';

select throws_ok(
  $$select * from public.activate_store_within_entitlement('a2000000-0000-0000-0000-000000000002')$$,
  '42501',
  'Store entitlement activation is not authorized',
  'activation without verified Clerk claims fails closed'
);

select throws_ok(
  $$select * from public.deactivate_store('a2000000-0000-0000-0000-00000000000f')$$,
  '42501',
  'Store deactivation is not authorized',
  'deactivation without verified Clerk claims fails closed'
);

set local request.jwt.claims =
  '{"sub":"entitlement_member","o":{"id":"entitlement_activation_lifecycle","rol":"member"}}';

select throws_ok(
  $$select * from public.activate_store_within_entitlement('a2000000-0000-0000-0000-000000000004')$$,
  '42501',
  'Store entitlement activation is not authorized',
  'Organization member cannot activate a Store'
);

select throws_ok(
  $$select * from public.deactivate_store('a2000000-0000-0000-0000-00000000000f')$$,
  '42501',
  'Store deactivation is not authorized',
  'Organization member cannot deactivate a Store'
);

set local request.jwt.claims =
  '{"sub":"entitlement_admin_missing","o":{"id":"entitlement_activation_missing","rol":"admin"}}';

select is(
  (select outcome from public.activate_store_within_entitlement('a2000000-0000-0000-0000-000000000002')),
  'organization_not_provisioned',
  'activation distinguishes an unprovisioned active Organization'
);

select is(
  (select outcome from public.deactivate_store('a2000000-0000-0000-0000-00000000000f')),
  'organization_not_provisioned',
  'deactivation distinguishes an unprovisioned active Organization'
);

set local request.jwt.claims =
  '{"sub":"entitlement_admin_lifecycle","o":{"id":"entitlement_activation_lifecycle","rol":"admin"}}';

select is(
  (select outcome from public.activate_store_within_entitlement('ffffffff-ffff-ffff-ffff-ffffffffffff')),
  'store_unavailable',
  'missing activation target is safely unavailable'
);

select is(
  (select outcome from public.activate_store_within_entitlement('a2000000-0000-0000-0000-000000000001')),
  'store_unavailable',
  'cross-tenant activation target is indistinguishable from missing'
);

select is(
  (select outcome from public.deactivate_store('a2000000-0000-0000-0000-000000000001')),
  'store_unavailable',
  'cross-tenant deactivation target is indistinguishable from missing'
);

-- Lifecycle, idempotency, immutable activation time, and no-entitlement behavior.
set local request.jwt.claims =
  '{"sub":"entitlement_admin_draft","o":{"id":"entitlement_activation_draft","rol":"admin"}}';

select is(
  (select outcome from public.activate_store_within_entitlement('a2000000-0000-0000-0000-000000000003')),
  'not_ready',
  'draft activation returns not_ready before entitlement resolution'
);

select is(
  (select outcome from public.deactivate_store('a2000000-0000-0000-0000-000000000003')),
  'not_active',
  'draft deactivation returns not_active'
);

set local request.jwt.claims =
  '{"sub":"entitlement_admin_none","o":{"id":"entitlement_activation_none","rol":"admin"}}';

select is(
  (select outcome from public.activate_store_within_entitlement('a2000000-0000-0000-0000-000000000002')),
  'not_entitled',
  'ready Store without current entitlement is not activated'
);

select is(
  (select outcome from public.deactivate_store('a2000000-0000-0000-0000-000000000002')),
  'not_active',
  'ready Store deactivation returns not_active'
);

set local request.jwt.claims =
  '{"sub":"entitlement_admin_lifecycle","o":{"id":"entitlement_activation_lifecycle","rol":"admin"}}';

select is(
  (select outcome from public.activate_store_within_entitlement('a2000000-0000-0000-0000-000000000004')),
  'activated',
  'ready Store activates below Essential capacity'
);

select ok(
  (
    select status = 'active' and activated_at is not null
    from public.stores
    where id = 'a2000000-0000-0000-0000-000000000004'
  ),
  'first activation stores an active state and database activation timestamp'
);

insert into store_entitlement_activation_timestamps (store_id, activated_at)
select id, activated_at
from public.stores
where id = 'a2000000-0000-0000-0000-000000000004';

select is(
  (select outcome from public.activate_store_within_entitlement('a2000000-0000-0000-0000-000000000004')),
  'already_active',
  'active Store activation is idempotent'
);

select is(
  (select outcome from public.deactivate_store('a2000000-0000-0000-0000-000000000004')),
  'deactivated',
  'active Store deactivates'
);

select is(
  (select outcome from public.deactivate_store('a2000000-0000-0000-0000-000000000004')),
  'already_inactive',
  'inactive Store deactivation is idempotent'
);

select ok(
  (
    select status = 'inactive' and activated_at is not null
    from public.stores
    where id = 'a2000000-0000-0000-0000-000000000004'
  ),
  'deactivation preserves the original activation timestamp'
);

select is(
  (select outcome from public.activate_store_within_entitlement('a2000000-0000-0000-0000-000000000004')),
  'activated',
  'inactive Store reactivates when entitlement capacity is available'
);

select is(
  (
    select activated_at
    from public.stores
    where id = 'a2000000-0000-0000-0000-000000000004'
  ),
  (
    select activated_at
    from store_entitlement_activation_timestamps
    where store_id = 'a2000000-0000-0000-0000-000000000004'
  ),
  'reactivation leaves the immutable activation timestamp intact'
);

set local request.jwt.claims =
  '{"sub":"entitlement_admin_deactivate","o":{"id":"entitlement_activation_deactivate","rol":"admin"}}';

select is(
  (select outcome from public.activate_store_within_entitlement('a2000000-0000-0000-0000-00000000000f')),
  'already_active',
  'already-active wins before missing entitlement is rejected'
);

select is(
  (select outcome from public.deactivate_store('a2000000-0000-0000-0000-00000000000f')),
  'deactivated',
  'deactivation succeeds without current entitlement'
);

set local request.jwt.claims =
  '{"sub":"entitlement_admin_paid","o":{"id":"entitlement_activation_paid","rol":"admin"}}';

select is(
  (select outcome from public.activate_store_within_entitlement('a2000000-0000-0000-0000-000000000015')),
  'activated',
  'eligible paid projection activates a ready Store'
);

reset role;

select results_eq(
  $$
    select status, plan_code, collection_paused
    from public.billing_subscriptions
    where organization_id = 'a1000000-0000-0000-0000-000000000009'
  $$,
  $$values ('active'::text, 'multi_3'::text, false)$$,
  'paid activation leaves the billing projection unchanged'
);

-- Capacity by plan, active-only counting, over-capacity behavior, and trial switching.
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"entitlement_admin_essential","o":{"id":"entitlement_activation_essential_cap","rol":"admin"}}';

select is(
  (select outcome from public.activate_store_within_entitlement('a2000000-0000-0000-0000-000000000007')),
  'capacity_reached',
  'Essential activation at capacity is rejected'
);

set local request.jwt.claims =
  '{"sub":"entitlement_admin_multi2","o":{"id":"entitlement_activation_multi_2","rol":"admin"}}';

select is(
  (select outcome from public.activate_store_within_entitlement('a2000000-0000-0000-0000-000000000009')),
  'activated',
  'multi_2 activates its second active Store'
);

set local request.jwt.claims =
  '{"sub":"entitlement_admin_multi3","o":{"id":"entitlement_activation_multi_3","rol":"admin"}}';

select is(
  (select outcome from public.activate_store_within_entitlement('a2000000-0000-0000-0000-00000000000c')),
  'activated',
  'multi_3 activates its third active Store'
);

set local request.jwt.claims =
  '{"sub":"entitlement_admin_over","o":{"id":"entitlement_activation_over_cap","rol":"admin"}}';

select is(
  (select outcome from public.activate_store_within_entitlement('a2000000-0000-0000-0000-000000000013')),
  'capacity_reached',
  'already-over-capacity Organization cannot activate another Store'
);

select is(
  (
    select pg_catalog.count(*)
    from public.stores
    where organization_id = 'a1000000-0000-0000-0000-00000000000f'
      and status = 'active'
  ),
  2::bigint,
  'over-capacity rejection performs no automatic downgrade deactivation'
);

set local request.jwt.claims =
  '{"sub":"entitlement_admin_trial","o":{"id":"entitlement_activation_trial_switch","rol":"admin"}}';

select is(
  (select outcome from public.activate_store_within_entitlement('a2000000-0000-0000-0000-00000000000e')),
  'activated',
  'valid initial trial generically activates a replacement ready Store'
);

reset role;

select is(
  (
    select pg_catalog.count(*)
    from public.billing_trial_grants
    where organization_id = 'a1000000-0000-0000-0000-000000000008'
      and grant_kind = 'initial'
  ),
  1::bigint,
  'generic trial activation creates no duplicate initial grant'
);

select results_eq(
  $$
    select starts_at, ends_at
    from public.billing_trial_grants
    where organization_id = 'a1000000-0000-0000-0000-000000000008'
      and grant_kind = 'initial'
  $$,
  $$values (now() - interval '1 day', now() + interval '14 days')$$,
  'generic activation preserves initial-trial dates'
);

select is(
  (
    select pg_catalog.count(*)
    from public.stores
    where organization_id = 'a1000000-0000-0000-0000-000000000008'
      and status = 'active'
  ),
  1::bigint,
  'historical inactive activated_at does not consume current capacity'
);

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"entitlement_admin_trial","o":{"id":"entitlement_activation_trial_switch","rol":"admin"}}';

select is(
  (select outcome from public.deactivate_store('a2000000-0000-0000-0000-00000000000e')),
  'deactivated',
  'trial-backed Store can be deactivated'
);

select is(
  (select outcome from public.activate_store_within_entitlement('a2000000-0000-0000-0000-00000000000e')),
  'activated',
  'trial-backed inactive Store can be reactivated without changing the grant'
);

reset role;

select is(
  (
    select pg_catalog.count(*)
    from public.billing_trial_grants
    where organization_id = 'a1000000-0000-0000-0000-000000000008'
  ),
  1::bigint,
  'switching and reactivation leave trial-grant cardinality unchanged'
);

-- Atomic rollback on a Store write failure.
create function pg_temp.fail_store_entitlement_activation_update()
returns trigger
language plpgsql
as $$
begin
  if new.id = 'a2000000-0000-0000-0000-000000000010'::uuid then
    raise exception using
      errcode = 'P0001',
      message = 'test Store activation write failure';
  end if;

  return new;
end;
$$;

create trigger fail_store_entitlement_activation_update
before update on public.stores
for each row
execute function pg_temp.fail_store_entitlement_activation_update();

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"entitlement_admin_rollback","o":{"id":"entitlement_activation_rollback","rol":"admin"}}';

select throws_ok(
  $$select * from public.activate_store_within_entitlement('a2000000-0000-0000-0000-000000000010')$$,
  'P0001',
  'test Store activation write failure',
  'Store write failures remain errors and roll back activation'
);

reset role;
drop trigger fail_store_entitlement_activation_update on public.stores;

select results_eq(
  $$
    select status, activated_at
    from public.stores
    where id = 'a2000000-0000-0000-0000-000000000010'
  $$,
  $$values ('ready'::text, null::timestamptz)$$,
  'failed activation leaves Store lifecycle state unchanged'
);

-- Impossible persisted combinations fail as invariants rather than domain outcomes.
alter table public.stores disable trigger stores_enforce_lifecycle;
alter table public.stores drop constraint stores_status_activated_at_check;

update public.stores
set activated_at = now()
where id = 'a2000000-0000-0000-0000-000000000014';

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"entitlement_admin_invalid","o":{"id":"entitlement_activation_invalid","rol":"admin"}}';

select throws_ok(
  $$select * from public.activate_store_within_entitlement('a2000000-0000-0000-0000-000000000014')$$,
  'P0001',
  'Store entitlement activation invariant violation',
  'impossible persisted lifecycle combinations fail closed'
);

reset role;

select * from finish();
rollback;
