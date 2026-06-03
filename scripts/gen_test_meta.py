#!/usr/bin/env python3
"""Scan the built test HTML and emit src/data/test-meta.json:
  { "<filename-stem>": ["Question Type", ...], ... }
question types are the distinct .question-group data-types in order of
appearance. Run after adding/rebuilding tests:  python3 scripts/gen_test_meta.py
"""
import glob, json, re, os

LABELS = {
    "tfng": "True/False/Not Given", "yng": "Yes/No/Not Given",
    "mcq": "Multiple Choice", "mcq_multi": "Multiple Choice Many",
    "matching_info": "Matching Information", "matching_headings": "Matching Headings",
    "matching_features": "Matching Features", "sentence_endings": "Sentence Endings",
    "sentence_completion": "Sentence Completion", "summary_completion": "Summary Completion",
    "note_completion": "Note Completion", "table_completion": "Table Completion",
    "flowchart_completion": "Flow-chart Completion", "diagram_completion": "Diagram Completion",
    "short_answer": "Short Answer",
}
RX = re.compile(r'class="question-group" data-type="([a-z_]+)"')

def types_for(path):
    html = open(path, encoding="utf-8").read()
    seen, out = set(), []
    for t in RX.findall(html):
        if t in seen:
            continue
        seen.add(t)
        out.append(LABELS.get(t, t.replace("_", " ").title()))
    return out

meta = {}
for pat in ("public/reading/*.html", "public/tests/*.html"):
    for path in glob.glob(pat):
        stem = os.path.splitext(os.path.basename(path))[0]
        ts = types_for(path)
        if ts:
            meta[stem] = ts

os.makedirs("src/data", exist_ok=True)
with open("src/data/test-meta.json", "w", encoding="utf-8") as f:
    json.dump(meta, f, ensure_ascii=False, indent=0, sort_keys=True)
print(f"Wrote src/data/test-meta.json — {len(meta)} tests")
