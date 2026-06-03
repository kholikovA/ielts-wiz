# JSON Spec Reference (v2)

The build script `scripts/build_test.py` consumes a single JSON file describing the entire test. This document defines every field with examples for each Academic IELTS Reading question type.

## Top-level structure

```json
{
  "title": "Cambridge IELTS 19 — Test 1 — Reading",
  "duration_minutes": 60,
  "parts": [ ... ],
  "answer_key": { "1": "TRUE", "2": "FALSE", ... },
  "answer_key_status": "complete"
}
```

| Field | Required | Notes |
|---|---|---|
| `title` | yes | Browser tab title |
| `duration_minutes` | no | Default: 60 if total questions = 40, else 20 |
| `parts` | yes | Array of 1–3 part objects |
| `answer_key` | no | Map from question-number string to correct answer |
| `answer_key_status` | no | `"complete"`, `"partial"`, or `"missing"` — triggers warning banner if not complete |

## Part object

```json
{
  "part_number": 1,
  "passage_title": "The history of the picnic",
  "passage_subtitle": "An optional italic subtitle",
  "passage_paragraphs": [
    { "letter": "A", "text": "Picnics became popular..." },
    { "letter": "B", "text": "The French Revolution..." }
  ],
  "question_groups": [ ... ]
}
```

`passage_paragraphs` accepts plain strings or objects with `letter`. Decide **per part**: use the object form with `letter` only when (a) the source visibly labels that part's paragraphs A/B/C…, or (b) the part contains a paragraph-referencing group (matching headings / matching information / matching features over paragraphs), which require letters to line up. Otherwise use **plain strings** — do not auto-assign A–G to prose that has no labels and no paragraph questions. The renderer shows the letter column only for paragraphs that carry a `letter`, so omitting them yields clean prose.

## Answer key

```json
{
  "1": "TRUE",
  "2": "B",
  "3": "iv",
  "10": "discovery",
  "11": "factory / mill",          // multiple acceptable answers
  "20": ["A", "C"],                // multi-select MCQ — letters in any order
  "21": ["A", "C"],                // mirror the same array on each shared qnum
  "22": ["A", "C"]
}
```

Grading is case-insensitive and whitespace-tolerant. Multiple acceptable answers can be separated by `/` or `|`.

---

## Question types

### 1. True / False / Not Given (`tfng`)

```json
{
  "type": "tfng",
  "instructions_html": "Choose <strong>TRUE</strong> if the statement agrees with the information given in the text, choose <strong>FALSE</strong> if the statement contradicts the information, or choose <strong>NOT GIVEN</strong> if there is no information on this.",
  "questions": [
    { "number": 1, "prompt": "The hosts of early French picnics often asked their guests to play music." },
    { "number": 2, "prompt": "The picnic was brought to England by aristocrats escaping the French Revolution." }
  ]
}
```

Answer values: `"TRUE"`, `"FALSE"`, `"NOT GIVEN"`.

### 2. Yes / No / Not Given (`yng`)

Same shape as `tfng`. Used when source instructions reference the writer's claims rather than information. Answer values: `"YES"`, `"NO"`, `"NOT GIVEN"`.

### 3. Multiple Choice — single answer (`mcq`)

```json
{
  "type": "mcq",
  "instructions_html": "Choose the correct letter, <strong>A</strong>, <strong>B</strong>, <strong>C</strong> or <strong>D</strong>.",
  "questions": [
    {
      "number": 14,
      "prompt": "The writer suggests that the main reason picnics declined in the 1820s was",
      "options": [
        { "letter": "A", "text": "a series of bad harvests." },
        { "letter": "B", "text": "increasing urbanisation." },
        { "letter": "C", "text": "a change in social fashion." },
        { "letter": "D", "text": "concerns about hygiene." }
      ]
    }
  ]
}
```

### 4. Multiple Choice — multi-answer (`mcq_multi`)

For "Choose TWO letters" or "Choose THREE letters" prompts. Single shared option list rendered as **square checkboxes**. The first question carries the shared option list; subsequent questions in the group are stub entries.

```json
{
  "type": "mcq_multi",
  "instructions_html": "Choose <strong>TWO</strong> correct answers.",
  "questions": [
    {
      "number": 25,
      "prompt": "Which TWO of the following statements are true of Ray's early life?",
      "options": [
        { "letter": "A", "text": "His teacher recommended that he should go to university." },
        { "letter": "B", "text": "His school record was not exceptional in any way." },
        { "letter": "C", "text": "He was helped by a former student of Cambridge University." },
        { "letter": "D", "text": "His parents were both valued by the people in their local area." },
        { "letter": "E", "text": "He originally planned to take up his father's occupation." }
      ]
    },
    { "number": 26 }
  ]
}
```

Answer key (mirror the same array onto every shared qnum):

```json
{ "25": ["C", "D"], "26": ["C", "D"] }
```

The header range will display as `25–26` and the question stem will be prefixed with `25-26`.

### 5. Matching Headings (`matching_headings`) — DRAG-AND-DROP

The bank lives in the **questions pane**. Each paragraph in the **passage pane** gets a dashed-outline gap above it, into which the user drags a heading card.

```json
{
  "type": "matching_headings",
  "instructions_html": "The text has seven sections. Choose the correct heading for each section and move it into the gap.",
  "heading_bank": [
    { "id": "h1", "text": "Ray's account of his working methods" },
    { "id": "h2", "text": "The botanical expert who inspired Ray" },
    { "id": "h3", "text": "A succession of academic achievements" },
    { "id": "h4", "text": "Ray's informal tuition" },
    { "id": "h5", "text": "Ray's appreciation of his contemporary academic culture" },
    { "id": "h6", "text": "A childhood interest in plants" },
    { "id": "h7", "text": "Plans for a bold new project" },
    { "id": "h8", "text": "A description of the content of Ray's first book" },
    { "id": "h9", "text": "A change of direction for Ray" }
  ],
  "questions": [
    { "number": 14, "paragraph": "A" },
    { "number": 15, "paragraph": "B" },
    { "number": 16, "paragraph": "C" },
    { "number": 17, "paragraph": "D" },
    { "number": 18, "paragraph": "E" },
    { "number": 19, "paragraph": "F" },
    { "number": 20, "paragraph": "G" }
  ]
}
```

**Important rules:**
- Each `heading_bank` entry needs a unique `id` (any short string like `"h1"`, `"h2"` works).
- The `id` is what the answer key references — **not** roman numerals.
- `passage_paragraphs` for this part **must** include `letter` fields matching the `paragraph` values.
- The bank does NOT show roman numerals (the IELTSX style — headings are pill-shaped cards).

Answer key:

```json
{ "14": "h2", "15": "h6", "16": "h4", "17": "h5", "18": "h7", "19": "h8", "20": "h9" }
```

### 6. Matching Information / Matching Features (`matching_info`, `matching_features`)

Three display modes are available via `display_mode`. **HOUSE STYLE — both `matching_info` AND `matching_features` default to `"table"`.** Do NOT use dropdown ("buttons") for matching questions; the table is the standard look. Only set `display_mode` when you deliberately want a non-default mode.

**Table mode** (`"display_mode": "table"`, the default for both types): rendered as a checkmark table — rows = items, columns = bank letters. User clicks a cell to mark it (one cell per row). For `matching_features`, the bank is automatically shown beneath the table as a **plain reference legend** (e.g. `A fish`, `B goats`, `C oxen`) — a list, never draggable cards/buttons. The legend uses `bank_title` for its heading. For `matching_info` the legend is off by default (columns are paragraph letters, self-explanatory). Override with `"show_bank_legend": true|false`.

```json
{
  "type": "matching_info",
  "instructions_html": "The text has six sections labeled <strong>A–F</strong>. Which paragraph contains the following information? You may choose any letter more than once.",
  "table_column_header": "Information",
  "feature_bank": [
    { "letter": "A", "text": "Paragraph A" },
    { "letter": "B", "text": "Paragraph B" },
    { "letter": "C", "text": "Paragraph C" },
    { "letter": "D", "text": "Paragraph D" },
    { "letter": "E", "text": "Paragraph E" },
    { "letter": "F", "text": "Paragraph F" }
  ],
  "questions": [
    { "number": 27, "prompt": "disagreement with the view that employing talented people enables companies to achieve top performance" },
    { "number": 28, "prompt": "a description of what individuals have to do on a regular basis to improve their performance" }
  ]
}
```

A `matching_features` group needs nothing beyond `bank_title` + `feature_bank` + `questions` — it renders as a table with the legend automatically. Example:

```json
{
  "type": "matching_features",
  "instructions_html": "Choose the correct group, <strong>A–C</strong>, for each item. You may choose any group more than once.",
  "bank_title": "List of Researchers",
  "feature_bank": [
    { "letter": "A", "text": "Spector" },
    { "letter": "B", "text": "Oliphant" },
    { "letter": "C", "text": "Riley" },
    { "letter": "D", "text": "Hughes" },
    { "letter": "E", "text": "Bradshaw" },
    { "letter": "F", "text": "Yoshitomi" }
  ],
  "questions": [
    { "number": 20, "prompt": "Art activities can contribute to lowering negative incidents associated with juvenile crime." },
    { "number": 21, "prompt": "Art can bring money and visitors into a community." }
  ]
}
```

**Drag-drop mode** (`"display_mode": "dragdrop"`): each question has an inline drop zone that accepts a draggable card from the bank. Opt-in only — avoid for long question lists, since the bank scrolls out of view.

**Dropdown mode** (`"display_mode": "dropdown"`): a visible bank list above the questions, each statement followed by a `<select>`. Legacy/opt-in only — **never the default**; do not use it unless a spec explicitly asks for dropdowns.

Stick with the default (table) unless there's a specific reason not to. Answer values for all modes: bank letters (`"A"`, `"B"`, …).

### 7. Matching Sentence Endings (`sentence_endings`)

**DRAG-AND-DROP (house style).** The sentence stems (each with a dashed drop-zone gap showing its question number) render first; the bank of draggable ending cards sits **below** them with **no "Endings" title**. Each ending is used once (non-reusable). NOT a dropdown. The spec is unchanged — just `ending_bank` + `questions`; the renderer handles the drag-drop and ordering.

```json
{
  "type": "sentence_endings",
  "instructions_html": "Complete each sentence with the correct ending, <strong>A–G</strong>.",
  "ending_bank": [
    { "letter": "A", "text": "because they reflected aristocratic taste." },
    { "letter": "B", "text": "due to a shortage of indoor venues." },
    { "letter": "C", "text": "as a result of changing economic conditions." }
  ],
  "questions": [
    { "number": 22, "prompt": "Picnics initially became fashionable" },
    { "number": 23, "prompt": "The Pic Nic Society's gatherings were ostentatious" }
  ]
}
```

### 8. Sentence Completion (`sentence_completion`)

Rendered as a **bulleted list** (house style) — each sentence is a bullet, with **no visible question-number prefix**. The number appears only inside the boxed input. Place `___` (three underscores) where the gap should appear; the script replaces it with that boxed input bound to the question number.

```json
{
  "type": "sentence_completion",
  "instructions_html": "Complete the sentences below.<br>Choose <strong>NO MORE THAN TWO WORDS</strong> from the passage for each answer.",
  "questions": [
    { "number": 26, "prompt_html": "The Pic Nic Society was founded in ___ ." },
    { "number": 27, "prompt_html": "Members of the society had to bring a ___ to each meeting." }
  ]
}
```

### 9. Summary Completion (`summary_completion`) — flowing prose

Use the structured `layout` field. Place `___` markers in `body_html` in question-number order — they're replaced left-to-right with the question numbers in `questions`.

```json
{
  "type": "summary_completion",
  "instructions_html": "Complete the summary. Write <strong>ONE WORD ONLY</strong> from the text for each answer.",
  "layout": {
    "title": "A New Approach to Knowledge",
    "body_html": "John Ray was a scholar and self-taught botanist, whose work reflected the ___ that was taking place during the 17th century in people's way of thinking about the natural world. This new approach is the basis of the modern field of ___ . It represented a complete break from the ideas of Aristotle, which had dominated thinking up until that time. As Ray himself explained, his interest in plants was aroused after graduating, when he had to spend time outdoors after a period of ___ . He taught himself, in addition to many ___ and began compiling his catalogue of plants, which was published in 1660."
  },
  "questions": [
    { "number": 21 },
    { "number": 22 },
    { "number": 23 },
    { "number": 24 }
  ]
}
```

**With a word bank** ("Complete the summary using the list of words A–I below"): add a `word_bank` array to `layout`. The renderer shows the bank as a labeled grid above the body, and the gaps become A–I dropdowns instead of text inputs. Answer key values are bank letters (`"A"`, `"B"`, …).

```json
{
  "type": "summary_completion",
  "instructions_html": "Complete the summary using the list of words, <strong>A–I</strong> below.",
  "layout": {
    "title": "The CONNECT workshop",
    "word_bank": [
      { "letter": "A", "text": "presentations" },
      { "letter": "B", "text": "details" },
      { "letter": "C", "text": "efficiencies" },
      { "letter": "D", "text": "regulations" },
      { "letter": "E", "text": "interruptions" },
      { "letter": "F", "text": "expectations" },
      { "letter": "G", "text": "failures" },
      { "letter": "H", "text": "actions" },
      { "letter": "I", "text": "tools" }
    ],
    "body_html": "The concept behind the CONNECT program is that the ___ in communication experienced by engineers are due to their tendency to concentrate on technical ___ rather than adapt their approach to meet the ___ of their audience."
  },
  "questions": [
    { "number": 27 },
    { "number": 28 },
    { "number": 29 }
  ]
}
```

### 10. Note Completion (`note_completion`) — hierarchical sections

Use `layout.sections` for the title + sub-headings + bullet items structure (matches the IELTSX rendering style).

**When to choose `note_completion`:** the source page shows a bold title at the top, sub-section headings below it, and bullets under each sub-section. That layout — title + sub-heads + bullets — is the visual signal. If you only see numbered standalone sentences in a flat list, use `sentence_completion` instead. If the gaps sit inside flowing paragraph prose, use `summary_completion`.

**Input-less bullets.** Many real Cambridge notes include bullets that are not gaps — fixed context lines between gapped bullets (e.g. *"an appeal was made in the 1960s to help build the Student Union buildings"* sitting above a gapped bullet). Represent these as items **without a `qnum`**; they render as plain bullets and are not added to the questions array. Items with a `qnum` and a `___` marker render as bullets with a boxed input.

**Every gapped item MUST carry its real note text** (the words around the `___`), transcribed verbatim from the source. A bare `{ "html": "___", "qnum": N }` with no surrounding words is **incomplete source, not a buildable item** — do not ship it and do not invent the text; get the original wording. See the Source-fidelity rule in SKILL.md.

**Indented sub-bullets.** When the source nests points under a heading bullet (e.g. dashed sub-points beneath *"Major Walter C. Wingfield:"*), add `"indent": true` to each sub-item. It renders as an indented dash (`–`) sub-bullet. The parent line stays a normal bullet.

```json
{
  "type": "note_completion",
  "instructions_html": "Complete the notes. Write <strong>ONE WORD ONLY</strong> from the text for each answer.",
  "layout": {
    "title": "Changes in picnics",
    "sections": [
      {
        "heading": "In England",
        "items": [
          { "qnum": 7, "html": "In the 1800s, picnics began to be held ___" },
          { "qnum": 8, "html": "Picnics no longer usually included ___ for entertainment" }
        ]
      },
      {
        "heading": "In the USA",
        "items": [
          { "qnum": 9, "html": "Picnics were a favourite activity for people living in ___" },
          { "qnum": 10, "html": "American ___ of picnics were different from the ones by English artists" }
        ]
      },
      {
        "heading": "Return to France",
        "items": [
          { "qnum": 11, "html": "Indoor picnics were still preferred by members of the ___" },
          { "html": "20th century onwards" },
          { "html": "New kinds of transport meant that picnics in the countryside became more common" }
        ]
      }
    ]
  },
  "questions": [
    { "number": 7 }, { "number": 8 }, { "number": 9 }, { "number": 10 },
    { "number": 11 }
  ]
}
```

The `questions` list still needs to enumerate every qnum (used for footer palette tracking), even if their content lives inside `layout.sections.items`. Items **without a `qnum`** render as plain bullets — useful for fixed context lines between gaps.

### 11. Table / Flowchart / Diagram Completion (`table_completion`, `flowchart_completion`, `diagram_completion`)

Use `layout.body_html` to embed the table/flowchart/diagram HTML. Place `___` markers in qnum order. The renderer wraps it in `.completion-layout`, which constrains a wide table to the questions pane (fixed layout, wrapping cells, shrink-to-fit gap inputs) — you don't need to size it yourself.

```json
{
  "type": "table_completion",
  "instructions_html": "Complete the table. Choose <strong>NO MORE THAN TWO WORDS</strong> from the text for each answer.",
  "layout": {
    "title": "Picnic styles by era",
    "body_html": "<table style='width:100%;border-collapse:collapse'><thead><tr><th style='border:1px solid var(--border-strong);padding:8px;background:var(--table-header-bg)'>Period</th><th style='border:1px solid var(--border-strong);padding:8px;background:var(--table-header-bg)'>Setting</th><th style='border:1px solid var(--border-strong);padding:8px;background:var(--table-header-bg)'>Activity</th></tr></thead><tbody><tr><td style='border:1px solid var(--border-strong);padding:8px'>1780s</td><td style='border:1px solid var(--border-strong);padding:8px'>___</td><td style='border:1px solid var(--border-strong);padding:8px'>conversation</td></tr></tbody></table>"
  },
  "questions": [{ "number": 33 }]
}
```

For diagram completion, use an inline `<svg>` or an `<img>` and embed `___` next to labels.

### 12. Short Answer (`short_answer`)

Bulleted list, each item ends with a boxed input. If the prompt doesn't end with `___`, one is appended automatically.

```json
{
  "type": "short_answer",
  "instructions_html": "Answer the questions. Write <strong>NO MORE THAN TWO WORDS AND/OR A NUMBER</strong> from the text for each answer.",
  "questions": [
    { "number": 33, "prompt_html": "How many Western classical composers are identified as exceptionally talented?" },
    { "number": 34, "prompt_html": "Which composer initially received little recognition for his work?" },
    { "number": 35, "prompt_html": "Who can help improve the performance of people practising daily?" }
  ]
}
```

---

## Common transcription rules

- **Question numbering is global, not per-passage.** Cambridge tests run 1–40 across the three passages — never restart at 1 for Part 2.
- **One blank per question** for completion types. If a sentence has two blanks numbered 26 and 27, split it into two questions.
- **Preserve emphasis**: bold the word limits (`<strong>NO MORE THAN TWO WORDS</strong>`), choice letters (`<strong>A</strong>`), and key terms in instructions.
- **Italics**: use `<em>` for book titles, foreign words, and technical terms being defined within the passage.
- **Paragraph letters**: include them whenever the source uses them, even for question types that don't strictly require them.
