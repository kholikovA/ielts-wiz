-- Coins per assignment (17 Nov 2026).
--
-- 1. Every assignment pays its own coins (assignments.coins; null = the
--    homework_on_time rule's amount) once it's done by its deadline.
-- 2. Scored work (quizzes, practice tests) must also reach the pass mark:
--    payload.pass_percent, 80% when not set (0 = any score counts).
-- 3. The daily "all homework done" bonus is switched off; the weekly
--    "perfect homework week" bonus stays.
-- Only assignments due (or, without a deadline, set) from today on pay out.

alter table public.assignments add column if not exists coins int
  check (coins is null or coins between 0 and 1000);

create or replace function public.assignment_coins_start()
returns timestamptz language sql immutable as $$ select '2026-11-16 19:00:00+00'::timestamptz $$;

-- When an assignment counts for coins: done, and for scored work at or above the pass mark.
create or replace function public.assignment_passed_at(p_assignment uuid, p_student uuid)
returns timestamptz language sql stable security definer set search_path = public as $$
  select case
    when a.kind = 'quiz' and pp.v > 0 then (
      select min(x.at)
      from submissions s,
        lateral (
          select (h->>'submitted_at')::timestamptz as at, (h->'score'->>'percent')::numeric as pct
          from jsonb_array_elements(coalesce(s.data->'attempts', '[]'::jsonb)) h
          union all
          select s.submitted_at, coalesce(s.marking->'score'->>'percent', s.data->'score'->>'percent')::numeric
          where s.status = 'submitted'
        ) x
      where s.assignment_id = a.id and s.student_id = p_student and x.pct >= pp.v)
    when a.kind = 'test' and pp.v > 0 then (
      select min(t.completed_at) from user_test_results t
      where t.user_id = p_student and t.kind = a.payload->>'kind' and t.test_id = a.payload->>'test_id'
        and t.completed_at >= a.created_at and t.total > 0 and t.correct * 100.0 / t.total >= pp.v)
    else assignment_done_at(a.id, p_student)
  end
  from assignments a,
    lateral (select case when a.kind in ('quiz', 'test')
      then coalesce(case when a.payload->>'pass_percent' ~ '^\s*\d+(\.\d+)?\s*$' then (a.payload->>'pass_percent')::numeric end, 80)
      else 0 end as v) pp
  where a.id = p_assignment;
$$;
revoke all on function public.assignment_passed_at(uuid, uuid) from public, anon;

-- Pays the assignment's coins once it's passed on time. Safe to call repeatedly.
create or replace function public.award_homework(p_student uuid, p_assignment uuid, p_done_at timestamptz)
returns void language plpgsql security definer set search_path = public as $$
declare
  a assignments;
  passed timestamptz;
begin
  select * into a from assignments where id = p_assignment;
  if not found or coalesce(a.due_at, a.created_at) < assignment_coins_start() then return; end if;
  if not exists (select 1 from assignment_recipients where assignment_id = a.id and student_id = p_student) then return; end if;
  passed := assignment_passed_at(a.id, p_student);
  if passed is null or (a.due_at is not null and passed > a.due_at) then return; end if;
  perform award_coins(p_student, 'homework_on_time', a.id::text, a.coins, 'Homework: ' || a.title);
end $$;
revoke execute on function public.award_homework(uuid, uuid, timestamptz) from public, anon, authenticated;

-- Catches what the submit triggers can't see: a teacher's marking that lifts a
-- quiz over the pass mark, or a score stored after the submission.
create or replace function public.homework_coin_sweep()
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in
    select ar.student_id, a.id
    from assignments a join assignment_recipients ar on ar.assignment_id = a.id
    where coalesce(a.due_at, a.created_at) >= assignment_coins_start()
      and a.publish_at <= now()
      and (a.due_at is null or a.due_at > now() - interval '8 days')
      and not exists (select 1 from coin_transactions t
        where t.student_id = ar.student_id and t.reason = 'homework_on_time' and t.ref = a.id::text)
  loop
    perform award_homework(r.student_id, r.id, null);
  end loop;
end $$;
revoke execute on function public.homework_coin_sweep() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'homework-coin-sweep') then
    perform cron.unschedule('homework-coin-sweep');
  end if;
end $$;
select cron.schedule('homework-coin-sweep', '*/15 * * * *', 'select public.homework_coin_sweep()');

update public.reward_rules
  set enabled = true, coins = 2, label = 'Homework on time',
      description = 'Each assignment done by its deadline. Quizzes and practice tests also need the pass mark (80% unless your teacher set another). Your teacher can set a different amount per assignment.'
  where key = 'homework_on_time';
update public.reward_rules set enabled = false where key = 'day_all_homework';
update public.reward_rules
  set description = 'Every assignment due that week was completed on time (and passed, for scored work).'
  where key = 'week_perfect_homework';

-- Pay for anything already passed on time today.
select public.homework_coin_sweep();
