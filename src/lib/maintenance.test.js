import { isMaintenanceLocked, isBypassed, applyUnlockFromUrl } from './maintenance';

const ENV = process.env;

beforeEach(() => {
  localStorage.clear();
  process.env = { ...ENV };
  window.history.replaceState({}, '', '/');
});
afterAll(() => { process.env = ENV; });

test('site is open when the env flag is unset', () => {
  delete process.env.REACT_APP_MAINTENANCE_MODE;
  expect(isMaintenanceLocked()).toBe(false);
});

test('site is locked when the flag is true and the device is not bypassed', () => {
  process.env.REACT_APP_MAINTENANCE_MODE = 'true';
  expect(isMaintenanceLocked()).toBe(true);
});

test('?unlock with the correct token bypasses the lock and strips the token', () => {
  process.env.REACT_APP_MAINTENANCE_MODE = 'true';
  process.env.REACT_APP_MAINTENANCE_BYPASS_TOKEN = 'secret123';
  window.history.replaceState({}, '', '/?unlock=secret123&foo=bar');
  applyUnlockFromUrl();
  expect(isBypassed()).toBe(true);
  expect(isMaintenanceLocked()).toBe(false);
  expect(window.location.search).toBe('?foo=bar'); // token removed, other params kept
});

test('?unlock with a wrong token does not bypass, but is still stripped', () => {
  process.env.REACT_APP_MAINTENANCE_MODE = 'true';
  process.env.REACT_APP_MAINTENANCE_BYPASS_TOKEN = 'secret123';
  window.history.replaceState({}, '', '/?unlock=nope');
  applyUnlockFromUrl();
  expect(isBypassed()).toBe(false);
  expect(isMaintenanceLocked()).toBe(true);
  expect(window.location.search).toBe('');
});

test('?relock clears a prior bypass on this device', () => {
  localStorage.setItem('iw.v1.maintBypass', '1');
  process.env.REACT_APP_MAINTENANCE_MODE = 'true';
  window.history.replaceState({}, '', '/?relock');
  applyUnlockFromUrl();
  expect(isBypassed()).toBe(false);
  expect(isMaintenanceLocked()).toBe(true);
});
