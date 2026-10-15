-- DABBERNA HOUSEHOLD ACCOUNTS V1 — PROPOSED MIGRATION ONLY. NOT DEPLOYED.
-- Apply only after security review in a dedicated Supabase/PostgreSQL environment.
-- Community groups are separate and never authorize access to household finances.
-- Parent/adult private expense rows must never be visible to co-parents by default.
-- All onboarding/invitation/role changes go through an authenticated reviewed server.
-- Do not store account/card data, personal health details, child DOBs or login secrets.

CREATE TABLE IF NOT EXISTS public.dabberna_households (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 created_by uuid NOT NULL REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.dabberna_household_members (
 household_id uuid NOT NULL REFERENCES public.dabberna_households(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 role text NOT NULL CHECK(role IN ('owner','adult','teen','child')),
 status text NOT NULL DEFAULT 'invited' CHECK(status IN ('active','invited','revoked')),
 joined_at timestamptz,
 PRIMARY KEY(household_id,user_id)
);
-- Least-privilege expense records, not copies of personal bank balances.
CREATE TABLE IF NOT EXISTS public.dabberna_household_expenses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 household_id uuid NOT NULL REFERENCES public.dabberna_households(id) ON DELETE CASCADE,
 created_by uuid NOT NULL REFERENCES auth.users(id),
 visibility text NOT NULL DEFAULT 'private'
   CHECK(visibility IN ('private','adults','household')),
 category text NOT NULL CHECK(char_length(category) BETWEEN 1 AND 80),
 amount_fils bigint NOT NULL CHECK(amount_fils > 0),
 currency char(3) NOT NULL DEFAULT 'JOD' CHECK(currency='JOD'),
 occurred_on date NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dabberna_household_members_user_idx
 ON public.dabberna_household_members(user_id,household_id);
CREATE INDEX IF NOT EXISTS dabberna_household_expenses_household_date_idx
 ON public.dabberna_household_expenses(household_id,occurred_on DESC);

ALTER TABLE public.dabberna_households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dabberna_household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dabberna_household_expenses ENABLE ROW LEVEL SECURITY;

-- The function resolves the currently authenticated *Supabase* user.
-- SECURITY DEFINER prevents a recursive RLS membership check. The caller
-- cannot supply an alternate user id. No superuser/service token in browser.
CREATE OR REPLACE FUNCTION public.dabberna_active_household_role(p_household_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$
 SELECT m.role FROM public.dabberna_household_members m
 WHERE m.household_id=p_household_id AND m.user_id=(SELECT auth.uid())
   AND m.status='active' LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.dabberna_active_household_role(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dabberna_active_household_role(uuid) TO authenticated;

DROP POLICY IF EXISTS dabberna_households_view ON public.dabberna_households;
CREATE POLICY dabberna_households_view ON public.dabberna_households
 FOR SELECT TO authenticated
 USING(public.dabberna_active_household_role(id) IS NOT NULL);

DROP POLICY IF EXISTS dabberna_members_view ON public.dabberna_household_members;
CREATE POLICY dabberna_members_view ON public.dabberna_household_members
 FOR SELECT TO authenticated
 USING(
  user_id=(SELECT auth.uid())
  OR public.dabberna_active_household_role(household_id)='owner'
 );

DROP POLICY IF EXISTS dabberna_expenses_read ON public.dabberna_household_expenses;
CREATE POLICY dabberna_expenses_read ON public.dabberna_household_expenses
 FOR SELECT TO authenticated USING(
  (public.dabberna_active_household_role(household_id) IN ('owner','adult')
   AND (created_by=(SELECT auth.uid()) OR visibility IN ('adults','household')))
  OR
  (public.dabberna_active_household_role(household_id)='teen'
   AND created_by=(SELECT auth.uid()))
 );

DROP POLICY IF EXISTS dabberna_expenses_create ON public.dabberna_household_expenses;
CREATE POLICY dabberna_expenses_create ON public.dabberna_household_expenses
 FOR INSERT TO authenticated WITH CHECK(
  created_by=(SELECT auth.uid())
  AND (
   public.dabberna_active_household_role(household_id) IN ('owner','adult')
   OR
   (public.dabberna_active_household_role(household_id)='teen' AND visibility='private')
  )
 );

-- Only the author of an expense may edit it, even when shared with household.
-- Parent cannot silently edit another adult's or teenager's personal spending.
DROP POLICY IF EXISTS dabberna_expenses_update ON public.dabberna_household_expenses;
CREATE POLICY dabberna_expenses_update ON public.dabberna_household_expenses
 FOR UPDATE TO authenticated
 USING(
  created_by=(SELECT auth.uid())
  AND public.dabberna_active_household_role(household_id) IN ('owner','adult','teen')
 )
 WITH CHECK(
  created_by=(SELECT auth.uid())
  AND (
   public.dabberna_active_household_role(household_id) IN ('owner','adult')
   OR
   (public.dabberna_active_household_role(household_id)='teen' AND visibility='private')
  )
 );

CREATE OR REPLACE FUNCTION public.dabberna_protect_expense_identity()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF NEW.household_id IS DISTINCT FROM OLD.household_id
  OR NEW.created_by IS DISTINCT FROM OLD.created_by
  OR NEW.created_at IS DISTINCT FROM OLD.created_at
 THEN RAISE EXCEPTION 'Expense owner and household are immutable'; END IF;
 NEW.updated_at=now();
 RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS dabberna_expense_identity_trg ON public.dabberna_household_expenses;
CREATE TRIGGER dabberna_expense_identity_trg
BEFORE UPDATE ON public.dabberna_household_expenses
FOR EACH ROW EXECUTE FUNCTION public.dabberna_protect_expense_identity();

-- No authenticated direct household creation, invitations, membership writes,
-- member removal, expense deletion or bulk sharing in this V1 policy.
REVOKE ALL ON public.dabberna_households,
 public.dabberna_household_members,
 public.dabberna_household_expenses FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.dabberna_households,public.dabberna_household_members TO authenticated;
GRANT SELECT,INSERT,UPDATE ON public.dabberna_household_expenses TO authenticated;

-- Backend trusted service must:
--  * authenticate each parent through verified auth.users identity;
--  * create household + first owner atomically after opt-in;
--  * validate signed, expiring invite acceptance and prevent role escalation;
--  * verify ages/consent and applicable child privacy rules before child accounts;
--  * enforce shared/private ownership on reads/writes, never use a local profile ID;
--  * audit membership/role changes and all access to financial data;
--  * rate-limit invites and immediately revoke tokens on departure;
--  * test RLS with actual distinct auth.uid contexts (not just TypeScript tests).
--  * do not connect existing 'family_groups' or use friends' invite tokens.
