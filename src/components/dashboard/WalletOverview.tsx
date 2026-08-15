import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Activity, Wallet } from 'lucide-react';
import { WalletRiskResponse } from '@/services/api';
import { Mono } from '@/components/ui/mono';

interface WalletOverviewProps {
  wallet: WalletRiskResponse;
}

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString() : 'Not available';

/**
 * Thin identity strip. Risk score, network and transaction count live on the
 * VerdictBanner — this shows only what the banner does not, so the same facts
 * are never printed twice on the record page.
 */
const WalletOverview = ({ wallet }: WalletOverviewProps) => {
  return (
    <Card className="bg-card/80 backdrop-blur">
      <CardContent className="py-4 grid gap-4 md:grid-cols-3 md:items-center">
        <div className="md:col-span-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Wallet className="w-3.5 h-3.5" />
            Address
          </div>
          <Mono className="text-sm break-all text-foreground block">{wallet.address}</Mono>
        </div>

        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Calendar className="w-3.5 h-3.5" />
            First seen
          </div>
          <div className="text-sm text-foreground">
            {formatDate(wallet.temporal_patterns?.first_seen)}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Activity className="w-3.5 h-3.5" />
            Last active
          </div>
          <div className="text-sm text-foreground">{formatDate(wallet.last_activity)}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletOverview;
