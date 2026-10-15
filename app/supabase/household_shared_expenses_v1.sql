-- DABBERNA SHARED EXPENSES V1 — STAGING-ONLY, NOT APPLIED.
-- Apply AFTER app/supabase/household_accounts_v1.sql in an isolated staging project.
-- Financial data stays local until an adult individually selects & confirms an
-- expense. This is NOT full Money-state sync or bank/payment integration.
-- No private items, user notes, child data, cash balances, or income stored.
-- Each recipient must have an active owner/adult household membership.
CREATE TABLE IF NOT EXISTS public.dabberna_shared_expenses_v1 (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 household_id uuid NOT NULL REFERENCES public.dabberna_households(id) ON DELETE CASCADE,
 created_by uuid NOT NULL REFERENCES auth.users(id),
 source_fingerprint char(64) NOT NULL CHECK (source_fingerprint ~ '^[0-9a-f]{64}$'),
 category text NOT NULL CHECK (char_length(btrim(category)) BETWEEN 1 AND 80),
 amount_fils bigint NOT NULL CHECK (amount_fils BETWEEN 1 AND 100000000),
 occurred_on date NOT NULL CHECK (occurred_on >= DATE '2000-01-01'),
 currency char(3) NOT NULL DEFAULT 'JOD' CHECK(currency='JOD'),
 consented_at timestamptz NOT NULL DEFAULT now(),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(household_id,created_by,source_fingerprint)
);
CREATE INDEX IF NOT EXISTS idx_dabberna_shared_expenses_household_date
 ON public.dabberna_shared_expenses_v1(household_id,occurred_on DESC);
ALTER TABLE public.dabberna_shared_expenses_v1 ENABLE ROW LEVEL SECURITY;

-- No unauthenticated access or direct writes. Only a member of this
-- household, authenticated and still active, can see explicitly shared rows.
DROP POLICY IF EXISTS dabberna_shared_expenses_read ON public.dabberna_shared_expenses_v1;
CREATE POLICY dabberna_shared_expenses_read ON public.dabberna_shared_expenses_v1
 FOR SELECT TO authenticated
 USING(public.dabberna_active_household_role(household_id) IN ('owner','adult'));

REVOKE ALL ON public.dabberna_shared_expenses_v1 FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.dabberna_shared_expenses_v1 TO authenticated;

-- Only the authenticated sharer may publish ONE explicitly consented item.
-- Server derives author from auth.uid(); clients cannot impersonate authors,
-- choose privacy level, set timestamps, or request balance sync.
CREATE OR REPLACE FUNCTION public.dabberna_share_one_expense(
 p_household_id uuid,p_source_fingerprint text,p_category text,
 p_amount_fils bigint,p_occurred_on date,p_explicit_consent boolean
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_user uuid:=auth.uid();v_id uuid;
BEGIN
 IF v_user IS NULL OR public.dabberna_active_household_role(p_household_id)
    NOT IN ('owner','adult')
 THEN RAISE EXCEPTION 'Active adult household membership required'; END IF;
 IF p_explicit_consent IS DISTINCT FROM true
 THEN RAISE EXCEPTION 'Explicit per-expense sharing confirmation required'; END IF;
 IF p_source_fingerprint IS NULL OR p_source_fingerprint !~ '^[0-9a-f]{64}$'
 THEN RAISE EXCEPTION 'Invalid source fingerprint'; END IF;
 IF p_amount_fils IS NULL OR p_amount_fils NOT BETWEEN 1 AND 100000000
 THEN RAISE EXCEPTION 'Invalid positive JOD amount'; END IF;
 IF p_occurred_on IS NULL OR p_occurred_on < DATE '2000-01-01'
    OR p_occurred_on > CURRENT_DATE
 THEN RAISE EXCEPTION 'Only already-paid dated expenses may be shared'; END IF;
 IF char_length(btrim(coalesce(p_category,''))) NOT BETWEEN 1 AND 80
 THEN RAISE EXCEPTION 'Invalid expense category'; END IF;
 -- Block duplication rather than changing a previously consented snapshot
 -- when an existing local expense is later edited.
 INSERT INTO public.dabberna_shared_expenses_v1
 (household_id,created_by,source_fingerprint,category,amount_fils,occurred_on)
 VALUES(p_household_id,v_user,p_source_fingerprint,btrim(p_category),p_amount_fils,p_occurred_on)
 RETURNING id INTO v_id;
 RETURN v_id;
END;
$$;

-- No general delete right. The original sharer can withdraw only their
-- own item. The household owner cannot silently delete another adult's data.
CREATE OR REPLACE FUNCTION public.dabberna_unshare_one_expense(
 p_household_id uuid,p_expense_id uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
BEGIN
 IF auth.uid() IS NULL OR
    public.dabberna_active_household_role(p_household_id) NOT IN ('owner','adult')
 THEN RAISE EXCEPTION 'Active adult household membership required'; END IF;
 DELETE FROM public.dabberna_shared_expenses_v1
 WHERE household_id=p_household_id AND id=p_expense_id AND created_by=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Expense not found or not owned by this member'; END IF;
END;
$$;

-- Membership revocation/voluntary departure deletes that member's formerly
-- shared expenses: no lingering co-parent visibility after consent withdrawn.
CREATE OR REPLACE FUNCTION public.dabberna_purge_shared_on_revocation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
BEGIN
 IF OLD.status='active' AND NEW.status='revoked' THEN
   DELETE FROM public.dabberna_shared_expenses_v1
   WHERE household_id=NEW.household_id AND created_by=NEW.user_id;
 END IF;
 RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS dabberna_purge_shared_on_revocation_trg ON public.dabberna_household_members;
CREATE TRIGGER dabberna_purge_shared_on_revocation_trg
AFTER UPDATE OF status ON public.dabberna_household_members
FOR EACH ROW EXECUTE FUNCTION public.dabberna_purge_shared_on_revocation();

REVOKE ALL ON FUNCTION
 public.dabberna_share_one_expense(uuid,text,text,bigint,date,boolean),
 public.dabberna_unshare_one_expense(uuid,uuid)
FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION
 public.dabberna_share_one_expense(uuid,text,text,bigint,date,boolean),
 public.dabberna_unshare_one_expense(uuid,uuid)
TO authenticated;

-- SECURITY RELEASE GATES:
-- 1. Review privilege hardening, member RLS and definer owners in staging.
-- 2. Verify access with distinct signed-in A/B/C, revoked users, and anon.
-- 3. Simultaneous leave/revoke/share must not retain rows after revocation.
-- 4. Test duplicate submission, invalid dates, amounts, replay and permissions.
-- 5. Confirm deletion of server copies, logs/backups and third-party caches.
-- 6. Do not add full local finance import or child accounts in this migration.
-- 7. Merchant/payment architecture is completely separate.
