# Dabberna live AI: activation and safety checklist

**Status: source implemented, service NOT deployed or activated.** GitHub Pages hosts a static frontend; the AI provider key must stay in the separately hosted Supabase Edge Function.

## The conversation boundary

- An authenticated adult signs in and explicitly agrees on **every question** before any text is sent to the AI provider through the server. **Earlier conversation is excluded by default**, and must be separately opted into for each request (last two exchanges maximum). A preview displays the current question, any selected history, and whether optional numeric context is included.
- Browser and server share a conservative rejection policy for common email addresses, phone numbers, bank/card identifiers and credential-shaped strings in the current question and previous turns. **This is not comprehensive PII detection**: parents must still avoid sending children's identities, exact addresses, health records or sensitive facts the detector may miss. Rejected values and matches are never echoed into validation errors.
- No raw Money ledger, expense notes, family members' names, children's details or personal profiles are sent automatically. A separate OFF-by-default toggle previews the precise optional numerical budget summary sent with that one question.
- Questions and responses stay in React memory, not the browser's durable storage or the Dabberna database. The OpenAI Responses API request specifies store:false. Provider abuse/safety retention may still apply under its privacy policy.
- Answers are guidance, not verified banking, retailer price, clinical or provider data. The existing device-only advisor stays usable without credentials.

## Operator steps: deploy to staging before public activation

1. Use a disposable Supabase staging project. Independently inspect and apply **app/supabase/ai_quota_v1.sql** via its SQL editor. This creates per-user atomic quotas: 4 requests per ten minutes and 20 per UTC day. Only user UUID, time buckets and counts are stored. Anonymous users and direct table SELECT/UPDATE must be denied.
2. Configure Edge Function secrets in Supabase, not in repository code or browser build: **OPENAI_API_KEY**, optional **OPENAI_MODEL** (default gpt-5-mini), **AI_ALLOWED_ORIGINS** (production default https://fareshashemabdallah.github.io), and **DABBERNA_AI_SERVER_ENABLED=true** only after review. Supabase provisions project URL and publishable/anon keys automatically; only the caller's verified user session is accepted.
3. From the app directory with an authorized Supabase CLI account, run: **supabase functions deploy dabberna-family-ai --project-ref YOUR_PROJECT_REF**. Never paste the API key in GitHub, chat, a public configuration or a VITE_ variable.
4. Test that malformed requests and secrets/PII patterns are rejected with 400 before any provider call; ensure stale async answers cannot repopulate a signed-out screen. Confirm the user can review the exact payload and include prior history only after separately opting in. Confirm signed-in requests succeed; anonymous and expired sessions receive 401; unexpected origins 403; malformed data 400; missing SQL protection 503; 5th request in a 10-minute window and 21st daily request are rejected. Check parallel requests, provider outages, slow responses, Arabic and English, and browser/mobile accessibility.
5. Set a provider account spending cap/budget alert and audit costs, retention, privacy notices, OTP account abuse and applicable local legal requirements. Observe production logs **without logging user content**.
6. Only when the server is operational and independently security-tested, set the GitHub Actions repository variable **DABBERNA_ENABLE_LIVE_AI=true** and redeploy the static Pages app. The deploy workflow maps this PUBLIC boolean to **VITE_ENABLE_LIVE_AI**. False/unset leaves the live AI UI disabled and shows the offline advisor.
7. Re-test a real signed-in family member on the deployed app, including the optional numeric-summary consent boundary. A green GitHub CI run is not proof that Supabase code or SQL has been deployed.

## Automated staging smoke test (manual, opt-in)
A separate operator-only script is available at `app/scripts/verify-live-ai-staging.mjs`; from `app/`, run `npm run security:ai-staging` **only against a disposable staging Supabase project**. The script rejects the current public project, requires an explicit confirmation, and never prints credentials, prompts or model responses.

Required environment variables (set privately in a local terminal, not GitHub source):
- `DABBERNA_CONFIRM_STAGING=DISPOSABLE_PROJECT_ONLY`
- `DABBERNA_STAGING_PROJECT_REF=<disposable_ref>`
- `DABBERNA_STAGING_URL=https://<disposable_ref>.supabase.co`
- `DABBERNA_STAGING_ANON_KEY=<staging publishable or anon key>`
- `DABBERNA_AI_TEST_ORIGIN=https://fareshashemabdallah.github.io` (optional, must match Edge allowed origin)

The default checks cover allowed-origin CORS preflight, rejection of an unauthorized origin, non-JSON requests, and anonymous access. The staging Edge Function must already have its server-side enabled flag, quota SQL and secrets; otherwise the test **fails** with an explanation instead of silently passing.

Optionally, provide `DABBERNA_AI_TEST_EMAIL` and `DABBERNA_AI_TEST_PASSWORD` for a disposable test account to verify authenticated rejection of malformed JSON, unexpected child-data fields, synthetic email addresses, and mock payment-card details. These negative cases do not intentionally consume AI credits. To also perform **one paid provider request**, explicitly set `DABBERNA_RUN_PAID_AI_TEST=I_ACCEPT_PROVIDER_COST` for that invocation. The script neither prints the answer nor tests multiple paid requests by default.

Passing the smoke test is only an early gate: continue with independent multi-user auth/quotas/security, data retention review, parent usability tests, provider billing caps and production rollout controls. **This test has not been run on a real staging project.**

## Fail-closed design

- Never fall back to open public/unlimited AI calls when quota SQL fails or secrets are missing.
- Never put OpenAI credentials in browser or GitHub Pages.
- Never auto-transmit full expenses, notes, household profiles or medical records.
- No model-driven bank transfers, payments, purchases, bookings, automated notifications or real sharing.
- Providers, prices, medical facts and current availability must not be invented.

**Remaining blocker:** The connected GitHub integration cannot install private Supabase Edge secrets, apply SQL or authenticate as the project's Supabase administrator. A repository merge delivers deployable source only, not a live backend.
