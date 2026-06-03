# Full Test (Reading) specs

JSON specs for the **Full Test Practice** reading mocks, consumed by the
`html-ielts-reading-test` skill builder. These are the source of truth — to fix
a question or answer, edit the spec and rebuild; never hand-edit the HTML.

## Rebuild

```bash
BUILD=~/.claude/skills/html-ielts-reading-test/scripts/build_test.py
python3 "$BUILD" full-test-specs/volume9_test2.spec.json \
  public/reading/full_volume9_test2.html
```

Each test is a full 40-question, 60-minute, 3-passage exam. The builder
validates the answer key (must report 40/40 complete).

## Where it surfaces

Reading hub → **Full Test Practice** card (`/reading/full`) →
`src/components/reading/FullView.js`, which links each test to the standalone
HTML at `public/reading/<id>.html`. Add a test by building its HTML and
appending an entry to the `TESTS` array in `FullView.js`.

## Source-transcription notes (volume9_test2)

The supplied spec had several transcription artefacts that were corrected here:

- **UTF-8 mojibake** fixed: `Däniken` (was `DÃ¤niken`), en dashes, `A–H`.
- **MCQ option texts** had their first letter(s) chopped (Q24 A–F, Q36–38);
  reconstructed from context.
- **Numbering**: the "choose THREE" group is `mcq_multi` over boxes **24, 25,
  26** (Q26 was missing in the source); the key for each is the array
  `["B","D","F"]`. Part 3 then correctly starts at Q27.
- **Q27–30** is a word-bank summary (A poverty / B agriculture / C boats /
  D wood); answers are letters `27=D, 28=C, 29=A, 30=B`.
- **Q1–7** is `note_completion` with period sub-headings (Carnegie's Life →
  1835–1855, 1855–1865, …) and static (un-numbered) bullets between gaps.
- **Q14–15** and **Q20–23** render as checkmark **tables** (`display_mode:
  table`); Q20–23 adds `show_bank_legend: true` so the A–F "Types of
  Translation" legend appears under the table.
- **Q24–26** (`mcq_multi`) caps selection at three: once three are ticked the
  remaining options dim and disable.

These last items required small additions to the reading skill (a table
legend in `build_test.py`, and the checkbox-cap CSS/JS in the template,
ported from the listening skill). Rebuild with the updated skill to reproduce.
