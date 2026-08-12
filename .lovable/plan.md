# Rìan — Phases 0, 1, 2 and 4 (monetisation deferred)

Goal: make every claim on the site true, give users a reason to come back, sharpen the wedge, and make the product defensible to a compliance buyer. No billing in this scope.

---

## Phase 0 — Integrity pass

Make the product honest before anything else.

1. **Token approval scanning (build the claim, don't delete it).**
   - New shared module `supabase/functions/_shared/approvals.ts`: for an ETH address, pull ERC-20 `Approval` logs via the Etherscan proxy, reduce to current allowances per (token, spender), and flag: unlimited allowances, allowances to addresses in `malicious_addresses`, and allowances to contracts with no name tag.
   - Return `{ risky_approvals: [...], unlimited_count, total_spenders }`.
   - Surface in `wallet-health-check` output and as a new screening reason (`risky_approval`) when the address being screened is a known drainer spender.
2. **Drop the unbacked "fake tokens" claim** from `Landing.tsx` copy; replace with "approval & drainer exposure", which will then be real.
3. **Real ticker.** Replace the hardcoded `tickerItems` array in `Landing.tsx` with the most recent rows from `public_checks` (address truncated, verdict chip). If the table is empty, hide the ticker rather than faking it.
4. **Solana honesty.** Label Solana as "Beta — sanctions + balance only" in `/safe` and the network badge, and make `/health` show an explicit "Solana not supported yet" state instead of a generic rejection.
5. **BTC counterparty truncation.** Paginate Blockstream `/txs/chain/:last_txid` in `wallet-health-check` up to a sane cap (e.g. 500 txs), and label the figure "based on last N transactions" when capped.
6. **Delete `src/components/ReportGenerator.tsx`** (orphaned duplicate of `services/reportExport.ts`).

## Phase 1 — Retention loop

7. **Watch CTA where intent is highest.** Surface watch on the `/safe` verdict card and the `/health` report.
   - Signed in → `watched_wallets` via the existing service.
   - Signed out → localStorage watchlist + a single "sign in to get alerts" prompt.
   - Reuse `WatchWalletButton`, but add a compact variant (no required reason, default threshold) so the consumer flow stays one tap.
8. **Deep-linkable health reports.** Persist each health report and add `/health/report/:id` so shares land on the actual result instead of the generic page. Public read of the report row only (no user identity attached).
9. **External alerts.** Send an email when `wallet-monitor` raises a threshold-crossing alert, using the project's transactional email setup. Per-user toggle stored on `profiles`.

## Phase 2 — Sharpen the wedge

10. **"Is it safe to sign this?"** becomes the primary consumer surface: one input, one verdict, with three fixed evidence blocks — sanctions, scam/drainer lists, and approval exposure. Reorder `/safe` and the landing hero around this single question; move everything else below the fold.
11. **One-tap escalation** from the consumer verdict into the analyst console (`investigation_records` → `/record/:id`) for signed-in users.

## Phase 4 — Credibility

12. **Methodology page (`/methodology`)**: every data source, sync cadence, what each rule means and its weight, and an explicit "known limitations" section (Solana depth, one-hop counterparty scan, BTC caps). Linked from the verdict card's evidence basis line.
13. **Accuracy benchmark**: a script that screens a labelled set of known-bad (OFAC, tagged drainers) and known-good (major exchanges, ENS treasury) addresses, plus a results section on `/methodology`. Only published numbers we actually measure.
14. **Owner-authored `/security` and `/terms` pages** covering data retention, sub-processors and vulnerability reporting, linked from the footer alongside the existing privacy policy.

---

## Order of work

```
Phase 0 → Phase 1 → Phase 2 → Phase 4
```
Phase 0 items 2-6 are quick and land first. The approval scanner (item 1) is the largest single piece and is the foundation of the Phase 2 wedge, so it lands before Phase 2 starts.

## Main files

Create: `supabase/functions/_shared/approvals.ts`, `src/pages/Methodology.tsx`, `src/pages/Security.tsx`, `src/pages/Terms.tsx`, `src/components/wallet/ApprovalExposure.tsx`, `src/components/wallet/QuickWatchButton.tsx`, benchmark script, migration for health reports + alert-email preference.

Modify: `Landing.tsx`, `Safe.tsx`, `Health.tsx`, `App.tsx`, `_shared/screening.ts`, `wallet-health-check/index.ts`, `wallet-monitor/index.ts`.

Delete: `src/components/ReportGenerator.tsx`.

## Out of scope
Stripe, plans, quotas and any paywall — deferred until the product earns it.
