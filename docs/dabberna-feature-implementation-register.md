# Dabberna feature implementation register

_Last engineering review: 15 October 2026. Source: `main` after PR #61._

This register distinguishes **implemented code**, **actually enabled in the public browser pilot**, and **production readiness**. A green TypeScript/test/build workflow validates code quality only; it is **not** evidence that a sensitive database was deployed, that a provider is verified, or that a payment was completed.

## Status language

- **Local pilot:** user-visible in the browser; primarily data stored on that device; does not imply independent real-device QA or cross-device consistency.
- **Staged / gated:** source code and/or tests exist, but the feature is deliberately disabled publicly or requires a controlled development environment.
- **External blocker:** licensed provider, authentic third-party data, backend authorization, contractual agreement or independent security review is needed.
- **Partial:** useful foundations exist; the full promised experience has not been implemented or validated.

## End-to-end family product

| Area | Current implementation | Pilot status | Remaining gate or gap |
| --- | --- | --- | --- |
| Family onboarding | Actual-vs-demo profiles, parent-confirmed preferences and priority setup | Local pilot | Real household identity / cross-device profiles depend on staged RLS |
| Family Intelligence Engine | Local next-step prioritization connects finance, real family dates, plans and tasks (#23, #43) | Local pilot | Personalizable multi-step AI concierge and source-grounded live recommendations not connected |
| Financial budget and cash flow | Categories, manual income/bills, expenses, savings targets, 30-day projection | Local pilot | No bank-feed verification, accounting audit or server-sync correctness |
| Local finance privacy defaults | New expenses/private income start device-private, local labels explicitly separate from cloud consent, a hypothetical minimal-fields sharing preview exists (#57) | Local pilot | Existing records unchanged; authenticated per-item sharing remains disabled pending deployed RLS and independent security review |
| Spending analytics | Six-month entered-paid spending, parent-reviewed past months, change detection and conservative alerts (#41, #56) | Local pilot | Budgets are captured only when manually reviewed, not reconstructed as original historic values; records are not bank-verified |
| Longer scenarios | Read-only 3-, 6- and 12-month budget envelopes plus immediate spend stress (#34, #41) | Local pilot | No income-arrival certainty, unrecorded-cost completeness or financial guarantees |
| Family responsibilities | Parent-managed dated tasks, status, local adult display labels and optional plan linkage (#42) | Local pilot | No authenticated multi-parent assignment or push delivery |
| Gifts and occasions | Calendar, annual dates, occasion planning, gift wishlist and manually recorded prices (#44) | Local pilot | No verified retailers, actual stock, checkout or automatic gifting |
| Household shopping | Basket, manual comparisons, price history and parent-confirmed recurring 1/3/6/12-month shopping (#33, #44, #55) | Local pilot | No trustworthy live retailer feeds, stock, automatic ordering or checkout |
| Private merchant quote decisions | Parent-created RFQ drafts, self-entered offers, total cost and expiry, quote-to-Plan (#35, #38) | Local pilot | No real quotation dispatch, verified bidders or binding transaction |
| Family outings | Child attendance/focus, costs, group voting, explicit parent-checked venue suitability (#48) | Local pilot with third-party voting service | No guaranteed accessibility, venue safety, live availability or forecast-linked age rules |
| Provider and doctor comparisons | Private service checklist and source URLs, parent observations (#36) | Local pilot | No verified practitioner licensing, independent reviews or medical recommendations |
| Guided parent questions | Ten deterministic EN/AR on-device topics and source-staged, authenticated live AI client + Edge Function/SQL (#61) | Local pilot + staged backend | Server secrets, quota SQL and Edge deployment plus independent security testing not completed; no verified web research |
| In-app attention | Important financial/family/task/wishlist dates with local snoozes (#46, #49) | Local pilot | No reliable background push/OS notification permission flow |
| Calendar reminders | Explicit .ics export of selected bills, family dates, open tasks and unpurchased wishlists (#32, #52) | Local pilot | Notification delivery delegated to imported calendar; user acknowledges cloud-sync privacy |
| Encrypted local backups | Selected recovery, strict schemas and parent passphrase-protected offline file (#29, #45) | Local pilot | Independent cryptography/UX QA, key-recovery policies and real-device validation |
| Offline/mobile | Browser install metadata, static-asset-only offline service worker and offline notice (#39) | Limited local pilot | Real iOS/Android install/update/offline tests, accessibility audit, store packages if required |
| Arabic + English | RTL/LTR navigation, bilingual major journeys, skip-to-main landmark and visible keyboard focus across desktop/mobile (#61) | Local pilot | Full linguistic review, localization of error strings, independent screen-reader and WCAG testing |
| UI / logic testing | Unit tests, static SQL checks, selected React click-path smoke tests (#37, #50) | CI passes | Real browser E2E, accessibility, multi-device, load and red-team security tests missing |

## Sensitive family accounts and monetization

| Area | What has been staged | Why it is **not live** |
| --- | --- | --- |
| Authenticated household memberships | Adult invitations, owner/member logic, staged Supabase RLS migrations (#26) | Migrations not confirmed deployed, real multi-user staging security tests unrun |
| Explicit shared expenses | Per-item publish/withdraw RPC candidates, revocation purge (#27) | No independent authenticated staging validation or approved privacy/data-retention review |
| Personal encrypted cross-device vault | Opt-in encrypted envelope design, revisions, delete rules (#30) | SQL not deployed, multi-device tests and security review required |
| Teen/child access | UI-level household privacy policy and design (#25) | No real underage identity, verifiable consent, private child/teen server authorization |
| Family money synchronization | Privacy-oriented staged primitives | No production-ready bidirectional conflict handling, offline reconciliation or audited family access |
| Free / Plus | Feature/entitlement and market policy preview (#47) | No published subscription plan, priced billing, server-verified entitlements, refunds |
| Merchant portal | Fictional *development-only* merchant/reviewer simulator (#53) | NO real merchant registration, server moderation, actor authorization, onboarding verification |
| Merchant offers and commissions | Merchant-direct/PSP provider-hosted policy and tested fils calculations (#24) | No merchant contracts, licensed PSP integration, verified webhooks, accounting/settlement |
| Expansion beyond Jordan | Planning-only Jordan, Lebanon, UAE, Oman country matrix (#47) | JOD-only current Money model; no automatic FX, country-specific legal/privacy/tax readiness |

## Mandatory release criteria — do not substitute green CI

1. **Separate disposable staging**: inspect/apply SQL for memberships, shared expenses and encrypted vault; run `npm run security:staging` with independent authenticated test users, inspect failed authorizations and revocation. The harness exists but **has not been run** against real staging.
2. **Independent security validation**: server role grants, RLS, consent revocation races, invite misuse/rate limits, account deletion and retention, secure key lifecycle, CSP and supply-chain controls.
3. **Real-device QA**: iOS Safari / Android Chrome, RTL/screen-reader/low-bandwidth/offline/reinstall/logout flows, conflict recovery and encrypted backup restores.
4. **Data and commercial agreements**: verify publisher/licensing rights for prices and reviews, merchant identity/terms, consumer disclosures and regulated PSP settlement. **Dabberna must not custody merchant funds**.
5. **Product readiness**: in-person parent pilot, evidence of comprehension and activation, error and support workflows, privacy and legal review for the target launch jurisdiction.

## Remaining work that can still advance without external credentials

**Live AI external blocker:** an authorized Supabase project operator must review/deploy SQL and the Edge Function, add private OpenAI credentials and activate the public build flag after testing. The app does not become live merely by merging PR #61.

- Improve past-budget provenance beyond snapshots taken at parent review; historical completeness cannot be proven from manual entries.
- Improve recurring-shopping reminders and skipped-cycle visibility; automatic orders or charges remain unavailable.
- Broader UI/browser-path automated tests including payment-blocked paths, all AR/EN form validation and older Safari.
- A more explicit data and privacy settings journey for shared-vs-private fields (local previews only until server enforcement).
- UX refinements after real parent usability tests: accessibility, navigation complexity, plain-language advice and notification fatigue.
- Better evidence provenance in service and shop comparisons, with clear distinctions between self-recorded observations and independently sourced facts.

### Recent implemented increments

- #41 — financial analytics and longer budget what-if scenarios.
- #42 — parent family responsibilities and task priorities.
- #43 — connected family intelligence brief.
- #44 — wishlist and manually checked prices.
- #45 — protected local backup and recovery.
- #46 — expanded in-app reminders and privacy review.
- #47 — staged Free/Plus and multi-country market policy.
- #48 — private child-aware venue comparison.
- #49 — optional shopping/gift attention on Today.
- #50 — parent component interaction tests.
- #51 — grounded ten-topic guided family questions.
- #52 — four-category opt-in calendar reminder export.
- #53 — developer-only fictional merchant/reviewer workflow.
- #55 — anchored repeat-purchase planning with explicit parent confirmations.
- #56 — past-month review snapshots with stale-entry detection.
- #57 — private-by-default new financial records and hypothetical sharing preview.
- #61 — source-ready opt-in live AI conversation, authenticated Edge backend and strict usage quota; NOT DEPLOYED.
- #61 — bilingual keyboard skip navigation and focus indicators with component tests.

**Deployment truth:** source merged into GitHub `main` does not prove the GitHub Pages host has already deployed the newest commit. The public UI must be independently checked after deployment.
