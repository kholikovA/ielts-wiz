-- Personal vocabulary list: words a user saves from the Articles section
-- (the "Add to vocabulary list" button in the vocab popup). Applied to
-- Supabase project jaucbfremtxmanciflab on 2026-09-29.
--
-- Full word data (ipa/definition/example/collocations) is snapshotted at
-- save-time rather than re-looked-up from article content, so a saved word
-- stays correct even if the source article is edited later — same
-- durability philosophy as test_reports/user_test_results.
create table if not exists public.user_vocab_words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word text not null,
  ipa text,
  part_of_speech text,
  definition text not null,
  example text,
  collocations text[],
  article_id text,
  article_level text,
  created_at timestamptz not null default now(),
  unique (user_id, word)
);

alter table public.user_vocab_words enable row level security;

drop policy if exists "select own vocab words" on public.user_vocab_words;
create policy "select own vocab words"
  on public.user_vocab_words for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "insert own vocab words" on public.user_vocab_words;
create policy "insert own vocab words"
  on public.user_vocab_words for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "update own vocab words" on public.user_vocab_words;
create policy "update own vocab words"
  on public.user_vocab_words for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "delete own vocab words" on public.user_vocab_words;
create policy "delete own vocab words"
  on public.user_vocab_words for delete
  to authenticated
  using (auth.uid() = user_id);
