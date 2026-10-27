-- Teacher: let a student do an assignment again. Removes their submission (answers,
-- score, feedback, AI marking) and their "use it" sentence checks for that assignment.
-- Coins already earned are kept; submitting again doesn't award them twice.
create or replace function public.allow_retake(p_assignment uuid, p_student uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.assignment_teacher(p_assignment) is distinct from auth.uid() and not public.is_admin_user(auth.uid()) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  delete from submissions where assignment_id = p_assignment and student_id = p_student;
  delete from usage_checks where assignment_id = p_assignment and student_id = p_student;
end $$;

revoke all on function public.allow_retake(uuid, uuid) from public, anon;
grant execute on function public.allow_retake(uuid, uuid) to authenticated;
