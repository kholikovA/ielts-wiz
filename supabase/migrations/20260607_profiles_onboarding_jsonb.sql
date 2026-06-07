-- Store the full onboarding questionnaire (timeframe, purpose, destination,
-- first language, weekly study time, taken-before/previous band, focus areas,
-- reminder opt-in, etc.) as one jsonb blob. The typed columns target_score and
-- goals continue to hold the high-value, queryable fields; this captures the
-- rest without a column per question. Nullable + additive.
alter table public.profiles
  add column if not exists onboarding jsonb;
