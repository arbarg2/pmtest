
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppHeader from '@/components/layout/AppHeader';

import { WalletRiskResponse } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';

import RegulatorJustification from './RegulatorJustification';
import { regulatorReportExportService } from '@/services/regulatorReportExport';
import EmailReportDialog from './EmailReportDialog';
import { AnalystAssignment } from './AnalystAssignment';

// Import all dashboard components
import WalletOverview from '@/components/dashboard/WalletOverview';
import VolumeIntelligence from '@/components/dashboard/VolumeIntelligence';
import EntityAttribution from '@/components/dashboard/EntityAttribution';
import GeographicRisk from '@/components/dashboard/GeographicRisk';
import CounterpartyIntelligence from '@/components/dashboard/CounterpartyIntelligence';
import TransactionFlowPreview from '@/components/dashboard/TransactionFlowPreview';
import ExportActions from '@/components/dashboard/ExportActions';
import RiskFactorsBreakdown from '@/components/RiskFactorsBreakdown';
import SanctionsPanel from '@/components/wallet/SanctionsPanel';
import VerdictBanner from '@/components/wallet/VerdictBanner';
import ProvenanceCard from '@/components/record/ProvenanceCard';
import SarDraftPanel from '@/components/compliance/SarDraftPanel';

import AnalystNotesThread, { AnalystNotesThreadRef } from '@/components/AnalystNotesThread';
import CaseManagement from '@/components/CaseManagement';
import { HollyAIAnalysis } from '@/components/HollyAIAnalysis';
import AlertsBell from '@/components/alerts/AlertsBell';
import { LoadingCard, ErrorCard, type DataStatus } from '@/components/ui/data-state';
import AskHollyChat from '@/components/holly/AskHollyChat';

interface EnhancedWalletResultsProps {
  wallet: WalletRiskResponse;
  onBack: () => void;
  onViewFlow: () => void;
  onGenerateReport: () => void;
  recordId?: string;
  riskFactors?: any[];
  sanctionsMatches?: any[];
  evidenceStatus?: DataStatus;
  onRetryEvidence?: () => void;
}

const EnhancedWalletResults = ({ 
  wallet, 
  onBack, 
  onViewFlow, 
  onGenerateReport, 
  recordId,
  riskFactors = [],
  sanctionsMatches = [],
  evidenceStatus = 'ready',
  onRetryEvidence
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
  const [assignedAnalyst, setAssignedAnalyst] = useState<string | undefined>();
  const analystNotesRef = useRef<AnalystNotesThreadRef>(null);

  // Initialize case data from wallet/record data
  useEffect(() => {
    if (wallet && typeof wallet === 'object') {
      // Check if this record has case data
      setIsCase(wallet.is_case || false);
      setCaseId(wallet.case_id);
      setCaseStatus(wallet.case_status || 'open');
      setCaseCreatedAt(wallet.case_created_at);
      
      // Extract assigned analyst from analyst_notes or a dedicated field
      const notes = wallet.analyst_notes || '';
      const assignedMatch = notes.match(/Assigned to: (.+)/);
      if (assignedMatch) {
        setAssignedAnalyst(assignedMatch[1]);
      }
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

  // Sends the report via the delivery webhook. The report body is rebuilt
  // server-side from the record — we only send what the function needs.
  const handleEmailReport = async (emailAddresses: string[]) => {
    setIsEmailingReport(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-report-webhook', {
        body: {
          recordId: recordId || wallet.lookupId,
          reportType: 'wallet_intelligence',
          timestamp: new Date().toISOString(),
          emailAddresses,
        },
      });

      if (error) {
        const details =
          error instanceof FunctionsHttpError ? await error.context.text() : error.message;
        console.error('send-report-webhook failed:', details);
        let message = 'Failed to send report. Please try again.';
        try {
          const parsed = JSON.parse(details);
          if (parsed?.error) message = String(parsed.error);
        } catch {
          /* keep default message */
        }
        throw new Error(message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'The report was not delivered. Please try again.');
      }

      toast.success(`Report sent to ${data.recipients ?? emailAddresses.length} recipient(s).`);
      setIsEmailDialogOpen(false);
    } catch (error) {
      console.error('Failed to send report:', error);
      // Dialog stays open so the recipient list isn't lost.
      toast.error(error instanceof Error ? error.message : 'Failed to send report. Please try again.');
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

  const handleAssignmentChange = (assignee: string) => {
    setAssignedAnalyst(assignee);
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
        analystName: assignedAnalyst || 'Current Analyst',
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

  const isEvidenceLoading = evidenceStatus === 'loading' || evidenceStatus === 'idle';
  const hasEvidenceError = evidenceStatus === 'error';

  const tabPanel = 'mt-6 space-y-6 data-[state=inactive]:hidden animate-fade-in';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <AppHeader
        subtitle={isCase ? 'Case Investigation Report' : 'Wallet Intelligence Report'}
        leading={
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        }
        actions={
          <>
            <AnalystAssignment
              recordId={recordId || 'unknown'}
              currentAssignee={assignedAnalyst}
              onAssignmentChange={handleAssignmentChange}
            />
            <Button
              onClick={() => setIsEmailDialogOpen(true)}
              disabled={isEmailingReport}
              size="sm"
            >
              <Mail className="w-4 h-4 mr-2" />
              {isEmailingReport ? 'Sending...' : 'Email Report'}
            </Button>
          </>
        }
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Record meta */}
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>
            {isCase ? `Case ID: ${caseId}` : `Lookup ID: ${wallet.lookupId || recordId || 'N/A'}`}
          </span>
          {assignedAnalyst && (
            <>
              <span>•</span>
              <span className="text-primary font-medium">Assigned to: {assignedAnalyst}</span>
            </>
          )}
          {wallet.isTemporary && (
            <>
              <span>•</span>
              <span className="text-[hsl(var(--risk-medium))] font-medium">
                Temporary Record (Database Save Failed)
              </span>
            </>
          )}
        </div>

        {/* Verdict Banner — hero risk summary, always visible */}
        <div className="mb-8">
          <VerdictBanner wallet={wallet} />
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="risk">Risk &amp; Sanctions</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            <TabsTrigger value="case">Case</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" forceMount className={tabPanel}>
            <WalletOverview wallet={wallet} />

            <HollyAIAnalysis
              walletData={wallet}
              recordId={recordId}
              onNotesUpdated={handleNotesUpdated}
            />

            <div className="grid lg:grid-cols-2 gap-6">
              <EntityAttribution wallet={wallet} />
              <GeographicRisk wallet={wallet} />
            </div>

            <VolumeIntelligence wallet={wallet} />
          </TabsContent>

          {/* Risk & Sanctions */}
          <TabsContent value="risk" forceMount className={tabPanel}>
            {isEvidenceLoading ? (
              <div className="grid lg:grid-cols-2 gap-6">
                <LoadingCard title="Scoring risk factors" rows={4} />
                <LoadingCard title="Screening sanctions lists" rows={3} />
              </div>
            ) : hasEvidenceError ? (
              <ErrorCard
                title="Risk scoring unavailable"
                message="We couldn't reach the risk scoring and sanctions data for this wallet. The record itself is safe — try loading the analysis again."
                onRetry={onRetryEvidence}
              />
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                <RiskFactorsBreakdown factors={riskFactors} />
                <SanctionsPanel
                  walletAddress={wallet.address}
                  network={wallet.network}
                  matches={sanctionsMatches}
                />
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
              <TransactionFlowPreview wallet={wallet} onViewFlow={handleViewFlow} />
              <CounterpartyIntelligence wallet={wallet} />
            </div>
          </TabsContent>

          {/* Evidence */}
          <TabsContent value="evidence" forceMount className={tabPanel}>
            {isEvidenceLoading ? (
              <LoadingCard title="Assembling evidence bundle" rows={4} />
            ) : hasEvidenceError ? (
              <ErrorCard
                title="Evidence data unavailable"
                message="Some evidence for this record couldn't be loaded. Reports generated now may be incomplete — try again before exporting."
                onRetry={onRetryEvidence}
              />
            ) : null}

            <ProvenanceCard address={wallet.address} />

            <SarDraftPanel
              address={wallet.address}
              network={wallet.network}
              recordId={recordId}
            />

            <RegulatorJustification
              wallet={wallet}
              recordId={recordId}
              caseId={caseId}
              aiSummary={wallet.ai_summary}
              onDownloadReport={handleDownloadRegulatorReport}
            />

            <ExportActions
              wallet={wallet}
              recordId={recordId}
              riskFactors={riskFactors}
              sanctionsMatches={sanctionsMatches}
              analystNotes={analystNotes}
              investigationStatus={investigationStatus}
            />
          </TabsContent>

          {/* Case */}
          <TabsContent value="case" forceMount className={tabPanel}>
            <CaseManagement
              recordId={recordId || 'unknown'}
              isCase={isCase}
              caseId={caseId}
              caseStatus={caseStatus}
              caseCreatedAt={caseCreatedAt}
              onCaseCreated={handleCaseCreated}
              onStatusChanged={handleStatusChanged}
            />

            {isCase && (
              <AnalystNotesThread
                key={notesKey}
                ref={analystNotesRef}
                recordId={recordId}
                onNotesUpdate={handleNotesUpdate}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>


      {/* Email Report Dialog */}
      <EmailReportDialog
        isOpen={isEmailDialogOpen}
        onClose={() => setIsEmailDialogOpen(false)}
        onSendReport={handleEmailReport}
        isLoading={isEmailingReport}
      />

      {/* Ask Holly — floating conversational investigator */}
      <AskHollyChat recordId={recordId} />

    </div>
  );
};

export default EnhancedWalletResults;
