import React, { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Webhook, Plus, Loader2, Trash2, Send, Copy, Check, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Mono } from '@/components/ui/mono';
import { toast } from 'sonner';

interface Endpoint {
  id: string;
  url: string;
  description: string | null;
  secret_prefix: string;
  events: string[];
  is_active: boolean;
  created_at: string;
}

interface Delivery {
  id: string;
  endpoint_id: string;
  event_type: string;
  status_code: number | null;
  error: string | null;
  attempt: number;
  created_at: string;
}

const WebhookEndpoints: React.FC = () => {
  const { workspace, can, loading: wsLoading } = useWorkspace();
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const call = useCallback(
    async (action: string, payload: Record<string, unknown> = {}) => {
      if (!workspace) return null;
      const { data, error } = await supabase.functions.invoke('webhooks-admin', {
        body: { action, workspace_id: workspace.id, ...payload },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as any;
    },
    [workspace],
  );

  const refresh = useCallback(async () => {
    try {
      const list = await call('list');
      if (list) setEndpoints(list.endpoints ?? []);
      const del = await call('deliveries');
      if (del) setDeliveries(del.deliveries ?? []);
    } catch (e: any) {
      // silent — panel renders empty for users without permission
    }
  }, [call]);

  useEffect(() => {
    if (workspace && can('manage_webhooks')) refresh();
  }, [workspace, refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  if (wsLoading) return null;
  if (!workspace || !can('manage_webhooks')) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          Webhook delivery is managed by workspace owners and compliance officers.
        </div>
      </Card>
    );
  }

  const create = async () => {
    if (!/^https:\/\/.+/i.test(url.trim())) {
      toast.error('Enter a valid https:// endpoint URL');
      return;
    }
    setBusy(true);
    try {
      const res = await call('create', { url: url.trim() });
      setNewSecret(res.secret);
      setUrl('');
      toast.success('Endpoint created — copy the signing secret now');
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not create the endpoint');
    } finally {
      setBusy(false);
    }
  };

  const act = async (action: string, payload: Record<string, unknown>, msg: string) => {
    try {
      await call(action, payload);
      toast.success(msg);
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? 'Action failed');
    }
  };

  const copySecret = async () => {
    if (!newSecret) return;
    await navigator.clipboard.writeText(newSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Webhook className="h-5 w-5 text-neon-cyan" />
        <div>
          <h3 className="font-semibold tracking-tight">Signed alert webhooks</h3>
          <p className="text-xs text-muted-foreground">
            Risk changes, escalations and sanctions hits, HMAC-SHA256 signed and delivery-logged.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="https://your-system.example.com/rian-webhook"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="font-mono text-xs"
        />
        <Button onClick={create} disabled={busy} className="gap-1 shrink-0">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
        </Button>
      </div>

      {newSecret && (
        <div className="rounded-lg border border-neon-cyan/30 bg-neon-cyan/5 p-3">
          <p className="mb-1 text-xs font-medium">Signing secret — shown once, store it now</p>
          <div className="flex items-center gap-2">
            <Mono className="flex-1 break-all text-[11px]">{newSecret}</Mono>
            <Button variant="outline" size="sm" onClick={copySecret}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Verify with <Mono className="text-[10px]">HMAC_SHA256(secret, `${'{'}timestamp{'}'}.${'{'}rawBody{'}'}`)</Mono> against the
            <Mono className="text-[10px]"> X-Rian-Signature</Mono> header. Reject timestamps older than 5 minutes.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {endpoints.length === 0 && (
          <p className="text-xs text-muted-foreground">No endpoints configured yet.</p>
        )}
        {endpoints.map((ep) => (
          <div key={ep.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
            <div className="min-w-0">
              <Mono className="block truncate text-xs">{ep.url}</Mono>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                {ep.events.map((e) => (
                  <Badge key={e} variant="outline" className="text-[10px]">{e}</Badge>
                ))}
                <span className="text-[10px] text-muted-foreground">· {ep.secret_prefix}…</span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Switch
                checked={ep.is_active}
                onCheckedChange={(v) => act('update', { endpoint_id: ep.id, is_active: v }, v ? 'Endpoint enabled' : 'Endpoint paused')}
              />
              <Button variant="ghost" size="sm" onClick={() => act('test', {}, 'Test event dispatched')}>
                <Send className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => act('delete', { endpoint_id: ep.id }, 'Endpoint removed')}>
                <Trash2 className="h-3.5 w-3.5 text-risk-high" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {deliveries.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recent deliveries</p>
          {deliveries.slice(0, 8).map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-md border border-border/50 px-3 py-1.5 text-[11px]">
              <span className="text-muted-foreground">{new Date(d.created_at).toLocaleString()}</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{d.event_type}</Badge>
                <span className={d.status_code && d.status_code < 300 ? 'text-risk-low' : 'text-risk-high'}>
                  {d.status_code ?? d.error ?? 'pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default WebhookEndpoints;
