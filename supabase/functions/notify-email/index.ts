// =============================================================================
// notify-email — emails pending Student Hub notifications (new homework,
// teacher feedback) via Resend.
//
// Called every 5 minutes by pg_cron (job "notify-email", see migration
// 20261021_hub_rewards_attendance_notifications.sql) with an x-cron-secret
// header that is checked against the vault secret `notify_cron_secret`.
// Scheduled homework is emailed when it publishes, because notifications carry
// visible_at = publish time and only visible ones are picked up.
//
// Deploy (JWT verification off — the cron secret is the auth):
//   supabase functions deploy notify-email --no-verify-jwt
// Uses the existing RESEND_API_KEY / RESEND_FROM secrets.
// =============================================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "IELTS Wiz <noreply@ielts-wiz.com>";
const HUB_URL = "https://student.ielts-wiz.com";
// Don't email a backlog: anything visible for longer than this is marked done silently.
const STALE_MS = 2 * 24 * 60 * 60 * 1000;

interface Row {
  id: string;
  user_id: string;
  kind: "homework" | "feedback" | "submission";
  title: string;
  body: string | null;
  link: string | null;
  visible_at: string;
  profiles: { email: string | null; name: string | null } | null;
}

const esc = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

function render(name: string | null, rows: Row[]) {
  const first = (name || "there").split(" ")[0];
  const subject = rows.length === 1 ? rows[0].title : `${rows.length} updates in your Student Hub`;
  const items = rows.map((r) => {
    const url = `${HUB_URL}${r.link || "/"}`;
    return `<tr><td style="padding:12px 0;border-bottom:1px solid #eee">
      <a href="${url}" style="color:#111;font-weight:600;text-decoration:none">${esc(r.title)}</a>
      ${r.body ? `<div style="color:#666;font-size:14px;margin-top:4px">${esc(r.body)}</div>` : ""}
    </td></tr>`;
  }).join("");
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;color:#111">
    <p>Hi ${esc(first)},</p>
    <table style="width:100%;border-collapse:collapse">${items}</table>
    <p style="margin-top:24px"><a href="${HUB_URL}" style="background:#4f46e5;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">Open Student Hub</a></p>
    <p style="color:#999;font-size:12px;margin-top:32px">You're getting this because you're in a class on IELTS Wiz.</p>
  </div>`;
  const text = `Hi ${first},\n\n${rows.map((r) => `${r.title}${r.body ? ` — ${r.body}` : ""}\n${HUB_URL}${r.link || "/"}`).join("\n\n")}\n`;
  return { subject, html, text };
}

serve(async (req) => {
  const db = createClient(SUPABASE_URL, SERVICE_ROLE);

  const secret = req.headers.get("x-cron-secret") ?? "";
  const { data: ok } = await db.rpc("verify_cron_secret", { s: secret });
  if (!ok) return new Response("forbidden", { status: 403 });
  if (!RESEND_API_KEY) return new Response("RESEND_API_KEY missing", { status: 500 });

  const { data, error } = await db
    .from("notifications")
    .select("id, user_id, kind, title, body, link, visible_at, profiles(email, name)")
    .is("emailed_at", null)
    .eq("email", true)
    .lte("visible_at", new Date().toISOString())
    .order("visible_at")
    .limit(200);
  if (error) return new Response(error.message, { status: 500 });

  const rows = (data ?? []) as unknown as Row[];
  const now = Date.now();
  const byUser = new Map<string, Row[]>();
  const skip: string[] = [];
  for (const r of rows) {
    if (!r.profiles?.email || now - new Date(r.visible_at).getTime() > STALE_MS) { skip.push(r.id); continue; }
    byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r]);
  }

  let sent = 0;
  const done: string[] = [...skip];
  for (const group of byUser.values()) {
    const { subject, html, text } = render(group[0].profiles!.name, group);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: RESEND_FROM, to: group[0].profiles!.email, subject, html, text }),
    });
    if (res.ok) { sent++; done.push(...group.map((r) => r.id)); }
    // Stay under Resend's 5 req/s.
    await new Promise((r) => setTimeout(r, 250));
  }

  if (done.length) {
    await db.from("notifications").update({ emailed_at: new Date().toISOString() }).in("id", done);
  }
  return new Response(JSON.stringify({ sent, skipped: skip.length, pending: rows.length - done.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
