# Merchant onboarding and offer-review simulator — development only

**Status:** developer-only simulation. This is not merchant self-service, verified onboarding, actual marketplace inventory, seller approval or payment/commission integration.

## Locally test the fictional workflow

Run Vite in development with the optional `VITE_ENABLE_MERCHANT_WORKFLOW_DEMO=true` flag (configured **only** in your private local development environment). Open **About this pilot**. The simulator is hidden whenever the application is built for production, regardless of flag.

The developer can switch between **fictional merchant** and **fictional reviewer** actors. Those are two buttons, **not roles backed by authentication**. Create a fictional Jordanian merchant, submit it for review, simulate a reviewer approving it, create an offer with a full JOD/fils price and expiry, submit it, then simulate returning, approving or rejecting it.

No data leaves React component memory; refreshing or closing the browser resets the demonstration. The simulator cannot receive real merchant submissions, present an offer to parents, complete checkout, create a payment or commission record or access the family finance ledger.

## Security and commercial blockers

Before real onboarding, Dabberna needs:

- Server-side merchant registration and verification (company identity, licences, tax applicability, beneficial owner where required), secured document storage and data retention policy.
- Authenticated merchant roles with row-level access, segregated moderation roles, server-only approval transitions, immutable audit events and tamper resistance. **Client-side actor labels cannot be trusted.**
- A documented offer schema: goods/service specification, stock or capacity, tax/delivery included, cancellation/refund terms, expiry, proof of merchant origin, geographic coverage, consumer disclosures and provider-side reference.
- Server-controlled offer publication only after moderation, with abuse/fraud rate limits and clear quote acceptance contract.
- Licensed and suitable payment provider agreement. Merchant-originated hosted checkout and platform-fee distribution, where legally/technically supported; **Dabberna must not custody or manually redistribute merchant funds**.
- Country-specific commercial registration, privacy, data protection, tax and consumer protection legal review.
- Real staging with independent merchant and moderator accounts and authorization-abuse tests before removing any test gates.

## Contract with current consumer features

Parents' private quotation drafts and manually recorded prices remain **consumer-supplied local records**. The simulator deliberately has no connection to them and must not turn those entries into fake verified bids. Any future live marketplace needs explicit parent consent, server-origin verified offer identifiers and separate API-bound workflow.

Automated unit tests cover the fictional state machine; they are **not evidence of live authentication or security**.
