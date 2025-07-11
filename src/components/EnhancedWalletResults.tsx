
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
  DollarSign, Globe, Clock, Users, Zap
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
        title: "Notes Saved",
        description: "Analysis notes saved successfully",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save notes",
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

  const quickTags = ['High Risk', 'Sanctioned Entity', 'Mixer Activity', 'Exchange Wallet', 'Fraud Indicators'];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${riskConfig.bgClass} relative overflow-hidden`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
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
                  Analyzed in {wallet.processing_time_ms}ms • {wallet.network} Network
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={() => setShowGraph(!showGraph)} variant="outline">
                <Network className="w-4 h-4 mr-2" />
                {showGraph ? 'Hide Graph' : 'Show Graph'}
              </Button>
              <Button onClick={onViewFlow} variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                View Flow
              </Button>
              <Button onClick={onGenerateReport} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <Download className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Main Analysis Card */}
        <Card className="mb-8 shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-8">
            {/* Wallet Address & Risk Score Header */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-8">
              <div className="flex-1 space-y-4 mb-6 lg:mb-0 lg:mr-8">
                <div className="flex items-center space-x-4">
                  {riskConfig.icon}
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Risk Assessment Complete</h2>
                    <p className="text-slate-600">Comprehensive analysis results</p>
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-slate-600">Address:</span>
                  </div>
                  <code className="bg-white px-4 py-2 rounded-lg text-sm font-mono text-slate-800 break-all block border">
                    {wallet.address}
                  </code>
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
                
                {/* Quick Decision */}
                <div className="space-y-3">
                  <Select value={decision} onValueChange={setDecision}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Decision" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                      <SelectItem value="escalated">Escalated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Key Insights Grid */}
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              {/* Entity Information */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Users className="w-5 h-5 mr-2 text-blue-600" />
                    Entity Attribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Name:</span>
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
                </CardContent>
              </Card>

              {/* Volume Metrics */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                    Volume Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Total Volume:</span>
                    <span className="font-medium">${(wallet.volume_metrics?.lifetime_value?.usd_equivalent || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Net Value:</span>
                    <span className="font-medium">{(wallet.volume_metrics?.lifetime_value?.net || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Avg Transaction:</span>
                    <span className="font-medium">{(wallet.volume_metrics?.average_transaction_size || 0).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Geographic Risk */}
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
                    <span className="text-sm text-slate-600">Risk Score:</span>
                    <span className="font-medium">{(wallet.geographic_risk?.geo_risk_score || 0).toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Risk Jurisdictions:</span>
                    <span className="font-medium">{wallet.geographic_risk?.risk_jurisdictions?.length || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Risk Factors */}
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
                        {value ? 'FLAGGED' : 'CLEAR'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Analyst Notes - Integrated */}
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-amber-600" />
                    Analysis Notes
                  </div>
                  <Button onClick={handleSaveNotes} size="sm" className="bg-amber-600 hover:bg-amber-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter your analysis notes, observations, and decision rationale..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="bg-white"
                />
                
                {/* Quick Tags */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      className="flex-1 bg-white"
                    />
                    <Button onClick={addTag} size="sm" variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Current Tags */}
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
                  
                  {/* Quick Tag Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {quickTags.filter(tag => !tags.includes(tag)).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setTags([...tags, tag])}
                        className="text-xs px-2 py-1 border border-amber-300 rounded-md hover:bg-amber-100 transition-colors"
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
