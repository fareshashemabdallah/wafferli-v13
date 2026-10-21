# Dabberna — Clean-slate family experience architecture
**Decision date:** 21 October 2026
**Status:** approved design direction to implement in a dedicated branch; **this document by itself does not modify the live user interface**.

## Non-negotiable rules
1. **One category, one canonical destination.** Parents never choose between two pages that solve the same need.
2. **One family decision, one record.** An outing, gift or shopping decision flows through discovery → evaluation → plan → payment/actual → feedback without re-entry or duplicate ledger entries.
3. **One primary action per screen.** Start with a useful result, not a setup form, directory of tools, or links to six secondary pages.
4. **Progressive disclosure.** Maximum three visible content groups in the initial page state; details, circle management, advanced filters and safety explanations appear only when relevant and requested.
5. **Ask less, remember once.** Prefer saved, consented preferences and profile information. Ask for only the missing field required for the next decision; always allow skipping optional household information.
6. **Trust over promotion.** Genuine parent experiences are source-labeled; commercial results cannot masquerade as recommendations. Negative, neutral and positive experiences are equally allowed.
7. **Preserve records and privacy.** No deletion of browser-local money, expense, gift, calendar, plan, wishlist or historical community data during routing cleanup. Shared circles never inherit access to private household finance or child profiles.
8. **Do not imply live verification.** External listings, prices, booking capacity, age eligibility and parent experiences are labeled by provenance and verification status. An empty parent recommendation list is reported honestly.
9. **Bilingual parity and mobile-first.** Arabic RTL and English follow the same action hierarchy; no decorative forms or duplicated navigation menus.

## Five canonical consumer destinations
| Destination | Parent's question | Default display | Primary action | Never show by default |
|---|---|---|---|---|
| Today (`/`) | What needs my attention? | One next best action plus one useful family insight | Continue the relevant decision | Generic tool gallery, duplicate money forms |
| Money (`/money`) | Where do we stand? | Financial reality, upcoming commitment, one update action | Confirm one financial fact | Lifestyle discovery forms, duplicate purchase records |
| Family (`/family`) | What's happening in our family? | Upcoming occasion or plan, date, next action | Continue one family plan | Separate outing votes, duplicate calendar/occasion pages |
| Discover (`/explore`) | Where should we go or what is worth experiencing? | Contextual family options ranked by fit and trustworthy evidence | Evaluate or choose an option | Google links as the principal answer, circle-management dashboard |
| Shopping (canonical route to be set during implementation) | What should we buy? | Current shopping need, evidence-backed alternatives, saved wishlist | Compare and choose | Separate product search/basket/quote/checkout portals |

**Ask Dabberna is a persistent contextual capability, not a sixth primary destination or a requirement to chat first.** Settings/privacy can be reached from profile controls, not a sixth category.

## Progressive layout contracts
**Today:** one sentence explaining today's most valuable action; one main button; optional subdued context. No carousel of duplicate actions.

**Money:** (1) reality summary, (2) upcoming obligations, (3) one fact to add/correct. Advanced categories, annual amounts and projections expand in place without requiring another page.

**Family:** (1) upcoming date or existing commitment, (2) one active plan with status, (3) contextual next step (gift, outing, invite, payment or task). There is ONE plan ID behind calendar/occasion/vote; adding a gift cannot create a second expense.

**Discover:** begin with a plain request such as "Where can we go Saturday with our children?" Optionally choose category (outings, restaurants, activities, services). One coherent results list displays parent experiences, suitable ages, estimated total-family cost, distance and freshness where known. On selecting a result, reveal its detail and actions **within the same Discover page**: evaluate → choose → add to existing/new family plan → optionally invite/vote. Circle feedback is context, not a separate search page.

**Shopping:** one search-to-purchase flow across wishlist, product discovery, comparisons and recording. A gift opened from Family retains occasion plan ID and budget. A paid expense is written once to Money. Purchase recommendations use the same trust model as Discover, but do not turn Shopping into a social feed.

## Circle and recommendation model
- Invite/accept/revoke circle membership through a compact contextual panel. No default global group chat feed.
- A parent may share a firsthand experience explicitly to: private only / selected circle(s) / anonymized community. Default to private and never infer consent.
- Source confidence must be visible: known parent; self-reported firsthand parent; secondhand account; external mapped listing; sponsored offer.
- Capture 10–15 second feedback after an outing/purchase: enjoyed? worth the cost? one optional note. Positive feedback is never required.
- A recommendation is **suitability** guidance, not guaranteed safety or "best" venue: connect age, interests, practical accessibility, budget and the parent's optional preferences, with explanations.
- Avoid making follower counts, scores or compensated positive reviews the goal. Attribute experiences, disclose incentives, allow reporting, moderation and author deletion.
- A small circle is useful before network scale, and invitation links should have proper authenticated scoped access.

## External source strategy
- Geolocation/directions (Google Maps/OpenStreetMap/authorized providers) remain supporting infrastructure and attributed sources, not primary destinations.
- Display actual permissible listing results in Dabberna when licensing and technical integration allow. When not, use clearly labeled external fallback; never present generic Google search as a personalized recommendation.
- Do not copy third-party reviews or map content into our owned unrestricted store contrary to provider terms.
- No invented price, distance, opening time, booking slot, child suitability or verified review. Show "not known" where evidence is missing.
- Keep parent-contributed information and commercial sponsorship in independent, appropriately permissioned data models.

## Canonical data relationships
One **family decision** links an intent and choices to at most one active family plan. The same plan appears in Family, Money (as a commitment), Today (as a next action), Discover or Shopping (as a candidate), without copying amounts.
- `item`: stable internal ID + external source IDs/provenance; category and locale.
- `experience`: item ID + author/circle consent + firsthand/secondhand declaration + date + evidence/disclosure + feedback; never holds children's names or family finance.
- `decision`: household-owned choice with item, status and linked plan ID; private by default.
- `plan`: one source of truth for date, participants/preferences, tentative/confirmed amount and status.
- `expense`: actual confirmed payment, independent of projected commitment, idempotently linked to plan ID.
- `circle`: membership/invitation and author-approved access, isolated from household membership and private records.

## Existing route cleanup inventory
| Current route | Proposed treatment | Migration protection |
|---|---|---|
| `/explore/weekend`, `/explore/restaurants`, `/explore/services` | Fold into **Discover** contextual categories | Preserve activity/venue selections and linked plans |
| `/community` | Retire as independent consumer destination; contextual circle panel | Keep group accounts, membership, discussions and invitations |
| `/experience` | Retire independent exact-name review search; bind experiences to item cards | Keep existing review records; devise safe item-ID matching/migration |
| `/explore/together`, `/vote/...` | Contextual invite/vote within one family plan | Preserve existing votes and privacy rules |
| `/explore/market`, `/explore/smartbuy`, `/explore/shopping` | Consolidate into **Shopping** one-page journey | Preserve wishlist, baskets, price comparisons and recorded expenses |
| `/plans`, `/calendar`, `/occasions` | Consolidate within **Family** | Preserve birthdays, commitments, tentative and confirmed status |
| `/advisor` | Keep as contextual capability; no extra competing navigation destination | Retain secure AI activation gates; no claims live AI is on |

Old deep links must resolve safely during migration, preferably redirecting to the correct category with an appropriate selected item/plan context. **Do not delete legacy components/routes before old links, records and security scenarios have been tested.** A clean consumer experience need not require destructive storage migrations.

## Implementation sequence
1. **Inventory:** freeze user-visible screen/route and data ownership table, tests, existing PRs and stored-data formats. Design a single shared Decision/Plan/Experience interaction contract.
2. **New shell:** create canonical category navigation and focused page states, ensuring first screen for each category has one clear purpose and at most three information groups. Remove extra consumer entry points while retaining legacy compatibility.
3. **Discover first:** connect permitted local sources + parent experience data + a single plan/choice handoff. Hide standalone circle/reviews/outings entrances.
4. **Shopping:** consolidate source search, saved needs, comparisons and purchase recording, with one expense/commitment relationship.
5. **Family and Money:** integrate plan, occasion, calendar, voting and finance idempotently, then refine Today and Ask based on these same entities.
6. **Validation and gradual rollout:** test bilingual/mobile, partial input, cross-device/circle authorization, old deep links, sample-vs-real data, lost connections and no-duplicate-expense flows before merging to main or deployment.

## Parent acceptance journeys
1. Saturday outing: discover relevant options → see trusted experiences or honest absence → choose → schedule with budget context → invite/vote optionally → record actual → share firsthand feedback, with no repeated personal inputs.
2. Birthday gift: start from family date → research in Shopping → save choice and expected cost to that same plan → record actual payment once → see updated Money and Today, without duplicate bills.
3. Parent recommendation: invite a trusted parent → share one real experience with explicit audience → recipient views source and limitations → acts or skips; neither family reveals private finance/child identity.
4. New family with no income/children fields: browse before setup; never be forced to invent finances to see options.
5. Legacy data: all prior plans, payments, events, wishlists, votes and experience records survive route consolidation.

## Definition of done
- Parent can name the single destination for every common task; there is no second page/category path asking them to do the same thing.
- Every landing state has ONE obvious main action and at most three visible content sections; advanced controls are progressive.
- No parent enters the same child, price, expense, date or plan twice in the same journey.
- No fabricated reviews, quote verification, booking confirmations, live merchant offers or cash claims.
- The five areas, a contextual Ask capability, and bilingual privacy-preserving flows pass automated and usability checks.
- A completed journey links back to the same records across Today, Family, Money, Discover and Shopping.
