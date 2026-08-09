# Rìan — Blockchain Risk & Compliance Intelligence

Rìan tells you whether a crypto wallet is safe to transact with — in one click for everyday
users, and with full investigation depth for compliance teams.

**Live:** https://tryrian.lovable.app

---

## What it does

### For everyday crypto users
- **Pre-send check (`/safe`)** — paste any BTC / ETH / SOL address and get a plain-English
  verdict: *Likely safe*, *Proceed with caution*, or *Do not send*, with a 0–100 risk score,
  shareable result links and one-tap sharing.
- **Wallet Health Check (`/health`)** — connect a browser wallet (MetaMask, Rabby, Coinbase
  Wallet — anything that injects `window.ethereum`) or paste an address, and Rìan walks the
  wallet's entire transaction graph to find every counterparty it has ever touched, then flags
  OFAC-sanctioned entities, known mixer contracts, wallet age and activity patterns.

### For compliance and investigations teams
- **Wallet risk analysis** — multi-chain lookups (Bitcoin, Ethereum, Solana) with risk factor
  breakdowns, entity attribution, geographic risk, volume intelligence and counterparty profiling.
- **Real OFAC sanctions screening** — the OFAC SDN crypto address list is synced daily into the
  database and matched directly; hits are surfaced with entity name, source list and program.
- **Interactive transaction graph** — clickable nodes and edges with a slide-in detail panel
  showing risk tags, transaction IDs and dates; animated flows for high-risk paths.
- **Cross-wallet cluster view** — union-find clustering that groups investigations sharing
  counterparties, exposing hidden links across cases.
- **Ask Holly (AI)** — a conversational compliance investigator grounded in the current
  investigation context, including one-click generation of a compliance-ready **SAR narrative**.
- **Case management** — case IDs, statuses, analyst assignment, notes threads and audit logs.
- **Wallet monitoring + alerts** — watch wallets, get real re-screened risk scores on a daily
  cron, with realtime in-app alerts (bell + toast).
- **Reporting & export** — PDF / regulator-ready reports, CSV / XLSX exports, email report
  delivery, and an executive **Org Pulse** dashboard with KPIs and charts.

### For developers and AI agents
- **Public REST API v1** — self-serve API keys (SHA-256 hashed at rest), per-minute sliding
  window rate limiting and monthly quotas. Endpoints: `/v1/screen`, `/v1/screen/batch`,
  `/v1/sanctions/check`, `/v1/me`. Docs and key management live at `/api-docs`.
- **MCP server** — connect Rìan to ChatGPT, Claude, Cursor or Lovable chat over OAuth 2.1.
  Tools: `analyze_wallet`, `screen_address`, `list_investigations`, `get_investigation`,
  `list_watched_wallets`, `watch_wallet`, `unwatch_wallet`, `list_alerts`.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite 5 |
| Styling | Tailwind CSS 3 + shadcn/ui (Radix), custom neon / aurora dark design system with semantic risk tokens |
| Data & state | TanStack Query, React Context |
| Charts & viz | Recharts, custom SVG transaction graph |
| Routing | React Router 6 |
| Backend | Lovable Cloud (Supabase): PostgreSQL, Auth, Realtime, Edge Functions (Deno) |
| AI | Lovable AI Gateway (Google Gemini) for AI summaries and Ask Holly |
| Agent integration | `@lovable.dev/mcp-js` MCP server with Supabase OAuth 2.1 |
| Chain data | Etherscan V2 (via a server-side proxy), Blockstream, Solana JSON-RPC |
| Sanctions data | OFAC SDN crypto address list, synced daily via `pg_cron` |
| Reports | jsPDF, papaparse, xlsx |

---

## Edge functions

| Function | Purpose |
| --- | --- |
| `safe-check` | Public verdict engine behind `/safe`, with a 15-minute result cache |
| `wallet-health-check` | Authenticated full counterparty scan behind `/health` |
| `api` | Public REST API v1 (auth, rate limits, quotas, screening endpoints) |
| `ask-holly` | Streaming AI compliance assistant + SAR narrative drafting |
| `ai-summary` | Generates AI summaries for investigation records |
| `etherscan-proxy` | Server-side Etherscan calls so the API key never reaches the browser |
| `sync-sanctions` | Daily OFAC SDN address sync (03:00 UTC) |
| `wallet-monitor` | Daily re-screen of watched wallets; raises threshold-crossing alerts |
| `wallet-cache-write` | Writes the 5-minute TTL chain-data cache |
| `write-audit-log` | Server-side audit trail writes |
| `send-report-webhook` | Outbound report delivery |
| `mcp` | Auto-generated MCP server (built from `src/lib/mcp/`) |

The shared screening engine lives in `supabase/functions/_shared/screening.ts`, so `/safe`,
the public API and wallet monitoring always return identical verdicts.

---

## Database

PostgreSQL with Row Level Security on every table. Key tables:

- `profiles`, `user_roles` — accounts and roles (roles are stored separately from profiles)
- `investigation_records` — investigations, risk scores, analysis data and AI summaries
- `risk_factors`, `sanctions_screening` — per-investigation risk detail
- `sanctions_addresses` — synced OFAC SDN crypto addresses
- `watched_wallets`, `watch_alerts` — monitoring and realtime alerts
- `wallet_cache` — 5-minute TTL cache for chain lookups
- `public_checks` — cached public `/safe` verdicts
- `api_keys`, `api_requests` — hashed developer keys, usage and quotas
- `audit_logs` — system audit trail

---

## Security

- Row Level Security on all tables; roles held in a dedicated `user_roles` table and checked
  through a `SECURITY DEFINER` `has_role()` function to avoid recursive policies.
- No third-party API keys in client code — Etherscan traffic is proxied server-side.
- API keys are stored as SHA-256 hashes; the plaintext secret is shown once at creation.
- Rate limiting and monthly quotas on the public API.
- MCP access is protected by OAuth 2.1 with a consent screen at `/.lovable/oauth/consent`;
  every MCP tool runs as the signed-in analyst under RLS.
- Audit logging on critical operations.

---

## Getting started

```bash
npm install
npm run dev
```

The app runs on `http://localhost:8080`. Backend, secrets and edge functions are managed by
Lovable Cloud — there is no `.env` to fill in for local development.

## Routes

| Route | Description |
| --- | --- |
| `/` | Landing page |
| `/safe`, `/safe/check/:address` | Consumer pre-send check |
| `/health` | Wallet Health Check |
| `/dashboard`, `/record/:recordId` | Analyst dashboard and investigation view |
| `/wallets/:recordId/flow` | Interactive transaction flow graph |
| `/cases`, `/all-records`, `/bulk-analysis`, `/audit-logs` | Case and record management |
| `/api-docs` | API documentation and key management |
| `/auth` | Sign in / sign up |
