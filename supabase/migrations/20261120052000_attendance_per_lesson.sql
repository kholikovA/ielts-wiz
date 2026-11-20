-- Attendance per lesson, like the EduSchool journal: one register per para
-- (class_sessions.period, 1-8) instead of one per day, so a double lesson has
-- two registers and the second can be copied from the first. Older registers
-- (period null) stay whole-day registers.
--
-- Coins, streaks and the weekly attendance rules still count a *lesson* once:
-- every register of the same class, type and Tashkent day is one lesson, and
-- the student's best mark in it counts (present beats late beats absent).
-- So a double lesson pays like one lesson, as before, and an office-hours
-- register is its own lesson.

alter table public.class_sessions
  add column if not exists period smallint check (period between 1 and 8);

create or replace function public.session_day(t timestamptz)
returns date language sql immutable set search_path = '' as $$
  select (t at time zone 'Asia/Tashkent')::date;
$$;

-- One register per class, para, type and day.
create unique index if not exists class_sessions_lesson_uq
  on public.class_sessions (class_id, kind, period, public.session_day(held_at))
  where period is not null;

-- Open (or create) the register of one para. Runs as the caller (RLS: the
-- class teacher). held_at = when the para starts.
create or replace function public.lesson_register(p_class uuid, p_held_at timestamptz, p_period smallint, p_kind text default 'lesson')
returns public.class_sessions language plpgsql security invoker set search_path = public as $$
declare
  r class_sessions;
begin
  select * into r from class_sessions
   where class_id = p_class and kind = p_kind and period = p_period and session_day(held_at) = session_day(p_held_at);
  if found then return r; end if;
  insert into class_sessions (class_id, held_at, kind, period)
  values (p_class, p_held_at, p_kind, p_period)
  on conflict (class_id, kind, period, session_day(held_at)) where period is not null do nothing
  returning * into r;
  if r.id is null then
    select * into r from class_sessions
     where class_id = p_class and kind = p_kind and period = p_period and session_day(held_at) = session_day(p_held_at);
  end if;
  return r;
end $$;
revoke all on function public.lesson_register(uuid, timestamptz, smallint, text) from public, anon;
grant execute on function public.lesson_register(uuid, timestamptz, smallint, text) to authenticated;

-- Copy one register's marks onto another of the same class (e.g. 1-para → 2-para).
create or replace function public.copy_register(p_from uuid, p_to uuid)
returns int language plpgsql security invoker set search_path = public as $$
declare
  n int;
begin
  if (select class_id from class_sessions where id = p_from) is distinct from (select class_id from class_sessions where id = p_to) then
    raise exception 'Both registers must be of the same class' using errcode = '22023';
  end if;
  insert into attendance (session_id, student_id, status, marked_at)
  select p_to, a.student_id, a.status, now() from attendance a where a.session_id = p_from
  on conflict (session_id, student_id) do update set status = excluded.status, marked_at = excluded.marked_at;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.copy_register(uuid, uuid) from public, anon;
grant execute on function public.copy_register(uuid, uuid) to authenticated;

-- Attendance coins: once per lesson (class + day + type), for the best mark.
create or replace function public.coins_on_attendance()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  s class_sessions;
  k text;
  best text;
begin
  if tg_op = 'UPDATE' and old.status = new.status then return new; end if;
  select * into s from class_sessions where id = new.session_id;
  if s.held_at < coin_epoch() then return new; end if;
  k := 'lesson:' || s.class_id || ':' || session_day(s.held_at) || ':' || s.kind;
  select case when bool_or(a.status = 'present') then 'present' when bool_or(a.status = 'late') then 'late' end
    into best
  from attendance a join class_sessions x on x.id = a.session_id
  where a.student_id = new.student_id and x.class_id = s.class_id and x.kind = s.kind
    and session_day(x.held_at) = session_day(s.held_at);
  -- Registers from before this change used the session id as the ref.
  delete from coin_transactions
   where student_id = new.student_id and reason in ('attendance_present', 'attendance_late')
     and (ref = k or ref in (select x.id::text from class_sessions x
                             where x.class_id = s.class_id and x.kind = s.kind and session_day(x.held_at) = session_day(s.held_at)));
  if best is not null then
    perform award_coins(new.student_id, 'attendance_' || best, k);
    perform award_streak_milestone(new.student_id, 'attendance', attendance_streak(new.student_id), k);
  end if;
  return new;
end $$;

-- Lessons attended in a row, newest first (a lesson = class + day + type).
create or replace function public.attendance_streak(p_student uuid)
returns integer language plpgsql stable security definer set search_path = public as $$
declare
  rec record;
  streak int := 0;
begin
  for rec in
    select case when bool_or(att.status in ('present', 'late')) then 'present'
                when bool_or(att.status = 'absent') then 'absent' end as status
    from class_sessions cs
    join class_members m on m.class_id = cs.class_id and m.student_id = p_student
    left join attendance att on att.session_id = cs.id and att.student_id = p_student
    where cs.held_at <= now() and cs.held_at >= m.joined_at - interval '1 day'
    group by cs.class_id, cs.kind, session_day(cs.held_at)
    order by max(cs.held_at) desc
  loop
    if rec.status is null then continue; end if;
    if rec.status = 'absent' then exit; end if;
    streak := streak + 1;
  end loop;
  return streak;
end $$;

CREATE OR REPLACE FUNCTION public.coin_sweep()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    wk := date_trunc('week', study_day(s.student_id) - 7)::date;
    wk_end := wk + 7;
    continue when wk_end <= ep_day;
    label_wk := 'week of ' || to_char(wk, 'DD Mon');

    select count(*), count(*) filter (where d.done_at is not null and d.done_at <= d.due_at)
      into n_total, n_ok
    from (
      select a2.due_at, assignment_passed_at(a2.id, s.student_id) as done_at
      from assignment_recipients r join assignments a2 on a2.id = r.assignment_id
      where r.student_id = s.student_id and a2.due_at is not null
        and study_day(s.student_id, a2.due_at) >= wk and study_day(s.student_id, a2.due_at) < wk_end
    ) d;
    if n_total > 0 and n_total = n_ok then
      perform award_coins(s.student_id, 'week_perfect_homework', wk::text, null, 'Perfect homework week · ' || label_wk);
    end if;

    -- One count per lesson (class + day + type), however many paras it had.
    select count(*) filter (where g.st = 'attended'), count(*) filter (where g.st = 'absent')
      into n_attended, n_absent
    from (
      select case when bool_or(att.status in ('present', 'late')) then 'attended'
                  when bool_or(att.status = 'absent') then 'absent' end as st
      from class_sessions cs
      join class_members m on m.class_id = cs.class_id and m.student_id = s.student_id
      join attendance att on att.session_id = cs.id and att.student_id = s.student_id
      where study_day(s.student_id, cs.held_at) >= wk and study_day(s.student_id, cs.held_at) < wk_end
      group by cs.class_id, cs.kind, public.session_day(cs.held_at)
    ) g;
    if n_attended > 0 and n_absent = 0 then
      perform award_coins(s.student_id, 'week_perfect_attendance', wk::text, null, 'Perfect attendance week · ' || label_wk);
    end if;
    if n_absent >= coalesce(thr, 2) then
      perform award_coins(s.student_id, 'week_missed_classes', wk::text, null, 'Missed ' || n_absent || ' classes · ' || label_wk);
    end if;

    select count(*), count(*) filter (where c.state = 2) into n_total, n_ok
    from srs_cards c
    where c.student_id = s.student_id and c.assignment_id is not null
      and study_day(s.student_id, c.assigned_at) >= wk and study_day(s.student_id, c.assigned_at) < wk_end;
    if n_total > 0 and n_total = n_ok then
      perform award_coins(s.student_id, 'week_words_learned', wk::text, null, 'All words learned · ' || label_wk);
    end if;
  end loop;

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
end $function$;
