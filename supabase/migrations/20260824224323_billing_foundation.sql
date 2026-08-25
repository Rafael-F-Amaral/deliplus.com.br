create table public.billing_trial_grants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  clerk_user_id text not null,
  grant_kind text not null,
  plan_code text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_trial_grants_organization_id_fkey
    foreign key (organization_id)
    references public.organizations (id)
    on update restrict
    on delete restrict,
  constraint billing_trial_grants_grant_kind_check
    check (grant_kind in ('initial', 'manual_override')),
  constraint billing_trial_grants_plan_code_check
    check (plan_code in ('essential', 'multi_2', 'multi_3')),
  constraint billing_trial_grants_initial_plan_code_check
    check (grant_kind <> 'initial' or plan_code = 'essential'),
  constraint billing_trial_grants_time_range_check
    check (ends_at > starts_at),
  constraint billing_trial_grants_initial_duration_check
    check (
      grant_kind <> 'initial'
      or ends_at - starts_at = interval '15 days'
    )
);

create unique index billing_trial_grants_initial_organization_id_key
  on public.billing_trial_grants (organization_id)
  where grant_kind = 'initial';

create unique index billing_trial_grants_initial_clerk_user_id_key
  on public.billing_trial_grants (clerk_user_id)
  where grant_kind = 'initial';

create index billing_trial_grants_organization_validity_idx
  on public.billing_trial_grants (
    organization_id,
    revoked_at,
    ends_at,
    starts_at
  );

create table public.billing_customers (
  organization_id uuid primary key,
  stripe_customer_id text,
  provisioning_status text not null,
  creation_idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_customers_organization_id_fkey
    foreign key (organization_id)
    references public.organizations (id)
    on update restrict
    on delete restrict,
  constraint billing_customers_stripe_customer_id_key
    unique (stripe_customer_id),
  constraint billing_customers_creation_idempotency_key_unique
    unique (creation_idempotency_key),
  constraint billing_customers_provisioning_status_check
    check (provisioning_status in ('pending', 'ready')),
  constraint billing_customers_ready_customer_check
    check (
      provisioning_status <> 'ready'
      or stripe_customer_id is not null
    )
);

create table public.billing_subscriptions (
  organization_id uuid primary key,
  stripe_subscription_id text not null,
  stripe_price_id text not null,
  plan_code text not null,
  status text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  collection_paused boolean not null default false,
  past_due_since timestamptz,
  last_synced_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_subscriptions_organization_id_fkey
    foreign key (organization_id)
    references public.billing_customers (organization_id)
    on update restrict
    on delete restrict,
  constraint billing_subscriptions_stripe_subscription_id_key
    unique (stripe_subscription_id),
  constraint billing_subscriptions_plan_code_check
    check (plan_code in ('essential', 'multi_2', 'multi_3')),
  constraint billing_subscriptions_status_check
    check (
      status in (
        'active',
        'past_due',
        'incomplete',
        'incomplete_expired',
        'unpaid',
        'canceled',
        'paused',
        'trialing'
      )
    ),
  constraint billing_subscriptions_past_due_since_check
    check (
      (status = 'past_due' and past_due_since is not null)
      or (status <> 'past_due' and past_due_since is null)
    )
);

create table public.stripe_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  stripe_object_id text,
  livemode boolean not null,
  stripe_created_at timestamptz not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create trigger billing_trial_grants_set_row_timestamps
before update on public.billing_trial_grants
for each row
execute function private.set_row_timestamps();

create trigger billing_customers_set_row_timestamps
before update on public.billing_customers
for each row
execute function private.set_row_timestamps();

create trigger billing_subscriptions_set_row_timestamps
before update on public.billing_subscriptions
for each row
execute function private.set_row_timestamps();

alter table public.billing_trial_grants enable row level security;
alter table public.billing_customers enable row level security;
alter table public.billing_subscriptions enable row level security;
alter table public.stripe_webhook_events enable row level security;

revoke all on table public.billing_trial_grants
from public, anon, authenticated;
revoke all on table public.billing_customers
from public, anon, authenticated;
revoke all on table public.billing_subscriptions
from public, anon, authenticated;
revoke all on table public.stripe_webhook_events
from public, anon, authenticated;
