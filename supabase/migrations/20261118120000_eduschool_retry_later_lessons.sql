-- EduSchool refuses attendance for a lesson that hasn't started yet. When a
-- register is pushed during the first of two back-to-back lessons, the push
-- records when the later lesson begins (retry_at) and this job re-sends the
-- day's register to EduSchool once that time has passed.
--
-- The cron call carries the public anon JWT (vault secret 'anon_key') to get
-- past the edge gateway, and x-cron-secret as the real authorisation.

alter table public.eduschool_session_sync add column if not exists retry_at timestamptz;
create index if not exists eduschool_session_sync_retry_at on public.eduschool_session_sync (retry_at) where retry_at is not null;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'eduschool-retry') then
    perform cron.unschedule('eduschool-retry');
  end if;
end $$;
select cron.schedule('eduschool-retry', '* * * * *', $cron$
  select net.http_post(
    url := 'http://supabase-kong:8000/functions/v1/eduschool',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key'),
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'notify_cron_secret')),
    body := '{"action":"retry_due"}'::jsonb)
  where exists (select 1 from public.eduschool_session_sync where retry_at <= now());
$cron$);
