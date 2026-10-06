-- ==========================================
-- Migration: Menu features, columns and views
-- ==========================================

-- 1. Add store_id and rich menu columns to public.products
alter table public.products 
  add column if not exists store_id uuid references public.stores(id) on delete cascade,
  add column if not exists image_url text,
  add column if not exists promo_price_cents integer,
  add column if not exists in_promo boolean not null default false,
  add column if not exists promo_indefinite boolean not null default true,
  add column if not exists promo_start_date date,
  add column if not exists promo_end_date date,
  add column if not exists daily_remaining integer,
  add column if not exists tags text[] not null default '{}';

-- Backfill store_id from categories if null
update public.products p
set store_id = c.store_id
from public.categories c
where p.category_id = c.id and p.store_id is null;

-- Add indexes for store-scoped performance
create index if not exists products_store_id_idx on public.products (store_id);
create index if not exists products_category_id_idx on public.products (category_id);

-- 2. Ensure RLS Policies for categories and products
alter table public.categories enable row level security;
alter table public.products enable row level security;

drop policy if exists "categories_select" on public.categories;
drop policy if exists "products_select" on public.products;
drop policy if exists "Tenant access categories" on public.categories;
drop policy if exists "Tenant access products" on public.products;

create policy "Tenant access categories"
  on public.categories
  for all
  to authenticated
  using (exists (select 1 from public.stores where stores.id = categories.store_id))
  with check (exists (select 1 from public.stores where stores.id = categories.store_id));

create policy "Tenant access products"
  on public.products
  for all
  to authenticated
  using (exists (select 1 from public.stores where stores.id = products.store_id))
  with check (exists (select 1 from public.stores where stores.id = products.store_id));

-- Public read access for customer storefront
drop policy if exists "Public read categories" on public.categories;
drop policy if exists "Public read products" on public.products;

create policy "Public read categories"
  on public.categories
  for select
  to anon
  using (exists (select 1 from public.stores where stores.id = categories.store_id and stores.status = 'active'));

create policy "Public read products"
  on public.products
  for select
  to anon
  using (exists (select 1 from public.stores where stores.id = products.store_id and stores.status = 'active'));

-- 3. Create Views
create or replace view public.vw_menu_items as
select 
  p.id,
  p.store_id,
  p.category_id,
  c.name as category_name,
  c.sort_order as category_sort_order,
  p.name,
  p.description,
  p.image_url,
  p.price_cents,
  p.promo_price_cents,
  p.in_promo,
  p.promo_indefinite,
  p.promo_start_date,
  p.promo_end_date,
  p.is_active,
  p.daily_limit,
  p.daily_remaining,
  p.tags,
  p.created_at,
  p.updated_at,
  case 
    when p.in_promo and p.promo_price_cents is not null and p.price_cents > 0 
    then round(((p.price_cents - p.promo_price_cents)::numeric / p.price_cents) * 100)
    else 0
  end as discount_percentage,
  case
    when p.daily_limit is not null and p.daily_remaining = 0 then true
    else false
  end as is_out_of_stock
from public.products p
left join public.categories c on c.id = p.category_id;

create or replace view public.vw_menu_summary as
select 
  store_id,
  count(*) as total_products,
  count(*) filter (where is_active = true) as active_products,
  count(*) filter (where is_active = false) as paused_products,
  count(*) filter (where in_promo = true) as promo_products,
  count(*) filter (where daily_limit is not null and daily_remaining = 0) as out_of_stock_products
from public.products
group by store_id;

-- 4. User Tour Progress (Persistent per user across any device)
create table if not exists public.user_tour_progress (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  tour_key text not null,
  completed boolean not null default false,
  dismissed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_tour_progress_user_tour_key unique (clerk_user_id, tour_key)
);

alter table public.user_tour_progress enable row level security;

drop policy if exists "User access user_tour_progress" on public.user_tour_progress;
create policy "User access user_tour_progress"
  on public.user_tour_progress
  for all
  to authenticated
  using (true)
  with check (true);

-- 5. Seed default categories for existing stores
do $$
declare
  st record;
  cat_bowls uuid;
  cat_bebidas uuid;
  cat_sobremesas uuid;
  cat_entradas uuid;
begin
  for st in select id from public.stores loop
    -- Create categories if not present
    insert into public.categories (store_id, name, sort_order)
    values (st.id, 'Bowls', 1)
    on conflict do nothing;

    insert into public.categories (store_id, name, sort_order)
    values (st.id, 'Bebidas', 2)
    on conflict do nothing;

    insert into public.categories (store_id, name, sort_order)
    values (st.id, 'Sobremesas', 3)
    on conflict do nothing;

    insert into public.categories (store_id, name, sort_order)
    values (st.id, 'Entradas', 4)
    on conflict do nothing;

    select id into cat_bowls from public.categories where store_id = st.id and name = 'Bowls' limit 1;
    select id into cat_bebidas from public.categories where store_id = st.id and name = 'Bebidas' limit 1;
    select id into cat_sobremesas from public.categories where store_id = st.id and name = 'Sobremesas' limit 1;
    select id into cat_entradas from public.categories where store_id = st.id and name = 'Entradas' limit 1;

    -- Only insert seed products if store has 0 products
    if not exists (select 1 from public.products where store_id = st.id) then
      insert into public.products (
        store_id, category_id, name, description, price_cents, promo_price_cents, in_promo, promo_indefinite,
        is_active, daily_limit, daily_remaining, image_url, tags
      ) values
      (
        st.id, cat_bowls, 'M Bowl Noma',
        'Salmão grelhado, arroz cateto, edamame, manga, repolho roxo, cenoura, gergelim e molho da casa.',
        4990, 4290, true, true, true, null, null,
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
        array['Bowls', 'Mais pedido']
      ),
      (
        st.id, cat_bebidas, 'Chá da casa',
        'Blend de ervas orgânicas da estação. Leve, aromático e reconfortante.',
        1290, 1090, true, true, true, 50, 0,
        'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80',
        array['Bebidas', 'Orgânico']
      ),
      (
        st.id, cat_sobremesas, 'Brownie de chocolate',
        'Brownie úmido com cacau belga e gotas de chocolate nobre.',
        1690, null, false, true, true, null, null,
        'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&auto=format&fit=crop&q=80',
        array['Sobremesas']
      ),
      (
        st.id, cat_bebidas, 'Suco detox verde',
        'Couve, maçã verde, pepino, limão e gengibre prensados a frio.',
        1590, null, false, true, true, 30, 18,
        'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&auto=format&fit=crop&q=80',
        array['Bebidas']
      ),
      (
        st.id, cat_bowls, 'Poke Clássico de Atum',
        'Atum fresco marinado, arroz shari, avocado, nori, pepino e molho ponzu especial.',
        5200, null, false, true, true, 40, 12,
        'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?w=400&auto=format&fit=crop&q=80',
        array['Bowls', 'Destaque']
      ),
      (
        st.id, cat_bowls, 'Bowl Frango Teriyaki',
        'Filé de frango grelhado ao molho teriyaki, quinoa real, brócolis ao vapor e gergelim.',
        4490, null, false, true, true, 35, 20,
        'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80',
        array['Bowls']
      ),
      (
        st.id, cat_sobremesas, 'Açaí Especial Noma 400ml',
        'Açaí puro batido com banana, granola crocante artesanal, morangos frescos e mel.',
        2890, null, false, true, true, 60, 45,
        'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&auto=format&fit=crop&q=80',
        array['Sobremesas']
      ),
      (
        st.id, cat_bebidas, 'Kombucha Hibisco e Limão',
        'Bebida fermentada naturalmente probiótica com infusão de flores de hibisco e limão.',
        1800, null, false, true, false, 25, 0,
        'https://images.unsplash.com/photo-1556881286-fc6915169721?w=400&auto=format&fit=crop&q=80',
        array['Bebidas']
      ),
      (
        st.id, cat_entradas, 'Dadinhos de Tapioca',
        'Queijo coalho e tapioca granulada crocantes, acompanhados de geleia de pimenta defumada.',
        2600, 2200, true, true, true, null, null,
        'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&auto=format&fit=crop&q=80',
        array['Entradas', 'Mais pedido']
      ),
      (
        st.id, cat_bowls, 'Bowl Vegano Raízes',
        'Abóbora assada, grão de bico crocante, rúcula, castanhas e molho tahine.',
        3990, 3490, true, true, true, null, null,
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&auto=format&fit=crop&q=80',
        array['Bowls', 'Vegano']
      ),
      (
        st.id, cat_sobremesas, 'Cheesecake Frutas Vermelhas',
        'Base crocante de amêndoas com creme leve de cream cheese e calda artesanal de amoras e framboesas.',
        2200, null, false, true, false, null, null,
        'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&auto=format&fit=crop&q=80',
        array['Sobremesas']
      );
    end if;
  end loop;
end;
$$;

-- Ensure service_role has necessary permissions for server management operations
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all routines in schema public to service_role;

