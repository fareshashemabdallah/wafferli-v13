# Dabberna: Remove dead-weight consumer features (16 October 2026)

## Decision rule

Retain a consumer feature only when it does at least one of: (1) uses saved household context to deliver a useful answer, (2) helps the family decide or manage an agreed plan with minimal work, (3) supports honest records of important commitments, or (4) gives necessary privacy and recovery control.

"Built" is not sufficient reason for a feature to remain. Hide or delete misleading prototypes that merely ask parents to enter extra forms, pretend to research sellers, or duplicate existing calculations.

## Removed from production consumer surfaces

| Feature | Change | Reason |
|---|---|---|
| Commercial membership/market-readiness matrix | Deleted `CommercialReadinessPreview` component and removed from About | Market-launch and Plus business ideas are not a working parent service; billing remains unavailable |
| Fictional merchant approval/offer demo | Deleted UI, pure demo engine, simulator test and doc; removed from About | Never authorized merchant accounts or real offers; in-memory role simulation is distracting and misleading |
| Merchant RFQ drafts and manually managed offer archives | Deleted two standalone UI components, plus their large section in SmartBuy | Doubles work for parents; no merchant actually receives the request or returns offers |
| Preview-only product/receipt photo upload | Removed from SmartBuy | Photos were not processed or saved as useful decisions; AI extraction was never connected |
| Duplicate standalone amount-based affordability tool | Removed secondary calculator from Ask Dabberna | Amount-based guided check remains available in the main family advisor |
| Inactive live-AI promotion | Only render live-AI panel when its real UI activation flag is on | Don't present unavailable capabilities as day-to-day choices |
| Standalone social circles and community review sign-up | Removed from Explore, Advisor, Services and Occasions entry points | Social administration and unverified community content distract from sourced, actionable support |
| Second elaborate Discover portal | Replaced with simple Ask/Outing/Product outcomes and optional existing lists/services | Parents shouldn't have to select tools before receiving an answer |
| Manual price comparison as the default buying action | Shopping prompts, plans and gifts now point to seller discovery; manual comparison remains accessible as optional fallback | Comparison needs actual market offers. User-entered prices are not real live seller feeds |

## Kept and protected

- Money, **fixed/variable/periodic** expenses, bill schedules, financial safeguards and savings, including actual expense history
- Family setup/preferences, important family dates and calendar
- Approved family plans and their status, reminders on app open and check-ins
- Shopping basket, occasional gifts, wishlist and optional basic manual price comparison (if the parent has prices)
- Product/venue discovery, transparently stating what is external and unverified
- Privacy/data backup, recovery and local vault controls
- Secure backend-gated live AI and household account infrastructure without suggesting those features are publicly available

## Data and migration contract

- No localStorage key has been deleted, renamed or overwritten as part of this cleanup.
- Existing quote/request drafts stored under `PRIVATE_QUOTES_KEY` are not automatically erased. They are no longer editable through the consumer interface; users may retain/export existing local data using Privacy & Data Controls.
- Community pages and the existing backend storage remain technically accessible through old direct URLs, but they are no longer promoted as regular family features. **No cloud records, conversations, reviews or accounts were deleted.**
- No changes to financial records, savings, prices, payments, children, bank connections, reservations or permissions.

## Future reintroduction gates

Do not re-add merchant/social/review workflows merely because code can be written. Require **verified merchant/API integration, a clear parent-facing result, moderation and privacy safeguards if social data is involved, and parent usability evidence** first.

Parent acceptance: after one request a user sees a grounded outcome or a clear specific blocker, without being pushed into new forms. Financial details must remain available; hidden information is not simplification.
