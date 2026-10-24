-- Task homework: proof uploads + pass / redo.
--   Private bucket homework-uploads, paths <assignment_id>/<student_id>/<file>.
--   Students upload to (and read/delete) their own folder for assignments
--   they're given; the assignment's teacher can read them.
--   The teacher passes a task with review_submission(..., marking = {verdict:'passed'})
--   or sends it back with return_submission(), which reopens it for the student.

create or replace function public.try_uuid(t text)
returns uuid language plpgsql immutable as $$
begin
  return t::uuid;
exception when others then
  return null;
end $$;

insert into storage.buckets (id, name, public, file_size_limit)
values ('homework-uploads', 'homework-uploads', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

drop policy if exists "students upload homework files" on storage.objects;
create policy "students upload homework files" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'homework-uploads'
    and (storage.foldername(name))[2] = auth.uid()::text
    and public.is_recipient(public.try_uuid((storage.foldername(name))[1]), auth.uid()));

drop policy if exists "read homework files" on storage.objects;
create policy "read homework files" on storage.objects for select to authenticated
  using (
    bucket_id = 'homework-uploads'
    and ((storage.foldername(name))[2] = auth.uid()::text
         or public.assignment_teacher(public.try_uuid((storage.foldername(name))[1])) = auth.uid()));

drop policy if exists "students delete own homework files" on storage.objects;
create policy "students delete own homework files" on storage.objects for delete to authenticated
  using (bucket_id = 'homework-uploads' and (storage.foldername(name))[2] = auth.uid()::text);

-- Send a submission back to the student to redo (with feedback).
create or replace function public.return_submission(sub uuid, p_feedback text)
returns void language plpgsql security definer set search_path = public as $function$
declare
  s submissions;
  a assignments;
begin
  select * into s from submissions where id = sub;
  if s.id is null or public.assignment_teacher(s.assignment_id) is distinct from auth.uid() then
    raise exception 'Not your student''s submission' using errcode = '42501';
  end if;
  select * into a from assignments where id = s.assignment_id;
  update submissions
     set status = 'in_progress', reviewed_at = null, band = null,
         feedback = nullif(trim(p_feedback), ''),
         marking = jsonb_build_object('verdict', 'redo', 'at', now())
   where id = sub;
  perform notify(s.student_id, 'feedback', 'Redo: ' || a.title,
    nullif(trim(p_feedback), ''), '/homework/' || a.id,
    sub::text || ':redo:' || extract(epoch from now())::bigint);
end $function$;
grant execute on function public.return_submission(uuid, text) to authenticated;
