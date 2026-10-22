# Dabberna — one source of truth for every family fact

**Architecture contract.** Enforced for family birthdays, calendar occasions, linked preparation plans and their recorded payments. A broader legacy-module audit is still required; do not represent this milestone as multi-device synchronization.

## Canonical owners

| Family fact | Owner and stable identity | Other features must derive |
|---|---|---|
| Person, birthday, optional age | members, Member.id | Calendar birthday, occasion ideas, activities, linked plan title/date |
| Other occasion and school event | familyCalendar, FamilyMoment.id | Calendar, linked occasion plan, Home |
| Chosen gift, celebration costs, due dates, preparation state | familyPlans, FamilyPlan.id and sourceRef | Gift comparison, commitments and forecast |
| Actual paid transaction | money.expenses, Expense.id, sourcePlanId and sourceOccasionCost | Money dashboard, expense history, payment status |
| Independent shopping wishlist | familyWishlist, WishlistItem.id | Shopping; never another copy of an occasion cost |

The occasion reference is occasion:<moment-id>@<occurrence-year>. It survives a correction to birthday name or month/day. Plan title and event date are **read-only views** through canonicalFamilyFacts.ts. Do not use matching display titles as foreign keys or persist projected copies back to plans.

## Nonduplication rules

1. A gift idea creates no bill or paid expense.
2. A planned occasion cost belongs to exactly one Family Plan, and the cash-flow projection derives its expected obligation without adding a second Money bill.
3. A confirmed gift payment is recorded through recordConfirmedExpense using the plan/cost identity. Repeated confirmation must not append another payment.
4. Changes to the source person's name/date recompute Calendar, linked Plans, Home and financial presentation.
5. A gift due date can be a parent-confirmed obligation independent of the occasion date. If an occasion moves, **warn**, never silently reschedule it.
6. Deleting a family date does not delete genuine expense history or imply refunds. A saved plan without a source should be flagged for review.
7. Legacy records may remain for backwards compatibility, but should not become an alternative editable owner.

## Development gate

Before adding a feature: identify the canonical owner, link by stable ID, derive all other views, and verify changes propagate. End-to-end tests must cover corrections, deletion, duplicate taps, and financial effects without repeated input or double counting.

## Remaining migrations

General manual Plans, unrelated gift wishlists, family group outings, legacy financial signal panels, and multi-device sync require additional audits. Current browser-local information is not bank-verified, automatically shared among devices, or cloud synchronized.
