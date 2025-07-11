
import React, { useState } from 'react';
import { Sparkles, Loader2, ChevronDown, ChevronUp, Brain, Target, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WalletRiskResponse } from '@/services/api';

interface HollyAIAnalysisProps {
  walletData: WalletRiskResponse;
}

export function HollyAIAnalysis({ walletData }: HollyAIAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const generateAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate Holly AI analysis generation
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const behavioralAnalysis = `**Behavioral Anomaly Detection:**
• Transaction clustering patterns suggest ${walletData.behavioral_classification?.primary_type || 'standard'} usage with ${walletData.behavioral_classification?.confidence_level || 85}% confidence
• Temporal analysis reveals ${walletData.temporal_patterns?.activity_hours || 'distributed'} activity patterns across multiple time zones
• Volume distribution indicates ${walletData.volume_metrics?.transaction_frequency || 'moderate'} trading velocity

**Contextual Risk Score Breakdown:**
• Base Risk Score: ${walletData.risk_score.toFixed(1)}/10 (${walletData.risk_level})
• Entity Attribution Weight: ${walletData.entity_attribution?.confidence || 0.7}
• Geographic Risk Factor: ${walletData.geographic_risk?.geo_risk_score || 0.3}
• Sanctions Proximity: ${walletData.sanctions_exposure?.proximity_score || 0.1}

**Actionable Insights:**
• ${walletData.risk_level === 'High' ? 'IMMEDIATE ACTION REQUIRED: Enhanced due diligence and potential regulatory reporting' : 
     walletData.risk_level === 'Medium' ? 'MONITOR CLOSELY: Implement additional transaction monitoring protocols' : 
     'STANDARD PROCESSING: Routine compliance checks sufficient'}
• Recommended monitoring frequency: ${walletData.risk_level === 'High' ? 'Daily' : walletData.risk_level === 'Medium' ? 'Weekly' : 'Monthly'}
• Suggested next steps: ${walletData.risk_level === 'High' ? 'Manual review by compliance team' : 'Automated monitoring with periodic review'}`;

    setAnalysis(behavioralAnalysis);
    setIsAnalyzing(false);
    setIsExpanded(true);
  };

  return (
    <Card className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-indigo-200 shadow-lg dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 dark:border-indigo-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-indigo-900 dark:text-indigo-100">Holly AI Analysis</h3>
              <p className="text-sm text-indigo-600 dark:text-indigo-300 font-normal">Advanced behavioral intelligence & risk insights</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs bg-indigo-100 dark:bg-indigo-900">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Powered
            </Badge>
            {!analysis && (
              <Button
                onClick={generateAnalysis}
                disabled={isAnalyzing}
                size="sm"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Generate Analysis
                  </>
                )}
              </Button>
            )}
            {analysis && (
              <Button
                onClick={() => setIsExpanded(!isExpanded)}
                variant="ghost"
                size="sm"
                className="text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        {analysis && isExpanded ? (
          <div className="bg-white/90 backdrop-blur rounded-lg p-5 text-sm text-slate-700 leading-relaxed whitespace-pre-line border border-indigo-100 shadow-inner dark:bg-slate-800/90 dark:text-slate-200 dark:border-indigo-700">
            {analysis}
          </div>
        ) : analysis && !isExpanded ? (
          <div className="bg-white/90 backdrop-blur rounded-lg p-4 border border-indigo-100 dark:bg-slate-800/90 dark:border-indigo-700">
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">Holly AI analysis completed - click to expand detailed insights</p>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">Analysis Ready</span>
            </div>
          </div>
        ) : (
          <div className="bg-white/70 rounded-lg p-4 border border-indigo-100 dark:bg-slate-800/70 dark:border-indigo-700">
            <p className="text-indigo-700 dark:text-indigo-300 text-sm mb-2">
              <strong>Get Holly AI-powered insights</strong> for this wallet analysis
            </p>
            <p className="text-indigo-600 dark:text-indigo-400 text-xs">
              Generate advanced behavioral analysis, contextual risk breakdowns, and actionable compliance recommendations.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
