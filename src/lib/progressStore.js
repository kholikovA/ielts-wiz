// =============================================================================
// progressStore — single, versioned source of truth for test completion + the
// activity log used by the dashboard heatmap.
//
// Keys are namespaced: `iw.v1.*`. Future schema changes must (a) bump the
// version to `iw.v2.*` and (b) extend `migrateLegacy()` to copy v1 → v2.
//
// Do NOT rename or repurpose v1 keys. They are part of the user-data contract.
// Anything that ever shipped to a real user must be migrated, not deleted.
// =============================================================================

const KEYS = {
  // Completion lists — arrays of test IDs (strings or numbers).
  listening:        'iw.v1.completed.listening',
  readingPassage1:  'iw.v1.completed.reading.passage1',
  readingPassage2:  'iw.v1.completed.reading.passage2',
  readingPassage3:  'iw.v1.completed.reading.passage3',
  // Activity log — array of { d:'YYYY-MM-DD', t:'listening'|'reading_p1'|..., id, correct, total }
  activity:         'iw.v1.activity',
  // UI preference: 'list' (default) or 'grid' for skill-page test catalogues.
  viewMode:         'iw.v1.viewMode',
};

// One-shot mapping from the pre-namespaced keys we shipped in earlier deploys
// to the v1 keys above. Safe to call repeatedly — only migrates if the v1 key
// is empty AND the legacy key has data.
const LEGACY_MAP = [
  ['completedListeningTests', KEYS.listening],
  ['completedReading_passage1', KEYS.readingPassage1],
  ['completedReading_passage2', KEYS.readingPassage2],
  ['completedReading_passage3', KEYS.readingPassage3],
];

const safeJSONParse = (raw, fallback) => {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
};

const readArray = (key) => safeJSONParse(localStorage.getItem(key), []);
const writeArray = (key, val) => localStorage.setItem(key, JSON.stringify(val));

export const migrateLegacy = () => {
  if (typeof window === 'undefined') return;
  LEGACY_MAP.forEach(([oldKey, newKey]) => {
    const newRaw = localStorage.getItem(newKey);
    const oldRaw = localStorage.getItem(oldKey);
    if (oldRaw && (newRaw === null || newRaw === '[]')) {
      localStorage.setItem(newKey, oldRaw);
    }
  });
};

const COMPLETION_KEY_FOR = {
  listening: KEYS.listening,
  reading_p1: KEYS.readingPassage1,
  reading_p2: KEYS.readingPassage2,
  reading_p3: KEYS.readingPassage3,
};

export const getCompletedIds = (kind) => {
  migrateLegacy();
  const key = COMPLETION_KEY_FOR[kind];
  if (!key) return [];
  return readArray(key).map(String);
};

export const isCompleted = (kind, id) =>
  getCompletedIds(kind).includes(String(id));

export const markCompleted = (kind, id) => {
  migrateLegacy();
  const key = COMPLETION_KEY_FOR[kind];
  if (!key) return;
  const list = readArray(key).map(String);
  const sid = String(id);
  if (!list.includes(sid)) {
    list.push(sid);
    writeArray(key, list);
  }
};

// Activity log — keep a rolling window of ~400 most recent entries so the
// heatmap stays cheap to render.
const MAX_ACTIVITY = 400;

export const logActivity = (entry) => {
  migrateLegacy();
  const list = readArray(KEYS.activity);
  list.push({ ...entry, d: entry.d || new Date().toISOString().slice(0, 10) });
  while (list.length > MAX_ACTIVITY) list.shift();
  writeArray(KEYS.activity, list);
};

export const getActivity = () => {
  migrateLegacy();
  return readArray(KEYS.activity);
};

// Group activity by date for heatmap rendering.
export const getActivityByDay = () => {
  const byDay = {};
  for (const e of getActivity()) {
    if (!e || !e.d) continue;
    byDay[e.d] = (byDay[e.d] || 0) + 1;
  }
  return byDay;
};

// Streak — consecutive days ending today (or yesterday, if no activity today).
export const getCurrentStreak = () => {
  const byDay = getActivityByDay();
  const dayMs = 24 * 60 * 60 * 1000;
  let cursor = new Date();
  // If there's nothing today, start counting from yesterday so a fresh morning
  // doesn't reset the streak before they've practiced.
  const todayKey = cursor.toISOString().slice(0, 10);
  if (!byDay[todayKey]) cursor = new Date(cursor.getTime() - dayMs);
  let streak = 0;
  while (true) {
    const k = cursor.toISOString().slice(0, 10);
    if (byDay[k]) {
      streak += 1;
      cursor = new Date(cursor.getTime() - dayMs);
    } else {
      break;
    }
  }
  return streak;
};

// Entries on a specific date (used by the heatmap drill-down modal).
export const getActivityOnDate = (isoDate) => {
  return getActivity().filter(e => e && e.d === isoDate);
};

// Most-recent activity for one skill kind, newest first. `limit` defaults to 5.
export const getRecentByKind = (kind, limit = 5) => {
  return getActivity()
    .filter(e => e && e.t === kind)
    .reverse()
    .slice(0, limit);
};

// Latest single attempt on a specific test (kind + test_id). Returns the most
// recent matching activity entry, or null if there isn't one. Used by skill
// pages to render a "Last: 7/10" badge on test cards.
export const getLatestAttempt = (kind, testId) => {
  const sid = String(testId);
  const all = getActivity().filter(e => e && e.t === kind && String(e.id) === sid);
  return all.length > 0 ? all[all.length - 1] : null;
};

// All attempts on (kind, test_id), oldest first.
export const getAttemptsForTest = (kind, testId) => {
  const sid = String(testId);
  return getActivity().filter(e => e && e.t === kind && String(e.id) === sid);
};

// Best (highest correct/total ratio) and average score across all entries for a kind.
export const getStatsByKind = (kind) => {
  const entries = getActivity().filter(e => e && e.t === kind && e.total > 0);
  if (entries.length === 0) return { best: null, avg: null, attempts: 0 };
  const ratios = entries.map(e => e.correct / e.total);
  const best = Math.max(...ratios);
  const avg = ratios.reduce((s, r) => s + r, 0) / ratios.length;
  return { best, avg, attempts: entries.length };
};

// Friendly label for a kind code (used by the day-detail and history views).
export const KIND_LABELS = {
  listening:  'Listening',
  reading_p1: 'Reading · Passage 1',
  reading_p2: 'Reading · Passage 2',
  reading_p3: 'Reading · Passage 3',
  grammar:    'Grammar',
  writing:    'Writing',
};

export const labelForKind = (kind) => KIND_LABELS[kind] || kind;

export const STORAGE_KEYS = KEYS;
