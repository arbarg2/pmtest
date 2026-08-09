# Public Rìan API v1 — real keys, real security, real docs

Turn the static `/api-docs` page into a working, self-serve developer API: users generate API keys in-app, call a versioned REST endpoint, and read docs that match exactly what the backend does.

## What you get

1. **Self-serve API keys** — a Developer / API Keys section where a signed-in user creates a named key, sees the full key exactly once (`rian_live_...`), then only a prefix afterwards. Keys can be revoked. Only a hash of the key is stored, so nobody (including us) can read it back.
2. **A real API** at `/functions/v1/api/v1/...` with three endpoints:
   - `GET /v1/screen?address=...` — instant verdict: risk score, tier, OFAC sanctions match, reasons.
   - `POST /v1/screen/batch` — up to 25 addresses per call.
   - `GET /v1/sanctions/check?address=...` — pure OFAC list lookup, no chain calls.
   - `GET /v1/me` — key info, plan, quota remaining (useful for integration testing).
3. **Security built in** — key hashing, per-key rate limits, monthly quotas, request logging, strict input validation, no key ever logged or returned after creation, CORS-safe responses, and clear 401/403/429 error bodies.
4. **Rewritten docs page** — dark, on-brand (currently the only light-themed page in the app), with live copy-paste examples using the real endpoint URLs, an authenticated "Your keys" panel replacing the fake "Get API Key" button, error-code reference, and rate-limit table.

## Security model

| Concern | How it's handled |
| --- | --- |
| Key storage | SHA-256 hash only; plaintext shown once at creation |
| Key format | `rian_live_<32 random chars>`, with an 12-char stored prefix for display |
| Auth | `Authorization: Bearer <key>` — validated server-side on every request |
| Rate limit | Sliding window per key (60 req/min default), returns 429 + `Retry-After` |
| Quota | Monthly request cap per key/plan, returns 402-style `quota_exceeded` |
| Isolation | Keys scoped to the owning user; RLS so users only see their own keys and usage |
| Abuse visibility | Every call logged (endpoint, status, latency, truncated IP) for the owner to review |
| Input | Address format validated per network before any external call; batch size capped |

## Technical detail

**Migration**
- `api_keys` — `user_id`, `name`, `key_hash`, `key_prefix`, `plan` (free/pro), `monthly_quota`, `rate_limit_per_min`, `revoked_at`, `last_used_at`, timestamps. RLS: owner can select/insert/update own rows; no client read of `key_hash` beyond own row (hash is useless anyway). GRANTs for `authenticated` + `service_role`.
- `api_requests` — `api_key_id`, `endpoint`, `status_code`, `duration_ms`, `created_at`. RLS: owner reads via key ownership; inserts only from service role. Index on `(api_key_id, created_at)` for rate-limit and quota counting.
- Helper `public.api_usage_this_month(_key_id uuid)` (security definer) for quota counting.

**Edge function `api`** (new, `verify_jwt = false` since it authenticates by API key)
- Path router on `/v1/...`; service-role Supabase client.
- Auth: hash the bearer token, look up non-revoked `api_keys` row, else `401 invalid_api_key`.
- Rate limit: count `api_requests` for the key in the last 60s, compare to `rate_limit_per_min`.
- Quota: count for the current month against `monthly_quota`.
- Screening reuses the existing `safe-check` logic (network detection, chain fetch with `wallet_cache`, OFAC lookup against `sanctions_addresses`, risk scoring) — extracted into `supabase/functions/_shared/screening.ts` so `safe-check` and `api` stay identical in behaviour.
- Always logs the request row, always returns JSON with the shared CORS headers, never echoes the key.

**Frontend**
- `src/services/apiKeys.ts` — create / list / revoke, plus usage summary.
- `src/components/api/ApiKeysPanel.tsx` — create dialog, one-time key reveal with copy + "you won't see this again" warning, key table with prefix/last used/usage bar/revoke.
- `src/pages/ApiDocs.tsx` rewritten: dark aurora/mesh styling matching the rest of the app, real base URL, working curl/JS/Python snippets, response schemas, error table, rate-limit table, and the keys panel inline (sign-in prompt when logged out).

Nothing else in the app changes; `safe-check` keeps working unchanged for the `/safe` page.
