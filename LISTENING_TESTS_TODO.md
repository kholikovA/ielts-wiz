# 80 Listening Tests — Follow-up TODO

This is the punch list for cleaning up the auto-generated listening tests that
shipped in `public/tests/test_1.html` … `test_80.html`. The transcription
pipeline lives at `/tmp/ielts-listening/transcribe_all.py` (also kept under
`~/.claude/skills/html-ielts-listening-test/` as a reference).

## What's deployed

- All 80 HTML test files at `public/tests/test_N.html`.
- Tests **1, 3, 21, 41, 61** are hand-crafted (verified content, proper titles
  and answer keys).
- Tests **2, 4–20, 22–80** are auto-generated. Quality varies — see flags below.
- `ListeningPage.js` lists tests as `<a>` cards linking to the static HTML.
- The standalone HTML has a `Back` button at the bottom-left that returns to
  `https://ielts-wiz.com/listening/80-tests`.

## Tests that need manual review

### LOW confidence — definitely broken in places
- **Test 20** — Part 2. Has an mcq_multi (Q5–6) and a table (Q7–10); both
  degraded. The table needs to be re-transcribed; the mcq options may be empty.
- **Test 33** — Part 3. Q16–18 is mcq_multi "Choose THREE letters"; options
  may not have been extracted.
- **Test 52** — Part 3. Q23–26 is a letter-bank match ("What do the students
  decide about each topic?"); currently a degraded short-answer. Q27–30 is a
  table.

### MED confidence — worth spot-checking
4, 7, 11, 14, 26, 27, 29, 35, 36, 39, 42, 44, 48, 51, 53, 55, 70, 74.
Most are map labelling (Part 2) or letter-bank matching that fell back to
short-answer placeholders.

## Missing features that block more tests

1. **`letter_match` question type.** Many Part 2/3 questions show a bank of
   letters (A–G or A–I) above a numbered list, and the student writes the
   correct letter next to each item. The pipeline detects these and degrades
   them to short-answer with placeholders. Adding the renderer would unlock
   honest transcription of several MED tests.

2. **Map / plan images.** Part 2 tests frequently include a map or building
   plan with numbered pins. The PDF text doesn't expose the images. We need to
   source or recreate the maps, then wire them into the affected tests via the
   existing `map_labelling` type with `image_url` + pin coordinates.

3. **Real test titles for the remaining 75 tests.** Tests 1, 3, 21, 41, 61
   carry proper names (e.g. "Preston Park Run"). The other 75 just show
   `Part X / Test N`. Either copy the friendly titles from the old
   `src/data/listening-tests.js` (where they match the source), or pull them
   from the PDF on a per-test basis.

## Audio URLs

Every test points at
`https://raw.githubusercontent.com/kholikovA/80-listening-audios/main/TEST%20{N}.mp3`.
Confirm the repo has all 80 files actually present — any missing audio will
break that specific test.

## Re-running the pipeline

```bash
# Re-parse the PDF and rebuild every auto-generated test
python3 /tmp/ielts-listening/transcribe_all.py
BUILD=~/.claude/skills/html-ielts-listening-test/scripts/build_test.py
OUT=public/tests
for spec in /tmp/ielts-listening/specs/*.spec.json; do
  n=$(basename "$spec" .spec.json | sed 's/test_0*//')
  python3 "$BUILD" "$spec" "$OUT/test_${n}.html"
done

# Then re-apply the hand-crafted overrides (Tests 1, 3, 21, 41, 61) since the
# pipeline run above would overwrite them with the auto-generated versions.
for n in 1 3 21 41 61; do
  python3 "$BUILD" "/tmp/ielts-listening/test${n}.spec.json" "$OUT/test_${n}.html"
done
```

## Skill files

The reusable Claude skill that builds an individual test from a JSON spec lives
at `~/.claude/skills/html-ielts-listening-test/` — not in this repo. Update the
skill if the template (`assets/template.html`) needs styling changes; rebuild
all tests after any change to the template.
