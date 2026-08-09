# Enterprise Hardening: Provenance, Precision, Permissions

Turn Rìan from a strong prototype into a tool a regulated compliance team can defend to an auditor. Four workstreams, shipped in order.

## 1. Data provenance and immutable decision logging

Every verdict becomes reproducible evidence.

- New `screening_decisions` table: address, network, verdict, risk score, ruleset version, chain block height, raw upstream payload hashes, full provider responses (JSONB), evaluated rule list with per-rule contribution, actor (user or API key), created_at. Append-only — no update/delete grants, no delete policy.
- New `rulesets` table with a semantic version and the JSON rule definitions active at each point in time. The screening engine reads the active ruleset and stamps its version and hash onto every decision.
- `_shared/screening.ts` returns a `provenance` block: block height at evaluation, provider (Etherscan/Blockstream/Solana RPC) plus response timestamps, sanctions list snapshot date, ruleset version.
- Every decision writes a row: from `/safe`, the dashboard, the public API, MCP tools, and the monitor job — one shared writer so no path escapes logging.
- Case and record views gain an "Evidence" tab showing the decision trail: what was known, when, from which source, under which rules.

## 2. Defensible SAR generation

Holly stops free-writing and starts citing.

- SAR generation switches to a constrained pipeline: the app assembles a structured evidence bundle (decision IDs, OFAC entries with list ID and listing date, rule triggers with scores, counterparty rows), and Holly may only narrate facts present in that bundle.
- Each narrative claim carries an inline citation marker tied to an evidence ID; the UI renders a numbered evidence appendix under the draft.
- A post-generation validator rejects and regenerates any narrative containing figures or addresses absent from the bundle.
- SAR drafts are persisted with the evidence bundle snapshot so a re-read three months later shows the exact inputs.

## 3. Entity attribution and configurable risk

Cut false positives with context.

- New `entity_attributions` table: address or contract, entity name, entity category (exchange, OTC desk, DEX contract, bridge, mixer, gambling, sanctioned, unhosted), confidence, source, verified_at. Seeded with well-known contracts and exchange deposit clusters, extendable per tenant.
- Screening resolves attribution before scoring; a DEX router or known CEX hot wallet no longer inflates risk the way an unhosted fresh wallet does. Verdict copy names the entity type explicitly.
- New `risk_policies` table scoped to a workspace: verdict thresholds, per-rule weights, per-category overrides (e.g. mixer exposure = auto-block for a custodian, caution for a DeFi app), and a "block list" of categories. Policies are versioned and stamped into decisions.
- Settings UI to edit a policy with a live preview: replay the last N screenings against the draft policy and show how verdicts would shift before saving.

## 4. Workspaces, permissions, signed webhooks

- New `workspaces` and `workspace_members` tables with roles: owner, compliance_officer, analyst, legal, viewer. All case, record, watch, alert, API-key, and decision tables gain `workspace_id`, and RLS moves from `user_id = auth.uid()` to workspace membership checked through a security-definer function.
- Role capability matrix enforced in RLS, not just UI: analysts create and edit their own cases; compliance officers see and reassign all workspace cases; legal reads cases and SAR drafts without editing investigation data; viewers read dashboards only. SAR drafts are restricted to compliance officer, legal, and the owning analyst.
- Workspace switcher plus a members page with invitations and role changes.
- Outbound webhooks table (endpoint, secret, event subscriptions). All outbound deliveries — risk change, case escalation, sanctions hit — send an HMAC-SHA256 signature over timestamp plus raw body in a `X-Rian-Signature` header with a replay-guard timestamp, mirroring Stripe's scheme. Delivery attempts, response codes, and retries are logged and visible in settings, with a docs snippet showing verification.

## Technical notes

- All new public-schema tables ship with explicit GRANTs and RLS in the same migration; append-only tables get no UPDATE/DELETE grants at all.
- The workspace migration backfills a personal workspace per existing user and moves current rows into it, so nothing existing breaks.
- Ruleset and policy versions are immutable rows; editing creates a new version so historical decisions still resolve their exact logic.
- Webhook secrets are generated server-side and revealed once at creation.

## Suggested order

1. Provenance and decision logging (foundation everything else cites)
2. Entity attribution and configurable risk policies
3. Workspaces and role-scoped RLS
4. Signed webhooks and delivery log
5. Defensible SAR pipeline on top of 1 and 2
