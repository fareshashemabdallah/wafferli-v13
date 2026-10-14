-- Restrict contextual reviews to exact-item searches via authenticated RPC, not a browse-all REST endpoint.
drop policy if exists frev_read on public.family_experience_reviews;
revoke select, delete on public.family_experience_reviews from authenticated;
create or replace function public.get_family_experience_reviews(p_item_key text)
returns setof public.family_experience_reviews
language plpgsql stable security definer set search_path=public as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if char_length(p_item_key)<4 or char_length(p_item_key)>500 then raise exception 'Provide an exact item'; end if;
 return query select r.* from public.family_experience_reviews r where r.item_key=p_item_key order by r.created_at desc limit 100;
end $$;
create or replace function public.delete_family_experience_review(p_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 delete from public.family_experience_reviews where id=p_id and author_id=auth.uid();
end $$;
revoke all on function public.get_family_experience_reviews(text) from public;
revoke all on function public.delete_family_experience_review(uuid) from public;
grant execute on function public.get_family_experience_reviews(text) to authenticated;
grant execute on function public.delete_family_experience_review(uuid) to authenticated;
