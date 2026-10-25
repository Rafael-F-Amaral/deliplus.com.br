-- Grant table privileges for inventory and marketing tables to authenticated and service_role
grant all on table public.inventory_items to authenticated, anon, service_role;
grant all on table public.inventory_categories to authenticated, anon, service_role;
grant all on table public.coupons to authenticated, anon, service_role;
grant all on all tables in schema public to authenticated, service_role;
grant all on all sequences in schema public to authenticated, service_role;
