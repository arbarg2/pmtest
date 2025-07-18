import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, RefreshCw, ChevronDown, ChevronUp, AlertTriangle, Shield } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface HollyAIAnalysisProps {
  walletData: any;
  recordId?: string;
  riskSummaryHeader?: string;
}

export function HollyAIAnalysis({ walletData, recordId, riskSummaryHeader }: HollyAIAnalysisProps) {
  const { user } = useAuth();
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'Not available';
    try {
      return new Date(timestamp).toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 7) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 4) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getNetworkColor = (network: string) => {
    const colors = {
      bitcoin: 'text-orange-600 bg-orange-50 border-orange-200',
      ethereum: 'text-blue-600 bg-blue-50 border-blue-200',
      default: 'text-gray-600 bg-gray-50 border-gray-200'
    };
    return colors[network?.toLowerCase()] || colors.default;
  };

  const fetchSummaryData = async () => {
    if (!recordId || !user) {
      console.log('Missing recordId or user for summary fetch');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('investigation_records')
        .select('ai_summary, ai_summary_status, ai_summary_generated_at, ai_summary_previous')
        .eq('record_id', recordId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching summary data:', error);
        return;
      }

      setSummaryData(data);
    } catch (error) {
      console.error('Error in fetchSummaryData:', error);
    }
  };

  const generateSummary = async () => {
    if (!recordId || !user) {
      console.error('Missing recordId or user for summary generation');
      return;
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('ai-summary', {
        body: { 
          recordId,
          walletData,
          forceRegenerate: false
        }
      });

      if (error) {
        console.error('Error generating summary:', error);
        return;
      }

      console.log('Summary generated successfully:', data);
      await fetchSummaryData();
    } catch (error) {
      console.error('Error in generateSummary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateSummary = async () => {
    if (!recordId || !user) {
      console.error('Missing recordId or user for summary regeneration');
      return;
    }

    try {
      setIsRegenerating(true);
      
      const { data, error } = await supabase.functions.invoke('ai-summary', {
        body: { 
          recordId,
          walletData,
          forceRegenerate: true
        }
      });

      if (error) {
        console.error('Error regenerating summary:', error);
        return;
      }

      console.log('Summary regenerated successfully:', data);
      await fetchSummaryData();
    } catch (error) {
      console.error('Error in regenerateSummary:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  useEffect(() => {
    fetchSummaryData();
  }, [recordId, user]);

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:to-indigo-900/20 backdrop-blur">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-xl">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            Holly AI Analysis
            <Badge variant="secondary" className="ml-3 bg-purple-100 text-purple-700 border-purple-200">
              Enhanced Intelligence
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {summaryData?.ai_summary && (
              <Button
                onClick={regenerateSummary}
                disabled={isRegenerating}
                variant="outline"
                size="sm"
                className="hover:bg-purple-50 border-purple-200"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                {isRegenerating ? 'Regenerating...' : 'Regenerate'}
              </Button>
            )}
            <Button
              onClick={() => setIsCollapsed(!isCollapsed)}
              variant="ghost"
              size="sm"
              className="hover:bg-purple-50"
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="px-4 pt-2 pb-4 space-y-3">
          {/* Risk Summary Header */}
          {riskSummaryHeader && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center text-red-700 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4 mr-2" />
                {riskSummaryHeader}
              </div>
            </div>
          )}

          {/* Quick Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Risk Assessment</div>
              <div className={`text-lg font-bold px-2 py-1 rounded text-center border ${getRiskScoreColor(walletData?.risk_score || 0)}`}>
                {walletData?.risk_score?.toFixed(1) || 'N/A'}/10
              </div>
            </div>
            
            <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Network</div>
              <div className={`text-sm font-semibold px-2 py-1 rounded text-center border ${getNetworkColor(walletData?.network || '')}`}>
                {walletData?.network?.toUpperCase() || 'Unknown'}
              </div>
            </div>
            
            <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Entity Type</div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 text-center">
                {walletData?.entity_attribution?.type || 'Unknown'}
              </div>
            </div>
          </div>

          {/* AI Summary Content */}
          {!summaryData ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Generate AI Intelligence Summary
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                Holly AI will analyze this wallet's patterns, risks, and provide actionable intelligence insights.
              </p>
              <Button
                onClick={generateSummary}
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3"
              >
                <Sparkles className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Analyzing...' : 'Generate AI Summary'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Status and Timestamp */}
              <div className="flex items-center justify-between bg-white/60 dark:bg-slate-800/60 rounded-lg p-3 border border-purple-100 dark:border-purple-800">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Analysis Status: {summaryData.ai_summary_status || 'completed'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Generated: {formatTimestamp(summaryData.ai_summary_generated_at)}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {summaryData.ai_summary_previous && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      Previous Version Available
                    </Badge>
                  )}
                </div>
              </div>

              {/* Main AI Summary */}
              {summaryData.ai_summary && (
                <div className="bg-white/90 dark:bg-slate-800/90 rounded-xl border border-purple-200 dark:border-purple-700 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white flex items-center">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Intelligence Summary
                      </h4>
                      <span className="text-purple-100 text-xs">
                        Holly AI Analysis
                      </span>
                    </div>
                  </div>
                  <div className="prose prose-sm max-w-none space-y-2 leading-snug text-slate-700 p-3">
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
              )}

              {/* Previous Summary (Collapsible) */}
              {summaryData.ai_summary_previous && (
                <details className="bg-white/60 dark:bg-slate-800/60 rounded-lg border border-purple-100 dark:border-purple-800">
                  <summary className="cursor-pointer text-sm font-medium text-indigo-700 dark:text-indigo-300 p-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg">
                    View Previous Summary
                  </summary>
                  <div className="px-3 pb-3">
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
                  </div>
                </details>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
