-- ================================================================
-- Migration: Product Complements (Adicionais) & Order Items Integration
-- ================================================================

-- 1. Create table public.product_complements
create table if not exists public.product_complements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  description text,
  price_cents integer not null default 0,
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Timestamps trigger
drop trigger if exists product_complements_set_row_timestamps on public.product_complements;
create trigger product_complements_set_row_timestamps
before update on public.product_complements
for each row execute function private.set_row_timestamps();

-- Indexes for performance
create index if not exists product_complements_store_id_idx on public.product_complements (store_id);
create index if not exists product_complements_product_id_idx on public.product_complements (product_id);

-- 2. Row Level Security Policies
alter table public.product_complements enable row level security;

drop policy if exists "Tenant access product_complements" on public.product_complements;
create policy "Tenant access product_complements"
  on public.product_complements
  for all
  to authenticated
  using (exists (select 1 from public.stores where stores.id = product_complements.store_id))
  with check (exists (select 1 from public.stores where stores.id = product_complements.store_id));

drop policy if exists "Public read product_complements" on public.product_complements;
create policy "Public read product_complements"
  on public.product_complements
  for select
  to anon
  using (exists (select 1 from public.stores where stores.id = product_complements.store_id and stores.status = 'active'));

-- 3. Add complements column to public.order_items
alter table public.order_items
  add column if not exists complements jsonb not null default '[]'::jsonb;

-- 4. Update vw_menu_items with aggregated adicionais
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
  end as is_out_of_stock,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', pc.id,
          'name', pc.name,
          'description', pc.description,
          'price_cents', pc.price_cents,
          'image_url', pc.image_url,
          'is_active', pc.is_active,
          'sort_order', pc.sort_order
        ) order by pc.sort_order, pc.created_at
      )
      from public.product_complements pc
      where pc.product_id = p.id
    ),
    '[]'::jsonb
  ) as adicionais,
  (
    select count(*)::integer
    from public.product_complements pc
    where pc.product_id = p.id
  ) as adicionais_count
from public.products p
left join public.categories c on c.id = p.category_id;

grant select on public.vw_menu_items to authenticated, anon;

-- 5. Update vw_orders_live with complements in items_detail (Exact column order preserved)
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
  coalesce(sum(oi.quantity), 0::bigint)::integer as items_count,
  coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', oi.id,
        'name', oi.name,
        'qty', oi.quantity,
        'unit_price_cents', oi.unit_price_cents,
        'total_price_cents', oi.total_price_cents,
        'details', oi.details,
        'complements', coalesce(oi.complements, '[]'::jsonb)
      ) order by oi.id
    ) filter (where oi.id is not null),
    '[]'::jsonb
  ) as items_detail
from public.orders o
left join public.order_items oi on oi.order_id = o.id
group by o.id;

grant select on public.vw_orders_live to authenticated;

-- 6. Seed sample complements for existing products
do $$
declare
  p record;
begin
  for p in select id, store_id, name from public.products loop
    if p.name = 'Bowl Frango Teriyaki' and not exists (select 1 from public.product_complements where product_id = p.id) then
      insert into public.product_complements (store_id, product_id, name, description, price_cents, image_url, sort_order)
      values
        (p.store_id, p.id, 'Molho Teriyaki Extra', 'Dose adicional do molho da casa artesanal', 350, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80', 1),
        (p.store_id, p.id, 'Quinoa Real em Dobro', 'Porção extra de quinoa real cozida no vapor', 600, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&auto=format&fit=crop&q=80', 2),
        (p.store_id, p.id, 'Castanha de Caju Crocante', 'Castanhas selecionadas torradas na hora', 450, '', 3);
    end if;

    if p.name = 'M Bowl Noma' and not exists (select 1 from public.product_complements where product_id = p.id) then
      insert into public.product_complements (store_id, product_id, name, description, price_cents, image_url, sort_order)
      values
        (p.store_id, p.id, 'Salmão Grelhado Extra', '100g de salmão fresco grelhado', 1400, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80', 1),
        (p.store_id, p.id, 'Edamame Fresco', 'Porção adicional de edamame selecionado', 500, '', 2);
    end if;

    if p.name = 'Dadinhos de Tapioca' and not exists (select 1 from public.product_complements where product_id = p.id) then
      insert into public.product_complements (store_id, product_id, name, description, price_cents, image_url, sort_order)
      values
        (p.store_id, p.id, 'Geleia de Pimenta Artesanal', 'Geleia agridoce feita na casa', 400, '', 1),
        (p.store_id, p.id, 'Queijo Coalho em Dobro', 'Cubos extras crocantes de queijo coalho', 550, '', 2);
    end if;
  end loop;
end $$;

-- 7. Update sample order_items with complements
update public.order_items
set complements = '[{"name": "Geleia de Pimenta Artesanal", "price_cents": 400}, {"name": "Queijo Coalho em Dobro", "price_cents": 550}]'::jsonb
where name like '%Dadinho%' and (complements is null or complements = '[]'::jsonb);

update public.order_items
set complements = '[{"name": "Molho Teriyaki Extra", "price_cents": 350}]'::jsonb
where name like '%Teriyaki%' and (complements is null or complements = '[]'::jsonb);
