
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, MapPin, AlertTriangle } from 'lucide-react';
import { WalletRiskResponse } from '@/services/api';

interface GeographicRiskProps {
  wallet: WalletRiskResponse;
}

const GeographicRisk = ({ wallet }: GeographicRiskProps) => {
  const geoRisk = wallet.geographic_risk;
  
  if (!geoRisk) {
    return (
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2 text-primary" />
            Geographic Risk
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            No geographic risk data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRiskScoreColor = (score: number) => {
    if (score >= 7) return 'text-red-600';
    if (score >= 4) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Globe className="w-5 h-5 mr-2 text-primary" />
          Geographic Risk Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Region */}
        <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-400/5 rounded-lg">
          <div className="flex items-center space-x-3 mb-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-slate-900 dark:text-slate-100">Primary Region</h4>
          </div>
          <div className="text-xl font-bold text-blue-600">
            {geoRisk.primary_region}
          </div>
        </div>

        {/* Risk Score */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Geographic Risk Score
            </span>
            <span className={`text-2xl font-bold ${getRiskScoreColor(geoRisk.geo_risk_score)}`}>
              {geoRisk.geo_risk_score.toFixed(1)}/10
            </span>
          </div>
          
          {/* Risk Score Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                geoRisk.geo_risk_score >= 7 
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : geoRisk.geo_risk_score >= 4
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                  : 'bg-gradient-to-r from-green-500 to-green-600'
              }`}
              style={{ width: `${(geoRisk.geo_risk_score / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* Risk Jurisdictions */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-slate-500" />
            <h4 className="font-medium text-slate-900 dark:text-slate-100">Risk Jurisdictions</h4>
          </div>
          
          {geoRisk.risk_jurisdictions && geoRisk.risk_jurisdictions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {geoRisk.risk_jurisdictions.map((jurisdiction, index) => (
                <Badge 
                  key={index}
                  variant="outline"
                  className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400"
                >
                  {jurisdiction}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-700 dark:text-green-400">
                  No high-risk jurisdictions detected
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Risk Assessment Summary */}
        <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-lg">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            <strong>Geographic Analysis:</strong> Primary activity detected in {geoRisk.primary_region} 
            with a risk score of {geoRisk.geo_risk_score.toFixed(1)}/10. 
            {geoRisk.risk_jurisdictions && geoRisk.risk_jurisdictions.length > 0 
              ? ` ${geoRisk.risk_jurisdictions.length} high-risk jurisdiction(s) identified.`
              : ' No significant jurisdictional risks detected.'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeographicRisk;
