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
| `transcripts/test_N.txt` | Timed audio transcript with answer locations and explanations |
| `transcript.mjs` | Parser for the transcript format |
| `review.js`, `review.css` | Transcript review screen, inlined into every page |
| `smoke.mjs` | Browser test: answers every question via the UI, expects 10/10, opens the review |

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

Multiple-choice "Choose TWO/THREE" groups score one mark per correct letter
(the grader once looked for `data-type="mcq_multi"` only, so the `multi`
groups that `build.mjs` emits were scored all-or-nothing).

## Transcripts and review

After submitting, "Transcript & answer locations" opens a review screen: the
full transcript with every answer location highlighted and badged by result,
one row per question (your answer, the correct answer, the quoted evidence, a
short explanation), and an audio bar that plays from any line or answer
("Listen from m:ss"), with optional follow-along highlighting.

```
# comment
[12.4] One cue (usually one sentence), starting 12.4 s into the audio.
[15.0] Answer locations are marked inline: it's on the [[5|website]].
                                         <- blank line = new paragraph
@5 Why the answer is right / why the distractor is wrong.
!6 Reason the marked words need not contain the key.
```

`build.mjs` refuses a page unless each question is marked exactly once, the
markers run in question order, cue times never go backwards, and, for typed
gaps, the marked words contain an accepted answer (case, number words,
"the/of/a/an" and punctuation are ignored; `!n` exempts a question, e.g. when
the speaker spells the word out). In "Choose TWO/THREE" groups and either-order
pairs, the markers are numbered in the order the answers are heard.

The text started from the book's tapescripts and was checked line by line
against a Whisper transcription of each recording, with timings taken from
the audio. Where they disagreed the recording wins: the book drops several
intros and announcer lines, whole passages in Tests 6, 13, 15, 21, 34 and 60,
and gets some numbers wrong (Test 1 phone number, Test 16 price). Names keep
the book's spelling. Audio quirks: the Test 35 recording announces itself as
"Test 36"; the Test 25 and 71 recordings stop slightly early.

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
