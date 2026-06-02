# Cambridge IELTS 20 — Reading test specs

JSON specs for the four Cambridge 20 Academic Reading tests, consumed by the
`html-ielts-reading-test` skill builder. These are the source of truth — to fix
a question or answer, edit the spec and rebuild; never hand-edit the HTML.

## Rebuild

```bash
BUILD=~/.claude/skills/html-ielts-reading-test/scripts/build_test.py
for n in 1 2 3 4; do
  python3 "$BUILD" cambridge-specs/cambridge20/test${n}.spec.json \
    public/reading/cambridge20_test${n}.html
done
```

Each test is a full 40-question, 60-minute, 3-passage exam. Answer keys are
transcribed from the official book and validated by the builder (40/40 complete).

## Where it surfaces in the app

Reading hub → **Cambridge IELTS** card (`/reading/cambridge`) →
`src/components/reading/CambridgeView.js`, which links each test to the
standalone HTML at `public/reading/cambridge20_test{N}.html`.

## Source-transcription notes

- Test 3, Q22–23 (coral reefs): the source PDF mislabelled the option list
  (stem tagged "A", options B–F). Corrected here to proper A–E with answers B, D.
- Matching-headings (Test 3 Q14–19) use the roman numerals i–vii as bank IDs so
  the answer key maps cleanly to the official key.
