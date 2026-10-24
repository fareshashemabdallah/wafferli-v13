# Dabberna active-workflow and ownership cleanup — 24 October 2026

This is a *controlled migration*, not a goal to eliminate every legacy file or flatten all screens into one component. Source audited against the published static Vite/React app and the latest single-family-fact contract.

## What is actually active

| Current entry | Role | Canonical owner | Decision |
|---|---|---|---|
| Today (/) | One next action, near-term dates, payment warnings | members / familyCalendar / familyPlans / money | Keep. Resolve family context from canonicalFamilyReadModel. |
| Money (/money) | Dashboard, categories, income, payment history | money (expense ledger, budget lines, commitments) | Keep. Keep old Bills/Spending access for uncategorized historic data, not a second ledger. |
| Family (/family) | Overview with embedded Calendar, Plans, Tasks | members / familyCalendar / familyPlans / familyTasks | Keep. Derive linked plan headings/dates from canonical family source. |
| Calendar (/calendar), Plans (/plans), Occasions (/occasions) | Direct/deep-link specialist workspaces; Family embeds some | Same authoritative dates/plans, not separate records | Keep for existing links and compatibility. Do not clone events or plans for display. |
| Ask (/advisor) | Device-only explainable advice; opt-in live AI conditional | Reads existing family & Money context | Keep. Normalize the same family context before responding. |
| Settings (/space), /household | Profile, privacy, backup and optional adult account membership | members, familyPreferences, secure auth | Keep. Do not treat account or browser backups as duplicate family records. |
| Shopping and outings (/explore/*) | Comparison, wishlists, browsing, group choices | Wishlist or existing linked Family Plan | Keep existing links; separately audit overlapping shopping journeys. |
| Community and experience (/community, /experience) | Reviews/circles | Dedicated community data | Keep; not an alternative birthday or expense ledger. |
| /vote/$token, /together/$adminToken | Shared invite/poll administration deep links | Existing group invitation data | Keep. Removing navigation links would not mean safe to delete these routes. |
| /about | Privacy and product disclosure | Content only | Keep. |

All registered URL routes are reachable; being hidden from the three primary tabs is *not* proof of dead code.

## Consolidation implemented in PR #154

- Added **canonicalFamilyReadModel** in the existing canonicalFamilyFacts domain. It reads member birthdays, author-entered Calendar moments and linked plans **once**, projecting date/name through stable IDs. It writes nothing to storage.
- Migrated TodayActionPolicy, Family overview, connected guidance and guided Ask Dabberna to this one projection. Plans, Calendar and core Money readers already use canonicalPlanViews, now delegated to the same model.
- Removed repeated independent plan/date normalization within those active readers. No new events, bills, incomes or transactions are created.
- Retired **familyMoneyJourney.ts**, a separate unshipped weekly story/priority engine, and its obsolete test. Migrated the remaining handoff test to the *current* TodayActionPolicy so exact canonical plan/calendar IDs remain protected.
- Retained historical moneyJourneyFocus and moneyJourneyLastReviewedWeek preference fields where backup/restore compatibility still reads them; never erase existing families' browser data to improve an import count.

## Invariants / validation

- Updating a child's name or birth date updates the source-derived date/title in Today, Family, Calendar, Plans and local advisor while the original plan ID and gift decision remain unchanged.
- Financial projections may read the same linked plan but **cannot create another paid expense**. The gift payment remains one expense identified by sourcePlanId/sourceOccasionCost; changing the birthday does not silently move parent-entered due dates.
- Deleting a birthday source does not delete stored plan/payment history. Two siblings with the same name/date retain distinct identity keys.
- Tests: canonicalFamilyReadModel integration, real FamilyLifePage UI, existing Today and connected guidance suites, unchanged full TypeScript/build/production validation.

## Intentionally deferred — require specific proof

1. **Server/AI/hosted auth:** The public frontend is a static SPA, but existing server, Supabase and optional AI assets may support staging/security or future deployment; do not remove them on static reachability alone.
2. **Test-only business engines:** familyAttention, familyDecisionBrief, homeSnapshot, policy calculations and related tests may still encode safety invariants. Review and port assertions to the current service before considering deletion.
3. **Specialist screen overlap:** Shopping, activities, group polls, backup, provider reviews and historical bills require separately scoped journey audits. Screens can share a record without being merged physically; **one owner per fact matters more than one page per category**.
4. **Performance:** all registered routes currently load through the generated router; introduce safe route-level lazy loading only with bundle, deep-link, test and preview validation.

## Maintenance gate

For every future feature or cleanup: (a) identify the authoritative record ID, (b) identify every reader/writer including deep links and backup compatibility, (c) prohibit independent copies of dates/costs, (d) test edit, duplicate tap, cancellation, archived data and financial impact, (e) run Bun frozen install, TypeScript, full unit/UX suite, source audit, static build and Pages deployment.
