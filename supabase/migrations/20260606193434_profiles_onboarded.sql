-- Add a one-time onboarding flag to profiles. New Google users are created by
-- the handle_new_user trigger without this column set, so they default to
-- onboarded = false and see the onboarding questionnaire once.
alter table public.profiles
  add column if not exists onboarded boolean not null default false;

-- Don't re-prompt people who already completed the old multi-step signup (they
-- have a prep_duration), and don't interrupt admins while they test.
update public.profiles
  set onboarded = true
  where prep_duration is not null or is_admin = true;
