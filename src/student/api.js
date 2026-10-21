import { supabase } from '../supabaseClient';

// Data layer for the Student Hub. Tables + RPCs come from
// supabase/migrations/20261021_student_hub_homework.sql; RLS does the scoping,
// but every user_test_results query still filters by user_id explicitly (the
// admin/teacher SELECT policies would otherwise widen the result set).

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

const PROFILE_COLS = 'id, name, email, target_score, avatar_url, last_sign_in_at';

// ── Student ──────────────────────────────────────────────────────────────────
export const myClasses = async () => unwrap(await supabase.rpc('my_classes')) || [];
export const previewClass = async (code) => unwrap(await supabase.rpc('class_by_code', { code }));
export const joinClass = async (code) => unwrap(await supabase.rpc('join_class', { code }));
export const leaveClass = async (classId, uid) =>
  unwrap(await supabase.from('class_members').delete().eq('class_id', classId).eq('student_id', uid));

// Everything assigned to `uid`, with their submission (if any) attached.
export async function studentHomework(uid) {
  const [rec, subs] = await Promise.all([
    supabase.from('assignment_recipients').select('assigned_at, assignments(*)').eq('student_id', uid),
    supabase.from('submissions').select('*').eq('student_id', uid),
  ]);
  const byAssignment = new Map((unwrap(subs) || []).map((s) => [s.assignment_id, s]));
  return (unwrap(rec) || [])
    .filter((r) => r.assignments)
    .map((r) => ({ ...r.assignments, assigned_at: r.assigned_at, submission: byAssignment.get(r.assignments.id) || null }));
}

export async function assignmentForStudent(id, uid) {
  const [a, s] = await Promise.all([
    supabase.from('assignments').select('*').eq('id', id).maybeSingle(),
    supabase.from('submissions').select('*').eq('assignment_id', id).eq('student_id', uid).maybeSingle(),
  ]);
  const assignment = unwrap(a);
  return assignment ? { ...assignment, submission: unwrap(s) } : null;
}

export async function saveSubmission(assignmentId, uid, fields) {
  return unwrap(await supabase
    .from('submissions')
    .upsert({ assignment_id: assignmentId, student_id: uid, ...fields }, { onConflict: 'assignment_id,student_id' })
    .select()
    .single());
}

export async function testResults(uid) {
  return unwrap(await supabase
    .from('user_test_results')
    .select('kind, test_id, correct, total, completed_at')
    .eq('user_id', uid)
    .order('completed_at', { ascending: false })) || [];
}

export async function savedWords(uid) {
  return unwrap(await supabase
    .from('user_vocab_words')
    .select('word, definition, example')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })) || [];
}

// ── Teacher ──────────────────────────────────────────────────────────────────
export async function teacherClasses(uid) {
  return unwrap(await supabase
    .from('classes')
    .select('*, class_members(count)')
    .eq('teacher_id', uid)
    .eq('archived', false)
    .order('created_at')) || [];
}

export const createClass = async (name) =>
  unwrap(await supabase.from('classes').insert({ name }).select().single());

export const renameClass = async (id, name) =>
  unwrap(await supabase.from('classes').update({ name }).eq('id', id));

export const archiveClass = async (id) =>
  unwrap(await supabase.from('classes').update({ archived: true }).eq('id', id));

export async function newJoinCode(id) {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, 'X');
  return unwrap(await supabase.from('classes').update({ join_code: code }).eq('id', id).select().single());
}

export async function classWithMembers(id) {
  const [c, m] = await Promise.all([
    supabase.from('classes').select('*').eq('id', id).maybeSingle(),
    supabase.from('class_members').select(`joined_at, student_id, profiles(${PROFILE_COLS})`).eq('class_id', id).order('joined_at'),
  ]);
  const cls = unwrap(c);
  return cls ? { ...cls, members: (unwrap(m) || []).map((r) => ({ ...r.profiles, joined_at: r.joined_at })) } : null;
}

export const removeMember = async (classId, studentId) =>
  unwrap(await supabase.from('class_members').delete().eq('class_id', classId).eq('student_id', studentId));

// Every student across the teacher's classes, deduped, with the classes they're in.
export async function teacherStudents(uid) {
  const classes = await teacherClasses(uid);
  if (classes.length === 0) return { classes, students: [] };
  const rows = unwrap(await supabase
    .from('class_members')
    .select(`class_id, joined_at, profiles(${PROFILE_COLS})`)
    .in('class_id', classes.map((c) => c.id))) || [];
  const names = new Map(classes.map((c) => [c.id, c.name]));
  const byId = new Map();
  rows.forEach((r) => {
    if (!r.profiles) return;
    const s = byId.get(r.profiles.id) || { ...r.profiles, classIds: [], classNames: [] };
    s.classIds.push(r.class_id);
    s.classNames.push(names.get(r.class_id));
    byId.set(s.id, s);
  });
  const students = [...byId.values()].sort((a, b) => (a.name || a.email || '').localeCompare(b.name || b.email || ''));
  return { classes, students };
}

export const studentProfile = async (id) =>
  unwrap(await supabase.from('profiles').select(PROFILE_COLS).eq('id', id).maybeSingle());

export async function teacherAssignments(uid) {
  return unwrap(await supabase
    .from('assignments')
    .select('*, classes(name), assignment_recipients(student_id), submissions(student_id, status, reviewed_at)')
    .eq('teacher_id', uid)
    .order('created_at', { ascending: false })) || [];
}

export async function createAssignment(fields, studentIds) {
  const a = unwrap(await supabase.from('assignments').insert(fields).select().single());
  if (studentIds.length) {
    const { error } = await supabase
      .from('assignment_recipients')
      .insert(studentIds.map((student_id) => ({ assignment_id: a.id, student_id })));
    if (error) {
      await supabase.from('assignments').delete().eq('id', a.id);
      throw error;
    }
  }
  return a;
}

export const deleteAssignment = async (id) => unwrap(await supabase.from('assignments').delete().eq('id', id));

export async function assignmentDetail(id) {
  const [a, r, s] = await Promise.all([
    supabase.from('assignments').select('*, classes(name)').eq('id', id).maybeSingle(),
    supabase.from('assignment_recipients').select(`student_id, assigned_at, profiles(${PROFILE_COLS})`).eq('assignment_id', id),
    supabase.from('submissions').select('*').eq('assignment_id', id),
  ]);
  const assignment = unwrap(a);
  if (!assignment) return null;
  const recipients = (unwrap(r) || []).map((x) => ({ ...x.profiles, id: x.student_id, assigned_at: x.assigned_at }));
  let results = [];
  if (assignment.kind === 'test' && recipients.length) {
    results = unwrap(await supabase
      .from('user_test_results')
      .select('user_id, correct, total, completed_at')
      .in('user_id', recipients.map((x) => x.id))
      .eq('kind', assignment.payload.kind)
      .eq('test_id', String(assignment.payload.test_id))
      .gte('completed_at', assignment.created_at)
      .order('completed_at', { ascending: false })) || [];
  }
  return { ...assignment, recipients, submissions: unwrap(s) || [], results };
}

// Assignments this teacher set for one student, with that student's submissions.
export async function homeworkForStudent(teacherId, studentId) {
  const [rec, subs] = await Promise.all([
    supabase.from('assignment_recipients').select('assigned_at, assignments!inner(*)').eq('student_id', studentId).eq('assignments.teacher_id', teacherId),
    supabase.from('submissions').select('*').eq('student_id', studentId),
  ]);
  const byAssignment = new Map((unwrap(subs) || []).map((x) => [x.assignment_id, x]));
  return (unwrap(rec) || []).map((x) => ({ ...x.assignments, assigned_at: x.assigned_at, submission: byAssignment.get(x.assignments.id) || null }));
}

export const reviewSubmission = async (id, band, feedback) =>
  unwrap(await supabase.rpc('review_submission', { sub: id, p_band: band, p_feedback: feedback }));

// ── Admin ────────────────────────────────────────────────────────────────────
export const setTeacher = async (target, on) =>
  unwrap(await supabase.rpc('set_teacher', { target, on_off: on }));
