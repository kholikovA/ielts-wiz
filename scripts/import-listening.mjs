#!/usr/bin/env node
/**
 * One-command listening importer.  IELTSX page  →  live test on the site.
 *
 * It does NOT reinvent anything — it drives the four scripts you already have:
 *   1. puppeteer-core   renders the logged-in IELTSX test page + sniffs the audio URL
 *   2. extract_listening.py   page HTML → spec.json  (your tested extractor)
 *   3. host-assets.mjs        audio + map images → your GitHub → rewrites URLs
 *   4. schema.mjs             refuses to ingest anything that won't play/grade
 *   5. ingest.mjs             slug + place JSON + register in manifest.js
 *
 * You stay logged in across runs via a persistent Chrome profile, so auth is a
 * one-time thing.  Anything that fails validation is parked in review/ instead of
 * shipping broken — that's the "almost" in "almost fully automated".
 *
 * Sourcing and rights to the content you point this at are YOUR responsibility.
 *
 * --- Setup (once) ---
 *   pip install beautifulsoup4
 *   export PUPPETEER_EXECUTABLE_PATH="/path/to/Chrome"   # or rely on the mac default
 *   export GITHUB_TOKEN=ghp_xxx                          # only needed for --write hosting
 *   node scripts/import-listening.mjs --login            # log into IELTSX once, in the window that opens
 *
 * --- Calibrate on ONE test (dry run, nothing written) ---
 *   node scripts/import-listening.mjs --url "https://ieltsx.../test/123" --title "Preston Park Run"
 *   # inspect the printed spec path; confirm questions + answer_key + audio_url look right
 *
 * --- Batch (for real) ---
 *   node scripts/import-listening.mjs --urls urls.txt --source iw_practice --start-n 2 \
 *        --repo kholikovA/ielts-assets --base-url https://kholikovA.github.io/ielts-assets --write
 *
 * urls.txt: one per line, optional title + number:
 *   https://ieltsx.../test/123 | Preston Park Run | 2
 *   https://ieltsx.../test/124
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const ROOT = process.cwd();
const PIPE = path.join(ROOT, 'tools/content-pipeline');
const OUT = path.join(PIPE, '.out');      // scratch specs (gitignore this)
const REVIEW = path.join(PIPE, 'review'); // specs that failed validation
const PROFILE = path.join(ROOT, '.ielts-import-profile'); // persistent login (gitignore this)
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// --- Two site-specific knobs. Calibrate these once against a real IELTSX page. ---
// A selector that only exists once the questions have rendered:
const WAIT_SELECTOR = process.env.IELTSX_WAIT_SELECTOR || '.question-part, .question-prompt';
// Optional play-button selector, clicked to make the player request the audio file
// (so we can sniff its URL). Leave empty if the URL is already in the page markup.
const PLAY_SELECTOR = process.env.IELTSX_PLAY_SELECTOR || 'button[aria-label*="play" i], .play, .audio-play';

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t.startsWith('--')) { const k = t.slice(2); const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; a[k] = v; }
  }
  return a;
}
const args = parseArgs(process.argv.slice(2));
const WRITE = !!args.write;

for (const d of [OUT, REVIEW]) fs.mkdirSync(d, { recursive: true });

function launch(headless) {
  return puppeteer.launch({
    executablePath: CHROME,
    headless,
    userDataDir: PROFILE,        // <- this is what keeps you logged in between runs
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });
}

// `--login`: open a real window, let the user sign in, persist the session, exit.
if (args.login) {
  const browser = await launch(false);
  const page = await browser.newPage();
  await page.goto(args.url || 'https://ieltsx.com/', { waitUntil: 'domcontentloaded' });
  console.log('\nLog into IELTSX in the window, open any test to confirm access, then press Enter here…');
  await new Promise((r) => process.stdin.once('data', r));
  await browser.close();
  console.log('Session saved. You can now run imports headless.\n');
  process.exit(0);
}

// Build the work list.
let jobs = [];
if (args.url) jobs = [{ url: args.url, title: args.title || null, n: args.n ? Number(args.n) : null }];
else if (args.urls) {
  jobs = fs.readFileSync(args.urls, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean)
    .filter((l) => !l.startsWith('#'))
    .map((l) => { const [url, title, n] = l.split('|').map((s) => s && s.trim()); return { url, title: title || null, n: n ? Number(n) : null }; });
} else {
  console.error('Provide --url <one> or --urls <file>. First time: --login.');
  process.exit(2);
}

const source = (typeof args.source === 'string' && args.source) || 'iw_practice';
let nextN = args['start-n'] ? Number(args['start-n']) : 1;

const browser = await launch(true);
const results = [];

for (const job of jobs) {
  const n = job.n ?? nextN++;
  const id = `iw_listening_${n}`;
  const title = job.title || `Listening Test ${n}`;
  const specPath = path.join(OUT, `${id}.json`);
  const htmlPath = path.join(OUT, `${id}.html`);
  console.log(`\n▶ ${id}  ${title}\n  ${job.url}`);

  try {
    const page = await browser.newPage();

    // Sniff any audio file the player fetches while the page loads/plays.
    let audioUrl = '';
    page.on('response', (res) => {
      const u = res.url();
      const ct = (res.headers()['content-type'] || '');
      if (!audioUrl && (/\.(mp3|m4a|ogg|wav)(\?|$)/i.test(u) || ct.startsWith('audio/'))) audioUrl = u.split('?')[0] + (u.includes('?') ? '' : '');
    });

    await page.goto(job.url, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector(WAIT_SELECTOR, { timeout: 30000 }).catch(() => {});
    // Make sure the embedded answer key is present before we snapshot.
    await page.waitForFunction(() => /correctAnswers\s*[=:]/.test(document.documentElement.outerHTML) || !!window.correctAnswers, { timeout: 15000 }).catch(() => {});
    // Best-effort: trigger playback so the audio request fires, then settle.
    if (PLAY_SELECTOR) { await page.click(PLAY_SELECTOR).catch(() => {}); await new Promise((r) => setTimeout(r, 1500)); }
    // Fallback: an <audio>/<source> src already in the DOM.
    if (!audioUrl) audioUrl = await page.evaluate(() => {
      const el = document.querySelector('audio[src], audio source[src]');
      return el ? (el.src || el.getAttribute('src') || '') : '';
    }).catch(() => '');

    fs.writeFileSync(htmlPath, await page.content());
    await page.close();

    // 2. HTML → spec (your extractor, untouched)
    execFileSync('python3', [path.join(PIPE, 'extract_listening.py'), htmlPath, specPath, '--title', title], { stdio: 'inherit' });

    // Inject the sniffed audio URL if the extractor left it blank.
    const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
    if (audioUrl && !spec.audio_url) { spec.audio_url = audioUrl; fs.writeFileSync(specPath, JSON.stringify(spec, null, 2)); console.log(`  audio: ${audioUrl}`); }
    if (!spec.audio_url) console.log('  ⚠ no audio URL captured — fill spec.audio_url before this test will play.');

    // 3. Host assets onto your own storage (only with --write + token + repo).
    if (WRITE && process.env.GITHUB_TOKEN && args.repo && args['base-url']) {
      execFileSync('node', [path.join(PIPE, 'host-assets.mjs'), specPath,
        '--repo', String(args.repo), '--dir', `listening/${id}`,
        '--base-url', `${String(args['base-url']).replace(/\/$/, '')}/listening/${id}`, '--write'], { stdio: 'inherit' });
    }

    // 4. Validate — gate. Failures go to review/, never to the manifest.
    try {
      execFileSync('node', [path.join(PIPE, 'schema.mjs'), specPath, 'listening'], { stdio: 'inherit' });
    } catch {
      const parked = path.join(REVIEW, `${id}.json`);
      fs.copyFileSync(specPath, parked);
      results.push({ id, status: 'review', note: `parked at ${path.relative(ROOT, parked)}` });
      continue;
    }

    // 5. Ingest (dry unless --write).
    const ingestArgs = [path.join(PIPE, 'ingest.mjs'), specPath, '--skill', 'listening', '--id', id, '--source', source, '--n', String(n)];
    if (WRITE) ingestArgs.push('--write');
    execFileSync('node', ingestArgs, { stdio: 'inherit' });
    results.push({ id, status: WRITE ? 'ingested' : 'dry-run' });
  } catch (err) {
    results.push({ id, status: 'error', note: String(err.message || err).split('\n')[0] });
    console.error(`  ✗ ${err.message || err}`);
  }
}

await browser.close();

console.log('\n──────── summary ────────');
for (const r of results) console.log(`  ${r.status.padEnd(9)} ${r.id}${r.note ? '  — ' + r.note : ''}`);
const shipped = results.filter((r) => r.status === 'ingested').length;
const review = results.filter((r) => r.status === 'review').length;
if (WRITE) console.log(`\n${shipped} ingested, ${review} need review. Check \`git diff\`, eyeball the new tests, commit.\n`);
else console.log('\nDry run — re-run with --write to host assets, validate, and register in the manifest.\n');
