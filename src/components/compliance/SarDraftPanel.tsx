import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Loader2, Copy, Check, ShieldAlert, ShieldCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SarDraftPanelProps {
  address: string;
  network?: string;
  recordId?: string | null;
  workspaceId?: string | null;
}

interface SarResult {
  id: string | null;
  narrative: string;
  evidence: { id: string; kind: string; statement: string; source: string }[];
  validation: { ok: boolean; issues: string[]; citations: string[] };
}

const SarDraftPanel: React.FC<SarDraftPanelProps> = ({ address, network, recordId, workspaceId }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SarResult | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sar-generate', {
        body: { address, network, record_id: recordId ?? null, workspace_id: workspaceId ?? null },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResult(data as SarResult);
      toast.success('SAR narrative drafted from immutable evidence');
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not generate the SAR narrative');
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.narrative);
    setCopied(true);
    toast.success('SAR narrative copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-neon-violet" />
          <div>
            <h3 className="font-semibold tracking-tight">Evidence-bound SAR draft</h3>
            <p className="text-xs text-muted-foreground">
              Every factual sentence is cited to a recorded decision, rule hit, or sanctions list entry.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <Button variant="outline" size="sm" onClick={copy} className="gap-1">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy
            </Button>
          )}
          <Button size="sm" onClick={generate} disabled={loading} className="gap-1">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            {result ? 'Regenerate' : 'Generate draft'}
          </Button>
        </div>
      </div>

      {result && (
        <>
          <div
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
              result.validation.ok
                ? 'border-risk-low/30 bg-risk-low/10 text-risk-low'
                : 'border-risk-high/30 bg-risk-high/10 text-risk-high'
            }`}
          >
            {result.validation.ok ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
            {result.validation.ok
              ? `Validated — ${result.validation.citations.length} citations, all resolve to stored evidence.`
              : `Review required — ${result.validation.issues.join('; ')}`}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {result.evidence.map((e) => (
              <Badge key={e.id} variant="outline" className="text-[10px]" title={e.statement}>
                {e.id} · {e.kind}
              </Badge>
            ))}
          </div>

          <ScrollArea className="max-h-[520px] rounded-lg border border-border/60 bg-card/40 p-4">
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown>{result.narrative}</ReactMarkdown>
            </div>
          </ScrollArea>
        </>
      )}
    </Card>
  );
};

export default SarDraftPanel;
