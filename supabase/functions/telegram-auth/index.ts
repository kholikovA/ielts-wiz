// =============================================================================
// telegram-auth — the site's side of Telegram login through @<bot>.
//
//   POST { action: "config" }                       -> { bot_username }  (null if not set up)
//   POST { action: "start", kind: "link" } (user JWT) -> { code, url }
//   POST { action: "start", kind: "signin" }         -> { code, url }
//   POST { action: "poll", code }                    -> { status, token_hash? }
//   POST { action: "unlink" }              (user JWT) -> { ok: true }
//
// The student opens `url` (t.me/<bot>?start=<code>) and confirms in Telegram;
// the telegram-bot webhook marks the request done. Polling then reports
// "done" — for sign-in it also returns a one-time magic-link token hash for
// the linked account, which the browser exchanges with verifyOtp for a normal
// session (no email is sent). Codes are random, single-use and expire after
// 15 minutes. Sign-in only works for a Telegram already linked to an account.
//
// verify_jwt stays on: signed-out callers send the anon key, which passes.
// Secret: TELEGRAM_BOT_TOKEN.
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";

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

let botUsername: string | null = null;
async function getBotUsername(): Promise<string | null> {
  if (botUsername || !BOT_TOKEN) return botUsername;
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    const body = await res.json();
    botUsername = body?.result?.username ?? null;
  } catch { /* Telegram unreachable — try again next call */ }
  return botUsername;
}

// 24 random bytes, base64url: 32 chars, fits Telegram's 64-char start payload.
function newCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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

  if (action === "config") return json(200, { bot_username: await getBotUsername() });

  const bot = await getBotUsername();
  if (!bot) return fail(503, "not_configured", "Telegram login isn't available right now.");

  if (action === "unlink") {
    const uid = userIdFrom(req);
    if (!uid) return fail(401, "auth", "Sign in first.");
    const { error } = await admin.from("profiles")
      .update({ telegram_id: null, telegram_username: null, telegram_linked_at: null })
      .eq("id", uid);
    if (error) return fail(500, "db", "Could not unlink Telegram. Please try again.");
    return json(200, { ok: true });
  }

  if (action === "start") {
    const kind = body.kind === "link" ? "link" : body.kind === "signin" ? "signin" : null;
    if (!kind) return fail(400, "bad_request", "Unknown request.");
    const uid = kind === "link" ? userIdFrom(req) : null;
    if (kind === "link" && !uid) return fail(401, "auth", "Sign in first.");
    // Housekeeping: drop requests older than a day.
    admin.from("telegram_login_requests").delete()
      .lt("created_at", new Date(Date.now() - 86400_000).toISOString()).then(() => {});
    const code = newCode();
    const { error } = await admin.from("telegram_login_requests").insert({ code, kind, user_id: uid });
    if (error) {
      console.warn("telegram-auth start", error);
      return fail(500, "db", "Could not start Telegram login. Please try again.");
    }
    return json(200, { code, url: `https://t.me/${bot}?start=${code}` });
  }

  if (action === "poll") {
    const code = typeof body.code === "string" ? body.code : "";
    if (!/^[A-Za-z0-9_-]{32}$/.test(code)) return fail(400, "bad_request", "Invalid code.");
    const { data: row } = await admin.from("telegram_login_requests")
      .select("kind, user_id, status, expires_at").eq("code", code).maybeSingle();
    if (!row) return json(200, { status: "expired" });
    if (row.status === "pending") {
      return json(200, { status: new Date(row.expires_at) < new Date() ? "expired" : "pending" });
    }
    if (row.kind === "link" || row.status !== "done") return json(200, { status: row.status });

    // Sign-in confirmed in Telegram: redeem once.
    const { data: claimed } = await admin.from("telegram_login_requests")
      .update({ status: "used" }).eq("code", code).eq("status", "done").select("user_id").maybeSingle();
    if (!claimed?.user_id) return json(200, { status: "used" });
    const { data: userRes } = await admin.auth.admin.getUserById(claimed.user_id);
    const email = userRes?.user?.email;
    if (!email) return fail(500, "no_user", "Could not sign you in. Please continue with Google.");
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    const tokenHash = link?.properties?.hashed_token;
    if (linkErr || !tokenHash) {
      console.warn("telegram-auth generateLink", linkErr);
      return fail(500, "link", "Could not sign you in. Please try again.");
    }
    return json(200, { status: "done", token_hash: tokenHash });
  }

  return fail(400, "bad_request", "Unknown action.");
});
