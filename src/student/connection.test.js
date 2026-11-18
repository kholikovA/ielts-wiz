import { isNetworkError, reportError, isOnline, checkConnection, __setOnline } from './connection';

afterEach(() => { __setOnline(true); delete global.fetch; });

test('isNetworkError spots dropped connections, not server errors', () => {
  expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true);
  expect(isNetworkError({ message: 'TypeError: Load failed' })).toBe(true);
  expect(isNetworkError({ message: 'NetworkError when attempting to fetch resource.' })).toBe(true);
  expect(isNetworkError({ message: 'new row violates row-level security policy' })).toBe(false);
  expect(isNetworkError({ message: 'canceling statement due to statement timeout' })).toBe(false);
  expect(isNetworkError(null)).toBe(false);
});

test('a failed request on a dropped connection switches to offline', () => {
  reportError({ message: 'duplicate key' });
  expect(isOnline()).toBe(true);
  reportError(new TypeError('Failed to fetch'));
  expect(isOnline()).toBe(false);
});

test('checkConnection: any answer is online, a thrown fetch is offline', async () => {
  global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
  expect(await checkConnection()).toBe(false);
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401 });
  expect(await checkConnection()).toBe(true);
});
