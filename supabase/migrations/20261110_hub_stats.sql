-- Student Hub: time on the hub + the teacher Stats page (/teach/stats).
--
-- Time is counted in the browser only while the hub is visible, the window is
-- focused, and the student is active (input in the last few minutes, or audio
-- playing). The browser reports it in small chunks through log_hub_time; the
-- server never credits more than the wall-clock time since the last report, so
-- extra tabs or replayed calls can't inflate it.

create table if not exists public.hub_time (
  student_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,                 -- study day (4am rollover, student's timezone)
  seconds int not null default 0 check (seconds >= 0),
  last_ping_at timestamptz not null default now(),
  primary key (student_id, day)
);
alter table public.hub_time enable row level security;
drop policy if exists "students read own hub time" on public.hub_time;
create policy "students read own hub time" on public.hub_time for select to authenticated
  using (student_id = auth.uid());
drop policy if exists "teachers read students' hub time" on public.hub_time;
create policy "teachers read students' hub time" on public.hub_time for select to authenticated
  using (public.is_teacher_of(auth.uid(), student_id));

create or replace function public.log_hub_time(p_seconds int)
returns void language plpgsql volatile security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  d date;
  last_ping timestamptz;
  credit int;
begin
  if uid is null or p_seconds is null or p_seconds <= 0 then return; end if;
  d := study_day(uid);
  credit := least(p_seconds, 120);
  -- Never credit more than the time since this student's previous report.
  select max(last_ping_at) into last_ping from hub_time where student_id = uid and day >= d - 1;
  if last_ping is not null then
    credit := least(credit, greatest(0, ceil(extract(epoch from now() - last_ping))::int + 2));
  end if;
  insert into hub_time (student_id, day, seconds, last_ping_at)
  values (uid, d, credit, now())
  on conflict (student_id, day) do update
    set seconds = least(86400, hub_time.seconds + excluded.seconds), last_ping_at = now();
end $$;

-- Per-student stats for the teacher's students over study days [p_from, p_to].
-- p_class narrows to one class. Returns { students: [...], days: [...] }.
create or replace function public.teacher_hub_stats(p_from date, p_to date, p_class uuid default null)
returns json language plpgsql stable security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  result json;
begin
  if me is null or not public.is_teacher_user(me) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 3660 then
    raise exception 'Invalid date range' using errcode = '22023';
  end if;

  with studs as (
    select distinct m.student_id as id,
      coalesce(nullif(p.timezone, ''), 'UTC') as tz
    from class_members m
    join classes c on c.id = m.class_id
    join profiles p on p.id = m.student_id
    where c.teacher_id = me and not c.archived and (p_class is null or c.id = p_class)
  ),
  tz_ok as (  -- fall back to UTC for an unknown timezone name
    select s.id, case when exists (select 1 from pg_timezone_names z where z.name = s.tz) then s.tz else 'UTC' end as tz
    from studs s
  ),
  hw as (
    select r.student_id, a.id, a.due_at, assignment_done_at(a.id, r.student_id) as done_at
    from assignment_recipients r
    join assignments a on a.id = r.assignment_id
    join tz_ok s on s.id = r.student_id
    where a.teacher_id = me
      and coalesce(a.publish_at, a.created_at) <= now()
      and ((coalesce(a.due_at, a.publish_at, a.created_at) at time zone s.tz) - interval '4 hours')::date between p_from and p_to
  ),
  att as (
    select s.id as student_id, a.status
    from tz_ok s
    join class_members m on m.student_id = s.id
    join classes c on c.id = m.class_id and c.teacher_id = me and (p_class is null or c.id = p_class)
    join class_sessions cs on cs.class_id = c.id
    left join attendance a on a.session_id = cs.id and a.student_id = s.id
    where cs.held_at <= now() and cs.held_at >= m.joined_at - interval '1 day'
      and ((cs.held_at at time zone s.tz) - interval '4 hours')::date between p_from and p_to
  ),
  rows as (
    select s.id,
      (select coalesce(sum(t.seconds), 0) from hub_time t where t.student_id = s.id and t.day between p_from and p_to) as seconds,
      (select count(*) from hub_time t where t.student_id = s.id and t.day between p_from and p_to and t.seconds >= 60) as active_days,
      (select count(*) from hw where hw.student_id = s.id) as hw_total,
      (select count(*) from hw where hw.student_id = s.id and hw.done_at is not null) as hw_done,
      (select count(*) from hw where hw.student_id = s.id and hw.done_at is not null and (hw.due_at is null or hw.done_at <= hw.due_at)) as hw_on_time,
      (select count(*) from hw where hw.student_id = s.id and hw.done_at is null and hw.due_at < now()) as hw_missed,
      (select coalesce(sum(amount), 0) from coin_transactions ct where ct.student_id = s.id and ct.day between p_from and p_to) as coins_net,
      (select coalesce(sum(amount) filter (where amount > 0), 0) from coin_transactions ct where ct.student_id = s.id and ct.day between p_from and p_to) as coins_earned,
      (select coalesce(-sum(amount) filter (where amount < 0), 0) from coin_transactions ct where ct.student_id = s.id and ct.day between p_from and p_to) as coins_lost,
      (select coalesce(sum(amount), 0) from coin_transactions ct where ct.student_id = s.id) as balance,
      (select count(*) from srs_reviews v where v.student_id = s.id
        and ((v.reviewed_at at time zone s.tz) - interval '4 hours')::date between p_from and p_to) as reviews,
      (select count(*) from user_test_results u where u.user_id = s.id
        and ((u.completed_at at time zone s.tz) - interval '4 hours')::date between p_from and p_to) as tests,
      (select count(*) from game_results g where g.student_id = s.id
        and ((g.created_at at time zone s.tz) - interval '4 hours')::date between p_from and p_to) as games,
      (select count(*) from att where att.student_id = s.id and att.status in ('present', 'late')) as attended,
      (select count(*) from att where att.student_id = s.id and att.status is not null and att.status <> 'excused') as sessions
    from tz_ok s
  )
  select json_build_object(
    'students', coalesce((select json_agg(row_to_json(rows)) from rows), '[]'::json),
    'days', (
      select coalesce(json_agg(json_build_object('day', d::date, 'seconds', coalesce(x.s, 0), 'coins', coalesce(y.c, 0)) order by d), '[]'::json)
      from generate_series(p_from::timestamp, p_to::timestamp, interval '1 day') d
      left join (select t.day, sum(t.seconds) s from hub_time t join tz_ok on tz_ok.id = t.student_id
                 where t.day between p_from and p_to group by t.day) x on x.day = d::date
      left join (select ct.day, sum(ct.amount) c from coin_transactions ct join tz_ok on tz_ok.id = ct.student_id
                 where ct.day between p_from and p_to group by ct.day) y on y.day = d::date
    )
  ) into result;
  return result;
end $$;

revoke execute on function public.log_hub_time(int) from public, anon;
revoke execute on function public.teacher_hub_stats(date, date, uuid) from public, anon;
grant execute on function public.log_hub_time(int) to authenticated;
grant execute on function public.teacher_hub_stats(date, date, uuid) to authenticated;
