alter table public.stores
add column activated_at timestamptz;

alter table public.stores
drop constraint stores_status_check;

alter table public.stores
add constraint stores_status_check
check (status in ('draft', 'ready', 'active', 'inactive'));

alter table public.stores
add constraint stores_status_activated_at_check
check (
  (status in ('draft', 'ready') and activated_at is null)
  or (status in ('active', 'inactive') and activated_at is not null)
);

alter table public.stores
add constraint stores_name_not_blank_check
check (pg_catalog.btrim(name) <> '');

create function private.enforce_store_lifecycle()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'draft' or new.activated_at is not null then
      raise exception using
        errcode = '23514',
        message = 'Store must be inserted as an unactivated draft',
        constraint = 'stores_insert_lifecycle_check';
    end if;

    return new;
  end if;

  if old.activated_at is not null
    and new.activated_at is distinct from old.activated_at then
    raise exception using
      errcode = '23514',
      message = 'Store activation timestamp is immutable',
      constraint = 'stores_activated_at_immutable_check';
  end if;

  if old.status = new.status
    or (old.status = 'draft' and new.status = 'ready')
    or (old.status = 'ready' and new.status = 'draft')
    or (old.status = 'ready' and new.status = 'active')
    or (old.status = 'active' and new.status = 'inactive')
    or (old.status = 'inactive' and new.status = 'active') then
    return new;
  end if;

  raise exception using
    errcode = '23514',
    message = 'Invalid Store lifecycle transition',
    constraint = 'stores_lifecycle_transition_check';
end;
$$;

revoke all
on function private.enforce_store_lifecycle()
from public, anon, authenticated, service_role;

create trigger stores_enforce_lifecycle
before insert or update on public.stores
for each row
execute function private.enforce_store_lifecycle();
