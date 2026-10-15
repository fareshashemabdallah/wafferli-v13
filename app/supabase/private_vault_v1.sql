-- DABBERNA PERSONAL ENCRYPTED VAULT V1 (STAGING ONLY).
-- NOT deployed by GitHub Actions or the public GitHub Pages pilot.
-- Requires a previously configured Supabase Auth project.
-- Client encrypts ONLY reviewed backup sections before upload, using a
-- user-chosen 14+ character passphrase. Server NEVER receives plaintext,
-- credentials, derived keys or passphrase. This vault is PERSONAL ONLY;
-- other household adults must NEVER see another user's encrypted vault.
--
-- Security note: encryption does not protect against malicious JavaScript,
-- compromised devices, weak passphrases, or user-shared backup files.

CREATE TABLE IF NOT EXISTS public.dabberna_private_vault_v1 (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 revision bigint NOT NULL DEFAULT 1 CHECK(revision >= 1),
 envelope jsonb NOT NULL CHECK(
  jsonb_typeof(envelope)='object'
  AND envelope->>'algorithm'='AES-256-GCM'
  AND envelope->>'kdf'='PBKDF2-SHA256'
  AND envelope->>'version'='1'
  AND envelope->>'iterations'='310000'
  AND length(envelope::text)<=8000000
 ),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dabberna_private_vault_v1 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dabberna_vault_own_read ON public.dabberna_private_vault_v1;
CREATE POLICY dabberna_vault_own_read ON public.dabberna_private_vault_v1
 FOR SELECT TO authenticated USING (user_id=(SELECT auth.uid()));

-- No browser direct INSERT, UPDATE or DELETE; only guarded RPCs.
REVOKE ALL ON public.dabberna_private_vault_v1 FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.dabberna_private_vault_v1 TO authenticated;

-- An explicit write with an expected version prevents silently overwriting
-- another device's more recent encrypted snapshot.
-- expected_revision=0 creates only when no snapshot exists.
CREATE OR REPLACE FUNCTION public.dabberna_put_private_vault(
 p_expected_revision bigint,p_envelope jsonb
) RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_user uuid:=auth.uid();v_existing bigint;v_new bigint;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF p_expected_revision IS NULL OR p_expected_revision<0
 THEN RAISE EXCEPTION 'Expected revision required'; END IF;
 IF p_envelope IS NULL OR jsonb_typeof(p_envelope)<>'object'
   OR p_envelope->>'version'<>'1'
   OR p_envelope->>'algorithm'<>'AES-256-GCM'
   OR p_envelope->>'kdf'<>'PBKDF2-SHA256'
   OR p_envelope->>'iterations'<>'310000'
   OR length(p_envelope::text)>8000000
   OR length(coalesce(p_envelope->>'salt','')) NOT BETWEEN 20 AND 32
   OR length(coalesce(p_envelope->>'iv','')) NOT BETWEEN 12 AND 24
   OR length(coalesce(p_envelope->>'ciphertext','')) NOT BETWEEN 28 AND 7999800
 THEN RAISE EXCEPTION 'Invalid encrypted vault envelope'; END IF;
 SELECT revision INTO v_existing FROM public.dabberna_private_vault_v1
 WHERE user_id=v_user FOR UPDATE;
 IF FOUND THEN
  IF p_expected_revision<>v_existing
  THEN RAISE EXCEPTION 'Vault changed on another device; refresh first'; END IF;
  UPDATE public.dabberna_private_vault_v1
   SET revision=v_existing+1,envelope=p_envelope,updated_at=now()
   WHERE user_id=v_user RETURNING revision INTO v_new;
 ELSE
  IF p_expected_revision<>0
  THEN RAISE EXCEPTION 'Vault version conflict; refresh first'; END IF;
  INSERT INTO public.dabberna_private_vault_v1(user_id,revision,envelope)
   VALUES(v_user,1,p_envelope) RETURNING revision INTO v_new;
 END IF;
 RETURN v_new;
END;
$$;

CREATE OR REPLACE FUNCTION public.dabberna_delete_private_vault()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 DELETE FROM public.dabberna_private_vault_v1 WHERE user_id=auth.uid();
 RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION
 public.dabberna_put_private_vault(bigint,jsonb),
 public.dabberna_delete_private_vault()
FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION
 public.dabberna_put_private_vault(bigint,jsonb),
 public.dabberna_delete_private_vault()
TO authenticated;

-- REQUIRED STAGING TESTS:
-- 1. Two REAL Supabase identities A and B: B cannot SELECT A's envelope
--    or modify/delete A's vault by forged arguments or guessed user_id.
-- 2. Anonymous and non-owner direct INSERT/UPDATE/DELETE are denied.
-- 3. Revision conflict (A writes revision 1; another device tries 1) fails.
-- 4. Two simultaneous initial writes cannot create two rows; race loser
--    must refresh and report conflict, NEVER silently overwrite.
-- 5. Deleting a vault only deletes caller's own encrypted snapshot.
-- 6. Test 4–6 MB browser payload behavior/DB limits in isolated staging.
-- 7. Review SECURITY DEFINER function owner/grants, auth rate limits,
--    ciphertext retention/backups, project encryption and audit.
-- 8. No child profiles or private finance plaintext are uploaded by default;
--    all sync requires explicit action and passphrase, never silent sign-in.
-- 9. User must hold passphrase externally: lost passphrase cannot be recovered.
-- 10. Review account-deletion and device sign-out paths BEFORE production.
