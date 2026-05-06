import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserDropdown } from '@/components/UserDropdown';
import { WalletLookupPanel } from '@/components/WalletLookupPanel';
import { AnalystDashboard } from '@/components/AnalystDashboard';
import EnhancedWalletResults from '@/components/EnhancedWalletResults';
import AlertsBell from '@/components/alerts/AlertsBell';
import OrgPulse from '@/components/dashboard/OrgPulse';
import ClusterView from '@/components/dashboard/ClusterView';
import { useWalletAnalysis } from '@/hooks/useWalletAnalysis';
import { supabaseLookupRecords } from '@/services/supabaseLookupRecords';
import { riskFactorsService } from '@/services/riskFactors';
import { useDemoContext } from '@/contexts/DemoContext';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { recordId } = useParams();
  const [walletAddress, setWalletAddress] = useState('');
  const isDemo = searchParams.get('demo') === 'true';
  const { demoData } = useDemoContext();
  const { isAnalyzing, analyzeWallet, generateReport, analysisData } = useWalletAnalysis();
  const [isLoadingWalletData, setIsLoadingWalletData] = useState(false);
  const [recordNotFound, setRecordNotFound] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);
  const [riskFactors, setRiskFactors] = useState([]);
  const [sanctionsMatches, setSanctionsMatches] = useState([]);

  useEffect(() => {
    // Only redirect to auth if not viewing a specific record and not in demo mode
    if (!loading && !user && !recordId && !isDemo) {
      navigate('/auth');
    }
  }, [user, loading, navigate, recordId, isDemo]);

  // Handle demo address from landing page
  useEffect(() => {
    if (location.state?.demoAddress) {
      setWalletAddress(location.state.demoAddress);
      // Clear the state to prevent re-triggering
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    if (recordId && (user || isDemo)) {
      console.log('🔄 Loading data for record:', recordId, 'Demo mode:', isDemo);

      setIsLoadingWalletData(true);
      setRecordNotFound(false);

          const loadWalletData = async () => {
        try {
          // For demo records, check if it's in demoData first
          if (isDemo && demoData && demoData.recordId === recordId) {
            console.log('✅ Using demo analysis data from demo context');
            setWalletData(demoData);
            setRecordNotFound(false);
            setIsLoadingWalletData(false);
            return;
          }

          if (analysisData && analysisData.recordId === recordId && analysisData.isTemporary === true) {
            console.log('✅ Using temporary analysis data from current session');
            setWalletData(analysisData);
            setRecordNotFound(false);
            setIsLoadingWalletData(false);
            return;
          }

          // Skip database lookup for demo records
          if (isDemo) {
            console.log('❌ Demo record not found in session data');
            setRecordNotFound(true);
            setIsLoadingWalletData(false);
            return;
          }

          const result = await supabaseLookupRecords.getLookupRecordById(recordId, user.id);

          if (result.success && result.record) {
            console.log('✅ Found record in database:', result.record);

            const loadedWalletData = {
              ...(result.record.analysis_data &&
                typeof result.record.analysis_data === 'object' &&
                result.record.analysis_data !== null
                ? result.record.analysis_data
                : {}),
              recordId: result.record.record_id || result.record.id,
              address: result.record.wallet_address,
              network: result.record.network,
              risk_score: result.record.risk_score,
              risk_level: result.record.risk_level,
              is_case: result.record.is_case,
              case_id: result.record.case_id,
              case_status: result.record.case_status,
              case_created_at: result.record.case_created_at,
            };
            setWalletData(loadedWalletData);
            setRecordNotFound(false);

            // Fetch risk factors data
            try {
              console.log('🔍 Fetching risk factors for record:', result.record.id);
              const fetchedFactors = await riskFactorsService.getRiskFactors(result.record.id);
              console.log('✅ Risk factors fetched:', fetchedFactors);
              setRiskFactors(fetchedFactors);
            } catch (error) {
              console.error('❌ Failed to fetch risk factors:', error);
              setRiskFactors([]);
            }

            // Fetch sanctions screening data
            try {
              console.log('🔍 Fetching sanctions screening for record:', result.record.id);
              const fetchedSanctions = await riskFactorsService.getSanctionsScreening(result.record.id);
              console.log('✅ Sanctions screening fetched:', fetchedSanctions);
              setSanctionsMatches(fetchedSanctions);
            } catch (error) {
              console.error('❌ Failed to fetch sanctions screening:', error);
              setSanctionsMatches([]);
            }
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
  }, [recordId, user, analysisData, isDemo, demoData]);

  const handleAnalyze = async () => {
    if (!walletAddress.trim()) return;

    console.log('🚀 Starting analysis for:', walletAddress);
    try {
      const result = await analyzeWallet(walletAddress);
      if (result && result.recordId) {
        console.log('🚀 Navigating to results with recordId:', result.recordId);
        navigate(`/record/${result.recordId}`, { replace: true });
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user && !isDemo) {
    return null;
  }

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
              {isDemo ? 'Demo Record Not Found' : 'Record Not Found'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              {isDemo 
                ? 'The demo session has expired. Please try the demo again from the landing page.'
                : `Could not load wallet data for record ID: ${recordId}`
              }
            </p>
            <Button onClick={isDemo ? () => navigate('/') : handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isDemo ? 'Back to Landing' : 'Back to Dashboard'}
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
        riskFactors={riskFactors}
        sanctionsMatches={sanctionsMatches}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
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
            <div className="flex items-center gap-1">
              <AlertsBell />
              <UserDropdown />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Org Pulse */}
        <div className="mb-8">
          <OrgPulse />
        </div>

        {/* Top Row - Wallet Analysis Panel */}
        <div className="mb-10">
          <div className="mb-4 text-sm text-slate-600 dark:text-slate-400 uppercase tracking-wide font-medium">
            Investigate a Wallet Address
          </div>
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-xl border border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200">
                <Shield className="w-5 h-5 text-primary" />
                Wallet Intelligence Lookup
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">
                  Live
                </span>
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

        {/* Cross-Wallet Cluster View */}
        <div className="mb-10">
          <ClusterView />
        </div>

        {/* Main Dashboard Content */}
        <AnalystDashboard />
      </div>
    </div>
  );
};

export default Index;
