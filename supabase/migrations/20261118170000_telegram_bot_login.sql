-- Telegram login through the bot: the site creates a one-time code, the
-- student opens t.me/<bot>?start=<code>, confirms in Telegram, and the site
-- (polling telegram-auth) links the account or signs them in. Only the edge
-- functions (service role) touch this table.
create table if not exists public.telegram_login_requests (
  code text primary key,
  kind text not null check (kind in ('link', 'signin')),
  user_id uuid references auth.users(id) on delete cascade,
  telegram_id bigint,
  status text not null default 'pending'
    check (status in ('pending', 'done', 'not_linked', 'taken', 'used')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '15 minutes'
);

alter table public.telegram_login_requests enable row level security;
revoke all on public.telegram_login_requests from anon, authenticated;

create index if not exists telegram_login_requests_created_at_idx
  on public.telegram_login_requests (created_at);
