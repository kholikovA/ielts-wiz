# Reading-test builder (vendored skill)

This is a **version-controlled copy** of the `html-ielts-reading-test` Claude
skill that builds the interactive reading-test HTML pages in
`public/reading/`. It is the **canonical source of truth** for the builder and
the template, so the rendering fixes survive even if the global skill in
`~/.claude/skills/` is reset, reinstalled, or updated.

## Layout

```
tools/reading-test-skill/
  scripts/build_test.py        # spec JSON -> HTML
  assets/template.html         # single source of styling truth (CSS + JS)
  references/spec_format.md     # full JSON spec schema, per question type
  SKILL.md                     # skill instructions + house-style rules
  sync-to-global.sh            # copy this canonical copy back into ~/.claude/skills
```

## Build a test

```bash
python3 tools/reading-test-skill/scripts/build_test.py <spec.json> <output.html>
```

`build_test.py` locates `assets/template.html` relative to itself, so running
the vendored copy uses the vendored template automatically.

Rebuild every reading test that has a spec in the repo:

```bash
python3 tools/reading-test-skill/scripts/build_test.py full-test-specs/volume9_test2.spec.json   public/reading/full_volume9_test2.html
python3 tools/reading-test-skill/scripts/build_test.py full-test-specs/volume9_test4.spec.json   public/reading/full_volume9_test4_9a1f7c63.html
for n in 1 2 3 4; do
  python3 tools/reading-test-skill/scripts/build_test.py cambridge-specs/cambridge20/test$n.spec.json public/reading/cambridge20_test$n.html
done
python3 scripts/gen_test_meta.py
```

> Note: the `passage1_*`, `passage2_*`, `passage3_*` part-practice pages have no
> specs committed here (they were built from `/tmp` specs), so they can't be
> rebuilt from the repo.

## House-style rendering rules (do NOT regress)

These are the renderer defaults — never override them unless a user explicitly asks:

- **sentence_completion** -> bulleted list (native `<ul>` disc markers); no
  visible question-number prefix, the number shows only inside the input box.
- **matching_features / matching_info** -> checkmark **table** (rows =
  statements, cols = bank letters). `matching_features` also shows its bank
  below as a **plain legend list**. Never dropdown/"buttons".
- **sentence_endings** -> **drag-and-drop**: stems with drop-zone gaps first,
  the draggable endings bank below (no "Endings" title). Never a dropdown.
- **matching_headings** -> drag-and-drop into the passage.
- Ticking a matching-table cell must not shift the row (the checkmark space is
  always reserved).

## Keeping the global skill in sync

Edit the files **here** (the canonical copy), then push them to the live skill:

```bash
tools/reading-test-skill/sync-to-global.sh
```

Never edit the built HTML by hand — fix the spec or this builder/template and rebuild.
