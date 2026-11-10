-- Coin reset (10 Nov 2026): wipe every coin entry made before midnight
-- Tashkent time (2026-11-10 00:00 +05 = 2026-11-09 19:00 UTC).
--
-- Coins are only skipped when a matching entry already exists, so deleting old
-- entries would let the hourly sweep and some triggers issue them again. Every
-- rule that can pay out for a past period now ignores anything before
-- coin_epoch(). A future reset is: update coin_config, then delete.

create table if not exists public.coin_config (
  id boolean primary key default true check (id),
  epoch timestamptz not null,       -- coins are only issued for activity from here on
  epoch_day date not null           -- the same moment as a study day
);
alter table public.coin_config enable row level security;
insert into public.coin_config (id, epoch, epoch_day)
values (true, '2026-11-09 19:00:00+00', '2026-11-10')
on conflict (id) do update set epoch = excluded.epoch, epoch_day = excluded.epoch_day;

create or replace function public.coin_epoch()
returns timestamptz language sql stable security definer set search_path = public as $$
  select coalesce((select epoch from coin_config where id), '-infinity'::timestamptz);
$$;
create or replace function public.coin_epoch_day()
returns date language sql stable security definer set search_path = public as $$
  select coalesce((select epoch_day from coin_config where id), '-infinity'::date);
$$;

-- +2 once every assignment due on that study day is done on time (not for days before the reset).
create or replace function public.check_day_homework(p_student uuid, p_day date)
returns void language plpgsql security definer set search_path = public as $$
declare
  total int;
  on_time int;
begin
  if p_day < coin_epoch_day() then return; end if;
  select count(*), count(*) filter (where d.done_at is not null and d.done_at <= d.due_at)
    into total, on_time
  from (
    select a.due_at, assignment_done_at(a.id, p_student) as done_at
    from assignment_recipients r join assignments a on a.id = r.assignment_id
    where r.student_id = p_student and a.publish_at <= now() and a.due_at is not null
      and study_day(p_student, a.due_at) = p_day
  ) d;
  if total > 0 and total = on_time then
    perform award_coins(p_student, 'day_all_homework', p_day::text, null,
      'All homework done · ' || to_char(p_day, 'Dy DD Mon'));
  end if;
end $$;

-- Attendance coins: classes held before the reset are left alone.
create or replace function public.coins_on_attendance()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and old.status = new.status then return new; end if;
  if (select held_at from class_sessions where id = new.session_id) < coin_epoch() then return new; end if;
  delete from coin_transactions
    where student_id = new.student_id and reason in ('attendance_present', 'attendance_late') and ref = new.session_id::text;
  if new.status in ('present', 'late') then
    perform award_coins(new.student_id, 'attendance_' || new.status, new.session_id::text);
    perform award_streak_milestone(new.student_id, 'attendance', attendance_streak(new.student_id), new.session_id::text);
  end if;
  return new;
end $$;

-- Weekly rules and missed homework: only weeks that end after the reset, and
-- only deadlines after it.
create or replace function public.coin_sweep()
returns void language plpgsql security definer set search_path = public as $$
declare
  s record;
  a record;
  wk date;
  wk_end date;
  label_wk text;
  n_total int;
  n_ok int;
  n_absent int;
  n_attended int;
  thr int;
  ep_day date := coin_epoch_day();
begin
  select threshold into thr from reward_rules where key = 'week_missed_classes';

  for s in
    select distinct student_id from class_members
    union select distinct student_id from assignment_recipients
  loop
    -- The most recent full week (Mon–Sun) in this student's study days.
    wk := date_trunc('week', study_day(s.student_id) - 7)::date;
    wk_end := wk + 7;
    continue when wk_end <= ep_day;
    label_wk := 'week of ' || to_char(wk, 'DD Mon');

    -- Perfect homework week.
    select count(*), count(*) filter (where d.done_at is not null and d.done_at <= d.due_at)
      into n_total, n_ok
    from (
      select a2.due_at, assignment_done_at(a2.id, s.student_id) as done_at
      from assignment_recipients r join assignments a2 on a2.id = r.assignment_id
      where r.student_id = s.student_id and a2.due_at is not null
        and study_day(s.student_id, a2.due_at) >= wk and study_day(s.student_id, a2.due_at) < wk_end
    ) d;
    if n_total > 0 and n_total = n_ok then
      perform award_coins(s.student_id, 'week_perfect_homework', wk::text, null, 'Perfect homework week · ' || label_wk);
    end if;

    -- Attendance: perfect week, or 2+ absences.
    select count(*) filter (where att.status in ('present', 'late')), count(*) filter (where att.status = 'absent')
      into n_attended, n_absent
    from class_sessions cs
    join class_members m on m.class_id = cs.class_id and m.student_id = s.student_id
    join attendance att on att.session_id = cs.id and att.student_id = s.student_id
    where study_day(s.student_id, cs.held_at) >= wk and study_day(s.student_id, cs.held_at) < wk_end;
    if n_attended > 0 and n_absent = 0 then
      perform award_coins(s.student_id, 'week_perfect_attendance', wk::text, null, 'Perfect attendance week · ' || label_wk);
    end if;
    if n_absent >= coalesce(thr, 2) then
      perform award_coins(s.student_id, 'week_missed_classes', wk::text, null, 'Missed ' || n_absent || ' classes · ' || label_wk);
    end if;

    -- All of the week's words learned (in long-term review) by now.
    select count(*), count(*) filter (where c.state = 2) into n_total, n_ok
    from srs_cards c
    where c.student_id = s.student_id and c.assignment_id is not null
      and study_day(s.student_id, c.assigned_at) >= wk and study_day(s.student_id, c.assigned_at) < wk_end;
    if n_total > 0 and n_total = n_ok then
      perform award_coins(s.student_id, 'week_words_learned', wk::text, null, 'All words learned · ' || label_wk);
    end if;
  end loop;

  -- Missed homework: deadline passed (within the last week, after the reset) and not done by it.
  for a in
    select r.student_id, a2.id, a2.title, a2.due_at
    from assignment_recipients r join assignments a2 on a2.id = r.assignment_id
    where a2.due_at < now() and a2.due_at > now() - interval '7 days' and a2.due_at >= coin_epoch()
      and a2.publish_at <= a2.due_at
  loop
    if coalesce(assignment_done_at(a.id, a.student_id) <= a.due_at, false) = false then
      perform award_coins(a.student_id, 'missed_homework', a.id::text, null, 'Missed homework: ' || a.title);
    end if;
  end loop;
end $$;

revoke execute on function public.coin_epoch() from public, anon;
revoke execute on function public.coin_epoch_day() from public, anon;
revoke execute on function public.coin_sweep() from public, anon, authenticated;
revoke execute on function public.check_day_homework(uuid, date) from public, anon, authenticated;

-- Keep a copy, then wipe.
create table if not exists public.coin_transactions_backup_20261110 as
  select * from public.coin_transactions where created_at < '2026-11-09 19:00:00+00';
alter table public.coin_transactions_backup_20261110 enable row level security;
delete from public.coin_transactions where created_at < '2026-11-09 19:00:00+00';
