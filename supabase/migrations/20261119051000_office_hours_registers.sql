-- Office hours are a lesson of their own: they get their own register (and
-- attendance, streaks, coins) and go to their own EduSchool subject.
--
-- class_sessions.kind: 'lesson' (the class's normal lessons) or 'office'
-- (office hours). A class can have one of each on the same day.
-- eduschool_class_links.es_office_subject_*: the EduSchool subject that
-- office-hours registers are written to (e.g. "OFFICE HOURS" in 11-A). Lessons
-- are matched by subject, not by period, so a day where EduSchool has the two
-- in a different order (Thursday: office hours and IELTS swapped) still gets
-- each register on the right lesson.

alter table public.class_sessions
  add column if not exists kind text not null default 'lesson'
  check (kind in ('lesson', 'office'));

alter table public.eduschool_class_links
  add column if not exists es_office_subject_id text,
  add column if not exists es_office_subject_name text;
