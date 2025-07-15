
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserDropdown } from '@/components/UserDropdown';
import { WalletLookupPanel } from '@/components/WalletLookupPanel';
import { AnalystDashboard } from '@/components/AnalystDashboard';
import EnhancedWalletResults from '@/components/EnhancedWalletResults';
import { useWalletAnalysis } from '@/hooks/useWalletAnalysis';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { recordId } = useParams();
  const [walletAddress, setWalletAddress] = useState('');
  const { isAnalyzing, analysisData, analyzeWallet, generateReport, setAnalysisData } = useWalletAnalysis();
  const [isLoadingWalletData, setIsLoadingWalletData] = useState(false);
  const [recordNotFound, setRecordNotFound] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Handle analysis data changes and navigation
  useEffect(() => {
    if (analysisData && analysisData.recordId && !recordId) {
      // Navigate to the results page immediately when we have analysis data
      console.log('🚀 Navigating to results with recordId:', analysisData.recordId);
      navigate(`/record/${analysisData.recordId}`, { 
        state: { walletData: analysisData },
        replace: true
      });
    }
  }, [analysisData, recordId, navigate]);

  // Handle navigation state data and record loading
  useEffect(() => {
    if (recordId && user) {
      console.log('🔄 Loading data for record:', recordId);
      
      // Check if we have wallet data from navigation state first
      const navigationState = location.state as any;
      if (navigationState?.walletData) {
        console.log('📋 Loading wallet data from navigation state');
        setWalletData(navigationState.walletData);
        setRecordNotFound(false);
        return;
      }

      // If no navigation state data, try to load from database
      setIsLoadingWalletData(true);
      setRecordNotFound(false);
      
      const loadWalletData = async () => {
        try {
          const { supabaseLookupRecords } = await import('@/services/supabaseLookupRecords');
          const result = await supabaseLookupRecords.getLookupRecordById(recordId, user.id);
          
          if (result.success && result.record) {
            console.log('✅ Found record in database:', result.record);
            
            const loadedWalletData = {
              recordId: result.record.record_id,
              address: result.record.wallet_address,
              network: result.record.network,
              risk_score: result.record.risk_score,
              risk_level: result.record.risk_level,
              is_case: result.record.is_case,
              case_id: result.record.case_id,
              case_status: result.record.case_status,
              case_created_at: result.record.case_created_at,
              ...(result.record.analysis_data && 
                  typeof result.record.analysis_data === 'object' && 
                  result.record.analysis_data !== null 
                  ? result.record.analysis_data 
                  : {})
            };
            
            setWalletData(loadedWalletData);
            setRecordNotFound(false);
          } else {
            console.error('❌ Record not found in database:', result.error);
            setRecordNotFound(true);
          }
        } catch (error) {
          console.error('Failed to load wallet data:', error);
          setRecordNotFound(true);
        } finally {
          setIsLoadingWalletData(false);
        }
      };
      
      loadWalletData();
    }
  }, [recordId, user, location.state]);

  const handleAnalyze = async () => {
    if (!walletAddress.trim()) return;
    
    console.log('🚀 Starting analysis for:', walletAddress);
    await analyzeWallet(walletAddress);
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleViewFlow = () => {
    console.log('View transaction flow');
  };

  const handleGenerateReport = () => {
    generateReport(walletAddress);
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

  // If we have a recordId, show the appropriate state
  if (recordId) {
    if (isLoadingWalletData) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading record data...</p>
          </div>
        </div>
      );
    }

    if (recordNotFound || !walletData) {
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

    // Show the Enhanced Wallet Results with the loaded data
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
        {/* Top Row - Wallet Analysis Panel */}
        <div className="mb-8">
          <Card className="bg-white/90 backdrop-blur shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-primary" />
                Wallet Analysis - LIVE BLOCKCHAIN DATA
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

        {/* Main Dashboard Content */}
        <AnalystDashboard />
      </div>
    </div>
  );
};

export default Index;
