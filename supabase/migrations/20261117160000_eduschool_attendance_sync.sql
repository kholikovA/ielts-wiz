-- EduSchool attendance sync: the hub pushes each class register to the
-- school's EduSchool journal (POST /attendances) through the `eduschool` edge
-- function. Only that function (service role) writes these tables; teachers
-- read their own rows.
--
-- Credentials live in Vault as the secret named 'eduschool' (JSON:
-- {host, apiKey, login, password, branch}); set on the server, never in git.

-- A hub class ↔ one EduSchool class or group + the subject its lessons use.
create table if not exists public.eduschool_class_links (
  class_id uuid primary key references public.classes(id) on delete cascade,
  es_class_id text not null,
  es_class_label text not null,
  es_subject_id text not null,
  es_subject_name text not null,
  updated_at timestamptz not null default now()
);

-- A hub student ↔ their EduSchool student record.
create table if not exists public.eduschool_student_links (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  es_student_id text not null,
  es_student_name text not null,
  matched_by text not null default 'auto' check (matched_by in ('auto', 'teacher')),
  updated_at timestamptz not null default now()
);

-- Teacher said "this student has no EduSchool record": stop auto-matching them.
create table if not exists public.eduschool_student_skips (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Result of the last push of a session.
create table if not exists public.eduschool_session_sync (
  session_id uuid primary key references public.class_sessions(id) on delete cascade,
  status text not null check (status in ('ok', 'partial', 'error', 'no_lessons', 'not_linked')),
  lessons jsonb not null default '[]',
  sent int not null default 0,
  unlinked jsonb not null default '[]',
  message text,
  synced_at timestamptz not null default now()
);

-- Cached EduSchool staff token (service role only).
create table if not exists public.eduschool_token (
  id int primary key default 1 check (id = 1),
  token text not null,
  expires_at timestamptz not null
);

alter table public.eduschool_class_links enable row level security;
alter table public.eduschool_student_links enable row level security;
alter table public.eduschool_student_skips enable row level security;
alter table public.eduschool_session_sync enable row level security;
alter table public.eduschool_token enable row level security;

create policy "teachers read own class links" on public.eduschool_class_links for select to authenticated
  using (public.class_teacher(class_id) = auth.uid());

create policy "teachers read student links" on public.eduschool_student_links for select to authenticated
  using (exists (
    select 1 from public.class_members m join public.classes c on c.id = m.class_id
    where m.student_id = eduschool_student_links.student_id and c.teacher_id = auth.uid()));

create policy "teachers read session sync" on public.eduschool_session_sync for select to authenticated
  using (exists (
    select 1 from public.class_sessions s
    where s.id = eduschool_session_sync.session_id and public.class_teacher(s.class_id) = auth.uid()));

revoke all on public.eduschool_token from anon, authenticated;
revoke all on public.eduschool_student_skips from anon, authenticated;

-- Credentials for the edge function. Service role only.
create or replace function public.eduschool_secret()
returns text language sql stable security definer set search_path = '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'eduschool' limit 1;
$$;
revoke all on function public.eduschool_secret() from public, anon, authenticated;
grant execute on function public.eduschool_secret() to service_role;
