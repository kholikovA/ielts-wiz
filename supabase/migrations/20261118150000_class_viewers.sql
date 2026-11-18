-- Viewers: read-only accounts (e.g. a Head Teacher) that see chosen groups' stats.
--
--   class_viewers        which accounts may view which classes. Granted by the class's
--                        teacher (or an admin) from the class page; no client writes.
--   viewer_overview()    everything the viewer page shows, for the caller's classes only:
--                        homework completion and scores, attendance, coins. Scores only:
--                        no essay text, feedback, answers or chat.
--
-- Read-only by construction: viewers get no table policies besides reading their own
-- grants, and the only data function they can call does nothing but select.

create table if not exists public.class_viewers (
  class_id uuid not null references public.classes(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  granted_by uuid default auth.uid() references public.profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (class_id, viewer_id)
);
create index if not exists class_viewers_viewer_idx on public.class_viewers (viewer_id);
alter table public.class_viewers enable row level security;

drop policy if exists "viewers read own grants" on public.class_viewers;
create policy "viewers read own grants" on public.class_viewers for select to authenticated
  using (viewer_id = auth.uid());
drop policy if exists "teachers read grants on own classes" on public.class_viewers;
create policy "teachers read grants on own classes" on public.class_viewers for select to authenticated
  using (public.class_teacher(class_id) = auth.uid() or public.is_admin_user(auth.uid()));
-- No insert/update/delete policies: grants change only through the functions below.

create or replace function public.can_manage_class(p_class uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null
    and (public.class_teacher(p_class) = auth.uid() or public.is_admin_user(auth.uid()));
$$;

-- Teacher: who can view this class.
create or replace function public.class_viewer_list(p_class uuid)
returns table (viewer_id uuid, name text, email text, granted_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can_manage_class(p_class) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return query
  select v.viewer_id, p.name, u.email::text, v.granted_at
  from class_viewers v
  join profiles p on p.id = v.viewer_id
  left join auth.users u on u.id = v.viewer_id
  where v.class_id = p_class
  order by v.granted_at;
end $$;

-- Teacher: let the account with this email view this class.
create or replace function public.add_class_viewer(p_class uuid, p_email text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  target uuid;
begin
  if not public.can_manage_class(p_class) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  select u.id into target from auth.users u where lower(u.email) = lower(trim(p_email)) limit 1;
  if target is null then
    raise exception 'No account uses that email yet. Ask them to sign up on the Student Hub first, then add them again.' using errcode = 'P0002';
  end if;
  if target = public.class_teacher(p_class) then
    raise exception 'That is the teacher of this group.' using errcode = '22023';
  end if;
  if exists (select 1 from class_members where student_id = target) then
    raise exception 'That account is a student in a group. Viewers need an account of their own.' using errcode = '22023';
  end if;
  insert into class_viewers (class_id, viewer_id) values (p_class, target)
  on conflict do nothing;
  -- Onboarding asks student questions (target band, exam date); viewers skip it.
  update profiles set onboarded = true where id = target and onboarded is distinct from true;
  return target;
end $$;

-- Teacher: stop an account viewing this class.
create or replace function public.remove_class_viewer(p_class uuid, p_viewer uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_manage_class(p_class) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  delete from class_viewers where class_id = p_class and viewer_id = p_viewer;
end $$;

-- Viewer page data. p_from limits homework (by due date) and classes (by date held);
-- null means all time. Coins: current balance, this study week, and earned since p_from.
create or replace function public.viewer_overview(p_from timestamptz default null)
returns json language plpgsql stable security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  result json;
begin
  if me is null then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  with cls as (
    select c.id, c.name, c.teacher_id
    from class_viewers v join classes c on c.id = v.class_id
    where v.viewer_id = me and not c.archived
  ),
  mem as (
    select m.class_id, m.student_id, m.joined_at
    from class_members m
    join cls on cls.id = m.class_id
    join profiles p on p.id = m.student_id
    where not coalesce(p.is_test, false)
  ),
  asg as (
    select a.id, a.class_id, a.kind, a.title, a.due_at, a.created_at, a.payload,
      coalesce(a.publish_at, a.created_at) as posted_at
    from assignments a
    join cls on cls.id = a.class_id
    where coalesce(a.publish_at, a.created_at) <= now()
      and (p_from is null or coalesce(a.due_at, a.publish_at, a.created_at) >= p_from)
  ),
  res as (
    select a.id as assignment_id, r.student_id,
      public.assignment_done_at(a.id, r.student_id) as done_at,
      case
        when a.kind = 'quiz' and s.status = 'submitted' and jsonb_typeof(s.data->'score'->'percent') = 'number'
          then (s.data->'score'->>'percent')::numeric
        when a.kind = 'dictation' and s.status = 'submitted' and jsonb_typeof(s.data->'score'->'accuracy') = 'number'
          then (s.data->'score'->>'accuracy')::numeric
        when a.kind = 'test' then (
          select round(100.0 * t.correct / nullif(t.total, 0))
          from user_test_results t
          where t.user_id = r.student_id and t.kind = a.payload->>'kind' and t.test_id = a.payload->>'test_id'
            and t.completed_at >= a.created_at
          order by t.completed_at limit 1)
      end as score,
      case when a.kind = 'writing' and s.reviewed_at is not null then s.band end as band
    from asg a
    join assignment_recipients r on r.assignment_id = a.id
    join mem on mem.class_id = a.class_id and mem.student_id = r.student_id
    left join submissions s on s.assignment_id = a.id and s.student_id = r.student_id
  ),
  ses as (
    select cs.id, cs.class_id, cs.held_at, cs.topic
    from class_sessions cs join cls on cls.id = cs.class_id
    where cs.held_at <= now() and (p_from is null or cs.held_at >= p_from)
  ),
  att as (
    select ses.id as session_id, mem.student_id, a.status
    from ses
    join mem on mem.class_id = ses.class_id and ses.held_at >= mem.joined_at - interval '1 day'
    join attendance a on a.session_id = ses.id and a.student_id = mem.student_id
  ),
  studs as (
    select distinct mem.student_id as id from mem
  )
  select json_build_object(
    'classes', coalesce((select json_agg(json_build_object(
        'id', cls.id, 'name', cls.name, 'teacher', (select p.name from profiles p where p.id = cls.teacher_id)
      ) order by cls.name) from cls), '[]'::json),
    'members', coalesce((select json_agg(json_build_object('class_id', class_id, 'student_id', student_id)) from mem), '[]'::json),
    'students', coalesce((select json_agg(json_build_object(
        'id', p.id, 'name', p.name, 'avatar_url', p.avatar_url, 'avatar_character', p.avatar_character,
        'balance', (select coalesce(sum(t.amount), 0) from coin_transactions t where t.student_id = p.id),
        'week', (select coalesce(sum(t.amount), 0) from coin_transactions t
                 where t.student_id = p.id and t.day > public.study_day(p.id) - 7),
        'earned', (select coalesce(sum(t.amount) filter (where t.amount > 0), 0) from coin_transactions t
                   where t.student_id = p.id and (p_from is null or t.day >= p_from::date)),
        'last_active', (select max(h.day) from hub_time h where h.student_id = p.id and h.seconds >= 60),
        'homework_streak', public.homework_streak(p.id),
        'attendance_streak', public.attendance_streak(p.id)
      )) from studs join profiles p on p.id = studs.id), '[]'::json),
    'assignments', coalesce((select json_agg(json_build_object(
        'id', id, 'class_id', class_id, 'kind', kind, 'title', title, 'due_at', due_at, 'posted_at', posted_at
      ) order by coalesce(due_at, posted_at) desc) from asg), '[]'::json),
    'results', coalesce((select json_agg(json_build_object(
        'assignment_id', assignment_id, 'student_id', student_id, 'done_at', done_at, 'score', score, 'band', band
      )) from res), '[]'::json),
    'sessions', coalesce((select json_agg(json_build_object(
        'id', id, 'class_id', class_id, 'held_at', held_at, 'topic', topic
      ) order by held_at desc) from ses), '[]'::json),
    'attendance', coalesce((select json_agg(json_build_object(
        'session_id', session_id, 'student_id', student_id, 'status', status
      )) from att), '[]'::json)
  ) into result;
  return result;
end $$;

revoke all on function public.can_manage_class(uuid) from public, anon;
revoke all on function public.class_viewer_list(uuid) from public, anon;
revoke all on function public.add_class_viewer(uuid, text) from public, anon;
revoke all on function public.remove_class_viewer(uuid, uuid) from public, anon;
revoke all on function public.viewer_overview(timestamptz) from public, anon;
grant execute on function public.can_manage_class(uuid) to authenticated;
grant execute on function public.class_viewer_list(uuid) to authenticated;
grant execute on function public.add_class_viewer(uuid, text) to authenticated;
grant execute on function public.remove_class_viewer(uuid, uuid) to authenticated;
grant execute on function public.viewer_overview(timestamptz) to authenticated;
grant select on public.class_viewers to authenticated;
