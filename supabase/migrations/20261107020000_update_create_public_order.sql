-- Atualização e blindagem da RPC de criação de pedidos públicos
create or replace function public.create_public_order(
  p_store_slug text,
  p_customer_name text,
  p_customer_phone text,
  p_delivery_type text default 'Delivery',
  p_delivery_address text default null,
  p_payment_method text default 'Em Dinheiro',
  p_change_for_cents integer default null,
  p_notes text default null,
  p_items jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store record;
  v_settings record;
  v_order_id uuid;
  v_order_number integer;
  v_display_id text;
  v_subtotal integer := 0;
  v_delivery_fee integer := 0;
  v_total integer := 0;
  v_item jsonb;
  v_item_qty integer;
  v_item_price integer;
  v_item_name text;
  v_item_details text;
  v_item_complements jsonb;
  v_product_id uuid;
  v_real_price integer;
  v_is_active boolean;
  v_daily_remaining integer;
  v_customer_id uuid;
begin
  -- 1. Validar e buscar loja ativa
  select id, name, slug into v_store
  from public.stores
  where slug = p_store_slug and status = 'active';

  if v_store.id is null then
    raise exception 'Loja não encontrada ou inativa.';
  end if;

  -- 2. Buscar configurações de entrega da loja
  select * into v_settings
  from public.store_delivery_settings
  where store_id = v_store.id;

  -- 3. Validar e calcular subtotal a partir dos itens (blindagem contra adulteração de preço e prato esgotado)
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_item_qty := coalesce((v_item->>'quantity')::integer, 1);
    v_item_price := coalesce((v_item->>'unit_price_cents')::integer, 0);

    -- Tentar validar o produto no banco se o ID for válido
    v_product_id := null;
    begin
      v_product_id := (v_item->>'product_id')::uuid;
    exception when others then
      v_product_id := null;
    end;

    if v_product_id is not null then
      select price_cents, is_active, daily_remaining into v_real_price, v_is_active, v_daily_remaining
      from public.products
      where id = v_product_id and store_id = v_store.id;

      if v_is_active is false then
        raise exception 'O produto "%" está temporariamente pausado/esgotado.', coalesce(v_item->>'name', 'Item');
      end if;

      if v_daily_remaining is not null and v_daily_remaining < v_item_qty then
        raise exception 'Estoque insuficiente para o produto "%". Restam apenas % unidades.', coalesce(v_item->>'name', 'Item'), v_daily_remaining;
      end if;

      -- Não permitir preço menor que o cadastrado
      if v_real_price is not null and v_real_price > 0 and v_item_price < v_real_price then
        v_item_price := v_real_price;
      end if;

      -- Decrementar estoque diário real
      if v_daily_remaining is not null then
        update public.products
        set daily_remaining = greatest(0, daily_remaining - v_item_qty)
        where id = v_product_id;
      end if;
    end if;

    v_subtotal := v_subtotal + (v_item_qty * v_item_price);
  end loop;

  -- 4. Taxa de entrega
  if p_delivery_type = 'Delivery' and v_settings.delivery_fee_cents is not null then
    v_delivery_fee := v_settings.delivery_fee_cents;
    if v_settings.free_delivery_above_cents is not null and v_subtotal >= v_settings.free_delivery_above_cents then
      v_delivery_fee := 0;
    end if;
  end if;

  -- 5. Validar pedido mínimo se houver
  if v_settings.min_order_cents is not null and v_subtotal < v_settings.min_order_cents then
    raise exception 'O pedido mínimo para esta loja é de R$ %', (v_settings.min_order_cents / 100.0);
  end if;

  v_total := v_subtotal + v_delivery_fee;

  -- 6. Inserir cabeçalho do pedido
  insert into public.orders (
    store_id,
    customer_name,
    customer_phone,
    delivery_type,
    delivery_address,
    payment_method,
    change_for_cents,
    subtotal_cents,
    delivery_fee_cents,
    total_amount_cents,
    notes,
    status,
    created_at,
    updated_at
  )
  values (
    v_store.id,
    p_customer_name,
    p_customer_phone,
    coalesce(p_delivery_type, 'Delivery'),
    p_delivery_address,
    coalesce(p_payment_method, 'Em Dinheiro'),
    p_change_for_cents,
    v_subtotal,
    v_delivery_fee,
    v_total,
    p_notes,
    'Novo',
    now(),
    now()
  )
  returning id, order_number, display_id into v_order_id, v_order_number, v_display_id;

  -- 7. Inserir itens do pedido com adicionais separados
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_item_qty := coalesce((v_item->>'quantity')::integer, 1);
    v_item_price := coalesce((v_item->>'unit_price_cents')::integer, 0);
    v_item_name := coalesce(v_item->>'name', 'Item');
    v_item_details := v_item->>'details';
    v_item_complements := coalesce(v_item->'complements', '[]'::jsonb);

    v_product_id := null;
    begin
      v_product_id := (v_item->>'product_id')::uuid;
    exception when others then
      v_product_id := null;
    end;

    insert into public.order_items (
      order_id,
      product_id,
      name,
      quantity,
      unit_price_cents,
      total_price_cents,
      details,
      complements
    )
    values (
      v_order_id,
      v_product_id,
      v_item_name,
      v_item_qty,
      v_item_price,
      (v_item_qty * v_item_price),
      v_item_details,
      v_item_complements
    );
  end loop;

  -- 8. Atualizar ou registrar cliente com CRM real
  if p_customer_phone is not null and length(trim(p_customer_phone)) > 0 then
    insert into public.customers (
      store_id,
      name,
      phone,
      orders_count,
      total_spent_cents,
      last_order_at,
      updated_at
    )
    values (
      v_store.id,
      p_customer_name,
      p_customer_phone,
      1,
      v_total,
      now(),
      now()
    )
    on conflict (store_id, phone) where phone is not null and phone <> ''
    do update set
      name = excluded.name,
      orders_count = public.customers.orders_count + 1,
      total_spent_cents = public.customers.total_spent_cents + excluded.total_spent_cents,
      last_order_at = now(),
      updated_at = now()
    returning id into v_customer_id;

    if v_customer_id is not null then
      update public.orders
      set customer_id = v_customer_id
      where id = v_order_id;
    end if;
  end if;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'display_id', v_display_id,
    'store_slug', v_store.slug,
    'total_amount_cents', v_total
  );
end;
$$;

grant execute on function public.create_public_order(text, text, text, text, text, text, integer, text, jsonb) to anon, authenticated;
