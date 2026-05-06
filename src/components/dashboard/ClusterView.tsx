import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Network, Users, Share2, Layers, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  buildClusterGraph,
  ClusterGraph,
  ClusterNode,
  ClusterCounterpartyNode,
  ClusterWalletNode,
} from "@/services/clusterAnalysis";
import { riskClasses, riskTierFromLevel } from "@/lib/risk";
import { Mono, truncateMiddle } from "@/components/ui/mono";

type Positioned = ClusterNode & { x: number; y: number };

const WIDTH = 900;
const HEIGHT = 520;

function layout(graph: ClusterGraph): Positioned[] {
  const wallets = graph.nodes.filter((n) => n.type === "wallet") as ClusterWalletNode[];
  const cps = graph.nodes.filter((n) => n.type === "counterparty") as ClusterCounterpartyNode[];

  // Group wallets into clusters by shared counterparties (mirrors union-find in service)
  const parent: Record<string, string> = {};
  const find = (x: string): string => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const union = (a: string, b: string) => {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };
  wallets.forEach((w) => (parent[w.id] = w.id));
  cps.forEach((c) => {
    if (c.sharedBy.length > 1) {
      for (let i = 1; i < c.sharedBy.length; i++) union(c.sharedBy[0], c.sharedBy[i]);
    }
  });

  const clusterMap = new Map<string, ClusterWalletNode[]>();
  wallets.forEach((w) => {
    const root = find(w.id);
    if (!clusterMap.has(root)) clusterMap.set(root, []);
    clusterMap.get(root)!.push(w);
  });

  const clusters = Array.from(clusterMap.values()).sort((a, b) => b.length - a.length);
  const positions = new Map<string, { x: number; y: number }>();

  // Place clusters in a grid
  const cols = Math.ceil(Math.sqrt(clusters.length)) || 1;
  const rows = Math.ceil(clusters.length / cols) || 1;
  const cellW = WIDTH / cols;
  const cellH = HEIGHT / rows;

  clusters.forEach((clusterWallets, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cx = cellW * col + cellW / 2;
    const cy = cellH * row + cellH / 2;

    const wIds = new Set(clusterWallets.map((w) => w.id));
    const clusterCps = cps.filter((c) => c.sharedBy.some((s) => wIds.has(s)));

    // Wallets at inner circle
    const wRadius = Math.min(cellW, cellH) * 0.18;
    clusterWallets.forEach((w, i) => {
      const angle = (i / Math.max(clusterWallets.length, 1)) * Math.PI * 2 - Math.PI / 2;
      positions.set(w.id, {
        x: cx + Math.cos(angle) * wRadius,
        y: cy + Math.sin(angle) * wRadius,
      });
      if (clusterWallets.length === 1) positions.set(w.id, { x: cx, y: cy });
    });

    // Counterparties at outer circle
    const cRadius = Math.min(cellW, cellH) * 0.42;
    clusterCps.forEach((c, i) => {
      const angle = (i / Math.max(clusterCps.length, 1)) * Math.PI * 2;
      positions.set(c.id, {
        x: cx + Math.cos(angle) * cRadius,
        y: cy + Math.sin(angle) * cRadius,
      });
    });
  });

  return graph.nodes.map((n) => ({
    ...n,
    x: positions.get(n.id)?.x ?? WIDTH / 2,
    y: positions.get(n.id)?.y ?? HEIGHT / 2,
  }));
}

const StatTile: React.FC<{ icon: React.ReactNode; label: string; value: number; tone?: string }> = ({
  icon,
  label,
  value,
  tone = "primary",
}) => (
  <div className="rounded-lg border bg-card/60 backdrop-blur p-4 flex items-center gap-3">
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: `hsl(var(--${tone}) / 0.15)`, color: `hsl(var(--${tone}))` }}
    >
      {icon}
    </div>
    <div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  </div>
);

const ClusterView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [graph, setGraph] = useState<ClusterGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ClusterNode | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const g = await buildClusterGraph(user.id);
      setGraph(g);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const positioned = useMemo(() => (graph ? layout(graph) : []), [graph]);
  const nodeMap = useMemo(() => new Map(positioned.map((n) => [n.id, n])), [positioned]);

  const isHighlighted = (id: string) => {
    if (!hover && !selected) return true;
    const focusId = selected?.id ?? hover;
    if (!focusId) return true;
    if (focusId === id) return true;
    if (!graph) return false;
    return graph.edges.some(
      (e) =>
        (e.source === focusId && e.target === id) ||
        (e.target === focusId && e.source === id),
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 flex items-center justify-center text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Building cluster graph...
        </CardContent>
      </Card>
    );
  }

  if (!graph || graph.stats.walletCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5 text-primary" /> Cross-Wallet Cluster View
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Investigate a few wallets to build your cluster map. Shared counterparties and exchanges will
          appear here automatically.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5 text-primary" />
            Cross-Wallet Cluster View
            <Badge variant="outline" className="ml-2 font-normal">
              {graph.stats.clusterCount} {graph.stats.clusterCount === 1 ? "cluster" : "clusters"}
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Wallets connected through shared counterparties — exchanges, mixers, or recurring addresses.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile icon={<Layers className="w-5 h-5" />} label="Wallets" value={graph.stats.walletCount} tone="primary" />
          <StatTile
            icon={<Users className="w-5 h-5" />}
            label="Counterparties"
            value={graph.stats.counterpartyCount}
            tone="accent"
          />
          <StatTile
            icon={<Share2 className="w-5 h-5" />}
            label="Shared Exposures"
            value={graph.stats.sharedCount}
            tone="risk-high"
          />
          <StatTile
            icon={<Network className="w-5 h-5" />}
            label="Clusters"
            value={graph.stats.clusterCount}
            tone="risk-medium"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          <div className="relative rounded-xl border bg-gradient-to-br from-background to-muted/30 overflow-hidden">
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="w-full h-[520px]"
              onClick={() => setSelected(null)}
            >
              <defs>
                <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Edges */}
              {graph.edges.map((e, i) => {
                const s = nodeMap.get(e.source);
                const t = nodeMap.get(e.target);
                if (!s || !t) return null;
                const visible = isHighlighted(e.source) && isHighlighted(e.target);
                return (
                  <line
                    key={i}
                    x1={s.x}
                    y1={s.y}
                    x2={t.x}
                    y2={t.y}
                    stroke={e.shared ? "hsl(var(--risk-high))" : "hsl(var(--border))"}
                    strokeWidth={e.shared ? 2 : 1}
                    strokeOpacity={visible ? (e.shared ? 0.7 : 0.4) : 0.08}
                    strokeDasharray={e.shared ? "" : "3 3"}
                  />
                );
              })}

              {/* Nodes */}
              {positioned.map((n) => {
                const tier = riskTierFromLevel(n.risk_level);
                const cls = riskClasses(tier);
                const isWallet = n.type === "wallet";
                const r = isWallet ? 18 : (n as ClusterCounterpartyNode).sharedBy.length > 1 ? 12 : 8;
                const opacity = isHighlighted(n.id) ? 1 : 0.2;
                const isSelected = selected?.id === n.id;
                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x}, ${n.y})`}
                    style={{ cursor: "pointer", opacity, transition: "opacity 200ms" }}
                    onMouseEnter={() => setHover(n.id)}
                    onMouseLeave={() => setHover(null)}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setSelected(n);
                    }}
                  >
                    {isSelected && (
                      <circle r={r + 8} fill="none" stroke={cls.stroke} strokeWidth={2} opacity={0.5}>
                        <animate attributeName="r" from={r + 6} to={r + 14} dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle r={r + 4} fill={cls.fill} opacity={0.18} />
                    <circle
                      r={r}
                      fill={isWallet ? cls.fill : "hsl(var(--card))"}
                      stroke={cls.stroke}
                      strokeWidth={isWallet ? 0 : 2.5}
                    />
                    {isWallet && (
                      <text
                        textAnchor="middle"
                        dy="0.35em"
                        fontSize="10"
                        fontWeight="700"
                        fill="hsl(var(--primary-foreground))"
                      >
                        W
                      </text>
                    )}
                    <text
                      textAnchor="middle"
                      y={r + 14}
                      fontSize="10"
                      fontFamily="ui-monospace, monospace"
                      fill="hsl(var(--foreground))"
                      opacity={0.85}
                    >
                      {n.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 flex items-center gap-3 bg-background/80 backdrop-blur rounded-lg px-3 py-2 text-xs border">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-primary" /> Wallet
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border-2 border-muted-foreground" /> Counterparty
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-risk-high" /> Shared
              </span>
            </div>
          </div>

          {/* Detail panel */}
          <div className="rounded-xl border bg-card p-4 min-h-[520px]">
            {!selected ? (
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">Select a node</p>
                <p>
                  Click any wallet or counterparty to see its risk profile, shared exposures, and link out
                  to the full investigation.
                </p>
                <div className="mt-6 space-y-2">
                  <p className="text-xs uppercase tracking-wide font-semibold">Top shared counterparties</p>
                  {graph.nodes
                    .filter((n): n is ClusterCounterpartyNode => n.type === "counterparty" && n.sharedBy.length > 1)
                    .sort((a, b) => b.sharedBy.length - a.sharedBy.length)
                    .slice(0, 5)
                    .map((c) => {
                      const cls = riskClasses(riskTierFromLevel(c.risk_level));
                      return (
                        <button
                          key={c.id}
                          onClick={() => setSelected(c)}
                          className="w-full text-left rounded-md border p-2 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium truncate">{c.label}</span>
                            <Badge variant="outline" className={`${cls.text} ${cls.border} text-[10px]`}>
                              {c.sharedBy.length} wallets
                            </Badge>
                          </div>
                        </button>
                      );
                    })}
                  {graph.stats.sharedCount === 0 && (
                    <p className="text-xs text-muted-foreground italic">No shared exposures yet.</p>
                  )}
                </div>
              </div>
            ) : (
              <NodeDetail node={selected} graph={graph} onNavigate={(id) => navigate(`/record/${id}`)} onSelect={setSelected} />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const NodeDetail: React.FC<{
  node: ClusterNode;
  graph: ClusterGraph;
  onNavigate: (recordId: string) => void;
  onSelect: (n: ClusterNode) => void;
}> = ({ node, graph, onNavigate, onSelect }) => {
  const tier = riskTierFromLevel(node.risk_level);
  const cls = riskClasses(tier);

  if (node.type === "wallet") {
    const w = node as ClusterWalletNode;
    const connectedCps = graph.nodes.filter(
      (n): n is ClusterCounterpartyNode =>
        n.type === "counterparty" && n.sharedBy.includes(w.id),
    );
    return (
      <div className="space-y-4">
        <div>
          <Badge className={`${cls.bgSoft} ${cls.text} ${cls.border} mb-2`}>{w.risk_level}</Badge>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Wallet</p>
          <Mono className="text-sm break-all">{w.address}</Mono>
          <p className="text-xs text-muted-foreground mt-1">
            {w.network.toUpperCase()} · risk score {w.risk_score.toFixed(1)}
          </p>
        </div>
        {w.recordId && (
          <Button size="sm" variant="outline" className="w-full" onClick={() => onNavigate(w.recordId!)}>
            Open investigation
          </Button>
        )}
        <div>
          <p className="text-xs uppercase tracking-wide font-semibold mb-2">
            Counterparties ({connectedCps.length})
          </p>
          <div className="space-y-1.5 max-h-[260px] overflow-auto">
            {connectedCps.map((c) => {
              const ccls = riskClasses(riskTierFromLevel(c.risk_level));
              return (
                <button
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className="w-full text-left rounded-md border p-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Mono truncate className="text-xs">{c.label}</Mono>
                    {c.sharedBy.length > 1 && (
                      <Badge variant="outline" className={`${ccls.text} ${ccls.border} text-[10px] shrink-0`}>
                        shared ×{c.sharedBy.length}
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const c = node as ClusterCounterpartyNode;
  const sharedWallets = graph.nodes.filter(
    (n): n is ClusterWalletNode => n.type === "wallet" && c.sharedBy.includes(n.id),
  );
  return (
    <div className="space-y-4">
      <div>
        <Badge className={`${cls.bgSoft} ${cls.text} ${cls.border} mb-2`}>{c.risk_level}</Badge>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Counterparty {c.entity_name ? `· ${c.entity_name}` : ""}
        </p>
        <Mono className="text-sm break-all">{truncateMiddle(c.address, 10, 8)}</Mono>
        <p className="text-xs text-muted-foreground mt-1">
          {c.totalTxns} txns · vol {c.totalVolume.toFixed(2)}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide font-semibold mb-2">
          Shared by {sharedWallets.length} {sharedWallets.length === 1 ? "wallet" : "wallets"}
        </p>
        <div className="space-y-1.5 max-h-[300px] overflow-auto">
          {sharedWallets.map((w) => {
            const wcls = riskClasses(riskTierFromLevel(w.risk_level));
            return (
              <button
                key={w.id}
                onClick={() => onSelect(w)}
                className="w-full text-left rounded-md border p-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <Mono truncate className="text-xs">{w.label}</Mono>
                  <Badge variant="outline" className={`${wcls.text} ${wcls.border} text-[10px] shrink-0`}>
                    {w.risk_level}
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ClusterView;
