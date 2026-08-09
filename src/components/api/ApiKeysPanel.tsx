import React, { useEffect, useState } from 'react';
import { Key, Plus, Copy, Check, Trash2, ShieldAlert, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ApiKeyRow, createApiKey, listApiKeys, revokeApiKey, deleteApiKey } from '@/services/apiKeys';
import { useNavigate } from 'react-router-dom';

const ApiKeysPanel: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setKeys(await listApiKeys());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
    else setLoading(false);
  }, [user]);

  const handleCreate = async () => {
    try {
      setCreating(true);
      const { key } = await createApiKey(name);
      setNewKey(key);
      setName('');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create key');
    } finally {
      setCreating(false);
    }
  };

  const copyKey = () => {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <Card className="bg-card/60 backdrop-blur-sm border-border/60">
        <CardContent className="p-8 text-center space-y-4">
          <Key className="w-8 h-8 mx-auto text-primary" />
          <div>
            <h3 className="font-semibold text-foreground mb-1">Sign in to get an API key</h3>
            <p className="text-sm text-muted-foreground">
              API keys are tied to your account. Create a free account to start with 1,000 requests/month.
            </p>
          </div>
          <Button onClick={() => navigate('/auth?next=' + encodeURIComponent('/api-docs'))}>
            Sign in / Create account
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card/60 backdrop-blur-sm border-border/60">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center text-xl">
            <Key className="w-5 h-5 mr-2 text-primary" />
            Your API keys
          </CardTitle>
          <Badge variant="outline" className="font-mono text-xs">
            {keys.filter((k) => !k.revoked_at).length} active
          </Badge>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Key name (e.g. Production backend)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
            />
            <Button onClick={handleCreate} disabled={creating} className="shrink-0">
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Create key
            </Button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">Loading keys…</div>
          ) : keys.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No keys yet. Create one above to start calling the API.
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((k) => {
                const pct = Math.min(100, Math.round(((k.usage_this_month ?? 0) / k.monthly_quota) * 100));
                return (
                  <div
                    key={k.id}
                    className="rounded-lg border border-border/60 bg-background/40 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground truncate">{k.name}</span>
                        {k.revoked_at ? (
                          <Badge variant="destructive" className="text-[10px]">Revoked</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] uppercase">{k.plan}</Badge>
                        )}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground mt-1">{k.key_prefix}••••••••••••••••</div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-1.5 flex-1 max-w-[220px] rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {k.usage_this_month ?? 0} / {k.monthly_quota} this month
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        {k.last_used_at ? `Last used ${new Date(k.last_used_at).toLocaleString()}` : 'Never used'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!k.revoked_at && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            await revokeApiKey(k.id);
                            toast.success('Key revoked');
                            load();
                          }}
                        >
                          <ShieldAlert className="w-4 h-4 mr-1" /> Revoke
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          await deleteApiKey(k.id);
                          toast.success('Key deleted');
                          load();
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!newKey} onOpenChange={(o) => !o && setNewKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy your API key now</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This is the only time the full key will be shown. We store a hash only — if you lose it, create a new key.
          </p>
          <div className="rounded-lg bg-muted p-3 font-mono text-xs break-all">{newKey}</div>
          <Button onClick={copyKey}>
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied' : 'Copy key'}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ApiKeysPanel;
