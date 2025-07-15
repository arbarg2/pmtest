
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Building } from 'lucide-react';
import { WalletRiskResponse } from '@/services/api';

interface CounterpartyIntelligenceProps {
  wallet: WalletRiskResponse;
}

const CounterpartyIntelligence = ({ wallet }: CounterpartyIntelligenceProps) => {
  const counterparties = wallet.top_counterparties;
  
  if (!counterparties || counterparties.length === 0) {
    return (
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2 text-primary" />
            Counterparty Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            No counterparty data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="w-5 h-5 mr-2 text-primary" />
            Top Counterparties
          </div>
          <Badge variant="outline">
            {counterparties.length} Entities
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {counterparties.map((counterparty, index) => (
            <div 
              key={index}
              className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                    <Building className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                      {counterparty.entity_name || counterparty.address}
                    </h4>
                    <Badge className={getRiskColor(counterparty.risk_level || 'Low')}>
                      {counterparty.risk_level || 'Low'} Risk
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-600 dark:text-slate-400">Rank #{index + 1}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <TrendingUp className="w-4 h-4 text-accent" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Transactions</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {counterparty.transaction_count.toLocaleString()}
                  </div>
                </div>
                
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Volume</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {counterparty.total_volume.toFixed(2)} {wallet.network.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Risk Indicator */}
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    {(counterparty.risk_level || 'Low') === 'High' 
                      ? '⚠️ High-risk entity - requires enhanced monitoring'
                      : (counterparty.risk_level || 'Low') === 'Medium'
                      ? '⚡ Medium-risk entity - standard due diligence'
                      : '✅ Low-risk entity - standard processing'
                    }
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-lg">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            <strong>Analysis Summary:</strong> This wallet has transacted with {counterparties.length} major 
            counterparties. Risk assessment includes entity reputation, transaction volumes, and regulatory compliance status.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CounterpartyIntelligence;
