// Shared address screening engine used by `safe-check`, the public `api` function,
// the wallet monitor and the MCP tools.
//
// Every verdict produced here carries a full provenance block (block height,
// provider responses + timestamps, sanctions snapshot date, ruleset version) and
// an itemised list of the rules that fired, so a decision can be reproduced and
// defended months later.

export type Network = "bitcoin" | "ethereum" | "solana";

export type Reason = { type: string; severity: "low" | "medium" | "high"; text: string };

export type EntityCategory =
  | "exchange"
  | "otc_desk"
  | "dex_contract"
  | "bridge"
  | "mixer"
  | "gambling"
  | "sanctioned"
  | "unhosted";

export interface RuleHit {
  rule_id: string;
  severity: "low" | "medium" | "high";
  score: number;
  applied_score: number;
  description: string;
  evidence: Record<string, unknown>;
}

export interface RiskPolicy {
  id?: string | null;
  caution_threshold: number;
  danger_threshold: number;
  rule_weights: Record<string, number>;
  category_overrides: Record<string, number>;
  blocked_categories: string[];
}

export const DEFAULT_POLICY: RiskPolicy = {
  id: null,
  caution_threshold: 35,
  danger_threshold: 70,
  rule_weights: {},
  category_overrides: {},
  blocked_categories: [],
};

export interface Provenance {
  evaluated_at: string;
  block_height: number | null;
  ruleset_version: string;
  ruleset_hash: string | null;
  policy_id: string | null;
  sanctions_snapshot_date: string | null;
  providers: {
    name: string;
    endpoint: string;
    fetched_at: string;
    ok: boolean;
    status?: number;
    error?: string;
  }[];
  payload_hash: string | null;
}

export interface ScreenResult {
  address: string;
  network: Network;
  verdict: "safe" | "caution" | "danger";
  risk_score: number;
  reasons: Reason[];
  rules_evaluated: RuleHit[];
  entity: {
    name: string | null;
    category: EntityCategory;
    confidence: number;
    source: string | null;
  };
  data: {
    balance: number;
    tx_count: number;
    first_seen: number | null;
    sanctioned: boolean;
    short: string;
    entity_category: EntityCategory;
    entity_name: string | null;
  };
  sanctions?: {
    matched: boolean;
    entity_name?: string | null;
    source_list?: string | null;
    program?: string | null;
    date_listed?: string | null;
  };
  malicious?: {
    matched: boolean;
    category?: string | null;
    label?: string | null;
    source?: string | null;
  };
  provenance: Provenance;
  provider_payloads: Record<string, unknown>;
}

export function detectNetwork(address: string): Network | null {
  const a = address.trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(a)) return "ethereum";
  if (/^(1|3)[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(a)) return "bitcoin";
  if (/^bc1[a-z0-9]{39,59}$/.test(a)) return "bitcoin";
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a)) return "solana";
  return null;
}

export function shortAddr(a: string) {
  return a.length > 14 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

export async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------- chain data

type ChainData = {
  balance: number;
  txCount: number;
  firstSeen: number | null;
  txs: any[];
  blockHeight: number | null;
  raw: Record<string, unknown>;
  providers: Provenance["providers"];
};

async function fetchEth(address: string, etherscanKey: string): Promise<ChainData> {
  const base = "https://api.etherscan.io/v2/api?chainid=1";
  const balUrl = `${base}&module=account&action=balance&address=${address}&tag=latest&apikey=${etherscanKey}`;
  const txUrl = `${base}&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=25&sort=desc&apikey=${etherscanKey}`;
  const blockUrl = `${base}&module=proxy&action=eth_blockNumber&apikey=${etherscanKey}`;

  const [balRes, txRes, blockRes] = await Promise.all([fetch(balUrl), fetch(txUrl), fetch(blockUrl)]);
  const fetchedAt = new Date().toISOString();
  const bal = await balRes.json();
  const txs = await txRes.json();
  const blk = await blockRes.json().catch(() => ({}));

  const balance = bal?.result ? Number(bal.result) / 1e18 : 0;
  const txList: any[] = Array.isArray(txs?.result) ? txs.result : [];
  const firstSeen = txList.length ? Number(txList[txList.length - 1].timeStamp) * 1000 : null;
  const blockHeight = blk?.result ? parseInt(String(blk.result), 16) : null;

  return {
    balance,
    txCount: txList.length,
    firstSeen,
    txs: txList,
    blockHeight: Number.isFinite(blockHeight) ? blockHeight : null,
    raw: { balance: bal, txlist: { status: txs?.status, count: txList.length, sample: txList.slice(0, 5) }, block: blk },
    providers: [
      { name: "etherscan_v2", endpoint: balUrl.split("&apikey=")[0], fetched_at: fetchedAt, ok: balRes.ok, status: balRes.status },
      { name: "etherscan_v2", endpoint: txUrl.split("&apikey=")[0], fetched_at: fetchedAt, ok: txRes.ok, status: txRes.status },
      { name: "etherscan_v2", endpoint: blockUrl.split("&apikey=")[0], fetched_at: fetchedAt, ok: blockRes.ok, status: blockRes.status },
    ],
  };
}

async function fetchBtc(address: string): Promise<ChainData> {
  const endpoint = `https://blockstream.info/api/address/${address}`;
  const tipUrl = "https://blockstream.info/api/blocks/tip/height";
  const [r, tipRes] = await Promise.all([fetch(endpoint), fetch(tipUrl)]);
  const fetchedAt = new Date().toISOString();
  if (!r.ok) throw new Error(`Blockstream ${r.status}`);
  const d = await r.json();
  const tipText = tipRes.ok ? await tipRes.text() : "";
  const blockHeight = tipText ? Number(tipText) : null;

  const balance = ((d.chain_stats?.funded_txo_sum ?? 0) - (d.chain_stats?.spent_txo_sum ?? 0)) / 1e8;
  const txCount = (d.chain_stats?.tx_count ?? 0) + (d.mempool_stats?.tx_count ?? 0);
  return {
    balance,
    txCount,
    firstSeen: null,
    txs: [],
    blockHeight: Number.isFinite(blockHeight) ? blockHeight : null,
    raw: { address_stats: d, tip_height: blockHeight },
    providers: [
      { name: "blockstream", endpoint, fetched_at: fetchedAt, ok: r.ok, status: r.status },
      { name: "blockstream", endpoint: tipUrl, fetched_at: fetchedAt, ok: tipRes.ok, status: tipRes.status },
    ],
  };
}

async function fetchSol(address: string): Promise<ChainData> {
  const endpoint = "https://api.mainnet-beta.solana.com";
  const fetchedAt = new Date().toISOString();
  const providers: Provenance["providers"] = [];

  // Balance
  const balRes = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getBalance", params: [address] }),
  });
  const balJson = await balRes.json().catch(() => ({}));
  const balance = balJson?.result?.value ? balJson.result.value / 1e9 : 0;
  const slot = balJson?.result?.context?.slot ?? null;
  providers.push({ name: "solana_rpc", endpoint, fetched_at: fetchedAt, ok: balRes.ok, status: balRes.status });

  // Transaction history — getSignaturesForAddress gives real tx count + first-seen age
  let txCount = 0;
  let firstSeen: number | null = null;
  const txs: any[] = [];
  let sigOk = true;
  try {
    const sigRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 2, method: "getSignaturesForAddress",
        params: [address, { limit: 100 }],
      }),
    });
    sigOk = sigRes.ok;
    providers.push({ name: "solana_rpc", endpoint, fetched_at: fetchedAt, ok: sigRes.ok, status: sigRes.status });
    if (sigRes.ok) {
      const sigJson = await sigRes.json();
      const sigs: any[] = Array.isArray(sigJson?.result) ? sigJson.result : [];
      txCount = sigs.length;
      // Oldest signature is last (default order is newest-first)
      if (sigs.length) {
        const oldest = sigs[sigs.length - 1];
        if (oldest?.blockTime) firstSeen = oldest.blockTime * 1000;
      }
      txs.push(...sigs);
    }
  } catch (e) {
    sigOk = false;
    providers.push({ name: "solana_rpc", endpoint, fetched_at: fetchedAt, ok: false, error: String(e) });
  }

  return {
    balance,
    txCount,
    firstSeen,
    txs,
    blockHeight: typeof slot === "number" ? slot : null,
    raw: { getBalance: balJson, signatures: { count: txCount } },
    providers,
  };
}

// ------------------------------------------------------------ reference data

export async function lookupSanctions(supabase: any, address: string) {
  const { data } = await supabase
    .from("sanctions_addresses")
    .select("entity_name, source_list, program, date_listed, network, updated_at, metadata")
    .ilike("address", address)
    .maybeSingle();
  return data ?? null;
}

export async function lookupMalicious(supabase: any, address: string) {
  const { data } = await supabase
    .from("malicious_addresses")
    .select("address, network, category, label, source, source_url")
    .ilike("address", address)
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export async function lookupAttribution(
  supabase: any,
  network: Network,
  address: string,
  workspaceId?: string | null,
) {
  const { data } = await supabase
    .from("entity_attributions")
    .select("entity_name, entity_category, confidence, source, workspace_id")
    .eq("network", network)
    .ilike("address", address)
    .limit(5);
  const rows: any[] = data ?? [];
  // workspace-specific attribution beats the global curated one
  return rows.find((r) => workspaceId && r.workspace_id === workspaceId) ?? rows.find((r) => !r.workspace_id) ?? null;
}

export async function getActiveRuleset(supabase: any) {
  const { data } = await supabase
    .from("rulesets")
    .select("version, definition, definition_hash")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? { version: "unknown", definition: {}, definition_hash: null };
}

export async function getWorkspacePolicy(supabase: any, workspaceId?: string | null): Promise<RiskPolicy> {
  if (!workspaceId) return DEFAULT_POLICY;
  const { data } = await supabase
    .from("risk_policies")
    .select("id, caution_threshold, danger_threshold, rule_weights, category_overrides, blocked_categories")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return DEFAULT_POLICY;
  return {
    id: data.id,
    caution_threshold: Number(data.caution_threshold ?? 35),
    danger_threshold: Number(data.danger_threshold ?? 70),
    rule_weights: data.rule_weights ?? {},
    category_overrides: data.category_overrides ?? {},
    blocked_categories: data.blocked_categories ?? [],
  };
}

// --------------------------------------------------------------- the engine

export interface ScreenOptions {
  workspaceId?: string | null;
  policy?: RiskPolicy;
}

/** Full screen: attribution + sanctions + chain data + policy-weighted risk scoring. */
export async function screenAddress(
  supabase: any,
  rawAddress: string,
  opts: ScreenOptions = {},
): Promise<ScreenResult> {
  const address = rawAddress.trim();
  const network = detectNetwork(address);
  if (!network) throw new Error("Unsupported address format");

  const [sanctionsHit, maliciousHit, attribution, ruleset, policyResolved] = await Promise.all([
    lookupSanctions(supabase, address),
    lookupMalicious(supabase, address),
    lookupAttribution(supabase, network, address, opts.workspaceId),
    getActiveRuleset(supabase),
    opts.policy ? Promise.resolve(opts.policy) : getWorkspacePolicy(supabase, opts.workspaceId),
  ]);
  const policy = policyResolved ?? DEFAULT_POLICY;

  let chain: ChainData;
  try {
    if (network === "ethereum") {
      chain = await fetchEth(address, Deno.env.get("ETHERSCAN_API_KEY") ?? "");
    } else if (network === "bitcoin") {
      chain = await fetchBtc(address);
    } else {
      chain = await fetchSol(address);
    }
  } catch (e) {
    console.error("chain fetch failed", e);
    chain = {
      balance: 0, txCount: 0, firstSeen: null, txs: [], blockHeight: null, raw: {},
      providers: [{ name: network, endpoint: "n/a", fetched_at: new Date().toISOString(), ok: false, error: String(e) }],
    };
  }

  const category: EntityCategory = sanctionsHit
    ? "sanctioned"
    : ((attribution?.entity_category as EntityCategory) ?? "unhosted");
  const entityName: string | null = sanctionsHit?.entity_name ?? attribution?.entity_name ?? null;
  const isKnownService = ["exchange", "otc_desk", "dex_contract", "bridge"].includes(category);

  const rules: RuleHit[] = [];
  const reasons: Reason[] = [];

  const fire = (
    rule_id: string,
    severity: RuleHit["severity"],
    baseScore: number,
    description: string,
    evidence: Record<string, unknown> = {},
  ) => {
    const weight = Number(policy.rule_weights?.[rule_id] ?? 1);
    const applied = Math.round(baseScore * weight);
    rules.push({ rule_id, severity, score: baseScore, applied_score: applied, description, evidence });
    reasons.push({ type: rule_id, severity, text: description });
    return applied;
  };

  let score = fire("baseline", "low", 5, "Baseline risk applied to every address.", {});

  if (sanctionsHit) {
    score = Math.max(
      score,
      fire(
        "sanctions_direct",
        "high",
        100,
        `Direct OFAC match: ${sanctionsHit.entity_name ?? "Listed entity"} (${sanctionsHit.source_list ?? "OFAC"}${
          sanctionsHit.program ? `, program ${sanctionsHit.program}` : ""
        }${sanctionsHit.date_listed ? `, listed ${sanctionsHit.date_listed}` : ""}). Do NOT send funds.`,
        {
          source_list: sanctionsHit.source_list,
          entity_name: sanctionsHit.entity_name,
          program: sanctionsHit.program,
          date_listed: sanctionsHit.date_listed,
        },
      ),
    );
  }

  if (maliciousHit) {
    const cat = maliciousHit.category ?? "malicious";
    const isDrainer = cat === "drainer";
    score = Math.max(
      score,
      fire(
        isDrainer ? "known_drainer" : "known_scam",
        "high",
        isDrainer ? 95 : 90,
        `Known ${isDrainer ? "drainer" : "scam / phishing"} address${maliciousHit.label ? ` — ${maliciousHit.label}` : ""} (source: ${maliciousHit.source ?? "community registry"}). Do NOT send funds or approve transactions.`,
        { category: cat, label: maliciousHit.label, source: maliciousHit.source },
      ),
    );
  }

  if (attribution && !sanctionsHit) {
    const label: Record<string, string> = {
      exchange: "a known centralised exchange address",
      otc_desk: "a known OTC desk",
      dex_contract: "a decentralised exchange smart contract",
      bridge: "a cross-chain bridge contract",
      mixer: "a mixing / tumbling service",
      gambling: "a gambling service",
      unhosted: "an unhosted personal wallet",
    };
    fire(
      "entity_attribution",
      category === "mixer" || category === "gambling" ? "high" : "low",
      0,
      `Attributed to ${attribution.entity_name} — ${label[category] ?? category} (source: ${attribution.source}).`,
      { entity_name: attribution.entity_name, category, confidence: attribution.confidence, source: attribution.source },
    );
    if (category === "mixer") {
      score = Math.max(score, fire("mixer_entity", "high", 85, "Address belongs to a mixing service. High regulatory exposure.", { category }));
    } else if (category === "gambling") {
      score = Math.max(score, fire("gambling_entity", "medium", 45, "Address belongs to a gambling service.", { category }));
    }
  }

  // Behavioural rules — suppressed for attributed services where they are noise.
  if (!isKnownService) {
    if (chain.txCount === 0) {
      score = Math.max(score, fire("fresh_wallet", "medium", 45, "Brand-new wallet with zero on-chain history. Cannot verify reputation.", { tx_count: 0 }));
    } else if (chain.txCount < 5) {
      score = Math.max(score, fire("low_activity", "medium", 30, `Only ${chain.txCount} transactions on record. Limited reputation signal.`, { tx_count: chain.txCount }));
    } else {
      fire("established_history", "low", 0, `${chain.txCount}+ transactions on record. Established on-chain history.`, { tx_count: chain.txCount });
    }

    if (chain.firstSeen) {
      const ageDays = (Date.now() - chain.firstSeen) / (1000 * 60 * 60 * 24);
      if (ageDays < 7) {
        score = Math.max(score, fire("new_age", "medium", 40, `Wallet first seen ${Math.max(1, Math.round(ageDays))} day(s) ago.`, { age_days: Math.round(ageDays) }));
      } else if (ageDays > 365) {
        fire("mature_age", "low", 0, `Wallet active for over ${Math.round(ageDays / 365)} year(s).`, { age_days: Math.round(ageDays) });
      }
    }

    if (network === "ethereum" && chain.txs.length >= 10) {
      const recent = chain.txs.slice(0, 20);
      const outbound = recent.filter((t) => t.from?.toLowerCase() === address.toLowerCase()).length;
      if (outbound > 15) {
        score = Math.max(score, fire("sweeper_pattern", "medium", 55, "High outbound transaction frequency — consistent with drainer/sweeper patterns.", { outbound_of_20: outbound }));
      }
    }
  } else {
    fire(
      "service_context",
      "low",
      0,
      "Behavioural heuristics suppressed: address is an attributed service, where high throughput and age are expected.",
      { category },
    );
  }

  if (chain.balance > 0) {
    fire("balance", "low", 0, `Holds ${chain.balance.toFixed(4)} ${network.toUpperCase()}.`, { balance: chain.balance });
  }

  // Policy category overrides / hard blocks
  const override = policy.category_overrides?.[category];
  if (typeof override === "number") {
    score = Math.max(score, fire("policy_category_override", "high", override, `Workspace policy assigns a floor risk of ${override} to category "${category}".`, { category, override }));
  }
  const blocked = (policy.blocked_categories ?? []).includes(category);
  if (blocked) {
    score = Math.max(score, fire("policy_blocked_category", "high", 100, `Workspace policy blocks all transactions with category "${category}".`, { category }));
  }

  score = Math.min(100, Math.max(0, score));
  const verdict = score >= policy.danger_threshold ? "danger" : score >= policy.caution_threshold ? "caution" : "safe";

  const provider_payloads = chain.raw;
  const payload_hash = await sha256Hex(JSON.stringify(provider_payloads));

  const provenance: Provenance = {
    evaluated_at: new Date().toISOString(),
    block_height: chain.blockHeight,
    ruleset_version: ruleset.version,
    ruleset_hash: ruleset.definition_hash ?? null,
    policy_id: policy.id ?? null,
    sanctions_snapshot_date: sanctionsHit?.updated_at ?? null,
    providers: chain.providers,
    payload_hash,
  };

  return {
    address,
    network,
    verdict,
    risk_score: score,
    reasons,
    rules_evaluated: rules,
    entity: {
      name: entityName,
      category,
      confidence: Number(attribution?.confidence ?? (sanctionsHit ? 1 : 0.3)),
      source: attribution?.source ?? (sanctionsHit ? "OFAC" : null),
    },
    data: {
      balance: chain.balance,
      tx_count: chain.txCount,
      first_seen: chain.firstSeen,
      sanctioned: !!sanctionsHit,
      malicious: !!maliciousHit,
      short: shortAddr(address),
      entity_category: category,
      entity_name: entityName,
    },
    sanctions: {
      matched: !!sanctionsHit,
      entity_name: sanctionsHit?.entity_name ?? null,
      source_list: sanctionsHit?.source_list ?? null,
      program: sanctionsHit?.program ?? null,
      date_listed: sanctionsHit?.date_listed ?? null,
    },
    malicious: {
      matched: !!maliciousHit,
      category: maliciousHit?.category ?? null,
      label: maliciousHit?.label ?? null,
      source: maliciousHit?.source ?? null,
    },
    provenance,
    provider_payloads,
  };
}

// ------------------------------------------------------- immutable decision log

export interface DecisionActor {
  source: "safe" | "app" | "api" | "mcp" | "monitor" | "health";
  userId?: string | null;
  apiKeyId?: string | null;
  workspaceId?: string | null;
}

/** Append-only write of a screening decision. Never throws — logging must not break a screen. */
export async function logDecision(supabase: any, result: ScreenResult, actor: DecisionActor) {
  try {
    const { data, error } = await supabase
      .from("screening_decisions")
      .insert({
        workspace_id: actor.workspaceId ?? null,
        user_id: actor.userId ?? null,
        api_key_id: actor.apiKeyId ?? null,
        source: actor.source,
        address: result.address,
        network: result.network,
        verdict: result.verdict,
        risk_score: result.risk_score,
        ruleset_version: result.provenance.ruleset_version,
        ruleset_hash: result.provenance.ruleset_hash,
        policy_id: result.provenance.policy_id,
        block_height: result.provenance.block_height,
        entity_category: result.entity.category,
        rules_evaluated: result.rules_evaluated,
        provenance: result.provenance,
        provider_payloads: result.provider_payloads,
        payload_hash: result.provenance.payload_hash,
        sanctions_snapshot_date: result.provenance.sanctions_snapshot_date,
      })
      .select("id")
      .maybeSingle();
    if (error) {
      console.warn("decision log failed", error.message);
      return null;
    }
    return data?.id ?? null;
  } catch (e) {
    console.warn("decision log threw", e);
    return null;
  }
}

/** Screen + log in one call. Returns the result with the decision id attached. */
export async function screenAndLog(
  supabase: any,
  address: string,
  actor: DecisionActor,
  opts: ScreenOptions = {},
): Promise<ScreenResult & { decision_id: string | null }> {
  const result = await screenAddress(supabase, address, { ...opts, workspaceId: opts.workspaceId ?? actor.workspaceId });
  const decision_id = await logDecision(supabase, result, actor);
  return { ...result, decision_id };
}
