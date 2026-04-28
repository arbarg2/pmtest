## Phase 1 Visual Polish — Scope

Four focused changes to the wallet results page and design tokens. No new pages, no info-architecture changes, no landing-page work.

### 1. Verdict banner with risk gauge (top of results)

New component `src/components/wallet/VerdictBanner.tsx` rendered at the top of `EnhancedWalletResults.tsx`, replacing nothing — it sits above the existing `WalletOverview`.

Contains:
- **Animated SVG risk gauge** (semicircular, 0–100) on the left. Stroke color bound to risk tier token (low/medium/high/critical). Score animates from 0 → final value over ~800ms using a small `useCountUp` hook (inline, no separate file needed).
- **Verdict copy** in the center: large tier label ("HIGH RISK", "CLEAR", etc.), one-sentence rationale built from `wallet.risk_level` + sanctions hit count + transaction count.
- **Sanctioned stripe**: if any OFAC hit exists for this address+network, a red bar across the top of the banner reading "OFAC SANCTIONED ADDRESS — BLOCK TRANSACTIONS". Queried with the same Supabase query `SanctionsHits` already uses, lifted into the banner so the verdict reflects truth on first paint.
- **KPI strip** on the right: 4 compact metrics (Risk Score, Transactions, Network, Analysis Time) with count-up on the numeric ones. Replaces the visual weight of the current 4-tile grid inside `WalletOverview` (the tiles stay for now to avoid breaking the tab; we just demote them visually by removing the gradient backgrounds — see step 4).

Banner uses `bg-card` with a subtle gradient border tinted by risk color, and the existing `primary-glow` / `accent-glow` utilities for the gauge ring.

### 2. Merge the two sanctions panels

Today the results page renders both `SanctionsHits` (real OFAC table lookup) and `SanctionsScreening` (heuristic matches from `riskFactors`). Users see two cards saying similar things. Consolidate into one component `src/components/wallet/SanctionsPanel.tsx` that:

- Runs the OFAC `sanctions_addresses` query (from `SanctionsHits`).
- Accepts the `matches: SanctionsMatch[]` prop (from `SanctionsScreening`).
- Renders a single card with two clearly-labeled sub-sections:
  - **Direct OFAC matches** (from the table query) — uses existing `SanctionsHits` row layout.
  - **Indirect / heuristic exposure** (from `matches`) — uses existing `SanctionsScreening` row layout, only shown when `matches.length > 0`.
- One header badge counting total findings across both sources, one summary alert prioritizing direct OFAC > indirect.
- Clean clear state when both are empty.

In `EnhancedWalletResults.tsx`:
- Remove the standalone `<SanctionsHits />` block (line 296–298).
- Replace `<SanctionsScreening matches={sanctionsMatches} />` in the grid with `<SanctionsPanel walletAddress={...} network={...} matches={sanctionsMatches} />`.
- The grid that paired Sanctions with `RiskFactorsBreakdown` keeps that pairing.

Old `SanctionsHits.tsx` and `SanctionsScreening.tsx` files stay on disk (other places may import them — verified during implementation) but are no longer used in the results page.

### 3. Monospace addresses + hashes

Add a small utility component `src/components/ui/mono.tsx` exporting `<Mono>` that renders `<span className="font-mono text-[0.92em] tracking-tight">`. Apply it everywhere a wallet address or tx hash currently renders as plain text:

- `WalletOverview.tsx` → the address block (already `font-mono`, switch to `<Mono>` for consistency + tighter tracking).
- New `VerdictBanner.tsx` → truncated address chip.
- New `SanctionsPanel.tsx` → matched address rows.
- `WalletHeader.tsx` (if it shows the address — verified during implementation).

No global font swap. No new font import. Uses Tailwind's default `font-mono` stack (already loaded).

### 4. Risk color tokens

Add four semantic risk tokens to `src/index.css` (light + dark) and expose them in `tailwind.config.ts`:

```
--risk-low:      142 71% 45%   /* emerald, reuses --success */
--risk-medium:   38 92% 50%    /* amber, reuses --warning */
--risk-high:     25 95% 53%    /* deep orange */
--risk-critical: 0 84% 60%     /* red, reuses --destructive */
```

Plus a tiny helper `src/lib/risk.ts`:
```ts
export const riskTier = (score: number) =>
  score >= 75 ? 'critical' : score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low';
export const riskClasses = (tier) => ({ text, bg, border, ring }) // returns Tailwind class strings
```

Use it in:
- `VerdictBanner` (gauge stroke + tier label).
- `WalletOverview` risk-score tile (replace the hard-coded `text-primary` with the risk-tier text class).
- `SanctionsPanel` summary alert.

Existing components that hard-code red/orange/yellow (`SanctionsScreening`, `WalletOverview` badge) are left untouched in this pass — only the new/edited components adopt the tokens. A follow-up pass can sweep the rest.

### What is explicitly NOT in this phase

- No three-act section reorganization.
- No `ResultsSubnav`, no `SectionHeader` component.
- No landing-page changes, no `LiveVerdictPreview`, no stats ticker.
- No new font imports (Geist/Space Grotesk deferred).
- No changes to `RiskFactorsBreakdown`, `EntityAttribution`, `GeographicRisk`, `VolumeIntelligence`, `CounterpartyIntelligence`, `TransactionFlowPreview`.

### Files touched

Created:
- `src/components/wallet/VerdictBanner.tsx`
- `src/components/wallet/SanctionsPanel.tsx`
- `src/components/ui/mono.tsx`
- `src/lib/risk.ts`

Edited:
- `src/components/EnhancedWalletResults.tsx` (add banner, swap sanctions blocks)
- `src/components/dashboard/WalletOverview.tsx` (mono address, risk-tier color on score tile, demote tile gradients)
- `src/index.css` (risk tokens light + dark)
- `tailwind.config.ts` (expose risk tokens)

### Risk / rollback

Each change is additive or a one-line swap. If the verdict banner looks off, removing one `<VerdictBanner />` line restores the prior page. The merged `SanctionsPanel` is wire-compatible with the props both old components received.