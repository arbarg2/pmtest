import React, { useState } from 'react';
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, XCircle, Eye, FileText, ChevronDown, ChevronUp, Building2, Globe, Clock, TrendingUp, Users, PieChart, Target, MapPin, Activity, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { WalletRiskResponse } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface EnhancedWalletResultsProps {
  wallet: WalletRiskResponse;
  onBack: () => void;
  onViewFlow: () => void;
  onGenerateReport: () => void;
}

const EnhancedWalletResults = ({ wallet, onBack, onViewFlow, onGenerateReport }: EnhancedWalletResultsProps) => {
  const [isAnalystMode, setIsAnalystMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Wallet address copied successfully",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const getRiskConfig = (risk: string) => {
    switch (risk) {
      case 'Low':
        return {
          color: 'text-green-700 bg-green-50 border-green-200',
          bgClass: 'from-green-50 to-emerald-50',
          icon: <CheckCircle className="w-8 h-8 text-green-600" />,
          gradient: 'from-green-500 to-emerald-600'
        };
      case 'Medium':
        return {
          color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
          bgClass: 'from-yellow-50 to-orange-50',
          icon: <AlertTriangle className="w-8 h-8 text-yellow-600" />,
          gradient: 'from-yellow-500 to-orange-600'
        };
      case 'High':
        return {
          color: 'text-red-700 bg-red-50 border-red-200',
          bgClass: 'from-red-50 to-pink-50',
          icon: <XCircle className="w-8 h-8 text-red-600" />,
          gradient: 'from-red-500 to-pink-600'
        };
      default:
        return {
          color: 'text-gray-700 bg-gray-50 border-gray-200',
          bgClass: 'from-gray-50 to-slate-50',
          icon: <Shield className="w-8 h-8 text-gray-600" />,
          gradient: 'from-gray-500 to-slate-600'
        };
    }
  };

  const riskConfig = getRiskConfig(wallet.risk_level);
  const analysisTimestamp = new Date().toLocaleString();

  return (
    <div className={`min-h-screen bg-gradient-to-br ${riskConfig.bgClass} relative overflow-hidden`}>
      <header className="border-b border-slate-200/50 bg-white/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Enhanced Wallet Analysis</h1>
                <p className="text-sm text-slate-500">
                  {wallet.entity_attribution.name || 'Unknown Entity'} • {wallet.network} Network
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant={isAnalystMode ? "default" : "outline"}
                onClick={() => setIsAnalystMode(!isAnalystMode)}
                className="text-sm"
              >
                {isAnalystMode ? 'Simple View' : 'Analyst Mode'}
              </Button>
              <Button variant="outline" onClick={onViewFlow}>
                <Eye className="w-4 h-4 mr-2" />
                View Flow
              </Button>
              <Button onClick={onGenerateReport} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Wallet Address & Analysis Info - Prominent Display */}
        <Card className="mb-6 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Wallet Address</p>
                    <div className="flex items-center space-x-2">
                      <code className="text-lg font-mono bg-slate-100 px-3 py-1 rounded-lg border">
                        {wallet.address}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard(wallet.address)}
                        className="p-1 h-8 w-8"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600 font-medium">Analysis Time</p>
                  <p className="text-lg font-bold text-slate-900">{analysisTimestamp}</p>
                  <p className="text-xs text-slate-500">Processing: {wallet.processing_time_ms}ms</p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-200">
                <div className="text-center">
                  <p className="text-sm text-slate-600">Network</p>
                  <Badge variant="outline" className="font-semibold">
                    {wallet.network}
                  </Badge>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600">Risk Level</p>
                  <Badge className={`${riskConfig.color} font-semibold`}>
                    {wallet.risk_level}
                  </Badge>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600">Risk Score</p>
                  <p className="text-xl font-bold text-slate-900">{wallet.risk_score.toFixed(1)}/10</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600">Entity Type</p>
                  <p className="font-semibold text-slate-900">{wallet.entity_attribution.type}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entity Attribution Card */}
        <Card className="mb-6 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {wallet.entity_attribution.name || 'Unknown Entity'}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {wallet.entity_attribution.type} • {(wallet.entity_attribution.confidence * 100).toFixed(0)}% confidence
                  </p>
                </div>
              </div>
              <Badge className={`${getRiskConfig(wallet.entity_attribution.risk_level).color} font-semibold`}>
                {wallet.entity_attribution.risk_level} Risk Entity
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Analysis Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Risk Score with Breakdown */}
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    {riskConfig.icon}
                    <span className="ml-4 text-2xl">Risk Assessment</span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <span className="text-4xl font-bold text-slate-900">{wallet.risk_score.toFixed(1)}</span>
                      <span className="text-lg text-slate-500">/10</span>
                    </div>
                    <Badge className={`${riskConfig.color} border-2 text-sm px-4 py-2 font-bold`}>
                      {wallet.risk_level.toUpperCase()} RISK
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 leading-relaxed mb-6">
                  {wallet.explanation}
                </p>
                
                {/* Risk Score Breakdown */}
                <Collapsible open={expandedSections.riskBreakdown} onOpenChange={() => toggleSection('riskBreakdown')}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                      <span className="font-medium">Risk Score Breakdown</span>
                      {expandedSections.riskBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="space-y-4">
                      {Object.entries(wallet.risk_score_breakdown).map(([factor, data]) => (
                        <div key={factor} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize text-slate-600">{factor.replace(/_/g, ' ')}</span>
                            <span className="font-medium">{data.score.toFixed(1)} ({(data.weight * 100).toFixed(0)}% weight)</span>
                          </div>
                          <Progress value={(data.score / 10) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>

            {/* Volume Metrics */}
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-6 h-6 mr-3 text-blue-600" />
                  Volume Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-600">Total Inbound</p>
                    <p className="text-xl font-bold text-green-600">
                      {wallet.volume_metrics.lifetime_value.inbound.toFixed(2)} {wallet.network}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-600">Total Outbound</p>
                    <p className="text-xl font-bold text-red-600">
                      {wallet.volume_metrics.lifetime_value.outbound.toFixed(2)} {wallet.network}
                    </p>
                  </div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                  <p className="text-sm text-slate-600">USD Equivalent Volume</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${wallet.volume_metrics.lifetime_value.usd_equivalent.toLocaleString()}
                  </p>
                </div>

                {isAnalystMode && (
                  <Collapsible open={expandedSections.volumeDetails} onOpenChange={() => toggleSection('volumeDetails')}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between mt-4">
                        <span>Volume Details</span>
                        {expandedSections.volumeDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4 space-y-4">
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <h4 className="font-medium mb-2">Largest Transaction</h4>
                        <p className="text-sm text-slate-600">
                          {wallet.volume_metrics.largest_transaction.amount.toFixed(4)} {wallet.network} • 
                          {wallet.volume_metrics.largest_transaction.direction}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">
                          {wallet.volume_metrics.largest_transaction.counterparty?.slice(0, 16)}...
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <h4 className="font-medium mb-2">Average Transaction Size</h4>
                        <p className="text-lg font-bold">
                          {wallet.volume_metrics.average_transaction_size.toFixed(4)} {wallet.network}
                        </p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </CardContent>
            </Card>

            {/* Behavioral Classification */}
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Target className="w-6 h-6 mr-3 text-blue-600" />
                    Behavioral Classification
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {(wallet.behavioral_classification.confidence_level * 100).toFixed(0)}% confidence
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {wallet.behavioral_classification.primary_type}
                  </h3>
                  <div className="space-y-2">
                    {wallet.behavioral_classification.supporting_indicators.map((indicator, index) => (
                      <Badge key={index} variant="outline" className="mr-2">
                        {indicator}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sanctions Exposure */}
            {isAnalystMode && (
              <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="w-6 h-6 mr-3 text-red-600" />
                    Sanctions Proximity Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{wallet.sanctions_exposure.direct_hits}</p>
                      <p className="text-xs text-slate-600">Direct Hits</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">{wallet.sanctions_exposure.indirect_exposure.one_hop}</p>
                      <p className="text-xs text-slate-600">1-Hop</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{wallet.sanctions_exposure.indirect_exposure.two_hop}</p>
                      <p className="text-xs text-slate-600">2-Hop</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-2xl font-bold text-slate-600">{wallet.sanctions_exposure.indirect_exposure.three_hop}</p>
                      <p className="text-xs text-slate-600">3-Hop</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Proximity Score</span>
                      <span className="text-lg font-bold">{wallet.sanctions_exposure.proximity_score.toFixed(1)}/10</span>
                    </div>
                    <Progress value={wallet.sanctions_exposure.proximity_score * 10} className="mt-2" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Geographic Risk */}
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  Geographic Risk
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-600">Primary Region</p>
                  <p className="font-bold">{wallet.geographic_risk.primary_region || 'Unknown'}</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-600">Geo Risk Score</p>
                  <p className="text-xl font-bold">{wallet.geographic_risk.geo_risk_score.toFixed(1)}/10</p>
                </div>
                {wallet.geographic_risk.risk_jurisdictions.length > 0 && (
                  <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                    <p className="text-sm font-medium text-red-800 mb-2">Risk Jurisdictions</p>
                    {wallet.geographic_risk.risk_jurisdictions.map((jurisdiction, index) => (
                      <Badge key={index} variant="destructive" className="mr-1 mb-1">
                        {jurisdiction}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Counterparties */}
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  Top Counterparties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {wallet.top_counterparties.slice(0, 5).map((counterparty, index) => (
                    <div key={index} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-mono text-slate-600">
                          {counterparty.address.slice(0, 12)}...
                        </p>
                        <Badge className={`text-xs ${getRiskConfig(counterparty.risk_level).color}`}>
                          {counterparty.risk_level}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{counterparty.transaction_count} txs</span>
                        <span>{counterparty.total_volume.toFixed(2)} {wallet.network}</span>
                      </div>
                      {counterparty.entity_name && (
                        <p className="text-xs text-blue-600 mt-1">{counterparty.entity_name}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Asset Breakdown */}
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <PieChart className="w-5 h-5 mr-2 text-blue-600" />
                  Asset Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(wallet.asset_breakdown).map(([asset, data]) => (
                    <div key={asset} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{asset}</span>
                        <span>{data.percentage}%</span>
                      </div>
                      <Progress value={data.percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>{data.balance.toFixed(4)} {asset}</span>
                        <span>${data.usd_value.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Temporal Patterns */}
            {isAnalystMode && (
              <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-600" />
                    Activity Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600">First Seen</p>
                    <p className="font-bold text-sm">
                      {new Date(wallet.temporal_patterns.first_seen).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600">Last Active</p>
                    <p className="font-bold text-sm">
                      {new Date(wallet.temporal_patterns.last_active).toLocaleDateString()}
                    </p>
                  </div>
                  {wallet.temporal_patterns.activity_bursts.length > 0 && (
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-xs font-medium text-orange-800 mb-1">Activity Burst Detected</p>
                      <p className="text-xs text-orange-700">
                        {wallet.temporal_patterns.activity_bursts[0].transaction_count} transactions
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedWalletResults;
