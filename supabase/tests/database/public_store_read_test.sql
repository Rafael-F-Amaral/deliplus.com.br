begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

select has_function('public', 'get_public_store_by_slug', array['text'], 'exact public RPC signature exists');
select is((select l.lanname from pg_proc p join pg_language l on l.oid = p.prolang where p.oid = 'public.get_public_store_by_slug(text)'::regprocedure), 'sql', 'SQL language');
select is((select provolatile::text from pg_proc where oid = 'public.get_public_store_by_slug(text)'::regprocedure), 's', 'STABLE');
select ok((select prosecdef from pg_proc where oid = 'public.get_public_store_by_slug(text)'::regprocedure), 'SECURITY DEFINER');
select is((select pg_get_userbyid(proowner)::text from pg_proc where oid = 'public.get_public_store_by_slug(text)'::regprocedure), 'postgres', 'owner postgres');
select is((select proconfig from pg_proc where oid = 'public.get_public_store_by_slug(text)'::regprocedure), array['search_path=""'], 'empty search_path');
select is(pg_get_function_result('public.get_public_store_by_slug(text)'::regprocedure), 'TABLE(name text, slug text)', 'only name and slug returned, no internal fields');
select ok(not exists (select 1 from pg_proc p, lateral aclexplode(p.proacl) a where p.oid = 'public.get_public_store_by_slug(text)'::regprocedure and a.grantee = 0 and a.privilege_type = 'EXECUTE'), 'PUBLIC cannot execute');
select ok(has_function_privilege('anon', 'public.get_public_store_by_slug(text)', 'EXECUTE'), 'anon can execute');
select ok(not has_function_privilege('authenticated', 'public.get_public_store_by_slug(text)', 'EXECUTE'), 'authenticated has no extra capability');
select ok(not has_function_privilege('service_role', 'public.get_public_store_by_slug(text)', 'EXECUTE'), 'service_role has no extra capability');
select ok(not has_table_privilege('anon', 'public.stores', 'SELECT'), 'anon has no direct Store SELECT');
select ok(not has_any_column_privilege('anon', 'public.stores', 'SELECT'), 'anon has no column SELECT grants');

insert into public.organizations (id, clerk_organization_id)
values ('a1200000-0000-0000-0000-000000000001', 'org_public_read_test');
insert into public.stores (organization_id, name, slug)
select 'a1200000-0000-0000-0000-000000000001'::uuid, 'Public Test ' || state, 'public-test-' || state
from unnest(array['draft','ready','active','inactive']) as state;
update public.stores set status = 'ready' where slug in ('public-test-ready','public-test-active','public-test-inactive');
update public.stores set status = 'active', activated_at = now() where slug in ('public-test-active','public-test-inactive');
update public.stores set status = 'inactive' where slug = 'public-test-inactive';

set local role anon;
select results_eq($$select name, slug from public.get_public_store_by_slug('public-test-active')$$, $$values ('Public Test active'::text, 'public-test-active'::text)$$, 'anonymous active Store lookup without JWT');
select is_empty($$select name, slug from public.get_public_store_by_slug('public-test-draft')$$, 'draft unavailable');
select is_empty($$select name, slug from public.get_public_store_by_slug('public-test-ready')$$, 'ready unavailable');
select is_empty($$select name, slug from public.get_public_store_by_slug('public-test-inactive')$$, 'inactive unavailable');
select is_empty($$select name, slug from public.get_public_store_by_slug('public-test-unknown')$$, 'nonexistent unavailable');
select is_empty($$select name, slug from public.get_public_store_by_slug(null)$$, 'null unavailable');
select is_empty($$select name, slug from public.get_public_store_by_slug('')$$, 'empty unavailable');
select is_empty($$select name, slug from public.get_public_store_by_slug('PUBLIC-TEST-ACTIVE')$$, 'noncanonical unavailable');
select is_empty($$select name, slug from public.get_public_store_by_slug('public-test-active'' OR true --')$$, 'SQL input stays data');
select is_empty($$select name, slug from public.get_public_store_by_slug(repeat('a', 64))$$, 'long input unavailable');
select throws_ok('select name from public.stores', '42501', 'permission denied for table stores', 'actual direct SELECT denied');
reset role;

-- Availability changes are visible to the next statement without cache.
update public.stores set status = 'inactive' where slug = 'public-test-active';
set local role anon;
select is_empty($$select name, slug from public.get_public_store_by_slug('public-test-active')$$, 'deactivated Store disappears');
reset role;
select * from finish();
rollback;
