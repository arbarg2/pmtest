
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Building2, Activity } from 'lucide-react';
import { WalletRiskResponse } from '@/services/api';
import { Mono } from '@/components/ui/mono';
import { riskTier, riskClasses, riskTierFromLevel } from '@/lib/risk';

interface WalletOverviewProps {
  wallet: WalletRiskResponse;
}

const WalletOverview = ({ wallet }: WalletOverviewProps) => {
  const tier = wallet.risk_level
    ? riskTierFromLevel(wallet.risk_level)
    : riskTier(wallet.risk_score ?? 0);
  const classes = riskClasses(tier);
  const getRiskBadgeClasses = () => `${classes.bgSoft} ${classes.text} ${classes.border}`;

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-primary" />
            Wallet Overview
          </div>
          <Badge className={getRiskBadgeClasses()}>
            {wallet.risk_level} Risk
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Wallet Address */}
        <div className="p-4 bg-muted/40 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Wallet Address</div>
          <Mono className="text-sm break-all text-foreground block">
            {wallet.address}
          </Mono>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/30 border border-border/50 rounded-lg">
            <div className={`text-2xl font-bold tabular-nums ${classes.text}`}>{wallet.risk_score.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">Risk Score</div>
          </div>

          <div className="text-center p-3 bg-muted/30 border border-border/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">{wallet.network.toUpperCase()}</div>
            <div className="text-xs text-muted-foreground">Network</div>
          </div>

          <div className="text-center p-3 bg-muted/30 border border-border/50 rounded-lg">
            <div className="text-2xl font-bold tabular-nums text-foreground">
              {wallet.transaction_count?.toLocaleString() || '0'}
            </div>
            <div className="text-xs text-muted-foreground">Transactions</div>
          </div>

          <div className="text-center p-3 bg-muted/30 border border-border/50 rounded-lg">
            <div className="text-2xl font-bold tabular-nums text-foreground">
              {wallet.processing_time_ms}ms
            </div>
            <div className="text-xs text-muted-foreground">Analysis Time</div>
          </div>
        </div>

        {/* Temporal Information */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Calendar className="w-5 h-5 text-slate-500" />
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">First Seen</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {wallet.temporal_patterns?.first_seen 
                  ? new Date(wallet.temporal_patterns.first_seen).toLocaleDateString()
                  : 'Unknown'
                }
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Activity className="w-5 h-5 text-slate-500" />
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Last Active</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {wallet.last_activity 
                  ? new Date(wallet.last_activity).toLocaleDateString()
                  : 'Unknown'
                }
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletOverview;
