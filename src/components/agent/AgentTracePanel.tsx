import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Loader2, GitBranch, RefreshCw, ShieldAlert, FileText, CornerDownRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TraceNode {
  id: string;
  parent_id: string | null;
  address: string;
  network: string;
  depth: number;
  status: string;
  verdict: string | null;
  risk_score: number | null;
  entity_name: string | null;
  entity_category: string | null;
  classification: string | null;
  labels: string[] | null;
  edge: Record<string, any> | null;
}

interface Trace {
  id: string;
  status: string;
  root_address: string;
  network: string;
  trigger_reason: string | null;
  depth_limit: number;
  nodes_done: number;
  node_budget: number;
  max_downstream_risk: number | null;
  narrative: string | null;
  narrative_validation: any;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

interface Props {
  address: string;
  network?: string;
  recordId?: string | null;
  workspaceId?: string | null;
}

const verdictTone = (verdict: string | null, score: number | null) => {
  const s = Number(score ?? 0);
  if (verdict === 'danger' || s >= 70) return 'text-[hsl(var(--risk-high))] border-[hsl(var(--risk-high))]/40 bg-[hsl(var(--risk-high))]/10';
  if (verdict === 'caution' || s >= 35) return 'text-[hsl(var(--risk-medium))] border-[hsl(var(--risk-medium))]/40 bg-[hsl(var(--risk-medium))]/10';
  if (verdict === 'safe') return 'text-[hsl(var(--risk-low))] border-[hsl(var(--risk-low))]/40 bg-[hsl(var(--risk-low))]/10';
  return 'text-muted-foreground border-border bg-muted/30';
};

const short = (a: string) => (a.length > 18 ? `${a.slice(0, 10)}…${a.slice(-6)}` : a);

const AgentTracePanel: React.FC<Props> = ({ address, network, recordId, workspaceId }) => {
  const [trace, setTrace] = useState<Trace | null>(null);
  const [nodes, setNodes] = useState<TraceNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    const { data: traces } = await supabase
      .from('agent_traces')
      .select('*')
      .ilike('root_address', address)
      .order('created_at', { ascending: false })
      .limit(1);
    const t = (traces?.[0] as unknown as Trace) ?? null;
    setTrace(t);
    if (t) {
      const { data: n } = await supabase
        .from('agent_trace_nodes')
        .select('*')
        .eq('trace_id', t.id)
        .order('depth', { ascending: true })
        .order('created_at', { ascending: true });
      setNodes((n ?? []) as unknown as TraceNode[]);
    } else {
      setNodes([]);
    }
    setLoading(false);
  }, [address]);

  useEffect(() => { void load(); }, [load]);

  // Poll while the agent is still walking the tree
  useEffect(() => {
    if (!trace || ['complete', 'failed'].includes(trace.status)) return;
    const id = setInterval(() => { void load(); }, 6000);
    return () => clearInterval(id);
  }, [trace, load]);

  const start = async () => {
    setStarting(true);
    try {
      const { data, error } = await supabase.functions.invoke('trace-agent', {
        body: {
          action: 'enqueue',
          address,
          network,
          record_id: recordId ?? null,
          workspace_id: workspaceId ?? null,
          trigger_reason: 'Analyst requested autonomous trace',
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success((data as any)?.reused ? 'Existing trace loaded' : 'Autonomous investigation started');
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not start the investigation');
    } finally {
      setStarting(false);
    }
  };

  const runNow = async () => {
    if (!trace) return;
    setStarting(true);
    try {
      await supabase.functions.invoke('trace-agent', { body: { action: 'run', trace_id: trace.id } });
      await load();
    } finally {
      setStarting(false);
    }
  };

  const tree = useMemo(() => {
    const byParent = new Map<string | null, TraceNode[]>();
    nodes.forEach((n) => {
      const k = n.parent_id;
      byParent.set(k, [...(byParent.get(k) ?? []), n]);
    });
    const out: { node: TraceNode; depth: number }[] = [];
    const walk = (parent: string | null, depth: number) => {
      for (const n of byParent.get(parent) ?? []) {
        out.push({ node: n, depth });
        walk(n.id, depth + 1);
      }
    };
    walk(null, 0);
    return out;
  }, [nodes]);

  const running = trace && !['complete', 'failed'].includes(trace.status);

  return (
    <Card className="p-6 bg-card/60 backdrop-blur-xl border-border/50">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Autonomous Investigator</h3>
            <p className="text-xs text-muted-foreground max-w-xl">
              Recursively walks downstream fund flows up to {trace?.depth_limit ?? 3} hops, screens every hop against
              sanctions, scam and attribution data, classifies unknown contracts from on-chain bytecode, and drafts a
              cited narrative.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {trace && (
            <Badge variant="outline" className="capitalize">
              {running && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              {trace.status}
            </Badge>
          )}
          {trace ? (
            <Button size="sm" variant="outline" onClick={running ? runNow : start} disabled={starting}>
              <RefreshCw className={`w-3.5 h-3.5 mr-2 ${starting ? 'animate-spin' : ''}`} />
              {running ? 'Advance now' : 'Re-run'}
            </Button>
          ) : (
            <Button size="sm" onClick={start} disabled={starting}>
              {starting ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <GitBranch className="w-3.5 h-3.5 mr-2" />}
              Investigate downstream
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading agent state…</p>
      ) : !trace ? (
        <p className="text-sm text-muted-foreground">
          No autonomous trace has run for this address yet. High-risk screens start one automatically; you can also launch
          one now.
        </p>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-lg border border-border/50 p-3">
              <p className="text-muted-foreground">Hops mapped</p>
              <p className="text-lg font-semibold">{nodes.filter((n) => n.status === 'done').length}</p>
            </div>
            <div className="rounded-lg border border-border/50 p-3">
              <p className="text-muted-foreground">Budget</p>
              <p className="text-lg font-semibold">{trace.nodes_done}/{trace.node_budget}</p>
            </div>
            <div className="rounded-lg border border-border/50 p-3">
              <p className="text-muted-foreground">Peak downstream risk</p>
              <p className="text-lg font-semibold">
                {trace.max_downstream_risk != null ? `${Math.round(Number(trace.max_downstream_risk))}/100` : '—'}
              </p>
            </div>
            <div className="rounded-lg border border-border/50 p-3">
              <p className="text-muted-foreground">Trigger</p>
              <p className="text-[11px] leading-tight mt-1">{trace.trigger_reason ?? 'Manual'}</p>
            </div>
          </div>

          {trace.error && (
            <div className="flex items-start gap-2 text-sm text-[hsl(var(--risk-high))]">
              <ShieldAlert className="w-4 h-4 mt-0.5" /> {trace.error}
            </div>
          )}

          {/* Risk tree */}
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Risk tree</p>
            <ScrollArea className="max-h-[420px]">
              <div className="space-y-1.5 pr-3">
                {tree.map(({ node, depth }) => (
                  <div
                    key={node.id}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2"
                    style={{ marginLeft: depth * 18 }}
                  >
                    {depth > 0 && <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                    <span className="font-mono text-xs">{short(node.address)}</span>
                    <Badge variant="outline" className={`text-[10px] ${verdictTone(node.verdict, node.risk_score)}`}>
                      {node.status === 'pending'
                        ? 'queued'
                        : node.status === 'error'
                          ? 'error'
                          : `${node.verdict ?? 'unknown'} · ${Math.round(Number(node.risk_score ?? 0))}`}
                    </Badge>
                    {node.entity_name && (
                      <span className="text-[11px] text-muted-foreground">{node.entity_name}</span>
                    )}
                    {node.classification && (
                      <span className="text-[11px] text-muted-foreground">{node.classification.replace(/_/g, ' ')}</span>
                    )}
                    {node.edge?.value != null && (
                      <span className="text-[11px] text-muted-foreground ml-auto font-mono">
                        {node.edge.value} {node.edge.asset ?? ''}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Narrative */}
          {trace.narrative ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                  Investigative narrative (draft)
                </p>
                {trace.narrative_validation?.ok === false && (
                  <Badge variant="outline" className="text-[10px] text-[hsl(var(--risk-medium))]">
                    validation issues
                  </Badge>
                )}
              </div>
              <div className="prose prose-invert prose-sm max-w-none rounded-lg border border-border/40 bg-muted/20 p-4">
                <ReactMarkdown>{trace.narrative}</ReactMarkdown>
              </div>
            </div>
          ) : running ? (
            <p className="text-sm text-muted-foreground">
              Agent is still walking the tree — the narrative is drafted once every hop is screened.
            </p>
          ) : null}
        </div>
      )}
    </Card>
  );
};

export default AgentTracePanel;
