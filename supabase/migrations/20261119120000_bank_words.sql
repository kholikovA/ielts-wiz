-- Question bank → Words: every B2+ word (and idiomatic phrasal verb) students meet
-- in the question bank (SAT prompts, passages and options; IELTS bank passages,
-- questions and options), so teachers can assign them as flashcards + "Use it"
-- until students understand 100% of the bank's text.
--
-- Rows are written by scripts/word-bank (service role): level is the CEFR level
-- (CEFR-J 1.5 / Octanove C1-C2 lists, else word family or corpus frequency),
-- freq = how many questions (SAT) or test parts (IELTS) use the word,
-- examples = real sentences from the bank [{ s, src, w }].
-- Teachers read everything and may only change:
--   card    cached AI study material { b, ex, gap, ans, forms, coll } (vocab-enrich),
--           so each word is enriched once and reused for every class
--   hidden  drop a word from the list for all teachers (e.g. a name that slipped in)

create table if not exists public.bank_words (
  word text primary key check (length(word) between 2 and 60),
  kind text not null default 'word' check (kind in ('word', 'phrase')),
  level text not null check (level in ('B2', 'C1', 'C2')),
  pos text,
  freq int not null default 0,
  sources jsonb not null default '{}'::jsonb,
  forms text[] not null default '{}',
  examples jsonb not null default '[]'::jsonb,
  zipf real,
  card jsonb,
  hidden boolean not null default false,
  updated_at timestamptz not null default now()
);
create index if not exists bank_words_freq_idx on public.bank_words (freq desc);

alter table public.bank_words enable row level security;

drop policy if exists "teachers read bank words" on public.bank_words;
create policy "teachers read bank words" on public.bank_words for select to authenticated
  using (public.is_teacher_user(auth.uid()));
drop policy if exists "teachers update bank words" on public.bank_words;
create policy "teachers update bank words" on public.bank_words for update to authenticated
  using (public.is_teacher_user(auth.uid())) with check (public.is_teacher_user(auth.uid()));

revoke insert, update, delete on public.bank_words from anon, authenticated;
grant select on public.bank_words to authenticated;
grant update (card, hidden, updated_at) on public.bank_words to authenticated;
