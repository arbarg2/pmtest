
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabaseLookupRecords } from '@/services/supabaseLookupRecords';
import { TransactionGraph } from '@/components/TransactionGraph';

const WalletTransactionFlow = () => {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [walletData, setWalletData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !recordId) {
      navigate('/auth');
      return;
    }

    const loadWalletData = async () => {
      try {
        setIsLoading(true);
        const result = await supabaseLookupRecords.getLookupRecordById(recordId, user.id);
        
        if (result.success && result.record) {
          setWalletData(result.record);
        } else {
          setError('Wallet record not found');
        }
      } catch (err) {
        console.error('Failed to load wallet data:', err);
        setError('Failed to load wallet data');
      } finally {
        setIsLoading(false);
      }
    };

    loadWalletData();
  }, [recordId, user, navigate]);

  const handleBack = () => {
    navigate(`/record/${recordId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !walletData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Error Loading Wallet
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            {error || 'Wallet data not found'}
          </p>
          <Button onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={handleBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Transaction Flow Analysis
                </h1>
                <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                  <span>Record ID: {recordId}</span>
                  <span>•</span>
                  <span>Interactive network visualization</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <TransactionGraph 
          address={walletData.wallet_address || walletData.address} 
          wallet={walletData}
        />
      </div>
    </div>
  );
};

export default WalletTransactionFlow;
