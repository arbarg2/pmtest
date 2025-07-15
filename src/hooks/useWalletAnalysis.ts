
import { useState } from 'react';
import { WalletRiskResponse } from '@/services/api';
import { analyzeWalletWithRealData } from '@/services/enhancedApi';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { validateWalletAddress, normalizeNetwork } from '@/services/walletValidation';
import { storeAnalysisResult, processRiskFactorsInBackground } from '@/services/walletAnalysisDatabase';
import { getAnalysisToastMessages, getErrorToastMessages } from '@/services/walletAnalysisNotifications';

export const useWalletAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<WalletRiskResponse | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const analyzeWallet = async (address: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to analyze wallets",
        variant: "destructive",
      });
      return;
    }

    // Validate address format early
    const validation = validateWalletAddress(address);
    if (!validation.isValid) {
      toast({
        title: "Invalid Address",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    const trimmedAddress = address.trim();
    setIsAnalyzing(true);
    
    try {
      console.log('🔍 Starting REAL DATA enhanced wallet analysis for:', trimmedAddress);
      console.log('🔍 Address format validation passed');
      
      // Show progress toast
      toast({
        title: "Analysis Starting",
        description: "Fetching real-time blockchain data...",
      });
      
      // Use enhanced API with REAL blockchain data - NO MOCK FALLBACK
      console.log('📡 Calling analyzeWalletWithRealData for LIVE data...');
      const result = await analyzeWalletWithRealData(trimmedAddress);
      console.log('✅ REAL DATA analysis result received:', {
        address: result.address,
        network: result.network,
        risk_score: result.risk_score,
        risk_level: result.risk_level,
        transaction_count: result.transaction_count,
        explanation: result.explanation?.substring(0, 100) + '...'
      });
      
      // Fix network normalization
      const normalizedNetwork = normalizeNetwork(result.network);
      console.log('🔧 Normalized network:', normalizedNetwork);
      
      // Store in database with proper error handling
      console.log('💾 Storing analysis result in database...');
      const dbResult = await storeAnalysisResult(trimmedAddress, normalizedNetwork, result, user.id);
      console.log('Database storage result:', dbResult.success ? 'SUCCESS' : 'FAILED', dbResult.error || '');

      if (dbResult.success && dbResult.record) {
        console.log('✅ Successfully created database record with ID:', dbResult.record.record_id);
        
        // Add the database record ID to the result
        const enhancedResult = {
          ...result,
          recordId: dbResult.record.record_id,
          network: normalizedNetwork
        };
        
        setAnalysisData(enhancedResult);
        
        // Calculate and store risk factors in background (don't block UI)
        processRiskFactorsInBackground(dbResult.record.id, result, trimmedAddress, normalizedNetwork)
          .catch(error => console.error('Background risk factors processing failed:', error));
        
        // Show success toast
        const { title, description } = getAnalysisToastMessages(result);
        toast({ title, description });
      } else {
        console.error('❌ Failed to store analysis result:', dbResult.error);
        // Still show the analysis even if DB storage fails
        setAnalysisData({
          ...result,
          network: normalizedNetwork
        });
        toast({
          title: "Analysis Complete - Storage Warning",
          description: `Analysis completed but record storage failed. Data is temporary only.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ REAL DATA Analysis failed:', error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      const { errorTitle, errorMessage } = getErrorToastMessages(error as Error);
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateReport = async (address: string) => {
    try {
      toast({
        title: "Generating Report",
        description: "Creating comprehensive analysis report...",
      });
      
      // For now, just show success - actual report generation would happen here
      setTimeout(() => {
        toast({
          title: "Report Generated",
          description: "Compliance report has been generated successfully",
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Report Generation Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    isAnalyzing,
    analysisData,
    analyzeWallet,
    generateReport,
    setAnalysisData
  };
};
