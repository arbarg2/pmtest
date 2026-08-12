# Rìan — Honest Assessment and Route to Market

## The blunt version

Rìan is a genuinely impressive engineering artifact with a real screening engine, but it is not yet a product. It has no revenue mechanism, no retention loop, and its marketing copy currently promises two capabilities that do not exist in the code. Roughly: strong core, over-claimed surface, missing business.

---

## Pros — what is genuinely real

- **The screening engine is real.** `_shared/screening.ts` makes live Etherscan V2, Blockstream and Solana RPC calls, matches against a real OFAC SDN table synced daily, and logs decisions with provenance. `/safe`, the public API and wallet monitoring all share it, so verdicts are consistent.
- **Real scam data.** ~5.6k Etherscan-tagged phishing/hack addresses synced daily via `sync-malicious`. Most competitors at this stage fake this.
- **`wallet-monitor` re-screens for real** — no random scores, alerts only on genuine threshold crossings.
- **Serious depth for compliance**: evidence logging, audit trail, workspaces/RBAC, HMAC-signed webhooks, SAR generation bound to evidence, RLS everywhere, hashed API keys with quotas.
- **Distribution surface most tools lack**: public REST API v1 plus an OAuth 2.1 MCP server, so agents in ChatGPT/Claude/Cursor can call it.
- **The dual-audience framing (consumer `/safe` + analyst dashboard) is the right strategic bet.**

## Cons — what undermines it

1. **Landing page claims with zero backing code.** "Fake tokens" and "risky token approvals" have no implementation anywhere — no allowance scanning, no token-metadata checks. This is the single biggest credibility risk.
2. **No retention loop.** After a `/safe` or `/health` verdict there is no watch/save/alert CTA, even though `WatchWalletButton`, `watched_wallets` and `wallet-monitor` already exist and work. Users check once and never return.
3. **No money.** No Stripe, no tiers, no quotas on the consumer side. Everything expensive is free and unlimited.
4. **Solana is a stub** presented as equal to BTC/ETH: balance only, no tx history, so no age/behaviour signals — and `/health` rejects Solana outright.
5. **Fake homepage ticker.** `Landing.tsx` hardcodes "live" scan results. Any technical viewer who inspects this discounts everything else.
6. **Over-stated depth.** "Walking the transaction graph" is a single-hop counterparty scan; BTC counterparties are truncated to one un-paginated Blockstream page, so `total_transactions` is silently wrong for active wallets.
7. **Dead code:** `ReportGenerator.tsx` is never imported and duplicates the real export path.
8. **Too many features, no sharp wedge.** Cases, clusters, Org Pulse, bulk, API, MCP, SAR, webhooks — nothing is clearly *the* reason to use Rìan.

## What is missing to be a business

- Billing and plan gating
- Onboarding + a first-run "aha" that does not require pasting an address
- Any proof of accuracy (benchmark / known-bad test set / false-positive rate)
- Notifications outside the app (email or Telegram)
- Support, terms, SLA, data-retention statement — table stakes for any compliance buyer

---

## Route to market

### Phase 0 — Integrity pass (do first, small)
- Remove or actually build the "fake tokens" and "risky token approvals" claims. Recommended: build **token approval scanning** (real, high-value, well-defined) and drop the fake-token claim until backed.
- Replace the hardcoded ticker with real recent `public_checks` rows, or remove it.
- Label Solana as "beta — balance and sanctions only" wherever it appears; either extend `fetchSol` to pull signatures or stop advertising parity.
- Fix BTC pagination in `wallet-health-check`, or label counts as "recent activity".
- Delete `ReportGenerator.tsx`.

### Phase 1 — Retention loop
- Surface `WatchWalletButton` directly on the `/safe` verdict and the `/health` report.
- Deep-linkable health reports (`/health/report/:id`) so shares actually land on the result.
- External alert delivery (email first, Telegram second) from `wallet-monitor`.

### Phase 2 — The wedge
Pick one and make it best-in-class rather than adding more surface. Strongest candidate: **"Is it safe to sign this?" — approval + counterparty exposure check for everyday users**, with the compliance dashboard as the upsell, not the headline.

### Phase 3 — Monetisation
- Free: 5 checks/day, 1 health scan, no monitoring.
- Pro (~$19/mo): unlimited checks, monitoring + alerts, Ask Holly, reports.
- Team/API: seats, workspace, higher API quotas, SAR export.
- Lovable-managed Stripe, `subscriptions` table, `useSubscription` gate, upgrade modal, `/settings`.

### Phase 4 — Credibility for buyers
- Publish a methodology page: data sources, sync cadence, what each rule means, known limitations.
- Run against a labelled set of known-bad and known-good addresses and publish precision/recall.
- Add data-retention and terms pages.

---

## Suggested first slice

Phase 0 plus Phase 1. It is a small amount of work, it removes every claim the product cannot defend, and it turns one-shot visitors into returning users — which must exist before billing is worth building.
