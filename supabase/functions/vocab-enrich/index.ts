// =============================================================================
// vocab-enrich — Claude drafts study material for flashcards (teachers only).
//
//   POST { items: [{ f, b? }] }   (at most 30 per call)
//   -> { items: [{ f, b, ex, gap, ans, forms, coll }] } in the same order
//
//   b      learner-friendly meaning (the teacher's own meaning is kept)
//   ex     a natural IELTS-style example sentence using the item
//   gap    ex with the item replaced by ____ ; ans = what was removed
//   forms  other word-family members: [{ w, pos, gap, ans }]
//   coll   strong collocations: [{ p, gap, ans }] (gap blanks the partner word)
//
// The teacher reviews everything before it's assigned.
// Secrets: ANTHROPIC_API_KEY, optional VOCAB_MODEL (default claude-sonnet-5-5).
// =============================================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const MODEL = Deno.env.get("VOCAB_MODEL") || "claude-sonnet-5-5";
const BLANK = "____";
const MAX_ITEMS = 30;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const fail = (status: number, message: string, detail?: unknown) => {
  console.warn("vocab-enrich", status, message, detail ?? "");
  return new Response(JSON.stringify({ error: message }), { status, headers: { ...CORS, "content-type": "application/json" } });
};
const ok = (body: unknown) => new Response(JSON.stringify(body), { headers: { ...CORS, "content-type": "application/json" } });

const SYSTEM = `You write vocabulary study material for IELTS learners (B1-C1) who need to USE words in Writing and Speaking, not just recognise them.

For each item (a word or a multi-word chunk such as "pose a threat") return:
- "f": the item exactly as given.
- "b": a short, learner-friendly meaning (max 12 words). If the teacher gave a meaning, keep it unless it is wrong.
- "ex": one natural example sentence (12-22 words) on an IELTS-type topic (education, environment, technology, health, work, society...), using the item in its most useful sense.
- "gap": the same sentence with the item (in the exact form used) replaced by ${BLANK}. "ans": the exact text you removed.
- "forms": up to 3 OTHER members of the word family that are genuinely useful for IELTS (e.g. economy -> economic, economical, economically), each {"w", "pos", "gap": a new short sentence where only that form fits, with it replaced by ${BLANK}, "ans": [the form]}. Empty for chunks or when there are none.
- "coll": 2-3 strong, common collocations with the item, each {"p": the collocation, "gap": a short sentence using the collocation with the PARTNER word (not the item itself) replaced by ${BLANK}, "ans": [every partner word that fits naturally]}.

Every "gap" must contain ${BLANK} exactly once. Use British spelling. Return ONLY JSON: {"items":[...]} in the same order as the input, nothing else.`;

type Row = { f: string; b?: string; ex?: string; gap?: string; ans?: unknown; forms?: unknown[]; coll?: unknown[] };

const strs = (x: unknown) => (Array.isArray(x) ? x : x ? [x] : []).map((s) => String(s).trim()).filter(Boolean);
const oneBlank = (s: unknown) => typeof s === "string" && s.split(BLANK).length === 2;

// Keep only well-formed parts, so a bad suggestion never breaks a review.
function clean(input: { f: string; b?: string }, r: Row | undefined) {
  const out: Record<string, unknown> = { f: input.f, b: (input.b || r?.b || "").trim() };
  if (!r) return out;
  if (typeof r.ex === "string" && r.ex.trim()) out.ex = r.ex.trim();
  if (oneBlank(r.gap) && strs(r.ans).length) { out.gap = r.gap; out.ans = strs(r.ans); }
  const forms = (r.forms ?? []).map((x) => x as Record<string, unknown>)
    .filter((x) => x && typeof x.w === "string" && oneBlank(x.gap))
    .map((x) => ({ w: String(x.w).trim(), pos: x.pos ? String(x.pos) : undefined, gap: x.gap, ans: strs(x.ans).length ? strs(x.ans) : [String(x.w).trim()] }))
    .slice(0, 3);
  if (forms.length) out.forms = forms;
  const coll = (r.coll ?? []).map((x) => x as Record<string, unknown>)
    .filter((x) => x && oneBlank(x.gap) && strs(x.ans).length)
    .map((x) => ({ p: x.p ? String(x.p) : undefined, gap: x.gap, ans: strs(x.ans) }))
    .slice(0, 3);
  if (coll.length) out.coll = coll;
  return out;
}

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
  if (!ANTHROPIC_API_KEY) return fail(500, "AI isn't set up yet (ANTHROPIC_API_KEY is missing).");

  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const { data: who, error: authError } = await admin.auth.getUser(token);
  const user = who?.user;
  if (!user) return fail(401, "Sign in first.", authError?.message);
  const { data: isTeacher } = await admin.rpc("is_teacher_user", { uid: user.id });
  if (!isTeacher) return fail(403, "Teachers only.");

  let body: { items?: { f: string; b?: string }[] };
  try { body = await req.json(); } catch { return fail(400, "Bad request."); }
  const items = (body.items ?? []).filter((x) => x && typeof x.f === "string" && x.f.trim()).map((x) => ({ f: x.f.trim().slice(0, 80), b: (x.b ?? "").trim().slice(0, 200) }));
  if (!items.length) return fail(400, "No words to work on.");
  if (items.length > MAX_ITEMS) return fail(400, `At most ${MAX_ITEMS} words at a time.`);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM,
      messages: [{ role: "user", content: `Items:\n${JSON.stringify(items)}` }],
    }),
  });
  const out = await res.json().catch(() => null);
  if (!res.ok) return fail(502, `AI failed (${res.status}): ${out?.error?.message ?? "upstream error"}`, out);
  const text = (out?.content ?? []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("\n");
  let parsed: { items?: Row[] } | null = null;
  try { parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)); } catch { parsed = null; }
  if (!parsed?.items?.length) return fail(502, "The AI reply couldn't be read. Try again.", text.slice(0, 500));

  // Match by word when possible, else by position.
  const byWord = new Map(parsed.items.filter((r) => r?.f).map((r) => [String(r.f).toLowerCase(), r]));
  const result = items.map((it, i) => clean(it, byWord.get(it.f.toLowerCase()) ?? parsed!.items![i]));
  return ok({ items: result, model: MODEL });
}
