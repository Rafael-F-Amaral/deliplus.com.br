-- Migration: Order tracking RPC and public select policy for order tracking & realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'public.orders'::regclass AND polname = 'Public read orders for tracking') THEN
    CREATE POLICY "Public read orders for tracking" ON public.orders
      FOR SELECT TO anon
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'public.order_items'::regclass AND polname = 'Public read order_items for tracking') THEN
    CREATE POLICY "Public read order_items for tracking" ON public.order_items
      FOR SELECT TO anon
      USING (true);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_public_order_tracking(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
  v_items jsonb;
  v_store record;
  v_settings record;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF v_order.id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT name, slug INTO v_store FROM public.stores WHERE id = v_order.store_id;
  SELECT phone, logo_url INTO v_settings FROM public.store_delivery_settings WHERE store_id = v_order.store_id;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', oi.id,
      'name', oi.name,
      'qty', oi.quantity,
      'unit_price_cents', oi.unit_price_cents,
      'complements', oi.complements
    )
  ) INTO v_items
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id;

  RETURN jsonb_build_object(
    'id', v_order.id,
    'order_number', v_order.order_number,
    'display_id', v_order.display_id,
    'status', v_order.status,
    'delivery_type', v_order.delivery_type,
    'delivery_address', v_order.delivery_address,
    'customer_name', v_order.customer_name,
    'payment_method', v_order.payment_method,
    'subtotal_cents', v_order.subtotal_cents,
    'delivery_fee_cents', v_order.delivery_fee_cents,
    'total_amount_cents', v_order.total_amount_cents,
    'notes', v_order.notes,
    'created_at', v_order.created_at,
    'updated_at', v_order.updated_at,
    'store_name', coalesce(v_store.name, 'Restaurante'),
    'store_slug', coalesce(v_store.slug, ''),
    'store_phone', coalesce(v_settings.phone, ''),
    'store_logo', v_settings.logo_url,
    'items', coalesce(v_items, '[]'::jsonb)
  );
END;
$$;
