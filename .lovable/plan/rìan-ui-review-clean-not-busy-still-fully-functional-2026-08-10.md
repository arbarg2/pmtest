# Rìan UI Review: Clean, Not Busy, Still Fully Functional

## The honest verdict

The app is feature-rich but visually scattered. Three concrete problems:

**1. The wallet report is a 12-section vertical wall.**
`EnhancedWalletResults` stacks, in one scroll: Verdict banner, Wallet overview, Holly AI, Entity Attribution + Geographic Risk, Volume Intelligence, Risk Factors + Sanctions, Provenance, SAR draft, Transaction Flow + Counterparties, Regulator Justification, Case Management, and (for cases) Notes + Export. Everything is equal weight, so nothing reads as the answer. A compliance officer has to scroll past evidence tooling to find the verdict context.

**2. The dashboard stacks four full-width "hero" blocks.**
`/dashboard` renders Org Pulse (KPI tiles + pie + area charts), then the lookup card, then Cluster View, then `AnalystDashboard` (its own stat cards + tabs + records table). Two separate stats systems compete on one page, and the primary action — look up a wallet — is buried below the fold.

**3. Two visual systems are running at once.**
`/`, `/dashboard`, `/safe` use the neon/aurora system (`bg-mesh`, `text-aurora`, glow tokens). But the wallet report, `/all-records` and several panels use hardcoded `slate-50/blue-50/slate-900`, `bg-blue-600`, `text-white`. Moving between screens feels like two different products, and those hardcoded classes bypass theming.

Also: primary navigation lives only inside the avatar dropdown, so the app's breadth is invisible.

## Proposed improvements (no functional changes)

### A. Give the wallet report a spine (tabs, not deletion)
Keep every component, mounted with all existing props and callbacks. Reorganise below the Verdict banner into four tabs:

- **Overview** — Wallet Overview, Holly AI, Entity Attribution, Geographic Risk, Volume Intelligence
- **Risk & Sanctions** — Risk Factors, Sanctions Panel, Transaction Flow, Counterparties
- **Evidence** — Provenance, SAR draft, Regulator Justification
- **Case** — Case Management, Analyst Notes, Export Actions

Verdict banner stays pinned above the tabs — the answer is always on screen. Nothing is removed, nothing is unwired; the same tree renders inside tab panels.

### B. Calm the dashboard
- Lookup card moves to the top, directly under the header, as the clear primary action.
- Org Pulse collapses to a single compact KPI strip; its charts move behind an "Analytics" toggle that is closed by default.
- Cluster View moves into the existing `AnalystDashboard` tab set as a "Clusters" tab rather than a fourth full-width block.
- Remove the duplicated stat cards inside `AnalystDashboard` since Org Pulse already covers them (display only — the data loading stays).

### C. One visual system
- Replace hardcoded `slate-*` / `blue-600` / `text-white` in the wallet report, `AllRecords`, and `UserDropdown` with the existing semantic tokens (`bg-background`, `bg-card`, `text-foreground`, `bg-primary`, `text-primary-foreground`).
- Dial the decorative layer down: keep the aurora mesh on the marketing/`/safe` surfaces, reduce it to a subtle single wash on working screens so data reads first.
- Standardise section headings, card padding, and spacing to one scale across pages.

### D. Make navigation visible
Add a shared app header with real nav links (Dashboard, Records, Cases, Bulk, Audit, API) plus alerts and the avatar menu, used across the authenticated pages. The avatar dropdown keeps its items so nothing breaks; the header just surfaces them.

## Not changing

No routes, data fetching, services, edge functions, database, auth, or component props. This is presentation-layer only, so all current behaviour — analysis, alerts, Holly, SAR, exports, case flow — works exactly as it does now.

## Technical notes

- Tabs use the existing shadcn `Tabs` primitives; all report children stay mounted with their current props so refs (`analystNotesRef`) and callbacks continue to work.
- `AskHollyChat`, `EmailReportDialog`, `AlertsBell` remain untouched at the page level.
- Suggested sequencing: (C) tokens → (A) report tabs → (B) dashboard → (D) shared header, verifying the app in the browser after each step.
