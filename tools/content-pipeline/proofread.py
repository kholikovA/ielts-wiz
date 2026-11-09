"""Proofread every test spec JSON in a folder for PDF/OCR copying slips.
Usage: python3 tools/content-pipeline/proofread.py <folder-of-spec-json>   (exit 1 if anything is flagged)
Read every passage and question as well: this catches mechanical slips, not wrong words."""
import json, glob, os, re, html, sys
D = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('PROOF_DIR', '.')
WORDS = set(w.strip().lower() for w in open('/usr/share/dict/words'))
RULES = [
    ('doubled punctuation', r'([,;:!?])\1|(?<!\.)\.\.(?!\.)|\.{4,}|[,;:]\s*[,;:]|[,;:]\s*\.(?!\.\.)|\.\s*,'),
    ('space before punctuation', r'(?<=[A-Za-z0-9)’”])\s+[,;:!?]|(?<=[a-z])\s+\.(?!\.)'),
    ('no space after punctuation', r'[a-z]{2}[,;:!?][A-Za-z]|[a-z]{3}\.[A-Z][a-z]'),
    ('lowercase after full stop', r'[a-z]{2}[.!?][’”]?\s+[a-z]'),
    ('repeated word', r'\b(?!(?:had|that)\b)(\w+)\s+\1\b'),
    ('hyphen used as dash', r'(?<!\| )(?<!\|)\w - \w|\w-[A-Z]?[a-z]+-\w+\b(?=[^\w]*(?:with|became|to|has)\b)|[a-z]-(?:the|a|an|and|but|which|who|that|perhaps|one)\b(?!-)'),
    ('split word', r'\b[a-z]{2,} (?:ed|ing|tion|ly|ment|ness)\b'),
    ('stray capital letter', r'(?<=[a-z] )[B-HJ-Z](?= [a-z])'),
    ('stray lowercase letter', r'(?<!\d )(?<![’\'\w/-])(?![ai]\b|g\b)[b-hj-z](?![\w’\'-])(?= [a-z])'),
    ('space inside quote', r'[‘“]\s|\s[’”](?=\s|$)'),
    ('odd character', r'[^\x20-\x7E -ɏ‐-‧‰-›←-↓€°²]'),
]
def plain(t):
    t = re.sub(r'<br\s*/?>|</?(?:p|li|td|th|tr|table|thead|tbody|ul|ol|div)\b[^>]*>', ' | ', t)
    return html.unescape(re.sub(r'<[^>]+>', '', t))
def strings(v, path=''):
    if isinstance(v, str): yield path, v
    elif isinstance(v, list):
        for i, x in enumerate(v): yield from strings(x, f'{path}[{i}]')
    elif isinstance(v, dict):
        for k, x in v.items():
            if k not in ('type', 'letter', 'id', 'paragraph', 'answer_key', 'answer_key_status', 'skill'): yield from strings(x, f'{path}.{k}')
bad = 0
AFFIX_END = {'ed', 'ers', 'er', 'ing', 'able', 'ible', 'tion', 'tions', 'ment', 'ments', 'ness', 'ly', 'ive', 'ous', 'ity', 'al', 'ism', 'ist', 'ists', 'ful'}
AFFIX_START = {'un', 're', 'dis', 'pre', 'im', 'non', 'mis', 'inter'}
SPLIT_OK = {'be paid', 'a box', 'h and', 'to co'}
ALLOWED = ['Slow food  ___  ___']  # genuine: adjacent table gaps
for f in sorted(glob.glob(os.path.join(D, '*.json'))):
    spec = json.load(open(f)); name = os.path.basename(f)[:-5]
    for path, raw in strings(spec):
        t = plain(raw)
        for rule, rx in RULES:
            for m in re.finditer(rx, t):
                ctx = t[max(0, m.start()-30):m.end()+30]
                if any(ok in ctx for ok in ALLOWED): continue
                bad += 1; print(f'{name} {path} [{rule}] …{t[max(0, m.start()-30):m.end()+30]}…')
        for m in re.finditer(r"(?<![\w’'-])([A-Za-z]+) ([a-z]+)\b", t):   # words split in two: 'un able'
            a, b = m.group(1), m.group(2)
            if a.isupper() or (a + ' ' + b) in SPLIT_OK: continue
            def word(w):
                w = w.lower()
                return w in ('a', 'i') or (len(w) > 1 and (w in WORDS or w.rstrip('s') in WORDS))
            affix = b in AFFIX_END or a.lower() in AFFIX_START
            if word(a + b) and (affix or not (word(a) and word(b))) and len(a + b) > 3:
                bad += 1; print(f'{name} {path} [split word?] …{t[max(0, m.start()-25):m.end()+25]}…')
    for p in spec['parts']:  # quotes balance per passage (quotes may span paragraphs)
        t = ' '.join(x['text'] if isinstance(x, dict) else x for x in p['passage_paragraphs'])
        if t.count('“') != t.count('”'): bad += 1; print(f'{name} P{p["part_number"]} [double quotes unbalanced] {t.count("“")} open, {t.count("”")} close')
        depth = 0
        toks = []
        for m in re.finditer(r'‘|’(?![a-z])', t):
            before, after = t[max(0, m.start() - 1):m.start()], t[m.end():m.end() + 2]
            kind = 'open' if m.group(0) == '‘' else ('maybe' if before in ('s', 'z') else 'close')
            if kind != 'open' and after[:1].isdigit(): kind = 'skip'          # ’80s
            toks.append((kind, m))
        for k, (kind, m) in enumerate(toks):
            if kind == 'open': depth += 1; continue
            if kind == 'skip': continue
            if kind == 'maybe':
                nxt = next((x for x, _ in toks[k + 1:] if x != 'skip'), None)
                if depth == 0 or nxt in ('close', 'maybe'): continue          # possessive (humans’ first)
            if depth: depth -= 1; continue
            bad += 1; print(f'{name} P{p["part_number"]} [closing quote with no opening] …{t[max(0, m.start()-50):m.end()+10]}…')
        if depth: bad += 1; print(f'{name} P{p["part_number"]} [{depth} quote(s) never closed]')
print('flagged:', bad); sys.exit(1 if bad else 0)
