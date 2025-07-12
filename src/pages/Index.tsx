import React, { useState, useEffect } from 'react';
import { Search, Shield, Zap, Eye, BarChart3, FileText, Users, Globe, TrendingUp, AlertTriangle, Building2, Database, History, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWalletAnalysis } from '@/hooks/useWalletAnalysis';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import WalletResults from '@/components/WalletResults';
import EnhancedWalletResults from '@/components/EnhancedWalletResults';
import TransactionFlow from '@/components/TransactionFlow';
import ReportGenerator from '@/components/ReportGenerator';
import { QuickStartDemo } from '@/components/QuickStartDemo';
import { InvestigationRecordsTable } from '@/components/InvestigationRecordsTable';
import { BulkAnalysis } from '@/components/BulkAnalysis';
import { UserDropdown } from '@/components/UserDropdown';
import { supabaseLookupRecords } from '@/services/supabaseLookupRecords';

const Index = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [showFlow, setShowFlow] = useState(false);
  const [activeTab, setActiveTab] = useState('lookup');
  const [stats, setStats] = useState<any>(null);
  const [recordData, setRecordData] = useState<any>(null);
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
    navigate('/');
  };

  const handleGenerateReport = async () => {
    const dataToUse = recordData || analysisData;
    if (dataToUse) {
      await generateReport(dataToUse.address);
    }
  };

  const handleTryDemo = (address: string) => {
    setWalletAddress(address);
    handleAnalyze();
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
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-primary mr-3" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                <span className="text-primary">Rìan</span>
              </h1>
            </div>
            <UserDropdown />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
            Advanced blockchain wallet intelligence with comprehensive risk assessment and forensic analysis
          </p>

          {/* Main Search */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Enter Bitcoin or Ethereum wallet address..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="text-lg py-6 px-6 dark:bg-slate-800 dark:border-slate-600"
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
              <Button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !walletAddress.trim()}
                className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover-lift"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Analyze Wallet
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <Card className="bg-white/80 backdrop-blur border-0 shadow-lg dark:bg-slate-800/80 hover:shadow-xl transition-all duration-300 hover-lift group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-200">
                  <Zap className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-lg mb-2 dark:text-slate-100">Lightning Fast Analysis</h3>
                <p className="text-slate-600 dark:text-slate-300">Real-time blockchain forensics with comprehensive transaction mapping</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur border-0 shadow-lg dark:bg-slate-800/80 hover:shadow-xl transition-all duration-300 hover-lift group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-200">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2 dark:text-slate-100">Advanced Risk Intelligence</h3>
                <p className="text-slate-600 dark:text-slate-300">Multi-layer risk assessment with entity attribution and behavioral analysis</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur border-0 shadow-lg dark:bg-slate-800/80 hover:shadow-xl transition-all duration-300 hover-lift group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-200">
                  <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2 dark:text-slate-100">Forensic Reporting</h3>
                <p className="text-slate-600 dark:text-slate-300">Detailed investigation reports with audit trails and compliance documentation</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content Tabs */}
      <section className="px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur dark:bg-slate-800/80">
              <TabsTrigger value="lookup" className="flex items-center">
                <Search className="w-4 h-4 mr-2" />
                Intelligence Lookup
              </TabsTrigger>
              <TabsTrigger value="bulk" className="flex items-center">
                <Upload className="w-4 h-4 mr-2" />
                Bulk Analysis
              </TabsTrigger>
              <TabsTrigger value="records" className="flex items-center">
                <Database className="w-4 h-4 mr-2" />
                Investigation Records
                {stats && stats.total_lookups > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {stats.total_lookups}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lookup" className="mt-6">
              <Card className="bg-white/90 backdrop-blur shadow-xl border-0 dark:bg-slate-800/90">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl">
                    <TrendingUp className="w-6 h-6 mr-3 text-primary" />
                    Comprehensive Wallet Intelligence
                  </CardTitle>
                  <p className="text-slate-600 dark:text-slate-300">
                    Deep blockchain forensics with transaction history, entity attribution, risk scoring, and behavioral analysis
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-3 p-4 bg-primary/5 rounded-lg">
                      <Building2 className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-medium dark:text-slate-100">Entity Attribution</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">Exchange, Mixer, DeFi, Custodial</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-accent/5 rounded-lg">
                      <BarChart3 className="w-8 h-8 text-accent" />
                      <div>
                        <p className="font-medium dark:text-slate-100">Transaction Intelligence</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">Volume, frequency, counterparties</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <Globe className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      <div>
                        <p className="font-medium dark:text-slate-100">Source & Destination</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">Fund flows and attribution</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                      <div>
                        <p className="font-medium dark:text-slate-100">Risk & Compliance</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">Sanctions, AML, fraud detection</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-slate-600 dark:text-slate-300 mb-4">
                      Enter a wallet address to begin comprehensive forensic analysis
                    </p>
                    <Badge variant="outline" className="text-accent border-accent/20">
                      Live blockchain data • AI-powered insights • Investigation ready
                    </Badge>
                  </div>
                </CardContent>
              </Card>
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
