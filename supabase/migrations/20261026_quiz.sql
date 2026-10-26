-- Custom tests (assignments.kind = 'quiz').
--   payload: sections + questions without answers.
--   quiz_keys: the answer key; teachers always, students only after submitting.
--   A submitted quiz is final for the student (like dictation), so the key
--   can't be used to change answers.

alter table public.assignments drop constraint if exists assignments_kind_check;
alter table public.assignments add constraint assignments_kind_check
  check (kind = any (array['test', 'writing', 'custom', 'flashcards', 'dictation', 'sentences', 'quiz']));

create table if not exists public.quiz_keys (
  assignment_id uuid primary key references public.assignments(id) on delete cascade,
  key jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.quiz_keys enable row level security;

drop policy if exists "teachers manage quiz keys" on public.quiz_keys;
create policy "teachers manage quiz keys" on public.quiz_keys for all
  using (public.assignment_teacher(assignment_id) = auth.uid())
  with check (public.assignment_teacher(assignment_id) = auth.uid());

drop policy if exists "students read quiz key after submitting" on public.quiz_keys;
create policy "students read quiz key after submitting" on public.quiz_keys for select
  using (exists (
    select 1 from public.submissions s
    where s.assignment_id = quiz_keys.assignment_id and s.student_id = auth.uid() and s.status = 'submitted'));

-- Submitted dictations and quizzes are final for the student.
create or replace function public.guard_dictation_submission()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'submitted' and auth.uid() = old.student_id
     and (select kind from assignments where id = old.assignment_id) in ('dictation', 'quiz')
     and (new.body is distinct from old.body or new.status is distinct from old.status
          or new.submitted_at is distinct from old.submitted_at
          or (new.data->'answers') is distinct from (old.data->'answers')) then
    raise exception 'This has already been submitted.' using errcode = '42501';
  end if;
  return new;
end $$;

-- Teachers get a "submitted" notification for quizzes too.
create or replace function public.on_submission_change()
returns trigger language plpgsql security definer set search_path = public as $function$
declare
  a assignments;
  prev_best numeric;
begin
  select * into a from assignments where id = new.assignment_id;

  if new.status = 'submitted' and (tg_op = 'INSERT' or old.status is distinct from 'submitted') then
    perform award_homework(new.student_id, new.assignment_id, coalesce(new.submitted_at, now()));
    perform note_activity(new.student_id);
    if a.kind in ('writing', 'custom', 'dictation', 'sentences', 'quiz') then
      perform notify(a.teacher_id, 'submission',
        coalesce((select name from profiles where id = new.student_id), 'A student') || ' submitted: ' || a.title,
        null, '/teach/assignments/' || a.id,
        new.id::text || ':' || extract(epoch from coalesce(new.submitted_at, now()))::bigint, now(), false);
    end if;
  end if;

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
end $function$;
