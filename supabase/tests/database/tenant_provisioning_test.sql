begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select no_plan();

select has_function(
  'public',
  'ensure_organization_projection',
  array['text'],
  'tenant provisioning RPC exists with the expected signature'
);

create temporary table tenant_provisioning_function as
select
  function.oid,
  function.prosecdef,
  function.provolatile,
  function.proowner,
  function.proconfig,
  function.proacl,
  pg_catalog.pg_get_functiondef(function.oid) as definition,
  pg_catalog.pg_get_function_result(function.oid) as result
from pg_catalog.pg_proc as function
join pg_catalog.pg_namespace as namespace
  on namespace.oid = function.pronamespace
where namespace.nspname = 'public'
  and function.proname = 'ensure_organization_projection'
  and function.proargtypes = '25'::pg_catalog.oidvector;

select is(
  (select count(*) from tenant_provisioning_function),
  1::bigint,
  'exactly one tenant provisioning RPC exists'
);

select ok(
  prosecdef
    and provolatile = 'v'
    and proowner = 'postgres'::pg_catalog.regrole
    and proconfig @> array['search_path=""'],
  'tenant provisioning RPC is VOLATILE SECURITY DEFINER owned by postgres with empty search_path'
)
from tenant_provisioning_function;

select is(
  (select result from tenant_provisioning_function),
  'TABLE(id uuid, clerk_organization_id text)',
  'tenant provisioning RPC returns only minimal Organization facts'
);

select ok(
  definition ~* 'pg_catalog\.pg_advisory_xact_lock'
    and definition ~* 'pg_catalog\.hashtextextended'
    and definition ~* 'on conflict on constraint organizations_clerk_organization_id_key',
  'tenant provisioning RPC has an idempotent concurrency boundary and unique-conflict backstop'
)
from tenant_provisioning_function;

select ok(
  definition !~* 'public\.stores|billing_|stripe|execute[[:space:]]',
  'tenant provisioning RPC uses static Organization-only SQL'
)
from tenant_provisioning_function;

select ok(
  not exists (
    select 1
    from pg_catalog.aclexplode(proacl) as acl
    where acl.grantee = 0
      and acl.privilege_type = 'EXECUTE'
  ),
  'PUBLIC cannot execute tenant provisioning RPC'
)
from tenant_provisioning_function;

select ok(
  not has_function_privilege(
    'anon',
    oid,
    'EXECUTE'
  ),
  'anon cannot execute tenant provisioning RPC'
)
from tenant_provisioning_function;

select ok(
  not has_function_privilege(
    'authenticated',
    oid,
    'EXECUTE'
  ),
  'authenticated cannot execute tenant provisioning RPC'
)
from tenant_provisioning_function;

select ok(
  has_function_privilege(
    'service_role',
    oid,
    'EXECUTE'
  ),
  'service_role can execute tenant provisioning RPC'
)
from tenant_provisioning_function;

select ok(
  not has_table_privilege(
    'service_role',
    'public.organizations',
    privilege
  ),
  'service_role has no direct organizations ' || privilege
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

select ok(
  has_table_privilege(
    'authenticated',
    'public.organizations',
    'SELECT'
  )
    and not has_table_privilege(
      'authenticated',
      'public.organizations',
      'INSERT'
    )
    and not has_table_privilege(
      'authenticated',
      'public.organizations',
      'UPDATE'
    )
    and not has_table_privilege(
      'authenticated',
      'public.organizations',
      'DELETE'
    ),
  'authenticated remains SELECT-only on organizations'
);

select ok(
  not has_table_privilege('anon', 'public.organizations', privilege),
  'anon remains denied organizations ' || privilege
)
from (
  values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE')
) as denied(privilege);

set local role anon;
select throws_ok(
  $$select * from public.ensure_organization_projection('org_pgtap_anon')$$,
  '42501',
  null,
  'anon invocation is denied at runtime'
);
reset role;

set local role authenticated;
select throws_ok(
  $$select * from public.ensure_organization_projection('org_pgtap_authenticated')$$,
  '42501',
  null,
  'authenticated invocation is denied at runtime'
);
reset role;

insert into public.organizations (
  id,
  clerk_organization_id,
  created_at,
  updated_at
)
values (
  '93000000-0000-4000-8000-000000000002',
  'org_pgtap_isolated',
  '2026-01-01 00:00:00+00',
  '2026-01-01 00:00:00+00'
);

create temporary table isolated_organization_before as
select id, clerk_organization_id, created_at, updated_at
from public.organizations
where clerk_organization_id = 'org_pgtap_isolated';

set local role service_role;

select throws_ok(
  $$select * from public.ensure_organization_projection('   ')$$,
  '22023',
  'Invalid Clerk Organization identifier',
  'blank Clerk Organization identifiers are rejected'
);

select is(
  (
    select clerk_organization_id
    from public.ensure_organization_projection('org_pgtap_ensure')
  ),
  'org_pgtap_ensure',
  'service_role can create an Organization projection through the RPC'
);

reset role;

create temporary table first_organization_projection as
select id, clerk_organization_id, created_at, updated_at
from public.organizations
where clerk_organization_id = 'org_pgtap_ensure';

select pg_catalog.set_config(
  'test.tenant_provisioning_first_id',
  (select id::text from first_organization_projection),
  false
);

set local role service_role;

select is(
  (
    select id::text
    from public.ensure_organization_projection('org_pgtap_ensure')
  ),
  pg_catalog.current_setting('test.tenant_provisioning_first_id'),
  'retry returns the same internal Organization UUID'
);

select throws_ok(
  $$select * from public.organizations$$,
  '42501',
  null,
  'service_role cannot read organizations directly'
);

select throws_ok(
  $$insert into public.organizations (clerk_organization_id) values ('org_pgtap_direct_insert')$$,
  '42501',
  null,
  'service_role cannot insert organizations directly'
);

select throws_ok(
  $$update public.organizations set updated_at = pg_catalog.now()$$,
  '42501',
  null,
  'service_role cannot update organizations directly'
);

select throws_ok(
  $$delete from public.organizations$$,
  '42501',
  null,
  'service_role cannot delete organizations directly'
);

select throws_ok(
  $$truncate table public.organizations$$,
  '42501',
  null,
  'service_role cannot truncate organizations directly'
);

reset role;

select is(
  (
    select count(*)
    from public.organizations
    where clerk_organization_id = 'org_pgtap_ensure'
  ),
  1::bigint,
  'retries leave exactly one Organization projection'
);

select is(
  (
    select jsonb_build_array(id, clerk_organization_id, created_at, updated_at)
    from public.organizations
    where clerk_organization_id = 'org_pgtap_ensure'
  ),
  (
    select jsonb_build_array(id, clerk_organization_id, created_at, updated_at)
    from first_organization_projection
  ),
  'retry does not mutate the existing Organization projection'
);

select is(
  (
    select to_jsonb(organization)
    from public.organizations as organization
    where clerk_organization_id = 'org_pgtap_isolated'
  ),
  (
    select to_jsonb(organization)
    from isolated_organization_before as organization
  ),
  'ensuring one Organization does not mutate another Organization'
);

select is(
  (
    select count(*)
    from public.stores
    where organization_id = (
      select id
      from public.organizations
      where clerk_organization_id = 'org_pgtap_ensure'
    )
  ),
  0::bigint,
  'Organization provisioning creates no Store'
);

select is(
  (
    select count(*)
    from public.billing_trial_grants
    where organization_id = (
      select id
      from public.organizations
      where clerk_organization_id = 'org_pgtap_ensure'
    )
  ),
  0::bigint,
  'Organization provisioning creates no trial grant'
);

select is(
  (
    select count(*)
    from public.billing_customers
    where organization_id = (
      select id
      from public.organizations
      where clerk_organization_id = 'org_pgtap_ensure'
    )
  ),
  0::bigint,
  'Organization provisioning creates no billing Customer'
);

select is(
  (
    select count(*)
    from public.billing_checkout_attempts
    where organization_id = (
      select id
      from public.organizations
      where clerk_organization_id = 'org_pgtap_ensure'
    )
  ),
  0::bigint,
  'Organization provisioning creates no Checkout attempt'
);

select * from finish();
rollback;
