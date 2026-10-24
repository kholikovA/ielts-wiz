-- Vocabulary: recognise → recall → use.
--   1. Richer flashcards: each card in assignments.payload.cards may carry
--      ex (example sentence), gap/ans (gapped sentence + answers),
--      forms [{w,pos,gap,ans}] and coll [{p,gap,ans}]. Copied to
--      srs_cards.extra so typed-recall reviews can use them.
--   2. enrich_deck(): a teacher adds those fields to an existing deck.
--   3. "Use it in a sentence" homework (kind 'sentences'); every AI check is
--      logged in usage_checks by the sentence-check edge function.

alter table public.srs_cards add column if not exists extra jsonb;

create or replace function public.seed_flashcards()
returns trigger language plpgsql security definer set search_path = public as $function$
begin
  insert into srs_cards (student_id, assignment_id, position, front, back, extra, assigned_at, available_at, due)
  select new.student_id, a.id, (c.ord - 1)::int, c.card->>'f', c.card->>'b',
         nullif(c.card - 'f' - 'b', '{}'::jsonb),
         greatest(new.assigned_at, a.publish_at), a.publish_at, a.publish_at
  from assignments a,
       jsonb_array_elements(coalesce(a.payload->'cards', '[]'::jsonb)) with ordinality as c(card, ord)
  where a.id = new.assignment_id
    and a.kind = 'flashcards'
    and coalesce(c.card->>'f', '') <> ''
    and coalesce(c.card->>'b', '') <> ''
  on conflict (student_id, assignment_id, position) do nothing;
  return new;
end $function$;

-- Replace a deck's cards' extra fields (and meanings) for the assignment and
-- every student's copy. Fronts and positions don't change.
create or replace function public.enrich_deck(p_assignment uuid, p_cards jsonb)
returns void language plpgsql security definer set search_path = public as $function$
declare
  a assignments;
begin
  select * into a from assignments where id = p_assignment;
  if a.id is null or a.teacher_id is distinct from auth.uid() or a.kind <> 'flashcards' then
    raise exception 'Not your flashcard assignment' using errcode = '42501';
  end if;
  if jsonb_array_length(p_cards) <> jsonb_array_length(coalesce(a.payload->'cards', '[]'::jsonb)) then
    raise exception 'Card count changed' using errcode = '22023';
  end if;
  update assignments set payload = jsonb_set(payload, '{cards}', p_cards) where id = p_assignment;
  update srs_cards s
     set extra = nullif(c.card - 'f' - 'b', '{}'::jsonb),
         back = coalesce(nullif(c.card->>'b', ''), s.back)
    from jsonb_array_elements(p_cards) with ordinality as c(card, ord)
   where s.assignment_id = p_assignment and s.position = (c.ord - 1)::int;
end $function$;
grant execute on function public.enrich_deck(uuid, jsonb) to authenticated;

alter table public.assignments drop constraint if exists assignments_kind_check;
alter table public.assignments add constraint assignments_kind_check
  check (kind = any (array['test', 'writing', 'custom', 'flashcards', 'dictation', 'sentences']));

create table if not exists public.usage_checks (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  word_index int not null,
  word text not null,
  sentence text not null,
  verdict text not null check (verdict in ('correct', 'almost', 'wrong')),
  corrected text,
  tip text,
  model text,
  created_at timestamptz not null default now()
);
create index if not exists usage_checks_lookup on public.usage_checks (assignment_id, student_id, word_index, created_at);
alter table public.usage_checks enable row level security;

drop policy if exists "students read own usage checks" on public.usage_checks;
create policy "students read own usage checks" on public.usage_checks for select
  using (student_id = auth.uid());
drop policy if exists "teachers read usage checks" on public.usage_checks;
create policy "teachers read usage checks" on public.usage_checks for select
  using (public.assignment_teacher(assignment_id) = auth.uid());
-- Inserted only by the sentence-check edge function (service role).

-- Teachers get a "submitted" notification for sentence homework too.
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
    if a.kind in ('writing', 'custom', 'dictation', 'sentences') then
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
