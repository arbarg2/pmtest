
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeft, Upload, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserDropdown } from '@/components/UserDropdown';
import { Textarea } from '@/components/ui/textarea';

const BulkAnalysis = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [walletList, setWalletList] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleBulkAnalysis = async () => {
    const wallets = walletList.split('\n').filter(w => w.trim());
    if (wallets.length === 0) return;
    
    setIsAnalyzing(true);
    // TODO: Implement bulk analysis logic
    setTimeout(() => {
      setIsAnalyzing(false);
      console.log('Bulk analysis completed for', wallets.length, 'wallets');
    }, 3000);
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center">
                <Shield className="w-6 h-6 mr-3 text-primary" />
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Bulk Analysis
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Analyze multiple wallets simultaneously
                  </p>
                </div>
              </div>
            </div>
            <UserDropdown />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="bg-white/90 backdrop-blur shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSpreadsheet className="w-5 h-5 mr-2 text-primary" />
              Bulk Wallet Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Wallet Addresses (one per line)
              </label>
              <Textarea
                placeholder="Enter wallet addresses, one per line..."
                value={walletList}
                onChange={(e) => setWalletList(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
                disabled={isAnalyzing}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">
                {walletList.split('\n').filter(w => w.trim()).length} wallets ready for analysis
              </div>
              <Button 
                onClick={handleBulkAnalysis}
                disabled={isAnalyzing || !walletList.trim()}
                className="bg-primary hover:bg-primary/90"
              >
                {isAnalyzing ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Upload className="w-4 h-4" />
                    <span>Start Analysis</span>
                  </div>
                )}
              </Button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                Supported Formats
              </h3>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li>• Bitcoin addresses (P2PKH, P2SH, Bech32)</li>
                <li>• Ethereum addresses (0x format)</li>
                <li>• One address per line</li>
                <li>• Maximum 100 addresses per batch</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BulkAnalysis;
