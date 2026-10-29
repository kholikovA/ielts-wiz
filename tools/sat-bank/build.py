import os, json, re, collections, hashlib, os
S = os.environ['SAT_WORK']
qs = json.load(open(f'{S}/qb/parsed.json'))
WORDS = set(w.strip().lower() for w in open('/usr/share/dict/words'))
COMMON_T = set('to the that this these those than then there their they them thus though through throughout two ten three time times today together told took too toward towards true truly try tried type types turn turned turns take takes taken took tend tends think thinks thought tree trees team teams text texts topic topics theory test tests tell tells told total task tasks tool tools trade trait traits travel'.split())
def isword(w):
    w = w.lower()
    if len(w) <= 1: return False
    return any(x in WORDS for x in (w, w[:-1] if w.endswith('s') else None, w[:-2] if w.endswith('es') else None, w[:-2] if w.endswith('ed') else None, w[:-1] if w.endswith('d') else None, w[:-3] if w.endswith('ing') else None, w[:-2] if w.endswith('ly') else None) if x)
# Letters the PDF text layer drops (accented) and words it splits; checked by hand.
FIXES = {'Luise o': 'Luiseño', 'Cupe o': 'Cupeño', 'Algar n': 'Algarín', 'Medell n': 'Medellín', 'Sanmart n': 'Sanmartín',
         'Mu oz': 'Muñoz', 'na ve': 'naïve', 'Na ve': 'Naïve', 'Chra bi': 'Chraïbi', 'Ana Mar a Mart nez': 'Ana María Martínez',
         'Mart nez': 'Martínez', 'Garc a': 'García', 'Vicu a': 'Vicuña', 'Puer to': 'Puerto', 'of ten': 'often'}
def fix(t):
    def rep(m):
        a, b = m.group(1), m.group(2)
        if not isword(b) and len(b) <= 3: return a + b
        if isword(a + b) and not (isword(a) and b.lower() in COMMON_T): return a + b
        return m.group(0)
    t = re.sub(r"\b([A-Za-z]*r) (t[a-z]*)\b", rep, t)
    for k in sorted(FIXES, key=len, reverse=True): t = t.replace(k, FIXES[k])
    t = t.replace('“ ', '“').replace(' ”', '”')
    return t
def paragraphs(bands):
    paras, cur, prev = [], [], None
    for b in bands:
        if prev is not None and (prev['p'] != b['p'] or prev['bot'] - b['top'] > 8):
            if prev['p'] == b['p'] or True:
                paras.append(cur); cur = []
        cur.append(b['t']); prev = b
    if cur: paras.append(cur)
    out = []
    for p in paras:
        s = ''
        for line in p:
            if not s: s = line
            elif s.endswith('-') and not s.endswith(' -') and not s.endswith('—'): s = s + line
            else: s = s + ' ' + line
        out.append(fix(s.strip()))
    return [p for p in out if p]
# Page-continued text: a page break inside one paragraph shouldn't split it. Merge paragraphs split only by page.
def paragraphs2(bands):
    # Bullet notes: items start indented (x0 30-44, the bullet itself isn't in the text layer); continuations sit further in.
    paras, cur, prev = [], [], None
    for b in bands:
        bullet = 30 <= b['x0'] < 44
        brk = prev is not None and ((prev['p'] == b['p'] and prev['bot'] - b['top'] > 8) or bullet or (prev.get('_b') and b['x0'] < 30))
        b = dict(b, _b=bullet or (prev is not None and prev.get('_b') and b['x0'] >= 44))
        if brk: paras.append(cur); cur = []
        cur.append(('• ' if bullet else '') + b['t']); prev = b
    if cur: paras.append(cur)
    return [fix(' '.join(p).replace('  ', ' ').strip()) for p in paras if ' '.join(p).strip()]
def clean_line(b):
    t = b['t']; h = b['top'] - b['bot']
    if not t or not (6 <= h <= 12): return False
    if re.search(r'\s[,.?;:)]|\(\s|\s\s|^[,.?;:]', t): return False
    return b['k'][1] - len(t.split()) - (1 if 30 <= b['x0'] < 44 else 0) <= 0

def mixed_prompt(bands, name):
    # Reading and Writing: prose stays text; tables/graphs (with their titles and labels) become one image each.
    lab = []
    for i, b in enumerate(bands):
        h = b['top'] - b['bot']
        if not b['t'] or h > 13 or h < 5: lab.append('F')
        elif (b['x0'] <= 21 and (b['x1'] - b['x0']) >= 300) or 30 <= b['x0'] < 44: lab.append('P')
        else: lab.append('A')
    for i in range(len(bands)):
        if lab[i] == 'A' and i and lab[i - 1] == 'P' and bands[i - 1]['p'] == bands[i]['p'] and bands[i - 1]['bot'] - bands[i]['top'] < 8:
            lab[i] = 'P'
    items, i, k = [], 0, 0
    while i < len(bands):
        if lab[i] == 'P':
            j = i
            while j < len(bands) and lab[j] == 'P': j += 1
            items += paragraphs2(bands[i:j]); i = j; continue
        j = i
        while j < len(bands) and lab[j] != 'P': j += 1
        run = bands[i:j]
        if 'F' in lab[i:j]:
            items.append({'img': img(f'{name}-f{k}' if k else f'{name}-f', run, x0=min(b['x0'] for b in run) - 4)}); k += 1
        else:
            items += paragraphs2(run)
        i = j
    return items

def has_figure(bands):
    return any(b['t'] == '' or (b['top'] - b['bot']) > 13 or (b['top'] - b['bot']) < 5 for b in bands)

PDF = {os.path.basename(x)[:-4]: x for x in __import__('glob').glob(f'{S}/qb/*.pdf')}
OUT = f'{S}/bank'
os.makedirs(f'{OUT}/img', exist_ok=True)
SECRET = 'iw-sat-bank-2026'
jobs = []
def segs(bands, x0=16, pad=2.5, minx=None):
    by = collections.OrderedDict()
    for b in bands: by.setdefault((b['f'], b['p']), []).append(b)
    out = []
    for (f, p), bs in by.items():
        top = max(b['top'] for b in bs) + pad; bot = min(b['bot'] for b in bs) - pad
        x1 = max(b['x1'] for b in bs) + 3
        out.append((f, p, x0 if minx is None else minx, top, max(x1, (x0 if minx is None else minx) + 20), bot))
    return out
def img(name, bands, x0=16):
    res = []
    for k, (f, p, a, top, b, bot) in enumerate(segs(bands, x0)):
        fn = f'{name}-{k}.png' if k else f'{name}.png'
        jobs.append([PDF[f], p, float(a), float(top), float(b), float(bot), f'{OUT}/img/{fn}'])
        res.append({'src': fn, 'w': round((b - a), 1), 'h': round(top - bot, 1)})
    return res

seen = set(); bank = []; keys = {}; stats = collections.Counter()
for q in qs:
    if q['id'] in seen: continue
    seen.add(q['id'])
    B = q['bands']
    math = q['test'] == 'Math'
    end_prompt = q['ians'] if q['type'] == 'mcq' else q['ica']
    pb = B[q['iq'] + 1:end_prompt]
    pb = [b for b in pb if not b['t'].startswith('Correct Answer')]
    rb = B[q['ir'] + 1:]
    e = {'id': q['id'], 'test': 'math' if math else 'rw', 'domain': q['domain'], 'skill': q['skill'], 'difficulty': q['difficulty'], 'type': q['type']}
    hid = hashlib.sha256((SECRET + q['id']).encode()).hexdigest()[:20]
    figure = has_figure(pb) or bool(re.search(r'underlined', ' '.join(b['t'] for b in pb), re.I))
    underlined = bool(re.search(r'underlined', ' '.join(b['t'] for b in pb), re.I))
    if math:
        if pb and all(clean_line(b) for b in pb):
            e['prompt'] = paragraphs2(pb); stats['math prompt text'] += 1
        else:
            e['prompt_img'] = img(f"{q['id']}-q", pb); stats['math prompt img'] += 1
    elif underlined:
        e['prompt_img'] = img(f"{q['id']}-q", pb); stats['rw prompt img (underlined)'] += 1
    elif figure:
        e['prompt'] = mixed_prompt(pb, q['id']); stats['rw prompt with figure'] += 1
    else:
        e['prompt'] = paragraphs2(pb); stats['rw prompt text'] += 1
    if q['type'] == 'mcq':
        L = q['letters'] + [q['ica'] if q['ica'] > q['letters'][-1] else q['ir']]
        opts = []
        for k in range(4):
            cb = B[L[k]:L[k + 1]]
            cb = [b for b in cb if not b['t'].startswith(('Correct Answer', 'Rationale'))]
            if has_figure(cb) or (math and not all(clean_line(b) for b in cb)):
                opts.append({'img': img(f"{q['id']}-{'abcd'[k]}", cb, x0=30)})
            else:
                t = fix(' '.join(b['t'] for b in cb).strip())
                t = re.sub(r'^[ABCD]\.\s*', '', t)
                opts.append({'text': t})
        e['options'] = opts
        if q['answer'] not in ('A', 'B', 'C', 'D'): stats['BAD mcq answer'] += 1; print('bad', q['id'], q['answer'])
        key = {'answer': 'ABCD'.index(q['answer']) if q['answer'] in 'ABCD' and len(q['answer']) == 1 else None}
    else:
        acc = [a.strip() for a in re.split(r',\s*', q['answer']) if a.strip()]
        if not acc: stats['BAD spr'] += 1
        key = {'accepted': acc}
    if has_figure(rb) or (math and not all(clean_line(b) for b in rb)):
        key['rationale_img'] = img(f'r-{hid}', rb)
    else:
        key['rationale'] = paragraphs2(rb)
    keys[q['id']] = key
    bank.append(e); stats[e['test'] + ' ' + e['type']] += 1
print(stats, len(jobs))
json.dump(bank, open(f'{OUT}/bank.json', 'w'), separators=(',', ':'))
json.dump(keys, open(f'{OUT}/keys.json', 'w'), separators=(',', ':'))
json.dump(jobs, open(f'{OUT}/jobs.json', 'w'))
print('bank KB', os.path.getsize(f'{OUT}/bank.json') // 1024, 'keys KB', os.path.getsize(f'{OUT}/keys.json') // 1024)
