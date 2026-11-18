// jsdom here lacks TextEncoder/TextDecoder (every browser has them).
const util = require('util');

global.TextEncoder = global.TextEncoder || util.TextEncoder;
global.TextDecoder = global.TextDecoder || util.TextDecoder;
jest.mock('../supabaseClient', () => ({ supabase: {} }));
// eslint-disable-next-line global-require
const { takeTelegramResult } = require('./telegramLogin');

const encode = (obj) => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(obj))))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

test('reads and clears a Telegram result from the hash (unicode names too)', () => {
  const payload = { id: 42, first_name: 'Hurshidbek ✨', auth_date: 1, hash: 'abc' };
  window.history.replaceState({}, '', `/profile?x=1#tgAuthResult=${encode(payload)}`);
  expect(takeTelegramResult()).toEqual(payload);
  expect(window.location.hash).toBe('');
  expect(window.location.search).toBe('?x=1');
});

test('cancelled login gives null, unrelated pages give undefined', () => {
  window.history.replaceState({}, '', '/profile#tgAuthResult=false');
  expect(takeTelegramResult()).toBeNull();
  window.history.replaceState({}, '', '/profile');
  expect(takeTelegramResult()).toBeUndefined();
});
