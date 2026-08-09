import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ShieldCheck, ChevronDown, FileClock, Hash, Layers, Database, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Mono } from '@/components/ui/mono';
import { toast } from 'sonner';

interface ProvenanceCardProps {
  address: string;
}

interface DecisionRow {
  id: string;
  created_at: string;
  verdict: string;
  risk_score: number;
  network: string;
  source: string;
  ruleset_version: string | null;
  ruleset_hash: string | null;
  block_height: number | null;
  entity_category: string | null;
  payload_hash: string | null;
  sanctions_snapshot_date: string | null;
  rules_evaluated: any;
  provenance: any;
}

const severityTone: Record<string, string> = {
  high: 'bg-risk-high/15 text-risk-high border-risk-high/30',
  medium: 'bg-risk-medium/15 text-risk-medium border-risk-medium/30',
  low: 'bg-risk-low/15 text-risk-low border-risk-low/30',
};

const ProvenanceCard: React.FC<ProvenanceCardProps> = ({ address }) => {
  const [decisions, setDecisions] = useState<DecisionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('screening_decisions')
        .select('id, created_at, verdict, risk_score, network, source, ruleset_version, ruleset_hash, block_height, entity_category, payload_hash, sanctions_snapshot_date, rules_evaluated, provenance')
        .ilike('address', address)
        .order('created_at', { ascending: false })
        .limit(5);
      if (!cancelled) {
        setDecisions((data as any) ?? []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [address]);

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied((c) => (c === label ? null : c)), 1800);
  };

  if (loading) {
    return <Card className="p-6 animate-pulse text-sm text-muted-foreground">Loading decision evidence…</Card>;
  }

  if (decisions.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileClock className="h-4 w-4" />
          No immutable screening decision has been recorded for this address yet.
        </div>
      </Card>
    );
  }

  const latest = decisions[0];
  const rules: any[] = Array.isArray(latest.rules_evaluated) ? latest.rules_evaluated : [];
  const fired = rules.filter((r) => (r.applied_score ?? 0) !== 0);

  return (
    <Card className="p-6 space-y-5 border-glow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-neon-cyan" />
          <div>
            <h3 className="font-semibold tracking-tight">Decision provenance</h3>
            <p className="text-xs text-muted-foreground">
              Append-only evidence record — reproducible and defensible for audit.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="uppercase tracking-wide text-[10px]">{latest.source}</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field icon={<Layers className="h-3.5 w-3.5" />} label="Ruleset">
          <Mono>{latest.ruleset_version ?? '—'}</Mono>
        </Field>
        <Field icon={<Database className="h-3.5 w-3.5" />} label="Block height">
          <Mono>{latest.block_height?.toLocaleString() ?? '—'}</Mono>
        </Field>
        <Field icon={<FileClock className="h-3.5 w-3.5" />} label="Sanctions snapshot">
          <span className="text-xs">
            {latest.sanctions_snapshot_date ? new Date(latest.sanctions_snapshot_date).toLocaleString() : '—'}
          </span>
        </Field>
        <Field icon={<Hash className="h-3.5 w-3.5" />} label="Evidence hash">
          <button
            className="inline-flex items-center gap-1 text-xs hover:text-neon-cyan transition-colors"
            onClick={() => latest.payload_hash && copy(latest.payload_hash, 'Evidence hash')}
          >
            <Mono>{latest.payload_hash ? `${latest.payload_hash.slice(0, 12)}…` : '—'}</Mono>
            {copied === 'Evidence hash' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </button>
        </Field>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Rules evaluated ({fired.length} fired of {rules.length})
        </p>
        <div className="space-y-1.5">
          {rules.map((r, i) => (
            <div
              key={`${r.rule_id}-${i}`}
              className={`flex items-start justify-between gap-3 rounded-md border px-3 py-2 text-xs ${
                (r.applied_score ?? 0) !== 0 ? severityTone[r.severity] ?? 'border-border' : 'border-border/50 opacity-60'
              }`}
            >
              <div className="min-w-0">
                <Mono className="text-[11px]">{r.rule_id}</Mono>
                <p className="mt-0.5 text-muted-foreground">{r.description}</p>
              </div>
              <span className="shrink-0 font-semibold">
                {(r.applied_score ?? 0) > 0 ? `+${r.applied_score}` : r.applied_score ?? 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1 px-0 text-xs">
            <ChevronDown className="h-3.5 w-3.5" /> Decision history ({decisions.length})
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-1.5">
          {decisions.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <Mono className="text-[11px]">{d.id.slice(0, 8)}</Mono>
                <span className="text-muted-foreground">{new Date(d.created_at).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] uppercase">{d.verdict}</Badge>
                <span className="font-semibold">{Number(d.risk_score)}/100</span>
              </div>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

const Field = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
  <div className="rounded-lg border border-border/60 bg-card/40 p-3">
    <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
      {icon} {label}
    </div>
    {children}
  </div>
);

export default ProvenanceCard;
