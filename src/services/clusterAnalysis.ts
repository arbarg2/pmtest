import { supabase } from "@/integrations/supabase/client";

export interface ClusterWalletNode {
  id: string;
  type: "wallet";
  address: string;
  network: string;
  risk_level: string;
  risk_score: number;
  recordId?: string;
  label: string;
}

export interface ClusterCounterpartyNode {
  id: string;
  type: "counterparty";
  address: string;
  entity_name?: string;
  risk_level: string;
  risk_score: number;
  sharedBy: string[]; // wallet ids
  totalVolume: number;
  totalTxns: number;
  label: string;
}

export type ClusterNode = ClusterWalletNode | ClusterCounterpartyNode;

export interface ClusterEdge {
  source: string;
  target: string;
  volume: number;
  txns: number;
  shared: boolean;
}

export interface ClusterGraph {
  nodes: ClusterNode[];
  edges: ClusterEdge[];
  stats: {
    walletCount: number;
    counterpartyCount: number;
    sharedCount: number;
    clusterCount: number;
  };
}

const truncate = (a: string) => (a && a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a);

export async function buildClusterGraph(userId: string): Promise<ClusterGraph> {
  const { data: records } = await supabase
    .from("investigation_records")
    .select("id, record_id, wallet_address, network, risk_level, risk_score, analysis_data")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(40);

  const recs = records ?? [];
  const wallets: ClusterWalletNode[] = recs.map((r) => ({
    id: `w:${r.id}`,
    type: "wallet",
    address: r.wallet_address,
    network: r.network,
    risk_level: r.risk_level ?? "Low",
    risk_score: Number(r.risk_score ?? 0),
    recordId: r.record_id ?? r.id,
    label: truncate(r.wallet_address),
  }));

  // Aggregate counterparties across wallets
  const cpMap = new Map<
    string,
    {
      address: string;
      entity_name?: string;
      risk_level: string;
      risk_score: number;
      sharedBy: Set<string>;
      totalVolume: number;
      totalTxns: number;
      perWallet: Map<string, { volume: number; txns: number }>;
    }
  >();

  recs.forEach((r) => {
    const ad: any = r.analysis_data;
    const cps: any[] = ad?.top_counterparties ?? [];
    cps.forEach((cp) => {
      if (!cp?.address) return;
      const key = cp.address.toLowerCase();
      if (!cpMap.has(key)) {
        cpMap.set(key, {
          address: cp.address,
          entity_name: cp.entity_name,
          risk_level: cp.risk_level ?? "Low",
          risk_score: Number(cp.risk_score ?? 0),
          sharedBy: new Set(),
          totalVolume: 0,
          totalTxns: 0,
          perWallet: new Map(),
        });
      }
      const entry = cpMap.get(key)!;
      const wid = `w:${r.id}`;
      entry.sharedBy.add(wid);
      const vol = Number(cp.total_volume ?? 0);
      const txns = Number(cp.transaction_count ?? 0);
      entry.totalVolume += vol;
      entry.totalTxns += txns;
      entry.perWallet.set(wid, { volume: vol, txns });
      // Upgrade entity attribution if present
      if (!entry.entity_name && cp.entity_name) entry.entity_name = cp.entity_name;
    });
  });

  const counterparties: ClusterCounterpartyNode[] = [];
  const edges: ClusterEdge[] = [];

  cpMap.forEach((entry, key) => {
    const id = `c:${key}`;
    const shared = entry.sharedBy.size > 1;
    counterparties.push({
      id,
      type: "counterparty",
      address: entry.address,
      entity_name: entry.entity_name,
      risk_level: entry.risk_level,
      risk_score: entry.risk_score,
      sharedBy: Array.from(entry.sharedBy),
      totalVolume: entry.totalVolume,
      totalTxns: entry.totalTxns,
      label: entry.entity_name ?? truncate(entry.address),
    });
    entry.perWallet.forEach((v, wid) => {
      edges.push({
        source: wid,
        target: id,
        volume: v.volume,
        txns: v.txns,
        shared,
      });
    });
  });

  // Cluster count: wallets connected via shared counterparties (union-find)
  const parent: Record<string, string> = {};
  const find = (x: string): string => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const union = (a: string, b: string) => {
    const ra = find(a),
      rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };
  wallets.forEach((w) => (parent[w.id] = w.id));
  counterparties.forEach((c) => {
    if (c.sharedBy.length > 1) {
      for (let i = 1; i < c.sharedBy.length; i++) union(c.sharedBy[0], c.sharedBy[i]);
    }
  });
  const clusters = new Set(wallets.map((w) => find(w.id)));

  const sharedCount = counterparties.filter((c) => c.sharedBy.length > 1).length;

  return {
    nodes: [...wallets, ...counterparties],
    edges,
    stats: {
      walletCount: wallets.length,
      counterpartyCount: counterparties.length,
      sharedCount,
      clusterCount: clusters.size,
    },
  };
}
