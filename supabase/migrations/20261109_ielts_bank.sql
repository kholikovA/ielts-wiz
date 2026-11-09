-- IELTS question bank (Teaching → Question bank → IELTS).
--
-- ielts_tests: one row per reading or listening test, stored in the same JSON spec
--   format the main site's React test players use (src/data/tests/*). Admins add tests
--   by uploading a PDF or HTML file; the ielts-import edge function turns it into a spec,
--   the admin previews it in the real player, then saves it here.
--   Students open an assigned test at /reading-test/bank-<id> or /listening-test/bank-<id>,
--   and attempts are recorded as kind reading_full / listening_full with test_id bank_<id>.
--   Any signed-in user can read a test (students need it to take one), like the
--   static tests bundled with the site. Only admins can add, edit or delete.
-- Storage bucket ielts-bank (public): listening audio and labelling images, uploaded by admins.

-- Uses the existing public.is_admin_user(uuid) helper.

create table if not exists public.ielts_tests (
  id uuid primary key default gen_random_uuid(),
  skill text not null check (skill in ('reading', 'listening')),
  title text not null check (length(title) between 1 and 200),
  spec jsonb not null,
  question_count int not null default 0,
  source_name text,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ielts_tests_skill_idx on public.ielts_tests (skill, created_at desc);

alter table public.ielts_tests enable row level security;

drop policy if exists "signed-in users read ielts tests" on public.ielts_tests;
create policy "signed-in users read ielts tests" on public.ielts_tests for select to authenticated
  using (true);
drop policy if exists "admins add ielts tests" on public.ielts_tests;
create policy "admins add ielts tests" on public.ielts_tests for insert to authenticated
  with check (public.is_admin_user(auth.uid()));
drop policy if exists "admins edit ielts tests" on public.ielts_tests;
create policy "admins edit ielts tests" on public.ielts_tests for update to authenticated
  using (public.is_admin_user(auth.uid())) with check (public.is_admin_user(auth.uid()));
drop policy if exists "admins delete ielts tests" on public.ielts_tests;
create policy "admins delete ielts tests" on public.ielts_tests for delete to authenticated
  using (public.is_admin_user(auth.uid()));

create or replace function public.touch_ielts_test()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists ielts_tests_touch on public.ielts_tests;
create trigger ielts_tests_touch before update on public.ielts_tests
  for each row execute function public.touch_ielts_test();

-- Audio and images for bank tests.
insert into storage.buckets (id, name, public, file_size_limit)
values ('ielts-bank', 'ielts-bank', true, 104857600)
on conflict (id) do nothing;

drop policy if exists "admins upload ielts media" on storage.objects;
create policy "admins upload ielts media" on storage.objects for insert to authenticated
  with check (bucket_id = 'ielts-bank' and public.is_admin_user(auth.uid()));
drop policy if exists "admins update ielts media" on storage.objects;
create policy "admins update ielts media" on storage.objects for update to authenticated
  using (bucket_id = 'ielts-bank' and public.is_admin_user(auth.uid()));
drop policy if exists "admins delete ielts media" on storage.objects;
create policy "admins delete ielts media" on storage.objects for delete to authenticated
  using (bucket_id = 'ielts-bank' and public.is_admin_user(auth.uid()));
