# Dabberna — Cross-page UX coherence review (17 October 2026)

## Finding and decision

The code previously had **two competing application frames**: `AppShell` with only Today / Ask / Plans as top-level destinations, and `ShoppingExperienceShell` with six destinations, different header, widths, mobile navigation and pink design tokens. Meanwhile the home route had a third `homeLayout` variant, and the independently approved `?preview=landing` is a standalone read-only design experiment. The effect was visually disconnected navigation even though most pages share browser-local family data.

**Decision:** All normal in-app family routes now use one `UnifiedFamilyShell`. `AppShell` and `ShoppingExperienceShell` are compatibility wrappers; all existing page implementations, financial data keys and commercial foundations remain unchanged.

## Section map for routes reviewed

| Family area | Primary destination | Other connected routes audited |
|---|---|---|
| Today | `/` | `/space` (family settings), `/about` |
| Ask Dabberna | `/advisor` | Existing guided advisory entry points |
| Our Plans | `/plans` | `/explore/together`, `/together/$adminToken` |
| Money & Bills | `/money` | `/household` |
| Shopping & Wishlist | `/explore/smartbuy` | `/explore/shopping`, `/explore/market`, `/explore`, `/explore/restaurants`, `/explore/services`, `/explore/weekend`, `/community`, `/experience` |
| Family Calendar | `/calendar` | `/occasions` |

* `/explore/weekend` renders `WeekendOutingExperience` (already an `AppShell` consumer).
* The token-based public `/vote/$token` remains intentionally standalone: guests need a lightweight voting page, not a signed-in family dashboard. Its existing data, privacy, and voting behavior must not be reinterpreted.
* The `?preview=landing` opt-in preview remains separate until the parent approves replacing the normal homepage. It must not silently become the default.

## Changes that address the disconnected-app feeling

1. **One layout:** shared family sidebar, shared top header and language switch, shared six-item mobile navigation, consistent page widths, home/section framing, keyboard focus and accessibility labels.
2. **One information architecture:** the six approved areas are visible on every normal page. Supporting routes are associated with their parent area. The old Shopping-only active sidebar is gone.
3. **Connected journeys:** each section offers three context-appropriate next steps (e.g. shopping → money, plans, calendar; money → plans, shopping, ask) rather than leaving the user in a specialist tool.
4. **One visual language:** warm ivory/blush surfaces, calmer navy text, rounded white cards, consistent sans-serif typography, and a purposeful different pastel accent for each main family area.
5. **Shared family context:** real saved family names (not sample profiles) appear in the sidebar, with a clear route to Family & settings. Selecting a name there no longer misleadingly changes only the separate shopping title; the shopping wishlist name is managed inside Personalize.
6. **No data rewrite:** no financial, wishlist, basket, calendar, plan, merchant, payment, subscription, or archive keys were changed.

## Acceptance and remaining limitations

- Automated checks: TypeScript, unit tests, production build, basic accessibility/navigation assertions, route categorization and shared-shell smoke tests.
- Manual testing still recommended on small iPhone screens, desktop, and in both LTR and RTL: verify touch targets, long Arabic titles, card spacing, back navigation, standalone public vote.
- Global frame alignment is **not** a claim that every legacy specialist form, calendar table, or account/security workflow has been individually reillustrated. Those remain functional with shared typography/colors and can be redesigned incrementally after the parent tests the integrated navigation.
- No claim of live AI image generation, merchant price connectivity, or synchronized family accounts is implied by the unified interface.
