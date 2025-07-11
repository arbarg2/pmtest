
import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WalletRiskResponse } from '@/services/api';

interface WalletRiskFactorsTabProps {
  wallet: WalletRiskResponse;
}

export function WalletRiskFactorsTab({ wallet }: WalletRiskFactorsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Identified Risk Factors</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(wallet.risk_factors || {}).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center space-x-3">
              {value ? (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              <span className="capitalize">{key.replace(/_/g, ' ')}</span>
            </div>
            <Badge variant={value ? 'destructive' : 'outline'}>{value ? 'Detected' : 'Clear'}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
