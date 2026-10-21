// Word game definitions + round builders (pure, testable).
// words: [{ term, meaning, example? }]

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const normalise = (s) => (s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, ' ').trim();

// First line / sentence of a card back, trimmed for option buttons.
export function shortMeaning(text, max = 120) {
  const first = (text || '').split('\n').map((l) => l.trim()).find(Boolean) || '';
  return first.length > max ? `${first.slice(0, max - 1).trimEnd()}…` : first;
}

export function scramble(word) {
  const letters = word.replace(/\s+/g, '').split('');
  if (letters.length < 2) return letters;
  for (let tries = 0; tries < 10; tries += 1) {
    const s = shuffle(letters);
    if (s.join('') !== letters.join('')) return s;
  }
  return letters.reverse();
}

const ROUND = 10;

const pickDistractors = (pool, answer, key, n = 3) =>
  shuffle(pool.filter((w) => w !== answer && normalise(w[key]) !== normalise(answer[key]))).slice(0, n);

function choice(ask, prompt, big, answerText, distractorTexts) {
  const options = shuffle([answerText, ...distractorTexts]);
  return { type: 'choice', ask, prompt, big, options, answer: options.indexOf(answerText) };
}

// Blank the term (or a close inflection of it) out of its example sentence.
export function gapSentence(example, term) {
  if (!example || !term) return null;
  const stem = term.trim().split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
  const re = new RegExp(`\\b${stem}\\w{0,3}\\b`, 'i');
  if (!re.test(example)) return null;
  return example.replace(re, '_____');
}

const singleWord = (w) => /^[a-z]{4,14}$/i.test(w.term.trim());

export const GAMES = [
  {
    id: 'meaning', title: 'Meaning match', icon: 'eye',
    desc: 'See a word, pick its meaning. Fast recognition.',
    needs: 'Needs at least 4 words.',
    available: (w) => w.length >= 4,
    build: (words) => shuffle(words).slice(0, ROUND).map((w) =>
      choice('What does this mean?', w.term, true, shortMeaning(w.meaning), pickDistractors(words, w, 'meaning').map((d) => shortMeaning(d.meaning)))),
  },
  {
    id: 'reverse', title: 'Word from meaning', icon: 'search',
    desc: 'Read a meaning, pick the word. Links meaning back to form.',
    needs: 'Needs at least 4 words.',
    available: (w) => w.length >= 4,
    build: (words) => shuffle(words).slice(0, ROUND).map((w) =>
      choice('Which word fits this meaning?', shortMeaning(w.meaning, 200), false, w.term, pickDistractors(words, w, 'term').map((d) => d.term))),
  },
  {
    id: 'spell', title: 'Type it', icon: 'type',
    desc: 'Read the meaning and type the word. Hardest and most effective.',
    needs: 'Needs at least 4 words.',
    available: (w) => w.length >= 4,
    build: (words) => shuffle(words).slice(0, ROUND).map((w) => ({
      type: 'type', ask: 'Type the word', prompt: shortMeaning(w.meaning, 200), term: w.term, hint: w.term.trim()[0],
    })),
  },
  {
    id: 'gap', title: 'Gap fill', icon: 'edit',
    desc: 'Choose the word that completes a real sentence.',
    needs: 'Needs 4 saved words with example sentences (save words from Articles).',
    available: (w) => w.filter((x) => gapSentence(x.example, x.term)).length >= 4,
    build: (words) => {
      const withGap = words.filter((x) => gapSentence(x.example, x.term));
      return shuffle(withGap).slice(0, ROUND).map((w) =>
        choice('Complete the sentence', gapSentence(w.example, w.term), false, w.term, pickDistractors(words, w, 'term').map((d) => d.term)));
    },
  },
  {
    id: 'pairs', title: 'Match pairs', icon: 'layers',
    desc: 'Pair five words with their meanings, two boards per round.',
    needs: 'Needs at least 5 words.',
    available: (w) => w.length >= 5,
    build: (words) => {
      const picked = shuffle(words).slice(0, Math.min(10, words.length));
      const boards = [];
      for (let i = 0; i + 5 <= picked.length; i += 5) {
        const pairs = picked.slice(i, i + 5);
        boards.push({ type: 'pairs', pairs, meaningOrder: shuffle(pairs.map((_, k) => k)) });
      }
      return boards;
    },
  },
  {
    id: 'scramble', title: 'Unscramble', icon: 'refresh',
    desc: 'Rebuild a word from its letters, using the meaning as a clue.',
    needs: 'Needs 4 single words of 4–14 letters.',
    available: (w) => w.filter(singleWord).length >= 4,
    build: (words) => shuffle(words.filter(singleWord)).slice(0, ROUND).map((w) => ({
      type: 'type', ask: 'Unscramble the word', prompt: shortMeaning(w.meaning, 200), term: w.term.trim(), letters: scramble(w.term.trim()),
    })),
  },
];

export const buildRound = (game, words) => game.build(words);
