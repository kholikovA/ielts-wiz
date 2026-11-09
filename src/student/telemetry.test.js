import { deviceType, clickLabel, start, stop, track, tick, flush } from './telemetry';
import { supabase } from '../supabaseClient';

jest.mock('../supabaseClient', () => ({
  supabase: {
    rpc: jest.fn(),
    auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
  },
}));

test('deviceType', () => {
  expect(deviceType(1280, 'Mozilla/5.0 (Macintosh)')).toBe('desktop');
  expect(deviceType(390, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)')).toBe('mobile');
  expect(deviceType(820, 'Mozilla/5.0 (iPad; CPU OS 17_0)')).toBe('tablet');
  expect(deviceType(800, 'Mozilla/5.0 (Linux; Android 14; SM-X200)')).toBe('tablet');
});

test('clickLabel prefers aria-label, trims text, skips opted-out areas', () => {
  document.body.innerHTML = `
    <button id="a" aria-label="Close dialog">x</button>
    <button id="b">  Start   test  </button>
    <div data-no-track><button id="c">Secret</button></div>`;
  expect(clickLabel(document.getElementById('a'))).toBe('Close dialog');
  expect(clickLabel(document.getElementById('b'))).toBe('Start test');
  expect(clickLabel(document.getElementById('c'))).toBeNull();
});

test('nothing is recorded or sent while off; events flush once on', async () => {
  const { rpc } = supabase;
  rpc.mockResolvedValue({ data: 1, error: null });
  track('click', { label: 'x' });
  await flush();
  expect(rpc).not.toHaveBeenCalled();

  start();
  tick(1, true); // starts a session
  track('click', { label: 'Start test' });
  await flush();
  const sent = rpc.mock.calls.find((c) => c[0] === 'log_hub_events')[1].p_events.map((e) => e.name);
  expect(sent).toEqual(['session_start', 'click']);
  stop();
});
