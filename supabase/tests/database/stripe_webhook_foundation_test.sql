begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select no_plan();

insert into public.organizations (id, clerk_organization_id)
values
  ('51000000-0000-0000-0000-000000000001', 'webhook_org_a'),
  ('51000000-0000-0000-0000-000000000002', 'webhook_org_retry');

insert into public.billing_customers (
  organization_id,
  stripe_customer_id,
  provisioning_status,
  creation_idempotency_key
)
values (
  '51000000-0000-0000-0000-000000000001',
  'cus_webhook_a',
  'ready',
  'idem_webhook_a'
);

insert into public.billing_trial_grants (
  organization_id,
  clerk_user_id,
  grant_kind,
  plan_code,
  starts_at,
  ends_at
)
values (
  '51000000-0000-0000-0000-000000000001',
  'user_webhook_trial',
  'manual_override',
  'essential',
  '2026-08-25 00:00:00+00',
  '2026-08-26 00:00:00+00'
);

select has_function(
  'public',
  'apply_stripe_subscription_projection',
  array[
    'text',
    'text',
    'text',
    'boolean',
    'timestamp with time zone',
    'text',
    'text',
    'text',
    'text',
    'text',
    'timestamp with time zone',
    'boolean',
    'boolean'
  ],
  'atomic Stripe webhook projection function exists'
);

select ok(
  not function.prosecdef
  and function.provolatile = 'v'
  and function.proconfig @> array['search_path=""']::text[],
  'projection function is volatile SECURITY INVOKER with an empty search_path'
)
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
where namespace.nspname = 'public'
  and function.proname = 'apply_stripe_subscription_projection';

select ok(
  position('pg_advisory_xact_lock' in function.prosrc) > 0,
  'projection function serializes canonical writes per Organization'
)
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
where namespace.nspname = 'public'
  and function.proname = 'apply_stripe_subscription_projection';

select ok(
  has_function_privilege(
    'service_role',
    'public.apply_stripe_subscription_projection(text,text,text,boolean,timestamptz,text,text,text,text,text,timestamptz,boolean,boolean)',
    'EXECUTE'
  ),
  'service_role can execute the narrow projection function'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.apply_stripe_subscription_projection(text,text,text,boolean,timestamptz,text,text,text,text,text,timestamptz,boolean,boolean)',
    'EXECUTE'
  ),
  'anon cannot execute the projection function'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.apply_stripe_subscription_projection(text,text,text,boolean,timestamptz,text,text,text,text,text,timestamptz,boolean,boolean)',
    'EXECUTE'
  ),
  'authenticated cannot execute the projection function'
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
      and function.proname = 'apply_stripe_subscription_projection'
      and privilege.grantee = 0
      and privilege.privilege_type = 'EXECUTE'
  ),
  'PUBLIC has no EXECUTE privilege on the projection function'
);

select ok(
  has_table_privilege('service_role', 'public.billing_customers', 'SELECT')
  and not has_table_privilege(
    'service_role',
    'public.billing_customers',
    'INSERT'
  )
  and not has_table_privilege(
    'service_role',
    'public.billing_customers',
    'UPDATE'
  )
  and not has_table_privilege(
    'service_role',
    'public.billing_customers',
    'DELETE'
  ),
  'webhook service_role has read-only canonical Customer access'
);

select ok(
  has_table_privilege(
    'service_role',
    'public.billing_subscriptions',
    'SELECT'
  )
  and has_table_privilege(
    'service_role',
    'public.billing_subscriptions',
    'INSERT'
  )
  and has_table_privilege(
    'service_role',
    'public.billing_subscriptions',
    'UPDATE'
  )
  and not has_table_privilege(
    'service_role',
    'public.billing_subscriptions',
    'DELETE'
  )
  and not has_table_privilege(
    'service_role',
    'public.billing_subscriptions',
    'TRUNCATE'
  ),
  'webhook service_role has only required paid projection privileges'
);

select ok(
  has_table_privilege(
    'service_role',
    'public.stripe_webhook_events',
    'SELECT'
  )
  and has_table_privilege(
    'service_role',
    'public.stripe_webhook_events',
    'INSERT'
  )
  and has_table_privilege(
    'service_role',
    'public.stripe_webhook_events',
    'UPDATE'
  )
  and not has_table_privilege(
    'service_role',
    'public.stripe_webhook_events',
    'DELETE'
  )
  and not has_table_privilege(
    'service_role',
    'public.stripe_webhook_events',
    'TRUNCATE'
  ),
  'webhook service_role has only required Event ledger privileges'
);

set local role anon;
select throws_ok(
  $$select public.apply_stripe_subscription_projection('evt_anon', 'customer.subscription.updated', 'sub_anon', false, now(), 'cus_anon', 'sub_anon', 'price_anon', 'essential', 'active', now(), false, false)$$,
  '42501',
  null,
  'anon execution is denied by PostgreSQL'
);
reset role;

set local role authenticated;
select throws_ok(
  $$select public.apply_stripe_subscription_projection('evt_authenticated', 'customer.subscription.updated', 'sub_authenticated', false, now(), 'cus_authenticated', 'sub_authenticated', 'price_authenticated', 'essential', 'active', now(), false, false)$$,
  '42501',
  null,
  'authenticated execution is denied by PostgreSQL'
);
reset role;

set local role service_role;
select is(
  public.apply_stripe_subscription_projection(
    'evt_webhook_1',
    'customer.subscription.created',
    'sub_webhook_a',
    false,
    '2026-08-25 10:00:00+00',
    'cus_webhook_a',
    'sub_webhook_a',
    'price_webhook_essential',
    'essential',
    'active',
    '2026-09-25 10:00:00+00',
    false,
    false
  ),
  'applied',
  'service_role applies the first canonical projection'
);
reset role;

select is(
  (
    select concat_ws(
      '|',
      organization_id,
      stripe_subscription_id,
      stripe_price_id,
      plan_code,
      status,
      cancel_at_period_end,
      collection_paused
    )
    from public.billing_subscriptions
    where organization_id = '51000000-0000-0000-0000-000000000001'
  ),
  '51000000-0000-0000-0000-000000000001|sub_webhook_a|price_webhook_essential|essential|active|f|f',
  'canonical Customer resolves the correct Organization projection'
);

select ok(
  (
    select processed_at is not null
      and event_type = 'customer.subscription.created'
      and stripe_object_id = 'sub_webhook_a'
      and not livemode
    from public.stripe_webhook_events
    where stripe_event_id = 'evt_webhook_1'
  ),
  'successful processing atomically records minimum Event metadata'
);

create temporary table webhook_projection_snapshot as
select last_synced_at, updated_at
from public.billing_subscriptions
where organization_id = '51000000-0000-0000-0000-000000000001';

select is(
  public.apply_stripe_subscription_projection(
    'evt_webhook_1',
    'customer.subscription.created',
    'sub_webhook_a',
    false,
    '2026-08-25 10:00:00+00',
    'cus_webhook_a',
    'sub_webhook_a',
    'price_webhook_essential',
    'essential',
    'active',
    '2026-09-25 10:00:00+00',
    false,
    false
  ),
  'duplicate',
  'same Stripe Event ID is a successful duplicate no-op'
);

select ok(
  subscription.last_synced_at = snapshot.last_synced_at
  and subscription.updated_at = snapshot.updated_at,
  'duplicate Event does not mutate the paid projection'
)
from public.billing_subscriptions as subscription
cross join webhook_projection_snapshot as snapshot
where subscription.organization_id =
  '51000000-0000-0000-0000-000000000001';

select is(
  public.apply_stripe_subscription_projection(
    'evt_webhook_2',
    'invoice.paid',
    'in_webhook_2',
    false,
    '2026-08-25 10:01:00+00',
    'cus_webhook_a',
    'sub_webhook_a',
    'price_webhook_essential',
    'essential',
    'active',
    '2026-09-25 10:00:00+00',
    false,
    false
  ),
  'applied',
  'different Event ID with the same current snapshot is idempotently applied'
);

select is(
  (
    select count(*)
    from public.stripe_webhook_events
    where stripe_event_id in ('evt_webhook_1', 'evt_webhook_2')
      and processed_at is not null
  ),
  2::bigint,
  'different reconciled Events are each durably processed once'
);

select is(
  public.apply_stripe_subscription_projection(
    'evt_webhook_past_due_1',
    'invoice.payment_failed',
    'in_webhook_past_due_1',
    false,
    '2026-08-25 10:02:00+00',
    'cus_webhook_a',
    'sub_webhook_a',
    'price_webhook_essential',
    'essential',
    'past_due',
    '2026-09-25 10:00:00+00',
    false,
    false
  ),
  'applied',
  'entering past_due applies successfully'
);

select ok(
  (
    select past_due_since is not null
    from public.billing_subscriptions
    where organization_id = '51000000-0000-0000-0000-000000000001'
  ),
  'entering past_due sets past_due_since from the database clock'
);

create temporary table webhook_past_due_snapshot as
select past_due_since
from public.billing_subscriptions
where organization_id = '51000000-0000-0000-0000-000000000001';

select is(
  public.apply_stripe_subscription_projection(
    'evt_webhook_past_due_2',
    'customer.subscription.updated',
    'sub_webhook_a',
    false,
    '2026-08-25 10:03:00+00',
    'cus_webhook_a',
    'sub_webhook_a',
    'price_webhook_essential',
    'essential',
    'past_due',
    '2026-09-25 10:00:00+00',
    false,
    false
  ),
  'applied',
  'repeated past_due reconciliation applies successfully'
);

select is(
  subscription.past_due_since,
  snapshot.past_due_since,
  'repeated past_due preserves the first transition timestamp'
)
from public.billing_subscriptions as subscription
cross join webhook_past_due_snapshot as snapshot
where subscription.organization_id =
  '51000000-0000-0000-0000-000000000001';

select is(
  public.apply_stripe_subscription_projection(
    'evt_webhook_recovered',
    'invoice.paid',
    'in_webhook_recovered',
    false,
    '2026-08-25 10:04:00+00',
    'cus_webhook_a',
    'sub_webhook_a',
    'price_webhook_essential',
    'essential',
    'active',
    '2026-09-25 10:00:00+00',
    true,
    true
  ),
  'applied',
  'leaving past_due applies the current canonical snapshot'
);

select ok(
  (
    select past_due_since is null
      and cancel_at_period_end
      and collection_paused
    from public.billing_subscriptions
    where organization_id = '51000000-0000-0000-0000-000000000001'
  ),
  'leaving past_due clears recovery time and persists cancellation/pause flags faithfully'
);

select throws_ok(
  $$select public.apply_stripe_subscription_projection('evt_webhook_invalid_plan', 'customer.subscription.updated', 'sub_webhook_a', false, now(), 'cus_webhook_a', 'sub_webhook_a', 'price_unknown', 'multi_4', 'active', now(), false, false)$$,
  '22023',
  'Invalid Stripe webhook projection input',
  'unknown plan input fails closed'
);

select is(
  (
    select count(*)
    from public.stripe_webhook_events
    where stripe_event_id = 'evt_webhook_invalid_plan'
  ),
  0::bigint,
  'invalid input does not leave a processed ledger row'
);

select throws_ok(
  $$select public.apply_stripe_subscription_projection('evt_webhook_retry', 'customer.subscription.created', 'sub_webhook_retry', false, '2026-08-25 11:00:00+00', 'cus_webhook_retry', 'sub_webhook_retry', 'price_webhook_multi_2', 'multi_2', 'active', '2026-09-25 11:00:00+00', false, false)$$,
  'P0001',
  'Canonical Stripe Customer not found',
  'unknown canonical Customer rejects processing'
);

select is(
  (
    select count(*)
    from public.stripe_webhook_events
    where stripe_event_id = 'evt_webhook_retry'
  ),
  0::bigint,
  'failed processing rolls back the Event claim and remains retryable'
);

insert into public.billing_customers (
  organization_id,
  stripe_customer_id,
  provisioning_status,
  creation_idempotency_key
)
values (
  '51000000-0000-0000-0000-000000000002',
  'cus_webhook_retry',
  'ready',
  'idem_webhook_retry'
);

select is(
  public.apply_stripe_subscription_projection(
    'evt_webhook_retry',
    'customer.subscription.created',
    'sub_webhook_retry',
    false,
    '2026-08-25 11:00:00+00',
    'cus_webhook_retry',
    'sub_webhook_retry',
    'price_webhook_multi_2',
    'multi_2',
    'active',
    '2026-09-25 11:00:00+00',
    false,
    false
  ),
  'applied',
  'the same Event succeeds after its retryable dependency is repaired'
);

select ok(
  (
    select processed_at is not null
    from public.stripe_webhook_events
    where stripe_event_id = 'evt_webhook_retry'
  ),
  'successful retry atomically marks the Event processed'
);

select throws_ok(
  $$select public.apply_stripe_subscription_projection('evt_webhook_non_canonical', 'customer.subscription.created', 'sub_webhook_b', false, '2026-08-25 12:00:00+00', 'cus_webhook_a', 'sub_webhook_b', 'price_webhook_multi_3', 'multi_3', 'active', '2026-09-25 12:00:00+00', false, false)$$,
  'P0001',
  'Conflicting non-terminal Stripe Subscriptions',
  'a second non-terminal Subscription conflicts retryably with the canonical projection'
);

select is(
  (
    select stripe_subscription_id
    from public.billing_subscriptions
    where organization_id = '51000000-0000-0000-0000-000000000001'
  ),
  'sub_webhook_a',
  'conflicting Event leaves the canonical Subscription unchanged'
);

select is(
  (
    select count(*)
    from public.stripe_webhook_events
    where stripe_event_id = 'evt_webhook_non_canonical'
  ),
  0::bigint,
  'conflicting non-terminal Event remains retryable'
);

select is(
  public.apply_stripe_subscription_projection(
    'evt_webhook_canceled',
    'customer.subscription.deleted',
    'sub_webhook_a',
    false,
    '2026-08-25 12:01:00+00',
    'cus_webhook_a',
    'sub_webhook_a',
    'price_webhook_essential',
    'essential',
    'canceled',
    '2026-09-25 12:00:00+00',
    false,
    false
  ),
  'applied',
  'canonical Subscription can reconcile to a terminal state'
);

select is(
  public.apply_stripe_subscription_projection(
    'evt_webhook_non_canonical',
    'customer.subscription.created',
    'sub_webhook_b',
    false,
    '2026-08-25 12:02:00+00',
    'cus_webhook_a',
    'sub_webhook_b',
    'price_webhook_multi_3',
    'multi_3',
    'active',
    '2026-09-25 12:00:00+00',
    false,
    false
  ),
  'applied',
  'the retried non-terminal Subscription may replace a terminal canonical projection'
);

select is(
  (
    select concat_ws('|', stripe_subscription_id, plan_code, status)
    from public.billing_subscriptions
    where organization_id = '51000000-0000-0000-0000-000000000001'
  ),
  'sub_webhook_b|multi_3|active',
  'replacement becomes the one current canonical paid projection'
);

select is(
  public.apply_stripe_subscription_projection(
    'evt_webhook_stale_old',
    'customer.subscription.deleted',
    'sub_webhook_a',
    false,
    '2026-08-25 12:03:00+00',
    'cus_webhook_a',
    'sub_webhook_a',
    'price_webhook_essential',
    'essential',
    'canceled',
    '2026-09-25 12:00:00+00',
    false,
    false
  ),
  'ignored_non_canonical',
  'a stale replaced Subscription Event is safely acknowledged'
);

select is(
  (
    select concat_ws('|', stripe_subscription_id, plan_code, status)
    from public.billing_subscriptions
    where organization_id = '51000000-0000-0000-0000-000000000001'
  ),
  'sub_webhook_b|multi_3|active',
  'stale replaced Subscription cannot overwrite the canonical projection'
);

select is(
  (
    select count(*)
    from public.billing_trial_grants
    where organization_id = '51000000-0000-0000-0000-000000000001'
      and clerk_user_id = 'user_webhook_trial'
  ),
  1::bigint,
  'paid webhook processing never mutates local trial grants'
);

select * from finish();
rollback;
