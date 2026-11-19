// =============================================================================
// telegram-bot — webhook for @<bot> (Telegram calls this, not the site).
//
// The site sends students to t.me/<bot>?start=<code> (see telegram-auth).
// Telegram delivers "/start <code>"; we show what will happen with a Confirm
// button, and the button press links the account or approves the sign-in.
// Also: /notifications (on/off for notify-telegram) and /help.
// The confirm step stops someone from logging a student in by just getting
// them to open a link.
//
// No JWT (Telegram can't send one): listed in NO_VERIFY in the edge runtime's
// main/index.ts on the server. Requests must carry Telegram's secret-token
// header, derived from the bot token (set with setWebhook).
// Secret: TELEGRAM_BOT_TOKEN.
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const SITE = "https://student.ielts-wiz.com";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

// setWebhook secret_token: sha256("telegram-webhook:" + token), hex, first 48.
async function webhookSecret(): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`telegram-webhook:${BOT_TOKEN}`));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 48);
}

function sameString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function tg(method: string, payload: Record<string, unknown>) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) console.warn("telegram-bot", method, res.status, await res.text());
  } catch (e) {
    console.warn("telegram-bot", method, e);
  }
}

const say = (chatId: number, text: string, extra: Record<string, unknown> = {}) =>
  tg("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", ...extra });

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function maskEmail(email: string | null | undefined): string {
  if (!email) return "";
  const [user, domain] = email.split("@");
  if (!domain) return "";
  return `${user.slice(0, 2)}${"•".repeat(Math.max(1, Math.min(6, user.length - 2)))}@${domain}`;
}

async function accountLabel(userId: string): Promise<string> {
  const { data: p } = await admin.from("profiles").select("name, email").eq("id", userId).maybeSingle();
  const name = p?.name ? `<b>${esc(p.name)}</b>` : "your account";
  const email = maskEmail(p?.email);
  return email ? `${name} (${esc(email)})` : name;
}

type Req = { code: string; kind: "link" | "signin"; user_id: string | null; status: string; expires_at: string };

async function pendingRequest(code: string): Promise<Req | null> {
  if (!/^[A-Za-z0-9_-]{32}$/.test(code)) return null;
  const { data } = await admin.from("telegram_login_requests")
    .select("code, kind, user_id, status, expires_at").eq("code", code).maybeSingle();
  if (!data || data.status !== "pending" || new Date(data.expires_at) < new Date()) return null;
  return data as Req;
}

const EXPIRED = "This link has expired or was already used. Go back to IELTS Wiz and tap the Telegram button again.";
const NOT_LINKED = `This Telegram isn't linked to an IELTS Wiz account yet.\n\nSign in at ${SITE} with Google, open <b>Profile</b> and tap <b>Link Telegram</b>. After that you can sign in with Telegram.`;

const HUB_BUTTON = { inline_keyboard: [[{ text: "Open Student Hub", url: SITE }]] };

const HELP = `<b>IELTS Wiz bot</b>\n\n` +
  `• Sign in to the Student Hub with Telegram — no password.\n` +
  `• Get new homework, teacher feedback, retakes and coins here as they happen.\n\n` +
  `/notifications — turn notifications on or off\n` +
  `/help — this message\n\n` +
  `Not linked yet? Sign in at ${SITE}, open <b>Profile</b> and tap <b>Link Telegram</b>.`;

type Linked = { id: string; name: string | null; telegram_notify: boolean };

async function linkedProfile(fromId: number): Promise<Linked | null> {
  const { data } = await admin.from("profiles").select("id, name, telegram_notify").eq("telegram_id", fromId).maybeSingle();
  return (data as Linked) ?? null;
}

function notifyMessage(on: boolean) {
  return {
    text: on
      ? "🔔 Notifications are <b>on</b>. You'll get new homework, feedback, retakes and coins here."
      : "🔕 Notifications are <b>off</b>. You won't get IELTS Wiz updates here.",
    reply_markup: { inline_keyboard: [[on
      ? { text: "🔕 Turn off", callback_data: "notify:off" }
      : { text: "🔔 Turn on", callback_data: "notify:on" }]] },
  };
}

async function onNotifications(chatId: number, fromId: number) {
  const p = await linkedProfile(fromId);
  if (!p) { await say(chatId, NOT_LINKED); return; }
  const m = notifyMessage(p.telegram_notify);
  await say(chatId, m.text, { reply_markup: m.reply_markup });
}

async function onNotifyToggle(cb: Record<string, any>) {
  const on = cb.data === "notify:on";
  const p = await linkedProfile(cb.from?.id);
  if (!p) {
    await tg("answerCallbackQuery", { callback_query_id: cb.id, text: "Link Telegram on your IELTS Wiz profile first." });
    return;
  }
  await admin.from("profiles").update({ telegram_notify: on }).eq("id", p.id);
  await tg("answerCallbackQuery", { callback_query_id: cb.id, text: on ? "Notifications on" : "Notifications off" });
  const m = notifyMessage(on);
  if (cb.message) {
    await tg("editMessageText", {
      chat_id: cb.message.chat.id, message_id: cb.message.message_id,
      text: m.text, parse_mode: "HTML", reply_markup: m.reply_markup,
    });
  }
}

async function onStart(chatId: number, fromId: number, code: string) {
  if (!code) {
    const p = await linkedProfile(fromId);
    if (p) {
      const first = esc((p.name || "there").split(" ")[0]);
      await say(chatId, `Hi ${first}! 👋 Your Telegram is linked to IELTS Wiz.\n\n` +
        (p.telegram_notify
          ? "You'll get new homework, feedback, retakes and coins here. /notifications to turn them off."
          : "Notifications are off. /notifications to turn them on."),
        { reply_markup: HUB_BUTTON });
    } else {
      await say(chatId, `Hi! This is the IELTS Wiz bot. 🧙\n\nTo sign in with Telegram and get homework alerts here, open ${SITE}, go to <b>Profile</b> and tap <b>Link Telegram</b>.`,
        { reply_markup: HUB_BUTTON });
    }
    return;
  }
  const req = await pendingRequest(code);
  if (!req) { await say(chatId, EXPIRED); return; }

  if (req.kind === "link") {
    const label = await accountLabel(req.user_id!);
    await say(chatId, `Link this Telegram to the IELTS Wiz account ${label}?\n\nYou'll be able to sign in with Telegram.`, {
      reply_markup: { inline_keyboard: [[{ text: "✅ Link account", callback_data: `ok:${code}` }]] },
    });
    return;
  }

  const { data: profile } = await admin.from("profiles").select("id").eq("telegram_id", fromId).maybeSingle();
  if (!profile) {
    await admin.from("telegram_login_requests").update({ status: "not_linked" }).eq("code", code).eq("status", "pending");
    await say(chatId, NOT_LINKED);
    return;
  }
  const label = await accountLabel(profile.id);
  await say(chatId, `Sign in to IELTS Wiz as ${label}?\n\nOnly confirm if you just tapped “Continue with Telegram” yourself.`, {
    reply_markup: { inline_keyboard: [[{ text: "✅ Sign in", callback_data: `ok:${code}` }]] },
  });
}

async function onConfirm(cb: Record<string, any>) {
  const fromId: number = cb.from?.id;
  const username: string | null = cb.from?.username ?? null;
  const chatId: number | undefined = cb.message?.chat?.id;
  const messageId: number | undefined = cb.message?.message_id;
  const code = String(cb.data ?? "").slice(3);
  const finish = async (text: string, toast?: string) => {
    await tg("answerCallbackQuery", { callback_query_id: cb.id, text: toast ?? "" });
    if (chatId && messageId) await tg("editMessageText", { chat_id: chatId, message_id: messageId, text, parse_mode: "HTML" });
  };

  const req = await pendingRequest(code);
  if (!req) { await finish(EXPIRED); return; }

  if (req.kind === "link") {
    const { data: owner } = await admin.from("profiles").select("id").eq("telegram_id", fromId).maybeSingle();
    if (owner && owner.id !== req.user_id) {
      await admin.from("telegram_login_requests").update({ status: "taken" }).eq("code", code);
      await finish("This Telegram is already linked to another IELTS Wiz account. Unlink it there first.");
      return;
    }
    const { error } = await admin.from("profiles")
      .update({ telegram_id: fromId, telegram_username: username, telegram_linked_at: new Date().toISOString() })
      .eq("id", req.user_id!);
    if (error) {
      const taken = error.code === "23505";
      if (taken) await admin.from("telegram_login_requests").update({ status: "taken" }).eq("code", code);
      await finish(taken ? "This Telegram is already linked to another IELTS Wiz account." : "Something went wrong. Please try again.");
      return;
    }
    await admin.from("telegram_login_requests").update({ status: "done", telegram_id: fromId }).eq("code", code);
    await finish("✅ Telegram linked. Go back to IELTS Wiz — next time you can sign in with Telegram.", "Linked");
    return;
  }

  const { data: profile } = await admin.from("profiles").select("id").eq("telegram_id", fromId).maybeSingle();
  if (!profile) {
    await admin.from("telegram_login_requests").update({ status: "not_linked" }).eq("code", code);
    await finish(NOT_LINKED);
    return;
  }
  await admin.from("telegram_login_requests")
    .update({ status: "done", user_id: profile.id, telegram_id: fromId }).eq("code", code).eq("status", "pending");
  if (username) admin.from("profiles").update({ telegram_username: username }).eq("id", profile.id).then(() => {});
  await finish("✅ Signed in. Go back to IELTS Wiz — it continues by itself.", "Signed in");
}

Deno.serve(async (req) => {
  if (req.method !== "POST" || !BOT_TOKEN) return new Response("ok");
  const got = req.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!sameString(got, await webhookSecret())) return new Response("forbidden", { status: 403 });

  let update: Record<string, any>;
  try {
    update = await req.json();
  } catch {
    return new Response("ok");
  }

  try {
    const msg = update.message;
    const text = typeof msg?.text === "string" ? msg.text.trim() : "";
    const command = text.startsWith("/") ? text.split(/\s+/)[0].split("@")[0].toLowerCase() : "";
    const data = String(update.callback_query?.data ?? "");
    if (msg?.chat?.type === "private" && command === "/start") {
      await onStart(msg.chat.id, msg.from.id, text.split(/\s+/)[1] ?? "");
    } else if (msg?.chat?.type === "private" && command === "/notifications") {
      await onNotifications(msg.chat.id, msg.from.id);
    } else if (msg?.chat?.type === "private") {
      await say(msg.chat.id, HELP, { reply_markup: HUB_BUTTON });
    } else if (update.callback_query && data.startsWith("ok:")) {
      await onConfirm(update.callback_query);
    } else if (update.callback_query && data.startsWith("notify:")) {
      await onNotifyToggle(update.callback_query);
    }
  } catch (e) {
    console.warn("telegram-bot", e);
  }
  // Always 200 so Telegram doesn't retry the same update.
  return new Response("ok");
});
