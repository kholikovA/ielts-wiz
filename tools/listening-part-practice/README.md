# Listening Part Practice — 80 tests

Source of the static pages `public/tests/test_1.html` … `test_80.html` (one
10-question part each). Content is transcribed from *80 IELTS Listening
Tests* (Proper English School); the PDF itself is not in the repo.

| File | What it is |
|---|---|
| `content/part{1..4}.mjs` | The questions, test by test (Tests 1–20, 21–40, 41–60, 61–80) |
| `content/_h.mjs` | Shared instruction strings |
| `pdf-answers.json` | The book's answer key, parsed per test |
| `template.html` | Page shell: grading, review mode, result image, CDI styles |
| `build.mjs` | Renders content + key into `public/tests/test_N.html` |
| `verify.mjs` | Cross-checks the content against the PDF's text layer |
| `smoke.mjs` | Browser test: answers every question via the UI, expects 10/10 |

## Workflow

```sh
node tools/listening-part-practice/build.mjs [ids]
node tools/listening-part-practice/verify.mjs pdf_pages.json [ids] [--coverage]
python3 -m http.server 5077 --directory public &
npx -y -p playwright node tools/listening-part-practice/smoke.mjs [ids]
```

`pdf_pages.json` is an array of per-page strings from the PDF, e.g. from PyMuPDF
(`[p.get_text("text") for p in fitz.open(pdf)]`).

`build.mjs` refuses to write a page unless it has exactly the part's ten
question numbers, one control per question, a key entry for every question,
and valid option letters. `verify.mjs` checks that every title, label, cell,
item, option and box entry appears in that test's PDF pages in order. It also
checks that each gap sits next to the PDF's printed question number and that
the word limit matches. `--coverage` lists PDF text that no fragment covers,
which is how dropped lines show up.

## Question formats (computer-delivered IELTS)

- Form / notes / table / sentence / summary / flow-chart / short answer: typed gaps
- Map or diagram with blanks: typed gaps placed on the image (`imggaps`)
- Map or plan with letters, and A/B/C classification: radio grid (`grid`)
- Multiple choice: radios. "Choose TWO/THREE letters": checkboxes, one mark per correct letter
- "Choose N answers from the box": drag-and-drop, with click-to-place for touch and keyboard (`match`)
- "between … and …" style questions: one question, two boxes (repeat `{{n}}` + `join`)

## Answer keys

Grading: an unspaced `/` swaps single words (`5/five km` accepts "5 km" and
"five km"). A spaced ` / ` separates whole answers. `( )` marks optional text.
Where the printed key does not fit that format, the test's `fix` restates it
without changing what is accepted. "In either order" pairs are graded as a set.

## Corrections to the book

Each is declared as an `edit` on its test and printed by `verify.mjs`.

- Test 13: "Circle the correct letter" → "Choose…"; "Questions 3-8" → 3–10 (gaps run to 10)
- Test 14: "or the cabinet" → "of the cabinet"
- Test 16: "NO MORE THAT" → "NO MORE THAN"
- Test 14, 16, 18, 33, 37: "AND/OR NUMBER" → "AND/OR A NUMBER"
- Test 20: "free of change" → "free of charge"
- Test 22, 65: "Complete the questions below" → "Answer the questions below"
- Test 30: missing "Answer the questions below." added
- Test 33: "Which TWO activities…" → THREE (instruction and key ask for three letters)
- Test 38: Q12 is one question with two boxes ("between Friday and Sunday")
- Test 43: "Questions 21-22" → 21–25 (the flow-chart has five gaps)
- Test 46: "Kerina" → "Karina"
- Test 48, 67: "Complete the notes." → "Complete the notes below."
- Test 56: "Choose NO MORE THAN…" → "Write NO MORE THAN… AND/OR A NUMBER"
- Test 71: multiple-choice questions printed as 32–35 renumbered 31–34 (notes are 35–40; key is 31–34)
- Test 77: "strading" → "stranding"
- Answer key, Test 67: the key prints "39" twice; the first is 38 (entertainment)
