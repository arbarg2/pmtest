
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Target, Globe, ExternalLink } from 'lucide-react';
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
          description: 'Entity directly matches sanctioned database',
          severity: 'critical'
        };
      case '1-hop':
        return {
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: <Globe className="w-4 h-4 text-orange-600" />,
          label: '1-Hop Exposure',
          description: 'Indirect connection to sanctioned entity',
          severity: 'warning'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Shield className="w-4 h-4 text-gray-600" />,
          label: 'Unknown',
          description: 'Match type not specified',
          severity: 'info'
        };
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-red-600 font-bold';
    if (confidence >= 0.6) return 'text-orange-600 font-medium';
    if (confidence >= 0.4) return 'text-yellow-600 font-medium';
    return 'text-gray-600';
  };

  const getSourceListBadgeColor = (sourceList: string) => {
    if (sourceList.includes('OFAC')) return 'bg-red-100 text-red-800 border-red-200';
    if (sourceList.includes('EU')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (sourceList.includes('UN')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (sourceList.includes('Demo') || sourceList.includes('Mock')) return 'bg-gray-100 text-gray-600 border-gray-200';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Sanctions Screening
            <Badge variant="outline" className="ml-2">Real-time</Badge>
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
  const highConfidenceMatches = matches.filter(m => m.confidence_score >= 0.7);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Sanctions Screening
            <Badge variant="outline" className="ml-2 text-xs">
              <ExternalLink className="w-3 h-3 mr-1" />
              Live API
            </Badge>
          </div>
          <Badge variant={matches.length > 0 ? "destructive" : "outline"} className="font-semibold">
            {matches.length} Match{matches.length !== 1 ? 'es' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <div className="text-center py-6">
            <Shield className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p className="font-medium text-slate-900">No sanctions exposure detected</p>
            <p className="text-sm text-slate-500">Wallet cleared against international sanctions databases</p>
            <div className="mt-3 flex justify-center space-x-2">
              <Badge variant="outline" className="text-xs">OFAC</Badge>
              <Badge variant="outline" className="text-xs">EU</Badge>
              <Badge variant="outline" className="text-xs">UN</Badge>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Critical Alerts */}
            {directMatches.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Critical Alert:</strong> {directMatches.length} direct sanctions match{directMatches.length !== 1 ? 'es' : ''} detected. 
                  Immediate compliance review and transaction blocking required.
                </AlertDescription>
              </Alert>
            )}

            {/* Warning Alerts */}
            {hopMatches.length > 0 && directMatches.length === 0 && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Warning:</strong> {hopMatches.length} indirect sanctions exposure{hopMatches.length !== 1 ? 's' : ''} detected. 
                  Enhanced due diligence and monitoring recommended.
                </AlertDescription>
              </Alert>
            )}

            {/* High Confidence Alert */}
            {highConfidenceMatches.length > 0 && (
              <Alert className="border-purple-200 bg-purple-50">
                <AlertTriangle className="h-4 w-4 text-purple-600" />
                <AlertDescription className="text-purple-800">
                  <strong>High Confidence:</strong> {highConfidenceMatches.length} match{highConfidenceMatches.length !== 1 ? 'es' : ''} with 70%+ confidence. 
                  Verify against additional intelligence sources.
                </AlertDescription>
              </Alert>
            )}

            {/* Detailed Match Results */}
            <div className="space-y-3">
              {matches.map((match) => {
                const config = getMatchTypeConfig(match.match_type);
                
                return (
                  <div key={match.id} className={`border rounded-lg p-4 bg-white ${config.severity === 'critical' ? 'border-red-200 shadow-red-100 shadow-md' : config.severity === 'warning' ? 'border-orange-200' : 'border-gray-200'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {config.icon}
                        <div>
                          <h4 className="font-semibold text-slate-900">
                            {match.entity_name}
                          </h4>
                          <p className="text-sm text-slate-600">
                            {match.entity_type}
                          </p>
                          <Badge className={`mt-1 ${getSourceListBadgeColor(match.source_list)} text-xs`}>
                            {match.source_list}
                          </Badge>
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
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-slate-500">Match Type:</span>
                        <p className="font-medium capitalize">{match.match_type.replace('-', ' ')}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Screened:</span>
                        <p className="font-medium">
                          {new Date(match.screening_date).toLocaleDateString()} {new Date(match.screening_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                    
                    <div className={`p-3 rounded text-xs ${config.severity === 'critical' ? 'bg-red-50 text-red-700' : config.severity === 'warning' ? 'bg-orange-50 text-orange-700' : 'bg-slate-50 text-slate-600'}`}>
                      <div className="flex items-center justify-between">
                        <span>{config.description}</span>
                        {match.confidence_score >= 0.8 && (
                          <Badge variant="destructive" className="text-xs ml-2">High Risk</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Statistics */}
            <div className="mt-4 p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200">
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <div className="font-semibold text-slate-900">{directMatches.length}</div>
                  <div className="text-slate-600">Direct</div>
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{hopMatches.length}</div>
                  <div className="text-slate-600">Indirect</div>
                </div>
                <div>
                  <div className="font-semibold text-slate-900">
                    {matches.length > 0 ? Math.round(Math.max(...matches.map(m => m.confidence_score)) * 100) : 0}%
                  </div>
                  <div className="text-slate-600">Max Confidence</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SanctionsScreening;
