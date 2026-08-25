begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(100);

insert into public.organizations (id, clerk_organization_id)
values
  ('41000000-0000-0000-0000-000000000001', 'billing_org_a'),
  ('41000000-0000-0000-0000-000000000002', 'billing_org_b'),
  ('41000000-0000-0000-0000-000000000003', 'billing_org_c'),
  ('41000000-0000-0000-0000-000000000004', 'billing_org_d'),
  ('41000000-0000-0000-0000-000000000005', 'billing_org_e');

-- Structure.
select has_table(
  'public',
  'billing_trial_grants',
  'billing_trial_grants table exists'
);
select has_table(
  'public',
  'billing_customers',
  'billing_customers table exists'
);
select has_table(
  'public',
  'billing_subscriptions',
  'billing_subscriptions table exists'
);
select has_table(
  'public',
  'stripe_webhook_events',
  'stripe_webhook_events table exists'
);

select columns_are(
  'public',
  'billing_trial_grants',
  array[
    'id',
    'organization_id',
    'clerk_user_id',
    'grant_kind',
    'plan_code',
    'starts_at',
    'ends_at',
    'revoked_at',
    'created_at',
    'updated_at'
  ],
  'billing_trial_grants has exactly the approved columns'
);

select columns_are(
  'public',
  'billing_customers',
  array[
    'organization_id',
    'stripe_customer_id',
    'provisioning_status',
    'creation_idempotency_key',
    'created_at',
    'updated_at'
  ],
  'billing_customers has exactly the approved columns'
);

select columns_are(
  'public',
  'billing_subscriptions',
  array[
    'organization_id',
    'stripe_subscription_id',
    'stripe_price_id',
    'plan_code',
    'status',
    'current_period_end',
    'cancel_at_period_end',
    'collection_paused',
    'past_due_since',
    'last_synced_at',
    'created_at',
    'updated_at'
  ],
  'billing_subscriptions has exactly the approved columns'
);

select columns_are(
  'public',
  'stripe_webhook_events',
  array[
    'stripe_event_id',
    'event_type',
    'stripe_object_id',
    'livemode',
    'stripe_created_at',
    'processed_at',
    'created_at'
  ],
  'stripe_webhook_events has exactly the approved columns'
);

select ok(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'billing_subscriptions'
      and column_name in ('maxstores', 'max_stores')
  ),
  'billing_subscriptions does not persist Store capacity'
);

select is(
  (
    select count(*)
    from pg_catalog.pg_constraint
    where conrelid = 'public.billing_trial_grants'::regclass
  ),
  7::bigint,
  'billing_trial_grants has its primary, foreign-key, and five checks'
);

select is(
  (
    select count(*)
    from pg_catalog.pg_constraint
    where conrelid = 'public.billing_customers'::regclass
  ),
  6::bigint,
  'billing_customers has its primary, foreign-key, unique, and check constraints'
);

select is(
  (
    select count(*)
    from pg_catalog.pg_constraint
    where conrelid = 'public.billing_subscriptions'::regclass
  ),
  6::bigint,
  'billing_subscriptions has its primary, foreign-key, unique, and check constraints'
);

select is(
  (
    select count(*)
    from pg_catalog.pg_constraint
    where conrelid = 'public.stripe_webhook_events'::regclass
  ),
  1::bigint,
  'stripe_webhook_events has only its primary-key constraint'
);

select is(
  (
    select count(*)
    from pg_catalog.pg_constraint
    where conrelid in (
      'public.billing_trial_grants'::regclass,
      'public.billing_customers'::regclass,
      'public.billing_subscriptions'::regclass
    )
      and contype = 'f'
      and confupdtype = 'r'
      and confdeltype = 'r'
  ),
  3::bigint,
  'all billing foreign keys use ON UPDATE and ON DELETE RESTRICT'
);

select is(
  (
    select jsonb_agg(indexname order by indexname)
    from pg_catalog.pg_indexes
    where schemaname = 'public'
      and tablename = 'billing_trial_grants'
  ),
  '["billing_trial_grants_initial_clerk_user_id_key", "billing_trial_grants_initial_organization_id_key", "billing_trial_grants_organization_validity_idx", "billing_trial_grants_pkey"]'::jsonb,
  'billing_trial_grants has only the approved indexes'
);

select is(
  (
    select jsonb_agg(indexname order by indexname)
    from pg_catalog.pg_indexes
    where schemaname = 'public'
      and tablename = 'billing_customers'
  ),
  '["billing_customers_creation_idempotency_key_unique", "billing_customers_pkey", "billing_customers_stripe_customer_id_key"]'::jsonb,
  'billing_customers has only canonical and provider identity indexes'
);

select is(
  (
    select jsonb_agg(indexname order by indexname)
    from pg_catalog.pg_indexes
    where schemaname = 'public'
      and tablename = 'billing_subscriptions'
  ),
  '["billing_subscriptions_pkey", "billing_subscriptions_stripe_subscription_id_key"]'::jsonb,
  'billing_subscriptions has only Organization and Stripe identity indexes'
);

select is(
  (
    select jsonb_agg(indexname order by indexname)
    from pg_catalog.pg_indexes
    where schemaname = 'public'
      and tablename = 'stripe_webhook_events'
  ),
  '["stripe_webhook_events_pkey"]'::jsonb,
  'stripe_webhook_events uses the Event ID primary key for idempotency'
);

select is(
  (
    select jsonb_agg(trigger_name order by trigger_name)
    from information_schema.triggers
    where event_object_schema = 'public'
      and event_object_table in (
        'billing_trial_grants',
        'billing_customers',
        'billing_subscriptions'
      )
  ),
  '["billing_customers_set_row_timestamps", "billing_subscriptions_set_row_timestamps", "billing_trial_grants_set_row_timestamps"]'::jsonb,
  'mutable billing tables reuse the existing timestamp trigger helper'
);

select is(
  (
    select count(*)
    from information_schema.triggers
    where event_object_schema = 'public'
      and event_object_table = 'stripe_webhook_events'
  ),
  0::bigint,
  'the append-oriented webhook ledger has no update timestamp trigger'
);

select ok(
  not exists (
    select 1
    from pg_catalog.pg_class as relation
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relkind = 'S'
      and (
        relation.relname like 'billing_%'
        or relation.relname like 'stripe_webhook_events%'
      )
  ),
  'billing foundation creates no sequences'
);

-- RLS, policies, and grants.
select ok(
  relation.relrowsecurity and not relation.relforcerowsecurity,
  'billing_trial_grants has RLS enabled without FORCE RLS'
)
from pg_catalog.pg_class as relation
join pg_catalog.pg_namespace as namespace
  on namespace.oid = relation.relnamespace
where namespace.nspname = 'public'
  and relation.relname = 'billing_trial_grants';

select ok(
  relation.relrowsecurity and not relation.relforcerowsecurity,
  'billing_customers has RLS enabled without FORCE RLS'
)
from pg_catalog.pg_class as relation
join pg_catalog.pg_namespace as namespace
  on namespace.oid = relation.relnamespace
where namespace.nspname = 'public'
  and relation.relname = 'billing_customers';

select ok(
  relation.relrowsecurity and not relation.relforcerowsecurity,
  'billing_subscriptions has RLS enabled without FORCE RLS'
)
from pg_catalog.pg_class as relation
join pg_catalog.pg_namespace as namespace
  on namespace.oid = relation.relnamespace
where namespace.nspname = 'public'
  and relation.relname = 'billing_subscriptions';

select ok(
  relation.relrowsecurity and not relation.relforcerowsecurity,
  'stripe_webhook_events has RLS enabled without FORCE RLS'
)
from pg_catalog.pg_class as relation
join pg_catalog.pg_namespace as namespace
  on namespace.oid = relation.relnamespace
where namespace.nspname = 'public'
  and relation.relname = 'stripe_webhook_events';

select is(
  (
    select count(*)
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename in (
        'billing_trial_grants',
        'billing_customers',
        'billing_subscriptions',
        'stripe_webhook_events'
      )
  ),
  0::bigint,
  'billing foundation exposes no Data API policies in the schema slice'
);

select ok(
  not has_table_privilege('authenticated', 'public.billing_trial_grants', 'SELECT')
  and not has_table_privilege('authenticated', 'public.billing_trial_grants', 'INSERT')
  and not has_table_privilege('authenticated', 'public.billing_trial_grants', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.billing_trial_grants', 'DELETE')
  and not has_table_privilege('authenticated', 'public.billing_trial_grants', 'TRUNCATE')
  and not has_table_privilege('authenticated', 'public.billing_trial_grants', 'REFERENCES')
  and not has_table_privilege('authenticated', 'public.billing_trial_grants', 'TRIGGER'),
  'authenticated has no privileges on billing_trial_grants'
);

select ok(
  not has_table_privilege('authenticated', 'public.billing_customers', 'SELECT')
  and not has_table_privilege('authenticated', 'public.billing_customers', 'INSERT')
  and not has_table_privilege('authenticated', 'public.billing_customers', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.billing_customers', 'DELETE')
  and not has_table_privilege('authenticated', 'public.billing_customers', 'TRUNCATE')
  and not has_table_privilege('authenticated', 'public.billing_customers', 'REFERENCES')
  and not has_table_privilege('authenticated', 'public.billing_customers', 'TRIGGER'),
  'authenticated has no privileges on billing_customers'
);

select ok(
  not has_table_privilege('authenticated', 'public.billing_subscriptions', 'SELECT')
  and not has_table_privilege('authenticated', 'public.billing_subscriptions', 'INSERT')
  and not has_table_privilege('authenticated', 'public.billing_subscriptions', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.billing_subscriptions', 'DELETE')
  and not has_table_privilege('authenticated', 'public.billing_subscriptions', 'TRUNCATE')
  and not has_table_privilege('authenticated', 'public.billing_subscriptions', 'REFERENCES')
  and not has_table_privilege('authenticated', 'public.billing_subscriptions', 'TRIGGER'),
  'authenticated has no privileges on billing_subscriptions'
);

select ok(
  not has_table_privilege('authenticated', 'public.stripe_webhook_events', 'SELECT')
  and not has_table_privilege('authenticated', 'public.stripe_webhook_events', 'INSERT')
  and not has_table_privilege('authenticated', 'public.stripe_webhook_events', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.stripe_webhook_events', 'DELETE')
  and not has_table_privilege('authenticated', 'public.stripe_webhook_events', 'TRUNCATE')
  and not has_table_privilege('authenticated', 'public.stripe_webhook_events', 'REFERENCES')
  and not has_table_privilege('authenticated', 'public.stripe_webhook_events', 'TRIGGER'),
  'authenticated has no privileges on stripe_webhook_events'
);

select ok(
  not has_table_privilege('anon', 'public.billing_trial_grants', 'SELECT')
  and not has_table_privilege('anon', 'public.billing_trial_grants', 'INSERT')
  and not has_table_privilege('anon', 'public.billing_trial_grants', 'UPDATE')
  and not has_table_privilege('anon', 'public.billing_trial_grants', 'DELETE')
  and not has_table_privilege('anon', 'public.billing_trial_grants', 'TRUNCATE')
  and not has_table_privilege('anon', 'public.billing_trial_grants', 'REFERENCES')
  and not has_table_privilege('anon', 'public.billing_trial_grants', 'TRIGGER'),
  'anon has no privileges on billing_trial_grants'
);

select ok(
  not has_table_privilege('anon', 'public.billing_customers', 'SELECT')
  and not has_table_privilege('anon', 'public.billing_customers', 'INSERT')
  and not has_table_privilege('anon', 'public.billing_customers', 'UPDATE')
  and not has_table_privilege('anon', 'public.billing_customers', 'DELETE')
  and not has_table_privilege('anon', 'public.billing_customers', 'TRUNCATE')
  and not has_table_privilege('anon', 'public.billing_customers', 'REFERENCES')
  and not has_table_privilege('anon', 'public.billing_customers', 'TRIGGER'),
  'anon has no privileges on billing_customers'
);

select ok(
  not has_table_privilege('anon', 'public.billing_subscriptions', 'SELECT')
  and not has_table_privilege('anon', 'public.billing_subscriptions', 'INSERT')
  and not has_table_privilege('anon', 'public.billing_subscriptions', 'UPDATE')
  and not has_table_privilege('anon', 'public.billing_subscriptions', 'DELETE')
  and not has_table_privilege('anon', 'public.billing_subscriptions', 'TRUNCATE')
  and not has_table_privilege('anon', 'public.billing_subscriptions', 'REFERENCES')
  and not has_table_privilege('anon', 'public.billing_subscriptions', 'TRIGGER'),
  'anon has no privileges on billing_subscriptions'
);

select ok(
  not has_table_privilege('anon', 'public.stripe_webhook_events', 'SELECT')
  and not has_table_privilege('anon', 'public.stripe_webhook_events', 'INSERT')
  and not has_table_privilege('anon', 'public.stripe_webhook_events', 'UPDATE')
  and not has_table_privilege('anon', 'public.stripe_webhook_events', 'DELETE')
  and not has_table_privilege('anon', 'public.stripe_webhook_events', 'TRUNCATE')
  and not has_table_privilege('anon', 'public.stripe_webhook_events', 'REFERENCES')
  and not has_table_privilege('anon', 'public.stripe_webhook_events', 'TRIGGER'),
  'anon has no privileges on stripe_webhook_events'
);

set local role anon;
set local request.jwt.claims = '{}';

select throws_ok(
  $$select * from public.billing_trial_grants$$,
  '42501', null, 'anon cannot read billing_trial_grants'
);
select throws_ok(
  $$select * from public.billing_customers$$,
  '42501', null, 'anon cannot read billing_customers'
);
select throws_ok(
  $$select * from public.billing_subscriptions$$,
  '42501', null, 'anon cannot read billing_subscriptions'
);
select throws_ok(
  $$select * from public.stripe_webhook_events$$,
  '42501', null, 'anon cannot read stripe_webhook_events'
);

reset role;

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"billing_admin_a","o":{"id":"billing_org_a","rol":"admin"}}';

select throws_ok(
  $$select * from public.billing_trial_grants$$,
  '42501', null, 'authenticated cannot directly read billing_trial_grants'
);
select throws_ok(
  $$select * from public.billing_customers$$,
  '42501', null, 'authenticated cannot directly read billing_customers'
);
select throws_ok(
  $$select * from public.billing_subscriptions$$,
  '42501', null, 'authenticated cannot directly read billing_subscriptions'
);
select throws_ok(
  $$select * from public.stripe_webhook_events$$,
  '42501', null, 'authenticated cannot directly read stripe_webhook_events'
);

select throws_ok(
  $$insert into public.billing_trial_grants (organization_id, clerk_user_id, grant_kind, plan_code, starts_at, ends_at) values ('41000000-0000-0000-0000-000000000001', 'denied', 'initial', 'essential', now(), now() + interval '15 days')$$,
  '42501', null, 'authenticated cannot insert billing_trial_grants'
);
select throws_ok(
  $$update public.billing_trial_grants set revoked_at = now()$$,
  '42501', null, 'authenticated cannot update billing_trial_grants'
);
select throws_ok(
  $$delete from public.billing_trial_grants$$,
  '42501', null, 'authenticated cannot delete billing_trial_grants'
);
select throws_ok(
  $$insert into public.billing_customers (organization_id, provisioning_status, creation_idempotency_key) values ('41000000-0000-0000-0000-000000000001', 'pending', 'denied')$$,
  '42501', null, 'authenticated cannot insert billing_customers'
);
select throws_ok(
  $$update public.billing_customers set provisioning_status = 'pending'$$,
  '42501', null, 'authenticated cannot update billing_customers'
);
select throws_ok(
  $$delete from public.billing_customers$$,
  '42501', null, 'authenticated cannot delete billing_customers'
);
select throws_ok(
  $$insert into public.billing_subscriptions (organization_id, stripe_subscription_id, stripe_price_id, plan_code, status, last_synced_at) values ('41000000-0000-0000-0000-000000000001', 'sub_denied', 'price_denied', 'essential', 'active', now())$$,
  '42501', null, 'authenticated cannot insert billing_subscriptions'
);
select throws_ok(
  $$update public.billing_subscriptions set status = 'canceled'$$,
  '42501', null, 'authenticated cannot update billing_subscriptions'
);
select throws_ok(
  $$delete from public.billing_subscriptions$$,
  '42501', null, 'authenticated cannot delete billing_subscriptions'
);
select throws_ok(
  $$insert into public.stripe_webhook_events (stripe_event_id, event_type, livemode, stripe_created_at) values ('evt_denied', 'test.event', false, now())$$,
  '42501', null, 'authenticated cannot insert stripe_webhook_events'
);
select throws_ok(
  $$update public.stripe_webhook_events set processed_at = now()$$,
  '42501', null, 'authenticated cannot update stripe_webhook_events'
);
select throws_ok(
  $$delete from public.stripe_webhook_events$$,
  '42501', null, 'authenticated cannot delete stripe_webhook_events'
);

reset role;

-- Even a temporary SELECT grant remains default-deny because no policies exist.
grant select on table
  public.billing_trial_grants,
  public.billing_customers,
  public.billing_subscriptions,
  public.stripe_webhook_events
to authenticated;

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"billing_admin_a","o":{"id":"billing_org_a","rol":"admin"}}';

select is(
  (
    select
      (select count(*) from public.billing_trial_grants)
      + (select count(*) from public.billing_customers)
      + (select count(*) from public.billing_subscriptions)
      + (select count(*) from public.stripe_webhook_events)
  ),
  0::bigint,
  'Org A admin sees no billing rows without an approved read policy'
);

set local request.jwt.claims =
  '{"sub":"billing_member_a","o":{"id":"billing_org_a","rol":"member"}}';

select is(
  (
    select
      (select count(*) from public.billing_trial_grants)
      + (select count(*) from public.billing_customers)
      + (select count(*) from public.billing_subscriptions)
      + (select count(*) from public.stripe_webhook_events)
  ),
  0::bigint,
  'Org A member sees no billing rows without an approved read policy'
);

set local request.jwt.claims =
  '{"sub":"billing_admin_b","o":{"id":"billing_org_b","rol":"admin"}}';

select is(
  (
    select
      (select count(*) from public.billing_trial_grants)
      + (select count(*) from public.billing_customers)
      + (select count(*) from public.billing_subscriptions)
      + (select count(*) from public.stripe_webhook_events)
  ),
  0::bigint,
  'Org B cannot read Org A or any other billing rows'
);

set local request.jwt.claims = '{"sub":"billing_without_org"}';

select is(
  (
    select
      (select count(*) from public.billing_trial_grants)
      + (select count(*) from public.billing_customers)
      + (select count(*) from public.billing_subscriptions)
      + (select count(*) from public.stripe_webhook_events)
  ),
  0::bigint,
  'authenticated user without active Organization sees no billing rows'
);

reset role;

revoke select on table
  public.billing_trial_grants,
  public.billing_customers,
  public.billing_subscriptions,
  public.stripe_webhook_events
from authenticated;

-- Trial constraints.
select lives_ok(
  $$insert into public.billing_trial_grants (id, organization_id, clerk_user_id, grant_kind, plan_code, starts_at, ends_at, created_at, updated_at) values ('42000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000001', 'billing_trial_user_a', 'initial', 'essential', '2020-01-01 00:00:00+00', '2020-01-16 00:00:00+00', '2020-01-01 00:00:00+00', '2020-01-01 00:00:00+00')$$,
  'initial Essential trial with exactly 15 days is allowed'
);

select throws_ok(
  $$insert into public.billing_trial_grants (organization_id, clerk_user_id, grant_kind, plan_code, starts_at, ends_at) values ('41000000-0000-0000-0000-000000000004', 'billing_trial_multi_2', 'initial', 'multi_2', '2020-01-01 00:00:00+00', '2020-01-16 00:00:00+00')$$,
  '23514', null, 'initial multi_2 trial is rejected'
);

select throws_ok(
  $$insert into public.billing_trial_grants (organization_id, clerk_user_id, grant_kind, plan_code, starts_at, ends_at) values ('41000000-0000-0000-0000-000000000004', 'billing_trial_multi_3', 'initial', 'multi_3', '2020-01-01 00:00:00+00', '2020-01-16 00:00:00+00')$$,
  '23514', null, 'initial multi_3 trial is rejected'
);

select throws_ok(
  $$insert into public.billing_trial_grants (organization_id, clerk_user_id, grant_kind, plan_code, starts_at, ends_at) values ('41000000-0000-0000-0000-000000000004', 'billing_trial_short', 'initial', 'essential', '2020-01-01 00:00:00+00', '2020-01-15 00:00:00+00')$$,
  '23514', null, 'initial trial shorter than 15 days is rejected'
);

select throws_ok(
  $$insert into public.billing_trial_grants (organization_id, clerk_user_id, grant_kind, plan_code, starts_at, ends_at) values ('41000000-0000-0000-0000-000000000004', 'billing_trial_equal', 'manual_override', 'essential', '2020-01-01 00:00:00+00', '2020-01-01 00:00:00+00')$$,
  '23514', null, 'grant with equal timestamps is rejected'
);

select throws_ok(
  $$insert into public.billing_trial_grants (organization_id, clerk_user_id, grant_kind, plan_code, starts_at, ends_at) values ('41000000-0000-0000-0000-000000000004', 'billing_trial_reverse', 'manual_override', 'essential', '2020-01-02 00:00:00+00', '2020-01-01 00:00:00+00')$$,
  '23514', null, 'grant ending before it starts is rejected'
);

select throws_ok(
  $$insert into public.billing_trial_grants (organization_id, clerk_user_id, grant_kind, plan_code, starts_at, ends_at) values ('41000000-0000-0000-0000-000000000004', 'billing_trial_bad_kind', 'promotional', 'essential', '2020-01-01 00:00:00+00', '2020-01-02 00:00:00+00')$$,
  '23514', null, 'unknown grant kind is rejected'
);

select throws_ok(
  $$insert into public.billing_trial_grants (organization_id, clerk_user_id, grant_kind, plan_code, starts_at, ends_at) values ('41000000-0000-0000-0000-000000000004', 'billing_trial_bad_plan', 'manual_override', 'multi_4', '2020-01-01 00:00:00+00', '2020-01-02 00:00:00+00')$$,
  '23514', null, 'unknown trial plan code is rejected'
);

select throws_ok(
  $$insert into public.billing_trial_grants (organization_id, clerk_user_id, grant_kind, plan_code, starts_at, ends_at) values ('41000000-0000-0000-0000-000000000001', 'billing_trial_user_new', 'initial', 'essential', '2021-01-01 00:00:00+00', '2021-01-16 00:00:00+00')$$,
  '23505', null, 'second initial trial for the same Organization is rejected'
);

select throws_ok(
  $$insert into public.billing_trial_grants (organization_id, clerk_user_id, grant_kind, plan_code, starts_at, ends_at) values ('41000000-0000-0000-0000-000000000002', 'billing_trial_user_a', 'initial', 'essential', '2021-01-01 00:00:00+00', '2021-01-16 00:00:00+00')$$,
  '23505', null, 'second initial trial for the same Clerk User is rejected'
);

update public.billing_trial_grants
set revoked_at = '2020-01-02 00:00:00+00'
where id = '42000000-0000-0000-0000-000000000001';

select throws_ok(
  $$insert into public.billing_trial_grants (organization_id, clerk_user_id, grant_kind, plan_code, starts_at, ends_at) values ('41000000-0000-0000-0000-000000000001', 'billing_trial_after_revoke', 'initial', 'essential', '2022-01-01 00:00:00+00', '2022-01-16 00:00:00+00')$$,
  '23505', null, 'revoked initial trial remains consumed by the Organization'
);

select lives_ok(
  $$insert into public.billing_trial_grants (organization_id, clerk_user_id, grant_kind, plan_code, starts_at, ends_at) values ('41000000-0000-0000-0000-000000000001', 'billing_trial_user_a', 'manual_override', 'multi_2', '2022-01-01 00:00:00+00', '2022-01-08 00:00:00+00')$$,
  'manual override may reuse Organization/User and use multi_2'
);

select lives_ok(
  $$insert into public.billing_trial_grants (organization_id, clerk_user_id, grant_kind, plan_code, starts_at, ends_at) values ('41000000-0000-0000-0000-000000000001', 'billing_trial_user_a', 'manual_override', 'multi_3', '2023-01-01 00:00:00+00', '2023-01-03 00:00:00+00')$$,
  'additional manual override may use multi_3 without replacing history'
);

-- Canonical Customer constraints.
select lives_ok(
  $$insert into public.billing_customers (organization_id, provisioning_status, creation_idempotency_key, created_at, updated_at) values ('41000000-0000-0000-0000-000000000001', 'pending', 'idem_billing_a', '2020-01-01 00:00:00+00', '2020-01-01 00:00:00+00')$$,
  'pending Customer claim may exist before Stripe Customer ID is known'
);

select lives_ok(
  $$insert into public.billing_customers (organization_id, stripe_customer_id, provisioning_status, creation_idempotency_key) values ('41000000-0000-0000-0000-000000000002', 'cus_billing_b', 'ready', 'idem_billing_b')$$,
  'ready canonical Customer with Stripe ID is allowed'
);

select throws_ok(
  $$insert into public.billing_customers (organization_id, provisioning_status, creation_idempotency_key) values ('41000000-0000-0000-0000-000000000003', 'ready', 'idem_ready_without_customer')$$,
  '23514', null, 'ready Customer without Stripe Customer ID is rejected'
);

select throws_ok(
  $$insert into public.billing_customers (organization_id, provisioning_status, creation_idempotency_key) values ('41000000-0000-0000-0000-000000000003', 'failed', 'idem_bad_status')$$,
  '23514', null, 'invalid Customer provisioning status is rejected'
);

select throws_ok(
  $$insert into public.billing_customers (organization_id, provisioning_status, creation_idempotency_key) values ('41000000-0000-0000-0000-000000000001', 'pending', 'idem_duplicate_org')$$,
  '23505', null, 'second canonical Customer row for one Organization is rejected'
);

select throws_ok(
  $$insert into public.billing_customers (organization_id, stripe_customer_id, provisioning_status, creation_idempotency_key) values ('41000000-0000-0000-0000-000000000003', 'cus_billing_b', 'ready', 'idem_duplicate_customer')$$,
  '23505', null, 'duplicate Stripe Customer ID is rejected'
);

select throws_ok(
  $$insert into public.billing_customers (organization_id, provisioning_status, creation_idempotency_key) values ('41000000-0000-0000-0000-000000000003', 'pending', 'idem_billing_a')$$,
  '23505', null, 'duplicate Customer creation idempotency key is rejected'
);

update public.billing_customers
set stripe_customer_id = 'cus_billing_a', provisioning_status = 'ready'
where organization_id = '41000000-0000-0000-0000-000000000001';

insert into public.billing_customers (
  organization_id,
  stripe_customer_id,
  provisioning_status,
  creation_idempotency_key
)
values
  (
    '41000000-0000-0000-0000-000000000003',
    'cus_billing_c',
    'ready',
    'idem_billing_c'
  ),
  (
    '41000000-0000-0000-0000-000000000004',
    'cus_billing_d',
    'ready',
    'idem_billing_d'
  ),
  (
    '41000000-0000-0000-0000-000000000005',
    'cus_billing_e',
    'ready',
    'idem_billing_e'
  );

-- Paid Subscription projection constraints.
select lives_ok(
  $$insert into public.billing_subscriptions (organization_id, stripe_subscription_id, stripe_price_id, plan_code, status, current_period_end, last_synced_at, created_at, updated_at) values ('41000000-0000-0000-0000-000000000001', 'sub_billing_a', 'price_billing_essential', 'essential', 'active', '2026-09-24 00:00:00+00', '2026-08-24 00:00:00+00', '2020-01-01 00:00:00+00', '2020-01-01 00:00:00+00')$$,
  'Essential paid subscription projection is allowed'
);

select lives_ok(
  $$insert into public.billing_subscriptions (organization_id, stripe_subscription_id, stripe_price_id, plan_code, status, current_period_end, past_due_since, last_synced_at) values ('41000000-0000-0000-0000-000000000002', 'sub_billing_b', 'price_billing_multi_2', 'multi_2', 'past_due', '2026-09-24 00:00:00+00', '2026-08-24 00:00:00+00', '2026-08-24 00:00:00+00')$$,
  'multi_2 past_due subscription with recovery timestamp is allowed'
);

select lives_ok(
  $$insert into public.billing_subscriptions (organization_id, stripe_subscription_id, stripe_price_id, plan_code, status, current_period_end, last_synced_at) values ('41000000-0000-0000-0000-000000000003', 'sub_billing_c', 'price_billing_multi_3', 'multi_3', 'canceled', '2026-09-24 00:00:00+00', '2026-08-24 00:00:00+00')$$,
  'multi_3 canceled subscription projection is representable'
);

select lives_ok(
  $$insert into public.billing_subscriptions (organization_id, stripe_subscription_id, stripe_price_id, plan_code, status, last_synced_at) values ('41000000-0000-0000-0000-000000000004', 'sub_billing_d', 'price_billing_trialing', 'essential', 'trialing', '2026-08-24 00:00:00+00')$$,
  'Stripe trialing status is representable without local entitlement semantics'
);

select throws_ok(
  $$insert into public.billing_subscriptions (organization_id, stripe_subscription_id, stripe_price_id, plan_code, status, last_synced_at) values ('41000000-0000-0000-0000-000000000001', 'sub_duplicate_org', 'price_duplicate_org', 'essential', 'active', now())$$,
  '23505', null, 'second current projection for one Organization is rejected'
);

select throws_ok(
  $$insert into public.billing_subscriptions (organization_id, stripe_subscription_id, stripe_price_id, plan_code, status, last_synced_at) values ('41000000-0000-0000-0000-000000000005', 'sub_billing_a', 'price_duplicate_sub', 'essential', 'active', now())$$,
  '23505', null, 'duplicate Stripe Subscription ID is rejected'
);

select throws_ok(
  $$insert into public.billing_subscriptions (organization_id, stripe_subscription_id, stripe_price_id, plan_code, status, last_synced_at) values ('41000000-0000-0000-0000-000000000005', 'sub_bad_plan', 'price_bad_plan', 'multi_4', 'active', now())$$,
  '23514', null, 'unknown paid plan code is rejected'
);

select throws_ok(
  $$insert into public.billing_subscriptions (organization_id, stripe_subscription_id, stripe_price_id, plan_code, status, last_synced_at) values ('41000000-0000-0000-0000-000000000005', 'sub_bad_status', 'price_bad_status', 'essential', 'unknown', now())$$,
  '23514', null, 'unknown Stripe Subscription status is rejected'
);

select throws_ok(
  $$insert into public.billing_subscriptions (organization_id, stripe_subscription_id, stripe_price_id, plan_code, status, last_synced_at) values ('41000000-0000-0000-0000-000000000005', 'sub_missing_past_due_since', 'price_missing_past_due_since', 'essential', 'past_due', now())$$,
  '23514', null, 'past_due projection requires past_due_since'
);

select throws_ok(
  $$insert into public.billing_subscriptions (organization_id, stripe_subscription_id, stripe_price_id, plan_code, status, past_due_since, last_synced_at) values ('41000000-0000-0000-0000-000000000005', 'sub_stale_past_due_since', 'price_stale_past_due_since', 'essential', 'active', now(), now())$$,
  '23514', null, 'non-past_due projection rejects stale past_due_since'
);

-- Webhook Event idempotency.
select lives_ok(
  $$insert into public.stripe_webhook_events (stripe_event_id, event_type, stripe_object_id, livemode, stripe_created_at) values ('evt_billing_1', 'customer.subscription.updated', 'sub_billing_a', false, '2026-08-24 00:00:00+00')$$,
  'webhook ledger accepts minimum Event metadata'
);

select lives_ok(
  $$insert into public.stripe_webhook_events (stripe_event_id, event_type, livemode, stripe_created_at) values ('evt_billing_2', 'invoice.payment_failed', false, '2026-08-24 00:01:00+00')$$,
  'webhook ledger permits nullable object and processing timestamps'
);

select throws_ok(
  $$insert into public.stripe_webhook_events (stripe_event_id, event_type, livemode, stripe_created_at) values ('evt_billing_1', 'customer.subscription.updated', false, '2026-08-24 00:02:00+00')$$,
  '23505', null, 'duplicate Stripe Event ID is rejected'
);

-- RESTRICT deletion behavior.
insert into public.organizations (id, clerk_organization_id)
values
  ('41000000-0000-0000-0000-000000000006', 'billing_org_trial_only'),
  ('41000000-0000-0000-0000-000000000007', 'billing_org_customer_only');

insert into public.billing_trial_grants (
  organization_id,
  clerk_user_id,
  grant_kind,
  plan_code,
  starts_at,
  ends_at
)
values (
  '41000000-0000-0000-0000-000000000006',
  'billing_trial_user_f',
  'manual_override',
  'essential',
  '2026-08-24 00:00:00+00',
  '2026-08-25 00:00:00+00'
);

insert into public.billing_customers (
  organization_id,
  provisioning_status,
  creation_idempotency_key
)
values (
  '41000000-0000-0000-0000-000000000007',
  'pending',
  'idem_billing_g'
);

select throws_ok(
  $$delete from public.organizations where id = '41000000-0000-0000-0000-000000000006'$$,
  '23503', null, 'Organization deletion is restricted by trial history'
);

select throws_ok(
  $$delete from public.organizations where id = '41000000-0000-0000-0000-000000000007'$$,
  '23503', null, 'Organization deletion is restricted by canonical Customer identity'
);

select throws_ok(
  $$delete from public.billing_customers where organization_id = '41000000-0000-0000-0000-000000000001'$$,
  '23503', null, 'canonical Customer deletion is restricted by paid projection'
);

-- Timestamp behavior.
update public.billing_trial_grants
set clerk_user_id = clerk_user_id
where id = '42000000-0000-0000-0000-000000000001';

update public.billing_customers
set provisioning_status = provisioning_status
where organization_id = '41000000-0000-0000-0000-000000000001';

update public.billing_subscriptions
set stripe_price_id = stripe_price_id
where organization_id = '41000000-0000-0000-0000-000000000001';

select is(
  (
    select created_at
    from public.billing_trial_grants
    where id = '42000000-0000-0000-0000-000000000001'
  ),
  '2020-01-01 00:00:00+00'::timestamptz,
  'billing_trial_grants update preserves created_at'
);

select ok(
  (
    select updated_at > '2020-01-01 00:00:00+00'::timestamptz
    from public.billing_trial_grants
    where id = '42000000-0000-0000-0000-000000000001'
  ),
  'billing_trial_grants update advances updated_at'
);

select is(
  (
    select created_at
    from public.billing_customers
    where organization_id = '41000000-0000-0000-0000-000000000001'
  ),
  '2020-01-01 00:00:00+00'::timestamptz,
  'billing_customers update preserves created_at'
);

select ok(
  (
    select updated_at > '2020-01-01 00:00:00+00'::timestamptz
    from public.billing_customers
    where organization_id = '41000000-0000-0000-0000-000000000001'
  ),
  'billing_customers update advances updated_at'
);

select is(
  (
    select created_at
    from public.billing_subscriptions
    where organization_id = '41000000-0000-0000-0000-000000000001'
  ),
  '2020-01-01 00:00:00+00'::timestamptz,
  'billing_subscriptions update preserves created_at'
);

select ok(
  (
    select updated_at > '2020-01-01 00:00:00+00'::timestamptz
    from public.billing_subscriptions
    where organization_id = '41000000-0000-0000-0000-000000000001'
  ),
  'billing_subscriptions update advances updated_at'
);

select * from finish();
rollback;
