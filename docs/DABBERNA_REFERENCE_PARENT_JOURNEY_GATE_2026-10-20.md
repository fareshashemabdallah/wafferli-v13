# Dabberna — reference parent journey: birthday to gift (20 October 2026)

## Purpose
Validate a **complete family task**, not isolated features, before any public launch claim. This reference journey should be completed as a parent who has little time and might share the device. It should not assume that the parent has entered a detailed budget.

## One-parent scenario (English and Arabic)
1. Create/edit a child's birthday in Family, or select the existing calendar date.
2. Prepare the occasion: specify a gift such as "Science kit," a planned amount, a needed-by date and optionally a celebration amount.
3. Save it **once** to the canonical Family Plan and open shopping from the same gift.
4. Expect the gift name and planned ceiling in the comparison without retyping. A generic shopping mascot/wishlist must not obstruct the current task.
5. If another product comparison exists, expect its name and quotes to remain. Dabberna must request parent confirmation before replacing that comparison.
6. For price research: seller quotes must be parent-entered or sourced from an authorized source. No claim of comprehensive live market prices or verified availability.
7. Choose one entered seller quote. It must attach to the **existing gift component** of the original occasion plan, not create another Family Plan, wishlist row, bill or paid expense.
8. Confirm a real payment for the gift (possibly different from the selected quote). Money now displays that paid amount **once**; the corresponding estimated gift commitment disappears from pending cash-flow forecasts while unrelated celebration and extras remain.
9. Reopen shopping and retry the same payment. A repeat payment is blocked.
10. Edit the gift description and verify stale seller choices do not silently follow a different product.

## Non-negotiable integrity and privacy checks
- No mutation or deletion of legacy occasion records.
- No purchase recorded merely because a quote is selected or a wishlist checkbox is ticked.
- No manual cash balance deduction unless explicitly confirmed separately.
- Every expense defaults to private, even if linked to a celebration.
- Demo income and example spending must never justify affordability or be turned into an actual expense.
- When a parent has no budget categories, a real payment can be saved as uncategorized with clear partial-information status.
- Price comparison must not send child, birthday, household, financial or private budget data to retailers.
- Backup/restore must preserve occasion cost breakdown, seller choice and paid expense source reference without dropping unrecognized valid historical records.

## Manual parent usability release gates — not yet certified
- Independently complete the English and Arabic flows on a narrow mobile viewport and real iOS/Android devices.
- Five distinct parents should repeat the journey with different existing-state combinations (empty, demo, real/partial, old comparison, paid gift). This is an initial internal gate, not a substitute for a diverse closed beta.
- No repeated entry of an already-saved gift name; no more than one intentional confirmation of replacing old comparison research.
- No confusing routing dead ends; clear return to the occasion and Money.
- No duplicate ledger row and no missing forecast reconciliation after reload and backup restore.
- Pass a keyboard/screen-reader focus audit for newly exposed collapsible sections, RTL, error and confirmation states.

## Current engineering scope
The new SmartBuy handoff is implemented locally. This is not a live merchant integration, bank connection, verified price service, social sharing or a public-launch certification. Remaining future work includes verified seller sources, broader family tasks, cross-device adult-account sync under secure RLS, real-device usability and accessibility certification.
