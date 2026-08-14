# Make Rìan Enterprise-Credible: No Fabricated Data, Deterministic SAR Prose, B2B Hero

Three tactical lockdowns. Each is independent and none change existing working flows.

## 1. Eradicate mock fallbacks (highest priority)

Confirmed fabricated-data paths in the code today:

- `src/components/TransactionGraph.tsx` — on any real-data failure it calls `generateMockGraphData()` (hardcoded nodes incl. a Tornado Cash-style label) and renders a "Mock Data" banner. This is the one in the screenshot.
- `src/services/realBlockchainAPI.ts` — `generateMockSolanaTransactions()` and `generateMockTokenAccounts()` invent Solana signatures and token balances.
- `src/services/sanctionsApi.ts` — `getMockSanctionsResults()` returns invented "OFAC SDN List (Mock)" / "EU Consolidated List (Mock)" hits, and it is used as a *catch-block fallback*, not just under the dev flag.
- `src/services/lookupRecords.ts` — generates mock transactions for lookup records.
- `src/services/api.ts` — mock analysis result stub.
- `src/components/InvestigationRecords.tsx` — renders a hardcoded `mockRecords` array.

Changes:

- Delete every mock generator listed above and all their call sites. No `import.meta.env` mock mode for sanctions — screening never fabricates.
- Replace each fallback with one of three honest states:
  - **Empty**: "No transaction graph data available for this address." with the chain and lookback window stated.
  - **Unavailable**: "Chain data provider unavailable (rate limited / error). Try again." with a Retry button and the provider name.
  - **Not supported**: for Solana transaction/token detail, state plainly that Solana is screening-only, matching the existing landing-page disclaimer.
- Distinguish "verified zero" from "could not verify" everywhere a count or verdict is shown — a failed fetch must never render as a clean/low-risk result. Where the risk engine loses an input, mark the verdict as partial ("Screened with incomplete data: transaction history unavailable") rather than showing a confident score.
- `InvestigationRecords` reads real rows from `investigation_records`, with a real empty state.

## 2. Lock down "Ask Holly" SAR narratives

Current gap: `supabase/functions/ask-holly/index.ts` builds its context from `body.context` — whatever the browser sends. The model is told not to invent, but nothing enforces it, and a caller can supply arbitrary "facts".

Changes to the edge function:

- Accept only identifiers from the client (`record_id` / wallet address + workspace), never facts. Server re-fetches evidence with the service client after an ownership/workspace-membership check (same gate already used by `sar-generate`).
- Build the evidence block server-side from deterministic rows only: risk factors with their trigger codes and severities, `sanctions_addresses` matches with source list, program and list ID, `malicious_addresses` matches with source and tag, counterparties, and the exact timestamps and data-source provenance for each.
- Every evidence item is passed with a stable citation id (e.g. `[E1]`), and the system prompt requires each factual statement in the narrative to carry the id of the evidence item it came from. Any section without evidence must render the fixed string "No evidence on record" — the model may not fill a gap.
- Prompt is reduced to a formatter role: it converts the evidence block into the existing 8-section SAR template in regulatory prose. Explicit prohibition on new addresses, amounts, dates, entities, list names, or regulatory conclusions not present in the evidence block.
- Post-generation guard in the function: scan the output for 0x/BTC/Solana address patterns and for list names, and reject/flag any token not present in the evidence block before returning it.
- Persist the exact evidence block alongside each generated draft in `sar_drafts` so a reviewer can see what the narrative was derived from (audit trail).
- Free-form chat mode keeps working, but SAR mode is a separate, locked path with the above rules.

## 3. Sharpen the landing hero for B2B

Keep the retail Safe Check as the secondary path — it is the top-of-funnel — but lead with institutional positioning.

- Replace "Don't get rugged. / Check before you sign." with institutional-grade framing: multi-chain sanctions and scam-address intelligence, evidence-bound SAR narrative generation, and agentic MCP/API workflows.
- Primary CTA becomes the compliance/API path ("Book a compliance walkthrough" or "Get API access"); "Run a free Safe Check" becomes the secondary button.
- Sub-headline names the three institutional proof points: live OFAC SDN sync, ~5.6k tagged scam/drainer addresses with sources, audited screening decisions.
- Keep the honest coverage disclaimer (BTC + ETH full, Solana screening only) and the methodology link.
- Add a short "Built for compliance teams" strip: audit trail, workspace RBAC, signed webhooks, public API, MCP agent access — all already shipped.

## Technical notes

- Files touched: `TransactionGraph.tsx`, `realBlockchainAPI.ts`, `sanctionsApi.ts`, `lookupRecords.ts`, `api.ts`, `InvestigationRecords.tsx`, `enhancedApi.ts` (error surfacing), `supabase/functions/ask-holly/index.ts`, `src/components/holly/AskHollyChat.tsx`, `src/pages/Landing.tsx`.
- Possible schema addition: an `evidence` JSON column on `sar_drafts` if one is not already present.
- No changes to the risk engine's scoring logic, the sync jobs, the public API, or MCP.
