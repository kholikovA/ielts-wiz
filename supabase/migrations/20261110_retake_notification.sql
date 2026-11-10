-- Tell the student when a teacher allows a retake (in-app bell + email).

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('homework', 'feedback', 'submission', 'retake'));

create or replace function public.allow_retake(p_assignment uuid, p_student uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  a assignments;
begin
  if public.assignment_teacher(p_assignment) is distinct from auth.uid() and not public.is_admin_user(auth.uid()) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  delete from submissions where assignment_id = p_assignment and student_id = p_student;
  delete from usage_checks where assignment_id = p_assignment and student_id = p_student;

  select * into a from assignments where id = p_assignment;
  perform notify(p_student, 'retake',
    'You can retake: ' || a.title,
    coalesce((select name from profiles where id = auth.uid()), 'Your teacher') || ' reset this homework so you can do it again.',
    '/homework/' || a.id,
    a.id::text || ':' || extract(epoch from now())::bigint);
end $$;
