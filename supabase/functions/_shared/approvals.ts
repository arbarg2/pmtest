// ERC-20 token approval (allowance) scanner.
//
// Reads `Approval(address indexed owner, address indexed spender, uint256 value)`
// logs for an owner address from Etherscan V2, reduces them to the *current*
// allowance per (token, spender), and flags the ones that are actually dangerous:
//   - unlimited / effectively-unlimited allowances
//   - allowances granted to addresses in `malicious_addresses`
//   - allowances granted to addresses with no known name tag / attribution
//
// This is the engine behind the "risky token approvals" claim.

const APPROVAL_TOPIC =
  "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";

const MAX_UINT256 =
  115792089237316195423570985008687907853269984665640564039457584007913129639935n;
// Anything above 2^200 is "practically unlimited" — many wallets grant 2^256-1
// or a very large sentinel value.
const UNLIMITED_FLOOR = 2n ** 200n;

export interface Approval {
  token: string;
  token_symbol: string | null;
  spender: string;
  spender_label: string | null;
  allowance: string;
  unlimited: boolean;
  risk: "high" | "medium" | "low";
  reason: string;
  last_updated: number | null;
  tx_hash: string | null;
}

export interface ApprovalScan {
  supported: boolean;
  total_spenders: number;
  unlimited_count: number;
  risky_approvals: Approval[];
  all_approvals: Approval[];
  scanned_logs: number;
  truncated: boolean;
  error?: string;
}

export const EMPTY_APPROVAL_SCAN: ApprovalScan = {
  supported: false,
  total_spenders: 0,
  unlimited_count: 0,
  risky_approvals: [],
  all_approvals: [],
  scanned_logs: 0,
  truncated: false,
};

function topicToAddress(topic: string): string {
  return `0x${topic.slice(-40)}`.toLowerCase();
}

function hexToBigInt(hex: string): bigint {
  if (!hex || hex === "0x") return 0n;
  try {
    return BigInt(hex);
  } catch {
    return 0n;
  }
}

/**
 * Fetch every Approval log where `owner` is the scanned address.
 * Etherscan caps a single getLogs call at 1000 records, so we page.
 */
async function fetchApprovalLogs(owner: string, key: string) {
  const paddedOwner = `0x000000000000000000000000${owner.slice(2).toLowerCase()}`;
  const logs: any[] = [];
  let truncated = false;

  for (let page = 1; page <= 3; page++) {
    const url =
      `https://api.etherscan.io/v2/api?chainid=1&module=logs&action=getLogs` +
      `&fromBlock=0&toBlock=latest` +
      `&topic0=${APPROVAL_TOPIC}&topic0_1_opr=and&topic1=${paddedOwner}` +
      `&page=${page}&offset=1000&apikey=${key}`;
    const res = await fetch(url);
    if (!res.ok) break;
    const json = await res.json().catch(() => ({}));
    const batch: any[] = Array.isArray(json?.result) ? json.result : [];
    logs.push(...batch);
    if (batch.length < 1000) break;
    if (page === 3) truncated = true;
  }

  return { logs, truncated };
}

/** Look up token symbols for a set of contracts from recent token transfers. */
async function fetchTokenSymbols(owner: string, key: string) {
  const symbols = new Map<string, string>();
  try {
    const url =
      `https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokentx` +
      `&address=${owner}&page=1&offset=1000&sort=desc&apikey=${key}`;
    const res = await fetch(url);
    if (!res.ok) return symbols;
    const json = await res.json().catch(() => ({}));
    for (const t of Array.isArray(json?.result) ? json.result : []) {
      const c = String(t.contractAddress ?? "").toLowerCase();
      if (c && t.tokenSymbol && !symbols.has(c)) symbols.set(c, String(t.tokenSymbol));
    }
  } catch {
    // symbols are cosmetic — never fail the scan for them
  }
  return symbols;
}

/**
 * Scan the current ERC-20 approvals for an Ethereum address.
 * `supabase` is used to check spenders against the malicious / attribution tables.
 */
export async function scanApprovals(
  supabase: any,
  address: string,
  etherscanKey: string,
): Promise<ApprovalScan> {
  const owner = address.toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(owner)) return { ...EMPTY_APPROVAL_SCAN };

  try {
    const [{ logs, truncated }, symbols] = await Promise.all([
      fetchApprovalLogs(owner, etherscanKey),
      fetchTokenSymbols(owner, etherscanKey),
    ]);

    // Latest log per (token, spender) wins — that is the current allowance.
    const latest = new Map<string, any>();
    for (const l of logs) {
      const token = String(l.address ?? "").toLowerCase();
      const spender = l.topics?.[2] ? topicToAddress(l.topics[2]) : null;
      if (!token || !spender) continue;
      const k = `${token}:${spender}`;
      const prev = latest.get(k);
      const blockNum = Number(l.blockNumber ?? 0);
      if (!prev || blockNum >= Number(prev.blockNumber ?? 0)) latest.set(k, l);
    }

    const live: { token: string; spender: string; value: bigint; log: any }[] = [];
    for (const [k, l] of latest) {
      const value = hexToBigInt(String(l.data ?? "0x"));
      if (value === 0n) continue; // revoked
      const [token, spender] = k.split(":");
      live.push({ token, spender, value, log: l });
    }

    const spenders = [...new Set(live.map((a) => a.spender))];

    // Which spenders are known-bad, and which are known-good?
    const malicious = new Map<string, { label: string | null; category: string | null }>();
    const attributed = new Map<string, string>();
    for (let i = 0; i < spenders.length; i += 150) {
      const chunk = spenders.slice(i, i + 150);
      const [{ data: mal }, { data: att }] = await Promise.all([
        supabase
          .from("malicious_addresses")
          .select("address, label, category")
          .in("address", chunk),
        supabase
          .from("entity_attributions")
          .select("address, entity_name")
          .in("address", chunk),
      ]);
      for (const m of mal ?? []) {
        malicious.set(String(m.address).toLowerCase(), { label: m.label, category: m.category });
      }
      for (const a of att ?? []) {
        attributed.set(String(a.address).toLowerCase(), a.entity_name);
      }
    }

    const approvals: Approval[] = live.map(({ token, spender, value, log }) => {
      const unlimited = value >= UNLIMITED_FLOOR || value === MAX_UINT256;
      const bad = malicious.get(spender);
      const known = attributed.get(spender) ?? null;

      let risk: Approval["risk"] = "low";
      let reason = known
        ? `Unlimited-free allowance to ${known}.`
        : "Limited allowance to an unlabelled contract.";

      if (bad) {
        risk = "high";
        reason = `Allowance granted to a known ${bad.category ?? "malicious"} address${
          bad.label ? ` — ${bad.label}` : ""
        }. Revoke immediately.`;
      } else if (unlimited && !known) {
        risk = "high";
        reason = "Unlimited allowance granted to an unlabelled contract.";
      } else if (unlimited) {
        risk = "medium";
        reason = `Unlimited allowance granted to ${known}.`;
      } else if (!known) {
        risk = "low";
        reason = "Capped allowance to an unlabelled contract.";
      }

      return {
        token,
        token_symbol: symbols.get(token) ?? null,
        spender,
        spender_label: bad?.label ?? known,
        allowance: unlimited ? "unlimited" : value.toString(),
        unlimited,
        risk,
        reason,
        last_updated: log.timeStamp ? Number(log.timeStamp) * 1000 : null,
        tx_hash: log.transactionHash ?? null,
      };
    });

    const rank = { high: 0, medium: 1, low: 2 } as const;
    approvals.sort((a, b) => rank[a.risk] - rank[b.risk]);

    return {
      supported: true,
      total_spenders: spenders.length,
      unlimited_count: approvals.filter((a) => a.unlimited).length,
      risky_approvals: approvals.filter((a) => a.risk !== "low").slice(0, 25),
      all_approvals: approvals.slice(0, 100),
      scanned_logs: logs.length,
      truncated,
    };
  } catch (e) {
    console.error("approval scan failed", e);
    return { ...EMPTY_APPROVAL_SCAN, error: e instanceof Error ? e.message : "unknown" };
  }
}
