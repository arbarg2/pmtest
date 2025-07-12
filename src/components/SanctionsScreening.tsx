
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Target, Globe } from 'lucide-react';
import { SanctionsMatch } from '@/services/riskFactors';

interface SanctionsScreeningProps {
  matches: SanctionsMatch[];
  isLoading?: boolean;
}

const SanctionsScreening = ({ matches, isLoading }: SanctionsScreeningProps) => {
  const getMatchTypeConfig = (matchType: string) => {
    switch (matchType) {
      case 'direct':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <Target className="w-4 h-4 text-red-600" />,
          label: 'Direct Match',
          description: 'Wallet directly matches sanctioned entity'
        };
      case '1-hop':
        return {
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: <Globe className="w-4 h-4 text-orange-600" />,
          label: '1-Hop Exposure',
          description: 'One transaction away from sanctioned entity'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Shield className="w-4 h-4 text-gray-600" />,
          label: 'Unknown',
          description: 'Match type not specified'
        };
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-red-600 font-bold';
    if (confidence >= 0.6) return 'text-orange-600 font-medium';
    return 'text-yellow-600';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Sanctions Screening
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map(i => (
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

  const directMatches = matches.filter(m => m.match_type === 'direct');
  const hopMatches = matches.filter(m => m.match_type === '1-hop');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Sanctions Screening
          </div>
          <Badge variant={matches.length > 0 ? "destructive" : "outline"}>
            {matches.length} Match{matches.length !== 1 ? 'es' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <div className="text-center py-6">
            <Shield className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p className="font-medium text-slate-900">No sanctions exposure detected</p>
            <p className="text-sm text-slate-500">Wallet cleared against sanctions databases</p>
          </div>
        ) : (
          <div className="space-y-4">
            {directMatches.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Critical:</strong> Direct sanctions exposure detected. 
                  Immediate compliance review required.
                </AlertDescription>
              </Alert>
            )}

            {hopMatches.length > 0 && directMatches.length === 0 && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Warning:</strong> Indirect sanctions exposure detected. 
                  Enhanced due diligence recommended.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              {matches.map((match) => {
                const config = getMatchTypeConfig(match.match_type);
                
                return (
                  <div key={match.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {config.icon}
                        <div>
                          <h4 className="font-medium text-slate-900">
                            {match.entity_name}
                          </h4>
                          <p className="text-sm text-slate-600">
                            {match.entity_type}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={config.color}>
                          {config.label}
                        </Badge>
                        <div className={`text-sm mt-1 ${getConfidenceColor(match.confidence_score)}`}>
                          {Math.round(match.confidence_score * 100)}% confidence
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Source List:</span>
                        <p className="font-medium">{match.source_list}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Screened:</span>
                        <p className="font-medium">
                          {new Date(match.screening_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-2 bg-slate-50 rounded text-xs text-slate-600">
                      {config.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SanctionsScreening;
