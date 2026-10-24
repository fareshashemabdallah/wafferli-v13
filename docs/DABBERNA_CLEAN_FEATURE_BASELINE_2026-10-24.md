# Dabberna clean-feature baseline — 24 October 2026

## Current approved application
- Today: relevant next action, recorded dates, Money overview, actual expense recording, Ask.
- Money: income, categories, classifications, cash-flow, due payments, confirmed transactions.
- Family: family profiles, calendar, occasions, linked plans and tasks.
- Ask: grounded local financial/family guidance; optional securely activated AI only.
- About & Privacy: accurate capability disclosures and browser-local backup/export.
- Household and Settings: data protection and authorized household setup.

## Retired entirely as active user experiences
Shopping & Wishlist, Find Products, Shopping Basket, Outings & Places, service and retailer discovery, and Family & Friends Circles. Their source route implementations, registered routes, menu links, and unused UI/module helpers are removed. Legacy direct links to removed paths route back to Family via the GitHub Pages fallback. No public booking or payment is executed.

## Data protection and remaining compatibility
No existing browser-local Money, profile, Family Plan, Calendar, Task, bill, confirmed gift-payment or expense records are deleted. Some historical shopping, wishlist, service, private quote and poll data formats remain accessible to backup/restore validators even though no corresponding active feature page exists. That archival compatibility is intentional—not a hidden replacement interface. Do not silently purge these saved keys merely to reduce source-file counts.

## Future feature development rule
1. One authoritative record per family fact. Link to member, occasion, plan and payment IDs.
2. A wishlist idea or comparison cannot become an expense unless a parent confirms an actual payment.
3. All new development should be built in separate reviewed branches, with no hidden alternate production menus or prototypes.
4. Never imply verified seller prices, bookings, merchant trust, availability, or bank-verified balances without an authorized source.
5. Preserve bilingual usability, optional entry, backup/restore and transactional idempotency.
6. Any later archival-key migration requires explicit safety review and opt-in export before deletion.

## Validation
Require frozen dependency install, TypeScript, full tests, source inventory, compiled SPA, retired-route regression test and successful GitHub Pages deployment. Documentation about previous prototypes is historical reference, not active application code.
