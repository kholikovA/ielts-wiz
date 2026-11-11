-- Student Hub: teachers, classes, homework. Applied to Supabase project
-- jaucbfremtxmanciflab on 2026-10-21.
--
--   profiles.is_teacher       granted by an admin (set_teacher RPC); admins count as teachers
--   classes                   a teacher's group, joined with a short join_code
--   class_members             students in a class (inserted only via join_class RPC)
--   assignments               homework: test | writing | custom | flashcards (shape in payload)
--   assignment_recipients     who an assignment is for; class assignments expand to members
--   submissions               one per (assignment, student); teacher feedback via review_submission
--
-- Also closes a privilege-escalation hole: "Users can update own profile" had no
-- column restriction, so any user could set is_admin on their own row.

-- ── Roles ────────────────────────────────────────────────────────────────────
alter table public.profiles add column if not exists is_teacher boolean not null default false;

-- Only admins (or server-side contexts with no auth.uid(), e.g. the SQL editor
-- and the handle_new_user trigger) may change is_admin / is_teacher.
create or replace function public.guard_profile_roles()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin_user(auth.uid()) then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.is_admin := false;
    new.is_teacher := false;
  elsif new.is_admin is distinct from old.is_admin or new.is_teacher is distinct from old.is_teacher then
    raise exception 'Not allowed to change roles' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists guard_profile_roles on public.profiles;
create trigger guard_profile_roles
  before insert or update on public.profiles
  for each row execute function public.guard_profile_roles();

create or replace function public.is_teacher_user(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = uid and (is_teacher or coalesce(is_admin, false)));
$$;

create or replace function public.set_teacher(target uuid, on_off boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin_user(auth.uid()) then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  update profiles set is_teacher = on_off where id = target;
end $$;

-- ── Tables ───────────────────────────────────────────────────────────────────
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  join_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists classes_teacher_idx on public.classes (teacher_id);

create table if not exists public.class_members (
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, student_id)
);
create index if not exists class_members_student_idx on public.class_members (student_id);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  kind text not null check (kind in ('test', 'writing', 'custom', 'flashcards')),
  title text not null check (char_length(title) between 1 and 200),
  instructions text,
  payload jsonb not null default '{}'::jsonb,
  due_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists assignments_teacher_idx on public.assignments (teacher_id);

create table if not exists public.assignment_recipients (
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (assignment_id, student_id)
);
create index if not exists assignment_recipients_student_idx on public.assignment_recipients (student_id);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'submitted')),
  body text,
  note text,
  data jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  updated_at timestamptz not null default now(),
  band numeric(2,1) check (band between 0 and 9),
  feedback text,
  reviewed_at timestamptz,
  unique (assignment_id, student_id)
);

-- ── RLS helpers (security definer → no policy recursion) ─────────────────────
create or replace function public.class_teacher(cid uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select teacher_id from classes where id = cid;
$$;

create or replace function public.is_class_member(cid uuid, uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from class_members where class_id = cid and student_id = uid);
$$;

create or replace function public.is_teacher_of(t uuid, s uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from class_members m join classes c on c.id = m.class_id
    where c.teacher_id = t and m.student_id = s
  ) or exists (select 1 from teacher_students where teacher_id = t and student_id = s);
$$;

create or replace function public.assignment_teacher(aid uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select teacher_id from assignments where id = aid;
$$;

create or replace function public.is_recipient(aid uuid, uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from assignment_recipients where assignment_id = aid and student_id = uid);
$$;

-- ── Policies ─────────────────────────────────────────────────────────────────
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_recipients enable row level security;
alter table public.submissions enable row level security;

create policy "teachers manage own classes" on public.classes for all to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid() and public.is_teacher_user(auth.uid()));
create policy "members read their classes" on public.classes for select to authenticated
  using (public.is_class_member(id, auth.uid()));

create policy "teachers read members" on public.class_members for select to authenticated
  using (public.class_teacher(class_id) = auth.uid());
create policy "teachers remove members" on public.class_members for delete to authenticated
  using (public.class_teacher(class_id) = auth.uid());
create policy "students read own memberships" on public.class_members for select to authenticated
  using (student_id = auth.uid());
create policy "students leave classes" on public.class_members for delete to authenticated
  using (student_id = auth.uid());

create policy "teachers manage own assignments" on public.assignments for all to authenticated
  using (teacher_id = auth.uid())
  with check (
    teacher_id = auth.uid() and public.is_teacher_user(auth.uid())
    and (class_id is null or public.class_teacher(class_id) = auth.uid())
  );
create policy "students read assigned work" on public.assignments for select to authenticated
  using (public.is_recipient(id, auth.uid()));

create policy "teachers manage recipients" on public.assignment_recipients for all to authenticated
  using (public.assignment_teacher(assignment_id) = auth.uid())
  with check (public.assignment_teacher(assignment_id) = auth.uid() and public.is_teacher_of(auth.uid(), student_id));
create policy "students read own recipient rows" on public.assignment_recipients for select to authenticated
  using (student_id = auth.uid());

create policy "students read own submissions" on public.submissions for select to authenticated
  using (student_id = auth.uid());
create policy "students create own submissions" on public.submissions for insert to authenticated
  with check (
    student_id = auth.uid() and public.is_recipient(assignment_id, auth.uid())
    and band is null and feedback is null and reviewed_at is null
  );
create policy "students edit unreviewed submissions" on public.submissions for update to authenticated
  using (student_id = auth.uid() and reviewed_at is null)
  with check (student_id = auth.uid());
create policy "teachers read submissions" on public.submissions for select to authenticated
  using (public.assignment_teacher(assignment_id) = auth.uid());

-- Students can never write the teacher's fields; review_submission is the only path.
create or replace function public.guard_submission_feedback()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() = old.student_id then
    new.band := old.band;
    new.feedback := old.feedback;
    new.reviewed_at := old.reviewed_at;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists guard_submission_feedback on public.submissions;
create trigger guard_submission_feedback
  before update on public.submissions
  for each row execute function public.guard_submission_feedback();

-- Teachers see their students' profiles and test results.
create policy "Teachers can read their students' profiles" on public.profiles for select to authenticated
  using (public.is_teacher_of(auth.uid(), id));
create policy "Teachers can read their students' results" on public.user_test_results for select to authenticated
  using (public.is_teacher_of(auth.uid(), user_id));

-- ── RPCs ─────────────────────────────────────────────────────────────────────
-- Preview a class before joining (name + teacher only).
create or replace function public.class_by_code(code text)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object('name', c.name, 'teacher', p.name)
  from classes c left join profiles p on p.id = c.teacher_id
  where c.join_code = upper(trim(code)) and not c.archived;
$$;

create or replace function public.join_class(code text)
returns json language plpgsql security definer set search_path = public as $$
declare
  c classes;
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Sign in required' using errcode = '42501'; end if;
  select * into c from classes where join_code = upper(trim(code)) and not archived;
  if not found then raise exception 'No class with that code' using errcode = 'P0002'; end if;
  if c.teacher_id = uid then raise exception 'You teach this class' using errcode = '22023'; end if;

  insert into class_members (class_id, student_id) values (c.id, uid) on conflict do nothing;
  -- Late joiners pick up the class's still-open homework.
  insert into assignment_recipients (assignment_id, student_id)
    select a.id, uid from assignments a
    where a.class_id = c.id and (a.due_at is null or a.due_at > now())
    on conflict do nothing;

  return json_build_object('class_id', c.id, 'name', c.name);
end $$;

create or replace function public.my_classes()
returns table (id uuid, name text, teacher_name text, joined_at timestamptz)
language sql stable security definer set search_path = public as $$
  select c.id, c.name, p.name, m.joined_at
  from class_members m
  join classes c on c.id = m.class_id
  left join profiles p on p.id = c.teacher_id
  where m.student_id = auth.uid() and not c.archived
  order by m.joined_at;
$$;

create or replace function public.review_submission(sub uuid, p_band numeric, p_feedback text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from submissions s where s.id = sub and public.assignment_teacher(s.assignment_id) = auth.uid()
  ) then
    raise exception 'Not your student''s submission' using errcode = '42501';
  end if;
  update submissions
     set band = p_band, feedback = nullif(trim(p_feedback), ''), reviewed_at = now()
   where id = sub;
end $$;

revoke execute on function public.set_teacher(uuid, boolean) from public, anon;
revoke execute on function public.class_by_code(text) from public, anon;
revoke execute on function public.join_class(text) from public, anon;
revoke execute on function public.my_classes() from public, anon;
revoke execute on function public.review_submission(uuid, numeric, text) from public, anon;
grant execute on function public.set_teacher(uuid, boolean) to authenticated;
grant execute on function public.class_by_code(text) to authenticated;
grant execute on function public.join_class(text) to authenticated;
grant execute on function public.my_classes() to authenticated;
grant execute on function public.review_submission(uuid, numeric, text) to authenticated;
