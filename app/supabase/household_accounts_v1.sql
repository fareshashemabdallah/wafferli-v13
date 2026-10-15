-- Dabberna authenticated household membership, v1. STAGING-ONLY MIGRATION.
-- NOT APPLIED by the GitHub Pages build. Reviewed SQL must be migrated separately.
--
-- This migration handles adult identity, opt-in household creation, hashed single-use
-- invitations, membership visibility and revocation. It deliberately contains NO
-- synced money, household expenses, children profiles or payment data.
--
-- Requires Supabase Auth and pgcrypto in Supabase's 'extensions' schema.
-- Security: zero direct browser writes to membership/invitations/households;
-- actions are SECURITY DEFINER RPCs using auth.uid(), with a fixed search_path.
-- Community/friend circles grant NO access to these households.
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.dabberna_households (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 70),
 created_by uuid NOT NULL REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dabberna_household_members (
 household_id uuid NOT NULL REFERENCES public.dabberna_households(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 display_name text NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 2 AND 40),
 role text NOT NULL CHECK(role IN ('owner','adult')),
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','revoked')),
 joined_at timestamptz NOT NULL DEFAULT now(),
 revoked_at timestamptz,
 PRIMARY KEY (household_id,user_id),
 CONSTRAINT owner_cannot_be_revoked CHECK(role <> 'owner' OR status = 'active'),
 CONSTRAINT revoked_has_timestamp CHECK ((status = 'revoked') = (revoked_at IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS public.dabberna_household_invites (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 household_id uuid NOT NULL REFERENCES public.dabberna_households(id) ON DELETE CASCADE,
 token_hash text NOT NULL UNIQUE CHECK (char_length(token_hash)=64),
 created_by uuid NOT NULL REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL,
 accepted_by uuid REFERENCES auth.users(id),
 accepted_at timestamptz,
 revoked_at timestamptz,
 CHECK (expires_at>created_at),
 CHECK ((accepted_by IS NULL) = (accepted_at IS NULL)),
 CHECK (NOT (accepted_at IS NOT NULL AND revoked_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_dabberna_members_user ON public.dabberna_household_members(user_id,status);
CREATE INDEX IF NOT EXISTS idx_dabberna_invites_active ON public.dabberna_household_invites(household_id,expires_at)
 WHERE accepted_at IS NULL AND revoked_at IS NULL;

ALTER TABLE public.dabberna_households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dabberna_household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dabberna_household_invites ENABLE ROW LEVEL SECURITY;

-- Internal membership checks have no caller-controlled user id. The search
-- path is fixed and the underlying tables grant no direct write capability.
CREATE OR REPLACE FUNCTION public.dabberna_active_household_role(p_household_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$
 SELECT m.role FROM public.dabberna_household_members AS m
 WHERE m.household_id=p_household_id
   AND m.user_id=(SELECT auth.uid()) AND m.status='active'
 LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.dabberna_active_household_role(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.dabberna_active_household_role(uuid) TO authenticated;

DROP POLICY IF EXISTS dabberna_households_view ON public.dabberna_households;
CREATE POLICY dabberna_households_view ON public.dabberna_households
 FOR SELECT TO authenticated USING (public.dabberna_active_household_role(id) IS NOT NULL);

DROP POLICY IF EXISTS dabberna_members_view ON public.dabberna_household_members;
CREATE POLICY dabberna_members_view ON public.dabberna_household_members
 FOR SELECT TO authenticated USING (
  (user_id=(SELECT auth.uid()) AND status='active')
  OR public.dabberna_active_household_role(household_id)='owner'
 );

-- Invitations are NEVER selectable or writable through PostgREST from browsers.
REVOKE ALL ON public.dabberna_households,public.dabberna_household_members,
 public.dabberna_household_invites FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.dabberna_households,public.dabberna_household_members TO authenticated;

-- Transactional creation: a verified adult signs in, supplies display name
-- and explicitly creates a separate household. No inferred membership.
CREATE OR REPLACE FUNCTION public.dabberna_create_household(p_name text,p_display_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_id uuid; v_user uuid := auth.uid();
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF char_length(btrim(coalesce(p_name,''))) NOT BETWEEN 2 AND 70
   OR char_length(btrim(coalesce(p_display_name,''))) NOT BETWEEN 2 AND 40
 THEN RAISE EXCEPTION 'Invalid household or display name'; END IF;
 -- Limit spam without trusting device/local profile data.
 PERFORM pg_advisory_xact_lock(hashtextextended(v_user::text,1047));
 IF (SELECT count(*) FROM public.dabberna_households h WHERE h.created_by=v_user)>=3
 THEN RAISE EXCEPTION 'Household creation limit reached'; END IF;
 INSERT INTO public.dabberna_households(name,created_by)
 VALUES(btrim(p_name),v_user) RETURNING id INTO v_id;
 INSERT INTO public.dabberna_household_members(household_id,user_id,display_name,role,status)
 VALUES(v_id,v_user,btrim(p_display_name),'owner','active');
 RETURN v_id;
END;
$$;

-- Only a currently active OWNER can issue adult invitations. Return the
-- 256-bit random code ONCE; store only its SHA-256 hash (never raw token).
CREATE OR REPLACE FUNCTION public.dabberna_create_adult_invite(p_household_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_user uuid:=auth.uid(); v_token text; v_hash text;
BEGIN
 IF v_user IS NULL OR public.dabberna_active_household_role(p_household_id) IS DISTINCT FROM 'owner'
 THEN RAISE EXCEPTION 'Household owner required'; END IF;
 PERFORM 1 FROM public.dabberna_households WHERE id=p_household_id FOR UPDATE;
 IF (SELECT count(*) FROM public.dabberna_household_invites
     WHERE household_id=p_household_id AND accepted_at IS NULL
       AND revoked_at IS NULL AND expires_at>now())>=5
 THEN RAISE EXCEPTION 'Active invitation limit reached'; END IF;
 v_token:=encode(extensions.gen_random_bytes(32),'hex');
 v_hash:=encode(extensions.digest(convert_to(v_token,'UTF8'),'sha256'),'hex');
 INSERT INTO public.dabberna_household_invites
   (household_id,token_hash,created_by,expires_at)
 VALUES(p_household_id,v_hash,v_user,now()+interval '72 hours');
 RETURN v_token;
END;
$$;

-- Adults must opt in from their own verified login. The token is
-- single-use, expiring and checked under row lock to stop race conditions.
-- A revoked member cannot secretly rejoin by exchanging an older code.
CREATE OR REPLACE FUNCTION public.dabberna_accept_adult_invite(p_code text,p_display_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_user uuid:=auth.uid(); v_inv public.dabberna_household_invites%ROWTYPE;
  v_code text:=lower(btrim(coalesce(p_code,'')));
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF char_length(btrim(coalesce(p_display_name,''))) NOT BETWEEN 2 AND 40
 THEN RAISE EXCEPTION 'Invalid display name'; END IF;
 IF v_code !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'Invalid invitation'; END IF;
 SELECT * INTO v_inv FROM public.dabberna_household_invites
 WHERE token_hash=encode(extensions.digest(convert_to(v_code,'UTF8'),'sha256'),'hex')
 FOR UPDATE;
 IF NOT FOUND OR v_inv.revoked_at IS NOT NULL OR v_inv.accepted_at IS NOT NULL
    OR v_inv.expires_at<=now()
 THEN RAISE EXCEPTION 'Invitation expired, used or revoked'; END IF;
 IF EXISTS (SELECT 1 FROM public.dabberna_household_members
   WHERE household_id=v_inv.household_id AND user_id=v_user)
 THEN RAISE EXCEPTION 'Membership already exists; contact the owner'; END IF;
 IF (SELECT count(*) FROM public.dabberna_household_members
   WHERE household_id=v_inv.household_id AND status='active')>=8
 THEN RAISE EXCEPTION 'Household membership limit reached'; END IF;
 INSERT INTO public.dabberna_household_members(household_id,user_id,display_name,role,status)
 VALUES(v_inv.household_id,v_user,btrim(p_display_name),'adult','active');
 UPDATE public.dabberna_household_invites SET accepted_by=v_user,accepted_at=now()
 WHERE id=v_inv.id;
 RETURN v_inv.household_id;
END;
$$;

-- Owner can revoke an unredeemed invitation; old URLs/codes stop working.
CREATE OR REPLACE FUNCTION public.dabberna_revoke_invite(p_household_id uuid,p_invite_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
BEGIN
 IF auth.uid() IS NULL OR public.dabberna_active_household_role(p_household_id) IS DISTINCT FROM 'owner'
 THEN RAISE EXCEPTION 'Household owner required'; END IF;
 UPDATE public.dabberna_household_invites SET revoked_at=now()
 WHERE id=p_invite_id AND household_id=p_household_id
   AND accepted_at IS NULL AND revoked_at IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'No active invitation found'; END IF;
END;
$$;

-- Membership revocation immediately prevents future RLS-authorized reads.
-- The owner cannot revoke themself; ordinary adults can only leave.
CREATE OR REPLACE FUNCTION public.dabberna_revoke_adult(p_household_id uuid,p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
BEGIN
 IF auth.uid() IS NULL OR public.dabberna_active_household_role(p_household_id) IS DISTINCT FROM 'owner'
 THEN RAISE EXCEPTION 'Household owner required'; END IF;
 UPDATE public.dabberna_household_members
  SET status='revoked',revoked_at=now()
 WHERE household_id=p_household_id AND user_id=p_user_id
   AND role='adult' AND status='active';
 IF NOT FOUND THEN RAISE EXCEPTION 'No active adult membership found'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.dabberna_leave_household(p_household_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 UPDATE public.dabberna_household_members SET status='revoked',revoked_at=now()
 WHERE household_id=p_household_id AND user_id=auth.uid()
   AND role='adult' AND status='active';
 IF NOT FOUND THEN RAISE EXCEPTION 'Only active non-owner adults can leave'; END IF;
END;
$$;

-- Read-only, server-authenticated metadata for the user's own households.
CREATE OR REPLACE FUNCTION public.dabberna_my_households()
RETURNS TABLE(household_id uuid,household_name text,my_role text,my_display_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$
 SELECT h.id,h.name,m.role,m.display_name
 FROM public.dabberna_household_members m
 JOIN public.dabberna_households h ON h.id=m.household_id
 WHERE m.user_id=(SELECT auth.uid()) AND m.status='active'
 ORDER BY h.created_at ASC
$$;

-- Only the owner gets membership roster; co-parents do not get an access list
-- for other households, and there are no children accounts in this version.
CREATE OR REPLACE FUNCTION public.dabberna_household_roster(p_household_id uuid)
RETURNS TABLE(user_id uuid,display_name text,member_role text,joined_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $$
BEGIN
 IF auth.uid() IS NULL OR public.dabberna_active_household_role(p_household_id) IS DISTINCT FROM 'owner'
 THEN RAISE EXCEPTION 'Household owner required'; END IF;
 RETURN QUERY SELECT m.user_id,m.display_name,m.role,m.joined_at
  FROM public.dabberna_household_members m
  WHERE m.household_id=p_household_id AND m.status='active'
  ORDER BY m.joined_at ASC;
END;
$$;

-- Check privileges on every new definer function; no anonymous RPC access.
REVOKE ALL ON FUNCTION
 public.dabberna_create_household(text,text),
 public.dabberna_create_adult_invite(uuid),
 public.dabberna_accept_adult_invite(text,text),
 public.dabberna_revoke_invite(uuid,uuid),
 public.dabberna_revoke_adult(uuid,uuid),
 public.dabberna_leave_household(uuid),
 public.dabberna_my_households(),
 public.dabberna_household_roster(uuid)
FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION
 public.dabberna_create_household(text,text),
 public.dabberna_create_adult_invite(uuid),
 public.dabberna_accept_adult_invite(text,text),
 public.dabberna_revoke_invite(uuid,uuid),
 public.dabberna_revoke_adult(uuid,uuid),
 public.dabberna_leave_household(uuid),
 public.dabberna_my_households(),
 public.dabberna_household_roster(uuid)
TO authenticated;

-- Must pass before any production activation:
-- * Run real multi-user Supabase Auth + RLS integration tests in staging.
-- * Inspect pg_proc owner (trusted schema owner only); audit role grants, search paths,
--   pgcrypto schema access and RPC rate limits.
-- * Check revocation during parallel requests; ensure no old invite works twice.
-- * Confirm only signed-in adults can accept; teen/child accounts NOT enabled.
-- * Never interpret household creation as consent to upload local financial records.
-- * Do not grant SELECT on invitations, bypass auth.uid(), or use a browser service key.
