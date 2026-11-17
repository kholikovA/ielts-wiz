-- Award the homework coin the moment a teacher marks a submission, instead of
-- waiting for the 15-minute homework_coin_sweep. award_homework is idempotent
-- (unique student/reason/ref) and re-checks pass mark + on-time itself.
create or replace function public.on_submission_change()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare
  a assignments;
  prev_best numeric;
begin
  select * into a from assignments where id = new.assignment_id;

  if new.status = 'submitted' and (tg_op = 'INSERT' or old.status is distinct from 'submitted') then
    perform award_homework(new.student_id, new.assignment_id, coalesce(new.submitted_at, now()));
    perform note_activity(new.student_id);
    if a.kind in ('writing', 'custom', 'dictation', 'sentences', 'quiz') then
      perform notify(a.teacher_id, 'submission',
        coalesce((select name from profiles where id = new.student_id), 'A student') || ' submitted: ' || a.title,
        null, '/teach/assignments/' || a.id,
        new.id::text || ':' || extract(epoch from coalesce(new.submitted_at, now()))::bigint, now(), false);
    end if;
  end if;

  if tg_op = 'UPDATE' and new.reviewed_at is not null and new.reviewed_at is distinct from old.reviewed_at then
    if new.status = 'submitted' then
      perform award_homework(new.student_id, new.assignment_id, coalesce(new.submitted_at, now()));
    end if;
    perform notify(new.student_id, 'feedback', 'Feedback on ' || a.title,
      case when new.band is not null then 'Band ' || to_char(new.band, 'FM9.0') else null end,
      '/homework/' || a.id, new.id::text || ':' || extract(epoch from new.reviewed_at)::bigint);
    if new.band is not null then
      select max(s.band) into prev_best from submissions s
      where s.student_id = new.student_id and s.id <> new.id and s.reviewed_at is not null and s.band is not null;
      if prev_best is not null and new.band > prev_best then
        perform award_coins(new.student_id, 'writing_personal_best', new.id::text, null,
          'New best band ' || to_char(new.band, 'FM9.0') || ': ' || a.title);
      end if;
    end if;
  end if;
  return new;
end $function$;
