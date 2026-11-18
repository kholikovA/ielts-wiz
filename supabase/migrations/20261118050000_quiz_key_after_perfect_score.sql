-- A perfect score opens the answer key too: another attempt can't improve it, so the
-- student gets Review and analyze (answers, explanations, question map) straight away.
-- The score is the server's (score_quiz_submission trigger), so it can't be faked.
drop policy if exists "students read quiz key after the last attempt" on public.quiz_keys;
create policy "students read quiz key after the last attempt" on public.quiz_keys for select
  using (exists (
    select 1 from public.submissions s join public.assignments a on a.id = s.assignment_id
    where s.assignment_id = quiz_keys.assignment_id and s.student_id = auth.uid() and s.status = 'submitted'
      and (1 + coalesce(jsonb_array_length(s.data->'attempts'), 0) >= coalesce(nullif(a.payload->>'max_attempts', '')::int, 1)
           or coalesce((s.data->>'review_opened')::boolean, false)
           or coalesce((s.data #>> '{score,percent}')::numeric, 0) >= 100)));
