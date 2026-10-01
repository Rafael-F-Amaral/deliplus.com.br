-- 1. Create Tables
create table public.inventory_categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  color_bg text not null default '#F4F5EE',
  color_text text not null default '#55694C',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid references public.inventory_categories(id) on delete set null,
  name text not null,
  quantity numeric(10,3) not null default 0,
  unit text not null default 'unidades',
  unit_cost_cents integer not null default 0,
  min_stock numeric(10,3) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Enable RLS
alter table public.inventory_categories enable row level security;
alter table public.inventory_items enable row level security;

-- 3. Create RLS Policies based on stores
create policy "Tenant access inventory_categories"
  on public.inventory_categories
  for all
  to authenticated
  using (exists (select 1 from public.stores where stores.id = inventory_categories.store_id))
  with check (exists (select 1 from public.stores where stores.id = inventory_categories.store_id));

create policy "Tenant access inventory_items"
  on public.inventory_items
  for all
  to authenticated
  using (exists (select 1 from public.stores where stores.id = inventory_items.store_id))
  with check (exists (select 1 from public.stores where stores.id = inventory_items.store_id));

-- 4. Create Views
create view public.vw_inventory_alerts as
select 
  i.*,
  c.name as category_name,
  c.color_bg as category_color_bg,
  c.color_text as category_color_text
from public.inventory_items i
left join public.inventory_categories c on c.id = i.category_id
where i.quantity <= i.min_stock;

create view public.vw_inventory_summary as
select 
  store_id,
  count(*) as total_items,
  sum(quantity * unit_cost_cents) as total_value_cents,
  case when count(*) > 0 then sum(unit_cost_cents) / count(*) else 0 end as avg_cost_cents
from public.inventory_items
group by store_id;

-- 5. Create Trigger Function for Default Categories
create or replace function public.seed_default_inventory_categories()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.inventory_categories (store_id, name, color_bg, color_text)
  values 
    (new.id, 'Mercearia', '#F4F5EE', '#55694C'),
    (new.id, 'Frios', '#E0F2FE', '#0369A1'),
    (new.id, 'Embalagens', '#F3E8FF', '#6B21A8'),
    (new.id, 'Hortifruti', '#ECFCCB', '#3F6212');
  return new;
end;
$$;

-- 6. Attach Trigger to stores table
create trigger on_store_created_seed_categories
after insert on public.stores
for each row execute function public.seed_default_inventory_categories();
