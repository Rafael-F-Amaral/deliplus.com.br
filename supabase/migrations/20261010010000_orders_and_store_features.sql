-- ================================================================
-- Migration: Orders & Store Delivery Features, Views, and RPCs
-- ================================================================

-- 1. Alter public.orders with rich food delivery columns
alter table public.orders 
  add column if not exists order_number integer,
  add column if not exists display_id text,
  add column if not exists customer_name text not null default 'Cliente',
  add column if not exists customer_phone text not null default '',
  add column if not exists delivery_type text not null default 'Delivery',
  add column if not exists delivery_address text,
  add column if not exists subtotal_cents integer not null default 0,
  add column if not exists delivery_fee_cents integer not null default 0,
  add column if not exists discount_cents integer not null default 0,
  add column if not exists payment_method text not null default 'Em Dinheiro',
  add column if not exists change_for_cents integer,
  add column if not exists is_urgent boolean not null default false,
  add column if not exists notes text,
  add column if not exists accepted_at timestamptz,
  add column if not exists ready_at timestamptz,
  add column if not exists dispatched_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists canceled_at timestamptz;

-- Set default status to 'Novo'
alter table public.orders alter column status set default 'Novo';

-- 2. Alter public.order_items with snapshot and safe deletion
alter table public.order_items 
  add column if not exists name text not null default 'Item',
  add column if not exists details text;

-- Allow product_id to be nullable so deleting a product does not break receipts
alter table public.order_items alter column product_id drop not null;
alter table public.order_items drop constraint if exists order_items_product_id_fkey;
alter table public.order_items 
  add constraint order_items_product_id_fkey 
  foreign key (product_id) references public.products(id) on delete set null;

-- 3. Create public.store_delivery_settings
create table if not exists public.store_delivery_settings (
  store_id uuid primary key references public.stores(id) on delete cascade,
  min_order_cents integer not null default 0,
  default_prep_min integer not null default 30,
  default_prep_max integer not null default 50,
  delivery_fee_cents integer not null default 500,
  free_delivery_above_cents integer,
  accepts_delivery boolean not null default true,
  accepts_pickup boolean not null default true,
  is_open_override boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Timestamps trigger for store_delivery_settings
drop trigger if exists store_delivery_settings_set_row_timestamps on public.store_delivery_settings;
create trigger store_delivery_settings_set_row_timestamps 
before update on public.store_delivery_settings 
for each row execute function private.set_row_timestamps();

-- Seed store_delivery_settings for existing stores
insert into public.store_delivery_settings (store_id)
select id from public.stores
on conflict (store_id) do nothing;

-- Trigger to auto-provision delivery settings for new stores
create or replace function public.seed_default_store_delivery_settings()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.store_delivery_settings (store_id)
  values (new.id)
  on conflict (store_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_store_created_seed_delivery_settings on public.stores;
create trigger on_store_created_seed_delivery_settings
after insert on public.stores
for each row execute function public.seed_default_store_delivery_settings();

-- 4. Order numbering trigger (Sequential per store, starts at 1201)
create or replace function public.assign_order_number()
returns trigger
language plpgsql
as $$
begin
  if new.order_number is null or new.order_number = 0 then
    select coalesce(max(order_number), 1200) + 1
    into new.order_number
    from public.orders
    where store_id = new.store_id;
  end if;
  if new.display_id is null or new.display_id = '' then
    new.display_id := '#' || new.order_number::text;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orders_assign_order_number on public.orders;
create trigger trg_orders_assign_order_number
before insert on public.orders
for each row execute function public.assign_order_number();

-- 5. Indexes for fast dashboard and search queries
create index if not exists orders_store_id_created_at_idx on public.orders (store_id, created_at desc);
create index if not exists orders_store_id_status_idx on public.orders (store_id, status);
create index if not exists orders_customer_phone_idx on public.orders (store_id, customer_phone);
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id);

-- 6. Row Level Security Policies
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.store_delivery_settings enable row level security;

drop policy if exists "orders_select" on public.orders;
drop policy if exists "Tenant access orders" on public.orders;
create policy "Tenant access orders"
  on public.orders
  for all
  to authenticated
  using (exists (select 1 from public.stores where stores.id = orders.store_id))
  with check (exists (select 1 from public.stores where stores.id = orders.store_id));

drop policy if exists "order_items_select" on public.order_items;
drop policy if exists "Tenant access order_items" on public.order_items;
create policy "Tenant access order_items"
  on public.order_items
  for all
  to authenticated
  using (exists (
    select 1 from public.orders 
    join public.stores on stores.id = orders.store_id 
    where orders.id = order_items.order_id
  ))
  with check (exists (
    select 1 from public.orders 
    join public.stores on stores.id = orders.store_id 
    where orders.id = order_items.order_id
  ));

drop policy if exists "Tenant access store_delivery_settings" on public.store_delivery_settings;
drop policy if exists "Public read store_delivery_settings" on public.store_delivery_settings;

create policy "Tenant access store_delivery_settings"
  on public.store_delivery_settings
  for all
  to authenticated
  using (exists (select 1 from public.stores where stores.id = store_delivery_settings.store_id))
  with check (exists (select 1 from public.stores where stores.id = store_delivery_settings.store_id));

create policy "Public read store_delivery_settings"
  on public.store_delivery_settings
  for select
  to anon
  using (exists (select 1 from public.stores where stores.id = store_delivery_settings.store_id and stores.status = 'active'));

grant select, insert, update, delete on table public.orders to authenticated;
grant select, insert, update, delete on table public.order_items to authenticated;
grant select, insert, update, delete on table public.store_delivery_settings to authenticated;
grant select on table public.store_delivery_settings to anon;

-- 7. Views
-- 7.1. View: vw_orders_live (Dashboard table & Drawer)
create or replace view public.vw_orders_live as
select
  o.id,
  o.store_id,
  o.order_number,
  o.display_id,
  o.customer_name,
  o.customer_phone,
  o.delivery_type,
  o.delivery_address,
  o.status,
  o.is_urgent,
  o.payment_method,
  o.change_for_cents,
  o.subtotal_cents,
  o.delivery_fee_cents,
  o.discount_cents,
  o.total_amount_cents,
  o.notes,
  o.accepted_at,
  o.ready_at,
  o.dispatched_at,
  o.completed_at,
  o.canceled_at,
  o.created_at,
  o.updated_at,
  coalesce(sum(oi.quantity), 0)::integer as items_count,
  coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', oi.id,
        'name', oi.name,
        'qty', oi.quantity,
        'unit_price_cents', oi.unit_price_cents,
        'total_price_cents', oi.total_price_cents,
        'details', oi.details
      ) order by oi.id
    ) filter (where oi.id is not null),
    '[]'::jsonb
  ) as items_detail
from public.orders o
left join public.order_items oi on oi.order_id = o.id
group by o.id;

-- 7.2. View: vw_orders_summary (Daily metrics)
create or replace view public.vw_orders_summary as
select
  store_id,
  count(*) as total_orders,
  count(*) filter (where created_at::date = current_date) as orders_today,
  coalesce(sum(total_amount_cents) filter (where created_at::date = current_date and status = 'Concluído'), 0) as total_sales_today_cents,
  case 
    when count(*) filter (where created_at::date = current_date and status = 'Concluído') > 0 
    then round(sum(total_amount_cents) filter (where created_at::date = current_date and status = 'Concluído')::numeric / count(*) filter (where created_at::date = current_date and status = 'Concluído'))::integer
    else 0 
  end as avg_ticket_today_cents,
  count(*) filter (where status = 'Novo') as orders_new,
  count(*) filter (where status = 'Em preparo') as orders_preparing,
  count(*) filter (where status = 'Pronto') as orders_ready,
  count(*) filter (where status = 'Em entrega') as orders_dispatched,
  count(*) filter (where status = 'Concluído') as orders_completed,
  count(*) filter (where status = 'Cancelado') as orders_canceled
from public.orders
group by store_id;

grant select on public.vw_orders_live to authenticated;
grant select on public.vw_orders_summary to authenticated;

-- 8. RPC: create_public_order (Safe customer checkout from Storefront)
create or replace function public.create_public_order(
  p_store_slug text,
  p_customer_name text,
  p_customer_phone text,
  p_delivery_type text default 'Delivery',
  p_delivery_address text default null,
  p_payment_method text default 'Em Dinheiro',
  p_change_for_cents integer default null,
  p_notes text default null,
  p_items jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store record;
  v_settings record;
  v_order_id uuid;
  v_order_number integer;
  v_display_id text;
  v_subtotal integer := 0;
  v_delivery_fee integer := 0;
  v_total integer := 0;
  v_item jsonb;
  v_item_qty integer;
  v_item_price integer;
  v_item_name text;
  v_item_details text;
  v_product_id uuid;
begin
  -- 1. Validar e buscar loja ativa
  select id, name, slug into v_store
  from public.stores
  where slug = p_store_slug and status = 'active';

  if v_store.id is null then
    raise exception 'Loja não encontrada ou inativa.';
  end if;

  -- 2. Buscar configurações de entrega da loja
  select * into v_settings
  from public.store_delivery_settings
  where store_id = v_store.id;

  -- 3. Calcular subtotal a partir dos itens
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_item_qty := coalesce((v_item->>'quantity')::integer, 1);
    v_item_price := coalesce((v_item->>'unit_price_cents')::integer, 0);
    v_subtotal := v_subtotal + (v_item_qty * v_item_price);
  end loop;

  if p_delivery_type = 'Delivery' and v_settings.delivery_fee_cents is not null then
    v_delivery_fee := v_settings.delivery_fee_cents;
    if v_settings.free_delivery_above_cents is not null and v_subtotal >= v_settings.free_delivery_above_cents then
      v_delivery_fee := 0;
    end if;
  end if;

  -- Validar pedido mínimo se houver
  if v_settings.min_order_cents is not null and v_subtotal < v_settings.min_order_cents then
    raise exception 'O pedido mínimo para esta loja é de R$ %', (v_settings.min_order_cents / 100.0);
  end if;

  v_total := v_subtotal + v_delivery_fee;

  -- 4. Inserir cabeçalho do pedido
  insert into public.orders (
    store_id,
    customer_name,
    customer_phone,
    delivery_type,
    delivery_address,
    payment_method,
    change_for_cents,
    subtotal_cents,
    delivery_fee_cents,
    total_amount_cents,
    notes,
    status,
    created_at,
    updated_at
  )
  values (
    v_store.id,
    p_customer_name,
    p_customer_phone,
    coalesce(p_delivery_type, 'Delivery'),
    p_delivery_address,
    coalesce(p_payment_method, 'Em Dinheiro'),
    p_change_for_cents,
    v_subtotal,
    v_delivery_fee,
    v_total,
    p_notes,
    'Novo',
    now(),
    now()
  )
  returning id, order_number, display_id into v_order_id, v_order_number, v_display_id;

  -- 5. Inserir itens do pedido
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_item_qty := coalesce((v_item->>'quantity')::integer, 1);
    v_item_price := coalesce((v_item->>'unit_price_cents')::integer, 0);
    v_item_name := coalesce(v_item->>'name', 'Item');
    v_item_details := v_item->>'details';
    v_product_id := (v_item->>'product_id')::uuid;

    insert into public.order_items (
      order_id,
      product_id,
      name,
      quantity,
      unit_price_cents,
      total_price_cents,
      details
    )
    values (
      v_order_id,
      v_product_id,
      v_item_name,
      v_item_qty,
      v_item_price,
      (v_item_qty * v_item_price),
      v_item_details
    );
  end loop;

  -- 6. Atualizar ou registrar cliente
  if p_customer_phone is not null and length(trim(p_customer_phone)) > 0 then
    insert into public.customers (
      store_id,
      name,
      phone,
      orders_count,
      total_spent_cents,
      last_order_at,
      updated_at
    )
    values (
      v_store.id,
      p_customer_name,
      p_customer_phone,
      1,
      0,
      now(),
      now()
    )
    on conflict do nothing;
  end if;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'display_id', v_display_id,
    'store_slug', v_store.slug,
    'total_amount_cents', v_total
  );
end;
$$;

grant execute on function public.create_public_order to anon, authenticated;
