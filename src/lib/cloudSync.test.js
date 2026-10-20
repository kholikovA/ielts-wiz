// Profile-record contract for cloud ⇄ local sync: whose rows get merged, how
// attempts are matched, and that every attempted test ends up reviewable.

// jest.mock factories may only reference vars whose names start with `mock`.
const mockDb = { rows: [], session: null, nextId: 1 };

// A tiny PostgREST stand-in. Like the real table for an admin, an unscoped
// SELECT returns EVERY user's rows — only an explicit user_id filter narrows it.
jest.mock('../supabaseClient', () => {
  const query = () => {
    const filters = [];
    let order = null;
    let limit = null;
    let range = null;
    let patch = null;
    const run = () => {
      let out = mockDb.rows.filter((r) => filters.every((f) => f(r)));
      if (patch) { out.forEach((r) => Object.assign(r, patch)); return { data: null, error: null }; }
      if (order) out = out.slice().sort((a, b) => (a[order.col] < b[order.col] ? -1 : 1) * (order.asc ? 1 : -1));
      if (range) out = out.slice(range[0], range[1] + 1);
      if (limit != null) out = out.slice(0, limit);
      return { data: out.map((r) => ({ ...r })), error: null };
    };
    const b = {
      select: () => b,
      eq: (c, v) => { filters.push((r) => String(r[c]) === String(v)); return b; },
      is: (c, v) => { filters.push((r) => (r[c] ?? null) === v); return b; },
      not: (c, op, v) => { filters.push((r) => (r[c] ?? null) !== v); return b; },
      order: (col, { ascending }) => { if (!order) order = { col, asc: ascending }; return b; },
      range: (a, z) => { range = [a, z]; return b; },
      limit: (n) => { limit = n; return b; },
      update: (p) => { patch = p; return b; },
      insert: (row) => {
        const dup = row.attempt_id && mockDb.rows.some((r) => r.user_id === row.user_id && r.attempt_id === row.attempt_id);
        if (dup) return Promise.resolve({ error: { code: '23505', message: 'duplicate key' } });
        mockDb.rows.push({ id: mockDb.nextId++, answers: null, attempt_id: null, ...row });
        return Promise.resolve({ error: null });
      },
      then: (res, rej) => Promise.resolve(run()).then(res, rej),
    };
    return b;
  };
  return {
    supabase: {
      auth: { getSession: () => Promise.resolve({ data: { session: mockDb.session } }) },
      from: () => query(),
    },
  };
});

const ME = 'me';
const row = (o) => ({ id: mockDb.nextId++, user_id: ME, answers: null, attempt_id: null, ...o });
const activity = () => JSON.parse(localStorage.getItem('iw.v1.activity') || '[]');
const snapshot = (kind, id) => JSON.parse(localStorage.getItem(`iw.v1.lastSubmission.${kind}.${id}`) || 'null');

let sync;
let store;
beforeEach(() => {
  jest.resetModules();
  localStorage.clear();
  mockDb.rows = []; mockDb.nextId = 1;
  mockDb.session = { user: { id: ME } };
  sync = require('./cloudSync');
  store = require('./progressStore');
});

test("only the signed-in user's rows are merged, even for an admin who can read everyone's", async () => {
  mockDb.rows.push(
    row({ kind: 'listening', test_id: '4', correct: 7, total: 10, completed_at: '2026-10-01T10:00:00Z' }),
    row({ user_id: 'someone-else', kind: 'listening', test_id: '9', correct: 2, total: 10, completed_at: '2026-10-02T10:00:00Z' }),
  );
  await sync.pullAndMerge();
  expect(activity().map((e) => e.id)).toEqual(['4']);
  expect(store.getCompletedIds('listening')).toEqual(['4']);
});

test('every attempted test becomes reviewable from the cloud answer snapshot', async () => {
  mockDb.rows.push(row({
    kind: 'reading_full', test_id: 'cam20_t1', correct: 30, total: 40,
    completed_at: '2026-10-05T09:00:00Z', attempt_id: 'a-1', answers: { 1: 'TRUE', 2: 'C' },
  }));
  expect(store.canReviewTest('reading_full', 'cam20_t1')).toBe(false);
  await sync.pullAndMerge();
  expect(snapshot('reading_full', 'cam20_t1').answers).toEqual({ 1: 'TRUE', 2: 'C' });
  expect(store.canReviewTest('reading_full', 'cam20_t1')).toBe(true);
  expect(store.getLatestAttempt('reading_full', 'cam20_t1')).toMatchObject({ correct: 30, total: 40 });
});

test('a newer cloud attempt replaces an older local snapshot, an older one does not', async () => {
  localStorage.setItem('iw.v1.lastSubmission.listening.3', JSON.stringify({ answers: { 1: 'old' }, ts: '2026-10-01T10:00:00Z' }));
  mockDb.rows.push(row({ kind: 'listening', test_id: '3', correct: 9, total: 10, completed_at: '2026-10-03T10:00:00Z', answers: { 1: 'new' } }));
  await sync.pullAndMerge();
  expect(snapshot('listening', '3').answers).toEqual({ 1: 'new' });

  localStorage.setItem('iw.v1.lastSubmission.listening.3', JSON.stringify({ answers: { 1: 'newest' }, ts: '2026-10-09T10:00:00Z' }));
  await sync.pullAndMerge();
  expect(snapshot('listening', '3').answers).toEqual({ 1: 'newest' });
});

test('two same-score attempts on the same day both survive the merge', async () => {
  localStorage.setItem('iw.v1.activity', JSON.stringify([
    { d: '2026-10-05', t: 'listening', id: '1', correct: 8, total: 10 },
  ]));
  mockDb.rows.push(
    row({ kind: 'listening', test_id: '1', correct: 8, total: 10, completed_at: '2026-10-05T08:00:00Z' }),
    row({ kind: 'listening', test_id: '1', correct: 8, total: 10, completed_at: '2026-10-05T09:00:00Z' }),
  );
  await sync.pullAndMerge();
  expect(activity()).toHaveLength(2);
  await sync.pullAndMerge(); // idempotent
  expect(activity()).toHaveLength(2);
});

test('a local-only attempt (e.g. one the server once rejected) is pushed once, with its answers', async () => {
  localStorage.setItem('iw.v1.activity', JSON.stringify([
    { d: '2026-10-06', t: 'reading_full', id: 'volume9_test2', correct: 25, total: 40 },
  ]));
  localStorage.setItem('iw.v1.lastSubmission.reading_full.volume9_test2', JSON.stringify({ answers: { 5: 'B' }, ts: '2026-10-06T11:00:00Z' }));
  await sync.flushToCloud();
  await sync.flushToCloud(); // second pass must not duplicate
  const mine = mockDb.rows.filter((r) => r.user_id === ME);
  expect(mine).toHaveLength(1);
  expect(mine[0]).toMatchObject({ kind: 'reading_full', test_id: 'volume9_test2', correct: 25, answers: { 5: 'B' } });
  expect(mine[0].attempt_id).toBeTruthy();
  expect(activity()[0].a).toBe(mine[0].attempt_id);
});

test('overlapping reconciles (boot + sign-in) never double-insert', async () => {
  localStorage.setItem('iw.v1.activity', JSON.stringify([
    { d: '2026-10-06', t: 'listening', id: '12', correct: 6, total: 10 },
  ]));
  await Promise.all([sync.reconcile(), sync.reconcile(), sync.flushToCloud()]);
  expect(mockDb.rows.filter((r) => r.test_id === '12')).toHaveLength(1);
});

test("a local answer snapshot is attached to the matching cloud row that was saved without one", async () => {
  mockDb.rows.push(row({ kind: 'listening', test_id: '20', correct: 7, total: 10, completed_at: '2026-10-07T10:00:02Z' }));
  localStorage.setItem('iw.v1.lastSubmission.listening.20', JSON.stringify({ answers: { 1: 'café' }, ts: '2026-10-07T10:00:00Z' }));
  await sync.pullAndMerge();
  expect(mockDb.rows[0].answers).toEqual({ 1: 'café' });
});

test('fetchLastSubmission reports an attempt saved without answers instead of "none"', async () => {
  mockDb.rows.push(row({ kind: 'listening', test_id: '30', correct: 4, total: 10, completed_at: '2026-10-01T10:00:00Z' }));
  mockDb.rows.push(row({ user_id: 'other', kind: 'listening', test_id: '31', correct: 4, total: 10, completed_at: '2026-10-01T10:00:00Z', answers: { 1: 'x' } }));
  expect(await sync.fetchLastSubmission('listening', '30')).toMatchObject({ answers: null, correct: 4, total: 10 });
  expect(await sync.fetchLastSubmission('listening', '31')).toBeNull(); // someone else's
});
