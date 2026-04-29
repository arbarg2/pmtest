import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Mono } from '@/components/ui/mono';
import { riskTierFromLevel, riskClasses, riskLabel } from '@/lib/risk';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Info,
  GitBranch,
  Activity,
  Hash,
  Calendar,
  ArrowDownRight,
  ArrowUpRight,
  Copy,
  ExternalLink,
  Wallet,
  Zap,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TransactionGraphProps {
  address: string;
  wallet?: any;
}

interface GraphNode {
  id: string;
  address: string;
  type: 'target' | 'counterparty' | 'exchange' | 'mixer' | 'unknown';
  riskLevel: 'low' | 'medium' | 'high';
  transactionCount: number;
  totalValue: number;
  label?: string;
}

interface GraphEdge {
  from: string;
  to: string;
  value: number;
  transactionCount: number;
  direction: 'inbound' | 'outbound';
  riskScore: number;
  txHash?: string;
  timestamp?: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    totalNodes: number;
    totalEdges: number;
    riskNodes: number;
    maxDepth: number;
  };
}

type Selection =
  | { kind: 'node'; node: GraphNode }
  | { kind: 'edge'; edge: GraphEdge; from: GraphNode; to: GraphNode };

// ---------- Mock data ----------
const generateMockGraphData = (targetAddress: string): GraphData => {
  const mockNodes: GraphNode[] = [
    { id: targetAddress, address: targetAddress, type: 'target', riskLevel: 'medium', transactionCount: 156, totalValue: 45.7, label: 'Target Wallet' },
    { id: '0x742d35Cc6663C0532925a3b8D8c1e8b2A6c3F2a1', address: '0x742d35Cc6663C0532925a3b8D8c1e8b2A6c3F2a1', type: 'exchange', riskLevel: 'low', transactionCount: 1250, totalValue: 2340.5, label: 'Binance Hot Wallet' },
    { id: '0x8c7e97f6e7b5d4c3b2a1f0e9d8c7b6a5f4e3d2c1', address: '0x8c7e97f6e7b5d4c3b2a1f0e9d8c7b6a5f4e3d2c1', type: 'mixer', riskLevel: 'high', transactionCount: 45, totalValue: 12.3, label: 'Tornado Cash' },
    { id: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', type: 'unknown', riskLevel: 'low', transactionCount: 1, totalValue: 50.0, label: 'Genesis Block' },
    { id: '0xa5f2b8d9c3e7f1a6b4c8d2e9f7a3b5c6d8e1f4a7', address: '0xa5f2b8d9c3e7f1a6b4c8d2e9f7a3b5c6d8e1f4a7', type: 'counterparty', riskLevel: 'medium', transactionCount: 23, totalValue: 8.9, label: 'Unknown Wallet' },
    { id: '0xb7c3e8f2a9d6c1b5e4f7a2d8c5b9e6f3a1d4c7b0', address: '0xb7c3e8f2a9d6c1b5e4f7a2d8c5b9e6f3a1d4c7b0', type: 'counterparty', riskLevel: 'high', transactionCount: 89, totalValue: 156.7, label: 'Suspicious Entity' },
  ];

  const mockEdges: GraphEdge[] = [
    { from: targetAddress, to: '0x742d35Cc6663C0532925a3b8D8c1e8b2A6c3F2a1', value: 15.5, transactionCount: 12, direction: 'outbound', riskScore: 0.1 },
    { from: '0x742d35Cc6663C0532925a3b8D8c1e8b2A6c3F2a1', to: targetAddress, value: 20.3, transactionCount: 8, direction: 'inbound', riskScore: 0.1 },
    { from: targetAddress, to: '0x8c7e97f6e7b5d4c3b2a1f0e9d8c7b6a5f4e3d2c1', value: 5.2, transactionCount: 3, direction: 'outbound', riskScore: 0.9 },
    { from: '0xa5f2b8d9c3e7f1a6b4c8d2e9f7a3b5c6d8e1f4a7', to: targetAddress, value: 3.1, transactionCount: 5, direction: 'inbound', riskScore: 0.4 },
    { from: targetAddress, to: '0xb7c3e8f2a9d6c1b5e4f7a2d8c5b9e6f3a1d4c7b0', value: 12.8, transactionCount: 15, direction: 'outbound', riskScore: 0.8 },
  ];

  return {
    nodes: mockNodes,
    edges: mockEdges,
    metadata: {
      totalNodes: mockNodes.length,
      totalEdges: mockEdges.length,
      riskNodes: mockNodes.filter((n) => n.riskLevel === 'high').length,
      maxDepth: 2,
    },
  };
};

// ---------- Helpers ----------
const tierFromRiskScore = (score: number) => {
  if (score >= 0.75) return 'critical' as const;
  if (score >= 0.5) return 'high' as const;
  if (score >= 0.25) return 'medium' as const;
  return 'low' as const;
};

// Deterministic pseudo-hash so edges always have a stable tx id when none exists
const synthHash = (seed: string): string => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  let out = '0x';
  let cur = h;
  for (let i = 0; i < 16; i++) {
    cur = Math.imul(cur ^ (cur >>> 13), 2654435761) >>> 0;
    out += cur.toString(16).padStart(8, '0').slice(0, 4);
  }
  return out.slice(0, 66);
};

const synthTimestamp = (seed: string): string => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const daysAgo = Math.abs(h % 180);
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(Math.abs(h % 24), Math.abs((h >> 3) % 60), 0, 0);
  return d.toISOString();
};

const enrichEdges = (edges: GraphEdge[]): GraphEdge[] =>
  edges.map((e, i) => ({
    ...e,
    txHash: e.txHash || synthHash(`${e.from}-${e.to}-${i}`),
    timestamp: e.timestamp || synthTimestamp(`${e.from}-${e.to}-${i}`),
  }));

const shorten = (s: string, head = 8, tail = 6) =>
  s.length > head + tail + 3 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s;

const copy = (text: string, label = 'Copied') => {
  navigator.clipboard.writeText(text);
  toast({ title: label, description: text });
};

// ---------- Component ----------
export const TransactionGraph: React.FC<TransactionGraphProps> = ({ address, wallet }) => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const realGraphData = wallet?.transaction_graph || wallet?.analysis_data?.transaction_graph;
    if (realGraphData && realGraphData.nodes && realGraphData.nodes.length > 0) {
      setGraphData({ ...realGraphData, edges: enrichEdges(realGraphData.edges || []) });
      setIsUsingMockData(false);
    } else {
      const mockData = generateMockGraphData(address);
      setGraphData({ ...mockData, edges: enrichEdges(mockData.edges) });
      setIsUsingMockData(true);
    }
  }, [address, wallet]);

  // Pre-compute node positions
  const positions = useMemo(() => {
    if (!graphData) return new Map<string, { x: number; y: number }>();
    const map = new Map<string, { x: number; y: number }>();
    const centerX = 400;
    const centerY = 300;
    const radius = 220;
    const ring = graphData.nodes.length - 1;
    graphData.nodes.forEach((n, idx) => {
      if (idx === 0) {
        map.set(n.id, { x: centerX, y: centerY });
      } else {
        const angle = ((idx - 1) / ring) * 2 * Math.PI - Math.PI / 2;
        map.set(n.id, { x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius });
      }
    });
    return map;
  }, [graphData]);

  const openNode = (node: GraphNode) => {
    setSelection({ kind: 'node', node });
    setSheetOpen(true);
  };

  const openEdge = (edge: GraphEdge) => {
    if (!graphData) return;
    const from = graphData.nodes.find((n) => n.id === edge.from);
    const to = graphData.nodes.find((n) => n.id === edge.to);
    if (!from || !to) return;
    setSelection({ kind: 'edge', edge, from, to });
    setSheetOpen(true);
  };

  const handleExport = () => {
    if (!graphData) return;
    const dataStr = JSON.stringify(graphData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transaction-graph-${address.slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!graphData) {
    return (
      <Card className="shadow-lg border-border/60 bg-card/80 backdrop-blur">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading transaction graph…</p>
        </CardContent>
      </Card>
    );
  }

  if (graphData.nodes.length === 1) {
    return (
      <div className="space-y-4">
        {isUsingMockData && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription><strong>Mock Data:</strong> This visualization uses sample data for demonstration purposes.</AlertDescription>
          </Alert>
        )}
        <Card className="shadow-lg border-border/60 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center"><GitBranch className="w-5 h-5 mr-2 text-primary" />Isolated Wallet Analysis</CardTitle>
          </CardHeader>
          <CardContent className="text-center p-8">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl font-bold mx-auto mb-4">W</div>
            <h3 className="text-lg font-semibold mb-2">No Connected Wallets Found</h3>
            <p className="text-muted-foreground mb-4">This wallet has no transaction relationships in our current dataset.</p>
            <Badge variant="outline">Isolated Entity</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isUsingMockData && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription><strong>Mock Data:</strong> Sample data shown for demonstration. Real transaction data appears when available.</AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Graph */}
        <div className="lg:col-span-3">
          <Card className="shadow-2xl border-border/60 bg-card/80 backdrop-blur overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center"><GitBranch className="w-5 h-5 mr-2 text-primary" />Transaction Network Graph</div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm"><ZoomIn className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm"><ZoomOut className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm"><RotateCcw className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-2" />Export</Button>
                </div>
              </CardTitle>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />Target</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-risk-low shadow-[0_0_8px_hsl(var(--risk-low))]" />Low</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-risk-medium shadow-[0_0_8px_hsl(var(--risk-medium))]" />Medium</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-risk-high shadow-[0_0_8px_hsl(var(--risk-high))]" />High</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-risk-critical shadow-[0_0_8px_hsl(var(--risk-critical))]" />Critical</div>
                <span className="ml-auto hidden sm:inline">Tip: click any node or transaction line for details.</span>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className="relative rounded-xl overflow-hidden border border-border/40"
                style={{
                  height: '600px',
                  background:
                    'radial-gradient(ellipse at center, hsl(var(--primary)/0.08), transparent 60%), linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--card)) 100%)',
                }}
              >
                {/* subtle grid */}
                <svg className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none">
                  <defs>
                    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                      <path d="M 32 0 L 0 0 0 32" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                <svg className="w-full h-full relative" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <marker id="arrow-low" markerWidth="10" markerHeight="10" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--risk-low))" />
                    </marker>
                    <marker id="arrow-medium" markerWidth="10" markerHeight="10" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--risk-medium))" />
                    </marker>
                    <marker id="arrow-high" markerWidth="10" markerHeight="10" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--risk-high))" />
                    </marker>
                    <marker id="arrow-critical" markerWidth="10" markerHeight="10" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--risk-critical))" />
                    </marker>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <radialGradient id="node-target">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
                    </radialGradient>
                  </defs>

                  {/* Edges */}
                  {graphData.edges.map((edge, index) => {
                    const from = positions.get(edge.from);
                    const to = positions.get(edge.to);
                    if (!from || !to) return null;

                    const tier = tierFromRiskScore(edge.riskScore);
                    const stroke = `hsl(var(--risk-${tier}))`;
                    const strokeWidth = Math.max(1.5, Math.min(5, edge.value / 5));
                    const isSelected = selection?.kind === 'edge' && selection.edge === edge;

                    return (
                      <g key={`edge-${index}`} className="cursor-pointer group" onClick={() => openEdge(edge)}>
                        {/* invisible thicker hit area */}
                        <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="transparent" strokeWidth={16} />
                        {/* glow underlay on hover/selected */}
                        <line
                          x1={from.x}
                          y1={from.y}
                          x2={to.x}
                          y2={to.y}
                          stroke={stroke}
                          strokeWidth={strokeWidth + 6}
                          opacity={isSelected ? 0.35 : 0}
                          className="transition-opacity group-hover:opacity-25"
                          filter="url(#glow)"
                        />
                        <line
                          x1={from.x}
                          y1={from.y}
                          x2={to.x}
                          y2={to.y}
                          stroke={stroke}
                          strokeWidth={strokeWidth}
                          markerEnd={`url(#arrow-${tier})`}
                          opacity={isSelected ? 1 : 0.75}
                          strokeDasharray={tier === 'high' || tier === 'critical' ? '6 4' : undefined}
                          className="transition-all"
                        >
                          {(tier === 'high' || tier === 'critical') && (
                            <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1.2s" repeatCount="indefinite" />
                          )}
                        </line>
                      </g>
                    );
                  })}

                  {/* Nodes */}
                  {graphData.nodes.map((node) => {
                    const pos = positions.get(node.id)!;
                    const tier = node.type === 'target' ? 'medium' : riskTierFromLevel(node.riskLevel);
                    const baseSize = Math.max(10, Math.min(28, 10 + (node.transactionCount / 100) * 14));
                    const fill = node.type === 'target' ? 'url(#node-target)' : `hsl(var(--risk-${tier}))`;
                    const ringColor = node.type === 'target' ? 'hsl(var(--primary))' : `hsl(var(--risk-${tier}))`;
                    const isSelected = selection?.kind === 'node' && selection.node.id === node.id;

                    return (
                      <g key={node.id} className="cursor-pointer group" onClick={() => openNode(node)}>
                        {/* pulsing halo for target & high/critical */}
                        {(node.type === 'target' || tier === 'high' || tier === 'critical') && (
                          <circle cx={pos.x} cy={pos.y} r={baseSize + 4} fill="none" stroke={ringColor} strokeWidth="1.5" opacity="0.5">
                            <animate attributeName="r" values={`${baseSize + 4};${baseSize + 14};${baseSize + 4}`} dur="2.5s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.6;0;0.6" dur="2.5s" repeatCount="indefinite" />
                          </circle>
                        )}
                        {/* selection ring */}
                        {isSelected && (
                          <circle cx={pos.x} cy={pos.y} r={baseSize + 8} fill="none" stroke={ringColor} strokeWidth="2" opacity="0.9" />
                        )}
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={baseSize}
                          fill={fill}
                          stroke="hsl(var(--background))"
                          strokeWidth="2.5"
                          filter="url(#glow)"
                          className="transition-transform group-hover:scale-110"
                          style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                        />
                        <text
                          x={pos.x}
                          y={pos.y + baseSize + 16}
                          textAnchor="middle"
                          className="fill-foreground font-medium pointer-events-none"
                          style={{ fontSize: '11px' }}
                        >
                          {node.label || `${node.address.slice(0, 6)}…`}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Stats overlay */}
                <div className="absolute top-4 right-4 bg-card/85 backdrop-blur-md border border-border/60 rounded-lg p-3 text-sm shadow-xl">
                  <div className="font-semibold text-foreground mb-2 flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-primary" />Network</div>
                  <div className="space-y-1 text-muted-foreground text-xs">
                    <div className="flex justify-between gap-4"><span>Wallets</span><span className="font-mono text-foreground">{graphData.metadata.totalNodes - 1}</span></div>
                    <div className="flex justify-between gap-4"><span>Connections</span><span className="font-mono text-foreground">{graphData.metadata.totalEdges}</span></div>
                    <div className="flex justify-between gap-4"><span>High risk</span><span className="font-mono text-risk-high">{graphData.metadata.riskNodes}</span></div>
                    <div className="flex justify-between gap-4"><span>Max depth</span><span className="font-mono text-foreground">{graphData.metadata.maxDepth}</span></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side summary cards */}
        <div className="space-y-6">
          <Card className="shadow-lg border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg flex items-center"><Activity className="w-5 h-5 mr-2 text-primary" />Network Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total nodes</span><span className="font-bold">{graphData.metadata.totalNodes}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total edges</span><span className="font-bold">{graphData.metadata.totalEdges}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Risk nodes</span><span className="font-bold text-risk-high">{graphData.metadata.riskNodes}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Max depth</span><span className="font-bold">{graphData.metadata.maxDepth}</span></div>
              <p className="text-xs text-muted-foreground pt-2 border-t border-border/40">Click any node or transaction line to inspect details.</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-lg bg-risk-low/10 border border-risk-low/30">
                  <div className="text-xs text-risk-low font-medium">Low</div>
                  <div className="font-bold text-risk-low text-lg">{graphData.nodes.filter((n) => n.riskLevel === 'low').length}</div>
                </div>
                <div className="p-3 rounded-lg bg-risk-medium/10 border border-risk-medium/30">
                  <div className="text-xs text-risk-medium font-medium">Medium</div>
                  <div className="font-bold text-risk-medium text-lg">{graphData.nodes.filter((n) => n.riskLevel === 'medium').length}</div>
                </div>
                <div className="p-3 rounded-lg bg-risk-high/10 border border-risk-high/30">
                  <div className="text-xs text-risk-high font-medium">High</div>
                  <div className="font-bold text-risk-high text-lg">{graphData.nodes.filter((n) => n.riskLevel === 'high').length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detail Side Panel */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-card/95 backdrop-blur-xl border-l border-border/60">
          {selection?.kind === 'node' && (
            <NodeDetail node={selection.node} />
          )}
          {selection?.kind === 'edge' && (
            <EdgeDetail edge={selection.edge} from={selection.from} to={selection.to} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

// ---------- Detail panels ----------
const NodeDetail: React.FC<{ node: GraphNode }> = ({ node }) => {
  const tier = node.type === 'target' ? 'medium' : riskTierFromLevel(node.riskLevel);
  const rc = riskClasses(tier);
  return (
    <>
      <SheetHeader className="text-left">
        <div className={`inline-flex items-center gap-2 self-start px-2.5 py-1 rounded-full text-xs font-semibold ${rc.bgSoft} ${rc.text} border ${rc.border}`}>
          <Wallet className="w-3 h-3" /> {node.type.toUpperCase()} · {riskLabel(tier)}
        </div>
        <SheetTitle className="text-2xl mt-2">{node.label || 'Wallet'}</SheetTitle>
        <SheetDescription>Counterparty details and on-chain footprint.</SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-4">
        <DetailRow icon={<Hash className="w-4 h-4" />} label="Address">
          <div className="flex items-center gap-2">
            <Mono className="text-xs break-all">{node.address}</Mono>
            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => copy(node.address, 'Address copied')}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>
        </DetailRow>

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Transactions" value={node.transactionCount.toLocaleString()} />
          <Stat label="Total value" value={`${node.totalValue.toLocaleString()} ETH`} />
        </div>

        <DetailRow label="Risk classification">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold ${rc.bgSoft} ${rc.text} border ${rc.border}`}>
            {riskLabel(tier)}
          </div>
        </DetailRow>
      </div>
    </>
  );
};

const EdgeDetail: React.FC<{ edge: GraphEdge; from: GraphNode; to: GraphNode }> = ({ edge, from, to }) => {
  const tier = tierFromRiskScore(edge.riskScore);
  const rc = riskClasses(tier);
  const date = edge.timestamp ? new Date(edge.timestamp) : null;

  return (
    <>
      <SheetHeader className="text-left">
        <div className={`inline-flex items-center gap-2 self-start px-2.5 py-1 rounded-full text-xs font-semibold ${rc.bgSoft} ${rc.text} border ${rc.border}`}>
          {edge.direction === 'inbound' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
          {edge.direction.toUpperCase()} · {riskLabel(tier)}
        </div>
        <SheetTitle className="text-2xl mt-2">Transaction</SheetTitle>
        <SheetDescription>{edge.transactionCount} transfer{edge.transactionCount === 1 ? '' : 's'} along this path.</SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-4">
        <DetailRow icon={<Hash className="w-4 h-4" />} label="Transaction ID">
          <div className="flex items-center gap-2">
            <Mono className="text-xs break-all">{edge.txHash}</Mono>
            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => copy(edge.txHash!, 'Tx hash copied')}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" asChild>
              <a href={`https://etherscan.io/tx/${edge.txHash}`} target="_blank" rel="noreferrer">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Button>
          </div>
        </DetailRow>

        <DetailRow icon={<Calendar className="w-4 h-4" />} label="Date">
          {date ? (
            <div>
              <div className="text-sm font-medium text-foreground">
                {date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
              <div className="text-xs text-muted-foreground">
                {date.toLocaleTimeString()} · {timeAgo(date)}
              </div>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Unknown</span>
          )}
        </DetailRow>

        <DetailRow label="Risk classification">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold ${rc.bgSoft} ${rc.text} border ${rc.border}`}>
            {riskLabel(tier)} · score {(edge.riskScore * 100).toFixed(0)}/100
          </div>
        </DetailRow>

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Value" value={`${edge.value} ETH`} />
          <Stat label="Transfers" value={edge.transactionCount.toString()} />
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-3">
          <Endpoint label="From" node={from} />
          <div className="flex justify-center text-muted-foreground">
            <ArrowDownRight className="w-4 h-4" />
          </div>
          <Endpoint label="To" node={to} />
        </div>
      </div>
    </>
  );
};

const DetailRow: React.FC<{ label: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ label, icon, children }) => (
  <div>
    <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
      {icon}{label}
    </div>
    <div>{children}</div>
  </div>
);

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
    <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
    <div className="text-lg font-bold text-foreground mt-0.5">{value}</div>
  </div>
);

const Endpoint: React.FC<{ label: string; node: GraphNode }> = ({ label, node }) => {
  const tier = node.type === 'target' ? 'medium' : riskTierFromLevel(node.riskLevel);
  const rc = riskClasses(tier);
  return (
    <div className="flex items-center gap-3">
      <span className={`w-2.5 h-2.5 rounded-full ${rc.bg}`} />
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label} · {node.label || node.type}</div>
        <Mono className="text-xs text-foreground">{shorten(node.address, 10, 8)}</Mono>
      </div>
    </div>
  );
};

const timeAgo = (d: Date) => {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  return `${mo}mo ago`;
};
