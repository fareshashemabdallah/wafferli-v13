# Dabberna no-setup, low-effort family preview

- Preview source branch: `design/clean-slate-single-category-2026-10-21`
- Validated source commit: `7e151cb9f46fff19f3ec3a90616df01560f5d89e`
- Status: GitHub Actions TypeScript, unit tests and React build passed on the PR branch.
- Public preview target: https://fareshashemabdallah.github.io/wafferli-v13/preview/
- Existing live app target (preserved): https://fareshashemabdallah.github.io/wafferli-v13/
- Features: one meaningful Today action; optional no-setup family idea; one-click category-only Discover handoff; saved city reuse; under-two age in months; broad toddler/teen context; two-choice private feedback and one save; source-labeled venue listings.
- Birth year optional. Previously entered family records, gifts, expenses and plans preserved. No live AI, verified venue age suitability, bank import or automatic receipt scan is implied.
- Preview is isolated at /preview/ with an independent localStorage namespace and live AI disabled.
- Deploy requires successful checks in .github/workflows/dabberna-deploy.yml and does not merge PR #131.

A successful trigger is not itself independent confirmation of Pages publication.
