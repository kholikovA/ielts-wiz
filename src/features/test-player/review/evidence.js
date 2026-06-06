// Evidence location for the review page. Turns each question's explanation into
// (a) a rationale string and (b) a located span in the passage so the left pane
// can highlight it and clicking a question can scroll to it.
//
// Two data shapes are supported so the UI ships before the structured-data regen:
//   • structured: { evidence, part, paragraph, rationale }  (preferred)
//   • legacy string: "...'a verbatim quote'..."             (fuzzy-recovered)

// Accepts string | object | null and returns a uniform shape (or null).
export function normalizeExplanation(raw) {
  if (raw == null) return null;
  if (typeof raw === 'string') return { evidence: null, part: null, paragraph: null, rationale: raw };
  return {
    evidence: raw.evidence || null,
    part: raw.part ?? null,
    paragraph: raw.paragraph ?? null,
    rationale: raw.rationale || '',
  };
}

// Build a normalized copy of `raw` (lowercased; smart quotes/dashes folded;
// whitespace collapsed) plus a map from each normalized-char index back to its
// originating raw index — so a fuzzy match can be projected onto raw offsets.
function buildNormMap(raw) {
  let norm = '';
  const map = [];
  let prevSpace = false;
  for (let i = 0; i < raw.length; i++) {
    let c = raw[i];
    if (c === '‘' || c === '’') c = "'";
    else if (c === '“' || c === '”') c = '"';
    else if (c === '–' || c === '—') c = '-';
    if (/\s/.test(c)) {
      if (prevSpace) continue; // collapse runs of whitespace
      norm += ' '; map.push(i); prevSpace = true;
    } else {
      norm += c.toLowerCase(); map.push(i); prevSpace = false;
    }
  }
  return { norm, map };
}

// Locate `needle` inside `haystack`, returning raw {start,end} or null.
// Tries an exact substring first, then a normalized (fuzzy) match.
export function locateEvidence(haystack, needle) {
  if (!haystack || !needle) return null;
  const direct = haystack.indexOf(needle);
  if (direct >= 0) return { start: direct, end: direct + needle.length };
  const a = buildNormMap(haystack);
  const nNeedle = buildNormMap(needle).norm.trim();
  if (!nNeedle) return null;
  const j = a.norm.indexOf(nNeedle);
  if (j < 0) return null;
  const start = a.map[j];
  const end = a.map[Math.min(j + nNeedle.length - 1, a.map.length - 1)] + 1;
  return { start, end };
}

// Quoted spans inside a legacy rationale string, longest first (best evidence).
function extractQuotes(text) {
  const out = [];
  const re = /['"‘’“”]([^'"‘’“”]{8,})['"‘’“”]/g;
  let m;
  while ((m = re.exec(text))) out.push(m[1]);
  return out.sort((x, y) => y.length - x.length);
}

const paraTextOf = (p) => (typeof p === 'string' ? p : p.text || '');

// Build the evidence index for a spec. Returns:
//   byParagraph: Map "<part>:<paraIdx>" -> [{ qnum, start, end }]  (for the passage pane)
//   byQuestion:  { [qnum]: { rationale, evidenceText, located } }   (for the right pane)
export function buildEvidenceIndex(spec) {
  const byParagraph = new Map();
  const byQuestion = {};
  if (!spec || !spec.explanations) return { byParagraph, byQuestion };

  const partByNumber = {};
  const partOfQnum = {};
  spec.parts.forEach((part) => {
    partByNumber[part.part_number] = part;
    part.question_groups.forEach((g) => g.questions.forEach((q) => { partOfQnum[q.number] = part.part_number; }));
  });

  const paraText = (partNum, paraIdx) => {
    const part = partByNumber[partNum];
    const p = part && part.passage_paragraphs[paraIdx];
    return p ? paraTextOf(p) : '';
  };

  // Search every paragraph of one part for a needle; first hit wins.
  const searchPart = (partNum, needle) => {
    const part = partByNumber[partNum];
    if (!part) return null;
    for (let idx = 0; idx < part.passage_paragraphs.length; idx++) {
      const loc = locateEvidence(paraTextOf(part.passage_paragraphs[idx]), needle);
      if (loc) return { part: partNum, paragraph: idx, ...loc };
    }
    return null;
  };

  Object.keys(spec.explanations).forEach((key) => {
    const qnum = Number(key);
    const exp = normalizeExplanation(spec.explanations[key]);
    if (!exp) return;

    let located = null;
    // 1. structured: locate the verbatim span in its named paragraph.
    if (exp.evidence && exp.part != null && exp.paragraph != null) {
      const loc = locateEvidence(paraText(exp.part, exp.paragraph), exp.evidence);
      if (loc) located = { part: exp.part, paragraph: exp.paragraph, ...loc };
    }
    // 2. structured but mislabeled: search the question's whole part.
    if (!located && exp.evidence) located = searchPart(partOfQnum[qnum], exp.evidence);
    // 3. legacy string: recover a quoted span and search the question's part.
    if (!located && !exp.evidence && exp.rationale) {
      for (const cand of extractQuotes(exp.rationale)) {
        located = searchPart(partOfQnum[qnum], cand);
        if (located) break;
      }
    }

    let evidenceText = exp.evidence || null;
    if (located) {
      const text = paraText(located.part, located.paragraph).slice(located.start, located.end);
      evidenceText = text;
      // Skip spans that would split inline HTML (rare) — keep rationale, drop highlight.
      if (!/[<>]/.test(text)) {
        const k = `${located.part}:${located.paragraph}`;
        if (!byParagraph.has(k)) byParagraph.set(k, []);
        byParagraph.get(k).push({ qnum, start: located.start, end: located.end });
      } else {
        located = null;
      }
    }

    byQuestion[qnum] = { rationale: exp.rationale, evidenceText, located: !!located };
  });

  return { byParagraph, byQuestion };
}

// Resolve overlapping spans within one paragraph: sort by start, drop any that
// overlap an already-kept span (first-wins). Returns a clean, sorted list.
export function dedupeSpans(spans) {
  const sorted = [...spans].sort((a, b) => a.start - b.start || b.end - a.end);
  const out = [];
  let lastEnd = -1;
  for (const s of sorted) {
    if (s.start >= lastEnd) { out.push(s); lastEnd = s.end; }
  }
  return out;
}
