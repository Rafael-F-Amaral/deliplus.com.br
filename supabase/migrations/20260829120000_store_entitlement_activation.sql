create function private.plan_max_stores(
  p_plan_code text
)
returns integer
language plpgsql
immutable
strict
security invoker
set search_path = ''
as $$
begin
  case p_plan_code
    when 'essential' then
      return 1;
    when 'multi_2' then
      return 2;
    when 'multi_3' then
      return 3;
    else
      raise exception using
        errcode = '22023',
        message = 'Unsupported Store capacity plan';
  end case;
end;
$$;

alter function private.plan_max_stores(text)
owner to postgres;

revoke all on function private.plan_max_stores(text)
from public, anon, authenticated, service_role;

comment on function private.plan_max_stores(text) is
  'Closed SQL plan-capacity registry used only by transactional Store enforcement.';

create function private.resolve_organization_entitlement_facts(
  p_organization_id uuid,
  p_resolved_at timestamptz
)
returns table (
  trial_plan_code text,
  trial_valid_until timestamptz,
  subscription_plan_code text,
  subscription_status text,
  subscription_collection_paused boolean
)
language plpgsql
stable
strict
security invoker
set search_path = ''
as $$
declare
  v_trial_plan_count bigint;
begin
  with trial_facts as (
    select
      pg_catalog.count(distinct trial.plan_code) as plan_count,
      pg_catalog.min(trial.plan_code) as plan_code,
      pg_catalog.max(trial.ends_at) as valid_until
    from public.billing_trial_grants as trial
    where trial.organization_id = p_organization_id
      and trial.revoked_at is null
      and trial.starts_at <= p_resolved_at
      and p_resolved_at < trial.ends_at
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
  from trial_facts as trial
  left join public.billing_subscriptions as subscription
    on subscription.organization_id = p_organization_id;

  if v_trial_plan_count > 1 then
    raise exception using
      errcode = 'P0001',
      message = 'Conflicting active Organization trial plans';
  end if;

  return next;
end;
$$;

alter function private.resolve_organization_entitlement_facts(uuid, timestamptz)
owner to postgres;

revoke all on function
  private.resolve_organization_entitlement_facts(uuid, timestamptz)
from public, anon, authenticated, service_role;

comment on function
  private.resolve_organization_entitlement_facts(uuid, timestamptz) is
  'Resolves one Organization billing-fact snapshot at a caller-supplied database timestamp.';

create function private.resolve_effective_organization_entitlement(
  p_organization_id uuid,
  p_resolved_at timestamptz
)
returns table (
  entitled boolean,
  source text,
  plan_code text
)
language plpgsql
stable
strict
security invoker
set search_path = ''
as $$
declare
  v_facts record;
begin
  select facts.*
  into strict v_facts
  from private.resolve_organization_entitlement_facts(
    p_organization_id,
    p_resolved_at
  ) as facts;

  if (v_facts.trial_plan_code is null) <>
    (v_facts.trial_valid_until is null)
  then
    raise exception using
      errcode = 'P0001',
      message = 'Invalid Organization entitlement facts';
  end if;

  if (
    v_facts.subscription_plan_code is null
    or v_facts.subscription_status is null
    or v_facts.subscription_collection_paused is null
  ) and not (
    v_facts.subscription_plan_code is null
    and v_facts.subscription_status is null
    and v_facts.subscription_collection_paused is null
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'Invalid Organization entitlement facts';
  end if;

  if v_facts.trial_plan_code is not null then
    perform private.plan_max_stores(v_facts.trial_plan_code);
  end if;

  if v_facts.subscription_plan_code is not null then
    perform private.plan_max_stores(v_facts.subscription_plan_code);

    if v_facts.subscription_status not in (
      'active',
      'past_due',
      'incomplete',
      'incomplete_expired',
      'unpaid',
      'canceled',
      'paused',
      'trialing'
    ) then
      raise exception using
        errcode = 'P0001',
        message = 'Invalid Organization entitlement facts';
    end if;
  end if;

  if v_facts.subscription_status in ('active', 'past_due')
    and not v_facts.subscription_collection_paused
  then
    return query
    select
      true,
      'paid_subscription'::text,
      v_facts.subscription_plan_code;
    return;
  end if;

  if v_facts.trial_plan_code is not null then
    return query
    select
      true,
      'local_grant'::text,
      v_facts.trial_plan_code;
    return;
  end if;

  return query
  select false, null::text, null::text;
end;
$$;

alter function
  private.resolve_effective_organization_entitlement(uuid, timestamptz)
owner to postgres;

revoke all on function
  private.resolve_effective_organization_entitlement(uuid, timestamptz)
from public, anon, authenticated, service_role;

comment on function
  private.resolve_effective_organization_entitlement(uuid, timestamptz) is
  'Resolves paid-first effective entitlement from validated local billing facts.';

create or replace function public.resolve_active_organization_entitlement_facts()
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
  v_organization_id uuid;
  v_resolved_at timestamptz;
begin
  v_resolved_at := pg_catalog.now();

  select organization.id
  into v_organization_id
  from public.organizations as organization
  where organization.clerk_organization_id =
    private.clerk_organization_id();

  if not found then
    return;
  end if;

  return query
  select facts.*
  from private.resolve_organization_entitlement_facts(
    v_organization_id,
    v_resolved_at
  ) as facts;
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

comment on function public.resolve_active_organization_entitlement_facts() is
  'Returns minimal local entitlement facts for the active Clerk Organization.';

create function public.activate_store_within_entitlement(
  p_store_id uuid
)
returns table (
  outcome text
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_clerk_user_id text;
  v_clerk_organization_id text;
  v_clerk_organization_role text;
  v_organization_id uuid;
  v_store_status text;
  v_store_activated_at timestamptz;
  v_resolved_at timestamptz;
  v_entitled boolean;
  v_plan_code text;
  v_max_stores integer;
  v_active_store_count bigint;
  v_updated_store_count integer;
begin
  v_clerk_user_id := private.clerk_user_id();
  v_clerk_organization_id := private.clerk_organization_id();
  v_clerk_organization_role := private.clerk_organization_role();

  if v_clerk_user_id is null
    or pg_catalog.btrim(v_clerk_user_id) = ''
    or v_clerk_organization_id is null
    or pg_catalog.btrim(v_clerk_organization_id) = ''
    or v_clerk_organization_role is distinct from 'admin'
  then
    raise exception using
      errcode = '42501',
      message = 'Store entitlement activation is not authorized';
  end if;

  select organization.id
  into v_organization_id
  from public.organizations as organization
  where organization.clerk_organization_id = v_clerk_organization_id;

  if not found then
    return query
    select 'organization_not_provisioned'::text;
    return;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_organization_id::text, 0)
  );

  perform 1
  from public.organizations as organization
  where organization.id = v_organization_id
    and organization.clerk_organization_id = v_clerk_organization_id
  for update;

  if not found then
    return query
    select 'organization_not_provisioned'::text;
    return;
  end if;

  select store.status, store.activated_at
  into v_store_status, v_store_activated_at
  from public.stores as store
  where store.id = p_store_id
    and store.organization_id = v_organization_id
  for update;

  if not found then
    return query
    select 'store_unavailable'::text;
    return;
  end if;

  if v_store_status = 'active' and v_store_activated_at is not null then
    return query
    select 'already_active'::text;
    return;
  end if;

  if v_store_status = 'draft' and v_store_activated_at is null then
    return query
    select 'not_ready'::text;
    return;
  end if;

  if not (
    (v_store_status = 'ready' and v_store_activated_at is null)
    or (v_store_status = 'inactive' and v_store_activated_at is not null)
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'Store entitlement activation invariant violation';
  end if;

  v_resolved_at := pg_catalog.clock_timestamp();

  select entitlement.entitled, entitlement.plan_code
  into strict v_entitled, v_plan_code
  from private.resolve_effective_organization_entitlement(
    v_organization_id,
    v_resolved_at
  ) as entitlement;

  if not v_entitled then
    return query
    select 'not_entitled'::text;
    return;
  end if;

  v_max_stores := private.plan_max_stores(v_plan_code);

  select pg_catalog.count(*)
  into v_active_store_count
  from public.stores as store
  where store.organization_id = v_organization_id
    and store.status = 'active';

  if v_active_store_count >= v_max_stores then
    return query
    select 'capacity_reached'::text;
    return;
  end if;

  if v_store_status = 'ready' then
    update public.stores
    set
      status = 'active',
      activated_at = v_resolved_at
    where id = p_store_id
      and organization_id = v_organization_id
      and status = 'ready'
      and activated_at is null;
  else
    update public.stores
    set status = 'active'
    where id = p_store_id
      and organization_id = v_organization_id
      and status = 'inactive'
      and activated_at = v_store_activated_at;
  end if;

  get diagnostics v_updated_store_count = row_count;

  if v_updated_store_count <> 1 then
    raise exception using
      errcode = 'P0001',
      message = 'Store entitlement activation invariant violation';
  end if;

  return query
  select 'activated'::text;
end;
$$;

alter function public.activate_store_within_entitlement(uuid)
owner to postgres;

revoke all on function public.activate_store_within_entitlement(uuid)
from public, anon, authenticated, service_role;

grant execute on function public.activate_store_within_entitlement(uuid)
to authenticated;

comment on function public.activate_store_within_entitlement(uuid) is
  'Activates one ready or inactive Store when current Organization entitlement has capacity.';

create function public.deactivate_store(
  p_store_id uuid
)
returns table (
  outcome text
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_clerk_user_id text;
  v_clerk_organization_id text;
  v_clerk_organization_role text;
  v_organization_id uuid;
  v_store_status text;
  v_store_activated_at timestamptz;
  v_updated_store_count integer;
begin
  v_clerk_user_id := private.clerk_user_id();
  v_clerk_organization_id := private.clerk_organization_id();
  v_clerk_organization_role := private.clerk_organization_role();

  if v_clerk_user_id is null
    or pg_catalog.btrim(v_clerk_user_id) = ''
    or v_clerk_organization_id is null
    or pg_catalog.btrim(v_clerk_organization_id) = ''
    or v_clerk_organization_role is distinct from 'admin'
  then
    raise exception using
      errcode = '42501',
      message = 'Store deactivation is not authorized';
  end if;

  select organization.id
  into v_organization_id
  from public.organizations as organization
  where organization.clerk_organization_id = v_clerk_organization_id;

  if not found then
    return query
    select 'organization_not_provisioned'::text;
    return;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_organization_id::text, 0)
  );

  perform 1
  from public.organizations as organization
  where organization.id = v_organization_id
    and organization.clerk_organization_id = v_clerk_organization_id
  for update;

  if not found then
    return query
    select 'organization_not_provisioned'::text;
    return;
  end if;

  select store.status, store.activated_at
  into v_store_status, v_store_activated_at
  from public.stores as store
  where store.id = p_store_id
    and store.organization_id = v_organization_id
  for update;

  if not found then
    return query
    select 'store_unavailable'::text;
    return;
  end if;

  if v_store_status = 'inactive' and v_store_activated_at is not null then
    return query
    select 'already_inactive'::text;
    return;
  end if;

  if v_store_status in ('draft', 'ready')
    and v_store_activated_at is null
  then
    return query
    select 'not_active'::text;
    return;
  end if;

  if v_store_status <> 'active' or v_store_activated_at is null then
    raise exception using
      errcode = 'P0001',
      message = 'Store deactivation invariant violation';
  end if;

  update public.stores
  set status = 'inactive'
  where id = p_store_id
    and organization_id = v_organization_id
    and status = 'active'
    and activated_at = v_store_activated_at;

  get diagnostics v_updated_store_count = row_count;

  if v_updated_store_count <> 1 then
    raise exception using
      errcode = 'P0001',
      message = 'Store deactivation invariant violation';
  end if;

  return query
  select 'deactivated'::text;
end;
$$;

alter function public.deactivate_store(uuid)
owner to postgres;

revoke all on function public.deactivate_store(uuid)
from public, anon, authenticated, service_role;

grant execute on function public.deactivate_store(uuid)
to authenticated;

comment on function public.deactivate_store(uuid) is
  'Deactivates one active Store without changing its immutable first-activation timestamp.';
