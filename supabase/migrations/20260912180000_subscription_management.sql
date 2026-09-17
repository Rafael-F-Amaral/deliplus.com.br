-- Subscription changes are coordinated with durable attempts while Stripe
-- remains authoritative. Only webhook projection writes entitlement facts.
alter table public.billing_subscriptions
  add column stripe_subscription_schedule_id text,
  add column pending_stripe_price_id text,
  add column pending_plan_code text,
  add column pending_effective_at timestamptz,
  add constraint billing_subscriptions_schedule_id_check check (
    stripe_subscription_schedule_id is null
    or stripe_subscription_schedule_id ~ '^sub_sched_[A-Za-z0-9]+$'
  ),
  add constraint billing_subscriptions_pending_price_id_check check (
    pending_stripe_price_id is null
    or pending_stripe_price_id ~ '^price_[A-Za-z0-9]+$'
  ),
  add constraint billing_subscriptions_pending_plan_code_check check (
    pending_plan_code is null
    or pending_plan_code in ('essential', 'multi_2', 'multi_3')
  ),
  add constraint billing_subscriptions_pending_change_complete_check check (
    pg_catalog.num_nonnulls(
      stripe_subscription_schedule_id,
      pending_stripe_price_id,
      pending_plan_code,
      pending_effective_at
    ) in (0, 4)
  ),
  add constraint billing_subscriptions_pending_effective_at_check check (
    pending_effective_at is null
    or (
      pg_catalog.isfinite(pending_effective_at)
      and pending_effective_at = current_period_end
    )
  ),
  add constraint billing_subscriptions_pending_downgrade_check check (
    pending_plan_code is null
    or case plan_code
      when 'multi_3' then pending_plan_code in ('multi_2', 'essential')
      when 'multi_2' then pending_plan_code = 'essential'
      else false
    end
  ),
  add constraint billing_subscriptions_stripe_schedule_id_key
    unique (stripe_subscription_schedule_id);
create table public.billing_subscription_change_attempts (
  id uuid primary key,
  organization_id uuid not null references public.billing_subscriptions (organization_id)
    on update restrict on delete restrict,
  operation_kind text not null check (
    operation_kind in ('upgrade', 'schedule_downgrade', 'cancel_scheduled_downgrade')
  ),
  state text not null check (
    state in ('claimed', 'provider_object_created', 'requested', 'recovery_required', 'ended')
  ),
  source_plan_code text not null check (source_plan_code in ('essential', 'multi_2', 'multi_3')),
  target_plan_code text check (target_plan_code in ('essential', 'multi_2', 'multi_3')),
  source_stripe_price_id text not null check (source_stripe_price_id ~ '^price_[A-Za-z0-9]+$'),
  target_stripe_price_id text check (target_stripe_price_id ~ '^price_[A-Za-z0-9]+$'),
  stripe_subscription_id text not null check (stripe_subscription_id ~ '^sub_[A-Za-z0-9]+$'),
  stripe_subscription_schedule_id text check (
    stripe_subscription_schedule_id ~ '^sub_sched_[A-Za-z0-9]+$'
  ),
  expected_period_end timestamptz not null,
  livemode boolean not null,
  stripe_api_version text not null check (
    stripe_api_version = '2026-07-29.dahlia'
  ),
  revision bigint not null default 0 check (revision >= 0),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  ended_at timestamptz,
  constraint billing_subscription_change_attempts_direction_check check (
    case operation_kind
      when 'upgrade' then
        target_plan_code is not null and target_stripe_price_id is not null
        and case source_plan_code
          when 'essential' then target_plan_code in ('multi_2', 'multi_3')
          when 'multi_2' then target_plan_code = 'multi_3'
          else false
        end
      when 'schedule_downgrade' then
        target_plan_code is not null and target_stripe_price_id is not null
        and case source_plan_code
          when 'multi_3' then target_plan_code in ('multi_2', 'essential')
          when 'multi_2' then target_plan_code = 'essential'
          else false
        end
      else target_plan_code is null and target_stripe_price_id is null
    end
  ),
  constraint billing_subscription_change_attempts_schedule_check check (
    (operation_kind = 'upgrade' and stripe_subscription_schedule_id is null)
    or (operation_kind = 'schedule_downgrade')
    or (
      operation_kind = 'cancel_scheduled_downgrade'
      and stripe_subscription_schedule_id is not null
    )
  ),
  constraint billing_subscription_change_attempts_lifecycle_check check (
    (state = 'ended') = (ended_at is not null)
    and (state <> 'provider_object_created' or stripe_subscription_schedule_id is not null)
    and (state not in ('requested', 'ended')
      or operation_kind <> 'schedule_downgrade'
      or stripe_subscription_schedule_id is not null)
  ),
  constraint billing_subscription_change_attempts_time_check check (
    pg_catalog.isfinite(expected_period_end)
    and pg_catalog.isfinite(created_at)
    and pg_catalog.isfinite(updated_at)
    and updated_at >= created_at
    and (ended_at is null or (pg_catalog.isfinite(ended_at) and ended_at >= created_at))
  )
);
create unique index billing_subscription_change_attempts_one_open_per_organization
  on public.billing_subscription_change_attempts (organization_id)
  where ended_at is null;
create index billing_subscription_change_attempts_organization_history
  on public.billing_subscription_change_attempts (organization_id, created_at desc);
create function private.guard_billing_subscription_change_attempt()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if (pg_catalog.to_jsonb(new) - array[
      'state', 'stripe_subscription_schedule_id', 'revision', 'updated_at', 'ended_at'
    ]) is distinct from
    (pg_catalog.to_jsonb(old) - array[
      'state', 'stripe_subscription_schedule_id', 'revision', 'updated_at', 'ended_at'
    ])
    or (old.stripe_subscription_schedule_id is not null
      and new.stripe_subscription_schedule_id is distinct from old.stripe_subscription_schedule_id)
    or old.state = 'ended'
    or new.revision <> old.revision + 1
    or not (
      (old.state = 'claimed' and new.state in ('provider_object_created', 'requested', 'recovery_required', 'ended'))
      or (old.state = 'provider_object_created' and new.state in ('requested', 'recovery_required', 'ended'))
      or (old.state = 'requested' and new.state in ('recovery_required', 'ended'))
      or (old.state = 'recovery_required' and new.state in (
        'provider_object_created', 'requested', 'recovery_required', 'ended'
      ))
    )
  then
    raise exception using errcode = '22023', message = 'Invalid subscription-change attempt transition';
  end if;
  new.updated_at := pg_catalog.clock_timestamp();
  return new;
end;
$$;
create trigger billing_subscription_change_attempts_guard
before update on public.billing_subscription_change_attempts
for each row execute function private.guard_billing_subscription_change_attempt();
create function public.claim_billing_subscription_change(
  p_organization_id uuid,
  p_operation_kind text,
  p_source_plan_code text,
  p_target_plan_code text,
  p_source_stripe_price_id text,
  p_target_stripe_price_id text,
  p_stripe_subscription_id text,
  p_stripe_subscription_schedule_id text,
  p_expected_period_end timestamptz,
  p_livemode boolean
)
returns table(outcome text, attempt jsonb)
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_subscription public.billing_subscriptions;
  v_attempt public.billing_subscription_change_attempts;
  v_id uuid;
  v_now timestamptz;
begin
  perform private.lock_checkout_organization(p_organization_id);
  select subscription.* into v_subscription
  from public.billing_subscriptions as subscription
  where subscription.organization_id = p_organization_id for update;

  if not found then
    return query select 'no_paid_subscription'::text, null::jsonb;
    return;
  end if;

  if v_subscription.status <> 'active'
    or v_subscription.collection_paused
    or v_subscription.cancel_at_period_end
    or v_subscription.plan_code is distinct from p_source_plan_code
    or v_subscription.stripe_price_id is distinct from p_source_stripe_price_id
    or v_subscription.stripe_subscription_id is distinct from p_stripe_subscription_id
    or v_subscription.current_period_end is distinct from p_expected_period_end
    or p_livemode is null
  then
    return query select 'subscription_not_manageable'::text, null::jsonb;
    return;
  end if;

  if p_operation_kind = 'cancel_scheduled_downgrade' then
    if v_subscription.stripe_subscription_schedule_id is null then
      return query select 'no_scheduled_change'::text, null::jsonb;
      return;
    end if;
    if v_subscription.stripe_subscription_schedule_id is distinct from p_stripe_subscription_schedule_id then
      return query select 'subscription_not_manageable'::text, null::jsonb;
      return;
    end if;
  elsif v_subscription.stripe_subscription_schedule_id is not null then
    return query select 'scheduled_change_exists'::text, null::jsonb;
    return;
  end if;

  select change.* into v_attempt
  from public.billing_subscription_change_attempts as change
  where change.organization_id = p_organization_id and change.ended_at is null
  for update;

  if found then
    if v_attempt.operation_kind = p_operation_kind
      and v_attempt.source_plan_code = p_source_plan_code
      and v_attempt.target_plan_code is not distinct from p_target_plan_code
      and v_attempt.source_stripe_price_id = p_source_stripe_price_id
      and v_attempt.target_stripe_price_id is not distinct from p_target_stripe_price_id
      and v_attempt.stripe_subscription_id = p_stripe_subscription_id
      and (
        p_operation_kind = 'schedule_downgrade'
        or v_attempt.stripe_subscription_schedule_id is not distinct from p_stripe_subscription_schedule_id
      )
      and v_attempt.expected_period_end = p_expected_period_end
      and v_attempt.livemode = p_livemode
    then
      return query select 'attempt'::text, pg_catalog.to_jsonb(v_attempt);
    else
      return query select 'plan_change_in_progress'::text, pg_catalog.to_jsonb(v_attempt);
    end if;
    return;
  end if;

  if p_operation_kind not in ('upgrade', 'schedule_downgrade', 'cancel_scheduled_downgrade')
    or p_source_plan_code not in ('essential', 'multi_2', 'multi_3')
    or p_source_stripe_price_id !~ '^price_[A-Za-z0-9]+$'
    or p_stripe_subscription_id !~ '^sub_[A-Za-z0-9]+$'
    or p_expected_period_end is null
    or not pg_catalog.isfinite(p_expected_period_end)
  then
    raise exception using errcode = '22023', message = 'Invalid subscription-change claim';
  end if;

  v_id := pg_catalog.gen_random_uuid();
  v_now := pg_catalog.clock_timestamp();
  insert into public.billing_subscription_change_attempts (
    id, organization_id, operation_kind, state, source_plan_code,
    target_plan_code, source_stripe_price_id, target_stripe_price_id,
    stripe_subscription_id, stripe_subscription_schedule_id,
    expected_period_end, livemode, stripe_api_version, created_at, updated_at
  ) values (
    v_id, p_organization_id, p_operation_kind, 'claimed', p_source_plan_code,
    p_target_plan_code, p_source_stripe_price_id, p_target_stripe_price_id,
    p_stripe_subscription_id, p_stripe_subscription_schedule_id,
    p_expected_period_end, p_livemode, '2026-07-29.dahlia', v_now, v_now
  ) returning * into v_attempt;
  return query select 'attempt'::text, pg_catalog.to_jsonb(v_attempt);
end;
$$;
create function public.advance_billing_subscription_change(
  p_organization_id uuid,
  p_attempt_id uuid,
  p_expected_revision bigint,
  p_expected_state text,
  p_stripe_subscription_schedule_id text,
  p_state text
)
returns table(outcome text, attempt jsonb)
language plpgsql volatile security definer set search_path = '' as $$
declare v_attempt public.billing_subscription_change_attempts;
begin
  perform private.lock_checkout_organization(p_organization_id);
  select change.* into strict v_attempt
  from public.billing_subscription_change_attempts as change
  where change.organization_id = p_organization_id and change.id = p_attempt_id
  for update;

  if v_attempt.state = p_state
    and v_attempt.stripe_subscription_schedule_id is not distinct from p_stripe_subscription_schedule_id
  then
    return query select 'attempt'::text, pg_catalog.to_jsonb(v_attempt);
    return;
  end if;
  if v_attempt.revision is distinct from p_expected_revision
    or v_attempt.state is distinct from p_expected_state
    or v_attempt.ended_at is not null
  then
    return query select 'stale'::text, pg_catalog.to_jsonb(v_attempt);
    return;
  end if;
  update public.billing_subscription_change_attempts
  set state = p_state,
      stripe_subscription_schedule_id = p_stripe_subscription_schedule_id,
      revision = revision + 1
  where id = p_attempt_id and organization_id = p_organization_id
  returning * into v_attempt;
  return query select 'attempt'::text, pg_catalog.to_jsonb(v_attempt);
end;
$$;
-- Command completion never changes entitlement. Normal success is closed by
-- composite webhook projection; this CAS boundary is reserved for a trusted
-- service that has independently established a terminal/recoverable outcome.
create function public.end_billing_subscription_change(
  p_organization_id uuid,
  p_attempt_id uuid,
  p_expected_revision bigint,
  p_expected_state text
)
returns table(outcome text, attempt jsonb)
language plpgsql volatile security definer set search_path = '' as $$
declare v_attempt public.billing_subscription_change_attempts;
begin
  perform private.lock_checkout_organization(p_organization_id);
  select change.* into strict v_attempt
  from public.billing_subscription_change_attempts as change
  where change.organization_id = p_organization_id and change.id = p_attempt_id
  for update;
  if v_attempt.state = 'ended' then
    return query select 'attempt'::text, pg_catalog.to_jsonb(v_attempt);
    return;
  end if;
  if v_attempt.revision is distinct from p_expected_revision
    or v_attempt.state is distinct from p_expected_state
  then
    return query select 'stale'::text, pg_catalog.to_jsonb(v_attempt);
    return;
  end if;
  update public.billing_subscription_change_attempts
  set state = 'ended', ended_at = pg_catalog.clock_timestamp(), revision = revision + 1
  where id = p_attempt_id and organization_id = p_organization_id
  returning * into v_attempt;
  return query select 'attempt'::text, pg_catalog.to_jsonb(v_attempt);
end;
$$;
create function public.apply_stripe_subscription_management_projection(
  p_stripe_event_id text,
  p_event_type text,
  p_stripe_object_id text,
  p_livemode boolean,
  p_stripe_created_at timestamptz,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_stripe_price_id text,
  p_plan_code text,
  p_status text,
  p_current_period_end timestamptz,
  p_cancel_at_period_end boolean,
  p_collection_paused boolean,
  p_stripe_subscription_schedule_id text,
  p_pending_stripe_price_id text,
  p_pending_plan_code text,
  p_pending_effective_at timestamptz
)
returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_inserted_count integer;
  v_existing_event public.stripe_webhook_events%rowtype;
  v_organization_id uuid;
  v_existing_subscription public.billing_subscriptions%rowtype;
  v_has_existing_subscription boolean;
  v_processed_at timestamptz;
  v_past_due_since timestamptz;
begin
  if p_stripe_event_id !~ '^evt_[^[:space:]]+$'
    or p_event_type not in (
      'checkout.session.completed', 'customer.subscription.created',
      'customer.subscription.updated', 'customer.subscription.deleted',
      'customer.subscription.pending_update_applied',
      'customer.subscription.pending_update_expired',
      'invoice.paid', 'invoice.payment_failed',
      'subscription_schedule.updated', 'subscription_schedule.released',
      'subscription_schedule.completed', 'subscription_schedule.canceled',
      'subscription_schedule.aborted'
    )
    or p_stripe_object_id is null or p_stripe_object_id = ''
    or p_stripe_object_id ~ '[[:space:]]'
    or p_stripe_created_at is null
    or p_stripe_customer_id !~ '^cus_[^[:space:]]+$'
    or p_stripe_subscription_id !~ '^sub_[^[:space:]]+$'
    or p_stripe_price_id !~ '^price_[^[:space:]]+$'
    or p_plan_code not in ('essential', 'multi_2', 'multi_3')
    or p_status not in ('active', 'past_due', 'incomplete', 'incomplete_expired', 'unpaid', 'canceled', 'paused', 'trialing')
    or p_current_period_end is null or p_livemode is null
    or p_cancel_at_period_end is null or p_collection_paused is null
    or pg_catalog.num_nonnulls(
      p_stripe_subscription_schedule_id, p_pending_stripe_price_id,
      p_pending_plan_code, p_pending_effective_at
    ) not in (0, 4)
    or (p_stripe_subscription_schedule_id is not null
      and p_stripe_subscription_schedule_id !~ '^sub_sched_[^[:space:]]+$')
    or (p_pending_stripe_price_id is not null
      and p_pending_stripe_price_id !~ '^price_[^[:space:]]+$')
    or (p_pending_plan_code is not null
      and p_pending_plan_code not in ('essential', 'multi_2', 'multi_3'))
    or (p_pending_effective_at is not null
      and p_pending_effective_at is distinct from p_current_period_end)
  then
    raise exception using errcode = '22023', message = 'Invalid Stripe management projection input';
  end if;

  insert into public.stripe_webhook_events (
    stripe_event_id, event_type, stripe_object_id, livemode, stripe_created_at
  ) values (
    p_stripe_event_id, p_event_type, p_stripe_object_id, p_livemode, p_stripe_created_at
  ) on conflict (stripe_event_id) do nothing;
  get diagnostics v_inserted_count = row_count;

  if v_inserted_count = 0 then
    select event.* into strict v_existing_event
    from public.stripe_webhook_events as event
    where event.stripe_event_id = p_stripe_event_id for update;
    if v_existing_event.processed_at is not null then return 'duplicate'; end if;
    if v_existing_event.event_type is distinct from p_event_type
      or v_existing_event.stripe_object_id is distinct from p_stripe_object_id
      or v_existing_event.livemode is distinct from p_livemode
      or v_existing_event.stripe_created_at is distinct from p_stripe_created_at
    then
      raise exception using errcode = '22023', message = 'Conflicting Stripe webhook Event metadata';
    end if;
  end if;

  select customer.organization_id into v_organization_id
  from public.billing_customers as customer
  where customer.stripe_customer_id = p_stripe_customer_id
    and customer.provisioning_status = 'ready';
  if not found then
    raise exception using errcode = 'P0001', message = 'Canonical Stripe Customer not found';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_organization_id::text, 0));
  select subscription.* into v_existing_subscription
  from public.billing_subscriptions as subscription
  where subscription.organization_id = v_organization_id for update;
  v_has_existing_subscription := found;
  v_processed_at := pg_catalog.clock_timestamp();

  if v_has_existing_subscription
    and v_existing_subscription.stripe_subscription_id <> p_stripe_subscription_id
  then
    if v_existing_subscription.status in ('canceled', 'incomplete_expired')
      and p_status not in ('canceled', 'incomplete_expired') then null;
    elsif p_status in ('canceled', 'incomplete_expired') then
      update public.stripe_webhook_events set processed_at = v_processed_at
      where stripe_event_id = p_stripe_event_id;
      return 'ignored_non_canonical';
    else
      raise exception using errcode = 'P0001', message = 'Conflicting non-terminal Stripe Subscriptions';
    end if;
  end if;

  if p_status = 'past_due' then
    if v_has_existing_subscription
      and v_existing_subscription.stripe_subscription_id = p_stripe_subscription_id
      and v_existing_subscription.status = 'past_due'
    then v_past_due_since := v_existing_subscription.past_due_since;
    else v_past_due_since := v_processed_at;
    end if;
  else v_past_due_since := null;
  end if;

  insert into public.billing_subscriptions (
    organization_id, stripe_subscription_id, stripe_price_id, plan_code,
    status, current_period_end, cancel_at_period_end, collection_paused,
    past_due_since, last_synced_at, stripe_subscription_schedule_id,
    pending_stripe_price_id, pending_plan_code, pending_effective_at
  ) values (
    v_organization_id, p_stripe_subscription_id, p_stripe_price_id, p_plan_code,
    p_status, p_current_period_end, p_cancel_at_period_end, p_collection_paused,
    v_past_due_since, v_processed_at, p_stripe_subscription_schedule_id,
    p_pending_stripe_price_id, p_pending_plan_code, p_pending_effective_at
  ) on conflict (organization_id) do update set
    stripe_subscription_id = excluded.stripe_subscription_id,
    stripe_price_id = excluded.stripe_price_id,
    plan_code = excluded.plan_code,
    status = excluded.status,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = excluded.cancel_at_period_end,
    collection_paused = excluded.collection_paused,
    past_due_since = excluded.past_due_since,
    last_synced_at = excluded.last_synced_at,
    stripe_subscription_schedule_id = excluded.stripe_subscription_schedule_id,
    pending_stripe_price_id = excluded.pending_stripe_price_id,
    pending_plan_code = excluded.pending_plan_code,
    pending_effective_at = excluded.pending_effective_at;

  update public.billing_subscription_change_attempts as change
  set state = 'ended', ended_at = v_processed_at, revision = revision + 1
  where change.organization_id = v_organization_id
    and change.ended_at is null
    and (
      (change.operation_kind = 'upgrade' and (
        (p_plan_code = change.target_plan_code and p_stripe_price_id = change.target_stripe_price_id)
        or (p_event_type = 'customer.subscription.pending_update_expired'
          and p_plan_code = change.source_plan_code
          and p_stripe_price_id = change.source_stripe_price_id)
      ))
      or (change.operation_kind = 'schedule_downgrade' and (
        (p_stripe_subscription_schedule_id = change.stripe_subscription_schedule_id
          and p_pending_plan_code = change.target_plan_code
          and p_pending_stripe_price_id = change.target_stripe_price_id)
        or (p_plan_code = change.target_plan_code and p_stripe_price_id = change.target_stripe_price_id)
        or (p_event_type in (
          'subscription_schedule.released', 'subscription_schedule.completed',
          'subscription_schedule.canceled', 'subscription_schedule.aborted'
        ) and p_stripe_subscription_schedule_id is null)
      ))
      or (change.operation_kind = 'cancel_scheduled_downgrade'
        and p_stripe_subscription_schedule_id is null)
    );

  update public.stripe_webhook_events set processed_at = v_processed_at
  where stripe_event_id = p_stripe_event_id;
  return 'applied';
end;
$$;
create function public.resolve_active_organization_billing_state()
returns table (
  plan_code text,
  status text,
  current_period_end timestamptz,
  cancel_at_period_end boolean,
  collection_paused boolean,
  pending_plan_code text,
  pending_effective_at timestamptz,
  plan_change_in_progress boolean
)
language sql stable security definer set search_path = '' as $$
  select
    subscription.plan_code,
    subscription.status,
    subscription.current_period_end,
    subscription.cancel_at_period_end,
    subscription.collection_paused,
    subscription.pending_plan_code,
    subscription.pending_effective_at,
    exists (
      select 1 from public.billing_subscription_change_attempts as change
      where change.organization_id = organization.id and change.ended_at is null
    )
  from public.organizations as organization
  join public.billing_subscriptions as subscription
    on subscription.organization_id = organization.id
  where organization.clerk_organization_id = private.clerk_organization_id();
$$;
alter table public.billing_subscription_change_attempts enable row level security;
revoke all on public.billing_subscription_change_attempts from public, anon, authenticated, service_role;
alter function private.guard_billing_subscription_change_attempt() owner to postgres;
revoke all on function private.guard_billing_subscription_change_attempt()
from public, anon, authenticated, service_role;
alter function public.claim_billing_subscription_change(
  uuid, text, text, text, text, text, text, text, timestamptz, boolean
) owner to postgres;
alter function public.advance_billing_subscription_change(
  uuid, uuid, bigint, text, text, text
) owner to postgres;
alter function public.end_billing_subscription_change(
  uuid, uuid, bigint, text
) owner to postgres;
alter function public.apply_stripe_subscription_management_projection(
  text, text, text, boolean, timestamptz, text, text, text, text, text,
  timestamptz, boolean, boolean, text, text, text, timestamptz
) owner to postgres;
alter function public.resolve_active_organization_billing_state() owner to postgres;
revoke all on function public.claim_billing_subscription_change(
  uuid, text, text, text, text, text, text, text, timestamptz, boolean
), public.advance_billing_subscription_change(
  uuid, uuid, bigint, text, text, text
), public.end_billing_subscription_change(
  uuid, uuid, bigint, text
), public.apply_stripe_subscription_management_projection(
  text, text, text, boolean, timestamptz, text, text, text, text, text,
  timestamptz, boolean, boolean, text, text, text, timestamptz
), public.resolve_active_organization_billing_state()
from public, anon, authenticated, service_role;
grant execute on function public.claim_billing_subscription_change(
  uuid, text, text, text, text, text, text, text, timestamptz, boolean
), public.advance_billing_subscription_change(
  uuid, uuid, bigint, text, text, text
), public.end_billing_subscription_change(
  uuid, uuid, bigint, text
), public.apply_stripe_subscription_management_projection(
  text, text, text, boolean, timestamptz, text, text, text, text, text,
  timestamptz, boolean, boolean, text, text, text, timestamptz
) to service_role;
grant execute on function public.resolve_active_organization_billing_state()
to authenticated;
comment on table public.billing_subscription_change_attempts is
  'Durable service-only coordination for one Stripe plan mutation per Organization.';
comment on function public.resolve_active_organization_billing_state() is
  'Returns provider-ID-free billing facts for the active Clerk Organization.';
