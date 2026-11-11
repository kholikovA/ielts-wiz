-- SAT question bank + repeat quiz attempts.
--
-- sat_questions: one row per College Board Question ID (e.g. 'b86123af').
--   content: what students see (prompt / options, text or image links; no answer)
--   key:     answer (mcq: 0-3) or accepted answers (spr) + rationale
--   Teachers only. Questions are copied into an assignment's payload/quiz_keys when assigned,
--   so students never read this table. New exports are added with the hub's Import (upsert by id).
-- Storage bucket sat-bank (public): question and rationale images, uploaded by teachers.
-- start_quiz_attempt: a student starts another attempt when the quiz allows it
--   (assignments.payload.max_attempts); the previous one is kept in submissions.data.attempts.

create or replace function public.is_teacher_user(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles p where p.id = uid and (p.is_teacher or p.is_admin));
$$;
revoke all on function public.is_teacher_user(uuid) from public, anon;
grant execute on function public.is_teacher_user(uuid) to authenticated;

create table if not exists public.sat_questions (
  id text primary key check (id ~ '^[0-9a-z]{6,12}$'),
  test text not null check (test in ('math', 'rw')),
  domain text not null,
  skill text not null,
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  type text not null check (type in ('mcq', 'spr')),
  content jsonb not null,
  key jsonb not null,
  source text,
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sat_questions_filter_idx on public.sat_questions (test, domain, skill, difficulty);
alter table public.sat_questions enable row level security;

drop policy if exists "teachers read sat questions" on public.sat_questions;
create policy "teachers read sat questions" on public.sat_questions for select to authenticated
  using (public.is_teacher_user(auth.uid()));
drop policy if exists "teachers add sat questions" on public.sat_questions;
create policy "teachers add sat questions" on public.sat_questions for insert to authenticated
  with check (public.is_teacher_user(auth.uid()));
drop policy if exists "teachers update sat questions" on public.sat_questions;
create policy "teachers update sat questions" on public.sat_questions for update to authenticated
  using (public.is_teacher_user(auth.uid())) with check (public.is_teacher_user(auth.uid()));

insert into storage.buckets (id, name, public) values ('sat-bank', 'sat-bank', true)
on conflict (id) do update set public = true;
drop policy if exists "teachers upload sat images" on storage.objects;
create policy "teachers upload sat images" on storage.objects for insert to authenticated
  with check (bucket_id = 'sat-bank' and public.is_teacher_user(auth.uid()));
drop policy if exists "teachers replace sat images" on storage.objects;
create policy "teachers replace sat images" on storage.objects for update to authenticated
  using (bucket_id = 'sat-bank' and public.is_teacher_user(auth.uid()))
  with check (bucket_id = 'sat-bank' and public.is_teacher_user(auth.uid()));

-- ── Repeat attempts ─────────────────────────────────────────────────────────
-- The guards keep a submitted quiz final for the student; start_quiz_attempt is the one
-- sanctioned way to reopen it, signalled through a transaction-local setting.
create or replace function public.guard_dictation_submission()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if current_setting('iw.new_attempt', true) = 'on' then return new; end if;
  if old.status = 'submitted' and auth.uid() = old.student_id
     and (select kind from assignments where id = old.assignment_id) in ('dictation', 'quiz')
     and (new.body is distinct from old.body or new.status is distinct from old.status
          or new.submitted_at is distinct from old.submitted_at
          or (new.data->'answers') is distinct from (old.data->'answers')
          or (new.data->'attempts') is distinct from (old.data->'attempts')) then
    raise exception 'This has already been submitted.' using errcode = '42501';
  end if;
  return new;
end $$;

create or replace function public.guard_submission_feedback()
returns trigger language plpgsql set search_path = public as $function$
begin
  if auth.uid() = old.student_id and coalesce(current_setting('iw.new_attempt', true), '') <> 'on' then
    new.band := old.band;
    new.feedback := old.feedback;
    new.reviewed_at := old.reviewed_at;
    new.marking := old.marking;
  end if;
  new.updated_at := now();
  return new;
end $function$;

create or replace function public.start_quiz_attempt(p_assignment uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  s submissions;
  allowed int;
  done int;
begin
  select coalesce(nullif(payload->>'max_attempts', '')::int, 1) into allowed
  from assignments where id = p_assignment and kind = 'quiz';
  if allowed is null then raise exception 'Not a quiz.' using errcode = '42501'; end if;
  select * into s from submissions where assignment_id = p_assignment and student_id = auth.uid() for update;
  if not found or s.status <> 'submitted' then raise exception 'Submit this attempt first.' using errcode = '42501'; end if;
  if coalesce((s.data->>'review_opened')::boolean, false) then
    raise exception 'You opened the answers, so no more attempts are available.' using errcode = '42501';
  end if;
  done := 1 + coalesce(jsonb_array_length(s.data->'attempts'), 0);
  if done >= allowed then raise exception 'No attempts left.' using errcode = '42501'; end if;
  perform set_config('iw.new_attempt', 'on', true);
  update submissions set
    status = 'in_progress', submitted_at = null, reviewed_at = null, feedback = null, band = null, marking = null,
    data = jsonb_build_object('attempts', coalesce(s.data->'attempts', '[]'::jsonb) || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
      'answers', s.data->'answers', 'score', s.data->'score', 'integrity', s.data->'integrity',
      'manual', s.marking->'manual', 'submitted_at', s.submitted_at))))
  where id = s.id;
  perform set_config('iw.new_attempt', 'off', true);
end $$;
revoke all on function public.start_quiz_attempt(uuid) from public, anon;
grant execute on function public.start_quiz_attempt(uuid) to authenticated;
