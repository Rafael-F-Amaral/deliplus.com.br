-- Migration: Marketing features (Coupons, Store Marketing Settings, and Summaries)
-- DeliPlus Architecture: Merchant marketing engine to drive direct ordering growth

-- 1. Create table coupons
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  code text not null,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'fixed', 'free_shipping')) default 'percentage',
  discount_value integer not null default 10,
  min_order_cents integer not null default 0,
  max_uses integer,
  uses_count integer not null default 0,
  status text not null check (status in ('active', 'paused', 'expired')) default 'active',
  expires_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint coupons_store_id_code_key unique (store_id, code)
);

-- Indexes for lightning fast lookups
create index if not exists idx_coupons_store_id on public.coupons(store_id);
create index if not exists idx_coupons_code on public.coupons(code);
create index if not exists idx_coupons_status on public.coupons(status);

-- Enable RLS on coupons
alter table public.coupons enable row level security;

create policy "coupons_select" on public.coupons
  for select to authenticated
  using (exists (select 1 from public.stores where stores.id = coupons.store_id));

create policy "coupons_all" on public.coupons
  for all to authenticated
  using (exists (select 1 from public.stores where stores.id = coupons.store_id));

create policy "coupons_anon_select" on public.coupons
  for select to anon
  using (status = 'active');

-- 2. Create table store_marketing_settings
create table if not exists public.store_marketing_settings (
  store_id uuid primary key references public.stores(id) on delete cascade,
  banner_enabled boolean not null default true,
  banner_text text not null default '🔥 Entrega grátis hoje em pedidos acima de R$ 50!',
  banner_color text not null default 'terracotta' check (banner_color in ('terracotta', 'forest', 'amber')),
  loyalty_enabled boolean not null default true,
  loyalty_goal_orders integer not null default 10,
  loyalty_reward_cents integer not null default 2000,
  loyalty_reward_text text not null default 'R$ 20,00 de desconto no próximo pedido',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Enable RLS on store_marketing_settings
alter table public.store_marketing_settings enable row level security;

create policy "marketing_settings_select" on public.store_marketing_settings
  for select to authenticated
  using (exists (select 1 from public.stores where stores.id = store_marketing_settings.store_id));

create policy "marketing_settings_all" on public.store_marketing_settings
  for all to authenticated
  using (exists (select 1 from public.stores where stores.id = store_marketing_settings.store_id));

create policy "marketing_settings_anon_select" on public.store_marketing_settings
  for select to anon
  using (true);

-- 3. Domain view: marketing_summaries
create or replace view public.marketing_summaries
with (security_invoker = true) as
select 
  s.id as store_id,
  s.name as store_name,
  s.slug as store_slug,
  coalesce(count(c.id) filter (where c.status = 'active'), 0)::integer as active_coupons_count,
  coalesce(count(c.id), 0)::integer as total_coupons_count,
  coalesce(sum(c.uses_count), 0)::integer as total_coupon_uses,
  coalesce(m.banner_enabled, false) as banner_enabled,
  coalesce(m.banner_text, '') as banner_text,
  coalesce(m.banner_color, 'terracotta') as banner_color,
  coalesce(m.loyalty_enabled, false) as loyalty_enabled,
  coalesce(m.loyalty_goal_orders, 10)::integer as loyalty_goal_orders,
  coalesce(m.loyalty_reward_cents, 2000)::integer as loyalty_reward_cents
from public.stores s
left join public.coupons c on c.store_id = s.id
left join public.store_marketing_settings m on m.store_id = s.id
group by s.id, s.name, s.slug, m.banner_enabled, m.banner_text, m.banner_color, m.loyalty_enabled, m.loyalty_goal_orders, m.loyalty_reward_cents;

-- 4. Seed initial default settings and high-converting coupons for existing stores
insert into public.store_marketing_settings (store_id, banner_enabled, banner_text, banner_color, loyalty_enabled, loyalty_goal_orders, loyalty_reward_cents, loyalty_reward_text)
select 
  id as store_id,
  true,
  '🔥 Entrega grátis hoje em pedidos acima de R$ 50!',
  'terracotta',
  true,
  10,
  2000,
  'R$ 20,00 de desconto no próximo pedido'
from public.stores
on conflict (store_id) do nothing;

insert into public.coupons (store_id, code, description, discount_type, discount_value, min_order_cents, max_uses, uses_count, status, expires_at)
select
  id as store_id,
  'BEMVINDO10',
  '10% de desconto no primeiro pedido para novos clientes',
  'percentage',
  10,
  4000,
  100,
  38,
  'active',
  now() + interval '30 days'
from public.stores
on conflict (store_id, code) do nothing;

insert into public.coupons (store_id, code, description, discount_type, discount_value, min_order_cents, max_uses, uses_count, status, expires_at)
select
  id as store_id,
  'SEXTOU15',
  'R$ 15,00 de desconto para pedidos no fim de semana',
  'fixed',
  1500,
  6000,
  50,
  24,
  'active',
  now() + interval '15 days'
from public.stores
on conflict (store_id, code) do nothing;

insert into public.coupons (store_id, code, description, discount_type, discount_value, min_order_cents, max_uses, uses_count, status, expires_at)
select
  id as store_id,
  'FRETEGRATIS',
  'Taxa de entrega grátis em pedidos acima de R$ 50',
  'free_shipping',
  0,
  5000,
  30,
  12,
  'active',
  now() + interval '45 days'
from public.stores
on conflict (store_id, code) do nothing;
