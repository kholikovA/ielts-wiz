-- AI pronunciation clips for flashcard words (fallback when Wikimedia Commons
-- has no human recording for an accent). Generated once per word + accent by
-- the word-audio edge function (OpenAI gpt-4o-mini-tts), stored in the public
-- word-audio bucket and shared by every student.
--
-- Reads: anyone signed in (and anon, so cached clips load fast).
-- Writes: only the edge function (service role) — no insert/update policies.

create table if not exists public.word_audio (
  word text not null check (char_length(word) between 1 and 60 and word = lower(word)),
  accent text not null check (accent in ('uk', 'us')),
  path text not null,
  model text not null,
  voice text not null,
  created_at timestamptz not null default now(),
  primary key (word, accent)
);

alter table public.word_audio enable row level security;

drop policy if exists "word audio is readable" on public.word_audio;
create policy "word audio is readable" on public.word_audio for select to anon, authenticated using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('word-audio', 'word-audio', true, 1048576, array['audio/mpeg'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "word audio files are public" on storage.objects;
create policy "word audio files are public" on storage.objects for select to anon, authenticated
  using (bucket_id = 'word-audio');
