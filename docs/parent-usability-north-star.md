# Dabberna product north star: very high value AND very high ease

**Adopted target: 16 October 2026.** These are release objectives, **not** scores already achieved.

## Measurable experience targets

| Metric | Acceptance target | How to verify |
| --- | --- | --- |
| Perceived everyday usefulness | >=9.5/10 mean target (9.0/10 minimum gate), with >=80% of trial parents scoring >=9 | End-of-session question: "How useful would this be in managing your family life?" |
| Ease of use | >=9.5/10 mean target (9.0/10 minimum gate), with >=80% scoring >=9 | End-of-session question: "How easy was it to achieve what you needed?" |
| First useful result | <=2 minutes for >=80% of first-time parents | Start from clean device; obtain meaningful budget or family/date overview with no real personal data needed |
| Independent core-journey completion | >=95% across the five task journeys | Observe completion unassisted; distinguish task failure from unavailable external backend |
| Critical reliability incidents | ZERO duplicate expense records, silent failures or accidental demo-to-real transfers | Automated tests plus manual double-tap, reload, full-storage and recovery cases |
| Repeated information entry | ZERO repeat requests for information already saved in the same local profile, unless privacy/consent requires reconfirmation | Scripted parent journeys |
| Advice comprehension | >=90% of parents can correctly explain the advice, source and what it does **not** verify | Ask parent to explain in their own words |
| Arabic mobile usability | All five tasks pass on Android Chrome and iOS Safari in Arabic RTL; no clipped actions | Real-device tests, keyboard/screen-reader audit separately |

**Pilot sample:** At least 12 actual parents, including 6 primarily Arabic-speaking users, varying ages and technical confidence; recruit more if results are inconclusive. Record completion rate, time, hesitations, unclear terms, repeat taps and user-suggested fixes. Do NOT declare 9/10 from CI tests or estimated review scores.

## The five first-time parent journeys

1. **Two-minute household picture:** enter three meaningful monthly figures; read an accurate budget overview without treating budgets as bank cash.
2. **Add one expense:** record a real purchase once; double-tap/reload must never count it twice; a blocked save must be clearly visible.
3. **Plan a children's outing:** choose children attending, age needs, budget and area; arrive at one option with transparent source/availability limitations.
4. **Prepare for an occasion:** add one birthday, see it in the calendar, choose a gift/budget, and see one next action without re-entering the date.
5. **Ask for help:** ask a typical parent question, see a grounded answer when supported, and see a candid explanation instead of a fake AI answer when unsupported.

## Product design decisions

- **One unified Today briefing:** first a genuine family financial/occasion status and one primary next action, then optional details. Deduplicate simultaneous attention, decision, and upcoming-event summaries.
- **One family decision path:** Plan, Wishlist, Occasion, Basket and Advisor must reuse records rather than create parallel versions of the same purchase or event.
- **Progressive disclosure:** keep exact finance forecasts, merchant quote/RFQ, deep price evidence and provider-detail forms in clearly named optional sections.
- **Strong defaults, never misleading defaults:** a new user sees no fictional shopping basket counted as real; sample Money is unmistakably demo and cannot accept real purchases.
- **Safety before delight:** real amounts and child data must not silently upload, sync, or be sent to AI. No claim of verified prices, safe-to-spend bank cash, provider availability or operational live AI until authenticated integrations pass staging.
- **Bilingual everyday language:** prefer "What is due?" over professional finance jargon. Keep Arabic RTL native and readable.
- **Honest save state:** a successful label appears only from committed data, and storage failures show an actionable app-wide warning.

## Priority implementation sequence

**P0 / Now (code-only):** remove duplicate recording paths, surface failed device saves, link onboarding straight to requested editors, eliminate mistaken sample-to-real finance transitions.

**P1 / Next (code-only):** consolidate redundant home panels into one prioritized briefing; add one-tap expense entry; simplify SmartBuy to a light comparison with advanced options hidden; reuse stored city for weather; streamline calendar/occasion/plan transitions; extend scripted integration tests.

**P2 / External enablement:** operational signed-in live AI via private Edge credentials and real auth/quota/privacy tests; verify current retailer/service information from contracted or licensed sources; safely enable adult household sharing with independently tested RLS.

**P3 / Launch:** production-grade device testing, security/privacy review, verified merchant onboarding, licensed PSP direct-to-merchant settlement and auditable commission handling, support and parent onboarding.

## Release gate

No declaration of "very high usefulness and ease" until both >=9.0/10 minimum gates are measured with real parents; continue iterating toward the 9.5/10 targets, all P0 reliability failures are resolved, and the relevant live feature gates are independently checked. A merged GitHub PR is code shipped, not market validation.
