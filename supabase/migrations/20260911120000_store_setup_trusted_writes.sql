create or replace function public.create_store_draft(
  p_organization_id uuid,
  p_name text,
  p_slug text
)
returns table (
  id uuid,
  name text,
  slug text,
  status text,
  activated_at timestamptz,
  updated_at timestamptz
)
language sql
volatile
security definer
set search_path = ''
as $$
  insert into public.stores as store (
    organization_id,
    name,
    slug,
    status,
    activated_at
  )
  values (
    p_organization_id,
    p_name,
    p_slug,
    'draft',
    null
  )
  returning
    store.id,
    store.name,
    store.slug,
    store.status,
    store.activated_at,
    store.updated_at;
$$;

drop function if exists public.update_store_setup(
  uuid,
  uuid,
  timestamptz,
  text,
  text
);

create or replace function public.update_store_setup(
  p_organization_id uuid,
  p_store_id uuid,
  p_expected_updated_at timestamptz,
  p_set_name boolean,
  p_name text,
  p_set_slug boolean,
  p_slug text
)
returns table (
  id uuid,
  name text,
  slug text,
  status text,
  activated_at timestamptz,
  updated_at timestamptz
)
language sql
volatile
security definer
set search_path = ''
as $$
  update public.stores as store
  set
    name = case when p_set_name then p_name else store.name end,
    slug = case when p_set_slug then p_slug else store.slug end,
    status = case
      when store.status = 'ready' then 'draft'
      else store.status
    end
  where store.organization_id = p_organization_id
    and store.id = p_store_id
    and store.updated_at = p_expected_updated_at
    and store.status in ('draft', 'ready')
    and store.activated_at is null
    and (
      (p_set_name and p_name is distinct from store.name)
      or (p_set_slug and p_slug is distinct from store.slug)
    )
  returning
    store.id,
    store.name,
    store.slug,
    store.status,
    store.activated_at,
    store.updated_at;
$$;

create or replace function public.mark_store_ready(
  p_organization_id uuid,
  p_store_id uuid,
  p_expected_updated_at timestamptz
)
returns table (
  id uuid,
  name text,
  slug text,
  status text,
  activated_at timestamptz,
  updated_at timestamptz
)
language sql
volatile
security definer
set search_path = ''
as $$
  update public.stores as store
  set status = 'ready'
  where store.organization_id = p_organization_id
    and store.id = p_store_id
    and store.updated_at = p_expected_updated_at
    and store.status = 'draft'
    and store.activated_at is null
  returning
    store.id,
    store.name,
    store.slug,
    store.status,
    store.activated_at,
    store.updated_at;
$$;

alter function public.create_store_draft(uuid, text, text)
owner to postgres;

alter function public.update_store_setup(
  uuid,
  uuid,
  timestamptz,
  boolean,
  text,
  boolean,
  text
)
owner to postgres;

alter function public.mark_store_ready(uuid, uuid, timestamptz)
owner to postgres;

revoke all
on function public.create_store_draft(uuid, text, text)
from public, anon, authenticated, service_role;

revoke all
on function public.update_store_setup(
  uuid,
  uuid,
  timestamptz,
  boolean,
  text,
  boolean,
  text
)
from public, anon, authenticated, service_role;

revoke all
on function public.mark_store_ready(uuid, uuid, timestamptz)
from public, anon, authenticated, service_role;

grant execute
on function public.create_store_draft(uuid, text, text)
to service_role;

grant execute
on function public.update_store_setup(
  uuid,
  uuid,
  timestamptz,
  boolean,
  text,
  boolean,
  text
)
to service_role;

grant execute
on function public.mark_store_ready(uuid, uuid, timestamptz)
to service_role;

revoke all privileges on table public.stores from service_role;

comment on function public.create_store_draft(uuid, text, text) is
  'Creates one unactivated draft Store for an already-authorized Organization.';

comment on function public.update_store_setup(
  uuid,
  uuid,
  timestamptz,
  boolean,
  text,
  boolean,
  text
) is
  'Updates only Store setup name/slug with tenant and optimistic-concurrency predicates.';

comment on function public.mark_store_ready(uuid, uuid, timestamptz) is
  'Moves one authorized unactivated Store from draft to ready.';
