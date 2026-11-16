-- Quiz attempts: server-side scores, answers only after the last attempt, pass mark for coins.
--
-- 1. quiz_score(): marks a quiz in SQL (same rules as markTest in src/student/quiz/quiz.js,
--    with the basic text normalisation). A trigger stores the score in submissions.data.score
--    when a quiz is submitted, so the score is the server's, not the browser's.
-- 2. The answer key (quiz_keys) opens to a student only after their last attempt (or once they
--    chose to see the answers, which ends their attempts). Before that they see only the score.
-- 3. assignments.payload.pass_percent: a quiz below it doesn't count towards the homework coins
--    (day / perfect week). The best attempt counts; done = the first attempt at or above the mark.
--    Missing it isn't a "missed homework" penalty: submitting still counts as done for that.

-- ── Marking ─────────────────────────────────────────────────────────────────
create or replace function public.quiz_norm(t text)
returns text language sql immutable set search_path = public as $$
  select btrim(regexp_replace(regexp_replace(regexp_replace(
    translate(lower(coalesce(t, '')), '‘’`´“”', $q$''''""$q$),
    '\s+', ' ', 'g'), '^[\s"''.,;:!?]+', ''), '[\s"''.,;:!?]+$', ''));
$$;

-- "24.5", ".25", "-3", "49/2" -> number; anything else -> null (asNumber in quiz.js).
create or replace function public.quiz_num(t text)
returns numeric language plpgsql immutable set search_path = public as $$
declare
  s text := translate(regexp_replace(coalesce(t, ''), '\s+', '', 'g'), '−–', '--');
  m text[];
begin
  if s ~ '^[-+]?(\d+\.?\d*|\.\d+)$' then return s::numeric; end if;
  m := regexp_match(s, '^([-+]?\d+)/(\d+)$');
  if m is not null and m[2]::numeric <> 0 then return m[1]::numeric / m[2]::numeric; end if;
  return null;
end $$;

create or replace function public.quiz_score(p_payload jsonb, p_key jsonb, p_answers jsonb, p_manual jsonb default '{}'::jsonb)
returns jsonb language plpgsql immutable set search_path = public as $$
declare
  q jsonb; k jsonb; a jsonb; got jsonb;
  earned numeric := 0; possible numeric := 0; pts numeric;
  i int; n int; hits int; g text; gn numeric;
begin
  for q in
    select x from jsonb_array_elements(coalesce(p_payload->'sections', '[]'::jsonb)) s,
      jsonb_array_elements(coalesce(s->'questions', '[]'::jsonb)) x
  loop
    k := p_key -> (q->>'id');
    a := p_answers -> (q->>'id');
    if a is not null and jsonb_typeof(a) = 'null' then a := null; end if;
    case q->>'type'
      when 'mcq' then
        got := case when a is null then '[]'::jsonb when jsonb_typeof(a) = 'array' then a else jsonb_build_array(a) end;
        if coalesce((q->>'multi')::boolean, false) then
          n := jsonb_array_length(coalesce(k, '[]'::jsonb));
          select count(distinct t.v) into hits
          from jsonb_array_elements(got) with ordinality as t(v, ord)
          where t.ord <= n and coalesce(k, '[]'::jsonb) @> jsonb_build_array(t.v);
          earned := earned + hits; possible := possible + n;
        else
          possible := possible + 1;
          if jsonb_array_length(got) = 1 and coalesce(k, '[]'::jsonb) @> jsonb_build_array(got->0) then earned := earned + 1; end if;
        end if;
      when 'tfng' then
        possible := possible + 1;
        if a is not null and a = k then earned := earned + 1; end if;
      when 'gap' then
        if a is null or jsonb_typeof(a) <> 'array' then a := '[]'::jsonb; end if;
        n := jsonb_array_length(coalesce(k, '[]'::jsonb));
        for i in 0 .. n - 1 loop
          possible := possible + 1;
          g := quiz_norm(a->>i);
          if g <> '' and exists (select 1 from jsonb_array_elements_text(k->i) alt where quiz_norm(alt) = g) then
            earned := earned + 1;
          end if;
        end loop;
      when 'match' then
        if a is null or jsonb_typeof(a) <> 'array' then a := '[]'::jsonb; end if;
        n := jsonb_array_length(coalesce(k, '[]'::jsonb));
        for i in 0 .. n - 1 loop
          possible := possible + 1;
          if jsonb_typeof(a->i) = 'number' and jsonb_typeof(k->i) = 'number' and (a->>i)::numeric = (k->>i)::numeric then
            earned := earned + 1;
          end if;
        end loop;
      when 'short', 'reorder' then
        possible := possible + 1;
        if coalesce((q->>'numeric')::boolean, false) then
          gn := quiz_num(a #>> '{}');
          if gn is not null and exists (select 1 from jsonb_array_elements_text(coalesce(k, '[]'::jsonb)) x
                                       where abs(quiz_num(x) - gn) < 0.000000001) then
            earned := earned + 1;
          end if;
        else
          g := quiz_norm(a #>> '{}');
          if g <> '' and exists (select 1 from jsonb_array_elements_text(coalesce(k, '[]'::jsonb)) x
                                 where quiz_norm(x) = g
                                    or (coalesce(q->>'lead', '') <> '' and quiz_norm((q->>'lead') || ' ' || x) = g)) then
            earned := earned + 1;
          end if;
        end if;
      else
        pts := coalesce(nullif(nullif(q->>'points', ''), '0')::numeric, 5);
        possible := possible + pts;
        if p_manual ? (q->>'id') and jsonb_typeof(p_manual->(q->>'id')) = 'number' then
          earned := earned + least(pts, greatest(0, (p_manual->>(q->>'id'))::numeric));
        end if;
    end case;
  end loop;
  return jsonb_build_object('earned', earned, 'possible', possible,
    'percent', case when possible > 0 then round(earned / possible * 100) else 0 end);
end $$;

-- On submit: store the server's score with the submission.
create or replace function public.score_quiz_submission()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  a assignments;
  k jsonb;
begin
  if new.status is distinct from 'submitted' then return new; end if;
  if tg_op = 'UPDATE' and old.status = 'submitted' then return new; end if;
  select * into a from assignments where id = new.assignment_id;
  if not found or a.kind <> 'quiz' then return new; end if;
  select key into k from quiz_keys where assignment_id = a.id;
  if k is null then return new; end if;
  new.data := coalesce(new.data, '{}'::jsonb) || jsonb_build_object('score',
    quiz_score(a.payload, k, coalesce(new.data->'answers', '{}'::jsonb), coalesce(new.marking->'manual', '{}'::jsonb)));
  return new;
end $$;

drop trigger if exists score_quiz_submission on public.submissions;
create trigger score_quiz_submission before insert or update on public.submissions
  for each row execute function public.score_quiz_submission();

-- A submitted quiz's score is final for the student too.
create or replace function public.guard_dictation_submission()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if current_setting('iw.new_attempt', true) = 'on' then return new; end if;
  if old.status = 'submitted' and auth.uid() = old.student_id
     and (select kind from assignments where id = old.assignment_id) in ('dictation', 'quiz')
     and (new.body is distinct from old.body or new.status is distinct from old.status
          or new.submitted_at is distinct from old.submitted_at
          or (new.data->'answers') is distinct from (old.data->'answers')
          or (new.data->'attempts') is distinct from (old.data->'attempts')
          or ((old.data ? 'score') and (new.data->'score') is distinct from (old.data->'score'))) then
    raise exception 'This has already been submitted.' using errcode = '42501';
  end if;
  return new;
end $$;

-- ── The key opens after the last attempt ────────────────────────────────────
drop policy if exists "students read quiz key after submitting" on public.quiz_keys;
drop policy if exists "students read quiz key after the last attempt" on public.quiz_keys;
create policy "students read quiz key after the last attempt" on public.quiz_keys for select
  using (exists (
    select 1 from public.submissions s join public.assignments a on a.id = s.assignment_id
    where s.assignment_id = quiz_keys.assignment_id and s.student_id = auth.uid() and s.status = 'submitted'
      and (1 + coalesce(jsonb_array_length(s.data->'attempts'), 0) >= coalesce(nullif(a.payload->>'max_attempts', '')::int, 1)
           or coalesce((s.data->>'review_opened')::boolean, false))));

-- ── Pass mark for coins ─────────────────────────────────────────────────────
-- When an assignment counts for coins: like assignment_done_at, but a quiz with a pass mark
-- counts from the first attempt that reached it.
create or replace function public.assignment_passed_at(p_assignment uuid, p_student uuid)
returns timestamptz language sql stable security definer set search_path = public as $$
  select case
    when a.kind = 'quiz' and coalesce(nullif(a.payload->>'pass_percent', '')::numeric, 0) > 0 then (
      select min(x.at)
      from submissions s,
        lateral (
          select (h->>'submitted_at')::timestamptz as at, (h->'score'->>'percent')::numeric as pct
          from jsonb_array_elements(coalesce(s.data->'attempts', '[]'::jsonb)) h
          union all
          select s.submitted_at, coalesce(s.marking->'score'->>'percent', s.data->'score'->>'percent')::numeric
          where s.status = 'submitted'
        ) x
      where s.assignment_id = a.id and s.student_id = p_student
        and x.pct >= (a.payload->>'pass_percent')::numeric)
    else assignment_done_at(a.id, p_student)
  end
  from assignments a where a.id = p_assignment;
$$;
revoke all on function public.assignment_passed_at(uuid, uuid) from public, anon;

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
    select a.due_at, assignment_passed_at(a.id, p_student) as done_at
    from assignment_recipients r join assignments a on a.id = r.assignment_id
    where r.student_id = p_student and a.publish_at <= now() and a.due_at is not null
      and local_date(p_student, a.due_at) = p_day
  ) d;
  if total > 0 and total = on_time then
    perform award_coins(p_student, 'day_all_homework', p_day::text, null,
      'All homework done · ' || to_char(p_day, 'Dy DD Mon'));
  end if;
end $$;

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
end $$;

revoke execute on function public.coin_sweep() from public, anon, authenticated;
revoke execute on function public.check_day_homework(uuid, date) from public, anon, authenticated;
