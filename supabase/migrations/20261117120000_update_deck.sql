-- Editing a flashcard assignment's cards. Students' cards are matched by the
-- front (case and spaces ignored), so progress on kept words survives reordering
-- and edits to the back; removed words are dropped, new words are added.

create or replace function public.update_deck(p_assignment uuid, p_cards jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare a assignments;
begin
  select * into a from assignments where id = p_assignment;
  if a.id is null or a.teacher_id is distinct from auth.uid() or a.kind <> 'flashcards' then
    raise exception 'Not your flashcard assignment' using errcode = '42501';
  end if;
  if jsonb_typeof(p_cards) <> 'array' or jsonb_array_length(p_cards) = 0 then
    raise exception 'Add at least one card' using errcode = '22023';
  end if;

  update assignments set payload = jsonb_set(payload, '{cards}', p_cards) where id = p_assignment;

  -- Park every existing card on a negative position, then claim the new ones.
  update srs_cards set position = -1 - position where assignment_id = p_assignment;

  with c as (
    select distinct on (lower(btrim(x.card->>'f'))) (x.ord - 1)::int as pos, x.card, lower(btrim(x.card->>'f')) as k
    from jsonb_array_elements(p_cards) with ordinality as x(card, ord)
    where coalesce(x.card->>'f', '') <> '' and coalesce(x.card->>'b', '') <> ''
    order by lower(btrim(x.card->>'f')), x.ord
  ), s1 as (
    select distinct on (student_id, lower(btrim(front))) id, lower(btrim(front)) as k
    from srs_cards where assignment_id = p_assignment
    order by student_id, lower(btrim(front)), position desc
  )
  update srs_cards s
     set position = c.pos, front = c.card->>'f', back = c.card->>'b', extra = nullif(c.card - 'f' - 'b', '{}'::jsonb)
    from s1 join c on c.k = s1.k
   where s.id = s1.id;

  delete from srs_cards where assignment_id = p_assignment and position < 0;

  insert into srs_cards (student_id, assignment_id, position, front, back, extra, assigned_at, available_at, due)
  select r.student_id, a.id, (x.ord - 1)::int, x.card->>'f', x.card->>'b', nullif(x.card - 'f' - 'b', '{}'::jsonb),
         greatest(r.assigned_at, a.publish_at), a.publish_at, greatest(a.publish_at, now())
  from assignment_recipients r,
       jsonb_array_elements(p_cards) with ordinality as x(card, ord)
  where r.assignment_id = a.id
    and coalesce(x.card->>'f', '') <> '' and coalesce(x.card->>'b', '') <> ''
    and not exists (select 1 from srs_cards s where s.student_id = r.student_id and s.assignment_id = a.id
                    and lower(btrim(s.front)) = lower(btrim(x.card->>'f')))
  on conflict (student_id, assignment_id, position) do nothing;
end $$;

revoke all on function public.update_deck(uuid, jsonb) from public, anon;
grant execute on function public.update_deck(uuid, jsonb) to authenticated;
