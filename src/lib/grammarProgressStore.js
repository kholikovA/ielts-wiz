// =============================================================================
// grammarProgressStore — versioned localStorage for grammar topic mastery
// and the spaced-repetition queue. Sibling of progressStore.js.
//
// All keys live under `iw.v1.grammar.*`. Renaming is forbidden — future
// schema changes must bump to v2 and migrate.
// =============================================================================

import { logActivity } from './progressStore';

const KEYS = {
  mastery:  'iw.v1.grammar.mastery',     // { [topicId]: { masteredAt:ISO, score, attempts } }
  queue:    'iw.v1.grammar.srq',         // [{ topicId, dueOn:'YYYY-MM-DD', stage:0..4 }]
  diagnostic: 'iw.v1.grammar.diagnostic', // { L1: {...}, L2: {...} }
};

const safeParse = (raw, fb) => { try { return raw ? JSON.parse(raw) : fb; } catch { return fb; } };
const readObj = (k) => safeParse(localStorage.getItem(k), {});
const writeObj = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const readArr = (k) => safeParse(localStorage.getItem(k), []);
const writeArr = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// Spaced-repetition intervals in days, indexed by stage.
const SR_INTERVALS = [1, 3, 7, 21, 60];

const todayKey = () => new Date().toISOString().slice(0, 10);
const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export const getMastery = () => readObj(KEYS.mastery);

export const isMastered = (topicId) => Boolean(getMastery()[topicId]);

export const recordMastery = (topicId, score) => {
  const mastery = getMastery();
  const prev = mastery[topicId] || { attempts: 0 };
  mastery[topicId] = {
    masteredAt: new Date().toISOString(),
    score,
    attempts: (prev.attempts || 0) + 1,
  };
  writeObj(KEYS.mastery, mastery);
  // Schedule first review.
  scheduleReview(topicId, 0);
  // Log activity so it appears on the heatmap.
  logActivity({ t: 'grammar', id: topicId, correct: Math.round(score * 100), total: 100 });
};

// Record an attempt that did not pass — increments the attempts counter so the
// dashboard can show "in progress" without unlocking mastery.
export const recordAttempt = (topicId, score) => {
  const mastery = getMastery();
  const prev = mastery[topicId];
  if (prev && prev.masteredAt) return; // already mastered, do nothing
  mastery[topicId] = {
    ...prev,
    lastAttemptAt: new Date().toISOString(),
    lastScore: score,
    attempts: (prev?.attempts || 0) + 1,
  };
  writeObj(KEYS.mastery, mastery);
};

export const scheduleReview = (topicId, stage = 0) => {
  const queue = readArr(KEYS.queue).filter(q => q.topicId !== topicId);
  const interval = SR_INTERVALS[Math.min(stage, SR_INTERVALS.length - 1)];
  queue.push({ topicId, dueOn: addDays(interval), stage });
  writeArr(KEYS.queue, queue);
};

export const getDueReviews = () => {
  const today = todayKey();
  return readArr(KEYS.queue).filter(q => q.dueOn <= today);
};

// On review pass: advance to next stage. On fail: reset to stage 0.
export const completeReview = (topicId, passed) => {
  const queue = readArr(KEYS.queue);
  const entry = queue.find(q => q.topicId === topicId);
  if (!entry) return;
  const newStage = passed ? Math.min(entry.stage + 1, SR_INTERVALS.length - 1) : 0;
  const others = queue.filter(q => q.topicId !== topicId);
  const interval = SR_INTERVALS[newStage];
  others.push({ topicId, dueOn: addDays(interval), stage: newStage });
  writeArr(KEYS.queue, others);
};

export const getProgress = (level) => {
  const mastery = getMastery();
  const total = level.topics.length;
  const mastered = level.topics.filter(t => mastery[t.id]?.masteredAt).length;
  return { total, mastered, pct: total ? Math.round((mastered / total) * 100) : 0 };
};

export const STORAGE_KEYS = KEYS;
