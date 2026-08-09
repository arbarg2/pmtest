# MCP status + the path to product-market fit

## 1. Is the MCP fully functional?

Yes — verified live, not just in code:

- The `mcp` function is deployed and answering at the public endpoint.
- Its OAuth discovery document is served correctly and points at the right authorization server.
- Unauthenticated tool calls are correctly rejected with 401 (expected — the server is OAuth-protected).
- The OAuth 2.1 authorization server is enabled with dynamic client registration, the consent page is registered at `/.lovable/oauth/consent`, and the published site URL is in the redirect allow-list. No configuration issues detected.
- Five tools are advertised: `list_investigations`, `get_investigation`, `screen_address`, `list_watched_wallets`, `watch_wallet`.

One real gap: the MCP exposes records and monitoring, but **not the product's core action**. An agent can read past investigations, yet cannot run a fresh risk analysis on an address. That is the single most valuable tool to add.

### MCP improvements worth making
- `analyze_wallet` — run the full risk screening (chain data + OFAC + heuristics) and return the verdict, reusing the shared screening module the public API already uses.
- `unwatch_wallet` — monitoring is currently one-way over MCP.
- `list_alerts` — let an agent surface recent risk-change alerts.

---

## 2. What to add for product-market fit

The app is technically strong but still sits between two audiences without fully closing either. Three things convert it into a product people adopt and pay for.

### Phase 1 — Wallet Health Check (the retail hook)
The question everyday users actually have is "is *my* wallet clean?", not "is this stranger's address clean?".

- New `/health` page with browser wallet connect (`window.ethereum`).
- New `wallet-health-check` edge function: pull the wallet's full counterparty set, batch-match against the OFAC table, apply mixer/drainer heuristics, return a verdict report and save it as an investigation record.
- Shareable health report card (Clean / Caution / Danger) reusing the verdict-banner visual language, with Twitter + copy-link sharing.

This is the viral, self-serve entry point — and it produces exactly the exposure data compliance teams want.

### Phase 2 — Alerts that actually reach the user
Monitoring only matters if it finds you. Today alerts live in an in-app bell.

- Telegram bot delivery: link a user's chat to their account, push alerts when a watched wallet's risk crosses its threshold.
- Replace the mock random risk scores in `wallet-monitor` with real re-screening via the shared screening module, so alerts are truthful.

### Phase 3 — Monetization
Free: limited daily checks, 1 health scan, dashboard/history.
Pro: unlimited checks, monitoring + Telegram alerts, Ask Holly, bulk screening, PDF/SAR reports, API access.

- Lovable-managed Stripe, a `subscriptions` table, a webhook to sync status, a `useSubscription` hook, and upgrade gates on the Pro features.
- A `/settings` page for plan, usage, API keys and Telegram connection.

### Phase 4 — Distribution (pick one)
- **Browser extension** that intercepts wallet send flows and shows the verdict before signing — highest retail retention.
- **Telegram/Discord group bot** — check an address from inside a community chat; strongest organic growth in crypto.

---

## Recommended order

```text
MCP: add analyze_wallet (small, high leverage)
  -> Phase 1  Wallet Health Check
  -> Phase 2  Telegram alerts + real monitoring scores
  -> Phase 3  Stripe tiers + gating + /settings
  -> Phase 4  Extension or group bot
```

## Technical notes
- `analyze_wallet` and `wallet-health-check` both reuse `supabase/functions/_shared/screening.ts`, so retail, API, MCP and monitoring all score identically.
- `wallet-health-check` batches counterparty lookups against `sanctions_addresses` in a single query; chain reads go through the existing cache table.
- New tables: `telegram_alert_prefs`, `subscriptions` — both RLS-scoped to the owner, with grants.
- The Telegram webhook function needs `verify_jwt = false` and secret-token verification.
