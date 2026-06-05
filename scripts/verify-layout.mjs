#!/usr/bin/env node
/**
 * Real-browser layout smoke test for the reading player. jsdom unit tests verify
 * the DOM is present but do NO layout, so a height-collapse (panes render but are
 * 0px tall → blank screen) passes them. This loads the production build in headless
 * Chrome and asserts the split container actually has height and the passages and
 * question groups are on screen.
 *
 * Requires a build/ (run `npm run build` first) and Google Chrome.
 * Usage: node scripts/verify-layout.mjs [testId]   (default: volume9_test3)
 * Override Chrome via PUPPETEER_EXECUTABLE_PATH.
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const ROOT = path.join(process.cwd(), 'build');
const TEST_ID = process.argv[2] || 'volume9_test3';
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

if (!fs.existsSync(path.join(ROOT, 'index.html'))) {
  console.error('No build/ found — run `npm run build` first.');
  process.exit(2);
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.map': 'application/json', '.txt': 'text/plain' };

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let fp = path.join(ROOT, url);
  const hasExt = path.extname(url) !== '';
  if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
    if (hasExt) { res.writeHead(404); res.end(); return; } // real asset miss
    fp = path.join(ROOT, 'index.html'); // SPA fallback for navigations
  }
  fs.readFile(fp, (e, d) => {
    if (e) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
    res.end(d);
  });
});

const fail = (msg) => { console.error('✗ ' + msg); process.exitCode = 1; };

await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(`http://localhost:${port}/reading-test/${TEST_ID}`, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForSelector('.split-container', { timeout: 10000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1500));

  const m = await page.evaluate(() => {
    const sc = document.querySelector('.split-container');
    const pp = document.querySelector('.passage-pane');
    const qp = document.querySelector('.questions-pane');
    return {
      splitH: sc ? sc.clientHeight : 0,
      passageH: pp ? pp.clientHeight : 0,
      questionsH: qp ? qp.clientHeight : 0,
      passageSections: document.querySelectorAll('.passage-section').length,
      questionGroups: document.querySelectorAll('.question-group').length,
      passageText: (pp?.textContent || '').trim().length,
    };
  });
  console.log(`layout for ${TEST_ID}:`, JSON.stringify(m));

  if (m.splitH < 200) fail(`split-container height ${m.splitH}px — panes collapsed (blank screen)`);
  if (m.passageH < 200) fail(`passage pane height ${m.passageH}px — collapsed`);
  if (m.passageSections !== 3) fail(`expected 3 passages, found ${m.passageSections}`);
  if (m.questionGroups < 1) fail(`no question groups rendered`);
  if (m.passageText < 100) fail(`passage pane has almost no text (${m.passageText} chars)`);
  if (!process.exitCode) console.log('✓ player renders with real height and content');
} finally {
  await browser.close();
  server.close();
}
