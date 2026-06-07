import { snapshotAcquisition, readAcquisition, deviceClass } from './marketing';

const setReferrer = (v) => Object.defineProperty(document, 'referrer', { value: v, configurable: true });
const setUA = (v) => Object.defineProperty(navigator, 'userAgent', { value: v, configurable: true });

beforeEach(() => { localStorage.clear(); window.history.replaceState({}, '', '/'); });

test('captures referrer, UTM params and landing path', () => {
  setReferrer('https://t.co/abc');
  window.history.replaceState({}, '', '/reading?utm_source=twitter&utm_medium=social&foo=bar');
  snapshotAcquisition();
  const a = readAcquisition();
  expect(a.referrer).toBe('https://t.co/abc');
  expect(a.utm).toEqual({ utm_source: 'twitter', utm_medium: 'social' }); // non-utm params dropped
  expect(a.landingPath).toBe('/reading');
});

test('first touch wins — a later visit never overwrites the snapshot', () => {
  setReferrer('https://t.co/abc');
  window.history.replaceState({}, '', '/?utm_source=twitter');
  snapshotAcquisition();
  setReferrer('');
  window.history.replaceState({}, '', '/dashboard?utm_source=google');
  snapshotAcquisition();
  expect(readAcquisition().utm).toEqual({ utm_source: 'twitter' });
  expect(readAcquisition().landingPath).toBe('/');
});

test('no UTM params → utm is null', () => {
  setReferrer('');
  snapshotAcquisition();
  expect(readAcquisition().utm).toBeNull();
});

test('deviceClass distinguishes mobile from desktop', () => {
  setUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
  expect(deviceClass()).toBe('mobile');
  setUA('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
  expect(deviceClass()).toBe('desktop');
});
