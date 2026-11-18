-- can_manage_class: a missing class id means "no", not unknown (null slipped past `if not ...`).
create or replace function public.can_manage_class(p_class uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    auth.uid() is not null and p_class is not null
      and (public.class_teacher(p_class) = auth.uid() or public.is_admin_user(auth.uid())),
    false);
$$;
