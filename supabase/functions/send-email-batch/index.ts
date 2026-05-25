// =============================================================================
// send-email-batch — admin-only batch send via Resend.
//
// Verifies the caller's JWT, looks up profiles.is_admin, then fans out one
// Resend API call per recipient. Returns a count of sent/failed.
//
// Deploy:
//   supabase functions deploy send-email-batch
//   supabase secrets set RESEND_API_KEY=re_xxx
//   supabase secrets set RESEND_FROM='IELTS Wiz <hello@ielts-wiz.com>'
//
// Locally:
//   supabase functions serve --no-verify-jwt send-email-batch
// =============================================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "IELTS Wiz <noreply@ielts-wiz.com>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Recipient {
  email: string;
  name?: string;
  target_score?: string;
}

interface RequestPayload {
  recipients: Recipient[];
  subject: string;
  bodyMd: string;
}

const personalise = (template: string, r: Recipient) => template
  .replaceAll("{{name}}", (r.name || "there").split(" ")[0])
  .replaceAll("{{target_score}}", r.target_score || "7.0")
  .replaceAll("{{email}}", r.email || "");

const escapeHtml = (s: string) => s
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

const mdToHtml = (md: string) => {
  const escaped = escapeHtml(md);
  const linked = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#7c3aed">$1</a>'
  );
  return linked
    .split(/\n\n+/)
    .map(p => `<p>${p.replaceAll("\n", "<br>")}</p>`)
    .join("");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({
      error: "RESEND_API_KEY is not set. Run: supabase secrets set RESEND_API_KEY=re_xxx",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    // Authenticate the caller using their JWT, then check is_admin via RLS.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: me, error: meErr } = await supabase
      .from("profiles").select("is_admin").eq("id", user.id).single();
    if (meErr || !me?.is_admin) {
      return new Response(JSON.stringify({ error: "Forbidden — admins only" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const payload = await req.json() as RequestPayload;
    if (!payload?.recipients?.length || !payload?.subject || !payload?.bodyMd) {
      return new Response(JSON.stringify({ error: "recipients[], subject, bodyMd are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Cap so a bad filter can't fire off thousands at once.
    if (payload.recipients.length > 500) {
      return new Response(JSON.stringify({ error: "Refusing to send to >500 recipients in one batch" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Fan out one Resend call per recipient. Resend has a /emails/batch
    // endpoint too, but the per-recipient call lets us personalise subject
    // and body cleanly via the {{name}} / {{target_score}} placeholders.
    for (const r of payload.recipients) {
      if (!r.email) { failed++; continue; }
      const subject = personalise(payload.subject, r);
      const html = mdToHtml(personalise(payload.bodyMd, r));
      try {
        const resp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: RESEND_FROM,
            to: r.email,
            subject,
            html,
          }),
        });
        if (resp.ok) {
          sent++;
        } else {
          failed++;
          if (errors.length < 5) {
            errors.push(`${r.email}: ${resp.status} ${await resp.text().catch(() => "")}`);
          }
        }
      } catch (e) {
        failed++;
        if (errors.length < 5) errors.push(`${r.email}: ${(e as Error).message}`);
      }
    }

    return new Response(JSON.stringify({ sent, failed, errors }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
