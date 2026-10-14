-- Callable only as an authenticated user; created as trusted migration owner.
create or replace function public.community_create_group(p_name text,p_description text,p_nickname text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_id uuid; v_user uuid:=auth.uid();
begin
 if v_user is null then raise exception 'Sign in required'; end if;
 if char_length(btrim(coalesce(p_name,''))) not between 3 and 70
  or char_length(coalesce(p_description,''))>250
  or char_length(btrim(coalesce(p_nickname,''))) not between 2 and 40
 then raise exception 'Invalid group name or nickname'; end if;
 if (select count(*) from public.community_groups where creator_id=v_user)>=25
 then raise exception 'Maximum groups reached'; end if;
 insert into public.community_groups(name,description,creator_id)
 values(btrim(p_name),btrim(coalesce(p_description,'')),v_user) returning id into v_id;
 insert into public.community_members(group_id,user_id,display_name,role)
 values(v_id,v_user,btrim(p_nickname),'owner');
 return v_id;
end $$;

create or replace function public.community_create_invite(p_group uuid)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_token uuid; v_user uuid:=auth.uid();
begin
 if v_user is null or not public.community_is_member(p_group)
 then raise exception 'Only members can send invitations'; end if;
 if (select archived from public.community_groups where id=p_group)
 then raise exception 'Group unavailable'; end if;
 if (select count(*) from public.community_invites
     where group_id=p_group and created_by=v_user and expires_at>now() and not revoked)>=15
 then raise exception 'Too many active invitations'; end if;
 insert into public.community_invites(group_id,created_by)
 values(p_group,v_user) returning token into v_token;
 return v_token;
end $$;

create or replace function public.community_join_group(p_token uuid,p_nickname text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_inv public.community_invites%rowtype; v_user uuid:=auth.uid();
begin
 if v_user is null then raise exception 'Sign in required'; end if;
 if char_length(btrim(coalesce(p_nickname,''))) not between 2 and 40
 then raise exception 'Invalid display name'; end if;
 select * into v_inv from public.community_invites where token=p_token for update;
 if not found or v_inv.revoked or v_inv.expires_at<=now() or v_inv.used_count>=v_inv.max_uses
 then raise exception 'Invitation expired or invalid'; end if;
 if (select archived from public.community_groups where id=v_inv.group_id)
 then raise exception 'Group unavailable'; end if;
 if exists(select 1 from public.community_members
   where group_id=v_inv.group_id and user_id=v_user)
 then return v_inv.group_id; end if;
 if (select count(*) from public.community_members where group_id=v_inv.group_id)>=100
 then raise exception 'Group full'; end if;
 insert into public.community_members(group_id,user_id,display_name)
 values(v_inv.group_id,v_user,btrim(p_nickname));
 update public.community_invites set used_count=used_count+1 where token=p_token;
 return v_inv.group_id;
end $$;

create or replace function public.community_leave_group(p_group uuid)
returns void language plpgsql security definer set search_path=''
as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if exists(select 1 from public.community_members
   where group_id=p_group and user_id=auth.uid() and role='owner')
 then raise exception 'Group creator cannot leave until ownership is transferred'; end if;
 delete from public.community_members where group_id=p_group and user_id=auth.uid();
end $$;

create or replace function public.community_send_message(p_group uuid,p_kind text,p_topic text,p_body text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_id uuid; v_name text; v_user uuid:=auth.uid();
begin
 if v_user is null or not public.community_is_member(p_group)
 then raise exception 'Not a group member'; end if;
 if p_kind not in ('general','outing','advice')
    or char_length(coalesce(p_topic,''))>120
    or char_length(btrim(coalesce(p_body,''))) not between 2 and 1200
 then raise exception 'Invalid message'; end if;
 if exists(select 1 from public.community_messages
   where author_id=v_user and created_at>now()-interval '3 seconds')
 then raise exception 'Please wait a moment before sending another message'; end if;
 select display_name into v_name from public.community_members
  where group_id=p_group and user_id=v_user;
 insert into public.community_messages(group_id,author_id,display_name,topic_kind,topic_ref,body)
 values(p_group,v_user,v_name,p_kind,btrim(coalesce(p_topic,'')),btrim(p_body))
 returning id into v_id;
 return v_id;
end $$;

-- Builtin UUID invite tokens have high entropy; invitation is not a public chat link.
