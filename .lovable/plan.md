# Plan: Turn Rìan into a daily-use safety tool for crypto holders

Today Rìan is a heavy compliance/analyst console. To make it something **everyday crypto holders open daily**, we'll add a consumer "Safety" layer on top of the existing engine — same risk + sanctions data, but reframed for "should I send / should I worry" moments.

We'll ship in 4 phases. Each phase is independently usable and shippable.

---

## Phase 1 — The Daily Hooks (web app)

A new `/safe` consumer surface, separate from the analyst dashboard, with 4 tools any user understands:

### 1.1 Pre-Send Safety Check
- Big single input: "Paste any address before you send."
- One-screen verdict: **SAFE / CAUTION / DANGER**, plain-English reasons (e.g. "Linked to known drainer", "Flagged on OFAC", "Brand new wallet, 0 history").
- Big copy/share button → generates a public share URL `/safe/check/:address` (anyone can view, no login).
- Reuses existing `enhancedApi` + `screenSanctions` + `riskFactors`.

### 1.2 Wallet Health Dashboard ("My Wallet")
- Connect wallet (read-only — wagmi + viem, no signing) OR paste address.
- Health score 0–100, exposure breakdown (mixers, sanctions, scam contracts), counterparty reputation, a "What changed this week" timeline.
- One-tap **Watch this wallet** → fires existing `watch_alerts` realtime + email/push.

### 1.3 Token Approval Scanner & Revoker
- For an EVM address, list active ERC-20/721 approvals (via Etherscan logs through existing `etherscan-proxy`).
- Risk-tag each spender (known scam / unknown / verified protocol).
- "Revoke" button builds an `approve(spender, 0)` tx for the user to sign in their wallet.

### 1.4 Whale & Smart-Money Feed ("Pulse")
- Curated list of tracked wallets (whales, funds, known scammers).
- Realtime feed of notable moves with one-line Holly explanations ("Whale X moved $4M USDC to Binance — likely sell").
- Users can follow wallets → personal feed.

All 4 share a new bottom nav on mobile and a left rail on desktop. Analyst dashboard stays at `/dashboard`; landing routes free users to `/safe`.

---

## Phase 2 — Holly for Humans

Repurpose the existing `ask-holly` edge function with a second persona: **"Explain like I hold crypto."**
- On any verdict screen: "Why is this risky?" → 3 short bullets, no jargon.
- Quick prompts: "Is this a scam?", "Should I revoke?", "What's a mixer?".
- Same streaming chat UI, lighter visual treatment.

---

## Phase 3 — Browser Extension (MV3)

- Popup: paste-address check + current page address detection (auto-pulls addresses from Etherscan, OpenSea, X profiles).
- Content script injects a small **risk badge** next to addresses on Etherscan, X/Twitter, and Discord web.
- Pre-send guardrail: detects MetaMask `eth_sendTransaction` and shows an interstitial with the recipient's risk before approval.
- Packaged as `/public/rian-safe.zip` with one-click download from `/safe` page.

---

## Phase 4 — Telegram Bot

- `/check 0xabc…` → instant verdict in chat.
- `/watch 0xabc…` → subscribe; bot pings on risk-score change or large outflow (uses existing realtime `watch_alerts`).
- `/whale` → daily digest of biggest moves.
- Built via Lovable's Telegram connector + a `telegram-webhook` edge function writing into a new `telegram_subscriptions` table.

---

## Technical notes

- **Reuse, don't rebuild**: all 4 features run on the existing `enhancedApi`, `riskFactors`, `screenSanctions`, `watched_wallets`, `watch_alerts`, `ask-holly`, and `etherscan-proxy`.
- **New tables**: `public_checks` (cached shareable verdicts, anonymous-readable), `followed_wallets` (consumer-light version of watched_wallets, no analyst metadata), `telegram_subscriptions` (chat_id ↔ wallet).
- **New edge functions**: `safe-check` (public, rate-limited, no auth), `approvals-scan`, `whale-feed-cron`, `telegram-webhook`.
- **Auth**: `/safe/check/:address` is fully public; Watch/Approvals require sign-in (existing email + Google).
- **Design**: keep the dark Premium Ocean palette but a more consumer-friendly variant — bigger type, traffic-light verdict colors, generous whitespace; analyst console untouched.
- **Mobile-first** for `/safe` — current app is desktop-leaning.

---

## Suggested build order

1. Phase 1.1 (Pre-Send Check) + new `/safe` shell + share URLs — fastest path to a viral, login-less hook.
2. Phase 1.2 (Wallet Health) + wagmi connect.
3. Phase 1.3 (Approval Revoker) — high retention.
4. Phase 2 (Holly for Humans) layered on 1.1–1.3.
5. Phase 1.4 (Whale Feed) — needs background cron.
6. Phase 3 (Extension).
7. Phase 4 (Telegram Bot).

Want me to start with Phase 1.1 + the `/safe` shell, or scope differently?
