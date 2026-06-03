#!/usr/bin/env python3
"""
build_test.py — Build an IELTSX-style HTML reading test from a JSON spec (v2).

USAGE
    python build_test.py <spec.json> <output.html>

See references/spec_format.md for the full JSON schema.
"""

import json
import sys
import re
import html as html_module
from pathlib import Path

# =============================================================================
# Question type renderers
# =============================================================================

def render_radio_options(qnum, options):
    """Radio-button list. options = ['TRUE','FALSE','NOT GIVEN'] or list of {letter, text}."""
    items = []
    for opt in options:
        if isinstance(opt, str):
            value = opt
            display = opt
        else:
            value = opt["letter"]
            display = f'{opt["text"]}'
        items.append(
            f'<li>'
            f'<label style="display:flex;gap:10px;align-items:flex-start;cursor:pointer;width:100%">'
            f'<input type="radio" name="q{qnum}" value="{escape_attr(value)}">'
            f'<span class="radio-circle"></span>'
            f'<span>{display}</span>'
            f'</label>'
            f'</li>'
        )
    return f'<ul class="options-list">{"".join(items)}</ul>'


def render_checkbox_options(qnums, options, group_id):
    """Multi-answer MCQ — square checkboxes; same answer recorded for all qnums."""
    qnums_json = json.dumps(qnums)
    items = []
    for opt in options:
        value = opt["letter"]
        display = f'{opt["text"]}'
        items.append(
            f'<li>'
            f'<label style="display:flex;gap:10px;align-items:flex-start;cursor:pointer;width:100%">'
            f'<input type="checkbox" data-group="{group_id}" data-qnums=\'{qnums_json}\' value="{escape_attr(value)}">'
            f'<span class="check-square"></span>'
            f'<span>{display}</span>'
            f'</label>'
            f'</li>'
        )
    return f'<ul class="options-list">{"".join(items)}</ul>'


def render_gap_input(qnum, wide=False):
    """Boxed input with question-number placeholder. Number disappears when typing starts."""
    cls = "gap-input wide" if wide else "gap-input"
    return (
        f'<span class="gap-wrap">'
        f'<input type="text" class="{cls}" data-qnum="{qnum}" autocomplete="off" spellcheck="false">'
        f'<span class="gap-num-placeholder">{qnum}</span>'
        f'</span>'
    )


def render_gap_select(qnum, options):
    """Dropdown gap for summary_completion with word_bank.
    options is a list of dicts like [{"letter": "A", "text": "..."}].
    The value submitted is the letter; the visible label is just the letter
    so the gap stays compact inside flowing prose.
    """
    opts_html = '<option value=""></option>' + "".join(
        f'<option value="{escape_attr(o["letter"])}">{o["letter"]}</option>'
        for o in options
    )
    return (
        f'<span class="gap-wrap">'
        f'<select class="gap-input gap-select" data-qnum="{qnum}">{opts_html}</select>'
        f'</span>'
    )


def replace_gaps(html_str, qnum, wide=False):
    """Replace each ___ in html_str with a gap input bound to qnum.
    If multiple ___ occur, they all get the same qnum (rare — usually one per question).
    """
    return html_str.replace("___", render_gap_input(qnum, wide=wide))


# =============================================================================
# Main per-type group renderers
# =============================================================================

def render_question_group(group, part_paragraphs, group_index):
    """Dispatch by type. Returns the HTML for the entire group."""
    qtype = group["type"]
    questions = group["questions"]
    qnums = [q["number"] for q in questions]
    instructions = group.get("instructions_html", "")
    # Always break before "NB" so it sits on its own line. Handles both leading-space
    # and no-space cases, and avoids duplicating an existing <br> if the spec already
    # broke it.
    instructions = re.sub(
        r"(?:<br\s*/?>\s*)*\s*(<strong>\s*NB\s*</strong>)",
        r"<br><br>\1",
        instructions,
    )

    # Group header range — singular if only one question
    if len(qnums) > 1:
        if qtype == "mcq_multi":
            header_range = "–".join([str(qnums[0]), str(qnums[-1])])
        else:
            header_range = f"{qnums[0]}\u2013{qnums[-1]}"
        header_label = f"Questions {header_range}"
    else:
        header_label = f"Question {qnums[0]}"

    parts = [
        f'<div class="question-group" data-type="{qtype}">',
        f'<div class="question-group-header">{header_label}</div>',
        f'<div class="question-group-instructions">{instructions}</div>',
    ]

    if qtype in ("tfng", "yng"):
        opts = ["TRUE", "FALSE", "NOT GIVEN"] if qtype == "tfng" else ["YES", "NO", "NOT GIVEN"]
        for q in questions:
            parts.append(
                f'<div class="question" data-qnum="{q["number"]}">'
                f'  <div class="question-prompt">'
                f'    <span class="question-number">{q["number"]}</span>'
                f'    <span>{q["prompt"]}</span>'
                f'  </div>'
                f'  {render_radio_options(q["number"], opts)}'
                f'</div>'
            )

    elif qtype == "mcq":
        for q in questions:
            prompt = q.get("prompt") or "(see options)"
            opts = q.get("options") or []
            parts.append(
                f'<div class="question" data-qnum="{q["number"]}">'
                f'  <div class="question-prompt">'
                f'    <span class="question-number">{q["number"]}</span>'
                f'    <span>{prompt}</span>'
                f'  </div>'
                f'  {render_radio_options(q["number"], opts)}'
                f'</div>'
            )

    elif qtype == "mcq_multi":
        # Single shared option list. Question stem prefixed with the qnum range.
        first_q = questions[0]
        stem = first_q.get("prompt", "")
        prefix = f"{qnums[0]}\u2013{qnums[-1]}" if len(qnums) > 1 else str(qnums[0])
        primary = first_q["number"]
        all_qnums = [q["number"] for q in questions]
        group_id = f"mc{primary}"
        parts.append(
            f'<div class="question" data-qnum="{primary}">'
            f'  <div class="question-prompt">'
            f'    <span class="question-number">{prefix}</span>'
            f'    <span>{stem}</span>'
            f'  </div>'
            f'  {render_checkbox_options(all_qnums, first_q["options"], group_id)}'
            f'</div>'
        )
        # Hidden placeholder questions for palette tracking
        for q in questions[1:]:
            parts.append(f'<div class="question hidden" data-qnum="{q["number"]}"></div>')

    elif qtype == "matching_headings":
        # Headings render as a draggable bank in the questions pane.
        # The actual paragraph gaps render in the passage pane (handled separately).
        bank = group["heading_bank"]
        parts.append('<div class="heading-bank">')
        parts.append('<div class="heading-bank-title">List of Headings</div>')
        parts.append('<div class="heading-bank-list">')
        for h in bank:
            heading_id = h["id"]
            text = h["text"]
            parts.append(
                f'<div class="heading-card" data-heading-id="{escape_attr(heading_id)}">{text}</div>'
            )
        parts.append('</div></div>')
        # Per-question palette markers (hidden in questions pane — actual gap is in passage)
        for q in questions:
            parts.append(f'<div class="question hidden" data-qnum="{q["number"]}"></div>')

    elif qtype in ("matching_info", "matching_features"):
        # Three display modes:
        #   "dragdrop" (default for matching_features): bank cards + drop zones per question.
        #   "table" (default for matching_info): rows = items, cols = bank letters; checkmark cells.
        #   "dropdown": visible bank list + each question stem followed by a select.
        bank = group.get("feature_bank", [])
        # HOUSE STYLE: both matching_info AND matching_features default to TABLE
        # mode — a checkmark grid (rows = statements, cols = bank letters), with
        # the bank rendered as a plain reference legend underneath. Never the old
        # "dropdown"/buttons look. Override per-group with
        # display_mode: "dragdrop" | "dropdown" only when a spec explicitly needs it.
        default_mode = "table"
        display_mode = group.get("display_mode", default_mode)

        if display_mode == "dragdrop":
            # Render the bank as draggable cards (reusing heading-bank classes), then each
            # question gets its prompt + a heading-gap drop zone next to its number.
            # The bank-reusable class signals to the JS that cards stay in the bank when used
            # (matching_features questions often allow same answer for multiple questions).
            # data-group scopes lookups: multiple banks (e.g. matching_features in different
            # parts) often share letter IDs A-D, so we tag each card+gap with a group key.
            qnums_in_group = sorted(q["number"] for q in questions)
            group_key = f"mf_{qnums_in_group[0]}_{qnums_in_group[-1]}"
            bank_title = group.get("bank_title", "List of options")
            parts.append(f'<div class="heading-bank bank-reusable" data-group="{group_key}">')
            parts.append(f'<div class="heading-bank-title">{bank_title}</div>')
            parts.append('<div class="heading-bank-list">')
            for item in bank:
                heading_id = item["letter"]
                parts.append(
                    f'<div class="heading-card" data-heading-id="{escape_attr(heading_id)}" '
                    f'data-group="{group_key}" data-reusable="true">'
                    f'<strong>{item["letter"]}</strong>&nbsp;&nbsp;{item["text"]}'
                    f'</div>'
                )
            parts.append('</div></div>')
            # Each question: prompt + inline drop zone (also tagged with the group)
            for q in questions:
                qn = q["number"]
                prompt = q.get("prompt", "")
                parts.append(
                    f'<div class="question matching-feature-row" data-qnum="{qn}">'
                    f'  <div class="question-prompt">'
                    f'    <span class="question-number">{qn}</span>'
                    f'    <span class="matching-feature-prompt">{prompt}</span>'
                    f'  </div>'
                    f'  <div class="heading-gap matching-feature-gap" data-qnum="{qn}" '
                    f'data-group="{group_key}">'
                    f'    <span class="heading-gap-num">{qn}</span>'
                    f'    <button class="heading-gap-clear" title="Clear">×</button>'
                    f'  </div>'
                    f'</div>'
                )

        elif display_mode == "dropdown":
            # Render bank as a labeled list, then each question as stem + select.
            bank_title = group.get("bank_title", "List of options")
            parts.append('<div class="heading-bank">')
            parts.append(f'<div class="heading-bank-title">{bank_title}</div>')
            parts.append('<div class="heading-bank-list">')
            for item in bank:
                parts.append(
                    f'<div class="heading-card" style="cursor:default">'
                    f'<strong>{item["letter"]}</strong>&nbsp;&nbsp;{item["text"]}'
                    f'</div>'
                )
            parts.append('</div></div>')
            for q in questions:
                qn = q["number"]
                prompt = q.get("prompt", "")
                options_html = '<option value=""></option>' + "".join(
                    f'<option value="{escape_attr(item["letter"])}">{item["letter"]}</option>'
                    for item in bank
                )
                parts.append(
                    f'<div class="question" data-qnum="{qn}">'
                    f'  <div class="question-prompt">'
                    f'    <span class="question-number">{qn}</span>'
                    f'    <span>{prompt} '
                    f'      <select class="gap-input" data-qnum="{qn}" style="min-width:60px;cursor:pointer;margin-left:6px">{options_html}</select>'
                    f'    </span>'
                    f'  </div>'
                    f'</div>'
                )
        else:
            # TABLE mode: rows = items, cols = bank letters; checkmark cells.
            col_label = group.get("table_column_header", "Information")
            parts.append('<table class="match-table">')
            parts.append('<thead><tr>')
            parts.append(f'<th>{col_label}</th>')
            for item in bank:
                parts.append(f'<th>{item["letter"]}</th>')
            parts.append('</tr></thead>')
            parts.append('<tbody>')
            for q in questions:
                qn = q["number"]
                prompt = q.get("prompt", "")
                parts.append(f'<tr data-qnum="{qn}" class="question" data-question-row="true">')
                parts.append(f'<td><span class="row-num">{qn}</span>{prompt}</td>')
                for item in bank:
                    parts.append(f'<td class="match-cell" data-letter="{escape_attr(item["letter"])}"></td>')
                parts.append('</tr>')
            parts.append('</tbody></table>')
            # Legend explaining what the column letters mean (needed when columns
            # are labels like A=fish/goats/oxen, not paragraphs). Rendered as a
            # plain reference list — table mode is not drag-and-drop, so the
            # options must not look like draggable cards/buttons. On by default for
            # matching_features (its letters are short labels); off for
            # matching_info (its columns are paragraph letters, self-explanatory).
            show_legend = group.get("show_bank_legend", qtype == "matching_features")
            if show_legend:
                legend_title = group.get("bank_title", "Options")
                parts.append('<div class="match-legend">')
                parts.append(f'<div class="match-legend-title">{legend_title}</div>')
                for item in bank:
                    parts.append(
                        f'<div class="match-legend-item">'
                        f'<strong>{item["letter"]}</strong><span>{item["text"]}</span></div>'
                    )
                parts.append('</div>')

    elif qtype == "sentence_endings":
        # DRAG-AND-DROP (house style): the endings are draggable cards; each sentence
        # stem gets its own drop-zone gap (a dashed box showing the question number).
        # Non-reusable — each ending is used once, like matching_headings. NOT a
        # dropdown. The stem carries no visible number; the number lives in the gap.
        bank = group.get("ending_bank", [])
        qnums_in_group = sorted(q["number"] for q in questions)
        group_key = f"se_{qnums_in_group[0]}_{qnums_in_group[-1]}"
        # Questions first: each stem + its inline drop zone, tagged with the group key.
        for q in questions:
            qn = q["number"]
            parts.append(
                f'<div class="question" data-qnum="{qn}">'
                f'  <div class="question-prompt"><span>{q["prompt"]}</span></div>'
                f'  <div class="heading-gap" data-qnum="{qn}" data-group="{group_key}">'
                f'    <span class="heading-gap-num">{qn}</span>'
                f'    <button class="heading-gap-clear" title="Clear">×</button>'
                f'  </div>'
                f'</div>'
            )
        # Endings bank rendered BELOW the questions, with no title (house style).
        parts.append(f'<div class="heading-bank ending-bank" data-group="{group_key}">')
        parts.append('<div class="heading-bank-list">')
        for item in bank:
            parts.append(
                f'<div class="heading-card" data-heading-id="{escape_attr(item["letter"])}" '
                f'data-group="{group_key}">{item["text"]}</div>'
            )
        parts.append('</div></div>')

    elif qtype == "sentence_completion":
        # Bulleted list (house style): each sentence is a bullet, NOT prefixed with
        # a visible question-number box. The number appears only inside the boxed
        # input (gap-num-placeholder). ___ becomes that boxed input. Navigation +
        # current-question highlight work via the .gap-input[data-qnum] target.
        parts.append('<ul class="note-list">')
        for q in questions:
            html_text = q.get("prompt_html", q.get("prompt", ""))
            html_text = replace_gaps(html_text, q["number"])
            parts.append(
                f'<li class="question" data-qnum="{q["number"]}">{html_text}</li>'
            )
        parts.append('</ul>')

    elif qtype == "summary_completion":
        # Use layout if provided; else flat prose with all questions in sequence.
        layout = group.get("layout", {})
        title = layout.get("title")
        if title:
            parts.append(f'<div class="completion-title">{title}</div>')
        # Optional word bank: a labeled list of choices A-I shown above the body.
        # Used when the instructions say "Complete the summary using the list of words, A-I below."
        word_bank = layout.get("word_bank")
        if word_bank:
            parts.append('<div class="completion-word-bank">')
            parts.append('<div class="completion-word-bank-title">List of words</div>')
            parts.append('<div class="completion-word-bank-grid">')
            for item in word_bank:
                parts.append(
                    f'<div class="completion-word-bank-item">'
                    f'<strong>{item["letter"]}</strong>&nbsp;&nbsp;{item["text"]}'
                    f'</div>'
                )
            parts.append('</div></div>')
        # Body: a single block of flowing prose containing inline gaps.
        body_html = layout.get("body_html")
        if body_html:
            # Replace ___ markers in order with each successive qnum.
            # If a word_bank exists, the gaps are A-I dropdowns; otherwise text inputs.
            for q in questions:
                if word_bank:
                    gap_html = render_gap_select(q["number"], word_bank)
                else:
                    gap_html = render_gap_input(q["number"])
                body_html = body_html.replace("___", gap_html, 1)
            parts.append(f'<div class="completion-prose">{body_html}</div>')
            # Hidden palette markers for each qnum
            for q in questions:
                parts.append(f'<div class="question hidden" data-qnum="{q["number"]}"></div>')
        else:
            # Fallback: each question on its own line
            for q in questions:
                ht = q.get("prompt_html", q.get("prompt", ""))
                ht = replace_gaps(ht, q["number"])
                parts.append(
                    f'<div class="question" data-qnum="{q["number"]}">'
                    f'  <div class="question-prompt">'
                    f'    <span class="question-number">{q["number"]}</span>'
                    f'    <span>{ht}</span>'
                    f'  </div>'
                    f'</div>'
                )

    elif qtype == "note_completion":
        # Hierarchical: title + sub-sections + bulleted items
        layout = group.get("layout", {})
        title = layout.get("title")
        sections = layout.get("sections", [])
        if title:
            parts.append(f'<div class="completion-title">{title}</div>')
        if sections:
            for sec in sections:
                heading = sec.get("heading", "")
                items = sec.get("items", [])
                parts.append('<div class="note-section">')
                if heading:
                    parts.append(f'<div class="note-section-heading">{heading}</div>')
                parts.append('<ul class="note-list">')
                for item in items:
                    if "qnum" in item:
                        qn = item["qnum"]
                        item_html = replace_gaps(item["html"], qn)
                    else:
                        # Non-input bullet (just informative text between gaps)
                        item_html = item["html"]
                    # `indent: true` renders the bullet as an indented sub-item
                    # with a dash marker (for nested notes, e.g. points under a
                    # named heading bullet).
                    li_cls = ' class="note-subitem"' if item.get("indent") else ''
                    parts.append(f'<li{li_cls}>{item_html}</li>')
                parts.append('</ul>')
                parts.append('</div>')
            # Hidden palette markers
            for q in questions:
                parts.append(f'<div class="question hidden" data-qnum="{q["number"]}"></div>')
        else:
            # Fallback: each question on its own line
            for q in questions:
                ht = q.get("prompt_html", q.get("prompt", ""))
                ht = replace_gaps(ht, q["number"])
                parts.append(
                    f'<div class="question" data-qnum="{q["number"]}">'
                    f'  <div class="question-prompt">'
                    f'    <span class="question-number">{q["number"]}</span>'
                    f'    <span>{ht}</span>'
                    f'  </div>'
                    f'</div>'
                )

    elif qtype in ("table_completion", "flowchart_completion", "diagram_completion"):
        # These have custom HTML/SVG layouts. Use prompt_html with one ___ per qnum.
        # If a single layout_html field exists, use that; else fall back to per-question prompts.
        layout = group.get("layout", {})
        layout_html = layout.get("body_html")
        title = layout.get("title")
        if title:
            parts.append(f'<div class="completion-title">{title}</div>')
        if layout_html:
            for q in questions:
                layout_html = layout_html.replace("___", render_gap_input(q["number"]), 1)
            parts.append(f'<div>{layout_html}</div>')
            for q in questions:
                parts.append(f'<div class="question hidden" data-qnum="{q["number"]}"></div>')
        else:
            for q in questions:
                ht = q.get("prompt_html", q.get("prompt", ""))
                ht = replace_gaps(ht, q["number"])
                parts.append(
                    f'<div class="question" data-qnum="{q["number"]}">'
                    f'  <div class="question-prompt">'
                    f'    <span class="question-number">{q["number"]}</span>'
                    f'    <span>{ht}</span>'
                    f'  </div>'
                    f'</div>'
                )

    elif qtype == "short_answer":
        # List with question numbers (not bullets), each item ends with a boxed input
        parts.append('<ul class="short-answer-list">')
        for q in questions:
            ht = q.get("prompt_html", q.get("prompt", ""))
            if "___" not in ht:
                ht = ht + " ___"
            ht = replace_gaps(ht, q["number"])
            parts.append(
                f'<li class="question" data-qnum="{q["number"]}">'
                f'<span class="sa-num">{q["number"]}</span>'
                f'<span class="sa-content">{ht}</span>'
                f'</li>'
            )
        parts.append('</ul>')

    else:
        parts.append(f'<div style="color:red">Unknown question type: {qtype}</div>')

    parts.append('</div>')
    return "".join(parts)


# =============================================================================
# Passage rendering
# =============================================================================

def find_matching_headings_groups(part):
    """Return a list of (group, qnum_to_paragraph_letter_map) for matching_headings groups."""
    result = []
    for g in part["question_groups"]:
        if g["type"] == "matching_headings":
            mapping = {q["number"]: q["paragraph"] for q in g["questions"]}
            result.append((g, mapping))
    return result


def render_passage_section(part):
    """Render the passage with paragraph letters (A, B, C…) and heading-gaps where applicable."""
    pnum = part["part_number"]
    title = part["passage_title"]
    subtitle = part.get("passage_subtitle", "")
    paragraphs = part["passage_paragraphs"]

    # Find any matching_headings groups to know which paragraphs need gap inputs
    mh_groups = find_matching_headings_groups(part)
    # paragraph_letter -> qnum
    paragraph_to_qnum = {}
    for _, mapping in mh_groups:
        for qn, plet in mapping.items():
            paragraph_to_qnum[plet] = qn

    body_parts = []
    for p in paragraphs:
        if isinstance(p, str):
            text = p
            letter = None
        else:
            text = p["text"]
            letter = p.get("letter")

        if letter:
            # Two-column layout: letter | content
            content_parts = []
            # If this paragraph is part of matching_headings, add a heading-gap above the text
            if letter in paragraph_to_qnum:
                qn = paragraph_to_qnum[letter]
                content_parts.append(
                    f'<div class="heading-gap" data-qnum="{qn}">'
                    f'<span class="heading-gap-num">{qn}</span>'
                    f'<button class="heading-gap-clear" title="Clear">×</button>'
                    f'</div>'
                )
            content_parts.append(f'<p>{text}</p>')
            body_parts.append(
                f'<div class="para-row">'
                f'<div class="para-letter">{letter}</div>'
                f'<div>{"".join(content_parts)}</div>'
                f'</div>'
            )
        else:
            body_parts.append(f'<p>{text}</p>')

    sub_html = f'<div class="passage-subtitle">{subtitle}</div>' if subtitle else ""

    return (
        f'<div class="passage-section" data-part="{pnum}">'
        f'  <h1 class="passage-title">{title}</h1>'
        f'  {sub_html}'
        f'  <div class="passage-body">{"".join(body_parts)}</div>'
        f'</div>'
    )


def render_questions_section(part):
    pnum = part["part_number"]
    qnums = collect_qnums(part)
    qrange = f"{qnums[0]}\u2013{qnums[-1]}"
    paragraphs = part["passage_paragraphs"]
    groups_html = "".join(
        render_question_group(g, paragraphs, i) for i, g in enumerate(part["question_groups"])
    )
    return (
        f'<div class="questions-section" data-part="{pnum}" '
        f'data-part-title="Reading Part {pnum}" data-part-range="{qrange}">'
        f'{groups_html}'
        f'</div>'
    )


def render_footer(parts_data):
    sections = []
    for part in parts_data:
        pnum = part["part_number"]
        # Find all qnum groups: regular (one qnum each) plus mcq_multi groups (range)
        # Build a list of (label, primary_qnum, all_qnums_in_group) entries
        entries = []
        used_qnums = set()
        for g in part["question_groups"]:
            if g["type"] == "mcq_multi":
                gnums = sorted({q["number"] for q in g["questions"]})
                if gnums:
                    label = f"{gnums[0]}\u2013{gnums[-1]}" if len(gnums) > 1 else str(gnums[0])
                    entries.append((label, gnums[0], gnums))
                    used_qnums.update(gnums)
        # Pick up the rest as individual entries
        all_qnums = collect_qnums(part)
        for q in all_qnums:
            if q in used_qnums:
                continue
            entries.append((str(q), q, [q]))
        # Sort by primary qnum
        entries.sort(key=lambda e: e[1])

        palette = "".join(
            f'<button class="q-btn" data-part="{pnum}" data-q="{primary}" '
            f'data-qnums=\'{json.dumps(group_qnums)}\'>{label}</button>'
            for label, primary, group_qnums in entries
        )
        # part-progress denominator: count actual question numbers (IELTS marks),
        # so a "Choose THREE" group (e.g. 24-26) counts as 3, not 1.
        denom = len(all_qnums)
        sections.append(
            f'<div class="part-section" data-part="{pnum}" data-questions="{json.dumps(all_qnums)}" '
            f'data-entry-count="{denom}">'
            f'  <span class="part-label">Part {pnum}</span>'
            f'  <span class="part-progress">0/{denom}</span>'
            f'  <div class="q-palette">{palette}</div>'
            f'</div>'
        )
    return "".join(sections)


def collect_qnums(part):
    nums = []
    for g in part["question_groups"]:
        if g["type"] == "note_completion" and "layout" in g:
            for sec in g["layout"].get("sections", []):
                for item in sec.get("items", []):
                    if "qnum" in item:
                        nums.append(item["qnum"])
        for q in g["questions"]:
            nums.append(q["number"])
    return sorted(set(nums))


def escape_attr(s):
    return str(s).replace('"', "&quot;").replace("'", "&#39;")


# =============================================================================
# Main
# =============================================================================

def derive_test_identity(spec, spec_path, output_path):
    """Return (test_kind, test_id) so the page can write to the namespaced
    completion store on submit. Resolution order:
      1. spec['test_kind'] / spec['test_id'] if explicitly set
      2. parse the output filename, e.g. passage1_3.html → (reading_p1, "3")
    """
    kind = spec.get("test_kind")
    tid = spec.get("test_id")
    if kind and tid is not None:
        return kind, str(tid)
    import re as _re
    for src in (Path(output_path).stem, Path(spec_path).stem.replace(".spec", "")):
        m = _re.match(r"^passage(\d+)_(\d+)$", src)
        if m:
            return f"reading_p{m.group(1)}", m.group(2)
        # Full 3-passage exams (Cambridge, named full tests) record under one
        # "reading_full" kind with a distinct id, so they sync + show in stats.
        m = _re.match(r"^cambridge(\d+)_test(\d+)$", src)
        if m:
            return "reading_full", f"cam{m.group(1)}_t{m.group(2)}"
        m = _re.match(r"^full_(.+)$", src)
        if m:
            return "reading_full", m.group(1)
    # Last resort: never leave it blank (blank = the page can't record results).
    return "reading_full", Path(output_path).stem


def build(spec_path: str, output_path: str, template_path: str = None):
    spec = json.loads(Path(spec_path).read_text(encoding="utf-8"))
    if template_path is None:
        template_path = Path(__file__).parent.parent / "assets" / "template.html"
    template = Path(template_path).read_text(encoding="utf-8")

    parts = spec["parts"]
    total_qs = sum(len(collect_qnums(p)) for p in parts)
    duration_min = spec.get("duration_minutes", 60 if total_qs == 40 else 20)
    duration_sec = duration_min * 60

    passages_html = "".join(render_passage_section(p) for p in parts)
    questions_html = "".join(render_questions_section(p) for p in parts)
    footer_html = render_footer(parts)
    answer_key = spec.get("answer_key", {})
    title = spec.get("title", "IELTS Reading Test")
    # Where the footer "Back" link returns to. Defaults to the reading section
    # on the live site; override per-spec if needed.
    back_url = spec.get("back_url", "https://ielts-wiz.com/reading")
    test_kind, test_id = derive_test_identity(spec, spec_path, output_path)

    # Supabase cross-device sync — anon key + URL are safe to embed (the
    # destination table is protected by RLS keyed on auth.uid()).
    import os
    supabase_url = (
        spec.get("supabase_url")
        or os.environ.get("IELTSWIZ_SUPABASE_URL")
        or "https://jaucbfremtxmanciflab.supabase.co"
    )
    supabase_anon_key = (
        spec.get("supabase_anon_key")
        or os.environ.get("IELTSWIZ_SUPABASE_ANON_KEY")
        or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphdWNiZnJlbXR4bWFuY2lmbGFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwODU2MTcsImV4cCI6MjA4NDY2MTYxN30.8unfikMze_UhgQL-ex5tutPTDgmQ0wP-tQBiCZATqTs"
    )

    out = (template
           .replace("{{TEST_TITLE}}", title)
           .replace("{{TIMER_SECONDS}}", str(duration_sec))
           .replace("{{TIMER_MINUTES}}", str(duration_min))
           .replace("{{TOTAL_QUESTIONS}}", str(total_qs))
           .replace("{{PASSAGE_SECTIONS}}", passages_html)
           .replace("{{QUESTION_SECTIONS}}", questions_html)
           .replace("{{FOOTER_PARTS}}", footer_html)
           .replace("{{BACK_URL}}", back_url)
           .replace("{{TEST_KIND}}", test_kind)
           .replace("{{TEST_ID}}", test_id)
           .replace("{{SUPABASE_URL}}", supabase_url)
           .replace("{{SUPABASE_ANON_KEY}}", supabase_anon_key)
           .replace("{{ANSWER_KEY_JSON}}", json.dumps(answer_key)))

    status = spec.get("answer_key_status", "complete")
    if status != "complete":
        provided = len(answer_key)
        warning = (
            f'<div style="background:#fef3c7;color:#92400e;padding:8px 16px;'
            f'text-align:center;font-family:sans-serif;font-size:13px;'
            f'border-bottom:1px solid #fbbf24">'
            f'⚠ Answer key {status}: {provided}/{total_qs} answers available. '
            f'Grading will mark unkeyed questions as incorrect.'
            f'</div>'
        )
        out = out.replace('<header class="topbar">', warning + '<header class="topbar">')

    Path(output_path).write_text(out, encoding="utf-8")
    print(f"Built: {output_path}")
    print(f"  Title: {title}")
    print(f"  Parts: {len(parts)}")
    print(f"  Questions: {total_qs}")
    print(f"  Duration: {duration_min} min")
    print(f"  Answer key: {len(answer_key)}/{total_qs} ({status})")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    build(sys.argv[1], sys.argv[2])
