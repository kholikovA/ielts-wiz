// =============================================================================
// vocabList — the user's personal saved-word list (Articles "Add to
// vocabulary list" button), mirrored to the `user_vocab_words` Supabase table.
//
// Kept separate from cloudSync.js: that module's pullAndMerge is shaped
// specifically around test-result rows (kind/test_id/correct/total). Saving a
// word is a simple idempotent toggle keyed by word, not an append-only attempt
// log, so it gets its own light local-cache + best-effort-write module rather
// than the durable outbox used for at-risk offline test results.
// =============================================================================

import { supabase } from '../supabaseClient';

const LOCAL_KEY = 'iw.v1.vocabList';

const safeParse = (raw, fb) => { try { return raw ? JSON.parse(raw) : fb; } catch { return fb; } };

const readLocal = () => safeParse(localStorage.getItem(LOCAL_KEY), []);
const writeLocal = (list) => { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(list)); } catch { /* storage disabled */ } };

export const getLocalVocabList = () => readLocal();

export const isSaved = (word) => {
  const key = String(word || '').toLowerCase();
  return readLocal().some(w => w.word.toLowerCase() === key);
};

// Optimistic local write, then a best-effort push to the cloud. Offline or
// signed-out writes simply stay local-only until the next `pullVocabList()`.
export const addVocabWord = async (entry) => {
  const word = String(entry.word || '').trim();
  if (!word) return;
  // Local cache shape matches pullVocabList()'s output (camelCase) so a
  // freshly-added word and a cloud-pulled word render identically.
  const row = {
    word,
    ipa: entry.ipa || null,
    partOfSpeech: entry.partOfSpeech || null,
    definition: entry.definition || '',
    example: entry.example || null,
    collocations: entry.collocations || null,
    articleId: entry.articleId || null,
    level: entry.level || null,
    added_at: new Date().toISOString(),
  };

  const list = readLocal().filter(w => w.word.toLowerCase() !== word.toLowerCase());
  list.unshift(row);
  writeLocal(list);

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await supabase.from('user_vocab_words').upsert({
      user_id: session.user.id,
      word,
      ipa: row.ipa,
      part_of_speech: row.partOfSpeech,
      definition: row.definition,
      example: row.example,
      collocations: row.collocations,
      article_id: row.articleId,
      article_level: row.level,
    }, { onConflict: 'user_id,word' });
  } catch { /* best-effort; stays local until next pull */ }
};

export const removeVocabWord = async (word) => {
  const key = String(word || '').toLowerCase();
  writeLocal(readLocal().filter(w => w.word.toLowerCase() !== key));

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await supabase.from('user_vocab_words').delete().eq('user_id', session.user.id).ilike('word', key);
  } catch { /* best-effort; stays removed locally either way */ }
};

// Pull every saved word for the signed-in user and use it as the local cache
// (cloud is the source of truth for this list). Best-effort — failures leave
// the existing local cache untouched. Idempotent, safe to call on every boot.
export const pullVocabList = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return { ok: false, reason: 'no-session' };
    const { data, error } = await supabase
      .from('user_vocab_words')
      .select('word, ipa, part_of_speech, definition, example, collocations, article_id, article_level, created_at')
      .order('created_at', { ascending: false });
    if (error) return { ok: false, reason: error.message };
    writeLocal((data || []).map(row => ({
      word: row.word,
      ipa: row.ipa,
      partOfSpeech: row.part_of_speech,
      definition: row.definition,
      example: row.example,
      collocations: row.collocations,
      articleId: row.article_id,
      level: row.article_level,
      added_at: row.created_at,
    })));
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: String(e?.message || e) };
  }
};
