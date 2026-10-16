# Dabberna live AI: activation and safety checklist

**Status: source implemented, service NOT deployed or activated.** GitHub Pages hosts a static frontend; the AI provider key must stay in the separately hosted Supabase Edge Function.

## The conversation boundary

- An authenticated adult signs in and explicitly agrees on **every question** to transmit its text and a limited preceding conversation to the AI provider through the server.
- No raw Money ledger, expense notes, family members' names, children's details or personal profiles are sent automatically. A separate OFF-by-default toggle previews the precise optional numerical budget summary sent with that one question.
- Questions and responses stay in React memory, not the browser's durable storage or the Dabberna database. The OpenAI Responses API request specifies store:false. Provider abuse/safety retention may still apply under its privacy policy.
- Answers are guidance, not verified banking, retailer price, clinical or provider data. The existing device-only advisor stays usable without credentials.

## Operator steps: deploy to staging before public activation

1. Use a disposable Supabase staging project. Independently inspect and apply **app/supabase/ai_quota_v1.sql** via its SQL editor. This creates per-user atomic quotas: 4 requests per ten minutes and 20 per UTC day. Only user UUID, time buckets and counts are stored. Anonymous users and direct table SELECT/UPDATE must be denied.
2. Configure Edge Function secrets in Supabase, not in repository code or browser build: **OPENAI_API_KEY**, optional **OPENAI_MODEL** (default gpt-5-mini), **AI_ALLOWED_ORIGINS** (production default https://fareshashemabdallah.github.io), and **DABBERNA_AI_SERVER_ENABLED=true** only after review. Supabase provisions project URL and publishable/anon keys automatically; only the caller's verified user session is accepted.
3. From the app directory with an authorized Supabase CLI account, run: **supabase functions deploy dabberna-family-ai --project-ref YOUR_PROJECT_REF**. Never paste the API key in GitHub, chat, a public configuration or a VITE_ variable.
4. Confirm signed-in requests succeed; anonymous and expired sessions receive 401; unexpected origins 403; malformed data 400; missing SQL protection 503; 5th request in a 10-minute window and 21st daily request are rejected. Check parallel requests, provider outages, slow responses, Arabic and English, and browser/mobile accessibility.
5. Set a provider account spending cap/budget alert and audit costs, retention, privacy notices, OTP account abuse and applicable local legal requirements. Observe production logs **without logging user content**.
6. Only when the server is operational and independently security-tested, set the GitHub Actions repository variable **DABBERNA_ENABLE_LIVE_AI=true** and redeploy the static Pages app. The deploy workflow maps this PUBLIC boolean to **VITE_ENABLE_LIVE_AI**. False/unset leaves the live AI UI disabled and shows the offline advisor.
7. Re-test a real signed-in family member on the deployed app, including the optional numeric-summary consent boundary. A green GitHub CI run is not proof that Supabase code or SQL has been deployed.

## Fail-closed design

- Never fall back to open public/unlimited AI calls when quota SQL fails or secrets are missing.
- Never put OpenAI credentials in browser or GitHub Pages.
- Never auto-transmit full expenses, notes, household profiles or medical records.
- No model-driven bank transfers, payments, purchases, bookings, automated notifications or real sharing.
- Providers, prices, medical facts and current availability must not be invented.

**Remaining blocker:** The connected GitHub integration cannot install private Supabase Edge secrets, apply SQL or authenticate as the project's Supabase administrator. A repository merge delivers deployable source only, not a live backend.
