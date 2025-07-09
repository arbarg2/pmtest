
import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WalletRiskResponse } from '@/services/api';

interface AIExplainerProps {
  walletData: WalletRiskResponse;
}

export function AIExplainer({ walletData }: AIExplainerProps) {
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const generateExplanation = async () => {
    setIsExplaining(true);
    
    // Simulate AI explanation generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const explanations = {
      Low: `This wallet appears to be operating normally. It primarily interacts with reputable exchanges and services, maintains consistent transaction patterns, and shows no connections to sanctioned addresses. The transaction history suggests legitimate use cases such as regular trading or long-term holding.`,
      Medium: `This wallet shows some elevated risk indicators that warrant attention. While not definitively malicious, it has some exposure to higher-risk addresses or unusual transaction patterns. Enhanced due diligence is recommended - this could be a legitimate user with some risky connections, or early signs of concerning activity.`,
      High: `This wallet exhibits multiple red flags that suggest significant risk. It may have direct or indirect connections to sanctioned addresses, known fraud schemes, or suspicious transaction patterns typical of money laundering or other illicit activities. Immediate manual review is strongly recommended before any business relationship.`
    };

    const riskSpecificFactors = [];
    if (walletData.risk_factors.sanctioned) {
      riskSpecificFactors.push("• Direct or indirect connection to OFAC sanctioned addresses");
    }
    if (walletData.risk_factors.fraud_reports) {
      riskSpecificFactors.push("• Address appears in fraud or scam reports");
    }
    if (walletData.risk_factors.dark_market_exposure) {
      riskSpecificFactors.push("• Potential connection to darknet marketplace activity");
    }
    if (walletData.risk_factors.mixer_usage) {
      riskSpecificFactors.push("• Usage of cryptocurrency mixers or privacy tools");
    }
    if (walletData.risk_factors.high_frequency_trading) {
      riskSpecificFactors.push("• Unusual high-frequency transaction patterns");
    }

    let fullExplanation = explanations[walletData.risk_level];
    
    if (riskSpecificFactors.length > 0) {
      fullExplanation += `\n\nSpecific risk factors identified:\n${riskSpecificFactors.join('\n')}`;
    }

    fullExplanation += `\n\nThis analysis processed ${walletData.transaction_count} transactions and completed in ${walletData.processing_time_ms}ms.`;

    setExplanation(fullExplanation);
    setIsExplaining(false);
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">AI Explanation</h3>
          </div>
          <Button
            onClick={generateExplanation}
            disabled={isExplaining}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isExplaining ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Explain This
              </>
            )}
          </Button>
        </div>
        
        {explanation ? (
          <div className="bg-white/80 rounded-lg p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {explanation}
          </div>
        ) : (
          <p className="text-blue-600 text-sm">
            Click "Explain This" to get a detailed, plain-English explanation of this wallet's risk assessment.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
