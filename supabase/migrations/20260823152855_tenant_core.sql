create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create function private.clerk_user_id()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select auth.jwt() ->> 'sub';
$$;

create function private.clerk_organization_id()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select auth.jwt() -> 'o' ->> 'id';
$$;

create function private.clerk_organization_role()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select auth.jwt() -> 'o' ->> 'rol';
$$;

create function private.set_row_timestamps()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.created_at := old.created_at;
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

revoke all on function private.clerk_user_id() from public, anon, authenticated;
revoke all on function private.clerk_organization_id() from public, anon, authenticated;
revoke all on function private.clerk_organization_role() from public, anon, authenticated;
revoke all on function private.set_row_timestamps() from public, anon, authenticated;

grant usage on schema private to authenticated;
grant execute on function private.clerk_user_id() to authenticated;
grant execute on function private.clerk_organization_id() to authenticated;
grant execute on function private.clerk_organization_role() to authenticated;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  clerk_organization_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name text not null,
  slug text not null unique,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stores_organization_id_fkey
    foreign key (organization_id)
    references public.organizations (id)
    on update restrict
    on delete restrict,
  constraint stores_organization_id_id_key unique (organization_id, id),
  constraint stores_slug_format_check
    check (
      char_length(slug) between 3 and 63
      and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    ),
  constraint stores_status_check
    check (status in ('draft', 'active', 'inactive'))
);

create table public.store_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  store_id uuid not null,
  clerk_user_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_memberships_store_id_clerk_user_id_key
    unique (store_id, clerk_user_id),
  constraint store_memberships_organization_id_store_id_fkey
    foreign key (organization_id, store_id)
    references public.stores (organization_id, id)
    on update restrict
    on delete cascade
);

create index store_memberships_organization_id_store_id_idx
  on public.store_memberships (organization_id, store_id);

create index store_memberships_organization_id_clerk_user_id_idx
  on public.store_memberships (organization_id, clerk_user_id);

create trigger organizations_set_row_timestamps
before update on public.organizations
for each row
execute function private.set_row_timestamps();

create trigger stores_set_row_timestamps
before update on public.stores
for each row
execute function private.set_row_timestamps();

create trigger store_memberships_set_row_timestamps
before update on public.store_memberships
for each row
execute function private.set_row_timestamps();

alter table public.organizations enable row level security;
alter table public.stores enable row level security;
alter table public.store_memberships enable row level security;

create policy organizations_select_active_clerk_organization
on public.organizations
for select
to authenticated
using (
  clerk_organization_id = (select private.clerk_organization_id())
);

create policy stores_select_active_organization_admin
on public.stores
for select
to authenticated
using (
  (select private.clerk_organization_role()) = 'admin'
  and exists (
    select 1
    from public.organizations as organization
    where organization.id = stores.organization_id
      and organization.clerk_organization_id =
        (select private.clerk_organization_id())
  )
);

create policy stores_select_assigned_organization_member
on public.stores
for select
to authenticated
using (
  (select private.clerk_organization_role()) = 'member'
  and exists (
    select 1
    from public.organizations as organization
    where organization.id = stores.organization_id
      and organization.clerk_organization_id =
        (select private.clerk_organization_id())
  )
  and exists (
    select 1
    from public.store_memberships as membership
    where membership.organization_id = stores.organization_id
      and membership.store_id = stores.id
      and membership.clerk_user_id = (select private.clerk_user_id())
  )
);

create policy store_memberships_select_current_member
on public.store_memberships
for select
to authenticated
using (
  (select private.clerk_organization_role()) = 'member'
  and clerk_user_id = (select private.clerk_user_id())
  and exists (
    select 1
    from public.organizations as organization
    where organization.id = store_memberships.organization_id
      and organization.clerk_organization_id =
        (select private.clerk_organization_id())
  )
);

revoke all on table public.organizations from public, anon, authenticated;
revoke all on table public.stores from public, anon, authenticated;
revoke all on table public.store_memberships from public, anon, authenticated;

grant select on table public.organizations to authenticated;
grant select on table public.stores to authenticated;
grant select on table public.store_memberships to authenticated;
