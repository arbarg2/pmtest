
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
  onNotesUpdated?: () => void; // Add callback to notify parent of notes update
}

export function HollyAIAnalysis({ walletData, recordId, onNotesUpdated }: HollyAIAnalysisProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
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
      // First, check if there's an existing case for this record
      const { data: existingRecord } = await supabase
        .from('investigation_records')
        .select('is_case, case_id')
        .eq('id', recordId)
        .maybeSingle();
      
      let caseId = existingRecord?.case_id;
      
      // If no case exists, create one first
      if (!existingRecord?.is_case) {
        const createResult = await caseManagementService.createCase(recordId, user.id);
        if (!createResult.success) {
          throw new Error(createResult.error || 'Failed to create case');
        }
        caseId = createResult.caseId;
      }

      // Add the AI summary as a case note using the case ID
      const noteContent = `**Holly AI Risk Summary**\n\n${summaryData.ai_summary}`;
      const addNoteResult = await caseManagementService.addCaseNote(caseId!, noteContent);
      
      if (addNoteResult.success) {
        setHasAddedToNotes(true);
        toast({
          title: "✅ Added to Case Notes",
          description: "Holly AI summary has been saved to case notes.",
        });
        
        // Notify parent component to refresh notes list
        if (onNotesUpdated) {
          onNotesUpdated();
        }
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
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  // Holly Loading Animation Component
  const HollyLoadingAnimation = () => (
    <div className="flex items-center justify-center py-8" aria-busy="true">
      <div className="text-center">
        {/* Holly Avatar with Animation */}
        <div className="relative mx-auto mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center animate-pulse shadow-lg">
            <BookOpen className="w-6 h-6 text-white animate-bounce" />
          </div>
          {/* Sparkle animations */}
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
          <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping delay-150"></div>
        </div>
        
        {/* Main Message */}
        <p className="text-purple-700 dark:text-purple-300 font-medium mb-1">
          Holly is summarizing your investigation...
        </p>
        
        {/* Subtitle with animated dots */}
        <div className="flex items-center justify-center space-x-1 text-sm text-slate-500">
          <span>Analyzing blockchain data</span>
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce delay-100"></div>
            <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce delay-200"></div>
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
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-purple-800 dark:text-purple-200">
            <Brain className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
            Holly AI Analysis
            <Badge variant="outline" className="ml-2 text-purple-600 border-purple-300 dark:text-purple-400 dark:border-purple-700">
              AI-Powered
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
          >
            {isCollapsed ? (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Expand
              </>
            ) : (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Collapse
              </>
            )}
          </Button>
        </div>
        <p className="text-purple-700 dark:text-purple-300 text-sm">
          Advanced behavioral analysis and risk contextualization powered by machine learning
        </p>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="px-4 pt-2 pb-4 space-y-3">
          {/* Quick Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center space-x-2 mb-1">
                <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="font-medium text-purple-800 dark:text-purple-200 text-sm">Behavioral Score</span>
              </div>
              <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
                {aiInsights.riskBreakdown.temporalAnomalies.toFixed(1)}/10
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400">Anomaly Detection</p>
            </div>
            
            <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center space-x-2 mb-1">
                <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="font-medium text-purple-800 dark:text-purple-200 text-sm">Confidence</span>
              </div>
              <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
                {(aiInsights.confidenceLevel * 100).toFixed(0)}%
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400">Analysis Certainty</p>
            </div>
            
            <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center space-x-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="font-medium text-purple-800 dark:text-purple-200 text-sm">Alerts</span>
              </div>
              <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
                {aiInsights.behavioralAnomalies.length}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400">Active Anomalies</p>
            </div>
          </div>

          {/* AI Summary Section */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="font-semibold text-indigo-800 dark:text-indigo-200">Holly AI Intelligence Summary</h4>
                {summaryData.ai_summary_status && getStatusIcon()}
              </div>
              <div className="flex items-center space-x-2">
                {summaryData.ai_summary_previous && (
                  <Badge variant="outline" className="text-xs">
                    Previous Available
                  </Badge>
                )}
                <Button
                  onClick={handleGenerateAISummary}
                  disabled={isGenerating || !recordId}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Regenerating...
                    </>
                  ) : summaryData.ai_summary ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate Summary
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Generate AI Summary
                    </>
                  )}
                </Button>
              </div>
            </div>

            {isGenerating ? (
              <HollyLoadingAnimation />
            ) : summaryData.ai_summary ? (
              <div className="space-y-3">
                <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Current Summary</span>
                    {summaryData.ai_summary_generated_at && (
                      <span className="text-xs text-slate-500">
                        Generated: {new Date(summaryData.ai_summary_generated_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="prose prose-sm max-w-none space-y-2 leading-snug text-slate-700">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => <h1 className="text-blue-700 font-semibold mt-3 mb-1 text-sm">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-blue-700 font-semibold mt-3 mb-1 text-sm">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-blue-700 font-semibold mt-3 mb-1 text-sm">{children}</h3>,
                        h4: ({ children }) => <h4 className="text-blue-700 font-semibold mt-3 mb-1 text-sm">{children}</h4>,
                        h5: ({ children }) => <h5 className="text-blue-700 font-semibold mt-3 mb-1 text-sm">{children}</h5>,
                        h6: ({ children }) => <h6 className="text-blue-700 font-semibold mt-3 mb-1 text-sm">{children}</h6>,
                        p: ({ children }) => <p className="mb-1 text-sm">{children}</p>,
                        li: ({ children }) => <li className="ml-4 list-disc text-sm">{children}</li>,
                        ul: ({ children }) => <ul className="space-y-0.5">{children}</ul>,
                        ol: ({ children }) => <ol className="space-y-0.5">{children}</ol>,
                        strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                      }}
                    >
                      {summaryData.ai_summary || ''}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Add to Case Notes Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleAddToCaseNotes}
                    disabled={isAddingToNotes || hasAddedToNotes || !summaryData.ai_summary}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isAddingToNotes ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding to Notes...
                      </>
                    ) : hasAddedToNotes ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Added to Notes
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Case Notes
                      </>
                    )}
                  </Button>
                </div>

                {summaryData.ai_summary_previous && (
                  <details className="bg-white/40 dark:bg-slate-800/40 rounded-lg p-3">
                    <summary className="cursor-pointer text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-2">
                      View Previous Summary
                    </summary>
                    <div className="prose prose-sm max-w-none space-y-2 leading-snug text-slate-700">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => <h1 className="text-blue-700 font-semibold mt-3 mb-1 text-sm">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-blue-700 font-semibold mt-3 mb-1 text-sm">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-blue-700 font-semibold mt-3 mb-1 text-sm">{children}</h3>,
                          h4: ({ children }) => <h4 className="text-blue-700 font-semibold mt-3 mb-1 text-sm">{children}</h4>,
                          h5: ({ children }) => <h5 className="text-blue-700 font-semibold mt-3 mb-1 text-sm">{children}</h5>,
                          h6: ({ children }) => <h6 className="text-blue-700 font-semibold mt-3 mb-1 text-sm">{children}</h6>,
                          p: ({ children }) => <p className="mb-1 text-sm">{children}</p>,
                          li: ({ children }) => <li className="ml-4 list-disc text-sm">{children}</li>,
                          ul: ({ children }) => <ul className="space-y-0.5">{children}</ul>,
                          ol: ({ children }) => <ol className="space-y-0.5">{children}</ol>,
                          strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                        }}
                      >
                        {summaryData.ai_summary_previous || ''}
                      </ReactMarkdown>
                    </div>
                  </details>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600 dark:text-slate-400 mb-1">No AI summary generated yet</p>
                <p className="text-sm text-slate-500">Click the button above to generate an intelligent summary of this investigation</p>
              </div>
            )}
          </div>

          {/* Expanded Analysis */}
          {isExpanded && (
            <div className="space-y-4 mt-4">
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Collapse Analysis
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Expand Analysis
                    </>
                  )}
                </Button>
              </div>

              {/* Behavioral Anomaly Detection */}
              <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <h4 className="flex items-center font-semibold text-purple-800 dark:text-purple-200 mb-3">
                  <Eye className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                  Behavioral Anomaly Detection
                </h4>
                <div className="space-y-2">
                  {aiInsights.behavioralAnomalies.map((anomaly, index) => (
                    <div key={index} className="flex items-start space-x-2 p-2 bg-purple-50 dark:bg-purple-950 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-purple-800 dark:text-purple-200">{anomaly}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contextual Risk Score Breakdown */}
              <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <h4 className="flex items-center font-semibold text-purple-800 dark:text-purple-200 mb-3">
                  <TrendingUp className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                  Contextual Risk Score Breakdown
                </h4>
                <div className="space-y-3">
                  {Object.entries(aiInsights.riskBreakdown).map(([category, score]) => (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-purple-800 dark:text-purple-200 capitalize">
                          {category.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-sm font-bold text-purple-900 dark:text-purple-100">
                          {score.toFixed(1)}/10
                        </span>
                      </div>
                      <div className="w-full bg-purple-100 dark:bg-purple-900 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(score / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Insights */}
              <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <h4 className="flex items-center font-semibold text-purple-800 dark:text-purple-200 mb-3">
                  <Lightbulb className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                  Actionable Insights
                </h4>
                <div className="space-y-2">
                  {aiInsights.actionableInsights.map((insight, index) => (
                    <div key={index} className="flex items-start space-x-2 p-2 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
                      <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-indigo-800 dark:text-indigo-200">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!isExpanded && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                <ChevronDown className="w-4 h-4 mr-1" />
                Expand Analysis
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
