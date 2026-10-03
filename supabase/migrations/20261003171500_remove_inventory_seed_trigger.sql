-- Remove inventory categories seed trigger and function from stores table
drop trigger if exists on_store_created_seed_categories on public.stores;
drop function if exists public.seed_default_inventory_categories();
