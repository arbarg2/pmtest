
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, TrendingUp } from 'lucide-react';
import { WalletRiskResponse } from '@/services/api';

interface EntityAttributionProps {
  wallet: WalletRiskResponse;
}

const EntityAttribution = ({ wallet }: EntityAttributionProps) => {
  const entity = wallet.entity_attribution;
  
  if (!entity) {
    return (
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="w-5 h-5 mr-2 text-primary" />
            Entity Attribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            No entity attribution data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const getEntityTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'exchange': return 'bg-green-100 text-green-800 border-green-200';
      case 'mixer': 
      case 'tumbler': return 'bg-red-100 text-red-800 border-red-200';
      case 'defi': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'custodial': return 'bg-green-100 text-green-800 border-green-200';
      case 'private': 
      case 'unknown': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building className="w-5 h-5 mr-2 text-primary" />
          Entity Attribution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Entity Name */}
        <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {entity.name}
          </h3>
          <div className="flex items-center justify-center space-x-3">
            <Badge className={getEntityTypeColor(entity.type)}>
              {entity.type.charAt(0).toUpperCase() + entity.type.slice(1)}
            </Badge>
            <Badge className={getRiskColor(entity.risk_level)}>
              {entity.risk_level} Risk
            </Badge>
          </div>
        </div>

        {/* Confidence Score with Progress Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Attribution Confidence
              </span>
            </div>
            <span className="text-lg font-bold text-accent">
              {Math.round(entity.confidence * 100)}%
            </span>
          </div>
          
          {/* Confidence Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-2">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getConfidenceColor(entity.confidence)}`}
              style={{ width: `${entity.confidence * 100}%` }}
            />
          </div>
          
          {/* Confidence Level Text */}
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
            {entity.confidence >= 0.8 ? 'High Confidence' : 
             entity.confidence >= 0.6 ? 'Medium Confidence' : 'Low Confidence'}
          </div>
        </div>

        {/* Entity Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500/10 to-blue-400/5 rounded-lg text-center">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Entity Type</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 capitalize">
              {entity.type}
            </div>
          </div>
          
          <div className="p-3 bg-gradient-to-br from-green-500/10 to-green-400/5 rounded-lg text-center">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Risk Assessment</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {entity.risk_level}
            </div>
          </div>
        </div>

        {/* Additional Context */}
        <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-lg">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This wallet has been identified as belonging to a <strong>{entity.type}</strong> entity
            with <strong>{Math.round(entity.confidence * 100)}% confidence</strong>. 
            The risk level is assessed as <strong>{entity.risk_level.toLowerCase()}</strong> based on 
            known patterns and behavioral analysis.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EntityAttribution;
