-- Durability + idempotency for cross-device test history.
-- Applied to production 2026-06-06.
--
-- attempt_id is a client-generated UUID per attempt; a unique index on
-- (user_id, attempt_id) makes the submit write idempotent, so the offline
-- outbox (src/lib/syncQueue.js) can retry a failed push without ever
-- double-counting a result.

alter table public.user_test_results
  add column if not exists attempt_id uuid;

create unique index if not exists user_test_results_user_attempt_uidx
  on public.user_test_results (user_id, attempt_id)
  where attempt_id is not null;

-- Data-sanity guards (not anti-cheat): reject structurally impossible rows so
-- a corrupt client payload can't poison history.
alter table public.user_test_results
  drop constraint if exists user_test_results_score_sane;
alter table public.user_test_results
  add constraint user_test_results_score_sane
  check (total > 0 and correct >= 0 and correct <= total);
