# Dabberna — one continuous family rhythm
**Page-by-page product and action audit — 19 October 2026**

## The promise
Money is the resource Dabberna cares for; the family life it supports is the purpose.
Dabberna has **one flow**: **Feel/Understand → Anticipate → Decide → Act → Learn**.
The parent sees one meaningful next action, not a checklist of unrelated tools.

**No invented data:** Demo finance is never household finance. Estimated spending is not cash, a plan is not a payment, mapped places are not verified providers, and a shared invitation is not permission to disclose child or finance information.

**One source of truth:** `money` holds financial records; `familyCalendar` holds authored dates; `familyPlans` holds plans and selected options; profile birthdays derive from real family members; calendar projection of planned activities is read-only. Persistent backups validate these records. Cross-page handoff may store a **plan ID** or a **consumable date**, never a duplicate bill or child profile.

## Global navigation and UX
| Main destination | Parent's need | What Dabberna must say | One main next action | Key rule |
|---|---|---|---|---|
| Today `/` | Know how the family stands | “Your family money story; something is coming; here is one useful next step” | Open the **exact** relevant record | No simultaneous competing updates or financial scores |
| Understand `/money` | Correct the financial facts | “These are your entered numbers; a plan, an expense and a bill differ” | Record actual expense, edit one category, or review a dated bill | One canonical money ledger |
| Decide `/advisor` | Find a realistic way forward | “Here are alternative approaches, uncertainties and protected priorities” | Save ONE chosen idea into Family Plans | Guided advisor and consented AI are alternate modes, not stacked assistants |
| Plans & Life `/family` | Put the choice into real family life | “Your dates, plans and responsibilities are together” | Open the selected saved plan or prepare a dated event | Existing plans must focus the exact item |

## Detailed route audit
| Route / workspace | Why a parent opens it | Message or click rule | Actual underlying destination / record | Status after this pass |
|---|---|---|---|---|
| Home `/` | Find what matters today | Single private weekly story, three optional family paths; no parallel financial update | Underlying `money`, `familyPlans`, `familyCalendar` | **Improved**: upcoming cards open source item |
| Money `/money` | Confirm income, costs, paid spending and bills | Entered amounts vs scheduled bills vs paid expenses stated clearly; no repeated adventure hero | `money` | **Improved**: repeat money hero removed; deep category complexity remains |
| Decision `/advisor` | Compare, ask or investigate | ONE decision method; local guidance does not impersonate live AI | `familyPlans` only on explicit approval | **Working**; plan-entry context and question routing can improve |
| Family Life `/family` | Review family commitments | Saved plan title must be actionable, not inert text | The selected plan ID in `familyPlans` | **Improved**: exact plan selected |
| Calendar `/calendar` | See an upcoming dated event | Calendar opens the requested date, not today's default; derived plan cannot be re-authored as a new event | `familyCalendar` for entered events; `familyPlans` projections | **Improved**: one-use date focus, selected plan focus |
| Plans `/plans` | Continue a chosen action | Stop repeating upstream upcoming-alert cards; provide one real plan check-in | `familyPlans` | **Improved**: duplicate upstream preview removed |
| Occasions `/occasions` | Prepare gift, celebration, occasion | One event, optional estimated cost and preparation; never create paid expense until confirmed | `familyCalendar` and linked `familyPlans` | Existing link works; further form reduction is a follow-up |
| Family profile `/space` | Teach Dabberna about the household | Explain optional fields, how age and birthday affect guidance, and why privacy matters | `members`, preferences, calendar | **Needs targeted UX consolidation:** separate important-date editor mirrors Calendar |
| Explore `/explore/` | Start a real outcome | Discover an activity or product; don't require finances | Direct specialist tools | Existing gateway, optional to fold into contextual Home |
| Activities `/explore/weekend` | Find something suitable for all children | Age ranges are editorial, map listings unverified; a choice may update an existing plan | `familyPlans` | **Improved**: explicit reuse of outing plan, no duplicate |
| Product discovery `/explore/market` | Compare actual sellers | Live prices only if verified feed exists; otherwise seller searches have unknown prices | Seller URLs / optional shopping plan | **Needs:** carry selected seller as candidate to existing plan |
| Compare `/explore/smartbuy` | Evaluate purchases | Compare true total and source provenance, not only cheapest label | Current active `familyPlans` choice | Existing integration, but detailed forms are heavy |
| Basket `/explore/shopping` | Prepare groceries and record what happened | Basket ≠ paid expense; ask before posting actual cost | Basket entries and `money.expenses` | Existing confirmation, no automatic double recording |
| Services `/explore/services` | Find trustworthy service | Search results are third-party source leads, not endorsement | Shortlist | Further provider verification needed |
| Restaurants `/explore/restaurants` | Discover venues for an outing | No invented ratings or availability; transfer to parent-approved outing | Existing selection/handoff | Maps API configuration is a complexity to revisit |
| Together `/explore/together` | Invite or poll friends | Share only authorized options and neutral amounts, never private income | Saved outing/group poll | Existing group functionality; security audit needed |
| Vote `/vote/$token` | Vote on invited options | Show exact options, anonymous or stated voting policy, and outcome | Group poll | Needs separate usability + privacy test |
| Poll owner `/together/$adminToken` | Manage invitation/results | Only owner changes, no implicit payment or booking | Poll and admin token | Permission and security review pending |
| Community `/community` | Share with trusted people | Invite only, financial details excluded; require sign-in | Authenticated circles | Security depends on Supabase/backend configuration |
| Experiences `/experience` | Read parent opinions | Reviews are individual experiences, not verified clinical or safety advice | Community review records | Verification and moderation separate |
| Household `/household` | Manage collaboration permissions | Explain before enabling any sync; not currently a general shared-account guarantee | Auth state | Remains gated, do not turn on without access-control tests |
| About `/about` | Understand trust/privacy | Real data handling, no promises of unavailable sync/market prices/AI | Local backup/privacy controls | Existing; periodically audit accuracy |

## Every-click acceptance rubric
Before keeping a prominent control, ask:
1. **What question was the parent answering?** One outcome, in family language.
2. **What can Dabberna actually know?** From saved records or a verified external source; otherwise state uncertainty.
3. **What happens on click?** Open the *specific* item, compare a concrete option, or save a single clearly labeled record.
4. **What will not happen?** No hidden expenses, bookings, cash debits, data sharing, or speculative financial assurances.
5. **What is the way back?** Parent can review/change the same plan or date, without starting over.
6. **Is this a second control doing the same thing?** If yes, remove or move it into optional detail.
7. **Does Arabic communicate the same limitation and benefit?** Not English-only reassurance.

## Verified handoff examples
- Weekly story → saved upcoming plan → `ACTIVE_PLAN_KEY` → **that plan**, not another card.
- Weekly story → calendar milestone → one-use date hint → **that day**, not today by default.
- Calendar projected plan → canonical `familyPlans` item → same plan and costs.
- Family Life → click plan title → selected plan editor without a duplicate plan.
- Existing outing → activity discovery → explicitly “Continue existing plan” → attach an unverified venue without duplicating a plan. Preserve occasion source linkage and actual expense records.
- New outing → Save → existing `familyPlans` record; calendar is a read-only projection if dated.
- Plans → Money: actual expense recorded only after parent approval, never from a tentative estimated cost.

## Areas intentionally unfinished
**Not** a full release readiness certification. Older deep forms still need a click-by-click UX pass, especially in Money, Family Profile, occasion preparation, shopping comparisons, restaurants, group polls and sharing. Real provider feeds, real-time reservations, backend multi-parent authorization and connected AI are separate integrations and cannot be invented by a visual redesign.

## Suggested real-parent validation
For a high-income, an average-income, a lower-income and a privacy-sensitive family, try the same three tasks: (a) prepare school fees and an activity, (b) plan a birthday and compare a gift, and (c) arrange an outing with friends. Record number of taps to a verified choice, duplicate-entry attempts, whether private financial details are ever exposed, and whether the family finds one concrete next action. An attractive screen without completed end-to-end tasks does **not** pass.
