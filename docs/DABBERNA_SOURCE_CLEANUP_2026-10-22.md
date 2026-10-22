# Dabberna source cleanup: current static pilot (22 October 2026)

This report is scoped to the actual static React/Vite application hosted from app/ via GitHub Pages. It does not assume that “not imported by src/main.tsx” means safe to remove: unit-test-only business modules, server/security tools, migration code and direct legacy links are deliberately separate categories.

## Baseline from reproducible import audit

- 408 scanned source files; 202 statically reachable source files from the SPA entry point (including all 23 registered routes).
- 75 non-test unreachable production-module candidates.
- 15 declared direct dependencies without a matching source import (this includes CLI/build tool false positives).
- Baseline compiled JS: approximately 1,768.14 kB uncompressed / 522.07 kB gzip.
- This is a **static reachability** audit, not a full tree-shaking analysis or definitive dependency-security scanner.

## Applied cleanup

- Removed 40 generic UI scaffold components with no reachable production imports, plus their orphan hook.
- Removed dormant presentation-only components and unreferenced helpers, and deleted the old root-level standalone index.html (production is generated from app/index.html).
- Removed optional ?preview=classic and ?preview=landing homepage code paths and their prototype-only tests. The current illustrated AdventureFamilyHome remains the single real homepage; its cartoon assets are preserved.
- Removed the former FamilyMoneyJourneyCard reveal/hide interface and its UX test, which were no longer reachable from the app and conflicted with the current always-visible amounts decision.
- Removed an unused MoneyOverviewPanel import/legacy implementation and its obsolete design-only test. The current Money home remains FamilyMoneyRhythm; Bills/Spending fallback flows are still available.
- Removed 33 direct dependencies used only by deleted UI scaffolding; updated both app/package.json and the Bun lockfile workspace declaration.
- Added app/scripts/audit-source.mjs with npm/bun script audit:source, run on CI so future work identifies newly orphaned code.

## Safeguards

- No Money / Family / Calendar / Plans data schema was changed or migrated.
- No saved browser-local records, payments, budget items, financial idempotency checks, auth endpoints, database migrations, export/restore, or registered routes were deleted.
- Do not delete generic code from tests solely to make a count look lower. A tested but currently unshipped domain module may be important for consistency or migration.
- GitHub Actions runs frozen-lockfile installation, TypeScript, all current tests, the audit, and production build on the cleanup PR.

## Remaining intentional work

1. Review the remaining test-only or legacy domain modules individually (e.g. homeSnapshot, familyMoneyJourney, membershipPolicy) and decide which rules belong in current shared services. Do not remove them without replacing their relevant invariants.
2. Audit dormant Supabase SSR/server.ts/start.ts, database tooling and live-AI/edge functions separately against staging and deployment commitments before deleting server or authentication code. The public site is a Vite SPA but this repository is still connected to Lovable.
3. Audit each of the 23 *reachable* routes; direct links and family polls, service discovery, backup, and bill review may intentionally live outside the three primary tabs. A hidden navigation item is not proof of dead code.
4. Implement supported route-level code splitting to reduce the single main JS bundle. A removed source file that was already tree-shaken has no download benefit.
5. Before removing remaining developer-tool packages, generate a fresh lockfile and test both CI and connected editor workflows. An unreferenced package in an import scan can still be needed by Vite, TypeScript, test frameworks, or workflow scripts.

## How to repeat

In app/: run bun run audit:source, bun run typecheck, bun run test, bun run build. Review the import lists and CI results, then remove only independently verified unreachable features. The audit deliberately does not auto-delete.
