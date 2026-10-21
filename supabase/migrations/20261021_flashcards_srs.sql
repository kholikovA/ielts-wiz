-- Spaced-repetition flashcards for the Student Hub (FSRS, scheduled client-side
-- in src/student/fsrs.js).
--
--   srs_cards    one row per word per student, carrying its FSRS memory state
--   srs_reviews  append-only log of every rating (retention stats, and the
--                input for optimising FSRS parameters later)
--
-- A flashcard assignment's words are copied into each recipient's collection by
-- the seed_flashcards trigger, so class assignments, individual assignments and
-- late joiners (join_class) are all covered by one code path.

create table if not exists public.srs_cards (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  assignment_id uuid references public.assignments(id) on delete cascade,
  position int not null default 0,
  front text not null,
  back text not null,
  assigned_at timestamptz not null default now(),
  state smallint not null default 0 check (state between 0 and 3), -- 0 new · 1 learning · 2 review · 3 relearning
  step smallint not null default 0,
  due timestamptz not null default now(),
  stability double precision,
  difficulty double precision,
  reps int not null default 0,
  lapses int not null default 0,
  last_review timestamptz,
  created_at timestamptz not null default now(),
  unique (student_id, assignment_id, position)
);
create index if not exists srs_cards_student_due_idx on public.srs_cards (student_id, due);
create index if not exists srs_cards_assignment_idx on public.srs_cards (assignment_id);

create table if not exists public.srs_reviews (
  id bigint generated always as identity primary key,
  card_id uuid not null references public.srs_cards(id) on delete cascade,
  student_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 4),
  state smallint not null,                 -- state before the review
  elapsed_days double precision not null default 0,
  scheduled_days double precision not null default 0,
  stability double precision,              -- after the review
  difficulty double precision,
  duration_ms int,
  reviewed_at timestamptz not null default now()
);
create index if not exists srs_reviews_student_idx on public.srs_reviews (student_id, reviewed_at);

alter table public.srs_cards enable row level security;
alter table public.srs_reviews enable row level security;

create policy "students read own cards" on public.srs_cards for select to authenticated
  using (student_id = auth.uid());
create policy "students schedule own cards" on public.srs_cards for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());
create policy "teachers read students' cards" on public.srs_cards for select to authenticated
  using (public.is_teacher_of(auth.uid(), student_id));

create policy "students log own reviews" on public.srs_reviews for insert to authenticated
  with check (
    student_id = auth.uid()
    and exists (select 1 from public.srs_cards c where c.id = card_id and c.student_id = auth.uid())
  );
create policy "students read own reviews" on public.srs_reviews for select to authenticated
  using (student_id = auth.uid());
create policy "teachers read students' reviews" on public.srs_reviews for select to authenticated
  using (public.is_teacher_of(auth.uid(), student_id));

-- Students may only change scheduling fields, never the word itself.
create or replace function public.guard_srs_card()
returns trigger language plpgsql set search_path = public as $$
begin
  new.student_id := old.student_id;
  new.assignment_id := old.assignment_id;
  new.position := old.position;
  new.front := old.front;
  new.back := old.back;
  new.assigned_at := old.assigned_at;
  return new;
end $$;

drop trigger if exists guard_srs_card on public.srs_cards;
create trigger guard_srs_card
  before update on public.srs_cards
  for each row execute function public.guard_srs_card();

-- Copy a flashcard assignment's words into the recipient's collection.
create or replace function public.seed_flashcards()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into srs_cards (student_id, assignment_id, position, front, back, assigned_at)
  select new.student_id, a.id, (c.ord - 1)::int, c.card->>'f', c.card->>'b', new.assigned_at
  from assignments a,
       jsonb_array_elements(coalesce(a.payload->'cards', '[]'::jsonb)) with ordinality as c(card, ord)
  where a.id = new.assignment_id
    and a.kind = 'flashcards'
    and coalesce(c.card->>'f', '') <> ''
    and coalesce(c.card->>'b', '') <> ''
  on conflict (student_id, assignment_id, position) do nothing;
  return new;
end $$;

drop trigger if exists seed_flashcards on public.assignment_recipients;
create trigger seed_flashcards
  after insert on public.assignment_recipients
  for each row execute function public.seed_flashcards();

-- Backfill flashcard assignments made before this migration.
insert into public.srs_cards (student_id, assignment_id, position, front, back, assigned_at)
select r.student_id, a.id, (c.ord - 1)::int, c.card->>'f', c.card->>'b', r.assigned_at
from public.assignment_recipients r
join public.assignments a on a.id = r.assignment_id and a.kind = 'flashcards'
cross join lateral jsonb_array_elements(coalesce(a.payload->'cards', '[]'::jsonb)) with ordinality as c(card, ord)
where coalesce(c.card->>'f', '') <> '' and coalesce(c.card->>'b', '') <> ''
on conflict (student_id, assignment_id, position) do nothing;
