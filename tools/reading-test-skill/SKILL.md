---
name: html-ielts-reading-test
description: Convert IELTS Academic Reading tests (delivered as PDFs, screenshots, photos, Word documents, or pasted text) into a fully interactive, Cambridge-CDI-style HTML file with timer, theme toggle, highlighter, draggable two-pane layout, drag-and-drop matching headings, table-based matching information, auto-grading, and band score calculation. Trigger this whenever the user uploads or pastes an IELTS reading test, mock test, or single passage and wants an HTML version they can take or share — even if they don't explicitly say "HTML." Phrases that should trigger include "convert this test," "make this an exam," "turn this into a reading test," "build the HTML," "make it interactive," or just uploading a Cambridge IELTS PDF/screenshot with no further instruction. Also trigger when the user uploads only an answer key alongside a previously discussed passage. Do not trigger for IELTS Listening, Writing, Speaking, or for non-IELTS reading materials.
---

# HTML IELTS Reading Test Builder

This skill produces a single self-contained HTML file that replicates the IELTSX / Computer-Delivered IELTS reading interface. Every test produced through this skill must look and behave identically — that consistency is the entire purpose.

## Core principle: never hand-write the HTML

The user has specified their preferred styling and behavior in detail. They do not want to renegotiate it on every invocation. The way to honor that:

1. **Always use the bundled template** at `assets/template.html`. Never reconstruct it.
2. **Always use the builder script** at `scripts/build_test.py`. It populates the template from a JSON spec.
3. **Your only creative work is producing the JSON spec** that accurately describes the source test.

If the template or script is missing from the working directory, copy them from this skill — never rebuild them from memory.

## Workflow

### Step 1 — Read the source

The user provides a PDF, screenshots/photos, a Word doc, pasted text, or a combination. Read with the appropriate tool. For multi-page PDFs, use the `pdf-reading` skill if needed.

When transcribing, capture:
- Section/passage divisions and titles
- Question ranges per group (`Questions 1–6`, `Questions 7–13`)
- The exact instruction text including word limits (`NO MORE THAN TWO WORDS`)
- Paragraph letters (A, B, C…) in the passage — **decide per part**. Include `letter` fields only when (a) the source visibly labels that part's paragraphs, or (b) that part has a paragraph-referencing group (matching headings, matching information, or matching features whose options are paragraphs) — those require letters. If a part's passage is plain prose with no labels and no such questions (common for Passage 1), transcribe it as plain paragraphs with **no** `letter` fields — do **not** invent an A–G ordering, or the renderer will show a pointless letter column.
- Italic subtitles ("Most organisations are looking for talent...") — these go in `passage_subtitle`
- The answer key (may be in the same file, a separate file, sent later, or absent)

### Step 1.5 — Ask the user for a test name

**Always ask for a name** before building, even if it adds a turn. Use a short message like:

> What name would you like for this test? (browser tab title and download filename)

If the user replies with a name, use it as the spec's `title`. If they decline or skip, default to:

- `IELTS Reading Full Test` for full 3-passage tests (40 questions)
- `IELTS Reading Passage N` for single passages (where N is the passage number if known, else `1`)

The same name is used for the output filename (slugified — lowercase, spaces → underscores, strip punctuation).

### Step 2 — Build the JSON spec

Read `references/spec_format.md` for the schema and per-type examples. Critical rules:

- **Question numbering is global** (1–40 across all three passages, never restart).
- **One blank per question** for completion types — split sentences with multiple gaps into separate questions.
- **Matching headings uses string IDs**, not roman numerals. Each heading_bank entry needs a unique `id` and the answer key references that id.
- **For matching information/features**, include a `feature_bank` and an optional `table_column_header`. The renderer produces a checkmark table.
- **For mcq_multi**, the option list lives only on the first question; subsequent questions in the group are stub entries (`{"number": 26}`). The answer key mirrors the same array onto every shared qnum.
- **Note completion uses `layout.sections`** for the title + sub-heading + bullets structure. Items can have `___` for inputs or be plain bullets without inputs (for fixed text).
- **Summary completion uses `layout.body_html`** — a single block of prose with `___` markers replaced left-to-right by the questions in order.
- **Preserve emphasis** with `<strong>` and `<em>` to match the source formatting.

#### Picking the right question type — read before transcribing any completion group

Completion-style groups all look similar in JSON, but the source page tells you which type to use. Choose by **layout shape on the page**, not by the word "complete" in the instructions.

| Source shows | Type |
|---|---|
| A bold/large **title** with **sub-headings** and **bulleted items** underneath — looks like notes | `note_completion` |
| Flowing **paragraph prose** with gaps inside it | `summary_completion` |
| **Numbered standalone sentences**, one per line, each with one gap | `sentence_completion` |
| A **bulleted list of questions** the test-taker must answer (often ends in a `?`) | `short_answer` |
| A **grid / rows-and-columns** layout | `table_completion` |
| **Boxes connected by arrows** | `flowchart_completion` |
| A **labeled picture or schematic** with gaps at the labels | `diagram_completion` |

**The note_completion trap.** When the instruction says "Complete the notes" and the source page shows a bold title (e.g. *Fund-raising campaigns*) with sub-section headings (e.g. *The first modern appeals*, *Financial matters*) and bullets underneath — that is `note_completion` with `layout.sections`. Do not flatten it into `short_answer` or `sentence_completion`. Doing so loses the title, the sub-headings, and any input-less fixed bullets between gaps (e.g. *"an appeal was made in the 1960s to help build the Student Union buildings"*).

Input-less bullets are included as items **without a `qnum`** — they render as plain text bullets that sit between the gapped ones, exactly as on the source page. They are not questions, do not appear in the questions array, and do not get an input field.

**Capture every sub-heading.** Transcribe **all** sub-section headings verbatim and in source order — including a heading whose bullets contain no gaps (give it a section with its context items, or an empty `items` list). A note section must never be silently dropped just because it has no numbered blank. After transcribing, sanity-check: the number of sub-headings and bullets in your `layout.sections` should match what's visible on the page.

### Step 3 — Handle answer keys

| Situation | Action | `answer_key_status` |
|---|---|---|
| Answer key in source | Transcribe into `answer_key` | `"complete"` |
| Answer key coming separately | Build without `answer_key`, ask user to share it, regenerate when received | `"missing"` |
| Partial key | Include what you have | `"partial"` |
| User asks you to guess answers | Decline — grading depends on the official key. Offer to build without grading; regenerate later. | n/a |

When status is not `"complete"`, the builder injects a yellow warning banner.

### Step 4 — Run the builder

Save the spec to `/home/claude/<test-name>.spec.json`, then:

```bash
python /path/to/scripts/build_test.py /home/claude/test.spec.json /mnt/user-data/outputs/<test-name>.html
```

The script prints a summary. Verify the question count matches the source (e.g. 40 for a full test). If it's off, fix the spec, not the HTML.

### Step 5 — Present the file

Use `present_files` with the HTML output. Keep the message brief — name the test, note total questions and duration, mention any banner warnings.

## House-style rendering rules (non-negotiable)

These are how each question type MUST look. They are the renderer defaults — do not set `display_mode` or otherwise override them unless the user explicitly asks.

- **`sentence_completion`** → a **bulleted list**. No visible question-number prefix; the number shows only inside the boxed input. (Never a numbered list.)
- **`matching_features` and `matching_info`** → a **checkmark table** (rows = statements, columns = bank letters; click a cell to tick). For `matching_features`, the option bank renders below the table as a **plain reference legend** (`A fish`, `B goats`, …) — a list, NOT draggable cards or buttons. **Never use dropdown/"buttons" mode** for matching questions.
- **`sentence_endings`** → **drag-and-drop**: draggable ending cards + a drop-zone gap (dashed box with the question number) after each stem. Each ending used once. (Never a dropdown.)
- **`matching_headings`** → drag-and-drop into the passage (unchanged).

If a freshly built test shows numbered sentence-completion, dropdown/button matching, or dropdown sentence-endings, the renderer regressed — fix `scripts/build_test.py`, do not hand-edit the HTML.

## Default behaviors

- **Duration.** 60 minutes for 40 questions, 20 minutes for shorter tests. Override via `duration_minutes` only when the source explicitly specifies.
- **Band scoring.** Shown only on full 40-question tests. Single passages show raw score and percentage only.
- **Theme.** Defaults to Light. Settings menu lets users switch to Dark or System.
- **Highlighter.** Always available. Selection produces a "Highlight" tooltip; clicking applies yellow background. Clicking a highlight removes it.
- **Submit.** Submit button → confirm modal showing answered/unanswered → confirm → results screen with per-question right/wrong comparison.
- **Footer.** Active part shows the full numbered palette with green underline on answered questions; inactive parts collapse to `Part N — 0/13`. Arrow buttons on the right step forward/back through every question.

## What this skill does NOT do

- Listening, Writing, or Speaking sections.
- Random test generation — this skill transcribes existing tests only.
- Editing tests after generation — for changes, edit the JSON spec and rebuild.

## Files in this skill

- `assets/template.html` — canonical HTML template. Single source of styling truth.
- `scripts/build_test.py` — populates the template from a JSON spec.
- `references/spec_format.md` — full schema with examples for every question type. Read before building your first spec, and refer back when you encounter an unfamiliar question type.
