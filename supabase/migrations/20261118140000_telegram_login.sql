-- Telegram login: a student links their Telegram account once (Profile), then
-- can sign in with it. The link is written only by the telegram-auth edge
-- function (service role) after it checks Telegram's signature, so students
-- can't point their profile at someone else's Telegram id.
alter table public.profiles
  add column if not exists telegram_id bigint unique,
  add column if not exists telegram_username text,
  add column if not exists telegram_linked_at timestamptz;

create or replace function public.guard_profile_telegram()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin_user(auth.uid()) then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.telegram_id := null;
    new.telegram_username := null;
    new.telegram_linked_at := null;
  elsif new.telegram_id is distinct from old.telegram_id
     or new.telegram_username is distinct from old.telegram_username
     or new.telegram_linked_at is distinct from old.telegram_linked_at then
    raise exception 'Link Telegram from your profile page' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists guard_profile_telegram on public.profiles;
create trigger guard_profile_telegram
  before insert or update on public.profiles
  for each row execute function public.guard_profile_telegram();
