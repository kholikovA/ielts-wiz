-- One-off (11 Nov 2026): make Supabase's migration history match the renamed
-- files in supabase/migrations. Nothing here changes app data; it only
-- records which files have already been run. Run once in the SQL Editor.

create table if not exists supabase_migrations.schema_migrations_backup_20261111 as
  select * from supabase_migrations.schema_migrations;

-- Entries with no matching file (applied directly from the dashboard in May/June).
delete from supabase_migrations.schema_migrations
where version not in ('20260605203003', '20260605211643', '20260605223151', '20260606193434',
                      '20260607172335', '20260607185813', '20260930033111', '20261026185629');

-- Files that were pasted into the SQL Editor by hand.
insert into supabase_migrations.schema_migrations (version, name) values
  ('20261020085233', 'user_test_results_full_kinds_and_answers'),
  ('20261021045926', 'student_hub_homework'),
  ('20261021083823', 'flashcards_srs'),
  ('20261021092501', 'hub_rewards_attendance_notifications'),
  ('20261021111447', 'coins_v2'),
  ('20261021200922', 'dictation'),
  ('20261021205156', 'ai_writing_marking'),
  ('20261022034959', 'hub_profile'),
  ('20261024163308', 'task_uploads'),
  ('20261024170803', 'vocab_produce'),
  ('20261024191819', 'use_it_levels'),
  ('20261026045919', 'quiz'),
  ('20261027060415', 'allow_retake'),
  ('20261029052841', 'sat_bank_attempts'),
  ('20261109173534', 'ielts_bank'),
  ('20261109203040', 'hub_stats'),
  ('20261109204146', 'hub_events'),
  ('20261110071013', 'coin_reset'),
  ('20261110072442', 'coin_day_close'),
  ('20261110072823', 'retake_notification'),
  ('20261110073056', 'coin_notifications'),
  ('20261110080808', 'hub_chat')
on conflict (version) do nothing;

select count(*) as recorded from supabase_migrations.schema_migrations;  -- should be 30
