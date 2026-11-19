// =============================================================================
// notify-telegram — sends Student Hub notifications (homework, feedback,
// retake, coins, teacher submission alerts) through @ieltswizbot to accounts
// that linked Telegram and haven't turned it off (/notifications in the bot).
//
// Called every minute by pg_cron (job "notify-telegram", migration
// 20261119080000_telegram_notifications.sql) with an x-cron-secret header
// checked against the vault secret `notify_cron_secret`.
//
// No JWT: listed in NO_VERIFY in the edge runtime's main/index.ts on the
// server. Secret: TELEGRAM_BOT_TOKEN.
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const SITE = "https://student.ielts-wiz.com";
// Anything visible for longer than this is marked done without sending.
const STALE_MS = 6 * 60 * 60 * 1000;
// Up to this many per person per run go out as separate messages; more become one digest.
const MAX_SINGLE = 5;

type Kind = "homework" | "feedback" | "submission" | "retake" | "coins";

interface Row {
  id: string;
  user_id: string;
  kind: Kind;
  title: string;
  body: string | null;
  link: string | null;
  visible_at: string;
  profiles: { telegram_id: number | null; telegram_notify: boolean; telegram_linked_at: string | null } | null;
}

const ICON: Record<Kind, string> = {
  homework: "📚",
  feedback: "💬",
  submission: "📥",
  retake: "🔁",
  coins: "🪙",
};

const BUTTON: Record<Kind, string> = {
  homework: "Open homework",
  feedback: "Read feedback",
  submission: "View submission",
  retake: "Retake homework",
  coins: "See my coins",
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const url = (link: string | null) => `${SITE}${link && link.startsWith("/") ? link : "/"}`;

type Sent = "ok" | "gone" | "retry";

async function send(chatId: number, text: string, button: { text: string; url: string }): Promise<Sent> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        reply_markup: { inline_keyboard: [[button]] },
      }),
    });
    if (res.ok) return "ok";
    const detail = await res.text();
    console.warn("notify-telegram", res.status, detail);
    // 403: blocked the bot / deactivated; 400 chat not found. Retrying won't help.
    if (res.status === 403 || (res.status === 400 && /chat not found/i.test(detail))) return "gone";
    return "retry";
  } catch (e) {
    console.warn("notify-telegram", e);
    return "retry";
  }
}

function single(r: Row) {
  const text = `${ICON[r.kind]} <b>${esc(r.title)}</b>${r.body ? `\n${esc(r.body)}` : ""}`;
  return { text, button: { text: BUTTON[r.kind], url: url(r.link) } };
}

function digest(rows: Row[]) {
  const lines = rows.slice(0, 15).map((r) => `${ICON[r.kind]} <a href="${url(r.link)}">${esc(r.title)}</a>`);
  if (rows.length > 15) lines.push(`…and ${rows.length - 15} more`);
  const text = `<b>${rows.length} new updates on IELTS Wiz</b>\n\n${lines.join("\n")}`;
  return { text, button: { text: "Open Student Hub", url: SITE } };
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  const secret = req.headers.get("x-cron-secret") ?? "";
  const { data: ok } = await db.rpc("verify_cron_secret", { s: secret });
  if (!ok) return new Response("forbidden", { status: 403 });
  if (!BOT_TOKEN) return new Response("TELEGRAM_BOT_TOKEN missing", { status: 500 });

  const { data, error } = await db
    .from("notifications")
    .select("id, user_id, kind, title, body, link, visible_at, profiles(telegram_id, telegram_notify, telegram_linked_at)")
    .is("telegram_sent_at", null)
    .lte("visible_at", new Date().toISOString())
    .order("visible_at")
    .limit(300);
  if (error) return new Response(error.message, { status: 500 });

  const rows = (data ?? []) as unknown as Row[];
  const now = Date.now();
  const done: string[] = [];
  const byUser = new Map<string, Row[]>();
  for (const r of rows) {
    const p = r.profiles;
    const visible = new Date(r.visible_at).getTime();
    const skip = !p?.telegram_id || !p.telegram_notify || now - visible > STALE_MS ||
      (p.telegram_linked_at && visible < new Date(p.telegram_linked_at).getTime());
    if (skip) { done.push(r.id); continue; }
    byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r]);
  }

  let sent = 0;
  for (const group of byUser.values()) {
    const chatId = group[0].profiles!.telegram_id!;
    const messages = group.length <= MAX_SINGLE
      ? group.map((r) => ({ ids: [r.id], ...single(r) }))
      : [{ ids: group.map((r) => r.id), ...digest(group) }];
    for (const m of messages) {
      const result = await send(chatId, m.text, m.button);
      if (result === "retry") break;
      done.push(...m.ids);
      if (result === "gone") { done.push(...group.map((r) => r.id)); break; }
      sent++;
      // Telegram allows ~30 messages/s overall and ~1/s per chat in bursts.
      await pause(group.length > 1 ? 350 : 50);
    }
  }

  const ids = [...new Set(done)];
  if (ids.length) await db.from("notifications").update({ telegram_sent_at: new Date().toISOString() }).in("id", ids);

  return new Response(JSON.stringify({ sent, marked: ids.length, pending: rows.length - ids.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
