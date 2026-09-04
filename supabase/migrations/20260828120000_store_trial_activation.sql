create function public.activate_first_store_with_initial_trial(
  p_store_id uuid
)
returns table (
  outcome text,
  trial_ends_at timestamptz
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
  v_store public.stores%rowtype;
  v_initial_grant public.billing_trial_grants%rowtype;
  v_started_at timestamptz;
  v_has_organization_initial_trial boolean := false;
  v_has_user_initial_trial boolean := false;
  v_has_paid_entitlement boolean := false;
  v_has_manual_override boolean := false;
  v_historically_activated_store_count bigint;
  v_matching_first_store_count bigint;
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
      message = 'Store trial activation is not authorized';
  end if;

  select organization.id
  into v_organization_id
  from public.organizations as organization
  where organization.clerk_organization_id = v_clerk_organization_id;

  if not found then
    return query
    select
      'organization_not_provisioned'::text,
      null::timestamptz;
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
    select
      'organization_not_provisioned'::text,
      null::timestamptz;
    return;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('deliplus:initial-trial-user'),
    pg_catalog.hashtext(v_clerk_user_id)
  );

  select store.*
  into v_store
  from public.stores as store
  where store.id = p_store_id
    and store.organization_id = v_organization_id
  for update;

  if not found then
    return query
    select 'store_unavailable'::text, null::timestamptz;
    return;
  end if;

  v_started_at := pg_catalog.now();

  select trial.*
  into v_initial_grant
  from public.billing_trial_grants as trial
  where trial.organization_id = v_organization_id
    and trial.grant_kind = 'initial'
  for update;

  v_has_organization_initial_trial := found;

  perform 1
  from public.billing_trial_grants as trial
  where trial.clerk_user_id = v_clerk_user_id
    and trial.grant_kind = 'initial'
  for update;

  v_has_user_initial_trial := found;

  perform 1
  from public.billing_subscriptions as subscription
  where subscription.organization_id = v_organization_id
    and subscription.status in ('active', 'past_due')
    and not subscription.collection_paused
  for update;

  v_has_paid_entitlement := found;

  perform 1
  from public.billing_trial_grants as trial
  where trial.organization_id = v_organization_id
    and trial.grant_kind = 'manual_override'
    and trial.revoked_at is null
    and trial.starts_at <= v_started_at
    and v_started_at < trial.ends_at
  order by trial.id
  for update;

  v_has_manual_override := found;

  if v_store.status = 'active' and v_store.activated_at is not null then
    if not v_has_organization_initial_trial then
      raise exception using
        errcode = 'P0001',
        message = 'Store trial activation invariant violation';
    end if;

    if v_initial_grant.revoked_at is not null
      or v_started_at < v_initial_grant.starts_at
      or v_started_at >= v_initial_grant.ends_at
    then
      return query
      select 'trial_not_eligible'::text, null::timestamptz;
      return;
    end if;

    if v_initial_grant.plan_code <> 'essential'
      or v_initial_grant.ends_at - v_initial_grant.starts_at <>
        interval '15 days'
      or v_store.activated_at <> v_initial_grant.starts_at
    then
      raise exception using
        errcode = 'P0001',
        message = 'Store trial activation invariant violation';
    end if;

    select pg_catalog.count(*)
    into v_matching_first_store_count
    from public.stores as store
    where store.organization_id = v_organization_id
      and store.activated_at = v_initial_grant.starts_at;

    if v_matching_first_store_count <> 1 then
      raise exception using
        errcode = 'P0001',
        message = 'Store trial activation invariant violation';
    end if;

    return query
    select
      'already_activated'::text,
      v_initial_grant.ends_at;
    return;
  end if;

  if v_store.status = 'draft' and v_store.activated_at is null then
    return query
    select 'not_ready'::text, null::timestamptz;
    return;
  end if;

  if v_store.status = 'inactive' and v_store.activated_at is not null then
    return query
    select 'trial_not_eligible'::text, null::timestamptz;
    return;
  end if;

  if v_store.status <> 'ready' or v_store.activated_at is not null then
    raise exception using
      errcode = 'P0001',
      message = 'Store trial activation invariant violation';
  end if;

  if v_has_paid_entitlement
    or v_has_manual_override
    or v_has_organization_initial_trial
    or v_has_user_initial_trial
  then
    return query
    select 'trial_not_eligible'::text, null::timestamptz;
    return;
  end if;

  select pg_catalog.count(*)
  into v_historically_activated_store_count
  from public.stores as store
  where store.organization_id = v_organization_id
    and store.activated_at is not null;

  if v_historically_activated_store_count > 1 then
    raise exception using
      errcode = 'P0001',
      message = 'Store trial activation invariant violation';
  end if;

  if v_historically_activated_store_count = 1 then
    return query
    select 'trial_not_eligible'::text, null::timestamptz;
    return;
  end if;

  insert into public.billing_trial_grants (
    organization_id,
    clerk_user_id,
    grant_kind,
    plan_code,
    starts_at,
    ends_at
  )
  values (
    v_organization_id,
    v_clerk_user_id,
    'initial',
    'essential',
    v_started_at,
    v_started_at + interval '15 days'
  );

  update public.stores
  set
    status = 'active',
    activated_at = v_started_at
  where id = p_store_id
    and organization_id = v_organization_id
    and status = 'ready'
    and activated_at is null;

  get diagnostics v_updated_store_count = row_count;

  if v_updated_store_count <> 1 then
    raise exception using
      errcode = 'P0001',
      message = 'Store trial activation invariant violation';
  end if;

  return query
  select
    'activated'::text,
    v_started_at + interval '15 days';
end;
$$;

alter function public.activate_first_store_with_initial_trial(uuid)
owner to postgres;

revoke all on function
  public.activate_first_store_with_initial_trial(uuid)
from public, anon, authenticated, service_role;

grant execute on function
  public.activate_first_store_with_initial_trial(uuid)
to authenticated;

comment on function public.activate_first_store_with_initial_trial(uuid) is
  'Atomically activates the first ready Store and grants one eligible 15-day Essential trial. Uses the Organization advisory lock convention shared with billing projection writes and a Clerk User transaction lock.';
