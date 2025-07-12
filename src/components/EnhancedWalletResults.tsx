
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Eye, FileText, Download, Edit3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WalletRiskResponse } from '@/services/api';
import { AIExplainer } from '@/components/AIExplainer';
import RiskFactorsBreakdown from '@/components/RiskFactorsBreakdown';
import SanctionsScreening from '@/components/SanctionsScreening';
import { AnalystNotesPanel } from '@/components/AnalystNotesPanel';
import { riskFactorsService, RiskFactor, SanctionsMatch } from '@/services/riskFactors';
import { reportExportService } from '@/services/reportExport';
import { useToast } from '@/hooks/use-toast';

interface EnhancedWalletResultsProps {
  wallet: WalletRiskResponse;
  onBack: () => void;
  onViewFlow: () => void;
  onGenerateReport: () => void;
  recordId?: string;
}

const EnhancedWalletResults = ({ 
  wallet, 
  onBack, 
  onViewFlow, 
  onGenerateReport,
  recordId 
}: EnhancedWalletResultsProps) => {
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([]);
  const [sanctionsMatches, setSanctionsMatches] = useState<SanctionsMatch[]>([]);
  const [isLoadingFactors, setIsLoadingFactors] = useState(false);
  const [isLoadingSanctions, setIsLoadingSanctions] = useState(false);
  const { toast } = useToast();

  // Use recordId from props or wallet.recordId
  const currentRecordId = recordId || wallet.recordId;

  useEffect(() => {
    if (currentRecordId) {
      loadRiskFactors();
      loadSanctionsScreening();
    } else {
      console.log('No record ID available for loading additional data');
    }
  }, [currentRecordId]);

  const loadRiskFactors = async () => {
    if (!currentRecordId) return;
    
    setIsLoadingFactors(true);
    try {
      const factors = await riskFactorsService.getRiskFactors(currentRecordId);
      setRiskFactors(factors);
    } catch (error) {
      console.error('Error loading risk factors:', error);
    } finally {
      setIsLoadingFactors(false);
    }
  };

  const loadSanctionsScreening = async () => {
    if (!currentRecordId) return;
    
    setIsLoadingSanctions(true);
    try {
      const matches = await riskFactorsService.getSanctionsScreening(currentRecordId);
      setSanctionsMatches(matches);
    } catch (error) {
      console.error('Error loading sanctions screening:', error);
    } finally {
      setIsLoadingSanctions(false);
    }
  };

  const handleExportPDF = async () => {
    if (!currentRecordId) {
      toast({
        title: "Export Not Available",
        description: "No record ID available for export. Please save the analysis first.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Exporting PDF for record:', currentRecordId);
      await reportExportService.exportToPDF({
        wallet,
        recordId: currentRecordId,
        riskFactors,
        sanctionsMatches,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "PDF Export Complete",
        description: "Report has been downloaded successfully",
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = async () => {
    if (!currentRecordId) {
      toast({
        title: "Export Not Available", 
        description: "No record ID available for export. Please save the analysis first.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Exporting CSV for record:', currentRecordId);
      await reportExportService.exportToCSV({
        wallet,
        recordId: currentRecordId,
        riskFactors,
        sanctionsMatches,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "CSV Export Complete",
        description: "Report has been downloaded successfully",
      });
    } catch (error) {
      console.error('CSV export error:', error);
      toast({
        title: "Export Failed", 
        description: "Failed to generate CSV report",
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
          icon: <Shield className="w-8 h-8 text-green-600" />,
          description: 'This wallet shows minimal risk indicators and appears to engage in normal transaction patterns.',
          gradient: 'from-green-500 to-emerald-600'
        };
      case 'Medium':
        return {
          color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
          bgClass: 'from-yellow-50 to-orange-50',
          icon: <Shield className="w-8 h-8 text-yellow-600" />,
          description: 'This wallet has some exposure to moderate risk factors. Enhanced due diligence may be warranted.',
          gradient: 'from-yellow-500 to-orange-600'
        };
      case 'High':
        return {
          color: 'text-red-700 bg-red-50 border-red-200',
          bgClass: 'from-red-50 to-pink-50',
          icon: <Shield className="w-8 h-8 text-red-600" />,
          description: 'This wallet has significant risk indicators requiring immediate attention.',
          gradient: 'from-red-500 to-pink-600'
        };
      default:
        return {
          color: 'text-gray-700 bg-gray-50 border-gray-200',
          bgClass: 'from-gray-50 to-slate-50',
          icon: <Shield className="w-8 h-8 text-gray-600" />,
          description: 'Risk assessment could not be completed.',
          gradient: 'from-gray-500 to-slate-600'
        };
    }
  };

  const riskConfig = getRiskConfig(wallet.risk_level);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${riskConfig.bgClass}`}>
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
                  {wallet.processing_time_ms || 0}ms • {wallet.network} • {currentRecordId ? `ID: ${currentRecordId.slice(0, 8)}...` : 'No Record ID'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={onViewFlow}>
                <Eye className="w-4 h-4 mr-2" />
                Transaction Flow
              </Button>
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={handleExportPDF}>
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Wallet Header */}
        <Card className="mb-8 shadow-lg border-0 bg-white/95">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center">
                {riskConfig.icon}
                <span className="ml-3">Wallet Intelligence Analysis</span>
              </h2>
              <div className="flex items-center space-x-4">
                <Badge className={`${riskConfig.color} border-2 px-6 py-2 text-lg font-bold`}>
                  {wallet.risk_level.toUpperCase()} RISK
                </Badge>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Risk Score</p>
                  <p className="text-3xl font-bold text-slate-900">{wallet.risk_score.toFixed(1)}</p>
                </div>
              </div>
            </div>

            {/* Target Address */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Target Address:</span>
                <span className="text-sm text-slate-500">{wallet.network} Network</span>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="font-mono text-sm break-all">{wallet.address}</p>
              </div>
            </div>

            {/* Key Metrics Row */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <span className="text-xs text-slate-500">First Seen</span>
                </div>
                <p className="text-sm font-medium">
                  {wallet.temporal_patterns?.first_seen ? new Date(wallet.temporal_patterns.first_seen).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <span className="text-xs text-slate-500">Total Transactions</span>
                </div>
                <p className="text-sm font-medium">{wallet.transaction_count || 0}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <span className="text-xs text-slate-500">Last Active</span>
                </div>
                <p className="text-sm font-medium">
                  {wallet.temporal_patterns?.last_active ? new Date(wallet.temporal_patterns.last_active).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <span className="text-xs text-slate-500">Address Type</span>
                </div>
                <p className="text-sm font-medium">{wallet.entity_attribution?.type || 'Private Wallet'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Analysis Section */}
        <div className="mb-8">
          <AIExplainer walletData={wallet} />
        </div>

        {/* Intelligence Grid - 4 sections in 2x2 layout */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Entity Attribution */}
          <Card className="shadow-lg border-0 bg-white/95">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                Entity Attribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Entity:</span>
                <span className="text-sm font-medium">{wallet.entity_attribution?.name || 'Unknown Private Wallet'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Type:</span>
                <span className="text-sm font-medium">{wallet.entity_attribution?.type || 'Private Wallet'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Confidence:</span>
                <span className="text-sm font-medium">{((wallet.entity_attribution?.confidence || 0) * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Entity Risk:</span>
                <span className="text-sm font-medium">{wallet.entity_attribution?.risk_level || 'Low'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Volume Intelligence */}
          <Card className="shadow-lg border-0 bg-white/95">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <div className="w-4 h-4 bg-green-600 rounded"></div>
                </div>
                Volume Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Total Volume:</span>
                <span className="text-sm font-medium">${wallet.volume_metrics?.lifetime_value?.usd_equivalent?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Inbound:</span>
                <span className="text-sm font-medium">{wallet.volume_metrics?.lifetime_value?.inbound?.toFixed(4) || '0.0000'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Outbound:</span>
                <span className="text-sm font-medium">{wallet.volume_metrics?.lifetime_value?.outbound?.toFixed(4) || '0.0000'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Avg Transaction:</span>
                <span className="text-sm font-medium">{wallet.volume_metrics?.average_transaction_size?.toFixed(4) || '0.0000'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Geographic Risk */}
          <Card className="shadow-lg border-0 bg-white/95">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <div className="w-4 h-4 bg-purple-600 rounded-full"></div>
                </div>
                Geographic Risk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Primary Region:</span>
                <span className="text-sm font-medium">{wallet.geographic_risk?.primary_region || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Geo Risk Score:</span>
                <span className="text-sm font-medium">{wallet.geographic_risk?.geo_risk_score?.toFixed(1) || '0.0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Risk Jurisdictions:</span>
                <span className="text-sm font-medium">{wallet.geographic_risk?.risk_jurisdictions?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Behavior Type:</span>
                <span className="text-sm font-medium">{wallet.behavioral_classification?.primary_type || 'Unknown'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Sanctions Exposure */}
          <Card className="shadow-lg border-0 bg-white/95">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                  <div className="w-4 h-4 bg-red-600 rounded"></div>
                </div>
                Sanctions Exposure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Direct Hits:</span>
                <span className="text-sm font-medium">{wallet.sanctions_exposure?.direct_hits || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">1-Hop Exposure:</span>
                <span className="text-sm font-medium">{wallet.sanctions_exposure?.indirect_exposure?.one_hop || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">2-Hop Exposure:</span>
                <span className="text-sm font-medium">{wallet.sanctions_exposure?.indirect_exposure?.two_hop || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Proximity Score:</span>
                <span className="text-sm font-medium">{wallet.sanctions_exposure?.proximity_score?.toFixed(2) || '0.00'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Largest Transaction & Counterparty Intelligence */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Largest Transaction */}
          <Card className="shadow-lg border-0 bg-white/95">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                  <div className="w-4 h-4 bg-yellow-600"></div>
                </div>
                Largest Transaction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Amount:</span>
                <span className="text-sm font-medium">
                  {wallet.volume_metrics?.largest_transaction?.amount?.toFixed(4) || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Direction:</span>
                <span className="text-sm font-medium">
                  {wallet.volume_metrics?.largest_transaction?.direction || 'outbound'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Timestamp:</span>
                <span className="text-sm font-medium">
                  {wallet.volume_metrics?.largest_transaction?.timestamp ? 
                    new Date(wallet.volume_metrics.largest_transaction.timestamp).toLocaleDateString() : 
                    'Unknown'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Counterparty:</span>
                <span className="text-sm font-medium">
                  {wallet.volume_metrics?.largest_transaction?.counterparty || 'Unknown'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Counterparty Intelligence */}
          <Card className="shadow-lg border-0 bg-white/95">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                  <div className="w-4 h-4 bg-teal-600 rounded-full"></div>
                </div>
                Counterparty Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {wallet.top_counterparties && wallet.top_counterparties.length > 0 ? (
                wallet.top_counterparties.slice(0, 3).map((counterparty, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{counterparty.entity_name}</p>
                      <p className="text-xs text-slate-500">
                        {counterparty.transaction_count} transactions • {counterparty.total_volume.toFixed(2)} total
                      </p>
                    </div>
                    <Badge 
                      variant={counterparty.risk_level === 'High' ? 'destructive' : 
                               counterparty.risk_level === 'Medium' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {counterparty.risk_level}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-500">No counterparty data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Risk Factors Section */}
        <div className="mb-8">
          <RiskFactorsBreakdown 
            factors={riskFactors} 
            isLoading={isLoadingFactors}
          />
        </div>

        {/* Sanctions Section */}
        <div className="mb-8">
          <SanctionsScreening 
            matches={sanctionsMatches} 
            isLoading={isLoadingSanctions}
          />
        </div>

        {/* Analyst Notes Section */}
        <div className="mb-8">
          <Card className="shadow-lg border-0 bg-white/95">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Edit3 className="w-5 h-5 mr-2" />
                Analyst Case Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentRecordId ? (
                <AnalystNotesPanel recordId={currentRecordId} />
              ) : (
                <div className="p-8 text-center">
                  <Edit3 className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p className="text-slate-600">Record ID required for analyst notes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedWalletResults;
