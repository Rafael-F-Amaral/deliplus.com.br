-- Convert the published custom plan-change journal to the approved hybrid
-- model: Stripe Customer Portal owns upgrades, while Deli Plus keeps only the
-- custom scheduled-downgrade and scheduled-change cancellation commands.
begin;

lock table public.billing_subscription_change_attempts in access exclusive mode;

-- Upgrade attempts are obsolete command-journal records, not entitlement
-- facts. The linked Sandbox audit found zero rows; this remains deterministic
-- for any environment that accumulated them before this correction.
delete from public.billing_subscription_change_attempts
where operation_kind = 'upgrade';

alter table public.billing_subscription_change_attempts
  drop constraint billing_subscription_change_attempts_operation_kind_check,
  drop constraint billing_subscription_change_attempts_direction_check,
  drop constraint billing_subscription_change_attempts_schedule_check,
  add constraint billing_subscription_change_attempts_operation_kind_check check (
    operation_kind in ('schedule_downgrade', 'cancel_scheduled_downgrade')
  ),
  add constraint billing_subscription_change_attempts_direction_check check (
    case operation_kind
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
  add constraint billing_subscription_change_attempts_schedule_check check (
    operation_kind = 'schedule_downgrade'
    or (
      operation_kind = 'cancel_scheduled_downgrade'
      and stripe_subscription_schedule_id is not null
    )
  );

create or replace function public.claim_billing_subscription_change(
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

  if p_operation_kind not in ('schedule_downgrade', 'cancel_scheduled_downgrade')
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

create or replace function public.apply_stripe_subscription_management_projection(
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
      (change.operation_kind = 'schedule_downgrade' and (
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

revoke all on function public.end_billing_subscription_change(
  uuid, uuid, bigint, text
) from public, anon, authenticated, service_role;
drop function public.end_billing_subscription_change(uuid, uuid, bigint, text);

alter function public.claim_billing_subscription_change(
  uuid, text, text, text, text, text, text, text, timestamptz, boolean
) owner to postgres;
alter function public.apply_stripe_subscription_management_projection(
  text, text, text, boolean, timestamptz, text, text, text, text, text,
  timestamptz, boolean, boolean, text, text, text, timestamptz
) owner to postgres;

revoke all on function public.claim_billing_subscription_change(
  uuid, text, text, text, text, text, text, text, timestamptz, boolean
), public.apply_stripe_subscription_management_projection(
  text, text, text, boolean, timestamptz, text, text, text, text, text,
  timestamptz, boolean, boolean, text, text, text, timestamptz
) from public, anon, authenticated, service_role;

grant execute on function public.claim_billing_subscription_change(
  uuid, text, text, text, text, text, text, text, timestamptz, boolean
), public.apply_stripe_subscription_management_projection(
  text, text, text, boolean, timestamptz, text, text, text, text, text,
  timestamptz, boolean, boolean, text, text, text, timestamptz
) to service_role;

comment on table public.billing_subscription_change_attempts is
  'Durable service-only coordination for one custom scheduled-downgrade mutation per Organization.';

commit;
