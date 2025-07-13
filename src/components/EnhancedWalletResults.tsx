
import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WalletRiskResponse } from '@/services/api';

// Import all dashboard components
import WalletOverview from '@/components/dashboard/WalletOverview';
import VolumeIntelligence from '@/components/dashboard/VolumeIntelligence';
import EntityAttribution from '@/components/dashboard/EntityAttribution';
import GeographicRisk from '@/components/dashboard/GeographicRisk';
import CounterpartyIntelligence from '@/components/dashboard/CounterpartyIntelligence';
import TransactionFlowPreview from '@/components/dashboard/TransactionFlowPreview';
import AIAnalysisSummary from '@/components/dashboard/AIAnalysisSummary';
import ExportActions from '@/components/dashboard/ExportActions';
import RiskFactorsBreakdown from '@/components/RiskFactorsBreakdown';
import SanctionsScreening from '@/components/SanctionsScreening';
import AnalystNotesThread from '@/components/AnalystNotesThread';

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
  const [investigationStatus, setInvestigationStatus] = useState('pending');
  const [analystNotes, setAnalystNotes] = useState('');

  const handleNotesUpdate = (notes: any[], status: string) => {
    setInvestigationStatus(status);
    // Convert notes thread back to simple string for export compatibility
    const latestNote = notes.length > 0 ? notes[notes.length - 1].content : '';
    setAnalystNotes(latestNote);
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
                  Wallet Intelligence Report
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Comprehensive blockchain forensics analysis
                </p>
              </div>
            </div>
            <Button onClick={onGenerateReport} className="bg-accent hover:bg-accent/90 text-white">
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
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

        {/* AI Analysis Section - Collapsible (moved under Wallet Overview) */}
        <div className="mb-8">
          <AIAnalysisSummary wallet={wallet} />
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
          <TransactionFlowPreview wallet={wallet} onViewFlow={onViewFlow} />
          <CounterpartyIntelligence wallet={wallet} />
        </div>

        {/* Bottom Row - Analyst Notes Thread and Export Actions */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Analyst Notes Thread */}
          <AnalystNotesThread
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
      </div>
    </div>
  );
};

export default EnhancedWalletResults;
