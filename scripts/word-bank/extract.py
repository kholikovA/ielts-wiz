"""Build the Words tab of the question bank (table public.bank_words).

Finds every B2+ word (and idiomatic phrasal verb) a student meets in the
question bank: SAT questions (prompt, passage and options) and IELTS bank tests
(passages, questions, options, instructions). Answer keys and rationales are not
scanned, because students don't read them while answering.

Levels come from the CEFR-J Vocabulary Profile 1.5 (A1-B2) and the Octanove
Vocabulary Profile C1/C2 1.0 (https://github.com/openlanguageprofiles/olp-en-cefrj).
A word in neither list gets a level from its word family (a derived word takes
its base word's level) or, failing that, from its corpus frequency (wordfreq).
Proper nouns (always capitalised in the bank) are skipped.

Usage (see README.md):
    python extract.py sat.jsonl ielts.jsonl lists/ out.json
"""
import collections
import csv
import html
import json
import re
import sys

import spacy
from lemminflect import getAllLemmas
from wordfreq import zipf_frequency

LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
RANK = {l: i for i, l in enumerate(LEVELS)}
IELTS_TEXT_KEYS = {
    'text', 'prompt', 'prompt_html', 'html', 'body_html', 'passage_paragraphs', 'passage_title',
    'passage_subtitle', 'title', 'heading', 'instructions_html', 'table_column_header', 'bank_title',
}
MAX_EXAMPLES = 2

# Words the lists miss but every IELTS/SAT student already knows, plus list noise.
SKIP = set('''
ok okay etc vs per cent percent online website email internet app smartphone
also however although therefore thus hence found
'''.split())

# Phrasal verbs: only idiomatic ones a B1 student is unlikely to know. Literal
# ones (go back, come in), easy ones (grow up, find out) and parser mistakes are dropped.
PHRASAL = set('''
make up|point out|carry out|set up|break down|set out|work out|bring about|set off|bear out|bottle up
bring out|build up|carry over|catch on|conjure up|draw on|expand on|fill out|filter out|follow up
give away|give out|give up|hand out|hold out|hold up|keep up|lay out|live up|pass down|pass on|pick out
pile up|play out|prey on|rule out|seek out|set aside|shake off|speed up|spread out|stand out|take in
take on|take over|turn out|wind up|wear out|weigh down|dry out|take off|break up|come up|cut down
drift off|go on|start off|fill in|carry on|account for|come about|phase out|single out|stem from
'''.replace('\n', '|').split('|')) - {''}
PARTICLES = {'up', 'out', 'off', 'down', 'over', 'on', 'in', 'away', 'back', 'through', 'about', 'around', 'forward', 'aside'}


def load_levels(folder):
    best = {}

    def add(word, level):
        w = word.strip().lower()
        if not w or level not in RANK:
            return
        if w not in best or RANK[level] < RANK[best[w]]:
            best[w] = level

    for name in ('cefrj-vocabulary-profile-1.5.csv', 'octanove-vocabulary-profile-c1c2-1.0.csv'):
        with open(f'{folder}/{name}', encoding='utf-8') as f:
            for row in csv.DictReader(f):
                for w in row['headword'].split('/'):
                    add(w, row['CEFR'].strip())
                    first = w.strip().split(' ')[0]
                    if ' ' in w.strip() and len(first) > 3:
                        add(first, row['CEFR'].strip())  # 'according to' -> according
    return best


def strip_markup(s):
    s = re.sub(r'\\\(.*?\\\)|\\\[.*?\\\]|\$[^$]*\$', ' ', s, flags=re.S)  # LaTeX maths
    s = re.sub(r'<br\s*/?>|</p>|</li>|</td>|</th>|</tr>', '. ', s, flags=re.I)
    s = re.sub(r'<[^>]+>', ' ', s)
    s = html.unescape(s).replace('___', '…')
    return re.sub(r'\s+', ' ', s).strip()


def sat_units(path):
    for line in open(path, encoding='utf-8'):
        q = json.loads(line)
        c = q['content']
        texts = [p for p in c.get('prompt', []) if isinstance(p, str)]
        texts += [o['text'] for o in c.get('options', []) if isinstance(o, dict) and isinstance(o.get('text'), str)]
        yield ('sat_rw' if q['test'] == 'rw' else 'sat_math', f"sat:{q['id']}", [strip_markup(t) for t in texts])


def ielts_units(path):
    for line in open(path, encoding='utf-8'):
        t = json.loads(line)
        source = f"ielts_{t['skill']}"
        for i, part in enumerate(t['spec'].get('parts', [])):
            texts = []

            def walk(x, key=None):
                if isinstance(x, dict):
                    for k, v in x.items():
                        walk(v, k)
                elif isinstance(x, list):
                    for v in x:
                        walk(v, key)
                elif isinstance(x, str) and key in IELTS_TEXT_KEYS:
                    texts.append(strip_markup(x))

            walk(part)
            yield (source, f"ielts:{t['id']}:{i + 1}", texts)


# Derived words take their base word's level: unreliable -> reliable.
SUFFIXES = [
    ('ically', 'ic'), ('ically', 'ical'), ('ily', 'y'), ('ly', ''), ('ly', 'le'), ('ness', ''), ('iness', 'y'),
    ('ment', ''), ('ity', ''), ('ity', 'e'), ('ability', 'able'), ('ibility', 'ible'), ('ation', 'ate'),
    ('ation', 'e'), ('ation', ''), ('ition', 'ite'), ('ion', 'e'), ('ion', ''), ('er', ''), ('er', 'e'),
    ('or', ''), ('or', 'e'), ('ist', ''), ('ism', ''), ('al', ''), ('al', 'e'), ('ive', 'e'), ('ive', ''),
    ('able', ''), ('able', 'e'), ('ible', ''), ('ize', ''), ('ise', ''), ('ful', ''), ('less', ''),
    ('ous', ''), ('ous', 'e'), ('ance', ''), ('ence', ''), ('ant', ''), ('ent', ''), ('ship', ''), ('hood', ''),
]
PREFIXES = ['un', 'in', 'im', 'ir', 'il', 'dis', 'non', 're', 'over', 'under', 'mis', 'pre', 'co', 'inter',
            'sub', 'counter', 'out', 'multi', 'semi', 'anti', 'self-']


def base_level(word, levels):
    for suf, rep in SUFFIXES:
        if word.endswith(suf) and len(word) - len(suf) >= 3:
            b = word[: -len(suf)] + rep
            if b in levels:
                return levels[b]
    for pre in PREFIXES:
        if word.startswith(pre) and len(word) - len(pre) >= 4:
            rest = word[len(pre):]
            if rest in levels:
                return levels[rest]
            lv = base_level(rest, levels) if rest not in levels else None
            if lv:
                return lv
    return None


def canonical(tok, levels):
    """The headword an occurrence counts towards, or None when it's an easy word.

    Every reading of the form is checked (spaCy's lemma, the form itself and each
    lemminflect lemma), so 'according' isn't counted as 'accord' and 'spoken' as a
    new word: if any reading is A1-B1 the student already knows it."""
    surface = tok.text.lower()
    lemma = surface if tok.pos_ == 'PROPN' else tok.lemma_.lower()
    cands = [lemma, surface] + [l.lower() for ls in getAllLemmas(surface).values() for l in ls]
    listed = [c for c in cands if c in levels]
    if any(RANK[levels[c]] < RANK['B2'] for c in listed):
        return None
    if lemma in levels:
        return lemma
    if listed:
        return listed[0]
    verb = getAllLemmas(surface).get('VERB')
    if verb and tok.pos_ in {'VERB', 'ADJ'}:
        return verb[0].lower()
    noun = getAllLemmas(surface).get('NOUN')
    if noun and tok.pos_ == 'NOUN':
        return noun[0].lower()
    return lemma


def level_of(word, levels):
    """Return (level, how) or (None, why-skipped)."""
    if word in SKIP:
        return None, 'skip'
    if word in levels:
        return levels[word], 'list'
    z = zipf_frequency(word, 'en')
    b = base_level(word, levels)
    if b:
        if RANK[b] >= RANK['B2']:
            return b, 'family'
        # Easy base word: only rarer derived forms are worth a card.
        return ('B2', 'family') if z < 3.6 else (b, 'family')
    if z >= 4.6:
        return 'B1', 'freq'      # common but not in the lists (e.g. "online")
    if z >= 3.4:
        return 'C1', 'freq'
    if z >= 1.5:
        return 'C2', 'freq'
    return None, 'rare'          # names, species, typos


def main(sat_path, ielts_path, list_dir, out_path):
    levels = load_levels(list_dir)
    nlp = spacy.load('en_core_web_sm', disable=['ner'])

    units = list(sat_units(sat_path)) + list(ielts_units(ielts_path))
    stats = collections.defaultdict(lambda: {
        'units': set(), 'sources': collections.Counter(), 'forms': collections.Counter(), 'pos': collections.Counter(),
        'examples': [], 'lower': 0, 'upper': 0,
    })

    def note(key, tok_text, pos, source, unit, sent, lower):
        s = stats[key]
        if unit not in s['units']:
            s['units'].add(unit)
            s['sources'][source] += 1
        s['forms'][tok_text.lower()] += 1
        s['pos'][pos] += 1
        s['lower' if lower else 'upper'] += 1
        text = sent.text.strip()
        n = len(text.split())
        if 6 <= n <= 45 and all(e['s'] != text for e in s['examples']):
            s['examples'].append({'s': text, 'src': unit, 'w': tok_text})

    for source, unit, texts in units:
        for doc in nlp.pipe([t for t in texts if t]):
            for sent in doc.sents:
                for i, tok in enumerate(sent):
                    if not tok.is_alpha or len(tok.text) < 3:
                        continue
                    lower = tok.text == tok.text.lower()
                    first = i == 0 or sent[i - 1].text in {'“', '"', '‘', "'", '(', '—', '-', ':'}
                    if not lower and first:
                        lower = None  # sentence-initial: tells us nothing about proper nouns
                    if tok.pos_ in {'NOUN', 'VERB', 'ADJ', 'ADV', 'PROPN', 'ADP', 'SCONJ', 'CCONJ'}:
                        lemma = canonical(tok, levels)
                        if lemma is None:
                            continue  # an easy word in this form (according, handling)
                        if lower is not None:
                            note(lemma, tok.text, tok.pos_, source, unit, sent, lower)
                        else:
                            note(lemma, tok.text, tok.pos_, source, unit, sent, True)
                            stats[lemma]['lower'] -= 1  # neutral
                    # Phrasal verbs: verb + particle (carry out, rule out, set off).
                    if tok.pos_ == 'VERB':
                        prts = [c for c in tok.children if c.dep_ == 'prt' and c.text.lower() in PARTICLES]
                        if prts:
                            phrase = f'{tok.lemma_.lower()} {prts[0].text.lower()}'
                            if phrase in PHRASAL:
                                note('~' + phrase, f'{tok.text} {prts[0].text}', 'PHRASAL', source, unit, sent, True)

    rows = []
    dropped = []
    skipped = collections.Counter()
    for key, s in stats.items():
        if key.startswith('~'):
            continue
        # Names are never written in lower case mid-sentence. A word met only at the
        # start of sentences is kept when it's a dictionary word or from a listed family.
        if s['lower'] <= 0 and key not in levels and (
                s['upper'] > 0 or not (getAllLemmas(key) or base_level(key, levels))):
            skipped['proper'] += 1
            dropped.append((key, s['upper'], len(s['units'])))
            continue
        lvl, how = level_of(key, levels)
        if lvl is None or RANK[lvl] < RANK['B2']:
            skipped[how if lvl is None else 'easy'] += 1
            continue
        pos = s['pos'].most_common(1)[0][0]
        if pos in {'ADP', 'SCONJ', 'CCONJ'}:
            pos = 'ADV'
        rows.append(build(key, 'word', lvl, how, pos, s))

    for key, s in stats.items():
        if not key.startswith('~'):
            continue
        phrase = key[1:]
        z = zipf_frequency(phrase, 'en')
        rows.append(build(phrase, 'phrase', 'B2', 'phrasal', 'PHRASAL', s, z))

    rows.sort(key=lambda r: (-r['freq'], r['word']))
    json.dump(rows, open(out_path, 'w'), ensure_ascii=False, indent=0)
    json.dump(dropped, open(out_path.replace('.json', '.names.json'), 'w'))
    print(f'{len(units)} units, {len(rows)} rows', dict(skipped), collections.Counter(r['level'] for r in rows))


def build(word, kind, level, how, pos, s, z=None):
    ex = sorted(s['examples'], key=lambda e: abs(len(e['s'].split()) - 18))[:MAX_EXAMPLES]
    return {
        'word': word, 'kind': kind, 'level': level, 'how': how,
        'pos': {'NOUN': 'noun', 'VERB': 'verb', 'ADJ': 'adjective', 'ADV': 'adverb', 'PROPN': 'noun', 'PHRASAL': 'phrasal verb'}.get(pos, pos.lower()),
        'freq': len(s['units']), 'sources': dict(s['sources']),
        'forms': [f for f, _ in s['forms'].most_common(6)],
        'examples': ex, 'zipf': round(z if z is not None else zipf_frequency(word, 'en'), 2),
    }


if __name__ == '__main__':
    main(*sys.argv[1:5])
