# Focused Today — returning-parent first screen (17 October 2026)

## Product decision
Dabberna's first page is an **action-and-reassurance home**, not a miniature copy of the six application sections. Preserve the family-focused illustration and existing capabilities, but stop repeating the app's navigation, six content dashboards, charts and generic outing promotion on Today.

## What the normal Today route now shows

1. Quiet date, time-of-day greeting and small family/heart visual.
2. Three immediate actions (same data stores): **Add expense** with guarded actual-expense recording; **Add item** directly into the real family basket without invented price; **Ask Dabberna** by expanding a single inline question, using the existing local advisor with cited local data sources.
3. **One** permission-respecting family attention item when grounded signals exist; no extra list of suggestions, no calendar reminder export panel, no second weekend suggestion.
4. Small financial reassurance: only **recorded monthly expense total** and upcoming bill-instance count based on entered schedules; no representation of a cash balance or confirmation by bank/merchant. If finances are still demo, no sample amounts appear.
5. One next upcoming *saved* family plan or event (if one exists); otherwise omit the section rather than fabricating an event.
6. Optional tiny live clothing/weather tip only if the parent opted in, configured a supported city and a real Open-Meteo response arrived. Loading, permission-off and error states do not create a distracting home card.

## First-time vs returning parent

A new parent without genuine family records sees the approved family-cartoon illustration as a single compact welcome panel with one **Start my day** button, above functional quick actions. After dismissal, this intro remains hidden in local storage. Existing households with real budgets, profile records, plans, tasks, occasions, wishlist or non-demo basket entries do not receive a repeat onboarding hero.

## Retained

- Other six pages, user-defined category details, budgeting, household members, plans, calendar reminders, shopping lists and original illustrated homepage component remain in code.
- Existing saved data keys and local storage sync remain untouched; only a new welcome flag is introduced.
- Public landing illustration preview at `?preview=landing` stays opt-in.
- No live AI integration, auto-purchase, verified bank balances or external account sync are implied by the UI.
- Prior demo-driven and full-page legacy tests still protect the older component; new focused-route UX tests protect the deployed experience.

## Follow-up QA

After successful CI and deployment, test with a **fresh browser profile** (welcome), an **existing family profile** (no welcome), a small iPhone in English and Arabic, and recorded spending plus a future birthday. Verify that quick actions work within seconds and that the single priority, finance and calendar summary remain uncluttered.

If some users strongly prefer a detailed dashboard, consider a user-controlled expansion later, but do not add another row of global links or duplicate homepage cards without observed need.
