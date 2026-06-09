#!/usr/bin/env python3
"""Extract a listening spec from a rendered CDI listening test HTML.

Structure-driven: it reads the page's markup (question-part / question-prompt /
answer-input / mcq-item / map-container) and the embedded `correctAnswers` object,
and emits a spec matching the React listening player. The CONTENT is whatever HTML
you pass in — sourcing and rights to it are yours.

    python3 tools/content-pipeline/extract_listening.py "<saved test>.html" out.json --title "Listening Test 2"

Audio isn't usually in the HTML (it's hosted separately), so audio_url is left
empty for you to fill (or run host-assets.mjs). Map images ARE captured as URLs
so host-assets can rehost them.
"""
import json, re, sys
from bs4 import BeautifulSoup

LETTERS = list('ABCDEFGHIJKLMNOP')


def text_clean(s):
    return re.sub(r'\s+', ' ', (s or '').replace('\xa0', ' ')).strip()


def strip_lead_num(s):
    return re.sub(r'^\s*\d+\s*[\.\)–\-]?\s*', '', s).strip()


def parse_answer_key(html):
    """The embedded `const correctAnswers = { q1: '...', q2: ['a','b'], ... }`."""
    m = re.search(r'correctAnswers\s*=\s*\{(.*?)\n\s*\}\s*;', html, re.S) \
        or re.search(r'correctAnswers\s*=\s*\{(.*?)\}\s*;', html, re.S)
    key = {}
    if not m:
        return key
    body = m.group(1)
    pat = re.compile(r"q(\d+)\s*:\s*(\[[^\]]*\]|'(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\")")
    for em in pat.finditer(body):
        n, raw = em.group(1), em.group(2).strip()
        if raw.startswith('['):
            vals = [a or b for a, b in re.findall(r"'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\"", raw)]
            key[n] = '|'.join(v.strip() for v in vals if v.strip())
        else:
            key[n] = raw[1:-1].strip()
    return key


def qnum_of(el):
    idv = el.get('id', '') or el.get('name', '')
    m = re.match(r'q(\d+)', idv)
    return int(m.group(1)) if m else None


def to_markers(node):
    """Return (html, [qnums]) with each answer-input replaced by a `___` marker."""
    clone = BeautifulSoup(str(node), 'html.parser')
    qnums = []
    for el in clone.find_all(['input', 'select']):
        n = qnum_of(el)
        if n is not None:
            qnums.append(n)
            el.replace_with('___')
    return clone.decode_contents() if clone.name else str(clone), qnums


def instructions_html(prompt):
    """The instruction <p>s, minus the redundant 'Questions X–Y' line."""
    out = []
    for p in prompt.find_all('p', recursive=False):
        if re.match(r'\s*questions?\b', p.get_text(), re.I):
            continue
        out.append(str(p))
    return '\n'.join(out)


def select_options(sel):
    return [o['value'] for o in sel.find_all('option') if o.get('value')]


def item_prompt(sel):
    """Text of the row/bullet a <select> sits in, minus the select and the number."""
    cont = sel.find_parent(['li', 'tr']) or sel.parent
    c = BeautifulSoup(str(cont), 'html.parser')
    for s in c.find_all('select'):
        s.decompose()
    return strip_lead_num(text_clean(c.get_text()))


def build_group(qdiv):
    prompt = qdiv.find('div', class_='question-prompt')
    instr = instructions_html(prompt) if prompt else ''

    # 1. map / plan / diagram labelling — has an image + letter selects
    map_div = qdiv.find('div', class_='map-container')
    selects = qdiv.find_all('select')
    if map_div and selects:
        img = map_div.find('img')
        questions = [{'number': qnum_of(s), 'prompt': item_prompt(s)} for s in selects]
        return {
            'type': 'map_labelling', 'instructions_html': instr,
            'image_url': img['src'] if img and img.get('src') else '',
            'image_alt': (img.get('alt') if img else '') or 'Labelling image',
            'bank': select_options(selects[0]),
            'questions': questions,
        }

    # 2. multiple choice — mcq-item blocks with radio options
    mcq_items = qdiv.find_all('div', class_='mcq-item')
    if mcq_items:
        questions = []
        for it in mcq_items:
            stem = it.find('p')
            n = qnum_of(it.find('input')) if it.find('input') else None
            opts = []
            for opt in it.find_all('div', class_='multi-choice-option'):
                inp = opt.find('input')
                lab = opt.find('label')
                opts.append({'letter': inp.get('value', ''), 'text': strip_lead_num(text_clean(lab.get_text())) if lab else ''})
            questions.append({'number': n, 'prompt': strip_lead_num(text_clean(stem.get_text())) if stem else '', 'options': opts})
        return {'type': 'mcq', 'instructions_html': instr, 'questions': questions}

    # 3. matching — letter selects + a bank box (no map image)
    if selects:
        bank = []
        box = qdiv.find('div', style=lambda s: s and 'background' in s)
        if box:
            for p in box.find_all('p'):
                st = p.find('strong')
                lt = st.get_text().strip() if st else ''
                if re.fullmatch(r'[A-Z]', lt):
                    bank.append({'letter': lt, 'text': re.sub(r'^\s*[A-Z]\s*', '', text_clean(p.get_text())).strip()})
        questions = [{'number': qnum_of(s), 'prompt': item_prompt(s)} for s in selects]
        return {'type': 'matching', 'instructions_html': instr,
                'bank': bank or [{'letter': l} for l in select_options(selects[0])], 'questions': questions}

    # body = the question div minus its prompt (for the completion variants)
    body = BeautifulSoup(str(qdiv), 'html.parser')
    bp = body.find('div', class_='question-prompt')
    if bp:
        bp.decompose()

    # 4. table completion — a <table> with inline inputs
    if body.find('table') and body.find(['input', 'select']):
        html, qnums = to_markers(body)
        title = body.find('p', class_='centered-title')
        return {'type': 'table_completion', 'instructions_html': instr,
                'layout': {'title': text_clean(title.get_text()) if title else None, 'body_html': html},
                'questions': [{'number': n} for n in qnums]}

    # 5. sentence completion — one <input> per <p> line
    p_lines = [p for p in body.find_all('p') if p.find('input')]
    if p_lines and not body.find('table'):
        questions = []
        for p in p_lines:
            html, qnums = to_markers(p)
            inner = strip_lead_num(BeautifulSoup(html, 'html.parser').decode_contents())
            if qnums:
                questions.append({'number': qnums[0], 'prompt_html': inner})
        return {'type': 'sentence_completion', 'instructions_html': instr, 'questions': questions}

    # 6. anything else with inputs — note/form completion via body_html
    if body.find(['input', 'select']):
        html, qnums = to_markers(body)
        return {'type': 'table_completion', 'instructions_html': instr,
                'layout': {'body_html': html}, 'questions': [{'number': n} for n in qnums]}

    return None


def build_spec(soup, html, title):
    parts = []
    for pdiv in soup.find_all('div', class_='question-part'):
        m = re.search(r'part-(\d+)', pdiv.get('id', ''))
        if not m:
            continue
        pn = int(m.group(1))
        header = pdiv.find('div', class_='part-header')
        sub = ''
        if header:
            ps = header.find_all('p')
            if len(ps) > 1:
                sub = text_clean(ps[1].get_text())
        groups = []
        for qdiv in pdiv.select('.questions-container > .question'):
            g = build_group(qdiv)
            if g and g.get('questions'):
                groups.append(g)
        parts.append({'part_number': pn, 'section_title': f'Section {pn}', 'section_subtitle': sub, 'question_groups': groups})

    key = parse_answer_key(html)
    total = sum(len(g['questions']) for p in parts for g in p['question_groups'])
    return {
        'title': title or text_clean((soup.title.get_text() if soup.title else '') or 'IELTS Listening Test'),
        'skill': 'listening',
        'duration_minutes': 30,
        'audio_url': '',
        'audio_note': 'Add the hosted audio URL (audio_url) — not present in the source HTML.',
        'answer_key_status': 'complete' if len(key) == total and total else 'partial',
        'answer_key': key,
        'parts': parts,
    }


def main():
    if len(sys.argv) < 2:
        print('usage: extract_listening.py <test.html> [out.json] [--title "..."]', file=sys.stderr)
        sys.exit(2)
    src = sys.argv[1]
    rest = sys.argv[2:]
    title = None
    if '--title' in rest:
        i = rest.index('--title')
        title = rest[i + 1] if i + 1 < len(rest) else None
        rest = rest[:i] + rest[i + 2:]
    out = rest[0] if rest else None

    html = open(src, encoding='utf-8').read()
    soup = BeautifulSoup(html, 'html.parser')
    spec = build_spec(soup, html, title)
    js = json.dumps(spec, indent=2, ensure_ascii=False)
    if out:
        open(out, 'w', encoding='utf-8').write(js + '\n')

    # structural report (no content echoed)
    total = sum(len(g['questions']) for p in spec['parts'] for g in p['question_groups'])
    types = {}
    for p in spec['parts']:
        for g in p['question_groups']:
            types[g['type']] = types.get(g['type'], 0) + 1
    print(f"\n{len(spec['parts'])} sections, {total} questions, {len(spec['answer_key'])} answers")
    print('  groups: ' + ', '.join(f'{k}×{v}' for k, v in sorted(types.items())))
    imgs = [g['image_url'] for p in spec['parts'] for g in p['question_groups'] if g.get('image_url')]
    if imgs:
        print(f"  {len(imgs)} labelling image(s) to host")
    print(f"  → {out}" if out else '  (no out file given)')
    print('')


if __name__ == '__main__':
    main()
