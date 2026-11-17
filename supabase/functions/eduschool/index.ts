// =============================================================================
// eduschool — pushes Student Hub registers to the school's EduSchool journal.
//
//   POST { action, ... }   (teachers only; the gateway verifies the JWT)
//     classes                         → EduSchool classes/groups the staff account teaches
//     subjects { es_class_id }        → subjects of one EduSchool class/group
//     link     { class_id, es_class_id, es_class_label, es_subject_id, es_subject_name }
//     unlink   { class_id }
//     roster   { class_id }           → hub students + EduSchool roster + links
//                                       (auto-links confident name matches)
//     map      { class_id, student_id, es_student_id | null }
//     push     { session_id }         → sends the register, verifies it, stores
//                                       the result in eduschool_session_sync
//
// Mapping: present/late → attended, absent → notAttended, excused → reasonable
// (EduSchool has no "late"). A hub session is a day; it is written to every
// EduSchool lesson of the linked class + subject on that day (Tashkent time).
// Marks already in EduSchool for students the hub doesn't send are re-sent
// unchanged, so a push never clears someone else's mark.
//
// Credentials: Vault secret 'eduschool' = {host, apiKey, login, password, branch},
// read via public.eduschool_secret() (service role only).
// API docs: https://documenter.getpostman.com/view/21642027/2sBXiom9rY
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { matchAll, type EsPerson } from "./match.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
const TZ_OFFSET_MIN = 5 * 60; // Asia/Tashkent, no DST (EduSchool org timezone "+05:00")

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "content-type": "application/json" } });

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

const must = <T>({ data, error }: { data: T; error: unknown }): T => {
  if (error) { console.error("eduschool db", error); throw new HttpError(500, "Database error."); }
  return data;
};

// ── EduSchool client ─────────────────────────────────────────────────────────
type Creds = { host: string; apiKey: string; login: string; password: string; branch: string };
let creds: Creds | null = null;
let token: string | null = null;

async function getCreds(): Promise<Creds> {
  if (creds) return creds;
  const raw = must(await db.rpc("eduschool_secret")) as string | null;
  if (!raw) throw new HttpError(503, "EduSchool isn't configured on the server.");
  const c = JSON.parse(raw);
  creds = { host: c.host || "https://backend.eduschool.uz/external-api", apiKey: c.apiKey, login: c.login, password: c.password, branch: c.branch };
  return creds;
}

const esOk = (b: any) => b && (b.code === 0 || b.success === true);
const esMsg = (b: any) => b?.messages?.en || b?.message || "unknown error";

async function signIn(): Promise<string> {
  const c = await getCreds();
  const res = await fetch(`${c.host}/sign-in`, {
    method: "POST",
    headers: { apiKey: c.apiKey, "content-type": "application/json" },
    body: JSON.stringify({ login: c.login, password: c.password }),
  });
  const b = await res.json().catch(() => null);
  if (!esOk(b)) throw new HttpError(502, `EduSchool sign-in failed: ${esMsg(b)}`);
  // data is keyed by academic year; use the current year's token.
  const entries = b.data?.token ? [b.data] : Object.values(b.data || {}) as any[];
  const cur = entries.find((e) => e?.academicYear?.isCurrent) || entries[0];
  if (!cur?.token) throw new HttpError(502, "EduSchool sign-in returned no token.");
  let exp = Date.now() + 12 * 3600e3;
  try {
    const p = JSON.parse(atob(cur.token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (p.exp) exp = Math.min(p.exp * 1000 - 3600e3, Date.now() + 30 * 86400e3);
  } catch { /* keep default */ }
  must(await db.from("eduschool_token").upsert({ id: 1, token: cur.token, expires_at: new Date(exp).toISOString() }));
  token = cur.token;
  return cur.token;
}

async function getToken(): Promise<string> {
  if (token) return token;
  const row = must(await db.from("eduschool_token").select("token, expires_at").eq("id", 1).maybeSingle()) as any;
  if (row && new Date(row.expires_at).getTime() > Date.now()) return (token = row.token);
  return signIn();
}

async function es(method: string, path: string, body?: unknown, retried = false): Promise<any> {
  const c = await getCreds();
  const t = await getToken();
  const res = await fetch(`${c.host}${path}`, {
    method,
    headers: { apiKey: c.apiKey, branch: c.branch, authorization: `Bearer ${t}`, "content-type": "application/json", language: "en" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const b = await res.json().catch(() => null);
  if ((res.status === 401 || b?.code === 10002) && !retried) {
    token = null;
    await signIn();
    return es(method, path, body, true);
  }
  if (!esOk(b)) {
    const err = new HttpError(502, `EduSchool: ${esMsg(b)}`);
    (err as any).esCode = b?.code;
    throw err;
  }
  return b.data;
}

// ── Hub helpers ──────────────────────────────────────────────────────────────
async function requireTeacher(uid: string) {
  const p = must(await db.from("profiles").select("is_teacher, is_admin").eq("id", uid).maybeSingle()) as any;
  if (!p?.is_teacher && !p?.is_admin) throw new HttpError(403, "Teachers only.");
}

async function requireClass(uid: string, classId: string) {
  const c = must(await db.from("classes").select("id, teacher_id, name").eq("id", classId).maybeSingle()) as any;
  if (!c || c.teacher_id !== uid) throw new HttpError(404, "Class not found.");
  return c;
}

const linkOf = async (classId: string) =>
  must(await db.from("eduschool_class_links").select("*").eq("class_id", classId).maybeSingle()) as any;

async function hubMembers(classId: string) {
  const rows = must(await db.from("class_members")
    .select("student_id, profiles(id, name, email, first_name, last_name, is_test)")
    .eq("class_id", classId)) as any[];
  return rows.map((r) => r.profiles).filter((p) => p && !p.is_test);
}

async function esRoster(esClassId: string): Promise<EsPerson[]> {
  const rows = await es("GET", `/teacher-app/classes/${esClassId}/students`) as any[];
  return rows.map((s) => ({ id: s._id, fullName: s.fullName, firstName: s.firstName, lastName: s.lastName }));
}

// Current links for these students; auto-links confident new matches.
async function ensureLinks(members: any[], roster: EsPerson[]) {
  const ids = members.map((m) => m.id);
  if (!ids.length) return new Map<string, any>();
  const [links, skips] = await Promise.all([
    db.from("eduschool_student_links").select("*").in("student_id", ids),
    db.from("eduschool_student_skips").select("student_id").in("student_id", ids),
  ]);
  const byStudent = new Map<string, any>((must(links) as any[]).map((l) => [l.student_id, l]));
  const skipped = new Set((must(skips) as any[]).map((s) => s.student_id));
  const open = members.filter((m) => !byStudent.has(m.id) && !skipped.has(m.id));
  if (open.length) {
    const taken = new Set([...byStudent.values()].map((l) => l.es_student_id));
    const found = matchAll(open, roster, taken);
    const rows = [...found].map(([sid, p]) => ({
      student_id: sid, es_student_id: p.id, es_student_name: p.fullName, matched_by: "auto", updated_at: new Date().toISOString(),
    }));
    if (rows.length) {
      must(await db.from("eduschool_student_links").upsert(rows));
      rows.forEach((r) => byStudent.set(r.student_id, r));
    }
  }
  return byStudent;
}

// Tashkent calendar day of an instant, and that day's bounds as UTC instants.
function dayWindow(iso: string) {
  const local = new Date(new Date(iso).getTime() + TZ_OFFSET_MIN * 60e3);
  const day = local.toISOString().slice(0, 10);
  const start = new Date(Date.parse(`${day}T00:00:00Z`) - TZ_OFFSET_MIN * 60e3);
  const end = new Date(start.getTime() + 86400e3 - 1000);
  const z = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "Z");
  return { day, from: z(start), to: z(end) };
}

const STATE: Record<string, string> = { present: "attended", late: "attended", absent: "notAttended", excused: "reasonable" };

// ── Actions ──────────────────────────────────────────────────────────────────
async function push(uid: string, sessionId: string) {
  const s = must(await db.from("class_sessions").select("id, class_id, held_at").eq("id", sessionId).maybeSingle()) as any;
  if (!s) throw new HttpError(404, "Session not found.");
  await requireClass(uid, s.class_id);

  const save = async (r: Record<string, unknown>) => {
    const row = { session_id: sessionId, lessons: [], sent: 0, unlinked: [], message: null, ...r, synced_at: new Date().toISOString() };
    must(await db.from("eduschool_session_sync").upsert(row));
    return row;
  };

  const link = await linkOf(s.class_id);
  if (!link) return save({ status: "not_linked", message: "This class isn't linked to EduSchool." });

  try {
    const { day, from, to } = dayWindow(s.held_at);
    const days = await es("GET", `/lessons?fromDate=${from}&toDate=${to}`) as any[];
    const lessons = days
      .filter((d) => d.class?._id === link.es_class_id && d.date === day)
      .flatMap((d) => d.classLessons || [])
      .filter((l) => l.subject?._id === link.es_subject_id)
      .sort((a, b) => (a.period?.lessonHour ?? 0) - (b.period?.lessonHour ?? 0));
    if (!lessons.length) {
      return save({ status: "no_lessons", message: `No ${link.es_subject_name} lesson for ${link.es_class_label} on ${day} in EduSchool.` });
    }

    const [members, marksRes, roster] = await Promise.all([
      hubMembers(s.class_id),
      db.from("attendance").select("student_id, status").eq("session_id", sessionId),
      esRoster(link.es_class_id),
    ]);
    const marks = must(marksRes) as any[];
    const links = await ensureLinks(members, roster);
    const onRoster = new Set(roster.map((p) => p.id));
    const names = new Map(members.map((m) => [m.id, m.name || m.email || "Unnamed"]));

    const send = new Map<string, string>(); // es student id → state
    const unlinked: string[] = [];
    for (const m of marks) {
      if (!names.has(m.student_id)) continue; // test accounts / left the class
      const l = links.get(m.student_id);
      if (!l || !onRoster.has(l.es_student_id)) { unlinked.push(names.get(m.student_id)!); continue; }
      send.set(l.es_student_id, STATE[m.status]);
    }

    const done: any[] = [];
    const problems: string[] = [];
    if (send.size) {
      for (const l of lessons) {
        const label = `${l.period?.lessonHour ?? "?"}-para${l.period?.startHour ? ` (${l.period.startHour})` : ""}`;
        // Keep every mark already in EduSchool that we aren't changing.
        let existing: any[] = [];
        let canRead = true;
        try {
          existing = (await es("GET", `/teacher-app/lessons/${l.lessonId}/attendance`))?.students || [];
        } catch { canRead = false; }
        const students = existing
          .filter((x) => !send.has(x.studentId) && x.state && !["unchecked", "created"].includes(x.state))
          .map((x) => ({ studentId: x.studentId, state: x.state, ...(x.mark != null ? { mark: x.mark } : {}) }));
        const markOf = new Map(existing.map((x) => [x.studentId, x.mark]));
        for (const [studentId, state] of send) {
          const mark = markOf.get(studentId);
          students.push({ studentId, state, ...(mark != null ? { mark } : {}) });
        }
        try {
          await es("POST", "/attendances", { lessonId: l.lessonId, classId: link.es_class_id, students });
        } catch (e) {
          problems.push(`${label}: ${(e as Error).message}`);
          continue;
        }
        let verified: boolean | null = null;
        if (canRead) {
          const after = (await es("GET", `/teacher-app/lessons/${l.lessonId}/attendance`))?.students || [];
          const got = new Map(after.map((x: any) => [x.studentId, x.state]));
          verified = [...send].every(([id, st]) => got.get(id) === st);
          if (!verified) problems.push(`${label}: EduSchool didn't keep every mark`);
        }
        done.push({ id: l.lessonId, label, verified });
      }
    }

    const status = problems.length ? (done.some((d) => d.verified !== false) ? "partial" : "error")
      : unlinked.length ? "partial" : "ok";
    return save({
      status, lessons: done, sent: send.size, unlinked,
      message: problems.join("; ") || (send.size ? null : "No marked students are linked to EduSchool yet."),
    });
  } catch (e) {
    console.error("eduschool push", sessionId, e);
    return save({ status: "error", message: (e as Error).message });
  }
}

async function handle(uid: string, body: any) {
  await requireTeacher(uid);
  switch (body?.action) {
    case "classes": {
      const rows = await es("GET", "/teacher-app/classes") as any[];
      return rows.map((c) => ({ id: c._id, label: c.label, type: c.type, students: c.studentsCount }));
    }
    case "subjects": {
      if (!body.es_class_id) throw new HttpError(400, "es_class_id is required.");
      const rows = await es("GET", `/journal/${encodeURIComponent(body.es_class_id)}`) as any[];
      const seen = new Map<string, any>();
      for (const r of rows) {
        if (!r.subject?._id || seen.has(r.subject._id)) continue;
        const t = Array.isArray(r.teacher) ? r.teacher[0] : r.teacher;
        seen.set(r.subject._id, { id: r.subject._id, name: r.subject.name, teacher: t ? `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim() : null });
      }
      return [...seen.values()];
    }
    case "link": {
      await requireClass(uid, body.class_id);
      const f = ["es_class_id", "es_class_label", "es_subject_id", "es_subject_name"];
      if (f.some((k) => typeof body[k] !== "string" || !body[k])) throw new HttpError(400, "Pick a class and a subject.");
      must(await db.from("eduschool_class_links").upsert({
        class_id: body.class_id, es_class_id: body.es_class_id, es_class_label: body.es_class_label,
        es_subject_id: body.es_subject_id, es_subject_name: body.es_subject_name, updated_at: new Date().toISOString(),
      }));
      return { ok: true };
    }
    case "unlink": {
      await requireClass(uid, body.class_id);
      must(await db.from("eduschool_class_links").delete().eq("class_id", body.class_id));
      return { ok: true };
    }
    case "roster": {
      await requireClass(uid, body.class_id);
      const link = await linkOf(body.class_id);
      if (!link) return { link: null };
      const [members, roster] = await Promise.all([hubMembers(body.class_id), esRoster(link.es_class_id)]);
      const links = await ensureLinks(members, roster);
      const skips = members.length
        ? new Set((must(await db.from("eduschool_student_skips").select("student_id").in("student_id", members.map((m) => m.id))) as any[]).map((r) => r.student_id))
        : new Set();
      return {
        link,
        roster: roster.map((p) => ({ id: p.id, name: p.fullName })).sort((a, b) => a.name.localeCompare(b.name)),
        students: members.map((m) => {
          const l = links.get(m.id);
          return {
            id: m.id, name: m.name, email: m.email,
            es_student_id: l?.es_student_id ?? null, es_student_name: l?.es_student_name ?? null,
            matched_by: l?.matched_by ?? null, skipped: skips.has(m.id),
            in_roster: l ? roster.some((p) => p.id === l.es_student_id) : null,
          };
        }),
      };
    }
    case "map": {
      await requireClass(uid, body.class_id);
      const member = must(await db.from("class_members").select("student_id").eq("class_id", body.class_id).eq("student_id", body.student_id).maybeSingle());
      if (!member) throw new HttpError(404, "Student not in this class.");
      if (body.es_student_id) {
        const link = await linkOf(body.class_id);
        if (!link) throw new HttpError(400, "Link the class first.");
        const p = (await esRoster(link.es_class_id)).find((x) => x.id === body.es_student_id);
        if (!p) throw new HttpError(400, "That student isn't in the EduSchool class.");
        must(await db.from("eduschool_student_links").upsert({
          student_id: body.student_id, es_student_id: p.id, es_student_name: p.fullName, matched_by: "teacher", updated_at: new Date().toISOString(),
        }));
        must(await db.from("eduschool_student_skips").delete().eq("student_id", body.student_id));
      } else {
        must(await db.from("eduschool_student_links").delete().eq("student_id", body.student_id));
        must(await db.from("eduschool_student_skips").upsert({ student_id: body.student_id }));
      }
      return { ok: true };
    }
    case "push": {
      if (!body.session_id) throw new HttpError(400, "session_id is required.");
      return push(uid, body.session_id);
    }
    default:
      throw new HttpError(400, "Unknown action.");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  const uid = userIdFrom(req);
  if (!uid) return json({ error: "Sign in again." }, 401);
  try {
    return json(await handle(uid, await req.json().catch(() => null)));
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    console.error("eduschool", e);
    return json({ error: "Something went wrong talking to EduSchool." }, 500);
  }
});
