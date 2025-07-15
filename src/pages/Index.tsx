
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserDropdown } from '@/components/UserDropdown';
import { WalletLookupPanel } from '@/components/WalletLookupPanel';
import { AnalystDashboard } from '@/components/AnalystDashboard';
import EnhancedWalletResults from '@/components/EnhancedWalletResults';
import { analyzeWalletRisk, WalletRiskResponse } from '@/services/api';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { recordId } = useParams();
  const [walletAddress, setWalletAddress] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [walletData, setWalletData] = useState<WalletRiskResponse | null>(null);
  const [isLoadingWalletData, setIsLoadingWalletData] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Load wallet data when recordId is present
  useEffect(() => {
    if (recordId && user) {
      setIsLoadingWalletData(true);
      // In a real app, you would fetch the wallet data from the database using the recordId
      // For now, we'll simulate this by generating mock data
      const loadWalletData = async () => {
        try {
          // This is a placeholder - in reality you'd fetch from your database
          const mockWallet = await analyzeWalletRisk('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
          mockWallet.recordId = recordId;
          setWalletData(mockWallet);
        } catch (error) {
          console.error('Failed to load wallet data:', error);
        } finally {
          setIsLoadingWalletData(false);
        }
      };
      loadWalletData();
    }
  }, [recordId, user]);

  const handleAnalyze = async () => {
    if (!walletAddress.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const result = await analyzeWalletRisk(walletAddress);
      // Navigate to results page with the analysis
      navigate(`/record/${result.recordId || 'new'}`);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleViewFlow = () => {
    // TODO: Implement transaction flow view
    console.log('View transaction flow');
  };

  const handleGenerateReport = () => {
    // TODO: Implement report generation
    console.log('Generate report');
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    return null;
  }

  // If we have a recordId, show the wallet results
  if (recordId) {
    if (isLoadingWalletData) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!walletData) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Record Not Found
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Could not load wallet data for record ID: {recordId}
            </p>
            <Button onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return (
      <EnhancedWalletResults
        wallet={walletData}
        onBack={handleBack}
        onViewFlow={handleViewFlow}
        onGenerateReport={handleGenerateReport}
        recordId={recordId}
      />
    );
  }

  // Main dashboard view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="w-6 h-6 mr-3 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  <span className="text-blue-600 dark:text-blue-400">Rìan</span> Intelligence
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Blockchain Investigation Platform
                </p>
              </div>
            </div>
            <UserDropdown />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Wallet Lookup Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-white/90 backdrop-blur shadow-lg border-0 sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-primary" />
                  Wallet Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WalletLookupPanel
                  walletAddress={walletAddress}
                  setWalletAddress={setWalletAddress}
                  onAnalyze={handleAnalyze}
                  isAnalyzing={isAnalyzing}
                />
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard */}
          <div className="lg:col-span-2">
            <AnalystDashboard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
