-- AI-assisted writing marking (teacher reviews first).
--   writing_ai_reviews: Claude's draft marking per submission. Only the
--   assignment's teacher can read it; students never see the raw draft.
--   submissions.marking: what the teacher approved and sent (criteria bands,
--   comments, inline corrections). Students read it with their submission.

create table if not exists public.writing_ai_reviews (
  submission_id uuid primary key references public.submissions(id) on delete cascade,
  result jsonb not null,
  model text not null,
  created_at timestamptz not null default now()
);
alter table public.writing_ai_reviews enable row level security;

drop policy if exists "teachers read ai reviews" on public.writing_ai_reviews;
create policy "teachers read ai reviews" on public.writing_ai_reviews for select
  using (exists (
    select 1 from public.submissions s
    where s.id = writing_ai_reviews.submission_id
      and public.assignment_teacher(s.assignment_id) = auth.uid()));
-- Written only by the writing-mark edge function (service role).

alter table public.submissions add column if not exists marking jsonb;

-- Students can't touch the teacher's marking either.
create or replace function public.guard_submission_feedback()
returns trigger language plpgsql set search_path = public as $function$
begin
  if auth.uid() = old.student_id then
    new.band := old.band;
    new.feedback := old.feedback;
    new.reviewed_at := old.reviewed_at;
    new.marking := old.marking;
  end if;
  new.updated_at := now();
  return new;
end $function$;

-- review_submission gains an optional marking payload.
drop function if exists public.review_submission(uuid, numeric, text);
create or replace function public.review_submission(sub uuid, p_band numeric, p_feedback text, p_marking jsonb default null)
returns void language plpgsql security definer set search_path = public as $function$
begin
  if not exists (
    select 1 from submissions s where s.id = sub and public.assignment_teacher(s.assignment_id) = auth.uid()
  ) then
    raise exception 'Not your student''s submission' using errcode = '42501';
  end if;
  update submissions
     set band = p_band, feedback = nullif(trim(p_feedback), ''), marking = p_marking, reviewed_at = now()
   where id = sub;
end $function$;
grant execute on function public.review_submission(uuid, numeric, text, jsonb) to authenticated;
