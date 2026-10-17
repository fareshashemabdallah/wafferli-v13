# Dabberna — Four-page architecture (17 October 2026)

## Main navigation

Only four primary page destinations across desktop and mobile:

1. **Today** (`/`) — immediate actions, one grounded family priority, discreet real spending overview, next meaningful saved event, optional practical weather tip. The already approved focused home remains unchanged.
2. **Our Money** (`/money`) — complete financial workspace: income, planned vs recorded expenses, commitments/bills, savings and risk insights.
3. **Family Life** (`/family`) — one functional hub with in-page **Overview / Calendar / Plans & activities / Responsibilities**. The Calendar and Plans tabs render the existing full, writable workspaces in embedded mode; no new data model, copied records or altered permissions.
4. **Ask Dabberna** (`/advisor`) — guided local decision-making based on saved family data, clearly not yet live connected generative AI.

## Existing routes and compatibility

`/plans`, `/calendar`, `/occasions`, `/space`, `/explore/together` and family outings continue to work and highlight **Family Life** in the navigation. `/household` highlights Our Money. The existing Shopping & Wishlist, basket and marketplace routes are preserved as **secondary tools**, accessible through the collapsed **Other tools** desktop sidebar or mobile **More features** dropdown. Secondary shopping routes do not misleadingly mark Today as active.

Public voting links are unchanged and remain standalone. The opt-in `?preview=landing` experiment remains unchanged. All previously saved family calendars, birthday profiles, financial records, task and plan IDs, expense associations, wishlists and price histories retain their original storage keys.

## Design rules

- Do not reproduce the four primary navigation destinations as cross-links on every page.
- Family Life's four internal views are **functional sections on one page**, not four more primary pages or newly duplicated data stores.
- Parent-controlled links to specialists (e.g. shopping, circles, outings, provider pages, occasion planning) are available but visually subordinate.
- Never claim shared household cloud sync, bank-verified money, background reminders or live AI where only browser-local functionality is implemented.

## QA

Check desktop, iPhone-size screen and Arabic RTL. Test Today fast actions; review detailed financial data; open the Family Life Calendar and record an event, switch to Plans and create a linked plan, return to Overview and verify the same saved items. Check responsibility editor, retained deep links, Shopping through More on iPhone, browser-local data safety, public vote and preview.
