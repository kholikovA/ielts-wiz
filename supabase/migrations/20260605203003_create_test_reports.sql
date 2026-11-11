-- Student feedback on a reading test (the results-page "Report" button).
-- Applied to Supabase project jaucbfremtxmanciflab on 2026-06-06.
create table if not exists public.test_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid default auth.uid() references auth.users(id) on delete set null,
  kind text,
  test_id text,
  message text not null,
  context jsonb
);

alter table public.test_reports enable row level security;

-- Anyone (anonymous or signed-in) may file a report.
drop policy if exists "anyone can insert reports" on public.test_reports;
create policy "anyone can insert reports"
  on public.test_reports for insert
  to anon, authenticated
  with check (true);

-- Reads are restricted to service role / dashboard (no select policy for clients).
