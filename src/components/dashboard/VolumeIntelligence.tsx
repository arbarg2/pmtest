
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight } from 'lucide-react';
import { WalletRiskResponse } from '@/services/api';

interface VolumeIntelligenceProps {
  wallet: WalletRiskResponse;
}

const VolumeIntelligence = ({ wallet }: VolumeIntelligenceProps) => {
  const volumeMetrics = wallet.volume_metrics;
  
  if (!volumeMetrics) {
    return (
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-primary" />
            Volume Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            No volume data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-primary" />
          Volume Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Volume Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-green-400/5 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-green-600">
              {volumeMetrics.lifetime_value?.inbound?.toFixed(2) || '0'} {wallet.network.toUpperCase()}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Total Inbound</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-red-500/10 to-red-400/5 rounded-lg">
            <TrendingDown className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-red-600">
              {volumeMetrics.lifetime_value?.outbound?.toFixed(2) || '0'} {wallet.network.toUpperCase()}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Total Outbound</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-blue-400/5 rounded-lg">
            <div className="text-lg font-bold text-blue-600">
              ${volumeMetrics.lifetime_value?.usd_equivalent?.toLocaleString() || '0'}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">USD Equivalent</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-purple-400/5 rounded-lg">
            <div className="text-lg font-bold text-purple-600">
              {volumeMetrics.average_transaction_size?.toFixed(3) || '0'} {wallet.network.toUpperCase()}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Avg TX Size</div>
          </div>
        </div>

        {/* Net Flow */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ArrowUpRight className="w-5 h-5 text-slate-500" />
              <span className="font-medium text-slate-900 dark:text-slate-100">Net Flow</span>
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {volumeMetrics.lifetime_value?.net?.toFixed(2) || '0'} {wallet.network.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Largest Transaction */}
        {volumeMetrics.largest_transaction && (
          <div className="p-4 bg-gradient-to-r from-accent/5 to-accent/10 rounded-lg border-l-4 border-accent">
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Largest Transaction</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-600 dark:text-slate-400">Amount:</span>
                <div className="font-mono font-bold text-accent">
                  {volumeMetrics.largest_transaction.amount?.toFixed(4)} {wallet.network.toUpperCase()}
                </div>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Direction:</span>
                <div className="font-medium capitalize text-slate-900 dark:text-slate-100">
                  {volumeMetrics.largest_transaction.direction}
                </div>
              </div>
              {volumeMetrics.largest_transaction.timestamp && (
                <div className="col-span-2">
                  <span className="text-slate-600 dark:text-slate-400">Date:</span>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {new Date(volumeMetrics.largest_transaction.timestamp).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VolumeIntelligence;
