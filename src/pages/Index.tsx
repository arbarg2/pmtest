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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-2 border-neon-cyan/20" />
          <div className="absolute inset-0 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
          <div className="absolute inset-0 rounded-full bg-neon-cyan/20 blur-xl animate-glow-pulse" />
        </div>
      </div>
    );
  }

  if (!user && !isDemo) {
    return null;
  }

  if (recordId) {
    if (isLoadingWalletData) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-14 h-14 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-2 border-neon-cyan/20" />
              <div className="absolute inset-0 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
              <div className="absolute inset-0 rounded-full bg-neon-cyan/20 blur-xl animate-glow-pulse" />
            </div>
            <p className="text-muted-foreground text-sm">Loading record data…</p>
          </div>
        </div>
      );
    }

    if (recordNotFound || !walletData) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <Card className="max-w-md p-8 text-center bg-card/60 backdrop-blur-xl border-border/50">
            <h2 className="text-xl font-semibold mb-2">
              {isDemo ? 'Demo Record Not Found' : 'Record Not Found'}
            </h2>
            <p className="text-muted-foreground text-sm mb-5">
              {isDemo 
                ? 'The demo session has expired. Please try the demo again from the landing page.'
                : `Could not load wallet data for record ID: ${recordId}`
              }
            </p>
            <Button onClick={isDemo ? () => navigate('/') : handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isDemo ? 'Back to Landing' : 'Back to Dashboard'}
            </Button>
          </Card>
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Aurora background */}
      <div className="absolute inset-0 bg-mesh opacity-40 pointer-events-none" />
      <div className="absolute top-0 -left-32 w-96 h-96 rounded-full bg-neon-cyan/10 blur-3xl animate-float pointer-events-none" />
      <div className="absolute top-32 -right-32 w-96 h-96 rounded-full bg-neon-violet/10 blur-3xl animate-float pointer-events-none" style={{ animationDelay: '2s' }} />

      <div className="relative">
        <header className="border-b border-border/50 bg-background/70 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Shield className="w-7 h-7 text-primary" />
                  <div className="absolute inset-0 bg-neon-cyan/30 blur-xl -z-10 animate-glow-pulse" />
                </div>
                <div className="leading-tight">
                  <h1 className="text-lg font-bold tracking-tight">
                    <span className="text-aurora">Rìan</span> Intelligence
                  </h1>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-widest">
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
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">
                Investigate a Wallet Address
              </div>
              <span className="text-[10px] uppercase tracking-widest text-neon-lime flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-lime opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-neon-lime" />
                </span>
                Live
              </span>
            </div>
            <div className="relative group">
              <div className="absolute -inset-px bg-gradient-to-r from-neon-cyan/40 via-neon-violet/40 to-neon-magenta/40 rounded-lg opacity-30 blur-md group-focus-within:opacity-60 transition-opacity -z-10" />
              <Card className="bg-card/80 backdrop-blur-xl border-border/60 shadow-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Shield className="w-4 h-4 text-neon-cyan" />
                    Wallet Intelligence Lookup
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
          </div>

          {/* Cross-Wallet Cluster View */}
          <div className="mb-10">
            <ClusterView />
          </div>

          {/* Main Dashboard Content */}
          <AnalystDashboard />
        </div>
      </div>
    </div>
  );
};

export default Index;
