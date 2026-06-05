// Durability contract for the result outbox. These tests pin the guarantees the
// whole "never lose / never double-count a result" design rests on.

// jest.mock factories may only reference vars whose names start with `mock`.
const mockState = {
  session: null,         // controls supabase.auth.getSession()
  inserts: [],           // every row the client tried to insert
  nextError: () => null, // per-insert error injector: (row) => error|null
};

jest.mock('../supabaseClient', () => ({
  supabase: {
    auth: { getSession: () => Promise.resolve({ data: { session: mockState.session } }) },
    from: () => ({
      insert: (row) => { mockState.inserts.push(row); return Promise.resolve({ error: mockState.nextError(row) }); },
    }),
  },
}));

const OUTBOX_KEY = 'iw.v1.outbox';
const queue = () => JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]');

let enqueue, flush, pendingCount;

beforeEach(() => {
  jest.resetModules();
  localStorage.clear();
  mockState.session = null; mockState.inserts = []; mockState.nextError = () => null;
  ({ enqueue, flush, pendingCount } = require('./syncQueue'));
});

const signIn = () => { mockState.session = { user: { id: 'user-1' } }; };

test('a finished attempt gets a stable attempt_id and is queued', () => {
  const id = enqueue({ kind: 'reading_full', test_id: 'v9t5', correct: 30, total: 40 });
  expect(id).toMatch(/[0-9a-f-]{36}/i);
  expect(queue()).toHaveLength(1);
  expect(queue()[0].attempt_id).toBe(id);
  expect(queue()[0].test_id).toBe('v9t5'); // coerced to string
});

test('force-sign-in-to-save: nothing commits while signed out, nothing is lost', async () => {
  enqueue({ kind: 'reading_full', test_id: 'v9t5', correct: 30, total: 40 });
  const pending = await flush();
  expect(mockState.inserts).toHaveLength(0);   // never attempted without a user
  expect(pending).toBe(1);                      // still safely queued
  expect(pendingCount()).toBe(1);
});

test('signing in drains the queue and stamps the user_id', async () => {
  enqueue({ kind: 'reading_full', test_id: 'v9t5', correct: 30, total: 40 });
  signIn();
  const pending = await flush();
  expect(pending).toBe(0);
  expect(mockState.inserts).toHaveLength(1);
  expect(mockState.inserts[0].user_id).toBe('user-1');
  expect(mockState.inserts[0].correct).toBe(30);
  expect(queue()).toHaveLength(0);             // removed once confirmed
});

test('idempotency: a duplicate (already-saved) row is dropped, never retried forever', async () => {
  signIn();
  mockState.nextError = () => ({ code: '23505', message: 'duplicate key value violates unique constraint' });
  enqueue({ kind: 'reading_full', test_id: 'v9t5', correct: 30, total: 40 });
  const pending = await flush();
  expect(pending).toBe(0);                      // treated as success
  expect(queue()).toHaveLength(0);
});

test('a transient failure keeps the row for the next flush', async () => {
  signIn();
  mockState.nextError = () => ({ code: '503', message: 'service unavailable' });
  enqueue({ kind: 'reading_full', test_id: 'v9t5', correct: 30, total: 40 });
  expect(await flush()).toBe(1);                // kept
  expect(queue()).toHaveLength(1);

  mockState.nextError = () => null;             // network recovers
  expect(await flush()).toBe(0);                // now lands
  expect(queue()).toHaveLength(0);
});

test('a structurally-invalid row is dropped instead of wedging the queue', async () => {
  signIn();
  enqueue({ kind: 'reading_full', test_id: 'bad', correct: 99, total: 40 });
  enqueue({ kind: 'reading_full', test_id: 'good', correct: 10, total: 40 });
  let n = 0; // first row permanently rejected, second succeeds
  mockState.nextError = () => (n++ === 0 ? { code: '23514', message: 'violates check constraint' } : null);
  expect(await flush()).toBe(0);
  expect(queue()).toHaveLength(0);
  expect(mockState.inserts.some((r) => r.test_id === 'good')).toBe(true);
});
