-- Student Hub: coins + streaks, class attendance, scheduled homework,
-- notifications (in-app + email), word games.
--
-- Coins are written ONLY by the triggers below (award_coins is not callable by
-- clients). Every value lives in reward_rules / streak_milestones so it can be
-- tuned without code changes:
--   update public.reward_rules set coins = 3 where key = 'flashcard_new';

-- ── Study day (4am rollover in the student's timezone) ───────────────────────
create or replace function public.study_day(uid uuid, ts timestamptz default now())
returns date language plpgsql stable security definer set search_path = public as $$
declare tz text;
begin
  select timezone into tz from profiles where id = uid;
  begin
    return ((ts at time zone coalesce(nullif(tz, ''), 'UTC')) - interval '4 hours')::date;
  exception when others then
    return ((ts at time zone 'UTC') - interval '4 hours')::date;
  end;
end $$;

-- ── Config ───────────────────────────────────────────────────────────────────
create table if not exists public.reward_rules (
  key text primary key,
  label text not null,
  coins int not null,           -- base coins (or a percentage, for *_percent keys)
  bonus int not null default 0, -- max accuracy bonus on top
  daily_cap int,                -- max coins per study day across cap_group
  cap_group text,
  sort int not null default 0
);

insert into public.reward_rules (key, label, coins, bonus, daily_cap, cap_group, sort) values
  ('daily_first',             'First study of the day',        5,  0, null, null,         1),
  ('flashcard_new',           'New word learned',              2,  0, 150, 'flashcards', 10),
  ('flashcard_review',        'Flashcard review',              1,  0, 150, 'flashcards', 11),
  ('flashcard_queue_cleared', 'Cleared today''s flashcards',  15,  0, null, null,        12),
  ('word_game',               'Word game round',               5,  5,  60, 'games',      20),
  ('test_part',               'Practice test',                10, 10, null, null,        30),
  ('test_full',               'Full mock test',               40, 40, null, null,        31),
  ('test_repeat_percent',     'Repeat test (% of coins)',     50,  0, null, null,        32),
  ('homework_on_time',        'Homework on time',             30,  0, null, null,        40),
  ('homework_writing',        'Writing homework on time',     50,  0, null, null,        41),
  ('homework_late_percent',   'Late homework (% of coins)',   50,  0, null, null,        42),
  ('writing_personal_best',   'New best writing band',        20,  0, null, null,        43),
  ('attendance_present',      'Attended class',               10,  0, null, null,        50),
  ('attendance_late',         'Attended class (late)',         5,  0, null, null,        51),
  ('streak_attendance',       'Attendance streak',             0,  0, null, null,        60),
  ('streak_homework',         'Homework streak',               0,  0, null, null,        61)
on conflict (key) do nothing;

create table if not exists public.streak_milestones (
  kind text not null check (kind in ('attendance', 'homework')),
  at int not null,
  coins int not null,
  primary key (kind, at)
);
-- After the last milestone, the last row's coins repeat every streak_repeat.every.
create table if not exists public.streak_repeat (
  kind text primary key check (kind in ('attendance', 'homework')),
  every int not null
);
insert into public.streak_milestones (kind, at, coins) values
  ('attendance', 3, 15), ('attendance', 7, 40), ('attendance', 14, 90), ('attendance', 30, 200),
  ('homework', 3, 20), ('homework', 5, 50), ('homework', 10, 120)
on conflict do nothing;
insert into public.streak_repeat (kind, every) values ('attendance', 30), ('homework', 10)
on conflict do nothing;

alter table public.reward_rules enable row level security;
alter table public.streak_milestones enable row level security;
alter table public.streak_repeat enable row level security;
create policy "anyone signed in reads reward rules" on public.reward_rules for select to authenticated using (true);
create policy "anyone signed in reads milestones" on public.streak_milestones for select to authenticated using (true);
create policy "anyone signed in reads streak repeat" on public.streak_repeat for select to authenticated using (true);
create policy "admins edit reward rules" on public.reward_rules for all to authenticated
  using (public.is_admin_user(auth.uid())) with check (public.is_admin_user(auth.uid()));
create policy "admins edit milestones" on public.streak_milestones for all to authenticated
  using (public.is_admin_user(auth.uid())) with check (public.is_admin_user(auth.uid()));
create policy "admins edit streak repeat" on public.streak_repeat for all to authenticated
  using (public.is_admin_user(auth.uid())) with check (public.is_admin_user(auth.uid()));

-- ── Ledger ───────────────────────────────────────────────────────────────────
create table if not exists public.coin_transactions (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  label text not null,
  amount int not null,
  ref text not null,
  day date not null,
  created_at timestamptz not null default now(),
  unique (student_id, reason, ref)
);
create index if not exists coin_transactions_student_idx on public.coin_transactions (student_id, created_at desc);
alter table public.coin_transactions enable row level security;
create policy "students read own coins" on public.coin_transactions for select to authenticated
  using (student_id = auth.uid());
create policy "teachers read students' coins" on public.coin_transactions for select to authenticated
  using (public.is_teacher_of(auth.uid(), student_id));

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
  if not found then return 0; end if;
  amt := coalesce(p_amount, r.coins);
  if amt is null or amt <= 0 then return 0; end if;
  if r.daily_cap is not null then
    select coalesce(sum(t.amount), 0) into used
    from coin_transactions t join reward_rules rr on rr.key = t.reason
    where t.student_id = p_student and t.day = v_day and rr.cap_group = r.cap_group;
    amt := least(amt, r.daily_cap - used);
    if amt <= 0 then return 0; end if;
  end if;
  insert into coin_transactions (student_id, reason, label, amount, ref, day)
  values (p_student, p_rule, coalesce(p_label, r.label), amt, p_ref, v_day)
  on conflict (student_id, reason, ref) do nothing;
  get diagnostics n = row_count;
  return case when n > 0 then amt else 0 end;
end $$;

create or replace function public.note_activity(p_student uuid)
returns void language sql security definer set search_path = public as $$
  select public.award_coins(p_student, 'daily_first', public.study_day(p_student)::text);
$$;

create or replace function public.award_streak_milestone(p_student uuid, p_kind text, p_streak int, p_ref text)
returns void language plpgsql security definer set search_path = public as $$
declare
  m streak_milestones;
  last streak_milestones;
  rep int;
  amt int := 0;
begin
  if p_streak <= 0 then return; end if;
  select * into m from streak_milestones where kind = p_kind and at = p_streak;
  if found then
    amt := m.coins;
  else
    select * into last from streak_milestones where kind = p_kind order by at desc limit 1;
    select every into rep from streak_repeat where kind = p_kind;
    if last.at is not null and rep is not null and p_streak > last.at and (p_streak - last.at) % rep = 0 then
      amt := last.coins;
    end if;
  end if;
  if amt > 0 then
    perform award_coins(p_student, 'streak_' || p_kind, p_kind || ':' || p_streak || ':' || p_ref, amt,
      initcap(p_kind) || ' streak: ' || p_streak);
  end if;
end $$;

-- ── Scheduled publishing ─────────────────────────────────────────────────────
alter table public.assignments add column if not exists publish_at timestamptz not null default now();
update public.assignments set publish_at = created_at where publish_at > created_at;
create index if not exists assignments_publish_idx on public.assignments (publish_at);

drop policy if exists "students read assigned work" on public.assignments;
create policy "students read assigned work" on public.assignments for select to authenticated
  using (publish_at <= now() and public.is_recipient(id, auth.uid()));

alter table public.srs_cards add column if not exists available_at timestamptz not null default now();
update public.srs_cards c set available_at = a.publish_at
from public.assignments a where a.id = c.assignment_id and c.available_at <> a.publish_at;

drop policy if exists "students read own cards" on public.srs_cards;
create policy "students read own cards" on public.srs_cards for select to authenticated
  using (student_id = auth.uid() and available_at <= now());
drop policy if exists "students schedule own cards" on public.srs_cards;
create policy "students schedule own cards" on public.srs_cards for update to authenticated
  using (student_id = auth.uid() and available_at <= now())
  with check (student_id = auth.uid());

-- Only the student is limited to scheduling fields; definer triggers may move dates.
create or replace function public.guard_srs_card()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is distinct from old.student_id then return new; end if;
  new.student_id := old.student_id;
  new.assignment_id := old.assignment_id;
  new.position := old.position;
  new.front := old.front;
  new.back := old.back;
  new.assigned_at := old.assigned_at;
  new.available_at := old.available_at;
  return new;
end $$;

create or replace function public.seed_flashcards()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into srs_cards (student_id, assignment_id, position, front, back, assigned_at, available_at, due)
  select new.student_id, a.id, (c.ord - 1)::int, c.card->>'f', c.card->>'b',
         greatest(new.assigned_at, a.publish_at), a.publish_at, a.publish_at
  from assignments a,
       jsonb_array_elements(coalesce(a.payload->'cards', '[]'::jsonb)) with ordinality as c(card, ord)
  where a.id = new.assignment_id
    and a.kind = 'flashcards'
    and coalesce(c.card->>'f', '') <> ''
    and coalesce(c.card->>'b', '') <> ''
  on conflict (student_id, assignment_id, position) do nothing;
  return new;
end $$;

-- ── Notifications ────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('homework', 'feedback', 'submission')),
  title text not null,
  body text,
  link text,
  ref text not null,
  email boolean not null default true,
  visible_at timestamptz not null default now(),
  read_at timestamptz,
  emailed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, kind, ref)
);
create index if not exists notifications_user_idx on public.notifications (user_id, visible_at desc);
create index if not exists notifications_email_idx on public.notifications (visible_at) where emailed_at is null and email;
alter table public.notifications enable row level security;
create policy "users read own notifications" on public.notifications for select to authenticated
  using (user_id = auth.uid() and visible_at <= now());

create or replace function public.mark_notifications_read(ids uuid[] default null)
returns void language sql security definer set search_path = public as $$
  update notifications set read_at = now()
  where user_id = auth.uid() and read_at is null and visible_at <= now()
    and (ids is null or id = any(ids));
$$;

create or replace function public.notify(p_user uuid, p_kind text, p_title text, p_body text, p_link text, p_ref text,
                                         p_visible timestamptz default now(), p_email boolean default true)
returns void language sql security definer set search_path = public as $$
  insert into notifications (user_id, kind, title, body, link, ref, visible_at, email)
  values (p_user, p_kind, p_title, p_body, p_link, p_ref, p_visible, p_email)
  on conflict (user_id, kind, ref) do nothing;
$$;

-- New homework → each recipient, visible (and emailed) when it publishes.
create or replace function public.notify_new_homework()
returns trigger language plpgsql security definer set search_path = public as $$
declare a assignments;
begin
  select * into a from assignments where id = new.assignment_id;
  perform notify(new.student_id, 'homework', 'New homework: ' || a.title,
    case when a.due_at is null then null else 'Due ' || to_char(a.due_at at time zone coalesce(
      (select nullif(timezone, '') from profiles where id = new.student_id and timezone in (select name from pg_timezone_names)), 'UTC'),
      'Dy DD Mon, HH24:MI') end,
    '/homework/' || a.id, a.id::text, greatest(a.publish_at, now()));
  return new;
end $$;

drop trigger if exists notify_new_homework on public.assignment_recipients;
create trigger notify_new_homework
  after insert on public.assignment_recipients
  for each row execute function public.notify_new_homework();

-- Rescheduling moves the cards and the pending notifications with it.
create or replace function public.assignment_rescheduled()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.publish_at is distinct from old.publish_at then
    update srs_cards set available_at = new.publish_at, assigned_at = new.publish_at, due = greatest(due, new.publish_at)
      where assignment_id = new.id and state = 0;
    update notifications set visible_at = greatest(new.publish_at, now())
      where kind = 'homework' and ref = new.id::text and emailed_at is null and read_at is null;
  end if;
  return new;
end $$;

drop trigger if exists assignment_rescheduled on public.assignments;
create trigger assignment_rescheduled
  after update on public.assignments
  for each row execute function public.assignment_rescheduled();

create or replace function public.assignment_deleted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from notifications where kind = 'homework' and ref = old.id::text;
  return old;
end $$;

drop trigger if exists assignment_deleted on public.assignments;
create trigger assignment_deleted
  before delete on public.assignments
  for each row execute function public.assignment_deleted();

-- ── Homework streak ──────────────────────────────────────────────────────────
-- Consecutive published assignments completed on time, newest first. Open
-- assignments (not yet due) are skipped; a missed or late one ends the streak.
create or replace function public.homework_streak(p_student uuid)
returns int language plpgsql stable security definer set search_path = public as $$
declare
  rec record;
  done_at timestamptz;
  streak int := 0;
begin
  for rec in
    select a.id, a.kind, a.due_at, a.created_at,
      (select s.submitted_at from submissions s
        where s.assignment_id = a.id and s.student_id = p_student and s.status = 'submitted') as sub_at,
      (select min(t.completed_at) from user_test_results t
        where a.kind = 'test' and t.user_id = p_student
          and t.kind = a.payload->>'kind' and t.test_id = a.payload->>'test_id'
          and t.completed_at >= a.created_at) as test_at
    from assignment_recipients r
    join assignments a on a.id = r.assignment_id
    where r.student_id = p_student and a.publish_at <= now()
    order by coalesce(a.due_at, a.publish_at) desc
  loop
    done_at := coalesce(rec.sub_at, rec.test_at);
    if done_at is null then
      if rec.due_at is null or rec.due_at > now() then continue; end if;
      exit;
    end if;
    if rec.due_at is not null and done_at > rec.due_at then exit; end if;
    streak := streak + 1;
  end loop;
  return streak;
end $$;

-- Coins for completing a homework item (once per assignment).
create or replace function public.award_homework(p_student uuid, p_assignment uuid, p_done_at timestamptz)
returns void language plpgsql security definer set search_path = public as $$
declare
  a assignments;
  base int;
  late_pct int;
  on_time boolean;
  got int;
begin
  select * into a from assignments where id = p_assignment;
  if not found then return; end if;
  select coins into base from reward_rules where key = case when a.kind = 'writing' then 'homework_writing' else 'homework_on_time' end;
  select coins into late_pct from reward_rules where key = 'homework_late_percent';
  on_time := a.due_at is null or p_done_at <= a.due_at;
  got := award_coins(p_student, 'homework_on_time', a.id::text,
    case when on_time then base else (base * coalesce(late_pct, 50)) / 100 end,
    case when on_time then 'Homework: ' || a.title else 'Homework (late): ' || a.title end);
  if got > 0 and on_time then
    perform award_streak_milestone(p_student, 'homework', homework_streak(p_student), a.id::text);
  end if;
end $$;

-- ── Coin triggers ────────────────────────────────────────────────────────────
create or replace function public.coins_on_flashcard_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform award_coins(new.student_id, case when new.state = 0 then 'flashcard_new' else 'flashcard_review' end, new.id::text);
  perform note_activity(new.student_id);
  return new;
end $$;

drop trigger if exists coins_on_flashcard_review on public.srs_reviews;
create trigger coins_on_flashcard_review
  after insert on public.srs_reviews
  for each row execute function public.coins_on_flashcard_review();

-- Called by the client when today's queue is empty; verified here.
create or replace function public.claim_queue_cleared()
returns int language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then return 0; end if;
  if exists (select 1 from srs_cards where student_id = uid and available_at <= now() and (state = 0 or due <= now())) then
    return 0;
  end if;
  if not exists (select 1 from srs_reviews where student_id = uid and reviewed_at >= now() - interval '20 hours') then
    return 0;
  end if;
  return award_coins(uid, 'flashcard_queue_cleared', study_day(uid)::text);
end $$;

create or replace function public.coins_on_test_result()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  rule text := case when new.kind in ('reading_full', 'listening_full') then 'test_full' else 'test_part' end;
  r reward_rules;
  pctv int;
  amt int;
  rec record;
begin
  select * into r from reward_rules where key = rule;
  amt := r.coins + round(r.bonus * case when coalesce(new.total, 0) > 0 then least(new.correct::numeric / new.total, 1) else 0 end);
  if exists (select 1 from user_test_results x where x.user_id = new.user_id and x.kind = new.kind and x.test_id = new.test_id and x.id <> new.id and x.completed_at < new.completed_at) then
    select coins into pctv from reward_rules where key = 'test_repeat_percent';
    perform award_coins(new.user_id, rule, 'repeat:' || new.kind || ':' || new.test_id || ':' || study_day(new.user_id),
      (amt * coalesce(pctv, 50)) / 100, r.label || ' (repeat)');
  else
    perform award_coins(new.user_id, rule, 'first:' || new.kind || ':' || new.test_id, amt);
  end if;

  -- Test homework this attempt completes.
  for rec in
    select a.id from assignment_recipients ar join assignments a on a.id = ar.assignment_id
    where ar.student_id = new.user_id and a.kind = 'test' and a.publish_at <= new.completed_at
      and a.payload->>'kind' = new.kind and a.payload->>'test_id' = new.test_id
      and a.created_at <= new.completed_at
  loop
    perform award_homework(new.user_id, rec.id, new.completed_at);
  end loop;

  perform note_activity(new.user_id);
  return new;
end $$;

drop trigger if exists coins_on_test_result on public.user_test_results;
create trigger coins_on_test_result
  after insert on public.user_test_results
  for each row execute function public.coins_on_test_result();

create or replace function public.on_submission_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  a assignments;
  prev_best numeric;
begin
  select * into a from assignments where id = new.assignment_id;

  -- Newly submitted.
  if new.status = 'submitted' and (tg_op = 'INSERT' or old.status is distinct from 'submitted') then
    perform award_homework(new.student_id, new.assignment_id, coalesce(new.submitted_at, now()));
    perform note_activity(new.student_id);
    if a.kind in ('writing', 'custom') then
      perform notify(a.teacher_id, 'submission',
        coalesce((select name from profiles where id = new.student_id), 'A student') || ' submitted: ' || a.title,
        null, '/teach/assignments/' || a.id,
        new.id::text || ':' || extract(epoch from coalesce(new.submitted_at, now()))::bigint, now(), false);
    end if;
  end if;

  -- Newly reviewed (or review updated).
  if tg_op = 'UPDATE' and new.reviewed_at is not null and new.reviewed_at is distinct from old.reviewed_at then
    perform notify(new.student_id, 'feedback', 'Feedback on ' || a.title,
      case when new.band is not null then 'Band ' || to_char(new.band, 'FM9.0') else null end,
      '/homework/' || a.id, new.id::text || ':' || extract(epoch from new.reviewed_at)::bigint);
    if new.band is not null then
      select max(s.band) into prev_best from submissions s
      where s.student_id = new.student_id and s.id <> new.id and s.reviewed_at is not null and s.band is not null;
      if prev_best is not null and new.band > prev_best then
        perform award_coins(new.student_id, 'writing_personal_best', new.id::text, null,
          'New best band ' || to_char(new.band, 'FM9.0') || ': ' || a.title);
      end if;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists on_submission_change on public.submissions;
create trigger on_submission_change
  after insert or update on public.submissions
  for each row execute function public.on_submission_change();

-- ── Word games ───────────────────────────────────────────────────────────────
create table if not exists public.game_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  game text not null,
  correct int not null check (correct >= 0),
  total int not null check (total > 0 and total <= 50 and correct <= total),
  duration_ms int,
  created_at timestamptz not null default now()
);
create index if not exists game_results_student_idx on public.game_results (student_id, created_at desc);
alter table public.game_results enable row level security;
create policy "students log own games" on public.game_results for insert to authenticated with check (student_id = auth.uid());
create policy "students read own games" on public.game_results for select to authenticated using (student_id = auth.uid());
create policy "teachers read students' games" on public.game_results for select to authenticated using (public.is_teacher_of(auth.uid(), student_id));

create or replace function public.coins_on_game()
returns trigger language plpgsql security definer set search_path = public as $$
declare r reward_rules;
begin
  select * into r from reward_rules where key = 'word_game';
  -- A round needs a minimum of effort to pay out.
  if new.total >= 5 then
    perform award_coins(new.student_id, 'word_game', new.id::text, r.coins + round(r.bonus * new.correct::numeric / new.total));
  end if;
  perform note_activity(new.student_id);
  return new;
end $$;

drop trigger if exists coins_on_game on public.game_results;
create trigger coins_on_game
  after insert on public.game_results
  for each row execute function public.coins_on_game();

-- ── Attendance ───────────────────────────────────────────────────────────────
create table if not exists public.class_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  held_at timestamptz not null default now(),
  topic text,
  created_at timestamptz not null default now()
);
create index if not exists class_sessions_class_idx on public.class_sessions (class_id, held_at desc);

create table if not exists public.attendance (
  session_id uuid not null references public.class_sessions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('present', 'late', 'absent', 'excused')),
  note text,
  marked_at timestamptz not null default now(),
  primary key (session_id, student_id)
);
create index if not exists attendance_student_idx on public.attendance (student_id);

create or replace function public.session_class(sid uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select class_id from class_sessions where id = sid;
$$;

alter table public.class_sessions enable row level security;
alter table public.attendance enable row level security;
create policy "teachers manage sessions" on public.class_sessions for all to authenticated
  using (public.class_teacher(class_id) = auth.uid())
  with check (public.class_teacher(class_id) = auth.uid());
create policy "members read sessions" on public.class_sessions for select to authenticated
  using (public.is_class_member(class_id, auth.uid()));
create policy "teachers manage attendance" on public.attendance for all to authenticated
  using (public.class_teacher(public.session_class(session_id)) = auth.uid())
  with check (
    public.class_teacher(public.session_class(session_id)) = auth.uid()
    and public.is_class_member(public.session_class(session_id), student_id)
  );
create policy "students read own attendance" on public.attendance for select to authenticated
  using (student_id = auth.uid());

-- Consecutive class sessions attended, newest first. Excused and unmarked
-- sessions are skipped; an absence ends the streak.
create or replace function public.attendance_streak(p_student uuid)
returns int language plpgsql stable security definer set search_path = public as $$
declare
  rec record;
  streak int := 0;
begin
  for rec in
    select att.status
    from class_sessions cs
    join class_members m on m.class_id = cs.class_id and m.student_id = p_student
    left join attendance att on att.session_id = cs.id and att.student_id = p_student
    where cs.held_at <= now() and cs.held_at >= m.joined_at - interval '1 day'
    order by cs.held_at desc
  loop
    if rec.status is null or rec.status = 'excused' then continue; end if;
    if rec.status = 'absent' then exit; end if;
    streak := streak + 1;
  end loop;
  return streak;
end $$;

-- Coins follow the current mark: switching to absent removes the class coins.
create or replace function public.coins_on_attendance()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and old.status = new.status then return new; end if;
  delete from coin_transactions
    where student_id = new.student_id and reason in ('attendance_present', 'attendance_late') and ref = new.session_id::text;
  if new.status in ('present', 'late') then
    perform award_coins(new.student_id, 'attendance_' || new.status, new.session_id::text);
    perform award_streak_milestone(new.student_id, 'attendance', attendance_streak(new.student_id), new.session_id::text);
  end if;
  return new;
end $$;

drop trigger if exists coins_on_attendance on public.attendance;
create trigger coins_on_attendance
  after insert or update on public.attendance
  for each row execute function public.coins_on_attendance();

-- ── Summaries ────────────────────────────────────────────────────────────────
create or replace function public.hub_summary(p_student uuid default null)
returns json language plpgsql stable security definer set search_path = public as $$
declare
  uid uuid := coalesce(p_student, auth.uid());
  today date := study_day(uid);
begin
  if uid is distinct from auth.uid() and not public.is_teacher_of(auth.uid(), uid) and not public.is_admin_user(auth.uid()) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return json_build_object(
    'balance', (select coalesce(sum(amount), 0) from coin_transactions where student_id = uid),
    'today', (select coalesce(sum(amount), 0) from coin_transactions where student_id = uid and day = today),
    'week', (
      select coalesce(json_agg(json_build_object('day', d::date, 'coins', coalesce(x.s, 0)) order by d), '[]'::json)
      from generate_series((today - 6)::timestamp, today::timestamp, interval '1 day') d
      left join (select day, sum(amount) s from coin_transactions where student_id = uid and day > today - 7 group by day) x on x.day = d::date
    ),
    'attendance_streak', attendance_streak(uid),
    'homework_streak', homework_streak(uid),
    'attendance', (
      select json_build_object(
        'attended', count(*) filter (where att.status in ('present', 'late')),
        'absent', count(*) filter (where att.status = 'absent'),
        'sessions', count(*))
      from class_sessions cs
      join class_members m on m.class_id = cs.class_id and m.student_id = uid
      left join attendance att on att.session_id = cs.id and att.student_id = uid
      where cs.held_at <= now() and cs.held_at >= m.joined_at - interval '1 day'
    )
  );
end $$;

create or replace function public.teacher_student_summaries()
returns table (student_id uuid, balance bigint, week bigint, attendance_streak int, homework_streak int)
language sql stable security definer set search_path = public as $$
  with mine as (
    select distinct m.student_id from class_members m join classes c on c.id = m.class_id
    where c.teacher_id = auth.uid() and not c.archived
  )
  select s.student_id,
    (select coalesce(sum(amount), 0) from coin_transactions t where t.student_id = s.student_id),
    (select coalesce(sum(amount), 0) from coin_transactions t where t.student_id = s.student_id and t.day > study_day(s.student_id) - 7),
    attendance_streak(s.student_id),
    homework_streak(s.student_id)
  from mine s;
$$;

-- ── Email delivery (pg_cron → notify-email edge function) ────────────────────
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Shared secret between the cron job and the function; generated here, never leaves the DB.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'notify_cron_secret') then
    perform vault.create_secret(gen_random_uuid()::text || gen_random_uuid()::text, 'notify_cron_secret');
  end if;
end $$;

create or replace function public.verify_cron_secret(s text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from vault.decrypted_secrets where name = 'notify_cron_secret' and decrypted_secret = s);
$$;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'notify-email') then
    perform cron.unschedule('notify-email');
  end if;
end $$;
select cron.schedule('notify-email', '*/5 * * * *', $cron$
  select net.http_post(
    url := 'https://jaucbfremtxmanciflab.supabase.co/functions/v1/notify-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'notify_cron_secret')
    ),
    body := '{}'::jsonb
  );
$cron$);

-- ── Grants: internal helpers are not client-callable ─────────────────────────
revoke execute on function public.award_coins(uuid, text, text, int, text) from public, anon, authenticated;
revoke execute on function public.note_activity(uuid) from public, anon, authenticated;
revoke execute on function public.award_streak_milestone(uuid, text, int, text) from public, anon, authenticated;
revoke execute on function public.award_homework(uuid, uuid, timestamptz) from public, anon, authenticated;
revoke execute on function public.notify(uuid, text, text, text, text, text, timestamptz, boolean) from public, anon, authenticated;
revoke execute on function public.verify_cron_secret(text) from public, anon, authenticated;
grant execute on function public.verify_cron_secret(text) to service_role;
revoke execute on function public.hub_summary(uuid) from public, anon;
revoke execute on function public.teacher_student_summaries() from public, anon;
revoke execute on function public.claim_queue_cleared() from public, anon;
revoke execute on function public.mark_notifications_read(uuid[]) from public, anon;
grant execute on function public.hub_summary(uuid) to authenticated;
grant execute on function public.teacher_student_summaries() to authenticated;
grant execute on function public.claim_queue_cleared() to authenticated;
grant execute on function public.mark_notifications_read(uuid[]) to authenticated;
