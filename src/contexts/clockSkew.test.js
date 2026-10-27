import { clockSkewOf } from './AuthContext';

const token = (claims) => `h.${btoa(JSON.stringify(claims)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')}.s`;

test('clock ahead of the server', () => {
  const iat = 1_800_000_000;
  expect(clockSkewOf({ access_token: token({ iat }) }, (iat + 7200) * 1000)).toBe(7200);
});
test('clock behind the server', () => {
  const iat = 1_800_000_000;
  expect(clockSkewOf({ access_token: token({ iat }) }, (iat - 3600) * 1000)).toBe(-3600);
});
test('bad token is treated as no skew', () => {
  expect(clockSkewOf({ access_token: 'nope' })).toBe(0);
  expect(clockSkewOf(null)).toBe(0);
});
