
import React, { useState } from 'react';
import { Search, Shield, Zap, Eye, BarChart3, FileText, Users, Globe, TrendingUp, AlertTriangle, Building2, Database, History, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWalletAnalysis } from '@/hooks/useWalletAnalysis';
import WalletResults from '@/components/WalletResults';
import EnhancedWalletResults from '@/components/EnhancedWalletResults';
import TransactionFlow from '@/components/TransactionFlow';
import ReportGenerator from '@/components/ReportGenerator';
import { QuickStartDemo } from '@/components/QuickStartDemo';
import { LookupRecordsTable } from '@/components/LookupRecordsTable';
import { useLookupRecords } from '@/hooks/useLookupRecords';
import { BulkAnalysis } from '@/components/BulkAnalysis';

const Index = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [showFlow, setShowFlow] = useState(false);
  const [activeTab, setActiveTab] = useState('lookup');
  const { isAnalyzing, analysisData, analyzeWallet, generateReport } = useWalletAnalysis();
  const { stats } = useLookupRecords();

  const handleAnalyze = async () => {
    if (walletAddress.trim()) {
      await analyzeWallet(walletAddress.trim());
    }
  };

  const handleViewFlow = () => {
    setShowFlow(true);
  };

  const handleBackToResults = () => {
    setShowFlow(false);
  };

  const handleGenerateReport = async () => {
    if (analysisData) {
      await generateReport(analysisData.address);
    }
  };

  const handleTryDemo = (address: string) => {
    setWalletAddress(address);
    handleAnalyze();
  };

  // If we have enhanced analysis data and not showing flow, show enhanced results
  if (analysisData && !showFlow) {
    return (
      <EnhancedWalletResults
        wallet={analysisData}
        onBack={() => window.location.reload()}
        onViewFlow={handleViewFlow}
        onGenerateReport={handleGenerateReport}
      />
    );
  }

  // If showing transaction flow
  if (showFlow && analysisData) {
    return (
      <TransactionFlow
        wallet={analysisData}
        onBack={handleBackToResults}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <Shield className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900">
              <span className="text-blue-600">Rìan</span>
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Advanced blockchain wallet intelligence with comprehensive risk assessment and forensic analysis
          </p>

          {/* Main Search */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Enter Bitcoin or Ethereum wallet address..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="text-lg py-6 px-6"
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
              <Button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !walletAddress.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg font-semibold"
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
            <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Lightning Fast Analysis</h3>
                <p className="text-slate-600">Real-time blockchain forensics with comprehensive transaction mapping</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Advanced Risk Intelligence</h3>
                <p className="text-slate-600">Multi-layer risk assessment with entity attribution and behavioral analysis</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Forensic Reporting</h3>
                <p className="text-slate-600">Detailed investigation reports with audit trails and compliance documentation</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content Tabs */}
      <section className="px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur">
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
                {stats && stats.total > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {stats.total}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="demo" className="flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                Live Demo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lookup" className="mt-6">
              <Card className="bg-white/90 backdrop-blur shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl">
                    <TrendingUp className="w-6 h-6 mr-3 text-blue-600" />
                    Comprehensive Wallet Intelligence
                  </CardTitle>
                  <p className="text-slate-600">
                    Deep blockchain forensics with transaction history, entity attribution, risk scoring, and behavioral analysis
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                      <Building2 className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="font-medium">Entity Attribution</p>
                        <p className="text-sm text-slate-600">Exchange, Mixer, DeFi, Custodial</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                      <BarChart3 className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="font-medium">Transaction Intelligence</p>
                        <p className="text-sm text-slate-600">Volume, frequency, counterparties</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
                      <Globe className="w-8 h-8 text-purple-600" />
                      <div>
                        <p className="font-medium">Source & Destination</p>
                        <p className="text-sm text-slate-600">Fund flows and attribution</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg">
                      <AlertTriangle className="w-8 h-8 text-red-600" />
                      <div>
                        <p className="font-medium">Risk & Compliance</p>
                        <p className="text-sm text-slate-600">Sanctions, AML, fraud detection</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-slate-600 mb-4">
                      Enter a wallet address to begin comprehensive forensic analysis
                    </p>
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
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
              <Card className="bg-white/90 backdrop-blur shadow-xl border-0 mb-4">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <History className="w-6 h-6 mr-3 text-blue-600" />
                      Investigation Records
                    </div>
                    {stats && (
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline" className="text-green-600">
                          {stats.total || 0} Total Records
                        </Badge>
                        {stats.pending_review > 0 && (
                          <Badge variant="outline" className="text-yellow-600">
                            {stats.pending_review} Pending Review
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardTitle>
                  <p className="text-slate-600">
                    All wallet analyses are automatically stored with timestamps and forensic data for audit trails and investigation continuity
                  </p>
                </CardHeader>
              </Card>
              <LookupRecordsTable />
            </TabsContent>

            <TabsContent value="demo" className="mt-6">
              <QuickStartDemo onTryDemo={handleTryDemo} />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default Index;
