// =============================================================================
// writing-mark — Claude's draft marking of a writing submission (teachers only).
//
//   POST { submission_id, force? }
//     Marks the essay against the four IELTS Writing criteria and lists exact
//     corrections. The draft goes to writing_ai_reviews (teacher-only); the
//     teacher edits it and sends it with review_submission. Cached per
//     submission unless `force`.
//
// Deploy with JWT verification on (the default):
//   supabase functions deploy writing-mark
// Secrets: ANTHROPIC_API_KEY, optional WRITING_MODEL (default claude-sonnet-5-5).
// Rubric adapted from the examiner tool (examiner.ielts-wiz.com, api/grade.js).
// =============================================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const MODEL = Deno.env.get("WRITING_MODEL") || "claude-sonnet-5-5";
const MAIN_SITE = "https://ielts-wiz.com";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const fail = (status: number, message: string, detail?: unknown) => {
  console.warn("writing-mark", status, message, detail ?? "");
  return new Response(JSON.stringify({ error: message }), { status, headers: { ...CORS, "content-type": "application/json" } });
};
const ok = (body: unknown) => new Response(JSON.stringify(body), { headers: { ...CORS, "content-type": "application/json" } });

function systemPrompt(isT1: boolean, minWords: number) {
  const first = isT1 ? "Task Achievement" : "Task Response";
  return `You are a senior, certified IELTS Writing examiner with 15+ years of experience. You mark ${
    isT1 ? "Academic Task 1 (report on visual data)" : "Task 2 (discursive essay)"
  } responses strictly according to the official public IELTS band descriptors. Be rigorous and realistic; do not inflate scores. Most real candidate scripts fall between band 5 and 7.

Assess these FOUR criteria, each on the 0-9 scale in 0.5 steps:
1. ${first}
2. Coherence & Cohesion
3. Lexical Resource
4. Grammatical Range & Accuracy

Anchor points:
- Band 5: meets the task only partially; ideas/data covered but with errors, omissions or limited detail; limited and repetitive vocabulary; frequent grammar errors that sometimes impede meaning; mechanical or faulty cohesion.
- Band 6: addresses the task with some development; generally organised but cohesion can be faulty/mechanical; adequate vocabulary with some errors; mix of simple and complex structures with frequent errors that rarely impede communication.
- Band 7: covers requirements with a clear, well-developed answer; logically organised with good (if occasionally faulty) cohesion; flexible vocabulary with some awareness of style/collocation and occasional errors; variety of complex structures, frequently error-free sentences, good control.
- Band 8: fully and appropriately covers the task; well-managed cohesion; wide, precise, natural vocabulary with rare slips; wide range of structures, the majority error-free.
- Band 9: fully extended, fully appropriate; effortless cohesion; full flexibility and precise vocabulary use; full range of structures with full accuracy apart from rare minor slips.

${isT1
    ? "For Task Achievement, check: a clear overview of main trends (essential; cap this criterion at band 5 if there is no overview), accurate selection of key features, correct reporting of figures, relevant comparisons, and no irrelevant detail or personal opinion."
    : "For Task Response, check: a clear position maintained throughout, all parts of the prompt addressed, ideas developed with support/examples, and a relevant conclusion."}

Penalise under-length responses (under ${minWords} words) under ${first}.

Also list the language errors as corrections. Each "quote" must be copied EXACTLY, character for character, from the candidate's response: the shortest stretch that shows the error (usually 1-6 words), unique enough to locate. "fix" is the corrected version of that same stretch. Cover grammar, vocabulary/collocation, spelling and punctuation errors, in order of appearance, at most 40. Do not "correct" British vs American spelling or acceptable stylistic choices.

Write comments to the student in plain, encouraging but honest English. You MUST record the result by calling the record_marking tool exactly once, with no other text.`;
}

const TOOL = {
  name: "record_marking",
  description: "Record the IELTS marking of the candidate's response.",
  input_schema: {
    type: "object",
    required: ["criteria", "summary", "next_steps", "corrections"],
    properties: {
      criteria: {
        type: "array", minItems: 4, maxItems: 4,
        items: {
          type: "object",
          required: ["name", "band", "comment"],
          properties: {
            name: { type: "string" },
            band: { type: "number", minimum: 0, maximum: 9 },
            comment: { type: "string", description: "2-3 sentences tied to the descriptors" },
            strengths: { type: "array", items: { type: "string" } },
            issues: { type: "array", items: { type: "string" } },
          },
        },
      },
      summary: { type: "string", description: "3-4 sentence overall verdict" },
      next_steps: { type: "array", items: { type: "string" }, description: "3 specific, actionable improvements" },
      corrections: {
        type: "array",
        items: {
          type: "object",
          required: ["quote", "fix", "type"],
          properties: {
            quote: { type: "string" },
            fix: { type: "string" },
            type: { type: "string", enum: ["grammar", "vocabulary", "spelling", "punctuation"] },
            note: { type: "string", description: "one short reason" },
          },
        },
      },
    },
  },
};

// IELTS overall: mean of the four, rounded to the nearest half band (.25 and .75 round up).
const overallBand = (bands: number[]) => {
  const mean = bands.reduce((a, b) => a + b, 0) / bands.length;
  return Math.floor(mean * 2 + 0.5) / 2;
};

serve(async (req) => {
  try {
    return await handle(req);
  } catch (e) {
    return fail(500, "Something went wrong on the server.", (e as Error)?.stack ?? String(e));
  }
});

async function handle(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail(405, "POST only.");
  if (!ANTHROPIC_API_KEY) return fail(500, "AI marking isn't set up yet (ANTHROPIC_API_KEY is missing).");

  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const { data: who, error: authError } = await admin.auth.getUser(token);
  const user = who?.user;
  if (!user) return fail(401, "Sign in first.", authError?.message);

  let body: { submission_id?: string; force?: boolean };
  try { body = await req.json(); } catch { return fail(400, "Bad request."); }
  if (!body.submission_id) return fail(400, "Missing submission_id.");

  const { data: sub } = await admin.from("submissions").select("id, body, assignment_id").eq("id", body.submission_id).maybeSingle();
  if (!sub) return fail(404, "Submission not found.");
  const { data: a } = await admin.from("assignments").select("teacher_id, kind, payload").eq("id", sub.assignment_id).maybeSingle();
  if (!a || a.teacher_id !== user.id) return fail(403, "Not your student's submission.");
  if (a.kind !== "writing") return fail(400, "Only writing can be marked.");

  if (!body.force) {
    const { data: cached } = await admin.from("writing_ai_reviews").select("result, model, created_at").eq("submission_id", sub.id).maybeSingle();
    if (cached) return ok(cached);
  }

  const essay = (sub.body ?? "").trim();
  const words = essay ? essay.split(/\s+/).length : 0;
  if (words < 20) return fail(400, "The response is too short to mark.");
  const p = a.payload ?? {};
  const isT1 = p.task === "Task 1";
  const minWords = Number(p.min_words) || (isT1 ? 150 : 250);

  const content: unknown[] = [];
  if (p.visual_url) {
    const url = String(p.visual_url).startsWith("http") ? p.visual_url : `${MAIN_SITE}${String(p.visual_url).startsWith("/") ? "" : "/"}${p.visual_url}`;
    content.push({ type: "image", source: { type: "url", url } });
  }
  content.push({
    type: "text",
    text: `TASK QUESTION:\n${p.prompt ?? "(not given)"}\n\nCANDIDATE RESPONSE (${words} words):\n${essay}`,
  });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      system: systemPrompt(isT1, minWords),
      tools: [TOOL],
      // Newer models reject forced tool_choice; the prompt asks for the tool,
      // and a plain JSON reply is accepted as a fallback below.
      tool_choice: { type: "auto" },
      messages: [{ role: "user", content }],
    }),
  });
  const out = await res.json().catch(() => null);
  if (!res.ok) {
    return fail(502, `AI marking failed (${res.status}): ${out?.error?.message ?? "upstream error"}`, out);
  }
  const call = (out?.content ?? []).find((c: { type: string }) => c.type === "tool_use");
  let m = call?.input;
  if (!m) {
    const text = (out?.content ?? []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("\n");
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    try { m = JSON.parse(json); } catch { m = null; }
  }
  if (!m?.criteria?.length) return fail(502, "AI marking returned no result.", out);

  const criteria = m.criteria.slice(0, 4).map((c: { band: number }) => ({ ...c, band: Math.round(Number(c.band) * 2) / 2 }));
  const result = {
    criteria,
    overall: overallBand(criteria.map((c: { band: number }) => c.band)),
    summary: m.summary ?? "",
    next_steps: m.next_steps ?? [],
    corrections: (m.corrections ?? []).filter((c: { quote?: string; fix?: string }) => c.quote && c.fix !== undefined),
  };
  const row = { submission_id: sub.id, result, model: MODEL, created_at: new Date().toISOString() };
  const { error: saveError } = await admin.from("writing_ai_reviews").upsert(row);
  if (saveError) console.warn("writing-mark save failed", saveError.message);
  return ok({ result, model: MODEL, created_at: row.created_at });
}
