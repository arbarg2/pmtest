# Is Rìan too busy? Honest answer: yes, in specific places

Not the whole app. The information is good; it's the *packaging* that's noisy. Three concrete problems show up on every screenshot.

## 1. The same facts are shown two or three times

Record page (`/record/:id`): the verdict banner already shows risk score, network, transaction count and OFAC hits. Directly below it, "Wallet Overview" repeats risk score, network, transactions and analysis time as four more big stat tiles. Two paragraphs later the AI summary states the same numbers again in prose.

Dashboard: the records section renders a card titled "Investigation Records" with a record count and a "View All" button, wrapping a "Filters & Search" card, wrapping a second card also titled "Investigation Records (7)" with a second "Refresh" button next to the one already in the toolbar above.

## 2. Contradictory numbers undermine trust

The record banner reads "0 transactions · 0ms analysis" while the AI summary on the same screen says 1000 transactions and 157 counterparties. A compliance user notices this instantly.

The Holly panel shows "Behavioral Score 8.5/10, Confidence 87%, Alerts 3" — these look fixed rather than derived from the record. Any hardcoded metric on a compliance screen is worse than no metric.

## 3. Two visual languages fighting

The landing page runs light with a pastel aurora and glass cards, then drops into a green-bordered "Try It Now" block that belongs to a different design. The saved project direction is a dark premium palette; the app currently renders light. Whatever the choice, it should be one choice.

## What I'd change (no functionality removed)

Record page
- Delete the "Wallet Overview" stat tiles; the verdict banner is the single source for score/network/transactions. Keep only what the banner doesn't show (address, first seen, last active) as one thin line.
- Make the banner's transaction count and timing read from the same analysis data the summary uses, so the numbers agree — or hide a metric when it is genuinely unknown instead of printing 0.
- Collapse the AI summary to executive summary + key findings, with "Show full report" to expand.
- Audit the Holly behavioural/confidence/alert tiles: derive them from the record, or remove them.

Dashboard
- One "Investigation Records" heading, one Refresh, filters as an inline toolbar row rather than a nested card.
- Reduce the lookup panel's three marketing tiles ("Real-Time Analysis / Risk Assessment / Compliance Ready") to a single line of supporting text — they're brochure copy on a working screen.

Landing
- Re-skin the "Try It Now" sample-address block into the same glass card style as "What Rìan checks", and confirm one theme (dark or light) end to end.

## Technical notes

Touches presentation only: `src/components/EnhancedWalletResults.tsx`, `VerdictBanner`, `HollyAIAnalysis.tsx`, `InvestigationRecordsTable.tsx` / `LookupRecordsTable.tsx`, `WalletLookupPanel.tsx`, `src/pages/Landing.tsx`. The Holly-metrics item is the only one that may need a data-source change; if the values can't be derived, they get removed rather than faked. No schema, edge function or scoring logic changes.

## Sequence

1. Record page de-duplication + number consistency
2. Dashboard heading/filter flattening
3. Holly panel metric audit
4. Landing page style unification
