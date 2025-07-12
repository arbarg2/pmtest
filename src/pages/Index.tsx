
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { useWalletAnalysis } from '@/hooks/useWalletAnalysis';
import { supabaseLookupRecords } from '@/services/supabaseLookupRecords';
import { riskFactorsService } from '@/services/riskFactors';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, Upload, Database } from 'lucide-react';
import { UserDropdown } from '@/components/UserDropdown';
import { InvestigationRecordsTable } from '@/components/InvestigationRecordsTable';
import { BulkAnalysis } from '@/components/BulkAnalysis';
import EnhancedWalletResults from '@/components/EnhancedWalletResults';
import TransactionFlow from '@/components/TransactionFlow';
import DashboardHero from '@/components/DashboardHero';

const Index = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [showFlow, setShowFlow] = useState(false);
  const [activeTab, setActiveTab] = useState('lookup');
  const [stats, setStats] = useState<any>(null);
  const [recordData, setRecordData] = useState<any>(null);
  const [riskFactors, setRiskFactors] = useState<any[]>([]);
  const [sanctionsMatches, setSanctionsMatches] = useState<any[]>([]);
  const { isAnalyzing, analysisData, analyzeWallet, generateReport } = useWalletAnalysis();
  const { user, loading } = useAuth();
  const { recordId } = useParams();
  const navigate = useNavigate();

  // Fetch stats when user is available
  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  // Handle viewing specific record from URL
  useEffect(() => {
    if (recordId && user) {
      loadRecordData(recordId);
    }
  }, [recordId, user]);

  // Load risk factors and sanctions when analysis data changes
  useEffect(() => {
    if (analysisData?.recordId) {
      loadRiskFactors(analysisData.recordId);
      loadSanctionsScreening(analysisData.recordId);
    }
  }, [analysisData]);

  const fetchStats = async () => {
    try {
      const result = await supabaseLookupRecords.getLookupRecordStats(user?.id || '');
      if (result.success) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const loadRiskFactors = async (lookupRecordId: string) => {
    try {
      const factors = await riskFactorsService.getRiskFactors(lookupRecordId);
      setRiskFactors(factors);
    } catch (error) {
      console.error('Error loading risk factors:', error);
    }
  };

  const loadSanctionsScreening = async (lookupRecordId: string) => {
    try {
      const matches = await riskFactorsService.getSanctionsScreening(lookupRecordId);
      setSanctionsMatches(matches);
    } catch (error) {
      console.error('Error loading sanctions screening:', error);
    }
  };

  const loadRecordData = async (id: string) => {
    try {
      console.log('Loading record data for ID:', id);
      const result = await supabaseLookupRecords.getLookupRecordById(id, user?.id || '');
      
      if (result.success && result.record) {
        const record = result.record;
        console.log('Loaded record:', record);
        
        // Safely parse analysis_data
        let analysisData = {};
        try {
          if (typeof record.analysis_data === 'string') {
            analysisData = JSON.parse(record.analysis_data);
          } else if (typeof record.analysis_data === 'object' && record.analysis_data !== null) {
            analysisData = record.analysis_data;
          }
        } catch (parseError) {
          console.warn('Failed to parse analysis_data:', parseError);
          analysisData = {};
        }
        
        // Transform record data back to WalletRiskResponse format
        const fullWalletData = {
          address: record.wallet_address,
          network: record.network,
          risk_score: record.risk_score,
          risk_level: record.risk_level,
          processing_time_ms: (analysisData as any)?.processing_time_ms || 0,
          recordId: record.id,
          // Spread the analysis data safely
          ...(typeof analysisData === 'object' ? analysisData : {})
        };
        
        setRecordData(fullWalletData);
        
        // Load additional data for the record
        loadRiskFactors(record.id);
        loadSanctionsScreening(record.id);
      } else {
        console.error('Failed to load record:', result.error);
      }
    } catch (error) {
      console.error('Error loading record data:', error);
    }
  };

  const handleAnalyze = async () => {
    if (walletAddress.trim()) {
      await analyzeWallet(walletAddress.trim());
      await fetchStats(); // Refresh stats after analysis
    }
  };

  const handleViewFlow = () => {
    setShowFlow(true);
  };

  const handleBackToResults = () => {
    setShowFlow(false);
  };

  const handleBackToMain = () => {
    setRecordData(null);
    setShowFlow(false);
    setRiskFactors([]);
    setSanctionsMatches([]);
    navigate('/');
  };

  const handleGenerateReport = async () => {
    const dataToUse = recordData || analysisData;
    if (dataToUse) {
      await generateReport(dataToUse.address);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show record details if viewing specific record
  if (recordData && !showFlow) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <EnhancedWalletResults
          wallet={recordData}
          onBack={handleBackToMain}
          onViewFlow={handleViewFlow}
          onGenerateReport={handleGenerateReport}
          recordId={recordData.recordId}
          riskFactors={riskFactors}
          sanctionsMatches={sanctionsMatches}
        />
      </div>
    );
  }

  // If we have enhanced analysis data and not showing flow, show enhanced results
  if (analysisData && !showFlow) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <EnhancedWalletResults
          wallet={analysisData}
          onBack={() => window.location.reload()}
          onViewFlow={handleViewFlow}
          onGenerateReport={handleGenerateReport}
          recordId={analysisData.recordId}
          riskFactors={riskFactors}
          sanctionsMatches={sanctionsMatches}
        />
      </div>
    );
  }

  // If showing transaction flow
  if (showFlow && (analysisData || recordData)) {
    return (
      <TransactionFlow
        wallet={recordData || analysisData}
        onBack={handleBackToResults}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header with User Dropdown */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                <span className="text-primary">Rìan</span>
              </h1>
            </div>
            <UserDropdown />
          </div>
        </div>
      </header>

      {/* Hero Section with New Design */}
      <DashboardHero
        walletAddress={walletAddress}
        setWalletAddress={setWalletAddress}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
        userName={user?.email?.split('@')[0]}
        stats={stats}
      />

      {/* Main Content Tabs */}
      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full max-w-md grid-cols-3 bg-white/80 backdrop-blur dark:bg-slate-800/80 shadow-lg">
                <TabsTrigger value="lookup" className="flex items-center space-x-2">
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Intelligence</span>
                </TabsTrigger>
                <TabsTrigger value="bulk" className="flex items-center space-x-2">
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Bulk Analysis</span>
                </TabsTrigger>
                <TabsTrigger value="records" className="flex items-center space-x-2">
                  <Database className="w-4 h-4" />
                  <span className="hidden sm:inline">Records</span>
                  {stats && stats.total_lookups > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {stats.total_lookups}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="lookup" className="mt-6">
              <div className="text-center py-12">
                <div className="max-w-2xl mx-auto">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                    Ready for Analysis
                  </h3>
                  <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
                    Enter a wallet address above to begin comprehensive blockchain forensics analysis. 
                    Our AI will analyze 20+ risk factors including sanctions, mixers, and DeFi protocols.
                  </p>
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div className="p-4">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {stats?.total_lookups || 0}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Total Analyses
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="text-3xl font-bold text-accent mb-2">
                        {stats?.pending_review || 0}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Pending Review
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="text-3xl font-bold text-purple-600 mb-2">20+</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Risk Factors
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bulk" className="mt-6">
              <BulkAnalysis />
            </TabsContent>

            <TabsContent value="records" className="mt-6">
              <InvestigationRecordsTable />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default Index;
