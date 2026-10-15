# Private-by-default household expense sharing — staged implementation

Status: source and database migration proposal only. **Not active in the public pilot.** This is one-expense-at-a-time sharing, NOT complete family finance or banking synchronization.

## Consent and privacy model

1. The parent joins an authenticated adult-only household with Supabase Auth and approved membership tables. Membership in a family/friends circle does not confer any household finance access.
2. With both staging feature flags enabled, the parent sees only genuine, locally recorded, paid, household-marked Money expense entries with valid dates, positive amounts and recognized categories. Neither sample/demo expenses nor private-marked/only-planned items are eligible. The old shared label alone NEVER uploads a record.
3. The parent selects ONE expense, sees the exact category/amount/date preview, checks an explicit per-item consent checkbox and confirms again. Only then does the app call the server. Every subsequent item requires separate consent.
4. A cryptographic SHA-256 fingerprint scopes the random local expense ID to the signed-in user and household. The raw local ID, notes, child or payer identity are NOT uploaded. The server sees an integer amount in JOD fils, category, date, fingerprint and confirmation; auth.uid supplies the author.
5. Active co-parent adult members can view these explicitly shared copies with PostgreSQL RLS. Other households, friends-circle users, minors and revoked memberships have no access.
6. The original author can withdraw a shared record via a scoped server RPC. Sharing/unsharing never alters existing Money records, balances or payment status on the original browser.
7. Membership revocation or voluntary departure triggers removal of that member's server-side shared copies. This cannot erase screenshots, independent copies, historical backups or third-party cached data.

No entire Money database, salaries, cash balances, payment credentials, children profiles, calendar events, personal notes, shopping carts, category budgets or savings goals are automatically transmitted. Category/date/amount can themselves be sensitive and must be reviewed every time.

## Source and deployment

- app/supabase/household_accounts_v1.sql: prerequisite membership migration, currently NOT deployed by CI.
- app/supabase/household_shared_expenses_v1.sql: new follow-on migration for shared rows, restricted RLS SELECT, consented publish/author-only withdraw RPCs, and cleanup on membership revocation. **Apply only to isolated reviewed staging.**
- app/src/lib/expenseSharing.ts: explicit eligibility/preview, SHA-256 scoped idempotency fingerprint, careful conversion of 2-decimal local expenses to JOD fils.
- app/src/lib/householdExpenseApi.ts: authenticated, validated API adapter, guarded by two independent build flags.
- app/src/components/HouseholdExpenseSharing.tsx: bilingual opt-in item chooser, pre-upload confirmation, verified household list, withdrawal.
- app/src/routes/household.tsx: loads the panel only inside signed-in, active membership UI when flags are enabled.

Staging-only build environment:
- VITE_ENABLE_HOUSEHOLD_ACCOUNTS=true
- VITE_ENABLE_HOUSEHOLD_EXPENSE_SHARING=true

Both flags are required. Public builds leave the feature disabled, and CI does not deploy database migrations. Do not enable production without a threat model and security signoff.

## Real-multi-user adversarial tests required before launch

- Two co-parents can see a single explicitly shared item; a third unrelated user, anonymous client, friend-circle member and revoked adult cannot.
- Direct INSERT/UPDATE/DELETE of expense table as authenticated or anonymous fails; only authenticated scoped RPC permits changes.
- Forge missing consent, invalid identity or household, invalid amount/date, duplicate fingerprint or another author. Every attempt must fail.
- Duplicate concurrent shares create one row; previously consented snapshot never changes.
- Original sharer can withdraw; household owner cannot delete another adult's record.
- Owner revocation and member departure purge the member's server records. Concurrent publish/revoke must not leave rows because publish locks membership until commit.
- User-entered notes, private expenses, planned expenses, income, cash, child profile and names never appear in provider network payloads.
- No copied/mirrored records alter household forecast or personal Money budget automatically.
- Verify backup/log deletion obligations, expiry of auth and inviting, rate limits, actual staging roles and GRANT/RLS behavior.

## Remaining blockers

Security-reviewed database deployment, real authenticated RLS test harness, explicit user migration/import UX, conflict resolution and co-parent privacy for complete financial sync, deletion/retention policy and youth privacy requirements are still outstanding.

Merchant payment handling is a separate provider-managed noncustodial initiative; no merchant funds are transferred through this sharing module.
