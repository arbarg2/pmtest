
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
                <span className="ml-3">Wallet Analysis</span>
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
            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <p className="font-mono text-sm break-all">{wallet.address}</p>
            </div>
            
            {/* Wallet Intelligence Grid */}
            <div className="grid md:grid-cols-4 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Entity Attribution</h3>
                <p className="text-sm text-blue-700">
                  <strong>Name:</strong> {wallet.entity_attribution?.name || 'Unknown'}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Type:</strong> {wallet.entity_attribution?.type || 'Unknown'}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Confidence:</strong> {((wallet.entity_attribution?.confidence || 0) * 100).toFixed(0)}%
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Volume Metrics</h3>
                <p className="text-sm text-green-700">
                  <strong>Lifetime Inbound:</strong> {wallet.volume_metrics?.lifetime_value?.inbound?.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-green-700">
                  <strong>USD Equivalent:</strong> ${wallet.volume_metrics?.lifetime_value?.usd_equivalent?.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-green-700">
                  <strong>Avg Transaction:</strong> {wallet.volume_metrics?.average_transaction_size?.toFixed(2) || '0.00'}
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2">Geographic Risk</h3>
                <p className="text-sm text-purple-700">
                  <strong>Primary Region:</strong> {wallet.geographic_risk?.primary_region || 'Unknown'}
                </p>
                <p className="text-sm text-purple-700">
                  <strong>Risk Jurisdictions:</strong> {wallet.geographic_risk?.risk_jurisdictions?.length || 0}
                </p>
                <p className="text-sm text-purple-700">
                  <strong>Geo Risk Score:</strong> {wallet.geographic_risk?.geo_risk_score?.toFixed(2) || '0.00'}
                </p>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-900 mb-2">Temporal Patterns</h3>
                <p className="text-sm text-orange-700">
                  <strong>First Seen:</strong> {wallet.temporal_patterns?.first_seen ? new Date(wallet.temporal_patterns.first_seen).toLocaleDateString() : 'Unknown'}
                </p>
                <p className="text-sm text-orange-700">
                  <strong>Last Active:</strong> {wallet.temporal_patterns?.last_active ? new Date(wallet.temporal_patterns.last_active).toLocaleDateString() : 'Unknown'}
                </p>
                <p className="text-sm text-orange-700">
                  <strong>Transaction Count:</strong> {wallet.transaction_count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overview Section */}
        <div className="mb-8">
          <AIExplainer walletData={wallet} />
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
