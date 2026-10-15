# Dabberna | دبّرنا — Family Life Pilot

**Brand name provisional.** A calm, bilingual (English / Arabic RTL) family finance and everyday decision companion.

## Test the running app
**https://fareshashemabdallah.github.io/wafferli-v13/**

In GitHub Settings → Pages select **GitHub Actions** as the deployment source. The validated full app lives in `app/`, not the old top-level `index.html` fallback.

## Features in this pilot
- **Home:** financial snapshot using the same browser-local household budget as My Money; upcoming obligations, practical family insights and a family-friendly style.
- **Weather:** real Open-Meteo forecast when the parent chooses a city. Practical clothing and umbrella suggestions; no passive location tracking. A provider outage shows an honest error.
- **My Money:** income sources, expense categories, actual spending, savings targets, dated bills, cash flow and conservative cash-available calculation. Entered figures are estimates and not professional financial advice.
- **Family Advisor:** practical affordability calculator that considers entered cash, future bills and reserve; guides users to relevant modules. A conversational AI model is **not connected**.
- **Explore:** child-aware family/friends outings with estimated costs and group voting, restaurants and cuisines, shopping basket and manual purchase comparison.
- **Family Services:** on-demand search of doctors, education, home services, activities and gifts via attributed third-party Google Maps links. No invented doctors, rankings, verified reviews or clinical advice.
- **Family profiles and preferences:** parent-controlled visibility of weather and suggestions, preferred outing budget/distance, and in-app guidance frequency.
- **Bilingual navigation:** Arabic RTL / English LTR.

## Merchant payment and commission architecture (future)
Dabberna will **never custody merchant/customer funds or manually redistribute sales proceeds**. Customer payments must be initiated through merchant/provider-hosted payment flows; where supported, a regulated provider should settle Dabberna's contractual commission natively. Commission agreements can vary by merchant and category. A typed and tested JOD/fils calculation and transaction record model is in `app/src/lib/merchantPaymentPolicy.ts`. The proposed backend event/reconciliation scheme and release gates are documented in [Payment & commission architecture](docs/payment-commission-architecture.md) and [proposed SQL schema](docs/payment-commission-schema.sql). **No live PSP, hosted payment, or settlement integration exists yet.**

## Family Intelligence — latest implemented priorities
- **Guided family setup:** One progress checklist across actual household profiles, existing monthly Money setup and parent-confirmed preferences. Demo people do not count as real family members; parents can explicitly remove examples or skip adding names.
- **Connected family recommendations:** One contextual insight linking real upcoming family plans with financial estimates; flags multiple plan costs above the monthly unallocated budget without calling them cash. Gentle outing ideas reflect **actual** family profiles and explicitly chosen child-attendance/focus preferences.
- **Child-aware default outings:** Typical attendance and outing focus prefill the planner, but each outing can change those choices.
- **Future family accounts:** Access-control policy and proposed server-side RLS schema exist as **design only**. No shared household budgets, cross-device finance sync, parent-to-parent access, or children accounts are live. See [family priorities and outstanding security gates](docs/family-intelligence-priorities.md).

## Authenticated household accounts — staged development
- Verified Supabase email sign-in, household creation, 72-hour single-use **adult invitation codes**, owner revocation and member exit are implemented in source behind an **OFF-by-default** build flag.
- Household memberships are not family-and-friends circles; invitations carry no automatic permission to read Money, private expenses, children's profiles or family calendars.
- Deployable-candidate [household membership SQL](app/supabase/household_accounts_v1.sql) is **not applied automatically**. Parent/adult RLS and invitation controls require real multi-account security verification in staging. The 18+ check is self-attestation, not independent age verification.
- Public pilot leaves household functionality disabled. Full steps and threat cases: [household accounts rollout](docs/household-accounts-rollout.md).
- **Still missing:** reviewed backend migration, verified deployment, explicit consent-based private/shared financial sync, account deletion and age-assurance review.

## Selective household expense sharing — staged only
- Added per-item adult consent: one actual, locally household-marked expense can be reviewed and copied to an authenticated household, **only when both explicit staging flags are enabled**. Nothing uploads automatically, and private expenses, notes, children, income, cash and savings remain local.
- Added author-only withdrawal and automatic purge of the author's shared server copies on leaving or revoked membership in the **proposed staging database**. Shared categories, dates and amounts may still be sensitive.
- [Staged expense-sharing SQL](app/supabase/household_shared_expenses_v1.sql) and [privacy & deployment checks](docs/household-expense-sharing.md) must be security reviewed and tested with separate real accounts. **Neither migration is installed by CI; public GitHub Pages remains disabled for household accounts and expense sharing.**
- This is not full two-way family-money synchronization or card/merchant payment processing.

## Family Intelligence attention and personal data controls
- **One prioritized Today attention list** now combines cash risks, upcoming unpaid bill dates, family plans and calendar moments rather than displaying duplicate finance/plan advice cards. It honors parental preferences, supports temporary local snoozing of noncritical items, and never hides critical financial warnings.
- **Local personal data management** in About: explicit browser-generated JSON export and two-step local data erasure. The export is **unencrypted**; Supabase login sessions and external API keys are excluded. Validated core local-data restore is available; other sections remain unsupported.
- Signals refresh when Dabberna is opened. **No background push alerts, conversational AI, verified bank data or cloud financial sync have been activated.**
- Technical scope: [Family attention and data controls](docs/family-attention-and-data-controls.md).

## Validated browser-local backup recovery
- **Working in this pilot:** Import an exported Dabberna JSON file via About, preview six vetted categories (Money, Family profiles, Calendar, Preferences, Plans, Shopping), choose the sections to replace, download a current-data safety copy, and explicitly confirm. A failed write triggers rollback.
- **Safety:** Refuses invalid or unknown backup schemas, stale previews and duplicate record IDs; skips unreviewed modules and *does not* restore invitation tokens, passwords or API keys. The file is handled locally. Backups are **unencrypted**.
- **Not cloud sync:** A restored file replaces local sections only, without merging, uploading, or granting co-parent access. [Backup-recovery policy & limits](docs/validated-local-backup-recovery.md).

## Encrypted personal vault — staged, NOT public
- Source includes an explicitly opt-in, AES-256-GCM / PBKDF2 encrypted **personal** backup to move validated core sections between an individual's devices. A parent chooses every category, retains the passphrase and must manually decrypt, download and review before using the local Restore tool.
- [Staging-only private vault database migration](app/supabase/private_vault_v1.sql) has per-user RLS, explicit write/delete RPCs and revision conflicts. **Not deployed** and gated off in public builds by default: `VITE_ENABLE_PRIVATE_VAULT=true` only for a reviewed staging deployment.
- A co-parent, friend, group or household membership does not gain access. This is **manual cloud backup transfer**, NOT continuous two-way synchronization, family-account data sharing or production security approval. [Privacy/threat model and rollout gates](docs/encrypted-personal-vault.md).

## Guided family question advisor (device-only)
- The **Wise Decisions** screen now supports bilingual suggested questions and short free-text prompts about household cash risk, dated bills, savings goals, family occasions, open plans and manual shopping decisions.
- Each reply uses existing **browser-local**, explicitly entered family and finance records and discloses its source, missing information and next action. Answers are temporary in-memory UI state, not saved or uploaded.
- This is **rule-driven advisory guidance, not generative conversational AI**, a bank-account connection, a professional financial assessment or a provider price/booking verification. Unsupported questions are handled transparently.

## Family calendar reminder export
- Parents may **explicitly select upcoming recorded bills and/or actual family dates**, inspect the list and download a local `.ics` calendar file containing a one-day VALARM reminder. Available on My Day's attention list and Family Calendar.
- Reminder files are downloaded in the browser, not sent to Dabberna services. Importing a file into a calendar application **may transfer event names and dates to that provider**; parents must acknowledge this.
- **No background push/SMS/email is active in Dabberna.** Device/calendar notification delivery depends on the user's calendar app, system permissions, and import behavior. Sample finance and sample-member birthdays are excluded.

## SmartBuy merchant quotation draft and price evidence
- SmartBuy now allows a **private consumer quotation request draft** with product/service, quantity, delivery city, expected date and optional JOD maximum. Every request is previewed and must be explicitly approved before the customer copies the text.
- **No merchant receives the draft through Dabberna.** This is not a verified quote marketplace, supplier offer, merchant onboarding, transaction or payment integration. Do not include personal contact details, children's details or full street addresses.
- A shopper can record a public HTTPS source URL and the date on which they personally checked a price. **Checked** means the user asserts it, not independent price verification. Entries older than seven days are flagged for review and changing a store or total resets manual check status.

## Cash-flow what-if spending assessment
- Wise Decisions models a proposed purchase **paid today** against the user's verified-for-freshness manual cash input, 30-day recorded due bills and projected low-point, and chosen reserve. A bill or cash risk triggers a **review** outcome; incomplete or stale information triggers **unknown**; a provisional result is never a bank guarantee.
- Model is read-only and **does not spend, authorize, deduct or send money**. It does not know unrecorded daily costs, true bank balances, unconfirmed provider settlements or delays of expected income. No live bank feed or licensed financial advice.

## Private quotation and offer comparison workspace
- A parent can save a manually prepared RFQ as an **unsent local draft**, optionally mark that they shared it **themselves outside Dabberna**, and enter prices they independently obtained from suppliers.
- The workspace compares **item + delivery + tax** in JOD, distinguishes expired quotes, shows whether a chosen budget ceiling is exceeded, and supports local closure and deletion. The app never asserts suppliers are verified, offers are authentic, requests were delivered, or payments happened.
- Private quote records stay on this device, are included in local JSON export and device-only deletion, and **are not automatically included in the reviewed cloud vault or core backup restore**. Export can be read manually but automatic restoration of this newer section is not yet supported.

## Family-service comparison and source transparency
- Parents can create a **private device-only comparison list** of real services they discovered, with a source URL, personally entered approximate cost, date last checked, subjective family-fit score and accessibility/child-friendliness notes.
- A checklist reminds parents to independently verify availability and, for clinicians, professional credentials. **Checkmarks do not represent Dabberna verification** and the list is alphabetical rather than a fabricated clinical ranking.
- Saved records are included in explicit JSON export and local-data deletion. They are **not included in automated validated restore or the staged encrypted vault** because those modules support only reviewed core sections; the file itself can still be retained.
- Do not enter personal medical histories, children’s identifying information or contact credentials in comparison notes.

## Staging RLS security test harness — not executed yet
- Repaired two broken PostgreSQL dollar-quoted function bodies in the proposed household / selected-shared-expense migrations. The regular Vitest suite now checks structural safety of all three stage-only SQL files.
- Added a **separate manually invoked** `npm run security:staging` runner: tests owner/co-parent/unrelated Supabase Auth accounts for invitation replay, adult attestation, RLS isolation, explicit expense consent, author-only withdrawal, vault version conflicts and member-revocation purge.
- **This runner was not used on a real Supabase instance yet**. It explicitly rejects the current public project and demands a disposable staging project and three seeded test accounts. No live database changes or production-ready claims. [Full staging test setup and remaining gates](docs/staging-security-gates.md).

## From manual merchant quote to family Plan
- With an active unfinished purchase Plan, a parent can **explicitly choose** a still-current, manually entered merchant option and record its **full item + delivery + tax** JOD amount as an **unverified planning estimate**.
- Completed plans, closed requests and expired offers cannot be linked. No expense is automatically booked, no cash is deducted, and no merchant is contacted.
- The original quote list and the Plan are both device-local and independently editable. This is not synchronization, provider verification, purchase fulfillment or payment authorization.

## What isn't live yet
- Bank connections, verified shared family finances across parents' devices, credit cards and payments.
- Generative AI, automated independent review aggregation, live product price feeds and healthcare provider verification.
- Background push notifications or automated event/calendar integrations.
- Review publication and verified doctor visits.
- Outing voting requires a working Supabase backend and must be tested across devices; the rest of the household information stays on this device.

**Use fictional or test financial/household details during the pilot**; browser-local data can be cleared or shared if the device/profile is shared. Do not enter sensitive health or child information into third-party searches.

## Development and CI
- Main source: `app/` React, TypeScript, Vite, Tailwind and TanStack Router.
- Install: `cd app && bun install --frozen-lockfile`
- Test: `bun run typecheck && bun run test && bun run build`
- GitHub Actions validates the build and deploys `react-dist/` to Pages upon a merge to `main`.
- Existing data storage keys and all existing share/vote URL formats remain unchanged.

**دبّرنا — قرارات أذكى، حياة أسهل.**
