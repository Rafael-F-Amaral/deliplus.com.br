-- Customer/Checkout writes are service-only RPC capabilities, not table CRUD.
-- Network calls belong between these short transactions, never inside them.
create table public.billing_checkout_attempts (
  id uuid primary key,
  organization_id uuid not null references public.billing_customers (organization_id)
    on update restrict on delete restrict,
  plan_code text not null check (plan_code in ('essential', 'multi_2', 'multi_3')),
  stripe_price_id text not null check (stripe_price_id ~ '^price_[A-Za-z0-9]+$'),
  stripe_customer_id text not null check (stripe_customer_id ~ '^cus_[A-Za-z0-9]+$'),
  stripe_idempotency_key text not null unique,
  stripe_checkout_session_id text unique check (stripe_checkout_session_id ~ '^cs_[A-Za-z0-9_]+$'),
  state text not null check (state in ('creating', 'open', 'completed', 'recovery_required', 'ended')),
  expires_at timestamptz not null,
  success_url text not null check (success_url ~ '^https?://[^[:space:]]+/dashboard/billing/success$'),
  cancel_url text not null check (cancel_url ~ '^https?://[^[:space:]]+/dashboard/billing$'),
  payment_method_configuration_id text not null check (payment_method_configuration_id ~ '^pmc_[A-Za-z0-9]+$'),
  integration_identifier text not null check (integration_identifier ~ '^deliplus-checkout-[a-z]{8}$'),
  payload_version integer not null check (payload_version > 0),
  stripe_api_version text not null check (stripe_api_version ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}\.[a-z]+$'),
  livemode boolean not null,
  revision bigint not null default 0 check (revision >= 0),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  ended_at timestamptz,
  constraint billing_checkout_attempts_key_check check (
    stripe_idempotency_key = 'deli-plus:checkout:v1:' || id::text
    and pg_catalog.length(stripe_idempotency_key) <= 255
  ),
  constraint billing_checkout_attempts_time_check check (
    pg_catalog.isfinite(created_at) and pg_catalog.isfinite(updated_at)
    and pg_catalog.isfinite(expires_at) and expires_at > created_at
    and expires_at = pg_catalog.date_trunc('second', expires_at)
    and updated_at >= created_at
    and (ended_at is null or (pg_catalog.isfinite(ended_at) and ended_at >= created_at))
  ),
  constraint billing_checkout_attempts_lifecycle_check check (
    (state = 'ended') = (ended_at is not null)
    and (state <> 'creating' or stripe_checkout_session_id is null)
    and (state not in ('open', 'completed', 'ended') or stripe_checkout_session_id is not null)
  )
);

create unique index billing_checkout_attempts_one_pending_per_organization
  on public.billing_checkout_attempts (organization_id) where ended_at is null;
create index billing_checkout_attempts_organization_history
  on public.billing_checkout_attempts (organization_id, created_at);

create function private.guard_billing_checkout_attempt()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if (pg_catalog.to_jsonb(new) - array['state','stripe_checkout_session_id','revision','updated_at','ended_at'])
    is distinct from
    (pg_catalog.to_jsonb(old) - array['state','stripe_checkout_session_id','revision','updated_at','ended_at'])
    or (old.stripe_checkout_session_id is not null
      and new.stripe_checkout_session_id is distinct from old.stripe_checkout_session_id)
    or old.state = 'ended'
    or new.revision <> old.revision + 1
    or not (
      (old.state = 'creating' and new.state in ('open','completed','recovery_required'))
      or (old.state = 'open' and new.state in ('completed','recovery_required','ended'))
      or (old.state = 'completed' and new.state in ('recovery_required','ended'))
      or (old.state = 'recovery_required' and new.state in ('open','completed','ended','recovery_required'))
    ) then
    raise exception using errcode = '22023', message = 'Invalid Checkout attempt transition';
  end if;
  -- Unlike now(), this remains coherent when a transaction waited for a lock
  -- or created and reconciled an attempt within the same transaction.
  new.updated_at := pg_catalog.clock_timestamp();
  return new;
end;
$$;
create trigger billing_checkout_attempts_guard before update on public.billing_checkout_attempts
  for each row execute function private.guard_billing_checkout_attempt();

-- Common leading lock order: Organization advisory -> Organization -> Customer.
-- Matches trial, Store activation and webhook projection serialization.
create function private.lock_checkout_organization(p_organization_id uuid)
returns void language plpgsql volatile security invoker set search_path = '' as $$
begin
  if p_organization_id is null then
    raise exception using errcode = '22023', message = 'Invalid Checkout Organization';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_organization_id::text, 0));
  perform 1 from public.organizations as o where o.id = p_organization_id for update;
  if not found then
    raise exception using errcode = '22023', message = 'Checkout Organization unavailable';
  end if;
end;
$$;

create function public.claim_billing_customer(p_organization_id uuid)
returns public.billing_customers language plpgsql volatile security definer set search_path = '' as $$
declare v_customer public.billing_customers; v_now timestamptz;
begin
  perform private.lock_checkout_organization(p_organization_id);
  select c.* into v_customer from public.billing_customers as c
    where c.organization_id = p_organization_id for update;
  if found then return v_customer; end if;
  v_now := pg_catalog.clock_timestamp();
  insert into public.billing_customers
    (organization_id, provisioning_status, creation_idempotency_key, created_at, updated_at)
  values (p_organization_id, 'pending', 'deli-plus:customer:v1:' || pg_catalog.gen_random_uuid()::text, v_now, v_now)
  returning * into v_customer;
  return v_customer;
end;
$$;

create function public.finalize_billing_customer(
  p_organization_id uuid, p_creation_idempotency_key text, p_stripe_customer_id text
)
returns public.billing_customers language plpgsql volatile security definer set search_path = '' as $$
declare v_customer public.billing_customers;
begin
  perform private.lock_checkout_organization(p_organization_id);
  select c.* into strict v_customer from public.billing_customers as c
    where c.organization_id = p_organization_id for update;
  if p_creation_idempotency_key is distinct from v_customer.creation_idempotency_key
    or p_stripe_customer_id is null or p_stripe_customer_id !~ '^cus_[A-Za-z0-9]+$'
    or (v_customer.stripe_customer_id is not null and v_customer.stripe_customer_id <> p_stripe_customer_id)
  then
    raise exception using errcode = '22023', message = 'Conflicting canonical Customer finalization';
  end if;
  if v_customer.provisioning_status = 'ready' then return v_customer; end if;
  update public.billing_customers set stripe_customer_id = p_stripe_customer_id, provisioning_status = 'ready'
    where organization_id = p_organization_id returning * into v_customer;
  return v_customer;
end;
$$;

-- Read-only local guard. Existing incomplete subscriptions can only resume an
-- already-owned Session; the service verifies that correlation against Stripe.
create function private.checkout_subscription_blocker(p_organization_id uuid, p_has_attempt boolean)
returns text language plpgsql stable security invoker set search_path = '' as $$
declare v_subscription public.billing_subscriptions;
begin
  select s.* into v_subscription from public.billing_subscriptions as s where s.organization_id = p_organization_id;
  if not found or v_subscription.status in ('canceled','incomplete_expired') then return null; end if;
  if v_subscription.collection_paused then return 'billing_recovery_required'; end if;
  if v_subscription.status = 'active' then return 'already_subscribed'; end if;
  if v_subscription.status = 'incomplete' and p_has_attempt then return null; end if;
  return 'billing_recovery_required';
end;
$$;

create function public.claim_billing_checkout_attempt(
  p_organization_id uuid, p_plan_code text, p_stripe_price_id text, p_stripe_customer_id text,
  p_success_url text, p_cancel_url text, p_payment_method_configuration_id text, p_livemode boolean
)
returns table(outcome text, attempt jsonb)
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_customer public.billing_customers; v_attempt public.billing_checkout_attempts;
  v_blocker text; v_id uuid; v_now timestamptz; v_suffix text;
begin
  perform private.lock_checkout_organization(p_organization_id);
  select c.* into strict v_customer from public.billing_customers as c
    where c.organization_id = p_organization_id for update;
  if v_customer.provisioning_status <> 'ready'
    or v_customer.stripe_customer_id is distinct from p_stripe_customer_id then
    raise exception using errcode = '22023', message = 'Canonical Customer is not ready';
  end if;
  if p_plan_code is null or p_plan_code not in ('essential','multi_2','multi_3') then
    raise exception using errcode = '22023', message = 'Invalid Checkout plan';
  end if;
  select a.* into v_attempt from public.billing_checkout_attempts as a
    where a.organization_id = p_organization_id and a.ended_at is null for update;
  v_blocker := private.checkout_subscription_blocker(p_organization_id, v_attempt.id is not null);
  if v_blocker is not null then return query select v_blocker, null::jsonb; return; end if;
  if v_attempt.id is not null then
    if v_attempt.stripe_customer_id <> v_customer.stripe_customer_id then
      raise exception using errcode = '22023', message = 'Conflicting Checkout Customer';
    end if;
    return query select case when v_attempt.plan_code = p_plan_code then 'attempt' else 'checkout_in_progress' end,
      pg_catalog.to_jsonb(v_attempt); return;
  end if;
  v_id := pg_catalog.gen_random_uuid();
  v_now := pg_catalog.clock_timestamp();
  -- UUID randomness provides a once-only eight-letter integration suffix.
  v_suffix := pg_catalog.translate(pg_catalog.substr(pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', ''),1,8), '0123456789', 'ghijklmnop');
  insert into public.billing_checkout_attempts (
    id, organization_id, plan_code, stripe_price_id, stripe_customer_id, stripe_idempotency_key,
    state, expires_at, success_url, cancel_url, payment_method_configuration_id,
    integration_identifier, payload_version, stripe_api_version, livemode, created_at, updated_at
  ) values (
    v_id, p_organization_id, p_plan_code, p_stripe_price_id, p_stripe_customer_id, 'deli-plus:checkout:v1:' || v_id::text,
    'creating', pg_catalog.date_trunc('second', v_now) + interval '1 hour', p_success_url, p_cancel_url,
    p_payment_method_configuration_id, 'deliplus-checkout-' || v_suffix, 1, '2026-07-29.dahlia', p_livemode, v_now, v_now
  ) returning * into v_attempt;
  return query select 'attempt'::text, pg_catalog.to_jsonb(v_attempt);
end;
$$;

create function private.lock_billing_checkout_attempt(p_organization_id uuid, p_attempt_id uuid)
returns public.billing_checkout_attempts
language plpgsql volatile security invoker set search_path = '' as $$
declare v_customer public.billing_customers; v_attempt public.billing_checkout_attempts;
begin
  perform private.lock_checkout_organization(p_organization_id);
  select c.* into strict v_customer from public.billing_customers as c
    where c.organization_id = p_organization_id for update;
  select a.* into strict v_attempt from public.billing_checkout_attempts as a
    where a.organization_id = p_organization_id and a.id = p_attempt_id for update;
  if v_customer.provisioning_status <> 'ready'
    or v_customer.stripe_customer_id is distinct from v_attempt.stripe_customer_id then
    raise exception using errcode = '22023', message = 'Conflicting Checkout Customer';
  end if;
  return v_attempt;
end;
$$;

create function public.reconcile_billing_checkout_attempt(
  p_organization_id uuid, p_attempt_id uuid, p_expected_revision bigint, p_expected_state text,
  p_expected_session_id text, p_session_id text, p_state text
)
returns table(outcome text, attempt jsonb)
language plpgsql volatile security definer set search_path = '' as $$
declare v_attempt public.billing_checkout_attempts;
begin
  v_attempt := private.lock_billing_checkout_attempt(p_organization_id, p_attempt_id);
  if v_attempt.stripe_checkout_session_id is not null and p_session_id is distinct from v_attempt.stripe_checkout_session_id then
    raise exception using errcode = '22023', message = 'Conflicting Checkout Session';
  end if;
  if p_state is null or p_state not in ('open','completed','recovery_required') then
    raise exception using errcode = '22023', message = 'Invalid Checkout reconciliation';
  end if;
  if v_attempt.state = p_state and v_attempt.stripe_checkout_session_id is not distinct from p_session_id then
    return query select 'attempt'::text, pg_catalog.to_jsonb(v_attempt); return;
  end if;
  if v_attempt.revision is distinct from p_expected_revision or v_attempt.state is distinct from p_expected_state
    or v_attempt.stripe_checkout_session_id is distinct from p_expected_session_id or v_attempt.ended_at is not null then
    return query select 'stale'::text, pg_catalog.to_jsonb(v_attempt); return;
  end if;
  update public.billing_checkout_attempts set state = p_state, stripe_checkout_session_id = p_session_id,
    revision = revision + 1 where id = p_attempt_id and organization_id = p_organization_id returning * into v_attempt;
  return query select 'attempt'::text, pg_catalog.to_jsonb(v_attempt);
end;
$$;

create function public.end_billing_checkout_attempt(
  p_organization_id uuid, p_attempt_id uuid, p_expected_revision bigint, p_expected_state text,
  p_session_id text, p_external_session_status text,
  p_correlated_subscription_terminal boolean, p_no_nonterminal_subscriptions boolean
)
returns table(outcome text, attempt jsonb)
language plpgsql volatile security definer set search_path = '' as $$
declare v_attempt public.billing_checkout_attempts; v_blocker text;
begin
  v_attempt := private.lock_billing_checkout_attempt(p_organization_id, p_attempt_id);
  if p_session_id is null or v_attempt.stripe_checkout_session_id is distinct from p_session_id then
    raise exception using errcode = '22023', message = 'Checkout closure requires a known Session';
  end if;
  if p_no_nonterminal_subscriptions is distinct from true
    or p_external_session_status is null
    or p_external_session_status not in ('expired','complete')
    or (p_external_session_status = 'complete' and p_correlated_subscription_terminal is distinct from true) then
    raise exception using errcode = '22023', message = 'Checkout closure lacks terminal evidence';
  end if;
  if v_attempt.state = 'ended' then
    return query select 'attempt'::text, pg_catalog.to_jsonb(v_attempt); return;
  end if;
  if v_attempt.revision is distinct from p_expected_revision or v_attempt.state is distinct from p_expected_state then
    return query select 'stale'::text, pg_catalog.to_jsonb(v_attempt); return;
  end if;
  v_blocker := private.checkout_subscription_blocker(p_organization_id, false);
  if v_blocker is not null then return query select v_blocker, pg_catalog.to_jsonb(v_attempt); return; end if;
  update public.billing_checkout_attempts set state = 'ended', ended_at = pg_catalog.clock_timestamp(),
    revision = revision + 1 where id = p_attempt_id and organization_id = p_organization_id returning * into v_attempt;
  return query select 'attempt'::text, pg_catalog.to_jsonb(v_attempt);
end;
$$;

alter table public.billing_checkout_attempts enable row level security;
revoke all on public.billing_checkout_attempts from public, anon, authenticated, service_role;
grant select on public.billing_checkout_attempts to service_role;

alter function private.guard_billing_checkout_attempt() owner to postgres;
alter function private.lock_checkout_organization(uuid) owner to postgres;
alter function private.checkout_subscription_blocker(uuid, boolean) owner to postgres;
alter function private.lock_billing_checkout_attempt(uuid, uuid) owner to postgres;
revoke all on function private.guard_billing_checkout_attempt(), private.lock_checkout_organization(uuid),
  private.checkout_subscription_blocker(uuid, boolean), private.lock_billing_checkout_attempt(uuid, uuid)
  from public, anon, authenticated, service_role;

alter function public.claim_billing_customer(uuid) owner to postgres;
alter function public.finalize_billing_customer(uuid, text, text) owner to postgres;
alter function public.claim_billing_checkout_attempt(uuid, text, text, text, text, text, text, boolean) owner to postgres;
alter function public.reconcile_billing_checkout_attempt(uuid, uuid, bigint, text, text, text, text) owner to postgres;
alter function public.end_billing_checkout_attempt(uuid, uuid, bigint, text, text, text, boolean, boolean) owner to postgres;
revoke all on function public.claim_billing_customer(uuid), public.finalize_billing_customer(uuid, text, text),
  public.claim_billing_checkout_attempt(uuid, text, text, text, text, text, text, boolean),
  public.reconcile_billing_checkout_attempt(uuid, uuid, bigint, text, text, text, text),
  public.end_billing_checkout_attempt(uuid, uuid, bigint, text, text, text, boolean, boolean)
  from public, anon, authenticated, service_role;
grant execute on function public.claim_billing_customer(uuid), public.finalize_billing_customer(uuid, text, text),
  public.claim_billing_checkout_attempt(uuid, text, text, text, text, text, text, boolean),
  public.reconcile_billing_checkout_attempt(uuid, uuid, bigint, text, text, text, text),
  public.end_billing_checkout_attempt(uuid, uuid, bigint, text, text, text, boolean, boolean)
  to service_role;
