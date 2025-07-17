
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
  Loader2
} from 'lucide-react';
import { useAISummary } from '@/hooks/useAISummary';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface HollyAIAnalysisProps {
  walletData?: any;
  recordId?: string;
}

export function HollyAIAnalysis({ walletData, recordId }: HollyAIAnalysisProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { 
    isGenerating, 
    summaryData, 
    generateAISummary, 
    loadExistingSummary 
  } = useAISummary();

  // Load existing summary when component mounts or recordId changes
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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-purple-800 dark:text-purple-200">
            <Brain className="w-6 h-6 mr-3 text-purple-600 dark:text-purple-400" />
            Holly AI Analysis
            <Badge variant="outline" className="ml-2 text-purple-600 border-purple-300 dark:text-purple-400 dark:border-purple-700">
              AI-Powered
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Expand Analysis
              </>
            )}
          </Button>
        </div>
        <p className="text-purple-700 dark:text-purple-300 text-sm">
          Advanced behavioral analysis and risk contextualization powered by machine learning
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="font-medium text-purple-800 dark:text-purple-200">Behavioral Score</span>
            </div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {aiInsights.riskBreakdown.temporalAnomalies.toFixed(1)}/10
            </div>
            <p className="text-sm text-purple-600 dark:text-purple-400">Anomaly Detection</p>
          </div>
          
          <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="font-medium text-purple-800 dark:text-purple-200">Confidence</span>
            </div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {(aiInsights.confidenceLevel * 100).toFixed(0)}%
            </div>
            <p className="text-sm text-purple-600 dark:text-purple-400">Analysis Certainty</p>
          </div>
          
          <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="font-medium text-purple-800 dark:text-purple-200">Alerts</span>
            </div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {aiInsights.behavioralAnomalies.length}
            </div>
            <p className="text-sm text-purple-600 dark:text-purple-400">Active Anomalies</p>
          </div>
        </div>

        {/* AI Summary Section */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h4 className="font-semibold text-indigo-800 dark:text-indigo-200">AI Intelligence Summary</h4>
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
                    Generating...
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

          {summaryData.ai_summary ? (
            <div className="space-y-4">
              <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Current Summary</span>
                  {summaryData.ai_summary_generated_at && (
                    <span className="text-xs text-slate-500">
                      Generated: {new Date(summaryData.ai_summary_generated_at).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="prose prose-sm prose-slate max-w-none prose-headings:text-slate-800 prose-strong:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {summaryData.ai_summary || ''}
                  </ReactMarkdown>
                </div>
              </div>

              {summaryData.ai_summary_previous && (
                <details className="bg-white/40 dark:bg-slate-800/40 rounded-lg p-4">
                  <summary className="cursor-pointer text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-2">
                    View Previous Summary
                  </summary>
                  <div className="prose prose-sm prose-slate max-w-none prose-headings:text-slate-800 prose-strong:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {summaryData.ai_summary_previous || ''}
                    </ReactMarkdown>
                  </div>
                </details>
              )}
            </div>
          ) : isGenerating ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                <p className="text-indigo-700 dark:text-indigo-300">Generating AI summary...</p>
                <p className="text-sm text-slate-500">This may take a few moments</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400 mb-2">No AI summary generated yet</p>
              <p className="text-sm text-slate-500">Click the button above to generate an intelligent summary of this investigation</p>
            </div>
          )}
        </div>

        {/* Expanded Analysis */}
        {isExpanded && (
          <div className="space-y-6 mt-6">
            {/* Behavioral Anomaly Detection */}
            <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
              <h4 className="flex items-center font-semibold text-purple-800 dark:text-purple-200 mb-4">
                <Eye className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                Behavioral Anomaly Detection
              </h4>
              <div className="space-y-3">
                {aiInsights.behavioralAnomalies.map((anomaly, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-purple-800 dark:text-purple-200">{anomaly}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contextual Risk Score Breakdown */}
            <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
              <h4 className="flex items-center font-semibold text-purple-800 dark:text-purple-200 mb-4">
                <TrendingUp className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                Contextual Risk Score Breakdown
              </h4>
              <div className="space-y-4">
                {Object.entries(aiInsights.riskBreakdown).map(([category, score]) => (
                  <div key={category} className="space-y-2">
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
            <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
              <h4 className="flex items-center font-semibold text-purple-800 dark:text-purple-200 mb-4">
                <Lightbulb className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                Actionable Insights
              </h4>
              <div className="space-y-3">
                {aiInsights.actionableInsights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
                    <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-indigo-800 dark:text-indigo-200">{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
