-- Student Hub chat (Telegram-style messaging).
--
--   chats           direct (teacher <-> student) or group. Every class gets a group
--                   chat automatically (class_id set); teachers can also make
--                   their own groups. owner_id = the teacher who manages it.
--   chat_members    who is in a chat + per-user prefs (pinned, muted) + read marker.
--                   Class chats follow class_members via triggers.
--   chat_messages   text / attachment / reply / forward; reactions live on the row
--                   (jsonb {user_id: reaction}) so one realtime UPDATE carries them.
--                   Deletes are soft (row stays, content wiped) so realtime sees them.
--   chat_presence   last seen, pinged by the hub while it's open.
--
-- Who can talk to whom:
--   students: DMs with their own teachers + groups they are in. They cannot DM
--             other students or start groups.
--   teachers: DMs with any of their students; create/manage groups of their
--             students. Admins can DM anyone.
-- All writes go through the security-definer RPCs below; tables only have
-- SELECT policies. Realtime: postgres_changes on the three tables (RLS-checked)
-- and private broadcast channels "chat:<id>" for typing.

-- ── Tables ───────────────────────────────────────────────────────────────────
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('direct', 'group')),
  class_id uuid unique references public.classes(id) on delete cascade,
  direct_key text unique,
  title text check (title is null or char_length(title) between 1 and 80),
  description text check (description is null or char_length(description) <= 500),
  owner_id uuid references public.profiles(id) on delete set null,
  only_owner_posts boolean not null default false,
  pinned_message_id uuid,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table if not exists public.chat_members (
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  can_post boolean not null default true,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz not null default now(),
  pinned boolean not null default false,
  muted boolean not null default false,
  primary key (chat_id, user_id)
);
create index if not exists chat_members_user_idx on public.chat_members (user_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade,
  body text check (body is null or char_length(body) <= 4000),
  attachment jsonb,
  reply_to uuid references public.chat_messages(id) on delete set null,
  forwarded jsonb,
  reactions jsonb not null default '{}'::jsonb,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_chat_idx on public.chat_messages (chat_id, created_at desc);

do $$ begin
  alter table public.chats add constraint chats_pinned_message_fk
    foreign key (pinned_message_id) references public.chat_messages(id) on delete set null;
exception when duplicate_object then null; end $$;

create table if not exists public.chat_presence (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

-- ── Helpers (security definer → no policy recursion) ─────────────────────────
create or replace function public.is_chat_member(cid uuid, uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from chat_members where chat_id = cid and user_id = uid);
$$;

create or replace function public.chat_role(cid uuid, uid uuid)
returns text language sql stable security definer set search_path = public as $$
  select role from chat_members where chat_id = cid and user_id = uid;
$$;

create or replace function public.shares_chat(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from chat_members x join chat_members y on y.chat_id = x.chat_id
    where x.user_id = a and y.user_id = b
  );
$$;

-- a may open a DM with b: teacher <-> own student, or a is an admin.
create or replace function public.can_dm(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select a is not null and b is not null and a <> b
    and exists (select 1 from profiles where id = b)
    and (public.is_teacher_of(a, b) or public.is_teacher_of(b, a) or public.is_admin_user(a));
$$;

-- Storage paths are "<chat_id>/<uuid>/<file name>".
create or replace function public.chat_from_path(p text)
returns uuid language plpgsql immutable as $$
begin
  return split_part(p, '/', 1)::uuid;
exception when others then
  return null;
end $$;

-- Realtime private channels "chat:<id>" (typing indicators).
create or replace function public.chat_topic_allowed(topic text)
returns boolean language plpgsql stable security definer set search_path = public as $$
begin
  if topic like 'chat:%' then
    return public.is_chat_member(substring(topic from 6)::uuid, auth.uid());
  end if;
  return false;
exception when others then
  return false;
end $$;

-- ── RLS (read-only; writes go through RPCs) ──────────────────────────────────
alter table public.chats enable row level security;
alter table public.chat_members enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_presence enable row level security;

drop policy if exists "members read chats" on public.chats;
create policy "members read chats" on public.chats for select to authenticated
  using (public.is_chat_member(id, auth.uid()));
drop policy if exists "members read chat members" on public.chat_members;
create policy "members read chat members" on public.chat_members for select to authenticated
  using (public.is_chat_member(chat_id, auth.uid()));
drop policy if exists "members read messages" on public.chat_messages;
create policy "members read messages" on public.chat_messages for select to authenticated
  using (public.is_chat_member(chat_id, auth.uid()));
drop policy if exists "chat partners read presence" on public.chat_presence;
create policy "chat partners read presence" on public.chat_presence for select to authenticated
  using (user_id = auth.uid() or public.shares_chat(auth.uid(), user_id));

-- ── Class group chats follow classes ─────────────────────────────────────────
create or replace function public.chat_on_class()
returns trigger language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if tg_op = 'INSERT' then
    insert into chats (kind, class_id, title, owner_id, archived)
    values ('group', new.id, new.name, new.teacher_id, new.archived)
    on conflict (class_id) do nothing
    returning id into cid;
    if cid is not null then
      insert into chat_members (chat_id, user_id, role) values (cid, new.teacher_id, 'owner')
      on conflict do nothing;
    end if;
  elsif new.name is distinct from old.name or new.archived is distinct from old.archived then
    update chats set title = new.name, archived = new.archived where class_id = new.id;
  end if;
  return new;
end $$;

drop trigger if exists chat_on_class on public.classes;
create trigger chat_on_class after insert or update on public.classes
  for each row execute function public.chat_on_class();

create or replace function public.chat_on_class_member()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into chat_members (chat_id, user_id)
    select id, new.student_id from chats where class_id = new.class_id
    on conflict do nothing;
    return new;
  end if;
  delete from chat_members m using chats c
  where c.class_id = old.class_id and m.chat_id = c.id and m.user_id = old.student_id and m.role <> 'owner';
  return old;
end $$;

drop trigger if exists chat_on_class_member on public.class_members;
create trigger chat_on_class_member after insert or delete on public.class_members
  for each row execute function public.chat_on_class_member();

-- Backfill: a chat for every existing class, with its teacher and students.
insert into public.chats (kind, class_id, title, owner_id, archived)
select 'group', c.id, c.name, c.teacher_id, c.archived from public.classes c
on conflict (class_id) do nothing;
insert into public.chat_members (chat_id, user_id, role)
select ch.id, c.teacher_id, 'owner' from public.chats ch join public.classes c on c.id = ch.class_id
on conflict do nothing;
insert into public.chat_members (chat_id, user_id)
select ch.id, m.student_id from public.chats ch join public.class_members m on m.class_id = ch.class_id
on conflict do nothing;

-- ── Reads ────────────────────────────────────────────────────────────────────
-- Everything the chat list needs, newest activity first.
create or replace function public.chat_list()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x order by sort_at desc), '[]'::jsonb) from (
    select c.last_message_at as sort_at, jsonb_build_object(
      'id', c.id, 'kind', c.kind, 'class_id', c.class_id, 'title', c.title, 'description', c.description,
      'owner_id', c.owner_id, 'only_owner_posts', c.only_owner_posts, 'pinned_message_id', c.pinned_message_id,
      'archived', c.archived, 'created_at', c.created_at, 'last_message_at', c.last_message_at,
      'role', m.role, 'can_post', m.can_post, 'pinned', m.pinned, 'muted', m.muted, 'last_read_at', m.last_read_at,
      'member_count', (select count(*) from chat_members k where k.chat_id = c.id),
      'unread', (select count(*) from chat_messages u
                 where u.chat_id = c.id and u.created_at > m.last_read_at and u.deleted_at is null
                   and u.sender_id is distinct from m.user_id),
      'last', (select jsonb_build_object('id', l.id, 'sender_id', l.sender_id, 'sender_name', p.name,
                        'body', left(l.body, 200), 'kind', l.attachment->>'kind', 'file', l.attachment->>'name',
                        'created_at', l.created_at)
               from chat_messages l left join profiles p on p.id = l.sender_id
               where l.chat_id = c.id and l.deleted_at is null
               order by l.created_at desc limit 1),
      'peer', case when c.kind = 'direct' then (
               select jsonb_build_object('id', p.id, 'name', p.name, 'email', p.email, 'avatar_url', p.avatar_url,
                        'avatar_character', p.avatar_character, 'last_read_at', o.last_read_at,
                        'last_seen_at', pr.last_seen_at)
               from chat_members o join profiles p on p.id = o.user_id
               left join chat_presence pr on pr.user_id = o.user_id
               where o.chat_id = c.id and o.user_id <> m.user_id limit 1) end
    ) as x
    from chat_members m join chats c on c.id = m.chat_id
    where m.user_id = auth.uid() and (not c.archived or m.role = 'owner')
  ) s;
$$;

-- Members of one chat with names, avatars, presence and read markers.
create or replace function public.chat_member_list(p_chat uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_chat_member(p_chat, auth.uid()) then
    raise exception 'Not a member of this chat' using errcode = '42501';
  end if;
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', p.id, 'name', p.name, 'email', p.email, 'avatar_url', p.avatar_url,
      'avatar_character', p.avatar_character, 'role', m.role, 'can_post', m.can_post,
      'joined_at', m.joined_at, 'last_read_at', m.last_read_at, 'last_seen_at', pr.last_seen_at
    ) order by (m.role = 'owner') desc, p.name), '[]'::jsonb)
    from chat_members m join profiles p on p.id = m.user_id
    left join chat_presence pr on pr.user_id = m.user_id
    where m.chat_id = p_chat
  );
end $$;

-- People the caller can start a DM with (or add to a group, for teachers).
create or replace function public.chat_contacts()
returns jsonb language sql stable security definer set search_path = public as $$
  with me as (select auth.uid() as id),
  people as (
    -- my teachers
    select c.teacher_id as id from class_members m join classes c on c.id = m.class_id, me
    where m.student_id = me.id and not c.archived
    union select t.teacher_id from teacher_students t, me where t.student_id = me.id
    -- my students
    union select m.student_id from class_members m join classes c on c.id = m.class_id, me
    where c.teacher_id = me.id
    union select t.student_id from teacher_students t, me where t.teacher_id = me.id
    -- admins: every student in any class, and every teacher
    union select m.student_id from class_members m, me where public.is_admin_user(me.id)
    union select p.id from profiles p, me where public.is_admin_user(me.id) and (p.is_teacher or coalesce(p.is_admin, false))
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id, 'name', p.name, 'email', p.email, 'avatar_url', p.avatar_url,
    'avatar_character', p.avatar_character,
    'is_teacher', (p.is_teacher or coalesce(p.is_admin, false)),
    'classes', (select coalesce(jsonb_agg(distinct c.name), '[]'::jsonb)
                from class_members m join classes c on c.id = m.class_id
                where m.student_id = p.id and not c.archived
                  and (c.teacher_id = (select id from me) or public.is_admin_user((select id from me))))
  ) order by p.name), '[]'::jsonb)
  from profiles p, me
  where p.id in (select id from people) and p.id <> me.id;
$$;

-- ── Chats ────────────────────────────────────────────────────────────────────
create or replace function public.open_direct_chat(p_other uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  k text;
  cid uuid;
  owner uuid;
begin
  k := least(me, p_other)::text || ':' || greatest(me, p_other)::text;
  select id into cid from chats where direct_key = k;
  if cid is not null and public.is_chat_member(cid, me) then
    return cid;
  end if;
  if not public.can_dm(me, p_other) then
    raise exception 'You can only message your own teachers and students' using errcode = '42501';
  end if;
  -- The teacher side manages the DM (can delete any message in it).
  owner := case when public.is_teacher_of(p_other, me) then p_other else me end;
  insert into chats (kind, direct_key, owner_id) values ('direct', k, owner)
  on conflict (direct_key) do update set direct_key = excluded.direct_key
  returning id into cid;
  insert into chat_members (chat_id, user_id, role) values
    (cid, me, case when owner = me then 'owner' else 'member' end),
    (cid, p_other, case when owner = p_other then 'owner' else 'member' end)
  on conflict do nothing;
  return cid;
end $$;

create or replace function public.create_group_chat(p_title text, p_members uuid[], p_description text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  cid uuid;
begin
  if not public.is_teacher_user(me) then
    raise exception 'Only teachers can create groups' using errcode = '42501';
  end if;
  insert into chats (kind, title, description, owner_id)
  values ('group', nullif(btrim(p_title), ''), nullif(btrim(p_description), ''), me)
  returning id into cid;
  insert into chat_members (chat_id, user_id, role) values (cid, me, 'owner');
  insert into chat_members (chat_id, user_id)
  select cid, u from unnest(coalesce(p_members, '{}')) u
  where public.can_dm(me, u)
  on conflict do nothing;
  return cid;
end $$;

-- Owner-only check used by the management RPCs.
create or replace function public.chat_require_owner(p_chat uuid)
returns chats language plpgsql stable security definer set search_path = public as $$
declare c chats;
begin
  select * into c from chats where id = p_chat;
  if c.id is null or public.chat_role(p_chat, auth.uid()) is distinct from 'owner' then
    raise exception 'Only the teacher who manages this chat can do that' using errcode = '42501';
  end if;
  return c;
end $$;

create or replace function public.update_chat(p_chat uuid, p_title text, p_description text, p_only_owner_posts boolean)
returns void language plpgsql security definer set search_path = public as $$
declare c chats := public.chat_require_owner(p_chat);
begin
  if c.kind <> 'group' then raise exception 'Only groups have settings'; end if;
  update chats set
    title = coalesce(nullif(btrim(p_title), ''), title),
    description = case when p_description is null then description else nullif(btrim(p_description), '') end,
    only_owner_posts = coalesce(p_only_owner_posts, only_owner_posts)
  where id = p_chat;
end $$;

create or replace function public.add_chat_members(p_chat uuid, p_members uuid[])
returns void language plpgsql security definer set search_path = public as $$
declare c chats := public.chat_require_owner(p_chat);
begin
  if c.kind <> 'group' or c.class_id is not null then
    raise exception 'Class chats follow the class list. Add the student to the class instead.';
  end if;
  insert into chat_members (chat_id, user_id)
  select p_chat, u from unnest(coalesce(p_members, '{}')) u
  where public.can_dm(auth.uid(), u)
  on conflict do nothing;
end $$;

create or replace function public.remove_chat_member(p_chat uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare c chats := public.chat_require_owner(p_chat);
begin
  if c.kind <> 'group' or c.class_id is not null then
    raise exception 'Class chats follow the class list. Remove the student from the class instead.';
  end if;
  delete from chat_members where chat_id = p_chat and user_id = p_user and role <> 'owner';
end $$;

-- Mute / unmute a member's ability to send messages.
create or replace function public.set_chat_member_can_post(p_chat uuid, p_user uuid, p_can boolean)
returns void language plpgsql security definer set search_path = public as $$
declare c chats := public.chat_require_owner(p_chat);
begin
  update chat_members set can_post = p_can where chat_id = p_chat and user_id = p_user and role <> 'owner';
end $$;

create or replace function public.leave_chat(p_chat uuid)
returns void language plpgsql security definer set search_path = public as $$
declare c chats;
begin
  select * into c from chats where id = p_chat;
  if c.kind <> 'group' or c.class_id is not null then
    raise exception 'You can only leave groups that are not class chats.';
  end if;
  if public.chat_role(p_chat, auth.uid()) = 'owner' then
    raise exception 'You manage this group. Delete it instead.';
  end if;
  delete from chat_members where chat_id = p_chat and user_id = auth.uid();
end $$;

-- Returns attachment paths so the client can remove the files.
create or replace function public.delete_chat(p_chat uuid)
returns text[] language plpgsql security definer set search_path = public as $$
declare
  c chats := public.chat_require_owner(p_chat);
  paths text[];
begin
  if c.class_id is not null then
    raise exception 'Class chats are removed with the class.';
  end if;
  select coalesce(array_agg(attachment->>'path'), '{}') into paths
  from chat_messages where chat_id = p_chat and attachment ? 'path';
  delete from chats where id = p_chat;
  return paths;
end $$;

create or replace function public.set_chat_prefs(p_chat uuid, p_pinned boolean default null, p_muted boolean default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  update chat_members set pinned = coalesce(p_pinned, pinned), muted = coalesce(p_muted, muted)
  where chat_id = p_chat and user_id = auth.uid();
end $$;

create or replace function public.mark_chat_read(p_chat uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  -- Only when there is something newer, so idle re-reads don't fan out realtime events.
  update chat_members m set last_read_at = now()
  where m.chat_id = p_chat and m.user_id = auth.uid()
    and exists (select 1 from chat_messages x where x.chat_id = p_chat and x.created_at > m.last_read_at);
end $$;

create or replace function public.chat_ping()
returns void language sql security definer set search_path = public as $$
  insert into chat_presence (user_id, last_seen_at) values (auth.uid(), now())
  on conflict (user_id) do update set last_seen_at = now();
$$;

-- ── Messages ─────────────────────────────────────────────────────────────────
create or replace function public.clean_chat_attachment(p_chat uuid, a jsonb)
returns jsonb language plpgsql immutable as $$
declare kind text;
begin
  if a is null or a = 'null'::jsonb then return null; end if;
  if coalesce(a->>'path', '') not like p_chat::text || '/%' then
    raise exception 'Attachment must be uploaded to this chat';
  end if;
  kind := a->>'kind';
  if kind not in ('image', 'file', 'voice', 'video') then kind := 'file'; end if;
  return jsonb_strip_nulls(jsonb_build_object(
    'path', a->>'path',
    'kind', kind,
    'name', left(coalesce(a->>'name', 'file'), 200),
    'mime', left(a->>'mime', 100),
    'size', (a->>'size')::bigint,
    'duration', (a->>'duration')::numeric,
    'width', (a->>'width')::int,
    'height', (a->>'height')::int,
    'waveform', case when jsonb_typeof(a->'waveform') = 'array' and jsonb_array_length(a->'waveform') <= 64 then a->'waveform' end
  ));
end $$;

create or replace function public.send_chat_message(
  p_chat uuid, p_body text, p_reply_to uuid default null,
  p_attachment jsonb default null, p_forwarded jsonb default null
) returns chat_messages language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  c chats;
  m chat_members;
  b text := nullif(btrim(coalesce(p_body, ''), E' \t\r\n'), '');
  att jsonb := public.clean_chat_attachment(p_chat, p_attachment);
  fwd jsonb;
  msg chat_messages;
begin
  select * into c from chats where id = p_chat;
  select * into m from chat_members where chat_id = p_chat and user_id = me;
  if m.user_id is null then raise exception 'Not a member of this chat' using errcode = '42501'; end if;
  if c.archived then raise exception 'This chat is archived'; end if;
  if m.role <> 'owner' and (not m.can_post or c.only_owner_posts) then
    raise exception 'Only the teacher can send messages here' using errcode = '42501';
  end if;
  if b is null and att is null then raise exception 'Message is empty'; end if;
  if p_reply_to is not null and not exists (select 1 from chat_messages where id = p_reply_to and chat_id = p_chat) then
    p_reply_to := null;
  end if;
  if p_forwarded is not null then
    fwd := jsonb_strip_nulls(jsonb_build_object(
      'sender_id', p_forwarded->>'sender_id',
      'name', left(p_forwarded->>'name', 120),
      'at', p_forwarded->>'at'));
  end if;
  insert into chat_messages (chat_id, sender_id, body, attachment, reply_to, forwarded)
  values (p_chat, me, b, att, p_reply_to, fwd)
  returning * into msg;
  update chats set last_message_at = msg.created_at where id = p_chat;
  update chat_members set last_read_at = msg.created_at where chat_id = p_chat and user_id = me;
  return msg;
end $$;

create or replace function public.edit_chat_message(p_id uuid, p_body text)
returns void language plpgsql security definer set search_path = public as $$
declare
  msg chat_messages;
  b text := nullif(btrim(coalesce(p_body, ''), E' \t\r\n'), '');
begin
  select * into msg from chat_messages where id = p_id;
  if msg.sender_id is distinct from auth.uid() or msg.deleted_at is not null then
    raise exception 'You can only edit your own messages' using errcode = '42501';
  end if;
  if b is null and msg.attachment is null then raise exception 'Message is empty'; end if;
  if b is not distinct from msg.body then return; end if;
  update chat_messages set body = b, edited_at = now() where id = p_id;
end $$;

-- Delete for everyone: own messages, or any message in a chat you manage.
-- Returns the attachment paths so the client can remove the files.
create or replace function public.delete_chat_messages(p_ids uuid[])
returns text[] language plpgsql security definer set search_path = public as $$
declare paths text[];
begin
  with gone as (
    update chat_messages m set deleted_at = now(), body = null, attachment = null, forwarded = null, reactions = '{}'::jsonb
    from (select id, attachment->>'path' as path from chat_messages where id = any(p_ids)) prev
    where m.id = prev.id and m.deleted_at is null
      and (m.sender_id = auth.uid() or public.chat_role(m.chat_id, auth.uid()) = 'owner')
    returning prev.path
  )
  select coalesce(array_agg(path) filter (where path is not null), '{}') into paths from gone;
  update chats set pinned_message_id = null where pinned_message_id = any(p_ids);
  return paths;
end $$;

create or replace function public.clear_chat_history(p_chat uuid)
returns text[] language plpgsql security definer set search_path = public as $$
declare
  c chats := public.chat_require_owner(p_chat);
  ids uuid[];
begin
  select array_agg(id) into ids from chat_messages where chat_id = p_chat and deleted_at is null;
  return public.delete_chat_messages(coalesce(ids, '{}'));
end $$;

-- One reaction per person per message (like Telegram); null removes it.
create or replace function public.react_chat_message(p_id uuid, p_reaction text)
returns void language plpgsql security definer set search_path = public as $$
declare msg chat_messages;
begin
  select * into msg from chat_messages where id = p_id;
  if msg.id is null or msg.deleted_at is not null or not public.is_chat_member(msg.chat_id, auth.uid()) then
    raise exception 'Message not found';
  end if;
  if p_reaction is not null and p_reaction not in ('like', 'heart', 'fire', 'laugh', 'done', 'wow') then
    raise exception 'Unknown reaction';
  end if;
  update chat_messages set reactions = case
      when p_reaction is null then reactions - auth.uid()::text
      else reactions || jsonb_build_object(auth.uid()::text, p_reaction) end
  where id = p_id;
end $$;

-- Groups: the managing teacher pins. Direct chats: either person.
create or replace function public.pin_chat_message(p_chat uuid, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare c chats;
begin
  select * into c from chats where id = p_chat;
  if not public.is_chat_member(p_chat, auth.uid())
     or (c.kind = 'group' and public.chat_role(p_chat, auth.uid()) <> 'owner') then
    raise exception 'Only the teacher can pin messages here' using errcode = '42501';
  end if;
  if p_id is not null and not exists (select 1 from chat_messages where id = p_id and chat_id = p_chat and deleted_at is null) then
    raise exception 'Message not found';
  end if;
  update chats set pinned_message_id = p_id where id = p_chat;
end $$;

-- ── Attachments bucket ───────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit)
values ('chat-media', 'chat-media', false, 26214400)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

create or replace function public.chat_can_upload(p_chat uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from chat_members m join chats c on c.id = m.chat_id
    where m.chat_id = p_chat and m.user_id = auth.uid() and not c.archived
      and (m.role = 'owner' or (m.can_post and not c.only_owner_posts))
  );
$$;

drop policy if exists "chat members read chat media" on storage.objects;
create policy "chat members read chat media" on storage.objects for select to authenticated
  using (bucket_id = 'chat-media' and public.is_chat_member(public.chat_from_path(name), auth.uid()));
drop policy if exists "chat members upload chat media" on storage.objects;
create policy "chat members upload chat media" on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-media' and public.chat_can_upload(public.chat_from_path(name)));
drop policy if exists "chat media owners delete" on storage.objects;
create policy "chat media owners delete" on storage.objects for delete to authenticated
  using (bucket_id = 'chat-media' and (owner = auth.uid() or public.chat_role(public.chat_from_path(name), auth.uid()) = 'owner'));

-- ── Realtime ─────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['chats', 'chat_members', 'chat_messages'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

drop policy if exists "hub chat members receive broadcasts" on realtime.messages;
create policy "hub chat members receive broadcasts" on realtime.messages for select to authenticated
  using (public.chat_topic_allowed(realtime.topic()));
drop policy if exists "hub chat members send broadcasts" on realtime.messages;
create policy "hub chat members send broadcasts" on realtime.messages for insert to authenticated
  with check (public.chat_topic_allowed(realtime.topic()));

-- ── Grants ───────────────────────────────────────────────────────────────────
do $$
declare f text;
begin
  foreach f in array array[
    'chat_list()', 'chat_member_list(uuid)', 'chat_contacts()', 'open_direct_chat(uuid)',
    'create_group_chat(text, uuid[], text)', 'update_chat(uuid, text, text, boolean)',
    'add_chat_members(uuid, uuid[])', 'remove_chat_member(uuid, uuid)',
    'set_chat_member_can_post(uuid, uuid, boolean)', 'leave_chat(uuid)', 'delete_chat(uuid)',
    'set_chat_prefs(uuid, boolean, boolean)', 'mark_chat_read(uuid)', 'chat_ping()',
    'send_chat_message(uuid, text, uuid, jsonb, jsonb)', 'edit_chat_message(uuid, text)',
    'delete_chat_messages(uuid[])', 'clear_chat_history(uuid)', 'react_chat_message(uuid, text)',
    'pin_chat_message(uuid, uuid)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
  foreach f in array array['chat_on_class()', 'chat_on_class_member()', 'chat_require_owner(uuid)'] loop
    execute format('revoke execute on function public.%s from public, anon, authenticated', f);
  end loop;
end $$;
