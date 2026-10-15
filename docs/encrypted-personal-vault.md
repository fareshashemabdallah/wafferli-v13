# Dabberna — Opt-in encrypted personal vault (staging-only)

**Status:** Source implementation and staging SQL candidate; **NOT deployed or enabled in the public GitHub Pages pilot**. This is not automatic synchronization of household finances. It allows a parent to deliberately move a personal encrypted backup between their own devices, followed by explicit local restore.

## Data model and strict privacy boundaries

- Vault is keyed exclusively to `auth.uid()` from verified Supabase authentication. Neither co-parent membership nor family/community circle membership gives access to someone else's vault.
- The parent chooses **each** data category explicitly from validated local sections, including optional private quotation records and private family-service notes if deliberately selected. If they choose Money only, family profiles, birthdays, other members, calendar, plans and shopping are NOT uploaded.
- The application refuses to include unreviewed local tokens, group invitations, supplier/admin keys, API credentials or Supabase login sessions.
- The file is encrypted in the browser using PBKDF2-HMAC-SHA-256 (310,000 iterations, fresh 16-byte salt) to derive a 256-bit AES-GCM key (fresh 12-byte IV). No passphrase or derived key is sent to the server. Vault uses an authenticated ciphertext tag, not just reversible obfuscation.
- SQL stores `user_id`, `revision`, the encrypted envelope and update timestamp. Row-level security allows owner-only SELECT, and narrow authenticated RPCs handle create/replace/delete.
- Saving is an **explicit action**. To replace an existing vault via UI, the same passphrase must first decrypt the current copy; compare-and-swap `expected_revision` prevents silent loss from concurrent devices.
- Retrieval uses the passphrase in the browser, verifies authenticated ciphertext and validates the resulting backup JSON. The user then explicitly downloads an **unencrypted local JSON file** and restores chosen sections using the existing independently confirmed Restore tool.
- The user's original Money data remains local throughout; no automatic upload, merging, shared expense writes, external bank access or provider payments take place on sign-in, membership acceptance or browsing the app.
- Deleting the vault deletes only the current authenticated user's **active** encrypted record. Provider backups/log retention may be longer; deleting it does NOT clear local devices or separate household expenses.

## Security and limitations

- A lost passphrase **cannot be recovered**. Avoid saying Dabberna can reset it. Strong, unique passphrases and secure password management are essential.
- Client-side encryption protects data at rest on the server but **does not defend against compromised JavaScript, a compromised device, keyloggers, phishing, manipulated builds, weak user passphrases or mishandled plaintext downloads**.
- Original source data is browser-local and unencrypted. The downloaded decrypted JSON is unencrypted; the parent must protect it. This is **NOT zero-knowledge cryptography proven by an external security audit**.
- There is one immutable logical personal snapshot per user, incrementing a revision on explicit overwrite; this is NOT a change-based sync engine. No automatic conflict resolution or automatic two-way updates.
- No cross-household or co-parent shared finance access is conferred by personal vault.
- Child profiles can contain sensitive data; verify child privacy obligations and consent before public release.
- A compromised authenticated account can replace the ciphertext via the permitted RPC; the UI's passphrase verification is a client guard, not an additional server-side authorization factor.
- Vault data is at most ~5MB plaintext/8MB JSON ciphertext. Browser storage, network and database quota may constrain actual upload.
- Approved staging must verify RLS, SQL role/definer ownership, callbacks, GDPR/Jordan privacy/legal requirements, account recovery, retention/deletion, intrusion monitoring, audit logs and app CSP/XSS boundaries before public rollout.

## Deployment (not automated)

1. Deploy `app/supabase/private_vault_v1.sql` to an isolated Supabase staging project, not production. Review SQL with a backend/security professional.
2. Configure tested Supabase Auth email callback URL for the dedicated staging app and rate limiting.
3. Test two independently signed-in users, token expiry, unauthenticated access, forged user IDs, direct table mutations, revision conflicts and race conditions.
4. Confirm the service role key is never embedded in browser code. Inspect RLS policies, `SECURITY DEFINER` owners and `GRANT EXECUTE` permissions.
5. Validate correct AES-GCM encryption/decryption and tampering failure on Chrome, Safari and mobile browsers. Validate weak passphrase rejections and random salts/IVs.
6. Only on a dedicated staging build, set `VITE_ENABLE_PRIVATE_VAULT=true`, pointing to that reviewed staging Supabase project.
7. Run an end-to-end manual test: create personal vault on device A, sign in to same account on B, decrypt and download backup on B, preview and explicitly restore it; verify that unrelated users and household members see nothing.
8. Test deletion, loss of passphrase, untrusted backup, quota failure, multi-device revision races, mobile logout and retention policy. Enable production only after review and signoff.

## Remaining development

- Cross-device **automatic** sync of privately owned expenses and explicitly shared household budgets, with server-enforced per-record permissions, replays/conflicts, undo/version history, deletion, consent revocation, offline queue, two-device testing and independent security audit.
- Account lifecycle, stronger age assurance, audit logging and optional push reminders.
- Conversational family AI and merchant payment architecture are separate release packages.

See also `docs/validated-local-backup-recovery.md` and `docs/household-expense-sharing.md`.
