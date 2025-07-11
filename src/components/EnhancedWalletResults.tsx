
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalystNotesPanel } from './AnalystNotesPanel';
import { WalletRiskResponse } from '@/services/api';
import { TransactionGraph } from './TransactionGraph';
import { WalletHeader } from './wallet/WalletHeader';
import { WalletOverviewTab } from './wallet/WalletOverviewTab';
import { WalletRiskFactorsTab } from './wallet/WalletRiskFactorsTab';
import { WalletDetailTabs } from './wallet/WalletDetailTabs';

interface EnhancedWalletResultsProps {
  wallet: WalletRiskResponse;
  onBack: () => void;
  onViewFlow: () => void;
  onGenerateReport: () => void;
}

const EnhancedWalletResults = ({ wallet, onBack, onViewFlow, onGenerateReport }: EnhancedWalletResultsProps) => {
  const [currentTab, setCurrentTab] = useState('overview');
  const currentLookupRecord = 'your_lookup_record_id';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <WalletHeader 
        wallet={wallet}
        onBack={onBack}
        onViewFlow={onViewFlow}
        onGenerateReport={onGenerateReport}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="mb-8">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="riskFactors">Risk Factors</TabsTrigger>
            <TabsTrigger value="entityAttribution">Entity Attribution</TabsTrigger>
            <TabsTrigger value="volumeMetrics">Volume Metrics</TabsTrigger>
            <TabsTrigger value="geographicRisk">Geographic Risk</TabsTrigger>
            <TabsTrigger value="temporalPatterns">Temporal Patterns</TabsTrigger>
            <TabsTrigger value="transactionGraph">Transaction Graph</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <WalletOverviewTab wallet={wallet} />
          </TabsContent>

          <TabsContent value="riskFactors">
            <WalletRiskFactorsTab wallet={wallet} />
          </TabsContent>

          <TabsContent value="entityAttribution">
            <WalletDetailTabs wallet={wallet} activeTab="entityAttribution" />
          </TabsContent>

          <TabsContent value="volumeMetrics">
            <WalletDetailTabs wallet={wallet} activeTab="volumeMetrics" />
          </TabsContent>

          <TabsContent value="geographicRisk">
            <WalletDetailTabs wallet={wallet} activeTab="geographicRisk" />
          </TabsContent>

          <TabsContent value="temporalPatterns">
            <WalletDetailTabs wallet={wallet} activeTab="temporalPatterns" />
          </TabsContent>

          <TabsContent value="transactionGraph">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Graph</CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionGraph address={wallet.address} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Analyst Notes Panel at the end */}
        <AnalystNotesPanel 
          recordId={currentLookupRecord || `temp_${Date.now()}`}
          onUpdate={() => {
            // Refresh any necessary data
            console.log('Analyst notes updated');
          }}
        />
      </div>
    </div>
  );
};

export default EnhancedWalletResults;
