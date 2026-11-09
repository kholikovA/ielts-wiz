// =============================================================================
// ielts-import — turn an uploaded IELTS Reading/Listening test (PDF or HTML) into
// the JSON spec the site's React test players use (admins only).
//
//   POST { skill: "reading" | "listening", part: 1-4, file_name, pdf_path? , html? }
//     -> streamed: blank keep-alive lines, then one JSON line { result } | { error }
//
// The browser uploads a PDF to ielts-bank/imports/ once, then sends one request per
// part in parallel (3 reading passages, 4 listening sections), so a full test
// converts in about the time of one part. Each call transcribes ONE part verbatim
// plus its answer key; the hub merges the parts. Nothing is saved here: the admin
// previews the result in the real player, fixes anything, and saves it.
//
// Deploy with JWT verification on (the default):
//   supabase functions deploy ielts-import
// Secrets: ANTHROPIC_API_KEY, optional IELTS_IMPORT_MODEL (default claude-opus-5-5).
// =============================================================================

import Anthropic from "npm:@anthropic-ai/sdk@1.6.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encodeBase64 } from "jsr:@std/encoding@1/base64";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const MODEL = Deno.env.get("IELTS_IMPORT_MODEL") || "claude-opus-5-5";
const MAX_PDF_BYTES = 25 * 1024 * 1024;
const MAX_HTML_CHARS = 1_500_000;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const fail = (status: number, message: string, detail?: unknown) => {
  console.warn("ielts-import", status, message, detail ?? "");
  return new Response(JSON.stringify({ error: message }), { status, headers: { ...CORS, "content-type": "application/json" } });
};
const ok = (body: unknown) => new Response(JSON.stringify(body), { headers: { ...CORS, "content-type": "application/json" } });

const COMMON_RULES = `
Fidelity rules (most important):
- Transcribe VERBATIM: passage text, instructions, question wording, options, notes, table cells. Never paraphrase, summarise, correct, shorten or invent content. Keep British spelling, punctuation and capitalisation as in the source.
- Question numbers are global and must match the source exactly (e.g. Passage 2 starts at 14).
- Answer key: copy it from the document's answer key / answers section only. If the document has no answer for a question, leave that question out of "answer_key" and say so in "notes". Never work out answers yourself.
- Alternatives in the key ("factory / mill", optional words in brackets): keep every accepted form, separated by " / ". For optional words, list both forms, e.g. "(the) river" -> "river / the river".
- If something can't be represented (a picture, a diagram you can't redraw as text), keep the text you can and explain in "notes".
- Ignore page headers/footers, copyright lines, page numbers and publisher marks.
- HTML in *_html fields: only <strong>, <em>, <br>, <p>, <ul>, <li>, <table>, <thead>, <tbody>, <tr>, <th>, <td>. No classes, no scripts, no styles except on table cells as shown.
- Every gap is written as exactly three underscores: ___ (one gap per question, in question-number order within the group).
- Every group's "questions" array lists every question number in the group, even when the text lives in "layout".
- Do not copy the "Questions 1–6" heading into instructions_html (the player prints it); start with the instruction itself.
- Multiple-choice options: copy each option's ending punctuation exactly as printed. Options that complete the stem end with a full stop.
`;

const READING_FORMAT = `
You output ONE part (passage) of an IELTS Academic Reading test.

Part object:
{ "part_number": 1, "passage_title": "...", "passage_subtitle": "optional standfirst/intro line",
  "passage_paragraphs": [ "plain paragraph text", ... ]  OR  [ { "letter": "A", "text": "..." }, ... ],
  "question_groups": [ ... ] }
- Use the { letter, text } form only when the source labels paragraphs A, B, C… or a group refers to paragraph letters. Otherwise plain strings.
- Paragraph text is plain text (no HTML). Keep every paragraph, in order.

Question group types (field "type"):
- "tfng" / "yng": { type, instructions_html, questions: [ { number, prompt } ] }. Key: "TRUE"/"FALSE"/"NOT GIVEN" or "YES"/"NO"/"NOT GIVEN".
- "mcq": { type, instructions_html, questions: [ { number, prompt, options: [ { letter: "A", text } ] } ] }. Key: letter.
- "mcq_multi" (Choose TWO/THREE letters): first question carries prompt + options, the rest are { number } stubs. Key: the same array of letters on every number, e.g. "25": ["B","D"], "26": ["B","D"].
- "matching_headings": { type, instructions_html, heading_bank: [ { id: "i", text } ... ], questions: [ { number, paragraph: "B" } ] }. Use the roman numeral (lower case, e.g. "iv") as each heading id. Key: the heading id. The part's paragraphs must carry letters.
- "matching_info" (which paragraph contains…): { type, instructions_html, table_column_header: "Information", feature_bank: [ { letter: "A", text: "Paragraph A" } ... ], questions: [ { number, prompt } ] }. Key: letter.
- "matching_features" (match to people/dates/places list): { type, instructions_html, bank_title: "List of People", feature_bank: [ { letter, text } ], questions: [ { number, prompt } ] }. Key: letter.
- "sentence_endings": { type, instructions_html, ending_bank: [ { letter, text } ], questions: [ { number, prompt } ] }. Key: letter.
- "sentence_completion": { type, instructions_html, questions: [ { number, prompt_html: "text with ___ gap" } ] }.
- "short_answer": { type, instructions_html, questions: [ { number, prompt_html } ] }.
- "summary_completion": { type, instructions_html, layout: { title, body_html: "prose with ___ gaps", word_bank?: [ { letter, text } ] }, questions: [ { number } ] }. With a word list the key is the letter.
- "note_completion": { type, instructions_html, layout: { title, sections: [ { heading, items: [ { qnum, html: "text ___" } | { html: "plain line" } | { html, indent: true } ] } ] }, questions: [ { number } ] }.
- "table_completion": { type, instructions_html, layout: { title, body_html: "<table>…</table> with ___ gaps" }, questions: [ { number } ] }. Table cells: <th style='border:1px solid var(--border-strong);padding:8px;background:var(--table-header-bg)'> and <td style='border:1px solid var(--border-strong);padding:8px'>.
- "flowchart_completion": { type, instructions_html, layout: { title, body_html: "<p>step</p><p>↓</p><p>step with ___</p>" }, questions: [ { number } ] }.
- "diagram_completion": { type, instructions_html, needs_image: true, layout: { title, body_html: "<ul><li>label text ___</li></ul>" }, questions: [ { number } ] }. Write each gapped label as a list item; the admin adds the picture.

Top-level extras for reading: "explanations" (only when the answer key is in the document): { "<qnum>": { "evidence": "verbatim 5-30 word span copied character-for-character from ONE paragraph of this part", "part": <part_number>, "paragraph": <0-based index into passage_paragraphs>, "rationale": "1-2 plain sentences" } }. For mcq_multi key it on the group's first number.
`;

const LISTENING_FORMAT = `
You output ONE part (section) of an IELTS Listening test.

Part object:
{ "part_number": 1, "section_title": "Section 1" (or "Part 1"), "section_subtitle": "optional one-line context if the paper gives one",
  "passage_paragraphs": [ "transcript turn or paragraph", ... ],   // ONLY if the document contains the audioscript/transcript for this part, verbatim; otherwise omit
  "question_groups": [ ... ] }

Question group types (field "type"):
- "form_completion" / "note_completion": { type, instructions_html, layout: { title, sections: [ { heading, items: [ { qnum, html: "Label: text ___" } | { html: "plain line or Example: …" } ] } ] }, questions: [ { number } ] }. Use form_completion for label/value forms, note_completion for notes. Example lines are plain items (no qnum).
- "table_completion": { type, instructions_html, layout: { title, body_html: "<table>…</table> with ___ gaps" }, questions: [ { number } ] }. Table cells: <th style='border:1px solid var(--border-strong);padding:8px;background:var(--table-header-bg)'> and <td style='border:1px solid var(--border-strong);padding:8px'>.
- "summary_completion": { type, instructions_html, layout: { title, body_html: "prose with ___", word_bank?: [ { letter, text } ] }, questions: [ { number } ] }.
- "sentence_completion": { type, instructions_html, questions: [ { number, prompt_html: "text with ___" } ] }.
- "short_answer": { type, instructions_html, questions: [ { number, prompt_html } ] }.
- "flowchart_completion": { type, instructions_html, flowchart: { title, steps: [ { html: "step with ___", qnums: [26] } | { html: "plain step" } ] }, questions: [ { number } ] }. If the flow-chart has a word list, put it on each gapped step as "word_bank": [ { letter, text } ] and key the letter.
- "mcq": { type, instructions_html, questions: [ { number, prompt, options: [ { letter, text } ] } ] }. Key: letter.
- "mcq_multi" (Choose TWO/THREE letters): first question carries prompt + options, the rest are { number } stubs. Key: the same array on every number, e.g. "21": ["A","C"], "22": ["A","C"].
- "matching": { type, instructions_html, bank: [ { letter, text } ], questions: [ { number, prompt } ] }. Key: letter.
- "map_labelling" / "plan_labelling" / "diagram_labelling": { type, instructions_html, needs_image: true, image_url: "", image_alt: "short description", bank: [ "A", "B", … ] or [ { letter, text } ], questions: [ { number, prompt: "place name" } ] }. Key: letter. The admin adds the picture.
`;

function systemPrompt(skill: string) {
  return `You convert IELTS ${skill === "reading" ? "Academic Reading" : "Listening"} test papers into a precise JSON format for an online test player.
${skill === "reading" ? READING_FORMAT : LISTENING_FORMAT}
${COMMON_RULES}
Reply with ONE JSON object and nothing else (no markdown fences):
{
  "found": true,                       // false if the document has no part at the requested position
  "test_title": "title of the whole test as printed, e.g. 'Cambridge IELTS 18 Test 2 Reading'",
  "part": { ...part object... },
  "answer_key": { "<qnum>": "answer" | ["A","C"] },
  ${skill === "reading" ? '"explanations": { ... },\n  ' : ""}"notes": [ "short notes for the admin: anything missing, unclear or not representable" ]
}`;
}

type Block = Anthropic.Beta.BetaContentBlockParam;

async function extractPart(client: Anthropic, skill: string, source: Block, position: number, total: number) {
  const label = skill === "reading" ? "reading passage" : "listening part/section";
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 64000,
    thinking: { type: "adaptive" },
    output_config: { effort: "low" }, // transcription, not reasoning: keeps each part well inside the time limit
    betas: ["server-side-fallback-2026-07-01"],
    // Server-side fallback: if a safety classifier declines, another model finishes the job.
    fallbacks: "default",
    system: systemPrompt(skill),
    messages: [{
      role: "user",
      content: [
        source,
        {
          type: "text",
          text: `Convert only the ${ordinal(position)} ${label} in this document (counting in the order they appear; a full test has ${total}). ` +
            `Include its question groups, its answers from the answer key, and the test title. ` +
            `If the document has fewer than ${position} ${label}s, reply {"found": false}.`,
        },
      ],
    }],
  });
  const msg = await stream.finalMessage();
  if (msg.stop_reason === "refusal") throw new Error(`Part ${position}: the AI declined this document.`);
  if (msg.stop_reason === "max_tokens") throw new Error(`Part ${position}: the reply was cut off (too long).`);
  const text = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("\n");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error(`Part ${position}: the AI reply had no JSON.`);
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new Error(`Part ${position}: the AI reply couldn't be read.`);
  }
}

const ordinal = (n: number) => ["first", "second", "third", "fourth"][n - 1] ?? `${n}th`;

async function handle(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail(405, "POST only.");
  if (!ANTHROPIC_API_KEY) return fail(500, "The importer isn't set up yet (ANTHROPIC_API_KEY is missing).");

  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const { data: who } = await admin.auth.getUser(token);
  const user = who?.user;
  if (!user) return fail(401, "Sign in first.");
  const { data: isAdmin } = await admin.rpc("is_admin_user", { uid: user.id });
  if (!isAdmin) return fail(403, "Admins only.");

  let body: { skill?: string; file_name?: string; pdf_path?: string; html?: string; part?: number };
  try { body = await req.json(); } catch { return fail(400, "Bad request."); }
  const skill = body.skill === "listening" ? "listening" : body.skill === "reading" ? "reading" : null;
  if (!skill) return fail(400, "Choose Reading or Listening.");
  const total = skill === "reading" ? 3 : 4;
  const part = Number(body.part);
  if (!Number.isInteger(part) || part < 1 || part > total) return fail(400, "Bad part number.");

  let source: Block;
  if (body.pdf_path) {
    // The browser uploads the PDF to storage once; each part's request reads it from there.
    if (!/^imports\/[\w.-]+\.pdf$/.test(body.pdf_path)) return fail(400, "Bad file path.");
    const { data: blob, error } = await admin.storage.from("ielts-bank").download(body.pdf_path);
    if (error || !blob) return fail(404, "The uploaded PDF couldn't be read. Try again.", error?.message);
    if (blob.size > MAX_PDF_BYTES) return fail(413, "The PDF is too large (25 MB at most).");
    source = { type: "document", source: { type: "base64", media_type: "application/pdf", data: encodeBase64(new Uint8Array(await blob.arrayBuffer())) } } as Block;
  } else if (body.html) {
    if (body.html.length > MAX_HTML_CHARS) return fail(413, "The HTML file is too large. Save the page as 'HTML only' and try again.");
    source = { type: "text", text: `<document name="${String(body.file_name ?? "test.html").slice(0, 120)}">\n${body.html}\n</document>` };
  } else {
    return fail(400, "Attach a PDF or HTML file.");
  }

  // Converting a part takes a minute or two. The platform drops a request that sends
  // nothing for ~150s, so stream a blank line every few seconds and finish with one
  // JSON line: { result } or { error }. The client reads the last line.
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY, maxRetries: 2 });
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(enc.encode("\n"));
      const beat = setInterval(() => { try { controller.enqueue(enc.encode("\n")); } catch { /* closed */ } }, 5000);
      let line: unknown;
      try {
        line = { result: await extractPart(client, skill, source, part, total), model: MODEL };
      } catch (e) {
        console.warn("ielts-import part", part, e);
        line = { error: e instanceof Anthropic.APIError ? `Part ${part}: AI error (${e.status ?? "network"}). Try again.` : String((e as Error)?.message ?? e) };
      } finally {
        clearInterval(beat);
      }
      controller.enqueue(enc.encode(JSON.stringify(line) + "\n"));
      controller.close();
    },
  });
  return new Response(stream, { headers: { ...CORS, "content-type": "application/x-ndjson", "cache-control": "no-store" } });
}

Deno.serve((req) => handle(req).catch((e) => fail(500, "The import failed. Try again.", String(e?.stack ?? e))));
