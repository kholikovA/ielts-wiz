-- 1. Allow the full-test kinds. The React players record `reading_full` and
--    `listening_full`, but the CHECK only listed the part-practice kinds, so
--    every full-test insert failed with 23514 and the outbox dropped it as a
--    "permanent" error: no full-test result ever reached the cloud.
alter table public.user_test_results drop constraint if exists user_test_results_kind_check;
alter table public.user_test_results add constraint user_test_results_kind_check
  check (kind = any (array[
    'listening', 'listening_full',
    'reading_p1', 'reading_p2', 'reading_p3', 'reading_full',
    'grammar', 'writing'
  ]));

-- 2. Let a user attach the answer snapshot to one of their own results that
--    has none yet. Rows recorded before answers were sent (all listening part
--    practice so far) can then be reviewed on any device once the device that
--    holds the local snapshot syncs it up. Scores stay append-only: the grant
--    covers the `answers` column only, and only while it is still NULL.
grant update (answers) on public.user_test_results to authenticated;

drop policy if exists "Users can attach answers to their own results" on public.user_test_results;
create policy "Users can attach answers to their own results"
  on public.user_test_results for update to authenticated
  using (auth.uid() = user_id and answers is null)
  with check (auth.uid() = user_id);
