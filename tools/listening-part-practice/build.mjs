#!/usr/bin/env node
/**
 * Builds the 80 Listening Part-practice pages (public/tests/test_N.html) from
 * the authored content in ./content/part{1..4}.mjs, using ./template.html
 * (the live page shell, so grading / review / result-image fixes are kept).
 *
 *   node tools/listening-part-practice/build.mjs            # build all 80
 *   node tools/listening-part-practice/build.mjs 24 31      # build some
 *
 * Content is transcribed from "80 IELTS Listening Tests" (Proper English
 * School). Every group is rendered in the computer-delivered (CDI) format:
 *   form / notes / table / sentences / short / summary / flow  -> typed gaps
 *   imggaps  -> typed gaps placed on the map / diagram itself
 *   mcq      -> radio buttons, multi -> checkboxes ("Choose TWO letters")
 *   match    -> drag-and-drop from an option box (each option used once)
 *   grid     -> radio grid: map/plan letters, or A/B/C classification
 * The build refuses to write a page that fails the structural checks.
 *
 * Gap tokens inside any markup:  {{7}} typed gap · {{d7}} drag-drop slot.
 * The same {{n}} twice in one group = one question with two boxes
 * ("between … and …"), joined with group.join[n] for grading.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const OUT_DIR = path.join(ROOT, 'public/tests');
const AUDIO = (n) => `https://raw.githubusercontent.com/kholikovA/80-listening-audios/main/TEST%20${n}.mp3`;
const HOME = 'https://ielts-wiz.com/listening/80-tests';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const PDF_ANSWERS = JSON.parse(fs.readFileSync(path.join(HERE, 'pdf-answers.json'), 'utf8'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const plain = (html) => String(html).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const optMap = (texts) => Object.fromEntries(texts.map((t, i) => [LETTERS[i], plain(t)]));
const jsonAttr = (o) => attr(JSON.stringify(o));

function letterRange(spec) {
  const [a, b] = spec.split('-');
  return LETTERS.slice(LETTERS.indexOf(a), LETTERS.indexOf(b) + 1).split('');
}

// ---------------------------------------------------------------- gaps
function gapInput(n, extra = '') {
  return `<span class="gap-wrap"><input type="text" class="gap-input${extra}" data-qnum="${n}" autocomplete="off" spellcheck="false"><span class="gap-num-placeholder">${n}</span></span>`;
}
function ddSlot(n, inline) {
  return `<span class="dd-slot${inline ? ' inline' : ''}" data-qnum="${n}" data-jump="${n}" tabindex="0" role="button" aria-label="Answer ${n}"></span>`
    + `<input type="text" class="gap-input dd-input" data-qnum="${n}" hidden>`;
}
/** Replace {{n}} / {{dn}} tokens. Repeated typed numbers become two-box gaps. */
function fillGaps(html, ctx) {
  const counts = {};
  for (const m of html.matchAll(/\{\{(\d+)\}\}/g)) counts[m[1]] = (counts[m[1]] || 0) + 1;
  const seen = {};
  return html
    .replace(/\{\{d(\d+)\}\}/g, (_, n) => { ctx.control(+n, 'dd'); return ddSlot(n, true); })
    .replace(/\{\{(\d+)\}\}/g, (_, n) => {
      if (counts[n] === 1) { ctx.control(+n, 'gap'); return gapInput(n); }
      const joiner = ctx.group.join && ctx.group.join[n];
      if (!joiner) throw new Error(`Q${n}: two boxes but no group.join[${n}]`);
      seen[n] = (seen[n] || 0) + 1;
      const sub = `<input type="text" class="gap-sub" data-qnum="${n}"${seen[n] === 1 ? ` data-jump="${n}"` : ''} autocomplete="off" spellcheck="false" placeholder="${n}" aria-label="Question ${n}, box ${seen[n]}">`;
      if (seen[n] === counts[n]) {
        ctx.control(+n, 'joined');
        return sub + `<input type="text" class="gap-input joined-input" data-qnum="${n}" data-joiner="${attr(joiner)}" hidden>`;
      }
      return sub;
    });
}

// ---------------------------------------------------------------- groups
function header(nums) {
  const s = [...nums].sort((a, b) => a - b);
  return s.length > 1 ? `Questions ${s[0]}–${s[s.length - 1]}` : `Question ${s[0]}`;
}
const resultHosts = (nums) => `<div class="result-hosts">${nums.map((n) => `<div class="result-host" data-qnum="${n}"></div>`).join('')}</div>`;

function radioList(n, texts, { exampleAnswer } = {}) {
  return `<ul class="options-list">${texts.map((t, i) => {
    const L = LETTERS[i];
    if (exampleAnswer !== undefined) {
      return `<li><span class="radio-circle${L === exampleAnswer ? ' on' : ''}"></span><span>${t}</span></li>`;
    }
    return `<li><label style="display:flex;gap:10px;align-items:flex-start;cursor:pointer;width:100%"><input type="radio" name="q${n}" value="${L}" data-qnum="${n}"><span class="radio-circle"></span><span>${t}</span></label></li>`;
  }).join('')}</ul>`;
}

function renderGroup(g, ctx) {
  ctx.group = g;
  const nums = [];
  const control = ctx.control;
  ctx.control = (n, kind) => { nums.push(n); control(n, kind); };
  let body = '';
  const title = g.title ? `<div class="completion-title">${g.title}</div>` : '';
  const subtitle = g.subtitle ? `<div class="completion-subtitle">${g.subtitle}</div>` : '';

  switch (g.t) {
    case 'form': {
      let exHeader = false;
      body += title + subtitle + '<div class="form-table">';
      for (const r of g.rows) {
        if (!Array.isArray(r) && r.h) { body += `<div class="form-section-heading">${r.h}</div>`; continue; }
        const [label, val] = r;
        const lab = !label ? '' : /[?:]$/.test(label) ? label : `${label}:`;
        if (val && typeof val === 'object' && 'ex' in val) {
          if (!exHeader) { body += '<div class="form-example-header">Example</div>'; exHeader = true; }
          body += `<div class="form-row-label">${lab}</div><div class="form-row-value"><span class="form-example-answer">${val.ex}</span></div>`;
          continue;
        }
        const qs = [...String(val).matchAll(/\{\{d?(\d+)\}\}/g)].map((m) => +m[1]);
        const inner = fillGaps(String(val), ctx);
        body += `<div class="form-row-label">${lab}</div>`;
        body += qs.length
          ? `<div class="form-row-value question" data-qnum="${qs[0]}"><span>${inner}</span></div>`
          : `<div class="form-row-value"><span>${inner}</span></div>`;
      }
      body += '</div>';
      break;
    }
    case 'notes': {
      body += title + subtitle;
      for (const sec of g.sections) {
        body += '<div class="note-section">';
        if (sec.h) body += `<div class="note-section-heading">${sec.h}</div>`;
        body += '<ul class="note-list">';
        for (const it of sec.items) {
          if (typeof it === 'object' && it.exHtml) {
            body += `<li class="no-bullet"><strong style="font-weight:600;color:var(--text-muted);text-transform:uppercase;font-size:12px;letter-spacing:0.4px;margin-right:6px">Example</strong>${it.exHtml}</li>`;
            continue;
          }
          if (typeof it === 'object' && 'ex' in it) {
            body += `<li><strong style="font-weight:600;color:var(--text-muted);text-transform:uppercase;font-size:12px;letter-spacing:0.4px;margin-right:6px">Example</strong>${it.html || ''} <span class="note-example">${it.ex}</span></li>`;
            continue;
          }
          const html = typeof it === 'object' ? it.html : it;
          const qs = [...html.matchAll(/\{\{d?(\d+)\}\}/g)].map((m) => +m[1]);
          const inner = fillGaps(html, ctx);
          const style = typeof it === 'object' && it.indent ? ` style="padding-left:${6 + 22 * it.indent}px"` : '';
          const nb = typeof it === 'object' && it.plain ? ' no-bullet' : '';
          body += qs.length ? `<li class="question${nb}" data-qnum="${qs[0]}"${style}>${inner}</li>` : `<li class="${nb.trim()}"${style}>${inner}</li>`;
        }
        body += '</ul></div>';
      }
      break;
    }
    case 'sentences': {
      body += title;
      for (const s of g.items) {
        const n = +s.match(/\{\{(\d+)\}\}/)[1];
        body += `<div class="question" data-qnum="${n}"><div class="question-prompt"><span class="question-number">${n}</span><span>${fillGaps(s, ctx)}</span></div></div>`;
      }
      break;
    }
    case 'short': {
      body += title + '<ul class="short-answer-list">';
      for (const s of g.items) {
        const n = +s.match(/\{\{(\d+)\}\}/)[1];
        body += `<li class="question" data-qnum="${n}"><span class="sa-num">${n}</span><span class="sa-content">${fillGaps(s, ctx)}</span></li>`;
      }
      body += '</ul>';
      break;
    }
    case 'table': {
      const cell = (c, tag) => {
        const o = typeof c === 'object' && c !== null ? c : { html: c };
        const span = (o.colspan ? ` colspan="${o.colspan}"` : '') + (o.rowspan ? ` rowspan="${o.rowspan}"` : '');
        const st = tag === 'th'
          ? 'border:1px solid var(--border-strong);padding:8px 10px;background:var(--table-header-bg);text-align:left;vertical-align:top'
          : 'border:1px solid var(--border-strong);padding:8px 10px;vertical-align:top;line-height:1.9';
        return `<${tag}${span} style="${st}">${fillGaps(String(o.html), ctx)}</${tag}>`;
      };
      body += title;
      body += `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-family:var(--serif);font-size:var(--fs-content)">`;
      if (g.head) body += `<thead><tr>${g.head.map((h) => cell(h, 'th')).join('')}</tr></thead>`;
      body += `<tbody>${g.rows.map((r) => {
        const cells = Array.isArray(r) ? r : r.cells;
        return `<tr>${cells.map((c) => cell(c, !Array.isArray(r) && r.th ? 'th' : 'td')).join('')}</tr>`;
      }).join('')}</tbody></table></div>`;
      break;
    }
    case 'summary': {
      body += `<div class="summary-box">${g.title ? `<div class="completion-title" style="margin-top:0">${g.title}</div>` : ''}${g.paras.map((p) => `<p>${fillGaps(p, ctx)}</p>`).join('')}</div>`;
      body += resultHosts([...g.paras.join(' ').matchAll(/\{\{(\d+)\}\}/g)].map((m) => +m[1]).filter((v, i, a) => a.indexOf(v) === i));
      break;
    }
    case 'flow': {
      body += title;
      const flow = g.boxes.map((b) => {
        const qs = [...b.matchAll(/\{\{d?(\d+)\}\}/g)].map((m) => +m[1]);
        const inner = fillGaps(b, ctx);
        if (!qs.length) return `<div class="fc-box">${inner}</div>`;
        const opts = g.bank ? ` data-options='${jsonAttr(optMap(g.bank))}'` : '';
        return `<div class="fc-box question" data-qnum="${qs[0]}"${opts}>${inner}</div>`;
      }).join('<div class="fc-arrow" aria-hidden="true"></div>');
      const flowHtml = `<div class="flow">${flow}</div>`;
      if (g.bank) {
        body += `<div class="dd-group"${g.reuse ? ' data-reuse="1"' : ''}><div class="dd-layout bank-top">${bankBox(g)}${flowHtml}</div></div>`;
      } else body += flowHtml;
      break;
    }
    case 'imggaps': {
      body += title + `<div class="figure-wrap"><div class="figure-box"><div class="img-gaps"><img src="${g.image}" alt="${attr(g.alt)}" width="${g.w}" height="${g.h}" draggable="false">`;
      for (const p of g.gaps) {
        ctx.control(p.n, 'gap');
        body += `<span class="ov-gap" style="left:${p.x}%;top:${p.y}%;width:${p.w}%">${gapInput(p.n).replace('class="gap-wrap"', 'class="gap-wrap" style="display:block;margin:0"')}</span>`;
      }
      body += '</div></div></div>' + resultHosts(g.gaps.map((p) => p.n));
      break;
    }
    case 'mcq': {
      body += title;
      if (g.example) {
        body += `<div class="q-example"><div class="q-example-label">Example</div><div class="question-prompt"><span>${g.example.q}</span></div>${radioList(0, g.example.o, { exampleAnswer: g.example.a })}</div>`;
      }
      for (const it of g.items) {
        ctx.control(it.n, 'radio');
        if (it.o.length < 2) throw new Error(`Q${it.n}: needs options`);
        const om = it.optText ? Object.fromEntries(it.optText.map((t, i) => [LETTERS[i], t])) : optMap(it.o);
        body += `<div class="question" data-qnum="${it.n}" data-options='${jsonAttr(om)}'><div class="question-prompt"><span class="question-number">${it.n}</span><span>${it.q}</span></div>${it.pre || ''}${radioList(it.n, it.o)}</div>`;
      }
      break;
    }
    case 'multi': {
      const ns = g.n;
      ns.forEach((n) => ctx.control(n, 'multi'));
      const primary = ns[0];
      const om = jsonAttr(optMap(g.o));
      const group = `mc${primary}`;
      body += title + `<div class="question" data-qnum="${primary}" data-options='${om}'><div class="question-prompt"><span class="question-number">${ns[0]}–${ns[ns.length - 1]}</span><span>${g.q}</span></div><ul class="options-list">${g.o.map((t, i) => `<li><label style="display:flex;gap:10px;align-items:flex-start;cursor:pointer;width:100%"><input type="checkbox" data-group="${group}" data-qnums='${JSON.stringify(ns)}' data-qnum="${primary}" value="${LETTERS[i]}"><span class="check-square"></span><span>${t}</span></label></li>`).join('')}</ul></div>`;
      body += ns.slice(1).map((n) => `<div class="question hidden" data-qnum="${n}" data-options='${om}'></div>`).join('');
      break;
    }
    case 'match': {
      const om = jsonAttr(optMap(g.bank));
      const fig = g.image ? `<div class="figure-wrap"><div class="figure-box"><img src="${g.image}" alt="${attr(g.alt)}" width="${g.w}" height="${g.h}" draggable="false"></div></div>` : '';
      const rows = g.items.map((it) => {
        ctx.control(it.n, 'dd');
        return `<div class="dd-row question" data-qnum="${it.n}" data-options='${om}'><span class="dd-prompt"><span class="dd-prompt-num">${it.n}</span>&nbsp;&nbsp;${it.html}</span>${ddSlot(it.n, false)}</div>`;
      }).join('');
      const itemsTitle = g.itemsTitle ? `<div class="completion-subtitle" style="text-align:left;margin-bottom:8px">${g.itemsTitle}</div>` : '';
      body += title + fig + `<div class="dd-group"${g.reuse ? ' data-reuse="1"' : ''}><div class="dd-layout"><div class="dd-items">${itemsTitle}${rows}</div>${bankBox(g)}</div></div>`;
      break;
    }
    case 'grid': {
      const letters = letterRange(g.letters);
      const fig = g.image ? `<div class="figure-wrap"><div class="figure-box"><img src="${g.image}" alt="${attr(g.alt)}" width="${g.w}" height="${g.h}" draggable="false"></div></div>` : '';
      const legend = g.legend
        ? `<div class="opt-box" style="margin:0 0 14px">${g.legendTitle ? `<div class="opt-box-title">${g.legendTitle}</div>` : ''}<ul class="legend-list">${g.legend.map((t, i) => `<li><span class="lg-letter">${letters[i]}</span><span>${t}</span></li>`).join('')}</ul></div>`
        : '';
      if (g.legend && g.legend.length !== letters.length) throw new Error(`grid legend/letters mismatch`);
      const om = g.legend ? ` data-options='${jsonAttr(optMap(g.legend))}'` : '';
      const head = `<div class="matrix-head"><div style="text-align:left;padding-left:12px">${g.itemsTitle || ''}</div>${letters.map((l) => `<div>${l}</div>`).join('')}</div>`;
      const rows = g.items.map((it) => {
        ctx.control(it.n, 'radio');
        return `<div class="matrix-row question" data-qnum="${it.n}"${om}><div class="m-label"><span class="question-number">${it.n}</span><span>${it.html}</span></div>${letters.map((l) => `<label aria-label="Question ${it.n}: ${l}"><input type="radio" name="q${it.n}" value="${l}" data-qnum="${it.n}"><span class="radio-circle"></span></label>`).join('')}</div>`;
      }).join('');
      body += title + fig + legend + `<div class="matrix-wrap"><div class="matrix options-list" style="--cols:${letters.length}">${head}${rows}</div></div>`;
      break;
    }
    default:
      throw new Error(`unknown group type ${g.t}`);
  }
  ctx.control = control;
  if (!nums.length) throw new Error(`group ${g.t} has no questions`);
  // `cont`: same numbered block as the previous group (the book runs e.g. a
  // form, a table and notes under one "Questions 21–30" heading).
  if (g.cont) return { html: `<div class="question-group question-group--cont" data-type="${g.t}" style="margin-top:-18px">${body}</div>`, nums };
  return { html: `<div class="question-group" data-type="${g.t}"><div class="question-group-header">${header(g.headerNums || nums)}</div><div class="question-group-instructions">${g.instr}</div>${body}</div>`, nums };
}

function bankBox(g) {
  return `<div class="opt-box dd-bank-box">${g.bankTitle ? `<div class="opt-box-title">${g.bankTitle}</div>` : ''}<div class="dd-bank">${g.bank.map((t, i) => `<span class="dd-chip" data-letter="${LETTERS[i]}" tabindex="0" role="button"><span class="dd-letter">${LETTERS[i]}</span><span>${t}</span></span>`).join('')}</div></div>`;
}

// ---------------------------------------------------------------- test
export function buildTest(test) {
  const part = Math.ceil(test.id / 20);
  const lo = (part - 1) * 10 + 1;
  const expected = Array.from({ length: 10 }, (_, i) => lo + i);
  const controls = {};
  const kinds = {};
  const ctx = { control: (n, kind) => { controls[n] = (controls[n] || 0) + 1; kinds[n] = kind; } };
  const groups = test.groups.map((g) => renderGroup(g, ctx));
  const errors = [];

  // ---- structural checks
  const got = Object.keys(controls).map(Number).sort((a, b) => a - b);
  if (JSON.stringify(got) !== JSON.stringify(expected)) errors.push(`questions ${got.join(',')} != ${lo}–${lo + 9}`);
  for (const [n, c] of Object.entries(controls)) if (c !== 1) errors.push(`Q${n} has ${c} controls`);
  // Answers come from the book's key (pdf-answers.json); test.fix overrides a
  // question only where the printed key is not usable as-is by the grader.
  const key = {};
  const either = [...(test.either || [])];
  const pdf = PDF_ANSWERS[test.id] || {};
  for (const n of expected) {
    let k = test.fix && n in test.fix ? test.fix[n] : pdf[n];
    if (k && typeof k === 'object' && !Array.isArray(k)) {
      if (k.vals.every((v) => /^[A-Z]$/.test(v))) k = [...k.vals].sort();
      else {
        if (n === k.group[0]) either.push({ q: k.group, targets: k.vals });
        k = k.vals.join(' / ');
      }
    }
    if (k == null || k === '') { errors.push(`Q${n} missing answer`); continue; }
    if (kinds[n] === 'multi' && !Array.isArray(k)) errors.push(`Q${n} multi needs letter list`);
    if (kinds[n] !== 'multi' && Array.isArray(k)) errors.push(`Q${n} single answer expected`);
    key[n] = k;
  }
  test._either = either;
  // answers must be legal for their control
  for (const g of test.groups) {
    if (g.t === 'mcq') for (const it of g.items) if (!LETTERS.slice(0, it.o.length).includes(key[it.n])) errors.push(`Q${it.n} answer ${key[it.n]} not an option`);
    if (g.t === 'multi') {
      const a = key[g.n[0]];
      if (!Array.isArray(a) || a.length !== g.n.length) errors.push(`Q${g.n[0]} multi answer must list ${g.n.length} letters`);
      for (const n of g.n) if (JSON.stringify(key[n]) !== JSON.stringify(a)) errors.push(`Q${n} multi answers differ within group`);
      if (Array.isArray(a)) for (const l of a) if (!LETTERS.slice(0, g.o.length).includes(l)) errors.push(`Q${g.n[0]} letter ${l} not an option`);
    }
    if (g.t === 'match' || (g.t === 'flow' && g.bank)) {
      const ns = g.t === 'match' ? g.items.map((i) => i.n) : g.boxes.join(' ').match(/\{\{d(\d+)\}\}/g).map((m) => +m.match(/\d+/)[0]);
      for (const n of ns) if (!LETTERS.slice(0, g.bank.length).includes(key[n])) errors.push(`Q${n} answer ${key[n]} not in bank`);
      if (!g.reuse && new Set(ns.map((n) => key[n])).size !== ns.length) errors.push(`group ${ns[0]}: single-use bank but answers repeat`);
    }
    if (g.t === 'grid') {
      const L = letterRange(g.letters);
      for (const it of g.items) if (!L.includes(key[it.n])) errors.push(`Q${it.n} answer ${key[it.n]} not in ${g.letters}`);
    }
  }
  if (errors.length) throw new Error(`Test ${test.id}: ${errors.join('; ')}`);

  // ---- footer palette
  const entries = [];
  const used = new Set();
  for (const g of test.groups) if (g.t === 'multi') { entries.push([`${g.n[0]}–${g.n[g.n.length - 1]}`, g.n[0], g.n]); g.n.forEach((n) => used.add(n)); }
  for (const n of expected) if (!used.has(n)) entries.push([String(n), n, [n]]);
  entries.sort((a, b) => a[1] - b[1]);
  const palette = entries.map(([label, primary, qs]) => `<button class="q-btn" data-part="${part}" data-q="${primary}" data-qnums='${JSON.stringify(qs)}'>${label}</button>`).join('');
  const footer = `<div class="part-section" data-part="${part}" data-questions="${JSON.stringify(expected)}" data-entry-count="${entries.length}">  <span class="part-label">Part ${part}</span>  <span class="part-progress">0/${entries.length}</span>  <div class="q-palette">${palette}</div></div>`;

  const sections = `<div class="questions-section" data-part="${part}" data-part-title="Listening Part ${part}" data-part-range="${lo}–${lo + 9}">${groups.map((g) => g.html).join('')}</div>`;
  const label = `<span class="part-pill">Part ${part}</span><span class="label-sep">/</span><strong>Test ${test.id}</strong>`;
  const tpl = fs.readFileSync(path.join(HERE, 'template.html'), 'utf8');
  const fill = {
    TEST_TITLE: esc(`IELTS Listening — Test ${test.id}: ${plain(test.title)}`),
    TIMER_SECONDS: '1800',
    TEST_HEADER: label,
    AUDIO_URL_DEFAULT: AUDIO(test.id),
    QUESTION_SECTIONS: sections,
    FOOTER_PARTS: footer,
    ANSWER_KEY_JSON: JSON.stringify(key).replace(/</g, '\\u003c'),
    EITHER_ORDER_JSON: JSON.stringify(test._either).replace(/</g, '\\u003c'),
    PART_AUDIO_JSON: '{}',
    PART_LABEL_JSON: JSON.stringify({ [part]: label }),
    TOTAL_QUESTIONS: '10',
    TEST_ID: String(test.id),
  };
  const out = tpl.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => {
    if (!(k in fill)) throw new Error(`no value for ${m}`);
    return fill[k];
  });
  if (out.includes(HOME) === false) throw new Error('home link missing');
  return out;
}

export async function loadTests() {
  const all = [];
  for (const p of [1, 2, 3, 4]) {
    const file = path.join(HERE, 'content', `part${p}.mjs`);
    if (!fs.existsSync(file)) continue;
    const mod = await import(file);
    all.push(...mod.default);
  }
  return all.sort((a, b) => a.id - b.id);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const want = process.argv.slice(2).map(Number);
  const tests = await loadTests();
  let built = 0;
  const failures = [];
  for (const t of tests) {
    if (want.length && !want.includes(t.id)) continue;
    try {
      const html = buildTest(t);
      fs.writeFileSync(path.join(OUT_DIR, `test_${t.id}.html`), html);
      built++;
    } catch (e) { failures.push(e.message); }
  }
  console.log(`built ${built} page(s)`);
  if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
}
