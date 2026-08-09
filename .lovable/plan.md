# Plan: Make Rìan a Real, Sellable Product

## Goal

Turn Rìan from an impressive demo into a product real people use and pay for, by adding three things: a **Wallet Health Check** (the consumer hook), **Alert Delivery** (makes monitoring real), and **Stripe billing** (makes it a business).

## Current State (verified)

- Wallet monitoring works but the `wallet-monitor` edge function uses **mock random risk scores** (`Math.random()`) — not real data.
- Alerts exist only in the in-app bell + toast (realtime subscription on `watch_alerts`). Nothing reaches the user externally.
- The entire app is free — no billing, no tiers, no paywall.
- `/safe` only checks **someone else's** address. There is no way to scan **your own** wallet's exposure.
- Etherscan proxy, OFAC sanctions table, wallet cache, and risk infrastructure all work and can be reused.

---

## Feature 1: Wallet Health Check (the consumer hook)

The question everyday crypto users have: *"Is MY wallet clean — have I ever sent to or received from a sanctioned address, a mixer, or a drainer?"*

### What to build

**New page `/health`** with a "Connect Wallet" flow:
- Injected EVM wallet connection via `window.ethereum` (MetaMask, Coinbase Wallet, Rabby, etc. all inject — covers most users without a heavy WalletConnect dependency).
- On connect, read the user's address and kick off the health scan.

**New edge function `wallet-health-check`:**
1. Accept an address (authenticated — the user is signed in).
2. Fetch the wallet's full outgoing + incoming transaction history (ETH via the existing `etherscan-proxy` logic, BTC via Blockstream).
3. Extract all unique **counterparty addresses** the wallet has interacted with.
4. Batch-query those counterparties against the `sanctions_addresses` table — flag any direct OFAC matches.
5. Apply heuristic risk screening: mixer exposure, drainer/sweeper patterns (high outbound frequency), newly-created counterparties, and overall activity age.
6. Return a structured health report: `{ verdict, risk_score, sanctioned_contacts: [...], mixer_exposure, total_counterparties, risk_reasons }`.
7. Save as an `investigation_records` row so it appears in the dashboard history.

**Frontend Wallet Health Report card:**
- Reuse the `VerdictBanner` / `VerdictCard` visual style (animated risk gauge, risk-tier colors).
- Show: overall verdict (Clean / Caution / Danger), list of sanctioned counterparties found (if any), mixer/drainer exposure flags, counterparty count, wallet age.
- "Share my health report" button (Twitter + copy link — reuse the `/safe` share pattern).
- Mobile-first, since this is the consumer-facing feature.

### Why this is the right consumer feature
It reframes the value prop from "check someone else" to "check yourself." A clean bill of health is shareable/viral. A dirty one is actionable. It produces exactly the exposure data compliance teams care about, bridging both audiences with one flow.

---

## Feature 2: Alert Delivery (makes monitoring real)

Monitoring is useless if the user has to be staring at the dashboard. Alerts need to reach them where they are.

### What to build

**Telegram bot alert delivery** (crypto-native, no domain verification needed, well-supported via the connector gateway):
- Connect the Telegram connector to the project (`standard_connectors--connect`).
- New `telegram_alert_prefs` table: stores `user_id` → `chat_id` mapping (set when the user starts the bot).
- New `telegram-webhook` edge function: receives `/start` from the user's Telegram, stores their `chat_id` linked to their Rìan account (via a link token in the bot message). Secured with `X-Telegram-Bot-Api-Secret-Token`.
- Modify `wallet-monitor` to, after creating a `watch_alerts` row, look up the user's Telegram `chat_id` and push the alert via the connector gateway (`POST connector-gateway.lovable.dev/telegram/sendMessage`).
- Dashboard "Connect Telegram" button in a new Settings section: generates a deep link to the bot with the user's link token.

**Make wallet-monitor use real risk scores** (not mock random):
- Replace the `Math.random()` simulation with a real re-check: call the same screening logic as `safe-check` (sanctions lookup + chain data via the existing etherscan/blockstream fetchers) and compare against the stored `current_risk_score`.
- Only create alerts when a real risk change crosses the threshold.

### Tables / migrations
- `telegram_alert_prefs` (user_id uuid, chat_id bigint, link_token text, connected_at timestamptz, enabled boolean). RLS: user owns their row.

---

## Feature 3: Stripe Billing (turns it into a business)

### Tiers
| | Free | Pro ($19/mo) |
|---|---|---|
| Safe checks | 5 / day | Unlimited |
| Wallet Health Check | 1 free scan | Unlimited |
| Wallet monitoring + alerts | — | ✓ |
| Ask Holly AI | — | ✓ |
| Bulk screening | — | ✓ |
| PDF / SAR reports | — | ✓ |
| Telegram alert delivery | — | ✓ |
| Dashboard + history | ✓ | ✓ |

### What to build
1. Run `payments--recommend_payment_provider` to confirm Stripe fit.
2. Enable Lovable-managed Stripe via `payments--enable_stripe_payments` (no Stripe account needed by the user).
3. Create two Stripe products: **Free** (zero price, for the plan) and **Pro** ($19/mo subscription).
4. New `subscriptions` table (or extend `profiles`): tracks `stripe_customer_id`, `subscription_status` (`free` / `pro`), `current_period_end`. RLS: user reads own row.
5. New edge function `stripe-webhook`: handles `checkout.session.completed` and `customer.subscription.updated/deleted` events → updates subscription status in DB.
6. New hook `useSubscription`: reads the user's tier from the DB, exposed app-wide via context.
7. **Feature gates**: wrap Pro features (monitoring, Holly, bulk, reports, health scans beyond free limit) with a check — show an "Upgrade to Pro" upgrade card/modal when a free user hits a gate.
8. **Settings page** (`/settings`): shows current plan, usage, upgrade/downgrade buttons (Stripe Customer Portal link), and Telegram connection toggle.
9. Stripe checkout: "Upgrade to Pro" button → Stripe-hosted checkout session → redirect back to dashboard on success.

---

## Implementation Order

```
Phase 1 — Wallet Health Check (independent, highest user value)
  · wallet-health-check edge function
  · /health page + wallet connect + report card
  · wire into landing page + dashboard nav

Phase 2 — Alert Delivery
  · Connect Telegram connector
  · telegram_alert_prefs table + telegram-webhook edge function
  · Real risk scores in wallet-monitor
  · Telegram push in wallet-monitor + Settings connect button

Phase 3 — Stripe Billing
  · recommend_payment_provider → enable_stripe_payments
  · Products (Free + Pro)
  · subscriptions table + stripe-webhook edge function
  · useSubscription hook + feature gates + upgrade modal
  · /settings page (plan, usage, portal link)
  · Gate Pro features from Phase 1 & 2 behind Pro tier
```

Phase 1 and 2 can proceed in parallel. Phase 3 gates the Phase 1/2 Pro features last.

---

## Files to create
- `supabase/functions/wallet-health-check/index.ts`
- `supabase/functions/telegram-webhook/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `src/pages/Health.tsx` (Wallet Health Check page)
- `src/pages/Settings.tsx` (plan + Telegram + usage)
- `src/components/wallet/WalletHealthReport.tsx` (report card)
- `src/components/wallet/ConnectWalletButton.tsx`
- `src/hooks/useSubscription.ts`
- `src/contexts/SubscriptionContext.tsx` (or fold into existing)
- `src/components/UpgradeModal.tsx`
- DB migration: `telegram_alert_prefs`, `subscriptions` tables

## Files to modify
- `src/App.tsx` — add `/health` and `/settings` routes
- `src/pages/Landing.tsx` — add "Check My Wallet" CTA
- `src/pages/Index.tsx` — add nav links to Health + Settings
- `supabase/functions/wallet-monitor/index.ts` — real risk scores + Telegram push
- `supabase/config.toml` — `verify_jwt = false` for telegram-webhook
- Feature-gated components: `AskHollyChat`, `BulkAnalysis`, `ReportGenerator`, `WatchWalletButton`
