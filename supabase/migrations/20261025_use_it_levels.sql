-- "Use it" homework: a "too simple" verdict, and one query that gives the
-- sentence-check edge function everything it needs (fewer round trips).

alter table public.usage_checks drop constraint if exists usage_checks_verdict_check;
alter table public.usage_checks add constraint usage_checks_verdict_check
  check (verdict in ('correct', 'simple', 'almost', 'wrong'));

-- Called by the edge function with the service role only.
--   word, level, whether the caller may check, attempts used, and the
--   earlier result if this exact sentence was already checked (free re-check).
create or replace function public.usage_check_context(p_assignment uuid, p_student uuid, p_idx int, p_sentence text)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'allowed', a.kind = 'sentences' and a.publish_at <= now()
               and exists (select 1 from assignment_recipients r where r.assignment_id = a.id and r.student_id = p_student),
    'word', a.payload->'words'->p_idx,
    'level', coalesce(a.payload->>'level', 'junior'),
    'submitted', exists (select 1 from submissions s where s.assignment_id = a.id and s.student_id = p_student and s.status = 'submitted'),
    'attempts', (select count(*) from usage_checks u where u.assignment_id = a.id and u.student_id = p_student and u.word_index = p_idx),
    'same', (select json_build_object('verdict', u.verdict, 'corrected', u.corrected, 'tip', u.tip, 'created_at', u.created_at)
               from usage_checks u
              where u.assignment_id = a.id and u.student_id = p_student and u.word_index = p_idx and u.sentence = p_sentence
              order by u.created_at desc limit 1)
  )
  from assignments a where a.id = p_assignment;
$$;
revoke execute on function public.usage_check_context(uuid, uuid, int, text) from public, anon, authenticated;
