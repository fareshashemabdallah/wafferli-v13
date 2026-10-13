# Dabberna | دبّرنا — V13 Pilot

Dabberna is a household planning and purchasing assistant, formerly known as Wafferli.

## Current app
The original React and TypeScript application is restored in [app/](app/). Features include household budget categories, expense tracking, savings projections, family profiles, shopping lists, manual product comparisons, restaurant exploration and Together outing votes.

The web app is compiled by [Dabberna deployment workflow](../../actions/workflows/dabberna-deploy.yml) and published at https://fareshashemabdallah.github.io/wafferli-v13/.

**GitHub Pages setup:** In Settings > Pages, change Source to **GitHub Actions**. Do not choose a default template: our deployment workflow already exists. The old branch publisher may still publish the root demo until this setting is changed.

## Project stages
- Main source: `app/` (richer React pilot)
- Root `index.html`: older limited demonstration, kept as a fallback
- Automatic build and TypeScript checks: configured
- Finance and shopping: browser-local test data
- Voting: configured to use the Supabase cloud database; end-to-end cross-device testing remains
- Live AI, real product prices, payments and bank data: not integrated yet

Do not enter sensitive information during testing. The domain dabberna.com has not been registered or connected.

**دبّرنا — قرارات أذكى، حياة أسهل.**
