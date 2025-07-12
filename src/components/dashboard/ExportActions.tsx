
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Table, AlertTriangle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { reportExportService } from '@/services/reportExport';
import { WalletRiskResponse } from '@/services/api';
import { RiskFactor, SanctionsMatch } from '@/services/riskFactors';
import WatchWalletButton from '@/components/WatchWalletButton';

interface ExportActionsProps {
  wallet: WalletRiskResponse;
  recordId?: string;
  riskFactors?: RiskFactor[];
  sanctionsMatches?: SanctionsMatch[];
  analystNotes?: string;
  investigationStatus?: string;
  tags?: string[];
}

const ExportActions = ({ 
  wallet, 
  recordId, 
  riskFactors = [], 
  sanctionsMatches = [],
  analystNotes = '',
  investigationStatus = 'pending',
  tags = []
}: ExportActionsProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportData = {
    wallet,
    recordId: recordId || 'unknown',
    riskFactors,
    sanctionsMatches,
    analystNotes,
    investigationStatus,
    tags,
    timestamp: new Date().toISOString()
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await reportExportService.exportToPDF(exportData);
      toast({
        title: "PDF Export Complete",
        description: "Investigation report has been downloaded successfully.",
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      await reportExportService.exportToCSV(exportData);
      toast({
        title: "CSV Export Complete",
        description: "Data has been exported to CSV successfully.",
      });
    } catch (error) {
      console.error('CSV export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export CSV data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleEscalate = () => {
    toast({
      title: "Case Escalated",
      description: "This investigation has been flagged for senior review.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'cleared': return 'bg-green-100 text-green-800 border-green-200';
      case 'blocked': return 'bg-red-100 text-red-800 border-red-200';
      case 'escalated': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Download className="w-5 h-5 mr-2 text-primary" />
            Export & Actions
          </div>
          <Badge className={getStatusColor(investigationStatus)}>
            {investigationStatus.charAt(0).toUpperCase() + investigationStatus.slice(1)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center justify-center space-x-2 h-12"
            variant="outline"
          >
            {isExporting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span>Export PDF Report</span>
          </Button>
          
          <Button 
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex items-center justify-center space-x-2 h-12"
            variant="outline"
          >
            {isExporting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            ) : (
              <Table className="w-4 h-4" />
            )}
            <span>Export CSV Data</span>
          </Button>
        </div>

        {/* Investigation Actions */}
        <div className="space-y-3">
          <h4 className="font-medium text-slate-900 dark:text-slate-100">Investigation Actions</h4>
          
          <div className="grid grid-cols-1 gap-3">
            <Button 
              onClick={handleEscalate}
              variant="outline"
              className="flex items-center justify-center space-x-2 h-10 border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Escalate Case</span>
            </Button>
            
            <WatchWalletButton
              walletAddress={wallet.address}
              network={wallet.network}
              currentRiskScore={wallet.risk_score}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Export Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-600 dark:text-slate-400">Risk Factors:</span>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {riskFactors.length}
              </div>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400">Sanctions Matches:</span>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {sanctionsMatches.length}
              </div>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400">Investigation ID:</span>
              <div className="font-mono text-xs text-slate-900 dark:text-slate-100">
                {recordId?.slice(0, 8) || 'N/A'}...
              </div>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400">Export Date:</span>
              <div className="text-slate-900 dark:text-slate-100">
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Export Notice */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            📄 Reports include full analysis data, risk assessments, and compliance documentation 
            suitable for regulatory submissions and audit trails.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportActions;
