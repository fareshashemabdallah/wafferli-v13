# Dabberna | دبّرنا — Family Life Pilot

**Brand name provisional.** A calm, bilingual (English / Arabic RTL) family finance and everyday decision companion.

## Test the running app
**https://fareshashemabdallah.github.io/wafferli-v13/**

In GitHub Settings → Pages select **GitHub Actions** as the deployment source. The validated full app lives in `app/`, not the old top-level `index.html` fallback.

## Features in this pilot
- **Home:** financial snapshot using the same browser-local household budget as My Money; upcoming obligations, practical family insights and a family-friendly style.
- **Weather:** real Open-Meteo forecast when the parent chooses a city. Practical clothing and umbrella suggestions; no passive location tracking. A provider outage shows an honest error.
- **My Money:** income sources, expense categories, actual spending, savings targets, dated bills, cash flow and conservative cash-available calculation. Entered figures are estimates and not professional financial advice.
- **Family Advisor:** practical affordability calculator that considers entered cash, future bills and reserve; guides users to relevant modules. A conversational AI model is **not connected**.
- **Explore:** child-aware family/friends outings with estimated costs and group voting, restaurants and cuisines, shopping basket and manual purchase comparison.
- **Family Services:** on-demand search of doctors, education, home services, activities and gifts via attributed third-party Google Maps links. No invented doctors, rankings, verified reviews or clinical advice.
- **Family profiles and preferences:** parent-controlled visibility of weather and suggestions, preferred outing budget/distance, and in-app guidance frequency.
- **Bilingual navigation:** Arabic RTL / English LTR.

## What isn't live yet
- Bank connections, verified shared family finances across parents' devices, credit cards and payments.
- Generative AI, automated independent review aggregation, live product price feeds and healthcare provider verification.
- Background push notifications or automated event/calendar integrations.
- Review publication and verified doctor visits.
- Outing voting requires a working Supabase backend and must be tested across devices; the rest of the household information stays on this device.

**Use fictional or test financial/household details during the pilot**; browser-local data can be cleared or shared if the device/profile is shared. Do not enter sensitive health or child information into third-party searches.

## Development and CI
- Main source: `app/` React, TypeScript, Vite, Tailwind and TanStack Router.
- Install: `cd app && bun install --frozen-lockfile`
- Test: `bun run typecheck && bun run test && bun run build`
- GitHub Actions validates the build and deploys `react-dist/` to Pages upon a merge to `main`.
- Existing data storage keys and all existing share/vote URL formats remain unchanged.

**دبّرنا — قرارات أذكى، حياة أسهل.**
