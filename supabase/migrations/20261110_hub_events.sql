-- Student Hub activity log (students only; see src/student/telemetry.js).
-- One row per event. Events:
--   session_start / session_end  study sessions (start, end, active time)
--   page_time                    active seconds spent on a page
--   hw_open / hw_start / hw_submit  homework funnel
--   question_time                active seconds + answer changes per test question
--   click                        which buttons and tools are used (label only)
--   error                        script errors and failed requests
-- Rows are deleted after 12 months (hub-events-purge cron job below).

create table if not exists public.hub_events (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid,
  name text not null,
  path text,
  props jsonb not null default '{}'::jsonb,
  at timestamptz not null default now(),
  day date not null
);
create index if not exists hub_events_student_idx on public.hub_events (student_id, at desc);
create index if not exists hub_events_name_idx on public.hub_events (name, day);
create index if not exists hub_events_at_idx on public.hub_events (at);
alter table public.hub_events enable row level security;
drop policy if exists "students read own events" on public.hub_events;
create policy "students read own events" on public.hub_events for select to authenticated
  using (student_id = auth.uid());
drop policy if exists "teachers read students' events" on public.hub_events;
create policy "teachers read students' events" on public.hub_events for select to authenticated
  using (public.is_teacher_of(auth.uid(), student_id));
drop policy if exists "admins read events" on public.hub_events;
create policy "admins read events" on public.hub_events for select to authenticated
  using (public.is_admin_user(auth.uid()));

create or replace function public.try_timestamptz(t text)
returns timestamptz language plpgsql stable as $$
begin
  return t::timestamptz;
exception when others then
  return null;
end $$;

-- Batch insert from the browser. Unknown names and oversized rows are dropped;
-- at most 200 events per call and 20,000 per student per day.
create or replace function public.log_hub_events(p_events jsonb)
returns int language plpgsql volatile security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  today date;
  used int;
  inserted int;
begin
  if uid is null or jsonb_typeof(p_events) <> 'array' then return 0; end if;
  today := study_day(uid);
  select count(*) into used from hub_events where student_id = uid and day = today;
  if used >= 20000 then return 0; end if;

  insert into hub_events (student_id, session_id, name, path, props, at, day)
  select uid,
    public.try_uuid(e->>'session_id'),
    e->>'name',
    left(e->>'path', 200),
    case when jsonb_typeof(e->'props') = 'object' and length((e->'props')::text) <= 2000 then e->'props' else '{}'::jsonb end,
    ts,
    study_day(uid, ts)
  from (
    select e,
      -- client time, clamped to the last 24 hours
      greatest(now() - interval '1 day', least(now(), coalesce(public.try_timestamptz(e->>'at'), now()))) as ts
    from jsonb_array_elements(p_events) with ordinality as x(e, i)
    where i <= least(200, 20000 - used)
  ) ev
  where e->>'name' in ('session_start', 'session_end', 'page_time', 'hw_open', 'hw_start', 'hw_submit',
                       'question_time', 'click', 'error');
  get diagnostics inserted = row_count;
  return inserted;
end $$;

revoke execute on function public.log_hub_events(jsonb) from public, anon;
grant execute on function public.log_hub_events(jsonb) to authenticated;

-- Keep 12 months.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'hub-events-purge') then
    perform cron.unschedule('hub-events-purge');
  end if;
end $$;
select cron.schedule('hub-events-purge', '17 3 * * *',
  $cron$ delete from public.hub_events where at < now() - interval '12 months' $cron$);
