-- Dictation homework.
--   assignments.kind = 'dictation'; payload holds the audio URL and sentence
--   timings ({ audio_url, cues: [{ s, e }], ... }) but never the words.
--   dictation_keys holds the transcript; a student can read it only once
--   they've submitted, and can't change their answer after that.
--   Storage bucket dictation-media holds teachers' converted audio (mp3).

alter table public.assignments drop constraint if exists assignments_kind_check;
alter table public.assignments add constraint assignments_kind_check
  check (kind = any (array['test', 'writing', 'custom', 'flashcards', 'dictation']));

create table if not exists public.dictation_keys (
  assignment_id uuid primary key references public.assignments(id) on delete cascade,
  transcript text not null,
  source text not null default 'generated' check (source in ('teacher', 'generated', 'test')),
  created_at timestamptz not null default now()
);
alter table public.dictation_keys enable row level security;

drop policy if exists "teachers manage dictation keys" on public.dictation_keys;
create policy "teachers manage dictation keys" on public.dictation_keys for all
  using (public.assignment_teacher(assignment_id) = auth.uid())
  with check (public.assignment_teacher(assignment_id) = auth.uid());

drop policy if exists "students read key after submitting" on public.dictation_keys;
create policy "students read key after submitting" on public.dictation_keys for select
  using (exists (
    select 1 from public.submissions s
    where s.assignment_id = dictation_keys.assignment_id
      and s.student_id = auth.uid() and s.status = 'submitted'));

-- A submitted dictation is final for the student (they've seen the transcript).
create or replace function public.guard_dictation_submission()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'submitted' and auth.uid() = old.student_id
     and (select kind from assignments where id = old.assignment_id) = 'dictation'
     and (new.body is distinct from old.body or new.status is distinct from old.status
          or new.submitted_at is distinct from old.submitted_at) then
    raise exception 'This dictation has already been submitted.' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists guard_dictation_submission on public.submissions;
create trigger guard_dictation_submission before update on public.submissions
  for each row execute function public.guard_dictation_submission();

-- Teachers get a "submitted" notification for dictations too.
create or replace function public.on_submission_change()
returns trigger language plpgsql security definer set search_path = public as $function$
declare
  a assignments;
  prev_best numeric;
begin
  select * into a from assignments where id = new.assignment_id;

  -- Newly submitted.
  if new.status = 'submitted' and (tg_op = 'INSERT' or old.status is distinct from 'submitted') then
    perform award_homework(new.student_id, new.assignment_id, coalesce(new.submitted_at, now()));
    perform note_activity(new.student_id);
    if a.kind in ('writing', 'custom', 'dictation') then
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
end $function$;

-- Converted audio. Public read (paths are random); teachers write to their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dictation-media', 'dictation-media', true, 52428800, array['audio/mpeg'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "teachers upload dictation media" on storage.objects;
create policy "teachers upload dictation media" on storage.objects for insert to authenticated
  with check (bucket_id = 'dictation-media' and public.is_teacher_user(auth.uid())
              and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "teachers delete own dictation media" on storage.objects;
create policy "teachers delete own dictation media" on storage.objects for delete to authenticated
  using (bucket_id = 'dictation-media' and (storage.foldername(name))[1] = auth.uid()::text);
