// =============================================================================
// dictation-media — server side of dictation homework (teachers only).
//
//   POST { action: "fetch", url }
//     Downloads a linked audio/video file (direct links, Google Drive and
//     Dropbox share links) and streams it back, so the teacher's browser can
//     convert it to audio without running into CORS.
//
//   POST { action: "transcribe", path, prompt? }
//     Sends an mp3 from the dictation-media bucket (the caller's own folder)
//     to OpenAI Whisper and returns verbose JSON with segment + word timings.
//
// Deploy with JWT verification on (the default):
//   supabase functions deploy dictation-media
// Secret: OPENAI_API_KEY.
// =============================================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const MAX_FETCH_BYTES = 300 * 1024 * 1024;
const MAX_WHISPER_BYTES = 25 * 1024 * 1024;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Expose-Headers": "content-length, content-type",
};

const fail = (status: number, message: string) =>
  new Response(JSON.stringify({ error: message }), { status, headers: { ...CORS, "content-type": "application/json" } });

// Share links -> direct download links. YouTube can't be downloaded.
function directUrl(raw: string): string {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { throw new Error("That doesn't look like a link."); }
  if (!/^https?:$/.test(u.protocol)) throw new Error("Only http(s) links work.");
  const host = u.hostname.toLowerCase();
  if (/(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/.test(host)) {
    throw new Error("YouTube links can't be converted. Download the video and upload the file instead.");
  }
  if (host === "localhost" || /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.)/.test(host) || host.endsWith(".internal") || host.includes(":")) {
    throw new Error("That link isn't reachable.");
  }
  if (host === "drive.google.com" || host === "docs.google.com") {
    const id = u.pathname.match(/\/d\/([\w-]+)/)?.[1] ?? u.searchParams.get("id");
    if (id) return `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`;
  }
  if (host === "www.dropbox.com" || host === "dropbox.com") {
    u.searchParams.delete("dl");
    u.searchParams.set("raw", "1");
    return u.toString();
  }
  return u.toString();
}

async function proxy(url: string) {
  let target: string;
  try { target = directUrl(url); } catch (e) { return fail(400, (e as Error).message); }
  let res: Response;
  try {
    res = await fetch(target, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (IELTS Wiz dictation)" } });
  } catch {
    return fail(502, "Couldn't reach that link.");
  }
  if (!res.ok || !res.body) return fail(502, `The link returned an error (${res.status}).`);
  const type = (res.headers.get("content-type") ?? "").toLowerCase();
  if (type.startsWith("text/html")) {
    return fail(422, "That link opens a web page, not a media file. If it's on Google Drive or Dropbox, share it as \"Anyone with the link\".");
  }
  const len = Number(res.headers.get("content-length") ?? 0);
  if (len > MAX_FETCH_BYTES) return fail(413, "That file is over 300 MB. Upload a shorter clip.");
  let seen = 0;
  const limited = res.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, ctl) {
      seen += chunk.byteLength;
      if (seen > MAX_FETCH_BYTES) { ctl.error(new Error("too large")); return; }
      ctl.enqueue(chunk);
    },
  }));
  const headers: Record<string, string> = { ...CORS, "content-type": type || "application/octet-stream" };
  if (len) headers["content-length"] = String(len);
  return new Response(limited, { status: 200, headers });
}

async function transcribe(uid: string, path: string, prompt?: string) {
  if (!OPENAI_API_KEY) return fail(500, "Transcription isn't set up yet (OPENAI_API_KEY is missing).");
  if (!path || !path.startsWith(`${uid}/`) || path.includes("..")) return fail(403, "Not your file.");
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: file, error } = await admin.storage.from("dictation-media").download(path);
  if (error || !file) return fail(404, "Audio file not found.");
  if (file.size > MAX_WHISPER_BYTES) return fail(413, "The audio is too long to transcribe (over 25 MB).");

  const form = new FormData();
  form.append("file", new File([file], "audio.mp3", { type: "audio/mpeg" }));
  form.append("model", "whisper-1");
  form.append("language", "en");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");
  form.append("timestamp_granularities[]", "segment");
  if (prompt) form.append("prompt", prompt.slice(0, 800));
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("whisper error", res.status, detail.slice(0, 500));
    return fail(502, `Transcription failed (${res.status}).`);
  }
  const out = await res.json();
  return new Response(JSON.stringify({
    text: out.text ?? "",
    duration: out.duration ?? null,
    segments: (out.segments ?? []).map((s: { start: number; end: number; text: string }) => ({ start: s.start, end: s.end, text: s.text })),
    words: out.words ?? [],
  }), { headers: { ...CORS, "content-type": "application/json" } });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail(405, "POST only.");

  const auth = req.headers.get("authorization") ?? "";
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { authorization: auth } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return fail(401, "Sign in first.");
  const { data: isTeacher } = await userClient.rpc("is_teacher_user", { uid: user.id });
  if (!isTeacher) return fail(403, "Teachers only.");

  let body: { action?: string; url?: string; path?: string; prompt?: string };
  try { body = await req.json(); } catch { return fail(400, "Bad request."); }
  if (body.action === "fetch" && body.url) return proxy(body.url);
  if (body.action === "transcribe" && body.path) return transcribe(user.id, body.path, body.prompt);
  return fail(400, "Unknown action.");
});
