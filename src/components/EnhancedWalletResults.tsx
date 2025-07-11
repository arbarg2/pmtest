
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, Download, Network, Shield, AlertTriangle, CheckCircle, XCircle,
  TrendingUp, Activity, Hash, Calendar, Eye, FileText, Save, Plus, X,
  DollarSign, Globe, Clock, Users, Zap, Building2, BarChart3, Coins, 
  History, Target, ArrowUpDown, ArrowRightLeft, Wallet, TrendingDown
} from 'lucide-react';
import { WalletRiskResponse } from '@/services/api';
import { TransactionGraph } from './TransactionGraph';
import { useToast } from '@/hooks/use-toast';
import { lookupRecordService } from '@/services/lookupRecords';

interface EnhancedWalletResultsProps {
  wallet: WalletRiskResponse;
  onBack: () => void;
  onViewFlow: () => void;
  onGenerateReport: () => void;
}

const EnhancedWalletResults = ({ wallet, onBack, onViewFlow, onGenerateReport }: EnhancedWalletResultsProps) => {
  const [notes, setNotes] = useState('');
  const [decision, setDecision] = useState('pending');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showGraph, setShowGraph] = useState(false);
  const { toast } = useToast();

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

  const handleSaveNotes = async () => {
    try {
      const currentLookupRecord = `temp_${Date.now()}`;
      await lookupRecordService.updateLookupRecord(currentLookupRecord, {
        case_notes: notes,
        analyst_decision: decision as any,
        tags
      });
      
      toast({
        title: "Investigation Notes Saved",
        description: "Analysis notes and decision recorded",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save investigation notes",
        variant: "destructive",
      });
    }
  };

  const addTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const quickTags = ['High Risk', 'Sanctioned Entity', 'Mixer Activity', 'Exchange Wallet', 'DeFi Protocol', 'Fraud Indicators', 'AML Flag'];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${riskConfig.bgClass} relative overflow-hidden`}>
      {/* Header */}
      <header className="border-b border-slate-200/50 bg-white/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Rìan Intelligence Report</h1>
                <p className="text-sm text-slate-500">
                  Analyzed in {wallet.processing_time_ms}ms • {wallet.network} Network
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={() => setShowGraph(!showGraph)} variant="outline">
                <Network className="w-4 h-4 mr-2" />
                {showGraph ? 'Hide Graph' : 'Transaction Graph'}
              </Button>
              <Button onClick={onViewFlow} variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Flow Analysis
              </Button>
              <Button onClick={onGenerateReport} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Address & Risk Score Header */}
        <Card className="mb-8 shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-8">
              <div className="flex-1 space-y-4 mb-6 lg:mb-0 lg:mr-8">
                <div className="flex items-center space-x-4">
                  {riskConfig.icon}
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Wallet Intelligence Analysis</h2>
                    <p className="text-slate-600">Comprehensive forensic investigation results</p>
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-slate-600">Target Address:</span>
                    <Badge variant="outline" className="text-xs">
                      {wallet.network} Network
                    </Badge>
                  </div>
                  <code className="bg-white px-4 py-2 rounded-lg text-sm font-mono text-slate-800 break-all block border">
                    {wallet.address}
                  </code>
                </div>

                {/* Basic Information Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium">First Seen</span>
                      </div>
                      <span className="text-sm text-slate-700">
                        {wallet.temporal_patterns?.first_seen ? new Date(wallet.temporal_patterns.first_seen).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium">Last Active</span>
                      </div>
                      <span className="text-sm text-slate-700">
                        {wallet.temporal_patterns?.last_active ? new Date(wallet.temporal_patterns.last_active).toLocaleDateString() : wallet.last_activity}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center space-x-2">
                        <Hash className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium">Total Transactions</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{wallet.transaction_count.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center space-x-2">
                        <Wallet className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium">Address Type</span>
                      </div>
                      <span className="text-sm text-slate-700">
                        {wallet.entity_attribution?.type || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Score Dashboard */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 lg:min-w-[300px]">
                <div className="text-center mb-4">
                  <Badge className={`${riskConfig.color} text-xl px-6 py-3 font-bold mb-4`}>
                    {wallet.risk_level.toUpperCase()} RISK
                  </Badge>
                  <div className="text-4xl font-bold text-slate-900">{wallet.risk_score.toFixed(1)}</div>
                  <div className="text-slate-600">Risk Score / 10</div>
                </div>
                
                <div className="space-y-3">
                  <Select value={decision} onValueChange={setDecision}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Investigation Decision" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending Review</SelectItem>
                      <SelectItem value="approved">Cleared</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                      <SelectItem value="escalated">Escalated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Enhanced Intelligence Grid */}
            <div className="grid lg:grid-cols-4 gap-6 mb-8">
              {/* Entity Attribution */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                    Entity Attribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Entity:</span>
                    <span className="font-medium">{wallet.entity_attribution?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Type:</span>
                    <span className="font-medium">{wallet.entity_attribution?.type || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Confidence:</span>
                    <span className="font-medium">{((wallet.entity_attribution?.confidence || 0) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Entity Risk:</span>
                    <Badge variant={wallet.entity_attribution?.risk_level === 'High' ? 'destructive' : 'outline'} className="text-xs">
                      {wallet.entity_attribution?.risk_level || 'Unknown'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Volume Metrics */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                    Volume Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Total Volume:</span>
                    <span className="font-medium">${(wallet.volume_metrics?.lifetime_value?.usd_equivalent || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Inbound:</span>
                    <span className="font-medium text-green-600">{(wallet.volume_metrics?.lifetime_value?.inbound || 0).toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Outbound:</span>
                    <span className="font-medium text-red-600">{(wallet.volume_metrics?.lifetime_value?.outbound || 0).toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Avg Transaction:</span>
                    <span className="font-medium">{(wallet.volume_metrics?.average_transaction_size || 0).toFixed(4)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Geographic & Behavioral Analysis */}
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Globe className="w-5 h-5 mr-2 text-purple-600" />
                    Geographic Risk
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Primary Region:</span>
                    <span className="font-medium">{wallet.geographic_risk?.primary_region || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Geo Risk Score:</span>
                    <span className="font-medium">{(wallet.geographic_risk?.geo_risk_score || 0).toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Risk Jurisdictions:</span>
                    <span className="font-medium">{wallet.geographic_risk?.risk_jurisdictions?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Behavior Type:</span>
                    <span className="font-medium text-xs">{wallet.behavioral_classification?.primary_type || 'Unknown'}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Sanctions & Compliance */}
              <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Target className="w-5 h-5 mr-2 text-red-600" />
                    Sanctions Exposure
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Direct Hits:</span>
                    <span className="font-bold text-red-600">{wallet.sanctions_exposure?.direct_hits || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">1-Hop Exposure:</span>
                    <span className="font-medium">{wallet.sanctions_exposure?.indirect_exposure?.one_hop || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">2-Hop Exposure:</span>
                    <span className="font-medium">{wallet.sanctions_exposure?.indirect_exposure?.two_hop || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Proximity Score:</span>
                    <span className="font-medium">{(wallet.sanctions_exposure?.proximity_score || 0).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transaction History & Patterns */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              {/* Largest Transactions */}
              <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ArrowUpDown className="w-5 h-5 mr-2 text-amber-600" />
                    Largest Transaction
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {wallet.volume_metrics?.largest_transaction && (
                    <div className="p-4 bg-white rounded-lg border">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium">Amount</span>
                        <Badge variant={wallet.volume_metrics.largest_transaction.direction === 'inbound' ? 'default' : 'secondary'}>
                          {wallet.volume_metrics.largest_transaction.direction}
                        </Badge>
                      </div>
                      <div className="text-lg font-bold text-slate-900 mb-1">
                        {wallet.volume_metrics.largest_transaction.amount.toFixed(6)}
                      </div>
                      <div className="text-sm text-slate-600">
                        {new Date(wallet.volume_metrics.largest_transaction.timestamp).toLocaleString()}
                      </div>
                      {wallet.volume_metrics.largest_transaction.counterparty && (
                        <div className="text-xs text-slate-500 mt-2 font-mono">
                          {wallet.volume_metrics.largest_transaction.counterparty}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Counterparty Analysis */}
              <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2 text-teal-600" />
                    Counterparty Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {wallet.top_counterparties && wallet.top_counterparties.length > 0 ? (
                    <div className="space-y-2">
                      {wallet.top_counterparties.slice(0, 3).map((connection, index) => (
                        <div key={index} className="p-3 bg-white rounded-lg border">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">{connection.entity_name || 'Unknown Entity'}</span>
                            <Badge variant={connection.risk_level === 'High' ? 'destructive' : 'outline'} className="text-xs">
                              {connection.risk_level}
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-600">
                            {connection.transaction_count} transactions • {connection.total_volume.toFixed(4)} total
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 py-4">
                      No counterparty data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Risk Factors Analysis */}
            <Card className="mb-6 bg-gradient-to-r from-slate-50 to-slate-100">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                  Risk Factor Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(wallet.risk_factors || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-white border">
                      <div className="flex items-center space-x-3">
                        {value ? (
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        )}
                        <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                      </div>
                      <Badge variant={value ? 'destructive' : 'outline'} className="text-xs">
                        {value ? 'DETECTED' : 'CLEAR'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Investigation Notes */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Investigation Notes
                  </div>
                  <Button onClick={handleSaveNotes} size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter investigation notes, findings, and decision rationale..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="bg-white"
                />
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Add investigation tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      className="flex-1 bg-white"
                    />
                    <Button onClick={addTag} size="sm" variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                          <span>{tag}</span>
                          <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-600">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    {quickTags.filter(tag => !tags.includes(tag)).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setTags([...tags, tag])}
                        className="text-xs px-2 py-1 border border-blue-300 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Transaction Graph */}
        {showGraph && (
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Transaction Graph Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionGraph address={wallet.address} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EnhancedWalletResults;
