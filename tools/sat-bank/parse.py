import os, json, re, collections
S = os.environ['SAT_WORK']
def stream(f):
    for p, w, h, bands in json.load(open(f'{S}/qb/{f}.bands.json')):
        for b in bands:
            yield {'f': f, 'p': p, 'top': b[0], 'bot': b[1], 'x0': b[2], 'x1': b[3], 't': b[4].strip(), 'k': b[5]}
qs = []
FILES = sorted(os.path.basename(x)[:-len('.bands.json')] for x in __import__('glob').glob(f'{S}/qb/*.bands.json'))
for f in FILES:
    cur = None
    for b in stream(f):
        m = re.match(r'^Question ID:\s*([0-9a-f]{8})$', b['t'])
        if m:
            cur = {'id': m.group(1), 'file': f, 'bands': []}; qs.append(cur); continue
        if cur is not None: cur['bands'].append(b)
print(len(qs), 'questions in', len(FILES), 'files')

DOMAINS = {
 'Math': ['Algebra', 'Advanced Math', 'Problem-Solving and Data Analysis', 'Geometry and Trigonometry'],
 'Reading and Writing': ['Information and Ideas', 'Craft and Structure', 'Expression of Ideas', 'Standard English Conventions'],
}
SKILLS = {
 'Algebra': ['Linear equations in one variable', 'Linear functions', 'Linear equations in two variables', 'Systems of two linear equations in two variables', 'Linear inequalities in one or two variables'],
 'Advanced Math': ['Nonlinear functions', 'Nonlinear equations in one variable and systems of equations in two variables', 'Equivalent expressions'],
 'Problem-Solving and Data Analysis': ['Ratios, rates, proportional relationships, and units', 'Percentages', 'One-variable data: Distributions and measures of center and spread', 'Two-variable data: Models and scatterplots', 'Probability and conditional probability', 'Inference from sample statistics and margin of error', 'Evaluating statistical claims: Observational studies and experiments'],
 'Geometry and Trigonometry': ['Area and volume', 'Lines, angles, and triangles', 'Right triangles and trigonometry', 'Circles'],
 'Information and Ideas': ['Central Ideas and Details', 'Inferences', 'Command of Evidence'],
 'Craft and Structure': ['Words in Context', 'Text Structure and Purpose', 'Cross-Text Connections'],
 'Expression of Ideas': ['Rhetorical Synthesis', 'Transitions'],
 'Standard English Conventions': ['Boundaries', 'Form, Structure, and Sense'],
}
def meta(t):
    t = t.replace('propor tional', 'proportional')
    low = t.lower()
    test = 'Math' if 'SAT Math' in t else 'Reading and Writing'
    dom = next(d for d in DOMAINS[test] if d in t)
    skill = next(s for s in sorted(SKILLS[dom], key=len, reverse=True) if s.lower() in low)
    diff = re.search(r'(Easy|Medium|Hard)\s*$', t).group(1)
    return test, dom, skill, diff

problems = collections.Counter()
out = []
for q in qs:
    B = q['bands']
    try:
        q['test'], q['domain'], q['skill'], q['difficulty'] = meta(B[0]['t'])
    except Exception as e:
        problems['meta'] += 1; continue
    T = [b['t'] for b in B]
    def find(pred, start=0):
        for i in range(start, len(B)):
            if pred(B[i]['t']): return i
        return -1
    iq = find(lambda t: t == 'Question')
    ica = find(lambda t: t.startswith('Correct Answer:'))
    ir = find(lambda t: t == 'Rationale' or t.startswith('Rationale'), max(ica, iq + 1))
    ians = find(lambda t: t == 'Answer', iq + 1)
    if iq < 0 or ir < 0: problems['labels'] += 1; q['bad'] = 'labels'; continue
    if ica < 0:
        ica = ir
        rat = ' '.join(b['t'] for b in B[ir + 1:])
        m = re.search(r'Choice ([ABCD]) is (correct|the best answer)', rat) or re.search(r'The correct answer is ([-0-9./]*\d[-0-9./]*(?:\s*(?:,|or)\s*[-0-9./]+)*)\.?(?:\s|$)', rat)
        if m and m.lastindex == 1 and not re.search(r'\d', m.group(1)): m = None
        if not m or 'either' in rat[:200] or not re.search(r'\d', m.group(1)):
            m2 = re.search(r'Note that ([-0-9./,\s]+(?:and|or)\s+[-0-9./]+) (?:are|is) examples? of ways to enter', rat) or re.search(r'The correct answer is either ([-0-9./,\s]+(?:or)\s+[-0-9./]+)', rat)
            if m2: m = m2
        q['answer'] = re.sub(r',?\s+(?:or|and)\s+', ', ', m.group(1)).strip(' ,.') if m else ''
        problems['answer from rationale'] += 1
        if not m: problems['no answer found'] += 1; q['bad'] = 'noanswer'
    else:
        q['answer'] = B[ica]['t'][len('Correct Answer:'):].strip()
    if ians > ica: ians = -1
    q['iq'], q['ians'], q['ica'], q['ir'] = iq, ians, ica, ir
    if ians >= 0:
        letters = []
        for L in 'ABCD':
            i = find(lambda t, L=L: re.match(rf'^{L}\.(\s|$)', t) is not None, (letters[-1] if letters else ians) + 1)
            letters.append(i)
        if -1 in letters or letters[-1] > ica: problems['choices'] += 1; q['bad'] = 'choices'; continue
        q['letters'] = letters
        q['type'] = 'mcq'
        if q['answer'] not in 'ABCD' or len(q['answer']) != 1: problems['mcqans'] += 1
    else:
        q['type'] = 'spr'
    problems['ok'] += 1
print(problems)
ids = collections.Counter(q['id'] for q in qs)
print('dupe ids', sum(1 for v in ids.values() if v > 1))
json.dump(qs, open(f'{S}/qb/parsed.json', 'w'))

# Answer key vs the rationale's own "Choice X is correct" (College Board errata show up here).
for q in qs:
    if q.get('type') != 'mcq' or q.get('ir') is None: continue
    rat = ' '.join(b['t'] for b in q['bands'][q['ir'] + 1:])
    m = re.search(r'Choice ([ABCD]) is (?:correct|the best answer)', rat)
    if m and m.group(1) != q['answer']:
        print(f"CHECK {q['id']}: key says {q['answer']}, rationale says {m.group(1)}")
