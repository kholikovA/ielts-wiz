// Dictation checking: align what the student typed against the transcript,
// word by word. Case and punctuation are ignored; number words and digits
// match ("five" = "5"); hyphenated words count as separate words.
//
// Each op is one of:
//   ok    — word matches                    { t: 'ok', said, ref }
//   typo  — close enough to be a misspelling { t: 'typo', said, ref }
//   extra — typed but not in the transcript  { t: 'extra', said }
//   miss  — in the transcript, not typed     { t: 'miss', ref }
// `said` / `ref` are display tokens (with the punctuation as written).

const NUMBERS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
];
const TENS = { thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100 };
const NUM_WORD = new Map([...NUMBERS.map((w, i) => [w, String(i)]), ...Object.entries(TENS).map(([w, n]) => [w, String(n)])]);

export function normWord(raw) {
  let w = raw.toLowerCase().replace(/[‘’`´]/g, "'");
  w = w.replace(/(\d),(?=\d{3}\b)/g, '$1'); // 1,000 -> 1000
  w = w.replace(/[^a-z0-9'.À-ɏ]/g, '');
  w = w.replace(/^[.']+|[.']+$/g, ''); // edge dots/quotes ("run." / 'hello')
  if (/^\d+(\.\d+)?$/.test(w)) return w;
  w = w.replace(/\./g, ''); // a.m. -> am
  return NUM_WORD.get(w) || w;
}

// Split text into display tokens; hyphen/dash/slash joins become separate words.
export function tokenize(text) {
  const out = [];
  (text || '').trim().split(/\s+/).forEach((chunk, w) => {
    if (!chunk) return;
    const pieces = chunk.split(/(?<=[A-Za-z0-9À-ɏ])[-–—/](?=[A-Za-z0-9À-ɏ])/);
    pieces.forEach((p) => {
      const n = normWord(p);
      if (n) out.push({ raw: p, n, w });
    });
  });
  return out;
}

// Optimal string alignment distance (Levenshtein + adjacent transpositions).
export function editDistance(a, b) {
  const m = a.length; const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev2 = null;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i += 1) {
    const cur = [i];
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur.push(v);
    }
    prev2 = prev;
    prev = cur;
  }
  return prev[n];
}

// Cost of treating `said` as a misspelling of `ref`; Infinity when the words
// are too different (then it's an extra word plus a missing one).
function subCost(said, ref) {
  if (said === ref) return 0;
  if (/^\d/.test(said) || /^\d/.test(ref)) return Infinity; // numbers are right or wrong
  const d = editDistance(said, ref);
  const len = Math.max(said.length, ref.length);
  const allowed = len <= 3 ? 1 : len <= 6 ? 2 : Math.ceil(len * 0.4);
  if (d > allowed) return Infinity;
  return 0.6 + 0.4 * (d / len);
}

// Global alignment of two token lists (dynamic programming, O(n·m)).
export function align(saidTokens, refTokens) {
  const n = saidTokens.length; const m = refTokens.length;
  const W = m + 1;
  const cost = new Float64Array((n + 1) * W);
  const move = new Uint8Array((n + 1) * W); // 1 diag, 2 up (extra), 3 left (miss)
  for (let i = 1; i <= n; i += 1) { cost[i * W] = i; move[i * W] = 2; }
  for (let j = 1; j <= m; j += 1) { cost[j] = j; move[j] = 3; }
  for (let i = 1; i <= n; i += 1) {
    const s = saidTokens[i - 1].n;
    for (let j = 1; j <= m; j += 1) {
      const diag = cost[(i - 1) * W + j - 1] + subCost(s, refTokens[j - 1].n);
      const up = cost[(i - 1) * W + j] + 1;
      const left = cost[i * W + j - 1] + 1;
      // Ties prefer "missing" when tracing back, which puts a wrong word
      // before its correction in the output ("cat" struck, then "dog").
      let best = diag; let mv = 1;
      if (left < best) { best = left; mv = 3; }
      if (up < best) { best = up; mv = 2; }
      cost[i * W + j] = best;
      move[i * W + j] = mv;
    }
  }
  const ops = [];
  let i = n; let j = m;
  while (i > 0 || j > 0) {
    const mv = move[i * W + j];
    if (mv === 1) {
      const said = saidTokens[i - 1]; const ref = refTokens[j - 1];
      ops.push({ t: said.n === ref.n ? 'ok' : 'typo', said: said.raw, ref: ref.raw, si: i - 1, ri: j - 1 });
      i -= 1; j -= 1;
    } else if (mv === 2) {
      ops.push({ t: 'extra', said: saidTokens[i - 1].raw, si: i - 1 });
      i -= 1;
    } else {
      ops.push({ t: 'miss', ref: refTokens[j - 1].raw, ri: j - 1 });
      j -= 1;
    }
  }
  return ops.reverse();
}

export function checkDictation(typed, transcript) {
  const ops = align(tokenize(typed), tokenize(transcript));
  const count = (t) => ops.filter((o) => o.t === t).length;
  const correct = count('ok');
  const total = ops.filter((o) => o.t !== 'extra').length;
  return {
    ops,
    score: {
      correct, total,
      typos: count('typo'), missing: count('miss'), extra: count('extra'),
      accuracy: total ? Math.round((correct / total) * 100) : 0,
    },
  };
}
