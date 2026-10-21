-- Coins v2: a small, consistency-based economy agreed with Abdullah on
-- 2026-10-21, plus manual teacher awards.
--
--   +2  all homework due that day done on time        (day_all_homework)
--   +5  all of the week's flashcard words learned     (week_words_learned)
--   +1  attended a class (present or late)            (attendance_present / attendance_late)
--   +5  perfect homework week                         (week_perfect_homework)
--   +5  perfect attendance week                       (week_perfect_attendance)
--   +1  word game, once a day                         (word_game)
--   -1  missed 2+ classes in a week                   (week_missed_classes, threshold = 2)
--   -1  each missed homework                          (missed_homework)
--
-- Every earlier rule is kept but disabled. Weeks run Monday to Sunday in the
-- student's timezone with the 4am rollover (study_day). Weekly rules and
-- missed homework are applied by coin_sweep(), run hourly by pg_cron.

alter table public.reward_rules add column if not exists enabled boolean not null default true;
alter table public.reward_rules add column if not exists description text;
alter table public.reward_rules add column if not exists threshold int;

alter table public.coin_transactions add column if not exists source text not null default 'auto'
  check (source in ('auto', 'teacher'));
alter table public.coin_transactions add column if not exists awarded_by uuid references public.profiles(id) on delete set null;

update public.reward_rules set enabled = false
where key not in ('attendance_present', 'attendance_late', 'word_game');

update public.reward_rules set coins = 1, bonus = 0, daily_cap = 1, cap_group = 'games',
  label = 'Word game', description = 'First word game round of the day.', sort = 60
where key = 'word_game';
update public.reward_rules set coins = 1, label = 'Attended class', description = 'Marked present for a class session.', sort = 30
where key = 'attendance_present';
update public.reward_rules set coins = 1, label = 'Attended class (late)', description = 'Marked late for a class session.', sort = 31
where key = 'attendance_late';

insert into public.reward_rules (key, label, coins, description, threshold, sort) values
  ('day_all_homework',       'All homework done for the day', 2, 'Every assignment due that day was completed on time.', null, 10),
  ('week_words_learned',     'All of the week''s words learned', 5, 'Every flashcard word assigned that week reached long-term review by the end of the week.', null, 20),
  ('week_perfect_homework',  'Perfect homework week', 5, 'Every assignment due that week was completed on time.', null, 40),
  ('week_perfect_attendance','Perfect attendance week', 5, 'Attended every class that week (excused and unmarked sessions don''t count against it).', null, 50),
  ('week_missed_classes',    'Missed classes this week', -1, 'Absent from this many classes or more in one week.', 2, 70),
  ('missed_homework',        'Missed homework', -1, 'An assignment''s deadline passed and it wasn''t done.', null, 80)
on conflict (key) do update set
  label = excluded.label, coins = excluded.coins, description = excluded.description,
  threshold = excluded.threshold, sort = excluded.sort, enabled = true;

-- Disabled rules award nothing; negative rules (penalties) are allowed.
create or replace function public.award_coins(p_student uuid, p_rule text, p_ref text, p_amount int default null, p_label text default null)
returns int language plpgsql security definer set search_path = public as $$
declare
  r reward_rules;
  amt int;
  v_day date := study_day(p_student);
  used int;
  n int;
begin
  select * into r from reward_rules where key = p_rule;
  if not found or not r.enabled then return 0; end if;
  amt := coalesce(p_amount, r.coins);
  if amt is null or amt = 0 then return 0; end if;
  if amt > 0 and r.daily_cap is not null then
    select coalesce(sum(t.amount), 0) into used
    from coin_transactions t join reward_rules rr on rr.key = t.reason
    where t.student_id = p_student and t.day = v_day and rr.cap_group = r.cap_group and t.amount > 0;
    amt := least(amt, r.daily_cap - used);
    if amt <= 0 then return 0; end if;
  end if;
  insert into coin_transactions (student_id, reason, label, amount, ref, day)
  values (p_student, p_rule, coalesce(p_label, r.label), amt, p_ref, v_day)
  on conflict (student_id, reason, ref) do nothing;
  get diagnostics n = row_count;
  return case when n > 0 then amt else 0 end;
end $$;

-- Word game: the rule's coins, no accuracy bonus (cap of 1/day does the rest).
create or replace function public.coins_on_game()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.total >= 5 then
    perform award_coins(new.student_id, 'word_game', new.id::text);
  end if;
  perform note_activity(new.student_id);
  return new;
end $$;

-- When an assignment was completed (null if not yet).
create or replace function public.assignment_done_at(p_assignment uuid, p_student uuid)
returns timestamptz language sql stable security definer set search_path = public as $$
  select coalesce(
    (select s.submitted_at from submissions s
      where s.assignment_id = a.id and s.student_id = p_student and s.status = 'submitted'),
    (select min(t.completed_at) from user_test_results t
      where a.kind = 'test' and t.user_id = p_student
        and t.kind = a.payload->>'kind' and t.test_id = a.payload->>'test_id'
        and t.completed_at >= a.created_at))
  from assignments a where a.id = p_assignment;
$$;

-- +2 once every assignment due on that study day is done on time.
create or replace function public.check_day_homework(p_student uuid, p_day date)
returns void language plpgsql security definer set search_path = public as $$
declare
  total int;
  on_time int;
begin
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

-- Called on every completion (submission or test attempt).
create or replace function public.award_homework(p_student uuid, p_assignment uuid, p_done_at timestamptz)
returns void language plpgsql security definer set search_path = public as $$
declare a assignments;
begin
  select * into a from assignments where id = p_assignment;
  if not found or a.due_at is null then return; end if;
  -- Kept for if the old per-assignment rules are re-enabled.
  perform award_coins(p_student, 'homework_on_time', a.id::text, null, 'Homework: ' || a.title);
  perform check_day_homework(p_student, study_day(p_student, a.due_at));
end $$;

-- ── Hourly sweep: weekly rules + missed homework ─────────────────────────────
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
begin
  select threshold into thr from reward_rules where key = 'week_missed_classes';

  for s in
    select distinct student_id from class_members
    union select distinct student_id from assignment_recipients
  loop
    -- The most recent full week (Mon–Sun) in this student's study days.
    wk := date_trunc('week', study_day(s.student_id) - 7)::date;
    wk_end := wk + 7;
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

  -- Missed homework: deadline passed (within the last week) and not done by it.
  for a in
    select r.student_id, a2.id, a2.title, a2.due_at
    from assignment_recipients r join assignments a2 on a2.id = r.assignment_id
    where a2.due_at < now() and a2.due_at > now() - interval '7 days' and a2.publish_at <= a2.due_at
  loop
    if coalesce(assignment_done_at(a.id, a.student_id) <= a.due_at, false) = false then
      perform award_coins(a.student_id, 'missed_homework', a.id::text, null, 'Missed homework: ' || a.title);
    end if;
  end loop;
end $$;

revoke execute on function public.coin_sweep() from public, anon, authenticated;
revoke execute on function public.check_day_homework(uuid, date) from public, anon, authenticated;
revoke execute on function public.assignment_done_at(uuid, uuid) from public, anon, authenticated;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'coin-sweep') then
    perform cron.unschedule('coin-sweep');
  end if;
end $$;
select cron.schedule('coin-sweep', '7 * * * *', 'select public.coin_sweep()');

-- ── Manual awards by teachers ────────────────────────────────────────────────
create or replace function public.teacher_award_coins(p_students uuid[], p_amount int, p_reason text)
returns int language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  sid uuid;
  n int := 0;
  v_reason text := nullif(trim(p_reason), '');
begin
  if uid is null or not public.is_teacher_user(uid) then
    raise exception 'Teachers only' using errcode = '42501';
  end if;
  if p_amount = 0 or abs(p_amount) > 100 then
    raise exception 'Amount must be between -100 and 100, and not 0' using errcode = '22023';
  end if;
  if v_reason is null then
    raise exception 'Add a reason' using errcode = '22023';
  end if;
  foreach sid in array p_students loop
    if not (public.is_teacher_of(uid, sid) or public.is_admin_user(uid)) then
      raise exception 'Not your student' using errcode = '42501';
    end if;
    insert into coin_transactions (student_id, reason, label, amount, ref, day, source, awarded_by)
    values (sid, 'manual', left(v_reason, 120), p_amount, gen_random_uuid()::text, study_day(sid), 'teacher', uid);
    n := n + 1;
  end loop;
  return n;
end $$;

revoke execute on function public.teacher_award_coins(uuid[], int, text) from public, anon;
grant execute on function public.teacher_award_coins(uuid[], int, text) to authenticated;
