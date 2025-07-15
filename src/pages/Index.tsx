
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

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { recordId } = useParams();
  const [walletAddress, setWalletAddress] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleAnalyze = async () => {
    if (!walletAddress.trim()) return;
    
    setIsAnalyzing(true);
    try {
      // TODO: Implement wallet analysis logic here
      console.log('Analyzing wallet:', walletAddress);
      // For now, just simulate the analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center">
                  <Shield className="w-6 h-6 mr-3 text-primary" />
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      <span className="text-blue-600 dark:text-blue-400">Rìan</span> Analysis
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Investigation Record: {recordId}
                    </p>
                  </div>
                </div>
              </div>
              <UserDropdown />
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <EnhancedWalletResults recordId={recordId} />
        </div>
      </div>
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
