-- Experience reviews are readable ONLY through exact-item/member-scoped RPC.
create or replace function public.community_entity_key(p_type text,p_name text,p_area text)
returns text language sql immutable set search_path=''
as $$
select lower(btrim(coalesce(p_type,'')))||':'||
 lower(regexp_replace(btrim(coalesce(p_name,'')),'[[:space:]]+',' ','g'))||':'||
 lower(regexp_replace(btrim(coalesce(p_area,'')),'[[:space:]]+',' ','g'))
$$;

create or replace function public.community_post_review(
 p_group uuid,p_type text,p_name text,p_area text,p_rating integer,p_body text,p_personal_experience boolean)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_id uuid; v_user uuid:=auth.uid(); v_name text; v_key text;
begin
 if v_user is null or not public.community_is_member(p_group) then raise exception 'Not a group member'; end if;
 if p_type is null or p_type not in ('doctor','restaurant','playground','product','school','service','other')
  or char_length(btrim(coalesce(p_name,''))) not between 3 and 100
  or char_length(btrim(coalesce(p_area,''))) not between 2 and 80
  or p_rating is null or p_rating not between 1 and 5
  or char_length(btrim(coalesce(p_body,''))) not between 15 and 1200
  or p_personal_experience is distinct from true
 then raise exception 'A review needs a named item, area, rating and firsthand experience'; end if;
 if exists(select 1 from public.community_reviews
   where author_id=v_user and created_at>now()-interval '10 seconds')
 then raise exception 'Please wait before posting another review'; end if;
 v_key:=public.community_entity_key(p_type,p_name,p_area);
 select display_name into v_name from public.community_members
 where group_id=p_group and user_id=v_user;
 insert into public.community_reviews(group_id,author_id,display_name,entity_type,entity_key,entity_label,area,rating,body)
 values(p_group,v_user,v_name,p_type,v_key,btrim(p_name),btrim(p_area),p_rating,btrim(p_body))
 on conflict(group_id,author_id,entity_key) do update set
  rating=excluded.rating,body=excluded.body,hidden=false,created_at=now()
 returning id into v_id;
 return v_id;
end $$;

create or replace function public.community_find_reviews(p_group uuid,p_type text,p_name text,p_area text)
returns table(id uuid,author_id uuid,display_name text,rating integer,body text,
 personal_experience boolean,created_at timestamptz)
language plpgsql security definer set search_path=''
as $$
begin
 if auth.uid() is null or not public.community_is_member(p_group)
 then raise exception 'Not a group member'; end if;
 if char_length(btrim(coalesce(p_name,'')))<3 or char_length(btrim(coalesce(p_area,'')))<2
 then raise exception 'Search for an exact name and area'; end if;
 return query select r.id,r.author_id,r.display_name,r.rating,r.body,r.personal_experience,r.created_at
 from public.community_reviews r
 where r.group_id=p_group and not r.hidden
  and r.entity_key=public.community_entity_key(p_type,p_name,p_area)
 order by r.created_at desc limit 50;
end $$;

create or replace function public.community_hide_content(p_kind text,p_id uuid)
returns void language plpgsql security definer set search_path=''
as $$
declare v_group uuid; v_author uuid; v_creator uuid;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if p_kind='message' then
  select group_id,author_id into v_group,v_author from public.community_messages where id=p_id;
 elsif p_kind='review' then
  select group_id,author_id into v_group,v_author from public.community_reviews where id=p_id;
 else raise exception 'Invalid content type'; end if;
 if v_group is null or not public.community_is_member(v_group) then raise exception 'Not found'; end if;
 select creator_id into v_creator from public.community_groups where id=v_group;
 if auth.uid()<>v_author and auth.uid()<>v_creator then raise exception 'Not authorized'; end if;
 if p_kind='message' then update public.community_messages set hidden=true where id=p_id;
 else update public.community_reviews set hidden=true where id=p_id; end if;
end $$;

create or replace function public.community_report_content(p_kind text,p_id uuid,p_reason text)
returns void language plpgsql security definer set search_path=''
as $$
declare v_group uuid;
begin
 if auth.uid() is null or char_length(btrim(coalesce(p_reason,''))) not between 3 and 200
 then raise exception 'Sign in and provide a report reason'; end if;
 if p_kind='message' then
  select group_id into v_group from public.community_messages where id=p_id and not hidden;
 elsif p_kind='review' then
  select group_id into v_group from public.community_reviews where id=p_id and not hidden;
 else raise exception 'Invalid content type'; end if;
 if v_group is null or not public.community_is_member(v_group) then raise exception 'Not found'; end if;
 insert into public.community_reports(reporter_id,group_id,content_type,content_id,reason)
 values(auth.uid(),v_group,p_kind,p_id,btrim(p_reason))
 on conflict(reporter_id,content_type,content_id) do nothing;
end $$;

-- Only the group's creator can see reports; send no report feed to other members.
create or replace function public.community_list_reports(p_group uuid)
returns table(content_type text,content_id uuid,reason text,reported_at timestamptz)
language plpgsql security definer set search_path=''
as $$
begin
 if auth.uid() is null or not exists(select 1 from public.community_groups
  where id=p_group and creator_id=auth.uid()) then raise exception 'Group owner only'; end if;
 return query select r.content_type,r.content_id,r.reason,r.created_at
 from public.community_reports r where r.group_id=p_group
 order by r.created_at desc limit 50;
end $$;

-- PostgREST needs authenticated SELECT for group metadata/messages; reviews have NO SELECT policy.
grant select on public.community_groups,public.community_members,public.community_messages to authenticated;
revoke all on function public.community_is_member(uuid) from public,anon;
revoke all on function public.community_create_group(text,text,text) from public,anon;
revoke all on function public.community_create_invite(uuid) from public,anon;
revoke all on function public.community_join_group(uuid,text) from public,anon;
revoke all on function public.community_leave_group(uuid) from public,anon;
revoke all on function public.community_send_message(uuid,text,text,text) from public,anon;
revoke all on function public.community_entity_key(text,text,text) from public,anon;
revoke all on function public.community_post_review(uuid,text,text,text,integer,text,boolean) from public,anon;
revoke all on function public.community_find_reviews(uuid,text,text,text) from public,anon;
revoke all on function public.community_hide_content(text,uuid) from public,anon;
revoke all on function public.community_report_content(text,uuid,text) from public,anon;
revoke all on function public.community_list_reports(uuid) from public,anon;

grant execute on function public.community_is_member(uuid) to authenticated;
grant execute on function public.community_create_group(text,text,text) to authenticated;
grant execute on function public.community_create_invite(uuid) to authenticated;
grant execute on function public.community_join_group(uuid,text) to authenticated;
grant execute on function public.community_leave_group(uuid) to authenticated;
grant execute on function public.community_send_message(uuid,text,text,text) to authenticated;
grant execute on function public.community_post_review(uuid,text,text,text,integer,text,boolean) to authenticated;
grant execute on function public.community_find_reviews(uuid,text,text,text) to authenticated;
grant execute on function public.community_hide_content(text,uuid) to authenticated;
grant execute on function public.community_report_content(text,uuid,text) to authenticated;
grant execute on function public.community_list_reports(uuid) to authenticated;
