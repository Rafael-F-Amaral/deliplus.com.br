-- Migration: Add CRUD policies to customers table for authenticated store managers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'public.customers'::regclass AND polname = 'customers_insert') THEN
    CREATE POLICY "customers_insert" ON public.customers FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = customers.store_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'public.customers'::regclass AND polname = 'customers_update') THEN
    CREATE POLICY "customers_update" ON public.customers FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = customers.store_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'public.customers'::regclass AND polname = 'customers_delete') THEN
    CREATE POLICY "customers_delete" ON public.customers FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = customers.store_id));
  END IF;
END $$;
