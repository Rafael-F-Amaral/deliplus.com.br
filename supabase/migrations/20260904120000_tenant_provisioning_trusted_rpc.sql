create or replace function public.ensure_organization_projection(
  p_clerk_organization_id text
)
returns table (
  id uuid,
  clerk_organization_id text
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_clerk_organization_id text;
begin
  if p_clerk_organization_id is null
    or pg_catalog.btrim(p_clerk_organization_id) = ''
  then
    raise exception using
      errcode = '22023',
      message = 'Invalid Clerk Organization identifier';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      pg_catalog.concat(
        'deliplus:organization-projection:',
        p_clerk_organization_id
      ),
      0
    )
  );

  select organization.id, organization.clerk_organization_id
  into v_id, v_clerk_organization_id
  from public.organizations as organization
  where organization.clerk_organization_id = p_clerk_organization_id;

  if v_id is null then
    insert into public.organizations as organization (
      clerk_organization_id
    )
    values (
      p_clerk_organization_id
    )
    on conflict on constraint organizations_clerk_organization_id_key
      do nothing
    returning organization.id, organization.clerk_organization_id
    into v_id, v_clerk_organization_id;
  end if;

  if v_id is null then
    select organization.id, organization.clerk_organization_id
    into v_id, v_clerk_organization_id
    from public.organizations as organization
    where organization.clerk_organization_id = p_clerk_organization_id;
  end if;

  if v_id is null
    or v_clerk_organization_id is distinct from p_clerk_organization_id
  then
    raise exception using
      errcode = 'P0002',
      message = 'Organization projection could not be resolved';
  end if;

  return query
  select v_id, v_clerk_organization_id;
end;
$$;

alter function public.ensure_organization_projection(text)
owner to postgres;

revoke all on function public.ensure_organization_projection(text)
from public, anon, authenticated, service_role;

grant execute on function public.ensure_organization_projection(text)
to service_role;

revoke all on table public.organizations from service_role;

comment on function public.ensure_organization_projection(text) is
  'Idempotently creates or resolves one DeliPlus Organization projection for a trusted Clerk Organization identifier.';
