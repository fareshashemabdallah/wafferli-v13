-- Dabberna live AI cost boundary. APPLY in Supabase SQL Editor before deploying Edge Function.
-- Stores only authenticated user ID and request counters, not prompts, household data
-- or AI answers. Per-user quota: 4 requests per 10-minute period, 20 per UTC day.
create table if not exists public.dabberna_ai_usage_v1 (
 user_id uuid not null references auth.users(id) on delete cascade,
 bucket_type text not null check (bucket_type in ('ten_min','day')),
 bucket_start timestamptz not null,
 used int not null default 0 check (used between 0 and 20),
 primary key(user_id,bucket_type,bucket_start)
);
-- Additional total-provider safety cap across every account: 200 turns per UTC day.
-- This is a request ceiling, not a guaranteed monetary ceiling; provider account
-- spending limits and alerting must ALSO be configured before launch.
create table if not exists public.dabberna_ai_global_usage_v1 (
 bucket_start date primary key,
 used int not null default 0 check (used between 0 and 200)
);
alter table public.dabberna_ai_global_usage_v1 enable row level security;
revoke all on public.dabberna_ai_global_usage_v1 from public, anon, authenticated;
alter table public.dabberna_ai_usage_v1 enable row level security;
revoke all on public.dabberna_ai_usage_v1 from public, anon, authenticated;
-- The consumer must not be able to read or mutate quota rows, even own rows.
-- Only the audited SECURITY DEFINER function can claim a quota unit.
create or replace function public.dabberna_ai_claim_turn()
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
 v_user uuid := auth.uid();
 v_now timestamptz := now();
 v_day timestamptz;
 v_ten timestamptz;
 v_used int;
begin
 if v_user is null or auth.role() <> 'authenticated' then
  raise exception 'AI_UNAUTHORIZED' using errcode='42501';
 end if;
 v_day := date_trunc('day', v_now at time zone 'UTC') at time zone 'UTC';
 v_ten := to_timestamp(floor(extract(epoch from v_now)/600)*600);
 delete from public.dabberna_ai_usage_v1
  where user_id=v_user and bucket_start < v_now-interval '3 days';
 insert into public.dabberna_ai_usage_v1 as old
  (user_id,bucket_type,bucket_start,used)
  values (v_user,'day',v_day,1)
  on conflict(user_id,bucket_type,bucket_start)
  do update set used=old.used+1 where old.used<20
  returning used into v_used;
 if v_used is null then
  raise exception 'AI_RATE_LIMIT' using errcode='P0001';
 end if;
 v_used := null;
 insert into public.dabberna_ai_usage_v1 as old
  (user_id,bucket_type,bucket_start,used)
  values (v_user,'ten_min',v_ten,1)
  on conflict(user_id,bucket_type,bucket_start)
  do update set used=old.used+1 where old.used<4
  returning used into v_used;
 if v_used is null then
  -- Raising an exception rolls back BOTH counters in this transaction.
  raise exception 'AI_RATE_LIMIT' using errcode='P0001';
 end if;
 -- Atomic shared daily counter prevents new accounts from bypassing a total cap.
 -- A failure aborts this transaction and rolls back both per-user claims.
 v_used := null;
 insert into public.dabberna_ai_global_usage_v1 as global_bucket
  (bucket_start,used)
  values ((v_now at time zone 'UTC')::date,1)
  on conflict(bucket_start)
  do update set used=global_bucket.used+1 where global_bucket.used<200
  returning used into v_used;
 if v_used is null then
  raise exception 'AI_RATE_LIMIT' using errcode='P0001';
 end if;
 return true;
end;
$;
revoke all on function public.dabberna_ai_claim_turn() from public, anon;
grant execute on function public.dabberna_ai_claim_turn() to authenticated;

-- Security verification required on staging:
-- 1. anonymous / no JWT -> denied; authenticated -> true within quota.
-- 2. SELECT/UPDATE quota table as authenticated -> denied.
-- 3. fifth request in 10 minutes -> AI_RATE_LIMIT; daily 21st -> denied.
-- 4. concurrent requests cannot exceed one atomic quota window.
-- 5. row remains linked to auth.users so account deletion cascades.
-- 6. 201st total call across all users in a UTC day -> AI_RATE_LIMIT.
-- 7. table SELECT/UPDATE is denied to authenticated users for global counter.
-- 8. Set an independent provider-account spend limit; requests are not currency.

