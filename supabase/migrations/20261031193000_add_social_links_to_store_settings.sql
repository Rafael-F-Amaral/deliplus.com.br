-- ================================================================
-- Migration: Add social_links jsonb to store_delivery_settings
-- Supports: whatsapp, instagram, facebook, youtube, tiktok, kwai
-- ================================================================

alter table public.store_delivery_settings
  add column if not exists social_links jsonb not null default '{
    "whatsapp": "",
    "instagram": "",
    "facebook": "",
    "youtube": "",
    "tiktok": "",
    "kwai": ""
  }'::jsonb;
