# Dabberna — Family Intelligence Attention v2 and Local Data Control

Status: integrated into the browser-local pilot; no cloud migration or background notification capability is implied.

## Unified family attention

The Today page replaces its two independent recommendation cards with one priority queue (up to four items). It joins the existing finance priority rules with upcoming recorded bills, planned family decisions, and upcoming family calendar dates. It reuses the existing Finance, Plan and Family engines rather than introducing a second affordability formula.

Important boundaries:

- Financial cash-shortfall/overdue-bill signals receive highest priority. They are never snoozed, including if local snooze storage is manually modified.
- Upcoming bills are taken from the app's dated, unpaid schedules. A reminder is not verification that the provider has not received payment.
- Child birthdays come from actual parent-entered profiles only; demo/sample members never generate birth dates or age claims.
- Family plans and outings use previously entered dates, estimates and preferences; no invented merchant prices, availability, bookings or bank balances.
- Preferences honor guidance OFF, important-only and gentle modes, financial advice, bill reminders and lifestyle opt-in.
- Noncritical items can be temporarily snoozed for one day; gentle inspiration for seven. Snooze changes visibility only; it does not mark a bill paid or change financial data.
- The list is computed when the app is opened/viewed. **No background push, scheduled automation, device notification, email or SMS is sent by Dabberna.**
- This is deterministic personalized local guidance, **not a connected conversational AI model**.

## Local personal data controls

The About page now offers two deliberate controls:

1. **Export a local JSON backup** of allowlisted Dabberna data including Money, family members/preferences, calendar, plans, shopping and the app's own reminder display state. It is generated in the browser and downloaded locally. No data is uploaded to a cloud service. The file is **unencrypted** and may contain sensitive personal data, so users must protect it. Passwords, Supabase authentication sessions, raw external API keys and third-party cache files are expressly excluded.
2. **Erase Dabberna's known local storage keys/caches** only when the user types DELETE and approves a browser confirmation. The app reloads. Browser clearing does not sign the user out, delete Supabase accounts, delete community posts or retract expense data already intentionally shared with someone else.

There is **no restore/import workflow yet**: the export is a human-readable data portability/backup file, not a guarantee that it can be loaded directly into a future version. Restoration requires schema validation, idempotent migration and authentication/sync safeguards.

## Tests and next actions

Automated tests cover sequencing, sample-profile exclusion, bill reminders, privacy preferences, temporary snoozes and unsnoozable critical warnings. Backup tests verify credential/API-key exclusion and restrict reset to app-owned keys.

Next: opt-in authenticated cloud sync with multi-account RLS tests, safe schema/versioned import preview, account deletion and audited data access; then LLM-assisted explanations with grounding and safety gates. Neither can be claimed production-ready until connected and tested.

See docs/household-accounts-rollout.md, docs/household-expense-sharing.md, and docs/payment-commission-architecture.md for dependencies.
