-- Let admins read test_reports in the /admin dashboard (mirrors the
-- is_admin_user pattern used by user_test_results and profiles).
-- Applied to Supabase project jaucbfremtxmanciflab on 2026-06-06.
drop policy if exists "Admins can read all reports" on public.test_reports;
create policy "Admins can read all reports"
  on public.test_reports for select
  to authenticated
  using (is_admin_user(auth.uid()));
