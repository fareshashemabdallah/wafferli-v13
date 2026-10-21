# Dabberna family-first prototype preview build

This is a non-runtime file used to request the existing GitHub Pages deployment
workflow to rebuild the current release alongside the isolated redesign preview.

- Redesigned preview source branch: `design/clean-slate-single-category-2026-10-21`
- Validated preview source commit: `61465a745f3820b4f7322901f50522495e594415`
- GitHub Actions PR validation: 39609914050 — success
- Preview target: `https://fareshashemabdallah.github.io/wafferli-v13/preview/`
- Existing live release target (unchanged): `https://fareshashemabdallah.github.io/wafferli-v13/`
- Preview AI disabled; preview browser family records use a separate prefix.
- Saved finance records and older routes are not destroyed in this preview.
- Review sharing requires optional Supabase authentication and server policies.

This does not imply that the public preview is externally confirmed until the
GitHub Pages workflow finishes successfully.
