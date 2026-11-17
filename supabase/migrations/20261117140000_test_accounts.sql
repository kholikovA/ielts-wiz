-- Test accounts: real accounts the owner uses to look at the hub as a student.
-- They see one class (group) at a time with a switcher, and never appear on
-- class leaderboards.
alter table public.profiles add column if not exists is_test boolean not null default false;

-- is_test is a role-like flag: only admins / server contexts may change it.
create or replace function public.guard_profile_roles()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin_user(auth.uid()) then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.is_admin := false;
    new.is_teacher := false;
    new.is_test := false;
  elsif new.is_admin is distinct from old.is_admin
     or new.is_teacher is distinct from old.is_teacher
     or new.is_test is distinct from old.is_test then
    raise exception 'Not allowed to change roles' using errcode = '42501';
  end if;
  return new;
end $$;

update public.profiles p set is_test = true
from auth.users u
where u.id = p.id and lower(u.email) = 'abdullohkholikov@gmail.com';

-- Same as 20261116120000_class_leaderboard_per_class.sql, minus test accounts.
create or replace function public.class_leaderboard(p_student uuid default null)
returns table (class_id uuid, class_name text, student_id uuid, name text, avatar_character text, week bigint, balance bigint, is_me boolean)
language plpgsql stable security definer set search_path = public as $$
declare
  uid uuid := coalesce(p_student, auth.uid());
begin
  if uid is distinct from auth.uid() and not public.is_teacher_of(auth.uid(), uid) and not public.is_admin_user(auth.uid()) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return query
  with my_classes as (
    select c.id, c.name
    from class_members m
    join classes c on c.id = m.class_id and not c.archived
    where m.student_id = uid
  ),
  members as (
    select mc.id as cid, mc.name as cname, m.student_id as sid
    from my_classes mc
    join class_members m on m.class_id = mc.id
    where not exists (select 1 from profiles t where t.id = m.student_id and t.is_test)
  ),
  coins as (
    select t.student_id as sid,
      coalesce(sum(t.amount) filter (where t.day > study_day(t.student_id) - 7), 0)::bigint as week,
      coalesce(sum(t.amount), 0)::bigint as balance
    from coin_transactions t
    where t.student_id in (select sid from members)
    group by t.student_id
  )
  select mb.cid, mb.cname, mb.sid,
    coalesce(
      nullif(trim(coalesce(p.first_name, '') || coalesce(' ' || left(nullif(p.last_name, ''), 1) || '.', '')), ''),
      nullif(split_part(coalesce(p.name, ''), ' ', 1), ''),
      'Student'),
    p.avatar_character,
    coalesce(k.week, 0),
    coalesce(k.balance, 0),
    mb.sid = uid
  from members mb
  left join profiles p on p.id = mb.sid
  left join coins k on k.sid = mb.sid
  order by 2, 1, 6 desc, 7 desc, 4;
end $$;

revoke all on function public.class_leaderboard(uuid) from public, anon;
grant execute on function public.class_leaderboard(uuid) to authenticated;
