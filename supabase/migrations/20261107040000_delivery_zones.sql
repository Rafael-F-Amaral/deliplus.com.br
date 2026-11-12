-- Migration: Create delivery_zones table for neighborhood-based delivery pricing
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  neighborhood text NOT NULL,
  fee_cents integer NOT NULL DEFAULT 500,
  min_order_cents integer DEFAULT 0,
  estimated_time_min text DEFAULT '30-50 min',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delivery_zones_store_id_idx ON public.delivery_zones(store_id);

ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'public.delivery_zones'::regclass AND polname = 'Public read delivery_zones') THEN
    CREATE POLICY "Public read delivery_zones" ON public.delivery_zones
      FOR SELECT TO anon
      USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = delivery_zones.store_id AND stores.status = 'active'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'public.delivery_zones'::regclass AND polname = 'Tenant access delivery_zones') THEN
    CREATE POLICY "Tenant access delivery_zones" ON public.delivery_zones
      FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = delivery_zones.store_id))
      WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = delivery_zones.store_id));
  END IF;
END $$;
