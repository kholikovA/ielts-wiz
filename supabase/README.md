# Supabase

Merging to main applies new files in `migrations/` automatically
(`.github/workflows/supabase-deploy.yml`). Don't paste them into the SQL Editor.

- Name: `YYYYMMDDHHMMSS_short_name.sql`, UTC time, e.g. `20261111093000_coin_bonus.sql`.
  Every file needs its own timestamp.
- Never rename or edit a file once it is on main: it has already run. Fix things in a new file.
- Write them so running twice is harmless (`create or replace`, `if not exists`).
