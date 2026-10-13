create extension if not exists pgcrypto with schema extensions;

create table public.outings (
  id uuid primary key default gen_random_uuid(),
  vote_token text not null unique,
  admin_token text not null unique,
  title text not null check (char_length(title) between 1 and 80),
  event_at text check (char_length(event_at) <= 40),
  neighborhood text check (char_length(neighborhood) <= 60),
  friend_count int not null default 6 check (friend_count between 2 and 30),
  organizer_name text check (char_length(organizer_name) <= 40),
  created_at timestamptz not null default now()
);
create table public.outing_options (
  id uuid primary key default gen_random_uuid(),
  outing_id uuid not null references public.outings(id) on delete cascade,
  position int not null,
  name text not null check (char_length(name) between 1 and 80),
  note text check (char_length(note) <= 160)
);
create table public.outing_votes (
  id uuid primary key default gen_random_uuid(),
  outing_id uuid not null references public.outings(id) on delete cascade,
  option_id uuid not null references public.outing_options(id) on delete cascade,
  voter_key text not null check (char_length(voter_key) between 16 and 64),
  voter_name text check (char_length(voter_name) <= 30),
  updated_at timestamptz not null default now(),
  unique (outing_id, voter_key)
);
grant all on public.outings, public.outing_options, public.outing_votes to service_role;
alter table public.outings enable row level security;
alter table public.outing_options enable row level security;
alter table public.outing_votes enable row level security;
-- No direct policies: all access goes through token-checked functions below.

create or replace function public.create_outing(
  p_title text, p_event_at text, p_neighborhood text, p_friend_count int,
  p_organizer_name text, p_options jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; v_vote text; v_admin text; n int; i int := 0; o jsonb;
begin
  n := jsonb_array_length(p_options);
  if n < 3 or n > 10 then raise exception 'Need 3 to 10 options'; end if;
  if (select count(*) from outings where created_at > now() - interval '1 hour') > 200 then
    raise exception 'Too many outings created recently, try later'; end if;
  v_vote := encode(gen_random_bytes(16), 'hex');
  v_admin := encode(gen_random_bytes(24), 'hex');
  insert into outings(vote_token, admin_token, title, event_at, neighborhood, friend_count, organizer_name)
  values (v_vote, v_admin, trim(p_title), nullif(trim(p_event_at),''), nullif(trim(p_neighborhood),''),
          coalesce(p_friend_count,6), nullif(trim(p_organizer_name),''))
  returning id into v_id;
  for o in select * from jsonb_array_elements(p_options) loop
    insert into outing_options(outing_id, position, name, note)
    values (v_id, i, trim(o->>'name'), nullif(trim(coalesce(o->>'note','')),''));
    i := i + 1;
  end loop;
  return jsonb_build_object('vote_token', v_vote, 'admin_token', v_admin);
end $$;

create or replace function public.get_outing_vote(p_vote_token text, p_voter_key text default null)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'title', o.title, 'event_at', o.event_at, 'neighborhood', o.neighborhood,
    'friend_count', o.friend_count, 'organizer_name', o.organizer_name,
    'total_votes', (select count(*) from outing_votes v where v.outing_id = o.id),
    'my_option_id', (select v.option_id from outing_votes v where v.outing_id = o.id and v.voter_key = p_voter_key),
    'options', (select coalesce(jsonb_agg(jsonb_build_object('id', op.id, 'name', op.name, 'note', op.note,
        'votes', (select count(*) from outing_votes v where v.option_id = op.id)) order by op.position), '[]'::jsonb)
      from outing_options op where op.outing_id = o.id))
  from outings o where o.vote_token = p_vote_token;
$$;

create or replace function public.cast_outing_vote(p_vote_token text, p_voter_key text, p_option_id uuid, p_voter_name text)
returns void language plpgsql security definer set search_path = public as $$
declare v_outing uuid; v_count int; v_cap int;
begin
  select id, friend_count * 2 + 2 into v_outing, v_cap from outings where vote_token = p_vote_token;
  if v_outing is null then raise exception 'Vote not found'; end if;
  if not exists (select 1 from outing_options where id = p_option_id and outing_id = v_outing) then
    raise exception 'Invalid option'; end if;
  if not exists (select 1 from outing_votes where outing_id = v_outing and voter_key = p_voter_key) then
    select count(*) into v_count from outing_votes where outing_id = v_outing;
    if v_count >= v_cap then raise exception 'This vote has reached its participant limit'; end if;
  end if;
  insert into outing_votes(outing_id, option_id, voter_key, voter_name)
  values (v_outing, p_option_id, p_voter_key, nullif(left(trim(coalesce(p_voter_name,'')),30),''))
  on conflict (outing_id, voter_key) do update
    set option_id = excluded.option_id, voter_name = excluded.voter_name, updated_at = now();
end $$;

create or replace function public.get_outing_admin(p_admin_token text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'vote_token', o.vote_token, 'title', o.title, 'event_at', o.event_at, 'neighborhood', o.neighborhood,
    'friend_count', o.friend_count, 'organizer_name', o.organizer_name,
    'total_votes', (select count(*) from outing_votes v where v.outing_id = o.id),
    'options', (select coalesce(jsonb_agg(jsonb_build_object('id', op.id, 'name', op.name, 'note', op.note,
        'votes', (select count(*) from outing_votes v where v.option_id = op.id),
        'voters', (select coalesce(jsonb_agg(coalesce(v.voter_name,'Guest')), '[]'::jsonb) from outing_votes v where v.option_id = op.id)
      ) order by op.position), '[]'::jsonb) from outing_options op where op.outing_id = o.id))
  from outings o where o.admin_token = p_admin_token;
$$;

revoke all on function public.create_outing(text,text,text,int,text,jsonb) from public;
revoke all on function public.get_outing_vote(text,text) from public;
revoke all on function public.cast_outing_vote(text,text,uuid,text) from public;
revoke all on function public.get_outing_admin(text) from public;
grant execute on function public.create_outing(text,text,text,int,text,jsonb) to anon, authenticated;
grant execute on function public.get_outing_vote(text,text) to anon, authenticated;
grant execute on function public.cast_outing_vote(text,text,uuid,text) to anon, authenticated;
grant execute on function public.get_outing_admin(text) to anon, authenticated;