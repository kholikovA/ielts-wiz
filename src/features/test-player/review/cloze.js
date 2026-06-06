// Pure helpers that turn a completion question into a "filled cloze" fragment for
// the review right pane — the sentence/line/bullet around that gap, so the student
// sees their answer in context instead of a bare type label.
//
// Output shape: { label?, runs: [ {html} | {text} | {gap, qnum, target} ] }
//   • {html}  — trusted authored markup (prompts/note items), rendered as HTML
//   • {text}  — plain text recovered from layout HTML, rendered escaped
//   • {gap}   — a blank; the renderer fills it from the question's result
// Returns null when the type has no cloze to show.

const GAP = '___';
const TOK = (i) => `\uE000${i}\uE001`;
const TOK_RE = /\uE000(\d+)\uE001/;
const stripTags = (s) => String(s).replace(/<[^>]+>/g, '');
const tidy = (s) => s.replace(/[ \t]+/g, ' ').trim();

// Split authored HTML (which may contain markup) at its `___` markers, mapping
// the j-th blank to gapQnums[j].
function splitRuns(html, gapQnums, targetQnum) {
  const segs = String(html).split(GAP);
  const runs = [];
  segs.forEach((seg, j) => {
    if (seg) runs.push({ html: seg });
    if (j < segs.length - 1) {
      const qnum = gapQnums[j];
      runs.push({ gap: true, qnum, target: qnum === targetQnum });
    }
  });
  return runs;
}

// Build runs from a plain-text fragment that still carries gap tokens.
function tokenRuns(frag, gapQnums, targetQnum) {
  const parts = frag.split(TOK_RE);
  const runs = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      const t = parts[i];
      if (t) runs.push({ text: t });
    } else {
      const qnum = gapQnums[Number(parts[i])];
      runs.push({ gap: true, qnum, target: qnum === targetQnum });
    }
  }
  return runs;
}

const tokenize = (html) => { let k = 0; return String(html).replace(/___/g, () => TOK(k++)); };
const splitSentences = (text) => text.split(/(?<=[.?!])\s+(?=[A-Z“"‘'(])/);

// The blank's sentence, for prose summaries.
function sentenceFragment(bodyHtml, qnums, targetQnum) {
  const targetIdx = qnums.indexOf(targetQnum);
  const plain = tidy(stripTags(tokenize(bodyHtml)));
  const tok = TOK(targetIdx);
  const sentence = splitSentences(plain).find((s) => s.includes(tok)) || plain;
  return { runs: tokenRuns(sentence, qnums, targetQnum) };
}

// The blank's row/line — for tables/flowcharts/diagrams. Table cells are joined
// with a separator so a blank that IS a row-label cell still reads in context
// (e.g. "____ · Normal size for such a large animal").
function lineFragment(bodyHtml, qnums, targetQnum) {
  const targetIdx = qnums.indexOf(targetQnum);
  const withBreaks = tokenize(bodyHtml)
    .replace(/<\/(td|th)>/gi, ' · ')                                  // join cells within a row
    .replace(/<\/(tr|li|p|div|h[1-6]|figcaption)>/gi, '\n')           // break on row/block
    .replace(/<br\s*\/?>/gi, '\n');
  const lines = stripTags(withBreaks)
    .split('\n')
    .map((s) => tidy(s)
      .replace(/(\s*·\s*)+/g, ' · ')          // collapse runs of separators (empty cells)
      .replace(/^\s*·\s*|\s*·\s*$/g, '')       // strip leading/trailing separators
      .trim());
  const tok = TOK(targetIdx);
  const li = lines.findIndex((s) => s.includes(tok));
  const frag = li >= 0 ? lines[li] : tidy(stripTags(tokenize(bodyHtml)));
  return { runs: tokenRuns(frag, qnums, targetQnum) };
}

// Main entry: the cloze fragment for one completion question, or null.
export function clozeRuns(group, targetQnum) {
  const type = group.type;

  if (type === 'sentence_completion' || type === 'short_answer') {
    const q = (group.questions || []).find((x) => x.number === targetQnum);
    if (!q) return null;
    let ht = q.prompt_html || q.prompt || '';
    if (type === 'short_answer' && !ht.includes(GAP)) ht += ' ___';
    if (!ht.includes(GAP)) return null;
    return { runs: splitRuns(ht, [targetQnum], targetQnum) };
  }

  if (type === 'note_completion') {
    for (const sec of group.layout?.sections || []) {
      for (const it of sec.items || []) {
        if (it.qnum === targetQnum && typeof it.html === 'string' && it.html.includes(GAP)) {
          return { label: sec.heading || null, runs: splitRuns(it.html, [targetQnum], targetQnum) };
        }
      }
    }
    return null;
  }

  if (type === 'summary_completion') {
    const layout = group.layout || {};
    if (layout.body_html && layout.body_html.includes(GAP)) {
      return sentenceFragment(layout.body_html, group.questions.map((q) => q.number), targetQnum);
    }
    const q = (group.questions || []).find((x) => x.number === targetQnum);
    const ht = q && (q.prompt_html || q.prompt);
    return ht && ht.includes(GAP) ? { runs: splitRuns(ht, [targetQnum], targetQnum) } : null;
  }

  if (type === 'table_completion' || type === 'flowchart_completion' || type === 'diagram_completion') {
    const layout = group.layout || {};
    if (!layout.body_html || !layout.body_html.includes(GAP)) return null;
    return lineFragment(layout.body_html, group.questions.map((q) => q.number), targetQnum);
  }

  return null;
}
