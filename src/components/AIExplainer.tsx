
/*
 * Updated to use react-markdown for better formatting of AI-generated explanations.
 * Replaced plain text rendering with markdown support for headings, bullets, bold text, etc.
 * Added Tailwind prose styling for improved readability while maintaining existing functionality.
 */

import React, { useState } from 'react';
import { Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WalletRiskResponse } from '@/services/api';
import ReactMarkdown from 'react-markdown';

interface AIExplainerProps {
  walletData: WalletRiskResponse;
}

export function AIExplainer({ walletData }: AIExplainerProps) {
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const generateExplanation = async () => {
    setIsExplaining(true);
    
    // Simulate AI explanation generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const explanations = {
      Low: `This wallet demonstrates standard, low-risk behavior patterns. Analysis reveals legitimate usage characteristics including regular interactions with established exchanges like ${walletData.entity_attribution?.name || 'Coinbase'}, consistent transaction timing patterns, and no flagged connections to high-risk entities. The address maintains a clean transaction history with ${walletData.transaction_count} total transactions, showing normal holding and trading behaviors typical of retail or institutional users.`,
      Medium: `This wallet exhibits moderate risk indicators that require enhanced monitoring. While not definitively suspicious, several factors contribute to elevated risk: potential indirect exposure to higher-risk addresses, unusual transaction clustering patterns, or connections to services with mixed reputations. The ${walletData.behavioral_classification?.primary_type || 'Unknown'} classification suggests active usage that may involve privacy-focused services or less regulated platforms. Additional due diligence is recommended for compliance purposes.`,
      High: `This wallet presents significant risk indicators requiring immediate attention. Multiple red flags have been identified including direct or indirect connections to sanctioned addresses, known fraud schemes, or suspicious transaction patterns consistent with money laundering activities. The behavioral profile shows characteristics typical of ${walletData.behavioral_classification?.primary_type || 'Unknown'} usage, with ${walletData.behavioral_classification?.confidence_level || 85}% confidence. Manual review and potential reporting obligations should be considered.`
    };

    const riskSpecificFactors = [];
    if (walletData.risk_factors.sanctioned) {
      riskSpecificFactors.push("• OFAC sanctions screening flagged direct or indirect connections");
    }
    if (walletData.risk_factors.fraud_reports) {
      riskSpecificFactors.push("• Address linked to reported fraud or scam activities");
    }
    if (walletData.risk_factors.dark_market_exposure) {
      riskSpecificFactors.push("• Blockchain analysis detected darknet marketplace exposure");
    }
    if (walletData.risk_factors.mixer_usage) {
      riskSpecificFactors.push("• Privacy coin or mixing service usage detected");
    }
    if (walletData.risk_factors.high_frequency_trading) {
      riskSpecificFactors.push("• Algorithmic or high-frequency trading patterns identified");
    }

    let fullExplanation = explanations[walletData.risk_level as keyof typeof explanations];
    
    if (riskSpecificFactors.length > 0) {
      fullExplanation += `\n\n**Specific Risk Indicators:**\n${riskSpecificFactors.join('\n')}`;
    }

    // Add entity attribution details
    if (walletData.entity_attribution?.name && walletData.entity_attribution.name !== 'Unknown') {
      fullExplanation += `\n\n**Entity Attribution:**\nPrimary classification identifies this wallet as associated with ${walletData.entity_attribution.name} (${walletData.entity_attribution.type}), with ${walletData.entity_attribution.confidence * 100}% confidence based on transaction pattern analysis.`;
    }

    // Add transaction intelligence
    fullExplanation += `\n\n**Transaction Intelligence:**\nAnalysis processed ${walletData.transaction_count} total transactions with last activity on ${walletData.last_activity}. Volume analysis shows patterns consistent with ${walletData.behavioral_classification?.primary_type || 'standard'} usage. Processing completed in ${walletData.processing_time_ms}ms using advanced blockchain forensics.`;

    setExplanation(fullExplanation);
    setIsExplaining(false);
    setIsExpanded(true);
  };

  return (
    <Card className="bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 border-blue-200 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900">AI Risk Intelligence</h3>
              <p className="text-sm text-blue-600 font-normal">Contextual analysis and insights</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!explanation && (
              <Button
                onClick={generateExplanation}
                disabled={isExplaining}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
              >
                {isExplaining ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Insights
                  </>
                )}
              </Button>
            )}
            {explanation && (
              <Button
                onClick={() => setIsExpanded(!isExpanded)}
                variant="ghost"
                size="sm"
                className="text-blue-700 hover:text-blue-800"
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
        {explanation && isExpanded ? (
          <div className="bg-white/90 backdrop-blur rounded-lg p-5 border border-blue-100 shadow-inner">
            <div className="prose prose-sm prose-slate max-w-none prose-headings:text-slate-800 prose-strong:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700">
              <ReactMarkdown>
                {explanation}
              </ReactMarkdown>
            </div>
          </div>
        ) : explanation && !isExpanded ? (
          <div className="bg-white/90 backdrop-blur rounded-lg p-4 border border-blue-100">
            <p className="text-sm text-slate-600 mb-2">AI analysis completed - click to expand detailed insights</p>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">Ready</span>
            </div>
          </div>
        ) : (
          <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
            <p className="text-blue-700 text-sm mb-2">
              <strong>Get AI-powered insights</strong> for this wallet analysis
            </p>
            <p className="text-blue-600 text-xs">
              Generate detailed, contextual explanations of risk factors, entity connections, and behavioral patterns in plain English.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
