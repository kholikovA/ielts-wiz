-- Class leaderboard for the hub dashboard: everyone in the student's (non-archived)
-- classes with coins earned in the last 7 study days and their balance.
-- Shows first name + last initial and the picked character only.
create or replace function public.class_leaderboard(p_student uuid default null)
returns table (student_id uuid, name text, avatar_character text, week bigint, balance bigint, is_me boolean)
language plpgsql stable security definer set search_path = public as $$
declare
  uid uuid := coalesce(p_student, auth.uid());
begin
  if uid is distinct from auth.uid() and not public.is_teacher_of(auth.uid(), uid) and not public.is_admin_user(auth.uid()) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return query
  with mates as (
    select m2.student_id as sid
    from class_members m1
    join classes c on c.id = m1.class_id and not c.archived
    join class_members m2 on m2.class_id = m1.class_id
    where m1.student_id = uid
    union
    select uid
  )
  select s.sid,
    coalesce(
      nullif(trim(coalesce(p.first_name, '') || coalesce(' ' || left(nullif(p.last_name, ''), 1) || '.', '')), ''),
      nullif(split_part(coalesce(p.name, ''), ' ', 1), ''),
      'Student'),
    p.avatar_character,
    (select coalesce(sum(t.amount), 0) from coin_transactions t where t.student_id = s.sid and t.day > study_day(s.sid) - 7)::bigint,
    (select coalesce(sum(t.amount), 0) from coin_transactions t where t.student_id = s.sid)::bigint,
    s.sid = uid
  from mates s
  left join profiles p on p.id = s.sid
  order by 4 desc, 5 desc, 2;
end $$;

revoke all on function public.class_leaderboard(uuid) from public, anon;
grant execute on function public.class_leaderboard(uuid) to authenticated;
