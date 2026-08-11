# Plan: Make Rìan the tool people reach for daily

## Goal

Make the product elicit two reactions: a retail crypto user sees it and thinks *"oh fuck, I'd use this all the time"*, and a compliance-team member thinks *"I can't believe how easy and functional this is compared to Chainalysis/Elliptic."* No billing, no new surface area — just make what's here genuinely trustworthy and habit-forming.

## Why this plan (grounded in verified reads)

The core screening engine is genuinely real and solid — real Etherscan V2, Blockstream, Solana RPC calls; real OFAC lookup; real provenance with block height + payload hashes; immutable decision logging. That's a strong, defensible foundation.

But three cracks would make a real user lose trust the moment they test it:

1. **The landing page promises things the engine doesn't do.** `Landing.tsx` (lines 150-152) advertises *"Spots drainers, fake tokens, and risky token approvals before you sign."* The screening engine (`screening.ts`) only does: OFAC sanctions, entity attribution, mixer/gambling labels, and a `sweeper_pattern` heuristic (high outbound frequency). It has **no drainer-contract database, no fake-token detection, no token-approval scanning.** A retail user who comes for "drainer detection" and tests a known drainer contract gets a clean verdict → instant distrust, never returns.

2. **Solana is a stub.** `fetchSol()` (`screening.ts` lines 189-209) fetches only `getBalance`. `txCount=0`, `firstSeen=null`, `txs=[]` → no behavioral rules ever fire. Solana is the biggest scam/memecoin chain, and the landing promises "BTC, ETH, and Solana." A Solana user gets a useless verdict.

3. **The Safe Check is a dead end.** `Safe.tsx`'s `SafeCheckRunner` shows a verdict + share buttons, then the user leaves. No "watch this address," no history, no reason to return. There's no daily-habit loop, and the monitoring infrastructure that already exists is never offered to the free consumer flow.

---

## Pillar 1: Real scam & drainer detection (deliver the landing's promise)

The single most "oh fuck" feature for retail: actually catching the scams they fear. Today the engine misses every non-OFAC scam.

### Build
- **`malicious_addresses` table** (address, network, category `drainer|scam|honeypot|phisher`, label, source, added_at) with RLS: public read (verdicts must work anon), service_role write. Mirror the `sanctions_addresses` pattern.
- **`sync-malicious` edge function** — daily sync from free open-source community feeds (e.g. the GitHub-maintained Ethereum drainer/phishing registries). Same `pg_cron` pattern as `sync-sanctions`.
- **Wire the screening engine** (`screening.ts`): add `lookupMalicious(supabase, address)` alongside `lookupSanctions`. Fire a `known_scam` / `known_drainer` rule (severity high, score 90-100) with the source label as evidence. A known drainer → instant DANGER verdict.
- **Fake-token signal** (ETH): if the address is a token contract, fetch its basic info via the Etherscan proxy and flag tokens with zero legit liquidity / brand-new deployer — a leading scam indicator. Keep this heuristic-only (label clearly, don't over-claim).

### Why this is the "oh fuck" moment
A user about to send to a drainer gets a red DANGER with "Known drainer contract — listed by [source]." That's the exact save-your-funds moment that makes someone tell everyone. It also makes the landing page honest.

---

## Pillar 2: Real Solana support (make the third chain useful)

### Build
- Extend `fetchSol()` to call `getSignaturesForAddress` (limit 50) → real `txCount`, `firstSeen` (oldest signature timestamp), and a counterparty set.
- Adapt the behavioral rules (`fresh_wallet`, `low_activity`, `new_age`, `established_history`) to fire on Solana signatures — they already key off `chain.txCount` and `chain.firstSeen`, so populating those fields activates them with minimal change.
- Add the malicious-address lookup for Solana (Pillar 1's feed includes Solana addresses).

### Why
Solana scams/memecoins are a massive daily-use case. A working Solana verdict — not a balance-only stub — is what makes a Solana user stay.

---

## Pillar 3: The return loop (Safe Check → watch + history)

Turn the one-shot Safe Check into a daily habit. The monitoring infrastructure already exists (`watched_wallets`, `wallet-monitor`, realtime alerts bell) but is locked behind the dashboard and never offered to the free consumer flow.

### Build
- **"Watch this address" button** on the Safe Check result card:
  - Anonymous user → store the address in a `localStorage` watchlist (no account needed). Show "we'll alert you next time you check back."
  - Signed-in user → insert into `watched_wallets` (existing table) → real alerts via the existing `wallet-monitor` + realtime bell.
- **"Recently checked" strip** on the `/safe` landing: shows the user's last 5–10 checked addresses (localStorage, anon-friendly) with their verdict chips — instant recall and re-check on return.
- **One-click escalation to full investigation**: "Open in Pro Console" button on the verdict → creates an `investigation_records` row and routes to `/record/:id`. This is the bridge that turns a curious retail user into an engaged compliance user — the "I can't believe how easy this is" path.

### Why
This is the difference between "I tried it once" and "I use this all the time." The watch + history loop gives a reason to return; the escalation path makes the consumer→pro journey effortless.

---

## Pillar 4: Verdict trust + honest copy

### Build
- **Evidence basis on the verdict card**: show what the address was screened against — "Screened against OFAC SDN + 12,400 known scam/drainer addresses" — so users trust a SAFE verdict instead of wondering if it actually checked.
- **Fix landing copy** to match reality once Pillar 1 lands (or soften claims until then). Never advertise a detection the engine doesn't perform.
- **Data-source transparency**: link the malicious-address source(s) so a skeptical user can verify.

---

## Implementation order

```
Phase 1 — Trust (Pillar 1 + 2, can parallelize)
  · malicious_addresses table + sync-malicious edge function + pg_cron
  · lookupMalicious wired into screening.ts (new rule)
  · fetchSol extended with getSignaturesForAddress → real Solana verdicts

Phase 2 — Habit (Pillar 3)
  · localStorage watchlist + "Watch this address" on Safe verdict
  · "Recently checked" strip on /safe
  · "Open in Pro Console" escalation button

Phase 3 — Honesty (Pillar 4)
  · evidence-basis line on verdict cards
  · landing copy audit + fix
```

## Files to create
- `supabase/functions/sync-malicious/index.ts` (daily malicious-address sync)
- DB migration: `malicious_addresses` table (+ RLS: anon SELECT, service_role write)

## Files to modify
- `supabase/functions/_shared/screening.ts` — `lookupMalicious`, new `known_scam`/`known_drainer` rules, extended `fetchSol`
- `src/pages/Safe.tsx` — "Watch this address" button, "Recently checked" strip, "Open in Pro Console" escalation, evidence-basis line on verdict
- `src/pages/Health.tsx` — evidence-basis line on health verdict (reuse)
- `src/pages/Landing.tsx` — honest copy aligned to what the engine actually delivers

## Out of scope (explicitly)
- Billing/payments/Stripe (user rejected)
- Browser extension (separate codebase, future)
- New dashboard surface area
