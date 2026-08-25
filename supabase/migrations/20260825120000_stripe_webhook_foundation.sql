create function public.apply_stripe_subscription_projection(
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
  p_collection_paused boolean
)
returns text
language plpgsql
volatile
security invoker
set search_path = ''
as $$
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
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.paid',
      'invoice.payment_failed'
    )
    or p_stripe_object_id is null
    or p_stripe_object_id = ''
    or p_stripe_object_id ~ '[[:space:]]'
    or p_stripe_created_at is null
    or p_stripe_customer_id !~ '^cus_[^[:space:]]+$'
    or p_stripe_subscription_id !~ '^sub_[^[:space:]]+$'
    or p_stripe_price_id !~ '^price_[^[:space:]]+$'
    or p_plan_code not in ('essential', 'multi_2', 'multi_3')
    or p_status not in (
      'active',
      'past_due',
      'incomplete',
      'incomplete_expired',
      'unpaid',
      'canceled',
      'paused',
      'trialing'
    )
    or p_current_period_end is null
    or p_livemode is null
    or p_cancel_at_period_end is null
    or p_collection_paused is null
  then
    raise exception using
      errcode = '22023',
      message = 'Invalid Stripe webhook projection input';
  end if;

  insert into public.stripe_webhook_events (
    stripe_event_id,
    event_type,
    stripe_object_id,
    livemode,
    stripe_created_at
  )
  values (
    p_stripe_event_id,
    p_event_type,
    p_stripe_object_id,
    p_livemode,
    p_stripe_created_at
  )
  on conflict (stripe_event_id) do nothing;

  get diagnostics v_inserted_count = row_count;

  if v_inserted_count = 0 then
    select event.*
    into strict v_existing_event
    from public.stripe_webhook_events as event
    where event.stripe_event_id = p_stripe_event_id
    for update;

    if v_existing_event.processed_at is not null then
      return 'duplicate';
    end if;

    if v_existing_event.event_type is distinct from p_event_type
      or v_existing_event.stripe_object_id is distinct from p_stripe_object_id
      or v_existing_event.livemode is distinct from p_livemode
      or v_existing_event.stripe_created_at is distinct from p_stripe_created_at
    then
      raise exception using
        errcode = '22023',
        message = 'Conflicting Stripe webhook Event metadata';
    end if;
  end if;

  select customer.organization_id
  into v_organization_id
  from public.billing_customers as customer
  where customer.stripe_customer_id = p_stripe_customer_id
    and customer.provisioning_status = 'ready';

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'Canonical Stripe Customer not found';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_organization_id::text, 0)
  );

  select subscription.*
  into v_existing_subscription
  from public.billing_subscriptions as subscription
  where subscription.organization_id = v_organization_id
  for update;

  v_has_existing_subscription := found;
  v_processed_at := pg_catalog.clock_timestamp();

  if v_has_existing_subscription
    and v_existing_subscription.stripe_subscription_id <>
      p_stripe_subscription_id
  then
    if v_existing_subscription.status in ('canceled', 'incomplete_expired')
      and p_status not in ('canceled', 'incomplete_expired')
    then
      null;
    elsif p_status in ('canceled', 'incomplete_expired') then
      update public.stripe_webhook_events
      set processed_at = v_processed_at
      where stripe_event_id = p_stripe_event_id;

      return 'ignored_non_canonical';
    else
      raise exception using
        errcode = 'P0001',
        message = 'Conflicting non-terminal Stripe Subscriptions';
    end if;
  end if;

  if p_status = 'past_due' then
    if v_has_existing_subscription
      and v_existing_subscription.stripe_subscription_id =
        p_stripe_subscription_id
      and v_existing_subscription.status = 'past_due'
    then
      v_past_due_since := v_existing_subscription.past_due_since;
    else
      v_past_due_since := v_processed_at;
    end if;
  else
    v_past_due_since := null;
  end if;

  insert into public.billing_subscriptions (
    organization_id,
    stripe_subscription_id,
    stripe_price_id,
    plan_code,
    status,
    current_period_end,
    cancel_at_period_end,
    collection_paused,
    past_due_since,
    last_synced_at
  )
  values (
    v_organization_id,
    p_stripe_subscription_id,
    p_stripe_price_id,
    p_plan_code,
    p_status,
    p_current_period_end,
    p_cancel_at_period_end,
    p_collection_paused,
    v_past_due_since,
    v_processed_at
  )
  on conflict (organization_id) do update
  set stripe_subscription_id = excluded.stripe_subscription_id,
      stripe_price_id = excluded.stripe_price_id,
      plan_code = excluded.plan_code,
      status = excluded.status,
      current_period_end = excluded.current_period_end,
      cancel_at_period_end = excluded.cancel_at_period_end,
      collection_paused = excluded.collection_paused,
      past_due_since = excluded.past_due_since,
      last_synced_at = excluded.last_synced_at;

  update public.stripe_webhook_events
  set processed_at = v_processed_at
  where stripe_event_id = p_stripe_event_id;

  return 'applied';
end;
$$;

revoke all on function public.apply_stripe_subscription_projection(
  text,
  text,
  text,
  boolean,
  timestamptz,
  text,
  text,
  text,
  text,
  text,
  timestamptz,
  boolean,
  boolean
)
from public, anon, authenticated;

grant execute on function public.apply_stripe_subscription_projection(
  text,
  text,
  text,
  boolean,
  timestamptz,
  text,
  text,
  text,
  text,
  text,
  timestamptz,
  boolean,
  boolean
)
to service_role;

revoke insert, update, delete, truncate, references, trigger
on table public.billing_customers from service_role;
revoke all on table public.billing_subscriptions from service_role;
revoke all on table public.stripe_webhook_events from service_role;

grant select on table public.billing_customers to service_role;
grant select, insert, update on table public.billing_subscriptions
to service_role;
grant select, insert, update on table public.stripe_webhook_events
to service_role;
