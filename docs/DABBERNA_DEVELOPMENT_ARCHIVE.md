# Dabberna — complete development archive and recovery map

**Canonical reference for future Dabberna work.** Prepared 16 October 2026 from the actual GitHub repository and pull-request history. User instruction: **preserve the knowledge and recoverability of everything built, even if a feature is removed from the family interface.** Do not treat "removed from UI" as "abandoned." Avoid rebuilding a capability from zero without first locating its previous implementation.

## Source of truth and historical anchor

- Repository: https://github.com/fareshashemabdallah/wafferli-v13
- Current application code assessed: main commit 7d5559ddf3fec29e5d816c1e5f2508d475a2b9f1 (merged PR #80).
- **Pre-removal snapshot**: [commit 73404e070c9a282ec9481ae404f398b2d32dc0db](https://github.com/fareshashemabdallah/wafferli-v13/commit/73404e070c9a282ec9481ae404f398b2d32dc0db), immediately before PR #80. It contains all seven subsequently deleted files and earlier versions of changed parent-facing pages.
- **Change-by-change timeline**: appendix below indexes **all 80 GitHub PRs** and distinguishes merged changes from the two non-merged proposals (#2 open; #7 closed). Git history also contains the initial repository state predating PR #1.
- [Prior feature implementation register](https://github.com/fareshashemabdallah/wafferli-v13/blob/main/docs/dabberna-feature-implementation-register.md) covers detailed architecture through PR #64; it is a **historical snapshot**, not the complete current-release status.
- [Cleanup rationale and data-retention contract](https://github.com/fareshashemabdallah/wafferli-v13/blob/main/docs/consumer-feature-pruning-2026-10.md) documents the later PR #80 feature pruning.
- Use the full source history to recover exact components and design decisions. This document indexes them; it does not duplicate all source code.

## Product north star: family support, not family administration

Dabberna / دبّرنا is a bilingual, parent-first, privacy-respecting family-life advisor targeting families with children, initially in Jordan. Its intended cycle is: **understand the family's minimum initial context → plan → manage → research and decide → monitor changes → propose adjustments, with small explicit parent confirmations.**

Parents should see (1) household financial safety and detailed **fixed, variable and periodic spending**, (2) meaningful family plans and reminders, (3) evidence-based product/outing/service recommendations, and (4) one clear recommended next action. Do not turn the interface back into disconnected manual-data-entry tools. Keep Arabic/English parity. A real answer must distinguish entered figures, inference, independently retrieved facts, and missing or stale sources.

**Commercial north star:** preserve Dabberna Plus, merchant accounts/onboarding, merchant catalogs/offers, merchant-direct payment provider checkout, transaction attribution/commission accounting, and country-market expansion as staged business foundations. They should not be promoted as live consumer features before the underlying service exists. **Dabberna must not hold or manually redistribute customer/merchant funds.** Merchant incentives may support revenue but must not covertly determine the family advisor's recommendations; label paid placements.

## Current user-facing capabilities (as of PR #80)

| Capability | Current role | Primary source / decisions |
| --- | --- | --- |
| Today / Ask Dabberna / Our Plans | Three-outcome main navigation; secondary Family & Settings | app/src/components/AppShell.tsx; app/src/routes/index.tsx; advisor.tsx; plans.tsx (#77) |
| Household starting context | Optional three-number financial start with privacy warning; can skip to asking | app/src/components/FamilyStarterCard.tsx (#77); starterBudget logic (#21–22, #73) |
| **Detailed finances** | Fixed, variable, periodic category budgets and entered/confirmed spending; optional split of original combined estimate, without inventing known categories | app/src/components/SpendingBreakdownCard.tsx; app/src/lib/spendingBreakdown.ts; app/src/routes/money.tsx (#79). **Must not regress.** |
| Financial safety and planning | Income, cash, bill due dates, reserve, recorded spending, monthly carryover, savings goals, 30-day cash forecast, 3/6/12-month scenarios and financial guidance | app/src/lib/money.ts; components/MoneyOverviewPanel.tsx; financialReadiness, cashflow, financeAlignment, spendingScenario (#15–22, #34, #41, #56, #71) |
| Family events and plans | Saved dates/birthdays, occasion ideas, approved linked family plans, no-duplicate plan creation, on-open check-ins, user-approved postponement where permitted | routes/space.tsx, calendar.tsx, occasions.tsx, plans.tsx; FamilyNextActions.tsx; familyPlanCheckIn.ts (#6, #8–9, #19–20, #42, #44, #70, #77–78) |
| Shopping decisions | Saved shopping list, manual comparisons if the parent already has prices, wishlist, recurring needs and seller-domain discovery | routes/explore.shopping.tsx, explore.smartbuy.tsx, explore.market.tsx (#33, #44, #55, #69, #74). Price feed is **not automatically live**. |
| Weekend family outings | Conservative entered-data cash headroom analysis, opt-in real named OpenStreetMap map discovery, child-aware outing decisions, private optional group vote | routes/explore.weekend.tsx; lib/weekendOutingDecision.ts; weekendPlaceSearch.ts; routes/explore.together.tsx (#48, #72, #75). Venue price, age fit, opening and booking not independently verified. |
| Family services | External source searches plus private parent-maintained provider shortlists; no medical endorsement | routes/explore.services.tsx, components/FamilyServiceShortlist.tsx (#36). |
| Family decisions & reminders | Local guided advisor, priority brief, saved tasks/wishlist reminders and privacy-aware calendar export | GuidedFamilyAdvisor.tsx; familyAttention; familyDecisionBrief; TodayFamilyBrief; tasks and calendar export (#23, #28, #31, #42–43, #49, #51–52, #68). |
| Privacy and portability | Local browser store, private vs shared preview, offline encrypted backups/restore, vault controls; no claim of secure multi-account deployment | routes/about.tsx; components/LocalDataControls.tsx; PrivateVaultPanel.tsx; lib/backupRestore.ts (#29–30, #45, #57). |
| Progressive browser app | Bilingual AR/EN UI, GitHub Pages hash deep-link recovery, limited service worker/offline status, accessibility work and CI | AppShell.tsx; app/scripts/ensure-pages-deep-links.mjs; workflow config (#39, #59, #67, #76). |

## Built and retained as **foundations**, but not fully active

| Future capability | Recoverable source and provenance | What is missing before public activation |
| --- | --- | --- |
| **Live AI and autonomous research** | app/src/lib/liveAiClient.ts; liveAiProtocol.ts; liveAiPrivacy.ts; app/supabase/functions/dabberna-family-ai/index.ts; docs/live-ai-activation.md; PRs #61–66. | Secured deployed Supabase environment, credentials, quota and real staging security verification. Live chat is feature-gated. AI with web/product research and independently verified offers is **not implemented end-to-end**. |
| **Real retailer comparison** | app/src/lib/marketPriceFeed.ts, jordanMarketSources.ts; app/src/routes/explore.market.tsx; docs/jordan-market-price-rollout.md; #74. | Licensed/authorized trustworthy product feed(s), exact item matching, price freshness, delivery/stock and commercial arrangements. Public page mainly creates external retailer search links until a feed is connected. |
| **Verified household accounts & expense sharing** | app/src/lib/householdAccounts.ts, householdAccess.ts, householdExpenseApi.ts; app/supabase/household_accounts_v1.sql, household_shared_expenses_v1.sql; docs/household-accounts-rollout.md; PRs #25–27, #37, #57. | Deployed migrations with isolated authenticated security tests, consent/revocation and cross-device conflict resolution. |
| **Personal encrypted cross-device vault** | app/supabase/private_vault_v1.sql; docs/encrypted-personal-vault.md; staged code/test path; #29–30, #45. | Correct backend and key lifecycle, hard security review, usable safe recovery. |
| **Dabberna Plus + market expansion** | app/src/lib/membershipPolicy.ts and marketPolicy.ts; docs/plus-and-markets-gates.md; #47. | Merchant/consumer value proposition, secure subscription billing, refunds, server-side entitlements; Jordan, Lebanon, UAE and Oman are planning markets, not enabled international finance features. |
| **Merchant-direct payments and attribution/commissions** | app/src/lib/merchantPaymentPolicy.ts; docs/payment-commission-architecture.md and payment-commission-schema.sql; #24. | Contracts, licensed PSP, merchant authentication, webhooks, idempotent financial ledger/reconciliation, tax/legal policies and security. **No funds custody by Dabberna**. |
| **Actual merchant onboarding, real offers, merchant reporting** | Existing merchant policy and payment foundations, old prototype UI and workflow snapshot below; PR #53 | Replace fictional actor simulator with authenticated authorized merchant service and real product data; do not reactivate mock roles as a production portal. |
| **Public social proof / family circles** | routes/community.tsx and experience.tsx remain in main; original launch #3, later #40. | Defined use case, verified identities, consent, moderation, data reliability, privacy and actual evidence of parent usefulness. Legacy routes remain but are no longer promoted. |
| **Automatic monitoring and notifications** | local attention engine, on-open reminders, optional .ics export, #28, #32, #46, #49, #52. | Backend scheduler, notification permission/delivery, changed-price sources, privacy-safe data updating. No claim of always-on research in static GitHub Pages. |

## Features removed from the *consumer interface* at PR #80

**Removal was an interface/product-scope decision, not a judgment that the underlying work has no future value.** All removed file bodies remain available at the exact pre-cleanup commit shown here.

| Deleted file | Retrieve historical source |
| --- | --- |
| app/src/components/CommercialReadinessPreview.tsx | [Pre-cleanup source](https://github.com/fareshashemabdallah/wafferli-v13/blob/73404e070c9a282ec9481ae404f398b2d32dc0db/app/src/components/CommercialReadinessPreview.tsx) |
| app/src/components/MerchantQuoteDraft.tsx | [Pre-cleanup source](https://github.com/fareshashemabdallah/wafferli-v13/blob/73404e070c9a282ec9481ae404f398b2d32dc0db/app/src/components/MerchantQuoteDraft.tsx) |
| app/src/components/MerchantWorkflowSandbox.tsx | [Pre-cleanup source](https://github.com/fareshashemabdallah/wafferli-v13/blob/73404e070c9a282ec9481ae404f398b2d32dc0db/app/src/components/MerchantWorkflowSandbox.tsx) |
| app/src/components/PrivateOfferWorkspace.tsx | [Pre-cleanup source](https://github.com/fareshashemabdallah/wafferli-v13/blob/73404e070c9a282ec9481ae404f398b2d32dc0db/app/src/components/PrivateOfferWorkspace.tsx) |
| app/src/lib/merchantWorkflowSandbox.ts | [Pre-cleanup source](https://github.com/fareshashemabdallah/wafferli-v13/blob/73404e070c9a282ec9481ae404f398b2d32dc0db/app/src/lib/merchantWorkflowSandbox.ts) |
| app/src/lib/merchantWorkflowSandbox.test.ts | [Pre-cleanup source](https://github.com/fareshashemabdallah/wafferli-v13/blob/73404e070c9a282ec9481ae404f398b2d32dc0db/app/src/lib/merchantWorkflowSandbox.test.ts) |
| docs/merchant-workflow-simulator.md | [Pre-cleanup source](https://github.com/fareshashemabdallah/wafferli-v13/blob/73404e070c9a282ec9481ae404f398b2d32dc0db/docs/merchant-workflow-simulator.md) |

Additional **UI sections** were removed or simplified within still-existing files:

- app/src/routes/explore.smartbuy.tsx: merchant RFQ drafts, locally entered quotation workspaces and preview-only product/receipt photo inputs. See [pre-cleanup version](https://github.com/fareshashemabdallah/wafferli-v13/blob/73404e070c9a282ec9481ae404f398b2d32dc0db/app/src/routes/explore.smartbuy.tsx). The manual two-shop comparison itself **still exists** as an optional fallback.
- app/src/routes/about.tsx: developer merchant role simulator and Free/Plus market-readiness preview. See [pre-cleanup version](https://github.com/fareshashemabdallah/wafferli-v13/blob/73404e070c9a282ec9481ae404f398b2d32dc0db/app/src/routes/about.tsx).
- app/src/routes/advisor.tsx: duplicate amount calculator, optional link to chat circles and inactive live-AI promotional panel. **The guided spending decision engine and gated actual live-AI backend were retained.** See [pre-cleanup version](https://github.com/fareshashemabdallah/wafferli-v13/blob/73404e070c9a282ec9481ae404f398b2d32dc0db/app/src/routes/advisor.tsx).
- app/src/routes/explore.index.tsx, explore.services.tsx and occasions.tsx: promotional entry points into standalone social/review experiences and extra directory screens. Existing social data was **not deleted**.
- Parent recommendations now link to real seller-source discovery rather than forcing a user-entered price form. No new live pricing provider was connected in this change.

**Critical preservation details:** current source still includes app/src/lib/privateQuoteWorkspace.ts, merchantQuoteDraft.ts and their tests, the merchantPaymentPolicy, marketPolicy, membershipPolicy, and the staged SQL/Edge foundations. The historical quoted offers stored locally were not programmatically erased. Old consumer editors are no longer available in current UI, however, so restoring those workflows should start with a data inventory and backup rather than silent reinterpretation.

## How to restore any removed feature safely

1. Identify the exact merged PR and/or historic snapshot using the appendix below, read its actual changed files and tests.
2. Create a **new feature branch from latest main**. Never force-reset main to an old commit; that would destroy newer improvements, including the fixed/variable financial view.
3. Recover selected deleted files from commit **73404e070c9a282ec9481ae404f398b2d32dc0db** using Git (example): 

       git restore --source=73404e070c9a282ec9481ae404f398b2d32dc0db -- app/src/components/MerchantQuoteDraft.tsx

   For a previous version of an existing file, **inspect the diff and port only the needed behavior**; don't wholesale replace modern app/src/routes files.
4. Review present-day TypeScript contracts, dependency versions, privacy/security requirements, family-consent controls, migrations and merchant/PSP dependencies; restore or write necessary unit and UX tests.
5. Activate through **explicit feature flags only after verification**, and merge after CI/security/parent usability validation.
6. Keep core family financial visibility and consent defaults intact. Don't claim live AI, merchant offers, payouts, social proof or bank synchronization because an old component renders.

**Git history retains source, not users' localStorage, uploaded documents or merchant contracts.** The archived code is not a backup of a parent's private browser data. Preserve privacy-safe export/import separately.

## Development chronology by product thread

- **Early family pivot, home/navigation, calendar/occasions:** PRs #1–14. Foundational household UI, weather, group experiences, simplified family-first Today, early concierge.
- **Finance integrity, bills, categories, money decisions and plans:** #15–22; enhanced #34, #41, #56, #68, #71, #73, #79. The fixed/variable/periodic breakdown on Today and Money in #79 is an essential retained feature.
- **Contextual intelligence, sharing architecture and backups:** #23–32, #37, #42–43, #45–46, #57. Includes controlled RLS, optional reminders and vault prototypes; permissions remain gated.
- **Buying, quotes, provider shortlists and merchant foundations:** #24, #33, #35–36, #38, #40, #44, #47, #49, #53, #55. Some **consumer editor UI later removed in #80**; policy and data foundations remain.
- **Outings and family collaboration:** #1–3, #9–10, #36, #48, #70, #72, #75. Child-aware planning and public OSM search are not equivalent to verified availability/venue prices.
- **Live AI, security, usability and Arabic accessibility:** #39, #50–51, #59–67. Real backend deployment and independently sourced research are still pending.
- **Parent-driven decision UX:** #68–80. Main transitions: first useful answer → 3 parent questions → weekend answer-to-map flow → deep-link correction → three-outcome navigation → one-tap plan checks → restore expense category clarity → remove dead-weight UI.
- **Not merged:** PR #2 remains open; #7 was closed without merging. Their proposals are part of project discussion/history but are **not evidence of code merged into current main**.

## Rules for future development chats

1. **Read this archive and the original register** before rebuilding, deleting or discussing the status of a major capability.
2. Prefer a **recover-and-adapt** plan to duplicating older modules. Name the old PR/commit when resurrecting a feature.
3. Treat **commercially strategic but inactive** (Plus, merchants, PSP, AI, research, family accounts) as foundations deserving preservation—not consumer features to advertise prematurely.
4. Keep users' financial categories transparent: **fixed / variable / periodic, planned vs paid, cash vs estimates**.
5. Keep small onboarding, minimal repeated input, privacy by default, one useful answer, and user-approved changes as non-negotiable requirements.
6. Classify status separately as **designed, code exists, publicly enabled, externally connected, tested with real users, production-ready**. Never collapse these into a percentage claiming completion.
7. Update this file when features are retired, reintroduced or substantially rewritten; include the PR and recoverable SHA. Git history is the durable source; conversational memory is only a helpful pointer.

## Appendix: Complete pull request index (80 records)

This index was generated from the repository's actual GitHub pull-request listing on 16 October 2026. Titles are the historical PR titles, not promises of live capability. Each link gives the changes, discussion and commit context.

| PR | Development increment | Merge state | Merge commit |
| --- | --- | --- | --- |
| [#1](https://github.com/fareshashemabdallah/wafferli-v13/pull/1) | Family-first homepage, live opt-in weather, and on-demand service discovery | Merged | 5b1e7263b8 |
| [#2](https://github.com/fareshashemabdallah/wafferli-v13/pull/2) | Private member networks, outing discussions and context-only experience reviews | Open, not merged | — |
| [#3](https://github.com/fareshashemabdallah/wafferli-v13/pull/3) | Add invite-only family circles and contextual experience reviews | Merged | 0bd380447b |
| [#4](https://github.com/fareshashemabdallah/wafferli-v13/pull/4) | Spend Wisely. Live Well. — family-first navigation and feature names | Merged | 4de0d03f9d |
| [#5](https://github.com/fareshashemabdallah/wafferli-v13/pull/5) | Make My Day family-first: calendar, moments and gentle financial overview | Merged | 98ed4098c3 |
| [#6](https://github.com/fareshashemabdallah/wafferli-v13/pull/6) | Link family member birthdays and anniversaries to Family Calendar | Merged | 9a7078fa2d |
| [#7](https://github.com/fareshashemabdallah/wafferli-v13/pull/7) | Add member birthdays and family milestones to My Family | Closed, not merged | — |
| [#8](https://github.com/fareshashemabdallah/wafferli-v13/pull/8) | Avoid duplicate birthdays when family profiles meet existing calendar entries | Merged | 4e8363180c |
| [#9](https://github.com/fareshashemabdallah/wafferli-v13/pull/9) | Add proactive occasion concierge, budget-aware ideas and daily public inspiration | Merged | 305e15f9af |
| [#10](https://github.com/fareshashemabdallah/wafferli-v13/pull/10) | Connected calm experience: My Day, Discover and guided family choices | Merged | 6ed2eccdfb |
| [#11](https://github.com/fareshashemabdallah/wafferli-v13/pull/11) | Simplify Dabberna after first family usability test | Merged | 3380ffeab1 |
| [#12](https://github.com/fareshashemabdallah/wafferli-v13/pull/12) | Make Dabberna's purpose instantly understandable on the home page | Merged | e22f904a48 |
| [#13](https://github.com/fareshashemabdallah/wafferli-v13/pull/13) | Remove repeated home actions and display only useful family reminders | Merged | 48acf430e5 |
| [#14](https://github.com/fareshashemabdallah/wafferli-v13/pull/14) | Dabberna premium family-concierge design — first visit and daily experience | Merged | cc4e4429e7 |
| [#15](https://github.com/fareshashemabdallah/wafferli-v13/pull/15) | Reconcile Money overview with bills, cash and recorded spending | Merged | 6fea51acee |
| [#16](https://github.com/fareshashemabdallah/wafferli-v13/pull/16) | Align income, expense budgets and savings; confirm actual payments and reallocate with consent | Merged | 96ea5ecebd |
| [#17](https://github.com/fareshashemabdallah/wafferli-v13/pull/17) | Inline bill variances, contextual budget advice and next-month carryover | Merged | 0c7d03625f |
| [#18](https://github.com/fareshashemabdallah/wafferli-v13/pull/18) | Generate a complete Word document of Dabberna source code | Merged | d6df07aa8d |
| [#19](https://github.com/fareshashemabdallah/wafferli-v13/pull/19) | Connect Dabberna family Plans across Today, Money, Discover and occasions | Merged | b07283ef3c |
| [#20](https://github.com/fareshashemabdallah/wafferli-v13/pull/20) | Turn Plans into clear financial decisions with actionable on-page calculations | Merged | 374dfb8fbf |
| [#21](https://github.com/fareshashemabdallah/wafferli-v13/pull/21) | Give families a clear first step instead of confusing Money and Plan warnings | Merged | 6be6040a47 |
| [#22](https://github.com/fareshashemabdallah/wafferli-v13/pull/22) | Add named family savings goals and actionable Money readiness inside existing screens | Merged | b67e4c3338 |
| [#23](https://github.com/fareshashemabdallah/wafferli-v13/pull/23) | Family Intelligence: prioritize one actionable next step on Today | Merged | fa7edfdb96 |
| [#24](https://github.com/fareshashemabdallah/wafferli-v13/pull/24) | Payment architecture: noncustodial merchant checkout and configurable commissions | Merged | 3ac78be624 |
| [#25](https://github.com/fareshashemabdallah/wafferli-v13/pull/25) | Family Intelligence: guided setup, connected advice and private household access foundation | Merged | 1c39e2f102 |
| [#26](https://github.com/fareshashemabdallah/wafferli-v13/pull/26) | Stage verified household accounts with single-use invitations and access revocation | Merged | b816adecfa |
| [#27](https://github.com/fareshashemabdallah/wafferli-v13/pull/27) | Private-by-default household finance: explicit per-expense sharing and withdrawal | Merged | 1d5f5f9912 |
| [#28](https://github.com/fareshashemabdallah/wafferli-v13/pull/28) | Family Intelligence v2: one actionable attention feed and local data controls | Merged | a29753d9dd |
| [#29](https://github.com/fareshashemabdallah/wafferli-v13/pull/29) | Validated local backup recovery with consent, data preview and rollback | Merged | b80de68861 |
| [#30](https://github.com/fareshashemabdallah/wafferli-v13/pull/30) | Stage opt-in encrypted personal vault for manual cross-device backup | Merged | f5ac69f9e0 |
| [#31](https://github.com/fareshashemabdallah/wafferli-v13/pull/31) | Grounded bilingual family advisor: local question-and-answer journeys | Merged | 7caa9646ee |
| [#32](https://github.com/fareshashemabdallah/wafferli-v13/pull/32) | Private calendar reminder export for family dates and bills | Merged | 7d38dc538e |
| [#33](https://github.com/fareshashemabdallah/wafferli-v13/pull/33) | Private shopping RFQ drafts and verifiable manual price evidence | Merged | 14413a38e2 |
| [#34](https://github.com/fareshashemabdallah/wafferli-v13/pull/34) | Conservative 30-day what-if cash assessment for family spending | Merged | fb7f895754 |
| [#35](https://github.com/fareshashemabdallah/wafferli-v13/pull/35) | Private merchant quote tracking with manual offers, expiry and total cost | Merged | 6bbd4fd858 |
| [#36](https://github.com/fareshashemabdallah/wafferli-v13/pull/36) | Local family-service evidence shortlist with parent-owned verification checklists | Merged | c09ac55f0b |
| [#37](https://github.com/fareshashemabdallah/wafferli-v13/pull/37) | Repair staging SQL function syntax and add real-user Supabase isolation test harness | Merged | 127998505a |
| [#38](https://github.com/fareshashemabdallah/wafferli-v13/pull/38) | Link explicitly chosen manual merchant quote to an unverified family purchase Plan | Merged | 746045c054 |
| [#39](https://github.com/fareshashemabdallah/wafferli-v13/pull/39) | Repository-scoped app-shell offline support and honest connectivity status | Merged | 0e40ac99f9 |
| [#40](https://github.com/fareshashemabdallah/wafferli-v13/pull/40) | Restore private merchant quotation records and family-service comparisons safely | Merged | a2e997875e |
| [#41](https://github.com/fareshashemabdallah/wafferli-v13/pull/41) | Family financial intelligence: spending history, flags and 3/6/12-month scenarios | Merged | 57321674b3 |
| [#42](https://github.com/fareshashemabdallah/wafferli-v13/pull/42) | Parent-managed family responsibilities, linked plans and Today task reminders | Merged | c3df27f744 |
| [#43](https://github.com/fareshashemabdallah/wafferli-v13/pull/43) | Family Intelligence 2.0 — linked finance, plans, tasks and family dates | Merged | 504e048d6f |
| [#44](https://github.com/fareshashemabdallah/wafferli-v13/pull/44) | Private gift and family purchase wishlist with recorded price history | Merged | be46841f7a |
| [#45](https://github.com/fareshashemabdallah/wafferli-v13/pull/45) | Offline password-protected family backups with local decryption and validated restore | Merged | 6e3de6df36 |
| [#46](https://github.com/fareshashemabdallah/wafferli-v13/pull/46) | Expanded family reminder inbox and local expense privacy review | Merged | 80b706c0af |
| [#47](https://github.com/fareshashemabdallah/wafferli-v13/pull/47) | Staged Free/Plus and Jordan–Lebanon–UAE–Oman market launch policies | Merged | 99c84afe6b |
| [#48](https://github.com/fareshashemabdallah/wafferli-v13/pull/48) | Explainable child-aware outing comparison with private venue checks | Merged | 6304e1cdc4 |
| [#49](https://github.com/fareshashemabdallah/wafferli-v13/pull/49) | Connect consented gift and shopping deadlines to Today family intelligence | Merged | 89d81bb96a |
| [#50](https://github.com/fareshashemabdallah/wafferli-v13/pull/50) | Regression tests for parent-visible family, gift and outing interactions | Merged | fd646c96ef |
| [#51](https://github.com/fareshashemabdallah/wafferli-v13/pull/51) | Widen guided family Q&A across tasks, gifts, outings and services | Merged | 2347b5be25 |
| [#52](https://github.com/fareshashemabdallah/wafferli-v13/pull/52) | Export selected household task and gift reminders privately to device calendars | Merged | 76ec9074d8 |
| [#53](https://github.com/fareshashemabdallah/wafferli-v13/pull/53) | Stage a developer-only fictional merchant onboarding and offer review workflow | Merged | 15c74a7bef |
| [#54](https://github.com/fareshashemabdallah/wafferli-v13/pull/54) | Track Dabberna feature implementation and explicit production release gates | Merged | fb6e603ade |
| [#55](https://github.com/fareshashemabdallah/wafferli-v13/pull/55) | Manually confirm recurring family purchases without duplication or payments | Merged | 71e30ac1df |
| [#56](https://github.com/fareshashemabdallah/wafferli-v13/pull/56) | Financial history: parent-reviewed months and reliable spending comparisons | Merged | ccaa57b664 |
| [#57](https://github.com/fareshashemabdallah/wafferli-v13/pull/57) | Privacy-by-default for new expenses and clear consent preview | Merged | d72010cbfc |
| [#58](https://github.com/fareshashemabdallah/wafferli-v13/pull/58) | Keep Dabberna implementation register accurate through PR #57 | Merged | aee26b53f3 |
| [#59](https://github.com/fareshashemabdallah/wafferli-v13/pull/59) | Accessible bilingual keyboard navigation across mobile and desktop | Merged | a00ddcb637 |
| [#60](https://github.com/fareshashemabdallah/wafferli-v13/pull/60) | Record bilingual navigation accessibility in feature-status register | Merged | 3c6fdf3fe5 |
| [#61](https://github.com/fareshashemabdallah/wafferli-v13/pull/61) | Live Family AI: authenticated, consented Supabase Edge integration (deployment-gated) | Merged | c351eb5a9e |
| [#62](https://github.com/fareshashemabdallah/wafferli-v13/pull/62) | Compile-check Supabase Deno live AI backend in CI | Merged | b3bc3167bb |
| [#63](https://github.com/fareshashemabdallah/wafferli-v13/pull/63) | Live AI privacy: exact request preview, opt-in prior turns and sensitive-text checks | Merged | 90c83bb5ad |
| [#64](https://github.com/fareshashemabdallah/wafferli-v13/pull/64) | Add explicitly gated staging smoke tests for Dabberna live AI | Merged | c749bd087e |
| [#65](https://github.com/fareshashemabdallah/wafferli-v13/pull/65) | Clarify staged live AI privacy and staging test readiness | Merged | 4772597622 |
| [#66](https://github.com/fareshashemabdallah/wafferli-v13/pull/66) | Connect family purchasing decisions, harden live AI consent/costs, improve Arabic accessibility | Merged | e01d373d86 |
| [#67](https://github.com/fareshashemabdallah/wafferli-v13/pull/67) | Make family value and ease ≥9/10 measurable; fix first-user reliability | Merged | aefae5fd89 |
| [#68](https://github.com/fareshashemabdallah/wafferli-v13/pull/68) | Simplify Today: one family next step and quick expense entry | Merged | dac6ba272a |
| [#69](https://github.com/fareshashemabdallah/wafferli-v13/pull/69) | Make family shopping comparisons simpler and reuse the basket | Merged | 9d5e94534e |
| [#70](https://github.com/fareshashemabdallah/wafferli-v13/pull/70) | Connect calendar occasions to one plan; simplify guided family advice | Merged | ea32ea4eff |
| [#71](https://github.com/fareshashemabdallah/wafferli-v13/pull/71) | Make family spending advice specific, explainable and one-step | Merged | 52aa2a1c0c |
| [#72](https://github.com/fareshashemabdallah/wafferli-v13/pull/72) | Connect family next-step and child-aware outing advice to saved household choices | Merged | d31f26e646 |
| [#73](https://github.com/fareshashemabdallah/wafferli-v13/pull/73) | Replace confusing finance jargon and comparisons with parent-first answers | Merged | 99e2bd30c8 |
| [#74](https://github.com/fareshashemabdallah/wafferli-v13/pull/74) | Redesign Dabberna around three family questions and online seller discovery | Merged | 15933df6ce |
| [#75](https://github.com/fareshashemabdallah/wafferli-v13/pull/75) | Make 'Can we afford an outing this weekend?' a real answer-to-places journey | Merged | 05e142fb4e |
| [#76](https://github.com/fareshashemabdallah/wafferli-v13/pull/76) | Fix GitHub Pages 404 on direct Dabberna page links | Merged | 12fb329dd4 |
| [#77](https://github.com/fareshashemabdallah/wafferli-v13/pull/77) | Shift Dabberna from data-entry tabs to advice-first family decisions | Merged | 2a90e02d88 |
| [#78](https://github.com/fareshashemabdallah/wafferli-v13/pull/78) | Help parents monitor and adjust plans with one-tap check-ins instead of editing forms | Merged | 78d04946ab |
| [#79](https://github.com/fareshashemabdallah/wafferli-v13/pull/79) | Restore transparent fixed and variable spending breakdown on Today and Money | Merged | 73404e070c |
| [#80](https://github.com/fareshashemabdallah/wafferli-v13/pull/80) | Prune unused merchant, social and duplicate tools from Dabberna consumer UX | Merged | 7d5559ddf3 |
