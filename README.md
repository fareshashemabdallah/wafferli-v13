# Dabberna | دبّرنا — Family Life Pilot

**Brand name provisional.** A calm, bilingual (English / Arabic RTL) family finance and everyday decision companion.

## Test the running app
**https://fareshashemabdallah.github.io/wafferli-v13/**

In GitHub Settings → Pages select **GitHub Actions** as the deployment source. The validated full app lives in `app/`, not the old top-level `index.html` fallback.

**Implementation status and production release gates:** [Dabberna feature implementation register](docs/dabberna-feature-implementation-register.md). Use this to distinguish enabled pilot features, staged code and external blockers.

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
- Private quote records stay on this device, are included in local JSON export and device-only deletion, and **can now be selected for validated local restoration or included in the disabled-by-default encrypted personal vault only with explicit opt-in**. There is no automatic cloud upload or synchronization.

## Family-service comparison and source transparency
- Parents can create a **private device-only comparison list** of real services they discovered, with a source URL, personally entered approximate cost, date last checked, subjective family-fit score and accessibility/child-friendliness notes.
- A checklist reminds parents to independently verify availability and, for clinicians, professional credentials. **Checkmarks do not represent Dabberna verification** and the list is alphabetical rather than a fabricated clinical ranking.
- Saved records are included in explicit JSON export and local-data deletion. They are **now eligible for strictly validated manual restore and optional personal-vault backup when deliberately chosen**; the app does not upload them or verify providers automatically.
- Do not enter personal medical histories, children’s identifying information or contact credentials in comparison notes.

## Staging RLS security test harness — not executed yet
- Repaired two broken PostgreSQL dollar-quoted function bodies in the proposed household / selected-shared-expense migrations. The regular Vitest suite now checks structural safety of all three stage-only SQL files.
- Added a **separate manually invoked** `npm run security:staging` runner: tests owner/co-parent/unrelated Supabase Auth accounts for invitation replay, adult attestation, RLS isolation, explicit expense consent, author-only withdrawal, vault version conflicts and member-revocation purge.
- **This runner was not used on a real Supabase instance yet**. It explicitly rejects the current public project and demands a disposable staging project and three seeded test accounts. No live database changes or production-ready claims. [Full staging test setup and remaining gates](docs/staging-security-gates.md).

## From manual merchant quote to family Plan
- With an active unfinished purchase Plan, a parent can **explicitly choose** a still-current, manually entered merchant option and record its **full item + delivery + tax** JOD amount as an **unverified planning estimate**.
- Completed plans, closed requests and expired offers cannot be linked. No expense is automatically booked, no cash is deducted, and no merchant is contacted.
- The original quote list and the Plan are both device-local and independently editable. This is not synchronization, provider verification, purchase fulfillment or payment authorization.

## Mobile and limited offline app-shell support
- The GitHub Pages manifest now points to the correct `/wafferli-v13/` scope and uses a Dabberna-branded SVG icon. Browser and iOS home-screen installation support depends on the browser; SVG icon metadata does not guarantee every app store or device will accept it.
- The production-only service worker caches the **static SPA shell and same-origin app assets only**, enabling limited reload of previously visited pages when offline. **It does not cache any API responses, Auth tokens, cloud finance data, merchant offers, third-party results or user records.**
- Each screen gives a clear offline notice when the device reports no connection. Sign-in, outing voting, maps, live price sources and new uncached chunks remain unavailable offline; some reloads may fail if they were never opened online.
- Service worker static checks run in CI. Real-device offline reload, updates and installation require acceptance tests; this is **not** background push notifications or native App Store deployment.

## Financial intelligence — new locally grounded analysis
- Money Overview includes a six-month chart of user-entered PAID expenses, clearly distinguished from the current planning budget. Missing entries are not treated as proof of no spending.
- Review flags compare categories only when at least two previous months contain recorded entries. They are prompts to double-check timing or missing data, not fraud alerts or verified spending judgments.
- An explicit, read-only 3/6/12-month what-if tool models changes to monthly income and additional costs, including a one-time event in a selected month. No bank balance, dated bill settlement, financial guarantee or hidden ledger mutation. **Do not enter bills already allocated in regular budget categories again.**

## Parent-managed family responsibilities
- My Family now includes local, parent-managed tasks with dates, priority, optional adult display labels and optional Plan linkage; parents can mark completed or remove each task.
- Due and overdue items feed the existing Today attention list when family-life guidance is enabled. This **does not send assignments, notifications or access permissions to anyone**; family member IDs are local labels only.
- Task records are included in explicit local JSON export, validated selective recovery and the opt-in, off-by-default personal vault. No teen/child login, cloud sync or co-parent task sharing is activated.

## Connected family decisions — rule-driven version 2
- Today adds a combined, parent-controlled family brief linking upcoming **actual entered purchase/outing Plans**, a conservative cash-flow stress check of a proposed Plan's estimated cost, **locally recorded family tasks**, and upcoming actual family dates. It presents up to three ordered next steps with practical reasons and links.
- Respects disabled finance/lifestyle advice and explicit preferences. Sample family members do not generate fake birthdays or actual child profiles; no inferred merchant prices, booking, bank balances or automatic payments.
- This is **not a connected generative AI model**, nor does it transmit data to third parties or co-parent accounts. It is read-only and is available when family preferences have been confirmed.

## Family gift and purchase wishlists
- Occasion gifts and upcoming household/child purchases can be saved as local plans with a target date, optional budget/recipient label and optional repeat interval for household supplies.
- Parents explicitly enter **dated price checks** and source/store names, can review the earliest-to-latest difference and mark an item as purchased manually. No live feed, verified savings, retailer order, automatic repeat order or Money deduction is implied.
- Wishlist records are part of explicit local JSON export, strict selective restore and optional off-by-default encrypted personal vault, never household-shared by default.

## Encrypted local backup and restore — no cloud required
- About → Your Data can now generate a **passphrase-protected JSON backup of validated family sections entirely in the browser**. It uses the existing Web Crypto AES-256-GCM and PBKDF2 key derivation; no plaintext, passphrase, derived key or ciphertext is uploaded.
- The local Restore panel accepts both traditional unencrypted JSON and a protected envelope. An encrypted file must first be decrypted with its passphrase on the device, then pass all existing schema checks and explicit section-choice/safety-backup confirmation before writing.
- A lost passphrase cannot be recovered. Unlike the separate staged cloud vault, this offline download needs **no Supabase database, sign-in or environment flag**. Unsupported token-bearing local sections are intentionally omitted; older plain exports are still supported.

## Family attention inbox and device-local expense privacy review
- The Today family attention list now offers an expanded (up to 20) priority inbox and local snooze visibility/reversal while preserving the initial four-card overview and unsnoozable critical financial warnings. All alerts remain **in-app only**.
- My Family → Preferences & privacy now includes a recent, paid-expense label review. Parents may re-label entered expenses `private` or `household` on this device; changing to household requires confirmation.
- A local household label is **NOT an access permission**. No expense is automatically sent or visible to another adult; the staged backend's explicit per-item sharing/consent remains separate and disabled.

## Proposed Free/Plus and multi-market readiness — no billing
- The About page now exposes a candid **Free pilot vs proposed Plus** feature map. It does not offer checkout, live Plus subscriptions, paid unlocks or a price.
- A country registry covers Jordan, Lebanon, UAE and Oman as **future market configuration** with explicit payment, legal and currency readiness gates; financial records remain JOD-only, including when previewing another market. No silent currency conversion.
- No market launch or merchant commission settlement is enabled. [Future commercial and country rollout requirements](docs/plus-and-markets-gates.md).

## Child-aware outing suitability comparisons
- Plan Together includes a private list of venues entered by parents with their own checks on children’s admission, age suitability, stroller access, noise, estimated whole-family cost and travel distance.
- An explainable, **non-verified suitability comparison** highlights contradictions with selected children attendance, accessibility, budget, distance and **parent-selected weather check**. It does not access a live forecast, infer provider suitability or guarantee safety.
- Outing lists are device-only, available in validated selective manual backup recovery, and never automatically published with outing vote links or uploaded to a merchant.
- Age bands remain a planning context, not official age-rating data; the parent explicitly records whether each venue accommodates their children.

## Optional gift and family-shopping reminders on Today
- When the parent has **explicitly confirmed** family preferences and enabled shopping tips, Today can surface **due/overdue, unpurchased, parent-entered wishlist items** and their own latest checked-price information.
- The attention item states when no price is recorded, a checked price is older than 14 days, or a manually recorded price exceeds the parent's optional budget ceiling. It links to Gifts or SmartBuy, with the same optional local snooze behavior as other non-critical alerts.
- No live price verification, merchant push message, purchase order, background notification or financial expense is created. Purchased or undated wishlist items do not generate shopping reminders.

## Parent-journey UI regression coverage
- The automated Vitest/jsdom suite now exercises actual component interactions for a saved gift and manually checked price, local family task creation/completion, child-aware outing privacy, and Arabic RTL presentation.
- These tests also assert that those interactions **do not write a family Money ledger or a public outing vote**. This supplements pure function tests but **does not replace** real-device, real-network, independent security testing, accessibility audit or release QA.

## Wider guided family advice — grounded and device-only
- Wise Decisions now covers **ten** bilingual guided topics: existing financial safety, bills, savings, children/family dates, plans and shopping plus **family responsibilities, gifts, child-aware outings and saved service/provider comparisons**.
- Answers are computed from each parent’s existing local records and explain the source, missing facts and next action; unsupported queries still clearly disclose that live, free-form AI is not connected.
- Clinician information is a **parent-entered checklist, not medical advice, credential verification or a provider ranking**. Venues and prices remain unverified; no private family data is sent to an AI API.

## Opt-in calendar export for household responsibilities and planned purchases
- Family Calendar and Today now let parents **individually select four reminder sources** for a local .ics download: unpaid recorded bill dates, family events, open household tasks, and upcoming unpurchased gifts/household wishlist entries.
- Completed tasks and purchased wishlist items are excluded. Only relevant titles and dates enter the file—not family task notes, recipient labels or user-entered price history.
- Importing into a phone calendar **may transmit titles and dates to the user's calendar provider**; explicit acknowledgement is required. Dabberna itself still has **no background push service** or automatic calendar sync.

## Developer-only merchant workflow simulator
- A narrowly gated, fictional merchant onboarding and offer-review demonstration now exists as a **Vite DEVELOPMENT-only** view, absent from all production builds. For local testing only, set `VITE_ENABLE_MERCHANT_WORKFLOW_DEMO=true` and open About.
- It demonstrates typed status transitions, reviewer-versus-merchant actor distinctions, JOD/fils precision and offer expiry, but actor switching is NOT authentication; business names and offers are not verified, persisted, sent to customers or settled.
- The live merchant marketplace still requires real company registration/verification, server-side roles, offer moderation, commercial agreements, consumer terms and licensed payment settlement. [Simulator documentation and security gates](docs/merchant-workflow-simulator.md).

## Recurring family purchasing — manual cycle confirmation
- An optional 1/3/6/12-month cadence now **reschedules the same device-local household/children wishlist item** when a parent explicitly clicks **Bought this cycle — schedule next**. No new duplicate wishlist rows, retailer orders, automatic checkouts, background jobs or budget deductions are created.
- Repeat items require a first due date. Dates follow the original chosen day (31 January → last day of February → 31 March), with late parent confirmations advancing only to the next future schedule. A second confirmation on the same calendar date is refused.
- Recurrence anchor and manual last-purchase date are retained through the strictly validated, opt-in local recovery and private encrypted backup flows. These confirmations are self-reported, not independently verified merchant transactions.

## Spending history reliability and review snapshots
- Parents may explicitly mark **past months** as having reviewed the paid expense entries they recorded. This is **not** a certification of complete real-world spending or a bank reconciliation; current/future periods and demo finance data cannot be marked reviewed.
- The app saves a compact local change fingerprint, the recorded paid transaction count, and the planned monthly envelope as viewed **when the parent marked that month reviewed**. Historical budgets are not reconstructed/backdated. If a paid expense changes later, the review is marked stale until reviewed again.
- The Financial Intelligence comparison chart distinguishes reviewed and unreviewed months. **Unusual-spending prompts now need at least two user-reviewed prior comparison months**, reducing unreliable alerts from missing historical entries. The current month remains an incomplete partial period.
- These opt-in review records can be selectively exported/restored through strict local backup validation, without exporting credentials or triggering payments or sharing family data.

## Financial privacy defaults and exact local sharing preview
- **New expenses now start with a Private (device) label**, including quick Money entries, expense editor, paid bills, completed family Plans and recorded shopping baskets. New manual income sources also default to Private. **Existing saved data is not relabeled or migrated.**
- Parents can explicitly change labels in My Family > local expense privacy review. Selecting a Household label does NOT send the item to another account, grant access or constitute cloud consent. The editor and expense list now say **Household label (device only)** instead of implying shared access.
- For locally Household-labeled entries, the parent may expand a **hypothetical per-item preview** showing only the category, JOD amount and date that a separately consented shared copy could contain. Names, notes, linked family Plans and balances are excluded. No network request is made by this preview.
- Real cross-device sharing remains feature-gated off and requires a separate explicit per-item consent step, deployed and independently tested RLS, authenticated adults and security approval.

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
