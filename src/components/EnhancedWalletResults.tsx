import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WalletRiskResponse } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import RegulatorJustification from './RegulatorJustification';
import { regulatorReportExportService } from '@/services/regulatorReportExport';
import EmailReportDialog from './EmailReportDialog';

// Import all dashboard components
import WalletOverview from '@/components/dashboard/WalletOverview';
import VolumeIntelligence from '@/components/dashboard/VolumeIntelligence';
import EntityAttribution from '@/components/dashboard/EntityAttribution';
import GeographicRisk from '@/components/dashboard/GeographicRisk';
import CounterpartyIntelligence from '@/components/dashboard/CounterpartyIntelligence';
import TransactionFlowPreview from '@/components/dashboard/TransactionFlowPreview';
import ExportActions from '@/components/dashboard/ExportActions';
import RiskFactorsBreakdown from '@/components/RiskFactorsBreakdown';
import SanctionsScreening from '@/components/SanctionsScreening';
import AnalystNotesThread, { AnalystNotesThreadRef } from '@/components/AnalystNotesThread';
import CaseManagement from '@/components/CaseManagement';
import { HollyAIAnalysis } from '@/components/HollyAIAnalysis';

interface EnhancedWalletResultsProps {
  wallet: WalletRiskResponse;
  onBack: () => void;
  onViewFlow: () => void;
  onGenerateReport: () => void;
  recordId?: string;
  riskFactors?: any[];
  sanctionsMatches?: any[];
}

const EnhancedWalletResults = ({ 
  wallet, 
  onBack, 
  onViewFlow, 
  onGenerateReport, 
  recordId,
  riskFactors = [],
  sanctionsMatches = []
}: EnhancedWalletResultsProps) => {
  const navigate = useNavigate();
  const [investigationStatus, setInvestigationStatus] = useState('pending');
  const [analystNotes, setAnalystNotes] = useState('');
  const [isCase, setIsCase] = useState(false);
  const [caseId, setCaseId] = useState<string | undefined>();
  const [caseStatus, setCaseStatus] = useState('open');
  const [caseCreatedAt, setCaseCreatedAt] = useState<string | undefined>();
  const [notesKey, setNotesKey] = useState(0);
  const [isEmailingReport, setIsEmailingReport] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const analystNotesRef = useRef<AnalystNotesThreadRef>(null);

  // Initialize case data from wallet/record data
  useEffect(() => {
    if (wallet && typeof wallet === 'object') {
      // Check if this record has case data
      setIsCase(wallet.is_case || false);
      setCaseId(wallet.case_id);
      setCaseStatus(wallet.case_status || 'open');
      setCaseCreatedAt(wallet.case_created_at);
    }
  }, [wallet]);

  // Fixed handleViewFlow function to use the correct route pattern
  const handleViewFlow = () => {
    if (recordId) {
      // Navigate to the correct route pattern: /wallets/:recordId/flow
      navigate(`/wallets/${recordId}/flow`);
    } else {
      console.warn('No recordId available for flow navigation');
      // Fallback to the original onViewFlow if provided
      if (onViewFlow) {
        onViewFlow();
      }
    }
  };

  // Updated function to handle email addresses
  const handleEmailReport = async (emailAddresses: string[]) => {
    setIsEmailingReport(true);
    try {
      const reportData = {
        wallet,
        recordId: recordId || 'unknown',
        riskFactors,
        sanctionsMatches,
        analystNotes,
        investigationStatus,
        isCase,
        caseId,
        caseStatus,
        caseCreatedAt,
        timestamp: new Date().toISOString(),
        reportType: 'wallet_intelligence',
        source: 'rian_platform',
        emailAddresses: emailAddresses // Add email addresses to the payload
      };

      console.log('📧 Sending report via Edge Function with email addresses:', emailAddresses);
      
      const { data, error } = await supabase.functions.invoke('send-report-webhook', {
        body: reportData
      });

      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(error.message || 'Failed to send report');
      }

      if (data?.success) {
        console.log('✅ Report sent successfully');
        toast.success(`Report sent successfully to ${emailAddresses.length} recipient(s).`);
        setIsEmailDialogOpen(false);
      } else {
        throw new Error(data?.error || 'Failed to send report');
      }
    } catch (error) {
      console.error('❌ Failed to send report:', error);
      toast.error("Failed to send report. Please try again.");
    } finally {
      setIsEmailingReport(false);
    }
  };

  const handleNotesUpdate = (notes: any[], status: string) => {
    setInvestigationStatus(status);
    // Convert notes thread back to simple string for export compatibility
    const latestNote = notes.length > 0 ? notes[notes.length - 1].content : '';
    setAnalystNotes(latestNote);
  };

  const handleCaseCreated = (newCaseId: string) => {
    console.log('Case created with ID:', newCaseId);
    setIsCase(true);
    setCaseId(newCaseId);
    setCaseStatus('open');
    setCaseCreatedAt(new Date().toISOString());
    
    // Force a page refresh to ensure the updated data is displayed
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleStatusChanged = () => {
    console.log('Case status changed, refreshing data...');
    // Force a page refresh to get updated case data
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Add new handler for regulator report download
  const handleDownloadRegulatorReport = async () => {
    try {
      const reportData = {
        wallet,
        recordId: recordId || 'unknown',
        caseId: caseId,
        aiSummary: wallet.ai_summary || undefined,
        analystJustification: analystNotes,
        analystName: 'Current Analyst', // In production, get from auth context
        timestamp: new Date().toISOString(),
        riskFactors,
        sanctionsMatches
      };

      await regulatorReportExportService.exportRegulatorPDF(reportData);
      toast.success("Regulatory compliance report downloaded successfully");
    } catch (error) {
      console.error('Failed to generate regulatory report:', error);
      toast.error("Failed to generate regulatory report. Please try again.");
    }
  };

  // Update callback to refresh notes when Holly AI adds a note
  const handleNotesUpdated = () => {
    console.log('Holly AI note added, refreshing notes list...');
    // Add a 300ms delay to avoid race conditions with Supabase eventually consistent reads
    setTimeout(() => {
      console.log('Triggering refresh after delay...');
      if (analystNotesRef.current) {
        analystNotesRef.current.refreshNotes();
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {isCase ? 'Case Investigation Report' : 'Wallet Intelligence Report'}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                  <span>
                    {isCase ? `Case ID: ${caseId}` : `Lookup ID: ${wallet.lookupId || recordId || 'N/A'}`}
                  </span>
                  <span>•</span>
                  <span>Comprehensive blockchain forensics analysis</span>
                  {wallet.isTemporary && (
                    <>
                      <span>•</span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        Temporary Record (Database Save Failed)
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setIsEmailDialogOpen(true)}
              disabled={isEmailingReport}
              size="sm"
              className="bg-accent hover:bg-accent/90 text-white"
            >
              <Mail className="w-4 h-4 mr-2" />
              {isEmailingReport ? 'Sending...' : 'Email Report'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Top Row - Wallet Overview */}
        <div className="mb-8">
          <WalletOverview wallet={wallet} />
        </div>

        {/* AI Analysis Section - Only Holly AI Analysis */}
        <div className="mb-8">
          <HollyAIAnalysis 
            walletData={wallet} 
            recordId={recordId} 
            onNotesUpdated={handleNotesUpdated}
          />
        </div>

        {/* Second Row - Entity Attribution and Geographic Risk */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <EntityAttribution wallet={wallet} />
          <GeographicRisk wallet={wallet} />
        </div>

        {/* Third Row - Volume Intelligence */}
        <div className="mb-8">
          <VolumeIntelligence wallet={wallet} />
        </div>

        {/* Fourth Row - Risk Factors and Sanctions */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <RiskFactorsBreakdown factors={riskFactors} />
          <SanctionsScreening matches={sanctionsMatches} />
        </div>

        {/* Fifth Row - Transaction Flow and Counterparties */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <TransactionFlowPreview wallet={wallet} onViewFlow={handleViewFlow} />
          <CounterpartyIntelligence wallet={wallet} />
        </div>

        {/* Regulator Justification Section - NEW */}
        <div className="mb-8">
          <RegulatorJustification
            wallet={wallet}
            recordId={recordId}
            caseId={caseId}
            aiSummary={wallet.ai_summary}
            onDownloadReport={handleDownloadRegulatorReport}
          />
        </div>

        {/* Case Management Section */}
        <div className="mb-8">
          <CaseManagement
            recordId={recordId || 'unknown'}
            isCase={isCase}
            caseId={caseId}
            caseStatus={caseStatus}
            caseCreatedAt={caseCreatedAt}
            onCaseCreated={handleCaseCreated}
            onStatusChanged={handleStatusChanged}
          />
        </div>

        {/* Bottom Row - Analyst Notes and Export Actions (only show if it's a case) */}
        {isCase && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Analyst Notes Thread - use key to force refresh */}
            <AnalystNotesThread
              key={notesKey}
              ref={analystNotesRef}
              recordId={recordId}
              onNotesUpdate={handleNotesUpdate}
            />

            {/* Export Actions */}
            <ExportActions
              wallet={wallet}
              recordId={recordId}
              riskFactors={riskFactors}
              sanctionsMatches={sanctionsMatches}
              analystNotes={analystNotes}
              investigationStatus={investigationStatus}
            />
          </div>
        )}
      </div>

      {/* Email Report Dialog */}
      <EmailReportDialog
        isOpen={isEmailDialogOpen}
        onClose={() => setIsEmailDialogOpen(false)}
        onSendReport={handleEmailReport}
        isLoading={isEmailingReport}
      />
    </div>
  );
};

export default EnhancedWalletResults;
