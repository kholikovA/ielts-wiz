-- Notify students about every coin change, with the reason.
-- In-app for all; email only when a teacher gives or takes coins by hand
-- (automatic +1/+2 rewards would otherwise mean an email a day).

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('homework', 'feedback', 'submission', 'retake', 'coins'));

create or replace function public.notify_coins()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  n int := abs(new.amount);
  unit text := case when abs(new.amount) = 1 then ' coin' else ' coins' end;
  who text;
  title text;
begin
  if new.amount = 0 then return new; end if;
  if new.source = 'teacher' then
    who := coalesce((select name from profiles where id = new.awarded_by), 'Your teacher');
    title := who || case when new.amount > 0 then ' gave you ' else ' took ' end || n || unit;
  else
    title := case when new.amount > 0 then 'You earned ' else 'You lost ' end || n || unit;
  end if;
  perform notify(new.student_id, 'coins', title, new.label, '/coins', 'coin:' || new.id,
    now(), new.source = 'teacher');
  return new;
end $$;
revoke execute on function public.notify_coins() from public, anon, authenticated;

drop trigger if exists notify_coins on public.coin_transactions;
create trigger notify_coins
  after insert on public.coin_transactions
  for each row execute function public.notify_coins();
