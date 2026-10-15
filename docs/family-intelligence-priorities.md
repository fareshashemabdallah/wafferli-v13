# Family Intelligence — remaining priorities (October 2026)

## Implemented in this iteration

1. **Guided family setup:** Today provides a small, reusable three-step journey, linking existing My Family, Money and Preferences editors. Existing saved records are not overwritten. Demo people are never treated as actual household members. Parents may explicitly remove demonstration profiles or skip names. Preferences are explicitly confirmed; default settings are not silently treated as chosen preferences.
2. **Child-aware outings:** Parents can choose whether children usually join, and whether an outing should mainly serve children or everyone. These are prefills only and can be changed for every outing. Optional manually provided city is used as a starting location, with no passive geolocation.
3. **Connected advice:** A read-only deterministic selector connects actual dated Plans to monthly household planning and upcoming commitments. It considers combined estimated plan costs for a month, asks for missing cost estimates, and never calls a plan "affordable" solely from an allocation. Gentle family-activity suggestions appear only after preferences are explicitly confirmed, and only with real family profiles. Existing plan highlights are replaced rather than duplicated.
4. **Shared-household access foundation:** Pure authorization rules and tests, plus a **proposed, NOT deployed** PostgreSQL RLS schema in [household-access-rls.sql](household-access-rls.sql). Financial information remains on this browser.

## Privacy and accuracy requirements

- Member profiles in the browser are **not authenticated identities**.
- "Shared" in the current Money pilot is a local label, not a server-granted sharing permission.
- Parents cannot view each other's private expenses through the proposed future role system unless the author deliberately shares the expense. Teens see only their own spending. Child accounts get no finance permission by default.
- Sample people must not imply real children, birthdays, age groups or activity recommendations.
- Never call the monthly budget's unallocated amount verified cash. Money forecast excludes some unscheduled costs; no plan is a booking or payment transaction.
- Advice honours the guidance-frequency and financial/lifestyle opt-in preferences. No background push notifications or AI provider connection is implied.
- No payment credentials, provider keys, bank connections, customer card data or regulated PSP logic are added by this work.
- All data in this iteration is device-local. It is not synchronized or shared across devices.

## Secure cross-device account launch is still blocked on

- Separate tenant/household authorization service; verified identity for each adult (e.g., Supabase Auth) and an opt-in consent/invitation lifecycle.
- Server-side role/visibility checks and Postgres RLS across *every* household data table; never rely on TypeScript UI permission checks.
- Explicit data ownership and migration plan for local budgets, including adult-private vs shared records. Avoid importing private or children-related information without review and consent.
- Production backend security review; tests with multiple real authenticated sessions and household isolation. Invite expiry, member removal, device sign-out and account deletion workflows.
- Youth privacy, safeguarding and legal review before enabling child/teen accounts or location/family data synchronization.
- Deployment of reviewed migrations with restricted database roles, event audit, encryption, backups and incident-response controls.
- Test deletion/revocation, loss of device, XSS resistance and abuse scenarios. Do not share financial data with friends' community circles.

**Status:** Onboarding and local advisory logic implemented with tests. Multi-user household accounts and actual backend data syncing intentionally remain disabled until the above work is completed.
