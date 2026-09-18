-- 1. Categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null,
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_store_id_fkey
    foreign key (store_id)
    references public.stores (id)
    on update restrict
    on delete cascade
);

-- 2. Products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null,
  name text not null,
  description text,
  price_cents integer not null default 0,
  is_active boolean not null default true,
  daily_limit integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_category_id_fkey
    foreign key (category_id)
    references public.categories (id)
    on update restrict
    on delete cascade
);

-- 3. Customers
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null,
  name text not null,
  phone text,
  email text,
  total_spent_cents integer not null default 0,
  orders_count integer not null default 0,
  segment text not null default 'new',
  last_order_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_store_id_fkey
    foreign key (store_id)
    references public.stores (id)
    on update restrict
    on delete cascade
);

-- 4. Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null,
  customer_id uuid,
  status text not null default 'pending',
  total_amount_cents integer not null default 0,
  channel text not null default 'delivery',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_store_id_fkey
    foreign key (store_id)
    references public.stores (id)
    on update restrict
    on delete cascade,
  constraint orders_customer_id_fkey
    foreign key (customer_id)
    references public.customers (id)
    on update restrict
    on delete set null
);

-- 5. Order Items
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  product_id uuid not null,
  quantity integer not null default 1,
  unit_price_cents integer not null default 0,
  total_price_cents integer not null default 0,
  constraint order_items_order_id_fkey
    foreign key (order_id)
    references public.orders (id)
    on update restrict
    on delete cascade,
  constraint order_items_product_id_fkey
    foreign key (product_id)
    references public.products (id)
    on update restrict
    on delete restrict
);

-- 6. Campaigns
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null,
  name text not null,
  target_audience text not null,
  status text not null default 'active',
  start_date date,
  end_date date,
  redemptions_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_store_id_fkey
    foreign key (store_id)
    references public.stores (id)
    on update restrict
    on delete cascade
);

-- Triggers for updated_at
create trigger categories_set_row_timestamps before update on public.categories for each row execute function private.set_row_timestamps();
create trigger products_set_row_timestamps before update on public.products for each row execute function private.set_row_timestamps();
create trigger customers_set_row_timestamps before update on public.customers for each row execute function private.set_row_timestamps();
create trigger orders_set_row_timestamps before update on public.orders for each row execute function private.set_row_timestamps();
create trigger campaigns_set_row_timestamps before update on public.campaigns for each row execute function private.set_row_timestamps();

-- RLS Enable
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.campaigns enable row level security;

-- Basic RLS Policies (Delegating authorization to stores)
create policy categories_select on public.categories for select to authenticated using (exists (select 1 from public.stores where stores.id = categories.store_id));
create policy products_select on public.products for select to authenticated using (exists (select 1 from public.categories join public.stores on stores.id = categories.store_id where categories.id = products.category_id));
create policy customers_select on public.customers for select to authenticated using (exists (select 1 from public.stores where stores.id = customers.store_id));
create policy orders_select on public.orders for select to authenticated using (exists (select 1 from public.stores where stores.id = orders.store_id));
create policy order_items_select on public.order_items for select to authenticated using (exists (select 1 from public.orders join public.stores on stores.id = orders.store_id where orders.id = order_items.order_id));
create policy campaigns_select on public.campaigns for select to authenticated using (exists (select 1 from public.stores where stores.id = campaigns.store_id));

revoke all on table public.categories from public, anon, authenticated;
revoke all on table public.products from public, anon, authenticated;
revoke all on table public.customers from public, anon, authenticated;
revoke all on table public.orders from public, anon, authenticated;
revoke all on table public.order_items from public, anon, authenticated;
revoke all on table public.campaigns from public, anon, authenticated;

grant select, insert, update, delete on table public.categories to authenticated;
grant select, insert, update, delete on table public.products to authenticated;
grant select, insert, update, delete on table public.customers to authenticated;
grant select, insert, update, delete on table public.orders to authenticated;
grant select, insert, update, delete on table public.order_items to authenticated;
grant select, insert, update, delete on table public.campaigns to authenticated;
