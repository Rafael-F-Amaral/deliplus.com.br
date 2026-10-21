-- Migration: Reports Analytical Views & Indexes
-- DeliPlus Architecture: Domain-driven analytical views with security_invoker = true
-- Enables flexible date filtering (calendar-ready) and lightning-fast metrics aggregation

-- 1. Daily Sales View (Calendar-ready for timeline & daily averages)
create or replace view public.report_sales_daily
with (security_invoker = true) as
select
  o.store_id,
  (o.created_at at time zone 'America/Sao_Paulo')::date as order_date,
  count(*) filter (where o.status = 'Concluído')::integer as total_orders,
  coalesce(sum(o.total_amount_cents) filter (where o.status = 'Concluído'), 0)::bigint as total_sales_cents,
  case 
    when count(*) filter (where o.status = 'Concluído') > 0
    then round(sum(o.total_amount_cents) filter (where o.status = 'Concluído')::numeric / count(*) filter (where o.status = 'Concluído'))::integer
    else 0
  end as avg_ticket_cents,
  count(*) filter (where o.status = 'Concluído' and o.delivery_type = 'Delivery')::integer as delivery_orders_count,
  coalesce(sum(o.total_amount_cents) filter (where o.status = 'Concluído' and o.delivery_type = 'Delivery'), 0)::bigint as delivery_sales_cents,
  count(*) filter (where o.status = 'Concluído' and o.delivery_type <> 'Delivery')::integer as pickup_orders_count,
  coalesce(sum(o.total_amount_cents) filter (where o.status = 'Concluído' and o.delivery_type <> 'Delivery'), 0)::bigint as pickup_sales_cents,
  count(*) filter (where o.status = 'Cancelado')::integer as canceled_orders
from public.orders o
group by o.store_id, (o.created_at at time zone 'America/Sao_Paulo')::date;

grant select on public.report_sales_daily to anon, authenticated, service_role, postgres;

-- 2. Orders by Hour View (Distribution across 24h & days of the week)
create or replace view public.report_orders_by_hour
with (security_invoker = true) as
select
  o.store_id,
  (o.created_at at time zone 'America/Sao_Paulo')::date as order_date,
  extract(isodow from (o.created_at at time zone 'America/Sao_Paulo'))::integer as day_of_week, -- 1=Seg, 7=Dom
  extract(hour from (o.created_at at time zone 'America/Sao_Paulo'))::integer as hour_of_day, -- 0..23
  count(*) filter (where o.status = 'Concluído')::integer as orders_count,
  coalesce(sum(o.total_amount_cents) filter (where o.status = 'Concluído'), 0)::bigint as total_sales_cents
from public.orders o
group by o.store_id, (o.created_at at time zone 'America/Sao_Paulo')::date, extract(isodow from (o.created_at at time zone 'America/Sao_Paulo')), extract(hour from (o.created_at at time zone 'America/Sao_Paulo'));

grant select on public.report_orders_by_hour to anon, authenticated, service_role, postgres;

-- 3. Top Products & ABC Curve View
create or replace view public.report_top_products
with (security_invoker = true) as
select
  o.store_id,
  (o.created_at at time zone 'America/Sao_Paulo')::date as order_date,
  oi.product_id,
  coalesce(p.name, oi.name) as product_name,
  coalesce(c.name, 'Geral') as category_name,
  coalesce(sum(oi.quantity), 0)::integer as quantity_sold,
  coalesce(sum(oi.total_price_cents), 0)::bigint as total_revenue_cents
from public.orders o
join public.order_items oi on oi.order_id = o.id
left join public.products p on p.id = oi.product_id
left join public.categories c on c.id = p.category_id
where o.status = 'Concluído'
group by o.store_id, (o.created_at at time zone 'America/Sao_Paulo')::date, oi.product_id, coalesce(p.name, oi.name), coalesce(c.name, 'Geral');

grant select on public.report_top_products to anon, authenticated, service_role, postgres;

-- 4. Customer Retention & WhatsApp Repurchase View
create or replace view public.report_customer_retention
with (security_invoker = true) as
select
  o.store_id,
  o.customer_phone,
  max(o.customer_name) as customer_name,
  min((o.created_at at time zone 'America/Sao_Paulo')::date) as first_order_date,
  max((o.created_at at time zone 'America/Sao_Paulo')::date) as last_order_date,
  count(*)::integer as total_orders,
  coalesce(sum(o.total_amount_cents), 0)::bigint as total_spent_cents,
  case when count(*) >= 2 then true else false end as is_repeat_customer
from public.orders o
where o.status = 'Concluído' and o.customer_phone is not null and o.customer_phone <> ''
group by o.store_id, o.customer_phone;

grant select on public.report_customer_retention to anon, authenticated, service_role, postgres;

-- 5. Sales Channels View (Delivery vs Retirada)
create or replace view public.report_sales_channels
with (security_invoker = true) as
select
  o.store_id,
  (o.created_at at time zone 'America/Sao_Paulo')::date as order_date,
  case when o.delivery_type = 'Delivery' then 'Delivery' else 'Retirada' end as channel,
  count(*)::integer as orders_count,
  coalesce(sum(o.total_amount_cents), 0)::bigint as total_sales_cents
from public.orders o
where o.status = 'Concluído'
group by o.store_id, (o.created_at at time zone 'America/Sao_Paulo')::date, case when o.delivery_type = 'Delivery' then 'Delivery' else 'Retirada' end;

grant select on public.report_sales_channels to anon, authenticated, service_role, postgres;

-- 6. High performance composite indexes for date and store range scans
create index if not exists idx_orders_reports_covering 
on public.orders (store_id, status, created_at);

create index if not exists idx_order_items_reports_covering 
on public.order_items (order_id, product_id);
