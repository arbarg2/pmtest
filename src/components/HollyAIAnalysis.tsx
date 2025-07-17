
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  TrendingUp, 
  Eye, 
  Target,
  Lightbulb,
  Activity,
  Sparkles,
  FileText,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  BookOpen
} from 'lucide-react';
import { useAISummary } from '@/hooks/useAISummary';
import { useToast } from '@/hooks/use-toast';
import { caseManagementService } from '@/services/caseManagement';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface HollyAIAnalysisProps {
  walletData?: any;
  recordId?: string;
}

export function HollyAIAnalysis({ walletData, recordId }: HollyAIAnalysisProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingToNotes, setIsAddingToNotes] = useState(false);
  const [hasAddedToNotes, setHasAddedToNotes] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    isGenerating, 
    summaryData, 
    generateAISummary, 
    loadExistingSummary 
  } = useAISummary();

  useEffect(() => {
    if (recordId) {
      loadExistingSummary(recordId);
    }
  }, [recordId, loadExistingSummary]);

  const handleGenerateAISummary = () => {
    if (recordId && walletData) {
      generateAISummary(recordId, walletData);
    }
  };

  const handleAddToCaseNotes = async () => {
    if (!user || !recordId || !summaryData.ai_summary) {
      toast({
        title: "Error",
        description: "Unable to add summary to case notes. Missing required data.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingToNotes(true);
    try {
      const { data: record } = await supabase
        .from('investigation_records')
        .select('is_case, case_id')
        .eq('id', recordId)
        .single();
      
      let caseId = record?.case_id;
      
      if (!record?.is_case || !caseId) {
        const createResult = await caseManagementService.createCase(recordId, user.id);
        if (!createResult.success) {
          throw new Error(createResult.error || 'Failed to create case');
        }
        caseId = createResult.caseId;
      }

      const noteContent = `**Holly AI Risk Summary**\n\n${summaryData.ai_summary}`;
      const addNoteResult = await caseManagementService.addCaseNote(caseId!, noteContent);
      
      if (addNoteResult.success) {
        setHasAddedToNotes(true);
        toast({
          title: "✅ Added to Case Notes",
          description: "Holly AI summary has been saved to case notes.",
        });
      } else {
        throw new Error(addNoteResult.error || 'Failed to add note');
      }
    } catch (error) {
      console.error('Error adding summary to case notes:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add summary to case notes.",
        variant: "destructive",
      });
    } finally {
      setIsAddingToNotes(false);
    }
  };

  const getStatusIcon = () => {
    switch (summaryData.ai_summary_status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'processing':
        return <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-500" />;
    }
  };

  const HollyLoadingAnimation = () => (
    <div className="flex items-center justify-center py-4" aria-busy="true">
      <div className="text-center">
        <div className="relative mx-auto mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center animate-pulse shadow-lg">
            <BookOpen className="w-4 h-4 text-white animate-bounce" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping"></div>
          <div className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-pink-400 rounded-full animate-ping delay-150"></div>
        </div>
        <p className="text-purple-700 dark:text-purple-300 font-medium mb-1 text-sm">
          Holly is summarizing your investigation...
        </p>
        <div className="flex items-center justify-center space-x-1 text-xs text-slate-500">
          <span>Analyzing blockchain data</span>
          <div className="flex space-x-1">
            <div className="w-0.5 h-0.5 bg-purple-500 rounded-full animate-bounce"></div>
            <div className="w-0.5 h-0.5 bg-purple-500 rounded-full animate-bounce delay-100"></div>
            <div className="w-0.5 h-0.5 bg-purple-500 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    </div>
  );

  const aiInsights = {
    behavioralAnomalies: [
      "Unusual transaction frequency spike detected in last 7 days (+340%)",
      "Atypical interaction with privacy-focused protocols",
      "Pattern deviation from historical transaction timing"
    ],
    riskBreakdown: {
      transactionPatterns: 7.2,
      counterpartyRisk: 5.8,
      geographicRisk: 3.1,
      temporalAnomalies: 8.5
    },
    actionableInsights: [
      "Enhanced monitoring recommended for next 14 days",
      "Consider additional KYC verification for high-value transactions",
      "Flag for manual review if transaction volume exceeds $50,000"
    ],
    confidenceLevel: 0.87
  };

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 border-purple-200 dark:border-purple-800">
      {/* ... unchanged CardHeader and Quick Summary code ... */}

      <CardContent className="space-y-3 px-4 py-2">
        {/* ... unchanged components above ... */}

        {/* Modified AI Summary Section markdown rendering */}
        <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Current Summary</span>
            {summaryData.ai_summary_generated_at && (
              <span className="text-xs text-slate-500">
                Generated: {new Date(summaryData.ai_summary_generated_at).toLocaleString()}
              </span>
            )}
          </div>
          <div className="text-sm text-slate-800 dark:text-slate-200 leading-snug whitespace-pre-wrap space-y-1">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {summaryData.ai_summary || ''}
            </ReactMarkdown>
          </div>
        </div>

        {/* Previous Summary markdown rendering (if available) */}
        {summaryData.ai_summary_previous && (
          <details className="bg-white/40 dark:bg-slate-800/40 rounded-lg p-2">
            <summary className="cursor-pointer text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">
              View Previous Summary
            </summary>
            <div className="text-sm text-slate-800 dark:text-slate-200 leading-snug whitespace-pre-wrap space-y-1">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {summaryData.ai_summary_previous || ''}
              </ReactMarkdown>
            </div>
          </details>
        )}

        {/* ... remaining unchanged content ... */}
      </CardContent>
    </Card>
  );
}
