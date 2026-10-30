# Dabberna regional and trilingual foundation — implementation and release gates

## Implemented in the 30 October 2026 regional-foundation branch
- One application codebase, with manually selected country (22 Arab League markets) and **independent** Arabic, English, or French interface preference. Device browser language is **suggested only for new users**, and an existing saved language is retained.
- Country selection is a **non-commercial local preference**. It does not register a provider, approve a merchant, add local holidays, enable payment, or imply that a service is available in the selected country.
- The single existing `familyPreferences.city` field is used in regional settings (no duplicated city record). Country is stored in `countryCode` separately. No GPS tracking.
- Core navigation, welcome, regional preferences and selected Today/Money/review labels have authored French translations. **French coverage remains partial** in complex forms, game content, validation and long-form guidance. Untranslated strings fall back to English, never machine-translate family names or user reviews.
- `<html lang>` and text direction respond to language selection. Arabic RTL; French/English LTR.
- Currency metadata supports country-specific lists including LBP/USD (Lebanon) and ILS/JOD/USD (Palestine). **Existing Money state, stored amounts, budget calculations, outings and backend financial summaries remain JOD.** Country changes must never relabel them or perform inferred exchange-rate conversions.
- New browser-local parent places are tagged with country; older untagged places stay in Jordan. Country filtering is client-side only. Review language is stored with the user's authored text for future *opt-in*, server-authorized translation; no external translation is called, and reviews are still private to the device.
- Optional AI client/server validation allows `fr` while keeping explicit per-turn parent consent, limited history/context, fail-closed quotas and secret credentials. Actual live AI still requires separately reviewed backend activation.

## Before enabling a regional production country
1. Audit privacy and children's information handling, retention, deletion, parental controls and lawful cross-border processing with qualified local counsel; add server authorization/RLS. Do not use a browser country choice as a security control.
2. Create **versioned multi-currency ledgers**: explicit household base currency, transaction currency, minor units, FX source/date/rate, parent-confirmed conversion and migration for legacy JOD records. Do not convert in place. Handle homes using multiple currencies and prevent accidental aggregation.
3. Add real localized holidays, school calendars, local weekends, dates, Arabic dialect review, French copy review and translations for accessibility/errors/email notifications. Ensure screenshot/regression coverage across RTL and LTR at mobile and desktop widths.
4. Build verified city/provider entities with moderation, report/appeal flows, data provenance, and location/translation consent. Do not claim user-submitted places or external search results are vetted.
5. Check licensing for childcare, commercial listings, booking/payment activities, data hosting and tax rules per country; integrate only approved and licensed PSPs when required.
6. Provision secure identity/backup/migration, regional deployment controls, audit trails and feature flags with **server-side enforcement**. Country-specific release approvals must be operator controlled, not parent selected.
7. Test real parents in Arabic, English and French; Arabic should remain a first-class product language. French is not yet complete, so do not market the full interface as translated.

## Strategic market grouping (planning only)
Core research countries: Jordan, Lebanon, Syria, Oman, Saudi Arabia, UAE, Qatar, Bahrain, Kuwait, Iraq, Egypt, Morocco, Algeria, Tunisia, Palestine.
Later research: Libya, Sudan, Yemen, Mauritania, Djibouti, Somalia, Comoros.

No market is commercially live or regulatorily approved by this branch. Deployment/release gates are independent from code readiness.
