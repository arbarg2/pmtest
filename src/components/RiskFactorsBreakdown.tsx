
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, Shield, AlertCircle, Info } from 'lucide-react';
import { RiskFactor } from '@/services/riskFactors';

interface RiskFactorsBreakdownProps {
  factors: RiskFactor[];
  isLoading?: boolean;
}

const RiskFactorsBreakdown = ({ factors, isLoading }: RiskFactorsBreakdownProps) => {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'high':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
          bgColor: 'bg-red-50'
        };
      case 'medium':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <AlertCircle className="w-4 h-4 text-yellow-600" />,
          bgColor: 'bg-yellow-50'
        };
      case 'low':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <Shield className="w-4 h-4 text-green-600" />,
          bgColor: 'bg-green-50'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Info className="w-4 h-4 text-gray-600" />,
          bgColor: 'bg-gray-50'
        };
    }
  };

  const formatFactorName = (factorType: string) => {
    return factorType.replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const getFactorTooltip = (factorType: string) => {
    const tooltips: Record<string, string> = {
      'sanctions_exposure': 'Direct or indirect exposure to sanctioned entities',
      'mixer_proximity': 'Connection to cryptocurrency mixing services',
      'high_frequency_transactions': 'Unusually high transaction frequency patterns',
      'suspicious_volume': 'Transaction volumes exceeding normal patterns',
      'exchange_risk': 'Risk associated with exchange-type entities',
      'dark_market_exposure': 'Potential connection to dark market activities',
      'fraud_reports': 'Entity flagged in fraud reporting systems'
    };
    
    return tooltips[factorType] || 'Risk factor detected in wallet analysis';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Risk Factors Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Risk Factors Breakdown
            </div>
            <Badge variant="outline">
              {factors.length} Factor{factors.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {factors.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <Shield className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p className="font-medium">No significant risk factors detected</p>
              <p className="text-sm">This wallet shows low risk indicators</p>
            </div>
          ) : (
            <div className="space-y-4">
              {factors.map((factor) => {
                const config = getSeverityConfig(factor.severity);
                
                return (
                  <div key={factor.id} className={`p-4 rounded-lg border ${config.bgColor}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {config.icon}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <h4 className="font-medium text-slate-900 cursor-help">
                              {formatFactorName(factor.factor_type)}
                            </h4>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{getFactorTooltip(factor.factor_type)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={config.color}>
                          {factor.severity.toUpperCase()}
                        </Badge>
                        <div className="text-sm font-mono text-slate-600">
                          {factor.score.toFixed(1)}
                        </div>
                      </div>
                    </div>
                    
                    {factor.description && (
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {factor.description}
                      </p>
                    )}
                    
                    <div className="mt-2 flex justify-between items-center text-xs text-slate-500">
                      <span>Detected: {new Date(factor.detected_at).toLocaleString()}</span>
                      <span>Impact Score: {factor.score.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default RiskFactorsBreakdown;
