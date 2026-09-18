create function public.get_public_store_by_slug(p_slug text)
returns table (name text, slug text)
language sql
stable
security definer
set search_path = ''
as $$
  select store.name, store.slug
  from public.stores as store
  where store.slug = p_slug
    and store.status = 'active'
    and pg_catalog.char_length(p_slug) between 3 and 63
    and p_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$';
$$;

alter function public.get_public_store_by_slug(text) owner to postgres;
revoke all on function public.get_public_store_by_slug(text)
  from public, anon, authenticated, service_role;
grant execute on function public.get_public_store_by_slug(text) to anon;

comment on function public.get_public_store_by_slug(text) is
  'Anonymous exact canonical-slug lookup: only name and slug of an active Store. No tenant or billing facts.';
