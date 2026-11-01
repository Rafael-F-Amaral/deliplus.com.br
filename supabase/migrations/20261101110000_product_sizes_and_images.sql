-- Migration: Add sizes and images to products and update menu_items view
alter table public.products add column if not exists sizes jsonb default '[]'::jsonb;
alter table public.products add column if not exists images text[] default '{}';

-- Recreate view public.menu_items (columns appended at end to avoid PostgreSQL column position errors)
create or replace view public.menu_items
with (security_invoker = true) as
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
  ) as adicionais_count,
  p.images,
  p.sizes
from public.products p
left join public.categories c on c.id = p.category_id;

grant select on public.menu_items to authenticated, anon;
