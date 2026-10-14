-- Dabberna community: group-only membership, private messages and scoped experiences.
-- Requires Supabase email auth. Run in the existing Supabase SQL editor AFTER review.
create table if not exists public.community_groups (
 id uuid primary key default gen_random_uuid(),
 name text not null check (char_length(trim(name)) between 3 and 70),
 description text not null default '' check (char_length(description)<=250),
 creator_id uuid not null references auth.users(id) on delete cascade,
 archived boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists public.community_members (
 group_id uuid not null references public.community_groups(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 display_name text not null check (char_length(trim(display_name)) between 2 and 40),
 role text not null default 'member' check (role in ('owner','member')),
 joined_at timestamptz not null default now(),
 primary key(group_id,user_id)
);
create table if not exists public.community_invites (
 token uuid primary key default gen_random_uuid(),
 group_id uuid not null references public.community_groups(id) on delete cascade,
 created_by uuid not null references auth.users(id) on delete cascade,
 expires_at timestamptz not null default (now()+interval '7 days'),
 max_uses integer not null default 30,
 used_count integer not null default 0,
 revoked boolean not null default false
);
create table if not exists public.community_messages (
 id uuid primary key default gen_random_uuid(),
 group_id uuid not null references public.community_groups(id) on delete cascade,
 author_id uuid not null references auth.users(id) on delete cascade,
 display_name text not null,
 topic_kind text not null default 'general' check (topic_kind in ('general','outing','advice')),
 topic_ref text not null default '' check (char_length(topic_ref)<=120),
 body text not null check (char_length(trim(body)) between 2 and 1200),
 hidden boolean not null default false,
 created_at timestamptz not null default now()
);
create index if not exists community_messages_by_thread on public.community_messages(group_id,topic_kind,topic_ref,created_at desc);
create table if not exists public.community_reviews (
 id uuid primary key default gen_random_uuid(),
 group_id uuid not null references public.community_groups(id) on delete cascade,
 author_id uuid not null references auth.users(id) on delete cascade,
 display_name text not null,
 entity_type text not null check (entity_type in ('doctor','restaurant','playground','product','school','service','other')),
 entity_key text not null,
 entity_label text not null check (char_length(trim(entity_label)) between 3 and 100),
 area text not null check (char_length(trim(area)) between 2 and 80),
 rating integer not null check (rating between 1 and 5),
 personal_experience boolean not null default true check (personal_experience),
 body text not null check (char_length(trim(body)) between 15 and 1200),
 hidden boolean not null default false,
 created_at timestamptz not null default now(),
 unique(group_id,author_id,entity_key)
);
create index if not exists community_review_name_lookup on public.community_reviews(group_id,entity_key,created_at desc);
create table if not exists public.community_reports (
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid not null references auth.users(id) on delete cascade,
 group_id uuid not null references public.community_groups(id) on delete cascade,
 content_type text not null check (content_type in ('message','review')),
 content_id uuid not null,
 reason text not null check (char_length(trim(reason)) between 3 and 200),
 created_at timestamptz not null default now(),
 unique(reporter_id,content_type,content_id)
);
alter table public.community_groups enable row level security;
alter table public.community_members enable row level security;
alter table public.community_invites enable row level security;
alter table public.community_messages enable row level security;
alter table public.community_reviews enable row level security;
alter table public.community_reports enable row level security;

create or replace function public.community_is_member(p_group uuid)
returns boolean language sql stable security definer set search_path=''
as $$ select exists (
 select 1 from public.community_members m where m.group_id=p_group and m.user_id=auth.uid()
); $$;
drop policy if exists community_groups_read on public.community_groups;
create policy community_groups_read on public.community_groups for select to authenticated using (public.community_is_member(id));
drop policy if exists community_members_read on public.community_members;
create policy community_members_read on public.community_members for select to authenticated using (public.community_is_member(group_id));
drop policy if exists community_messages_read on public.community_messages;
create policy community_messages_read on public.community_messages for select to authenticated using (public.community_is_member(group_id) and hidden=false);
-- No direct SELECT policies for community_reviews or community_invites: access is only through scoped RPCs.
