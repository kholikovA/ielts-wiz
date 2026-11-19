-- Telegram notifications: every Student Hub notification (homework, feedback,
-- retake, coins, and submissions for teachers) is also sent by @ieltswizbot to
-- accounts that linked Telegram. The notify-telegram edge function picks up
-- rows with telegram_sent_at null once a minute. Students turn it off or on
-- with /notifications in the bot (profiles.telegram_notify, written only by
-- the bot through the service role).
alter table public.notifications
  add column if not exists telegram_sent_at timestamptz;

-- Don't send the existing backlog.
update public.notifications set telegram_sent_at = now() where telegram_sent_at is null;

create index if not exists notifications_telegram_idx
  on public.notifications (visible_at) where telegram_sent_at is null;

alter table public.profiles
  add column if not exists telegram_notify boolean not null default true;

do $$
begin
  perform cron.unschedule('notify-telegram')
  where exists (select 1 from cron.job where jobname = 'notify-telegram');
  perform cron.schedule('notify-telegram', '* * * * *', $job$
    select net.http_post(
      url := 'http://supabase-kong:8000/functions/v1/notify-telegram',
      headers := jsonb_build_object('Content-Type','application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'notify_cron_secret')),
      body := '{}'::jsonb)
    where exists (select 1 from public.notifications where telegram_sent_at is null and visible_at <= now());
  $job$);
end $$;
