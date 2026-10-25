-- ================================================================
-- Migration: Store Settings Expansion (Profile, Pix, Hours, Printer)
-- ================================================================

alter table public.store_delivery_settings
  add column if not exists phone text not null default '',
  add column if not exists instagram text not null default '',
  add column if not exists address text not null default '',
  add column if not exists bio text not null default '',
  add column if not exists category text not null default 'Restaurante',
  add column if not exists logo_url text,
  add column if not exists banner_url text,
  add column if not exists pix_key text not null default '',
  add column if not exists pix_key_type text not null default 'cpf',
  add column if not exists accept_cash boolean not null default true,
  add column if not exists need_change_option boolean not null default true,
  add column if not exists accept_card boolean not null default true,
  add column if not exists accept_pix boolean not null default true,
  add column if not exists accept_meal_voucher boolean not null default false,
  add column if not exists business_hours jsonb not null default '{
    "seg": {"open": "18:00", "close": "23:00", "enabled": true},
    "ter": {"open": "18:00", "close": "23:00", "enabled": true},
    "qua": {"open": "18:00", "close": "23:00", "enabled": true},
    "qui": {"open": "18:00", "close": "23:00", "enabled": true},
    "sex": {"open": "18:00", "close": "23:59", "enabled": true},
    "sab": {"open": "18:00", "close": "23:59", "enabled": true},
    "dom": {"open": "18:00", "close": "23:00", "enabled": true}
  }'::jsonb,
  add column if not exists printer_settings jsonb not null default '{
    "auto_print": false,
    "paper_width": "80mm",
    "copies": 1,
    "sound_alerts": true
  }'::jsonb;

-- Setup Supabase Storage for Store Assets (Logos and Banners)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('store-assets', 'store-assets', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set public = true;

drop policy if exists "Public Access Store Assets" on storage.objects;
create policy "Public Access Store Assets" on storage.objects for select to public using (bucket_id = 'store-assets');

drop policy if exists "Authenticated Upload Store Assets" on storage.objects;
create policy "Authenticated Upload Store Assets" on storage.objects for insert to authenticated with check (bucket_id = 'store-assets');

drop policy if exists "Authenticated Update Store Assets" on storage.objects;
create policy "Authenticated Update Store Assets" on storage.objects for update to authenticated using (bucket_id = 'store-assets');

drop policy if exists "Authenticated Delete Store Assets" on storage.objects;
create policy "Authenticated Delete Store Assets" on storage.objects for delete to authenticated using (bucket_id = 'store-assets');

