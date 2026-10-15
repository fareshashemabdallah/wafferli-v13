# Dabberna — Staging database security release gate

**Status:** A runnable, destructive three-user Supabase test harness is committed. It has **NOT** been executed against a real staging project and is not part of public Pages deployment. Passing the app's static CI does not prove real database authorization.

## Migration issue found during review

The previously committed proposed SQL included malformed PostgreSQL function-body delimiters in:

- `app/supabase/household_accounts_v1.sql` — pending invite metadata function had `AS $` and `$;`.
- `app/supabase/household_shared_expenses_v1.sql` — author-only withdrawal function had `AS $` and `$$;`.

These have now been changed to balanced `AS $$` / `$$;`. An automated structural test checks that every `CREATE OR REPLACE FUNCTION` has a matching valid dollar-quoted body, a fixed definer search path, enabled RLS, and no direct authenticated-table-write grants. **Static tests are not a SQL parser or full audit.**

## Isolated staging setup — never public/live accounts

1. Create a NEW disposable Supabase project with a distinct project ref, not the project's currently used public Supabase ref. This harness **refuses** the current project's ref `izevfgdynsrlwgsczllr`.
2. Configure email/password Auth sign-in *for test identities only*, then pre-seed **three separate, disposable adult accounts A, B and C**, with unique password strings, not personal identities.
3. In the disposable project's controlled SQL editor, have the DBA/security reviewer inspect and apply the proposed migrations **in order**:
   - `app/supabase/household_accounts_v1.sql`
   - `app/supabase/household_shared_expenses_v1.sql`
   - `app/supabase/private_vault_v1.sql`
4. Review the migration execution logs, definer owners, function grants, `auth.uid()` scoping and RLS policies. Do not use a service-role key on a browser or in this test harness.
5. Supply **local shell environment variables** for the test command. Never commit or print credentials, and do not paste them into GitHub source files.

   - `DABBERNA_CONFIRM_STAGING=DISPOSABLE_PROJECT_ONLY`
   - `DABBERNA_STAGING_URL=https://<test-project-ref>.supabase.co`
   - `DABBERNA_STAGING_PROJECT_REF=<test-project-ref>`
   - `DABBERNA_STAGING_ANON_KEY=<staging-project-public-key>`
   - `DABBERNA_TEST_A_EMAIL` and `DABBERNA_TEST_A_PASSWORD`
   - `DABBERNA_TEST_B_EMAIL` and `DABBERNA_TEST_B_PASSWORD`
   - `DABBERNA_TEST_C_EMAIL` and `DABBERNA_TEST_C_PASSWORD`

6. From the repository's `app/` directory, run `npm run security:staging` after installing dependencies. The script refuses to run unless all staging variables and the **exact** destructive-test confirmation are provided.

## What the runtime harness checks

- Three truly distinct authenticated users and an anonymous client.
- User A creates a test household; B and C cannot impersonate its owner.
- User B accepts an invitation only with adult attestation; C cannot replay it.
- B and C cannot read the owner-only roster or manage invitations.
- Direct member and expense INSERT is denied.
- A and B can see one explicitly consented shared expense; C sees none.
- Missing per-item consent, unrelated writes, and replay/duplicate expense uploads fail.
- A cannot silently unshare B's expense.
- The owner-only encrypted vault cannot be read or written by another signed-in user; stale revisions fail, and B deleting their own empty vault does not delete A's.
- After A revokes B, B cannot read or post, and B's previous shared entries have been purged.

The test intentionally creates a **persistent staging household fixture** and consumes one of the disposable user's allowed household creations. Use fresh staging accounts on each run, or reset the disposable project under DBA supervision. Cleanup of the vault and member revoke is tested, but the household is not deleted because no audited household-deletion RPC exists yet. **Never run with a personal or production account.**

## Additional release-blocking checks not automated

- Concurrent different invite acceptance/revoke races, especially lock ordering and deadlock retries.
- Invite brute-force protection, resend/expiry/rate limits, password rate limits, token rotation and account recovery.
- Real browser multi-tab, two-device conflict resolution, loss of session, logout from one device, role revocation during an open request, and offline retries.
- Actual data deletion from caches, historical backup retention, export, customer support logs and subject access requests.
- Multi-device authorization and privacy with sensitive child/teen data; age assurance, consent, legal review.
- Security review of all `SECURITY DEFINER` functions, PostgreSQL role ownership, RLS grants, schema-qualified functions and SQL injection exposure.
- Browser CSP, external-source URL handling, endpoint abuse/quotas, deployment pipelines and independent security signoff.
- Correct handling of secure hosted PSP integration, if ever enabled, through regulated providers and contractual commission settlement.

**Do not enable** `VITE_ENABLE_HOUSEHOLD_ACCOUNTS`, `VITE_ENABLE_HOUSEHOLD_EXPENSE_SHARING` or `VITE_ENABLE_PRIVATE_VAULT` on public builds until these requirements are resolved and reviewed.
