begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

select has_table('public','billing_subscription_change_attempts','durable scheduled-downgrade attempts exist');
select columns_are('public','billing_subscription_change_attempts',array[
  'id','organization_id','operation_kind','state','source_plan_code','target_plan_code',
  'source_stripe_price_id','target_stripe_price_id','stripe_subscription_id',
  'stripe_subscription_schedule_id','expected_period_end','livemode','stripe_api_version',
  'revision','created_at','updated_at','ended_at'
], 'attempt table stores only bounded coordination facts');
select has_column('public','billing_subscriptions','stripe_subscription_schedule_id','schedule projection exists');
select has_column('public','billing_subscriptions','pending_stripe_price_id','pending Price projection exists');
select has_column('public','billing_subscriptions','pending_plan_code','pending plan projection exists');
select has_column('public','billing_subscriptions','pending_effective_at','pending effective time exists');
select ok(relrowsecurity and not relforcerowsecurity,'attempt RLS enabled without FORCE')
from pg_class where oid='public.billing_subscription_change_attempts'::regclass;
select is((select count(*) from pg_policy where polrelid='public.billing_subscription_change_attempts'::regclass),0::bigint,'attempt table has no broad policy');
select ok(not has_table_privilege(role_name,'public.billing_subscription_change_attempts',privilege),role_name || ' denied ' || privilege)
from (values ('anon'),('authenticated'),('service_role')) roles(role_name)
cross join (values ('INSERT'),('UPDATE'),('DELETE')) privileges(privilege);

select ok(has_function_privilege('service_role','public.claim_billing_subscription_change(uuid,text,text,text,text,text,text,text,timestamptz,boolean)','EXECUTE'),'service can claim through RPC');
select ok(has_function_privilege('service_role','public.advance_billing_subscription_change(uuid,uuid,bigint,text,text,text)','EXECUTE'),'service can advance through CAS RPC');
select hasnt_function('public','end_billing_subscription_change',array['uuid','uuid','bigint','text'],'unused command-ending RPC was removed');
select ok(not has_function_privilege('authenticated','public.claim_billing_subscription_change(uuid,text,text,text,text,text,text,text,timestamptz,boolean)','EXECUTE'),'authenticated cannot claim directly');
select ok(has_function_privilege('authenticated','public.resolve_active_organization_billing_state()','EXECUTE'),'authenticated can read safe state');
select ok(not has_function_privilege('anon','public.resolve_active_organization_billing_state()','EXECUTE'),'anonymous cannot read state');

insert into public.organizations(id,clerk_organization_id)
values ('92000000-0000-4000-8000-000000000001','org_subscription_management');
insert into public.billing_customers(
  organization_id,stripe_customer_id,provisioning_status,creation_idempotency_key,created_at,updated_at
) values (
  '92000000-0000-4000-8000-000000000001','cus_management','ready',
  'deli-plus:customer:v1:92000000-0000-4000-8000-000000000001',now(),now()
);
insert into public.billing_subscriptions(
  organization_id,stripe_subscription_id,stripe_price_id,plan_code,status,current_period_end,last_synced_at
) values (
  '92000000-0000-4000-8000-000000000001','sub_management','price_trio',
  'multi_3','active','2026-10-12T00:00:00Z',now()
);

create temporary table management_claim as
select * from public.claim_billing_subscription_change(
  '92000000-0000-4000-8000-000000000001','schedule_downgrade','multi_3','essential',
  'price_trio','price_essential','sub_management',null,'2026-10-12T00:00:00Z',false
);
select is((select outcome from management_claim),'attempt','downgrade attempt claimed');
select is((select attempt->>'state' from management_claim),'claimed','attempt begins claimed');
select is(
  (select attempt->>'id' from public.claim_billing_subscription_change(
    '92000000-0000-4000-8000-000000000001','schedule_downgrade','multi_3','essential',
    'price_trio','price_essential','sub_management',null,'2026-10-12T00:00:00Z',false
  )),
  (select attempt->>'id' from management_claim),
  'same intent retry returns the durable attempt'
);
select is((select outcome from public.claim_billing_subscription_change(
  '92000000-0000-4000-8000-000000000001','schedule_downgrade','multi_3','multi_2',
  'price_trio','price_duo','sub_management',null,'2026-10-12T00:00:00Z',false
)), 'plan_change_in_progress','different intent cannot replace the open attempt');
select throws_ok($$update public.billing_subscription_change_attempts set target_plan_code='multi_2'
  where organization_id='92000000-0000-4000-8000-000000000001'$$,
  '22023','Invalid subscription-change attempt transition','frozen intent is immutable');
select throws_ok($$update public.billing_subscriptions set
  stripe_subscription_schedule_id='sub_sched_management',pending_plan_code='multi_2'
  where organization_id='92000000-0000-4000-8000-000000000001'$$,
  '23514',null,'partial pending projection is rejected');

insert into public.organizations(id,clerk_organization_id) values
  ('92000000-0000-4000-8000-000000000002','org_subscription_management_b'),
  ('92000000-0000-4000-8000-000000000003','org_subscription_management_c');
insert into public.billing_customers(
  organization_id,stripe_customer_id,provisioning_status,creation_idempotency_key,created_at,updated_at
) values
  ('92000000-0000-4000-8000-000000000002','cus_management_b','ready','deli-plus:customer:v1:92000000-0000-4000-8000-000000000002',now(),now()),
  ('92000000-0000-4000-8000-000000000003','cus_management_c','ready','deli-plus:customer:v1:92000000-0000-4000-8000-000000000003',now(),now());
insert into public.billing_subscriptions(
  organization_id,stripe_subscription_id,stripe_price_id,plan_code,status,current_period_end,last_synced_at
) values
  ('92000000-0000-4000-8000-000000000002','sub_management_b','price_trio','multi_3','active','2026-10-12T00:00:00Z',now()),
  ('92000000-0000-4000-8000-000000000003','sub_managementc','price_trioc','multi_3','active','2026-10-12T00:00:00Z',now());
select is((select num_nulls(stripe_subscription_schedule_id,pending_stripe_price_id,pending_plan_code,pending_effective_at)
  from public.billing_subscriptions where organization_id='92000000-0000-4000-8000-000000000003'),4,'existing/current-only insert defaults to no pending change');
select throws_ok($$update public.billing_subscriptions set
  stripe_subscription_schedule_id='sub_sched_invalid',pending_stripe_price_id='price_bad',
  pending_plan_code='unknown',pending_effective_at=current_period_end
  where organization_id='92000000-0000-4000-8000-000000000002'$$,
  '23514',null,'unknown pending PlanCode rejected');
update public.billing_subscriptions set
  stripe_subscription_schedule_id='sub_sched_unique',pending_stripe_price_id='price_essential',
  pending_plan_code='essential',pending_effective_at=current_period_end
where organization_id='92000000-0000-4000-8000-000000000002';
select throws_ok($$update public.billing_subscriptions set
  stripe_subscription_schedule_id='sub_sched_unique',pending_stripe_price_id='price_essentialc',
  pending_plan_code='essential',pending_effective_at=current_period_end
  where organization_id='92000000-0000-4000-8000-000000000003'$$,
  '23505',null,'Schedule identity is globally unique');
select throws_ok($$update public.billing_subscriptions set
  stripe_subscription_schedule_id='sub_sched_wrong_date',pending_stripe_price_id='price_essentialc',
  pending_plan_code='essential',pending_effective_at=current_period_end + interval '1 day'
  where organization_id='92000000-0000-4000-8000-000000000003'$$,
  '23514',null,'pending effective time must equal current period end');

create temporary table downgrade_claim as
select * from public.claim_billing_subscription_change(
  '92000000-0000-4000-8000-000000000003','schedule_downgrade','multi_3','essential',
  'price_trioc','price_essentialc','sub_managementc',null,'2026-10-12T00:00:00Z',false
);
create temporary table downgrade_schedule_recorded as
select * from public.advance_billing_subscription_change(
  '92000000-0000-4000-8000-000000000003',
  (select (attempt->>'id')::uuid from downgrade_claim),0,'claimed',
  'sub_sched_recovered','provider_object_created'
);
select is(
  (select attempt->>'id' from public.claim_billing_subscription_change(
    '92000000-0000-4000-8000-000000000003','schedule_downgrade','multi_3','essential',
    'price_trioc','price_essentialc','sub_managementc',null,'2026-10-12T00:00:00Z',false
  )),
  (select attempt->>'id' from downgrade_schedule_recorded),
  'retry reuses the frozen downgrade attempt after Schedule identity is recorded'
);
select is(
  (select attempt->>'stripe_subscription_schedule_id' from public.claim_billing_subscription_change(
    '92000000-0000-4000-8000-000000000003','schedule_downgrade','multi_3','essential',
    'price_trioc','price_essentialc','sub_managementc',null,'2026-10-12T00:00:00Z',false
  )),
  'sub_sched_recovered',
  'retry retains the already-created Schedule instead of creating another'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"management_member","o":{"id":"org_subscription_management_b","rol":"member"}}';
select results_eq(
  $$select plan_code,status,pending_plan_code,pending_effective_at from public.resolve_active_organization_billing_state()$$,
  $$values ('multi_3'::text,'active'::text,'essential'::text,'2026-10-12T00:00:00Z'::timestamptz)$$,
  'member sees only safe state for the active Organization'
);
select is(
  (select subscription_plan_code from public.resolve_active_organization_entitlement_facts()),
  'multi_3',
  'scheduled downgrade leaves current paid entitlement unchanged'
);
set local request.jwt.claims = '{"sub":"management_member","o":{"id":"org_subscription_management_c","rol":"member"}}';
select is((select pending_plan_code from public.resolve_active_organization_billing_state()),null,'active tenant cannot see another tenant pending plan');
reset role;

create temporary table downgrade_recovery as
select * from public.advance_billing_subscription_change(
  '92000000-0000-4000-8000-000000000003',
  (select (attempt->>'id')::uuid from downgrade_schedule_recorded),1,'provider_object_created',
  'sub_sched_recovered','recovery_required'
);
select is((select attempt->>'state' from downgrade_recovery),'recovery_required','lost-webhook attempt is explicitly recoverable');
select is(public.apply_stripe_subscription_management_projection(
  'evt_internal_recovery_92000000000040008000000000000003',
  'subscription_schedule.updated','sub_sched_recovered',false,'2026-09-12T00:01:00Z',
  'cus_management_c','sub_managementc','price_trioc','multi_3','active',
  '2026-10-12T00:00:00Z',false,false,'sub_sched_recovered',
  'price_essentialc','essential','2026-10-12T00:00:00Z'
),'applied','canonical read repair uses the atomic projection boundary');
select results_eq(
  $$select plan_code,stripe_price_id,stripe_subscription_schedule_id,pending_plan_code,pending_stripe_price_id,pending_effective_at
    from public.billing_subscriptions where organization_id='92000000-0000-4000-8000-000000000003'$$,
  $$values ('multi_3'::text,'price_trioc'::text,'sub_sched_recovered'::text,'essential'::text,'price_essentialc'::text,'2026-10-12T00:00:00Z'::timestamptz)$$,
  'read repair preserves Trio current and projects Essential pending'
);
select is(
  (select state from public.billing_subscription_change_attempts
    where organization_id='92000000-0000-4000-8000-000000000003'),
  'ended','atomic read repair resolves the durable attempt'
);

select * from finish();
rollback;
