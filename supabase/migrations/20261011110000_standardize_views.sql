-- Migration: Standardize Views and Eliminate Hungarian Notation (vw_*)
-- DeliPlus Architecture: Domain-driven views with security_invoker = true

-- 1. menu_items (Clean projection of products with categories and aggregated complements)
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
  ) as adicionais_count
from public.products p
left join public.categories c on c.id = p.category_id;

grant select on public.menu_items to anon, authenticated, service_role, postgres;

-- 2. orders_live (Dashboard table & Drawer order details with aggregated complements)
create or replace view public.orders_live
with (security_invoker = true) as
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

grant select on public.orders_live to anon, authenticated, service_role, postgres;

-- 3. inventory_alerts (Items below minimum stock threshold)
create or replace view public.inventory_alerts
with (security_invoker = true) as
select 
  i.id,
  i.store_id,
  i.category_id,
  i.name,
  i.quantity,
  i.unit,
  i.unit_cost_cents,
  i.min_stock,
  i.created_at,
  i.updated_at,
  c.name as category_name,
  c.color_bg as category_color_bg,
  c.color_text as category_color_text
from public.inventory_items i
left join public.inventory_categories c on c.id = i.category_id
where i.quantity <= i.min_stock;

grant select on public.inventory_alerts to anon, authenticated, service_role, postgres;

-- 4. inventory_summaries (Consolidated inventory metrics per store)
create or replace view public.inventory_summaries
with (security_invoker = true) as
select 
  store_id,
  count(*) as total_items,
  sum(quantity * unit_cost_cents::numeric) as total_value_cents,
  case
    when count(*) > 0 then sum(unit_cost_cents) / count(*)
    else 0::bigint
  end as avg_cost_cents
from public.inventory_items
group by store_id;

grant select on public.inventory_summaries to anon, authenticated, service_role, postgres;

-- 5. menu_summaries (Consolidated menu metrics per store)
create or replace view public.menu_summaries
with (security_invoker = true) as
select 
  store_id,
  count(*) as total_products,
  count(*) filter (where is_active = true) as active_products,
  count(*) filter (where is_active = false) as paused_products,
  count(*) filter (where in_promo = true) as promo_products,
  count(*) filter (where daily_limit is not null and daily_remaining = 0) as out_of_stock_products
from public.products
group by store_id;

grant select on public.menu_summaries to anon, authenticated, service_role, postgres;

-- 6. order_summaries (Consolidated daily order metrics)
create or replace view public.order_summaries
with (security_invoker = true) as
select 
  store_id,
  count(*) as total_orders,
  count(*) filter (where created_at::date = current_date) as orders_today,
  coalesce(sum(total_amount_cents) filter (where created_at::date = current_date and status = 'Concluído'), 0::bigint) as total_sales_today_cents,
  case
    when count(*) filter (where created_at::date = current_date and status = 'Concluído') > 0 
    then round(sum(total_amount_cents) filter (where created_at::date = current_date and status = 'Concluído')::numeric / count(*) filter (where created_at::date = current_date and status = 'Concluído')::numeric)::integer
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

grant select on public.order_summaries to anon, authenticated, service_role, postgres;

-- 7. Drop legacy vw_* views
drop view if exists public.vw_inventory_alerts cascade;
drop view if exists public.vw_inventory_summary cascade;
drop view if exists public.vw_menu_items cascade;
drop view if exists public.vw_menu_summary cascade;
drop view if exists public.vw_orders_live cascade;
drop view if exists public.vw_orders_summary cascade;
