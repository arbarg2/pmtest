
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
import { useWalletAnalysis } from '@/hooks/useWalletAnalysis';
import { supabaseLookupRecords } from '@/services/supabaseLookupRecords';
import { riskFactorsService, RiskFactor, SanctionsMatch } from '@/services/riskFactors';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { recordId } = useParams();
  const [walletAddress, setWalletAddress] = useState('');
  const { isAnalyzing, analyzeWallet, generateReport, analysisData } = useWalletAnalysis();
  const [isLoadingWalletData, setIsLoadingWalletData] = useState(false);
  const [recordNotFound, setRecordNotFound] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([]);
  const [sanctionsMatches, setSanctionsMatches] = useState<SanctionsMatch[]>([]);
  const [isLoadingRiskData, setIsLoadingRiskData] = useState(false);

  // Declare all handler functions before they are used
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

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (recordId && user) {
      console.log('🔄 Loading data for record:', recordId);

      setIsLoadingWalletData(true);
      setRecordNotFound(false);

      const loadWalletData = async () => {
        try {
          if (analysisData && analysisData.recordId === recordId && analysisData.isTemporary === true) {
            console.log('✅ Using temporary analysis data from current session');
            setWalletData(analysisData);
            setRecordNotFound(false);
            setIsLoadingWalletData(false);
            return;
          }

          const result = await supabaseLookupRecords.getLookupRecordById(recordId, user.id);

          if (result.success && result.record) {
            console.log('✅ Found record in database:', result.record);

            const loadedWalletData = {
              recordId: result.record.record_id || result.record.id,
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
  }, [recordId, user, analysisData]);

  // Fetch risk factors and sanctions data when wallet data is loaded
  useEffect(() => {
    if (walletData && recordId && user) {
      const fetchRiskData = async () => {
        setIsLoadingRiskData(true);
        console.log('🔄 Fetching risk factors and sanctions data for record:', recordId);

        try {
          // Fetch existing risk factors from database
          const existingRiskFactors = await riskFactorsService.getRiskFactors(recordId);
          console.log('📊 Existing risk factors:', existingRiskFactors);

          // If no risk factors exist, calculate and store them
          if (existingRiskFactors.length === 0) {
            console.log('💭 No existing risk factors, calculating new ones...');
            const calculatedFactors = await riskFactorsService.calculateAndStoreRiskFactors(recordId, walletData);
            setRiskFactors(calculatedFactors);
          } else {
            setRiskFactors(existingRiskFactors);
          }

          // Fetch existing sanctions screening from database
          const existingSanctions = await riskFactorsService.getSanctionsScreening(recordId);
          console.log('🛡️ Existing sanctions screening:', existingSanctions);

          // If no sanctions screening exists, perform new screening
          if (existingSanctions.length === 0) {
            console.log('🔍 No existing sanctions screening, performing new screening...');
            const sanctionsResults = await riskFactorsService.screenSanctions(
              walletData.address || walletData.wallet_address,
              walletData.network || 'bitcoin'
            );
            
            // Store sanctions results in database
            const storedSanctions = await riskFactorsService.storeSanctionsScreening(recordId, sanctionsResults);
            setSanctionsMatches(storedSanctions);
          } else {
            setSanctionsMatches(existingSanctions);
          }

        } catch (error) {
          console.error('❌ Failed to fetch risk data:', error);
          // Set empty arrays on error
          setRiskFactors([]);
          setSanctionsMatches([]);
        } finally {
          setIsLoadingRiskData(false);
        }
      };

      fetchRiskData();
    }
  }, [walletData, recordId, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
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
            <UserDropdown />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
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

        {/* Main Dashboard Content */}
        <AnalystDashboard />
      </div>
    </div>
  );
};

export default Index;

