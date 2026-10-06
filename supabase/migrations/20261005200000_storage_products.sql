-- Migration: Setup Supabase Storage for Products
-- Creates 'products' public bucket and sets appropriate access policies

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

-- 1. Public read policy for customer storefront and dashboard
drop policy if exists "Public Access Products" on storage.objects;
create policy "Public Access Products"
  on storage.objects for select
  to public
  using (bucket_id = 'products');

-- 2. Authenticated upload
drop policy if exists "Authenticated Upload Products" on storage.objects;
create policy "Authenticated Upload Products"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'products');

-- 3. Authenticated update
drop policy if exists "Authenticated Update Products" on storage.objects;
create policy "Authenticated Update Products"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'products');

-- 4. Authenticated delete
drop policy if exists "Authenticated Delete Products" on storage.objects;
create policy "Authenticated Delete Products"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'products');
