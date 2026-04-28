import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck, ShieldAlert, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SanctionsHit {
  id: string;
  address: string;
  network: string;
  source_list: string;
  program: string | null;
  entity_name: string | null;
  date_listed: string | null;
  metadata: any;
}

interface SanctionsHitsProps {
  walletAddress: string;
  network: string;
}

const SanctionsHits = ({ walletAddress, network }: SanctionsHitsProps) => {
  const [loading, setLoading] = useState(true);
  const [hits, setHits] = useState<SanctionsHit[]>([]);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('sanctions_addresses')
        .select('id, address, network, source_list, program, entity_name, date_listed, metadata')
        .eq('network', network.toLowerCase())
        .ilike('address', walletAddress);

      if (!cancelled) {
        if (error) {
          console.error('Sanctions hits query failed:', error);
          setHits([]);
        } else {
          setHits(data || []);
        }
        setCheckedAt(new Date());
        setLoading(false);
      }
    };
    if (walletAddress && network) run();
    return () => {
      cancelled = true;
    };
  }, [walletAddress, network]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            {hits.length > 0 ? (
              <ShieldAlert className="w-5 h-5 mr-2 text-destructive" />
            ) : (
              <ShieldCheck className="w-5 h-5 mr-2 text-green-600" />
            )}
            Sanctions Hits
            <Badge variant="outline" className="ml-2 text-xs">
              <ExternalLink className="w-3 h-3 mr-1" />
              OFAC SDN
            </Badge>
          </div>
          <Badge variant={hits.length > 0 ? 'destructive' : 'outline'} className="font-semibold">
            {loading ? '…' : `${hits.length} hit${hits.length !== 1 ? 's' : ''}`}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Checking address against OFAC sanctions list…
          </div>
        ) : hits.length === 0 ? (
          <div className="text-center py-6">
            <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p className="font-medium">No OFAC sanctions hits</p>
            <p className="text-sm text-muted-foreground">
              This address was not found in the synced OFAC SDN address list.
            </p>
            {checkedAt && (
              <p className="text-xs text-muted-foreground mt-2">
                Checked {checkedAt.toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>
                <strong>Sanctioned address detected.</strong> This wallet matches{' '}
                {hits.length} entr{hits.length === 1 ? 'y' : 'ies'} on official sanctions
                lists. Block transactions and escalate for compliance review immediately.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {hits.map((hit) => (
                <div
                  key={hit.id}
                  className="border border-destructive/30 rounded-lg p-4 bg-destructive/5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">
                        {hit.entity_name || 'OFAC-Listed Address'}
                      </h4>
                      <p className="text-xs text-muted-foreground font-mono break-all mt-1">
                        {hit.address}
                      </p>
                    </div>
                    <Badge variant="destructive">Direct Match</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs">Source List</span>
                      <p className="font-medium">{hit.source_list}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Program</span>
                      <p className="font-medium">{hit.program || '—'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Network</span>
                      <p className="font-medium uppercase">{hit.network}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Date Listed</span>
                      <p className="font-medium">
                        {hit.date_listed
                          ? new Date(hit.date_listed).toLocaleDateString()
                          : '—'}
                      </p>
                    </div>
                  </div>

                  {hit.metadata && Object.keys(hit.metadata).length > 0 && (
                    <details className="mt-3 text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Additional details
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                        {JSON.stringify(hit.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>

            {checkedAt && (
              <p className="text-xs text-muted-foreground text-right">
                Verified {checkedAt.toLocaleString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SanctionsHits;
