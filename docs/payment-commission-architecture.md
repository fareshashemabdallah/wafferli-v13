# Dabberna — noncustodial merchant payments and commissions

**Status: future integration architecture, not a live payment service.** The current static React pilot has no licensed PSP integration, merchant payment gateway, settlement database, provider webhooks, or automated refunds.

## Non-negotiable financial boundary

Dabberna is an offer/request discovery and referral-commission platform, **not** the custodian of customer or merchant funds. An accepting customer pays using a **merchant-originated payment flow hosted/processed by an appropriately licensed payment provider**. The merchant, subject to legal and provider approval, remains merchant of record. The provider — not Dabberna — processes and settles merchant revenue.

Where the provider supports merchant-originated direct charges with native platform/application fee settlement, the provider should separately settle Dabberna's agreed commission. **Do not assume every product advertised as "split payment" is noncustodial.** Certain platform-charge and subsequent-transfer models charge the customer on the platform account, require the platform to arrange merchant payouts and may expose it to refund/chargeback liabilities. Those models are disallowed here.

If no provider supports this noncustodial provider-managed fee model, do not simulate it by collecting all proceeds. A separately invoiced merchant referral fee may be considered only as an explicitly approved commercial alternative.

## Illustration (JOD 500 / 3%)

| Item | JOD | Fils |
| --- | ---: | ---: |
| Customer gross charge | 500.000 | 500,000 |
| Dabberna agreed commission (300 basis points) | 15.000 | 15,000 |
| Merchant agreed entitlement (before deductions) | 485.000 | 485,000 |

These are contractual allocations before payment-provider fees, taxes, refunds, chargebacks and settlement adjustments. They are **not** necessarily the actual net bank deposits or platform profit. Keep actual provider settlement evidence separately.

JOD has **three currency minor digits**. The policy implementation in app/src/lib/merchantPaymentPolicy.ts uses integer fils and exact integer/BigInt arithmetic with half-up commission rounding to the nearest fils. The future provider adapter must verify its own API-specific currency and minor-unit rules.

## Authoritative server-side transaction flow

1. **Merchant onboarding:** verify merchant identity, contract, category, provider merchant account reference, applicable agreement and approved commission rules.
2. **Accepted offer/request:** backend verifies offer/reference, authorized merchant, customer-approved gross total and currency. Determine the commission from approved server-side rules, not client-supplied percentage.
3. **Immutable quote snapshot:** record merchant ID, offer/request ID, internal transaction reference, gross fils, currency, selected agreement ID, effective basis points, platform commission and merchant entitlement.
4. **Hosted merchant payment:** authenticated backend requests a provider-hosted merchant checkout with provider-managed platform fee where supported. Customer completes payment on the merchant/provider payment flow. Dabberna never stores card data or transfers merchant balances.
5. **Payment confirmation:** authenticated/signed provider webhook or trusted server-to-server query confirms provider transaction reference, merchant account, amount, currency, outcome and timestamp. A browser redirect or screenshot is **never** confirmation.
6. **Idempotent payment reconciliation:** store each verified provider event once (unique provider+event ID). Re-query authoritative provider state for out-of-order, conflicting or duplicate events. Record paid/failed/cancelled states only from trusted evidence.
7. **Separate commission settlement reconciliation:** ingest provider settlement/payout statement and distinguish payment completed from commission actually credited to Dabberna. Record platform amount settled, processing fees, actual merchant payout if made available and discrepancy status. No unverified "mark paid" control.
8. **Refunds, cancellations and disputes:** provider handles the money movement. Record each adjustment and provider-confirmed commission/merchant reversal; do **not** assume all provider contracts prorate commissions or fees the same way.

## Commission agreement precedence

1. Merchant + category-specific rate.
2. Merchant-wide rate.
3. Category-wide rate.

A missing, invalid, or overlapping highest-priority rule must block checkout. Agreements have validity dates and audited approval; historic transaction snapshots never change when a contract rate changes. Rates are stored as integer basis points: 300 basis points = 3%.

## Required records and statuses

The proposed future PostgreSQL schema is in docs/payment-commission-schema.sql. **It is not applied to any production database.**

- Agreement: merchant, category, agreement reference, approved rate, effective dates and audit.
- Transaction: merchant, offer/request reference, internal + PSP transaction references, gross amount, applicable rate, platform commission, merchant entitlement, currency, provider and merchant account references, payment status, commission settlement status, refund/cancellation status, amounts settled/refunded/reversed and timestamps.
- Verified provider events: immutable event reference, authenticated receipt time, provider event type, transaction link, payload hash. Restrict event storage to authenticated backend code.
- Provider adjustments: refunds, cancellations, chargebacks and reversals, amounts, fee reversals and provider references.
- Reconciliation: provider settlement references, credited commission, fees and exceptions.

Never store raw card data, customer banking credentials or unnecessary personal data.

## Prelaunch control gates

- Provider suitability, licensed/authorized status and supported merchant-originated platform fee model verified in signed terms for Jordan (and every expansion market).
- Legal review of merchant-of-record, custody, settlement control, refunds, taxes, AML/KYC and payment-services permissions under current Central Bank of Jordan regulations.
- Authenticated API + separate protected database + provider webhook signature validation + replay prevention + least-privilege secrets.
- Merchant onboarding, approved agreements and immutable rate snapshots, idempotency, audited access, reconciliation reports and exception queue.
- End-to-end provider sandbox tests: success, failed/cancelled, delayed settlement, duplicate events, partial/full refunds, disputes, changed merchant agreements and rounding in fils.
- Clear consumer consent and refund responsibilities, along with distinct provider fee allocation rules.

Regulatory reference: https://www.cbj.gov.jo/En/List/Guidelines_and_Frameworks
Regulated participants reference: https://cbj.gov.jo/En/List/Participants_in_Payments_and_Settlements_Systems

## Current implementation boundary

The app/src/lib/merchantPaymentPolicy.ts module contains **commission rules, exact amounts and a server-record contract only**, with unit tests. It neither charges customers nor enables payments. The future backend must enforce all payment security and audit rules; the static browser application must not contain provider secrets or assert financial settlement based on local status.