create function public.resolve_active_organization_entitlement_facts()
returns table (
  trial_plan_code text,
  trial_valid_until timestamptz,
  subscription_plan_code text,
  subscription_status text,
  subscription_collection_paused boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_trial_plan_count bigint;
begin
  with resolution_context as materialized (
    select
      private.clerk_organization_id() as clerk_organization_id,
      pg_catalog.now() as resolved_at
  ),
  active_organization as materialized (
    select
      organization.id,
      resolution.resolved_at
    from public.organizations as organization
    cross join resolution_context as resolution
    where organization.clerk_organization_id =
      resolution.clerk_organization_id
  ),
  trial_facts as (
    select
      pg_catalog.count(distinct trial.plan_code) as plan_count,
      pg_catalog.min(trial.plan_code) as plan_code,
      pg_catalog.max(trial.ends_at) as valid_until
    from active_organization as organization
    left join public.billing_trial_grants as trial
      on trial.organization_id = organization.id
      and trial.revoked_at is null
      and trial.starts_at <= organization.resolved_at
      and organization.resolved_at < trial.ends_at
  )
  select
    trial.plan_count,
    trial.plan_code,
    trial.valid_until,
    subscription.plan_code,
    subscription.status,
    subscription.collection_paused
  into
    v_trial_plan_count,
    trial_plan_code,
    trial_valid_until,
    subscription_plan_code,
    subscription_status,
    subscription_collection_paused
  from active_organization as organization
  cross join trial_facts as trial
  left join public.billing_subscriptions as subscription
    on subscription.organization_id = organization.id;

  if not found then
    return;
  end if;

  if v_trial_plan_count > 1 then
    raise exception using
      errcode = 'P0001',
      message = 'Conflicting active Organization trial plans';
  end if;

  return next;
end;
$$;

alter function public.resolve_active_organization_entitlement_facts()
owner to postgres;

revoke all on function
  public.resolve_active_organization_entitlement_facts()
from public, anon, authenticated, service_role;

grant execute on function
  public.resolve_active_organization_entitlement_facts()
to authenticated;
