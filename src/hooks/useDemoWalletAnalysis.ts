import { useState } from 'react';
import { toast } from 'sonner';
import { enhancedWalletAPI } from '@/services/enhancedApi';
import { WalletRiskResponse } from '@/services/api';
import { getAnalysisToastMessages, getErrorToastMessages } from '@/services/walletAnalysisNotifications';
import { useDemoContext } from '@/contexts/DemoContext';

export const useDemoWalletAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<WalletRiskResponse | null>(null);
  const { setDemoData } = useDemoContext();

  const analyzeDemoWallet = async (walletAddress: string, network: string = 'bitcoin') => {
    setIsAnalyzing(true);
    
    try {
      console.log('🚀 Starting DEMO wallet analysis for:', walletAddress);
      
      // Perform the wallet analysis without authentication
      const result = await enhancedWalletAPI.analyzeWallet(walletAddress);
      
      if (!result) {
        throw new Error('No analysis result received');
      }

      console.log('✅ Demo analysis completed:', result);

      // Create a demo record ID for session (no database storage)
      const demoRecordId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const demoResult = {
        ...result,
        recordId: demoRecordId,
        isDemo: true,
        isTemporary: true
      };
      
      setAnalysisData(demoResult);
      setDemoData(demoResult); // Store in global demo context
      
      // Show success message with demo indicator
      const { title, description } = getAnalysisToastMessages(result);
      toast.success(`${title} (Demo Mode)`, { description });
      
      return demoResult;
    } catch (error) {
      console.error('❌ Demo wallet analysis failed:', error);
      const { errorTitle, errorMessage } = getErrorToastMessages(error as Error);
      toast.error(`${errorTitle} (Demo Mode)`, { description: errorMessage });
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    isAnalyzing,
    analyzeDemoWallet,
    analysisData
  };
};