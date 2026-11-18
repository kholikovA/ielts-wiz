// =============================================================================
// word-audio — AI pronunciation for flashcard words with no human recording.
//
//   POST { word, accent: "uk" | "us", ipa? }
//     Returns { path } of an MP3 in the public word-audio bucket, generating it
//     with OpenAI gpt-4o-mini-tts the first time a word + accent is asked for.
//     Every later request (from any student) reuses the stored clip.
//
// Only words that are actually on someone's flashcards or saved-word list can
// be generated, so the endpoint can't be used as a free TTS service.
// JWT verification on (the default). Secret: OPENAI_API_KEY.
// =============================================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const MODEL = Deno.env.get("WORD_AUDIO_MODEL") ?? "gpt-4o-mini-tts";

// One consistent voice per accent, steered by instructions.
const VOICES = {
  uk: { voice: "fable", accent: "standard British English (Received Pronunciation)" },
  us: { voice: "coral", accent: "standard General American English" },
} as const;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "content-type": "application/json" } });
const fail = (status: number, message: string, detail?: unknown) => {
  console.warn("word-audio", status, message, detail ?? "");
  return json(status, { error: message });
};

// Same rule as the client: 1–3 plain words.
const WORD_RE = /^[a-z][a-z' -]*$/;
const slug = (w: string) => w.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

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

  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const { data: who } = await admin.auth.getUser(token);
  if (!who?.user) return fail(401, "Sign in first.");

  let body: { word?: string; accent?: string; ipa?: string };
  try { body = await req.json(); } catch { return fail(400, "Bad request."); }
  const word = (body.word ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  const accent = body.accent === "us" ? "us" : body.accent === "uk" ? "uk" : null;
  if (!accent || !word || word.length > 60 || !WORD_RE.test(word) || word.split(" ").length > 3) {
    return fail(400, "Unsupported word.");
  }

  // Already generated?
  const { data: existing } = await admin.from("word_audio").select("path").eq("word", word).eq("accent", accent).maybeSingle();
  if (existing?.path) return json(200, { path: existing.path, cached: true });

  if (!OPENAI_API_KEY) return fail(503, "AI pronunciation isn't set up yet (OPENAI_API_KEY is missing).");

  // Only words someone is actually studying.
  const [cards, saved] = await Promise.all([
    admin.from("srs_cards").select("id").ilike("front", word).limit(1),
    admin.from("user_vocab_words").select("word").ilike("word", word).limit(1),
  ]);
  if (!(cards.data?.length || saved.data?.length)) return fail(404, "That word isn't on any flashcards.");

  const v = VOICES[accent];
  const ipa = typeof body.ipa === "string" && /^[/[].{1,60}[/\]]$/.test(body.ipa) ? body.ipa : null;
  const instructions = [
    `You are recording a pronunciation for a learner's dictionary. Speak in ${v.accent}.`,
    "Say the text exactly once, clearly, at a natural unhurried pace, with neutral dictionary intonation.",
    "Do not add any other words, sounds or pauses before or after it.",
    ipa ? `The pronunciation is ${ipa}.` : "",
  ].filter(Boolean).join(" ");

  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { authorization: `Bearer ${OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, voice: v.voice, input: word, instructions, response_format: "mp3" }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return fail(502, `Couldn't generate audio (${res.status}).`, detail.slice(0, 500));
  }
  const audio = new Uint8Array(await res.arrayBuffer());
  if (!audio.byteLength || audio.byteLength > 1024 * 1024) return fail(502, "Generated audio was empty or too large.");

  const path = `${accent}/${slug(word)}.mp3`;
  const up = await admin.storage.from("word-audio").upload(path, audio, { contentType: "audio/mpeg", upsert: true, cacheControl: "31536000" });
  if (up.error) return fail(500, "Couldn't store the audio.", up.error.message);
  const ins = await admin.from("word_audio").upsert({ word, accent, path, model: MODEL, voice: v.voice });
  if (ins.error) return fail(500, "Couldn't save the audio record.", ins.error.message);
  return json(200, { path, cached: false });
}
