-- Teachers move a student from one of their classes to another in one step.
-- class_members rows are only inserted by security-definer RPCs, so this is one.
create or replace function public.move_class_member(from_class uuid, to_class uuid, student uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Sign in required' using errcode = '42501'; end if;
  if from_class = to_class then raise exception 'Pick a different class' using errcode = '22023'; end if;
  if not exists (select 1 from classes where id = from_class and (teacher_id = uid or public.is_admin_user(uid)))
     or not exists (select 1 from classes where id = to_class and not archived and (teacher_id = uid or public.is_admin_user(uid))) then
    raise exception 'You can only move students between your own classes' using errcode = '42501';
  end if;
  if not exists (select 1 from class_members where class_id = from_class and student_id = student) then
    raise exception 'Student is not in that class' using errcode = 'P0002';
  end if;

  delete from class_members where class_id = from_class and student_id = student;
  -- Homework already assigned from the old class stays (same as Remove).
  insert into class_members (class_id, student_id) values (to_class, student) on conflict do nothing;
  insert into assignment_recipients (assignment_id, student_id)
    select a.id, student from assignments a
    where a.class_id = to_class and (a.due_at is null or a.due_at > now())
    on conflict do nothing;
end $$;

revoke all on function public.move_class_member(uuid, uuid, uuid) from public, anon;
grant execute on function public.move_class_member(uuid, uuid, uuid) to authenticated;
