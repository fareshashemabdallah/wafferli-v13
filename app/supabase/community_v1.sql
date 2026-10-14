-- Dabberna community v1: authenticated invite-only networks and contextual experience notes.
create extension if not exists pgcrypto with schema extensions;
create table if not exists public.family_groups (
 id uuid primary key default gen_random_uuid(),
 name text not null check (char_length(name) between 3 and 80),
 description text not null default '' check (char_length(description)<=240),
 invite_code text unique not null default encode(gen_random_bytes(20),'hex'),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create table if not exists public.family_group_members (
 group_id uuid not null references public.family_groups(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 display_name text not null check (char_length(display_name) between 2 and 40),
 role text not null default 'member' check (role in ('owner','member')),
 joined_at timestamptz not null default now(),
 primary key(group_id,user_id)
);
create table if not exists public.family_group_messages (
 id uuid primary key default gen_random_uuid(),
 group_id uuid not null references public.family_groups(id) on delete cascade,
 author_id uuid not null references auth.users(id),
 context_type text not null default 'general' check(context_type in ('general','outing','advice')),
 context_title text not null default '' check(char_length(context_title)<=120),
 body text not null check(char_length(trim(body)) between 1 and 1500),
 created_at timestamptz not null default now()
);
create table if not exists public.family_experience_reviews (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references auth.users(id),
 author_name text not null check (char_length(author_name) between 2 and 40),
 item_type text not null check (item_type in ('doctor','restaurant','playground','product','school','activity','home-service','other')),
 item_key text not null check (char_length(item_key) between 4 and 240),
 item_name text not null check (char_length(item_name) between 2 and 120),
 location text not null default '' check (char_length(location)<=120),
 rating int check (rating between 1 and 5),
 experience text not null check (char_length(trim(experience)) between 12 and 1500),
 experience_type text not null default 'personal' check (experience_type in ('personal','secondhand')),
 created_at timestamptz not null default now()
);
create table if not exists public.family_content_reports (
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid not null references auth.users(id),
 review_id uuid references public.family_experience_reviews(id) on delete cascade,
 message_id uuid references public.family_group_messages(id) on delete cascade,
 reason text not null check(char_length(reason) between 5 and 400),
 created_at timestamptz not null default now(),
 check ((review_id is not null) <> (message_id is not null))
);
create index if not exists idx_family_group_messages_group_time on public.family_group_messages(group_id,created_at desc);
create index if not exists idx_family_experience_reviews_key on public.family_experience_reviews(item_key,created_at desc);
create index if not exists idx_family_group_members_user on public.family_group_members(user_id);
alter table public.family_groups enable row level security;
alter table public.family_group_members enable row level security;
alter table public.family_group_messages enable row level security;
alter table public.family_experience_reviews enable row level security;
alter table public.family_content_reports enable row level security;
create or replace function public.is_family_group_member(g uuid)
returns boolean language sql stable security definer set search_path=public
as $$select auth.uid() is not null and exists(select 1 from public.family_group_members where group_id=g and user_id=auth.uid())$$;
revoke all on function public.is_family_group_member(uuid) from public;
grant execute on function public.is_family_group_member(uuid) to authenticated;
drop policy if exists fg_select on public.family_groups;
create policy fg_select on public.family_groups for select to authenticated using(public.is_family_group_member(id));
drop policy if exists fgm_select on public.family_group_members;
create policy fgm_select on public.family_group_members for select to authenticated using(public.is_family_group_member(group_id));
drop policy if exists fgm_leave on public.family_group_members;
create policy fgm_leave on public.family_group_members for delete to authenticated using(user_id=auth.uid() and role='member');
drop policy if exists fmsg_select on public.family_group_messages;
create policy fmsg_select on public.family_group_messages for select to authenticated using(public.is_family_group_member(group_id));
drop policy if exists fmsg_insert on public.family_group_messages;
create policy fmsg_insert on public.family_group_messages for insert to authenticated
with check(author_id=auth.uid() and public.is_family_group_member(group_id));
drop policy if exists fmsg_delete on public.family_group_messages;
create policy fmsg_delete on public.family_group_messages for delete to authenticated using(author_id=auth.uid());
drop policy if exists frev_read on public.family_experience_reviews;
create policy frev_read on public.family_experience_reviews for select to authenticated using(true);
drop policy if exists frev_insert on public.family_experience_reviews;
create policy frev_insert on public.family_experience_reviews for insert to authenticated with check(author_id=auth.uid());
drop policy if exists frev_delete on public.family_experience_reviews;
create policy frev_delete on public.family_experience_reviews for delete to authenticated using(author_id=auth.uid());
drop policy if exists freport_create on public.family_content_reports;
create policy freport_create on public.family_content_reports for insert to authenticated with check(reporter_id=auth.uid());
create or replace function public.create_family_group(p_name text,p_description text,p_display_name text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare g public.family_groups; begin
 if auth.uid() is null then raise exception 'Sign in to create a group';end if;
 if length(trim(coalesce(p_name,'')))<3 or length(trim(coalesce(p_name,'')))>80 then raise exception 'Group name must have 3 to 80 characters';end if;
 if length(trim(coalesce(p_display_name,'')))<2 or length(trim(coalesce(p_display_name,'')))>40 then raise exception 'Display name must have 2 to 40 characters';end if;
 if (select count(*) from public.family_groups where created_by=auth.uid())>=15 then raise exception 'Group creation limit reached';end if;
 insert into public.family_groups(name,description,created_by) values(trim(p_name),left(trim(coalesce(p_description,'')),240),auth.uid()) returning * into g;
 insert into public.family_group_members(group_id,user_id,display_name,role) values(g.id,auth.uid(),trim(p_display_name),'owner');
 return jsonb_build_object('id',g.id,'invite_code',g.invite_code);
end $$;
create or replace function public.join_family_group(p_invite_code text,p_display_name text)
returns uuid language plpgsql security definer set search_path=public as $$
declare g uuid; begin
 if auth.uid() is null then raise exception 'Sign in to join';end if;
 if length(trim(coalesce(p_display_name,'')))<2 or length(trim(coalesce(p_display_name,'')))>40 then raise exception 'Display name must have 2 to 40 characters';end if;
 select id into g from public.family_groups where invite_code=p_invite_code;
 if g is null then raise exception 'Invalid invitation';end if;
 if (select count(*) from public.family_group_members where group_id=g)>=150 then raise exception 'This group has reached its member limit';end if;
 insert into public.family_group_members(group_id,user_id,display_name) values(g,auth.uid(),trim(p_display_name)) on conflict(group_id,user_id) do nothing;
 return g;
end $$;
revoke all on function public.create_family_group(text,text,text) from public;
revoke all on function public.join_family_group(text,text) from public;
grant execute on function public.create_family_group(text,text,text) to authenticated;
grant execute on function public.join_family_group(text,text) to authenticated;
grant select on public.family_groups,public.family_group_members,public.family_group_messages,public.family_experience_reviews to authenticated;
grant insert,delete on public.family_group_messages,public.family_experience_reviews to authenticated;
grant delete on public.family_group_members to authenticated;
grant insert on public.family_content_reports to authenticated;
