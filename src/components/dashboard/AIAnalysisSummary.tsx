import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Sparkles, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { WalletRiskResponse } from '@/services/api';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AIAnalysisSummaryProps {
  wallet: WalletRiskResponse;
}

const AIAnalysisSummary = ({ wallet }: AIAnalysisSummaryProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const getBehaviorDescription = () => {
    const riskLevel = wallet.risk_level;
    const entityType = wallet.entity_attribution?.type || 'unknown';
    const transactionCount = wallet.transaction_count || 0;
    
    if (riskLevel === 'High') {
      return "Holly AI has identified several high-risk patterns including potential sanctions exposure, unusual transaction volumes, and connections to high-risk entities. This wallet requires immediate compliance review and enhanced monitoring.";
    } else if (riskLevel === 'Medium') {
      return `Holly AI analysis shows moderate risk indicators. This ${entityType} wallet demonstrates some unusual patterns with ${transactionCount} transactions that warrant additional scrutiny and enhanced due diligence procedures.`;
    } else {
      return `Holly AI assessment indicates normal behavioral patterns for this ${entityType} wallet. The transaction history shows standard activity with ${transactionCount} transactions and low risk indicators across all analysis parameters.`;
    }
  };

  const getKeyInsights = () => {
    const insights = [];
    
    if (wallet.risk_factors?.sanctioned) {
      insights.push("⚠️ Sanctions exposure detected");
    }
    if (wallet.risk_factors?.mixer_usage) {
      insights.push("🔄 Privacy mixer connections");
    }
    if (wallet.risk_factors?.high_frequency_trading) {
      insights.push("⚡ High-frequency trading patterns");
    }
    if (wallet.entity_attribution?.confidence && wallet.entity_attribution.confidence > 0.8) {
      insights.push(`🎯 High confidence entity attribution (${Math.round(wallet.entity_attribution.confidence * 100)}%)`);
    }
    if (wallet.volume_metrics?.lifetime_value?.usd_equivalent && wallet.volume_metrics.lifetime_value.usd_equivalent > 100000) {
      insights.push("💰 High-value transaction history");
    }
    
    if (insights.length === 0) {
      insights.push("✅ No significant risk indicators");
      insights.push("📊 Standard transaction patterns");
      insights.push("🛡️ Low compliance risk");
    }
    
    return insights;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-purple-900 dark:text-purple-100">Holly AI Analysis</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <Sparkles className="w-3 h-3 text-purple-500" />
                    <span className="text-xs text-purple-600 dark:text-purple-400">AI-Powered Insights</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="p-2">
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-purple-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-purple-600" />
                )}
              </Button>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* AI Summary */}
            <div className="p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-sm font-bold">H</span>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    Behavioral Analysis Summary
                  </h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {getBehaviorDescription()}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <h4 className="font-semibold text-purple-900 dark:text-purple-100">Key Insights</h4>
              </div>
              <div className="space-y-2">
                {getKeyInsights().map((insight, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                    <span className="text-slate-700 dark:text-slate-300">{insight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Processing Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white/40 dark:bg-slate-800/40 rounded-lg">
                <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  {wallet.processing_time_ms}ms
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400">Analysis Time</div>
              </div>
              <div className="text-center p-3 bg-white/40 dark:bg-slate-800/40 rounded-lg">
                <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  20+
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400">Risk Factors</div>
              </div>
            </div>

            {/* Confidence Badge */}
            <div className="text-center">
              <Badge 
                variant="outline" 
                className="bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-600"
              >
                ✨ AI Confidence: 
                {wallet.entity_attribution?.confidence 
                  ? ` ${Math.round(wallet.entity_attribution.confidence * 100)}%`
                  : ' High'
                }
              </Badge>
            </div>

            {/* Updated footer with audit trail information */}
            <div className="border-t pt-4 mt-6">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-4 text-purple-600 dark:text-purple-400">
                  <div className="flex items-center space-x-1">
                    <span>🔍</span>
                    <span>Generated for audit trail</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>📅</span>
                    <span>{new Date().toLocaleString()}</span>
                  </div>
                </div>
                {/* Show case ID if available from wallet data */}
                {wallet.case_id && (
                  <div className="text-purple-600 dark:text-purple-400 font-medium">
                    Case ID: {wallet.case_id}
                  </div>
                )}
              </div>
              <div className="text-xs text-purple-500 dark:text-purple-400 mt-2 opacity-75">
                This AI analysis forms part of the official compliance audit documentation
              </div>
            </div>

          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default AIAnalysisSummary;
