begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select no_plan();

create temporary table store_setup_billing_snapshot as
select
  (select count(*) from public.billing_trial_grants) as trial_grants,
  (select count(*) from public.billing_customers) as billing_customers,
  (select count(*) from public.billing_subscriptions) as billing_subscriptions,
  (select count(*) from public.stripe_webhook_events) as webhook_events;

-- Schema and lifecycle security.
select has_column(
  'public',
  'stores',
  'activated_at',
  'stores has an activation timestamp'
);

select is(
  (
    select data_type
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'stores'
      and column_name = 'activated_at'
  ),
  'timestamp with time zone',
  'activated_at uses timestamptz'
);

select is(
  (
    select is_nullable
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'stores'
      and column_name = 'activated_at'
  ),
  'YES',
  'activated_at is nullable'
);

select is(
  (
    select column_default
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'stores'
      and column_name = 'activated_at'
  ),
  null,
  'activated_at has no default'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.stores'::regclass
      and conname = 'stores_status_check'
      and pg_catalog.pg_get_constraintdef(oid) like '%draft%'
      and pg_catalog.pg_get_constraintdef(oid) like '%ready%'
      and pg_catalog.pg_get_constraintdef(oid) like '%active%'
      and pg_catalog.pg_get_constraintdef(oid) like '%inactive%'
  ),
  'status constraint contains the four lifecycle states'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.stores'::regclass
      and conname = 'stores_status_activated_at_check'
  ),
  'status and activated_at consistency constraint exists'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.stores'::regclass
      and conname = 'stores_name_not_blank_check'
  ),
  'non-blank Store name constraint exists'
);

select has_trigger(
  'public',
  'stores',
  'stores_enforce_lifecycle',
  'Store lifecycle trigger exists'
);

select ok(
  (
    select pg_catalog.pg_get_triggerdef(trigger.oid)
      like '%BEFORE INSERT OR UPDATE ON public.stores%'
    from pg_catalog.pg_trigger as trigger
    join pg_catalog.pg_class as relation
      on relation.oid = trigger.tgrelid
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname = 'stores'
      and trigger.tgname = 'stores_enforce_lifecycle'
      and not trigger.tgisinternal
  ),
  'lifecycle trigger runs before Store inserts and updates'
);

select ok(
  not function.prosecdef
  and function.proconfig @> array['search_path=""']::text[],
  'lifecycle function is SECURITY INVOKER with an empty search_path'
)
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
where namespace.nspname = 'private'
  and function.proname = 'enforce_store_lifecycle';

select ok(
  not has_function_privilege(
    'authenticated',
    'private.enforce_store_lifecycle()',
    'EXECUTE'
  )
  and not has_function_privilege(
    'anon',
    'private.enforce_store_lifecycle()',
    'EXECUTE'
  )
  and not has_function_privilege(
    'service_role',
    'private.enforce_store_lifecycle()',
    'EXECUTE'
  ),
  'lifecycle function is not directly executable by API roles'
);

select has_trigger(
  'public',
  'stores',
  'stores_set_row_timestamps',
  'existing Store timestamp trigger remains installed'
);

select ok(
  relation.relrowsecurity and not relation.relforcerowsecurity,
  'stores keeps RLS enabled without FORCE RLS'
)
from pg_catalog.pg_class as relation
join pg_catalog.pg_namespace as namespace
  on namespace.oid = relation.relnamespace
where namespace.nspname = 'public'
  and relation.relname = 'stores';

select is(
  (
    select jsonb_agg(policyname order by policyname)
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'stores'
  ),
  '["stores_select_active_organization_admin", "stores_select_assigned_organization_member"]'::jsonb,
  'Store SELECT policies remain unchanged'
);

select ok(
  has_table_privilege('authenticated', 'public.stores', 'SELECT')
  and not has_table_privilege('authenticated', 'public.stores', 'INSERT')
  and not has_table_privilege('authenticated', 'public.stores', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.stores', 'DELETE')
  and not has_table_privilege('authenticated', 'public.stores', 'TRUNCATE'),
  'authenticated remains SELECT-only on stores'
);

select ok(
  not has_table_privilege('anon', 'public.stores', 'SELECT')
  and not has_table_privilege('anon', 'public.stores', 'INSERT')
  and not has_table_privilege('anon', 'public.stores', 'UPDATE')
  and not has_table_privilege('anon', 'public.stores', 'DELETE')
  and not has_table_privilege('anon', 'public.stores', 'TRUNCATE'),
  'anon remains denied on stores'
);

select has_function(
  'public',
  'create_store_draft',
  array['uuid', 'text', 'text'],
  'trusted draft creation RPC has the expected signature'
);

select has_function(
  'public',
  'update_store_setup',
  array[
    'uuid',
    'uuid',
    'timestamptz',
    'boolean',
    'text',
    'boolean',
    'text'
  ],
  'trusted Store setup update RPC has the expected signature'
);

select has_function(
  'public',
  'mark_store_ready',
  array['uuid', 'uuid', 'timestamptz'],
  'trusted Store readiness RPC has the expected signature'
);

create temporary table store_setup_trusted_functions as
select
  function.oid,
  function.proname,
  function.prosecdef,
  function.provolatile,
  function.proowner,
  function.proconfig,
  function.proacl,
  pg_catalog.pg_get_functiondef(function.oid) as definition
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
where namespace.nspname = 'public'
  and function.proname in (
    'create_store_draft',
    'update_store_setup',
    'mark_store_ready'
  );

select is(
  (select count(*) from store_setup_trusted_functions),
  3::bigint,
  'exactly three trusted Store setup RPCs exist'
);

select ok(
  prosecdef
    and provolatile = 'v'
    and proowner = 'postgres'::pg_catalog.regrole
    and proconfig @> array['search_path=""'],
  proname || ' is VOLATILE SECURITY DEFINER owned by postgres with empty search_path'
)
from store_setup_trusted_functions
order by proname;

select ok(
  definition ~* 'public\.stores'
    and definition !~* 'billing_|stripe|activate_store|execute[[:space:]]',
  proname || ' uses static Store-only SQL'
)
from store_setup_trusted_functions
order by proname;

select ok(
  not exists (
    select 1
    from pg_catalog.aclexplode(proacl) as acl
    where acl.grantee = 0
      and acl.privilege_type = 'EXECUTE'
  )
    and not has_function_privilege('anon', oid, 'EXECUTE')
    and not has_function_privilege('authenticated', oid, 'EXECUTE')
    and has_function_privilege('service_role', oid, 'EXECUTE'),
  proname || ' is executable only by service_role among Data API roles'
)
from store_setup_trusted_functions
order by proname;

select ok(
  not has_table_privilege('service_role', 'public.stores', privilege),
  'service_role has no direct stores ' || privilege
)
from (
  values
    ('SELECT'),
    ('INSERT'),
    ('UPDATE'),
    ('DELETE'),
    ('TRUNCATE'),
    ('REFERENCES'),
    ('TRIGGER')
) as denied(privilege);

select is(
  (
    select count(*)
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'stores'
      and cmd <> 'SELECT'
  ),
  0::bigint,
  'no Store mutation policy was added'
);

insert into public.organizations (id, clerk_organization_id)
values
  ('51000000-0000-0000-0000-000000000001', 'store_setup_org_a'),
  ('51000000-0000-0000-0000-000000000002', 'store_setup_org_b');

set local role anon;

select throws_ok(
  $$select * from public.create_store_draft('51000000-0000-0000-0000-000000000001', 'Anon Store', 'anon-store')$$,
  '42501', null, 'anon cannot invoke trusted draft creation'
);

reset role;
set local role authenticated;

select throws_ok(
  $$select * from public.mark_store_ready('51000000-0000-0000-0000-000000000001', '52000000-0000-0000-0000-000000000001', now())$$,
  '42501', null, 'authenticated cannot invoke trusted Store readiness'
);

reset role;
set local role service_role;

select is(
  (
    select jsonb_build_object(
      'name', name,
      'slug', slug,
      'status', status,
      'activated_at', activated_at
    )
    from public.create_store_draft(
      '51000000-0000-0000-0000-000000000001',
      'RPC Draft',
      'rpc-draft'
    )
  ),
  jsonb_build_object(
    'name', 'RPC Draft',
    'slug', 'rpc-draft',
    'status', 'draft',
    'activated_at', null
  ),
  'trusted creation returns only an unactivated draft'
);

reset role;

select pg_catalog.set_config(
  'test.store_setup_rpc_id',
  (select id::text from public.stores where slug = 'rpc-draft'),
  false
);

select pg_catalog.set_config(
  'test.store_setup_rpc_updated_at',
  (select updated_at::text from public.stores where slug = 'rpc-draft'),
  false
);

select is(
  (
    select organization_id
    from public.stores
    where id = pg_catalog.current_setting('test.store_setup_rpc_id')::uuid
  ),
  '51000000-0000-0000-0000-000000000001'::uuid,
  'trusted creation preserves the authorized Organization owner'
);

set local role service_role;

select is(
  (
    select jsonb_build_object('name', name, 'slug', slug, 'status', status)
    from public.update_store_setup(
      '51000000-0000-0000-0000-000000000001',
      pg_catalog.current_setting('test.store_setup_rpc_id')::uuid,
      pg_catalog.current_setting('test.store_setup_rpc_updated_at')::timestamptz,
      true,
      'RPC Updated',
      true,
      'rpc-updated'
    )
  ),
  jsonb_build_object(
    'name', 'RPC Updated',
    'slug', 'rpc-updated',
    'status', 'draft'
  ),
  'trusted setup update changes only supported setup fields'
);

reset role;

select pg_catalog.set_config(
  'test.store_setup_rpc_updated_at',
  (
    select updated_at::text
    from public.stores
    where id = pg_catalog.current_setting('test.store_setup_rpc_id')::uuid
  ),
  false
);

set local role service_role;

select is(
  (
    select status
    from public.mark_store_ready(
      '51000000-0000-0000-0000-000000000001',
      pg_catalog.current_setting('test.store_setup_rpc_id')::uuid,
      pg_catalog.current_setting('test.store_setup_rpc_updated_at')::timestamptz
    )
  ),
  'ready',
  'trusted readiness performs only draft to ready'
);

reset role;

select pg_catalog.set_config(
  'test.store_setup_rpc_updated_at',
  (
    select updated_at::text
    from public.stores
    where id = pg_catalog.current_setting('test.store_setup_rpc_id')::uuid
  ),
  false
);

set local role service_role;

select is(
  (
    select status
    from public.update_store_setup(
      '51000000-0000-0000-0000-000000000001',
      pg_catalog.current_setting('test.store_setup_rpc_id')::uuid,
      pg_catalog.current_setting('test.store_setup_rpc_updated_at')::timestamptz,
      true,
      'RPC Ready Edited',
      false,
      ''
    )
  ),
  'draft',
  'material setup edits return a ready Store to draft'
);

reset role;

select pg_catalog.set_config(
  'test.store_setup_rpc_updated_at',
  (
    select updated_at::text
    from public.stores
    where id = pg_catalog.current_setting('test.store_setup_rpc_id')::uuid
  ),
  false
);

set local role service_role;

select is(
  (
    select count(*)
    from public.update_store_setup(
      '51000000-0000-0000-0000-000000000002',
      pg_catalog.current_setting('test.store_setup_rpc_id')::uuid,
      pg_catalog.current_setting('test.store_setup_rpc_updated_at')::timestamptz,
      true,
      'Cross Tenant',
      false,
      ''
    )
  ),
  0::bigint,
  'trusted setup update cannot cross Organization ownership'
);

select throws_ok(
  $$select * from public.create_store_draft('51000000-0000-0000-0000-000000000002', 'Duplicate RPC Slug', 'rpc-updated')$$,
  '23505', null, 'trusted creation preserves global slug uniqueness'
);

select throws_ok(
  $$select * from public.stores$$,
  '42501', null, 'service_role cannot read Stores directly'
);

select throws_ok(
  $$insert into public.stores (organization_id, name, slug) values ('51000000-0000-0000-0000-000000000001', 'Direct Store', 'direct-store')$$,
  '42501', null, 'service_role cannot insert Stores directly'
);

select throws_ok(
  $$update public.stores set name = 'Direct Update'$$,
  '42501', null, 'service_role cannot update Stores directly'
);

select throws_ok(
  $$delete from public.stores$$,
  '42501', null, 'service_role cannot delete Stores directly'
);

select throws_ok(
  $$truncate table public.stores$$,
  '42501', null, 'service_role cannot truncate Stores directly'
);

reset role;

insert into public.stores (id, organization_id, name, slug)
values
  (
    '52000000-0000-0000-0000-000000000001',
    '51000000-0000-0000-0000-000000000001',
    'Setup A Draft',
    'setup-a-draft'
  ),
  (
    '52000000-0000-0000-0000-000000000002',
    '51000000-0000-0000-0000-000000000001',
    'Setup A Ready',
    'setup-a-ready'
  ),
  (
    '52000000-0000-0000-0000-000000000003',
    '51000000-0000-0000-0000-000000000001',
    'Setup A Active',
    'setup-a-active'
  ),
  (
    '52000000-0000-0000-0000-000000000004',
    '51000000-0000-0000-0000-000000000001',
    'Setup A Inactive',
    'setup-a-inactive'
  ),
  (
    '52000000-0000-0000-0000-000000000005',
    '51000000-0000-0000-0000-000000000002',
    'Setup B Draft',
    'setup-b-draft'
  );

update public.stores
set status = 'ready'
where id in (
  '52000000-0000-0000-0000-000000000002',
  '52000000-0000-0000-0000-000000000003',
  '52000000-0000-0000-0000-000000000004'
);

update public.stores
set
  status = 'active',
  activated_at = '2026-08-27 12:00:00+00'
where id in (
  '52000000-0000-0000-0000-000000000003',
  '52000000-0000-0000-0000-000000000004'
);

update public.stores
set status = 'inactive'
where id = '52000000-0000-0000-0000-000000000004';

insert into public.store_memberships (
  organization_id,
  store_id,
  clerk_user_id
)
values (
  '51000000-0000-0000-0000-000000000001',
  '52000000-0000-0000-0000-000000000001',
  'store_setup_member_a'
);

select is(
  (
    select jsonb_agg(status order by status)
    from (
      select distinct status
      from public.stores
      where id in (
        '52000000-0000-0000-0000-000000000001',
        '52000000-0000-0000-0000-000000000002',
        '52000000-0000-0000-0000-000000000003',
        '52000000-0000-0000-0000-000000000004'
      )
    ) as statuses
  ),
  '["active", "draft", "inactive", "ready"]'::jsonb,
  'all four lifecycle states can exist through valid transitions'
);

-- Insert protection and existing domain constraints.
select lives_ok(
  $$insert into public.stores (id, organization_id, name, slug) values ('52000000-0000-0000-0000-000000000006', '51000000-0000-0000-0000-000000000001', 'Transition Store', 'transition-store')$$,
  'Store insert succeeds as an unactivated draft'
);

select throws_ok(
  $$insert into public.stores (organization_id, name, slug, status) values ('51000000-0000-0000-0000-000000000001', 'Ready Insert', 'ready-insert', 'ready')$$,
  '23514', null, 'Store cannot be inserted as ready'
);

select throws_ok(
  $$insert into public.stores (organization_id, name, slug, status, activated_at) values ('51000000-0000-0000-0000-000000000001', 'Active Insert', 'active-insert', 'active', now())$$,
  '23514', null, 'Store cannot be inserted as active'
);

select throws_ok(
  $$insert into public.stores (organization_id, name, slug, status, activated_at) values ('51000000-0000-0000-0000-000000000001', 'Inactive Insert', 'inactive-insert', 'inactive', now())$$,
  '23514', null, 'Store cannot be inserted as inactive'
);

select throws_ok(
  $$insert into public.stores (organization_id, name, slug, activated_at) values ('51000000-0000-0000-0000-000000000001', 'Activated Draft', 'activated-draft', now())$$,
  '23514', null, 'draft insert cannot supply activated_at'
);

select throws_ok(
  $$insert into public.stores (organization_id, name, slug, status) values ('51000000-0000-0000-0000-000000000001', 'Invalid Status', 'invalid-status', 'deleted')$$,
  '23514', null, 'unknown Store status is rejected'
);

select throws_ok(
  $$insert into public.stores (organization_id, name, slug) values ('51000000-0000-0000-0000-000000000001', '', 'empty-name')$$,
  '23514', null, 'empty Store name is rejected'
);

select throws_ok(
  $$insert into public.stores (organization_id, name, slug) values ('51000000-0000-0000-0000-000000000001', '   ', 'blank-name')$$,
  '23514', null, 'whitespace-only Store name is rejected'
);

select throws_ok(
  $$insert into public.stores (organization_id, name, slug) values ('51000000-0000-0000-0000-000000000001', 'Upper Slug', 'Upper-Slug')$$,
  '23514', null, 'uppercase slug remains rejected'
);

select throws_ok(
  $$insert into public.stores (organization_id, name, slug) values ('51000000-0000-0000-0000-000000000001', 'Short Slug', 'ab')$$,
  '23514', null, 'short slug remains rejected'
);

select throws_ok(
  $$insert into public.stores (organization_id, name, slug) values ('51000000-0000-0000-0000-000000000001', 'Long Slug', repeat('a', 64))$$,
  '23514', null, 'long slug remains rejected'
);

select throws_ok(
  $$insert into public.stores (organization_id, name, slug) values ('51000000-0000-0000-0000-000000000002', 'Duplicate Slug', 'setup-a-draft')$$,
  '23505', null, 'Store slug uniqueness remains global'
);

-- Complete allowed transition matrix.
select lives_ok(
  $$update public.stores set name = name where id = '52000000-0000-0000-0000-000000000006'$$,
  'draft to draft is allowed'
);

select lives_ok(
  $$update public.stores set status = 'ready' where id = '52000000-0000-0000-0000-000000000006'$$,
  'draft to ready is allowed'
);

select lives_ok(
  $$update public.stores set status = 'ready' where id = '52000000-0000-0000-0000-000000000006'$$,
  'ready to ready is allowed'
);

select lives_ok(
  $$update public.stores set status = 'draft' where id = '52000000-0000-0000-0000-000000000006'$$,
  'ready to draft is allowed'
);

update public.stores
set status = 'ready'
where id = '52000000-0000-0000-0000-000000000006';

select lives_ok(
  $$update public.stores set status = 'active', activated_at = '2026-08-27 13:00:00+00' where id = '52000000-0000-0000-0000-000000000006'$$,
  'ready to active is allowed with first activation timestamp'
);

select lives_ok(
  $$update public.stores set status = 'active' where id = '52000000-0000-0000-0000-000000000006'$$,
  'active to active is allowed'
);

select lives_ok(
  $$update public.stores set status = 'inactive' where id = '52000000-0000-0000-0000-000000000006'$$,
  'active to inactive is allowed'
);

select lives_ok(
  $$update public.stores set status = 'inactive' where id = '52000000-0000-0000-0000-000000000006'$$,
  'inactive to inactive is allowed'
);

select lives_ok(
  $$update public.stores set status = 'active' where id = '52000000-0000-0000-0000-000000000006'$$,
  'inactive to active is allowed'
);

-- Forbidden transitions use fixtures created through valid transitions.
insert into public.stores (id, organization_id, name, slug)
values
  (
    '52000000-0000-0000-0000-000000000007',
    '51000000-0000-0000-0000-000000000001',
    'Forbidden Draft',
    'forbidden-draft'
  ),
  (
    '52000000-0000-0000-0000-000000000008',
    '51000000-0000-0000-0000-000000000001',
    'Forbidden Ready',
    'forbidden-ready'
  ),
  (
    '52000000-0000-0000-0000-000000000009',
    '51000000-0000-0000-0000-000000000001',
    'Forbidden Active',
    'forbidden-active'
  ),
  (
    '52000000-0000-0000-0000-000000000010',
    '51000000-0000-0000-0000-000000000001',
    'Forbidden Inactive',
    'forbidden-inactive'
  );

update public.stores
set status = 'ready'
where id in (
  '52000000-0000-0000-0000-000000000008',
  '52000000-0000-0000-0000-000000000009',
  '52000000-0000-0000-0000-000000000010'
);

update public.stores
set
  status = 'active',
  activated_at = '2026-08-27 14:00:00+00'
where id in (
  '52000000-0000-0000-0000-000000000009',
  '52000000-0000-0000-0000-000000000010'
);

update public.stores
set status = 'inactive'
where id = '52000000-0000-0000-0000-000000000010';

select throws_ok(
  $$update public.stores set status = 'active', activated_at = now() where id = '52000000-0000-0000-0000-000000000007'$$,
  '23514', null, 'draft to active is rejected'
);

select throws_ok(
  $$update public.stores set status = 'inactive', activated_at = now() where id = '52000000-0000-0000-0000-000000000007'$$,
  '23514', null, 'draft to inactive is rejected'
);

select throws_ok(
  $$update public.stores set status = 'inactive', activated_at = now() where id = '52000000-0000-0000-0000-000000000008'$$,
  '23514', null, 'ready to inactive is rejected'
);

select throws_ok(
  $$update public.stores set status = 'draft' where id = '52000000-0000-0000-0000-000000000009'$$,
  '23514', null, 'active to draft is rejected'
);

select throws_ok(
  $$update public.stores set status = 'ready' where id = '52000000-0000-0000-0000-000000000009'$$,
  '23514', null, 'active to ready is rejected'
);

select throws_ok(
  $$update public.stores set status = 'draft' where id = '52000000-0000-0000-0000-000000000010'$$,
  '23514', null, 'inactive to draft is rejected'
);

select throws_ok(
  $$update public.stores set status = 'ready' where id = '52000000-0000-0000-0000-000000000010'$$,
  '23514', null, 'inactive to ready is rejected'
);

select throws_ok(
  $$update public.stores set activated_at = '2026-08-27 15:00:00+00' where id = '52000000-0000-0000-0000-000000000009'$$,
  '23514', null, 'active Store activation timestamp cannot change'
);

select throws_ok(
  $$update public.stores set activated_at = null where id = '52000000-0000-0000-0000-000000000009'$$,
  '23514', null, 'active Store activation timestamp cannot be cleared'
);

select throws_ok(
  $$update public.stores set activated_at = '2026-08-27 15:00:00+00' where id = '52000000-0000-0000-0000-000000000010'$$,
  '23514', null, 'inactive Store activation timestamp cannot change'
);

select throws_ok(
  $$update public.stores set activated_at = null where id = '52000000-0000-0000-0000-000000000010'$$,
  '23514', null, 'inactive Store activation timestamp cannot be cleared'
);

select is(
  (
    select activated_at
    from public.stores
    where id = '52000000-0000-0000-0000-000000000006'
  ),
  '2026-08-27 13:00:00+00'::timestamptz,
  'inactive to active preserves the first activation timestamp'
);

insert into public.stores (
  id,
  organization_id,
  name,
  slug,
  created_at,
  updated_at
)
values (
  '52000000-0000-0000-0000-000000000011',
  '51000000-0000-0000-0000-000000000001',
  'Timestamp Store',
  'timestamp-store',
  '2020-01-01 00:00:00+00',
  '2020-01-01 00:00:00+00'
);

update public.stores
set name = 'Timestamp Store Updated'
where id = '52000000-0000-0000-0000-000000000011';

select is(
  (
    select created_at
    from public.stores
    where id = '52000000-0000-0000-0000-000000000011'
  ),
  '2020-01-01 00:00:00+00'::timestamptz,
  'Store update still preserves created_at'
);

select ok(
  (
    select updated_at > '2020-01-01 00:00:00+00'::timestamptz
    from public.stores
    where id = '52000000-0000-0000-0000-000000000011'
  ),
  'Store update still advances updated_at'
);

-- Tenant isolation and direct Data API write denial regressions.
set local role authenticated;
set local request.jwt.claims = '{"sub":"store_setup_no_org"}';

select is(
  (select count(*) from public.stores),
  0::bigint,
  'authenticated user without active Organization sees no Stores'
);

set local request.jwt.claims =
  '{"sub":"store_setup_admin_a","o":{"id":"store_setup_org_a","rol":"admin"}}';

select is(
  (
    select count(*)
    from public.stores
    where id in (
      '52000000-0000-0000-0000-000000000001',
      '52000000-0000-0000-0000-000000000002',
      '52000000-0000-0000-0000-000000000003',
      '52000000-0000-0000-0000-000000000004'
    )
  ),
  4::bigint,
  'Organization admin sees own lifecycle Stores'
);

select is(
  (
    select count(*)
    from public.stores
    where id = '52000000-0000-0000-0000-000000000005'
  ),
  0::bigint,
  'Organization admin cannot see another tenant Store'
);

set local request.jwt.claims =
  '{"sub":"store_setup_member_a","o":{"id":"store_setup_org_a","rol":"member"}}';

select is(
  (
    select count(*)
    from public.stores
    where id = '52000000-0000-0000-0000-000000000001'
  ),
  1::bigint,
  'member sees its assigned Store'
);

select is(
  (
    select count(*)
    from public.stores
    where id = '52000000-0000-0000-0000-000000000002'
  ),
  0::bigint,
  'member cannot see an unassigned Store in the same tenant'
);

select throws_ok(
  $$insert into public.stores (organization_id, name, slug) values ('51000000-0000-0000-0000-000000000001', 'Denied Insert', 'denied-insert')$$,
  '42501', null, 'authenticated cannot insert Stores'
);

select throws_ok(
  $$update public.stores set name = 'Denied Update'$$,
  '42501', null, 'authenticated cannot update Stores'
);

select throws_ok(
  $$delete from public.stores$$,
  '42501', null, 'authenticated cannot delete Stores'
);

reset role;
set local role anon;
set local request.jwt.claims = '{}';

select throws_ok(
  $$select * from public.stores$$,
  '42501', null, 'anon cannot read Stores'
);

reset role;

select is(
  (
    select jsonb_build_array(
      (select count(*) from public.billing_trial_grants),
      (select count(*) from public.billing_customers),
      (select count(*) from public.billing_subscriptions),
      (select count(*) from public.stripe_webhook_events)
    )
  ),
  (
    select jsonb_build_array(
      trial_grants,
      billing_customers,
      billing_subscriptions,
      webhook_events
    )
    from store_setup_billing_snapshot
  ),
  'Store lifecycle operations do not mutate trial or billing data'
);

select * from finish();
rollback;
