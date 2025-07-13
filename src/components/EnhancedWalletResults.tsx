
import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { WalletRiskResponse } from '@/services/api';
import { supabaseLookupRecords } from '@/services/supabaseLookupRecords';
import { useAuth } from '@/contexts/AuthContext';

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
  const [analystNotes, setAnalystNotes] = useState('');
  const [investigationStatus, setInvestigationStatus] = useState<'pending' | 'cleared' | 'blocked' | 'escalated'>('pending');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load existing analyst data
  useEffect(() => {
    if (recordId && user) {
      loadAnalystData();
    }
  }, [recordId, user]);

  const loadAnalystData = async () => {
    try {
      const result = await supabaseLookupRecords.getLookupRecordById(recordId!, user?.id || '');
      if (result.success && result.record) {
        setAnalystNotes(result.record.analyst_notes || '');
        setInvestigationStatus(result.record.investigation_status as any || 'pending');
      }
    } catch (error) {
      console.error('Error loading analyst data:', error);
    }
  };

  const handleSaveNotes = async () => {
    if (!recordId || !user) return;

    setIsSaving(true);
    try {
      const result = await supabaseLookupRecords.updateLookupRecord(
        recordId,
        user.id,
        {
          analyst_fields: {
            case_notes: analystNotes,
            analyst_decision: investigationStatus,
            tags: [],
            attachments: []
          }
        }
      );

      if (result.success) {
        toast({
          title: "Notes Saved",
          description: "Analyst notes and status have been updated successfully.",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save analyst notes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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

        {/* AI Analysis Section - Collapsible */}
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

        {/* Bottom Row - Analyst Notes and Export Actions */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Analyst Notes Panel */}
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-lg shadow-lg border-0 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Analyst Notes & Status
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="status" className="text-sm font-medium">Investigation Status</Label>
                <Select value={investigationStatus} onValueChange={(value: any) => setInvestigationStatus(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending Review</SelectItem>
                    <SelectItem value="cleared">Cleared</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes" className="text-sm font-medium">Case Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Enter your investigation notes, findings, and recommendations..."
                  value={analystNotes}
                  onChange={(e) => setAnalystNotes(e.target.value)}
                  className="mt-1 min-h-[120px]"
                />
              </div>

              <Button 
                onClick={handleSaveNotes}
                disabled={isSaving}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isSaving ? 'Saving...' : 'Save Notes & Status'}
              </Button>
            </div>
          </div>

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
