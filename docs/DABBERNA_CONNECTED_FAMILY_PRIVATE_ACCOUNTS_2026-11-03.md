# Dabberna Connected Family — private-by-default implementation
**Implementation:** 3 November 2026 — staged, NOT active in the public GitHub Pages pilot.

## The intended two-parent journey

1. Each adult signs into their own authenticated account on a different device or browser profile. Do **not** share a login, browser profile, or private Money records.
2. One adult creates the household and issues a short-lived, single-use invitation. The second adult accepts it while signed into their own account.
3. Each adult continues managing personal budgets, income, cash balances and plans in their **local** Money ledger. Joining or accepting a household does not upload these records.
4. For an actual paid expense already marked as household-related in Money, a parent opens Connected Family and selects that one record. Every item defaults to **Only me** and does not upload anything.
5. Choosing **Share amount, category and date** displays the exact three fields before an explicit consent checkbox and a second confirmation. Notes, receipts, private purchases, cash balances, income and children details remain local.
6. Both household adults can refresh and see a read-only **Together / Shared by me / Other adults** total for the same calendar month. Totals include only explicitly published entries, and never become new expenses in either person's local Money ledger. This avoids double counting.
7. The author can withdraw a published copy; revocation or leaving the household purges that member's published rows at the backend after review/activation.

## What is not yet implemented

- The family budget is **not** automatically assembled from both private Money ledgers.
- Real-time background updates, private calendar/plan sync, per-person local vaults and household shared salary-cycle settings are not implemented.
- No sharing of full notes, attachments, income, child records, bank balances, automated banking or merchant payments.
- No bank reconciliation or bank-sourced confirmation.

## Security/rollout requirement

The new UI is behind existing independent build flags:
- `VITE_ENABLE_HOUSEHOLD_ACCOUNTS=true`
- `VITE_ENABLE_HOUSEHOLD_EXPENSE_SHARING=true`

The public GitHub Pages deployment does **not** set either flag. Do not enable before applying and auditing BOTH migrations in isolated Supabase staging:
- `app/supabase/household_accounts_v1.sql`
- `app/supabase/household_shared_expenses_v1.sql`

Then test using at least three **real, separately authenticated accounts**: owner A, invited adult B, unrelated C. Validate that:
- A and B see exactly the same consented total, while their local Money/child records remain inaccessible to the other;
- anon, C, revoked B, an adult in a different household, and a community-circle contact cannot read household expense or membership rows, including via API/RLS direct calls;
- forged author, invalid invite, unconsented share, duplicate same-author source fingerprint and other-account withdrawal are denied at the server;
- delete/leave/revoke purge data, and parallel invite/share/revoke flows respect membership state;
- the 200-row read cap does not masquerade as a complete monthly total;
- network and application logs never include private notes, child records, bank balances or unconsented data;
- normal public builds still work without credentials or server-side migrations.

**Same-browser caveat:** the existing browser-local `wafferli.v13.money` storage is not yet keyed to authenticated user accounts. Signing out of Supabase does not remove those records. On a shared device, adults MUST use separate browser profiles; an authenticated multi-account rollout on shared browsers is blocked until isolated local namespaces or private vault migration has passed security review.

## UX principles

- One family, independent adults, privacy by default.
- Shared household figures are a **separate, explicitly consented read-only view**, not a financial transaction import.
- The original local `shared` flag is an eligibility label and does not grant co-parent access.
- Every expense must be individually approved. A local entry is not uploaded when merely saved, marked household, or included in an unlocked browser.
