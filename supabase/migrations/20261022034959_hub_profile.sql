-- Student Hub profile: first/last name, date of birth and a picked character.
-- `name` stays the display name used everywhere (the hub keeps it in sync as
-- "first last"). avatar_character is one of the hub's drawn characters
-- (src/student/characters.js); the main site's avatar_index is separate.

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists birth_date date,
  add column if not exists avatar_character text;

alter table public.profiles drop constraint if exists profiles_first_name_len;
alter table public.profiles add constraint profiles_first_name_len check (first_name is null or char_length(first_name) <= 60);
alter table public.profiles drop constraint if exists profiles_last_name_len;
alter table public.profiles add constraint profiles_last_name_len check (last_name is null or char_length(last_name) <= 60);
alter table public.profiles drop constraint if exists profiles_birth_date_range;
alter table public.profiles add constraint profiles_birth_date_range check (birth_date is null or birth_date >= date '1900-01-01');
alter table public.profiles drop constraint if exists profiles_avatar_character_check;
alter table public.profiles add constraint profiles_avatar_character_check
  check (avatar_character is null or avatar_character in ('m1', 'm2', 'm3', 'm4', 'm5', 'f1', 'f2', 'f3', 'f4', 'f5'));
