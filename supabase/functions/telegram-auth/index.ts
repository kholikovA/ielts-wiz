// =============================================================================
// telegram-auth — link a Telegram account to a profile, and sign in with it.
//
//   POST { action: "config" }                 -> { bot_id }  (null if not set up)
//   POST { action: "link",   auth }  (user JWT) -> { telegram_id, telegram_username }
//   POST { action: "unlink" }        (user JWT) -> { ok: true }
//   POST { action: "signin", auth }  (anon key) -> { token_hash }
//
// `auth` is the object Telegram's login widget returns (id, first_name,
// username, photo_url, auth_date, hash). Its hash is an HMAC signed with the
// bot token, so only a real Telegram login for our bot passes.
//
// Sign-in works only for a Telegram already linked to an account (students
// sign in with Google first). It returns a one-time magic-link token hash for
// that account; the browser exchanges it with supabase.auth.verifyOtp for a
// normal session. No email is sent.
//
// verify_jwt stays on: signed-out callers send the anon key, which passes.
// Secret: TELEGRAM_BOT_TOKEN.
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
// Telegram's widget data stays valid for as long as we accept it; keep the
// window short so a leaked payload can't be replayed later.
const MAX_AGE_SECONDS = 3600;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "content-type": "application/json" } });
const fail = (status: number, code: string, message: string) => json(status, { error: message, code });

// The gateway has already verified this JWT; we only read the user id from it.
function userIdFrom(req: Request): string | null {
  try {
    const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(part + "=".repeat((4 - (part.length % 4)) % 4)));
    return claims.role === "authenticated" && typeof claims.sub === "string" ? claims.sub : null;
  } catch {
    return null;
  }
}

const enc = new TextEncoder();
const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");

// https://core.telegram.org/widgets/login#checking-authorization
async function verifyTelegram(auth: unknown): Promise<{ id: number; username: string | null } | null> {
  if (!auth || typeof auth !== "object") return null;
  const data = auth as Record<string, unknown>;
  const hash = typeof data.hash === "string" ? data.hash.toLowerCase() : "";
  if (!/^[0-9a-f]{64}$/.test(hash)) return null;

  const checkString = Object.keys(data)
    .filter((k) => k !== "hash" && data[k] !== undefined && data[k] !== null)
    .sort()
    .map((k) => `${k}=${data[k]}`)
    .join("\n");
  const secret = await crypto.subtle.digest("SHA-256", enc.encode(BOT_TOKEN));
  const key = await crypto.subtle.importKey("raw", secret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = hex(await crypto.subtle.sign("HMAC", key, enc.encode(checkString)));
  let diff = 0;
  for (let i = 0; i < 64; i++) diff |= expected.charCodeAt(i) ^ hash.charCodeAt(i);
  if (diff !== 0) return null;

  const authDate = Number(data.auth_date);
  const age = Date.now() / 1000 - authDate;
  if (!Number.isFinite(authDate) || age > MAX_AGE_SECONDS || age < -300) return null;

  const id = Number(data.id);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  const username = typeof data.username === "string" && data.username ? data.username : null;
  return { id, username };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail(405, "method", "Use POST.");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail(400, "bad_request", "Invalid request.");
  }
  const action = body.action;

  if (action === "config") {
    // The bot id is the public part of the token (before the colon).
    const botId = BOT_TOKEN.includes(":") ? Number(BOT_TOKEN.split(":")[0]) : null;
    return json(200, { bot_id: botId || null });
  }
  if (!BOT_TOKEN) return fail(503, "not_configured", "Telegram login isn't set up yet.");

  if (action === "unlink") {
    const uid = userIdFrom(req);
    if (!uid) return fail(401, "auth", "Sign in first.");
    const { error } = await admin.from("profiles")
      .update({ telegram_id: null, telegram_username: null, telegram_linked_at: null })
      .eq("id", uid);
    if (error) return fail(500, "db", "Could not unlink Telegram. Please try again.");
    return json(200, { ok: true });
  }

  if (action !== "link" && action !== "signin") return fail(400, "bad_request", "Unknown action.");

  const tg = await verifyTelegram(body.auth);
  if (!tg) return fail(401, "bad_signature", "Telegram login expired or couldn't be verified. Please try again.");

  if (action === "link") {
    const uid = userIdFrom(req);
    if (!uid) return fail(401, "auth", "Sign in first.");
    const { data: owner } = await admin.from("profiles").select("id").eq("telegram_id", tg.id).maybeSingle();
    if (owner && owner.id !== uid) {
      return fail(409, "taken", "This Telegram account is already linked to another IELTS Wiz account.");
    }
    const { error } = await admin.from("profiles")
      .update({ telegram_id: tg.id, telegram_username: tg.username, telegram_linked_at: new Date().toISOString() })
      .eq("id", uid);
    if (error) {
      if (error.code === "23505") return fail(409, "taken", "This Telegram account is already linked to another IELTS Wiz account.");
      console.warn("telegram-auth link", error);
      return fail(500, "db", "Could not link Telegram. Please try again.");
    }
    return json(200, { telegram_id: tg.id, telegram_username: tg.username });
  }

  // signin
  const { data: profile } = await admin.from("profiles").select("id").eq("telegram_id", tg.id).maybeSingle();
  if (!profile) {
    return fail(404, "not_linked",
      "This Telegram account isn't linked to IELTS Wiz yet. Continue with Google, then link Telegram on your Profile page.");
  }
  const { data: userRes, error: userErr } = await admin.auth.admin.getUserById(profile.id);
  const email = userRes?.user?.email;
  if (userErr || !email) return fail(500, "no_user", "Could not sign you in. Please continue with Google.");

  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = link?.properties?.hashed_token;
  if (linkErr || !tokenHash) {
    console.warn("telegram-auth generateLink", linkErr);
    return fail(500, "link", "Could not sign you in. Please try again.");
  }
  // Keep the stored username current.
  admin.from("profiles").update({ telegram_username: tg.username }).eq("id", profile.id).then(() => {});
  return json(200, { token_hash: tokenHash });
});
