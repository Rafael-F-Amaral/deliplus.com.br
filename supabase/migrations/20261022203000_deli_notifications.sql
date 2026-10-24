-- Migration: 20261022203000_deli_notifications.sql
-- Purpose: System messages and broadcast notifications from DeliPlus to merchants

create table if not exists public.deli_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  type text not null default 'info', -- 'info', 'update', 'tip', 'alert'
  priority text not null default 'normal', -- 'normal', 'high', 'urgent'
  action_label text, -- e.g. 'Ver detalhes', 'Acessar agora'
  action_url text, -- internal or external link
  target_plan text default 'all', -- 'all', 'essential', 'multi_2', 'multi_3'
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists public.user_notification_reads (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.deli_notifications(id) on delete cascade,
  clerk_user_id text not null,
  organization_id uuid references public.organizations(id) on delete cascade,
  read_at timestamptz not null default now(),
  constraint user_notification_reads_user_notif_unique unique (notification_id, clerk_user_id)
);

-- Indexes for performance
create index if not exists idx_deli_notifications_active on public.deli_notifications(is_active, created_at desc);
create index if not exists idx_user_notification_reads_lookup on public.user_notification_reads(clerk_user_id, notification_id);

-- Enable RLS
alter table public.deli_notifications enable row level security;
alter table public.user_notification_reads enable row level security;

-- Policies:
-- Any authenticated user can read active notifications
drop policy if exists "Authenticated users can read active deli notifications" on public.deli_notifications;
create policy "Authenticated users can read active deli notifications"
  on public.deli_notifications
  for select
  to authenticated
  using (is_active = true and (expires_at is null or expires_at > now()));

-- Users can read their own read receipts
drop policy if exists "Users can read own notification reads" on public.user_notification_reads;
create policy "Users can read own notification reads"
  on public.user_notification_reads
  for select
  to authenticated
  using (clerk_user_id = private.clerk_user_id());

-- Users can insert their own read receipts
drop policy if exists "Users can mark notifications as read" on public.user_notification_reads;
create policy "Users can mark notifications as read"
  on public.user_notification_reads
  for insert
  to authenticated
  with check (clerk_user_id = private.clerk_user_id());

-- View to get notifications for the active user with is_read status
create or replace view public.v_user_deli_notifications as
select
  n.id,
  n.title,
  n.message,
  n.type,
  n.priority,
  n.action_label,
  n.action_url,
  n.created_at,
  case when r.id is not null then true else false end as is_read,
  r.read_at
from public.deli_notifications n
left join public.user_notification_reads r
  on r.notification_id = n.id
  and r.clerk_user_id = private.clerk_user_id()
where n.is_active = true
  and (n.expires_at is null or n.expires_at > now())
order by n.created_at desc;

grant select on public.v_user_deli_notifications to authenticated;
grant select, insert on public.user_notification_reads to authenticated;
grant select on public.deli_notifications to authenticated;

-- Seed initial welcome notifications from Deli
insert into public.deli_notifications (title, message, type, priority, action_label, action_url)
values
  (
    'Bem-vindo ao DeliPlus! 🍕',
    'Seu painel operacional está pronto. Cadastre seus produtos no Cardápio e comece a receber pedidos online.',
    'info',
    'high',
    'Ver Cardápio',
    '/dashboard/menu'
  ),
  (
    'Estúdio de Cupons Ativo 🎨',
    'Crie artes personalizadas no formato do Instagram e WhatsApp para divulgar suas promoções com 1 clique.',
    'update',
    'normal',
    'Criar Cupom',
    '/dashboard/marketing/coupons'
  ),
  (
    'Dica de Vendas: Fotos nos Produtos 📸',
    'Restaurantes com fotos em todos os itens do cardápio vendem até 40% a mais no delivery.',
    'tip',
    'normal',
    'Adicionar Fotos',
    '/dashboard/menu'
  )
on conflict do nothing;
