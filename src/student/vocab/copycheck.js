// Is a "use it in a sentence" answer just the definition copied back?
// Shared with the sentence-check edge function (keep the two in sync).
//   - 5+ words in a row taken from the meaning, or
//   - most (60%+) of the meaning's content words reused.
// The target word itself never counts.

const STOP = new Set(('a an the and or but of to in on at for with by from as is are was were be been being it its this that '
  + 'these those your you their they them our we he she his her i my me do does did not no so than then there here '
  + 'which who whom what when where how can could will would should may might must has have had').split(' '));

const words = (s) => (s || '').toLowerCase().replace(/[’']/g, "'").match(/[a-z0-9']+/g) || [];

export function copiesDefinition(sentence, meaning, target = '') {
  const m = words(meaning);
  if (m.length < 3) return false;
  const s = words(sentence);
  const own = new Set(words(target));
  // 5-word run straight from the meaning.
  const text = ` ${s.join(' ')} `;
  for (let i = 0; i + 5 <= m.length; i += 1) {
    if (text.includes(` ${m.slice(i, i + 5).join(' ')} `)) return true;
  }
  const content = [...new Set(m.filter((w) => w.length > 2 && !STOP.has(w) && !own.has(w)))];
  if (content.length < 3) return false;
  const have = new Set(s);
  const reused = content.filter((w) => have.has(w)).length;
  return reused / content.length >= 0.6;
}
