#!/usr/bin/env python3
"""Reverse-extract a reading spec from a built (current-template) test HTML.
Prompts/options/passage text are transcribed verbatim from the rendered HTML
(the corrected source); the answer key is taken verbatim from the embedded JSON.
Written for Volume 9 Test 3; covers the types it uses."""
import json, re, sys
from bs4 import BeautifulSoup

SRC = sys.argv[1]
OUT = sys.argv[2]
soup = BeautifulSoup(open(SRC).read(), 'html.parser')

def inner(tag):
    return tag.decode_contents().strip() if tag else ''

def clean_prompt(s):
    # Unwrap a single redundant <span> with no attributes (V9T3 wraps prompt text
    # in a bare span). Keeps the inner text/emphasis verbatim.
    frag = BeautifulSoup(s, 'html.parser')
    kids = [c for c in frag.children if not (isinstance(c, str) and not c.strip())]
    if len(kids) == 1 and getattr(kids[0], 'name', None) == 'span' and not kids[0].attrs:
        return kids[0].decode_contents().strip()
    return s

def prompt_of(qdiv):
    pr = qdiv.find('div', class_='question-prompt')
    if not pr:
        return ''
    pr = BeautifulSoup(str(pr), 'html.parser').find('div')
    num = pr.find('span', class_='question-number')
    if num: num.extract()
    return clean_prompt(inner(pr).strip())

def gaps_to_markers(container):
    """Replace each .gap-wrap with '___', return (html, ordered_qnums)."""
    c = BeautifulSoup(str(container), 'html.parser').find(True)
    qnums = []
    for gw in c.find_all('span', class_='gap-wrap'):
        f = gw.find(attrs={'data-qnum': True})
        qnums.append(int(f['data-qnum']))
        gw.replace_with('___')
    return inner(c), qnums

# ---- answer key + meta (verbatim) ----
ak = json.loads(soup.find('script', id='answerKey').string)
title = soup.title.string.strip()
dur = int(soup.find(attrs={'data-duration': True})['data-duration'])
spec = {
    'title': title,
    'duration_minutes': dur // 60,
    'answer_key_status': 'complete',
    'test_kind': 'reading_full',
    'test_id': 'volume9_test3',
    'parts': [],
    'answer_key': ak,
}

passage_sections = soup.find_all('div', class_='passage-section')
question_sections = soup.find_all('div', class_='questions-section')

for pi, (psec, qsec) in enumerate(zip(passage_sections, question_sections), start=1):
    part = {'part_number': pi}
    part['passage_title'] = inner(psec.find('h1', class_='passage-title'))
    sub = psec.find('div', class_='passage-subtitle')
    if sub: part['passage_subtitle'] = inner(sub)

    body = psec.find('div', class_='passage-body')
    gap_qnum_to_letter = {}  # matching_headings: paragraph qnum -> letter
    paras = []
    if body.find('div', class_='para-row'):
        # Lettered passage (matching info/features, or V9T3's matching-headings
        # which keeps letters AND a heading-gap inside each row).
        for row in body.find_all('div', class_='para-row', recursive=False):
            let = inner(row.find('div', class_='para-letter'))
            p = row.find('p')
            paras.append({'letter': let, 'text': inner(p) if p else ''})
            hg = row.find('div', class_='heading-gap')
            if hg and hg.get('data-qnum'):
                gap_qnum_to_letter[int(hg['data-qnum'])] = let
    elif body.find('div', class_='heading-gap'):
        # Gaps directly above each <p>; assign letters by order.
        letter = ord('A'); pending_gap = None
        for el in body.find_all(['div', 'p'], recursive=False):
            if el.name == 'div' and 'heading-gap' in (el.get('class') or []):
                pending_gap = int(el['data-qnum'])
            elif el.name == 'p':
                let = chr(letter); letter += 1
                paras.append({'letter': let, 'text': inner(el)})
                if pending_gap is not None:
                    gap_qnum_to_letter[pending_gap] = let; pending_gap = None
    else:
        for p in body.find_all('p', recursive=False):
            paras.append(inner(p))
    part['passage_paragraphs'] = paras

    groups = []
    for g in qsec.find_all('div', class_='question-group', recursive=True):
        t = g['data-type']
        grp = {'type': t}
        instr = g.find('div', class_='question-group-instructions')
        grp['instructions_html'] = inner(instr)
        qs = []

        if t in ('tfng', 'yng'):
            for q in g.find_all('div', class_='question', recursive=False):
                if 'hidden' in (q.get('class') or []): continue
                qs.append({'number': int(q['data-qnum']), 'prompt': prompt_of(q)})

        elif t == 'mcq':
            for q in g.find_all('div', class_='question', recursive=False):
                if 'hidden' in (q.get('class') or []): continue
                opts = []
                for li in q.select('ul.options-list li'):
                    inp = li.find('input')
                    txt = li.find_all('span')[-1]
                    opts.append({'letter': inp['value'], 'text': inner(txt)})
                qs.append({'number': int(q['data-qnum']), 'prompt': prompt_of(q), 'options': opts})

        elif t == 'mcq_multi':
            primary = g.find('div', class_='question')
            cbs = primary.select('ul.options-list li')
            shared = json.loads(primary.find('input', attrs={'data-qnums': True})['data-qnums'])
            opts = []
            for li in cbs:
                inp = li.find('input'); txt = li.find_all('span')[-1]
                opts.append({'letter': inp['value'], 'text': inner(txt)})
            qs.append({'number': int(primary['data-qnum']), 'prompt': prompt_of(primary), 'options': opts})
            for n in sorted(shared):
                if n != int(primary['data-qnum']):
                    qs.append({'number': n})

        elif t == 'matching_headings':
            bank = [{'id': c['data-heading-id'], 'text': inner(c)}
                    for c in g.select('.heading-bank-list .heading-card')]
            grp['heading_bank'] = bank
            for q in g.find_all('div', class_='question'):
                n = int(q['data-qnum'])
                qs.append({'number': n, 'paragraph': gap_qnum_to_letter.get(n)})

        elif t in ('matching_info', 'matching_features'):
            table = g.find('table', class_='match-table')
            if table:
                ths = table.select('thead th')
                grp['table_column_header'] = inner(ths[0])
                col_letters = [inner(th) for th in ths[1:]]
                legend = g.find('div', class_='match-legend')
                if legend:
                    grp['bank_title'] = inner(legend.find('div', class_='match-legend-title'))
                    grp['feature_bank'] = [
                        {'letter': inner(it.find('strong')), 'text': inner(it.find('span'))}
                        for it in legend.select('.match-legend-item')]
                    grp['show_bank_legend'] = True
                else:
                    grp['feature_bank'] = [{'letter': L, 'text': f'Paragraph {L}'} for L in col_letters]
                for tr in table.select('tbody tr'):
                    td = tr.find('td')
                    rn = td.find('span', class_='row-num')
                    if rn: rn.extract()
                    qs.append({'number': int(tr['data-qnum']), 'prompt': clean_prompt(inner(td))})
            else:
                # legacy dropdown mode (heading-bank + per-question <select>) →
                # transcribe to table-form spec; the player renders it house-style.
                bankdiv = g.find('div', class_='heading-bank')
                title_el = bankdiv.find('div', class_='heading-bank-title')
                if title_el: grp['bank_title'] = inner(title_el)
                fb = []
                for c in bankdiv.select('.heading-bank-list .heading-card'):
                    st = c.find('strong'); letter = st.get_text().strip(); st.extract()
                    fb.append({'letter': letter, 'text': c.get_text().replace('\xa0', ' ').strip()})
                grp['feature_bank'] = fb
                grp['show_bank_legend'] = (t == 'matching_features')
                for q in g.find_all('div', class_='question', recursive=False):
                    if 'hidden' in (q.get('class') or []): continue
                    pr = BeautifulSoup(str(q.find('div', class_='question-prompt')), 'html.parser').find('div')
                    num = pr.find('span', class_='question-number')
                    if num: num.extract()
                    sel = pr.find('select')
                    if sel: sel.extract()
                    qs.append({'number': int(q['data-qnum']), 'prompt': clean_prompt(inner(pr).strip())})

        elif t == 'summary_completion':
            layout = {}
            title_el = g.find('div', class_='completion-title')
            if title_el: layout['title'] = inner(title_el)
            wb = g.find('div', class_='completion-word-bank')
            if wb:
                layout['word_bank'] = [
                    {'letter': inner(it.find('strong')),
                     'text': it.decode_contents().split('&nbsp;')[-1].strip() or inner(it)}
                    for it in wb.select('.completion-word-bank-item')]
            prose = g.find('div', class_='completion-prose')
            body_html, qnums = gaps_to_markers(prose)
            layout['body_html'] = body_html
            grp['layout'] = layout
            qs = [{'number': n} for n in qnums]

        elif t in ('table_completion', 'flowchart_completion', 'diagram_completion'):
            layout = {}
            title_el = g.find('div', class_='completion-title')
            if title_el: layout['title'] = inner(title_el)
            # The layout wrapper is `.completion-layout` in standard builds but a
            # bare <div> in V9T3's hand-patched table — grab the table's parent.
            lay = g.find('div', class_='completion-layout')
            host = lay if lay else g.find('table').parent
            body_html, qnums = gaps_to_markers(host)
            layout['body_html'] = body_html
            grp['layout'] = layout
            qs = [{'number': n} for n in qnums]

        elif t == 'sentence_completion':
            for li in g.select('ul.note-list li.question'):
                body_html, qnums = gaps_to_markers(li)
                qs.append({'number': qnums[0], 'prompt_html': body_html})

        elif t == 'short_answer':
            for li in g.select('ul.short-answer-list li.question'):
                content = li.find('span', class_='sa-content')
                body_html, qnums = gaps_to_markers(content)
                qs.append({'number': qnums[0], 'prompt_html': body_html})

        else:
            print('UNHANDLED type:', t, file=sys.stderr); sys.exit(2)

        grp['questions'] = qs
        groups.append(grp)
    part['question_groups'] = groups
    spec['parts'].append(part)

# clean word-bank text fallback (strip &nbsp;)
json.dump(spec, open(OUT, 'w'), indent=2, ensure_ascii=False)
nq = sum(len(g['questions']) for p in spec['parts'] for g in p['question_groups'])
print(f'wrote {OUT}: parts={len(spec["parts"])} groups-types={[g["type"] for p in spec["parts"] for g in p["question_groups"]]} questions={nq} keys={len(ak)}')
