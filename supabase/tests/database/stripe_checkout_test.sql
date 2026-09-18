begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

select has_table('public', 'billing_checkout_attempts', 'durable Checkout attempts exist');
select columns_are('public','billing_checkout_attempts',array[
  'id','organization_id','plan_code','stripe_price_id','stripe_customer_id','stripe_idempotency_key',
  'stripe_checkout_session_id','state','expires_at','success_url','cancel_url','payment_method_configuration_id',
  'integration_identifier','payload_version','stripe_api_version','livemode','revision','created_at','updated_at','ended_at'
], 'only bounded attempt columns');
select col_type_is('public','billing_checkout_attempts',name,expected,'column type: ' || name)
from (values ('id','uuid'),('organization_id','uuid'),('revision','bigint'),('payload_version','integer'),
  ('livemode','boolean'),('created_at','timestamp with time zone'),('expires_at','timestamp with time zone'),
  ('ended_at','timestamp with time zone'),('state','text')) as t(name,expected);
select ok(relrowsecurity and not relforcerowsecurity,'RLS enabled without FORCE')
from pg_class where oid='public.billing_checkout_attempts'::regclass;
select is((select count(*) from pg_policy where polrelid='public.billing_checkout_attempts'::regclass),0::bigint,'no generic policies');
select ok(not has_table_privilege(r,'public.billing_checkout_attempts',p),r || ' denied ' || p)
from (values ('anon'),('authenticated')) roles(r)
cross join (values ('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER')) privileges(p);
select ok(not has_table_privilege('service_role','public.billing_checkout_attempts',p),'service denied attempt ' || p)
from (values ('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER')) privileges(p);
select ok(has_table_privilege('service_role','public.billing_checkout_attempts','SELECT'),'service scoped recovery reads');
select ok(not has_table_privilege('service_role','public.billing_customers',p),'Customer remains SELECT-only: ' || p)
from (values ('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER')) privileges(p);

create temporary table checkout_functions as
select p.oid,p.proname,p.prosecdef,p.provolatile,p.proowner,p.proconfig,p.proacl,pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in ('claim_billing_customer','finalize_billing_customer',
  'claim_billing_checkout_attempt','reconcile_billing_checkout_attempt','end_billing_checkout_attempt');
select is((select count(*) from checkout_functions),5::bigint,'exactly five narrow RPCs');
select ok(prosecdef and provolatile='v' and proowner='postgres'::regrole and proconfig @> array['search_path=""'],proname || ' reviewed attributes') from checkout_functions;
select ok(not exists(select 1 from aclexplode(proacl) a where a.grantee=0 and a.privilege_type='EXECUTE'),proname || ' PUBLIC denied') from checkout_functions;
select ok(not has_function_privilege(r,oid,'EXECUTE'),proname || ' denied ' || r)
from checkout_functions cross join (values ('anon'),('authenticated')) roles(r);
select ok(has_function_privilege('service_role',oid,'EXECUTE'),proname || ' service execute') from checkout_functions;
select ok(definition !~* '\mexecute\M[[:space:]]+(format|''|\$)' and definition !~* 'billing_trial_grants|public\.stores|stripe_webhook_events',proname || ' static scoped SQL') from checkout_functions;
select ok(not has_function_privilege(r,p.oid,'EXECUTE'),'private helper denied ' || r || ': ' || p.proname)
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
cross join (values ('anon'),('authenticated'),('service_role')) roles(r)
where n.nspname='private' and p.proname in ('guard_billing_checkout_attempt','lock_checkout_organization','checkout_subscription_blocker','lock_billing_checkout_attempt');

insert into public.organizations(id,clerk_organization_id) values
 ('91000000-0000-4000-8000-000000000001','org_checkout_pgtap_a'),
 ('91000000-0000-4000-8000-000000000002','org_checkout_pgtap_b');
create temporary table checkout_customer as select * from public.claim_billing_customer('91000000-0000-4000-8000-000000000001');
select is((select provisioning_status from checkout_customer),'pending','new Customer pending');
select matches((select creation_idempotency_key from checkout_customer),'^deli-plus:customer:v1:','stable scoped Customer key');
select is(pg_catalog.to_jsonb(public.claim_billing_customer('91000000-0000-4000-8000-000000000001')),
  (select to_jsonb(c) from checkout_customer c),'Customer retry is exact no-op');
select throws_ok($$select public.finalize_billing_customer('91000000-0000-4000-8000-000000000001','wrong','cus_checkoutA')$$,
 '22023','Conflicting canonical Customer finalization','wrong claim denied');
select is((public.finalize_billing_customer('91000000-0000-4000-8000-000000000001',
 (select creation_idempotency_key from checkout_customer),'cus_checkoutA')).provisioning_status,'ready','Customer finalized');
create temporary table checkout_ready as select * from public.billing_customers where organization_id='91000000-0000-4000-8000-000000000001';
select is(to_jsonb(public.finalize_billing_customer('91000000-0000-4000-8000-000000000001',
 (select creation_idempotency_key from checkout_customer),'cus_checkoutA')),
 (select to_jsonb(c) from checkout_ready c),'same Customer finalize is exact no-op');
select throws_ok($$select public.finalize_billing_customer('91000000-0000-4000-8000-000000000001',
 (select creation_idempotency_key from checkout_customer),'cus_conflict')$$,'22023','Conflicting canonical Customer finalization','canonical identity cannot change');
select ok((public.claim_billing_customer('91000000-0000-4000-8000-000000000002')).organization_id is not null,'independent Customer claim');
select throws_ok($$select public.finalize_billing_customer('91000000-0000-4000-8000-000000000002',
 (select creation_idempotency_key from public.billing_customers where organization_id='91000000-0000-4000-8000-000000000002'),'cus_checkoutA')$$,
 '23505',null,'Customer cannot belong to two Organizations');
select throws_ok($$select public.claim_billing_checkout_attempt('91000000-0000-4000-8000-000000000002','essential','price_test','cus_checkoutA',
 'https://deli.example/dashboard/billing/success','https://deli.example/dashboard/billing','pmc_test',false)$$,
 '22023','Canonical Customer is not ready','attempt requires own ready Customer');

create temporary table checkout_claim as select * from public.claim_billing_checkout_attempt(
 '91000000-0000-4000-8000-000000000001','essential','price_test','cus_checkoutA',
 'https://deli.example/dashboard/billing/success','https://deli.example/dashboard/billing','pmc_test',false);
select is((select outcome from checkout_claim),'attempt','attempt claimed');
select is((select attempt->>'state' from checkout_claim),'creating','initial state creating');
select is((select attempt->>'stripe_idempotency_key' from checkout_claim),
 'deli-plus:checkout:v1:' || (select attempt->>'id' from checkout_claim),'attempt-specific key');
select isnt((select attempt->>'stripe_idempotency_key' from checkout_claim),
 (select creation_idempotency_key from checkout_customer),'Customer and Checkout key scopes differ');
-- Scope fixture assertions/mutations even when the local database has E2E data.
select ok((select expires_at-created_at between interval '59 minutes' and interval '1 hour' from public.billing_checkout_attempts
 where id=(select (attempt->>'id')::uuid from checkout_claim)),'one-hour frozen expiration');
select is((select attempt from public.claim_billing_checkout_attempt(
 '91000000-0000-4000-8000-000000000001','essential','price_changed','cus_checkoutA',
 'https://preview.example/dashboard/billing/success','https://preview.example/dashboard/billing','pmc_changed',false)),
 (select attempt from checkout_claim),'same-plan retry preserves every snapshot and timestamp');
select is((select outcome from public.claim_billing_checkout_attempt(
 '91000000-0000-4000-8000-000000000001','multi_2','price_duo','cus_checkoutA',
 'https://deli.example/dashboard/billing/success','https://deli.example/dashboard/billing','pmc_test',false)),
 'checkout_in_progress','different plan cannot claim another attempt');
select throws_ok($$insert into public.billing_checkout_attempts select
 gen_random_uuid(),organization_id,'multi_2',stripe_price_id,stripe_customer_id,
 'deli-plus:checkout:v1:' || id::text,null,state,expires_at,success_url,cancel_url,payment_method_configuration_id,
 integration_identifier,payload_version,stripe_api_version,livemode,revision,created_at,updated_at,ended_at
  from public.billing_checkout_attempts where id=(select (attempt->>'id')::uuid from checkout_claim)$$,'23514',null,'key is tied to immutable attempt UUID');
select throws_ok($$update public.billing_checkout_attempts set plan_code='multi_2'
 where id=(select (attempt->>'id')::uuid from checkout_claim)$$,'22023','Invalid Checkout attempt transition','plan snapshot immutable');
select throws_ok($$with candidate as (select gen_random_uuid() id)
 insert into public.billing_checkout_attempts select (jsonb_populate_record(null::public.billing_checkout_attempts,
 to_jsonb(a)||jsonb_build_object('id',c.id,'stripe_idempotency_key','deli-plus:checkout:v1:'||c.id::text,'plan_code','multi_2'))).*
  from public.billing_checkout_attempts a cross join candidate c
  where a.id=(select (attempt->>'id')::uuid from checkout_claim)$$,
 '23505',null,'partial unique index blocks second non-ended intent across plans');
select throws_ok($$update public.billing_checkout_attempts set stripe_idempotency_key='replacement'
 where id=(select (attempt->>'id')::uuid from checkout_claim)$$,'22023','Invalid Checkout attempt transition','key immutable');
select throws_ok($$update public.billing_checkout_attempts set expires_at=expires_at+interval '1 hour'
 where id=(select (attempt->>'id')::uuid from checkout_claim)$$,'22023','Invalid Checkout attempt transition','expiration immutable');
select throws_ok($$update public.billing_checkout_attempts set stripe_price_id='price_other'
 where id=(select (attempt->>'id')::uuid from checkout_claim)$$,'22023','Invalid Checkout attempt transition','Price immutable');
select throws_ok($$update public.billing_checkout_attempts set stripe_customer_id='cus_other'
 where id=(select (attempt->>'id')::uuid from checkout_claim)$$,'22023','Invalid Checkout attempt transition','Customer immutable');
select throws_ok($$update public.billing_checkout_attempts set payment_method_configuration_id='pmc_other'
 where id=(select (attempt->>'id')::uuid from checkout_claim)$$,'22023','Invalid Checkout attempt transition','configuration immutable');
select throws_ok($$delete from public.billing_customers where organization_id='91000000-0000-4000-8000-000000000001'$$,'23503',null,'Customer delete RESTRICT');
select throws_ok($$update public.billing_customers set organization_id='91000000-0000-4000-8000-000000000003'
 where organization_id='91000000-0000-4000-8000-000000000001'$$,'23503',null,'ownership update RESTRICT');

select is((select outcome from public.reconcile_billing_checkout_attempt(
 '91000000-0000-4000-8000-000000000001',(select (attempt->>'id')::uuid from checkout_claim),0,'creating',null,'cs_test_known','open')),
 'attempt','Session attached');
create temporary table checkout_open as select to_jsonb(a) as attempt from public.billing_checkout_attempts a
 where a.id=(select (attempt->>'id')::uuid from checkout_claim);
select is((select attempt from public.reconcile_billing_checkout_attempt(
 '91000000-0000-4000-8000-000000000001',(select (attempt->>'id')::uuid from checkout_claim),0,'creating',null,'cs_test_known','open')),
 (select attempt from checkout_open),'same Session attachment is exact idempotent success');
select throws_ok($$select * from public.reconcile_billing_checkout_attempt(
 '91000000-0000-4000-8000-000000000001',(select (attempt->>'id')::uuid from checkout_claim),1,'open','cs_test_known','cs_test_other','open')$$,
 '22023','Conflicting Checkout Session','different Session rejected');
select throws_ok($$select * from public.reconcile_billing_checkout_attempt(
 '91000000-0000-4000-8000-000000000002',(select (attempt->>'id')::uuid from checkout_claim),1,'open','cs_test_known','cs_test_known','completed')$$,
 'P0002',null,'other Organization cannot attach');
select is((select outcome from public.reconcile_billing_checkout_attempt(
 '91000000-0000-4000-8000-000000000001',(select (attempt->>'id')::uuid from checkout_claim),0,'creating',null,'cs_test_known','completed')),
 'stale','late worker revision rejected');
select throws_ok($$select * from public.end_billing_checkout_attempt(
 '91000000-0000-4000-8000-000000000001',(select (attempt->>'id')::uuid from checkout_claim),1,'open','cs_test_known','open',false,true)$$,
 '22023','Checkout closure lacks terminal evidence','open Session cannot release reservation');
select throws_ok($$select * from public.end_billing_checkout_attempt(
 '91000000-0000-4000-8000-000000000001',(select (attempt->>'id')::uuid from checkout_claim),1,'open','cs_test_known','complete',false,true)$$,
 '22023','Checkout closure lacks terminal evidence','complete requires correlated terminal subscription');
select throws_ok($$select * from public.end_billing_checkout_attempt(
 '91000000-0000-4000-8000-000000000001',(select (attempt->>'id')::uuid from checkout_claim),1,'open','cs_test_known','expired',false,false)$$,
 '22023','Checkout closure lacks terminal evidence','external subscription blocker cannot release');
insert into public.billing_subscriptions(organization_id,stripe_subscription_id,stripe_price_id,plan_code,status,last_synced_at)
 values('91000000-0000-4000-8000-000000000001','sub_checkout','price_test','essential','active',now());
select is((select outcome from public.end_billing_checkout_attempt(
 '91000000-0000-4000-8000-000000000001',(select (attempt->>'id')::uuid from checkout_claim),1,'open','cs_test_known','expired',false,true)),
 'already_subscribed','closure rechecks local subscription guard');
update public.billing_subscriptions set status='canceled' where organization_id='91000000-0000-4000-8000-000000000001';
select is((select attempt->>'state' from public.end_billing_checkout_attempt(
 '91000000-0000-4000-8000-000000000001',(select (attempt->>'id')::uuid from checkout_claim),1,'open','cs_test_known','expired',false,true)),
 'ended','safe terminal evidence releases reservation');
select is((select outcome from public.reconcile_billing_checkout_attempt(
 '91000000-0000-4000-8000-000000000001',(select (attempt->>'id')::uuid from checkout_claim),1,'open','cs_test_known','cs_test_known','completed')),
 'stale','ended attempt cannot be reopened by late response');
select is((select outcome from public.claim_billing_checkout_attempt(
 '91000000-0000-4000-8000-000000000001','multi_2','price_duo','cus_checkoutA',
 'https://deli.example/dashboard/billing/success','https://deli.example/dashboard/billing','pmc_test',false)),
 'attempt','new acquisition after safe closure');
select is((select count(*) from public.billing_checkout_attempts
 where organization_id='91000000-0000-4000-8000-000000000001' and ended_at is null),1::bigint,'one remaining non-ended intent');
select is((select count(*) from public.billing_checkout_attempts
 where organization_id='91000000-0000-4000-8000-000000000001'),2::bigint,'history retained');

set local role authenticated;
select throws_ok($$select public.claim_billing_customer('91000000-0000-4000-8000-000000000001')$$,'42501',null,'authenticated direct RPC denied');
select throws_ok($$select * from public.billing_checkout_attempts$$,'42501',null,'authenticated direct billing reads denied');
select throws_ok($$delete from public.billing_checkout_attempts$$,'42501',null,'authenticated direct billing writes denied');
reset role;
select * from finish();
rollback;
