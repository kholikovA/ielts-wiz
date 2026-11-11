-- "All homework done for the day" (+2) is paid after the day ends, at the
-- student's local midnight, instead of the moment the last piece is done.
-- Teachers can keep adding homework due that day until midnight and it counts.
-- A day = the student's local calendar date of each assignment's deadline.

-- Student's local calendar date (falls back to UTC for a missing/invalid timezone).
create or replace function public.local_date(uid uuid, ts timestamptz default now())
returns date language plpgsql stable security definer set search_path = public as $$
declare tz text;
begin
  select timezone into tz from profiles where id = uid;
  begin
    return (ts at time zone coalesce(nullif(tz, ''), 'UTC'))::date;
  exception when others then
    return (ts at time zone 'UTC')::date;
  end;
end $$;

-- Pays +2 for p_day once that day is over and everything due on it was done on time.
create or replace function public.check_day_homework(p_student uuid, p_day date)
returns void language plpgsql security definer set search_path = public as $$
declare
  total int;
  on_time int;
begin
  if p_day < coin_epoch_day() or p_day >= local_date(p_student) then return; end if;
  select count(*), count(*) filter (where d.done_at is not null and d.done_at <= d.due_at)
    into total, on_time
  from (
    select a.due_at, assignment_done_at(a.id, p_student) as done_at
    from assignment_recipients r join assignments a on a.id = r.assignment_id
    where r.student_id = p_student and a.publish_at <= now() and a.due_at is not null
      and local_date(p_student, a.due_at) = p_day
  ) d;
  if total > 0 and total = on_time then
    perform award_coins(p_student, 'day_all_homework', p_day::text, null,
      'All homework done · ' || to_char(p_day, 'Dy DD Mon'));
  end if;
end $$;

-- Every 15 minutes: close yesterday (and the day before, in case a run was missed)
-- for every student. Already-paid days are skipped by award_coins.
create or replace function public.coin_day_close()
returns void language plpgsql security definer set search_path = public as $$
declare
  s record;
  today date;
begin
  for s in
    select distinct student_id from class_members
    union select distinct student_id from assignment_recipients
  loop
    today := local_date(s.student_id);
    perform check_day_homework(s.student_id, today - 1);
    perform check_day_homework(s.student_id, today - 2);
  end loop;
end $$;

revoke execute on function public.local_date(uuid, timestamptz) from public, anon;
revoke execute on function public.check_day_homework(uuid, date) from public, anon, authenticated;
revoke execute on function public.coin_day_close() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'coin-day-close') then
    perform cron.unschedule('coin-day-close');
  end if;
end $$;
select cron.schedule('coin-day-close', '*/15 * * * *', 'select public.coin_day_close()');

update public.reward_rules
  set description = 'Paid at midnight when every assignment due that day was completed on time.'
  where key = 'day_all_homework';

-- Today's early payouts are taken back; the midnight run pays them again if
-- everything due today (including homework added later) is done on time.
delete from public.coin_transactions
  where reason = 'day_all_homework' and ref::date >= '2026-11-10';
