# Dabberna — Validated Local Backup Recovery (October 2026)

**Implementation:** Working browser-local recovery and portability. Financial synchronization between authenticated devices is **not** enabled.

## Parent-facing flow

1. Download an unencrypted, device-local JSON backup in **About → Your data stays in your hands**.
2. In **Restore a backup**, choose the file. The application reads and checks it **in the browser only**.
3. Preview available sections and select which to replace. The default selection includes compatible sections, but parents can deselect them. Imported records REPLACE a selected section; there is no automatic merge or cloud update.
4. If one of the selected sections already exists, download and confirm a **safety backup of the current browser first**.
5. Type `RESTORE`, accept an additional explicit browser confirmation and allow the app to reload.
6. If any write fails, the restore routine attempts to roll back all touched sections to their exact previous contents; storage may still be unreliable or full. Never erase the safety download until data is checked.

## Supported restored sections — version 1

- Money: category budgets, actual/planned expense records, income schedules, bills, cash entries, savings goals and carryover
- Family member profiles
- Family calendar
- Family preferences
- Family plans and their local decision records
- Shopping list
- Private merchant quotation drafts and manually entered offers (strictly validated; no merchant-side authorization)
- Private family-service comparison notes (strictly validated; no medical credentials or provider ratings verified)

**Not restored:** outing organizer/vote tokens, friend/community/Supabase login state, API keys, calendar-related occasionPlans, SmartBuy comparison drafts, greeting/onboarding settings, local reminders/snoozes, unrecognized future fields at the top level. The file preview lists unsupported sections explicitly rather than silently replacing them. This intentionally avoids restoring token-bearing records with server-side authority and avoids pretending everything can be safely migrated.

## Safety and accuracy controls

- Requires Dabberna backup identity, exact schema version 1, a valid export timestamp, a bounded JSON file (5 MB), finite nested numbers, bounded nesting/length, valid dates, and vetted shapes for all selected types.
- Unknown top-level data sections and malformed nested records are rejected. Duplicate item IDs in list sections are rejected.
- Browser modifications that occur between preview and restore cause an abort, not an overwrite.
- Selected sections only. Other app keys and unrelated sites' local storage are untouched. Supabase auth tokens and API keys are not restored or modified.
- The backup is **plain JSON** and may include financial and child-related personal data; do not share it casually or upload it to untrusted websites.
- Because sections are replaced independently, choosing only Money or Plans may leave a missing `sourcePlanId` / `expenseId` relationship. Restore linked sections together when they belong to the same backup.
- Restoring on another device is **manual file transfer** and replacement of that device's browser data, NOT bidirectional synchronization.
- Do not treat the retrieved local content as trusted identity or permission settings. Actual household membership is always authenticated and server-checked.

## Cloud synchronization dependency (not deployed)

The existing stage-only household migrations support authenticated owner/adult membership and individual consent to share selected paid expenses; they are **not deployed** by GitHub Pages. The next secure sync phase requires: staging deployment, real multi-account RLS tests, data ownership boundaries for personal vs shared transactions, explicit import preview for each destination, server-side conflict/version checks, device logout, revoke/delete/backup policies, audit logs and legal/privacy acceptance for child-related data. No existing local expense becomes cloud-visible simply because a user restores a backup or signs in.

## Test coverage

`app/src/lib/backupRestore.test.ts` verifies strict preview, field boundaries, unsupported invitation token exclusion, explicit consent, replacement-only behavior, protection from concurrent storage changes, invalid data rejection, duplicate IDs and rollback on a failed write. CI runs TypeScript, unit tests and a production build.
