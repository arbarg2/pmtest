// Autonomous recursive investigation agent.
//
// Walks the transaction tree downstream from a high-risk address (up to
// `depth_limit` hops), screening every hop with the same evidence-bound
// screening engine the rest of Rìan uses, classifying unknown Ethereum
// contracts from on-chain bytecode/verified-source metadata, and finally
// drafting a citation-bound investigative narrative.
//
// Safety rails (background job contract):
//   * bounded work per run (NODE_BATCH) and per trace (node_budget)
//   * single-flight lease claim per trace
//   * idempotent progress: every node row is marked done as it is processed
//   * circuit breaker: AI 402/403 pauses the whole job in agent_job_state
//   * every entry point checks the paused state first
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { screenAndLog } from "../_shared/screening.ts";
import { isAuthorizedCronCall } from "../_shared/cron-auth.ts";
import { enqueueTrace } from "../_shared/trace-enqueue.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const JOB = "trace_agent";
const NODE_BATCH = 6;          // addresses expanded per invocation
const MAX_TRACES_PER_RUN = 2;  // traces advanced per invocation
const CHILDREN_PER_NODE = 3;   // downstream counterparties followed per hop
const LEASE_MS = 4 * 60 * 1000;

const ETHERSCAN = "https://api.etherscan.io/v2/api?chainid=1";

// ------------------------------------------------------------------ job state

async function getJobState(admin: any) {
  const { data } = await admin.from("agent_job_state").select("*").eq("job", JOB).maybeSingle();
  return data ?? { job: JOB, status: "active", reason: null };
}

async function pauseJob(admin: any, reason: string) {
  await admin.from("agent_job_state").upsert({
    job: JOB, status: "paused", reason, paused_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  });
}

async function resumeJob(admin: any) {
  await admin.from("agent_job_state").upsert({
    job: JOB, status: "active", reason: null, paused_at: null, updated_at: new Date().toISOString(),
  });
}

// -------------------------------------------------------------- chain helpers

interface Edge {
  tx_hash?: string;
  value?: number;
  asset?: string;
  timestamp?: string | null;
  direction?: "out" | "in";
}
interface Child { address: string; edge: Edge }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let lastEs = 0;

/** Etherscan V2 call with throttling + rate-limit retry (free tier is 5 req/s and bursts easily). */
async function esFetch(qs: string): Promise<any> {
  const key = Deno.env.get("ETHERSCAN_API_KEY") ?? "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const gap = 400 - (Date.now() - lastEs);
    if (gap > 0) await sleep(gap);
    lastEs = Date.now();
    const res = await fetch(`${ETHERSCAN}&${qs}&apikey=${key}`);
    if (!res.ok) {
      await sleep(800);
      continue;
    }
    const j = await res.json().catch(() => ({}));
    const r = j?.result;
    if (typeof r === "string" && /rate limit|invalid api key|notok/i.test(r)) {
      console.warn("etherscan throttled", r.slice(0, 80));
      await sleep(1500);
      continue;
    }
    return j;
  }
  return null;
}

async function ethOutflows(address: string): Promise<Child[]> {
  const j = await esFetch(
    `module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc`,
  );
  if (!Array.isArray(j?.result)) {
    console.warn("ethOutflows no tx list", JSON.stringify(j ?? {}).slice(0, 160));
    return [];
  }
  const txs: any[] = j.result;


  const agg = new Map<string, { value: number; tx: any }>();
  for (const t of txs) {
    if (String(t.from ?? "").toLowerCase() !== address.toLowerCase()) continue;
    const to = String(t.to ?? "").toLowerCase();
    if (!/^0x[a-f0-9]{40}$/.test(to)) continue;
    const v = Number(t.value ?? 0) / 1e18;
    if (v <= 0) continue;
    const cur = agg.get(to);
    if (cur) cur.value += v;
    else agg.set(to, { value: v, tx: t });
  }
  return [...agg.entries()]
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, CHILDREN_PER_NODE)
    .map(([addr, m]) => ({
      address: addr,
      edge: {
        tx_hash: m.tx.hash,
        value: Number(m.value.toFixed(6)),
        asset: "ETH",
        timestamp: m.tx.timeStamp ? new Date(Number(m.tx.timeStamp) * 1000).toISOString() : null,
        direction: "out" as const,
      },
    }));
}

async function btcOutflows(address: string): Promise<Child[]> {
  const res = await fetch(`https://blockstream.info/api/address/${address}/txs`);
  if (!res.ok) return [];
  const txs: any[] = await res.json().catch(() => []);
  const agg = new Map<string, { value: number; tx: any }>();
  for (const t of (Array.isArray(txs) ? txs : []).slice(0, 25)) {
    const spentByUs = (t.vin ?? []).some(
      (i: any) => i?.prevout?.scriptpubkey_address?.toLowerCase() === address.toLowerCase(),
    );
    if (!spentByUs) continue;
    for (const o of t.vout ?? []) {
      const a = o?.scriptpubkey_address;
      if (!a || a.toLowerCase() === address.toLowerCase()) continue;
      const v = Number(o.value ?? 0) / 1e8;
      if (v <= 0) continue;
      const cur = agg.get(a);
      if (cur) cur.value += v;
      else agg.set(a, { value: v, tx: t });
    }
  }
  return [...agg.entries()]
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, CHILDREN_PER_NODE)
    .map(([addr, m]) => ({
      address: addr,
      edge: {
        tx_hash: m.tx.txid,
        value: Number(m.value.toFixed(8)),
        asset: "BTC",
        timestamp: m.tx.status?.block_time ? new Date(m.tx.status.block_time * 1000).toISOString() : null,
        direction: "out" as const,
      },
    }));
}

/** Classify an unknown Ethereum address from bytecode + verified source metadata. */
async function classifyEth(address: string): Promise<{ classification: string; labels: string[] }> {
  const labels: string[] = [];
  try {
    const codeJson = await esFetch(`module=proxy&action=eth_getCode&address=${address}&tag=latest`);
    const code = codeJson?.result;
    if (typeof code !== "string" || !/^0x[0-9a-fA-F]*$/.test(code)) {
      return { classification: "unknown", labels: [] };
    }
    if (code === "0x") return { classification: "eoa", labels: ["externally owned account"] };

    const srcJson = await esFetch(`module=contract&action=getsourcecode&address=${address}`);
    const src = srcJson?.result?.[0] ?? {};
    const name: string = src?.ContractName ?? "";
    const verified = !!(src?.SourceCode && String(src.SourceCode).length > 0);
    if (name) labels.push(`contract: ${name}`);
    labels.push(verified ? "verified source" : "unverified bytecode");

    labels.push(`bytecode ${Math.round((String(code).length - 2) / 2)} bytes`);

    const n = name.toLowerCase();
    let classification = verified ? "contract_verified" : "contract_unverified";
    if (/tornado|mixer|privacy/.test(n)) classification = "mixer_contract";
    else if (/router|swap|pool|uniswap|pancake|curve/.test(n)) classification = "dex_contract";
    else if (/bridge|portal|wormhole|hop|across/.test(n)) classification = "bridge_contract";
    else if (/token|erc20|coin/.test(n)) classification = "token_contract";
    else if (/proxy|beacon/.test(n)) classification = "proxy_contract";
    return { classification, labels };
  } catch {
    return { classification: "unknown", labels: [] };
  }
}

// ------------------------------------------------------------------- worker

async function advanceTrace(admin: any, trace: any): Promise<"paused" | "done" | "partial"> {
  const { data: pending } = await admin
    .from("agent_trace_nodes")
    .select("*")
    .eq("trace_id", trace.id)
    .eq("status", "pending")
    .order("depth", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(NODE_BATCH);

  let processed = 0;
  let maxRisk = Number(trace.max_downstream_risk ?? 0);
  let nodesDone = Number(trace.nodes_done ?? 0);

  for (const node of pending ?? []) {
    if (nodesDone >= trace.node_budget) break;
    try {
      const result = await screenAndLog(admin, node.address, {
        source: "app",
        workspaceId: trace.workspace_id ?? null,
      });

      let classification: string | null = null;
      let labels: string[] = [];
      if (node.network === "ethereum" && !result.entity.name) {
        const c = await classifyEth(node.address);
        classification = c.classification;
        labels = c.labels;
      }

      await admin.from("agent_trace_nodes").update({
        status: "done",
        verdict: result.verdict,
        risk_score: result.risk_score,
        entity_name: result.entity.name,
        entity_category: result.entity.category,
        classification,
        labels,
        evidence: {
          reasons: result.reasons,
          sanctions: result.sanctions,
          malicious: result.malicious,
          balance: result.data.balance,
          tx_count: result.data.tx_count,
          block_height: result.provenance.block_height,
          ruleset_version: result.provenance.ruleset_version,
          decision_id: result.decision_id,
          evaluated_at: result.provenance.evaluated_at,
        },
      }).eq("id", node.id);

      processed++;
      nodesDone++;
      if (node.depth > 0) maxRisk = Math.max(maxRisk, result.risk_score);

      // Expand downstream unless we're at the depth limit or out of budget
      const isTerminalEntity = ["exchange", "sanctioned"].includes(result.entity.category);
      if (node.depth < trace.depth_limit && nodesDone < trace.node_budget && !isTerminalEntity) {
        let children: Child[] = [];
        if (node.network === "ethereum") children = await ethOutflows(node.address);
        else if (node.network === "bitcoin") children = await btcOutflows(node.address);

        console.log(`node ${node.address} depth ${node.depth}: ${children.length} children`);
        for (const child of children) {
          const ins = await admin.from("agent_trace_nodes").insert({
            trace_id: trace.id,
            parent_id: node.id,
            address: child.address,
            network: node.network,
            depth: node.depth + 1,
            status: "pending",
            edge: child.edge,
          }).select("id").maybeSingle();
          if (ins.error) console.log("child insert skipped", child.address, ins.error.message);
          // duplicate addresses in the same trace hit the unique index and are skipped
        }
      }
    } catch (e) {
      await admin.from("agent_trace_nodes").update({
        status: "error",
        error: e instanceof Error ? e.message : String(e),
      }).eq("id", node.id);
      nodesDone++;
    }
  }

  const { count: stillPending } = await admin
    .from("agent_trace_nodes")
    .select("*", { count: "exact", head: true })
    .eq("trace_id", trace.id)
    .eq("status", "pending");

  const budgetSpent = nodesDone >= trace.node_budget;
  const finished = budgetSpent || (stillPending ?? 0) === 0;

  if (!finished) {
    await admin.from("agent_traces").update({
      status: "queued",
      nodes_done: nodesDone,
      max_downstream_risk: maxRisk,
      lease_expires_at: null,
    }).eq("id", trace.id);
    return "partial";
  }

  // ---- finalise: draft a citation-bound narrative from the mapped tree ----
  const narrativeOutcome = await draftNarrative(admin, trace);
  if (narrativeOutcome === "paused") {
    await admin.from("agent_traces").update({
      status: "queued",
      nodes_done: nodesDone,
      max_downstream_risk: maxRisk,
      lease_expires_at: null,
    }).eq("id", trace.id);
    return "paused";
  }

  await admin.from("agent_traces").update({
    status: "complete",
    nodes_done: nodesDone,
    max_downstream_risk: maxRisk,
    narrative: narrativeOutcome.narrative,
    narrative_validation: narrativeOutcome.validation,
    completed_at: new Date().toISOString(),
    lease_expires_at: null,
  }).eq("id", trace.id);
  return "done";
}

async function draftNarrative(
  admin: any,
  trace: any,
): Promise<"paused" | { narrative: string; validation: Record<string, unknown> }> {
  const { data: nodes } = await admin
    .from("agent_trace_nodes")
    .select("*")
    .eq("trace_id", trace.id)
    .order("depth", { ascending: true })
    .order("created_at", { ascending: true });

  const rows = nodes ?? [];
  const idFor = new Map<string, string>();
  rows.forEach((n: any, i: number) => idFor.set(n.id, `N${i + 1}`));

  const bundle = rows.map((n: any) => {
    const parent = n.parent_id ? idFor.get(n.parent_id) : null;
    const edge = n.edge ?? {};
    const reasons = (n.evidence?.reasons ?? []).map((r: any) => r.text).slice(0, 4).join(" ");
    return `[${idFor.get(n.id)}] hop ${n.depth} · ${n.address} (${n.network})` +
      (parent ? ` · received ${edge.value ?? "?"} ${edge.asset ?? ""} from ${parent} in tx ${edge.tx_hash ?? "n/a"} at ${edge.timestamp ?? "unknown time"}` : " · ROOT SUBJECT") +
      ` · verdict ${n.verdict ?? "unscreened"} (${n.risk_score ?? "n/a"}/100)` +
      ` · entity ${n.entity_name ?? "unattributed"} [${n.entity_category ?? "unknown"}]` +
      (n.classification ? ` · on-chain classification: ${n.classification}${n.labels?.length ? ` (${n.labels.join(", ")})` : ""}` : "") +
      (reasons ? ` · findings: ${reasons}` : "");
  }).join("\n");

  const validIds = new Set(rows.map((n: any) => idFor.get(n.id)!));
  const knownAddresses = new Set(rows.map((n: any) => String(n.address).toLowerCase()));

  const system = `You are an autonomous blockchain forensic investigator writing the first draft of a multi-hop fund-flow investigation.

ABSOLUTE RULES:
- Only state facts present in the TRACE EVIDENCE below.
- Every factual sentence ends with citation markers referencing node IDs, e.g. [N3] or [N3][N7].
- Never invent addresses, amounts, transaction hashes, entity names, dates or hops.
- If a section has no supporting evidence, write exactly: "No supporting evidence on file."
- Be concise and operational — a compliance officer reads this before opening the case.

Produce these markdown sections:

### 1. Subject and Trigger
### 2. Fund Flow Path
### 3. Terminal Destinations
### 4. Unattributed or Obfuscated Hops
### 5. Why This Path Is Concerning
### 6. Recommended Analyst Actions

End with: "*Autonomous draft — every hop is machine-screened; analyst verification required before any filing or off-boarding decision.*"

SUBJECT: ${trace.root_address} (${trace.network}); trigger: ${trace.trigger_reason ?? "risk threshold"}; depth limit ${trace.depth_limit} hops.

TRACE EVIDENCE:
${bundle}`;

  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return { narrative: "", validation: { ok: false, issues: ["LOVABLE_API_KEY not configured"] } };

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: system },
        { role: "user", content: "Write the investigative narrative now, citing node IDs on every factual sentence." },
      ],
    }),
  });

  if (res.status === 402 || res.status === 403) {
    await pauseJob(admin, `AI gateway ${res.status}: ${await res.text().catch(() => "")}`.slice(0, 400));
    return "paused";
  }
  if (res.status === 429 || res.status >= 500) {
    return "paused"; // transient — retried on the next scheduled run
  }
  if (!res.ok) {
    return { narrative: "", validation: { ok: false, issues: [`AI gateway error ${res.status}`] } };
  }

  const data = await res.json();
  const narrative = String(data?.choices?.[0]?.message?.content ?? "");

  const cited = [...narrative.matchAll(/\[(N\d+)\]/g)].map((m) => m[1]);
  const unknownCitations = [...new Set(cited)].filter((c) => !validIds.has(c));
  const addrs = [...narrative.toLowerCase().matchAll(/0x[a-f0-9]{40}|\b(?:1|3|bc1)[a-z0-9]{25,59}\b/g)].map((m) => m[0]);
  const hallucinated = [...new Set(addrs)].filter((a) => !knownAddresses.has(a));
  const issues: string[] = [];
  if (unknownCitations.length) issues.push(`Unknown citation ids: ${unknownCitations.join(", ")}`);
  if (!cited.length) issues.push("No citations present.");
  if (hallucinated.length) issues.push(`Addresses not present in trace: ${hallucinated.slice(0, 5).join(", ")}`);

  return { narrative, validation: { ok: issues.length === 0, issues, citations: [...new Set(cited)] } };
}

async function runWorker(admin: any, opts: { traceId?: string | null } = {}) {
  const state = await getJobState(admin);
  const paused = state.status === "paused";

  let query = admin
    .from("agent_traces")
    .select("*")
    .in("status", ["queued", "running"])
    .or(`lease_expires_at.is.null,lease_expires_at.lt.${new Date().toISOString()}`)
    .order("created_at", { ascending: true })
    .limit(paused ? 1 : MAX_TRACES_PER_RUN); // paused: one probe trace only
  if (opts.traceId) query = admin.from("agent_traces").select("*").eq("id", opts.traceId).limit(1);

  const { data: candidates } = await query;
  const results: Record<string, string> = {};

  for (const trace of candidates ?? []) {
    // single-flight claim: only one runner wins the compare-and-set on `runs`
    const { data: claimed } = await admin
      .from("agent_traces")
      .update({
        status: "running",
        runs: (trace.runs ?? 0) + 1,
        lease_expires_at: new Date(Date.now() + LEASE_MS).toISOString(),
        started_at: trace.started_at ?? new Date().toISOString(),
      })
      .eq("id", trace.id)
      .eq("runs", trace.runs ?? 0)
      .select("*")
      .maybeSingle();
    if (!claimed) {
      results[trace.id] = "locked";
      continue;
    }

    try {
      const outcome = await advanceTrace(admin, claimed);
      results[trace.id] = outcome;
      if (outcome === "done" && paused) await resumeJob(admin); // successful probe clears the pause
    } catch (e) {
      results[trace.id] = "error";
      await admin.from("agent_traces").update({
        status: "failed",
        error: e instanceof Error ? e.message : String(e),
        lease_expires_at: null,
      }).eq("id", trace.id);
    }
  }

  return { job_status: paused ? "paused" : "active", traces: results };
}

// -------------------------------------------------------------------- server

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "enqueue");

    if (action === "run") {
      const cronOk = await isAuthorizedCronCall(req, admin);
      let userOk = false;
      const authHeader = req.headers.get("Authorization") ?? "";
      if (!cronOk && authHeader.startsWith("Bearer ")) {
        const { data: claims } = await admin.auth.getClaims(authHeader.replace("Bearer ", ""));
        userOk = !!claims?.claims?.sub;
      }
      if (!cronOk && !userOk) return json({ error: "Unauthorized" }, 401);
      return json(await runWorker(admin, { traceId: body.trace_id ?? null }));
    }

    if (action === "enqueue") {
      const authHeader = req.headers.get("Authorization") ?? "";
      if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
      const { data: claims, error: authErr } = await admin.auth.getClaims(authHeader.replace("Bearer ", ""));
      if (authErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
      const userId = claims.claims.sub as string;

      const address = String(body.address ?? "").trim();
      if (!address) return json({ error: "address required" }, 400);

      const trace = await enqueueTrace(admin, {
        address,
        network: body.network ?? null,
        record_id: body.record_id ?? null,
        workspace_id: body.workspace_id ?? null,
        created_by: userId,
        source: String(body.source ?? "app"),
        trigger_reason: body.trigger_reason ?? "Analyst requested autonomous trace",
        depth_limit: Number(body.depth_limit ?? 3),
      });

      // Kick the worker immediately for this trace so the analyst sees progress.
      if (!trace.reused) {
        // @ts-ignore EdgeRuntime is provided by the Supabase runtime
        if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
          // @ts-ignore
          EdgeRuntime.waitUntil(runWorker(admin, { traceId: trace.id }).catch((e) => console.error("worker", e)));
        }
      }
      return json(trace);
    }

    return json({ error: `Unknown action "${action}"` }, 400);
  } catch (e) {
    console.error("trace-agent error", e);
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});
