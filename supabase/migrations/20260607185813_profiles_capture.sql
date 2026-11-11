-- Enrich profiles with everything we can capture about a user.
--
-- From Google (default scopes, no verification needed) via the handle_new_user
-- trigger: avatar_url, google_sub (stable id), email_verified, auth_provider.
-- From the client (passive, no extra consent) via AuthContext: locale, timezone,
-- device, and first-touch acquisition (referrer / UTM / landing path).

alter table public.profiles
  add column if not exists avatar_url          text,
  add column if not exists google_sub          text,
  add column if not exists email_verified      boolean,
  add column if not exists auth_provider        text,
  add column if not exists locale               text,
  add column if not exists timezone             text,
  add column if not exists signup_device        text,
  add column if not exists signup_referrer      text,
  add column if not exists signup_utm           jsonb,
  add column if not exists signup_landing_path  text,
  add column if not exists first_seen_at        timestamptz;

-- Extend the new-user trigger to also pull Google's identity fields out of the
-- auth metadata. Existing behaviour (name/target/prep/referral/goals) unchanged.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  insert into public.profiles (
    id, email, name, avatar_url, google_sub, email_verified, auth_provider,
    target_score, prep_duration, referral_source, goals,
    last_sign_in_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    coalesce(new.raw_user_meta_data->>'provider_id', new.raw_user_meta_data->>'sub'),
    coalesce((new.raw_user_meta_data->>'email_verified')::boolean, false),
    new.raw_app_meta_data->>'provider',
    coalesce((new.raw_user_meta_data->>'target_score')::numeric, 7.0),
    new.raw_user_meta_data->>'prep_duration',
    new.raw_user_meta_data->>'referral_source',
    coalesce(
      (select array_agg(value::text) from jsonb_array_elements_text(new.raw_user_meta_data->'goals')),
      '{}'::text[]
    ),
    new.last_sign_in_at
  );
  return new;
end;
$function$;
