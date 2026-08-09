// Shared address screening engine used by both `safe-check` and the public `api` function.
// Keeping this in one place guarantees the consumer page and the developer API
// always return identical verdicts.

export type Network = "bitcoin" | "ethereum" | "solana";

export type Reason = { type: string; severity: "low" | "medium" | "high"; text: string };

export interface ScreenResult {
  address: string;
  network: Network;
  verdict: "safe" | "caution" | "danger";
  risk_score: number;
  reasons: Reason[];
  data: {
    balance: number;
    tx_count: number;
    first_seen: number | null;
    sanctioned: boolean;
    short: string;
  };
  sanctions?: {
    matched: boolean;
    entity_name?: string | null;
    source_list?: string | null;
    program?: string | null;
  };
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

async function fetchEth(address: string, etherscanKey: string) {
  const base = "https://api.etherscan.io/v2/api?chainid=1";
  const [balRes, txRes] = await Promise.all([
    fetch(`${base}&module=account&action=balance&address=${address}&tag=latest&apikey=${etherscanKey}`),
    fetch(`${base}&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=25&sort=desc&apikey=${etherscanKey}`),
  ]);
  const bal = await balRes.json();
  const txs = await txRes.json();
  const balance = bal?.result ? Number(bal.result) / 1e18 : 0;
  const txList: any[] = Array.isArray(txs?.result) ? txs.result : [];
  const firstSeen = txList.length ? Number(txList[txList.length - 1].timeStamp) * 1000 : null;
  return { balance, txCount: txList.length, firstSeen, txs: txList };
}

async function fetchBtc(address: string) {
  const r = await fetch(`https://blockstream.info/api/address/${address}`);
  if (!r.ok) throw new Error(`Blockstream ${r.status}`);
  const d = await r.json();
  const balance = ((d.chain_stats?.funded_txo_sum ?? 0) - (d.chain_stats?.spent_txo_sum ?? 0)) / 1e8;
  const txCount = (d.chain_stats?.tx_count ?? 0) + (d.mempool_stats?.tx_count ?? 0);
  return { balance, txCount, firstSeen: null as number | null, txs: [] as any[] };
}

async function fetchSol(address: string) {
  const r = await fetch("https://api.mainnet-beta.solana.com", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getBalance", params: [address] }),
  });
  const d = await r.json();
  const balance = d?.result?.value ? d.result.value / 1e9 : 0;
  return { balance, txCount: 0, txs: [] as any[], firstSeen: null as number | null };
}

export async function lookupSanctions(supabase: any, address: string) {
  const { data } = await supabase
    .from("sanctions_addresses")
    .select("entity_name, source_list, program, date_listed, network")
    .ilike("address", address)
    .maybeSingle();
  return data ?? null;
}

/** Full screen: sanctions + chain data + risk scoring. */
export async function screenAddress(supabase: any, rawAddress: string): Promise<ScreenResult> {
  const address = rawAddress.trim();
  const network = detectNetwork(address);
  if (!network) throw new Error("Unsupported address format");

  const sanctionsHit = await lookupSanctions(supabase, address);

  let chain: { balance: number; txCount: number; firstSeen: number | null; txs: any[] };
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
    chain = { balance: 0, txCount: 0, firstSeen: null, txs: [] };
  }

  const reasons: Reason[] = [];
  let score = 5;

  if (sanctionsHit) {
    reasons.push({
      type: "sanctions",
      severity: "high",
      text: `Direct OFAC match: ${sanctionsHit.entity_name ?? "Listed entity"} (${sanctionsHit.source_list ?? "OFAC"}). Do NOT send funds.`,
    });
    score = 100;
  }

  if (chain.txCount === 0) {
    reasons.push({ type: "fresh", severity: "medium", text: "Brand-new wallet with zero on-chain history. Cannot verify reputation." });
    score = Math.max(score, 45);
  } else if (chain.txCount < 5) {
    reasons.push({ type: "low_activity", severity: "medium", text: `Only ${chain.txCount} transactions on record. Limited reputation signal.` });
    score = Math.max(score, 30);
  } else {
    reasons.push({ type: "history", severity: "low", text: `${chain.txCount}+ transactions on record. Established on-chain history.` });
  }

  if (chain.firstSeen) {
    const ageDays = (Date.now() - chain.firstSeen) / (1000 * 60 * 60 * 24);
    if (ageDays < 7) {
      reasons.push({ type: "age", severity: "medium", text: `Wallet first seen ${Math.max(1, Math.round(ageDays))} day(s) ago.` });
      score = Math.max(score, 40);
    } else if (ageDays > 365) {
      reasons.push({ type: "age", severity: "low", text: `Wallet active for over ${Math.round(ageDays / 365)} year(s).` });
    }
  }

  if (chain.balance > 0) {
    reasons.push({ type: "balance", severity: "low", text: `Holds ${chain.balance.toFixed(4)} ${network.toUpperCase()}.` });
  }

  if (network === "ethereum" && chain.txs.length >= 10) {
    const recent = chain.txs.slice(0, 20);
    const outbound = recent.filter((t) => t.from?.toLowerCase() === address.toLowerCase()).length;
    if (outbound > 15) {
      reasons.push({ type: "pattern", severity: "medium", text: "High outbound transaction frequency — consistent with drainer/sweeper patterns." });
      score = Math.max(score, 55);
    }
  }

  const verdict = score >= 70 ? "danger" : score >= 35 ? "caution" : "safe";

  return {
    address,
    network,
    verdict,
    risk_score: score,
    reasons,
    data: {
      balance: chain.balance,
      tx_count: chain.txCount,
      first_seen: chain.firstSeen,
      sanctioned: !!sanctionsHit,
      short: shortAddr(address),
    },
    sanctions: {
      matched: !!sanctionsHit,
      entity_name: sanctionsHit?.entity_name ?? null,
      source_list: sanctionsHit?.source_list ?? null,
      program: sanctionsHit?.program ?? null,
    },
  };
}
