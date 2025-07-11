import React, { useState } from 'react';
import { ArrowLeft, Download, TrendingUp, Shield, AlertTriangle, CheckCircle, XCircle, Eye, Network, DollarSign, Clock, MapPin, Users, BarChart3, PieChart, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AnalystNotesPanel } from './AnalystNotesPanel';
import { WalletRiskResponse } from '@/services/api';
import { TransactionGraph } from './TransactionGraph';

interface EnhancedWalletResultsProps {
  wallet: WalletRiskResponse;
  onBack: () => void;
  onViewFlow: () => void;
  onGenerateReport: () => void;
}

const EnhancedWalletResults = ({ wallet, onBack, onViewFlow, onGenerateReport }) => {
  const [currentTab, setCurrentTab] = useState('overview');
  const currentLookupRecord = 'your_lookup_record_id';

  const getRiskConfig = (risk) => {
    switch (risk) {
      case 'Low':
        return {
          color: 'text-green-700 bg-green-50 border-green-200',
          icon: <CheckCircle className="w-6 h-6 text-green-600" />,
        };
      case 'Medium':
        return {
          color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
          icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
        };
      case 'High':
        return {
          color: 'text-red-700 bg-red-50 border-red-200',
          icon: <XCircle className="w-6 h-6 text-red-600" />,
        };
      default:
        return {
          color: 'text-gray-700 bg-gray-50 border-gray-200',
          icon: <Shield className="w-6 h-6 text-gray-600" />,
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Enhanced Wallet Analysis</h1>
                <p className="text-sm text-slate-500">Comprehensive risk assessment and analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={onViewFlow} variant="outline">
                <Network className="w-4 h-4 mr-2" />
                View Transaction Flow
              </Button>
              <Button onClick={onGenerateReport} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <Download className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced Header with Address and Timestamp */}
        <Card className="mb-8 shadow-xl border-0 bg-white/90 backdrop-blur">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div className="space-y-2 mb-4 lg:mb-0">
                <h2 className="text-2xl font-bold text-slate-900">Wallet Analysis Results</h2>
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-slate-600">Address:</span>
                    <code className="bg-slate-100 px-3 py-1 rounded text-sm font-mono text-slate-800 break-all">
                      {wallet.address}
                    </code>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-slate-600">Analyzed:</span>
                    <span className="text-sm text-slate-700">
                      {new Date().toLocaleString()} ({wallet.processing_time_ms}ms)
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={`${getRiskConfig(wallet.risk_level).color} text-lg px-4 py-2 font-bold`}>
                  {wallet.risk_level.toUpperCase()} RISK
                </Badge>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">
                    {wallet.risk_score.toFixed(1)}/10
                  </div>
                  <div className="text-sm text-slate-600">Risk Score</div>
                </div>
              </div>
            </div>
            <p className="text-slate-700">{wallet.explanation}</p>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="mb-8">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="riskFactors">Risk Factors</TabsTrigger>
            <TabsTrigger value="entityAttribution">Entity Attribution</TabsTrigger>
            <TabsTrigger value="volumeMetrics">Volume Metrics</TabsTrigger>
            <TabsTrigger value="geographicRisk">Geographic Risk</TabsTrigger>
            <TabsTrigger value="temporalPatterns">Temporal Patterns</TabsTrigger>
            <TabsTrigger value="transactionGraph">Transaction Graph</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Risk Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(wallet.risk_score_breakdown).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                      <Progress value={value.score * 10} className="w-48" />
                      <span className="text-sm text-slate-600">{value.score.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Asset Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(wallet.asset_breakdown).map(([asset, data]) => (
                    <div key={asset} className="flex items-center justify-between">
                      <span>{asset}</span>
                      <span className="text-sm text-slate-600">{data.balance.toFixed(2)}</span>
                      <span className="text-sm text-slate-600">${data.usd_value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Risk Factors Tab */}
          <TabsContent value="riskFactors">
            <Card>
              <CardHeader>
                <CardTitle>Identified Risk Factors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(wallet.risk_factors).map(([key, value]) => (
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
          </TabsContent>

          {/* Entity Attribution Tab */}
          <TabsContent value="entityAttribution">
            <Card>
              <CardHeader>
                <CardTitle>Entity Attribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Name:</strong> {wallet.entity_attribution.name || 'Unknown'}</p>
                <p><strong>Type:</strong> {wallet.entity_attribution.type}</p>
                <p><strong>Risk Level:</strong> {wallet.entity_attribution.risk_level}</p>
                <p><strong>Confidence:</strong> {(wallet.entity_attribution.confidence * 100).toFixed(0)}%</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Volume Metrics Tab */}
          <TabsContent value="volumeMetrics">
            <Card>
              <CardHeader>
                <CardTitle>Volume Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Lifetime Inbound:</strong> {wallet.volume_metrics.lifetime_value.inbound.toFixed(2)}</p>
                <p><strong>Lifetime Outbound:</strong> {wallet.volume_metrics.lifetime_value.outbound.toFixed(2)}</p>
                <p><strong>Net Value:</strong> {wallet.volume_metrics.lifetime_value.net.toFixed(2)}</p>
                <p><strong>USD Equivalent:</strong> ${wallet.volume_metrics.lifetime_value.usd_equivalent.toFixed(2)}</p>
                <p><strong>Average Transaction Size:</strong> {wallet.volume_metrics.average_transaction_size.toFixed(2)}</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Geographic Risk Tab */}
          <TabsContent value="geographicRisk">
            <Card>
              <CardHeader>
                <CardTitle>Geographic Risk</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Primary Region:</strong> {wallet.geographic_risk.primary_region}</p>
                <p><strong>Risk Jurisdictions:</strong> {wallet.geographic_risk.risk_jurisdictions.join(', ') || 'None'}</p>
                <p><strong>Geo Risk Score:</strong> {wallet.geographic_risk.geo_risk_score.toFixed(2)}</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Temporal Patterns Tab */}
          <TabsContent value="temporalPatterns">
            <Card>
              <CardHeader>
                <CardTitle>Temporal Patterns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>First Seen:</strong> {new Date(wallet.temporal_patterns.first_seen).toLocaleString()}</p>
                <p><strong>Last Active:</strong> {new Date(wallet.temporal_patterns.last_active).toLocaleString()}</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transaction Graph Tab */}
          <TabsContent value="transactionGraph">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Graph</CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionGraph address={wallet.address} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Analyst Notes Panel at the end */}
        <AnalystNotesPanel 
          recordId={currentLookupRecord || `temp_${Date.now()}`}
          onUpdate={() => {
            // Refresh any necessary data
            console.log('Analyst notes updated');
          }}
        />
      </div>
    </div>
  );
};

export default EnhancedWalletResults;
