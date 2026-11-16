-- Weekly class timetable (Student Hub → Schedule). One row per lesson block on
-- a teacher's week grid: day 1-5 (Mon-Fri), periods 1-7, spanning 1-3 periods.
-- Teachers edit their own grid directly (RLS); students read only the blocks of
-- classes they belong to through class_schedule(), which leaves out the
-- teacher's private notes and blocked-out time.

create table public.schedule_slots (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  kind text not null check (kind in ('sat', 'ielts', 'office', 'other', 'blocked')),
  title text check (title is null or char_length(title) between 1 and 40),
  day smallint not null check (day between 1 and 5),
  period smallint not null check (period between 1 and 7),
  span smallint not null default 1 check (span between 1 and 3),
  pending boolean not null default false,
  note text check (note is null or char_length(note) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period + span - 1 <= 7),
  -- Lessons belong to a class; blocked-out time (e.g. prayer) doesn't.
  check ((kind = 'blocked') = (class_id is null))
);
create index schedule_slots_teacher_idx on public.schedule_slots (teacher_id, day);
create index schedule_slots_class_idx on public.schedule_slots (class_id);

alter table public.schedule_slots enable row level security;

create policy "teachers read own schedule" on public.schedule_slots
  for select to authenticated
  using (teacher_id = auth.uid() or public.is_admin_user(auth.uid()));

create policy "teachers manage own schedule" on public.schedule_slots
  for all to authenticated
  using (teacher_id = auth.uid())
  with check (
    teacher_id = auth.uid()
    and public.is_teacher_user(auth.uid())
    and (class_id is null or exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()))
  );

grant select, insert, update, delete on public.schedule_slots to authenticated;

-- A teacher can't be in two places at once. Checked at commit so a swap of two
-- blocks can be written as two updates in one transaction.
create or replace function public.schedule_no_overlap()
returns trigger language plpgsql as $$
declare
  cur public.schedule_slots;
begin
  -- Deferred: NEW may be stale if the row changed again later in the transaction.
  select * into cur from public.schedule_slots where id = new.id;
  if not found then return null; end if;
  if exists (
    select 1 from public.schedule_slots s
    where s.teacher_id = cur.teacher_id and s.day = cur.day and s.id <> cur.id
      and s.period < cur.period + cur.span and cur.period < s.period + s.span
  ) then
    raise exception 'That time is already taken on your schedule' using errcode = '23P01';
  end if;
  return null;
end $$;

create constraint trigger schedule_no_overlap
  after insert or update of day, period, span, teacher_id on public.schedule_slots
  deferrable initially deferred
  for each row execute function public.schedule_no_overlap();

create or replace function public.schedule_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger schedule_touch before update on public.schedule_slots
  for each row execute function public.schedule_touch();

-- Move (and swap) several blocks at once: [{id, day, period, span?}].
-- Runs as the caller, so RLS limits it to the teacher's own blocks.
create or replace function public.schedule_move(p_moves jsonb)
returns void language plpgsql security invoker set search_path = public as $$
declare
  m jsonb;
begin
  for m in select * from jsonb_array_elements(p_moves) loop
    update schedule_slots
       set day = (m->>'day')::smallint,
           period = (m->>'period')::smallint,
           span = coalesce((m->>'span')::smallint, span)
     where id = (m->>'id')::uuid;
    if not found then
      raise exception 'Lesson not found' using errcode = 'P0002';
    end if;
  end loop;
end $$;

revoke all on function public.schedule_move(jsonb) from public, anon;
grant execute on function public.schedule_move(jsonb) to authenticated;

-- A student's timetable: blocks of every (non-archived) class they're in.
-- Teachers may pass one of their students (student view).
create or replace function public.class_schedule(p_student uuid default null)
returns table (id uuid, class_id uuid, class_name text, kind text, title text, day smallint, period smallint, span smallint, pending boolean)
language plpgsql stable security definer set search_path = public as $$
declare
  uid uuid := coalesce(p_student, auth.uid());
begin
  if uid is distinct from auth.uid() and not public.is_teacher_of(auth.uid(), uid) and not public.is_admin_user(auth.uid()) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return query
  select s.id, s.class_id, c.name, s.kind, s.title, s.day, s.period, s.span, s.pending
  from schedule_slots s
  join classes c on c.id = s.class_id and not c.archived
  join class_members m on m.class_id = c.id and m.student_id = uid
  order by s.day, s.period;
end $$;

revoke all on function public.class_schedule(uuid) from public, anon;
grant execute on function public.class_schedule(uuid) to authenticated;
