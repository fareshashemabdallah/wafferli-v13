# Dabberna — secure household accounts rollout

Status (15 October 2026): the account UI and migration have been added to source, but are NOT enabled in the public static pilot. No finance data sync exists.

## Architecture boundary

- Community/friends groups are distinct: their membership grants no household data rights. A shared Supabase email authentication session does not imply shared finance permissions.
- A signed-in person explicitly creates a household. The owner can issue a one-time, 256-bit random invitation code that expires after 72 hours. Code hashes are stored server-side, while the plain code is shown only once to the owner.
- Invite recipients must sign in independently and self-attest to being 18+. Attestation is NOT independent age verification. Only owner/adult accounts are supported: no teen or child accounts.
- PostgreSQL RLS restricts reading household/member metadata; every change uses server-authenticated narrowly scoped RPCs. Revoked members lose access via the membership check.
- **Local budgets, savings goals, child profiles, calendars and spending are never uploaded by sign-in or joining.** Household membership does not grant access to private expenses.
- No merchant payment, custody or settlement infrastructure is enabled by household membership.

## Files and deployment

- app/supabase/household_accounts_v1.sql: candidate migration for **staging**, creating household/member/invite metadata, RLS and RPCs; NOT run by CI or by the static app.
- app/src/lib/householdAccounts.ts: client adapter with server-response validation and opt-in build flag.
- app/src/routes/household.tsx: bilingual authenticated household creation, adult invitation, revocation and leaving UI.
- app/src/lib/householdAccess.ts: local pure authorization policy for later finance-sharing work.
- docs/household-access-rls.sql: separate PRELIMINARY proposed expense-sharing database design. **Not applied** and must be audited separately.

Before enabling, operators must deploy the migration into a non-production Supabase staging project, review pgcrypto schema, login callback allowlist, role/grant and SECURITY DEFINER properties, RLS and Auth configuration, and execute a multi-user security test plan. Enable the staging UI via the build environment value VITE_ENABLE_HOUSEHOLD_ACCOUNTS=true, with staging Supabase URL and publishable key. Default builds keep the flag disabled. Releasing to the public requires a security and product signoff.

## Essential real-auth integration test matrix

| Scenario | Required outcome |
| --- | --- |
| Anonymous user reads household/member/invite tables | Denied |
| Signed-in A creates household and consents | A is owner; local money untouched |
| A issues invitation and B signs in and accepts | B added as adult; token used exactly once |
| Another user tries used/expired/revoked token | Denied |
| B attempts owner-only invitation or membership revocation | Denied |
| B tries to view owner's roster of an unrelated household | Denied |
| A revokes B, then B calls any household RPC | Denied by active membership checks |
| A tries to revoke self or an unrelated household member | Denied |
| Two separate invites accepted simultaneously at 8-member cap | Maximum 8 active members |
| Community/friends member without household membership | No household membership access |
| Browser sends its own role/creator UUID | Ignored: server derives signed-in user |
| User has not checked adult confirmation | Create/join rejected |
| Sign in/create/join/logout on two devices | No local financial or child data copied |
| Pending invitation code after navigation | Not recoverable from browser storage |
| Static public build with flag unset | Household controls disabled |

Note: adults self-attest to age; this is not proof of legal adulthood. Assess legal/privacy obligations and apply additional age-assurance controls before live rollout. Verify RLS with multiple real auth.uid identities, not merely simulated local household profiles. Sign-out will also affect the current community session because Supabase authentication is shared.

## Remaining financial-sync milestone

Do not activate automatic household finance sharing. Implement an opt-in, authenticated migration preview, separate co-parent/private versus shared spending scopes, server-enforced authorization and RLS for each financial table, audit logs, revoke/delete/leave semantics, backups, and multi-account penetration tests first. Never treat a local shared-spending checkbox as an access grant.
