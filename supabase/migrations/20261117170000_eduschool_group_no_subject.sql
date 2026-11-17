-- EduSchool groups have a single subject, so a group link needs none:
-- a register is sent to every lesson of the group that day.
alter table public.eduschool_class_links alter column es_subject_id drop not null;
alter table public.eduschool_class_links alter column es_subject_name drop not null;
