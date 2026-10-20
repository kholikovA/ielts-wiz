#!/usr/bin/env node
/**
 * Browser smoke test for the built Part-practice pages. Fills every question
 * through the real UI (radio labels, checkboxes, drag-drop click-to-place,
 * two-box gaps, typed gaps), submits, and expects 10/10.
 *
 *   python3 -m http.server 5077 --directory public &
 *   npx -y -p playwright node tools/listening-part-practice/smoke.mjs [ids]
 *
 * MODE=blank expects 0/10 · SWAP=1 swaps either-order answers · REVIEW=1 also
 * replays the submission via ?review=1 · CHROME=<path> picks a browser binary ·
 * BASE=<url> overrides http://localhost:5077.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
const ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
const BASE = process.env.BASE || 'http://localhost:5077';
const tpl = fs.readFileSync(`${ROOT}/tools/listening-part-practice/template.html`, 'utf8');
const grab = (name) => { const i = tpl.indexOf(`function ${name}(`); let d = 0, j = tpl.indexOf('{', i);
  for (; j < tpl.length; j++) { if (tpl[j] === '{') d++; else if (tpl[j] === '}' && --d === 0) break; } return tpl.slice(i, j + 1); };
const { expandAnswerKey } = new Function(`${grab('normalizeAnswer')}\n${grab('expandAnswerKey')}\nreturn { expandAnswerKey };`)();
const ids = process.argv.slice(2).length ? process.argv.slice(2).map(Number) : Array.from({ length: 80 }, (_, i) => i + 1);
const mode = process.env.MODE || 'correct'; // correct | blank
const SEED = () => localStorage.setItem('sb-test-auth-token', JSON.stringify({ access_token: 'x', expires_at: Math.floor(Date.now() / 1000) + 3600 }));
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
let bad = 0;
for (const id of ids) { try { await runOne(id); } catch (e) { bad++; console.log(`T${id}: EXC ${String(e).split('\n')[0]}`); } }
async function runOne(id) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.addInitScript(SEED);
  await page.route((u) => !u.href.startsWith(BASE), (r) => r.abort());
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/mp3|audio|Failed to load resource/i.test(m.text())) errs.push(m.text()); });
  await page.goto(`${BASE}/tests/test_${id}.html`, { waitUntil: 'domcontentloaded' });
  const html = fs.readFileSync(`${ROOT}/public/tests/test_${id}.html`, 'utf8');
  const key = JSON.parse(html.match(/<script id="answerKey"[^>]*>([\s\S]*?)<\/script>/)[1]);
  const either = JSON.parse(html.match(/<script id="eitherOrder"[^>]*>([\s\S]*?)<\/script>/)[1] || '[]');
  const forced = {};
  for (const g of either) g.q.forEach((q, i) => { forced[q] = process.env.SWAP ? g.targets[g.targets.length - 1 - i] : g.targets[i]; });
  const done = new Set();
  if (mode === 'correct') for (const [qs, v] of Object.entries(key)) {
    const q = +qs; if (done.has(q)) continue;
    const kind = await page.evaluate((q) => {
      if (document.querySelector(`input[type=checkbox][data-qnum="${q}"]`)) return 'multi';
      if (document.querySelector(`input[type=radio][name="q${q}"]`)) return 'radio';
      if (document.querySelector(`.dd-slot[data-qnum="${q}"]`)) return 'dd';
      if (document.querySelector(`.gap-sub[data-qnum="${q}"]`)) return 'joined';
      if (document.querySelector(`.gap-input[data-qnum="${q}"]`)) return 'text';
      return 'none';
    }, q);
    if (kind === 'multi') {
      const qn = await page.$eval(`input[type=checkbox][data-qnum="${q}"]`, (e) => JSON.parse(e.dataset.qnums));
      qn.forEach((x) => done.add(x));
      for (const L of v) await page.locator(`input[type=checkbox][data-qnum="${q}"][value="${L}"]`).locator('xpath=ancestor::label[1]').click();
    } else if (kind === 'radio') {
      await page.locator(`input[type=radio][name="q${q}"][value="${v}"]`).locator('xpath=ancestor::label[1]').click();
    } else if (kind === 'dd') {
      const grp = await page.$(`.dd-group:has(.dd-slot[data-qnum="${q}"])`);
      await (await grp.$(`.dd-chip[data-letter="${v}"]:not([data-from])`)).click();
      await page.click(`.dd-slot[data-qnum="${q}"]`);
    } else if (kind === 'joined') {
      const joiner = await page.$eval(`.joined-input[data-qnum="${q}"]`, (e) => e.dataset.joiner);
      const ans = expandAnswerKey(v)[0];
      const parts = ans.split(joiner.trim()).map((s) => s.trim());
      const subs = await page.$$(`.gap-sub[data-qnum="${q}"]`);
      for (let i = 0; i < subs.length; i++) { await subs[i].scrollIntoViewIfNeeded(); await subs[i].fill(parts[i] || ''); }
    } else if (kind === 'text') {
      const ans = expandAnswerKey(forced[q] || v)[0];
      const el = await page.$(`.gap-input[data-qnum="${q}"]`);
      await el.scrollIntoViewIfNeeded(); await el.fill(ans);
    } else errs.push(`Q${q}: no control`);
  }
  await page.click('#submitBtn'); await page.click('#confirmSubmit');
  await page.waitForSelector('#resultsStats .stat-value', { timeout: 5000 });
  let score = await page.$eval('#resultsStats .stat-value', (e) => e.textContent.trim());
  // transcript review: opens, marks all ten answer locations, one row per question
  await page.click('#rvOpenBtn');
  const rv = await page.evaluate(() => ({
    open: !!document.querySelector('.rv-root.open'),
    marks: [...new Set([...document.querySelectorAll('.ev-span')].map((e) => +e.dataset.q))].length,
    rows: [...document.querySelectorAll('.rv-q-num')].length,
    badges: document.querySelectorAll('.ev-badge.correct').length,
  }));
  if (!rv.open || rv.marks !== 10) errs.push(`review: open=${rv.open} marks=${rv.marks}`);
  if (mode === 'correct' && rv.badges !== 10) errs.push(`review: ${rv.badges}/10 green badges`);
  await page.click('#rvBack');
  // the submit recorded one attempt: activity entry, answer snapshot and an
  // outbox row (the cloud POST is blocked here), all with the same attempt_id
  const rec = () => page.evaluate((id) => {
    const j = (k) => JSON.parse(localStorage.getItem(k) || 'null');
    return { act: j('iw.v1.activity') || [], box: j('iw.v1.outbox') || [], snap: j(`iw.v1.lastSubmission.listening.${id}`) };
  }, id);
  const r1 = await rec();
  const a1 = r1.act[r1.act.length - 1];
  if (r1.act.length !== 1 || r1.box.length !== 1 || !r1.snap || !a1.a
      || a1.a !== r1.box[0].attempt_id || a1.a !== r1.snap.a || r1.box[0].correct !== a1.correct
      || JSON.stringify(r1.box[0].answers) !== JSON.stringify(r1.snap.answers)
      || (mode === 'correct' && !Object.keys(r1.snap.answers).length)) {
    errs.push(`record: act=${r1.act.length} outbox=${r1.box.length} snap=${!!r1.snap}`);
  }
  if (process.env.REVIEW) {
    await page.goto(`${BASE}/tests/test_${id}.html?review=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => { const e = document.querySelector('#resultsStats .stat-value'); return e && e.offsetParent; }, null, { timeout: 8000 });
    score = await page.$eval('#resultsStats .stat-value', (e) => e.textContent.trim());
    const subs = await page.$$eval('.gap-sub', (els) => els.filter((e) => !e.value).length);
    const slots = await page.$$eval('.dd-slot', (els) => els.filter((e) => !e.querySelector('.dd-chip')).length);
    if (mode === 'correct' && (subs || slots)) errs.push(`review: ${subs} empty two-box inputs, ${slots} empty slots`);
    const r2 = await rec();
    if (r2.act.length !== 1 || r2.box.length !== 1) errs.push(`review re-recorded: act=${r2.act.length} outbox=${r2.box.length}`);
  }
  const expect = mode === 'correct' ? '10 / 10' : '0 / 10';
  const ok = score === expect && !errs.length;
  if (!ok) bad++;
  console.log(`T${id}: ${score}${ok ? '' : '  <-- ' + errs.join(' ; ')}`);
  if (!ok && mode === 'correct') {
    const wrong = await page.$$eval('#resultsList .result-row, #resultsList > *', (els) => els.map((e) => e.innerText.replace(/\s+/g, ' ')).filter((t) => !/✓/.test(t)).slice(0, 6));
    console.log('    ', wrong.join('\n     '));
  }
  await page.close();
}
await browser.close();
console.log(bad ? `${bad} failing` : 'all ok');
