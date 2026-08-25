begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(100);

insert into public.organizations (
  id,
  clerk_organization_id,
  created_at,
  updated_at
)
values
  (
    '10000000-0000-0000-0000-000000000001',
    'org_a',
    '2020-01-01 00:00:00+00',
    '2020-01-01 00:00:00+00'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'org_b',
    '2020-01-01 00:00:00+00',
    '2020-01-01 00:00:00+00'
  );

insert into public.stores (
  id,
  organization_id,
  name,
  slug,
  status,
  created_at,
  updated_at
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Store A1',
    'store-a1',
    'active',
    '2020-01-01 00:00:00+00',
    '2020-01-01 00:00:00+00'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'Store A2',
    'store-a2',
    'draft',
    '2020-01-01 00:00:00+00',
    '2020-01-01 00:00:00+00'
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000002',
    'Store B1',
    'store-b1',
    'inactive',
    '2020-01-01 00:00:00+00',
    '2020-01-01 00:00:00+00'
  );

insert into public.store_memberships (
  id,
  organization_id,
  store_id,
  clerk_user_id,
  created_at,
  updated_at
)
values
  (
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'user_member_a1',
    '2020-01-01 00:00:00+00',
    '2020-01-01 00:00:00+00'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    'user_member_a2',
    '2020-01-01 00:00:00+00',
    '2020-01-01 00:00:00+00'
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000003',
    'user_member_a1',
    '2020-01-01 00:00:00+00',
    '2020-01-01 00:00:00+00'
  );

-- Schema and security posture.
select has_schema('private', 'private schema exists');
select has_table('public', 'organizations', 'organizations table exists');
select has_table('public', 'stores', 'stores table exists');
select has_table(
  'public',
  'store_memberships',
  'store_memberships table exists'
);

select ok(
  relation.relrowsecurity and not relation.relforcerowsecurity,
  'organizations has RLS enabled without FORCE RLS'
)
from pg_catalog.pg_class as relation
join pg_catalog.pg_namespace as namespace
  on namespace.oid = relation.relnamespace
where namespace.nspname = 'public'
  and relation.relname = 'organizations';

select ok(
  relation.relrowsecurity and not relation.relforcerowsecurity,
  'stores has RLS enabled without FORCE RLS'
)
from pg_catalog.pg_class as relation
join pg_catalog.pg_namespace as namespace
  on namespace.oid = relation.relnamespace
where namespace.nspname = 'public'
  and relation.relname = 'stores';

select ok(
  relation.relrowsecurity and not relation.relforcerowsecurity,
  'store_memberships has RLS enabled without FORCE RLS'
)
from pg_catalog.pg_class as relation
join pg_catalog.pg_namespace as namespace
  on namespace.oid = relation.relnamespace
where namespace.nspname = 'public'
  and relation.relname = 'store_memberships';

select ok(
  has_table_privilege('authenticated', 'public.organizations', 'SELECT')
  and not has_table_privilege('authenticated', 'public.organizations', 'INSERT')
  and not has_table_privilege('authenticated', 'public.organizations', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.organizations', 'DELETE')
  and not has_table_privilege('authenticated', 'public.organizations', 'TRUNCATE')
  and not has_table_privilege('authenticated', 'public.organizations', 'REFERENCES')
  and not has_table_privilege('authenticated', 'public.organizations', 'TRIGGER'),
  'authenticated has SELECT-only access to organizations'
);

select ok(
  has_table_privilege('authenticated', 'public.stores', 'SELECT')
  and not has_table_privilege('authenticated', 'public.stores', 'INSERT')
  and not has_table_privilege('authenticated', 'public.stores', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.stores', 'DELETE')
  and not has_table_privilege('authenticated', 'public.stores', 'TRUNCATE')
  and not has_table_privilege('authenticated', 'public.stores', 'REFERENCES')
  and not has_table_privilege('authenticated', 'public.stores', 'TRIGGER'),
  'authenticated has SELECT-only access to stores'
);

select ok(
  has_table_privilege('authenticated', 'public.store_memberships', 'SELECT')
  and not has_table_privilege('authenticated', 'public.store_memberships', 'INSERT')
  and not has_table_privilege('authenticated', 'public.store_memberships', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.store_memberships', 'DELETE')
  and not has_table_privilege('authenticated', 'public.store_memberships', 'TRUNCATE')
  and not has_table_privilege('authenticated', 'public.store_memberships', 'REFERENCES')
  and not has_table_privilege('authenticated', 'public.store_memberships', 'TRIGGER'),
  'authenticated has SELECT-only access to store_memberships'
);

select ok(
  not has_table_privilege('anon', 'public.organizations', 'SELECT')
  and not has_table_privilege('anon', 'public.organizations', 'INSERT')
  and not has_table_privilege('anon', 'public.organizations', 'UPDATE')
  and not has_table_privilege('anon', 'public.organizations', 'DELETE')
  and not has_table_privilege('anon', 'public.organizations', 'TRUNCATE')
  and not has_table_privilege('anon', 'public.organizations', 'REFERENCES')
  and not has_table_privilege('anon', 'public.organizations', 'TRIGGER'),
  'anon has no privileges on organizations'
);

select ok(
  not has_table_privilege('anon', 'public.stores', 'SELECT')
  and not has_table_privilege('anon', 'public.stores', 'INSERT')
  and not has_table_privilege('anon', 'public.stores', 'UPDATE')
  and not has_table_privilege('anon', 'public.stores', 'DELETE')
  and not has_table_privilege('anon', 'public.stores', 'TRUNCATE')
  and not has_table_privilege('anon', 'public.stores', 'REFERENCES')
  and not has_table_privilege('anon', 'public.stores', 'TRIGGER'),
  'anon has no privileges on stores'
);

select ok(
  not has_table_privilege('anon', 'public.store_memberships', 'SELECT')
  and not has_table_privilege('anon', 'public.store_memberships', 'INSERT')
  and not has_table_privilege('anon', 'public.store_memberships', 'UPDATE')
  and not has_table_privilege('anon', 'public.store_memberships', 'DELETE')
  and not has_table_privilege('anon', 'public.store_memberships', 'TRUNCATE')
  and not has_table_privilege('anon', 'public.store_memberships', 'REFERENCES')
  and not has_table_privilege('anon', 'public.store_memberships', 'TRIGGER'),
  'anon has no privileges on store_memberships'
);

select ok(
  has_schema_privilege('authenticated', 'private', 'USAGE')
  and not has_schema_privilege('anon', 'private', 'USAGE'),
  'only authenticated can use the private schema among Data API user roles'
);

select ok(
  has_function_privilege(
    'authenticated',
    'private.clerk_user_id()',
    'EXECUTE'
  ),
  'authenticated can execute clerk_user_id'
);

select ok(
  has_function_privilege(
    'authenticated',
    'private.clerk_organization_id()',
    'EXECUTE'
  ),
  'authenticated can execute clerk_organization_id'
);

select ok(
  has_function_privilege(
    'authenticated',
    'private.clerk_organization_role()',
    'EXECUTE'
  ),
  'authenticated can execute clerk_organization_role'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'private.set_row_timestamps()',
    'EXECUTE'
  )
  and not has_function_privilege(
    'anon',
    'private.set_row_timestamps()',
    'EXECUTE'
  )
  and not has_function_privilege(
    'service_role',
    'private.set_row_timestamps()',
    'EXECUTE'
  ),
  'timestamp trigger function is not directly executable by API roles'
);

select ok(
  not has_function_privilege('anon', 'private.clerk_user_id()', 'EXECUTE')
  and not has_function_privilege(
    'anon',
    'private.clerk_organization_id()',
    'EXECUTE'
  )
  and not has_function_privilege(
    'anon',
    'private.clerk_organization_role()',
    'EXECUTE'
  ),
  'anon cannot execute Clerk claim helpers'
);

select ok(
  not function.prosecdef
  and function.provolatile = 's'
  and function.proconfig @> array['search_path=""']::text[],
  'clerk_user_id is stable, SECURITY INVOKER, and has an empty search_path'
)
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
where namespace.nspname = 'private'
  and function.proname = 'clerk_user_id';

select ok(
  not function.prosecdef
  and function.provolatile = 's'
  and function.proconfig @> array['search_path=""']::text[],
  'clerk_organization_id is stable, SECURITY INVOKER, and has an empty search_path'
)
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
where namespace.nspname = 'private'
  and function.proname = 'clerk_organization_id';

select ok(
  not function.prosecdef
  and function.provolatile = 's'
  and function.proconfig @> array['search_path=""']::text[],
  'clerk_organization_role is stable, SECURITY INVOKER, and has an empty search_path'
)
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
where namespace.nspname = 'private'
  and function.proname = 'clerk_organization_role';

select ok(
  not function.prosecdef
  and function.proconfig @> array['search_path=""']::text[],
  'timestamp trigger is SECURITY INVOKER with an empty search_path'
)
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
where namespace.nspname = 'private'
  and function.proname = 'set_row_timestamps';

select is(
  (
    select jsonb_agg(indexname order by indexname)
    from pg_catalog.pg_indexes
    where schemaname = 'public'
      and tablename = 'stores'
  ),
  '["stores_organization_id_id_key", "stores_pkey", "stores_slug_key"]'::jsonb,
  'stores has only the approved indexes'
);

select is(
  (
    select jsonb_agg(indexname order by indexname)
    from pg_catalog.pg_indexes
    where schemaname = 'public'
      and tablename = 'store_memberships'
  ),
  '["store_memberships_organization_id_clerk_user_id_idx", "store_memberships_organization_id_store_id_idx", "store_memberships_pkey", "store_memberships_store_id_clerk_user_id_key"]'::jsonb,
  'store_memberships has only the approved indexes'
);

select is(
  (
    select jsonb_agg(indexname order by indexname)
    from pg_catalog.pg_indexes
    where schemaname = 'public'
      and tablename = 'organizations'
  ),
  '["organizations_clerk_organization_id_key", "organizations_pkey"]'::jsonb,
  'organizations has only its primary and Clerk organization indexes'
);

select is(
  (
    select jsonb_agg(policyname order by policyname)
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'organizations'
  ),
  '["organizations_select_active_clerk_organization"]'::jsonb,
  'organizations has only its approved SELECT policy'
);

select is(
  (
    select jsonb_agg(policyname order by policyname)
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'stores'
  ),
  '["stores_select_active_organization_admin", "stores_select_assigned_organization_member"]'::jsonb,
  'stores has the approved admin and member SELECT policies'
);

select is(
  (
    select jsonb_agg(policyname order by policyname)
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'store_memberships'
  ),
  '["store_memberships_select_current_member"]'::jsonb,
  'store_memberships has only its approved SELECT policy'
);

select is(
  (
    select count(*)
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename in ('organizations', 'stores', 'store_memberships')
      and cmd <> 'SELECT'
  ),
  0::bigint,
  'tenant-core exposes no mutation policies'
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
        relation.relname like 'organizations%'
        or relation.relname like 'stores%'
        or relation.relname like 'store_memberships%'
      )
  ),
  'UUID tenant-core tables create no sequences'
);

-- Clerk claim helper behavior.
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"user_member_a1","o":{"id":"org_a","rol":"member"}}';

select is(
  private.clerk_user_id(),
  'user_member_a1',
  'clerk_user_id reads the verified sub claim'
);
select is(
  private.clerk_organization_id(),
  'org_a',
  'clerk_organization_id reads the active o.id claim'
);
select is(
  private.clerk_organization_role(),
  'member',
  'clerk_organization_role reads the active o.rol claim'
);

set local request.jwt.claims = '{"sub":"user_without_org"}';
select is(
  private.clerk_organization_id(),
  null,
  'clerk_organization_id naturally returns NULL without an active organization'
);
select is(
  private.clerk_organization_role(),
  null,
  'clerk_organization_role naturally returns NULL without an active organization'
);

reset role;

-- anon has no direct table access.
set local role anon;
set local request.jwt.claims = '{}';

select throws_ok(
  $$select * from public.organizations$$,
  '42501',
  null,
  'anon cannot read organizations'
);
select throws_ok(
  $$select * from public.stores$$,
  '42501',
  null,
  'anon cannot read stores'
);
select throws_ok(
  $$select * from public.store_memberships$$,
  '42501',
  null,
  'anon cannot read store_memberships'
);

reset role;

-- An authenticated user without an active Organization sees no tenant data.
set local role authenticated;
set local request.jwt.claims = '{"sub":"user_without_org"}';

select is(
  (select count(*) from public.organizations),
  0::bigint,
  'authenticated user without active Organization sees no organizations'
);
select is(
  (select count(*) from public.stores),
  0::bigint,
  'authenticated user without active Organization sees no stores'
);
select is(
  (select count(*) from public.store_memberships),
  0::bigint,
  'authenticated user without active Organization sees no memberships'
);

reset role;

-- Admin A sees only Organization A and all of its Stores.
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"user_admin_a","o":{"id":"org_a","rol":"admin"}}';

select is(
  (select count(*) from public.organizations),
  1::bigint,
  'Admin A sees exactly one organization'
);
select is(
  (select jsonb_agg(clerk_organization_id) from public.organizations),
  '["org_a"]'::jsonb,
  'Admin A sees Organization A and not Organization B'
);
select is(
  (select count(*) from public.stores),
  2::bigint,
  'Admin A sees both Stores in Organization A'
);
select is(
  (select jsonb_agg(slug order by slug) from public.stores),
  '["store-a1", "store-a2"]'::jsonb,
  'Admin A cannot see Store B1'
);
select is(
  (select count(*) from public.store_memberships),
  0::bigint,
  'Admin A does not receive direct membership rows'
);

reset role;

-- Member A1 sees only assigned Store A1; the same user also has a fixture in B.
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"user_member_a1","o":{"id":"org_a","rol":"member"}}';

select is(
  (select count(*) from public.organizations),
  1::bigint,
  'Member A1 sees Organization A'
);
select is(
  (select count(*) from public.stores),
  1::bigint,
  'Member A1 sees exactly one assigned Store'
);
select is(
  (select jsonb_agg(slug) from public.stores),
  '["store-a1"]'::jsonb,
  'Member A1 sees Store A1, not A2 or B1'
);
select is(
  (select count(*) from public.store_memberships),
  1::bigint,
  'Member A1 sees exactly one membership in active Organization A'
);
select is(
  (select jsonb_agg(store_id) from public.store_memberships),
  '["20000000-0000-0000-0000-000000000001"]'::jsonb,
  'Member A1 cannot see the same Clerk user membership in Organization B'
);

reset role;

-- Member A2 sees only assigned Store A2.
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"user_member_a2","o":{"id":"org_a","rol":"member"}}';

select is(
  (select count(*) from public.organizations),
  1::bigint,
  'Member A2 sees Organization A'
);
select is(
  (select count(*) from public.stores),
  1::bigint,
  'Member A2 sees exactly one assigned Store'
);
select is(
  (select jsonb_agg(slug) from public.stores),
  '["store-a2"]'::jsonb,
  'Member A2 sees Store A2 only'
);
select is(
  (select count(*) from public.store_memberships),
  1::bigint,
  'Member A2 sees exactly one own membership'
);
select is(
  (select jsonb_agg(store_id) from public.store_memberships),
  '["20000000-0000-0000-0000-000000000002"]'::jsonb,
  'Member A2 sees only the Store A2 assignment'
);

reset role;

-- A member without assignment sees its Organization but no Stores.
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"user_member_unassigned","o":{"id":"org_a","rol":"member"}}';

select is(
  (select count(*) from public.organizations),
  1::bigint,
  'unassigned member still sees active Organization A'
);
select is(
  (select count(*) from public.stores),
  0::bigint,
  'unassigned member sees no Stores'
);
select is(
  (select count(*) from public.store_memberships),
  0::bigint,
  'unassigned member sees no membership rows'
);

reset role;

-- Admin B sees only Organization B and Store B1.
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"user_admin_b","o":{"id":"org_b","rol":"admin"}}';

select is(
  (select count(*) from public.organizations),
  1::bigint,
  'Admin B sees exactly one organization'
);
select is(
  (select jsonb_agg(clerk_organization_id) from public.organizations),
  '["org_b"]'::jsonb,
  'Admin B sees Organization B and not Organization A'
);
select is(
  (select count(*) from public.stores),
  1::bigint,
  'Admin B sees exactly one Store'
);
select is(
  (select jsonb_agg(slug) from public.stores),
  '["store-b1"]'::jsonb,
  'Admin B sees Store B1 only'
);
select is(
  (select count(*) from public.store_memberships),
  0::bigint,
  'Admin B does not receive direct membership rows'
);

reset role;

-- Admin and member have identical read-only write denial.
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"user_admin_a","o":{"id":"org_a","rol":"admin"}}';

select throws_ok(
  $$insert into public.organizations (clerk_organization_id) values ('org_write_admin')$$,
  '42501', null, 'admin cannot insert organizations'
);
select throws_ok(
  $$update public.organizations set updated_at = now()$$,
  '42501', null, 'admin cannot update organizations'
);
select throws_ok(
  $$delete from public.organizations$$,
  '42501', null, 'admin cannot delete organizations'
);
select throws_ok(
  $$insert into public.stores (organization_id, name, slug) values ('10000000-0000-0000-0000-000000000001', 'Denied', 'admin-denied')$$,
  '42501', null, 'admin cannot insert stores'
);
select throws_ok(
  $$update public.stores set name = 'Denied'$$,
  '42501', null, 'admin cannot update stores'
);
select throws_ok(
  $$delete from public.stores$$,
  '42501', null, 'admin cannot delete stores'
);
select throws_ok(
  $$insert into public.store_memberships (organization_id, store_id, clerk_user_id) values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'denied_admin')$$,
  '42501', null, 'admin cannot insert store memberships'
);
select throws_ok(
  $$update public.store_memberships set updated_at = now()$$,
  '42501', null, 'admin cannot update store memberships'
);
select throws_ok(
  $$delete from public.store_memberships$$,
  '42501', null, 'admin cannot delete store memberships'
);

set local request.jwt.claims =
  '{"sub":"user_member_a1","o":{"id":"org_a","rol":"member"}}';

select throws_ok(
  $$insert into public.organizations (clerk_organization_id) values ('org_write_member')$$,
  '42501', null, 'member cannot insert organizations'
);
select throws_ok(
  $$update public.organizations set updated_at = now()$$,
  '42501', null, 'member cannot update organizations'
);
select throws_ok(
  $$delete from public.organizations$$,
  '42501', null, 'member cannot delete organizations'
);
select throws_ok(
  $$insert into public.stores (organization_id, name, slug) values ('10000000-0000-0000-0000-000000000001', 'Denied', 'member-denied')$$,
  '42501', null, 'member cannot insert stores'
);
select throws_ok(
  $$update public.stores set name = 'Denied'$$,
  '42501', null, 'member cannot update stores'
);
select throws_ok(
  $$delete from public.stores$$,
  '42501', null, 'member cannot delete stores'
);
select throws_ok(
  $$insert into public.store_memberships (organization_id, store_id, clerk_user_id) values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'denied_member')$$,
  '42501', null, 'member cannot insert store memberships'
);
select throws_ok(
  $$update public.store_memberships set updated_at = now()$$,
  '42501', null, 'member cannot update store memberships'
);
select throws_ok(
  $$delete from public.store_memberships$$,
  '42501', null, 'member cannot delete store memberships'
);

reset role;

-- Relational and domain invariants, using the privileged local test role.
select throws_ok(
  $$insert into public.stores (id, organization_id, name, slug) values ('20000000-0000-0000-0000-000000000099', '10000000-0000-0000-0000-000000000099', 'Invalid Org', 'invalid-org')$$,
  '23503', null, 'Store requires an existing Organization'
);
select throws_ok(
  $$insert into public.store_memberships (organization_id, store_id, clerk_user_id) values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000099', 'user_missing_store')$$,
  '23503', null, 'membership requires an existing Store'
);
select throws_ok(
  $$insert into public.store_memberships (organization_id, store_id, clerk_user_id) values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'user_cross_tenant')$$,
  '23503', null, 'composite foreign key rejects cross-Organization Store assignment'
);
select throws_ok(
  $$insert into public.store_memberships (organization_id, store_id, clerk_user_id) values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'user_member_a1')$$,
  '23505', null, 'duplicate Store membership is rejected'
);
select throws_ok(
  $$insert into public.stores (organization_id, name, slug) values ('10000000-0000-0000-0000-000000000001', 'Bad Slug', 'Bad-Slug')$$,
  '23514', null, 'uppercase Store slug is rejected'
);
select throws_ok(
  $$insert into public.stores (organization_id, name, slug) values ('10000000-0000-0000-0000-000000000001', 'Short Slug', 'ab')$$,
  '23514', null, 'Store slug shorter than three characters is rejected'
);
select throws_ok(
  $$insert into public.stores (organization_id, name, slug) values ('10000000-0000-0000-0000-000000000001', 'Duplicate Slug', 'store-a1')$$,
  '23505', null, 'duplicate Store slug is rejected'
);
select throws_ok(
  $$insert into public.stores (organization_id, name, slug, status) values ('10000000-0000-0000-0000-000000000001', 'Bad Status', 'bad-status', 'deleted')$$,
  '23514', null, 'invalid Store status is rejected'
);
select throws_ok(
  $$delete from public.organizations where id = '10000000-0000-0000-0000-000000000001'$$,
  '23503', null, 'Organization deletion is restricted while Stores exist'
);

insert into public.organizations (
  id,
  clerk_organization_id
)
values (
  '10000000-0000-0000-0000-000000000003',
  'org_c'
);
insert into public.stores (
  id,
  organization_id,
  name,
  slug
)
values (
  '20000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000003',
  'Store C1',
  'store-c1'
);
insert into public.store_memberships (
  id,
  organization_id,
  store_id,
  clerk_user_id
)
values (
  '30000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000004',
  'user_member_c1'
);

select lives_ok(
  $$delete from public.stores where id = '20000000-0000-0000-0000-000000000004'$$,
  'Store deletion succeeds for cascade fixture'
);
select is(
  (
    select count(*)
    from public.store_memberships
    where id = '30000000-0000-0000-0000-000000000004'
  ),
  0::bigint,
  'Store deletion cascades its Store memberships'
);

update public.organizations
set clerk_organization_id = clerk_organization_id
where id = '10000000-0000-0000-0000-000000000001';

update public.stores
set name = name
where id = '20000000-0000-0000-0000-000000000001';

update public.store_memberships
set clerk_user_id = clerk_user_id
where id = '30000000-0000-0000-0000-000000000001';

select is(
  (
    select created_at
    from public.organizations
    where id = '10000000-0000-0000-0000-000000000001'
  ),
  '2020-01-01 00:00:00+00'::timestamptz,
  'organizations update preserves created_at'
);
select ok(
  (
    select updated_at > '2020-01-01 00:00:00+00'::timestamptz
    from public.organizations
    where id = '10000000-0000-0000-0000-000000000001'
  ),
  'organizations update advances updated_at'
);
select is(
  (
    select created_at
    from public.stores
    where id = '20000000-0000-0000-0000-000000000001'
  ),
  '2020-01-01 00:00:00+00'::timestamptz,
  'stores update preserves created_at'
);
select ok(
  (
    select updated_at > '2020-01-01 00:00:00+00'::timestamptz
    from public.stores
    where id = '20000000-0000-0000-0000-000000000001'
  ),
  'stores update advances updated_at'
);
select is(
  (
    select created_at
    from public.store_memberships
    where id = '30000000-0000-0000-0000-000000000001'
  ),
  '2020-01-01 00:00:00+00'::timestamptz,
  'store_memberships update preserves created_at'
);
select ok(
  (
    select updated_at > '2020-01-01 00:00:00+00'::timestamptz
    from public.store_memberships
    where id = '30000000-0000-0000-0000-000000000001'
  ),
  'store_memberships update advances updated_at'
);

select * from finish();
rollback;
