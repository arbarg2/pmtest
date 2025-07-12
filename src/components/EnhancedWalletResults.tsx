import React, { useState, useEffect } from 'react';
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
import { HollyAIAnalysis } from './HollyAIAnalysis';
import RiskFactorsBreakdown from './RiskFactorsBreakdown';
import SanctionsScreening from './SanctionsScreening';
import WatchWalletButton from './WatchWalletButton';
import { useToast } from '@/hooks/use-toast';
import { riskFactorsService, RiskFactor, SanctionsMatch } from '@/services/riskFactors';
import { reportExportService } from '@/services/reportExport';
import { supabaseLookupRecords } from '@/services/supabaseLookupRecords';

interface EnhancedWalletResultsProps {
  wallet: WalletRiskResponse;
  onBack: () => void;
  onViewFlow: () => void;
  onGenerateReport: () => void;
  recordId?: string;
}

const EnhancedWalletResults = ({ wallet, onBack, onViewFlow, onGenerateReport, recordId }: EnhancedWalletResultsProps) => {
  const [notes, setNotes] = useState('');
  const [decision, setDecision] = useState('pending');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showGraph, setShowGraph] = useState(false);
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([]);
  const [sanctionsMatches, setSanctionsMatches] = useState<SanctionsMatch[]>([]);
  const [isLoadingFactors, setIsLoadingFactors] = useState(true);
  const [isLoadingSanctions, setIsLoadingSanctions] = useState(true);
  const { toast } = useToast();

  // Load risk factors and sanctions data
  useEffect(() => {
    const loadAnalysisData = async () => {
      if (!recordId) {
        setIsLoadingFactors(false);
        setIsLoadingSanctions(false);
        return;
      }

      try {
        console.log('Loading analysis data for record:', recordId);
        
        // Load existing risk factors
        const factors = await riskFactorsService.getRiskFactors(recordId);
        console.log('Loaded risk factors:', factors);
        setRiskFactors(factors);
        
        // If no factors exist, calculate them
        if (factors.length === 0) {
          console.log('No existing factors, calculating new ones...');
          const newFactors = await riskFactorsService.calculateAndStoreRiskFactors(recordId, wallet);
          console.log('Calculated new factors:', newFactors);
          setRiskFactors(newFactors);
        }
        
        // Load sanctions screening
        const sanctions = await riskFactorsService.getSanctionsScreening(recordId);
        console.log('Loaded sanctions screening:', sanctions);
        setSanctionsMatches(sanctions);
        
        // If no sanctions screening exists, perform it
        if (sanctions.length === 0) {
          console.log('No existing sanctions screening, performing new screening...');
          const matches = await riskFactorsService.screenSanctions(wallet.address, wallet.network);
          if (matches.length > 0) {
            const storedMatches = await riskFactorsService.storeSanctionsScreening(recordId, matches);
            console.log('Stored sanctions matches:', storedMatches);
            setSanctionsMatches(storedMatches);
          }
        }
      } catch (error) {
        console.error('Error loading analysis data:', error);
      } finally {
        setIsLoadingFactors(false);
        setIsLoadingSanctions(false);
      }
    };

    loadAnalysisData();
  }, [recordId, wallet]);

  const getRiskConfig = (risk: string) => {
    switch (risk) {
      case 'Low':
        return {
          color: 'text-green-700 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-950 dark:border-green-800',
          bgClass: 'from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950',
          icon: <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />,
          gradient: 'from-green-500 to-emerald-600'
        };
      case 'Medium':
        return {
          color: 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-300 dark:bg-yellow-950 dark:border-yellow-800',
          bgClass: 'from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950',
          icon: <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />,
          gradient: 'from-yellow-500 to-orange-600'
        };
      case 'High':
        return {
          color: 'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950 dark:border-red-800',
          bgClass: 'from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950',
          icon: <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />,
          gradient: 'from-red-500 to-pink-600'
        };
      default:
        return {
          color: 'text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-300 dark:bg-gray-950 dark:border-gray-800',
          bgClass: 'from-gray-50 to-slate-50 dark:from-gray-950 dark:to-slate-950',
          icon: <Shield className="w-8 h-8 text-gray-600 dark:text-gray-400" />,
          gradient: 'from-gray-500 to-slate-600'
        };
    }
  };

  const handleSaveNotes = async () => {
    if (!recordId) return;
    
    try {
      const result = await supabaseLookupRecords.updateLookupRecord(recordId, 'user-id', {
        analyst_fields: {
          case_notes: notes,
          analyst_decision: decision as any,
          tags,
          attachments: []
        }
      });
      
      if (result.success) {
        toast({
          title: "Investigation Notes Saved",
          description: "Analysis notes and decision recorded",
        });
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save investigation notes",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = async () => {
    if (!recordId) {
      toast({
        title: "Export Not Available",
        description: "Record ID is required for export",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await reportExportService.exportToPDF({
        wallet,
        recordId,
        riskFactors,
        sanctionsMatches,
        analystNotes: notes,
        investigationStatus: decision,
        tags,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "PDF Report Generated",
        description: "Comprehensive compliance report exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = async () => {
    if (!recordId) {
      toast({
        title: "Export Not Available",
        description: "Record ID is required for export",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await reportExportService.exportToCSV({
        wallet,
        recordId,
        riskFactors,
        sanctionsMatches,
        analystNotes: notes,
        investigationStatus: decision,
        tags,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "CSV Report Generated",
        description: "Data exported to CSV format successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate CSV report",
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

  const riskConfig = getRiskConfig(wallet.risk_level);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${riskConfig.bgClass} relative overflow-hidden`}>
      {/* Header */}
      <header className="border-b border-slate-200/50 bg-white/90 backdrop-blur-xl sticky top-0 z-50 dark:border-slate-700/50 dark:bg-slate-900/90">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Rìan Intelligence Report</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Analyzed in {wallet.processing_time_ms || 0}ms • {wallet.network || 'Unknown'} Network
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
              <WatchWalletButton
                walletAddress={wallet.address}
                network={wallet.network}
                currentRiskScore={wallet.risk_score}
              />
              <Button onClick={handleExportPDF} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button onClick={handleExportCSV} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Address & Risk Score Header */}
        <Card className="mb-8 shadow-2xl border-0 bg-white/95 backdrop-blur-sm dark:bg-slate-900/95">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-8">
              <div className="flex-1 space-y-4 mb-6 lg:mb-0 lg:mr-8">
                <div className="flex items-center space-x-4">
                  {getRiskConfig(wallet.risk_level).icon}
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Wallet Intelligence Analysis</h2>
                    <p className="text-slate-600 dark:text-slate-300">Comprehensive forensic investigation results</p>
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Target Address:</span>
                    <Badge variant="outline" className="text-xs">
                      {wallet.network || 'Unknown'} Network
                    </Badge>
                  </div>
                  <code className="bg-white dark:bg-slate-900 px-4 py-2 rounded-lg text-sm font-mono text-slate-800 dark:text-slate-200 break-all block border">
                    {wallet.address}
                  </code>
                </div>

                {/* Basic Information Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">First Seen</span>
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        {wallet.temporal_patterns?.first_seen ? new Date(wallet.temporal_patterns.first_seen).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Last Active</span>
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        {wallet.temporal_patterns?.last_active ? new Date(wallet.temporal_patterns.last_active).toLocaleDateString() : wallet.last_activity || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border">
                      <div className="flex items-center space-x-2">
                        <Hash className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Transactions</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{(wallet.transaction_count || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border">
                      <div className="flex items-center space-x-2">
                        <Wallet className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Address Type</span>
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        {wallet.entity_attribution?.type || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Score Dashboard */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-6 lg:min-w-[300px]">
                <div className="text-center mb-4">
                  <Badge className={`${getRiskConfig(wallet.risk_level).color} text-xl px-6 py-3 font-bold mb-4`}>
                    {wallet.risk_level.toUpperCase()} RISK
                  </Badge>
                  <div className="text-4xl font-bold text-slate-900 dark:text-slate-100">{(wallet.risk_score || 0).toFixed(1)}</div>
                  <div className="text-slate-600 dark:text-slate-300">Risk Score / 10</div>
                </div>
                
                <div className="space-y-3">
                  <Select value={decision} onValueChange={setDecision}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Investigation Decision" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending Review</SelectItem>
                      <SelectItem value="cleared">Cleared</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                      <SelectItem value="escalated">Escalated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Holly AI Analysis Integration - Only show once */}
        <div className="mb-8">
          <HollyAIAnalysis walletData={wallet} />
        </div>

        {/* New Enhanced Features Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <RiskFactorsBreakdown factors={riskFactors} isLoading={isLoadingFactors} />
          <SanctionsScreening matches={sanctionsMatches} isLoading={isLoadingSanctions} />
        </div>

        {/* Enhanced Intelligence Grid */}
        <div className="grid lg:grid-cols-4 gap-6 mb-8">
          {/* Entity Attribution */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950 dark:to-indigo-950 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Building2 className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Entity Attribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Entity:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{wallet.entity_attribution?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Type:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{wallet.entity_attribution?.type || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Confidence:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{((wallet.entity_attribution?.confidence || 0) * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Entity Risk:</span>
                <Badge variant={wallet.entity_attribution?.risk_level === 'High' ? 'destructive' : 'outline'} className="text-xs">
                  {wallet.entity_attribution?.risk_level || 'Unknown'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Volume Metrics */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 dark:from-green-950 dark:to-emerald-950 dark:border-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <BarChart3 className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                Volume Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Total Volume:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">${(wallet.volume_metrics?.lifetime_value?.usd_equivalent || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Inbound:</span>
                <span className="font-medium text-green-600 dark:text-green-400">{(wallet.volume_metrics?.lifetime_value?.inbound || 0).toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Outbound:</span>
                <span className="font-medium text-red-600 dark:text-red-400">{(wallet.volume_metrics?.lifetime_value?.outbound || 0).toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Avg Transaction:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{(wallet.volume_metrics?.average_transaction_size || 0).toFixed(4)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Geographic & Behavioral Analysis */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 dark:from-purple-950 dark:to-pink-950 dark:border-purple-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Globe className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                Geographic Risk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Primary Region:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{wallet.geographic_risk?.primary_region || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Geo Risk Score:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{(wallet.geographic_risk?.geo_risk_score || 0).toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Risk Jurisdictions:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{wallet.geographic_risk?.risk_jurisdictions?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Behavior Type:</span>
                <span className="font-medium text-xs text-slate-900 dark:text-slate-100">{wallet.behavioral_classification?.primary_type || 'Unknown'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Sanctions & Compliance */}
          <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200 dark:from-red-950 dark:to-orange-950 dark:border-red-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Target className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" />
                Sanctions Exposure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Direct Hits:</span>
                <span className="font-bold text-red-600 dark:text-red-400">{wallet.sanctions_exposure?.direct_hits || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">1-Hop Exposure:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{wallet.sanctions_exposure?.indirect_exposure?.one_hop || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">2-Hop Exposure:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{wallet.sanctions_exposure?.indirect_exposure?.two_hop || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Proximity Score:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{(wallet.sanctions_exposure?.proximity_score || 0).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History & Patterns */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Largest Transactions */}
          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 dark:from-amber-950 dark:to-yellow-950 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ArrowUpDown className="w-5 h-5 mr-2 text-amber-600 dark:text-amber-400" />
                Largest Transaction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {wallet.volume_metrics?.largest_transaction && (
                <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Amount</span>
                    <Badge variant={wallet.volume_metrics.largest_transaction.direction === 'inbound' ? 'default' : 'secondary'}>
                      {wallet.volume_metrics.largest_transaction.direction}
                    </Badge>
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                    {wallet.volume_metrics.largest_transaction.amount.toFixed(6)}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    {new Date(wallet.volume_metrics.largest_transaction.timestamp).toLocaleString()}
                  </div>
                  {wallet.volume_metrics.largest_transaction.counterparty && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">
                      {wallet.volume_metrics.largest_transaction.counterparty}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Counterparty Analysis */}
          <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200 dark:from-teal-950 dark:to-cyan-950 dark:border-teal-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-teal-600 dark:text-teal-400" />
                Counterparty Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {wallet.top_counterparties && wallet.top_counterparties.length > 0 ? (
                <div className="space-y-2">
                  {wallet.top_counterparties.slice(0, 3).map((connection, index) => (
                    <div key={index} className="p-3 bg-white dark:bg-slate-900 rounded-lg border">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{connection.entity_name || 'Unknown Entity'}</span>
                        <Badge variant={connection.risk_level === 'High' ? 'destructive' : 'outline'} className="text-xs">
                          {connection.risk_level}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        {connection.transaction_count} transactions • {connection.total_volume.toFixed(4)} total
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-500 dark:text-slate-400 py-4">
                  No counterparty data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Risk Factors Analysis */}
        <Card className="mb-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-600 dark:text-orange-400" />
              Risk Factor Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(wallet.risk_factors || {}).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-900 border">
                  <div className="flex items-center space-x-3">
                    {value ? (
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    )}
                    <span className="text-sm capitalize text-slate-600 dark:text-slate-300">{key.replace(/_/g, ' ')}</span>
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
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950 dark:to-indigo-950 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
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
              className="bg-white dark:bg-slate-800"
            />
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Add investigation tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  className="flex-1 bg-white dark:bg-slate-800"
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
      </div>

      {/* Transaction Graph */}
      {showGraph && (
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm dark:bg-slate-900/95 mx-4 mb-4">
          <CardHeader>
            <CardTitle>Transaction Graph Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionGraph address={wallet.address} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedWalletResults;
